# FaithLink 미니앱(Sub-App) 마스터 개발 및 디자인 가이드

> **문서 버전**: 2.1 (AIO/GEO 최적화 & 클린 라이트 디자인 에디션)  
> **적용 대상**: FaithPortal 전체 미니앱 (`apps/app-*`)  
> **디자인 원칙**: 밝은 배경 기반의 클린 뉴모피즘 (Clean Neumorphism) + 프리미엄 라이트 리포트  
> **기준 모델**: 예·적금 계산기 (`app-interest-calc`), 퇴직금 계산기 (`app-severance-calc`)

이 문서는 FaithLink 통합 플랫폼 내부에서 구동되는 모든 신규 미니앱(금융 도구, 유틸리티, 계산기, 미니게임 등)을 기획, 설계, 개발 및 배포할 때 반드시 준수해야 하는 **아키텍처, 팝업 규격, 마케팅 자동 캡처, 검색엔진(SEO) 및 인공지능(GEO/AIO) 최적화, 밝고 세련된 프리미엄 UX/UI 디자인 시스템 및 JSX 템플릿**을 망라한 단일 공식 표준 가이드입니다.

---

## 📌 핵심 원칙 요약 (Golden Rules)

1. **팝업 고정 규격**: 모든 미니앱은 가로 **450px**, 세로 **850px** 크기의 독립된 팝업으로 렌더링됩니다.
2. **3초 스플래시 & 로딩 화면**: 앱 진입 시 약 3초간 공식 로딩 인트로(기준 뱃지, 3D 아이콘, 프로그레스 바, 하단 광고/스폰서 영역)를 의무 노출합니다.
3. **마케팅 자동화 3단계 캡처 선언**: 관리자 및 SNS 카드뉴스 생성을 위해 `data-screenshot-*` 속성을 3단계(진입 ➡️ 조작 ➡️ 결과)로 컴포넌트에 반드시 표기합니다.
4. **검색엔진(SEO) 및 인공지능(GEO/AIO) 동시 최적화**: 구글·네이버 검색봇뿐만 아니라 **ChatGPT Search, Perplexity, Gemini, Claude 등 최신 AI 검색 에이전트**가 내용을 정확히 읽고 답변에 인용할 수 있도록 시맨틱 HTML5, `llms.txt` 규격, How-to & FAQ 탭 분리, Schema.org JSON-LD(`WebApplication`, `FAQPage`), Open Graph 메타 태그를 완비합니다.
5. **100% 밝고 세련된 클린 라이트 디자인 (다크 디자인 금지)**: 다크 모드/어두운 배경을 절대 사용하지 않으며, 전 화면을 **소프트 화이트 뉴모피즘(입력 단계)**과 **신뢰감 있는 프리미엄 클린 라이트 리포트(결과 단계)**로 구성하여 화사하고 눈이 편안한 최고급 금융/유틸리티 경험을 제공합니다.

---

## 제1장. 플랫폼 아키텍처 및 핵심 개발 규격

### 1.1 팝업 규격
- 미니앱은 메인 포털에서 독립된 팝업 형태로 실행됩니다.
- **너비**: `450px` 고정
- **높이**: `850px` 고정
- 상위 창의 스크롤 튕김 및 불필요한 바깥 영역 스크롤은 글로벌 SDK(`MiniAppLayout`)가 자동으로 차단합니다.

### 1.2 프로젝트 생성 및 디렉터리 구조
FaithLink 플랫폼은 **Turborepo** 기반의 모노레포로 운영됩니다. 새로운 미니앱은 반드시 `apps/` 디렉터리 하위에 생성해야 합니다.

```bash
# 새로운 미니앱 (Vite + React + TypeScript) 생성 예시
cd apps
npm create vite@latest app-calculator -- --template react-ts
```

### 1.3 필수 포트 및 프록시 설정 (`vite.config.ts`)
기존 앱 포트(5000: 메인 포털, 5001: 관리자 대시보드 등)와의 충돌을 방지하기 위해 **5002 이상의 독립된 포트**를 지정하고, 백엔드 API 서버(4000)를 프록시합니다.

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    base: process.env.NODE_ENV === 'production' ? '/calculator/' : '/',
    server: {
        port: 5002, // 5002, 5003, 5004 등 미니앱별 고유 포트 부여
        strictPort: true,
        proxy: {
            '/api': {
                target: 'http://localhost:4000',
                changeOrigin: true,
            },
        },
    },
});
```

### 1.4 모바일 앱 UX 호환성 맞추기 (`@faithportal/mini-app-sdk`)
PC 브라우저에서도 실제 스마트폰 앱처럼 일관된 터치감과 뷰포트를 제공하기 위해 미니앱의 최상위 컴포넌트(`App.tsx`)는 반드시 `MiniAppLayout`으로 래핑해야 합니다.

#### 1) SDK 패키지 의존성 추가
```json
// apps/app-[이름]/package.json
{
  "dependencies": {
    "@faithportal/mini-app-sdk": "*"
  }
}
```

#### 2) 기본 레이아웃 적용 예시 (`App.tsx`)
```tsx
import { MiniAppLayout, useAuth, usePortalMessenger } from '@faithportal/mini-app-sdk';
import '@faithportal/mini-app-sdk/src/mini-app.css'; // 필수 글로벌 CSS

