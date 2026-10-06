/**
 * scripts/test-mobile-map-layout.ts
 *
 * Task 3: 여행 지도 모바일 뷰포트 레이아웃 및 뱃지/핀 충돌 방지 회귀 테스트
 *
 * Requirements:
 * 1. 모바일 뷰포트 너비(360px, 390px, 412px) 및 데스크톱(800px)에서:
 *    - 17개 광역시·도 뱃지의 실제 렌더링 화면 픽셀 좌표(X, Y) 및 바운딩 박스를 계산
 *    - 밀집 지역(서울-인천, 서울-경기, 세종-대전, 세종-충남, 광주-전남, 울산-부산, 대구-울산) 간에
 *      바운딩 박스가 겹치지 않는지(Collision-free) 자동 검증
 *    - 서울 자치구(종로구, 중구, 마포구, 강남구) 및 부산 자치구(해운대구, 중구, 기장군) 핀 간의 간격 검증
 * 2. 전체 17개 시·도 136개 전수 조합에 대한 충돌 검증
 * 3. 결과 표 및 통과 여부 출력 (0 failures)
 */

import { PROVINCES, KOREA_MAP_VIEWBOX, type ProvinceMeta } from '../apps/main-portal/src/components/travel/koreaMapData.js';

interface BoundingBox {
    x: number;
    y: number;
    w: number;
    h: number;
    left: number;
    right: number;
    top: number;
    bottom: number;
}

interface ViewportConfig {
    name: string;
    width: number;
    mapWidth: number;
    isMobile: boolean;
}

// 1. 테스트 대상 뷰포트 (모바일 360, 390, 412 및 데스크톱 800)
const VIEWPORTS: ViewportConfig[] = [
    { name: 'Mobile Mini (360px)', width: 360, mapWidth: 360, isMobile: true },
    { name: 'Mobile Standard (390px - iPhone 14/15)', width: 390, mapWidth: 390, isMobile: true },
    { name: 'Mobile Large (412px - Galaxy S23/S24)', width: 412, mapWidth: 412, isMobile: true },
    { name: 'Mobile Layout (360px nested container)', width: 360, mapWidth: 312, isMobile: true },
    { name: 'Desktop Standard (800px)', width: 800, mapWidth: 800, isMobile: false }
];

// 2. 검증 대상 핵심 밀집 권역 쌍
const DENSE_FOCUS_PAIRS: Array<[string, string, string]> = [
    ['수도권', '서울특별시', '인천광역시'],
    ['수도권', '서울특별시', '경기도'],
    ['충청권', '세종특별자치시', '대전광역시'],
    ['충청권', '세종특별자치시', '충청남도'],
    ['호남권', '광주광역시', '전라남도'],
    ['영남권', '울산광역시', '부산광역시'],
    ['영남권', '대구광역시', '울산광역시']
];

/**
 * SVG 동기화 벡터 뱃지 기반 바운딩 박스 계산 함수
 * - 뱃지가 SVG 내부 요소(<rect>, <text>)로 렌더링되므로, 화면 너비에 따라 scale = mapWidth / 800으로 정확히 비례 축소됨
 * - SVG ViewBox(800 x 759) 기준 뱃지 크기 (카운트 뱃지 포함 최대 크기 기준):
 *   - count > 0 (최대치): 폭 68, 높이 28
 *   - count === 0: 폭 48, 높이 28
 *   - 기본값으로 보수적인 폭 68(hasCount = true)을 적용하여 안전마진을 최대화
 */
function getBadgeBoundingBox(prov: ProvinceMeta, mapWidth: number, hasCount: boolean = true): BoundingBox {
    const scale = mapWidth / 800;
    const svgBadgeW = hasCount ? 68 : 48;
    const svgBadgeH = 28;

    const badgeW = svgBadgeW * scale;
    const badgeH = svgBadgeH * scale;

    // SVG ViewBox (800 x 759) 기준 화면 픽셀 매핑
    const targetX = prov.centerX + (prov.badgeOffsetX || 0);
    const targetY = prov.centerY + (prov.badgeOffsetY || 0);

    const pixelX = targetX * scale;
    const pixelY = targetY * scale;

    return {
        x: pixelX,
        y: pixelY,
        w: badgeW,
        h: badgeH,
        left: pixelX - badgeW / 2,
        right: pixelX + badgeW / 2,
        top: pixelY - badgeH / 2,
        bottom: pixelY + badgeH / 2
    };
}

/**
 * 두 바운딩 박스 간 충돌 여부 및 여유 간격(Clearance) 산출
 * - collision: X축 오버랩 AND Y축 오버랩이 동시 발생할 때만 참 (두 박스가 서로 겹침)
 */
