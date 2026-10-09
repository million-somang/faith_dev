# 생활 도구(유틸리티 계산기) SEO & AEO 검색 극대화 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** VERA 포털의 12대 생활 유틸리티 계산기/도구를 네이버, 구글, 그리고 생성형 AI 검색 엔진(Perplexity, ChatGPT 검색, Google AI Overviews)에서 직접 답변 및 1페이지 상위에 노출되도록 전용 정적 랜딩 페이지, Schema.org 구조화 데이터(WebApplication/HowTo/FAQPage), 계산 공식 및 예시, 사이트맵 등록을 완벽 구축한다.

**Architecture:** 
1. `apps/main-portal/src/data/toolsData.ts`에 12대 핵심 도구의 메타데이터, AEO 다이렉트 답변, 법정 계산 공식, 실제 계산 사례, 3단계 HowTo, 3~5개 FAQ를 체계화한다.
2. `apps/main-portal/src/pages/ToolDetailPage.tsx`를 구현하여 단일 H1, 반응형 도구 임베드 실행창, 공식 표, 계산 예시, FAQ, 그리고 Schema.org 복합 JSON-LD를 렌더링한다.
3. `apps/main-portal/scripts/prerender.js`를 확장하여 빌드 타임에 12개 `/tools/:slug/index.html` 정적 페이지를 자동 생성하고, `apps/api-server/src/server.ts`가 이를 302 리다이렉트 없이 즉시 200 OK 정적 서빙하도록 연결한다.
4. `sitemap.xml`과 `robots.txt`를 갱신하여 일반 검색 봇(Googlebot, Yeti, Daumoa) 및 AI 크롤러(GPTBot, PerplexityBot, ClaudeBot 등)의 수집을 극대화한다 (애드센스 심사 봇 보호는 유지).

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Schema.org (JSON-LD), Vite SSG (prerender.js), Hono (Node.js API Server).

## Global Constraints
- 모든 코드는 TypeScript 및 Strict Typecheck 통과 필수.
- 구글 애드센스 심사 보호: `robots.txt`에서 `Mediapartners-Google`, `AdsBot-Google`의 `/tools/` Disallow는 유지하여 복제/도구 사유 거부 방지. 일반 검색 봇 및 AI 봇은 100% Allow.
- 모바일 및 PC 100% 반응형 레이아웃 및 다크/라이트 테마 조화.
- No Placeholders: 모든 도구의 실제 수식, 텍스트, FAQ 데이터를 누락 없이 완성할 것.

---

### Task 1: 12대 생활 도구 전용 고밀도 데이터셋 구축 (`toolsData.ts`)

**Files:**
- Create: `apps/main-portal/src/data/toolsData.ts`
- Test: `scripts/test-tools-data.ts`

**Interfaces:**
- Produces: `ToolDetailItem`, `TOOLS_DETAIL_DATA: Record<string, ToolDetailItem>`

- [ ] **Step 1: Write test script for tools data integrity**

```typescript
// scripts/test-tools-data.ts
import { TOOLS_DETAIL_DATA, ToolDetailItem } from '../apps/main-portal/src/data/toolsData';

console.log('Testing TOOLS_DETAIL_DATA integrity...');
const slugs = Object.keys(TOOLS_DETAIL_DATA);
console.log(`Found ${slugs.length} tools.`);

if (slugs.length < 12) {
    console.error(`Expected at least 12 tools, got ${slugs.length}`);
    process.exit(1);
}

for (const slug of slugs) {
    const item = TOOLS_DETAIL_DATA[slug];
    if (!item.name || !item.title || !item.description || !item.directAnswer) {
        console.error(`Missing required fields in tool: ${slug}`);
        process.exit(1);
    }
    if (!item.formula || !item.example) {
        console.error(`Missing formula or example in tool: ${slug}`);
        process.exit(1);
    }
    if (!item.faqs || item.faqs.length < 2) {
        console.error(`Tool ${slug} needs at least 2 FAQs for AEO.`);
        process.exit(1);
    }
    if (!item.howToSteps || item.howToSteps.length < 3) {
        console.error(`Tool ${slug} needs at least 3 HowTo steps.`);
        process.exit(1);
    }
}

console.log('✅ All 12+ tools data passed integrity tests.');
```

- [ ] **Step 2: Run test to verify it fails initially**

