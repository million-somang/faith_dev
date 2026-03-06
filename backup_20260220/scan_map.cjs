
const fs = require('fs');
const path = 'src/app.tsx';

try {
    const content = fs.readFileSync(path, 'utf8');
    const lines = content.split('\n');

    console.log(`Scanning ${path} for latestNews.map...`);

    lines.forEach((line, index) => {
        if (line.includes('latestNews.map')) {
            console.log(`Line ${index + 1}: ${line.trim().substring(0, 100)}`);
        }
    });

    console.log('Scan complete.');
} catch (e) {
    console.error('Error reading file:', e);
}
