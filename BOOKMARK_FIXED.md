# 북마크 기능 수정 완료

## 문제 원인
- **테이블 스키마와 API 불일치**: 
  - 실제 테이블: `bookmarks(id, user_id, news_id, bookmarked_at)`
  - 기존 API: `news_title`, `news_link`, `news_category` 등의 존재하지 않는 컬럼 사용
- **MyPageService의 잘못된 테이블명**: `user_news_bookmarks` → `bookmarks`

## 수정 사항

### 1. 백엔드 API 수정
- **POST /api/bookmarks**: `newsId`만 받도록 간소화
  ```typescript
  // 이전: userId, title, link, category, source, pubDate
  // 이후: userId, newsId
  INSERT INTO bookmarks (user_id, news_id) VALUES (?, ?)
  ```

- **DELETE /api/bookmarks/:newsId**: `news_id`로 삭제하도록 변경
  ```typescript
  // 이전: WHERE id = ? (bookmarkId)
  // 이후: WHERE news_id = ? (newsId)
  DELETE FROM bookmarks WHERE news_id = ? AND user_id = ?
  ```

### 2. 프론트엔드 수정
- **toggleBookmark 함수**: 파라미터를 `newsId`만 받도록 간소화
  ```javascript
  // 이전: toggleBookmark(newsId, title, link, category, publisher, pubDate)
  // 이후: toggleBookmark(newsId)
  ```

- **API 호출**: `newsId`만 전달
  ```javascript
  body: JSON.stringify({
    userId: userId,
    newsId: newsId  // 이전에는 title, link, category 등도 전달
  })
  ```

### 3. MyPageService 수정
- 테이블명 변경: `user_news_bookmarks` → `bookmarks`
- 조인 쿼리 수정

## 테스트 결과
```bash
=== 북마크 추가 ===
✅ {"success": true, "message": "북마크에 추가되었습니다"}

=== 북마크 확인 ===
✅ {"success": true, "bookmarked": true, "bookmarkId": 1}

=== 북마크 목록 ===
✅ 북마크 개수: 1

=== 북마크 삭제 ===
✅ {"success": true, "message": "북마크가 삭제되었습니다"}

=== 삭제 후 확인 ===
✅ {"success": true, "bookmarked": false, "bookmarkId": null}
```

## 동작 흐름
1. 사용자가 뉴스 카드의 북마크 버튼 클릭
2. `toggleBookmark(newsId)` 호출
3. 북마크 상태 확인:
   - **추가**: POST /api/bookmarks → DB INSERT
   - **제거**: DELETE /api/bookmarks/:newsId → DB DELETE
4. UI 업데이트: 버튼에 'bookmarked' 클래스 추가/제거
5. 토스트 메시지 표시

## 마이페이지 연동
- 마이페이지 > 뉴스 탭에서 북마크한 뉴스 목록 확인 가능
- GET /api/user/bookmarks: 페이지네이션 지원 (기본 20개)
- 뉴스 정보는 bookmarks 테이블의 news_id로 news 테이블과 조인하여 조회

## 커밋 정보
- **커밋**: 967ed3c - Fix bookmark feature: use news_id instead of news details
- **변경 파일**: 
  - src/index.tsx (프론트엔드 및 백엔드 API)
  - src/services/mypage.service.ts (테이블명)

## 배포
- **샌드박스**: https://3000-igqqzgkeu63c4u9ihulwt-c81df28e.sandbox.novita.ai
- **GitHub**: https://github.com/million-somang/faith_dev

## 사용 방법
1. 뉴스 페이지에서 뉴스 카드의 북마크 아이콘(별 모양) 클릭
2. 로그인 상태에서만 사용 가능
3. 마이페이지 > 뉴스 탭에서 북마크 목록 확인

## 참고
- 북마크는 user_id와 news_id의 조합으로 UNIQUE 제약조건 설정
- 중복 북마크 시도 시: "이미 북마크에 추가된 뉴스입니다" 메시지
