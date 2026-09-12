# VeraNex 온라인게임 (Online Game) 개발 및 운영 표준 가이드

> **문서 버전**: 1.0  
> **적용 대상**: `onlinegame/*` 하위의 모든 웹 멀티플레이어 온라인 게임 프로젝트  
> **표준 규격**: `miniapp.md` (v2.4) 기준 100% 준수 (450px × 850px 팝업 뷰포트, 100% 라이트 뉴모피즘, 고품질 애니메이션)

본 문서는 VeraNex 통합 포털 내에서 회원 로그인 사용자에게 제공되는 **실시간 온라인 멀티플레이어 게임(`onlinegame/*`)**의 개발, 패키징, 라우팅 및 호스팅 표준을 정의합니다.

---

## 📌 핵심 원칙 요약

1. **미니앱 표준과 동일한 450px × 850px 팝업 뷰포트**:
   - 모든 온라인 게임은 포털에서 `useAppLauncher`를 통해 **가로 450px, 세로 850px** 크기의 독립된 팝업 창으로 구동됩니다.
   - 모바일 환경에서는 100% 반응형 전체 화면으로 자동 확장됩니다.
2. **100% 라이트 뉴모피즘 디자인 (Zero Dark Policy)**:
   - 다크 모드를 철저히 배제하고, `bg-slate-50`, `bg-white`, 선명한 `text-slate-900`과 부드러운 음영(`shadow-sm`, `shadow-md`)을 기본 테마로 채택합니다.
3. **그래픽 & 인터랙티브 모션 애니메이션 특화**:
   - `miniapp.md` Golden Rule 8에 따라, 3D 입체 텍스처, 스프링 바운스 모션(`cubic-bezier`), 착수/조작 파문 효과, 승리 축하 콘페티(Confetti) 폭죽 및 Web Audio API 절차적 사운드를 적극 결합합니다.
4. **회원 전용 세션 보호 (Member-Only Protection)**:
   - 온라인 게임은 실시간 네트워크 대전, 유저 매칭, 레이팅 시스템이 수반되므로 **로그인 회원에게만 노출 및 서빙**됩니다.
   - 비회원 및 검색 크롤러에게는 포털의 기본 미니게임만 100% 노출되어 구글 애드센스 심사 규정을 안전하게 충족합니다.
5. **독립된 포트 및 베이스 경로 규격**:
   - 로컬 개발 포트: `5040 ~ 5049` 고유 포트 할당
   - 빌드 베이스 경로: `/onlinegame/[game-name]/`
   - 빌드 아웃풋: `onlinegame/[game-name]/dist`

---

## 📁 디렉터리 구조 및 프로젝트 생성

새로운 온라인 게임은 `onlinegame/` 디렉터리 하위에 독립된 프로젝트로 생성합니다:

```
onlinegame/
├── README.md                 (본 가이드 문서)
└── [game-name]/              (개별 온라인게임: 예: omok-pvp)
    ├── package.json          (Vite + React + TS)
    ├── tsconfig.json
    ├── vite.config.ts        (base: '/onlinegame/[game-name]/', port: 5040)
    ├── index.html            (450×850 팝업 규격)
    └── src/
        ├── App.tsx           (대기실 로비, 방 생성/참가, 실시간 대국판)
        ├── main.tsx
        └── index.css
```

---

## 🌐 백엔드 및 포털 등록 절차

1. **API 서버 등록 (`apps/api-server/src/server.ts`)**:
   - `onlineGames` 배열에 신규 게임 슬러그(예: `'omok-pvp'`) 추가.
   - `/onlinegame/:gameName/*` 정적 서빙 및 `checkSession` 인증이 자동 적용됩니다.
2. **포털 프록시 등록 (`apps/main-portal/vite.config.ts`)**:
   - 로컬 개발 환경용 프록시 설정 추가:
   ```ts
   '^/onlinegame/omok-pvp.*': {
       target: 'http://localhost:5040',
       changeOrigin: true
   }
   ```
3. **포털 게임 페이지 등록 (`apps/main-portal/src/pages/GamePage.tsx`)**:
   - `activeGenre === 'online'` 영역에 게임 쇼케이스 카드 및 썸네일 SVG 등록.
