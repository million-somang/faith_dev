# 마이페이지 개인 저장 사항 구현 플랜

## 📋 목표
마이페이지에서 각 메뉴(뉴스, 주식, 유틸, 게임)별로 사용자 개인 저장 사항을 관리할 수 있는 기능 구현

## 🎯 주요 기능

### 1. 뉴스 섹션
- **구독 키워드 관리**: 사용자가 관심 있는 키워드를 구독
- **구독 키워드별 뉴스 표시**: 각 키워드에 해당하는 뉴스를 별도로 그룹화하여 표시
- **북마크 기능**: 중요한 뉴스를 저장
- **읽음 표시**: 읽은 뉴스와 안 읽은 뉴스 구분

### 2. 주식 섹션 ⭐ NEW
- **관심 종목 관리**: 사용자가 관심 있는 주식 종목을 추가/삭제
- **실시간 가격 표시**: 관심 종목의 현재가, 등락률, 거래량 표시
- **미니 차트**: 각 종목의 간단한 가격 추이 차트
- **알림 설정**: 목표가 도달 시 알림 (향후 구현)
- **메모 기능**: 종목별 투자 메모 및 전략 기록
- **포트폴리오 통계**: 관심 종목의 전체 수익률, 평균 등락률 등

### 3. 게임 섹션
- **게임 점수 기록**: 사용자가 플레이한 게임의 점수 저장
- **순위 표시**: 전체 사용자 중 순위 표시 (예: 상위 5%, 10위)
- **게임별 통계**: 최고 점수, 평균 점수, 플레이 횟수
- **최근 플레이 기록**: 최근 플레이한 게임 목록

### 4. 유틸 섹션
- **계산기 히스토리**: 환율/통화 계산 기록
- **즐겨찾기 도구**: 자주 사용하는 유틸리티 바로가기
- **설정 값 저장**: 사용자가 설정한 기본값 (예: 기본 통화, 환율 기준)

---

## 📊 데이터베이스 설계

### 1. 사용자 키워드 구독 테이블
```sql
CREATE TABLE IF NOT EXISTS user_keyword_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  keyword TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, keyword)
);

CREATE INDEX idx_user_keyword_subscriptions_user_id ON user_keyword_subscriptions(user_id);
```

### 2. 뉴스 북마크 테이블
```sql
CREATE TABLE IF NOT EXISTS user_news_bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  news_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
  UNIQUE(user_id, news_id)
);

CREATE INDEX idx_user_news_bookmarks_user_id ON user_news_bookmarks(user_id);
CREATE INDEX idx_user_news_bookmarks_news_id ON user_news_bookmarks(news_id);
```

### 3. 뉴스 읽음 기록 테이블
```sql
CREATE TABLE IF NOT EXISTS user_news_read (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  news_id INTEGER NOT NULL,
  read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
  UNIQUE(user_id, news_id)
);

CREATE INDEX idx_user_news_read_user_id ON user_news_read(user_id);
```

### 4. 게임 점수 기록 테이블
```sql
CREATE TABLE IF NOT EXISTS user_game_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  game_type TEXT NOT NULL, -- 'tetris', 'snake', '2048', etc.
  score INTEGER NOT NULL,
  game_data TEXT, -- JSON format for additional game data
  played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_game_scores_user_id ON user_game_scores(user_id);
CREATE INDEX idx_user_game_scores_game_type ON user_game_scores(game_type);
CREATE INDEX idx_user_game_scores_score ON user_game_scores(score DESC);
```

### 5. 유틸 설정 테이블
```sql
CREATE TABLE IF NOT EXISTS user_util_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  setting_key TEXT NOT NULL, -- 'default_currency', 'favorite_tools', etc.
  setting_value TEXT NOT NULL, -- JSON format
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, setting_key)
);

CREATE INDEX idx_user_util_settings_user_id ON user_util_settings(user_id);
```

### 6. 유틸 사용 히스토리 테이블
```sql
CREATE TABLE IF NOT EXISTS user_util_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  util_type TEXT NOT NULL, -- 'exchange_rate', 'calculator', etc.
  input_data TEXT NOT NULL, -- JSON format
  result_data TEXT, -- JSON format
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_util_history_user_id ON user_util_history(user_id);
CREATE INDEX idx_user_util_history_util_type ON user_util_history(util_type);
```

### 7. 사용자 관심 주식 테이블 ⭐ NEW
```sql
CREATE TABLE IF NOT EXISTS user_watchlist_stocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  stock_symbol TEXT NOT NULL, -- 'AAPL', '005930.KS', etc.
  stock_name TEXT NOT NULL, -- 'Apple Inc.', '삼성전자', etc.
  market_type TEXT NOT NULL, -- 'US', 'KR', etc.
  target_price REAL, -- 목표가 (선택사항)
  memo TEXT, -- 종목 메모
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, stock_symbol)
);

CREATE INDEX idx_user_watchlist_stocks_user_id ON user_watchlist_stocks(user_id);
CREATE INDEX idx_user_watchlist_stocks_symbol ON user_watchlist_stocks(stock_symbol);
```

### 8. 주식 가격 알림 테이블 ⭐ NEW
```sql
CREATE TABLE IF NOT EXISTS user_stock_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  stock_symbol TEXT NOT NULL,
  alert_type TEXT NOT NULL, -- 'above' (이상), 'below' (이하)
  target_price REAL NOT NULL,
  is_triggered BOOLEAN DEFAULT 0,
  triggered_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_stock_alerts_user_id ON user_stock_alerts(user_id);
CREATE INDEX idx_user_stock_alerts_symbol ON user_stock_alerts(stock_symbol);
CREATE INDEX idx_user_stock_alerts_triggered ON user_stock_alerts(is_triggered);
```

---

## 🔌 API 엔드포인트 설계

### 뉴스 관련 API

#### 1. 키워드 구독 관리
```typescript
// 키워드 구독 추가
POST /api/user/keywords
Body: { keyword: string }
Response: { success: boolean, message: string }

// 구독 키워드 목록 조회
GET /api/user/keywords
Response: { 
  success: boolean, 
  keywords: Array<{ id: number, keyword: string, created_at: string }> 
}

// 키워드 구독 삭제
DELETE /api/user/keywords/:keywordId
Response: { success: boolean, message: string }
```

#### 2. 뉴스 북마크
```typescript
// 북마크 추가
POST /api/user/bookmarks
Body: { news_id: number }
Response: { success: boolean, message: string }

// 북마크 목록 조회
GET /api/user/bookmarks?page=1&limit=20
Response: {
  success: boolean,
  bookmarks: Array<{
    id: number,
    news_id: number,
    title: string,
    content: string,
    category: string,
    created_at: string,
    bookmarked_at: string
  }>,
  total: number,
  page: number,
  limit: number
}

// 북마크 삭제
DELETE /api/user/bookmarks/:newsId
Response: { success: boolean, message: string }
```

#### 3. 구독 키워드별 뉴스 조회
```typescript
GET /api/user/news/by-keyword?keyword=AI&page=1&limit=10
Response: {
  success: boolean,
  keyword: string,
  news: Array<{
    id: number,
    title: string,
    content: string,
    category: string,
    created_at: string,
    is_read: boolean,
    is_bookmarked: boolean
  }>,
  total: number,
  page: number,
  limit: number
}
```

#### 4. 읽음 표시
```typescript
// 뉴스를 읽음으로 표시
POST /api/user/news/read
Body: { news_id: number }
Response: { success: boolean, message: string }

// 읽은 뉴스 목록 조회
GET /api/user/news/read?page=1&limit=20
Response: {
  success: boolean,
  news: Array<{...}>,
  total: number
}
```

### 게임 관련 API

#### 1. 게임 점수 저장
```typescript
POST /api/user/games/scores
Body: {
  game_type: 'tetris' | 'snake' | '2048',
  score: number,
  game_data?: object
}
Response: {
  success: boolean,
  message: string,
  rank: number, // 전체 순위
  percentile: number // 상위 몇 %
}
```

#### 2. 게임 통계 조회
```typescript
GET /api/user/games/stats
Response: {
  success: boolean,
  stats: {
    tetris: {
      best_score: number,
      average_score: number,
      play_count: number,
      rank: number,
      percentile: number,
      last_played: string
    },
    snake: {...},
    2048: {...}
  }
}
```

