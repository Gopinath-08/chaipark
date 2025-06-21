const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const { authenticateToken, requireStaff } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendOrderStatusNotification } = require('../utils/notificationHelper');

const router = express.Router();

// Validation middleware
const validateOrder = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.menuItem').isMongoId().withMessage('Invalid menu item ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('paymentMethod').isIn(['cod', 'upi', 'card', 'wallet']).withMessage('Invalid payment method'),
  body('deliveryInfo.name').trim().isLength({ min: 2 }).withMessage('Name is required'),
  body('deliveryInfo.phone').matches(/^[0-9]{10}$/).withMessage('Valid phone number is required'),
  body('deliveryInfo.address').trim().isLength({ min: 10 }).withMessage('Valid address is required')
];

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', [
  authenticateToken,
  ...validateOrder
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { items, paymentMethod, deliveryInfo, notes } = req.body;

  // Validate and get menu items
  const menuItems = await MenuItem.find({
    _id: { $in: items.map(item => item.menuItem) },
    isAvailable: true
  });

  if (menuItems.length !== items.length) {
    return res.status(400).json({
      success: false,
      message: 'Some items are not available'
    });
  }

  // Calculate order items with prices
  const orderItems = items.map(item => {
    const menuItem = menuItems.find(mi => mi._id.toString() === item.menuItem);
    const totalPrice = menuItem.price * item.quantity;
    
    return {
      menuItem: item.menuItem,
      name: menuItem.name,
      price: menuItem.price,
      quantity: item.quantity,
      customization: item.customization || [],
      specialInstructions: item.specialInstructions,
      totalPrice
    };
  });

  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const deliveryFee = subtotal > 500 ? 0 : 20; // Free delivery above ₹500, otherwise ₹20
  const total = subtotal + deliveryFee;

  // Create order
  const order = new Order({
    customer: req.user._id,
    items: orderItems,
    paymentMethod,
    deliveryInfo,
    pricing: {
      subtotal,
      deliveryFee,
      total
    },
    notes: {
      customer: notes?.customer || ''
    },
    estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000) // 45 minutes from now
  });

  // Generate order number before saving
  if (!order.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    const orderCount = await Order.countDocuments({
      createdAt: { $gte: todayStart, $lt: todayEnd }
    });
    const sequence = (orderCount + 1).toString().padStart(3, '0');
    order.orderNumber = `CP${year}${month}${day}${sequence}`;
  }

  await order.save();

  // Increment popularity for ordered items
  for (const item of orderItems) {
    await MenuItem.findByIdAndUpdate(item.menuItem, {
      $inc: { popularity: item.quantity }
    });
  }

  // Emit real-time update to admin dashboard
  const io = req.app.get('io');
  if (io) {
    io.to('admin').emit('new-order', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      customer: req.user.name,
      total: order.pricing.total,
      status: order.status
    });
  }

  res.status(201).json({
    success: true,
    message: 'Order placed successfully',
    data: {
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.pricing.total,
        estimatedDeliveryTime: order.estimatedDeliveryTime
      }
    }
  });
}));

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
router.get('/', [
  authenticateToken,
  query('status').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { status, page = 1, limit = 10 } = req.query;
  
  const query = { customer: req.user._id };
  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;
  
  const orders = await Order.find(query)
    .populate('items.menuItem', 'name image')
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

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customer', 'name email phone')
    .populate('items.menuItem', 'name image description')
    .populate('assignedTo', 'name');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check if user owns the order or is staff
  if (order.customer._id.toString() !== req.user._id.toString() && 
      !['admin', 'staff'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  res.json({
    success: true,
    data: order
  });
}));

// @route   PATCH /api/orders/:id/status
// @desc    Update order status (Staff only)
// @access  Private (Staff)
router.patch('/:id/status', [
  authenticateToken,
  requireStaff,
  body('status').isIn(['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled']),
  body('notes').optional().isString()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { status, notes } = req.body;
  
  const order = await Order.findById(req.params.id)
    .populate('customer', 'name phone');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Update status
  await order.updateStatus(status, notes);

  // Send notification to customer
  try {
    await sendOrderStatusNotification(order, status);
  } catch (error) {
    console.error('Failed to send notification:', error);
    // Don't fail the request if notification fails
  }

  // Emit real-time update
  const io = req.app.get('io');
  if (io) {
    io.to('admin').emit('order-status-updated', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      customer: order.customer.name
    });
  }

  res.json({
    success: true,
    message: 'Order status updated successfully',
    data: {
      status: order.status,
      updatedAt: order.updatedAt
    }
  });
}));

// @route   PATCH /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private
router.patch('/:id/cancel', [
  authenticateToken,
  body('reason').optional().isString()
], asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customer', 'name phone');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check if user can cancel the order
  if (order.customer._id.toString() !== req.user._id.toString() && 
      !['admin', 'staff'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Check if order can be cancelled
  if (['delivered', 'cancelled'].includes(order.status)) {
    return res.status(400).json({
      success: false,
      message: 'Order cannot be cancelled'
    });
  }

  order.status = 'cancelled';
  order.cancellationReason = req.user.role === 'user' ? 'customer-request' : 'other';
  order.cancellationNote = req.body.reason || '';
  await order.save();

  // Emit real-time update
  const io = req.app.get('io');
  if (io) {
    io.to('admin').emit('order-cancelled', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      customer: order.customer.name
    });
  }

  res.json({
    success: true,
    message: 'Order cancelled successfully'
  });
}));

// @route   POST /api/orders/:id/rating
// @desc    Add rating to order
// @access  Private
router.post('/:id/rating', [
  authenticateToken,
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().isString().isLength({ max: 500 }).withMessage('Review too long')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check if user owns the order
  if (order.customer.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Check if order is delivered
  if (order.status !== 'delivered') {
    return res.status(400).json({
      success: false,
      message: 'Can only rate delivered orders'
    });
  }

  // Check if already rated
  if (order.rating.rating) {
    return res.status(400).json({
      success: false,
      message: 'Order already rated'
    });
  }

  order.rating = {
    rating: req.body.rating,
    review: req.body.review,
    reviewDate: new Date()
  };

  await order.save();

  res.json({
    success: true,
    message: 'Rating added successfully',
    data: {
      rating: order.rating
    }
  });
}));

// @route   GET /api/orders/tracking/:orderNumber
// @desc    Track order by order number
// @access  Public
router.get('/tracking/:orderNumber', asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber })
    .populate('customer', 'name phone')
    .select('-__v');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  res.json({
    success: true,
    data: {
      orderNumber: order.orderNumber,
      status: order.status,
      customer: order.customer.name,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      actualDeliveryTime: order.actualDeliveryTime,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }
  });
}));

module.exports = router; 