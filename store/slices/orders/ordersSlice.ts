import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Order, OrderStatus } from '@/types';

export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
}

export interface OrdersState {
  data: Order[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  filters: OrderFilters;
  historyCursor: string | null;
  historyHasMore: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  selectedOrder: Order | null;
}

const initialState: OrdersState = {
  data: [],
  loading: false,
  loadingMore: false,
  error: null,
  filters: {
    page: 1,
    limit: 20,
  },
  historyCursor: null,
  historyHasMore: false,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  selectedOrder: null,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    fetchOrdersDataRequest: (state, action: PayloadAction<OrderFilters | undefined>) => {
      state.loading = true;
      state.error = null;
      if (action.payload) {
        state.filters = { ...state.filters, ...action.payload };
      }
    },
    fetchOrdersDataSuccess: (state, action: PayloadAction<{ orders: Order[]; pagination: OrdersState['pagination'] }>) => {
      state.loading = false;
      state.data = action.payload.orders;
      state.pagination = action.payload.pagination;
      state.error = null;
    },
    fetchOrdersDataFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchOrderByIdRequest: (state, action: PayloadAction<string>) => {
      state.loading = true;
      state.error = null;
    },
    fetchOrderByIdSuccess: (state, action: PayloadAction<Order | null>) => {
      state.loading = false;
      state.selectedOrder = action.payload;
      state.error = null;
    },
    fetchOrderByIdFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateOrderStatusRequest: (state, action: PayloadAction<{ id: string; status: OrderStatus; notes?: string }>) => {
      state.loading = true;
      state.error = null;
    },
    updateOrderStatusSuccess: (state, action: PayloadAction<unknown>) => {
      const payload = action.payload as { id?: unknown; status?: unknown } | null;
      const id = payload && typeof payload.id === 'string' ? payload.id : null;
      const status = payload && typeof payload.status === 'string' ? (payload.status as OrderStatus) : null;

      state.loading = false;
      if (id && status) {
        state.data = state.data.map((o) => (o.id === id ? { ...o, status } : o));
        if (state.selectedOrder?.id === id) {
          state.selectedOrder = { ...state.selectedOrder, status };
        }
      }
      state.error = null;
    },
    updateOrderStatusFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchUserOrdersRequest: (state, action: PayloadAction<OrderFilters | undefined>) => {
      state.loading = true;
      state.loadingMore = false;
      state.error = null;
      state.historyCursor = null;
      state.historyHasMore = false;
      if (action.payload) {
        state.filters = { ...state.filters, ...action.payload };
      }
    },
    fetchUserOrdersSuccess: (state, action: PayloadAction<{ orders: Order[]; nextCursor: string | null; hasMore: boolean }>) => {
      state.loading = false;
      state.data = action.payload.orders;
      state.historyCursor = action.payload.nextCursor;
      state.historyHasMore = action.payload.hasMore;
      state.error = null;
    },
    fetchUserOrdersFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.loadingMore = false;
      state.error = action.payload;
    },
    fetchUserOrdersNextPageRequest: (state) => {
      state.loadingMore = true;
      state.error = null;
    },
    fetchUserOrdersNextPageSuccess: (state, action: PayloadAction<{ orders: Order[]; nextCursor: string | null; hasMore: boolean }>) => {
      state.loadingMore = false;
      state.data = [...state.data, ...action.payload.orders];
      state.historyCursor = action.payload.nextCursor;
      state.historyHasMore = action.payload.hasMore;
      state.error = null;
    },
    fetchUserOrdersNextPageFailure: (state, action: PayloadAction<string>) => {
      state.loadingMore = false;
      state.error = action.payload;
    },
    fetchUserOrderByIdRequest: (state, action: PayloadAction<string>) => {
      state.loading = true;
      state.error = null;
    },
    fetchUserOrderByIdSuccess: (state, action: PayloadAction<Order | null>) => {
      state.loading = false;
      state.selectedOrder = action.payload;
      state.error = null;
    },
    fetchUserOrderByIdFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    createUserOrderRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    createUserOrderSuccess: (state, action: PayloadAction<Order>) => {
      state.loading = false;
      state.data = [action.payload, ...state.data];
      state.selectedOrder = action.payload;
      state.error = null;
    },
    createUserOrderFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // Batch update from userData
    batchUpdateOrders: (state, action: PayloadAction<Order[]>) => {
      state.data = action.payload;
      state.error = null;
    },
  },
});

export const ordersActions = ordersSlice.actions;
export default ordersSlice.reducer;

