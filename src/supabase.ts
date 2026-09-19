import { createClient } from '@supabase/supabase-js';
import { categories, type Product } from './model';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const supabaseConfigured = Boolean(url && publishableKey);
export const supabase = supabaseConfigured ? createClient(url!, publishableKey!) : null;

type ProductRow = {
  id: string;
  barcode?: string;
  name: string;
  category: string;
  selling_price: number;
  purchase_cost: number;
  stock_quantity: number;
  minimum_stock: number;
  is_favorite?: boolean;
  is_active: boolean;
};

const toneFor = (category: string) => categories.find(item => item.id === category)?.tone || 'neutral';
const fromRow = (row: ProductRow, entryMode: 'manual' | 'barcode'): Product => ({
  id: row.id,
  name: row.name,
  category: row.category,
  price: Number(row.selling_price),
  cost: Number(row.purchase_cost),
  stock: Number(row.stock_quantity),
  minStock: Number(row.minimum_stock),
  barcode: entryMode === 'barcode' ? row.barcode || '' : '',
  entryMode,
  unit: 'piece',
  tone: toneFor(row.category),
  tax: 0,
  available: row.is_active,
  discountable: true,
  custom: true,
});

const toRow = (product: Product) => ({
  ...(productEntry(product) === 'barcode' ? {barcode: product.barcode} : {}),
  name: product.name,
  category: product.category,
  selling_price: product.price,
  purchase_cost: product.cost || 0,
  stock_quantity: product.stock,
  minimum_stock: product.minStock || 1,
  is_active: product.available !== false,
  updated_at: new Date().toISOString(),
});

const productEntry = (product: Product): 'manual' | 'barcode' => product.entryMode === 'barcode' ? 'barcode' : 'manual';
const tableFor = (product: Product) => productEntry(product) === 'barcode' ? 'barcode_products' : 'manual_products';

export async function loadCloudProducts() {
  if (!supabase) return {products: [] as Product[], favorites: [] as string[]};
  const [manual, barcode] = await Promise.all([
    supabase.from('manual_products').select('*').order('name'),
    supabase.from('barcode_products').select('*').order('name'),
  ]);
  if (manual.error) throw manual.error;
  if (barcode.error) throw barcode.error;
  const manualRows = (manual.data || []) as ProductRow[];
  const barcodeRows = (barcode.data || []) as ProductRow[];
  return {
    products: [...manualRows.map(row => fromRow(row, 'manual')), ...barcodeRows.map(row => fromRow(row, 'barcode'))],
    favorites: manualRows.filter(row => row.is_favorite).map(row => row.id),
  };
}

export async function saveCloudProduct(product: Product, creating: boolean): Promise<Product> {
  if (!supabase) return product;
  const table = tableFor(product);
  const query = creating
    ? supabase.from(table).insert(toRow(product)).select('*').single()
    : supabase.from(table).update(toRow(product)).eq('id', product.id).select('*').single();
  const {data, error} = await query;
  if (error) throw error;
  return fromRow(data as ProductRow, productEntry(product));
}

export async function deleteCloudProduct(product: Product) {
  if (!supabase) return;
  const {error} = await supabase.from(tableFor(product)).delete().eq('id', product.id);
  if (error) throw error;
}

export async function saveCloudFavorite(productId: string, favorite: boolean) {
  if (!supabase) return;
  const {error} = await supabase.from('manual_products').update({is_favorite: favorite, updated_at: new Date().toISOString()}).eq('id', productId);
  if (error) throw error;
}

export async function saveCloudStock(product: Product) {
  if (!supabase || product.untracked) return;
  const {error} = await supabase.from(tableFor(product)).update({
    stock_quantity: product.stock,
    purchase_cost: product.cost || 0,
    updated_at: new Date().toISOString(),
  }).eq('id', product.id);
  if (error) throw error;
}
