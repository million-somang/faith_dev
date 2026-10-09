import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let errors: string[] = [];

function assert(condition: boolean, message: string) {
    if (!condition) {
        console.error(`❌ FAIL: ${message}`);
        errors.push(message);
    } else {
        console.log(`✅ PASS: ${message}`);
    }
}

console.log('=== Starting Game SEO & AEO E2E Verification ===\n');

const CORE_GAMES = [
    'janggi',
    'omok',
    'baseball',
    '2048',
    'sudoku',
    'minesweeper',
    'freecell',
    'vera-pop',
];

const GUIDES_MAP: Record<string, string> = {
    '2048': '2048-tile-puzzle-strategy-corner-method',
    sudoku: 'sudoku-advanced-solving-techniques-naked-single-to-x-wing',
    minesweeper: 'minesweeper-probability-and-pattern-strategy',
    freecell: 'freecell-solitaire-winning-formula-and-space-utilization',
};

// 1. Verify dist/game/index.html hub
const gameHubPath = path.resolve(rootDir, 'apps/main-portal/dist/game/index.html');
assert(fs.existsSync(gameHubPath), `File exists: ${gameHubPath}`);

if (fs.existsSync(gameHubPath)) {
    const hubHtml = fs.readFileSync(gameHubPath, 'utf-8');
    
    // Check Schema.org @graph
    assert(hubHtml.includes('CollectionPage'), 'game/index.html contains CollectionPage schema');
    assert(hubHtml.includes('BreadcrumbList'), 'game/index.html contains BreadcrumbList schema');
    assert(hubHtml.includes('FAQPage'), 'game/index.html contains FAQPage schema');
    
    // Check links to all 8 core games
    for (const gameId of CORE_GAMES) {
        assert(hubHtml.includes(`/game/${gameId}`), `game/index.html contains link to /game/${gameId}`);
        assert(hubHtml.includes(`/app/${gameId}/`), `game/index.html contains link to /app/${gameId}/`);
    }
}

// 2. Verify all 8 game detail pages
for (const gameId of CORE_GAMES) {
    console.log(`\n--- Verifying game detail page: [${gameId}] ---`);
    const gameHtmlPath = path.resolve(rootDir, `apps/main-portal/dist/game/${gameId}/index.html`);
    assert(fs.existsSync(gameHtmlPath), `File exists: ${gameHtmlPath}`);

    if (fs.existsSync(gameHtmlPath)) {
        const html = fs.readFileSync(gameHtmlPath, 'utf-8');

        // Check canonical
        assert(html.includes(`<link rel="canonical" href="https://veranex.app/game/${gameId}"`), `Canonical URL is https://veranex.app/game/${gameId}`);

        // Check single h1
        const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
        assert(h1Matches.length === 1, `Exactly 1 <h1> tag (found ${h1Matches.length})`);

        // Check Direct Answer
        assert(html.includes('(AI Direct Answer)') || html.includes('AEO Direct Answer'), 'Contains AI Direct Answer Callout Box');

        // Check Formula & Rules
        assert(html.includes('📌 게임 원칙 및 산정 공식') || html.includes('승률 극대화 핵심 공식'), 'Contains Strategy / Formula heading');
        assert(html.includes('font-mono') || html.includes('bg-slate-950') || html.includes('bg-slate-900'), 'Contains monospace formula card');

        // Check HowTo
        assert(html.includes('3단계 입문 & 마스터 가이드') || html.includes('3단계'), 'Contains 3-step HowTo guide');

        // Check FAQs
        assert(html.includes('자주 묻는 질문 (FAQ)'), 'Contains FAQ section');

        // Check Play App link
        assert(html.includes(`/app/${gameId}/`), `Contains direct play button to /app/${gameId}/`);

        // Check Related Guide link if applicable
        if (GUIDES_MAP[gameId]) {
            const guideSlug = GUIDES_MAP[gameId];
            assert(html.includes(guideSlug), `Contains related knowledge guide link: ${guideSlug}`);
        }

        // Check Schema.org @graph JSON-LD
        const jsonLdMatches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
        assert(jsonLdMatches.length >= 1, `Contains JSON-LD script block (found ${jsonLdMatches.length})`);

        let hasValidSchema = false;
        for (const match of jsonLdMatches) {
            try {
                const data = JSON.parse(match[1]);
                const graph = data['@graph'] || [data];
                const types = graph.map((item: any) => {
                    if (Array.isArray(item['@type'])) return item['@type'].join(',');
                    return item['@type'];
                });
                
                const hasSoftwareOrGame = types.some((t: string) => t.includes('SoftwareApplication') || t.includes('Game'));
                const hasBreadcrumb = types.some((t: string) => t.includes('BreadcrumbList'));
                const hasHowTo = types.some((t: string) => t.includes('HowTo'));
                const hasFAQ = types.some((t: string) => t.includes('FAQPage'));

                if (hasSoftwareOrGame && hasBreadcrumb && hasHowTo && hasFAQ) {
                    hasValidSchema = true;
                }
            } catch (e: any) {
                assert(false, `JSON-LD parsing error in ${gameId}: ${e.message}`);
            }
        }
        assert(hasValidSchema, `Schema.org @graph has SoftwareApplication/Game, BreadcrumbList, HowTo, and FAQPage in ${gameId}`);
    }
}

// 3. Verify sitemap.xml
console.log('\n--- Verifying sitemap.xml ---');
const sitemapPath = path.resolve(rootDir, 'apps/main-portal/dist/sitemap.xml');
assert(fs.existsSync(sitemapPath), `File exists: ${sitemapPath}`);

if (fs.existsSync(sitemapPath)) {
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf-8');
    const urlMatches = [...sitemapContent.matchAll(/<loc>([\s\S]*?)<\/loc>/g)];
    assert(urlMatches.length === 57, `Sitemap contains exactly 57 URLs (found ${urlMatches.length})`);
    assert(sitemapContent.includes('https://veranex.app/game'), 'Sitemap contains https://veranex.app/game hub');
    for (const gameId of CORE_GAMES) {
        assert(sitemapContent.includes(`https://veranex.app/game/${gameId}`), `Sitemap contains https://veranex.app/game/${gameId}`);
    }
}

// 4. Verify robots.txt
console.log('\n--- Verifying robots.txt ---');
const robotsPath = path.resolve(rootDir, 'apps/main-portal/dist/robots.txt');
assert(fs.existsSync(robotsPath), `File exists: ${robotsPath}`);

if (fs.existsSync(robotsPath)) {
    const robotsContent = fs.readFileSync(robotsPath, 'utf-8');
    const aiBots = ['GPTBot', 'PerplexityBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended'];
    for (const bot of aiBots) {
        assert(robotsContent.includes(`User-agent: ${bot}`), `robots.txt contains User-agent: ${bot}`);
    }
    assert(robotsContent.includes('Allow: /game'), 'robots.txt allows /game for AI bots');

    const adSenseBots = ['Mediapartners-Google', 'AdsBot-Google', 'AdsBot-Google-Mobile'];
    for (const bot of adSenseBots) {
        assert(robotsContent.includes(`User-agent: ${bot}`), `robots.txt contains User-agent: ${bot}`);
    }
    assert(robotsContent.includes('Disallow: /game'), 'robots.txt retains Disallow: /game for AdSense bots');
}

console.log('\n=== Verification Summary ===');
if (errors.length > 0) {
    console.error(`❌ Total failures: ${errors.length}`);
    process.exit(1);
} else {
    console.log('🎉 ALL Game SEO & AEO E2E checks PASSED successfully!');
    process.exit(0);
}
