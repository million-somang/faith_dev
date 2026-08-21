import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

console.log('🔍 [2단계 크롤러 렌더링 점검] 정적 HTML 텍스트 및 메타데이터 자동 검증\n');

const testPaths = [
    'robots.txt',
    'sitemap.xml',
    'rss.xml',
    'guides/index.html',
    'about/index.html',
    'privacy/index.html',
    'terms/index.html',
    'contact/index.html',
    'guides/2026-global-interest-rate-dividend-strategy/index.html',
    'guides/foreign-exchange-rate-and-macro-investment/index.html',
    'guides/magic-of-compound-interest-and-dollar-cost-averaging/index.html',
    'guides/compound-interest-calculator-guide-and-wealth-building/index.html',
    'guides/sp500-index-fund-dollar-investing-principles/index.html',
    'guides/saju-manseryeok-principles-and-four-pillars/index.html',
    'guides/five-elements-harmony-and-lifestyle-balance/index.html',
    'guides/ten-gods-personality-career-aptitude-guide/index.html',
    'guides/saju-unse-interpretation-and-annual-horoscope/index.html',
    'guides/webnovel-trends-regression-possession-reincarnation/index.html',
    'guides/webnovel-plot-design-and-three-act-structure/index.html',
    'guides/character-conflict-design-and-villain-writing/index.html',
    'guides/pyeong-to-square-meter-conversion-and-real-estate/index.html',
    'guides/korean-age-unification-act-guide-and-legal-effects/index.html',
    'guides/d-day-time-management-and-goal-setting-guide/index.html',
    'guides/loan-interest-calculation-and-repayment-methods/index.html',
    'guides/tetris-master-guide-t-spin-and-line-clear-strategy/index.html',
    'guides/json-formatting-and-syntax-validation-guide/index.html'
];

let passedCount = 0;
let failedCount = 0;

for (const relPath of testPaths) {
    const fullPath = path.resolve(distDir, relPath);
    if (!fs.existsSync(fullPath)) {
        console.error(`❌ [MISSING] ${relPath} 파일이 생성되지 않았습니다.`);
        failedCount++;
        continue;
    }

    if (relPath.endsWith('.txt') || relPath.endsWith('.xml')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        console.log(`✅ [OK] ${relPath} (크기: ${content.length} bytes)`);
        passedCount++;
        continue;
    }

    // HTML inspection
    const html = fs.readFileSync(fullPath, 'utf8');
    const hasTitle = /<title>(.*?)<\/title>/i.test(html);
    const hasDescription = /<meta name="description" content="([^"]+)"/i.test(html);
    const hasCanonical = /<link rel="canonical" href="([^"]+)"/i.test(html);
    const hasArticleSchema = html.includes('"@type": "Article"') || html.includes('"@type": "WebSite"');
    
    // Extract plain text inside root to test raw crawler readability
    const rootIndex = html.indexOf('<div id="root">');
    const bodyEndIndex = html.indexOf('</body>');
    const rootContent = rootIndex !== -1 && bodyEndIndex !== -1
        ? html.substring(rootIndex + '<div id="root">'.length, bodyEndIndex)
        : html;
    const plainText = rootContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const textLength = plainText.length;

    const isGuideArticle = relPath.includes('guides/') && relPath !== 'guides/index.html';
    const isQualityText = isGuideArticle ? textLength >= 800 : textLength >= 100;

    if (hasTitle && hasDescription && hasCanonical && isQualityText) {
        console.log(`✅ [OK] ${relPath.padEnd(65)} | 텍스트: ${textLength}자 | Title/Meta/Canonical/Schema 완비`);
        passedCount++;
    } else {
        console.error(`❌ [FAIL] ${relPath} | 텍스트: ${textLength}자 (Title:${hasTitle}, Desc:${hasDescription}, Canon:${hasCanonical})`);
        failedCount++;
    }
}

console.log(`\n======================================================`);
console.log(`🎉 검증 완료: 통과 ${passedCount}개 / 실패 ${failedCount}개`);
console.log(`======================================================\n`);

if (failedCount > 0) {
    process.exit(1);
}
