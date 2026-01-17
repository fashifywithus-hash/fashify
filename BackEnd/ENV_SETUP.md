# Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/fashify

# OpenAI API Configuration (PRIMARY - for DALL-E image generation)
# Get your API key from: https://platform.openai.com/api-keys
# This is the main image generation service
OPENAI_API_KEY=your_openai_api_key_here

# Gemini API Configuration (OPTIONAL - fallback for text descriptions only)
# Get your API key from: https://aistudio.google.com/app/apikey
# Only used if DALL-E fails and we need text-based fallback
GEMINI_API_KEY=your_gemini_api_key_here

# Virtual Try-On API Configuration (optional - required for "Try It On" feature)
# OAuth2 Bearer token for Virtual Try-On API
# 
# How to get the token:
# Option 1: Using Google Cloud SDK (gcloud CLI)
#   1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
#   2. Authenticate: gcloud auth application-default login
#   3. Get token: gcloud auth print-access-token
#   4. Copy the token and paste below
#
# Option 2: Using Google Cloud Console
#   1. Go to: https://console.cloud.google.com/
#   2. Create a service account and download JSON key
#   3. Use the service account to generate tokens programmatically
#
# Note: Token expires after 1 hour. For production, implement automatic token refresh.
VIRTUAL_TRY_ON_ACCESS_TOKEN=
```

## MongoDB Setup

### Local MongoDB
If you're running MongoDB locally, make sure it's running on the default port (27017).

### MongoDB Atlas (Cloud)
If you're using MongoDB Atlas, use your connection string:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fashify
```
