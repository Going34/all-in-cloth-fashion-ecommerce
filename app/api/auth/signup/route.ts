"use server";
import { errorResponse, successResponse } from '@/lib/response';
import { getAdminDbClient } from '@/lib/adminDb';
import { sendOtpDirectWhatsApp } from '@/services/msg91Service';
import { generateOTP, hashOTP, hashPassword } from '@/lib/otpUtils';
import { normalizeCountryCode } from '@/services/msg91Service';
import type { NextRequest } from 'next/server';

interface SendOTPRequest {
  email: string;
  phone: string;
  name: string;
  password: string;
}

/**
 * POST /api/auth/send-otp
 * Initiates signup with password and sends OTP to phone
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SendOTPRequest;

    // Validate required fields
    if (!body.email || !body.phone || !body.name || !body.password) {
      return errorResponse(new Error('All fields are required: email, phone, name, password'), 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return errorResponse(new Error('Invalid email format'), 400);
    }

    // Validate password length
    if (body.password.length < 8) {
      return errorResponse(new Error('Password must be at least 8 characters long'), 400);
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

    // Check if email already exists and verified
    const { data: existingEmailUser } = await db
      .from('users')
      .select('id, is_phone_verified')
      .eq('email', body.email.toLowerCase())
      .maybeSingle();

    if (existingEmailUser?.is_phone_verified) {
      return errorResponse(
        new Error('Email already registered'),
        409
      );
    }

    // Check if phone already exists and verified
    const { data: existingPhoneUser } = await db
      .from('users')
      .select('id, is_phone_verified')
      .eq('phone', phoneWithCountryCode)
      .maybeSingle();

    if (existingPhoneUser?.is_phone_verified) {
      return errorResponse(
        new Error('Phone number already registered'),
        409
      );
    }

    // Hash the password
    const passwordHash = await hashPassword(body.password);

    // Generate OTP
    const otp = generateOTP(6);
    const otpHash = await hashOTP(otp);

    // OTP expires in 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Clean up old OTPs for this phone
    await db
      .from('otps')
      .delete()
      .eq('phone', phoneWithCountryCode)
      .lt('expires_at', new Date().toISOString());

    // Create OTP record
    const { error: otpError } = await db
      .from('otps')
      .insert({
        phone: phoneWithCountryCode,
        otp_hash: otpHash,
        expires_at: expiresAt,
        attempts: 0,
        verified: false,
      })
      .single();

    if (otpError) {
      console.error('Failed to create OTP record:', otpError);
      return errorResponse(new Error('Failed to generate OTP'), 500);
    }

    // Send OTP via WhatsApp
    try {
      await sendOtpDirectWhatsApp({
        phoneNumber: phoneWithCountryCode.startsWith(countryCode)
          ? phoneWithCountryCode.slice(countryCode.length)
          : normalizedPhone,
        countryCode: countryCode,
        otp: otp,
        templateName: 'code',
        namespace: process.env.MSG91_WHATSAPP_NAMESPACE || 'bf62f283_88ee_46ea_8428_03e63334f780',
      });
    } catch (whatsappError) {
      console.error('Failed to send WhatsApp OTP:', whatsappError);
      return errorResponse(new Error('Failed to send OTP'), 500);
    }

    // Return password hash to client to send back in verify request
    return successResponse({
      success: true,
      otpRequired: true,
      message: 'OTP sent successfully. Please verify your phone number.',
      phone: normalizedPhone,
      expiresIn: 300,
      passwordHash: passwordHash, // Client sends this back in verify-otp
    }, 200);

  } catch (error) {
    console.error('Send OTP error:', error);
    return errorResponse(
      error instanceof Error ? error : new Error('Internal server error'),
      500
    );
  }
}