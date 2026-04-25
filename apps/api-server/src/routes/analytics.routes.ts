import { Hono } from 'hono'
import { getDB } from '../db/adapter.js'
import { requireAdmin } from './admin.routes.js'

const analyticsRoutes = new Hono()

// ==================== 페이지뷰 기록 (인증 불필요) ====================
analyticsRoutes.post('/api/analytics/pageview', async (c) => {
    const DB = getDB(c)
    try {
        const body = await c.req.json()
        const { sessionId, path, referrer, screenWidth, durationMs, userId } = body

        if (!path || !sessionId) {
            return c.json({ success: false, message: '필수 데이터 누락' }, 400)
        }

        const userAgent = c.req.header('User-Agent') || ''
        const forwarded = c.req.header('X-Forwarded-For')
        const ip = forwarded ? forwarded.split(',')[0].trim() : (c.req.header('X-Real-IP') || '0.0.0.0')

        await DB.prepare(
            'INSERT INTO page_views (session_id, user_id, path, referrer, user_agent, ip_address, screen_width, duration_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(
            sessionId,
            userId || null,
            path,
            referrer || null,
            userAgent,
            ip,
            screenWidth || null,
            durationMs || 0
        ).run()

        return c.json({ success: true })
    } catch (error: unknown) {
        console.error('PageView tracking error:', error)
        return c.json({ success: true }) // 트래킹 실패해도 사용자 경험에 영향 없음
    }
})

// ==================== 체류시간 업데이트 ====================
analyticsRoutes.post('/api/analytics/duration', async (c) => {
    const DB = getDB(c)
    try {
        const { sessionId, path, durationMs } = await c.req.json()
        if (!sessionId || !path) return c.json({ success: true })

        await DB.prepare(
            'UPDATE page_views SET duration_ms = ? WHERE session_id = ? AND path = ? AND duration_ms < ? ORDER BY created_at DESC LIMIT 1'
        ).bind(durationMs || 0, sessionId, path, durationMs || 0).run()

        return c.json({ success: true })
    } catch (error: unknown) {
        return c.json({ success: true })
    }
})

