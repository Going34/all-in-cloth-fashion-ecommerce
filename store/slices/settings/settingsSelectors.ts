import { createSelector } from 'reselect';
import type { RootState } from '../../types';

const selectSettingsState = (state: RootState) => state.settings;

export const selectSettings = createSelector([selectSettingsState], (settings) => settings.data);
export const selectSettingsLoading = createSelector([selectSettingsState], (settings) => settings.loading);
export const selectSettingsError = createSelector([selectSettingsState], (settings) => settings.error);

