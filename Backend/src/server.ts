import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDatabase } from "./config/database";
import { requestLogger } from "./middleware/logger";
import authRoutes from "./routes/auth";
import onboardingRoutes from "./routes/onboarding";
import uploadRoutes from "./routes/upload";
import recommendationsRoutes from "./routes/recommendations";

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

// CORS configuration - support multiple origins in production
const getCorsOrigin = (): string | string[] => {
  const frontendUrl = process.env.FRONTEND_URL;
  const isDevelopment = process.env.NODE_ENV !== "production";
  
  if (!frontendUrl) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("FRONTEND_URL is required in production environment");
    }
    return "http://localhost:8080"; // Default for development
  }

  // In development, always allow localhost origins even if FRONTEND_URL is set to production
  // This allows local development while keeping production URL in .env
  if (isDevelopment) {
    const origins: string[] = ["http://localhost:8080", "http://127.0.0.1:8080"];
    
    // Support multiple origins (comma-separated)
    if (frontendUrl.includes(",")) {
      origins.push(...frontendUrl.split(",").map(url => url.trim()));
    } else {
      origins.push(frontendUrl);
    }
    
    return origins;
  }

  // In production, support multiple origins (comma-separated)
  if (frontendUrl.includes(",")) {
    return frontendUrl.split(",").map(url => url.trim());
  }

  return frontendUrl;
};

// Middleware
app.use(cors({
  origin: getCorsOrigin(),
  credentials: true
}));
// Increase body size limit to handle base64 images (50MB limit)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Health check (before logging middleware) - MUST be independent of DB
// EB health checks this endpoint - it must always return 200 OK
app.get("/health", (req, res) => {
  try {
    // Simple health check - don't check DB, don't throw errors
    res.status(200).json({ 
      status: "ok", 
      message: "Fashify Backend API is running",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Even if something goes wrong, return 200 to keep EB happy
    res.status(200).json({ status: "ok" });
  }
});

// Request logging middleware for all /api/* routes (must be after body parsing)
app.use("/api", requestLogger);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/recommendations", recommendationsRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Validate required environment variables in production
const validateEnvironment = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const requiredVars = ["MONGODB_URI", "JWT_SECRET", "FRONTEND_URL"];
  const missingVars: string[] = [];

  requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  if (isProduction && missingVars.length > 0) {
    console.error("❌ Missing required environment variables in production:");
    missingVars.forEach((varName) => console.error(`   - ${varName}`));
    console.error("Please set all required environment variables before starting the server.");
    process.exit(1);
  }

  if (missingVars.length > 0) {
    console.warn("⚠️  Missing environment variables (using defaults for development):");
    missingVars.forEach((varName) => console.warn(`   - ${varName}`));
  }
};

// Start server - CRITICAL: Start server FIRST, connect DB AFTER
// This ensures EB health checks pass even if MongoDB is temporarily unavailable
const startServer = () => {
  try {
    // Validate environment variables (but don't exit if only DB is missing)
    validateEnvironment();

    // Start listening FIRST - use 0.0.0.0 to accept connections from load balancer
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Fashify Backend API running on port ${PORT}`);
      const healthUrl = process.env.BACKEND_URL 
        ? `${process.env.BACKEND_URL}/health`
        : `http://localhost:${PORT}/health`;
      console.log(`📡 Health check: ${healthUrl}`);
      
      // Connect to database AFTER server starts (non-blocking)
      // This allows the server to stay alive even if MongoDB connection fails
      connectDatabase()
        .then(() => {
          console.log("✅ MongoDB connected successfully");
        })
        .catch((error) => {
          console.error("❌ MongoDB connection failed:", error);
          console.error("⚠️  Server will continue running without database connection");
          console.error("⚠️  API endpoints requiring database will fail, but /health will work");
          // DON'T exit process - let server keep running
          // EB needs the process to stay alive for health checks
        });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    // Only exit if it's a critical startup error (not DB-related)
    process.exit(1);
  }
};

startServer();
