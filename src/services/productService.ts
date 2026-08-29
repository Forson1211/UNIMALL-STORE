import { supabase } from "@/integrations/supabase/client";
import { withRetry } from "@/lib/dbUtils";
import { unpackProductMetadata } from "./vendorService";

export interface StorefrontProduct {
    id: string;
    name: string;
    description: string;
    price: number;
    original_price: number | null;
    category: string;
    image: string;
    image_url?: string;
    images?: string[];
    gallery?: string[];
    features?: string[];
    created_at: string;
    vendor: string;
    vendor_id: string;
    vendor_phone?: string;
    vendor_verified?: boolean;
    is_featured?: boolean;
    is_pro?: boolean;
    status: string | boolean;
    stock: number;
    rating: number;
    reviews: number;
    same_day_delivery?: boolean;
    is_negotiable?: boolean;
    highlight?: string;
}

const CACHE_KEY = "unimall_products_v5_real";
const CACHE_TIMESTAMP_KEY = "unimall_products_cache_ts_v5";

// Purge legacy dummy caches on initialization
try {
    localStorage.removeItem("unimall_products_cache_v1");
    localStorage.removeItem("unimall_products_cache");
    localStorage.removeItem("unimall_products");
    localStorage.removeItem("unimall_cached_products");
} catch (e) {}

// Comprehensive list of dummy mock names to purge permanently
const DUMMY_JUNK_KEYWORDS = [
    "watch 4 pro", "powermax", "campuspro", "thermolock",
    "heatgrip", "multicut", "watch strap", "air cushion",
    "megacarry", "freshflush", "spacebuds", "ripplestep",
    "nasaag", "ff", "iphone 15 for sale", "forson odonkor"
];

// ── In-Memory Cache (survives within session, faster than localStorage) ──
let memoryCache: StorefrontProduct[] | null = null;
let memoryCacheTimestamp = 0;
const MEMORY_CACHE_TTL = 30_000; // 30 seconds

// ── Vendor Profile Cache (in-memory for entire session) ──
let vendorProfileCache: Map<string, any> | null = null;
let profileCacheTimestamp = 0;
const PROFILE_CACHE_TTL = 120_000; // 2 minutes

// Trusted store names for vendor assignment
const KNOWN_STORES = [
    "Unimall Store", "TechHub", "StyleCo", "BookWorm", "oraimo home", "StudyMart",
    "Kicks & Drips Campus", "StyleCo Boutique", "TechHub Electronics",
    "Campus Achievers Hub", "Campus Glamour Hub", "iStore Ghana Campus",
    "UniWear Apparel", "Legon Gadget Hub"
];

const STORE_OPTIONS = [
    "TechHub Electronics", "Kicks & Drips Campus", "StyleCo Boutique",
    "Campus Glamour Hub", "iStore Ghana Campus", "oraimo home",
    "UniWear Apparel", "Legon Gadget Hub"
];

function assignVendorInfo(productsList: StorefrontProduct[], profileMap: Map<string, any>) {
    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str || "");

    productsList.forEach((p: any) => {
        const existing = (p.vendor || (p as any).vendor_name || (p as any).store_name || "").trim();
        let assignedStore = "";
        let isVerified = false;

        // 1. Check real profile from DB or localStorage map
        if (p.vendor_id && profileMap.has(p.vendor_id)) {
            const prof = profileMap.get(p.vendor_id);
            const realName = (prof.store_name || prof.full_name || "").trim();
            if (realName && !isUUID(realName) && realName !== "Unimall Store" && realName !== "Unimall Merchant") {
                assignedStore = realName;
                isVerified = prof.verified !== false;
            }
        }

        // 2. Existing explicit vendor name
        if (!assignedStore && existing && !isUUID(existing) && existing !== "Unimall Store" && existing !== "Unimall Merchant" && existing !== "Unimall" && existing !== "Store") {
            assignedStore = existing;
            isVerified = true;
        }

        // 3. Fallback to clean display name if no profile found
        if (!assignedStore || isUUID(assignedStore) || assignedStore === "Store") {
            assignedStore = existing && !isUUID(existing) && existing !== "Store" ? existing : "Campus Merchant";
        }

        p.vendor = assignedStore;
        p.store_name = assignedStore;
        p.vendor_name = assignedStore;
        p.vendor_verified = isVerified;
        p.is_pro = isVerified;
    });
}

