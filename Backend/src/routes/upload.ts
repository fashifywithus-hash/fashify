import express, { Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticate, AuthRequest } from "../middleware/auth";
import { logger } from "../utils/logger";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/", // Temporary storage
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
    }
  },
});

/**
 * POST /api/upload/photo
 * Upload a user photo
 * Returns the file path or data URL that can be stored in profile
 */
router.post(
  "/photo",
  authenticate,
  upload.single("photo"),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Read the file and convert to base64 data URL
      const filePath = req.file.path;
      const fileBuffer = fs.readFileSync(filePath);
      const base64 = fileBuffer.toString("base64");
      const mimeType = req.file.mimetype;
      const dataURL = `data:${mimeType};base64,${base64}`;

      // Clean up temporary file
      fs.unlinkSync(filePath);

      res.json({
        photo_url: dataURL,
        message: "Photo uploaded successfully",
      });
    } catch (error: any) {
      // Clean up file if it exists
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      logger.error("Upload error", error);
      res.status(500).json({
        error: "Failed to upload photo",
        message: error.message,
      });
    }
  }
);

export default router;
