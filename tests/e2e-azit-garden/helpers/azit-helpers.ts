import assert from 'node:assert/strict';
import type { HTTPResponse, Page } from 'puppeteer';
import type {
  DbHarnessLike,
  HttpClientLike,
  HttpResponse,
  SeedPlotInput,
} from '../types.js';

export const GARDEN_WATER_COOLDOWN_MS = 8 * 60 * 60 * 1000;
export const GARDEN_HARVEST_AZIT_XP = 8;
export const MAX_GARDEN_PLOTS = 16;
export const STARTER_GARDEN_PLOTS = 6;
export const MAX_FERTILIZER_PER_CROP = 4;
export const MAX_SOIL_LEVEL = 5;
export const MAX_AZIT_LEVEL = 50;

export const AZIT_LEVEL_XP: Record<number, number> = {
  1: 0,
  2: 80,
  3: 220,
  4: 460,
  5: 820,
  6: 1350,
  7: 2100,
  8: 3100,
  9: 4400,
  10: 6200,
  11: 8300,
  12: 10700,
  13: 13400,
  14: 16400,
  15: 19700,
  16: 23300,
  17: 27200,
  18: 31400,
  19: 35900,
  20: 40700,
  21: 45900,
  22: 51500,
  23: 57500,
  24: 63900,
  25: 70700,
  26: 77900,
  27: 85500,
  28: 93500,
  29: 101900,
  30: 110700,
  31: 120000,
  32: 129800,
  33: 140100,
  34: 150900,
  35: 162200,
  36: 174000,
  37: 186300,
  38: 199100,
  39: 212400,
  40: 226200,
  41: 240600,
  42: 255600,
  43: 271200,
  44: 287400,
  45: 304200,
  46: 321600,
  47: 339600,
  48: 358200,
  49: 377400,
  50: 397200,
};

export function xpForLevel(level: number): number {
  const xp = AZIT_LEVEL_XP[level];
  if (xp === undefined) {
    throw new Error(`Unsupported Azit level in test helper: ${level}`);
  }
  return xp;
}

export const STARTER_CROP_IDS = [
  'crop-carrot',
  'crop-pepper',
  'crop-tomato',
  'crop-lettuce',
  'crop-potato',
  'crop-strawberry',
] as const;

export const HIGH_LEVEL_CROPS = [
  { cropId: 'crop-blueberry', requiredAzitLevel: 20, seedPrice: 55, sellPrice: 68 },
  { cropId: 'crop-pumpkin', requiredAzitLevel: 25, seedPrice: 70, sellPrice: 86 },
  { cropId: 'crop-melon', requiredAzitLevel: 30, seedPrice: 90, sellPrice: 110 },
  { cropId: 'crop-ginseng', requiredAzitLevel: 36, seedPrice: 115, sellPrice: 140 },
  { cropId: 'crop-truffle', requiredAzitLevel: 42, seedPrice: 145, sellPrice: 175 },
  { cropId: 'crop-moonfruit', requiredAzitLevel: 50, seedPrice: 180, sellPrice: 220 },
] as const;

export const HIGH_LEVEL_RECIPES = [
  {
    recipeId: 'dish-blueberry-parfait',
    requiredAzitLevel: 20,
    sellPrice: 520,
    azitXpReward: 95,
    ingredients: [
      { kind: 'crop', id: 'crop-blueberry', qty: 2 },
      { kind: 'crop', id: 'crop-strawberry', qty: 1 },
      { kind: 'material', id: 'mat-forest-honey', qty: 1 },
    ],
  },
  {
    recipeId: 'dish-pumpkin-risotto',
    requiredAzitLevel: 25,
    sellPrice: 620,
    azitXpReward: 115,
    ingredients: [
      { kind: 'crop', id: 'crop-pumpkin', qty: 2 },
      { kind: 'crop', id: 'crop-potato', qty: 1 },
      { kind: 'material', id: 'mat-goblin-spice', qty: 1 },
    ],
  },
  {
    recipeId: 'dish-melon-sorbet',
    requiredAzitLevel: 30,
    sellPrice: 820,
    azitXpReward: 140,
    ingredients: [
      { kind: 'crop', id: 'crop-melon', qty: 2 },
      { kind: 'crop', id: 'crop-blueberry', qty: 1 },
      { kind: 'material', id: 'mat-forest-honey', qty: 1 },
    ],
  },
  {
    recipeId: 'dish-ginseng-tonic',
    requiredAzitLevel: 36,
    sellPrice: 1250,
    azitXpReward: 175,
    ingredients: [
      { kind: 'crop', id: 'crop-ginseng', qty: 2 },
      { kind: 'crop', id: 'crop-pumpkin', qty: 1 },
      { kind: 'material', id: 'mat-wyvern-jerky', qty: 1 },
    ],
  },
  {
    recipeId: 'dish-truffle-steak',
    requiredAzitLevel: 42,
    sellPrice: 1500,
    azitXpReward: 210,
    ingredients: [
      { kind: 'crop', id: 'crop-truffle', qty: 2 },
      { kind: 'crop', id: 'crop-ginseng', qty: 1 },
      { kind: 'material', id: 'mat-wyvern-jerky', qty: 1 },
    ],
  },
  {
    recipeId: 'dish-moon-elixir',
    requiredAzitLevel: 50,
    sellPrice: 2200,
    azitXpReward: 280,
    ingredients: [
      { kind: 'crop', id: 'crop-moonfruit', qty: 2 },
      { kind: 'crop', id: 'crop-truffle', qty: 1 },
      { kind: 'material', id: 'mat-dragon-powder', qty: 1 },
    ],
  },
] as const;

