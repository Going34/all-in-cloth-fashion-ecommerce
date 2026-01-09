import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User, Role } from '@/types';

export interface AuthState {
  user: User & { roles?: Role[] } | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    fetchAuthDataRequest: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchAuthDataSuccess: (state, action: PayloadAction<{ user: AuthState['user']; session: any }>) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.session = action.payload.session;
      state.isAuthenticated = !!action.payload.user;
      state.isAdmin = action.payload.user?.roles?.some(
        (r) => r.name === 'ADMIN' || r.name === 'OPS'
      ) || false;
      state.error = null;
    },
    fetchAuthDataFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
      state.isAdmin = false;
    },
    loginRequest: (state, action: PayloadAction<{ email: string; password: string }>) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: AuthState['user']; session: any }>) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.session = action.payload.session;
      state.isAuthenticated = true;
      state.isAdmin = action.payload.user?.roles?.some(
        (r) => r.name === 'ADMIN' || r.name === 'OPS'
      ) || false;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
    },
    logoutRequest: (state) => {
      state.isLoading = true;
    },
    logoutSuccess: (state) => {
      state.isLoading = false;
      state.user = null;
      state.session = null;
      state.isAuthenticated = false;
      state.isAdmin = false;
      state.error = null;
    },
    logoutFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    refreshUserRequest: (state) => {
      state.isLoading = true;
    },
    refreshUserSuccess: (state, action: PayloadAction<AuthState['user']>) => {
      state.isLoading = false;
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.isAdmin = action.payload?.roles?.some(
        (r) => r.name === 'ADMIN' || r.name === 'OPS'
      ) || false;
    },
    refreshUserFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});

export const authActions = authSlice.actions;
export default authSlice.reducer;

