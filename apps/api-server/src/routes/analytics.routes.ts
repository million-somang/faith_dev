import { Hono } from 'hono'
import { getDB } from '../db/adapter.js'
import { requireAdmin } from './admin.routes.js'

const analyticsRoutes = new Hono()

// ==================== 페이지뷰 기록 (인증 불필요) ====================
analyticsRoutes.post('/api/analytics/pageview', async (c) => {
    const DB = getDB(c)
    try {
        const body = await c.req.json()
        let { sessionId, path, referrer, screenWidth, durationMs, userId } = body

        if (!path || !sessionId) {
            return c.json({ success: false, message: '필수 데이터 누락' }, 400)
        }

        // 악성 스캐너/인젝션 문자열 정제 및 길이 제한
        if (referrer && typeof referrer === 'string') {
            if (referrer.includes('sleep(') || referrer.includes('waitfor') || referrer.includes('DBMS_PIPE') || referrer.includes('XOR') || referrer.includes('SELECT(')) {
                referrer = '';
            } else if (referrer.length > 500) {
                referrer = referrer.slice(0, 500);
            }
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

// ==================== 유입 경로 지능형 분류기 ====================
export interface ReferrerInfo {
    channel: 'direct' | 'search' | 'social' | 'community' | 'campaign' | 'internal' | 'external';
    channelName: string;
    source: string;
    domain: string;
    isExternal: boolean;
}

export function classifyReferrer(rawRef: string | null | undefined): ReferrerInfo {
    if (!rawRef || rawRef === 'null' || rawRef === 'undefined' || rawRef === '1' || rawRef.trim() === '') {
        return { channel: 'direct', channelName: '직접 접속', source: '직접 접속 (URL/즐겨찾기)', domain: 'direct', isExternal: false };
    }
    const ref = rawRef.trim();

    // 악성 스캐너/인젝션 필터링
    if (ref.includes('sleep(') || ref.includes('waitfor') || ref.includes('DBMS_PIPE') || ref.includes('XOR') || ref.includes('SELECT(')) {
        return { channel: 'external', channelName: '스캐너 탐색', source: '비정상 스캐너 (차단됨)', domain: 'scanner', isExternal: false };
    }

    // 마케팅 캠페인 (UTM 파라미터 유입)
    if (ref.startsWith('utm://')) {
        const clean = ref.replace('utm://', '');
        const [sourcePart] = clean.split(/[/?]/);
        const sourceName = sourcePart ? decodeURIComponent(sourcePart) : '캠페인';
        return { channel: 'campaign', channelName: '마케팅 캠페인', source: `캠페인: ${sourceName}`, domain: sourcePart || 'campaign', isExternal: true };
    }

    const lower = ref.toLowerCase();

    // 사이트 내부 이동
    if (lower.includes('veranex.app') || lower.includes('faithlinkportal') || lower.includes('localhost') || lower.includes('127.0.0.1') || lower.includes('210.114.17.245')) {
        return { channel: 'internal', channelName: '사이트 내부 이동', source: '내부 페이지 이동', domain: 'internal', isExternal: false };
    }

    // 검색엔진 (Search)
    if (lower.includes('naver.com')) return { channel: 'search', channelName: '검색엔진', source: '네이버 (Naver)', domain: 'naver.com', isExternal: true };
    if (lower.includes('google.com') || lower.includes('google.co.kr')) return { channel: 'search', channelName: '검색엔진', source: '구글 (Google)', domain: 'google.com', isExternal: true };
    if (lower.includes('daum.net')) return { channel: 'search', channelName: '검색엔진', source: '다음 (Daum)', domain: 'daum.net', isExternal: true };
    if (lower.includes('bing.com')) return { channel: 'search', channelName: '검색엔진', source: '빙 (Bing)', domain: 'bing.com', isExternal: true };
    if (lower.includes('yahoo.com') || lower.includes('yahoo.co.jp')) return { channel: 'search', channelName: '검색엔진', source: '야후 (Yahoo)', domain: 'yahoo.com', isExternal: true };
    if (lower.includes('duckduckgo.com')) return { channel: 'search', channelName: '검색엔진', source: '덕덕고 (DuckDuckGo)', domain: 'duckduckgo.com', isExternal: true };

    // 소셜 미디어 (Social)
    if (lower.includes('threads.com') || lower.includes('threads.net')) return { channel: 'social', channelName: '소셜 미디어 (SNS)', source: '스레드 (Threads)', domain: 'threads.net', isExternal: true };
    if (lower.includes('instagram.com')) return { channel: 'social', channelName: '소셜 미디어 (SNS)', source: '인스타그램 (Instagram)', domain: 'instagram.com', isExternal: true };
    if (lower.includes('facebook.com') || lower.includes('fb.me') || lower.includes('fb.com')) return { channel: 'social', channelName: '소셜 미디어 (SNS)', source: '페이스북 (Facebook)', domain: 'facebook.com', isExternal: true };
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) return { channel: 'social', channelName: '소셜 미디어 (SNS)', source: '유튜브 (YouTube)', domain: 'youtube.com', isExternal: true };
    if (lower.includes('kakao.com')) return { channel: 'social', channelName: '소셜 미디어 (SNS)', source: '카카오톡 (KakaoTalk)', domain: 'kakao.com', isExternal: true };
    if (lower.includes('twitter.com') || lower.includes('t.co') || lower.includes('x.com')) return { channel: 'social', channelName: '소셜 미디어 (SNS)', source: 'X (트위터)', domain: 'x.com', isExternal: true };
    if (lower.includes('tiktok.com')) return { channel: 'social', channelName: '소셜 미디어 (SNS)', source: '틱톡 (TikTok)', domain: 'tiktok.com', isExternal: true };

    // 커뮤니티 및 블로그
    if (lower.includes('blog.naver.com')) return { channel: 'community', channelName: '커뮤니티/블로그', source: '네이버 블로그', domain: 'blog.naver.com', isExternal: true };
    if (lower.includes('tistory.com')) return { channel: 'community', channelName: '커뮤니티/블로그', source: '티스토리 블로그', domain: 'tistory.com', isExternal: true };
    if (lower.includes('brunch.co.kr')) return { channel: 'community', channelName: '커뮤니티/블로그', source: '카카오 브런치', domain: 'brunch.co.kr', isExternal: true };
    if (lower.includes('dcinside.com')) return { channel: 'community', channelName: '커뮤니티/블로그', source: '디시인사이드', domain: 'dcinside.com', isExternal: true };
    if (lower.includes('clien.net')) return { channel: 'community', channelName: '커뮤니티/블로그', source: '클리앙', domain: 'clien.net', isExternal: true };
    if (lower.includes('ruliweb.com')) return { channel: 'community', channelName: '커뮤니티/블로그', source: '루리웹', domain: 'ruliweb.com', isExternal: true };
    if (lower.includes('ppomppu.co.kr')) return { channel: 'community', channelName: '커뮤니티/블로그', source: '뽐뿌', domain: 'ppomppu.co.kr', isExternal: true };
    if (lower.includes('fmkorea.com')) return { channel: 'community', channelName: '커뮤니티/블로그', source: '에펨코리아', domain: 'fmkorea.com', isExternal: true };

    // 일반 외부 도메인 추출
    try {
        const u = new URL(ref.startsWith('http') ? ref : 'http://' + ref);
        const host = u.hostname.replace(/^www\./, '');
        return { channel: 'external', channelName: '기타 외부 웹사이트', source: host, domain: host, isExternal: true };
    } catch {
        return { channel: 'external', channelName: '기타 외부 웹사이트', source: ref.slice(0, 30), domain: 'external', isExternal: true };
    }
}

// 가이드 및 정적 콘텐츠 제목 매핑 사전
const GUIDE_TITLES: Record<string, string> = {
    'loan-interest-calculation-and-repayment-methods': '대출이자 계산법 및 원리금균등·원금균등 상환방식 비교',
    'pyeong-to-square-meter-conversion-and-real-estate': '평수 ㎡ 계산법 및 아파트 평형별 실면적 가이드',
    'korean-age-unification-act-guide-and-legal-effects': '만 나이 통일법 총정리 및 연령 기준 가이드',
    'd-day-time-management-and-goal-setting-guide': '디데이 계산법 및 수험·프로젝트 일정 관리 가이드',
    'compound-interest-calculator-guide-and-wealth-building': '복리 계산기 활용법 및 72의 법칙 재테크 가이드',
    'saju-manseryeok-principles-and-four-pillars': '정통 사주 만세력 원리와 사주팔자 입문 가이드',
    'five-elements-harmony-and-lifestyle-balance': '음양오행 균형과 일상 생활 건강 운세 활용법',
    'ten-gods-personality-career-aptitude-guide': '십신(십성)으로 분석하는 성격 유형과 직업 적성',
    'saju-unse-interpretation-and-annual-horoscope': '대운과 세운 해석법: 인생의 사계절과 기회의 포착',
    'webnovel-trends-regression-possession-reincarnation': '웹소설 흥행 공식: 회빙환 트렌드와 독자 심리 분석',
    'webnovel-plot-design-and-three-act-structure': '웹소설 3막 구조와 주간 연재 플롯 설계 노하우',
    'character-conflict-design-and-villain-writing': '웹소설 매력적인 주인공과 입체적 빌런 캐릭터 조형법',
    'json-formatting-and-syntax-validation-guide': 'JSON 포맷터 활용 및 문법 검증 실전 가이드',
    'sp500-index-fund-dollar-investing-principles': 'S&P500 인덱스 펀드 적립식 투자 원칙과 복리 효과',
    'magic-of-compound-interest-and-dollar-cost-averaging': '복리의 마법과 달러 분할 매수 장기 투자 전략',
    'foreign-exchange-rate-and-macro-investment': '환율 변동 원리와 거시경제 투자 기초 가이드',
    '2026-global-interest-rate-dividend-strategy': '2026 글로벌 금리 전망과 고배당 ETF 투자 전략'
};

const GAME_NAMES: Record<string, string> = {
    'janggi': '베라 장기 (전통 장기)',
    'omok': '베라 오목 (렌주룰)',
    'vera-pop': '베라 팝 (버블 슈터)',
    'freecell': '프리셀 솔리테어',
    'minesweeper': '윈도우 클래식 지뢰찾기',
    '2048': '2048 숫자 퍼즐',
    'sudoku': '스도쿠 데일리',
    'sfc': '슈퍼패미컴 명작 게임관',
    'comboy': '현대 컴보이 게임관',
    'tetris': '테트리스 아케이드'
};

// ==================== 관리자: 유입 경로 고도화 ====================
analyticsRoutes.get('/api/admin/analytics/referrers', requireAdmin, async (c) => {
    const DB = getDB(c)
    const days = parseInt(c.req.query('days') || '30')

    try {
        // 원본 page_views에서 유입 경로 및 랜딩 페이지 집계
        const rowsResult = await DB.prepare(
            `SELECT referrer, path, COUNT(*) as views, COUNT(DISTINCT session_id) as visitors, MAX(created_at) as last_seen
             FROM page_views 
             WHERE created_at >= DATE('now', '-${days} days')
             GROUP BY referrer, path 
             ORDER BY views DESC`
        ).all()

        const rawRows = (rowsResult.results || []) as Array<{
            referrer: string | null;
            path: string;
            views: number;
            visitors: number;
            last_seen: string;
        }>

        // 채널별 합계 및 출처별 합계 계산
        const channelTotals: Record<string, { name: string; views: number; visitors: number }> = {
            search: { name: '검색엔진', views: 0, visitors: 0 },
            social: { name: '소셜 미디어 (SNS)', views: 0, visitors: 0 },
            community: { name: '커뮤니티/블로그', views: 0, visitors: 0 },
            campaign: { name: '마케팅 캠페인', views: 0, visitors: 0 },
            external: { name: '기타 외부 웹사이트', views: 0, visitors: 0 },
            direct: { name: '직접 접속', views: 0, visitors: 0 },
            internal: { name: '사이트 내부 이동', views: 0, visitors: 0 }
        };

        const sourceMap = new Map<string, {
            source: string;
            channel: string;
            channelName: string;
            domain: string;
            isExternal: boolean;
            views: number;
            visitors: number;
            lastSeen: string;
        }>();

        const detailsList: Array<{
            source: string;
            channel: string;
            channelName: string;
            domain: string;
            isExternal: boolean;
            referrerUrl: string;
            landingPath: string;
            views: number;
            visitors: number;
            lastSeen: string;
        }> = [];

        let totalViews = 0;
        let totalExternalViews = 0;

        for (const row of rawRows) {
            const classified = classifyReferrer(row.referrer);
            const views = Number(row.views) || 0;
            const visitors = Number(row.visitors) || 0;

            totalViews += views;
            if (classified.isExternal) {
                totalExternalViews += views;
            }

            // 채널 합계
            if (channelTotals[classified.channel]) {
                channelTotals[classified.channel].views += views;
                channelTotals[classified.channel].visitors += visitors;
            }

            // 출처별 합계
            const existingSource = sourceMap.get(classified.source);
            if (existingSource) {
                existingSource.views += views;
                existingSource.visitors += visitors;
                if (row.last_seen > existingSource.lastSeen) {
                    existingSource.lastSeen = row.last_seen;
                }
            } else {
                sourceMap.set(classified.source, {
                    source: classified.source,
                    channel: classified.channel,
                    channelName: classified.channelName,
                    domain: classified.domain,
                    isExternal: classified.isExternal,
                    views,
                    visitors,
                    lastSeen: row.last_seen
                });
            }

            // 상세 행 (최대 100건)
            if (detailsList.length < 100) {
                detailsList.push({
                    source: classified.source,
                    channel: classified.channel,
                    channelName: classified.channelName,
                    domain: classified.domain,
                    isExternal: classified.isExternal,
                    referrerUrl: row.referrer || '(직접 접속)',
                    landingPath: row.path || '/',
                    views,
                    visitors,
                    lastSeen: row.last_seen
                });
            }
        }

        const topSources = Array.from(sourceMap.values())
            .map(s => ({
                ...s,
                percentage: totalViews > 0 ? Math.round((s.views / totalViews) * 1000) / 10 : 0
            }))
            .sort((a, b) => b.views - a.views);

        const channels = Object.entries(channelTotals).map(([channelKey, data]) => ({
            channel: channelKey,
            name: data.name,
            views: data.views,
            visitors: data.visitors,
            percentage: totalViews > 0 ? Math.round((data.views / totalViews) * 1000) / 10 : 0
        })).sort((a, b) => b.views - a.views);

        return c.json({
            success: true,
            summary: {
                totalViews,
                externalViews: totalExternalViews,
                externalRatio: totalViews > 0 ? Math.round((totalExternalViews / totalViews) * 1000) / 10 : 0,
                searchViews: channelTotals.search.views,
                socialViews: channelTotals.social.views,
                communityViews: channelTotals.community.views,
                campaignViews: channelTotals.campaign.views,
                directViews: channelTotals.direct.views,
                internalViews: channelTotals.internal.views
            },
            channels,
            topSources,
            details: detailsList,
            // 하위 호환성 (기존 Chart.js 연동용)
            referrers: topSources.map(s => ({ source: s.source, views: s.views }))
        })
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        console.error('Referrers error:', msg)
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

// ==================== 관리자: 콘텐츠 통합 통계 (개요) ====================
analyticsRoutes.get('/api/admin/analytics/content', requireAdmin, async (c) => {
    const DB = getDB(c)
    const days = parseInt(c.req.query('days') || '30')

    try {
        let newsReads = { count: 0 } as Record<string, number>
        let newsVotes = { count: 0 } as Record<string, number>
        let newsBookmarks = { count: 0 } as Record<string, number>
        try {
            newsReads = await DB.prepare(`SELECT COUNT(*) as count FROM user_news_read WHERE created_at >= DATE('now', '-${days} days')`).first() as Record<string, number> || { count: 0 }
        } catch (_e: unknown) {}
        try {
            newsVotes = await DB.prepare(`SELECT COUNT(*) as count FROM news_votes WHERE created_at >= DATE('now', '-${days} days')`).first() as Record<string, number> || { count: 0 }
        } catch (_e: unknown) {}
        try {
            newsBookmarks = await DB.prepare(`SELECT COUNT(*) as count FROM user_news_bookmarks WHERE created_at >= DATE('now', '-${days} days')`).first() as Record<string, number> || { count: 0 }
        } catch (_e: unknown) {}

        let gamePlays = { count: 0 } as Record<string, number>
        let topGames: Array<{ game_type: string; plays: number; avg_score: number }> = []
        try {
            gamePlays = await DB.prepare(`SELECT COUNT(*) as count FROM game_scores WHERE created_at >= DATE('now', '-${days} days')`).first() as Record<string, number> || { count: 0 }
            const topGamesResult = await DB.prepare(
                `SELECT game_id as game_type, COUNT(*) as plays, ROUND(AVG(score)) as avg_score 
                 FROM game_scores WHERE created_at >= DATE('now', '-${days} days')
                 GROUP BY game_id ORDER BY plays DESC LIMIT 5`
            ).all()
            topGames = (topGamesResult.results || []).map((g: any) => ({
                game_type: GAME_NAMES[g.game_type] || g.game_type,
                plays: g.plays,
                avg_score: g.avg_score
            }))
        } catch (_e: unknown) {}

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
        } catch (_e: unknown) {}

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

// ==================== 관리자: 콘텐츠 상세 소비 분석 (신설) ====================
analyticsRoutes.get('/api/admin/analytics/content-detail', requireAdmin, async (c) => {
    const DB = getDB(c)
    const type = c.req.query('type') || 'all' // all | news | miniapps | games | guides
    const days = parseInt(c.req.query('days') || '30')

    try {
        let items: Array<{
            id: string | number;
            title: string;
            category: string;
            type: 'news' | 'miniapp' | 'game' | 'guide' | 'service';
            typeLabel: string;
            url: string;
            views: number;
            visitors: number;
            share: number;
            metricName: string;
            avgDurationSec?: number;
            extra?: string;
        }> = [];

        // 1. 뉴스 데이터 수집
        let newsItems: typeof items = [];
        if (type === 'all' || type === 'news') {
            try {
                // 뉴스 테이블 조회 (조회수 높은 순)
                const newsRows = await DB.prepare(
                    `SELECT id, title, publisher, category, view_count, vote_up, published_at 
                     FROM news 
                     WHERE view_count > 0 
                     ORDER BY view_count DESC 
                     LIMIT 30`
                ).all()

                // 기간 내 page_views와 매칭하여 실시간 기간 조회수 보정
                const pvNews = await DB.prepare(
                    `SELECT path, COUNT(*) as pv_views, COUNT(DISTINCT session_id) as pv_visitors, 
                            ROUND(AVG(CASE WHEN duration_ms > 0 THEN duration_ms END) / 1000.0, 1) as avg_sec
                     FROM page_views 
                     WHERE path LIKE '/news/%' AND created_at >= DATE('now', '-${days} days')
                     GROUP BY path`
                ).all()

                const pvMap = new Map<string, { views: number; visitors: number; avgSec: number }>();
                for (const row of (pvNews.results || []) as any[]) {
                    pvMap.set(row.path, { views: row.pv_views, visitors: row.pv_visitors, avgSec: row.avg_sec });
                }

                newsItems = ((newsRows.results || []) as any[]).map(n => {
                    const pv = pvMap.get(`/news/${n.id}`);
                    const views = pv?.views || n.view_count || 0;
                    return {
                        id: n.id,
                        title: n.title,
                        category: n.category === 'general' ? '일반 종합' : (n.category || '뉴스'),
                        type: 'news' as const,
                        typeLabel: '뉴스 기사',
                        url: `/news/${n.id}`,
                        views,
                        visitors: pv?.visitors || Math.max(1, Math.round(views * 0.8)),
                        share: 0,
                        metricName: '조회',
                        avgDurationSec: pv?.avgSec || 0,
                        extra: `${n.publisher || '언론사 미상'} · 추천 ${n.vote_up || 0}`
                    };
                }).sort((a, b) => b.views - a.views);
            } catch (e) {
                console.error('Content detail news error:', e);
            }
        }

        // 2. 미니앱 / 계산기 / 도구 데이터 수집
        let miniappItems: typeof items = [];
        if (type === 'all' || type === 'miniapps') {
            try {
                const appRows = await DB.prepare(
                    `SELECT ma.id, ma.name, ma.slug, ma.category, ma.app_url,
                            COUNT(mal.id) as period_launches,
                            COUNT(DISTINCT mal.user_id) as unique_users,
                            MAX(mal.created_at) as last_used
                     FROM mini_apps ma
                     LEFT JOIN mini_app_logs mal ON ma.id = mal.mini_app_id AND mal.created_at >= DATE('now', '-${days} days')
                     GROUP BY ma.id
                     ORDER BY period_launches DESC, ma.sort_order ASC`
                ).all()

                // 전체 누적 실행 수 백업
                const allAppLogs = await DB.prepare(
                    `SELECT mini_app_id, COUNT(*) as total_launches FROM mini_app_logs GROUP BY mini_app_id`
                ).all()
                const totalMap = new Map<number, number>();
                for (const r of (allAppLogs.results || []) as any[]) {
                    totalMap.set(r.mini_app_id, r.total_launches);
                }

                miniappItems = ((appRows.results || []) as any[]).map(a => {
                    const periodLaunches = Number(a.period_launches) || 0;
                    const launches = periodLaunches > 0 ? periodLaunches : (totalMap.get(a.id) || 0);
                    return {
                        id: a.id,
                        title: a.name,
                        category: a.category === 'utility' ? '스마트 유틸' : (a.category === 'finance' ? '금융 계산' : '도구'),
                        type: 'miniapp' as const,
                        typeLabel: '스마트 도구',
                        url: a.app_url || `/app/${a.slug}`,
                        views: launches,
                        visitors: a.unique_users || Math.max(1, Math.round(launches * 0.7)),
                        share: 0,
                        metricName: '실행',
                        extra: a.last_used ? `최근 사용: ${a.last_used.split('T')[0] || a.last_used}` : '정상 가동 중'
                    };
                }).filter(a => a.views > 0).sort((a, b) => b.views - a.views);
            } catch (e) {
                console.error('Content detail miniapps error:', e);
            }
        }

        // 3. 웹게임 데이터 수집
        let gameItems: typeof items = [];
        if (type === 'all' || type === 'games') {
            try {
                const gameRows = await DB.prepare(
                    `SELECT game_id, COUNT(*) as plays, COUNT(DISTINCT user_id) as players, 
                            ROUND(AVG(score)) as avg_score, MAX(score) as max_score, MAX(created_at) as last_played
                     FROM game_scores
                     WHERE created_at >= DATE('now', '-${days} days')
                     GROUP BY game_id
                     ORDER BY plays DESC`
                ).all()

                // 기간 데이터가 적은 경우 전체 누적 데이터 보완
                const allGameScores = await DB.prepare(
                    `SELECT game_id, COUNT(*) as total_plays, ROUND(AVG(score)) as avg_score, MAX(score) as max_score
                     FROM game_scores
                     GROUP BY game_id`
                ).all()
                const allGameMap = new Map<string, any>();
                for (const g of (allGameScores.results || []) as any[]) {
                    allGameMap.set(g.game_id, g);
                }

                // 알려진 게임 키셋
                const gameKeys = Array.from(new Set([
                    ...((gameRows.results || []) as any[]).map(g => g.game_id),
                    ...Array.from(allGameMap.keys()),
                    'janggi', 'omok', 'freecell', 'vera-pop', 'minesweeper', '2048', 'sudoku'
                ]));

                gameItems = gameKeys.map(gid => {
                    const periodData = ((gameRows.results || []) as any[]).find(g => g.game_id === gid);
                    const totalData = allGameMap.get(gid) || {};
                    const plays = periodData?.plays || totalData.total_plays || 0;
                    const avgScore = periodData?.avg_score || totalData.avg_score || 0;
                    const maxScore = periodData?.max_score || totalData.max_score || 0;
                    const gameTitle = GAME_NAMES[gid] || gid;
                    const gameUrl = gid === 'sfc' ? '/game/sfc' : (gid === 'comboy' ? '/game/comboy' : `/game/${gid}`);

                    return {
                        id: gid,
                        title: gameTitle,
                        category: '웹게임 / 아케이드',
                        type: 'game' as const,
                        typeLabel: '웹게임',
                        url: gameUrl,
                        views: plays,
                        visitors: periodData?.players || Math.max(1, Math.round(plays * 0.8)),
                        share: 0,
                        metricName: '플레이',
                        extra: maxScore > 0 ? `최고 점수: ${maxScore.toLocaleString()}점 (평균 ${avgScore.toLocaleString()}점)` : '플레이 가능'
                    };
                }).filter(g => g.views > 0).sort((a, b) => b.views - a.views);
            } catch (e) {
                console.error('Content detail games error:', e);
            }
        }

        // 4. 가이드 & 전문 칼럼 / 특화 콘텐츠 수집
        let guideItems: typeof items = [];
        if (type === 'all' || type === 'guides') {
            try {
                const guideRows = await DB.prepare(
                    `SELECT path, COUNT(*) as views, COUNT(DISTINCT session_id) as visitors,
                            ROUND(AVG(CASE WHEN duration_ms > 0 THEN duration_ms END) / 1000.0, 1) as avg_sec,
                            MAX(created_at) as last_viewed
                     FROM page_views
                     WHERE (path LIKE '/guides/%' OR path LIKE '/blog/%' OR path LIKE '/entertainment/novel%' OR path LIKE '/entertainment/saju%' OR path LIKE '/finance%' OR path LIKE '/lifestyle%')
                       AND path NOT IN ('/finance', '/lifestyle', '/news', '/game', '/about', '/contact', '/privacy', '/terms')
                       AND created_at >= DATE('now', '-${days} days')
                     GROUP BY path
                     ORDER BY views DESC
                     LIMIT 30`
                ).all()

                guideItems = ((guideRows.results || []) as any[]).map(g => {
                    const slug = g.path.split('/').pop() || '';
                    let title = GUIDE_TITLES[slug];
                    let category = '가이드 & 칼럼';

                    if (!title) {
                        if (g.path.includes('/saju')) {
                            title = '정통 사주 만세력 & 운세 종합 분석기';
                            category = '사주 & 운세';
                        } else if (g.path.includes('/novel')) {
                            title = '베라 웹소설 스튜디오 & 시놉시스 작법';
                            category = '웹소설 창작';
                        } else if (g.path.includes('/finance/util')) {
                            title = '스마트 금융 계산 시뮬레이터';
                            category = '금융 계산';
                        } else {
                            title = slug ? decodeURIComponent(slug).replace(/-/g, ' ') : g.path;
                        }
                    }

                    return {
                        id: g.path,
                        title,
                        category,
                        type: 'guide' as const,
                        typeLabel: '가이드·칼럼',
                        url: g.path,
                        views: g.views,
                        visitors: g.visitors,
                        share: 0,
                        metricName: '조회',
                        avgDurationSec: g.avg_sec || 0,
                        extra: g.avg_sec > 0 ? `평균 체류시간: ${Math.round(g.avg_sec)}초` : '최신 콘텐츠'
                    };
                }).sort((a, b) => b.views - a.views);
            } catch (e) {
                console.error('Content detail guides error:', e);
            }
        }

        // 결과 병합 및 점유율 계산
        if (type === 'news') items = newsItems;
        else if (type === 'miniapps') items = miniappItems;
        else if (type === 'games') items = gameItems;
        else if (type === 'guides') items = guideItems;
        else {
            // 종합 (All) : 각 카테고리별 상위권 추출 후 통합
            items = [...newsItems.slice(0, 10), ...miniappItems.slice(0, 8), ...gameItems.slice(0, 8), ...guideItems.slice(0, 8)]
                .sort((a, b) => b.views - a.views);
        }

        const maxViews = items.length > 0 ? Math.max(...items.map(i => i.views), 1) : 1;
        items = items.map(i => ({
            ...i,
            share: Math.round((i.views / maxViews) * 100)
        }));

        return c.json({
            success: true,
            type,
            days,
            items,
            summary: {
                newsCount: newsItems.length,
                miniappsCount: miniappItems.length,
                gamesCount: gameItems.length,
                guidesCount: guideItems.length
            }
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('Content detail error:', msg);
        return c.json({ success: false, message: msg }, 500);
    }
})

// ==================== 일별 집계 + 원본 삭제 (CRON or 수동 호출) ====================
analyticsRoutes.post('/api/admin/analytics/aggregate', requireAdmin, async (c) => {
    const DB = getDB(c)
    try {
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
        let csv = '\uFEFF'; // UTF-8 BOM 추가 (엑셀 한글 깨짐 방지)
        if (type === 'visitors') {
            csv += '날짜,페이지뷰,순방문자\n'
            const data = await DB.prepare(
                `SELECT DATE(created_at) as date, COUNT(*) as views, COUNT(DISTINCT session_id) as visitors
                 FROM page_views WHERE created_at >= DATE('now', '-${days} days')
                 GROUP BY DATE(created_at) ORDER BY date`
            ).all()
            for (const row of (data.results as Array<{ date: string; views: number; visitors: number }>)) {
                csv += `${row.date},${row.views},${row.visitors}\n`
            }
        } else if (type === 'pages') {
            csv += '페이지,페이지뷰,순방문자,평균체류시간(초)\n'
            const data = await DB.prepare(
                `SELECT path, COUNT(*) as views, COUNT(DISTINCT session_id) as visitors,
                 ROUND(AVG(CASE WHEN duration_ms > 0 THEN duration_ms END) / 1000.0, 1) as avg_sec
                 FROM page_views WHERE created_at >= DATE('now', '-${days} days')
                 GROUP BY path ORDER BY views DESC`
            ).all()
            for (const row of (data.results as Array<{ path: string; views: number; visitors: number; avg_sec: number }>)) {
                csv += `"${row.path}",${row.views},${row.visitors},${row.avg_sec || 0}\n`
            }
        } else if (type === 'referrers' || type === 'referrers_detail') {
            csv += '유입출처,채널,상세URL,랜딩페이지,유입수,순방문자,최근유입일시\n'
            const data = await DB.prepare(
                `SELECT referrer, path, COUNT(*) as views, COUNT(DISTINCT session_id) as visitors, MAX(created_at) as last_seen
                 FROM page_views WHERE created_at >= DATE('now', '-${days} days')
                 GROUP BY referrer, path ORDER BY views DESC`
            ).all()
            for (const row of (data.results as any[])) {
                const classified = classifyReferrer(row.referrer);
                csv += `"${classified.source}","${classified.channelName}","${row.referrer || '(직접 접속)'}","${row.path || '/'}","${row.views}","${row.visitors}","${row.last_seen}"\n`
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
