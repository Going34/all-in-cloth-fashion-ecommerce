import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@/types';

export interface ProfileState {
  data: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  data: null,
  loading: false,
  error: null,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    fetchProfileRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchProfileSuccess: (state, action: PayloadAction<User>) => {
      state.loading = false;
      state.data = action.payload;
      state.error = null;
    },
    fetchProfileFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateProfileRequest: (state, action: PayloadAction<Partial<Pick<User, 'name' | 'phone'>>>) => {
      state.loading = true;
      state.error = null;
    },
    updateProfileSuccess: (state, action: PayloadAction<User>) => {
      state.loading = false;
      state.data = action.payload;
      state.error = null;
    },
    updateProfileFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // Batch update from userData
    batchUpdateProfile: (state, action: PayloadAction<User>) => {
      state.data = action.payload;
      state.error = null;
    },
  },
});

export const profileActions = profileSlice.actions;
export default profileSlice.reducer;

