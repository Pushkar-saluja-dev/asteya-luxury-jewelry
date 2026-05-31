const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\pushk\\Desktop\\asteya\\asteya-luxury-jewelry\\server.ts';
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
let found = false;
lines.forEach((line, idx) => {
  if (line.includes('/api/ai/tryon')) {
    console.log(`Found "/api/ai/tryon" at Line ${idx + 1}: ${line.trim()}`);
    found = true;
    // View 60 lines below it
    for (let i = idx; i < Math.min(idx + 100, lines.length); i++) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  }
});

if (!found) {
  console.log('Not found "/api/ai/tryon" in server.ts');
}