Run: `npx tsx scripts/test-tools-data.ts`
Expected: FAIL (Cannot find module)

- [ ] **Step 3: Implement `apps/main-portal/src/data/toolsData.ts`**

Define all 12 tools with complete data:
1. `severance-calc` (2026 퇴직금 & 실업급여 계산기)
2. `age-calc` (만 나이 · 연 나이 계산기)
3. `pyeong-calc` (부동산 평수 ↔ ㎡ 단위 변환기)
4. `interest-calc` (예·적금 이자 & 비과세 계산기)
5. `dday-calc` (D-Day 및 기념일 계산기)
6. `customs-calc` (해외직구 관·부가세 계산기)
7. `text-checker` (글자수 세기 & 자소서 검사기)
8. `calculator` (스마트 다기능 계산기)
9. `json-formatter` (Pro JSON 스튜디오 & 문법 검증기)
10. `ocr` (브라우저 OCR 이미지 글자 추출기)
11. `base64-converter` (Base64 인코더/디코더 & JWT 분석)
12. `svg-converter` (Vector Studio - 이미지 to SVG 변환)
13. `finance-dsr` (주택담보대출 DSR/LTV 계산기)

Each item must include:
- `slug`, `name`, `title`, `description`, `keywords`, `category`, `categoryLabel`, `icon`, `iconBg`, `iconColor`
- `directAnswer`: AI 검색 봇이 1초 만에 인용할 수 있는 2~3줄 정답 요약
- `formula`: 공식 명칭, 수학/법정 계산 공식 표기, 변수 설명
- `example`: 실제 현실 예시와 계산 과정 및 최종 도출값
- `howToSteps`: 3단계 가이드 (`name`, `text`)
- `faqs`: 실제 질문 2~4개 (`question`, `answer`)
- `appUrl`: 실행 URL (`/app/severance-calc/` 등)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx scripts/test-tools-data.ts`
Expected: PASS (All 12+ tools data passed integrity tests)

- [ ] **Step 5: Commit**

```bash
git add apps/main-portal/src/data/toolsData.ts scripts/test-tools-data.ts
git commit -m "feat(seo): create comprehensive AEO-optimized dataset for 12 utility tools"
```

---

### Task 2: PageSEO 컴포넌트 확장 & 전용 도구 페이지 (`ToolDetailPage.tsx`) 구현

**Files:**
- Modify: `apps/main-portal/src/components/PageSEO.tsx`
- Create: `apps/main-portal/src/pages/ToolDetailPage.tsx`
- Modify: `apps/main-portal/src/App.tsx:180-215`

**Interfaces:**
- Consumes: `TOOLS_DETAIL_DATA` from `toolsData.ts`
- Produces: `/tools/:slug` UI and JSON-LD schema injection (`WebApplication`, `HowTo`, `FAQPage`)

- [ ] **Step 1: Enhance `PageSEO.tsx` to support WebApplication, HowTo, and FAQPage schemas**

Add support for:
```typescript
export interface ToolSchemaProps {
    appType?: 'WebApplication' | 'SoftwareApplication';
    operatingSystem?: string;
    applicationCategory?: string;
    howTo?: { name: string; description: string; steps: { name: string; text: string }[] };
    faq?: { question: string; answer: string }[];
}
```
Inject `WebApplication`, `HowTo`, `FAQPage` into `effectiveJsonLd` array when provided.

- [ ] **Step 2: Create `ToolDetailPage.tsx`**

Features:
- Single semantic `<h1>` tag with targeted keyword title.
- Breadcrumbs: `홈 > 생활도구 > [도구명]`
- Hero badge & Direct Answer Box (AI 즉답 스니펫 전용 콜아웃)
- Embedded interactive tool frame: `<iframe src={tool.appUrl} ... />` for instant calculation without popups.
- AEO Deep Content Section:
  - 📐 **계산 공식 & 법정 산식 (Formula)**
  - 💡 **실제 계산 사례 (Example Case)**
  - 📝 **3단계 사용 가이드 (How-To Steps)**
  - ❓ **자주 묻는 질문 (FAQ)**
- Bottom Related Tools recommendation grid.

- [ ] **Step 3: Register `/tools/:slug` route in `App.tsx`**

```tsx
const ToolDetailPage = lazy(() => import('./pages/ToolDetailPage'));
...
<Route path="/tools/:slug" element={<ToolDetailPage />} />
<Route path="/tools" element={<Navigate to="/lifestyle" replace />} />
```

- [ ] **Step 4: Verify typecheck**

Run: `npx tsc -p apps/main-portal/tsconfig.json --noEmit`
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add apps/main-portal/src/components/PageSEO.tsx apps/main-portal/src/pages/ToolDetailPage.tsx apps/main-portal/src/App.tsx
git commit -m "feat(seo): implement ToolDetailPage with rich AEO schemas and responsive iframe embedding"
```

