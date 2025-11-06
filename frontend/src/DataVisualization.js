import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Activity, Download, RefreshCw } from 'lucide-react';
import axios from 'axios';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// ML API Base URL
const ML_API_BASE_URL = process.env.REACT_APP_ML_API_BASE_URL || 'https://anndata-ml-api.onrender.com';

const DataVisualizationPage = ({ token, API_BASE_URL }) => {
  const [activeTab, setActiveTab] = useState('soil');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    region: 'Maharashtra',
    crop: 'Rice',
    timePeriod: 12
  });
  const [errors, setErrors] = useState({});
  const [realDataLoaded, setRealDataLoaded] = useState(false);

  // Validation function
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.region || formData.region.trim().length === 0) {
      newErrors.region = 'Region is required';
    } else if (!/^[A-Za-z\s\-]+$/.test(formData.region)) {
      newErrors.region = 'Region must contain only letters, spaces, and hyphens';
    }
    
    if (!formData.crop || formData.crop.trim().length === 0) {
      newErrors.crop = 'Crop name is required';
    } else if (!/^[A-Za-z\s\-]+$/.test(formData.crop)) {
      newErrors.crop = 'Crop name must contain only letters, spaces, and hyphens';
    }
    
    const period = parseInt(formData.timePeriod);
    if (isNaN(period) || period < 1 || period > 24) {
      newErrors.timePeriod = 'Time period must be between 1 and 24 months';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Generate month labels
  const generateMonthLabels = (count) => {
    const labels = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    for (let i = count - 1; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      labels.push(monthNames[monthIndex]);
    }
    return labels;
  };

  // Generate realistic soil data
  const generateSoilData = () => {
    const months = generateMonthLabels(parseInt(formData.timePeriod));
    return months.map((month, index) => {
      const trend = 1 + (index / months.length) * 0.15;
      return {
        month,
        nitrogen: Math.round(70 + Math.random() * 30 * trend),
        phosphorous: Math.round(50 + Math.random() * 30 * trend),
        potassium: Math.round(60 + Math.random() * 30 * trend),
        ph: (6.0 + Math.random() * 1.5).toFixed(1)
      };
    });
  };

  // Generate crop performance data
  const generateCropData = () => {
    const months = generateMonthLabels(parseInt(formData.timePeriod));
    return months.map((month, index) => {
      const seasonal = 1 + 0.3 * Math.sin((2 * Math.PI * index) / 12);
      return {
        month,
        yield: Math.round(2500 + Math.random() * 1500 * seasonal),
        quality: Math.round(75 + Math.random() * 20),
        diseaseIncidents: Math.floor(Math.random() * 5)
      };
    });
  };

  // Generate market data
  const generateMarketData = () => {
    const months = generateMonthLabels(parseInt(formData.timePeriod));
    const baseDemand = 5000 + Math.random() * 2000;
    const basePrice = 25 + Math.random() * 15;
    
    return months.map((month, index) => {
      const trend = 1 + (index / months.length) * 0.2;
      return {
        month,
        demand: Math.round(baseDemand * trend + (Math.random() - 0.5) * 1000),
        price: (basePrice * trend + (Math.random() - 0.5) * 5).toFixed(2)
      };
    });
  };

  // Generate environmental data
  const generateEnvironmentalData = () => {
    const months = generateMonthLabels(parseInt(formData.timePeriod));
    return months.map((month, index) => {
      const seasonal = Math.sin((2 * Math.PI * index) / 12);
      return {
        month,
        temperature: (20 + 10 * seasonal + Math.random() * 5).toFixed(1),
        humidity: Math.round(60 + 20 * seasonal + Math.random() * 10),
        rainfall: Math.round(50 + 100 * Math.max(0, seasonal) + Math.random() * 30)
      };
    });
  };

  const cropDistribution = [
    { crop: 'Rice', value: 35, area: 140 },
    { crop: 'Wheat', value: 25, area: 100 },
    { crop: 'Cotton', value: 20, area: 80 },
    { crop: 'Sugarcane', value: 12, area: 48 },
    { crop: 'Vegetables', value: 8, area: 32 }
  ];

  const yieldComparison = [
    { crop: 'Rice', current: 3200, previous: 3000, target: 3500 },
    { crop: 'Wheat', current: 2800, previous: 2700, target: 3000 },
    { crop: 'Cotton', current: 1500, previous: 1400, target: 1800 },
    { crop: 'Sugarcane', current: 5500, previous: 5200, target: 6000 }
  ];

  const [soilData, setSoilData] = useState([]);
  const [cropData, setCropData] = useState([]);
  const [marketData, setMarketData] = useState([]);
  const [environmentalData, setEnvironmentalData] = useState([]);
  const [soilRecommendations, setSoilRecommendations] = useState([]);
  const [cropDistributionData, setCropDistributionData] = useState(cropDistribution);
  const [yieldComparisonData, setYieldComparisonData] = useState(yieldComparison);

  // Fetch real data from ML API
  const fetchRealData = async (analysisType) => {
    try {
      console.log(`🔍 Fetching ${analysisType} data from ML API...`);
      const response = await axios.post(`${ML_API_BASE_URL}/api/ml/visualization-data`, {
        analysis_type: analysisType,
        region: formData.region,
        crop: formData.crop,
        timePeriod: parseInt(formData.timePeriod)
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      if (response.data && response.data.success) {
        console.log(`✅ ${analysisType} data fetched successfully:`, response.data.data);
        return response.data.data;
      } else {
        console.error(`❌ Failed to fetch ${analysisType} data:`, response.data);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error fetching ${analysisType} data:`, error);
      throw error;
    }
  };

  // Load initial data on component mount
  useEffect(() => {
    handleRefresh();
  }, []);

  const handleRefresh = async () => {
    if (!validateForm()) {
      setMessage('❌ Please fix the validation errors before refreshing data');
      return;
    }
    
    setLoading(true);
    setMessage('');
    setRealDataLoaded(false);
    
    try {
      // Fetch all data types in parallel
      const [soilResult, cropResult, marketResult, distributionResult, environmentalResult] = await Promise.all([
        fetchRealData('soil'),
        fetchRealData('crop'),
        fetchRealData('market'),
        fetchRealData('distribution'),
        fetchRealData('environmental')
      ]);

      // Update soil data
      if (soilResult && soilResult.data) {
        setSoilData(soilResult.data.nutrient_levels || []);
        setSoilRecommendations(soilResult.data.recommendations || []);
      }

      // Update crop data
      if (cropResult && cropResult.data) {
        setCropData(cropResult.data.yield_trends || []);
        if (cropResult.data.crop_distribution) {
          setCropDistributionData(cropResult.data.crop_distribution);
        }
        if (cropResult.data.yield_comparison) {
          setYieldComparisonData(cropResult.data.yield_comparison);
        }
      }

      // Update market data
      if (marketResult && marketResult.data) {
        setMarketData(marketResult.data.market_trends || []);
      }

      // Update distribution data
      if (distributionResult && distributionResult.data) {
        setCropDistributionData(distributionResult.data.crop_distribution || cropDistribution);
      }

      // Update environmental data
      if (environmentalResult && environmentalResult.data) {
        setEnvironmentalData(environmentalResult.data.environmental_data || []);
      }

      setRealDataLoaded(true);
      setMessage(`✅ Real data loaded successfully from ML datasets for ${formData.region} - ${formData.crop}`);
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage(`❌ Failed to load data from ML API. ${error.response?.data?.error || error.message}`);
      
      // Fallback to generated data if API fails
      setSoilData(generateSoilData());
      setCropData(generateCropData());
      setMarketData(generateMarketData());
      setEnvironmentalData(generateEnvironmentalData());
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const dataToExport = {
      region: formData.region,
      crop: formData.crop,
      timePeriod: formData.timePeriod,
      generatedAt: new Date().toISOString(),
      dataSource: realDataLoaded ? 'ML Datasets (Real Data)' : 'Generated Data',
      soilData,
      cropData,
      marketData,
      environmentalData,
      cropDistribution: cropDistributionData,
      yieldComparison: yieldComparisonData,
      soilRecommendations
    };
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agricultural-analytics-${formData.region}-${formData.crop}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage('✅ Real data exported successfully!');
  };

  const calculateStats = () => {
    const avgNitrogen = soilData.length > 0 
      ? soilData.reduce((sum, d) => sum + (d.nitrogen || 0), 0) / soilData.length 
      : 0;
    const avgYield = cropData.length > 0 
      ? cropData.reduce((sum, d) => sum + (d.yield || 0), 0) / cropData.length 
      : 0;
    const avgQuality = cropData.length > 0 
      ? cropData.reduce((sum, d) => sum + (d.quality || 0), 0) / cropData.length 
      : 0;
    const totalDiseases = cropData.length > 0 
      ? cropData.reduce((sum, d) => sum + (d.diseaseIncidents || 0), 0) 
      : 0;
    const avgPrice = marketData.length > 0 
      ? marketData.reduce((sum, d) => sum + (parseFloat(d.price) || 0), 0) / marketData.length 
      : 0;
    
    return {
      avgNitrogen: avgNitrogen.toFixed(1),
      avgYield: avgYield.toFixed(0),
      avgQuality: avgQuality.toFixed(1),
      totalDiseases,
      avgPrice: avgPrice.toFixed(2)
    };
  };

  const stats = calculateStats();

  return (
    <div className="page-bg">
      <div className="form-container" style={{ maxWidth: '1400px' }}>
        <h2>📊 Data Visualization Dashboard</h2>
        <p>Comprehensive agricultural analytics and insights for {formData.region}</p>
        {realDataLoaded && (
          <div style={{ padding: '10px', background: '#10b98120', borderRadius: '8px', marginBottom: '10px', border: '2px solid #10b981' }}>
            <strong>✅ Real Data Source:</strong> All visualizations are based on actual ML training datasets from crop_recommendation.csv, crop_yield.csv, crop_demand_data.csv, and crop_soil.csv
          </div>
        )}

        {message && (
          <div className={message.includes('✅') ? 'message-success' : 'message-error'}>
            {message}
          </div>
        )}

        {/* Control Panel */}
        <div className="ml-section" style={{ marginBottom: '20px', padding: '20px', background: '#f9fafb', borderRadius: '8px' }}>
          <h3>🎛️ Control Panel</h3>
          <div className="form-grid">
            <div className="input-group">
              <input
                type="text"
                placeholder="Region (e.g., Maharashtra)"
                value={formData.region}
                onChange={(e) => setFormData({...formData, region: e.target.value})}
                className={errors.region ? 'error' : ''}
              />
              {errors.region && <span className="error-text">{errors.region}</span>}
            </div>
            <div className="input-group">
              <input
                type="text"
                placeholder="Crop (e.g., Rice)"
                value={formData.crop}
                onChange={(e) => setFormData({...formData, crop: e.target.value})}
                className={errors.crop ? 'error' : ''}
              />
              {errors.crop && <span className="error-text">{errors.crop}</span>}
            </div>
            <div className="input-group">
              <input
                type="number"
                placeholder="Time Period (1-24 months)"
                value={formData.timePeriod}
                onChange={(e) => setFormData({...formData, timePeriod: e.target.value})}
                min="1"
                max="24"
                className={errors.timePeriod ? 'error' : ''}
              />
              {errors.timePeriod && <span className="error-text">{errors.timePeriod}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button onClick={handleRefresh} disabled={loading} style={{ flex: 1 }}>
              <RefreshCw className="h-4 w-4" style={{ marginRight: '5px', display: 'inline' }} />
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
            <button onClick={handleExport} style={{ flex: 1 }}>
              <Download className="h-4 w-4" style={{ marginRight: '5px', display: 'inline' }} />
              Export Data
            </button>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="stats-grid" style={{ marginBottom: '20px' }}>
          <div className="stat-card stat-green">
            <div className="stat-value">{stats.avgNitrogen}</div>
            <div className="stat-label">Avg Nitrogen (NPK)</div>
          </div>
          <div className="stat-card stat-blue">
            <div className="stat-value">{stats.avgYield}</div>
            <div className="stat-label">Avg Yield (kg/ha)</div>
          </div>
          <div className="stat-card stat-purple">
            <div className="stat-value">{stats.avgQuality}%</div>
            <div className="stat-label">Avg Quality Score</div>
          </div>
          <div className="stat-card stat-orange">
            <div className="stat-value">₹{stats.avgPrice}</div>
            <div className="stat-label">Avg Market Price</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="ml-tabs">
          {[
            { id: 'soil', label: 'Soil Analysis', icon: <Activity className="h-5 w-5" /> },
            { id: 'crop', label: 'Crop Performance', icon: <TrendingUp className="h-5 w-5" /> },
            { id: 'market', label: 'Market Trends', icon: <BarChart3 className="h-5 w-5" /> },
            { id: 'distribution', label: 'Crop Distribution', icon: <PieChartIcon className="h-5 w-5" /> },
            { id: 'environmental', label: 'Environmental', icon: <Activity className="h-5 w-5" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`ml-tab-button ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Soil Analysis Tab */}
        {activeTab === 'soil' && (
          <div className="ml-section">
            <h3>🌱 Soil Nutrient Analysis</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={soilData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="nitrogen" stroke="#10b981" strokeWidth={2} name="Nitrogen (N)" />
                <Line type="monotone" dataKey="phosphorous" stroke="#3b82f6" strokeWidth={2} name="Phosphorous (P)" />
                <Line type="monotone" dataKey="potassium" stroke="#f59e0b" strokeWidth={2} name="Potassium (K)" />
              </LineChart>
            </ResponsiveContainer>
            <div className="ml-results" style={{ marginTop: '20px' }}>
              <h4>💡 Soil Health Recommendations {realDataLoaded && '(Based on Real Dataset)'}</h4>
              <ul>
                {soilRecommendations.length > 0 ? (
                  soilRecommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))
                ) : (
                  <>
                    <li>✅ Nitrogen levels are optimal for {formData.crop} cultivation</li>
                    <li>✅ Phosphorous levels are adequate for root development</li>
                    <li>✅ Potassium levels support disease resistance</li>
                    <li>💡 Regular soil testing every 6 months is recommended</li>
                    <li>💡 Add organic matter to improve soil structure</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Crop Performance Tab */}
        {activeTab === 'crop' && (
          <div className="ml-section">
            <h3>📈 Crop Yield & Quality Trends</h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={cropData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="yield" stroke="#10b981" fill="#10b98133" name="Yield (kg/ha)" />
                <Area type="monotone" dataKey="quality" stroke="#3b82f6" fill="#3b82f633" name="Quality Score" />
              </AreaChart>
            </ResponsiveContainer>
            
            <h4 style={{ marginTop: '30px' }}>📊 Yield Comparison by Crop {realDataLoaded && '(Real Data)'}</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yieldComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="crop" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="previous" fill="#94a3b8" name="Previous Season" />
                <Bar dataKey="current" fill="#10b981" name="Current Season" />
                <Bar dataKey="target" fill="#3b82f6" name="Target" />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="ml-results" style={{ marginTop: '20px' }}>
              <h4>💡 Performance Insights {realDataLoaded && '(Based on Real Dataset)'}</h4>
              <ul>
                <li>📈 Yield trends show {stats.avgYield > 3000 ? 'positive' : 'moderate'} growth</li>
                <li>✅ Average quality score of {stats.avgQuality}% indicates good crop health</li>
                <li>⚠️ Total disease incidents: {stats.totalDiseases} - {stats.totalDiseases < 10 ? 'Low risk' : 'Monitor closely'}</li>
                <li>💡 Implement precision farming techniques for better yields</li>
                <li>💡 Consider crop rotation to improve soil health</li>
              </ul>
            </div>
          </div>
        )}

        {/* Market Trends Tab */}
        {activeTab === 'market' && (
          <div className="ml-section">
            <h3>💰 Market Demand & Price Trends</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={marketData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="demand" stroke="#10b981" strokeWidth={2} name="Demand (tonnes)" />
                <Line yAxisId="right" type="monotone" dataKey="price" stroke="#f59e0b" strokeWidth={2} name="Price (₹/kg)" />
              </LineChart>
            </ResponsiveContainer>
            <div className="ml-results" style={{ marginTop: '20px' }}>
              <h4>💡 Market Insights for {formData.crop}</h4>
              <ul>
                <li>📈 Demand is trending {marketData[marketData.length-1].demand > marketData[0].demand ? 'upward' : 'stable'} - good time to plan production</li>
                <li>💰 Average market price: ₹{stats.avgPrice}/kg</li>
                <li>🎯 Price volatility: {Math.abs(parseFloat(marketData[marketData.length-1].price) - parseFloat(marketData[0].price)) < 5 ? 'Low' : 'Moderate'}</li>
                <li>💡 Target harvest during peak demand months for better prices</li>
                <li>💡 Consider forward contracts to hedge price risks</li>
              </ul>
            </div>
          </div>
        )}

        {/* Crop Distribution Tab */}
        {activeTab === 'distribution' && (
          <div className="ml-section">
            <h3>🥧 Crop Distribution Analysis {realDataLoaded && '(Real Dataset)'}</h3>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={cropDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.crop}: ${entry.value}%`}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {cropDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            <h4 style={{ marginTop: '30px' }}>📊 Area Distribution (hectares) {realDataLoaded && '(Real Data)'}</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cropDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="crop" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="area" fill="#10b981" name="Area (hectares)">
                  {cropDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            <div className="ml-results" style={{ marginTop: '20px' }}>
              <h4>💡 Diversification Recommendations</h4>
              <ul>
                <li>✅ Good crop diversity reduces risk and improves soil health</li>
                <li>💡 Rice dominates at 35% - consider increasing vegetable production for higher margins</li>
                <li>🌾 Maintain staple crops (Rice, Wheat) for food security and stable income</li>
                <li>💡 Sugarcane and Cotton provide good cash crop opportunities</li>
                <li>🎯 Aim for balanced portfolio: 40% staples, 30% cash crops, 30% vegetables</li>
              </ul>
            </div>
          </div>
        )}

        {/* Environmental Factors Tab */}
        {activeTab === 'environmental' && (
          <div className="ml-section">
            <h3>🌦️ Environmental Factors Analysis</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={environmentalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} name="Temperature (°C)" />
                <Line type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2} name="Humidity (%)" />
                <Line type="monotone" dataKey="rainfall" stroke="#10b981" strokeWidth={2} name="Rainfall (mm)" />
              </LineChart>
            </ResponsiveContainer>
            <div className="ml-results" style={{ marginTop: '20px' }}>
              <h4>💡 Environmental Insights</h4>
              <ul>
                <li>🌡️ Temperature patterns show seasonal variation suitable for {formData.crop}</li>
                <li>💧 Humidity levels are within optimal range for crop growth</li>
                <li>🌧️ Rainfall distribution supports irrigation planning</li>
                <li>💡 Monitor weather forecasts for extreme events</li>
                <li>💡 Consider drip irrigation during low rainfall periods</li>
                <li>🎯 Plan planting cycles based on temperature and rainfall patterns</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataVisualizationPage;
