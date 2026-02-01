import 'server-only';

import { errorResponse, successResponse } from '@/lib/response';
import { getAdminDbClient } from '@/lib/adminDb';
import { sendOtpDirectWhatsApp, normalizeCountryCode } from '@/services/msg91Service';
import { generateOTP, hashOTP } from '@/lib/otpUtils';

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { phone?: string; countryCode?: string }
      | null;

    const phone = body?.phone?.trim() || '';
    const countryCode = normalizeCountryCode(body?.countryCode);

    console.log('[Forgot Password Send OTP] Received payload:', {
      phone: phone,
      countryCode: body?.countryCode,
      normalizedCountryCode: countryCode,
    });

    if (!phone) {
      return errorResponse(new Error('Phone number is required'), 400);
    }

    const normalizedPhone = phone.replace(/\D/g, '');

    console.log('[Forgot Password Send OTP] After normalization:', {
      normalizedPhone,
    });

    if (!normalizedPhone || normalizedPhone.length < 10 || normalizedPhone.length > 15) {
      return errorResponse(new Error('Invalid phone number format'), 400);
    }

    const db = getAdminDbClient();

    let existingUser;
    let findError;

    let phoneToSearch: string;
    
    if (normalizedPhone.startsWith(countryCode)) {
      phoneToSearch = normalizedPhone;
    } else {
      phoneToSearch = countryCode + normalizedPhone;
    }

    console.log('[Forgot Password Send OTP] Phone formats:', {
      normalizedPhone,
      countryCode,
      phoneToSearch,
    });

    console.log('[Forgot Password Send OTP] Searching in DB:', phoneToSearch);
    const { data: userFound, error: queryError } = await db
      .from('users')
      .select('id, phone, is_active')
      .eq('phone', phoneToSearch)
      .maybeSingle();

    console.log('[Forgot Password Send OTP] Query result:', {
      found: !!userFound,
      phone: userFound?.phone,
      error: queryError,
    });

    if (queryError) {
      findError = queryError;
    } else {
      existingUser = userFound;
    }

    if (findError) throw findError;

    if (!existingUser) {
      console.error('[Forgot Password Send OTP] User not found with primary search', {
        phoneToSearch,
        normalizedPhone,
        countryCode,
        rawPhone: phone,
        rawCountryCode: body?.countryCode,
      });
      
      const { data: allUsers } = await db
        .from('users')
        .select('id, phone')
        .limit(10);
      
      console.log('[Forgot Password Send OTP] Sample users from DB:', allUsers);
      
      const possibleFormats = [
        phoneToSearch,
        normalizedPhone,
        `+${phoneToSearch}`,
        `+${normalizedPhone}`,
        countryCode + normalizedPhone,
        normalizedPhone.startsWith(countryCode) ? normalizedPhone : countryCode + normalizedPhone,
      ];
      
      console.log('[Forgot Password Send OTP] Trying alternative formats:', possibleFormats);
      
      for (const format of possibleFormats) {
        const { data: altUser } = await db
          .from('users')
          .select('id, phone, is_active')
          .eq('phone', format)
          .maybeSingle();
        
        if (altUser) {
          console.log('[Forgot Password Send OTP] Found user with format:', format, altUser);
          existingUser = altUser;
          break;
        }
      }
      
      if (!existingUser && normalizedPhone.length >= 10) {
        const last10Digits = normalizedPhone.slice(-10);
        console.log('[Forgot Password Send OTP] Trying to find by last 10 digits:', last10Digits);
        
        const { data: usersByLast10 } = await db
          .from('users')
          .select('id, phone, is_active')
          .like('phone', `%${last10Digits}`);
        
        console.log('[Forgot Password Send OTP] Users found by last 10 digits:', usersByLast10);
        
        if (usersByLast10 && usersByLast10.length > 0) {
          existingUser = usersByLast10[0];
          console.log('[Forgot Password Send OTP] Using first match:', existingUser);
        }
      }
      
      if (!existingUser) {
        return errorResponse(new Error('No account found with this phone number'), 404);
      }
    }

    if (existingUser.is_active === false) {
      return errorResponse(new Error('Account is deactivated'), 403);
    }

    const { error: deleteError } = await db
      .from('otps')
      .delete()
      .eq('phone', phoneToSearch)
      .eq('verified', false);

    if (deleteError) throw deleteError;

    const otp = generateOTP(6);
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const { error: insertOtpError } = await db.from('otps').insert({
      phone: phoneToSearch,
      otp_hash: otpHash,
      expires_at: expiresAt.toISOString(),
      attempts: 0,
      verified: false,
    });

    if (insertOtpError) throw insertOtpError;

    try {
      const countryCodeForWhatsApp = countryCode;
      let phoneNumberForWhatsApp: string;

      if (phoneToSearch.startsWith(countryCode)) {
        phoneNumberForWhatsApp = phoneToSearch.slice(countryCode.length);
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
      console.error('[Forgot Password Send OTP] MSG91 WhatsApp API error:', whatsappError);
    }

    return successResponse({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (err) {
    return errorResponse(err);
  }
}
