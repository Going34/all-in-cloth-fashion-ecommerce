import { NotFoundError } from '@/lib/errors';
import {
  findProductsByCursor,
  findProductById,
  createProduct as createProductRepo,
  findProductsAdmin,
  updateProductAdmin as updateProductAdminRepo,
  deleteProductAdmin as deleteProductAdminRepo,
} from './product.repository';
import type {
  ProductListQuery,
  ProductListResponse,
  ProductResponse,
  CreateProductRequest,
  UpdateProductRequest,
  AdminProductListQuery,
  AdminProductListResponse,
} from './product.types';

export async function listProducts(query: ProductListQuery): Promise<ProductListResponse> {
  const { cursor, limit = 20, direction = 'next', status, categoryId, featured } = query;

  const result = await findProductsByCursor(cursor, limit, direction, {
    status,
    categoryId,
    featured,
  });

  return {
    products: result.products,
    nextCursor: result.nextCursor,
    prevCursor: result.prevCursor,
    hasMore: result.hasMore,
  };
}

export async function getProduct(id: string): Promise<ProductResponse> {
  const product = await findProductById(id);

  if (!product) {
    throw new NotFoundError('Product', id);
  }

  return product;
}

export async function createProduct(data: CreateProductRequest, idempotencyKey?: string): Promise<ProductResponse> {
  return await createProductRepo(data, idempotencyKey);
}

export async function listProductsAdmin(query: AdminProductListQuery): Promise<AdminProductListResponse> {
  const page = query.page || 1;
  const limit = query.limit || 10;

  const result = await findProductsAdmin({
    page,
    cursor: query.cursor,
    direction: query.direction,
    limit,
    search: query.search,
    category: query.category,
    status: query.status,
    sort: query.sort || 'created_at:desc',
  });

  const totalPages = Math.ceil(result.total / limit);

  return {
    products: result.products,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages,
      nextCursor: result.nextCursor,
      prevCursor: result.prevCursor,
      hasMore: result.hasMore,
    },
  };
}

export async function updateProductAdmin(
  id: string,
  data: UpdateProductRequest
): Promise<ProductResponse> {
  return await updateProductAdminRepo(id, data);
}

export async function deleteProductAdmin(id: string): Promise<void> {
  await deleteProductAdminRepo(id);
}

