import { getDbClient } from './db';
import { UnauthorizedError, ForbiddenError } from './errors';

export interface AuthUser {
  id: string;
  email: string;
  roles?: string[];
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = await getDbClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id);

    const roleNames = roles?.map((r: any) => r.roles?.name).filter(Boolean) || [];

    return {
      id: user.id,
      email: user.email || '',
      roles: roleNames,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthorizedError('Authentication required');
  }
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  const isAdmin = user.roles?.includes('ADMIN') || user.roles?.includes('OPS');
  if (!isAdmin) {
    throw new ForbiddenError('Admin access required');
  }
  return user;
}

export async function requireRole(role: string): Promise<AuthUser> {
  const user = await requireAuth();
  const hasRole = user.roles?.includes(role);
  if (!hasRole) {
    throw new ForbiddenError(`Role ${role} required`);
  }
  return user;
}





