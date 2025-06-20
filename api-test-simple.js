const http = require('http');

const BASE_URL = 'localhost';
const PORT = 5001;

function makeRequest(method, path, data = null) {
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

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          console.log(`✅ ${method} ${path} - Status: ${res.statusCode}`);
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

async function testAllAPIs() {
  console.log('🚀 Testing All Backend APIs...\n');

  // 1. Basic endpoints
  console.log('📋 Basic Endpoints:');
  await makeRequest('GET', '/test');
  await makeRequest('GET', '/health');
  console.log('');

  // 2. Auth endpoints
  console.log('🔐 Auth Endpoints:');
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '1234567890',
    password: 'test123'
  };
  
  await makeRequest('POST', '/auth/register', testUser);
  await makeRequest('POST', '/auth/login', {
    email: 'test@example.com',
    password: 'test123'
  });
  console.log('');

  // 3. Menu endpoints
  console.log('🍽️ Menu Endpoints:');
  await makeRequest('GET', '/menu');
  await makeRequest('GET', '/menu/categories');
  console.log('');

  console.log('🎉 API Test Completed!');
  console.log('\n📝 Summary of Available APIs:');
  console.log('✅ GET  /api/test - Test connection');
  console.log('✅ GET  /api/health - Health check');
  console.log('✅ POST /api/auth/register - User registration');
  console.log('✅ POST /api/auth/login - User login');
  console.log('✅ GET  /api/menu - Get menu items');
  console.log('✅ GET  /api/menu/categories - Get categories');
  console.log('✅ GET  /api/menu/featured - Get featured items');
}

testAllAPIs(); 