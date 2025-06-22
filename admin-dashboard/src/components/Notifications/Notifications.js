import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  Snackbar,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress
} from '@mui/material';
import {
  Send as SendIcon,
  Schedule as ScheduleIcon,
  LocalOffer as OfferIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Notifications as NotificationIcon,
  Campaign as CampaignIcon
} from '@mui/icons-material';
// Date picker imports removed to fix compatibility issues
import { notificationAPI } from '../../api/notifications';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Notifications() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Instant Notification State
  const [instantNotification, setInstantNotification] = useState({
    title: '',
    message: '',
    type: 'general',
    targetUsers: 'all'
  });

  // Daily Notification State
  const [dailyNotifications, setDailyNotifications] = useState([
    { id: 'morning', name: 'Morning Tea Special', time: '09:00', enabled: true, message: '☕ Good morning! Start your day with our special morning tea blend. 20% off till 11 AM!' },
    { id: 'lunch', name: 'Lunch Deals', time: '12:00', enabled: true, message: '🍽️ Lunch time! Check out our combo meals with free delivery. Order now!' },
    { id: 'evening', name: 'Evening Snacks', time: '16:00', enabled: true, message: '🍪 Tea time! Perfect snacks to accompany your evening tea. Fresh & hot!' },
    { id: 'dinner', name: 'Dinner Specials', time: '19:00', enabled: true, message: '🌙 Dinner ready! Explore our dinner specials with family portions available.' }
  ]);

  // Offer Notifications State
  const [offerNotification, setOfferNotification] = useState({
    title: '',
    description: '',
    discount: '',
    validTill: '',
    category: 'all',
    minOrder: ''
  });

  // Notification History State
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [editDialog, setEditDialog] = useState({ open: false, notification: null });
  
  // Scheduler Status State
  const [schedulerStatus, setSchedulerStatus] = useState({
    isRunning: false,
    activeJobs: 0,
    nextNotifications: []
  });

  useEffect(() => {
    loadNotificationHistory();
    loadDailyNotificationSettings();
    loadSchedulerStatus();
  }, []);

  const loadNotificationHistory = async () => {
    try {
      const response = await notificationAPI.getHistory();
      setNotificationHistory(response.data);
    } catch (error) {
      console.error('Failed to load notification history:', error);
    }
  };

  const loadDailyNotificationSettings = async () => {
    try {
      const response = await notificationAPI.getDailySettings();
      if (response.data) {
        setDailyNotifications(response.data);
      }
    } catch (error) {
      console.error('Failed to load daily notification settings:', error);
    }
  };

  const loadSchedulerStatus = async () => {
    try {
      const response = await notificationAPI.getSchedulerStatus();
      if (response.data) {
        setSchedulerStatus(response.data);
      }
    } catch (error) {
      console.error('Failed to load scheduler status:', error);
    }
  };

  const testDailyNotification = async (notificationId) => {
    try {
      setLoading(true);
      const response = await notificationAPI.testDailyNotification(notificationId);
      if (response.data.success) {
        setSnackbar({ 
          open: true, 
          message: `Test notification sent successfully! (${response.data.recipientCount} recipients)`, 
          severity: 'success' 
        });
      } else {
        setSnackbar({ 
          open: true, 
          message: response.data.message || 'Failed to send test notification', 
          severity: 'error' 
        });
      }
      loadNotificationHistory();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'Failed to send test notification', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendInstantNotification = async () => {
    if (!instantNotification.title || !instantNotification.message) {
      setSnackbar({ open: true, message: 'Please fill in title and message', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      await notificationAPI.sendInstant(instantNotification);
      setSnackbar({ open: true, message: 'Notification sent successfully!', severity: 'success' });
      setInstantNotification({ title: '', message: '', type: 'general', targetUsers: 'all' });
      loadNotificationHistory();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to send notification', severity: 'error' });
    }
    setLoading(false);
  };

  const handleSendOfferNotification = async () => {
    if (!offerNotification.title || !offerNotification.description || !offerNotification.discount) {
      setSnackbar({ open: true, message: 'Please fill in all offer details', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      await notificationAPI.sendOffer(offerNotification);
      setSnackbar({ open: true, message: 'Offer notification sent successfully!', severity: 'success' });
      setOfferNotification({ title: '', description: '', discount: '', validTill: '', category: 'all', minOrder: '' });
      loadNotificationHistory();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to send offer notification', severity: 'error' });
    }
    setLoading(false);
  };

  const handleUpdateDailyNotifications = async () => {
    setLoading(true);
    try {
      await notificationAPI.updateDailySettings(dailyNotifications);
      setSnackbar({ open: true, message: 'Daily notification settings and schedule updated!', severity: 'success' });
      // Refresh scheduler status after updating settings
      await loadSchedulerStatus();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to update settings', severity: 'error' });
    }
    setLoading(false);
  };

  const handleToggleDailyNotification = (id) => {
    setDailyNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, enabled: !notif.enabled } : notif
      )
    );
  };

  const handleUpdateDailyNotification = (id, field, value) => {
    setDailyNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, [field]: value } : notif
      )
    );
  };

  return (
      <Box>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationIcon color="primary" />
          Notification Management
        </Typography>
        
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab icon={<SendIcon />} label="Instant Notifications" />
              <Tab icon={<OfferIcon />} label="Offer Notifications" />
              <Tab icon={<ScheduleIcon />} label="Daily Notifications" />
              <Tab icon={<HistoryIcon />} label="History & Analytics" />
            </Tabs>
          </Box>

          {/* Instant Notifications Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CampaignIcon />
                    Send Instant Notification
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Notification Title"
                        value={instantNotification.title}
                        onChange={(e) => setInstantNotification(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., New Menu Item Available!"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Message"
                        value={instantNotification.message}
                        onChange={(e) => setInstantNotification(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Write your notification message..."
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Notification Type</InputLabel>
                        <Select
                          value={instantNotification.type}
                          onChange={(e) => setInstantNotification(prev => ({ ...prev, type: e.target.value }))}
                        >
                          <MenuItem value="general">📢 General</MenuItem>
                          <MenuItem value="order">📦 Order Update</MenuItem>
                          <MenuItem value="promotion">🎉 Promotion</MenuItem>
                          <MenuItem value="announcement">📣 Announcement</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Target Users</InputLabel>
                        <Select
                          value={instantNotification.targetUsers}
                          onChange={(e) => setInstantNotification(prev => ({ ...prev, targetUsers: e.target.value }))}
                        >
                          <MenuItem value="all">All Users</MenuItem>
                          <MenuItem value="active">Active Users (Last 7 days)</MenuItem>
                          <MenuItem value="frequent">Frequent Customers</MenuItem>
                          <MenuItem value="new">New Users</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        startIcon={<SendIcon />}
                        onClick={handleSendInstantNotification}
                        disabled={loading}
                        size="large"
                        sx={{ mt: 2 }}
                      >
                        Send Notification
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Preview</Typography>
                  <Box sx={{ border: 1, borderColor: 'grey.300', borderRadius: 1, p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {instantNotification.title || 'Notification Title'}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {instantNotification.message || 'Your notification message will appear here...'}
                    </Typography>
                    <Chip 
                      size="small" 
                      label={instantNotification.type} 
                      sx={{ mt: 1 }} 
                    />
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Offer Notifications Tab */}
          <TabPanel value={tabValue} index={1}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <OfferIcon />
                Create Offer Notification
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Offer Title"
                    value={offerNotification.title}
                    onChange={(e) => setOfferNotification(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Weekend Special!"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Discount (%)"
                    type="number"
                    value={offerNotification.discount}
                    onChange={(e) => setOfferNotification(prev => ({ ...prev, discount: e.target.value }))}
                    placeholder="20"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Offer Description"
                    value={offerNotification.description}
                    onChange={(e) => setOfferNotification(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your offer..."
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Valid Till"
                    type="date"
                    value={offerNotification.validTill}
                    onChange={(e) => setOfferNotification(prev => ({ ...prev, validTill: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={offerNotification.category}
                      onChange={(e) => setOfferNotification(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <MenuItem value="all">All Items</MenuItem>
                      <MenuItem value="tea">Tea</MenuItem>
                      <MenuItem value="snacks">Snacks</MenuItem>
                      <MenuItem value="meals">Meals</MenuItem>
                      <MenuItem value="beverages">Beverages</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Minimum Order (₹)"
                    type="number"
                    value={offerNotification.minOrder}
                    onChange={(e) => setOfferNotification(prev => ({ ...prev, minOrder: e.target.value }))}
                    placeholder="100"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    startIcon={<OfferIcon />}
                    onClick={handleSendOfferNotification}
                    disabled={loading}
                    size="large"
                    sx={{ mt: 2 }}
                  >
                    Send Offer Notification
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </TabPanel>

          {/* Daily Notifications Tab */}
          <TabPanel value={tabValue} index={2}>
            {/* Scheduler Status */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: schedulerStatus.isRunning ? 'success.light' : 'warning.light' }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ScheduleIcon />
                Scheduler Status
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <Typography variant="body2">
                    Status: <strong>{schedulerStatus.isRunning ? '🟢 Running' : '🔴 Stopped'}</strong>
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="body2">
                    Active Jobs: <strong>{schedulerStatus.activeJobs}</strong>
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    Next: <strong>
                      {schedulerStatus.nextNotifications?.[0] ? 
                        `${schedulerStatus.nextNotifications[0].name} at ${schedulerStatus.nextNotifications[0].time}` : 
                        'No notifications scheduled'
                      }
                    </strong>
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
            
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon />
                  Daily Notification Schedule
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleUpdateDailyNotifications}
                  disabled={loading}
                >
                  Save Settings
                </Button>
              </Box>
              
              <Grid container spacing={2}>
                {dailyNotifications.map((notification) => (
                  <Grid item xs={12} key={notification.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6">{notification.name}</Typography>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={notification.enabled}
                                onChange={() => handleToggleDailyNotification(notification.id)}
                              />
                            }
                            label="Enabled"
                          />
                        </Box>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={3}>
                            <TextField
                              fullWidth
                              label="Time"
                              type="time"
                              value={notification.time}
                              onChange={(e) => handleUpdateDailyNotification(notification.id, 'time', e.target.value)}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          
                          <Grid item xs={12} sm={7}>
                            <TextField
                              fullWidth
                              multiline
                              rows={2}
                              label="Message"
                              value={notification.message}
                              onChange={(e) => handleUpdateDailyNotification(notification.id, 'message', e.target.value)}
                            />
                          </Grid>
                          
                          <Grid item xs={12} sm={2}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => testDailyNotification(notification.id)}
                              disabled={loading || !notification.enabled}
                              sx={{ height: '56px' }}
                            >
                              🧪 Test
                            </Button>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </TabPanel>

          {/* History & Analytics Tab */}
          <TabPanel value={tabValue} index={3}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon />
                Notification History
              </Typography>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Recipients</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {notificationHistory.map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell>{new Date(notification.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{notification.title}</TableCell>
                        <TableCell>
                          <Chip size="small" label={notification.type} />
                        </TableCell>
                        <TableCell>{notification.recipientCount}</TableCell>
                        <TableCell>
                          <Chip 
                            size="small" 
                            label={notification.status} 
                            color={notification.status === 'sent' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => setEditDialog({ open: true, notification })}>
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </TabPanel>
        </Card>

        {loading && <LinearProgress sx={{ mt: 2 }} />}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
  );
} 