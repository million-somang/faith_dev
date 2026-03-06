# FaithLink 미니앱(Sub-App) 개발 가이드

이 문서는 FaithLink 통합 플랫폼 내부에 들어갈 새로운 미니앱(게임, 금융, 계산기 등)을 개발할 때 반드시 지켜야 할 아키텍처 및 UX 표준 가이드라인입니다.

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
