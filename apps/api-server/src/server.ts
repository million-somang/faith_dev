import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { pool } from '@faithportal/database';
import { errorHandler } from './middleware/errors.js';
import { optionalAuth } from './middleware/auth.js';
import dotenv from 'dotenv';

dotenv.config();

const app = new Hono();

// Explicit CORS
app.use('*', cors({
    origin: (origin) => origin || '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
    maxAge: 600,
    credentials: true,
}));

app.use('*', errorHandler);

// Base route skipped in favor of static SPA

// Consistent health check
app.get('/health', async (c) => {
    return c.json({ status: 'ok', db: 'connected' });
});

app.get('/api/health', async (c) => {
    return c.json({ status: 'ok' });
});

// News API
import newsRoutes from './routes/news.routes.js';
app.route('/', newsRoutes);

import mypageRoutes from './routes/mypage.routes.js';
app.route('/api/user', mypageRoutes);

import authRoutes from './routes/auth.routes.js';
app.route('/', authRoutes);

import { adminRoutes } from './routes/admin.routes.js';
app.route('/', adminRoutes);

import { adminUi } from './routes/admin-ui.js';
app.route('/', adminUi);

import { adminStatsUi } from './routes/admin-stats-ui.js';
app.route('/', adminStatsUi);

import { bannerRoutes } from './routes/banner.routes.js';
app.route('/', bannerRoutes);

import { bannerAdminUi } from './routes/banner-admin-ui.js';
app.route('/', bannerAdminUi);

// 배너 업로드 이미지 정적 서빙
app.use('/uploads/*', serveStatic({ root: './public' }));

import { miniappRoutes } from './routes/miniapp.routes.js';
app.route('/', miniappRoutes);

import { tetrisRoutes } from './routes/tetris.routes.js';
app.route('/', tetrisRoutes);

import { comboyRoutes } from './routes/comboy.routes.js';
app.route('/', comboyRoutes);

import { sfcRoutes } from './routes/sfc.routes.js';
app.route('/', sfcRoutes);

import { gameRoutes } from './routes/game.routes.js';
app.route('/', gameRoutes);

import { ddayRoutes } from './routes/dday.routes.js';
app.route('/', ddayRoutes);

import { analyticsRoutes } from './routes/analytics.routes.js';
app.route('/', analyticsRoutes);

import novelRoutes from './routes/novel.routes.js';
app.route('/api/novel', novelRoutes);

import { financeRoutes } from './routes/finance.routes.js';
app.route('/', financeRoutes);

import { geoRoutes } from './routes/geo.routes.js';
app.route('/', geoRoutes);

const miniApps = [
    'calculator', 'text-checker', 'tetris', 'sudoku', 'pyeong-calc',
    '2048', 'minesweeper', 'freecell', 'age-calc', 'dday-calc', 'json-formatter',
    'base64-converter', 'svg-converter', 'news', 'comboy', 'sfc', 'saju'
];

miniApps.forEach(appName => {
    const basePath = `/app/${appName}`;
    const distPath = `./apps/app-${appName}/dist`;
    
    app.use(`${basePath}/*`, serveStatic({ 
        root: distPath,
        rewriteRequestPath: (path) => path.replace(new RegExp(`^${basePath}`), '')
    }));
    app.get(basePath, serveStatic({ path: `${distPath}/index.html` }));
});

// Finance app 정적 파일 서빙
app.use('/finance/*', serveStatic({
    root: './apps/finance/dist',
    rewriteRequestPath: (path) => path.replace(/^\/finance/, '')
}));
app.get('/finance', serveStatic({ path: './apps/finance/dist/index.html' }));

// ==================== SEO 라우트 ====================

const SITE_URL = process.env.SITE_URL || 'https://veranex.app';

