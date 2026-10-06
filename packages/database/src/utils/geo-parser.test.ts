import { parseKoreanLocation } from './geo-parser.js';

interface TestCase {
    name: string;
    address?: string;
    dest?: string;
    region?: string;
    expectedProvince: string;
    expectedCity: string;
    expectedDomestic: boolean;
}

const testCases: TestCase[] = [
    {
        name: '서울 중구 명동 (1음절 자치구)',
        address: '서울특별시 중구 명동',
        expectedProvince: '서울특별시',
        expectedCity: '중구',
        expectedDomestic: true,
    },
    {
        name: '부산 해운대구',
        address: '부산광역시 해운대구',
        expectedProvince: '부산광역시',
        expectedCity: '해운대구',
        expectedDomestic: true,
    },
    {
        name: '강원 강릉시',
        address: '강원특별자치도 강릉시',
        expectedProvince: '강원특별자치도',
        expectedCity: '강릉시',
        expectedDomestic: true,
    },
    {
        name: '부산 중구 중앙동 (1음절 자치구)',
        address: '부산광역시 중구 중앙동',
        expectedProvince: '부산광역시',
        expectedCity: '중구',
        expectedDomestic: true,
    },
    {
        name: '대구 동구 신암동 (1음절 자치구)',
        address: '대구광역시 동구 신암동',
        expectedProvince: '대구광역시',
        expectedCity: '동구',
        expectedDomestic: true,
    },
    {
        name: '광주 남구 봉선동 (1음절 자치구)',
        address: '광주광역시 남구 봉선동',
        expectedProvince: '광주광역시',
        expectedCity: '남구',
        expectedDomestic: true,
    },
    {
        name: '인천 서구 청라동 (1음절 자치구)',
        address: '인천광역시 서구 청라동',
        expectedProvince: '인천광역시',
        expectedCity: '서구',
        expectedDomestic: true,
    },
    {
        name: '울산 북구 송정동 (1음절 자치구)',
        address: '울산광역시 북구 송정동',
        expectedProvince: '울산광역시',
        expectedCity: '북구',
        expectedDomestic: true,
    },
    {
        name: '서울 종로구 혜화동 (다음절 자치구)',
        address: '서울특별시 종로구 혜화동',
        expectedProvince: '서울특별시',
        expectedCity: '종로구',
        expectedDomestic: true,
    },
    {
        name: '단축명: 서울 중구',
        address: '서울 중구',
        expectedProvince: '서울특별시',
        expectedCity: '중구',
        expectedDomestic: true,
    },
    {
        name: '해외 여행지: 스위스 인터라켄',
        dest: '스위스 인터라켄 융프라우',
        region: 'europe',
        expectedProvince: '해외',
        expectedCity: '',
        expectedDomestic: false,
    },
];

let failed = 0;

console.log('🧪 [Test] geo-parser 1음절 자치구 및 주요 행정구역 파싱 검증 시작\n');

for (const tc of testCases) {
    const result = parseKoreanLocation(tc.address, tc.dest, tc.region);
    const passProvince = result.province === tc.expectedProvince;
    const passCity = result.city === tc.expectedCity;
    const passDomestic = result.isDomestic === tc.expectedDomestic;

    if (passProvince && passCity && passDomestic) {
        console.log(`✅ [PASS] ${tc.name} -> 도: "${result.province}", 시군구: "${result.city}", 국내: ${result.isDomestic}`);
    } else {
        failed++;
        console.error(`❌ [FAIL] ${tc.name}`);
        console.error(`   Expected: 도="${tc.expectedProvince}", 시군구="${tc.expectedCity}", 국내=${tc.expectedDomestic}`);
        console.error(`   Actual:   도="${result.province}", 시군구="${result.city}", 국내=${result.isDomestic}`);
    }
}

console.log(`\n결과: 총 ${testCases.length}건 중 ${testCases.length - failed}건 성공, ${failed}건 실패`);

if (failed > 0) {
    process.exit(1);
} else {
    console.log('🎉 모든 테스트 케이스가 성공적으로 검증되었습니다.');
}
