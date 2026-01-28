# 마이페이지 북마크 문제 해결

## 문제 상황
- 마이페이지에서 북마크한 뉴스가 표시되지 않음
- API 응답: `bookmarks: Array(0)`, `total: 0`
- DB에는 북마크 데이터가 존재함

## 원인 분석

### 1. API는 정상 작동
```bash
# 테스트 결과: userId=1의 경우 5개 북마크 정상 반환
{
  "success": true,
  "bookmarks": [...5개...],
  "total": 5
}
```

### 2. 사용자 ID 불일치
- **테스트 계정**: test@example.com (userId: 1) - 북마크 5개 존재
- **브라우저 로그인**: 정석종 계정 (userId: ? - 다를 수 있음)
- 다른 사용자는 북마크가 없을 수 있음

## 해결 방법

### 방법 1: 올바른 계정으로 로그인
1. 브라우저에서 로그아웃
2. test@example.com / test1234로 로그인
3. 마이페이지 접속

### 방법 2: 현재 계정으로 북마크 추가
1. 뉴스 페이지에서 북마크 버튼 클릭
2. 마이페이지에서 확인

## 디버그 방법

### 브라우저 콘솔 확인
```javascript
// F12 > Console 탭에서 다음 로그 확인:
[MyPage] 현재 사용자: {user: {id: X, ...}}
[MyPage] 북마크 응답: {bookmarks: [...], total: N}
```

### 현재 사용자 ID 확인
- 콘솔에서 `[MyPage] 현재 사용자` 로그 확인
- `user.id`가 1이 아니면 다른 사용자

### DB에서 확인
```bash
# 사용자별 북마크 개수 확인
node -e "
const Database = require('better-sqlite3');
const db = new Database('faith-portal.db');
const counts = db.prepare('SELECT user_id, COUNT(*) as count FROM bookmarks GROUP BY user_id').all();
console.table(counts);
db.close();
"
```

## API 엔드포인트

### GET /api/user/bookmarks
- **인증**: requireAuth (로그인 필수)
- **파라미터**: 
  - page (기본값: 1)
  - limit (기본값: 20)
- **응답**:
  ```json
  {
    "success": true,
    "bookmarks": [
      {
        "id": 6,
        "user_id": 1,
        "news_id": 101,
        "title": "...",
        "summary": "...",
        "category": "entertainment",
        "created_at": "2026-01-28 15:36:13",
        "bookmarked_at": "2026-01-28 16:22:44"
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 10
  }
  ```

## 데이터 흐름

```
브라우저 → /api/user/bookmarks
  ↓
requireAuth 미들웨어 (세션 확인)
  ↓
MyPageController.getBookmarks
  ↓
MyPageService.getNewsBookmarks
  ↓
DB: SELECT b.*, n.* FROM bookmarks b JOIN news n WHERE b.user_id = ?
  ↓
응답: { bookmarks: [...], total: N }
```

## 테스트 계정 정보
- **이메일**: test@example.com
- **비밀번호**: test1234
- **userId**: 1
- **북마크**: 5개

## 주의사항
1. **로그인 필수**: requireAuth 미들웨어로 보호됨
2. **사용자별 데이터**: userId로 필터링
3. **쿠키 기반 인증**: 세션 쿠키 필요
4. **페이지네이션**: page, limit 파라미터로 제어

## 커밋 정보
- **5c7352d**: Add debug logs to MyPageService.getNewsBookmarks
- **17ab7d1**: Add current user info logging in mypage

## 다음 단계
1. 브라우저에서 현재 사용자 ID 확인
2. 필요시 올바른 계정으로 로그인
3. 북마크 추가 테스트
4. 마이페이지에서 확인

## 배포
- **샌드박스**: https://3000-igqqzgkeu63c4u9ihulwt-c81df28e.sandbox.novita.ai
- **마이페이지**: https://3000-igqqzgkeu63c4u9ihulwt-c81df28e.sandbox.novita.ai/mypage
- **GitHub**: https://github.com/million-somang/faith_dev
