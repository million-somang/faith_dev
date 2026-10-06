# 재미 - 여행 지도 수량 카운터 전용 DB 분리 및 기존 데이터 소급 적용 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 수만 개의 여행 기사가 등록되더라도 지도가 지연 없이 0.01초 만에 렌더링되도록, 기사 전체 다운로드 방식을 폐기하고 지역별 카운터를 미리 집계·유지하는 전용 DB 테이블(`travel_map_counts`)과 초경량 API(`GET /api/travel/map-counts`)를 구축하며, 기존에 등록된 모든 여행 기사 데이터도 100% 소급 적용(Backfill)한다.

**Architecture:** 
1. `travel_articles` 테이블에 `province`(시·도), `city`(시·군·구) 컬럼을 정규화하고 인덱스를 생성하여 지역별 조회 성능을 극대화한다.
2. 기존에 생성된 모든 기사 데이터의 주소(`location_address`, `destination`, `title`)를 한국 표준 행정구역(17개 광역시·도 및 하위 시·군·구) 파서로 분석하여 `province`, `city` 컬럼을 100% 소급 업데이트(Backfill)한다.
3. 소급 적용된 기사를 바탕으로 지도 전용 집계 테이블 `travel_map_counts`에 시도별·시군구별 카운트를 1회 일괄 집계(Seed)하고, 이후 신규 등록/수정/삭제 시 실시간 동기화 및 원클릭 재동기화 함수를 제공한다.
4. 프론트엔드는 수만 개 기사를 통째로 다운로드하던 비효율을 제거하고, 불과 2~3KB의 초경량 사전 집계 데이터(`GET /api/travel/map-counts`)만 수신하여 O(1) 속도로 지도를 렌더링한다.

**Tech Stack:** SQLite (`better-sqlite3`), Hono, React 19, TypeScript, Tailwind CSS

---

## Global Constraints

- **기존 데이터 100% 소급 적용**: 기존에 등록된 모든 여행 기사(`travel_articles`)의 주소/목적지를 파싱하여 `province`, `city`를 채우고, 카운터 테이블(`travel_map_counts`)에 정확히 반영해야 한다.
- **국내/해외 구분 보장**: `region != 'domestic'`인 해외 여행지는 국내 지도 카운트(`travel_map_counts`)에 섞이지 않도록 격리 처리한다.
- 기존 `travel_articles`의 기능(검색, 필터, 페이징, 상세 보기, AI 요약 등)이 정상 작동해야 한다.
- 데이터가 수만 건으로 확장되어도 프론트엔드 지도 로딩 시간은 50ms 미만, 네트워크 페이로드는 5KB 미만이어야 한다.
- 카운터 불일치 상황에 대비한 원클릭/백그라운드 재계산(Recalculate/Sync) 안전장치가 마련되어야 한다.

---

### Task 1: DB 스키마 마이그레이션 (`travel_articles` 정규화 및 `travel_map_counts` 테이블 생성)

**Files:**
- Create: `packages/database/migrations/026_create_travel_map_counts.sql`

**Interfaces:**
- Produces: 
  - Table: `travel_map_counts` (columns: `id`, `province`, `city`, `spot_count`, `updated_at`, UNIQUE(`province`, `city`))
  - Columns: `travel_articles.province`, `travel_articles.city`
  - Indexes: `idx_travel_prov_city`, `idx_map_counts_prov`

- [ ] **Step 1: 마이그레이션 SQL 작성**

`packages/database/migrations/026_create_travel_map_counts.sql` 파일에:
1. `travel_articles`에 `province`, `city` 컬럼 추가
2. 인덱스 `idx_travel_prov_city ON travel_articles(province, city)` 생성
3. 지도 전용 카운터 테이블 `travel_map_counts` 생성 (UNIQUE(`province`, `city`))
4. 1차 기본 행정구역 매핑 쿼리(SQL CASE문) 실행

