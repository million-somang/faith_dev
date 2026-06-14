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

import { gameRoutes } from './routes/game.routes.js';
app.route('/', gameRoutes);

import { ddayRoutes } from './routes/dday.routes.js';
app.route('/', ddayRoutes);

import { analyticsRoutes } from './routes/analytics.routes.js';
app.route('/', analyticsRoutes);

import { financeRoutes } from './routes/finance.routes.js';
app.route('/', financeRoutes);

const miniApps = [
    'calculator', 'text-checker', 'tetris', 'sudoku', 'pyeong-calc',
    '2048', 'minesweeper', 'age-calc', 'dday-calc', 'json-formatter',
    'base64-converter', 'svg-converter', 'news'
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

const SITE_URL = process.env.SITE_URL || 'https://faithlink.my';

// robots.txt
app.get('/robots.txt', (c) => {
    const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /app/
Disallow: /mypage
Disallow: /login
Disallow: /signup

Sitemap: ${SITE_URL}/sitemap.xml
`;
    return c.text(robotsTxt, 200, { 'Content-Type': 'text/plain' });
});

// sitemap.xml (동적 생성 — 뉴스 URL 포함)
app.get('/sitemap.xml', async (c) => {
    const staticPages = [
        { loc: '/', priority: '1.0', changefreq: 'daily' },
        { loc: '/news', priority: '0.9', changefreq: 'hourly' },
        { loc: '/game', priority: '0.7', changefreq: 'weekly' },
        { loc: '/lifestyle', priority: '0.7', changefreq: 'weekly' },
        { loc: '/finance', priority: '0.7', changefreq: 'monthly' },
        { loc: '/game/play/tetris', priority: '0.6', changefreq: 'monthly' },
    ];

    // DB에서 최근 뉴스 100개 가져오기
    let newsUrls: { loc: string; lastmod: string }[] = [];
    try {
        const newsResult = await pool.query(
            "SELECT id, created_at FROM news ORDER BY created_at DESC LIMIT 100"
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
    <priority>0.6</priority>
  </url>`),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    return c.text(xml, 200, { 'Content-Type': 'application/xml' });
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
            const title = `${news.title} - FaithLink 뉴스`;
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
                    "name": "FaithLink"
                }
            });

            const metaTags = `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="FaithLink" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <link rel="canonical" href="${url}" />
    <script type="application/ld+json">${jsonLd}</script>`;

            // <title>FaithPortal</title> 을 동적 메타로 교체
            html = html.replace('<title>FaithLink - 실시간 뉴스, 미니게임, 생활도구 포털</title>', metaTags);
            // fallback: 원래 title도 교체
            html = html.replace('<title>FaithPortal</title>', metaTags);
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
