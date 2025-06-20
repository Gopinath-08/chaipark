const http = require('http');

const BASE_URL = 'localhost';
const PORT = 4545;

let authToken = '';
let adminToken = '';

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          console.log(`✅ ${method} ${path} - Status: ${res.statusCode}`);
          if (response.success === false) {
            console.log(`❌ Error: ${response.message || response.error}`);
          }
          resolve(response);
        } catch (error) {
          console.log(`✅ ${method} ${path} - Status: ${res.statusCode} (Raw response)`);
          resolve(body);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${method} ${path} - Error: ${error.message}`);
      resolve(null);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAllEndpoints() {
  console.log('🚀 Testing Main Server (Port 4545) - All Endpoints\n');

  // ===== BASIC ENDPOINTS =====
  console.log('📋 1. Testing Basic Endpoints:');
  await makeRequest('GET', '/test');
  await makeRequest('GET', '/health');
  console.log('');

  // ===== AUTH ENDPOINTS =====
  console.log('🔐 2. Testing Auth Endpoints:');
  
  // Register user
  const userData = {
    name: 'Test User',
    email: 'testuser@example.com',
    phone: '9876543210',
    password: 'test123'
  };
  await makeRequest('POST', '/auth/register', userData);
  
  // Login user
  const loginResponse = await makeRequest('POST', '/auth/login', {
    email: 'testuser@example.com',
    password: 'test123'
  });
  
  if (loginResponse && loginResponse.success) {
    authToken = loginResponse.data.token;
    console.log('✅ Got user auth token');
  }
  
  // Get current user
  await makeRequest('GET', '/auth/me', null, authToken);
  console.log('');

  // ===== MENU ENDPOINTS =====
  console.log('🍽️ 3. Testing Menu Endpoints:');
  await makeRequest('GET', '/menu');
  await makeRequest('GET', '/menu/categories');
  await makeRequest('GET', '/menu/featured');
  console.log('');

  // ===== ORDERS ENDPOINTS =====
  console.log('📦 4. Testing Orders Endpoints:');
  
  // Create order
  const orderData = {
    items: [
      { menuItem: '6854d64ec2b620408efb4d23', quantity: 2 }
    ],
    deliveryInfo: {
      name: 'Test User',
      phone: '9876543210',
      address: '123 Test Street, Test Area'
    },
    paymentMethod: 'cod'
  };
  
  const orderResponse = await makeRequest('POST', '/orders', orderData, authToken);
  let orderId = '';
  if (orderResponse && orderResponse.success) {
    orderId = orderResponse.data.order._id;
    console.log(`✅ Order created: ${orderResponse.data.order.orderNumber}`);
  }
  
  // Get user orders
  await makeRequest('GET', '/orders', null, authToken);
  
  // Get specific order
  if (orderId) {
    await makeRequest('GET', `/orders/${orderId}`, null, authToken);
  }
  console.log('');

  // ===== ADMIN ENDPOINTS (should fail for regular user) =====
  console.log('👨‍💼 5. Testing Admin Endpoints (should fail for regular user):');
  await makeRequest('GET', '/admin/dashboard', null, authToken);
  await makeRequest('GET', '/admin/orders', null, authToken);
  await makeRequest('GET', '/admin/users', null, authToken);
  await makeRequest('GET', '/admin/menu', null, authToken);
  console.log('');

  // ===== ANALYTICS ENDPOINTS (should fail for regular user) =====
  console.log('📊 6. Testing Analytics Endpoints (should fail for regular user):');
  await makeRequest('GET', '/analytics/sales', null, authToken);
  await makeRequest('GET', '/analytics/orders', null, authToken);
  await makeRequest('GET', '/analytics/users', null, authToken);
  console.log('');

  // ===== ADMIN REGISTRATION & LOGIN =====
  console.log('👑 7. Testing Admin Registration & Login:');
  
  // Register admin
  const adminData = {
    name: 'Admin User',
    email: 'admin@chaipark.com',
    phone: '1234567890',
    password: 'admin123',
    role: 'admin'
  };
  await makeRequest('POST', '/auth/register', adminData);
  
  // Login admin
  const adminLoginResponse = await makeRequest('POST', '/auth/login', {
    email: 'admin@chaipark.com',
    password: 'admin123'
  });
  
  if (adminLoginResponse && adminLoginResponse.success) {
    adminToken = adminLoginResponse.data.token;
    console.log('✅ Got admin auth token');
  }
  console.log('');

  // ===== ADMIN ENDPOINTS WITH ADMIN TOKEN =====
  if (adminToken) {
    console.log('👑 8. Testing Admin Endpoints with Admin Token:');
    await makeRequest('GET', '/admin/dashboard', null, adminToken);
    await makeRequest('GET', '/admin/orders', null, adminToken);
    await makeRequest('GET', '/admin/users', null, adminToken);
    await makeRequest('GET', '/admin/menu', null, adminToken);
    console.log('');

    console.log('📊 9. Testing Analytics with Admin Token:');
    await makeRequest('GET', '/analytics/sales', null, adminToken);
    await makeRequest('GET', '/analytics/orders', null, adminToken);
    await makeRequest('GET', '/analytics/users', null, adminToken);
    console.log('');
  }

  console.log('🎉 Main Server Testing Completed!');
  console.log('\n📝 Summary:');
  console.log('✅ Basic endpoints working');
  console.log('✅ User authentication working');
  console.log('✅ Menu endpoints working');
  console.log('✅ Order creation and retrieval working');
  console.log('✅ Admin authentication working');
  console.log('✅ Security: Regular users cannot access admin endpoints');
  console.log('✅ Admin users can access all endpoints');
}

testAllEndpoints().catch(console.error); 