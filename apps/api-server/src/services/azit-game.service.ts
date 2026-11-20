import crypto from 'crypto';
import { pool } from '@faithportal/database';
import {
    AZIT_CHEFS,
    AZIT_CROPS,
    AZIT_EXPEDITION_ZONES,
    AZIT_LEVEL_TABLE,
    AZIT_MATERIALS,
    AZIT_MERCENARIES,
    AZIT_RECIPES,
    AzitChefCode,
    AzitCropId,
    AzitMaterialId,
    AzitMercCode,
    AzitRecipeId,
    AzitZoneId,
    GARDEN_HARVEST_AZIT_XP,
    GARDEN_WATER_COOLDOWN_MS,
    calculateExpeditionWinRate,
    generateBattleLog,
    getAzitLevelInfo,
    getChefDef,
    getChefEffectiveStats,
    getChefUpgradeCost,
    getCropDef,
    getMaterialDef,
    getMercDef,
    getMercNextXp,
    getMercUpgradeCost,
    getMercenaryEffectivePower,
    getRecipeDef,
    getZoneDef,
} from './azit-game.catalog.js';

export class AzitGameError extends Error {
    readonly statusCode: number;

    constructor(message: string, statusCode = 400) {
        super(message);
        this.name = 'AzitGameError';
        this.statusCode = statusCode;
    }
}

export interface ServerGardenPlot {
    plotIndex: number;
    cropId: AzitCropId | null;
    stage: 0 | 1 | 2 | 3;
    waterCount: number;
    plantedAt: string | null;
    lastWateredAt: string | null;
    waterNotifiedAt: string | null;
}

export interface ServerGardenState {
    plots: ServerGardenPlot[];
    seedCounts: Record<AzitCropId, number>;
    harvestCounts: Record<AzitCropId, number>;
    totalHarvested: number;
}

export interface AzitChefRecord {
    chefCode: AzitChefCode;
    level: number;
    speedBonusPct: number;
    greatChancePct: number;
    upgradeCost: number | null;
}

export interface AzitKitchenSlotRecord {
    slotIndex: number;
    unlocked: boolean;
    unlockLevel: number;
    recipeId: AzitRecipeId | null;
    chefCode: AzitChefCode | null;
    status: 'idle' | 'cooking';
    startedAtMs: number | null;
    endsAtMs: number | null;
}

export interface AzitMercenaryRecord {
    mercCode: AzitMercCode;
    level: number;
    xp: number;
    nextXp: number;
    power: number;
    status: 'idle' | 'expedition';
    upgradeCost: number | null;
}

export interface AzitExpeditionRecord {
    id: number;
    zoneId: AzitZoneId;
    partyMercCodes: AzitMercCode[];
    dishRecipeId: AzitRecipeId;
    entryCost: number;
    predictedWinRate: number;
    status: 'running' | 'won' | 'lost';
    startedAtMs: number;
    endsAtMs: number;
    claimedAt: string | null;
    rewardPoints: number;
    rewardXp: number;
    rewardMaterials: Partial<Record<AzitMaterialId, number>>;
    battleLog: string[];
}

export interface AzitLedgerRecord {
    id: number;
    deltaPoints: number;
    balanceAfter: number;
    txType: string;
    description: string;
    createdAt: string;
}

export interface AzitFullGameState {
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
        };
        totalCropsSold: number;
        totalDishesCooked: number;
        totalExpeditionsWon: number;
        totalExpeditionsLost: number;
    };
    veraPoints: number;
    garden: ServerGardenState;
    materials: Record<AzitMaterialId, number>;
    dishes: Record<AzitRecipeId, number>;
    chefs: AzitChefRecord[];
    kitchenSlots: AzitKitchenSlotRecord[];
    mercenaries: AzitMercenaryRecord[];
    activeExpeditions: AzitExpeditionRecord[];
    recentExpeditions: AzitExpeditionRecord[];
    recentLedger: AzitLedgerRecord[];
    catalog: {
        crops: typeof AZIT_CROPS;
        materials: typeof AZIT_MATERIALS;
        recipes: typeof AZIT_RECIPES;
        chefs: typeof AZIT_CHEFS;
        mercenaries: typeof AZIT_MERCENARIES;
        zones: typeof AZIT_EXPEDITION_ZONES;
        levels: typeof AZIT_LEVEL_TABLE;
    };
}

interface LegacyLayoutGarden {
    plots?: Array<{
        plotIndex?: number;
        cropId?: string | null;
        stage?: number;
        waterCount?: number;
        plantedAt?: string | null;
        lastWateredAt?: string | null;
        waterNotifiedAt?: string | null;
    }>;
    seedCounts?: Record<string, number>;
    harvestCounts?: Record<string, number>;
}

const VALID_CROP_IDS = new Set<string>(AZIT_CROPS.map((c) => c.cropId));
const VALID_MATERIAL_IDS = new Set<string>(AZIT_MATERIALS.map((m) => m.materialId));
const VALID_RECIPE_IDS = new Set<string>(AZIT_RECIPES.map((r) => r.recipeId));
const SLOT_UNLOCK_LEVELS: Record<number, number> = { 0: 1, 1: 3, 2: 6 };

function createEmptySeedMap(): Record<AzitCropId, number> {
    return {
        'crop-carrot': 0,
        'crop-pepper': 0,
        'crop-tomato': 0,
        'crop-lettuce': 0,
        'crop-potato': 0,
        'crop-strawberry': 0,
    };
}

function createEmptyMaterialMap(): Record<AzitMaterialId, number> {
    return {
        'mat-slime-jelly': 0,
        'mat-goblin-spice': 0,
        'mat-forest-honey': 0,
        'mat-wyvern-jerky': 0,
        'mat-dragon-powder': 0,
    };
}

function createEmptyDishMap(): Record<AzitRecipeId, number> {
    return {
        'dish-carrot-soup': 0,
        'dish-spicy-rice': 0,
        'dish-tomato-stew': 0,
        'dish-fresh-wrap': 0,
        'dish-potato-gratin': 0,
        'dish-strawberry-tart': 0,
        'dish-knight-feast': 0,
        'dish-dragon-elixir': 0,
    };
}

export class AzitGameService {
    private static ensureTablesPromise: Promise<void> | null = null;

    static async ensureTables(): Promise<void> {
        if (!this.ensureTablesPromise) {
            this.ensureTablesPromise = this.createTablesInternal().catch((err) => {
                this.ensureTablesPromise = null;
                throw err;
            });
        }
        return this.ensureTablesPromise;
    }

    private static async createTablesInternal(): Promise<void> {
        const statements: string[] = [
            `CREATE TABLE IF NOT EXISTS azit_profiles (
                user_id INTEGER PRIMARY KEY,
                azit_level INTEGER NOT NULL DEFAULT 1,
                azit_xp INTEGER NOT NULL DEFAULT 0,
                garden_migrated INTEGER NOT NULL DEFAULT 0,
                total_crops_sold INTEGER NOT NULL DEFAULT 0,
                total_dishes_cooked INTEGER NOT NULL DEFAULT 0,
                total_expeditions_won INTEGER NOT NULL DEFAULT 0,
                total_expeditions_lost INTEGER NOT NULL DEFAULT 0,
                is_deleted INTEGER NOT NULL DEFAULT 0,
                deleted_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );`,
            `CREATE TABLE IF NOT EXISTS azit_point_ledger (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                delta_points INTEGER NOT NULL,
                balance_after INTEGER NOT NULL,
                tx_type TEXT NOT NULL,
                ref_id TEXT,
                description TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );`,
            `CREATE INDEX IF NOT EXISTS idx_azit_ledger_user ON azit_point_ledger(user_id, created_at);`,
            `CREATE TABLE IF NOT EXISTS azit_crop_inventory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                crop_id TEXT NOT NULL,
                seed_qty INTEGER NOT NULL DEFAULT 0,
                harvest_qty INTEGER NOT NULL DEFAULT 0,
                is_deleted INTEGER NOT NULL DEFAULT 0,
                deleted_at DATETIME,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, crop_id)
            );`,
            `CREATE INDEX IF NOT EXISTS idx_azit_crops_user ON azit_crop_inventory(user_id);`,
            `CREATE TABLE IF NOT EXISTS azit_garden_plots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                plot_index INTEGER NOT NULL,
                crop_id TEXT,
                stage INTEGER NOT NULL DEFAULT 0,
                water_count INTEGER NOT NULL DEFAULT 0,
                planted_at TEXT,
                last_watered_at TEXT,
                water_notified_at TEXT,
                is_deleted INTEGER NOT NULL DEFAULT 0,
                deleted_at DATETIME,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, plot_index)
            );`,
            `CREATE INDEX IF NOT EXISTS idx_azit_garden_user ON azit_garden_plots(user_id);`,
            `CREATE TABLE IF NOT EXISTS azit_material_inventory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                material_id TEXT NOT NULL,
                qty INTEGER NOT NULL DEFAULT 0,
                is_deleted INTEGER NOT NULL DEFAULT 0,
                deleted_at DATETIME,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, material_id)
            );`,
            `CREATE TABLE IF NOT EXISTS azit_chefs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                chef_code TEXT NOT NULL,
                level INTEGER NOT NULL DEFAULT 1,
                is_deleted INTEGER NOT NULL DEFAULT 0,
                deleted_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, chef_code)
            );`,
            `CREATE TABLE IF NOT EXISTS azit_kitchen_slots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                slot_index INTEGER NOT NULL,
                recipe_id TEXT,
                chef_code TEXT,
                status TEXT NOT NULL DEFAULT 'idle',
                started_at_ms INTEGER,
                ends_at_ms INTEGER,
                is_deleted INTEGER NOT NULL DEFAULT 0,
                deleted_at DATETIME,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, slot_index)
            );`,
            `CREATE TABLE IF NOT EXISTS azit_dish_inventory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                recipe_id TEXT NOT NULL,
                qty INTEGER NOT NULL DEFAULT 0,
                is_deleted INTEGER NOT NULL DEFAULT 0,
                deleted_at DATETIME,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, recipe_id)
            );`,
            `CREATE TABLE IF NOT EXISTS azit_mercenaries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                merc_code TEXT NOT NULL,
                level INTEGER NOT NULL DEFAULT 1,
                xp INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'idle',
                is_deleted INTEGER NOT NULL DEFAULT 0,
                deleted_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, merc_code)
            );`,
            `CREATE TABLE IF NOT EXISTS azit_expeditions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                zone_id TEXT NOT NULL,
                party_merc_codes_json TEXT NOT NULL,
                dish_recipe_id TEXT NOT NULL,
                entry_cost INTEGER NOT NULL,
                predicted_win_rate INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'running',
                started_at_ms INTEGER NOT NULL,
                ends_at_ms INTEGER NOT NULL,
                claimed_at DATETIME,
                reward_points INTEGER NOT NULL DEFAULT 0,
                reward_xp INTEGER NOT NULL DEFAULT 0,
                reward_materials_json TEXT,
                battle_log_json TEXT,
                is_deleted INTEGER NOT NULL DEFAULT 0,
                deleted_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );`,
            `CREATE INDEX IF NOT EXISTS idx_azit_expeditions_user_status ON azit_expeditions(user_id, status, ends_at_ms);`,
        ];

        for (const sql of statements) {
            await pool.query(sql);
        }
    }

