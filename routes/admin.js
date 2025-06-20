const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Order = require('../models/Order');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const { authenticateToken, requireAdmin, requireStaff } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard overview
// @access  Private (Admin/Staff)
router.get('/dashboard', [
  authenticateToken,
  requireStaff
], asyncHandler(async (req, res) => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Today's stats
  const todayOrders = await Order.countDocuments({
    createdAt: { $gte: startOfDay, $lt: endOfDay }
  });

  const todayRevenue = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfDay, $lt: endOfDay },
        status: { $ne: 'cancelled' },
        paymentStatus: 'paid'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$pricing.total' }
      }
    }
  ]);

  // Pending orders
  const pendingOrders = await Order.countDocuments({
    status: { $in: ['pending', 'confirmed', 'preparing'] }
  });

  // Total customers
  const totalCustomers = await User.countDocuments({ role: 'user' });

  // Popular items
  const popularItems = await MenuItem.find()
    .sort({ popularity: -1 })
    .limit(5)
    .select('name popularity ratings');

  // Recent orders
  const recentOrders = await Order.find()
    .populate('customer', 'name phone')
    .sort({ createdAt: -1 })
    .limit(10)
    .select('orderNumber status pricing.total customer createdAt');

  // Weekly revenue
  const weeklyRevenue = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: lastWeek },
        status: { $ne: 'cancelled' },
        paymentStatus: 'paid'
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: '$pricing.total' },
        orders: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  // Monthly revenue
  const monthlyRevenue = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: lastMonth },
        status: { $ne: 'cancelled' },
        paymentStatus: 'paid'
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        revenue: { $sum: '$pricing.total' },
        orders: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  res.json({
    success: true,
    data: {
      today: {
        orders: todayOrders,
        revenue: todayRevenue[0]?.total || 0
      },
      pendingOrders,
      totalCustomers,
      popularItems,
      recentOrders,
      weeklyRevenue,
      monthlyRevenue
    }
  });
}));

// @route   GET /api/admin/orders
// @desc    Get all orders (admin view)
// @access  Private (Admin/Staff)
router.get('/orders', [
  authenticateToken,
  requireStaff,
  query('status').optional().isString(),
  query('date').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { status, date, page = 1, limit = 20 } = req.query;
  
  const query = {};
  
  if (status) {
    query.status = status;
  }
  
  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    query.createdAt = { $gte: startDate, $lt: endDate };
  }

  const skip = (page - 1) * limit;
  
  const orders = await Order.find(query)
    .populate('customer', 'name phone email')
    .populate('items.menuItem', 'name image')
    .populate('assignedTo', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Order.countDocuments(query);

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// @route   GET /api/admin/orders/:id
// @desc    Get single order details (admin view)
// @access  Private (Admin/Staff)
router.get('/orders/:id', [
  authenticateToken,
  requireStaff
], asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customer', 'name email phone address')
    .populate('items.menuItem', 'name image description price')
    .populate('assignedTo', 'name email');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  res.json({
    success: true,
    data: order
  });
}));

// @route   PATCH /api/admin/orders/:id/assign
// @desc    Assign order to staff member
// @access  Private (Admin)
router.patch('/orders/:id/assign', [
  authenticateToken,
  requireAdmin,
  body('assignedTo').isMongoId().withMessage('Valid staff ID required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { assignedTo } = req.body;

  // Verify staff member exists
  const staffMember = await User.findById(assignedTo);
  if (!staffMember || !['admin', 'staff'].includes(staffMember.role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid staff member'
    });
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  order.assignedTo = assignedTo;
  await order.save();

  res.json({
    success: true,
    message: 'Order assigned successfully',
    data: {
      assignedTo: staffMember.name
    }
  });
}));

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/users', [
  authenticateToken,
  requireAdmin,
  query('role').optional().isString(),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { role, search, page = 1, limit = 20 } = req.query;
  
  const query = {};
  
  if (role) {
    query.role = role;
  }
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  
  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// @route   PATCH /api/admin/users/:id/status
