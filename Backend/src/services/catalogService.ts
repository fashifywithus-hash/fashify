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
const JEWELLERY_CATALOG_PATH = path.join(
  INVENTORY_ROOT,
  "jewellery",
  "jewellery_catalog.json"
);

class CatalogService {
  private catalog: CatalogResult | null = null;

  private buildImageUrl(relativePath: string): string {
    // Express serves Backend/inventory-images under /static/suits
    return `/static/suits/${relativePath}`;
  }

  private loadJewelleryCatalog(): any {
    if (!fs.existsSync(JEWELLERY_CATALOG_PATH)) {
      return { necklines: [], sarees: [] };
    }
    const raw = fs.readFileSync(JEWELLERY_CATALOG_PATH, "utf8");
    return JSON.parse(raw);
  }

  getCatalog(): CatalogResult {
    if (this.catalog) {
      return this.catalog;
    }

    const raw = this.loadJewelleryCatalog();
    const necklines = (raw.necklines || []) as { styleId: string; fileName: string }[];
    const sarees = (raw.sarees || []) as { styleId: string; fileName: string }[];

    const necklinesDir = path.join(INVENTORY_ROOT, "jewellery", "necklines");
    const sareesDir = path.join(INVENTORY_ROOT, "jewellery", "sarees");

    const blazers: CatalogItem[] = necklines
      .filter((entry) => fs.existsSync(path.join(necklinesDir, entry.fileName)))
      .map((entry) => ({
        styleId: entry.styleId,
        category: "blazers",
        fileName: entry.fileName,
        imageUrl: this.buildImageUrl(`jewellery/necklines/${entry.fileName}`),
      }));

    const pants: CatalogItem[] = sarees
      .filter((entry) => fs.existsSync(path.join(sareesDir, entry.fileName)))
      .map((entry) => ({
        styleId: entry.styleId,
        category: "pants",
        fileName: entry.fileName,
        imageUrl: this.buildImageUrl(`jewellery/sarees/${entry.fileName}`),
      }));

    this.catalog = {
      blazers,
      shirts: [],
      pants,
      shoes: [],
    };

    return this.catalog;
  }

  clearCache(): void {
    this.catalog = null;
  }
}

export const catalogService = new CatalogService();

