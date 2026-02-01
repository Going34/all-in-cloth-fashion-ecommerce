import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAuth } from '@/lib/auth';
import { getAdminDbClient } from '@/lib/adminDb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: orderId } = await params;

    const db = getAdminDbClient();

    const { data, error } = await db.rpc('cancel_order_transactional', {
      p_order_id: orderId,
      p_user_id: user.id,
      p_reason: 'user_cancelled',
    });

    if (error) {
      throw new Error(error.message || 'Failed to cancel order');
    }

    return successResponse(data);
  } catch (error) {
    return errorResponse(error);
  }
}


