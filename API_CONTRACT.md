# 📑 API Contract – AnnData - Kisan 2.0 Starts Here!!

This document outlines all backend API endpoints required for the AnnData web application.

---

## User Authentication

### Register User
- **Method:** POST
- **Endpoint:** /api/auth/register
- **Description:** Registers a new user
- **Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```
- **Success Response (201):**
```json
{
  "message": "User registered successfully"
}
```
- **Error (400):** Email already exists

---

### Login User
- **Method:** POST
- **Endpoint:** /api/auth/login
- **Description:** Logs in user
- **Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```
- **Success Response (200):**
```json
{
  "token": "JWT Token",
  "user": {
    "id": "string",
    "username": "string"
  }
}
```
- **Error (401):** Invalid credentials

---

## Crop Prediction

### Upload Image & Predict Disease
- **Method:** POST
- **Endpoint:** /api/crops/predict
- **Description:** Uploads an image and returns predicted crop disease
- **Request Body (form-data):**
  - image: file (JPEG/PNG)
- **Success Response (200):**
```json
{
  "prediction": "Blight",
  "confidence": 0.92
}
```
- **Error (400):** Invalid image file

---

## Weather Forecast

### Get Weather for Location
- **Method:** GET
- **Endpoint:** /api/weather?location=cityname
- **Description:** Returns 7-day weather forecast
- **Success Response (200):**
```json
{
  "location": "Mumbai",
  "forecast": "Cloudy with light rain"
}
```

---

## Supplier Info

### Get Nearby Suppliers
- **Method:** GET
- **Endpoint:** /api/suppliers?location=cityname
- **Description:** Returns list of suppliers (mock data)
- **Success Response (200):**
```json
[
  {
    "name": "AgroMart",
    "location": "Pune",
    "type": "Fertilizers"
  }
]
```

---

## Crop Recommendation

### Get Recommended Crops
- **Method:** POST
- **Endpoint:** /api/recommendation
- **Description:** Recommends best crops based on soil, season
- **Request Body:**
```json
{
  "soil_type": "loamy",
  "season": "kharif"
}
```
- **Success Response (200):**
```json
{
  "recommended": ["Rice", "Cotton"]
}
```

---

## Feedback

### Submit Feedback
- **Method:** POST
- **Endpoint:** /api/feedback
- **Description:** Allows users to send feedback
- **Request Body:**
```json
{
  "user_id": "string",
  "message": "Great platform!"
}
```
- **Success Response (200):**
```json
{
  "message": "Feedback received"
}
```

---

## Get User Profile

### View Profile
- **Method:** GET
- **Endpoint:** /api/user/profile
- **Headers:** Authorization: Bearer Token
- **Description:** Returns logged-in user profile
- **Success Response (200):**
```json
{
  "username": "sohan",
  "email": "sohan@email.com"
}
```

---

## Update Profile

### Edit User Details
- **Method:** PUT
- **Endpoint:** /api/user/profile
- **Headers:** Authorization: Bearer Token
- **Request Body:**
```json
{
  "username": "newname",
  "email": "new@email.com"
}
```
- **Success Response (200):**
```json
{
  "message": "Profile updated"
}
```

---

> This document will evolve with your frontend/backend progress. Keep it updated and refer before every API integration.