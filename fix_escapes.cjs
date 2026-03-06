const fs = require('fs');
const filepath = 'c:/project/faithportal/apps/api-server/src/routes/admin-ui.ts';
let content = fs.readFileSync(filepath, 'utf8');

content = content.replace('${message.replace(/\\n/g, \'<br>\')}', '\\${message.replace(/\\\\n/g, \\\'<br>\\\')}');
content = content.replace('${message}', '\\${message}');

fs.writeFileSync(filepath, content, 'utf8');
console.log('Fixed escaping in admin-ui.ts');
