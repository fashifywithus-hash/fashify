# Frontend-Backend Integration Guide

This document describes how the Frontend and Backend are integrated in the Fashify application.

## Architecture Overview

The application uses a hybrid approach:
- **Supabase**: Used for authentication (email/password)
- **Backend API**: Used for personal information storage and outfit suggestions
- **MongoDB**: Backend database for user data

## Environment Variables

### Frontend (.env in FrontEnd directory)

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key

# Backend API Configuration
VITE_API_BASE_URL=http://localhost:3000
```

### Backend (.env in BackEnd directory)

```env
# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8080

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/fashify

# Nano Banano API Configuration (for outfit suggestions)
NANO_BANANO_API_URL=https://api.nanobanano.com
```

## API Integration

### API Client

The frontend uses an API client located at `FrontEnd/src/lib/api.ts` that handles all backend communication.

### Authentication Flow

1. User signs up/logs in via Supabase (email/password)
2. On onboarding completion, a backend user is created (using phone number derived from email or generated)
3. Backend user ID is stored in localStorage for subsequent API calls

### Onboarding Flow

1. User completes onboarding steps (name, gender, preferences, photo)
2. Data is sent to backend API at `/api/user/personal-info`
3. Backend processes the data and returns wardrobe suggestions
4. Data is also saved to Supabase for compatibility

### API Endpoints Used

#### Authentication
- `POST /api/auth/signup` - Sign up or login (uses phone number)

#### User Information
- `POST /api/user/personal-info` - Update personal info and get wardrobe suggestions
- `POST /api/user/get-personal-info` - Get user's personal information

## Running the Application

### 1. Start Backend

```bash
cd BackEnd
npm install
npm run dev
```

The backend will run on `http://localhost:3000`

### 2. Start Frontend

```bash
cd FrontEnd
npm install
npm run dev
```

The frontend will run on `http://localhost:8080`

### 3. Ensure MongoDB is Running

Make sure MongoDB is running locally or update `MONGODB_URI` in backend `.env` to point to your MongoDB instance.

## CORS Configuration

The backend is configured to allow requests from the frontend origin (`http://localhost:8080` by default). Update `FRONTEND_URL` in backend `.env` if your frontend runs on a different port.

## Data Flow

1. **Signup/Login**: User authenticates with Supabase
2. **Onboarding**: 
   - User completes onboarding form
   - Photo is converted to base64
   - Data is sent to backend API
   - Backend processes and returns wardrobe suggestions
   - Data is also saved to Supabase
3. **Suggestions**: 
   - Wardrobe suggestions from backend are displayed
   - User can refresh to get new suggestions

## Troubleshooting

### Backend not connecting
- Check if MongoDB is running
- Verify `MONGODB_URI` in backend `.env`
- Check backend logs for connection errors

### CORS errors
- Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check browser console for CORS error details

### API requests failing
- Verify `VITE_API_BASE_URL` in frontend `.env` matches backend URL
- Check backend is running and accessible
- Review network tab in browser dev tools

### Photo upload issues
- Ensure photo is converted to base64 format
- Check photo size (backend may have size limits)
- Verify backend image validation is passing