// ==================== 관리자: 전체 개요 ====================
analyticsRoutes.get('/api/admin/analytics/overview', requireAdmin, async (c) => {
    const DB = getDB(c)
    const period = c.req.query('period') || '7' // 일수
    const days = parseInt(period)

    try {
        // 오늘 기준 집계 (원본 page_views)
        const todayViews = await DB.prepare(
            "SELECT COUNT(*) as total, COUNT(DISTINCT session_id) as unique_visitors FROM page_views WHERE DATE(created_at) = DATE('now')"
        ).first() as Record<string, number> | null

        // 기간 기준 집계 (원본 + 집계 테이블 합산)
        const periodRaw = await DB.prepare(
            `SELECT COUNT(*) as total, COUNT(DISTINCT session_id) as unique_visitors FROM page_views WHERE created_at >= DATE('now', '-${days} days')`
        ).first() as Record<string, number> | null

        const periodDaily = await DB.prepare(
            `SELECT COALESCE(SUM(total_views), 0) as total, COALESCE(SUM(unique_sessions), 0) as unique_visitors FROM page_views_daily WHERE date >= DATE('now', '-${days} days') AND date < (SELECT COALESCE(MIN(DATE(created_at)), DATE('now')) FROM page_views)`
        ).first() as Record<string, number> | null

        const totalViews = (periodRaw?.total || 0) + (periodDaily?.total || 0)
        const uniqueVisitors = (periodRaw?.unique_visitors || 0) + (periodDaily?.unique_visitors || 0)

        // 이전 동기간 비교
        const prevRaw = await DB.prepare(
            `SELECT COUNT(*) as total, COUNT(DISTINCT session_id) as unique_visitors FROM page_views WHERE created_at >= DATE('now', '-${days * 2} days') AND created_at < DATE('now', '-${days} days')`
        ).first() as Record<string, number> | null

        const prevDaily = await DB.prepare(
            `SELECT COALESCE(SUM(total_views), 0) as total, COALESCE(SUM(unique_sessions), 0) as unique_visitors FROM page_views_daily WHERE date >= DATE('now', '-${days * 2} days') AND date < DATE('now', '-${days} days')`
        ).first() as Record<string, number> | null

        const prevViews = (prevRaw?.total || 0) + (prevDaily?.total || 0)
        const prevVisitors = (prevRaw?.unique_visitors || 0) + (prevDaily?.unique_visitors || 0)

        // 신규 가입
        const newSignups = await DB.prepare(
            `SELECT COUNT(*) as count FROM users WHERE created_at >= DATE('now', '-${days} days') AND status != 'deleted'`
        ).first() as Record<string, number> | null

        const prevSignups = await DB.prepare(
            `SELECT COUNT(*) as count FROM users WHERE created_at >= DATE('now', '-${days * 2} days') AND created_at < DATE('now', '-${days} days') AND status != 'deleted'`
        ).first() as Record<string, number> | null

        // 평균 체류 시간
        const avgDuration = await DB.prepare(
            `SELECT AVG(duration_ms) as avg_ms FROM page_views WHERE duration_ms > 0 AND created_at >= DATE('now', '-${days} days')`
        ).first() as Record<string, number> | null

        const prevAvgDuration = await DB.prepare(
            `SELECT AVG(duration_ms) as avg_ms FROM page_views WHERE duration_ms > 0 AND created_at >= DATE('now', '-${days * 2} days') AND created_at < DATE('now', '-${days} days')`
        ).first() as Record<string, number> | null

        return c.json({
            success: true,
            today: {
                views: todayViews?.total || 0,
                visitors: todayViews?.unique_visitors || 0
            },
            period: {
                days,
                views: totalViews,
                visitors: uniqueVisitors,
                viewsChange: prevViews > 0 ? Math.round(((totalViews - prevViews) / prevViews) * 1000) / 10 : 0,
                visitorsChange: prevVisitors > 0 ? Math.round(((uniqueVisitors - prevVisitors) / prevVisitors) * 1000) / 10 : 0,
            },
            signups: {
                count: newSignups?.count || 0,
                change: (prevSignups?.count || 0) > 0 ? Math.round((((newSignups?.count || 0) - (prevSignups?.count || 0)) / (prevSignups?.count || 1)) * 1000) / 10 : 0
            },
            avgDuration: {
                ms: Math.round(avgDuration?.avg_ms || 0),
                change: (prevAvgDuration?.avg_ms || 0) > 0 ? Math.round((((avgDuration?.avg_ms || 0) - (prevAvgDuration?.avg_ms || 0)) / (prevAvgDuration?.avg_ms || 1)) * 1000) / 10 : 0
            }
        })
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        console.error('Analytics overview error:', msg)
        return c.json({ success: false, message: msg }, 500)
    }
})

