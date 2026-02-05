import { supabase } from "@/integrations/supabase/client";

export const orderService = {
    async placeOrder(params: {
        buyerId: string;
        totalAmount: number;
        items: { id: string; quantity: number; price: number; vendor_id: string }[];
        paymentMethod: string;
        shippingDetails: any;
    }) {
        const { data, error } = await (supabase.rpc as any)("create_order_secure", {
            _buyer_id: params.buyerId,
            _total_amount: params.totalAmount,
            _items: params.items,
            _payment_method: params.paymentMethod,
            _shipping_details: params.shippingDetails,
        });

        if (error) throw error;
        return data;
    }
};
