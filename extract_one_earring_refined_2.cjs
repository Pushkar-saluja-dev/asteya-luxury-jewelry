const fs = require("fs");
const path = require("path");
const PNG = require("pngjs").PNG;

const filepath = path.join(__dirname, "ear_original.png");
const buffer = fs.readFileSync(filepath);
const png = PNG.sync.read(buffer);

const w = png.width;
const h = png.height;

// Bounding box for the right earring (crop bounds)
const xmin = 535;
const xmax = 845;
const ymin = 435;
const ymax = 745;

const cropW = xmax - xmin;
const cropH = ymax - ymin;

const outPng = new PNG({
  width: cropW,
  height: cropH,
  colorType: 6 // RGBA
});

for (let y = 0; y < cropH; y++) {
  for (let x = 0; x < cropW; x++) {
    const srcX = xmin + x;
    const srcY = ymin + y;
    const srcIdx = (w * srcY + srcX) << 2;
    
    const r = png.data[srcIdx];
    const g = png.data[srcIdx + 1];
    const b = png.data[srcIdx + 2];
    const a = png.data[srcIdx + 3];
    
    const outIdx = (cropW * y + x) << 2;
    
    // Check if the pixel is background (dark purple)
    const distToBg = Math.sqrt((r - 22) ** 2 + (g - 9) ** 2 + (b - 25) ** 2);
    const isVeryDarkBg = r < 35 && g < 20 && b < 35;
    
    let isBg = false;
    if (distToBg < 45 || isVeryDarkBg) {
      isBg = true;
    }
    
    // Bright foreground check
    if (r > 80 || g > 65 || b > 65) {
      isBg = false;
    }
    
    // Clean up branch in the very top-left corner (x < 110, y < 40)
    // This removes the branch but keeps the heart (which starts lower down)
    if (x < 110 && y < 40) {
      isBg = true;
    }
    
    // Clean up any remaining branch details in the very top row (y < 20)
    if (y < 20 && x < 150) {
      isBg = true;
    }
    
    if (isBg) {
      outPng.data[outIdx] = 0;
      outPng.data[outIdx + 1] = 0;
      outPng.data[outIdx + 2] = 0;
      outPng.data[outIdx + 3] = 0; // Transparent
    } else {
      outPng.data[outIdx] = r;
      outPng.data[outIdx + 1] = g;
      outPng.data[outIdx + 2] = b;
      outPng.data[outIdx + 3] = a; // Opaque
    }
  }
}

const outputPath = path.join(__dirname, "ear_tryon_heart.png");
const outBuffer = PNG.sync.write(outPng);
fs.writeFileSync(outputPath, outBuffer);
console.log(`Successfully extracted refined heart earring to ${outputPath}`);
