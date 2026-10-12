import React from 'react';
import { LoungeBanner } from '@/components/homepage/LoungeBanner';
import { HeroSearchSection } from '@/components/homepage/HeroSearchSection';
import { GuidesShowcase } from '@/components/homepage/GuidesShowcase';
import { LiveNewsSection } from '@/components/homepage/LiveNewsSection';
import { WeatherWidget } from '@/components/homepage/WeatherWidget';
import { StockWidget } from '@/components/homepage/StockWidget';
import { SidebarGuidesWidget } from '@/components/homepage/SidebarGuidesWidget';
import { CoreServicesShowcase } from '@/components/homepage/CoreServicesShowcase';
import { AdSlot } from '@/components/adsense/AdSlot';

export const metadata = {
  title: 'VERA - 세상의 모든 지식과 일상의 인사이트를 잇는 프리미엄 매거진 포털',
  description:
    'VERA에서 25편의 고품질 지식 가이드 & 전문 칼럼(금융·재테크, 명리학·문화, 웹소설 작법, IT·알고리즘), 실시간 팩트 브리핑 뉴스, 스마트 생활도구를 한곳에서 만나보세요.',
};

export default function HomePage() {
  return (
    <main className="flex-1 max-w-6xl mx-auto px-2 sm:px-4 py-6 w-full space-y-8">
      {/* 1. VERA Lounge 실시간 핫 토론 띠배너 */}
      <LoungeBanner />

      {/* 2. 대형 히어로 섹션 (그라데이션 + 타이틀 + 실시간 통합 검색창) */}
      <HeroSearchSection />

      {/* 상단 Zero-CLS 광고 슬롯 */}
      <AdSlot format="horizontal" />

      {/* 3. 2-Column Responsive Layout (12열 반응형 그리드) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Left Column (8열): 지식 가이드 쇼케이스 (5개 탭) & 실시간 뉴스 */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* 지식 가이드 & 전문 칼럼 쇼케이스 */}
          <GuidesShowcase />

          {/* 중간 스폰서드 배너 슬롯 */}
          <AdSlot format="horizontal" />

          {/* 실시간 뉴스 & AI 팩트 브리핑 */}
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
        </div>
      </div>

      {/* 4. 포털 3대 핵심 서비스 쇼케이스 (스마트 생활도구, 미니게임존, 사주/엔터테인먼트) */}
      <CoreServicesShowcase />

      {/* 하단 Zero-CLS 광고 슬롯 */}
      <AdSlot format="rectangle" />
    </main>
  );
}