function App() {
    // 1. 통합 인증 세션 연동
    const { user, isLoading } = useAuth();
    
    // 2. 부모 포털과 통신 (이벤트 전송)
    const { sendToPortal } = usePortalMessenger();

    if (isLoading) return <div>로딩 중...</div>;
    if (!user) return <div>로그인이 필요합니다.</div>;

    const handleMissionComplete = () => {
        // 포인트 지급 또는 미션 완료 후, 메인 포털 화면 즉시 새로고침 요청
        sendToPortal('MISSION_CLEAR');
    };

    return (
        <MiniAppLayout title="스마트 유틸리티">
            {/* 여기에 본문 컨텐츠 작성. 스크롤 튕김, 텍스트 선택 등은 SDK가 자동 방어함 */}
            <div className="p-4">
                <h2>환영합니다, {user.name}님!</h2>
                <button onClick={handleMissionComplete}>미션 완료 (포털에 알림)</button>
            </div>
        </MiniAppLayout>
    );
}
export default App;
```

### 1.5 포털에 미니앱 등록하기 (중앙 원격 제어)
미니앱 빌드 후 메인 포털에 노출하고 사용 통계를 집계하기 위해 관리자 대시보드에 등록합니다.

#### 1) 메인 포털 프록시 라우트 등록 (`apps/main-portal/vite.config.ts`)
```ts
proxy: {
    // ... 기존 프록시 목록
    '^/app/calculator.*': {
        target: 'http://localhost:5002', // 신규 미니앱 포트
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/app\/calculator/, ''),
    },
}
```

#### 2) 관리자 대시보드 등록 절차
1. 관리자 계정(`super@admin.com` 등)으로 로그인 후 `/admin` 접속
2. **[미니앱 관리]** 탭으로 이동
3. **[미니앱 등록]** 버튼을 클릭하여 메타데이터 입력:
   - **앱 이름**: 노출될 타이틀 (예: 예·적금 이자 계산기)
   - **슬러그(Slug)**: 고유 영문 식별자 (예: `calculator`)
   - **연동 경로(URL)**: `/app/calculator/` *(끝에 슬래시 필수)*
   - **아이콘**: FontAwesome 태그 (예: `fas fa-calculator`)
   - **접근 권한**: "로그인 필요" 또는 "전체 공개"
   - **상태**: "활성"으로 설정하면 메인 포털 스토어/유틸리티 메뉴에 즉시 실시간 노출

---

## 제2장. 📷 마케팅 자동화 3단계 실화면 캡처 표준

관리자 시스템 및 SNS 자동 마케팅 카드뉴스 생성을 위해, **3단계 고유 화면(진입 ➡️ 조작 ➡️ 결과)**을 자동 캡처할 수 있도록 아래 `data-screenshot-*` 데이터 속성을 JSX에 필수로 선언합니다.

```
[1단계: 진입 (Entry)]  ➔  [2단계: 조작 (Action)]  ➔  [3단계: 결과 (Result)]
빈 폼 & 공식 헤더          샘플 데이터 입력/클릭       최종 산출 라이트 리포트
```

### 1단계: 진입 화면 (Entry)
- 앱 첫 진입 직후 순수 기본 폼과 헤더가 보이는 상태입니다.
- 최상단 `window.scrollTo(0, 0)` 상태에서 자동으로 1차 스크린샷이 생성됩니다.

### 2단계: 메인 컨텐츠 조작 화면 (Action)
- 사용자가 값을 입력하거나 주요 옵션을 선택/조작 중인 인터랙티브 상태입니다.
- **클릭 요소**: `<button data-screenshot-click="action">` 또는 `<div data-screenshot-click="action">`
- **입력 폼 요소**: `<input data-screenshot-input="테스트입력값" />` 또는 `<textarea data-screenshot-input="내용">`
- *예시*: 평수 계산기의 `[34평]` 퀵 칩, 지뢰찾기의 `중앙 셀`, 텍스트 변환기의 `샘플 텍스트 입력창`

### 3단계: 최종 결과 화면 (Result)
- 산출된 프리미엄 결과 리포트, 요약 지표, 또는 비교 카드를 띄우는 상태입니다.
- **실행 버튼**: `<button data-screenshot-click="result">결과 리포트 산출하기</button>`
- **결과 스크롤 타겟**: `<div data-screenshot-point="result">최종 산출 결과</div>`
- *예시*: 퇴직금 계산기의 `[퇴직금 계산하기]` 버튼, 결과 리포트 최상단 컨테이너

---

## 제3장. 검색엔진(SEO) 및 인공지능(GEO / AIO) 최적화 마스터 가이드

유틸리티 미니앱은 "기능"뿐만 아니라 구글·네이버의 오가닉 검색 트래픽과 **ChatGPT, Perplexity, Claude, Gemini 등 생성형 AI 검색 엔진**에서 정답으로 인용될 수 있는 이중 최적화(SEO + GEO)가 필수입니다.

### 3.1 기술적 최적화 (Technical SEO)
- **시맨틱 HTML5 태그 엄수**: 무의미한 `<div>` 남발을 금지하고 `<header>`, `<main>`, `<section>`, `<article>`, `<nav>`, `<footer>`를 구조적으로 배치합니다.
- **모바일 퍼스트(Mobile-First)**: 구글 및 네이버 검색 봇의 모바일 인덱싱 기준에 맞추어 320px~450px 화면에서 레이아웃 깨짐이 없도록 설계합니다.
- **웹 접근성 & ARIA**: 모든 `<input>`, `<button>`에 `aria-label`, `title`을 제공하여 스크린 리더와 크롤러의 이해도를 극대화합니다.

### 3.2 온페이지 최적화 (On-Page SEO) & 콘텐츠 탭 확보
- **단일 H1 원칙**: 페이지 내에 핵심 키워드를 포함한 `<h1>` 태그는 단 1개만 사용하며, `<h2>`, `<h3>`로 논리적인 정보 위계를 유지합니다.
- **롱테일 키워드 URL 구조**:
  - ❌ `example.com/page1`
  - ✅ `example.com/savings-interest-calculator`
- **독립된 [사용방법(How-to)] 및 [FAQ] 탭 의무 구성**: 유틸리티 도구는 텍스트 분량이 적은 것이 취약점입니다. 상단 알약 탭에 메인 계산 기능 외에 **사용방법**과 **FAQ**를 기본 탭으로 포함하여 검색 엔진과 AI 크롤러가 수집할 수 있는 충분한 텍스트 콘텐츠를 확보합니다.
- **상단 우측 소셜 공유 버튼**: 상단 탭 바 우측이나 결과 카드에 직관적인 공유 버튼을 배치하여 바이럴 루프를 형성합니다.

### 3.3 구조화된 데이터 (Schema.org JSON-LD)
구글 검색 결과(SERP)에서 리치 스니펫(별점, 기능 설명, 질의응답)으로 노출되도록 `WebApplication` 및 `FAQPage` JSON-LD 마크업을 `index.html`의 `<head>`에 필수로 삽입합니다.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "name": "예·적금 이자 & 비과세 계산기",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "All",
      "browserRequirements": "Requires JavaScript. Requires HTML5.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "KRW"
      },
      "description": "2026년 금융위원회 및 은행연합회 기준 단리·복리 이자 및 3대 과세유형별 세후 실수령액 정밀 산정기"
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "일반과세와 비과세의 실수령 이자 차이는 얼마인가요?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "일반과세는 이자소득세 14%와 지방소득세 1.4%를 합산한 총 15.4%가 원천징수되며, 비과세 상품은 세금이 전혀 차감되지 않아 100% 실수령합니다."
          }
        }
      ]
    }
  ]
}
</script>
```

