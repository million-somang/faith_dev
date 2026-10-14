import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '운세 · 명리학 · 웹소설 · 여행 힐링 라운지 - VERA 엔터테인먼트',
  description:
    '정통 만세력 기반 무료 사주팔자·오행 분석, 몰입감 넘치는 오리지널 웹소설, 전국 및 해외 테마별 여행지 큐레이션까지 일상의 활력과 지혜를 더하는 VERA 엔터테인먼트 허브입니다.',
  keywords: [
    '무료사주',
    '만세력',
    '오늘의운세',
    '사주명리학',
    '오행분석',
    '웹소설',
    '국내여행추천',
    '힐링여행',
    'VERA',
  ],
  alternates: {
    canonical: 'https://veranex.app/entertainment',
  },
  openGraph: {
    title: '운세 · 명리학 · 웹소설 · 여행 힐링 라운지 | VERA',
    description:
      '정통 사주명리 만세력, 오리지널 웹소설, 국내외 감성 여행 큐레이션을 한곳에서 만나보세요.',
    url: 'https://veranex.app/entertainment',
    type: 'website',
  },
};

export default function EntertainmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
