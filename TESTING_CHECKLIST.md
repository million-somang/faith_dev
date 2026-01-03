# 스도쿠 점수 저장 완전 테스트 체크리스트

## ✅ 백엔드 검증 완료

### 1. 데이터베이스 상태
- [x] 테스트 사용자 존재: test@example.com (ID: 1)
- [x] sudoku_scores 테이블 구조 확인
  - id, user_id, time, difficulty, created_at
  - mistakes (추가됨)
  - player_name (추가됨)

### 2. API 엔드포인트 테스트

#### 로그인 API (`POST /api/login`)
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234"}'
```

**결과:**
- ✅ HTTP 200 OK
- ✅ Set-Cookie: user_id=1
- ✅ Set-Cookie: user_name=테스트 사용자
- ✅ Set-Cookie: auth_token=...
- ✅ JSON: {"success":true,"message":"로그인 성공"}

#### 점수 저장 API (`POST /api/sudoku/score`)
```bash
curl -X POST http://localhost:3000/api/sudoku/score \
  -H "Content-Type: application/json" \
  -H "Cookie: user_id=1; user_name=...; auth_token=..." \
  -d '{"difficulty":"easy","time":125,"mistakes":0}'
```

**결과:**
- ✅ HTTP 200 OK
- ✅ JSON: {"success":true,"message":"기록이 저장되었습니다"}

### 3. 데이터베이스 저장 확인
```sql
SELECT * FROM sudoku_scores ORDER BY created_at DESC LIMIT 1
```

**결과:**
- ✅ user_id: 1
- ✅ difficulty: "easy"
- ✅ time: 125
- ✅ mistakes: 0
- ✅ player_name: "테스트 사용자"
- ✅ created_at: 2026-01-03 13:35:20

## ✅ 프론트엔드 검증 완료

### 1. JavaScript 변수 및 함수 구조

렌더링된 HTML에서 확인:
```javascript
const difficulty = 'easy';  // ✅ 전역 변수로 정의됨

function generateSudoku() {
    // difficulty 사용 가능 ✅
}

async function saveScore() {
    const elapsed = getElapsedTime();
    
    await fetch('/api/sudoku/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
            difficulty: difficulty,  // ✅ 전역 변수 접근
            time: elapsed,
            mistakes: mistakes
        })
    });
}
```

### 2. 렌더링 확인
- ✅ `const difficulty = 'easy'` 스크립트 최상단에 위치
- ✅ saveScore() 함수에서 difficulty 접근 가능
- ✅ generateSudoku() 함수에서 difficulty 접근 가능

## 🎯 사용자 시나리오 테스트

### 시나리오 1: 정상 로그인 + 게임 완료 + 저장

1. **로그인**
   - URL: https://3000-igqqzgkeu63c4u9ihulwt-c81df28e.sandbox.novita.ai/login
   - 이메일: test@example.com
   - 비밀번호: test1234
   - 예상 결과: "로그인 성공!" 알림, 쿠키 3개 설정

2. **개발자 도구에서 쿠키 확인**
   - Application → Cookies
   - ✅ user_id=1
   - ✅ user_name=테스트 사용자
   - ✅ auth_token=...

3. **스도쿠 게임 시작**
   - URL: https://3000-igqqzgkeu63c4u9ihulwt-c81df28e.sandbox.novita.ai/game/simple/sudoku
   - "쉬움" 클릭 → `/play?difficulty=easy` 이동

4. **개발자 도구 Console에서 확인**
   ```javascript
   console.log(difficulty)  // "easy" 출력되어야 함
   ```

5. **게임 완료**
   - 모든 칸 채우기
   - "축하합니다!" 모달 표시

6. **기록 저장 클릭**
   - Console에 "🎯 Saving score..." 출력
   - Network 탭에서 `/api/sudoku/score` 요청 확인
     - Status: 200 OK
     - Response: {"success":true,"message":"기록이 저장되었습니다"}
   - "기록이 저장되었습니다!" 알림

### 시나리오 2: 비로그인 상태에서 저장 시도

1. **시크릿 모드**로 브라우저 열기
2. **스도쿠 게임 직접 접속**
   - URL: https://3000-igqqzgkeu63c4u9ihulwt-c81df28e.sandbox.novita.ai/game/simple/sudoku/play?difficulty=easy
3. **게임 완료 후 저장 클릭**
   - 예상 결과: "로그인이 필요합니다" 알림
   - 로그인 페이지로 이동 제안

## 🔧 디버깅 가이드

### Console에서 확인할 사항

1. **difficulty 변수 확인**
   ```javascript
   console.log(typeof difficulty)  // "string"
   console.log(difficulty)          // "easy", "medium", 또는 "hard"
   ```

2. **saveScore 함수 확인**
   ```javascript
   console.log(typeof saveScore)    // "function"
   ```

3. **쿠키 확인**
   ```javascript
   console.log(document.cookie)
   // "user_id=1; user_name=테스트%20사용자; auth_token=..."
   ```

### Network 탭에서 확인할 사항

1. **로그인 요청 (POST /api/login)**
   - Request Payload: {"email":"test@example.com","password":"test1234"}
   - Response Headers: Set-Cookie 3개
   - Response Body: {"success":true,...}

2. **점수 저장 요청 (POST /api/sudoku/score)**
   - Request Headers: Cookie 포함
   - Request Payload: {"difficulty":"easy","time":125,"mistakes":0}
   - Response Body: {"success":true,"message":"기록이 저장되었습니다"}

## 📊 최종 검증 결과

### curl 테스트 결과
```
==========================================
1. 로그인 테스트
==========================================
HTTP/1.1 200 OK ✅
Set-Cookie: user_id=1 ✅
Set-Cookie: user_name=테스트 사용자 ✅
Set-Cookie: auth_token=... ✅
{"success":true,"message":"로그인 성공"} ✅

==========================================
2. 점수 저장 테스트
==========================================
HTTP/1.1 200 OK ✅
{"success":true,"message":"기록이 저장되었습니다"} ✅

==========================================
3. DB 확인
==========================================
id: 2 ✅
user_id: 1 ✅
difficulty: "easy" ✅
time: 125 ✅
mistakes: 0 ✅
player_name: "테스트 사용자" ✅
created_at: 2026-01-03 13:35:20 ✅
```

### 렌더링된 HTML 검증
```
const difficulty = 'easy' ✅ (전역 변수)
function generateSudoku() ✅
async function saveScore() ✅
```

## ✅ 최종 결론

**모든 시스템이 정상 작동합니다!**

- ✅ 백엔드 API (로그인, 점수 저장) 정상
- ✅ 데이터베이스 저장 정상
- ✅ 프론트엔드 JavaScript 정상
- ✅ difficulty 전역 변수 정상
- ✅ curl 테스트 통과
- ✅ 실제 데이터 DB 저장 확인

## 🎮 지금 바로 테스트하세요!

1. 로그인: https://3000-igqqzgkeu63c4u9ihulwt-c81df28e.sandbox.novita.ai/login
2. 스도쿠: https://3000-igqqzgkeu63c4u9ihulwt-c81df28e.sandbox.novita.ai/game/simple/sudoku/play?difficulty=easy
3. 계정: test@example.com / test1234
