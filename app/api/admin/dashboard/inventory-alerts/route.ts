import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAdmin } from '@/lib/auth';
import { getInventoryAlertsService } from '@/modules/dashboard/dashboard.service';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 10;

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return errorResponse(new Error('Limit must be between 1 and 100'), 400);
    }

    const alerts = await getInventoryAlertsService(limit);
    return successResponse(alerts);
  } catch (error) {
    return errorResponse(error);
  }
}