#### 3. 게임 기록 조회
```typescript
GET /api/user/games/history?game_type=tetris&page=1&limit=10
Response: {
  success: boolean,
  game_type: string,
  history: Array<{
    id: number,
    score: number,
    played_at: string,
    rank_at_time: number // 당시 순위
  }>,
  total: number
}
```

#### 4. 리더보드 조회
```typescript
GET /api/games/leaderboard?game_type=tetris&limit=100
Response: {
  success: boolean,
  game_type: string,
  leaderboard: Array<{
    rank: number,
    user_id: number,
    user_name: string,
    score: number,
    played_at: string,
    is_current_user: boolean
  }>,
  user_rank: number, // 현재 사용자 순위
  total_players: number
}
```

### 유틸 관련 API

#### 1. 유틸 설정 관리
```typescript
// 설정 저장/업데이트
POST /api/user/utils/settings
Body: {
  setting_key: string,
  setting_value: object
}
Response: { success: boolean, message: string }

// 설정 조회
GET /api/user/utils/settings
Response: {
  success: boolean,
  settings: {
    default_currency: string,
    favorite_tools: string[],
    exchange_rate_base: string,
    ...
  }
}
```

#### 2. 유틸 히스토리
```typescript
// 히스토리 저장
POST /api/user/utils/history
Body: {
  util_type: 'exchange_rate' | 'calculator',
  input_data: object,
  result_data: object
}
Response: { success: boolean, message: string }

// 히스토리 조회
GET /api/user/utils/history?util_type=exchange_rate&page=1&limit=20
Response: {
  success: boolean,
  util_type: string,
  history: Array<{
    id: number,
    input_data: object,
    result_data: object,
    created_at: string
  }>,
  total: number
}

// 히스토리 삭제
DELETE /api/user/utils/history/:historyId
Response: { success: boolean, message: string }
```

### 주식 관련 API ⭐ NEW

#### 1. 관심 종목 관리
```typescript
// 관심 종목 추가
POST /api/user/watchlist
Body: {
  stock_symbol: string,
  stock_name: string,
  market_type: 'US' | 'KR',
  target_price?: number,
  memo?: string
}
Response: { success: boolean, message: string }

// 관심 종목 목록 조회
GET /api/user/watchlist
Response: {
  success: boolean,
  stocks: Array<{
    id: number,
    stock_symbol: string,
    stock_name: string,
    market_type: string,
    target_price?: number,
    memo?: string,
    added_at: string,
    current_price?: number,
    change_percent?: number,
    change_amount?: number
  }>
}

// 관심 종목 메모 수정
PUT /api/user/watchlist/:stockId
Body: {
  target_price?: number,
  memo?: string
}
Response: { success: boolean, message: string }

// 관심 종목 삭제
DELETE /api/user/watchlist/:stockId
Response: { success: boolean, message: string }
```

#### 2. 실시간 가격 정보 조회
```typescript
// 관심 종목 실시간 가격 일괄 조회
GET /api/user/watchlist/prices
Response: {
  success: boolean,
  prices: Array<{
    stock_symbol: string,
    current_price: number,
    change_percent: number,
    change_amount: number,
    volume: number,
    market_cap: number,
    updated_at: string
  }>
}

// 특정 종목 상세 정보
GET /api/user/watchlist/:stockSymbol/detail
Response: {
  success: boolean,
  stock: {
    symbol: string,
    name: string,
    current_price: number,
    change_percent: number,
    open: number,
    high: number,
    low: number,
    volume: number,
    market_cap: number,
    pe_ratio: number,
    dividend_yield: number
  }
}
```

#### 3. 가격 알림 관리
```typescript
// 알림 추가
POST /api/user/watchlist/alerts
Body: {
  stock_symbol: string,
  alert_type: 'above' | 'below',
  target_price: number
}
Response: { success: boolean, message: string }

// 알림 목록 조회
GET /api/user/watchlist/alerts
Response: {
  success: boolean,
  alerts: Array<{
    id: number,
    stock_symbol: string,
    stock_name: string,
    alert_type: string,
    target_price: number,
    current_price: number,
    is_triggered: boolean,
    triggered_at?: string,
    created_at: string
  }>
}

// 알림 삭제
DELETE /api/user/watchlist/alerts/:alertId
Response: { success: boolean, message: string }
```

#### 4. 포트폴리오 통계
```typescript
GET /api/user/watchlist/stats
Response: {
  success: boolean,
  stats: {
    total_stocks: number,
    market_distribution: {
      US: number,
      KR: number
    },
    overall_change_percent: number, // 전체 평균 등락률
    top_gainer: {
      symbol: string,
      name: string,
      change_percent: number
    },
    top_loser: {
      symbol: string,
      name: string,
      change_percent: number
    }
  }
}
```

---

## 🎨 UI/UX 설계

### 마이페이지 레이아웃

