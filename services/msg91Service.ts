import 'server-only';

type Msg91WidgetSendOtpResponse = {
  type?: string;
  message?: string;
  reqId?: string;
};

type Msg91WidgetVerifyOtpResponse = {
  type?: string;
  message?: string;
  useraccess?: string;
};

function getAuthKey() {
  const key = process.env.MSG91_AUTH_KEY;
  if (!key) {
    throw new Error('MSG91_AUTH_KEY not set');
  }
  return key;
}

function getWidgetId() {
  const widgetId = process.env.MSG91_WIDGET_ID;
  if (!widgetId) {
    throw new Error('MSG91_WIDGET_ID not set. Create a widget in MSG91 Dashboard → OTP → Widget');
  }
  return widgetId;
}

export function normalizeCountryCode(countryCode: string | undefined) {
  const raw = (countryCode || '').trim();
  const digits = raw.replace(/^\+/, '').replace(/\D/g, '');
  return digits || '91';
}

export function normalizePhoneNumber(phoneNumber: string) {
  return phoneNumber.trim().replace(/\D/g, '');
}

export function toE164(countryCode: string, phoneNumber: string) {
  const cc = normalizeCountryCode(countryCode);
  const pn = normalizePhoneNumber(phoneNumber);
  return `+${cc}${pn}`;
}

export function toMsg91Mobile(countryCode: string, phoneNumber: string) {
  const cc = normalizeCountryCode(countryCode);
  const pn = normalizePhoneNumber(phoneNumber);
  return `${cc}${pn}`;
}

/**
 * Send OTP using MSG91 OTP API (as per provided implementation)
 * Documentation: https://docs.msg91.com/p/tf9Ght1u/otp/send-otp
 */
export async function sendOtp(params: {
  phoneNumber: string;
  countryCode?: string;
  captchaToken?: string; // Kept for compatibility, though not used in provided implementation
}): Promise<Msg91WidgetSendOtpResponse & { reqId?: string; phone?: string }> {
  const authkey = getAuthKey();
  const widgetId = getWidgetId();
  
  // Format: countryCode + phoneNumber (e.g., "919999999999")
  // The provided implementation removes + and uses countryCode + phone
  const identifier = toMsg91Mobile(params.countryCode || '91', params.phoneNumber);

  console.log('[MSG91] Sending OTP');
  console.log('[MSG91] Phone:', identifier);
  console.log('[MSG91] Widget ID:', widgetId);
  console.log('[MSG91] Timestamp:', new Date().toISOString());

  // Using the endpoint from provided send-otp.js
  const res = await fetch('https://api.msg91.com/apiv5/otp/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'authkey': authkey,
    },
    body: JSON.stringify({
      widgetId: widgetId,
      identifier: identifier
    }),
  });

  let data: Record<string, unknown> = {};
  try {
    data = await res.json() as Record<string, unknown>;
  } catch (e) {
    console.error('[MSG91] Failed to parse response JSON', e);
  }

  console.log(`[MSG91] Response Status: ${res.status}`);
  console.log(`[MSG91] Response Body:`, data);

  if (data.type === 'success') {
    console.log(`[MSG91] ✅ OTP Sent Successfully`);
    console.log(`[MSG91] Request ID: ${data.message}`);
    
    return {
      type: 'success',
      message: 'OTP sent successfully',
      reqId: String(data.message), // MSG91 returns request ID in message field for success
      phone: identifier
    };
  } else {
    console.log(`[MSG91] ❌ OTP Send Failed`);
    console.log(`[MSG91] Error:`, data);

    throw new Error(
      (data.message as string) || 'MSG91 API returned error'
    );
  }
}

/**
 * Verify OTP using MSG91 OTP API (as per provided implementation)
 * Documentation: https://docs.msg91.com/p/tf9Ght1u/otp/verify-otp
 * 
 * Note: Uses mobile number + otp for verification, not reqId
 */
