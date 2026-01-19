# Fashify - AI-Powered Fashion Recommendation System

A full-stack fashion recommendation platform that matches clothing items from inventory with user preferences using a sophisticated scoring algorithm.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [System Flow](#system-flow)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Data Flow & Communication](#data-flow--communication)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Authentication Flow](#authentication-flow)
- [Recommendation Engine](#recommendation-engine)
- [Setup Instructions](#setup-instructions)

---

## 🏗️ Architecture Overview

Fashify follows a **client-server architecture** with clear separation between frontend and backend:

```
┌─────────────────┐         HTTP/REST API         ┌─────────────────┐
│                 │◄──────────────────────────────►│                 │
│   Frontend      │    (JWT Authentication)        │    Backend      │
│   (React/Vite)  │                                │  (Node/Express) │
│   Port: 8080    │                                │   Port: 3000    │
└─────────────────┘                                └─────────────────┘
                                                           │
                                                           ▼
                                                    ┌─────────────────┐
                                                    │    MongoDB      │
                                                    │   Database      │
                                                    └─────────────────┘
```

### Technology Stack

**Frontend:**
- React 18 + TypeScript
- Vite (Build tool)
- React Router (Navigation)
- Framer Motion (Animations)
- Tailwind CSS + shadcn/ui (Styling)
- Axios/Fetch (API calls)

**Backend:**
- Node.js + Express
- TypeScript
- MongoDB + Mongoose (Database)
- JWT (Authentication)
- CSV Parser (Inventory loading)

---

## 🔄 System Flow

### High-Level User Journey

```
1. User Registration/Login
   ↓
2. Onboarding Flow (9 steps)
   ├─ Name
   ├─ Gender
   ├─ Weather Preference
   ├─ Lifestyle
   ├─ Body Type
   ├─ Height
   ├─ Skin Tone
   ├─ Style Preferences
   └─ Photo Upload
   ↓
3. Profile Saved to Database
   ↓
4. Recommendations Generated
   ├─ Load Inventory (CSV)
   ├─ Score Items (Scoring Engine)
   └─ Return Top 4 per Category
   ↓
5. Display Recommendations
   └─ Show Product Images with Carousel
```

---

## 🎨 Frontend Architecture

### Directory Structure

```
FrontEnd/
├── src/
│   ├── pages/              # Page components
│   │   ├── Landing.tsx      # Landing page
│   │   ├── Login.tsx        # Login page
│   │   ├── Signup.tsx       # Signup page
│   │   ├── Onboarding.tsx   # Multi-step onboarding
│   │   └── Suggestions.tsx  # Recommendations display
│   │
│   ├── components/          # Reusable components
│   │   ├── onboarding/     # Onboarding step components
│   │   ├── recommendations/# Recommendation display components
│   │   └── ui/             # shadcn/ui components
│   │
│   ├── services/           # API service layer
│   │   ├── profileService.ts      # Profile CRUD operations
│   │   └── recommendationService.ts # Recommendation fetching
│   │
│   ├── hooks/              # Custom React hooks
│   │   └── useAuth.tsx     # Authentication context
│   │
│   ├── config/             # Configuration
│   │   └── api.ts          # API client setup
│   │
│   └── lib/                # Utilities
│       ├── imageLoader.ts  # Image loading logic
│       └── utils.ts        # Helper functions
│
└── public/
    └── Backend/
        ├── images/         # Product images (by styleId)
        └── images-manifest.json # Image mapping
```

### Frontend Flow

#### 1. **Authentication Flow**
```typescript
// User signs up/logs in
apiClient.post("/api/auth/signup", { email, password })
  → Backend creates user in MongoDB
  → Backend returns JWT token
  → Frontend stores token in localStorage
  → Token included in all subsequent requests
```

#### 2. **Onboarding Flow**
```typescript
// User completes onboarding steps
Onboarding.tsx collects data:
  - name, gender, weather, lifestyle, bodyType, height, skinTone, styles, photo

// On final step:
profileService.saveProfile(profileData)
  → POST /api/onboarding
  → Backend saves to MongoDB Profile collection
  → Navigate to /suggestions
```

#### 3. **Recommendations Flow**
```typescript
// User views recommendations
recommendationService.getRecommendations()
  → POST /api/recommendations (with JWT token)
  → Backend:
     1. Extracts userId from JWT token
     2. Fetches user profile from MongoDB
     3. Loads inventory from CSV
     4. Scores all items using ScoringEngine
     5. Returns top 4 items per category
  → Frontend displays recommendations with images
```

---

## ⚙️ Backend Architecture

### Directory Structure

```
Backend/
├── src/
│   ├── server.ts           # Express app entry point
│   │
│   ├── routes/             # API route handlers
│   │   ├── auth.ts         # Authentication endpoints
│   │   ├── onboarding.ts   # Profile CRUD endpoints
│   │   ├── recommendations.ts # Recommendation endpoint
│   │   └── upload.ts       # Image upload endpoint
│   │
│   ├── models/             # MongoDB schemas
│   │   ├── User.ts         # User model (email, password)
│   │   └── Profile.ts      # Profile model (preferences)
│   │
│   ├── middleware/         # Express middleware
│   │   ├── auth.ts         # JWT authentication
│   │   └── logger.ts       # Request logging
│   │
│   ├── config/             # Configuration
│   │   ├── database.ts     # MongoDB connection
│   │   └── jwt.ts          # JWT token generation/verification
│   │
│   └── types/              # TypeScript types
│       └── inventory.ts   # Inventory item types
│
├── core/                   # Core business logic
│   ├── csvParser.ts        # CSV parsing utility
│   └── scoringEngine.ts    # Scoring algorithm
│
├── services/               # Business services
│   └── recommendationService.ts # Recommendation orchestration
│
└── Item-attributes.csv     # Product inventory data
```

### Backend Flow

#### 1. **Server Initialization**
```typescript
server.ts:
  1. Load environment variables (.env)
  2. Connect to MongoDB
  3. Setup Express middleware (CORS, JSON parsing)
  4. Register routes
  5. Start listening on port 3000
```

#### 2. **Request Processing**
```
HTTP Request
  ↓
CORS Middleware (allows frontend origin)
  ↓
JSON Body Parser (50MB limit for images)
  ↓
Route Handler
  ↓
Authentication Middleware (if protected route)
  ├─ Extract JWT token from Authorization header
  ├─ Verify token signature
  ├─ Extract userId from token
  └─ Attach user info to req.user
  ↓
Business Logic
  ↓
Database Operations (MongoDB)
  ↓
Response (JSON)
```

---

## 🔌 Data Flow & Communication

### Frontend ↔ Backend Communication

#### API Client Setup (`FrontEnd/src/config/api.ts`)

```typescript
// Centralized API client
const API_BASE_URL = "http://localhost:3000"

// All requests include:
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer <JWT_TOKEN>"  // For protected routes
}
```

#### Data Transfer Format

**Request Format:**
```json
POST /api/onboarding
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
Body: {
  "name": "John Doe",
  "gender": "male",
  "weather_preference": 50,
  "lifestyle": "casual",
  "body_type": "average",
  "height": 175,
  "skin_tone": 50,
  "preferred_styles": ["casual", "classic"],
  "photo_url": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response Format:**
```json
{
  "message": "Profile created successfully",
  "profile": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "user_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "John Doe",
    "gender": "male",
    ...
    "createdAt": "2025-01-18T12:00:00.000Z",
    "updatedAt": "2025-01-18T12:00:00.000Z"
  }
}
```

### Complete Data Flow Example: Getting Recommendations

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND: Suggestions.tsx                                       │
└─────────────────────────────────────────────────────────────────┘
                    │
                    │ 1. User navigates to /suggestions
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ recommendationService.getRecommendations()                       │
│   → POST /api/recommendations                                    │
│   → Headers: { Authorization: "Bearer <token>" }                │
└─────────────────────────────────────────────────────────────────┘
                    │
                    │ HTTP POST Request
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND: routes/recommendations.ts                               │
│   1. authenticate middleware extracts userId from JWT token     │
│   2. Profile.findOne({ user_id: userId })                        │
└─────────────────────────────────────────────────────────────────┘
                    │
                    │ MongoDB Query
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ MongoDB Database                                                 │
│   Collection: profiles                                           │
│   Document: {                                                    │
│     user_id: ObjectId("..."),                                    │
│     gender: "male",                                              │
│     weather_preference: 50,                                      │
│     lifestyle: "casual",                                         │
│     ...                                                          │
│   }                                                              │
└─────────────────────────────────────────────────────────────────┘
                    │
                    │ Profile Data Returned
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND: routes/recommendations.ts                               │
│   3. Convert profile → UserPreferences                           │
│   4. recommendationService.getRecommendations(preferences)        │
└─────────────────────────────────────────────────────────────────┘
                    │
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND: services/recommendationService.ts                       │
│   1. Load inventory from CSV (cached)                            │
│   2. scoringEngine.scoreItems(inventory, preferences)            │
└─────────────────────────────────────────────────────────────────┘
                    │
                    │ Scoring Algorithm
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND: core/scoringEngine.ts                                   │
│   For each item:                                                 │
│     - Calculate gender match (1.0 weight)                       │
│     - Calculate weather match (0.25 weight)                     │
│     - Calculate lifestyle match (0.20 weight)                   │
│     - Calculate body type match (0.15 weight)                    │
│     - Calculate style match (0.25 weight)                        │
│     - Calculate skin tone match (0.15 weight)                    │
│     - Total score = weighted sum                                │
│   Sort by score (descending)                                     │
└─────────────────────────────────────────────────────────────────┘
                    │
                    │ Scored Items Array
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND: services/recommendationService.ts                       │
│   3. Filter by category:                                         │
│      - shirts: top 4 matching "tshirt" or "shirt"              │
│      - jackets: top 4 matching "jacket", "hoodie", etc.         │
│      - jeans: top 4 matching "jean", "pant", etc.               │
│      - shoes: top 4 matching "shoe", "sneaker", etc.            │
└─────────────────────────────────────────────────────────────────┘
                    │
                    │ RecommendationResult
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND: routes/recommendations.ts                               │
│   5. Return JSON response:                                        │
│      {                                                            │
│        recommendations: {                                        │
│          shirts: [...],                                          │
│          jackets: [...],                                          │
│          jeans: [...],                                            │
│          shoes: [...]                                            │
│        }                                                          │
│      }                                                            │
└─────────────────────────────────────────────────────────────────┘
                    │
                    │ HTTP Response
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND: Suggestions.tsx                                        │
│   1. Receive recommendations                                     │
│   2. Render CategorySection components                           │
│   3. Each category shows RecommendationCard components            │
│   4. ProductImageCarousel loads images from:                     │
│      /Backend/images/{styleId}/*.jpg                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### MongoDB Collections

#### 1. **Users Collection**

```typescript
{
  _id: ObjectId,              // MongoDB auto-generated ID
  email: String,               // Unique, lowercase, validated
  password: String,            // Hashed with bcrypt (not returned by default)
  createdAt: Date,            // Auto-generated timestamp
  updatedAt: Date             // Auto-generated timestamp
}
```

**Indexes:**
- `email` - Unique index

**Password Security:**
- Passwords are hashed using `bcrypt` with salt rounds of 10
- Password comparison uses `bcrypt.compare()`

#### 2. **Profiles Collection**

```typescript
{
  _id: ObjectId,                      // MongoDB auto-generated ID
  user_id: ObjectId,                  // Reference to Users._id (unique)
  name: String | null,                // User's name
  gender: String | null,              // "male" | "female" | "other"
  weather_preference: Number | null,  // 0-100 (0 = extremely cold, 100 = very hot)
  lifestyle: String | null,           // "formal" | "casual" | "athletic"
  body_type: String | null,          // "slim" | "athletic" | "average" | "muscular" | "curvy" | "plus"
  height: Number | null,              // 100-250 (cm)
  skin_tone: Number | null,          // 0-100 (0 = dark, 100 = light)
  preferred_styles: String[],        // ["streetwear", "minimal", "classic", "trendy", "smart-casual", "party"]
  photo_url: String | null,          // Base64 data URL or file URL
  createdAt: Date,                   // Auto-generated timestamp
  updatedAt: Date                    // Auto-generated timestamp
}
```

**Indexes:**
- `user_id` - Unique index (one profile per user)

**Relationships:**
- `user_id` references `Users._id` (one-to-one relationship)

### Data Persistence Flow

#### Saving Profile Data

```
Frontend (Onboarding.tsx)
  ↓
  Collects user input from 9 steps
  ↓
  Converts photo File → Base64 data URL
  ↓
POST /api/onboarding
  Headers: { Authorization: "Bearer <token>" }
  Body: {
    name, gender, weather_preference, lifestyle,
    body_type, height, skin_tone, preferred_styles, photo_url
  }
  ↓
Backend (routes/onboarding.ts)
  ↓
  authenticate middleware extracts userId from token
  ↓
  Validates request body (express-validator)
  ↓
  Checks if profile exists: Profile.findOne({ user_id: userId })
  ↓
  If exists: Profile.findOneAndUpdate({ user_id: userId }, profileData)
  If not: Profile.create(profileData)
  ↓
MongoDB
  ↓
  Saves/updates document in "profiles" collection
  ↓
  Returns saved profile document
  ↓
Frontend receives confirmation and navigates to /suggestions
```

#### Fetching Profile Data

```
Frontend (Suggestions.tsx or Onboarding.tsx)
  ↓
POST /api/onboarding/get
  Headers: { Authorization: "Bearer <token>" }
  ↓
Backend (routes/onboarding.ts)
  ↓
  authenticate middleware extracts userId
  ↓
  Profile.findOne({ user_id: userId })
  ↓
MongoDB Query
  ↓
  Returns profile document or null
  ↓
Frontend receives profile data
```

---

## 🔐 Authentication Flow

### JWT-Based Authentication

#### 1. **User Registration**

```
Frontend: Signup.tsx
  ↓
  User enters email and password
  ↓
POST /api/auth/signup
  Body: { email, password }
  ↓
Backend: routes/auth.ts
  ↓
  1. Validate email format and password length
  2. Check if user exists: User.findOne({ email })
  3. Create new user: new User({ email, password })
  4. Password automatically hashed by Mongoose pre-save hook
  5. Save to MongoDB: user.save()
  6. Generate JWT token: generateToken({ userId: user._id, email })
  ↓
Response: {
  user: { id, email },
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
  ↓
Frontend stores token in localStorage
```

#### 2. **User Login**

```
Frontend: Login.tsx
  ↓
  User enters email and password
  ↓
POST /api/auth/signin
  Body: { email, password }
  ↓
Backend: routes/auth.ts
  ↓
  1. Find user: User.findOne({ email }).select("+password")
  2. Compare password: user.comparePassword(password)
  3. Generate JWT token: generateToken({ userId: user._id, email })
  ↓
Response: {
  user: { id, email },
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
  ↓
Frontend stores token in localStorage
```

#### 3. **Protected Route Access**

```
Frontend makes API request
  ↓
  Includes token: Authorization: "Bearer <token>"
  ↓
Backend: middleware/auth.ts (authenticate)
  ↓
  1. Extract token from Authorization header
  2. Verify token: verifyToken(token)
     - Validates signature using JWT_SECRET
     - Checks expiration
     - Returns { userId, email }
  3. Verify user exists: User.findById(userId)
  4. Attach to request: req.user = { id: userId, email }
  ↓
Route handler can access req.user.id
```

#### 4. **Token Storage**

- **Frontend:** Stored in `localStorage` as `auth_token`
- **Backend:** No token storage (stateless JWT)
- **Token Payload:**
  ```json
  {
    "userId": "65a1b2c3d4e5f6g7h8i9j0k1",
    "email": "user@example.com",
    "iat": 1234567890,
    "exp": 1235173890
  }
  ```

---

## 🎯 Recommendation Engine

### Scoring Algorithm

The recommendation engine uses a **weighted multi-factor matching system**:

#### Scoring Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| **Gender** | 1.0 | Must match (or unisex). Gender mismatches get 10% penalty |
| **Weather** | 0.25 | Converts user slider (0-100) to item scale (1-5). Perfect match = 1.0 |
| **Lifestyle** | 0.20 | Matches formal/casual/athletic. Compatible matches get partial scores |
| **Body Type** | 0.15 | Considers fit compatibility. Similar types get partial scores |
| **Style** | 0.25 | Matches user style preferences. Multiple matches get bonus |
| **Skin Tone** | 0.15 | Undertone matching. Neutral works with both |

#### Score Calculation

```typescript
baseScore = 
  (genderMatch × 1.0) +
  (weatherMatch × 0.25) +
  (lifestyleMatch × 0.20) +
  (bodyTypeMatch × 0.15) +
  (styleMatch × 0.25) +
  (skinToneMatch × 0.15)

finalScore = genderMatch === 0 
  ? baseScore × 0.1  // Heavy penalty for gender mismatch
  : baseScore
```

#### Recommendation Process

```
1. Load Inventory
   └─ Parse CSV file (Backend/Item-attributes.csv)
      └─ Returns: InventoryItem[]

2. Score All Items
   └─ For each item:
      ├─ Calculate match scores for all factors
      ├─ Apply weights
      └─ Generate ScoredItem with total score
   └─ Sort by score (descending)

3. Filter by Category
   └─ Shirts: Filter items matching "tshirt" or "shirt"
   └─ Jackets: Filter items matching "jacket", "hoodie", "sweater", "puffer"
   └─ Jeans: Filter items matching "jean", "pant", "cargo", "trouser"
   └─ Shoes: Filter items matching "shoe", "sneaker", "oxford"

4. Select Top 4
   └─ Take first 4 items from each category (already sorted by score)
   └─ Always returns top 4 if items exist (even with low scores)
```

### Inventory Data Structure

**CSV Format:** `Backend/Item-attributes.csv`

```csv
Description,Category,Type,Color,Item Link,StyleId,Main_Category,Sub_Category,Gender,Base_Color,Color_Family,Weather_Min,Weather_Max,Style_Tags,Lifestyle_Tags,Body_Type_Fit,Skin_Undertone,Formality_Score,Layer_Level
```

**Parsed Structure:**
```typescript
interface InventoryItem {
  description: string;
  category: string;              // "Tshirt/Shirt", "Jacket", "Jeans", "Shoes"
  type: string;                  // "Formal", "Casual", "Semi-formal"
  color: string;
  itemLink: string;              // "myntra.com/29066024"
  styleId: string;               // "29066024" (used for image lookup)
  mainCategory: string;          // "Inner_Top", "Outerwear", "Bottom", "Shoes"
  subCategory: string;           // "Shirt", "Jacket", "Jeans", "Sneakers"
  gender: string;                // "Male", "Female", "Unisex"
  baseColor: string;
  colorFamily: string;
  weatherMin: number;            // 1 = hot, 5 = very cold
  weatherMax: number;            // 1 = hot, 5 = very cold
  styleTags: string[];           // ["Classic", "Smart Casual"]
  lifestyleTags: string[];       // ["Casual", "Formal"]
  bodyTypeFit: string;           // "Average", "Slim", etc.
  skinUndertone: string;         // "Warm", "Cool", "Neutral"
  formalityScore: number;        // 1-10
  layerLevel: number;            // 0 = inner, 1 = outer
}
```

---

## 📡 API Endpoints

### Base URL
```
http://localhost:3000
```

### Authentication Endpoints

#### `POST /api/auth/signup`
Create a new user account.

**Request:**
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
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "email": "user@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### `POST /api/auth/signin`
Sign in an existing user.

**Request:**
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
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "email": "user@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### `POST /api/auth/me`
Get current user information (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "email": "user@example.com",
    "created_at": "2025-01-18T12:00:00.000Z"
  }
}
```

### Profile/Onboarding Endpoints

#### `POST /api/onboarding`
Save or update user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "name": "John Doe",
  "gender": "male",
  "weather_preference": 50,
  "lifestyle": "casual",
  "body_type": "average",
  "height": 175,
  "skin_tone": 50,
  "preferred_styles": ["casual", "classic"],
  "photo_url": "data:image/jpeg;base64,..."
}
```

**Response:**
```json
{
  "message": "Profile created successfully",
  "profile": {
    "_id": "...",
    "user_id": "...",
    "name": "John Doe",
    ...
  }
}
```

#### `POST /api/onboarding/get`
Get user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "profile": {
    "_id": "...",
    "user_id": "...",
    "name": "John Doe",
    ...
  }
}
```

### Recommendations Endpoint

#### `POST /api/recommendations`
Get outfit recommendations based on user's saved profile (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{}
```

**Response:**
```json
{
  "message": "Recommendations generated successfully",
  "recommendations": {
    "shirts": [
      {
        "description": "blue shirt",
        "category": "Tshirt/Shirt",
        "styleId": "29066024",
        "score": 0.85,
        "matchDetails": { ... },
        ...
      },
      ...
    ],
    "jackets": [...],
    "jeans": [...],
    "shoes": [...]
  },
  "preferences": {
    "gender": "male",
    "weather": 50,
    ...
  }
}
```

### Health Check

#### `GET /health`
Check if backend is running.

**Response:**
```json
{
  "status": "ok",
  "message": "Fashify Backend API is running"
}
```

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local or cloud instance)
- Git

### Backend Setup

```bash
# Navigate to backend directory
cd Backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env file with your configuration:
# - MONGODB_URI (e.g., mongodb://localhost:27017/fashify)
# - JWT_SECRET (change to a secure secret, min 32 characters)
# - PORT (default: 3000)
# - FRONTEND_URL (default: http://localhost:8080)

# Start MongoDB (if running locally)
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
# Windows: net start MongoDB

# Run backend server
npm run dev

# Backend will be available at http://localhost:3000
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd FrontEnd

# Install dependencies
npm install

# Create .env file (optional, defaults work for local dev)
# VITE_API_URL=http://localhost:3000

# Generate image manifest (if images are added)
node scripts/generate-image-manifest.js

# Run frontend development server
npm run dev

# Frontend will be available at http://localhost:8080
```

### Running Both Services

**Terminal 1 (Backend):**
```bash
cd Backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd FrontEnd
npm run dev
```

---

## 🔍 Key Design Decisions

### Why JWT Authentication?
- **Stateless:** No server-side session storage needed
- **Scalable:** Works across multiple servers
- **Secure:** Token contains user ID, verified on each request

### Why MongoDB?
- **Flexible Schema:** Profile fields can be optional/null
- **JSON-like Documents:** Natural fit for JavaScript/TypeScript
- **Easy Integration:** Mongoose provides type safety and validation

### Why CSV for Inventory?
- **Simple:** Easy to update without database migrations
- **Version Control:** Can track changes in Git
- **Fast Loading:** Parsed once and cached in memory

### Why Weighted Scoring?
- **Flexible:** Can adjust weights based on user feedback
- **Transparent:** Each factor contributes predictably
- **Extensible:** Easy to add new factors

---

## 📊 Data Flow Summary

### Complete Request-Response Cycle

```
1. User Action (Frontend)
   ↓
2. API Call (apiClient.post/get)
   ├─ Adds Authorization header with JWT token
   ├─ Serializes request body to JSON
   └─ Sends HTTP request to backend
   ↓
3. Backend Receives Request
   ├─ CORS middleware allows request
   ├─ JSON parser extracts body
   └─ Routes to appropriate handler
   ↓
4. Authentication (if protected route)
   ├─ Extracts JWT token from header
   ├─ Verifies token signature
   ├─ Extracts userId from token payload
   └─ Attaches user info to req.user
   ↓
5. Business Logic
   ├─ Validates request data
   ├─ Performs database operations
   ├─ Executes scoring/recommendation logic
   └─ Formats response data
   ↓
6. Database Operations (MongoDB)
   ├─ Create/Read/Update/Delete operations
   ├─ Mongoose handles validation
   └─ Returns documents or confirmation
   ↓
7. Response Sent to Frontend
   ├─ JSON serialization
   ├─ HTTP status code
   └─ Response headers
   ↓
8. Frontend Processes Response
   ├─ Parses JSON
   ├─ Updates UI state
   └─ Renders components
```

---

## 🛠️ Development Workflow

### Adding New Features

1. **Backend:**
   - Add route in `src/routes/`
   - Add model in `src/models/` (if new data structure)
   - Add business logic in `services/` or `core/`
   - Test with `test-api.js`

2. **Frontend:**
   - Add page in `src/pages/`
   - Add service in `src/services/` (for API calls)
   - Add components in `src/components/`
   - Update routing in `src/App.tsx`

### Debugging

**Backend:**
- Check console logs for request/response
- Use MongoDB Compass to inspect database
- Check `Backend/.env` for configuration

**Frontend:**
- Use browser DevTools (F12)
- Check Network tab for API calls
- Check Console for errors and logs
- Check Application tab → Local Storage for token

---

## 📝 Environment Variables

### Backend (.env)

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/fashify

# Server
PORT=3000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:8080

# JWT
JWT_SECRET=your-secret-key-change-in-production-min-32-characters
JWT_EXPIRES_IN=7d
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000
```

---

## 🎨 Image Handling

### Image Storage

- **Location:** `Backend/images/{styleId}/*.jpg`
- **Manifest:** `public/Backend/images-manifest.json`
- **Loading:** Frontend loads images via HTTP from `/Backend/images/`

### Image Flow

```
1. Images stored in Backend/images/{styleId}/
2. Manifest generated: node scripts/generate-image-manifest.js
3. Manifest maps styleId → array of image filenames
4. Frontend loads manifest on first request
5. ProductImageCarousel component:
   - Fetches images for styleId from manifest
   - Displays images in carousel
   - Handles multiple images with navigation
```

---

## 🔒 Security Considerations

1. **Password Hashing:** All passwords hashed with bcrypt (10 salt rounds)
2. **JWT Tokens:** Signed with secret key, includes expiration
3. **CORS:** Restricted to frontend URL only
4. **Input Validation:** Express-validator on all inputs
5. **Error Handling:** Generic error messages in production

---

## 📈 Future Enhancements

- [ ] Image CDN integration
- [ ] Advanced filtering options
- [ ] Outfit combination recommendations
- [ ] User feedback integration for improved scoring
- [ ] Machine learning model for personalized weights
- [ ] Real-time inventory updates
- [ ] Multi-language support

---

## 📄 License

This project is private and proprietary.

---

**Built with ❤️ using React, Node.js, TypeScript, and MongoDB**
