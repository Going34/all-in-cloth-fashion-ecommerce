import { createSelector } from 'reselect';
import type { RootState } from '../../types';

const selectInventoryState = (state: RootState) => state.inventory;

export const selectInventory = createSelector([selectInventoryState], (inventory) => inventory.data);
export const selectInventoryLoading = createSelector([selectInventoryState], (inventory) => inventory.loading);
export const selectInventoryError = createSelector([selectInventoryState], (inventory) => inventory.error);
export const selectInventoryFilters = createSelector([selectInventoryState], (inventory) => inventory.filters);
export const selectInventoryPagination = createSelector([selectInventoryState], (inventory) => inventory.pagination);
export const selectInventoryStats = createSelector([selectInventoryState], (inventory) => inventory.stats);

