const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

function replaceInFile(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // (text|bg|border|ring|hover:bg|hover:text|hover:border|focus:border|focus:ring|from|to|shadow|fill|stroke)-indigo-
    const regex = /(text|bg|border|ring|hover:bg|hover:text|hover:border|focus:border|focus:ring|from|to|shadow|fill|stroke)-indigo-/g;
    
    if (regex.test(content)) {
      content = content.replace(regex, '$1-primary-');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  }
}

function processDirectory(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else {
      replaceInFile(fullPath);
    }
  });
}

processDirectory(directoryPath);
console.log('Replacement complete.');
