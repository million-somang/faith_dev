import React from 'react';
import type { Metadata } from 'next';
import { TOOLS_DATA } from '@/data/toolsData';

export const metadata: Metadata = {
  title: '스마트 생활도구 & 계산기 모음 - 퇴직금, 만나이, 평수, 이자, 이미지 리사이즈, WebP 변환',
  description:
    '2026 법정 퇴직금·실업급여 계산기, 만 나이 계산기, 아파트 평수 변환기, 예적금 복리 이자 계산기, 해외직구 관세 계산기, 이미지 일괄 리사이즈 및 WebP 변환기 등 필수 온라인 생활 유틸리티 14종을 무료로 이용하세요.',
  keywords: [
    '생활도구',
    '온라인계산기',
    '퇴직금계산기',
    '만나이계산기',
    '평수계산기',
    '이자계산기',
    '관세계산기',
    '글자수세기',
    '이미지리사이즈',
    'WebP변환기',
    'VERA',
  ],
  alternates: {
    canonical: 'https://veranex.app/lifestyle',
  },
  openGraph: {
    title: '스마트 생활도구 & 계산기 모음 | VERA',
    description:
      '금융·생활 계산기부터 이미지 일괄 리사이즈, WebP 압축, 개발자 포맷터까지 14종의 무료 웹 도구를 한곳에서.',
    url: 'https://veranex.app/lifestyle',
    type: 'website',
  },
};

export default function LifestyleLayout({ children }: { children: React.ReactNode }) {
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'VERA 스마트 생활도구 및 온라인 계산기 모음',
    itemListElement: TOOLS_DATA.map((tool, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: tool.name,
      url: `https://veranex.app/tools/${tool.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      {children}
    </>
  );
}