// ==================== 관리자: 방문자 추세 ====================
analyticsRoutes.get('/api/admin/analytics/visitors', requireAdmin, async (c) => {
    const DB = getDB(c)
    const days = parseInt(c.req.query('days') || '30')

    try {
        // 원본 데이터에서 일별 집계
        const rawTrend = await DB.prepare(
            `SELECT DATE(created_at) as date, COUNT(*) as views, COUNT(DISTINCT session_id) as visitors 
             FROM page_views WHERE created_at >= DATE('now', '-${days} days') 
             GROUP BY DATE(created_at) ORDER BY date`
        ).all()

        // 집계 테이블에서 보충
        const dailyTrend = await DB.prepare(
            `SELECT date, total_views as views, unique_sessions as visitors 
             FROM page_views_daily WHERE date >= DATE('now', '-${days} days') 
             AND date < (SELECT COALESCE(MIN(DATE(created_at)), DATE('now')) FROM page_views)
             ORDER BY date`
        ).all()

        // 합산
        const trendMap = new Map<string, { views: number; visitors: number }>()
        for (const row of (dailyTrend.results as Array<{ date: string; views: number; visitors: number }>)) {
            trendMap.set(row.date, { views: row.views, visitors: row.visitors })
        }
        for (const row of (rawTrend.results as Array<{ date: string; views: number; visitors: number }>)) {
            const existing = trendMap.get(row.date)
            if (existing) {
                trendMap.set(row.date, { views: existing.views + row.views, visitors: existing.visitors + row.visitors })
            } else {
                trendMap.set(row.date, { views: row.views, visitors: row.visitors })
            }
        }

        const trend = Array.from(trendMap.entries())
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => a.date.localeCompare(b.date))

        return c.json({ success: true, trend })
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        return c.json({ success: false, message: msg }, 500)
    }
})

// ==================== 관리자: 인기 페이지 ====================
analyticsRoutes.get('/api/admin/analytics/pages', requireAdmin, async (c) => {
    const DB = getDB(c)
    const days = parseInt(c.req.query('days') || '30')

    try {
        const pages = await DB.prepare(
            `SELECT path, COUNT(*) as views, COUNT(DISTINCT session_id) as visitors, 
             ROUND(AVG(CASE WHEN duration_ms > 0 THEN duration_ms END)) as avg_duration
             FROM page_views WHERE created_at >= DATE('now', '-${days} days')
             GROUP BY path ORDER BY views DESC LIMIT 20`
        ).all()

        return c.json({ success: true, pages: pages.results })
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        return c.json({ success: false, message: msg }, 500)
    }
})

// ==================== 관리자: 유입 경로 ====================
analyticsRoutes.get('/api/admin/analytics/referrers', requireAdmin, async (c) => {
    const DB = getDB(c)
    const days = parseInt(c.req.query('days') || '30')

    try {
        const referrers = await DB.prepare(
            `SELECT 
                CASE 
                    WHEN referrer IS NULL OR referrer = '' THEN '직접 접속'
                    WHEN referrer LIKE '%google%' THEN 'Google'
                    WHEN referrer LIKE '%naver%' THEN 'Naver'
                    WHEN referrer LIKE '%daum%' THEN 'Daum'
                    WHEN referrer LIKE '%bing%' THEN 'Bing'
                    WHEN referrer LIKE '%facebook%' OR referrer LIKE '%fb.%' THEN 'Facebook'
                    WHEN referrer LIKE '%instagram%' THEN 'Instagram'
                    WHEN referrer LIKE '%twitter%' OR referrer LIKE '%t.co%' THEN 'Twitter/X'
                    WHEN referrer LIKE '%youtube%' THEN 'YouTube'
                    WHEN referrer LIKE '%kakao%' THEN 'KakaoTalk'
                    ELSE '기타'
                END as source,
                COUNT(*) as views
             FROM page_views WHERE created_at >= DATE('now', '-${days} days')
             GROUP BY source ORDER BY views DESC`
        ).all()

        return c.json({ success: true, referrers: referrers.results })
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        return c.json({ success: false, message: msg }, 500)
    }
})

// ==================== 관리자: 기기 분석 ====================
analyticsRoutes.get('/api/admin/analytics/devices', requireAdmin, async (c) => {
    const DB = getDB(c)
    const days = parseInt(c.req.query('days') || '30')

    try {
        const devices = await DB.prepare(
            `SELECT 
                CASE 
                    WHEN screen_width IS NULL THEN '알 수 없음'
                    WHEN screen_width < 768 THEN '모바일'
                    WHEN screen_width < 1024 THEN '태블릿'
                    ELSE 'PC'
                END as device,
                COUNT(*) as views,
                COUNT(DISTINCT session_id) as visitors
             FROM page_views WHERE created_at >= DATE('now', '-${days} days')
             GROUP BY device ORDER BY views DESC`
        ).all()

        return c.json({ success: true, devices: devices.results })
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        return c.json({ success: false, message: msg }, 500)
    }
})

