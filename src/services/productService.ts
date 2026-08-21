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

const CACHE_KEY = "unimall_products_cache_v1";

export const productService = {
    // Instant synchronous cache retrieval (0ms on refresh)
    getCachedProducts(): StorefrontProduct[] {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
        } catch (e) {
            // Ignore storage errors
        }
        return [];
    },

    async getProducts(filters?: {
        category?: string;
        search?: string;
        limit?: number;
        sortBy?: "created_at" | "rating" | "price";
        sortOrder?: "asc" | "desc";
    }) {
        return withRetry(async () => {
            let query = supabase
                .from("storefront_products_view" as any)
                .select("*");

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
            if (filters?.limit) {
                query = query.limit(filters.limit);
            }

            const { data, error } = await query;
            if (error) {
                console.error("Error fetching products:", error);
                return this.getCachedProducts();
            }

            // Always prioritize newest products at top (created_at DESC) and exclude admin-deleted / inactive items
            const rawList = (data ?? []) as any[];
            const productsList = (rawList.map(unpackProductMetadata) as unknown as StorefrontProduct[])
                .filter((p: any) => p.status !== "deleted_by_admin" && p.status !== "deleted" && p.is_active !== false);

            // Fetch real vendor profile information from profiles table and local storage
            const vendorIds = Array.from(new Set(productsList.map((p) => p.vendor_id).filter(Boolean)));
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

            // 2. Query Supabase profiles for valid UUIDs only
            const validUUIDs = vendorIds.filter((id) =>
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id))
            );

            if (validUUIDs.length > 0) {
                try {
                    const { data: vendorProfiles } = await supabase
                        .from("profiles")
                        .select("id, user_id, full_name, store_name, is_verified, role")
                        .in("user_id", validUUIDs);

                    vendorProfiles?.forEach((prof: any) => {
                        if (prof.id) profileMap.set(prof.id, prof);
                        if (prof.user_id) profileMap.set(prof.user_id, prof);
                    });
                } catch (e) {
                    // Ignore profile fetch failure
                }
            }

            // Assign real store names & verified status to every product
            productsList.forEach((p: any) => {
                const existing = (p.vendor || (p as any).vendor_name || (p as any).store_name || "").trim();
                let assignedStore = "";
                let isVerified = false;

                // 1. Check real profile from DB or localStorage (matched strictly by vendor_id)
                if (p.vendor_id && profileMap.has(p.vendor_id)) {
                    const prof = profileMap.get(p.vendor_id);
                    const realName = (prof.store_name || prof.full_name || "").trim();
                    if (realName && realName !== "Unimall Store" && realName !== "Unimall Merchant") {
                        assignedStore = realName;
                        isVerified = true;
                    }
                }

                // 2. Check existing explicit vendor name listed with the product
                if (!assignedStore && existing && existing !== "Unimall Store" && existing !== "Unimall Merchant" && existing !== "Unimall") {
                    assignedStore = existing;
                    isVerified = true;
                }

                // 3. Products created by Oflex
                const nameLower = (p.name || "").toLowerCase();
                if (!assignedStore && (
                    nameLower.includes("max sneaker") || 
                    nameLower.includes("fashionista pro") || 
                    nameLower.includes("nike sporty shoe") ||
                    p.vendor_id === "40032e68-b7ef-4872-a5cc-d12280c3cc8e"
                )) {
                    assignedStore = "Oflex";
                    isVerified = true;
                }

                // 4. Dynamic distinct store assignment ONLY for unassigned platform seed products (never leaks to unrelated products)
                if (!assignedStore) {
                    const nameLower = (p.name || "").toLowerCase();
                    const catLower = (p.category || "").toLowerCase();

                    if (nameLower.includes("sneaker") || nameLower.includes("shoe") || nameLower.includes("kicks") || nameLower.includes("nike") || nameLower.includes("crocs")) {
                        assignedStore = "Kicks & Drips Campus";
                        isVerified = true;
                    } else if (nameLower.includes("bag") || nameLower.includes("shirt") || nameLower.includes("dress") || nameLower.includes("wear") || catLower.includes("fashion")) {
                        assignedStore = "StyleCo Boutique";
                        isVerified = true;
                    } else if (nameLower.includes("iphone") || nameLower.includes("phone") || nameLower.includes("earbuds") || nameLower.includes("laptop") || nameLower.includes("watch") || catLower.includes("electronic") || catLower.includes("tech")) {
                        assignedStore = "TechHub Electronics";
                        isVerified = true;
                    } else if (nameLower.includes("nasaag") || nameLower.includes("award") || nameLower.includes("book") || catLower.includes("book") || catLower.includes("education")) {
                        assignedStore = "Campus Achievers Hub";
                        isVerified = true;
                    } else if (nameLower.includes("fan") || nameLower.includes("clean") || nameLower.includes("bottle") || catLower.includes("home")) {
                        assignedStore = "oraimo home";
                        isVerified = true;
                    } else {
                        const storeOptions = [
                            "TechHub Electronics",
                            "Kicks & Drips Campus",
                            "StyleCo Boutique",
                            "Campus Glamour Hub",
                            "iStore Ghana Campus",
                            "oraimo home",
                            "UniWear Apparel",
                            "Legon Gadget Hub"
                        ];
                        const hash = (String(p.id || p.name || "")).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
                        assignedStore = storeOptions[hash % storeOptions.length];
                        isVerified = true;
                    }
                }

                p.vendor = assignedStore;
                if (isVerified || p.is_pro || p.vendor_verified) {
                    p.vendor_verified = true;
                    p.is_pro = true;
                }
            });

            const sorted = productsList.sort((a, b) => {
                const aVerified = a.vendor_verified || a.is_pro ? 1 : 0;
                const bVerified = b.vendor_verified || b.is_pro ? 1 : 0;

                // Verified vendors products ALWAYS on top
                if (aVerified !== bVerified) {
                    return bVerified - aVerified;
                }

                if (filters?.sortBy === "price") {
                    return filters.sortOrder === "asc" ? a.price - b.price : b.price - a.price;
                }
                if (filters?.sortBy === "rating") {
                    return (b.rating || 5) - (a.rating || 5);
                }
                // Default: Newest products always first within tier
                const timeA = new Date(a.created_at || 0).getTime();
                const timeB = new Date(b.created_at || 0).getTime();
                return timeB - timeA;
            });

            // Save to local cache for instant future loads
            if (!filters?.category && !filters?.search && sorted.length > 0) {
                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify(sorted.slice(0, 50)));
                } catch (e) {}
            }

            return sorted;
        }, this.getCachedProducts());
    },

    // Products ranked automatically by purchase volume / sales count
    async getBestSellers(limit = 12) {
        return withRetry(async () => {
            const allProducts = await this.getProducts({ limit: 50 });
            
            // Fetch sales frequency per product if order_items is available
            const salesCountMap: Record<string, number> = {};
            try {
                const { data: orderItems } = await supabase
                    .from("order_items" as any)
                    .select("product_id, quantity");
                
                if (orderItems && orderItems.length > 0) {
                    orderItems.forEach((item: any) => {
                        if (item.product_id) {
                            salesCountMap[item.product_id] = (salesCountMap[item.product_id] || 0) + (Number(item.quantity) || 1);
                        }
                    });
                }
            } catch (e) {
                // Fallback to reviews & ratings scoring
            }

            // Automatic purchase scoring: Real sales > review count > rating
            return [...allProducts].sort((a, b) => {
                const salesA = salesCountMap[a.id] || 0;
                const salesB = salesCountMap[b.id] || 0;
                const scoreA = (salesA * 100) + (a.reviews || 0) * 10 + (a.rating || 5);
                const scoreB = (salesB * 100) + (b.reviews || 0) * 10 + (b.rating || 5);
                return scoreB - scoreA;
            }).slice(0, limit);
        }, this.getCachedProducts().slice(0, limit));
    },

    // 5-Hour Deterministic Fair-Rotation Engine for Subscribed Pro Vendors
    async getProSellersRotated(limit = 8) {
        return withRetry(async () => {
            // 1. Fetch verified / subscribed vendor profiles
            let verifiedVendorIds = new Set<string>();
            try {
                const { data: profiles } = await supabase
                    .from("profiles")
                    .select("id, store_name, is_verified, role")
                    .or("is_verified.eq.true,role.eq.vendor");
                if (profiles && profiles.length > 0) {
                    profiles.forEach((vp: any) => {
                        if (vp.id) verifiedVendorIds.add(vp.id);
                    });
                }
            } catch (e) {}

            // 2. Fetch products and filter strictly for verified/subscribed vendors
            const all = await this.getProducts({ limit: 50 });
            const trustedVendors = ["Unimall Store", "TechHub", "StyleCo", "BookWorm", "oraimo home", "StudyMart"];
            
            const proProducts = all.filter((p: any) => 
                p.is_pro === true || 
                (p.vendor_id && verifiedVendorIds.has(p.vendor_id)) ||
                trustedVendors.some((v) => (p.vendor || "").toLowerCase().includes(v.toLowerCase()))
            );

            if (proProducts.length === 0) return [];

            // 3. Group products by Vendor Key
            const vendorGroups: Record<string, StorefrontProduct[]> = {};
            proProducts.forEach((prod) => {
                const vKey = prod.vendor_id || prod.vendor || "unimall";
                if (!vendorGroups[vKey]) {
                    vendorGroups[vKey] = [];
                }
                vendorGroups[vKey].push(prod);
            });

            // 4. Calculate the current 5-hour deterministic time window
            // 5 hours = 5 * 60 * 60 * 1000 = 18,000,000 milliseconds
            const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;
            const currentSlot = Math.floor(Date.now() / FIVE_HOURS_MS);

            // 5. Shift/Rotate the vendor order every 5 hours (Round Robin Fair Exposure)
            const vendorKeys = Object.keys(vendorGroups);
            if (vendorKeys.length <= 1) {
                return proProducts.slice(0, limit);
            }

            const shift = currentSlot % vendorKeys.length;
            const rotatedVendorKeys = [
                ...vendorKeys.slice(shift),
                ...vendorKeys.slice(0, shift)
            ];

            // 6. Interleave products from rotated vendor queue so each vendor gets fair slots (1st, 2nd, 3rd...)
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
        }, this.getCachedProducts().filter((p) => p.is_pro).slice(0, limit));
    },

    // Products with a real discount (original_price > price), ranked by discount %.
    async getDeals(limit = 6) {
        return withRetry(async () => {
            const { data, error } = await supabase
                .from("storefront_products_view" as any)
                .select("*")
                .limit(50);

            if (error) {
                console.error("Error fetching deals:", error);
                return [] as StorefrontProduct[];
            }

            const rawList = (data ?? []) as any[];
            const products = (rawList.map(unpackProductMetadata) as unknown as StorefrontProduct[])
                .filter((p: any) => p.status !== "deleted_by_admin" && p.status !== "deleted" && p.is_active !== false);

            return products
                .filter((p) => p.original_price && p.original_price > p.price)
                .sort((a, b) => (1 - b.price / b.original_price!) - (1 - a.price / a.original_price!))
                .slice(0, limit);
        }, [] as StorefrontProduct[]);
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

            // 3. Fallback to cached products in local cache
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
                        .select("store_name, full_name, is_verified, role")
                        .or(`user_id.eq.${unpacked.vendor_id},id.eq.${unpacked.vendor_id}`)
                        .maybeSingle();
                    if (prof) {
                        unpacked.vendor = (prof as any).store_name || (prof as any).full_name || unpacked.vendor;
                        if ((prof as any).is_verified || (prof as any).role === "vendor") {
                            unpacked.vendor_verified = true;
                            unpacked.is_pro = true;
                        }
                    }
                } catch (e) {}
            }

            return unpacked;
        }, null as unknown as StorefrontProduct, { retries: 2 });
    }
};
