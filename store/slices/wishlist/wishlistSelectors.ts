import { createSelector } from 'reselect';
import type { RootState } from '../../types';

const selectWishlistState = (state: RootState) => state.wishlist;

export const selectWishlistItems = createSelector([selectWishlistState], (wishlist) => wishlist.items);
export const selectWishlistLoading = createSelector([selectWishlistState], (wishlist) => wishlist.loading);
export const selectWishlistError = createSelector([selectWishlistState], (wishlist) => wishlist.error);
export const selectWishlistCount = createSelector([selectWishlistItems], (items) => items.length);
