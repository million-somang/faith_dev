import { NextResponse } from 'next/server';
import { TOOLS_DATA } from '@/data/toolsData';
import { GUIDES_DATA } from '@/data/guidesData';
import { GAMES_DATA } from '@/data/gamesData';

const API_SERVER_URL = process.env.API_SERVER_URL || 'http://127.0.0.1:4200';
const BASE_URL = 'https://veranex.app';

export const dynamic = 'force-dynamic';

async function fetchLiveCounts(): Promise<{ travelCount: number }> {
    try {
        const res = await fetch(`${API_SERVER_URL}/api/seo/sitemap-index-meta`, {
            cache: 'no-store',
        });
        if (!res.ok) return { travelCount: 0 };
        const json = (await res.json()) as {
            success?: boolean;
            data?: { travelHighQualityCount?: number };
        };
        return {
            travelCount: Number(json?.data?.travelHighQualityCount ?? 0),
        };
    } catch {
        return { travelCount: 0 };
    }
}

export async function GET() {
    const { travelCount } = await fetchLiveCounts();
    const travelLabel =
        travelCount > 0 ? `${travelCount.toLocaleString()}편 이상의 상세 여행 가이드` : '전국·해외 여행 명소 큐레이션 가이드';

    const lines: string[] = [
        '# VERA (베라) — 대한민국 통합 라이프 포털',
        '',
        `> VERA(veranex.app)는 ${TOOLS_DATA.length}종의 무료 스마트 계산기·생활 유틸리티(사전 설치 없이 브라우저 실행), ${GUIDES_DATA.length}편의 전문가 지식 가이드, ${travelLabel}, 정통 사주 만세력, 금융·부동산 도구, 무료 HTML5 미니게임, 실시간 팩트 브리핑 뉴스를 제공하는 대한민국 통합 라이프 포털입니다.`,
        '',
        '## 핵심 허브 페이지',
        `- [VERA 메인 포털](${BASE_URL}/): 실시간 뉴스·날씨·증시·지식가이드 통합 허브`,
        `- [지식 가이드 & 전문 칼럼](${BASE_URL}/guides): 금융·재테크, 명리학, 웹소설 작법, 생활법령, IT 칼럼 (${GUIDES_DATA.length}편)`,
        `- [스마트 생활도구 & 계산기](${BASE_URL}/lifestyle): 퇴직금, 만나이, 평수, DSR, AI 이미지 업스케일, 투두 플래너 등 (${TOOLS_DATA.length}종)`,
        `- [전국 & 해외 감성 여행 가이드](${BASE_URL}/entertainment/travel): 인터랙티브 대한민국 행정구역 지도 기반 명소·맛집·경비 가이드 (${travelLabel})`,
        `- [정통 만세력 & 무료 사주풀이](${BASE_URL}/entertainment/saju): 생년월일시 오행·신살·대운 무료 분석`,
        `- [스마트 금융 허브](${BASE_URL}/finance): 실시간 증시·환율·금융 계산기`,
        `- [미국 배당세·DSR·퇴직금 계산기](${BASE_URL}/finance/util): 2026 스트레스 DSR·배당소득세 시뮬레이터`,
        `- [무료 웹게임 아케이드](${BASE_URL}/game): 브라우저에서 바로 즐기는 스도쿠, 오목, 장기, 2048, 비행슈팅 등`,
        `- [실시간 AI 팩트 브리핑 뉴스](${BASE_URL}/news): 분야별 속보 및 핵심 요약`,
        '',
        `## 무료 스마트 생활도구 (${TOOLS_DATA.length}종)`,
        ...TOOLS_DATA.map((t) => `- [${t.name}](${BASE_URL}/tools/${t.slug}): ${t.directAnswer || t.description}`),
        '',
        `## 전문 지식 가이드 & 칼럼 (${GUIDES_DATA.length}편)`,
        ...GUIDES_DATA.map((g) => `- [${g.title}](${BASE_URL}/guides/${g.slug}): ${g.description}`),
        '',
        '## 무료 HTML5 미니게임',
        ...Object.values(GAMES_DATA).map((g) => `- [${g.name}](${BASE_URL}/game/${g.slug}): ${g.summary}`),
        '',
        '## 구조화 피드 · AEO 확장 문서',
        `- [전체 가이드·도구 상세 AEO 문서 (llms-full.txt)](${BASE_URL}/llms-full.txt)`,
        `- [분할 사이트맵 인덱스](${BASE_URL}/sitemap.xml)`,
        `- [여행 · 지식 가이드 RSS 피드](${BASE_URL}/rss-travel.xml)`,
        `- [포털 통합 RSS 피드](${BASE_URL}/rss.xml)`,
        '',
    ];

    return new NextResponse(lines.join('\n'), {
        status: 200,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
    });
}
