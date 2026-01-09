import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Settings {
  general: {
    storeName: string;
    supportEmail: string;
    storeDescription: string;
  };
  shipping: {
    standardRate: number;
    expressRate?: number;
    freeShippingThreshold?: number;
  };
  tax: {
    rate: number;
    type: 'vat' | 'sales_tax';
  };
  paymentMethods: {
    stripe: {
      enabled: boolean;
      publicKey?: string;
      webhookSecret?: string;
    };
    paypal: {
      enabled: boolean;
      clientId?: string;
    };
    applePay: {
      enabled: boolean;
    };
    googlePay: {
      enabled: boolean;
    };
  };
}

export interface SettingsState {
  data: Settings | null;
  loading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  data: null,
  loading: false,
  error: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    fetchSettingsRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchSettingsSuccess: (state, action: PayloadAction<Settings>) => {
      state.loading = false;
      state.data = action.payload;
      state.error = null;
    },
    fetchSettingsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateSettingsRequest: (state, action: PayloadAction<Partial<Settings>>) => {
      state.loading = true;
      state.error = null;
    },
    updateSettingsSuccess: (state, action: PayloadAction<Settings>) => {
      state.loading = false;
      state.data = action.payload;
      state.error = null;
    },
    updateSettingsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const settingsActions = settingsSlice.actions;
export default settingsSlice.reducer;

