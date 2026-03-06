import { Hono } from 'hono'
import { getDB } from '../../db/adapter'
import { findRelatedStocks, getStockNameByTicker, getKeywordsByTicker } from '../../utils/stockMapper'
import { fetchBatchStockData } from '../../utils/stockDataFetcher'
import {
    requireAuth,
    SessionUser
} from '../../middleware/auth'
import { escapeHtml } from '../../utils/htmlEscape'
import { getCategoryName, getCategoryColor, getTimeAgo } from '../../utils/formatter'
import { fetchAndSaveNews } from '../../services/newsCollector'
import { MyPageController } from '../../controllers/mypage.controller'
import type { Bindings, Variables } from '../../types'

// Yahoo Finance API 응답 타입 정의
interface YahooFinanceChartResult {
    meta: {
        currency: string;
        symbol: string;
        exchangeName: string;
        instrumentType: string;
        firstTradeDate: number;
        regularMarketTime: number;
        gmtoffset: number;
        timezone: string;
        exchangeTimezoneName: string;
        regularMarketPrice: number;
        chartPreviousClose: number;
        previousClose: number;
        scaleLastMarketPrice: boolean;
        priceHint: number;
        currentTradingPeriod: {
            pre: { timezone: string; start: number; end: number; gmtoffset: number };
            regular: { timezone: string; start: number; end: number; gmtoffset: number };
            post: { timezone: string; start: number; end: number; gmtoffset: number };
        };
        dataGranularity: string;
        range: string;
        validRanges: string[];
        longName?: string;
        shortName?: string;
        marketState?: string;
    };
    timestamp?: number[];
    indicators?: {
        quote?: {
            open: number[];
            low: number[];
            high: number[];
            close: number[];
            volume: number[];
        }[];
    };
}

interface YahooFinanceChartResponse {
    chart: {
        result?: YahooFinanceChartResult[];
        error?: any;
    };
}

const newsRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// ==================== 뉴스 API 핸들러 ====================

// 뉴스 목록 조회
newsRoutes.get('/api/news', async (c) => {
    const DB = getDB(c)
    const category = c.req.query('category')
    const limit = parseInt(c.req.query('limit') || '20')
    const offset = parseInt(c.req.query('offset') || '0')
    const includeStocks = c.req.query('includeStocks') === 'true'

    try {
        let query = 'SELECT * FROM news'
        const params: any[] = []

        if (category && category !== 'all') {
            query += ' WHERE category = ?'
            params.push(category)
        }

        query += ' ORDER BY published_at DESC, created_at DESC LIMIT ? OFFSET ?'
        params.push(limit, offset)

        const { results } = await DB.prepare(query).bind(...params).all()

        if (includeStocks) {
            const newsWithStocks = await Promise.all(
                results.map(async (news: any) => {
                    const searchText = `${news.title || ''} ${news.description || ''} ${news.tags || ''}`
                    const publisherMatch = news.title.match(/\s*-\s*([가-힣a-zA-Z0-9\s]+)$/);
                    if (publisherMatch) {
                        let cleanTitle = news.title.replace(/\s*-\s*[가-힣a-zA-Z0-9\s]+$/, '').trim();
                        let extractedPublisher = publisherMatch[1].trim();
                    }
                    const relatedTickers = findRelatedStocks(searchText, '', '', 3)

                    if (relatedTickers.length === 0) {
                        return { ...news, relatedStocks: [] }
                    }

                    const stockData = await fetchBatchStockData(relatedTickers)
                    return { ...news, relatedStocks: stockData }
                })
            )

            return c.json({
                success: true,
                news: newsWithStocks,
                count: newsWithStocks.length
            })
        } else {
            return c.json({
                success: true,
                news: results,
                count: results.length
            })
        }
    } catch (error) {
        console.error('뉴스 조회 오류:', error)
        return c.json({ error: '뉴스 조회 실패' }, 500)
    }
})

// 뉴스 상세 조회
newsRoutes.get('/api/news/:id{[0-9]+}', async (c) => {
    try {
        const id = c.req.param('id')
        const DB = getDB(c)

        const result = await DB.prepare('SELECT * FROM news WHERE id = ?').bind(id).first()

        if (!result) {
            return c.json({ success: false, message: 'News not found' }, 404)
        }

        return c.json({ success: true, news: result })
    } catch (error) {
        console.error('News detail API error:', error)
        return c.json({ success: false, message: 'Failed to fetch news' }, 500)
    }
})

