import { NextRequest } from 'next/server';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/response';
import { listProducts } from '@/modules/product/product.service';
import { validateProductListQuery } from '@/modules/product/product.validators';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = validateProductListQuery({
      cursor: searchParams.get('cursor') || undefined,
      limit: searchParams.get('limit') || undefined,
      direction: searchParams.get('direction') || undefined,
      status: searchParams.get('status') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      featured: searchParams.get('featured') || undefined,
    });

    const result = await listProducts(query);

    return paginatedResponse(result.products, {
      cursor: query.cursor || undefined,
      nextCursor: result.nextCursor,
      prevCursor: result.prevCursor,
      hasMore: result.hasMore,
    });
  } catch (error) {
    return errorResponse(error);
  }
}









