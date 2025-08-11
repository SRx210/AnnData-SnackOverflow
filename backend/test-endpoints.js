#!/usr/bin/env node

/**
 * Simple test script for AnnData API endpoints
 * Run with: node test-endpoints.js
 * Make sure the server is running on localhost:3000
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
let authToken = '';

// Helper function to make HTTP requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check...');
  try {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/health',
      method: 'GET'
    };
    
    const response = await makeRequest(options);
    console.log(`✅ Health Check: ${response.status} - ${response.data.message}`);
    return response.status === 200;
  } catch (error) {
    console.log('❌ Health Check failed:', error.message);
    return false;
  }
}

async function testUserRegistration() {
  console.log('\n👤 Testing User Registration...');
  try {
    const userData = JSON.stringify({
      username: 'testuser' + Date.now(),
      email: `test${Date.now()}@example.com`,
      password: 'password123'
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': userData.length
      }
    };

    const response = await makeRequest(options, userData);
    console.log(`✅ Registration: ${response.status} - ${response.data.message}`);
    return response.status === 201;
  } catch (error) {
    console.log('❌ Registration failed:', error.message);
    return false;
  }
}

async function testUserLogin() {
  console.log('\n🔑 Testing User Login...');
  try {
    // First register a user for login test
    const userData = JSON.stringify({
      username: 'logintest',
      email: 'logintest@example.com',
      password: 'password123'
    });

    await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': userData.length
      }
    }, userData);

    // Now test login
    const loginData = JSON.stringify({
      email: 'logintest@example.com',
      password: 'password123'
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
      }
    };

    const response = await makeRequest(options, loginData);
    if (response.status === 200 && response.data.token) {
      authToken = response.data.token;
      console.log(`✅ Login: ${response.status} - Token received`);
      return true;
    } else {
      console.log(`❌ Login failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Login failed:', error.message);
    return false;
  }
}

async function testWeatherAPI() {
  console.log('\n🌤️ Testing Weather API...');
  try {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/weather?location=Mumbai',
      method: 'GET'
    };

    const response = await makeRequest(options);
    console.log(`✅ Weather: ${response.status} - ${response.data.location}: ${response.data.forecast}`);
    return response.status === 200;
  } catch (error) {
    console.log('❌ Weather API failed:', error.message);
    return false;
  }
}

async function testSuppliersAPI() {
  console.log('\n🏪 Testing Suppliers API...');
  try {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/suppliers?location=Pune',
      method: 'GET'
    };

    const response = await makeRequest(options);
    console.log(`✅ Suppliers: ${response.status} - Found ${response.data.length} suppliers`);
    return response.status === 200;
  } catch (error) {
    console.log('❌ Suppliers API failed:', error.message);
    return false;
  }
}

async function testCropRecommendation() {
  console.log('\n🌾 Testing Crop Recommendation...');
  try {
    const requestData = JSON.stringify({
      soil_type: 'loamy',
      season: 'kharif'
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/recommendation',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': requestData.length
      }
    };

    const response = await makeRequest(options, requestData);
    console.log(`✅ Recommendations: ${response.status} - Suggested crops: ${response.data.recommended.join(', ')}`);
    return response.status === 200;
  } catch (error) {
    console.log('❌ Crop Recommendation failed:', error.message);
    return false;
  }
}

async function testUserProfile() {
  console.log('\n👤 Testing User Profile...');
  if (!authToken) {
    console.log('❌ No auth token available, skipping profile test');
    return false;
  }

  try {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/user/profile',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    };

    const response = await makeRequest(options);
    console.log(`✅ Profile: ${response.status} - User: ${response.data.username} (${response.data.email})`);
    return response.status === 200;
  } catch (error) {
    console.log('❌ User Profile failed:', error.message);
    return false;
  }
}

async function testFeedback() {
  console.log('\n💬 Testing Feedback API...');
  try {
    const feedbackData = JSON.stringify({
      user_id: '1',
      message: 'This is a test feedback from the automated test script!'
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/feedback',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': feedbackData.length
      }
    };

    const response = await makeRequest(options, feedbackData);
    console.log(`✅ Feedback: ${response.status} - ${response.data.message}`);
    return response.status === 200;
  } catch (error) {
    console.log('❌ Feedback failed:', error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting AnnData API Tests...');
  console.log('Make sure the server is running on http://localhost:3000');

  const results = [];
  
  results.push(await testHealthCheck());
  results.push(await testUserRegistration());
  results.push(await testUserLogin());
  results.push(await testWeatherAPI());
  results.push(await testSuppliersAPI());
  results.push(await testCropRecommendation());
  results.push(await testUserProfile());
  results.push(await testFeedback());

  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);

  if (passed === total) {
    console.log('🎉 All tests passed! Your API is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the output above for details.');
  }

  console.log('\n📖 Access API documentation at: http://localhost:3000/api-docs');
}

// Run tests if script is called directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests };