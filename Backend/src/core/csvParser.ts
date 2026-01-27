/**
 * CSV Parser utility to load and parse inventory data
 * BACKEND LOGIC - Data parsing and loading
 */

import fs from "fs";
import path from "path";
import { logger } from "../utils/logger";
import type { InventoryItem } from "../types/inventory";

/**
 * Parse CSV content into InventoryItem array
 */
export function parseInventoryCSV(csvContent: string): InventoryItem[] {
  const lines = csvContent.trim().split("\n");
  
  // Find the first data row (skip multi-line header)
  // Header spans lines 1-7, data starts at line 8
  // Look for the first line that:
  // 1. Has a proper item description (not a header keyword)
  // 2. Has enough fields (at least 15+ when parsed)
  // 3. Doesn't contain emojis or header keywords
  
  let dataStartIndex = 7; // Default to line 8 (index 7)
  
  // Try to find where actual data starts
  // The CSV header spans lines 1-7, so we start checking from line 2
  for (let i = 1; i < Math.min(lines.length, 15); i++) {
    const line = lines[i].trim();
    if (!line || !line.includes(',')) continue;
    
    // Parse the line to check field count
    const parsed = parseCSVLine(line);
    const firstField = parsed[0]?.trim().toLowerCase() || "";
    
    // Header lines have specific patterns - be very strict here
    // Check multiple conditions to avoid false positives
    const isHeaderKeyword = firstField.match(/^(description|category|type|color|item|style|main|sub|gender|base|weather|lifestyle|body|skin|formality|layer|hot|cold)$/i);
    const hasEmojis = line.match(/[🛹⬜👔✨🎩🎉]/);
    const hasHeaderText = line.toLowerCase().includes('streetwear') || 
                         line.toLowerCase().includes('formal, casual') ||
                         line.toLowerCase().includes('lifestyle_tags') ||
                         line.toLowerCase().includes('weather_max') ||
                         line.toLowerCase().includes('weather_min') ||
                         line.toLowerCase().includes('style_tags');
    const hasFewFields = parsed.length < 15;
    
    const isHeaderLine = isHeaderKeyword || hasEmojis || hasHeaderText || firstField === '' || hasFewFields;
    
    // Data lines must have:
    // - NOT a header keyword
    // - At least 15+ fields when parsed
    // - A real description (contains letters, more than 2 chars)
    // - No emojis
    if (!isHeaderLine && parsed.length >= 15 && firstField.length > 2) {
      // Additional check: first field should look like an item description
      // (contains letters, not just numbers or special chars)
      if (firstField.match(/[a-z]/i) && !firstField.match(/^[\d\s\-]+$/)) {
        dataStartIndex = i;
        logger.info("Found data starting at line", {
          line: i + 1,
          firstField: firstField.substring(0, 30),
          fieldCount: parsed.length,
        });
        break;
      }
    } else if (isHeaderLine) {
      // Log header lines for debugging
      logger.info("Skipping header line", {
        line: i + 1,
        firstField,
        fieldCount: parsed.length,
      });
    }
  }
  
  const dataLines = lines.slice(dataStartIndex);
  logger.info("Processing data lines", {
    count: dataLines.length,
    startLine: dataStartIndex + 1,
  });
  
  const items: InventoryItem[] = [];
  
  for (const line of dataLines) {
    if (!line.trim()) continue;
    
    try {
      // Parse CSV line - handling quoted fields with commas
      const parsed = parseCSVLine(line);
      
      // Check if we have enough fields (should have at least 15 fields)
      // The CSV has 19 fields: Description, Category, Type, Color, Item Link, StyleId, 
      // Main_Category, Sub_Category, Gender, Base_Color, Color_Family, Weather_Min, 
      // Weather_Max, Style_Tags, Lifestyle_Tags, Body_Type_Fit, Skin_Undertone, 
      // Formality_Score, Layer_Level
      if (parsed.length < 15) {
        logger.info("Skipping incomplete row", {
          fieldCount: parsed.length,
          required: 15,
          preview: line.substring(0, 80),
        });
        continue;
      }
      
      // Additional validation: first field should be an item description
      const firstField = parsed[0]?.trim() || "";
      if (!firstField || firstField.length < 2) {
        logger.info("Skipping invalid row (empty first field)");
        continue;
      }
      
      // Skip header keywords
      if (firstField.match(/^(description|category|type|color|item|style|main|sub|gender|base|weather|lifestyle|body|skin|formality|layer|hot|cold)$/i)) {
        logger.info("Skipping header row", { firstField });
        continue;
      }
      
      // Map CSV columns to InventoryItem
      const item: InventoryItem = {
        description: parsed[0] || "",
        category: parsed[1] || "",
        type: parsed[2] || "",
        color: parsed[3] || "",
        itemLink: parsed[4] || "",
        styleId: parsed[5] || "",
        mainCategory: parsed[6] || "",
        subCategory: parsed[7] || "",
        gender: parsed[8] || "",
        baseColor: parsed[9] || "",
        colorFamily: parsed[10] || "",
        weatherMin: parseInt(parsed[11] || "3", 10),
        weatherMax: parseInt(parsed[12] || "5", 10),
        styleTags: parseJSONArray(parsed[13] || "[]"),
        lifestyleTags: parseJSONArray(parsed[14] || "[]"),
        bodyTypeFit: parsed[15] || "Average",
        skinUndertone: parsed[16] || "Neutral",
        formalityScore: parseInt(parsed[17] || "5", 10),
        layerLevel: parseInt(parsed[18] || "0", 10),
      };
      
      items.push(item);
    } catch (error) {
      logger.error("Error parsing CSV line", { line, error });
    }
  }
  
  logger.info("Parsed items from CSV", { count: items.length });
  return items;
}

/**
 * Parse a CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Parse JSON array string (handles both JSON format and simple comma-separated)
 */
function parseJSONArray(str: string): string[] {
  if (!str || str.trim() === "") return [];
  
  // Try parsing as JSON first
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed)) {
      return parsed.map((s: string) => normalizeStyleTag(s));
    }
  } catch {
    // If not JSON, try splitting by comma
    return str.split(",").map(s => normalizeStyleTag(s.trim().replace(/^\[|\]$/g, "").replace(/"/g, "")));
  }
  
  return [];
}

/**
 * Normalize style tags to match user preference format
 */
function normalizeStyleTag(tag: string): string {
  const normalized = tag.trim().toLowerCase();
  
  // Map CSV style tags to user preference format
  const styleMap: Record<string, string> = {
    "streetwear": "streetwear",
    "minimal": "minimal",
    "classic": "classic",
    "trendy": "trendy",
    "smart casual": "smart-casual",
    "party": "party",
  };
  
  return styleMap[normalized] || normalized;
}

/**
 * Load inventory from CSV file
 * Uses Node.js file system to read the CSV file
 */
export async function loadInventoryFromCSV(): Promise<InventoryItem[]> {
  try {
    // Get the path to the CSV file
    // The CSV file is in the BackEnd directory root
    // Try multiple possible locations:
    // 1. Relative to current file (BackEnd/core/ -> BackEnd/)
    // 2. From process.cwd() (should be BackEnd/ when running npm run dev)
    // 3. From project root (if running from different location)
    
    const possiblePaths = [
      path.join(__dirname, "..", "Item-attributes.csv"), // From core/ to BackEnd/
      path.resolve(process.cwd(), "Item-attributes.csv"), // From current working directory
      path.resolve(__dirname, "..", "..", "BackEnd", "Item-attributes.csv"), // From project root
    ];
    
    let csvPath: string | null = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        csvPath = possiblePath;
        break;
      }
    }
    
    if (!csvPath) {
      throw new Error(`CSV file not found. Tried: ${possiblePaths.join(", ")}`);
    }
    
    // Check if file exists
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at: ${csvPath}`);
    }
    
    // Read the CSV file using Node.js file system
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    
    logger.info("Loading inventory from CSV", {
      path: csvPath,
      fileSizeKB: (csvContent.length / 1024).toFixed(2),
    });
    
    return parseInventoryCSV(csvContent);
  } catch (error: any) {
    logger.error("Error loading inventory CSV", error);
    throw new Error(`Failed to load inventory data: ${error.message}`);
  }
}
