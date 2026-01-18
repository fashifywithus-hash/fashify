/**
 * Type definitions for inventory items and user preferences
 */

export interface InventoryItem {
  description: string;
  category: string;
  type: string;
  color: string;
  itemLink: string;
  styleId: string;
  mainCategory: string;
  subCategory: string;
  gender: string;
  baseColor: string;
  colorFamily: string;
  weatherMin: number; // 1 = hot, 5 = very cold
  weatherMax: number; // 1 = hot, 5 = very cold
  styleTags: string[];
  lifestyleTags: string[];
  bodyTypeFit: string;
  skinUndertone: string;
  formalityScore: number;
  layerLevel: number;
}

export interface UserPreferences {
  gender: string; // "male" | "female"
  weather: number; // 0-100 slider (0 = extremely cold, 100 = very hot)
  lifestyle: string; // "formal" | "casual" | "athletic"
  bodyType: string; // "slim" | "athletic" | "average" | "muscular" | "curvy" | "plus"
  height: number; // 140-200 cm
  skinTone: number; // 0-100 slider (0 = dark, 100 = light)
  styles: string[]; // ["streetwear", "minimal", "classic", "trendy", "smart-casual", "party"]
}

export interface ScoredItem extends InventoryItem {
  score: number;
  matchDetails: {
    genderMatch: number;
    weatherMatch: number;
    lifestyleMatch: number;
    bodyTypeMatch: number;
    styleMatch: number;
    skinToneMatch: number;
  };
}

export interface RecommendationResult {
  shirts: ScoredItem[];
  jackets: ScoredItem[];
  jeans: ScoredItem[];
  shoes: ScoredItem[];
}
