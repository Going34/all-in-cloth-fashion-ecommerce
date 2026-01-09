import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAdmin } from '@/lib/auth';
import { getDashboardStatsService } from '@/modules/dashboard/dashboard.service';
import type { DashboardPeriod } from '@/modules/dashboard/dashboard.types';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get('period') as DashboardPeriod) || '30d';

    if (period !== '7d' && period !== '30d' && period !== 'quarter') {
      return errorResponse(new Error('Invalid period. Must be 7d, 30d, or quarter'), 400);
    }

    const stats = await getDashboardStatsService(period);
    return successResponse(stats);
  } catch (error) {
    return errorResponse(error);
  }
}

