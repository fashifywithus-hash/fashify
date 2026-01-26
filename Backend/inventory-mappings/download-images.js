/**
 * Script to download images from style_default_images.csv
 * Downloads images and saves them as {styleId}.jpg in the same directory
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const CSV_FILE = path.join(__dirname, 'style_default_images.csv');
const OUTPUT_DIR = __dirname;

/**
 * Parse CSV file and extract styleId and image URL pairs
 */
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  const data = [];
  
  // Skip header row (line 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Split by comma, but handle URLs that might contain commas
    // CSV format: StyleId,DefaultImageUrl
    const firstCommaIndex = line.indexOf(',');
    if (firstCommaIndex === -1) continue;
    
    const styleId = line.substring(0, firstCommaIndex).trim();
    const imageUrl = line.substring(firstCommaIndex + 1).trim();
    
    if (styleId && imageUrl) {
      data.push({ styleId, imageUrl });
    }
  }
  
  return data;
}

/**
 * Download image from URL
 */
function downloadImage(url, outputPath) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    
    console.log(`📥 Downloading: ${url}`);
    
    const file = fs.createWriteStream(outputPath);
    
    const request = protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(outputPath); // Delete the file
        return downloadImage(response.headers.location, outputPath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(outputPath);
        return reject(new Error(`Failed to download: ${response.statusCode} ${response.statusMessage}`));
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ Saved: ${path.basename(outputPath)}`);
        resolve();
      });
    });
    
    request.on('error', (err) => {
      file.close();
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      reject(err);
    });
    
    file.on('error', (err) => {
      file.close();
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      reject(err);
    });
  });
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Starting image download script...');
    console.log(`📄 Reading CSV from: ${CSV_FILE}`);
    
    // Check if CSV file exists
    if (!fs.existsSync(CSV_FILE)) {
      throw new Error(`CSV file not found: ${CSV_FILE}`);
    }
    
    // Read CSV file
    const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
    const imageData = parseCSV(csvContent);
    
    console.log(`📊 Found ${imageData.length} images to download\n`);
    
    // Download images with delay to avoid overwhelming the server
    let successCount = 0;
    let failCount = 0;
    const failed = [];
    
    for (let i = 0; i < imageData.length; i++) {
      const { styleId, imageUrl } = imageData[i];
      const outputPath = path.join(OUTPUT_DIR, `${styleId}.jpg`);
      
      // Skip if file already exists
      if (fs.existsSync(outputPath)) {
        console.log(`⏭️  Skipping ${styleId}.jpg (already exists)`);
        successCount++;
        continue;
      }
      
      try {
        await downloadImage(imageUrl, outputPath);
        successCount++;
        
        // Add small delay between downloads to be respectful to the server
        if (i < imageData.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
        }
      } catch (error) {
        console.error(`❌ Failed to download ${styleId}: ${error.message}`);
        failCount++;
        failed.push({ styleId, imageUrl, error: error.message });
      }
    }
    
    console.log('\n📈 Download Summary:');
    console.log(`✅ Successfully downloaded: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    
    if (failed.length > 0) {
      console.log('\n❌ Failed downloads:');
      failed.forEach(({ styleId, imageUrl, error }) => {
        console.log(`   - ${styleId}: ${error}`);
      });
    }
    
    console.log('\n✨ Script completed!');
  } catch (error) {
    console.error('❌ Script error:', error);
    process.exit(1);
  }
}

// Run the script
main();