```
┌─────────────────────────────────────────────────────────┐
│                    공통 헤더                              │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────┐  ┌───────────────────────────────┐    │
│  │             │  │                                 │    │
│  │  사이드바    │  │        메인 콘텐츠 영역          │    │
│  │             │  │                                 │    │
│  │ - 프로필     │  │  ┌────────────────────────┐   │    │
│  │ - 뉴스       │  │  │     활성 섹션 내용      │   │    │
│  │ - 주식 ⭐    │  │  │                        │   │    │
│  │ - 게임       │  │  │  (뉴스/주식/게임/유틸   │   │    │
│  │ - 유틸       │  │  │   중 선택된 섹션 표시)  │   │    │
│  │ - 설정       │  │  │                        │   │    │
│  │             │  │  └────────────────────────┘   │    │
│  │             │  │                                 │    │
│  └─────────────┘  └───────────────────────────────┘    │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### 1. 뉴스 섹션 UI

#### A. 구독 키워드 관리
```html
┌──────────────────────────────────────────────┐
│  📰 뉴스 구독 관리                             │
├──────────────────────────────────────────────┤
│                                               │
│  구독 키워드                                  │
│  ┌─────────────────────────────────────┐    │
│  │ [AI] [블록체인] [메타버스] [ESG]      │    │
│  │ [전기차] [반도체] [+새 키워드 추가]    │    │
│  └─────────────────────────────────────┘    │
│                                               │
│  ─────────────────────────────────────────   │
│                                               │
│  AI 관련 뉴스 (23개)                          │
│  ┌────────────────────────────────────┐     │
│  │ 📄 [기술] OpenAI, GPT-5 발표         │     │
│  │    2시간 전 · 미읽음 · ⭐북마크       │     │
│  ├────────────────────────────────────┤     │
│  │ 📄 [경제] AI 반도체 수요 급증         │     │
│  │    5시간 전 · 읽음                   │     │
│  └────────────────────────────────────┘     │
│                                               │
│  블록체인 관련 뉴스 (15개)                    │
│  ...                                          │
│                                               │
└──────────────────────────────────────────────┘
```

#### B. 북마크한 뉴스
```html
┌──────────────────────────────────────────────┐
│  ⭐ 북마크한 뉴스                              │
├──────────────────────────────────────────────┤
│                                               │
│  카테고리: [전체] [정치] [경제] [기술]         │
│                                               │
│  ┌────────────────────────────────────┐     │
│  │ 📄 [기술] 양자컴퓨터 상용화 초읽기    │     │
│  │    저장: 2024-01-20                  │     │
│  │    [읽기] [북마크 해제] [공유]        │     │
│  ├────────────────────────────────────┤     │
│  │ 📄 [경제] 글로벌 금리 인하 전망       │     │
│  │    저장: 2024-01-19                  │     │
│  │    [읽기] [북마크 해제] [공유]        │     │
│  └────────────────────────────────────┘     │
│                                               │
│  [더 보기]                                    │
└──────────────────────────────────────────────┘
```

### 2. 주식 섹션 UI ⭐ NEW

```html
┌──────────────────────────────────────────────┐
│  📈 관심 종목                                  │
├──────────────────────────────────────────────┤
│                                               │
│  포트폴리오 요약                              │
│  ┌────────────────────────────────────┐     │
│  │  총 종목 수: 8개                     │     │
│  │  평균 등락률: +2.34% 📈              │     │
│  │  오늘의 최고: AAPL +5.2%             │     │
│  │  오늘의 최저: 삼성전자 -1.8%          │     │
│  └────────────────────────────────────┘     │
│                                               │
│  [+ 종목 추가]  [실시간 업데이트]  [정렬: 등락률] │
│                                               │
│  ─────────────────────────────────────────   │
│                                               │
│  🇺🇸 미국 주식 (5개)                          │
│                                               │
│  ┌────────────────────────────────────┐     │
│  │ 🍎 AAPL - Apple Inc.                │     │
│  │ $178.42  ▲ +$9.12 (+5.38%)          │     │
│  │ 📊 [미니차트: ↗↗↗]                  │     │
│  │ 목표가: $190.00 | 메모: 분기실적 호조 │     │
│  │ [상세] [수정] [삭제] [알림설정]      │     │
│  ├────────────────────────────────────┤     │
│  │ 🔥 TSLA - Tesla Inc.                │     │
│  │ $248.58  ▼ -$3.22 (-1.28%)          │     │
│  │ 📊 [미니차트: ↗↘↘]                  │     │
│  │ 목표가: $260.00 | 메모: 조정 진입    │     │
│  │ [상세] [수정] [삭제] [알림설정]      │     │
│  ├────────────────────────────────────┤     │
│  │ 🤖 NVDA - NVIDIA Corporation        │     │
│  │ $502.34  ▲ +$12.45 (+2.54%)         │     │
│  │ 📊 [미니차트: ↗↗↗]                  │     │
│  │ 목표가: $550.00 | 메모: AI 수혜주    │     │
│  │ [상세] [수정] [삭제] [알림설정]      │     │
│  └────────────────────────────────────┘     │
│                                               │
│  🇰🇷 한국 주식 (3개)                          │
│                                               │
│  ┌────────────────────────────────────┐     │
│  │ 📱 005930.KS - 삼성전자              │     │
│  │ 72,300원  ▼ -1,300원 (-1.77%)       │     │
│  │ 📊 [미니차트: ↗↘↘]                  │     │
│  │ 목표가: 80,000원 | 메모: 장기보유    │     │
│  │ [상세] [수정] [삭제] [알림설정]      │     │
│  ├────────────────────────────────────┤     │
│  │ 🔋 373220.KS - LG에너지솔루션        │     │
│  │ 425,000원  ▲ +8,500원 (+2.04%)      │     │
│  │ 📊 [미니차트: ↗↗↗]                  │     │
│  │ 목표가: 450,000원 | 메모: EV 수혜주  │     │
│  │ [상세] [수정] [삭제] [알림설정]      │     │
│  └────────────────────────────────────┘     │
│                                               │
│  ─────────────────────────────────────────   │
│                                               │
│  🔔 활성 알림 (2개)                           │
│  ┌────────────────────────────────────┐     │
│  │ AAPL: $190 이상 도달 시 알림         │     │
│  │ 현재가: $178.42 | 달성률: 94%        │     │
│  │ [삭제]                               │     │
│  ├────────────────────────────────────┤     │
│  │ 삼성전자: 75,000원 이상 도달 시 알림  │     │
│  │ 현재가: 72,300원 | 달성률: 96%       │     │
│  │ [삭제]                               │     │
│  └────────────────────────────────────┘     │
│                                               │
└──────────────────────────────────────────────┘
```

### 3. 게임 섹션 UI

```html
┌──────────────────────────────────────────────┐
│  🎮 게임 통계                                  │
├──────────────────────────────────────────────┤
│                                               │
│  전체 통계                                    │
│  ┌────────────────────────────────────┐     │
│  │  총 플레이: 127회                    │     │
│  │  총 플레이 시간: 5시간 32분           │     │
│  │  최고 기록 게임: Tetris (15,420점)    │     │
│  └────────────────────────────────────┘     │
│                                               │
│  ─────────────────────────────────────────   │
│                                               │
│  게임별 통계                                  │
│                                               │
│  🟦 Tetris                                    │
│  ┌────────────────────────────────────┐     │
│  │  최고 점수: 15,420점                 │     │
│  │  평균 점수: 8,340점                  │     │
│  │  플레이 횟수: 45회                   │     │
│  │  전체 순위: 23위 / 1,245명            │     │
│  │  상위: 1.8% 🏆                       │     │
│  │  [게임 플레이] [리더보드 보기]        │     │
│  └────────────────────────────────────┘     │
│                                               │
│  🐍 Snake                                     │
│  ┌────────────────────────────────────┐     │
│  │  최고 점수: 2,890점                  │     │
│  │  평균 점수: 1,560점                  │     │
│  │  플레이 횟수: 38회                   │     │
│  │  전체 순위: 56위 / 892명              │     │
│  │  상위: 6.3%                          │     │
│  │  [게임 플레이] [리더보드 보기]        │     │
│  └────────────────────────────────────┘     │
│                                               │
│  🎲 2048                                      │
│  ┌────────────────────────────────────┐     │
│  │  최고 점수: 45,678점                 │     │
│  │  평균 점수: 28,340점                 │     │
│  │  플레이 횟수: 44회                   │     │
│  │  전체 순위: 102위 / 1,567명           │     │
│  │  상위: 6.5%                          │     │
│  │  [게임 플레이] [리더보드 보기]        │     │
│  └────────────────────────────────────┘     │
│                                               │
│  ─────────────────────────────────────────   │
│                                               │
│  최근 플레이 기록                             │
│  ┌────────────────────────────────────┐     │
│  │ 🟦 Tetris - 12,340점                 │     │
│  │    2024-01-21 14:30 · 순위: 45위     │     │
│  ├────────────────────────────────────┤     │
│  │ 🐍 Snake - 1,890점                   │     │
│  │    2024-01-21 12:15 · 순위: 78위     │     │
│  ├────────────────────────────────────┤     │
│  │ 🎲 2048 - 34,560점                   │     │
│  │    2024-01-20 18:45 · 순위: 120위    │     │
│  └────────────────────────────────────┘     │
│                                               │
│  [전체 기록 보기]                             │
└──────────────────────────────────────────────┘
```

### 4. 유틸 섹션 UI

```html
┌──────────────────────────────────────────────┐
│  🔧 유틸리티 관리                              │
├──────────────────────────────────────────────┤
│                                               │
│  즐겨찾는 도구                                │
│  ┌─────────────────────────────────────┐    │
│  │ [💱 환율 계산기] [🧮 통화 변환기]      │    │
│  │ [📊 주식 분석] [📈 차트 도구]          │    │
│  └─────────────────────────────────────┘    │
│                                               │
│  ─────────────────────────────────────────   │
│                                               │
│  설정                                         │
│  ┌────────────────────────────────────┐     │
│  │  기본 통화: USD                      │     │
│  │  환율 기준: 실시간                   │     │
│  │  표시 소수점: 2자리                  │     │
│  │  [설정 변경]                         │     │
│  └────────────────────────────────────┘     │
│                                               │
│  ─────────────────────────────────────────   │
│                                               │
│  최근 사용 기록                               │
│                                               │
│  💱 환율 계산 기록 (10개)                     │
│  ┌────────────────────────────────────┐     │
│  │ USD 1,000 → KRW 1,320,000            │     │
│  │ 2024-01-21 15:30 · 환율: 1,320       │     │
│  │ [다시 사용] [삭제]                   │     │
│  ├────────────────────────────────────┤     │
│  │ EUR 500 → USD 550                    │     │
│  │ 2024-01-20 10:15 · 환율: 1.10        │     │
│  │ [다시 사용] [삭제]                   │     │
│  └────────────────────────────────────┘     │
│                                               │
│  🧮 통화 변환 기록 (5개)                      │
│  ...                                          │
│                                               │
└──────────────────────────────────────────────┘
```

---

## 🔧 기술 구현 방안

### 1. 타입 정의

```typescript
// src/types/mypage.types.ts

// 뉴스 관련 타입
export interface UserKeywordSubscription {
  id: number
  user_id: number
  keyword: string
  created_at: string
}

export interface UserNewsBookmark {
  id: number
  user_id: number
  news_id: number
  title: string
  content: string
  category: string
  created_at: string
  bookmarked_at: string
}

export interface UserNewsRead {
  id: number
  user_id: number
  news_id: number
  read_at: string
}

export interface NewsByKeyword {
  keyword: string
  news: Array<{
    id: number
    title: string
    content: string
    category: string
    created_at: string
    is_read: boolean
    is_bookmarked: boolean
  }>
  total: number
}

