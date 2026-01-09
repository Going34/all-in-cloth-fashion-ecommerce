import { getDbClient } from '@/lib/db';
import type { TeamMember, InviteTeamMemberRequest, UpdateTeamMemberRoleRequest } from './team.types';

const roleMapping: Record<string, string> = {
  Admin: 'ADMIN',
  Ops: 'OPS',
  Support: 'USER',
};

const reverseRoleMapping: Record<string, string> = {
  ADMIN: 'Admin',
  OPS: 'Ops',
  USER: 'Support',
};

export async function findAllTeamMembers(): Promise<TeamMember[]> {
  const supabase = await getDbClient();

  const { data: userRoles, error } = await supabase
    .from('user_roles')
    .select(`
      user_id,
      users!user_roles_user_id_fkey (
        id,
        email,
        name,
        created_at
      ),
      roles!user_roles_role_id_fkey (
        name
      )
    `);

  if (error) {
    throw new Error(`Failed to fetch team members: ${error.message}`);
  }

  const members: TeamMember[] = ((userRoles as any[]) || [])
    .filter((ur) => {
      const roleName = ur.roles?.name;
      return roleName === 'ADMIN' || roleName === 'OPS' || roleName === 'USER';
    })
    .map((ur) => {
      const user = ur.users;
      const roleName = ur.roles?.name || 'USER';
      const displayRole = reverseRoleMapping[roleName] || 'Support';

      return {
        id: user.id,
        name: user.name || '',
        email: user.email,
        role: displayRole as TeamMember['role'],
        lastActive: user.updated_at || user.created_at || new Date().toISOString(),
        lastActiveHuman: 'Recently',
        createdAt: user.created_at || '',
      };
    });

  return members;
}

export async function inviteTeamMember(data: InviteTeamMemberRequest): Promise<TeamMember> {
  const supabase = await getDbClient();

  const roleName = roleMapping[data.role] || 'USER';

  const { data: role, error: roleError } = await supabase
    .from('roles')
    .select('id')
    .eq('name', roleName)
    .single();

  if (roleError || !role) {
    throw new Error(`Failed to find role: ${roleError?.message || 'Role not found'}`);
  }

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: data.email,
    password: Math.random().toString(36).slice(-12),
    email_confirm: true,
    user_metadata: {
      name: data.name,
    },
  });

  if (authError || !authUser.user) {
    throw new Error(`Failed to create user: ${authError?.message || 'Unknown error'}`);
  }

  const { error: userError } = await supabase.from('users').insert({
    id: authUser.user.id,
    email: data.email,
    name: data.name,
    is_active: true,
  });

  if (userError) {
    throw new Error(`Failed to create user record: ${userError.message}`);
  }

  const { error: userRoleError } = await supabase.from('user_roles').insert({
    user_id: authUser.user.id,
    role_id: role.id,
  });

  if (userRoleError) {
    throw new Error(`Failed to assign role: ${userRoleError.message}`);
  }

  return {
    id: authUser.user.id,
    name: data.name,
    email: data.email,
    role: data.role,
    lastActive: new Date().toISOString(),
    lastActiveHuman: 'Just now',
    createdAt: new Date().toISOString(),
  };
}

export async function updateTeamMemberRole(
  userId: string,
  data: UpdateTeamMemberRoleRequest
): Promise<TeamMember> {
  const supabase = await getDbClient();

  const roleName = roleMapping[data.role] || 'USER';

  const { data: role, error: roleError } = await supabase
    .from('roles')
    .select('id')
    .eq('name', roleName)
    .single();

  if (roleError || !role) {
    throw new Error(`Failed to find role: ${roleError?.message || 'Role not found'}`);
  }

  await supabase.from('user_roles').delete().eq('user_id', userId);

  const { error: insertError } = await supabase.from('user_roles').insert({
    user_id: userId,
    role_id: role.id,
  });

  if (insertError) {
    throw new Error(`Failed to update role: ${insertError.message}`);
  }

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (!user) {
    throw new Error('User not found');
  }

  return {
    id: user.id,
    name: user.name || '',
    email: user.email,
    role: data.role,
    lastActive: user.updated_at || user.created_at || new Date().toISOString(),
    lastActiveHuman: 'Recently',
    createdAt: user.created_at || '',
  };
}

export async function removeTeamMember(userId: string): Promise<void> {
  const supabase = await getDbClient();

  const { data: admins } = await supabase
    .from('user_roles')
    .select('user_id, roles!user_roles_role_id_fkey (name)')
    .eq('roles.name', 'ADMIN');

  if (admins && admins.length === 1 && (admins[0] as any).user_id === userId) {
    throw new Error('Cannot remove the last admin user');
  }

  await supabase.from('user_roles').delete().eq('user_id', userId);
  await supabase.from('users').update({ is_active: false }).eq('id', userId);
}

