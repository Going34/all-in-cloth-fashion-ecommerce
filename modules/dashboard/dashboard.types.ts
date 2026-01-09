export type DashboardPeriod = '7d' | '30d' | 'quarter';

export interface DashboardStatsQuery {
  period?: DashboardPeriod;
}

export interface TrendData {
  percentage?: number;
  change?: number;
  direction: 'up' | 'down';
}

export interface TotalSalesData {
  value: number;
  currency: string;
  trend: TrendData;
  period: string;
}

export interface PendingOrdersData {
  count: number;
  trend: TrendData;
}

export interface LowStockSKUsData {
  count: number;
  trend: TrendData;
  hasAlert: boolean;
}

export interface ActiveCustomersData {
  count: number;
  trend: TrendData;
}

export interface DashboardStatsResponse {
  totalSales: TotalSalesData;
  pendingOrders: PendingOrdersData;
  lowStockSKUs: LowStockSKUsData;
  activeCustomers: ActiveCustomersData;
}

export interface SalesChartQuery {
  period?: DashboardPeriod;
  granularity?: 'day' | 'week' | 'month';
}

export interface SalesChartDataPoint {
  date: string;
  sales: number;
  orders: number;
}

export interface SalesChartResponse {
  period: string;
  granularity: string;
  dataPoints: SalesChartDataPoint[];
  totalSales: number;
  totalOrders: number;
}

export interface InventoryAlert {
  variantId: string;
  productName: string;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  status: 'low_stock' | 'out_of_stock';
}

export interface InventoryAlertsResponse {
  alerts: InventoryAlert[];
  totalAlerts: number;
}

