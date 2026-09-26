import { Hono } from 'hono';
import fs from 'node:fs';
import path from 'node:path';
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
            query += ` AND (',' || category || ',') LIKE $${params.length + 1}`;
            params.push(`%,${category},%`);
        }

        // 언론사별 필터: 제목 끝의 " - 언론사" 접미사로 매칭 (목록 화면 표기와 동일 기준)
        const publisher = c.req.query('publisher');
        if (publisher) {
            const escaped = publisher.replace(/[\\%_]/g, (ch) => '\\' + ch);
            query += ` AND title LIKE $${params.length + 1} ESCAPE '\\'`;
            params.push(`% - ${escaped}`);
        }

        query += ` ORDER BY COALESCE(created_at, published_at) DESC, published_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        const newsItems = result.rows;

        if (includeStocks) {
            // N+1 문제 해결: 전체 뉴스의 고유 티커를 취합하여 1회 일괄(Batch) 조회
            const newsTickerMap = new Map<number, string[]>();
            const allTickersSet = new Set<string>();

            for (const n of newsItems) {
                const searchText = `${n.title || ''} ${n.description || n.summary || ''} ${n.tags || ''}`;
                const relatedTickers = findRelatedStocks(searchText, '', '', 3);
                newsTickerMap.set(n.id, relatedTickers);
                for (const t of relatedTickers) {
                    allTickersSet.add(t);
                }
            }

            const allStockList = allTickersSet.size > 0 
                ? await fetchBatchStockData(Array.from(allTickersSet))
                : [];

            const stockMap = new Map<string, any>();
            for (const s of allStockList) {
                if (s && s.ticker) stockMap.set(s.ticker, s);
            }

            const newsWithStocks = newsItems.map((n: any) => {
                const tickers = newsTickerMap.get(n.id) || [];
                const relatedStocks = tickers.map(t => stockMap.get(t)).filter(Boolean);
                return { ...n, relatedStocks };
            });

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
            ORDER BY COALESCE(created_at, published_at) DESC, published_at DESC
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

// GET /api/news/sources - 언론사 목록(제목 접미사 기준) + 기사 수
// 제목의 마지막 " - 언론사" 접미사가 실제 언론사명(목록 카드 표기와 동일). source 컬럼은 최신
// 데이터가 '구글 뉴스'로 채워져 신뢰할 수 없어 사용하지 않는다.
let sourcesCache: { data: { publisher: string; count: number }[]; ts: number } | null = null;
const SOURCES_CACHE_TTL = 10 * 60 * 1000; // 10분

news.get('/api/news/sources', async (c) => {
    try {
        if (sourcesCache && Date.now() - sourcesCache.ts < SOURCES_CACHE_TTL) {
            return c.json({ success: true, sources: sourcesCache.data });
        }

        const result = await pool.query('SELECT title FROM news WHERE (hidden IS NULL OR hidden = 0)');
        const counts = new Map<string, number>();
        for (const row of result.rows) {
            const title = String(row.title || '');
            const sepIdx = title.lastIndexOf(' - ');
            // NewsCard와 동일 규칙: 접미사 길이 25자 이하만 언론사로 인정
            if (sepIdx > 0 && title.length - sepIdx - 3 <= 25) {
                const publisher = title.slice(sepIdx + 3).trim();
                if (publisher) counts.set(publisher, (counts.get(publisher) || 0) + 1);
            }
        }

        const sources = Array.from(counts.entries())
            .map(([publisher, count]) => ({ publisher, count }))
            .sort((a, b) => b.count - a.count);

        sourcesCache = { data: sources, ts: Date.now() };
        return c.json({ success: true, sources });
    } catch (error) {
        console.error('Fetch news sources error:', error);
        return c.json({ success: false, message: 'Failed to fetch news sources' }, 500);
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

/**
 * 뉴스 카테고리 정규화 헬퍼 (한글 및 영문 호환)
 */
export function normalizeNewsCategory(cat?: string): string {
    if (!cat) return 'economy';
    const lower = String(cat).toLowerCase().trim();
    if (['정치', 'politics'].includes(lower)) return 'politics';
    if (['경제', 'economy', '증시', '금융', 'stock', 'finance', '비즈니스', 'business'].includes(lower)) return 'economy';
    if (['사회', 'society'].includes(lower)) return 'society';
    if (['it', '과학', '기술', 'tech', 'science', 'it/과학'].includes(lower)) return 'tech';
    if (['세계', '국제', 'world', 'global'].includes(lower)) return 'world';
    if (['생활', '문화', 'lifestyle', 'culture', '생활/문화'].includes(lower)) return 'lifestyle';
    if (['연예', '엔터', 'entertainment', 'fun', '연예/스타'].includes(lower)) return 'entertainment';
    if (['스포츠', 'sports'].includes(lower)) return 'sports';
    return lower;
}

/**
 * AI 요약문 자동 추출 헬퍼 (미제공 시 본문에서 3줄 추출)
 */
function extractAutoAiSummary(content: string, title: string): string {
    const cleanText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const sentences = cleanText.split(/(?<=[.?!])\s+/).filter(s => s.length >= 10);
    
    if (sentences.length >= 3) {
        return `• ${sentences[0].trim()}\n• ${sentences[1].trim()}\n• ${sentences[2].trim()}`;
    } else if (sentences.length > 0) {
        return sentences.map(s => `• ${s.trim()}`).join('\n');
    }
    return `• ${title}\n• 상세 내용은 본문 기사를 확인해주세요.`;
}

// POST /api/news/upload-image - 뉴스 대표 사진 멀티파트 직접 업로드
const handleUploadNewsImage = async (c: any) => {
    const apiKeyHeader = c.req.header('x-api-key') || c.req.header('authorization')?.replace(/^Bearer\s+/i, '');
    const expectedKey = process.env.NEWS_API_KEY || 'vera-news-api-key-2026';
    const user = c.get('user');
    const isAuthorized = (apiKeyHeader && apiKeyHeader === expectedKey) || (user && (user.role === 'admin' || user.isAdmin));

    if (!isAuthorized) {
        return c.json({
            success: false,
            error: {
                code: 401,
                message: 'Unauthorized: Invalid or missing API Key. Please provide X-API-KEY header.'
            }
        }, 401);
    }

    try {
        const body = await c.req.parseBody();
        const file = body['file'] || body['image'];

        if (!file || typeof file === 'string') {
            return c.json({
                success: false,
                error: { code: 400, message: 'Bad Request: "file" or "image" field is required (multipart/form-data).' }
            }, 400);
        }

        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        const originalName = file.name || 'image.jpg';
        const ext = path.extname(originalName).toLowerCase();

        if (!allowedExtensions.includes(ext)) {
            return c.json({
                success: false,
                error: { code: 400, message: `Invalid file format. Allowed formats: ${allowedExtensions.join(', ')}` }
            }, 400);
        }

        // 저장 디렉토리 확보 (root public 및 api-server public 둘 다 지원)
        const primaryDir = path.resolve(process.cwd(), 'public/uploads/news');
        const secondaryDir = path.resolve(process.cwd(), 'apps/api-server/public/uploads/news');

        for (const dir of [primaryDir, secondaryDir]) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }

        const fileName = `news_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
        const primaryPath = path.join(primaryDir, fileName);
        const secondaryPath = path.join(secondaryDir, fileName);

        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(primaryPath, buffer);
        try {
            fs.writeFileSync(secondaryPath, buffer);
        } catch { /* best-effort secondary copy */ }

        const relativeUrl = `/uploads/news/${fileName}`;
        const fullUrl = `https://veranex.app${relativeUrl}`;

        return c.json({
            success: true,
            message: '이미지가 성공적으로 업로드되었습니다.',
            imageUrl: relativeUrl,
            fullUrl: fullUrl,
            fileName: fileName,
            fileSize: buffer.length
        }, 201);
    } catch (error: any) {
        console.error('[Upload News Image Error]', error);
        return c.json({
            success: false,
            error: { code: 500, message: 'Image upload failed: ' + (error.message || 'Server error') }
        }, 500);
    }
};

