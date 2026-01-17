# Quick Start Guide - Fashify Integration

## Prerequisites

- Node.js (v18 or higher recommended)
- MongoDB (local or cloud instance)
- npm or yarn

## Setup Steps

### 1. Backend Setup

```bash
cd BackEnd
npm install
```

Create a `.env` file in the `BackEnd` directory:

```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8080
MONGODB_URI=mongodb://localhost:27017/fashify
NANO_BANANO_API_URL=https://api.nanobanano.com
```

Start the backend:

```bash
npm run dev
```

The backend will run on `http://localhost:3000`

### 2. Frontend Setup

```bash
cd FrontEnd
npm install
```

Ensure your `.env` file in the `FrontEnd` directory includes:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-key
VITE_API_BASE_URL=http://localhost:3000
```

Start the frontend:

```bash
npm run dev
```

The frontend will run on `http://localhost:8080`

### 3. Verify Integration

1. Open `http://localhost:8080` in your browser
2. Sign up or log in
3. Complete the onboarding process
4. View outfit suggestions from the backend API

## Testing the Integration

### Backend Health Check

```bash
curl http://localhost:3000/health
```

Should return:
```json
{"status":"ok","message":"Fashify API is running"}
```

### Frontend-Backend Communication

1. Complete onboarding in the frontend
2. Check backend console for API requests
3. Verify wardrobe suggestions are displayed

## Troubleshooting

- **Backend won't start**: Check MongoDB is running and `MONGODB_URI` is correct
- **CORS errors**: Verify `FRONTEND_URL` in backend `.env` matches frontend URL
- **API calls failing**: Check `VITE_API_BASE_URL` in frontend `.env` matches backend URL
- **TypeScript errors**: Run `npm run build` in both directories to check for errors

## Architecture

- **Frontend**: React + TypeScript + Vite (port 8080)
- **Backend**: Express + TypeScript + MongoDB (port 3000)
- **Auth**: Supabase (email/password)
- **Data**: MongoDB (user profiles and preferences)

For detailed integration information, see `INTEGRATION.md`
