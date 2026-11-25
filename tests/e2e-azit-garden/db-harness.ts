import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import type {
  BackdatePlotTimersOptions,
  DbHarnessLike,
  LegacyUserFixtureOptions,
  SeedPlotInput,
  SeedUserOptions,
  SeededUserResult,
} from './types.js';

const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = 'sha512';

function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function hashPasswordV2(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
    .toString('hex');
  return `v2:${salt}:${hash}`;
}

export class DbHarness implements DbHarnessLike {
  public readonly tempDir: string;
  public readonly dbPath: string;
  private initialized = false;

  constructor(prefix = 'e2e-azit-garden-') {
    this.tempDir = path.join(os.tmpdir(), `${prefix}${crypto.randomUUID()}`);
    this.dbPath = path.join(this.tempDir, 'test.db');
  }

  public initializeBaseline(): void {
    if (this.initialized) return;
    fs.mkdirSync(this.tempDir, { recursive: true });

    const db = new Database(this.dbPath);
    try {
      db.pragma('busy_timeout = 5000');
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT,
          password TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          name TEXT,
          phone TEXT,
          role TEXT DEFAULT 'user',
          status TEXT DEFAULT 'active',
          level INTEGER DEFAULT 1,
          last_login DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sessions (
          session_id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS login_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          ip_address TEXT,
          user_agent TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS news (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT,
          category TEXT,
          summary TEXT,
          source TEXT,
          link TEXT,
          published_at TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          ai_summary TEXT,
          sentiment TEXT,
          ai_processed INTEGER DEFAULT 0,
          vote_up INTEGER DEFAULT 0,
          vote_down INTEGER DEFAULT 0,
          view_count INTEGER DEFAULT 0,
          comment_count INTEGER DEFAULT 0,
          popularity_score INTEGER DEFAULT 0,
          thumbnail TEXT,
          tags TEXT,
          author TEXT,
          source_url TEXT,
          description TEXT
        );

        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL DEFAULT 'system',
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          target_user_id INTEGER,
          priority TEXT DEFAULT 'normal',
          is_read INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS mini_apps (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          icon_url TEXT DEFAULT '',
          description TEXT DEFAULT '',
          app_url TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          require_auth INTEGER DEFAULT 0,
          sort_order INTEGER DEFAULT 0,
          category TEXT DEFAULT 'utility',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      this.initialized = true;
    } finally {
      db.close();
    }
  }

  private withDb<T>(fn: (db: Database.Database) => T): T {
    if (!fs.existsSync(this.dbPath)) {
      throw new Error(`Temp SQLite DB does not exist at ${this.dbPath}`);
    }
    const db = new Database(this.dbPath);
    try {
      db.pragma('busy_timeout = 5000');
      return fn(db);
    } finally {
      db.close();
    }
  }

  private getTableColumns(db: Database.Database, tableName: string): Set<string> {
    const rows = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name?: string }>;
    return new Set(rows.map((r) => String(r.name ?? '')));
  }

  private ensureModernAzitTables(db: Database.Database): void {
    db.exec(`
      CREATE TABLE IF NOT EXISTS azit_profiles (
        user_id INTEGER PRIMARY KEY,
        azit_level INTEGER NOT NULL DEFAULT 1,
        azit_xp INTEGER NOT NULL DEFAULT 0,
        garden_migrated INTEGER NOT NULL DEFAULT 0,
        unlocked_plots INTEGER NOT NULL DEFAULT 6,
        fertilizer_qty INTEGER NOT NULL DEFAULT 0,
        total_crops_sold INTEGER NOT NULL DEFAULT 0,
        total_dishes_cooked INTEGER NOT NULL DEFAULT 0,
        total_expeditions_won INTEGER NOT NULL DEFAULT 0,
        total_expeditions_lost INTEGER NOT NULL DEFAULT 0,
        is_deleted INTEGER NOT NULL DEFAULT 0,
        deleted_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS azit_crop_inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        crop_id TEXT NOT NULL,
        seed_qty INTEGER NOT NULL DEFAULT 0,
        harvest_qty INTEGER NOT NULL DEFAULT 0,
        is_deleted INTEGER NOT NULL DEFAULT 0,
        deleted_at DATETIME,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, crop_id)
      );

      CREATE TABLE IF NOT EXISTS azit_garden_plots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        plot_index INTEGER NOT NULL,
        crop_id TEXT,
        stage INTEGER NOT NULL DEFAULT 0,
        water_count INTEGER NOT NULL DEFAULT 0,
        planted_at TEXT,
        last_watered_at TEXT,
        water_notified_at TEXT,
        is_unlocked INTEGER NOT NULL DEFAULT 1,
        soil_level INTEGER NOT NULL DEFAULT 0,
        next_water_at_ms INTEGER,
        fertilizer_used_count INTEGER NOT NULL DEFAULT 0,
        is_deleted INTEGER NOT NULL DEFAULT 0,
        deleted_at DATETIME,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, plot_index)
      );
    `);
  }

  private upsertPlotRow(db: Database.Database, userId: number, plot: SeedPlotInput): void {
    const cols = this.getTableColumns(db, 'azit_garden_plots');
    const hasExtended =
      cols.has('is_unlocked') &&
      cols.has('soil_level') &&
      cols.has('next_water_at_ms') &&
      cols.has('fertilizer_used_count');

    if (hasExtended) {
      db.prepare(
        `INSERT INTO azit_garden_plots (
           user_id, plot_index, crop_id, stage, water_count, planted_at, last_watered_at,
           is_unlocked, soil_level, next_water_at_ms, fertilizer_used_count, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id, plot_index) DO UPDATE SET
           crop_id = excluded.crop_id,
           stage = excluded.stage,
           water_count = excluded.water_count,
           planted_at = excluded.planted_at,
           last_watered_at = excluded.last_watered_at,
           is_unlocked = excluded.is_unlocked,
           soil_level = excluded.soil_level,
           next_water_at_ms = excluded.next_water_at_ms,
           fertilizer_used_count = excluded.fertilizer_used_count,
           updated_at = CURRENT_TIMESTAMP`
      ).run(
        userId,
        plot.plotIndex,
        plot.cropId ?? null,
        plot.stage ?? 0,
        plot.waterCount ?? 0,
        plot.plantedAt ?? null,
        plot.lastWateredAt ?? null,
        plot.isUnlocked ?? (plot.plotIndex < 6 ? 1 : 0),
        plot.soilLevel ?? 0,
        plot.nextWaterAtMs ?? null,
        plot.fertilizerUsedCount ?? 0
      );
    } else {
      db.prepare(
        `INSERT INTO azit_garden_plots (
           user_id, plot_index, crop_id, stage, water_count, planted_at, last_watered_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id, plot_index) DO UPDATE SET
           crop_id = excluded.crop_id,
           stage = excluded.stage,
           water_count = excluded.water_count,
           planted_at = excluded.planted_at,
           last_watered_at = excluded.last_watered_at,
           updated_at = CURRENT_TIMESTAMP`
      ).run(
        userId,
        plot.plotIndex,
        plot.cropId ?? null,
        plot.stage ?? 0,
        plot.waterCount ?? 0,
        plot.plantedAt ?? null,
        plot.lastWateredAt ?? null
      );
    }
  }

  public seedUser(opts: SeedUserOptions = {}): SeededUserResult {
    const suffix = crypto.randomUUID().slice(0, 8);
    const email = opts.email ?? `e2e_${suffix}@faithportal.local`;
    const password = opts.password ?? `Pass!${suffix}`;
    const name = opts.name ?? `E2EUser_${suffix}`;
    const passwordHash = hashPasswordV2(password);

    return this.withDb((db) => {
      const tx = db.transaction(() => {
        const insertUser = db
          .prepare(
            `INSERT INTO users (email, password, name, role, status, level)
             VALUES (?, ?, ?, 'user', 'active', 1)`
          )
          .run(email, passwordHash, name);
        const userId = Number(insertUser.lastInsertRowid);

        if (opts.points !== undefined) {
          db.prepare(
            `INSERT INTO user_points (user_id, points, pending_amount, attendance_points, activity_points, updated_at)
             VALUES (?, ?, 0, 0, 0, CURRENT_TIMESTAMP)
             ON CONFLICT(user_id) DO UPDATE SET
               points = excluded.points,
               updated_at = CURRENT_TIMESTAMP`
          ).run(userId, Math.floor(opts.points));
        }

        const needsAzitProfile =
          opts.azitLevel !== undefined ||
          opts.azitXp !== undefined ||
          opts.gardenMigrated !== undefined ||
          opts.unlockedPlots !== undefined ||
          opts.plots !== undefined ||
          opts.crops !== undefined;

        if (needsAzitProfile) {
          this.ensureModernAzitTables(db);
          const profileCols = this.getTableColumns(db, 'azit_profiles');
          const azitLevel = opts.azitLevel ?? 1;
          const azitXp = opts.azitXp ?? 0;
          const gardenMigrated = opts.gardenMigrated ?? 1;
          const unlockedPlots = opts.unlockedPlots ?? 6;

          if (profileCols.has('unlocked_plots')) {
            db.prepare(
              `INSERT INTO azit_profiles (user_id, azit_level, azit_xp, garden_migrated, unlocked_plots, updated_at)
               VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
               ON CONFLICT(user_id) DO UPDATE SET
                 azit_level = excluded.azit_level,
                 azit_xp = excluded.azit_xp,
                 garden_migrated = excluded.garden_migrated,
                 unlocked_plots = excluded.unlocked_plots,
                 updated_at = CURRENT_TIMESTAMP`
            ).run(userId, azitLevel, azitXp, gardenMigrated, unlockedPlots);
          } else {
            db.prepare(
              `INSERT INTO azit_profiles (user_id, azit_level, azit_xp, garden_migrated, updated_at)
               VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
               ON CONFLICT(user_id) DO UPDATE SET
                 azit_level = excluded.azit_level,
                 azit_xp = excluded.azit_xp,
                 garden_migrated = excluded.garden_migrated,
                 updated_at = CURRENT_TIMESTAMP`
            ).run(userId, azitLevel, azitXp, gardenMigrated);
          }

          if (opts.plots && opts.plots.length > 0) {
            for (const plot of opts.plots) {
              this.upsertPlotRow(db, userId, plot);
            }
          }

          if (opts.crops) {
            for (const [cropId, counts] of Object.entries(opts.crops)) {
              db.prepare(
                `INSERT INTO azit_crop_inventory (user_id, crop_id, seed_qty, harvest_qty, updated_at)
                 VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                 ON CONFLICT(user_id, crop_id) DO UPDATE SET
                   seed_qty = excluded.seed_qty,
                   harvest_qty = excluded.harvest_qty,
                   updated_at = CURRENT_TIMESTAMP`
              ).run(userId, cropId, counts.seedQty ?? 0, counts.harvestQty ?? 0);
            }
          }
        }

        return { userId, email, password, name };
      });

      return tx();
    });
  }

  public seedLegacyUserFixture(opts: LegacyUserFixtureOptions = {}): SeededUserResult {
    const suffix = crypto.randomUUID().slice(0, 8);
    const email = opts.email ?? `legacy_${suffix}@faithportal.local`;
    const password = opts.password ?? `Pass!${suffix}`;
    const name = opts.name ?? `LegacyUser_${suffix}`;
    const passwordHash = hashPasswordV2(password);

    return this.withDb((db) => {
      const tx = db.transaction(() => {
        const insertUser = db
          .prepare(
            `INSERT INTO users (email, password, name, role, status, level)
             VALUES (?, ?, ?, 'user', 'active', 1)`
          )
          .run(email, passwordHash, name);
        const userId = Number(insertUser.lastInsertRowid);

        if (opts.points !== undefined) {
          db.prepare(
            `INSERT INTO user_points (user_id, points, pending_amount, attendance_points, activity_points, updated_at)
             VALUES (?, ?, 0, 0, 0, CURRENT_TIMESTAMP)
             ON CONFLICT(user_id) DO UPDATE SET
               points = excluded.points,
               updated_at = CURRENT_TIMESTAMP`
          ).run(userId, Math.floor(opts.points));
        }

        if (opts.legacyMinihomeLayoutJson !== undefined) {
          const handle = opts.legacyMinihomeHandle ?? `legacy_${suffix}`;
          db.prepare(
            `INSERT INTO user_minihomes (user_id, handle, owner_name, layout_json)
             VALUES (?, ?, ?, ?)`
          ).run(userId, handle, name, JSON.stringify(opts.legacyMinihomeLayoutJson));
        }

        const shouldSeedPreM1Tables =
          opts.azitLevel !== undefined ||
          opts.azitXp !== undefined ||
          opts.gardenMigrated !== undefined ||
          opts.plots !== undefined ||
          opts.crops !== undefined;

        if (shouldSeedPreM1Tables) {
          // Create pre-M1 schema (WITHOUT unlocked_plots, fertilizer_qty, is_unlocked, soil_level, etc.)
          // if tables do not exist yet, so AzitGameService non-destructive ALTER migration can be verified.
          db.exec(`
            CREATE TABLE IF NOT EXISTS azit_profiles (
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
            );

            CREATE TABLE IF NOT EXISTS azit_crop_inventory (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              crop_id TEXT NOT NULL,
              seed_qty INTEGER NOT NULL DEFAULT 0,
              harvest_qty INTEGER NOT NULL DEFAULT 0,
              is_deleted INTEGER NOT NULL DEFAULT 0,
              deleted_at DATETIME,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(user_id, crop_id)
            );

            CREATE TABLE IF NOT EXISTS azit_garden_plots (
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
            );
          `);

          db.prepare(
            `INSERT INTO azit_profiles (user_id, azit_level, azit_xp, garden_migrated, updated_at)
             VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(user_id) DO UPDATE SET
               azit_level = excluded.azit_level,
               azit_xp = excluded.azit_xp,
               garden_migrated = excluded.garden_migrated,
               updated_at = CURRENT_TIMESTAMP`
          ).run(
            userId,
            opts.azitLevel ?? 10,
            opts.azitXp ?? 8000,
            opts.gardenMigrated ?? 1
          );

          if (opts.plots && opts.plots.length > 0) {
            for (const plot of opts.plots) {
              this.upsertPlotRow(db, userId, plot);
            }
          }

          if (opts.crops) {
            for (const [cropId, counts] of Object.entries(opts.crops)) {
              db.prepare(
                `INSERT INTO azit_crop_inventory (user_id, crop_id, seed_qty, harvest_qty, updated_at)
                 VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                 ON CONFLICT(user_id, crop_id) DO UPDATE SET
                   seed_qty = excluded.seed_qty,
                   harvest_qty = excluded.harvest_qty,
                   updated_at = CURRENT_TIMESTAMP`
              ).run(userId, cropId, counts.seedQty ?? 0, counts.harvestQty ?? 0);
            }
          }
        }

        return { userId, email, password, name };
      });

      return tx();
    });
  }

  public seedUserPoints(userId: number, points: number): void {
    this.withDb((db) => {
      db.prepare(
        `INSERT INTO user_points (user_id, points, pending_amount, attendance_points, activity_points, updated_at)
         VALUES (?, ?, 0, 0, 0, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id) DO UPDATE SET
           points = excluded.points,
           updated_at = CURRENT_TIMESTAMP`
      ).run(userId, Math.floor(points));
    });
  }

  public seedAzitProgress(
    userId: number,
    opts: { azitLevel?: number; azitXp?: number; gardenMigrated?: number; unlockedPlots?: number }
  ): void {
    this.withDb((db) => {
      this.ensureModernAzitTables(db);
      const cols = this.getTableColumns(db, 'azit_profiles');
      const existing = db
        .prepare('SELECT azit_level, azit_xp, garden_migrated FROM azit_profiles WHERE user_id = ?')
        .get(userId) as
        | { azit_level: number; azit_xp: number; garden_migrated: number }
        | undefined;

      const azitLevel = opts.azitLevel ?? existing?.azit_level ?? 1;
      const azitXp = opts.azitXp ?? existing?.azit_xp ?? 0;
      const gardenMigrated = opts.gardenMigrated ?? existing?.garden_migrated ?? 1;

      if (cols.has('unlocked_plots') && opts.unlockedPlots !== undefined) {
        db.prepare(
          `INSERT INTO azit_profiles (user_id, azit_level, azit_xp, garden_migrated, unlocked_plots, updated_at)
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(user_id) DO UPDATE SET
             azit_level = excluded.azit_level,
             azit_xp = excluded.azit_xp,
             garden_migrated = excluded.garden_migrated,
             unlocked_plots = excluded.unlocked_plots,
             updated_at = CURRENT_TIMESTAMP`
        ).run(userId, azitLevel, azitXp, gardenMigrated, opts.unlockedPlots);
      } else {
        db.prepare(
          `INSERT INTO azit_profiles (user_id, azit_level, azit_xp, garden_migrated, updated_at)
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(user_id) DO UPDATE SET
             azit_level = excluded.azit_level,
             azit_xp = excluded.azit_xp,
             garden_migrated = excluded.garden_migrated,
             updated_at = CURRENT_TIMESTAMP`
        ).run(userId, azitLevel, azitXp, gardenMigrated);
      }
    });
  }

  public seedCropInventory(
    userId: number,
    cropId: string,
    opts: { seedQty?: number; harvestQty?: number }
  ): void {
    this.withDb((db) => {
      this.ensureModernAzitTables(db);
      const existing = db
        .prepare('SELECT seed_qty, harvest_qty FROM azit_crop_inventory WHERE user_id = ? AND crop_id = ?')
        .get(userId, cropId) as { seed_qty: number; harvest_qty: number } | undefined;

      db.prepare(
        `INSERT INTO azit_crop_inventory (user_id, crop_id, seed_qty, harvest_qty, updated_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id, crop_id) DO UPDATE SET
           seed_qty = excluded.seed_qty,
           harvest_qty = excluded.harvest_qty,
           updated_at = CURRENT_TIMESTAMP`
      ).run(
        userId,
        cropId,
        opts.seedQty ?? existing?.seed_qty ?? 0,
        opts.harvestQty ?? existing?.harvest_qty ?? 0
      );
    });
  }

  public backdatePlotTimers(
    userId: number,
    plotIndex: number,
    opts: BackdatePlotTimersOptions
  ): void {
    this.withDb((db) => {
      const cols = this.getTableColumns(db, 'azit_garden_plots');
      const assignments: string[] = [];
      const values: unknown[] = [];

      if (opts.nextWaterAtMs !== undefined && cols.has('next_water_at_ms')) {
        assignments.push('next_water_at_ms = ?');
        values.push(opts.nextWaterAtMs);
      }
      if (opts.lastWateredAt !== undefined) {
        assignments.push('last_watered_at = ?');
        values.push(opts.lastWateredAt);
      }
      if (opts.plantedAt !== undefined) {
        assignments.push('planted_at = ?');
        values.push(opts.plantedAt);
      }

      if (assignments.length === 0) return;

      assignments.push('updated_at = CURRENT_TIMESTAMP');
      values.push(userId, plotIndex);

      const info = db
        .prepare(
          `UPDATE azit_garden_plots
           SET ${assignments.join(', ')}
           WHERE user_id = ? AND plot_index = ?`
        )
        .run(...values);

      if (info.changes === 0) {
        throw new Error(
          `backdatePlotTimers: no row updated for userId=${userId}, plotIndex=${plotIndex}`
        );
      }
    });
  }

  public backdateFarmerTick(
    userId: number,
    farmerCode: string,
    lastAutoTickMs: number
  ): void {
    this.withDb((db) => {
      const info = db
        .prepare(
          `UPDATE azit_farmers
           SET last_auto_tick_ms = ?, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = ? AND farmer_code = ? AND is_deleted = 0`
        )
        .run(lastAutoTickMs, userId, farmerCode);

      if (info.changes === 0) {
        throw new Error(
          `backdateFarmerTick: no active farmer updated for userId=${userId}, farmerCode=${farmerCode}`
        );
      }
    });
  }

  public queryOne<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T | undefined {
    return this.withDb((db) => {
      return db.prepare(sql).get(...params) as T | undefined;
    });
  }

  public queryAll<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] {
    return this.withDb((db) => {
      return db.prepare(sql).all(...params) as T[];
    });
  }

  public execute(
    sql: string,
    params: unknown[] = []
  ): { changes: number; lastInsertRowid: number | bigint } {
    return this.withDb((db) => {
      const info = db.prepare(sql).run(...params);
      return { changes: info.changes, lastInsertRowid: info.lastInsertRowid };
    });
  }

  public async cleanup(): Promise<void> {
    if (!fs.existsSync(this.tempDir)) return;

    const maxAttempts = 15;
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        fs.rmSync(this.tempDir, { recursive: true, force: true });
        return;
      } catch (err: unknown) {
        lastError = err;
        const code = (err as NodeJS.ErrnoException)?.code;
        if (code === 'EBUSY' || code === 'EPERM' || code === 'ENOTEMPTY') {
          await sleepMs(100);
          continue;
        }
        throw err;
      }
    }

    if (fs.existsSync(this.tempDir)) {
      throw lastError instanceof Error
        ? lastError
        : new Error(`Failed to remove tempDir ${this.tempDir}`);
    }
  }
}
