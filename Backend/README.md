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

4. Configure Google Cloud credentials for Try-On feature (required for `/api/tryon` endpoint):
   
   **Step 1: Create a Service Account**
   
   Using Google Cloud Console:
   1. Go to [Google Cloud Console](https://console.cloud.google.com/)
   2. Select your project: `fashify-484620`
   3. Navigate to **IAM & Admin** → **Service Accounts**
   4. Click **+ CREATE SERVICE ACCOUNT**
   5. Enter a name (e.g., `fashify-tryon-service`)
   6. Click **CREATE AND CONTINUE**
   7. Grant the role: **Vertex AI User** (or `roles/aiplatform.user`)
   8. Click **CONTINUE** → **DONE**
   
   **Step 2: Create and Download Key**
   
   1. Click on the service account you just created
   2. Go to the **KEYS** tab
   3. Click **ADD KEY** → **Create new key**
   4. Select **JSON** format
   5. Click **CREATE** - this downloads a JSON file (e.g., `fashify-484620-xxxxx.json`)
   
   **Step 3: Configure Credentials**
   
   **Option 1: Service Account Key File (Recommended for local development)**
   ```bash
   # Place the downloaded JSON file in your project (or secure location)
   # Add to .env:
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/fashify-484620-xxxxx.json
   ```
   
   **Option 2: Credentials as Environment Variable (Recommended for production/Docker)**
   
   Convert the JSON file to a single-line string using our helper script:
   
   ```bash
   # Using the Node.js helper script (recommended)
   node scripts/convert-google-credentials.js /path/to/fashify-484620-xxxxx.json
   
   # Or using the bash script (requires jq)
   ./scripts/convert-google-credentials.sh /path/to/fashify-484620-xxxxx.json
   ```
   
   The script will output the exact `GOOGLE_CREDENTIALS` value to add to your `.env` file.
   
   **Manual conversion (if needed):**
   ```bash
   # Using jq (if installed)
   cat /path/to/fashify-484620-xxxxx.json | jq -c
   
   # Using Node.js one-liner
   node -e "console.log(JSON.stringify(require('./fashify-484620-xxxxx.json')))" | tr -d '\n'
   ```
   
   **Important:** When setting `GOOGLE_CREDENTIALS` in `.env` or environment variables:
   - Keep the entire JSON on one line
   - Escape quotes properly if needed
   - The private_key should include `\n` for newlines (the JSON file already has this)
   
   **Additional Google Cloud Configuration:**
   ```bash
   GOOGLE_CLOUD_PROJECT=fashify-484620
   GOOGLE_CLOUD_LOCATION=global
   ```
   
   **Note:** 
   - If you're using `gcloud` locally with ADC, that works for local development but **won't work in Docker/production**
   - For production (AWS Elastic Beanstalk, Docker, etc.), you **must** use one of the options above
   - The service account needs the **Vertex AI User** role to access Gemini API

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
