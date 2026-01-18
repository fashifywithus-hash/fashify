# Backend Setup Instructions

## Quick Start

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Configure Environment Variables**

   Create or update the `.env` file with the following:

   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/fashify

   # JWT Configuration
   JWT_SECRET=your-secret-key-change-in-production-min-32-characters
   JWT_EXPIRES_IN=7d

   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:8080
   ```

   **Important:** 
   - Change `JWT_SECRET` to a strong random string (at least 32 characters) in production
   - Update `MONGODB_URI` if your MongoDB is running on a different host/port
   - Make sure MongoDB is running before starting the server

3. **Start MongoDB** (if not already running)

   ```bash
   # Using Homebrew on macOS
   brew services start mongodb-community

   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest

   # Or start manually
   mongod
   ```

4. **Start the Server**

   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:3000`

5. **Run Integration Tests**

   ```bash
   # Using Node.js (requires Node 18+)
   node test-api.js

   # Or using the bash script
   ./test-integration.sh
   ```

## Database Setup

The application uses MongoDB with two main collections:

### Users Collection
- Stores user email and hashed password
- Automatically created when first user signs up

### Profiles Collection
- Stores user onboarding/profile data
- Linked to users via `user_id` field
- Automatically created when profile is saved

No manual database setup is required - the application will create collections automatically.

## Authentication Flow

1. **Sign Up**: User creates account with email/password
   - Password is hashed using bcrypt
   - JWT token is generated and returned

2. **Sign In**: User authenticates with email/password
   - Password is verified against stored hash
   - JWT token is generated and returned

3. **Protected Routes**: Include JWT token in Authorization header
   - Format: `Authorization: Bearer <token>`
   - Token is verified on each request

4. **Sign Out**: Client removes token (stateless JWT)

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Create account
  - Body: `{ email, password }`
  - Returns: `{ user, token }`

- `POST /api/auth/signin` - Sign in
  - Body: `{ email, password }`
  - Returns: `{ user, token }`

- `POST /api/auth/signout` - Sign out (client-side token removal)
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ message }`

- `GET /api/auth/me` - Get current user
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ user }`

### Onboarding

- `POST /api/onboarding` - Save/update profile
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ name, gender, weather_preference, lifestyle, body_type, height, skin_tone, preferred_styles, photo_url }`
  - Returns: `{ profile }`

- `GET /api/onboarding` - Get profile
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ profile }`

## Troubleshooting

### Server won't start
- Check that MongoDB is running: `mongosh` or check MongoDB status
- Verify `.env` file exists and has required variables
- Check the console for specific error messages

### MongoDB connection errors
- Ensure MongoDB is installed and running
- Check `MONGODB_URI` in `.env` is correct
- Try connecting manually: `mongosh mongodb://localhost:27017/fashify`

### Authentication errors
- Verify JWT_SECRET is set in `.env`
- Check that token is being sent in Authorization header
- Ensure token hasn't expired (default: 7 days)

### CORS errors
- Make sure `FRONTEND_URL` in `.env` matches your frontend URL
- Default is `http://localhost:8080`

## Production Considerations

1. **Change JWT_SECRET** to a strong, random string
2. **Use environment-specific MongoDB URI** (e.g., MongoDB Atlas)
3. **Enable HTTPS** for secure token transmission
4. **Set appropriate JWT_EXPIRES_IN** (shorter for production)
5. **Add rate limiting** to prevent brute force attacks
6. **Enable MongoDB authentication** if using a shared database
