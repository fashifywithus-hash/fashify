/**
 * Recommendation Service - Main service for getting outfit recommendations
 * BACKEND LOGIC - Orchestrates scoring and item selection
 */

import { loadInventoryFromCSV } from "../core/csvParser";
import { ScoringEngine } from "../core/scoringEngine";
import { logger } from "../utils/logger";
import type { UserPreferences, RecommendationResult, InventoryItem } from "../types/inventory";

class RecommendationService {
  private inventory: InventoryItem[] | null = null;
  private scoringEngine: ScoringEngine;

  constructor() {
    this.scoringEngine = new ScoringEngine();
  }

  /**
   * Load inventory data (cached after first load)
   */
  async loadInventory(): Promise<InventoryItem[]> {
    if (this.inventory) {
      return this.inventory;
    }

    try {
      this.inventory = await loadInventoryFromCSV();
      return this.inventory;
    } catch (error) {
      logger.error("Failed to load inventory", error);
      throw new Error("Failed to load inventory data");
    }
  }

  /**
   * Get top recommendations for each category
   */
  async getRecommendations(preferences: UserPreferences): Promise<RecommendationResult> {
    const inventory = await this.loadInventory();
    logger.info("Loaded items from inventory", { count: inventory.length });
    logger.info("User preferences", preferences);
    
    // Check inventory genders for debugging
    const genders = [...new Set(inventory.map(item => item.gender))];
    logger.info("Available genders in inventory", { genders, userGender: preferences.gender });
    
    // Score all items - will ALWAYS return items sorted by score (even with low scores)
    const scoredItems = this.scoringEngine.scoreItems(inventory, preferences);
    logger.info("Scored items", { scored: scoredItems.length, total: inventory.length });
    
    // Log top scored items for debugging
    if (scoredItems.length > 0) {
      logger.info("Top 5 scored items", {
        items: scoredItems.slice(0, 5).map(item => ({
          description: item.description,
          category: item.category,
          gender: item.gender,
          score: item.score.toFixed(2)
        }))
      });
    } else {
      logger.error("No items scored! This should never happen.");
    }
    
    // ALWAYS get top 4 from each category - even if scores are very low
    // This ensures we ALWAYS show recommendations as long as items exist in the category
    const shirts = this.getTopItemsByCategory(scoredItems, ["tshirt", "shirt"], 4);
    const jackets = this.getTopItemsByCategory(scoredItems, ["jacket", "hoodie", "sweater", "puffer"], 4);
    const jeans = this.getTopItemsByCategory(scoredItems, ["jean", "pant", "cargo", "trouser"], 4);
    const shoes = this.getTopItemsByCategory(scoredItems, ["shoe", "sneaker", "oxford"], 4);
    
    logger.info("Final recommendations", {
      shirts: shirts.length,
      jackets: jackets.length,
      jeans: jeans.length,
      shoes: shoes.length,
    });
    
    // Log if any category is empty (should help debug)
    if (shirts.length === 0) logger.info("No shirts found in inventory matching keywords", { keywords: ["tshirt", "shirt"] });
    if (jackets.length === 0) logger.info("No jackets found in inventory matching keywords", { keywords: ["jacket", "hoodie", "sweater", "puffer"] });
    if (jeans.length === 0) logger.info("No jeans found in inventory matching keywords", { keywords: ["jean", "pant", "cargo", "trouser"] });
    if (shoes.length === 0) logger.info("No shoes found in inventory matching keywords", { keywords: ["shoe", "sneaker", "oxford"] });
    
    return {
      shirts,
      jackets,
      jeans,
      shoes,
    };
  }

  /**
   * Get top N items from a specific category
   * ALWAYS returns top N items if they exist, even if scores are very low
   * This ensures we never return empty results as long as items exist in the category
   */
  private getTopItemsByCategory(
    scoredItems: any[],
    categoryKeywords: string[],
    limit: number
  ): any[] {
    // Filter items matching this category
    const filtered = scoredItems.filter(item => {
      const category = (item.category || "").toLowerCase();
      const mainCategory = (item.mainCategory || "").toLowerCase();
      const subCategory = (item.subCategory || "").toLowerCase();
      
      // Check if any keyword matches category, mainCategory, or subCategory
      return categoryKeywords.some(keyword => {
        const lowerKeyword = keyword.toLowerCase();
        return (
          category.includes(lowerKeyword) ||
          mainCategory.includes(lowerKeyword) ||
          subCategory.includes(lowerKeyword)
        );
      });
    });
    
    // ALWAYS return top N items if any exist (even if scores are low)
    // Items are already sorted by score (descending) from scoring engine
    const result = filtered.slice(0, limit);
    
    if (result.length > 0) {
      const scores = result.map(r => r.score.toFixed(2)).join(', ');
      logger.info("Category items found", {
        category: categoryKeywords[0],
        found: filtered.length,
        returning: result.length,
        scores,
      });
    } else if (filtered.length === 0) {
      // This means no items in inventory match this category at all
      logger.info("No items found in inventory matching category keywords", {
        category: categoryKeywords[0],
        keywords: categoryKeywords,
      });
    }
    
    return result;
  }

  /**
   * Clear cached inventory (useful for testing or reloading)
   */
  clearCache(): void {
    this.inventory = null;
  }
}

// Export singleton instance
export const recommendationService = new RecommendationService();
