import 'server-only';

import { errorResponse, successResponse } from '@/lib/response';
import { getAdminDbClient } from '@/lib/adminDb';
import { generateOTP, hashOTP } from '@/lib/otpUtils';
import { sendOtpDirectWhatsApp, normalizeCountryCode } from '@/services/msg91Service';

function toMsg91MobileLoose(countryCode: string, phoneNumber: string) {
  const cc = normalizeCountryCode(countryCode);
  const digits = phoneNumber.trim().replace(/\D/g, '');
  const pn = digits.startsWith(cc) ? digits.slice(cc.length) : digits;
  return `${cc}${pn}`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | {
          email?: string;
          phone?: string;
          countryCode?: string;
        }
      | null;

    const email = body?.email?.trim() || '';
    const phone = body?.phone?.trim() || '';
    const countryCode = normalizeCountryCode(body?.countryCode);

    if (!phone) {
      return errorResponse(new Error('Phone number is required'), 400);
    }

    const normalizedPhone = phone.replace(/\D/g, '');

    if (!normalizedPhone || normalizedPhone.length < 10 || normalizedPhone.length > 15) {
      return errorResponse(new Error('Invalid phone number format'), 400);
    }

    const db = getAdminDbClient();

    const phoneToStore = toMsg91MobileLoose(countryCode, normalizedPhone);

    console.log('[Signup Resend OTP] Sending OTP without user check:', {
      email,
      phoneToStore,
      normalizedPhone,
      countryCode,
    });

    // Delete any existing unverified OTPs for this phone
    const { error: deleteError } = await db
      .from('otps')
      .delete()
      .eq('phone', phoneToStore)
      .eq('verified', false);

    if (deleteError) throw deleteError;

    // Generate and store new OTP
    const otp = generateOTP(6);
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const { error: insertOtpError } = await db.from('otps').insert({
      phone: phoneToStore,
      otp_hash: otpHash,
      expires_at: expiresAt.toISOString(),
      attempts: 0,
      verified: false,
    });

    if (insertOtpError) throw insertOtpError;

    // Send OTP via WhatsApp
    try {
      const countryCodeForWhatsApp = countryCode;
      let phoneNumberForWhatsApp: string;

      if (normalizedPhone.startsWith(countryCode)) {
        phoneNumberForWhatsApp = normalizedPhone.slice(countryCode.length);
      } else {
        phoneNumberForWhatsApp = normalizedPhone;
      }

      await sendOtpDirectWhatsApp({
        phoneNumber: phoneNumberForWhatsApp,
        countryCode: countryCodeForWhatsApp,
        otp: otp,
        templateName: 'code',
        namespace: process.env.MSG91_WHATSAPP_NAMESPACE || 'bf62f283_88ee_46ea_8428_03e63334f780',
      });
    } catch (whatsappError) {
      console.error('[Signup Resend OTP] MSG91 WhatsApp API error:', whatsappError);
    }

    return successResponse({
      success: true,
      message: 'OTP resent successfully. Please check your phone.',
    });
  } catch (err) {
    console.error('[Signup Resend OTP] Error:', err);
    return errorResponse(err);
  }
}
