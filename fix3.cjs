const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const arrayKeys = ['products', 'customers', 'salesHistory', 'expenses', 'debts', 'paidDebts', 'stockHistory', 'suppliers', 'cashiers'];

arrayKeys.forEach(k => {
  const K = k.charAt(0).toUpperCase() + k.slice(1);
  
  // During initial load
  // e.g., if (cachedProducts) setProducts(cachedProducts);
  const regexLoadStr = `if \\(cached${K}\\) set${K}\\(cached${K}\\);`;
  const regexLoad = new RegExp(regexLoadStr, 'g');
  const safeLoad = `if (Array.isArray(cached${K})) set${K}(cached${K});`;
  code = code.replace(regexLoad, safeLoad);
  
  // During Turso pull
  // e.g., setProducts(data.products);
  const regexTursoStr = `set${K}\\(data\\.${k}\\);`;
  const regexTurso = new RegExp(regexTursoStr, 'g');
  const safeTurso = `if (Array.isArray(data.${k})) set${K}(data.${k});`;
  code = code.replace(regexTurso, safeTurso);
});

// Fix any p.id or p.category not handled correctly
code = code.replace(/p\.id/g, '(p && p.id)');
code = code.replace(/p\.category/g, '(p && p.category)');

// Revert double checks
code = code.replace(/\(p && \(p && p\./g, '(p && p.');
code = code.replace(/\(p && \(p && p\.\w+\)\.id\)/g, '(p && p.id)');

fs.writeFileSync('src/App.jsx', code);
console.log('Fixed Array.isArray protections.');
