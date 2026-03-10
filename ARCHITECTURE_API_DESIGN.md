---
title: Fashify API Design
description: Explicit API contracts that support the Fashify high-level architecture.
---

# Fashify API Design

This document defines the REST APIs that implement the high-level design described in the Fashify architecture plan. It focuses on:

- Authentication
- User profile (onboarding data)
- Photo upload
- Outfit recommendations

Unless otherwise noted:

- Base URL is `/api`.
- All JSON responses use snake_case keys.
- Authenticated routes require `Authorization: Bearer <token>` in the request header.

## 1. Auth API

### 1.1 Sign Up

- **Endpoint**: `POST /api/auth/signup`
- **Auth**: Public
- **Purpose**: Create a new user account and initial auth token.

**Request body**

```json
{
  "email": "user@example.com",
  "password": "string(min 8 chars)",
  "name": "Jane Doe"
}
```

**Response 201**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Jane Doe"
  },
  "token": "jwt-or-session-token"
}
```

### 1.2 Login

- **Endpoint**: `POST /api/auth/login`
- **Auth**: Public
- **Purpose**: Log in an existing user and return an auth token.

**Request body**

```json
{
  "email": "user@example.com",
  "password": "string"
}
```

**Response 200**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Jane Doe"
  },
  "token": "jwt-or-session-token"
}
```

### 1.3 Get Current User

- **Endpoint**: `GET /api/auth/me`
- **Auth**: Required
- **Purpose**: Fetch the currently authenticated user (used by `useAuth` on the frontend).

