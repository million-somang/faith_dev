import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { MyPageService } from '../services/mypage.service.js';
const mypage = new Hono();
// Apply requireAuth to all mypage routes
mypage.use('*', requireAuth);
// ===== News Keywords =====
mypage.get('/keywords', async (c) => {
    const user = c.get('user');
    const keywords = await MyPageService.getKeywords(user.id);
    return c.json({ success: true, keywords });
});
mypage.post('/keywords', async (c) => {
    const user = c.get('user');
    const { keyword } = await c.req.json();
    if (!keyword)
        return c.json({ success: false, message: 'Keyword is required' }, 400);
    await MyPageService.addKeyword(user.id, keyword);
    return c.json({ success: true });
});
mypage.delete('/keywords/:id', async (c) => {
    const user = c.get('user');
    const keywordId = parseInt(c.req.param('id'));
    await MyPageService.deleteKeyword(user.id, keywordId);
    return c.json({ success: true });
});
mypage.get('/news/keywords', async (c) => {
    const user = c.get('user');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');
    // Get user keywords
    const keywords = await MyPageService.getKeywords(user.id);
    if (keywords.length === 0)
        return c.json({ success: true, news: [], count: 0 });
    // Create FTS5 query using OR for multiple keywords
    const ftsQuery = keywords.map((k) => `"${k.keyword}"`).join(' OR ');
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
    }
    catch (err) {
        console.error('Fetch keyword news error:', err);
        return c.json({ success: false, message: 'Failed to fetch keyword news' }, 500);
    }
});
// ===== News Bookmarks =====
mypage.get('/bookmarks', async (c) => {
    const user = c.get('user');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const result = await MyPageService.getBookmarks(user.id, page, limit);
    return c.json({ success: true, ...result });
});
mypage.post('/bookmarks', async (c) => {
    const user = c.get('user');
    const { newsId } = await c.req.json();
    await MyPageService.addBookmark(user.id, newsId);
    return c.json({ success: true });
});
mypage.delete('/bookmarks/:newsId', async (c) => {
    const user = c.get('user');
    const newsId = parseInt(c.req.param('newsId'));
    await MyPageService.deleteBookmark(user.id, newsId);
    return c.json({ success: true });
});
// ===== Stock Watchlist =====
mypage.get('/watchlist', async (c) => {
    const user = c.get('user');
    const stocks = await MyPageService.getWatchlist(user.id);
    return c.json({ success: true, stocks });
});
mypage.post('/watchlist', async (c) => {
    const user = c.get('user');
    const data = await c.req.json();
    await MyPageService.addWatchlist(user.id, data);
    return c.json({ success: true });
});
mypage.delete('/watchlist/:id', async (c) => {
    const user = c.get('user');
    const stockId = parseInt(c.req.param('id'));
    await MyPageService.deleteWatchlist(user.id, stockId);
    return c.json({ success: true });
});
// ===== Game Stats =====
mypage.get('/game-stats', async (c) => {
    const user = c.get('user');
    const stats = await MyPageService.getGameStats(user.id);
    return c.json({ success: true, stats });
});
export default mypage;
