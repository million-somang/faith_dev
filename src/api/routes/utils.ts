import { Hono } from 'hono'
import { getDB } from '../../db/adapter'
import { convertCurrency, getMockExchangeRates } from '../../utils/exchangeRateProvider'
import type { Bindings, Variables } from '../../types'

const utilsRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// ==================== D-Day API ====================

utilsRoutes.get('/api/dday/list', async (c) => {
    const DB = getDB(c)
    const userId = (c.get('user') as any)?.id || null
    try {
        const { results } = await DB.prepare('SELECT * FROM dday WHERE user_id = ? ORDER BY target_date ASC')
            .bind(userId).all()
        return c.json({ success: true, ddays: results || [] })
    } catch (error) {
        console.error('D-Day 조회 오류:', error)
        return c.json({ success: false, error: 'D-Day 조회 실패' }, 500)
    }
})

utilsRoutes.post('/api/dday/add', async (c) => {
    const DB = getDB(c)
    const userId = (c.get('user') as any)?.id || null
    try {
        const body = await c.req.json()
        const { title, targetDate, mode, isAnniversary, color, emoji } = body
        const result = await DB.prepare('INSERT INTO dday (user_id, title, target_date, mode, is_anniversary, color, emoji) VALUES (?, ?, ?, ?, ?, ?, ?)')
            .bind(userId, title, targetDate, mode, isAnniversary ? 1 : 0, color, emoji).run()
        return c.json({ success: true, id: result.meta.last_row_id })
    } catch (error) {
        console.error('D-Day 추가 오류:', error)
        return c.json({ success: false, error: 'D-Day 추가 실패' }, 500)
    }
})

utilsRoutes.delete('/api/dday/:id', async (c) => {
    const DB = getDB(c)
    const userId = (c.get('user') as any)?.id || null
    const id = c.req.param('id')
    try {
        await DB.prepare('DELETE FROM dday WHERE id = ? AND (user_id = ? OR user_id IS NULL)')
            .bind(id, userId).run()
        return c.json({ success: true })
    } catch (error) {
        console.error('D-Day 삭제 오류:', error)
        return c.json({ success: false, error: 'D-Day 삭제 실패' }, 500)
    }
})

// ==================== 쇼핑 API ====================

utilsRoutes.get('/api/shopping/hotdeals', (c) => {
    const hotDeals = [
        { id: 1, title: '[특가] 삼성 갤럭시 버즈2 프로 무선 이어폰', originalPrice: 289000, salePrice: 149000, discountRate: 48, image: 'https://via.placeholder.com/300x300/667eea/ffffff?text=Galaxy+Buds2+Pro', link: 'https://www.coupang.com', rating: 4.8, reviewCount: 15234, category: '전자제품', platform: 'coupang', badge: '로켓배송' },
        { id: 2, title: '[오늘만] 나이키 에어맥스 런닝화 - 신상 출시', originalPrice: 159000, salePrice: 89000, discountRate: 44, image: 'https://via.placeholder.com/300x300/f093fb/ffffff?text=Nike+Air+Max', link: 'https://www.coupang.com', rating: 4.7, reviewCount: 8921, category: '패션', platform: 'coupang', badge: '무료배송' },
        { id: 3, title: 'LG 그램 17인치 노트북 초경량 (1.35kg)', originalPrice: 2590000, salePrice: 1990000, discountRate: 23, image: 'https://via.placeholder.com/300x300/4facfe/ffffff?text=LG+Gram+17', link: 'https://www.coupang.com', rating: 4.9, reviewCount: 3456, category: '전자제품', platform: 'coupang', badge: '로켓배송' },
        { id: 4, title: '[1+1] 프리미엄 와이드 모니터 27인치 QHD', originalPrice: 349000, salePrice: 249000, discountRate: 29, image: 'https://via.placeholder.com/300x300/00d2ff/ffffff?text=Monitor+27', link: 'https://www.coupang.com', rating: 4.6, reviewCount: 12890, category: '전자제품', platform: 'coupang', badge: '오늘출발' },
        { id: 5, title: '코스트코 인기 1위 프로틴 보충제 5kg 대용량', originalPrice: 129000, salePrice: 69000, discountRate: 47, image: 'https://via.placeholder.com/300x300/feca57/ffffff?text=Protein+5kg', link: 'https://www.coupang.com', rating: 4.8, reviewCount: 28934, category: '식품', platform: 'coupang', badge: '베스트' },
        { id: 6, title: '다이슨 V15 무선청소기 최신형 + 사은품 증정', originalPrice: 1390000, salePrice: 999000, discountRate: 28, image: 'https://via.placeholder.com/300x300/ee5a6f/ffffff?text=Dyson+V15', link: 'https://www.coupang.com', rating: 4.9, reviewCount: 5632, category: '생활가전', platform: 'coupang', badge: '로켓직구' },
        { id: 7, title: 'Apple 에어팟 프로 2세대 USB-C 정품', originalPrice: 359000, salePrice: 289000, discountRate: 19, image: 'https://via.placeholder.com/300x300/764ba2/ffffff?text=AirPods+Pro+2', link: 'https://www.coupang.com', rating: 5.0, reviewCount: 9821, category: '전자제품', platform: 'coupang', badge: '로켓배송' },
        { id: 8, title: '[타임특가] 샤오미 공기청정기 4 프로 미세먼지', originalPrice: 529000, salePrice: 329000, discountRate: 38, image: 'https://via.placeholder.com/300x300/48dbfb/ffffff?text=Xiaomi+Air+4', link: 'https://www.coupang.com', rating: 4.7, reviewCount: 7234, category: '생활가전', platform: 'coupang', badge: '타임특가' }
    ]
    return c.json(hotDeals)
})

