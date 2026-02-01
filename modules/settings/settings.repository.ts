import { getAdminDbClient } from '@/lib/adminDb';
import type { SettingsResponse, UpdateSettingsRequest } from './settings.types';

const DEFAULT_SETTINGS: SettingsResponse = {
  general: {
    storeName: 'All in cloth',
    supportEmail: 'support@allincloth.com',
    storeDescription: 'Redefining modern luxury through architectural silhouettes and ethical craftsmanship.',
  },
  shipping: {
    standardRate: 15.0,
    expressRate: 25.0,
    freeShippingThreshold: 100.0,
  },
  tax: {
    rate: 8.0,
    type: 'vat',
  },
  paymentMethods: {
    stripe: { enabled: true },
    paypal: { enabled: true },
    razorpay: {
      enabled: false,
      keyId: process.env.RAZORPAY_KEY_ID || process.env.RAZOR_API_KEY,
      keySecret: process.env.RAZORPAY_KEY_SECRET || process.env.RAZOR_SECRET_KEY,
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
    },
    applePay: { enabled: true },
    googlePay: { enabled: true },
  },
};

export async function getSettings(): Promise<SettingsResponse> {
  const db = getAdminDbClient();

  const { data, error } = await db
    .from('settings')
    .select('key, value')
    .in('key', ['general', 'shipping', 'tax', 'paymentMethods']);

  if (error) {
    return DEFAULT_SETTINGS;
  }

  const settingsMap = new Map((data || []).map((s: { key: string; value: unknown }) => [s.key, s.value]));

  const dbPaymentMethods = (settingsMap.get('paymentMethods') as SettingsResponse['paymentMethods']) || DEFAULT_SETTINGS.paymentMethods;
  
  const paymentMethods: SettingsResponse['paymentMethods'] = {
    ...dbPaymentMethods,
    razorpay: {
      ...dbPaymentMethods.razorpay,
      enabled: dbPaymentMethods.razorpay?.enabled ?? (!!process.env.RAZORPAY_KEY_ID || !!process.env.RAZOR_API_KEY),
      keyId: dbPaymentMethods.razorpay?.keyId || process.env.RAZORPAY_KEY_ID || process.env.RAZOR_API_KEY || '',
      keySecret: dbPaymentMethods.razorpay?.keySecret || process.env.RAZORPAY_KEY_SECRET || process.env.RAZOR_SECRET_KEY || '',
      webhookSecret: dbPaymentMethods.razorpay?.webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || '',
    },
  };

  return {
    general: (settingsMap.get('general') as SettingsResponse['general']) || DEFAULT_SETTINGS.general,
    shipping: (settingsMap.get('shipping') as SettingsResponse['shipping']) || DEFAULT_SETTINGS.shipping,
    tax: (settingsMap.get('tax') as SettingsResponse['tax']) || DEFAULT_SETTINGS.tax,
    paymentMethods,
  };
}

export async function updateSettings(updates: UpdateSettingsRequest): Promise<SettingsResponse> {
  const db = getAdminDbClient();

  const currentSettings = await getSettings();

  const updatedSettings: SettingsResponse = {
    general: { ...currentSettings.general, ...updates.general },
    shipping: { ...currentSettings.shipping, ...updates.shipping },
    tax: { ...currentSettings.tax, ...updates.tax },
    paymentMethods: {
      ...currentSettings.paymentMethods,
      ...(updates.paymentMethods && {
        stripe: { ...currentSettings.paymentMethods.stripe, ...updates.paymentMethods.stripe },
        paypal: { ...currentSettings.paymentMethods.paypal, ...updates.paymentMethods.paypal },
        razorpay: { ...currentSettings.paymentMethods.razorpay, ...updates.paymentMethods.razorpay },
        applePay: { ...currentSettings.paymentMethods.applePay, ...updates.paymentMethods.applePay },
        googlePay: { ...currentSettings.paymentMethods.googlePay, ...updates.paymentMethods.googlePay },
      }),
    },
  };

  const settingsToUpdate = [
    { key: 'general', value: updatedSettings.general },
    { key: 'shipping', value: updatedSettings.shipping },
    { key: 'tax', value: updatedSettings.tax },
    { key: 'paymentMethods', value: updatedSettings.paymentMethods },
  ];

  for (const setting of settingsToUpdate) {
    const { error } = await db
      .from('settings')
      .upsert({
        key: setting.key,
        value: setting.value,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(`Failed to update setting ${setting.key}: ${error.message}`);
    }
  }

  return updatedSettings;
}

