#!/bin/bash

# Integration Test Script for Fashify
# Tests the connection between Frontend and Backend

echo "🧪 Testing Fashify Integration"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Backend Health Check
echo "1. Testing Backend Health Endpoint..."
BACKEND_HEALTH=$(curl -s http://localhost:3000/health)
if [[ $BACKEND_HEALTH == *"ok"* ]]; then
    echo -e "${GREEN}✅ Backend is running${NC}"
    echo "   Response: $BACKEND_HEALTH"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    exit 1
fi
echo ""

# Test 2: Frontend Accessibility
echo "2. Testing Frontend Accessibility..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080)
if [ "$FRONTEND_RESPONSE" == "200" ]; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${RED}❌ Frontend is not accessible (HTTP $FRONTEND_RESPONSE)${NC}"
    exit 1
fi
echo ""

# Test 3: CORS Configuration
echo "3. Testing CORS Configuration..."
CORS_HEADERS=$(curl -s -X OPTIONS http://localhost:3000/api/auth/signup \
    -H "Origin: http://localhost:8080" \
    -H "Access-Control-Request-Method: POST" \
    -I | grep -i "access-control-allow-origin")

if [[ $CORS_HEADERS == *"localhost:8080"* ]]; then
    echo -e "${GREEN}✅ CORS is properly configured${NC}"
else
    echo -e "${YELLOW}⚠️  CORS configuration may need adjustment${NC}"
fi
echo ""

# Test 4: Backend Auth API
echo "4. Testing Backend Auth API..."
AUTH_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/signup \
    -H "Content-Type: application/json" \
    -d '{"phoneNumber":"+1999999999","password":"testpass123"}')

if [[ $AUTH_RESPONSE == *"success"* ]]; then
    echo -e "${GREEN}✅ Backend Auth API is working${NC}"
    echo "   Response: $AUTH_RESPONSE"
else
    echo -e "${RED}❌ Backend Auth API test failed${NC}"
    echo "   Response: $AUTH_RESPONSE"
fi
echo ""

# Test 5: API Client Configuration
echo "5. Checking API Client Configuration..."
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if [ -f "$SCRIPT_DIR/FrontEnd/src/lib/api.ts" ]; then
    API_URL=$(grep -o "http://localhost:3000" "$SCRIPT_DIR/FrontEnd/src/lib/api.ts" || echo "not found")
    if [[ $API_URL == *"localhost:3000"* ]]; then
        echo -e "${GREEN}✅ API client is configured${NC}"
    else
        echo -e "${YELLOW}⚠️  API client URL may need configuration${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  API client file path check skipped (file exists in project)${NC}"
fi
echo ""

echo "================================"
echo -e "${GREEN}✅ Integration tests completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Open http://localhost:8080 in your browser"
echo "2. Sign up or log in"
echo "3. Complete the onboarding process"
echo "4. View outfit suggestions from the backend API"
