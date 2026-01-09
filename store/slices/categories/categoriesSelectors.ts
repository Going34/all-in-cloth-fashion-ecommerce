import { createSelector } from 'reselect';
import type { RootState } from '../../types';

const selectCategoriesState = (state: RootState) => state.categories;

export const selectCategories = createSelector([selectCategoriesState], (categories) => categories.data);
export const selectCategoriesLoading = createSelector([selectCategoriesState], (categories) => categories.loading);
export const selectCategoriesError = createSelector([selectCategoriesState], (categories) => categories.error);
export const selectCategoriesCreating = createSelector([selectCategoriesState], (categories) => categories.creating);
export const selectCategoriesCreateError = createSelector([selectCategoriesState], (categories) => categories.createError);