// POST /api/news/create (및 POST /api/news) - 뉴스 기사 외부 API 등록
const handleCreateNewsApi = async (c: any) => {
    const apiKeyHeader = c.req.header('x-api-key') || c.req.header('authorization')?.replace(/^Bearer\s+/i, '');
    const expectedKey = process.env.NEWS_API_KEY || 'vera-news-api-key-2026';

    const user = c.get('user');
    const isAuthorized = (apiKeyHeader && apiKeyHeader === expectedKey) || (user && (user.role === 'admin' || user.isAdmin));

    if (!isAuthorized) {
        return c.json({
            success: false,
            error: {
                code: 401,
                message: 'Unauthorized: Invalid or missing API Key. Please provide X-API-KEY header.'
            }
        }, 401);
    }

    try {
        const body = await c.req.json();
        const {
            title,
            content,
            summary,
            category,
            imageUrl,
            thumbnail,
            sourceUrl,
            link,
            source,
            publisher,
            aiSummary,
            sentiment = 'neutral',
            keywords,
            tags
        } = body;

        // 필수 필드 검증
        if (!title || typeof title !== 'string' || title.trim().length < 3) {
            return c.json({
                success: false,
                error: {
                    code: 400,
                    message: 'Bad Request: "title" is required and must be at least 3 characters.'
                }
            }, 400);
        }

        const rawContent = (content || summary || '').trim();
        if (!rawContent || rawContent.length < 10) {
            return c.json({
                success: false,
                error: {
                    code: 400,
                    message: 'Bad Request: "content" (or "summary") is required and must be at least 10 characters.'
                }
            }, 400);
        }

        const normalizedCategory = normalizeNewsCategory(category);
        const finalThumbnail = (imageUrl || thumbnail || '').trim();
        
        let finalLink = (sourceUrl || link || '').trim();
        if (!finalLink) {
            finalLink = `https://veranex.app/news/ref/${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        }

        // 중복 link 방지: DB에 이미 동일한 link가 존재하면 유니크 파라미터 부여
        const checkExisting = await pool.query('SELECT id FROM news WHERE link = $1', [finalLink]);
        if (checkExisting.rows && checkExisting.rows.length > 0) {
            const separator = finalLink.includes('?') ? '&' : '?';
            finalLink = `${finalLink}${separator}_v=${Date.now()}`;
        }

        const finalSource = (source || publisher || 'VERA 뉴스데스크').trim();
        const finalSummary = summary ? summary.trim() : rawContent.replace(/<[^>]*>/g, '').substring(0, 160).trim();
        
        // AI 요약: 배열 형태(["요약1", "요약2", "요약3"]) 또는 문자열 모두 지원 (정확히 3개 항목 정규화)
        const rawAiSummary = aiSummary !== undefined ? aiSummary : (body as any).ai_summary;
        let finalAiSummary = '';
        if (Array.isArray(rawAiSummary)) {
            const cleanItems = rawAiSummary
                .filter(Boolean)
                .map(s => String(s).trim().replace(/^(?:[•\-\*]|\d+[\.\)])\s*/, '').trim())
                .filter(s => s.length > 0)
                .slice(0, 3);
            if (cleanItems.length > 0) {
                finalAiSummary = cleanItems.map(s => `• ${s}`).join('\n');
            }
        } else if (rawAiSummary && typeof rawAiSummary === 'string' && rawAiSummary.trim().length > 0) {
            const lines = rawAiSummary
                .split(/\n+/)
                .map(l => l.trim().replace(/^(?:[•\-\*]|\d+[\.\)])\s*/, '').trim())
                .filter(l => l.length > 0)
                .slice(0, 3);
            if (lines.length > 0) {
                finalAiSummary = lines.map(l => `• ${l}`).join('\n');
            } else {
                finalAiSummary = rawAiSummary.trim();
            }
        }
        
        if (!finalAiSummary) {
            finalAiSummary = extractAutoAiSummary(rawContent, title.trim());
        }

        const finalTags = Array.isArray(keywords || tags) 
            ? (keywords || tags).join(',') 
            : (keywords || tags || '');

        const result = await pool.query(`
            INSERT INTO news (
                title, summary, content, category, thumbnail, link, source, 
                ai_summary, sentiment, tags, popularity_score, ai_processed, published_at, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 100, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id, title, category, created_at
        `, [
            title.trim(),
            finalSummary,
            rawContent,
            normalizedCategory,
            finalThumbnail,
            finalLink,
            finalSource,
            finalAiSummary,
            sentiment,
            finalTags
        ]);

        const newNews = (result.rows && result.rows[0]) ? result.rows[0] : null;
        const insertedId = newNews?.id || (result as any).lastInsertRowid || (result as any).insertId || Date.now();
        const insertedTitle = newNews?.title || title.trim();
        const insertedCategory = newNews?.category || normalizedCategory;

        return c.json({
            success: true,
            message: '뉴스가 성공적으로 등록되었습니다.',
            article: {
                id: insertedId,
                title: insertedTitle,
                category: insertedCategory,
                aiSummary: finalAiSummary,
                thumbnail: finalThumbnail,
                articleUrl: `https://veranex.app/news/${insertedId}`,
                createdAt: newNews?.created_at || new Date().toISOString()
            }
        }, 201);
    } catch (error: any) {
        console.error('[Create News API Error]', error);
        return c.json({
            success: false,
            error: {
                code: 500,
                message: 'Failed to create news: ' + (error.message || 'Server error')
            }
        }, 500);
    }
};

