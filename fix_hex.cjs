const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'components', 'ResultPortal.tsx');
let content = fs.readFileSync(file, 'utf8');

// replace hex with theme CSS variables for background and border
content = content.replace(/#eef2ff/g, 'var(--theme-50)');
content = content.replace(/#c7d2fe/g, 'var(--theme-200)');
content = content.replace(/#4f46e5/g, 'var(--theme-600)');
content = content.replace(/#818cf8/g, 'var(--theme-400)');
content = content.replace(/linear-gradient\(135deg, #4f46e5, #6366f1\)/g, 'linear-gradient(135deg, var(--theme-600), var(--theme-500))');
content = content.replace(/rgba\(99,102,241,0.35\)/g, 'rgba(0,0,0,0.15)'); // fallback shadow

// fix any residual bg-indigo-50 that was missed or re-added
content = content.replace(/bg-indigo-50/g, 'bg-primary-50');
content = content.replace(/text-indigo-600/g, 'text-primary-600');
content = content.replace(/border-indigo-200/g, 'border-primary-200');

fs.writeFileSync(file, content, 'utf8');
console.log('ResultPortal hex fixed.');
