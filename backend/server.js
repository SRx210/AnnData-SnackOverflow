const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-please-change';


servers:
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

// In-memory data storage
let users = [];
let feedback = [];
let userCounter = 1;

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
        url: process.env.BASE_URL || `http://localhost:${PORT}`,
        description: 'API server',
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

    // Check if user already exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: userCounter++,
      username,
      email,
      password: hashedPassword
    };

    users.push(newUser);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
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

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id.toString(),
        username: user.username
      }
    });
  } catch (error) {
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
app.post('/api/crops/predict', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Invalid image file' });
    }

    // Mock disease prediction logic
    const diseases = ['Blight', 'Rust', 'Leaf Spot', 'Powdery Mildew', 'Healthy'];
    const randomDisease = diseases[Math.floor(Math.random() * diseases.length)];
    const confidence = Math.random() * 0.3 + 0.7; // Random confidence between 0.7-1.0

    res.json({
      prediction: randomDisease,
      confidence: Math.round(confidence * 100) / 100
    });
  } catch (error) {
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
app.post('/api/feedback', (req, res) => {
  try {
    const { user_id, message } = req.body;

    if (!user_id || !message) {
      return res.status(400).json({ error: 'user_id and message are required' });
    }

    const newFeedback = {
      id: feedback.length + 1,
      user_id,
      message,
      timestamp: new Date().toISOString()
    };

    feedback.push(newFeedback);

    res.json({ message: 'Feedback received' });
  } catch (error) {
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
app.get('/api/user/profile', authenticateToken, (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      username: user.username,
      email: user.email
    });
  } catch (error) {
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
app.put('/api/user/profile', authenticateToken, (req, res) => {
  try {
    const { username, email } = req.body;
    const userIndex = users.findIndex(u => u.id === req.user.id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if new email is already taken by another user
    if (email && email !== users[userIndex].email) {
      const emailExists = users.some(u => u.email === email && u.id !== req.user.id);
      if (emailExists) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    // Update user profile
    if (username) users[userIndex].username = username;
    if (email) users[userIndex].email = email;

    res.json({ message: 'Profile updated' });
  } catch (error) {
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

app.listen(PORT, () => {
  console.log(`🚀 AnnData API Server running on port ${PORT}`);
  console.log(`📖 API Documentation available at http://localhost:${PORT}/api-docs`);
  console.log(`🏥 Health check available at http://localhost:${PORT}/health`);
});
