const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./portal/src');
let changedCount = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace "http://localhost:8000/..." with `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/...`
  const regex1 = /"http:\/\/localhost:8000([^"]*)"/g;
  let newContent = content.replace(regex1, '`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}$1`');
  
  // Replace `http://localhost:8000/...` with `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/...`
  const regex2 = /`http:\/\/localhost:8000([^`]*)`/g;
  newContent = newContent.replace(regex2, '`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}$1`');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log('Fixed', file);
    changedCount++;
  }
});
console.log(`Fixed ${changedCount} files.`);
