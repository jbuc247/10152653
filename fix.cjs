const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Replace .toLowerCase() to be safe for properties.
const props = ['name', 'barcode', 'category', 'cashierName', 'phone'];

for (const p of props) {
  const regex = new RegExp(`(\\w+)\\.${p}\\.toLowerCase\\(\\)`, 'g');
  code = code.replace(regex, `($1.${p} || '').toLowerCase()`);
}

// Replace raw standalone variables
code = code.replace(/\bcategory\.toLowerCase\(\)/g, `(category || '').toLowerCase()`);
code = code.replace(/\bname\.toLowerCase\(\)/g, `(name || '').toLowerCase()`);
code = code.replace(/\brawTranscript\.toLowerCase\(\)/g, `(rawTranscript || '').toLowerCase()`);

fs.writeFileSync('src/App.jsx', code);
console.log('Fixed toLowerCase.');
