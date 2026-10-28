import { api } from "@/integrations/api/client";
import { calculateVendorProfileCompleteness } from "@/lib/vendorProfileUtils";

export const packProductMetadata = (product: any) => {
    const extraMeta: any = {};
    if (product.original_price != null && product.original_price !== "") extraMeta.original_price = Number(product.original_price);
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
    const stock = Number(product.stock ?? product.stock_quantity ?? 0);
    const status = isDeletedByAdmin
        ? "deleted_by_admin"
        : product.is_active === false ? "draft"
            : stock === 0 ? "out_of_stock" : "active";
    const same_day_delivery = product.same_day_delivery !== undefined ? product.same_day_delivery : (extra.same_day_delivery ?? true);
    const is_negotiable = product.is_negotiable !== undefined ? product.is_negotiable : (extra.is_negotiable ?? false);
    const highlight = product.highlight || extra.highlight || "";
    const vendor = product.vendor || product.vendor_name || extra.vendor || extra.store_name || extra.vendor_name || "";

    return {
        ...product,
        stock,
        rating: Number(product.rating || 0),
        reviews: Number(product.reviews_count ?? product.reviews ?? 0),
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

export const isCollectedVendorOrder = (order: any) =>
    order.order_status === "delivered" && ["paid", "completed"].includes(order.payment_status);

async function requireVendorUser() {
    const { data, error } = await api.auth.getUser();
    if (error) throw error;
    if (!data.user) throw new Error("Sign in to manage your products.");
    return data.user.id;
}

const hasOwn = (value: object, key: PropertyKey) => Object.prototype.hasOwnProperty.call(value, key);

export function validateProductInput(product: any, partial = false) {
    if ((!partial || hasOwn(product, "name")) && (typeof product.name !== "string" || !product.name.trim())) {
        throw new Error("Enter a product name.");
    }
    if ((!partial || hasOwn(product, "price")) && (!Number.isFinite(Number(product.price)) || Number(product.price) <= 0)) {
        throw new Error("Enter a valid price greater than zero.");
    }
    if ((!partial || hasOwn(product, "stock")) && (product.stock === "" || product.stock == null || !Number.isSafeInteger(Number(product.stock)) || Number(product.stock) < 0)) {
        throw new Error("Stock must be a whole number of zero or more.");
    }
    if (product.status && !["active", "draft", "out_of_stock"].includes(product.status)) throw new Error("Invalid listing status.");
    for (const image of [product.image_url, ...(product.images || [])].filter(Boolean)) {
        if (typeof image !== "string" || !/^https?:\/\//i.test(image)) throw new Error("Wait for image uploads to finish before saving.");
    }
}

export const vendorService = {
    async getDeliveryContacts() {
        const { data, error } = await api.from('vendor_delivery_contacts').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },
    async addDeliveryContact(values: { name: string; phone: string; role: string }) {
        const { data, error } = await api.from('vendor_delivery_contacts').insert(values).select('*').single();
        if (error) throw error;
        return data;
    },
    async removeDeliveryContact(id: string) {
        const { error } = await api.from('vendor_delivery_contacts').delete().eq('id', id).select('id').single();
        if (error) throw error;
    },
    async getDashboardStats(vendorId: string) {
        if (!vendorId) return { total_revenue: 0, total_orders: 0, total_products: 0, low_stock_count: 0 };
        const [products, orders] = await Promise.all([this.getProducts(vendorId), this.getOrders(vendorId)]);
        return {
            total_revenue: orders.filter(isCollectedVendorOrder).reduce((sum: number, order: any) => sum + Number(order.vendor_total), 0),
            total_orders: orders.length,
            total_products: products.length,
            low_stock_count: products.filter((p: any) => p.is_active && p.stock <= 3).length,
        };
    },

    async getProducts(vendorId: string, _vendorName?: string) {
        if (!vendorId) return [];
        const { data, error } = await api.from("products").select("*")
            .eq("vendor_id", vendorId).order("created_at", { ascending: false });
        if (error) throw error;
        // Listing errors must be visible; stale browser data cannot confirm inventory.
        return (data || []).map(unpackProductMetadata)
            .filter((p: any) => !["deleted_by_admin", "deleted"].includes(p.status));
    },

    async getOrders(vendorId: string) {
        if (!vendorId) return [];
        const { data, error } = await (api as any).from("vendor_orders_secure")
            .select("*").eq("vendor_id", vendorId).order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((order: any) => ({ ...order, vendor_total: Number(order.vendor_total || 0), item_count: Number(order.item_count || 0) }));
    },

    async getOrderItems(vendorId: string, orderId: string) {
        const { data, error } = await (api as any).from("order_items")
            .select("id, product_id, quantity, price_at_purchase, total_price, discount_amount, fulfillment_status, products(name, image_url)")
            .eq("vendor_id", vendorId).eq("order_id", orderId);
        if (error) throw error;
        return data || [];
    },

    async getWeeklySales(vendorId: string) {
        if (!vendorId) return [];
        const { data, error } = await api.from("vendor_weekly_sales").select("*")
            .eq("vendor_id", vendorId).order("week_start", { ascending: true });
        if (error) throw error;
        return (data || []) as { week_start: string; revenue: number; orders: number }[];
    },

    async createProduct(product: any) {
        const vendorId = await requireVendorUser();
        const { data: profile, error: profileError } = await (api as any).from("profiles")
            .select("store_name, full_name, phone, campus, store_description, avatar_url, banner_url")
            .eq("user_id", vendorId).single();
        if (profileError) throw profileError;
        if (!calculateVendorProfileCompleteness(profile).isComplete) {
            throw new Error("Save your complete store profile before listing products.");
        }
        validateProductInput(product);
        const { data, error } = await api.from("products")
            .insert(packProductMetadata({ ...product, vendor: profile.store_name || profile.full_name, vendor_id: vendorId }))
            .select().single();
        if (error) throw error;
        if (!data) throw new Error("The server did not confirm the new product.");
        return unpackProductMetadata(data);
    },

    async updateProduct(id: string, updates: any) {
        const vendorId = await requireVendorUser();
        validateProductInput(updates, true);
        const payload: Record<string, unknown> = {};
        // A stock-only edit must never fill unrelated columns with defaults.
        for (const key of ["name", "price", "category", "stock", "is_active", "image_url"]) {
            if (hasOwn(updates, key)) payload[key] = updates[key];
        }
        if (hasOwn(updates, "image")) payload.image_url = updates.image_url || updates.image;
        if (hasOwn(updates, "status")) {
            payload.is_active = ["active", "out_of_stock"].includes(updates.status);
        }
        const metadataKeys = ["description", "original_price", "condition", "status", "images", "same_day_delivery", "is_negotiable", "highlight"];
        if (metadataKeys.some(key => hasOwn(updates, key))) {
            const { data: existing, error: readError } = await api.from("products").select("*")
                .eq("id", id).eq("vendor_id", vendorId).single();
            if (readError) throw readError;
            payload.description = packProductMetadata({ ...unpackProductMetadata(existing), ...updates }).description;
            // Keep physical gallery columns consistent on schemas that have them.
            if (hasOwn(updates, "images") && hasOwn(existing, "images")) payload.images = updates.images;
        }
        if (!Object.keys(payload).length) throw new Error("No product changes were supplied.");
        let query = api.from("products").update(payload).eq("id", id).eq("vendor_id", vendorId);
        if (hasOwn(updates, "stock") && updates.expected_stock !== undefined) {
            query = query.eq("stock", updates.expected_stock);
        }
        const { data, error } = await query.select().single();
        if (error?.code === "PGRST116") throw new Error("This listing or its stock changed. Refresh your inventory and try again.");
        if (error) throw error;
        if (!data) throw new Error("The product could not be updated.");
        return unpackProductMetadata(data);
    },

    async deleteProduct(id: string) {
        const vendorId = await requireVendorUser();
        // Archive listings so order history, customer reviews and references survive.
        const { data, error } = await api.from("products").update({ is_active: false })
            .eq("id", id).eq("vendor_id", vendorId).select("id").single();
        if (error) throw error;
        if (!data) throw new Error("The product could not be archived.");
    },

    async getAvailableBalance(vendorId: string) {
        // Vendors cannot directly read buyers' order rows under RLS. The scoped
        // view exposes their own totals and excludes cancelled lines on the server.
        const orders = await this.getOrders(vendorId);
        const totalEarned = orders.filter(isCollectedVendorOrder)
            .reduce((sum: number, order: any) => sum + order.vendor_total, 0);

        const { data: payouts, error: pError } = await ((api as any)
            .from("payout_requests")
            .select("amount, status")
            .eq("vendor_id", vendorId)
            .in("status", ["pending", "approved", "paid"]));

        if (pError) throw pError;

        const totalWithdrawnOrPending = (payouts || []).reduce(
            (sum: number, p: any) => sum + Number(p.amount),
            0
        );

        return Math.max(0, Math.round((totalEarned - totalWithdrawnOrPending) * 100) / 100);
    },

    async getPayoutRequests(vendorId: string) {
        const { data, error } = await ((api as any)
            .from("payout_requests")
            .select("*")
            .eq("vendor_id", vendorId)
            .order("requested_at", { ascending: false }));

        if (error) throw error;
        return data;
    },

    async requestPayout(vendorId: string, amount: number, paymentMethodId: string) {
        const balance = await this.getAvailableBalance(vendorId);
        if (amount > balance) {
            throw new Error(`Insufficient available balance (GH₵${balance.toFixed(2)})`);
        }
        if (!Number.isFinite(amount) || amount < 10 || Math.round(amount * 100) / 100 !== amount) {
            throw new Error("Minimum payout amount is GH₵10.00");
        }

        const { data, error } = await (api as any).rpc("request_vendor_payout", {
            _amount: amount,
            _payment_method_id: paymentMethodId,
        });

        if (error) throw error;
        return data;
    },

    async getPaymentMethods(vendorId: string) {
        const { data, error } = await ((api as any)
            .from("vendor_payment_methods")
            .select("*")
            .eq("vendor_id", vendorId)
            .order("is_default", { ascending: false }));

        if (error) throw error;
        return data;
    },

    async addPaymentMethod(vendorId: string, methodData: any) {
        const { data, error } = await ((api as any)
            .from("vendor_payment_methods")
            .insert({
                ...methodData,
                vendor_id: vendorId,
            })
            .select()
            .single());

        if (error) throw error;
        return data;
    },

    async deletePaymentMethod(methodId: string) {
        const { error } = await ((api as any)
            .from("vendor_payment_methods")
            .delete()
            .eq("id", methodId).select("id").single());

        if (error) throw error;
    },

    async setDefaultPaymentMethod(vendorId: string, methodId: string) {
        const { data, error } = await ((api as any)
            .from("vendor_payment_methods")
            .update({ is_default: true })
            .eq("id", methodId)
            .eq("vendor_id", vendorId)
            .select()
            .single());

        if (error) throw error;
        return data;
    }
};
