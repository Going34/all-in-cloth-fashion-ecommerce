import { getDbClient } from '@/lib/db';
import type { InventoryListItem, InventoryListQuery, InventoryStatsResponse } from './inventory.types';

export async function findInventoryItems(filters: InventoryListQuery): Promise<{
  items: InventoryListItem[];
  total: number;
}> {
  const supabase = await getDbClient();
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('inventory_status')
    .select('*', { count: 'exact' });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.search) {
    query = query.or(
      `sku.ilike.%${filters.search}%,product_name.ilike.%${filters.search}%,color.ilike.%${filters.search}%,size.ilike.%${filters.search}%`
    );
  }

  query = query.order('product_name', { ascending: true });
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch inventory: ${error.message}`);
  }

  const items: InventoryListItem[] = ((data as any[]) || []).map((item) => ({
    variantId: item.variant_id,
    productId: item.product_id,
    productName: item.product_name,
    sku: item.sku,
    color: item.color,
    size: item.size,
    stock: item.stock,
    reservedStock: item.reserved_stock || 0,
    lowStockThreshold: item.low_stock_threshold || 5,
    availableStock: item.available_stock || item.stock - (item.reserved_stock || 0),
    status: item.status as InventoryListItem['status'],
  }));

  return {
    items,
    total: count || 0,
  };
}

export async function getInventoryStats(): Promise<InventoryStatsResponse> {
  const supabase = await getDbClient();

  const { data, error } = await supabase.from('inventory_status').select('status, stock');

  if (error) {
    throw new Error(`Failed to fetch inventory stats: ${error.message}`);
  }

  const items = (data || []) as any[];
  const totalSKUs = items.length;
  const lowStockCount = items.filter((i) => i.status === 'low_stock').length;
  const outOfStockCount = items.filter((i) => i.status === 'out_of_stock').length;
  const inStockHealthyCount = items.filter((i) => i.status === 'in_stock').length;

  return {
    totalSKUs,
    lowStockCount,
    outOfStockCount,
    inStockHealthyCount,
  };
}

export async function updateStock(
  variantId: string,
  action: 'set' | 'add' | 'subtract',
  quantity: number
): Promise<InventoryListItem> {
  const supabase = await getDbClient();

  const { data: currentInventory, error: fetchError } = await supabase
    .from('inventory')
    .select('stock, low_stock_threshold')
    .eq('variant_id', variantId)
    .single();

  if (fetchError || !currentInventory) {
    throw new Error(`Failed to fetch current inventory: ${fetchError?.message || 'Not found'}`);
  }

  let newStock = currentInventory.stock;
  if (action === 'set') {
    newStock = quantity;
  } else if (action === 'add') {
    newStock = currentInventory.stock + quantity;
  } else if (action === 'subtract') {
    newStock = Math.max(0, currentInventory.stock - quantity);
  }

  const { error: updateError } = await supabase
    .from('inventory')
    .update({ stock: newStock })
    .eq('variant_id', variantId);

  if (updateError) {
    throw new Error(`Failed to update stock: ${updateError.message}`);
  }

  const { data: updatedItem } = await supabase
    .from('inventory_status')
    .select('*')
    .eq('variant_id', variantId)
    .single();

  if (!updatedItem) {
    throw new Error('Failed to fetch updated inventory item');
  }

  return {
    variantId: updatedItem.variant_id,
    productId: updatedItem.product_id,
    productName: updatedItem.product_name,
    sku: updatedItem.sku,
    color: updatedItem.color,
    size: updatedItem.size,
    stock: updatedItem.stock,
    reservedStock: updatedItem.reserved_stock || 0,
    lowStockThreshold: updatedItem.low_stock_threshold || 5,
    availableStock: updatedItem.available_stock || updatedItem.stock - (updatedItem.reserved_stock || 0),
    status: updatedItem.status as InventoryListItem['status'],
  };
}