**Response 200**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Jane Doe",
    "has_completed_onboarding": true
  }
}
```

## 2. Profile API

Profile APIs store the onboarding data that feeds into the `UserPreferences` type used by the `ScoringEngine`.

### 2.1 Upsert Current User Profile

- **Endpoint**: `PUT /api/profile/me`
- **Auth**: Required
- **Purpose**: Create or update the current user’s style profile from the onboarding flow.

**Request body**

Matches what `Onboarding.tsx` prepares as `profileData`:

```json
{
  "name": "Jane",
  "gender": "female",
  "weather_preference": 60,
  "lifestyle": "casual",
  "body_type": "athletic",
  "height": 168,
  "skin_tone": 45,
  "preferred_styles": ["minimal", "streetwear"],
  "photo_url": "https://cdn.example.com/photos/user-123.jpg"
}
```

- `weather_preference`: Number from 0–100 (slider).
- `skin_tone`: Number from 0–100 (slider).
- `preferred_styles`: One or more free-form style tags selected by the user.

**Response 200**

```json
{
  "profile": {
    "user_id": "uuid",
    "name": "Jane",
    "gender": "female",
    "weather_preference": 60,
    "lifestyle": "casual",
    "body_type": "athletic",
    "height": 168,
    "skin_tone": 45,
    "preferred_styles": ["minimal", "streetwear"],
    "photo_url": "https://cdn.example.com/photos/user-123.jpg",
    "updated_at": "2025-03-08T12:00:00Z"
  }
}
```

### 2.2 Get Current User Profile

- **Endpoint**: `GET /api/profile/me`
- **Auth**: Required
- **Purpose**: Retrieve the current user’s profile to prefill onboarding or power the recommendation engine.

**Response 200**

```json
{
  "profile": {
    "user_id": "uuid",
    "name": "Jane",
    "gender": "female",
    "weather_preference": 60,
    "lifestyle": "casual",
    "body_type": "athletic",
    "height": 168,
    "skin_tone": 45,
    "preferred_styles": ["minimal", "streetwear"],
    "photo_url": "https://cdn.example.com/photos/user-123.jpg",
    "created_at": "2025-03-01T12:00:00Z",
    "updated_at": "2025-03-08T12:00:00Z"
  }
}
```

## 3. Photo Upload API

The photo upload endpoint is used by the frontend `uploadService.uploadPhoto(File)` call from the onboarding flow.

### 3.1 Upload Profile Photo

- **Endpoint**: `POST /api/uploads/photo`
- **Auth**: Required
- **Content-Type**: `multipart/form-data`
- **Purpose**: Upload a single front-facing photo and return a CDN URL.

**Form fields**

- `photo`: Required. JPEG/PNG image file.

**Response 201**

```json
{
  "photo_url": "https://cdn.example.com/photos/user-123.jpg"
}
```

**Validation & constraints**

- Max size: e.g. 5 MB (configurable).
- Allowed types: `image/jpeg`, `image/png`.
- The backend should store the file in secure object storage and return a public or signed URL, depending on privacy requirements.

## 4. Recommendation API

Recommendation endpoints orchestrate `ProfileService`, `InventoryService`, and `ScoringEngine`.

### 4.1 Get Recommended Items for Current User

- **Endpoint**: `GET /api/recommendations`
- **Auth**: Required
- **Query params**:
  - `limit` (optional, default `20`, max `100`): number of items to return.

**Behavior**

1. Resolve user from auth token.
2. Load `UserPreferences` derived from the current user profile.
3. Fetch candidate `InventoryItem`s from the inventory store.
4. Score all items via `ScoringEngine.scoreItems`.
5. Return top `limit` scored items.

**Response 200**

```json
{
  "items": [
    {
      "id": "item-001",
      "name": "Slim Fit Oxford Shirt",
      "brand": "Acme",
      "gender": "male",
      "price": 59.99,
      "images": ["https://cdn.example.com/items/item-001-front.jpg"],
      "weather_min": 2,
      "weather_max": 4,
      "lifestyle_tags": ["casual", "smart-casual"],
      "body_type_fit": "athletic",
      "style_tags": ["minimal", "smart-casual"],
      "skin_undertone": "neutral",
      "score": 0.87,
      "match_details": {
        "genderMatch": 1.0,
        "weatherMatch": 0.9,
        "lifestyleMatch": 1.0,
        "bodyTypeMatch": 1.0,
        "styleMatch": 0.8,
        "skinToneMatch": 0.7
      }
    }
  ]
}
```

- Field names mirror the `InventoryItem` and `ScoredItem` types used by `ScoringEngine`, but converted to snake_case for JSON.

### 4.2 Optional: Item Detail

- **Endpoint**: `GET /api/items/:id`
- **Auth**: Optional (depends on product decision)
- **Purpose**: Fetch full details of a single item, independent of personalization.

**Response 200**

```json
{
  "item": {
    "id": "item-001",
    "name": "Slim Fit Oxford Shirt",
    "brand": "Acme",
    "description": "A versatile slim fit shirt suitable for smart-casual occasions.",
    "gender": "male",
    "price": 59.99,
    "currency": "USD",
    "images": [
      "https://cdn.example.com/items/item-001-front.jpg",
      "https://cdn.example.com/items/item-001-back.jpg"
    ],
    "available_sizes": ["S", "M", "L", "XL"],
    "weather_min": 2,
    "weather_max": 4,
    "lifestyle_tags": ["casual", "smart-casual"],
    "body_type_fit": "athletic",
    "style_tags": ["minimal", "smart-casual"],
    "skin_undertone": "neutral"
  }
}
```

## 5. Mapping to ScoringEngine Types

On the backend, the Profile and Inventory data are normalized into the internal TypeScript types used by `ScoringEngine`:

- **From Profile → `UserPreferences`**
  - `gender` → `preferences.gender`
  - `weather_preference` (0–100) → converted to 1–5 scale inside `matchWeather`.
  - `lifestyle` → `preferences.lifestyle`
  - `body_type` → `preferences.bodyType`
  - `height` → `preferences.height`
  - `skin_tone` (0–100) → mapped to `cool` / `neutral` / `warm` undertone in `matchSkinTone`.
  - `preferred_styles` → `preferences.styles`

- **From Inventory → `InventoryItem`**
  - `gender` → `item.gender`
  - `weather_min` / `weather_max` → `item.weatherMin` / `item.weatherMax`
  - `lifestyle_tags` → `item.lifestyleTags`
  - `body_type_fit` → `item.bodyTypeFit`
  - `style_tags` → `item.styleTags`
  - `skin_undertone` → `item.skinUndertone`

These mappings keep the public API stable while allowing the internals of `ScoringEngine` to evolve (e.g., new match functions, weight tuning) without breaking clients.

## 6. Error Handling (Shared)

- **Validation errors**: `422 Unprocessable Entity`

```json
{
  "error": "validation_error",
  "message": "One or more fields are invalid.",
  "details": {
    "email": "must be a valid email address"
  }
}
```

- **Authentication errors**: `401 Unauthorized`

```json
{
  "error": "unauthorized",
  "message": "Missing or invalid authentication token."
}
```

- **Authorization errors**: `403 Forbidden`

```json
{
  "error": "forbidden",
  "message": "You do not have access to this resource."
}
```

- **Not found**: `404 Not Found`

```json
{
  "error": "not_found",
  "message": "Resource not found."
}
```

- **Server errors**: `500 Internal Server Error`

```json
{
  "error": "server_error",
  "message": "An unexpected error occurred. Please try again later."
}
```

