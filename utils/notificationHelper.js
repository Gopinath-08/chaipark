// Notification helper for sending order status updates
// This can be extended with Firebase Cloud Messaging (FCM) for push notifications

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

// Daily notification scheduler function
const scheduleDailyNotifications = () => {
  const notifications = [
    {
      time: '09:00',
      title: '☀️ Good Morning!',
      message: 'Start your day with fresh tea and snacks from ChaiPark!',
    },
    {
      time: '16:30',
      title: '☕ Evening Tea Time!',
      message: 'Perfect time for evening tea! Check out our special combos.',
    },
    {
      time: '19:00',
      title: '🌆 Dinner Time Deals!',
      message: 'Hungry? Explore our dinner specials and get 20% off on orders above ₹300!',
    },
  ];

  notifications.forEach(notification => {
    console.log(`⏰ Daily notification scheduled: ${notification.title} at ${notification.time}`);
  });
  
  // TODO: Implement actual cron job scheduling with node-cron
  // const cron = require('node-cron');
  // notifications.forEach(notification => {
  //   const [hour, minute] = notification.time.split(':');
  //   cron.schedule(`${minute} ${hour} * * *`, async () => {
  //     const activeUsers = await User.find({ fcmToken: { $exists: true } });
  //     await sendPromotionalNotification(activeUsers, notification.title, notification.message);
  //   });
  // });
};

module.exports = {
  sendOrderStatusNotification,
  sendPromotionalNotification,
  scheduleDailyNotifications,
}; 