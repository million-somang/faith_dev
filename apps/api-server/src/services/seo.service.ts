import { pool } from '@faithportal/database';
import type {
    IndexNowLogRecord,
    IndexNowPreset,
    IndexNowSubmitResult,
    RecentNewsSitemapRow,
    SitemapIndexMeta,
    TravelRssItem,
    TravelSitemapRow,
} from '../types/seo.types.js';

const SITE_URL = 'https://veranex.app';
const TRAVEL_MIN_CONTENT_LEN = 800;
const TRAVEL_SITEMAP_CHUNK_SIZE = 5000;
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const INDEXNOW_DEBOUNCE_MS = 10 * 1000;

interface CacheEntry<T> {
    expiresAt: number;
    value: T;
}

function toIsoOrNull(raw: unknown): string | null {
    if (!raw) return null;
    const str = String(raw).trim();
    if (!str) return null;
    const normalized = str.includes('T') ? str : `${str.replace(' ', 'T')}Z`;
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
        const fallback = new Date(str);
        return Number.isNaN(fallback.getTime()) ? null : fallback.toISOString();
    }
    return parsed.toISOString();
}

export class SeoServiceError extends Error {
    readonly statusCode: number;

    constructor(message: string, statusCode = 400) {
        super(message);
        this.name = 'SeoServiceError';
        this.statusCode = statusCode;
    }
}

export class SeoService {
    private static ensureTablePromise: Promise<void> | null = null;
    private static cache = new Map<string, CacheEntry<unknown>>();
    private static queuedUrls = new Set<string>();
    private static debounceTimer: ReturnType<typeof setTimeout> | null = null;

    static async ensureTables(): Promise<void> {
        if (!this.ensureTablePromise) {
            this.ensureTablePromise = this.createTablesInternal().catch((err) => {
                this.ensureTablePromise = null;
                throw err;
            });
        }
        return this.ensureTablePromise;
    }

    private static async createTablesInternal(): Promise<void> {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS seo_indexnow_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                trigger_source TEXT NOT NULL,
                url_count INTEGER NOT NULL,
                sample_url TEXT,
                http_status INTEGER,
                response_snippet TEXT,
                is_deleted INTEGER NOT NULL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await pool
            .query(`CREATE INDEX IF NOT EXISTS idx_seo_indexnow_created ON seo_indexnow_logs(created_at DESC);`)
            .catch(() => {});
    }

    static getIndexNowKey(): string {
        return (process.env.INDEXNOW_KEY || '').trim();
    }

    static invalidateSitemapCache(): void {
        this.cache.clear();
    }

