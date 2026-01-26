import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDatabase } from "./config/database";
import { requestLogger } from "./middleware/logger";
import authRoutes from "./routes/auth";
import onboardingRoutes from "./routes/onboarding";
import uploadRoutes from "./routes/upload";
import recommendationsRoutes from "./routes/recommendations";
import tryOnRoutes from "./routes/tryon";

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

// Health check (before logging middleware)
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Fashify Backend API is running" });
});

// Request logging middleware for all /api/* routes (must be after body parsing)
app.use("/api", requestLogger);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/recommendations", recommendationsRoutes);
app.use("/api/tryon", tryOnRoutes);

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

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 Fashify Backend API running on port ${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
