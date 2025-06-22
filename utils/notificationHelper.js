// Notification helper for sending order status updates and daily notifications
// Enhanced with cron job scheduling for daily notifications

const cron = require('node-cron');
let dailyNotificationCronJobs = {}; // Store active cron jobs
let notificationSettings = []; // Cache for current settings

const sendOrderStatusNotification = async (order, newStatus) => {
  try {
    // For now, we'll just log the notification
    // In a real implementation, you would use FCM or a similar service
    
    const statusMessages = {
      confirmed: {
        title: '✅ Order Confirmed!',
        message: `Your order #${order.orderNumber} has been confirmed and is being prepared.`,
      },
      preparing: {
        title: '👨‍🍳 Order Being Prepared',
        message: `Your delicious order #${order.orderNumber} is now being prepared with love!`,
      },
      ready: {
        title: '🎉 Order Ready!',
        message: `Great news! Your order #${order.orderNumber} is ready for pickup/delivery.`,
      },
      'out-for-delivery': {
        title: '🚚 Out for Delivery',
        message: `Your order #${order.orderNumber} is on its way!`,
      },
      delivered: {
        title: '✨ Order Delivered!',
        message: `Enjoy your meal! Your order #${order.orderNumber} has been delivered. Thank you for choosing ChaiPark!`,
      },
      cancelled: {
        title: '❌ Order Cancelled',
        message: `Your order #${order.orderNumber} has been cancelled. If you have any questions, please contact us.`,
      },
    };

    const notificationData = statusMessages[newStatus];
    
    if (notificationData) {
      console.log(`📱 Notification would be sent:`);
      console.log(`   To: ${order.customer.name} (${order.customer.phone})`);
      console.log(`   Title: ${notificationData.title}`);
      console.log(`   Message: ${notificationData.message}`);
      console.log(`   Order: ${order.orderNumber}`);
      console.log(`   Status: ${newStatus}`);
      
      // TODO: Implement actual push notification sending with FCM
      // Example with Firebase Admin SDK:
      // const message = {
      //   notification: {
      //     title: notificationData.title,
      //     body: notificationData.message,
      //   },
      //   data: {
      //     type: 'order_status',
      //     orderId: order._id.toString(),
      //     orderNumber: order.orderNumber,
      //     status: newStatus,
      //   },
      //   token: userFCMToken // Get from user's stored FCM token
      // };
      // 
      // const response = await admin.messaging().send(message);
      // console.log('Successfully sent message:', response);
      
      return {
        success: true,
        message: 'Notification logged successfully',
        data: notificationData
      };
    }
    
    return {
      success: false,
      message: 'No notification template found for status'
    };
    
  } catch (error) {
    console.error('Error sending notification:', error);
    return {
      success: false,
      message: 'Failed to send notification',
      error: error.message
    };
  }
};

const sendPromotionalNotification = async (users, title, message, data = {}) => {
  try {
    console.log(`🎁 Promotional notification would be sent:`);
    console.log(`   To: ${users.length} users`);
    console.log(`   Title: ${title}`);
    console.log(`   Message: ${message}`);
    console.log(`   Data:`, data);
    
    // TODO: Implement batch sending for promotional notifications with FCM
    // const messages = users.map(user => ({
    //   notification: { title, body: message },
    //   data: { type: 'promotion', ...data },
    //   token: user.fcmToken
    // }));
    
    // const response = await admin.messaging().sendAll(messages);
    // console.log(`Successfully sent ${response.successCount} messages`);
    
    return {
      success: true,
      message: `Promotional notification logged for ${users.length} users`,
      data: { title, message, data }
    };
    
  } catch (error) {
    console.error('Error sending promotional notification:', error);
    return {
      success: false,
      message: 'Failed to send promotional notification',
      error: error.message
    };
  }
};

// Send daily notification via notification system
const sendDailyNotification = async (notification) => {
  try {
    console.log(`📅 Sending daily notification: ${notification.name} at ${new Date().toLocaleTimeString()}`);
    
    // Get the notification API function to send to mobile users
    const notificationAPI = require('../routes/notifications');
    
    // Create notification data
    const notificationData = {
      title: notification.name,
      message: notification.message,
      type: 'general'
    };

    // Send via WebSocket to all connected clients
    const io = require('../server').io;
    if (io) {
      const notificationPayload = {
        id: Date.now().toString() + '_daily_' + notification.id,
        title: notification.name,
        message: notification.message,
        type: 'general',
        source: 'daily_scheduler',
        notificationType: 'daily',
        timestamp: new Date().toISOString(),
        data: {
          type: 'daily',
          source: 'scheduler',
          scheduledTime: notification.time,
          notificationId: notification.id,
        }
      };

      // Broadcast to all connected clients
      io.emit('admin_notification', notificationPayload);
      console.log(`✅ Daily notification broadcasted: ${notification.name}`);
      
      return {
        success: true,
        message: 'Daily notification sent successfully',
        recipientCount: io.sockets.sockets.size
      };
    } else {
      console.log('⚠️ Socket.IO not available, notification not sent');
      return {
        success: false,
        message: 'Socket.IO not available'
      };
    }
  } catch (error) {
    console.error('❌ Error sending daily notification:', error);
    return {
      success: false,
      message: 'Failed to send daily notification',
      error: error.message
    };
  }
};

