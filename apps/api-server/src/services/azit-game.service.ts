import { AsyncLocalStorage } from 'node:async_hooks';
import crypto from 'crypto';
import { pool } from '@faithportal/database';
import { NotificationService } from './notification.service.js';
import {
    runCombatSimulation,
    type CombatFrame,
    type CombatUnitInput,
} from './azit-combat.engine.js';
import {
    AZIT_CHEFS,
    AZIT_CRAFT_RECIPES,
    AZIT_CROPS,
    AZIT_EXPEDITION_ZONES,
    AZIT_FARMERS,
    AZIT_FERTILIZERS,
    AZIT_ITEMS,
    AZIT_LEVEL_TABLE,
    AZIT_MATERIALS,
    AZIT_MERCENARIES,
    AZIT_PLOT_UNLOCKS,
    AZIT_RECIPES,
    AZIT_SOIL_LEVELS,
    AZIT_TOWER_THEMES,
    AzitChefCode,
    AzitCropDef,
    AzitCropId,
    AzitDishQuality,
    AzitFarmerCode,
    AzitFarmerRole,
    AzitFertilizerId,
    AzitItemId,
    AzitMaterialId,
    AzitMercCode,
    AzitMonsterDef,
    AzitRecipeId,
    AzitTowerFloorSummary,
    AzitTowerRewardBundle,
    AzitZoneId,
    AzitZoneThemeId,
    DEFAULT_FERTILIZER_ID,
    FARMER_TASK_XP,
    GARDEN_HARVEST_AZIT_XP,
    GARDEN_WATER_COOLDOWN_MS,
    MAX_FARMER_LEVEL,
    MAX_FERTILIZER_PER_CROP,
    MAX_GARDEN_PLOTS,
    MAX_SKILL_LEVEL,
    MAX_SOIL_LEVEL,
    MAX_TOWER_FLOOR,
    MERC_GOLD_UPGRADE_ENABLED,
    STARTER_GARDEN_PLOTS,
    SoilHarvestYieldResult,
    applyMercenaryCombatXp,
    buildMercCombatUnit,
    buildTowerEnemyUnits,
    buildZoneEnemyUnits,
    calculateExpeditionWinRate,
    calculateHarvestYieldWithSoil,
    getAzitLevelInfo,
    getChefDef,
    getChefEffectiveStats,
    getChefUpgradeCost,
    getCraftRecipeDef,
    getCropDef,
    getDishEffectiveBuffs,
    getDishSellPrice,
    getEffectiveCookDurationSec,
    getFarmerDef,
    getFarmerLevelStats,
    getFarmerNextLevelXp,
    getFarmerUpgradeCost,
    getFertilizerDef,
    getItemDef,
    getMaterialDef,
    getMercDef,
    getMercNextXp,
    getMercenaryCombatStats,
    getMercenaryEffectivePower,
    getNextSoilLevelDef,
    getPlotUnlockDef,
    getRecipeDef,
    getTowerFloorDef,
    getTowerFloorSummaries,
    getZoneDef,
} from './azit-game.catalog.js';

export class AzitGameError extends Error {
    readonly statusCode: number;
    readonly errorCode?: string;

    constructor(message: string, statusCode = 400, errorCode?: string) {
        super(message);
        this.name = 'AzitGameError';
        this.statusCode = statusCode;
        this.errorCode = errorCode;
    }
}

export interface ServerGardenPlot {
    plotIndex: number;
    isUnlocked: boolean;
    unlockLevel: number;
    unlockCost: number;
    soilLevel: number;
    cropId: AzitCropId | null;
    stage: 0 | 1 | 2 | 3;
    waterCount: number;
    plantedAt: string | null;
    lastWateredAt: string | null;
    nextWaterAtMs: number | null;
    fertilizerUsedCount: number;
    waterNotifiedAt: string | null;
}

export interface ServerGardenState {
    plots: ServerGardenPlot[];
    seedCounts: Record<AzitCropId, number>;
    harvestCounts: Record<AzitCropId, number>;
    fertilizerCounts: Record<AzitFertilizerId, number>;
    totalHarvested: number;
    unlockedPlotCount: number;
    maxPlotCount: number;
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

export interface AzitMercSkillSnapshot {
    id: string;
    name: string;
    emoji: string;
    description: string;
    level: number;
    maxLevel: number;
    cooldownMs: number;
    powerPct: number;
}

export interface AzitMercenaryRecord {
    mercCode: AzitMercCode;
    level: number;
    xp: number;
    nextXp: number;
    power: number;
    status: 'idle' | 'expedition' | 'dead';
    upgradeCost: number | null;
    role: '탱커' | '레인저' | '딜러' | '힐러' | '올라운더';
    combatRole: 'tank' | 'ranger' | 'mage' | 'healer' | 'berserker' | 'allrounder';
    hp: number;
    maxHp: number;
    atk: number;
    def: number;
    spd: number;
    range: number;
    diedAt: string | null;
    deathZoneId: AzitZoneId | null;
    mainSkill: AzitMercSkillSnapshot;
    subSkill: AzitMercSkillSnapshot;
}

export interface AzitMercenaryGroupRecord {
    id: number;
    name: string;
    slotIndex: number;
    mercCodes: AzitMercCode[];
}

export interface AzitItemInventoryRecord {
    itemId: AzitItemId;
    qty: number;
}

export interface AzitTowerProgressState {
    highestClearedFloor: number;
    maxFloor: number;
    totalClears: number;
    totalAttempts: number;
}

export interface AzitExpeditionRecord {
    id: number;
    zoneId: AzitZoneId;
    partyMercCodes: AzitMercCode[];
    dishRecipeId: AzitRecipeId;
    dishQuality: AzitDishQuality;
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
    groupId: number | null;
    groupName: string | null;
    durationSec: number;
    zoneTheme?: AzitZoneThemeId;
    monsters?: AzitMonsterDef[];
    battleSeed?: number;
    partySnapshot?: CombatUnitInput[];
    casualties: AzitMercCode[];
    rewardItems: Partial<Record<AzitItemId, number>>;
    rewardCrops: Partial<Record<AzitCropId, number>>;
    rewardMercXp: number;
}

export interface AzitLedgerRecord {
    id: number;
    deltaPoints: number;
    balanceAfter: number;
    txType: string;
    description: string;
    createdAt: string;
}

export interface AzitFarmerRecord {
    farmerCode: AzitFarmerCode;
    name: string;
    title: string;
    emoji: string;
    grade: 1 | 2 | 3 | 4;
    gradeName: string;
    level: number;
    xp: number;
    nextLevelXp: number;
    autoEnabled: boolean;
    autoFertilize: boolean;
    preferredCropId: AzitCropId | null;
    workIntervalMs: number;
    waterCooldownReductionPct: number;
    roles: AzitFarmerRole[];
    lastAutoTickMs: number;
    nextAutoRunAtMs: number | null;
    totalWatered: number;
    totalHarvested: number;
    totalPlanted: number;
    upgradeCost: number | null;
}

export interface AzitFarmerLogRecord {
    id: number;
    farmerCode: AzitFarmerCode;
    actionType: AzitFarmerRole;
    plotIndex: number;
    cropId: AzitCropId | null;
    detail: string;
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
            maxGardenPlots: number;
            unlockedPlots: number;
            maxFarmers: number;
        };
        totalCropsSold: number;
        totalDishesCooked: number;
        totalExpeditionsWon: number;
        totalExpeditionsLost: number;
    };
    veraPoints: number;
    serverNowMs: number;
    garden: ServerGardenState;
    materials: Record<AzitMaterialId, number>;
    dishes: Record<AzitRecipeId, number>;
    specialDishes: Record<AzitRecipeId, number>;
    chefs: AzitChefRecord[];
    kitchenSlots: AzitKitchenSlotRecord[];
    mercenaries: AzitMercenaryRecord[];
    groups: AzitMercenaryGroupRecord[];
    items: AzitItemInventoryRecord[];
    tower: AzitTowerProgressState;
    activeExpeditions: AzitExpeditionRecord[];
    recentExpeditions: AzitExpeditionRecord[];
    recentLedger: AzitLedgerRecord[];
    farmers: AzitFarmerRecord[];
    farmerLogs: AzitFarmerLogRecord[];
    catalog: {
        crops: typeof AZIT_CROPS;
        fertilizers: typeof AZIT_FERTILIZERS;
        soilLevels: typeof AZIT_SOIL_LEVELS;
        plotUnlocks: typeof AZIT_PLOT_UNLOCKS;
        materials: typeof AZIT_MATERIALS;
        recipes: typeof AZIT_RECIPES;
        chefs: typeof AZIT_CHEFS;
        farmers: typeof AZIT_FARMERS;
        mercenaries: typeof AZIT_MERCENARIES;
        zones: typeof AZIT_EXPEDITION_ZONES;
        levels: typeof AZIT_LEVEL_TABLE;
        items: typeof AZIT_ITEMS;
        craftRecipes: typeof AZIT_CRAFT_RECIPES;
        towerThemes: typeof AZIT_TOWER_THEMES;
        towerFloorsSummary: AzitTowerFloorSummary[];
    };
}

export interface AzitSoilHarvestYieldOutcome extends SoilHarvestYieldResult {
    soilLevel: number;
    luckyBonus: number;
}

export function calculateSoilHarvestYield(
    crop: AzitCropDef,
    soilLevel: number,
    rollPctFn?: () => number
): AzitSoilHarvestYieldOutcome {
    const clampedSoil = Math.max(0, Math.min(MAX_SOIL_LEVEL, Math.floor(soilLevel)));
    const rollPct = typeof rollPctFn === 'function' ? rollPctFn() : undefined;
    const result = calculateHarvestYieldWithSoil(crop.harvestYield, clampedSoil, rollPct);
    return {
        ...result,
        soilLevel: clampedSoil,
        luckyBonus: result.chanceBonus,
    };
}

