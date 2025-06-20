const http = require('http');

const BASE_URL = 'localhost';
const PORT = 4545;

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
          console.log('Response:', JSON.stringify(response, null, 2));
          resolve(response);
        } catch (error) {
          console.log(`✅ ${method} ${path} - Status: ${res.statusCode} (Raw response)`);
          console.log('Raw response:', body);
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

async function testOrderEndpoint() {
  console.log('🚀 Testing Main Server Order Endpoint...\n');

  // Step 1: Register a user to get auth token
  console.log('🔐 Step 1: Registering user...');
  const registerData = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '1234567890',
    password: 'test123'
  };
  
  const registerResponse = await makeRequest('POST', '/auth/register', registerData);
  let authToken = null;
  
  if (registerResponse && registerResponse.success) {
    authToken = registerResponse.data.token;
    console.log('✅ Got auth token from registration');
  } else {
    // Try login if registration failed (user might already exist)
    console.log('🔄 Trying login instead...');
    const loginResponse = await makeRequest('POST', '/auth/login', {
      email: 'test@example.com',
      password: 'test123'
    });
    
    if (loginResponse && loginResponse.success) {
      authToken = loginResponse.data.token;
      console.log('✅ Got auth token from login');
    } else {
      console.log('❌ Failed to get auth token');
      return;
    }
  }

  console.log('');

  // Step 2: Test order creation with auth token
  console.log('📦 Step 2: Testing Order Creation with Auth...');
  const orderData = {
    items: [
      { menuItem: '6854d64ec2b620408efb4d23', quantity: 2 }
    ],
    deliveryInfo: {
      name: 'Test User',
      phone: '1234567890',
      address: '123 Test Street, Test Area'
    },
    paymentMethod: 'cod'
  };

  console.log('Order Data:', JSON.stringify(orderData, null, 2));
  console.log('');
  
  const orderResponse = await makeRequest('POST', '/orders', orderData, authToken);
  
  // Step 3: Test getting orders with auth token
  console.log('\n📋 Step 3: Testing Get Orders with Auth...');
  await makeRequest('GET', '/orders', null, authToken);

  // Step 4: Test getting current user info
  console.log('\n👤 Step 4: Testing Get Current User...');
  await makeRequest('GET', '/auth/me', null, authToken);
}

testOrderEndpoint(); 