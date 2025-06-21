const mongoose = require('mongoose');
const User = require('./models/User');
const MenuItem = require('./models/MenuItem');
require('dotenv').config();

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chaipark');
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@chaipark.com' });
    if (!existingAdmin) {
      // Create admin user
      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@chaipark.com',
        phone: '1234567890',
        password: 'admin123',
        role: 'admin',
        isActive: true,
        isVerified: true
      });

      await adminUser.save();
      console.log('Admin user created successfully');
      console.log('Email: admin@chaipark.com');
      console.log('Password: admin123');
    } else {
      console.log('Admin user already exists');
    }

    // Check if menu items already exist
    const existingItems = await MenuItem.countDocuments();
    if (existingItems > 0) {
      console.log('Menu items already exist');
      return;
    }

    // Get admin user for createdBy field
    const admin = await User.findOne({ email: 'admin@chaipark.com' });
    
    // Create featured menu items
    const menuItems = [
      {
        name: 'Masala Chai',
        description: 'Traditional Indian spiced tea with aromatic blend of cardamom, cinnamon, and ginger',
        price: 50,
        category: 'tea',
        isAvailable: true,
        featured: true,
        isVegetarian: true,
        preparationTime: 5,
        calories: 80,
        popularity: 95,
        ratings: { average: 4.8, count: 120 },
        tags: ['spiced', 'traditional', 'hot'],
        createdBy: admin._id
      },
      {
        name: 'Cappuccino',
        description: 'Rich espresso with steamed milk foam, perfectly balanced for coffee lovers',
        price: 120,
        category: 'coffee',
        isAvailable: true,
        featured: true,
        isVegetarian: true,
        preparationTime: 8,
        calories: 150,
        popularity: 88,
        ratings: { average: 4.6, count: 95 },
        tags: ['espresso', 'milk', 'foam'],
        createdBy: admin._id
      },
      {
        name: 'Chocolate Cake',
        description: 'Decadent rich chocolate cake with layers of smooth chocolate ganache',
        price: 150,
        category: 'desserts',
        isAvailable: true,
        featured: true,
        isVegetarian: true,
        preparationTime: 2,
        calories: 380,
        popularity: 78,
        ratings: { average: 4.7, count: 67 },
        tags: ['chocolate', 'sweet', 'dessert'],
        createdBy: admin._id
      },
      {
        name: 'Samosa',
        description: 'Crispy golden pastry filled with spiced potatoes and peas, served hot',
        price: 25,
        category: 'snacks',
        isAvailable: true,
        featured: true,
        isVegetarian: true,
        isSpicy: true,
        preparationTime: 15,
        calories: 180,
        popularity: 85,
        ratings: { average: 4.5, count: 150 },
        tags: ['crispy', 'spiced', 'traditional'],
        createdBy: admin._id
      },
      // Non-featured items
      {
        name: 'Espresso',
        description: 'Strong Italian coffee shot, perfect for espresso enthusiasts',
        price: 80,
        category: 'coffee',
        isAvailable: true,
        featured: false,
        isVegetarian: true,
        preparationTime: 3,
        calories: 5,
        popularity: 65,
        ratings: { average: 4.3, count: 45 },
        tags: ['strong', 'italian', 'shot'],
        createdBy: admin._id
      },
      {
        name: 'Green Tea',
        description: 'Refreshing and healthy green tea with antioxidants',
        price: 60,
        category: 'tea',
        isAvailable: true,
        featured: false,
        isVegetarian: true,
        preparationTime: 4,
        calories: 2,
        popularity: 55,
        ratings: { average: 4.2, count: 38 },
        tags: ['healthy', 'antioxidant', 'light'],
        createdBy: admin._id
      },
      {
        name: 'Vegetable Sandwich',
        description: 'Fresh multi-grain sandwich with seasonal vegetables and mint chutney',
        price: 90,
        category: 'snacks',
        isAvailable: true,
        featured: false,
        isVegetarian: true,
        preparationTime: 12,
        calories: 250,
        popularity: 45,
        ratings: { average: 4.0, count: 28 },
        tags: ['healthy', 'fresh', 'vegetables'],
        createdBy: admin._id
      },
      {
        name: 'Kulhad Coffee',
        description: 'Traditional clay pot coffee with rich aroma and earthy taste',
        price: 70,
        category: 'coffee',
        isAvailable: true,
        featured: false,
        isVegetarian: true,
        preparationTime: 6,
        calories: 120,
        popularity: 72,
        ratings: { average: 4.4, count: 52 },
        tags: ['traditional', 'clay-pot', 'aromatic'],
        createdBy: admin._id
      }
    ];

    // Insert menu items
    await MenuItem.insertMany(menuItems);
    console.log('Menu items created successfully');
    console.log(`Total items: ${menuItems.length}`);
    console.log(`Featured items: ${menuItems.filter(item => item.featured).length}`);

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase(); 