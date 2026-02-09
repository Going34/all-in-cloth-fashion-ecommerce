/**
 * Comprehensive Order Creation Test
 * Tests the full order creation flow with promo code
 * 
 * Run with: npx tsx test-order-creation.ts
 */

import { PromoService } from './services/promo';
import { getAdminDbClient } from './lib/adminDb';

async function testPromoValidation() {
    console.log('\n=== Testing Promo Validation ===');

    try {
        const result = await PromoService.validatePromoCode('SAVE20', 'test-user-id', 100);
        console.log('✅ Promo validation result:', result);
        return result;
    } catch (error) {
        console.error('❌ Promo validation failed:', error);
        throw error;
    }
}

async function testCouponFetch() {
    console.log('\n=== Testing Coupon Fetch ===');

    try {
        const db = getAdminDbClient();
        const { data, error } = await db
            .from('coupons')
            .select('*')
            .eq('code', 'SAVE20')
            .maybeSingle();

        if (error) {
            console.error('❌ Coupon fetch error:', error);
            throw error;
        }

        console.log('✅ Coupon data:', data);
        return data;
    } catch (error) {
        console.error('❌ Coupon fetch failed:', error);
        throw error;
    }
}

async function testPromoUsageLogInsert() {
    console.log('\n=== Testing Promo Usage Log Insert ===');

    try {
        const db = getAdminDbClient();
        const testData = {
            order_id: '00000000-0000-0000-0000-000000000000', // Test UUID
            user_id: '00000000-0000-0000-0000-000000000001',
            promo_code: 'TEST_INSERT',
            discount_amount: 10.50
        };

        console.log('Attempting to insert:', testData);

        const { data, error } = await db
            .from('promo_usage_logs')
            .insert(testData)
            .select()
            .single();

        if (error) {
            console.error('❌ Insert error:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            throw error;
        }

        console.log('✅ Insert successful:', data);

        // Cleanup
        await db.from('promo_usage_logs').delete().eq('id', data.id);
        console.log('✅ Cleanup successful');

        return data;
    } catch (error) {
        console.error('❌ Promo usage log insert failed:', error);
        throw error;
    }
}

async function testPromoUsageLogsTableStructure() {
    console.log('\n=== Testing promo_usage_logs Table Structure ===');

    try {
        const db = getAdminDbClient();

        // Try to query the table to see if it exists
        const { data, error } = await db
            .from('promo_usage_logs')
            .select('*')
            .limit(1);

        if (error) {
            console.error('❌ Table query error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);

            if (error.code === '42P01') {
                console.error('⚠️  TABLE DOES NOT EXIST!');
            }
            throw error;
        }

        console.log('✅ Table exists and is accessible');
        console.log('Sample data:', data);
        return true;
    } catch (error) {
        console.error('❌ Table structure test failed:', error);
        throw error;
    }
}

async function runAllTests() {
    console.log('🧪 Starting Order Creation Tests\n');
    console.log('='.repeat(50));

    const results = {
        tableStructure: false,
        couponFetch: false,
        promoValidation: false,
        promoUsageLogInsert: false
    };

    try {
        // Test 1: Table Structure
        await testPromoUsageLogsTableStructure();
        results.tableStructure = true;
    } catch (error) {
        console.error('\n⚠️  Table structure test failed - this is likely the root cause!\n');
    }

    try {
        // Test 2: Coupon Fetch
        await testCouponFetch();
        results.couponFetch = true;
    } catch (error) {
        console.error('\n⚠️  Coupon fetch failed\n');
    }

    try {
        // Test 3: Promo Validation
        await testPromoValidation();
        results.promoValidation = true;
    } catch (error) {
        console.error('\n⚠️  Promo validation failed\n');
    }

    try {
        // Test 4: Promo Usage Log Insert
        await testPromoUsageLogInsert();
        results.promoUsageLogInsert = true;
    } catch (error) {
        console.error('\n⚠️  Promo usage log insert failed - this is the critical failure!\n');
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n📊 Test Results Summary:');
    console.log('  Table Structure:', results.tableStructure ? '✅' : '❌');
    console.log('  Coupon Fetch:', results.couponFetch ? '✅' : '❌');
    console.log('  Promo Validation:', results.promoValidation ? '✅' : '❌');
    console.log('  Promo Usage Log Insert:', results.promoUsageLogInsert ? '✅' : '❌');

    const allPassed = Object.values(results).every(r => r);
    console.log('\n' + (allPassed ? '✅ All tests passed!' : '❌ Some tests failed'));

    process.exit(allPassed ? 0 : 1);
}

runAllTests().catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
});
