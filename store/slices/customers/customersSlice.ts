import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  lastOrder: string;
  joinDate: string;
  isActive: boolean;
}

export interface CustomerFilters {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CustomersState {
  data: Customer[];
  loading: boolean;
  error: string | null;
  filters: CustomerFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  selectedCustomer: any | null;
}

const initialState: CustomersState = {
  data: [],
  loading: false,
  error: null,
  filters: {
    page: 1,
    limit: 10,
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  selectedCustomer: null,
};

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    fetchCustomersDataRequest: (state, action: PayloadAction<CustomerFilters | undefined>) => {
      state.loading = true;
      state.error = null;
      if (action.payload) {
        state.filters = { ...state.filters, ...action.payload };
      }
    },
    fetchCustomersDataSuccess: (state, action: PayloadAction<{ customers: Customer[]; pagination: CustomersState['pagination'] }>) => {
      state.loading = false;
      state.data = action.payload.customers;
      state.pagination = action.payload.pagination;
      state.error = null;
    },
    fetchCustomersDataFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchCustomerByIdRequest: (state, action: PayloadAction<string>) => {
      state.loading = true;
      state.error = null;
    },
    fetchCustomerByIdSuccess: (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.selectedCustomer = action.payload;
      state.error = null;
    },
    fetchCustomerByIdFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const customersActions = customersSlice.actions;
export default customersSlice.reducer;

