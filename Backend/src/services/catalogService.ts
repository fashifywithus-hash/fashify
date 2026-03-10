import fs from "fs";
import path from "path";

export type SuitCategoryKey = "blazers" | "shirts" | "pants" | "shoes";

export interface CatalogItem {
  styleId: string;
  category: SuitCategoryKey;
  fileName: string;
  imageUrl: string;
}

export interface CatalogResult {
  blazers: CatalogItem[];
  shirts: CatalogItem[];
  pants: CatalogItem[];
  shoes: CatalogItem[];
}

const INVENTORY_ROOT = path.resolve(__dirname, "..", "..", "inventory-images");
const CATALOG_PATH = path.join(INVENTORY_ROOT, "suit_catalog.json");

class CatalogService {
  private catalog: CatalogResult | null = null;

  private buildImageUrl(category: SuitCategoryKey, fileName: string): string {
    // Express serves Backend/inventory-images under /static/suits
    return `/static/suits/${category}/${fileName}`;
  }

  private loadRawCatalog(): any {
    if (!fs.existsSync(CATALOG_PATH)) {
      return { blazers: [], shirts: [], pants: [], shoes: [] };
    }
    const raw = fs.readFileSync(CATALOG_PATH, "utf8");
    return JSON.parse(raw);
  }

  getCatalog(): CatalogResult {
    if (this.catalog) {
      return this.catalog;
    }

    const raw = this.loadRawCatalog();

    const buildCategory = (category: SuitCategoryKey): CatalogItem[] => {
      const entries = (raw[category] || []) as { styleId: string; fileName: string }[];
      const categoryDir = path.join(INVENTORY_ROOT, category);
      return entries
        .filter((entry) => {
          const filePath = path.join(categoryDir, entry.fileName);
          return fs.existsSync(filePath);
        })
        .map((entry) => ({
          styleId: entry.styleId,
          category,
          fileName: entry.fileName,
          imageUrl: this.buildImageUrl(category, entry.fileName),
        }));
    };

    this.catalog = {
      blazers: buildCategory("blazers"),
      shirts: buildCategory("shirts"),
      pants: buildCategory("pants"),
      shoes: buildCategory("shoes"),
    };

    return this.catalog;
  }

  clearCache(): void {
    this.catalog = null;
  }
}

export const catalogService = new CatalogService();