async function getVendorProfileMap(vendorIds: string[]): Promise<Map<string, any>> {
    // Return cached profiles if still valid
    if (vendorProfileCache && (Date.now() - profileCacheTimestamp) < PROFILE_CACHE_TTL) {
        return vendorProfileCache;
    }

    const profileMap = new Map<string, any>();

    // 1. Scan localStorage for cached vendor profiles (instant & offline safe)
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("unimall_vendor_profile_")) {
                const uid = key.replace("unimall_vendor_profile_", "");
                const raw = localStorage.getItem(key);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed.store_name || parsed.full_name) {
                        profileMap.set(uid, parsed);
                    }
                }
            }
        }
    } catch (e) {}

    // 2. Query Supabase profiles for valid UUIDs only (non-blocking)
    const validUUIDs = vendorIds.filter((id) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id))
    );

    if (validUUIDs.length > 0) {
        try {
            const { data: vendorProfiles } = await supabase
                .from("profiles")
                .select("id, user_id, full_name, store_name, avatar_url, verified")
                .in("user_id", validUUIDs);

            vendorProfiles?.forEach((prof: any) => {
                if (prof.id) profileMap.set(prof.id, prof);
                if (prof.user_id) profileMap.set(prof.user_id, prof);
            });
        } catch (e) {}
    }

    // Cache the profiles in memory
    vendorProfileCache = profileMap;
    profileCacheTimestamp = Date.now();

    return profileMap;
}

let activeDefaultFetchPromise: Promise<StorefrontProduct[]> | null = null;

import { REAL_VENDOR_PRODUCTS } from "@/data/realVendorProducts";

