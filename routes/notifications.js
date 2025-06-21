const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Mock notification data (replace with actual database in production)
let notificationHistory = [];
let dailyNotificationSettings = [
  { id: 'morning', name: 'Morning Tea Special', time: '09:00', enabled: true, message: '☕ Good morning! Start your day with our special morning tea blend. 20% off till 11 AM!' },
  { id: 'lunch', name: 'Lunch Deals', time: '12:00', enabled: true, message: '🍽️ Lunch time! Check out our combo meals with free delivery. Order now!' },
  { id: 'evening', name: 'Evening Snacks', time: '16:00', enabled: true, message: '🍪 Tea time! Perfect snacks to accompany your evening tea. Fresh & hot!' },
  { id: 'dinner', name: 'Dinner Specials', time: '19:00', enabled: true, message: '🌙 Dinner ready! Explore our dinner specials with family portions available.' }
];
let scheduledNotifications = [];
let notificationTemplates = [];

// Helper function to simulate sending notifications to mobile app users
const sendToMobileUsers = async (notificationData, targetUsers = 'all') => {
  // In production, this would integrate with FCM (Firebase Cloud Messaging)
  // or your push notification service
  console.log('📱 Sending notification to mobile users:', {
    title: notificationData.title,
    message: notificationData.message,
    type: notificationData.type,
    targetUsers: targetUsers
  });
  
  // Simulate notification delivery
  return {
    sent: true,
    recipientCount: getRecipientCount(targetUsers),
    timestamp: new Date()
  };
};

// Helper function to get recipient count based on target
const getRecipientCount = (targetUsers) => {
  const counts = {
    'all': 1250,
    'active': 850,
    'frequent': 320,
    'new': 180
  };
  return counts[targetUsers] || 0;
};

// Helper function to create notification history entry
const createHistoryEntry = (notificationData, result) => {
  return {
    id: Date.now().toString(),
    title: notificationData.title,
    message: notificationData.message,
    type: notificationData.type,
    targetUsers: notificationData.targetUsers || 'all',
    recipientCount: result.recipientCount,
    status: result.sent ? 'sent' : 'failed',
    createdAt: new Date(),
    sentAt: result.sent ? new Date() : null
  };
};

// Send instant notification
router.post('/instant', [
  authenticateToken,
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('type').isIn(['general', 'order', 'promotion', 'announcement']).withMessage('Invalid notification type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, message, type, targetUsers = 'all' } = req.body;
    
    // Send notification to mobile users
    const result = await sendToMobileUsers({ title, message, type }, targetUsers);
    
    // Add to history
    const historyEntry = createHistoryEntry({ title, message, type, targetUsers }, result);
    notificationHistory.unshift(historyEntry);
    
    res.json({
      success: true,
      message: 'Notification sent successfully',
      recipientCount: result.recipientCount
    });
  } catch (error) {
    console.error('Error sending instant notification:', error);
    res.status(500).json({ message: 'Failed to send notification' });
  }
});

// Send offer notification
router.post('/offer', [
  authenticateToken,
  body('title').notEmpty().withMessage('Offer title is required'),
  body('description').notEmpty().withMessage('Offer description is required'),
  body('discount').isNumeric().withMessage('Discount must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, discount, validTill, category, minOrder } = req.body;
    
    // Create offer notification message
    let message = `🎉 ${title}! Get ${discount}% off`;
    if (category && category !== 'all') {
      message += ` on ${category}`;
    }
    if (minOrder) {
      message += ` (Min order: ₹${minOrder})`;
    }
    if (validTill) {
      message += `. Valid till ${new Date(validTill).toLocaleDateString()}`;
    }
    message += '. Order now! 🛒';
    
    // Send notification
    const result = await sendToMobileUsers({
      title: `🎉 ${title}`,
      message: message,
      type: 'promotion'
    }, 'all');
    
    // Add to history
    const historyEntry = createHistoryEntry({
      title: `🎉 ${title}`,
      message: message,
      type: 'promotion',
      targetUsers: 'all'
    }, result);
    notificationHistory.unshift(historyEntry);
    
    res.json({
      success: true,
      message: 'Offer notification sent successfully',
      recipientCount: result.recipientCount
    });
  } catch (error) {
    console.error('Error sending offer notification:', error);
    res.status(500).json({ message: 'Failed to send offer notification' });
  }
});

// Get notification history
router.get('/history', authenticateToken, (req, res) => {
  try {
    res.json(notificationHistory);
  } catch (error) {
    console.error('Error fetching notification history:', error);
    res.status(500).json({ message: 'Failed to fetch notification history' });
  }
});

// Get daily notification settings
router.get('/daily-settings', authenticateToken, (req, res) => {
  try {
    res.json(dailyNotificationSettings);
  } catch (error) {
    console.error('Error fetching daily notification settings:', error);
    res.status(500).json({ message: 'Failed to fetch daily notification settings' });
  }
});

