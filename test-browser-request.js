const http = require('http');

function testBrowserRequest() {
  console.log('🔍 Testing browser-like request to local server...\n');

  // Test 1: Basic health check (what the admin dashboard might call first)
  console.log('📋 Test 1: Health Check');
  const healthOptions = {
    hostname: 'localhost',
    port: 4545,
    path: '/api/health',
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Origin': 'http://localhost:3000',
      'Referer': 'http://localhost:3000/'
    }
  };

  const healthReq = http.request(healthOptions, (res) => {
    console.log(`✅ Health check - Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log(`Response: ${data}\n`);
    });
  });

  healthReq.on('error', (error) => {
    console.log(`❌ Health check failed: ${error.message}\n`);
  });

  healthReq.end();

  // Test 2: Admin login (what the admin dashboard calls when you log in)
  console.log('👑 Test 2: Admin Login');
  const loginOptions = {
    hostname: 'localhost',
    port: 4545,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Origin': 'http://localhost:3000',
      'Referer': 'http://localhost:3000/login'
    }
  };

  const loginReq = http.request(loginOptions, (res) => {
    console.log(`✅ Login - Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log(`Response: ${data}\n`);
    });
  });

  loginReq.on('error', (error) => {
    console.log(`❌ Login failed: ${error.message}\n`);
  });

  loginReq.write(JSON.stringify({
    email: 'admin@chaipark.com',
    password: 'admin123'
  }));
  loginReq.end();
}

testBrowserRequest(); 