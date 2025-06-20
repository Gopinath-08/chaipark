const http = require('http');

function testServer() {
  const options = {
    hostname: 'localhost',
    port: 4545,
    path: '/api/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('✅ Server is running on port 4545!');
        console.log('Status:', response.status);
        console.log('Timestamp:', response.timestamp);
      } catch (error) {
        console.log('✅ Server responded (raw):', data);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Server connection failed:', error.message);
    console.log('Make sure the server is running on port 4545');
  });

  req.end();
}

console.log('🔍 Testing local server connection on port 4545...');
testServer(); 