# Fashify Backend API

Express.js backend server for Fashify application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Fill in your Supabase credentials in `.env`:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for admin operations)

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## API Endpoints

### Authentication

#### POST /api/auth/signup
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Account created successfully",
  "user": {
    "id": "user-id",
    "email": "user@example.com"
  },
  "session": { ... }
}
```

#### POST /api/auth/signin
Sign in an existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Signed in successfully",
  "user": {
    "id": "user-id",
    "email": "user@example.com"
  },
  "session": { ... }
}
```

#### POST /api/auth/signout
Sign out the current user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Signed out successfully"
}
```

#### GET /api/auth/me
Get current user information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "created_at": "2025-01-18T..."
  }
}
```

### Onboarding

#### POST /api/onboarding
Save or update user profile/onboarding data.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "John Doe",
  "gender": "male",
  "weather_preference": 50,
  "lifestyle": "casual",
  "body_type": "average",
  "height": 175,
  "skin_tone": 50,
  "preferred_styles": ["streetwear", "minimal"],
  "photo_url": "https://example.com/photo.jpg"
}
```

**Response:**
```json
{
  "message": "Profile created successfully",
  "profile": { ... }
}
```

#### GET /api/onboarding
Get user profile/onboarding data.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "profile": {
    "id": "profile-id",
    "user_id": "user-id",
    "name": "John Doe",
    "gender": "male",
    ...
  }
}
```

## Health Check

#### GET /health
Check if the server is running.

**Response:**
```json
{
  "status": "ok",
  "message": "Fashify Backend API is running"
}
```
