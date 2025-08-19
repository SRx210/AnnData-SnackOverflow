import React, { useState, useEffect } from 'react';
import { Upload, Cloud, Users, Leaf, User, MessageCircle, LogIn, LogOut, Search, MapPin, Phone, Mail, Star, Camera, TrendingUp, Droplets, Sun, AlertCircle, CheckCircle, Calendar } from 'lucide-react';
import './App.css';

const AnnDataApp = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [notifications, setNotifications] = useState([]);
  
  // API Configuration
  const api_base_url = 'http://localhost:3000/api-docs';
  const weather_api_key = process.env.react_weather_api_key;
  const prediction_endpoint = '/api/crops/predict';
  const weather_endpoint = '/api/weather';
  const suppliers_endpoint = '/api/suppliers';

  useEffect(() => {
    // Initialize notifications
    setNotifications([
      { id: 1, message: "Weather alert: Rain expected tomorrow", type: "warning" },
      { id: 2, message: "New disease detection completed", type: "success" }
    ]);
  }, []);

  const handleLogout = () => {
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

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setMessage('');

      if (!isLogin && formData.password !== formData.confirmPassword) {
        setMessage('Passwords do not match');
        setLoading(false);
        return;
      }

      // Simulate API call
      try {
        await new Promise(res => setTimeout(res, 1500));
        
        if (isLogin) {
          setToken('demo-token-' + Date.now());
          setUser({ 
            username: formData.email.split('@')[0], 
            email: formData.email 
          });
          setCurrentPage('home');
          setMessage('Login successful!');
        } else {
          setMessage('Registration successful! Please login.');
          setIsLogin(true);
          setFormData({ username: '', email: '', password: '', confirmPassword: '' });
        }
      } catch (error) {
        setMessage('An error occurred. Please try again.');
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
              <input
                type="text"
                placeholder="Enter your username"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
              />
            )}
            <input
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
            <input
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
            {!isLogin && (
              <input
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required
              />
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

    const handleImageUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => setSelectedImage(e.target.result);
        reader.readAsDataURL(file);
      }
    };

    const analyzeCrop = async () => {
      if (!selectedImage) return;
      setLoading(true);
      
      try {
        // Simulate API call to prediction endpoint
        await new Promise(res => setTimeout(res, 2000));
        
        const diseases = [
          { name: "Healthy", confidence: 92, treatment: "Continue current care practices", severity: "low" },
          { name: "Leaf Blight", confidence: 78, treatment: "Apply fungicide spray", severity: "medium" },
          { name: "Rust Disease", confidence: 85, treatment: "Use copper-based fungicide", severity: "high" },
          { name: "Powdery Mildew", confidence: 67, treatment: "Improve air circulation", severity: "medium" }
        ];
        
        const randomResult = diseases[Math.floor(Math.random() * diseases.length)];
        setPrediction(randomResult);
      } catch (error) {
        console.error('Prediction failed:', error);
      }
      
      setLoading(false);
    };

    return (
      <div className="page-bg">
        <div className="form-container">
          <h2>AI Crop Disease Detection</h2>
          <p>Upload a photo of your crop for instant AI analysis</p>

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

    const fetchWeather = async () => {
      if (!location.trim()) return;
      setLoading(true);
      
      try {
        // Simulate API call to weather endpoint
        await new Promise(res => setTimeout(res, 1000));
        
        const conditions = [
          { condition: 'Sunny', temp: 28, humidity: 45, wind: 12, icon: '☀️' },
          { condition: 'Cloudy', temp: 24, humidity: 65, wind: 8, icon: '☁️' },
          { condition: 'Rainy', temp: 22, humidity: 85, wind: 15, icon: '🌧️' },
          { condition: 'Partly Cloudy', temp: 26, humidity: 55, wind: 10, icon: '⛅' }
        ];
        
        const currentWeather = conditions[Math.floor(Math.random() * conditions.length)];
        setWeather({ location, ...currentWeather });
        
        // Generate 7-day forecast
        const forecastData = Array.from({ length: 7 }, (_, i) => ({
          day: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toLocaleDateString('en', { weekday: 'short' }),
          ...conditions[Math.floor(Math.random() * conditions.length)]
        }));
        setForecast(forecastData);
      } catch (error) {
        console.error('Weather fetch failed:', error);
      }
      
      setLoading(false);
    };

    return (
      <div className="page-bg">
        <div className="form-container">
          <h2>Weather Forecast</h2>
          
          <div className="search-section">
            <input
              type="text"
              placeholder="Enter city name (e.g., Mumbai, Delhi)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <button onClick={fetchWeather} disabled={loading || !location.trim()}>
              {loading ? 'Loading...' : 'Get Weather'}
            </button>
          </div>

          {weather && (
            <div className="weather-results">
              <div className="current-weather">
                <div className="weather-header">
                  <div>
                    <h3>{weather.location}</h3>
                    <p>{weather.condition}</p>
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
                </div>
              </div>

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

    const getRecommendations = async () => {
      if (!soilType || !season || !location) return;
      setLoading(true);
      
      try {
        await new Promise(res => setTimeout(res, 1500));
        
        const crops = {
          'clay': {
            'summer': ['Rice', 'Cotton', 'Sugarcane'],
            'winter': ['Wheat', 'Barley', 'Peas'],
            'monsoon': ['Rice', 'Soybean', 'Maize']
          },
          'sandy': {
            'summer': ['Millet', 'Groundnut', 'Watermelon'],
            'winter': ['Carrot', 'Radish', 'Cabbage'],
            'monsoon': ['Bajra', 'Jowar', 'Castor']
          },
          'loamy': {
            'summer': ['Tomato', 'Brinjal', 'Okra'],
            'winter': ['Potato', 'Onion', 'Garlic'],
            'monsoon': ['Rice', 'Sugarcane', 'Jute']
          }
        };

        const cropList = crops[soilType]?.[season] || ['Wheat', 'Rice', 'Maize'];
        const recs = cropList.map(crop => ({
          crop,
          suitability: Math.floor(Math.random() * 30) + 70,
          expectedYield: Math.floor(Math.random() * 20) + 10 + ' tons/hectare',
          marketPrice: '₹' + (Math.floor(Math.random() * 30) + 20) + ',000/ton',
          growthPeriod: Math.floor(Math.random() * 60) + 90 + ' days'
        }));
        
        setRecommendations(recs);
      } catch (error) {
        console.error('Recommendation fetch failed:', error);
      }
      
      setLoading(false);
    };

    return (
      <div className="page-bg">
        <div className="form-container">
          <h2>Crop Recommendations</h2>
          
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
              <option value="summer">Summer</option>
              <option value="winter">Winter</option>
              <option value="monsoon">Monsoon</option>
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

    const searchSuppliers = async () => {
      setLoading(true);
      
      try {
        await new Promise(res => setTimeout(res, 1000));
        
        const supplierData = [
          {
            id: 1,
            name: "Green Valley Seeds Co.",
            category: "seeds",
            rating: 4.8,
            location: "Mapusa, Goa",
            phone: "+91 98765 43210",
            email: "contact@greenvalley.com",
            speciality: "Hybrid Seeds & Organic Varieties",
            verified: true
          },
          {
            id: 2,
            name: "FarmTech Equipment",
            category: "equipment",
            rating: 4.6,
            location: "Panjim, Goa",
            phone: "+91 87654 32109",
            email: "sales@farmtech.in",
            speciality: "Tractors & Agricultural Machinery",
            verified: true
          },
          {
            id: 3,
            name: "Organic Fertilizers Ltd",
            category: "fertilizers",
            rating: 4.7,
            location: "Margao, Goa",
            phone: "+91 76543 21098",
            email: "info@organicfert.co.in",
            speciality: "Bio-fertilizers & Soil Conditioners",
            verified: false
          },
          {
            id: 4,
            name: "Crop Guard Solutions",
            category: "pesticides",
            rating: 4.5,
            location: "Porvorim, Goa",
            phone: "+91 65432 10987",
            email: "support@cropguard.net",
            speciality: "Eco-friendly Pesticides",
            verified: true
          }
        ];

        let filteredSuppliers = supplierData;
        if (category !== 'all') {
          filteredSuppliers = supplierData.filter(s => s.category === category);
        }
        if (searchTerm) {
          filteredSuppliers = filteredSuppliers.filter(s => 
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.speciality.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        setSuppliers(filteredSuppliers);
      } catch (error) {
        console.error('Supplier search failed:', error);
      }
      
      setLoading(false);
    };

    useEffect(() => {
      searchSuppliers();
    }, [category]);

    return (
      <div className="page-bg">
        <div className="form-container">
          <h2>Supplier Network</h2>
          
          <div className="search-section">
            <input
              type="text"
              placeholder="Search suppliers by name or speciality..."
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

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      
      try {
        await new Promise(res => setTimeout(res, 1500));
        setSubmitted(true);
      } catch (error) {
        console.error('Feedback submission failed:', error);
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
    };

    return (
      <div className="page-bg">
        <div className="form-container">
          <h2>We Value Your Feedback</h2>
          
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
                Your feedback has been submitted successfully. We appreciate your input and will review it carefully.
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

    const stats = [
      { label: 'Crops Analyzed', value: '24', color: 'blue' },
      { label: 'Weather Queries', value: '15', color: 'green' },
      { label: 'Recommendations', value: '8', color: 'purple' },
      { label: 'Days Active', value: '45', color: 'orange' }
    ];

    const activities = [
      { date: '2024-08-14', action: 'Disease detection completed', crop: 'Tomato', result: 'Healthy' },
      { date: '2024-08-13', action: 'Weather forecast checked', location: 'Mumbai', condition: 'Sunny' },
      { date: '2024-08-12', action: 'Crop recommendation received', crop: 'Rice', suitability: '92%' },
      { date: '2024-08-11', action: 'Supplier contacted', supplier: 'Green Valley Seeds Co.', category: 'Seeds' }
    ];

    const handleProfileUpdate = () => {
      // Handle profile update logic
      console.log('Profile updated:', profileData);
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
              <p>Member since August 2024</p>
            </div>
          </div>
          
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
                <button type="submit">Update Profile</button>
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
                {activities.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-indicator"></div>
                    <div className="activity-content">
                      <div className="activity-action">{activity.action}</div>
                      <div className="activity-details">
                        {activity.crop && `Crop: ${activity.crop}`}
                        {activity.location && `Location: ${activity.location}`}
                        {activity.supplier && `Supplier: ${activity.supplier}`}
                        {activity.result && ` - Result: ${activity.result}`}
                        {activity.condition && ` - ${activity.condition}`}
                        {activity.suitability && ` - Suitability: ${activity.suitability}`}
                        {activity.category && ` - Category: ${activity.category}`}
                      </div>
                    </div>
                    <div className="activity-date">{activity.date}</div>
                  </div>
                ))}
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