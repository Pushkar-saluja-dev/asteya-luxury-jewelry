const fs = require("fs");
const path = require("path");
const PNG = require("pngjs").PNG;

const filepath = path.join(__dirname, "ear_original.png");
const buffer = fs.readFileSync(filepath);
const png = PNG.sync.read(buffer);

const w = png.width;
const h = png.height;

// A pixel is background if it's purple.
// Purple in this image is generally R in [50, 100], G in [0, 20], B in [30, 80].
// Let's print out the average color of the corners first.
const cornerColors = [
  getPixel(0, 0),
  getPixel(w - 1, 0),
  getPixel(0, h - 1),
  getPixel(w - 1, h - 1)
];

console.log("Corner colors:", cornerColors);

function getPixel(x, y) {
  const idx = (w * y + x) << 2;
  return {
    r: png.data[idx],
    g: png.data[idx + 1],
    b: png.data[idx + 2],
    a: png.data[idx + 3]
  };
}

// Let's count non-background pixels in a grid
const gridRows = 20;
const gridCols = 20;
const cellW = Math.floor(w / gridCols);
const cellH = Math.floor(h / gridRows);

console.log("\nGrid map of non-background pixels (X is foreground, . is background):");
for (let r = 0; r < gridRows; r++) {
  let line = "";
  for (let c = 0; c < gridCols; c++) {
    let foregroundCount = 0;
    for (let y = r * cellH; y < (r + 1) * cellH; y++) {
      for (let x = c * cellW; x < (c + 1) * cellW; x++) {
        const p = getPixel(x, y);
        // If it's NOT deep purple
        const isPurple = p.r < 110 && p.g < 50 && p.b < 90 && (p.r > p.g * 1.5) && (p.b > p.g * 1.2);
        if (!isPurple) {
          foregroundCount++;
        }
      }
    }
    const ratio = foregroundCount / (cellW * cellH);
    line += ratio > 0.15 ? "X" : ".";
  }
  console.log(line);
}
