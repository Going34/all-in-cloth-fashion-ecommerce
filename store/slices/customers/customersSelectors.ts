import { createSelector } from 'reselect';
import type { RootState } from '../../types';

const selectCustomersState = (state: RootState) => state.customers;

export const selectCustomers = createSelector([selectCustomersState], (customers) => customers.data);
export const selectCustomersLoading = createSelector([selectCustomersState], (customers) => customers.loading);
export const selectCustomersError = createSelector([selectCustomersState], (customers) => customers.error);
export const selectCustomersFilters = createSelector([selectCustomersState], (customers) => customers.filters);
export const selectCustomersPagination = createSelector([selectCustomersState], (customers) => customers.pagination);
export const selectSelectedCustomer = createSelector([selectCustomersState], (customers) => customers.selectedCustomer);

