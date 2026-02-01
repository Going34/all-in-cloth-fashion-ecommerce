import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Product } from '@/types';

export interface WishlistState {
  items: Product[];
  loading: boolean;
  error: string | null;
}

const initialState: WishlistState = {
  items: [],
  loading: false,
  error: null,
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    // API Actions
    fetchWishlistRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchWishlistSuccess: (state, action: PayloadAction<Product[]>) => {
      state.loading = false;
      state.items = action.payload;
      state.error = null;
    },
    fetchWishlistFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    addToWishlistRequest: (state, action: PayloadAction<string>) => {
      state.loading = true;
      state.error = null;
    },
    addToWishlistSuccess: (state, action: PayloadAction<Product>) => {
      state.loading = false;
      const exists = state.items.find((p) => p.id === action.payload.id);
      if (!exists) {
        state.items.push(action.payload);
      }
      state.error = null;
    },
    addToWishlistFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    removeFromWishlistRequest: (state, action: PayloadAction<string>) => {
      state.loading = true;
      state.error = null;
    },
    removeFromWishlistSuccess: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.items = state.items.filter((p) => p.id !== action.payload);
      state.error = null;
    },
    removeFromWishlistFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // Legacy actions for backward compatibility (client-side only)
    toggleWishlist: (state, action: PayloadAction<Product>) => {
      const exists = state.items.find((p) => p.id === action.payload.id);
      if (exists) {
        state.items = state.items.filter((p) => p.id !== action.payload.id);
      } else {
        state.items.push(action.payload);
      }
    },
    removeFromWishlist: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((p) => p.id !== action.payload);
    },
    clearWishlist: (state) => {
      state.items = [];
    },
    // Batch update from userData
    batchUpdateWishlist: (state, action: PayloadAction<Product[]>) => {
      state.items = action.payload;
      state.error = null;
    },
  },
});

export const wishlistActions = wishlistSlice.actions;
export default wishlistSlice.reducer;