// 게임 관련 타입
export type GameType = 'tetris' | 'snake' | '2048'

export interface UserGameScore {
  id: number
  user_id: number
  game_type: GameType
  score: number
  game_data?: object
  played_at: string
}

export interface GameStats {
  best_score: number
  average_score: number
  play_count: number
  rank: number
  percentile: number
  last_played: string
}

export interface LeaderboardEntry {
  rank: number
  user_id: number
  user_name: string
  score: number
  played_at: string
  is_current_user: boolean
}

// 유틸 관련 타입
export interface UserUtilSetting {
  id: number
  user_id: number
  setting_key: string
  setting_value: object
  updated_at: string
}

export interface UserUtilHistory {
  id: number
  user_id: number
  util_type: string
  input_data: object
  result_data?: object
  created_at: string
}

// 주식 관련 타입 ⭐ NEW
export interface UserWatchlistStock {
  id: number
  user_id: number
  stock_symbol: string
  stock_name: string
  market_type: 'US' | 'KR'
  target_price?: number
  memo?: string
  added_at: string
  // 실시간 가격 정보 (API 조회 시 추가됨)
  current_price?: number
  change_percent?: number
  change_amount?: number
  volume?: number
}

export interface StockPrice {
  stock_symbol: string
  current_price: number
  change_percent: number
  change_amount: number
  volume: number
  market_cap?: number
  updated_at: string
}

export interface StockAlert {
  id: number
  user_id: number
  stock_symbol: string
  stock_name?: string
  alert_type: 'above' | 'below'
  target_price: number
  current_price?: number
  is_triggered: boolean
  triggered_at?: string
  created_at: string
}

export interface WatchlistStats {
  total_stocks: number
  market_distribution: {
    US: number
    KR: number
  }
  overall_change_percent: number
  top_gainer?: {
    symbol: string
    name: string
    change_percent: number
  }
  top_loser?: {
    symbol: string
    name: string
    change_percent: number
  }
}
```

### 2. 서비스 레이어 구현

```typescript
// src/services/mypage.service.ts

import { D1Database } from '@cloudflare/workers-types'
import type { 
  UserKeywordSubscription, 
  UserNewsBookmark,
  GameStats,
  LeaderboardEntry 
} from '../types/mypage.types'

export class MyPageService {
  constructor(private db: D1Database) {}

  // ===== 뉴스 키워드 관리 =====
  
  async addKeywordSubscription(userId: number, keyword: string): Promise<void> {
    await this.db
      .prepare(`
        INSERT INTO user_keyword_subscriptions (user_id, keyword)
        VALUES (?, ?)
        ON CONFLICT(user_id, keyword) DO NOTHING
      `)
      .bind(userId, keyword)
      .run()
  }

  async getKeywordSubscriptions(userId: number): Promise<UserKeywordSubscription[]> {
    const result = await this.db
      .prepare(`
        SELECT id, user_id, keyword, created_at
        FROM user_keyword_subscriptions
        WHERE user_id = ?
        ORDER BY created_at DESC
      `)
      .bind(userId)
      .all()

    return result.results as UserKeywordSubscription[]
  }

  async removeKeywordSubscription(userId: number, keywordId: number): Promise<void> {
    await this.db
      .prepare(`
        DELETE FROM user_keyword_subscriptions
        WHERE id = ? AND user_id = ?
      `)
      .bind(keywordId, userId)
      .run()
  }

  // ===== 뉴스 북마크 =====

  async addNewsBookmark(userId: number, newsId: number): Promise<void> {
    await this.db
      .prepare(`
        INSERT INTO user_news_bookmarks (user_id, news_id)
        VALUES (?, ?)
        ON CONFLICT(user_id, news_id) DO NOTHING
      `)
      .bind(userId, newsId)
      .run()
  }

  async getNewsBookmarks(
    userId: number, 
    page: number = 1, 
    limit: number = 20
  ): Promise<{ bookmarks: UserNewsBookmark[], total: number }> {
    const offset = (page - 1) * limit

    const [bookmarks, totalResult] = await Promise.all([
      this.db
        .prepare(`
          SELECT 
            b.id,
            b.user_id,
            b.news_id,
            n.title,
            n.content,
            n.category,
            n.created_at,
            b.created_at as bookmarked_at
          FROM user_news_bookmarks b
          JOIN news n ON b.news_id = n.id
          WHERE b.user_id = ?
          ORDER BY b.created_at DESC
          LIMIT ? OFFSET ?
        `)
        .bind(userId, limit, offset)
        .all(),
      this.db
        .prepare(`SELECT COUNT(*) as count FROM user_news_bookmarks WHERE user_id = ?`)
        .bind(userId)
        .first()
    ])

    return {
      bookmarks: bookmarks.results as UserNewsBookmark[],
      total: (totalResult as any).count
    }
  }

  async removeNewsBookmark(userId: number, newsId: number): Promise<void> {
    await this.db
      .prepare(`
        DELETE FROM user_news_bookmarks
        WHERE user_id = ? AND news_id = ?
      `)
      .bind(userId, newsId)
      .run()
  }

  // ===== 뉴스 읽음 표시 =====

  async markNewsAsRead(userId: number, newsId: number): Promise<void> {
    await this.db
      .prepare(`
        INSERT INTO user_news_read (user_id, news_id)
        VALUES (?, ?)
        ON CONFLICT(user_id, news_id) DO NOTHING
      `)
      .bind(userId, newsId)
      .run()
  }

  // ===== 구독 키워드별 뉴스 조회 =====

