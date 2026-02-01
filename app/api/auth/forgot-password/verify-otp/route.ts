import 'server-only';

import { errorResponse, successResponse } from '@/lib/response';
import { getAdminDbClient } from '@/lib/adminDb';
import { normalizeCountryCode } from '@/services/msg91Service';
import { hashPassword, verifyOTP } from '@/lib/otpUtils';

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { phone?: string; countryCode?: string; otp?: string; newPassword?: string }
      | null;

    const phone = body?.phone?.trim() || '';
    const countryCode = normalizeCountryCode(body?.countryCode);
    const otp = body?.otp?.trim() || '';
    const newPassword = body?.newPassword || '';

    if (!phone || !otp) {
      return errorResponse(new Error('Phone and OTP are required'), 400);
    }

    if (!newPassword || newPassword.length < 6) {
      return errorResponse(new Error('Password must be at least 6 characters'), 400);
    }

    const normalizedPhone = phone.replace(/\D/g, '');
    
    let phoneToSearch: string;
    if (normalizedPhone.startsWith(countryCode)) {
      phoneToSearch = normalizedPhone;
    } else {
      phoneToSearch = countryCode + normalizedPhone;
    }
    
    const db = getAdminDbClient();

    const { data: otpRecord, error: findError } = await db
      .from('otps')
      .select('id, otp_hash, expires_at, attempts, verified')
      .eq('phone', phoneToSearch)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) throw findError;

    if (!otpRecord) {
      return errorResponse(new Error('No active OTP found. Please request a new OTP.'), 404);
    }

    const now = new Date();
    const expiresAt = new Date(otpRecord.expires_at);

    if (now > expiresAt) {
      await db.from('otps').delete().eq('id', otpRecord.id);
      return errorResponse(new Error('OTP has expired. Please request a new OTP.'), 400);
    }

    if (otpRecord.attempts >= 5) {
      await db.from('otps').delete().eq('id', otpRecord.id);
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

    await db.from('otps').update({ verified: true }).eq('id', otpRecord.id);
    await db.from('otps').delete().eq('id', otpRecord.id);

    const { data: existingUser, error: userFindError } = await db
      .from('users')
      .select('id')
      .eq('phone', phoneToSearch)
      .maybeSingle();

    if (userFindError) throw userFindError;

    if (!existingUser) {
      console.error('[Forgot Password Verify OTP] User not found', {
        phoneToSearch,
        normalizedPhone,
        countryCode,
      });
      return errorResponse(new Error('User not found'), 404);
    }

    const passwordHash = await hashPassword(newPassword);

    const { error: updateError } = await db
      .from('users')
      .update({
        password_hash: passwordHash,
        is_phone_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingUser.id);

    if (updateError) throw updateError;

    return successResponse({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (err) {
    return errorResponse(err);
  }
}
