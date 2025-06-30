require('dotenv').config();
const mongoose = require('mongoose');
const MenuItem = require('./models/MenuItem');

console.log(' Updating menu with LA Café items...');

// Create a dummy ObjectId for createdBy
const dummyUserId = new mongoose.Types.ObjectId();

const realMenuItems = [
  // BURGERS
  { name: 'Old School Burger', description: 'Classic burger with fresh ingredients', price: 115, category: 'main-course', isAvailable: true, featured: false, createdBy: dummyUserId },
  { name: 'Chicken Fillet Burger', description: 'Juicy chicken fillet burger with premium spices', price: 129, category: 'main-course', isAvailable: true, featured: true, createdBy: dummyUserId },
  { name: 'Cheese Burger', description: 'Delicious burger loaded with cheese', price: 169, category: 'main-course', isAvailable: true, featured: false, createdBy: dummyUserId },
  { name: 'LA Special Chicken Fillet Burger', description: 'Our signature chicken fillet burger with special sauce', price: 259, category: 'main-course', isAvailable: true, featured: true, createdBy: dummyUserId },
  { name: 'Cheese Burst Burger', description: 'Burger with cheese burst filling', price: 189, category: 'main-course', isAvailable: true, featured: false, createdBy: dummyUserId },
  { name: 'Egg Burger', description: 'Fresh egg burger with lettuce and herbs', price: 89, category: 'main-course', isAvailable: true, featured: false, createdBy: dummyUserId },
  { name: 'Aloo Tikki Burger', description: 'Crispy potato patty burger with chutneys', price: 89, category: 'main-course', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: true },
  { name: 'Special LA Veg Burger', description: 'Premium vegetarian burger with fresh vegetables', price: 195, category: 'main-course', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: true },

  // MUNCHES / SNACKS
  { name: 'French Fries', description: 'Golden crispy french fries', price: 115, category: 'snacks', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: true },
  { name: 'Peri Peri French Fries', description: 'Spicy peri peri seasoned fries', price: 129, category: 'snacks', isAvailable: true, featured: true, createdBy: dummyUserId, isVegetarian: true, isSpicy: true },
  { name: 'Chicken Popcorn', description: 'Bite-sized crispy chicken pieces', price: 155, category: 'snacks', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: false },
  { name: 'Veg Nuggets', description: 'Crispy vegetarian nuggets', price: 129, category: 'snacks', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: true },
  { name: 'Fish Popcorn', description: 'Crispy fish popcorn bites', price: 195, category: 'snacks', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: false },
  { name: 'Chicken Line Strips', description: 'Tender chicken strips with spices', price: 219, category: 'snacks', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: false },
  { name: 'Fish Fillet Strips', description: 'Fresh fish fillet strips', price: 219, category: 'snacks', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: false },
  { name: 'Crunchy Hot Flaky Corn', description: 'Spicy corn kernels with seasoning', price: 59, category: 'snacks', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: true, isSpicy: true },

  // FRIED CHICKEN
  { name: 'Fried Chicken (1PC)', description: 'Single piece of crispy fried chicken', price: 105, category: 'main-course', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: false },
  { name: 'Small Bucket (2PC)', description: 'Two pieces of fried chicken', price: 190, category: 'main-course', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: false },
  { name: 'Medium Bucket (4PC)', description: 'Four pieces of fried chicken', price: 369, category: 'main-course', isAvailable: true, featured: true, createdBy: dummyUserId, isVegetarian: false },
  { name: 'Large Bucket (6PC)', description: 'Six pieces of fried chicken', price: 519, category: 'main-course', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: false },
  { name: 'Family Bucket (8PC)', description: 'Eight pieces of fried chicken for family', price: 689, category: 'main-course', isAvailable: true, featured: true, createdBy: dummyUserId, isVegetarian: false },

  // COMBO MEALS
  { name: 'Chicken Fillet Burger Combo', description: 'Chicken fillet burger with fries and drink', price: 259, category: 'main-course', isAvailable: true, featured: true, createdBy: dummyUserId, isVegetarian: false },
  { name: 'Egg Burger Combo', description: 'Egg burger with fries and drink', price: 259, category: 'main-course', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: false },
  { name: 'Fried Chicken Combo', description: 'Fried chicken pieces with fries and drink', price: 259, category: 'main-course', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: false },
  { name: 'Chicken Wings Combo', description: 'Chicken wings with fries and drink', price: 259, category: 'main-course', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: false },
  { name: 'Veg Burger Combo', description: 'Veg burger with fries and drink', price: 259, category: 'main-course', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: true },

  // PIZZA
  { name: 'Margherita Pizza (8\")', description: 'Classic pizza with veggies and cheese', price: 200, category: 'main-course', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: true },
  { name: 'Margherita Pizza (10\")', description: 'Classic pizza with veggies and cheese - Large', price: 235, category: 'main-course', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: true },
  { name: 'Veg Delight Pizza (8\")', description: 'A vibrant celebration of garden fresh flavours', price: 220, category: 'main-course', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: true },
  { name: 'Veg Delight Pizza (10\")', description: 'A vibrant celebration of garden fresh flavours - Large', price: 290, category: 'main-course', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: true },
  { name: 'Crispy Chicken Pizza (8\")', description: 'Perfect harmony of tender chicken and rich flavors', price: 290, category: 'main-course', isAvailable: true, featured: true, createdBy: dummyUserId, isVegetarian: false },
  { name: 'Crispy Chicken Pizza (10\")', description: 'Perfect harmony of tender chicken and rich flavors - Large', price: 365, category: 'main-course', isAvailable: true, featured: true, createdBy: dummyUserId, isVegetarian: false },
  { name: 'LA Special Pizza', description: 'Perfect combination of simplicity and tradition', price: 390, category: 'main-course', isAvailable: true, featured: true, createdBy: dummyUserId, isVegetarian: false },

  // BEVERAGES
  { name: 'Cold Coffee', description: 'Refreshing cold coffee blend', price: 129, category: 'beverages', isAvailable: true, featured: true, createdBy: dummyUserId, isVegetarian: true },
  { name: 'Green Apple Delight', description: 'Fresh green apple flavored drink', price: 79, category: 'beverages', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: true },
  { name: 'Mango Delight', description: 'Sweet mango flavored refresher', price: 115, category: 'beverages', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: true },
  { name: 'Strawberry Delight', description: 'Fresh strawberry flavored drink', price: 95, category: 'beverages', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: true },
  { name: 'Choco Delight', description: 'Rich chocolate flavored beverage', price: 125, category: 'beverages', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: true },
  { name: 'Masala Cold Drinks', description: 'Spiced cold beverage', price: 60, category: 'beverages', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: true, isSpicy: true },
  { name: 'Soft Drinks', description: 'Assorted soft drinks', price: 39, category: 'beverages', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: true },
  { name: 'Lemon Tea', description: 'Fresh lemon tea', price: 20, category: 'tea', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: true },

  // COFFEE
  { name: 'Cappuccino', description: 'Classic cappuccino with frothy milk', price: 60, category: 'coffee', isAvailable: true, featured: true, createdBy: dummyUserId, isVegetarian: true },
  { name: 'Espresso', description: 'Strong espresso shot', price: 80, category: 'coffee', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: true },
  { name: 'Latte', description: 'Smooth coffee latte', price: 80, category: 'coffee', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: true },
  { name: 'Café Mocha', description: 'Coffee with chocolate flavor', price: 80, category: 'coffee', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: true },
  { name: 'Hot Chocolate', description: 'Rich hot chocolate drink', price: 90, category: 'coffee', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: true },

  // DESSERTS
  { name: 'Chocolate Ice Cake', description: 'Traditional chocolate brownie with ice cream', price: 130, category: 'desserts', isAvailable: true, featured: true, createdBy: dummyUserId, isVegetarian: true },
  { name: 'Choco Lava', description: 'Choco lava cake with ice cream', price: 130, category: 'desserts', isAvailable: true, featured: true, createdBy: dummyUserId, isVegetarian: true },

  // SOUTH SPECIAL
  { name: 'Bangalore Buns', description: 'Traditional South Indian buns', price: 75, category: 'snacks', isAvailable: true, featured: false, createdBy: dummyUserId, isVegetarian: true }
];

async function updateMenu() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(' Connected to MongoDB');
    
    // Clear existing menu items
    console.log(' Clearing existing menu items...');
    await MenuItem.deleteMany({});
    
    // Insert new menu items
    console.log(' Adding new LA Café menu items...');
    await MenuItem.insertMany(realMenuItems);
    
    console.log(' Successfully added ' + realMenuItems.length + ' menu items!');
    
    // Show summary
    const categories = ['main-course', 'snacks', 'beverages', 'coffee', 'tea', 'desserts'];
    console.log('\n Menu Summary:');
    for (const category of categories) {
      const count = realMenuItems.filter(item => item.category === category).length;
      if (count > 0) {
        console.log('- ' + category + ': ' + count + ' items');
      }
    }
    
    mongoose.disconnect();
    console.log('\n Menu update completed successfully!');
    
  } catch (error) {
    console.error(' Error:', error);
    mongoose.disconnect();
  }
}

updateMenu();
