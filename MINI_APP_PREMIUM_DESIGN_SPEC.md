# FaithLink 미니앱 프리미엄 디자인 시스템 가이드 (예·적금 계산기 스타일)

> **문서 버전**: 1.0 (2026 개정판)  
> **적용 대상**: FaithPortal 전체 미니앱 (`apps/app-*`)  
> **기준 모델**: 예·적금 계산기 (`app-interest-calc`), 퇴직금 계산기 (`app-severance-calc`)

---

## 1. 디자인 철학 및 컨셉 (Core Concept)

예·적금 계산기 디자인의 핵심은 **"클린 뉴모피즘(Clean Neumorphism) + 다크 익제큐티브 리포트(Dark Executive Report)"**의 듀얼 계층 구조입니다.

```
[1단계: 인트로/스플래시]  ➔  [2단계: 입력 화면 (Input)]  ➔  [3단계: 결과 리포트 (Result)]
- 공인 기준 뱃지             - 소프트 화이트 뉴모피즘        - 딥 슬레이트 & 인디고 다크
- 3D 플로팅 아이콘           - 파스텔 블루 안내 배너        - 형광 시안(Cyan) 거대 결과
- 프로그레스 바 + 스폰서     - 빠른 퀵 칩 + 세그먼트 토글   - 3단 비교 카드 + 원클릭 복사
```

- **입력 단계**: 밝고 친근하며 직관적인 화이트/라이트 뉴모피즘을 적용하여 사용자가 편안하게 수치를 입력하도록 유도.
- **결과 단계**: 딥 네이비/슬레이트 다크 그라데이션으로 전면 반전되어, 마치 "금융 기관 전문 분석 리포트"를 받은 듯한 높은 신뢰감과 시각적 카타르시스를 제공.

---

## 2. 화면별 표준 UI 규격 및 코드 템플릿

### [화면 1] 3초 프리미엄 스플래시 & 로딩 화면 (Splash Screen)

미니앱 진입 시 3초간 노출되는 공식 인트로 화면입니다.

#### 필수 구성 요소
1. **상단 공인 기준 배지**: `2026 정부/기관 공식 기준` 칩
2. **중앙 3D 입체 아이콘**: 2중 라운드 스퀘어 (`rounded-3xl`) + 떠오르는 애니메이션 (`animate-float`)
3. **타이틀 & 서브타이틀**: 가독성 높은 헤드라인 + 실시간 데이터 동기화 안내 문구
4. **부드러운 프로그레스 바**: `animate-pulse-glow` 효과가 적용된 게이지 바
5. **하단 스폰서/제휴 매칭 배너**: 프리미엄 상업적 신뢰성을 주는 카드
6. **법적 효력 준수 푸터**: 공식 규정 준수 면책 안내

