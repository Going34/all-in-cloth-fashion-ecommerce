import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAdmin } from '@/lib/auth';
import { ForbiddenError } from '@/lib/errors';
import { getProduct, updateProductAdmin, deleteProductAdmin } from '@/modules/product/product.service';
import { validateUpdateProductRequest } from '@/modules/product/product.validators';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const product = await getProduct(id);
    return successResponse(product);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const validatedData = validateUpdateProductRequest(body);
    const product = await updateProductAdmin(id, validatedData);
    return successResponse(product);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();

    // Critical Security Check: Only OPS role can delete products
    if (!user.roles?.includes('OPS') && !user.roles?.includes('SUPER_ADMIN')) {
      throw new ForbiddenError('Only OPS role can delete products');
    }

    const { id } = await params;
    await deleteProductAdmin(id);
    return successResponse({ message: 'Product deleted successfully' });
  } catch (error) {
    return errorResponse(error);
  }
}

