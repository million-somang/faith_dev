/**
 * scripts/test-travel-map-counter.ts
 *
 * Task 5: 여행 지도 카운터 소급 정합성 검증 및 10,000건 대용량 성능 벤치마크 테스트
 *
 * Requirements:
 *  - Step A: 소급 적용된 기존 기사와 travel_map_counts 테이블 간 정합성 검증 (도별/시군구별 개수 100% 일치 확인)
 *  - Step B: 신규 기사 추가(API create 및 adjustTravelCount) 시 실시간 카운터 +1 증가 검증
 *  - Step C: 기사 삭제/숨김(hidden) 시 실시간 카운터 -1 감소 검증
 *  - Step D: 10,000건 대용량 가상 기사 등록 시뮬레이션 후 getTravelMapCounts() 응답 속도 및 데이터 크기 벤치마크
 *            (목표: 응답 시간 < 5ms, 페이로드 크기 < 5KB)
 *  - Step E: 테스트 종료 후 테스트 데이터 클린업 및 syncTravelMapCounts()로 원상 복구
 */

import { pool, STANDARD_PROVINCES } from '@faithportal/database';
import {
    getTravelMapCounts,
    syncTravelMapCounts,
    adjustTravelCount,
    invalidateMapCountsCache,
    type TravelMapCountsResponse
} from '../apps/api-server/src/services/travel-counter.service.js';
import { travelRoutes } from '../apps/api-server/src/routes/travel.routes.js';
import { performance } from 'perf_hooks';

