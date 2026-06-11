const fs = require('fs');
const path = require('path');

const directories = [
  'src/app/carrinho',
  'src/app/checkout',
  'src/app/conta',
  'src/app/produtos',
  'src/components'
];

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Replace hardcoded dark theme text with foreground
      content = content.replace(/text-white/g, 'text-[var(--foreground)]');
      
      // Replace hardcoded dark borders if any
      content = content.replace(/border-white\/10/g, 'border-[var(--border)]');
      content = content.replace(/border-white\/20/g, 'border-[var(--border)]');
      
      // Replace hardcoded dark backgrounds if any
      content = content.replace(/bg-black\/50/g, 'bg-black/5');
      content = content.replace(/bg-white\/5/g, 'bg-black/5');
      content = content.replace(/bg-white\/10/g, 'bg-black/10');
      content = content.replace(/hover:bg-white\/5/g, 'hover:bg-black/5');
      
      // Some components might have text-gray-500, etc. Leave them.
      
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

for (const dir of directories) {
  processDirectory(dir);
}
console.log("Replacements complete.");
