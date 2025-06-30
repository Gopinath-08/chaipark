require('dotenv').config();
const mongoose = require('mongoose');
const MenuItem = require('./models/MenuItem');

console.log(' Updating menu with LA Café items...');

const realMenuItems = [
  // BURGERS
  { name: 'Old School Burger', description: 'Classic burger with fresh ingredients', price: 115, category: 'main-course', isAvailable: true, featured: false },
  { name: 'Chicken Fillet Burger', description: 'Juicy chicken fillet burger with premium spices', price: 129, category: 'main-course', isAvailable: true, featured: true },
  { name: 'Cheese Burger', description: 'Delicious burger loaded with cheese', price: 169, category: 'main-course', isAvailable: true, featured: false },
  { name: 'LA Special Chicken Fillet Burger', description: 'Our signature chicken fillet burger with special sauce', price: 259, category: 'main-course', isAvailable: true, featured: true },
  { name: 'Cheese Burst Burger', description: 'Burger with cheese burst filling', price: 189, category: 'main-course', isAvailable: true, featured: false },
  { name: 'Egg Burger', description: 'Fresh egg burger with lettuce and herbs', price: 89, category: 'main-course', isAvailable: true, featured: false },
  { name: 'Aloo Tikki Burger', description: 'Crispy potato patty burger with chutneys', price: 89, category: 'main-course', isAvailable: true, featured: false },
  { name: 'Special LA Veg Burger', description: 'Premium vegetarian burger with fresh vegetables', price: 195, category: 'main-course', isAvailable: true, featured: false },

  // MUNCHES / SNACKS
  { name: 'French Fries', description: 'Golden crispy french fries', price: 115, category: 'snacks', isAvailable: true, featured: false },
  { name: 'Peri Peri French Fries', description: 'Spicy peri peri seasoned fries', price: 129, category: 'snacks', isAvailable: true, featured: true },
  { name: 'Chicken Popcorn', description: 'Bite-sized crispy chicken pieces', price: 155, category: 'snacks', isAvailable: true, featured: false },
  { name: 'Veg Nuggets', description: 'Crispy vegetarian nuggets', price: 129, category: 'snacks', isAvailable: true, featured: false },
  
  // PIZZA  
  { name: 'Margherita Pizza (8\")', description: 'Classic pizza with veggies and cheese', price: 200, category: 'main-course', isAvailable: true, featured: false },
  { name: 'Margherita Pizza (10\")', description: 'Classic pizza with veggies and cheese - Large', price: 235, category: 'main-course', isAvailable: true, featured: false },
  { name: 'Crispy Chicken Pizza (8\")', description: 'Perfect harmony of tender chicken and rich flavors', price: 290, category: 'main-course', isAvailable: true, featured: true },
  { name: 'LA Special Pizza', description: 'Perfect combination of simplicity and tradition', price: 390, category: 'main-course', isAvailable: true, featured: true },
  
  // BEVERAGES
  { name: 'Cold Coffee', description: 'Refreshing cold coffee blend', price: 129, category: 'beverages', isAvailable: true, featured: true },
  { name: 'Cappuccino', description: 'Classic cappuccino with frothy milk', price: 60, category: 'coffee', isAvailable: true, featured: true },
  { name: 'Chocolate Ice Cake', description: 'Traditional chocolate brownie with ice cream', price: 130, category: 'desserts', isAvailable: true, featured: true }
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
    mongoose.disconnect();
    
  } catch (error) {
    console.error(' Error:', error);
    mongoose.disconnect();
  }
}

updateMenu();
