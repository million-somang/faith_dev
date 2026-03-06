
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'src/index.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('Searching for redirect pattern in src/index.tsx...');

lines.forEach((line, index) => {
    if (line.includes("window.location.href = '/login'") || line.includes('window.location.href = "/login"')) {
        console.log(`Line ${index + 1}: ${line.trim()}`);
    }
});
