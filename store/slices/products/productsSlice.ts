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
  productsCache: Record<string, Product>; // Cache products by ID for quick lookup
  productsLoaded: boolean; // Flag to track if products have been initially loaded
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
  productsCache: {}, // Initialize empty cache
  productsLoaded: false, // Track if products have been loaded
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
      // Update cache with fetched products
      action.payload.products.forEach((product) => {
        state.productsCache[product.id] = product;
      });
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
      // Update cache with fetched product
      state.productsCache[action.payload.id] = action.payload;
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
      // Update cache with new product
      state.productsCache[action.payload.id] = action.payload;
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
      // Update cache with updated product
      state.productsCache[action.payload.id] = action.payload;
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
      // Remove product from cache
      delete state.productsCache[action.payload];
    },
    deleteProductFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchUserProductsRequest: (state, action: PayloadAction<UserProductFilters | undefined>) => {
      // Only set loading to true if products haven't been loaded yet
      if (!state.productsLoaded) {
        state.loading = true;
      }
      state.error = null;
    },
    fetchUserProductsSuccess: (state, action: PayloadAction<{ products: Product[]; meta?: any }>) => {
      state.loading = false;
      state.data = action.payload.products;
      state.error = null;
      state.productsLoaded = true; // Mark products as loaded
      // Update cache with fetched products
      action.payload.products.forEach((product) => {
        state.productsCache[product.id] = product;
      });
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
      // Update cache with fetched product
      state.productsCache[action.payload.id] = action.payload;
    },
    fetchUserProductByIdFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const productsActions = productsSlice.actions;
export default productsSlice.reducer;