// Update daily notification settings
router.put('/daily-settings', [
  authenticateToken,
  body('settings').isArray().withMessage('Settings must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { settings } = req.body;
    dailyNotificationSettings = settings;
    
    // In production, you would save this to database and update cron jobs
    console.log('📅 Daily notification settings updated:', settings);
    
    res.json({
      success: true,
      message: 'Daily notification settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating daily notification settings:', error);
    res.status(500).json({ message: 'Failed to update daily notification settings' });
  }
});

// Delete notification from history
router.delete('/:notificationId', authenticateToken, (req, res) => {
  try {
    const { notificationId } = req.params;
    notificationHistory = notificationHistory.filter(notif => notif.id !== notificationId);
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});

// Get notification analytics
router.get('/analytics', authenticateToken, (req, res) => {
  try {
    const totalSent = notificationHistory.length;
    const totalRecipients = notificationHistory.reduce((sum, notif) => sum + notif.recipientCount, 0);
    const byType = notificationHistory.reduce((acc, notif) => {
      acc[notif.type] = (acc[notif.type] || 0) + 1;
      return acc;
    }, {});
    
    const analytics = {
      totalSent,
      totalRecipients,
      averageRecipients: totalSent > 0 ? Math.round(totalRecipients / totalSent) : 0,
      byType,
      dailyScheduled: dailyNotificationSettings.filter(n => n.enabled).length,
      recentActivity: notificationHistory.slice(0, 5)
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// Send test notification
router.post('/test', [
  authenticateToken,
  body('title').notEmpty().withMessage('Test title is required'),
  body('message').notEmpty().withMessage('Test message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, message } = req.body;
    
    // Send test notification (smaller audience)
    console.log('🧪 Sending test notification:', { title, message });
    
    res.json({
      success: true,
      message: 'Test notification sent successfully',
      recipientCount: 1 // Just to admin or test users
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ message: 'Failed to send test notification' });
  }
});

// Get user groups for targeting
router.get('/user-groups', authenticateToken, (req, res) => {
  try {
    const userGroups = [
      { id: 'all', name: 'All Users', count: 1250, description: 'All registered users' },
      { id: 'active', name: 'Active Users', count: 850, description: 'Users active in last 7 days' },
      { id: 'frequent', name: 'Frequent Customers', count: 320, description: 'Users with 5+ orders' },
      { id: 'new', name: 'New Users', count: 180, description: 'Users registered in last 30 days' }
    ];
    
    res.json(userGroups);
  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({ message: 'Failed to fetch user groups' });
  }
});

// Schedule notification for later
router.post('/schedule', [
  authenticateToken,
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('scheduledTime').isISO8601().withMessage('Valid scheduled time is required')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const scheduledNotification = {
      id: Date.now().toString(),
      ...req.body,
      status: 'scheduled',
      createdAt: new Date()
    };
    
    scheduledNotifications.push(scheduledNotification);
    
    res.json({
      success: true,
      message: 'Notification scheduled successfully',
      scheduledId: scheduledNotification.id
    });
  } catch (error) {
    console.error('Error scheduling notification:', error);
    res.status(500).json({ message: 'Failed to schedule notification' });
  }
});

// Cancel scheduled notification
router.delete('/scheduled/:notificationId', authenticateToken, (req, res) => {
  try {
    const { notificationId } = req.params;
    scheduledNotifications = scheduledNotifications.filter(notif => notif.id !== notificationId);
    
    res.json({
      success: true,
      message: 'Scheduled notification cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling scheduled notification:', error);
    res.status(500).json({ message: 'Failed to cancel scheduled notification' });
  }
});

// Get notification templates
router.get('/templates', authenticateToken, (req, res) => {
  try {
    const defaultTemplates = [
      {
        id: 'welcome',
        name: 'Welcome Message',
        title: 'Welcome to Chai Park! ☕',
        message: 'Thank you for joining us! Enjoy 20% off your first order with code WELCOME20',
        type: 'general'
      },
      {
        id: 'order_ready',
        name: 'Order Ready',
        title: 'Your order is ready! 🎉',
        message: 'Your delicious order is ready for pickup/delivery. Thank you for choosing Chai Park!',
        type: 'order'
      },
      {
        id: 'daily_special',
        name: 'Daily Special',
        title: 'Today\'s Special Deal! 🌟',
        message: 'Don\'t miss out on today\'s special offer. Limited time only!',
        type: 'promotion'
      }
    ];
    
    res.json([...defaultTemplates, ...notificationTemplates]);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ message: 'Failed to fetch templates' });
  }
});

// Save notification template
router.post('/templates', [
  authenticateToken,
  body('name').notEmpty().withMessage('Template name is required'),
  body('title').notEmpty().withMessage('Template title is required'),
  body('message').notEmpty().withMessage('Template message is required')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const template = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date()
    };
    
    notificationTemplates.push(template);
    
    res.json({
      success: true,
      message: 'Template saved successfully',
      template
    });
  } catch (error) {
    console.error('Error saving template:', error);
    res.status(500).json({ message: 'Failed to save template' });
  }
});

module.exports = router; 