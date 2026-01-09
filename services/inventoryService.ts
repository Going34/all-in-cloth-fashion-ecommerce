import { createClient } from '@/utils/supabase/client';
import type { Inventory, InventoryItem } from '@/types';

const supabase = createClient();

export async function getInventoryStatus(): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('inventory_status')
    .select('*');

  if (error) {
    console.error('Error fetching inventory status:', error);
    return [];
  }

  return ((data as any[]) || []).map((item) => ({
    variant_id: item.variant_id,
    product_id: item.product_id,
    product_name: item.product_name,
    sku: item.sku,
    color: item.color,
    size: item.size,
    stock: item.stock,
    reserved_stock: item.reserved_stock,
    low_stock_threshold: item.low_stock_threshold,
    available_stock: item.available_stock,
    status: item.status as 'in_stock' | 'low_stock' | 'out_of_stock',
  }));
}

export async function getInventoryByVariantId(variantId: string): Promise<Inventory | null> {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('variant_id', variantId)
    .single();

  if (error) {
    console.error('Error fetching inventory:', error);
    return null;
  }

  return data as Inventory;
}

export async function updateStock(
  variantId: string,
  stock: number
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('inventory')
    .update({ stock } as any)
    .eq('variant_id', variantId);

  return { error: error as Error | null };
}

export async function updateInventoryItemStock(
  variantId: string,
  newStock: number
): Promise<InventoryItem | null> {
  const { error } = await supabase
    .from('inventory')
    .update({ stock: newStock } as any)
    .eq('variant_id', variantId);

  if (error) {
    console.error('Error updating inventory stock:', error);
    return null;
  }

  // Fetch and return the updated item
  const { data } = await supabase
    .from('inventory_status')
    .select('*')
    .eq('variant_id', variantId)
    .single();

  if (!data) return null;

  const item = data as any;
  return {
    variant_id: item.variant_id,
    product_id: item.product_id,
    product_name: item.product_name,
    sku: item.sku,
    color: item.color,
    size: item.size,
    stock: item.stock,
    reserved_stock: item.reserved_stock,
    low_stock_threshold: item.low_stock_threshold,
    available_stock: item.available_stock,
    status: item.status as 'in_stock' | 'low_stock' | 'out_of_stock',
  };
}

export async function updateLowStockThreshold(
  variantId: string,
  threshold: number
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('inventory')
    .update({ low_stock_threshold: threshold } as any)
    .eq('variant_id', variantId);

  return { error: error as Error | null };
}

export async function getLowStockItems(): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('inventory_status')
    .select('*')
    .in('status', ['low_stock', 'out_of_stock']);

  if (error) {
    console.error('Error fetching low stock items:', error);
    return [];
  }

  return ((data as any[]) || []).map((item) => ({
    variant_id: item.variant_id,
    product_id: item.product_id,
    product_name: item.product_name,
    sku: item.sku,
    color: item.color,
    size: item.size,
    stock: item.stock,
    reserved_stock: item.reserved_stock,
    low_stock_threshold: item.low_stock_threshold,
    available_stock: item.available_stock,
    status: item.status as 'in_stock' | 'low_stock' | 'out_of_stock',
  }));
}

export async function reserveStock(
  variantId: string,
  quantity: number
): Promise<{ success: boolean; error: Error | null }> {
  // Get current inventory with lock
  const { data: inventory, error: fetchError } = await supabase
    .from('inventory')
    .select('stock, reserved_stock')
    .eq('variant_id', variantId)
    .single();

  if (fetchError || !inventory) {
    return { success: false, error: fetchError as Error | null };
  }

  const inv = inventory as any;
  const available = inv.stock - inv.reserved_stock;
  
  if (available < quantity) {
    return { success: false, error: new Error('Insufficient stock') };
  }

  const { error: updateError } = await supabase
    .from('inventory')
    .update({ reserved_stock: inv.reserved_stock + quantity } as any)
    .eq('variant_id', variantId);

  return { success: !updateError, error: updateError as Error | null };
}

export async function releaseReservedStock(
  variantId: string,
  quantity: number
): Promise<{ error: Error | null }> {
  const { data: inventory } = await supabase
    .from('inventory')
    .select('reserved_stock')
    .eq('variant_id', variantId)
    .single();

  if (!inventory) {
    return { error: new Error('Inventory not found') };
  }

  const inv = inventory as any;
  const newReserved = Math.max(0, inv.reserved_stock - quantity);

  const { error } = await supabase
    .from('inventory')
    .update({ reserved_stock: newReserved } as any)
    .eq('variant_id', variantId);

  return { error: error as Error | null };
}

export async function commitReservedStock(
  variantId: string,
  quantity: number
): Promise<{ error: Error | null }> {
  const { data: inventory } = await supabase
    .from('inventory')
    .select('stock, reserved_stock')
    .eq('variant_id', variantId)
    .single();

  if (!inventory) {
    return { error: new Error('Inventory not found') };
  }

  const inv = inventory as any;
  const { error } = await supabase
    .from('inventory')
    .update({
      stock: inv.stock - quantity,
      reserved_stock: Math.max(0, inv.reserved_stock - quantity),
    } as any)
    .eq('variant_id', variantId);

  return { error: error as Error | null };
}

export async function getInventoryStats(): Promise<{
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
  outOfStockCount: number;
}> {
  const items = await getInventoryStatus();

  return {
    totalProducts: items.length,
    totalStock: items.reduce((sum, item) => sum + item.stock, 0),
    lowStockCount: items.filter((item) => item.status === 'low_stock').length,
    outOfStockCount: items.filter((item) => item.status === 'out_of_stock').length,
  };
}
