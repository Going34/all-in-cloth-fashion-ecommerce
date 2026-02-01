import { errorResponse, successResponse } from '@/lib/response';
import { getAdminDbClient } from '@/lib/adminDb';
import { verifyAccessToken, toE164 } from '@/services/msg91Service';
import { signSessionToken } from '@/lib/jwt';
import { setSessionCookie } from '@/lib/session';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/auth/verify-widget-token
 * 
 * Verifies the access token from MSG91 OTP widget and creates/updates user session
 * 
 * Body:
 * {
 *   "accessToken": "jwt_token_from_otp_widget",
 *   "name": "Optional user name"
 * }
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { accessToken?: string; name?: string }
      | null;

    const accessToken = body?.accessToken?.trim() || '';
    const name = body?.name?.trim() || '';

    if (!accessToken) {
      return errorResponse(new Error('Access token is required'), 400);
    }

    // Verify access token with MSG91
    console.log('[Verify Widget Token] Starting verification');
    console.log('[Verify Widget Token] Token length:', accessToken.length);
    console.log('[Verify Widget Token] Token preview:', accessToken.substring(0, 20) + '...');
    
    let verifyResult;
    try {
      verifyResult = await verifyAccessToken({ accessToken });
      console.log('[Verify Widget Token] Verification result:', {
        verified: verifyResult.verified,
        identifier: verifyResult.identifier,
        phone: verifyResult.phone,
        type: verifyResult.type,
      });
    } catch (error) {
      console.error('[Verify Widget Token] Verification error:', error);
      return errorResponse(
        error instanceof Error ? error : new Error('Token verification failed'),
        400
      );
    }

    if (!verifyResult.verified) {
      console.error('[Verify Widget Token] Token not verified:', verifyResult);
      return errorResponse(
        new Error(verifyResult.message || 'Token verification failed'),
        400
      );
    }

    // Extract phone number from identifier
    let phoneNumber: string | null = null;
    let countryCode = '91';

    if (verifyResult.phone) {
      phoneNumber = verifyResult.phone;
    } else if (verifyResult.identifier) {
      // MSG91 format: countryCode + phoneNumber (e.g., "919999999999")
      const identifier = verifyResult.identifier.replace(/\D/g, '');
      if (identifier.length >= 10) {
        // Extract country code (first 1-3 digits) and phone number
        if (identifier.startsWith('91') && identifier.length === 12) {
          countryCode = '91';
          phoneNumber = `+91${identifier.substring(2)}`;
        } else {
          // Try to parse as E.164 or MSG91 format
          phoneNumber = `+${identifier}`;
        }
      }
    }

    if (!phoneNumber) {
      return errorResponse(
        new Error('Phone number not found in verification result'),
        400
      );
    }

    // Ensure phone is in E.164 format
    const phoneE164 = phoneNumber.startsWith('+') 
      ? phoneNumber 
      : toE164(verifyResult.countryCode || countryCode, phoneNumber.replace(/^\+/, ''));

    const db = getAdminDbClient();

    // Check if user exists
    const { data: existingUser, error: findError } = await db
      .from('users')
      .select('id, phone, is_phone_verified, is_active, email, name')
      .eq('phone', phoneE164)
      .maybeSingle();

    if (findError) throw findError;

    let userId: string;

    if (existingUser) {
      // Existing user - update phone verification status
      userId = existingUser.id;

      if (!existingUser.is_phone_verified) {
        const { error: updateError } = await db
          .from('users')
          .update({ 
            is_phone_verified: true, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', userId);

        if (updateError) throw updateError;
      }

      // Update name if provided and not set
      if (name && !existingUser.name) {
        await db
          .from('users')
          .update({ name, updated_at: new Date().toISOString() })
          .eq('id', userId);
      }
    } else {
      // New user - create account
      userId = uuidv4();

      const { error: insertError } = await db.from('users').insert({
        id: userId,
        email: verifyResult.email || null,
        phone: phoneE164,
        name: name || null,
        is_phone_verified: true,
        is_email_verified: verifyResult.email ? false : false,
        is_active: true,
      });

      if (insertError) throw insertError;

      // Assign default USER role
      const { data: userRole } = await db
        .from('roles')
        .select('id')
        .eq('name', 'USER')
        .single();

      if (userRole) {
        await db.from('user_roles').insert({
          user_id: userId,
          role_id: userRole.id,
        });
      }
    }

    // Fetch roles for session
    const { data: rolesRows } = await db
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', userId);

    const roles: string[] = [];
    if (rolesRows) {
      for (const row of rolesRows) {
        const r = row as { roles?: { name?: string } };
        if (r.roles?.name) roles.push(r.roles.name);
      }
    }

    // Generate JWT session token
    const token = await signSessionToken({
      sub: userId,
      phone: phoneE164,
      roles,
    });

    await setSessionCookie(token);

    return successResponse({
      success: true,
      user: {
        id: userId,
        phone: phoneE164,
        email: verifyResult.email || null,
        name: name || null,
        is_phone_verified: true,
        roles,
      },
      verified: true,
      identifier: verifyResult.identifier,
    });
  } catch (err) {
    console.error('[Verify Widget Token] Error:', err);
    return errorResponse(err);
  }
}