### 3.4 메타 태그 & 바이럴 소셜 태그 (Open Graph)
```html
<title>예·적금 이자 계산기 (2026 최신 복리·비과세 절세 비교) | FaithPortal</title>
<meta name="description" content="2026년 최신 은행 금리와 개정 소득세법을 적용하여 단리, 복리, 일반과세, 세금우대, 비과세 혜택별 실수령액을 즉시 계산해 드립니다." />
<meta property="og:type" content="website" />
<meta property="og:title" content="2026 예·적금 이자 & 비과세 계산기" />
<meta property="og:description" content="정기예금·적금 만기 이자 실수령액과 비과세 ISA 절세 혜택을 원클릭으로 비교하세요." />
<meta property="og:image" content="/images/og-interest-calc.png" />
<meta name="twitter:card" content="summary_large_image" />
```

### 3.5 🤖 생성형 인공지능 검색 최적화 (GEO / AIO - Generative Engine Optimization)

인공지능 검색(ChatGPT Search, Perplexity, Google Gemini, SearchGPT, Claude)은 기존 검색 엔진과 달리 **"사용자의 질문에 즉시 직접 정답을 생성하여 인용"**합니다. AI가 우리 미니앱의 데이터와 계산 공식을 우선적으로 읽고 답변의 출처 링크로 인용하도록 아래 4가지 원칙을 적용합니다.

#### 1) LLM 전용 웹 크롤러 허용 정책 (`robots.txt`)
AI 검색 봇이 미니앱 페이지를 차단 없이 색인하도록 `robots.txt`에 AI 유저 에이전트를 명시적으로 허용합니다.
```txt
User-agent: GPTBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /
```

#### 2) 인공지능 에이전트용 `llms.txt` 제공
미니앱의 기능, 공식, 파라미터 규격을 AI가 1초 만에 파악할 수 있도록 서비스 루트에 마크다운 형식의 `llms.txt`를 제공합니다.
```markdown
# 2026 예·적금 이자 및 비과세 계산기
> FaithLink 미니앱 공식 유틸리티

## 개요
2026년 최신 은행연합회 금리 및 대한민국 소득세법(일반과세 15.4%, 세금우대 9.5%, 비과세 0%)을 실시간 반영하여 단리/복리 세후 실수령액을 산출하는 계산 도구입니다.

## 핵심 공식
- 정기예금 단리 세전이자 = 예치원금 × 연이율 × (예치개월 / 12)
- 정기적금 단리 세전이자 = 월납입액 × 연이율 × [개월수 × (개월수 + 1) / 2] / 12
- 소득세 원천징수 = 세전이자 × 15.4% (소득세 14% + 지방소득세 1.4%)

## 주요 FAQ
- Q: 비과세종합저축 가입 대상은?
- A: 만 65세 이상 거주자, 장애인, 국가유공자 등 (1인당 원금 5천만원 한도 비과세)
```

