import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { tryOnService } from "../src/services/tryOnService";
import { Profile } from "../src/models/Profile";
import mongoose from "mongoose";

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

async function main() {
  const userId = process.argv[2];
  const necklineStyleId = process.argv[3];
  const sareeStyleId = process.argv[4];

  if (!userId || !necklineStyleId || !sareeStyleId) {
    console.error(
      "Usage: ts-node scripts/test-jewellery-tryon.ts <userId> <necklineStyleId> <sareeStyleId>"
    );
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI is not set in environment");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);

  try {
    const profile = await Profile.findOne({ user_id: userId });
    if (!profile || !profile.photo_url) {
      throw new Error("Profile or photo_url not found for user");
    }

    const result = await tryOnService.generateTryOn({
      userPhoto: profile.photo_url,
      necklineStyleId,
      sareeStyleId,
    });

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-");
    const outDir = path.join(
      __dirname,
      "..",
      "tryon-outputs",
      `jewellery-${timestamp}`
    );
    fs.mkdirSync(outDir, { recursive: true });

    const saveDataUrl = (dataUrl: string, fileName: string) => {
      const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
      if (!match) {
        throw new Error(`Invalid data URL for ${fileName}`);
      }
      const base64 = match[2];
      const buffer = Buffer.from(base64, "base64");
      fs.writeFileSync(path.join(outDir, fileName), buffer);
    };

    saveDataUrl(result.viewA, "viewA.png");
    saveDataUrl(result.viewB, "viewB.png");
    saveDataUrl(result.viewC, "viewC.png");

    console.log(`Saved outputs to ${outDir}`);
  } catch (err: any) {
    console.error("Test jewellery try-on failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  main();
}

