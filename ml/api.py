from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import traceback
from datetime import datetime
import numpy as np

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from pipeline import CropRecommendationModel, DemandForecastingModel, CropRotationRecommender

app = Flask(__name__)

# CORS Configuration for Production
CORS(app, resources={
    r"/*": {
        "origins": ["*"],  # Allow all origins for ML API
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept", "User-Agent"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": False,
        "max_age": 600
    }
})

# Add logging for incoming requests
@app.before_request
def log_request():
    """Log incoming requests for debugging"""
    print(f"📥 {request.method} {request.path} from {request.remote_addr}")
    if request.method == 'POST':
        print(f"   Content-Type: {request.content_type}")
        print(f"   Headers: {dict(request.headers)}")

# Global model instances
crop_rec_model = None
demand_forecast_model = None
crop_rotation_recommender = None

def initialize_models():
    """Initialize all ML models on startup"""
    global crop_rec_model, demand_forecast_model, crop_rotation_recommender
    
    try:
        print("Initializing ML models...")
        
        # Initialize Crop Recommendation Model
        crop_rec_model = CropRecommendationModel()
        # Force retraining to avoid version compatibility issues
        print("Training Crop Recommendation Model...")
        crop_rec_model.train_and_save()
        
        # Initialize Demand Forecasting Model
        demand_forecast_model = DemandForecastingModel()
        # Force retraining to avoid version compatibility issues
        print("Training Demand Forecasting Model...")
        demand_forecast_model.train_and_save()
        
        # Initialize Crop Rotation Recommender
        crop_rotation_recommender = CropRotationRecommender()
        crop_rotation_recommender.load_data()
        
        print("All ML models initialized successfully!")
        return True
        
    except Exception as e:
        print(f"Error initializing models: {str(e)}")
        traceback.print_exc()
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'OK',
        'message': 'AnnData ML API is running',
        'timestamp': datetime.now().isoformat(),
        'models_loaded': {
            'crop_recommendation': crop_rec_model is not None,
            'demand_forecasting': demand_forecast_model is not None,
            'crop_rotation': crop_rotation_recommender is not None
        }
    })

