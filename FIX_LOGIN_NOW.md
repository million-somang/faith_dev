# 🔧 로그인 문제 즉시 해결

## 📌 문제 원인
- `login_history` 테이블이 없어서 로그인 시 오류 발생
- 회원가입은 성공하지만 로그인 실패

## ⚡ 즉시 실행 명령어

```bash
# 1. 최신 코드 가져오기
cd ~/faith_dev
git pull origin main

# 2. login_history 테이블 추가 (마이그레이션)
node migrate-login-history.js

# 3. 테이블 확인
python3 << 'EOF'
import sqlite3
conn = sqlite3.connect('faith-portal.db')
cursor = conn.cursor()
cursor.execute("SELECT sql FROM sqlite_master WHERE name='login_history';")
result = cursor.fetchone()
if result:
    print("✅ login_history 테이블 존재:")
    print(result[0])
else:
    print("❌ login_history 테이블 없음!")
conn.close()
EOF

# 4. 서버 재시작
pkill -f "npm run start:prod" 2>/dev/null || true
sleep 2
cd ~/faith_dev
nohup npm run start:prod > server.log 2>&1 &

# 5. 서버 시작 확인 (3초 대기)
sleep 3
tail -10 server.log

# 6. 로그인 테스트
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test3@example.com","password":"test1234"}' \
  -v

# 7. 로그인 이력 확인
python3 << 'EOF'
import sqlite3
conn = sqlite3.connect('faith-portal.db')
cursor = conn.cursor()
cursor.execute("SELECT * FROM login_history ORDER BY created_at DESC LIMIT 3;")
rows = cursor.fetchall()
print("\n📊 최근 로그인 이력:")
for row in rows:
    print(f"  ID: {row[0]}, User ID: {row[1]}, IP: {row[2]}, Created: {row[4]}")
conn.close()
EOF
```

---

## ✅ 예상 결과

### 1. 마이그레이션 성공
```
✅ login_history 테이블 생성 완료!
```

### 2. 로그인 성공
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

### 3. 쿠키 확인
```
< set-cookie: session_id=bc03065a-b95b-425b-875b-696d325b6bd8; Max-Age=604800; Path=/; HttpOnly; Secure; SameSite=Lax
```

---

## 🎯 웹 브라우저 테스트

로그인 성공 후:

1. **로그인 페이지 접속**: http://210.114.17.245:3000/login
2. **로그인 정보 입력**:
   - 이메일: `test3@example.com`
   - 비밀번호: `test1234`
3. **로그인 버튼 클릭**
4. **자동 리다이렉트** → 메인 페이지
5. **마이페이지 확인** → 게임 기록 표시

---

## 📝 변경 내역

### 추가된 파일
- `migrate-login-history.js` - 마이그레이션 스크립트
- `init-db.js` (수정) - login_history 테이블 추가

### 생성된 테이블
```sql
CREATE TABLE login_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🔍 트러블슈팅

### 문제: 마이그레이션 오류
```bash
# better-sqlite3 재설치
npm install better-sqlite3 --legacy-peer-deps
node migrate-login-history.js
```

### 문제: 서버 시작 안됨
```bash
# 포트 확인 및 정리
sudo lsof -ti:3000 | xargs kill -9
npm run start:prod
```

### 문제: 여전히 로그인 오류
```bash
# 로그 확인
tail -50 server.log | grep -i "로그인\|login"

# 데이터베이스 백업 및 재생성
cp faith-portal.db faith-portal.db.backup
rm faith-portal.db
node init-db.js
node migrate-login-history.js
```

---

## 📞 다음 단계

로그인 성공 후:
1. ✅ 회원가입 테스트
2. ✅ 로그인 테스트
3. ⏳ 게임 플레이 후 마이페이지 확인
4. ⏳ PM2 자동 시작 설정
5. ⏳ Nginx + SSL 설정

---

**이제 위 명령어를 서버에서 실행해주세요!** 🚀
