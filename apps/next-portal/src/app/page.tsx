import React from 'react';
import type { Metadata } from 'next';
import { LoungeBanner } from '@/components/homepage/LoungeBanner';
import { HeroSearchSection } from '@/components/homepage/HeroSearchSection';
import { GuidesShowcase } from '@/components/homepage/GuidesShowcase';
import { LiveNewsSection, HomeNewsItem } from '@/components/homepage/LiveNewsSection';
import { WeatherWidget } from '@/components/homepage/WeatherWidget';
import { StockWidget } from '@/components/homepage/StockWidget';
import { SidebarGuidesWidget } from '@/components/homepage/SidebarGuidesWidget';
import { CoreServicesShowcase } from '@/components/homepage/CoreServicesShowcase';
import { BannerSlot } from '@/components/BannerSlot';

const API_SERVER_URL = process.env.API_SERVER_URL || 'http://127.0.0.1:4200';

export const revalidate = 180;

export const metadata: Metadata = {
  title: 'VERA (베라) - 실시간 뉴스 브리핑 · 지식 가이드 · 스마트 생활도구 · 무료 미니게임 포털',
  description:
    'VERA(베라)에서 실시간 AI 팩트 브리핑 뉴스, 25편의 고품질 지식 가이드 & 전문 칼럼(금융·재테크, 명리학·사주, 웹소설 작법, IT·알고리즘), 퇴직금·배당세·DSR·이미지 리사이즈 등 스마트 생활도구와 무료 미니게임(베라장기, 오목, 베라 플라이트, 스도쿠)을 한곳에서 만나보세요.',
  keywords: [
    'VERA',
    '베라',
    '베라포털',
    '실시간뉴스',
    '지식가이드',
    '퇴직금계산기',
    '만나이계산기',
    '평수계산기',
    '이미지리사이즈',
    'WebP변환기',
    '무료사주',
    '만세력',
    '베라장기',
    '베라플라이트',
    '스도쿠',
    '2048',
  ],
  alternates: {
    canonical: 'https://veranex.app',
  },
  openGraph: {
    title: 'VERA (베라) - 실시간 뉴스 · 지식 가이드 · 스마트 생활도구 · 미니게임 통합 포털',
    description:
      '실시간 팩트 브리핑 뉴스, 25편의 전문 지식 칼럼, 14종 스마트 계산기·도구, 무료 미니게임과 정통 만세력을 한곳에서.',
    url: 'https://veranex.app',
    type: 'website',
  },
};

async function fetchHomeInitialNews(): Promise<HomeNewsItem[]> {
  try {
    const res = await fetch(`${API_SERVER_URL}/api/news?limit=6`, {
      next: { revalidate: 180 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (data?.success) {
      return (data.newsletters || data.news || []).slice(0, 6);
    }
    return [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const initialNews = await fetchHomeInitialNews();

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
          '실시간 팩트 브리핑 뉴스, 25편의 전문 지식 가이드, 스마트 생활·금융 계산기, 무료 미니게임 및 정통 사주 만세력을 제공하는 통합 라이프 포털',
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
    <main className="flex-1 max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8 w-full font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />

      {/* 1. VERA Lounge 실시간 핫 토론 띠배너 */}
      <LoungeBanner />

      {/* 2. 2-Column Responsive Layout (모바일: 쿠팡배너 -> 마이크로 날씨/증시 -> 뉴스, PC: 쿠팡배너 -> 뉴스 최상단 우선 노출) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
        {/* Left Column (8열): 모바일과 PC 모두 쿠팡배너 & 실시간 뉴스가 최상단으로 올라감 */}
        <div className="lg:col-span-8 flex flex-col gap-5 sm:gap-6">
          {/* [모바일 1순위 / PC 1순위] 쿠팡 파트너스 공식 다이내믹 메인 배너 */}
          <div className="order-1">
            <BannerSlot slotKey="home_main_top" />
          </div>

          {/* [모바일 2순위 전용] 1/5 크기 초소형 날씨·증시 마이크로 티커 바 */}
          <div className="order-2 lg:hidden flex flex-row items-center gap-1.5 overflow-x-auto hide-scrollbar py-0.5">
            <WeatherWidget />
            <StockWidget />
          </div>

          {/* [모바일 3순위 / PC 2순위] 실시간 뉴스 & AI 팩트 브리핑 */}
          <div className="order-3">
            <LiveNewsSection initialNews={initialNews} />
          </div>

          {/* [모바일 4순위 / PC 3순위] 통합 검색 히어로 섹션 */}
          <div className="order-4">
            <HeroSearchSection />
          </div>

          {/* [모바일 5순위 / PC 4순위] 지식 가이드 & 전문 칼럼 쇼케이스 (25편 완비) */}
          <div className="order-5">
            <GuidesShowcase />
          </div>
        </div>

        {/* Right Column (4열): 데스크탑 우측 사이드바 위젯 */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* 데스크탑 날씨 · 증시 카드 (모바일에서는 위의 마이크로 칩으로 렌더링되므로 데스크탑 카드만 노출) */}
          <div className="hidden lg:flex flex-col gap-4">
            <WeatherWidget />
            <StockWidget />
          </div>

          {/* 주간 추천 칼럼 TOP 4 & 스마트 계산기 도구 위젯 */}
          <SidebarGuidesWidget />

          {/* 사이드바 쿠팡 배너 슬롯 */}
          <BannerSlot slotKey="home_sidebar" fallbackSlotKey="home_main_top" />
        </div>
      </div>

      {/* 4. 포털 3대 핵심 서비스 쇼케이스 (스마트 생활도구, 미니게임존, 사주/엔터테인먼트) */}
      <CoreServicesShowcase />
    </main>
  );
}
