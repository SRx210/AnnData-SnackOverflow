# 🤖 AnnData ML Integration Guide

## Overview
This guide explains how to integrate the ML models (Crop Recommendation, Demand Forecasting, and Crop Rotation) into your AnnData application.

## 📁 File Structure
```
ml/
├── api.py                    # Flask API server for ML endpoints
├── pipeline.py               # ML model classes and training logic
├── test_integration.py       # Test suite for ML integration
├── requirements.txt          # Python dependencies
├── datasets/                 # Training data
│   ├── crop_recommendation.csv
│   ├── crop_demand_data.csv
│   └── crop_soil.csv
├── models/                   # Trained model files (auto-generated)
│   ├── crop_recommendation_model.pkl
│   └── demand_forecasting_model.pkl
└── notebooks/                # Jupyter notebooks (development)
    ├── crop_recommendation.ipynb
    ├── demand_forecasting.ipynb
    └── crop_rotation.ipynb
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd ml
pip install -r requirements.txt
```

### 2. Test Models Locally
```bash
python pipeline.py
```

### 3. Start ML API Server
```bash
python api.py
```
The API will be available at `http://localhost:5000`

### 4. Test Integration
```bash
python test_integration.py
```

## 🔌 API Endpoints

### Health Check
```http
GET /health
```
**Response:**
```json
{
  "status": "OK",
  "message": "AnnData ML API is running",
  "models_loaded": {
    "crop_recommendation": true,
    "demand_forecasting": true,
    "crop_rotation": true
  }
}
```

### 1. Crop Recommendation
```http
POST /api/ml/crop-recommendation
```
**Request Body:**
```json
{
  "N": 90,
  "P": 42,
  "K": 43,
  "temperature": 20.8,
  "humidity": 82,
  "ph": 6.5,
  "rainfall": 202
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "primary_recommendation": "rice",
    "all_recommendations": [
      {"crop": "rice", "confidence": 0.85},
      {"crop": "wheat", "confidence": 0.12},
      {"crop": "maize", "confidence": 0.03}
    ]
  }
}
```

### 2. Demand Forecasting
```http
POST /api/ml/demand-forecast
```
**Request Body:**
```json
{
  "year": 2024,
  "month": 9,
  "region": "North",
  "crop": "Rice"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "predicted_demand": 1250.5,
    "year": 2024,
    "month": 9,
    "region": "North",
    "crop": "Rice"
  }
}
```

### 3. Multi-Month Demand Forecast
```http
POST /api/ml/demand-forecast-multi
```
**Request Body:**
```json
{
  "region": "North",
  "crop": "Rice",
  "months": 6
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "forecasts": [
      {"year": 2024, "month": 10, "month_name": "October", "predicted_demand": 1300.2},
      {"year": 2024, "month": 11, "month_name": "November", "predicted_demand": 1150.8}
    ],
    "region": "North",
    "crop": "Rice",
    "months_forecasted": 6
  }
}
```

### 4. Crop Rotation Recommendation
```http
POST /api/ml/crop-rotation
```
**Request Body:**
```json
{
  "current_crop": "Paddy",
  "soil_type": "Clayey",
  "temperature": 30,
  "humidity": 60,
  "moisture": 45,
  "nitrogen": 12,
  "phosphorous": 10,
  "potassium": 20,
  "top_k": 5
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "crop": "Oil Seeds",
        "score": 1.1,
        "reason": "Crop rotation benefit; Different nutrient requirements; Nitrogen fixing properties"
      },
      {
        "crop": "Pulses",
        "score": 1.1,
        "reason": "Crop rotation benefit; Nitrogen fixing properties"
      }
    ],
    "current_crop": "Paddy",
    "soil_type": "Clayey"
  }
}
```

### 5. Comprehensive Analysis
```http
POST /api/ml/comprehensive-analysis
```
**Request Body:**
```json
{
  "soil_data": {
    "N": 90, "P": 42, "K": 43,
    "temperature": 20.8, "humidity": 82,
    "ph": 6.5, "rainfall": 202, "moisture": 45,
    "soil_type": "Clayey"
  },
  "current_crop": "Paddy",
  "forecast_data": {
    "region": "North",
    "crop": "Rice"
  }
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "crop_recommendation": { /* crop recommendation result */ },
    "crop_rotation": [ /* rotation recommendations */ ],
    "demand_forecast": [ /* 6-month forecast */ ]
  }
}
```

## 🔗 Backend Integration

### Node.js Integration Example
```javascript
// In your Node.js backend (e.g., routes/ml.js)
const axios = require('axios');

const ML_API_BASE = 'http://localhost:5000';

// Crop recommendation endpoint
app.post('/api/crops/recommend', async (req, res) => {
  try {
    const { N, P, K, temperature, humidity, ph, rainfall } = req.body;
    
    const response = await axios.post(`${ML_API_BASE}/api/ml/crop-recommendation`, {
      N, P, K, temperature, humidity, ph, rainfall
    });
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'ML service unavailable' });
  }
});

// Demand forecasting endpoint
app.post('/api/demand/forecast', async (req, res) => {
  try {
    const { year, month, region, crop } = req.body;
    
    const response = await axios.post(`${ML_API_BASE}/api/ml/demand-forecast`, {
      year, month, region, crop
    });
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'ML service unavailable' });
  }
});

// Crop rotation endpoint
app.post('/api/crops/rotation', async (req, res) => {
  try {
    const { current_crop, soil_type, temperature, humidity, moisture, nitrogen, phosphorous, potassium } = req.body;
    
    const response = await axios.post(`${ML_API_BASE}/api/ml/crop-rotation`, {
      current_crop, soil_type, temperature, humidity, moisture, nitrogen, phosphorous, potassium
    });
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'ML service unavailable' });
  }
});
```

