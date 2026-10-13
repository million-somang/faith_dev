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
    <main className="flex-1 max-w-6xl mx-auto px-1 sm:px-4 py-8 w-full font-sans">
      {/* 1. VERA Lounge 실시간 핫 토론 띠배너 */}
      <LoungeBanner />

      {/* 2. 대형 히어로 섹션 (그라데이션 + 타이틀 + 실시간 통합 검색창) */}
      <HeroSearchSection />

      {/* 3. 2-Column Responsive Layout (12열 반응형 그리드 - Vite 원본 비율 일치) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
        {/* Left Column (8열): 지식 가이드 쇼케이스 (5개 탭) & 쿠팡 배너 & 실시간 뉴스 */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* 지식 가이드 & 전문 칼럼 쇼케이스 (25편 완비) */}
          <GuidesShowcase />

          {/* 쿠팡 파트너스 공식 다이내믹 메인 배너 슬롯 */}
          <BannerSlot slotKey="home_main_top" />

          {/* 실시간 뉴스 & AI 팩트 브리핑 (Vite 원본 NewsCard 스펙) */}
          <LiveNewsSection />
        </div>

        {/* Right Column (4열): 날씨 · 증시 · 추천 칼럼 TOP 4 & 스마트 계산기 위젯 */}
        <div className="lg:col-span-4 flex flex-col gap-4 order-first lg:order-none">
          {/* 날씨 · 증시: 모바일 컴팩트 가로 칩 / PC 큰 카드 */}
          <div className="flex flex-row gap-2 overflow-x-auto hide-scrollbar pb-1 sm:flex-col sm:gap-4 sm:overflow-x-visible sm:pb-0">
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
