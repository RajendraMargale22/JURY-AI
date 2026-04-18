const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

function fixFetchCalls(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixFetchCalls(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes("fetch('/api/")) {
        const replacement = "fetch(`${process.env.REACT_APP_API_URL || ''}/api/";
        content = content.replace(/fetch\('\/api\//g, replacement);
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Fixed: ${fullPath}`);
      }
    }
  }
}

fixFetchCalls(directoryPath);