#### JSX 템플릿
```tsx
<div className="min-h-screen w-full flex flex-col justify-between items-center bg-gradient-to-b from-slate-50 via-white to-slate-100 p-6 sm:p-8 select-none animate-fade-in">
  {/* 1. 상단 브랜딩 & 기준 배지 */}
  <div className="w-full max-w-sm flex items-center justify-between pt-2">
    <div className="flex items-center gap-2">
      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
      <span className="text-xs font-extrabold text-slate-500 tracking-wide uppercase">FAITH PORTAL</span>
    </div>
    <span className="text-[11px] font-black text-blue-700 bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full shadow-2xs">
      2026 금융위원회 기준
    </span>
  </div>

  {/* 2. 중앙 메인 비주얼 & 타이틀 */}
  <div className="w-full max-w-sm flex flex-col items-center justify-center my-auto py-6 text-center">
    <div className="relative mb-6">
      <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center text-3xl sm:text-4xl shadow-xl shadow-blue-500/20 animate-float border-2 border-white">
        <i className="fas fa-piggy-bank"></i>
      </div>
      <div className="absolute -bottom-1.5 -right-1.5 bg-white text-blue-600 rounded-full p-1.5 shadow-md border border-slate-100 text-xs">
        <i className="fas fa-check-circle text-emerald-500"></i>
      </div>
    </div>

    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
      예·적금 이자 & 비과세 계산기
    </h1>
    <p className="text-sm font-bold text-slate-700 mb-1">
      단리·복리 및 3대 과세유형별 절세 혜택 정밀 산정
    </p>
    <p className="text-xs text-slate-400 mb-8 max-w-xs leading-relaxed">
      2026년 최신 은행 금리 산식 및 개정 소득세법 데이터를 실시간으로 동기화하고 있습니다
    </p>

    {/* 프로그레스 바 */}
    <div className="w-full max-w-xs bg-slate-100 border border-slate-200 h-3 rounded-full overflow-hidden p-0.5 shadow-inner mb-3">
      <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 rounded-full animate-pulse-glow" style={{ width: '100%' }}></div>
    </div>
    <div className="flex items-center justify-center gap-2 text-xs font-black text-blue-600">
      <i className="fas fa-spinner fa-spin text-blue-500 text-xs"></i>
      <span>데이터 로딩 및 연동 중...</span>
    </div>
  </div>

  {/* 3. 하단 스폰서 & 안내 푸터 */}
  <div className="w-full max-w-sm flex flex-col items-center gap-3 pb-2">
    <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center justify-between">
      <div className="text-left">
        <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block mb-0.5">SPONSORED</span>
        <span className="text-xs font-bold text-slate-800">최신 고금리 특판 예적금 & 비과세 ISA 비교</span>
      </div>
      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
        <i className="fas fa-chart-line text-xs"></i>
      </div>
    </div>
    <p className="text-[11px] text-slate-400 text-center leading-relaxed">
      본 도구는 2026년 금융위원회 및 국세청 공식 세법 기준을 준수합니다.
    </p>
  </div>
</div>
```

---

### [화면 2] 상단 스티키 헤더 & 알약(Pill) 탭 바

모달 팝업 내부에서 상단에 고정(`sticky top-0 z-30`)되며 백드롭 블러를 적용합니다.

```tsx
<header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shadow-xs">
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
        <i className="fas fa-coins text-xs"></i>
      </div>
      <div>
        <h1 className="text-sm font-black text-slate-900 leading-tight">예·적금 이자 계산기</h1>
        <span className="text-[10px] text-slate-500">2026 은행연합회 기준</span>
      </div>
    </div>
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
      FREE
    </span>
  </div>

  {/* 3단 또는 4단 알약 탭 */}
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
      <span>FAQ</span>
    </button>
  </nav>
</header>
```

---

### [화면 3] 메인 입력 카드 (`viewMode === 'input'`)

- **안내 배너**: 상단에 은은한 파스텔 그라데이션 박스로 원리 요약 안내.
- **세그먼트 토글 버튼**: 2개 이상의 모드를 선택할 때 탭 버튼 형태 제공.
- **빠른 입력 퀵 칩(Quick Chips)**: 모바일에서 키보드를 열지 않고도 원클릭으로 숫자를 채울 수 있는 버튼 배열.
- **고대비 대형 CTA 버튼**: 사용자가 한눈에 누르고 싶게 만드는 그라데이션 버튼.

