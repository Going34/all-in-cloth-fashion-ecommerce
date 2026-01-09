#!/usr/bin/env tsx
/**
 * Database Connection Test Script
 * 
 * Run with: npx tsx scripts/test-db-connection.ts
 * Or: npm run test:db
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_API_KEY;

async function testConnection() {
  console.log('🔍 Testing Supabase Database Connection...\n');

  // Check configuration
  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set');
    process.exit(1);
  }

  if (!supabaseAnonKey) {
    console.error('❌ Supabase API key is not set');
    console.error('   Please set one of:');
    console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.error('   - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY');
    console.error('   - NEXT_PUBLIC_SUPABASE_API_KEY');
    process.exit(1);
  }

  console.log('✅ Configuration found');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Key: ${supabaseAnonKey.substring(0, 20)}...\n`);

  // Create client
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Test connection by querying tables
  const tables = [
    'users', 'products', 'categories', 'orders',
    'inventory', 'product_variants', 'cart_items',
    'addresses', 'reviews', 'payments', 'wishlist'
  ];

  console.log('📊 Testing table access...\n');
  const accessibleTables: string[] = [];
  const inaccessibleTables: { table: string; error: string }[] = [];

  for (const table of tables) {
    const { error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      inaccessibleTables.push({ table, error: error.message });
      console.log(`   ❌ ${table}: ${error.message}`);
    } else {
      accessibleTables.push(table);
      console.log(`   ✅ ${table}: Accessible (${count || 0} rows)`);
    }
  }

  console.log('\n📈 Summary:');
  console.log(`   ✅ Accessible tables: ${accessibleTables.length}`);
  console.log(`   ❌ Inaccessible tables: ${inaccessibleTables.length}`);

  if (accessibleTables.length > 0) {
    console.log('\n✅ Database connection successful!');
    console.log(`   Found ${accessibleTables.length} accessible table(s)`);
    process.exit(0);
  } else {
    console.log('\n⚠️  No accessible tables found.');
    console.log('   This might mean:');
    console.log('   - Tables have not been created yet');
    console.log('   - RLS policies are blocking access');
    console.log('   - API key does not have proper permissions');
    process.exit(1);
  }
}

testConnection().catch((error) => {
  console.error('\n❌ Connection test failed:', error);
  process.exit(1);
});

