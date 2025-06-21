const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analytics');
const notificationRoutes = require('./routes/notifications');

// Import middleware
const { authenticateToken } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
  }
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://brocode:bro@cluster0.cf2luoa.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err.message);
  console.log('Starting server without MongoDB connection...');
  console.log('Some features may not work properly.');
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(limiter);
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://10.0.2.2:5001',
    'http://10.0.2.2:3000',
    'http://localhost:8081', // React Native Metro bundler
    'http://10.0.2.2:8081',  // React Native Metro bundler on emulator
    '*' // Allow all origins for development
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  
  // Join admin room for real-time updates
  socket.on('join-admin', () => {
    socket.join('admin');
    console.log('👨‍💼 Admin joined the room');
  });

  // Join user-specific room for targeted notifications
  socket.on('join_user_room', (data) => {
    const { userId } = data;
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`👤 User ${userId} joined their room`);
    }
  });
  
  // Handle order status updates
  socket.on('order-status-update', (data) => {
    socket.to('admin').emit('order-updated', data);
  });

  // Handle notification received acknowledgment
  socket.on('notification_received', (data) => {
    console.log('📧 Notification received acknowledgment:', data);
    // In production, update notification delivery status in database
  });

  // Handle notification read acknowledgment
  socket.on('notification_read', (data) => {
    console.log('📖 Notification read acknowledgment:', data);
    // In production, update notification read status in database
  });

  // Handle ping for connection testing
  socket.on('ping', (data) => {
    console.log('🏓 Ping received from:', socket.id);
    socket.emit('pong', { 
      timestamp: new Date().toISOString(),
      originalTimestamp: data.timestamp 
    });
  });
  
  socket.on('disconnect', (reason) => {
    console.log('❌ Client disconnected:', socket.id, 'Reason:', reason);
  });

  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });
});

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/admin/notifications', authenticateToken, notificationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Test endpoint for React Native
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'React Native connection successful!',
    timestamp: new Date().toISOString(),
    headers: req.headers
  });
});

// Test POST endpoint
app.post('/api/test', (req, res) => {
  res.json({ 
    message: 'POST request successful!',
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 4545;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Export io for access in routes
module.exports = { app, server, io };
module.exports.io = io; 