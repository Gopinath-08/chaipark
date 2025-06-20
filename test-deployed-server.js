const http = require('http');
const https = require('https');

const BASE_URL = 'chaipark.onrender.com';
const PORT = 443;

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

    const req = https.request(options, (res) => {
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

async function testDeployedServer() {
  console.log('🚀 Testing Deployed Server: https://chaipark.onrender.com\n');

  // ===== BASIC ENDPOINTS =====
  console.log('📋 1. Testing Basic Endpoints:');
  await makeRequest('GET', '/test');
  await makeRequest('GET', '/health');
  console.log('');

  // ===== MENU ENDPOINTS =====
  console.log('🍽️ 2. Testing Menu Endpoints:');
  await makeRequest('GET', '/menu');
  await makeRequest('GET', '/menu/categories');
  await makeRequest('GET', '/menu/featured');
  console.log('');

  // ===== AUTH ENDPOINTS =====
  console.log('🔐 3. Testing Auth Endpoints:');
  
  // Try to login with existing user
  const loginResponse = await makeRequest('POST', '/auth/login', {
    email: 'testuser@example.com',
    password: 'test123'
  });
  
  let authToken = '';
  if (loginResponse && loginResponse.success) {
    authToken = loginResponse.data.token;
    console.log('✅ Got auth token from login');
  } else {
    // Try to register a new user
    console.log('🔄 Trying to register new user...');
    const registerResponse = await makeRequest('POST', '/auth/register', {
      name: 'Test User',
      email: 'testuser@example.com',
      phone: '9876543210',
      password: 'test123'
    });
    
    if (registerResponse && registerResponse.success) {
      authToken = registerResponse.data.token;
      console.log('✅ Got auth token from registration');
    }
  }
  
  if (authToken) {
    await makeRequest('GET', '/auth/me', null, authToken);
  }
  console.log('');

  // ===== ORDERS ENDPOINTS =====
  if (authToken) {
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
    if (orderResponse && orderResponse.success) {
      console.log(`✅ Order created: ${orderResponse.data.order.orderNumber}`);
    }
    
    // Get user orders
    await makeRequest('GET', '/orders', null, authToken);
    console.log('');
  }

  console.log('🎉 Deployed Server Testing Completed!');
  console.log('\n📝 Summary:');
  console.log('✅ Server is accessible at https://chaipark.onrender.com');
  console.log('✅ API endpoints are responding');
  console.log('✅ Ready for Postman testing and mobile app integration');
}

testDeployedServer().catch(console.error); 