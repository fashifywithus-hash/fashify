#!/bin/bash

# Test script for Try-On API endpoint
# This script demonstrates how to test the try-on endpoint

BASE_URL="http://localhost:3000"
EMAIL="test@gmail.com"
PASSWORD="test123456"

echo "🧪 Testing Try-On API Endpoint"
echo "================================"
echo ""

# Step 1: Sign up (or sign in if user exists)
echo "📝 Step 1: Signing up..."
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

echo "$SIGNUP_RESPONSE" | jq '.' 2>/dev/null || echo "$SIGNUP_RESPONSE"
echo ""

# Extract token (try signup first, if fails try signin)
TOKEN=$(echo "$SIGNUP_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "⚠️  Signup failed or user exists, trying signin..."
  SIGNIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/signin" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$EMAIL\",
      \"password\": \"$PASSWORD\"
    }")
  
  TOKEN=$(echo "$SIGNIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  echo "$SIGNIN_RESPONSE" | jq '.' 2>/dev/null || echo "$SIGNIN_RESPONSE"
  echo ""
fi

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get authentication token"
  exit 1
fi

echo "✅ Got token: ${TOKEN:0:20}..."
echo ""

# Step 2: Upload photo and complete onboarding
echo "📸 Step 2: Uploading photo and completing onboarding..."
# Note: You'll need to upload a photo first via /api/upload/photo
# For now, we'll just set up the profile with a placeholder
# In real testing, you'd upload an actual image

ONBOARDING_RESPONSE=$(curl -s -X POST "$BASE_URL/api/onboarding" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test User",
    "gender": "male",
    "photo_url": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A"
  }')

echo "$ONBOARDING_RESPONSE" | jq '.' 2>/dev/null || echo "$ONBOARDING_RESPONSE"
echo ""

# Step 3: Test Try-On endpoint
echo "🎨 Step 3: Testing Try-On endpoint..."
TRYON_RESPONSE=$(curl -s -X POST "$BASE_URL/api/tryon" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "baseUpperStyleId": "29066024",
    "outerUpperStyleId": "11846940",
    "bottomsStyleId": "25756782",
    "footwearStyleId": "15335816"
  }')

echo "$TRYON_RESPONSE" | jq '.' 2>/dev/null || echo "$TRYON_RESPONSE"
echo ""

echo "✅ Test completed!"
echo ""
echo "💡 Note: Make sure you have:"
echo "   1. Backend server running on $BASE_URL"
echo "   2. User profile with uploaded photo"
echo "   3. Valid styleIds in your inventory"

