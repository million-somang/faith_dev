import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { MyPageService } from '../services/mypage.service.js';
import { HomepageConfigService } from '../services/homepage-config.service.js';
import { SessionUser } from '../middleware/auth.js';

type Variables = {
    user: SessionUser | null;
};

const mypage = new Hono<{ Variables: Variables }>();

// Apply requireAuth to all mypage routes
mypage.use('*', requireAuth);

// ===== News Keywords =====
mypage.get('/keywords', async (c) => {
    const user = c.get('user') as SessionUser;
    const keywords = await MyPageService.getKeywords(user.id);
    return c.json({ success: true, keywords });
});

mypage.post('/keywords', async (c) => {
    const user = c.get('user') as SessionUser;
    const { keyword } = await c.req.json();
    if (!keyword) return c.json({ success: false, message: 'Keyword is required' }, 400);
    await MyPageService.addKeyword(user.id, keyword);
    return c.json({ success: true });
});

mypage.delete('/keywords/:id', async (c) => {
    const user = c.get('user') as SessionUser;
    const keywordId = parseInt(c.req.param('id'));
    await MyPageService.deleteKeyword(user.id, keywordId);
    return c.json({ success: true });
});

mypage.get('/news/keywords', async (c) => {
    const user = c.get('user') as SessionUser;
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');

    // Get user keywords
    const keywords = await MyPageService.getKeywords(user.id);
    if (keywords.length === 0) return c.json({ success: true, news: [], count: 0 });

    // Create FTS5 query using OR for multiple keywords
    const ftsQuery = keywords.map((k: any) => `"${k.keyword}"`).join(' OR ');

    try {
        const { pool } = await import('@faithportal/database');
        const result = await pool.query(`
            SELECT * FROM news 
            WHERE id IN (
                SELECT rowid FROM news_fts 
                WHERE news_fts MATCH $1
            )
            ORDER BY published_at DESC, created_at DESC 
            LIMIT $2 OFFSET $3
        `, [ftsQuery, limit, offset]);

        return c.json({ success: true, news: result.rows, count: result.rows.length });
    } catch (err) {
        console.error('Fetch keyword news error:', err);
        return c.json({ success: false, message: 'Failed to fetch keyword news' }, 500);
    }
});

// ===== News Bookmarks =====
mypage.get('/bookmarks', async (c) => {
    const user = c.get('user') as SessionUser;
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const result = await MyPageService.getBookmarks(user.id, page, limit);
    return c.json({ success: true, ...result });
});

mypage.post('/bookmarks', async (c) => {
    const user = c.get('user') as SessionUser;
    const { newsId } = await c.req.json();
    await MyPageService.addBookmark(user.id, newsId);
    return c.json({ success: true });
});

mypage.delete('/bookmarks/:newsId', async (c) => {
    const user = c.get('user') as SessionUser;
    const newsId = parseInt(c.req.param('newsId'));
    await MyPageService.deleteBookmark(user.id, newsId);
    return c.json({ success: true });
});

// ===== Stock Watchlist =====
mypage.get('/watchlist', async (c) => {
    const user = c.get('user') as SessionUser;
    const stocks = await MyPageService.getWatchlist(user.id);
    return c.json({ success: true, stocks });
});

mypage.post('/watchlist', async (c) => {
    const user = c.get('user') as SessionUser;
    const data = await c.req.json();
    await MyPageService.addWatchlist(user.id, data);
    return c.json({ success: true });
});

mypage.delete('/watchlist/:id', async (c) => {
    const user = c.get('user') as SessionUser;
    const stockId = parseInt(c.req.param('id'));
    await MyPageService.deleteWatchlist(user.id, stockId);
    return c.json({ success: true });
});

// ===== Game Stats =====
mypage.get('/game-stats', async (c) => {
    const user = c.get('user') as SessionUser;
    const stats = await MyPageService.getGameStats(user.id);
    return c.json({ success: true, stats });
});

// ===== Homepage Personalization Config =====
mypage.get('/homepage-config', async (c) => {
    try {
        const user = c.get('user') as SessionUser;
        const config = await HomepageConfigService.getConfig(user.id);
        return c.json({ success: true, config });
    } catch (err) {
        console.error('Homepage config GET error:', err);
        return c.json({ success: false, error: { code: 500, message: 'Failed to load homepage config' } }, 500);
    }
});

mypage.post('/homepage-config', async (c) => {
    try {
        const user = c.get('user') as SessionUser;
        const body = await c.req.json() as Record<string, unknown>;

        if (!body || typeof body !== 'object') {
            return c.json({ success: false, error: { code: 400, message: 'Invalid config data' } }, 400);
        }

        await HomepageConfigService.saveConfig(user.id, body);
        return c.json({ success: true });
    } catch (err) {
        console.error('Homepage config POST error:', err);
        return c.json({ success: false, error: { code: 500, message: 'Failed to save homepage config' } }, 500);
    }
});

// ===== User Schedules (Today's Biz Agenda) =====
mypage.get('/schedules', async (c) => {
    try {
        const user = c.get('user') as SessionUser;
        const schedules = await MyPageService.getSchedules(user.id);
        return c.json({ success: true, schedules });
    } catch (err) {
        console.error('Get schedules error:', err);
        return c.json({ success: false, message: 'Failed to fetch schedules' }, 500);
    }
});

mypage.post('/schedules', async (c) => {
    try {
        const user = c.get('user') as SessionUser;
        const { time, text } = await c.req.json();
        if (!text || !text.trim()) {
            return c.json({ success: false, message: 'Text is required' }, 400);
        }
        await MyPageService.addSchedule(user.id, time || '09:00', text.trim());
        const schedules = await MyPageService.getSchedules(user.id);
        return c.json({ success: true, schedules });
    } catch (err) {
        console.error('Add schedule error:', err);
        return c.json({ success: false, message: 'Failed to add schedule' }, 500);
    }
});

mypage.delete('/schedules/:id', async (c) => {
    try {
        const user = c.get('user') as SessionUser;
        const scheduleId = parseInt(c.req.param('id'));
        await MyPageService.deleteSchedule(user.id, scheduleId);
        const schedules = await MyPageService.getSchedules(user.id);
        return c.json({ success: true, schedules });
    } catch (err) {
        console.error('Delete schedule error:', err);
        return c.json({ success: false, message: 'Failed to delete schedule' }, 500);
    }
});

// ===== Vera Points =====
mypage.get('/vera-points', async (c) => {
    try {
        const user = c.get('user') as SessionUser;
        const data = await MyPageService.getVeraPoints(user.id);
        return c.json({ success: true, ...data });
    } catch (err) {
        console.error('Get vera-points error:', err);
        return c.json({ success: false, message: 'Failed to fetch vera points' }, 500);
    }
});

export default mypage;
