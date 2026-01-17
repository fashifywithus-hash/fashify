# Fashify Backend Architecture

## MVC Pattern Implementation

This project follows the **Model-View-Controller (MVC)** architectural pattern, adapted for a RESTful API backend.

## Directory Structure & Responsibilities

### 📁 `config/`
**Purpose**: Application configuration files
- Database connections
- Environment-specific settings
- Third-party service configurations

**Files**:
- `database.ts` - MongoDB connection setup

---

### 📁 `models/`
**Purpose**: Database models and schemas (MVC: **Model**)
- Define data structures
- Mongoose schemas
- TypeScript interfaces for database documents

**Files**:
- `User.model.ts` - User schema with phone number and password

**Responsibilities**:
- Define database schema
- Handle data validation at schema level
- Define indexes for performance

---

### 📁 `dto/`
**Purpose**: Data Transfer Objects
- Type-safe request/response structures
- API contract definitions
- Prevents direct model exposure to controllers

**Files**:
- `auth.dto.ts` - Authentication request/response DTOs

**Benefits**:
- Type safety across layers
- Clear API contracts
- Separation of concerns (DB models vs API contracts)

---

### 📁 `validators/`
**Purpose**: Request validation rules
- Input validation using express-validator
- Reusable validation chains
- Business rule validation

**Files**:
- `auth.validator.ts` - Signup validation rules

**Responsibilities**:
- Validate request data format
- Check required fields
- Validate data types and constraints

---

### 📁 `controllers/`
**Purpose**: Request handlers (MVC: **Controller**)
- Handle HTTP requests and responses
- Thin layer - delegates business logic to services
- Format responses using DTOs

**Files**:
- `auth.controller.ts` - Authentication endpoints

**Responsibilities**:
- Extract data from requests
- Call appropriate services
- Handle HTTP status codes
- Format and return responses
- Handle controller-level errors

**Best Practices**:
- Keep controllers thin
- No business logic in controllers
- Use DTOs for type safety

---

### 📁 `services/`
**Purpose**: Business logic layer
- Core application logic
- Orchestrates data operations
- Interacts with models
- Reusable across different controllers

**Files**:
- `auth.service.ts` - Authentication business logic

**Responsibilities**:
- Implement business rules
- Coordinate between models and utilities
- Handle business-level errors
- Return structured results

**Best Practices**:
- Pure business logic
- No HTTP concerns
- Reusable and testable
- Single responsibility principle

---

### 📁 `utils/`
**Purpose**: Reusable utility functions
- Common helper functions
- Pure functions (no side effects)
- Domain-agnostic utilities

**Files**:
- `validation.util.ts` - Phone number and password validation
- `password.util.ts` - Password hashing and comparison

**Responsibilities**:
- Provide reusable functions
- Keep utilities pure and testable
- No business logic dependencies

---

### 📁 `middleware/`
**Purpose**: Express middleware
- Request/response processing
- Error handling
- Validation error formatting

**Files**:
- `error.middleware.ts` - Global error handler and 404 handler
- `validation.middleware.ts` - Validation error formatter

**Responsibilities**:
- Process requests before controllers
- Handle errors globally
- Format error responses consistently

---

### 📁 `routes/`
**Purpose**: API route definitions
- Define endpoints
- Connect routes to controllers
- Apply middleware chains

**Files**:
- `auth.routes.ts` - Authentication routes

**Responsibilities**:
- Define URL patterns
- Apply validators and middleware
- Connect to controllers
- Document routes

---

## Data Flow

```
Request → Routes → Validators → Middleware → Controller → Service → Model → Database
                                                                         ↓
Response ← Routes ← Middleware ← Controller ← Service ← Model ← Database
```

### Example: Signup Flow

1. **Route** (`routes/auth.routes.ts`)
   - Defines `POST /api/auth/signup`
   - Applies validation middleware

2. **Validator** (`validators/auth.validator.ts`)
   - Validates phone number format
   - Validates password length

3. **Validation Middleware** (`middleware/validation.middleware.ts`)
   - Checks validation results
   - Returns errors if validation fails

4. **Controller** (`controllers/auth.controller.ts`)
   - Extracts request data
   - Calls `AuthService.signup()`
   - Formats response using DTOs

5. **Service** (`services/auth.service.ts`)
   - Validates business rules (using utils)
   - Checks for existing user
   - Hashes password (using utils)
   - Creates user (using model)
   - Returns result

6. **Model** (`models/User.model.ts`)
   - Saves to database
   - Returns user document

7. **Response**
   - Controller formats response
   - Returns to client

## Key Principles

### 1. Separation of Concerns
- Each layer has a single, well-defined responsibility
- Controllers handle HTTP, Services handle business logic
- Models handle data persistence

### 2. Dependency Direction
- Controllers depend on Services
- Services depend on Models and Utils
- Models are independent
- Utils are independent

### 3. Type Safety
- DTOs ensure type safety across layers
- TypeScript interfaces for all data structures
- No `any` types in business logic

### 4. Reusability
- Services can be used by multiple controllers
- Utils can be used across services
- Middleware can be applied to multiple routes

### 5. Testability
- Pure functions in utils
- Services are easily mockable
- Controllers are thin and testable
- Clear separation makes unit testing easier

## Adding New Features

When adding a new feature (e.g., login):

1. **Model**: Add fields if needed (already exists for login)
2. **DTO**: Create `LoginRequestDto` and `LoginResponseDto`
3. **Validator**: Create `validateLogin` rules
4. **Service**: Add `login()` method to `AuthService`
5. **Controller**: Add `login()` method to `AuthController`
6. **Route**: Add route in `auth.routes.ts`

This structure ensures consistency and maintainability as the application grows.