    private static getCached<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;
        if (entry.expiresAt <= Date.now()) {
            this.cache.delete(key);
            return null;
        }
        return entry.value as T;
    }

    private static setCached<T>(key: string, value: T, ttlMs: number): T {
        this.cache.set(key, { expiresAt: Date.now() + ttlMs, value });
        return value;
    }

    static async getSitemapIndexMeta(): Promise<SitemapIndexMeta> {
        const cacheKey = 'sitemap-index-meta';
        const cached = this.getCached<SitemapIndexMeta>(cacheKey);
        if (cached) return cached;

        const [travelRes, newsRes] = await Promise.all([
            pool.query(
                `SELECT COUNT(*) AS cnt, MAX(published_at) AS max_pub
                 FROM travel_articles
                 WHERE (hidden = 0 OR hidden IS NULL)
                   AND LENGTH(COALESCE(content, '')) >= $1`,
                [TRAVEL_MIN_CONTENT_LEN]
            ),
            pool.query(
                `SELECT COUNT(*) AS cnt, MAX(created_at) AS max_created
                 FROM news
                 WHERE (hidden = 0 OR hidden IS NULL)
                   AND created_at >= datetime('now', '-48 hours')`
            ),
        ]);

        const travelHighQualityCount = Number(travelRes.rows[0]?.cnt ?? 0);
        const travelPageCount = Math.ceil(travelHighQualityCount / TRAVEL_SITEMAP_CHUNK_SIZE);
        const recentNewsCount = Number(newsRes.rows[0]?.cnt ?? 0);

        const meta: SitemapIndexMeta = {
            siteUrl: SITE_URL,
            travelHighQualityCount,
            travelChunkSize: TRAVEL_SITEMAP_CHUNK_SIZE,
            travelPageCount,
            travelLastMod: toIsoOrNull(travelRes.rows[0]?.max_pub),
            recentNewsCount,
            recentNewsLastMod: toIsoOrNull(newsRes.rows[0]?.max_created),
        };

        return this.setCached(cacheKey, meta, 10 * 60 * 1000);
    }

    static async getTravelSitemapChunk(page: number, limit = TRAVEL_SITEMAP_CHUNK_SIZE): Promise<{
        page: number;
        limit: number;
        items: TravelSitemapRow[];
    }> {
        const safePage = Number.isInteger(page) && page >= 1 ? page : 1;
        const safeLimit = Math.max(1, Math.min(TRAVEL_SITEMAP_CHUNK_SIZE, Math.floor(limit)));
        const cacheKey = `travel-chunk:${safePage}:${safeLimit}`;
        const cached = this.getCached<{ page: number; limit: number; items: TravelSitemapRow[] }>(cacheKey);
        if (cached) return cached;

        const offset = (safePage - 1) * safeLimit;
        const res = await pool.query(
            `SELECT id, published_at, updated_at
             FROM travel_articles
             WHERE (hidden = 0 OR hidden IS NULL)
               AND LENGTH(COALESCE(content, '')) >= $1
             ORDER BY id DESC
             LIMIT $2 OFFSET $3`,
            [TRAVEL_MIN_CONTENT_LEN, safeLimit, offset]
        );

        const items: TravelSitemapRow[] = (
            res.rows as Array<{ id: number; published_at?: string | null; updated_at?: string | null }>
        ).map((row) => ({
            id: Number(row.id),
            publishedAt: toIsoOrNull(row.published_at),
            updatedAt: toIsoOrNull(row.updated_at),
        }));

        return this.setCached(cacheKey, { page: safePage, limit: safeLimit, items }, 30 * 60 * 1000);
    }

    static async getRecentNewsSitemap(limit = 1000): Promise<RecentNewsSitemapRow[]> {
        const safeLimit = Math.max(1, Math.min(1000, Math.floor(limit)));
        const cacheKey = `recent-news:${safeLimit}`;
        const cached = this.getCached<RecentNewsSitemapRow[]>(cacheKey);
        if (cached) return cached;

        const res = await pool.query(
            `SELECT id, title, published_at, created_at
             FROM news
             WHERE (hidden = 0 OR hidden IS NULL)
               AND created_at >= datetime('now', '-48 hours')
             ORDER BY id DESC
             LIMIT $1`,
            [safeLimit]
        );

        const items: RecentNewsSitemapRow[] = (
            res.rows as Array<{
                id: number;
                title?: string | null;
                published_at?: string | null;
                created_at?: string | null;
            }>
        ).map((row) => ({
            id: Number(row.id),
            title: String(row.title || '').trim(),
            publishedAt: toIsoOrNull(row.published_at) || toIsoOrNull(row.created_at),
            createdAt: toIsoOrNull(row.created_at),
        }));

        return this.setCached(cacheKey, items, 5 * 60 * 1000);
    }

    static async getTravelRssItems(limit = 100): Promise<TravelRssItem[]> {
        const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
        const cacheKey = `travel-rss:${safeLimit}`;
        const cached = this.getCached<TravelRssItem[]>(cacheKey);
        if (cached) return cached;

        const res = await pool.query(
            `SELECT id, title, destination, region, province, city, category, summary, ai_summary, author, published_at, created_at
             FROM travel_articles
             WHERE (hidden = 0 OR hidden IS NULL)
               AND LENGTH(COALESCE(content, '')) >= $1
             ORDER BY id DESC
             LIMIT $2`,
            [TRAVEL_MIN_CONTENT_LEN, safeLimit]
        );

        const items: TravelRssItem[] = (res.rows as Array<Record<string, unknown>>).map((row) => {
            const rawSummary = String(row.summary || row.ai_summary || '').trim();
            return {
                id: Number(row.id),
                title: String(row.title || '').trim(),
                destination: String(row.destination || '').trim(),
                region: String(row.region || 'korea').trim(),
                province: row.province ? String(row.province).trim() : null,
                city: row.city ? String(row.city).trim() : null,
                category: String(row.category || 'travel').trim(),
                summary: rawSummary.slice(0, 400),
                author: row.author ? String(row.author).trim() : null,
                publishedAt: toIsoOrNull(row.published_at),
                createdAt: toIsoOrNull(row.created_at),
            };
        });

        return this.setCached(cacheKey, items, 15 * 60 * 1000);
    }

    static normalizeSiteUrl(rawUrl: string): string | null {
        const trimmed = rawUrl.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
            return `${SITE_URL}${trimmed}`;
        }
        try {
            const parsed = new URL(trimmed);
            if (parsed.protocol === 'https:' && (parsed.hostname === 'veranex.app' || parsed.hostname === 'www.veranex.app')) {
                return `https://veranex.app${parsed.pathname}${parsed.search}`;
            }
        } catch {
            return null;
        }
        return null;
    }

    static queueIndexNowUrl(rawUrl: string): void {
        const normalized = this.normalizeSiteUrl(rawUrl);
        if (!normalized) return;
        this.queuedUrls.add(normalized);

        if (this.debounceTimer) return;
        this.debounceTimer = setTimeout(() => {
            this.debounceTimer = null;
            void this.flushQueuedIndexNow();
        }, INDEXNOW_DEBOUNCE_MS);
    }

    private static async flushQueuedIndexNow(): Promise<void> {
        if (this.queuedUrls.size === 0) return;
        const batch = Array.from(this.queuedUrls).slice(0, 10000);
        for (const u of batch) {
            this.queuedUrls.delete(u);
        }
        try {
            await this.submitIndexNowUrls(batch, 'auto-publish-debounce');
        } catch (err) {
            console.warn('[SeoService] Auto IndexNow flush warning:', err);
        }
        if (this.queuedUrls.size > 0 && !this.debounceTimer) {
            this.debounceTimer = setTimeout(() => {
                this.debounceTimer = null;
                void this.flushQueuedIndexNow();
            }, INDEXNOW_DEBOUNCE_MS);
        }
    }

    static async buildPresetUrls(preset: IndexNowPreset): Promise<string[]> {
        if (preset === 'core') {
            const staticCore = [
                `${SITE_URL}/`,
                `${SITE_URL}/guides`,
                `${SITE_URL}/lifestyle`,
                `${SITE_URL}/game`,
                `${SITE_URL}/entertainment/travel`,
                `${SITE_URL}/entertainment/saju`,
                `${SITE_URL}/entertainment/novel`,
                `${SITE_URL}/finance`,
                `${SITE_URL}/finance/util`,
                `${SITE_URL}/news`,
                `${SITE_URL}/lounge`,
                `${SITE_URL}/llms.txt`,
                `${SITE_URL}/llms-full.txt`,
            ];
            const topTravel = await this.getTravelSitemapChunk(1, 50);
            const travelUrls = topTravel.items.map((t) => `${SITE_URL}/entertainment/travel/${t.id}`);
            return [...staticCore, ...travelUrls];
        }

        if (preset === 'travel-top') {
            const chunk = await this.getTravelSitemapChunk(1, 500);
            return chunk.items.map((t) => `${SITE_URL}/entertainment/travel/${t.id}`);
        }

        const newsItems = await this.getRecentNewsSitemap(100);
        return newsItems.map((n) => `${SITE_URL}/news/${n.id}`);
    }

    static async submitIndexNowUrls(rawUrls: string[], triggerSource: string): Promise<IndexNowSubmitResult> {
        await this.ensureTables();

        const key = this.getIndexNowKey();
        const urlList = Array.from(
            new Set(rawUrls.map((u) => this.normalizeSiteUrl(u)).filter((u): u is string => Boolean(u)))
        ).slice(0, 10000);

        if (urlList.length === 0) {
            throw new SeoServiceError('제출할 유효한 veranex.app URL이 없습니다.', 400);
        }

        if (!key || key.length < 8) {
            await pool.query(
                `INSERT INTO seo_indexnow_logs (trigger_source, url_count, sample_url, http_status, response_snippet)
                 VALUES ($1, $2, $3, 0, 'SKIPPED: INDEXNOW_KEY missing')`,
                [triggerSource, urlList.length, urlList[0]]
            );
            return {
                submittedCount: 0,
                httpStatus: 0,
                ok: false,
                skipped: true,
                responseSnippet: 'INDEXNOW_KEY is not configured',
            };
        }

        const payload = {
            host: 'veranex.app',
            key,
            keyLocation: `${SITE_URL}/indexnow-key.txt`,
            urlList,
        };

        let httpStatus = 0;
        let responseSnippet = '';
        let ok = false;

        try {
            const res = await fetch(INDEXNOW_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                },
                body: JSON.stringify(payload),
            });
            httpStatus = res.status;
            ok = res.status >= 200 && res.status < 300;
            const rawText = await res.text().catch(() => '');
            responseSnippet = rawText.slice(0, 250) || res.statusText;
        } catch (err) {
            responseSnippet = (err instanceof Error ? err.message : String(err)).slice(0, 250);
        }

        await pool
            .query(
                `INSERT INTO seo_indexnow_logs (trigger_source, url_count, sample_url, http_status, response_snippet)
                 VALUES ($1, $2, $3, $4, $5)`,
                [triggerSource, urlList.length, urlList[0], httpStatus, responseSnippet]
            )
            .catch(() => {});

        return {
            submittedCount: ok ? urlList.length : 0,
            httpStatus,
            ok,
            skipped: false,
            responseSnippet,
        };
    }

    static async listIndexNowLogs(limit = 30): Promise<IndexNowLogRecord[]> {
        await this.ensureTables();
        const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
        const res = await pool.query(
            `SELECT id, trigger_source, url_count, sample_url, http_status, response_snippet, created_at
             FROM seo_indexnow_logs
             WHERE is_deleted = 0
             ORDER BY id DESC
             LIMIT $1`,
            [safeLimit]
        );
        return (res.rows as Array<Record<string, unknown>>).map((r) => ({
            id: Number(r.id),
            triggerSource: String(r.trigger_source || ''),
            urlCount: Number(r.url_count ?? 0),
            sampleUrl: r.sample_url ? String(r.sample_url) : null,
            httpStatus: r.http_status !== null && r.http_status !== undefined ? Number(r.http_status) : null,
            responseSnippet: r.response_snippet ? String(r.response_snippet) : null,
            createdAt: r.created_at ? String(r.created_at) : null,
        }));
    }
}