  async getNewsByKeyword(
    userId: number,
    keyword: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ news: any[], total: number }> {
    const offset = (page - 1) * limit

    const [news, totalResult] = await Promise.all([
      this.db
        .prepare(`
          SELECT 
            n.id,
            n.title,
            n.content,
            n.category,
            n.created_at,
            CASE WHEN r.news_id IS NOT NULL THEN 1 ELSE 0 END as is_read,
            CASE WHEN b.news_id IS NOT NULL THEN 1 ELSE 0 END as is_bookmarked
          FROM news n
          LEFT JOIN user_news_read r ON n.id = r.news_id AND r.user_id = ?
          LEFT JOIN user_news_bookmarks b ON n.id = b.news_id AND b.user_id = ?
          WHERE (
            n.title LIKE ? OR 
            n.content LIKE ? OR
            n.keywords LIKE ?
          )
          ORDER BY n.created_at DESC
          LIMIT ? OFFSET ?
        `)
        .bind(
          userId, 
          userId, 
          `%${keyword}%`, 
          `%${keyword}%`, 
          `%${keyword}%`,
          limit, 
          offset
        )
        .all(),
      this.db
        .prepare(`
          SELECT COUNT(*) as count FROM news
          WHERE title LIKE ? OR content LIKE ? OR keywords LIKE ?
        `)
        .bind(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
        .first()
    ])

    return {
      news: news.results,
      total: (totalResult as any).count
    }
  }

  // ===== 게임 점수 =====

  async saveGameScore(
    userId: number,
    gameType: string,
    score: number,
    gameData?: object
  ): Promise<{ rank: number, percentile: number }> {
    // 점수 저장
    await this.db
      .prepare(`
        INSERT INTO user_game_scores (user_id, game_type, score, game_data)
        VALUES (?, ?, ?, ?)
      `)
      .bind(userId, gameType, score, gameData ? JSON.stringify(gameData) : null)
      .run()

    // 순위 계산
    const rankResult = await this.db
      .prepare(`
        SELECT 
          COUNT(*) + 1 as rank,
          (SELECT COUNT(DISTINCT user_id) FROM user_game_scores WHERE game_type = ?) as total_players
        FROM (
          SELECT user_id, MAX(score) as max_score
          FROM user_game_scores
          WHERE game_type = ?
          GROUP BY user_id
        ) scores
        WHERE max_score > ?
      `)
      .bind(gameType, gameType, score)
      .first()

    const rank = (rankResult as any).rank
    const totalPlayers = (rankResult as any).total_players
    const percentile = ((rank / totalPlayers) * 100).toFixed(1)

    return { rank, percentile: parseFloat(percentile) }
  }

  async getGameStats(userId: number): Promise<Record<string, GameStats>> {
    const games = ['tetris', 'snake', '2048']
    const stats: Record<string, GameStats> = {}

    for (const gameType of games) {
      const result = await this.db
        .prepare(`
          SELECT 
            MAX(score) as best_score,
            AVG(score) as average_score,
            COUNT(*) as play_count,
            MAX(played_at) as last_played
          FROM user_game_scores
          WHERE user_id = ? AND game_type = ?
        `)
        .bind(userId, gameType)
        .first()

      if (result && (result as any).play_count > 0) {
        const bestScore = (result as any).best_score

        // 순위 계산
        const rankResult = await this.db
          .prepare(`
            SELECT 
              COUNT(*) + 1 as rank,
              (SELECT COUNT(DISTINCT user_id) FROM user_game_scores WHERE game_type = ?) as total_players
            FROM (
              SELECT user_id, MAX(score) as max_score
              FROM user_game_scores
              WHERE game_type = ?
              GROUP BY user_id
            ) scores
            WHERE max_score > ?
          `)
          .bind(gameType, gameType, bestScore)
          .first()

        const rank = (rankResult as any).rank
        const totalPlayers = (rankResult as any).total_players
        const percentile = ((rank / totalPlayers) * 100).toFixed(1)

        stats[gameType] = {
          best_score: bestScore,
          average_score: Math.round((result as any).average_score),
          play_count: (result as any).play_count,
          rank,
          percentile: parseFloat(percentile),
          last_played: (result as any).last_played
        }
      }
    }

    return stats
  }

  async getLeaderboard(
    gameType: string,
    limit: number = 100,
    userId?: number
  ): Promise<{ leaderboard: LeaderboardEntry[], userRank?: number, totalPlayers: number }> {
    // 리더보드 조회
    const leaderboard = await this.db
      .prepare(`
        SELECT 
          ROW_NUMBER() OVER (ORDER BY max_score DESC) as rank,
          user_id,
          u.name as user_name,
          max_score as score,
          played_at
        FROM (
          SELECT 
            user_id,
            MAX(score) as max_score,
            MAX(played_at) as played_at
          FROM user_game_scores
          WHERE game_type = ?
          GROUP BY user_id
        ) scores
        JOIN users u ON scores.user_id = u.id
        ORDER BY max_score DESC
        LIMIT ?
      `)
      .bind(gameType, limit)
      .all()

    const totalPlayersResult = await this.db
      .prepare(`SELECT COUNT(DISTINCT user_id) as count FROM user_game_scores WHERE game_type = ?`)
      .bind(gameType)
      .first()

    const entries: LeaderboardEntry[] = (leaderboard.results as any[]).map(row => ({
      rank: row.rank,
      user_id: row.user_id,
      user_name: row.user_name,
      score: row.score,
      played_at: row.played_at,
      is_current_user: userId ? row.user_id === userId : false
    }))

    // 현재 사용자 순위 조회
    let userRank: number | undefined
    if (userId) {
      const userBestScore = await this.db
        .prepare(`SELECT MAX(score) as max_score FROM user_game_scores WHERE user_id = ? AND game_type = ?`)
        .bind(userId, gameType)
        .first()

      if (userBestScore && (userBestScore as any).max_score) {
        const rankResult = await this.db
          .prepare(`
            SELECT COUNT(*) + 1 as rank
            FROM (
              SELECT user_id, MAX(score) as max_score
              FROM user_game_scores
              WHERE game_type = ?
              GROUP BY user_id
            ) scores
            WHERE max_score > ?
          `)
          .bind(gameType, (userBestScore as any).max_score)
          .first()

        userRank = (rankResult as any).rank
      }
    }

    return {
      leaderboard: entries,
      userRank,
      totalPlayers: (totalPlayersResult as any).count
    }
  }

  // ===== 유틸 설정 =====

  async saveUtilSetting(userId: number, settingKey: string, settingValue: object): Promise<void> {
    await this.db
      .prepare(`
        INSERT INTO user_util_settings (user_id, setting_key, setting_value, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, setting_key) 
        DO UPDATE SET setting_value = excluded.setting_value, updated_at = CURRENT_TIMESTAMP
      `)
      .bind(userId, settingKey, JSON.stringify(settingValue))
      .run()
  }

  async getUtilSettings(userId: number): Promise<Record<string, any>> {
    const result = await this.db
      .prepare(`
        SELECT setting_key, setting_value
        FROM user_util_settings
        WHERE user_id = ?
      `)
      .bind(userId)
      .all()

    const settings: Record<string, any> = {}
    for (const row of result.results as any[]) {
      settings[row.setting_key] = JSON.parse(row.setting_value)
    }

    return settings
  }

  // ===== 유틸 히스토리 =====

  async saveUtilHistory(
    userId: number,
    utilType: string,
    inputData: object,
    resultData?: object
  ): Promise<void> {
    await this.db
      .prepare(`
        INSERT INTO user_util_history (user_id, util_type, input_data, result_data)
        VALUES (?, ?, ?, ?)
      `)
      .bind(
        userId, 
        utilType, 
        JSON.stringify(inputData), 
        resultData ? JSON.stringify(resultData) : null
      )
      .run()
  }

  async getUtilHistory(
    userId: number,
    utilType?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ history: any[], total: number }> {
    const offset = (page - 1) * limit

    const query = utilType
      ? `WHERE user_id = ? AND util_type = ?`
      : `WHERE user_id = ?`

    const [history, totalResult] = await Promise.all([
      this.db
        .prepare(`
          SELECT id, util_type, input_data, result_data, created_at
          FROM user_util_history
          ${query}
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?
        `)
        .bind(...(utilType ? [userId, utilType, limit, offset] : [userId, limit, offset]))
        .all(),
      this.db
        .prepare(`SELECT COUNT(*) as count FROM user_util_history ${query}`)
        .bind(...(utilType ? [userId, utilType] : [userId]))
        .first()
    ])

    return {
      history: history.results.map((row: any) => ({
        id: row.id,
        util_type: row.util_type,
        input_data: JSON.parse(row.input_data),
        result_data: row.result_data ? JSON.parse(row.result_data) : null,
        created_at: row.created_at
      })),
      total: (totalResult as any).count
    }
  }

  async deleteUtilHistory(userId: number, historyId: number): Promise<void> {
    await this.db
      .prepare(`
        DELETE FROM user_util_history
        WHERE id = ? AND user_id = ?
      `)
      .bind(historyId, userId)
      .run()
  }
}
```

### 3. 컨트롤러 레이어

위 서비스 레이어에 추가로 **주식 관련 메서드**를 구현해야 합니다:

```typescript
// MyPageService 클래스에 추가할 메서드들

export class MyPageService {
  // ... 기존 메서드들 ...

  // ===== 주식 관심 종목 관리 =====

  async addWatchlistStock(
    userId: number,
    stockSymbol: string,
    stockName: string,
    marketType: string,
    targetPrice?: number,
    memo?: string
  ): Promise<void> {
    await this.db
      .prepare(`
        INSERT INTO user_watchlist_stocks (
          user_id, stock_symbol, stock_name, market_type, target_price, memo
        )
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, stock_symbol) DO UPDATE 
        SET target_price = excluded.target_price, memo = excluded.memo
      `)
      .bind(userId, stockSymbol, stockName, marketType, targetPrice, memo)
      .run()
  }

  async getWatchlistStocks(userId: number): Promise<UserWatchlistStock[]> {
    const result = await this.db
      .prepare(`
        SELECT 
          id, user_id, stock_symbol, stock_name, 
          market_type, target_price, memo, added_at
        FROM user_watchlist_stocks
        WHERE user_id = ?
        ORDER BY added_at DESC
      `)
      .bind(userId)
      .all()

    return result.results as UserWatchlistStock[]
  }

  async updateWatchlistStock(
    userId: number,
    stockId: number,
    targetPrice?: number,
    memo?: string
  ): Promise<void> {
    await this.db
      .prepare(`
        UPDATE user_watchlist_stocks
        SET target_price = ?, memo = ?
        WHERE id = ? AND user_id = ?
      `)
      .bind(targetPrice, memo, stockId, userId)
      .run()
  }

  async removeWatchlistStock(userId: number, stockId: number): Promise<void> {
    await this.db
      .prepare(`
        DELETE FROM user_watchlist_stocks
        WHERE id = ? AND user_id = ?
      `)
      .bind(stockId, userId)
      .run()
  }

  // ===== 주식 알림 =====