export async function verifyOtp(params: {
  otp: string;
  phoneNumber: string;
  countryCode?: string;
  reqId?: string; // Optional/unused in this implementation but kept for signature compatibility
}): Promise<Msg91WidgetVerifyOtpResponse> {
  const authkey = getAuthKey();
  const otp = params.otp.trim();
  
  // Format phone number
  const mobile = toMsg91Mobile(params.countryCode || '91', params.phoneNumber);

  console.log(`[MSG91] Verifying OTP`);
  console.log(`[MSG91] Phone: ${mobile}`);
  console.log(`[MSG91] OTP: ${otp}`);

  // Using the endpoint from provided verify-otp.js
  const res = await fetch('https://api.msg91.com/apiv5/otp/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'authkey': authkey,
    },
    body: JSON.stringify({
      mobile: mobile,
      otp: otp
    }),
  });

  let data: Record<string, unknown> = {};
  try {
    data = await res.json() as Record<string, unknown>;
  } catch (e) {
    console.error('[MSG91] Failed to parse verify response JSON', e);
  }

  console.log(`[MSG91] Verify Response Status: ${res.status}`);
  console.log(`[MSG91] Verify Response Body:`, data);

  if (data.type === 'success') {
    console.log(`[MSG91] ✅ OTP Verified Successfully`);
    return {
      type: 'success',
      message: 'OTP verified successfully',
    };
  } else {
    console.log(`[MSG91] ❌ OTP Verification Failed`);
    console.log(`[MSG91] Error:`, data);
    
    throw new Error((data.message as string) || 'Invalid or expired OTP');
  }
}

/**
 * Retry OTP using MSG91 Widget API
 * Documentation: https://docs.msg91.com/otp-widget/retry-otp
 * 
 * Use this to resend OTP via a different channel (SMS or WhatsApp)
 */
export async function retryOtp(params: {
  reqId: string;
  retryChannel?: string; // '1' for SMS, '2' for WhatsApp (depends on widget config)
}): Promise<{ type?: string; message?: string }> {
  const authkey = getAuthKey();
  const widgetId = getWidgetId();

  const res = await fetch('https://api.msg91.com/api/v5/widget/retryOtp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'authkey': authkey,
    },
    body: JSON.stringify({
      widgetId,
      reqId: params.reqId,
      ...(params.retryChannel && { retryChannel: params.retryChannel }),
    }),
  });

  let data: Record<string, unknown> = {};
  try {
    const text = await res.text();
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    data = {};
  }

  if (!res.ok || data.type === 'error') {
    const errorMsg =
      (typeof data?.message === 'string' ? data.message : null) ||
      `HTTP ${res.status}`;
    throw new Error(`MSG91 retry OTP failed: ${errorMsg}`);
  }

  return {
    type: data.type as string | undefined,
    message: data.message as string | undefined,
  };
}

/**
 * Verify Access Token from MSG91 OTP Widget
 * Documentation: https://control.msg91.com/api/v5/widget/verifyAccessToken
 * 
 * This verifies the JWT token received from the MSG91 OTP widget after successful verification.
 * The token contains user identifier information.
 * 
 * Required env vars:
 * - MSG91_AUTH_KEY: Your MSG91 authentication key
 */
export type Msg91VerifyAccessTokenResponse = {
  type?: string;
  message?: string;
  identifier?: string; // Phone number or email that was verified
  phone?: string;
  email?: string;
  countryCode?: string;
  verified?: boolean;
  expiresAt?: string;
};

