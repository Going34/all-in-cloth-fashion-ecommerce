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
  error: string | null;
  filters: OrderFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  selectedOrder: any | null;
}

const initialState: OrdersState = {
  data: [],
  loading: false,
  error: null,
  filters: {
    page: 1,
    limit: 20,
  },
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
    fetchOrderByIdSuccess: (state, action: PayloadAction<any>) => {
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
    updateOrderStatusSuccess: (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.data = state.data.map((o) => (o.id === action.payload.id ? { ...o, status: action.payload.status } : o));
      if (state.selectedOrder?.id === action.payload.id) {
        state.selectedOrder = action.payload;
      }
      state.error = null;
    },
    updateOrderStatusFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchUserOrdersRequest: (state, action: PayloadAction<OrderFilters | undefined>) => {
      state.loading = true;
      state.error = null;
      if (action.payload) {
        state.filters = { ...state.filters, ...action.payload };
      }
    },
    fetchUserOrdersSuccess: (state, action: PayloadAction<{ orders: Order[]; pagination?: OrdersState['pagination'] }>) => {
      state.loading = false;
      state.data = action.payload.orders;
      if (action.payload.pagination) {
        state.pagination = action.payload.pagination;
      }
      state.error = null;
    },
    fetchUserOrdersFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchUserOrderByIdRequest: (state, action: PayloadAction<string>) => {
      state.loading = true;
      state.error = null;
    },
    fetchUserOrderByIdSuccess: (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.selectedOrder = action.payload;
      state.error = null;
    },
    fetchUserOrderByIdFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    createUserOrderRequest: (state, action: PayloadAction<any>) => {
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
  },
});

export const ordersActions = ordersSlice.actions;
export default ordersSlice.reducer;

