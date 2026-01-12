import { createClient } from '@/utils/supabase/client';

export interface ConnectionStatus {
  connected: boolean;
  error?: string;
  message: string;
  timestamp: string;
  tables?: string[];
}

/**
 * Test database connection (Client-side)
 * Use this in client components or browser environments
 */
export async function testDatabaseConnection(): Promise<ConnectionStatus> {
  const timestamp = new Date().toISOString();
  
  try {
    const supabase = createClient();
    
    // Test basic connection by querying a simple table
    // Try to get a count from a table that should exist
    const { data, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (error) {
      // If products table doesn't exist, try another table
      const { error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (usersError) {
        return {
          connected: false,
          error: error.message || usersError.message,
          message: 'Failed to connect to database. Tables may not exist yet.',
          timestamp,
        };
      }
    }

    // Get list of available tables by trying common ones
    const tables: string[] = [];
    const commonTables = [
      'users', 'products', 'categories', 'orders', 
      'inventory', 'product_variants', 'cart_items'
    ];

    for (const table of commonTables) {
      const { error: tableError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!tableError) {
        tables.push(table);
      }
    }

    return {
      connected: true,
      message: `Successfully connected to Supabase database. Found ${tables.length} accessible tables.`,
      timestamp,
      tables,
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to establish database connection.',
      timestamp,
    };
  }
}

// Server-side connection test has been moved to dbConnection.server.ts
// Import it directly in server components, API routes, or server actions:
// import { testDatabaseConnectionServer } from '@/utils/dbConnection.server';

/**
 * Check if Supabase environment variables are configured
 */
export function checkSupabaseConfig(): {
  configured: boolean;
  missing: string[];
  url?: string;
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
                  process.env.NEXT_PUBLIC_SUPABASE_API_KEY;
  
  const missing: string[] = [];
  console.log(url, 'anonKey');
  if (!url) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL');
  }
  
  if (!anonKey) {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY or NEXT_PUBLIC_SUPABASE_API_KEY)');
  }

  return {
    configured: missing.length === 0,
    missing,
    url: url || undefined,
  };
}

/**
 * Comprehensive connection test with detailed diagnostics (Client-side only)
 * For server-side diagnostics, use the API route /api/test-connection or testDatabaseConnectionServer()
 */
export async function diagnoseConnection(): Promise<{
  config: ReturnType<typeof checkSupabaseConfig>;
  clientTest?: ConnectionStatus;
}> {
  const config = checkSupabaseConfig();
  
  if (!config.configured) {
    return { config };
  }

  // Test client connection only
  const clientTestResult = await Promise.allSettled([
    testDatabaseConnection(),
  ]);

  return {
    config,
    clientTest: clientTestResult[0].status === 'fulfilled' ? clientTestResult[0].value : undefined,
  };
}

