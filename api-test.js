const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  phone: '1234567890',
  password: 'test123'
};

const testLogin = {
  email: 'test@example.com',
  password: 'test123'
};

let authToken = '';

// Test functions
async function testEndpoint(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios(config);
    console.log(`✅ ${method} ${endpoint} - Status: ${response.status}`);
    return response.data;
  } catch (error) {
    console.log(`❌ ${method} ${endpoint} - Error: ${error.response?.status || error.message}`);
    return null;
  }
}

async function runAllTests() {
  console.log('🚀 Starting API Tests...\n');

  // 1. Test basic endpoints
  console.log('📋 Testing Basic Endpoints:');
  await testEndpoint('GET', '/test');
  await testEndpoint('POST', '/test', { test: 'data' });
  await testEndpoint('GET', '/health');
  console.log('');

  // 2. Test Auth endpoints
  console.log('🔐 Testing Auth Endpoints:');
  await testEndpoint('POST', '/auth/register', testUser);
  await testEndpoint('POST', '/auth/login', testLogin);
  
  // Test login to get token
  const loginResponse = await testEndpoint('POST', '/auth/login', testLogin);
  if (loginResponse && loginResponse.success) {
    authToken = loginResponse.data.token;
    console.log('✅ Got auth token');
  }
  console.log('');

  // 3. Test Menu endpoints
  console.log('🍽️ Testing Menu Endpoints:');
  await testEndpoint('GET', '/menu');
  await testEndpoint('GET', '/menu/categories');
  await testEndpoint('GET', '/menu/featured');
  console.log('');

  // 4. Test Orders endpoints (with auth)
  console.log('📦 Testing Orders Endpoints:');
  const orderData = {
    items: [
      { _id: '1', quantity: 2 },
      { _id: '2', quantity: 1 }
    ],
    deliveryInfo: {
      address: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345',
      instructions: 'Test delivery'
    },
    paymentMethod: 'cash'
  };
  
  await testEndpoint('POST', '/orders', orderData, authToken);
  await testEndpoint('GET', '/orders', null, authToken);
  console.log('');

  // 5. Test User endpoints (with auth)
  console.log('👤 Testing User Endpoints:');
  await testEndpoint('GET', '/auth/me', null, authToken);
  console.log('');

  // 6. Test Admin endpoints (should fail without admin token)
  console.log('👨‍💼 Testing Admin Endpoints (should fail for regular user):');
  await testEndpoint('GET', '/admin/dashboard', null, authToken);
  await testEndpoint('GET', '/admin/orders', null, authToken);
  await testEndpoint('GET', '/admin/users', null, authToken);
  console.log('');

  // 7. Test Analytics endpoints (should fail without admin token)
  console.log('📊 Testing Analytics Endpoints (should fail for regular user):');
  await testEndpoint('GET', '/analytics/sales', null, authToken);
  await testEndpoint('GET', '/analytics/orders', null, authToken);
  console.log('');

  console.log('🎉 API Tests Completed!');
}

// Run the tests
runAllTests().catch(console.error); 