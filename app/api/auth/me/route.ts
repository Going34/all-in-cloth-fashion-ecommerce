import { errorResponse, successResponse } from '@/lib/response';
import { getAdminDbClient } from '@/lib/adminDb';
import { getSessionCookie, clearSessionCookie } from '@/lib/session';
import { verifySessionToken } from '@/lib/jwt';

export async function GET() {
  try {
    const token = await getSessionCookie();
    if (!token) {
      return errorResponse(new Error('Not authenticated'), 401);
    }

    let payload: { sub: string; phone?: string; email?: string; roles?: string[] };
    try {
      payload = await verifySessionToken(token);
    } catch {
      await clearSessionCookie();
      return errorResponse(new Error('Not authenticated'), 401);
    }

    const db = getAdminDbClient();
    const { data: profile, error } = await db
      .from('users')
      .select('*')
      .eq('id', payload.sub)
      .single();

    if (error || !profile) {
      await clearSessionCookie();
      return errorResponse(new Error('Not authenticated'), 401);
    }

    const { data: rolesRows } = await db
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', payload.sub);

    const roles: string[] = [];
    if (rolesRows) {
      for (const row of rolesRows) {
        const r = row as { roles?: { name?: string } };
        if (r.roles?.name) roles.push(r.roles.name);
      }
    }

    return successResponse({
      user: { ...(profile as Record<string, unknown>), roles },
    });
  } catch (err) {
    return errorResponse(err);
  }
}




