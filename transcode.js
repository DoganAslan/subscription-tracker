const sharp = require('sharp');
const fs = require('fs');

async function transcode() {
  try {
    const imagePath = './assets/images/logo.png';
    const tempPath = './assets/images/logo_temp.png';
    console.log(`Reading ${imagePath}...`);
    
    await sharp(imagePath)
      .png()
      .toFile(tempPath);
      
    console.log(`Successfully parsed image. Writing back as pure PNG...`);
    fs.renameSync(tempPath, imagePath);
    console.log(`Transcode complete. logo.png is now a valid PNG file.`);
  } catch (err) {
    console.error("Transcode failed:", err);
  }
}

transcode();
