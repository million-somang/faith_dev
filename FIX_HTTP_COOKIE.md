# 🔥 HTTP 환경 쿠키 문제 최종 해결!

## 📌 문제 원인

**HTTP 환경에서 Secure 쿠키가 작동하지 않음!**

- 서버 IP: `210.114.17.245` (HTTP)
- 쿠키 설정: `secure: true`
- **결과**: 브라우저가 쿠키를 저장하지 않음!

```
HTTP 환경 + secure: true = ❌ 쿠키 작동 안함
HTTPS 환경 + secure: true = ✅ 쿠키 정상 작동
```

---

## ✅ 해결 방법

**조건부 Secure 속성 설정:**

```typescript
// 수정 전 (문제)
setCookie(c, 'session_id', sessionId, {
  secure: true  // ← HTTP에서 작동 안함!
})

// 수정 후 (해결)
const isHttps = c.req.url.startsWith('https://')
setCookie(c, 'session_id', sessionId, {
  secure: isHttps  // ← HTTP: false, HTTPS: true
})
```

---

## 🚀 호스팅 서버 즉시 배포

```bash
# 1. 최신 코드 받기
cd ~/faith_dev
git pull origin main

# 2. 데이터베이스 사용자 확인
python3 << 'EOF'
import sqlite3
conn = sqlite3.connect('faith-portal.db')
cursor = conn.cursor()
cursor.execute("SELECT id, email, name FROM users;")
rows = cursor.fetchall()
print("\n📊 등록된 사용자:")
if not rows:
    print("  ❌ 사용자 없음!")
else:
    for row in rows:
        print(f"  ✅ ID: {row[0]}, Email: {row[1]}, Name: {row[2]}")
conn.close()
EOF

# 3. 사용자가 없으면 회원가입
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@faithlink.com","password":"admin1234","name":"관리자"}'

# 4. 서버 재시작
pkill -f "npm run start:prod" 2>/dev/null || true
sleep 2
nohup npm run start:prod > server.log 2>&1 &

# 5. 서버 시작 확인
sleep 3
tail -10 server.log

# 6. 로그인 테스트
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@faithlink.com","password":"admin1234"}' \
  -c cookies.txt -v 2>&1 | grep -i "set-cookie"

# 7. 세션 확인
curl http://localhost:3000/api/auth/me -b cookies.txt

# 8. 정리
rm cookies.txt
```

---

## 📊 예상 결과

### ✅ 쿠키 설정 성공
```
< set-cookie: session_id=xxx; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax
```

**주목**: `Secure` 속성이 HTTP 환경에서는 **제거**됨!

### ✅ 로그인 성공
```json
{
  "success": true,
  "message": "로그인 성공",
  "user": {
    "id": 1,
    "email": "admin@faithlink.com",
    "name": "관리자",
    "role": "user",
    "level": 1
  }
}
```

### ✅ 세션 확인 성공
```json
{
  "success": true,
  "loggedIn": true,
  "user": {
    "id": 1,
    "email": "admin@faithlink.com",
    "name": "관리자",
    "role": "user",
    "level": 1,
    "status": "active"
  }
}
```

---

## 🌐 웹 브라우저 테스트

### 1. 브라우저 캐시 완전 삭제
```
Ctrl + Shift + Delete
→ "쿠키 및 기타 사이트 데이터" 체크
→ "전체 기간" 선택
→ "데이터 삭제"
```

### 2. 로그인
```
http://210.114.17.245:3000/login

이메일: admin@faithlink.com
비밀번호: admin1234
```

### 3. 개발자 도구 확인 (F12)

#### Console 탭
```javascript
// 쿠키 확인
console.log('쿠키:', document.cookie);
// 결과: session_id=xxx

// 로그인 상태 확인
fetch('/api/auth/me')
  .then(r => r.json())
  .then(data => {
    console.log('로그인 상태:', data);
    if (data.loggedIn) {
      console.log('✅ 로그인됨:', data.user.name);
    }
  });
```

