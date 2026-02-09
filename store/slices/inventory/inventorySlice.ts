import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { InventoryListItem } from '@/modules/inventory/inventory.types';

export interface InventoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface InventoryState {
  data: InventoryListItem[];
  loading: boolean;
  error: string | null;
  filters: InventoryFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    totalSKUs: number;
    lowStockCount: number;
    outOfStockCount: number;
    inStockHealthyCount: number;
  } | null;
}

const initialState: InventoryState = {
  data: [],
  loading: false,
  error: null,
  filters: {
    page: 1,
    limit: 50,
  },
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  },
  stats: null,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    fetchInventoryDataRequest: (state, action: PayloadAction<InventoryFilters | undefined>) => {
      state.loading = true;
      state.error = null;
      if (action.payload) {
        state.filters = { ...state.filters, ...action.payload };
      }
    },
    fetchInventoryDataSuccess: (state, action: PayloadAction<{ items: InventoryListItem[]; pagination: InventoryState['pagination'] }>) => {
      state.loading = false;
      state.data = action.payload.items;
      state.pagination = action.payload.pagination;
      state.error = null;
    },
    fetchInventoryDataFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchInventoryStatsRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchInventoryStatsSuccess: (state, action: PayloadAction<InventoryState['stats']>) => {
      state.loading = false;
      state.stats = action.payload;
      state.error = null;
    },
    fetchInventoryStatsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateStockRequest: (state, action: PayloadAction<{ variantId: string; action: 'set' | 'add' | 'subtract'; quantity: number }>) => {
      state.loading = true;
      state.error = null;
    },
    updateStockSuccess: (state, action: PayloadAction<InventoryListItem>) => {
      state.loading = false;
      state.data = state.data.map((item) =>
        item.variantId === action.payload.variantId ? action.payload : item
      );
      state.error = null;
    },
    updateStockFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const inventoryActions = inventorySlice.actions;
export default inventorySlice.reducer;