```sql
-- 026_create_travel_map_counts.sql
-- 여행 지도 수량 카운터 전용 테이블 생성 및 기사 지역 컬럼 정규화

-- 1. travel_articles 테이블에 정규화된 지역 컬럼 추가
ALTER TABLE travel_articles ADD COLUMN province TEXT DEFAULT '';
ALTER TABLE travel_articles ADD COLUMN city TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_travel_prov_city ON travel_articles(province, city);

-- 2. 지도 전용 카운터 집계 테이블 생성
CREATE TABLE IF NOT EXISTS travel_map_counts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    province TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT '',
    spot_count INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_prov_city UNIQUE(province, city)
);

CREATE INDEX IF NOT EXISTS idx_map_counts_prov ON travel_map_counts(province);

-- 3. 1차 기본 행정구역 매핑 (SQL 기반)
UPDATE travel_articles 
SET province = CASE 
    WHEN region != 'domestic' AND region != '국내' THEN '해외'
    WHEN location_address LIKE '%서울%' OR destination LIKE '%서울%' THEN '서울특별시'
    WHEN location_address LIKE '%경기%' OR destination LIKE '%경기%' THEN '경기도'
    WHEN location_address LIKE '%인천%' OR destination LIKE '%인천%' THEN '인천광역시'
    WHEN location_address LIKE '%강원%' OR destination LIKE '%강원%' THEN '강원특별자치도'
    WHEN location_address LIKE '%충북%' OR location_address LIKE '%충청북도%' OR destination LIKE '%충북%' OR destination LIKE '%충청북도%' THEN '충청북도'
    WHEN location_address LIKE '%충남%' OR location_address LIKE '%충청남도%' OR destination LIKE '%충남%' OR destination LIKE '%충청남도%' THEN '충청남도'
    WHEN location_address LIKE '%대전%' OR destination LIKE '%대전%' THEN '대전광역시'
    WHEN location_address LIKE '%세종%' OR destination LIKE '%세종%' THEN '세종특별자치시'
    WHEN location_address LIKE '%전북%' OR location_address LIKE '%전라북도%' OR destination LIKE '%전북%' OR destination LIKE '%전라북도%' THEN '전북특별자치도'
    WHEN location_address LIKE '%전남%' OR location_address LIKE '%전라남도%' OR destination LIKE '%전남%' OR destination LIKE '%전라남도%' THEN '전라남도'
    WHEN location_address LIKE '%광주%' OR destination LIKE '%광주%' THEN '광주광역시'
    WHEN location_address LIKE '%경북%' OR location_address LIKE '%경상북도%' OR destination LIKE '%경북%' OR destination LIKE '%경상북도%' THEN '경상북도'
    WHEN location_address LIKE '%경남%' OR location_address LIKE '%경상남도%' OR destination LIKE '%경남%' OR destination LIKE '%경상남도%' THEN '경상남도'
    WHEN location_address LIKE '%대구%' OR destination LIKE '%대구%' THEN '대구광역시'
    WHEN location_address LIKE '%울산%' OR destination LIKE '%울산%' THEN '울산광역시'
    WHEN location_address LIKE '%부산%' OR destination LIKE '%부산%' THEN '부산광역시'
    WHEN location_address LIKE '%제주%' OR destination LIKE '%제주%' THEN '제주특별자치도'
    ELSE '기타'
END;
```

- [ ] **Step 2: 마이그레이션 실행 확인**

Run: `node -e "const { pool } = require('@faithportal/database'); (async () => { const res = await pool.query('SELECT count(*) as cnt FROM travel_map_counts'); console.log('travel_map_counts exists:', res.rows[0].cnt); process.exit(0); })();"`
Expected: 에러 없이 정상 실행.

- [ ] **Step 3: Commit**

```bash
git add packages/database/migrations/026_create_travel_map_counts.sql
git commit -m "feat(db): add travel_map_counts table and province/city columns"
```

---

### Task 2: 기존 데이터 정밀 분석 및 100% 소급 적용(Backfill) 스크립트 작성

**Files:**
- Create: `packages/database/src/utils/geo-parser.ts`
- Create: `scripts/backfill-travel-locations.ts`

**Interfaces:**
- Produces:
  - Function: `parseKoreanAddress(addressOrDest: string): { province: string; city: string; isDomestic: boolean }`
  - Script: `npx tsx scripts/backfill-travel-locations.ts` (기존 DB 전체 기사 정밀 소급 업데이트 및 `travel_map_counts` 초기 집계)

- [ ] **Step 1: 정밀 한국 행정구역 파서 유틸리티 `geo-parser.ts` 작성**

`location_address`, `destination`에서:
- 17개 표준 시·도(서울특별시, 경기도, 강원특별자치도, 충청북도, 충청남도, 전북특별자치도, 전라남도, 경상북도, 경상남도, 제주특별자치도, 부산광역시, 대구광역시, 인천광역시, 광주광역시, 대전광역시, 울산광역시, 세종특별자치시)를 정확히 정규화
- 하위 시·군·구(예: 강릉시, 경주시, 강남구, 해운대구, 가평군 등)를 정규표현식으로 추출
- 해외 지역(스위스, 일본, 파리, 다낭 등)은 `isDomestic: false`, `province: '해외'`로 명확히 분리

