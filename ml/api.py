from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import traceback
from datetime import datetime

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from pipeline import CropRecommendationModel, DemandForecastingModel, CropRotationRecommender

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

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
        if not crop_rec_model.load_model():
            print("Training Crop Recommendation Model...")
            crop_rec_model.train_and_save()
        
        # Initialize Demand Forecasting Model
        demand_forecast_model = DemandForecastingModel()
        if not demand_forecast_model.load_model():
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
        
        # Make prediction
        result = crop_rec_model.predict(
            N=float(data['N']),
            P=float(data['P']),
            K=float(data['K']),
            temperature=float(data['temperature']),
            humidity=float(data['humidity']),
            ph=float(data['ph']),
            rainfall=float(data['rainfall'])
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
        
        # Make prediction
        result = demand_forecast_model.predict(
            year=int(data['year']),
            month=int(data['month']),
            region=str(data['region']),
            crop=str(data['crop'])
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
        
        top_k = data.get('top_k', 5)
        
        # Make recommendation
        result = crop_rotation_recommender.recommend_next_crop(
            current_crop=str(data['current_crop']),
            soil_type=str(data['soil_type']),
            temp=float(data['temperature']),
            humidity=float(data['humidity']),
            moisture=float(data['moisture']),
            n=float(data['nitrogen']),
            p=float(data['phosphorous']),
            k=float(data['potassium']),
            top_k=int(top_k)
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
        app.run(host='0.0.0.0', port=5000, debug=True)
    else:
        print("Failed to initialize models. Exiting...")
        sys.exit(1)