import { bodyLimit } from 'hono/body-limit';

const handleUpdateNewsApi = async (c: any) => {
    const apiKeyHeader = c.req.header('x-api-key') || c.req.header('authorization')?.replace(/^Bearer\s+/i, '');
    const expectedKey = process.env.NEWS_API_KEY || 'vera-news-api-key-2026';

    const user = c.get('user');
    const isAuthorized = (apiKeyHeader && apiKeyHeader === expectedKey) || (user && (user.role === 'admin' || user.isAdmin));

    if (!isAuthorized) {
        return c.json({
            success: false,
            error: {
                code: 401,
                message: 'Unauthorized: Invalid or missing API Key. Please provide X-API-KEY header.'
            }
        }, 401);
    }

    const id = c.req.param('id');
    if (!id) {
        return c.json({ success: false, error: { code: 400, message: 'Article ID is required.' } }, 400);
    }

    try {
        const body = await c.req.json();
        const {
            title,
            content,
            summary,
            aiSummary,
            ai_summary,
            category,
            imageUrl,
            thumbnail,
            tags
        } = body;

        const existing = await pool.query('SELECT * FROM news WHERE id = $1', [id]);
        if (!existing.rows || existing.rows.length === 0) {
            return c.json({ success: false, error: { code: 404, message: 'Article not found.' } }, 404);
        }
        const curr = existing.rows[0];

        const targetTitle = title ? title.trim() : curr.title;
        const targetContent = content ? content.trim() : curr.content;
        const targetSummary = summary ? summary.trim() : (content ? content.replace(/<[^>]*>/g, '').substring(0, 160).trim() : curr.summary);
        const targetCategory = category ? normalizeNewsCategory(category) : curr.category;
        const targetThumbnail = imageUrl || thumbnail || curr.thumbnail;
        const targetTags = tags ? (Array.isArray(tags) ? tags.join(',') : tags) : curr.tags;

        const rawAiSummary = aiSummary !== undefined ? aiSummary : ai_summary;
        let finalAiSummary = curr.ai_summary;
        if (rawAiSummary !== undefined) {
            if (Array.isArray(rawAiSummary)) {
                const cleanItems = rawAiSummary
                    .filter(Boolean)
                    .map(s => String(s).trim().replace(/^(?:[•\-\*]|\d+[\.\)])\s*/, '').trim())
                    .filter(s => s.length > 0)
                    .slice(0, 3);
                if (cleanItems.length > 0) {
                    finalAiSummary = cleanItems.map(s => `• ${s}`).join('\n');
                }
            } else if (typeof rawAiSummary === 'string' && rawAiSummary.trim().length > 0) {
                const lines = rawAiSummary
                    .split(/\n+/)
                    .map(l => l.trim().replace(/^(?:[•\-\*]|\d+[\.\)])\s*/, '').trim())
                    .filter(l => l.length > 0)
                    .slice(0, 3);
                if (lines.length > 0) {
                    finalAiSummary = lines.map(l => `• ${l}`).join('\n');
                } else {
                    finalAiSummary = rawAiSummary.trim();
                }
            }
        }

        await pool.query(`
            UPDATE news
            SET title = $1, summary = $2, content = $3, category = $4,
                thumbnail = $5, ai_summary = $6, tags = $7,
                ai_processed = 1
            WHERE id = $8
        `, [
            targetTitle,
            targetSummary,
            targetContent,
            targetCategory,
            targetThumbnail,
            finalAiSummary,
            targetTags,
            id
        ]);

        return c.json({
            success: true,
            message: '뉴스가 성공적으로 업데이트되었습니다.',
            article: {
                id: Number(id),
                title: targetTitle,
                category: targetCategory,
                aiSummary: finalAiSummary,
                thumbnail: targetThumbnail,
                articleUrl: `https://veranex.app/news/${id}`
            }
        });
    } catch (error: any) {
        console.error('[Update News API Error]', error);
        return c.json({
            success: false,
            error: {
                code: 500,
                message: 'Failed to update news: ' + (error.message || 'Server error')
            }
        }, 500);
    }
};

news.post('/api/news/upload-image', bodyLimit({ maxSize: 10 * 1024 * 1024 }), handleUploadNewsImage);
news.post('/api/news/create', bodyLimit({ maxSize: 10 * 1024 * 1024 }), handleCreateNewsApi);
news.post('/api/news', bodyLimit({ maxSize: 10 * 1024 * 1024 }), handleCreateNewsApi);
news.post('/api/news/write', bodyLimit({ maxSize: 10 * 1024 * 1024 }), handleCreateNewsApi);
news.put('/api/news/:id', bodyLimit({ maxSize: 10 * 1024 * 1024 }), handleUpdateNewsApi);

export { handleCreateNewsApi, handleUpdateNewsApi, handleUploadNewsImage };
export default news;
