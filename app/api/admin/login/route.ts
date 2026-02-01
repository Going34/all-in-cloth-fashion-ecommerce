import 'server-only';

import { errorResponse, successResponse } from '@/lib/response';
import { getAdminDbClient } from '@/lib/adminDb';
import { signSessionToken } from '@/lib/jwt';
import { setSessionCookie } from '@/lib/session';
import { verifyPassword } from '@/lib/otpUtils';
import type { NextRequest } from 'next/server';

interface AdminLoginRequest {
  email?: string;
  password?: string;
}

export async function POST(request: NextRequest) {
  try {
    let body: AdminLoginRequest | null = null;
    
    try {
      body = (await request.json()) as AdminLoginRequest;
    } catch {
      return errorResponse(new Error('Invalid request format'), 400);
    }

    const email = body?.email?.trim().toLowerCase() || '';
    const password = body?.password || '';

    if (!email || !password) {
      return errorResponse(new Error('Email and password are required'), 400);
    }

    const db = getAdminDbClient();

    const { data: user, error: userError } = await db
      .from('users')
      .select('id, email, name, password_hash, is_active')
      .eq('email', email)
      .maybeSingle();

    if (userError) {
      console.error('[Admin Login] Error fetching user:', userError);
      return errorResponse(new Error('Login failed'), 500);
    }

    if (!user) {
      return errorResponse(new Error('Invalid email or password'), 401);
    }

    if (!user.password_hash) {
      return errorResponse(
        new Error('Password not set. Please contact administrator.'),
        400
      );
    }

    if (!user.is_active) {
      return errorResponse(new Error('Account is deactivated'), 403);
    }

    const isPasswordValid = await verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      return errorResponse(new Error('Invalid email or password'), 401);
    }

    const { data: rolesRows, error: rolesError } = await db
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('[Admin Login] Error fetching roles:', rolesError);
      return errorResponse(new Error('Login failed'), 500);
    }

    const roles: string[] = [];
    if (rolesRows && Array.isArray(rolesRows)) {
      for (const row of rolesRows) {
        const r = row as { roles?: { name?: string } };
        if (r.roles?.name) {
          roles.push(r.roles.name);
        }
      }
    }

    const isAdmin = roles.includes('ADMIN') || roles.includes('OPS');

    if (!isAdmin) {
      return errorResponse(new Error('Admin access required'), 403);
    }

    const token = await signSessionToken({
      sub: user.id,
      email: user.email || undefined,
      roles,
    });

    await setSessionCookie(token);

    return successResponse({
      success: true,
      message: 'Admin login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles,
      },
    });

  } catch (err) {
    console.error('[Admin Login] Unexpected error:', err);
    const errorMessage = err instanceof Error ? err.message : 'An error occurred during login';
    return errorResponse(new Error(errorMessage), 500);
  }
}

