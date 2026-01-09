import { createSelector } from 'reselect';
import type { RootState } from '../../types';

const selectProfileState = (state: RootState) => state.profile;

export const selectProfile = createSelector([selectProfileState], (profile) => profile.data);
export const selectProfileLoading = createSelector([selectProfileState], (profile) => profile.loading);
export const selectProfileError = createSelector([selectProfileState], (profile) => profile.error);

