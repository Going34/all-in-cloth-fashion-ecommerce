import { UnauthorizedError, ForbiddenError } from './errors';
import { getSessionCookie } from './session';
import { verifySessionToken } from './jwt';
import { getAdminDbClient } from './adminDb';

export interface AuthUser {
  id: string;
  email: string | null;
  roles?: string[];
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const token = await getSessionCookie();
    if (!token) {
      return null;
    }

    const payload = await verifySessionToken(token);
    const db = getAdminDbClient();

    const { data: profile, error: profileError } = await db
      .from('users')
      .select('id,email')
      .eq('id', payload.sub)
      .single();

    if (profileError || !profile) {
      return null;
    }

    const { data: roles } = await db
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', payload.sub);

    const roleNames = roles?.map((r: any) => r.roles?.name).filter(Boolean) || [];

    return {
      id: profile.id,
      email: profile.email ?? null,
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










