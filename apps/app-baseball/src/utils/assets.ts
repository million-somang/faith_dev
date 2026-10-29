// 베라 숫자야구 정적 이미지 에셋 경로 헬퍼 및 프리로더

const BASE_URL = import.meta.env.BASE_URL || '/app/baseball/';

export function getBaseballAssetUrl(filename: string): string {
  const cleanBase = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
  const cleanFile = filename.startsWith('/') ? filename.slice(1) : filename;
  return `${cleanBase}assets/${cleanFile}`;
}

export const BASEBALL_ASSETS = {
  emblem: getBaseballAssetUrl('baseball_emblem.png'),
  stadiumBg: getBaseballAssetUrl('stadium_field_bg.png'),
  ball: getBaseballAssetUrl('baseball_ball.png'),
  runnerHelmet: getBaseballAssetUrl('runner_helmet.png'),
  victoryTrophy: getBaseballAssetUrl('victory_trophy.png'),
} as const;

let preloaded = false;

export function preloadBaseballAssets(): void {
  if (preloaded || typeof window === 'undefined') return;
  preloaded = true;
  Object.values(BASEBALL_ASSETS).forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}