// 유틸리티 함수
function formatMs(ms: number): string {
    return ms < 1 ? `${(ms * 1000).toFixed(1)}μs` : `${ms.toFixed(3)}ms`;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(2)} KB`;
}

function assert(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(`[Assertion Failed] ${message}`);
    }
}

// 벤치마크용 전국 시도/시군구 샘플 풀 (17개 광역시·도 및 대표 시·군·구)
const REGION_POOLS: Array<{ province: string; city: string }> = [
    // 서울
    { province: '서울특별시', city: '종로구' },
    { province: '서울특별시', city: '강남구' },
    { province: '서울특별시', city: '마포구' },
    { province: '서울특별시', city: '송파구' },
    { province: '서울특별시', city: '용산구' },
    // 경기
    { province: '경기도', city: '가평군' },
    { province: '경기도', city: '양평군' },
    { province: '경기도', city: '수원시' },
    { province: '경기도', city: '용인시' },
    { province: '경기도', city: '파주시' },
    // 인천
    { province: '인천광역시', city: '중구' },
    { province: '인천광역시', city: '강화군' },
    { province: '인천광역시', city: '연수구' },
    // 강원
    { province: '강원특별자치도', city: '강릉시' },
    { province: '강원특별자치도', city: '속초시' },
    { province: '강원특별자치도', city: '춘천시' },
    { province: '강원특별자치도', city: '평창군' },
    { province: '강원특별자치도', city: '정선군' },
    // 충북
    { province: '충청북도', city: '단양군' },
    { province: '충청북도', city: '충주시' },
    { province: '충청북도', city: '제천시' },
    // 충남
    { province: '충청남도', city: '태안군' },
    { province: '충청남도', city: '보령시' },
    { province: '충청남도', city: '공주시' },
    { province: '충청남도', city: '부여군' },
    // 대전
    { province: '대전광역시', city: '유성구' },
    { province: '대전광역시', city: '중구' },
    // 세종
    { province: '세종특별자치시', city: '세종시' },
    // 전북
    { province: '전북특별자치도', city: '전주시' },
    { province: '전북특별자치도', city: '군산시' },
    { province: '전북특별자치도', city: '남원시' },
    // 전남
    { province: '전라남도', city: '여수시' },
    { province: '전라남도', city: '순천시' },
    { province: '전라남도', city: '목포시' },
    { province: '전라남도', city: '담양군' },
    { province: '전라남도', city: '신안군' },
    // 광주
    { province: '광주광역시', city: '동구' },
    { province: '광주광역시', city: '북구' },
    // 경북
    { province: '경상북도', city: '경주시' },
    { province: '경상북도', city: '안동시' },
    { province: '경상북도', city: '포항시' },
    { province: '경상북도', city: '울릉군' },
    // 경남
    { province: '경상남도', city: '통영시' },
    { province: '경상남도', city: '거제시' },
    { province: '경상남도', city: '남해군' },
    // 대구
    { province: '대구광역시', city: '중구' },
    { province: '대구광역시', city: '수성구' },
    // 울산
    { province: '울산광역시', city: '남구' },
    { province: '울산광역시', city: '울주군' },
    // 부산
    { province: '부산광역시', city: '해운대구' },
    { province: '부산광역시', city: '수영구' },
    { province: '부산광역시', city: '기장군' },
    // 제주
    { province: '제주특별자치도', city: '제주시' },
    { province: '제주특별자치도', city: '서귀포시' }
];

async function main() {
    console.log('='.repeat(75));
    console.log('🚀 [Task 5] 여행 지도 카운터 소급 정합성 검증 및 10,000건 대용량 성능 벤치마크');
    console.log('='.repeat(75));

    // 혹시 이전 비정상 종료로 남아있을 수 있는 테스트 기사 사전 정리 및 동기화
    await pool.query("DELETE FROM travel_articles WHERE title LIKE '[테스트]%' OR author = 'BENCHMARK_SYNTHETIC' OR author = 'TEST_RUNNER'");
    await syncTravelMapCounts();

    // 0. 초기 상태 스냅샷 저장
    invalidateMapCountsCache();
    const initialArticlesRes = await pool.query('SELECT COUNT(*) as cnt FROM travel_articles');
    const initialArticleCount = Number(initialArticlesRes.rows[0].cnt);

    const initialCounts = await getTravelMapCounts();
    console.log(`\n📌 [초기 상태 확인]`);
    console.log(`   - travel_articles 총 기사 수: ${initialArticleCount}건`);
    console.log(`   - travel_map_counts 활성 국내 총합: ${initialCounts.total}건`);

    // =========================================================================
    // Step A: 소급 적용된 기존 기사와 travel_map_counts 테이블 간 정합성 검증
    // =========================================================================
    console.log('\n' + '-'.repeat(75));
    console.log('🔍 [Step A] 소급 적용 데이터 정합성 검증 (기사 테이블 vs 카운터 테이블)');
    console.log('-'.repeat(75));

    // A-1. 국내 활성 기사 전체 수량과 카운터 총합(total) 일치 검증
    const domesticActiveArticlesRes = await pool.query(`
        SELECT COUNT(*) as cnt 
        FROM travel_articles 
        WHERE (hidden IS NULL OR hidden = 0) 
          AND province NOT IN ('해외', '기타', '') 
          AND province IS NOT NULL
    `);
    const expectedTotal = Number(domesticActiveArticlesRes.rows[0].cnt);
    console.log(`  [A-1] 활성 국내 기사 수: ${expectedTotal}건 | map-counts 총합: ${initialCounts.total}건`);
    assert(initialCounts.total === expectedTotal, `총합 불일치: DB ${expectedTotal} vs 카운터 ${initialCounts.total}`);
    console.log(`   ✅ 총합 정합성 검증 성공: ${initialCounts.total}건 일치`);

    // A-2. 17개 표준 시도별 도 전체 카운터 정합성 검증
    const provArticlesRes = await pool.query(`
        SELECT province, COUNT(*) as cnt 
        FROM travel_articles 
        WHERE (hidden IS NULL OR hidden = 0) 
          AND province NOT IN ('해외', '기타', '') 
        GROUP BY province
    `);
    const expectedProvMap: Record<string, number> = {};
    for (const r of provArticlesRes.rows) {
        expectedProvMap[r.province] = Number(r.cnt);
    }

    let provMatchCount = 0;
    for (const provName of STANDARD_PROVINCES) {
        const expectedCount = expectedProvMap[provName] || 0;
        const actualCount = initialCounts.provinces[provName] || 0;
        assert(
            actualCount === expectedCount,
            `시도별 수량 불일치 [${provName}]: 기사 ${expectedCount}건 vs 카운터 ${actualCount}건`
        );
        provMatchCount++;
    }
    console.log(`  [A-2] 17개 표준 광역시·도 카운트 100% 일치 확인 (${provMatchCount}/17개 통과)`);

    // A-3. 시·군·구별 세부 카운터 정합성 검증
    const cityArticlesRes = await pool.query(`
        SELECT province, city, COUNT(*) as cnt 
        FROM travel_articles 
        WHERE (hidden IS NULL OR hidden = 0) 
          AND province NOT IN ('해외', '기타', '') 
          AND city != '' AND city IS NOT NULL
        GROUP BY province, city
    `);

    let cityMatchCount = 0;
    for (const r of cityArticlesRes.rows) {
        const prov = r.province;
        const city = r.city;
        const expectedCityCnt = Number(r.cnt);
        const actualCityCnt = initialCounts.cities[prov]?.[city] || 0;
        assert(
            actualCityCnt === expectedCityCnt,
            `시군구 수량 불일치 [${prov} ${city}]: 기사 ${expectedCityCnt}건 vs 카운터 ${actualCityCnt}건`
        );
        cityMatchCount++;
    }
    console.log(`  [A-3] 시·군·구 세부 카운트 100% 일치 확인 (총 ${cityMatchCount}개 시군구 정합성 확인)`);

    // A-4. 해외 기사 및 숨김 기사 격리 검증
    const overseasRes = await pool.query(`
        SELECT COUNT(*) as cnt FROM travel_articles WHERE province = '해외'
    `);
    const overseasCount = Number(overseasRes.rows[0]?.cnt || 0);
    const overseasInCounts = await pool.query(`
        SELECT COUNT(*) as cnt FROM travel_map_counts WHERE province = '해외'
    `);
    assert(Number(overseasInCounts.rows[0].cnt) === 0, '해외 데이터가 travel_map_counts에 누출되었습니다.');
    console.log(`  [A-4] 해외 여행지(${overseasCount}건) 국내 지도 카운터 격리 완벽 검증 완료`);

    console.log('  🎉 [Step A 완료] 소급 데이터 정합성 100% 검증 통과!');

    // =========================================================================
    // Step B: 신규 기사 추가 시 실시간 카운터 +1 증가 검증
    // =========================================================================
    console.log('\n' + '-'.repeat(75));
    console.log('⚡ [Step B] 신규 기사 생성 시 실시간 카운터 +1 증가 검증');
    console.log('-'.repeat(75));

    const stepBProv = '강원특별자치도';
    const stepBCity = '속초시';
    const beforeBCounts = await getTravelMapCounts();
    const beforeBProvCount = beforeBCounts.provinces[stepBProv] || 0;
    const beforeBCityCount = beforeBCounts.cities[stepBProv]?.[stepBCity] || 0;
    const beforeBTotal = beforeBCounts.total;

    console.log(`  [B-1] 기사 생성 전 카운트 - ${stepBProv}: ${beforeBProvCount}, ${stepBCity}: ${beforeBCityCount}, Total: ${beforeBTotal}`);

    // B-1: API 엔드포인트(POST /api/travel/create)를 통해 새 기사 등록
    const createReq = new Request('http://localhost/api/travel/create', {
        method: 'POST',
        headers: {
            'x-api-key': 'vera-news-api-key-2026',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: '[테스트] 설악산 대청봉 단풍 트레킹',
            destination: '속초 설악산 대청봉',
            region: 'domestic',
            category: 'nature',
            location_address: '강원 속초시 설악산로 1',
            content: '설악산 대청봉의 가을 단풍 풍경을 만끽하는 트레킹 코스입니다. 시원한 동해 바다와 울산바위가 조망됩니다.'
        })
    });

    const createRes = await travelRoutes.fetch(createReq);
    assert(createRes.status === 201, `기사 생성 실패: HTTP ${createRes.status}`);
    const createJson = (await createRes.json()) as any;
    const createdArticleId = createJson.article?.id;
    assert(!!createdArticleId, '생성된 기사 ID 누락');
    assert(createJson.article?.province === stepBProv, `시도 파싱 불일치: ${createJson.article?.province}`);
    assert(createJson.article?.city === stepBCity, `시군구 파싱 불일치: ${createJson.article?.city}`);

    console.log(`  [B-2] 신규 기사 등록 성공 (ID: ${createdArticleId}, ${stepBProv} ${stepBCity})`);

    // B-2: 생성 후 getTravelMapCounts() 즉시 반영(+1) 확인
    const afterBCounts = await getTravelMapCounts();
    const afterBProvCount = afterBCounts.provinces[stepBProv] || 0;
    const afterBCityCount = afterBCounts.cities[stepBProv]?.[stepBCity] || 0;
    const afterBTotal = afterBCounts.total;

    console.log(`  [B-3] 기사 생성 후 카운트 - ${stepBProv}: ${afterBProvCount} (+1), ${stepBCity}: ${afterBCityCount} (+1), Total: ${afterBTotal} (+1)`);

    assert(afterBProvCount === beforeBProvCount + 1, `시도 카운터 +1 미반영 (${beforeBProvCount} -> ${afterBProvCount})`);
    assert(afterBCityCount === beforeBCityCount + 1, `시군구 카운터 +1 미반영 (${beforeBCityCount} -> ${afterBCityCount})`);
    assert(afterBTotal === beforeBTotal + 1, `총합 카운터 +1 미반영 (${beforeBTotal} -> ${afterBTotal})`);

    // B-3: DB 직접 조회로 영속성 확인
    const dbProvCountRes = await pool.query(
        'SELECT spot_count FROM travel_map_counts WHERE province = ? AND city = ?',
        [stepBProv, '']
    );
    const dbCityCountRes = await pool.query(
        'SELECT spot_count FROM travel_map_counts WHERE province = ? AND city = ?',
        [stepBProv, stepBCity]
    );
    assert(Number(dbProvCountRes.rows[0]?.spot_count) === afterBProvCount, 'DB 도 카운터 영속성 불일치');
    assert(Number(dbCityCountRes.rows[0]?.spot_count) === afterBCityCount, 'DB 시군구 카운터 영속성 불일치');

    console.log('  🎉 [Step B 완료] 신규 기사 등록 시 실시간 원자적 +1 증가 검증 통과!');

    // =========================================================================
    // Step C: 기사 삭제/숨김 시 실시간 카운터 -1 감소 검증
    // =========================================================================
    console.log('\n' + '-'.repeat(75));
    console.log('🧹 [Step C] 기사 삭제 및 숨김(hidden) 시 실시간 카운터 -1 감소 검증');
    console.log('-'.repeat(75));

    // C-1. 기사 삭제 테스트 (Step B에서 생성한 기사 삭제)
    console.log(`  [C-1] 기사 삭제 시뮬레이션 (ID: ${createdArticleId})`);
    await pool.query('DELETE FROM travel_articles WHERE id = ?', [createdArticleId]);
    await adjustTravelCount(stepBProv, stepBCity, -1);

    const afterDelCounts = await getTravelMapCounts();
    console.log(`  [C-2] 기사 삭제 후 카운트 - ${stepBProv}: ${afterDelCounts.provinces[stepBProv]}, ${stepBCity}: ${afterDelCounts.cities[stepBProv]?.[stepBCity] || 0}`);
    assert(afterDelCounts.provinces[stepBProv] === beforeBProvCount, '삭제 후 시도 카운터 -1 미반영');
    assert((afterDelCounts.cities[stepBProv]?.[stepBCity] || 0) === beforeBCityCount, '삭제 후 시군구 카운터 -1 미반영');
    assert(afterDelCounts.total === beforeBTotal, '삭제 후 총합 카운터 원복 실패');
    console.log(`   ✅ 기사 삭제 시 -1 감소 및 원복 검증 성공`);

    // C-2. 기사 숨김(hidden = 1) 처리 테스트
    console.log(`  [C-3] 기사 숨김(hidden=1) 처리 시뮬레이션`);
    const hideProv = '제주특별자치도';
    const hideCity = '서귀포시';

    const insertHideRes = await pool.query(`
        INSERT INTO travel_articles (
            title, destination, region, category, content, province, city, author, hidden
        ) VALUES (
            '[테스트] 숨김 처리 테스트 기사', '서귀포 중문관광단지', 'domestic', 'healing',
            '서귀포 앞바다 풍경', ?, ?, 'TEST_RUNNER', 0
        )
    `, [hideProv, hideCity]);
    const hiddenArticleId = insertHideRes.lastInsertRowid;
    await adjustTravelCount(hideProv, hideCity, 1);

    const countsBeforeHide = await getTravelMapCounts();
    console.log(`   - 등록 후 ${hideProv} ${hideCity}: ${countsBeforeHide.cities[hideProv]?.[hideCity]}건`);

    // 숨김 상태로 변경 및 카운터 -1 차감
    await pool.query('UPDATE travel_articles SET hidden = 1 WHERE id = ?', [hiddenArticleId]);
    await adjustTravelCount(hideProv, hideCity, -1);

    const countsAfterHide = await getTravelMapCounts();
    console.log(`   - 숨김 후 ${hideProv} ${hideCity}: ${countsAfterHide.cities[hideProv]?.[hideCity]}건 (-1 반영)`);
    assert(
        (countsAfterHide.cities[hideProv]?.[hideCity] || 0) === (countsBeforeHide.cities[hideProv]?.[hideCity] || 1) - 1,
        '숨김 처리 후 시군구 카운터 -1 미반영'
    );

    // syncTravelMapCounts() 실행 후에도 숨김 기사는 카운트에서 제외되는지 확인
    await syncTravelMapCounts();
    const countsAfterSync = await getTravelMapCounts();
    assert(
        (countsAfterSync.cities[hideProv]?.[hideCity] || 0) === (countsAfterHide.cities[hideProv]?.[hideCity] || 0),
        '재동기화(sync) 시 숨김 기사 제외 검증 실패'
    );
    console.log(`   ✅ 숨김 기사 재동기화 시 카운트 제외 보장 확인`);

    // 숨김 테스트 기사 클린업
    await pool.query('DELETE FROM travel_articles WHERE id = ?', [hiddenArticleId]);
    await syncTravelMapCounts();
    console.log('  🎉 [Step C 완료] 기사 삭제 및 숨김 시 실시간 -1 차감 검증 통과!');

    // =========================================================================
    // Step D: 10,000건 대용량 가상 기사 등록 시뮬레이션 및 초고속 벤치마크
    // =========================================================================
    console.log('\n' + '-'.repeat(75));
    console.log('🚀 [Step D] 10,000건 대용량 가상 기사 등록 시뮬레이션 및 초고속 벤치마크');
    console.log('-'.repeat(75));

    const TARGET_SIMULATION_COUNT = 10000;
    console.log(`  [D-1] ${TARGET_SIMULATION_COUNT.toLocaleString()}건 가상 기사 생성 중 (17개 시도/50개 시군구 분산)...`);

    const insertStart = performance.now();
    await pool.query('BEGIN');

    const BATCH_SIZE = 100;
    const poolLen = REGION_POOLS.length;

    for (let i = 0; i < TARGET_SIMULATION_COUNT; i += BATCH_SIZE) {
        const batchRows: any[] = [];
        const placeholders: string[] = [];

        for (let j = 0; j < BATCH_SIZE; j++) {
            const idx = i + j;
            const regionInfo = REGION_POOLS[idx % poolLen];
            const title = `[BENCHMARK] ${regionInfo.province} ${regionInfo.city} 여행 명소 추천 #${idx + 1}`;
            const destination = `${regionInfo.city} 핫플레이스`;
            const content = `${regionInfo.province} ${regionInfo.city}에 위치한 아름다운 여행지 코스입니다.`;

            placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, 0)');
            batchRows.push(
                title,
                destination,
                'domestic',
                'healing',
                content,
                regionInfo.province,
                regionInfo.city,
                'BENCHMARK_SYNTHETIC'
            );
        }

        const sql = `
            INSERT INTO travel_articles (
                title, destination, region, category, content, province, city, author, hidden
            ) VALUES ${placeholders.join(', ')}
        `;
        await pool.query(sql, batchRows);
    }

    await pool.query('COMMIT');
    const insertDuration = performance.now() - insertStart;
    console.log(`  [D-2] 10,000건 기사 DB 일괄 삽입 완료 (${formatMs(insertDuration)})`);

    // 카운터 테이블 일괄 재동기화
    const syncStart = performance.now();
    await syncTravelMapCounts();
    const syncDuration = performance.now() - syncStart;
    console.log(`  [D-3] 10,000건 카운터 테이블 일괄 집계(sync) 완료 (${formatMs(syncDuration)})`);

    // 데이터 정상 집계 확인
    const benchCounts = await getTravelMapCounts();
    console.log(`  [D-4] 10,000건 반영 후 카운터 총합: ${benchCounts.total.toLocaleString()}건`);
    assert(
        benchCounts.total >= TARGET_SIMULATION_COUNT,
        `총합 누락: ${benchCounts.total} < ${TARGET_SIMULATION_COUNT}`
    );

    // -------------------------------------------------------------------------
    // 성능 벤치마크 1: DB 직접 조회(캐시 무효화 상태) 응답 속도 (목표 < 5ms)
    // -------------------------------------------------------------------------
    console.log('\n  📊 [Benchmark 1] 순수 DB 직접 조회 응답 속도 (Uncached DB Read, 50회 측정):');
    const uncachedTimes: number[] = [];
    for (let k = 0; k < 50; k++) {
        invalidateMapCountsCache();
        const t0 = performance.now();
        await getTravelMapCounts();
        const t1 = performance.now();
        uncachedTimes.push(t1 - t0);
    }
    uncachedTimes.sort((a, b) => a - b);
    const uncachedAvg = uncachedTimes.reduce((a, b) => a + b, 0) / uncachedTimes.length;
    const uncachedMin = uncachedTimes[0];
    const uncachedMax = uncachedTimes[uncachedTimes.length - 1];
    const uncachedP95 = uncachedTimes[Math.floor(uncachedTimes.length * 0.95)];

    console.log(`     - 평균 (Avg): ${formatMs(uncachedAvg)}`);
    console.log(`     - 최소 (Min): ${formatMs(uncachedMin)}`);
    console.log(`     - 최대 (Max): ${formatMs(uncachedMax)}`);
    console.log(`     - 95% 분위 (P95): ${formatMs(uncachedP95)}`);
    console.log(`     - 목표 (Target < 5ms): ${uncachedAvg < 5 ? '✅ PASS' : '❌ FAIL'}`);

    // -------------------------------------------------------------------------
    // 성능 벤치마크 2: 인메모리 캐시 응답 속도 (Cached Read, 1,000회 측정)
    // -------------------------------------------------------------------------
    console.log('\n  📊 [Benchmark 2] 인메모리 캐시 응답 속도 (In-Memory Cache, 1,000회 측정):');
    const cachedTimes: number[] = [];
    for (let k = 0; k < 1000; k++) {
        const t0 = performance.now();
        await getTravelMapCounts();
        const t1 = performance.now();
        cachedTimes.push(t1 - t0);
    }
    cachedTimes.sort((a, b) => a - b);
    const cachedAvg = cachedTimes.reduce((a, b) => a + b, 0) / cachedTimes.length;
    const cachedMin = cachedTimes[0];
    const cachedP95 = cachedTimes[Math.floor(cachedTimes.length * 0.95)];

    console.log(`     - 평균 (Avg): ${formatMs(cachedAvg)}`);
    console.log(`     - 최소 (Min): ${formatMs(cachedMin)}`);
    console.log(`     - 95% 분위 (P95): ${formatMs(cachedP95)}`);
    console.log(`     - 목표 (Target < 5ms): ${cachedAvg < 5 ? '✅ PASS' : '❌ FAIL'}`);

    // -------------------------------------------------------------------------
    // 성능 벤치마크 3: Hono 라우트 API 응답 속도 (GET /api/travel/map-counts, 50회)
    // -------------------------------------------------------------------------
    console.log('\n  📊 [Benchmark 3] HTTP API 엔드포인트 응답 속도 (GET /api/travel/map-counts, 50회):');
    const routeTimes: number[] = [];
    let lastResponseText = '';
    for (let k = 0; k < 50; k++) {
        const req = new Request('http://localhost/api/travel/map-counts');
        const t0 = performance.now();
        const res = await travelRoutes.fetch(req);
        lastResponseText = await res.text();
        const t1 = performance.now();
        routeTimes.push(t1 - t0);
    }
    routeTimes.sort((a, b) => a - b);
    const routeAvg = routeTimes.reduce((a, b) => a + b, 0) / routeTimes.length;
    const routeMin = routeTimes[0];
    const routeP95 = routeTimes[Math.floor(routeTimes.length * 0.95)];

    console.log(`     - 평균 (Avg): ${formatMs(routeAvg)}`);
    console.log(`     - 최소 (Min): ${formatMs(routeMin)}`);
    console.log(`     - 95% 분위 (P95): ${formatMs(routeP95)}`);
    console.log(`     - 목표 (Target < 5ms): ${routeAvg < 5 ? '✅ PASS' : '❌ FAIL'}`);

    // -------------------------------------------------------------------------
    // 성능 벤치마크 4: 네트워크 페이로드 크기 (목표 < 5KB)
    // -------------------------------------------------------------------------
    console.log('\n  📦 [Benchmark 4] 네트워크 페이로드 크기 분석:');
    const payloadBytes = Buffer.byteLength(lastResponseText, 'utf8');
    console.log(`     - 전송 페이로드 크기: ${formatBytes(payloadBytes)} (${payloadBytes} bytes)`);
    console.log(`     - 시·도 수량: ${Object.keys(benchCounts.provinces).length}개 광역시·도`);
    console.log(
        `     - 시·군·구 수량: ${Object.values(benchCounts.cities).reduce((acc, c) => acc + Object.keys(c).length, 0)}개 시·군·구`
    );
    console.log(`     - 목표 (Target < 5KB / 5,120 bytes): ${payloadBytes < 5120 ? '✅ PASS' : '❌ FAIL'}`);

    // -------------------------------------------------------------------------
    // 비교 분석: 기존 전체 기사 다운로드 방식 대비 절감율
    // -------------------------------------------------------------------------
    console.log('\n  ⚖️ [비교 분석] 기존 기사 전체 조회 vs 신규 지도 카운터 방식:');
    const oldQueryStart = performance.now();
    const oldArticlesRes = await pool.query(
        'SELECT id, title, destination, region, category, content, location_address, province, city FROM travel_articles LIMIT 10000'
    );
    const oldQueryTime = performance.now() - oldQueryStart;
    const oldPayloadBytes = Buffer.byteLength(JSON.stringify(oldArticlesRes.rows), 'utf8');

    console.log(`     - [기존 방식] 10,000건 기사 페이로드: ${formatBytes(oldPayloadBytes)} | 쿼리 시간: ${formatMs(oldQueryTime)}`);
    console.log(`     - [신규 방식] 전용 카운터 페이로드:    ${formatBytes(payloadBytes)} | 쿼리 시간: ${formatMs(uncachedAvg)}`);
    const payloadReduction = ((1 - payloadBytes / oldPayloadBytes) * 100).toFixed(2);
    const speedImprovement = (oldQueryTime / uncachedAvg).toFixed(1);
    console.log(`     - 🚀 네트워크 대역폭 절감율: ${payloadReduction}% 절감 (약 ${(oldPayloadBytes / payloadBytes).toFixed(0)}배 경량화)`);
    console.log(`     - 🚀 처리 속도 개선: 약 ${speedImprovement}배 향상`);

    assert(uncachedAvg < 5, `순수 DB 조회 속도 목표 초과: ${uncachedAvg.toFixed(2)}ms >= 5ms`);
    assert(cachedAvg < 5, `캐시 조회 속도 목표 초과: ${cachedAvg.toFixed(2)}ms >= 5ms`);
    assert(routeAvg < 5, `API 응답 속도 목표 초과: ${routeAvg.toFixed(2)}ms >= 5ms`);
    assert(payloadBytes < 5120, `페이로드 크기 목표 초과: ${payloadBytes} bytes >= 5120 bytes`);

    console.log('\n  🎉 [Step D 완료] 10,000건 대용량 성능 벤치마크 및 목표 검증 100% 통과!');

    // =========================================================================
    // Step E: 테스트 종료 후 테스트 데이터 클린업 및 syncTravelMapCounts() 원상 복구
    // =========================================================================
    console.log('\n' + '-'.repeat(75));
    console.log('🧹 [Step E] 테스트 데이터 완전 삭제 및 카운터 원상 복구(Clean-up)');
    console.log('-'.repeat(75));

    // E-1. 가상 벤치마크 기사 일괄 삭제
    console.log('  [E-1] 가상 벤치마크 기사(10,000건) 삭제 중...');
    const deleteStart = performance.now();
    await pool.query("DELETE FROM travel_articles WHERE author = 'BENCHMARK_SYNTHETIC'");
    console.log(`   - 삭제 소요 시간: ${formatMs(performance.now() - deleteStart)}`);

    // E-2. 혹시 남아있을 수 있는 테스트 기사 정리
    await pool.query("DELETE FROM travel_articles WHERE title LIKE '[테스트]%' OR author = 'TEST_RUNNER'");

    // E-3. 카운터 테이블 원상 복구
    console.log('  [E-2] syncTravelMapCounts() 실행하여 travel_map_counts 원상 복구 중...');
    await syncTravelMapCounts();

    // E-4. 원상 복구 정합성 확인
    const finalArticlesRes = await pool.query('SELECT COUNT(*) as cnt FROM travel_articles');
    const finalArticleCount = Number(finalArticlesRes.rows[0].cnt);
    const finalCounts = await getTravelMapCounts();

    console.log(`  [E-3] 최종 복구 확인:`);
    console.log(`   - travel_articles 총 기사 수: ${finalArticleCount}건 (초기: ${initialArticleCount}건)`);
    console.log(`   - travel_map_counts 활성 총합: ${finalCounts.total}건 (초기: ${initialCounts.total}건)`);

    assert(
        finalArticleCount === initialArticleCount,
        `기사 테이블 미복구: 현재 ${finalArticleCount} vs 초기 ${initialArticleCount}`
    );
    assert(
        finalCounts.total === initialCounts.total,
        `카운터 테이블 미복구: 현재 ${finalCounts.total} vs 초기 ${initialCounts.total}`
    );

    // 각 도별 카운트 원복 확인
    for (const prov of STANDARD_PROVINCES) {
        assert(
            (finalCounts.provinces[prov] || 0) === (initialCounts.provinces[prov] || 0),
            `도 카운트 원복 불일치: ${prov}`
        );
    }

    console.log(`   ✅ DB 및 카운터 테이블이 테스트 시작 전의 무결한 상태로 100% 원상 복구되었습니다.`);
    console.log('  🎉 [Step E 완료] 데이터 클린업 및 원상 복구 완료!');

    console.log('\n' + '='.repeat(75));
    console.log('🏆 [SUCCESS] Task 5: 모든 검증 및 대용량 성능 벤치마크 테스트를 완벽하게 통과했습니다!');
    console.log('='.repeat(75));

    process.exit(0);
}

main().catch((err) => {
    console.error('\n❌ [FAILED] Task 5 테스트 실행 중 에러 발생:', err);
    process.exit(1);
});
