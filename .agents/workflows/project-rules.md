---
description: 프로젝트 규칙 및 코딩 표준 참조
---

# 프로젝트 규칙 참조 (rule.md)

모든 코드 작성 및 수정 시 반드시 `rule.md` 파일의 규칙을 따라야 합니다.

// turbo-all

## 규칙 확인 단계

1. 작업 시작 전 `c:\project\faithportal\rule.md` 파일을 읽어서 규칙을 확인합니다.

2. 다음 핵심 규칙을 항상 준수합니다:
   - main-portal은 포트 5000, API 서버는 포트 4200에서 실행 (start-server 워크플로우 참조)
   - 모든 플랜과 설명은 한글로 작성
   - DB를 초기화하거나 삭제하는 일이 절대 없도록 함
   - 지시한 것 이외의 코드는 절대 수정하거나 삭제하지 않음
   - 코드 완성 후 테스트 확인 필수
   - Monorepo 구조 유지 (apps 폴더 아래 Sub-App 구조)
   - 미니앱 코드 작성 시 `MINI_APP_GUIDE.md` 및 `MINI_APP_MODAL_SEO_GUIDE.md` 참고
   - 구글 SEO 및 구글 애드센스(AdSense) 수익 최적화를 항상 최우선으로 고려
   - 서버 실행 시 포트 충돌 방지 (strictPort: true, 기존 프로세스 확인)

3. 절대 금지 사항:
   - 코드 되돌리기는 반드시 사용자에게 확인 후 진행
   - DB 내용 삭제 금지
   - any, unknown 타입 사용 금지
   - 기존 기능 임의 삭제 금지
   - 광고 클릭을 유도하거나 버튼과 지나치게 밀착된 광고 배치 금지 (애드센스 정책 위반)

4. 서버 실행 시 반드시 `/start-server` 워크플로우를 따를 것
   (포트 매핑, 프로세스 정리, 실행 확인 절차 포함)

## 구글 SEO & AEO(AI Engine Optimization) 필수 규칙

새 페이지나 컴포넌트를 만들 때 반드시 아래 SEO/AEO 규칙을 적용합니다.

### 1. 페이지 생성 시 필수 사항
1. **`PageSEO` 컴포넌트 사용**: 모든 페이지 컴포넌트의 return 최상단에 `PageSEO`를 배치
   ```tsx
   import { PageSEO } from '../components/PageSEO';
   // ...
   return (
       <div>
           <PageSEO
               title="페이지 제목 - 핵심 키워드 포함"
               description="사용자 가치와 핵심 기능을 명확히 담은 설명 (160자 이내)"
               path="/url-path"
               keywords={['키워드1', '키워드2', '키워드3']}
           />
           {/* 나머지 컨텐츠 */}
       </div>
   );
   ```

2. **시맨틱 HTML 태그 엄격 적용**:
   - 각 페이지에 `<h1>`은 단 하나만 사용 (메인 타이틀)
   - `<main>`, `<article>`, `<section>`, `<nav>`, `<aside>`, `<footer>` 영역 명확히 분리
   - 모든 이미지(`<img>`)에 의미 있는 `alt` 속성 및 `width`/`height` 명시 (CLS 방지)
   - 링크(`<a>`, `<button>`)에 적절한 `aria-label` 및 텍스트 명시

3. **JSON-LD 구조화 데이터 (Schema.org)**:
   - 웹 애플리케이션/도구: `WebApplication` 스키마 적용
   - 뉴스/콘텐츠: `NewsArticle` / `Article` 스키마 적용
   - 사용 방법: `HowTo` 스키마 적용
   - 질의응답: `FAQPage` 스키마 적용 (구글 리치 검색결과 및 AI 검색 인용 극대화)

4. **씬 콘텐츠(Thin Content) 방지**:
   - 단순 기능 도구나 미니앱이라도 사용법(`HowTo`), 핵심 특징, 자주 묻는 질문(FAQ) 등 최소 500자~1,000자 이상의 풍부한 텍스트 콘텐츠를 함께 제공 (3탭 시스템: 핵심기능, 사용방법, 자유토론 적극 활용).

