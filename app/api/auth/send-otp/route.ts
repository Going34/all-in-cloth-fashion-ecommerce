import 'server-only';

import { errorResponse, successResponse } from '@/lib/response';
import { getAdminDbClient } from '@/lib/adminDb';
import { sendOtpDirectWhatsApp } from '@/services/msg91Service';
import { generateOTP, hashOTP } from '@/lib/otpUtils';

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { phone?: string }
      | null;

    const phone = body?.phone?.trim() || '';

    if (!phone) {
      return errorResponse(new Error('Phone number is required'), 400);
    }

    const normalizedPhone = phone.replace(/\D/g, '');

    if (!normalizedPhone || normalizedPhone.length < 10 || normalizedPhone.length > 15) {
      return errorResponse(new Error('Invalid phone number format'), 400);
    }

    const db = getAdminDbClient();

    const { error: deleteError } = await db
      .from('otps')
      .delete()
      .eq('phone', normalizedPhone)
      .eq('verified', false);

    if (deleteError) throw deleteError;

    const otp = generateOTP(6);
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const { error: insertError } = await db.from('otps').insert({
      phone: normalizedPhone,
      otp_hash: otpHash,
      expires_at: expiresAt.toISOString(),
      attempts: 0,
      verified: false,
    });

    if (insertError) throw insertError;

    try {
      let countryCode = '91';
      let phoneNumber = normalizedPhone;
      
      if (normalizedPhone.startsWith('91') && normalizedPhone.length >= 12) {
        countryCode = '91';
        phoneNumber = normalizedPhone.slice(2);
      } else if (normalizedPhone.length === 10) {
        countryCode = '91';
        phoneNumber = normalizedPhone;
      }
      
      await sendOtpDirectWhatsApp({
        phoneNumber: phoneNumber,
        countryCode: countryCode,
        otp: otp,
        templateName: 'code',
        namespace: process.env.MSG91_WHATSAPP_NAMESPACE || 'bf62f283_88ee_46ea_8428_03e63334f780',
      });
    } catch (whatsappError) {
      console.error('[Send OTP] MSG91 WhatsApp API error:', whatsappError);
    }

    return successResponse({
      success: true,
      otpRequired: true,
      message: 'OTP sent successfully',
    });
  } catch (err) {
    return errorResponse(err);
  }
}
