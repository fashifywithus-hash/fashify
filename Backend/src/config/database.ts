import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/fashify";

// Validate MongoDB URI in production
if (process.env.NODE_ENV === "production" && !process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is required in production environment. Please set it in your environment variables.");
}

export const connectDatabase = async (): Promise<void> => {
  try {
    console.log("🔌 Attempting to connect to MongoDB...");
    console.log("MongoDB URI:", MONGODB_URI ? `${MONGODB_URI.substring(0, 30)}...` : "NOT SET");
    
    // Set connection options for better reliability
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000,
    });
    
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    // Don't throw - let the caller handle it
    // This allows server to keep running even if DB connection fails
    throw error;
  }
};

// Handle connection events
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

export default mongoose;