## 🎨 Frontend Integration

### React Integration Example
```javascript
// In your React frontend
import axios from 'axios';

const API_BASE = 'http://localhost:3000'; // Your Node.js backend

// Crop recommendation
const getCropRecommendation = async (soilData) => {
  try {
    const response = await axios.post(`${API_BASE}/api/crops/recommend`, soilData);
    return response.data;
  } catch (error) {
    console.error('Error getting crop recommendation:', error);
    throw error;
  }
};

// Demand forecasting
const getDemandForecast = async (forecastData) => {
  try {
    const response = await axios.post(`${API_BASE}/api/demand/forecast`, forecastData);
    return response.data;
  } catch (error) {
    console.error('Error getting demand forecast:', error);
    throw error;
  }
};

// Crop rotation
const getCropRotation = async (rotationData) => {
  try {
    const response = await axios.post(`${API_BASE}/api/crops/rotation`, rotationData);
    return response.data;
  } catch (error) {
    console.error('Error getting crop rotation:', error);
    throw error;
  }
};

// Usage in component
const CropRecommendationForm = () => {
  const [recommendation, setRecommendation] = useState(null);
  
  const handleSubmit = async (formData) => {
    try {
      const result = await getCropRecommendation(formData);
      setRecommendation(result.data);
    } catch (error) {
      // Handle error
    }
  };
  
  return (
    <div>
      {/* Your form here */}
      {recommendation && (
        <div>
          <h3>Recommended Crop: {recommendation.primary_recommendation}</h3>
          <ul>
            {recommendation.all_recommendations.map((rec, idx) => (
              <li key={idx}>
                {rec.crop} - {(rec.confidence * 100).toFixed(1)}% confidence
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
```

## 🔧 Production Deployment

### 1. Environment Setup
```bash
# Create production environment file
echo "FLASK_ENV=production" > ml/.env
echo "ML_API_PORT=5000" >> ml/.env
```

### 2. Docker Deployment (Optional)
```dockerfile
# Dockerfile for ML service
FROM python:3.10-slim

WORKDIR /app
COPY ml/requirements.txt .
RUN pip install -r requirements.txt

COPY ml/ .
EXPOSE 5000

CMD ["python", "api.py"]
```

### 3. Process Management
```bash
# Using PM2 for process management
npm install -g pm2
pm2 start ml/api.py --name "anndata-ml" --interpreter python3
```

## 🧪 Testing

### Run All Tests
```bash
cd ml
python test_integration.py
```

### Manual API Testing
```bash
# Test health endpoint
curl http://localhost:5000/health

# Test crop recommendation
curl -X POST http://localhost:5000/api/ml/crop-recommendation \
  -H "Content-Type: application/json" \
  -d '{"N":90,"P":42,"K":43,"temperature":20.8,"humidity":82,"ph":6.5,"rainfall":202}'
```

## 🚨 Troubleshooting

### Common Issues

1. **Models not loading**
   - Ensure datasets are in `ml/datasets/` directory
   - Run `python pipeline.py` to train models

2. **API server not starting**
   - Check if port 5000 is available
   - Install missing dependencies: `pip install -r requirements.txt`

3. **CORS errors in frontend**
   - Flask-CORS is already configured
   - Ensure frontend is making requests to correct URL

4. **Memory issues**
   - Models are loaded once on startup
   - Consider using model caching for production

### Performance Optimization

1. **Model Loading**
   - Models are cached in memory after first load
   - Consider using Redis for distributed caching

2. **API Response Time**
   - Average response time: 50-200ms
   - Use async processing for batch predictions

3. **Scaling**
   - Run multiple API instances behind load balancer
   - Use containerization for easy scaling

## 📊 Model Performance

### Crop Recommendation Model
- **Algorithm**: Random Forest Classifier
- **Accuracy**: ~95%
- **Features**: N, P, K, temperature, humidity, pH, rainfall

### Demand Forecasting Model
- **Algorithm**: Random Forest Regressor
- **R² Score**: ~0.85
- **Features**: Year, Month, Region, Crop

### Crop Rotation Recommender
- **Algorithm**: Rule-based system
- **Factors**: Soil type, nutrient balance, environmental conditions
- **Recommendations**: Top 5 suitable crops for rotation

## 🔄 Model Updates

### Retraining Models
```bash
cd ml
python pipeline.py  # This will retrain all models
```

### Adding New Data
1. Update CSV files in `datasets/` directory
2. Run retraining script
3. Restart API server

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Run the test suite: `python test_integration.py`
3. Check API logs for detailed error messages

---

**Next Steps:**
1. ✅ ML models integrated and tested
2. 🔄 Update Node.js backend to call ML endpoints
3. 🎨 Update React frontend with ML features
4. 🚀 Deploy to production environment
