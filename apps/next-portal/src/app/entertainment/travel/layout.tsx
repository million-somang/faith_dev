import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '전국 & 해외 감성 여행 가이드 - 인터랙티브 대한민국 여행 지도 · 코스 큐레이션',
  description:
    '인터랙티브 대한민국 행정구역 지도로 한눈에 찾는 전국 명소, 맛집, 힐링·캠핑 코스와 일본·유럽·미주 해외 여행지 큐레이션 가이드를 만나보세요.',
  keywords: [
    '국내여행추천',
    '전국여행지도',
    '주말나들이',
    '힐링여행지',
    '맛집여행',
    '일본여행',
    '유럽여행',
    '여행코스',
    'VERA여행',
  ],
  alternates: {
    canonical: 'https://veranex.app/entertainment/travel',
  },
  openGraph: {
    title: '전국 & 해외 감성 여행 큐레이션 가이드 | VERA',
    description:
      '대한민국 인터랙티브 여행 지도와 테마별 추천 여행 코스·일정·예산 가이드를 확인하세요.',
    url: 'https://veranex.app/entertainment/travel',
    type: 'website',
  },
};

export default function TravelLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
