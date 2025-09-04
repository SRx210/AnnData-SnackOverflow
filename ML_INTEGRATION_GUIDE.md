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
python pipeline.py
```