// 뉴스 생성
newsRoutes.post('/api/news', async (c) => {
    try {
        const DB = getDB(c)
        const data = await c.req.json()
        const { category, title, summary, link, image_url, publisher, content, thumbnail, tags, author, source, source_url, description } = data

        if (!category || !title || !link) {
            return c.json({ success: false, message: 'Required fields: category, title, link' }, 400)
        }

        const tagsJson = Array.isArray(tags) ? JSON.stringify(tags) : tags

        const result = await DB.prepare(`
            INSERT INTO news (category, title, summary, link, image_url, publisher, published_at, content, thumbnail, tags, author, source, source_url, description)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            category, title, summary || '', link, image_url || thumbnail || '',
            publisher || source || '', content || '', thumbnail || image_url || '',
            tagsJson || '[]', author || '', source || publisher || '',
            source_url || link, description || summary || ''
        ).run()

        return c.json({
            success: true,
            id: result.meta.last_row_id,
            message: 'News created successfully'
        })
    } catch (error) {
        console.error('News create API error:', error)
        return c.json({ success: false, message: 'Failed to create news' }, 500)
    }
})

// 뉴스 수정
newsRoutes.put('/api/news/:id', async (c) => {
    try {
        const id = c.req.param('id')
        const DB = getDB(c)
        const data = await c.req.json()
        const { category, title, summary, link, image_url, publisher, content, thumbnail, tags, author, source, source_url, description } = data

        const tagsJson = Array.isArray(tags) ? JSON.stringify(tags) : (tags || '[]')

        const result = await DB.prepare(`
            UPDATE news SET
                category = ?, title = ?, summary = ?, link = ?, image_url = ?,
                publisher = ?, content = ?, thumbnail = ?, tags = ?, author = ?,
                source = ?, source_url = ?, description = ?, updated_at = datetime('now')
            WHERE id = ?
        `).bind(
            category, title, summary || '', link, image_url || thumbnail || '',
            publisher || source || '', content || '', thumbnail || image_url || '',
            tagsJson, author || '', source || publisher || '',
            source_url || link, description || summary || '', id
        ).run()

        if (result.meta.changes === 0) {
            return c.json({ success: false, message: 'News not found' }, 404)
        }

        return c.json({ success: true, message: 'News updated successfully' })
    } catch (error) {
        console.error('News update API error:', error)
        return c.json({ success: false, message: 'Failed to update news' }, 500)
    }
})

// 뉴스 삭제
newsRoutes.delete('/api/news/:id', async (c) => {
    try {
        const id = c.req.param('id')
        const DB = getDB(c)
        const result = await DB.prepare('DELETE FROM news WHERE id = ?').bind(id).run()

        if (result.meta.changes === 0) {
            return c.json({ success: false, message: 'News not found' }, 404)
        }

        return c.json({ success: true, message: 'News deleted successfully' })
    } catch (error) {
        console.error('News delete API error:', error)
        return c.json({ success: false, message: 'Failed to delete news' }, 500)
    }
})

// 키워드 검색
newsRoutes.get('/api/news/search', async (c) => {
    try {
        const { q, limit = '20', offset = '0' } = c.req.query()
        const DB = getDB(c)

        if (!q) {
            return c.json({ success: false, message: 'Search query required' }, 400)
        }

        const pattern = `%${q}%`
        const { results } = await DB.prepare(`
            SELECT * FROM news 
            WHERE title LIKE ? OR summary LIKE ? OR description LIKE ? OR tags LIKE ?
            ORDER BY published_at DESC, created_at DESC 
            LIMIT ? OFFSET ?
        `).bind(pattern, pattern, pattern, pattern, parseInt(limit), parseInt(offset)).all()

        return c.json({
            success: true,
            news: results,
            count: results.length
        })
    } catch (error) {
        console.error('News search API error:', error)
        return c.json({ success: false, message: 'Failed to search news' }, 500)
    }
})

// 종목별 관련 뉴스 검색
newsRoutes.get('/api/news/search/by-keywords', async (c) => {
    try {
        const { keywords, limit = '5' } = c.req.query()
        const DB = getDB(c)

        if (!keywords) {
            return c.json({ success: false, message: 'Keywords parameter required' }, 400)
        }

        const keywordArray = keywords.split(',').map(k => k.trim())
        const conditions = keywordArray.map(() => '(title LIKE ? OR description LIKE ? OR content LIKE ? OR tags LIKE ?)').join(' OR ')
        const params: any[] = []
        keywordArray.forEach(keyword => {
            const pattern = '%' + keyword + '%'
            params.push(pattern, pattern, pattern, pattern)
        })

        const query = `SELECT * FROM news WHERE ${conditions} ORDER BY published_at DESC, created_at DESC LIMIT ?`
        params.push(parseInt(limit))

        const { results } = await DB.prepare(query).bind(...params).all()

        return c.json({
            success: true,
            count: results.length,
            news: results
        })
    } catch (error) {
        console.error('News search API error:', error)
        return c.json({ success: false, message: 'Failed to search news' }, 500)
    }
})

// 종목별 관련 뉴스 조회 (주식 상세용)
newsRoutes.get('/api/stock/:ticker/news', async (c) => {
    try {
        const ticker = c.req.param('ticker')
        const { limit = '5' } = c.req.query()
        const DB = getDB(c)

        const stockName = getStockNameByTicker(ticker)
        const keywords = getKeywordsByTicker(ticker)

        if (!stockName || keywords.length === 0) {
            return c.json({
                success: false, message: 'Invalid ticker or no keywords found',
                ticker, stockName: null, count: 0, news: []
            }, 400)
        }

        const conditions = keywords.map(() => '(title LIKE ? OR description LIKE ? OR content LIKE ? OR tags LIKE ?)').join(' OR ')
        const params: any[] = []
        keywords.forEach(keyword => {
            const pattern = '%' + keyword + '%'
            params.push(pattern, pattern, pattern, pattern)
        })

        const query = `SELECT * FROM news WHERE ${conditions} ORDER BY published_at DESC, created_at DESC LIMIT ?`
        params.push(parseInt(limit))

        const { results } = await DB.prepare(query).bind(...params).all()

        return c.json({
            success: true, ticker, stockName, count: results.length, news: results
        })
    } catch (error) {
        console.error('Stock news API error:', error)
        return c.json({ success: false, message: 'Failed to fetch stock news' }, 500)
    }
})

// 뉴스 요약 API
newsRoutes.post('/api/news/:id/summarize', async (c) => {
    try {
        const { id } = c.req.param()
        const DB = getDB(c)
        const news = await DB.prepare('SELECT * FROM news WHERE id = ?').bind(id).first()

        if (!news) {
            return c.json({ success: false, error: '뉴스를 찾을 수 없습니다' }, 404)
        }

        if (news.ai_processed) {
            return c.json({
                success: true, ai_summary: news.ai_summary, sentiment: news.sentiment
            })
        }

        const { aiSummary, sentiment } = await summarizeWithGemini(news.title as string, (news.summary || '') as string)

        await DB.prepare(`UPDATE news SET ai_summary = ?, sentiment = ?, ai_processed = 1 WHERE id = ?`)
            .bind(aiSummary, sentiment, id).run()

        return c.json({ success: true, ai_summary: aiSummary, sentiment: sentiment })
    } catch (error) {
        console.error('뉴스 요약 오류:', error)
        return c.json({ success: false, error: '요약 생성 실패' }, 500)
    }
})

// 투표 관련 API
newsRoutes.post('/api/news/:id/vote', requireAuth, async (c) => {
    try {
        const user = c.get('user') as SessionUser
        const { id } = c.req.param()
        const { type } = await c.req.json()
        const DB = getDB(c)

        if (type !== 'up' && type !== 'down') {
            return c.json({ success: false, error: '잘못된 투표 타입입니다' }, 400)
        }

        const existingVote = await DB.prepare('SELECT * FROM news_votes WHERE news_id = ? AND user_id = ?')
            .bind(id, user.id).first()

        if (existingVote) {
            if (existingVote.vote_type === type) {
                await DB.prepare('DELETE FROM news_votes WHERE id = ?').bind(existingVote.id).run()
                const field = type === 'up' ? 'vote_up' : 'vote_down'
                await DB.prepare(`UPDATE news SET ${field} = ${field} - 1 WHERE id = ?`).bind(id).run()
                return c.json({ success: true, action: 'cancelled', type })
            } else {
                await DB.prepare('UPDATE news_votes SET vote_type = ? WHERE id = ?').bind(type, existingVote.id).run()
                const oldField = existingVote.vote_type === 'up' ? 'vote_up' : 'vote_down'
                const newField = type === 'up' ? 'vote_up' : 'vote_down'
                await DB.prepare(`UPDATE news SET ${oldField} = ${oldField} - 1, ${newField} = ${newField} + 1 WHERE id = ?`).bind(id).run()
                return c.json({ success: true, action: 'changed', type })
            }
        }

        const userIp = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || '127.0.0.1'
        await DB.prepare(`INSERT INTO news_votes (news_id, user_id, user_ip, vote_type) VALUES (?, ?, ?, ?)`)
            .bind(id, user.id, userIp, type).run()

        const field = type === 'up' ? 'vote_up' : 'vote_down'
        await DB.prepare(`UPDATE news SET ${field} = ${field} + 1 WHERE id = ?`).bind(id).run()
        const scoreChange = type === 'up' ? 2 : -1
        await DB.prepare(`UPDATE news SET popularity_score = popularity_score + ? WHERE id = ?`).bind(scoreChange, id).run()

        return c.json({ success: true, action: 'voted', type })
    } catch (error) {
        console.error('투표 처리 오류:', error)
        return c.json({ success: false, error: '투표 처리 실패' }, 500)
    }
})

newsRoutes.get('/api/news/:id/votes', async (c) => {
    try {
        const { id } = c.req.param()
        const DB = getDB(c)
        const news = await DB.prepare(`SELECT vote_up, vote_down, popularity_score FROM news WHERE id = ?`)
            .bind(id).first()

        if (!news) return c.json({ success: false, error: '뉴스를 찾을 수 없습니다' }, 404)

        return c.json({
            success: true,
            vote_up: news.vote_up || 0,
            vote_down: news.vote_down || 0,
            popularity_score: news.popularity_score || 0
        })
    } catch (error) {
        console.error('투표 조회 오류:', error)
        return c.json({ success: false, error: '투표 조회 실패' }, 500)
    }
})

// 실시간 HOT 이슈 조회
newsRoutes.get('/api/news/hot', async (c) => {
    try {
        const limit = parseInt(c.req.query('limit') || '10')
        const DB = getDB(c)

        const { results } = await DB.prepare(`
            SELECT * FROM news 
            WHERE created_at >= datetime('now', '-7 days')
            ORDER BY popularity_score DESC, created_at DESC 
            LIMIT ?
        `).bind(limit).all()

        return c.json({
            success: true,
            news: results || []
        })
    } catch (error) {
        console.error('HOT 뉴스 조회 오류:', error)
        return c.json({ success: false, error: 'HOT 뉴스 조회 실패' }, 500)
    }
})

// 북마크 상태 확인
newsRoutes.get('/api/bookmarks/check', async (c) => {
    try {
        const userId = c.req.query('userId')
        const newsId = c.req.query('newsId')
        const DB = getDB(c)

        if (!userId || !newsId) {
            return c.json({ success: false, error: 'userId와 newsId가 필요합니다' }, 400)
        }

        const bookmark = await DB.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND news_id = ?')
            .bind(userId, newsId).first()

        return c.json({
            success: true,
            bookmarked: !!bookmark
        })
    } catch (error) {
        console.error('북마크 확인 오류:', error)
        return c.json({ success: false, error: '북마크 확인 실패' }, 500)
    }
})

// 북마크 목록 조회
newsRoutes.get('/api/bookmarks', async (c) => {
    try {
        const userId = c.req.query('userId')
        const DB = getDB(c)

        if (!userId) {
            return c.json({ success: false, error: 'userId가 필요합니다' }, 400)
        }

        const { results } = await DB.prepare(`
            SELECT n.* FROM news n
            JOIN bookmarks b ON n.id = b.news_id
            WHERE b.user_id = ?
            ORDER BY b.id DESC
        `).bind(userId).all()

        return c.json({
            success: true,
            bookmarks: results || []
        })
    } catch (error) {
        console.error('북마크 조회 오류:', error)
        return c.json({ success: false, error: '북마크 조회 실패' }, 500)
    }
})

// 북마크 추가
newsRoutes.post('/api/bookmarks', async (c) => {
    try {
        const { userId, newsId } = await c.req.json()
        const DB = getDB(c)

        if (!userId || !newsId) {
            return c.json({ success: false, error: 'userId와 newsId가 필요합니다' }, 400)
        }

        await DB.prepare('INSERT OR IGNORE INTO bookmarks (user_id, news_id) VALUES (?, ?)')
            .bind(userId, newsId).run()

        return c.json({ success: true, message: '북마크됨' })
    } catch (error) {
        console.error('북마크 추가 오류:', error)
        return c.json({ success: false, error: '북마크 추가 실패' }, 500)
    }
})

// 북마크 삭제
newsRoutes.delete('/api/bookmarks/:newsId', async (c) => {
    try {
        const newsId = c.req.param('newsId')
        const userId = c.req.query('userId')
        const DB = getDB(c)

        if (!userId) {
            return c.json({ success: false, error: 'userId가 필요합니다' }, 400)
        }

        await DB.prepare('DELETE FROM bookmarks WHERE user_id = ? AND news_id = ?')
            .bind(userId, newsId).run()

        return c.json({ success: true, message: '북마크 삭제됨' })
    } catch (error) {
        console.error('북마크 삭제 오류:', error)
        return c.json({ success: false, error: '북마크 삭제 실패' }, 500)
    }
})

// 조회수 증가
newsRoutes.post('/api/news/:id/view', async (c) => {
    try {
        const { id } = c.req.param()
        const DB = getDB(c)

        await DB.prepare('UPDATE news SET view_count = view_count + 1, popularity_score = popularity_score + 1 WHERE id = ?')
            .bind(id).run()

        const news = await DB.prepare('SELECT view_count FROM news WHERE id = ?').bind(id).first()

        return c.json({
            success: true,
            view_count: (news as any)?.view_count || 0
        })
    } catch (error) {
        console.error('조회수 증가 오류:', error)
        return c.json({ success: false, error: '조회수 증가 실패' }, 500)
    }
})

// === 키워드 API (뉴스 페이지용 별칭) ===
newsRoutes.get('/api/keywords', requireAuth, MyPageController.getKeywords)
newsRoutes.post('/api/keywords/subscribe', requireAuth, MyPageController.addKeyword)
newsRoutes.delete('/api/keywords/:keywordId', requireAuth, MyPageController.deleteKeyword)

// 키워드 기반 뉴스 조회
newsRoutes.get('/api/news/my-keywords', requireAuth, MyPageController.getNewsByMyKeywords)

// 뉴스 수동 수집 (관리자)
newsRoutes.post('/api/admin/news/fetch', async (c) => {
    console.log('뉴스 수동 수집 요청 받음')
    fetchAndSaveNews().catch(err => console.error('수동 수집 실행 중 오류:', err))
    return c.json({ success: true, message: '뉴스 수집 작업이 시작되었습니다. 서버 로그를 확인하세요.' })
})

// 뉴스 가져오기 및 DB 저장
newsRoutes.get('/api/news/fetch', async (c) => {
    const DB = getDB(c)
    const category = c.req.query('category') || 'general'

    try {
        let newsItems: any[] = []
        let retryCount = 0
        const maxRetries = 3

        while (retryCount < maxRetries && newsItems.length === 0) {
            try {
                newsItems = await parseGoogleNewsRSS(category)
                if (newsItems.length > 0) break
            } catch (err) {
                console.error(`뉴스 가져오기 시도 ${retryCount + 1}/${maxRetries} 실패:`, err)
            }
            retryCount++
            if (retryCount < maxRetries) await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
        }

        if (newsItems.length === 0) {
            const { results } = await DB.prepare(`SELECT * FROM news WHERE category = ? ORDER BY created_at DESC LIMIT 20`)
                .bind(category).all()
            if (results && results.length > 0) {
                return c.json({ success: true, fetched: 0, saved: 0, cached: results.length, message: '최신 뉴스를 가져올 수 없어 캐시된 뉴스를 표시합니다.', fallback: true })
            }
            return c.json({ error: '뉴스를 가져올 수 없습니다. 잠시 후 다시 시도해주세요.', fallback: false }, 503)
        }

        let savedCount = 0
        for (const item of newsItems) {
            try {
                await DB.prepare(`INSERT OR IGNORE INTO news (category, title, summary, link, source, published_at) VALUES (?, ?, ?, ?, ?, ?)`)
                    .bind(item.category, item.title, item.summary, item.link, item.publisher, item.published_at).run()
                savedCount++
            } catch (err) { console.error('뉴스 저장 오류:', err) }
        }

        return c.json({ success: true, fetched: newsItems.length, saved: savedCount, message: `${savedCount}개의 새 뉴스를 저장했습니다.`, fallback: false })
    } catch (error) {
        console.error('뉴스 가져오기 오류:', error)
        return c.json({ error: '뉴스 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.', fallback: false }, 503)
    }
})

// 스케줄 설정
newsRoutes.get('/api/news/schedule', async (c) => {
    const DB = getDB(c)
    try {
        const { results } = await DB.prepare('SELECT * FROM news_schedule WHERE id = 1').all()
        const schedule = results?.[0] || { enabled: 1, schedule_type: 'hourly', interval_hours: 1 }
        return c.json({ success: true, schedule })
    } catch (error) {
        console.error('스케줄 설정 조회 오류:', error)
        return c.json({ error: '스케줄 설정 조회 실패' }, 500)
    }
})

// 스케줄 설정 저장
newsRoutes.post('/api/news/schedule', async (c) => {
    const DB = getDB(c)
    try {
        const body = await c.req.json()
        const { enabled, schedule_type, schedule_time, interval_hours } = body

        let next_run = null
        if (enabled) {
            next_run = calculateNextRun(schedule_type, schedule_time, interval_hours)
        }

        await DB.prepare(`
            UPDATE news_schedule SET 
                enabled = ?, 
                schedule_type = ?, 
                schedule_time = ?, 
                interval_hours = ?, 
                next_run = ?, 
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = 1
        `).bind(enabled ? 1 : 0, schedule_type, schedule_time, interval_hours, next_run).run()

        return c.json({ success: true, message: '스케줄 설정이 저장되었습니다.', next_run })
    } catch (error) {
        console.error('스케줄 설정 저장 오류:', error)
        return c.json({ error: '스케줄 설정 저장 실패' }, 500)
    }
})

// 스케줄 실행 기록 업데이트
newsRoutes.post('/api/news/schedule/update-run', async (c) => {
    const DB = getDB(c)
    try {
        const { results } = await DB.prepare('SELECT * FROM news_schedule WHERE id = 1').all()
        const schedule = results?.[0]

        if (!schedule) {
            return c.json({ success: false, error: '스케줄 설정을 찾을 수 없습니다.' }, 404)
        }

        const now = new Date().toISOString()
        const next_run = calculateNextRun(schedule.schedule_type, schedule.schedule_time, schedule.interval_hours)

        await DB.prepare(`
            UPDATE news_schedule SET 
                last_run = ?, 
                next_run = ?, 
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = 1
        `).bind(now, next_run).run()

        return c.json({ success: true, last_run: now, next_run })
    } catch (error) {
        console.error('스케줄 실행 기록 업데이트 오류:', error)
        return c.json({ error: '기록 업데이트 실패' }, 500)
    }
})

// 다음 실행 시간 계산 헬퍼 함수
function calculateNextRun(type: string, time: string, interval: number): string {
    const now = new Date()

    if (type === 'hourly') {
        const next = new Date(now.getTime() + (interval || 1) * 60 * 60 * 1000)
        return next.toISOString()
    } else if (type === 'daily' && time) {
        const [h, m] = time.split(':').map(Number)
        // 한국 시간 기준 계산 (UTC+9)
        const kTime = new Date(now.getTime() + (9 * 60 * 60 * 1000))
        const nextRun = new Date(kTime)
        nextRun.setHours(h, m, 0, 0)

        if (nextRun <= kTime) {
            nextRun.setDate(nextRun.getDate() + 1)
        }

        // 다시 UTC로 변환하여 저장
        return new Date(nextRun.getTime() - (9 * 60 * 60 * 1000)).toISOString()
    }

    // 기본값: 1시간 뒤
    return new Date(now.getTime() + 60 * 60 * 1000).toISOString()
}

// 관련 종목 찾기 (기사 텍스트 기반)
newsRoutes.post('/api/news/find-related-stocks', async (c) => {
    try {
        const { title, content, tags } = await c.req.json()
        const combinedText = [title || '', content || '', ...(Array.isArray(tags) ? tags : (tags ? [tags] : []))].join(' ')
        const tickers = findRelatedStocks(combinedText, '', '', 2)

        if (tickers.length === 0) return c.json({ success: true, stocks: [], message: 'No related stocks found' })

        const stockPromises = tickers.map(async (ticker) => {
            try {
                const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`
                const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
                if (!response.ok) return null
                const data = await response.json() as YahooFinanceChartResponse
                if (!data?.chart?.result?.[0]) return null
                const meta = data.chart.result[0].meta
                const currentPrice = meta.regularMarketPrice || meta.previousClose
                const previousClose = meta.chartPreviousClose || meta.previousClose
                const change = currentPrice - previousClose
                return {
                    ticker, name: getStockNameByTicker(ticker), price: currentPrice, change,
                    changePercent: (change / previousClose) * 100, status: change >= 0 ? 'up' : 'down',
                    marketState: meta.marketState || 'REGULAR', currency: meta.currency
                }
            } catch (error) { return null }
        })

        const results = await Promise.all(stockPromises)
        const validStocks = results.filter(s => s !== null)
        return c.json({ success: true, count: validStocks.length, stocks: validStocks })
    } catch (error) {
        return c.json({ success: false, message: 'Failed to find related stocks' }, 500)
    }
})