  async addStockAlert(
    userId: number,
    stockSymbol: string,
    alertType: string,
    targetPrice: number
  ): Promise<void> {
    await this.db
      .prepare(`
        INSERT INTO user_stock_alerts (
          user_id, stock_symbol, alert_type, target_price
        )
        VALUES (?, ?, ?, ?)
      `)
      .bind(userId, stockSymbol, alertType, targetPrice)
      .run()
  }

  async getStockAlerts(userId: number): Promise<StockAlert[]> {
    const result = await this.db
      .prepare(`
        SELECT 
          a.id, a.user_id, a.stock_symbol, w.stock_name,
          a.alert_type, a.target_price, a.is_triggered, 
          a.triggered_at, a.created_at
        FROM user_stock_alerts a
        LEFT JOIN user_watchlist_stocks w 
          ON a.stock_symbol = w.stock_symbol AND a.user_id = w.user_id
        WHERE a.user_id = ? AND a.is_triggered = 0
        ORDER BY a.created_at DESC
      `)
      .bind(userId)
      .all()

    return result.results as StockAlert[]
  }

  async deleteStockAlert(userId: number, alertId: number): Promise<void> {
    await this.db
      .prepare(`
        DELETE FROM user_stock_alerts
        WHERE id = ? AND user_id = ?
      `)
      .bind(alertId, userId)
      .run()
  }

  // ===== 포트폴리오 통계 =====

  async getWatchlistStats(userId: number): Promise<WatchlistStats> {
    // 총 종목 수 및 시장별 분포
    const distributionResult = await this.db
      .prepare(`
        SELECT 
          COUNT(*) as total_stocks,
          SUM(CASE WHEN market_type = 'US' THEN 1 ELSE 0 END) as us_count,
          SUM(CASE WHEN market_type = 'KR' THEN 1 ELSE 0 END) as kr_count
        FROM user_watchlist_stocks
        WHERE user_id = ?
      `)
      .bind(userId)
      .first()

    const dist = distributionResult as any

    return {
      total_stocks: dist.total_stocks || 0,
      market_distribution: {
        US: dist.us_count || 0,
        KR: dist.kr_count || 0
      },
      overall_change_percent: 0, // 실시간 가격 API에서 계산
      top_gainer: undefined,
      top_loser: undefined
    }
  }
}
```

### 3. 컨트롤러 레이어 (주식 관련 추가)

```typescript
// src/controllers/mypage.controller.ts

import { Context } from 'hono'
import { MyPageService } from '../services/mypage.service'
import { AppError, ErrorCodes } from '../middleware/errors'
import { logger } from '../middleware/logger'
import type { Bindings } from '../types/bindings.types'

export class MyPageController {
  // ===== 키워드 구독 =====

  static async addKeyword(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const { keyword } = await c.req.json()
      
      if (!keyword || keyword.trim().length === 0) {
        throw new AppError('키워드를 입력해주세요', 400, ErrorCodes.VALIDATION_ERROR)
      }

      const service = new MyPageService(c.env.DB)
      await service.addKeywordSubscription(user.id, keyword.trim())

      logger.info('Keyword subscription added', { userId: user.id, keyword })

      return c.json({
        success: true,
        message: '키워드가 추가되었습니다'
      })
    } catch (error) {
      logger.error('Failed to add keyword subscription', error)
      throw error
    }
  }

  static async getKeywords(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const service = new MyPageService(c.env.DB)
      const keywords = await service.getKeywordSubscriptions(user.id)

      return c.json({
        success: true,
        keywords
      })
    } catch (error) {
      logger.error('Failed to get keyword subscriptions', error)
      throw error
    }
  }

  static async deleteKeyword(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const keywordId = parseInt(c.req.param('keywordId'))
      
      if (isNaN(keywordId)) {
        throw new AppError('잘못된 키워드 ID입니다', 400, ErrorCodes.VALIDATION_ERROR)
      }

      const service = new MyPageService(c.env.DB)
      await service.removeKeywordSubscription(user.id, keywordId)

      logger.info('Keyword subscription removed', { userId: user.id, keywordId })

      return c.json({
        success: true,
        message: '키워드가 삭제되었습니다'
      })
    } catch (error) {
      logger.error('Failed to delete keyword subscription', error)
      throw error
    }
  }

  // ===== 뉴스 북마크 =====

  static async addBookmark(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const { news_id } = await c.req.json()
      
      if (!news_id || isNaN(news_id)) {
        throw new AppError('잘못된 뉴스 ID입니다', 400, ErrorCodes.VALIDATION_ERROR)
      }

      const service = new MyPageService(c.env.DB)
      await service.addNewsBookmark(user.id, news_id)

      logger.info('News bookmarked', { userId: user.id, newsId: news_id })

      return c.json({
        success: true,
        message: '북마크에 추가되었습니다'
      })
    } catch (error) {
      logger.error('Failed to add news bookmark', error)
      throw error
    }
  }

  static async getBookmarks(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const page = parseInt(c.req.query('page') || '1')
      const limit = parseInt(c.req.query('limit') || '20')

      const service = new MyPageService(c.env.DB)
      const { bookmarks, total } = await service.getNewsBookmarks(user.id, page, limit)

      return c.json({
        success: true,
        bookmarks,
        total,
        page,
        limit
      })
    } catch (error) {
      logger.error('Failed to get news bookmarks', error)
      throw error
    }
  }

  static async deleteBookmark(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const newsId = parseInt(c.req.param('newsId'))
      
      if (isNaN(newsId)) {
        throw new AppError('잘못된 뉴스 ID입니다', 400, ErrorCodes.VALIDATION_ERROR)
      }

      const service = new MyPageService(c.env.DB)
      await service.removeNewsBookmark(user.id, newsId)

      logger.info('News bookmark removed', { userId: user.id, newsId })

      return c.json({
        success: true,
        message: '북마크가 삭제되었습니다'
      })
    } catch (error) {
      logger.error('Failed to delete news bookmark', error)
      throw error
    }
  }

  // ===== 키워드별 뉴스 조회 =====

  static async getNewsByKeyword(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const keyword = c.req.query('keyword')
      if (!keyword) {
        throw new AppError('키워드를 입력해주세요', 400, ErrorCodes.VALIDATION_ERROR)
      }

      const page = parseInt(c.req.query('page') || '1')
      const limit = parseInt(c.req.query('limit') || '10')

      const service = new MyPageService(c.env.DB)
      const { news, total } = await service.getNewsByKeyword(user.id, keyword, page, limit)

      return c.json({
        success: true,
        keyword,
        news,
        total,
        page,
        limit
      })
    } catch (error) {
      logger.error('Failed to get news by keyword', error)
      throw error
    }
  }

  // ===== 뉴스 읽음 표시 =====

  static async markNewsAsRead(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const { news_id } = await c.req.json()
      
      if (!news_id || isNaN(news_id)) {
        throw new AppError('잘못된 뉴스 ID입니다', 400, ErrorCodes.VALIDATION_ERROR)
      }

      const service = new MyPageService(c.env.DB)
      await service.markNewsAsRead(user.id, news_id)

      return c.json({
        success: true,
        message: '읽음으로 표시되었습니다'
      })
    } catch (error) {
      logger.error('Failed to mark news as read', error)
      throw error
    }
  }

  // ===== 게임 점수 =====

  static async saveGameScore(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const { game_type, score, game_data } = await c.req.json()
      
      if (!game_type || !score || isNaN(score)) {
        throw new AppError('잘못된 게임 데이터입니다', 400, ErrorCodes.VALIDATION_ERROR)
      }

      const service = new MyPageService(c.env.DB)
      const { rank, percentile } = await service.saveGameScore(user.id, game_type, score, game_data)

      logger.info('Game score saved', { 
        userId: user.id, 
        gameType: game_type, 
        score, 
        rank, 
        percentile 
      })

      return c.json({
        success: true,
        message: '점수가 저장되었습니다',
        rank,
        percentile
      })
    } catch (error) {
      logger.error('Failed to save game score', error)
      throw error
    }
  }

  static async getGameStats(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const service = new MyPageService(c.env.DB)
      const stats = await service.getGameStats(user.id)

      return c.json({
        success: true,
        stats
      })
    } catch (error) {
      logger.error('Failed to get game stats', error)
      throw error
    }
  }

  static async getLeaderboard(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      const gameType = c.req.query('game_type')
      const limit = parseInt(c.req.query('limit') || '100')

      if (!gameType) {
        throw new AppError('게임 타입을 입력해주세요', 400, ErrorCodes.VALIDATION_ERROR)
      }

      const service = new MyPageService(c.env.DB)
      const result = await service.getLeaderboard(gameType, limit, user?.id)

      return c.json({
        success: true,
        game_type: gameType,
        ...result
      })
    } catch (error) {
      logger.error('Failed to get leaderboard', error)
      throw error
    }
  }

  // ===== 유틸 설정 =====

  static async saveUtilSettings(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const { setting_key, setting_value } = await c.req.json()
      
      if (!setting_key || !setting_value) {
        throw new AppError('설정 키와 값을 입력해주세요', 400, ErrorCodes.VALIDATION_ERROR)
      }

      const service = new MyPageService(c.env.DB)
      await service.saveUtilSetting(user.id, setting_key, setting_value)

      logger.info('Util setting saved', { userId: user.id, settingKey: setting_key })

      return c.json({
        success: true,
        message: '설정이 저장되었습니다'
      })
    } catch (error) {
      logger.error('Failed to save util settings', error)
      throw error
    }
  }

  static async getUtilSettings(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const service = new MyPageService(c.env.DB)
      const settings = await service.getUtilSettings(user.id)

      return c.json({
        success: true,
        settings
      })
    } catch (error) {
      logger.error('Failed to get util settings', error)
      throw error
    }
  }

  // ===== 유틸 히스토리 =====

  static async saveUtilHistory(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const { util_type, input_data, result_data } = await c.req.json()
      
      if (!util_type || !input_data) {
        throw new AppError('유틸 타입과 입력 데이터를 입력해주세요', 400, ErrorCodes.VALIDATION_ERROR)
      }

      const service = new MyPageService(c.env.DB)
      await service.saveUtilHistory(user.id, util_type, input_data, result_data)

      return c.json({
        success: true,
        message: '히스토리가 저장되었습니다'
      })
    } catch (error) {
      logger.error('Failed to save util history', error)
      throw error
    }
  }

  static async getUtilHistory(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const utilType = c.req.query('util_type')
      const page = parseInt(c.req.query('page') || '1')
      const limit = parseInt(c.req.query('limit') || '20')

      const service = new MyPageService(c.env.DB)
      const { history, total } = await service.getUtilHistory(user.id, utilType, page, limit)

      return c.json({
        success: true,
        util_type: utilType,
        history,
        total,
        page,
        limit
      })
    } catch (error) {
      logger.error('Failed to get util history', error)
      throw error
    }
  }

  static async deleteUtilHistory(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const historyId = parseInt(c.req.param('historyId'))
      
      if (isNaN(historyId)) {
        throw new AppError('잘못된 히스토리 ID입니다', 400, ErrorCodes.VALIDATION_ERROR)
      }

      const service = new MyPageService(c.env.DB)
      await service.deleteUtilHistory(user.id, historyId)

      logger.info('Util history deleted', { userId: user.id, historyId })

      return c.json({
        success: true,
        message: '히스토리가 삭제되었습니다'
      })
    } catch (error) {
      logger.error('Failed to delete util history', error)
      throw error
    }
  }
}
```

위 컨트롤러에 추가로 **주식 관련 핸들러**를 구현해야 합니다:

```typescript
export class MyPageController {
  // ... 기존 핸들러들 ...

