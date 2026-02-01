import 'server-only';

import { errorResponse, successResponse } from '@/lib/response';
import { getAdminDbClient } from '@/lib/adminDb';
import { signSessionToken } from '@/lib/jwt';
import { setSessionCookie } from '@/lib/session';
import { toE164, normalizeCountryCode } from '@/services/msg91Service';
import { verifyOTP } from '@/lib/otpUtils';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { phone?: string; countryCode?: string; otp?: string; name?: string }
      | null;

    const phone = body?.phone?.trim() || '';
    const countryCode = normalizeCountryCode(body?.countryCode);
    const otp = body?.otp?.trim() || '';
    const name = body?.name?.trim() || '';

    if (!phone || !otp) {
      return errorResponse(new Error('Phone number and OTP are required'), 400);
    }

    if (!/^\d{6}$/.test(otp)) {
      return errorResponse(new Error('OTP must be 6 digits'), 400);
    }

    const normalizedPhone = phone.replace(/\D/g, '');
    const db = getAdminDbClient();

    console.log('[Verify OTP] Starting verification', { normalizedPhone, otpLength: otp.length });

    const { data: otpRecord, error: findError } = await db
      .from('otps')
      .select('id, otp_hash, expires_at, attempts, verified')
      .eq('phone', normalizedPhone)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) {
      console.error('[Verify OTP] Database error finding OTP:', findError);
      if (findError.message?.includes('relation') || findError.message?.includes('does not exist')) {
        throw new Error('OTP table does not exist. Please run database migrations: npx supabase db push');
      }
      throw findError;
    }

    if (!otpRecord) {
      return errorResponse(new Error('No active OTP found. Please request a new OTP.'), 404);
    }

    const now = new Date();
    const expiresAt = new Date(otpRecord.expires_at);

    if (now > expiresAt) {
      await db
        .from('otps')
        .delete()
        .eq('id', otpRecord.id);

      return errorResponse(new Error('OTP has expired. Please request a new OTP.'), 400);
    }

    if (otpRecord.attempts >= 5) {
      await db
        .from('otps')
        .delete()
        .eq('id', otpRecord.id);

      return errorResponse(new Error('Maximum verification attempts exceeded. Please request a new OTP.'), 429);
    }

    const isValid = await verifyOTP(otp, otpRecord.otp_hash);

    if (!isValid) {
      const { error: updateError } = await db
        .from('otps')
        .update({ attempts: otpRecord.attempts + 1 })
        .eq('id', otpRecord.id);

      if (updateError) throw updateError;

      const remainingAttempts = 5 - (otpRecord.attempts + 1);
      return errorResponse(
        new Error(`Invalid OTP. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`),
        400
      );
    }

    await db
      .from('otps')
      .update({ verified: true })
      .eq('id', otpRecord.id);

    await db
      .from('otps')
      .delete()
      .eq('id', otpRecord.id);

    const phoneE164 = toE164(countryCode, phone);
    console.log('[Verify OTP] Phone E164 format:', phoneE164);

    const { data: existingUser, error: userFindError } = await db
      .from('users')
      .select('id, phone, name, is_phone_verified, is_active')
      .eq('phone', phoneE164)
      .maybeSingle();

    console.log('[Verify OTP] User lookup result:', { found: !!existingUser, error: userFindError });

    if (userFindError) throw userFindError;

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;

      if (!existingUser.is_phone_verified) {
        const { error: updateError } = await db
          .from('users')
          .update({ is_phone_verified: true, updated_at: new Date().toISOString() })
          .eq('id', userId);

        if (updateError) throw updateError;
      }

      if (name && !existingUser.name) {
        await db
          .from('users')
          .update({ name, updated_at: new Date().toISOString() })
          .eq('id', userId);
      }
    } else {
      userId = uuidv4();

      const { error: insertError } = await db.from('users').insert({
        id: userId,
        email: null,
        phone: phoneE164,
        name: name || null,
        is_phone_verified: true,
        is_email_verified: false,
        is_active: true,
      });

      if (insertError) {
        console.error('[Verify OTP] Error inserting user:', insertError);
        if (insertError.code === '42501') {
          throw new Error('Row-level security policy violation. Please check database policies.');
        }
        throw insertError;
      }

      const { data: userRole, error: roleError } = await db
        .from('roles')
        .select('id')
        .eq('name', 'USER')
        .maybeSingle();

      if (roleError) {
        console.error('[Verify OTP] Error fetching USER role:', roleError);
      }

      if (userRole) {
        const { error: userRoleInsertError } = await db.from('user_roles').insert({
          user_id: userId,
          role_id: userRole.id,
        });

        if (userRoleInsertError) {
          console.error('[Verify OTP] Error assigning USER role:', userRoleInsertError);
        }
      } else {
        console.warn('[Verify OTP] USER role not found in database');
      }
    }

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
        name: name || null,
        is_phone_verified: true,
        roles,
      },
    });
  } catch (err) {
    console.error('[Verify OTP] Error:', err);
    if (err instanceof Error) {
      console.error('[Verify OTP] Error message:', err.message);
      console.error('[Verify OTP] Error stack:', err.stack);
      
      if (err.message.includes('does not exist') || err.message.includes('relation')) {
        return errorResponse(
          new Error('Database table not found. Please run migrations: npx supabase db push'),
          500
        );
      }
    }
    return errorResponse(err);
  }
}
