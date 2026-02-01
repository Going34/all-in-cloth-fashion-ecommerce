import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAuth } from '@/lib/auth';
import { listOrdersPaginated } from '@/modules/order/order.service';
import type { OrderStatus } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status') as OrderStatus | null;
    
    // Treat cursor as page number
    const page = cursor ? parseInt(cursor, 10) : 1;

    const result = await listOrdersPaginated(user.id, {
      status: status || undefined,
      page,
      limit,
    });

    const hasMore = page < result.totalPages;
    const nextCursor = hasMore ? String(page + 1) : null;

    return successResponse({
      orders: result.orders,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
