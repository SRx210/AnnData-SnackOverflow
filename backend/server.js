require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Database connection
const connectDB = require('./config/database');

// Models
const User = require('./models/User');
const Feedback = require('./models/Feedback');
const Prediction = require('./models/Prediction');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// In-memory data storage (removed - using MongoDB now)
// let users = [];
// let feedback = [];
// let userCounter = 1;

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AnnData API - Kisan 2.0',
      version: '1.0.0',
      description: 'API for Agricultural Data Management Platform',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./server.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *         password:
 *           type: string
 *     CropRecommendationRequest:
 *       type: object
 *       required:
 *         - soil_type
 *         - season
 *       properties:
 *         soil_type:
 *           type: string
 *         season:
 *           type: string
 *     FeedbackRequest:
 *       type: object
 *       required:
 *         - user_id
 *         - message
 *       properties:
 *         user_id:
 *           type: string
 *         message:
 *           type: string
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Email already exists
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Create new user (password hashing handled in model pre-save hook)
    const newUser = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password
    });

    await newUser.save();

    res.status(201).json({ 
      message: 'User registered successfully',
      userId: newUser._id
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Check password using model method
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id.toString(), 
        username: user.username, 
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/crops/predict:
 *   post:
 *     summary: Upload image and predict crop disease
 *     tags: [Crop Prediction]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Disease prediction successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 prediction:
 *                   type: string
 *                 confidence:
 *                   type: number
 *       400:
 *         description: Invalid image file
 */
app.post('/api/crops/predict', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Invalid image file' });
    }

    // Mock disease prediction logic
    const diseases = ['Blight', 'Rust', 'Leaf Spot', 'Powdery Mildew', 'Healthy'];
    const randomDisease = diseases[Math.floor(Math.random() * diseases.length)];
    const confidence = Math.random() * 0.3 + 0.7; // Random confidence between 0.7-1.0

    // Save prediction to database
    const predictionData = {
      imagePath: `uploads/${Date.now()}-${req.file.originalname}`, // In real app, save file first
      originalFileName: req.file.originalname,
      prediction: {
        disease: randomDisease,
        confidence: Math.round(confidence * 100) / 100
      }
    };

    // Add user ID if authenticated
    if (req.user) {
      predictionData.userId = req.user.id;
    }

    const prediction = new Prediction(predictionData);
    await prediction.save();

    res.json({
      prediction: randomDisease,
      confidence: Math.round(confidence * 100) / 100,
      predictionId: prediction._id
    });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/weather:
 *   get:
 *     summary: Get weather forecast for location
 *     tags: [Weather]
 *     parameters:
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         required: true
 *         description: City name for weather forecast
 *     responses:
 *       200:
 *         description: Weather forecast retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 location:
 *                   type: string
 *                 forecast:
 *                   type: string
 */
app.get('/api/weather', (req, res) => {
  try {
    const { location } = req.query;
    
    if (!location) {
      return res.status(400).json({ error: 'Location parameter is required' });
    }

    // Mock weather data
    const forecasts = [
      'Cloudy with light rain',
      'Sunny and clear',
      'Partly cloudy',
      'Thunderstorms expected',
      'Overcast with moderate rain'
    ];

    const randomForecast = forecasts[Math.floor(Math.random() * forecasts.length)];

    res.json({
      location: location,
      forecast: randomForecast
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/suppliers:
 *   get:
 *     summary: Get nearby suppliers
 *     tags: [Suppliers]
 *     parameters:
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         required: true
 *         description: City name to find suppliers
 *     responses:
 *       200:
 *         description: Suppliers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   location:
 *                     type: string
 *                   type:
 *                     type: string
 */
app.get('/api/suppliers', (req, res) => {
  try {
    const { location } = req.query;
    
    if (!location) {
      return res.status(400).json({ error: 'Location parameter is required' });
    }

    // Mock suppliers data
    const suppliers = [
      { name: 'AgroMart', location: location, type: 'Fertilizers' },
      { name: 'SeedSupply Co.', location: location, type: 'Seeds' },
      { name: 'Farm Equipment Hub', location: location, type: 'Equipment' },
      { name: 'Organic Solutions', location: location, type: 'Organic Inputs' },
      { name: 'Crop Care Center', location: location, type: 'Pesticides' }
    ];

    // Return random 2-4 suppliers
    const numSuppliers = Math.floor(Math.random() * 3) + 2;
    const randomSuppliers = suppliers.sort(() => 0.5 - Math.random()).slice(0, numSuppliers);

    res.json(randomSuppliers);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/recommendation:
 *   post:
 *     summary: Get recommended crops based on soil and season
 *     tags: [Crop Recommendation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CropRecommendationRequest'
 *     responses:
 *       200:
 *         description: Crop recommendations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recommended:
 *                   type: array
 *                   items:
 *                     type: string
 */
app.post('/api/recommendation', (req, res) => {
  try {
    const { soil_type, season } = req.body;

    if (!soil_type || !season) {
      return res.status(400).json({ error: 'soil_type and season are required' });
    }

    // Mock recommendation logic based on soil and season
    const cropRecommendations = {
      'loamy': {
        'kharif': ['Rice', 'Cotton', 'Sugarcane'],
        'rabi': ['Wheat', 'Barley', 'Mustard'],
        'zaid': ['Watermelon', 'Cucumber', 'Fodder']
      },
      'clay': {
        'kharif': ['Rice', 'Jute', 'Sugarcane'],
        'rabi': ['Wheat', 'Gram', 'Pea'],
        'zaid': ['Rice', 'Sugarcane', 'Fodder']
      },
      'sandy': {
        'kharif': ['Millet', 'Groundnut', 'Cotton'],
        'rabi': ['Barley', 'Gram', 'Mustard'],
        'zaid': ['Watermelon', 'Muskmelon', 'Fodder']
      }
    };

    const recommended = cropRecommendations[soil_type.toLowerCase()]?.[season.toLowerCase()] || ['Consult local agricultural expert'];

    res.json({ recommended });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/feedback:
 *   post:
 *     summary: Submit user feedback
 *     tags: [Feedback]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FeedbackRequest'
 *     responses:
 *       200:
 *         description: Feedback received successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
app.post('/api/feedback', async (req, res) => {
  try {
    const { user_id, message, category, rating } = req.body;

    if (!user_id || !message) {
      return res.status(400).json({ error: 'user_id and message are required' });
    }

    // Verify user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newFeedback = new Feedback({
      userId: user_id,
      message: message.trim(),
      category: category || 'general',
      rating: rating || null
    });

    await newFeedback.save();

    res.json({ 
      message: 'Feedback received',
      feedbackId: newFeedback._id
    });
  } catch (error) {
    console.error('Feedback error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid token
 */
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.getPublicProfile());
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid token
 */
app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { username, email, location, farmSize, cropTypes } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if new email is already taken by another user
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ 
        email: email.toLowerCase().trim(), 
        _id: { $ne: user._id } 
      });
      if (emailExists) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    // Update user profile
    const updateData = {};
    if (username) updateData.username = username.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (location) updateData.location = location.trim();
    if (farmSize !== undefined) updateData.farmSize = farmSize;
    if (cropTypes) updateData.cropTypes = cropTypes;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id, 
      updateData, 
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ 
      message: 'Profile updated',
      user: updatedUser.getPublicProfile()
    });
  } catch (error) {
    console.error('Profile update error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add these endpoints to your server.js file (before the health check endpoint)

/**
 * @swagger
 * /api/user/predictions:
 *   get:
 *     summary: Get user's prediction history
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of predictions to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: User prediction history retrieved successfully
 */
app.get('/api/user/predictions', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const predictions = await Prediction.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('prediction cropType createdAt verified');

    const total = await Prediction.countDocuments({ userId: req.user.id });

    res.json({
      predictions,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Prediction history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/feedback:
 *   get:
 *     summary: Get all feedback (Admin only - for demo purposes)
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, reviewed, resolved, closed]
 *         description: Filter by feedback status
 *     responses:
 *       200:
 *         description: Feedback retrieved successfully
 */
app.get('/api/admin/feedback', async (req, res) => {
  try {
    const { status, category } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (category) filter.category = category;

    const feedbacks = await Feedback.find(filter)
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(feedbacks);
  } catch (error) {
    console.error('Admin feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/stats/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: Dashboard stats retrieved successfully
 */
app.get('/api/stats/dashboard', async (req, res) => {
  try {
    // Get various statistics
    const [
      totalUsers,
      totalPredictions,
      totalFeedback,
      recentPredictions,
      diseaseStats
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Prediction.countDocuments(),
      Feedback.countDocuments(),
      Prediction.find().sort({ createdAt: -1 }).limit(5).select('prediction.disease createdAt'),
      Prediction.aggregate([
        {
          $group: {
            _id: '$prediction.disease',
            count: { $sum: 1 },
            avgConfidence: { $avg: '$prediction.confidence' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    res.json({
      summary: {
        totalUsers,
        totalPredictions,
        totalFeedback,
        activeUsers: totalUsers // For demo - in real app, count active users differently
      },
      recentActivity: recentPredictions,
      diseaseDistribution: diseaseStats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/user/delete:
 *   delete:
 *     summary: Delete user account
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 description: User's password for confirmation
 *     responses:
 *       200:
 *         description: Account deleted successfully
 */
app.delete('/api/user/delete', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password confirmation required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Soft delete - deactivate account instead of hard delete
    await User.findByIdAndUpdate(req.user.id, { isActive: false });

    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/predictions/search:
 *   get:
 *     summary: Search predictions by disease or crop type
 *     tags: [Crop Prediction]
 *     parameters:
 *       - in: query
 *         name: disease
 *         schema:
 *           type: string
 *         description: Search by disease name
 *       - in: query
 *         name: cropType
 *         schema:
 *           type: string
 *         description: Search by crop type
 *       - in: query
 *         name: verified
 *         schema:
 *           type: boolean
 *         description: Filter by verification status
 *     responses:
 *       200:
 *         description: Predictions search results
 */
app.get('/api/predictions/search', async (req, res) => {
  try {
    const { disease, cropType, verified } = req.query;
    const filter = {};

    if (disease) {
      filter['prediction.disease'] = new RegExp(disease, 'i');
    }
    if (cropType) {
      filter.cropType = cropType;
    }
    if (verified !== undefined) {
      filter.verified = verified === 'true';
    }

    const predictions = await Prediction.find(filter)
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .limit(20)
      .select('prediction cropType createdAt verified userId');

    res.json(predictions);
  } catch (error) {
    console.error('Prediction search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'AnnData API is running' });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ error: 'File upload error' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, async () => {
  // Connect to MongoDB
  await connectDB();
  
  console.log(`🚀 AnnData API Server running on port ${PORT}`);
  console.log(`📖 API Documentation available at http://localhost:${PORT}/api-docs`);
  console.log(`🏥 Health check available at http://localhost:${PORT}/health`);
});