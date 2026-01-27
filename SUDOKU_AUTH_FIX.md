# 스도쿠 게임 인증 문제 수정

## 🐛 문제 상황

### 증상
- 사용자가 로그인한 상태에서 스도쿠 게임을 완료
- 점수 저장 버튼 클릭 시 "로그인이 필요합니다" 메시지 표시
- 실제로는 로그인되어 있는 상태임

### 원인
```typescript
// ❌ 잘못된 코드 (기존)
const authCookie = c.req.header('Cookie')
if (authCookie) {
  const cookies = ...
  if (cookies.user_id) {  // user_id 쿠키를 직접 읽으려고 시도
    userId = decodeURIComponent(cookies.user_id)
  }
}
```

**문제점**:
1. `user_id`라는 쿠키가 존재하지 않음
2. 세션 기반 인증을 사용하는데 직접 쿠키에서 사용자 ID를 읽으려고 시도
3. 실제로는 `session_id` 쿠키를 사용해서 세션 테이블을 조회해야 함

---

## ✅ 해결 방법

### 1. 세션 기반 인증 구현

```typescript
// ✅ 올바른 코드 (수정 후)
const cookieHeader = c.req.header('Cookie')
if (cookieHeader) {
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    acc[key] = value
    return acc
  }, {} as Record<string, string>)
  
  const sessionId = cookies.session_id  // session_id 쿠키 읽기
  
  if (sessionId) {
    // 세션 테이블에서 user_id 조회
    const session = await DB.prepare(`
      SELECT user_id FROM sessions 
      WHERE session_id = ? AND expires_at > datetime('now')
    `).bind(sessionId).first()
    
    if (session) {
      userId = session.user_id
      // 사용자 정보 조회...
    }
  }
}
```

### 2. 디버깅 로그 추가

#### 프론트엔드 (saveScore 함수)
```javascript
console.log('🎯 [프론트] Saving score...');
console.log('📊 [프론트] 현재 난이도:', difficulty);
console.log('⏱️ [프론트] 소요 시간:', getElapsedTime());
console.log('🍪 [프론트] 현재 쿠키:', document.cookie);
console.log('🌐 [프론트] API 요청 시작...');
console.log('📡 [프론트] 응답 상태:', response.status);
console.log('📦 [프론트] 응답 데이터:', data);
```

#### 백엔드 (API 엔드포인트)
```typescript
console.log('🎯 [스도쿠 점수 저장] API 호출됨')
console.log('📦 [스도쿠] 받은 데이터:', { difficulty, time, mistakes })
console.log('🍪 [스도쿠] Cookie 헤더:', cookieHeader)
console.log('🍪 [스도쿠] 파싱된 쿠키:', Object.keys(cookies))
console.log('🔑 [스도쿠] Session ID:', sessionId ? '존재함' : '없음')
console.log('👤 [스도쿠] 세션 조회 결과:', session)
console.log('👤 [스도쿠] 사용자 정보:', user)
console.log('✅ [스도쿠] 사용자 인증 성공:', { userId, username })
```

---

## 🧪 테스트 결과

### 1. 회원가입 테스트
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"sudoku@test.com","password":"test1234","name":"스도쿠테스터"}'
```

**결과**: ✅ 성공
```json
{
  "success": true,
  "message": "회원가입 성공",
  "user": {
    "id": 5,
    "email": "sudoku@test.com",
    "name": "스도쿠테스터",
    "role": "user",
    "level": 1
  }
}
```

**생성된 쿠키**:
```
session_id=f0b63f39-5c66-4161-a16b-b4e54ae4c1bc
```

### 2. 점수 저장 테스트
```bash
curl -b cookies.txt -X POST http://localhost:3000/api/sudoku/score \
  -H "Content-Type: application/json" \
  -d '{"difficulty":"easy","time":120,"mistakes":3}'
