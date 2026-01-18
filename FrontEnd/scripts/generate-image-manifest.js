/**
 * Script to generate image manifest from Backend/images folder
 * Run with: node scripts/generate-image-manifest.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagesDir = path.join(__dirname, '../Backend/images');
const manifestPath = path.join(__dirname, '../public/Backend/images-manifest.json');

function generateManifest() {
  const manifest = {};
  
  try {
    const styleDirs = fs.readdirSync(imagesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    for (const styleId of styleDirs) {
      const styleDir = path.join(imagesDir, styleId);
      const imageFiles = fs.readdirSync(styleDir)
        .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
        .sort(); // Sort for consistent ordering
      
      if (imageFiles.length > 0) {
        manifest[styleId] = imageFiles.map(file => `${styleId}/${file}`);
      }
    }
    
    // Write manifest to public folder
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`✅ Generated image manifest with ${Object.keys(manifest).length} styleIds`);
    console.log(`   Total images: ${Object.values(manifest).reduce((sum, arr) => sum + arr.length, 0)}`);
    
  } catch (error) {
    console.error('Error generating manifest:', error);
    process.exit(1);
  }
}

generateManifest();
