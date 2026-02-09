import { createClient } from '@/utils/supabase/client';
import type { Order, OrderItem, OrderStatus, OrderStatusHistory, OrderWithItems } from '@/types';

const supabase = createClient();

export async function getOrders(userId: string): Promise<OrderWithItems[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        product_variants (
          id,
          products (
            id,
            name,
            product_images (image_url, display_order)
          ),
          variant_images (image_url, display_order)
        )
      ),
      order_status_history (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }

  return ((data as any[]) || []).map((order) => {
    const items = (order.order_items || []).map((item: any) => {
      const variant = item.product_variants;
      const product = Array.isArray(variant?.products) ? variant?.products[0] : variant?.products;

      const pImages = product?.product_images || [];
      const vImages = variant?.variant_images || [];
      // Sort effectively by display_order
      pImages.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
      vImages.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));

      const mainImage = vImages[0]?.image_url || pImages[0]?.image_url;

      return {
        ...item,
        image_url: mainImage,
        // Clean up nested data if desired, typically UI uses what's on item
      };
    });

    return {
      ...order,
      items: items,
      status_history: order.order_status_history || [],
    };
  });
}

export async function getOrderById(orderId: string): Promise<OrderWithItems | null> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        product_variants (
          id,
          products (
            id,
            name,
            product_images (image_url, display_order)
          ),
          variant_images (image_url, display_order)
        )
      ),
      order_status_history (*)
    `)
    .eq('id', orderId)
    .single();

  if (error || !data) {
    console.error('Error fetching order:', error);
    return null;
  }

  const order = data as any;
  const items = (order.order_items || []).map((item: any) => {
    const variant = item.product_variants;
    const product = Array.isArray(variant?.products) ? variant?.products[0] : variant?.products;

    const pImages = product?.product_images || [];
    const vImages = variant?.variant_images || [];
    // Sort effectively by display_order
    pImages.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
    vImages.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));

    const mainImage = vImages[0]?.image_url || pImages[0]?.image_url;

    return {
      ...item,
      image_url: mainImage,
    };
  });

  return {
    ...order,
    items: items,
    status_history: order.order_status_history || [],
  };
}

interface CartItemForOrder {
  variant_id: string;
  quantity: number;
}

export async function createOrder(
  userId: string,
  items: CartItemForOrder[],
  shippingAmount: number = 0
): Promise<{ data: Order | null; error: Error | null }> {
  // Fetch variant details to get prices
  const variantIds = items.map((i) => i.variant_id);
  const { data: variants } = await supabase
    .from('product_variants')
    .select(`
      id,
      sku,
      price_override,
      products (id, name, base_price)
    `)
    .in('id', variantIds);

  if (!variants || variants.length === 0) {
    return { data: null, error: new Error('No variants found') };
  }

  // Check inventory availability
  for (const item of items) {
    const { data: inventory } = await supabase
      .from('inventory')
      .select('stock, reserved_stock')
      .eq('variant_id', item.variant_id)
      .single();

    const inv = inventory as any;
    if (!inv || inv.stock - (inv.reserved_stock || 0) < item.quantity) {
      const variant = (variants as any[]).find((v) => v.id === item.variant_id);
      return {
        data: null,
        error: new Error(`Insufficient stock for ${variant?.sku || 'item'}`),
      };
    }
  }

  // Calculate totals
  let subtotal = 0;
  const orderItems = items.map((item) => {
    const variant = (variants as any[]).find((v) => v.id === item.variant_id);
    const product = variant?.products;
    const price = variant?.price_override ?? product?.base_price ?? 0;
    subtotal += price * item.quantity;

    return {
      variant_id: variant?.id || null,
      quantity: item.quantity,
      product_name_snapshot: product?.name || 'Unknown Product',
      sku_snapshot: variant?.sku || '',
      price_snapshot: price,
    };
  });

  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax + shippingAmount;

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      status: 'pending',
      subtotal,
      tax,
      shipping: shippingAmount,
      total,
    } as any)
    .select()
    .single();

  if (orderError || !order) {
    return { data: null, error: orderError as Error | null };
  }

  const orderId = (order as any).id;

  // Create order items
  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems.map((item) => ({ ...item, order_id: orderId })) as any);

  if (itemsError) {
    console.error('Error creating order items:', itemsError);
  }

  // Create initial status history
  await supabase.from('order_status_history').insert({ order_id: orderId, status: 'pending' } as any);

  // Reserve inventory
  for (const item of items) {
    await supabase.rpc('reserve_inventory', {
      p_variant_id: item.variant_id,
      p_quantity: item.quantity,
    } as any);
  }

  return { data: order as Order, error: null };
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('orders')
    .update({ status } as any)
    .eq('id', orderId);

  if (error) {
    return { error: error as Error };
  }

  // Add to status history
  await supabase.from('order_status_history').insert({ order_id: orderId, status } as any);

  return { error: null };
}

export async function cancelOrder(orderId: string): Promise<{ error: Error | null }> {
  const order = await getOrderById(orderId);
  if (!order) {
    return { error: new Error('Order not found') };
  }

  if (order.status !== 'pending' && order.status !== 'paid') {
    return { error: new Error('Cannot cancel order in current status') };
  }

  // Release reserved inventory
  for (const item of order.items) {
    if (item.variant_id) {
      await supabase.rpc('release_inventory', {
        p_variant_id: item.variant_id,
        p_quantity: item.quantity,
      } as any);
    }
  }

  return updateOrderStatus(orderId, 'cancelled');
}

// Admin functions
export async function getAllOrders(filters?: {
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
}): Promise<OrderWithItems[]> {
  let query = supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }

  return ((data as any[]) || []).map((order) => ({
    ...order,
    items: order.order_items || [],
  }));
}

export async function getOrderStats(): Promise<{
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
}> {
  const { data: orders } = await supabase.from('orders').select('total, status');

  if (!orders) {
    return {
      totalOrders: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      completedOrders: 0,
    };
  }

  const orderList = orders as any[];
  return {
    totalOrders: orderList.length,
    totalRevenue: orderList.reduce((sum, o) => sum + (o.total || 0), 0),
    pendingOrders: orderList.filter((o) => o.status === 'pending').length,
    completedOrders: orderList.filter((o) => o.status === 'delivered').length,
  };
}
