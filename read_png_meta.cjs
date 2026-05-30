const fs = require("fs");
const path = require("path");
const PNG = require("pngjs").PNG;

const filepath = path.join(__dirname, "ear_original.png");
const buffer = fs.readFileSync(filepath);

const png = PNG.sync.read(buffer);
console.log("Image width:", png.width);
console.log("Image height:", png.height);
console.log("Color type:", png.colorType);