export const PLOT_UNLOCK_SCHEDULE: Array<{
  plotIndex: number;
  unlockLevel: number;
  unlockCost: number;
}> = [
  { plotIndex: 6, unlockLevel: 5, unlockCost: 60 },
  { plotIndex: 7, unlockLevel: 10, unlockCost: 100 },
  { plotIndex: 8, unlockLevel: 15, unlockCost: 150 },
  { plotIndex: 9, unlockLevel: 20, unlockCost: 220 },
  { plotIndex: 10, unlockLevel: 25, unlockCost: 300 },
  { plotIndex: 11, unlockLevel: 30, unlockCost: 400 },
  { plotIndex: 12, unlockLevel: 35, unlockCost: 520 },
  { plotIndex: 13, unlockLevel: 40, unlockCost: 660 },
  { plotIndex: 14, unlockLevel: 45, unlockCost: 820 },
  { plotIndex: 15, unlockLevel: 50, unlockCost: 1000 },
];

export const SOIL_LEVEL_SCHEDULE = [
  { level: 0, requiredAzitLevel: 1, upgradeCost: 0, guaranteedBonusYield: 0, bonusChancePct: 0 },
  { level: 1, requiredAzitLevel: 1, upgradeCost: 80, guaranteedBonusYield: 0, bonusChancePct: 25 },
  { level: 2, requiredAzitLevel: 5, upgradeCost: 180, guaranteedBonusYield: 1, bonusChancePct: 0 },
  { level: 3, requiredAzitLevel: 12, upgradeCost: 350, guaranteedBonusYield: 1, bonusChancePct: 35 },
  { level: 4, requiredAzitLevel: 22, upgradeCost: 620, guaranteedBonusYield: 2, bonusChancePct: 25 },
  { level: 5, requiredAzitLevel: 35, upgradeCost: 1000, guaranteedBonusYield: 2, bonusChancePct: 60 },
] as const;

export const FERTILIZER_SCHEDULE = {
  'fert-basic': { price: 40, reductionMs: 4 * 60 * 60 * 1000, reductionHours: 4 },
  'fert-rapid': { price: 75, reductionMs: 8 * 60 * 60 * 1000, reductionHours: 8 },
} as const;

export interface AzitPlotPayload {
  plotIndex: number;
  isUnlocked: boolean;
  unlockLevel: number;
  unlockCost: number;
  soilLevel: number;
  cropId: string | null;
  stage: number;
  waterCount: number;
  plantedAt: string | null;
  lastWateredAt: string | null;
  nextWaterAtMs: number | null;
  fertilizerUsedCount: number;
  waterNotifiedAt: string | null;
}

export interface OwnedFarmerPayload {
  farmerCode: string;
  name?: string;
  grade: number;
  gradeName?: string;
  level: number;
  xp: number;
  nextLevelXp?: number | null;
  autoEnabled: boolean;
  autoFertilize: boolean;
  preferredCropId: string | null;
  workIntervalMs: number;
  waterCooldownReductionPct: number;
  roles: string[];
  nextAutoRunAtMs?: number | null;
  lastAutoTickMs?: number;
  totalWatered: number;
  totalHarvested: number;
  totalPlanted: number;
  upgradeCost: number | null;
}

export interface FarmerCatalogItem {
  farmerCode: string;
  name: string;
  hireCost: number;
  requiredAzitLevel: number;
  maxLevel?: number;
}

