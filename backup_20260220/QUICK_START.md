# 🚀 Faith Portal SSH 배포 - 빠른 시작 가이드

## 📋 한 번에 복사해서 실행하는 명령어

### 1단계: 기본 환경 설치 (5분)

```bash
# Node.js 20.x 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git sqlite3

# PM2 설치
sudo npm install -g pm2

# 확인
node --version && npm --version && git --version
```

---

### 2단계: 프로젝트 설정 (3분)

```bash
# 프로젝트 클론
cd ~
git clone https://github.com/million-somang/faith_dev.git
cd faith_dev

# 패키지 설치
npm install --legacy-peer-deps

# 환경 변수 생성
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_PATH=./faith-portal.db
SESSION_SECRET=$(openssl rand -base64 32)
EOF

chmod 600 .env
```

---

### 3단계: 데이터베이스 초기화 (2분)

**옵션 A: SQLite (간단, 테스트용)**

```bash
cd ~/faith_dev

# 초기화 스크립트 다운로드 및 실행
cat > init-db.js << 'EOF'
const Database = require('better-sqlite3');
const db = new Database('faith-portal.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    last_login DATETIME,
    level INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active',
    role TEXT DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS user_game_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    game_type TEXT NOT NULL,
    score INTEGER NOT NULL,
    game_data TEXT,
    played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS sudoku_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    time INTEGER NOT NULL,
    difficulty TEXT NOT NULL,
    mistakes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tetris_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS game2048_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    max_tile INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS minesweeper_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    difficulty TEXT NOT NULL,
    time INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT,
    summary TEXT,
    source TEXT,
    link TEXT,
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    news_id INTEGER NOT NULL,
    bookmarked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (news_id) REFERENCES news(id)
  );

  CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    symbol TEXT NOT NULL,
    name TEXT,
    market_type TEXT,
    memo TEXT,
    target_price REAL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS user_keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    keyword TEXT NOT NULL,
    subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    priority TEXT DEFAULT 'normal',
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX idx_sessions_user_id ON sessions(user_id);
  CREATE INDEX idx_sessions_session_id ON sessions(session_id);
  CREATE INDEX idx_user_game_scores_user_id ON user_game_scores(user_id);
  CREATE INDEX idx_user_game_scores_game_type ON user_game_scores(game_type);
`);

console.log('✅ 데이터베이스 초기화 완료!');
db.close();
EOF

# better-sqlite3 설치 및 실행
npm install better-sqlite3 --legacy-peer-deps
node init-db.js

# 확인
ls -lh faith-portal.db
```

---

### 4단계: 서버 시작 (1분)

```bash
cd ~/faith_dev

# PM2로 시작
pm2 start ecosystem.nodejs.config.cjs

# 상태 확인
pm2 status
pm2 logs faith-portal --nostream

# 자동 재시작 설정
pm2 startup
# 출력된 명령어 복사해서 실행
pm2 save

# 테스트
curl http://localhost:3000
curl -I http://localhost:3000/logo_fl.png
```

---

### 5단계: Nginx 설정 (5분)

```bash
# Nginx 설치
sudo apt-get install -y nginx

# 설정 파일 생성
sudo tee /etc/nginx/sites-available/faith-portal << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 활성화
sudo ln -s /etc/nginx/sites-available/faith-portal /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# 방화벽 설정
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw --force enable
```

---

### 6단계: SSL 인증서 (3분)

```bash
# Certbot 설치
sudo apt-get install -y certbot python3-certbot-nginx

# SSL 인증서 발급 (도메인 이름 변경!)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 자동 갱신 테스트
sudo certbot renew --dry-run
```

---

### 7단계: 자동 백업 설정 (2분)

```bash
# 백업 디렉토리
mkdir -p ~/backups

# 백업 스크립트
cat > ~/faith_dev/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)
cd ~/faith_dev
cp faith-portal.db $BACKUP_DIR/faith-portal-$DATE.db
find $BACKUP_DIR -name "faith-portal-*.db" -mtime +7 -delete
echo "백업 완료: $DATE"
EOF

chmod +x ~/faith_dev/backup.sh

# Cron 작업 추가 (매일 새벽 3시)
(crontab -l 2>/dev/null; echo "0 3 * * * ~/faith_dev/backup.sh >> ~/backups/backup.log 2>&1") | crontab -

# 확인
crontab -l
```

---

## ✅ 완료 확인

```bash
# PM2 상태
pm2 status

# 로그 확인
pm2 logs faith-portal --nostream

# 로컬 접속
curl http://localhost:3000

# 외부 접속 (브라우저)
# http://your-domain.com
# https://your-domain.com
```

---

## 🔧 자주 사용하는 관리 명령어

```bash
# 서버 재시작
pm2 restart faith-portal

# 로그 실시간 보기
pm2 logs faith-portal

# 상태 모니터링
pm2 monit

# 코드 업데이트
cd ~/faith_dev
git pull origin main
npm install --legacy-peer-deps
pm2 restart faith-portal

# Nginx 재시작
sudo systemctl reload nginx

# 데이터베이스 백업 (수동)
~/faith_dev/backup.sh
```

---

## ⚠️ 트러블슈팅

### 서버가 시작 안 됨

```bash
# 로그 확인
pm2 logs faith-portal

# 포트 확인
sudo lsof -i :3000

# 포트 강제 종료
sudo fuser -k 3000/tcp

# 재시작
pm2 restart faith-portal
```

### Nginx 502 오류

```bash
# Node.js 서버 확인
pm2 status

# Nginx 로그
sudo tail -f /var/log/nginx/error.log

# Nginx 재시작
sudo systemctl restart nginx
```

### SSL 인증서 오류

```bash
# 인증서 갱신
sudo certbot renew

# Nginx 재시작
sudo systemctl reload nginx
```

---

## 📊 시스템 모니터링

```bash
# 서버 리소스
free -h                    # 메모리
df -h                      # 디스크
htop                       # CPU/메모리 실시간

# 로그 확인
pm2 logs faith-portal      # 애플리케이션 로그
sudo tail -f /var/log/nginx/access.log  # Nginx 접속 로그
sudo tail -f /var/log/nginx/error.log   # Nginx 에러 로그

# 데이터베이스 확인
sqlite3 ~/faith_dev/faith-portal.db ".tables"
sqlite3 ~/faith_dev/faith-portal.db "SELECT COUNT(*) FROM users;"
```

---

## 🎯 배포 완료!

**접속 주소:**
- HTTP: http://your-domain.com
- HTTPS: https://your-domain.com (SSL 적용 후)

**관리 포털:**
- PM2 모니터링: `pm2 monit`
- 로그: `pm2 logs faith-portal`
- 상태: `pm2 status`

**백업:**
- 자동 백업: 매일 새벽 3시
- 백업 위치: `~/backups/`
- 수동 백업: `~/faith_dev/backup.sh`

---

## 📚 추가 문서

- **전체 가이드**: `SSH_DEPLOYMENT_GUIDE.md`
- **Node.js 서버**: `NODEJS_DEPLOYMENT.md`
- **정적 파일**: `STATIC_FILES_FIX.md`
- **이미지 관리**: `IMAGE_DEPLOYMENT_GUIDE.md`

---

**모든 설정이 완료되었습니다!** 🎉

문제가 발생하면:
1. `pm2 logs faith-portal` 확인
2. `sudo tail -f /var/log/nginx/error.log` 확인
3. 방화벽 및 포트 확인
4. 데이터베이스 연결 확인

**추가 도움이 필요하시면 언제든 문의하세요!** 🚀
