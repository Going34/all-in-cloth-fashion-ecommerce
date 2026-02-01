import { errorResponse, successResponse } from '@/lib/response';
import { getAdminDbClient } from '@/lib/adminDb';
import { verifyOTP } from '@/lib/otpUtils';
import { setSessionCookie } from '@/lib/session';
import { normalizeCountryCode } from '@/services/msg91Service';
import type { NextRequest } from 'next/server';

interface VerifyOTPRequest {
  email: string;
  phone: string;
  name: string;
  otp: string;
  passwordHash: string;
}

/**
 * POST /api/auth/verify-otp
 * Verifies OTP, creates user, and sets session cookie
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as VerifyOTPRequest;

    // Validate required fields
    if (!body.email || !body.phone || !body.name || !body.otp || !body.passwordHash) {
      return errorResponse(
        new Error('All fields are required: email, phone, name, otp, passwordHash'),
        400
      );
    }

    // Validate OTP format
    if (!/^\d{6}$/.test(body.otp)) {
      return errorResponse(new Error('Invalid OTP format'), 400);
    }

    // Normalize phone number
    const countryCode = normalizeCountryCode((body as unknown as { countryCode?: string }).countryCode);
    const normalizedPhone = body.phone.replace(/[^\d]/g, '');
    if (!normalizedPhone || normalizedPhone.length < 10 || normalizedPhone.length > 15) {
      return errorResponse(new Error('Invalid phone number format'), 400);
    }

    const phoneWithCountryCode = normalizedPhone.startsWith(countryCode)
      ? normalizedPhone
      : countryCode + normalizedPhone;
    const db = getAdminDbClient();

    // Fetch the most recent unverified OTP
    const { data: otpRecord, error: otpFetchError } = await db
      .from('otps')
      .select('*')
      .eq('phone', phoneWithCountryCode)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpFetchError) {
      console.error('Failed to fetch OTP:', otpFetchError);
      return errorResponse(new Error('Failed to verify OTP'), 500);
    }

    // OTP not found
    if (!otpRecord) {
      return errorResponse(
        new Error('OTP not found. Please request a new OTP.'),
        404
      );
    }

    // Check if OTP is expired
    if (new Date() > new Date(otpRecord.expires_at)) {
      return errorResponse(
        new Error('OTP has expired. Please request a new OTP.'),
        410
      );
    }

    // Check attempts limit
    const MAX_ATTEMPTS = 5;
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      return errorResponse(
        new Error('Too many failed attempts. Please request a new OTP.'),
        429
      );
    }

    // Verify OTP hash
    const isValidOTP = await verifyOTP(body.otp, otpRecord.otp_hash);

    if (!isValidOTP) {
      // Increment attempts
      const newAttempts = otpRecord.attempts + 1;
      await db
        .from('otps')
        .update({
          attempts: newAttempts,
          updated_at: new Date().toISOString(),
        })
        .eq('id', otpRecord.id);

      const remainingAttempts = MAX_ATTEMPTS - newAttempts;
      return errorResponse(
        new Error(
          remainingAttempts > 0
            ? `Invalid OTP. ${remainingAttempts} attempts remaining.`
            : 'Too many failed attempts. Please request a new OTP.'
        ),
        remainingAttempts > 0 ? 401 : 429
      );
    }

    // Mark OTP as verified
    await db
      .from('otps')
      .update({
        verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', otpRecord.id);

    // Check if email already exists
    const { data: existingEmailUser } = await db
      .from('users')
      .select('id')
      .eq('email', body.email.toLowerCase())
      .maybeSingle();

    if (existingEmailUser) {
      return errorResponse(
        new Error('Email already registered'),
        409
      );
    }

    // Check if phone already exists
    const { data: existingPhoneUser } = await db
      .from('users')
      .select('id')
      .eq('phone', phoneWithCountryCode)
      .maybeSingle();

    if (existingPhoneUser) {
      return errorResponse(
        new Error('Phone number already registered'),
        409
      );
    }

    // Create new user with password hash
    const { data: newUser, error: createUserError } = await db
      .from('users')
      .insert({
        email: body.email.toLowerCase(),
        phone: phoneWithCountryCode,
        name: body.name.trim(),
        password_hash: body.passwordHash,
        is_phone_verified: true,
        is_email_verified: false,
        is_active: true,
      })
      .select('id, email, phone, name, is_phone_verified, is_active')
      .single();

    if (createUserError) {
      console.error('Failed to create user:', createUserError);
      return errorResponse(
        new Error('Failed to complete signup'),
        500
      );
    }

    // Generate session token (use user ID as token for simplicity, or implement JWT)
    const sessionToken = newUser.id;

    // Set session cookie
    try {
      await setSessionCookie(sessionToken);
    } catch (cookieError) {
      console.error('Failed to set session cookie:', cookieError);
      return errorResponse(
        new Error('Failed to create session'),
        500
      );
    }

    return successResponse(
      {
        success: true,
        message: 'Signup successful. You are now authenticated.',
        user: newUser,
      },
      200
    );

  } catch (error) {
    console.error('Verify OTP error:', error);
    return errorResponse(
      error instanceof Error ? error : new Error('Internal server error'),
      500
    );
  }
}