const fs = require('fs');
const path = require('path');

const ctxDir = 'c:/sjt travels/sjt-drivers-vercel/src/context';
if (!fs.existsSync(ctxDir)) fs.mkdirSync(ctxDir, { recursive: true });

let content = fs.readFileSync('c:/sjt travels/sjt-portal/src/context/AppContext.tsx', 'utf8');
content = content.replace(
  /if\s*\(import\.meta\.env\.PROD[\s\S]*?throw new Error[^;]+;/,
  '// VITE_API_URL fallback'
);

fs.writeFileSync(path.join(ctxDir, 'AppContext.tsx'), content, 'utf8');
console.log('AppContext successfully written for drivers.');
