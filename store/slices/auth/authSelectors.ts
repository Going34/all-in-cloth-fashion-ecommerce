import { createSelector } from 'reselect';
import type { RootState } from '../../types';

const selectAuthState = (state: RootState) => state.auth;

export const selectUser = createSelector([selectAuthState], (auth) => auth.user);
export const selectSession = createSelector([selectAuthState], (auth) => auth.session);
export const selectIsLoading = createSelector([selectAuthState], (auth) => auth.isLoading);
export const selectIsAuthenticated = createSelector([selectAuthState], (auth) => auth.isAuthenticated);
export const selectIsAdmin = createSelector([selectAuthState], (auth) => auth.isAdmin);
export const selectAuthError = createSelector([selectAuthState], (auth) => auth.error);

