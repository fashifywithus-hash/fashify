import mongoose from "mongoose";
import dotenv from "dotenv";
import { logger } from "../utils/logger";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/fashify";

// Validate MongoDB URI in production
if (process.env.NODE_ENV === "production" && !process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is required in production environment. Please set it in your environment variables.");
}

export const connectDatabase = async (): Promise<void> => {
  try {
    logger.info("Attempting to connect to MongoDB", {
      uri: MONGODB_URI ? `${MONGODB_URI.substring(0, 30)}...` : "NOT SET",
    });
    
    // Set connection options for better reliability
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000,
    });
    
    logger.info("Connected to MongoDB");
  } catch (error) {
    logger.error("MongoDB connection error", error);
    // Don't throw - let the caller handle it
    // This allows server to keep running even if DB connection fails
    throw error;
  }
};

// Handle connection events
mongoose.connection.on("error", (err) => {
  logger.error("MongoDB connection error", err);
});

mongoose.connection.on("disconnected", () => {
  logger.info("MongoDB disconnected");
});

export default mongoose;
