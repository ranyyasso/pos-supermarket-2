import { createClient } from '@supabase/supabase-js';

/** Explicit opt-in connection; never replaces the saved local demo on import. */
export function createDatabaseClient(url: string, publishableKey: string) {
  if (!url || !publishableKey) throw new Error('Supabase URL and publishable key are required');
  return createClient(url, publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}

export type DatabaseClient = ReturnType<typeof createDatabaseClient>;
export class DatabaseRepository {
  constructor(private client: DatabaseClient, private storeId: string) {}

  async products() {
    const { data, error } = await this.client.from('products').select('*, categories(name,color_hex), product_barcodes(barcode)').eq('store_id', this.storeId).eq('active', true).order('name');
    if (error) throw error;
    return data;
  }

  async postReceipt(requestKey: string, supplierId: string, reference: string, items: Array<{product_id:string; quantity:string; unit_cost_minor:string; expiry_date?:string}>) {
    const { data, error } = await this.client.rpc('post_receipt', {p_store:this.storeId,p_key:requestKey,p_supplier:supplierId,p_reference:reference,p_items:items});
    if (error) throw error;
    return data as string;
  }

  async refund(requestKey: string, saleId: string, reason: string, items: Array<{sale_item_id:string; quantity:string}>) {
    const { data, error } = await this.client.rpc('refund_sale', {p_store:this.storeId,p_key:requestKey,p_sale:saleId,p_reason:reason,p_items:items});
    if (error) throw error;
    return data as string;
  }
}
