import fs from "fs";
import path from "path";
import https from "https";
import http from "http";

type JewelleryCategoryKey = "necklines" | "sarees";

interface CsvRow {
  style_id: string;
  category: string;
  image_url: string;
}

interface JewelleryCatalogItem {
  styleId: string;
  category: JewelleryCategoryKey;
  fileName: string;
}

interface JewelleryCatalog {
  necklines: JewelleryCatalogItem[];
  sarees: JewelleryCatalogItem[];
}

const INVENTORY_ROOT = path.resolve(__dirname, "..", "inventory-images", "jewellery");
const CATALOG_PATH = path.join(INVENTORY_ROOT, "jewellery_catalog.json");
const DEFAULT_CSV = path.join(INVENTORY_ROOT, "jewellery_inventory.csv");

function normalizeCategory(raw: string): JewelleryCategoryKey | null {
  const value = raw.trim().toLowerCase();
  if (value === "neckline" || value === "necklines" || value === "neck") return "necklines";
  if (value === "saree" || value === "sarees") return "sarees";
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

    const category = record.category;
    const imageUrl = record.image_url;
    const styleId = record.style_id || record.styleid;

    if (!category || !imageUrl) continue;

    rows.push({
      category,
      image_url: imageUrl,
      style_id: styleId,
    });
  }

  return rows;
}

function loadExistingCatalog(): JewelleryCatalog {
  if (!fs.existsSync(CATALOG_PATH)) {
    return { necklines: [], sarees: [] };
  }
  const raw = fs.readFileSync(CATALOG_PATH, "utf8");
  const parsed = JSON.parse(raw);
  return {
    necklines: parsed.necklines || [],
    sarees: parsed.sarees || [],
  };
}

function ensureCategoryFolder(category: JewelleryCategoryKey): string {
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

function nextStyleId(category: JewelleryCategoryKey, existing: JewelleryCatalogItem[]): string {
  const prefix = category === "necklines" ? "NECK" : "SAREE";

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
  console.log(`📄 Using jewellery CSV: ${csvPath}`);

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
    const categoryKey = normalizeCategory(row.category);
    if (!categoryKey) {
      console.warn(`Skipping row with unknown category: ${row.category}`);
      skipped++;
      continue;
    }

    const targetList = catalog[categoryKey];
    let styleId = row.style_id;
    if (!styleId) {
      styleId = nextStyleId(categoryKey, targetList);
    }

    // Skip if styleId already exists in catalog
    if (targetList.some((item) => item.styleId === styleId)) {
      console.log(`⏭️  Skipping existing styleId ${styleId} in category ${categoryKey}`);
      skipped++;
      continue;
    }

    const folder = ensureCategoryFolder(categoryKey);
    const fileName = `${styleId}.jpg`;
    const destPath = path.join(folder, fileName);

    try {
      console.log(`📥 Downloading ${row.image_url} -> ${categoryKey}/${fileName}`);
      await downloadImage(row.image_url, destPath);

      targetList.push({
        styleId,
        category: categoryKey,
        fileName,
      });
      imported++;
    } catch (err: any) {
      console.error(`❌ Failed to download image for styleId ${styleId}: ${err.message}`);
      errors.push({ row, error: err.message });
    }
  }

  // Persist updated jewellery catalog
  catalog = {
    necklines: catalog.necklines,
    sarees: catalog.sarees,
  };

  if (!fs.existsSync(INVENTORY_ROOT)) {
    fs.mkdirSync(INVENTORY_ROOT, { recursive: true });
  }

  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), "utf8");

  console.log("\n📈 Jewellery import summary");
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
    console.error("❌ Jewellery import failed:", err);
    process.exit(1);
  });
}