// robots.txt (네이버 Yeti 및 구글봇 검색 크롤링 지원)
app.get('/robots.txt', (c) => {
    const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /app/
Disallow: /mypage
Disallow: /login
Disallow: /signup

User-agent: Yeti
Allow: /
Allow: /sitemap.xml
Allow: /rss.xml

Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/rss.xml
`;
    return c.text(robotsTxt, 200, { 'Content-Type': 'text/plain; charset=utf-8' });
});

// ads.txt
app.get('/ads.txt', (c) => {
    try {
        const adsTxtPath = path.resolve('./public/ads.txt');
        if (fs.existsSync(adsTxtPath)) {
            const content = fs.readFileSync(adsTxtPath, 'utf-8');
            return c.text(content, 200, { 'Content-Type': 'text/plain; charset=utf-8' });
        }
    } catch (e) {
        console.error('Error reading ads.txt:', e);
    }
    return c.text('google.com, pub-9041638273592776, DIRECT, f08c47fec0942fa0\n', 200, { 'Content-Type': 'text/plain; charset=utf-8' });
});

// RSS 2.0 피드 생성 (네이버 서치어드바이저 수집 전용)
app.get('/rss.xml', async (c) => {
    let newsItems: any[] = [];
    try {
        const newsResult = await pool.query(
            "SELECT id, title, content, source, created_at FROM news ORDER BY created_at DESC LIMIT 50"
        );
        newsItems = newsResult.rows;
    } catch (e) {
        console.warn('[SEO] News query for RSS failed:', e);
    }

    const itemsXml = newsItems.map(item => {
        const title = (item.title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const desc = (item.content || '').replace(/<[^>]*>/g, '').substring(0, 300).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const pubDate = new Date(item.created_at || Date.now()).toUTCString();
        const link = `${SITE_URL}/news/${item.id}`;
        return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <description>${desc}</description>
      <pubDate>${pubDate}</pubDate>
      <guid>${link}</guid>
    </item>`;
    }).join('\n');

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>VERA (베라) - 대한민국 라이프 포털</title>
    <link>${SITE_URL}</link>
    <description>실시간 뉴스, 미니게임, 생활도구 통합 라이프 포털 피드</description>
    <language>ko-KR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${itemsXml}
  </channel>
</rss>`;

    return c.text(rssXml, 200, { 'Content-Type': 'application/xml; charset=utf-8' });
});

// sitemap.xml (동적 생성 — 뉴스 URL 포함)
app.get('/sitemap.xml', async (c) => {
    const staticPages = [
        { loc: '/', priority: '1.0', changefreq: 'daily' },
        { loc: '/news', priority: '0.9', changefreq: 'hourly' },
        { loc: '/game', priority: '0.8', changefreq: 'weekly' },
        { loc: '/lifestyle', priority: '0.8', changefreq: 'weekly' },
        { loc: '/finance', priority: '0.8', changefreq: 'daily' },
        { loc: '/lounge', priority: '0.7', changefreq: 'daily' },
        { loc: '/entertainment', priority: '0.7', changefreq: 'weekly' },
        { loc: '/game/tetris', priority: '0.6', changefreq: 'monthly' },
        { loc: '/game/sudoku', priority: '0.6', changefreq: 'monthly' },
        { loc: '/game/2048', priority: '0.6', changefreq: 'monthly' },
        { loc: '/game/minesweeper', priority: '0.6', changefreq: 'monthly' },
        { loc: '/game/freecell', priority: '0.6', changefreq: 'monthly' },
        { loc: '/privacy', priority: '0.5', changefreq: 'monthly' },
        { loc: '/terms', priority: '0.5', changefreq: 'monthly' },
        { loc: '/about', priority: '0.5', changefreq: 'monthly' },
        { loc: '/contact', priority: '0.5', changefreq: 'monthly' },
    ];

    // DB에서 최근 뉴스 150개 가져오기
    let newsUrls: { loc: string; lastmod: string }[] = [];
    try {
        const newsResult = await pool.query(
            "SELECT id, created_at FROM news ORDER BY created_at DESC LIMIT 150"
        );
        newsUrls = newsResult.rows.map((n: any) => ({
            loc: `/news/${n.id}`,
            lastmod: new Date(n.created_at).toISOString().split('T')[0],
        }));
    } catch (e) {
        console.warn('[SEO] News query for sitemap failed:', e);
    }

    const urls = [
        ...staticPages.map(p => `  <url>
    <loc>${SITE_URL}${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
        ...newsUrls.map(n => `  <url>
    <loc>${SITE_URL}${n.loc}</loc>
    <lastmod>${n.lastmod}</lastmod>
    <changefreq>never</changefreq>
    <priority>0.7</priority>
  </url>`),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    return c.text(xml, 200, { 'Content-Type': 'application/xml; charset=utf-8' });
});

