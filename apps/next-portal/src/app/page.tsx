import React from 'react';
import { LoungeBanner } from '@/components/homepage/LoungeBanner';
import { HeroSearchSection } from '@/components/homepage/HeroSearchSection';
import { GuidesShowcase } from '@/components/homepage/GuidesShowcase';
import { LiveNewsSection } from '@/components/homepage/LiveNewsSection';
import { WeatherWidget } from '@/components/homepage/WeatherWidget';
import { StockWidget } from '@/components/homepage/StockWidget';
import { SidebarGuidesWidget } from '@/components/homepage/SidebarGuidesWidget';
import { CoreServicesShowcase } from '@/components/homepage/CoreServicesShowcase';
import { BannerSlot } from '@/components/BannerSlot';

export const metadata = {
  title: 'VERA - 세상의 모든 지식과 일상의 인사이트를 잇는 프리미엄 매거진 포털',
  description:
    'VERA에서 25편의 고품질 지식 가이드 & 전문 칼럼(금융·재테크, 명리학·문화, 웹소설 작법, IT·알고리즘), 실시간 팩트 브리핑 뉴스, 스마트 생활도구를 한곳에서 만나보세요.',
};

export default function HomePage() {
  return (
    <main className="flex-1 max-w-6xl mx-auto px-1 sm:px-4 py-4 sm:py-8 w-full font-sans">
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
            <LiveNewsSection />
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
