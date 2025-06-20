const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  customization: [{
    name: String,
    price: Number
  }],
  specialInstructions: String,
  totalPrice: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'upi', 'card', 'wallet'],
    required: true
  },
  paymentDetails: {
    transactionId: String,
    paymentGateway: String,
    paidAt: Date
  },
  deliveryInfo: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: String,
    state: String,
    zipCode: String,
    deliveryInstructions: String
  },
  pricing: {
    subtotal: {
      type: Number,
      required: true
    },
    tax: {
      type: Number,
      default: 0
    },
    deliveryFee: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    }
  },
  estimatedDeliveryTime: {
    type: Date
  },
  actualDeliveryTime: {
    type: Date
  },
  preparationTime: {
    type: Number, // in minutes
    default: 0
  },
  deliveryTime: {
    type: Number, // in minutes
    default: 0
  },
  rating: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    reviewDate: Date
  },
  cancellationReason: {
    type: String,
    enum: ['customer-request', 'out-of-stock', 'restaurant-closed', 'delivery-issue', 'payment-failed', 'other']
  },
  cancellationNote: String,
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    customer: String,
    kitchen: String,
    delivery: String
  },
  tags: [String],
  source: {
    type: String,
    enum: ['mobile-app', 'web', 'phone', 'walk-in'],
    default: 'mobile-app'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ 'deliveryInfo.phone': 1 });
orderSchema.index({ createdAt: -1 });

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Get count of orders for today
    const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    
    const orderCount = await this.constructor.countDocuments({
      createdAt: { $gte: todayStart, $lt: todayEnd }
    });
    
    const sequence = (orderCount + 1).toString().padStart(3, '0');
    this.orderNumber = `CP${year}${month}${day}${sequence}`;
  }
  next();
});

// Virtual for order duration
orderSchema.virtual('orderDuration').get(function() {
  if (this.actualDeliveryTime && this.createdAt) {
    return Math.round((this.actualDeliveryTime - this.createdAt) / (1000 * 60)); // in minutes
  }
  return null;
});

// Virtual for isDelayed
orderSchema.virtual('isDelayed').get(function() {
  if (this.estimatedDeliveryTime && new Date() > this.estimatedDeliveryTime && this.status !== 'delivered') {
    return true;
  }
  return false;
});

// Method to update order status
orderSchema.methods.updateStatus = function(newStatus, notes = '') {
  this.status = newStatus;
  
  if (notes) {
    if (newStatus === 'preparing') {
      this.notes.kitchen = notes;
    } else if (newStatus === 'out-for-delivery') {
      this.notes.delivery = notes;
    }
  }
  
  // Update timestamps based on status
  if (newStatus === 'preparing') {
    this.preparationTime = Date.now();
  } else if (newStatus === 'delivered') {
    this.actualDeliveryTime = new Date();
  }
  
  return this.save();
};

// Method to calculate total
orderSchema.methods.calculateTotal = function() {
  const subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const total = subtotal + this.pricing.tax + this.pricing.deliveryFee - this.pricing.discount;
  
  this.pricing.subtotal = subtotal;
  this.pricing.total = total;
  
  return this.save();
};

// Static method to get orders by status
orderSchema.statics.getByStatus = function(status) {
  return this.find({ status })
    .populate('customer', 'name phone email')
    .populate('items.menuItem', 'name image')
    .sort({ createdAt: -1 });
};

// Static method to get today's orders
orderSchema.statics.getTodayOrders = function() {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  return this.find({
    createdAt: { $gte: startOfDay, $lt: endOfDay }
  })
  .populate('customer', 'name phone')
  .sort({ createdAt: -1 });
};

// Static method to get revenue statistics
orderSchema.statics.getRevenueStats = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $ne: 'cancelled' },
        paymentStatus: 'paid'
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$pricing.total' },
        totalOrders: { $sum: 1 },
        averageOrderValue: { $avg: '$pricing.total' }
      }
    }
  ]);
};

module.exports = mongoose.model('Order', orderSchema); 