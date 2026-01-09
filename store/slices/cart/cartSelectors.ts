import { createSelector } from 'reselect';
import type { RootState } from '../../types';

const selectCartState = (state: RootState) => state.cart;

export const selectCartItems = createSelector([selectCartState], (cart) => cart.items);
export const selectTotalItems = createSelector([selectCartItems], (items) =>
  items.reduce((acc, item) => acc + item.quantity, 0)
);
export const selectTotalPrice = createSelector([selectCartItems], (items) =>
  items.reduce((acc, item) => acc + item.price * item.quantity, 0)
);

