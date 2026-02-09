#!/usr/bin/env node

/**
 * Test script for order creation API
 * Run with: node test-order-api.js
 */

const payload = {
    items: [
        {
            variant_id: "2c2810c6-af3a-4863-8744-4a50b588a020",
            quantity: 3
        }
    ],
    address_id: "d81b0230-b891-4e2d-8d68-19d309feb355",
    shipping: 15,
    promo_code: "SAVE20"
};

async function testOrderCreation() {
    try {
        console.log('Testing order creation API...');
        console.log('Payload:', JSON.stringify(payload, null, 2));

        const response = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add your session cookie here if needed
                'Cookie': 'session=your-session-token-here'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        console.log('\nResponse Status:', response.status);
        console.log('Response Data:', JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error('\n❌ API call failed');
            console.error('Error:', data.error);
        } else {
            console.log('\n✅ Order created successfully');
        }
    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
        console.error(error.stack);
    }
}

testOrderCreation();
