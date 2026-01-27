import express, { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { User } from "../models/User";
import { generateToken } from "../config/jwt";
import { authenticate, AuthRequest } from "../middleware/auth";
import { logger } from "../utils/logger";

const router = express.Router();

/**
 * POST /api/auth/signup
 * Create a new user account
 */
router.post(
  "/signup",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          error: "User with this email already exists",
        });
      }

      // Create new user
      const user = new User({ email, password });
      await user.save();

      // Generate token
      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
      });

      res.status(201).json({
        message: "Account created successfully",
        user: {
          id: user._id.toString(),
          email: user.email,
        },
        token,
      });
    } catch (error: any) {
      logger.error("Signup error", error);
      res.status(500).json({
        error: "Failed to create account",
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/auth/signin
 * Sign in an existing user
 */
router.post(
  "/signin",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user and include password for comparison
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return res.status(401).json({
          error: "Invalid email or password",
        });
      }

      // Compare password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: "Invalid email or password",
        });
      }

      // Generate token
      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
      });

      res.json({
        message: "Signed in successfully",
        user: {
          id: user._id.toString(),
          email: user.email,
        },
        token,
      });
    } catch (error: any) {
      logger.error("Signin error", error);
      res.status(500).json({
        error: "Failed to sign in",
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/auth/signout
 * Sign out the current user (client-side token removal)
 * This endpoint just confirms the request
 */
router.post("/signout", async (req: Request, res: Response) => {
  // Since we're using JWT tokens, signout is handled client-side
  // by removing the token. This endpoint just confirms the request.
  res.json({
    message: "Signed out successfully",
  });
});

/**
 * POST /api/auth/me
 * Get current user information
 * Requires Authorization header with Bearer token
 * Uses authenticate middleware to extract userId from token
 */
router.post("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    // userId is already extracted from token by authenticate middleware
    const userId = req.user.id;

    // Fetch full user details from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        error: "User not found",
      });
    }

    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        created_at: user.createdAt,
      },
    });
  } catch (error: any) {
    logger.error("Get user error", error);
    res.status(500).json({
      error: "Failed to get user",
      message: error.message,
    });
  }
});

export default router;