// Clear all existing cron jobs
const clearAllCronJobs = () => {
  Object.keys(dailyNotificationCronJobs).forEach(jobId => {
    const job = dailyNotificationCronJobs[jobId];
    if (job) {
      job.destroy();
      console.log(`🗑️ Cleared cron job: ${jobId}`);
    }
  });
  dailyNotificationCronJobs = {};
};

// Create cron job for a notification
const createCronJob = (notification) => {
  const [hours, minutes] = notification.time.split(':');
  const cronExpression = `${minutes} ${hours} * * *`; // Daily at specified time
  
  console.log(`⏰ Creating cron job for "${notification.name}" at ${notification.time} (${cronExpression})`);
  
  const job = cron.schedule(cronExpression, async () => {
    if (notification.enabled) {
      console.log(`🔔 Executing daily notification: ${notification.name} at ${new Date().toLocaleTimeString()}`);
      await sendDailyNotification(notification);
    } else {
      console.log(`⏸️ Skipping disabled notification: ${notification.name}`);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Adjust timezone as needed
  });
  
  dailyNotificationCronJobs[notification.id] = job;
  return job;
};

// Update daily notification schedule
const updateDailyNotificationSchedule = (settings) => {
  console.log('📅 Updating daily notification schedule...');
  
  // Clear existing jobs
  clearAllCronJobs();
  
  // Update cached settings
  notificationSettings = settings;
  
  // Create new jobs for enabled notifications
  settings.forEach(notification => {
    if (notification.enabled && notification.time) {
      createCronJob(notification);
      console.log(`✅ Scheduled: ${notification.name} at ${notification.time}`);
    } else {
      console.log(`⏸️ Skipped: ${notification.name} (disabled or no time set)`);
    }
  });
  
  console.log(`📊 Active daily notification jobs: ${Object.keys(dailyNotificationCronJobs).length}`);
  
  return {
    success: true,
    activeJobs: Object.keys(dailyNotificationCronJobs).length,
    message: 'Daily notification schedule updated successfully'
  };
};

// Initialize daily notification scheduler with default settings
const initializeDailyNotificationScheduler = () => {
  console.log('🚀 Initializing Daily Notification Scheduler...');
  
  // Default notification settings
  const defaultSettings = [
    { 
      id: 'morning', 
      name: 'Morning Tea Special', 
      time: '09:00', 
      enabled: true, 
      message: '☕ Good morning! Start your day with our special morning tea blend. 20% off till 11 AM!' 
    },
    { 
      id: 'lunch', 
      name: 'Lunch Deals', 
      time: '12:00', 
      enabled: true, 
      message: '🍽️ Lunch time! Check out our combo meals with free delivery. Order now!' 
    },
    { 
      id: 'evening', 
      name: 'Evening Snacks', 
      time: '16:00', 
      enabled: true, 
      message: '🍪 Tea time! Perfect snacks to accompany your evening tea. Fresh & hot!' 
    },
    { 
      id: 'dinner', 
      name: 'Dinner Specials', 
      time: '19:00', 
      enabled: true, 
      message: '🌙 Dinner ready! Explore our dinner specials with family portions available.' 
    }
  ];
  
  // Start with default settings
  updateDailyNotificationSchedule(defaultSettings);
  
  console.log('✅ Daily Notification Scheduler initialized successfully!');
  
  return {
    success: true,
    message: 'Daily notification scheduler initialized',
    activeJobs: Object.keys(dailyNotificationCronJobs).length
  };
};

// Get current notification schedule status
const getNotificationScheduleStatus = () => {
  const activeJobs = Object.keys(dailyNotificationCronJobs);
  
  return {
    isRunning: activeJobs.length > 0,
    activeJobs: activeJobs.length,
    scheduledNotifications: notificationSettings.filter(n => n.enabled),
    nextNotifications: getNextNotificationTimes(),
    status: 'Daily notification scheduler is running'
  };
};

// Get next notification times
const getNextNotificationTimes = () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  return notificationSettings
    .filter(n => n.enabled)
    .map(notification => {
      const [hours, minutes] = notification.time.split(':');
      const notificationTime = new Date(today);
      notificationTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      // If time has passed today, schedule for tomorrow
      if (notificationTime <= now) {
        notificationTime.setDate(tomorrow.getDate());
      }
      
      return {
        id: notification.id,
        name: notification.name,
        time: notification.time,
        nextExecution: notificationTime.toISOString(),
        message: notification.message
      };
    })
    .sort((a, b) => new Date(a.nextExecution) - new Date(b.nextExecution));
};

// Test daily notification (for debugging)
const testDailyNotification = async (notificationId) => {
  const notification = notificationSettings.find(n => n.id === notificationId);
  if (!notification) {
    return {
      success: false,
      message: 'Notification not found'
    };
  }
  
  console.log(`🧪 Testing daily notification: ${notification.name}`);
  return await sendDailyNotification(notification);
};

module.exports = {
  sendOrderStatusNotification,
  sendPromotionalNotification,
  initializeDailyNotificationScheduler,
  updateDailyNotificationSchedule,
  getNotificationScheduleStatus,
  testDailyNotification,
  clearAllCronJobs,
}; 