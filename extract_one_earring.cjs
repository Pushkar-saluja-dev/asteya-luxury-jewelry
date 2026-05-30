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

// We want to key out the dark purple background.
// Corner colors are around R: 21, G: 9, B: 24.
// Let's sample a few background points around the earring to get a solid range.
// We can use a distance check from the dark purple.
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
    // Dark purple background pixels in this image typically have:
    // r < 60, g < 35, b < 60
    // And to be extremely safe, let's check distance to the dark purple corner color (22, 9, 25).
    const distToBg = Math.sqrt((r - 22) ** 2 + (g - 9) ** 2 + (b - 25) ** 2);
    
    // We can also check if the pixel is a shadow on the purple background.
    // Shadows are extremely dark (R < 35, G < 20, B < 35).
    const isVeryDarkBg = r < 35 && g < 20 && b < 35;
    
    let isBg = false;
    if (distToBg < 45 || isVeryDarkBg) {
      isBg = true;
    }
    
    // Let's do an extra check: the gold/pearl earring is bright, so anything with r > 80 or g > 65 or b > 65 is definitely foreground.
    if (r > 80 || g > 65 || b > 65) {
      isBg = false;
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
console.log(`Successfully extracted right heart earring to ${outputPath}`);
