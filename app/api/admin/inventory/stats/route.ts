import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAdmin } from '@/lib/auth';
import { getInventoryStatsService } from '@/modules/inventory/inventory.service';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const stats = await getInventoryStatsService();
    return successResponse(stats);
  } catch (error) {
    return errorResponse(error);
  }
}

