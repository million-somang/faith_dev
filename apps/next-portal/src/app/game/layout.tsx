import React from 'react';
import type { Metadata } from 'next';
import { GAMES_DATA } from '@/data/gamesData';
import { GAME_CONFIGS } from '@/data/gameConfigs';

export const metadata: Metadata = {
  title: '무료 미니게임존 - 베라장기, 오목, 베라 플라이트, 스도쿠, 2048, 프리셀, 지뢰찾기',
  description:
    '설치 없이 브라우저에서 즉시 즐기는 무료 HTML5 웹 게임 포털. 정통 한국 장기(베라장기), AI 오목, 1942 비행슈팅(베라 플라이트), 스도쿠, 2048, 프리셀, 지뢰찾기, 숫자야구를 무료로 플레이하세요.',
  keywords: [
    '무료웹게임',
    '미니게임',
    '무료장기게임',
    '온라인오목',
    '베라플라이트',
    '1942비행기게임',
    '무료스도쿠',
    '2048게임',
    '프리셀',
    '지뢰찾기',
    '숫자야구',
    'VERA게임',
  ],
  alternates: {
    canonical: 'https://veranex.app/game',
  },
  openGraph: {
    title: '무료 미니게임존 - 설치 없는 웹 보드·퍼즐·아케이드 게임 | VERA',
    description:
      '베라장기, AI 오목, 베라 플라이트 1942, 스도쿠, 2048, 프리셀, 지뢰찾기 등 인기 두뇌·아케이드 게임을 설치 없이 즉시 즐기세요.',
    url: 'https://veranex.app/game',
    type: 'website',
  },
};

export default function GameLayout({ children }: { children: React.ReactNode }) {
  const gameSlugs = Array.from(
    new Set([...Object.keys(GAMES_DATA), ...Object.keys(GAME_CONFIGS)])
  ).filter((slug) => slug !== 'comboy' && slug !== 'sfc');

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'VERA 무료 미니게임 목록',
    description: '설치 없이 웹 브라우저에서 바로 플레이하는 두뇌 보드 및 아케이드 게임 컬렉션',
    itemListElement: gameSlugs.map((slug, idx) => {
      const cfg = GAME_CONFIGS[slug];
      const legacy = GAMES_DATA[slug];
      return {
        '@type': 'ListItem',
        position: idx + 1,
        name: cfg?.label || legacy?.name || slug,
        url: `https://veranex.app/game/${slug}`,
      };
    }),
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
