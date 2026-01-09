import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Category } from '@/types';

export interface CategoriesState {
  data: Category[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  createError: string | null;
}

const initialState: CategoriesState = {
  data: [],
  loading: false,
  error: null,
  creating: false,
  createError: null,
};

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    fetchCategoriesDataRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchCategoriesDataSuccess: (state, action: PayloadAction<{ categories: Category[] }>) => {
      state.loading = false;
      state.data = action.payload.categories;
      state.error = null;
    },
    fetchCategoriesDataFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    createCategoryRequest: (state, action: PayloadAction<{ name: string; parent_id?: string | null }>) => {
      state.creating = true;
      state.createError = null;
    },
    createCategorySuccess: (state, action: PayloadAction<{ category: Category }>) => {
      state.creating = false;
      state.data = [...state.data, action.payload.category];
      state.createError = null;
    },
    createCategoryFailure: (state, action: PayloadAction<string>) => {
      state.creating = false;
      state.createError = action.payload;
    },
  },
});

export const categoriesActions = categoriesSlice.actions;
export default categoriesSlice.reducer;

