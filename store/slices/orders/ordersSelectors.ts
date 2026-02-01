import { createSelector } from 'reselect';
import type { RootState } from '../../types';

const selectOrdersState = (state: RootState) => state.orders;

export const selectOrders = createSelector([selectOrdersState], (orders) => orders.data);
export const selectOrdersLoading = createSelector([selectOrdersState], (orders) => orders.loading);
export const selectOrdersLoadingMore = createSelector([selectOrdersState], (orders) => orders.loadingMore);
export const selectOrdersError = createSelector([selectOrdersState], (orders) => orders.error);
export const selectOrdersFilters = createSelector([selectOrdersState], (orders) => orders.filters);
export const selectOrdersPagination = createSelector([selectOrdersState], (orders) => orders.pagination);
export const selectSelectedOrder = createSelector([selectOrdersState], (orders) => orders.selectedOrder);
export const selectOrdersHasMore = createSelector([selectOrdersState], (orders) => orders.historyHasMore);

