import { getDbClient } from '@/lib/db';
import type { CategoryResponse } from './category.types';

export async function findAllCategories(): Promise<CategoryResponse[]> {
  const supabase = await getDbClient();

  // Simplified query - fetch categories without parent relationship
  // Parent relationship can be added back if needed, but the foreign key name might not match
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  // Return categories with parent set to null (parent_id is available in the data)
  return ((data as any[]) || []).map((cat) => ({
    ...cat,
    parent: null, // Parent can be resolved client-side if needed using parent_id
  }));
}

export async function createCategory(
  name: string,
  parentId: string | null = null
): Promise<CategoryResponse> {
  const supabase = await getDbClient();

  // Insert category and select only the specific columns we need to avoid ambiguity
  // Specifying columns explicitly prevents "user_id is ambiguous" error from RLS policies
  const { data, error } = await supabase
    .from('categories')
    .insert({ name, parent_id: parentId } as any)
    .select('id, name, parent_id, created_at, updated_at')
    .single();

  if (error) {
    throw new Error(`Failed to create category: ${error.message}`);
  }

  // Return category with parent set to null (parent_id is stored in DB, can be fetched later if needed)
  return {
    ...(data as any),
    parent: null,
  };
}

