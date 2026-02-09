/**
 * Test script for order creation endpoint
 * Run with: npx tsx scripts/test-order-creation.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing environment variables!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? 'Set' : 'Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkPromoUsageLogsTable() {
  console.log('\n=== Checking promo_usage_logs table ===');
  
  // Check if table exists
  const { data: tables, error: tablesError } = await supabase
    .from('promo_usage_logs')
    .select('*')
    .limit(1);

  if (tablesError) {
    console.error('❌ Error accessing promo_usage_logs:', tablesError.message);
    console.error('   Code:', tablesError.code);
    console.error('   Hint:', tablesError.hint);
    return false;
  }

  console.log('✅ promo_usage_logs table exists and is accessible');
  
  // Check RLS policies
  const { data: policies, error: policiesError } = await supabase
    .rpc('pg_policies')
    .select('*')
    .eq('tablename', 'promo_usage_logs');

  if (!policiesError && policies) {
    console.log('   RLS Policies:', policies.length);
  }

  return true;
}

async function testOrderCreation() {
  console.log('\n=== Testing Order Creation ===');
  
  // Get a test user
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email')
    .limit(1)
    .single();

  if (usersError || !users) {
    console.error('❌ No test user found');
    return;
  }

  console.log('Using test user:', users.email);

  // Get a test address
  const { data: address, error: addressError } = await supabase
    .from('addresses')
    .select('id')
    .eq('user_id', users.id)
    .limit(1)
    .single();

  if (addressError || !address) {
    console.error('❌ No address found for user');
    return;
  }

  // Get a test product variant
  const { data: variant, error: variantError } = await supabase
    .from('product_variants')
    .select('id, sku, price_override')
    .limit(1)
    .single();

  if (variantError || !variant) {
    console.error('❌ No product variant found');
    return;
  }

  console.log('Using variant:', variant.sku);

  // Test order data
  const orderData = {
    items: [
      {
        variant_id: variant.id,
        quantity: 1
      }
    ],
    address_id: address.id,
    shipping: 10
  };

  console.log('\nOrder data:', JSON.stringify(orderData, null, 2));
  console.log('\nMake a POST request to http://localhost:3000/api/orders with this data');
  console.log('Include authentication headers');
}

async function checkCoupons() {
  console.log('\n=== Checking Coupons ===');
  
  const { data: coupons, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('is_active', true)
    .limit(5);

  if (error) {
    console.error('❌ Error fetching coupons:', error.message);
    return;
  }

  if (!coupons || coupons.length === 0) {
    console.log('⚠️  No active coupons found');
    return;
  }

  console.log(`✅ Found ${coupons.length} active coupon(s):`);
  coupons.forEach((coupon: any) => {
    console.log(`   - ${coupon.code}: ${coupon.type} ${coupon.value} (used: ${coupon.used_count}/${coupon.usage_limit || '∞'})`);
  });
}

async function main() {
  console.log('🔍 Order Creation Diagnostic Tool\n');
  
  await checkPromoUsageLogsTable();
  await checkCoupons();
  await testOrderCreation();
  
  console.log('\n✅ Diagnostic complete\n');
}

main().catch(console.error);

