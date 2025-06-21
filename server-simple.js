const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://10.0.2.2:5001',
    'http://10.0.2.2:3000',
    'http://localhost:8081',
    'http://10.0.2.2:8081',
    '*'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// In-memory storage (for testing)
let users = [];
let menuItems = [
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
  },
  {
    _id: '6',
    name: 'Sandwich',
    description: 'Fresh vegetable sandwich',
    price: 90,
    category: 'snacks',
    isAvailable: true,
    featured: false,
  },
  {
    _id: '7',
    name: 'Croissant',
    description: 'Buttery French pastry',
    price: 70,
    category: 'snacks',
    isAvailable: true,
    featured: false,
  },
  {
    _id: '8',
    name: 'Chocolate Cake',
    description: 'Rich chocolate cake',
    price: 150,
    category: 'desserts',
    isAvailable: true,
    featured: true,
  },
  {
    _id: '9',
    name: 'Ice Cream',
    description: 'Vanilla ice cream',
    price: 100,
    category: 'desserts',
    isAvailable: true,
    featured: false,
  },
  {
    _id: '10',
    name: 'Fresh Juice',
    description: 'Orange juice',
    price: 80,
    category: 'beverages',
    isAvailable: true,
    featured: false,
  },
];

let orders = [];

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Test endpoints
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'React Native connection successful!',
    timestamp: new Date().toISOString(),
    headers: req.headers
  });
});

app.post('/api/test', (req, res) => {
  res.json({ 
    message: 'POST request successful!',
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validation
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user exists
    const existingUser = users.find(u => u.email === email || u.phone === phone);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email ? 'Email already registered' : 'Phone number already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = {
      _id: Date.now().toString(),
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'user',
      isActive: true,
      isVerified: true,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    // Generate token
    const token = generateToken(newUser._id);

    // Remove password from response
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

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
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

// Menu routes
app.get('/api/menu', (req, res) => {
  res.json({
    success: true,
    data: {
      menuItems
    }
  });
});

app.get('/api/menu/categories', (req, res) => {
  const categories = [...new Set(menuItems.map(item => item.category))];
  res.json({
    success: true,
    data: categories
  });
});

app.get('/api/menu/featured', (req, res) => {
  const featuredItems = menuItems.filter(item => item.featured);
  res.json({
    success: true,
    data: {
      menuItems: featuredItems
    }
  });
});

// Orders routes
app.post('/api/orders', (req, res) => {
  try {
    const { items, deliveryInfo, paymentMethod } = req.body;

    // Validation
    if (!items || !deliveryInfo || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Calculate pricing
    const subtotal = items.reduce((sum, item) => {
      const menuItem = menuItems.find(m => m._id === item._id);
      return sum + (menuItem ? menuItem.price * item.quantity : 0);
    }, 0);

    const deliveryFee = subtotal > 500 ? 0 : 20; // Free delivery above ₹500, otherwise ₹20
    const total = subtotal + deliveryFee;

    // Create order
    const newOrder = {
      _id: Date.now().toString(),
      orderNumber: 'CP' + Date.now(),
      customer: {
        _id: '1',
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
      },
      items: items.map(item => {
        const menuItem = menuItems.find(m => m._id === item._id);
        return {
          _id: item._id,
          name: menuItem ? menuItem.name : 'Unknown Item',
          price: menuItem ? menuItem.price : 0,
          quantity: item.quantity,
        };
      }),
      pricing: {
        subtotal,
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

app.get('/api/orders', (req, res) => {
  res.json({
    success: true,
    data: {
      orders
    }
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Simple server running on port ${PORT}`);
  console.log(`Test with: http://localhost:${PORT}/api/test`);
  console.log(`Register: POST http://localhost:${PORT}/api/auth/register`);
  console.log(`Menu: GET http://localhost:${PORT}/api/menu`);
}); 