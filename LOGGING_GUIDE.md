# Logging Guide

This document describes the comprehensive logging system implemented in both Frontend and Backend.

## Overview

Structured logging has been added throughout the application to help:
- Understand the application flow
- Debug issues quickly
- Track API requests and responses
- Monitor validation and error handling

## Frontend Logging

### Logger Utility
Location: `FrontEnd/src/lib/logger.ts`

### Log Levels
- **info**: General information (shown in development)
- **warn**: Warnings (always shown)
- **error**: Errors (always shown)
- **debug**: Debug information (only when `VITE_DEBUG_LOGS=true`)

### Usage Examples

```typescript
import { logger } from '@/lib/logger';

// General logging
logger.info('User action', { userId: '123' }, 'CONTEXT');
logger.warn('Warning message', data, 'CONTEXT');
logger.error('Error occurred', error, 'CONTEXT');
logger.debug('Debug info', data, 'CONTEXT');

// Specialized methods
logger.apiRequest('/api/user/personal-info', 'POST', payload);
logger.apiResponse('/api/user/personal-info', 'POST', response, duration);
logger.apiError('/api/user/personal-info', 'POST', error);
logger.auth('Signup attempt', { email: 'user@example.com' });
logger.onboarding('Step 1 completed', { step: 1 });
```

### Where Logging is Added

1. **API Client** (`FrontEnd/src/lib/api.ts`)
   - All API requests and responses
   - Request duration tracking
   - Error handling

2. **Onboarding Flow** (`FrontEnd/src/pages/Onboarding.tsx`)
   - Step updates
   - Profile save process
   - Photo conversion
   - Backend API calls
   - Supabase operations

3. **Auth Hooks** (via API client)
   - Signup/Login attempts
   - Success/failure tracking

### Enabling Debug Logs

Add to `FrontEnd/.env`:
```env
VITE_DEBUG_LOGS=true
```

## Backend Logging

### Logger Utility
Location: `BackEnd/src/utils/logger.ts`

### Log Levels
- **info**: General information (shown in development)
- **warn**: Warnings (always shown)
- **error**: Errors (always shown)
- **debug**: Debug information (only when `DEBUG_LOGS=true`)

### Usage Examples

```typescript
import { logger } from '../utils/logger';

// General logging
logger.info('Operation completed', { data }, 'CONTEXT');
logger.warn('Warning message', data, 'CONTEXT');
logger.error('Error occurred', error, 'CONTEXT');
logger.debug('Debug info', data, 'CONTEXT');

// Specialized methods
logger.request('POST', '/api/user/personal-info', body, query);
logger.response('POST', '/api/user/personal-info', 200, duration, data);
logger.validation('userPic', value, true, 'Validation passed');
logger.service('UserService', 'updatePersonalInfo', { userId });
logger.database('save', 'users', { userId });
```

### Where Logging is Added

1. **Request/Response Middleware** (`BackEnd/src/middleware/logger.middleware.ts`)
   - All incoming requests
   - Response status and duration
   - Request body (sanitized)

2. **Error Handling** (`BackEnd/src/middleware/error.middleware.ts`)
   - Unhandled errors
   - 404 errors
   - Error stack traces

3. **Validation Middleware** (`BackEnd/src/middleware/validation.middleware.ts`)
   - Validation failures
   - Validation success

4. **Controllers**
   - **AuthController**: Signup/Login operations
   - **UserController**: Personal info operations

5. **Services**
   - **AuthService**: Authentication logic
   - **UserService**: User profile operations

6. **Utilities**
   - **Image Analysis**: Image validation flow
   - **API Util**: External API calls

### Enabling Debug Logs

Add to `BackEnd/.env`:
```env
DEBUG_LOGS=true
DEBUG_IMAGE_VALIDATION=true
DEBUG_API_CALLS=true
```

## Log Format

All logs follow this format:
```
[timestamp] [CONTEXT] message [data]
```

Example:
```
[2026-01-17T19:43:11.689Z] [API] API Request: POST /api/user/personal-info {"userId":"123","hasPhoto":true}
[2026-01-17T19:43:11.750Z] [API] API Response: POST /api/user/personal-info {"success":true,"duration":"61ms"}
```

## Data Sanitization

Sensitive data is automatically sanitized:
- Passwords: `[REDACTED]`
- Large images: `[Base64 Image: 12345 chars]`
- Phone numbers: First 3 digits + `***`

## Log Contexts

### Frontend Contexts
- `API`: API requests/responses
- `AUTH`: Authentication operations
- `ONBOARDING`: Onboarding flow
- `APP`: General application logs

### Backend Contexts
- `REQUEST`: Incoming requests
- `RESPONSE`: Outgoing responses
- `VALIDATION`: Validation operations
- `AUTH_SERVICE`: Authentication service
- `USER_SERVICE`: User service
- `AUTH_CONTROLLER`: Auth controller
- `USER_CONTROLLER`: User controller
- `IMAGE_VALIDATION`: Image validation
- `API_UTIL`: External API calls
- `DATABASE`: Database operations
- `ERROR_HANDLER`: Error handling
- `NOT_FOUND`: 404 errors
- `SERVER`: Server startup/shutdown

## Viewing Logs

### Frontend
Open browser console (F12) to see logs.

### Backend
Logs appear in the terminal where the backend is running.

## Best Practices

1. **Use appropriate log levels**
   - `error` for errors that need attention
   - `warn` for warnings that might indicate issues
   - `info` for important flow information
   - `debug` for detailed debugging

2. **Include context**
   - Always provide a context string
   - Include relevant data objects

3. **Sanitize sensitive data**
   - Never log passwords
   - Truncate large data (images, etc.)
   - Mask sensitive identifiers

4. **Use specialized methods**
   - Use `logger.apiRequest()` for API calls
   - Use `logger.service()` for service operations
   - Use `logger.database()` for DB operations

## Troubleshooting

### Logs not appearing?
1. Check if you're in development mode
2. Enable debug logs with environment variables
3. Check browser console for frontend logs
4. Check terminal for backend logs

### Too many logs?
1. Disable debug logs in production
2. Use log levels appropriately
3. Filter by context in your log viewer