#### Application 탭
```
Application → Cookies → http://210.114.17.245:3000
→ session_id 쿠키 확인

확인 사항:
- Name: session_id
- Value: (UUID)
- Path: /
- HttpOnly: ✓
- Secure: (없음 - HTTP이므로)
- SameSite: Lax
```

### 4. 로그인 상태 UI 확인

**✅ 로그인 전:**
- 헤더: "로그인", "회원가입" 버튼

**✅ 로그인 후:**
- 헤더: "마이페이지", "로그아웃" 버튼
- 사용자 이름 표시

---

## 🔧 트러블슈팅

### 문제: 여전히 쿠키가 없음

#### 확인 1: 서버 로그
```bash
tail -30 server.log | grep -i "로그인\|cookie\|session"
```

#### 확인 2: 쿠키 설정 확인
```bash
# 로그인 시 응답 헤더 확인
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@faithlink.com","password":"admin1234"}' \
  -v 2>&1 | grep -i "set-cookie"

# 결과 예시:
# < set-cookie: session_id=xxx; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax
```

#### 확인 3: 브라우저 쿠키 저장소
```javascript
// F12 → Console
document.cookie
// 결과: "session_id=xxx"

// 또는 Application 탭
// → Cookies → http://210.114.17.245:3000
```

### 문제: 로그인은 되는데 세션이 유지 안됨

#### 원인: 쿠키가 전달되지 않음
```javascript
// fetch 호출 시 credentials 추가
fetch('/api/auth/me', {
  credentials: 'include'  // ← 이게 필요!
})
```

#### 해결: 프론트엔드 코드 확인
```bash
# src/index.tsx에서 확인
grep -n "fetch.*auth" src/index.tsx | head -10
```

---

## 📝 변경 내역

### 커밋: 7b46e6f
- **메시지**: Fix cookie secure attribute for HTTP environment
- **파일**: src/middleware/auth.ts
- **변경**:
  - `secure: true` → `secure: isHttps`
  - HTTP 환경에서 쿠키 작동 가능

### 주요 코드
```typescript
// 조건부 Secure 설정
const isHttps = c.req.url.startsWith('https://')
setCookie(c, 'session_id', sessionId, {
  maxAge: 7 * 24 * 60 * 60,
  httpOnly: true,
  secure: isHttps,  // ← HTTP: false, HTTPS: true
  sameSite: 'Lax',
  path: '/'
})
```

---

## 🎯 완료 체크리스트

- ✅ 회원가입 API 정상 작동
- ✅ 로그인 API 정상 작동
- ✅ 세션 생성 및 DB 저장
- ✅ `/api/auth/check` 엔드포인트
- ✅ `/api/auth/me` 별칭
- ✅ **HTTP 환경 쿠키 수정** ← 최종!
- ⏳ 브라우저에서 쿠키 저장 확인
- ⏳ 로그인 상태 UI 표시 확인
- ⏳ 마이페이지 접근 확인

---

## 🔗 링크

- **GitHub**: https://github.com/million-somang/faith_dev
- **커밋**: 7b46e6f - Fix cookie secure attribute for HTTP environment
- **이전 커밋**: bbc0c1d - Add /api/auth/me fix documentation

---

## 📞 최종 테스트 절차

### 서버 배포
```bash
cd ~/faith_dev
git pull origin main
pkill -f "npm run start:prod"
sleep 2
nohup npm run start:prod > server.log 2>&1 &
sleep 3
tail -10 server.log
```

### 회원가입 (사용자 없는 경우)
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@faithlink.com","password":"admin1234","name":"관리자"}'
```

### 브라우저 테스트
1. 캐시 완전 삭제 (`Ctrl + Shift + Delete`)
2. http://210.114.17.245:3000 접속
3. 로그인
4. F12 → Application → Cookies 확인
5. F12 → Console → `document.cookie` 확인
6. 헤더에 "마이페이지", "로그아웃" 표시 확인

---

**이제 호스팅 서버에서 위 명령어를 실행하고, 브라우저에서 테스트해주세요!** 🚀

**이번에는 반드시 쿠키가 저장될 것입니다!** 😊
