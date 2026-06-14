import { Hono } from 'hono';
import { pool } from '@faithportal/database';
import {
    findRelatedStocks,
    getStockNameByTicker,
    getCategoryName,
    getCategoryColor,
    getTimeAgo
} from '@faithportal/core-utils';
import { fetchBatchStockData } from '../utils/stockDataFetcher.js';
import { resolveDescriptionFromGoogleNews } from '../utils/googleNewsResolver.js';
import { requireAuth, optionalAuth, SessionUser } from '../middleware/auth.js';

const news = new Hono<{ Variables: { user: SessionUser | null } }>();

// GET /api/news - Get news list
news.get('/api/news', async (c) => {
    const category = c.req.query('category');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');
    const includeStocks = c.req.query('includeStocks') === 'true';

    try {
        let query = 'SELECT * FROM news WHERE (hidden IS NULL OR hidden = 0)';
        const params: any[] = [];

        if (category && category !== 'all') {
            // 다중 카테고리 지원: category 컬럼이 'stock,general' 형태일 수 있음
            query += ` AND (',' || category || ',') LIKE $1`;
            params.push(`%,${category},%`);
        }

        query += ` ORDER BY published_at DESC, created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        const newsItems = result.rows;

        if (includeStocks) {
            const newsWithStocks = await Promise.all(
                newsItems.map(async (n: any) => {
                    const searchText = `${n.title || ''} ${n.description || n.summary || ''} ${n.tags || ''}`;
                    const relatedTickers = findRelatedStocks(searchText, '', '', 3);

                    if (relatedTickers.length === 0) {
                        return { ...n, relatedStocks: [] };
                    }

                    const stockData = await fetchBatchStockData(relatedTickers);
                    return { ...n, relatedStocks: stockData };
                })
            );

            return c.json({
                success: true,
                news: newsWithStocks,
                count: newsWithStocks.length
            });
        }

        return c.json({
            success: true,
            news: newsItems,
            count: newsItems.length
        });
    } catch (error) {
        console.error('Fetch news error:', error);
        return c.json({ success: false, message: 'Failed to fetch news' }, 500);
    }
});

// GET /api/news/hot - Get hot news
news.get('/api/news/hot', async (c) => {
    const limit = parseInt(c.req.query('limit') || '10');
    try {
        const result = await pool.query(`
            SELECT * FROM news
            WHERE created_at >= NOW() - INTERVAL '7 days'
              AND (hidden IS NULL OR hidden = 0)
            ORDER BY popularity_score DESC, created_at DESC
            LIMIT $1
        `, [limit]);

        return c.json({
            success: true,
            news: result.rows || []
        });
    } catch (error) {
        console.error('Fetch hot news error:', error);
        return c.json({ success: false, message: 'Failed to fetch hot news' }, 500);
    }
});

// GET /api/news/search - Search news
news.get('/api/news/search', async (c) => {
    const q = c.req.query('q');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');

    if (!q) {
        return c.json({ success: false, message: 'Query required' }, 400);
    }

    try {
        // Enclose query in double quotes for exact word match if spaces exist, or just use it raw.
        // For basic FTS5, we can just pass the raw string if we want it to search tokens.
        // Let's replace spaces with AND for strict match or just leave it. We will use simple query.
        const ftsQuery = q.trim().split(' ').map(w => `"${w}"`).join(' AND ');

        const result = await pool.query(`
            SELECT * FROM news
            WHERE id IN (
                SELECT rowid FROM news_fts
                WHERE news_fts MATCH $1
            )
              AND (hidden IS NULL OR hidden = 0)
            ORDER BY published_at DESC, created_at DESC
            LIMIT $2 OFFSET $3
        `, [ftsQuery, limit, offset]);

        return c.json({
            success: true,
            news: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Search news error:', error);
        return c.json({ success: false, message: 'Failed to search news' }, 500);
    }
});

// GET /api/news/:id - Get news detail (숫자 ID만 매칭)
news.get('/api/news/:id{[0-9]+}', async (c) => {
    const id = c.req.param('id');
    try {
        const result = await pool.query('SELECT * FROM news WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return c.json({ success: false, message: 'News not found' }, 404);
        }
        const row = result.rows[0];

        // 본문(content)이 없으면 원문 og:description으로 보강 (best-effort, 1회만 가져와 캐시)
        if ((!row.content || String(row.content).trim() === '') && row.link) {
            try {
                const desc = await resolveDescriptionFromGoogleNews(row.link);
                if (desc && desc.length > String(row.summary || '').length) {
                    await pool.query('UPDATE news SET content = $1 WHERE id = $2', [desc, id]);
                    row.content = desc;
                }
            } catch { /* best-effort: 실패해도 기존 요약으로 표시 */ }
        }

        // Increment view count
        await pool.query('UPDATE news SET view_count = view_count + 1, popularity_score = popularity_score + 1 WHERE id = $1', [id]);

        return c.json({ success: true, news: row });
    } catch (error) {
        console.error('Get news detail error:', error);
        return c.json({ success: false, message: 'Failed to fetch news detail' }, 500);
    }
});

// POST /api/news/:id/vote - Vote on news
news.post('/api/news/:id/vote', requireAuth, async (c) => {
    const user = c.get('user') as SessionUser;
    const id = c.req.param('id');
    const { type } = await c.req.json();

    if (type !== 'up' && type !== 'down') {
        return c.json({ success: false, message: 'Invalid vote type' }, 400);
    }

    try {
        const existingVote = await pool.query(
            'SELECT * FROM news_votes WHERE news_id = $1 AND user_id = $2',
            [id, user.id]
        );

        if (existingVote.rows.length > 0) {
            if (existingVote.rows[0].vote_type === type) {
                // Cancel vote
                await pool.query('DELETE FROM news_votes WHERE id = $1', [existingVote.rows[0].id]);
                const field = type === 'up' ? 'vote_up' : 'vote_down';
                await pool.query(`UPDATE news SET ${field} = ${field} - 1 WHERE id = $1`, [id]);
                return c.json({ success: true, action: 'cancelled', type });
            } else {
                // Change vote
                await pool.query('UPDATE news_votes SET vote_type = $1 WHERE id = $2', [type, existingVote.rows[0].id]);
                const oldField = existingVote.rows[0].vote_type === 'up' ? 'vote_up' : 'vote_down';
                const newField = type === 'up' ? 'vote_up' : 'vote_down';
                await pool.query(`UPDATE news SET ${oldField} = ${oldField} - 1, ${newField} = ${newField} + 1 WHERE id = $1`, [id]);
                return c.json({ success: true, action: 'changed', type });
            }
        }

        // New vote
        await pool.query(
            'INSERT INTO news_votes (news_id, user_id, vote_type) VALUES ($1, $2, $3)',
            [id, user.id, type]
        );
        const field = type === 'up' ? 'vote_up' : 'vote_down';
        await pool.query(`UPDATE news SET ${field} = ${field} + 1 WHERE id = $1`, [id]);
        const scoreChange = type === 'up' ? 2 : -1;
        await pool.query('UPDATE news SET popularity_score = popularity_score + $1 WHERE id = $2', [scoreChange, id]);

        return c.json({ success: true, action: 'voted', type });
    } catch (error) {
        console.error('Vote error:', error);
        return c.json({ success: false, message: 'Failed to process vote' }, 500);
    }
});

// POST /api/news/:id/summarize - Summarize news with AI
news.post('/api/news/:id/summarize', async (c) => {
    const id = c.req.param('id');
    try {
        const result = await pool.query('SELECT * FROM news WHERE id = $1', [id]);
        if (result.rows.length === 0) return c.json({ success: false, message: 'News not found' }, 404);

        const n = result.rows[0];
        if (n.ai_processed) {
            return c.json({ success: true, ai_summary: n.ai_summary, sentiment: n.sentiment });
        }

        const { aiSummary, sentiment } = await summarizeWithGemini(n.title, n.summary || '');
        await pool.query(
            'UPDATE news SET ai_summary = $1, sentiment = $2, ai_processed = TRUE WHERE id = $3',
            [aiSummary, sentiment, id]
        );

        return c.json({ success: true, ai_summary: aiSummary, sentiment: sentiment });
    } catch (error) {
        console.error('Summarize error:', error);
        return c.json({ success: false, message: 'Failed to summarize news' }, 500);
    }
});

async function summarizeWithGemini(title: string, summary: string): Promise<{ aiSummary: string, sentiment: string }> {
    try {
        const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyBKN3R7vG_L7RpQhxO8uZUTL-vfZGx0234';
        const prompt = `다음 뉴스를 요약(3줄)하고 감정(positive/negative/neutral)을 분석해주세요. 제목: ${title} 내용: ${summary}`;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!response.ok) return { aiSummary: summary.substring(0, 150), sentiment: 'neutral' };
        const data = await response.json() as any;
        const text = data.candidates[0]?.content?.parts[0]?.text || '';
        const sentimentMatch = text.match(/(positive|negative|neutral)/i);
        const sentiment = sentimentMatch ? sentimentMatch[0].toLowerCase() : 'neutral';

        return { aiSummary: text.substring(0, 500), sentiment };
    } catch (error) {
        return { aiSummary: summary.substring(0, 150), sentiment: 'neutral' };
    }
}

// 다음 실행 시간 계산 헬퍼 함수
function calculateNextRun(type: string, time: string, interval: number): string {
    const now = new Date();

    if (type === 'hourly') {
        const next = new Date(now.getTime() + (interval || 1) * 60 * 60 * 1000);
        return next.toISOString();
    } else if (type === 'daily' && time) {
        const [h, m] = time.split(':').map(Number);
        // 한국 시간 기준 계산 (UTC+9)
        const kTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        const nextRun = new Date(kTime);
        nextRun.setHours(h, m, 0, 0);

        if (nextRun <= kTime) {
            nextRun.setDate(nextRun.getDate() + 1);
        }

        // 다시 UTC로 변환하여 저장
        return new Date(nextRun.getTime() - (9 * 60 * 60 * 1000)).toISOString();
    }

    // 기본값: 1시간 뒤
    return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
}

// 스케줄 설정 조회
news.get('/api/news/schedule', async (c) => {
    try {
        const result = await pool.query('SELECT * FROM news_schedule WHERE id = 1');
        const schedule = result.rows[0] || { enabled: 1, schedule_type: 'hourly', interval_hours: 1 };
        return c.json({ success: true, schedule });
    } catch (error) {
        console.error('스케줄 설정 조회 오류:', error);
        return c.json({ error: '스케줄 설정 조회 실패' }, 500);
    }
});

// 스케줄 설정 저장
news.post('/api/news/schedule', async (c) => {
    try {
        const body = await c.req.json();
        const { enabled, schedule_type, schedule_time, interval_hours } = body;

        let next_run = null;
        if (enabled) {
            next_run = calculateNextRun(schedule_type, schedule_time, interval_hours);
        }

        await pool.query(`
            INSERT INTO news_schedule (id, enabled, schedule_type, schedule_time, interval_hours, next_run, updated_at) 
            VALUES (1, $1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
                enabled = EXCLUDED.enabled, 
                schedule_type = EXCLUDED.schedule_type, 
                schedule_time = EXCLUDED.schedule_time, 
                interval_hours = EXCLUDED.interval_hours, 
                next_run = EXCLUDED.next_run, 
                updated_at = EXCLUDED.updated_at
        `, [enabled ? 1 : 0, schedule_type, schedule_time, interval_hours, next_run]);

        return c.json({ success: true, message: '스케줄 설정이 저장되었습니다.', next_run });
    } catch (error) {
        console.error('스케줄 설정 저장 오류:', error);
        return c.json({ error: '스케줄 설정 저장 실패' }, 500);
    }
});

export default news;
