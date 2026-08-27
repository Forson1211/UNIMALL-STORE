import { supabase } from "@/integrations/supabase/client";
import { withRetry } from "@/lib/dbUtils";
import { REAL_VENDOR_PRODUCTS } from "@/data/realVendorProducts";

export const packProductMetadata = (product: any) => {
    const extraMeta: any = {};
    if (product.original_price) extraMeta.original_price = Number(product.original_price);
    if (product.condition) extraMeta.condition = product.condition;
    if (product.status) extraMeta.status = product.status;
    if (product.images && Array.isArray(product.images) && product.images.length > 0) extraMeta.images = product.images;
    if (product.same_day_delivery !== undefined) extraMeta.same_day_delivery = product.same_day_delivery;
    if (product.is_negotiable !== undefined) extraMeta.is_negotiable = product.is_negotiable;
    if (product.highlight) extraMeta.highlight = product.highlight;

    if (product.vendor) extraMeta.vendor = product.vendor;
    if (product.vendor_name) extraMeta.vendor = product.vendor_name;
    if (product.store_name) extraMeta.vendor = product.store_name;

    let cleanDesc = (product.description || "").replace(/\n\n<!-- UNIMALL_META:[\s\S]*?-->/g, "").trim();
    if (Object.keys(extraMeta).length > 0) {
        cleanDesc = `${cleanDesc}\n\n<!-- UNIMALL_META:${JSON.stringify(extraMeta)} -->`;
    }

    // Include only rock-solid core columns in the root payload
    const payload: any = {
        name: product.name,
        description: cleanDesc,
        price: Number(product.price) || 0,
        category: product.category || "General",
        image_url: product.image_url || product.image || "",
        stock: Number(product.stock) || 0,
        is_active: product.is_active !== undefined ? product.is_active : (product.status === 'active' || product.status === 'out_of_stock'),
    };

    if (product.vendor_id) {
        payload.vendor_id = product.vendor_id;
    }

    return payload;
};

export const unpackProductMetadata = (product: any) => {
    if (!product) return product;
    const desc = product.description || "";
    const metaMatch = desc.match(/<!-- UNIMALL_META:([\s\S]*?)-->/);
    let extra: any = {};
    let cleanDescription = desc;

    if (metaMatch && metaMatch[1]) {
        try {
            extra = JSON.parse(metaMatch[1]);
            cleanDescription = desc.replace(/\n\n<!-- UNIMALL_META:[\s\S]*?-->/g, "").trim();
        } catch (e) {}
    }

    const images = (product.images && Array.isArray(product.images) && product.images.length > 0)
        ? product.images
        : (extra.images && Array.isArray(extra.images) && extra.images.length > 0)
            ? extra.images
            : product.image_url ? [product.image_url] : (product.image ? [product.image] : []);

    const mainImage = product.image_url || product.image || (images && images.length > 0 ? images[0] : "") || extra.image_url || extra.image || "";

    const original_price = (product.original_price !== undefined && product.original_price !== null)
        ? Number(product.original_price)
        : (extra.original_price !== undefined && extra.original_price !== null)
            ? Number(extra.original_price)
            : null;

    const isDeletedByAdmin = extra.status === "deleted_by_admin" || extra.deleted_by === "admin" || product.status === "deleted_by_admin";
    const condition = product.condition || extra.condition || "Brand New";
    const status = isDeletedByAdmin
        ? "deleted_by_admin"
        : (product.status || extra.status || (product.is_active === false ? "draft" : product.stock === 0 ? "out_of_stock" : "active"));
    const same_day_delivery = product.same_day_delivery !== undefined ? product.same_day_delivery : (extra.same_day_delivery ?? true);
    const is_negotiable = product.is_negotiable !== undefined ? product.is_negotiable : (extra.is_negotiable ?? false);
    const highlight = product.highlight || extra.highlight || "";
    const vendor = product.vendor || product.vendor_name || extra.vendor || extra.store_name || extra.vendor_name || "";

    return {
        ...product,
        image: mainImage,
        image_url: mainImage,
        description: cleanDescription,
        vendor: vendor || product.vendor || "",
        original_price,
        images: images.length > 0 ? images : (mainImage ? [mainImage] : []),
        gallery: images.length > 0 ? images : (mainImage ? [mainImage] : []),
        condition,
        status,
        deleted_by: extra.deleted_by || (isDeletedByAdmin ? "admin" : null),
        deleted_reason: extra.deleted_reason || (isDeletedByAdmin ? "Removed by Marketplace Administrator" : null),
        deleted_at: extra.deleted_at || null,
        same_day_delivery,
        is_negotiable,
        highlight,
    };
};

