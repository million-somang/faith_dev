# 마이페이지 상세 기능 플랜

## 📋 프로젝트 개요

### 목표
사용자별 개인화된 콘텐츠를 제공하는 마이페이지 구축

### 범위
- 뉴스: 구독 키워드 기반 맞춤 뉴스
- 게임: 게임 기록 및 순위
- 유틸리티: 저장된 계산 결과 및 즐겨찾기
- 프로필: 사용자 정보 관리

---

## 🎨 UI/UX 디자인

### 마이페이지 레이아웃

```
┌─────────────────────────────────────────────────────────────┐
│  Header (로그인 상태: 정석종님)                                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐  ┌──────────────────────────────────────┐    │
│  │          │  │                                        │    │
│  │  사이드  │  │         메인 콘텐츠 영역              │    │
│  │  메뉴바  │  │                                        │    │
│  │          │  │  ┌──────────────────────────────┐   │    │
│  │ • 대시보드│  │  │   선택된 메뉴의 내용          │   │    │
│  │ • 뉴스    │  │  │                              │   │    │
│  │ • 게임    │  │  │                              │   │    │
│  │ • 유틸리티│  │  │                              │   │    │
│  │ • 프로필  │  │  │                              │   │    │
│  │          │  │  └──────────────────────────────┘   │    │
│  └──────────┘  └──────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 반응형 디자인
- **PC (lg 이상)**: 사이드바(250px) + 메인 콘텐츠
- **태블릿 (md)**: 축소된 사이드바 + 메인 콘텐츠
- **모바일 (sm 이하)**: 상단 탭 메뉴 + 메인 콘텐츠

---

## 📊 1. 대시보드 (Dashboard)

### 목적
사용자의 주요 활동을 한눈에 보여주는 종합 대시보드

### 구성 요소

#### 1.1 상단 통계 카드 (4개)
```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 구독 키워드│ │ 게임 횟수 │ │ 저장 유틸│ │ 북마크   │
│    5개    │ │   127회   │ │   8개    │ │  23개   │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

**데이터 소스**:
- 구독 키워드: `user_keywords` 테이블
- 게임 횟수: `game2048_scores` 테이블 (COUNT)
- 저장 유틸: `saved_calculations` 테이블 (신규)
- 북마크: `bookmarks` 테이블

#### 1.2 최근 활동 타임라인
- 최근 7일간의 활동 로그
- 뉴스 구독, 게임 플레이, 유틸 저장 등

```sql
SELECT 
  activity_type,
  activity_description,
  created_at
FROM user_activities
WHERE user_id = ?
ORDER BY created_at DESC
LIMIT 10
```

#### 1.3 주간 활동 그래프
- Chart.js 사용
- 일별 활동 수 (뉴스 읽기, 게임 플레이, 유틸 사용)

---

## 📰 2. 뉴스 섹션

### 2.1 구독 키워드 관리

#### UI
```
┌─────────────────────────────────────────────────────┐
│ 내 구독 키워드 (5개)                    [+ 키워드 추가]│
├─────────────────────────────────────────────────────┤
│  🏷️ 인공지능 (12개 뉴스)                    [X 삭제] │
│  🏷️ 블록체인 (8개 뉴스)                     [X 삭제] │
│  🏷️ 스타트업 (15개 뉴스)                    [X 삭제] │
│  🏷️ 전기차 (20개 뉴스)                      [X 삭제] │
│  🏷️ 반도체 (25개 뉴스)                      [X 삭제] │
└─────────────────────────────────────────────────────┘
```

#### 기능
- ✅ **키워드 추가**: 최대 10개까지
- ✅ **키워드 삭제**: 개별 삭제
- ✅ **키워드별 뉴스 수**: 실시간 카운트
- ✅ **키워드 클릭**: 해당 키워드 뉴스 목록으로 이동

#### API
```typescript
// 키워드 목록 조회
GET /api/mypage/keywords
Response: {
  success: true,
  keywords: [
    { id: 1, keyword: "인공지능", news_count: 12, created_at: "2025-01-20" },
    ...
  ]
}

// 키워드별 뉴스 수 조회
GET /api/mypage/keywords/:id/news-count
Response: { success: true, count: 12 }
```

### 2.2 키워드별 뉴스 피드

