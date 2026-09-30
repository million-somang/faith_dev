# 📡 뉴스 & 여행 자동 발행 API 상태 점검 및 안정화 플랜

> **목표**: 서버 이전(카페24 ➔ 네이버 클라우드) 후 뉴스 및 여행 콘텐츠의 자동 발행 프로세스를 철저히 점검하고, 어떤 외부 환경에서도 누락 없이 안정적으로 발행되도록 API 규격 호환성과 서버 측 안전장치를 보강합니다.

---

## 🔍 1. 현황 정밀 진단 및 원인 분석

### 1) 발행이 중단되었던 원인
* **기존 서버 다운**: 오늘 약 3시간 전 기존 카페24 서버(`210.114.17.245`) 호스팅 만료로 인한 네트워크 단절.
* **도메인 연결 단절**: 카페24 DNS 변경 후 전파 지연(약 30~50분) 동안 외부 자동 발행 봇이 `https://veranex.app` 접속 시 `ECONNREFUSED` / `ETIMEDOUT` 오류로 연결 실패.
* **네이버 클라우드 신규 이전**: 17시경 네이버 클라우드(`211.188.48.230`)에 Nginx 및 SSL(HTTPS) 인증서 구축 완료.

### 2) 현재 API 작동 상태 실측 결과
* **서버 실시간 수신 확인**: 방금 17시 18분경부터 로컬/외부 자동화 프로세스로부터의 API 요청이 재개되었습니다.
  - `POST /api/news` ➔ **`201 Created`** 정상 수신 (뉴스 DB 건수: 3,585건 ➔ 3,592건 증가 확인)
  - `POST /api/travel` ➔ **`201 Created`** 정상 수신 (여행 DB 건수: 3건 ➔ 5건 증가 확인)
* **API Key 규격**:
  - `x-api-key: vera-news-api-key-2026`
  - `x-api-key: vera-travel-api-key-2026` (여행 전용 키 지원)
  - `Authorization: Bearer vera-news-api-key-2026`

---

## 🛠️ 2. 단계별 개선 및 안정화 플랜 (Implementation Roadmap)

### [Phase 1] 발행 API 수신부 방어 및 호환성 강화
1. **API Key 및 헤더 호환성 확대**:
   - `x-api-key`, `X-API-KEY`, `X-Api-Key`, `Authorization` 헤더 대소문자 및 공백 완전 무시 처리
   - 복수 API Key 동시 허용 (`process.env.NEWS_API_KEY`, `vera-news-api-key-2026`, `vera-travel-api-key-2026`)
2. **봇 차단 미들웨어 화이트리스트 100% 보장**:
   - `apps/api-server/src/server.ts`의 크롤러 차단 미들웨어에서 `/api/news*`, `/api/travel*` 엔드포인트는 User-Agent(`Python`, `node`, `curl`, `requests` 등)와 관계없이 유효한 API Key가 있으면 즉시 무조건 통과하도록 최우선 예외 처리
3. **페이로드(Payload) 크기 및 타임아웃 완화**:
   - 여행 고화질 이미지 및 장문 여행기 등록을 위해 `bodyLimit`을 기존 10MB에서 **25MB**로 상향
   - SQLite `busy_timeout`을 10초로 연장하여 대량 동시 발행 시 `SQLITE_BUSY` 락 완전 방지

### [Phase 2] 누락 방지를 위한 자체 수집/백업 스케줄러(Fallback) 점검
1. **뉴스 자체 수집 스케줄러 연동 점검**:
   - 외부 발행 봇에 일시적 장애가 발생하더라도 포털의 뉴스가 멈추지 않도록, `newsScheduler.ts`의 구글/네이버 RSS 자체 백업 수집 로직의 활성화 여부 점검 및 안전 가동 옵션 마련
2. **실패 요청 로깅(Dead Letter Logging)**:
   - API 발행 실패 시 단순 400/500 응답만 주는 것이 아니라, `/root/faith_dev/logs/publish-errors.log`에 요청 바디 요약과 구체적 에러 사유를 기록하여 즉시 트러블슈팅 가능하도록 개선

### [Phase 3] 관리자 대시보드 실시간 발행 모니터링 위젯
1. **관리자 페이지(`/admin`)에 실시간 발행 현황 추가**:
   - 오늘 자동 발행된 뉴스 건수, 여행 콘텐츠 건수 실시간 카드 표시
   - 최근 발행 시각 및 마지막 API 호출 상태(정상/오류) 시각화

---

## 📋 검증 체크리스트
- [ ] `POST /api/news` 단건 및 연속 배치 발행 테스트 (201 Created 확인)
- [ ] `POST /api/travel` 대표 이미지/갤러리 포함 발행 테스트 (201 Created 확인)
- [ ] 다양한 User-Agent (Python, Node-fetch, Axios, cURL) 요청 시 정상 통과 여부 검증
- [ ] 브라우저에서 `https://veranex.app/news` 및 `https://veranex.app/entertainment/travel` 접속 시 신규 기사가 최상단에 올바르게 노출되는지 검증