@app.route('/api/ml/crop-recommendation', methods=['POST'])
def crop_recommendation():
    """
    Crop recommendation endpoint
    Expected input: {
        "N": float, "P": float, "K": float,
        "temperature": float, "humidity": float, 
        "ph": float, "rainfall": float
    }
    """
    try:
        if crop_rec_model is None:
            return jsonify({'error': 'Crop recommendation model not loaded'}), 500
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate and convert numeric fields with proper error handling
        try:
            N = float(data['N'])
            P = float(data['P'])
            K = float(data['K'])
            temperature = float(data['temperature'])
            humidity = float(data['humidity'])
            ph = float(data['ph'])
            rainfall = float(data['rainfall'])
        except (ValueError, TypeError) as e:
            return jsonify({'error': f'Invalid numeric value provided. All fields must be numbers.'}), 400
        
        # Validate ranges for realistic agricultural values
        if not (0 <= N <= 200):
            return jsonify({'error': 'Nitrogen (N) must be between 0 and 200'}), 400
        if not (0 <= P <= 200):
            return jsonify({'error': 'Phosphorous (P) must be between 0 and 200'}), 400
        if not (0 <= K <= 200):
            return jsonify({'error': 'Potassium (K) must be between 0 and 200'}), 400
        if not (-10 <= temperature <= 60):
            return jsonify({'error': 'Temperature must be between -10°C and 60°C'}), 400
        if not (0 <= humidity <= 100):
            return jsonify({'error': 'Humidity must be between 0% and 100%'}), 400
        if not (0 <= ph <= 14):
            return jsonify({'error': 'pH must be between 0 and 14'}), 400
        if not (0 <= rainfall <= 500):
            return jsonify({'error': 'Rainfall must be between 0 and 500 mm'}), 400
        
        # Make prediction
        result = crop_rec_model.predict(
            N=N, P=P, K=K,
            temperature=temperature,
            humidity=humidity,
            ph=ph,
            rainfall=rainfall
        )
        
        return jsonify({
            'success': True,
            'data': result,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/ml/demand-forecast', methods=['POST'])
def demand_forecast():
    """
    Demand forecasting endpoint
    Expected input: {
        "year": int, "month": int,
        "region": string, "crop": string
    }
    """
    try:
        if demand_forecast_model is None:
            return jsonify({'error': 'Demand forecasting model not loaded'}), 500
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['year', 'month', 'region', 'crop']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate and convert fields
        try:
            year = int(data['year'])
            month = int(data['month'])
        except (ValueError, TypeError):
            return jsonify({'error': 'Year and month must be valid numbers'}), 400
        
        region = str(data['region']).strip()
        crop = str(data['crop']).strip()
        
        # Validate empty strings
        if not region or not crop:
            return jsonify({'error': 'Region and crop cannot be empty'}), 400
        
        # Validate ranges
        if not (2000 <= year <= 2100):
            return jsonify({'error': 'Year must be between 2000 and 2100'}), 400
        if not (1 <= month <= 12):
            return jsonify({'error': 'Month must be between 1 and 12'}), 400
        
        # Validate that region and crop contain only letters, spaces, and hyphens (no random characters)
        import re
        if not re.match(r'^[A-Za-z\s\-]+$', region):
            return jsonify({'error': 'Region must contain only letters, spaces, and hyphens'}), 400
        if not re.match(r'^[A-Za-z\s\-]+$', crop):
            return jsonify({'error': 'Crop must contain only letters, spaces, and hyphens'}), 400
        
        # Make prediction
        result = demand_forecast_model.predict(
            year=year,
            month=month,
            region=region,
            crop=crop
        )
        
        return jsonify({
            'success': True,
            'data': result,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/ml/demand-forecast-multi', methods=['POST'])
def demand_forecast_multi():
    """
    Multi-month demand forecasting endpoint
    Expected input: {
        "region": string, "crop": string,
        "months": int (optional, default 6)
    }
    """
    try:
        if demand_forecast_model is None:
            return jsonify({'error': 'Demand forecasting model not loaded'}), 500
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['region', 'crop']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        months = data.get('months', 6)
        
        # Make forecast
        result = demand_forecast_model.forecast_next_months(
            region=str(data['region']),
            crop=str(data['crop']),
            months=int(months)
        )
        
        return jsonify({
            'success': True,
            'data': {
                'forecasts': result,
                'region': data['region'],
                'crop': data['crop'],
                'months_forecasted': months
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/ml/crop-rotation', methods=['POST'])
def crop_rotation():
    """
    Crop rotation recommendation endpoint
    Expected input: {
        "current_crop": string, "soil_type": string,
        "temperature": float, "humidity": float, "moisture": float,
        "nitrogen": float, "phosphorous": float, "potassium": float,
        "top_k": int (optional, default 5)
    }
    """
    try:
        if crop_rotation_recommender is None:
            return jsonify({'error': 'Crop rotation recommender not loaded'}), 500
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['current_crop', 'soil_type', 'temperature', 'humidity', 'moisture', 
                          'nitrogen', 'phosphorous', 'potassium']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate and convert numeric fields
        try:
            temperature = float(data['temperature'])
            humidity = float(data['humidity'])
            moisture = float(data['moisture'])
            nitrogen = float(data['nitrogen'])
            phosphorous = float(data['phosphorous'])
            potassium = float(data['potassium'])
            top_k = int(data.get('top_k', 5))
        except (ValueError, TypeError):
            return jsonify({'error': 'All numeric fields must be valid numbers'}), 400
        
        current_crop = str(data['current_crop']).strip()
        soil_type = str(data['soil_type']).strip()
        
        # Validate empty strings
        if not current_crop or not soil_type:
            return jsonify({'error': 'Current crop and soil type cannot be empty'}), 400
        
        # Validate ranges
        if not (-10 <= temperature <= 60):
            return jsonify({'error': 'Temperature must be between -10°C and 60°C'}), 400
        if not (0 <= humidity <= 100):
            return jsonify({'error': 'Humidity must be between 0% and 100%'}), 400
        if not (0 <= moisture <= 100):
            return jsonify({'error': 'Moisture must be between 0% and 100%'}), 400
        if not (0 <= nitrogen <= 200):
            return jsonify({'error': 'Nitrogen must be between 0 and 200'}), 400
        if not (0 <= phosphorous <= 200):
            return jsonify({'error': 'Phosphorous must be between 0 and 200'}), 400
        if not (0 <= potassium <= 200):
            return jsonify({'error': 'Potassium must be between 0 and 200'}), 400
        
        # Make recommendation
        result = crop_rotation_recommender.recommend_next_crop(
            current_crop=current_crop,
            soil_type=soil_type,
            temp=temperature,
            humidity=humidity,
            moisture=moisture,
            n=nitrogen,
            p=phosphorous,
            k=potassium,
            top_k=top_k
        )
        
        return jsonify({
            'success': True,
            'data': {
                'recommendations': result,
                'current_crop': data['current_crop'],
                'soil_type': data['soil_type']
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/ml/comprehensive-analysis', methods=['POST'])
def comprehensive_analysis():
    """
    Comprehensive analysis combining all three models
    Expected input: {
        "soil_data": {
            "N": float, "P": float, "K": float,
            "temperature": float, "humidity": float, 
            "ph": float, "rainfall": float, "moisture": float,
            "soil_type": string
        },
        "current_crop": string (optional),
        "forecast_data": {
            "region": string, "crop": string
        } (optional)
    }
    """
    try:
        data = request.get_json()
        results = {}
        
        # Crop Recommendation
        if 'soil_data' in data and crop_rec_model is not None:
            soil_data = data['soil_data']
            required_soil_fields = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
            
            if all(field in soil_data for field in required_soil_fields):
                crop_rec_result = crop_rec_model.predict(
                    N=float(soil_data['N']),
                    P=float(soil_data['P']),
                    K=float(soil_data['K']),
                    temperature=float(soil_data['temperature']),
                    humidity=float(soil_data['humidity']),
                    ph=float(soil_data['ph']),
                    rainfall=float(soil_data['rainfall'])
                )
                results['crop_recommendation'] = crop_rec_result
        
        # Crop Rotation
        if ('soil_data' in data and 'current_crop' in data and 
            crop_rotation_recommender is not None):
            soil_data = data['soil_data']
            required_rotation_fields = ['temperature', 'humidity', 'moisture', 'soil_type', 'N', 'P', 'K']
            
            if all(field in soil_data for field in required_rotation_fields):
                rotation_result = crop_rotation_recommender.recommend_next_crop(
                    current_crop=str(data['current_crop']),
                    soil_type=str(soil_data['soil_type']),
                    temp=float(soil_data['temperature']),
                    humidity=float(soil_data['humidity']),
                    moisture=float(soil_data['moisture']),
                    n=float(soil_data['N']),
                    p=float(soil_data['P']),
                    k=float(soil_data['K'])
                )
                results['crop_rotation'] = rotation_result
        
        # Demand Forecasting
        if 'forecast_data' in data and demand_forecast_model is not None:
            forecast_data = data['forecast_data']
            if 'region' in forecast_data and 'crop' in forecast_data:
                demand_result = demand_forecast_model.forecast_next_months(
                    region=str(forecast_data['region']),
                    crop=str(forecast_data['crop']),
                    months=6
                )
                results['demand_forecast'] = demand_result
        
        return jsonify({
            'success': True,
            'data': results,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found',
        'timestamp': datetime.now().isoformat()
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error',
        'timestamp': datetime.now().isoformat()
    }), 500

if __name__ == '__main__':
    # Initialize models on startup
    if initialize_models():
        print("Starting AnnData ML API server...")
        port = int(os.environ.get('PORT', 5000))
        app.run(host='0.0.0.0', port=port, debug=False)
    else:
        print("Failed to initialize models. Exiting...")
        sys.exit(1)