```typescript
export const PROVINCE_MAP: Record<string, string> = {
    '서울': '서울특별시', '서울특별시': '서울특별시',
    '경기': '경기도', '경기도': '경기도',
    '인천': '인천광역시', '인천광역시': '인천광역시',
    '강원': '강원특별자치도', '강원도': '강원특별자치도', '강원특별자치도': '강원특별자치도',
    '충북': '충청북도', '충청북도': '충청북도',
    '충남': '충청남도', '충청남도': '충청남도',
    '대전': '대전광역시', '대전광역시': '대전광역시',
    '세종': '세종특별자치시', '세종특별자치시': '세종특별자치시',
    '전북': '전북특별자치도', '전라북도': '전북특별자치도', '전북특별자치도': '전북특별자치도',
    '전남': '전라남도', '전라남도': '전라남도',
    '광주': '광주광역시', '광주광역시': '광주광역시',
    '경북': '경상북도', '경상북도': '경상북도',
    '경남': '경상남도', '경상남도': '경상남도',
    '대구': '대구광역시', '대구광역시': '대구광역시',
    '울산': '울산광역시', '울산광역시': '울산광역시',
    '부산': '부산광역시', '부산광역시': '부산광역시',
    '제주': '제주특별자치도', '제주도': '제주특별자치도', '제주특별자치도': '제주특별자치도'
};

export function parseKoreanLocation(address?: string | null, dest?: string | null, region?: string | null): { province: string; city: string; isDomestic: boolean } {
    if (region && !['domestic', '국내', 'korea'].includes(region.toLowerCase())) {
        return { province: '해외', city: '', isDomestic: false };
    }

    const text = `${address || ''} ${dest || ''}`.trim();
    if (!text) return { province: '기타', city: '', isDomestic: true };

    // 1. 시·도 매칭
    let matchedProvince = '';
    for (const [key, standardName] of Object.entries(PROVINCE_MAP)) {
        if (text.includes(key)) {
            matchedProvince = standardName;
            break;
        }
    }

    // 2. 시·군·구 매칭
    let matchedCity = '';
    const cityMatch = text.match(/([가-힣]{2,6}(?:시|군|구))/);
    if (cityMatch && !Object.keys(PROVINCE_MAP).includes(cityMatch[1].replace(/(특별시|광역시|특별자치도|도)$/, ''))) {
        matchedCity = cityMatch[1];
    }

    return {
        province: matchedProvince || '기타',
        city: matchedCity || '',
        isDomestic: matchedProvince !== '' && matchedProvince !== '기타'
    };
}
```

- [ ] **Step 2: 기존 데이터 100% 소급 적용 실행 스크립트 작성**

`scripts/backfill-travel-locations.ts`:
1. 모든 `travel_articles` 레코드 조회
2. `parseKoreanLocation`을 거쳐 `province`, `city`를 추출
3. `UPDATE travel_articles SET province = ?, city = ? WHERE id = ?` 일괄 실행
4. `travel_map_counts` 테이블을 초기화하고, 업데이트된 기사 데이터를 바탕으로 시·도별 및 시·군·구별 카운트를 100% 정확하게 재집계(Seed)

- [ ] **Step 3: 소급 적용 스크립트 실행 및 결과 검증**

Run: `npx tsx scripts/backfill-travel-locations.ts`
Expected: 기존 기사들이 `province`, `city`로 성공적으로 업데이트되고, `travel_map_counts`에 해당 수량이 정확하게 들어간 내역이 출력됨.

- [ ] **Step 4: Commit**

```bash
git add packages/database/src/utils/geo-parser.ts scripts/backfill-travel-locations.ts
git commit -m "feat(travel): add geo-parser and backfill existing articles into map counter table"
```

---

### Task 3: 백엔드 카운터 동기화 서비스 로직 및 신규 API 구현

**Files:**
- Create: `apps/api-server/src/services/travel-counter.service.ts`
- Modify: `apps/api-server/src/routes/travel.routes.ts`

**Interfaces:**
- Produces:
  - Function: `getTravelMapCounts(): Promise<{ success: boolean; total: number; provinces: Record<string, number>; cities: Record<string, Record<string, number>> }>`
  - Function: `syncTravelMapCounts(): Promise<void>` (전체 재계산 안전장치)
  - Function: `adjustTravelCount(province: string, city: string, diff: number): Promise<void>`
  - Route: `GET /api/travel/map-counts` (초경량 2KB 카운터 API)
  - Route (개편): `GET /api/travel/map-spots` (특정 지역 상위 5~6개 명소 온디맨드 경량 조회)