#### UI
```
┌─────────────────────────────────────────────────────┐
│ "인공지능" 관련 뉴스 (12개)                  [전체보기]│
├─────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────┐    │
│  │ [IT/과학] AI 기술, 새로운 돌파구 마련      │    │
│  │ 📅 2시간 전  👁️ 1,234  👍 45  💬 12       │    │
│  │ 챗GPT의 새로운 업데이트로 더욱 강력해진...│    │
│  └────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────┐    │
│  │ [경제] AI 반도체 시장, 급성장 전망         │    │
│  │ 📅 5시간 전  👁️ 892   👍 23  💬 8         │    │
│  └────────────────────────────────────────────┘    │
│  ... (최대 5개 표시)                                │
└─────────────────────────────────────────────────────┘
```

#### 기능
- ✅ **키워드별 탭**: 각 키워드를 탭으로 전환
- ✅ **최신순 정렬**: 최근 뉴스 우선
- ✅ **인기순 정렬**: 조회수/투표수 기준
- ✅ **뉴스 필터**: 기간 선택 (오늘, 1주일, 1개월)

#### API
```typescript
GET /api/mypage/keywords/:keyword/news?sort=latest&period=week&limit=10
Response: {
  success: true,
  keyword: "인공지능",
  news: [...],
  total: 12
}
```

### 2.3 읽은 뉴스 기록

#### 기능
- 읽은 뉴스 자동 기록 (조회수 증가 시)
- 읽은 뉴스 필터 (읽음/안 읽음)
- 읽은 날짜 표시

#### 데이터베이스 (신규 테이블)
```sql
CREATE TABLE user_read_news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  news_id INTEGER NOT NULL,
  read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, news_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (news_id) REFERENCES news(id)
);

CREATE INDEX idx_user_read_news_user_id ON user_read_news(user_id);
CREATE INDEX idx_user_read_news_read_at ON user_read_news(read_at);
```

### 2.4 북마크한 뉴스

#### UI
```
┌─────────────────────────────────────────────────────┐
│ 내 북마크 (23개)                     [카테고리 필터▼]│
├─────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────┐    │
│  │ 🔖 [IT/과학] 메타버스의 미래                │    │
│  │ 📅 저장: 2025-01-15  👁️ 5,432             │    │
│  │ [북마크 해제]  [뉴스 보기]                  │    │
│  └────────────────────────────────────────────┘    │
│  ... (10개씩 페이지네이션)                          │
└─────────────────────────────────────────────────────┘
```

#### 기능
- ✅ **카테고리별 필터**: 전체, IT/과학, 경제, 정치 등
- ✅ **정렬**: 최신순, 북마크한 날짜순
- ✅ **검색**: 제목/내용 검색
- ✅ **일괄 삭제**: 선택한 북마크 삭제

---

## 🎮 3. 게임 섹션

### 3.1 게임 통계 대시보드

#### UI
```
┌─────────────────────────────────────────────────────┐
│ 내 게임 기록                                          │
├─────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ 총 플레이 │ │ 최고 점수│ │ 평균 점수│            │
│  │  127회    │ │ 12,850점 │ │ 3,420점 │            │
│  └──────────┘ └──────────┘ └──────────┘            │
│                                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │        점수 변화 그래프 (최근 30일)          │   │
│  │  ┌─┐                                         │   │
│  │  │ │     ┌─┐                                │   │
│  │  │ │  ┌──┘ └─┐   ┌─┐                       │   │
│  │──┴─┴──┘      └───┘ └──────                 │   │
│  │  1/1  1/10  1/20  1/30                      │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

#### 데이터
```typescript
// 통계 조회 API
GET /api/mypage/games/stats
Response: {
  success: true,
  stats: {
    total_plays: 127,
    highest_score: 12850,
    average_score: 3420,
    highest_tile: 2048,
    total_moves: 15320,
    play_time_minutes: 1840
  }
}
```

### 3.2 내 최고 기록

#### UI
```
┌─────────────────────────────────────────────────────┐
│ 내 최고 기록                                          │
├─────────────────────────────────────────────────────┤
│  🏆 최고 점수: 12,850점                              │
│     달성 날짜: 2025-01-18 15:30                      │
│     최고 타일: 2048                                   │
│     이동 횟수: 245회                                  │
│                                                       │
│  🥈 두 번째 기록: 10,240점  (2025-01-15)            │
│  🥉 세 번째 기록: 8,960점   (2025-01-12)            │
└─────────────────────────────────────────────────────┘
```

### 3.3 전체 순위 및 내 순위

#### UI
```
┌─────────────────────────────────────────────────────┐
│ 전체 리더보드                            [내 순위: 🔥47위]│
├─────────────────────────────────────────────────────┤
│  순위  플레이어       점수      최고타일  날짜         │
│  🥇 1   김철수      25,680     4096    2025-01-19   │
│  🥈 2   이영희      22,430     2048    2025-01-20   │
│  🥉 3   박민수      20,150     2048    2025-01-18   │
│  ...                                                  │
│  💡 47  정석종      12,850     2048    2025-01-18   │ ⬅ 내 위치
│  ...                                                  │
└─────────────────────────────────────────────────────┘
```

#### 기능
- ✅ **실시간 순위**: 전체 TOP 100
- ✅ **내 순위 하이라이트**: 스크롤 시 자동 이동
- ✅ **주변 순위**: 내 순위 ±5명 표시
- ✅ **순위 변동**: 이전 대비 상승/하락 표시
- ✅ **기간별 순위**: 오늘, 이번 주, 이번 달, 전체

#### API
```typescript
// 내 순위 조회
GET /api/mypage/games/my-rank
Response: {
  success: true,
  my_rank: 47,
  total_players: 1520,
  my_best_score: 12850,
  rank_above: { rank: 46, score: 12920, diff: 70 },
  rank_below: { rank: 48, score: 12780, diff: 70 }
}

