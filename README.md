# 🌾 AnnData – Team Snack Overflow

## 📌 Project Description
**AnnData** is an AI-powered platform that empowers farmers with real-time **crop demand predictions** and **smart agricultural insights**.  
Our mission is to modernize Indian farming through **data-driven decisions** and **sustainable practices**, benefiting all stakeholders in the agricultural ecosystem.

---

## 🚀 Live API & Documentation
- **Swagger UI (Live Docs):** [https://ann-data-api.onrender.com/api-docs](https://ann-data-api.onrender.com/api-docs)
- **Swagger UI (Local):** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

---

## Team Members
- [Sohan Raut](https://github.com/SRx210)
- [Shivam Shirodkar](https://github.com/Shivamshirodkarrr)  
- [Vivek Naik](https://github.com/VivekNaik0309)  
- [Modinasab Y. Pinjar](https://github.com/ModinasabPinjar)  
- [Nikesh Thorat](https://github.com/Nikeshthorat)  

---

## 🛠 Tech Stack
- **Frontend:** React.js (Axios for API calls, CSS Flex/Grid for layout, Responsive Design)
- **Backend:** Node.js (Express.js)
- **Database:** TBD (Planned: MongoDB / PostgreSQL)
- **AI/ML:** (TBD)
- **Hosting:** Render (Backend), Netlify/Vercel (Planned for Frontend)

---

## ✨ Features
✅ Predict crop demand based on **weather** + **historical sales data**  
✅ Suggest **crop rotation schedules** for soil health  
✅ Fetch **live weather data** for accurate forecasts  
✅ **JWT-based** user authentication  
✅ **Admin tools** for managing datasets  
✅ **Responsive farmer dashboard** to view predictions & insights  

---

## 📂 Folder Structure
```

/frontend      → React.js frontend (UI, Axios API calls)
/backend       → Node.js + Express.js API
TBD

````

---

## 💻 Local Setup Instructions

### **Prerequisites**
- Node.js **v14+**
- npm
- *(Optional)* Python **3.8+** for AI/ML

### **Installation & Run**
```bash
# Clone the repository
git clone https://github.com/<your-repo>.git
cd AnnData-SnackOverflow

# Install backend dependencies
cd backend
npm install

# Run backend
npm start

# Install frontend dependencies
cd ../frontend
npm install

# Run frontend
npm start
````

---

## 🧪 Testing the API

**Health Check Endpoint**

```http
GET /health
Response: { "status": "OK", "message": "AnnData API is running" }
```

**Swagger Documentation**

* Local: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
* Live: [https://ann-data-api.onrender.com/api-docs](https://ann-data-api.onrender.com/api-docs)

---

## 📅 Future Plans

* 🚜 Deploy frontend UI for farmers
* 🤖 Integrate AI/ML crop rotation model
* 🛒 Add marketplace module for agri suppliers

---
