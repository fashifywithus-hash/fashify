#!/bin/bash

# Integration Test Script for Fashify Backend API
# This script tests all API endpoints

BASE_URL="http://localhost:3000"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="testpassword123"
ACCESS_TOKEN=""
USER_ID=""

echo "🧪 Starting Integration Tests for Fashify Backend API"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to print test result
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((FAILED++))
    fi
}

# Test 1: Health Check
echo "1. Testing Health Check..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    test_result 0 "Health check endpoint"
else
    test_result 1 "Health check endpoint (got $HTTP_CODE)"
fi
echo "   Response: $BODY"
echo ""

# Test 2: Sign Up
echo "2. Testing Sign Up..."
SIGNUP_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/signup" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
HTTP_CODE=$(echo "$SIGNUP_RESPONSE" | tail -n1)
BODY=$(echo "$SIGNUP_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 400 ]; then
    # 400 might mean user already exists, which is okay for testing
    if echo "$BODY" | grep -q "user\|already"; then
        test_result 0 "Sign up endpoint"
        # Extract user ID if available
        USER_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
    else
        test_result 1 "Sign up endpoint (unexpected response)"
    fi
else
    test_result 1 "Sign up endpoint (got $HTTP_CODE)"
fi
echo "   Response: $BODY"
echo ""

# Test 3: Sign In
echo "3. Testing Sign In..."
SIGNIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/signin" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
HTTP_CODE=$(echo "$SIGNIN_RESPONSE" | tail -n1)
BODY=$(echo "$SIGNIN_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    test_result 0 "Sign in endpoint"
    # Extract token from response (JWT token format)
    ACCESS_TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
    USER_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
else
    test_result 1 "Sign in endpoint (got $HTTP_CODE)"
    echo "   Note: If signup failed, signin will also fail"
fi
echo "   Response: $BODY"
echo ""

# Test 4: Get Current User (requires auth)
if [ -n "$ACCESS_TOKEN" ]; then
    echo "4. Testing Get Current User..."
    ME_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/auth/me" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    HTTP_CODE=$(echo "$ME_RESPONSE" | tail -n1)
    BODY=$(echo "$ME_RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Get current user endpoint"
    else
        test_result 1 "Get current user endpoint (got $HTTP_CODE)"
    fi
    echo "   Response: $BODY"
    echo ""
else
    echo -e "${YELLOW}⚠ SKIP${NC}: Get current user (no access token)"
    echo ""
fi

# Test 5: Save Onboarding Profile (requires auth)
if [ -n "$ACCESS_TOKEN" ]; then
    echo "5. Testing Save Onboarding Profile..."
    ONBOARDING_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/onboarding" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Test User",
            "gender": "male",
            "weather_preference": 50,
            "lifestyle": "casual",
            "body_type": "average",
            "height": 175,
            "skin_tone": 50,
            "preferred_styles": ["streetwear", "minimal"]
        }')
    HTTP_CODE=$(echo "$ONBOARDING_RESPONSE" | tail -n1)
    BODY=$(echo "$ONBOARDING_RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Save onboarding profile endpoint"
    else
        test_result 1 "Save onboarding profile endpoint (got $HTTP_CODE)"
    fi
    echo "   Response: $BODY"
    echo ""
else
    echo -e "${YELLOW}⚠ SKIP${NC}: Save onboarding profile (no access token)"
    echo ""
fi

# Test 6: Get Onboarding Profile (requires auth)
if [ -n "$ACCESS_TOKEN" ]; then
    echo "6. Testing Get Onboarding Profile..."
    GET_PROFILE_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/onboarding" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    HTTP_CODE=$(echo "$GET_PROFILE_RESPONSE" | tail -n1)
    BODY=$(echo "$GET_PROFILE_RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 404 ]; then
        test_result 0 "Get onboarding profile endpoint"
    else
        test_result 1 "Get onboarding profile endpoint (got $HTTP_CODE)"
    fi
    echo "   Response: $BODY"
    echo ""
else
    echo -e "${YELLOW}⚠ SKIP${NC}: Get onboarding profile (no access token)"
    echo ""
fi

# Test 7: Sign Out (requires auth)
if [ -n "$ACCESS_TOKEN" ]; then
    echo "7. Testing Sign Out..."
    SIGNOUT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/signout" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    HTTP_CODE=$(echo "$SIGNOUT_RESPONSE" | tail -n1)
    BODY=$(echo "$SIGNOUT_RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Sign out endpoint"
    else
        test_result 1 "Sign out endpoint (got $HTTP_CODE)"
    fi
    echo "   Response: $BODY"
    echo ""
else
    echo -e "${YELLOW}⚠ SKIP${NC}: Sign out (no access token)"
    echo ""
fi

# Test 8: Invalid Endpoint (404 test)
echo "8. Testing 404 Handler..."
NOT_FOUND_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/invalid/endpoint")
HTTP_CODE=$(echo "$NOT_FOUND_RESPONSE" | tail -n1)
BODY=$(echo "$NOT_FOUND_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 404 ]; then
    test_result 0 "404 handler"
else
    test_result 1 "404 handler (got $HTTP_CODE)"
fi
echo "   Response: $BODY"
echo ""

# Summary
echo "=================================================="
echo "Test Summary:"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