// 주변 순위 조회
GET /api/mypage/games/nearby-ranks?rank=47&range=5
Response: {
  success: true,
  ranks: [
    { rank: 42, name: "김OO", score: 13200, tile: 2048 },
    ...
    { rank: 47, name: "정석종", score: 12850, tile: 2048, is_me: true },
    ...
  ]
}
```

### 3.4 플레이 기록

#### UI
```
┌─────────────────────────────────────────────────────┐
│ 최근 플레이 기록 (10개)                    [더보기▼] │
├─────────────────────────────────────────────────────┤
│  2025-01-20 14:30  |  8,640점  |  1024  |  180회  │
│  2025-01-20 11:15  |  6,320점  |  512   |  145회  │
│  2025-01-19 20:45  | 12,850점  |  2048  |  245회  │ ⬅ 최고 기록
│  2025-01-19 18:20  |  4,280점  |  256   |  98회   │
│  ...                                                  │
└─────────────────────────────────────────────────────┘
```

#### 기능
- ✅ **날짜별 필터**: 오늘, 이번 주, 이번 달, 전체
- ✅ **CSV 다운로드**: 전체 기록 내보내기
- ✅ **통계 비교**: 이전 기간 대비 개선도

---

## 🧮 4. 유틸리티 섹션

### 4.1 저장된 계산 결과

#### 저장 가능한 유틸리티
1. **D-Day 계산기**: 저장된 이벤트
2. **평수 계산기**: 저장된 계산
3. **나이 계산기**: 저장된 생일
4. **환율 계산기**: 자주 사용하는 환율
5. **금융 계산기**: 저장된 투자 계산

#### UI
```
┌─────────────────────────────────────────────────────┐
│ 내 저장 목록 (8개)                        [+ 새로 저장]│
├─────────────────────────────────────────────────────┤
│  📅 D-Day 계산기                                     │
│  ├─ 결혼기념일 (D-90)          2025-04-22  [수정] [삭제]│
│  ├─ 생일 (D+15)                2025-02-05  [수정] [삭제]│
│  └─ 프로젝트 마감 (D-3)        2025-01-24  [수정] [삭제]│
│                                                       │
│  📐 평수 계산기                                      │
│  ├─ 우리집 (33평)              109.09㎡   [수정] [삭제]│
│  └─ 신규 오피스텔 (25평)       82.64㎡    [수정] [삭제]│
│                                                       │
│  💰 환율 계산기                                      │
│  ├─ 미국 여행 경비 (1,000 USD) 1,350,000원 [수정] [삭제]│
│  └─ 일본 출장 (100,000 JPY)    1,000,000원 [수정] [삭제]│
└─────────────────────────────────────────────────────┘
```

#### 데이터베이스 (신규 테이블)
```sql
CREATE TABLE saved_calculations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  calc_type TEXT NOT NULL,  -- 'dday', 'pyeong', 'age', 'exchange', 'finance'
  title TEXT NOT NULL,
  input_data TEXT NOT NULL,  -- JSON 형식
  result_data TEXT,          -- JSON 형식
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_saved_calculations_user_id ON saved_calculations(user_id);
CREATE INDEX idx_saved_calculations_type ON saved_calculations(calc_type);
```

#### 데이터 예시
```json
// D-Day 계산
{
  "calc_type": "dday",
  "title": "결혼기념일",
  "input_data": {
    "target_date": "2025-04-22",
    "event_name": "결혼기념일",
    "emoji": "💒"
  },
  "result_data": {
    "days_remaining": 90
  }
}

