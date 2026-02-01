import { createSelector } from 'reselect';
import type { RootState } from '../../types';

const selectUserDataState = (state: RootState) => state.userData;

export const selectUserData = createSelector([selectUserDataState], (userData) => userData);
export const selectUserProfile = createSelector([selectUserDataState], (userData) => userData.profile);
export const selectUserOrders = createSelector([selectUserDataState], (userData) => userData.orders);
export const selectUserAddresses = createSelector([selectUserDataState], (userData) => userData.addresses);
export const selectUserWishlist = createSelector([selectUserDataState], (userData) => userData.wishlist);
export const selectUserDataLoading = createSelector([selectUserDataState], (userData) => userData.loading);
export const selectUserDataError = createSelector([selectUserDataState], (userData) => userData.error);
export const selectUserDataLoaded = createSelector([selectUserDataState], (userData) => userData.loaded);