---

### Task 3: 정적 프리렌더러(`prerender.js`) 및 서버 라우트(`server.ts`) 고도화

**Files:**
- Modify: `apps/main-portal/scripts/prerender.js`
- Modify: `apps/api-server/src/server.ts:210-230`

**Interfaces:**
- Consumes: `TOOLS_DETAIL_DATA`
- Produces: `dist/tools/${slug}/index.html` (12+ pristine static HTML files) & `dist/lifestyle/index.html`

- [ ] **Step 1: Update `prerender.js` to generate all `/tools/:slug/index.html` pages**

Add `generateToolsPages(templateHtml)` in `prerender.js`:
- Iterates over `TOOLS_DETAIL_DATA`
- For each tool, generates:
  - Precise `<title>` and `<meta name="description">`
  - Canonical link: `https://veranex.app/tools/${slug}`
  - Pre-rendered static HTML content containing the Direct Answer, Formula table, Example, How-To, and FAQs
  - Full Schema.org JSON-LD scripts (`WebApplication`, `HowTo`, `FAQPage`)
- Writes output to `apps/main-portal/dist/tools/${slug}/index.html`.

- [ ] **Step 2: Enrich `prerender.js` `/lifestyle` hub page**

Enhance `dist/lifestyle/index.html` with:
- Grid of direct links to all `/tools/:slug` pages (internal linking equity / PageRank flow).
- Rich `FAQPage` schema on the lifestyle hub page.

- [ ] **Step 3: Update `apps/api-server/src/server.ts` `/tools/:slug` route**

Replace the legacy `next-portal` redirect with direct static serving:
```typescript
app.get('/tools/:slug', (c) => {
    const slug = c.req.param('slug');
    const staticFilePath = path.resolve(`./apps/main-portal/dist/tools/${slug}/index.html`);
    if (fs.existsSync(staticFilePath)) {
        return c.html(fs.readFileSync(staticFilePath, 'utf-8'));
    }
    return c.redirect('/lifestyle', 302);
});
app.get('/tools/:slug/', (c) => c.redirect(`/tools/${c.req.param('slug')}`, 301));
```

- [ ] **Step 4: Build main-portal and run prerender**

Run: `npm run build:portal` or `node apps/main-portal/scripts/prerender.js`
Verify that `apps/main-portal/dist/tools/severance-calc/index.html`, `age-calc/index.html`, etc. exist and contain complete HTML.

- [ ] **Step 5: Commit**

```bash
git add apps/main-portal/scripts/prerender.js apps/api-server/src/server.ts
git commit -m "feat(ssg): prerender all tool landing pages with complete AEO static HTML and JSON-LD"
```

---

### Task 4: `sitemap.xml` 및 `robots.txt` 검색/AI 봇 전면 최적화

**Files:**
- Modify: `apps/main-portal/public/sitemap.xml`
- Modify: `apps/main-portal/public/robots.txt`

**Interfaces:**
- Produces: 32 (기존) + 1 (`/lifestyle`) + 1 (`/finance/util`) + 13 (`/tools/*`) = 47 URLs in `sitemap.xml`.
- Produces: Explicit AI crawler permission rules in `robots.txt`.

- [ ] **Step 1: Add utility tools and hubs to `sitemap.xml`**

Add with proper `changefreq: weekly` and `priority: 0.85`:
- `https://veranex.app/lifestyle` (priority 0.90)
- `https://veranex.app/finance/util` (priority 0.90)
- `https://veranex.app/tools/severance-calc`
- `https://veranex.app/tools/age-calc`
- `https://veranex.app/tools/pyeong-calc`
- `https://veranex.app/tools/interest-calc`
- `https://veranex.app/tools/dday-calc`
- `https://veranex.app/tools/customs-calc`
- `https://veranex.app/tools/text-checker`
- `https://veranex.app/tools/calculator`
- `https://veranex.app/tools/json-formatter`
- `https://veranex.app/tools/ocr`
- `https://veranex.app/tools/base64-converter`
- `https://veranex.app/tools/svg-converter`
- `https://veranex.app/tools/finance-dsr`

