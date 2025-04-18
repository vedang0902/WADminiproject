/**
 * CampusMess - Server-side Application
 * Handles API requests, authentication, and database interactions
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'campusmess-secret-key-dev';


// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campusmess', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Define Schemas
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  college: { type: String, required: true },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Mess' }],
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  createdAt: { type: Date, default: Date.now }
});

const messSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  },
  campus: { type: String, required: true },
  distanceFromCampus: { type: Number }, // in meters
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  pricing: { type: String, enum: ['$', '$$', '$$$'] },
  specialties: [String],
  openingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  contactNumber: String,
  photos: [String],
  specialOffers: [{
    title: String,
    description: String,
    validUntil: Date
  }]
});

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mess: { type: mongoose.Schema.Types.ObjectId, ref: 'Mess' },
  rating: { type: Number, required: true },
  comment: { type: String },
  photos: [String],
  createdAt: { type: Date, default: Date.now }
});

// Create Models
const User = mongoose.model('User', userSchema);
const Mess = mongoose.model('Mess', messSchema);
const Review = mongoose.model('Review', reviewSchema);

// Index for geospatial queries
messSchema.index({ location: '2dsphere' });

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ success: false, message: 'Authentication token required' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid/expired token' });
    req.user = user;
    next();
  });
};

// Routes

// User Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, college } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'This email is already registered' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      college
    });
    
    // Save user to database
    await newUser.save();
    
    // Generate JWT token
    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '7d' });
    
    // Return success response
    return res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        college: newUser.college
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Server error, please try again later' });
  }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }
    
    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    
    // Return success response
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error, please try again later' });
  }
});

// Get User Profile
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error, please try again later' });
  }
});

// Get Nearby Mess Options
app.get('/api/mess/nearby', async (req, res) => {
  try {
    const { latitude, longitude, campus, maxDistance } = req.query;
    
    let query = {};
    
    // If campus is provided, filter by campus
    if (campus) {
      query.campus = campus;
    }
    
    // If coordinates are provided, find by location
    if (latitude && longitude) {
      const distanceInMeters = maxDistance ? parseInt(maxDistance) * 1000 : 2000; // Convert km to meters (default 2km)
      
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: distanceInMeters
        }
      };
    }
    
    // Find mess options based on query
    const messOptions = await Mess.find(query).limit(20);
    
    return res.status(200).json({ success: true, data: messOptions });
  } catch (error) {
    console.error('Get nearby mess error:', error);
    return res.status(500).json({ success: false, message: 'Server error, please try again later' });
  }
});

// Get Mess Details
app.get('/api/mess/:id', async (req, res) => {
  try {
    const messId = req.params.id;
    
    // Find mess by ID
    const mess = await Mess.findById(messId);
    if (!mess) {
      return res.status(404).json({ success: false, message: 'Mess not found' });
    }
    
    // Get reviews for this mess
    const reviews = await Review.find({ mess: messId })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(10);
    
    return res.status(200).json({ success: true, data: { mess, reviews } });
  } catch (error) {
    console.error('Get mess details error:', error);
    return res.status(500).json({ success: false, message: 'Server error, please try again later' });
  }
});

// Add Review
app.post('/api/reviews', authenticateToken, async (req, res) => {
  try {
    const { messId, rating, comment, photos } = req.body;
    
    // Create new review
    const newReview = new Review({
      user: req.user.id,
      mess: messId,
      rating,
      comment,
      photos: photos || []
    });
    
    // Save review
    await newReview.save();
    
    // Update mess rating and review count
    const mess = await Mess.findById(messId);
    const allReviews = await Review.find({ mess: messId });
    
    // Calculate new average rating
    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
    const newAverageRating = totalRating / allReviews.length;
    
    // Update mess
    mess.rating = newAverageRating;
    mess.reviewCount = allReviews.length;
    await mess.save();
    
    // Add review to user's reviews
    await User.findByIdAndUpdate(req.user.id, { $push: { reviews: newReview._id } });
    
    return res.status(201).json({ success: true, review: newReview });
  } catch (error) {
    console.error('Add review error:', error);
    return res.status(500).json({ success: false, message: 'Server error, please try again later' });
  }
});

// Toggle Favorite Mess
app.post('/api/users/favorites/toggle', authenticateToken, async (req, res) => {
  try {
    const { messId } = req.body;
    const userId = req.user.id;
    
    // Find user
    const user = await User.findById(userId);
    
    // Check if mess is already in favorites
    const index = user.favorites.indexOf(messId);
    
    if (index === -1) {
      // Add to favorites
      user.favorites.push(messId);
      await user.save();
      return res.status(200).json({ success: true, message: 'Added to favorites', isFavorite: true });
    } else {
      // Remove from favorites
      user.favorites.splice(index, 1);
      await user.save();
      return res.status(200).json({ success: true, message: 'Removed from favorites', isFavorite: false });
    }
  } catch (error) {
    console.error('Toggle favorite error:', error);
    return res.status(500).json({ success: false, message: 'Server error, please try again later' });
  }
});

// Get User's Favorite Mess Options
app.get('/api/users/favorites', authenticateToken, async (req, res) => {
  try {
    // Find user with populated favorites
    const user = await User.findById(req.user.id).populate('favorites');
    
    return res.status(200).json({ success: true, favorites: user.favorites });
  } catch (error) {
    console.error('Get favorites error:', error);
    return res.status(500).json({ success: false, message: 'Server error, please try again later' });
  }
});

// Get Special Offers
app.get('/api/offers', async (req, res) => {
  try {
    // Find mess options with active special offers
    const messWithOffers = await Mess.find({
      'specialOffers.validUntil': { $gte: new Date() }
    }).select('name specialOffers');
    
    // Format offers
    const offers = messWithOffers.flatMap(mess => {
      return mess.specialOffers.map(offer => ({
        messId: mess._id,
        messName: mess.name,
        ...offer.toObject()
      }));
    });
    
    return res.status(200).json({ success: true, offers });
  } catch (error) {
    console.error('Get offers error:', error);
    return res.status(500).json({ success: false, message: 'Server error, please try again later' });
  }
});

// Claim Special Offer
app.post('/api/offers/claim', authenticateToken, async (req, res) => {
  try {
    const { messId, offerId } = req.body;
    
    // In a real app, you'd record this claim in the database
    // For now, just return success
    
    return res.status(200).json({ success: true, message: 'Offer claimed successfully' });
  } catch (error) {
    console.error('Claim offer error:', error);
    return res.status(500).json({ success: false, message: 'Server error, please try again later' });
  }
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});