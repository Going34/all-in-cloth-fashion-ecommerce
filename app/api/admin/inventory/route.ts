import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAdmin } from '@/lib/auth';
import { listInventory } from '@/modules/inventory/inventory.service';
import { validateInventoryListQuery } from '@/modules/inventory/inventory.validators';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const searchParams = request.nextUrl.searchParams;
    const query = validateInventoryListQuery({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
    });

    const result = await listInventory(query);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

