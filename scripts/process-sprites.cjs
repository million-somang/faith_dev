const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const sprites = [
  {
    name: 'player_p38.png',
    src: 'C:\\Users\\faithlink\\.gemini\\antigravity\\brain\\b2988baf-e3a5-4c22-b1d4-7f31fa11c921\\player_p38_1791555085497.jpg',
  },
  {
    name: 'player_escort.png',
    src: 'C:\\Users\\faithlink\\.gemini\\antigravity\\brain\\b2988baf-e3a5-4c22-b1d4-7f31fa11c921\\player_escort_1791555104562.jpg',
  },
  {
    name: 'enemy_scout.png',
    src: 'C:\\Users\\faithlink\\.gemini\\antigravity\\brain\\b2988baf-e3a5-4c22-b1d4-7f31fa11c921\\enemy_scout_1791555130835.jpg',
  },
  {
    name: 'enemy_red.png',
    src: 'C:\\Users\\faithlink\\.gemini\\antigravity\\brain\\b2988baf-e3a5-4c22-b1d4-7f31fa11c921\\enemy_red_1791555149025.jpg',
  },
  {
    name: 'enemy_bomber.png',
    src: 'C:\\Users\\faithlink\\.gemini\\antigravity\\brain\\b2988baf-e3a5-4c22-b1d4-7f31fa11c921\\enemy_bomber_1791555163899.jpg',
  },
  {
    name: 'enemy_boss.png',
    src: 'C:\\Users\\faithlink\\.gemini\\antigravity\\brain\\b2988baf-e3a5-4c22-b1d4-7f31fa11c921\\enemy_boss_1791555179150.jpg',
  },
];

const targetDir = path.resolve(__dirname, '../apps/app-flight/public/assets/sprites');

async function main() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  for (const item of sprites) {
    if (!fs.existsSync(item.src)) {
      console.error(`Source file not found: ${item.src}`);
      continue;
    }

    const imgBase64 = fs.readFileSync(item.src).toString('base64');
    const dataUri = `data:image/jpeg;base64,${imgBase64}`;

    // Use page.evaluate to draw on canvas and make white transparent
    const transparentPngBase64 = await page.evaluate(async (srcUri) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = imgData.data;

          // Remove white/light background from border inwards using flood-fill or edge detection
          // The background is pure solid white (> 245 in R, G, B)
          for (let i = 0; i < d.length; i += 4) {
            const r = d[i];
            const g = d[i + 1];
            const b = d[i + 2];

            // If close to white
            if (r > 240 && g > 240 && b > 240) {
              d[i + 3] = 0; // Transparent
            } else if (r > 225 && g > 225 && b > 225) {
              // Smooth feathering
              const diff = (r + g + b) / 3 - 225;
              d[i + 3] = Math.max(0, Math.floor(255 - (diff / 15) * 255));
            }
          }

          ctx.putImageData(imgData, 0, 0);
          resolve(canvas.toDataURL('image/png').split(',')[1]);
        };
        img.src = srcUri;
      });
    }, dataUri);

    const outPath = path.join(targetDir, item.name);
    fs.writeFileSync(outPath, Buffer.from(transparentPngBase64, 'base64'));
    const stats = fs.statSync(outPath);
    console.log(`✅ Saved ${item.name} (${Math.round(stats.size / 1024)} KB) to ${outPath}`);
  }

  await browser.close();
  console.log('🎉 All 6 sprites successfully processed with transparent background!');
}

main().catch(console.error);