- [ ] **Step 1: 카운터 서비스 `travel-counter.service.ts` 구현**

1. `getTravelMapCounts`: 인메모리 캐싱(10분 TTL)을 포함하여 `travel_map_counts`에서 17개 시도 및 시군구 카운터를 즉각 반환 (0.001초).
2. `syncTravelMapCounts`: DB의 `travel_articles` 전체를 기준으로 카운터를 100% 오차 없이 재계산하는 원클릭 동기화 함수.
3. `adjustTravelCount`: 기사 생성(+1), 삭제(-1), 숨김 상태 변경 시 증감 처리.

- [ ] **Step 2: `travel.routes.ts`에 API 연동**

1. `GET /api/travel/map-counts` 엔드포인트 신설.
2. `POST /api/travel` 및 `POST /api/travel/create`에서 새 기사 생성 시 `parseKoreanLocation`을 거쳐 `province`, `city` 컬럼에 자동 저장하고, `adjustTravelCount(..., +1)` 호출.
3. 기사 숨김/삭제 시 `adjustTravelCount(..., -1)` 호출.
4. 관리자/유틸리티용 동기화 엔드포인트 `POST /api/travel/sync-counts` 연동.

- [ ] **Step 3: API 테스트 및 검증**

Run: `node -e "const axios = require('axios'); ..."` 또는 내부 서비스 함수 단위 테스트 실행.
Expected: `GET /api/travel/map-counts`가 200 OK와 함께 정확한 시도별/시군구별 카운트 JSON을 반환.

- [ ] **Step 4: Commit**

```bash
git add apps/api-server/src/services/travel-counter.service.ts apps/api-server/src/routes/travel.routes.ts
git commit -m "feat(api): add /api/travel/map-counts and real-time counter synchronization"
```

---

### Task 4: 프론트엔드 연동 (`InteractiveKoreaMap` 및 `TravelPage` 초경량화)

**Files:**
- Modify: `apps/main-portal/src/pages/TravelPage.tsx`
- Modify: `apps/main-portal/src/components/travel/InteractiveKoreaMap.tsx`

**Interfaces:**
- Consumes: `GET /api/travel/map-counts`
- Changes:
  - `TravelPage.tsx`: 무거운 `allMapArticles` 배열 제거 -> 초소형 `mapCounts` 상태로 대체
  - `InteractiveKoreaMap.tsx`: 수만 번 루프 돌던 `articles.filter(...)` 완전 제거 -> `counts.provinces[prov.name]` 및 `counts.cities[prov.name]`를 O(1)로 참조하여 즉시 렌더링
  - 우측 퀵 카드 패널: 지도의 특정 도/시 클릭 시 상위 5개 명소만 온디맨드 렌더링

- [ ] **Step 1: `TravelPage.tsx` 수정**

1. 전체 기사를 조회하던 `fetchMapSpots` (`GET /api/travel/map-spots`) 제거
2. `fetchMapCounts` (`GET /api/travel/map-counts`)로 교체 (수십 MB -> 2KB로 절감)
3. `<InteractiveKoreaMap>`에 `counts={mapCounts}` 전달

- [ ] **Step 2: `InteractiveKoreaMap.tsx` 수정**

1. Props에 `counts: MapCountsData | null` 수신
2. 클라이언트 필터 루프(`provinceCounts`, `availableCitiesInProvince`) 삭제하고 `counts` 객체에서 O(1)로 수량 매핑
3. 브라우저 지연(Lag) 및 메모리 누수 100% 제거

- [ ] **Step 3: 프론트엔드 빌드 및 동작 검증**

Run: `npm run build` (main-portal)
Expected: 에러 없이 정상 빌드 완료.

- [ ] **Step 4: Commit**

```bash
git add apps/main-portal/src/pages/TravelPage.tsx apps/main-portal/src/components/travel/InteractiveKoreaMap.tsx
git commit -m "perf(frontend): connect pre-aggregated map counts and remove heavy client loops"
```

---

### Task 5: 소급 정합성 검증 및 대용량 성능 벤치마크 테스트

**Files:**
- Create: `scripts/test-travel-map-counter.ts`

- [ ] **Step 1: 소급 적용된 기존 기사와 카운터 테이블의 수량 일치 여부(정합성) 자동 검증**
- [ ] **Step 2: 가상 기사 10,000건 생성 시뮬레이션 후 카운터 API 응답 시간 측정 (목표: < 5ms)**
- [ ] **Step 3: Commit**

```bash
git add scripts/test-travel-map-counter.ts
git commit -m "test(travel): verify backfill integrity and benchmark counter performance"
```