    private static async getVeraPoints(userId: number): Promise<number> {
        await pool.query(
            `INSERT INTO user_points (user_id, points, pending_amount, attendance_points, activity_points)
             VALUES ($1, 0, 0, 0, 0)
             ON CONFLICT (user_id) DO NOTHING`,
            [userId]
        );
        const res = await pool.query('SELECT points FROM user_points WHERE user_id = $1', [userId]);
        return Number(res.rows[0]?.points ?? 0);
    }

    private static async deductVeraPoints(params: {
        userId: number;
        amount: number;
        txType: string;
        refId: string;
        description: string;
    }): Promise<number> {
        const cost = Math.max(0, Math.floor(params.amount));
        if (cost === 0) {
            return this.getVeraPoints(params.userId);
        }

        await this.getVeraPoints(params.userId);
        const updateRes = await pool.query(
            `UPDATE user_points
             SET points = points - $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $2 AND points >= $3`,
            [cost, params.userId, cost]
        );
        if (updateRes.rowCount === 0) {
            const current = await this.getVeraPoints(params.userId);
            throw new AzitGameError(
                `베라포인트가 부족합니다. (보유: ${current.toLocaleString()}P / 필요: ${cost.toLocaleString()}P)`,
                400
            );
        }

        const balanceAfter = await this.getVeraPoints(params.userId);
        await pool.query(
            `INSERT INTO azit_point_ledger (user_id, delta_points, balance_after, tx_type, ref_id, description)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [params.userId, -cost, balanceAfter, params.txType, params.refId, params.description]
        );
        return balanceAfter;
    }

    private static async creditVeraPoints(params: {
        userId: number;
        amount: number;
        txType: string;
        refId: string;
        description: string;
        countAsActivity?: boolean;
    }): Promise<number> {
        const gain = Math.max(0, Math.floor(params.amount));
        if (gain === 0) {
            return this.getVeraPoints(params.userId);
        }

        const actGain = params.countAsActivity === false ? 0 : gain;
        await pool.query(
            `INSERT INTO user_points (user_id, points, pending_amount, attendance_points, activity_points, updated_at)
             VALUES ($1, $2, 0, 0, $3, CURRENT_TIMESTAMP)
             ON CONFLICT (user_id) DO UPDATE SET
                points = user_points.points + $4,
                activity_points = user_points.activity_points + $5,
                updated_at = CURRENT_TIMESTAMP`,
            [params.userId, gain, actGain, gain, actGain]
        );

        const balanceAfter = await this.getVeraPoints(params.userId);
        await pool.query(
            `INSERT INTO azit_point_ledger (user_id, delta_points, balance_after, tx_type, ref_id, description)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [params.userId, gain, balanceAfter, params.txType, params.refId, params.description]
        );
        return balanceAfter;
    }

    private static async addAzitXp(userId: number, deltaXp: number): Promise<void> {
        const safeXp = Math.max(0, Math.floor(deltaXp));
        if (safeXp === 0) return;

        await pool.query(
            `UPDATE azit_profiles
             SET azit_xp = azit_xp + $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $2`,
            [safeXp, userId]
        );
        const res = await pool.query('SELECT azit_xp FROM azit_profiles WHERE user_id = $1', [userId]);
        const newXp = Number(res.rows[0]?.azit_xp ?? 0);
        const levelInfo = getAzitLevelInfo(newXp);
        await pool.query(
            `UPDATE azit_profiles
             SET azit_level = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $2`,
            [levelInfo.level, userId]
        );
    }

    static async ensureUserInitialized(userId: number): Promise<void> {
        await this.ensureTables();
        await this.getVeraPoints(userId);

        await pool.query(
            `INSERT INTO azit_profiles (user_id, azit_level, azit_xp, garden_migrated)
             VALUES ($1, 1, 0, 0)
             ON CONFLICT (user_id) DO NOTHING`,
            [userId]
        );

        for (const crop of AZIT_CROPS) {
            await pool.query(
                `INSERT INTO azit_crop_inventory (user_id, crop_id, seed_qty, harvest_qty)
                 VALUES ($1, $2, 0, 0)
                 ON CONFLICT (user_id, crop_id) DO NOTHING`,
                [userId, crop.cropId]
            );
        }

        for (let slotIdx = 0; slotIdx <= 2; slotIdx += 1) {
            await pool.query(
                `INSERT INTO azit_kitchen_slots (user_id, slot_index, status)
                 VALUES ($1, $2, 'idle')
                 ON CONFLICT (user_id, slot_index) DO NOTHING`,
                [userId, slotIdx]
            );
        }

        const claimMigrateRes = await pool.query(
            `UPDATE azit_profiles
             SET garden_migrated = 1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1 AND garden_migrated = 0`,
            [userId]
        );

        if (claimMigrateRes.rowCount > 0) {
            await this.migrateLegacyGardenOnce(userId);
        } else {
            // 텃밭 6구획 레코드 존재 보장
            for (let plotIndex = 0; plotIndex < 6; plotIndex += 1) {
                await pool.query(
                    `INSERT INTO azit_garden_plots (user_id, plot_index, crop_id, stage, water_count)
                     VALUES ($1, $2, NULL, 0, 0)
                     ON CONFLICT (user_id, plot_index) DO NOTHING`,
                    [userId, plotIndex]
                );
            }
        }
    }

    private static async migrateLegacyGardenOnce(userId: number): Promise<void> {
        let legacyGarden: LegacyLayoutGarden | null = null;
        try {
            const roomRes = await pool.query(
                `SELECT layout_json FROM user_minihomes
                 WHERE user_id = $1 AND is_deleted = 0
                 ORDER BY updated_at DESC
                 LIMIT 1`,
                [userId]
            );
            const rawLayout = roomRes.rows[0]?.layout_json as string | undefined;
            if (rawLayout) {
                const parsed = JSON.parse(rawLayout) as { garden?: LegacyLayoutGarden };
                if (parsed && typeof parsed === 'object' && parsed.garden) {
                    legacyGarden = parsed.garden;
                }
            }
        } catch (err) {
            console.warn('[AzitGame] legacy garden read skipped:', err);
        }

        // 기존 수확 작물 & 씨앗 승계 (이상치 캡 999)
        for (const crop of AZIT_CROPS) {
            const rawSeed = Number(legacyGarden?.seedCounts?.[crop.cropId] ?? 0);
            const rawHarvest = Number(legacyGarden?.harvestCounts?.[crop.cropId] ?? 0);
            const baseSeed = Number.isFinite(rawSeed) ? Math.max(0, Math.min(999, Math.floor(rawSeed))) : 0;
            const safeSeed = crop.cropId === 'crop-carrot' ? Math.max(3, baseSeed) : baseSeed;
            const safeHarvest = Number.isFinite(rawHarvest)
                ? Math.max(0, Math.min(999, Math.floor(rawHarvest)))
                : 0;

            await pool.query(
                `UPDATE azit_crop_inventory
                 SET seed_qty = $1,
                     harvest_qty = $2,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $3 AND crop_id = $4`,
                [safeSeed, safeHarvest, userId, crop.cropId]
            );
        }

        // 기본 스타터 텃밭 6구획 또는 기존 이랑 승계
        const starterNow = '2026-10-26T00:00:00.000Z';
        const defaultPlots: ServerGardenPlot[] = [
            { plotIndex: 0, cropId: 'crop-carrot', stage: 2, waterCount: 2, plantedAt: starterNow, lastWateredAt: starterNow, waterNotifiedAt: null },
            { plotIndex: 1, cropId: 'crop-pepper', stage: 3, waterCount: 3, plantedAt: starterNow, lastWateredAt: starterNow, waterNotifiedAt: null },
            { plotIndex: 2, cropId: 'crop-tomato', stage: 1, waterCount: 1, plantedAt: starterNow, lastWateredAt: starterNow, waterNotifiedAt: null },
            { plotIndex: 3, cropId: 'crop-lettuce', stage: 2, waterCount: 2, plantedAt: starterNow, lastWateredAt: starterNow, waterNotifiedAt: null },
            { plotIndex: 4, cropId: null, stage: 0, waterCount: 0, plantedAt: null, lastWateredAt: null, waterNotifiedAt: null },
            { plotIndex: 5, cropId: null, stage: 0, waterCount: 0, plantedAt: null, lastWateredAt: null, waterNotifiedAt: null },
        ];

        for (let idx = 0; idx < 6; idx += 1) {
            const legacyPlot = legacyGarden?.plots?.find((p) => p.plotIndex === idx);
            const fallback = defaultPlots[idx];

            let cropId: string | null = fallback.cropId;
            let stage = fallback.stage;
            let waterCount = fallback.waterCount;
            let plantedAt = fallback.plantedAt;
            let lastWateredAt = fallback.lastWateredAt;
            let waterNotifiedAt = fallback.waterNotifiedAt;

            if (legacyGarden?.plots && legacyPlot) {
                if (legacyPlot.cropId && VALID_CROP_IDS.has(legacyPlot.cropId)) {
                    cropId = legacyPlot.cropId;
                    const s = Number(legacyPlot.stage ?? 1);
                    stage = (s >= 3 ? 3 : s <= 1 ? 1 : 2) as 1 | 2 | 3;
                    waterCount = Math.max(stage, Number(legacyPlot.waterCount ?? stage));
                    plantedAt = legacyPlot.plantedAt || starterNow;
                    lastWateredAt = legacyPlot.lastWateredAt || starterNow;
                    waterNotifiedAt = legacyPlot.waterNotifiedAt || null;
                } else {
                    cropId = null;
                    stage = 0;
                    waterCount = 0;
                    plantedAt = null;
                    lastWateredAt = null;
                    waterNotifiedAt = null;
                }
            }

            await pool.query(
                `INSERT INTO azit_garden_plots (
                    user_id, plot_index, crop_id, stage, water_count, planted_at, last_watered_at, water_notified_at
                 )
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 ON CONFLICT (user_id, plot_index) DO UPDATE SET
                    crop_id = EXCLUDED.crop_id,
                    stage = EXCLUDED.stage,
                    water_count = EXCLUDED.water_count,
                    planted_at = EXCLUDED.planted_at,
                    last_watered_at = EXCLUDED.last_watered_at,
                    water_notified_at = EXCLUDED.water_notified_at,
                    updated_at = CURRENT_TIMESTAMP`,
                [userId, idx, cropId, stage, waterCount, plantedAt, lastWateredAt, waterNotifiedAt]
            );
        }

        await this.syncGardenSnapshotToMinihome(userId);
    }

