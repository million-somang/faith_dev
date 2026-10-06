/**
 * scripts/test-travel-counters.ts
 * Task 3 검증 스크립트:
 * 1. getTravelMapCounts(), syncTravelMapCounts(), adjustTravelCount() 단위 검증
 * 2. GET /api/travel/map-counts, POST /api/travel/sync-counts, GET /api/travel/map-spots, POST /api/travel/create 라우트 E2E 검증
 */

import { pool, STANDARD_PROVINCES } from '@faithportal/database';
import {
    getTravelMapCounts,
    syncTravelMapCounts,
    adjustTravelCount,
    invalidateMapCountsCache
} from '../apps/api-server/src/services/travel-counter.service.js';
import { travelRoutes } from '../apps/api-server/src/routes/travel.routes.js';

async function runTests() {
    console.log('='.repeat(70));
    console.log('🧪 [Test] 여행 지도 카운터 서비스 및 신규 API E2E 검증 시작');
    console.log('='.repeat(70));

    try {
        // --- 1. 서비스 단위 검증 ---
        console.log('\n[1] getTravelMapCounts() 검증:');
        invalidateMapCountsCache();
        const initialCounts = await getTravelMapCounts();
        console.log(`  - success: ${initialCounts.success}`);
        console.log(`  - total: ${initialCounts.total}`);
        console.log(`  - 17개 표준 시도 포함 여부: ${STANDARD_PROVINCES.every(p => p in initialCounts.provinces)}`);
        console.log(`  - 시군구 맵 구조 확인: ${typeof initialCounts.cities === 'object'}`);
        if (!initialCounts.success || typeof initialCounts.total !== 'number') {
            throw new Error('getTravelMapCounts() 결과 규격 불일치');
        }

        console.log('\n[2] adjustTravelCount() 원자적 증감 및 캐시 무효화 검증:');
        const testProv = '강원특별자치도';
        const testCity = '테스트군';
        const beforeProvCount = initialCounts.provinces[testProv] || 0;

        // +1 증감
        await adjustTravelCount(testProv, testCity, 1);
        const afterAdd = await getTravelMapCounts();
        console.log(`  - ${testProv} 카운트: ${beforeProvCount} -> ${afterAdd.provinces[testProv]} (+1 확인)`);
        console.log(`  - ${testProv} ${testCity} 카운트: ${afterAdd.cities[testProv]?.[testCity]} (1 확인)`);
        if (afterAdd.provinces[testProv] !== beforeProvCount + 1) {
            throw new Error('adjustTravelCount +1 증감 실패');
        }

        // -1 증감 (원복)
        await adjustTravelCount(testProv, testCity, -1);
        const afterSub = await getTravelMapCounts();
        console.log(`  - 원복 후 ${testProv} 카운트: ${afterSub.provinces[testProv]} (${beforeProvCount} 확인)`);
        console.log(`  - 원복 후 ${testProv} ${testCity} 카운트: ${afterSub.cities[testProv]?.[testCity]} (0 확인)`);
        if (afterSub.provinces[testProv] !== beforeProvCount) {
            throw new Error('adjustTravelCount -1 증감 실패');
        }

        // 임시 테스트 시군구 레코드 정리
        await pool.query('DELETE FROM travel_map_counts WHERE city = ?', [testCity]);
        invalidateMapCountsCache();

        // --- 2. Hono 라우트 E2E 검증 ---
        console.log('\n[3] GET /api/travel/map-counts 라우트 검증:');
        const mapCountsReq = new Request('http://localhost/api/travel/map-counts');
        const mapCountsRes = await travelRoutes.fetch(mapCountsReq);
        console.log(`  - HTTP 상태 코드: ${mapCountsRes.status}`);
        const mapCountsJson = await mapCountsRes.json() as any;
        console.log(`  - JSON success: ${mapCountsJson.success}, total: ${mapCountsJson.total}`);
        if (mapCountsRes.status !== 200 || !mapCountsJson.success) {
            throw new Error('GET /api/travel/map-counts 호출 실패');
        }

        console.log('\n[4] GET /api/travel/map-spots 파라미터별 경량 조회 검증:');
        // (1) 전국 상위 20개 (파라미터 없음)
        const spotsAllReq = new Request('http://localhost/api/travel/map-spots');
        const spotsAllRes = await travelRoutes.fetch(spotsAllReq);
        const spotsAllJson = await spotsAllRes.json() as any;
        console.log(`  - 전국 스팟 응답: 상태 ${spotsAllRes.status}, 기사 수 ${spotsAllJson.articles?.length}개 (최대 20개 제한)`);
        if (spotsAllRes.status !== 200 || spotsAllJson.articles?.length > 20) {
            throw new Error('GET /api/travel/map-spots 전국 조회 제한 초과 또는 실패');
        }

        // (2) 특정 지역 필터링 (province=강원특별자치도)
        const spotsGangwonReq = new Request('http://localhost/api/travel/map-spots?province=강원특별자치도');
        const spotsGangwonRes = await travelRoutes.fetch(spotsGangwonReq);
        const spotsGangwonJson = await spotsGangwonRes.json() as any;
        console.log(`  - 강원특별자치도 스팟 응답: 상태 ${spotsGangwonRes.status}, 기사 수 ${spotsGangwonJson.articles?.length}개 (최대 10개 제한)`);
        if (spotsGangwonRes.status !== 200 || spotsGangwonJson.articles?.length > 10) {
            throw new Error('GET /api/travel/map-spots 지역 필터링 실패');
        }

        console.log('\n[5] POST /api/travel/create 기사 등록 시 행정구역 파싱 및 카운터 실시간 연동 검증:');
        const createReq = new Request('http://localhost/api/travel/create', {
            method: 'POST',
            headers: {
                'x-api-key': 'vera-news-api-key-2026',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: '[단위테스트] 강릉 커피거리 바다여행기',
                destination: '강릉 안목해변',
                region: 'domestic',
                category: 'healing',
                location_address: '강원 강릉시 창해로 14',
                content: '강원도 강릉시 안목해변 커피거리에서 즐기는 향긋한 힐링 코스입니다. 시원한 동해 바다 뷰를 감상해보세요.'
            })
        });

        const beforeCreateCounts = await getTravelMapCounts();
        const beforeGangwonCount = beforeCreateCounts.provinces['강원특별자치도'] || 0;
        const beforeGangneungCount = beforeCreateCounts.cities['강원특별자치도']?.['강릉시'] || 0;

        const createRes = await travelRoutes.fetch(createReq);
        console.log(`  - 기사 등록 응답: 상태 ${createRes.status}`);
        const createJson = await createRes.json() as any;
        console.log(`  - 등록된 기사 ID: ${createJson.article?.id}`);
        console.log(`  - 기사에 저장된 시도: "${createJson.article?.province}", 시군구: "${createJson.article?.city}"`);

        if (createRes.status !== 201 || createJson.article?.province !== '강원특별자치도' || createJson.article?.city !== '강릉시') {
            throw new Error('POST /api/travel/create 행정구역 자동 파싱 실패');
        }

        const afterCreateCounts = await getTravelMapCounts();
        const afterGangwonCount = afterCreateCounts.provinces['강원특별자치도'] || 0;
        const afterGangneungCount = afterCreateCounts.cities['강원특별자치도']?.['강릉시'] || 0;

        console.log(`  - 강원 카운트: ${beforeGangwonCount} -> ${afterGangwonCount} (+1 확인)`);
        console.log(`  - 강릉시 카운트: ${beforeGangneungCount} -> ${afterGangneungCount} (+1 확인)`);
        if (afterGangwonCount !== beforeGangwonCount + 1 || afterGangneungCount !== beforeGangneungCount + 1) {
            throw new Error('기사 생성 후 지도 카운터 실시간 연동 실패');
        }

        // 테스트 생성 기사 삭제 및 카운터 원복
        const testArticleId = createJson.article?.id;
        if (testArticleId) {
            await pool.query('DELETE FROM travel_articles WHERE id = ?', [testArticleId]);
            await adjustTravelCount('강원특별자치도', '강릉시', -1);
            console.log(`  - 테스트 기사 (ID: ${testArticleId}) 정리 및 카운터 원복 완료`);
        }

        console.log('\n[6] POST /api/travel/sync-counts 전체 동기화 API 검증:');
        const syncReq = new Request('http://localhost/api/travel/sync-counts', {
            method: 'POST',
            headers: {
                'x-api-key': 'vera-news-api-key-2026'
            }
        });
        const syncRes = await travelRoutes.fetch(syncReq);
        console.log(`  - 동기화 응답 상태: ${syncRes.status}`);
        const syncJson = await syncRes.json() as any;
        console.log(`  - 동기화 응답 메시지: ${syncJson.message}`);
        if (syncRes.status !== 200 || !syncJson.success) {
            throw new Error('POST /api/travel/sync-counts 동기화 호출 실패');
        }

        const finalCounts = await getTravelMapCounts();
        console.log(`  - 동기화 후 최종 집계: 총 ${finalCounts.total}개 스팟 정상 확인`);

        console.log('\n' + '='.repeat(70));
        console.log('🎉 [Success] 모든 Task 3 요구사항 테스트를 100% 통과하였습니다!');
        console.log('='.repeat(70));
        process.exit(0);
    } catch (err: any) {
        console.error('\n❌ [Error] 검증 실패:', err);
        process.exit(1);
    }
}

runTests();
