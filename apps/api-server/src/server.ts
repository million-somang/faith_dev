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

import { miniappRoutes } from './routes/miniapp.routes.js';
app.route('/', miniappRoutes);

import { tetrisRoutes } from './routes/tetris.routes.js';
app.route('/', tetrisRoutes);

import { gameRoutes } from './routes/game.routes.js';
app.route('/', gameRoutes);

import { ddayRoutes } from './routes/dday.routes.js';
app.route('/', ddayRoutes);

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
