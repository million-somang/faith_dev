# FaithLink 미니앱(Sub-App) 개발 가이드

이 문서는 FaithLink 통합 플랫폼 내부에 들어갈 새로운 미니앱(게임, 금융, 계산기 등)을 개발할 때 반드시 지켜야 할 아키텍처 및 UX 표준 가이드라인입니다.

---

## 앱을 로딩하는 중에 타이틀을 보여줘. (약 3초) - 그리고, 로딩 중 아래쪽에 광고영역을 만들어줘.

---

## 미니앱은 항상 팝업으로 보인다는 것을 알고 개발을 해.

---

## 미니앱은 모달 팝업 형태로 띄워야해. 그리고, 모달 팝업의 크기는 가로 450px, 세로 850px로 고정해줘.

---

## 0. SEO를 위한 개발 가이드

당신은 검색 엔진 최적화(SEO) 마스터이자 시니어 프론트엔드 개발자입니다. 앞으로 내가 웹 기반 유틸리티(계산기, 변환기, 테스트 등) 제작을 요청할 때, 단순히 기능만 작동하는 코드가 아닌 트래픽을 끌어모을 수 있는 SEO 최적화 코드를 작성해야 합니다. 코드를 작성할 때 반드시 다음 5가지 원칙을 전체 코드(HTML/CSS/JS)에 기본으로 적용하세요.

1. 시맨틱 HTML & 모바일 최우선 (Technical SEO)

무의미한 <div> 남발을 금지하고 <header>, <main>, <section>, <article>, <footer> 등 HTML5 시맨틱 태그를 엄격히 적용할 것.

CSS는 모바일 환경에서 가장 먼저 완벽하게 보이고 PC로 확장되는 '모바일 퍼스트(Mobile-First) 반응형 디자인'으로 작성할 것.

2. 온페이지 구조화 & 콘텐츠 영역 확보 (On-Page SEO)

페이지 내에서 단 1개의 <h1> 태그(핵심 키워드 포함)만 사용하고, <h2>, <h3> 순으로 논리적인 문서 계층을 유지할 것.

도구(계산기 등) UI 하단에 검색 엔진이 텍스트를 수집할 수 있도록 '사용 방법(How to use)'과 '자주 묻는 질문(FAQ)' 섹션을 기본 템플릿으로 포함할 것. 사용방법과 FAQ는 별도의 탭으로 클릭하면 보이도록 해줘. 그리고, 탭에 가장 오른쪽은 공유 버튼을 만들어 주고, 공유를 할 수 있도록 해줘. 탭은 위쪽에 메인 컨텐츠와 같이 탭으로 선택할 수 있도록 해줘.

3. 완벽한 메타 & 소셜 공유 태그 (Meta & Viral)

<head> 영역에 클릭을 유도하는 직관적인 <title>과 타겟 키워드가 포함된 <meta description>을 작성할 것.

카카오톡, 페이스북, 트위터 공유 시 썸네일과 제목이 돋보이도록 Open Graph(og:) 및 Twitter Card 메타 태그를 누락 없이 세팅할 것.

4. 구조화된 데이터 삽입 (Schema.org)

구글 검색 결과(SERP)에서 리치 결과로 노출되도록 <head> 태그 내부에 WebApplication 및 FAQPage 형태의 JSON-LD 스키마 마크업(Schema Markup) 스크립트를 반드시 작성하여 포함할 것.

5. 고성과 UX & 웹 접근성 (Engagement)

사용자가 버튼을 눌러 결과를 확인할 때 페이지 새로고침이 발생하지 않도록 JavaScript(DOM 조작)로 즉각적인 결과를 보여줄 것.

시각 장애인 및 검색 로봇이 입력창을 완벽히 이해할 수 있도록 모든 <input>, <button> 요소에 aria-label 및 alt 속성을 추가할 것.

6. 원칙 1: 사용자 언어 기반의 "키워드 타겟팅" (Foundation)
사람들이 포털 검색창에 실제로 입력하는 단어를 뼈대로 삼아야 합니다.

롱테일 키워드 공략: 단순히 '계산기'가 아니라, '퇴직금 세금 계산기', '네이버 글자수 세기 띄어쓰기 포함'처럼 구체적이고 목적이 명확한 키워드를 메인 타이틀(H1)에 배치하세요.

