import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAdmin } from '@/lib/auth';
import { getCustomerAdmin } from '@/modules/customer/customer.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const customer = await getCustomerAdmin(id);
    return successResponse(customer);
  } catch (error) {
    return errorResponse(error);
  }
}

