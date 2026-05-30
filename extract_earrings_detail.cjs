const fs = require("fs");
const path = require("path");
const PNG = require("pngjs").PNG;

const filepath = path.join(__dirname, "ear_original.png");
const buffer = fs.readFileSync(filepath);
const png = PNG.sync.read(buffer);

const w = png.width;
const h = png.height;

function getPixel(x, y) {
  const idx = (w * y + x) << 2;
  return {
    r: png.data[idx],
    g: png.data[idx + 1],
    b: png.data[idx + 2],
    a: png.data[idx + 3]
  };
}

// Let's print a finer grid in the region where the earrings are likely located.
// Earrings are suspended from the branch.
// Let's scan y from 300 to 750, x from 200 to 900.
const startX = 200;
const endX = 900;
const startY = 300;
const endY = 750;

const gridRows = 30;
const gridCols = 40;
const stepX = Math.floor((endX - startX) / gridCols);
const stepY = Math.floor((endY - startY) / gridRows);

console.log("Fine Grid map of earrings region (X = foreground, . = background):");
for (let r = 0; r < gridRows; r++) {
  let line = "";
  for (let c = 0; c < gridCols; c++) {
    let foregroundCount = 0;
    const cy_start = startY + r * stepY;
    const cx_start = startX + c * stepX;
    for (let y = cy_start; y < cy_start + stepY; y++) {
      for (let x = cx_start; x < cx_start + stepX; x++) {
        const p = getPixel(x, y);
        // Purple is characterized by very low green compared to red and blue, and overall dark.
        // Let's use a robust background check:
        // Background has R around 20-30, G around 8-15, B around 20-30.
        // Foreground has much brighter gold (R > 120, G > 90, B > 50) or white pearl (R > 180, G > 180, B > 180).
        const isBackground = p.r < 45 && p.g < 30 && p.b < 45;
        if (!isBackground) {
          foregroundCount++;
        }
      }
    }
    const ratio = foregroundCount / (stepX * stepY);
    line += ratio > 0.15 ? "X" : ".";
  }
  console.log(line);
}