export async function verifyAccessToken(params: {
  accessToken: string;
}): Promise<Msg91VerifyAccessTokenResponse> {
  const authkey = getAuthKey();
  const accessToken = params.accessToken.trim();

  if (!accessToken) {
    throw new Error('Access token is required');
  }

  console.log('[MSG91] Verifying access token from widget');

  // MSG91 verifyAccessToken API format
  // Documentation: https://control.msg91.com/api/v5/widget/verifyAccessToken
  const requestBody = {
    authkey,
    'access-token': accessToken,
  };

  console.log('[MSG91] Verifying access token request:', {
    authkeyLength: authkey.length,
    tokenLength: accessToken.length,
    tokenPreview: accessToken.substring(0, 20) + '...',
  });

  const res = await fetch('https://control.msg91.com/api/v5/widget/verifyAccessToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  let data: Record<string, unknown> = {};
  try {
    const text = await res.text();
    console.log('[MSG91] Verify token response status:', res.status);
    console.log('[MSG91] Verify token response body:', text);
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    data = {};
  }

  if (!res.ok || data.type === 'error') {
    const errorMsg =
      (typeof data?.message === 'string' ? data.message : null) ||
      (typeof data?.error === 'string' ? data.error : null) ||
      `HTTP ${res.status}`;
    
    if (res.status === 401) {
      throw new Error(
        `MSG91 Token Verification Failed (401): ${errorMsg}. ` +
        `Check: 1) MSG91_AUTH_KEY is correct, 2) Token is valid and not expired. ` +
        `Response: ${JSON.stringify(data)}`
      );
    }

    throw new Error(`MSG91 verify access token failed: ${errorMsg}. Response: ${JSON.stringify(data)}`);
  }

  return {
    type: data.type as string | undefined,
    message: data.message as string | undefined,
    identifier: data.identifier as string | undefined,
    phone: data.phone as string | undefined,
    email: data.email as string | undefined,
    countryCode: data.countryCode as string | undefined,
    verified: data.verified as boolean | undefined ?? true,
    expiresAt: data.expiresAt as string | undefined,
  };
}

/**
 * Send OTP using MSG91 Direct WhatsApp API (Alternative to Widget API)
 * This matches the boilerplate you showed - gives direct control
 * 
 * Based on: https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/
 * 
 * Note: This requires you to generate and manage OTP yourself
 * Widget API is simpler but requires widget configuration
 */
export async function sendOtpDirectWhatsApp(params: {
  phoneNumber: string;
  countryCode?: string;
  otp?: string; // If not provided, will generate 6-digit OTP
  templateName?: string; // Default: "code"
  namespace?: string; // Optional: "bf62f283_88ee_46ea_8428_03e63334f780"
}): Promise<{ request_id?: string; message?: string; otp: string }> {
  const authkey = getAuthKey();
  const integratedNumber = process.env.MSG91_WHATSAPP_NUMBER || '919646656715';
  const templateName = params.templateName || 'code';
  const namespace = params.namespace || process.env.MSG91_WHATSAPP_NAMESPACE;
  
  // Format: countryCode + phoneNumber (e.g., "919999999999")
  const identifier = toMsg91Mobile(params.countryCode || '91', params.phoneNumber);
  
  // Generate OTP if not provided (6 digits)
  const otp = params.otp || Math.floor(100000 + Math.random() * 900000).toString();
  
  console.log('[MSG91 Direct WhatsApp] Sending OTP via Direct API');
  console.log('[MSG91 Direct WhatsApp] Integrated Number:', integratedNumber);
  console.log('[MSG91 Direct WhatsApp] Template:', templateName);
  console.log('[MSG91 Direct WhatsApp] To:', identifier);
  console.log('[MSG91 Direct WhatsApp] OTP:', otp);
  
  const requestBody = {
    integrated_number: integratedNumber,
    content_type: 'template',
    payload: {
      messaging_product: 'whatsapp',
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: 'en',
          policy: 'deterministic',
        },
        ...(namespace && { namespace }),
        to_and_components: [
          {
            to: [identifier],
            components: {
              body_1: {
                type: 'text',
                value: otp,
              },
            },
          },
        ],
      },
    },
  };
  
  console.log('[MSG91 Direct WhatsApp] Request:', JSON.stringify(requestBody, null, 2));
  
  const res = await fetch('https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'authkey': authkey,
    },
    body: JSON.stringify(requestBody),
  });
  
  let data: Record<string, unknown> = {};
  try {
    const text = await res.text();
    console.log('[MSG91 Direct WhatsApp] Response status:', res.status);
    console.log('[MSG91 Direct WhatsApp] Response body:', text);
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    data = {};
  }
  
  if (!res.ok || data.status === 'error') {
    const errorMsg =
      (typeof data?.message === 'string' ? data.message : null) ||
      (typeof data?.error === 'string' ? data.error : null) ||
      `HTTP ${res.status}`;
    throw new Error(`MSG91 Direct WhatsApp failed: ${errorMsg}. Response: ${JSON.stringify(data)}`);
  }
  
  console.log('[MSG91 Direct WhatsApp] ✅ OTP sent successfully');
  console.log('[MSG91 Direct WhatsApp] ⚠️  Note: You need to store OTP for verification');
  
  return {
    request_id: data.request_id as string | undefined,
    message: data.message as string | undefined,
    otp: otp, // Return OTP - you must store this for verification
  };
}