직관적인 URL 구조: URL은 검색 엔진이 페이지 주제를 파악하는 첫 번째 단서입니다. 한글보다는 의미를 담은 깔끔한 영문 소문자와 하이픈(-)을 사용하세요.

❌ example.com/page1

✅ example.com/d-day-calculator

7. 원칙 2: 텍스트 콘텐츠의 보강 "온페이지(On-Page) SEO" (Content)
유틸리티 페이지의 가장 큰 약점은 '글'이 부족하다는 것입니다. 검색 엔진은 텍스트를 통해 페이지의 가치를 평가합니다.

사용법과 FAQ 추가: 계산기나 변환기 UI만 덩그러니 놓지 마세요. 도구 바로 아래에 '사용 방법', '자주 묻는 질문(FAQ)', '관련 상식' 등을 텍스트로 풀어써서 검색 엔진이 긁어갈 수 있는 콘텐츠 양을 확보해야 합니다.

철저한 헤딩(Heading) 계층: 문서의 목차를 짜듯 H1(페이지 주제)은 단 하나만 쓰고, H2(섹션 제목), H3(세부 내용) 순서로 논리적인 태그 구조를 지키세요.

8. 원칙 3: 검색 엔진 친화적 설계 "기술적(Technical) SEO" (Structure)
AI에게 코딩을 맡길 때 반드시 강제해야 하는 기술적 환경입니다.

모바일 최우선 (Mobile-First): 구글과 네이버 모두 모바일 페이지를 기준으로 사이트를 평가합니다. PC보다 모바일 화면에서 완벽하게 작동하고 빠르게 로딩되도록 반응형 웹으로 구축하세요.

시맨틱 웹 (Semantic Web): <div> 태그로만 도배하지 말고, <header>, <main>, <article>, <footer> 등 의미에 맞는 HTML5 태그를 사용하여 검색 로봇이 페이지 구조를 쉽게 이해하게 만드세요.

9. 원칙 4: 리치 결과 노출을 위한 "구조화된 데이터" (Visibility)
검색 결과 페이지(SERP)에서 내 사이트가 유독 눈에 띄게 만드는 가장 강력한 무기입니다.

Schema.org 마크업 적용: AI에게 "이 페이지에 WebApplication과 FAQPage 스키마 마크업(JSON-LD 형식)을 추가해 줘"라고 지시하세요. 검색 결과에 앱 별점, FAQ 목록 등이 함께 노출되어 클릭률(CTR)이 압도적으로 높아집니다.

10. 원칙 5: 체류 시간 증대와 "바이럴 루프" 구축 (Engagement)
검색 엔진은 사용자가 사이트에 오래 머물고, 링크를 많이 공유할수록 '좋은 문서'로 판단하여 순위를 올려줍니다.

빠른 결과 제공: 클릭 버튼을 누르면 페이지 새로고침 없이 즉각적으로 결과가 나오도록 비동기식(AJAX/JavaScript)으로 구현하세요.

완벽한 소셜 공유(OG 태그): 카카오톡, 페이스북, X(트위터) 등에 결과를 공유할 때, 호기심을 유발하는 이미지와 제목이 뜨도록 Open Graph 태그를 세밀하게 설정하세요.


---

## 1. 프로젝트 생성 및 기본 구조

FaithLink 플랫폼은 **Turborepo** 기반의 Monorepo(모노레포)로 구성되어 있습니다.
새로운 미니앱은 반드시 `apps/` 폴더 하위에 생성해야 합니다.

```bash
# 새로운 미니앱(Vite + React) 템플릿 생성 예시
cd apps
npm create vite@latest app-calculator -- --template react-ts
```