function checkCollision(b1: BoundingBox, b2: BoundingBox) {
    const dx = Math.abs(b1.x - b2.x);
    const dy = Math.abs(b1.y - b2.y);

    const minSepX = (b1.w + b2.w) / 2;
    const minSepY = (b1.h + b2.h) / 2;

    const clearX = dx - minSepX;
    const clearY = dy - minSepY;

    // 수평 또는 수직 축 중 하나라도 박스가 분리되어 있으면 충돌 없음(Collision-free)
    const collides = clearX < 0 && clearY < 0;

    return { collides, dx, dy, clearX, clearY };
}

/**
 * 도 확대 시 동적 뷰박스(Dynamic ViewBox) 산출 헬퍼
 */
function calculateProvinceZoomViewBox(prov: ProvinceMeta): [number, number, number, number] {
    const [minX, minY, maxX, maxY] = prov.bbox;
    const width = maxX - minX;
    const height = maxY - minY;

    const padX = Math.max(Math.min(width * 0.18, 30), 6);
    const padY = Math.max(Math.min(height * 0.18, 30), 6);

    let w = width + padX * 2;
    let h = height + padY * 2;

    const targetAspect = 800 / 759;
    if (w / h > targetAspect) {
        h = w / targetAspect;
    } else {
        w = h * targetAspect;
    }

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    return [cx - w / 2, cy - h / 2, w, h];
}

