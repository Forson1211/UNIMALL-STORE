import { supabase } from "@/integrations/supabase/client";

export interface FlashDeal {
  id: string;
  product_id: string;
  vendor_id: string;
  discount_price: number;
  original_price: number;
  start_time: string;
  end_time: string;
  name: string;
  image: string;
  stock: number;
  category: string;
  vendor_name: string;
  is_featured: boolean;
}

export interface TopSeller {
  id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  category: string;
  vendor: string;
  total_quantity: number;
  total_orders: number;
  is_featured: boolean;
}

export const dealService = {
  async getActiveFlashDeals() {
    const { data, error } = await (supabase
      .from('active_flash_deals' as any)
      .select('*') as any);

    if (error) {
      console.error("Error fetching flash deals:", error);
      return [];
    }
    return (data || []) as FlashDeal[];
  },

  async getTopSellingProducts(limit = 10) {
    const { data, error } = await (supabase
      .from('top_selling_products' as any)
      .select('*')
      .limit(limit) as any);

    if (error) {
      console.error("Error fetching top sellers:", error);
      return [];
    }
    return (data || []) as TopSeller[];
  },

  async submitDeal(deal: {
    product_id: string;
    vendor_id: string;
    discount_price: number;
    start_time: string;
    end_time: string;
  }) {
    const { data, error } = await (supabase
      .from('deals' as any)
      .insert(deal)
      .select()
      .single() as any);

    if (error) throw error;
    return data;
  },

  async getPendingDeals() {
    const { data, error } = await (supabase
      .from('deals' as any)
      .select(`
        *,
        product:products(name, price, image_url),
        vendor:profiles!inner(store_name)
      `)
      .eq('approved_by_admin', false)
      .is('rejected_at', null) as any);

    if (error) throw error;
    return data;
  },

  async approveDeal(dealId: string) {
    const { error } = await (supabase
      .from('deals' as any)
      .update({ approved_by_admin: true } as any)
      .eq('id', dealId) as any);

    if (error) throw error;
  },

  async rejectDeal(dealId: string) {
    const { error } = await (supabase
      .from('deals' as any)
      .update({ rejected_at: new Date().toISOString() } as any)
      .eq('id', dealId) as any);

    if (error) throw error;
  }
};
