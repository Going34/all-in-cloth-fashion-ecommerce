import { createClient } from '@/utils/supabase/client';
import type { Category } from '@/types';

const supabase = createClient();

let cachedCategories: Category[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function fetchCategories(): Promise<Category[]> {
  const now = Date.now();
  
  if (cachedCategories && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedCategories;
  }

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    return cachedCategories || [];
  }

  cachedCategories = (data as Category[]) || [];
  cacheTimestamp = now;
  return cachedCategories;
}

export function getCategoryHierarchy(categories: Category[]): (Category & { children?: Category[] })[] {
  const categoryMap = new Map<string, Category & { children?: Category[] }>();
  const rootCategories: (Category & { children?: Category[] })[] = [];

  categories.forEach(cat => {
    categoryMap.set(cat.id, { ...cat });
  });

  categories.forEach(cat => {
    if (cat.parent_id === null || cat.parent_id === undefined) {
      rootCategories.push(categoryMap.get(cat.id)!);
    } else {
      const parent = categoryMap.get(cat.parent_id);
      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(categoryMap.get(cat.id)!);
      }
    }
  });

  return rootCategories;
}

export function getCategoryById(categories: Category[], id: string): Category | undefined {
  return categories.find(cat => cat.id === id);
}

export function getCategoryPath(categories: Category[], categoryId: string): Category[] {
  const path: Category[] = [];
  let currentId: string | null | undefined = categoryId;

  while (currentId) {
    const category = categories.find(cat => cat.id === currentId);
    if (!category) break;
    path.unshift(category);
    currentId = category.parent_id;
  }

  return path;
}

export function clearCategoryCache(): void {
  cachedCategories = null;
  cacheTimestamp = null;
}

// Admin functions
export async function createCategory(
  name: string,
  parentId: string | null = null
): Promise<{ data: Category | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name, parent_id: parentId } as any)
    .select()
    .single();

  if (!error) {
    clearCategoryCache();
  }

  return { data: data as Category | null, error: error as Error | null };
}

export async function updateCategory(
  id: string,
  updates: { name?: string; parent_id?: string | null }
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('categories')
    .update(updates as any)
    .eq('id', id);

  if (!error) {
    clearCategoryCache();
  }

  return { error: error as Error | null };
}

export async function deleteCategory(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (!error) {
    clearCategoryCache();
  }

  return { error: error as Error | null };
}

// Get products count per category
export async function getCategoriesWithProductCount(): Promise<(Category & { product_count: number })[]> {
  const { data: categories } = await supabase
    .from('categories')
    .select('*');

  const { data: productCategories } = await supabase
    .from('product_categories')
    .select('category_id');

  if (!categories) return [];

  const countMap = new Map<string, number>();
  ((productCategories as any[]) || []).forEach((pc) => {
    const count = countMap.get(pc.category_id) || 0;
    countMap.set(pc.category_id, count + 1);
  });

  return (categories as Category[]).map((cat) => ({
    ...cat,
    product_count: countMap.get(cat.id) || 0,
  }));
}