### 필수 포트 설정 (`vite.config.ts`)
기존 포털과의 충돌을 피하기 위해 **5002 이상의 독립된 포트**를 사용하고, API 서버(4000)를 프록시합니다.

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    base: process.env.NODE_ENV === 'production' ? '/calculator/' : '/',
    server: {
        port: 5002, // 기존 앱(5000, 5001)과 겹치지 않는 포트
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

---

## 2. 모바일 앱 UX 호환성 맞추기 (`@faithportal/mini-app-sdk`)

PC 브라우저에서도 실제 스마트폰 앱처럼 보이도록 **글로벌 SDK 래퍼**를 제공합니다. 미니앱의 최상위 컴포넌트(`App.tsx` 등)를 반드시 `MiniAppLayout`으로 감싸야 합니다.

### SDK 설치
```bash
# 미니앱의 package.json dependencies에 추가 (Turborepo 워크스페이스 연동)
"@faithportal/mini-app-sdk": "*"
```

### 기본 레이아웃 적용 예시 (`App.tsx`)
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
        // 포인트 지급 등의 로직 완료 후, 메인 포털 화면 즉시 새로고침 요청
        sendToPortal('MISSION_CLEAR');
    };

    return (
        <MiniAppLayout title="퍼즐 게임">
            {/* 여기에 컨텐츠 작성. 스크롤 튕김, 텍스트 선택 등은 SDK가 자동 방어함 */}
            <div className="p-4">
                <h2>환영합니다, {user.name}님!</h2>
                <button onClick={handleMissionComplete}>미션 완료 (포털에 알림)</button>
            </div>
        </MiniAppLayout>
    );
}
export default App;
```

---

## 3. 포털에 미니앱 등록하기 (관리자 중앙 제어)

미니앱 개발이 끝났다면, 메인 포털에 노출하고 사용 현황을 추적하기 위해 **관리자 페이지**를 통해 앱을 등록해야 합니다. 기존처럼 하드코딩으로 버튼을 추가할 필요가 없습니다.

### 1) Vite 프록시 추가 (`apps/main-portal/vite.config.ts`)
```ts
proxy: {
    // ...기존 프록시
    '^/app/calculator.*': {
        target: 'http://localhost:5002', // 신규 미니앱 포트
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/app\/calculator/, ''), // 주의: Rewrite 로직 확인 필요
    },
}
```

### 2) 관리자 대시보드에서 미니앱 추가
1. **관리자 계정**(`super@admin.com` 등)으로 로그인 후 관리자 대시보드(`/admin`)에 접속합니다.
2. **[미니앱 관리]** 탭으로 이동합니다.
3. **"미니앱 등록"** 버튼을 눌러 다음 정보를 입력합니다.
   - **앱 이름**: 노출될 이름 (예: 다기능 계산기)
   - **슬러그**: 영문 고유 ID (예: `calculator`)
   - **연동 경로(URL)**: 위에서 등록한 프록시 URL (예: `/app/calculator/` `*끝에 슬래시 유의*`)
   - **아이콘**: FontAwesome 태그 (예: `fas fa-calculator`)
   - **접근 권한**: "로그인 필요" 여부 선택
   - **상태**: "활성"으로 두시면 즉시 **생활 유틸리티(또는 미니앱 스토어)** 페이지에 런처 아이콘이 뜹니다.

> 관리자에 의해 활성화된 앱은 프론트엔드에서 `/api/mini-apps`를 통해 동적으로 로딩하며, 클릭 시 사용량 통계 로그가 자동으로 기록됩니다.

---

## 4. [중요] 개발 전 바이브코딩 프롬프트 (v0, Cursor 활용)

새로운 미니앱의 UI를 AI(v0, Cursor 등)에 의뢰할 때, 아래 문구를 프롬프트 최상단에 붙여넣으면 플랫폼 정책에 100% 맞는 코드가 생성됩니다.

```text
# Role
Next.js/Vite 및 Tailwind CSS 모바일 웹 전문가입니다.

# Global Requirements (FaithLink Mini-App Standard)
1. 이미 루트에 제공되는 `<MiniAppLayout title="Title">` 안에 들어갈 컨텐츠만 작성합니다. 최상위 `width`, `height`, `overflow` 래퍼를 씌우지 마세요.
2. 모든 이벤트(뒤로가기, 닫기 금지) 등 브라우저 창(Window) 제어 로직은 작성하지 마세요. (SDK가 처리함)
3. 메인 포털에 상태 변경을 알려야 할 때는 `const { sendToPortal } = usePortalMessenger()` 훅을 Import해서 `sendToPortal('MISSION_CLEAR')`만 호출하세요.
4. 사용자 정보가 필요할 경우 `const { user } = useAuth()` 훅을 사용하세요. (user.id, user.name, user.level 등)
5. `lucide-react`를 사용하여 깔끔한 SVG 아이콘을 적극 사용하세요.
```
