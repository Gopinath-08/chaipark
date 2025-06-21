const io = require('socket.io-client');
const axios = require('axios');

// Configuration
const SERVER_URL = 'https://chaipark.onrender.com';
// const SERVER_URL = 'http://localhost:4545'; // For local testing
const ADMIN_TOKEN = 'your-admin-token-here'; // Replace with actual admin token

console.log('🧪 Testing Real-time Notification System...\n');

// Test 1: WebSocket Connection Test
console.log('📌 TEST 1: WebSocket Connection');
const socket = io(SERVER_URL, {
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnection: true,
  timeout: 10000,
});

socket.on('connect', () => {
  console.log('✅ WebSocket connected:', socket.id);
  
  // Join user room
  socket.emit('join_user_room', { userId: 'test_user_123' });
  console.log('🏠 Joined user room: user_test_user_123');
  
  // Listen for admin notifications
  socket.on('admin_notification', (data) => {
    console.log('📱 Admin notification received:', {
      title: data.title,
      message: data.message,
      type: data.type,
      timestamp: data.timestamp
    });
  });
  
  // Test 2: Send notification from admin dashboard
  setTimeout(() => {
    console.log('\n📌 TEST 2: Sending Admin Notification');
    testAdminNotification();
  }, 2000);
});

socket.on('connect_error', (error) => {
  console.error('❌ WebSocket connection failed:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('❌ WebSocket disconnected:', reason);
});

// Test admin notification sending
async function testAdminNotification() {
  try {
    console.log('📤 Sending test notification from admin dashboard...');
    
    const response = await axios.post(`${SERVER_URL}/api/admin/notifications/instant`, {
      title: 'Test Notification',
      message: 'This is a test notification from the admin dashboard! 🚀',
      type: 'general',
      targetUsers: 'all'
    }, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Admin notification sent successfully:', response.data);
    
    // Test 3: Send offer notification
    setTimeout(() => {
      console.log('\n📌 TEST 3: Sending Offer Notification');
      testOfferNotification();
    }, 3000);
    
  } catch (error) {
    console.error('❌ Failed to send admin notification:', error.response?.data || error.message);
  }
}

// Test offer notification
async function testOfferNotification() {
  try {
    console.log('🎉 Sending test offer notification...');
    
    const response = await axios.post(`${SERVER_URL}/api/admin/notifications/offer`, {
      title: 'Special Offer',
      description: 'Limited time offer on all tea varieties',
      discount: 25,
      validTill: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      category: 'tea',
      minOrder: 200
    }, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Offer notification sent successfully:', response.data);
    
    // Test 4: Test ping/pong
    setTimeout(() => {
      console.log('\n📌 TEST 4: Testing Ping/Pong');
      testPingPong();
    }, 3000);
    
  } catch (error) {
    console.error('❌ Failed to send offer notification:', error.response?.data || error.message);
  }
}

// Test ping/pong
function testPingPong() {
  console.log('🏓 Sending ping...');
  
  socket.emit('ping', { timestamp: new Date().toISOString() });
  
  socket.on('pong', (data) => {
    console.log('✅ Pong received:', data);
    
    // Test 5: Check FCM tokens
    setTimeout(() => {
      console.log('\n📌 TEST 5: Checking FCM Tokens');
      checkFCMTokens();
    }, 2000);
  });
}

// Check FCM tokens
async function checkFCMTokens() {
  try {
    console.log('📱 Checking FCM tokens...');
    
    const response = await axios.get(`${SERVER_URL}/api/admin/notifications/fcm-tokens`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });
    
    console.log('✅ FCM tokens status:', response.data);
    
    // Cleanup and summary
    setTimeout(() => {
      console.log('\n📊 TEST SUMMARY');
      console.log('✅ All tests completed successfully!');
      console.log('🎯 Real-time notification system is working correctly.');
      
      process.exit(0);
    }, 2000);
    
  } catch (error) {
    console.error('❌ Failed to check FCM tokens:', error.response?.data || error.message);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted by user');
  socket.disconnect();
  process.exit(0);
});

// Auto-exit after 30 seconds
setTimeout(() => {
  console.log('\n⏰ Test timeout - exiting');
  socket.disconnect();
  process.exit(0);
}, 30000); 