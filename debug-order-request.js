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
          console.log(`Status: ${res.statusCode}`);
          if (response.success === false) {
            console.log(`❌ Error: ${response.message || response.error}`);
            if (response.errors) {
              console.log('🔍 Validation errors:');
              response.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error.path}: ${error.msg} (value: ${error.value})`);
              });
            }
          } else {
            console.log('✅ Success:', response.message);
          }
          resolve(response);
        } catch (error) {
          console.log(`Status: ${res.statusCode} (Raw response)`);
          console.log('Raw response:', body);
          resolve(body);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Network Error: ${error.message}`);
      resolve(null);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function debugOrderRequests() {
  console.log('🔍 Debugging Order Request Issues\n');

  // Step 1: Get auth token
  console.log('🔐 Step 1: Getting auth token...');
  const loginResponse = await makeRequest('POST', '/auth/login', {
    email: 'testuser@example.com',
    password: 'test123'
  });
  
  let authToken = '';
  if (loginResponse && loginResponse.success) {
    authToken = loginResponse.data.token;
    console.log('✅ Got auth token');
  } else {
    console.log('❌ Failed to get auth token');
    return;
  }

  console.log('\n' + '='.repeat(50));

  // Step 2: Test different order formats
  console.log('\n📦 Step 2: Testing Different Order Formats...\n');

  // Test 1: Original mobile app format (what might be failing)
  console.log('🧪 Test 1: Original Mobile App Format');
  const originalFormat = {
    items: [
      { _id: '6854d64ec2b620408efb4d23', quantity: 2 }
    ],
    deliveryInfo: {
      address: '123 Test Street, Test Area',
      instructions: 'Please deliver to the main gate'
    },
    paymentMethod: 'cash'
  };
  console.log('Request data:', JSON.stringify(originalFormat, null, 2));
  await makeRequest('POST', '/orders', originalFormat, authToken);

  console.log('\n' + '-'.repeat(30));

  // Test 2: Correct format
  console.log('\n🧪 Test 2: Correct Format');
  const correctFormat = {
    items: [
      { menuItem: '6854d64ec2b620408efb4d23', quantity: 2 }
    ],
    deliveryInfo: {
      name: 'Test User',
      phone: '9876543210',
      address: '123 Test Street, Test Area',
      instructions: 'Please deliver to the main gate'
    },
    paymentMethod: 'cod'
  };
  console.log('Request data:', JSON.stringify(correctFormat, null, 2));
  await makeRequest('POST', '/orders', correctFormat, authToken);

  console.log('\n' + '-'.repeat(30));

  // Test 3: Missing required fields
  console.log('\n🧪 Test 3: Missing Required Fields');
  const missingFields = {
    items: [
      { menuItem: '6854d64ec2b620408efb4d23', quantity: 2 }
    ],
    deliveryInfo: {
      address: '123 Test Street, Test Area'
    },
    paymentMethod: 'cod'
  };
  console.log('Request data:', JSON.stringify(missingFields, null, 2));
  await makeRequest('POST', '/orders', missingFields, authToken);

  console.log('\n🎯 Debug Complete!');
}

debugOrderRequests().catch(console.error); 