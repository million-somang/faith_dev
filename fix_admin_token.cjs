const fs = require('fs');
const filepath = 'c:/project/faithportal/apps/api-server/src/routes/admin-ui.ts';
let content = fs.readFileSync(filepath, 'utf8');

// The string to replace
const targetStr = `            const authToken = localStorage.getItem('auth_token');\n            if (!authToken`;
const replacementStr = `            const authToken = localStorage.getItem('auth_token');\n            const token = authToken;\n            if (!authToken`;

content = content.split(targetStr).join(replacementStr);

fs.writeFileSync(filepath, content, 'utf8');
console.log('Successfully injected const token = authToken for all UI routes.');