    private static async getServerGardenState(userId: number): Promise<ServerGardenState> {
        const cropRes = await pool.query(
            `SELECT crop_id, seed_qty, harvest_qty
             FROM azit_crop_inventory
             WHERE user_id = $1 AND is_deleted = 0`,
            [userId]
        );
        const seedCounts = createEmptySeedMap();
        const harvestCounts = createEmptySeedMap();
        let totalHarvested = 0;

        for (const row of cropRes.rows) {
            const cropId = String(row.crop_id) as AzitCropId;
            if (!VALID_CROP_IDS.has(cropId)) continue;
            seedCounts[cropId] = Number(row.seed_qty ?? 0);
            harvestCounts[cropId] = Number(row.harvest_qty ?? 0);
            totalHarvested += harvestCounts[cropId];
        }

        const plotRes = await pool.query(
            `SELECT plot_index, crop_id, stage, water_count, planted_at, last_watered_at, water_notified_at
             FROM azit_garden_plots
             WHERE user_id = $1 AND is_deleted = 0
             ORDER BY plot_index ASC`,
            [userId]
        );

        const plots: ServerGardenPlot[] = [];
        for (let idx = 0; idx < 6; idx += 1) {
            const row = plotRes.rows.find((r) => Number(r.plot_index) === idx);
            if (!row || !row.crop_id || !VALID_CROP_IDS.has(String(row.crop_id))) {
                plots.push({
                    plotIndex: idx,
                    cropId: null,
                    stage: 0,
                    waterCount: 0,
                    plantedAt: null,
                    lastWateredAt: null,
                    waterNotifiedAt: null,
                });
            } else {
                const rawStage = Number(row.stage ?? 1);
                plots.push({
                    plotIndex: idx,
                    cropId: String(row.crop_id) as AzitCropId,
                    stage: (rawStage >= 3 ? 3 : rawStage <= 1 ? 1 : 2) as 1 | 2 | 3,
                    waterCount: Number(row.water_count ?? rawStage),
                    plantedAt: (row.planted_at as string | null) ?? null,
                    lastWateredAt: (row.last_watered_at as string | null) ?? null,
                    waterNotifiedAt: (row.water_notified_at as string | null) ?? null,
                });
            }
        }

        return {
            plots,
            seedCounts,
            harvestCounts,
            totalHarvested,
        };
    }

    private static async syncGardenSnapshotToMinihome(userId: number): Promise<void> {
        try {
            const garden = await this.getServerGardenState(userId);
            const roomRes = await pool.query(
                `SELECT id, layout_json FROM user_minihomes
                 WHERE user_id = $1 AND is_deleted = 0`,
                [userId]
            );
            for (const room of roomRes.rows) {
                try {
                    const parsed = JSON.parse(String(room.layout_json || '{}')) as Record<string, unknown>;
                    parsed.garden = garden;
                    await pool.query(
                        `UPDATE user_minihomes
                         SET layout_json = $1,
                             updated_at = CURRENT_TIMESTAMP
                         WHERE id = $2`,
                        [JSON.stringify(parsed), room.id]
                    );
                } catch (_) {
                    // JSON 파싱 실패 시 무시
                }
            }
        } catch (err) {
            console.warn('[AzitGame] syncGardenSnapshotToMinihome warning:', err);
        }
    }

    static async getState(userId: number): Promise<AzitFullGameState> {
        await this.ensureUserInitialized(userId);

        const profileRes = await pool.query('SELECT * FROM azit_profiles WHERE user_id = $1', [userId]);
        const pRow = profileRes.rows[0] || {};
        const azitXp = Number(pRow.azit_xp ?? 0);
        const levelInfo = getAzitLevelInfo(azitXp);
        const veraPoints = await this.getVeraPoints(userId);
        const garden = await this.getServerGardenState(userId);

        const materials = createEmptyMaterialMap();
        const matRes = await pool.query(
            `SELECT material_id, qty FROM azit_material_inventory WHERE user_id = $1 AND is_deleted = 0`,
            [userId]
        );
        for (const r of matRes.rows) {
            const mId = String(r.material_id) as AzitMaterialId;
            if (VALID_MATERIAL_IDS.has(mId)) {
                materials[mId] = Number(r.qty ?? 0);
            }
        }

        const dishes = createEmptyDishMap();
        const dishRes = await pool.query(
            `SELECT recipe_id, qty FROM azit_dish_inventory WHERE user_id = $1 AND is_deleted = 0`,
            [userId]
        );
        for (const r of dishRes.rows) {
            const recId = String(r.recipe_id) as AzitRecipeId;
            if (VALID_RECIPE_IDS.has(recId)) {
                dishes[recId] = Number(r.qty ?? 0);
            }
        }

        const chefRes = await pool.query(
            `SELECT chef_code, level FROM azit_chefs WHERE user_id = $1 AND is_deleted = 0 ORDER BY id ASC`,
            [userId]
        );
        const chefs: AzitChefRecord[] = [];
        for (const r of chefRes.rows) {
            const code = String(r.chef_code) as AzitChefCode;
            const def = getChefDef(code);
            if (!def) continue;
            const level = Number(r.level ?? 1);
            const eff = getChefEffectiveStats(code, level);
            chefs.push({
                chefCode: code,
                level,
                speedBonusPct: eff.speedBonusPct,
                greatChancePct: eff.greatChancePct,
                upgradeCost: level >= def.maxLevel ? null : getChefUpgradeCost(level),
            });
        }

        const slotRes = await pool.query(
            `SELECT slot_index, recipe_id, chef_code, status, started_at_ms, ends_at_ms
             FROM azit_kitchen_slots
             WHERE user_id = $1 AND is_deleted = 0
             ORDER BY slot_index ASC`,
            [userId]
        );
        const kitchenSlots: AzitKitchenSlotRecord[] = [0, 1, 2].map((slotIdx) => {
            const row = slotRes.rows.find((r) => Number(r.slot_index) === slotIdx);
            const unlockLevel = SLOT_UNLOCK_LEVELS[slotIdx] ?? 1;
            const unlocked = levelInfo.kitchenSlots > slotIdx;
            const isCooking = row?.status === 'cooking' && Boolean(row?.recipe_id);
            return {
                slotIndex: slotIdx,
                unlocked,
                unlockLevel,
                recipeId: isCooking ? (String(row.recipe_id) as AzitRecipeId) : null,
                chefCode: isCooking && row.chef_code ? (String(row.chef_code) as AzitChefCode) : null,
                status: isCooking ? 'cooking' : 'idle',
                startedAtMs: isCooking && row.started_at_ms ? Number(row.started_at_ms) : null,
                endsAtMs: isCooking && row.ends_at_ms ? Number(row.ends_at_ms) : null,
            };
        });

        const mercRes = await pool.query(
            `SELECT merc_code, level, xp, status FROM azit_mercenaries WHERE user_id = $1 AND is_deleted = 0 ORDER BY id ASC`,
            [userId]
        );
        const mercenaries: AzitMercenaryRecord[] = [];
        for (const r of mercRes.rows) {
            const code = String(r.merc_code) as AzitMercCode;
            const def = getMercDef(code);
            if (!def) continue;
            const level = Number(r.level ?? 1);
            mercenaries.push({
                mercCode: code,
                level,
                xp: Number(r.xp ?? 0),
                nextXp: getMercNextXp(level),
                power: getMercenaryEffectivePower(code, level),
                status: r.status === 'expedition' ? 'expedition' : 'idle',
                upgradeCost: level >= def.maxLevel ? null : getMercUpgradeCost(level),
            });
        }

        const expRes = await pool.query(
            `SELECT * FROM azit_expeditions
             WHERE user_id = $1 AND is_deleted = 0
             ORDER BY id DESC
             LIMIT 20`,
            [userId]
        );
        const mapExpeditionRow = (row: Record<string, unknown>): AzitExpeditionRecord => {
            let partyMercCodes: AzitMercCode[] = [];
            let rewardMaterials: Partial<Record<AzitMaterialId, number>> = {};
            let battleLog: string[] = [];
            try {
                partyMercCodes = JSON.parse(String(row.party_merc_codes_json || '[]')) as AzitMercCode[];
            } catch (_) {
                partyMercCodes = [];
            }
            try {
                if (row.reward_materials_json) {
                    rewardMaterials = JSON.parse(String(row.reward_materials_json)) as Partial<Record<AzitMaterialId, number>>;
                }
            } catch (_) {
                rewardMaterials = {};
            }
            try {
                if (row.battle_log_json) {
                    battleLog = JSON.parse(String(row.battle_log_json)) as string[];
                }
            } catch (_) {
                battleLog = [];
            }

            const rawStatus = String(row.status);
            const normalizedStatus: 'running' | 'won' | 'lost' =
                rawStatus === 'won' ? 'won' : rawStatus === 'lost' ? 'lost' : 'running';

            return {
                id: Number(row.id),
                zoneId: String(row.zone_id) as AzitZoneId,
                partyMercCodes,
                dishRecipeId: String(row.dish_recipe_id) as AzitRecipeId,
                entryCost: Number(row.entry_cost ?? 0),
                predictedWinRate: Number(row.predicted_win_rate ?? 25),
                status: normalizedStatus,
                startedAtMs: Number(row.started_at_ms ?? 0),
                endsAtMs: Number(row.ends_at_ms ?? 0),
                claimedAt: (row.claimed_at as string | null) ?? null,
                rewardPoints: Number(row.reward_points ?? 0),
                rewardXp: Number(row.reward_xp ?? 0),
                rewardMaterials,
                battleLog,
            };
        };

        const mappedExp = expRes.rows.map(mapExpeditionRow);
        const activeExpeditions = mappedExp.filter((e) => e.status === 'running');
        const recentExpeditions = mappedExp.filter((e) => e.status !== 'running').slice(0, 10);

        const ledgerRes = await pool.query(
            `SELECT id, delta_points, balance_after, tx_type, description, created_at
             FROM azit_point_ledger
             WHERE user_id = $1
             ORDER BY id DESC
             LIMIT 20`,
            [userId]
        );
        const recentLedger: AzitLedgerRecord[] = ledgerRes.rows.map((r) => ({
            id: Number(r.id),
            deltaPoints: Number(r.delta_points ?? 0),
            balanceAfter: Number(r.balance_after ?? 0),
            txType: String(r.tx_type ?? ''),
            description: String(r.description ?? ''),
            createdAt: String(r.created_at ?? ''),
        }));

        return {
            profile: {
                userId,
                azitLevel: levelInfo.level,
                azitXp,
                title: levelInfo.title,
                nextLevelXp: levelInfo.nextLevelXp,
                progressPct: levelInfo.progressPct,
                limits: {
                    kitchenSlots: levelInfo.kitchenSlots,
                    maxChefs: levelInfo.maxChefs,
                    maxMercs: levelInfo.maxMercs,
                    maxPartySize: levelInfo.maxPartySize,
                    maxActiveExpeditions: levelInfo.maxActiveExpeditions,
                },
                totalCropsSold: Number(pRow.total_crops_sold ?? 0),
                totalDishesCooked: Number(pRow.total_dishes_cooked ?? 0),
                totalExpeditionsWon: Number(pRow.total_expeditions_won ?? 0),
                totalExpeditionsLost: Number(pRow.total_expeditions_lost ?? 0),
            },
            veraPoints,
            garden,
            materials,
            dishes,
            chefs,
            kitchenSlots,
            mercenaries,
            activeExpeditions,
            recentExpeditions,
            recentLedger,
            catalog: {
                crops: AZIT_CROPS,
                materials: AZIT_MATERIALS,
                recipes: AZIT_RECIPES,
                chefs: AZIT_CHEFS,
                mercenaries: AZIT_MERCENARIES,
                zones: AZIT_EXPEDITION_ZONES,
                levels: AZIT_LEVEL_TABLE,
            },
        };
    }

