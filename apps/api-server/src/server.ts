import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { pool } from '@faithportal/database';
import { errorHandler } from './middleware/errors.js';
import { optionalAuth, checkSession } from './middleware/auth.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = new Hono();

// Explicit CORS (updated)
app.use('*', cors({
    origin: (origin) => origin || '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-API-KEY', 'x-api-key', 'X-Requested-With'],
    exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
    maxAge: 600,
    credentials: true,
}));

app.use('*', errorHandler);

// ==================== 공인 검색엔진 외 무단 크롤러 및 스크래퍼 차단 미들웨어 ====================
const ALLOWED_BOT_PATTERNS = [
    'googlebot', 'adsbot-google', 'mediapartners-google', 'google-inspectiontool', 'feedfetcher-google',
    'yeti', 'naverbot',
    'daumoa', 'kakaotalk-scrap', 'kakaostory-og-reader',
    'bingbot', 'msnbot',
    'facebookexternalhit', 'facebot', 'twitterbot', 'applebot', 'slackbot', 'linkedinbot'
];

const BLOCKED_BOT_PATTERNS = [
    'ahrefs', 'semrush', 'bytespider', 'dotbot', 'mj12bot', 'petalbot',
    'dataprovider', 'redscanner', 'zoominfo', 'blexbot', 'megaindex',
    'scrapy', 'python-requests', 'go-http-client', 'wget'
];

app.use('*', async (c, next) => {
    const path = c.req.path;
    if (path === '/health' || path === '/api/health') return next();

    // x-api-key 헤더가 포함된 공인 API 호출은 봇 스크래핑 차단 예외 처리
    const apiKey = c.req.header('x-api-key') || c.req.header('X-API-KEY') || c.req.header('x-api-token') || c.req.header('authorization');
    if (apiKey) return next();

    const ua = (c.req.header('User-Agent') || '').toLowerCase();
    if (ua) {
        const isBlocked = BLOCKED_BOT_PATTERNS.some(bot => ua.includes(bot));
        if (isBlocked) {
            const isAllowed = ALLOWED_BOT_PATTERNS.some(allowed => ua.includes(allowed));
            if (!isAllowed) {
                return c.text('Access Denied: Automated bot scraping is prohibited.', 403);
            }
        }
    }

    await next();
});

// Base route skipped in favor of static SPA

// Consistent health check
app.get('/health', async (c) => {
    return c.json({ status: 'ok', db: 'connected' });
});

app.get('/api/health', async (c) => {
    return c.json({ status: 'ok' });
});

// News API
import newsRoutes, { handleCreateNewsApi, handleUploadNewsImage } from './routes/news.routes.js';
import { bodyLimit } from 'hono/body-limit';

app.route('/', newsRoutes);
app.post('/api/news/upload-image', bodyLimit({ maxSize: 25 * 1024 * 1024 }), handleUploadNewsImage);
app.post('/api/news/create', bodyLimit({ maxSize: 25 * 1024 * 1024 }), handleCreateNewsApi);
app.post('/api/news', bodyLimit({ maxSize: 25 * 1024 * 1024 }), handleCreateNewsApi);
app.post('/api/news/write', bodyLimit({ maxSize: 25 * 1024 * 1024 }), handleCreateNewsApi);

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

import { marketingRoutes } from './routes/marketing.routes.js';
app.route('/', marketingRoutes);

import { marketingAdminUi } from './routes/marketing-admin-ui.js';
app.route('/', marketingAdminUi);

import { loungeRoutes } from './routes/lounge.routes.js';
app.route('/', loungeRoutes);

// 배너 업로드 이미지 정적 서빙
app.use('/uploads/*', serveStatic({ root: './public' }));

import { miniappRoutes } from './routes/miniapp.routes.js';
app.route('/', miniappRoutes);


import { comboyRoutes } from './routes/comboy.routes.js';
app.route('/', comboyRoutes);

import { sfcRoutes } from './routes/sfc.routes.js';
app.route('/', sfcRoutes);

import { baseballRoutes } from './routes/baseball.routes.js';
app.route('/', baseballRoutes);

import { gameRoutes } from './routes/game.routes.js';
app.route('/', gameRoutes);

import { ddayRoutes } from './routes/dday.routes.js';
app.route('/', ddayRoutes);

import { analyticsRoutes } from './routes/analytics.routes.js';
app.route('/', analyticsRoutes);

import novelRoutes from './routes/novel.routes.js';
app.route('/api/novel', novelRoutes);

import omokRoutes from './routes/omok.routes.js';
app.route('/api/omok', omokRoutes);

import { financeRoutes } from './routes/finance.routes.js';
app.route('/', financeRoutes);

import { geoRoutes } from './routes/geo.routes.js';
app.route('/', geoRoutes);

import { shoppingRoutes } from './routes/shopping.routes.js';
app.route('/', shoppingRoutes);

