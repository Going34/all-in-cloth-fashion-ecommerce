import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AdminRole = 'Admin' | 'Ops' | 'Support';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  lastActive: string;
  lastActiveHuman: string;
  createdAt: string;
}

export interface TeamState {
  data: TeamMember[];
  loading: boolean;
  error: string | null;
}

const initialState: TeamState = {
  data: [],
  loading: false,
  error: null,
};

const teamSlice = createSlice({
  name: 'team',
  initialState,
  reducers: {
    fetchTeamDataRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchTeamDataSuccess: (state, action: PayloadAction<{ members: TeamMember[] }>) => {
      state.loading = false;
      state.data = action.payload.members;
      state.error = null;
    },
    fetchTeamDataFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    inviteTeamMemberRequest: (state, action: PayloadAction<{ name: string; email: string; role: AdminRole }>) => {
      state.loading = true;
      state.error = null;
    },
    inviteTeamMemberSuccess: (state, action: PayloadAction<TeamMember>) => {
      state.loading = false;
      state.data = [...state.data, action.payload];
      state.error = null;
    },
    inviteTeamMemberFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateTeamMemberRoleRequest: (state, action: PayloadAction<{ userId: string; role: AdminRole }>) => {
      state.loading = true;
      state.error = null;
    },
    updateTeamMemberRoleSuccess: (state, action: PayloadAction<TeamMember>) => {
      state.loading = false;
      state.data = state.data.map((m) => (m.id === action.payload.id ? action.payload : m));
      state.error = null;
    },
    updateTeamMemberRoleFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    removeTeamMemberRequest: (state, action: PayloadAction<string>) => {
      state.loading = true;
      state.error = null;
    },
    removeTeamMemberSuccess: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.data = state.data.filter((m) => m.id !== action.payload);
      state.error = null;
    },
    removeTeamMemberFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const teamActions = teamSlice.actions;
export default teamSlice.reducer;