async function runMobileLayoutTests() {
    console.log('='.repeat(80));
    console.log('🗺️ [Test] 대한민국 여행 지도 모바일/데스크톱 라벨 레이아웃 및 충돌 방지 검증');
    console.log('='.repeat(80));

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    // -------------------------------------------------------------------------
    // [검증 1] 17개 광역시·도 뱃지 좌표 산출 및 밀집 권역 충돌 방지(Collision-free) 검증
    // -------------------------------------------------------------------------
    console.log('\n[1] 밀집 권역 핵심 7개 쌍 충돌 방지(Collision-free) 검증');
    console.log('-'.repeat(80));

    for (const vp of VIEWPORTS) {
        console.log(`\n📌 뷰포트: ${vp.name} (지도 렌더링 너비: ${vp.mapWidth}px, 모바일 여부: ${vp.isMobile})`);
        console.log('┌' + '─'.repeat(8) + '┬' + '─'.repeat(16) + '┬' + '─'.repeat(16) + '┬' + '─'.repeat(14) + '┬' + '─'.repeat(14) + '┬' + '─'.repeat(8) + '┐');
        console.log('│ 권역   │ 시·도 1        │ 시·도 2        │ 거리 (dx, dy) │ 여유간격 (X, Y) │ 판정   │');
        console.log('├' + '─'.repeat(8) + '┼' + '─'.repeat(16) + '┼' + '─'.repeat(16) + '┼' + '─'.repeat(14) + '┼' + '─'.repeat(14) + '┼' + '─'.repeat(8) + '┤');

        for (const [region, name1, name2] of DENSE_FOCUS_PAIRS) {
            totalTests++;
            const p1 = PROVINCES.find(p => p.name === name1)!;
            const p2 = PROVINCES.find(p => p.name === name2)!;

            const b1 = getBadgeBoundingBox(p1, vp.mapWidth);
            const b2 = getBadgeBoundingBox(p2, vp.mapWidth);

            const { collides, dx, dy, clearX, clearY } = checkCollision(b1, b2);

            const statusStr = collides ? '❌ FAIL' : '✅ PASS';
            if (collides) {
                failedTests++;
            } else {
                passedTests++;
            }

            const distStr = `${dx.toFixed(1)}, ${dy.toFixed(1)}px`.padEnd(12);
            const clearStr = `${clearX > 0 ? '+' : ''}${clearX.toFixed(1)}, ${clearY > 0 ? '+' : ''}${clearY.toFixed(1)}px`.padEnd(12);
            const p1Label = `${p1.shortName}(${p1.centerX},${p1.centerY})`.padEnd(14);
            const p2Label = `${p2.shortName}(${p2.centerX},${p2.centerY})`.padEnd(14);

            console.log(`│ ${region.padEnd(6)} │ ${p1Label} │ ${p2Label} │ ${distStr} │ ${clearStr} │ ${statusStr} │`);
        }
        console.log('└' + '─'.repeat(8) + '┴' + '─'.repeat(16) + '┴' + '─'.repeat(16) + '┴' + '─'.repeat(14) + '┴' + '─'.repeat(14) + '┴' + '─'.repeat(8) + '┘');
    }

    // -------------------------------------------------------------------------
    // [검증 2] 17개 광역시·도 전체 전수 조합 (136 pairs) 완전 무충돌 검증
    // -------------------------------------------------------------------------
    console.log('\n\n[2] 17개 광역시·도 전체 전수 조합(136 쌍) 무충돌 전수 검증');
    console.log('-'.repeat(80));

    let allPairCollisionCount = 0;
    const testVpList = [360, 390, 412, 800];

    for (const w of testVpList) {
        const mapW = w;
        let collisionsInVp = 0;

        for (let i = 0; i < PROVINCES.length; i++) {
            for (let j = i + 1; j < PROVINCES.length; j++) {
                totalTests++;
                const p1 = PROVINCES[i];
                const p2 = PROVINCES[j];
                const b1 = getBadgeBoundingBox(p1, mapW);
                const b2 = getBadgeBoundingBox(p2, mapW);

                const { collides } = checkCollision(b1, b2);
                if (collides) {
                    collisionsInVp++;
                    allPairCollisionCount++;
                    failedTests++;
                    console.log(`  ❌ 충돌 발견 [${w}px]: ${p1.shortName} - ${p2.shortName}`);
                } else {
                    passedTests++;
                }
            }
        }
        console.log(`  - Viewport ${w}px (136 쌍 검증): ${collisionsInVp === 0 ? '✅ 100% Collision-free (0 충돌)' : `❌ ${collisionsInVp}개 충돌`}`);
    }

    // -------------------------------------------------------------------------
    // [검증 3] 시·군 세부 핀 간격 검증 (서울 자치구 & 부산 자치구)
    // -------------------------------------------------------------------------
    console.log('\n\n[3] 도 확대 시 세부 시·군 핀 분산 및 최소 간격 검증');
    console.log('-'.repeat(80));

    const cityChecks = [
        { provId: 'seoul', name: '서울특별시', minCoordDist: 15, minPixelDist: 50 },
        { provId: 'busan', name: '부산광역시', minCoordDist: 15, minPixelDist: 50 }
    ];

    for (const chk of cityChecks) {
        const prov = PROVINCES.find(p => p.id === chk.provId)!;
        const [vbX, vbY, vbW, vbH] = calculateProvinceZoomViewBox(prov);
        console.log(`\n📍 ${prov.name} 세부 핀 간격 검증 (도시 수: ${prov.cities.length}곳, Zoom ViewBox: ${vbW.toFixed(1)}x${vbH.toFixed(1)})`);

        for (let i = 0; i < prov.cities.length; i++) {
            for (let j = i + 1; j < prov.cities.length; j++) {
                totalTests++;
                const c1 = prov.cities[i];
                const c2 = prov.cities[j];

                // 원본 지도 좌표 거리
                const coordDist = Math.sqrt((c1.x - c2.x) ** 2 + (c1.y - c2.y) ** 2);

                // 모바일 360px 줌인 화면에서의 픽셀 거리 (지그재그 marginTop 6px 반영)
                const px1 = ((c1.x - vbX) / vbW) * 360;
                const py1 = ((c1.y - vbY) / vbH) * (360 * (759 / 800)) + (i % 2 === 0 ? -3 : 3);

                const px2 = ((c2.x - vbX) / vbW) * 360;
                const py2 = ((c2.y - vbY) / vbH) * (360 * (759 / 800)) + (j % 2 === 0 ? -3 : 3);

                const pixelDist = Math.sqrt((px1 - px2) ** 2 + (py1 - py2) ** 2);

                const isCoordOk = coordDist >= chk.minCoordDist;
                const isPixelOk = pixelDist >= chk.minPixelDist;
                const passed = isCoordOk && isPixelOk;

                if (passed) {
                    passedTests++;
                } else {
                    failedTests++;
                }

                console.log(`  - ${c1.name} ↔ ${c2.name}: 좌표거리=${coordDist.toFixed(1)}px (기준 >=${chk.minCoordDist}), 360px 렌더거리=${pixelDist.toFixed(1)}px (기준 >=${chk.minPixelDist}) => ${passed ? '✅ PASS' : '❌ FAIL'}`);
            }
        }
    }

    // -------------------------------------------------------------------------
    // [종합 판정 요약]
    // -------------------------------------------------------------------------
    console.log('\n' + '='.repeat(80));
    console.log('📊 [Test Summary] 여행 지도 모바일 레이아웃 및 뱃지 충돌 검증 최종 결과');
    console.log('='.repeat(80));
    console.log(`  - 총 검증 항목 수 : ${totalTests}건`);
    console.log(`  - 통과(Passed)    : ${passedTests}건`);
    console.log(`  - 실패(Failed)    : ${failedTests}건`);
    console.log(`  - 전수 조합 충돌  : ${allPairCollisionCount}건`);
    console.log('-'.repeat(80));

    if (failedTests === 0) {
        console.log('🎉 [SUCCESS] 모든 모바일 뷰포트(360px, 390px, 412px) 및 데스크톱에서');
        console.log('             17개 광역시·도 뱃지와 세부 시·군 핀이 100% 무충돌(Collision-free)로 정상 검증되었습니다!');
        console.log('='.repeat(80));
        return true;
    } else {
        console.error(`🚨 [FAILURE] ${failedTests}건의 레이아웃 충돌 또는 간격 미달이 발생했습니다.`);
        console.log('='.repeat(80));
        process.exit(1);
    }
}

runMobileLayoutTests().catch((err) => {
    console.error('Test execution error:', err);
    process.exit(1);
});
