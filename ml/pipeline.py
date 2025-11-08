import os
import pickle
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.metrics import classification_report, accuracy_score, mean_absolute_error, r2_score
import joblib

class CropRecommendationModel:
    """Crop recommendation model based on soil and environmental features"""
    
    def __init__(self):
        self.model = None
        self.feature_columns = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
        
    def train_and_save(self, data_path='datasets/crop_recommendation.csv', model_path='models/crop_recommendation_model.pkl'):
        """Train the crop recommendation model and save it"""
        # Load data
        df = pd.read_csv(data_path)
        
        # Prepare features and target
        X = df[self.feature_columns]
        y = df['label']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        
        # Create pipeline
        preprocessor = ColumnTransformer([
            ('scaler', StandardScaler(), self.feature_columns)
        ])
        
        # Try different models and select best (with regularization to prevent overfitting)
        models = {
            'RandomForest': RandomForestClassifier(
                n_estimators=100, 
                random_state=42,
                max_depth=15,
                min_samples_split=10,
                min_samples_leaf=4,
                max_features='sqrt'
            ),
            'LogisticRegression': LogisticRegression(random_state=42, max_iter=1000, C=1.0)
        }
        
        best_score = 0
        best_model = None
        
        for name, model in models.items():
            pipe = Pipeline([
                ('preprocessor', preprocessor),
                ('model', model)
            ])
            
            pipe.fit(X_train, y_train)
            score = pipe.score(X_test, y_test)
            
            if score > best_score:
                best_score = score
                best_model = pipe
                
        self.model = best_model
        
        # Save model
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        joblib.dump(self.model, model_path)
        
        print(f"Crop Recommendation Model trained with accuracy: {best_score:.4f}")
        return best_score
    
    def load_model(self, model_path='models/crop_recommendation_model.pkl'):
        """Load trained model"""
        if os.path.exists(model_path):
            self.model = joblib.load(model_path)
            return True
        return False
    
    def predict(self, N, P, K, temperature, humidity, ph, rainfall):
        """Predict crop recommendation"""
        if self.model is None:
            raise ValueError("Model not loaded. Call load_model() first.")
        
        # Log user input for verification
        print(f"\n[CROP RECOMMENDATION] User Input:")
        print(f"   N={N}, P={P}, K={K}, Temp={temperature}C, Humidity={humidity}%, pH={ph}, Rainfall={rainfall}mm")
            
        features = pd.DataFrame({
            'N': [N], 'P': [P], 'K': [K], 
            'temperature': [temperature], 'humidity': [humidity], 
            'ph': [ph], 'rainfall': [rainfall]
        })
        
        prediction = self.model.predict(features)[0]
        probabilities = self.model.predict_proba(features)[0]
        # Model returns lowercase labels (e.g., 'cotton', 'rice')
        print(f"   [OK] Model prediction: {prediction} (lowercase format from dataset)")
        
        # Get top 3 recommendations
        classes = self.model.classes_
        top_indices = np.argsort(probabilities)[-3:][::-1]
        
        recommendations = []
        for idx in top_indices:
            recommendations.append({
                'crop': classes[idx],
                'confidence': float(probabilities[idx])
            })
            
        return {
            'primary_recommendation': prediction.title(),  # Convert to Title Case for display
            'primary_recommendation_raw': prediction,  # Keep original for reference
            'all_recommendations': [
                {
                    'crop': rec['crop'].title(),  # Convert to Title Case for display
                    'crop_raw': rec['crop'],  # Keep original
                    'confidence': rec['confidence']
                }
                for rec in recommendations
            ]
        }

