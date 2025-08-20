import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Cloud, Users, Leaf, User, MessageCircle, LogIn, LogOut, Search, MapPin, Phone, Mail, Star, Camera, TrendingUp, Droplets, Sun, AlertCircle, CheckCircle } from 'lucide-react';
import './App.css';

const AnnDataApp = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // API Configuration
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';
  
  // Fetch user profile from backend
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token expired or invalid
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  }, [token, API_BASE_URL]);
  
  // Check if user is logged in on app load
  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token, fetchUserProfile]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setCurrentPage('home');
  };

  const Navigation = () => (
    <nav className="navbar">
      <div className="navbar-left">
        <Leaf className="h-6 w-6" />
        <h1>AnnData - Kisan 2.0</h1>
      </div>
      <div className="navbar-buttons">
        {['home', 'predict', 'weather', 'recommend', 'suppliers', 'feedback'].map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={currentPage === page ? 'active' : ''}
          >
            {page.charAt(0).toUpperCase() + page.slice(1)}
          </button>
        ))}
      </div>
      <div className="navbar-buttons">
        {notifications.length > 0 && (
          <div className="notification-icon">
            <AlertCircle className="h-5 w-5" />
            <span className="notification-badge">{notifications.length}</span>
          </div>
        )}
        {user ? (
          <>
            <div className="user-info">
              <User className="h-4 w-4" />
              <span>{user.username}</span>
            </div>
            <button onClick={() => setCurrentPage('profile')}>
              Profile
            </button>
            <button onClick={handleLogout} className="logout-btn">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </>
        ) : (
          <button onClick={() => setCurrentPage('login')}>
            <LogIn className="h-4 w-4" />
            Login
          </button>
        )}
      </div>
    </nav>
  );

  const HomePage = () => (
    <div className="page-bg">
      <div className="hero">
        <h1>Welcome to AnnData</h1>
        <p>
          Empowering farmers with AI-powered crop disease detection, weather forecasts,
          and smart agricultural insights. The future of farming starts here!
        </p>
        {!user && (
          <button onClick={() => setCurrentPage('login')}>
            Get Started Today
          </button>
        )}
      </div>

      <div className="features">
        <h2>Powerful Features for Modern Farming</h2>
        <div className="feature-grid">
          {[
            {
              icon: <Upload className="h-8 w-8" />,
              title: "AI Disease Detection",
              description: "Upload crop images and get instant AI-powered disease predictions with 95% accuracy.",
              page: "predict"
            },
            {
              icon: <Cloud className="h-8 w-8" />,
              title: "Smart Weather Forecasts", 
              description: "Get hyper-local weather predictions and agricultural alerts for your specific location.",
              page: "weather"
            },
            {
              icon: <Leaf className="h-8 w-8" />,
              title: "Crop Recommendations",
              description: "Personalized crop suggestions based on soil analysis, climate, and market trends.",
              page: "recommend"
            },
            {
              icon: <Users className="h-8 w-8" />,
              title: "Supplier Network",
              description: "Connect with verified suppliers for seeds, fertilizers, equipment, and expert consultation.",
              page: "suppliers"
            },
            {
              icon: <TrendingUp className="h-8 w-8" />,
              title: "Analytics Dashboard",
              description: "Track your farming activities, yields, and profits with detailed analytics and insights.",
              page: "profile"
            },
            {
              icon: <MessageCircle className="h-8 w-8" />,
              title: "Community Feedback",
              description: "Share experiences, get advice from experts, and help improve our platform.",
              page: "feedback"
            }
          ].map((feature, index) => (
            <div
              key={index}
              onClick={() => user ? setCurrentPage(feature.page) : setCurrentPage('login')}
              className="feature-card"
            >
              <div className="feature-icon">
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ 
      username: '', 
      email: '', 
      password: '', 
      confirmPassword: '' 
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState({});

    // Password strength validation
    const validatePassword = (password) => {
      const errors = [];
      if (password.length < 8) errors.push('At least 8 characters');
      if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
      if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
      if (!/\d/.test(password)) errors.push('One number');
      if (!/[!@#$%^&*]/.test(password)) errors.push('One special character (!@#$%^&*)');
      return errors;
    };

    // Username validation
    const validateUsername = (username) => {
      if (username.length < 3) return 'Username must be at least 3 characters';
      if (username.length > 50) return 'Username cannot exceed 50 characters';
      if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers, and underscores';
      return null;
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setMessage('');
      setErrors({});

      // Validation
      const validationErrors = {};
      
      if (!isLogin) {
        const usernameError = validateUsername(formData.username);
        if (usernameError) validationErrors.username = usernameError;
        
        const passwordErrors = validatePassword(formData.password);
        if (passwordErrors.length > 0) {
          validationErrors.password = passwordErrors.join(', ');
        }
        
        if (formData.password !== formData.confirmPassword) {
          validationErrors.confirmPassword = 'Passwords do not match';
        }
      }

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setLoading(false);
        return;
      }

      try {
        const endpoint = isLogin ? '/auth/login' : '/auth/register';
        const payload = isLogin 
          ? { email: formData.email, password: formData.password }
          : { username: formData.username, email: formData.email, password: formData.password };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
          if (isLogin) {
            setToken(data.token);
            setUser(data.user);
            localStorage.setItem('token', data.token);
            setCurrentPage('home');
            setMessage('Login successful!');
          } else {
            setMessage('Registration successful! Please login.');
            setIsLogin(true);
            setFormData({ username: '', email: '', password: '', confirmPassword: '' });
          }
        } else {
          setMessage(data.error || 'An error occurred');
        }
      } catch (error) {
        setMessage('Network error. Please check your connection.');
      }
      
      setLoading(false);
    };

    return (
      <div className="page-bg">
        <div className="form-container">
          <h2>{isLogin ? 'Welcome Back' : 'Join AnnData'}</h2>
          <p>{isLogin ? 'Sign in to your account' : 'Create your farming account'}</p>

          {message && (
            <div className={message.includes('successful') ? 'message-success' : 'message-error'}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Enter your username (3-50 characters)"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className={errors.username ? 'error' : ''}
                  required
                />
                {errors.username && <span className="error-text">{errors.username}</span>}
              </div>
            )}
            
            <div className="input-group">
              <input
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            
            <div className="input-group">
              <input
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className={errors.password ? 'error' : ''}
                required
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
              {!isLogin && (
                <div className="password-requirements">
                  <small>Password must contain: 8+ characters, uppercase, lowercase, number, special character</small>
                </div>
              )}
            </div>
            
            {!isLogin && (
              <div className="input-group">
                <input
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className={errors.confirmPassword ? 'error' : ''}
                  required
                />
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>
            )}
            
            <button type="submit" disabled={loading}>
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="form-footer">
            <button
              type="button"
              onClick={() => { 
                setIsLogin(!isLogin); 
                setMessage(''); 
                setErrors({});
                setFormData({ username: '', email: '', password: '', confirmPassword: '' });
              }}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const PredictPage = () => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleImageUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          setMessage('Image size must be less than 5MB');
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => setSelectedImage(e.target.result);
        reader.readAsDataURL(file);
        setMessage('');
      }
    };

    const analyzeCrop = async () => {
      if (!selectedImage) return;
      setLoading(true);
      setMessage('');
      
      try {
        // Convert base64 to blob
        const response = await fetch(selectedImage);
        const blob = await response.blob();
        
        const formData = new FormData();
        formData.append('image', blob, 'crop-image.jpg');

        const apiResponse = await fetch(`${API_BASE_URL}/crops/predict`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (apiResponse.ok) {
          const data = await apiResponse.json();
          setPrediction({
            name: data.prediction,
            confidence: Math.round(data.confidence * 100),
            treatment: getTreatment(data.prediction),
            severity: getSeverity(data.prediction)
          });
        } else {
          const errorData = await apiResponse.json();
          setMessage(errorData.error || 'Prediction failed');
        }
      } catch (error) {
        setMessage('Network error. Please try again.');
      }
      
      setLoading(false);
    };

    const getTreatment = (disease) => {
      const treatments = {
        'Healthy': 'Continue current care practices',
        'Blight': 'Apply copper-based fungicide, improve air circulation',
        'Rust': 'Use sulfur-based fungicide, remove infected leaves',
        'Leaf Spot': 'Apply fungicide, avoid overhead watering',
        'Powdery Mildew': 'Improve air circulation, apply neem oil'
      };
      return treatments[disease] || 'Consult local agricultural expert';
    };

    const getSeverity = (disease) => {
      if (disease === 'Healthy') return 'low';
      if (['Blight', 'Rust'].includes(disease)) return 'high';
      return 'medium';
    };

    return (
      <div className="page-bg">
        <div className="form-container">
          <h2>AI Crop Disease Detection</h2>
          <p>Upload a photo of your crop for instant AI analysis</p>

          {message && (
            <div className={message.includes('error') ? 'message-error' : 'message-info'}>
              {message}
            </div>
          )}

          <div className="upload-section">
            {selectedImage ? (
              <img src={selectedImage} alt="Crop" className="preview-image" />
            ) : (
              <div className="upload-placeholder">
                <Camera className="h-16 w-16" />
                <p>Upload crop image for analysis</p>
              </div>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
            id="image-upload"
          />
          <label htmlFor="image-upload" className="upload-button">
            <Upload className="h-5 w-5" />
            Choose Image
          </label>

          {selectedImage && (
            <button onClick={analyzeCrop} disabled={loading}>
              {loading ? 'Analyzing...' : 'Analyze Crop'}
            </button>
          )}

          {loading && (
            <div className="loading-section">
              <div className="spinner"></div>
              <p>AI is analyzing your crop image...</p>
            </div>
          )}
          
          {prediction && !loading && (
            <div className="results-box">
              <h3>Analysis Results</h3>
              <div className={`prediction-result severity-${prediction.severity}`}>
                <h4>{prediction.name}</h4>
                <p>Confidence: {prediction.confidence}%</p>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${prediction.confidence}%` }}
                  ></div>
                </div>
                <p><strong>Treatment:</strong> {prediction.treatment}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const WeatherPage = () => {
    const [location, setLocation] = useState('');
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(false);
    const [forecast, setForecast] = useState([]);
    const [message, setMessage] = useState('');

    const fetchWeather = async () => {
      if (!location.trim()) return;
      setLoading(true);
      setMessage('');
      
      try {
        const response = await fetch(`${API_BASE_URL}/weather?location=${encodeURIComponent(location)}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.error) {
            setMessage(`Error: ${data.error}`);
            if (data.fallback) {
              setWeather(data.fallback);
            }
          } else {
            // Handle real weather data from tomorrow.io
            setWeather({
              location: data.location,
              condition: data.current.condition,
              temp: data.current.temperature,
              humidity: data.current.humidity,
              wind: data.current.windSpeed,
              icon: data.current.icon,
              feelsLike: data.current.feelsLike,
              pressure: data.current.pressure,
              visibility: data.current.visibility,
              uvIndex: data.current.uvIndex,
              cloudCover: data.current.cloudCover
            });
            
            setForecast(data.forecast || []);
            setMessage(`✅ Real-time weather data from ${data.dataSource}`);
          }
        } else {
          const errorData = await response.json();
          setMessage(errorData.error || 'Failed to fetch weather');
        }
      } catch (error) {
        setMessage('Network error. Please check your connection.');
      }
      
      setLoading(false);
    };

    return (
      <div className="page-bg">
        <div className="form-container">
          <h2>Real-Time Weather Forecast</h2>
          
          {message && (
            <div className={message.includes('✅') ? 'message-success' : 'message-error'}>
              {message}
            </div>
          )}
          
          <div className="search-section">
            <input
              type="text"
              placeholder="Enter city name (e.g., Mapusa, Goa)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <button onClick={fetchWeather} disabled={loading || !location.trim()}>
              {loading ? 'Loading...' : 'Get Exact Weather'}
            </button>
          </div>

          {weather && (
            <div className="weather-results">
              <div className="current-weather">
                <div className="weather-header">
                  <div>
                    <h3>{weather.location}</h3>
                    <p>{weather.condition}</p>
                    {weather.dataSource && (
                      <small>Data from: {weather.dataSource}</small>
                    )}
                  </div>
                  <div className="weather-icon">{weather.icon}</div>
                </div>
                <div className="temperature">{weather.temp}°C</div>
                <div className="weather-details">
                  <div>
                    <Droplets className="h-5 w-5" />
                    <span>Humidity: {weather.humidity}%</span>
                  </div>
                  <div>
                    <Sun className="h-5 w-5" />
                    <span>Wind: {weather.wind} km/h</span>
                  </div>
                  {weather.feelsLike && (
                    <div>
                      <span>Feels like: {weather.feelsLike}°C</span>
                    </div>
                  )}
                </div>
              </div>

              {forecast.length > 0 && (
                <div className="forecast-section">
                  <h4>7-Day Forecast</h4>
                  {forecast.map((day, index) => (
                    <div key={index} className="forecast-item">
                      <span className="forecast-icon">{day.icon}</span>
                      <div className="forecast-info">
                        <div className="forecast-day">{day.day}</div>
                        <div className="forecast-condition">{day.condition}</div>
                      </div>
                      <div className="forecast-temp">
                        <div>{day.temp}°C</div>
                        <div>{day.humidity}% humidity</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const RecommendationPage = () => {
    const [soilType, setSoilType] = useState('');
    const [season, setSeason] = useState('');
    const [location, setLocation] = useState('');
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const getRecommendations = async () => {
      if (!soilType || !season || !location) return;
      setLoading(true);
      setMessage('');
      
      try {
        const response = await fetch(`${API_BASE_URL}/recommendation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            soil_type: soilType,
            season: season
          })
        });

        if (response.ok) {
          const data = await response.json();
          const recs = data.recommended.map(crop => ({
            crop,
            suitability: Math.floor(Math.random() * 30) + 70,
            expectedYield: Math.floor(Math.random() * 20) + 10 + ' tons/hectare',
            marketPrice: '₹' + (Math.floor(Math.random() * 30) + 20) + ',000/ton',
            growthPeriod: Math.floor(Math.random() * 60) + 90 + ' days'
          }));
          
          setRecommendations(recs);
        } else {
          const errorData = await response.json();
          setMessage(errorData.error || 'Failed to get recommendations');
        }
      } catch (error) {
        setMessage('Network error. Please try again.');
      }
      
      setLoading(false);
    };

    return (
      <div className="page-bg">
        <div className="form-container">
          <h2>Crop Recommendations</h2>
          
          {message && (
            <div className="message-error">
              {message}
            </div>
          )}
          
          <form onSubmit={(e) => { e.preventDefault(); getRecommendations(); }}>
            <select
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
              required
            >
              <option value="">Select soil type</option>
              <option value="clay">Clay Soil</option>
              <option value="sandy">Sandy Soil</option>
              <option value="loamy">Loamy Soil</option>
            </select>

            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              required
            >
              <option value="">Select season</option>
              <option value="kharif">Kharif (Monsoon)</option>
              <option value="rabi">Rabi (Winter)</option>
              <option value="zaid">Zaid (Summer)</option>
            </select>

            <input
              type="text"
              placeholder="Enter your location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
            
            <button type="submit" disabled={loading}>
              {loading ? 'Getting Recommendations...' : 'Get Crop Recommendations'}
            </button>
          </form>

          {recommendations.length > 0 && (
            <div className="recommendations-grid">
              {recommendations.map((rec, index) => (
                <div key={index} className="recommendation-card">
                  <div className="rec-header">
                    <h3>{rec.crop}</h3>
                    <span className="crop-icon">🌾</span>
                  </div>
                  <div className="rec-details">
                    <div className="rec-item">
                      <span>Suitability</span>
                      <span className="rec-value">{rec.suitability}%</span>
                    </div>
                    <div className="rec-item">
                      <span>Expected Yield</span>
                      <span className="rec-value">{rec.expectedYield}</span>
                    </div>
                    <div className="rec-item">
                      <span>Market Price</span>
                      <span className="rec-value">{rec.marketPrice}</span>
                    </div>
                    <div className="rec-item">
                      <span>Growth Period</span>
                      <span className="rec-value">{rec.growthPeriod}</span>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${rec.suitability}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const SuppliersPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [category, setCategory] = useState('all');
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const searchSuppliers = useCallback(async () => {
      setLoading(true);
      setMessage('');
      
      try {
        const response = await fetch(`${API_BASE_URL}/suppliers?location=${encodeURIComponent(searchTerm || 'Goa')}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Transform backend data to match frontend format
          const transformedSuppliers = data.map((supplier, index) => ({
            id: index + 1,
            name: supplier.name,
            category: supplier.type.toLowerCase(),
            rating: (Math.random() * 0.5 + 4.5).toFixed(1), // Random rating 4.5-5.0
            location: supplier.location,
            phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            email: `contact@${supplier.name.toLowerCase().replace(/\s+/g, '')}.com`,
            speciality: `${supplier.type} & Related Products`,
            verified: Math.random() > 0.3 // 70% verified
          }));
          
          setSuppliers(transformedSuppliers);
        } else {
          const errorData = await response.json();
          setMessage(errorData.error || 'Failed to fetch suppliers');
        }
      } catch (error) {
        setMessage('Network error. Please try again.');
      }
      
      setLoading(false);
    }, [searchTerm, API_BASE_URL, token]);

    useEffect(() => {
      searchSuppliers();
    }, [category, searchSuppliers]);

    return (
      <div className="page-bg">
        <div className="form-container">
          <h2>Supplier Network</h2>
          
          {message && (
            <div className="message-error">
              {message}
            </div>
          )}
          
          <div className="search-section">
            <input
              type="text"
              placeholder="Search suppliers by location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="seeds">Seeds</option>
              <option value="fertilizers">Fertilizers</option>
              <option value="pesticides">Pesticides</option>
              <option value="equipment">Equipment</option>
            </select>
            <button onClick={searchSuppliers}>
              <Search className="h-5 w-5" />
              Search
            </button>
          </div>

          {loading ? (
            <div className="loading-section">
              <div className="spinner"></div>
              <p>Finding suppliers...</p>
            </div>
          ) : (
            <div className="suppliers-grid">
              {suppliers.map((supplier) => (
                <div key={supplier.id} className="supplier-card">
                  <div className="supplier-header">
                    <div>
                      <h3>
                        {supplier.name}
                        {supplier.verified && <CheckCircle className="h-5 w-5 verified-icon" />}
                      </h3>
                      <p>{supplier.speciality}</p>
                    </div>
                    <div className="rating">
                      <Star className="h-4 w-4 star-filled" />
                      <span>{supplier.rating}</span>
                    </div>
                  </div>
                  
                  <div className="supplier-details">
                    <div className="supplier-item">
                      <MapPin className="h-4 w-4" />
                      {supplier.location}
                    </div>
                    <div className="supplier-item">
                      <Phone className="h-4 w-4" />
                      {supplier.phone}
                    </div>
                    <div className="supplier-item">
                      <Mail className="h-4 w-4" />
                      {supplier.email}
                    </div>
                  </div>
                  
                  <div className="supplier-actions">
                    <button className="contact-btn">Contact</button>
                    <button className="details-btn">View Details</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const FeedbackPage = () => {
    const [feedback, setFeedback] = useState({
      name: user?.username || '',
      email: user?.email || '',
      category: '',
      rating: 5,
      message: ''
    });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setMessage('');
      
      try {
        const response = await fetch(`${API_BASE_URL}/feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            user_id: user.id,
            message: feedback.message,
            category: feedback.category,
            rating: feedback.rating
          })
        });

        if (response.ok) {
          setSubmitted(true);
        } else {
          const errorData = await response.json();
          setMessage(errorData.error || 'Failed to submit feedback');
        }
      } catch (error) {
        setMessage('Network error. Please try again.');
      }
      
      setLoading(false);
    };

    const resetForm = () => {
      setFeedback({
        name: user?.username || '',
        email: user?.email || '',
        category: '',
        rating: 5,
        message: ''
      });
      setSubmitted(false);
      setMessage('');
    };

    return (
      <div className="page-bg">
        <div className="form-container">
          <h2>We Value Your Feedback</h2>
          
          {message && (
            <div className="message-error">
              {message}
            </div>
          )}
          
          {!submitted ? (
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Your Name"
                value={feedback.name}
                onChange={(e) => setFeedback({...feedback, name: e.target.value})}
                required
              />
              <input
                type="email"
                placeholder="Your Email"
                value={feedback.email}
                onChange={(e) => setFeedback({...feedback, email: e.target.value})}
                required
              />
              <select
                value={feedback.category}
                onChange={(e) => setFeedback({...feedback, category: e.target.value})}
                required
              >
                <option value="">Select feedback category</option>
                <option value="feature">Feature Request</option>
                <option value="bug">Bug Report</option>
                <option value="general">General Feedback</option>
                <option value="support">Support Request</option>
              </select>
              
              <div className="rating-section">
                <label>Rating</label>
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedback({...feedback, rating: star})}
                      className={`star ${star <= feedback.rating ? 'active' : ''}`}
                    >
                      ★
                    </button>
                  ))}
                  <span>({feedback.rating}/5)</span>
                </div>
              </div>
              
              <textarea
                rows={6}
                value={feedback.message}
                onChange={(e) => setFeedback({...feedback, message: e.target.value})}
                placeholder="Share your thoughts, suggestions, or report issues..."
                required
              ></textarea>
              
              <button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          ) : (
            <div className="success-message">
              <CheckCircle className="h-16 w-16 success-icon" />
              <h3>Thank You!</h3>
              <p>
                Your feedback has been submitted successfully and saved to our database. We appreciate your input and will review it carefully.
              </p>
              <button onClick={resetForm}>
                Submit Another Feedback
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ProfilePage = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [profileData, setProfileData] = useState({
      name: user?.username || '',
      email: user?.email || '',
      phone: '',
      location: '',
      farmSize: '',
      crops: []
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [stats, setStats] = useState([]);
    const [activities, setActivities] = useState([]);

    const fetchUserStats = useCallback(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/stats/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setStats([
            { label: 'Crops Analyzed', value: data.summary?.totalPredictions || '0', color: 'blue' },
            { label: 'Days Active', value: user ? Math.floor((Date.now() - new Date(user.createdAt || Date.now())) / (1000 * 60 * 60 * 24)) : '0', color: 'orange' },
            { label: 'Feedback Given', value: data.summary?.totalFeedback || '0', color: 'purple' },
            { label: 'Account Status', value: 'Active', color: 'green' }
          ]);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    }, [API_BASE_URL, token, user]);

    const fetchUserActivity = useCallback(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/user/predictions?limit=5`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const transformedActivities = data.predictions.map(pred => ({
            date: new Date(pred.createdAt).toISOString().split('T')[0],
            action: 'Disease detection completed',
            crop: pred.cropType || 'Unknown',
            result: pred.prediction?.disease || 'Unknown'
          }));
          setActivities(transformedActivities);
        }
      } catch (error) {
        console.error('Error fetching activity:', error);
      }
    }, [API_BASE_URL, token]);

    useEffect(() => {
      if (user) {
        fetchUserStats();
        fetchUserActivity();
      }
    }, [user, fetchUserStats, fetchUserActivity]);

    const handleProfileUpdate = async () => {
      setLoading(true);
      setMessage('');
      
      try {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            username: profileData.name,
            email: profileData.email,
            location: profileData.location,
            farmSize: profileData.farmSize,
            cropTypes: profileData.crops
          })
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setMessage('Profile updated successfully!');
        } else {
          const errorData = await response.json();
          setMessage(errorData.error || 'Failed to update profile');
        }
      } catch (error) {
        setMessage('Network error. Please try again.');
      }
      
      setLoading(false);
    };

    return (
      <div className="page-bg">
        <div className="form-container">
          <div className="profile-header">
            <div className="profile-avatar">
              <User className="h-12 w-12" />
            </div>
            <div className="profile-info">
              <h2>{user?.username || 'Farmer'}</h2>
              <p>{user?.email}</p>
              <p>Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}</p>
            </div>
          </div>
          
          {message && (
            <div className={message.includes('successfully') ? 'message-success' : 'message-error'}>
              {message}
            </div>
          )}
          
          <div className="profile-tabs">
            {['overview', 'stats', 'activity'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`tab-button ${activeTab === tab ? 'active' : ''}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          
          {activeTab === 'overview' && (
            <div className="profile-overview">
              <form onSubmit={(e) => { e.preventDefault(); handleProfileUpdate(); }}>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Location (City, State)"
                  value={profileData.location}
                  onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Farm Size (e.g., 5 acres)"
                  value={profileData.farmSize}
                  onChange={(e) => setProfileData({...profileData, farmSize: e.target.value})}
                />
                <button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </form>
            </div>
          )}
          
          {activeTab === 'stats' && (
            <div className="profile-stats">
              <div className="stats-grid">
                {stats.map((stat, index) => (
                  <div key={index} className={`stat-card stat-${stat.color}`}>
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'activity' && (
            <div className="profile-activity">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                {activities.length > 0 ? activities.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-indicator"></div>
                    <div className="activity-content">
                      <div className="activity-action">{activity.action}</div>
                      <div className="activity-details">
                        {activity.crop && `Crop: ${activity.crop}`}
                        {activity.result && ` - Result: ${activity.result}`}
                      </div>
                    </div>
                    <div className="activity-date">{activity.date}</div>
                  </div>
                )) : (
                  <p>No recent activity found.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Main render function
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'login':
        return <AuthPage />;
      case 'predict':
        return user ? <PredictPage /> : <AuthPage />;
      case 'weather':
        return user ? <WeatherPage /> : <AuthPage />;
      case 'recommend':
        return user ? <RecommendationPage /> : <AuthPage />;
      case 'suppliers':
        return user ? <SuppliersPage /> : <AuthPage />;
      case 'feedback':
        return user ? <FeedbackPage /> : <AuthPage />;
      case 'profile':
        return user ? <ProfilePage /> : <AuthPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="App">
      <Navigation />
      {renderCurrentPage()}
    </div>
  );
};

export default AnnDataApp;