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
   - 미니앱 코드 작성 시 `MINI_APP_GUIDE.md` 참고
   - 서버 실행 시 포트 충돌 방지 (strictPort: true, 기존 프로세스 확인)

3. 절대 금지 사항:
   - 코드 되돌리기는 반드시 사용자에게 확인 후 진행
   - DB 내용 삭제 금지
   - any, unknown 타입 사용 금지
   - 기존 기능 임의 삭제 금지

4. 서버 실행 시 반드시 `/start-server` 워크플로우를 따를 것
   (포트 매핑, 프로세스 정리, 실행 확인 절차 포함)

## SEO 필수 규칙

새 페이지나 컴포넌트를 만들 때 반드시 아래 SEO 규칙을 적용합니다.

### 페이지 생성 시 필수 사항
1. **`PageSEO` 컴포넌트 사용**: 모든 페이지 컴포넌트의 return 최상단에 `PageSEO`를 배치
   ```tsx
   import { PageSEO } from '../components/PageSEO';
   // ...
   return (
       <div>
           <PageSEO
               title="페이지 제목"
               description="페이지 설명 (160자 이내)"
               path="/url-path"
           />
           {/* 나머지 컨텐츠 */}
       </div>
   );
   ```

2. **시맨틱 HTML 태그 사용**:
   - 각 페이지에 `<h1>` 하나만 사용
   - `<main>`, `<article>`, `<section>`, `<nav>`, `<aside>` 적절히 사용
   - 이미지에 반드시 의미 있는 `alt` 속성 추가
   - 링크에 적절한 `aria-label` 추가

3. **JSON-LD 구조화 데이터**: 뉴스, 게임, 도구 등 콘텐츠 페이지에는 `jsonLd` prop 활용

### 새 라우트 추가 시
- `/api/`, `/admin/`, `/app/` 경로가 아닌 **공개 페이지**는 `sitemap.xml`에 자동 포함되도록 `server.ts`의 `staticPages` 배열에 추가
- `robots.txt`에서 차단할 경로가 있으면 `Disallow` 규칙 추가

### SEO 관련 파일 위치
- 공통 SEO 컴포넌트: `apps/main-portal/src/components/PageSEO.tsx`
- 기본 메타 태그: `apps/main-portal/index.html`
- robots.txt + sitemap.xml + 뉴스 메타 주입: `apps/api-server/src/server.ts`
- 사이트 URL 설정: `server.ts`의 `SITE_URL` 상수
