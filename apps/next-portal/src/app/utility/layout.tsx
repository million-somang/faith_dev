import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '스마트 웹 유틸리티 & 계산기 허브 - 무료 온라인 생활·금융·개발 도구',
  description:
    '퇴직금 계산기, 만 나이 계산기, 평수 변환기, 예적금 이자 계산기, 이미지 리사이즈, WebP 변환기, JSON 포맷터 등 실생활과 업무에 즉시 활용하는 VERA 웹 유틸리티 허브입니다.',
  keywords: [
    '웹유틸리티',
    '무료계산기',
    '이미지크기조절',
    'WebP변환',
    'JSON포맷터',
    '글자수세기',
    '퇴직금계산기',
    'VERA',
  ],
  alternates: {
    canonical: 'https://veranex.app/lifestyle',
  },
  openGraph: {
    title: '스마트 웹 유틸리티 & 계산기 허브 | VERA',
    description:
      '설치 없이 브라우저에서 바로 작동하는 14종의 무료 생활·금융·이미지·개발 유틸리티.',
    url: 'https://veranex.app/lifestyle',
    type: 'website',
  },
};

export default function UtilityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
