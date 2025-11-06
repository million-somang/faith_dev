# Faith Portal - 반응형 디자인 가이드

## 개요

Faith Portal은 모든 디바이스에서 최적의 사용자 경험을 제공하기 위해 반응형 디자인을 적용했습니다.

## 기술 스택

- **Tailwind CSS**: 모바일 우선 유틸리티 기반 CSS 프레임워크
- **커스텀 CSS**: `public/static/style.css`에 추가 반응형 스타일

## 반응형 브레이크포인트

Tailwind CSS 기본 브레이크포인트를 사용합니다:

| 브레이크포인트 | 최소 너비 | CSS Prefix | 디바이스 |
|---------------|-----------|------------|----------|
| (기본)        | 0px       | (없음)      | 모바일   |
| `sm`          | 640px     | `sm:`      | 큰 모바일/작은 태블릿 |
| `md`          | 768px     | `md:`      | 태블릿   |
| `lg`          | 1024px    | `lg:`      | 작은 데스크톱 |
| `xl`          | 1280px    | `xl:`      | 데스크톱 |
| `2xl`         | 1536px    | `2xl:`     | 큰 데스크톱 |

## 반응형 패턴

### 1. 컨테이너

```html
<div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
    <!-- 콘텐츠 -->
</div>
```

### 2. 그리드 레이아웃

```html
<!-- 모바일 1열, 태블릿 2열, 데스크톱 3열 -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
    <!-- 아이템 -->
</div>
```

### 3. 텍스트 크기

```html
<h1 class="text-xl sm:text-2xl lg:text-3xl font-bold">
    반응형 제목
</h1>
```

### 4. 버튼

```html
<button class="px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 text-sm sm:text-base">
    반응형 버튼
</button>
```

### 5. 테이블 (오버플로우 스크롤)

```html
<div class="overflow-x-auto">
    <table class="min-w-full">
        <!-- 테이블 내용 -->
    </table>
</div>
```

### 6. 네비게이션

```html
<nav class="flex flex-col md:flex-row gap-2 md:gap-4">
    <!-- 모바일: 세로 배치, 데스크톱: 가로 배치 -->
</nav>
```

## 페이지별 반응형 특징

### 메인 페이지 (`/`)
- ✅ 반응형 헤더 (모바일에서 축약된 텍스트)
- ✅ 반응형 검색 바
- ✅ 반응형 바로가기 그리드 (2/3/4열)
- ✅ 반응형 뉴스 섹션

### 로그인 페이지 (`/login`)
- ✅ 중앙 정렬 폼
- ✅ 모바일 최적화 입력 필드
- ✅ 터치 친화적 버튼

### 회원가입 페이지 (`/signup`)
- ✅ 반응형 폼 레이아웃
- ✅ 모바일 키보드 최적화
- ✅ 반응형 유효성 검사 메시지

### 뉴스 페이지 (`/news`)
- ✅ 반응형 카테고리 탭 (스크롤 가능)
- ✅ 반응형 뉴스 카드 (1/2/3열)
- ✅ 터치 친화적 카드 호버

### 관리자 대시보드 (`/admin`)
- ✅ 반응형 통계 카드 (1/2/4열)
- ✅ 반응형 차트 (크기 자동 조정)
- ✅ 모바일 네비게이션

### 관리자 회원관리 (`/admin/users`)
- ✅ 반응형 테이블 (가로 스크롤)
- ✅ 반응형 필터 (세로/가로 배치)
- ✅ 모바일 최적화 모달

### 관리자 뉴스관리 (`/admin/news`)
- ✅ 반응형 통계 카드
- ✅ 반응형 테이블 (무한 스크롤)
- ✅ 터치 친화적 버튼

### 관리자 통계 (`/admin/stats`)
- ✅ 반응형 차트 컨테이너
- ✅ 반응형 그리드 (1/2열)

### 관리자 로그 (`/admin/logs`)
- ✅ 반응형 테이블
- ✅ 반응형 필터

### 관리자 알림 (`/admin/notifications`)
- ✅ 반응형 카드 리스트
- ✅ 반응형 필터 버튼

## 커스텀 CSS 클래스

`public/static/style.css`에 정의된 유틸리티 클래스:

```css
.responsive-container    /* 반응형 컨테이너 */
.responsive-grid         /* 반응형 그리드 */
.responsive-title        /* 반응형 제목 */
.responsive-subtitle     /* 반응형 부제목 */
.responsive-table        /* 반응형 테이블 */
.responsive-card         /* 반응형 카드 */
.responsive-btn          /* 반응형 버튼 */
.mobile-only            /* 모바일 전용 */
.desktop-only           /* 데스크톱 전용 */
```

## 모범 사례

### 1. 모바일 우선 접근

항상 모바일 스타일을 먼저 작성하고, 큰 화면에 대한 스타일을 추가합니다:

```html
<!-- Good -->
<div class="p-4 md:p-6 lg:p-8">

<!-- Bad -->
<div class="lg:p-8 md:p-6 p-4">
```

### 2. 터치 친화적 요소

모바일에서 최소 44x44px 터치 영역 보장:

```html
<button class="min-h-[44px] min-w-[44px] px-4 py-2">
    버튼
</button>
```

### 3. 텍스트 가독성

모바일에서도 읽기 쉬운 텍스트 크기 사용:

```html
<!-- 최소 14px (text-sm) -->
<p class="text-sm sm:text-base">
    본문 텍스트
</p>
```

### 4. 테이블 처리

작은 화면에서 테이블은 가로 스크롤 적용:

```html
<div class="overflow-x-auto">
    <table class="min-w-[640px]">
        <!-- 최소 너비 설정 -->
    </table>
</div>
```

### 5. 이미지 반응형

```html
<img src="..." class="w-full h-auto" alt="...">
```

## 테스트 가이드

### 테스트해야 할 화면 크기

1. **모바일**: 375px (iPhone SE)
2. **큰 모바일**: 414px (iPhone Pro Max)
3. **태블릿**: 768px (iPad)
4. **작은 데스크톱**: 1024px
5. **데스크톱**: 1440px

### Chrome DevTools 테스트

1. F12 → 디바이스 툴바 토글 (Ctrl+Shift+M)
2. 다양한 디바이스 프리셋 테스트
3. 반응형 모드로 수동 크기 조정

### 실제 디바이스 테스트

- iOS Safari
- Android Chrome
- 태블릿 브라우저

## 새 페이지 개발 시 체크리스트

- [ ] Tailwind CSS 반응형 유틸리티 사용
- [ ] 모바일 우선 스타일 작성
- [ ] 모든 브레이크포인트에서 테스트
- [ ] 터치 친화적 요소 크기 확인
- [ ] 테이블 가로 스크롤 처리
- [ ] 텍스트 가독성 확인
- [ ] 이미지 반응형 처리
- [ ] 네비게이션 모바일 최적화

## 참고 자료

- [Tailwind CSS 반응형 문서](https://tailwindcss.com/docs/responsive-design)
- [MDN 반응형 디자인](https://developer.mozilla.org/ko/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Google 모바일 친화적 테스트](https://search.google.com/test/mobile-friendly)

## 유지보수

모든 새로운 페이지와 컴포넌트는 이 가이드를 따라야 합니다. 반응형 이슈 발견 시 즉시 수정하고 이 문서를 업데이트하세요.