  // ===== 주식 관심 종목 =====

  static async addWatchlistStock(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const { stock_symbol, stock_name, market_type, target_price, memo } = await c.req.json()
      
      if (!stock_symbol || !stock_name || !market_type) {
        throw new AppError('종목 정보를 모두 입력해주세요', 400, ErrorCodes.VALIDATION_ERROR)
      }

      const service = new MyPageService(c.env.DB)
      await service.addWatchlistStock(
        user.id, 
        stock_symbol, 
        stock_name, 
        market_type, 
        target_price, 
        memo
      )

      logger.info('Stock added to watchlist', { 
        userId: user.id, 
        stockSymbol: stock_symbol 
      })

      return c.json({
        success: true,
        message: '관심 종목에 추가되었습니다'
      })
    } catch (error) {
      logger.error('Failed to add stock to watchlist', error)
      throw error
    }
  }

  static async getWatchlistStocks(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const service = new MyPageService(c.env.DB)
      const stocks = await service.getWatchlistStocks(user.id)

      // TODO: 실시간 가격 정보는 외부 API 호출로 추가
      // 현재는 DB에 저장된 기본 정보만 반환

      return c.json({
        success: true,
        stocks
      })
    } catch (error) {
      logger.error('Failed to get watchlist stocks', error)
      throw error
    }
  }

  static async updateWatchlistStock(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const stockId = parseInt(c.req.param('stockId'))
      if (isNaN(stockId)) {
        throw new AppError('잘못된 종목 ID입니다', 400, ErrorCodes.VALIDATION_ERROR)
      }

      const { target_price, memo } = await c.req.json()

      const service = new MyPageService(c.env.DB)
      await service.updateWatchlistStock(user.id, stockId, target_price, memo)

      logger.info('Watchlist stock updated', { userId: user.id, stockId })

      return c.json({
        success: true,
        message: '종목 정보가 수정되었습니다'
      })
    } catch (error) {
      logger.error('Failed to update watchlist stock', error)
      throw error
    }
  }

  static async deleteWatchlistStock(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const stockId = parseInt(c.req.param('stockId'))
      if (isNaN(stockId)) {
        throw new AppError('잘못된 종목 ID입니다', 400, ErrorCodes.VALIDATION_ERROR)
      }

      const service = new MyPageService(c.env.DB)
      await service.removeWatchlistStock(user.id, stockId)

      logger.info('Stock removed from watchlist', { userId: user.id, stockId })

      return c.json({
        success: true,
        message: '관심 종목에서 삭제되었습니다'
      })
    } catch (error) {
      logger.error('Failed to delete watchlist stock', error)
      throw error
    }
  }

  // ===== 주식 알림 =====

  static async addStockAlert(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const { stock_symbol, alert_type, target_price } = await c.req.json()
      
      if (!stock_symbol || !alert_type || !target_price) {
        throw new AppError('알림 정보를 모두 입력해주세요', 400, ErrorCodes.VALIDATION_ERROR)
      }

      if (!['above', 'below'].includes(alert_type)) {
        throw new AppError('잘못된 알림 타입입니다', 400, ErrorCodes.VALIDATION_ERROR)
      }

      const service = new MyPageService(c.env.DB)
      await service.addStockAlert(user.id, stock_symbol, alert_type, target_price)

      logger.info('Stock alert added', { 
        userId: user.id, 
        stockSymbol: stock_symbol, 
        alertType: alert_type,
        targetPrice: target_price
      })

      return c.json({
        success: true,
        message: '가격 알림이 설정되었습니다'
      })
    } catch (error) {
      logger.error('Failed to add stock alert', error)
      throw error
    }
  }

  static async getStockAlerts(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const service = new MyPageService(c.env.DB)
      const alerts = await service.getStockAlerts(user.id)

      // TODO: 현재가 정보는 실시간 API에서 가져와서 추가

      return c.json({
        success: true,
        alerts
      })
    } catch (error) {
      logger.error('Failed to get stock alerts', error)
      throw error
    }
  }

  static async deleteStockAlert(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const alertId = parseInt(c.req.param('alertId'))
      if (isNaN(alertId)) {
        throw new AppError('잘못된 알림 ID입니다', 400, ErrorCodes.VALIDATION_ERROR)
      }

      const service = new MyPageService(c.env.DB)
      await service.deleteStockAlert(user.id, alertId)

      logger.info('Stock alert deleted', { userId: user.id, alertId })

      return c.json({
        success: true,
        message: '알림이 삭제되었습니다'
      })
    } catch (error) {
      logger.error('Failed to delete stock alert', error)
      throw error
    }
  }

  // ===== 포트폴리오 통계 =====

  static async getWatchlistStats(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const service = new MyPageService(c.env.DB)
      const stats = await service.getWatchlistStats(user.id)

      // TODO: 실시간 가격 정보를 기반으로 overall_change_percent, 
      // top_gainer, top_loser 계산

      return c.json({
        success: true,
        stats
      })
    } catch (error) {
      logger.error('Failed to get watchlist stats', error)
      throw error
    }
  }
}
```

---

## 📅 구현 순서 및 일정

### Week 1: 데이터베이스 및 API 기초 (6일)

#### Day 1: 데이터베이스 마이그레이션
- [ ] 8개 테이블 마이그레이션 파일 생성 (기존 6개 + 주식 2개)
- [ ] 로컬 D1 데이터베이스에 마이그레이션 적용
- [ ] 테이블 구조 검증 및 인덱스 확인

#### Day 2-3: 뉴스 관련 API 구현
- [ ] 타입 정의 (`mypage.types.ts`)
- [ ] MyPageService의 뉴스 관련 메서드 구현
- [ ] MyPageController의 뉴스 관련 핸들러 구현
- [ ] API 라우트 등록 (`index.tsx`)
- [ ] 로컬 테스트 (curl 또는 Postman)

#### Day 4: 주식 관련 API 구현 ⭐ NEW
- [ ] MyPageService의 주식 관련 메서드 구현
- [ ] MyPageController의 주식 관련 핸들러 구현
- [ ] 실시간 가격 조회 통합 (기존 Yahoo Finance API 활용)
- [ ] API 라우트 등록 및 테스트

#### Day 5: 게임 관련 API 구현
- [ ] MyPageService의 게임 관련 메서드 구현
- [ ] MyPageController의 게임 관련 핸들러 구현
- [ ] 리더보드 순위 계산 로직 구현
- [ ] API 라우트 등록 및 테스트

#### Day 6: 유틸 관련 API 구현
- [ ] MyPageService의 유틸 관련 메서드 구현
- [ ] MyPageController의 유틸 관련 핸들러 구현
- [ ] API 라우트 등록 및 테스트
- [ ] 전체 API 통합 테스트

### Week 2: 프론트엔드 UI 구현 (6일)

#### Day 7: 마이페이지 기본 레이아웃
- [ ] `/mypage` 페이지 라우트 생성
- [ ] 사이드바 네비게이션 구현
- [ ] 섹션 전환 기능 구현
- [ ] 반응형 레이아웃 적용

#### Day 8-9: 뉴스 섹션 UI
- [ ] 구독 키워드 관리 UI
- [ ] 키워드별 뉴스 표시 UI
- [ ] 북마크 목록 UI
- [ ] 읽음/안 읽음 표시 UI
- [ ] API 연동 및 기능 테스트

#### Day 10: 주식 섹션 UI ⭐ NEW
- [ ] 관심 종목 목록 표시
- [ ] 실시간 가격 및 등락률 표시
- [ ] 미니 차트 구현
- [ ] 종목 추가/수정/삭제 UI
- [ ] 알림 설정 UI
- [ ] 포트폴리오 통계 대시보드
- [ ] API 연동 및 기능 테스트

#### Day 11: 게임 섹션 UI
- [ ] 게임 통계 대시보드
- [ ] 게임별 상세 통계 카드
- [ ] 리더보드 표시
- [ ] 최근 플레이 기록
- [ ] API 연동 및 기능 테스트

#### Day 12: 유틸 섹션 UI
- [ ] 즐겨찾기 도구 UI
- [ ] 설정 관리 UI
- [ ] 사용 히스토리 UI
- [ ] API 연동 및 기능 테스트

### Week 3: 통합 및 최적화 (3일)

#### Day 13: 기능 통합 및 버그 수정
- [ ] 전체 기능 통합 테스트
- [ ] 버그 수정 및 예외 처리 강화
- [ ] 로딩 상태 및 에러 메시지 개선

#### Day 14: 성능 최적화
- [ ] 데이터베이스 쿼리 최적화
- [ ] 페이지네이션 성능 개선
- [ ] 캐싱 전략 적용 (필요 시)
- [ ] 실시간 가격 업데이트 최적화

#### Day 15: 배포 및 최종 테스트
- [ ] Cloudflare Pages 배포
- [ ] 프로덕션 환경 테스트
- [ ] 사용자 피드백 수집 준비
- [ ] 문서화 (README 업데이트)

---

## 🔐 보안 고려사항

1. **인증 및 권한**
   - 모든 API는 `requireAuth` 미들웨어 사용
   - 사용자는 자신의 데이터만 접근 가능
   - SQL Injection 방어 (Prepared Statements 사용)

2. **입력 검증**
   - 모든 사용자 입력은 검증 필수
   - XSS 방어를 위한 HTML 이스케이프
   - 유효하지 않은 데이터 거부

3. **데이터 보호**
   - 민감한 정보 로깅 금지
   - 사용자 간 데이터 격리 (user_id 필터링)
   - CASCADE DELETE로 사용자 삭제 시 관련 데이터 자동 삭제

---

## 📈 향후 개선 사항

1. **뉴스 섹션**
   - 키워드 자동 추천 기능
   - 뉴스 요약 기능 (AI 활용)
   - 관련 뉴스 추천 알고리즘

2. **주식 섹션** ⭐ NEW
   - 실시간 알림 시스템 (웹푸시, 이메일)
   - 종목 비교 기능
   - 기술적 지표 추가 (RSI, MACD 등)
   - 뉴스와 주식 연동 (관련 뉴스 자동 표시)
   - 포트폴리오 수익률 추적

3. **게임 섹션**
   - 도전 과제 (Achievements) 시스템
   - 친구 대결 기능
   - 게임 리플레이 기능

4. **유틸 섹션**
   - 즐겨찾기 도구 커스터마이징
   - 히스토리 검색 기능
   - 데이터 내보내기 (CSV, JSON)

5. **전체**
   - 알림 시스템 (새 뉴스, 순위 변동, 주가 알림)
   - 소셜 공유 기능
   - 다크 모드 지원

---

## ✅ 체크리스트

### Phase 1: 백엔드 구현
- [ ] 데이터베이스 마이그레이션 완료
- [ ] 타입 정의 완료
- [ ] 서비스 레이어 구현 완료
- [ ] 컨트롤러 레이어 구현 완료
- [ ] API 라우트 등록 완료
- [ ] API 테스트 완료

### Phase 2: 프론트엔드 구현
- [ ] 마이페이지 레이아웃 완료
- [ ] 뉴스 섹션 UI 완료
- [ ] 주식 섹션 UI 완료 ⭐ NEW
- [ ] 게임 섹션 UI 완료
- [ ] 유틸 섹션 UI 완료
- [ ] API 연동 완료
- [ ] UI/UX 테스트 완료

### Phase 3: 통합 및 배포
- [ ] 통합 테스트 완료
- [ ] 버그 수정 완료
- [ ] 성능 최적화 완료
- [ ] Cloudflare Pages 배포 완료
- [ ] 프로덕션 테스트 완료
- [ ] 문서화 완료

---

## 🚀 시작하기

이 플랜을 바탕으로 구현을 시작하시겠습니까?

다음 단계 옵션:
1. **전체 진행**: Week 1부터 시작 (데이터베이스 마이그레이션)
2. **부분 진행**: 특정 섹션만 먼저 구현 (예: 주식 섹션 우선, 뉴스 섹션만 등)
3. **플랜 수정**: 특정 부분 조정 또는 추가 기능 제안

## 📊 주요 변경사항 요약

### 추가된 기능
1. **주식 섹션 (완전 신규)**
   - 관심 종목 관리 (추가/수정/삭제)
   - 실시간 가격 및 등락률 표시
   - 미니 차트 (가격 추이)
   - 가격 알림 시스템
   - 종목별 메모 기능
   - 포트폴리오 통계 대시보드

### 데이터베이스
- **추가 테이블**: 2개
  - `user_watchlist_stocks`: 관심 종목 저장
  - `user_stock_alerts`: 가격 알림 관리

### API 엔드포인트
- **추가 API**: 10개
  - 관심 종목: 4개 (추가, 조회, 수정, 삭제)
  - 실시간 가격: 2개 (일괄 조회, 상세 정보)
  - 가격 알림: 3개 (추가, 조회, 삭제)
  - 포트폴리오 통계: 1개

### 일정
- **전체 일정**: 13일 → 15일 (2일 추가)
- **Week 1**: 5일 → 6일 (주식 API 구현 1일 추가)
- **Week 2**: 5일 → 6일 (주식 UI 구현 1일 추가)
- **Week 3**: 3일 (변경 없음)

어떤 방식으로 진행하시겠습니까?