import { travelRoutes } from './routes/travel.routes.js';
app.route('/', travelRoutes);


const miniApps = [
    'calculator', 'text-checker', 'sudoku', 'pyeong-calc',
    '2048', 'minesweeper', 'freecell', 'age-calc', 'dday-calc', 'json-formatter',
    'base64-converter', 'svg-converter', 'webp-converter', 'news', 'saju', 'novel', 'severance-calc', 'interest-calc', 'vera-pop', 'customs-calc', 'omok', 'ocr', 'janggi', 'baseball', 'vacation-planner', 'flight', 'image-resizer'
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

// 아케이드 에뮬레이터 (comboy, sfc)
['comboy', 'sfc'].forEach(appName => {
    const basePath = `/app/${appName}`;
    const distPath = `./apps/app-${appName}/dist`;
    
    app.use(`${basePath}/*`, serveStatic({ 
        root: distPath,
        rewriteRequestPath: (path) => path.replace(new RegExp(`^${basePath}`), '')
    }));
    app.get(basePath, serveStatic({ path: `${distPath}/index.html` }));
});

// 실시간 온라인게임 (/onlinegame/:gameName)
const onlineGames = ['omok-pvp', 'ffrpg'];

onlineGames.forEach(gameName => {
    const basePath = `/onlinegame/${gameName}`;
    const distPath = `./onlinegame/${gameName}/dist`;
    
    app.use(`${basePath}/*`, serveStatic({ 
        root: distPath,
        rewriteRequestPath: (path) => path.replace(new RegExp(`^${basePath}`), '')
    }));
    app.get(basePath, serveStatic({ path: `${distPath}/index.html` }));
});

// Finance app 라우트 (/finance, /finance/) - 원본 금융 마이크로앱(apps/finance) 직접 서빙
app.get('/finance', (c) => {
    const financeDist = path.resolve('./apps/finance/dist/index.html');
    if (fs.existsSync(financeDist)) {
        return c.html(fs.readFileSync(financeDist, 'utf-8'));
    }
    return c.notFound();
});
app.get('/finance/', (c) => {
    const financeDist = path.resolve('./apps/finance/dist/index.html');
    if (fs.existsSync(financeDist)) {
        return c.html(fs.readFileSync(financeDist, 'utf-8'));
    }
    return c.notFound();
});

// Finance subroutes direct landing (/finance/stocks, /finance/exchange, /finance/banking, /finance/stock/:ticker)
['/finance/stocks', '/finance/exchange', '/finance/banking', '/finance/stock/:ticker'].forEach(subPath => {
    app.get(subPath, (c) => {
        const financeDist = path.resolve('./apps/finance/dist/index.html');
        if (fs.existsSync(financeDist)) {
            return c.html(fs.readFileSync(financeDist, 'utf-8'));
        }
        return c.notFound();
    });
});

// Finance app 정적 파일 서빙
app.use('/finance/*', serveStatic({
    root: './apps/finance/dist',
    rewriteRequestPath: (path) => path.replace(/^\/finance/, '')
}));

// ==================== SEO / 피드 라우트 ====================

const SITE_URL = process.env.SITE_URL || 'https://veranex.app';

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

// API 및 백엔드 404 처리 (구버전 루트 302 리다이렉트 제거)
app.notFound((c) => {
    if (c.req.path.startsWith('/api')) {
        return c.json({
            success: false,
            error: {
                code: 404,
                message: `API Route Not Found: [${c.req.method}] ${c.req.path}. Please verify server build & PM2 process restart.`
            }
        }, 404);
    }
    return c.text('Not Found', 404);
});

// Use PORT from env or default to 4200
const port = parseInt(process.env.PORT || '4200', 10);

console.log(`Server is running on port ${port} - watch trigger 6`);

const serverInstance = serve({
    fetch: app.fetch,
    port,
    hostname: '0.0.0.0'
});

import { omokGameManager } from './services/omok/OmokGameManager.js';
omokGameManager.init(serverInstance as any);

// 뉴스 자체 크롤링 스케줄러 (기본은 외부 자체 API 발행 모드이며, 필요 시 ENABLE_RSS_SCHEDULER=true 로 가동)
if (process.env.ENABLE_RSS_SCHEDULER === 'true') {
    import('./services/newsScheduler.js').then(({ startNewsScheduler }) => {
        startNewsScheduler();
        console.log('📢 [News System] 자체 백업 RSS 수집 스케줄러가 활성화되었습니다.');
    });
} else {
    console.log('📢 [News System] 자체 API 전용 발행 모드 활성 (x-api-key 연동 대기)');
}

// 일정 1시간 전 푸시 알림 스케줄러 시작
import { startSchedulePushScheduler } from './services/schedulePushScheduler.js';
startSchedulePushScheduler();

// SNS 자동/반자동 마케팅 스케줄러 시작
import { startMarketingScheduler } from './services/marketing/marketingScheduler.service.js';
startMarketingScheduler();

