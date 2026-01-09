import { NotFoundError } from '@/lib/errors';
import { findAllTeamMembers, inviteTeamMember as inviteTeamMemberRepo, updateTeamMemberRole as updateTeamMemberRoleRepo, removeTeamMember as removeTeamMemberRepo } from './team.repository';
import type { TeamListResponse, InviteTeamMemberRequest, UpdateTeamMemberRoleRequest, TeamMember } from './team.types';

export async function listTeamMembers(): Promise<TeamListResponse> {
  const members = await findAllTeamMembers();
  return { members };
}

export async function inviteTeamMember(data: InviteTeamMemberRequest): Promise<TeamMember> {
  return await inviteTeamMemberRepo(data);
}

export async function updateTeamMemberRole(userId: string, data: UpdateTeamMemberRoleRequest): Promise<TeamMember> {
  return await updateTeamMemberRoleRepo(userId, data);
}

export async function removeTeamMember(userId: string): Promise<void> {
  await removeTeamMemberRepo(userId);
}