#### 3) 직접 인용 가능한 단답형 Q&A 구조 (Direct Answer Blocks)
FAQ 탭이나 가이드 섹션에 질문 바로 아래 **1~2문장의 명쾌하고 단정적인 정답 요약문**을 배치합니다. AI 검색 엔진은 장황한 서술보다 명확한 수치와 정의가 포함된 단락을 최우선 인용구로 채택합니다.

#### 4) 환각(Hallucination) 방지를 위한 출처 및 산식 명시
도구 하단 및 안내문에 **[2026년 금융위원회 및 국세청 공식 세법 기준]**과 같이 명확한 데이터 출처와 계산 산식을 텍스트로 적시하여, AI가 불확실한 추론 대신 해당 수식을 100% 신뢰할 수 있도록 구성합니다.

---

## 제4장. 프리미엄 UX/UI 디자인 시스템 & 화면별 JSX 템플릿

### 4.1 디자인 철학 (Clean Neumorphism + Premium Light Report)

> ⚠️ **디자인 원칙**: **다크 모드나 어두운 배경은 엄격히 금지됩니다.**  
> 모든 화면은 화사하고 깨끗한 화이트/슬레이트 기반의 **밝은 배경**을 유지하며, 시각적 계층 구조는 **"소프트 화이트 뉴모피즘(입력)"**과 **"프리미엄 클린 라이트 리포트(결과)"**로 완성합니다.

```
[1단계: 인트로/스플래시]  ➔  [2단계: 입력 화면 (Input)]  ➔  [3단계: 결과 리포트 (Result)]
- 밝은 화이트/슬레이트 배경   - 소프트 화이트 뉴모피즘        - 밝고 세련된 클린 리포트 카드
- 공인 기준 뱃지             - 파스텔 블루 안내 배너        - 인디고/블루 대형 히어로 메트릭
- 3D 플로팅 아이콘           - 빠른 퀵 칩 + 세그먼트 토글   - 파스텔 3단 비교 카드 + 원클릭 복사
- 프로그레스 바 + 스폰서/광고  - 고대비 그라데이션 CTA       - 쾌적하고 눈이 편안한 밝은 UI
```

- **입력 단계**: 밝고 친근한 화이트 뉴모피즘을 적용하여 사용자가 편안하게 수치를 입력하도록 유도.
- **결과 단계**: 화이트/소프트 블루 배경 위에 정갈한 인디고/블루 악센트, 파스텔 톤의 3단 비교 카드, 원클릭 복사/공유 버튼을 배치하여 "공식 금융 기관의 정밀 분석 증명서"를 받은 듯한 높은 품격을 제공.

---

### 4.2 화면별 표준 UI 규격 및 코드 템플릿

#### [화면 1] 3초 프리미엄 스플래시 & 로딩 화면 (Splash Screen)

미니앱 접속 시 3초간 노출되는 공식 인트로 화면입니다. 하단에 스폰서/광고 영역이 의무 포함됩니다.

```tsx
<div className="min-h-screen w-full flex flex-col justify-between items-center bg-gradient-to-b from-slate-50 via-white to-slate-100 p-6 sm:p-8 select-none animate-fade-in">
  {/* 1. 상단 브랜딩 & 기준 배지 */}
  <div className="w-full max-w-sm flex items-center justify-between pt-2">
    <div className="flex items-center gap-2">
      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
      <span className="text-xs font-extrabold text-slate-500 tracking-wide uppercase">FAITH PORTAL</span>
    </div>
    <span className="text-[11px] font-black text-blue-700 bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full shadow-2xs">
      2026 공인 기준 준수
    </span>
  </div>

  {/* 2. 중앙 메인 비주얼 & 타이틀 */}
  <div className="w-full max-w-sm flex flex-col items-center justify-center my-auto py-6 text-center">
    <div className="relative mb-6">
      <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center text-3xl sm:text-4xl shadow-xl shadow-blue-500/20 animate-float border-2 border-white">
        <i className="fas fa-coins"></i>
      </div>
      <div className="absolute -bottom-1.5 -right-1.5 bg-white text-blue-600 rounded-full p-1.5 shadow-md border border-slate-100 text-xs">
        <i className="fas fa-check-circle text-emerald-500"></i>
      </div>
    </div>

    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
      스마트 이자 & 자산 계산기
    </h1>
    <p className="text-sm font-bold text-slate-700 mb-1">
      단리·복리 및 과세유형별 절세 혜택 정밀 산정
    </p>
    <p className="text-xs text-slate-400 mb-8 max-w-xs leading-relaxed">
      2026년 최신 개정 규정과 공인 금융 산식 데이터를 실시간 동기화하고 있습니다
    </p>

    {/* 프로그레스 바 */}
    <div className="w-full max-w-xs bg-slate-100 border border-slate-200 h-3 rounded-full overflow-hidden p-0.5 shadow-inner mb-3">
      <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 rounded-full animate-pulse-glow" style={{ width: '100%' }}></div>
    </div>
    <div className="flex items-center justify-center gap-2 text-xs font-black text-blue-600">
      <i className="fas fa-spinner fa-spin text-blue-500 text-xs"></i>
      <span>시스템 초기화 및 데이터 연동 중...</span>
    </div>
  </div>

  {/* 3. 하단 스폰서 / 제휴 광고 영역 & 안내 푸터 */}
  <div className="w-full max-w-sm flex flex-col items-center gap-3 pb-2">
    <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center justify-between">
      <div className="text-left">
        <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block mb-0.5">SPONSORED</span>
        <span className="text-xs font-bold text-slate-800">최신 고금리 특판 상품 및 비과세 ISA 비교 분석</span>
      </div>
      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
        <i className="fas fa-chart-line text-xs"></i>
      </div>
    </div>
    <p className="text-[11px] text-slate-400 text-center leading-relaxed">
      본 유틸리티는 2026년 공인 표준 규정 및 소득세법을 준수합니다.
    </p>
  </div>
</div>
```

