import fs from 'node:fs';
(async () => {
    try {
        const res = await fetch('http://localhost:5012/app/tetris/src/index.css');
        const text = await res.text();
        fs.writeFileSync('error.txt', text);
        console.log('Saved to error.txt');
    } catch (e) {
        console.log(e);
    }
})();