```tsx
<div className="space-y-5 animate-fade-in">
  {/* 1. 상단 안내 배너 */}
  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
      <i className="fas fa-piggy-bank text-xs"></i>
    </div>
    <div className="text-xs text-slate-700 leading-relaxed">
      <p className="font-extrabold text-blue-900 mb-0.5">2026 최신 금융 산식 실시간 적용</p>
      <p className="text-slate-600">
        정기예금과 정기적금의 실수령액 차이를 계산하고 절세 혜택을 원클릭으로 비교합니다.
      </p>
    </div>
  </div>

  {/* 2. 조건 설정 카드 */}
  <div className="bg-white rounded-2xl p-4.5 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
    {/* 세그먼트 토글 버튼 */}
    <div>
      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">유형 선택</label>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setType('deposit')}
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
      <label className="block text-[11px] font-bold text-slate-700 mb-1">금액 입력</label>
      <div className="relative">
        <input
          type="number"
          value={amount || ''}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="예: 10000000"
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:bg-white focus:border-blue-600 outline-none pr-10"
        />
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">원</span>
      </div>

      {/* 금액 퀵 칩 */}
      <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 hide-scrollbar">
        {[1000000, 5000000, 10000000, 30000000].map((val) => (
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

### [화면 4] 다크 익제큐티브 결과 리포트 카드 (`viewMode === 'result'`)

계산이 완료되면 화면 상단으로 스크롤되며 전면 다크 슬레이트-인디고 그라데이션 리포트 카드로 전환됩니다.

```tsx
<div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-blue-800/40 space-y-5 animate-fade-in">
  {/* 상단 헤더: 뒤로가기 + 타이틀 + 원클릭 복사 */}
  <div className="flex items-center justify-between border-b border-white/10 pb-3">
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => {
          setViewMode('input');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
        title="입력 화면으로 돌아가기"
      >
        <i className="fas fa-arrow-left text-xs"></i>
      </button>
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-300">CALCULATION REPORT</span>
        <h4 className="text-base sm:text-lg font-black text-white">최종 산출 결과 리포트</h4>
      </div>
    </div>
    <button
      type="button"
      onClick={handleCopyResult}
      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer"
    >
      <i className="fas fa-copy text-xs"></i>
      <span>결과 복사</span>
    </button>
  </div>

  {/* 메인 결과값: 거대 히어로 메트릭 (Hero Metric) */}
  <div className="bg-white/5 rounded-2xl p-4 sm:p-5 border border-white/10 text-center space-y-1">
    <span className="text-xs text-cyan-200 font-bold">최종 산출 실수령액</span>
    <div className="text-3xl sm:text-4xl font-black text-cyan-300 tracking-tight">
      {finalAmount.toLocaleString()}
      <span className="text-lg font-bold text-white ml-1">원</span>
    </div>
    <p className="text-[11px] text-slate-300">
      총 원금 {principal.toLocaleString()}원 + 순이익 {netProfit.toLocaleString()}원
    </p>
  </div>

  {/* 세부 항목 2분할 카드 */}
  <div className="grid grid-cols-2 gap-2 text-center">
    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
      <span className="text-[10px] text-slate-400 block mb-0.5">세전 총 이익</span>
      <span className="text-sm font-bold text-white">{grossProfit.toLocaleString()}원</span>
    </div>
    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
      <span className="text-[10px] text-slate-400 block mb-0.5">공제 및 세금</span>
      <span className="text-sm font-bold text-rose-300">-{taxAmount.toLocaleString()}원</span>
    </div>
  </div>

  {/* 3대 비교 카드 (예: 일반과세 vs 세금우대 vs 비과세) */}
  <div className="space-y-2 pt-2 border-t border-white/10">
    <span className="text-[11px] font-extrabold text-slate-300 block">유형별 절세 혜택 비교</span>
    <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
      <div className="bg-white/5 p-2 rounded-lg border border-white/10">
        <span className="text-slate-400 block">일반 (15.4%)</span>
        <span className="font-bold text-white mt-1 block">1,020,000원</span>
      </div>
      <div className="bg-white/5 p-2 rounded-lg border border-white/10">
        <span className="text-amber-300 block">우대 (9.5%)</span>
        <span className="font-bold text-amber-200 mt-1 block">1,080,000원</span>
      </div>
      <div className="bg-cyan-500/20 p-2 rounded-lg border border-cyan-400/40">
        <span className="text-cyan-300 font-bold block">비과세 (0%) ✨</span>
        <span className="font-black text-cyan-200 mt-1 block">1,150,000원</span>
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
      className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
    >
      다시 계산하기
    </button>
    <button
      type="button"
      onClick={handleShare}
      className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer"
    >
      결과 공유하기 📤
    </button>
  </div>
</div>
```

---

## 3. 디자인 토큰 레퍼런스

### 1) 컬러 팔레트 (Color Palette)
- **Primary Gradient**: `linear-gradient(to right, #2563eb, #06b6d4)` (Blue-600 ➔ Cyan-500)
- **Splash Background**: `bg-gradient-to-b from-slate-50 via-white to-slate-100`
- **Result Dark Container**: `bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900`
- **Hero Accent Text**: `#67e8f9` (Cyan-300) / `#34d399` (Emerald-400)
- **Card Background**: `#ffffff` (White) / Border: `#e2e8f0` (Slate-200)

### 2) 라운딩 (Border Radius)
- **전체 컨테이너 / 결과 카드**: `rounded-3xl` (24px)
- **입력 폼 / 섹션 패널**: `rounded-2xl` (16px)
- **버튼 / 탭 알약**: `rounded-xl` (12px)
- **배지 / 칩**: `rounded-full` 또는 `rounded-lg` (8px)

### 3) 키프레임 애니메이션 (Tailwind / CSS)
- **`animate-fade-in`**: 화면/탭 전환 시 0.25s 동안 `opacity: 0 ➔ 1`, `translateY(4px ➔ 0)`
- **`animate-float`**: 3D 아이콘이 3초 주기로 상하 6px 부드럽게 부유
- **`animate-pulse-glow`**: 프로그레스 바가 반짝이며 충전되는 효과

---

## 4. 다른 미니앱 적용 체크리스트 (Migration Checklist)

| 단계 | 적용 항목 | 설명 |
|:---:|---|---|
| [ ] | **3초 로딩 인트로** | `isLoading` 상태가 `true`일 때 공식 인트로 스플래시 화면 렌더링 (기준 배지 + 3D 아이콘 + 프로그레스 바) |
| [ ] | **스티키 헤더 & 알약 탭** | `[메인 기능, 사용방법, FAQ]` 3단 탭 구성 및 `FREE` 배지 부착 |
| [ ] | **2단계 뷰 모드 분리** | `viewMode: 'input' \| 'result'` 상태를 도입하여 입력과 결과를 완전히 분리 |
| [ ] | **입력 퀵 칩(Quick Chips)** | 주요 프리셋 값을 원클릭으로 주입할 수 있는 가로 스크롤 칩 바 추가 |
| [ ] | **다크 익제큐티브 결과 카드** | 계산/판정 완료 시 다크 슬레이트 배경과 형광 시안 거대 히어로 텍스트로 결과 리포트 노출 |
| [ ] | **원클릭 클립보드 복사** | 결과 카드 우상단에 `[결과 복사]` 버튼을 두어 SNS/카카오톡 공유 유도 |
| [ ] | **마케팅 캡처 속성 표기** | 결과 버튼에 `data-screenshot-click="result"`, 결과 카드에 `data-screenshot-point="result"` 속성 선언 |

---

## 5. 본 디자인 시스템 구축에 사용된 스킬 (Used Skills)

본 미니앱 디자인 시스템 및 가이드라인은 다음 3가지 전문 엔지니어링 스킬을 융합하여 설계되었습니다:

### 1) FaithPortal Design System (`design-system` 스킬)
- **위치**: `d:\project\faithportal\.agents\skills\design-system\SKILL.md`
- **적용 내용**:
  - FaithPortal의 공식 디자인 토큰(Pretendard 타이포그래피, 마이크로 애니메이션, `rounded-2xl/3xl` 라운딩, 뉴모피즘 그림자 공식)을 준수.
  - 일관된 컴포넌트 클래스(`nm-card`, `nm-input`, `nm-btn`, `nm-pill`)와의 상호 호환성 확보.

### 2) Frontend Design (`frontend-design` 스킬)
- **위치**: `d:\project\faithportal\.agents\skills\frontend-design\SKILL.md`
- **적용 내용**:
  - 흔한 부트스트랩이나 일반 테일윈드 템플릿의 단조로움을 극복하고, 토스(Toss)나 뱅크샐러드 수준의 **차별화된 비주얼 아이덴티티(Visual Hierarchy)**를 구현.
  - 입력 단계는 신뢰감 있는 "소프트 뉴모피즘", 결과 단계는 권위 있는 "다크 익제큐티브 리포트"로 극적인 시각 반전을 연출하여 사용자 몰입감과 만족도를 극대화.

### 3) Brainstorming & Planning (`brainstorming`, `writing-plans` 스킬)
- **위치**: `d:\project\faithportal\.agents\skills\brainstorming\SKILL.md`
- **적용 내용**:
  - 단순 계산기뿐만 아니라 게임, 변환기, 세무 도구 등 모든 유형의 미니앱에 범용적으로 이식될 수 있도록 모듈화된 템플릿과 체크리스트 구조를 체계적으로 기획.
