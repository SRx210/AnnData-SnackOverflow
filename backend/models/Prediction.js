const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous predictions
  },
  imagePath: {
    type: String,
    required: true
  },
  originalFileName: {
    type: String,
    required: true
  },
  prediction: {
    disease: {
      type: String,
      required: true
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    alternativePredictions: [{
      disease: String,
      confidence: Number
    }]
  },
  cropType: {
    type: String,
    enum: ['tomato', 'potato', 'corn', 'wheat', 'rice', 'cotton', 'soybean', 'other'],
    default: 'other'
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  weatherConditions: {
    temperature: Number,
    humidity: Number,
    rainfall: Number
  },
  treatment: {
    recommended: [{
      method: String,
      description: String,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
      }
    }]
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: String, // Expert name or system
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
predictionSchema.index({ userId: 1 });
predictionSchema.index({ 'prediction.disease': 1 });
predictionSchema.index({ cropType: 1 });
predictionSchema.index({ createdAt: -1 });
predictionSchema.index({ verified: 1 });

const Prediction = mongoose.model('Prediction', predictionSchema);

module.exports = Prediction;