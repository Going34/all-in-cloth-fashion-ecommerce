// pages/api/auth/send-otp.js
// Send OTP via MSG91 WhatsApp

import axios from 'axios';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  const { phone, countryCode = '91' } = req.body;

  // Validate input
  if (!phone) {
    return res.status(400).json({ 
      success: false,
      error: 'Phone number is required' 
    });
  }

  if (phone.length < 10) {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid phone number' 
    });
  }

  try {
    // Format phone number: remove any special characters and add country code
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const formattedPhone = `${countryCode}${cleanPhone}`.replace(/^\+/, '');

    console.log(`[MSG91] Sending OTP`);
    console.log(`[MSG91] Phone: ${formattedPhone}`);
    console.log(`[MSG91] Widget ID: ${process.env.MSG91_WIDGET_ID}`);
    console.log(`[MSG91] Timestamp: ${new Date().toISOString()}`);

    // Send OTP using MSG91 Widget API
    const response = await axios.post(
      'https://api.msg91.com/apiv5/otp/send',
      {
        widgetId: process.env.MSG91_WIDGET_ID,
        identifier: formattedPhone
      },
      {
        headers: {
          authkey: process.env.MSG91_AUTH_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    console.log(`[MSG91] Response Status: ${response.status}`);
    console.log(`[MSG91] Response Body:`, response.data);

    // Check if OTP was sent successfully
    if (response.data.type === 'success') {
      console.log(`[MSG91] ✅ OTP Sent Successfully`);
      console.log(`[MSG91] Request ID: ${response.data.message}`);
      console.log(`[MSG91] Check MSG91 Dashboard → OTP → Widget/SDK → Logs for delivery status`);

      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully to WhatsApp',
        requestId: response.data.message,
        phone: formattedPhone,
        debugInfo: {
          widgetId: process.env.MSG91_WIDGET_ID,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      console.log(`[MSG91] ❌ OTP Send Failed`);
      console.log(`[MSG91] Error:`, response.data);

      throw new Error(
        response.data.message || 'MSG91 API returned error'
      );
    }

  } catch (error) {
    console.error(`[MSG91] Error:`, error.message);
    
    if (error.response) {
      console.error(`[MSG91] Response Status:`, error.response.status);
      console.error(`[MSG91] Response Data:`, error.response.data);

      // Handle specific error messages
      const errorMessage = error.response.data?.message || 'Failed to send OTP';

      return res.status(error.response.status).json({
        success: false,
        error: errorMessage,
        debugInfo: {
          status: error.response.status,
          response: error.response.data
        }
      });
    }

    // Network or other errors
    return res.status(500).json({
      success: false,
      error: 'Failed to send OTP. Please try again.',
      debugInfo: {
        message: error.message
      }
    });
  }
}
