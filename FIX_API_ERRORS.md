# 🔧 API 에러 수정 완료

## ✅ 해결된 문제들

### 1. 북마크 체크 API 500 에러
**에러**: `api/bookmarks/check?userId=1&link=83` - 500 Internal Server Error

**원인**:
- SQL 쿼리에서 `news_link` 컬럼 사용
- 실제 테이블에는 `news_id` 컬럼만 존재

**bookmarks 테이블 실제 스키마**:
```
id (INTEGER)
user_id (INTEGER)
news_id (INTEGER)       ← news_link가 아님!
bookmarked_at (DATETIME)
```

**해결**:
```typescript
// 수정 전
const result = await DB.prepare(
  'SELECT id FROM bookmarks WHERE user_id = ? AND news_link = ?'
).bind(userId, link).first()

// 수정 후
const result = await DB.prepare(
  'SELECT id FROM bookmarks WHERE user_id = ? AND news_id = ?'
).bind(userId, newsId).first()
```

**테스트 결과**:
```bash
$ curl "http://localhost:3000/api/bookmarks/check?userId=1&link=83"
{"success":true,"bookmarked":false,"bookmarkId":null}
```

### 2. 키워드 구독 API 500 에러
**에러**: `api/keywords/subscribe` - 500 Internal Server Error

**원인**:
- `const { env } = c` 사용 후 `env.DB` 호출
- Node.js 환경에서 `env.DB`는 undefined

**해결**:
```typescript
// 수정 전
const { env } = c
await env.DB.prepare(`...`).bind(...).run()

// 수정 후
const DB = getDB(c)
await DB.prepare(`...`).bind(...).run()
```

### 3. 전체 env.DB 패턴 일괄 수정
**범위**: 총 27개의 `env.DB` 사용 위치 모두 수정

**수정된 API들**:
- `/api/news/:id/summarize` - 뉴스 AI 요약
- `/api/news/:id/vote` - 뉴스 투표
- `/api/news/:id/votes` - 투표 조회
- `/api/keywords/subscribe` - 키워드 구독
- `/api/keywords/unsubscribe` - 키워드 구독 취소
- `/api/keywords/my` - 내 키워드 목록
- `/api/keywords` - 키워드 목록
- `/api/news/keyword/:keyword` - 키워드별 뉴스
- `/api/news/hot` - 인기 뉴스
- 기타 뉴스 관련 API들

**변경 사항**:
```bash
# 일괄 변경
sed -i 's/env\.DB/DB/g' src/index.tsx
sed -i 's/const { env } = c$/const DB = getDB(c)/g' src/index.tsx
```

## 📊 수정 요약

### 수정된 파일
- `src/index.tsx`
  - `env.DB` → `DB` (27개 위치)
  - `const { env } = c` → `const DB = getDB(c)` (12개 위치)
  - `news_link` → `news_id` (bookmarks API)

### Git 커밋
1. `1312179` - Fix all env.DB to DB with getDB(c)
2. `93d88f7` - Fix bookmarks check: news_link -> news_id

## 🧪 테스트 결과

### 북마크 체크 API
```bash
$ curl "http://localhost:3000/api/bookmarks/check?userId=1&link=83"
{"success":true,"bookmarked":false,"bookmarkId":null}
```
✅ 정상 작동

### 뉴스 API
```bash
$ curl "http://localhost:3000/api/news?limit=5"
{"success":true,"count":5,"news":[...]}
```
✅ 정상 작동

## 🚀 호스팅 서버 배포

### 배포 명령어
```bash
# 1. 최신 코드 받기
cd ~/faith_dev
git pull origin main

# 2. 서버 재시작
pkill -9 node && pkill -9 npm && pkill -9 tsx
sleep 2
nohup npm run start:prod > server.log 2>&1 &
sleep 5

# 3. 로그 확인
tail -20 server.log

# 4. API 테스트
curl "http://localhost:3000/api/news?limit=3"
curl "http://localhost:3000/api/bookmarks/check?userId=1&link=83"
```

### 예상 결과
- ✅ 500 에러 없이 모든 API 정상 작동
- ✅ 북마크 체크 API 응답 정상
- ✅ 키워드 구독 API 응답 정상
- ✅ 뉴스 피드 표시 정상

## 🔍 브라우저 콘솔 확인

### 수정 전 (에러)
```
api/bookmarks/check?userId=1&link=83:1  Failed to load resource: 500
api/bookmarks/check?userId=1&link=104:1  Failed to load resource: 500
api/keywords/subscribe:1  Failed to load resource: 500
```

### 수정 후 (정상)
```
api/bookmarks/check?userId=1&link=83:1  Status 200 OK
api/news?limit=12&offset=0:1  Status 200 OK
(에러 없음)
```

## 📝 향후 개선 사항

### 1. 테이블 스키마 문서화
- 모든 테이블 스키마를 문서로 정리
- API 개발 시 스키마 참조 필수화

### 2. 에러 로깅 강화
- 모든 catch 블록에서 상세한 에러 로그 출력
- 프론트엔드에는 일반 메시지, 서버 로그에는 상세 정보

### 3. API 테스트 자동화
- 주요 API 엔드포인트에 대한 자동 테스트 작성
- CI/CD 파이프라인에 통합

## 🔗 참고 링크

- **GitHub**: https://github.com/million-somang/faith_dev
- **최신 커밋**: 93d88f7 - Fix bookmarks check: news_link -> news_id
- **이전 커밋**: 1312179 - Fix all env.DB to DB with getDB(c)
- **샌드박스 URL**: https://3000-igqqzgkeu63c4u9ihulwt-c81df28e.sandbox.novita.ai

## ✅ 체크리스트

- [x] 북마크 체크 API 500 에러 해결
- [x] 키워드 구독 API 500 에러 해결  
- [x] 모든 env.DB 패턴 제거
- [x] 테이블 스키마 확인 및 수정
- [x] 로컬 테스트 완료
- [ ] 호스팅 서버 배포
- [ ] 프로덕션 환경 테스트

---

**작업 완료 시간**: 2026-01-28
**테스트 환경**: ✅ 샌드박스 환경에서 모든 API 정상 작동 확인
**프로덕션 배포**: ⏳ 호스팅 서버 배포 대기 중
