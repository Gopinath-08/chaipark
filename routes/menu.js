const express = require('express');
const { body, validationResult, query } = require('express-validator');
const MenuItem = require('../models/MenuItem');
const { authenticateToken, requireAdmin, requireStaff } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Validation middleware
const validateMenuItem = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category')
    .isIn(['coffee', 'tea', 'snacks', 'desserts', 'beverages', 'main-course', 'appetizers'])
    .withMessage('Invalid category')
];

// @route   GET /api/menu
// @desc    Get all menu items (public)
// @access  Public
router.get('/', [
  query('category').optional().isString(),
  query('search').optional().isString(),
  query('featured').optional().isBoolean(),
  query('vegetarian').optional().isBoolean(),
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

  const { category, search, featured, vegetarian, page = 1, limit = 20 } = req.query;
  
  // Build query
  const query = { isAvailable: true };
  
  if (category && category !== 'all') {
    query.category = category;
  }
  
  if (featured === 'true') {
    query.featured = true;
  }
  
  if (vegetarian === 'true') {
    query.isVegetarian = true;
  }
  
  if (search) {
    query.$text = { $search: search };
  }

  // Pagination
  const skip = (page - 1) * limit;
  
  const menuItems = await MenuItem.find(query)
    .sort({ popularity: -1, name: 1 })
    .skip(skip)
    .limit(parseInt(limit))
    .select('-__v');

  const total = await MenuItem.countDocuments(query);

  res.json({
    success: true,
    data: {
      menuItems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// @route   GET /api/menu/featured
// @desc    Get featured menu items
// @access  Public
router.get('/featured', asyncHandler(async (req, res) => {
  const featuredItems = await MenuItem.getFeaturedItems();
  
  res.json({
    success: true,
    data: featuredItems
  });
}));

// @route   GET /api/menu/categories
// @desc    Get all categories
// @access  Public
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await MenuItem.distinct('category');
  
  res.json({
    success: true,
    data: categories
  });
}));

// @route   GET /api/menu/:id
// @desc    Get single menu item
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const menuItem = await MenuItem.findById(req.params.id);
  
  if (!menuItem) {
    return res.status(404).json({
      success: false,
      message: 'Menu item not found'
    });
  }

  res.json({
    success: true,
    data: menuItem
  });
}));

// @route   POST /api/menu
// @desc    Create new menu item
// @access  Private (Admin/Staff)
router.post('/', [
  authenticateToken,
  requireStaff,
  ...validateMenuItem
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const menuItemData = {
    ...req.body,
    createdBy: req.user._id
  };

  const menuItem = new MenuItem(menuItemData);
  await menuItem.save();

  res.status(201).json({
    success: true,
    message: 'Menu item created successfully',
    data: menuItem
  });
}));

// @route   PUT /api/menu/:id
// @desc    Update menu item
// @access  Private (Admin/Staff)
router.put('/:id', [
  authenticateToken,
  requireStaff,
  ...validateMenuItem
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const menuItem = await MenuItem.findById(req.params.id);
  
  if (!menuItem) {
    return res.status(404).json({
      success: false,
      message: 'Menu item not found'
    });
  }

  // Update fields
  Object.keys(req.body).forEach(key => {
    if (key !== 'createdBy') { // Don't allow changing creator
      menuItem[key] = req.body[key];
    }
  });

  await menuItem.save();

  res.json({
    success: true,
    message: 'Menu item updated successfully',
    data: menuItem
  });
}));

// @route   DELETE /api/menu/:id
// @desc    Delete menu item
// @access  Private (Admin)
router.delete('/:id', [
  authenticateToken,
  requireAdmin
], asyncHandler(async (req, res) => {
  const menuItem = await MenuItem.findById(req.params.id);
  
  if (!menuItem) {
    return res.status(404).json({
      success: false,
      message: 'Menu item not found'
    });
  }

  await MenuItem.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Menu item deleted successfully'
  });
}));

// @route   PATCH /api/menu/:id/availability
// @desc    Toggle menu item availability
// @access  Private (Staff)
router.patch('/:id/availability', [
  authenticateToken,
  requireStaff
], asyncHandler(async (req, res) => {
  const menuItem = await MenuItem.findById(req.params.id);
  
  if (!menuItem) {
    return res.status(404).json({
      success: false,
      message: 'Menu item not found'
    });
  }

  menuItem.isAvailable = !menuItem.isAvailable;
  await menuItem.save();

  res.json({
    success: true,
    message: `Menu item ${menuItem.isAvailable ? 'made available' : 'made unavailable'}`,
    data: {
      isAvailable: menuItem.isAvailable
    }
  });
}));

// @route   PATCH /api/menu/:id/feature
// @desc    Toggle menu item featured status
// @access  Private (Admin)
router.patch('/:id/feature', [
  authenticateToken,
  requireAdmin
], asyncHandler(async (req, res) => {
  const menuItem = await MenuItem.findById(req.params.id);
  
  if (!menuItem) {
    return res.status(404).json({
      success: false,
      message: 'Menu item not found'
    });
  }

  menuItem.featured = !menuItem.featured;
  await menuItem.save();

  res.json({
    success: true,
    message: `Menu item ${menuItem.featured ? 'featured' : 'unfeatured'}`,
    data: {
      featured: menuItem.featured
    }
  });
}));

// @route   POST /api/menu/:id/rating
// @desc    Add rating to menu item
// @access  Private
router.post('/:id/rating', [
  authenticateToken,
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const menuItem = await MenuItem.findById(req.params.id);
  
  if (!menuItem) {
    return res.status(404).json({
      success: false,
      message: 'Menu item not found'
    });
  }

  await menuItem.updateRating(parseInt(req.body.rating));

  res.json({
    success: true,
    message: 'Rating added successfully',
    data: {
      rating: menuItem.ratings
    }
  });
}));

// @route   GET /api/menu/stats/popular
// @desc    Get popular menu items
// @access  Private (Admin/Staff)
router.get('/stats/popular', [
  authenticateToken,
  requireStaff
], asyncHandler(async (req, res) => {
  const { limit = 10, days = 30 } = req.query;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const popularItems = await MenuItem.find({
    createdAt: { $gte: startDate }
  })
  .sort({ popularity: -1 })
  .limit(parseInt(limit))
  .select('name popularity ratings');

  res.json({
    success: true,
    data: popularItems
  });
}));

module.exports = router; 