    // ==================== 1. 텃밭 서버 권위 API ====================

    static async buySeed(userId: number, cropId: string, rawQuantity = 1) {
        await this.ensureUserInitialized(userId);
        const crop = getCropDef(cropId);
        if (!crop) {
            throw new AzitGameError('존재하지 않는 작물입니다.', 400);
        }
        const qty = Math.max(1, Math.min(50, Math.floor(rawQuantity)));
        const totalCost = crop.seedPrice * qty;

        if (totalCost > 0) {
            await this.deductVeraPoints({
                userId,
                amount: totalCost,
                txType: 'seed_buy',
                refId: crop.cropId,
                description: `${crop.emoji} ${crop.name} 씨앗 ${qty}봉지 구매`,
            });
        }

        await pool.query(
            `UPDATE azit_crop_inventory
             SET seed_qty = seed_qty + $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $2 AND crop_id = $3`,
            [qty, userId, crop.cropId]
        );
        await this.syncGardenSnapshotToMinihome(userId);
        const state = await this.getState(userId);
        return {
            message:
                totalCost > 0
                    ? `🌱 [${crop.emoji} ${crop.name}] 씨앗 ${qty}봉지를 ${totalCost.toLocaleString()}P에 구매했습니다!`
                    : `🌱 [${crop.emoji} ${crop.name}] 무료 씨앗 ${qty}봉지를 농장 창고에 넣었습니다!`,
            state,
        };
    }

    static async plantCrop(userId: number, plotIndex: number, cropId: string) {
        await this.ensureUserInitialized(userId);
        if (!Number.isInteger(plotIndex) || plotIndex < 0 || plotIndex > 5) {
            throw new AzitGameError('올바른 텃밭 번호(0~5)가 아닙니다.', 400);
        }
        const crop = getCropDef(cropId);
        if (!crop) {
            throw new AzitGameError('존재하지 않는 작물입니다.', 400);
        }

        const plotRes = await pool.query(
            `SELECT crop_id, stage FROM azit_garden_plots
             WHERE user_id = $1 AND plot_index = $2 AND is_deleted = 0`,
            [userId, plotIndex]
        );
        const currentPlot = plotRes.rows[0];
        if (currentPlot && currentPlot.crop_id && Number(currentPlot.stage) > 0) {
            throw new AzitGameError('이미 작물이 자라고 있는 밭입니다.', 400);
        }

        const seedDeductRes = await pool.query(
            `UPDATE azit_crop_inventory
             SET seed_qty = seed_qty - 1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1 AND crop_id = $2 AND seed_qty >= 1 AND is_deleted = 0`,
            [userId, crop.cropId]
        );
        if (seedDeductRes.rowCount === 0) {
            throw new AzitGameError(
                `창고에 [${crop.emoji} ${crop.shortName}] 씨앗이 부족합니다. 상점에서 씨앗을 구매해 주세요!`,
                400
            );
        }

        const nowIso = new Date().toISOString();
        const plantRes = await pool.query(
            `UPDATE azit_garden_plots
             SET crop_id = $1,
                 stage = 1,
                 water_count = 1,
                 planted_at = $2,
                 last_watered_at = $3,
                 water_notified_at = NULL,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $4 AND plot_index = $5 AND (crop_id IS NULL OR stage = 0)`,
            [crop.cropId, nowIso, nowIso, userId, plotIndex]
        );
        if (plantRes.rowCount === 0) {
            // 동시 요청으로 실패 시 씨앗 1개 복구
            await pool.query(
                `UPDATE azit_crop_inventory SET seed_qty = seed_qty + 1 WHERE user_id = $1 AND crop_id = $2`,
                [userId, crop.cropId]
            );
            throw new AzitGameError('해당 밭에 이미 작물이 심어져 있습니다.', 409);
        }

        await this.syncGardenSnapshotToMinihome(userId);
        const state = await this.getState(userId);
        return {
            message: `🌱 [${crop.emoji} ${crop.name}] 씨앗을 심고 첫 물을 주었습니다! (8시간 후 2차 물주기 가능)`,
            state,
        };
    }

    static async waterPlot(userId: number, plotIndex: number) {
        await this.ensureUserInitialized(userId);
        if (!Number.isInteger(plotIndex) || plotIndex < 0 || plotIndex > 5) {
            throw new AzitGameError('올바른 텃밭 번호(0~5)가 아닙니다.', 400);
        }

        const plotRes = await pool.query(
            `SELECT crop_id, stage, water_count, last_watered_at
             FROM azit_garden_plots
             WHERE user_id = $1 AND plot_index = $2 AND is_deleted = 0`,
            [userId, plotIndex]
        );
        const plot = plotRes.rows[0];
        if (!plot || !plot.crop_id || Number(plot.stage) <= 0) {
            throw new AzitGameError('작물이 심어져 있지 않은 빈 밭입니다.', 400);
        }
        const currentStage = Number(plot.stage);
        if (currentStage >= 3) {
            throw new AzitGameError('이미 다 자라서 수확할 수 있는 작물입니다!', 400);
        }

        if (plot.last_watered_at) {
            const lastMs = new Date(String(plot.last_watered_at)).getTime();
            const nowMs = Date.now();
            if (!Number.isNaN(lastMs) && lastMs + GARDEN_WATER_COOLDOWN_MS > nowMs) {
                const remainSec = Math.ceil((lastMs + GARDEN_WATER_COOLDOWN_MS - nowMs) / 1000);
                const hrs = Math.floor(remainSec / 3600);
                const mins = Math.floor((remainSec % 3600) / 60);
                throw new AzitGameError(
                    `아직 땅이 촉촉해요! 다음 물주기까지 ${hrs}시간 ${mins}분 남았습니다.`,
                    400
                );
            }
        }

        const nextStage = Math.min(3, currentStage + 1);
        const nowIso = new Date().toISOString();
        const updRes = await pool.query(
            `UPDATE azit_garden_plots
             SET stage = $1,
                 water_count = water_count + 1,
                 last_watered_at = $2,
                 water_notified_at = NULL,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $3 AND plot_index = $4 AND stage = $5`,
            [nextStage, nowIso, userId, plotIndex, currentStage]
        );
        if (updRes.rowCount === 0) {
            throw new AzitGameError('물주기 상태가 변경되었습니다. 다시 시도해 주세요.', 409);
        }

        const crop = getCropDef(String(plot.crop_id));
        await this.syncGardenSnapshotToMinihome(userId);
        const state = await this.getState(userId);
        return {
            message:
                nextStage >= 3
                    ? `🎉 3차 물주기 완료! [${crop?.emoji || '🌾'} ${crop?.name || '작물'}]이(가) 수확 가능 상태가 되었습니다!`
                    : `💧 [${crop?.emoji || '🌱'} ${crop?.shortName || '작물'}]에 물을 주었습니다! (${nextStage}/3단계)`,
            state,
        };
    }

