# 🔧 뉴스 로딩 오류 수정

## 📌 문제 원인

메인 페이지에서 `c.env.DB`를 사용하여 Node.js 환경에서 작동하지 않음

```typescript
// 문제 코드
app.get('/', async (c) => {
  const { DB } = c.env  // ← Node.js에서 undefined!
  
  await DB.prepare('SELECT * FROM news')  // ← 오류 발생!
})
```

## ✅ 해결 방법

`getDB(c)`를 사용하여 환경에 맞는 DB 어댑터 사용

```typescript
// 수정 코드
app.get('/', async (c) => {
  const DB = getDB(c)  // ← Node.js에서 better-sqlite3 사용
  
  await DB.prepare('SELECT * FROM news')  // ← 정상 작동!
})
```

---

## 🚀 호스팅 서버 즉시 배포

```bash
# 1. 최신 코드 받기
cd ~/faith_dev
git pull origin main

# 2. 모든 프로세스 종료
pkill -9 node
pkill -9 npm
pkill -9 tsx
pm2 delete all
sleep 2

# 3. 서버 재시작
cd ~/faith_dev
nohup npm run start:prod > server.log 2>&1 &

# 4. 서버 시작 확인 (5초 대기)
sleep 5
tail -30 server.log

# 5. 포트 확인
netstat -tlnp | grep 3000

# 6. 접속 테스트
curl http://localhost:3000

# 7. 외부 접속 테스트
curl http://210.114.17.245:3000
```

---

## 📊 예상 결과

### ✅ 정상 시작
```
✅ SQLite 데이터베이스 연결: ./faith-portal.db
✅ Faith Portal Server is running on http://localhost:3000
```

### ✅ 포트 리스닝
```
tcp  0  0  0.0.0.0:3000  0.0.0.0:*  LISTEN  12345/node
```

### ✅ 접속 성공
```html
<!DOCTYPE html>
<html lang="ko" id="html-root">
<head>
    <meta charset="UTF-8">
    <title>Faith Portal - 믿음의 포탈</title>
...
```

---

## 🌐 웹 브라우저 테스트

1. **브라우저 캐시 삭제**
   ```
   Ctrl + Shift + Delete
   → "쿠키 및 기타 사이트 데이터" 체크
   → "데이터 삭제"
   ```

2. **접속**
   ```
   http://210.114.17.245:3000
   ```

3. **확인 사항**
   - ✅ 페이지가 정상적으로 로드됨
   - ✅ 뉴스 섹션이 표시됨
   - ✅ 콘솔에 오류 없음 (F12)

---

## 🔧 트러블슈팅

### 문제: 여전히 오류 발생

#### 확인 1: 서버 로그
```bash
tail -50 server.log
```

**정상:**
```
✅ Faith Portal Server is running on http://localhost:3000
```

**오류:**
```
TypeError: Cannot read properties of undefined (reading 'prepare')
```

#### 확인 2: 프로세스 상태
```bash
ps aux | grep "npm run start:prod" | grep -v grep
```

**프로세스가 없으면 서버가 죽은 것:**
```bash
cd ~/faith_dev
nohup npm run start:prod > server.log 2>&1 &
```

#### 확인 3: 포트 상태
```bash
netstat -tlnp | grep 3000
```

**포트가 비어있으면 서버 미실행:**
```bash
cd ~/faith_dev
nohup npm run start:prod > server.log 2>&1 &
sleep 5
netstat -tlnp | grep 3000
```

### 문제: 접속은 되는데 페이지가 안 보임

#### 원인: 데이터베이스 테이블 없음
```bash
# 테이블 확인
python3 << 'EOF'
import sqlite3
conn = sqlite3.connect('faith-portal.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
tables = cursor.fetchall()
print("\n📊 테이블 목록:")
for table in tables:
    print(f"  - {table[0]}")
conn.close()
EOF

# news 테이블이 없으면 초기화
node init-db.js
```

---

## 📝 변경 내역

### 커밋: f6b4a75
- **메시지**: Fix news fetch - use getDB(c) instead of c.env.DB
- **파일**: src/index.tsx
- **변경**:
  - `const { DB } = c.env` → `const DB = getDB(c)`
  - 메인 페이지 뉴스 로딩 수정

### 주요 코드
```typescript
// 메인 페이지
app.get('/', async (c) => {
  const DB = getDB(c)  // ← 수정!
  
  // 자동 뉴스 가져오기
  try {
    const lastFetch = await DB.prepare('SELECT MAX(created_at) as last_time FROM news').first()
    // ...
  } catch (error) {
    console.error('자동 뉴스 가져오기 오류:', error)
  }
  
  // 최신 뉴스 조회
  let latestNews: any[] = []
  try {
    const { results } = await DB.prepare('SELECT * FROM news ORDER BY created_at DESC LIMIT 5').all()
    latestNews = results || []
  } catch (error) {
    console.error('뉴스 조회 오류:', error)
  }
  
  // ...
})
```

---

## 🎯 완료 체크리스트

- ✅ 회원가입/로그인 정상 작동
- ✅ 세션 쿠키 저장 (HTTP 환경)
- ✅ `/api/auth/me`, `/api/auth/check` 작동
- ✅ **뉴스 로딩 오류 수정** ← 최신!
- ⏳ 메인 페이지 접속 확인
- ⏳ 뉴스 표시 확인
- ⏳ 로그인 상태 UI 표시 확인

---

## 🔗 링크

- **GitHub**: https://github.com/million-somang/faith_dev
- **커밋**: f6b4a75 - Fix news fetch - use getDB(c) instead of c.env.DB
- **이전 커밋**: fda109b - Add HTTP cookie fix documentation

---

## 📞 최종 배포 절차

```bash
# 1. 서버 배포
cd ~/faith_dev
git pull origin main
pkill -9 node && pkill -9 npm && pkill -9 tsx
pm2 delete all
sleep 2
nohup npm run start:prod > server.log 2>&1 &
sleep 5

# 2. 확인
tail -30 server.log
netstat -tlnp | grep 3000
curl http://localhost:3000 | head -20

# 3. 외부 접속 확인
curl http://210.114.17.245:3000 | head -20
```

---

**이제 호스팅 서버에서 위 명령어를 실행하고, 웹 브라우저에서 접속해보세요!** 🚀

**메인 페이지가 정상적으로 로드될 것입니다!** 😊
