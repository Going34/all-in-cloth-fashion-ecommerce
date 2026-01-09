import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAdmin } from '@/lib/auth';
import { listCategories, createCategoryService } from '@/modules/category/category.service';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const result = await listCategories();
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return errorResponse(new Error('Category name is required'), 400);
    }

    const parentId = body.parent_id || null;
    const category = await createCategoryService(body.name, parentId);
    
    return successResponse({ category }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

