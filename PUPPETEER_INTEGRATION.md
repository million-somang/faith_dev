# Puppeteer 연동 가이드

## 개요

이 프로젝트에 Puppeteer MCP 연동이 추가되었습니다. Puppeteer는 Chrome/Chromium을 제어할 수 있는 Node.js 라이브러리로, 웹 스크래핑, PDF 생성, 스크린샷 캡처 등에 사용됩니다.

## ⚠️ 중요 제한사항

**Cloudflare Workers/Pages 환경에서는 Puppeteer를 직접 실행할 수 없습니다.**

이유:
- Cloudflare Workers는 V8 Isolate 환경으로 Chrome 바이너리를 실행할 수 없음
- 파일 시스템 접근 불가
- 메모리 제한 (128MB)
- CPU 시간 제한 (10-30ms)

## 해결 방법

### 1. 외부 브라우저 서비스 사용 (권장)

#### Browserless.io
```bash
# 환경 변수 설정
BROWSERLESS_API_TOKEN=your_token_here
```

```typescript
// API 사용 예시
const screenshot = await fetch(
  `https://chrome.browserless.io/screenshot?token=${BROWSERLESS_API_TOKEN}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: 'https://example.com',
      options: {
        fullPage: true,
        type: 'png'
      }
    })
  }
)
```

### 2. Cloudflare Browser Rendering API

Cloudflare가 공식 제공하는 브라우저 렌더링 서비스:

```typescript
import puppeteer from "@cloudflare/puppeteer";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const browser = await puppeteer.launch(env.MYBROWSER);
    const page = await browser.newPage();
    await page.goto("https://example.com");
    const screenshot = await page.screenshot();
    await browser.close();
    
    return new Response(screenshot, {
      headers: { "content-type": "image/png" }
    });
  }
};
```

**설정 방법:**
```bash
# wrangler.jsonc에 추가
{
  "browser": {
    "binding": "MYBROWSER"
  }
}

# 요금제: Workers Paid 플랜 필요 (월 $5)
```

### 3. Self-hosted Chrome (고급)

Docker를 사용한 자체 Chrome 서버 구축:

```bash
# Docker로 Chrome 실행
docker run -d -p 3000:3000 browserless/chrome

# API 엔드포인트
http://localhost:3000
```

## API 엔드포인트

### 1. 스크린샷 캡처

**GET** `/api/puppeteer/screenshot`

**파라미터:**
- `url` (필수): 캡처할 웹페이지 URL
- `fullPage` (선택): 전체 페이지 캡처 여부 (true/false)
- `format` (선택): 이미지 형식 (png, jpeg)

**응답:**
```json
{
  "success": false,
  "error": "Puppeteer requires external browser service",
  "message": "Please use a service like Browserless.io or self-hosted Chrome",
  "example": "https://chrome.browserless.io/screenshot?token=YOUR_TOKEN"
}
```

### 2. PDF 생성

**GET** `/api/puppeteer/pdf`

**파라미터:**
- `url` (필수): PDF로 변환할 웹페이지 URL
- `format` (선택): 용지 크기 (A4, Letter 등)

### 3. 웹 스크래핑

**POST** `/api/puppeteer/scrape`

**요청 본문:**
```json
{
  "url": "https://example.com",
  "selector": ".article-title"
}
```

## 테스트 인터페이스

브라우저에서 테스트 페이지 접속:
```
https://your-domain.pages.dev/puppeteer-test
```

기능:
- 스크린샷 캡처 테스트
- PDF 생성 테스트
- 웹 스크래핑 테스트
- 실시간 API 응답 확인

## ✅ 실제 구현 완료

### Browserless.io 연동 완료

**현재 구현된 API 엔드포인트:**

#### 1. 스크린샷 API
```typescript
GET /api/puppeteer/screenshot?url=https://example.com&fullPage=true

// 파라미터:
// - url: 캡처할 웹페이지 URL (필수)
// - fullPage: 전체 페이지 캡처 여부 (true/false)
// - format: 이미지 형식 (png, jpeg)
// - width: 뷰포트 너비 (기본: 1920)
// - height: 뷰포트 높이 (기본: 1080)

// 응답: PNG/JPEG 이미지 바이너리
```

#### 2. PDF 생성 API
```typescript
GET /api/puppeteer/pdf?url=https://example.com&format=A4

// 파라미터:
// - url: PDF로 변환할 URL (필수)
// - format: 용지 크기 (A4, Letter 등)
// - landscape: 가로 모드 (true/false)

// 응답: PDF 파일 바이너리 (자동 다운로드)
```

#### 3. 웹 스크래핑 API
```typescript
POST /api/puppeteer/scrape
Content-Type: application/json

{
  "url": "https://example.com",
  "selector": ".article-title",
  "waitForSelector": ".content",
  "waitTime": 2000
}