---

#### [화면 2] 상단 스티키 헤더 & 알약(Pill) 탭 바

팝업 내부 상단에 고정(`sticky top-0 z-30`)되며 블러 백드롭(`backdrop-blur-md`)을 적용합니다.

```tsx
<header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shadow-xs">
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
        <i className="fas fa-coins text-xs"></i>
      </div>
      <div>
        <h1 className="text-sm font-black text-slate-900 leading-tight">예·적금 이자 계산기</h1>
        <span className="text-[10px] text-slate-500">2026 공인 금융 규정 기준</span>
      </div>
    </div>
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
        FREE
      </span>
      {/* 우측 상단 퀵 공유 버튼 */}
      <button
        type="button"
        onClick={handleShare}
        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs transition-all cursor-pointer"
        title="공유하기"
      >
        <i className="fas fa-share-alt"></i>
      </button>
    </div>
  </div>

  {/* 3단 알약 탭 (계산 도구, 사용방법, FAQ) */}
  <nav className="flex bg-slate-100/80 p-1 rounded-xl gap-1 text-xs font-black">
    <button
      type="button"
      onClick={() => setActiveTab('calc')}
      className={`flex-1 py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
        activeTab === 'calc'
          ? 'bg-white text-blue-700 shadow-xs'
          : 'text-slate-600 hover:text-slate-900'
      }`}
    >
      <i className="fas fa-calculator text-[11px]"></i>
      <span>이자 계산</span>
    </button>
    <button
      type="button"
      onClick={() => setActiveTab('howto')}
      className={`flex-1 py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
        activeTab === 'howto'
          ? 'bg-white text-blue-700 shadow-xs'
          : 'text-slate-600 hover:text-slate-900'
      }`}
    >
      <i className="fas fa-book-open text-[11px]"></i>
      <span>사용방법</span>
    </button>
    <button
      type="button"
      onClick={() => setActiveTab('faq')}
      className={`flex-1 py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
        activeTab === 'faq'
          ? 'bg-white text-blue-700 shadow-xs'
          : 'text-slate-600 hover:text-slate-900'
      }`}
    >
      <i className="fas fa-question-circle text-[11px]"></i>
      <span>자주 묻는 질문</span>
    </button>
  </nav>
</header>
```

---

#### [화면 3] 메인 입력 카드 (`viewMode === 'input'`)

- **안내 배너**: 상단에 은은한 파스텔 그라데이션 박스로 핵심 작동 원리 요약.
- **세그먼트 토글 버튼**: 2개 이상의 모드를 선택할 때 직관적인 탭 버튼 제공.
- **빠른 입력 퀵 칩(Quick Chips)**: 모바일 가상 키보드 호출 없이 원클릭으로 숫자를 주입.
- **마케팅 캡처 속성 표기**: `data-screenshot-click="action"`, `data-screenshot-input`, `data-screenshot-click="result"`

