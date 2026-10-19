// 나노바나나(Nano Banana) 생성 스프라이트 에셋 매니저

class BilliardsAssetManager {
  public emblemImg: HTMLImageElement | null = null;
  public cueStickImg: HTMLImageElement | null = null;
  public chalkCubeImg: HTMLImageElement | null = null;
  private loaded: boolean = false;

  public preloadAssets(): void {
    if (this.loaded || typeof window === 'undefined') return;
    this.loaded = true;

    const base = (import.meta.env.BASE_URL || '/app/billiards/').replace(/\/$/, '');

    const loadImg = (path: string, onReady: (img: HTMLImageElement) => void) => {
      const img = new Image();
      img.onload = () => onReady(img);
      img.onerror = () => {
        // 로드 실패 시 Canvas 절차적 그래픽 폴백이 자동 동작함
      };
      img.src = `${base}${path}`;
    };

    loadImg('/assets/sprites/billiards_emblem.png', (img) => {
      this.emblemImg = img;
    });
    loadImg('/assets/sprites/cue_stick.png', (img) => {
      this.cueStickImg = img;
    });
    loadImg('/assets/sprites/chalk_cube.png', (img) => {
      this.chalkCubeImg = img;
    });
  }

  public getAssetUrl(relativePath: string): string {
    const base = (import.meta.env.BASE_URL || '/app/billiards/').replace(/\/$/, '');
    return `${base}${relativePath}`;
  }
}

export const assetManager = new BilliardsAssetManager();
