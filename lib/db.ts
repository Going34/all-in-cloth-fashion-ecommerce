import { createClient as createServerClient } from '@/utils/supabase/server';
import type { Database } from '@/types';

export async function getDbClient() {
  try {
    return await createServerClient();
  } catch (error) {
    // Log detailed error information for debugging in production
    if (error instanceof Error) {
      console.error('Failed to create Supabase client:', {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      });
    }
    throw error;
  }
}

export type SupabaseClient = Awaited<ReturnType<typeof getDbClient>>;