// 응답: JSON 형식 스크래핑 결과
```

### 실제 사용 예시

#### 스크린샷 캡처
```bash
# 기본 스크린샷
curl "http://localhost:3000/api/puppeteer/screenshot?url=https://example.com" \
  -o screenshot.png

# 전체 페이지 캡처
curl "http://localhost:3000/api/puppeteer/screenshot?url=https://example.com&fullPage=true" \
  -o fullpage.png
```

#### PDF 생성
```bash
# A4 세로 PDF
curl "http://localhost:3000/api/puppeteer/pdf?url=https://example.com" \
  -o page.pdf

# A4 가로 PDF
curl "http://localhost:3000/api/puppeteer/pdf?url=https://example.com&landscape=true" \
  -o page-landscape.pdf
```

#### 웹 스크래핑
```bash
# 특정 요소 스크래핑
curl -X POST "http://localhost:3000/api/puppeteer/scrape" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://news.ycombinator.com",
    "selector": ".titleline a"
  }'
```

### Cloudflare Browser Rendering 사용

```typescript
// wrangler.jsonc
{
  "name": "webapp",
  "browser": {
    "binding": "MYBROWSER"
  }
}

// src/index.tsx
import puppeteer from "@cloudflare/puppeteer";

type Bindings = {
  MYBROWSER: Fetcher;
}

app.get('/api/screenshot', async (c) => {
  const url = c.req.query('url') || 'https://example.com'
  
  const browser = await puppeteer.launch(c.env.MYBROWSER)
  const page = await browser.newPage()
  await page.goto(url)
  const screenshot = await page.screenshot()
  await browser.close()
  
  return new Response(screenshot, {
    headers: { 'Content-Type': 'image/png' }
  })
})
```

## 환경 변수 설정

### 로컬 개발 (.dev.vars)

```bash
# .dev.vars
BROWSERLESS_API_TOKEN=your_browserless_token
```

### 프로덕션 (Cloudflare Pages)

```bash
# Secrets 설정
npx wrangler pages secret put BROWSERLESS_API_TOKEN --project-name webapp
```

## 사용 사례

1. **웹페이지 아카이빙**: 중요한 페이지를 PDF로 저장
2. **뉴스 스크래핑**: 외부 뉴스 사이트에서 콘텐츠 수집
3. **SEO 프리뷰**: 소셜 미디어 공유 시 미리보기 이미지 생성
4. **테스트 자동화**: E2E 테스트용 스크린샷
5. **데이터 수집**: 동적 웹사이트에서 데이터 추출

## 권장 서비스

### Browserless.io
- **가격**: 무료 플랜 (월 1,000 요청), $29/월 (10,000 요청)
- **장점**: 간단한 설정, 안정적인 인프라
- **단점**: 외부 의존성

### Cloudflare Browser Rendering
- **가격**: Workers Paid 플랜 필요 (월 $5)
- **장점**: Cloudflare 네이티브, 빠른 속도
- **단점**: 아직 베타 단계

### Self-hosted
- **가격**: 서버 비용만
- **장점**: 완전한 제어권
- **단점**: 유지보수 부담

## 🚀 시작하기

### 1단계: Browserless.io 가입 및 API 키 발급

1. **https://www.browserless.io** 접속
2. **Sign Up** - 무료 계정 생성
3. **Dashboard** > **API Keys** > API 키 복사

**무료 플랜:**
- 월 1,000 요청
- 기본 기능 모두 사용 가능
- 신용카드 불필요

### 2단계: 로컬 개발 환경 설정

```bash
# .dev.vars 파일 편집
cd /home/user/webapp
nano .dev.vars

# 다음 내용 추가/수정
BROWSERLESS_API_TOKEN=your_actual_token_here
```

### 3단계: 서버 재시작

```bash
cd /home/user/webapp
npm run build
pm2 restart webapp
```

### 4단계: 테스트

브라우저에서 접속:
```
http://localhost:3000/puppeteer-test
```

1. **스크린샷 테스트**: `https://example.com` 입력 → 캡처
2. **PDF 테스트**: `https://example.com` 입력 → PDF 생성
3. **스크래핑 테스트**: URL 및 CSS Selector 입력 → 데이터 추출

### 5단계: 프로덕션 배포

```bash
# Cloudflare Pages Secrets 설정
npx wrangler pages secret put BROWSERLESS_API_TOKEN --project-name webapp

# 입력 프롬프트에서 API 토큰 입력

# 배포
npm run deploy
```

## 참고 자료

- [Puppeteer 공식 문서](https://pptr.dev/)
- [Cloudflare Browser Rendering](https://developers.cloudflare.com/browser-rendering/)
- [Browserless.io](https://www.browserless.io/)
- [Puppeteer Core](https://www.npmjs.com/package/puppeteer-core)

## 문의 및 지원

- GitHub Issues: 버그 리포트 및 기능 제안
- Pull Requests: 코드 기여 환영
