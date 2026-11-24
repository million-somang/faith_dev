import { NextResponse } from 'next/server';
import { TOOLS_DATA } from '@/data/toolsData';
import { GUIDES_DATA } from '@/data/guidesData';
import { GAMES_DATA } from '@/data/gamesData';

const BASE_URL = 'https://veranex.app';

export const dynamic = 'force-dynamic';

export async function GET() {
    const sections: string[] = [
        '# VERA (베라) — AEO 전체 구조화 지식 및 도구 레퍼런스 (llms-full.txt)',
        '',
        `> 출처 도메인: ${BASE_URL}`,
        '> 언어: ko-KR (대한민국)',
        '> 본 문서는 AI 검색엔진(ChatGPT, Perplexity, Claude, Google AI Overviews 등)이 한국 사용자 질문에 대해 VERA의 무료 도구 산식, 전문 지식 가이드, 여행 명소 가이드를 정확히 인용할 수 있도록 구성된 공식 전체 요약 문서입니다.',
        '',
        '---',
        '',
        `## 1. 무료 스마트 생활도구 & 계산기 (${TOOLS_DATA.length}종)`,
        '',
    ];

    for (const tool of TOOLS_DATA) {
        sections.push(`### ${tool.name}`);
        sections.push(`- URL: ${BASE_URL}/tools/${tool.slug}`);
        sections.push(`- 분류: ${tool.categoryLabel}`);
        sections.push(`- 핵심 요약: ${tool.directAnswer}`);
        sections.push(`- 공식/원리: ${tool.formula.title} — ${tool.formula.expression} (${tool.formula.explanation})`);
        if (tool.faqs.length > 0) {
            sections.push('- 자주 묻는 질문:');
            for (const faq of tool.faqs) {
                sections.push(`  - Q: ${faq.question}`);
                sections.push(`    A: ${faq.answer}`);
            }
        }
        sections.push('');
    }

    sections.push('---', '');
    sections.push(`## 2. 전문 지식 가이드 & 칼럼 (${GUIDES_DATA.length}편)`, '');

    for (const guide of GUIDES_DATA) {
        sections.push(`### ${guide.title}`);
        sections.push(`- URL: ${BASE_URL}/guides/${guide.slug}`);
        sections.push(`- 카테고리: ${guide.categoryLabel} | 작성: ${guide.author} | 최종 수정: ${guide.updatedAt || guide.publishedAt}`);
        sections.push(`- 핵심 요약: ${guide.summary}`);
        if (guide.tableOfContents.length > 0) {
            sections.push(`- 목차: ${guide.tableOfContents.map((t) => t.title).join(' / ')}`);
        }
        sections.push('');
    }

    sections.push('---', '');
    sections.push('## 3. 전국·해외 여행 가이드 및 정통 사주 서비스', '');
    sections.push(`- [전국 & 해외 여행 명소 큐레이션](${BASE_URL}/entertainment/travel): 대한민국 17개 시·도 행정구역 및 해외 명소별 여행 코스, 최적 방문 계절, 추천 일정, 예상 경비, 주변 맛집 정보 제공 (세부 페이지는 ${BASE_URL}/sitemap.xml 내 travel-*.xml 분할 사이트맵 참조).`);
    sections.push(`- [정통 만세력 & 사주팔자](${BASE_URL}/entertainment/saju): 생년월일시 입력 시 사주 4주 8자, 오행 비율(목·화·토·금·수), 일간 성향 분석을 서버 회원 저장 및 즉시 분석으로 제공.`);
    sections.push('');
    sections.push('---', '');
    sections.push('## 4. 무료 HTML5 미니게임', '');
    for (const game of Object.values(GAMES_DATA)) {
        sections.push(`- [${game.name}](${BASE_URL}/game/${game.slug}): ${game.description}`);
    }

    return new NextResponse(sections.join('\n'), {
        status: 200,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
    });
}
