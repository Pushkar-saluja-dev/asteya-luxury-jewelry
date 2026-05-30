const fs = require("fs");
const path = require("path");
const PNG = require("pngjs").PNG;

const filepath = path.join(__dirname, "ear_original.png");
const buffer = fs.readFileSync(filepath);
const png = PNG.sync.read(buffer);

const w = png.width;
const h = png.height;

// Crop region starts at x = 535, y = 435.
// Let's sample a 30x30 region in the top left of the crop (x from 535 to 565, y from 435 to 465)
// which contains the branch and background.
console.log("Sampling top-left region colors:");
for (let y = 435; y < 465; y += 3) {
  let line = "";
  for (let x = 535; x < 565; x += 3) {
    const idx = (w * y + x) << 2;
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    
    // Background is dark purple (e.g. 22, 9, 25).
    // Branch is brown (e.g. 100, 80, 50).
    const isBg = r < 45 && g < 30 && b < 45;
    if (isBg) {
      line += " . ";
    } else {
      line += ` [${r},${g},${b}]`;
    }
  }
  console.log(line);
}
