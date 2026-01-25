/**
 * Outfit Combination Service
 * Orchestrates the three-workflow process for generating outfit combination images
 */

import { geminiService, OutfitCombination } from './geminiService';
import { imageUrlToBase64 } from '../utils/imageUtils';
import { parseImagePayloadCSV, getImageUrlForStyleId } from '../utils/imagePayloadParser';
import { loadInventoryFromCSV } from '../../core/csvParser';
import type { InventoryItem } from '../types/inventory';

export interface SelectedItems {
  shirts: string[]; // Array of styleIds
  jackets: string[];
  jeans: string[];
  shoes: string[];
}

export interface OutfitCombinationResult {
  top_id: string;
  bottom_id: string;
  jacket_id: string;
  shoe_id: string;
  reasoning: string;
  finalImage: string; // Base64 encoded final image
  myntraLinks: {
    top: string;
    bottom: string;
    jacket: string;
    shoe: string;
  };
}

export class OutfitCombinationService {
  private imagePayloadMap: Map<string, string> | null = null;

  /**
   * Initialize image payload map (cache it)
   */
  private async getImagePayloadMap(): Promise<Map<string, string>> {
    if (!this.imagePayloadMap) {
      console.log('📂 Loading image payload map from CSV...');
      this.imagePayloadMap = parseImagePayloadCSV();
    }
    return this.imagePayloadMap;
  }

  /**
   * Build inventory data string from selected items
   */
  private async buildInventoryDataString(selectedItems: SelectedItems): Promise<string> {
    console.log('📊 Building inventory data string from selected items...');
    
    const inventory = await loadInventoryFromCSV();
    const allStyleIds = new Set([
      ...selectedItems.shirts,
      ...selectedItems.jackets,
      ...selectedItems.jeans,
      ...selectedItems.shoes,
    ]);

    const inventoryLines: string[] = [];
    
    for (const item of inventory) {
      if (allStyleIds.has(item.styleId)) {
        const styleTag = item.styleTags && item.styleTags.length > 0 
          ? item.styleTags[0] 
          : 'N/A';
        inventoryLines.push(
          `${item.styleId}, ${item.subCategory}, ${item.color}, ${styleTag}`
        );
      }
    }

    const inventoryData = inventoryLines.join('\n');
    console.log(`✅ Built inventory data string with ${inventoryLines.length} items`);
    return inventoryData;
  }

  /**
   * Get image base64 for a styleId
   */
  private async getImageBase64ForStyleId(styleId: string): Promise<string> {
    const imageMap = await this.getImagePayloadMap();
    const imageUrl = getImageUrlForStyleId(styleId, imageMap);
    
    if (!imageUrl) {
      throw new Error(`No image URL found for styleId: ${styleId}`);
    }

    return await imageUrlToBase64(imageUrl);
  }

  /**
   * Generate outfit combinations with images
   * Main entry point that orchestrates all three workflows
   */
  async generateOutfitCombinations(
    userImageBase64: string,
    selectedItems: SelectedItems
  ): Promise<OutfitCombinationResult[]> {
    console.log('🎨 Starting outfit combination generation process...');
    console.log(`📦 Selected items: ${selectedItems.shirts.length} shirts, ${selectedItems.jackets.length} jackets, ${selectedItems.jeans.length} jeans, ${selectedItems.shoes.length} shoes`);

    try {
      // Workflow 1: Get 6 outfit combinations from Gemini
      console.log('\n=== WORKFLOW 1: Getting outfit combinations ===');
      const inventoryData = await this.buildInventoryDataString(selectedItems);
      const combinations = await geminiService.getOutfitCombinations(
        userImageBase64,
        inventoryData
      );

      console.log(`✅ Got ${combinations.length} outfit combinations from Gemini`);

      // Process each combination through workflows 2 and 3
      const results: OutfitCombinationResult[] = [];

      for (let i = 0; i < combinations.length; i++) {
        const combination = combinations[i];
        console.log(`\n🔄 Processing combination ${i + 1}/${combinations.length}:`);
        console.log(`   Top: ${combination.top_id}, Bottom: ${combination.bottom_id}, Jacket: ${combination.jacket_id}, Shoe: ${combination.shoe_id}`);

        try {
          // Get base64 images for all items
          console.log(`   📥 Fetching images for items...`);
          const [topImage, bottomImage, jacketImage, shoeImage] = await Promise.all([
            this.getImageBase64ForStyleId(combination.top_id),
            this.getImageBase64ForStyleId(combination.bottom_id),
            this.getImageBase64ForStyleId(combination.jacket_id),
            this.getImageBase64ForStyleId(combination.shoe_id),
          ]);

          // Add delay between API calls to avoid rate limits (2 seconds between combinations)
          if (i > 0) {
            console.log(`   ⏳ Waiting 2 seconds before next API call to avoid rate limits...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

          // Workflow 2: Generate base layer (user + top + bottom)
          console.log(`   🎨 [Workflow 2] Generating base layer image...`);
          const baseLayerImage = await geminiService.generateBaseLayerImage(
            userImageBase64,
            topImage,
            bottomImage
          );

          // Add delay between workflow 2 and 3
          console.log(`   ⏳ Waiting 2 seconds before workflow 3...`);
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Workflow 3: Generate final image (base layer + jacket + shoes)
          console.log(`   🎨 [Workflow 3] Generating final image...`);
          const finalImage = await geminiService.generateFinalImage(
            baseLayerImage,
            jacketImage,
            shoeImage
          );

          results.push({
            top_id: combination.top_id,
            bottom_id: combination.bottom_id,
            jacket_id: combination.jacket_id,
            shoe_id: combination.shoe_id,
            reasoning: combination.reasoning,
            finalImage,
            myntraLinks: {
              top: `https://myntra.com/${combination.top_id}`,
              bottom: `https://myntra.com/${combination.bottom_id}`,
              jacket: `https://myntra.com/${combination.jacket_id}`,
              shoe: `https://myntra.com/${combination.shoe_id}`,
            },
          });

          console.log(`   ✅ Successfully generated final image for combination ${i + 1}`);
        } catch (error: any) {
          console.error(`   ❌ Error processing combination ${i + 1}:`, error.message);
          // Continue with next combination even if one fails
        }
      }

      console.log(`\n✅ Successfully generated ${results.length} outfit combination images`);
      return results;
    } catch (error: any) {
      console.error('❌ Error in generateOutfitCombinations:', error.message);
      throw error;
    }
  }
}

export const outfitCombinationService = new OutfitCombinationService();

