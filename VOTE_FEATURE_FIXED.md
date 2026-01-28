# 좋아요/싫어요 투표 기능 수정 완료

## 문제 원인
1. **news_votes 테이블 부재**: 투표 데이터를 저장할 테이블이 없었음
2. **news 테이블 컬럼 부재**: vote_up, vote_down, popularity_score 컬럼 누락
3. **popularity_score 계산 오류**: 같은 UPDATE 문에서 변경 전 값 참조 문제

## 수정 사항

### 1. 데이터베이스 스키마 추가

#### news_votes 테이블
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
- **UNIQUE 제약**: 사용자당 뉴스당 1개의 투표만 가능

#### news 테이블 컬럼 추가
```sql
ALTER TABLE news ADD COLUMN vote_up INTEGER DEFAULT 0;
ALTER TABLE news ADD COLUMN vote_down INTEGER DEFAULT 0;
ALTER TABLE news ADD COLUMN popularity_score INTEGER DEFAULT 0;
```

### 2. API 로직 수정

#### popularity_score 계산 방식 변경
**기존 (오류)**:
```typescript
UPDATE news 
SET vote_up = vote_up + 1,
    popularity_score = vote_up - vote_down  // ❌ 변경 전 값 참조
WHERE id = ?
```

**수정 (정상)**:
```typescript
// 1단계: 투표 수 업데이트
UPDATE news 
SET vote_up = vote_up + 1
WHERE id = ?

// 2단계: popularity_score 계산 (별도 쿼리)
UPDATE news 
SET popularity_score = vote_up - vote_down  // ✅ 변경 후 값 참조
WHERE id = ?
```

### 3. 투표 동작 흐름

#### 신규 투표
1. news_votes에 INSERT (user_id, news_id, vote_type)
2. news의 해당 컬럼 증가 (vote_up 또는 vote_down)
3. popularity_score = vote_up - vote_down 재계산

#### 투표 취소
1. news_votes에서 DELETE
2. news의 해당 컬럼 감소
3. popularity_score 재계산

#### 투표 변경
1. news_votes의 vote_type UPDATE
2. news의 기존 컬럼 감소, 새 컬럼 증가
3. popularity_score 재계산

## 테스트 결과

```bash
=== 좋아요 투표 (newsId=83) ===
✅ vote_up: 1, vote_down: 0, popularity_score: 1

=== 같은 투표 다시 (취소) ===
✅ vote_up: 0, vote_down: 0, popularity_score: 0

=== 싫어요 투표 ===
✅ vote_up: 0, vote_down: 1, popularity_score: -1
```

## API 사용법

### POST /api/news/vote
```json
{
  "userId": 1,
  "newsId": 83,
  "voteType": "up"  // "up" 또는 "down"
}
```

**응답**:
```json
{
  "success": true,
  "vote_up": 1,
  "vote_down": 0,
  "popularity_score": 1
}
```

## 프론트엔드 연동

### 버튼 클릭 시
```javascript
async function vote(newsId, voteType) {
  const response = await fetch('/api/news/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: currentUserId,
      newsId: newsId,
      voteType: voteType  // 'up' or 'down'
    })
  });
  
  const data = await response.json();
  if (data.success) {
    // UI 업데이트
    updateVoteUI(newsId, data.vote_up, data.vote_down);
  }
}
```

### 투표 상태 표시
- **vote_up**: 좋아요 개수
- **vote_down**: 싫어요 개수
- **popularity_score**: 인기도 점수 (vote_up - vote_down)

## HOT 뉴스 정렬
```sql
SELECT * FROM news 
ORDER BY popularity_score DESC, created_at DESC
LIMIT 10
```

## 주의사항
1. **로그인 필수**: 투표는 로그인한 사용자만 가능
2. **중복 투표 방지**: user_id + news_id UNIQUE 제약
3. **투표 취소**: 같은 타입 다시 클릭 시 취소
4. **투표 변경**: 다른 타입 클릭 시 자동 변경

## 커밋 정보
- **커밋**: 271d2ed - Fix vote feature: add news_votes table and fix popularity_score calculation
- **변경 파일**: 
  - src/index.tsx (투표 API 로직)
  - faith-portal.db (테이블 추가)

## 배포
- **샌드박스**: https://3000-igqqzgkeu63c4u9ihulwt-c81df28e.sandbox.novita.ai
- **GitHub**: https://github.com/million-somang/faith_dev

## 다음 단계
- [ ] HOT 뉴스 페이지에서 popularity_score 기준 정렬 적용
- [ ] 투표 통계 대시보드 추가
- [ ] 사용자별 투표 이력 페이지
