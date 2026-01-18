import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../config/jwt";
import { User } from "../models/User";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

/**
 * Authentication Middleware
 * Extracts and verifies JWT token from Authorization header
 * Attaches userId and email to req.user for use in route handlers
 * 
 * Usage in routes:
 * router.post("/endpoint", authenticate, async (req: AuthRequest, res: Response) => {
 *   const userId = req.user.id; // userId from token (saved in DB when user signed up)
 *   const email = req.user.email;
 *   // ... your route logic
 * });
 */
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        error: "Authorization token required",
      });
      return;
    }

    const token = authHeader.substring(7);

    // Verify token and extract userId (this userId was saved in DB when user signed up)
    const decoded = verifyToken(token);

    // Check if user still exists in database
    const user = await User.findById(decoded.userId).select("email");
    if (!user) {
      res.status(401).json({
        error: "User not found",
      });
      return;
    }

    // Attach user info to request object
    // req.user.id contains the userId from the token (MongoDB _id saved during signup)
    req.user = {
      id: decoded.userId, // This is the userId saved in DB when user signed up
      email: decoded.email,
    };

    next();
  } catch (error: any) {
    res.status(401).json({
      error: "Invalid or expired token",
      message: error.message,
    });
  }
};