// @desc    Toggle user active status
// @access  Private (Admin)
router.patch('/users/:id/status', [
  authenticateToken,
  requireAdmin
], asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Prevent deactivating own account
  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({
      success: false,
      message: 'Cannot deactivate your own account'
    });
  }

  user.isActive = !user.isActive;
  await user.save();

  res.json({
    success: true,
    message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      isActive: user.isActive
    }
  });
}));

// @route   PATCH /api/admin/users/:id/role
// @desc    Update user role
// @access  Private (Admin)
router.patch('/users/:id/role', [
  authenticateToken,
  requireAdmin,
  body('role').isIn(['user', 'staff', 'admin']).withMessage('Invalid role')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { role } = req.body;

  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Prevent changing own role
  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({
      success: false,
      message: 'Cannot change your own role'
    });
  }

  user.role = role;
  await user.save();

  res.json({
    success: true,
    message: 'User role updated successfully',
    data: {
      role: user.role
    }
  });
}));

// @route   POST /api/admin/users
// @desc    Create new staff/admin user
// @access  Private (Admin)
router.post('/users', [
  authenticateToken,
  requireAdmin,
  body('name').trim().isLength({ min: 2, max: 50 }),
  body('email').isEmail().normalizeEmail(),
  body('phone').matches(/^[0-9]{10}$/),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['staff', 'admin'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { name, email, phone, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ 
    $or: [{ email }, { phone }] 
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: existingUser.email === email ? 'Email already registered' : 'Phone number already registered'
    });
  }

  const user = new User({
    name,
    email,
    phone,
    password,
    role,
    isActive: true,
    isVerified: true
  });

  await user.save();

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: {
      user: user.getPublicProfile()
    }
  });
}));

// @route   GET /api/admin/reports/revenue
// @desc    Get revenue reports
// @access  Private (Admin)
router.get('/reports/revenue', [
  authenticateToken,
  requireAdmin,
  query('startDate').isISO8601(),
  query('endDate').isISO8601()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { startDate, endDate } = req.query;
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const revenueStats = await Order.getRevenueStats(start, end);

  // Daily breakdown
  const dailyRevenue = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
        status: { $ne: 'cancelled' },
        paymentStatus: 'paid'
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: '$pricing.total' },
        orders: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  // Category breakdown
  const categoryRevenue = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
        status: { $ne: 'cancelled' },
        paymentStatus: 'paid'
      }
    },
    {
      $unwind: '$items'
    },
    {
      $lookup: {
        from: 'menuitems',
        localField: 'items.menuItem',
        foreignField: '_id',
        as: 'menuItem'
      }
    },
    {
      $unwind: '$menuItem'
    },
    {
      $group: {
        _id: '$menuItem.category',
        revenue: { $sum: '$items.totalPrice' },
        orders: { $sum: 1 }
      }
    },
    {
      $sort: { revenue: -1 }
    }
  ]);

  res.json({
    success: true,
    data: {
      summary: revenueStats[0] || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 },
      dailyRevenue,
      categoryRevenue
    }
  });
}));

// @route   GET /api/admin/reports/orders
// @desc    Get order reports
// @access  Private (Admin)
router.get('/reports/orders', [
  authenticateToken,
  requireAdmin,
  query('startDate').isISO8601(),
  query('endDate').isISO8601()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { startDate, endDate } = req.query;
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  // Status breakdown
  const statusBreakdown = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  // Payment method breakdown
  const paymentBreakdown = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        revenue: { $sum: '$pricing.total' }
      }
    },
    {
      $sort: { revenue: -1 }
    }
  ]);

  // Average delivery time
  const deliveryTimeStats = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
        status: 'delivered',
        actualDeliveryTime: { $exists: true }
      }
    },
    {
      $addFields: {
        deliveryTime: {
          $divide: [
            { $subtract: ['$actualDeliveryTime', '$createdAt'] },
            1000 * 60 // Convert to minutes
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        avgDeliveryTime: { $avg: '$deliveryTime' },
        minDeliveryTime: { $min: '$deliveryTime' },
        maxDeliveryTime: { $max: '$deliveryTime' }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      statusBreakdown,
      paymentBreakdown,
      deliveryTimeStats: deliveryTimeStats[0] || {}
    }
  });
}));

module.exports = router; 