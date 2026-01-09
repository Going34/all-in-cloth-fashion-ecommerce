import { createSelector } from 'reselect';
import type { RootState } from '../../types';

const selectTeamState = (state: RootState) => state.team;

export const selectTeamMembers = createSelector([selectTeamState], (team) => team.data);
export const selectTeamLoading = createSelector([selectTeamState], (team) => team.loading);
export const selectTeamError = createSelector([selectTeamState], (team) => team.error);

