// Simulate the cart structure that would be sent from React Native
const cart = [
  {
    id: '6854d64ec2b620408efb4d23', // This is the menuItem ID
    name: 'Lali Chai',
    description: 'Ita ni jani k',
    price: '₹50',
    category: 'tea',
    image: '☕',
    quantity: 2 // This should be added by the cart management
  }
];

const deliveryInfo = {
  name: 'Test User',
  phone: '9876543210',
  address: '123 Test Street, Test Area',
  notes: 'Please deliver to the main gate'
};

const paymentMethod = 'cash';

// Simulate the order data preparation (same as CheckoutScreen)
const orderData = {
  items: cart.map((item) => ({
    menuItem: item.id, // This should work correctly
    quantity: item.quantity,
  })),
  deliveryInfo: {
    name: deliveryInfo.name,
    phone: deliveryInfo.phone,
    address: deliveryInfo.address,
    instructions: deliveryInfo.notes,
  },
  paymentMethod: paymentMethod === 'cash' ? 'cod' : paymentMethod,
};

console.log('🔍 Cart structure:', JSON.stringify(cart, null, 2));
console.log('🔍 Delivery info:', JSON.stringify(deliveryInfo, null, 2));
console.log('🔍 Payment method:', paymentMethod);
console.log('🔍 Final order data:', JSON.stringify(orderData, null, 2));

// Check if the structure is correct
console.log('\n✅ Validation:');
console.log('✅ Items have menuItem field:', orderData.items.every(item => item.menuItem));
console.log('✅ Items have quantity field:', orderData.items.every(item => item.quantity > 0));
console.log('✅ DeliveryInfo has name:', !!orderData.deliveryInfo.name);
console.log('✅ DeliveryInfo has phone:', !!orderData.deliveryInfo.phone);
console.log('✅ DeliveryInfo has address:', !!orderData.deliveryInfo.address);
console.log('✅ Payment method is valid:', ['cod', 'upi', 'card', 'wallet'].includes(orderData.paymentMethod)); 