export interface FarmerActionLogPayload {
  id?: number;
  farmerCode: string;
  actionType: 'water' | 'harvest' | 'plant' | 'fertilize' | string;
  plotIndex: number;
  cropId?: string | null;
  detail: string;
  createdAt?: string;
}

export interface AzitStatePayload {
  profile: {
    userId: number;
    azitLevel: number;
    azitXp: number;
    title: string;
    nextLevelXp: number | null;
    progressPct: number;
    limits: {
      kitchenSlots: number;
      maxChefs: number;
      maxMercs: number;
      maxPartySize: number;
      maxActiveExpeditions: number;
      maxGardenPlots: number;
      unlockedPlots: number;
      maxFarmers: number;
    };
    totalCropsSold: number;
    totalDishesCooked: number;
  };
  veraPoints: number;
  serverNowMs?: number;
  nowMs?: number;
  garden: {
    plots: AzitPlotPayload[];
    seedCounts: Record<string, number>;
    harvestCounts: Record<string, number>;
    fertilizerCounts: Record<string, number>;
    totalHarvested: number;
    unlockedPlotCount: number;
    maxPlotCount: number;
  };
  materials: Record<string, number>;
  dishes: Record<string, number>;
  farmers?: OwnedFarmerPayload[];
  farmerLogs?: FarmerActionLogPayload[];
  recentLedger: Array<{
    id: number;
    deltaPoints: number;
    balanceAfter: number;
    txType: string;
    description: string;
    createdAt: string;
  }>;
  catalog: {
    crops: Array<{
      cropId: string;
      name: string;
      requiredAzitLevel: number;
      seedPrice: number;
      harvestYield: number;
      sellPrice: number;
    }>;
    fertilizers: Array<{
      fertilizerId: string;
      name: string;
      requiredAzitLevel: number;
      price: number;
      reductionMs: number;
      reductionHours: number;
    }>;
    soilLevels: Array<{
      level: number;
      name: string;
      upgradeCost: number;
      requiredAzitLevel: number;
      guaranteedBonusYield: number;
      bonusChancePct: number;
    }>;
    plotUnlocks: Array<{
      plotIndex: number;
      unlockLevel: number;
      unlockCost: number;
    }>;
    recipes: Array<{
      recipeId: string;
      name: string;
      requiredAzitLevel: number;
      sellPrice: number;
      azitXpReward: number;
      cookDurationSec: number;
      ingredients: Array<{ kind: string; id: string; qty: number }>;
    }>;
    farmers?: FarmerCatalogItem[];
    zones?: unknown[];
    expeditionZones?: unknown[];
    levels: Array<{
      level: number;
      requiredXp: number;
      title: string;
      gardenPlots: number;
      maxFarmers: number;
    }>;
  };
}

export interface ApiEnvelope<T = unknown> {
  success?: boolean;
  data?: T;
  error?: {
    code?: number | string;
    errorCode?: string;
    message?: string;
  };
  code?: string;
  message?: string;
}

export function getServerNowMs(state: AzitStatePayload): number {
  const value = state.serverNowMs ?? state.nowMs;
  assert.equal(
    typeof value === 'number' && Number.isFinite(value) && value > 0,
    true,
    `Expected positive serverNowMs/nowMs in state, got ${String(value)}`
  );
  return value as number;
}

export function getExpeditionZones(state: AzitStatePayload): unknown[] {
  const zones = state.catalog.zones ?? state.catalog.expeditionZones;
  assert.ok(Array.isArray(zones), 'Expected catalog.zones or catalog.expeditionZones array');
  return zones;
}

export async function fetchAzitState(client: HttpClientLike): Promise<AzitStatePayload> {
  const res = await client.get<ApiEnvelope<AzitStatePayload>>('/api/azit-game/state');
  assert.equal(
    res.status,
    200,
    `Expected GET /api/azit-game/state 200, got ${res.status}: ${res.text}`
  );
  assert.equal(res.json?.success, true, `Expected success=true, got: ${res.text}`);
  assert.ok(res.json?.data, 'Expected data payload in /api/azit-game/state');
  return res.json.data;
}

export async function postAzitAction<T extends Record<string, unknown> = Record<string, unknown>>(
  client: HttpClientLike,
  reqPath: string,
  body: unknown = {}
): Promise<T & { state: AzitStatePayload; message?: string }> {
  const res = await client.post<ApiEnvelope<T & { state: AzitStatePayload; message?: string }>>(
    reqPath,
    body
  );
  assert.equal(
    res.status,
    200,
    `Expected POST ${reqPath} 200, got ${res.status}: ${res.text}`
  );
  assert.equal(res.json?.success, true, `Expected success=true for ${reqPath}, got: ${res.text}`);
  assert.ok(res.json?.data, `Expected data payload for ${reqPath}`);
  assert.ok(res.json.data.state, `Expected data.state in response for ${reqPath}`);
  return res.json.data;
}

