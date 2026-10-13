# Next.js 메인 페이지 Vite 원본 디자인 & 쿠팡 배너/실시간 뉴스 복원 구현 계획서

> **실행 규칙:** Vite 서버로 롤백하지 않고 Next.js App Router(`apps/next-portal`) 기반을 엄격히 유지합니다. Vite 원본(`HomePage.tsx`)의 12열 레이아웃, 쿠팡 파트너스 배너, 썸네일·언론사 컬럼이 포함된 실시간 뉴스 카드를 100% 동일하게 복원합니다.

**목표:** Next.js 메인 페이지(`apps/next-portal/src/app/page.tsx`)를 Vite 원본과 동일한 디자인으로 복원하고, 비어 있던 애드센스 슬롯 대신 쿠팡 파트너스 다이내믹 배너와 썸네일 기반 실시간 뉴스 섹션을 완벽하게 복구합니다.

**아키텍처:**
- Vite의 `BannerSlot` 컴포넌트를 Next.js용 클라이언트 컴포넌트로 포팅하여 `/api/banners/home_main_top` 연동 및 쿠팡 공식 파트너스 배너 fallback 지원.
- `LiveNewsSection`을 Vite의 `NewsCard` 스펙(뉴스 썸네일 이미지, 카테고리 뱃지, 발행 경과 시간, 팩트체크 분석 표시, 우측 독립 언론사 컬럼)과 완전히 일치하도록 재구성.
- `apps/next-portal/src/app/page.tsx` 메인 그리드를 Vite 원본 순서(라운지 배너 → 히어로 검색 → 8:4 분할 그리드 [가이드 8선 + 쿠팡 배너 + 실시간 뉴스 6개 / 날씨 + 증시 + 추천가이드&도구 + 사이드바 배너] → 하단 3대 핵심 서비스)로 재배치.

---

## 전역 제약 조건

- **플랫폼 유지**: Next.js App Router(`apps/next-portal`)를 그대로 사용하며, 원격 서버 PM2 `faith-portal`(포트 3000)으로 서비스합니다. 절대 Vite 서버로 되돌리지 않습니다.
- **쿠팡 배너 정상 작동**: 빈 상자로 뜨는 미승인 구글 애드센스(`<AdSlot>`)를 메인에서 제거하고, 쿠팡 파트너스 공식 배너(728×90, 링크 `https://link.coupang.com/a/g0xNo8o8fk`, `referrerPolicy="unsafe-url"`)를 노출합니다.
- **반복 출력 금지**: `.agents/AGENTS.md` 지침에 따라 반복적인 상태 출력이나 가상 진행창 출력을 엄격히 금지합니다.

---

## 파일 구성

1. **`apps/next-portal/src/components/BannerSlot.tsx` (신규 생성)**
   - 배너 슬롯 컴포넌트: `/api/banners/[slotKey]` 호출, 다이내믹 배너 로테이션, 기본 쿠팡 파트너스 fallback 제공.
2. **`apps/next-portal/src/components/homepage/LiveNewsSection.tsx` (수정)**
   - 실시간 뉴스 섹션: 썸네일 이미지, 카테고리 뱃지, 경과 시간, 우측 언론사 분리 컬럼이 포함된 고품질 카드 렌더링.
3. **`apps/next-portal/src/app/page.tsx` (수정)**
   - 메인 페이지: 미승인 애드센스 빈 공간 제거, 12열 2컬럼 레이아웃 정렬, 쿠팡 배너 슬롯 2개(메인 중앙, 사이드바 하단) 배치.

---

### Task 1: Next.js 전용 `BannerSlot` (쿠팡 배너) 컴포넌트 생성

**대상 파일:**
- 신규 생성: `apps/next-portal/src/components/BannerSlot.tsx`

**세부 내용:**
- `/api/banners/home_main_top` 및 `/api/banners/home_sidebar` API를 호출하여 데이터베이스에 등록된 쿠팡 배너 정보를 가져옵니다.
- API 지연이나 네트워크 오류 시에도 쿠팡 공식 배너(이미지 `https://ads-partners.coupang.com/banners/959332?...`, 링크 `https://link.coupang.com/a/g0xNo8o8fk`)가 즉시 렌더링되도록 기본 fallback을 내장합니다.
- 새 탭 열기(`target="_blank"`), 보안 정책 준수(`rel="noopener noreferrer"`, `referrerPolicy="unsafe-url"`), 라운드 모서리 및 호버 그림자 스타일을 적용합니다.

```tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';

export interface Banner {
  id: number;
  title: string;
  image_url: string;
  link_url?: string | null;
  open_new_tab?: number;
  ad_code?: string | null;
}

// 쿠팡 파트너스 공식 기본 배너 (API 지연 시 즉시 표시용 fallback)
const DEFAULT_COUPANG_BANNER: Banner = {
  id: 1,
  title: '쿠팡 파트너스 배너',
  image_url: 'https://ads-partners.coupang.com/banners/959332?subId=&traceId=V0-301-879dd1202e5c73b2-I959332&w=728&h=90',
  link_url: 'https://link.coupang.com/a/g0xNo8o8fk',
  open_new_tab: 1,
  ad_code: null,
};

export function BannerSlot({
  slotKey,
  fallbackSlotKey,
  className = '',
  rotateMs = 8000,
  label,
  wrapperClassName = '',
}: {
  slotKey: string;
  fallbackSlotKey?: string;
  className?: string;
  rotateMs?: number;
  label?: string;
  wrapperClassName?: string;
}) {
  const [banners, setBanners] = useState<Banner[]>(
    slotKey === 'home_main_top' ? [DEFAULT_COUPANG_BANNER] : []
  );
  const [idx, setIdx] = useState(0);
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    fetch(`/api/banners/${slotKey}`)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data?.success && data.banners && data.banners.length > 0) {
          setBanners(data.banners);
        } else if (fallbackSlotKey) {
          fetch(`/api/banners/${fallbackSlotKey}`)
            .then((r) => r.json())
            .then((fb) => {
              if (active && fb?.success && fb.banners) {
                setBanners(fb.banners);
              }
            })
            .catch(() => {});
        }
      })
      .catch((err) => {
        console.warn(`[BannerSlot] 배너 로드 실패 (${slotKey}):`, err);
        if (slotKey === 'home_main_top' && banners.length === 0) {
          setBanners([DEFAULT_COUPANG_BANNER]);
        }
      });

    return () => {
      active = false;
    };
  }, [slotKey, fallbackSlotKey]);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => setIdx((i) => (i + 1) % banners.length), rotateMs);
    return () => clearInterval(timer);
  }, [banners.length, rotateMs]);

  if (banners.length === 0) return null;

  const banner = banners[Math.min(idx, banners.length - 1)];

  const content = banner.ad_code ? (
    <div
      ref={adRef}
      className={`w-full flex justify-center overflow-hidden ${className}`}
      dangerouslySetInnerHTML={{ __html: banner.ad_code }}
    />
  ) : (
    <div className={`w-full flex justify-center ${className}`}>
      {banner.link_url ? (
        <a
          href={banner.link_url}
          target={banner.open_new_tab ? '_blank' : undefined}
          rel="noopener noreferrer"
          referrerPolicy="unsafe-url"
          className="block hover:shadow-md transition-shadow rounded-2xl overflow-hidden group max-w-full"
        >
          <img
            src={banner.image_url}
            alt={banner.title}
            className="max-w-full h-auto rounded-2xl shadow-xs group-hover:opacity-95 transition-opacity"
          />
        </a>
      ) : (
        <img
          src={banner.image_url}
          alt={banner.title}
          className="max-w-full h-auto rounded-2xl shadow-xs"
        />
      )}
    </div>
  );

  if (label) {
    return (
      <aside
        className={wrapperClassName || 'w-full flex flex-col items-center justify-center p-4 overflow-hidden'}
        aria-label={label}
      >
        <span className="text-[9px] font-bold text-gray-400 tracking-wider mb-2 uppercase">{label}</span>
        {content}
      </aside>
    );
  }

  return content;
}

export default BannerSlot;
```

---

### Task 2: 실시간 뉴스 섹션 `NewsCard` 비주얼 복원

**대상 파일:**
- 수정: `apps/next-portal/src/components/homepage/LiveNewsSection.tsx`

**세부 내용:**
- 현재의 단순 텍스트 줄바꿈 방식을 Vite 시절의 세련된 `NewsCard` 형태로 전면 교체합니다.
- **썸네일 지원**: 이미지 유무와 무관하게 24×24 / 28×20의 일정한 비율 유지 (이미지 없을 시 신문 아이콘 표시).
- **다중 카테고리 뱃지**: `경제`, `증시`, `IT` 등 카테고리별 컬러 뱃지 노출.
- **시간 경과 및 분석 표시**: `방금 전`, `1시간 전` 등의 경과 시간과 금융 관련 키워드 감지 시 `분석됨` 뱃지 노출.
- **우측 독립 언론사 컬럼**: 데스크탑 화면에서 카드 우측 끝에 회색 구분선과 함께 언론사명을 명확하게 표시.
- `/news/[id]` 상세 페이지로 이동 연동.

---

### Task 3: 메인 페이지 레이아웃 정렬 및 빈 애드센스 박스 제거

**대상 파일:**
- 수정: `apps/next-portal/src/app/page.tsx`

**세부 내용:**
- 애드센스 승인 전이라 빈 박스만 출력되던 `<AdSlot format="horizontal" />`을 메인 페이지에서 완전히 제거합니다.
- 좌측 8열 컬럼:
  1. 지식 가이드 & 전문 칼럼 쇼케이스 (`GuidesShowcase`)
  2. 쿠팡 파트너스 가로 배너 (`<BannerSlot slotKey="home_main_top" />`)
  3. 실시간 뉴스 & 팩트 브리핑 (`LiveNewsSection`)
- 우측 4열 사이드바:
  1. 날씨 & 증시 위젯 (`WeatherWidget`, `StockWidget`)
  2. 주간 추천 칼럼 TOP 4 & 스마트 계산기 위젯 (`SidebarGuidesWidget`)
  3. 사이드바 쿠팡 배너 (`<BannerSlot slotKey="home_sidebar" fallbackSlotKey="home_main_top" />`)
- 하단: 포털 3대 핵심 서비스 쇼케이스 (`CoreServicesShowcase`)

---

### Task 4: 빌드, 서버 배포 및 라이브 검증

1. **로컬 빌드**: `apps/next-portal` 디렉터리에서 `npm.cmd run build` 실행하여 TypeScript 및 컴포넌트 에러 0건 확인.
2. **배포 패키징**: `.next` 빌드 아티팩트를 `next-deploy.tar.gz`로 묶어 운영 서버(`/root/faith_dev/apps/next-portal/`)로 전송.
3. **PM2 재시작**: `pm2 restart 1` (`faith-portal`) 실행.
4. **라이브 검증**: `curl` 및 브라우저를 통해 `veranex.app` 접속 시 쿠팡 파트너스 배너 이미지와 실시간 뉴스 카드가 즉시 노출되는지 검증.