- [ ] **Step 2: Update `robots.txt` for AI Answer Engines**

Add explicit crawler blocks for AI search engines:
```txt
# AI Search & Answer Engines (Perplexity, ChatGPT, Claude, Gemini, Apple)
User-agent: GPTBot
Allow: /
Allow: /tools/
Allow: /lifestyle
Allow: /guides/

User-agent: PerplexityBot
Allow: /
Allow: /tools/
Allow: /lifestyle
Allow: /guides/

User-agent: ClaudeBot
Allow: /
Allow: /tools/
Allow: /lifestyle
Allow: /guides/

User-agent: Google-Extended
Allow: /
Allow: /tools/
Allow: /lifestyle
Allow: /guides/

User-agent: Applebot-Extended
Allow: /
Allow: /tools/
Allow: /lifestyle
Allow: /guides/
```
(Confirm `Mediapartners-Google` and `AdsBot-Google` still have `Disallow: /tools/` for AdSense isolation.)

- [ ] **Step 3: Validate XML syntax**

Run: `node -e "const fs = require('fs'); const content = fs.readFileSync('apps/main-portal/public/sitemap.xml', 'utf8'); console.log('Sitemap URL count:', (content.match(/<loc>/g) || []).length);"`
Expected: 47 URLs, clean XML.

- [ ] **Step 4: Commit**

```bash
git add apps/main-portal/public/sitemap.xml apps/main-portal/public/robots.txt
git commit -m "seo(sitemap): register all tool landing pages and grant crawl access to AI answer engines"
```

---

### Task 5: 전체 빌드, 스키마 유효성 검증 및 실서버 배포

**Files:**
- Create: `scripts/verify-seo-aeo.ts`

- [ ] **Step 1: Write verification script for static HTML & JSON-LD**

```typescript
// scripts/verify-seo-aeo.ts
import fs from 'fs';
import path from 'path';

const tools = ['severance-calc', 'age-calc', 'pyeong-calc', 'interest-calc', 'calculator', 'customs-calc'];
for (const slug of tools) {
    const filePath = path.resolve(`apps/main-portal/dist/tools/${slug}/index.html`);
    if (!fs.existsSync(filePath)) {
        throw new Error(`Missing dist/tools/${slug}/index.html`);
    }
    const html = fs.readFileSync(filePath, 'utf-8');
    if (!html.includes('application/ld+json')) {
        throw new Error(`Missing JSON-LD in ${slug}`);
    }
    if (!html.includes('FAQPage') || !html.includes('WebApplication')) {
        throw new Error(`Missing required AEO schemas in ${slug}`);
    }
    if (!html.includes('계산 공식') || !html.includes('실제 계산 사례')) {
        throw new Error(`Missing formula or example in ${slug}`);
    }
}
console.log('✅ All sample tool pages passed SEO & AEO verification.');
```

- [ ] **Step 2: Run full build and verification script**

Run:
1. `npm run build` in `apps/main-portal`
2. `node apps/main-portal/scripts/prerender.js`
3. `npx tsx scripts/verify-seo-aeo.ts`
Expected: PASS

- [ ] **Step 3: Deploy to production server (`faithlinkportal`)**

1. Git push to `origin/main`
2. SSH to remote server, `git reset --hard origin/main`
3. `scp` dist folder to server (`apps/main-portal/dist/*`)
4. PM2 reload `faith-portal`

- [ ] **Step 4: Live verification via HTTP requests**

Verify live endpoints:
- `curl -I https://veranex.app/tools/severance-calc` -> 200 OK (no redirect)
- `curl -I https://veranex.app/tools/age-calc` -> 200 OK
- `curl -I https://veranex.app/lifestyle` -> 200 OK
- `curl -s https://veranex.app/tools/severance-calc | grep -i "FAQPage"` -> Found!
- `curl -s https://veranex.app/sitemap.xml | grep -i "severance-calc"` -> Found!
- `curl -s https://veranex.app/robots.txt | grep -i "PerplexityBot"` -> Found!

- [ ] **Step 5: Commit final deployment evidence**

```bash
git commit --allow-empty -m "chore: verify live deployment of SEO/AEO optimized utility tools"
```
