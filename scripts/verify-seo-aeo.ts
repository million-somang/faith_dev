import fs from 'fs';
import path from 'path';

const tools = [
    'severance-calc',
    'age-calc',
    'pyeong-calc',
    'interest-calc',
    'dday-calc',
    'customs-calc',
    'text-checker',
    'calculator',
    'json-formatter',
    'ocr',
    'base64-converter',
    'svg-converter',
    'finance-dsr'
];

console.log('--- [1] Checking 13 Tool Landing Pages SSG Output ---');
for (const slug of tools) {
    const filePath = path.resolve(`apps/main-portal/dist/tools/${slug}/index.html`);
    if (!fs.existsSync(filePath)) {
        throw new Error(`[FAIL] Missing dist/tools/${slug}/index.html`);
    }
    const html = fs.readFileSync(filePath, 'utf-8');
    if (!html.includes('application/ld+json')) {
        throw new Error(`[FAIL] Missing JSON-LD in ${slug}`);
    }
    if (!html.includes('FAQPage') || !html.includes('WebApplication') || !html.includes('HowTo') || !html.includes('BreadcrumbList')) {
        throw new Error(`[FAIL] Missing required AEO schemas in ${slug}`);
    }
    if (!html.includes('공식') || !html.includes('사례') || !html.includes('자주 묻는 질문')) {
        throw new Error(`[FAIL] Missing formula, example, or FAQ text in ${slug}`);
    }
    console.log(`  ✓ ${slug}: Complete with 4 JSON-LD schemas and rich text.`);
}

console.log('--- [2] Checking Lifestyle Hub SSG Output ---');
const lifestylePath = path.resolve('apps/main-portal/dist/lifestyle/index.html');
if (!fs.existsSync(lifestylePath)) {
    throw new Error('[FAIL] Missing dist/lifestyle/index.html');
}
const lifestyleHtml = fs.readFileSync(lifestylePath, 'utf-8');
if (!lifestyleHtml.includes('/tools/severance-calc') || !lifestyleHtml.includes('FAQPage')) {
    throw new Error('[FAIL] lifestyle/index.html does not contain tool links or FAQPage schema');
}
console.log('  ✓ lifestyle/index.html: Linked to tools and contains FAQPage schema.');

console.log('--- [3] Checking sitemap.xml & robots.txt ---');
const sitemap = fs.readFileSync(path.resolve('apps/main-portal/dist/sitemap.xml'), 'utf-8');
const locCount = (sitemap.match(/<loc>/g) || []).length;
if (locCount !== 47) {
    throw new Error(`[FAIL] Expected 47 URLs in sitemap, got ${locCount}`);
}
console.log(`  ✓ sitemap.xml contains exactly 47 URLs.`);

const robots = fs.readFileSync(path.resolve('apps/main-portal/dist/robots.txt'), 'utf-8');
const expectedBots = ['GPTBot', 'PerplexityBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended'];
for (const b of expectedBots) {
    if (!robots.includes(`User-agent: ${b}`)) {
        throw new Error(`[FAIL] Missing AI bot block for ${b}`);
    }
}
if (!robots.includes('Mediapartners-Google') || !robots.includes('Disallow: /tools/')) {
    throw new Error('[FAIL] AdSense isolation rule is missing');
}
console.log('  ✓ robots.txt contains all AI bot Allow rules and AdSense Disallow rules.');

console.log('=============================================');
console.log('🎉 ALL SEO & AEO VERIFICATIONS PASSED 100%!');
console.log('=============================================');
