#!/usr/bin/env python3
"""
Test script for AnnData ML integration
Tests all three models: Crop Recommendation, Demand Forecasting, and Crop Rotation
"""

import sys
import os
import json
import requests
import time
from datetime import datetime

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_models_locally():
    """Test models locally without API"""
    print("=== Testing Models Locally ===")
    
    try:
        from pipeline import initialize_models
        
        # Initialize models
        crop_rec, demand_forecast, crop_rotation = initialize_models()
        
        # Test Crop Recommendation
        print("\n1. Testing Crop Recommendation...")
        result = crop_rec.predict(N=90, P=42, K=43, temperature=20.8, humidity=82, ph=6.5, rainfall=202)
        print(f"✅ Crop Recommendation: {result['primary_recommendation']}")
        print(f"   Top 3: {[r['crop'] for r in result['all_recommendations']]}")
        
        # Test Demand Forecasting
        print("\n2. Testing Demand Forecasting...")
        result = demand_forecast.predict(year=2024, month=9, region='North', crop='Rice')
        print(f"✅ Demand Forecast: {result['predicted_demand']:.2f}")
        
        # Test multi-month forecast
        forecasts = demand_forecast.forecast_next_months('North', 'Rice', 3)
        print("   Next 3 months:", [f"{f['month_name']}: {f['predicted_demand']:.1f}" for f in forecasts])

        
        # Test Crop Rotation
        print("\n3. Testing Crop Rotation...")
        result = crop_rotation.recommend_next_crop(
            current_crop='Paddy', soil_type='Clayey', 
            temp=30, humidity=60, moisture=45, 
            n=12, p=10, k=20
        )
        print(f"✅ Rotation Recommendations: {[r['crop'] for r in result[:3]]}")
        
        return True
        
    except Exception as e:
        print(f"❌ Local testing failed: {str(e)}")
        return False

def test_api_endpoints():
    """Test API endpoints (requires API server to be running)"""
    print("\n=== Testing API Endpoints ===")
    
    base_url = "http://localhost:5000"
    
    # Test health check
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health check passed")
            health_data = response.json()
            print(f"   Models loaded: {health_data['models_loaded']}")
        else:
            print("❌ Health check failed")
            return False
    except requests.exceptions.RequestException:
        print("❌ API server not running. Start with: python api.py")
        return False
    
    # Test Crop Recommendation API
    try:
        payload = {
            "N": 90, "P": 42, "K": 43,
            "temperature": 20.8, "humidity": 82,
            "ph": 6.5, "rainfall": 202
        }
        response = requests.post(f"{base_url}/api/ml/crop-recommendation", json=payload, timeout=10)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Crop Recommendation API: {result['data']['primary_recommendation']}")
        else:
            print(f"❌ Crop Recommendation API failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Crop Recommendation API error: {str(e)}")
    
    # Test Demand Forecasting API
    try:
        payload = {
            "year": 2024, "month": 9,
            "region": "North", "crop": "Rice"
        }
        response = requests.post(f"{base_url}/api/ml/demand-forecast", json=payload, timeout=10)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Demand Forecast API: {result['data']['predicted_demand']:.2f}")
        else:
            print(f"❌ Demand Forecast API failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Demand Forecast API error: {str(e)}")
    
    # Test Crop Rotation API
    try:
        payload = {
            "current_crop": "Paddy", "soil_type": "Clayey",
            "temperature": 30, "humidity": 60, "moisture": 45,
            "nitrogen": 12, "phosphorous": 10, "potassium": 20
        }
        response = requests.post(f"{base_url}/api/ml/crop-rotation", json=payload, timeout=10)
        if response.status_code == 200:
            result = response.json()
            recommendations = [r['crop'] for r in result['data']['recommendations'][:3]]
            print(f"✅ Crop Rotation API: {recommendations}")
        else:
            print(f"❌ Crop Rotation API failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Crop Rotation API error: {str(e)}")
    
    # Test Comprehensive Analysis API
    try:
        payload = {
            "soil_data": {
                "N": 90, "P": 42, "K": 43,
                "temperature": 20.8, "humidity": 82,
                "ph": 6.5, "rainfall": 202, "moisture": 45,
                "soil_type": "Clayey"
            },
            "current_crop": "Paddy",
            "forecast_data": {
                "region": "North", "crop": "Rice"
            }
        }
        response = requests.post(f"{base_url}/api/ml/comprehensive-analysis", json=payload, timeout=15)
        if response.status_code == 200:
            result = response.json()
            print("✅ Comprehensive Analysis API:")
            if 'crop_recommendation' in result['data']:
                print(f"   - Crop Rec: {result['data']['crop_recommendation']['primary_recommendation']}")
            if 'crop_rotation' in result['data']:
                rotations = [r['crop'] for r in result['data']['crop_rotation'][:2]]
                print(f"   - Rotation: {rotations}")
            if 'demand_forecast' in result['data']:
                print(f"   - Forecast: {len(result['data']['demand_forecast'])} months")
        else:
            print(f"❌ Comprehensive Analysis API failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Comprehensive Analysis API error: {str(e)}")
    
    return True

def generate_sample_requests():
    """Generate sample API requests for frontend integration"""
    print("\n=== Sample API Requests for Frontend ===")
    
    samples = {
        "crop_recommendation": {
            "url": "POST /api/ml/crop-recommendation",
            "payload": {
                "N": 90, "P": 42, "K": 43,
                "temperature": 20.8, "humidity": 82,
                "ph": 6.5, "rainfall": 202
            }
        },
        "demand_forecast": {
            "url": "POST /api/ml/demand-forecast",
            "payload": {
                "year": 2024, "month": 9,
                "region": "North", "crop": "Rice"
            }
        },
        "crop_rotation": {
            "url": "POST /api/ml/crop-rotation",
            "payload": {
                "current_crop": "Paddy", "soil_type": "Clayey",
                "temperature": 30, "humidity": 60, "moisture": 45,
                "nitrogen": 12, "phosphorous": 10, "potassium": 20
            }
        },
        "comprehensive_analysis": {
            "url": "POST /api/ml/comprehensive-analysis",
            "payload": {
                "soil_data": {
                    "N": 90, "P": 42, "K": 43,
                    "temperature": 20.8, "humidity": 82,
                    "ph": 6.5, "rainfall": 202, "moisture": 45,
                    "soil_type": "Clayey"
                },
                "current_crop": "Paddy",
                "forecast_data": {
                    "region": "North", "crop": "Rice"
                }
            }
        }
    }
    
    for endpoint, details in samples.items():
        print(f"\n{endpoint.upper()}:")
        print(f"URL: {details['url']}")
        print(f"Payload: {json.dumps(details['payload'], indent=2)}")
    
    return samples

if __name__ == "__main__":
    print("AnnData ML Integration Test Suite")
    print("=" * 50)
    
    # Test models locally first
    local_success = test_models_locally()
    
    if local_success:
        print("\n✅ Local model testing completed successfully!")
        
        # Test API endpoints
        print("\nTesting API endpoints...")
        print("Note: Make sure to run 'python api.py' in another terminal first")
        
        api_success = test_api_endpoints()
        
        # Generate sample requests
        generate_sample_requests()
        
        print("\n" + "=" * 50)
        if local_success and api_success:
            print("🎉 All tests passed! ML integration is ready.")
        else:
            print("⚠️  Some tests failed. Check the output above.")
    else:
        print("\n❌ Local model testing failed. Fix issues before proceeding.")
    
    print("\nNext steps:")
    print("1. Start ML API: python ml/api.py")
    print("2. Update your Node.js backend to call ML endpoints")
    print("3. Update frontend to use new ML features")