// 평수 계산
{
  "calc_type": "pyeong",
  "title": "우리집",
  "input_data": {
    "sqm": 109.09,
    "pyeong": 33
  }
}

// 환율 계산
{
  "calc_type": "exchange",
  "title": "미국 여행 경비",
  "input_data": {
    "from_currency": "USD",
    "to_currency": "KRW",
    "amount": 1000,
    "rate": 1350
  },
  "result_data": {
    "converted": 1350000
  }
}
```

### 4.2 즐겨찾기 유틸리티

#### UI
```
┌─────────────────────────────────────────────────────┐
│ 자주 사용하는 유틸리티                               │
├─────────────────────────────────────────────────────┤
│  ⭐ D-Day 계산기      사용: 15회    [바로가기]      │
│  ⭐ 환율 계산기       사용: 8회     [바로가기]      │
│  ⭐ 평수 계산기       사용: 5회     [바로가기]      │
└─────────────────────────────────────────────────────┘
```

#### 데이터베이스 (신규 테이블)
```sql
CREATE TABLE favorite_utilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  utility_path TEXT NOT NULL,  -- '/lifestyle/dday-calculator'
  utility_name TEXT NOT NULL,
  use_count INTEGER DEFAULT 0,
  last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, utility_path),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 4.3 유틸리티 사용 통계

#### UI
```
┌─────────────────────────────────────────────────────┐
│ 이번 달 유틸리티 사용 현황                          │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐   │
│  │  사용 빈도 차트 (막대 그래프)              │   │
│  │  D-Day     ████████████████  (15회)        │   │
│  │  환율      ████████  (8회)                  │   │
│  │  평수      █████  (5회)                     │   │
│  │  나이      ███  (3회)                       │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 👤 5. 프로필 섹션

### 5.1 기본 정보

#### UI
```
┌─────────────────────────────────────────────────────┐
│ 내 정보                                      [수정]  │
├─────────────────────────────────────────────────────┤
│  이메일:     sukman@naver.com                        │
│  이름:       정석종                                   │
│  전화번호:   010-1234-5678                  [수정]   │
│  가입일:     2024-12-01                              │
│  마지막 로그인: 2025-01-21 15:30                    │
└─────────────────────────────────────────────────────┘
```

### 5.2 비밀번호 변경

#### UI
```
┌─────────────────────────────────────────────────────┐
│ 비밀번호 변경                                        │
├─────────────────────────────────────────────────────┤
│  현재 비밀번호:    [**********]                      │
│  새 비밀번호:      [**********]                      │
│  비밀번호 확인:    [**********]                      │
│                                                       │
│                    [변경하기]  [취소]                │
└─────────────────────────────────────────────────────┘
```

### 5.3 계정 설정

#### UI
```
┌─────────────────────────────────────────────────────┐
│ 알림 설정                                            │
├─────────────────────────────────────────────────────┤
│  ☑ 키워드 뉴스 알림 (이메일)                        │
│  ☑ 게임 순위 변동 알림                              │
│  ☐ 마케팅 정보 수신                                 │
│  ☑ 서비스 공지 알림                                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 개인정보 관리                                        │
├─────────────────────────────────────────────────────┤
│  📥 내 데이터 다운로드     [다운로드]               │
│  ⚠️ 회원 탈퇴              [탈퇴 신청]              │
└─────────────────────────────────────────────────────┘
```

---

## 🗄️ 데이터베이스 설계

### 신규 테이블

#### 1. saved_calculations (저장된 계산)
```sql
CREATE TABLE saved_calculations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  calc_type TEXT NOT NULL CHECK(calc_type IN ('dday', 'pyeong', 'age', 'exchange', 'finance')),
  title TEXT NOT NULL,
  input_data TEXT NOT NULL,
  result_data TEXT,
  is_favorite INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_saved_calc_user ON saved_calculations(user_id);
