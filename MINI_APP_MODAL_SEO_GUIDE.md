# 📱 미니앱 모달·초기 로딩·SEO/AEO 표준 이식 가이드

이 문서는 스마트 계산기에서 완성 및 검증된 **1) 모달 물리 키보드 릴레이, 2) 프리미엄 로딩 화면, 3) SEO 및 AI 답변 엔진(AEO) 스키마 최적화 기술**을 플랫폼 내 다른 미니앱(스도쿠, 2048, 텍스트 도구 등)에 동일하게 완벽 이식하기 위한 마스터 구현 명세 및 체크리스트입니다.

---

## 📂 목차
1. [물리 키보드 릴레이 & 포커스 가이드 (모달 최적화)](#1-물리-키보드-릴레이--포커스-가이드-모달-최적화)
2. [프리미엄 초기 로딩 화면 표준 (UX 극대화)](#2-프리미엄-초기-로딩-화면-표준-ux-극대화)
3. [SEO & AI 답변 엔진 (AEO) 최적화 표준](#3-seo--ai-답변-엔진-aeo-최적화-표준)
4. [프로덕션 빌드 및 오염 방지 안전 수칙](#4-프로덕션-빌드-및-오염-방지-안전-수칙)
5. [미니앱 공통 탭 시스템 & 자유토론(커뮤니티) 이식 가이드](#5-미니앱-공통-탭-시스템--자유토론커뮤니티-이식-가이드)

---

## 1. 물리 키보드 릴레이 & 포커스 가이드 (모달 최적화)

크로스 오리진 iframe 환경에서는 사용자가 iframe 내부를 마우스로 클릭하기 전에는 브라우저 포커스가 부모 창에 머물러 있어, 물리 키보드 타건 이벤트가 iframe 자식 미니앱으로 자동 전달되지 않습니다. 이를 극복하기 위해 **부모 가로채기 릴레이 프로토콜**을 완벽하게 이식합니다.

### A. 부모 창 (`main-portal` 측) 연동
부모 모달(`UtilityPage.tsx` 등)이 열려 있을 때 발생하는 모든 전역 `keydown` 이벤트를 가로채어 자식 iframe의 `contentWindow`로 릴레이합니다.

```tsx
// UtilityPage.tsx 내부 구현 표준
useEffect(() => {
    if (!modalOpen) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
        // 입력 필드(input, select, textarea)에 포커스가 있는 경우 릴레이 생략
        const activeEl = document.activeElement;
        if (activeEl && (
            activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'SELECT' ||
            activeEl.tagName === 'TEXTAREA'
        )) {
            return;
        }

        const iframe = document.querySelector('.mini-app-modal-iframe') as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
                type: 'PARENT_KEYBOARD_EVENT',
                key: e.key,
                code: e.code,
                shiftKey: e.shiftKey,
                ctrlKey: e.ctrlKey,
                altKey: e.altKey,
                metaKey: e.metaKey
            }, '*');
        }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
}, [modalOpen]);
```

### B. 자식 미니앱 메인 (`App.tsx` 측) 구현
부모로부터 전송된 키 메시지를 받아 `document.parentKeyboardCallback` 단일 채널로 포워딩합니다.
* **타입 안정성 준수 (any 캐스팅 원천 배제)**: `declare global`을 상단에 기재하여 `document.parentKeyboardCallback`을 Type-Safe하게 활용합니다.

```tsx
// apps/app-자식미니앱/src/App.tsx 상단 선언
declare global {
  interface Document {
    parentKeyboardCallback?: ((key: string) => void) | null;
  }
}

// App 컴포넌트 내부 릴레이 리스너 구현
useEffect(() => {
  const handleGlobalMessage = (e: MessageEvent) => {
    if (e.data && e.data.type === 'PARENT_KEYBOARD_EVENT') {
      const key = e.data.key;
      // 등록된 자식 콜백이 존재하면 안전하게 호출
      if (typeof document.parentKeyboardCallback === 'function') {
        document.parentKeyboardCallback(key);
      }
    }
  };
  window.addEventListener('message', handleGlobalMessage);
  return () => window.removeEventListener('message', handleGlobalMessage);
}, []);
```

### C. 개별 콘텐츠 컴포넌트 (BasicCalc.tsx, GameBoard.tsx 등) 구현
자식 미니앱의 로직을 담당하는 컴포넌트에서 콜백을 가로채고, **React 18 StrictMode의 더블 마운트(Double-Mount)** 현상에 대처합니다.
* **클린업 가드**: 마운트 해제(Cleanup) 시 단순히 `null`로 밀어버리면 더블 마운트 틱에서 콜백이 유실되므로, **자신이 등록한 레퍼런스일 때만 초기화**하도록 안전 가드를 반드시 부착합니다.

```tsx
// apps/app-자식미니앱/src/components/컨텐츠.tsx 상단 선언
declare global {
    interface Document {
        parentKeyboardCallback?: ((key: string) => void) | null;
    }
}

// 컴포넌트 내부 셋업
useEffect(() => {
    const focusContainer = () => {
        window.focus();
        if (containerRef.current) containerRef.current.focus();
        // 부모 창에게 계산기/게임 준비 완료 신호를 보내서 물리 포커스 보장
        window.parent.postMessage({ type: 'MINI_APP_READY' }, '*');
    };
    const timer = setTimeout(focusContainer, 50);
    window.addEventListener('click', focusContainer);

    const handleKeyDown = (e: KeyboardEvent) => {
        // 기존 로컬 물리 키보드 타건 로직 (예: 스도쿠 숫자 입력, 방향키 조작 등)
        processInput(e.key);
    };

    // [핵심] 전역 릴레이 콜백 등록
    const myCallback = (key: string) => {
        processInput(key); // 동일한 입력 처리 로직 바인딩
    };
    document.parentKeyboardCallback = myCallback;

    document.addEventListener('keydown', handleKeyDown);
    return () => {
        clearTimeout(timer);
        // [중요 가드] 본인이 지정한 콜백일 때만 클린업하여 StrictMode 버그 예방
        if (document.parentKeyboardCallback === myCallback) {
            document.parentKeyboardCallback = null;
        }
        window.removeEventListener('click', focusContainer);
        document.removeEventListener('keydown', handleKeyDown);
    };
}, []);
```

---

## 2. 프리미엄 초기 로딩 화면 표준 (UX 극대화)

미니앱 진입 시 뚝뚝 끊기는 리렌더링 경험을 원천 차단하고 통일된 고급 브랜드 이미지를 제공하기 위해, **3초 강제 스켈레톤 및 프리미엄 비주얼 로딩 레이아웃**을 전면 강제합니다.

### A. 로딩 상태 셋업 (`App.tsx`)
```tsx
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const timer = setTimeout(() => setIsLoading(false), 3000); // 3초 로딩 플러싱
  return () => clearTimeout(timer);
}, []);
```

### B. 로딩 UI 구조 설계 (HTML5 시맨틱 및 AEO 친화구조)
로딩 중에도 크롤러가 사이트의 가치와 정체성을 인식할 수 있도록 시맨틱 HTML 표준 태그를 사용합니다.

```tsx
if (isLoading) {
  return (
    <MiniAppLayout title="">
      <div className="loading-screen" role="status" aria-label="앱 로딩 중">
        <div className="loading-body">
          {/* 중앙 프리미엄 아이콘 서클 */}
          <div className="loading-icon-wrapper">
            <img src={appLogo} alt="앱 로고" className="loading-logo-img" />
          </div>

          {/* 타이틀 및 미션 서술문 */}
          <h1 className="loading-title">앱 이름</h1>
          <p className="loading-subtitle">한 줄 요약 핵심 가치문 기입</p>

          {/* 프리미엄 로딩 스피너 도트 */}
          <div className="loading-spinner" aria-hidden="true">
            <div className="spinner-dot"></div>
            <div className="spinner-dot"></div>
            <div className="spinner-dot"></div>
          </div>

          {/* 하단 브랜드/광고 배너 영역 */}
          <aside className="loading-ad-banner" aria-label="광고 및 안내">
            <div className="ad-placeholder">
              <span className="ad-badge">안내</span>
              <span className="ad-text">FaithLink와 함께하는 프리미엄 유틸리티</span>
            </div>
          </aside>
        </div>
      </div>
    </MiniAppLayout>
  );
}
```

---

## 3. SEO & AI 답변 엔진 (AEO) 최적화 표준

AI 검색 엔진(Gemini, Perplexity, GPT-Search 등)이 검색어에 가장 부합하는 답변 카드로 아워 플랫폼 미니앱을 직접 인용·노출하도록 유도하는 최첨단 AEO 설계 기법입니다.

### A. `PageSEO` 컴포넌트 필수 이식
모든 페이지의 `return` 구문 최상단에 메인 포털에서 정의된 공통 `PageSEO` 컴포넌트를 이식해 Title, Meta Description, Canonical Link를 주입합니다.

```tsx
import { PageSEO } from '../components/PageSEO';

return (
    <div>
        <PageSEO
            title="미니앱 이름 - 전문 키워드 나열 (예: 스마트 스도쿠)"
            description="해당 도구가 사용자에게 주는 핵심 가치 및 사용 효과를 160자 내외로 상세 설명"
            path="/app/자식미니앱"
        />
        {/* 콘텐츠 본문 */}
    </div>
);
```

### B. JSON-LD 구조화 데이터 설계 (AEO 핵심 가이드라인)
`index.html` 혹은 진입점에 검색엔진 크롤러가 읽어갈 의미 구조화 데이터를 JSON-LD 포맷으로 정교하게 주입합니다.
* **WebApplication**: 앱의 카테고리, 요구사항, 주요 기능을 구조화합니다.
* **HowTo**: 이 앱을 가지고 원하는 가치를 달성하는 구체적인 사용 단계를 정교히 가이드합니다.
* **FAQPage**: 사용자가 해당 주제(예: 스도쿠 푸는 법, 대출 이자 계산 등)에 대해 자주 묻는 질문을 답변 엔진 형식으로 수록해 직접 인용을 유도합니다.

```html
<!-- index.html <head> 내부 주입 예시 -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "미니앱 명칭",
  "alternateName": "영문/대체 명칭",
  "description": "앱이 제공하는 가치 설명 서술",
  "url": "https://faithlink.site/app/자식미니앱/",
  "applicationCategory": "GameApplication / UtilityApplication",
  "operatingSystem": "All",
  "browserRequirements": "Requires HTML5, CSS3, and JavaScript support.",
  "featureList": "제공하는 기능 리스트 콤마 단위 나열"
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "앱 사용 방법 및 가이드",
  "description": "목표를 이루기 위한 간결한 단계별 공식 프로토콜",
  "step": [
    {
      "@type": "HowToStep",
      "name": "1단계 동작 명칭",
      "text": "사용자가 처음 수행해야 하는 행동의 상세 서술",
      "url": "https://faithlink.site/app/자식미니앱/"
    },
    {
      "@type": "HowToStep",
      "name": "2단계 동작 명칭",
      "text": "결과 확인 및 가치 달성 과정 설명",
      "url": "https://faithlink.site/app/자식미니앱/"
    }
  ]
}
</script>
```

### C. HTML5 시맨틱 태그 규칙
* **단일 `<h1>` 원칙**: 매칭되는 메인 콘텐츠 제목 영역에 단 하나의 `<h1>` 태그만 존재해야 합니다.
* **영역의 격리**: 본문 콘텐츠는 `<main>`, 내비게이션 바는 `<nav>`, 보조 설명이나 광고판은 `<aside>`, 하단 문구는 `<footer>`로 감싸 검색 로봇이 본문에 집중하도록 만듭니다.

---

## 4. 프로덕션 빌드 및 오염 방지 안전 수칙

스마트 계산기 작업에서 입증되었듯, **로컬 찌꺼기 파일**은 모노레포와 Vite 번들러 환경 하에서 소스 코드 HMR을 무력화하고 구버전을 지속 주입시키는 파괴적인 결함을 야기합니다. 다음 수칙을 빌드 시 뼈에 새겨 적용합니다.

### 🚨 찌꺼기 파일 컴파일 원천 차단 수칙
1. **TypeScript 설정 복원**: `tsconfig.json` 파일의 `compilerOptions` 설정 중 소스 디렉토리 내에 직접 빌드를 뿜어내는 설정(`noEmit` 혹은 outDir 미지정 오작동)을 확인하여, `.tsx`가 들어 있는 `src` 내부에 **절대 `*.js` 및 `*.d.ts` 파일이 임의 컴파일되어 혼재되지 않도록** 격리 조치합니다.
2. **사전 컴포넌트 폴더 스캔**: 컴포넌트 수정 후 빌드하기 전, 터미널에서 다음 명령어를 실행하여 찌꺼기를 사전에 영구 박멸합니다:
   ```powershell
   # src 하위의 잘못 컴파일된 구버전 js 파일 일괄 삭제
   Get-ChildItem -Path "c:\project\faithportal\apps" -Recurse -Include "*.js", "*.d.ts", "*.d.ts.map" | Remove-Item -Force
   ```
3. **Vite 개발 서버 리부팅 캐시 클리어**: 코드를 변경하고 번들을 새로 갱신한 경우, Vite의 Dependency 번들 캐시 오염을 극복하기 위해 반드시 **`--force` 옵션**을 붙여 기동합니다:
   ```bash
   npm run dev -- --force
   ```

---

## 5. 미니앱 공통 탭 시스템 & 자유토론(커뮤니티) 이식 가이드

이 장에서는 모든 미니앱(계산기, 글자수세기, 스도쿠, 2048 등)에 필수적으로 적용되어야 하는 **3탭 레이아웃(핵심 기능, 사용방법, 자유토론)**과 **자유토론 공용 모듈(`MiniAppCommunity`)**의 통일 이식 규격을 명시합니다.

### A. 탭 시스템(Tab Navigation) 설계 표준
모든 미니앱의 최상단에는 사용자가 해당 도구의 메인 기능 외에도 '사용방법'과 '자유토론' 공간으로 유연하게 이동할 수 있는 탭 바를 반드시 배치해야 합니다.

1. **상태 관리 및 타입 정의 (`App.tsx`)**:
   ```typescript
   type TabType = 'main' | 'howto' | 'community'; // 'main'은 'checker', 'calculator' 등 핵심 도구명으로 커스터마이징 가능
   const [activeTab, setActiveTab] = useState<TabType>('main');
   ```

2. **탭 내비게이션 UI 마크업 (`App.tsx`)**:
   ```tsx
   <nav className="flex w-full gap-2 p-1.5 bg-gray-100/80 backdrop-blur-xs rounded-2xl mb-8 max-w-lg mx-auto shadow-inner border border-gray-200" role="tablist">
     <button
       role="tab"
       aria-selected={activeTab === 'main'}
       onClick={() => setActiveTab('main')}
       className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
         activeTab === 'main'
           ? 'bg-white text-green-700 shadow-xs border border-gray-200/50'
           : 'text-gray-500 hover:text-gray-800'
       }`}
     >
       <i className="fas fa-tools"></i>
       핵심기능
     </button>
     <button
       role="tab"
       aria-selected={activeTab === 'howto'}
       onClick={() => setActiveTab('howto')}
       className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
         activeTab === 'howto'
           ? 'bg-white text-green-700 shadow-xs border border-gray-200/50'
           : 'text-gray-500 hover:text-gray-800'
       }`}
     >
       <i className="fas fa-book-open"></i>
       사용방법
     </button>
     <button
       role="tab"
       aria-selected={activeTab === 'community'}
       onClick={() => setActiveTab('community')}
       className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
         activeTab === 'community'
           ? 'bg-white text-green-700 shadow-xs border border-gray-200/50'
           : 'text-gray-500 hover:text-gray-800'
       }`}
     >
       <i className="fab fa-instagram"></i>
       자유토론
     </button>
   </nav>
   ```

### B. 사용방법(HowTo) 가이드 페이지 표준 규격
각 미니앱의 1) 주요 기능에 대한 구체적인 메커니즘을 상세 설명하는 카드 그리드 및 2) AI 답변 엔진(AEO)이 직접 파싱할 수 있는 자주 묻는 질문/지식 테이블(FAQ Table) 뷰로 설계합니다.

* **가이드 콘텐츠 및 테이블 템플릿**:
  ```tsx
  {activeTab === 'howto' && (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-100 space-y-8 animate-fadeIn">
      {/* 1. 타이틀 섹션 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
          <i className="fas fa-book-open text-green-600"></i>
          [미니앱 이름] 사용방법 및 공식 가이드
        </h1>
        <p className="text-gray-600 text-sm">해당 도구를 효율적으로 사용하고 고유의 가치를 극대화하기 위한 가이드라인입니다.</p>
      </div>

      {/* 2. 핵심 기능 리스트 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 space-y-2">
          <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded">기능 01</span>
          <h2 className="text-base font-bold text-gray-800">실시간 연산 및 정보 지표 시각화</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            사용자가 입력하는 순간 지연 없이 실시간 연산을 완료하고, 핵심 지표를 보기 편하게 분석 제공합니다.
          </p>
        </div>
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 space-y-2">
          <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded">기능 02</span>
          <h2 className="text-base font-bold text-gray-800">브라우저 보안 샌드박스 작동</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            사용자의 모든 연산 프로세스는 클라이언트(로컬) 내부 메모리 상에서만 실행되므로, 입력 데이터가 서버로 유출될 우려가 전혀 없는 안전 지대를 보장합니다.
          </p>
        </div>
      </div>

      {/* 3. AEO 크롤러 유도를 위한 지식 정보형 테이블 (AEO 필수) */}
      <div className="border-t border-gray-100 pt-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-1.5">
          <i className="fas fa-lightbulb text-amber-500"></i>
          자주 묻는 오표기 및 핵심 기준 5선
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-bold text-gray-600">자주 묻는 오표기 / 현상</th>
                <th className="px-4 py-2 text-left font-bold text-gray-600">올바른 해결책 및 기준</th>
                <th className="px-4 py-2 text-left font-bold text-gray-600">해당 원칙의 근거 및 팁</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              <tr>
                <td className="px-4 py-3 text-red-500 font-semibold">오용 예시 1</td>
                <td className="px-4 py-3 text-green-600 font-semibold">바른 예시 1</td>
                <td className="px-4 py-3 text-gray-600">이해를 돕는 간결하고 명확한 예시 및 구별 가이드 기술</td>
              </tr>
              {/* ...추가 지식 정보 행 구축... */}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}
  ```

### C. 자유토론(Community) 피드 이식 표준
모든 미니앱의 자유토론 공간은 `@faithportal/mini-app-sdk`에 패키징된 인스타그램 스타일의 커뮤니티 컴포넌트인 `MiniAppCommunity`를 활용하여 단 몇 줄의 코드로 완전하게 연동됩니다.

1. **임포트(Import) 명세**:
   `@faithportal/mini-app-sdk`를 통해 전역 패키징된 모듈을 가져와 사용합니다.
   ```tsx
   import { MiniAppLayout, MiniAppCommunity } from '@faithportal/mini-app-sdk';
   ```

2. **컴포넌트 바인딩 및 독립 `appId` 지정**:
   각 미니앱은 독립된 `appId`(예: `calculator`, `text-checker`, `sudoku`, `game-2048` 등)를 고유 슬러그로 가져갑니다. 이 appId를 주입하여 각 미니앱별 로컬 스토리지 피드 세션을 완벽히 격리합니다.
   ```tsx
   {activeTab === 'community' && (
     <div className="animate-fadeIn">
       <MiniAppCommunity appId="자식미니앱-고유슬러그" />
     </div>
   )}
   ```

3. **피드 데이터 & 금지어 차단 모듈 사양**:
   * **금지어 자동 차단 필터링**: 입력된 단어 중 '비방', '욕설', '광고', '스팸' 및 관리자가 수정한 커스텀 금지어가 포함된 경우, `alert`와 함께 작성을 원천 불허합니다.
   * **하이브리드 로컬 스토리지 싱크**: 백엔드 API와의 실시간 통신 실패 및 부재 시에도, 브라우저 로컬 저장소를 활용하여 실시간 등록/삭제/댓글/좋아요 동작이 100% 무중단으로 작동하는 오프라인-퍼스트 아키텍처를 구현해 두었습니다.
   * **고유 아바타 배경 생성기**: 작성자의 닉네임을 해싱(Hashing)하여 8가지 프리미엄 파스텔톤 컬러(`rose`, `amber`, `emerald`, `teal`, `sky`, `indigo`, `purple`, `fuchsia`)를 인라인으로 동적 주입함으로써, Tailwind 컴파일 빌드 누수와 무관하게 아름다운 비주얼 프로필을 보장합니다.

