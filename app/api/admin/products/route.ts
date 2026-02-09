import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAdmin } from '@/lib/auth';
import { createProduct, listProductsAdmin } from '@/modules/product/product.service';
import { validateCreateProductRequest, validateAdminProductListQuery } from '@/modules/product/product.validators';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const searchParams = request.nextUrl.searchParams;
    const query = validateAdminProductListQuery({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || undefined,
      sort: searchParams.get('sort') || undefined,
    });

    const result = await listProductsAdmin(query);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const productData = validateCreateProductRequest(body);

    const product = await createProduct(productData);

    return successResponse(product, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

