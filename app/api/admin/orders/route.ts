import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAdmin } from '@/lib/auth';
import { listOrdersAdmin } from '@/modules/order/order.service';
import { validateAdminOrderListQuery } from '@/modules/order/order.validators';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const searchParams = request.nextUrl.searchParams;
    const query = validateAdminOrderListQuery({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      sort: searchParams.get('sort') || undefined,
    });

    const result = await listOrdersAdmin(query);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

