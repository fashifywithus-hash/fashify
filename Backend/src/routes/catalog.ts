import express, { Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { catalogService } from "../services/catalogService";

const router = express.Router();

/**
 * GET /api/catalog
 * Returns the available suit items grouped into four categories:
 * - blazers
 * - shirts
 * - pants
 * - shoes
 *
 * Optional query parameter:
 * - category=blazers|shirts|pants|shoes
 */
router.get("/", authenticate, (req: AuthRequest, res: Response) => {
  const category = (req.query.category as string | undefined)?.toLowerCase();
  const catalog = catalogService.getCatalog();

  if (!category) {
    return res.json(catalog);
  }

  switch (category) {
    case "blazers":
      return res.json({ blazers: catalog.blazers });
    case "shirts":
      return res.json({ shirts: catalog.shirts });
    case "pants":
      return res.json({ pants: catalog.pants });
    case "shoes":
      return res.json({ shoes: catalog.shoes });
    default:
      return res.status(400).json({
        error: "Invalid category",
        message: "Category must be one of: blazers, shirts, pants, shoes",
      });
  }
});

export default router;