class DemandForecastingModel:
    """Demand forecasting model for crop market demand"""
    
    def __init__(self):
        self.model = None
        self.feature_columns = ['Year', 'Month', 'Region', 'Crop']
        
    def train_and_save(self, data_path='datasets/crop_demand_data.csv', model_path='models/demand_forecasting_model.pkl'):
        """Train the demand forecasting model and save it"""
        # Load data
        df = pd.read_csv(data_path)
        
        # CRITICAL FIX: Use time-based split for temporal data to prevent data leakage
        # Create date column and sort by time
        df['Month'] = pd.to_numeric(df['Month'], errors='coerce').fillna(1).astype(int)
        df['Year'] = df['Year'].astype(int)
        df['date'] = pd.to_datetime(dict(year=df['Year'], month=df['Month'], day=1))
        df = df.sort_values('date').reset_index(drop=True)
        
        # Time-based split: 80% train, 20% test (chronological)
        split_idx = int(len(df) * 0.8)
        train_df = df.iloc[:split_idx]
        test_df = df.iloc[split_idx:]
        
        # Prepare features and target
        X_train = train_df[self.feature_columns]
        y_train = train_df['Market_Demand']
        X_test = test_df[self.feature_columns]
        y_test = test_df['Market_Demand']
        
        # Create pipeline
        categorical_features = ['Region', 'Crop']
        numerical_features = ['Year', 'Month']
        
        preprocessor = ColumnTransformer([
            ('num', StandardScaler(), numerical_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ])
        
        # Try different models (with regularization)
        models = {
            'RandomForest': RandomForestRegressor(
                n_estimators=100, 
                random_state=42,
                max_depth=20,
                min_samples_split=5,
                min_samples_leaf=2
            ),
            'LinearRegression': LinearRegression()
        }
        
        best_score = -float('inf')
        best_model = None
        
        for name, model in models.items():
            pipe = Pipeline([
                ('preprocessor', preprocessor),
                ('model', model)
            ])
            
            pipe.fit(X_train, y_train)
            score = pipe.score(X_test, y_test)
            
            if score > best_score:
                best_score = score
                best_model = pipe
                
        self.model = best_model
        
        # Save model
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        joblib.dump(self.model, model_path)
        
        print(f"Demand Forecasting Model trained with R² score: {best_score:.4f}")
        return best_score
    
    def load_model(self, model_path='models/demand_forecasting_model.pkl'):
        """Load trained model"""
        if os.path.exists(model_path):
            self.model = joblib.load(model_path)
            return True
        return False
    
    def predict(self, year, month, region, crop):
        """Predict market demand"""
        if self.model is None:
            raise ValueError("Model not loaded. Call load_model() first.")
        
        # Log user input for verification
        print(f"\n[DEMAND FORECAST] User Input:")
        print(f"   Year={year}, Month={month}, Region={region}, Crop={crop}")
            
        features = pd.DataFrame({
            'Year': [year], 'Month': [month], 
            'Region': [region], 'Crop': [crop]
        })
        
        prediction = self.model.predict(features)[0]
        print(f"   [OK] Model prediction: {prediction:.2f} tonnes (using actual user input)")
        
        return {
            'predicted_demand': float(prediction),
            'year': year,
            'month': month,
            'region': region,
            'crop': crop
        }
    
    def forecast_next_months(self, region, crop, months=6):
        """Forecast demand for next N months"""
        if self.model is None:
            raise ValueError("Model not loaded. Call load_model() first.")
            
        from datetime import datetime, timedelta
        import calendar
        
        current_date = datetime.now()
        forecasts = []
        
        for i in range(1, months + 1):
            future_date = current_date + timedelta(days=30 * i)
            year = future_date.year
            month = future_date.month
            
            features = pd.DataFrame({
                'Year': [year], 'Month': [month], 
                'Region': [region], 'Crop': [crop]
            })
            
            prediction = self.model.predict(features)[0]
            
            forecasts.append({
                'year': year,
                'month': month,
                'month_name': calendar.month_name[month],
                'predicted_demand': float(prediction)
            })
            
        return forecasts

class CropRotationRecommender:
    """Rule-based crop rotation recommender"""
    
    def __init__(self):
        self.soil_data = None
        self.suit_by_soil = {}
        self.bias_by_crop = {}
        self.bands = {}
        self.legumes = {'Pulses', 'Oil Seeds'}
        
    def load_data(self, data_path='datasets/crop_soil.csv'):
        """Load soil and crop data"""
        df = pd.read_csv(data_path)
        df.columns = [c.strip().replace(' ', '_') for c in df.columns]
        df['Soil_Type'] = df['Soil_Type'].str.strip().str.title()
        df['Crop_Type'] = df['Crop_Type'].str.strip().str.title()
        
        self.soil_data = df
        
        # Build lookup tables
        self.suit_by_soil = df.groupby('Soil_Type')['Crop_Type'].apply(
            lambda s: sorted(s.unique())
        ).to_dict()
        
        # Nutrient bias calculation
        df['nutrient_bias'] = df.apply(
            lambda r: 'N_high' if r['Nitrogen'] >= r['Phosphorous'] and r['Nitrogen'] >= r['Potassium'] 
            else ('P_high' if r['Phosphorous'] >= r['Nitrogen'] and r['Phosphorous'] >= r['Potassium'] 
                  else 'K_high'), axis=1
        )
        
        self.bias_by_crop = df.groupby('Crop_Type')['nutrient_bias'].agg(
            lambda s: s.value_counts().idxmax()
        ).to_dict()
        
        # Environmental bands
        self.bands = df.groupby('Crop_Type').agg(
            temp_min=('Temparature', 'min'), temp_max=('Temparature', 'max'),
            moist_min=('Moisture', 'min'), moist_max=('Moisture', 'max'),
            hum_min=('Humidity', 'min'), hum_max=('Humidity', 'max')
        ).to_dict('index')
        
        return True
    
    def recommend_next_crop(self, current_crop, soil_type, temp, humidity, moisture, n, p, k, top_k=5):
        """Recommend next crop for rotation"""
        if self.soil_data is None:
            raise ValueError("Data not loaded. Call load_data() first.")
        
        # Log user input for verification
        print(f"\n[CROP ROTATION] User Input:")
        print(f"   Current Crop={current_crop}, Soil={soil_type}, Temp={temp}C, Humidity={humidity}%, Moisture={moisture}%")
        print(f"   Nutrients: N={n}, P={p}, K={k}")
            
        current_crop = str(current_crop).strip().title()
        soil_type = str(soil_type).strip().title()
        print(f"   [OK] Processing with normalized values: Crop={current_crop}, Soil={soil_type}")
        
        candidates = self.suit_by_soil.get(soil_type, [])
        print(f"   [INFO] Found {len(candidates)} candidate crops for {soil_type} soil")
        scored = []
        cur_bias = self.bias_by_crop.get(current_crop)
        
        for cand in candidates:
            # Family penalty (avoid same crop)
            fam_penalty = 0.0 if cand != current_crop else -1.0
            
            # Rotation bonus (different nutrient bias)
            cand_bias = self.bias_by_crop.get(cand)
            rot_bonus = 0.5 if cur_bias and cand_bias and cand_bias != cur_bias else 0.0
            
            # Nitrogen fixing bonus for legumes
            if n < 15 and cand in self.legumes:
                rot_bonus += 0.3
                
            # Environmental suitability
            b = self.bands.get(cand)
            env_score = 0.0
            if b:
                if b['temp_min'] <= temp <= b['temp_max']:
                    env_score += 0.3
                if b['moist_min'] <= moisture <= b['moist_max']:
                    env_score += 0.3
                if b['hum_min'] <= humidity <= b['hum_max']:
                    env_score += 0.2
                    
            total_score = fam_penalty + rot_bonus + env_score
            scored.append((cand, total_score))
            
        # Sort by score and return top recommendations
        recommendations = sorted(scored, key=lambda x: x[1], reverse=True)[:top_k]
        print(f"   [INFO] Top {len(recommendations)} recommendations with scores: {[(c, round(s, 2)) for c, s in recommendations]}")
        
        # Normalize scores to percentage (0-100)
        if not recommendations or len(recommendations) == 0:
            return []
        
        max_score = max(score for _, score in recommendations)
        min_score = min(score for _, score in recommendations)
        score_range = max_score - min_score
        
        # If all scores are the same or very close, distribute evenly
        if score_range < 0.01:
            result = []
            for idx, (crop, score) in enumerate(recommendations):
                suitability = 100 - (idx * 10)  # 100%, 90%, 80%, 70%, 60%
                result.append({
                    'crop': crop,
                    'score': float(score),
                    'suitability_score': max(suitability, 50),  # Minimum 50%
                    'reason': self._get_recommendation_reason(crop, current_crop, cur_bias, self.bias_by_crop.get(crop)),
                    'benefits': self._get_recommendation_reason(crop, current_crop, cur_bias, self.bias_by_crop.get(crop))
                })
            print(f"   [INFO] All scores similar - distributed evenly: {[r['suitability_score'] for r in result]}")
            return result
        
        # Normal case: scores differ - normalize to 0-100
        # But ensure minimum 50% for any recommendation
        result = []
        for crop, score in recommendations:
            normalized = ((score - min_score) / score_range) * 100
            # Ensure at least 50% for any recommended crop
            suitability = max(round(normalized), 50)
            result.append({
                'crop': crop,
                'score': float(score),
                'suitability_score': suitability,
                'reason': self._get_recommendation_reason(crop, current_crop, cur_bias, self.bias_by_crop.get(crop)),
                'benefits': self._get_recommendation_reason(crop, current_crop, cur_bias, self.bias_by_crop.get(crop))
            })
        
        print(f"   [INFO] Normalized suitability scores: {[r['suitability_score'] for r in result]}")
        return result
    
    def _get_recommendation_reason(self, recommended_crop, current_crop, current_bias, recommended_bias):
        """Generate explanation for recommendation"""
        reasons = []
        
        if recommended_crop != current_crop:
            reasons.append("Crop rotation benefit")
            
        if current_bias and recommended_bias and current_bias != recommended_bias:
            reasons.append("Different nutrient requirements")
            
        if recommended_crop in self.legumes:
            reasons.append("Nitrogen fixing properties")
            
        return "; ".join(reasons) if reasons else "Suitable for soil type"

def initialize_models():
    """Initialize and train all models if they don't exist"""
    
    # Initialize models
    crop_rec = CropRecommendationModel()
    demand_forecast = DemandForecastingModel()
    crop_rotation = CropRotationRecommender()
    
    # Train crop recommendation model if not exists
    if not crop_rec.load_model():
        print("Training Crop Recommendation Model...")
        crop_rec.train_and_save()
    else:
        print("Crop Recommendation Model loaded successfully")
    
    # Train demand forecasting model if not exists
    if not demand_forecast.load_model():
        print("Training Demand Forecasting Model...")
        demand_forecast.train_and_save()
    else:
        print("Demand Forecasting Model loaded successfully")
    
    # Load crop rotation data
    crop_rotation.load_data()
    print("Crop Rotation Recommender initialized successfully")
    
    return crop_rec, demand_forecast, crop_rotation

if __name__ == "__main__":
    # Initialize all models
    crop_rec, demand_forecast, crop_rotation = initialize_models()
    
    # Test crop recommendation
    print("\n=== Testing Crop Recommendation ===")
    result = crop_rec.predict(N=90, P=42, K=43, temperature=20.8, humidity=82, ph=6.5, rainfall=202)
    print(f"Recommendation: {result}")
    
    # Test demand forecasting
    print("\n=== Testing Demand Forecasting ===")
    result = demand_forecast.predict(year=2024, month=9, region='North', crop='Rice')
    print(f"Demand Forecast: {result}")
    
    # Test crop rotation
    print("\n=== Testing Crop Rotation ===")
    result = crop_rotation.recommend_next_crop(
        current_crop='Paddy', soil_type='Clayey', 
        temp=30, humidity=60, moisture=45, 
        n=12, p=10, k=20
    )
    print(f"Rotation Recommendations: {result}")