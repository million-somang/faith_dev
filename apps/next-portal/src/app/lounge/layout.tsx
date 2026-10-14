import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VERA 라운지 - 실시간 핫토픽 토론 & 커뮤니티 피드',
  description:
    '경제, 증시, 코인, IT, 일상 이슈에 대해 실시간으로 의견을 나누고 투표하는 VERA 오픈 커뮤니티 라운지입니다.',
  keywords: ['베라라운지', '실시간토론', '이슈커뮤니티', '주식토론', '코인토론', 'VERA'],
  alternates: {
    canonical: 'https://veranex.app/lounge',
  },
  openGraph: {
    title: 'VERA 라운지 - 실시간 핫토픽 토론 & 커뮤니티',
    description: '지금 가장 뜨거운 이슈와 금융·일상 토픽에 대한 실시간 대토론에 참여하세요.',
    url: 'https://veranex.app/lounge',
    type: 'website',
  },
};

export default function LoungeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
