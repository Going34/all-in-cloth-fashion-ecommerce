import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Address, AddressInput } from '@/types';

export interface AddressesState {
  data: Address[];
  loading: boolean;
  error: string | null;
  defaultAddress: Address | null;
}

const initialState: AddressesState = {
  data: [],
  loading: false,
  error: null,
  defaultAddress: null,
};

const addressesSlice = createSlice({
  name: 'addresses',
  initialState,
  reducers: {
    fetchAddressesRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchAddressesSuccess: (state, action: PayloadAction<Address[]>) => {
      state.loading = false;
      state.data = action.payload;
      state.defaultAddress = action.payload.find((addr) => addr.is_default) || null;
      state.error = null;
    },
    fetchAddressesFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchDefaultAddressRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchDefaultAddressSuccess: (state, action: PayloadAction<Address | null>) => {
      state.loading = false;
      state.defaultAddress = action.payload;
      state.error = null;
    },
    fetchDefaultAddressFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    createAddressRequest: (state, action: PayloadAction<AddressInput>) => {
      state.loading = true;
      state.error = null;
    },
    createAddressSuccess: (state, action: PayloadAction<Address>) => {
      state.loading = false;
      state.data.push(action.payload);
      if (action.payload.is_default) {
        state.defaultAddress = action.payload;
        // Remove default from other addresses
        state.data = state.data.map((addr) =>
          addr.id !== action.payload.id ? { ...addr, is_default: false } : addr
        );
      }
      state.error = null;
    },
    createAddressFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateAddressRequest: (state, action: PayloadAction<{ id: string; updates: Partial<AddressInput> }>) => {
      state.loading = true;
      state.error = null;
    },
    updateAddressSuccess: (state, action: PayloadAction<Address>) => {
      state.loading = false;
      state.data = state.data.map((addr) =>
        addr.id === action.payload.id ? action.payload : addr
      );
      if (action.payload.is_default) {
        state.defaultAddress = action.payload;
        // Remove default from other addresses
        state.data = state.data.map((addr) =>
          addr.id !== action.payload.id ? { ...addr, is_default: false } : addr
        );
      }
      state.error = null;
    },
    updateAddressFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    deleteAddressRequest: (state, action: PayloadAction<string>) => {
      state.loading = true;
      state.error = null;
    },
    deleteAddressSuccess: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.data = state.data.filter((addr) => addr.id !== action.payload);
      if (state.defaultAddress?.id === action.payload) {
        state.defaultAddress = null;
      }
      state.error = null;
    },
    deleteAddressFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    setDefaultAddressRequest: (state, action: PayloadAction<string>) => {
      state.loading = true;
      state.error = null;
    },
    setDefaultAddressSuccess: (state, action: PayloadAction<Address>) => {
      state.loading = false;
      state.defaultAddress = action.payload;
      state.data = state.data.map((addr) => ({
        ...addr,
        is_default: addr.id === action.payload.id,
      }));
      state.error = null;
    },
    setDefaultAddressFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // Batch update from userData
    batchUpdateAddresses: (state, action: PayloadAction<Address[]>) => {
      state.data = action.payload;
      state.defaultAddress = action.payload.find((addr) => addr.is_default) || null;
      state.error = null;
    },
  },
});

export const addressesActions = addressesSlice.actions;
export default addressesSlice.reducer;