    static async harvestPlot(userId: number, plotIndex: number) {
        await this.ensureUserInitialized(userId);
        if (!Number.isInteger(plotIndex) || plotIndex < 0 || plotIndex > 5) {
            throw new AzitGameError('올바른 텃밭 번호(0~5)가 아닙니다.', 400);
        }

        const plotRes = await pool.query(
            `SELECT crop_id, stage FROM azit_garden_plots
             WHERE user_id = $1 AND plot_index = $2 AND is_deleted = 0`,
            [userId, plotIndex]
        );
        const plot = plotRes.rows[0];
        if (!plot || !plot.crop_id || Number(plot.stage) < 3) {
            throw new AzitGameError('아직 수확할 수 있는 완숙 작물이 없습니다.', 400);
        }
        const crop = getCropDef(String(plot.crop_id));
        if (!crop) {
            throw new AzitGameError('알 수 없는 작물입니다.', 400);
        }

        const clearRes = await pool.query(
            `UPDATE azit_garden_plots
             SET crop_id = NULL,
                 stage = 0,
                 water_count = 0,
                 planted_at = NULL,
                 last_watered_at = NULL,
                 water_notified_at = NULL,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1 AND plot_index = $2 AND crop_id = $3 AND stage >= 3`,
            [userId, plotIndex, crop.cropId]
        );
        if (clearRes.rowCount === 0) {
            throw new AzitGameError('이미 수확된 밭입니다.', 409);
        }

        await pool.query(
            `UPDATE azit_crop_inventory
             SET harvest_qty = harvest_qty + $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $2 AND crop_id = $3`,
            [crop.harvestYield, userId, crop.cropId]
        );
        await this.addAzitXp(userId, GARDEN_HARVEST_AZIT_XP);
        await this.syncGardenSnapshotToMinihome(userId);
        const state = await this.getState(userId);
        return {
            message: `🧺 [${crop.emoji} ${crop.name}] ${crop.harvestYield}개를 수확했습니다! (+${GARDEN_HARVEST_AZIT_XP} 아지트 EXP)`,
            state,
        };
    }

    static async clearPlot(userId: number, plotIndex: number) {
        await this.ensureUserInitialized(userId);
        if (!Number.isInteger(plotIndex) || plotIndex < 0 || plotIndex > 5) {
            throw new AzitGameError('올바른 텃밭 번호(0~5)가 아닙니다.', 400);
        }

        await pool.query(
            `UPDATE azit_garden_plots
             SET crop_id = NULL,
                 stage = 0,
                 water_count = 0,
                 planted_at = NULL,
                 last_watered_at = NULL,
                 water_notified_at = NULL,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1 AND plot_index = $2 AND is_deleted = 0`,
            [userId, plotIndex]
        );
        await this.syncGardenSnapshotToMinihome(userId);
        const state = await this.getState(userId);
        return {
            message: `🌿 ${plotIndex + 1}번 텃밭 이랑을 깨끗하게 비웠습니다.`,
            state,
        };
    }

    static async sellCrop(userId: number, cropId: string, rawQuantity = 1) {
        await this.ensureUserInitialized(userId);
        const crop = getCropDef(cropId);
        if (!crop) {
            throw new AzitGameError('존재하지 않는 작물입니다.', 400);
        }
        const qty = Math.max(1, Math.min(999, Math.floor(rawQuantity)));

        const deductRes = await pool.query(
            `UPDATE azit_crop_inventory
             SET harvest_qty = harvest_qty - $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $2 AND crop_id = $3 AND harvest_qty >= $4 AND is_deleted = 0`,
            [qty, userId, crop.cropId, qty]
        );
        if (deductRes.rowCount === 0) {
            throw new AzitGameError(`판매할 [${crop.emoji} ${crop.name}] 수확 작물이 부족합니다.`, 400);
        }

        const revenue = crop.sellPrice * qty;
        await this.creditVeraPoints({
            userId,
            amount: revenue,
            txType: 'crop_sell',
            refId: crop.cropId,
            description: `${crop.emoji} ${crop.name} ×${qty} 판매`,
        });
        await pool.query(
            `UPDATE azit_profiles
             SET total_crops_sold = total_crops_sold + $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $2`,
            [qty, userId]
        );
        await this.syncGardenSnapshotToMinihome(userId);
        const state = await this.getState(userId);
        return {
            message: `💰 [${crop.emoji} ${crop.name}] ×${qty} 판매 완료! (+${revenue.toLocaleString()}P)`,
            state,
        };
    }

    // ==================== 2. 주방 & 요리사 ====================

    static async hireChef(userId: number, chefCode: string) {
        await this.ensureUserInitialized(userId);
        const def = getChefDef(chefCode);
        if (!def) {
            throw new AzitGameError('존재하지 않는 요리사입니다.', 400);
        }

        const profileRes = await pool.query('SELECT azit_xp FROM azit_profiles WHERE user_id = $1', [userId]);
        const levelInfo = getAzitLevelInfo(Number(profileRes.rows[0]?.azit_xp ?? 0));
        if (levelInfo.level < def.requiredAzitLevel) {
            throw new AzitGameError(
                `[${def.name}] 요리사는 아지트 Lv.${def.requiredAzitLevel}부터 고용할 수 있습니다.`,
                400
            );
        }

        const existingRes = await pool.query(
            `SELECT chef_code FROM azit_chefs WHERE user_id = $1 AND is_deleted = 0`,
            [userId]
        );
        if (existingRes.rows.some((r) => r.chef_code === def.chefCode)) {
            throw new AzitGameError(`이미 [${def.name}] 요리사를 고용하고 있습니다.`, 400);
        }
        if (existingRes.rows.length >= levelInfo.maxChefs) {
            throw new AzitGameError(
                `현재 아지트 레벨(Lv.${levelInfo.level})에서는 최대 ${levelInfo.maxChefs}명의 요리사만 고용할 수 있습니다.`,
                400
            );
        }

        await this.deductVeraPoints({
            userId,
            amount: def.hireCost,
            txType: 'chef_hire',
            refId: def.chefCode,
            description: `${def.emoji} 요리사 [${def.name}] 고용`,
        });

        try {
            await pool.query(
                `INSERT INTO azit_chefs (user_id, chef_code, level, is_deleted, deleted_at)
                 VALUES ($1, $2, 1, 0, NULL)
                 ON CONFLICT (user_id, chef_code) DO UPDATE SET
                    is_deleted = 0,
                    deleted_at = NULL,
                    level = 1,
                    updated_at = CURRENT_TIMESTAMP`,
                [userId, def.chefCode]
            );
        } catch (err) {
            await this.creditVeraPoints({
                userId,
                amount: def.hireCost,
                txType: 'refund',
                refId: def.chefCode,
                description: `요리사 고용 실패 환불 (${def.name})`,
                countAsActivity: false,
            });
            throw err;
        }

        const state = await this.getState(userId);
        return {
            message: `👨‍🍳 [${def.emoji} ${def.name}] 요리사를 영입했습니다! 이제 주방 화구에서 조리를 지시해 보세요.`,
            state,
        };
    }

    static async upgradeChef(userId: number, chefCode: string) {
        await this.ensureUserInitialized(userId);
        const def = getChefDef(chefCode);
        if (!def) {
            throw new AzitGameError('존재하지 않는 요리사입니다.', 400);
        }

        const chefRes = await pool.query(
            `SELECT level FROM azit_chefs WHERE user_id = $1 AND chef_code = $2 AND is_deleted = 0`,
            [userId, def.chefCode]
        );
        if (chefRes.rows.length === 0) {
            throw new AzitGameError('고용하지 않은 요리사입니다.', 404);
        }
        const currentLevel = Number(chefRes.rows[0].level ?? 1);
        if (currentLevel >= def.maxLevel) {
            throw new AzitGameError(`[${def.name}] 요리사는 이미 최고 레벨(Lv.${def.maxLevel})입니다.`, 400);
        }

        const cost = getChefUpgradeCost(currentLevel);
        await this.deductVeraPoints({
            userId,
            amount: cost,
            txType: 'chef_upgrade',
            refId: def.chefCode,
            description: `${def.emoji} 요리사 [${def.name}] Lv.${currentLevel + 1} 승급`,
        });

        await pool.query(
            `UPDATE azit_chefs
             SET level = level + 1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1 AND chef_code = $2 AND is_deleted = 0`,
            [userId, def.chefCode]
        );

        const state = await this.getState(userId);
        return {
            message: `✨ [${def.emoji} ${def.name}] Lv.${currentLevel + 1}로 승급! 조리 단축 및 대성공 확률이 올랐습니다.`,
            state,
        };
    }

