import React from 'react';
import type { Metadata } from 'next';
import { HomePortalTopBar } from '@/components/homepage/HomePortalTopBar';
import { LoungeBanner, LoungeTickerPost } from '@/components/homepage/LoungeBanner';
import { LiveNewsSection, HomeNewsItem } from '@/components/homepage/LiveNewsSection';
import { SidebarHotNewsWidget, HotNewsItem } from '@/components/homepage/SidebarHotNewsWidget';
import { LifestyleToolsShowcase } from '@/components/homepage/LifestyleToolsShowcase';
import { GameArcadeShowcase } from '@/components/homepage/GameArcadeShowcase';
import { GuidesShowcase } from '@/components/homepage/GuidesShowcase';
import { SecondaryServicesStrip } from '@/components/homepage/SecondaryServicesStrip';
import { WeatherWidget } from '@/components/homepage/WeatherWidget';
import { StockWidget } from '@/components/homepage/StockWidget';
import { BannerSlot } from '@/components/BannerSlot';

const API_SERVER_URL = process.env.API_SERVER_URL || 'http://127.0.0.1:4200';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'VERA (베라) - 실시간 뉴스 · 스마트 생활도구 · 무료 미니게임 통합 포털',
  description:
    'VERA(베라)에서 실시간 팩트 브리핑 뉴스, 퇴직금·DSR·스마트 투두 등 16종 스마트 생활도구, 베라 플라이트·장기·당구·스도쿠 무료 미니게임과 25편 전문 지식 가이드를 한곳에서 만나보세요.',
  keywords: [
    'VERA',
    '베라',
    '베라포털',
    '실시간뉴스',
    '스마트생활도구',
    '퇴직금계산기',
    'DSR계산기',
    '스마트투두',
    'QR코드생성기',
    '만나이계산기',
    '평수계산기',
    '이미지리사이즈',
    '무료사주',
    '만세력',
    '베라장기',
    '베라플라이트',
    '베라당구',
    '스도쿠',
    '2048',
  ],
  alternates: {
    canonical: 'https://veranex.app',
  },
  openGraph: {
    title: 'VERA (베라) - 실시간 뉴스 · 스마트 생활도구 · 무료 미니게임 통합 포털',
    description:
      '실시간 팩트 브리핑 뉴스, 16종 스마트 계산기·생활도구, 무설치 무료 미니게임과 25편의 전문 지식 가이드를 한곳에서.',
    url: 'https://veranex.app',
    type: 'website',
    locale: 'ko_KR',
    siteName: 'VERA (베라)',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'VERA (베라) 통합 라이프 포털',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VERA (베라) - 실시간 뉴스 · 스마트 생활도구 · 무료 미니게임 통합 포털',
    description:
      '실시간 팩트 브리핑 뉴스, 16종 스마트 계산기·생활도구, 무설치 무료 미니게임과 25편의 전문 지식 가이드를 한곳에서.',
    images: ['/og-default.png'],
  },
};

