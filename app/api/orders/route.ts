import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAuth } from '@/lib/auth';
import { createOrder, listOrders } from '@/modules/order/order.service';
import { validateCreateOrderRequest } from '@/modules/order/order.validators';
import type { OrderStatus } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    
    const filters: { status?: OrderStatus; limit?: number } = {};
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status') as OrderStatus;
    }
    if (searchParams.get('limit')) {
      filters.limit = parseInt(searchParams.get('limit') || '20', 10);
    }

    const orders = await listOrders(user.id, filters);

    return successResponse(orders);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const orderData = validateCreateOrderRequest(body);

    const shippingAmount = typeof body.shipping === 'number' ? body.shipping : 0;

    const order = await createOrder(user.id, orderData, shippingAmount);

    return successResponse(order, 201);
  } catch (error) {
    return errorResponse(error);
  }
}