CREATE INDEX idx_saved_calc_type ON saved_calculations(calc_type);
CREATE INDEX idx_saved_calc_favorite ON saved_calculations(user_id, is_favorite);
```

#### 2. favorite_utilities (즐겨찾기 유틸리티)
```sql
CREATE TABLE favorite_utilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  utility_path TEXT NOT NULL,
  utility_name TEXT NOT NULL,
  use_count INTEGER DEFAULT 1,
  last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, utility_path),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_favorite_util_user ON favorite_utilities(user_id);
CREATE INDEX idx_favorite_util_count ON favorite_utilities(user_id, use_count DESC);
```

#### 3. user_read_news (읽은 뉴스 기록)
```sql
CREATE TABLE user_read_news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  news_id INTEGER NOT NULL,
  read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, news_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE
);

CREATE INDEX idx_read_news_user ON user_read_news(user_id);
CREATE INDEX idx_read_news_date ON user_read_news(read_at);
```

#### 4. user_activities (사용자 활동 로그)
```sql
CREATE TABLE user_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  activity_type TEXT NOT NULL CHECK(activity_type IN ('news_read', 'news_bookmark', 'keyword_subscribe', 'game_play', 'util_save', 'profile_update')),
  activity_description TEXT,
  metadata TEXT,  -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_activities_user ON user_activities(user_id);
CREATE INDEX idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX idx_user_activities_date ON user_activities(created_at);
```

### 기존 테이블 활용
- ✅ `user_keywords` - 키워드 구독
- ✅ `bookmarks` - 북마크한 뉴스
- ✅ `game2048_scores` - 게임 점수
- ✅ `users` - 사용자 정보

---

## 🔌 API 엔드포인트

### 대시보드
```typescript
GET /api/mypage/dashboard
Response: {
  success: true,
  stats: {
    keywords_count: 5,
    games_count: 127,
    saved_utils_count: 8,
    bookmarks_count: 23
  },
  recent_activities: [...],
  weekly_chart: {...}
}
```

### 뉴스
```typescript
// 키워드 목록 + 뉴스 수
GET /api/mypage/news/keywords
Response: {
  success: true,
  keywords: [
    { id: 1, keyword: "인공지능", news_count: 12, created_at: "..." },
    ...
  ]
}

// 키워드별 뉴스
GET /api/mypage/news/keywords/:keyword/feed?sort=latest&period=week&limit=10
Response: {
  success: true,
  keyword: "인공지능",
  news: [...],
  total: 12
}

// 읽은 뉴스 기록
POST /api/mypage/news/mark-read
Body: { news_id: 123 }
Response: { success: true }

// 북마크 목록
GET /api/mypage/news/bookmarks?category=all&page=1&limit=10
Response: {
  success: true,
  bookmarks: [...],
  pagination: {...}
}
```

### 게임
```typescript
// 게임 통계
GET /api/mypage/games/stats
Response: {
  success: true,
  stats: {
    total_plays: 127,
    highest_score: 12850,
    average_score: 3420,
    highest_tile: 2048,
    ...
  }
}

// 내 순위
GET /api/mypage/games/my-rank
Response: {
  success: true,
  my_rank: 47,
  total_players: 1520,
  my_best_score: 12850,
  percentile: 96.9  // 상위 3.1%
}

// 주변 순위
GET /api/mypage/games/nearby-ranks?range=5
Response: {
  success: true,
  ranks: [...]
}

// 플레이 기록
GET /api/mypage/games/history?period=week&limit=10
Response: {
  success: true,
  history: [...],
  total: 50
}
```

### 유틸리티
```typescript
// 저장된 계산 목록
GET /api/mypage/utils/saved?type=all
Response: {
  success: true,
  saved: [
    {
      id: 1,
      calc_type: "dday",
      title: "결혼기념일",
      input_data: {...},
      result_data: {...},
      created_at: "..."
    },
    ...
  ]
}

// 계산 저장
POST /api/mypage/utils/save
Body: {
  calc_type: "dday",
  title: "결혼기념일",
  input_data: {...},
  result_data: {...}
}
Response: { success: true, id: 1 }

// 계산 수정
PUT /api/mypage/utils/:id
Body: { title: "...", input_data: {...} }
Response: { success: true }

// 계산 삭제
DELETE /api/mypage/utils/:id
Response: { success: true }

