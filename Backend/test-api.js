/**
 * Simple Integration Test Script for Fashify Backend API
 * Run with: node test-api.js
 */

const BASE_URL = process.env.API_URL || "http://localhost:3000";

// Test data
const TEST_EMAIL = `test${Date.now()}@example.com`;
const TEST_PASSWORD = "testpassword123";

let accessToken = "";
let userId = "";

// Colors for console output
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
};

let passed = 0;
let failed = 0;

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testResult(name, success, details = "") {
  if (success) {
    log(`✓ PASS: ${name}`, "green");
    passed++;
  } else {
    log(`✗ FAIL: ${name}`, "red");
    failed++;
  }
  if (details) {
    console.log(`  ${details}`);
  }
}

async function makeRequest(method, endpoint, body = null, token = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json().catch(() => ({ message: response.statusText }));
    return { status: response.status, data };
  } catch (error) {
    return { status: 0, data: { error: error.message } };
  }
}

async function runTests() {
  log("\n🧪 Starting Integration Tests for Fashify Backend API", "blue");
  log("=".repeat(50), "blue");
  console.log("");

  // Test 1: Health Check
  log("1. Testing Health Check...", "yellow");
  const health = await makeRequest("GET", "/health");
  testResult(
    "Health check endpoint",
    health.status === 200,
    `Status: ${health.status}, Response: ${JSON.stringify(health.data)}`
  );
  console.log("");

  // Test 2: Sign Up
  log("2. Testing Sign Up...", "yellow");
  const signup = await makeRequest("POST", "/api/auth/signup", {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  const signupSuccess = signup.status === 201 || (signup.status === 400 && signup.data.error?.includes("already"));
  testResult(
    "Sign up endpoint",
    signupSuccess,
    `Status: ${signup.status}, Response: ${JSON.stringify(signup.data).substring(0, 200)}`
  );
  if (signup.data.user) {
    userId = signup.data.user.id;
  }
  console.log("");

  // Test 3: Sign In
  log("3. Testing Sign In...", "yellow");
  const signin = await makeRequest("POST", "/api/auth/signin", {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  testResult(
    "Sign in endpoint",
    signin.status === 200,
    `Status: ${signin.status}, Response: ${JSON.stringify(signin.data).substring(0, 200)}`
  );
  // Extract token from response (JWT token format)
  if (signin.data.token) {
    accessToken = signin.data.token;
  }
  if (signin.data.user) {
    userId = signin.data.user.id;
  }
  console.log("");

  // Test 4: Get Current User
  if (accessToken) {
    log("4. Testing Get Current User...", "yellow");
    const me = await makeRequest("GET", "/api/auth/me", null, accessToken);
    testResult(
      "Get current user endpoint",
      me.status === 200,
      `Status: ${me.status}, Response: ${JSON.stringify(me.data).substring(0, 200)}`
    );
    console.log("");
  } else {
    log("⚠ SKIP: Get current user (no access token)", "yellow");
    console.log("");
  }

  // Test 5: Save Onboarding Profile
  if (accessToken) {
    log("5. Testing Save Onboarding Profile...", "yellow");
    const onboarding = await makeRequest(
      "POST",
      "/api/onboarding",
      {
        name: "Test User",
        gender: "male",
        weather_preference: 50,
        lifestyle: "casual",
        body_type: "average",
        height: 175,
        skin_tone: 50,
        preferred_styles: ["streetwear", "minimal"],
      },
      accessToken
    );
    testResult(
      "Save onboarding profile endpoint",
      onboarding.status === 200,
      `Status: ${onboarding.status}, Response: ${JSON.stringify(onboarding.data).substring(0, 200)}`
    );
    console.log("");
  } else {
    log("⚠ SKIP: Save onboarding profile (no access token)", "yellow");
    console.log("");
  }

  // Test 6: Get Onboarding Profile
  if (accessToken) {
    log("6. Testing Get Onboarding Profile...", "yellow");
    const getProfile = await makeRequest("GET", "/api/onboarding", null, accessToken);
    testResult(
      "Get onboarding profile endpoint",
      getProfile.status === 200 || getProfile.status === 404,
      `Status: ${getProfile.status}, Response: ${JSON.stringify(getProfile.data).substring(0, 200)}`
    );
    console.log("");
  } else {
    log("⚠ SKIP: Get onboarding profile (no access token)", "yellow");
    console.log("");
  }

  // Test 7: Sign Out
  if (accessToken) {
    log("7. Testing Sign Out...", "yellow");
    const signout = await makeRequest("POST", "/api/auth/signout", null, accessToken);
    testResult(
      "Sign out endpoint",
      signout.status === 200,
      `Status: ${signout.status}, Response: ${JSON.stringify(signout.data)}`
    );
    console.log("");
  } else {
    log("⚠ SKIP: Sign out (no access token)", "yellow");
    console.log("");
  }

  // Test 8: 404 Handler
  log("8. Testing 404 Handler...", "yellow");
  const notFound = await makeRequest("GET", "/api/invalid/endpoint");
  testResult(
    "404 handler",
    notFound.status === 404,
    `Status: ${notFound.status}, Response: ${JSON.stringify(notFound.data)}`
  );
  console.log("");

  // Summary
  log("=".repeat(50), "blue");
  log("Test Summary:", "blue");
  log(`Passed: ${passed}`, "green");
  log(`Failed: ${failed}`, failed > 0 ? "red" : "green");
  log(`Total: ${passed + failed}`, "blue");
  console.log("");

  if (failed === 0) {
    log("✅ All tests passed!", "green");
    process.exit(0);
  } else {
    log("❌ Some tests failed", "red");
    process.exit(1);
  }
}

// Check if fetch is available (Node 18+)
if (typeof fetch === "undefined") {
  console.error("Error: This script requires Node.js 18+ with fetch API support");
  console.error("Or install node-fetch: npm install node-fetch");
  process.exit(1);
}

// Run tests
runTests().catch((error) => {
  console.error("Test execution error:", error);
  process.exit(1);
});
