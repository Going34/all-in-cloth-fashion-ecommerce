import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { getProduct } from '@/modules/product/product.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await getProduct(id);
    return successResponse(product);
  } catch (error) {
    return errorResponse(error);
  }
}