// 즐겨찾기 유틸리티
GET /api/mypage/utils/favorites
Response: {
  success: true,
  favorites: [
    {
      utility_path: "/lifestyle/dday-calculator",
      utility_name: "D-Day 계산기",
      use_count: 15,
      last_used: "..."
    },
    ...
  ]
}

// 유틸리티 사용 기록
POST /api/mypage/utils/track-use
Body: {
  utility_path: "/lifestyle/dday-calculator",
  utility_name: "D-Day 계산기"
}
Response: { success: true }

// 사용 통계
GET /api/mypage/utils/stats?period=month
Response: {
  success: true,
  stats: [
    { utility_name: "D-Day 계산기", use_count: 15 },
    ...
  ]
}
```

### 프로필
```typescript
// 프로필 조회
GET /api/mypage/profile
Response: {
  success: true,
  user: {
    id: 1,
    email: "sukman@naver.com",
    name: "정석종",
    phone: "010-1234-5678",
    created_at: "2024-12-01",
    last_login: "2025-01-21 15:30"
  }
}

// 프로필 수정
PUT /api/mypage/profile
Body: { name: "...", phone: "..." }
Response: { success: true }

// 비밀번호 변경
POST /api/mypage/profile/change-password
Body: {
  current_password: "...",
  new_password: "..."
}
Response: { success: true }

// 내 데이터 다운로드
GET /api/mypage/profile/export-data
Response: { success: true, download_url: "..." }

// 회원 탈퇴
POST /api/mypage/profile/delete-account
Body: { password: "..." }
Response: { success: true }
```

---

## 🎨 프론트엔드 구현

### 페이지 구조
```
/mypage
├── /           (대시보드)
├── /news       (뉴스 섹션)
├── /games      (게임 섹션)
├── /utils      (유틸리티 섹션)
└── /profile    (프로필 섹션)
```

### 컴포넌트 구조
```typescript
// 마이페이지 레이아웃
interface MyPageLayout {
  sidebar: SidebarComponent
  content: ContentComponent
}

