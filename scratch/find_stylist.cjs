const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\pushk\\Desktop\\asteya\\asteya-luxury-jewelry\\src\\components\\AITryOnStudio.tsx';
const content = fs.readFileSync(filePath, 'utf8');

const queries = ['canvas', 'toDataURL', 'snap', 'capture', 'webcam'];
queries.forEach(query => {
  console.log(`\nReferences to "${query}" in AITryOnStudio.tsx:`);
  const lines = content.split('\n');
  let count = 0;
  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes(query.toLowerCase())) {
      count++;
      if (count < 25) {
        console.log(`  Line ${idx + 1}: ${line.trim()}`);
      }
    }
  });
});
