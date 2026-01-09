import type { Category } from '@/types';

export interface CategoryResponse extends Category {
  parent?: Category | null;
}

export interface CategoryListResponse {
  categories: CategoryResponse[];
}

