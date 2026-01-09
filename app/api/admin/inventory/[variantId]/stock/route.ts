import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAdmin } from '@/lib/auth';
import { updateStockService } from '@/modules/inventory/inventory.service';
import { validateUpdateStockRequest } from '@/modules/inventory/inventory.validators';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ variantId: string }> }
) {
  try {
    await requireAdmin();
    const { variantId } = await params;
    const body = await request.json();
    const requestData = validateUpdateStockRequest(body);

    const result = await updateStockService(variantId, requestData);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

