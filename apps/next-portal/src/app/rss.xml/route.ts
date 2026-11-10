import { NextResponse } from 'next/server';
import { TOOLS_DATA } from '@/data/toolsData';
import { GAMES_DATA } from '@/data/gamesData';
import { GAME_CONFIGS } from '@/data/gameConfigs';
import { getGameSeoData } from '@/data/gamesSeoData';
import { GUIDES_DATA } from '@/data/guidesData';

export const dynamic = 'force-dynamic';

function escapeCdata(str: string): string {
  return (str || '').replace(/\]\]>/g, ']]]]><![CDATA[>');
}

export async function GET() {
  const baseUrl = 'https://veranex.app';
  const buildDate = new Date('2026-11-10T00:00:00.000Z').toUTCString();

  const itemsXml: string[] = [];

  // 1. 핵심 허브 서비스
  const hubItems = [
    {
      title: '정통 만세력 & 무료 사주팔자 풀이 - 사주 4주 8자 · 오행 밸런스 · 궁합 분석',
      link: `${baseUrl}/entertainment/saju`,
      description:
        '생년월일시에 담긴 천간·지지 8글자와 목·화·토·금·수 오행의 균형을 정밀 분석하는 무료 정통 만세력 및 사주명리 서비스입니다.',
      category: '사주 & 명리학',
      author: 'VERA 인문학 연구팀',
      pubDate: buildDate,
    },
    {
      title: '스마트 생활도구 & 계산기 모음 - 퇴직금, 만나이, 평수, 이자, 이미지 리사이즈, WebP 변환',
      link: `${baseUrl}/lifestyle`,
      description:
        '2026 법정 퇴직금·실업급여 계산기, 만 나이 계산기, 아파트 평수 변환기, 예적금 복리 이자 계산기 등 필수 온라인 생활 유틸리티를 무료로 이용하세요.',
      category: '생활도구 & 계산기',
      author: 'VERA 생활경제팀',
      pubDate: buildDate,
    },
    {
      title: '미국 배당주 세금 & 주택담보대출 DSR/LTV & 퇴직금 실업급여 계산기',
      link: `${baseUrl}/finance/util`,
      description:
        'SCHD, JEPI 배당소득세(15.4%) 및 12개월 캘린더, 2026 스트레스 DSR 2단계 적용 주담대 한도, 법정 퇴직금 세후 실수령액 및 실업급여 무료 시뮬레이터',
      category: '스마트 금융도구',
      author: 'VERA 금융팀',
      pubDate: buildDate,
    },
    {
      title: '전국 & 해외 감성 여행 가이드 - 인터랙티브 대한민국 여행 지도 · 코스 큐레이션',
      link: `${baseUrl}/entertainment/travel`,
      description:
        '인터랙티브 대한민국 행정구역 지도로 한눈에 찾는 전국 명소, 맛집, 힐링·캠핑 코스와 일본·유럽·미주 해외 여행지 큐레이션 가이드를 만나보세요.',
      category: '여행 큐레이션',
      author: 'VERA 여행 큐레이션팀',
      pubDate: buildDate,
    },
    {
      title: '베라 웹소설 연재관 - 자가 출판 & 자유 연재 플랫폼',
      link: `${baseUrl}/entertainment/novel`,
      description:
        '판타지, 무협, 로맨스, 현대판타지 등 다양한 장르의 웹소설을 무료로 감상하고 작가로서 직접 작품을 연재해보세요.',
      category: '웹소설 & 창작',
      author: 'VERA 콘텐츠팀',
      pubDate: buildDate,
    },
  ];

  for (const hub of hubItems) {
    itemsXml.push(`    <item>
      <title><![CDATA[${escapeCdata(hub.title)}]]></title>
      <link>${hub.link}</link>
      <guid isPermaLink="true">${hub.link}</guid>
      <description><![CDATA[${escapeCdata(hub.description)}]]></description>
      <category><![CDATA[${escapeCdata(hub.category)}]]></category>
      <author><![CDATA[${escapeCdata(hub.author)}]]></author>
      <pubDate>${hub.pubDate}</pubDate>
    </item>`);
  }

  // 2. 14종 스마트 도구 (/tools/[slug])
  for (const tool of TOOLS_DATA) {
    const link = `${baseUrl}/tools/${tool.slug}`;
    const cleanTitle = (tool.title || tool.name).replace(/\s*\|\s*VERA$/i, '');
    itemsXml.push(`    <item>
      <title><![CDATA[${escapeCdata(cleanTitle)}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description><![CDATA[${escapeCdata(tool.description)}]]></description>
      <category><![CDATA[${escapeCdata(tool.categoryLabel)} 도구]]></category>
      <author><![CDATA[VERA 스마트 도구팀]]></author>
      <pubDate>${buildDate}</pubDate>
    </item>`);
  }

  // 3. 무료 미니게임 (/game/[slug])
  const allGameSlugs = Array.from(
    new Set([...Object.keys(GAMES_DATA), ...Object.keys(GAME_CONFIGS)])
  ).filter((slug) => slug !== 'comboy' && slug !== 'sfc');

  for (const slug of allGameSlugs) {
    const config = GAME_CONFIGS[slug];
    const seoData = getGameSeoData(slug);
    const legacyGame = GAMES_DATA[slug];
    const title = seoData?.title || `${config?.label || legacyGame?.name || slug} - 무료 웹 미니게임`;
    const description =
      seoData?.description || config?.description || legacyGame?.description || '';
    const link = `${baseUrl}/game/${slug}`;

    itemsXml.push(`    <item>
      <title><![CDATA[${escapeCdata(title)}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description><![CDATA[${escapeCdata(description)}]]></description>
      <category><![CDATA[무료 웹 미니게임]]></category>
      <author><![CDATA[VERA 게임 스튜디오]]></author>
      <pubDate>${buildDate}</pubDate>
    </item>`);
  }

  // 4. 25편 지식 가이드 (/guides/[slug])
  for (const guide of GUIDES_DATA) {
    const link = `${baseUrl}/guides/${guide.slug}`;
    const rawDate = guide.updatedAt || guide.publishedAt;
    let pubDate = buildDate;
    if (rawDate) {
      const parsed = new Date(rawDate);
      if (!isNaN(parsed.getTime())) {
        pubDate = parsed.toUTCString();
      }
    }

    itemsXml.push(`    <item>
      <title><![CDATA[${escapeCdata(guide.title)}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description><![CDATA[${escapeCdata(guide.summary || guide.description)}]]></description>
      <category><![CDATA[${escapeCdata(guide.categoryLabel)}]]></category>
      <author><![CDATA[${escapeCdata(guide.author || 'VERA 편집국')}]]></author>
      <pubDate>${pubDate}</pubDate>
    </item>`);
  }

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[VERA (베라) - 실시간 라이프 포털 & 지식 가이드]]></title>
    <link>${baseUrl}</link>
    <description><![CDATA[검증된 지식 가이드 25편, 정통 만세력 무료 사주팔자, 스마트 생활·금융 계산기 14종, 무설치 웹 미니게임 및 전국 여행 큐레이션을 제공하는 통합 라이프 포털]]></description>
    <language>ko-KR</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
${itemsXml.join('\n\n')}
  </channel>
</rss>
`;

  return new NextResponse(rssXml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