// ==================== 관리자: 콘텐츠 통합 통계 ====================
analyticsRoutes.get('/api/admin/analytics/content', requireAdmin, async (c) => {
    const DB = getDB(c)
    const days = parseInt(c.req.query('days') || '30')

    try {
        // 뉴스 통계
        let newsReads = { count: 0 } as Record<string, number>
        let newsVotes = { count: 0 } as Record<string, number>
        let newsBookmarks = { count: 0 } as Record<string, number>
        try {
            newsReads = await DB.prepare(`SELECT COUNT(*) as count FROM user_news_read WHERE created_at >= DATE('now', '-${days} days')`).first() as Record<string, number> || { count: 0 }
        } catch (_e: unknown) { /* 테이블 없을 수 있음 */ }
        try {
            newsVotes = await DB.prepare(`SELECT COUNT(*) as count FROM news_votes WHERE created_at >= DATE('now', '-${days} days')`).first() as Record<string, number> || { count: 0 }
        } catch (_e: unknown) { /* 테이블 없을 수 있음 */ }
        try {
            newsBookmarks = await DB.prepare(`SELECT COUNT(*) as count FROM user_news_bookmarks WHERE created_at >= DATE('now', '-${days} days')`).first() as Record<string, number> || { count: 0 }
        } catch (_e: unknown) { /* 테이블 없을 수 있음 */ }

        // 게임 통계
        let gamePlays = { count: 0 } as Record<string, number>
        let topGames: Array<{ game_type: string; plays: number; avg_score: number }> = []
        try {
            gamePlays = await DB.prepare(`SELECT COUNT(*) as count FROM game_scores WHERE created_at >= DATE('now', '-${days} days')`).first() as Record<string, number> || { count: 0 }
            const topGamesResult = await DB.prepare(
                `SELECT game_type, COUNT(*) as plays, ROUND(AVG(score)) as avg_score 
                 FROM game_scores WHERE created_at >= DATE('now', '-${days} days')
                 GROUP BY game_type ORDER BY plays DESC LIMIT 5`
            ).all()
            topGames = topGamesResult.results as Array<{ game_type: string; plays: number; avg_score: number }>
        } catch (_e: unknown) { /* 테이블 없을 수 있음 */ }

        // 미니앱 통계
        let miniappLaunches = { count: 0 } as Record<string, number>
        let topMiniapps: Array<{ name: string; launches: number }> = []
        try {
            miniappLaunches = await DB.prepare(`SELECT COUNT(*) as count FROM mini_app_logs WHERE created_at >= DATE('now', '-${days} days')`).first() as Record<string, number> || { count: 0 }
            const topMiniappsResult = await DB.prepare(
                `SELECT ma.name, COUNT(mal.id) as launches
                 FROM mini_app_logs mal JOIN mini_apps ma ON mal.mini_app_id = ma.id
                 WHERE mal.created_at >= DATE('now', '-${days} days')
                 GROUP BY mal.mini_app_id ORDER BY launches DESC LIMIT 5`
            ).all()
            topMiniapps = topMiniappsResult.results as Array<{ name: string; launches: number }>
        } catch (_e: unknown) { /* 테이블 없을 수 있음 */ }

        return c.json({
            success: true,
            news: { reads: newsReads?.count || 0, votes: newsVotes?.count || 0, bookmarks: newsBookmarks?.count || 0 },
            games: { plays: gamePlays?.count || 0, topGames },
            miniapps: { launches: miniappLaunches?.count || 0, topMiniapps }
        })
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        return c.json({ success: false, message: msg }, 500)
    }
})

