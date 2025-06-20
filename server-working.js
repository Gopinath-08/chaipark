const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage
let users = [];
let orders = [];
const JWT_SECRET = 'test-secret';

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Working!' });
});

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Registration endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields required'
      });
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      _id: Date.now().toString(),
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'user',
      isActive: true,
      isVerified: true
    };

    users.push(newUser);
    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '7d' });
    
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password required'
      });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get current user endpoint
app.get('/api/auth/me', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u._id === decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      success: true,
      data: {
        user: userWithoutPassword
      }
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Menu endpoint
app.get('/api/menu', (req, res) => {
  res.json({
    success: true,
    data: {
      menuItems: [
        {
          _id: '1',
          name: 'Espresso',
          description: 'Strong Italian coffee',
          price: 80,
          category: 'coffee',
          isAvailable: true,
          featured: false,
        },
        {
          _id: '2',
          name: 'Cappuccino',
          description: 'Espresso with steamed milk foam',
          price: 120,
          category: 'coffee',
          isAvailable: true,
          featured: true,
        },
        {
          _id: '3',
          name: 'Latte',
          description: 'Espresso with steamed milk',
          price: 130,
          category: 'coffee',
          isAvailable: true,
          featured: false,
        },
        {
          _id: '4',
          name: 'Green Tea',
          description: 'Refreshing green tea',
          price: 60,
          category: 'tea',
          isAvailable: true,
          featured: false,
        },
        {
          _id: '5',
          name: 'Masala Chai',
          description: 'Spiced Indian tea',
          price: 50,
          category: 'tea',
          isAvailable: true,
          featured: true,
        }
      ]
    }
  });
});

// Categories endpoint
app.get('/api/menu/categories', (req, res) => {
  res.json({
    success: true,
    data: ['coffee', 'tea', 'snacks', 'desserts', 'beverages']
  });
});

// Featured items endpoint
app.get('/api/menu/featured', (req, res) => {
  res.json({
    success: true,
    data: {
      menuItems: [
        {
          _id: '2',
          name: 'Cappuccino',
          description: 'Espresso with steamed milk foam',
          price: 120,
          category: 'coffee',
          isAvailable: true,
          featured: true,
        },
        {
          _id: '5',
          name: 'Masala Chai',
          description: 'Spiced Indian tea',
          price: 50,
          category: 'tea',
          isAvailable: true,
          featured: true,
        }
      ]
    }
  });
});

// Create order endpoint
app.post('/api/orders', (req, res) => {
  try {
    const { items, deliveryInfo, paymentMethod } = req.body;
    
    if (!items || !deliveryInfo || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Calculate pricing
    const subtotal = items.reduce((sum, item) => {
      const menuItem = [
        { _id: '1', price: 80 },
        { _id: '2', price: 120 },
        { _id: '3', price: 130 },
        { _id: '4', price: 60 },
        { _id: '5', price: 50 }
      ].find(m => m._id === item._id);
      return sum + (menuItem ? menuItem.price * item.quantity : 0);
    }, 0);

    const tax = subtotal * 0.1;
    const deliveryFee = 30;
    const total = subtotal + tax + deliveryFee;

    const newOrder = {
      _id: Date.now().toString(),
      orderNumber: 'CP' + Date.now(),
      customer: {
        _id: '1',
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
      },
      items: items.map(item => ({
        _id: item._id,
        name: 'Menu Item',
        price: 100,
        quantity: item.quantity,
      })),
      pricing: {
        subtotal,
        tax,
        deliveryFee,
        total,
      },
      status: 'pending',
      paymentMethod,
      paymentStatus: 'pending',
      deliveryInfo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    orders.push(newOrder);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order: newOrder
      }
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get user orders endpoint
app.get('/api/orders', (req, res) => {
  res.json({
    success: true,
    data: {
      orders
    }
  });
});

const PORT = 5001;

app.listen(PORT, () => {
  console.log('Complete server running on port', PORT);
  console.log('Test: http://localhost:5001/api/test');
  console.log('Register: POST http://localhost:5001/api/auth/register');
  console.log('Login: POST http://localhost:5001/api/auth/login');
  console.log('Menu: GET http://localhost:5001/api/menu');
  console.log('Orders: POST http://localhost:5001/api/orders');
}); 