function normalizeThumbnail(url?: string): string | undefined {
  if (!url) return url;
  return String(url).replace(/^http:\/\//i, 'https://');
}

async function fetchWithTimeout(url: string, timeoutMs = 4000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchHomeInitialNews(): Promise<HomeNewsItem[]> {
  try {
    const res = await fetchWithTimeout(`${API_SERVER_URL}/api/news?limit=12`);
    if (!res.ok) return [];
    const data = await res.json();
    if (data?.success) {
      return (data.newsletters || data.news || []).slice(0, 12).map((item: HomeNewsItem) => ({
        ...item,
        thumbnail: normalizeThumbnail(item.thumbnail),
      }));
    }
    return [];
  } catch {
    return [];
  }
}

async function fetchHomeHotNews(): Promise<HotNewsItem[]> {
  try {
    const res = await fetchWithTimeout(`${API_SERVER_URL}/api/news/hot?limit=6`);
    if (!res.ok) return [];
    const data = await res.json();
    if (data?.success && Array.isArray(data.news)) {
      return data.news.slice(0, 6).map((item: HotNewsItem) => ({
        ...item,
        thumbnail: normalizeThumbnail(item.thumbnail),
      }));
    }
    return [];
  } catch {
    return [];
  }
}

async function fetchHomeLatestLoungePost(): Promise<{
  post: LoungeTickerPost | null;
  fetched: boolean;
}> {
  try {
    const res = await fetchWithTimeout(`${API_SERVER_URL}/api/lounge/posts?limit=1`);
    if (!res.ok) return { post: null, fetched: false };
    const data = await res.json();
    if (data?.success && Array.isArray(data.posts)) {
      const first = data.posts[0];
      if (first && first.content) {
        return {
          post: {
            id: first.id,
            author_name: first.author_name,
            content: String(first.content),
            likes: Number(first.likes) || 0,
            comments_count: Number(first.comments_count) || 0,
          },
          fetched: true,
        };
      }
      return { post: null, fetched: true };
    }
    return { post: null, fetched: false };
  } catch {
    return { post: null, fetched: false };
  }
}

export default async function HomePage() {
  const [newsResult, hotNewsResult, loungeResult] = await Promise.allSettled([
    fetchHomeInitialNews(),
    fetchHomeHotNews(),
    fetchHomeLatestLoungePost(),
  ]);

  const initialNews = newsResult.status === 'fulfilled' ? newsResult.value : [];
  const initialHotNews = hotNewsResult.status === 'fulfilled' ? hotNewsResult.value : [];
  const loungePayload =
    loungeResult.status === 'fulfilled'
      ? loungeResult.value
      : { post: null, fetched: false };

  const homeJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://veranex.app/#website',
        url: 'https://veranex.app',
        name: 'VERA (베라)',
        alternateName: ['VERA 포털', '베라 라이프 포털', 'veranex.app'],
        description:
          '실시간 팩트 브리핑 뉴스, 16종 스마트 생활·금융 계산기, 무료 미니게임, 25편 전문 지식 가이드 및 정통 사주 만세력을 제공하는 통합 라이프 포털',
        inLanguage: 'ko-KR',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://veranex.app/guides?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': 'https://veranex.app/#organization',
        name: 'VERA (베라)',
        url: 'https://veranex.app',
        logo: {
          '@type': 'ImageObject',
          url: 'https://veranex.app/logo-512.png',
          width: 512,
          height: 512,
        },
      },
    ],
  };

  return (
    <main className="flex-1 max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 w-full font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />

      {/* 1. 네이버형 최상단 허브: 단일 H1 + 실시간 통합 검색바 + 8대 퀵 바로가기 */}
      <HomePortalTopBar />

      {/* 2. VERA 라운지 실제 최신글 슬림 1줄 티커 */}
      <LoungeBanner
        initialPost={loungePayload.post}
        hasInitialData={loungePayload.fetched}
      />

      {/* 3. 메인 2컬럼 Bento 그리드 (좌측 8열: 배너·뉴스·생활도구·게임 / 우측 4열: 날씨·증시·HOT뉴스·사이드바 배너) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Left Column (8열) */}
        <div className="lg:col-span-8 flex flex-col gap-5 sm:gap-6 min-w-0">
          {/* 상단 쿠팡 파트너스 배너 (ADVERTISEMENT 라벨 + Zero-CLS 고정 최소 높이) */}
          <BannerSlot
            slotKey="home_main_top"
            label="ADVERTISEMENT"
            wrapperClassName="w-full min-h-[108px] bg-white border border-slate-200/80 rounded-2xl px-3 py-2.5 flex flex-col items-center justify-center overflow-hidden shadow-2xs"
          />

          {/* [모바일 전용] 초소형 날씨·증시 1줄 마이크로 칩 (데이터는 모듈 캐시로 1회만 호출) */}
          <div className="lg:hidden flex flex-row items-center gap-1.5 overflow-x-auto hide-scrollbar py-0.5">
            <WeatherWidget displayMode="mobile" />
            <StockWidget displayMode="mobile" />
          </div>

          {/* 핵심 1: 실시간 뉴스 데스크 */}
          <LiveNewsSection initialNews={initialNews} />

          {/* 핵심 2: 스마트 생활도구 쇼케이스 */}
          <LifestyleToolsShowcase />

          {/* 핵심 3: VERA 게임 아케이드 존 & 미니 랭킹 */}
          <GameArcadeShowcase />
        </div>

        {/* Right Column (4열): 데스크탑 사이드바 */}
        <aside className="lg:col-span-4 flex flex-col gap-5 min-w-0" aria-label="포털 실시간 위젯">
          {/* 데스크탑 날씨 · 증시 카드 (기존 디자인 100% 유지, 중복 API 호출 제거) */}
          <div className="hidden lg:flex flex-col gap-4">
            <WeatherWidget displayMode="desktop" />
            <StockWidget displayMode="desktop" />
          </div>

          {/* 실시간 HOT 뉴스 TOP 5 */}
          <SidebarHotNewsWidget initialHotNews={initialHotNews} />

          {/* 사이드바 쿠팡 파트너스 배너 (ADVERTISEMENT 라벨 + Zero-CLS 고정 최소 높이) */}
          <BannerSlot
            slotKey="home_sidebar"
            fallbackSlotKey="home_main_top"
            label="ADVERTISEMENT"
            wrapperClassName="w-full min-h-[120px] bg-white border border-slate-200/80 rounded-3xl p-4 flex flex-col items-center justify-center overflow-hidden shadow-sm my-1"
          />
        </aside>
      </div>

      {/* 4. 하단 슬림 정리: 지식 가이드 컴팩트 4편 + 부가 서비스 바로가기 스트립 */}
      <div className="space-y-6">
        <GuidesShowcase compact />
        <SecondaryServicesStrip />
      </div>
    </main>
  );
}