```tsx
<div className="space-y-5 animate-fade-in">
  {/* 1. 상단 안내 배너 */}
  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
      <i className="fas fa-lightbulb text-xs"></i>
    </div>
    <div className="text-xs text-slate-700 leading-relaxed">
      <p className="font-extrabold text-blue-900 mb-0.5">2026 최신 공식 산식 실시간 적용</p>
      <p className="text-slate-600">
        예치 조건과 납입 기간에 따른 세후 실수령액 및 비과세 절세 혜택을 원클릭으로 산출합니다.
      </p>
    </div>
  </div>

  {/* 2. 조건 설정 카드 */}
  <div className="bg-white rounded-2xl p-4.5 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
    {/* 세그먼트 토글 버튼 */}
    <div>
      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">적용 유형</label>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setType('deposit')}
          data-screenshot-click="action"
          className={`py-2.5 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-2 ${
            type === 'deposit'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <i className="fas fa-vault"></i>
          <span>정기예금</span>
        </button>
        <button
          type="button"
          onClick={() => setType('savings')}
          className={`py-2.5 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-2 ${
            type === 'savings'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <i className="fas fa-coins"></i>
          <span>정기적금</span>
        </button>
      </div>
    </div>

    {/* 입력 필드 & 퀵 칩 */}
    <div>
      <label className="block text-[11px] font-bold text-slate-700 mb-1">예치/적립 원금</label>
      <div className="relative">
        <input
          type="number"
          value={amount || ''}
          onChange={(e) => setAmount(Number(e.target.value))}
          data-screenshot-input="10000000"
          placeholder="예: 10,000,000"
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:bg-white focus:border-blue-600 outline-none pr-10"
        />
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">원</span>
      </div>

      {/* 금액 퀵 칩 (Quick Chips) */}
      <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 hide-scrollbar">
        {[1000000, 5000000, 10000000, 30000000, 50000000].map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => setAmount(val)}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border shrink-0 transition-all cursor-pointer ${
              amount === val
                ? 'bg-blue-50 border-blue-400 text-blue-800'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {(val / 10000).toLocaleString()}만원
          </button>
        ))}
      </div>
    </div>

    {/* 계산하기 대형 CTA 버튼 */}
    <button
      type="button"
      onClick={handleCalculate}
      data-screenshot-click="result"
      className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm font-black rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
    >
      <i className="fas fa-calculator text-amber-300 text-sm"></i>
      <span>결과 리포트 산출하기</span>
    </button>
  </div>
</div>
```

---

#### [화면 4] 프리미엄 클린 라이트 결과 리포트 카드 (`viewMode === 'result'`)

계산 완료 시 화면 상단으로 부드럽게 스크롤되며 **밝고 세련된 프리미엄 클린 화이트/블루 리포트 카드**로 전환됩니다. 다크 배경 대신 시인성이 뛰어난 소프트 뉴모피즘 카드와 파스텔 톤 3단 비교 카드를 사용합니다.

```tsx
<div
  data-screenshot-point="result"
  className="bg-white rounded-3xl p-5 sm:p-6 shadow-lg border border-slate-200/90 space-y-5 animate-fade-in"
>
  {/* 상단 헤더: 뒤로가기 + 타이틀 + 원클릭 복사 */}
  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => {
          setViewMode('input');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer"
        title="입력 화면으로 돌아가기"
      >
        <i className="fas fa-arrow-left text-xs"></i>
      </button>
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">CALCULATION REPORT</span>
        <h4 className="text-base sm:text-lg font-black text-slate-900">최종 산출 결과 리포트</h4>
      </div>
    </div>
    <button
      type="button"
      onClick={handleCopyResult}
      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
    >
      <i className="fas fa-copy text-xs"></i>
      <span>결과 복사</span>
    </button>
  </div>

  {/* 메인 결과값: 거대 히어로 메트릭 (밝은 배경 + 볼드 인디고 텍스트) */}
  <div className="bg-gradient-to-br from-blue-50/80 via-indigo-50/30 to-white rounded-2xl p-4 sm:p-5 border border-blue-100 text-center space-y-1 shadow-inner">
    <span className="text-xs text-blue-700 font-extrabold tracking-wide">최종 세후 실수령액</span>
    <div className="text-3xl sm:text-4xl font-black text-blue-900 tracking-tight">
      {finalAmount.toLocaleString()}
      <span className="text-lg font-bold text-slate-600 ml-1">원</span>
    </div>
    <p className="text-[11px] text-slate-500 font-medium">
      총 원금 {principal.toLocaleString()}원 + 세후 순이자 {netProfit.toLocaleString()}원
    </p>
  </div>

  {/* 세부 항목 2분할 카드 (소프트 뉴모피즘 라이트 패널) */}
  <div className="grid grid-cols-2 gap-2 text-center">
    <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200/80">
      <span className="text-[10px] text-slate-500 font-bold block mb-0.5">세전 총 이자</span>
      <span className="text-sm font-black text-slate-800">{grossProfit.toLocaleString()}원</span>
    </div>
    <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200/80">
      <span className="text-[10px] text-slate-500 font-bold block mb-0.5">원천징수 세금</span>
      <span className="text-sm font-black text-rose-600">-{taxAmount.toLocaleString()}원</span>
    </div>
  </div>

  {/* 3대 비교 카드 (일반과세 vs 세금우대 vs 비과세) */}
  <div className="space-y-2 pt-2 border-t border-slate-100">
    <span className="text-[11px] font-extrabold text-slate-700 block">과세 유형별 실수령액 비교</span>
    <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
        <span className="text-slate-500 font-bold block">일반 (15.4%)</span>
        <span className="font-black text-slate-800 mt-1 block">10,253,700원</span>
      </div>
      <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
        <span className="text-amber-700 font-bold block">우대 (9.5%)</span>
        <span className="font-black text-amber-900 mt-1 block">10,271,400원</span>
      </div>
      <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-300 shadow-xs">
        <span className="text-emerald-700 font-black block">비과세 (0%) ✨</span>
        <span className="font-black text-emerald-800 mt-1 block">10,300,000원</span>
      </div>
    </div>
  </div>

  {/* 하단 공유 & 재계산 액션 버튼 */}
  <div className="pt-2 flex gap-2">
    <button
      type="button"
      onClick={() => {
        setViewMode('input');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
    >
      다시 계산하기
    </button>
    <button
      type="button"
      onClick={handleShare}
      className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer active:scale-98"
    >
      결과 공유하기 📤
    </button>
  </div>
</div>
```

---

#### [화면 5] 사용방법(How-to) 및 FAQ 탭 템플릿

사용자가 `activeTab === 'howto'` 또는 `activeTab === 'faq'`를 선택했을 때 렌더링되는 시맨틱 텍스트 패널입니다.

```tsx
{/* 사용방법 탭 */}
{activeTab === 'howto' && (
  <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4 animate-fade-in">
    <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
      <i className="fas fa-book-open text-blue-600"></i>
      <span>간편 이용 가이드 및 계산 공식</span>
    </h2>
    <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
        <p className="font-bold text-slate-800 mb-1">1. 정기예금 vs 정기적금 선택</p>
        <p>목돈을 한 번에 넣어두는 예금과 매월 일정액을 저축하는 적금의 산정 로직이 다릅니다.</p>
      </div>
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
        <p className="font-bold text-slate-800 mb-1">2. 원금 및 기간 설정</p>
        <p>빠른 입력을 위해 상단 퀵 칩 버튼을 클릭하시면 1초 만에 대표 금액이 자동 입력됩니다.</p>
      </div>
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
        <p className="font-bold text-slate-800 mb-1">3. 절세 혜택 즉시 비교</p>
        <p>결과 화면에서 일반과세(15.4%), 세금우대(9.5%), 비과세(0%) 실수령액을 한눈에 대조할 수 있습니다.</p>
      </div>
    </div>
  </section>
)}

{/* FAQ 탭 */}
{activeTab === 'faq' && (
  <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3 animate-fade-in">
    <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-2">
      <i className="fas fa-question-circle text-blue-600"></i>
      <span>자주 묻는 질문 (FAQ)</span>
    </h2>
    <div className="space-y-2 text-xs">
      <details className="group border border-slate-200 rounded-xl p-3 [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex items-center justify-between cursor-pointer font-bold text-slate-800">
          <span>일반과세와 비과세 상품의 세금 차이는?</span>
          <i className="fas fa-chevron-down text-slate-400 group-open:rotate-180 transition-transform"></i>
        </summary>
        <p className="mt-2 text-slate-600 leading-relaxed border-t border-slate-100 pt-2">
          일반과세는 발생한 이자의 15.4%(소득세 14% + 지방소득세 1.4%)가 공제되지만, 비과세 상품(ISA, 농어가 목돈마련 등)은 세금이 0원 부과되어 이자 전액을 수령합니다.
        </p>
      </details>
      <details className="group border border-slate-200 rounded-xl p-3 [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex items-center justify-between cursor-pointer font-bold text-slate-800">
          <span>계산된 결과와 실제 입금액이 다를 수 있나요?</span>
          <i className="fas fa-chevron-down text-slate-400 group-open:rotate-180 transition-transform"></i>
        </summary>
        <p className="mt-2 text-slate-600 leading-relaxed border-t border-slate-100 pt-2">
          금융기관마다 윤년 여부나 일수 계산법(365일 vs 366일), 원단위 절사 기준에 따라 수십 원에서 수백 원 단위의 미세한 차이가 발생할 수 있습니다.
        </p>
      </details>
    </div>
  </section>
)}
```

---

### 4.3 디자인 토큰 레퍼런스 (Design Tokens)

#### 1) 컬러 팔레트 (Color Palette)
- **메인 배경**: `#e8edf2` ~ `#f8fafc` (부드럽고 밝은 라이트 톤)
- **카드/패널 배경**: `#ffffff` (순백색) / 테두리: `#e2e8f0` (Slate-200)
- **Primary Gradient**: `linear-gradient(to right, #2563eb, #06b6d4)` (Blue-600 ➔ Cyan-500)
- **결과 히어로 배경**: `bg-gradient-to-br from-blue-50/80 via-indigo-50/30 to-white` (은은한 파스텔 블루)
- **히어로 텍스트**: `#1e3a8a` (Blue-900) / 포인트: `#059669` (Emerald-600)
- **다크 배경**: **사용 엄격 금지**

#### 2) 라운딩 (Border Radius)
- **전체 컨테이너 / 결과 카드**: `rounded-3xl` (24px)
- **입력 폼 / 섹션 패널**: `rounded-2xl` (16px)
- **버튼 / 탭 알약**: `rounded-xl` (12px)
- **배지 / 칩**: `rounded-full` 또는 `rounded-lg` (8px)

#### 3) 키프레임 애니메이션 (Tailwind / CSS)
- **`animate-fade-in`**: 화면/탭 전환 시 0.25s 동안 `opacity: 0 ➔ 1`, `translateY(4px ➔ 0)`
- **`animate-float`**: 3D 아이콘이 3초 주기로 상하 6px 부드럽게 부유
- **`animate-pulse-glow`**: 프로그레스 바가 반짝이며 충전되는 효과

---

### 4.4 다른 미니앱 적용 체크리스트 (Migration Checklist)

| 단계 | 적용 항목 | 설명 |
|:---:|---|---|
| [ ] | **450px × 850px 팝업 규격** | 독립된 팝업 내부에서 스크롤 튕김 없이 완벽하게 작동하는지 검증 |
| [ ] | **3초 로딩 인트로** | `isLoading` 상태일 때 공식 인트로 스플래시 화면 렌더링 (기준 배지 + 3D 아이콘 + 프로그레스 바 + 하단 광고/스폰서) |
| [ ] | **스티키 헤더 & 알약 탭** | `[메인 기능, 사용방법, FAQ]` 3단 탭 구성 및 `FREE` 배지 + 공유 버튼 부착 |
| [ ] | **2단계 뷰 모드 분리** | `viewMode: 'input' | 'result'` 상태를 도입하여 입력 단계와 결과 단계를 완벽히 분리 |
| [ ] | **입력 퀵 칩(Quick Chips)** | 주요 프리셋 값을 원클릭으로 주입할 수 있는 가로 스크롤 칩 바 제공 |
| [ ] | **프리미엄 클린 라이트 결과 카드** | **다크 모드 배제**, 화이트/블루 파스텔 배경 위에 거대 볼드 히어로 텍스트와 3단 절세 비교 카드 노출 |
| [ ] | **원클릭 클립보드 복사 & 공유** | 결과 카드 우상단에 `[결과 복사]`, 하단에 `[결과 공유하기]` 버튼 배치 |
| [ ] | **마케팅 캡처 속성 표기** | 조작 요소에 `data-screenshot-click="action"`, 폼에 `data-screenshot-input`, 결과 버튼에 `data-screenshot-click="result"`, 결과 카드에 `data-screenshot-point="result"` 속성 선언 |
| [ ] | **SEO 메타 & JSON-LD** | `<title>`, `<meta description>`, Open Graph, `WebApplication` & `FAQPage` 구조화 데이터 삽입 |
| [ ] | **인공지능 최적화(GEO/AIO)** | AI 크롤러 허용, `llms.txt` 요약 문서 및 명확한 수식/단답형 FAQ 구성 |

---

### 4.5 본 가이드 구축에 사용된 스킬 (Used Skills)

본 미니앱 디자인 시스템 및 가이드라인은 다음 3가지 전문 엔지니어링 스킬을 융합하여 설계되었습니다:

1. **FaithPortal Design System (`design-system` 스킬)**
   - **위치**: `d:\project\faithportal\.agents\skills\design-system\SKILL.md`
   - 미니앱 전용 공식 디자인 시스템으로, **밝은 배경 기반의 클린 뉴모피즘**과 Pretendard 타이포그래피, 마이크로 애니메이션을 준수.
2. **Frontend Design (`frontend-design` 스킬)**
   - **위치**: `d:\project\faithportal\.agents\skills\frontend-design\SKILL.md`
   - 단조로운 기본 템플릿 대신, 토스(Toss)와 뱅크샐러드 수준의 **차별화된 비주얼 아이덴티티**를 밝고 화사한 라이트 톤으로 구현.
3. **Brainstorming & Planning (`brainstorming`, `writing-plans` 스킬)**
   - **위치**: `d:\project\faithportal\.agents\skills\brainstorming\SKILL.md`
   - 단순 계산기뿐만 아니라 게임, 변환기, 세무 도구 등 모든 유형의 미니앱에 범용적으로 이식될 수 있도록 모듈화된 템플릿과 체크리스트 체계 수립.

---

## 제5장. AI 바이브코딩 표준 프롬프트 (v0, Cursor, Antigravity)

새로운 미니앱을 AI(v0, Cursor, Antigravity 등)에 의뢰할 때, 아래 프롬프트를 최상단에 붙여넣으면 플랫폼 아키텍처 및 디자인 가이드에 100% 부합하는 고품질 코드가 즉시 생성됩니다.

```text
# Role
Next.js/Vite, React, Tailwind CSS 및 모바일 유틸리티 웹 전문 시니어 프론트엔드 엔지니어입니다.

# Global Requirements (FaithLink Mini-App Standard)
1. 팝업 규격: 450px × 850px 독립 팝업 내부에서 동작합니다.
2. 레이아웃 래퍼: 이미 루트에 제공되는 <MiniAppLayout title="Title"> 내부에 들어갈 컴포넌트만 작성합니다. 최상위 width, height, overflow 래퍼를 씌우지 마세요.
3. 3초 스플래시: 진입 시 3초간 공식 인트로 화면(기준 배지, 3D 플로팅 아이콘, 프로그레스 바, 하단 광고/스폰서 배너)을 표시합니다.
4. 디자인 시스템 (다크 모드 절대 금지, 100% 밝은 라이트 디자인):
   - 입력 단계(viewMode === 'input'): 소프트 화이트 뉴모피즘(bg-slate-50, border-slate-200, 퀵 칩, 세그먼트 토글, 고대비 그라데이션 CTA 버튼).
   - 결과 단계(viewMode === 'result'): 프리미엄 클린 라이트 리포트(bg-white, border-slate-200, bg-gradient-to-br from-blue-50/80 to-white 히어로 카드, text-blue-900 거대 볼드 수치, 파스텔 3단 비교 카드, 결과 복사 및 공유 버튼).
5. 상단 스티키 헤더 & 알약 탭:
   - [메인 기능, 사용방법(How-to), FAQ] 3단 탭 및 우측 공유 버튼 구성.
6. 검색엔진 및 AI 최적화 (SEO & GEO):
   - 단일 H1, WebApplication 및 FAQPage JSON-LD 스키마, Open Graph 메타 태그, 명확한 단답형 질의응답 및 공식 텍스트 명시.
7. 마케팅 자동 캡처 속성 필수 선언:
   - 조작 요소: data-screenshot-click="action"
   - 입력 폼: data-screenshot-input="기본값"
   - 결과 버튼: data-screenshot-click="result"
   - 결과 컨테이너: data-screenshot-point="result"
8. SDK 및 통신:
   - 메인 포털 이벤트 전달: const { sendToPortal } = usePortalMessenger(); -> sendToPortal('MISSION_CLEAR');
   - 사용자 인증: const { user } = useAuth();
   - 아이콘: FontAwesome 또는 lucide-react 사용.
```
