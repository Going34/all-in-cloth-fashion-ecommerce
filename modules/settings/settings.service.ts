import { getSettings, updateSettings } from './settings.repository';
import type { SettingsResponse, UpdateSettingsRequest } from './settings.types';

export async function getSettingsService(): Promise<SettingsResponse> {
  return await getSettings();
}

export async function updateSettingsService(updates: UpdateSettingsRequest): Promise<SettingsResponse> {
  return await updateSettings(updates);
}

