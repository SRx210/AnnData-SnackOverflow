from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import traceback
from datetime import datetime
import numpy as np
import pandas as pd
from collections import defaultdict

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

@app.route('/api/ml/visualization-data', methods=['POST'])
def get_visualization_data():
    """
    Get real agricultural data from datasets for visualization
    Expected input: {
        "analysis_type": string ("soil" | "crop" | "market" | "distribution" | "environmental"),
        "region": string (optional),
        "crop": string (optional),
        "timePeriod": int (optional, default 12)
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if 'analysis_type' not in data:
            return jsonify({'error': 'Missing required field: analysis_type'}), 400
        
        analysis_type = str(data['analysis_type']).strip().lower()
        region = str(data.get('region', 'Maharashtra')).strip()
        crop = str(data.get('crop', 'Rice')).strip().lower()
        time_period = int(data.get('timePeriod', 12))
        
        # Validate analysis type
        valid_types = ['soil', 'crop', 'market', 'distribution', 'environmental']
        if analysis_type not in valid_types:
            return jsonify({'error': f'Invalid analysis_type. Must be one of: {", ".join(valid_types)}'}), 400
        
        # Validate time period
        if not (1 <= time_period <= 24):
            return jsonify({'error': 'Time period must be between 1 and 24 months'}), 400
        
        # Get base directory for datasets
        base_dir = os.path.dirname(os.path.abspath(__file__))
        datasets_dir = os.path.join(base_dir, 'datasets')
        
        results = {
            'analysis_type': analysis_type,
            'region': region,
            'crop': crop,
            'timePeriod': time_period,
            'generated_at': datetime.now().isoformat()
        }
        
        # Load and process data based on analysis type
        if analysis_type == 'soil':
            # Read crop_recommendation.csv for soil data
            soil_file = os.path.join(datasets_dir, 'crop_recommendation.csv')
            if not os.path.exists(soil_file):
                return jsonify({'error': 'Soil dataset not found'}), 500
            
            df = pd.read_csv(soil_file)
            
            # Filter by crop if specified
            crop_label = crop.lower()
            if 'label' in df.columns:
                crop_df = df[df['label'].str.lower() == crop_label]
                if len(crop_df) == 0:
                    # If crop not found, use all data
                    crop_df = df
            else:
                crop_df = df
            
            # Calculate statistics
            soil_stats = {
                'avg_nitrogen': float(crop_df['N'].mean()) if 'N' in crop_df.columns else 0,
                'avg_phosphorous': float(crop_df['P'].mean()) if 'P' in crop_df.columns else 0,
                'avg_potassium': float(crop_df['K'].mean()) if 'K' in crop_df.columns else 0,
                'avg_ph': float(crop_df['ph'].mean()) if 'ph' in crop_df.columns else 0,
                'avg_temperature': float(crop_df['temperature'].mean()) if 'temperature' in crop_df.columns else 0,
                'avg_humidity': float(crop_df['humidity'].mean()) if 'humidity' in crop_df.columns else 0,
                'avg_rainfall': float(crop_df['rainfall'].mean()) if 'rainfall' in crop_df.columns else 0,
                'sample_count': len(crop_df)
            }
            
            # Generate time series data by sampling
            months = []
            month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            current_month = datetime.now().month - 1
            
            for i in range(time_period - 1, -1, -1):
                month_idx = (current_month - i) % 12
                months.append(month_names[month_idx])
            
            # Sample data points for time series
            sample_size = min(time_period, len(crop_df))
            if sample_size > 0:
                sampled_data = crop_df.sample(n=sample_size, replace=True) if len(crop_df) >= sample_size else crop_df
                
                nutrient_levels = []
                for idx, (_, row) in enumerate(sampled_data.iterrows()):
                    if idx < len(months):
                        nutrient_levels.append({
                            'month': months[idx],
                            'nitrogen': round(float(row['N']), 2) if 'N' in row else 0,
                            'phosphorous': round(float(row['P']), 2) if 'P' in row else 0,
                            'potassium': round(float(row['K']), 2) if 'K' in row else 0,
                            'ph': round(float(row['ph']), 2) if 'ph' in row else 0
                        })
            else:
                nutrient_levels = []
            
            results['data'] = {
                'nutrient_levels': nutrient_levels,
                'statistics': soil_stats,
                'recommendations': generate_soil_recommendations(soil_stats, crop)
            }
        
        elif analysis_type == 'crop':
            # Read crop_yield.csv for crop performance data
            yield_file = os.path.join(datasets_dir, 'crop_yield.csv')
            if not os.path.exists(yield_file):
                return jsonify({'error': 'Crop yield dataset not found'}), 500
            
            df = pd.read_csv(yield_file)
            
            # Filter by crop
            crop_name = crop.title()
            if 'Crop' in df.columns:
                crop_df = df[df['Crop'].str.lower().str.contains(crop.lower(), na=False)]
                if len(crop_df) == 0:
                    crop_df = df.head(100)  # Use sample if crop not found
            else:
                crop_df = df.head(100)
            
            # Generate time series
            months = []
            month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            current_month = datetime.now().month - 1
            
            for i in range(time_period - 1, -1, -1):
                month_idx = (current_month - i) % 12
                months.append(month_names[month_idx])
            
            # Sample and create yield trends
            sample_size = min(time_period, len(crop_df))
            if sample_size > 0:
                sampled_data = crop_df.sample(n=sample_size, replace=True) if len(crop_df) >= sample_size else crop_df
                
                yield_trends = []
                for idx, (_, row) in enumerate(sampled_data.iterrows()):
                    if idx < len(months):
                        yield_val = float(row['Yield']) * 1000 if 'Yield' in row and pd.notna(row['Yield']) else 2500
                        yield_trends.append({
                            'month': months[idx],
                            'yield': round(yield_val, 2),
                            'quality': round(75 + (yield_val / 50), 2) if yield_val > 0 else 75,
                            'diseaseIncidents': int(np.random.poisson(2))
                        })
            else:
                yield_trends = []
            
            # Get crop distribution from dataset
            crop_counts = df['Crop'].value_counts().head(5) if 'Crop' in df.columns else pd.Series()
            total = crop_counts.sum()
            
            crop_distribution = []
            for crop_name, count in crop_counts.items():
                percentage = (count / total * 100) if total > 0 else 0
                crop_distribution.append({
                    'crop': crop_name,
                    'value': round(percentage, 1),
                    'area': round(count / 10, 0)  # Approximate area
                })
            
            # Yield comparison
            yield_comparison = []
            top_crops = df['Crop'].value_counts().head(4).index if 'Crop' in df.columns else []
            for crop_name in top_crops:
                crop_data = df[df['Crop'] == crop_name]
                if 'Yield' in crop_data.columns and len(crop_data) > 0:
                    avg_yield = crop_data['Yield'].mean() * 1000
                    yield_comparison.append({
                        'crop': crop_name,
                        'current': round(avg_yield, 0),
                        'previous': round(avg_yield * 0.9, 0),
                        'target': round(avg_yield * 1.1, 0)
                    })
            
            results['data'] = {
                'yield_trends': yield_trends,
                'crop_distribution': crop_distribution,
                'yield_comparison': yield_comparison,
                'statistics': {
                    'avg_yield': round(df['Yield'].mean() * 1000, 2) if 'Yield' in df.columns else 0,
                    'total_crops': len(df['Crop'].unique()) if 'Crop' in df.columns else 0
                }
            }
        
        elif analysis_type == 'market':
            # Read crop_demand_data.csv for market trends
            demand_file = os.path.join(datasets_dir, 'crop_demand_data.csv')
            if not os.path.exists(demand_file):
                return jsonify({'error': 'Market demand dataset not found'}), 500
            
            df = pd.read_csv(demand_file)
            
            # Filter by region and crop
            filtered_df = df.copy()
            if 'Region' in df.columns and region:
                region_df = df[df['Region'].str.contains(region, case=False, na=False)]
                if len(region_df) > 0:
                    filtered_df = region_df
            
            if 'Crop' in filtered_df.columns and crop:
                crop_df = filtered_df[filtered_df['Crop'].str.lower().str.contains(crop.lower(), na=False)]
                if len(crop_df) > 0:
                    filtered_df = crop_df
            
            # Generate time series
            months = []
            month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            current_month = datetime.now().month - 1
            
            for i in range(time_period - 1, -1, -1):
                month_idx = (current_month - i) % 12
                months.append(month_names[month_idx])
            
            # Sample market data
            sample_size = min(time_period, len(filtered_df))
            market_trends = []
            
            if sample_size > 0 and 'Market_Demand' in filtered_df.columns:
                sampled_data = filtered_df.sample(n=sample_size, replace=True) if len(filtered_df) >= sample_size else filtered_df
                
                for idx, (_, row) in enumerate(sampled_data.iterrows()):
                    if idx < len(months):
                        demand = float(row['Market_Demand']) if pd.notna(row['Market_Demand']) else 5000
                        # Estimate price based on demand (inverse relationship)
                        price = round(30 + (10000 / max(demand, 1)), 2)
                        market_trends.append({
                            'month': months[idx],
                            'demand': round(demand, 2),
                            'price': price
                        })
            
            avg_demand = filtered_df['Market_Demand'].mean() if 'Market_Demand' in filtered_df.columns else 0
            
            results['data'] = {
                'market_trends': market_trends,
                'statistics': {
                    'avg_demand': round(avg_demand, 2),
                    'sample_count': len(filtered_df)
                }
            }
        
        elif analysis_type == 'distribution':
            # Read crop_yield.csv for distribution
            yield_file = os.path.join(datasets_dir, 'crop_yield.csv')
            if not os.path.exists(yield_file):
                return jsonify({'error': 'Crop yield dataset not found'}), 500
            
            df = pd.read_csv(yield_file)
            
            # Get crop distribution
            if 'Crop' in df.columns:
                crop_counts = df['Crop'].value_counts().head(5)
                total = crop_counts.sum()
                
                crop_distribution = []
                for crop_name, count in crop_counts.items():
                    percentage = (count / total * 100) if total > 0 else 0
                    # Get area data if available
                    crop_data = df[df['Crop'] == crop_name]
                    avg_area = crop_data['Area'].mean() if 'Area' in crop_data.columns else count / 10
                    
                    crop_distribution.append({
                        'crop': crop_name,
                        'value': round(percentage, 1),
                        'area': round(avg_area / 1000, 0)  # Convert to thousands
                    })
                
                results['data'] = {
                    'crop_distribution': crop_distribution,
                    'total_crops': len(df['Crop'].unique())
                }
            else:
                results['data'] = {'crop_distribution': [], 'total_crops': 0}
        
        elif analysis_type == 'environmental':
            # Read crop_recommendation.csv for environmental data
            env_file = os.path.join(datasets_dir, 'crop_recommendation.csv')
            if not os.path.exists(env_file):
                return jsonify({'error': 'Environmental dataset not found'}), 500
            
            df = pd.read_csv(env_file)
            
            # Filter by crop
            crop_label = crop.lower()
            if 'label' in df.columns:
                crop_df = df[df['label'].str.lower() == crop_label]
                if len(crop_df) == 0:
                    crop_df = df
            else:
                crop_df = df
            
            # Generate time series
            months = []
            month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            current_month = datetime.now().month - 1
            
            for i in range(time_period - 1, -1, -1):
                month_idx = (current_month - i) % 12
                months.append(month_names[month_idx])
            
            # Sample environmental data
            sample_size = min(time_period, len(crop_df))
            environmental_data = []
            
            if sample_size > 0:
                sampled_data = crop_df.sample(n=sample_size, replace=True) if len(crop_df) >= sample_size else crop_df
                
                for idx, (_, row) in enumerate(sampled_data.iterrows()):
                    if idx < len(months):
                        environmental_data.append({
                            'month': months[idx],
                            'temperature': round(float(row['temperature']), 1) if 'temperature' in row else 25,
                            'humidity': round(float(row['humidity']), 0) if 'humidity' in row else 70,
                            'rainfall': round(float(row['rainfall']), 0) if 'rainfall' in row else 100
                        })
            
            results['data'] = {
                'environmental_data': environmental_data,
                'statistics': {
                    'avg_temperature': round(crop_df['temperature'].mean(), 1) if 'temperature' in crop_df.columns else 0,
                    'avg_humidity': round(crop_df['humidity'].mean(), 1) if 'humidity' in crop_df.columns else 0,
                    'avg_rainfall': round(crop_df['rainfall'].mean(), 1) if 'rainfall' in crop_df.columns else 0
                }
            }
        
        return jsonify({
            'success': True,
            'data': results,
            'timestamp': datetime.now().isoformat()
        })
        
    except FileNotFoundError as e:
        return jsonify({
            'success': False,
            'error': f'Dataset file not found: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }), 500
    except pd.errors.EmptyDataError:
        return jsonify({
            'success': False,
            'error': 'Dataset file is empty or corrupted',
            'timestamp': datetime.now().isoformat()
        }), 500
    except Exception as e:
        print(f"Error in visualization endpoint: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }), 500

def generate_soil_recommendations(stats, crop):
    """Generate recommendations based on soil statistics"""
    recommendations = []
    
    avg_n = stats.get('avg_nitrogen', 0)
    avg_p = stats.get('avg_phosphorous', 0)
    avg_k = stats.get('avg_potassium', 0)
    avg_ph = stats.get('avg_ph', 0)
    
    if avg_n < 70:
        recommendations.append(f'⚠️ Nitrogen levels are below optimal for {crop}. Consider applying nitrogen-rich fertilizers.')
    elif avg_n > 120:
        recommendations.append(f'⚠️ Nitrogen levels are high. Reduce nitrogen fertilizer application for {crop}.')
    else:
        recommendations.append(f'✅ Nitrogen levels are optimal for {crop} cultivation.')
    
    if avg_p < 50:
        recommendations.append('⚠️ Phosphorous levels need improvement. Apply phosphate fertilizers.')
    else:
        recommendations.append('✅ Phosphorous levels are adequate for root development.')
    
    if avg_k < 60:
        recommendations.append('⚠️ Potassium levels are low. Consider potash application.')
    else:
        recommendations.append('✅ Potassium levels support disease resistance.')
    
    if avg_ph < 6.0:
        recommendations.append('⚠️ Soil is acidic. Consider lime application to raise pH.')
    elif avg_ph > 7.5:
        recommendations.append('⚠️ Soil is alkaline. Consider sulfur application to lower pH.')
    else:
        recommendations.append('✅ Soil pH is in the optimal range.')
    
    recommendations.append('💡 Regular soil testing every 6 months is recommended.')
    recommendations.append('💡 Add organic matter to improve soil structure.')
    
    return recommendations

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