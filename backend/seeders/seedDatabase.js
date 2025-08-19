require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Feedback = require('../models/Feedback');
const Prediction = require('../models/Prediction');

const connectDB = require('../config/database');

// Sample data
const sampleUsers = [
  {
    username: 'farmer1',
    email: 'farmer1@example.com',
    password: 'password123',
    location: 'Maharashtra, India',
    farmSize: 5.5,
    cropTypes: ['Rice', 'Cotton', 'Wheat']
  },
  {
    username: 'agroexpert',
    email: 'expert@agriculture.com',
    password: 'expertpass123',
    location: 'Punjab, India',
    farmSize: 15.0,
    cropTypes: ['Wheat', 'Corn', 'Sugarcane']
  },
  {
    username: 'modernfarmer',
    email: 'modern@farming.in',
    password: 'modern2024',
    location: 'Gujarat, India',
    farmSize: 8.2,
    cropTypes: ['Cotton', 'Groundnut', 'Bajra']
  }
];

const samplePredictions = [
  {
    imagePath: 'uploads/sample-tomato-blight.jpg',
    originalFileName: 'tomato-leaf.jpg',
    prediction: {
      disease: 'Blight',
      confidence: 0.92
    },
    cropType: 'tomato',
    verified: true,
    verifiedBy: 'Agricultural Expert'
  },
  {
    imagePath: 'uploads/sample-wheat-rust.jpg',
    originalFileName: 'wheat-plant.jpg',
    prediction: {
      disease: 'Rust',
      confidence: 0.88
    },
    cropType: 'wheat',
    verified: true,
    verifiedBy: 'Plant Pathologist'
  },
  {
    imagePath: 'uploads/sample-rice-healthy.jpg',
    originalFileName: 'rice-field.jpg',
    prediction: {
      disease: 'Healthy',
      confidence: 0.95
    },
    cropType: 'rice',
    verified: true,
    verifiedBy: 'Agricultural Expert'
  }
];

const sampleFeedback = [
  {
    message: 'This platform has been incredibly helpful for identifying crop diseases early. The accuracy is impressive!',
    category: 'general',
    rating: 5,
    status: 'reviewed'
  },
  {
    message: 'The weather integration feature would be great to have more detailed forecasts.',
    category: 'feature',
    rating: 4,
    status: 'pending'
  },
  {
    message: 'Sometimes the app is slow to load images. Please improve performance.',
    category: 'bug',
    rating: 3,
    status: 'reviewed'
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Feedback.deleteMany({});
    await Prediction.deleteMany({});
    
    // Create users
    console.log('👥 Creating sample users...');
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.username}`);
    }
    
    // Create predictions with user references
    console.log('🔍 Creating sample predictions...');
    for (let i = 0; i < samplePredictions.length; i++) {
      const predictionData = {
        ...samplePredictions[i],
        userId: createdUsers[i % createdUsers.length]._id
      };
      const prediction = new Prediction(predictionData);
      await prediction.save();
      console.log(`✅ Created prediction: ${prediction.prediction.disease}`);
    }
    
    // Create feedback with user references
    console.log('💬 Creating sample feedback...');
    for (let i = 0; i < sampleFeedback.length; i++) {
      const feedbackData = {
        ...sampleFeedback[i],
        userId: createdUsers[i % createdUsers.length]._id
      };
      const feedback = new Feedback(feedbackData);
      await feedback.save();
      console.log(`✅ Created feedback from: ${createdUsers[i % createdUsers.length].username}`);
    }
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`Users created: ${createdUsers.length}`);
    console.log(`Predictions created: ${samplePredictions.length}`);
    console.log(`Feedback entries created: ${sampleFeedback.length}`);
    
    console.log('\n🔑 Test Login Credentials:');
    sampleUsers.forEach(user => {
      console.log(`Email: ${user.email} | Password: ${user.password}`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;