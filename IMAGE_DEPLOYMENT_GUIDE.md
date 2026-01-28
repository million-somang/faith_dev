# 📸 이미지 파일 관리 가이드

## ✅ 현재 상태

**이미지 파일들은 이미 Git에 커밋되어 있습니다!**

```bash
public/
├── logo_fl.png      # 72KB - 메인 로고
├── favicon.ico      # 1.7KB - 브라우저 아이콘
└── favicon.svg      # 502B - SVG 파비콘
```

**Git 상태:**
- ✅ `logo_fl.png` - 커밋됨 (`b78a927`)
- ✅ `favicon.ico` - 커밋됨
- ✅ `favicon.svg` - 커밋됨

---

## 📤 서버에 이미지 올리는 방법

### 방법 1: Git으로 올리기 (권장) ✅

이미 이미지들이 Git에 있으므로, **서버에서 git pull만 하면 됩니다!**

```bash
# 서버에서 실행
ssh user@your-server.com
cd /path/to/faith_dev

# Git에서 최신 코드 받기 (이미지 포함)
git pull origin main

# 확인
ls -lh public/
```

이미지들이 자동으로 다운로드됩니다! 🎉

---

### 방법 2: 새 이미지 추가하는 경우

#### Step 1: 이미지를 `public/` 폴더에 넣기

```bash
# 로컬 개발 환경에서
cd /home/user/webapp/public

# 이미지 파일 복사 (예시)
cp /path/to/new-logo.png ./
cp /path/to/banner.jpg ./
```

#### Step 2: Git에 추가하고 커밋

```bash
cd /home/user/webapp

# 변경사항 확인
git status

# 이미지 파일 추가
git add public/new-logo.png
git add public/banner.jpg

# 커밋
git commit -m "Add new images: logo and banner"

# GitHub에 푸시
git push origin main
```

#### Step 3: 서버에서 받기

```bash
# 서버에서 실행
ssh user@your-server.com
cd /path/to/faith_dev
git pull origin main
```

---

## 🖼️ 이미지 사용 방법

### HTML에서 사용

```html
<!-- 로고 -->
<img src="/logo_fl.png" alt="Faith Portal Logo">

<!-- 파비콘은 자동으로 로드됨 -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="alternate icon" href="/favicon.ico">
```

### 실제 URL

#### Cloudflare Pages 배포 후:
```
https://your-project.pages.dev/logo_fl.png
https://your-project.pages.dev/favicon.ico
```

#### Node.js 서버:
```
http://localhost:3000/logo_fl.png
http://your-domain.com/logo_fl.png
```

---

## 📁 정적 파일 구조

```
webapp/
├── public/              # 정적 파일 폴더 (Git에 커밋)
│   ├── logo_fl.png     # 로고 이미지
│   ├── favicon.ico     # 아이콘
│   ├── favicon.svg     # SVG 아이콘
│   └── static/         # 추가 정적 파일
│       ├── app.js
│       └── styles.css
└── dist/                # 빌드 결과물 (Git에 포함 안 함)
    └── (자동 생성됨)
```

---

## 🚀 배포 시나리오

### 시나리오 A: 기존 이미지 사용 (현재)

```bash
# 서버에서
git clone https://github.com/million-somang/faith_dev.git
cd faith_dev
npm install --legacy-peer-deps
npm run start
```

✅ 이미지가 자동으로 포함됨!

### 시나리오 B: 새 이미지 추가

```bash
# 로컬에서
cd /home/user/webapp
cp /path/to/new-image.png public/
git add public/new-image.png
git commit -m "Add new image"
git push origin main

# 서버에서
git pull origin main
npm run start
```

---

## 💡 팁

### 1. 이미지 최적화

```bash
# PNG 압축 (옵션)
optipng public/*.png
pngquant public/*.png

# JPG 압축 (옵션)
jpegoptim public/*.jpg
```

### 2. 이미지 파일 크기 확인

```bash
ls -lh public/*.png public/*.jpg public/*.svg
```

현재:
- `logo_fl.png`: 72KB ✅ (적절)
- `favicon.ico`: 1.7KB ✅
- `favicon.svg`: 502B ✅

### 3. Git에서 제외할 파일

`.gitignore`에 추가 (임시 파일 제외):

```
# 임시 이미지 (Git에 안 올림)
public/*.tmp.png
public/*.backup.jpg
```

---

## ⚠️ 주의사항

### 1. 큰 파일은 Git LFS 사용 (10MB 이상)

```bash
# Git LFS 설치 (큰 이미지용)
git lfs install
git lfs track "*.psd"
git lfs track "*.ai"
git add .gitattributes
```

### 2. 이미지 경로

#### ✅ 올바른 경로:
```html
<img src="/logo_fl.png">           <!-- public/ 루트 -->
<img src="/static/banner.jpg">     <!-- public/static/ -->
```

#### ❌ 잘못된 경로:
```html
<img src="public/logo_fl.png">     <!-- 'public/' 포함 X -->
<img src="./logo_fl.png">          <!-- 상대경로 사용 X -->
```

### 3. 캐싱 문제

이미지를 변경한 후 브라우저에서 안 보이면:

```bash
# 브라우저 캐시 삭제 (Ctrl + Shift + R)
# 또는 파일명 변경
mv logo_fl.png logo_fl_v2.png
```

---

## 📊 현재 이미지 상태

```bash
$ git log --oneline -- public/*.png public/*.svg public/*.ico

c9a767a Add Node.js server support
b78a927 Replace logo with new horizontal FaithLink design
ee2fc14 Make logo background transparent
4303257 Add FaithLink logo to header
```

**모든 이미지가 Git에 안전하게 저장되어 있습니다!** ✅

---

## 🎯 결론

### 서버에 이미지 올리는 방법:

**단순히 `git pull`만 하면 됩니다!** 🎉

```bash
ssh user@server
cd faith_dev
git pull origin main
```

이미지들이 `public/` 폴더에 자동으로 다운로드되어  
`http://localhost:3000/logo_fl.png`로 접근 가능합니다!

---

**추가 질문이 있으시면 알려주세요!** 😊