// 뉴스 상세 페이지: 서버사이드 메타 태그 주입 (SSR 없이 OG 태그 제공)
import fs from 'fs';
import path from 'path';

app.get('/news/:id', async (c) => {
    const newsId = c.req.param('id');
    
    // API 요청이면 넘기기
    if (newsId === 'api' || newsId === 'rss') return c.notFound();

    try {
        const indexPath = path.resolve('./apps/main-portal/dist/index.html');
        let html = fs.readFileSync(indexPath, 'utf-8');

        // DB에서 뉴스 데이터 가져오기
        const newsResult = await pool.query(
            "SELECT title, content, source, created_at FROM news WHERE id = $1",
            [newsId]
        );

        if (newsResult.rows.length > 0) {
            const news = newsResult.rows[0] as any;
            const title = `${news.title} - VERA 뉴스`;
            const description = (news.content || '').replace(/<[^>]*>/g, '').substring(0, 160);
            const url = `${SITE_URL}/news/${newsId}`;

            // JSON-LD 구조화 데이터
            const jsonLd = JSON.stringify({
                "@context": "https://schema.org",
                "@type": "NewsArticle",
                "headline": news.title,
                "description": description,
                "url": url,
                "datePublished": news.created_at,
                "publisher": {
                    "@type": "Organization",
                    "name": "VERA"
                }
            });

            const metaTags = `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="VERA" />
    <meta property="og:image" content="${SITE_URL}/logo-512.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${SITE_URL}/logo-512.png" />
    <link rel="canonical" href="${url}" />
    <script type="application/ld+json">${jsonLd}</script>`;

            // <title>VERA</title> 을 동적 메타로 교체
            html = html.replace('<title>VERA - 실시간 뉴스, 미니게임, 생활도구 포털</title>', metaTags);
            html = html.replace('<title>VERA</title>', metaTags);

            // 크롤러(Googlebot/Yeti) 소스보기(Ctrl+U) 시 텍스트 밀도 확보를 위한 noscript 본문 인젝션
            const staticHtmlBody = `
            <noscript>
                <article style="padding: 20px; font-family: sans-serif;">
                    <h1>${esc(news.title)}</h1>
                    <p style="color: #666; font-size: 0.9em;">출처: ${esc(news.source || 'VERA 뉴스')} | 작성일: ${new Date(news.created_at).toLocaleDateString('ko-KR')}</p>
                    <div style="font-size: 1.1em; line-height: 1.6; margin-top: 15px;">
                        ${news.content || description}
                    </div>
                </article>
            </noscript>`;
            html = html.replace('<div id="root"></div>', `<div id="root"></div>${staticHtmlBody}`);
        }

        return c.html(html);
    } catch (e) {
        console.error('[SEO] News meta injection error:', e);
        // 실패 시 일반 SPA로 폴백
        const indexPath = path.resolve('./apps/main-portal/dist/index.html');
        const html = fs.readFileSync(indexPath, 'utf-8');
        return c.html(html);
    }
});

// ==================== SPA 라우트별 메타 주입 (네이버/구글 SEO) ====================
// main-portal은 클라이언트 렌더링 SPA라 서버가 빈 셸을 내려준다.
// 네이버 Yeti 크롤러는 JS 실행이 약하므로, 주요 경로는 서버에서 메타를 주입해 본문 신호를 제공한다.
const OG_IMAGE = `${SITE_URL}/logo-512.png`;

