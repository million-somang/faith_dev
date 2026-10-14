import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '실시간 뉴스 & AI 팩트 브리핑 - 분야별 주요 속보 및 생활 영향 분석',
  description:
    '정치, 경제, IT/과학, 증시, 스포츠, 엔터테인먼트 등 언론사 주요 속보의 핵심 팩트를 추출하고 실생활 영향 분석 및 연계 도구를 제공하는 VERA 뉴스 브리핑 데스크입니다.',
  keywords: [
    '실시간뉴스',
    '뉴스브리핑',
    '팩트체크',
    '경제뉴스',
    '증시속보',
    'IT뉴스',
    'AI뉴스요약',
    'VERA뉴스',
  ],
  alternates: {
    canonical: 'https://veranex.app/news',
  },
  openGraph: {
    title: '실시간 뉴스 & AI 팩트 브리핑 | VERA',
    description:
      '공식 언론사 뉴스 피드의 핵심 팩트를 추출하고 실생활 영향 분석을 제공하는 VERA 실시간 뉴스 데스크.',
    url: 'https://veranex.app/news',
    type: 'website',
  },
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