// ==================== 일별 집계 + 원본 삭제 (CRON or 수동 호출) ====================
analyticsRoutes.post('/api/admin/analytics/aggregate', requireAdmin, async (c) => {
    const DB = getDB(c)
    try {
        // 7일 이전 데이터를 일별로 집계
        const oldData = await DB.prepare(
            `SELECT DATE(created_at) as date, path,
                    COUNT(*) as total_views,
                    COUNT(DISTINCT session_id) as unique_sessions,
                    COUNT(DISTINCT user_id) as unique_users,
                    ROUND(AVG(CASE WHEN duration_ms > 0 THEN duration_ms END)) as avg_duration_ms,
                    SUM(CASE WHEN screen_width IS NOT NULL AND screen_width < 768 THEN 1 ELSE 0 END) as mobile_views,
                    SUM(CASE WHEN screen_width >= 1024 THEN 1 ELSE 0 END) as desktop_views,
                    SUM(CASE WHEN screen_width >= 768 AND screen_width < 1024 THEN 1 ELSE 0 END) as tablet_views
             FROM page_views 
             WHERE created_at < DATE('now', '-7 days')
             GROUP BY DATE(created_at), path`
        ).all()

        let aggregated = 0
        for (const row of (oldData.results as Array<Record<string, number | string | null>>)) {
            await DB.prepare(
                `INSERT OR REPLACE INTO page_views_daily (date, path, total_views, unique_sessions, unique_users, avg_duration_ms, mobile_views, desktop_views, tablet_views)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
                row.date, row.path, row.total_views, row.unique_sessions, row.unique_users,
                row.avg_duration_ms || 0, row.mobile_views || 0, row.desktop_views || 0, row.tablet_views || 0
            ).run()
            aggregated++
        }

        // 원본 삭제
        const deleted = await DB.prepare("DELETE FROM page_views WHERE created_at < DATE('now', '-7 days')").run()

        return c.json({
            success: true,
            message: `${aggregated}건 집계 완료, ${deleted.changes || 0}건 원본 삭제`
        })
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        return c.json({ success: false, message: msg }, 500)
    }
})

// ==================== 통계 CSV 내보내기 ====================
analyticsRoutes.get('/api/admin/analytics/export', requireAdmin, async (c) => {
    const DB = getDB(c)
    const type = c.req.query('type') || 'visitors'
    const days = parseInt(c.req.query('days') || '30')

    try {
        let csv = ''
        if (type === 'visitors') {
            csv = '날짜,페이지뷰,순방문자\n'
            const data = await DB.prepare(
                `SELECT DATE(created_at) as date, COUNT(*) as views, COUNT(DISTINCT session_id) as visitors
                 FROM page_views WHERE created_at >= DATE('now', '-${days} days')
                 GROUP BY DATE(created_at) ORDER BY date`
            ).all()
            for (const row of (data.results as Array<{ date: string; views: number; visitors: number }>)) {
                csv += `${row.date},${row.views},${row.visitors}\n`
            }
        } else if (type === 'pages') {
            csv = '페이지,페이지뷰,순방문자,평균체류시간(초)\n'
            const data = await DB.prepare(
                `SELECT path, COUNT(*) as views, COUNT(DISTINCT session_id) as visitors,
                 ROUND(AVG(CASE WHEN duration_ms > 0 THEN duration_ms END) / 1000.0, 1) as avg_sec
                 FROM page_views WHERE created_at >= DATE('now', '-${days} days')
                 GROUP BY path ORDER BY views DESC`
            ).all()
            for (const row of (data.results as Array<{ path: string; views: number; visitors: number; avg_sec: number }>)) {
                csv += `"${row.path}",${row.views},${row.visitors},${row.avg_sec || 0}\n`
            }
        }

        const filename = `analytics_${type}_${new Date().toISOString().split('T')[0]}.csv`
        return new Response(csv, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        })
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        return c.json({ success: false, message: msg }, 500)
    }
})

export { analyticsRoutes }
