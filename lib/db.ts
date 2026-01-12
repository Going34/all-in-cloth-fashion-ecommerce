import { createClient as createServerClient } from '@/utils/supabase/server';
import type { Database } from '@/types';

export async function getDbClient() {
  return await createServerClient();
}

export type SupabaseClient = Awaited<ReturnType<typeof getDbClient>>;









