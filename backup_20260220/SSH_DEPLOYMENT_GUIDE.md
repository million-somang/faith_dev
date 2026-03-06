# 🚀 Faith Portal SSH 서버 환경 세팅 가이드

## 📋 목차
1. [사전 준비](#1-사전-준비)
2. [프로젝트 설치](#2-프로젝트-설치)
3. [데이터베이스 설정](#3-데이터베이스-설정)
4. [환경 변수 설정](#4-환경-변수-설정)
5. [서버 실행](#5-서버-실행)
6. [Nginx 설정](#6-nginx-설정)
7. [SSL 인증서](#7-ssl-인증서)
8. [모니터링](#8-모니터링)

---

## 1. 사전 준비

### Node.js 설치 (18.x 이상)

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Node.js 버전 확인
node --version  # v20.x.x
npm --version   # 10.x.x
```

### Git 설치

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y git

# CentOS/RHEL
sudo yum install -y git

# 확인
git --version
```

### PM2 설치 (프로세스 관리자)

```bash
sudo npm install -g pm2

# 확인
pm2 --version
```

---

## 2. 프로젝트 설치

### 2.1 SSH 접속

```bash
ssh user@your-server.com
# 또는 IP 주소
ssh user@123.456.789.012
```

### 2.2 작업 디렉토리 생성

```bash
# 홈 디렉토리에서 작업 (권장)
cd ~

# 또는 웹 디렉토리
cd /var/www
```

### 2.3 프로젝트 클론

```bash
# GitHub에서 클론
git clone https://github.com/million-somang/faith_dev.git

# 디렉토리 이동
cd faith_dev

# 브랜치 확인
git branch
```

### 2.4 패키지 설치

```bash
# Node.js 패키지 설치
npm install --legacy-peer-deps

# 설치 확인
ls node_modules | wc -l  # 패키지 개수 확인
```

---

## 3. 데이터베이스 설정

### 옵션 A: SQLite (간단, 테스트용)

#### A-1. SQLite 설치

```bash
# Ubuntu/Debian
sudo apt-get install -y sqlite3

# CentOS/RHEL
sudo yum install -y sqlite

# 확인
sqlite3 --version
```

#### A-2. better-sqlite3 패키지 설치

```bash
npm install better-sqlite3 --legacy-peer-deps
```

#### A-3. 데이터베이스 초기화 스크립트 생성

```bash
cat > init-sqlite-db.js << 'EOF'
const Database = require('better-sqlite3');
const db = new Database('faith-portal.db');

// 테이블 생성
db.exec(`
  -- 사용자 테이블
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

  -- 세션 테이블
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- 뉴스 테이블
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

  -- 게임 점수 테이블
  CREATE TABLE IF NOT EXISTS user_game_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    game_type TEXT NOT NULL,
    score INTEGER NOT NULL,
    game_data TEXT,
    played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- 스도쿠 점수 테이블
  CREATE TABLE IF NOT EXISTS sudoku_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    time INTEGER NOT NULL,
    difficulty TEXT NOT NULL,
    mistakes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- 테트리스 점수 테이블
  CREATE TABLE IF NOT EXISTS tetris_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- 2048 점수 테이블
  CREATE TABLE IF NOT EXISTS game2048_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    max_tile INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- 지뢰찾기 점수 테이블
  CREATE TABLE IF NOT EXISTS minesweeper_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    difficulty TEXT NOT NULL,
    time INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- 북마크 테이블
  CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    news_id INTEGER NOT NULL,
    bookmarked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (news_id) REFERENCES news(id)
  );

  -- 관심 종목 테이블
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

  -- 키워드 구독 테이블
  CREATE TABLE IF NOT EXISTS user_keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    keyword TEXT NOT NULL,
    subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- 활동 로그 테이블
  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- 알림 테이블
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    priority TEXT DEFAULT 'normal',
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 인덱스 생성
  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
  CREATE INDEX IF NOT EXISTS idx_user_game_scores_user_id ON user_game_scores(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_game_scores_game_type ON user_game_scores(game_type);
  CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
  CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_keywords_user_id ON user_keywords(user_id);
`);

console.log('✅ SQLite 데이터베이스 초기화 완료!');
console.log('데이터베이스 파일: faith-portal.db');

db.close();
EOF

# 스크립트 실행
node init-sqlite-db.js

# 확인
ls -lh faith-portal.db
sqlite3 faith-portal.db "SELECT name FROM sqlite_master WHERE type='table';"
```

---

### 옵션 B: PostgreSQL (프로덕션 권장)

#### B-1. PostgreSQL 설치

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install -y postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 버전 확인
psql --version
```

#### B-2. 데이터베이스 및 사용자 생성

```bash
# PostgreSQL 사용자로 전환
sudo -u postgres psql

# PostgreSQL 콘솔에서 실행
CREATE DATABASE faith_portal;
CREATE USER faith_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE faith_portal TO faith_user;
\q

# 연결 테스트
psql -U faith_user -d faith_portal -h localhost -W
```

#### B-3. pg 패키지 설치

```bash
npm install pg --legacy-peer-deps
```

#### B-4. 데이터베이스 스키마 생성

```bash
cat > schema.sql << 'EOF'
-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    last_login TIMESTAMP,
    level INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'active',
    role VARCHAR(20) DEFAULT 'user'
);

-- 세션 테이블
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 뉴스 테이블
CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    category VARCHAR(50),
    summary TEXT,
    source VARCHAR(100),
    link TEXT,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 게임 점수 테이블
CREATE TABLE IF NOT EXISTS user_game_scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    game_type VARCHAR(50) NOT NULL,
    score INTEGER NOT NULL,
    game_data JSONB,
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 스도쿠 점수
CREATE TABLE IF NOT EXISTS sudoku_scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    time INTEGER NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    mistakes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 테트리스 점수
CREATE TABLE IF NOT EXISTS tetris_scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2048 점수
CREATE TABLE IF NOT EXISTS game2048_scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    max_tile INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 지뢰찾기 점수
CREATE TABLE IF NOT EXISTS minesweeper_scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    time INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 북마크
CREATE TABLE IF NOT EXISTS bookmarks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    news_id INTEGER NOT NULL,
    bookmarked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE
);

-- 관심 종목
CREATE TABLE IF NOT EXISTS watchlist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(100),
    market_type VARCHAR(10),
    memo TEXT,
    target_price DECIMAL(10, 2),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 키워드 구독
CREATE TABLE IF NOT EXISTS user_keywords (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    keyword VARCHAR(100) NOT NULL,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 활동 로그
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 알림
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    priority VARCHAR(20) DEFAULT 'normal',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_game_scores_user_id ON user_game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_game_scores_game_type ON user_game_scores(game_type);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_user_keywords_user_id ON user_keywords(user_id);
EOF

# 스키마 적용
psql -U faith_user -d faith_portal -h localhost -W -f schema.sql

# 확인
psql -U faith_user -d faith_portal -h localhost -W -c "\dt"
```

---

## 4. 환경 변수 설정

### 4.1 .env 파일 생성

```bash
# .env 파일 생성
cat > .env << 'EOF'
# 서버 설정
NODE_ENV=production
PORT=3000

# 데이터베이스 설정 (SQLite)
DATABASE_PATH=./faith-portal.db

# 또는 PostgreSQL
# DATABASE_URL=postgresql://faith_user:your_secure_password@localhost:5432/faith_portal

# 세션 설정
SESSION_SECRET=change_this_to_random_string_min_32_chars

# API 키 (선택사항)
BROWSERLESS_API_TOKEN=your_browserless_token_if_needed

# 로그 레벨
LOG_LEVEL=info
EOF

# 랜덤 시크릿 생성
SESSION_SECRET=$(openssl rand -base64 32)
echo "생성된 SESSION_SECRET: $SESSION_SECRET"

# .env 파일에 업데이트
sed -i "s/change_this_to_random_string_min_32_chars/$SESSION_SECRET/" .env

# 권한 설정 (보안)
chmod 600 .env

# 확인
cat .env
```

### 4.2 .env 파일 로드 설정

```bash
# dotenv 패키지 설치
npm install dotenv --legacy-peer-deps
```

---

## 5. 서버 실행

### 5.1 직접 실행 (테스트)

```bash
# 포트 확인
sudo lsof -i :3000

# 포트 사용 중이면 종료
sudo fuser -k 3000/tcp

# 서버 실행
npm run start

# 다른 터미널에서 테스트
curl http://localhost:3000
curl -I http://localhost:3000/logo_fl.png
```

### 5.2 PM2로 실행 (프로덕션)

```bash
# PM2 시작
pm2 start ecosystem.nodejs.config.cjs

# 상태 확인
pm2 status

# 로그 확인
pm2 logs faith-portal --nostream

# 자동 재시작 설정
pm2 startup
# 출력된 명령어 실행 (sudo 필요)

pm2 save

# 재부팅 후에도 자동 시작됨
```

### 5.3 PM2 관리 명령어

```bash
# 재시작
pm2 restart faith-portal

# 중지
pm2 stop faith-portal

# 삭제
pm2 delete faith-portal

# 모니터링
pm2 monit

# 로그 실시간 보기
pm2 logs faith-portal
```

---

## 6. Nginx 설정

### 6.1 Nginx 설치

```bash
# Ubuntu/Debian
sudo apt-get install -y nginx

# CentOS/RHEL
sudo yum install -y nginx

# 시작 및 활성화
sudo systemctl start nginx
sudo systemctl enable nginx

# 상태 확인
sudo systemctl status nginx
```

### 6.2 Nginx 설정 파일 생성

```bash
# 설정 파일 생성
sudo nano /etc/nginx/sites-available/faith-portal

# 아래 내용 입력
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # 도메인 변경

    # 로그
    access_log /var/log/nginx/faith-portal-access.log;
    error_log /var/log/nginx/faith-portal-error.log;

    # 클라이언트 최대 업로드 크기
    client_max_body_size 10M;

    # Node.js 서버로 프록시
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket 지원
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # 헤더 설정
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 캐시 무효화
        proxy_cache_bypass $http_upgrade;
        
        # 타임아웃
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 정적 파일 캐싱
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6.3 Nginx 활성화

```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/faith-portal /etc/nginx/sites-enabled/

# 기본 사이트 비활성화 (선택)
sudo rm /etc/nginx/sites-enabled/default

# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl reload nginx

# 상태 확인
sudo systemctl status nginx
```

### 6.4 방화벽 설정

```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 'Nginx Full'
sudo ufw allow 22/tcp  # SSH
sudo ufw enable
sudo ufw status

# Firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
sudo firewall-cmd --list-all
```

---

## 7. SSL 인증서 (Let's Encrypt)

### 7.1 Certbot 설치

```bash
# Ubuntu/Debian
sudo apt-get install -y certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install -y certbot python3-certbot-nginx
```

### 7.2 SSL 인증서 발급

```bash
# 자동 설정 (권장)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 이메일 입력
# 약관 동의 (Y)
# 이메일 수신 여부 (N)

# 수동 설정
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com
```

### 7.3 자동 갱신 설정

```bash
# 테스트
sudo certbot renew --dry-run

# Cron 작업 확인 (자동으로 설정됨)
sudo systemctl status certbot.timer

# 수동 갱신
sudo certbot renew
```

### 7.4 Nginx HTTPS 설정

Certbot이 자동으로 설정하지만, 수동으로 확인:

```bash
sudo nano /etc/nginx/sites-available/faith-portal

# HTTPS 리다이렉트 추가
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # ... 나머지 설정 동일
}
```

---

## 8. 모니터링

### 8.1 PM2 모니터링

```bash
# 대시보드
pm2 monit

# 상태
pm2 status

# 로그
pm2 logs faith-portal

# 메모리/CPU 사용량
pm2 show faith-portal
```

### 8.2 시스템 리소스 모니터링

```bash
# 디스크 사용량
df -h

# 메모리 사용량
free -h

# CPU/메모리 실시간
htop  # 설치: sudo apt-get install htop

# 포트 확인
sudo netstat -tulnp | grep :3000
```

### 8.3 로그 확인

```bash
# Nginx 로그
sudo tail -f /var/log/nginx/faith-portal-access.log
sudo tail -f /var/log/nginx/faith-portal-error.log

# PM2 로그
pm2 logs faith-portal

# 시스템 로그
sudo journalctl -u nginx -f
```

---

## 9. 데이터베이스 백업

### SQLite 백업

```bash
# 백업 디렉토리 생성
mkdir -p ~/backups

# 백업 스크립트
cat > backup-sqlite.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)
DB_FILE=~/faith_dev/faith-portal.db

# 백업 실행
cp $DB_FILE $BACKUP_DIR/faith-portal-$DATE.db

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "faith-portal-*.db" -mtime +7 -delete

echo "백업 완료: $BACKUP_DIR/faith-portal-$DATE.db"
EOF

chmod +x backup-sqlite.sh

# Cron 작업 추가 (매일 새벽 3시)
crontab -e
# 추가: 0 3 * * * ~/faith_dev/backup-sqlite.sh
```

### PostgreSQL 백업

```bash
# 백업 스크립트
cat > backup-postgres.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME=faith_portal
DB_USER=faith_user

# 백업 실행
PGPASSWORD=your_password pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_DIR/faith-portal-$DATE.sql

# 압축
gzip $BACKUP_DIR/faith-portal-$DATE.sql

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "faith-portal-*.sql.gz" -mtime +7 -delete

echo "백업 완료: $BACKUP_DIR/faith-portal-$DATE.sql.gz"
EOF

chmod +x backup-postgres.sh

# Cron 작업 추가
crontab -e
# 추가: 0 3 * * * ~/faith_dev/backup-postgres.sh
```

---

## 10. 업데이트 및 배포

### 코드 업데이트

```bash
cd ~/faith_dev

# 최신 코드 가져오기
git pull origin main

# 패키지 업데이트 (필요시)
npm install --legacy-peer-deps

# 서버 재시작
pm2 restart faith-portal

# 로그 확인
pm2 logs faith-portal --nostream
```

### 무중단 배포 (Blue-Green)

```bash
# ecosystem.nodejs.config.cjs 수정
# instances: 2 추가

pm2 reload faith-portal  # 순차적으로 재시작
```

---

## 11. 트러블슈팅

### 포트 사용 중

```bash
# 포트 확인
sudo lsof -i :3000

# 프로세스 종료
sudo fuser -k 3000/tcp
```

### PM2 재시작 안 됨

```bash
# PM2 재설치
pm2 kill
pm2 resurrect
```

### Nginx 502 Bad Gateway

```bash
# Node.js 서버 확인
pm2 status
pm2 logs faith-portal

# Nginx 로그 확인
sudo tail -f /var/log/nginx/faith-portal-error.log

# 방화벽 확인
sudo ufw status
```

### 데이터베이스 연결 오류

```bash
# SQLite 권한 확인
ls -la faith-portal.db
chmod 644 faith-portal.db

# PostgreSQL 연결 테스트
psql -U faith_user -d faith_portal -h localhost -W
```

---

## 12. 보안 체크리스트

- [ ] .env 파일 권한 설정 (chmod 600)
- [ ] 데이터베이스 비밀번호 강력하게 설정
- [ ] SSH 키 기반 인증 사용
- [ ] 방화벽 활성화 (UFW/Firewalld)
- [ ] SSL 인증서 적용
- [ ] 정기 백업 설정
- [ ] PM2 로그 로테이션
- [ ] Nginx 보안 헤더 추가
- [ ] fail2ban 설치 (선택)

---

## 13. 완료 확인

```bash
# 1. 서버 실행 확인
pm2 status

# 2. 로컬 접속 테스트
curl http://localhost:3000

# 3. 이미지 확인
curl -I http://localhost:3000/logo_fl.png

# 4. 도메인 접속 테스트
curl http://your-domain.com

# 5. HTTPS 확인 (SSL 적용 후)
curl https://your-domain.com
```

---

## 🎉 배포 완료!

이제 Faith Portal이 프로덕션 서버에서 완전히 실행됩니다!

**접속 URL:**
- HTTP: http://your-domain.com
- HTTPS: https://your-domain.com

**관리 명령어:**
```bash
pm2 status                 # 상태 확인
pm2 logs faith-portal      # 로그 보기
pm2 restart faith-portal   # 재시작
pm2 monit                  # 모니터링
```

**문제 발생 시:**
1. `pm2 logs faith-portal` 확인
2. `/var/log/nginx/faith-portal-error.log` 확인
3. 데이터베이스 연결 확인
4. 방화벽 설정 확인

---

**추가 도움이 필요하시면 언제든지 문의하세요!** 🚀
