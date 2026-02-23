const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.log('No script tag found'); process.exit(1); }
try {
  new Function(m[1]);
  console.log('JS syntax: OK');
} catch(e) {
  console.log('JS syntax error:', e.message);
}
console.log('File size:', html.length, 'chars');
console.log('Has SVG builder:', html.includes('function S('));
console.log('Has game loop:', html.includes('gameLoop'));
console.log('Has encounters:', html.includes('encounters'));
console.log('SVG sprite count:', (html.match(/SVG\.\w+_\w+\s*=/g) || []).length);
