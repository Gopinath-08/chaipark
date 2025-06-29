const multer = require('multer');
const path = require('path');
const { uploadToCloudinary } = require('../config/cloudinary');

// Configure multer for memory storage (we'll upload to Cloudinary)
const storage = multer.memoryStorage();

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

// Middleware to upload single image to Cloudinary
const uploadSingleToCloudinary = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    // Convert buffer to base64 for Cloudinary
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    // Upload to Cloudinary
    const result = await uploadToCloudinary(base64);
    
    // Add Cloudinary result to request
    req.cloudinaryResult = result;
    
    next();
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload image to cloud storage',
      error: error.message
    });
  }
};

module.exports = {
  uploadSingle: upload.single('image'),
  uploadSingleToCloudinary,
  uploadMultiple: upload.array('images', 5)
}; 