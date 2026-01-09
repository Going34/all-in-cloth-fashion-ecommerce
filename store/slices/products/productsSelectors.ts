import { createSelector } from 'reselect';
import type { RootState } from '../../types';
import type { Product } from '@/types';

const selectProductsState = (state: RootState) => state.products;

export const selectProducts = createSelector([selectProductsState], (products) => products.data);
export const selectProductsLoading = createSelector([selectProductsState], (products) => products.loading);
export const selectProductsError = createSelector([selectProductsState], (products) => products.error);
export const selectProductsFilters = createSelector([selectProductsState], (products) => products.filters);
export const selectProductsPagination = createSelector([selectProductsState], (products) => products.pagination);
export const selectSelectedProduct = createSelector([selectProductsState], (products) => products.selectedProduct);

export const selectFilteredProducts = createSelector(
  [selectProducts, selectProductsFilters],
  (products, filters) => {
    let filtered = [...products];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.category) {
      filtered = filtered.filter((p) =>
        p.categories?.some((c) => c.name === filters.category)
      );
    }

    if (filters.status) {
      filtered = filtered.filter((p) => p.status === filters.status);
    }

    return filtered;
  }
);

