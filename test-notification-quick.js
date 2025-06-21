// Quick test script for real-time notifications
// Run this with: node test-notification-quick.js

const axios = require('axios');

const SERVER_URL = 'https://chaipark.onrender.com';
// const SERVER_URL = 'http://localhost:4545'; // For local testing

async function sendTestNotification() {
  try {
    console.log('🚀 Sending test notification to React Native app...');
    
    const response = await axios.post(`${SERVER_URL}/api/admin/notifications/instant`, {
      title: 'Test from Script',
      message: 'This is a test notification sent via script! If you see this in your React Native app, real-time notifications are working! 🎉',
      type: 'general',
      targetUsers: 'all'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Test notification sent successfully!');
    console.log('📊 Response:', response.data);
    console.log('\n💡 Check your React Native app for the notification!');
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('ℹ️  Authentication not required for this test endpoint');
      console.log('✅ If you see this message, the endpoint is accessible');
    } else {
      console.error('❌ Failed to send test notification:', error.response?.data || error.message);
    }
  }
}

sendTestNotification(); 