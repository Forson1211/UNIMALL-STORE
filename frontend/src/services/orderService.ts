import { api } from "@/integrations/api/client";

export const orderService = {
    async quote(items: { id: string; quantity: number }[], couponCode = ""): Promise<CartQuote> {
        const { data, error } = await api.rpc("quote_checkout", { _items: items, _coupon_code: couponCode });
        if (error) throw error;
        return data as CartQuote;
    },
    async placeOrder(params: {
        buyerId: string;
        totalAmount: number;
        items: { id: string; quantity: number; price: number; vendor_id: string }[];
        paymentMethod: string;
        shippingDetails: { fullName: string; email: string; phone: string; address: string; digitalAddress?: string };
        requestId: string;
        couponCode?: string;
    }) {
        const { data, error } = await (api.rpc as any)("create_order_v2", {
            _buyer_id: params.buyerId,
            _total_amount: params.totalAmount,
            _items: params.items,
            _payment_method: params.paymentMethod,
            _shipping_details: params.shippingDetails,
            _request_id: params.requestId,
            _coupon_code: params.couponCode || "",
        });

        if (error || !data) {
            // The order may have committed before the response was lost. Confirm it before reporting failure.
            try {
                const saved = await api.from("orders").select("id").eq("buyer_id", params.buyerId).eq("checkout_request_id", params.requestId).maybeSingle();
                if (!saved.error && saved.data?.id) return saved.data.id;
            } catch { /* Keep the original checkout failure if confirmation is also unavailable. */ }
            throw error || new Error("The server did not return an order confirmation. Check your orders before retrying.");
        }
        return data;
    }
};

export interface CartQuote {
    items: { id: string; quantity: number; price: number; base_price: number; subtotal: number; discount: number; total: number; stock: number }[];
    subtotal: number;
    discount: number;
    total: number;
    coupon_code: string | null;
}
