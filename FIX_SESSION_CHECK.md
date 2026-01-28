# 🔧 세션 확인 API 추가 - 로그인 상태 표시 수정

## 📌 문제 원인
- `/api/auth/check` 엔드포인트가 없어서 프론트엔드에서 로그인 상태를 확인할 수 없음
- 로그인 후에도 계속 "로그인/회원가입" 버튼만 표시됨

## ✅ 해결 방법
- 세션 확인 API 추가: `GET /api/auth/check`

---

## 🚀 호스팅 서버 즉시 배포

```bash
# 1. 최신 코드 받기
cd ~/faith_dev
git pull origin main

# 2. 서버 재시작
pkill -f "npm run start:prod" 2>/dev/null || true
sleep 2
nohup npm run start:prod > server.log 2>&1 &

# 3. 서버 시작 확인 (3초 대기)
sleep 3
tail -10 server.log

# 4. 로그인 및 세션 확인 테스트
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test3@example.com","password":"test1234"}' \
  -c cookies.txt

echo -e "\n=== 세션 확인 ==="
curl http://localhost:3000/api/auth/check \
  -b cookies.txt

# 5. 정리
rm cookies.txt
```

---

## 📊 예상 결과

### 로그인 성공
```json
{
  "success": true,
  "message": "로그인 성공",
  "user": {
    "id": 4,
    "email": "test3@example.com",
    "name": "테스트2",
    "role": "user",
    "level": 1
  }
}
```

### 세션 확인 성공
```json
{
  "success": true,
  "loggedIn": true,
  "user": {
    "id": 4,
    "email": "test3@example.com",
    "name": "테스트2",
    "role": "user",
    "level": 1,
    "status": "active"
  }
}
```

---

## 🎯 웹 브라우저 테스트

1. **브라우저 캐시 완전 삭제**
   - Chrome: `Ctrl + Shift + Delete` → "쿠키 및 기타 사이트 데이터" 체크 → 삭제
   - 또는 시크릿 모드로 접속

2. **로그인 테스트**
   - http://210.114.17.245:3000/login 접속
   - 이메일: `test3@example.com`
   - 비밀번호: `test1234`
   - 로그인 버튼 클릭

3. **로그인 상태 확인**
   - 헤더에 "마이페이지", "로그아웃" 버튼 표시
   - "로그인", "회원가입" 버튼 숨김
   - 마이페이지 접근 가능

4. **마이페이지 테스트**
   - http://210.114.17.245:3000/mypage 접속
   - 사용자 정보 표시
   - 게임 기록 표시

---

## 🔍 프론트엔드 동작 방식

### 기존 문제
```javascript
// 세션 확인 API가 없어서 항상 로그인 안 된 것으로 판단
fetch('/api/auth/check')
  .then(res => res.json())
  .then(data => {
    // 404 Not Found → 로그인 안 됨으로 처리
  })
```

### 해결 후
```javascript
// 정상적으로 세션 확인
fetch('/api/auth/check')
  .then(res => res.json())
  .then(data => {
    if (data.loggedIn) {
      // 로그인 상태: 마이페이지, 로그아웃 버튼 표시
      showUserMenu(data.user)
    } else {
      // 비로그인 상태: 로그인, 회원가입 버튼 표시
      showGuestMenu()
    }
  })
```

---

## 📝 추가된 API 엔드포인트

### GET /api/auth/check

**요청**
```bash
GET /api/auth/check
Cookie: session_id=xxx
```

**응답 (로그인 상태)**
```json
{
  "success": true,
  "loggedIn": true,
  "user": {
    "id": 1,
    "email": "test@example.com",
    "name": "테스트사용자",
    "role": "user",
    "level": 1,
    "status": "active"
  }
}
```

**응답 (비로그인 상태)**
```json
{
  "success": false,
  "loggedIn": false,
  "message": "로그인이 필요합니다"
}
```

---

## 🛠 트러블슈팅

### 문제: 여전히 로그인 상태가 안 보임

#### 해결 1: 브라우저 캐시 완전 삭제
```bash
# Chrome
Ctrl + Shift + Delete
→ "쿠키 및 기타 사이트 데이터" 체크
→ "전체 기간"
→ "데이터 삭제"

# 또는 시크릿 모드
Ctrl + Shift + N
```

#### 해결 2: 서버 재시작
```bash
cd ~/faith_dev
pkill -f "npm run start:prod"
sleep 2
nohup npm run start:prod > server.log 2>&1 &
```

#### 해결 3: 세션 확인
```bash
# 브라우저 개발자 도구 (F12)
# Console 탭에서 실행:
fetch('/api/auth/check')
  .then(r => r.json())
  .then(console.log)
```

### 문제: 세션이 유지되지 않음

#### 원인: 쿠키 설정 문제
```bash
# 서버 로그 확인
tail -30 server.log | grep -i "cookie\|session"

# 세션 테이블 확인
python3 << 'EOF'
import sqlite3
conn = sqlite3.connect('faith-portal.db')
cursor = conn.cursor()
cursor.execute("SELECT COUNT(*) FROM sessions WHERE expires_at > datetime('now');")
print(f"유효한 세션 수: {cursor.fetchone()[0]}")
conn.close()
EOF
```

#### 해결: 세션 정리 및 재로그인
```bash
# 만료된 세션 삭제
python3 << 'EOF'
import sqlite3
conn = sqlite3.connect('faith-portal.db')
cursor = conn.cursor()
cursor.execute("DELETE FROM sessions WHERE expires_at < datetime('now');")
conn.commit()
print(f"삭제된 만료 세션 수: {cursor.rowcount}")
conn.close()
EOF

# 재로그인
```

---

## 📌 변경 내역

### 커밋: 5662bdb
- **메시지**: Add /api/auth/check endpoint for session validation
- **파일**: src/index.tsx
- **추가**: GET /api/auth/check API 엔드포인트

### 주요 기능
1. 세션 쿠키로 로그인 상태 확인
2. 로그인된 경우 사용자 정보 반환
3. 비로그인 경우 loggedIn: false 반환
4. 에러 처리 및 로깅

---

## 🎯 다음 단계

1. ✅ 회원가입 정상 작동
2. ✅ 로그인 정상 작동
3. ✅ 세션 확인 API 추가
4. ⏳ **로그인 상태 UI 표시 확인**
5. ⏳ 마이페이지 게임 기록 표시
6. ⏳ PM2 자동 시작 설정
7. ⏳ Nginx + SSL 설정

---

## 🔗 링크

- **GitHub**: https://github.com/million-somang/faith_dev
- **커밋**: 5662bdb - Add /api/auth/check endpoint for session validation
- **이전 커밋**: a6c023b - Complete login fix - all issues resolved

---

**이제 위 명령어를 호스팅 서버에서 실행하고, 웹 브라우저에서 테스트해주세요!** 🚀

**중요: 브라우저 캐시를 완전히 삭제하거나 시크릿 모드로 테스트하세요!**