export const vendorService = {
    async getDashboardStats(vendorId: string) {
        if (!vendorId) {
            return {
                total_revenue: 0,
                total_orders: 0,
                total_products: 0,
                low_stock_count: 0,
            };
        }

        try {
            const { data, error } = await ((supabase as any)
                .from("vendor_dashboard_stats")
                .select("*")
                .eq("vendor_id", vendorId)
                .maybeSingle());

            if (!error && data) {
                return data;
            }
        } catch (e) {}

        // Dynamic fallback aggregation directly from products & order_items
        try {
            const { data: prods } = await supabase
                .from("products")
                .select("id, stock, is_active")
                .eq("vendor_id", vendorId);

            const totalProds = prods?.length || 0;
            const lowStock = (prods || []).filter((p: any) => Number(p.stock || 0) < 10).length;

            const { data: orderItems } = await supabase
                .from("order_items")
                .select("price_at_purchase, quantity, order_id")
                .eq("vendor_id", vendorId);

            const totalRev = (orderItems || []).reduce((sum: number, it: any) => sum + (Number(it.price_at_purchase || 0) * Number(it.quantity || 1)), 0);
            const totalOrders = new Set((orderItems || []).map((it: any) => it.order_id)).size;

            return {
                total_revenue: totalRev,
                total_orders: totalOrders,
                total_products: totalProds,
                low_stock_count: lowStock,
            };
        } catch (err) {
            return {
                total_revenue: 0,
                total_orders: 0,
                total_products: 0,
                low_stock_count: 0,
            };
        }
    },

    async getProducts(vendorId: string, vendorName?: string) {
        if (!vendorId && !vendorName) return [];

        const cachedVendorKey = `unimall_vendor_prods_${vendorId}`;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vendorId || "");

        try {
            let query = (supabase as any)
                .from("products")
                .select("*")
                .order("created_at", { ascending: false });

            if (vendorId && isUUID) {
                query = query.eq("vendor_id", vendorId);
            } else if (vendorName) {
                query = query.ilike("vendor", `%${vendorName.trim()}%`);
            } else if (vendorId) {
                query = query.or(`vendor_id.eq.${vendorId},vendor.ilike.%${vendorId}%`);
            }

            const { data, error } = await query;
            if (!error && data) {
                const unpacked = (data as any[]).map(unpackProductMetadata)
                    .filter((p: any) => p.status !== "deleted_by_admin" && p.status !== "deleted");

                try {
                    localStorage.setItem(cachedVendorKey, JSON.stringify(unpacked.slice(0, 50)));
                } catch (e) {}

                return unpacked;
            }
        } catch (err) {
            console.warn("Failed to fetch vendor products from Supabase:", err);
        }

        // Return locally cached vendor products if DB is temporarily unreachable
        try {
            const raw = localStorage.getItem(cachedVendorKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
        } catch (e) {}

        return [];
    },

    async getOrders(vendorId: string) {
        if (!vendorId) return [];

        try {
            const { data, error } = await ((supabase as any)
                .from("vendor_orders_view")
                .select("*")
                .eq("vendor_id", vendorId)
                .order("created_at", { ascending: false }));

            if (!error && data) return data;
        } catch (e) {}

        // Direct order_items fallback
        try {
            const { data, error } = await ((supabase as any)
                .from("order_items")
                .select("*, orders(*)")
                .eq("vendor_id", vendorId)
                .order("created_at", { ascending: false }));

            if (!error && data) {
                return data.map((it: any) => ({
                    order_id: it.order_id,
                    vendor_id: it.vendor_id,
                    created_at: it.created_at || it.orders?.created_at,
                    order_status: it.orders?.status || "pending",
                    order_total: it.orders?.total_amount || (it.price_at_purchase * it.quantity),
                    vendor_total: it.price_at_purchase * it.quantity,
                    item_count: it.quantity,
                    shipping_address: it.orders?.shipping_address,
                }));
            }
        } catch (e) {}

        return [];
    },

    async getWeeklySales(vendorId: string) {
        if (!vendorId) return [];
        try {
            const { data, error } = await ((supabase as any)
                .from("vendor_weekly_sales")
                .select("*")
                .eq("vendor_id", vendorId)
                .order("week_start", { ascending: true }));

            if (!error && data) {
                return data as { week_start: string; revenue: number; orders: number }[];
            }
        } catch (error) {
            console.error("Error fetching weekly sales:", error);
        }
        return [];
    },

    async createProduct(product: any) {
        // Enforce authentic user ID from active Supabase session
        const { data: authData } = await supabase.auth.getUser();
        const authenticatedUserId = authData?.user?.id;

        if (!authenticatedUserId) {
            throw new Error("You must be signed in to create a product.");
        }

        // Validate 100% Store Profile Completeness requirement
        let profileData: any = null;
        try {
            const { data: prof } = await supabase
                .from("profiles")
                .select("store_name, full_name, phone, campus, store_description, avatar_url, banner_url")
                .eq("user_id", authenticatedUserId)
                .maybeSingle();
            if (prof) profileData = prof;
        } catch (e) {}

        let localData: any = null;
        try {
            const raw = localStorage.getItem(`unimall_vendor_profile_${authenticatedUserId}`);
            if (raw) localData = JSON.parse(raw);
        } catch (e) {}

        const mergedProf = { ...(profileData || {}), ...(localData || {}) };
        const hasStoreName = Boolean((mergedProf.store_name || mergedProf.full_name || product.vendor || product.store_name)?.trim());
        const hasPhone = Boolean(mergedProf.phone?.trim());
        const hasCampus = Boolean(mergedProf.campus?.trim());
        const hasDescription = Boolean((mergedProf.store_description || mergedProf.description)?.trim());
        const hasAvatar = Boolean(mergedProf.avatar_url?.trim());
        const hasBanner = Boolean(mergedProf.banner_url?.trim());

        if (!hasStoreName || !hasPhone || !hasCampus || !hasDescription || !hasAvatar || !hasBanner) {
            throw new Error("Please complete 100% of your store profile (Store Logo, Cover Banner, WhatsApp Contact, Campus Location, and Bio) before listing products.");
        }

        const payload = packProductMetadata({
            ...product,
            vendor_id: authenticatedUserId,
        });

        // Ensure vendor_id is strictly the authenticated user's ID
        payload.vendor_id = authenticatedUserId;

        let currentPayload = { ...payload };
        let result: any = null;
        let lastError: any = null;

        for (let attempt = 0; attempt < 3; attempt++) {
            const { data, error } = await (supabase as any)
                .from("products")
                .insert(currentPayload)
                .select()
                .single();

            if (!error && data) {
                result = data;
                break;
            }

            lastError = error;
            console.warn(`Product insert attempt ${attempt + 1} failed:`, error?.message);

            // If a specific column is missing from older schema, strip it and retry
            const match = error?.message?.match(/Could not find the '(\w+)' column/i);
            if (match && match[1]) {
                delete currentPayload[match[1]];
                continue;
            }
            break;
        }

        if (!result && lastError) {
            console.error("Final Error inserting product in Supabase:", lastError);
            throw lastError;
        }

        return unpackProductMetadata(result);
    },

    async updateProduct(id: string, updates: any) {
        const payload = packProductMetadata({ ...updates, id });
        delete payload.vendor_id; // Never reassign vendor_id on updates

        let currentPayload = { ...payload };
        let result: any = null;
        let lastError: any = null;

        for (let attempt = 0; attempt < 3; attempt++) {
            const { data, error } = await (supabase as any)
                .from("products")
                .update(currentPayload)
                .eq("id", id)
                .select()
                .single();

            if (!error && data) {
                result = data;
                break;
            }

            lastError = error;
            console.warn(`Product update attempt ${attempt + 1} failed:`, error?.message);

            const match = error?.message?.match(/Could not find the '(\w+)' column/i);
            if (match && match[1]) {
                delete currentPayload[match[1]];
                continue;
            }
            break;
        }

        if (!result && lastError) {
            console.error("Final Error updating product in Supabase:", lastError);
            throw lastError;
        }

        return unpackProductMetadata(result);
    },

    async deleteProduct(id: string) {
        const { error } = await (supabase as any)
            .from("products")
            .delete()
            .eq("id", id);

        if (error) {
            console.warn("Direct DB delete error, attempting cleanup and soft-delete fallback:", error);
            try {
                await (supabase as any).from("cart_items").delete().eq("product_id", id);
                await (supabase as any).from("wishlists").delete().eq("product_id", id);
                await (supabase as any).from("reviews").delete().eq("product_id", id);
            } catch (cleanErr) {
                console.warn("Child cleanup skipped:", cleanErr);
            }

            const { error: retryError } = await (supabase as any)
                .from("products")
                .delete()
                .eq("id", id);

            if (retryError) {
                const { error: softError } = await (supabase as any)
                    .from("products")
                    .update({ is_active: false })
                    .eq("id", id);

                if (softError) throw softError;
            }
        }
    },

    async getAvailableBalance(vendorId: string) {
        const { data: orderItems, error: oiError } = await ((supabase as any)
            .from("order_items")
            .select("price_at_purchase, quantity, orders!inner(status)")
            .eq("vendor_id", vendorId));

        if (oiError) throw oiError;

        const totalEarned = (orderItems || [])
            .filter((item: any) => item.orders?.status === "delivered")
            .reduce((sum: number, item: any) => sum + item.price_at_purchase * item.quantity, 0);

        const { data: payouts, error: pError } = await ((supabase as any)
            .from("payout_requests")
            .select("amount, status")
            .eq("vendor_id", vendorId)
            .in("status", ["pending", "processing", "completed"]));

        if (pError) throw pError;

        const totalWithdrawnOrPending = (payouts || []).reduce(
            (sum: number, p: any) => sum + Number(p.amount),
            0
        );

        return Math.max(0, totalEarned - totalWithdrawnOrPending);
    },

    async getPayoutRequests(vendorId: string) {
        const { data, error } = await ((supabase as any)
            .from("payout_requests")
            .select("*")
            .eq("vendor_id", vendorId)
            .order("created_at", { ascending: false }));

        if (error) throw error;
        return data;
    },

    async requestPayout(vendorId: string, amount: number, paymentMethodId: string) {
        const balance = await this.getAvailableBalance(vendorId);
        if (amount > balance) {
            throw new Error(`Insufficient available balance (GH₵${balance.toFixed(2)})`);
        }
        if (amount < 10) {
            throw new Error("Minimum payout amount is GH₵10.00");
        }

        const { data, error } = await ((supabase as any)
            .from("payout_requests")
            .insert({
                vendor_id: vendorId,
                amount,
                payment_method_id: paymentMethodId,
                status: "pending",
            })
            .select()
            .single());

        if (error) throw error;
        return data;
    },

    async getPaymentMethods(vendorId: string) {
        const { data, error } = await ((supabase as any)
            .from("vendor_payment_methods")
            .select("*")
            .eq("vendor_id", vendorId)
            .order("is_default", { ascending: false }));

        if (error) throw error;
        return data;
    },

    async addPaymentMethod(vendorId: string, methodData: any) {
        if (methodData.is_default) {
            await ((supabase as any)
                .from("vendor_payment_methods")
                .update({ is_default: false })
                .eq("vendor_id", vendorId));
        }

        const { data, error } = await ((supabase as any)
            .from("vendor_payment_methods")
            .insert({
                vendor_id: vendorId,
                ...methodData,
            })
            .select()
            .single());

        if (error) throw error;
        return data;
    },

    async deletePaymentMethod(methodId: string) {
        const { error } = await ((supabase as any)
            .from("vendor_payment_methods")
            .delete()
            .eq("id", methodId));

        if (error) throw error;
    },

    async setDefaultPaymentMethod(vendorId: string, methodId: string) {
        await ((supabase as any)
            .from("vendor_payment_methods")
            .update({ is_default: false })
            .eq("vendor_id", vendorId));

        const { data, error } = await ((supabase as any)
            .from("vendor_payment_methods")
            .update({ is_default: true })
            .eq("id", methodId)
            .select()
            .single());

        if (error) throw error;
        return data;
    }
};
