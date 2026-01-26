# Try-On API Testing Guide

## Overview
The Try-On API endpoint requires authentication and uses the JWT token to extract the `user_id`. This guide shows you how to test it.

## How Authentication Works

1. **Sign Up or Sign In** → Get JWT token
2. **Token contains `userId`** → Extracted by `authenticate` middleware
3. **Token sent in Authorization header** → `Bearer <token>`

The `authenticate` middleware automatically extracts `userId` from the token and attaches it to `req.user.id`.

## Step-by-Step Testing

### Step 1: Sign Up (or Sign In if user exists)

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

**Response:**
```json
{
  "message": "Account created successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "test@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Save the token!** You'll need it for subsequent requests.

### Step 2: Upload Photo

```bash
curl -X POST http://localhost:3000/api/upload/photo \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "photo=@/path/to/your/photo.jpg"
```

**Response:**
```json
{
  "photo_url": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "message": "Photo uploaded successfully"
}
```

### Step 3: Complete Onboarding (Save Photo to Profile)

```bash
curl -X POST http://localhost:3000/api/onboarding \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Test User",
    "gender": "male",
    "photo_url": "PASTE_PHOTO_URL_FROM_STEP_2"
  }'
```

### Step 4: Test Try-On Endpoint

```bash
curl -X POST http://localhost:3000/api/tryon \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "baseUpperStyleId": "29066024",
    "outerUpperStyleId": "11846940",
    "bottomsStyleId": "25756782",
    "footwearStyleId": "15335816"
  }'
```

**Response:**
```json
{
  "success": true,
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "message": "Try-on image generated successfully"
}
```

## Complete Example (All Steps in One)

Replace `YOUR_TOKEN` with the token from Step 1:

```bash
# Set your token
TOKEN="YOUR_TOKEN_HERE"

# Test Try-On (assuming profile and photo are already set up)
curl -X POST http://localhost:3000/api/tryon \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "baseUpperStyleId": "29066024",
    "outerUpperStyleId": "11846940",
    "bottomsStyleId": "25756782",
    "footwearStyleId": "15335816"
  }'
```

## Testing with Postman

### 1. Create a new POST request
- **URL:** `http://localhost:3000/api/tryon`
- **Method:** POST

### 2. Set Headers
- **Content-Type:** `application/json`
- **Authorization:** `Bearer YOUR_TOKEN_HERE`

### 3. Set Body (raw JSON)
```json
{
  "baseUpperStyleId": "29066024",
  "outerUpperStyleId": "11846940",
  "bottomsStyleId": "25756782",
  "footwearStyleId": "15335816"
}
```

### 4. Send Request

## Available StyleIds (from your inventory)

- **Shirts:** 29066024, 35888507, 17357388, 22010638, 24681706, 34885700, 24842568, 24842554, 25942874, 31014875
- **Jackets:** 11846940, 26146744, 28641796, 31162118, 33187095, 33570152, 38545169, 31282156, 31400852
- **Jeans/Bottoms:** 25756782, 27367934, 20412344, 27368004, 32899457, 34142519, 32319573, 30195759, 32250283, 31685380, 31805304, 36328274, 33026384, 37666546
- **Shoes:** 15335816, 27258244, 36341298, 31913889, 37198995

## Troubleshooting

### Error: "Unauthorized"
- Make sure you're sending the token in the Authorization header
- Format: `Authorization: Bearer <token>`
- Check if token is expired (tokens typically expire after 24 hours)

### Error: "Profile not found"
- Complete onboarding first: `POST /api/onboarding`
- Make sure you've uploaded a photo

### Error: "No photo uploaded"
- Upload a photo first: `POST /api/upload/photo`
- Then save it to profile via onboarding

### Error: "Invalid styleIds"
- Make sure the styleIds exist in your inventory CSV
- Check that images exist in `inventory-mappings/default-images/{styleId}.jpg`

## Quick Test Script

Run the provided test script:
```bash
cd Backend
./test-tryon.sh
```

Or manually test with the curl commands above.