// 헬퍼 함수
async function parseGoogleNewsRSS(category: string = 'general'): Promise<any[]> {
    const rssUrls: Record<string, string> = {
        'general': 'https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko',
        'politics': 'https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNRFZ4ZERBU0FtdHZLQUFQAQ?hl=ko&gl=KR&ceid=KR:ko',
        'economy': 'https://news.google.com/rss/topics/CAAqIggKIhxDQkFTRHdvSkwyMHZNR2RtY0hNekVnSnJieWdBUAE?hl=ko&gl=KR&ceid=KR:ko',
        'tech': 'https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNRGRqTVhZU0FtdHZLQUFQAQ?hl=ko&gl=KR&ceid=KR:ko',
        'sports': 'https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNRFp1ZEdvU0FtdHZLQUFQAQ?hl=ko&gl=KR&ceid=KR:ko',
        'entertainment': 'https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNREpxYW5RU0FtdHZLQUFQAQ?hl=ko&gl=KR&ceid=KR:ko',
    }
    const url = rssUrls[category] || rssUrls['general']

    function decodeHtmlEntities(text: string): string {
        const entities: Record<string, string> = {
            '&lt;': '<', '&gt;': '>', '&amp;': '&', '&quot;': '"', '&#39;': "'", '&apos;': "'",
            '&nbsp;': ' ', '&copy;': '©', '&reg;': '®', '&trade;': '™', '&hellip;': '...',
            '&mdash;': '—', '&ndash;': '–', '&bull;': '•', '&middot;': '·',
        }
        return text.replace(/&[#\w]+;/g, (entity) => entities[entity] || '')
    }

    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/rss+xml', 'Referer': 'https://news.google.com/' },
        })
        if (!response.ok) return []
        const text = await response.text()
        const items: any[] = []
        const itemRegex = /<item>([\s\S]*?)<\/item>/g
        let match
        while ((match = itemRegex.exec(text)) !== null) {
            const itemContent = match[1]
            const title = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || itemContent.match(/<title>(.*?)<\/title>/)?.[1] || ''
            let link = itemContent.match(/<link>(.*?)<\/link>/)?.[1] || ''
            const pubDate = itemContent.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
            let description = decodeHtmlEntities(itemContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || itemContent.match(/<description>(.*?)<\/description>/)?.[1] || '')
            const summary = description.replace(/<[^>]*>/g, '').trim().substring(0, 150)
            items.push({ category, title: title.trim(), summary: summary || title, link: link.trim(), publisher: '구글 뉴스', published_at: pubDate })
            if (items.length >= 20) break
        }
        return items
    } catch (error) { return [] }
}

async function summarizeWithGemini(title: string, summary: string): Promise<{ aiSummary: string, sentiment: string }> {
    try {
        const GEMINI_API_KEY = 'AIzaSyBKN3R7vG_L7RpQhxO8uZUTL-vfZGx0234'
        const prompt = `다음 뉴스를 요약(3줄)하고 감정(positive/negative/neutral)을 분석해주세요. 제목: ${title} 내용: ${summary}`
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        })
        if (!response.ok) return { aiSummary: summary.substring(0, 150), sentiment: 'neutral' }
        const data = await response.json() as any
        const text = data.candidates[0]?.content?.parts[0]?.text || ''
        return { aiSummary: text.substring(0, 300), sentiment: 'neutral' } // Simplification
    } catch (error) { return { aiSummary: summary.substring(0, 150), sentiment: 'neutral' } }
}
export { newsRoutes, parseGoogleNewsRSS }
