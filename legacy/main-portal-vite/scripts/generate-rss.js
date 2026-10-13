import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const portalRoot = path.resolve(__dirname, '..');
const distDir = path.resolve(portalRoot, 'dist');
const publicDir = path.resolve(portalRoot, 'public');

// RSS 2.0 Generator
export async function generateRssFeed() {
    console.log('📡 Generating RSS 2.0 Feed for Googlebot & News aggregators...');

    const guidesSourcePath = path.resolve(portalRoot, 'src/data/guidesData.ts');
    if (!fs.existsSync(guidesSourcePath)) {
        console.warn('⚠️ guidesData.ts not found for RSS.');
        return;
    }

    const sourceContent = fs.readFileSync(guidesSourcePath, 'utf8');
    const matches = sourceContent.match(/slug:\s*'([^']+)'[\s\S]*?title:\s*'([^']+)'[\s\S]*?description:\s*'([^']+)'[\s\S]*?categoryLabel:\s*'([^']+)'[\s\S]*?readTime:\s*'([^']+)'[\s\S]*?publishedAt:\s*'([^']+)'[\s\S]*?author:\s*'([^']+)'[\s\S]*?summary:\s*'([^']+)'/g);

    const items = [];

    if (matches) {
        for (const block of matches) {
            const slug = block.match(/slug:\s*'([^']+)'/)?.[1];
            const title = block.match(/title:\s*'([^']+)'/)?.[1];
            const description = block.match(/description:\s*'([^']+)'/)?.[1];
            const categoryLabel = block.match(/categoryLabel:\s*'([^']+)'/)?.[1];
            const publishedAt = block.match(/publishedAt:\s*'([^']+)'/)?.[1];
            const author = block.match(/author:\s*'([^']+)'/)?.[1];

            if (slug && title) {
                const pubDate = publishedAt ? new Date(publishedAt).toUTCString() : new Date().toUTCString();
                items.push(`
    <item>
      <title><![CDATA[${title}]]></title>
      <link>https://veranex.app/guides/${slug}</link>
      <guid isPermaLink="true">https://veranex.app/guides/${slug}</guid>
      <description><![CDATA[${description}]]></description>
      <category><![CDATA[${categoryLabel || '지식가이드'}]]></category>
      <author><![CDATA[${author || 'VERA 편집팀'}]]></author>
      <pubDate>${pubDate}</pubDate>
    </item>`);
            }
        }
    }

    // 신규 금융Util 계산기 아이템 추가
    items.unshift(`
    <item>
      <title><![CDATA[미국 배당주 세금 & 주택담보대출 DSR/LTV & 퇴직금 실업급여 계산기]]></title>
      <link>https://veranex.app/finance/util</link>
      <guid isPermaLink="true">https://veranex.app/finance/util</guid>
      <description><![CDATA[SCHD, JEPI 배당소득세(15.4%) 및 12개월 캘린더, 2026 스트레스 DSR 2단계 적용 주담대 한도, 법정 퇴직금 세후 실수령액 및 실업급여 무료 시뮬레이터]]></description>
      <category><![CDATA[스마트 금융도구]]></category>
      <author><![CDATA[VERA 금융팀]]></author>
      <pubDate>${new Date().toUTCString()}</pubDate>
    </item>`);

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>VERA (베라) - 실시간 라이프 포털 & 지식 가이드</title>
    <link>https://veranex.app</link>
    <description>실시간 뉴스, 금융 시뮬레이터, 전통문화, 창작 작법, 생활 계산기 및 게임 전략 전문 콘텐츠를 제공하는 믿음의 포털</description>
    <language>ko-KR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://veranex.app/rss.xml" rel="self" type="application/rss+xml"/>
    ${items.join('\n')}
  </channel>
</rss>`;

    // Write to public/ and dist/ if exists
    fs.writeFileSync(path.resolve(publicDir, 'rss.xml'), rssXml, 'utf8');
    if (fs.existsSync(distDir)) {
        fs.writeFileSync(path.resolve(distDir, 'rss.xml'), rssXml, 'utf8');
    }
    console.log('✅ RSS 2.0 Feed generated at public/rss.xml & dist/rss.xml');
}

// CLI 직접 실행 지원
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    generateRssFeed().catch(console.error);
}
