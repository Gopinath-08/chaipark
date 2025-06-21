const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private (Admin)
router.get('/', [
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

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Private
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: user
  });
}));

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private
router.put('/:id', [
  authenticateToken,
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  body('phone').optional().matches(/^[0-9]{10}$/),
  body('address').optional().isObject()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Update allowed fields
  const { name, phone, address } = req.body;
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (address) user.address = address;

  await user.save();

  res.json({
    success: true,
    message: 'User updated successfully',
    data: user.getPublicProfile()
  });
}));

// Register/Update FCM token for push notifications
router.post('/fcm-token', [
  body('token').notEmpty().withMessage('FCM token is required'),
  body('platform').isIn(['ios', 'android']).withMessage('Platform must be ios or android')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, platform, appVersion, deviceInfo } = req.body;
    const userId = req.user?.id; // From auth middleware

    // Store FCM token (in production, save to database)
    const fcmTokenData = {
      userId,
      token,
      platform,
      appVersion,
      deviceInfo,
      registeredAt: new Date(),
      isActive: true
    };

    // In production, save to database
    // await FCMToken.findOneAndUpdate(
    //   { userId, platform },
    //   fcmTokenData,
    //   { upsert: true, new: true }
    // );

    console.log('📱 FCM token registered:', {
      userId: userId || 'anonymous',
      platform,
      token: token.substring(0, 20) + '...' // Log partial token for security
    });

    res.json({
      success: true,
      message: 'FCM token registered successfully',
      data: {
        platform,
        registeredAt: fcmTokenData.registeredAt
      }
    });
  } catch (error) {
    console.error('Error registering FCM token:', error);
    res.status(500).json({ message: 'Failed to register FCM token' });
  }
});

// Get user notification preferences
router.get('/notification-preferences', async (req, res) => {
  try {
    const userId = req.user?.id;

    // In production, get from database
    const defaultPreferences = {
      general: true,
      promotions: true,
      orderUpdates: true,
      dailyReminders: true,
      sounds: true,
      vibration: true
    };

    res.json({
      success: true,
      preferences: defaultPreferences
    });
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    res.status(500).json({ message: 'Failed to get notification preferences' });
  }
});

// Update user notification preferences
router.put('/notification-preferences', [
  body('general').optional().isBoolean(),
  body('promotions').optional().isBoolean(),
  body('orderUpdates').optional().isBoolean(),
  body('dailyReminders').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user?.id;
    const preferences = req.body;

    // In production, save to database
    console.log('📱 Notification preferences updated:', { userId, preferences });

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      preferences
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ message: 'Failed to update notification preferences' });
  }
});

module.exports = router; 