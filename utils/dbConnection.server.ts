import { createClient } from '@/utils/supabase/server';
import type { ConnectionStatus } from './dbConnection';

/**
 * Test database connection (Server-side only)
 * Use this in server components, API routes, or server actions
 * 
 * This file is server-only and should never be imported in client components
 */
export async function testDatabaseConnectionServer(): Promise<ConnectionStatus> {
  const timestamp = new Date().toISOString();
  
  try {
    const supabase = await createClient();
    
    // Test basic connection
    const { data, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (error) {
      // Try users table as fallback
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

    // Get list of available tables
    const tables: string[] = [];
    const commonTables = [
      'users', 'products', 'categories', 'orders', 
      'inventory', 'product_variants', 'cart_items',
      'addresses', 'reviews', 'payments', 'wishlist'
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




