// 베라 플라이트 고화질 스프라이트 에셋 매니저

export interface GameSprites {
  playerP38: HTMLImageElement | null;
  playerEscort: HTMLImageElement | null;
  enemyScout: HTMLImageElement | null;
  enemyRed: HTMLImageElement | null;
  enemyBomber: HTMLImageElement | null;
  enemyBoss: HTMLImageElement | null;
  explosionEnemy: HTMLImageElement | null;
  explosionPlayer: HTMLImageElement | null;
}

class AssetManager {
  private sprites: GameSprites = {
    playerP38: null,
    playerEscort: null,
    enemyScout: null,
    enemyRed: null,
    enemyBomber: null,
    enemyBoss: null,
    explosionEnemy: null,
    explosionPlayer: null,
  };

  private loaded = false;
  private loadPromise: Promise<GameSprites> | null = null;

  public isLoaded(): boolean {
    return this.loaded;
  }

  public getSprites(): GameSprites {
    return this.sprites;
  }

  public async preloadAssets(): Promise<GameSprites> {
    if (this.loaded) return this.sprites;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = new Promise<GameSprites>((resolve) => {
      const base = (import.meta.env.BASE_URL || '/app/flight/').replace(/\/$/, '') + '/';
      const assetList: { key: keyof GameSprites; url: string }[] = [
        { key: 'playerP38', url: `${base}assets/sprites/player_p38.png` },
        { key: 'playerEscort', url: `${base}assets/sprites/player_escort.png` },
        { key: 'enemyScout', url: `${base}assets/sprites/enemy_scout.png` },
        { key: 'enemyRed', url: `${base}assets/sprites/enemy_red.png` },
        { key: 'enemyBomber', url: `${base}assets/sprites/enemy_bomber.png` },
        { key: 'enemyBoss', url: `${base}assets/sprites/enemy_boss.png` },
        { key: 'explosionEnemy', url: `${base}assets/sprites/explosion_enemy.png` },
        { key: 'explosionPlayer', url: `${base}assets/sprites/explosion_player.png` },
      ];

      let loadedCount = 0;
      const total = assetList.length;

      const checkAllLoaded = () => {
        loadedCount++;
        if (loadedCount >= total) {
          this.loaded = true;
          resolve(this.sprites);
        }
      };

      assetList.forEach((item) => {
        const img = new Image();
        img.onload = () => {
          this.sprites[item.key] = img;
          checkAllLoaded();
        };
        img.onerror = () => {
          console.warn(`Failed to load sprite: ${item.url}, using vector fallback.`);
          checkAllLoaded();
        };
        img.src = item.url;
      });
    });

    return this.loadPromise;
  }
}

export const assetManager = new AssetManager();
