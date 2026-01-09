import { getDbClient } from '@/lib/db';
import type { CustomerListItem, CustomerDetailsResponse } from './customer.types';

export async function findCustomersAdmin(filters: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{
  customers: CustomerListItem[];
  total: number;
}> {
  const supabase = await getDbClient();
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('users')
    .select(
      `
      *,
      orders (id, total, created_at, status)
    `,
      { count: 'exact' }
    );

  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }

  query = query.order('created_at', { ascending: false });
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch customers: ${error.message}`);
  }

  const customers = ((data as any[]) || []).map((user) => {
    const orders = user.orders || [];
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
    const lastOrder = orders.length > 0
      ? orders.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
      : null;
    const lastOrderDate = lastOrder ? lastOrder.created_at : undefined;
    const lastOrderHuman = lastOrder
      ? (() => {
          const daysAgo = Math.floor((Date.now() - new Date(lastOrder.created_at).getTime()) / (1000 * 60 * 60 * 24));
          if (daysAgo === 0) return 'Today';
          if (daysAgo === 1) return '1 day ago';
          if (daysAgo < 7) return `${daysAgo} days ago`;
          if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} weeks ago`;
          return `${Math.floor(daysAgo / 30)} months ago`;
        })()
      : 'Never';

    return {
      id: user.id,
      name: user.name || '',
      email: user.email,
      phone: user.phone || undefined,
      address: undefined,
      totalOrders,
      totalSpent,
      lastOrderDate,
      lastOrder: lastOrderHuman,
      joinDate: user.created_at || '',
      isActive: user.is_active !== false,
    };
  });

  return {
    customers,
    total: count || 0,
  };
}

export async function findCustomerByIdAdmin(id: string): Promise<CustomerDetailsResponse | null> {
  const supabase = await getDbClient();

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (userError || !user) {
    return null;
  }

  const { data: addresses } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', id);

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, total, status, created_at')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  const totalOrders = orders?.length || 0;
  const totalSpent = (orders || []).reduce((sum, o) => sum + (o.total || 0), 0);

  return {
    id: user.id,
    name: user.name || '',
    email: user.email,
    phone: user.phone || undefined,
    addresses: (addresses || []).map((addr) => ({
      id: addr.id,
      name: addr.name,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
      country: addr.country,
      isDefault: addr.is_default || false,
    })),
    totalOrders,
    totalSpent,
    joinDate: user.created_at || '',
    isActive: user.is_active !== false,
    orderHistory: (orders || []).map((order) => ({
      id: order.id,
      orderNumber: order.order_number,
      date: order.created_at,
      total: order.total,
      status: order.status,
    })),
  };
}

