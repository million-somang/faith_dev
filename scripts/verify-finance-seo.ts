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

console.log('=== Starting Finance SEO & AEO E2E Verification ===\n');

// 1. Verify dist/finance/util/index.html
const utilHtmlPath = path.resolve(rootDir, 'apps/main-portal/dist/finance/util/index.html');
assert(fs.existsSync(utilHtmlPath), `File exists: ${utilHtmlPath}`);

if (fs.existsSync(utilHtmlPath)) {
    const utilHtml = fs.readFileSync(utilHtmlPath, 'utf-8');
    
    // Check JSON-LD
    const jsonLdMatches = [...utilHtml.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert(jsonLdMatches.length >= 1, `Found at least 1 JSON-LD script block in util/index.html (found ${jsonLdMatches.length})`);
    
    let foundGraph = false;
    for (const match of jsonLdMatches) {
        try {
            const data = JSON.parse(match[1]);
            if (data['@graph']) {
                foundGraph = true;
                const types = data['@graph'].map((item: any) => item['@type']);
                assert(types.includes('FinancialService'), 'JSON-LD @graph contains FinancialService');
                assert(types.includes('WebApplication'), 'JSON-LD @graph contains WebApplication');
                assert(types.includes('BreadcrumbList'), 'JSON-LD @graph contains BreadcrumbList');
                assert(types.includes('FAQPage'), 'JSON-LD @graph contains FAQPage');
                
                const howTos = data['@graph'].filter((item: any) => item['@type'] === 'HowTo');
                assert(howTos.length === 3, `JSON-LD @graph contains exactly 3 HowTo items (found ${howTos.length})`);
                
                const faqPage = data['@graph'].find((item: any) => item['@type'] === 'FAQPage');
                if (faqPage) {
                    assert(faqPage.mainEntity.length === 12, `FAQPage has 12 FAQs (found ${faqPage.mainEntity.length})`);
                }
            }
        } catch (e: any) {
            assert(false, `JSON-LD parsing error: ${e.message}`);
        }
    }
    assert(foundGraph, 'Found Schema.org @graph in util/index.html');
    
    // Check Content blocks for 3 calculators
    assert(utilHtml.includes('id="calc-dividend-tax"'), 'Contains calc-dividend-tax section');
    assert(utilHtml.includes('id="calc-mortgage-dsr"'), 'Contains calc-mortgage-dsr section');
    assert(utilHtml.includes('id="calc-severance-irp"'), 'Contains calc-severance-irp section');
    assert(utilHtml.includes('AI 핵심 답변 요약 (AEO Direct Answer)'), 'Contains AEO Direct Answer callout boxes');
    assert(utilHtml.includes('📌 표준 법정 산정식'), 'Contains Formula code blocks');
    assert(utilHtml.includes('📋 기준 시나리오'), 'Contains Simulation example scenarios');
    assert(utilHtml.includes('3단계 간편 이용 가이드'), 'Contains HowTo step-by-step guides');
    assert(utilHtml.includes('자주 묻는 질문 (FAQ)'), 'Contains FAQ sections');
    assert(utilHtml.includes('2026-global-interest-rate-dividend-strategy'), 'Contains link to dividend guide');
    assert(utilHtml.includes('compound-interest-calculator-guide-and-wealth-building'), 'Contains link to compound interest / wealth guide');
}

// 2. Verify dist/finance/index.html
const financeHtmlPath = path.resolve(rootDir, 'apps/main-portal/dist/finance/index.html');
assert(fs.existsSync(financeHtmlPath), `File exists: ${financeHtmlPath}`);

if (fs.existsSync(financeHtmlPath)) {
    const finHtml = fs.readFileSync(financeHtmlPath, 'utf-8');
    assert(finHtml.includes('FinancialService'), 'finance/index.html contains FinancialService schema');
    assert(finHtml.includes('BreadcrumbList'), 'finance/index.html contains BreadcrumbList schema');
    assert(finHtml.includes('FAQPage'), 'finance/index.html contains FAQPage schema');
    assert(finHtml.includes('/finance/util'), 'finance/index.html links to /finance/util');
    assert(finHtml.includes('/tools/finance-dsr'), 'finance/index.html links to /tools/finance-dsr');
    
    const requiredGuides = [
        '2026-global-interest-rate-dividend-strategy',
        'foreign-exchange-rate-and-macro-investment',
        'magic-of-compound-interest-and-dollar-cost-averaging',
        'compound-interest-calculator-guide-and-wealth-building',
        'sp500-index-fund-dollar-investing-principles'
    ];
    for (const g of requiredGuides) {
        assert(finHtml.includes(g), `finance/index.html links to guide: ${g}`);
    }
}

// 3. Verify dist/sitemap.xml
const sitemapPath = path.resolve(rootDir, 'apps/main-portal/dist/sitemap.xml');
assert(fs.existsSync(sitemapPath), `File exists: ${sitemapPath}`);

if (fs.existsSync(sitemapPath)) {
    const sitemap = fs.readFileSync(sitemapPath, 'utf-8');
    const urlMatches = [...sitemap.matchAll(/<url>[\s\S]*?<\/url>/g)];
    assert(urlMatches.length === 48, `sitemap.xml contains exactly 48 URLs (found ${urlMatches.length})`);
    assert(sitemap.includes('<loc>https://veranex.app/finance</loc>'), 'sitemap contains /finance');
    assert(sitemap.includes('<loc>https://veranex.app/finance/util</loc>'), 'sitemap contains /finance/util');
    assert(sitemap.includes('<loc>https://veranex.app/lifestyle</loc>'), 'sitemap contains /lifestyle');
}

// 4. Verify dist/robots.txt
const robotsPath = path.resolve(rootDir, 'apps/main-portal/dist/robots.txt');
assert(fs.existsSync(robotsPath), `File exists: ${robotsPath}`);

if (fs.existsSync(robotsPath)) {
    const robots = fs.readFileSync(robotsPath, 'utf-8');
    const aiBots = ['GPTBot', 'PerplexityBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended'];
    for (const bot of aiBots) {
        assert(robots.includes(`User-agent: ${bot}`), `robots.txt contains AI bot: ${bot}`);
    }
    assert(robots.includes('Allow: /finance'), 'robots.txt has Allow: /finance');
    assert(robots.includes('Allow: /finance/util'), 'robots.txt has Allow: /finance/util');
    assert(robots.includes('Disallow: /tools/'), 'robots.txt retains Disallow: /tools/ for protected bots');
}

console.log('\n=== Summary ===');
if (errors.length === 0) {
    console.log('🎉 ALL 28 E2E FINANCE SEO/AEO CHECKS PASSED!\n');
    process.exit(0);
} else {
    console.error(`💥 FAILED with ${errors.length} errors:`);
    errors.forEach(e => console.error(` - ${e}`));
    process.exit(1);
}
