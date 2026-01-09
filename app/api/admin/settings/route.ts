import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAdmin } from '@/lib/auth';
import { getSettingsService, updateSettingsService } from '@/modules/settings/settings.service';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const settings = await getSettingsService();
    return successResponse(settings);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const settings = await updateSettingsService(body);
    return successResponse(settings);
  } catch (error) {
    return errorResponse(error);
  }
}

