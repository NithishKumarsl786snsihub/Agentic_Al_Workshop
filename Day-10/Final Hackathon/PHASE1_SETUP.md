# 🚀 Phase 1: Authentication System Setup Guide

## Overview
This guide will help you set up the authentication system with MongoDB, JWT tokens, and professional UI for the Voice Website Generator platform.

## 🛠️ Prerequisites

### Required Software
- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **MongoDB** (v5.0 or higher)
- **Git**

### Install MongoDB

#### Windows
```bash
# Download MongoDB Community Server from https://www.mongodb.com/try/download/community
# Or use Chocolatey
choco install mongodb

# Start MongoDB
mongod --dbpath C:\data\db
```

#### macOS
```bash
# Using Homebrew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux (Ubuntu/Debian)
```bash
# Import MongoDB GPG Key
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

## 🔧 Backend Setup

### 1. Install Dependencies
```bash
cd "Day-10/Final Hackathon/backend"
pip install -r requirements.txt
```

### 2. Environment Configuration
```bash
# Copy environment template
cp env_example .env

# Edit .env file with your settings
nano .env
```

**Required Environment Variables:**
```env
# API Keys
GEMINI_API_KEY=your_gemini_api_key_here

# MongoDB Configuration
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=voice_website_generator

# JWT Authentication
SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Server Configuration
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
HOST=localhost
PORT=8000
```

### 3. Start Backend Server
```bash
# Development mode
python main.py

# Or using uvicorn directly
uvicorn main:app --host localhost --port 8000 --reload
```

## 🎨 Frontend Setup

### 1. Install Dependencies
```bash
cd "Day-10/Final Hackathon/frontend"
npm install
```

### 2. Environment Configuration
```bash
# Copy environment template
cp env_local_example .env.local

# Edit .env.local file
nano .env.local
```

**Required Environment Variables:**
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Application Configuration
NEXT_PUBLIC_APP_NAME="Voice Website Generator"
NEXT_PUBLIC_APP_DESCRIPTION="AI-Powered Website Creation with Voice Commands"
```

### 3. Start Frontend Server
```bash
# Development mode
npm run dev
```

## 🧪 Testing the Authentication System

### 1. Verify Backend API
```bash
# Check if backend is running
curl http://localhost:8000

# Expected response:
{
  "message": "Voice Website Generator API with Authentication & LangGraph Agents",
  "version": "2.0.0",
  "authentication": "✅ Enabled",
  "database": "✅ MongoDB Connected"
}
```

### 2. Test User Registration
```bash
# Register a new user
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123",
    "full_name": "Test User"
  }'
```

### 3. Test User Login
```bash
# Login with credentials
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 4. Frontend Testing

1. **Open the frontend**: Navigate to `http://localhost:3000`
2. **Register a new account**: Go to `/auth/register`
3. **Login**: Go to `/auth/login`
4. **Access dashboard**: After login, you should be redirected to `/dashboard`
5. **Logout**: Use the logout button in the dashboard

## 🔍 Database Verification

### Connect to MongoDB and check data:
```bash
# Connect to MongoDB shell
mongo

# Switch to the database
use voice_website_generator

# Check users collection
db.users.find().pretty()

# Check indexes
db.users.getIndexes()
```

## 📱 Features Implemented

### Backend Features
- ✅ **MongoDB Connection** - Full database integration
- ✅ **User Registration** - Secure user creation with validation
- ✅ **User Authentication** - JWT-based login system
- ✅ **Password Security** - Bcrypt hashing
- ✅ **Token Management** - Access and refresh tokens
- ✅ **API Endpoints** - Complete REST API for auth
- ✅ **Database Indexes** - Optimized for performance

### Frontend Features
- ✅ **Professional UI** - Matches existing design system
- ✅ **Login Page** - Clean, responsive login interface
- ✅ **Register Page** - Comprehensive registration form
- ✅ **Dashboard** - User-centric dashboard layout
- ✅ **Authentication Context** - React state management
- ✅ **Protected Routes** - Route-level authentication
- ✅ **Token Management** - Automatic token refresh

### Security Features
- ✅ **Password Validation** - Client and server-side validation
- ✅ **JWT Security** - Secure token generation and validation
- ✅ **CORS Protection** - Proper cross-origin handling
- ✅ **Input Sanitization** - Prevents common attacks
- ✅ **Unique Constraints** - Email and username uniqueness

## 🐛 Troubleshooting

### Common Issues

#### MongoDB Connection Error
```
Solution: Ensure MongoDB is running and accessible
- Check MongoDB service: systemctl status mongod (Linux) or Task Manager (Windows)
- Verify connection string in .env file
```

#### JWT Token Issues
```
Solution: Check SECRET_KEY configuration
- Ensure SECRET_KEY is set in .env
- Verify token expiration settings
```

#### CORS Errors
```
Solution: Check CORS configuration
- Verify FRONTEND_URL in backend .env
- Ensure CORS_ORIGINS includes your frontend URL
```

#### Frontend Build Errors
```
Solution: Check dependencies and environment
- Run: npm install
- Verify .env.local configuration
- Check TypeScript errors: npm run lint
```

## 🔄 Next Steps (Phase 2)

After completing Phase 1, you'll be ready for:
- **Vivvie Voice Assistant** - Floating AI assistant
- **Project Management** - User project persistence
- **Advanced Dashboard** - Project history and management
- **File Upload System** - HTML file import functionality
- **Voice Command History** - Conversation logging

## 📞 Support

If you encounter issues:
1. Check the console logs (both frontend and backend)
2. Verify all environment variables are set correctly
3. Ensure MongoDB is running and accessible
4. Test API endpoints directly with curl/Postman

## 🎉 Success Criteria

You've successfully completed Phase 1 when:
- ✅ Backend API returns authentication status
- ✅ Users can register and login via UI
- ✅ Dashboard loads for authenticated users
- ✅ MongoDB stores user data correctly
- ✅ JWT tokens work for protected routes
- ✅ Logout functionality works properly

**Ready for the next phase? Let's build Vivvie! 🎤✨** 