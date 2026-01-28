# 북마크 및 투표 기능 수정 완료

## 최종 해결된 문제

### 1. 북마크 기능
#### 문제
- 뉴스 페이지에서 북마크 버튼 클릭 시 잘못된 사용자로 저장됨
- 마이페이지에서 북마크가 표시되지 않음

#### 원인
```javascript
// ❌ 잘못된 방식: localStorage 사용
const userId = localStorage.getItem('user_id') || '1'; // 항상 1로 고정
```

#### 해결
```javascript
// ✅ 올바른 방식: 서버 세션에서 가져오기
let userId = null;
async function fetchUserInfo() {
  const response = await fetch('/api/auth/me');
  userId = response.data.user.id; // 실제 로그인 사용자
}
```

#### 수정 사항
1. `localStorage` 대신 `/api/auth/me`에서 사용자 정보 가져오기
2. 페이지 로드 시 `fetchUserInfo()` 먼저 호출
3. 북마크 API: `news_id` 기반으로 간소화
4. MyPageService: 테이블명 `bookmarks`, 컬럼명 `bookmarked_at`로 통일

### 2. 투표 기능 (좋아요/싫어요)
#### 문제
- `news_votes` 테이블 부재
- `news` 테이블에 `vote_up`, `vote_down`, `popularity_score` 컬럼 없음
- `popularity_score` 계산 오류

#### 해결
1. **테이블 생성**:
   ```sql
   CREATE TABLE news_votes (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id INTEGER NOT NULL,
     news_id INTEGER NOT NULL,
     vote_type TEXT NOT NULL CHECK(vote_type IN ('up', 'down')),
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     UNIQUE(user_id, news_id)
   );
   ```

2. **컬럼 추가**:
   ```sql
   ALTER TABLE news ADD COLUMN vote_up INTEGER DEFAULT 0;
   ALTER TABLE news ADD COLUMN vote_down INTEGER DEFAULT 0;
   ALTER TABLE news ADD COLUMN popularity_score INTEGER DEFAULT 0;
   ```

3. **popularity_score 계산 수정**:
   ```javascript
   // 1단계: 투표 수 업데이트
   UPDATE news SET vote_up = vote_up + 1 WHERE id = ?
   
   // 2단계: popularity_score 계산 (별도 쿼리)
   UPDATE news SET popularity_score = vote_up - vote_down WHERE id = ?
   ```

### 3. 키워드 구독
#### 수정 사항
- `created_at` → `subscribed_at` 컬럼명 통일
- `/api/user/keywords` 정상 작동

## 데이터베이스 스키마

### bookmarks 테이블
```sql
CREATE TABLE bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  news_id INTEGER NOT NULL,
  bookmarked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, news_id)
);
```

### news_votes 테이블
```sql
CREATE TABLE news_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  news_id INTEGER NOT NULL,
  vote_type TEXT CHECK(vote_type IN ('up', 'down')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, news_id)
);
```

### news 테이블 추가 컬럼
```sql
vote_up INTEGER DEFAULT 0
vote_down INTEGER DEFAULT 0
popularity_score INTEGER DEFAULT 0
```

### user_keywords 테이블
```sql
CREATE TABLE user_keywords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  keyword TEXT NOT NULL,
  subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, keyword)
);
```

## API 엔드포인트

### 북마크
- `POST /api/bookmarks` - 북마크 추가
  - Body: `{userId, newsId}`
- `DELETE /api/bookmarks/:newsId?userId=X` - 북마크 삭제
- `GET /api/bookmarks/check?userId=X&link=Y` - 북마크 상태 확인
- `GET /api/user/bookmarks?page=1&limit=20` - 북마크 목록 (requireAuth)

### 투표
- `POST /api/news/vote` - 투표
  - Body: `{userId, newsId, voteType: 'up'|'down'}`
  - 같은 타입 재클릭: 취소
  - 다른 타입 클릭: 변경

### 키워드
- `GET /api/user/keywords` - 구독 키워드 목록 (requireAuth)
- `POST /api/keywords/subscribe` - 키워드 구독
- `GET /api/news/keyword/:keyword` - 키워드별 뉴스

## 테스트 도구

### 실시간 북마크 확인
```bash
./check-bookmarks.sh
```

출력:
- 전체 사용자 목록
- 사용자별 북마크 개수
- 최근 북마크 5개

## 주요 커밋

### 북마크 수정
- `967ed3c` - Fix bookmark feature: use news_id instead of news details
- `3c5059a` - Add debug logs for mypage bookmarks loading
- `53ee22e` - Fix: Get userId from server session instead of localStorage

### 투표 수정
- `271d2ed` - Fix vote feature: add news_votes table and fix popularity_score calculation
- `0f35cd1` - Add vote feature documentation

### 기타
- `e630e0c` - Fix MyPageService: update table names to match schema
- `87cf1aa` - Fix route pattern: use regex constraint for numeric id

## 배포 정보

### 샌드박스
- **URL**: https://3000-igqqzgkeu63c4u9ihulwt-c81df28e.sandbox.novita.ai
- **뉴스**: /news
- **마이페이지**: /mypage

### GitHub
- **저장소**: https://github.com/million-somang/faith_dev
- **브랜치**: main
- **최신 커밋**: 53ee22e

## 프로덕션 배포 시 주의사항

### 1. 데이터베이스 마이그레이션
```bash
# news_votes 테이블 생성
node << 'SCRIPT'
const Database = require('better-sqlite3');
const db = new Database('faith-portal.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS news_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    news_id INTEGER NOT NULL,
    vote_type TEXT NOT NULL CHECK(vote_type IN ('up', 'down')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, news_id)
  )
`);

const columns = db.prepare('PRAGMA table_info(news)').all();
const columnNames = columns.map(c => c.name);

if (!columnNames.includes('vote_up')) {
  db.exec('ALTER TABLE news ADD COLUMN vote_up INTEGER DEFAULT 0');
}
if (!columnNames.includes('vote_down')) {
  db.exec('ALTER TABLE news ADD COLUMN vote_down INTEGER DEFAULT 0');
}
if (!columnNames.includes('popularity_score')) {
  db.exec('ALTER TABLE news ADD COLUMN popularity_score INTEGER DEFAULT 0');
}

db.close();
console.log('✅ 마이그레이션 완료');
SCRIPT
```

### 2. 서버 재시작
```bash
cd ~/faith_dev
git pull origin main
pkill -9 node && pkill -9 npm && pkill -9 tsx
sleep 2
nohup npm run start:prod > server.log 2>&1 &
sleep 5
tail -20 server.log
```

### 3. 동작 확인
```bash
# 뉴스 조회
curl http://localhost:3000/api/news?limit=3

# HOT 뉴스
curl http://localhost:3000/api/news/hot?limit=3

# 투표 (로그인 필요)
curl -X POST http://localhost:3000/api/news/vote \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"newsId":83,"voteType":"up"}'
```

## 테스트 계정

### 테스트사용자
- **이메일**: test@example.com
- **비밀번호**: test1234
- **userId**: 1

### 정석종
- **이메일**: sukman@naver.com
- **비밀번호**: (기존 비밀번호)
- **userId**: 2

## 최종 확인 사항
- ✅ 북마크 추가: 정상
- ✅ 북마크 삭제: 정상
- ✅ 북마크 목록 표시: 정상
- ✅ 좋아요/싫어요: 정상
- ✅ 투표 취소/변경: 정상
- ✅ popularity_score 계산: 정상
- ✅ 키워드 구독: 정상
- ✅ 마이페이지 표시: 정상
- ✅ 세션 기반 인증: 정상
