import { apiClient } from "@/config/api";

export type SuitCategoryKey = "blazers" | "shirts" | "pants" | "shoes";

export interface CatalogItem {
  styleId: string;
  category: SuitCategoryKey;
  imageUrl: string;
}

export interface CatalogResult {
  blazers: CatalogItem[];
  shirts: CatalogItem[];
  pants: CatalogItem[];
  shoes: CatalogItem[];
}

class CatalogService {
  async getCatalog(): Promise<CatalogResult> {
    return apiClient.get<CatalogResult>("/api/catalog");
  }
}

export const catalogService = new CatalogService();

