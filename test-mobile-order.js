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
            if (response.errors) {
              console.log('Validation errors:', JSON.stringify(response.errors, null, 2));
            }
          } else {
            console.log('✅ Success:', response.message);
          }
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

async function testMobileOrderFormat() {
  console.log('🚀 Testing Mobile App Order Format with Deployed Server\n');

  // Step 1: Login to get token
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

  console.log('');

  // Step 2: Test mobile app order format
  console.log('📦 Step 2: Testing Mobile App Order Format...');
  
  // This is the format the mobile app will send
  const mobileOrderData = {
    items: [
      { menuItem: '6854d64ec2b620408efb4d23', quantity: 2 }
    ],
    deliveryInfo: {
      name: 'Test User',
      phone: '9876543210',
      address: '123 Test Street, Test Area',
      instructions: 'Please deliver to the main gate'
    },
    paymentMethod: 'cod' // Cash on Delivery
  };

  console.log('Mobile Order Data:', JSON.stringify(mobileOrderData, null, 2));
  console.log('');
  
  const orderResponse = await makeRequest('POST', '/orders', mobileOrderData, authToken);
  
  if (orderResponse && orderResponse.success) {
    console.log(`✅ Order created successfully!`);
    console.log(`Order Number: ${orderResponse.data.order.orderNumber}`);
    console.log(`Total: ₹${orderResponse.data.order.total}`);
  }

  console.log('\n🎉 Mobile Order Format Test Completed!');
}

testMobileOrderFormat().catch(console.error); 