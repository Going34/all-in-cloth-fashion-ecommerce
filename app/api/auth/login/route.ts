import 'server-only';

import { errorResponse, successResponse } from '@/lib/response';
import { getAdminDbClient } from '@/lib/adminDb';
import { signSessionToken } from '@/lib/jwt';
import { setSessionCookie } from '@/lib/session';
import { normalizeCountryCode } from '@/services/msg91Service';
import { verifyPassword } from '@/lib/otpUtils';
import type { NextRequest } from 'next/server';

interface LoginRequest {
  identifier?: string;
  password?: string;
  countryCode?: string;
}

function isValidEmail(str: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str);
}

function isPhoneNumber(str: string): boolean {
  const phoneRegex = /^\d{10,15}$/;
  return phoneRegex.test(str.replace(/\D/g, ''));
}

export async function POST(request: NextRequest) {
  try {
    let body: LoginRequest | null = null;
    
    try {
      body = (await request.json()) as LoginRequest;
    } catch {
      return errorResponse(new Error('Invalid request format'), 400);
    }

    const identifier = body?.identifier?.trim() || '';
    const password = body?.password || '';
    const countryCode = normalizeCountryCode(body?.countryCode);

    // Validate inputs
    if (!identifier || !password) {
      return errorResponse(new Error('Email/phone number and password are required'), 400);
    }

    const db = getAdminDbClient();
    let user;

    // Try to find user by email
    if (isValidEmail(identifier)) {
      const { data: emailUser, error: emailError } = await db
        .from('users')
        .select('id, email, phone, name, password_hash, is_active')
        .eq('email', identifier.toLowerCase())
        .maybeSingle();

      if (emailError) {
        console.error('[Login] Error fetching email user:', emailError);
        throw emailError;
      }
      
      if (!emailUser) {
        return errorResponse(new Error('Invalid email or password'), 401);
      }
      
      user = emailUser;
    } 
    // Try to find user by phone number
    else if (isPhoneNumber(identifier)) {
      const normalizedPhone = identifier.replace(/\D/g, '');
      
      let phoneToSearch: string;
      if (normalizedPhone.startsWith(countryCode)) {
        phoneToSearch = normalizedPhone;
      } else {
        phoneToSearch = countryCode + normalizedPhone;
      }

      const { data: phoneUser, error: phoneError } = await db
        .from('users')
        .select('id, email, phone, name, password_hash, is_active')
        .eq('phone', phoneToSearch)
        .maybeSingle();

      if (phoneError) {
        console.error('[Login] Error fetching phone user:', phoneError);
        throw phoneError;
      }
      
      if (!phoneUser) {
        return errorResponse(new Error('Invalid phone or password'), 401);
      }
      
      user = phoneUser;
    } 
    // Invalid identifier format
    else {
      console.error('[Login] Invalid identifier format:', identifier);
      return errorResponse(new Error('Invalid email or phone number format'), 400);
    }

    // Double-check user exists
    if (!user || !user.id) {
      return errorResponse(new Error('Invalid email or password'), 401);
    }

    // Check if password hash exists
    if (!user.password_hash) {
      return errorResponse(
        new Error('Password not set. Please use password reset to set a password.'),
        400
      );
    }

    // Check if account is active
    if (!user.is_active) {
      return errorResponse(new Error('Account is deactivated. Please contact support.'), 403);
    }

    // Verify password - await the async function
    const storedHash = user.password_hash;
    const isPasswordValid = await verifyPassword(password, storedHash);

    if (!isPasswordValid) {
      return errorResponse(new Error('Invalid email or password'), 401);
    }

    // Fetch user roles
    const { data: rolesRows, error: rolesError } = await db
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('[Login] Error fetching roles:', rolesError);
      // Don't fail login if roles fail to load, just use empty array
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

    // Sign session token
    const token = await signSessionToken({
      sub: user.id,
      email: user.email || undefined,
      phone: user.phone || undefined,
      roles,
    });

    // Set session cookie
    await setSessionCookie(token);

    // Return success response with user data
    return successResponse({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        roles: roles.length > 0 ? roles : undefined,
      },
    });

  } catch (err) {
    console.error('[Login] Unexpected error:', err);
    
    // Don't expose internal error details to client
    const errorMessage = err instanceof Error ? err.message : 'An error occurred during login';
    return errorResponse(new Error(errorMessage), 500);
  }
}