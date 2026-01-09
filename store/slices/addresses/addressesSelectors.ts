import { createSelector } from 'reselect';
import type { RootState } from '../../types';

const selectAddressesState = (state: RootState) => state.addresses;

export const selectAddresses = createSelector([selectAddressesState], (addresses) => addresses.data);
export const selectAddressesLoading = createSelector([selectAddressesState], (addresses) => addresses.loading);
export const selectAddressesError = createSelector([selectAddressesState], (addresses) => addresses.error);
export const selectDefaultAddress = createSelector([selectAddressesState], (addresses) => addresses.defaultAddress);

