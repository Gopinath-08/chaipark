import api from './axios';

export const notificationAPI = {
  // Send instant notification
  sendInstant: (notificationData) => {
    return api.post('/admin/notifications/instant', notificationData);
  },

  // Send offer notification
  sendOffer: (offerData) => {
    return api.post('/admin/notifications/offer', offerData);
  },

  // Get notification history
  getHistory: () => {
    return api.get('/admin/notifications/history');
  },

  // Get daily notification settings
  getDailySettings: () => {
    return api.get('/admin/notifications/daily-settings');
  },

  // Update daily notification settings
  updateDailySettings: (settings) => {
    return api.put('/admin/notifications/daily-settings', { settings });
  },

  // Delete notification
  deleteNotification: (notificationId) => {
    return api.delete(`/admin/notifications/${notificationId}`);
  },

  // Get notification analytics
  getAnalytics: () => {
    return api.get('/admin/notifications/analytics');
  },

  // Test notification (for development)
  sendTest: (testData) => {
    return api.post('/admin/notifications/test', testData);
  },

  // Get user groups for targeting
  getUserGroups: () => {
    return api.get('/admin/notifications/user-groups');
  },

  // Schedule notification for later
  scheduleNotification: (scheduleData) => {
    return api.post('/admin/notifications/schedule', scheduleData);
  },

  // Cancel scheduled notification
  cancelScheduled: (notificationId) => {
    return api.delete(`/admin/notifications/scheduled/${notificationId}`);
  },

  // Get notification templates
  getTemplates: () => {
    return api.get('/admin/notifications/templates');
  },

  // Save notification template
  saveTemplate: (templateData) => {
    return api.post('/admin/notifications/templates', templateData);
  },

  // Get scheduler status
  getSchedulerStatus: () => {
    return api.get('/admin/notifications/scheduler-status');
  },

  // Test daily notification
  testDailyNotification: (notificationId) => {
    return api.post('/admin/notifications/test-daily', { notificationId });
  }
};

export default notificationAPI; 