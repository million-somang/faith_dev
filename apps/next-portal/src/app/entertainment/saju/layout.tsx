import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '정통 만세력 & 무료 사주팔자 풀이 - 사주 4주 8자 · 오행 밸런스 · 궁합 분석',
  description:
    '생년월일시에 담긴 천간·지지 8글자와 목·화·토·금·수 오행의 균형을 정밀 분석하는 무료 정통 만세력 및 사주명리 서비스입니다. 회원가입 없이 타고난 기질, 재물운, 직업 적성, 2인 궁합을 즉시 확인하세요.',
  keywords: [
    '무료사주',
    '만세력',
    '사주팔자',
    '무료만세력',
    '오행분석',
    '사주궁합',
    '오늘의운세',
    '명리학',
    '일주론',
    'VERA사주',
  ],
  alternates: {
    canonical: 'https://veranex.app/entertainment/saju',
  },
  openGraph: {
    title: '정통 만세력 & 무료 사주팔자 풀이 | VERA',
    description:
      '생년월일시 입력 한 번으로 확인하는 사주 4주 8자 원국표, 오행 밸런스, 타고난 기질 및 2인 궁합 분석.',
    url: 'https://veranex.app/entertainment/saju',
    type: 'website',
  },
};

export default function SajuLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
