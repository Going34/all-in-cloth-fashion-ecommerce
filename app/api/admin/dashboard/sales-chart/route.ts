import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAdmin } from '@/lib/auth';
import { getSalesChartService } from '@/modules/dashboard/dashboard.service';
import type { DashboardPeriod } from '@/modules/dashboard/dashboard.types';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get('period') as DashboardPeriod) || '30d';
    const granularity = (searchParams.get('granularity') as 'day' | 'week' | 'month') || 'day';

    if (period !== '7d' && period !== '30d' && period !== 'quarter') {
      return errorResponse(new Error('Invalid period. Must be 7d, 30d, or quarter'), 400);
    }

    if (granularity !== 'day' && granularity !== 'week' && granularity !== 'month') {
      return errorResponse(new Error('Invalid granularity. Must be day, week, or month'), 400);
    }

    const chartData = await getSalesChartService(period, granularity);
    return successResponse(chartData);
  } catch (error) {
    return errorResponse(error);
  }
}

