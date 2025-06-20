const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [100, 'Item name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Item description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['coffee', 'tea', 'snacks', 'desserts', 'beverages', 'main-course', 'appetizers'],
    default: 'beverages'
  },
  image: {
    type: String,
    default: null
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isVegetarian: {
    type: Boolean,
    default: true
  },
  isSpicy: {
    type: Boolean,
    default: false
  },
  preparationTime: {
    type: Number, // in minutes
    default: 10,
    min: [1, 'Preparation time must be at least 1 minute']
  },
  calories: {
    type: Number,
    min: [0, 'Calories cannot be negative']
  },
  allergens: [{
    type: String,
    enum: ['dairy', 'nuts', 'gluten', 'eggs', 'soy', 'fish', 'shellfish']
  }],
  ingredients: [{
    name: String,
    quantity: String,
    unit: String
  }],
  nutritionalInfo: {
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    sugar: Number
  },
  customization: {
    allowCustomization: {
      type: Boolean,
      default: false
    },
    options: [{
      name: String,
      price: Number,
      isAvailable: {
        type: Boolean,
        default: true
      }
    }]
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  popularity: {
    type: Number,
    default: 0
  },
  tags: [String],
  featured: {
    type: Boolean,
    default: false
  },
  discount: {
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    validUntil: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
menuItemSchema.index({ category: 1, isAvailable: 1 });
menuItemSchema.index({ name: 'text', description: 'text' });
menuItemSchema.index({ featured: 1 });
menuItemSchema.index({ popularity: -1 });

// Virtual for discounted price
menuItemSchema.virtual('discountedPrice').get(function() {
  if (this.discount && this.discount.percentage > 0 && 
      (!this.discount.validUntil || this.discount.validUntil > new Date())) {
    return this.price - (this.price * this.discount.percentage / 100);
  }
  return this.price;
});

// Virtual for final price (considering discount)
menuItemSchema.virtual('finalPrice').get(function() {
  return this.discountedPrice;
});

// Method to update rating
menuItemSchema.methods.updateRating = function(newRating) {
  const totalRating = this.ratings.average * this.ratings.count + newRating;
  this.ratings.count += 1;
  this.ratings.average = totalRating / this.ratings.count;
  return this.save();
};

// Method to increment popularity
menuItemSchema.methods.incrementPopularity = function() {
  this.popularity += 1;
  return this.save();
};

// Static method to get featured items
menuItemSchema.statics.getFeaturedItems = function() {
  return this.find({ featured: true, isAvailable: true })
    .sort({ popularity: -1 })
    .limit(10);
};

// Static method to get items by category
menuItemSchema.statics.getByCategory = function(category) {
  return this.find({ category, isAvailable: true })
    .sort({ popularity: -1 });
};

// Pre-save middleware to update popularity based on ratings
menuItemSchema.pre('save', function(next) {
  if (this.isModified('ratings.average')) {
    this.popularity = this.ratings.average * this.ratings.count;
  }
  next();
});

module.exports = mongoose.model('MenuItem', menuItemSchema); 