### 2. 새 라우트 추가 시
- `/api/`, `/admin/`, `/app/` 경로가 아닌 **공개 페이지**는 `sitemap.xml`에 자동 포함되도록 `server.ts`의 `staticPages` 배열에 추가
- `robots.txt`에서 차단할 경로가 있으면 `Disallow` 규칙 추가

### 3. Core Web Vitals (웹 핵심 지표) 최적화
- **LCP (최대 콘텐츠풀 페인트)**: 2.5초 이하 유지 (초기 렌더링 블로킹 최소화)
- **CLS (누적 레이아웃 이동)**: 0.1 이하 유지 (이미지, 동영상, 광고 영역에 min-height 고정)
- **INP (상호작용 응답성)**: 200ms 이하 유지 (메인 스레드 긴 작업 분할)

---

## 구글 애드센스(AdSense) 최우선 코딩 규칙

수익 극대화와 구글 애드센스 정책 준수를 위해 모든 페이지와 컴포넌트 구현 시 아래 원칙을 필수 적용합니다.

### 1. Zero CLS 광고 영역 확보 (레이아웃 흔들림 원천 방지)
광고 스크립트가 늦게 로드되거나 빈 광고가 나와도 화면이 밀리거나 덜컹거리지 않도록, **모든 광고 컨테이너에 고정 높이 또는 최소 높이를 사전 지정**합니다.
```tsx
{/* 상단 배너 광고 슬롯 (Desktop 728x90, Mobile 320x50/320x100 대응) */}
<aside className="w-full min-h-[90px] my-6 flex flex-col items-center justify-center bg-gray-50/50 rounded-xl border border-gray-100 p-2" aria-label="스폰서 광고">
  <span className="text-[10px] font-medium text-gray-400 mb-1">ADVERTISEMENT</span>
  {/* 애드센스 광고 유닛 코드 */}
</aside>

{/* 본문 중간 / 사이드바 광고 슬롯 (300x250, 336x280 대응) */}
<div className="w-full min-h-[280px] my-8 flex flex-col items-center justify-center bg-gray-50/50 rounded-xl border border-gray-100 p-4" aria-label="스폰서 광고">
  <span className="text-[10px] font-medium text-gray-400 mb-1">ADVERTISEMENT</span>
  {/* 애드센스 광고 유닛 코드 */}
</div>
```

### 2. 구글 애드센스 정책 준수 & 오클릭/부정 클릭 방지
- **명확한 라벨 표기**: 광고 컨테이너 상단에 `광고` 또는 `ADVERTISEMENT` 텍스트를 명확히 표시하여 콘텐츠와 구분.
- **안전 마진 확보**: 버튼, 내비게이션, 입력 폼 등 클릭 가능한 인터랙티브 요소 바로 옆에 광고를 밀착시키지 말 것 (최소 `16px ~ 24px` 이상의 마진/패딩 필수).
- **콘텐츠 없는 페이지 광고 금지**: 로딩 중 화면, 404 에러 페이지, 로그인 전용 빈 화면에는 광고 코드를 노출하지 않음.

### 3. 전략적 광고 배치 및 체류 시간(Dwell Time) 증대
- **상단(Header 아래)**: 첫 화면 스크롤 직후 시선이 머무는 위치에 수평 반응형 배너 배치.
- **본문 중간(In-Article)**: 텍스트 문단 또는 기능 섹션 사이에 자연스러운 인피드 광고 배치.
- **결과 화면 하단**: 미니앱/도구의 결과값(연산 결과, 게임 오버 등) 바로 아래에 시선 집중형 광고 배치.
- **체류 시간 극대화**: 관련 도구 추천 카드, 사용 팁, 커뮤니티(토론) 탭을 하단에 배치하여 방문자가 페이지를 이탈하지 않고 오래 머무르도록 설계 (페이지 RPM 및 CPC 상승 효과).

---

## SEO 및 애드센스 관련 파일 위치
- 공통 SEO 컴포넌트: `apps/main-portal/src/components/PageSEO.tsx`
- 기본 메타 태그 & 애드센스 스크립트: `apps/main-portal/index.html`
- robots.txt + sitemap.xml + 뉴스 메타 주입: `apps/api-server/src/server.ts`
- 사이트 URL 설정: `server.ts`의 `SITE_URL` 상수
- 미니앱 SEO 및 모달 표준 가이드: `MINI_APP_MODAL_SEO_GUIDE.md`