// 사이드바 메뉴
interface SidebarMenu {
  items: [
    { path: '/mypage', label: '대시보드', icon: 'dashboard' },
    { path: '/mypage/news', label: '뉴스', icon: 'newspaper' },
    { path: '/mypage/games', label: '게임', icon: 'gamepad' },
    { path: '/mypage/utils', label: '유틸리티', icon: 'calculator' },
    { path: '/mypage/profile', label: '프로필', icon: 'user' }
  ]
}
```

### 상태 관리
```typescript
// localStorage를 활용한 클라이언트 사이드 상태 관리
const myPageState = {
  activeTab: 'dashboard',  // 현재 탭
  newsFilter: { sort: 'latest', period: 'week' },
  gamesFilter: { period: 'all' },
  utilsFilter: { type: 'all' }
}
```

---

## 📱 반응형 디자인

### 브레이크포인트
- **Mobile (< 640px)**: 상단 탭 메뉴
- **Tablet (640px ~ 1024px)**: 축소 사이드바
- **Desktop (> 1024px)**: 전체 사이드바

### 모바일 UI 조정
1. **사이드바** → **상단 탭 메뉴**
2. **3열 레이아웃** → **1열 레이아웃**
3. **통계 카드 4개** → **2×2 그리드**
4. **그래프** → **간소화된 차트**

---

## 🚀 구현 단계

### Phase 1: 기반 작업 (1주)
- ✅ 데이터베이스 마이그레이션 (4개 테이블)
- ✅ 마이페이지 레이아웃 구조
- ✅ 사이드바 네비게이션
- ✅ 대시보드 통계 카드

### Phase 2: 뉴스 섹션 (1주)
- ✅ 키워드 관리 UI
- ✅ 키워드별 뉴스 피드
- ✅ 읽은 뉴스 기록
- ✅ 북마크 목록

### Phase 3: 게임 섹션 (1주)
- ✅ 게임 통계 대시보드
- ✅ 순위 시스템
- ✅ 플레이 기록
- ✅ 점수 변화 그래프

### Phase 4: 유틸리티 섹션 (1주)
- ✅ 저장된 계산 CRUD
- ✅ 즐겨찾기 시스템
- ✅ 사용 통계
- ✅ 유틸리티 연동

### Phase 5: 프로필 섹션 (3일)
- ✅ 프로필 조회/수정
- ✅ 비밀번호 변경
- ✅ 계정 설정
- ✅ 데이터 다운로드

### Phase 6: 테스트 및 최적화 (3일)
- ✅ 전체 기능 테스트
- ✅ 반응형 디자인 검증
- ✅ 성능 최적화
- ✅ 버그 수정

**총 예상 기간**: 4~5주

---

## 🎯 핵심 기능 우선순위

### High Priority (필수)
1. ✅ **대시보드**: 통계 카드, 활동 타임라인
2. ✅ **뉴스**: 키워드 관리, 키워드별 피드, 북마크
3. ✅ **게임**: 통계, 내 순위, 플레이 기록
4. ✅ **프로필**: 정보 조회/수정, 비밀번호 변경

### Medium Priority (중요)
1. ✅ **유틸리티**: 저장된 계산, 즐겨찾기
2. ✅ **뉴스**: 읽은 뉴스 기록
3. ✅ **게임**: 점수 변화 그래프

### Low Priority (추가)
1. ⏳ **알림 설정**
2. ⏳ **데이터 다운로드**
3. ⏳ **회원 탈퇴**

---

## 💡 추가 아이디어

### 1. 소셜 기능
- 친구 초대 및 순위 비교
- 게임 대결 모드
- 뉴스 공유 기능

### 2. AI 추천
- 키워드 자동 추천
- 관심사 기반 뉴스 추천
- 유사 사용자 기반 추천

### 3. 도전 과제 (Achievements)
- "첫 게임 플레이"
- "100회 플레이 달성"
- "2048 타일 달성"
- "10개 키워드 구독"

### 4. 프리미엄 기능
- 무제한 키워드 구독
- 광고 제거
- 데이터 분석 리포트
- 뉴스 알림 무제한

---

## 📊 성과 측정 지표 (KPI)

### 사용자 참여도
- 마이페이지 방문 수
- 평균 체류 시간
- 기능별 사용 빈도

### 기능별 지표
- **뉴스**: 키워드 구독 수, 뉴스 읽기 수
- **게임**: 플레이 횟수, 최고 점수 평균
- **유틸**: 저장된 계산 수, 재사용률

### 사용자 만족도
- 마이페이지 이용 만족도
- 기능 개선 요청
- 버그 리포트

---

## 🔐 보안 고려사항

### 인증 및 권한
- ✅ 로그인 필수 (`requireAuth` 미들웨어)
- ✅ 본인의 데이터만 접근 가능
- ✅ SQL Injection 방어
- ✅ XSS 방어 (escapeHtml)

### 데이터 보호
- ✅ 비밀번호 변경 시 현재 비밀번호 확인
- ✅ 민감 정보 암호화 저장
- ✅ 세션 관리 (7일 만료)

---

## ✅ 체크리스트

### 데이터베이스
- [ ] 마이그레이션 파일 생성 (4개 테이블)
- [ ] 로컬 DB 테스트
- [ ] 프로덕션 DB 배포

### 백엔드 API
- [ ] 대시보드 API (3개)
- [ ] 뉴스 API (5개)
- [ ] 게임 API (4개)
- [ ] 유틸리티 API (6개)
- [ ] 프로필 API (5개)

### 프론트엔드
- [ ] 마이페이지 레이아웃
- [ ] 사이드바 네비게이션
- [ ] 대시보드 페이지
- [ ] 뉴스 섹션 (4개 서브페이지)
- [ ] 게임 섹션 (3개 서브페이지)
- [ ] 유틸리티 섹션 (3개 서브페이지)
- [ ] 프로필 섹션 (3개 서브페이지)

### 테스트
- [ ] 단위 테스트
- [ ] 통합 테스트
- [ ] E2E 테스트
- [ ] 반응형 테스트

### 배포
- [ ] 스테이징 배포
- [ ] 사용자 테스트
- [ ] 프로덕션 배포

---

## 🎉 결론

이 플랜은 사용자 중심의 개인화된 마이페이지를 구축하기 위한 완전한 로드맵입니다.

**핵심 가치**:
- 📰 **뉴스**: 관심 키워드 기반 맞춤 뉴스
- 🎮 **게임**: 순위 경쟁을 통한 재미
- 🧮 **유틸리티**: 자주 사용하는 계산 저장
- 👤 **프로필**: 완전한 계정 관리

**다음 단계**: Phase 1부터 순차적으로 구현 시작! 🚀
