import { getDbClient } from '@/lib/db';
import type {
  DashboardStatsResponse,
  DashboardPeriod,
  SalesChartResponse,
  SalesChartDataPoint,
  InventoryAlert,
  InventoryAlertsResponse,
} from './dashboard.types';

function getDateRange(period: DashboardPeriod): { start: Date; end: Date; previousStart: Date; previousEnd: Date } {
  const end = new Date();
  const start = new Date();
  const previousEnd = new Date();
  const previousStart = new Date();

  switch (period) {
    case '7d':
      start.setDate(end.getDate() - 7);
      previousEnd.setDate(start.getDate() - 1);
      previousStart.setDate(previousEnd.getDate() - 7);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      previousEnd.setDate(start.getDate() - 1);
      previousStart.setDate(previousEnd.getDate() - 30);
      break;
    case 'quarter':
      start.setMonth(end.getMonth() - 3);
      previousEnd.setMonth(start.getMonth() - 1);
      previousStart.setMonth(previousEnd.getMonth() - 3);
      break;
  }

  return { start, end, previousStart, previousEnd };
}

export async function getDashboardStats(period: DashboardPeriod = '30d'): Promise<DashboardStatsResponse> {
  const supabase = await getDbClient();
  const { start, end, previousStart, previousEnd } = getDateRange(period);

  // Get total sales for current period
  const { data: currentOrders, error: currentError } = await supabase
    .from('orders')
    .select('total, status')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  if (currentError) {
    throw new Error(`Failed to fetch current orders: ${currentError.message}`);
  }

  // Get total sales for previous period
  const { data: previousOrders, error: previousError } = await supabase
    .from('orders')
    .select('total')
    .gte('created_at', previousStart.toISOString())
    .lte('created_at', previousEnd.toISOString());

  if (previousError) {
    throw new Error(`Failed to fetch previous orders: ${previousError.message}`);
  }

  const currentTotal = (currentOrders || []).reduce((sum, o) => sum + (o.total || 0), 0);
  const previousTotal = (previousOrders || []).reduce((sum, o) => sum + (o.total || 0), 0);
  const salesTrend = previousTotal > 0
    ? ((currentTotal - previousTotal) / previousTotal) * 100
    : currentTotal > 0 ? 100 : 0;

  // Count pending orders
  const pendingOrders = (currentOrders || []).filter((o) => o.status === 'pending').length;
  const { data: previousPendingOrders } = await supabase
    .from('orders')
    .select('status')
    .gte('created_at', previousStart.toISOString())
    .lte('created_at', previousEnd.toISOString());
  const previousPending = (previousPendingOrders || []).filter((o) => o.status === 'pending').length;
  const pendingTrend = pendingOrders - previousPending;

  // Count low stock SKUs
  const { data: currentLowStock, error: lowStockError } = await supabase
    .from('inventory_status')
    .select('status')
    .in('status', ['low_stock', 'out_of_stock']);

  if (lowStockError) {
    throw new Error(`Failed to fetch low stock items: ${lowStockError.message}`);
  }

  const lowStockCount = (currentLowStock || []).length;
  const { data: previousLowStock } = await supabase
    .from('inventory_status')
    .select('status')
    .in('status', ['low_stock', 'out_of_stock']);
  const previousLowStockCount = (previousLowStock || []).length;
  const lowStockTrend = lowStockCount - previousLowStockCount;

  // Count active customers (users with orders in period)
  const { data: activeCustomersData, error: customersError } = await supabase
    .from('orders')
    .select('user_id')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  if (customersError) {
    throw new Error(`Failed to fetch active customers: ${customersError.message}`);
  }

  const uniqueCustomers = new Set((activeCustomersData || []).map((o) => o.user_id));
  const activeCustomersCount = uniqueCustomers.size;

  const { data: previousCustomersData } = await supabase
    .from('orders')
    .select('user_id')
    .gte('created_at', previousStart.toISOString())
    .lte('created_at', previousEnd.toISOString());
  const previousUniqueCustomers = new Set((previousCustomersData || []).map((o) => o.user_id));
  const previousActiveCustomersCount = previousUniqueCustomers.size;
  const customersTrend = previousActiveCustomersCount > 0
    ? ((activeCustomersCount - previousActiveCustomersCount) / previousActiveCustomersCount) * 100
    : activeCustomersCount > 0 ? 100 : 0;

  return {
    totalSales: {
      value: currentTotal,
      currency: 'USD',
      trend: {
        percentage: Math.abs(salesTrend),
        direction: salesTrend >= 0 ? 'up' : 'down',
      },
      period: period,
    },
    pendingOrders: {
      count: pendingOrders,
      trend: {
        change: Math.abs(pendingTrend),
        direction: pendingTrend >= 0 ? 'up' : 'down',
      },
    },
    lowStockSKUs: {
      count: lowStockCount,
      trend: {
        change: Math.abs(lowStockTrend),
        direction: lowStockTrend >= 0 ? 'up' : 'down',
      },
      hasAlert: lowStockCount > 0,
    },
    activeCustomers: {
      count: activeCustomersCount,
      trend: {
        percentage: Math.abs(customersTrend),
        direction: customersTrend >= 0 ? 'up' : 'down',
      },
    },
  };
}

export async function getSalesChartData(
  period: DashboardPeriod = '30d',
  granularity: 'day' | 'week' | 'month' = 'day'
): Promise<SalesChartResponse> {
  const supabase = await getDbClient();
  const { start, end } = getDateRange(period);

  const { data: orders, error } = await supabase
    .from('orders')
    .select('total, created_at, status')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }

  const dataPointsMap = new Map<string, { sales: number; orders: number }>();

  (orders || []).forEach((order) => {
    const date = new Date(order.created_at);
    let key: string;

    switch (granularity) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        key = date.toISOString().split('T')[0];
    }

    const existing = dataPointsMap.get(key) || { sales: 0, orders: 0 };
    dataPointsMap.set(key, {
      sales: existing.sales + (order.total || 0),
      orders: existing.orders + 1,
    });
  });

  const dataPoints: SalesChartDataPoint[] = Array.from(dataPointsMap.entries())
    .map(([date, data]) => ({
      date,
      sales: data.sales,
      orders: data.orders,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalSales = dataPoints.reduce((sum, point) => sum + point.sales, 0);
  const totalOrders = dataPoints.reduce((sum, point) => sum + point.orders, 0);

  return {
    period,
    granularity,
    dataPoints,
    totalSales,
    totalOrders,
  };
}

export async function getInventoryAlerts(limit: number = 10): Promise<InventoryAlertsResponse> {
  const supabase = await getDbClient();

  const { data, error } = await supabase
    .from('inventory_status')
    .select('*')
    .in('status', ['low_stock', 'out_of_stock'])
    .order('stock', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch inventory alerts: ${error.message}`);
  }

  const alerts: InventoryAlert[] = (data || []).map((item: any) => ({
    variantId: item.variant_id,
    productName: item.product_name,
    sku: item.sku,
    stock: item.stock,
    lowStockThreshold: item.low_stock_threshold,
    status: item.status as 'low_stock' | 'out_of_stock',
  }));

  const { count } = await supabase
    .from('inventory_status')
    .select('*', { count: 'exact', head: true })
    .in('status', ['low_stock', 'out_of_stock']);

  return {
    alerts,
    totalAlerts: count || 0,
  };
}

