const fs = require('fs');

const adminUiPath = 'c:/project/faithportal/apps/api-server/src/routes/admin-ui.ts';
let content = fs.readFileSync(adminUiPath, 'utf8');

// Replace relative login redirect with absolute frontend redirect
content = content.replace(/window\.location\.href = '\/login\?redirect='/g, "window.location.href = 'http://localhost:5000/login?redirect='");

fs.writeFileSync(adminUiPath, content, 'utf8');
console.log('Fixed login redirect URLs to use port 5000');
