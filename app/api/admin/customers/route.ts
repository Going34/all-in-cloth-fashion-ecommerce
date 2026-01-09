import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAdmin } from '@/lib/auth';
import { listCustomersAdmin } from '@/modules/customer/customer.service';
import { validateCustomerListQuery } from '@/modules/customer/customer.validators';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const searchParams = request.nextUrl.searchParams;
    const query = validateCustomerListQuery({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
    });

    const result = await listCustomersAdmin(query);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

