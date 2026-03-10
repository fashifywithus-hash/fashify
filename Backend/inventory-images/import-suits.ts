import fs from "fs";
import path from "path";
import https from "https";
import http from "http";

type SuitCategoryKey = "blazers" | "shirts" | "pants" | "shoes";

interface CsvRow {
  category: string;
  image_url: string;
  style_id?: string;
}

interface CatalogItem {
  styleId: string;
  category: SuitCategoryKey;
  fileName: string;
}

interface SuitCatalog {
  blazers: CatalogItem[];
  shirts: CatalogItem[];
  pants: CatalogItem[];
  shoes: CatalogItem[];
}

const INVENTORY_ROOT = path.resolve(__dirname);
const CATALOG_PATH = path.join(INVENTORY_ROOT, "suit_catalog.json");
const DEFAULT_CSV = path.join(INVENTORY_ROOT, "suit_inventory.csv");

function normalizeCategory(raw: string): SuitCategoryKey | null {
  const value = raw.trim().toLowerCase();
  if (value === "blazer" || value === "blazers" || value === "jacket" || value === "jackets") return "blazers";
  if (value === "shirt" || value === "shirts") return "shirts";
  if (value === "pant" || value === "pants" || value === "trouser" || value === "trousers") return "pants";
  if (value === "shoe" || value === "shoes") return "shoes";
  return null;
}

function readCsv(filePath: string): CsvRow[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV file not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(",");
    if (parts.length < 2) continue;

    const record: any = {};
    for (let j = 0; j < header.length && j < parts.length; j++) {
      record[header[j]] = parts[j].trim();
    }

    if (!record.category || !record.image_url) continue;

    rows.push({
      category: record.category,
      image_url: record.image_url,
      style_id: record.style_id || record.styleid || undefined,
    });
  }

  return rows;
}

function loadExistingCatalog(): SuitCatalog {
  if (!fs.existsSync(CATALOG_PATH)) {
    return { blazers: [], shirts: [], pants: [], shoes: [] };
  }
  const raw = fs.readFileSync(CATALOG_PATH, "utf8");
  const parsed = JSON.parse(raw);
  return {
    blazers: parsed.blazers || [],
    shirts: parsed.shirts || [],
    pants: parsed.pants || [],
    shoes: parsed.shoes || [],
  };
}

function ensureCategoryFolder(category: SuitCategoryKey): string {
  const dir = path.join(INVENTORY_ROOT, category);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function extractIndex(styleId: string): number | null {
  const m = styleId.match(/_(\d+)$/);
  if (!m) return null;
  return parseInt(m[1], 10);
}

function nextStyleId(category: SuitCategoryKey, existing: CatalogItem[]): string {
  const prefix =
    category === "blazers"
      ? "BLZ"
      : category === "shirts"
      ? "SHRT"
      : category === "pants"
      ? "PANT"
      : "SHOE";

  const maxIndex = existing
    .map((item) => extractIndex(item.styleId))
    .filter((n): n is number => typeof n === "number" && !Number.isNaN(n))
    .reduce((max, n) => Math.max(max, n), 0);

  const next = maxIndex + 1;
  const padded = String(next).padStart(3, "0");
  return `${prefix}_${padded}`;
}

function downloadImage(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const protocol = parsed.protocol === "https:" ? https : http;

    const file = fs.createWriteStream(dest);
    const request = protocol.get(parsed, (response) => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        fs.unlink(dest, () => {
          downloadImage(response.headers.location as string, dest).then(resolve).catch(reject);
        });
        return;
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {
          reject(new Error(`Failed to download ${url}: ${response.statusCode} ${response.statusMessage}`));
        });
        return;
      }

      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    });

    request.on("error", (err) => {
      file.close();
      if (fs.existsSync(dest)) {
        fs.unlinkSync(dest);
      }
      reject(err);
    });

    file.on("error", (err) => {
      file.close();
      if (fs.existsSync(dest)) {
        fs.unlinkSync(dest);
      }
      reject(err);
    });
  });
}

async function main() {
  const csvPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_CSV;
  console.log(`📄 Using CSV: ${csvPath}`);

  const rows = readCsv(csvPath);
  if (rows.length === 0) {
    console.log("No rows found in CSV. Nothing to import.");
    return;
  }

  let catalog = loadExistingCatalog();

  let imported = 0;
  let skipped = 0;
  const errors: { row: CsvRow; error: string }[] = [];

  for (const row of rows) {
    const category = normalizeCategory(row.category);
    if (!category) {
      console.warn(`Skipping row with unknown category: ${row.category}`);
      skipped++;
      continue;
    }

    const targetList = catalog[category];
    let styleId = row.style_id;
    if (!styleId) {
      styleId = nextStyleId(category, targetList);
    }

    // Skip if styleId already exists in catalog
    if (targetList.some((item) => item.styleId === styleId)) {
      console.log(`⏭️  Skipping existing styleId ${styleId} in category ${category}`);
      skipped++;
      continue;
    }

    const folder = ensureCategoryFolder(category);
    const fileName = `${styleId}.jpg`;
    const destPath = path.join(folder, fileName);

    try {
      console.log(`📥 Downloading ${row.image_url} -> ${category}/${fileName}`);
      await downloadImage(row.image_url, destPath);

      targetList.push({
        styleId,
        category,
        fileName,
      });
      imported++;
    } catch (err: any) {
      console.error(`❌ Failed to download image for styleId ${styleId}: ${err.message}`);
      errors.push({ row, error: err.message });
    }
  }

  // Persist updated catalog
  catalog = {
    blazers: catalog.blazers,
    shirts: catalog.shirts,
    pants: catalog.pants,
    shoes: catalog.shoes,
  };

  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), "utf8");

  console.log("\n📈 Import summary");
  console.log(`Imported: ${imported}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log("\n❌ Errors:");
    for (const e of errors) {
      console.log(`- category=${e.row.category}, url=${e.row.image_url}, error=${e.error}`);
    }
  }
}

// Execute when run directly
if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  main().catch((err) => {
    console.error("❌ Import failed:", err);
    process.exit(1);
  });
}