    static async startCooking(
        userId: number,
        slotIndex: number,
        recipeId: string,
        chefCode?: string | null
    ) {
        await this.ensureUserInitialized(userId);
        if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex > 2) {
            throw new AzitGameError('올바른 화구 번호가 아닙니다.', 400);
        }
        const recipe = getRecipeDef(recipeId);
        if (!recipe) {
            throw new AzitGameError('존재하지 않는 요리 레시피입니다.', 400);
        }

        const profileRes = await pool.query('SELECT azit_xp FROM azit_profiles WHERE user_id = $1', [userId]);
        const levelInfo = getAzitLevelInfo(Number(profileRes.rows[0]?.azit_xp ?? 0));

        if (slotIndex >= levelInfo.kitchenSlots) {
            const unlockLv = SLOT_UNLOCK_LEVELS[slotIndex] ?? 6;
            throw new AzitGameError(`#${slotIndex + 1}번 화구는 아지트 Lv.${unlockLv}에 해금됩니다.`, 400);
        }
        if (levelInfo.level < recipe.requiredAzitLevel) {
            throw new AzitGameError(
                `[${recipe.name}] 레시피는 아지트 Lv.${recipe.requiredAzitLevel}부터 조리할 수 있습니다.`,
                400
            );
        }

        const slotRes = await pool.query(
            `SELECT status FROM azit_kitchen_slots WHERE user_id = $1 AND slot_index = $2 AND is_deleted = 0`,
            [userId, slotIndex]
        );
        if (slotRes.rows[0]?.status === 'cooking') {
            throw new AzitGameError('이미 조리가 진행 중인 화구입니다.', 400);
        }

        let validatedChefCode: AzitChefCode | null = null;
        let speedBonusPct = 0;
        if (chefCode) {
            const chefDef = getChefDef(chefCode);
            if (!chefDef) {
                throw new AzitGameError('존재하지 않는 요리사입니다.', 400);
            }
            const ownedChefRes = await pool.query(
                `SELECT level FROM azit_chefs WHERE user_id = $1 AND chef_code = $2 AND is_deleted = 0`,
                [userId, chefDef.chefCode]
            );
            if (ownedChefRes.rows.length === 0) {
                throw new AzitGameError('고용한 요리사만 화구에 배치할 수 있습니다.', 400);
            }
            const busyRes = await pool.query(
                `SELECT slot_index FROM azit_kitchen_slots
                 WHERE user_id = $1 AND chef_code = $2 AND status = 'cooking' AND is_deleted = 0`,
                [userId, chefDef.chefCode]
            );
            if (busyRes.rows.length > 0) {
                throw new AzitGameError(`[${chefDef.name}] 요리사는 다른 화구에서 조리 중입니다.`, 400);
            }
            validatedChefCode = chefDef.chefCode;
            const chefLv = Number(ownedChefRes.rows[0].level ?? 1);
            speedBonusPct = getChefEffectiveStats(chefDef.chefCode, chefLv).speedBonusPct;
        }

        // 재료 원자적 차감 (실패 시 이전 차감분 보상 복구)
        const deducted: Array<{ kind: 'crop' | 'material'; id: string; qty: number }> = [];
        try {
            for (const ing of recipe.ingredients) {
                if (ing.kind === 'crop') {
                    const res = await pool.query(
                        `UPDATE azit_crop_inventory
                         SET harvest_qty = harvest_qty - $1,
                             updated_at = CURRENT_TIMESTAMP
                         WHERE user_id = $2 AND crop_id = $3 AND harvest_qty >= $4 AND is_deleted = 0`,
                        [ing.qty, userId, ing.id, ing.qty]
                    );
                    if (res.rowCount === 0) {
                        const cDef = getCropDef(ing.id);
                        throw new AzitGameError(
                            `수확 작물 [${cDef?.emoji || ''} ${cDef?.name || ing.id}] ×${ing.qty}개가 부족합니다.`,
                            400
                        );
                    }
                    deducted.push(ing);
                } else {
                    const res = await pool.query(
                        `UPDATE azit_material_inventory
                         SET qty = qty - $1,
                             updated_at = CURRENT_TIMESTAMP
                         WHERE user_id = $2 AND material_id = $3 AND qty >= $4 AND is_deleted = 0`,
                        [ing.qty, userId, ing.id, ing.qty]
                    );
                    if (res.rowCount === 0) {
                        const mDef = getMaterialDef(ing.id);
                        throw new AzitGameError(
                            `특수 재료 [${mDef?.emoji || ''} ${mDef?.name || ing.id}] ×${ing.qty}개가 부족합니다. 원정에서 획득해 보세요!`,
                            400
                        );
                    }
                    deducted.push(ing);
                }
            }

            const nowMs = Date.now();
            const effectiveSec = Math.max(15, Math.round(recipe.cookDurationSec * (1 - speedBonusPct / 100)));
            const endsAtMs = nowMs + effectiveSec * 1000;

            const updSlot = await pool.query(
                `UPDATE azit_kitchen_slots
                 SET status = 'cooking',
                     recipe_id = $1,
                     chef_code = $2,
                     started_at_ms = $3,
                     ends_at_ms = $4,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $5 AND slot_index = $6 AND status = 'idle' AND is_deleted = 0`,
                [recipe.recipeId, validatedChefCode, nowMs, endsAtMs, userId, slotIndex]
            );
            if (updSlot.rowCount === 0) {
                throw new AzitGameError('이미 조리가 시작된 화구입니다.', 409);
            }
        } catch (err) {
            for (const item of deducted) {
                if (item.kind === 'crop') {
                    await pool.query(
                        `UPDATE azit_crop_inventory SET harvest_qty = harvest_qty + $1 WHERE user_id = $2 AND crop_id = $3`,
                        [item.qty, userId, item.id]
                    );
                } else {
                    await pool.query(
                        `UPDATE azit_material_inventory SET qty = qty + $1 WHERE user_id = $2 AND material_id = $3`,
                        [item.qty, userId, item.id]
                    );
                }
            }
            throw err;
        }

