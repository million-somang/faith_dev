/**
 * scripts/backfill-travel-locations.ts
 *
 * 기존에 등록된 모든 travel_articles의 주소 및 목적지를 분석하여
 * province(시·도), city(시·군·구) 컬럼을 100% 소급 업데이트(Backfill)하고,
 * 지도 전용 사전 집계 테이블(travel_map_counts)에 시도별(city='') 및
 * 시군구별(city!='') 카운터를 정확히 일괄 집계(Seed)하는 스크립트.
 */

import { pool, parseKoreanLocation, STANDARD_PROVINCES } from '@faithportal/database';

interface TravelArticleRow {
    id: number;
    title: string;
    destination: string | null;
    location_address: string | null;
    region: string | null;
}

interface CountRow {
    province: string;
    city?: string;
    cnt: number;
}

async function runBackfill() {
    console.log('='.repeat(65));
    console.log('🚀 [Backfill] 여행 기사 행정구역 정밀 소급 적용 및 지도 카운터 집계 시작');
    console.log('='.repeat(65));

    try {
        // 1. 모든 travel_articles 조회
        const articlesRes = await pool.query(
            'SELECT id, title, destination, location_address, region FROM travel_articles ORDER BY id ASC'
        );
        const articles: TravelArticleRow[] = articlesRes.rows;
        console.log(`\n📋 총 ${articles.length}개의 기사를 조회하였습니다.`);

        // 2. 각 기사별 정밀 파싱 및 travel_articles 업데이트
        let updatedCount = 0;
        let domesticCount = 0;
        let overseasCount = 0;
        let etcCount = 0;

        for (const article of articles) {
            const { province, city, isDomestic } = parseKoreanLocation(
                article.location_address,
                article.destination,
                article.region
            );

            await pool.query(
                'UPDATE travel_articles SET province = ?, city = ? WHERE id = ?',
                [province, city, article.id]
            );

            updatedCount++;
            if (isDomestic) {
                domesticCount++;
            } else if (province === '해외') {
                overseasCount++;
            } else {
                etcCount++;
            }

            console.log(
                `  [ID: ${article.id}] "${article.title.substring(0, 25)}..." -> 시·도: "${province}", 시·군·구: "${city || '(없음)'}" (국내: ${isDomestic})`
            );
        }

        console.log(`\n✅ 기사 소급 업데이트 완료: 총 ${updatedCount}건 (국내: ${domesticCount}건, 해외: ${overseasCount}건, 기타: ${etcCount}건)`);

        // 3. travel_map_counts 테이블 초기화
        console.log('\n🧹 travel_map_counts 테이블 초기화(DELETE FROM travel_map_counts)...');
        await pool.query('DELETE FROM travel_map_counts');

        // 4. 국내 기사 기준 도별(city='') 집계
        const provCountsRes = await pool.query(`
            SELECT province, count(*) as cnt 
            FROM travel_articles 
            WHERE province NOT IN ('해외', '기타', '') 
            GROUP BY province
        `);
        const provMap: Record<string, number> = {};
        for (const r of provCountsRes.rows as CountRow[]) {
            provMap[r.province] = Number(r.cnt);
        }

        // 17개 표준 광역시·도 전체에 대해 city='' 카운터 삽입 (데이터가 없는 도는 0으로 초기화)
        let insertedProvCounts = 0;
        for (const provName of STANDARD_PROVINCES) {
            const count = provMap[provName] || 0;
            await pool.query(
                `INSERT OR REPLACE INTO travel_map_counts (province, city, spot_count, updated_at) 
                 VALUES (?, '', ?, CURRENT_TIMESTAMP)`,
                [provName, count]
            );
            insertedProvCounts++;
        }
        console.log(`✅ 17개 표준 광역시·도 도별 전체 카운터(city='') 등록 완료 (${insertedProvCounts}개 광역시·도)`);

        // 5. 시·군·구별(city!='') 집계 및 삽입
        const cityCountsRes = await pool.query(`
            SELECT province, city, count(*) as cnt 
            FROM travel_articles 
            WHERE province NOT IN ('해외', '기타', '') AND city != '' 
            GROUP BY province, city
        `);

        let insertedCityCounts = 0;
        for (const r of cityCountsRes.rows as CountRow[]) {
            await pool.query(
                `INSERT OR REPLACE INTO travel_map_counts (province, city, spot_count, updated_at) 
                 VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
                [r.province, r.city, Number(r.cnt)]
            );
            insertedCityCounts++;
            console.log(`  - [시·군·구 카운트] ${r.province} ${r.city}: ${r.cnt}건`);
        }
        console.log(`✅ 시·군·구별 세부 카운터(city!='') 등록 완료 (${insertedCityCounts}개 시·군·구)`);

        // 6. DB에 최종 저장된 travel_map_counts 검증
        console.log('\n' + '='.repeat(65));
        console.log('📊 [검증] travel_map_counts 최종 등록 현황:');
        console.log('='.repeat(65));

        const finalCountsRes = await pool.query(
            'SELECT province, city, spot_count FROM travel_map_counts ORDER BY spot_count DESC, province ASC, city ASC'
        );

        console.log(`총 레코드 수: ${finalCountsRes.rows.length}건`);
        console.log('상세 내역:');
        for (const row of finalCountsRes.rows) {
            const label = row.city ? `${row.province} > ${row.city}` : `[도 전체] ${row.province}`;
            console.log(`  - ${label.padEnd(25, ' ')}: ${row.spot_count}개`);
        }

        console.log('\n🎉 [완료] 소급 적용 및 지도 카운터 테이블 초기화가 성공적으로 완료되었습니다.');
        process.exit(0);
    } catch (error) {
        console.error('❌ [오류] 소급 적용 중 에러 발생:', error);
        process.exit(1);
    }
}

runBackfill();