export function extractErrorText(res: HttpResponse<ApiEnvelope>): string {
  const errObj = res.json?.error;
  return [
    String(errObj?.errorCode ?? ''),
    String(errObj?.code ?? ''),
    String(errObj?.message ?? ''),
    String(res.json?.code ?? ''),
    String(res.json?.message ?? ''),
    res.text,
  ].join(' ');
}

export function assertErrorStatus(
  res: HttpResponse<ApiEnvelope>,
  expectedStatuses: number | number[],
  contextLabel = 'API call'
): void {
  const allowed = Array.isArray(expectedStatuses) ? expectedStatuses : [expectedStatuses];
  assert.equal(
    allowed.includes(res.status),
    true,
    `${contextLabel}: expected status in [${allowed.join(', ')}], got ${res.status}: ${res.text}`
  );
  assert.equal(
    res.json?.success,
    false,
    `${contextLabel}: expected success=false in error envelope, got: ${res.text}`
  );
}

export function assertAzitLevelLockedError(
  res: HttpResponse<ApiEnvelope>,
  contextLabel = 'Lv 20 farmer gate'
): void {
  assert.equal(
    res.status,
    400,
    `${contextLabel}: expected HTTP 400, got ${res.status}: ${res.text}`
  );
  assert.equal(res.json?.success, false, `${contextLabel}: expected success=false`);
  const err = res.json?.error;
  const hasLockedCode =
    err?.code === 'AZIT_LEVEL_LOCKED' ||
    err?.errorCode === 'AZIT_LEVEL_LOCKED' ||
    String(err?.message ?? '').includes('AZIT_LEVEL_LOCKED') ||
    res.json?.code === 'AZIT_LEVEL_LOCKED';
  assert.equal(
    hasLockedCode,
    true,
    `${contextLabel}: expected AZIT_LEVEL_LOCKED error code in response body, got: ${res.text}`
  );
}

export function unlockedPlotsSeed(totalUnlockedCount: number): SeedPlotInput[] {
  const plots: SeedPlotInput[] = [];
  for (let i = 0; i < totalUnlockedCount; i += 1) {
    plots.push({
      plotIndex: i,
      isUnlocked: 1,
      soilLevel: 0,
      stage: 0,
      waterCount: 0,
    });
  }
  return plots;
}