const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function buildMetaBlock(opts: { title: string; description: string; path: string; type?: string; jsonLd?: object }) {
    const { title, description, path: routePath, type = 'website', jsonLd } = opts;
    const url = `${SITE_URL}${routePath}`;
    return `
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:site_name" content="VERA" />
    <meta property="og:locale" content="ko_KR" />
    <meta property="og:image" content="${OG_IMAGE}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${OG_IMAGE}" />${jsonLd ? `\n    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}`;
}

// 정적 index.html의 기본(홈) 메타를 라우트별 메타로 치환하여 중복을 방지한다.
function renderSpaWithMeta(metaBlock: string): string {
    const indexPath = path.resolve('./apps/main-portal/dist/index.html');
    let html = fs.readFileSync(indexPath, 'utf-8');
    html = html
        .replace(/\s*<title>[\s\S]*?<\/title>/, '')
        .replace(/\s*<meta name="description"[^>]*>/, '')
        .replace(/\s*<link rel="canonical"[^>]*>/, '')
        .replace(/\s*<meta property="og:title"[^>]*>/, '')
        .replace(/\s*<meta property="og:description"[^>]*>/, '')
        .replace(/\s*<meta property="og:url"[^>]*>/, '')
        .replace(/\s*<meta property="og:image"[^>]*>/, '')
        .replace(/\s*<meta name="twitter:card"[^>]*>/, '')
        .replace(/\s*<meta name="twitter:title"[^>]*>/, '')
        .replace(/\s*<meta name="twitter:description"[^>]*>/, '')
        .replace(/\s*<meta name="twitter:image"[^>]*>/, '')
        .replace('</head>', `${metaBlock}\n</head>`);
    return html;
}

const ROUTE_META: Record<string, { title: string; description: string; jsonLd?: object }> = {
    '/': {
        title: 'VERA - 실시간 뉴스, 미니게임, 생활도구 포털',
        description: 'VERA에서 실시간 속보 뉴스와 테트리스·스도쿠·2048 미니게임, 계산기·맞춤법 검사 등 생활도구를 한 곳에서 무료로 이용하세요.',
        jsonLd: { '@context': 'https://schema.org', '@type': 'Organization', name: 'VERA', url: SITE_URL, logo: OG_IMAGE },
    },
    '/news': {
        title: '실시간 뉴스 - VERA',
        description: '정치·경제·IT·스포츠·연예 등 분야별 최신 속보를 실시간으로 모아 보는 VERA 뉴스. 주요 언론사 기사를 한눈에 확인하세요.',
        jsonLd: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: '실시간 뉴스', url: `${SITE_URL}/news`, inLanguage: 'ko' },
    },
    '/lifestyle': {
        title: '생활도구 - 계산기·단위 변환·맞춤법 검사 | VERA',
        description: '계산기, 만 나이·디데이 계산기, 평수 변환, 맞춤법 검사기, JSON 포맷터, Base64 변환기 등 자주 쓰는 무료 온라인 도구 모음.',
    },
    '/game': {
        title: '무료 미니게임 - 테트리스·스도쿠·2048·지뢰찾기 | VERA',
        description: '설치 없이 브라우저에서 바로 즐기는 무료 미니게임. 테트리스, 스도쿠, 2048, 지뢰찾기를 플레이하고 랭킹에 도전하세요.',
    },
    '/privacy': {
        title: '개인정보처리방침 - VERA',
        description: 'VERA 포털의 개인정보처리방침 및 쿠키, Google AdSense 맞춤형 광고 수집 안내입니다.',
    },
    '/terms': {
        title: '서비스 이용약관 - VERA',
        description: 'VERA 라이프 포털 서비스 이용 조건 및 회원과 회사의 권리와 의무에 관한 약관입니다.',
    },
    '/about': {
        title: '서비스 소개 - VERA',
        description: 'VERA는 실시간 뉴스, 스마트 생활 도구, 클린 미니게임, 금융 시세를 한곳에서 편리하게 이용하는 라이프 포털입니다.',
    },
    '/contact': {
        title: '문의하기 - VERA',
        description: 'VERA 서비스 이용 문의, 제휴 제안, 오류 제보 및 고객 지원 센터입니다.',
    },
};

const GAME_META: Record<string, { title: string; description: string }> = {
    tetris: { title: '테트리스 무료 온라인 게임 - VERA', description: '브라우저에서 바로 즐기는 무료 테트리스. 설치·회원가입 없이 플레이하고 최고 점수 랭킹에 도전하세요.' },
    sudoku: { title: '스도쿠 무료 온라인 게임 - VERA', description: '난이도별 스도쿠를 무료로. 브라우저에서 바로 플레이하고 기록을 남겨보세요.' },
    '2048': { title: '2048 무료 온라인 게임 - VERA', description: '중독성 있는 숫자 퍼즐 2048을 무료로. 브라우저에서 바로 플레이하고 랭킹에 도전하세요.' },
    minesweeper: { title: '지뢰찾기 무료 온라인 게임 - VERA', description: '클래식 지뢰찾기를 무료로. 브라우저에서 바로 즐기고 기록에 도전하세요.' },
    freecell: { title: '클래식 프리셀 무료 온라인 게임 - VERA', description: '클래식 프리셀 카드 솔리테어를 무료로. 99.9% 이상 클리어 가능한 퍼즐 수싸움에 도전하세요.' },
};

for (const [routePath, meta] of Object.entries(ROUTE_META)) {
    app.get(routePath, (c) => {
        try {
            return c.html(renderSpaWithMeta(buildMetaBlock({ ...meta, path: routePath })));
        } catch (e) {
            console.error('[SEO] meta injection error:', routePath, e);
            return c.html(fs.readFileSync(path.resolve('./apps/main-portal/dist/index.html'), 'utf-8'));
        }
    });
}

app.get('/game/:id', (c) => {
    const id = c.req.param('id');
    const meta = GAME_META[id];
    try {
        if (meta) {
            const jsonLd = {
                '@context': 'https://schema.org',
                '@type': 'SoftwareApplication',
                name: meta.title.split(' - ')[0],
                description: meta.description,
                url: `${SITE_URL}/game/${id}`,
                applicationCategory: 'GameApplication',
                operatingSystem: 'Web Browser',
                offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
            };
            return c.html(renderSpaWithMeta(buildMetaBlock({ ...meta, path: `/game/${id}`, jsonLd })));
        }
        // 알 수 없는 게임 id는 게임 목록 메타로 폴백
        return c.html(renderSpaWithMeta(buildMetaBlock({ ...ROUTE_META['/game'], path: `/game/${id}` })));
    } catch (e) {
        console.error('[SEO] game meta injection error:', id, e);
        return c.html(fs.readFileSync(path.resolve('./apps/main-portal/dist/index.html'), 'utf-8'));
    }
});

// Serve frontend SPA (Fallback for all non-API routes)
app.use('/*', serveStatic({ root: './apps/main-portal/dist' }));
app.get('*', serveStatic({ path: './apps/main-portal/dist/index.html' }));

// Use PORT from env or default to 4200
const port = parseInt(process.env.PORT || '4200', 10);

console.log(`Server is running on port ${port} - watch trigger 6`);

serve({
    fetch: app.fetch,
    port,
    hostname: '0.0.0.0'
});

// 자동 뉴스 가져오기 스케줄러 시작 (news_schedule 설정에 따라 주기 수집)
import { startNewsScheduler } from './services/newsScheduler.js';
startNewsScheduler();

// 일정 1시간 전 푸시 알림 스케줄러 시작
import { startSchedulePushScheduler } from './services/schedulePushScheduler.js';
startSchedulePushScheduler();
