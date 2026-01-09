import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface DashboardStats {
  totalSales: {
    value: number;
    currency: string;
    trend: { percentage?: number; change?: number; direction: 'up' | 'down' };
    period: string;
  };
  pendingOrders: {
    count: number;
    trend: { change?: number; direction: 'up' | 'down' };
  };
  lowStockSKUs: {
    count: number;
    trend: { change?: number; direction: 'up' | 'down' };
    hasAlert: boolean;
  };
  activeCustomers: {
    count: number;
    trend: { percentage?: number; direction: 'up' | 'down' };
  };
}

export interface SalesChartDataPoint {
  date: string;
  sales: number;
  orders: number;
}

export interface SalesChartData {
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

export interface DashboardState {
  stats: DashboardStats | null;
  salesChart: SalesChartData | null;
  inventoryAlerts: InventoryAlert[];
  loading: boolean;
  error: string | null;
  period: '7d' | '30d' | 'quarter';
}

const initialState: DashboardState = {
  stats: null,
  salesChart: null,
  inventoryAlerts: [],
  loading: false,
  error: null,
  period: '30d',
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    fetchDashboardStatsRequest: (state, action: PayloadAction<'7d' | '30d' | 'quarter' | undefined>) => {
      state.loading = true;
      state.error = null;
      if (action.payload) {
        state.period = action.payload;
      }
    },
    fetchDashboardStatsSuccess: (state, action: PayloadAction<DashboardStats>) => {
      state.loading = false;
      state.stats = action.payload;
      state.error = null;
    },
    fetchDashboardStatsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchSalesChartRequest: (state, action: PayloadAction<{ period?: '7d' | '30d' | 'quarter'; granularity?: 'day' | 'week' | 'month' }>) => {
      state.loading = true;
      state.error = null;
    },
    fetchSalesChartSuccess: (state, action: PayloadAction<SalesChartData>) => {
      state.loading = false;
      state.salesChart = action.payload;
      state.error = null;
    },
    fetchSalesChartFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchInventoryAlertsRequest: (state, action: PayloadAction<number | undefined>) => {
      state.loading = true;
      state.error = null;
    },
    fetchInventoryAlertsSuccess: (state, action: PayloadAction<{ alerts: InventoryAlert[]; totalAlerts: number }>) => {
      state.loading = false;
      state.inventoryAlerts = action.payload.alerts;
      state.error = null;
    },
    fetchInventoryAlertsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const dashboardActions = dashboardSlice.actions;
export default dashboardSlice.reducer;

