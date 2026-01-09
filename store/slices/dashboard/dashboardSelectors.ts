import { createSelector } from 'reselect';
import type { RootState } from '../../types';

const selectDashboardState = (state: RootState) => state.dashboard;

export const selectDashboardStats = createSelector([selectDashboardState], (dashboard) => dashboard.stats);
export const selectSalesChart = createSelector([selectDashboardState], (dashboard) => dashboard.salesChart);
export const selectInventoryAlerts = createSelector([selectDashboardState], (dashboard) => dashboard.inventoryAlerts);
export const selectDashboardLoading = createSelector([selectDashboardState], (dashboard) => dashboard.loading);
export const selectDashboardError = createSelector([selectDashboardState], (dashboard) => dashboard.error);
export const selectDashboardPeriod = createSelector([selectDashboardState], (dashboard) => dashboard.period);

