import { getDbClient } from '@/lib/db';
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
    applePay: { enabled: true },
    googlePay: { enabled: true },
  },
};

export async function getSettings(): Promise<SettingsResponse> {
  const supabase = await getDbClient();

  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['general', 'shipping', 'tax', 'paymentMethods']);

  if (error) {
    return DEFAULT_SETTINGS;
  }

  const settingsMap = new Map((data || []).map((s: any) => [s.key, s.value]));

  return {
    general: settingsMap.get('general') || DEFAULT_SETTINGS.general,
    shipping: settingsMap.get('shipping') || DEFAULT_SETTINGS.shipping,
    tax: settingsMap.get('tax') || DEFAULT_SETTINGS.tax,
    paymentMethods: settingsMap.get('paymentMethods') || DEFAULT_SETTINGS.paymentMethods,
  };
}

export async function updateSettings(updates: UpdateSettingsRequest): Promise<SettingsResponse> {
  const supabase = await getDbClient();

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
    const { error } = await supabase
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

