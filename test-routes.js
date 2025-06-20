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
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
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

async function testRoutes() {
  console.log('🚀 Testing Available Routes\n');

  // Test basic endpoints
  console.log('📋 Testing Basic Endpoints');
  await makeRequest('GET', '/health');
  await makeRequest('GET', '/test');
  console.log('');

  // Test auth endpoints
  console.log('🔐 Testing Auth Endpoints');
  await makeRequest('POST', '/auth/login', {
    email: 'admin@chaipark.com',
    password: 'admin123'
  });
  console.log('');

  // Test admin endpoints
  console.log('👑 Testing Admin Endpoints');
  const loginResponse = await makeRequest('POST', '/auth/login', {
    email: 'admin@chaipark.com',
    password: 'admin123'
  });
  
  let adminToken = '';
  if (loginResponse && loginResponse.success) {
    adminToken = loginResponse.data.token;
    console.log('✅ Admin login successful');
  } else {
    console.log('❌ Admin login failed');
    return;
  }

  await makeRequest('GET', '/admin/dashboard', null, adminToken);
  await makeRequest('GET', '/admin/orders', null, adminToken);
  await makeRequest('GET', '/admin/users', null, adminToken);
  console.log('');

  // Test specific admin order status endpoint
  console.log('🔄 Testing Admin Order Status Endpoint');
  const ordersResponse = await makeRequest('GET', '/admin/orders', null, adminToken);
  
  if (ordersResponse && ordersResponse.success && ordersResponse.data.orders.length > 0) {
    const orderId = ordersResponse.data.orders[0]._id;
    console.log(`📝 Testing with order ID: ${orderId}`);
    
    // Test the exact endpoint that's failing
    await makeRequest('PATCH', `/admin/orders/${orderId}/status`, {
      status: 'confirmed',
      notes: 'Test status update'
    }, adminToken);
  }
  console.log('');

  // Test regular orders endpoint
  console.log('📦 Testing Regular Orders Endpoint');
  await makeRequest('GET', '/orders', null, adminToken);
  console.log('');

  console.log('🎉 Route Testing Completed!');
}

testRoutes().catch(console.error); 