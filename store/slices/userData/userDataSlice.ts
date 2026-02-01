import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User, Order, Address, Product } from '@/types';

export interface UserDataState {
  profile: User | null;
  // kept for backward compatibility but no longer populated by /api/user-data
  orders: Order[];
  addresses: Address[];
  wishlist: Product[];
  loading: boolean;
  error: string | null;
  loaded: boolean; // Flag to track if data has been loaded
}

const initialState: UserDataState = {
  profile: null,
  orders: [],
  addresses: [],
  wishlist: [],
  loading: false,
  error: null,
  loaded: false,
};

const userDataSlice = createSlice({
  name: 'userData',
  initialState,
  reducers: {
    fetchUserDataRequest: (state) => {
      // Only set loading to true if data hasn't been loaded yet
      if (!state.loaded) {
        state.loading = true;
      }
      state.error = null;
    },
    fetchUserDataSuccess: (state, action: PayloadAction<{
      profile: User | null;
      orders?: Order[];
      addresses: Address[];
      wishlist: Product[];
    }>) => {
      state.loading = false;
      state.profile = action.payload.profile;
      state.orders = action.payload.orders || [];
      state.addresses = action.payload.addresses;
      state.wishlist = action.payload.wishlist;
      state.error = null;
      state.loaded = true; // Mark data as loaded
    },
    fetchUserDataFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // Action to reset loaded flag (useful for logout or refresh)
    resetUserData: (state) => {
      state.profile = null;
      state.orders = [];
      state.addresses = [];
      state.wishlist = [];
      state.loaded = false;
      state.error = null;
    },
  },
});

export const userDataActions = userDataSlice.actions;
export default userDataSlice.reducer;




