const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chaipark');
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@chaipark.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

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

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase(); 