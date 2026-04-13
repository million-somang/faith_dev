---
name: FaithPortal Design System
description: 미니앱 전용 디자인 시스템 — 뉴모피즘 + 밝은 배경 기반의 프리미엄 디자인 토큰 및 가이드라인
---

# FaithPortal 미니앱 디자인 시스템

이 스킬은 FaithPortal 프로젝트의 미니앱(app-calculator, app-* 등)에 적용하는 **통일된 디자인 시스템**을 정의합니다.

## 디자인 컨셉: Clean Neumorphism

**핵심 키워드**: 밝은 배경 + 뉴모피즘 + Pretendard 타이포 + 인디고 어센트 + 마이크로 애니메이션

### 컬러 팔레트

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--nm-bg` | `#e8edf2` | 메인 뉴모피즘 배경 |
| `--nm-bg-light` | `#f0f4f8` | 카드/패널 배경 |
| `--nm-bg-white` | `#ffffff` | input, 오목 영역 |
| `--nm-shadow-light` | `rgba(255,255,255,0.8)` | 뉴모피즘 밝은 그림자 |
| `--nm-shadow-dark` | `rgba(163,177,198,0.6)` | 뉴모피즘 어두운 그림자 |
| `--nm-shadow-inset-light` | `rgba(255,255,255,0.5)` | 오목 밝은 그림자 |
| `--nm-shadow-inset-dark` | `rgba(163,177,198,0.35)` | 오목 어두운 그림자 |
| `--accent` | `#6366f1` | 인디고 주 어센트 |
| `--accent-light` | `#818cf8` | 밝은 인디고 |
| `--accent-gradient` | `linear-gradient(135deg, #6366f1, #8b5cf6)` | 인디고→바이올렛 그라디언트 |
| `--text-primary` | `#1e293b` | 본문 텍스트 |
| `--text-secondary` | `#64748b` | 보조 텍스트 |
| `--text-muted` | `#94a3b8` | 약한 텍스트 |
| `--success` | `#10b981` | 성공/양수 |
| `--danger` | `#ef4444` | 위험/음수 |
| `--warning` | `#f59e0b` | 경고 |

### 뉴모피즘 그림자 공식

```css
/* 볼록 (Raised) — 버튼, 카드 기본 */
box-shadow:
  6px 6px 12px var(--nm-shadow-dark),
  -6px -6px 12px var(--nm-shadow-light);

/* 오목 (Inset) — 디스플레이, input */
box-shadow:
  inset 4px 4px 8px var(--nm-shadow-inset-dark),
  inset -4px -4px 8px var(--nm-shadow-inset-light);

/* 버튼 눌림 (Pressed) */
box-shadow:
  inset 2px 2px 5px var(--nm-shadow-dark),
  inset -2px -2px 5px var(--nm-shadow-light);
```

### 타이포그래피

- **주 폰트**: `'Pretendard Variable'`, `'Pretendard'`, `-apple-system`, `BlinkMacSystemFont`, `system-ui`, `sans-serif`
- **CDN**: `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css`
- **본문**: 400 weight, 0.9rem
- **제목**: 700~800 weight
- **계산기 디스플레이**: `'JetBrains Mono'`, `monospace`, 600 weight

### 간격 체계

- `--space-xs`: `0.25rem`
- `--space-sm`: `0.5rem`
- `--space-md`: `1rem`
- `--space-lg`: `1.5rem`
- `--space-xl`: `2rem`

### 라운딩

- `--radius-sm`: `8px`
- `--radius-md`: `12px`
- `--radius-lg`: `16px`
- `--radius-xl`: `20px`
- `--radius-full`: `9999px`

### 애니메이션

| 이름 | 용도 | 설명 |
|------|------|------|
| `fadeIn` | 페이지/탭 전환 | 0.3s ease-out, opacity + translateY |
| `slideUp` | 결과 표시 | 0.25s ease-out, 아래→위 |
| `button-press` | 계산기 버튼 | active 시 scale(0.95) + 오목 그림자 전환 |
| `shimmer` | 로딩 | 반복적 gradient 이동 효과 |
| `glow-pulse` | 결과 강조 | box-shadow 글로우 맥동 |

### 컴포넌트 패턴

#### 뉴모피즘 카드
```html
<div class="nm-card">콘텐츠</div>
```

#### 뉴모피즘 input
```html
<input class="nm-input" />
```

#### 뉴모피즘 버튼
```html
<button class="nm-btn">기본</button>
<button class="nm-btn nm-btn-accent">어센트</button>
<button class="nm-btn nm-btn-success">성공</button>
<button class="nm-btn nm-btn-danger">위험</button>
```

#### 결과 카드
```html
<div class="nm-result-card">결과 콘텐츠</div>
```

## 적용 대상

이 디자인 시스템은 다음 미니앱들에 적용됩니다:
- `app-calculator` — 스마트 다기능 계산기 (최초 적용)
- 향후 다른 미니앱으로 확장 가능

## 주의사항

1. **기능 로직 변경 금지** — className과 스타일만 변경, JS/TS 로직은 절대 수정하지 않음
2. **접근성 유지** — aria 속성, role, label 등 모든 접근성 코드 유지
3. **반응형** — 모바일 퍼스트, 375px~1440px 범위 지원
4. **성능** — backdrop-filter 남용 금지, will-change 최소화
