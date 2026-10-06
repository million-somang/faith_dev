/**
 * travel-counter.service.ts
 * 여행 지도 전용 실시간 카운터 집계 및 캐싱 서비스
 */

import { pool, STANDARD_PROVINCES, parseKoreanLocation } from '@faithportal/database';

export interface TravelMapCountsResponse {
    success: boolean;
    total: number;
    provinces: Record<string, number>;
    cities: Record<string, Record<string, number>>;
}

// 10분 TTL 인메모리 캐시
let cachedMapCounts: TravelMapCountsResponse | null = null;
let mapCountsCacheTime = 0;
const MAP_COUNTS_CACHE_TTL = 10 * 60 * 1000; // 10분 (600,000ms)

/**
 * 인메모리 지도 카운트 캐시 무효화
 */
export function invalidateMapCountsCache(): void {
    cachedMapCounts = null;
    mapCountsCacheTime = 0;
}

/**
 * 전국 17개 표준 시도 및 시군구별 여행지 사전 집계 수량 반환
 * - 17개 표준 시도(PROVINCES)의 카운트 맵 (provinces[도명] = 개수)
 * - 시군구별 카운트 맵 (cities[도명][시군구명] = 개수)
 * - 전국 총합 total
 * - 10분 TTL 인메모리 캐시 적용
 */
export async function getTravelMapCounts(): Promise<TravelMapCountsResponse> {
    const now = Date.now();
    if (cachedMapCounts && (now - mapCountsCacheTime < MAP_COUNTS_CACHE_TTL)) {
        return cachedMapCounts;
    }

    const res = await pool.query(
        'SELECT province, city, spot_count FROM travel_map_counts ORDER BY province ASC, city ASC'
    );

    // 17개 표준 시도 초기화
    const provinces: Record<string, number> = {};
    const cities: Record<string, Record<string, number>> = {};

    for (const prov of STANDARD_PROVINCES) {
        provinces[prov] = 0;
        cities[prov] = {};
    }

    for (const row of res.rows) {
        const prov = row.province as string;
        const city = (row.city || '') as string;
        const count = Number(row.spot_count) || 0;

        // 해외, 기타 제외하고 표준 시도만 취합
        if (!(STANDARD_PROVINCES as readonly string[]).includes(prov)) {
            continue;
        }

        if (!city) {
            provinces[prov] = count;
        } else {
            if (!cities[prov]) {
                cities[prov] = {};
            }
            cities[prov][city] = count;
        }
    }

    const total = Object.values(provinces).reduce((acc, count) => acc + count, 0);

    const result: TravelMapCountsResponse = {
        success: true,
        total,
        provinces,
        cities
    };

    cachedMapCounts = result;
    mapCountsCacheTime = now;

    return result;
}

/**
 * travel_map_counts를 전체 재집계하여 100% 동기화하는 함수
 * - travel_articles의 행정구역 누락 기사 소급 파싱
 * - travel_map_counts 초기화 및 전체 재집계
 * - 인메모리 캐시 무효화
 */
export async function syncTravelMapCounts(): Promise<void> {
    // 1. 혹시라도 province가 비어있는 기사 소급 파싱
    const unparsed = await pool.query(
        "SELECT id, location_address, destination, region FROM travel_articles WHERE (province IS NULL OR province = '') AND (hidden IS NULL OR hidden = 0)"
    );
    for (const art of unparsed.rows) {
        const { province, city } = parseKoreanLocation(art.location_address, art.destination, art.region);
        await pool.query(
            "UPDATE travel_articles SET province = ?, city = ? WHERE id = ?",
            [province, city, art.id]
        );
    }

    // 2. travel_map_counts 테이블 초기화
    await pool.query('DELETE FROM travel_map_counts');

    // 3. 국내 기사 기준 도별(city='') 집계
    const provCountsRes = await pool.query(`
        SELECT province, count(*) as cnt 
        FROM travel_articles 
        WHERE (hidden IS NULL OR hidden = 0) AND province NOT IN ('해외', '기타', '') 
        GROUP BY province
    `);
    const provMap: Record<string, number> = {};
    for (const r of provCountsRes.rows) {
        provMap[r.province] = Number(r.cnt);
    }

    // 17개 표준 시도 전체 등록 (0건이어도 등록)
    for (const provName of STANDARD_PROVINCES) {
        const count = provMap[provName] || 0;
        await pool.query(
            `INSERT INTO travel_map_counts (province, city, spot_count, updated_at) 
             VALUES (?, '', ?, CURRENT_TIMESTAMP)`,
            [provName, count]
        );
    }

    // 4. 시·군·구별(city!='') 세부 집계
    const cityCountsRes = await pool.query(`
        SELECT province, city, count(*) as cnt 
        FROM travel_articles 
        WHERE (hidden IS NULL OR hidden = 0) AND province NOT IN ('해외', '기타', '') AND city != '' AND city IS NOT NULL
        GROUP BY province, city
    `);
    for (const r of cityCountsRes.rows) {
        await pool.query(
            `INSERT INTO travel_map_counts (province, city, spot_count, updated_at) 
             VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
            [r.province, r.city, Number(r.cnt)]
        );
    }

    // 5. 캐시 무효화
    invalidateMapCountsCache();
}

/**
 * 기사 추가(+1) / 삭제(-1) 시 해당 (province, '') 및 (province, city) 카운터를 원자적으로 증감 (UPSERT 지원)
 */
export async function adjustTravelCount(province: string, city: string, diff: number): Promise<void> {
    if (!province) return;
    if (!(STANDARD_PROVINCES as readonly string[]).includes(province)) return;

    const upsertSql = `
        INSERT INTO travel_map_counts (province, city, spot_count, updated_at)
        VALUES (?, ?, MAX(0, ?), CURRENT_TIMESTAMP)
        ON CONFLICT(province, city) DO UPDATE SET
            spot_count = MAX(0, travel_map_counts.spot_count + ?),
            updated_at = CURRENT_TIMESTAMP
    `;

    // 1. 도 전체 카운터 증감
    await pool.query(upsertSql, [province, '', diff, diff]);

    // 2. 시군구 카운터 증감 (시군구가 명시된 경우)
    const trimmedCity = (city || '').trim();
    if (trimmedCity) {
        await pool.query(upsertSql, [province, trimmedCity, diff, diff]);
    }

    // 3. 인메모리 캐시 무효화
    invalidateMapCountsCache();
}
