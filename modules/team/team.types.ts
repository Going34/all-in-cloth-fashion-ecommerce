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

export interface TeamListResponse {
  members: TeamMember[];
}

export interface InviteTeamMemberRequest {
  name: string;
  email: string;
  role: AdminRole;
}

export interface UpdateTeamMemberRoleRequest {
  role: AdminRole;
}

