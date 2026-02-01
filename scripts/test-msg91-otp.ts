#!/usr/bin/env tsx
/**
 * Test MSG91 OTP API
 * 
 * This script tests the MSG91 OTP send API to diagnose 401 errors
 * 
 * Usage:
 *   npx tsx scripts/test-msg91-otp.ts
 * 
 * Environment Variables:
 *   MSG91_AUTH_KEY - Your MSG91 authentication key
 *   TEST_PHONE - Test phone number (optional, defaults to 9999999999)
 *   TEST_COUNTRY_CODE - Country code (optional, defaults to 91)
 */

const authKey = process.env.MSG91_AUTH_KEY || '487822AHZo9fNW8n8696675f7P1';
const testPhone = process.env.TEST_PHONE || '9999999999';
const testCountryCode = process.env.TEST_COUNTRY_CODE || '91';

async function testMsg91OtpSend() {
  console.log('🧪 Testing MSG91 OTP Send API...\n');
  console.log(`Authkey: ${authKey.substring(0, 10)}...${authKey.substring(authKey.length - 5)}`);
  console.log(`Phone: +${testCountryCode}${testPhone}\n`);

  const url = 'https://api.msg91.com/api/v5/otp/send';
  
  const requestBody = {
    country_code: testCountryCode,
    phone_number: testPhone,
    company: 'All in Cloth',
  };

  console.log('📤 Request Details:');
  console.log(`  URL: ${url}`);
  console.log(`  Method: POST`);
  console.log(`  Headers:`);
  console.log(`    Content-Type: application/json`);
  console.log(`    authkey: ${authKey.substring(0, 10)}...`);
  console.log(`  Body:`, JSON.stringify(requestBody, null, 2));
  console.log('');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authkey': authKey,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📥 Response Details:');
    console.log(`  Status: ${response.status} ${response.statusText}`);
    console.log(`  Headers:`, Object.fromEntries(response.headers.entries()));
    console.log('');

    const responseText = await response.text();
    let responseData: any = {};
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    console.log('📄 Response Body:');
    console.log(JSON.stringify(responseData, null, 2));
    console.log('');

    if (response.ok) {
      console.log('✅ SUCCESS! OTP sent successfully');
      if (responseData.type === 'success' || responseData.message) {
        console.log(`   Message: ${responseData.message || 'OTP sent'}`);
      }
    } else {
      console.log('❌ FAILED!');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${responseData.message || responseData.error || responseData.type || 'Unknown error'}`);
      
      if (response.status === 401) {
        console.log('\n🔍 401 Authentication Error - Possible Causes:');
        console.log('   1. Invalid or expired authkey');
        console.log('   2. Authkey not enabled for OTP service');
        console.log('   3. IP whitelist restriction (check MSG91 dashboard)');
        console.log('   4. Account not activated or suspended');
        console.log('   5. Wrong authkey format');
        console.log('\n💡 Next Steps:');
        console.log('   - Login to MSG91 Dashboard: https://control.msg91.com/');
        console.log('   - Go to: Settings → API → Authentication Key');
        console.log('   - Verify authkey is active and OTP service is enabled');
        console.log('   - Check IP whitelist settings');
      }
    }

    return { success: response.ok, status: response.status, data: responseData };
  } catch (error: any) {
    console.log('❌ EXCEPTION:', error.message);
    console.error(error);
    return { success: false, error: error.message };
  }
}

testMsg91OtpSend()
  .then((result) => {
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });



