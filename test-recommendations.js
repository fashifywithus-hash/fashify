/**
 * Test script to debug recommendation system
 * Run with: node test-recommendations.js
 */

// Mock the CSV content (first few lines)
const csvContent = `Description,Category,Type,Color,Item Link,StyleId,Main_Category,Sub_Category,Gender,Base_Color,Color_Family,"Weather_Min
hot","Weather_Max
cold","Style_Tags
🛹 Streetwear ⬜ Minimal 👔 Classic ✨ Trendy 🎩 Smart Casual 🎉  Party
","Lifestyle_Tags
formal, casual, athletic
",Body_Type_Fit,Skin_Undertone,Formality_Score,Layer_Level
blue shirt,Tshirt/Shirt,Formal,blue,myntra.com/29066024,29066024,Inner_Top,Shirt,Male,Navy Blue,Blue,2,4,"[""Smart Casual"", ""Classic""]","[""Casual""]",Average,Neutral,7,0
illusion print shirt,Tshirt/Shirt,Casual,white and black,myntra.com/35888507,35888507,Inner_Top,Shirt,Male,Off White,White,1,3,"[""Trendy"", ""Smart Casual""]","[""Casual""]",Average,Neutral,6,0
red check shirt,Tshirt/Shirt,Casual,red black,myntra.com/17357388,17357388,Inner_Top,Shirt,Male,Red,Red,3,4,"[""Casual"", ""Trendy""]","[""Casual""]",Average,Warm,3,0
hard shirt jacket type,Tshirt/Shirt,Casual,dark green,myntra.com/22010638,22010638,Inner_Top,Shirt,Male,Teal,Green,2,4,"[""Classic"", ""Smart Casual""]","[""Casual""]",Average,Neutral,6,0
check shirt tartan,Tshirt/Shirt,Casual,yellow and blue,myntra.com/24681706,24681706,Inner_Top,Shirt,Male,Multi,Multi,2,4,"[""Trendy"", ""Smart Casual""]","[""Casual""]",Average,Warm,4,0
brown shirt,Tshirt/Shirt,Formal,brown,myntra.com/34885700,34885700,Inner_Top,Shirt,Male,Brown,Brown,1,4,"[""Classic"", ""Smart Casual""]","[""Casual""]",Average,Warm,7,0
blue shirt,Tshirt/Shirt,Formal,blue,myntra.com/24842568,24842568,Inner_Top,Shirt,Male,Light Blue,Blue,2,4,"[""Classic"", ""Smart Casual""]","[""Formal"", ""Casual""]",Average,Cool,8,0
pink shirt,Tshirt/Shirt,Formal,pink,myntra.com/24842554,24842554,Inner_Top,Shirt,Male,Pink,Pink,1,4,"[""Smart Casual"", ""Classic""]","[""Casual"", ""Formal""]",Average,Warm,7,0
blue line shirt,Tshirt/Shirt,Formal,blue,myntra.com/25942874,25942874,Inner_Top,Shirt,Male,Light Blue,Blue,2,4,"[""Classic"", ""Smart Casual""]","[""Casual"", ""Formal""]",Slim,Cool,7,0
brown denim jacket,Jacket,Semi-formal,brown,myntra.com/31014875,31014875,Outerwear,Jacket,Male,Brown,Brown,3,4,"[""Classic"", ""Smart Casual""]","[""Casual""]",Average,Warm,5,1
padded jacket,Jacket,Casual,Navy blue,myntra.com/11846940,11846940,Outerwear,Jacket,Male,Navy Blue,Blue,3,5,"[""Trendy"", ""Smart Casual""]","[""Casual""]",Average,Neutral,4,1
bomber jacket,Jacket,Casual,slight lightly blue,myntra.com/26146744,26146744,Outerwear,Jacket,Male,Steel Blue,Blue,3,4,"[""Minimal"", ""Classic"", ""Smart Casual""]","[""Casual""]",Average,Neutral,4,1
bomber,Jacket,Casual,green light,myntra.com/28641796,28641796,Outerwear,Jacket,Male,Light Grey,Grey,2,4,"[""Minimal"", ""Smart Casual"", ""Trendy""]","[""Casual""]",Average,Neutral,5,1
leather jacket,Jacket,Semi-formal,brown,myntra.com/31162118,31162118,Outerwear,Jacket,Male,Dark Brown,Brown,3,5,"[""Classic"", ""Smart Casual"", ""Trendy""]","[""Casual""]",Average,Warm,6,1
fur jacket,Jacket,Casual,purple,myntra.com/33187095,33187095,Outerwear,Jacket,Male,Navy Blue,Blue,3,5,"[""Trendy"", ""Casual""]","[""Casual""]",Average,Neutral,3,1
puffer jacket,Jacket,Casual,blue tone,myntra.com/33570152,33570152,Outerwear,Puffer Jacket,Male,Teal,Blue,4,5,"[""Streetwear"", ""Trendy"", ""Casual""]","[""Casual""]",Average,Neutral,3,1
varsity,Jacket,Casual,black and purple,myntra.com/38545169,38545169,Outerwear,Jacket,Male,Black,Black,3,5,"[""Streetwear"", ""Trendy"", ""Smart Casual""]","[""Casual""]",Average,Neutral,4,1
sport jacket,Jacket,Casual,blue white,myntra.com/31282156,31282156,Outerwear,Jacket,Male,Navy Blue,Blue,3,5,"[""Trendy"", ""Streetwear"", ""Athletic""]","[""Casual"", ""Athletic""]",Average,Neutral,3,1
varsity jacket,Jacket,Casual,green white,myntra.com/31400852,31400852,Outerwear,Jacket,Male,Green,Green,2,4,"[""Streetwear"", ""Trendy"", ""Classic""]","[""Casual""]",Average,Neutral,3,1
denim jeans,Jeans,Casual,dark blue,myntra.com/25756782,25756782,Bottom,Jeans,Male,Navy Blue,Blue,2,4,"[""Classic"", ""Smart Casual""]","[""Casual""]",Average,Neutral,4,0
denim jeans,Jeans,Casual,grey,myntra.com/27367934,27367934,Bottom,Jeans,Male,Charcoal,Grey,2,4,"[""Streetwear"", ""Trendy"", ""Casual""]","[""Casual""]",Average,Neutral,3,0
denim jeans,Jeans,Casual,black,myntra.com/20412344,20412344,Outerwear,Hoodie,Male,Grey,Grey,3,5,"[""Casual"", ""Trendy""]","[""Casual""]",Average,Neutral,2,1
denim jeans,Jeans,Casual,light blue green,myntra.com/27368004,27368004,Bottom,Jeans,Male,Light Blue,Blue,2,4,"[""Casual"", ""Classic""]","[""Casual""]",Average,Neutral,3,0
cargo,Jeans,Semi-formal,brown,myntra.com/32899457,32899457,Bottom,Pants,Male,Khaki,Brown,2,4,"[""Casual"", ""Trendy""]","[""Casual""]",Average,Warm,3,0
cargos,Jeans,Casual,gray,myntra.com/34142519,34142519,Bottom,Cargo Pants,Male,Charcoal,Grey,2,4,"[""Streetwear"", ""Trendy""]","[""Casual""]",Average,Neutral,3,0
baggy trouser,Jeans,Casual,dark green,myntra.com/32319573,32319573,Bottom,Cargo Pants,Male,Olive Green,Green,2,4,"[""Streetwear"", ""Trendy"", ""Casual""]","[""Casual""]",Average,Neutral,2,0
white cargo,Jeans,Casual,white off,myntra.com/30195759,30195759,Bottom,Cargo Pants,Male,Off White,Beige,2,4,"[""Streetwear"", ""Trendy"", ""Smart Casual""]","[""Casual""]",Average,Warm,4,0
trouser,Jeans,Formal,dark blue,myntra.com/32250283,32250283,Bottom,Dress Pants,Male,Navy Blue,Blue,2,4,"[""Classic"", ""Smart Casual""]","[""Formal""]",Slim,Neutral,8,0
trouser office,Jeans,Formal,black,myntra.com/31685380,31685380,Bottom,Dress Pants,Male,Charcoal,Grey,3,5,"[""Classic"", ""Smart Casual""]","[""Formal""]",Average,Neutral,8,0
trouser,Jeans,Semi-formal,grey,myntra.com/31805304,31805304,Bottom,Pants,Male,Grey,Grey,2,4,"[""Smart Casual"", ""Classic""]","[""Casual""]",Average,Neutral,6,0
sport shoe,Shoes,Casual,green,myntra.com/36328274,36328274,Shoes,Sneakers,Male,Black,Black,2,4,"[""Minimal"", ""Streetwear"", ""Trendy"", ""Athletic""]","[""Casual"", ""Athletic""]",Average,Neutral,2,0
shoe Balck sport,Shoes,Casual,black,myntra.com/33026384,33026384,Shoes,Sneakers,Male,Black,Black,1,3,"[""Trendy"", ""Streetwear"", ""Athletic""]","[""Casual"", ""Athletic""]",Average,Neutral,2,0
sneaker,Shoes,Semi-formal,brown,myntra.com/37666546,37666546,Shoes,Sneakers,Unisex,White,White,1,4,"[""Trendy"", ""Streetwear"", ""Athletic""]","[""Casual"", ""Athletic""]",Average,Neutral,2,0
shoe formal black,Shoes,Formal,black,myntra.com/15335816,15335816,Shoes,Oxfords,Male,Black,Black,2,4,"[""Classic"", ""Smart Casual"", ""Formal""]","[""Formal""]",Average,Neutral,9,0
formal shoe,Shoes,Formal,brown,myntra.com/27258244,27258244,Shoes,Oxfords,Male,Brown,Brown,2,4,"[""Classic"", ""Smart Casual"", ""Formal""]","[""Formal""]",Average,Warm,9,0
HOODIE,Jacket,Casual,BROWN,myntra.com/36341298,36341298,Inner_Top,Hoodie,Male,Dark Brown,Brown,3,5,"[""Casual"", ""Trendy"", ""Streetwear""]","[""Casual""]",Average,Warm,2,0
HOODIE,Jacket,Casual,WHITE,myntra.com/31913889,31913889,Inner_Top,Hoodie,Male,Off White,White,2,4,"[""Streetwear"", ""Minimal"", ""Trendy"", ""Casual""]","[""Casual""]",Average,Neutral,2,1
SWEATER,Jacket,Semi-formal,GREEN,myntra.com/37198995,37198995,Inner_Top,Sweater,Male,Forest Green,Green,3,5,"[""Classic"", ""Smart Casual""]","[""Casual""]",Average,Warm,5,1`;

// Simple CSV parser (simplified version)
function parseCSVLine(line) {
  const result = [];
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

function parseJSONArray(str) {
  if (!str || str.trim() === "") return [];
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed)) {
      return parsed.map(s => s.toLowerCase().replace(/\s+/g, '-'));
    }
  } catch {
    return str.split(",").map(s => s.trim().replace(/^\[|\]$/g, "").replace(/"/g, "").toLowerCase().replace(/\s+/g, '-'));
  }
  return [];
}

function parseInventoryCSV(csvContent) {
  const lines = csvContent.trim().split("\n");
  let dataStartIndex = 7; // Skip header
  
  for (let i = 1; i < Math.min(lines.length, 15); i++) {
    const line = lines[i].trim();
    if (!line || !line.includes(',')) continue;
    const firstField = line.split(',')[0].trim().toLowerCase();
    const isHeaderLine = 
      firstField.match(/^(description|category|type|color|item|style|main|sub|gender|base|weather|lifestyle|body|skin|formality|layer|hot|cold)$/i) ||
      line.match(/[🛹⬜👔✨🎩🎉]/) ||
      line.toLowerCase().includes('streetwear') ||
      line.toLowerCase().includes('formal, casual') ||
      firstField === '';
    
    if (!isHeaderLine && firstField.length > 2) {
      dataStartIndex = i;
      break;
    }
  }
  
  const dataLines = lines.slice(dataStartIndex);
  const items = [];
  
  for (const line of dataLines) {
    if (!line.trim()) continue;
    try {
      const parsed = parseCSVLine(line);
      if (parsed.length < 19) continue;
      
      const item = {
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
      console.error("Error parsing line:", line, error.message);
    }
  }
  
  return items;
}

// Test preferences (simulating a male user)
const testPreferences = {
  gender: "male",
  weather: 50, // Mild weather (middle of slider)
  lifestyle: "casual",
  bodyType: "average",
  height: 175,
  skinTone: 50, // Neutral
  styles: ["casual", "classic", "smart-casual"]
};

console.log("=".repeat(60));
console.log("TESTING RECOMMENDATION SYSTEM");
console.log("=".repeat(60));
console.log("\n📋 Test User Preferences:");
console.log(JSON.stringify(testPreferences, null, 2));

console.log("\n📦 Step 1: Parsing CSV...");
const inventory = parseInventoryCSV(csvContent);
console.log(`✅ Parsed ${inventory.length} items from CSV`);

console.log("\n📊 Step 2: Analyzing Inventory...");
const genders = [...new Set(inventory.map(i => i.gender))];
const categories = [...new Set(inventory.map(i => i.category))];
console.log(`   Genders: ${genders.join(", ")}`);
console.log(`   Categories: ${categories.join(", ")}`);

console.log("\n🎯 Step 3: Testing Category Matching...");
const testCategories = {
  shirts: ["tshirt", "shirt"],
  jackets: ["jacket", "hoodie", "sweater", "puffer"],
  jeans: ["jean", "pant", "cargo", "trouser"],
  shoes: ["shoe", "sneaker", "oxford"]
};

for (const [name, keywords] of Object.entries(testCategories)) {
  const matches = inventory.filter(item => {
    const cat = (item.category || "").toLowerCase();
    const main = (item.mainCategory || "").toLowerCase();
    const sub = (item.subCategory || "").toLowerCase();
    return keywords.some(kw => cat.includes(kw) || main.includes(kw) || sub.includes(kw));
  });
  console.log(`   ${name}: ${matches.length} items found`);
  if (matches.length > 0) {
    console.log(`      Examples: ${matches.slice(0, 3).map(m => m.description).join(", ")}`);
  }
}

console.log("\n🔍 Step 4: Testing Gender Matching...");
const genderMatches = inventory.filter(item => {
  const itemGender = (item.gender || "").toLowerCase();
  const userGender = testPreferences.gender.toLowerCase();
  return itemGender === userGender || itemGender === "unisex";
});
console.log(`   Items matching gender "${testPreferences.gender}": ${genderMatches.length} out of ${inventory.length}`);

console.log("\n✅ Test Complete!");
console.log("\n" + "=".repeat(60));
console.log("SUMMARY:");
console.log(`- Total items: ${inventory.length}`);
console.log(`- Gender matches: ${genderMatches.length}`);
console.log(`- Shirts available: ${inventory.filter(i => i.category.toLowerCase().includes("shirt")).length}`);
console.log(`- Jackets available: ${inventory.filter(i => i.category.toLowerCase().includes("jacket") || i.subCategory.toLowerCase().includes("jacket")).length}`);
console.log(`- Jeans available: ${inventory.filter(i => i.category.toLowerCase().includes("jean") || i.category.toLowerCase().includes("pant")).length}`);
console.log(`- Shoes available: ${inventory.filter(i => i.category.toLowerCase().includes("shoe")).length}`);
console.log("=".repeat(60));
