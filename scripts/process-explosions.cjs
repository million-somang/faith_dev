const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
  const enemySrc = 'C:/Users/faithlink/.gemini/antigravity/brain/b2988baf-e3a5-4c22-b1d4-7f31fa11c921/explosion_enemy_1791556832155.jpg';
  const playerSrc = 'C:/Users/faithlink/.gemini/antigravity/brain/b2988baf-e3a5-4c22-b1d4-7f31fa11c921/explosion_player_1791556854222.jpg';
  const outDir = path.resolve(__dirname, '../apps/app-flight/public/assets/sprites');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Helper to read file as data url
  const toDataUrl = (filePath) => {
    const data = fs.readFileSync(filePath);
    return `data:image/jpeg;base64,${data.toString('base64')}`;
  };

  const enemyDataUrl = toDataUrl(enemySrc);
  const playerDataUrl = toDataUrl(playerSrc);

  console.log('Processing explosion sprite sheets...');

  const result = await page.evaluate(async (enemyUrl, playerUrl) => {
    const loadImage = (url) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = url;
    });

    const [imgEnemy, imgPlayer] = await Promise.all([
      loadImage(enemyUrl),
      loadImage(playerUrl)
    ]);

    // 1. Process Enemy (1 row of 6 frames)
    // Create an offscreen canvas to process chroma key transparency
    const canvasEnemy = document.createElement('canvas');
    canvasEnemy.width = imgEnemy.width;
    canvasEnemy.height = imgEnemy.height;
    const ctxE = canvasEnemy.getContext('2d');
    ctxE.drawImage(imgEnemy, 0, 0);
    const imgDataE = ctxE.getImageData(0, 0, canvasEnemy.width, canvasEnemy.height);
    const dataE = imgDataE.data;

    for (let i = 0; i < dataE.length; i += 4) {
      const r = dataE[i];
      const g = dataE[i + 1];
      const b = dataE[i + 2];
      // Check if near white
      if (r > 240 && g > 240 && b > 240) {
        dataE[i + 3] = 0;
      } else if (r > 215 && g > 215 && b > 215) {
        const avg = (r + g + b) / 3;
        const alpha = Math.max(0, 1 - (avg - 215) / 25);
        dataE[i + 3] = Math.floor(dataE[i + 3] * alpha);
      }
    }
    ctxE.putImageData(imgDataE, 0, 0);

    // Crop enemy bounding box vertically
    // The frames are horizontally placed roughly from 0 to width.
    // Let's find vertical bounds of non-transparent content:
    let minY_E = canvasEnemy.height, maxY_E = 0;
    for (let y = 0; y < canvasEnemy.height; y++) {
      for (let x = 0; x < canvasEnemy.width; x++) {
        const a = dataE[(y * canvasEnemy.width + x) * 4 + 3];
        if (a > 20) {
          if (y < minY_E) minY_E = y;
          if (y > maxY_E) maxY_E = y;
        }
      }
    }
    const padE = 10;
    minY_E = Math.max(0, minY_E - padE);
    maxY_E = Math.min(canvasEnemy.height, maxY_E + padE);
    const hE = maxY_E - minY_E;

    // Create normalized 6-frame strip for Enemy (each frame square: size x size)
    const frameSize = 160;
    const finalEnemyCanvas = document.createElement('canvas');
    finalEnemyCanvas.width = frameSize * 6;
    finalEnemyCanvas.height = frameSize;
    const ctxFinalE = finalEnemyCanvas.getContext('2d');

    // Slice 6 columns from canvasEnemy
    const colW_E = canvasEnemy.width / 6;
    for (let f = 0; f < 6; f++) {
      const sx = f * colW_E;
      ctxFinalE.drawImage(
        canvasEnemy,
        sx, minY_E, colW_E, hE,
        f * frameSize, 0, frameSize, frameSize
      );
    }
    const enemyPng = finalEnemyCanvas.toDataURL('image/png');

    // 2. Process Player (2 rows of 3 columns)
    const canvasPlayer = document.createElement('canvas');
    canvasPlayer.width = imgPlayer.width;
    canvasPlayer.height = imgPlayer.height;
    const ctxP = canvasPlayer.getContext('2d');
    ctxP.drawImage(imgPlayer, 0, 0);
    const imgDataP = ctxP.getImageData(0, 0, canvasPlayer.width, canvasPlayer.height);
    const dataP = imgDataP.data;

    for (let i = 0; i < dataP.length; i += 4) {
      const r = dataP[i];
      const g = dataP[i + 1];
      const b = dataP[i + 2];
      if (r > 240 && g > 240 && b > 240) {
        dataP[i + 3] = 0;
      } else if (r > 215 && g > 215 && b > 215) {
        const avg = (r + g + b) / 3;
        const alpha = Math.max(0, 1 - (avg - 215) / 25);
        dataP[i + 3] = Math.floor(dataP[i + 3] * alpha);
      }
    }
    ctxP.putImageData(imgDataP, 0, 0);

    // Player has 2 rows x 3 columns = 6 frames
    // Row 0: frames 0, 1, 2
    // Row 1: frames 3, 4, 5
    const cellW_P = canvasPlayer.width / 3;
    const cellH_P = canvasPlayer.height / 2;

    const finalPlayerCanvas = document.createElement('canvas');
    finalPlayerCanvas.width = frameSize * 6;
    finalPlayerCanvas.height = frameSize;
    const ctxFinalP = finalPlayerCanvas.getContext('2d');

    const framesGrid = [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 0 },
      { col: 0, row: 1 },
      { col: 1, row: 1 },
      { col: 2, row: 1 },
    ];

    for (let f = 0; f < 6; f++) {
      const { col, row } = framesGrid[f];
      const sx = col * cellW_P;
      const sy = row * cellH_P;
      ctxFinalP.drawImage(
        canvasPlayer,
        sx, sy, cellW_P, cellH_P,
        f * frameSize, 0, frameSize, frameSize
      );
    }
    const playerPng = finalPlayerCanvas.toDataURL('image/png');

    return {
      enemyPng,
      playerPng,
      enemyWidth: finalEnemyCanvas.width,
      enemyHeight: finalEnemyCanvas.height,
      playerWidth: finalPlayerCanvas.width,
      playerHeight: finalPlayerCanvas.height
    };
  }, enemyDataUrl, playerDataUrl);

  const saveBase64Png = (dataUrl, filePath) => {
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
  };

  const enemyOut = path.join(outDir, 'explosion_enemy.png');
  const playerOut = path.join(outDir, 'explosion_player.png');

  saveBase64Png(result.enemyPng, enemyOut);
  saveBase64Png(result.playerPng, playerOut);

  console.log(`Saved ${enemyOut} (${result.enemyWidth}x${result.enemyHeight})`);
  console.log(`Saved ${playerOut} (${result.playerWidth}x${result.playerHeight})`);

  await browser.close();
})();
