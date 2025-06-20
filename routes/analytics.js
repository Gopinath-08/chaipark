const express = require('express');
const { query, validationResult } = require('express-validator');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// @route   GET /api/analytics/overview
// @desc    Get analytics overview
// @access  Private (Admin)
router.get('/overview', [
  authenticateToken,
  requireAdmin
], asyncHandler(async (req, res) => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Today's stats
  const todayStats = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfDay, $lt: endOfDay }
      }
    },
    {
      $group: {
        _id: null,
        orders: { $sum: 1 },
        revenue: { $sum: '$pricing.total' },
        avgOrderValue: { $avg: '$pricing.total' }
      }
    }
  ]);

  // Weekly stats
  const weeklyStats = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: lastWeek },
        status: { $ne: 'cancelled' },
        paymentStatus: 'paid'
      }
    },
    {
      $group: {
        _id: null,
        orders: { $sum: 1 },
        revenue: { $sum: '$pricing.total' },
        avgOrderValue: { $avg: '$pricing.total' }
      }
    }
  ]);

  // Monthly stats
  const monthlyStats = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: lastMonth },
        status: { $ne: 'cancelled' },
        paymentStatus: 'paid'
      }
    },
    {
      $group: {
        _id: null,
        orders: { $sum: 1 },
        revenue: { $sum: '$pricing.total' },
        avgOrderValue: { $avg: '$pricing.total' }
      }
    }
  ]);

  // Total customers
  const totalCustomers = await User.countDocuments({ role: 'user' });

  // Popular items
  const popularItems = await MenuItem.find()
    .sort({ popularity: -1 })
    .limit(10)
    .select('name popularity ratings');

  res.json({
    success: true,
    data: {
      today: todayStats[0] || { orders: 0, revenue: 0, avgOrderValue: 0 },
      weekly: weeklyStats[0] || { orders: 0, revenue: 0, avgOrderValue: 0 },
      monthly: monthlyStats[0] || { orders: 0, revenue: 0, avgOrderValue: 0 },
      totalCustomers,
      popularItems
    }
  });
}));

// @route   GET /api/analytics/revenue
// @desc    Get revenue analytics
// @access  Private (Admin)
router.get('/revenue', [
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

// @route   GET /api/analytics/orders
// @desc    Get order analytics
// @access  Private (Admin)
router.get('/orders', [
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