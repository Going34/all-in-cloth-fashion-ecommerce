import { findAllCategories, createCategory } from './category.repository';
import type { CategoryListResponse, CategoryResponse } from './category.types';

export async function listCategories(): Promise<CategoryListResponse> {
  const categories = await findAllCategories();
  return { categories };
}

export async function createCategoryService(
  name: string,
  parentId: string | null = null
): Promise<CategoryResponse> {
  if (!name || name.trim().length === 0) {
    throw new Error('Category name is required');
  }
  
  return await createCategory(name.trim(), parentId);
}