export function seedMaterials(
  db: DbHarnessLike,
  userId: number,
  materials: Record<string, number>
): void {
  for (const [materialId, qty] of Object.entries(materials)) {
    db.execute(
      `INSERT INTO azit_material_inventory (user_id, material_id, qty, is_deleted, updated_at)
       VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id, material_id) DO UPDATE SET
         qty = excluded.qty,
         is_deleted = 0,
         deleted_at = NULL,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, materialId, qty]
    );
  }
}

export function getFarmerCatalog(state: AzitStatePayload): FarmerCatalogItem[] {
  const farmers = state.catalog.farmers;
  assert.ok(
    Array.isArray(farmers) && farmers.length > 0,
    'Expected non-empty catalog.farmers array in GET /api/azit-game/state'
  );
  return farmers;
}

export function pickEligibleFarmers(
  state: AzitStatePayload,
  azitLevel: number
): FarmerCatalogItem[] {
  return getFarmerCatalog(state).filter((f) => (f.requiredAzitLevel ?? 20) <= azitLevel);
}

export interface AzitLedgerRow {
  id: number;
  user_id: number;
  delta_points: number;
  balance_after: number;
  tx_type: string;
  ref_id: string | null;
  description: string | null;
  created_at: string;
}

export function queryAzitLedger(
  db: DbHarnessLike,
  userId: number,
  txType?: string
): AzitLedgerRow[] {
  if (txType) {
    return db.queryAll<AzitLedgerRow>(
      `SELECT id, user_id, delta_points, balance_after, tx_type, ref_id, description, created_at
       FROM azit_point_ledger
       WHERE user_id = ? AND tx_type = ?
       ORDER BY id ASC`,
      [userId, txType]
    );
  }
  return db.queryAll<AzitLedgerRow>(
    `SELECT id, user_id, delta_points, balance_after, tx_type, ref_id, description, created_at
     FROM azit_point_ledger
     WHERE user_id = ?
     ORDER BY id ASC`,
    [userId]
  );
}

export async function getOrCreateMinihomeHandle(client: HttpClientLike): Promise<string> {
  const res = await client.get<
    ApiEnvelope<{ profile?: { handle?: string } }>
  >('/api/minihome/room/me');
  assert.equal(
    res.status,
    200,
    `Expected GET /api/minihome/room/me 200, got ${res.status}: ${res.text}`
  );
  const handle = res.json?.data?.profile?.handle;
  assert.ok(
    typeof handle === 'string' && handle.length > 0,
    `Expected non-empty profile.handle from /api/minihome/room/me, got: ${res.text}`
  );
  return handle;
}

export async function hireFirstEligibleFarmer(
  client: HttpClientLike,
  azitLevel: number
): Promise<{ farmerDef: FarmerCatalogItem; hired: OwnedFarmerPayload; state: AzitStatePayload }> {
  const initialState = await fetchAzitState(client);
  const eligible = pickEligibleFarmers(initialState, azitLevel);
  assert.ok(eligible.length >= 1, `Expected at least 1 eligible farmer at Lv ${azitLevel}`);
  const farmerDef = eligible[0];

  const res = await postAzitAction(client, '/api/azit-game/farmers/hire', {
    farmerCode: farmerDef.farmerCode,
  });
  const hired = (res.state.farmers ?? []).find((f) => f.farmerCode === farmerDef.farmerCode);
  assert.ok(hired, `Expected hired farmer ${farmerDef.farmerCode} in state.farmers`);
  return { farmerDef, hired, state: res.state };
}

export async function upgradeFarmerToLevel(
  client: HttpClientLike,
  farmerCode: string,
  targetLevel: number
): Promise<OwnedFarmerPayload> {
  let state = await fetchAzitState(client);
  let farmer = (state.farmers ?? []).find((f) => f.farmerCode === farmerCode);
  assert.ok(farmer, `Expected farmer ${farmerCode} to be hired`);

  while (farmer.level < targetLevel) {
    const res = await postAzitAction(client, '/api/azit-game/farmers/upgrade', { farmerCode });
    state = res.state;
    farmer = (state.farmers ?? []).find((f) => f.farmerCode === farmerCode);
    assert.ok(farmer, `Expected farmer ${farmerCode} after upgrade`);
  }
  return farmer;
}

export async function waitForTextOnPage(
  page: Page,
  substring: string,
  timeoutMs = 15000
): Promise<void> {
  await page.waitForFunction(
    (needle: string) => Boolean(document.body && document.body.innerText.includes(needle)),
    { timeout: timeoutMs },
    substring
  );
}

export async function clickButtonByText(
  page: Page,
  textSubstr: string,
  timeoutMs = 5000
): Promise<boolean> {
  try {
    await page.waitForFunction(
      (needle: string) =>
        Array.from(document.querySelectorAll('button')).some(
          (btn) => !btn.disabled && (btn.innerText || btn.textContent || '').includes(needle)
        ),
      { timeout: timeoutMs },
      textSubstr
    );
  } catch {
    return false;
  }

  return page.evaluate((needle: string) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const target = buttons.find(
      (btn) => !btn.disabled && (btn.innerText || btn.textContent || '').includes(needle)
    );
    if (!target) return false;
    target.click();
    return true;
  }, textSubstr);
}

export async function clickAndWaitForApiResponse(
  page: Page,
  urlSubstr: string,
  clickFn: () => Promise<boolean> | boolean,
  opts: { method?: string; timeoutMs?: number; expectedStatus?: number } = {}
): Promise<HTTPResponse> {
  const method = (opts.method ?? 'POST').toUpperCase();
  const timeoutMs = opts.timeoutMs ?? 10000;
  const expectedStatus = opts.expectedStatus ?? 200;

  const responsePromise = page.waitForResponse(
    (res) => res.url().includes(urlSubstr) && res.request().method().toUpperCase() === method,
    { timeout: timeoutMs }
  );
  // Prevent unhandled rejection if clickFn returns false or throws
  responsePromise.catch(() => undefined);

  const clicked = await clickFn();
  if (!clicked) {
    throw new Error(`Expected clickable UI element for ${method} ${urlSubstr}`);
  }

  const res = await responsePromise;
  assert.equal(
    res.status(),
    expectedStatus,
    `Expected HTTP ${expectedStatus} from ${method} ${urlSubstr}, got ${res.status()}`
  );
  return res;
}
