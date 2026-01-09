import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Product } from '@/types';

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: 'draft' | 'live';
  sort?: string;
}

export interface UserProductFilters {
  cursor?: string;
  limit?: number;
  categoryId?: string;
  featured?: boolean;
  status?: 'draft' | 'live';
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductsState {
  data: Product[];
  loading: boolean;
  error: string | null;
  filters: ProductFilters;
  pagination: PaginationState;
  selectedProduct: Product | null;
}

const initialState: ProductsState = {
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
  selectedProduct: null,
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    fetchProductsDataRequest: (state, action: PayloadAction<ProductFilters | undefined>) => {
      state.loading = true;
      state.error = null;
      if (action.payload) {
        state.filters = { ...state.filters, ...action.payload };
      }
    },
    fetchProductsDataSuccess: (state, action: PayloadAction<{ products: Product[]; pagination: PaginationState }>) => {
      state.loading = false;
      state.data = action.payload.products;
      state.pagination = action.payload.pagination;
      state.error = null;
    },
    fetchProductsDataFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchProductByIdRequest: (state, action: PayloadAction<string>) => {
      state.loading = true;
      state.error = null;
    },
    fetchProductByIdSuccess: (state, action: PayloadAction<Product>) => {
      state.loading = false;
      state.selectedProduct = action.payload;
      state.error = null;
    },
    fetchProductByIdFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    createProductRequest: (state, action: PayloadAction<any>) => {
      state.loading = true;
      state.error = null;
    },
    createProductSuccess: (state, action: PayloadAction<Product>) => {
      state.loading = false;
      state.data = [action.payload, ...state.data];
      state.error = null;
    },
    createProductFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateProductRequest: (state, action: PayloadAction<{ id: string; data: any }>) => {
      state.loading = true;
      state.error = null;
    },
    updateProductSuccess: (state, action: PayloadAction<Product>) => {
      state.loading = false;
      state.data = state.data.map((p) => (p.id === action.payload.id ? action.payload : p));
      if (state.selectedProduct?.id === action.payload.id) {
        state.selectedProduct = action.payload;
      }
      state.error = null;
    },
    updateProductFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    deleteProductRequest: (state, action: PayloadAction<string>) => {
      state.loading = true;
      state.error = null;
    },
    deleteProductSuccess: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.data = state.data.filter((p) => p.id !== action.payload);
      if (state.selectedProduct?.id === action.payload) {
        state.selectedProduct = null;
      }
      state.error = null;
    },
    deleteProductFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchUserProductsRequest: (state, action: PayloadAction<UserProductFilters | undefined>) => {
      state.loading = true;
      state.error = null;
    },
    fetchUserProductsSuccess: (state, action: PayloadAction<{ products: Product[]; meta?: any }>) => {
      state.loading = false;
      state.data = action.payload.products;
      state.error = null;
    },
    fetchUserProductsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchUserProductByIdRequest: (state, action: PayloadAction<string>) => {
      state.loading = true;
      state.error = null;
    },
    fetchUserProductByIdSuccess: (state, action: PayloadAction<Product>) => {
      state.loading = false;
      state.selectedProduct = action.payload;
      state.error = null;
    },
    fetchUserProductByIdFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const productsActions = productsSlice.actions;
export default productsSlice.reducer;

