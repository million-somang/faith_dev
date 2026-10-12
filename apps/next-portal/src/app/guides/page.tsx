import React from 'react';
import type { Metadata } from 'next';
import { GuidesHubView } from '@/components/guides/GuidesHubView';

export const metadata: Metadata = {
  title: '정보 가이드 & 지식 칼럼 - VERA Knowledge Hub',
  description: '금융, 사주 명리학, 웹소설 작법, 생활 계산기, 두뇌 퍼즐 공략, 개발자 도구 등 실생활과 커리어에 유용한 고품질 전문 지식 가이드 25편을 만나보세요.',
  keywords: ['지식가이드', '정보칼럼', '배당주투자', '스도쿠공략', '2048공략', '명리학', '웹소설작법', 'VERA'],
  alternates: {
    canonical: 'https://veranex.app/guides',
  },
  openGraph: {
    title: '정보 가이드 & 지식 칼럼 | VERA Knowledge Hub',
    description: '엄격한 팩트체크와 전문 연구진이 직접 집필한 25편의 오리지널 지식 가이드.',
    url: 'https://veranex.app/guides',
    type: 'website',
  },
};

export default function GuidesPage() {
  return <GuidesHubView />;
}
