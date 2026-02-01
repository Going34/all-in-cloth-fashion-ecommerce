// pages/api/auth/verify-otp.js
// Verify OTP via MSG91 WhatsApp

import axios from 'axios';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  const { phone, countryCode = '91', otp } = req.body;

  // Validate input
  if (!phone || !otp) {
    return res.status(400).json({ 
      success: false,
      error: 'Phone number and OTP are required' 
    });
  }

  if (otp.length !== 6 || isNaN(otp)) {
    return res.status(400).json({ 
      success: false,
      error: 'OTP must be 6 digits' 
    });
  }

  try {
    // Format phone number
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const formattedPhone = `${countryCode}${cleanPhone}`.replace(/^\+/, '');

    console.log(`[MSG91] Verifying OTP`);
    console.log(`[MSG91] Phone: ${formattedPhone}`);
    console.log(`[MSG91] OTP: ${otp}`);
    console.log(`[MSG91] Timestamp: ${new Date().toISOString()}`);

    // Verify OTP using MSG91 API
    const response = await axios.post(
      'https://api.msg91.com/apiv5/otp/verify',
      {
        mobile: formattedPhone,
        otp: otp
      },
      {
        headers: {
          authkey: process.env.MSG91_AUTH_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    console.log(`[MSG91] Verify Response Status: ${response.status}`);
    console.log(`[MSG91] Verify Response Body:`, response.data);

    // Check if OTP was verified successfully
    if (response.data.type === 'success') {
      console.log(`[MSG91] ✅ OTP Verified Successfully`);

      // Here you can:
      // 1. Create or update user in database
      // 2. Create JWT token
      // 3. Set session

      return res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        phone: formattedPhone,
        // Add more data as needed (user ID, JWT token, etc.)
      });
    } else {
      console.log(`[MSG91] ❌ OTP Verification Failed`);
      console.log(`[MSG91] Error:`, response.data);

      // OTP incorrect or expired
      return res.status(400).json({
        success: false,
        error: response.data.message || 'Invalid or expired OTP'
      });
    }

  } catch (error) {
    console.error(`[MSG91] Verify Error:`, error.message);
    
    if (error.response) {
      console.error(`[MSG91] Response Status:`, error.response.status);
      console.error(`[MSG91] Response Data:`, error.response.data);

      const errorMessage = error.response.data?.message || 'OTP verification failed';

      // 401 usually means OTP is invalid or expired
      if (error.response.status === 401) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired OTP. Please request a new one.'
        });
      }

      return res.status(error.response.status).json({
        success: false,
        error: errorMessage
      });
    }

    // Network or other errors
    return res.status(500).json({
      success: false,
      error: 'Failed to verify OTP. Please try again.'
    });
  }
}
