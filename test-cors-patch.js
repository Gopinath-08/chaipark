const http = require('http');

function testCorsPatch() {
  console.log('🔍 Testing CORS PATCH request...\n');

  // Test PATCH request to admin order status endpoint
  const options = {
    hostname: 'localhost',
    port: 4545,
    path: '/api/admin/orders/test-id/status',
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:3000',
      'Access-Control-Request-Method': 'PATCH',
      'Access-Control-Request-Headers': 'Content-Type, Authorization'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`✅ PATCH request - Status: ${res.statusCode}`);
    console.log('CORS Headers:');
    console.log('Access-Control-Allow-Origin:', res.headers['access-control-allow-origin']);
    console.log('Access-Control-Allow-Methods:', res.headers['access-control-allow-methods']);
    console.log('Access-Control-Allow-Headers:', res.headers['access-control-allow-headers']);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log(`Response: ${data}\n`);
    });
  });

  req.on('error', (error) => {
    console.log(`❌ PATCH request failed: ${error.message}\n`);
  });

  req.write(JSON.stringify({
    status: 'confirmed'
  }));
  req.end();
}

testCorsPatch(); 