        await this.syncGardenSnapshotToMinihome(userId);
        const state = await this.getState(userId);
        return {
            message: `🍳 [${recipe.emoji} ${recipe.name}] 조리를 시작했습니다!${validatedChefCode ? '' : ' (요리사 없이 수습 조리 진행 중)'}`,
            state,
        };
    }

    static async claimCooking(userId: number, slotIndex: number) {
        await this.ensureUserInitialized(userId);
        if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex > 2) {
            throw new AzitGameError('올바른 화구 번호가 아닙니다.', 400);
        }

        const slotRes = await pool.query(
            `SELECT recipe_id, chef_code, status, ends_at_ms
             FROM azit_kitchen_slots
             WHERE user_id = $1 AND slot_index = $2 AND is_deleted = 0`,
            [userId, slotIndex]
        );
        const slot = slotRes.rows[0];
        if (!slot || slot.status !== 'cooking' || !slot.recipe_id) {
            throw new AzitGameError('수령할 완료 요리가 없습니다.', 400);
        }

        const nowMs = Date.now();
        if (Number(slot.ends_at_ms) > nowMs) {
            const remainSec = Math.ceil((Number(slot.ends_at_ms) - nowMs) / 1000);
            throw new AzitGameError(`아직 조리가 진행 중입니다. (${remainSec}초 남음)`, 400);
        }

        const recipe = getRecipeDef(String(slot.recipe_id));
        if (!recipe) {
            throw new AzitGameError('알 수 없는 레시피입니다.', 400);
        }

        // 원자적 상태 전이(중복 수령 차단)
        const claimRes = await pool.query(
            `UPDATE azit_kitchen_slots
             SET status = 'idle',
                 recipe_id = NULL,
                 chef_code = NULL,
                 started_at_ms = NULL,
                 ends_at_ms = NULL,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1 AND slot_index = $2 AND status = 'cooking' AND ends_at_ms <= $3 AND is_deleted = 0`,
            [userId, slotIndex, nowMs]
        );
        if (claimRes.rowCount === 0) {
            throw new AzitGameError('이미 수령된 요리입니다.', 409);
        }

        let greatSuccess = false;
        if (slot.chef_code) {
            const cRes = await pool.query(
                `SELECT level FROM azit_chefs WHERE user_id = $1 AND chef_code = $2 AND is_deleted = 0`,
                [userId, slot.chef_code]
            );
            const cLv = Number(cRes.rows[0]?.level ?? 1);
            const { greatChancePct } = getChefEffectiveStats(String(slot.chef_code) as AzitChefCode, cLv);
            if (crypto.randomInt(1, 101) <= greatChancePct) {
                greatSuccess = true;
            }
        }

        const producedQty = greatSuccess ? 2 : 1;
        await pool.query(
            `INSERT INTO azit_dish_inventory (user_id, recipe_id, qty)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, recipe_id) DO UPDATE SET
                qty = azit_dish_inventory.qty + $4,
                is_deleted = 0,
                deleted_at = NULL,
                updated_at = CURRENT_TIMESTAMP`,
            [userId, recipe.recipeId, producedQty, producedQty]
        );

        await pool.query(
            `UPDATE azit_profiles
             SET total_dishes_cooked = total_dishes_cooked + $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $2`,
            [producedQty, userId]
        );
        await this.addAzitXp(userId, recipe.azitXpReward);

        const state = await this.getState(userId);
        return {
            message: greatSuccess
                ? `🌟 대성공! [${recipe.emoji} ${recipe.name}] 2개를 완성했습니다! (+${recipe.azitXpReward} 아지트 EXP)`
                : `🍱 [${recipe.emoji} ${recipe.name}] 요리를 완성해 보관함에 넣었습니다! (+${recipe.azitXpReward} 아지트 EXP)`,
            greatSuccess,
            producedQty,
            state,
        };
    }

    static async sellDish(userId: number, recipeId: string, rawQuantity = 1) {
        await this.ensureUserInitialized(userId);
        const recipe = getRecipeDef(recipeId);
        if (!recipe) {
            throw new AzitGameError('존재하지 않는 요리입니다.', 400);
        }
        const qty = Math.max(1, Math.min(999, Math.floor(rawQuantity)));

        const deductRes = await pool.query(
            `UPDATE azit_dish_inventory
             SET qty = qty - $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $2 AND recipe_id = $3 AND qty >= $4 AND is_deleted = 0`,
            [qty, userId, recipe.recipeId, qty]
        );
        if (deductRes.rowCount === 0) {
            throw new AzitGameError(`판매할 [${recipe.emoji} ${recipe.name}] 요리가 부족합니다.`, 400);
        }

        const revenue = recipe.sellPrice * qty;
        await this.creditVeraPoints({
            userId,
            amount: revenue,
            txType: 'dish_sell',
            refId: recipe.recipeId,
            description: `${recipe.emoji} ${recipe.name} ×${qty} 판매`,
        });

        const state = await this.getState(userId);
        return {
            message: `💰 [${recipe.emoji} ${recipe.name}] ×${qty} 판매 완료! (+${revenue.toLocaleString()}P)`,
            state,
        };
    }

    // ==================== 3. 용병 길드 & 몬스터 원정 ====================

    static async hireMercenary(userId: number, mercCode: string) {
        await this.ensureUserInitialized(userId);
        const def = getMercDef(mercCode);
        if (!def) {
            throw new AzitGameError('존재하지 않는 용병입니다.', 400);
        }

        const profileRes = await pool.query('SELECT azit_xp FROM azit_profiles WHERE user_id = $1', [userId]);
        const levelInfo = getAzitLevelInfo(Number(profileRes.rows[0]?.azit_xp ?? 0));
        if (levelInfo.level < def.requiredAzitLevel) {
            throw new AzitGameError(
                `[${def.name}] 용병은 아지트 Lv.${def.requiredAzitLevel}부터 영입할 수 있습니다.`,
                400
            );
        }

        const existingRes = await pool.query(
            `SELECT merc_code FROM azit_mercenaries WHERE user_id = $1 AND is_deleted = 0`,
            [userId]
        );
        if (existingRes.rows.some((r) => r.merc_code === def.mercCode)) {
            throw new AzitGameError(`이미 [${def.name}] 용병이 아지트에 합류해 있습니다.`, 400);
        }
        if (existingRes.rows.length >= levelInfo.maxMercs) {
            throw new AzitGameError(
                `현재 아지트 레벨(Lv.${levelInfo.level})에서는 최대 ${levelInfo.maxMercs}명의 용병만 영입할 수 있습니다.`,
                400
            );
        }

        await this.deductVeraPoints({
            userId,
            amount: def.hireCost,
            txType: 'merc_hire',
            refId: def.mercCode,
            description: `${def.emoji} 용병 [${def.name}] 영입`,
        });

        try {
            await pool.query(
                `INSERT INTO azit_mercenaries (user_id, merc_code, level, xp, status, is_deleted, deleted_at)
                 VALUES ($1, $2, 1, 0, 'idle', 0, NULL)
                 ON CONFLICT (user_id, merc_code) DO UPDATE SET
                    is_deleted = 0,
                    deleted_at = NULL,
                    level = 1,
                    xp = 0,
                    status = 'idle',
                    updated_at = CURRENT_TIMESTAMP`,
                [userId, def.mercCode]
            );
        } catch (err) {
            await this.creditVeraPoints({
                userId,
                amount: def.hireCost,
                txType: 'refund',
                refId: def.mercCode,
                description: `용병 영입 실패 환불 (${def.name})`,
                countAsActivity: false,
            });
            throw err;
        }

        const state = await this.getState(userId);
        return {
            message: `⚔️ [${def.emoji} ${def.name}] (${def.role}) 용병을 영입했습니다! 도시락을 챙겨 몬스터 원정에 출정해 보세요.`,
            state,
        };
    }

    static async upgradeMercenary(userId: number, mercCode: string) {
        await this.ensureUserInitialized(userId);
        const def = getMercDef(mercCode);
        if (!def) {
            throw new AzitGameError('존재하지 않는 용병입니다.', 400);
        }

        const mercRes = await pool.query(
            `SELECT level, status FROM azit_mercenaries WHERE user_id = $1 AND merc_code = $2 AND is_deleted = 0`,
            [userId, def.mercCode]
        );
        if (mercRes.rows.length === 0) {
            throw new AzitGameError('영입하지 않은 용병입니다.', 404);
        }
        const merc = mercRes.rows[0];
        if (merc.status === 'expedition') {
            throw new AzitGameError('원정 중인 용병은 귀환 후 훈련할 수 있습니다.', 400);
        }

        const currentLevel = Number(merc.level ?? 1);
        if (currentLevel >= def.maxLevel) {
            throw new AzitGameError(`[${def.name}] 용병은 이미 최고 레벨(Lv.${def.maxLevel})입니다.`, 400);
        }

        const cost = getMercUpgradeCost(currentLevel);
        await this.deductVeraPoints({
            userId,
            amount: cost,
            txType: 'merc_upgrade',
            refId: def.mercCode,
            description: `${def.emoji} 용병 [${def.name}] Lv.${currentLevel + 1} 훈련 강화`,
        });

        await pool.query(
            `UPDATE azit_mercenaries
             SET level = level + 1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1 AND merc_code = $2 AND is_deleted = 0`,
            [userId, def.mercCode]
        );

        const state = await this.getState(userId);
        return {
            message: `💪 [${def.emoji} ${def.name}] Lv.${currentLevel + 1} 훈련 완료! 전투력이 크게 상승했습니다.`,
            state,
        };
    }

    static async startExpedition(params: {
        userId: number;
        zoneId: string;
        partyMercCodes: string[];
        dishRecipeId: string;
    }) {
        const { userId, zoneId, partyMercCodes, dishRecipeId } = params;
        await this.ensureUserInitialized(userId);

        const zone = getZoneDef(zoneId);
        if (!zone) {
            throw new AzitGameError('존재하지 않는 원정 지역입니다.', 400);
        }
        const recipe = getRecipeDef(dishRecipeId);
        if (!recipe) {
            throw new AzitGameError('존재하지 않는 원정 도시락입니다.', 400);
        }

        const profileRes = await pool.query('SELECT azit_xp FROM azit_profiles WHERE user_id = $1', [userId]);
        const levelInfo = getAzitLevelInfo(Number(profileRes.rows[0]?.azit_xp ?? 0));

        if (levelInfo.level < zone.requiredAzitLevel) {
            throw new AzitGameError(
                `[${zone.name}] 지역은 아지트 Lv.${zone.requiredAzitLevel}부터 출정할 수 있습니다.`,
                400
            );
        }

        const activeRes = await pool.query(
            `SELECT id FROM azit_expeditions
             WHERE user_id = $1 AND status IN ('running', 'claiming') AND is_deleted = 0`,
            [userId]
        );
        if (activeRes.rows.length >= levelInfo.maxActiveExpeditions) {
            throw new AzitGameError(
                `현재 아지트 레벨(Lv.${levelInfo.level})에서는 최대 ${levelInfo.maxActiveExpeditions}개 원정대만 동시 운영할 수 있습니다.`,
                400
            );
        }

        const uniqueParty = Array.from(new Set(partyMercCodes));
        if (uniqueParty.length === 0) {
            throw new AzitGameError('최소 1명의 용병을 선택해 주세요.', 400);
        }
        if (uniqueParty.length > levelInfo.maxPartySize) {
            throw new AzitGameError(
                `현재 아지트 레벨(Lv.${levelInfo.level})에서는 최대 ${levelInfo.maxPartySize}명까지 파티를 편성할 수 있습니다.`,
                400
            );
        }

        if (recipe.tier < zone.minDishTier) {
            throw new AzitGameError(
                `[${zone.name}] 출정에는 티어 ${zone.minDishTier} 이상 요리가 필수입니다.`,
                400
            );
        }

        const mercRowsRes = await pool.query(
            `SELECT merc_code, level, status FROM azit_mercenaries WHERE user_id = $1 AND is_deleted = 0`,
            [userId]
        );
        const partyMercDetails: Array<{ mercCode: string; level: number }> = [];
        for (const code of uniqueParty) {
            const row = mercRowsRes.rows.find((r) => r.merc_code === code);
            const mDef = getMercDef(code);
            if (!row || !mDef) {
                throw new AzitGameError('영입되지 않은 용병이 포함되어 있습니다.', 400);
            }
            if (row.status !== 'idle') {
                throw new AzitGameError(`[${mDef.name}] 용병은 이미 다른 원정에 출정 중입니다.`, 400);
            }
            partyMercDetails.push({ mercCode: code, level: Number(row.level ?? 1) });
        }

        const { winRatePct } = calculateExpeditionWinRate({
            mercenaries: partyMercDetails,
            recipeId: recipe.recipeId,
            zoneId: zone.zoneId,
        });

        // 1) 필수 도시락 1개 원자적 차감
        const dishDeduct = await pool.query(
            `UPDATE azit_dish_inventory
             SET qty = qty - 1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1 AND recipe_id = $2 AND qty >= 1 AND is_deleted = 0`,
            [userId, recipe.recipeId]
        );
        if (dishDeduct.rowCount === 0) {
            throw new AzitGameError(
                `보유 중인 [${recipe.emoji} ${recipe.name}] 도시락이 없습니다. 주방에서 먼저 조리해 주세요!`,
                400
            );
        }

        // 2) 출정비 차감 (실패 시 도시락 복구)
        try {
            await this.deductVeraPoints({
                userId,
                amount: zone.entryCost,
                txType: 'expedition_entry',
                refId: zone.zoneId,
                description: `${zone.emoji} ${zone.name} 출정비`,
            });
        } catch (err) {
            await pool.query(
                `UPDATE azit_dish_inventory SET qty = qty + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND recipe_id = $2`,
                [userId, recipe.recipeId]
            );
            throw err;
        }

        // 3) 용병 출정 상태 잠금 (실패 시 도시락 + 출정비 모두 복구)
        const lockedMercs: string[] = [];
        const nowMs = Date.now();
        const endsAtMs = nowMs + zone.durationSec * 1000;
        try {
            for (const code of uniqueParty) {
                const lockRes = await pool.query(
                    `UPDATE azit_mercenaries
                     SET status = 'expedition',
                         updated_at = CURRENT_TIMESTAMP
                     WHERE user_id = $1 AND merc_code = $2 AND status = 'idle' AND is_deleted = 0`,
                    [userId, code]
                );
                if (lockRes.rowCount === 0) {
                    throw new AzitGameError('일부 용병이 이미 출정 상태입니다. 다시 선택해 주세요.', 409);
                }
                lockedMercs.push(code);
            }

            await pool.query(
                `INSERT INTO azit_expeditions (
                    user_id, zone_id, party_merc_codes_json, dish_recipe_id,
                    entry_cost, predicted_win_rate, status, started_at_ms, ends_at_ms
                 )
                 VALUES ($1, $2, $3, $4, $5, $6, 'running', $7, $8)`,
                [
                    userId,
                    zone.zoneId,
                    JSON.stringify(uniqueParty),
                    recipe.recipeId,
                    zone.entryCost,
                    winRatePct,
                    nowMs,
                    endsAtMs,
                ]
            );
        } catch (err) {
            for (const code of lockedMercs) {
                await pool.query(
                    `UPDATE azit_mercenaries SET status = 'idle' WHERE user_id = $1 AND merc_code = $2`,
                    [userId, code]
                );
            }
            await pool.query(
                `UPDATE azit_dish_inventory SET qty = qty + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND recipe_id = $2`,
                [userId, recipe.recipeId]
            );
            await this.creditVeraPoints({
                userId,
                amount: zone.entryCost,
                txType: 'refund',
                refId: zone.zoneId,
                description: `${zone.name} 출정 취소 환불`,
                countAsActivity: false,
            });
            throw err;
        }

        const state = await this.getState(userId);
        return {
            message: `⚔️ [${zone.emoji} ${zone.name}] 원정 출정 완료! (예상 승률 ${winRatePct}% · 도시락 1개 장착)`,
            state,
        };
    }

    static async claimExpedition(userId: number, expeditionId: number) {
        await this.ensureUserInitialized(userId);
        if (!Number.isInteger(expeditionId) || expeditionId <= 0) {
            throw new AzitGameError('올바른 원정 ID가 아닙니다.', 400);
        }

        const expRes = await pool.query(
            `SELECT * FROM azit_expeditions
             WHERE id = $1 AND user_id = $2 AND is_deleted = 0`,
            [expeditionId, userId]
        );
        const expRow = expRes.rows[0];
        if (!expRow) {
            throw new AzitGameError('원정 기록을 찾을 수 없습니다.', 404);
        }
        if (expRow.status !== 'running') {
            throw new AzitGameError('이미 정산이 완료된 원정입니다.', 409);
        }

        const nowMs = Date.now();
        if (Number(expRow.ends_at_ms) > nowMs) {
            const remainSec = Math.ceil((Number(expRow.ends_at_ms) - nowMs) / 1000);
            throw new AzitGameError(`용병단이 아직 복귀 중입니다. (${remainSec}초 남음)`, 400);
        }

        // 1단계 원자적 잠금: 동시 중복 정산 원천 차단
        const lockClaim = await pool.query(
            `UPDATE azit_expeditions
             SET status = 'claiming'
             WHERE id = $1 AND user_id = $2 AND status = 'running' AND ends_at_ms <= $3 AND is_deleted = 0`,
            [expeditionId, userId, nowMs]
        );
        if (lockClaim.rowCount === 0) {
            throw new AzitGameError('이미 정산 중인 원정입니다.', 409);
        }

        try {
            const zone = getZoneDef(String(expRow.zone_id));
            const recipe = getRecipeDef(String(expRow.dish_recipe_id));
            const partyCodes = JSON.parse(String(expRow.party_merc_codes_json || '[]')) as AzitMercCode[];

            if (!zone || !recipe) {
                throw new AzitGameError('원정 메타데이터가 올바르지 않습니다.', 400);
            }

            const winRate = Number(expRow.predicted_win_rate ?? 50);
            const roll = crypto.randomInt(1, 101);
            const won = roll <= winRate;

            let rewardPoints = 0;
            let rewardAzitXp = 0;
            let dropQty = 0;
            const rewardMaterials: Partial<Record<AzitMaterialId, number>> = {};
            const matDef = getMaterialDef(zone.dropMaterialId);
            const mercNames = partyCodes.map((c) => getMercDef(c)?.name || c);

            if (won) {
                let bossBonusPct = 0;
                if (zone.isBoss) {
                    for (const code of partyCodes) {
                        const mDef = getMercDef(code);
                        if (mDef) {
                            bossBonusPct += mDef.bossRewardBonusPct;
                        }
                    }
                }
                rewardPoints = Math.round(zone.rewardPoints * (1 + bossBonusPct / 100));
                rewardAzitXp = zone.rewardAzitXp;
                dropQty =
                    zone.dropMinQty === zone.dropMaxQty
                        ? zone.dropMinQty
                        : crypto.randomInt(zone.dropMinQty, zone.dropMaxQty + 1);
                rewardMaterials[zone.dropMaterialId] = dropQty;

                await this.creditVeraPoints({
                    userId,
                    amount: rewardPoints,
                    txType: 'expedition_reward',
                    refId: String(expeditionId),
                    description: `${zone.emoji} ${zone.name} 토벌 승리 보상`,
                });

                await pool.query(
                    `INSERT INTO azit_material_inventory (user_id, material_id, qty)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (user_id, material_id) DO UPDATE SET
                        qty = azit_material_inventory.qty + $4,
                        is_deleted = 0,
                        deleted_at = NULL,
                        updated_at = CURRENT_TIMESTAMP`,
                    [userId, zone.dropMaterialId, dropQty, dropQty]
                );

                // 용병 경험치 적립 & 자동 레벨업
                for (const code of partyCodes) {
                    const mDef = getMercDef(code);
                    const mRes = await pool.query(
                        `SELECT level, xp FROM azit_mercenaries WHERE user_id = $1 AND merc_code = $2`,
                        [userId, code]
                    );
                    if (mRes.rows.length > 0 && mDef) {
                        let lv = Number(mRes.rows[0].level ?? 1);
                        let xp = Number(mRes.rows[0].xp ?? 0) + zone.rewardMercXp;
                        while (lv < mDef.maxLevel && xp >= getMercNextXp(lv)) {
                            xp -= getMercNextXp(lv);
                            lv += 1;
                        }
                        if (lv >= mDef.maxLevel) {
                            xp = 0;
                        }
                        await pool.query(
                            `UPDATE azit_mercenaries
                             SET level = $1,
                                 xp = $2,
                                 status = 'idle',
                                 updated_at = CURRENT_TIMESTAMP
                             WHERE user_id = $3 AND merc_code = $4`,
                            [lv, xp, userId, code]
                        );
                    }
                }

                await pool.query(
                    `UPDATE azit_profiles
                     SET total_expeditions_won = total_expeditions_won + 1,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE user_id = $1`,
                    [userId]
                );
                await this.addAzitXp(userId, rewardAzitXp);
            } else {
                // 패배 시 용병 idle 복귀만 처리 (출정비/도시락은 출정 시 이미 소모 확정)
                for (const code of partyCodes) {
                    await pool.query(
                        `UPDATE azit_mercenaries
                         SET status = 'idle',
                             updated_at = CURRENT_TIMESTAMP
                         WHERE user_id = $1 AND merc_code = $2`,
                        [userId, code]
                    );
                }
                await pool.query(
                    `UPDATE azit_profiles
                     SET total_expeditions_lost = total_expeditions_lost + 1,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE user_id = $1`,
                    [userId]
                );
            }

            const battleLog = generateBattleLog({
                won,
                zone,
                mercenaryNames: mercNames,
                dishName: recipe.name,
                dishEmoji: recipe.emoji,
                rewardPoints,
                materialName: matDef?.name || zone.dropMaterialId,
                materialEmoji: matDef?.emoji || '🎁',
                dropQty,
            });

            const finalStatus = won ? 'won' : 'lost';
            await pool.query(
                `UPDATE azit_expeditions
                 SET status = $1,
                     claimed_at = CURRENT_TIMESTAMP,
                     reward_points = $2,
                     reward_xp = $3,
                     reward_materials_json = $4,
                     battle_log_json = $5
                 WHERE id = $6 AND user_id = $7`,
                [
                    finalStatus,
                    rewardPoints,
                    rewardAzitXp,
                    JSON.stringify(rewardMaterials),
                    JSON.stringify(battleLog),
                    expeditionId,
                    userId,
                ]
            );

            const state = await this.getState(userId);
            return {
                message: won
                    ? `🏆 [${zone.emoji} ${zone.name}] 토벌 승리! (+${rewardPoints.toLocaleString()}P)`
                    : `💔 [${zone.emoji} ${zone.name}] 토벌 실패... 용병 강화 후 재도전해 보세요.`,
                report: {
                    expeditionId,
                    zoneId: zone.zoneId,
                    zoneName: zone.name,
                    zoneEmoji: zone.emoji,
                    monsterName: zone.monsterName,
                    won,
                    predictedWinRate: winRate,
                    rewardPoints,
                    rewardXp: rewardAzitXp,
                    rewardMaterials,
                    entryCostLost: Number(expRow.entry_cost ?? zone.entryCost),
                    lostDishId: recipe.recipeId,
                    battleLog,
                },
                state,
            };
        } catch (err) {
            await pool.query(
                `UPDATE azit_expeditions SET status = 'running' WHERE id = $1 AND user_id = $2 AND status = 'claiming'`,
                [expeditionId, userId]
            );
            throw err;
        }
    }
}