```

**결과**: ✅ 성공
```json
{
  "success": true,
  "message": "기록이 저장되었습니다"
}
```

### 3. 서버 로그 (디버깅 출력)
```
🎯 [스도쿠 점수 저장] API 호출됨
📦 [스도쿠] 받은 데이터: { difficulty: 'easy', time: 120, mistakes: 3 }
🍪 [스도쿠] Cookie 헤더: session_id=f0b63f39-5c66-4161-a16b-b4e54ae4c1bc
🍪 [스도쿠] 파싱된 쿠키: [ 'session_id' ]
🔑 [스도쿠] Session ID: 존재함
👤 [스도쿠] 세션 조회 결과: { user_id: 5 }
👤 [스도쿠] 사용자 정보: { id: 5, email: 'sudoku@test.com', name: '스도쿠테스터' }
✅ [스도쿠] 사용자 인증 성공: { userId: 5, username: '스도쿠테스터' }
✅ 스도쿠 기록 저장 성공: {
  difficulty: 'easy',
  time: 120,
  mistakes: 3,
  username: '스도쿠테스터',
  userId: 5
}
```

---

## 📊 수정 전후 비교

### Before (❌)
```
사용자 로그인 → 스도쿠 게임 완료 → 점수 저장 클릭
→ API: user_id 쿠키 찾기 시도
→ user_id 쿠키 없음
→ ❌ 401 "로그인이 필요합니다"
```

### After (✅)
```
사용자 로그인 → 스도쿠 게임 완료 → 점수 저장 클릭
→ API: session_id 쿠키 읽기
→ sessions 테이블 조회 (session_id로 user_id 찾기)
→ users 테이블 조회 (user_id로 사용자 정보 가져오기)
→ ✅ 200 "기록이 저장되었습니다"
```

---

## 🎯 인증 흐름 (수정 후)

```
┌─────────────┐
│   브라우저   │
└──────┬──────┘
       │ 1. POST /api/auth/login
       │    (email, password)
       ▼
┌─────────────┐
│  서버 API   │ 2. 비밀번호 확인
└──────┬──────┘    세션 생성 (session_id, user_id, expires_at)
       │           쿠키 설정 (Set-Cookie: session_id=...)
       │ 3. 200 OK
       ▼
┌─────────────┐
│   브라우저   │ 4. session_id 쿠키 저장
└──────┬──────┘
       │ 5. POST /api/sudoku/score
       │    (difficulty, time, mistakes)
       │    Cookie: session_id=...
       ▼
┌─────────────┐
│  서버 API   │ 6. session_id 쿠키 읽기
└──────┬──────┘    sessions 테이블 조회
       │           → user_id 획득
       │           users 테이블 조회
       │           → 사용자 정보 획득
       │ 7. 점수 저장 (sudoku_scores 테이블)
       │ 8. 200 OK
       ▼
┌─────────────┐
│   브라우저   │ 9. "기록이 저장되었습니다" 표시
└─────────────┘
```

---

## 🔍 디버깅 가이드

### 프론트엔드에서 확인
브라우저 개발자 도구 콘솔에서:
```javascript
// 현재 쿠키 확인
console.log(document.cookie)
// 예: "session_id=f0b63f39-5c66-4161-a16b-b4e54ae4c1bc"

// 점수 저장 시 로그 확인
// 🎯 [프론트] Saving score...
// 🍪 [프론트] 현재 쿠키: ...
// 🌐 [프론트] API 요청 시작...
// 📡 [프론트] 응답 상태: 200 OK
```

### 백엔드에서 확인
PM2 로그:
```bash
pm2 logs webapp --nostream
```

로그 출력 예시:
```
🎯 [스도쿠 점수 저장] API 호출됨
🍪 [스도쿠] Cookie 헤더: session_id=...
🔑 [스도쿠] Session ID: 존재함
👤 [스도쿠] 세션 조회 결과: { user_id: 5 }
✅ [스도쿠] 사용자 인증 성공
```

---

## 📝 관련 파일

- **src/index.tsx**
  - 라인 4002: `saveScore()` 함수 (프론트엔드)
  - 라인 5034: `app.post('/api/sudoku/score')` (백엔드 API)

---

## 🚀 테스트 방법

### 1. 브라우저에서 테스트
1. https://your-domain/game/simple/sudoku 접속
2. 로그인 (헤더에서 로그인 버튼 클릭)
3. 스도쿠 게임 완료
4. "기록 저장" 버튼 클릭
5. 브라우저 콘솔(F12)에서 디버깅 로그 확인

### 2. curl로 테스트
```bash
# 1. 회원가입 또는 로그인
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234"}'

# 2. 쿠키 확인
cat cookies.txt

# 3. 점수 저장
curl -b cookies.txt -X POST http://localhost:3000/api/sudoku/score \
  -H "Content-Type: application/json" \
  -d '{"difficulty":"easy","time":120,"mistakes":3}'
```

---

## ✅ 해결 완료

- [x] 세션 기반 인증으로 변경
- [x] session_id 쿠키를 사용하여 user_id 조회
- [x] 세션 만료 확인 (expires_at > now)
- [x] 프론트엔드 디버깅 로그 추가
- [x] 백엔드 디버깅 로그 추가
- [x] 테스트 완료 (회원가입, 로그인, 점수 저장)

---

**작성일**: 2026-01-27  
**작성자**: AI Assistant  
**상태**: ✅ 완료  
**Git 커밋**: f7b22d6