// ==================== 환율 API ====================

utilsRoutes.get('/api/exchange/rates', async (c) => {
    try {
        const rates = getMockExchangeRates()
        return c.json({ success: true, rates, timestamp: new Date().toISOString(), note: '매매기준율 기준 / 실제 환전 시 수수료가 추가될 수 있습니다.' })
    } catch (error) {
        console.error('환율 정보 조회 오류:', error)
        return c.json({ success: false, error: '환율 정보 조회 실패' }, 500)
    }
})

utilsRoutes.get('/api/exchange/convert', async (c) => {
    const from = c.req.query('from') || 'USD'
    const to = c.req.query('to') || 'KRW'
    const amount = parseFloat(c.req.query('amount') || '1')
    if (isNaN(amount) || amount <= 0) return c.json({ success: false, error: '유효하지 않은 금액입니다.' }, 400)
    try {
        const result = convertCurrency(from, to, amount)
        const rates = getMockExchangeRates()
        return c.json({
            success: true, from, to, amount, result,
            rate: from === 'KRW' ? 1 : rates[from]?.rate || 1,
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('환전 처리 오류:', error)
        return c.json({ success: false, error: '환전 처리 실패' }, 500)
    }
})

// ==================== Figma API 연동 ====================

utilsRoutes.get('/api/figma/file/:fileKey', async (c) => {
    const { FIGMA_ACCESS_TOKEN } = c.env as any
    const fileKey = c.req.param('fileKey')
    if (!FIGMA_ACCESS_TOKEN) return c.json({ success: false, error: 'Figma Access Token이 설정되지 않았습니다.' }, 500)
    try {
        const response = await fetch(`https://api.figma.com/v1/files/${fileKey}`, { headers: { 'X-Figma-Token': FIGMA_ACCESS_TOKEN } })
        if (!response.ok) return c.json({ success: false, error: `Figma API 오류: ${response.status}`, details: await response.text() }, response.status as any)
        return c.json({ success: true, data: await response.json() })
    } catch (error: any) { return c.json({ success: false, error: error.message || '파일 가져오기 실패' }, 500) }
})

utilsRoutes.get('/api/figma/images/:fileKey', async (c) => {
    const { FIGMA_ACCESS_TOKEN } = c.env as any
    const { fileKey } = c.req.param(), nodeIds = c.req.query('ids'), format = c.req.query('format') || 'png', scale = c.req.query('scale') || '1'
    if (!FIGMA_ACCESS_TOKEN) return c.json({ success: false, error: 'Figma Access Token 미설정' }, 500)
    if (!nodeIds) return c.json({ success: false, error: 'Node IDs 필요' }, 400)
    try {
        const url = `https://api.figma.com/v1/images/${fileKey}?ids=${nodeIds}&format=${format}&scale=${scale}`
        const response = await fetch(url, { headers: { 'X-Figma-Token': FIGMA_ACCESS_TOKEN } })
        if (!response.ok) return c.json({ success: false, error: `Figma API 오류: ${response.status}`, details: await response.text() }, response.status as any)
        const data = await response.json() as any
        return c.json({ success: true, images: data.images, metadata: { format, scale, nodeIds: nodeIds.split(',') } })
    } catch (error: any) { return c.json({ success: false, error: error.message || '이미지 렌더링 실패' }, 500) }
})

utilsRoutes.get('/api/figma/styles/:fileKey', async (c) => {
    const { FIGMA_ACCESS_TOKEN } = c.env as any
    const fileKey = c.req.param('fileKey')
    if (!FIGMA_ACCESS_TOKEN) return c.json({ success: false, error: 'Figma Access Token 미설정' }, 500)
    try {
        const response = await fetch(`https://api.figma.com/v1/files/${fileKey}`, { headers: { 'X-Figma-Token': FIGMA_ACCESS_TOKEN } })
        if (!response.ok) return c.json({ success: false, error: `Figma API 오류: ${response.status}` }, response.status as any)
        const fileData = await response.json() as any
        return c.json({ success: true, styles: { colors: fileData.styles?.fills || {}, textStyles: fileData.styles?.text || {}, effectStyles: fileData.styles?.effects || {} }, fileName: fileData.name, lastModified: fileData.lastModified })
    } catch (error: any) { return c.json({ success: false, error: error.message || '스타일 가져오기 실패' }, 500) }
})

// ==================== Puppeteer API 연동 ====================

utilsRoutes.get('/api/puppeteer/screenshot', async (c) => {
    try {
        const url = c.req.query('url'), fullPage = c.req.query('fullPage') === 'true', format = c.req.query('format') || 'png', width = parseInt(c.req.query('width') || '1920'), height = parseInt(c.req.query('height') || '1080')
        if (!url) return c.json({ success: false, error: 'URL parameter is required' }, 400)
        const token = (c.env as any)?.BROWSERLESS_API_TOKEN || process.env.BROWSERLESS_API_TOKEN
        if (!token || token === 'demo_token_for_testing') return c.json({ success: false, error: 'BROWSERLESS_API_TOKEN not configured' }, 401)
        const response = await fetch(`https://chrome.browserless.io/screenshot?token=${token}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, options: { fullPage, type: format, encoding: 'base64' }, viewport: { width, height } })
        })
        if (!response.ok) return c.json({ success: false, error: 'Browserless.io API error', details: await response.text() }, response.status as any)
        const screenshotBuffer = Uint8Array.from(atob(await response.text()), c => c.charCodeAt(0))
        return new Response(screenshotBuffer, { headers: { 'Content-Type': `image/${format}`, 'Cache-Control': 'public, max-age=3600' } })
    } catch (error: any) { return c.json({ success: false, error: error.message }, 500) }
})

utilsRoutes.get('/api/puppeteer/pdf', async (c) => {
    try {
        const url = c.req.query('url'), format = c.req.query('format') || 'A4', landscape = c.req.query('landscape') === 'true'
        if (!url) return c.json({ success: false, error: 'URL parameter is required' }, 400)
        const token = (c.env as any)?.BROWSERLESS_API_TOKEN || process.env.BROWSERLESS_API_TOKEN
        if (!token || token === 'demo_token_for_testing') return c.json({ success: false, error: 'BROWSERLESS_API_TOKEN not configured' }, 401)
        const response = await fetch(`https://chrome.browserless.io/pdf?token=${token}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, options: { format, landscape, printBackground: true } })
        })
        if (!response.ok) return c.json({ success: false, error: 'Browserless.io API error', details: await response.text() }, response.status as any)
        return new Response(await response.arrayBuffer(), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="page-${Date.now()}.pdf"` } })
    } catch (error: any) { return c.json({ success: false, error: error.message }, 500) }
})

utilsRoutes.post('/api/puppeteer/scrape', async (c) => {
    try {
        const { url, selector } = await c.req.json()
        if (!url) return c.json({ success: false, error: 'URL is required' }, 400)
        const token = (c.env as any)?.BROWSERLESS_API_TOKEN || process.env.BROWSERLESS_API_TOKEN
        if (!token || token === 'demo_token_for_testing') return c.json({ success: false, error: 'BROWSERLESS_API_TOKEN not configured' }, 401)
        const response = await fetch(`https://chrome.browserless.io/scrape?token=${token}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, elements: [{ selector: selector || 'body' }], gotoOptions: { waitUntil: 'networkidle2' } })
        })
        if (!response.ok) return c.json({ success: false, error: 'Browserless.io API error', details: await response.text() }, response.status as any)
        return c.json({ success: true, data: await response.json(), timestamp: new Date().toISOString() })
    } catch (error: any) { return c.json({ success: false, error: error.message }, 500) }
})

export { utilsRoutes }
