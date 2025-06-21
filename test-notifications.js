const axios = require('axios');

// Test configuration
const API_BASE_URL = 'http://localhost:4545/api';
const ADMIN_EMAIL = 'admin@chaiparkapp.com';
const ADMIN_PASSWORD = 'admin123';

let authToken = '';

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ Error in ${method} ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
};

// Test functions
const testLogin = async () => {
  console.log('🔐 Testing admin login...');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    authToken = response.data.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
};

const testInstantNotification = async () => {
  console.log('📢 Testing instant notification...');
  try {
    const result = await makeRequest('POST', '/admin/notifications/instant', {
      title: 'Test Notification',
      message: 'This is a test notification from the admin dashboard!',
      type: 'general',
      targetUsers: 'all'
    });
    
    console.log('✅ Instant notification sent:', result);
    return true;
  } catch (error) {
    return false;
  }
};

const testOfferNotification = async () => {
  console.log('🎉 Testing offer notification...');
  try {
    const result = await makeRequest('POST', '/admin/notifications/offer', {
      title: 'Weekend Special',
      description: 'Get amazing discounts on all tea varieties',
      discount: '25',
      validTill: '2024-12-31',
      category: 'tea',
      minOrder: '100'
    });
    
    console.log('✅ Offer notification sent:', result);
    return true;
  } catch (error) {
    return false;
  }
};

const testNotificationHistory = async () => {
  console.log('📋 Testing notification history...');
  try {
    const result = await makeRequest('GET', '/admin/notifications/history');
    console.log('✅ Notification history retrieved:', result.length, 'notifications');
    return true;
  } catch (error) {
    return false;
  }
};

const testDailySettings = async () => {
  console.log('⏰ Testing daily notification settings...');
  try {
    // Get current settings
    const currentSettings = await makeRequest('GET', '/admin/notifications/daily-settings');
    console.log('✅ Current daily settings retrieved:', currentSettings.length, 'settings');
    
    // Update settings
    const updatedSettings = currentSettings.map(setting => ({
      ...setting,
      enabled: true // Enable all notifications for testing
    }));
    
    const updateResult = await makeRequest('PUT', '/admin/notifications/daily-settings', {
      settings: updatedSettings
    });
    
    console.log('✅ Daily settings updated:', updateResult);
    return true;
  } catch (error) {
    return false;
  }
};

const testAnalytics = async () => {
  console.log('📊 Testing notification analytics...');
  try {
    const result = await makeRequest('GET', '/admin/notifications/analytics');
    console.log('✅ Analytics retrieved:', result);
    return true;
  } catch (error) {
    return false;
  }
};

const testUserGroups = async () => {
  console.log('👥 Testing user groups...');
  try {
    const result = await makeRequest('GET', '/admin/notifications/user-groups');
    console.log('✅ User groups retrieved:', result.length, 'groups');
    return true;
  } catch (error) {
    return false;
  }
};

const testTemplates = async () => {
  console.log('📝 Testing notification templates...');
  try {
    const result = await makeRequest('GET', '/admin/notifications/templates');
    console.log('✅ Templates retrieved:', result.length, 'templates');
    
    // Test saving a new template
    const newTemplate = await makeRequest('POST', '/admin/notifications/templates', {
      name: 'Test Template',
      title: 'Test Template Title',
      message: 'This is a test template message.',
      type: 'general'
    });
    
    console.log('✅ New template saved:', newTemplate);
    return true;
  } catch (error) {
    return false;
  }
};

// Main test function
const runAllTests = async () => {
  console.log('🚀 Starting Chai Park Notification System Tests...\n');
  
  const tests = [
    { name: 'Admin Login', fn: testLogin },
    { name: 'Instant Notification', fn: testInstantNotification },
    { name: 'Offer Notification', fn: testOfferNotification },
    { name: 'Notification History', fn: testNotificationHistory },
    { name: 'Daily Settings', fn: testDailySettings },
    { name: 'Analytics', fn: testAnalytics },
    { name: 'User Groups', fn: testUserGroups },
    { name: 'Templates', fn: testTemplates }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      failed++;
    }
    console.log(''); // Add spacing between tests
  }
  
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All notification tests passed! Your notification system is ready to use.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the error messages above.');
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testLogin,
  testInstantNotification,
  testOfferNotification,
  testNotificationHistory,
  testDailySettings,
  testAnalytics,
  testUserGroups,
  testTemplates
}; 