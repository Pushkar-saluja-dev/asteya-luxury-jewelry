const fs = require("fs");
const path = require("path");

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== "node_modules" && f !== ".git" && f !== "dist") {
        walkDir(dirPath, callback);
      }
    } else {
      if (f.endsWith(".tsx") || f.endsWith(".ts") || f.endsWith(".cjs") || f.endsWith(".html")) {
        callback(dirPath);
      }
    }
  });
}

console.log("Searching for 'gia' (case-insensitive):");
walkDir(path.join(__dirname), (filePath) => {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes("gia")) {
      console.log(`- ${path.relative(__dirname, filePath)}:L${idx + 1}: ${line.trim()}`);
    }
  });
});