function resolvePlotNextWaterAtMs(row: {
    stage?: unknown;
    crop_id?: unknown;
    last_watered_at?: unknown;
    next_water_at_ms?: unknown;
}): number | null {
    const stage = Number(row.stage ?? 0);
    if (!row.crop_id || stage <= 0 || stage >= 3) return null;
    if (row.next_water_at_ms !== null && row.next_water_at_ms !== undefined) {
        const parsed = Number(row.next_water_at_ms);
        if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    if (row.last_watered_at) {
        const lastMs = Date.parse(String(row.last_watered_at));
        if (!Number.isNaN(lastMs)) {
            return lastMs + GARDEN_WATER_COOLDOWN_MS;
        }
    }
    return null;
}

function assertValidPlotIndex(plotIndex: number): void {
    if (!Number.isInteger(plotIndex) || plotIndex < 0 || plotIndex >= MAX_GARDEN_PLOTS) {
        throw new AzitGameError(`올바른 텃밭 번호(0~${MAX_GARDEN_PLOTS - 1})가 아닙니다.`, 400);
    }
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
const VALID_FERTILIZER_IDS = new Set<string>(AZIT_FERTILIZERS.map((f) => f.fertilizerId));
const VALID_MATERIAL_IDS = new Set<string>(AZIT_MATERIALS.map((m) => m.materialId));
const VALID_RECIPE_IDS = new Set<string>(AZIT_RECIPES.map((r) => r.recipeId));
const VALID_ITEM_IDS = new Set<string>(AZIT_ITEMS.map((i) => i.itemId));
const SLOT_UNLOCK_LEVELS: Record<number, number> = { 0: 1, 1: 3, 2: 6 };
const MAX_MERC_GROUPS = 6;

function createEmptySeedMap(): Record<AzitCropId, number> {
    const map = {} as Record<AzitCropId, number>;
    for (const crop of AZIT_CROPS) {
        map[crop.cropId] = 0;
    }
    return map;
}

function createEmptyFertilizerMap(): Record<AzitFertilizerId, number> {
    const map = {} as Record<AzitFertilizerId, number>;
    for (const fert of AZIT_FERTILIZERS) {
        map[fert.fertilizerId] = 0;
    }
    return map;
}

function createEmptyMaterialMap(): Record<AzitMaterialId, number> {
    const map = {} as Record<AzitMaterialId, number>;
    for (const mat of AZIT_MATERIALS) {
        map[mat.materialId] = 0;
    }
    return map;
}

function createEmptyDishMap(): Record<AzitRecipeId, number> {
    const map = {} as Record<AzitRecipeId, number>;
    for (const recipe of AZIT_RECIPES) {
        map[recipe.recipeId] = 0;
    }
    return map;
}

let sqliteTxQueue: Promise<void> = Promise.resolve();
const sqliteQueueStorage = new AsyncLocalStorage<{ inQueue: boolean }>();

async function runSerializedDbOp<T>(fn: () => Promise<T>): Promise<T> {
    if (sqliteQueueStorage.getStore()?.inQueue) {
        return fn();
    }
    const previous = sqliteTxQueue;
    let release!: () => void;
    sqliteTxQueue = new Promise<void>((resolve) => {
        release = resolve;
    });

    await previous;
    try {
        return await sqliteQueueStorage.run({ inQueue: true }, fn);
    } finally {
        release();
    }
}

async function runSerializedTransaction<T>(fn: () => Promise<T>): Promise<T> {
    return runSerializedDbOp(async () => {
        await pool.query('BEGIN IMMEDIATE');
        try {
            const result = await fn();
            await pool.query('COMMIT');
            return result;
        } catch (err) {
            try {
                await pool.query('ROLLBACK');
            } catch (rollbackErr) {
                console.error('[AzitGameService] SQLite ROLLBACK failed:', rollbackErr);
            }
            throw err;
        }
    });
}

export class AzitGameService {
    private static ensureTablesPromise: Promise<void> | null = null;
    private static readonly userLocks = new Map<number, Promise<void>>();

    static async runWithUserLock<T>(userId: number, fn: () => Promise<T>): Promise<T> {
        const previous = this.userLocks.get(userId) ?? Promise.resolve();
        let release!: () => void;
        const current = new Promise<void>((resolve) => {
            release = resolve;
        });
        const tail = previous.then(() => current, () => current);
        this.userLocks.set(userId, tail);

        await previous;
        try {
            return await runSerializedDbOp(fn);
        } finally {
            release();
            if (this.userLocks.get(userId) === tail) {
                this.userLocks.delete(userId);
            }
        }
    }

    static async ensureTables(): Promise<void> {
        if (!this.ensureTablesPromise) {
            this.ensureTablesPromise = runSerializedDbOp(() => this.createTablesInternal()).catch((err) => {
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
            `CREATE TABLE IF NOT EXISTS azit_fertilizer_inventory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                fertilizer_id TEXT NOT NULL,
                qty INTEGER NOT NULL DEFAULT 0,
                is_deleted INTEGER NOT NULL DEFAULT 0,
                deleted_at DATETIME,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, fertilizer_id)
            );`,
            `CREATE INDEX IF NOT EXISTS idx_azit_fertilizer_user ON azit_fertilizer_inventory(user_id);`,
            `CREATE INDEX IF NOT EXISTS idx_azit_expeditions_user_status ON azit_expeditions(user_id, status, ends_at_ms);`,
            `CREATE TABLE IF NOT EXISTS azit_farmers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                farmer_code TEXT NOT NULL,
                level INTEGER NOT NULL DEFAULT 1,
                xp INTEGER NOT NULL DEFAULT 0,
                grade INTEGER NOT NULL DEFAULT 1,
                auto_enabled INTEGER NOT NULL DEFAULT 1,
                auto_fertilize INTEGER NOT NULL DEFAULT 0,
                preferred_crop_id TEXT,
                last_auto_tick_ms INTEGER NOT NULL DEFAULT 0,
                total_watered INTEGER NOT NULL DEFAULT 0,
                total_harvested INTEGER NOT NULL DEFAULT 0,
                total_planted INTEGER NOT NULL DEFAULT 0,
                is_deleted INTEGER NOT NULL DEFAULT 0,
                deleted_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, farmer_code)
            );`,
            `CREATE INDEX IF NOT EXISTS idx_azit_farmers_user ON azit_farmers(user_id, is_deleted);`,
            `CREATE INDEX IF NOT EXISTS idx_azit_farmers_auto ON azit_farmers(auto_enabled, is_deleted, last_auto_tick_ms);`,
            `CREATE TABLE IF NOT EXISTS azit_farmer_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                farmer_code TEXT NOT NULL,
                action_type TEXT NOT NULL,
                plot_index INTEGER NOT NULL,
                crop_id TEXT,
                detail TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );`,
            `CREATE INDEX IF NOT EXISTS idx_azit_farmer_logs_user ON azit_farmer_logs(user_id, id DESC);`,
            `CREATE TABLE IF NOT EXISTS azit_mercenary_groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                slot_index INTEGER NOT NULL DEFAULT 0,
                merc_codes_json TEXT NOT NULL,
                is_deleted INTEGER NOT NULL DEFAULT 0,
                deleted_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );`,
            `CREATE INDEX IF NOT EXISTS idx_azit_groups_user ON azit_mercenary_groups(user_id, is_deleted, slot_index);`,
            `CREATE TABLE IF NOT EXISTS azit_item_inventory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                item_id TEXT NOT NULL,
                qty INTEGER NOT NULL DEFAULT 0,
                is_deleted INTEGER NOT NULL DEFAULT 0,
                deleted_at DATETIME,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, item_id)
            );`,
            `CREATE INDEX IF NOT EXISTS idx_azit_items_user ON azit_item_inventory(user_id, is_deleted);`,
            `CREATE TABLE IF NOT EXISTS azit_tower_progress (
                user_id INTEGER PRIMARY KEY,
                highest_cleared_floor INTEGER NOT NULL DEFAULT 0,
                total_clears INTEGER NOT NULL DEFAULT 0,
                total_attempts INTEGER NOT NULL DEFAULT 0,
                last_cleared_at DATETIME,
                is_deleted INTEGER NOT NULL DEFAULT 0,
                deleted_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );`,
            `CREATE TABLE IF NOT EXISTS azit_tower_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                group_id INTEGER,
                floor INTEGER NOT NULL,
                party_merc_codes_json TEXT NOT NULL,
                elixir_item_id TEXT,
                won INTEGER NOT NULL DEFAULT 0,
                is_first_clear INTEGER NOT NULL DEFAULT 0,
                battle_seed INTEGER NOT NULL,
                duration_ms INTEGER NOT NULL DEFAULT 0,
                reward_points INTEGER NOT NULL DEFAULT 0,
                reward_azit_xp INTEGER NOT NULL DEFAULT 0,
                reward_merc_xp INTEGER NOT NULL DEFAULT 0,
                reward_materials_json TEXT,
                reward_crops_json TEXT,
                reward_items_json TEXT,
                battle_replay_json TEXT,
                battle_log_json TEXT,
                is_deleted INTEGER NOT NULL DEFAULT 0,
                deleted_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );`,
            `CREATE INDEX IF NOT EXISTS idx_azit_tower_runs_user ON azit_tower_runs(user_id, floor, id DESC);`,
        ];

        for (const sql of statements) {
            await pool.query(sql);
        }

        await this.ensureColumns('azit_profiles', [
            ['unlocked_plots', 'ALTER TABLE azit_profiles ADD COLUMN unlocked_plots INTEGER NOT NULL DEFAULT 6;'],
            ['fertilizer_qty', 'ALTER TABLE azit_profiles ADD COLUMN fertilizer_qty INTEGER NOT NULL DEFAULT 0;'],
        ]);

        await this.ensureColumns('azit_garden_plots', [
            ['is_unlocked', 'ALTER TABLE azit_garden_plots ADD COLUMN is_unlocked INTEGER NOT NULL DEFAULT 1;'],
            ['soil_level', 'ALTER TABLE azit_garden_plots ADD COLUMN soil_level INTEGER NOT NULL DEFAULT 0;'],
            ['next_water_at_ms', 'ALTER TABLE azit_garden_plots ADD COLUMN next_water_at_ms INTEGER;'],
            ['fertilizer_used_count', 'ALTER TABLE azit_garden_plots ADD COLUMN fertilizer_used_count INTEGER NOT NULL DEFAULT 0;'],
        ]);

        await this.ensureColumns('azit_dish_inventory', [
            ['special_qty', 'ALTER TABLE azit_dish_inventory ADD COLUMN special_qty INTEGER NOT NULL DEFAULT 0;'],
        ]);

        await this.ensureColumns('azit_mercenaries', [
            ['main_skill_level', 'ALTER TABLE azit_mercenaries ADD COLUMN main_skill_level INTEGER NOT NULL DEFAULT 1;'],
            ['sub_skill_level', 'ALTER TABLE azit_mercenaries ADD COLUMN sub_skill_level INTEGER NOT NULL DEFAULT 1;'],
            ['died_at', 'ALTER TABLE azit_mercenaries ADD COLUMN died_at DATETIME;'],
            ['death_zone_id', 'ALTER TABLE azit_mercenaries ADD COLUMN death_zone_id TEXT;'],
        ]);

        await this.ensureColumns('azit_expeditions', [
            ['dish_quality', "ALTER TABLE azit_expeditions ADD COLUMN dish_quality TEXT NOT NULL DEFAULT 'normal';"],
            ['group_id', 'ALTER TABLE azit_expeditions ADD COLUMN group_id INTEGER;'],
            ['group_name', 'ALTER TABLE azit_expeditions ADD COLUMN group_name TEXT;'],
            ['duration_sec', 'ALTER TABLE azit_expeditions ADD COLUMN duration_sec INTEGER NOT NULL DEFAULT 3600;'],
            ['battle_seed', 'ALTER TABLE azit_expeditions ADD COLUMN battle_seed INTEGER;'],
            ['party_snapshot_json', 'ALTER TABLE azit_expeditions ADD COLUMN party_snapshot_json TEXT;'],
            ['battle_replay_json', 'ALTER TABLE azit_expeditions ADD COLUMN battle_replay_json TEXT;'],
            ['dead_merc_codes_json', 'ALTER TABLE azit_expeditions ADD COLUMN dead_merc_codes_json TEXT;'],
            ['reward_items_json', 'ALTER TABLE azit_expeditions ADD COLUMN reward_items_json TEXT;'],
            ['reward_crops_json', 'ALTER TABLE azit_expeditions ADD COLUMN reward_crops_json TEXT;'],
            ['reward_merc_xp', 'ALTER TABLE azit_expeditions ADD COLUMN reward_merc_xp INTEGER NOT NULL DEFAULT 0;'],
            ['elixir_item_id', 'ALTER TABLE azit_expeditions ADD COLUMN elixir_item_id TEXT;'],
        ]);
    }

    private static async ensureColumns(
        tableName: string,
        columns: Array<[string, string]>
    ): Promise<void> {
        const infoRes = await pool.query(`PRAGMA table_info(${tableName})`);
        const existing = new Set(
            (infoRes.rows as Array<{ name?: unknown }>).map((r) => String(r.name || ''))
        );
        for (const [colName, alterSql] of columns) {
            if (!existing.has(colName)) {
                await pool.query(alterSql);
            }
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
        const safeXp = Number.isFinite(deltaXp) ? Math.max(0, Math.floor(deltaXp)) : 0;
        if (safeXp === 0) return;

        await pool.query(
            `UPDATE azit_profiles
             SET azit_xp = CASE WHEN azit_xp < 0 THEN $1 ELSE azit_xp + $2 END,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $3`,
            [safeXp, safeXp, userId]
        );
        const res = await pool.query('SELECT azit_xp FROM azit_profiles WHERE user_id = $1', [userId]);
        const rawNewXp = Number(res.rows[0]?.azit_xp ?? 0);
        const newXp = Number.isFinite(rawNewXp) ? Math.max(0, Math.floor(rawNewXp)) : 0;
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
        return runSerializedDbOp(() => this.ensureUserInitializedInternal(userId));
    }

    private static async ensureUserInitializedInternal(userId: number): Promise<void> {
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

        for (const fert of AZIT_FERTILIZERS) {
            await pool.query(
                `INSERT INTO azit_fertilizer_inventory (user_id, fertilizer_id, qty)
                 VALUES ($1, $2, 0)
                 ON CONFLICT (user_id, fertilizer_id) DO NOTHING`,
                [userId, fert.fertilizerId]
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
        }

        for (const item of AZIT_ITEMS) {
            await pool.query(
                `INSERT INTO azit_item_inventory (user_id, item_id, qty)
                 VALUES ($1, $2, 0)
                 ON CONFLICT (user_id, item_id) DO NOTHING`,
                [userId, item.itemId]
            );
        }

        await pool.query(
            `INSERT INTO azit_tower_progress (user_id, highest_cleared_floor, total_clears, total_attempts)
             VALUES ($1, 0, 0, 0)
             ON CONFLICT (user_id) DO NOTHING`,
            [userId]
        );

        // 0..15 전체 텃밭 구획 레코드 보장 (0..5 기본 해금, 6..15 잠금 상태; 기존 레코드는 보존)
        for (let plotIndex = 0; plotIndex < MAX_GARDEN_PLOTS; plotIndex += 1) {
            const defaultUnlocked = plotIndex < STARTER_GARDEN_PLOTS ? 1 : 0;
            await pool.query(
                `INSERT INTO azit_garden_plots (
                    user_id, plot_index, is_unlocked, soil_level, crop_id, stage, water_count, fertilizer_used_count
                 )
                 VALUES ($1, $2, $3, 0, NULL, 0, 0, 0)
                 ON CONFLICT (user_id, plot_index) DO NOTHING`,
                [userId, plotIndex, defaultUnlocked]
            );
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
        const defaultPlots: Array<{
            plotIndex: number;
            cropId: AzitCropId | null;
            stage: 0 | 1 | 2 | 3;
            waterCount: number;
            plantedAt: string | null;
            lastWateredAt: string | null;
            waterNotifiedAt: string | null;
        }> = [
            { plotIndex: 0, cropId: 'crop-carrot', stage: 2, waterCount: 2, plantedAt: starterNow, lastWateredAt: starterNow, waterNotifiedAt: null },
            { plotIndex: 1, cropId: 'crop-pepper', stage: 3, waterCount: 3, plantedAt: starterNow, lastWateredAt: starterNow, waterNotifiedAt: null },
            { plotIndex: 2, cropId: 'crop-tomato', stage: 1, waterCount: 1, plantedAt: starterNow, lastWateredAt: starterNow, waterNotifiedAt: null },
            { plotIndex: 3, cropId: 'crop-lettuce', stage: 2, waterCount: 2, plantedAt: starterNow, lastWateredAt: starterNow, waterNotifiedAt: null },
            { plotIndex: 4, cropId: null, stage: 0, waterCount: 0, plantedAt: null, lastWateredAt: null, waterNotifiedAt: null },
            { plotIndex: 5, cropId: null, stage: 0, waterCount: 0, plantedAt: null, lastWateredAt: null, waterNotifiedAt: null },
        ];

        for (let idx = 0; idx < STARTER_GARDEN_PLOTS; idx += 1) {
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

            const nextWaterAtMs =
                cropId && stage > 0 && stage < 3 && lastWateredAt && !Number.isNaN(Date.parse(lastWateredAt))
                    ? Date.parse(lastWateredAt) + GARDEN_WATER_COOLDOWN_MS
                    : null;

            await pool.query(
                `INSERT INTO azit_garden_plots (
                    user_id, plot_index, is_unlocked, soil_level, crop_id, stage, water_count, planted_at, last_watered_at, next_water_at_ms, fertilizer_used_count, water_notified_at
                 )
                 VALUES ($1, $2, 1, 0, $3, $4, $5, $6, $7, $8, 0, $9)
                 ON CONFLICT (user_id, plot_index) DO UPDATE SET
                    is_unlocked = 1,
                    crop_id = EXCLUDED.crop_id,
                    stage = EXCLUDED.stage,
                    water_count = EXCLUDED.water_count,
                    planted_at = EXCLUDED.planted_at,
                    last_watered_at = EXCLUDED.last_watered_at,
                    next_water_at_ms = EXCLUDED.next_water_at_ms,
                    water_notified_at = EXCLUDED.water_notified_at,
                    updated_at = CURRENT_TIMESTAMP`,
                [userId, idx, cropId, stage, waterCount, plantedAt, lastWateredAt, nextWaterAtMs, waterNotifiedAt]
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

        const fertRes = await pool.query(
            `SELECT fertilizer_id, qty
             FROM azit_fertilizer_inventory
             WHERE user_id = $1 AND is_deleted = 0`,
            [userId]
        );
        const fertilizerCounts = createEmptyFertilizerMap();
        for (const row of fertRes.rows) {
            const fId = String(row.fertilizer_id) as AzitFertilizerId;
            if (!VALID_FERTILIZER_IDS.has(fId)) continue;
            fertilizerCounts[fId] = Number(row.qty ?? 0);
        }

        const plotRes = await pool.query(
            `SELECT plot_index, is_unlocked, soil_level, crop_id, stage, water_count, planted_at, last_watered_at, next_water_at_ms, fertilizer_used_count, water_notified_at
             FROM azit_garden_plots
             WHERE user_id = $1 AND is_deleted = 0
             ORDER BY plot_index ASC`,
            [userId]
        );

        const plots: ServerGardenPlot[] = [];
        let unlockedPlotCount = 0;
        for (let idx = 0; idx < MAX_GARDEN_PLOTS; idx += 1) {
            const unlockDef = getPlotUnlockDef(idx);
            const unlockLevel = unlockDef?.unlockLevel ?? 1;
            const unlockCost = unlockDef?.unlockCost ?? 0;
            const row = plotRes.rows.find((r) => Number(r.plot_index) === idx);
            const isUnlocked = row
                ? Number(row.is_unlocked ?? (idx < STARTER_GARDEN_PLOTS ? 1 : 0)) === 1
                : idx < STARTER_GARDEN_PLOTS;
            if (isUnlocked) {
                unlockedPlotCount += 1;
            }
            const soilLevel = row
                ? Math.max(0, Math.min(MAX_SOIL_LEVEL, Number(row.soil_level ?? 0)))
                : 0;

            if (!row || !row.crop_id || !VALID_CROP_IDS.has(String(row.crop_id))) {
                plots.push({
                    plotIndex: idx,
                    isUnlocked,
                    unlockLevel,
                    unlockCost,
                    soilLevel,
                    cropId: null,
                    stage: 0,
                    waterCount: 0,
                    plantedAt: null,
                    lastWateredAt: null,
                    nextWaterAtMs: null,
                    fertilizerUsedCount: 0,
                    waterNotifiedAt: null,
                });
            } else {
                const rawStage = Number(row.stage ?? 1);
                const stage = (rawStage >= 3 ? 3 : rawStage <= 1 ? 1 : 2) as 1 | 2 | 3;
                plots.push({
                    plotIndex: idx,
                    isUnlocked,
                    unlockLevel,
                    unlockCost,
                    soilLevel,
                    cropId: String(row.crop_id) as AzitCropId,
                    stage,
                    waterCount: Number(row.water_count ?? rawStage),
                    plantedAt: (row.planted_at as string | null) ?? null,
                    lastWateredAt: (row.last_watered_at as string | null) ?? null,
                    nextWaterAtMs: resolvePlotNextWaterAtMs({
                        stage,
                        crop_id: row.crop_id,
                        last_watered_at: row.last_watered_at,
                        next_water_at_ms: row.next_water_at_ms,
                    }),
                    fertilizerUsedCount: Math.max(0, Number(row.fertilizer_used_count ?? 0)),
                    waterNotifiedAt: (row.water_notified_at as string | null) ?? null,
                });
            }
        }

        return {
            plots,
            seedCounts,
            harvestCounts,
            fertilizerCounts,
            totalHarvested,
            unlockedPlotCount,
            maxPlotCount: MAX_GARDEN_PLOTS,
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
        return this.runWithUserLock(userId, () => this.getStateInternal(userId));
    }

    private static async getStateInternal(
        userId: number,
        options?: { skipFarmerAutomation?: boolean }
    ): Promise<AzitFullGameState> {
        await this.ensureUserInitialized(userId);

        const preProfileRes = await pool.query('SELECT azit_xp, azit_level FROM azit_profiles WHERE user_id = $1', [userId]);
        const preRow = preProfileRes.rows[0] || {};
        const rawPreXp = Number(preRow.azit_xp ?? 0);
        const preLevelInfo = getAzitLevelInfo(Number.isFinite(rawPreXp) ? Math.max(0, Math.floor(rawPreXp)) : 0);
        if (Number(preRow.azit_level ?? 1) !== preLevelInfo.level) {
            await pool.query(
                `UPDATE azit_profiles
                 SET azit_level = $1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $2`,
                [preLevelInfo.level, userId]
            );
        }

        if (!options?.skipFarmerAutomation) {
            await this.processFarmerAutomationInternal(userId, Date.now());
        }

        const profileRes = await pool.query('SELECT * FROM azit_profiles WHERE user_id = $1', [userId]);
        const pRow = profileRes.rows[0] || {};
        const rawAzitXp = Number(pRow.azit_xp ?? 0);
        const azitXp = Number.isFinite(rawAzitXp) ? Math.max(0, Math.floor(rawAzitXp)) : 0;
        const levelInfo = getAzitLevelInfo(azitXp);
        if (Number(pRow.azit_level ?? 1) !== levelInfo.level) {
            await pool.query(
                `UPDATE azit_profiles
                 SET azit_level = $1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $2`,
                [levelInfo.level, userId]
            );
        }
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
        const specialDishes = createEmptyDishMap();
        const dishRes = await pool.query(
            `SELECT recipe_id, qty, special_qty FROM azit_dish_inventory WHERE user_id = $1 AND is_deleted = 0`,
            [userId]
        );
        for (const r of dishRes.rows) {
            const recId = String(r.recipe_id) as AzitRecipeId;
            if (VALID_RECIPE_IDS.has(recId)) {
                dishes[recId] = Number(r.qty ?? 0);
                specialDishes[recId] = Number(r.special_qty ?? 0);
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
            `SELECT merc_code, level, xp, status, main_skill_level, sub_skill_level, died_at, death_zone_id
             FROM azit_mercenaries
             WHERE user_id = $1 AND is_deleted = 0
             ORDER BY id ASC`,
            [userId]
        );
        const mercenaries: AzitMercenaryRecord[] = [];
        const mercSnapshotLookup = new Map<AzitMercCode, CombatUnitInput>();
        for (const r of mercRes.rows) {
            const code = String(r.merc_code) as AzitMercCode;
            const def = getMercDef(code);
            if (!def) continue;
            const level = Number(r.level ?? 1);
            const mainSkillLevel = Math.max(1, Math.min(MAX_SKILL_LEVEL, Number(r.main_skill_level ?? 1)));
            const subSkillLevel = Math.max(1, Math.min(MAX_SKILL_LEVEL, Number(r.sub_skill_level ?? 1)));
            const stats = getMercenaryCombatStats(code, level, mainSkillLevel, subSkillLevel);
            const rawMercStatus = String(r.status ?? 'idle');
            const status: 'idle' | 'expedition' | 'dead' =
                rawMercStatus === 'expedition'
                    ? 'expedition'
                    : rawMercStatus === 'dead'
                      ? 'dead'
                      : 'idle';
            mercSnapshotLookup.set(
                code,
                buildMercCombatUnit({
                    mercCode: code,
                    level,
                    mainSkillLevel,
                    subSkillLevel,
                    unitId: `ally-${code}`,
                })
            );
            mercenaries.push({
                mercCode: code,
                level,
                xp: Number(r.xp ?? 0),
                nextXp: getMercNextXp(level),
                power: getMercenaryEffectivePower(code, level),
                status,
                upgradeCost: null,
                role: def.role,
                combatRole: stats.combatRole,
                hp: status === 'dead' ? 0 : stats.hp,
                maxHp: stats.hp,
                atk: stats.atk,
                def: stats.def,
                spd: stats.moveSpeed,
                range: stats.range,
                diedAt: (r.died_at as string | null) ?? null,
                deathZoneId: r.death_zone_id ? (String(r.death_zone_id) as AzitZoneId) : null,
                mainSkill: {
                    id: def.mainSkill.id,
                    name: def.mainSkill.name,
                    emoji: def.mainSkill.emoji,
                    description: def.mainSkill.description,
                    level: mainSkillLevel,
                    maxLevel: MAX_SKILL_LEVEL,
                    cooldownMs: def.mainSkill.cooldownMs,
                    powerPct: stats.mainSkillPowerPct,
                },
                subSkill: {
                    id: def.subSkill.id,
                    name: def.subSkill.name,
                    emoji: def.subSkill.emoji,
                    description: def.subSkill.description,
                    level: subSkillLevel,
                    maxLevel: MAX_SKILL_LEVEL,
                    cooldownMs: def.subSkill.cooldownMs,
                    powerPct: stats.subSkillPowerPct,
                },
            });
        }

        const groupRes = await pool.query(
            `SELECT id, name, slot_index, merc_codes_json
             FROM azit_mercenary_groups
             WHERE user_id = $1 AND is_deleted = 0
             ORDER BY slot_index ASC, id ASC`,
            [userId]
        );
        const groups: AzitMercenaryGroupRecord[] = [];
        for (const r of groupRes.rows) {
            let mercCodes: AzitMercCode[] = [];
            try {
                const parsed = JSON.parse(String(r.merc_codes_json || '[]'));
                if (Array.isArray(parsed)) {
                    mercCodes = parsed.filter(
                        (c): c is AzitMercCode => typeof c === 'string' && Boolean(getMercDef(c))
                    );
                }
            } catch (_) {
                mercCodes = [];
            }
            groups.push({
                id: Number(r.id),
                name: String(r.name ?? ''),
                slotIndex: Number(r.slot_index ?? 0),
                mercCodes,
            });
        }

        const itemRes = await pool.query(
            `SELECT item_id, qty
             FROM azit_item_inventory
             WHERE user_id = $1 AND is_deleted = 0`,
            [userId]
        );
        const itemQtyMap = new Map<AzitItemId, number>();
        for (const r of itemRes.rows) {
            const itemId = String(r.item_id) as AzitItemId;
            if (VALID_ITEM_IDS.has(itemId)) {
                itemQtyMap.set(itemId, Math.max(0, Number(r.qty ?? 0)));
            }
        }
        const items: AzitItemInventoryRecord[] = AZIT_ITEMS.map((itemDef) => ({
            itemId: itemDef.itemId,
            qty: itemQtyMap.get(itemDef.itemId) ?? 0,
        }));

        const towerProgressRes = await pool.query(
            `SELECT highest_cleared_floor, total_clears, total_attempts
             FROM azit_tower_progress
             WHERE user_id = $1 AND is_deleted = 0`,
            [userId]
        );
        const towerRow = towerProgressRes.rows[0];
        const tower: AzitTowerProgressState = {
            highestClearedFloor: Math.max(
                0,
                Math.min(MAX_TOWER_FLOOR, Number(towerRow?.highest_cleared_floor ?? 0))
            ),
            maxFloor: MAX_TOWER_FLOOR,
            totalClears: Math.max(0, Number(towerRow?.total_clears ?? 0)),
            totalAttempts: Math.max(0, Number(towerRow?.total_attempts ?? 0)),
        };

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
            let rewardItems: Partial<Record<AzitItemId, number>> = {};
            let rewardCrops: Partial<Record<AzitCropId, number>> = {};
            let casualties: AzitMercCode[] = [];
            let battleLog: string[] = [];
            let partySnapshot: CombatUnitInput[] | undefined;
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
                if (row.reward_items_json) {
                    rewardItems = JSON.parse(String(row.reward_items_json)) as Partial<Record<AzitItemId, number>>;
                }
            } catch (_) {
                rewardItems = {};
            }
            try {
                if (row.reward_crops_json) {
                    rewardCrops = JSON.parse(String(row.reward_crops_json)) as Partial<Record<AzitCropId, number>>;
                }
            } catch (_) {
                rewardCrops = {};
            }
            try {
                if (row.dead_merc_codes_json) {
                    casualties = JSON.parse(String(row.dead_merc_codes_json)) as AzitMercCode[];
                }
            } catch (_) {
                casualties = [];
            }
            try {
                if (row.battle_log_json) {
                    battleLog = JSON.parse(String(row.battle_log_json)) as string[];
                }
            } catch (_) {
                battleLog = [];
            }
            try {
                if (row.party_snapshot_json) {
                    const parsedSnap = JSON.parse(String(row.party_snapshot_json));
                    if (Array.isArray(parsedSnap) && parsedSnap.length > 0) {
                        partySnapshot = parsedSnap as CombatUnitInput[];
                    }
                }
            } catch (_) {
                partySnapshot = undefined;
            }
            if (!partySnapshot && partyMercCodes.length > 0) {
                partySnapshot = partyMercCodes.map((code, idx) => {
                    const existing = mercSnapshotLookup.get(code);
                    if (existing) {
                        return { ...existing, unitId: `ally-${idx}-${code}` };
                    }
                    return buildMercCombatUnit({
                        mercCode: code,
                        level: 1,
                        unitId: `ally-${idx}-${code}`,
                    });
                });
            }

            const zoneId = String(row.zone_id) as AzitZoneId;
            const zone = getZoneDef(zoneId);
            const rawStatus = String(row.status);
            const normalizedStatus: 'running' | 'won' | 'lost' =
                rawStatus === 'won' ? 'won' : rawStatus === 'lost' ? 'lost' : 'running';
            const startedAtMs = Number(row.started_at_ms ?? 0);
            const endsAtMs = Number(row.ends_at_ms ?? 0);
            const rawDurationSec = Number(row.duration_sec ?? 0);
            const durationSec =
                rawDurationSec > 0
                    ? rawDurationSec
                    : zone?.durationSec ?? Math.max(3600, Math.round((endsAtMs - startedAtMs) / 1000));

            return {
                id: Number(row.id),
                zoneId,
                partyMercCodes,
                dishRecipeId: String(row.dish_recipe_id) as AzitRecipeId,
                dishQuality: row.dish_quality === 'special' ? 'special' : 'normal',
                entryCost: Number(row.entry_cost ?? 0),
                predictedWinRate: Number(row.predicted_win_rate ?? 25),
                status: normalizedStatus,
                startedAtMs,
                endsAtMs,
                claimedAt: (row.claimed_at as string | null) ?? null,
                rewardPoints: Number(row.reward_points ?? 0),
                rewardXp: Number(row.reward_xp ?? 0),
                rewardMaterials,
                battleLog,
                groupId: row.group_id !== null && row.group_id !== undefined ? Number(row.group_id) : null,
                groupName: row.group_name ? String(row.group_name) : null,
                durationSec,
                zoneTheme: zone?.zoneTheme,
                monsters: zone?.monsters,
                battleSeed:
                    row.battle_seed !== null && row.battle_seed !== undefined
                        ? Number(row.battle_seed)
                        : undefined,
                partySnapshot,
                casualties,
                rewardItems,
                rewardCrops,
                rewardMercXp: Number(row.reward_merc_xp ?? 0),
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

        const farmerRes = await pool.query(
            `SELECT farmer_code, level, xp, grade, auto_enabled, auto_fertilize, preferred_crop_id,
                    last_auto_tick_ms, total_watered, total_harvested, total_planted
             FROM azit_farmers
             WHERE user_id = $1 AND is_deleted = 0
             ORDER BY id ASC`,
            [userId]
        );
        const farmers: AzitFarmerRecord[] = [];
        for (const r of farmerRes.rows) {
            const code = String(r.farmer_code) as AzitFarmerCode;
            const def = getFarmerDef(code);
            if (!def) continue;
            const level = Math.max(1, Math.min(MAX_FARMER_LEVEL, Number(r.level ?? 1)));
            const stats = getFarmerLevelStats(level);
            const autoEnabled = Number(r.auto_enabled ?? 1) === 1;
            const lastAutoTickMs = Number(r.last_auto_tick_ms ?? 0);
            const prefRaw = r.preferred_crop_id ? String(r.preferred_crop_id) : null;
            const preferredCropId = prefRaw && VALID_CROP_IDS.has(prefRaw) ? (prefRaw as AzitCropId) : null;
            farmers.push({
                farmerCode: code,
                name: def.name,
                title: def.title,
                emoji: def.emoji,
                grade: stats.grade,
                gradeName: stats.gradeName,
                level,
                xp: Math.max(0, Number(r.xp ?? 0)),
                nextLevelXp: getFarmerNextLevelXp(level),
                autoEnabled,
                autoFertilize: Number(r.auto_fertilize ?? 0) === 1,
                preferredCropId,
                workIntervalMs: stats.workIntervalMs,
                waterCooldownReductionPct: stats.waterCooldownReductionPct,
                roles: stats.roles,
                lastAutoTickMs,
                nextAutoRunAtMs: autoEnabled && lastAutoTickMs > 0 ? lastAutoTickMs + stats.workIntervalMs : null,
                totalWatered: Math.max(0, Number(r.total_watered ?? 0)),
                totalHarvested: Math.max(0, Number(r.total_harvested ?? 0)),
                totalPlanted: Math.max(0, Number(r.total_planted ?? 0)),
                upgradeCost: level >= MAX_FARMER_LEVEL ? null : getFarmerUpgradeCost(level),
            });
        }

        const farmerLogRes = await pool.query(
            `SELECT id, farmer_code, action_type, plot_index, crop_id, detail, created_at
             FROM azit_farmer_logs
             WHERE user_id = $1
             ORDER BY id DESC
             LIMIT 30`,
            [userId]
        );
        const farmerLogs: AzitFarmerLogRecord[] = farmerLogRes.rows.map((r) => {
            const rawAction = String(r.action_type ?? 'water');
            const actionType: AzitFarmerRole =
                rawAction === 'harvest' || rawAction === 'plant' || rawAction === 'fertilize' ? rawAction : 'water';
            const rawCrop = r.crop_id ? String(r.crop_id) : null;
            return {
                id: Number(r.id),
                farmerCode: String(r.farmer_code) as AzitFarmerCode,
                actionType,
                plotIndex: Number(r.plot_index ?? 0),
                cropId: rawCrop && VALID_CROP_IDS.has(rawCrop) ? (rawCrop as AzitCropId) : null,
                detail: String(r.detail ?? ''),
                createdAt: String(r.created_at ?? ''),
            };
        });

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
                    maxGardenPlots: levelInfo.gardenPlots,
                    unlockedPlots: garden.unlockedPlotCount,
                    maxFarmers: levelInfo.maxFarmers,
                },
                totalCropsSold: Number(pRow.total_crops_sold ?? 0),
                totalDishesCooked: Number(pRow.total_dishes_cooked ?? 0),
                totalExpeditionsWon: Number(pRow.total_expeditions_won ?? 0),
                totalExpeditionsLost: Number(pRow.total_expeditions_lost ?? 0),
            },
            veraPoints,
            serverNowMs: Date.now(),
            garden,
            materials,
            dishes,
            specialDishes,
            chefs,
            kitchenSlots,
            mercenaries,
            groups,
            items,
            tower,
            activeExpeditions,
            recentExpeditions,
            recentLedger,
            farmers,
            farmerLogs,
            catalog: {
                crops: AZIT_CROPS,
                fertilizers: AZIT_FERTILIZERS,
                soilLevels: AZIT_SOIL_LEVELS,
                plotUnlocks: AZIT_PLOT_UNLOCKS,
                materials: AZIT_MATERIALS,
                recipes: AZIT_RECIPES,
                chefs: AZIT_CHEFS,
                farmers: AZIT_FARMERS,
                mercenaries: AZIT_MERCENARIES,
                zones: AZIT_EXPEDITION_ZONES,
                levels: AZIT_LEVEL_TABLE,
                items: AZIT_ITEMS,
                craftRecipes: AZIT_CRAFT_RECIPES,
                towerThemes: AZIT_TOWER_THEMES,
                towerFloorsSummary: getTowerFloorSummaries(1, MAX_TOWER_FLOOR),
            },
        };
    }

    // ==================== 1. 텃밭 서버 권위 API ====================

    static async buySeed(userId: number, cropId: string, rawQuantity = 1) {
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            await this.processFarmerAutomationInternal(userId, Date.now());
            const crop = getCropDef(cropId);
            if (!crop) {
                throw new AzitGameError('존재하지 않는 작물입니다.', 400);
            }

            const profileRes = await pool.query('SELECT azit_xp FROM azit_profiles WHERE user_id = $1', [userId]);
            const levelInfo = getAzitLevelInfo(Number(profileRes.rows[0]?.azit_xp ?? 0));
            if (levelInfo.level < crop.requiredAzitLevel) {
                throw new AzitGameError(
                    `[${crop.emoji} ${crop.name}] 씨앗은 아지트 Lv.${crop.requiredAzitLevel}부터 구매할 수 있습니다.`,
                    400
                );
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
            const state = await this.getStateInternal(userId, { skipFarmerAutomation: true });
            return {
                message:
                    totalCost > 0
                        ? `🌱 [${crop.emoji} ${crop.name}] 씨앗 ${qty}봉지를 ${totalCost.toLocaleString()}P에 구매했습니다!`
                        : `🌱 [${crop.emoji} ${crop.name}] 무료 씨앗 ${qty}봉지를 농장 창고에 넣었습니다!`,
                state,
            };
        });
    }

    static async plantCrop(userId: number, plotIndex: number, cropId: string) {
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            await this.processFarmerAutomationInternal(userId, Date.now());
            assertValidPlotIndex(plotIndex);
            const crop = getCropDef(cropId);
            if (!crop) {
                throw new AzitGameError('존재하지 않는 작물입니다.', 400);
            }

            const profileRes = await pool.query('SELECT azit_xp FROM azit_profiles WHERE user_id = $1', [userId]);
            const levelInfo = getAzitLevelInfo(Number(profileRes.rows[0]?.azit_xp ?? 0));
            if (levelInfo.level < crop.requiredAzitLevel) {
                throw new AzitGameError(
                    `[${crop.emoji} ${crop.name}] 작물은 아지트 Lv.${crop.requiredAzitLevel}부터 심을 수 있습니다.`,
                    400
                );
            }

            const plotRes = await pool.query(
                `SELECT is_unlocked, crop_id, stage FROM azit_garden_plots
                 WHERE user_id = $1 AND plot_index = $2 AND is_deleted = 0`,
                [userId, plotIndex]
            );
            const currentPlot = plotRes.rows[0];
            if (!currentPlot || Number(currentPlot.is_unlocked ?? (plotIndex < STARTER_GARDEN_PLOTS ? 1 : 0)) !== 1) {
                throw new AzitGameError('해금되지 않은 텃밭입니다. 먼저 텃밭을 확장해 주세요.', 400);
            }
            if (currentPlot.crop_id && Number(currentPlot.stage) > 0) {
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

            const nowMs = Date.now();
            const nowIso = new Date(nowMs).toISOString();
            const nextWaterAtMs = nowMs + GARDEN_WATER_COOLDOWN_MS;
            const plantRes = await pool.query(
                `UPDATE azit_garden_plots
                 SET crop_id = $1,
                     stage = 1,
                     water_count = 1,
                     planted_at = $2,
                     last_watered_at = $3,
                     next_water_at_ms = $4,
                     fertilizer_used_count = 0,
                     water_notified_at = NULL,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $5 AND plot_index = $6 AND is_unlocked = 1 AND is_deleted = 0 AND (crop_id IS NULL OR stage = 0)`,
                [crop.cropId, nowIso, nowIso, nextWaterAtMs, userId, plotIndex]
            );
            if (plantRes.rowCount === 0) {
                await pool.query(
                    `UPDATE azit_crop_inventory SET seed_qty = seed_qty + 1 WHERE user_id = $1 AND crop_id = $2`,
                    [userId, crop.cropId]
                );
                throw new AzitGameError('해당 밭에 이미 작물이 심어져 있습니다.', 409);
            }

            await this.syncGardenSnapshotToMinihome(userId);
            await this.scheduleAzitNotification({
                userId,
                category: 'azit.garden',
                dedupeKey: `azit:garden:plot:${plotIndex}`,
                title: '💧 [아지트 농장] 작물에 물을 줄 시간이에요!',
                body: `${plotIndex + 1}번 텃밭의 [${crop.emoji} ${crop.name}]에 2차 물을 줄 시간(8시간 경과)이에요!`,
                url: '/mypage?section=dashboard&zone=garden',
                tag: 'azit-garden',
                scheduledAtMs: nextWaterAtMs,
                data: { zone: 'garden', plotIndex, cropId: crop.cropId },
            });
            const state = await this.getStateInternal(userId, { skipFarmerAutomation: true });
            return {
                message: `🌱 [${crop.emoji} ${crop.name}] 씨앗을 심고 첫 물을 주었습니다! (8시간 후 2차 물주기 가능)`,
                state,
            };
        });
    }

    static async waterPlot(userId: number, plotIndex: number) {
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            await this.processFarmerAutomationInternal(userId, Date.now());
            assertValidPlotIndex(plotIndex);

            const plotRes = await pool.query(
                `SELECT is_unlocked, crop_id, stage, water_count, last_watered_at, next_water_at_ms
                 FROM azit_garden_plots
                 WHERE user_id = $1 AND plot_index = $2 AND is_deleted = 0`,
                [userId, plotIndex]
            );
            const plot = plotRes.rows[0];
            if (!plot || Number(plot.is_unlocked ?? (plotIndex < STARTER_GARDEN_PLOTS ? 1 : 0)) !== 1) {
                throw new AzitGameError('해금되지 않은 텃밭입니다.', 400);
            }
            if (!plot.crop_id || Number(plot.stage) <= 0) {
                throw new AzitGameError('작물이 심어져 있지 않은 빈 밭입니다.', 400);
            }
            const currentStage = Number(plot.stage);
            if (currentStage >= 3) {
                throw new AzitGameError('이미 다 자라서 수확할 수 있는 작물입니다!', 400);
            }

            const nowMs = Date.now();
            const effectiveNextWaterAtMs = resolvePlotNextWaterAtMs(plot);
            if (effectiveNextWaterAtMs !== null && effectiveNextWaterAtMs > nowMs) {
                const remainSec = Math.ceil((effectiveNextWaterAtMs - nowMs) / 1000);
                const hrs = Math.floor(remainSec / 3600);
                const mins = Math.floor((remainSec % 3600) / 60);
                throw new AzitGameError(
                    `아직 땅이 촉촉해요! 다음 물주기까지 ${hrs}시간 ${mins}분 남았습니다.`,
                    400
                );
            }

            const nextStage = Math.min(3, currentStage + 1);
            const nowIso = new Date(nowMs).toISOString();
            const nextWaterAtMs = nextStage < 3 ? nowMs + GARDEN_WATER_COOLDOWN_MS : null;
            const updRes = await pool.query(
                `UPDATE azit_garden_plots
                 SET stage = $1,
                     water_count = water_count + 1,
                     last_watered_at = $2,
                     next_water_at_ms = $3,
                     water_notified_at = NULL,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $4 AND plot_index = $5 AND stage = $6 AND is_unlocked = 1 AND is_deleted = 0`,
                [nextStage, nowIso, nextWaterAtMs, userId, plotIndex, currentStage]
            );
            if (updRes.rowCount === 0) {
                throw new AzitGameError('물주기 상태가 변경되었습니다. 다시 시도해 주세요.', 409);
            }

            const crop = getCropDef(String(plot.crop_id));
            await this.syncGardenSnapshotToMinihome(userId);
            if (nextStage < 3 && nextWaterAtMs !== null) {
                await this.scheduleAzitNotification({
                    userId,
                    category: 'azit.garden',
                    dedupeKey: `azit:garden:plot:${plotIndex}`,
                    title: '💧 [아지트 농장] 작물에 물을 줄 시간이에요!',
                    body: `${plotIndex + 1}번 텃밭의 [${crop?.emoji || '🌱'} ${crop?.name || '작물'}]에 마지막 물을 줄 시간이에요! 물을 주면 바로 수확할 수 있어요.`,
                    url: '/mypage?section=dashboard&zone=garden',
                    tag: 'azit-garden',
                    scheduledAtMs: nextWaterAtMs,
                    data: { zone: 'garden', plotIndex, cropId: String(plot.crop_id), stage: nextStage },
                });
            } else {
                await this.cancelAzitNotification(userId, `azit:garden:plot:${plotIndex}`);
            }
            const state = await this.getStateInternal(userId, { skipFarmerAutomation: true });
            return {
                message:
                    nextStage >= 3
                        ? `🎉 3차 물주기 완료! [${crop?.emoji || '🌾'} ${crop?.name || '작물'}]이(가) 수확 가능 상태가 되었습니다!`
                        : `💧 [${crop?.emoji || '🌱'} ${crop?.shortName || '작물'}]에 물을 주었습니다! (${nextStage}/3단계)`,
                state,
            };
        });
    }

    static async harvestPlot(userId: number, plotIndex: number) {
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            await this.processFarmerAutomationInternal(userId, Date.now());
            assertValidPlotIndex(plotIndex);

            const plotRes = await pool.query(
                `SELECT is_unlocked, crop_id, stage, soil_level FROM azit_garden_plots
                 WHERE user_id = $1 AND plot_index = $2 AND is_deleted = 0`,
                [userId, plotIndex]
            );
            const plot = plotRes.rows[0];
            if (!plot || Number(plot.is_unlocked ?? (plotIndex < STARTER_GARDEN_PLOTS ? 1 : 0)) !== 1) {
                throw new AzitGameError('해금되지 않은 텃밭입니다.', 400);
            }
            if (!plot.crop_id || Number(plot.stage) < 3) {
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
                     next_water_at_ms = NULL,
                     fertilizer_used_count = 0,
                     water_notified_at = NULL,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $1 AND plot_index = $2 AND crop_id = $3 AND stage >= 3 AND is_unlocked = 1 AND is_deleted = 0`,
                [userId, plotIndex, crop.cropId]
            );
            if (clearRes.rowCount === 0) {
                throw new AzitGameError('이미 수확된 밭입니다.', 409);
            }

            const yieldResult = calculateSoilHarvestYield(crop, Number(plot.soil_level ?? 0));
            await pool.query(
                `UPDATE azit_crop_inventory
                 SET harvest_qty = harvest_qty + $1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $2 AND crop_id = $3`,
                [yieldResult.totalYield, userId, crop.cropId]
            );
            await this.addAzitXp(userId, GARDEN_HARVEST_AZIT_XP);
            await this.syncGardenSnapshotToMinihome(userId);
            await this.cancelAzitNotification(userId, `azit:garden:plot:${plotIndex}`);
            const state = await this.getStateInternal(userId, { skipFarmerAutomation: true });
            const bonusText = yieldResult.totalBonus > 0 ? ` (토양 보너스 +${yieldResult.totalBonus})` : '';
            return {
                message: `🧺 [${crop.emoji} ${crop.name}] ${yieldResult.totalYield}개를 수확했습니다!${bonusText} (+${GARDEN_HARVEST_AZIT_XP} 아지트 EXP)`,
                harvestedYield: yieldResult.totalYield,
                bonusYield: yieldResult.totalBonus,
                state,
            };
        });
    }

    static async clearPlot(userId: number, plotIndex: number) {
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            await this.processFarmerAutomationInternal(userId, Date.now());
            assertValidPlotIndex(plotIndex);

            const plotRes = await pool.query(
                `SELECT is_unlocked FROM azit_garden_plots
                 WHERE user_id = $1 AND plot_index = $2 AND is_deleted = 0`,
                [userId, plotIndex]
            );
            const plot = plotRes.rows[0];
            if (!plot || Number(plot.is_unlocked ?? (plotIndex < STARTER_GARDEN_PLOTS ? 1 : 0)) !== 1) {
                throw new AzitGameError('해금되지 않은 텃밭입니다.', 400);
            }

            await pool.query(
                `UPDATE azit_garden_plots
                 SET crop_id = NULL,
                     stage = 0,
                     water_count = 0,
                     planted_at = NULL,
                     last_watered_at = NULL,
                     next_water_at_ms = NULL,
                     fertilizer_used_count = 0,
                     water_notified_at = NULL,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $1 AND plot_index = $2 AND is_unlocked = 1 AND is_deleted = 0`,
                [userId, plotIndex]
            );
            await this.syncGardenSnapshotToMinihome(userId);
            await this.cancelAzitNotification(userId, `azit:garden:plot:${plotIndex}`);
            const state = await this.getStateInternal(userId, { skipFarmerAutomation: true });
            return {
                message: `🌿 ${plotIndex + 1}번 텃밭 이랑을 깨끗하게 비웠습니다.`,
                state,
            };
        });
    }

    static async sellCrop(userId: number, cropId: string, rawQuantity = 1) {
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            await this.processFarmerAutomationInternal(userId, Date.now());
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
            const state = await this.getStateInternal(userId, { skipFarmerAutomation: true });
            return {
                message: `💰 [${crop.emoji} ${crop.name}] ×${qty} 판매 완료! (+${revenue.toLocaleString()}P)`,
                state,
            };
        });
    }

    static async unlockPlot(userId: number, plotIndex: number) {
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            await this.processFarmerAutomationInternal(userId, Date.now());
            assertValidPlotIndex(plotIndex);
            if (plotIndex < STARTER_GARDEN_PLOTS) {
                throw new AzitGameError('기본 텃밭은 이미 해금되어 있습니다.', 400);
            }

            const unlockDef = getPlotUnlockDef(plotIndex);
            if (!unlockDef) {
                throw new AzitGameError('해금할 수 없는 텃밭 번호입니다.', 400);
            }

            const profileRes = await pool.query('SELECT azit_xp FROM azit_profiles WHERE user_id = $1', [userId]);
            const levelInfo = getAzitLevelInfo(Number(profileRes.rows[0]?.azit_xp ?? 0));
            if (levelInfo.level < unlockDef.unlockLevel) {
                throw new AzitGameError(
                    `${plotIndex + 1}번 텃밭은 아지트 Lv.${unlockDef.unlockLevel}부터 해금할 수 있습니다.`,
                    400
                );
            }

            const plotRes = await pool.query(
                `SELECT is_unlocked FROM azit_garden_plots
                 WHERE user_id = $1 AND plot_index = $2 AND is_deleted = 0`,
                [userId, plotIndex]
            );
            if (Number(plotRes.rows[0]?.is_unlocked ?? 0) === 1) {
                throw new AzitGameError('이미 해금된 텃밭입니다.', 409);
            }

            await this.deductVeraPoints({
                userId,
                amount: unlockDef.unlockCost,
                txType: 'plot_unlock',
                refId: String(plotIndex),
                description: `텃밭 ${plotIndex + 1}번 구획 확장 해금`,
            });

            const updRes = await pool.query(
                `UPDATE azit_garden_plots
                 SET is_unlocked = 1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $1 AND plot_index = $2 AND is_unlocked = 0 AND is_deleted = 0`,
                [userId, plotIndex]
            );
            if (updRes.rowCount === 0) {
                await this.creditVeraPoints({
                    userId,
                    amount: unlockDef.unlockCost,
                    txType: 'refund',
                    refId: String(plotIndex),
                    description: `텃밭 ${plotIndex + 1}번 해금 중복 취소 환불`,
                    countAsActivity: false,
                });
                throw new AzitGameError('이미 해금된 텃밭입니다.', 409);
            }

            const countRes = await pool.query(
                `SELECT COUNT(*) AS cnt FROM azit_garden_plots
                 WHERE user_id = $1 AND is_unlocked = 1 AND is_deleted = 0`,
                [userId]
            );
            const unlockedCount = Number(countRes.rows[0]?.cnt ?? STARTER_GARDEN_PLOTS);
            await pool.query(
                `UPDATE azit_profiles
                 SET unlocked_plots = $1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $2`,
                [unlockedCount, userId]
            );

            await this.syncGardenSnapshotToMinihome(userId);
            const state = await this.getStateInternal(userId, { skipFarmerAutomation: true });
            return {
                message: `🌱 ${plotIndex + 1}번 텃밭 구획이 해금되었습니다! (현재 ${unlockedCount}칸 사용 가능)`,
                plotIndex,
                state,
            };
        });
    }

    static async buyFertilizer(
        userId: number,
        fertilizerId: string = DEFAULT_FERTILIZER_ID,
        rawQuantity = 1
    ) {
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            await this.processFarmerAutomationInternal(userId, Date.now());
            const fertDef = getFertilizerDef(fertilizerId);
            if (!fertDef) {
                throw new AzitGameError('존재하지 않는 비료입니다.', 400);
            }

            const profileRes = await pool.query('SELECT azit_xp FROM azit_profiles WHERE user_id = $1', [userId]);
            const levelInfo = getAzitLevelInfo(Number(profileRes.rows[0]?.azit_xp ?? 0));
            if (levelInfo.level < fertDef.requiredAzitLevel) {
                throw new AzitGameError(
                    `[${fertDef.name}]은(는) 아지트 Lv.${fertDef.requiredAzitLevel}부터 구매할 수 있습니다.`,
                    400
                );
            }

            const qty = Math.max(1, Math.min(50, Math.floor(rawQuantity)));
            const totalCost = fertDef.price * qty;

            if (totalCost > 0) {
                await this.deductVeraPoints({
                    userId,
                    amount: totalCost,
                    txType: 'fertilizer_buy',
                    refId: fertDef.fertilizerId,
                    description: `${fertDef.emoji} ${fertDef.name} ${qty}개 구매`,
                });
            }

            await pool.query(
                `INSERT INTO azit_fertilizer_inventory (user_id, fertilizer_id, qty, is_deleted, deleted_at, updated_at)
                 VALUES ($1, $2, $3, 0, NULL, CURRENT_TIMESTAMP)
                 ON CONFLICT (user_id, fertilizer_id) DO UPDATE SET
                    qty = azit_fertilizer_inventory.qty + $4,
                    is_deleted = 0,
                    deleted_at = NULL,
                    updated_at = CURRENT_TIMESTAMP`,
                [userId, fertDef.fertilizerId, qty, qty]
            );

            const totalRes = await pool.query(
                `SELECT COALESCE(SUM(qty), 0) AS total
                 FROM azit_fertilizer_inventory
                 WHERE user_id = $1 AND is_deleted = 0`,
                [userId]
            );
            await pool.query(
                `UPDATE azit_profiles
                 SET fertilizer_qty = $1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $2`,
                [Number(totalRes.rows[0]?.total ?? 0), userId]
            );

            await this.syncGardenSnapshotToMinihome(userId);
            const state = await this.getStateInternal(userId, { skipFarmerAutomation: true });
            return {
                message: `${fertDef.emoji} [${fertDef.name}] ${qty}개를 ${totalCost.toLocaleString()}P에 구매했습니다!`,
                fertilizerId: fertDef.fertilizerId,
                quantity: qty,
                state,
            };
        });
    }

    static async fertilizePlot(
        userId: number,
        plotIndex: number,
        fertilizerId: string = DEFAULT_FERTILIZER_ID
    ) {
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            await this.processFarmerAutomationInternal(userId, Date.now());
            assertValidPlotIndex(plotIndex);
            const fertDef = getFertilizerDef(fertilizerId);
            if (!fertDef) {
                throw new AzitGameError('존재하지 않는 비료입니다.', 400);
            }

            const profileRes = await pool.query('SELECT azit_xp FROM azit_profiles WHERE user_id = $1', [userId]);
            const levelInfo = getAzitLevelInfo(Number(profileRes.rows[0]?.azit_xp ?? 0));
            if (levelInfo.level < fertDef.requiredAzitLevel) {
                throw new AzitGameError(
                    `[${fertDef.name}]은(는) 아지트 Lv.${fertDef.requiredAzitLevel}부터 사용할 수 있습니다.`,
                    400
                );
            }

            const plotRes = await pool.query(
                `SELECT is_unlocked, crop_id, stage, last_watered_at, next_water_at_ms, fertilizer_used_count
                 FROM azit_garden_plots
                 WHERE user_id = $1 AND plot_index = $2 AND is_deleted = 0`,
                [userId, plotIndex]
            );
            const plot = plotRes.rows[0];
            if (!plot || Number(plot.is_unlocked ?? (plotIndex < STARTER_GARDEN_PLOTS ? 1 : 0)) !== 1) {
                throw new AzitGameError('해금되지 않은 텃밭입니다.', 400);
            }
            if (!plot.crop_id || Number(plot.stage) <= 0) {
                throw new AzitGameError('빈 밭에는 비료를 사용할 수 없습니다.', 400);
            }
            if (Number(plot.stage) >= 3) {
                throw new AzitGameError('이미 수확 가능한 완숙 작물입니다.', 400);
            }
            const usedCount = Number(plot.fertilizer_used_count ?? 0);
            if (usedCount >= MAX_FERTILIZER_PER_CROP) {
                throw new AzitGameError(`이 작물에는 비료를 최대 ${MAX_FERTILIZER_PER_CROP}회까지만 사용할 수 있습니다.`, 400);
            }

            const nowMs = Date.now();
            const currentNextWaterAtMs = resolvePlotNextWaterAtMs(plot);
            if (currentNextWaterAtMs === null || currentNextWaterAtMs <= nowMs) {
                throw new AzitGameError('이미 물을 줄 수 있는 상태여서 비료를 사용할 필요가 없습니다.', 400);
            }

            const fertDeductRes = await pool.query(
                `UPDATE azit_fertilizer_inventory
                 SET qty = qty - 1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $1 AND fertilizer_id = $2 AND qty >= 1 AND is_deleted = 0`,
                [userId, fertDef.fertilizerId]
            );
            if (fertDeductRes.rowCount === 0) {
                throw new AzitGameError(`보유 중인 [${fertDef.emoji} ${fertDef.name}]이(가) 부족합니다.`, 400);
            }

            const newNextWaterAtMs = Math.max(nowMs, currentNextWaterAtMs - fertDef.reductionMs);
            const updPlotRes = await pool.query(
                `UPDATE azit_garden_plots
                 SET next_water_at_ms = $1,
                     fertilizer_used_count = fertilizer_used_count + 1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $2 AND plot_index = $3 AND stage IN (1, 2) AND is_unlocked = 1 AND fertilizer_used_count < $4 AND is_deleted = 0`,
                [newNextWaterAtMs, userId, plotIndex, MAX_FERTILIZER_PER_CROP]
            );
            if (updPlotRes.rowCount === 0) {
                await pool.query(
                    `UPDATE azit_fertilizer_inventory
                     SET qty = qty + 1,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE user_id = $1 AND fertilizer_id = $2`,
                    [userId, fertDef.fertilizerId]
                );
                throw new AzitGameError('텃밭 상태가 변경되어 비료를 적용할 수 없습니다. 다시 시도해 주세요.', 409);
            }

            const totalRes = await pool.query(
                `SELECT COALESCE(SUM(qty), 0) AS total
                 FROM azit_fertilizer_inventory
                 WHERE user_id = $1 AND is_deleted = 0`,
                [userId]
            );
            await pool.query(
                `UPDATE azit_profiles
                 SET fertilizer_qty = $1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $2`,
                [Number(totalRes.rows[0]?.total ?? 0), userId]
            );

            const canWaterNow = newNextWaterAtMs <= nowMs;
            const crop = getCropDef(String(plot.crop_id));
            if (canWaterNow) {
                await this.cancelAzitNotification(userId, `azit:garden:plot:${plotIndex}`);
            } else {
                await this.scheduleAzitNotification({
                    userId,
                    category: 'azit.garden',
                    dedupeKey: `azit:garden:plot:${plotIndex}`,
                    title: '💧 [아지트 농장] 작물에 물을 줄 시간이에요!',
                    body: `${plotIndex + 1}번 텃밭의 [${crop?.emoji || '🌱'} ${crop?.name || '작물'}] 비료 효과로 물줄 시간이 다가왔어요!`,
                    url: '/mypage?section=dashboard&zone=garden',
                    tag: 'azit-garden',
                    scheduledAtMs: newNextWaterAtMs,
                    data: { zone: 'garden', plotIndex, cropId: String(plot.crop_id) },
                });
            }

            await this.syncGardenSnapshotToMinihome(userId);
            const state = await this.getStateInternal(userId, { skipFarmerAutomation: true });
            return {
                message: canWaterNow
                    ? `${fertDef.emoji} [${fertDef.name}] 적용 완료! 지금 바로 물을 줄 수 있습니다.`
                    : `${fertDef.emoji} [${fertDef.name}] 적용 완료! 다음 물주기 대기 시간이 ${fertDef.reductionHours}시간 단축되었습니다.`,
                plotIndex,
                fertilizerId: fertDef.fertilizerId,
                nextWaterAtMs: newNextWaterAtMs,
                canWaterNow,
                fertilizerUsedCount: usedCount + 1,
                state,
            };
        });
    }

    static async upgradeSoil(userId: number, plotIndex: number) {
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            await this.processFarmerAutomationInternal(userId, Date.now());
            assertValidPlotIndex(plotIndex);

            const plotRes = await pool.query(
                `SELECT is_unlocked, soil_level FROM azit_garden_plots
                 WHERE user_id = $1 AND plot_index = $2 AND is_deleted = 0`,
                [userId, plotIndex]
            );
            const plot = plotRes.rows[0];
            if (!plot || Number(plot.is_unlocked ?? (plotIndex < STARTER_GARDEN_PLOTS ? 1 : 0)) !== 1) {
                throw new AzitGameError('해금되지 않은 텃밭은 토양을 강화할 수 없습니다.', 400);
            }

            const currentSoilLv = Math.max(0, Number(plot.soil_level ?? 0));
            const nextSoilDef = getNextSoilLevelDef(currentSoilLv);
            if (!nextSoilDef) {
                throw new AzitGameError(`이미 최고 단계(Lv.${MAX_SOIL_LEVEL}) 토양입니다.`, 400);
            }

            const profileRes = await pool.query('SELECT azit_xp FROM azit_profiles WHERE user_id = $1', [userId]);
            const levelInfo = getAzitLevelInfo(Number(profileRes.rows[0]?.azit_xp ?? 0));
            if (levelInfo.level < nextSoilDef.requiredAzitLevel) {
                throw new AzitGameError(
                    `토양 Lv.${nextSoilDef.level} (${nextSoilDef.name}) 강화는 아지트 Lv.${nextSoilDef.requiredAzitLevel}부터 가능합니다.`,
                    400
                );
            }

            await this.deductVeraPoints({
                userId,
                amount: nextSoilDef.upgradeCost,
                txType: 'soil_upgrade',
                refId: `${plotIndex}:lv${nextSoilDef.level}`,
                description: `${plotIndex + 1}번 텃밭 토양 강화 (${nextSoilDef.name})`,
            });

            const updRes = await pool.query(
                `UPDATE azit_garden_plots
                 SET soil_level = $1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $2 AND plot_index = $3 AND soil_level = $4 AND is_unlocked = 1 AND is_deleted = 0`,
                [nextSoilDef.level, userId, plotIndex, currentSoilLv]
            );
            if (updRes.rowCount === 0) {
                await this.creditVeraPoints({
                    userId,
                    amount: nextSoilDef.upgradeCost,
                    txType: 'refund',
                    refId: `${plotIndex}:lv${nextSoilDef.level}`,
                    description: `토양 강화 실패 환불 (${plotIndex + 1}번 텃밭)`,
                    countAsActivity: false,
                });
                throw new AzitGameError('토양 단계가 이미 변경되었습니다. 다시 시도해 주세요.', 409);
            }

            await this.syncGardenSnapshotToMinihome(userId);
            const state = await this.getStateInternal(userId, { skipFarmerAutomation: true });
            return {
                message: `🪨 ${plotIndex + 1}번 텃밭 토양이 Lv.${nextSoilDef.level} [${nextSoilDef.name}](으)로 강화되었습니다!`,
                plotIndex,
                soilLevel: nextSoilDef.level,
                state,
            };
        });
    }

    static async waterAll(userId: number) {
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            await this.processFarmerAutomationInternal(userId, Date.now());

            const growingRes = await pool.query(
                `SELECT plot_index, crop_id, stage, last_watered_at, next_water_at_ms
                 FROM azit_garden_plots
                 WHERE user_id = $1 AND is_unlocked = 1 AND is_deleted = 0 AND crop_id IS NOT NULL AND stage IN (1, 2)
                 ORDER BY plot_index ASC`,
                [userId]
            );

            const nowMs = Date.now();
            const nowIso = new Date(nowMs).toISOString();
            const waterable = growingRes.rows.filter((row) => {
                const nextMs = resolvePlotNextWaterAtMs(row);
                return nextMs === null || nextMs <= nowMs;
            });

            if (waterable.length === 0) {
                throw new AzitGameError(
                    growingRes.rows.length === 0
                        ? '물을 줄 수 있는 자라는 작물이 없습니다.'
                        : '아직 물주기 대기 시간이 남은 작물만 있습니다.',
                    400
                );
            }

            const wateredPlotIndices: number[] = [];
            let maturedCount = 0;

            for (const row of waterable) {
                const plotIndex = Number(row.plot_index);
                const currentStage = Number(row.stage);
                const nextStage = Math.min(3, currentStage + 1);
                const nextWaterAtMs = nextStage < 3 ? nowMs + GARDEN_WATER_COOLDOWN_MS : null;

                const updRes = await pool.query(
                    `UPDATE azit_garden_plots
                     SET stage = $1,
                         water_count = water_count + 1,
                         last_watered_at = $2,
                         next_water_at_ms = $3,
                         water_notified_at = NULL,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE user_id = $4 AND plot_index = $5 AND stage = $6 AND is_unlocked = 1 AND is_deleted = 0`,
                    [nextStage, nowIso, nextWaterAtMs, userId, plotIndex, currentStage]
                );
                if (updRes.rowCount === 1) {
                    wateredPlotIndices.push(plotIndex);
                    const crop = getCropDef(String(row.crop_id));
                    if (nextStage < 3 && nextWaterAtMs !== null) {
                        await this.scheduleAzitNotification({
                            userId,
                            category: 'azit.garden',
                            dedupeKey: `azit:garden:plot:${plotIndex}`,
                            title: '💧 [아지트 농장] 작물에 물을 줄 시간이에요!',
                            body: `${plotIndex + 1}번 텃밭의 [${crop?.emoji || '🌱'} ${crop?.name || '작물'}]에 마지막 물을 줄 시간이에요!`,
                            url: '/mypage?section=dashboard&zone=garden',
                            tag: 'azit-garden',
                            scheduledAtMs: nextWaterAtMs,
                            data: { zone: 'garden', plotIndex, cropId: String(row.crop_id), stage: nextStage },
                        });
                    } else {
                        maturedCount += 1;
                        await this.cancelAzitNotification(userId, `azit:garden:plot:${plotIndex}`);
                    }
                }
            }

            await this.syncGardenSnapshotToMinihome(userId);
            const state = await this.getStateInternal(userId, { skipFarmerAutomation: true });
            return {
                message: `💧 ${wateredPlotIndices.length}개 텃밭에 일괄 물주기를 완료했습니다!${maturedCount > 0 ? ` (${maturedCount}개 수확 가능)` : ''}`,
                wateredCount: wateredPlotIndices.length,
                wateredPlotIndices,
                maturedCount,
                state,
            };
        });
    }

    static async harvestAll(userId: number) {
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            await this.processFarmerAutomationInternal(userId, Date.now());

            const matureRes = await pool.query(
                `SELECT plot_index, crop_id, stage, soil_level
                 FROM azit_garden_plots
                 WHERE user_id = $1 AND is_unlocked = 1 AND is_deleted = 0 AND crop_id IS NOT NULL AND stage >= 3
                 ORDER BY plot_index ASC`,
                [userId]
            );
            if (matureRes.rows.length === 0) {
                throw new AzitGameError('수확할 수 있는 완숙 작물이 없습니다.', 400);
            }

            let harvestedPlots = 0;
            let totalYield = 0;
            let totalBonusYield = 0;
            const harvestedByCrop: Partial<Record<AzitCropId, number>> = {};

            for (const row of matureRes.rows) {
                const plotIndex = Number(row.plot_index);
                const crop = getCropDef(String(row.crop_id));
                if (!crop) continue;

                const clearRes = await pool.query(
                    `UPDATE azit_garden_plots
                     SET crop_id = NULL,
                         stage = 0,
                         water_count = 0,
                         planted_at = NULL,
                         last_watered_at = NULL,
                         next_water_at_ms = NULL,
                         fertilizer_used_count = 0,
                         water_notified_at = NULL,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE user_id = $1 AND plot_index = $2 AND crop_id = $3 AND stage >= 3 AND is_unlocked = 1 AND is_deleted = 0`,
                    [userId, plotIndex, crop.cropId]
                );
                if (clearRes.rowCount === 0) continue;

                const yieldResult = calculateSoilHarvestYield(crop, Number(row.soil_level ?? 0));
                harvestedPlots += 1;
                totalYield += yieldResult.totalYield;
                totalBonusYield += yieldResult.totalBonus;
                harvestedByCrop[crop.cropId] = (harvestedByCrop[crop.cropId] ?? 0) + yieldResult.totalYield;
                await this.cancelAzitNotification(userId, `azit:garden:plot:${plotIndex}`);
            }

            if (harvestedPlots === 0) {
                throw new AzitGameError('수확할 수 있는 완숙 작물이 없습니다.', 400);
            }

            for (const [cId, qty] of Object.entries(harvestedByCrop)) {
                if (!qty || qty <= 0) continue;
                await pool.query(
                    `UPDATE azit_crop_inventory
                     SET harvest_qty = harvest_qty + $1,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE user_id = $2 AND crop_id = $3`,
                    [qty, userId, cId]
                );
            }

            const xpGained = GARDEN_HARVEST_AZIT_XP * harvestedPlots;
            await this.addAzitXp(userId, xpGained);
            await this.syncGardenSnapshotToMinihome(userId);
            const state = await this.getStateInternal(userId, { skipFarmerAutomation: true });
            const bonusText = totalBonusYield > 0 ? ` (토양 보너스 +${totalBonusYield})` : '';
            return {
                message: `🧺 ${harvestedPlots}개 텃밭에서 총 ${totalYield}개 작물을 일괄 수확했습니다!${bonusText} (+${xpGained} 아지트 EXP)`,
                harvestedPlots,
                totalYield,
                totalBonusYield,
                harvestedByCrop,
                xpGained,
                state,
            };
        });
    }

    static async plantAll(userId: number, cropId: string) {
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            await this.processFarmerAutomationInternal(userId, Date.now());
            const crop = getCropDef(cropId);
            if (!crop) {
                throw new AzitGameError('존재하지 않는 작물입니다.', 400);
            }

            const profileRes = await pool.query('SELECT azit_xp FROM azit_profiles WHERE user_id = $1', [userId]);
            const levelInfo = getAzitLevelInfo(Number(profileRes.rows[0]?.azit_xp ?? 0));
            if (levelInfo.level < crop.requiredAzitLevel) {
                throw new AzitGameError(
                    `[${crop.emoji} ${crop.name}] 작물은 아지트 Lv.${crop.requiredAzitLevel}부터 심을 수 있습니다.`,
                    400
                );
            }

            const emptyRes = await pool.query(
                `SELECT plot_index
                 FROM azit_garden_plots
                 WHERE user_id = $1 AND is_unlocked = 1 AND is_deleted = 0 AND (crop_id IS NULL OR stage = 0)
                 ORDER BY plot_index ASC`,
                [userId]
            );
            if (emptyRes.rows.length === 0) {
                throw new AzitGameError('비어 있는 해금된 텃밭이 없습니다.', 400);
            }

            const invRes = await pool.query(
                `SELECT seed_qty FROM azit_crop_inventory
                 WHERE user_id = $1 AND crop_id = $2 AND is_deleted = 0`,
                [userId, crop.cropId]
            );
            const seedQty = Number(invRes.rows[0]?.seed_qty ?? 0);
            const targetCount = Math.min(emptyRes.rows.length, seedQty);
            if (targetCount <= 0) {
                throw new AzitGameError(
                    `창고에 [${crop.emoji} ${crop.shortName}] 씨앗이 부족합니다. 상점에서 씨앗을 구매해 주세요!`,
                    400
                );
            }

            const seedDeductRes = await pool.query(
                `UPDATE azit_crop_inventory
                 SET seed_qty = seed_qty - $1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $2 AND crop_id = $3 AND seed_qty >= $4 AND is_deleted = 0`,
                [targetCount, userId, crop.cropId, targetCount]
            );
            if (seedDeductRes.rowCount === 0) {
                throw new AzitGameError(
                    `창고에 [${crop.emoji} ${crop.shortName}] 씨앗이 부족합니다.`,
                    400
                );
            }

            const nowMs = Date.now();
            const nowIso = new Date(nowMs).toISOString();
            const nextWaterAtMs = nowMs + GARDEN_WATER_COOLDOWN_MS;
            const plantedPlotIndices: number[] = [];

            for (let i = 0; i < targetCount; i += 1) {
                const plotIndex = Number(emptyRes.rows[i].plot_index);
                const plantRes = await pool.query(
                    `UPDATE azit_garden_plots
                     SET crop_id = $1,
                         stage = 1,
                         water_count = 1,
                         planted_at = $2,
                         last_watered_at = $3,
                         next_water_at_ms = $4,
                         fertilizer_used_count = 0,
                         water_notified_at = NULL,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE user_id = $5 AND plot_index = $6 AND is_unlocked = 1 AND is_deleted = 0 AND (crop_id IS NULL OR stage = 0)`,
                    [crop.cropId, nowIso, nowIso, nextWaterAtMs, userId, plotIndex]
                );
                if (plantRes.rowCount === 1) {
                    plantedPlotIndices.push(plotIndex);
                    await this.scheduleAzitNotification({
                        userId,
                        category: 'azit.garden',
                        dedupeKey: `azit:garden:plot:${plotIndex}`,
                        title: '💧 [아지트 농장] 작물에 물을 줄 시간이에요!',
                        body: `${plotIndex + 1}번 텃밭의 [${crop.emoji} ${crop.name}]에 2차 물을 줄 시간(8시간 경과)이에요!`,
                        url: '/mypage?section=dashboard&zone=garden',
                        tag: 'azit-garden',
                        scheduledAtMs: nextWaterAtMs,
                        data: { zone: 'garden', plotIndex, cropId: crop.cropId },
                    });
                }
            }

            const unplanted = targetCount - plantedPlotIndices.length;
            if (unplanted > 0) {
                await pool.query(
                    `UPDATE azit_crop_inventory
                     SET seed_qty = seed_qty + $1,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE user_id = $2 AND crop_id = $3`,
                    [unplanted, userId, crop.cropId]
                );
            }

            await this.syncGardenSnapshotToMinihome(userId);
            const state = await this.getStateInternal(userId, { skipFarmerAutomation: true });
            return {
                message: `🌱 [${crop.emoji} ${crop.name}] 씨앗을 ${plantedPlotIndices.length}개 텃밭에 일괄 심었습니다!`,
                plantedCount: plantedPlotIndices.length,
                plantedPlotIndices,
                state,
            };
        });
    }

    // ==================== 1-B. 농부 고용 · 육성 · 자동화 ====================

    static async hireFarmer(userId: number, farmerCode: string) {
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            await this.processFarmerAutomationInternal(userId, Date.now());

            const def = getFarmerDef(farmerCode);
            if (!def) {
                throw new AzitGameError('존재하지 않는 농부입니다.', 400);
            }

            const profileRes = await pool.query('SELECT azit_xp FROM azit_profiles WHERE user_id = $1', [userId]);
            const levelInfo = getAzitLevelInfo(Number(profileRes.rows[0]?.azit_xp ?? 0));
            if (levelInfo.level < 20 || levelInfo.maxFarmers <= 0) {
                throw new AzitGameError(
                    '농부 고용은 아지트 Lv.20부터 가능합니다.',
                    400,
                    'AZIT_LEVEL_LOCKED'
                );
            }
            if (levelInfo.level < def.requiredAzitLevel) {
                throw new AzitGameError(
                    `[${def.name}] 농부는 아지트 Lv.${def.requiredAzitLevel}부터 고용할 수 있습니다.`,
                    400,
                    'AZIT_LEVEL_LOCKED'
                );
            }

            const existingRes = await pool.query(
                `SELECT farmer_code FROM azit_farmers WHERE user_id = $1 AND is_deleted = 0`,
                [userId]
            );
            if (existingRes.rows.some((r) => String(r.farmer_code) === def.farmerCode)) {
                throw new AzitGameError(`이미 [${def.name}] 농부를 고용하고 있습니다.`, 400);
            }
            if (existingRes.rows.length >= levelInfo.maxFarmers) {
                throw new AzitGameError(
                    `현재 아지트 레벨(Lv.${levelInfo.level})에서는 최대 ${levelInfo.maxFarmers}명의 농부만 고용할 수 있습니다.`,
                    400
                );
            }

            await this.deductVeraPoints({
                userId,
                amount: def.hireCost,
                txType: 'farmer_hire',
                refId: def.farmerCode,
                description: `${def.emoji} 농부 [${def.name}] 고용`,
            });

            const nowMs = Date.now();
            try {
                await pool.query(
                    `INSERT INTO azit_farmers (
                        user_id, farmer_code, level, xp, grade, auto_enabled, auto_fertilize,
                        preferred_crop_id, last_auto_tick_ms, total_watered, total_harvested, total_planted,
                        is_deleted, deleted_at
                     )
                     VALUES ($1, $2, 1, 0, 1, 1, 0, NULL, $3, 0, 0, 0, 0, NULL)
                     ON CONFLICT (user_id, farmer_code) DO UPDATE SET
                        level = 1,
                        xp = 0,
                        grade = 1,
                        auto_enabled = 1,
                        auto_fertilize = 0,
                        preferred_crop_id = NULL,
                        last_auto_tick_ms = $4,
                        total_watered = 0,
                        total_harvested = 0,
                        total_planted = 0,
                        is_deleted = 0,
                        deleted_at = NULL,
                        updated_at = CURRENT_TIMESTAMP`,
                    [userId, def.farmerCode, nowMs, nowMs]
                );
            } catch (err) {
                await this.creditVeraPoints({
                    userId,
                    amount: def.hireCost,
                    txType: 'refund',
                    refId: def.farmerCode,
                    description: `농부 고용 실패 환불 (${def.name})`,
                    countAsActivity: false,
                });
                throw err;
            }

            const state = await this.getStateInternal(userId, { skipFarmerAutomation: true });
            return {
                message: `${def.emoji} [${def.name}] 농부를 고용했습니다! 이제 텃밭 자동 관리가 시작됩니다.`,
                state,
            };
        });
    }

    static async upgradeFarmer(userId: number, farmerCode: string) {
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            await this.processFarmerAutomationInternal(userId, Date.now());

            const def = getFarmerDef(farmerCode);
            if (!def) {
                throw new AzitGameError('존재하지 않는 농부입니다.', 400);
            }

            const farmerRes = await pool.query(
                `SELECT level, xp FROM azit_farmers
                 WHERE user_id = $1 AND farmer_code = $2 AND is_deleted = 0`,
                [userId, def.farmerCode]
            );
            if (farmerRes.rows.length === 0) {
                throw new AzitGameError('고용하지 않은 농부입니다.', 404);
            }

            const currentLevel = Math.max(1, Number(farmerRes.rows[0].level ?? 1));
            const currentXp = Math.max(0, Number(farmerRes.rows[0].xp ?? 0));
            if (currentLevel >= MAX_FARMER_LEVEL) {
                throw new AzitGameError(
                    `[${def.name}] 농부는 이미 최고 레벨(Lv.${MAX_FARMER_LEVEL})입니다.`,
                    400
                );
            }

            const cost = getFarmerUpgradeCost(currentLevel);
            await this.deductVeraPoints({
                userId,
                amount: cost,
                txType: 'farmer_upgrade',
                refId: def.farmerCode,
                description: `${def.emoji} 농부 [${def.name}] Lv.${currentLevel + 1} 육성`,
            });

            const nextLevel = currentLevel + 1;
            const nextStats = getFarmerLevelStats(nextLevel);
            const nextXp =
                nextLevel >= MAX_FARMER_LEVEL
                    ? 0
                    : Math.min(currentXp, Math.max(0, getFarmerNextLevelXp(nextLevel) - 1));

            try {
                await pool.query(
                    `UPDATE azit_farmers
                     SET level = $1,
                         grade = $2,
                         xp = $3,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE user_id = $4 AND farmer_code = $5 AND is_deleted = 0`,
                    [nextLevel, nextStats.grade, nextXp, userId, def.farmerCode]
                );
            } catch (err) {
                await this.creditVeraPoints({
                    userId,
                    amount: cost,
                    txType: 'refund',
                    refId: def.farmerCode,
                    description: `농부 육성 실패 환불 (${def.name})`,
                    countAsActivity: false,
                });
                throw err;
            }

            const state = await this.getStateInternal(userId, { skipFarmerAutomation: true });
            return {
                message: `✨ ${def.emoji} [${def.name}] Lv.${nextLevel} (${nextStats.gradeName})로 성장했습니다!`,
                state,
            };
        });
    }

    static async configureFarmer(
        userId: number,
        params: {
            farmerCode: string;
            autoEnabled?: boolean;
            preferredCropId?: string | null;
            autoFertilize?: boolean;
        }
    ) {
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            await this.processFarmerAutomationInternal(userId, Date.now());

            const def = getFarmerDef(params.farmerCode);
            if (!def) {
                throw new AzitGameError('존재하지 않는 농부입니다.', 400);
            }

            const farmerRes = await pool.query(
                `SELECT id, auto_enabled, auto_fertilize, preferred_crop_id, last_auto_tick_ms
                 FROM azit_farmers
                 WHERE user_id = $1 AND farmer_code = $2 AND is_deleted = 0`,
                [userId, def.farmerCode]
            );
            if (farmerRes.rows.length === 0) {
                throw new AzitGameError('고용하지 않은 농부입니다.', 404);
            }
            const current = farmerRes.rows[0];

            const profileRes = await pool.query('SELECT azit_xp FROM azit_profiles WHERE user_id = $1', [userId]);
            const levelInfo = getAzitLevelInfo(Number(profileRes.rows[0]?.azit_xp ?? 0));

            let nextPreferredCropId: string | null = current.preferred_crop_id
                ? String(current.preferred_crop_id)
                : null;
            if (params.preferredCropId !== undefined) {
                if (params.preferredCropId === null) {
                    nextPreferredCropId = null;
                } else {
                    const crop = getCropDef(params.preferredCropId);
                    if (!crop) {
                        throw new AzitGameError('존재하지 않는 작물입니다.', 400);
                    }
                    if (levelInfo.level < crop.requiredAzitLevel) {
                        throw new AzitGameError(
                            `[${crop.emoji} ${crop.name}] 작물은 아지트 Lv.${crop.requiredAzitLevel}부터 선호 작물로 설정할 수 있습니다.`,
                            400,
                            'AZIT_LEVEL_LOCKED'
                        );
                    }
                    nextPreferredCropId = crop.cropId;
                }
            }

            const prevAutoEnabled = Number(current.auto_enabled ?? 1) === 1;
            const nextAutoEnabled =
                params.autoEnabled !== undefined ? params.autoEnabled : prevAutoEnabled;
            const nextAutoFertilize =
                params.autoFertilize !== undefined
                    ? params.autoFertilize
                    : Number(current.auto_fertilize ?? 0) === 1;

            const prevTickMs = Number(current.last_auto_tick_ms ?? 0);
            const nextLastTickMs =
                (!prevAutoEnabled && nextAutoEnabled) || (nextAutoEnabled && prevTickMs <= 0)
                    ? Date.now()
                    : prevTickMs;

            await pool.query(
                `UPDATE azit_farmers
                 SET auto_enabled = $1,
                     auto_fertilize = $2,
                     preferred_crop_id = $3,
                     last_auto_tick_ms = $4,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $5 AND user_id = $6 AND is_deleted = 0`,
                [
                    nextAutoEnabled ? 1 : 0,
                    nextAutoFertilize ? 1 : 0,
                    nextPreferredCropId,
                    nextLastTickMs,
                    Number(current.id),
                    userId,
                ]
            );

            const state = await this.getStateInternal(userId, { skipFarmerAutomation: true });
            return {
                message: `⚙️ ${def.emoji} [${def.name}] 자동화 설정이 저장되었습니다.`,
                state,
            };
        });
    }

    static async processFarmerAutomation(
        userId: number,
        nowMs = Date.now()
    ): Promise<{
        tasksExecuted: number;
        actions: Array<{
            farmerCode: AzitFarmerCode;
            actionType: AzitFarmerRole;
            plotIndex: number;
            cropId: AzitCropId | null;
        }>;
    }> {
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            return this.processFarmerAutomationInternal(userId, nowMs);
        });
    }

    private static async processFarmerAutomationInternal(
        userId: number,
        nowMs = Date.now()
    ): Promise<{
        tasksExecuted: number;
        actions: Array<{
            farmerCode: AzitFarmerCode;
            actionType: AzitFarmerRole;
            plotIndex: number;
            cropId: AzitCropId | null;
        }>;
    }> {
        const safeNowMs = Number.isFinite(nowMs) ? Math.floor(nowMs) : Date.now();
        const farmerRowsRes = await pool.query(
            `SELECT id, farmer_code, level, xp, grade, auto_enabled, auto_fertilize,
                    preferred_crop_id, last_auto_tick_ms, total_watered, total_harvested, total_planted
             FROM azit_farmers
             WHERE user_id = $1 AND is_deleted = 0 AND auto_enabled = 1
             ORDER BY id ASC`,
            [userId]
        );
        if (farmerRowsRes.rows.length === 0) {
            return { tasksExecuted: 0, actions: [] };
        }

        const profileRes = await pool.query('SELECT azit_xp FROM azit_profiles WHERE user_id = $1', [userId]);
        const rawCurrentAzitXp = Number(profileRes.rows[0]?.azit_xp ?? 0);
        let currentAzitXp = Number.isFinite(rawCurrentAzitXp) ? Math.max(0, Math.floor(rawCurrentAzitXp)) : 0;
        let currentAzitLevel = getAzitLevelInfo(currentAzitXp).level;
        if (currentAzitLevel < 20) {
            return { tasksExecuted: 0, actions: [] };
        }

        const MAX_CATCHUP_TICKS = 24;
        let tasksExecuted = 0;
        let anyGardenChanged = false;
        const actions: Array<{
            farmerCode: AzitFarmerCode;
            actionType: AzitFarmerRole;
            plotIndex: number;
            cropId: AzitCropId | null;
        }> = [];

        for (const fRow of farmerRowsRes.rows) {
            const farmerId = Number(fRow.id);
            const farmerCode = String(fRow.farmer_code) as AzitFarmerCode;
            const def = getFarmerDef(farmerCode);
            if (!def) continue;

            let currentLevel = Math.max(1, Math.min(MAX_FARMER_LEVEL, Number(fRow.level ?? 1)));
            let currentXp = Math.max(0, Number(fRow.xp ?? 0));
            let stats = getFarmerLevelStats(currentLevel);
            const initialWorkIntervalMs = stats.workIntervalMs;
            const prevTickMs = Number(fRow.last_auto_tick_ms ?? 0);

            if (prevTickMs <= 0) {
                await pool.query(
                    `UPDATE azit_farmers
                     SET last_auto_tick_ms = $1,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE id = $2 AND last_auto_tick_ms = $3 AND is_deleted = 0`,
                    [safeNowMs, farmerId, prevTickMs]
                );
                continue;
            }

            if (safeNowMs <= prevTickMs) {
                continue;
            }

            const elapsedMs = safeNowMs - prevTickMs;
            if (elapsedMs < initialWorkIntervalMs) {
                continue;
            }

            const rawTicks = Math.floor(elapsedMs / initialWorkIntervalMs);
            const ticksToRun = Math.min(rawTicks, MAX_CATCHUP_TICKS);
            const nextLastTickMs =
                rawTicks <= MAX_CATCHUP_TICKS
                    ? prevTickMs + rawTicks * initialWorkIntervalMs
                    : safeNowMs;
            const catchupBaseMs =
                rawTicks <= MAX_CATCHUP_TICKS
                    ? prevTickMs
                    : safeNowMs - ticksToRun * initialWorkIntervalMs;

            const casClaimRes = await pool.query(
                `UPDATE azit_farmers
                 SET last_auto_tick_ms = $1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2 AND last_auto_tick_ms = $3 AND is_deleted = 0`,
                [nextLastTickMs, farmerId, prevTickMs]
            );
            if (casClaimRes.rowCount === 0) {
                continue;
            }

            let totalWatered = Math.max(0, Number(fRow.total_watered ?? 0));
            let totalHarvested = Math.max(0, Number(fRow.total_harvested ?? 0));
            let totalPlanted = Math.max(0, Number(fRow.total_planted ?? 0));
            const autoFertilize = Number(fRow.auto_fertilize ?? 0) === 1;
            const preferredCropId = fRow.preferred_crop_id ? String(fRow.preferred_crop_id) : null;

            for (let t = 0; t < ticksToRun; t += 1) {
                const tickTimeMs = Math.min(safeNowMs, catchupBaseMs + (t + 1) * initialWorkIntervalMs);
                const tickIso = new Date(tickTimeMs).toISOString();

                let taskOutcome: {
                    actionType: AzitFarmerRole;
                    plotIndex: number;
                    cropId: AzitCropId | null;
                    detail: string;
                } | null = null;

                // 1) Harvest (Grade 2+)
                if (stats.roles.includes('harvest')) {
                    const matureRes = await pool.query(
                        `SELECT plot_index, crop_id, soil_level
                         FROM azit_garden_plots
                         WHERE user_id = $1 AND is_unlocked = 1 AND is_deleted = 0 AND crop_id IS NOT NULL AND stage >= 3
                         ORDER BY plot_index ASC
                         LIMIT 1`,
                        [userId]
                    );
                    const matureRow = matureRes.rows[0];
                    if (matureRow) {
                        const plotIndex = Number(matureRow.plot_index);
                        const crop = getCropDef(String(matureRow.crop_id));
                        if (crop) {
                            const clearRes = await pool.query(
                                `UPDATE azit_garden_plots
                                 SET crop_id = NULL,
                                     stage = 0,
                                     water_count = 0,
                                     planted_at = NULL,
                                     last_watered_at = NULL,
                                     next_water_at_ms = NULL,
                                     fertilizer_used_count = 0,
                                     water_notified_at = NULL,
                                     updated_at = CURRENT_TIMESTAMP
                                 WHERE user_id = $1 AND plot_index = $2 AND crop_id = $3 AND stage >= 3 AND is_unlocked = 1 AND is_deleted = 0`,
                                [userId, plotIndex, crop.cropId]
                            );
                            if (clearRes.rowCount === 1) {
                                const yieldOutcome = calculateSoilHarvestYield(
                                    crop,
                                    Number(matureRow.soil_level ?? 0)
                                );
                                await pool.query(
                                    `UPDATE azit_crop_inventory
                                     SET harvest_qty = harvest_qty + $1,
                                         updated_at = CURRENT_TIMESTAMP
                                     WHERE user_id = $2 AND crop_id = $3`,
                                    [yieldOutcome.totalYield, userId, crop.cropId]
                                );
                                await this.addAzitXp(userId, GARDEN_HARVEST_AZIT_XP);
                                currentAzitXp += GARDEN_HARVEST_AZIT_XP;
                                currentAzitLevel = getAzitLevelInfo(currentAzitXp).level;
                                await this.cancelAzitNotification(userId, `azit:garden:plot:${plotIndex}`);
                                totalHarvested += 1;
                                const bonusPart =
                                    yieldOutcome.totalBonus > 0 ? ` (보너스 +${yieldOutcome.totalBonus})` : '';
                                taskOutcome = {
                                    actionType: 'harvest',
                                    plotIndex,
                                    cropId: crop.cropId,
                                    detail: `${plotIndex + 1}번 텃밭 [${crop.emoji} ${crop.name}] ${yieldOutcome.totalYield}개 자동 수확${bonusPart}`,
                                };
                            }
                        }
                    }
                }

                // 2) Water (Grade 1+)
                if (!taskOutcome && stats.roles.includes('water')) {
                    const growingRes = await pool.query(
                        `SELECT plot_index, crop_id, stage, last_watered_at, next_water_at_ms
                         FROM azit_garden_plots
                         WHERE user_id = $1 AND is_unlocked = 1 AND is_deleted = 0 AND crop_id IS NOT NULL AND stage IN (1, 2)
                         ORDER BY plot_index ASC`,
                        [userId]
                    );
                    const targetRow = growingRes.rows.find((row) => {
                        const nextMs = resolvePlotNextWaterAtMs(row);
                        return nextMs === null || nextMs <= tickTimeMs;
                    });
                    if (targetRow) {
                        const plotIndex = Number(targetRow.plot_index);
                        const currentStage = Number(targetRow.stage);
                        const nextStage = Math.min(3, currentStage + 1);
                        const reducedCooldownMs = Math.round(
                            GARDEN_WATER_COOLDOWN_MS * (1 - stats.waterCooldownReductionPct / 100)
                        );
                        const nextWaterAtMs = nextStage < 3 ? tickTimeMs + reducedCooldownMs : null;

                        const updRes = await pool.query(
                            `UPDATE azit_garden_plots
                             SET stage = $1,
                                 water_count = water_count + 1,
                                 last_watered_at = $2,
                                 next_water_at_ms = $3,
                                 water_notified_at = NULL,
                                 updated_at = CURRENT_TIMESTAMP
                             WHERE user_id = $4 AND plot_index = $5 AND stage = $6 AND is_unlocked = 1 AND is_deleted = 0`,
                            [nextStage, tickIso, nextWaterAtMs, userId, plotIndex, currentStage]
                        );
                        if (updRes.rowCount === 1) {
                            const crop = getCropDef(String(targetRow.crop_id));
                            if (nextStage < 3 && nextWaterAtMs !== null) {
                                await this.scheduleAzitNotification({
                                    userId,
                                    category: 'azit.garden',
                                    dedupeKey: `azit:garden:plot:${plotIndex}`,
                                    title: '💧 [아지트 농장] 작물에 물을 줄 시간이에요!',
                                    body: `${plotIndex + 1}번 텃밭의 [${crop?.emoji || '🌱'} ${crop?.name || '작물'}]에 마지막 물을 줄 시간이에요!`,
                                    url: '/mypage?section=dashboard&zone=garden',
                                    tag: 'azit-garden',
                                    scheduledAtMs: nextWaterAtMs,
                                    data: {
                                        zone: 'garden',
                                        plotIndex,
                                        cropId: String(targetRow.crop_id),
                                        stage: nextStage,
                                    },
                                });
                            } else {
                                await this.cancelAzitNotification(userId, `azit:garden:plot:${plotIndex}`);
                            }
                            totalWatered += 1;
                            taskOutcome = {
                                actionType: 'water',
                                plotIndex,
                                cropId: crop ? crop.cropId : null,
                                detail: `${plotIndex + 1}번 텃밭 [${crop?.emoji || '🌱'} ${crop?.name || '작물'}] 물주기 (${nextStage}/3단계 · 대기 -${stats.waterCooldownReductionPct}%)`,
                            };
                        }
                    }
                }

                // 3) Fertilize (Grade 4+ & autoFertilize)
                if (!taskOutcome && stats.roles.includes('fertilize') && autoFertilize) {
                    const waitingRes = await pool.query(
                        `SELECT plot_index, crop_id, stage, last_watered_at, next_water_at_ms, fertilizer_used_count
                         FROM azit_garden_plots
                         WHERE user_id = $1 AND is_unlocked = 1 AND is_deleted = 0
                           AND crop_id IS NOT NULL AND stage IN (1, 2) AND fertilizer_used_count < $2
                         ORDER BY plot_index ASC`,
                        [userId, MAX_FERTILIZER_PER_CROP]
                    );
                    const targetRow = waitingRes.rows.find((row) => {
                        const curNextMs = resolvePlotNextWaterAtMs(row);
                        return curNextMs !== null && curNextMs > tickTimeMs;
                    });
                    if (targetRow) {
                        const invRes = await pool.query(
                            `SELECT fertilizer_id, qty
                             FROM azit_fertilizer_inventory
                             WHERE user_id = $1 AND is_deleted = 0 AND qty >= 1`,
                            [userId]
                        );
                        const qtyMap = new Map<string, number>();
                        for (const inv of invRes.rows) {
                            qtyMap.set(String(inv.fertilizer_id), Number(inv.qty ?? 0));
                        }
                        const chosenFert = AZIT_FERTILIZERS.find(
                            (f) =>
                                currentAzitLevel >= f.requiredAzitLevel &&
                                (qtyMap.get(f.fertilizerId) ?? 0) >= 1
                        );
                        if (chosenFert) {
                            const deductRes = await pool.query(
                                `UPDATE azit_fertilizer_inventory
                                 SET qty = qty - 1,
                                     updated_at = CURRENT_TIMESTAMP
                                 WHERE user_id = $1 AND fertilizer_id = $2 AND qty >= 1 AND is_deleted = 0`,
                                [userId, chosenFert.fertilizerId]
                            );
                            if (deductRes.rowCount === 1) {
                                const plotIndex = Number(targetRow.plot_index);
                                const curNextMs = resolvePlotNextWaterAtMs(targetRow) ?? tickTimeMs;
                                const newNextWaterAtMs = Math.max(tickTimeMs, curNextMs - chosenFert.reductionMs);
                                const updPlotRes = await pool.query(
                                    `UPDATE azit_garden_plots
                                     SET next_water_at_ms = $1,
                                         fertilizer_used_count = fertilizer_used_count + 1,
                                         updated_at = CURRENT_TIMESTAMP
                                     WHERE user_id = $2 AND plot_index = $3 AND stage IN (1, 2)
                                       AND is_unlocked = 1 AND fertilizer_used_count < $4 AND is_deleted = 0`,
                                    [newNextWaterAtMs, userId, plotIndex, MAX_FERTILIZER_PER_CROP]
                                );
                                if (updPlotRes.rowCount === 1) {
                                    const totalFertRes = await pool.query(
                                        `SELECT COALESCE(SUM(qty), 0) AS total
                                         FROM azit_fertilizer_inventory
                                         WHERE user_id = $1 AND is_deleted = 0`,
                                        [userId]
                                    );
                                    await pool.query(
                                        `UPDATE azit_profiles
                                         SET fertilizer_qty = $1,
                                             updated_at = CURRENT_TIMESTAMP
                                         WHERE user_id = $2`,
                                        [Number(totalFertRes.rows[0]?.total ?? 0), userId]
                                    );
                                    const crop = getCropDef(String(targetRow.crop_id));
                                    if (newNextWaterAtMs <= tickTimeMs) {
                                        await this.cancelAzitNotification(userId, `azit:garden:plot:${plotIndex}`);
                                    } else {
                                        await this.scheduleAzitNotification({
                                            userId,
                                            category: 'azit.garden',
                                            dedupeKey: `azit:garden:plot:${plotIndex}`,
                                            title: '💧 [아지트 농장] 작물에 물을 줄 시간이에요!',
                                            body: `${plotIndex + 1}번 텃밭의 [${crop?.emoji || '🌱'} ${crop?.name || '작물'}] 비료 효과로 물줄 시간이 다가왔어요!`,
                                            url: '/mypage?section=dashboard&zone=garden',
                                            tag: 'azit-garden',
                                            scheduledAtMs: newNextWaterAtMs,
                                            data: { zone: 'garden', plotIndex, cropId: String(targetRow.crop_id) },
                                        });
                                    }
                                    taskOutcome = {
                                        actionType: 'fertilize',
                                        plotIndex,
                                        cropId: crop ? crop.cropId : null,
                                        detail: `${plotIndex + 1}번 텃밭 [${crop?.emoji || '🌱'} ${crop?.name || '작물'}] ${chosenFert.emoji} ${chosenFert.shortName} 자동 시비`,
                                    };
                                } else {
                                    await pool.query(
                                        `UPDATE azit_fertilizer_inventory
                                         SET qty = qty + 1,
                                             updated_at = CURRENT_TIMESTAMP
                                         WHERE user_id = $1 AND fertilizer_id = $2`,
                                        [userId, chosenFert.fertilizerId]
                                    );
                                }
                            }
                        }
                    }
                }

                // 4) Plant (Grade 3+)
                if (!taskOutcome && stats.roles.includes('plant')) {
                    const emptyRes = await pool.query(
                        `SELECT plot_index
                         FROM azit_garden_plots
                         WHERE user_id = $1 AND is_unlocked = 1 AND is_deleted = 0 AND (crop_id IS NULL OR stage = 0)
                         ORDER BY plot_index ASC
                         LIMIT 1`,
                        [userId]
                    );
                    const emptyRow = emptyRes.rows[0];
                    if (emptyRow) {
                        const plotIndex = Number(emptyRow.plot_index);
                        const seedInvRes = await pool.query(
                            `SELECT crop_id, seed_qty
                             FROM azit_crop_inventory
                             WHERE user_id = $1 AND is_deleted = 0 AND seed_qty >= 1`,
                            [userId]
                        );
                        const seedMap = new Map<string, number>();
                        for (const sRow of seedInvRes.rows) {
                            seedMap.set(String(sRow.crop_id), Number(sRow.seed_qty ?? 0));
                        }

                        let targetCrop: AzitCropDef | undefined;
                        if (preferredCropId) {
                            const prefDef = getCropDef(preferredCropId);
                            if (
                                prefDef &&
                                currentAzitLevel >= prefDef.requiredAzitLevel &&
                                (seedMap.get(prefDef.cropId) ?? 0) >= 1
                            ) {
                                targetCrop = prefDef;
                            }
                        } else {
                            targetCrop = AZIT_CROPS.find(
                                (c) =>
                                    currentAzitLevel >= c.requiredAzitLevel &&
                                    (seedMap.get(c.cropId) ?? 0) >= 1
                            );
                        }

                        if (targetCrop) {
                            const deductSeedRes = await pool.query(
                                `UPDATE azit_crop_inventory
                                 SET seed_qty = seed_qty - 1,
                                     updated_at = CURRENT_TIMESTAMP
                                 WHERE user_id = $1 AND crop_id = $2 AND seed_qty >= 1 AND is_deleted = 0`,
                                [userId, targetCrop.cropId]
                            );
                            if (deductSeedRes.rowCount === 1) {
                                const reducedCooldownMs = Math.round(
                                    GARDEN_WATER_COOLDOWN_MS * (1 - stats.waterCooldownReductionPct / 100)
                                );
                                const nextWaterAtMs = tickTimeMs + reducedCooldownMs;
                                const plantRes = await pool.query(
                                    `UPDATE azit_garden_plots
                                     SET crop_id = $1,
                                         stage = 1,
                                         water_count = 1,
                                         planted_at = $2,
                                         last_watered_at = $3,
                                         next_water_at_ms = $4,
                                         fertilizer_used_count = 0,
                                         water_notified_at = NULL,
                                         updated_at = CURRENT_TIMESTAMP
                                     WHERE user_id = $5 AND plot_index = $6 AND is_unlocked = 1 AND is_deleted = 0 AND (crop_id IS NULL OR stage = 0)`,
                                    [targetCrop.cropId, tickIso, tickIso, nextWaterAtMs, userId, plotIndex]
                                );
                                if (plantRes.rowCount === 1) {
                                    await this.scheduleAzitNotification({
                                        userId,
                                        category: 'azit.garden',
                                        dedupeKey: `azit:garden:plot:${plotIndex}`,
                                        title: '💧 [아지트 농장] 작물에 물을 줄 시간이에요!',
                                        body: `${plotIndex + 1}번 텃밭의 [${targetCrop.emoji} ${targetCrop.name}]에 2차 물을 줄 시간이에요!`,
                                        url: '/mypage?section=dashboard&zone=garden',
                                        tag: 'azit-garden',
                                        scheduledAtMs: nextWaterAtMs,
                                        data: { zone: 'garden', plotIndex, cropId: targetCrop.cropId },
                                    });
                                    totalPlanted += 1;
                                    taskOutcome = {
                                        actionType: 'plant',
                                        plotIndex,
                                        cropId: targetCrop.cropId,
                                        detail: `${plotIndex + 1}번 텃밭 [${targetCrop.emoji} ${targetCrop.name}] 자동 파종`,
                                    };
                                } else {
                                    await pool.query(
                                        `UPDATE azit_crop_inventory
                                         SET seed_qty = seed_qty + 1,
                                             updated_at = CURRENT_TIMESTAMP
                                         WHERE user_id = $1 AND crop_id = $2`,
                                        [userId, targetCrop.cropId]
                                    );
                                }
                            }
                        }
                    }
                }

                if (!taskOutcome) {
                    continue;
                }

                tasksExecuted += 1;
                anyGardenChanged = true;
                actions.push({
                    farmerCode,
                    actionType: taskOutcome.actionType,
                    plotIndex: taskOutcome.plotIndex,
                    cropId: taskOutcome.cropId,
                });

                currentXp += FARMER_TASK_XP;
                while (currentLevel < MAX_FARMER_LEVEL && currentXp >= getFarmerNextLevelXp(currentLevel)) {
                    currentXp -= getFarmerNextLevelXp(currentLevel);
                    currentLevel += 1;
                }
                if (currentLevel >= MAX_FARMER_LEVEL) {
                    currentXp = 0;
                }
                stats = getFarmerLevelStats(currentLevel);

                await pool.query(
                    `UPDATE azit_farmers
                     SET level = $1,
                         xp = $2,
                         grade = $3,
                         total_watered = $4,
                         total_harvested = $5,
                         total_planted = $6,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE id = $7`,
                    [
                        currentLevel,
                        currentXp,
                        stats.grade,
                        totalWatered,
                        totalHarvested,
                        totalPlanted,
                        farmerId,
                    ]
                );

                await pool.query(
                    `INSERT INTO azit_farmer_logs (user_id, farmer_code, action_type, plot_index, crop_id, detail)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        userId,
                        farmerCode,
                        taskOutcome.actionType,
                        taskOutcome.plotIndex,
                        taskOutcome.cropId,
                        taskOutcome.detail,
                    ]
                );
            }
        }

        if (anyGardenChanged) {
            await this.syncGardenSnapshotToMinihome(userId);
        }

        return { tasksExecuted, actions };
    }

    // ==================== 2. 주방 & 요리사 ====================

    static async hireChef(userId: number, chefCode: string) {
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            await this.processFarmerAutomationInternal(userId, Date.now());
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

            const state = await this.getStateInternal(userId, { skipFarmerAutomation: true });
            return {
                message: `👨‍🍳 [${def.emoji} ${def.name}] 요리사를 영입했습니다! 이제 주방 화구에서 조리를 지시해 보세요.`,
                state,
            };
        });
    }

    static async upgradeChef(userId: number, chefCode: string) {
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            await this.processFarmerAutomationInternal(userId, Date.now());
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

            const state = await this.getStateInternal(userId, { skipFarmerAutomation: true });
            return {
                message: `✨ [${def.emoji} ${def.name}] Lv.${currentLevel + 1}로 승급! 조리 단축 및 대성공 확률이 올랐습니다.`,
                state,
            };
        });
    }

    static async startCooking(
        userId: number,
        slotIndex: number,
        recipeId: string,
        chefCode?: string | null
    ) {
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            await this.processFarmerAutomationInternal(userId, Date.now());
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
            let endsAtMs = 0;
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
                const effectiveSec = getEffectiveCookDurationSec(recipe.cookDurationSec, speedBonusPct);
                endsAtMs = nowMs + effectiveSec * 1000;

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
            if (endsAtMs > 0) {
                await this.scheduleAzitNotification({
                    userId,
                    category: 'azit.kitchen',
                    dedupeKey: `azit:kitchen:slot:${slotIndex}`,
                    title: '🍳 [아지트 주방] 요리가 완성되었어요!',
                    body: `${slotIndex + 1}번 화구의 [${recipe.emoji} ${recipe.name}] 조리가 끝났습니다. 지금 수령해 보세요!`,
                    url: '/mypage?section=dashboard&zone=kitchen',
                    tag: 'azit-kitchen',
                    scheduledAtMs: endsAtMs,
                    data: { zone: 'kitchen', slotIndex, recipeId: recipe.recipeId },
                });
            }
            const state = await this.getStateInternal(userId, { skipFarmerAutomation: true });
            return {
                message: `🍳 [${recipe.emoji} ${recipe.name}] 조리를 시작했습니다!${validatedChefCode ? '' : ' (요리사 없이 수습 조리 진행 중)'}`,
                state,
            };
        });
    }

    static async claimCooking(userId: number, slotIndex: number) {
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            await this.processFarmerAutomationInternal(userId, Date.now());
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
            const effectiveNowMs = nowMs + 1500;
            if (Number(slot.ends_at_ms) > effectiveNowMs) {
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
                [userId, slotIndex, effectiveNowMs]
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

            const producedQty = 1;
            const dishQuality: AzitDishQuality = greatSuccess ? 'special' : 'normal';
            if (greatSuccess) {
                await pool.query(
                    `INSERT INTO azit_dish_inventory (user_id, recipe_id, qty, special_qty)
                     VALUES ($1, $2, 0, $3)
                     ON CONFLICT (user_id, recipe_id) DO UPDATE SET
                        special_qty = azit_dish_inventory.special_qty + $4,
                        is_deleted = 0,
                        deleted_at = NULL,
                        updated_at = CURRENT_TIMESTAMP`,
                    [userId, recipe.recipeId, producedQty, producedQty]
                );
            } else {
                await pool.query(
                    `INSERT INTO azit_dish_inventory (user_id, recipe_id, qty, special_qty)
                     VALUES ($1, $2, $3, 0)
                     ON CONFLICT (user_id, recipe_id) DO UPDATE SET
                        qty = azit_dish_inventory.qty + $4,
                        is_deleted = 0,
                        deleted_at = NULL,
                        updated_at = CURRENT_TIMESTAMP`,
                    [userId, recipe.recipeId, producedQty, producedQty]
                );
            }

            await pool.query(
                `UPDATE azit_profiles
                 SET total_dishes_cooked = total_dishes_cooked + $1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $2`,
                [producedQty, userId]
            );
            await this.addAzitXp(userId, recipe.azitXpReward);
            await this.cancelAzitNotification(userId, `azit:kitchen:slot:${slotIndex}`);

            const state = await this.getStateInternal(userId, { skipFarmerAutomation: true });
            return {
                message: greatSuccess
                    ? `🌟 대성공! [★ 특제 ${recipe.emoji} ${recipe.name}] 요리를 완성했습니다! (용병 버프 +20% · 판매가 1.5배 · +${recipe.azitXpReward} 아지트 EXP)`
                    : `🍱 [${recipe.emoji} ${recipe.name}] 요리를 완성해 보관함에 넣었습니다! (+${recipe.azitXpReward} 아지트 EXP)`,
                greatSuccess,
                dishQuality,
                producedQty,
                state,
            };
        });
    }

    static async sellDish(
        userId: number,
        recipeId: string,
        rawQuantity = 1,
        rawQuality: AzitDishQuality = 'normal'
    ) {
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            await this.processFarmerAutomationInternal(userId, Date.now());
            const recipe = getRecipeDef(recipeId);
            if (!recipe) {
                throw new AzitGameError('존재하지 않는 요리입니다.', 400);
            }
            const qty = Math.max(1, Math.min(999, Math.floor(rawQuantity)));
            const quality: AzitDishQuality = rawQuality === 'special' ? 'special' : 'normal';
            const qualityLabel = quality === 'special' ? '★특제 ' : '';

            const deductSql =
                quality === 'special'
                    ? `UPDATE azit_dish_inventory
                       SET special_qty = special_qty - $1,
                           updated_at = CURRENT_TIMESTAMP
                       WHERE user_id = $2 AND recipe_id = $3 AND special_qty >= $4 AND is_deleted = 0`
                    : `UPDATE azit_dish_inventory
                       SET qty = qty - $1,
                           updated_at = CURRENT_TIMESTAMP
                       WHERE user_id = $2 AND recipe_id = $3 AND qty >= $4 AND is_deleted = 0`;

            const deductRes = await pool.query(deductSql, [qty, userId, recipe.recipeId, qty]);
            if (deductRes.rowCount === 0) {
                throw new AzitGameError(
                    `판매할 [${qualityLabel}${recipe.emoji} ${recipe.name}] 요리가 부족합니다.`,
                    400
                );
            }

            const unitPrice = getDishSellPrice(recipe, quality);
            const revenue = unitPrice * qty;
            await this.creditVeraPoints({
                userId,
                amount: revenue,
                txType: 'dish_sell',
                refId: quality === 'special' ? `${recipe.recipeId}:special` : recipe.recipeId,
                description: `${qualityLabel}${recipe.emoji} ${recipe.name} ×${qty} 판매`,
            });

            const state = await this.getStateInternal(userId, { skipFarmerAutomation: true });
            return {
                message: `💰 [${qualityLabel}${recipe.emoji} ${recipe.name}] ×${qty} 판매 완료! (+${revenue.toLocaleString()}P)`,
                state,
            };
        });
    }

    // ==================== 3. 용병 길드 & 몬스터 원정 ====================

    static async hireMercenary(userId: number, mercCode: string) {
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            await this.processFarmerAutomationInternal(userId, Date.now());
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
                    `INSERT INTO azit_mercenaries (
                        user_id, merc_code, level, xp, status, main_skill_level, sub_skill_level, died_at, death_zone_id, is_deleted, deleted_at
                     )
                     VALUES ($1, $2, 1, 0, 'idle', 1, 1, NULL, NULL, 0, NULL)
                     ON CONFLICT (user_id, merc_code) DO UPDATE SET
                        is_deleted = 0,
                        deleted_at = NULL,
                        level = 1,
                        xp = 0,
                        status = 'idle',
                        main_skill_level = 1,
                        sub_skill_level = 1,
                        died_at = NULL,
                        death_zone_id = NULL,
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

            const state = await this.getStateInternal(userId, { skipFarmerAutomation: true });
            return {
                message: `⚔️ [${def.emoji} ${def.name}] (${def.role}) 용병을 영입했습니다! 도시락을 챙겨 몬스터 원정에 출정해 보세요.`,
                state,
            };
        });
    }

    static async upgradeMercenary(_userId: number, _mercCode: string): Promise<never> {
        if (!MERC_GOLD_UPGRADE_ENABLED) {
            throw new AzitGameError(
                '용병은 전투 경험치로만 레벨업할 수 있습니다.',
                403,
                'GOLD_UPGRADE_DISABLED'
            );
        }
        throw new AzitGameError(
            '용병은 전투 경험치로만 레벨업할 수 있습니다.',
            403,
            'GOLD_UPGRADE_DISABLED'
        );
    }

    static async saveGroup(
        userId: number,
        params: { id?: number; name: string; slotIndex?: number; mercCodes: string[] }
    ) {
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            await this.processFarmerAutomationInternal(userId, Date.now());

            const trimmedName = typeof params.name === 'string' ? params.name.trim() : '';
            if (trimmedName.length < 1 || trimmedName.length > 24) {
                throw new AzitGameError('용병 그룹 이름은 1~24자 사이여야 합니다.', 400);
            }

            const rawCodes = Array.isArray(params.mercCodes)
                ? params.mercCodes.map((c) => (typeof c === 'string' ? c.trim() : '')).filter(Boolean)
                : [];
            const uniqueCodes = Array.from(new Set(rawCodes));
            if (uniqueCodes.length === 0) {
                throw new AzitGameError('그룹에는 최소 1명의 용병이 포함되어야 합니다.', 400);
            }

            const profileRes = await pool.query('SELECT azit_xp FROM azit_profiles WHERE user_id = $1', [userId]);
            const levelInfo = getAzitLevelInfo(Number(profileRes.rows[0]?.azit_xp ?? 0));
            if (uniqueCodes.length > levelInfo.maxPartySize) {
                throw new AzitGameError(
                    `현재 아지트 레벨(Lv.${levelInfo.level})에서는 최대 ${levelInfo.maxPartySize}명까지 편성할 수 있습니다.`,
                    400
                );
            }

            const ownedRes = await pool.query(
                `SELECT merc_code FROM azit_mercenaries WHERE user_id = $1 AND is_deleted = 0`,
                [userId]
            );
            const ownedSet = new Set(ownedRes.rows.map((r) => String(r.merc_code)));
            for (const code of uniqueCodes) {
                if (!getMercDef(code) || !ownedSet.has(code)) {
                    throw new AzitGameError('보유하지 않았거나 존재하지 않는 용병이 포함되어 있습니다.', 400);
                }
            }

            let slotIndex: number | undefined;
            if (params.slotIndex !== undefined) {
                if (!Number.isInteger(params.slotIndex) || params.slotIndex < 0 || params.slotIndex > 9) {
                    throw new AzitGameError('올바른 그룹 슬롯 번호(0~9)가 아닙니다.', 400);
                }
                slotIndex = params.slotIndex;
            }

            let groupId: number;
            let resolvedSlotIndex: number;

            if (params.id !== undefined && params.id !== null) {
                if (!Number.isInteger(params.id) || params.id <= 0) {
                    throw new AzitGameError('올바른 용병 그룹 ID가 아닙니다.', 400);
                }
                const existingRes = await pool.query(
                    `SELECT id, slot_index FROM azit_mercenary_groups
                     WHERE id = $1 AND user_id = $2 AND is_deleted = 0`,
                    [params.id, userId]
                );
                if (existingRes.rows.length === 0) {
                    throw new AzitGameError('수정할 용병 그룹을 찾을 수 없습니다.', 404);
                }
                const activeExpRes = await pool.query(
                    `SELECT id FROM azit_expeditions
                     WHERE user_id = $1 AND group_id = $2 AND status IN ('running', 'claiming') AND is_deleted = 0`,
                    [userId, params.id]
                );
                if (activeExpRes.rows.length > 0) {
                    throw new AzitGameError(
                        '현재 원정 출정 중인 그룹은 수정할 수 없습니다.',
                        409,
                        'GROUP_ON_EXPEDITION'
                    );
                }
                resolvedSlotIndex = slotIndex ?? Number(existingRes.rows[0].slot_index ?? 0);
                groupId = params.id;
                await pool.query(
                    `UPDATE azit_mercenary_groups
                     SET name = $1,
                         slot_index = $2,
                         merc_codes_json = $3,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE id = $4 AND user_id = $5 AND is_deleted = 0`,
                    [trimmedName, resolvedSlotIndex, JSON.stringify(uniqueCodes), groupId, userId]
                );
            } else {
                const activeGroupsRes = await pool.query(
                    `SELECT id, slot_index FROM azit_mercenary_groups
                     WHERE user_id = $1 AND is_deleted = 0
                     ORDER BY slot_index ASC`,
                    [userId]
                );
                if (activeGroupsRes.rows.length >= MAX_MERC_GROUPS) {
                    throw new AzitGameError(
                        `용병 그룹은 최대 ${MAX_MERC_GROUPS}개까지 저장할 수 있습니다.`,
                        400
                    );
                }
                const usedSlots = new Set(activeGroupsRes.rows.map((r) => Number(r.slot_index ?? 0)));
                if (slotIndex !== undefined) {
                    resolvedSlotIndex = slotIndex;
                } else {
                    let candidate = 0;
                    while (usedSlots.has(candidate) && candidate < MAX_MERC_GROUPS) {
                        candidate += 1;
                    }
                    resolvedSlotIndex = candidate;
                }
                const insertRes = await pool.query(
                    `INSERT INTO azit_mercenary_groups (user_id, name, slot_index, merc_codes_json)
                     VALUES ($1, $2, $3, $4)`,
                    [userId, trimmedName, resolvedSlotIndex, JSON.stringify(uniqueCodes)]
                );
                groupId = Number(insertRes.lastInsertRowid ?? 0);
            }

            const state = await this.getStateInternal(userId, { skipFarmerAutomation: true });
            const savedGroup = state.groups.find((g) => g.id === groupId) ?? {
                id: groupId,
                name: trimmedName,
                slotIndex: resolvedSlotIndex,
                mercCodes: uniqueCodes as AzitMercCode[],
            };
            return {
                message: `🛡️ 용병 그룹 [${trimmedName}] 편성을 저장했습니다!`,
                group: savedGroup,
                state,
            };
        });
    }

    static async deleteGroup(userId: number, groupId: number) {
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            await this.processFarmerAutomationInternal(userId, Date.now());
            if (!Number.isInteger(groupId) || groupId <= 0) {
                throw new AzitGameError('올바른 용병 그룹 ID가 아닙니다.', 400);
            }

            const existingRes = await pool.query(
                `SELECT id, name FROM azit_mercenary_groups
                 WHERE id = $1 AND user_id = $2 AND is_deleted = 0`,
                [groupId, userId]
            );
            if (existingRes.rows.length === 0) {
                throw new AzitGameError('삭제할 용병 그룹을 찾을 수 없습니다.', 404);
            }

            const activeExpRes = await pool.query(
                `SELECT id FROM azit_expeditions
                 WHERE user_id = $1 AND group_id = $2 AND status IN ('running', 'claiming') AND is_deleted = 0`,
                [userId, groupId]
            );
            if (activeExpRes.rows.length > 0) {
                throw new AzitGameError(
                    '현재 원정 출정 중인 그룹은 삭제할 수 없습니다.',
                    409,
                    'GROUP_ON_EXPEDITION'
                );
            }

            await pool.query(
                `UPDATE azit_mercenary_groups
                 SET is_deleted = 1,
                     deleted_at = CURRENT_TIMESTAMP,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $1 AND user_id = $2 AND is_deleted = 0`,
                [groupId, userId]
            );

            const state = await this.getStateInternal(userId, { skipFarmerAutomation: true });
            return {
                message: `🗑️ 용병 그룹 [${String(existingRes.rows[0].name)}]을(를) 삭제했습니다.`,
                state,
            };
        });
    }

    private static async creditMaterialInventory(
        userId: number,
        materialId: string,
        qty: number
    ): Promise<void> {
        const safeQty = Math.max(0, Math.floor(qty));
        if (safeQty <= 0 || !VALID_MATERIAL_IDS.has(materialId)) return;
        await pool.query(
            `INSERT INTO azit_material_inventory (user_id, material_id, qty)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, material_id) DO UPDATE SET
                qty = azit_material_inventory.qty + $4,
                is_deleted = 0,
                deleted_at = NULL,
                updated_at = CURRENT_TIMESTAMP`,
            [userId, materialId, safeQty, safeQty]
        );
    }

    private static async creditCropInventory(
        userId: number,
        cropId: string,
        qty: number
    ): Promise<void> {
        const safeQty = Math.max(0, Math.floor(qty));
        if (safeQty <= 0 || !VALID_CROP_IDS.has(cropId)) return;
        await pool.query(
            `INSERT INTO azit_crop_inventory (user_id, crop_id, seed_qty, harvest_qty)
             VALUES ($1, $2, 0, $3)
             ON CONFLICT (user_id, crop_id) DO UPDATE SET
                harvest_qty = azit_crop_inventory.harvest_qty + $4,
                is_deleted = 0,
                deleted_at = NULL,
                updated_at = CURRENT_TIMESTAMP`,
            [userId, cropId, safeQty, safeQty]
        );
    }

    private static async creditItemInventory(
        userId: number,
        itemId: string,
        qty: number
    ): Promise<void> {
        const safeQty = Math.max(0, Math.floor(qty));
        if (safeQty <= 0 || !VALID_ITEM_IDS.has(itemId)) return;
        await pool.query(
            `INSERT INTO azit_item_inventory (user_id, item_id, qty)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, item_id) DO UPDATE SET
                qty = azit_item_inventory.qty + $4,
                is_deleted = 0,
                deleted_at = NULL,
                updated_at = CURRENT_TIMESTAMP`,
            [userId, itemId, safeQty, safeQty]
        );
    }

    static async startExpedition(params: {
        userId: number;
        zoneId: string;
        groupId?: number | null;
        partyMercCodes?: string[];
        dishRecipeId: string;
        dishQuality?: AzitDishQuality;
        elixirItemId?: string | null;
    }) {
        const { userId, zoneId, dishRecipeId } = params;
        const dishQuality: AzitDishQuality = params.dishQuality === 'special' ? 'special' : 'normal';
        const dishLabelPrefix = dishQuality === 'special' ? '★특제 ' : '';
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            await this.processFarmerAutomationInternal(userId, Date.now());

            const zone = getZoneDef(zoneId);
            if (!zone) {
                throw new AzitGameError('존재하지 않는 원정 지역입니다.', 400);
            }
            const recipe = getRecipeDef(dishRecipeId);
            if (!recipe) {
                throw new AzitGameError('존재하지 않는 원정 도시락입니다.', 400);
            }

            let resolvedGroupId: number | null = null;
            let resolvedGroupName: string | null = null;
            let requestedPartyCodes = Array.isArray(params.partyMercCodes)
                ? params.partyMercCodes.map((c) => (typeof c === 'string' ? c.trim() : '')).filter(Boolean)
                : [];

            if (params.groupId !== undefined && params.groupId !== null) {
                if (!Number.isInteger(params.groupId) || params.groupId <= 0) {
                    throw new AzitGameError('올바른 용병 그룹 ID가 아닙니다.', 400);
                }
                const groupRes = await pool.query(
                    `SELECT id, name, merc_codes_json FROM azit_mercenary_groups
                     WHERE id = $1 AND user_id = $2 AND is_deleted = 0`,
                    [params.groupId, userId]
                );
                if (groupRes.rows.length === 0) {
                    throw new AzitGameError('선택한 용병 그룹을 찾을 수 없습니다.', 404);
                }
                resolvedGroupId = Number(groupRes.rows[0].id);
                resolvedGroupName = String(groupRes.rows[0].name ?? '');
                let groupMercCodes: string[] = [];
                try {
                    const parsed = JSON.parse(String(groupRes.rows[0].merc_codes_json || '[]'));
                    if (Array.isArray(parsed)) {
                        groupMercCodes = parsed
                            .map((c) => (typeof c === 'string' ? c.trim() : ''))
                            .filter(Boolean);
                    }
                } catch (_) {
                    groupMercCodes = [];
                }
                if (requestedPartyCodes.length === 0) {
                    requestedPartyCodes = groupMercCodes;
                } else {
                    const reqSet = new Set(requestedPartyCodes);
                    const grpSet = new Set(groupMercCodes);
                    const matchesGroup =
                        reqSet.size === grpSet.size &&
                        Array.from(reqSet).every((code) => grpSet.has(code));
                    if (!matchesGroup) {
                        throw new AzitGameError(
                            '선택한 용병 그룹의 편성 인원과 출전 용병 목록이 일치하지 않습니다.',
                            400,
                            'GROUP_PARTY_MISMATCH'
                        );
                    }
                }
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
                `SELECT id, group_id FROM azit_expeditions
                 WHERE user_id = $1 AND status IN ('running', 'claiming') AND is_deleted = 0`,
                [userId]
            );
            if (resolvedGroupId !== null && activeRes.rows.some((r) => Number(r.group_id ?? 0) === resolvedGroupId)) {
                throw new AzitGameError(
                    '해당 용병 그룹은 이미 원정에 출정 중입니다.',
                    409,
                    'GROUP_ALREADY_ON_EXPEDITION'
                );
            }
            if (activeRes.rows.length >= levelInfo.maxActiveExpeditions) {
                throw new AzitGameError(
                    `현재 아지트 레벨(Lv.${levelInfo.level})에서는 최대 ${levelInfo.maxActiveExpeditions}개 원정대만 동시 운영할 수 있습니다.`,
                    400
                );
            }

            const uniqueParty = Array.from(new Set(requestedPartyCodes));
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
                `SELECT merc_code, level, main_skill_level, sub_skill_level, status
                 FROM azit_mercenaries
                 WHERE user_id = $1 AND is_deleted = 0`,
                [userId]
            );
            const partyMercDetails: Array<{
                mercCode: AzitMercCode;
                level: number;
                mainSkillLevel: number;
                subSkillLevel: number;
            }> = [];
            for (const code of uniqueParty) {
                const row = mercRowsRes.rows.find((r) => r.merc_code === code);
                const mDef = getMercDef(code);
                if (!row || !mDef) {
                    throw new AzitGameError('영입되지 않은 용병이 포함되어 있습니다.', 400);
                }
                if (row.status === 'dead') {
                    throw new AzitGameError(
                        `[${mDef.name}] 용병은 쓰러진 상태입니다. 부활 아이템으로 먼저 소생시켜 주세요.`,
                        400,
                        'MERCENARY_DEAD'
                    );
                }
                if (row.status !== 'idle') {
                    throw new AzitGameError(`[${mDef.name}] 용병은 이미 다른 원정에 출정 중입니다.`, 400);
                }
                partyMercDetails.push({
                    mercCode: mDef.mercCode,
                    level: Number(row.level ?? 1),
                    mainSkillLevel: Math.max(1, Math.min(MAX_SKILL_LEVEL, Number(row.main_skill_level ?? 1))),
                    subSkillLevel: Math.max(1, Math.min(MAX_SKILL_LEVEL, Number(row.sub_skill_level ?? 1))),
                });
            }

            let resolvedElixirId: AzitItemId | null = null;
            if (params.elixirItemId !== undefined && params.elixirItemId !== null && params.elixirItemId.trim() !== '') {
                const elixirDef = getItemDef(params.elixirItemId.trim());
                if (!elixirDef || elixirDef.category !== 'consumable') {
                    throw new AzitGameError('원정에 사용할 수 없는 비약 아이템입니다.', 400);
                }
                resolvedElixirId = elixirDef.itemId;
            }

            const { winRatePct, buffs } = calculateExpeditionWinRate({
                mercenaries: partyMercDetails,
                recipeId: recipe.recipeId,
                zoneId: zone.zoneId,
                dishQuality,
            });

            // 1~4) 도시락·비약·출정비 차감 + 용병 잠금 + 원정 생성 (원자적 트랜잭션)
            const nowMs = Date.now();
            const effectiveDurationSec = Math.max(
                3600,
                Math.min(28800, Math.round(zone.durationSec * (1 - buffs.expeditionSpeedBonusPct / 100)))
            );
            const endsAtMs = nowMs + effectiveDurationSec * 1000;
            const battleSeed = crypto.randomInt(1, 2_147_483_647);
            const partySnapshot = partyMercDetails.map((m, idx) =>
                buildMercCombatUnit({
                    mercCode: m.mercCode,
                    level: m.level,
                    mainSkillLevel: m.mainSkillLevel,
                    subSkillLevel: m.subSkillLevel,
                    unitId: `ally-${idx}-${m.mercCode}`,
                })
            );

            const createdExpeditionId = await runSerializedTransaction(async () => {
                const dishDeductSql =
                    dishQuality === 'special'
                        ? `UPDATE azit_dish_inventory
                           SET special_qty = special_qty - 1,
                               updated_at = CURRENT_TIMESTAMP
                           WHERE user_id = $1 AND recipe_id = $2 AND special_qty >= 1 AND is_deleted = 0`
                        : `UPDATE azit_dish_inventory
                           SET qty = qty - 1,
                               updated_at = CURRENT_TIMESTAMP
                           WHERE user_id = $1 AND recipe_id = $2 AND qty >= 1 AND is_deleted = 0`;

                const dishDeduct = await pool.query(dishDeductSql, [userId, recipe.recipeId]);
                if (dishDeduct.rowCount === 0) {
                    throw new AzitGameError(
                        `보유 중인 [${dishLabelPrefix}${recipe.emoji} ${recipe.name}] 도시락이 없습니다. 주방에서 먼저 조리해 주세요!`,
                        400
                    );
                }

                if (resolvedElixirId) {
                    const elixirDeduct = await pool.query(
                        `UPDATE azit_item_inventory
                         SET qty = qty - 1,
                             updated_at = CURRENT_TIMESTAMP
                         WHERE user_id = $1 AND item_id = $2 AND qty >= 1 AND is_deleted = 0`,
                        [userId, resolvedElixirId]
                    );
                    if (elixirDeduct.rowCount === 0) {
                        throw new AzitGameError('보유 중인 투지의 비약이 부족합니다.', 400, 'INSUFFICIENT_ITEM');
                    }
                }

                await this.deductVeraPoints({
                    userId,
                    amount: zone.entryCost,
                    txType: 'expedition_entry',
                    refId: zone.zoneId,
                    description: `${zone.emoji} ${zone.name} 출정비`,
                });

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
                }

                const expInsertRes = await pool.query(
                    `INSERT INTO azit_expeditions (
                        user_id, zone_id, group_id, group_name, duration_sec, battle_seed,
                        party_merc_codes_json, party_snapshot_json, dish_recipe_id, dish_quality,
                        elixir_item_id, entry_cost, predicted_win_rate, status, started_at_ms, ends_at_ms
                     )
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'running', $14, $15)`,
                    [
                        userId,
                        zone.zoneId,
                        resolvedGroupId,
                        resolvedGroupName,
                        effectiveDurationSec,
                        battleSeed,
                        JSON.stringify(uniqueParty),
                        JSON.stringify(partySnapshot),
                        recipe.recipeId,
                        dishQuality,
                        resolvedElixirId,
                        zone.entryCost,
                        winRatePct,
                        nowMs,
                        endsAtMs,
                    ]
                );
                return Number(expInsertRes.lastInsertRowid ?? 0);
            });

            if (createdExpeditionId > 0) {
                await this.scheduleAzitNotification({
                    userId,
                    category: 'azit.camp',
                    dedupeKey: `azit:expedition:${createdExpeditionId}`,
                    title: '⚔️ [아지트 용병 캠프] 용병 원정이 끝났어요!',
                    body: `[${zone.emoji} ${zone.name}] 전투가 완료되었습니다. 원정 보상을 확인해 보세요!`,
                    url: '/mypage?section=dashboard&zone=camp',
                    tag: 'azit-camp',
                    scheduledAtMs: endsAtMs,
                    data: { zone: 'camp', expeditionId: createdExpeditionId, zoneId: zone.zoneId },
                });
            }

            const state = await this.getStateInternal(userId, { skipFarmerAutomation: true });
            const speedNote =
                buffs.expeditionSpeedBonusPct > 0 ? ` · 시간 -${buffs.expeditionSpeedBonusPct}%` : '';
            return {
                message: `⚔️ [${zone.emoji} ${zone.name}] 원정 출정 완료! (예상 승률 ${winRatePct}% · ${dishLabelPrefix}${recipe.name}${speedNote})`,
                state,
            };
        });
    }

    static async claimExpedition(userId: number, expeditionId: number) {
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            await this.processFarmerAutomationInternal(userId, Date.now());
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
            const effectiveNowMs = nowMs + 1500;
            if (Number(expRow.ends_at_ms) > effectiveNowMs) {
                const remainSec = Math.ceil((Number(expRow.ends_at_ms) - nowMs) / 1000);
                throw new AzitGameError(`용병단이 아직 복귀 중입니다. (${remainSec}초 남음)`, 400);
            }

            // 1단계 원자적 잠금: 동시 중복 정산 원천 차단
            const lockClaim = await pool.query(
                `UPDATE azit_expeditions
                 SET status = 'claiming'
                 WHERE id = $1 AND user_id = $2 AND status = 'running' AND ends_at_ms <= $3 AND is_deleted = 0`,
                [expeditionId, userId, effectiveNowMs]
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

                const dishQuality: AzitDishQuality =
                    expRow.dish_quality === 'special' ? 'special' : 'normal';
                const dishBuffs = getDishEffectiveBuffs(recipe, dishQuality);
                const winRate = Number(expRow.predicted_win_rate ?? 50);

                let allies: CombatUnitInput[] = [];
                try {
                    if (expRow.party_snapshot_json) {
                        const parsed = JSON.parse(String(expRow.party_snapshot_json));
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            allies = parsed as CombatUnitInput[];
                        }
                    }
                } catch (_) {
                    allies = [];
                }

                if (allies.length === 0) {
                    const mercRes = await pool.query(
                        `SELECT merc_code, level, main_skill_level, sub_skill_level
                         FROM azit_mercenaries
                         WHERE user_id = $1 AND is_deleted = 0`,
                        [userId]
                    );
                    allies = partyCodes.map((code, idx) => {
                        const row = mercRes.rows.find((r) => r.merc_code === code);
                        return buildMercCombatUnit({
                            mercCode: code,
                            level: Number(row?.level ?? 1),
                            mainSkillLevel: Number(row?.main_skill_level ?? 1),
                            subSkillLevel: Number(row?.sub_skill_level ?? 1),
                            unitId: `ally-${idx}-${code}`,
                        });
                    });
                }

                const enemies = buildZoneEnemyUnits(zone);
                const seed =
                    Number(expRow.battle_seed) > 0
                        ? Number(expRow.battle_seed)
                        : crypto.randomInt(1, 2_147_483_647);
                const elixirBoostPct = expRow.elixir_item_id === 'item-battle-elixir' ? 12 : 0;

                const simResult = runCombatSimulation({
                    mode: 'expedition',
                    seed,
                    allies,
                    enemies,
                    dishBuffs,
                    elixirBoostPct,
                    deathRiskPct: zone.deathRiskPct,
                    recordFrames: true,
                    frameIntervalTicks: 2,
                });

                const won = simResult.won;
                const casualties: AzitMercCode[] = simResult.casualties.filter(
                    (c): c is AzitMercCode => Boolean(getMercDef(c))
                );
                const casualtySet = new Set<string>(casualties);

                const baseMercXp = won ? zone.rewardMercXp : zone.lossMercXp;
                const rewardMercXp = Math.round(baseMercXp * (1 + dishBuffs.mercXpBonusPct / 100));

                let rewardPoints = 0;
                let rewardAzitXp = 0;
                const rewardMaterials: Partial<Record<AzitMaterialId, number>> = {};
                const rewardCrops: Partial<Record<AzitCropId, number>> = {};
                const rewardItems: Partial<Record<AzitItemId, number>> = {};

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
                    rewardPoints = Math.round(
                        zone.rewardPoints * (1 + (bossBonusPct + dishBuffs.rewardBonusPct) / 100)
                    );
                    rewardAzitXp = zone.rewardAzitXp;

                    const primaryQty =
                        zone.dropMinQty === zone.dropMaxQty
                            ? zone.dropMinQty
                            : crypto.randomInt(zone.dropMinQty, zone.dropMaxQty + 1);
                    rewardMaterials[zone.dropMaterialId] = primaryQty;

                    if (
                        zone.bonusMaterialId &&
                        zone.bonusMaterialMinQty !== undefined &&
                        zone.bonusMaterialMaxQty !== undefined
                    ) {
                        const bonusQty =
                            zone.bonusMaterialMinQty === zone.bonusMaterialMaxQty
                                ? zone.bonusMaterialMinQty
                                : crypto.randomInt(zone.bonusMaterialMinQty, zone.bonusMaterialMaxQty + 1);
                        if (bonusQty > 0) {
                            rewardMaterials[zone.bonusMaterialId] =
                                (rewardMaterials[zone.bonusMaterialId] ?? 0) + bonusQty;
                        }
                    }

                    if (zone.cropDropPool.length > 0) {
                        const cropPick = zone.cropDropPool[crypto.randomInt(0, zone.cropDropPool.length)];
                        const cropQty = zone.isBoss ? 2 : 1;
                        rewardCrops[cropPick] = cropQty;
                    }

                    for (const drop of zone.itemDrops) {
                        if (crypto.randomInt(1, 101) <= drop.chancePct) {
                            const itemQty =
                                drop.minQty === drop.maxQty
                                    ? drop.minQty
                                    : crypto.randomInt(drop.minQty, drop.maxQty + 1);
                            if (itemQty > 0) {
                                rewardItems[drop.itemId] = (rewardItems[drop.itemId] ?? 0) + itemQty;
                            }
                        }
                    }
                }

                const battleLog = simResult.battleLog;
                const finalStatus = won ? 'won' : 'lost';
                const replayPayload = {
                    seed: simResult.seed,
                    durationMs: simResult.durationMs,
                    mvpMercCode: simResult.mvpMercCode,
                    frames: simResult.frames,
                };

                await runSerializedTransaction(async () => {
                    if (won) {
                        await this.creditVeraPoints({
                            userId,
                            amount: rewardPoints,
                            txType: 'expedition_reward',
                            refId: String(expeditionId),
                            description: `${zone.emoji} ${zone.name} 토벌 승리 보상`,
                        });

                        for (const [matId, qty] of Object.entries(rewardMaterials)) {
                            if (qty && qty > 0) {
                                await this.creditMaterialInventory(userId, matId, qty);
                            }
                        }
                        for (const [cropId, qty] of Object.entries(rewardCrops)) {
                            if (qty && qty > 0) {
                                await this.creditCropInventory(userId, cropId, qty);
                            }
                        }
                        for (const [itemId, qty] of Object.entries(rewardItems)) {
                            if (qty && qty > 0) {
                                await this.creditItemInventory(userId, itemId, qty);
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
                        await pool.query(
                            `UPDATE azit_profiles
                             SET total_expeditions_lost = total_expeditions_lost + 1,
                                 updated_at = CURRENT_TIMESTAMP
                             WHERE user_id = $1`,
                            [userId]
                        );
                    }

                    // 용병 상태 & 전투 경험치 반영 (생존자만 경험치 획득, 전사자는 dead 전환)
                    for (const code of partyCodes) {
                        const mDef = getMercDef(code);
                        if (!mDef) continue;
                        if (casualtySet.has(code)) {
                            await pool.query(
                                `UPDATE azit_mercenaries
                                 SET status = 'dead',
                                     died_at = CURRENT_TIMESTAMP,
                                     death_zone_id = $1,
                                     updated_at = CURRENT_TIMESTAMP
                                 WHERE user_id = $2 AND merc_code = $3`,
                                [zone.zoneId, userId, code]
                            );
                        } else {
                            const mRes = await pool.query(
                                `SELECT level, xp FROM azit_mercenaries WHERE user_id = $1 AND merc_code = $2`,
                                [userId, code]
                            );
                            const curLv = Number(mRes.rows[0]?.level ?? 1);
                            const curXp = Number(mRes.rows[0]?.xp ?? 0);
                            const xpOut = applyMercenaryCombatXp(curLv, curXp, rewardMercXp, mDef.maxLevel);
                            await pool.query(
                                `UPDATE azit_mercenaries
                                 SET level = $1,
                                     xp = $2,
                                     status = 'idle',
                                     died_at = NULL,
                                     death_zone_id = NULL,
                                     updated_at = CURRENT_TIMESTAMP
                                 WHERE user_id = $3 AND merc_code = $4`,
                                [xpOut.level, xpOut.xp, userId, code]
                            );
                        }
                    }

                    await pool.query(
                        `UPDATE azit_expeditions
                         SET status = $1,
                             claimed_at = CURRENT_TIMESTAMP,
                             reward_points = $2,
                             reward_xp = $3,
                             reward_merc_xp = $4,
                             reward_materials_json = $5,
                             reward_items_json = $6,
                             reward_crops_json = $7,
                             dead_merc_codes_json = $8,
                             battle_log_json = $9,
                             battle_replay_json = $10
                         WHERE id = $11 AND user_id = $12`,
                        [
                            finalStatus,
                            rewardPoints,
                            rewardAzitXp,
                            rewardMercXp,
                            JSON.stringify(rewardMaterials),
                            JSON.stringify(rewardItems),
                            JSON.stringify(rewardCrops),
                            JSON.stringify(casualties),
                            JSON.stringify(battleLog),
                            JSON.stringify(replayPayload),
                            expeditionId,
                            userId,
                        ]
                    );
                });

                await this.cancelAzitNotification(userId, `azit:expedition:${expeditionId}`);

                const state = await this.getStateInternal(userId, { skipFarmerAutomation: true });
                return {
                    message: won
                        ? `🏆 [${zone.emoji} ${zone.name}] 토벌 승리! (+${rewardPoints.toLocaleString()}P)`
                        : `💔 [${zone.emoji} ${zone.name}] 토벌 실패... 생존 용병은 전투 EXP +${rewardMercXp}를 얻었습니다.`,
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
                        rewardMercXp,
                        dishQuality,
                        appliedBuffs: dishBuffs,
                        rewardMaterials,
                        entryCostLost: Number(expRow.entry_cost ?? zone.entryCost),
                        lostDishId: recipe.recipeId,
                        battleLog,
                        casualties,
                        rewardItems,
                        rewardCrops,
                        mvpMercCode: simResult.mvpMercCode as AzitMercCode | null,
                        battleFrames: simResult.frames,
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
        });
    }

    static async reviveMercenary(userId: number, mercCode: string, itemId: string) {
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            await this.processFarmerAutomationInternal(userId, Date.now());

            const mDef = getMercDef(mercCode);
            if (!mDef) {
                throw new AzitGameError('존재하지 않는 용병입니다.', 400);
            }
            const itemDef = getItemDef(itemId);
            if (!itemDef || itemDef.category !== 'revival') {
                throw new AzitGameError(
                    '부활 전용 아이템(생명의 약초/불사조의 깃털)만 사용할 수 있습니다. (골드 부활 불가)',
                    400,
                    'INVALID_REVIVAL_ITEM'
                );
            }

            const mercRes = await pool.query(
                `SELECT level, xp, status FROM azit_mercenaries
                 WHERE user_id = $1 AND merc_code = $2 AND is_deleted = 0`,
                [userId, mDef.mercCode]
            );
            if (mercRes.rows.length === 0) {
                throw new AzitGameError('영입하지 않은 용병입니다.', 404);
            }
            const mercRow = mercRes.rows[0];
            if (mercRow.status !== 'dead') {
                throw new AzitGameError(
                    `[${mDef.name}] 용병은 사망 상태가 아닙니다.`,
                    400,
                    'MERCENARY_NOT_DEAD'
                );
            }

            const bonusXp = itemDef.bonusMercXp ?? 0;
            const xpOut = applyMercenaryCombatXp(
                Number(mercRow.level ?? 1),
                Number(mercRow.xp ?? 0),
                bonusXp,
                mDef.maxLevel
            );

            await runSerializedTransaction(async () => {
                const deductRes = await pool.query(
                    `UPDATE azit_item_inventory
                     SET qty = qty - 1,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE user_id = $1 AND item_id = $2 AND qty >= 1 AND is_deleted = 0`,
                    [userId, itemDef.itemId]
                );
                if (deductRes.rowCount === 0) {
                    throw new AzitGameError(
                        `보유 중인 [${itemDef.emoji} ${itemDef.name}] 아이템이 부족합니다. 상점이나 연금술 제작을 이용해 주세요.`,
                        400,
                        'INSUFFICIENT_ITEM'
                    );
                }

                const reviveRes = await pool.query(
                    `UPDATE azit_mercenaries
                     SET status = 'idle',
                         died_at = NULL,
                         death_zone_id = NULL,
                         level = $1,
                         xp = $2,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE user_id = $3 AND merc_code = $4 AND status = 'dead' AND is_deleted = 0`,
                    [xpOut.level, xpOut.xp, userId, mDef.mercCode]
                );
                if (reviveRes.rowCount === 0) {
                    throw new AzitGameError('용병 부활 상태 처리에 실패했습니다.', 409);
                }
            });

            const state = await this.getStateInternal(userId, { skipFarmerAutomation: true });
            const bonusText = bonusXp > 0 ? ` (보너스 전투 EXP +${bonusXp})` : '';
            return {
                message: `✨ [${itemDef.emoji} ${itemDef.name}] 사용! [${mDef.emoji} ${mDef.name}] 용병이 부활했습니다!${bonusText}`,
                mercCode: mDef.mercCode,
                itemId: itemDef.itemId,
                bonusXpApplied: bonusXp,
                state,
            };
        });
    }

    static async upgradeMercSkill(userId: number, mercCode: string, skillSlot: 'main' | 'sub') {
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            await this.processFarmerAutomationInternal(userId, Date.now());

            const mDef = getMercDef(mercCode);
            if (!mDef) {
                throw new AzitGameError('존재하지 않는 용병입니다.', 400);
            }
            if (skillSlot !== 'main' && skillSlot !== 'sub') {
                throw new AzitGameError('스킬 슬롯은 main 또는 sub만 지정할 수 있습니다.', 400);
            }

            const mercRes = await pool.query(
                `SELECT status, main_skill_level, sub_skill_level
                 FROM azit_mercenaries
                 WHERE user_id = $1 AND merc_code = $2 AND is_deleted = 0`,
                [userId, mDef.mercCode]
            );
            if (mercRes.rows.length === 0) {
                throw new AzitGameError('영입하지 않은 용병입니다.', 404);
            }
            const mercRow = mercRes.rows[0];
            if (mercRow.status !== 'idle') {
                throw new AzitGameError(
                    mercRow.status === 'dead'
                        ? '사망한 용병은 부활 후 스킬을 강화할 수 있습니다.'
                        : '원정 중인 용병은 귀환 후 스킬을 강화할 수 있습니다.',
                    400
                );
            }

            const currentSkillLv =
                skillSlot === 'main'
                    ? Number(mercRow.main_skill_level ?? 1)
                    : Number(mercRow.sub_skill_level ?? 1);
            if (currentSkillLv >= MAX_SKILL_LEVEL) {
                throw new AzitGameError(
                    `스킬이 이미 최고 레벨(Lv.${MAX_SKILL_LEVEL})에 도달했습니다.`,
                    400,
                    'MAX_SKILL_LEVEL'
                );
            }

            const requiredItemId: AzitItemId =
                skillSlot === 'main' ? 'item-skill-tome' : 'item-skill-stone';
            const itemDef = getItemDef(requiredItemId)!;
            const colName = skillSlot === 'main' ? 'main_skill_level' : 'sub_skill_level';

            await runSerializedTransaction(async () => {
                const deductRes = await pool.query(
                    `UPDATE azit_item_inventory
                     SET qty = qty - 1,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE user_id = $1 AND item_id = $2 AND qty >= 1 AND is_deleted = 0`,
                    [userId, requiredItemId]
                );
                if (deductRes.rowCount === 0) {
                    throw new AzitGameError(
                        `[${itemDef.emoji} ${itemDef.name}] 아이템이 부족합니다.`,
                        400,
                        'INSUFFICIENT_ITEM'
                    );
                }

                const updRes = await pool.query(
                    `UPDATE azit_mercenaries
                     SET ${colName} = ${colName} + 1,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE user_id = $1 AND merc_code = $2 AND status = 'idle' AND ${colName} = $3 AND ${colName} < $4 AND is_deleted = 0`,
                    [userId, mDef.mercCode, currentSkillLv, MAX_SKILL_LEVEL]
                );
                if (updRes.rowCount === 0) {
                    throw new AzitGameError('스킬 강화 상태가 변경되었습니다. 다시 시도해 주세요.', 409);
                }
            });

            const newLevel = currentSkillLv + 1;
            const skillName = skillSlot === 'main' ? mDef.mainSkill.name : mDef.subSkill.name;
            const state = await this.getStateInternal(userId, { skipFarmerAutomation: true });
            return {
                message: `📘 [${mDef.name}]의 [${skillName}] 스킬이 Lv.${newLevel}(으)로 강화되었습니다!`,
                mercCode: mDef.mercCode,
                skillSlot,
                newLevel,
                state,
            };
        });
    }

    static async buyShopItem(userId: number, itemId: string, rawQty = 1) {
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            await this.processFarmerAutomationInternal(userId, Date.now());

            const itemDef = getItemDef(itemId);
            if (!itemDef) {
                throw new AzitGameError('존재하지 않는 아이템입니다.', 400);
            }
            if (itemDef.shopPrice === null || itemDef.shopPrice <= 0) {
                throw new AzitGameError(
                    `[${itemDef.name}] 아이템은 상점에서 직접 구매할 수 없습니다. 제작이나 원정/탑 보상으로 획득하세요.`,
                    400,
                    'ITEM_NOT_PURCHASABLE'
                );
            }

            const profileRes = await pool.query('SELECT azit_xp FROM azit_profiles WHERE user_id = $1', [userId]);
            const levelInfo = getAzitLevelInfo(Number(profileRes.rows[0]?.azit_xp ?? 0));
            if (levelInfo.level < itemDef.requiredAzitLevel) {
                throw new AzitGameError(
                    `[${itemDef.emoji} ${itemDef.name}] 아이템은 아지트 Lv.${itemDef.requiredAzitLevel}부터 구매할 수 있습니다.`,
                    400,
                    'AZIT_LEVEL_LOCKED'
                );
            }

            const qty = Math.max(1, Math.min(99, Math.floor(rawQty)));
            const totalCost = itemDef.shopPrice * qty;

            await runSerializedTransaction(async () => {
                await this.deductVeraPoints({
                    userId,
                    amount: totalCost,
                    txType: 'item_buy',
                    refId: itemDef.itemId,
                    description: `${itemDef.emoji} ${itemDef.name} ×${qty} 구매`,
                });
                await this.creditItemInventory(userId, itemDef.itemId, qty);
            });

            const state = await this.getStateInternal(userId, { skipFarmerAutomation: true });
            return {
                message: `🛒 [${itemDef.emoji} ${itemDef.name}] ×${qty}개를 ${totalCost.toLocaleString()}P에 구매했습니다!`,
                itemId: itemDef.itemId,
                qty,
                totalCost,
                state,
            };
        });
    }

    static async craftItem(userId: number, recipeId: string, rawQty = 1) {
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            await this.processFarmerAutomationInternal(userId, Date.now());

            const recipe = getCraftRecipeDef(recipeId);
            if (!recipe) {
                throw new AzitGameError('존재하지 않는 제작 레시피입니다.', 400);
            }

            const profileRes = await pool.query('SELECT azit_xp FROM azit_profiles WHERE user_id = $1', [userId]);
            const levelInfo = getAzitLevelInfo(Number(profileRes.rows[0]?.azit_xp ?? 0));
            if (levelInfo.level < recipe.requiredAzitLevel) {
                throw new AzitGameError(
                    `[${recipe.emoji} ${recipe.name}] 제작은 아지트 Lv.${recipe.requiredAzitLevel}부터 가능합니다.`,
                    400,
                    'AZIT_LEVEL_LOCKED'
                );
            }

            const qty = Math.max(1, Math.min(50, Math.floor(rawQty)));
            const craftedQty = recipe.resultQty * qty;

            await runSerializedTransaction(async () => {
                for (const ing of recipe.ingredients) {
                    const needed = ing.qty * qty;
                    if (ing.kind === 'crop') {
                        const res = await pool.query(
                            `UPDATE azit_crop_inventory
                             SET harvest_qty = harvest_qty - $1,
                                 updated_at = CURRENT_TIMESTAMP
                             WHERE user_id = $2 AND crop_id = $3 AND harvest_qty >= $4 AND is_deleted = 0`,
                            [needed, userId, ing.id, needed]
                        );
                        if (res.rowCount === 0) {
                            const cDef = getCropDef(ing.id);
                            throw new AzitGameError(
                                `수확한 [${cDef?.name || ing.id}] 작물이 ${needed}개 필요합니다.`,
                                400,
                                'INSUFFICIENT_INGREDIENT'
                            );
                        }
                    } else if (ing.kind === 'material') {
                        const res = await pool.query(
                            `UPDATE azit_material_inventory
                             SET qty = qty - $1,
                                 updated_at = CURRENT_TIMESTAMP
                             WHERE user_id = $2 AND material_id = $3 AND qty >= $4 AND is_deleted = 0`,
                            [needed, userId, ing.id, needed]
                        );
                        if (res.rowCount === 0) {
                            const mDef = getMaterialDef(ing.id);
                            throw new AzitGameError(
                                `몬스터 재료 [${mDef?.name || ing.id}]이(가) ${needed}개 필요합니다.`,
                                400,
                                'INSUFFICIENT_INGREDIENT'
                            );
                        }
                    } else {
                        const res = await pool.query(
                            `UPDATE azit_item_inventory
                             SET qty = qty - $1,
                                 updated_at = CURRENT_TIMESTAMP
                             WHERE user_id = $2 AND item_id = $3 AND qty >= $4 AND is_deleted = 0`,
                            [needed, userId, ing.id, needed]
                        );
                        if (res.rowCount === 0) {
                            const iDef = getItemDef(ing.id);
                            throw new AzitGameError(
                                `아이템 [${iDef?.name || ing.id}]이(가) ${needed}개 필요합니다.`,
                                400,
                                'INSUFFICIENT_INGREDIENT'
                            );
                        }
                    }
                }

                const totalPointsCost = recipe.pointsCost * qty;
                if (totalPointsCost > 0) {
                    await this.deductVeraPoints({
                        userId,
                        amount: totalPointsCost,
                        txType: 'item_craft',
                        refId: recipe.recipeId,
                        description: `${recipe.emoji} ${recipe.name} ×${qty} 제작`,
                    });
                }

                await this.creditItemInventory(userId, recipe.resultItemId, craftedQty);
            });

            const resultDef = getItemDef(recipe.resultItemId);
            const state = await this.getStateInternal(userId, { skipFarmerAutomation: true });
            return {
                message: `⚗️ [${resultDef?.emoji || recipe.emoji} ${resultDef?.name || recipe.name}] ×${craftedQty}개 제작 완료!`,
                recipeId: recipe.recipeId,
                resultItemId: recipe.resultItemId,
                qty: craftedQty,
                state,
            };
        });
    }

    static async getTowerFloors(userId: number, from = 1, to = MAX_TOWER_FLOOR) {
        if (
            !Number.isInteger(from) ||
            !Number.isInteger(to) ||
            from < 1 ||
            to > MAX_TOWER_FLOOR ||
            from > to
        ) {
            throw new AzitGameError(`유효한 탑 층수 범위(1~${MAX_TOWER_FLOOR})를 지정해 주세요.`, 400);
        }
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            const progressRes = await pool.query(
                `SELECT highest_cleared_floor, total_clears, total_attempts
                 FROM azit_tower_progress
                 WHERE user_id = $1 AND is_deleted = 0`,
                [userId]
            );
            const row = progressRes.rows[0];
            return {
                floors: getTowerFloorSummaries(from, to),
                themes: AZIT_TOWER_THEMES,
                progress: {
                    highestClearedFloor: Math.max(
                        0,
                        Math.min(MAX_TOWER_FLOOR, Number(row?.highest_cleared_floor ?? 0))
                    ),
                    maxFloor: MAX_TOWER_FLOOR,
                    totalClears: Math.max(0, Number(row?.total_clears ?? 0)),
                    totalAttempts: Math.max(0, Number(row?.total_attempts ?? 0)),
                },
                totalFloors: MAX_TOWER_FLOOR,
            };
        });
    }

    static async battleTowerFloor(params: {
        userId: number;
        floor: number;
        groupId?: number | null;
        partyMercCodes?: string[];
        elixirItemId?: string | null;
    }) {
        const { userId, floor } = params;
        return this.runWithUserLock(userId, async () => {
            await this.ensureUserInitialized(userId);
            await this.processFarmerAutomationInternal(userId, Date.now());

            if (!Number.isInteger(floor) || floor < 1 || floor > MAX_TOWER_FLOOR) {
                throw new AzitGameError(`베라의 탑은 1층~${MAX_TOWER_FLOOR}층까지만 도전할 수 있습니다.`, 400);
            }
            const floorDef = getTowerFloorDef(floor);
            if (!floorDef) {
                throw new AzitGameError('존재하지 않는 탑 층수입니다.', 400);
            }

            const progressRes = await pool.query(
                `SELECT highest_cleared_floor FROM azit_tower_progress WHERE user_id = $1 AND is_deleted = 0`,
                [userId]
            );
            const highestCleared = Math.max(
                0,
                Math.min(MAX_TOWER_FLOOR, Number(progressRes.rows[0]?.highest_cleared_floor ?? 0))
            );
            const maxUnlockedFloor = Math.min(MAX_TOWER_FLOOR, highestCleared + 1);
            if (floor > maxUnlockedFloor) {
                throw new AzitGameError(
                    `${floor}층은 아직 잠겨 있습니다. 먼저 ${maxUnlockedFloor}층을 공략해 주세요!`,
                    400,
                    'TOWER_FLOOR_LOCKED'
                );
            }

            let resolvedGroupId: number | null = null;
            let requestedPartyCodes = Array.isArray(params.partyMercCodes)
                ? params.partyMercCodes.map((c) => (typeof c === 'string' ? c.trim() : '')).filter(Boolean)
                : [];

            if (params.groupId !== undefined && params.groupId !== null) {
                if (!Number.isInteger(params.groupId) || params.groupId <= 0) {
                    throw new AzitGameError('올바른 용병 그룹 ID가 아닙니다.', 400);
                }
                const groupRes = await pool.query(
                    `SELECT id, merc_codes_json FROM azit_mercenary_groups
                     WHERE id = $1 AND user_id = $2 AND is_deleted = 0`,
                    [params.groupId, userId]
                );
                if (groupRes.rows.length === 0) {
                    throw new AzitGameError('선택한 용병 그룹을 찾을 수 없습니다.', 404);
                }
                resolvedGroupId = Number(groupRes.rows[0].id);
                let groupMercCodes: string[] = [];
                try {
                    const parsed = JSON.parse(String(groupRes.rows[0].merc_codes_json || '[]'));
                    if (Array.isArray(parsed)) {
                        groupMercCodes = parsed
                            .map((c) => (typeof c === 'string' ? c.trim() : ''))
                            .filter(Boolean);
                    }
                } catch (_) {
                    groupMercCodes = [];
                }
                if (requestedPartyCodes.length === 0) {
                    requestedPartyCodes = groupMercCodes;
                } else {
                    const reqSet = new Set(requestedPartyCodes);
                    const grpSet = new Set(groupMercCodes);
                    const matchesGroup =
                        reqSet.size === grpSet.size &&
                        Array.from(reqSet).every((code) => grpSet.has(code));
                    if (!matchesGroup) {
                        throw new AzitGameError(
                            '선택한 용병 그룹의 편성 인원과 출전 용병 목록이 일치하지 않습니다.',
                            400,
                            'GROUP_PARTY_MISMATCH'
                        );
                    }
                }
            }

            const uniqueParty = Array.from(new Set(requestedPartyCodes));
            if (uniqueParty.length === 0) {
                throw new AzitGameError('베라의 탑에 출전할 용병을 최소 1명 선택해 주세요.', 400);
            }

            const profileRes = await pool.query('SELECT azit_xp FROM azit_profiles WHERE user_id = $1', [userId]);
            const levelInfo = getAzitLevelInfo(Number(profileRes.rows[0]?.azit_xp ?? 0));
            if (uniqueParty.length > levelInfo.maxPartySize) {
                throw new AzitGameError(
                    `현재 아지트 레벨(Lv.${levelInfo.level})에서는 최대 ${levelInfo.maxPartySize}명까지 파티를 편성할 수 있습니다.`,
                    400
                );
            }

            const mercRowsRes = await pool.query(
                `SELECT merc_code, level, xp, main_skill_level, sub_skill_level, status
                 FROM azit_mercenaries
                 WHERE user_id = $1 AND is_deleted = 0`,
                [userId]
            );
            const partyMercDetails: Array<{
                mercCode: AzitMercCode;
                level: number;
                xp: number;
                mainSkillLevel: number;
                subSkillLevel: number;
                maxLevel: number;
            }> = [];
            for (const code of uniqueParty) {
                const row = mercRowsRes.rows.find((r) => r.merc_code === code);
                const mDef = getMercDef(code);
                if (!row || !mDef) {
                    throw new AzitGameError('영입되지 않은 용병이 포함되어 있습니다.', 400);
                }
                if (row.status === 'dead') {
                    throw new AzitGameError(
                        `[${mDef.name}] 용병은 사망 상태입니다. 부활 아이템으로 먼저 소생시켜 주세요.`,
                        400,
                        'MERCENARY_DEAD'
                    );
                }
                if (row.status !== 'idle') {
                    throw new AzitGameError(`[${mDef.name}] 용병은 현재 원정에 출정 중입니다.`, 400);
                }
                partyMercDetails.push({
                    mercCode: mDef.mercCode,
                    level: Number(row.level ?? 1),
                    xp: Number(row.xp ?? 0),
                    mainSkillLevel: Math.max(1, Math.min(MAX_SKILL_LEVEL, Number(row.main_skill_level ?? 1))),
                    subSkillLevel: Math.max(1, Math.min(MAX_SKILL_LEVEL, Number(row.sub_skill_level ?? 1))),
                    maxLevel: mDef.maxLevel,
                });
            }

            let resolvedElixirId: AzitItemId | null = null;
            if (params.elixirItemId !== undefined && params.elixirItemId !== null && params.elixirItemId.trim() !== '') {
                const elixirDef = getItemDef(params.elixirItemId.trim());
                if (!elixirDef || elixirDef.category !== 'consumable') {
                    throw new AzitGameError('베라의 탑에서 사용할 수 없는 비약 아이템입니다.', 400);
                }
                const elixirCheck = await pool.query(
                    `SELECT qty FROM azit_item_inventory
                     WHERE user_id = $1 AND item_id = $2 AND is_deleted = 0`,
                    [userId, elixirDef.itemId]
                );
                if (Number(elixirCheck.rows[0]?.qty ?? 0) < 1) {
                    throw new AzitGameError('보유 중인 투지의 비약이 부족합니다.', 400, 'INSUFFICIENT_ITEM');
                }
                resolvedElixirId = elixirDef.itemId;
            }

            const allies = partyMercDetails.map((m, idx) =>
                buildMercCombatUnit({
                    mercCode: m.mercCode,
                    level: m.level,
                    mainSkillLevel: m.mainSkillLevel,
                    subSkillLevel: m.subSkillLevel,
                    unitId: `ally-${idx}-${m.mercCode}`,
                })
            );
            const enemies = buildTowerEnemyUnits(floorDef);
            const seed = crypto.randomInt(1, 2_147_483_647);
            const elixirBoostPct = resolvedElixirId === 'item-battle-elixir' ? 12 : 0;

            const simResult = runCombatSimulation({
                mode: 'tower',
                seed,
                allies,
                enemies,
                elixirBoostPct,
                recordFrames: true,
                frameIntervalTicks: 1,
            });

            const won = simResult.won;
            const isFirstClear = won && floor > highestCleared;
            const rewards: AzitTowerRewardBundle = won
                ? isFirstClear
                    ? floorDef.firstClearReward
                    : floorDef.repeatReward
                : {
                      veraPoints: 0,
                      mercXp: 0,
                      azitXp: 0,
                      materials: {},
                      crops: {},
                      items: {},
                  };

            await runSerializedTransaction(async () => {
                if (resolvedElixirId) {
                    const elixirDeduct = await pool.query(
                        `UPDATE azit_item_inventory
                         SET qty = qty - 1,
                             updated_at = CURRENT_TIMESTAMP
                         WHERE user_id = $1 AND item_id = $2 AND qty >= 1 AND is_deleted = 0`,
                        [userId, resolvedElixirId]
                    );
                    if (elixirDeduct.rowCount === 0) {
                        throw new AzitGameError('보유 중인 투지의 비약이 부족합니다.', 400, 'INSUFFICIENT_ITEM');
                    }
                }

                if (won) {
                    if (rewards.veraPoints > 0) {
                        await this.creditVeraPoints({
                            userId,
                            amount: rewards.veraPoints,
                            txType: isFirstClear ? 'tower_first_clear' : 'tower_repeat_clear',
                            refId: String(floor),
                            description: `🏰 베라의 탑 ${floor}층 ${isFirstClear ? '최초 클리어' : '반복 토벌'} 보상`,
                        });
                    }
                    if (rewards.azitXp > 0) {
                        await this.addAzitXp(userId, rewards.azitXp);
                    }
                    for (const [matId, qty] of Object.entries(rewards.materials)) {
                        if (qty && qty > 0) {
                            await this.creditMaterialInventory(userId, matId, qty);
                        }
                    }
                    for (const [cropId, qty] of Object.entries(rewards.crops)) {
                        if (qty && qty > 0) {
                            await this.creditCropInventory(userId, cropId, qty);
                        }
                    }
                    for (const [itemId, qty] of Object.entries(rewards.items)) {
                        if (qty && qty > 0) {
                            await this.creditItemInventory(userId, itemId, qty);
                        }
                    }

                    for (const m of partyMercDetails) {
                        const xpOut = applyMercenaryCombatXp(m.level, m.xp, rewards.mercXp, m.maxLevel);
                        await pool.query(
                            `UPDATE azit_mercenaries
                             SET level = $1,
                                 xp = $2,
                                 status = 'idle',
                                 updated_at = CURRENT_TIMESTAMP
                             WHERE user_id = $3 AND merc_code = $4 AND is_deleted = 0`,
                            [xpOut.level, xpOut.xp, userId, m.mercCode]
                        );
                    }

                    await pool.query(
                        `INSERT INTO azit_tower_progress (
                            user_id, highest_cleared_floor, total_clears, total_attempts, last_cleared_at
                         )
                         VALUES ($1, $2, 1, 1, CURRENT_TIMESTAMP)
                         ON CONFLICT (user_id) DO UPDATE SET
                            highest_cleared_floor = CASE
                                WHEN azit_tower_progress.highest_cleared_floor < $3 THEN $4
                                ELSE azit_tower_progress.highest_cleared_floor
                            END,
                            total_clears = azit_tower_progress.total_clears + 1,
                            total_attempts = azit_tower_progress.total_attempts + 1,
                            last_cleared_at = CURRENT_TIMESTAMP,
                            updated_at = CURRENT_TIMESTAMP`,
                        [userId, floor, floor, floor]
                    );
                } else {
                    // 패배 시 사망 패널티/아이템 손실 없음 — 용병 상태 완전 보존, 시도 횟수만 기록
                    await pool.query(
                        `INSERT INTO azit_tower_progress (
                            user_id, highest_cleared_floor, total_clears, total_attempts
                         )
                         VALUES ($1, 0, 0, 1)
                         ON CONFLICT (user_id) DO UPDATE SET
                            total_attempts = azit_tower_progress.total_attempts + 1,
                            updated_at = CURRENT_TIMESTAMP`,
                        [userId]
                    );
                }

                await pool.query(
                    `INSERT INTO azit_tower_runs (
                        user_id, group_id, floor, party_merc_codes_json, elixir_item_id,
                        won, is_first_clear, battle_seed, duration_ms,
                        reward_points, reward_azit_xp, reward_merc_xp,
                        reward_materials_json, reward_crops_json, reward_items_json,
                        battle_replay_json, battle_log_json
                     )
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
                    [
                        userId,
                        resolvedGroupId,
                        floor,
                        JSON.stringify(uniqueParty),
                        resolvedElixirId,
                        won ? 1 : 0,
                        isFirstClear ? 1 : 0,
                        simResult.seed,
                        simResult.durationMs,
                        rewards.veraPoints,
                        rewards.azitXp,
                        rewards.mercXp,
                        JSON.stringify(rewards.materials),
                        JSON.stringify(rewards.crops),
                        JSON.stringify(rewards.items),
                        JSON.stringify({
                            seed: simResult.seed,
                            durationMs: simResult.durationMs,
                            mvpMercCode: simResult.mvpMercCode,
                            frameCount: simResult.frames.length,
                        }),
                        JSON.stringify(simResult.battleLog),
                    ]
                );
            });

            const state = await this.getStateInternal(userId, { skipFarmerAutomation: true });
            return {
                message: won
                    ? `🏰 베라의 탑 ${floor}층 ${isFirstClear ? '최초 정복' : '클리어'}! (+${rewards.veraPoints.toLocaleString()}P · 용병 EXP +${rewards.mercXp})`
                    : `🛡️ 베라의 탑 ${floor}층 공략 실패 — 탑의 결계로 용병이 부상 없이 회복되었습니다!`,
                won,
                floor,
                isFirstClear,
                durationMs: simResult.durationMs,
                seed: simResult.seed,
                frames: simResult.frames as CombatFrame[],
                battleLog: simResult.battleLog,
                rewards,
                state,
            };
        });
    }

    private static async scheduleAzitNotification(params: {
        userId: number;
        category: 'azit.kitchen' | 'azit.garden' | 'azit.camp';
        dedupeKey: string;
        title: string;
        body: string;
        url: string;
        tag: string;
        scheduledAtMs: number;
        data?: Record<string, unknown>;
    }): Promise<void> {
        try {
            await NotificationService.scheduleNotification({
                userId: params.userId,
                category: params.category,
                sourceApp: 'azit-game',
                dedupeKey: params.dedupeKey,
                title: params.title,
                body: params.body,
                url: params.url,
                tag: params.tag,
                scheduledAtMs: params.scheduledAtMs,
                data: params.data,
            });
        } catch (err) {
            console.warn('[AzitNotificationHook] Failed to schedule notification:', err);
        }
    }

    private static async cancelAzitNotification(userId: number, dedupeKey: string): Promise<void> {
        try {
            await NotificationService.cancelScheduled({ userId, dedupeKey });
        } catch (err) {
            console.warn('[AzitNotificationHook] Failed to cancel notification:', err);
        }
    }
}
