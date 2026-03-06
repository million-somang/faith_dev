const fs = require('fs');

const appTsx = fs.readFileSync('c:/project/faithportal/backup_20260220/src/app.tsx', 'utf8');

const startIndex = appTsx.indexOf("app.get('/admin', async (c)");
const endIndex = appTsx.indexOf("app.get('/news/redirect");

if (startIndex === -1 || endIndex === -1) {
    console.error("Index not found");
    process.exit(1);
}

let adminUiRoutes = appTsx.slice(startIndex, endIndex);
adminUiRoutes = adminUiRoutes.replace(/app\.get\(/g, 'adminUi.get(');
adminUiRoutes = adminUiRoutes.replace(/app\.post\(/g, 'adminUi.post(');

const layoutTs = fs.readFileSync('c:/project/faithportal/backup_20260220/src/views/components/layout.ts', 'utf8');

const header = "import { Hono } from 'hono';\nimport { getDB } from '../db/adapter.js';\nimport { escapeHtml } from '../utils/htmlEscape.js';\nimport { getCategoryName, getCategoryColor, getTimeAgo } from '../utils/formatter.js';\n\nexport const adminUi = new Hono();\n\n";

const output = header + layoutTs + "\n\n" + adminUiRoutes;

fs.writeFileSync('c:/project/faithportal/apps/api-server/src/routes/admin-ui.ts', output);
console.log("Admin UI extracted successfully.");
