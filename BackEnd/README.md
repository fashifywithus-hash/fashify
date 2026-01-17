# Fashify Backend API

Backend API for Fashify - An AI-powered outfit suggestion application that recommends outfits based on user body features.

## Features

- User signup with phone number and password
- Secure password hashing using bcrypt
- MongoDB database integration
- Input validation and error handling
- TypeScript for type safety

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your MongoDB connection string:
```
MONGODB_URI=mongodb://localhost:27017/fashify
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## API Endpoints

### Health Check
- **GET** `/health` - Check if the API is running

### Authentication
- **POST** `/api/auth/signup` - Register a new user

#### Signup Request Body:
```json
{
  "phoneNumber": "+1234567890",
  "password": "yourpassword"
}
```

#### Signup Response (Success):
```json
{
  "success": true,
  "message": "User signed up successfully",
  "data": {
    "id": "user_id",
    "phoneNumber": "+1234567890",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Signup Response (Error):
```json
{
  "success": false,
  "message": "Error message here"
}
```

## Project Structure

The project follows MVC (Model-View-Controller) architecture pattern:

```
src/
├── config/          # Configuration files (database, etc.)
├── controllers/     # Controllers - Handle HTTP requests/responses (thin layer)
├── dto/             # Data Transfer Objects - Request/Response type definitions
├── middleware/      # Custom middleware (error handling, validation)
├── models/          # Models - Database schemas and interfaces
├── routes/          # Routes - API endpoint definitions
├── services/        # Services - Business logic layer
├── utils/           # Utility functions (validation, password hashing, etc.)
├── validators/      # Request validation rules
└── index.ts         # Application entry point
```

### Architecture Overview

- **Models**: Define database schemas and data structures
- **DTOs**: Define request/response data structures for type safety
- **Validators**: Define validation rules for incoming requests
- **Controllers**: Handle HTTP requests, call services, return responses
- **Services**: Contain business logic, interact with models
- **Utils**: Reusable utility functions
- **Middleware**: Custom Express middleware for error handling and validation
- **Routes**: Define API endpoints and connect them to controllers

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Security**: bcryptjs for password hashing, helmet for security headers
- **Validation**: express-validator

## Development Guidelines

- Follow TypeScript strict mode
- Use async/await for asynchronous operations
- Implement proper error handling
- Add JSDoc comments for public functions
- Follow existing service patterns

## License

ISC