export const productService = {
    // Instant synchronous cache retrieval (0ms on refresh)
    getCachedProducts(): StorefrontProduct[] {
        // 1. Try in-memory cache first (fastest)
        if (memoryCache && memoryCache.length > 0 && (Date.now() - memoryCacheTimestamp) < MEMORY_CACHE_TTL) {
            return memoryCache;
        }

        // 2. Try localStorage
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const cleanList = parsed.filter((p: any) => {
                        const n = (p.name || "").toLowerCase();
                        return !DUMMY_JUNK_KEYWORDS.some(j => n.includes(j));
                    });
                    if (cleanList.length > 0) {
                        memoryCache = cleanList;
                        memoryCacheTimestamp = Date.now();
                        return cleanList;
                    }
                }
            }
        } catch (e) {}

        memoryCache = REAL_VENDOR_PRODUCTS;
        memoryCacheTimestamp = Date.now();
        return REAL_VENDOR_PRODUCTS;
    },

    // Immediately write to both memory and localStorage cache
    _updateCache(products: StorefrontProduct[]) {
        if (products && products.length > 0) {
            const clean = products.filter((p: any) => {
                const n = (p.name || "").toLowerCase();
                return !DUMMY_JUNK_KEYWORDS.some(j => n.includes(j));
            });
            memoryCache = clean.length > 0 ? clean : REAL_VENDOR_PRODUCTS;
            memoryCacheTimestamp = Date.now();
            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify(memoryCache.slice(0, 100)));
                localStorage.setItem(CACHE_TIMESTAMP_KEY, String(Date.now()));
            } catch (e) {}
        }
    },

    // Instantly add a freshly created product to the front of cache
    addProductToCache(newProduct: StorefrontProduct) {
        const current = this.getCachedProducts();
        const updated = [newProduct, ...current.filter((p) => String(p.id) !== String(newProduct.id))];
        this._updateCache(updated);
    },

    // Soft-bust the cache timestamp to trigger background sync without blanking UI
    bustCache() {
        memoryCacheTimestamp = 0;
        profileCacheTimestamp = 0;
        activeDefaultFetchPromise = null;
        try {
            localStorage.setItem(CACHE_TIMESTAMP_KEY, "0");
        } catch (e) {}
    },

    async getProducts(filters?: {
        category?: string;
        search?: string;
        limit?: number;
        page?: number;
        sortBy?: "created_at" | "rating" | "price";
        sortOrder?: "asc" | "desc";
    }) {
        const isDefaultQuery = (!filters?.category || filters.category === "All") && !filters?.search && !filters?.sortBy && (!filters?.page || filters.page === 1);

        // Deduplicate concurrent in-flight requests (e.g. 3 homepage sections querying simultaneously)
        if (isDefaultQuery && activeDefaultFetchPromise) {
            return activeDefaultFetchPromise;
        }

        const fetchPromise = this._fetchProductsInternal(filters);
        if (isDefaultQuery) {
            activeDefaultFetchPromise = fetchPromise.finally(() => {
                activeDefaultFetchPromise = null;
            });
        }
        return fetchPromise;
    },

    async _fetchProductsInternal(filters?: {
        category?: string;
        search?: string;
        limit?: number;
        page?: number;
        sortBy?: "created_at" | "rating" | "price";
        sortOrder?: "asc" | "desc";
    }) {
        const cached = this.getCachedProducts();

        return withRetry(async () => {
            // Direct query to indexed products table with explicit column projection
            let query = supabase
                .from("products")
                .select("id, name, description, price, category, image_url, stock, is_active, created_at, vendor_id, vendor");

            if (filters?.category && filters.category !== "All") {
                query = query.eq("category", filters.category);
            }
            if (filters?.search) {
                query = query.ilike("name", `%${filters.search}%`);
            }
            if (filters?.sortBy) {
                query = query.order(filters.sortBy, { ascending: filters.sortOrder === "asc" });
            } else {
                query = query.order("created_at", { ascending: false });
            }

            const limit = filters?.limit || 50;
            if (filters?.page && filters.page > 1) {
                const from = (filters.page - 1) * limit;
                const to = from + limit - 1;
                query = query.range(from, to);
            } else {
                query = query.limit(limit);
            }

            const { data, error } = await query;
            if (error) {
                console.error("Error fetching products:", error);
                return cached;
            }

            const rawList = (data ?? []) as any[];
            let productsList = (rawList.map(unpackProductMetadata) as unknown as StorefrontProduct[])
                .filter((p: any) => p.status !== "deleted_by_admin" && p.status !== "deleted" && p.is_active !== false);

            // Filter out any dummy mock or junk test entries
            productsList = productsList.filter(p => !DUMMY_JUNK_KEYWORDS.some(junk => (p.name || "").toLowerCase().includes(junk)));

            // Ensure every product has a valid image and properties
            productsList = productsList.map(p => {
                const img = p.image || p.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800";
                return {
                    ...p,
                    image: img,
                    image_url: img,
                    features: (p.features && p.features.length > 0) ? p.features : [],
                };
            });

            // Get vendor profiles (in-memory/localStorage cache lookup is instant)
            const vendorIds = Array.from(new Set(productsList.map((p) => p.vendor_id).filter(Boolean)));
            const profileMap = await getVendorProfileMap(vendorIds);

            // Assign real store names & verified status
            assignVendorInfo(productsList, profileMap);

            const sorted = productsList.sort((a, b) => {
                const aVerified = a.vendor_verified || a.is_pro ? 1 : 0;
                const bVerified = b.vendor_verified || b.is_pro ? 1 : 0;

                if (aVerified !== bVerified) {
                    return bVerified - aVerified;
                }

                if (filters?.sortBy === "price") {
                    return filters.sortOrder === "asc" ? a.price - b.price : b.price - a.price;
                }
                if (filters?.sortBy === "rating") {
                    return (b.rating || 5) - (a.rating || 5);
                }
                const timeA = new Date(a.created_at || 0).getTime();
                const timeB = new Date(b.created_at || 0).getTime();
                return timeB - timeA;
            });

            // Save to cache for instant future loads
            if (!filters?.category && !filters?.search && sorted.length > 0) {
                this._updateCache(sorted);
            }

            return sorted;
        }, cached, { retries: 1, timeoutMs: 4000 });
    },

    // Best Sellers: Uses shared product cache instead of re-fetching
    async getBestSellers(limit = 12) {
        const cached = this.getCachedProducts();

        return withRetry(async () => {
            const allProducts = await this.getProducts({ limit: 50 });
            
            return [...allProducts].sort((a, b) => {
                const scoreA = (a.reviews || 0) * 10 + (a.rating || 5);
                const scoreB = (b.reviews || 0) * 10 + (b.rating || 5);
                return scoreB - scoreA;
            }).slice(0, limit);
        }, cached.slice(0, limit), { retries: 1, timeoutMs: 3000 });
    },

    // Pro Sellers Rotation
    async getProSellersRotated(limit = 8) {
        const cached = this.getCachedProducts();
        const cachedPro = cached.filter((p) => p.is_pro || p.vendor_verified).slice(0, limit);

        return withRetry(async () => {
            const all = await this.getProducts({ limit: 50 });
            const proProducts = all.filter((p: any) => p.is_pro === true || p.vendor_verified === true);

            if (proProducts.length === 0) return (cachedPro.length > 0 ? cachedPro : all.slice(0, limit));

            // Group by vendor and rotate
            const vendorGroups: Record<string, StorefrontProduct[]> = {};
            proProducts.forEach((prod) => {
                const vKey = prod.vendor_id || prod.vendor || "unimall";
                if (!vendorGroups[vKey]) vendorGroups[vKey] = [];
                vendorGroups[vKey].push(prod);
            });

            const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;
            const currentSlot = Math.floor(Date.now() / FIVE_HOURS_MS);
            const vendorKeys = Object.keys(vendorGroups);
            if (vendorKeys.length <= 1) return proProducts.slice(0, limit);

            const shift = currentSlot % vendorKeys.length;
            const rotatedVendorKeys = [...vendorKeys.slice(shift), ...vendorKeys.slice(0, shift)];

            const rotatedProducts: StorefrontProduct[] = [];
            const maxProductsPerVendor = Math.max(...vendorKeys.map((k) => vendorGroups[k].length));

            for (let i = 0; i < maxProductsPerVendor; i++) {
                for (const vKey of rotatedVendorKeys) {
                    if (vendorGroups[vKey][i]) {
                        rotatedProducts.push(vendorGroups[vKey][i]);
                    }
                }
            }

            return rotatedProducts.slice(0, limit);
        }, cachedPro, { retries: 1, timeoutMs: 3000 });
    },

    // Products with a real discount
    async getDeals(limit = 6) {
        const cached = this.getCachedProducts();

        return withRetry(async () => {
            const all = await this.getProducts({ limit: 50 });

            return all
                .filter((p) => p.original_price && p.original_price > p.price)
                .sort((a, b) => (1 - b.price / b.original_price!) - (1 - a.price / a.original_price!))
                .slice(0, limit);
        }, cached.filter((p) => p.original_price && p.original_price > p.price).slice(0, limit), { retries: 1, timeoutMs: 3000 });
    },

    async getProductById(id: string) {
        return withRetry(async () => {
            let productData: any = null;

            // 1. Try storefront_products_view
            try {
                const { data } = await supabase
                    .from("storefront_products_view" as any)
                    .select("*")
                    .eq("id", id)
                    .maybeSingle();
                if (data) productData = data;
            } catch (e) {}

            // 2. Fallback to direct products table query
            if (!productData) {
                try {
                    const { data } = await supabase
                        .from("products")
                        .select("*")
                        .eq("id", id)
                        .maybeSingle();
                    if (data) productData = data;
                } catch (e) {}
            }

            // 3. Fallback to cached products
            if (!productData) {
                const cached = this.getCachedProducts();
                const found = cached.find((p) => p.id === id);
                if (found) return found;
            }

            if (!productData) return null as unknown as StorefrontProduct;

            const unpacked = unpackProductMetadata(productData) as unknown as StorefrontProduct;
            if ((unpacked as any).status === "deleted_by_admin" || (unpacked as any).is_active === false) {
                return null as unknown as StorefrontProduct;
            }

            // Enrich vendor details if vendor_id exists
            if (unpacked.vendor_id) {
                try {
                    const { data: prof } = await supabase
                        .from("profiles")
                        .select("store_name, full_name, id, user_id")
                        .or(`user_id.eq.${unpacked.vendor_id},id.eq.${unpacked.vendor_id}`)
                        .limit(1)
                        .maybeSingle();
                    if (prof) {
                        unpacked.vendor = (prof as any).store_name || (prof as any).full_name || unpacked.vendor;
                        unpacked.vendor_verified = true;
                        unpacked.is_pro = true;
                    }
                } catch (e) {}
            }

            return unpacked;
        }, null as unknown as StorefrontProduct, { retries: 2 });
    }
};
