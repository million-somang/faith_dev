import { Hono } from 'hono'
import { Context, Next } from 'hono'
import * as fs from 'fs'
import * as path from 'path'
import crypto from 'crypto'
import { query } from '@faithportal/database'
import { checkSession } from '../middleware/auth.js'

export const bannerRoutes = new Hono()

// ==================== 공개 API ====================

// 슬롯별 활성 배너 목록 (게시 기간 필터 적용)
bannerRoutes.get('/api/banners/:slotKey', async (c: Context) => {
    try {
        const slotKey = c.req.param('slotKey')
        const res = await query(
            `SELECT b.id, b.title, b.image_url, b.link_url, b.open_new_tab, b.sort_order, b.ad_code
             FROM banners b
             JOIN banner_slots s ON b.slot_key = s.slot_key
             WHERE b.slot_key = $1
               AND b.is_active = 1
               AND s.is_active = 1
               AND (b.start_at IS NULL OR b.start_at <= CURRENT_TIMESTAMP)
               AND (b.end_at IS NULL OR b.end_at >= CURRENT_TIMESTAMP)
             ORDER BY b.sort_order ASC, b.id ASC`,
            [slotKey]
        )
        return c.json({ success: true, banners: res.rows })
    } catch (error) {
        console.error('배너 조회 오류:', error)
        return c.json({ success: false, message: '배너 조회 실패' }, 500)
    }
})

// ==================== 관리자 API ====================

// 관리자 인증 미들웨어 (JSON 응답)
const requireAdmin = async (c: Context, next: Next) => {
    const user = await checkSession(c)
    if (!user) return c.json({ success: false, message: '로그인이 필요합니다' }, 401)
    if (user.role !== 'admin' && user.level < 6) {
        return c.json({ success: false, message: '관리자 권한이 필요합니다' }, 403)
    }
    await next()
}

bannerRoutes.use('/api/admin/banner-slots/*', requireAdmin)
bannerRoutes.use('/api/admin/banner-slots', requireAdmin)
bannerRoutes.use('/api/admin/banners/*', requireAdmin)
bannerRoutes.use('/api/admin/banners', requireAdmin)

// ----- 슬롯 -----

// 슬롯 목록 (슬롯별 배너 수 포함)
bannerRoutes.get('/api/admin/banner-slots', async (c: Context) => {
    try {
        const res = await query(
            `SELECT s.*,
                (SELECT COUNT(*) FROM banners b WHERE b.slot_key = s.slot_key AND b.is_active = 1) AS active_banner_count,
                (SELECT COUNT(*) FROM banners b WHERE b.slot_key = s.slot_key) AS total_banner_count
             FROM banner_slots s
             ORDER BY s.id ASC`
        )
        return c.json({ success: true, slots: res.rows })
    } catch (error) {
        console.error('슬롯 목록 오류:', error)
        return c.json({ success: false, message: '슬롯 목록 조회 실패' }, 500)
    }
})

// 슬롯 생성
bannerRoutes.post('/api/admin/banner-slots', async (c: Context) => {
    try {
        const { slot_key, name, width, height, description } = await c.req.json()
        if (!slot_key || !name || !width || !height) {
            return c.json({ success: false, message: 'slot_key, name, width, height는 필수입니다' }, 400)
        }
        if (!/^[a-z0-9_]+$/.test(slot_key)) {
            return c.json({ success: false, message: 'slot_key는 영문 소문자/숫자/언더스코어만 사용 가능합니다' }, 400)
        }
        const dup = await query('SELECT id FROM banner_slots WHERE slot_key = $1', [slot_key])
        if (dup.rows.length > 0) {
            return c.json({ success: false, message: '이미 존재하는 slot_key입니다' }, 409)
        }
        await query(
            'INSERT INTO banner_slots (slot_key, name, width, height, description) VALUES ($1, $2, $3, $4, $5)',
            [slot_key, name, Number(width), Number(height), description || null]
        )
        return c.json({ success: true, message: '슬롯이 생성되었습니다' })
    } catch (error) {
        console.error('슬롯 생성 오류:', error)
        return c.json({ success: false, message: '슬롯 생성 실패' }, 500)
    }
})

// 슬롯 수정 (이름/사이즈/설명/활성화)
bannerRoutes.put('/api/admin/banner-slots/:id', async (c: Context) => {
    try {
        const id = parseInt(c.req.param('id'))
        const { name, width, height, description, is_active } = await c.req.json()
        await query(
            `UPDATE banner_slots SET
                name = COALESCE($1, name),
                width = COALESCE($2, width),
                height = COALESCE($3, height),
                description = COALESCE($4, description),
                is_active = COALESCE($5, is_active)
             WHERE id = $6`,
            [name ?? null, width ?? null, height ?? null, description ?? null,
             is_active === undefined ? null : (is_active ? 1 : 0), id]
        )
        return c.json({ success: true, message: '슬롯이 수정되었습니다' })
    } catch (error) {
        console.error('슬롯 수정 오류:', error)
        return c.json({ success: false, message: '슬롯 수정 실패' }, 500)
    }
})

// ----- 배너 -----

// 배너 목록 (슬롯별 / 전체, 비활성 포함 — 관리용)
bannerRoutes.get('/api/admin/banners', async (c: Context) => {
    try {
        const slotKey = c.req.query('slot_key')
        const res = slotKey
            ? await query('SELECT * FROM banners WHERE slot_key = $1 ORDER BY sort_order ASC, id ASC', [slotKey])
            : await query('SELECT * FROM banners ORDER BY slot_key ASC, sort_order ASC, id ASC')
        return c.json({ success: true, banners: res.rows })
    } catch (error) {
        console.error('배너 목록 오류:', error)
        return c.json({ success: false, message: '배너 목록 조회 실패' }, 500)
    }
})

// 배너 등록
bannerRoutes.post('/api/admin/banners', async (c: Context) => {
    try {
        const { slot_key, title, image_url, link_url, open_new_tab, sort_order, start_at, end_at, is_active, ad_code } = await c.req.json()
        if (!slot_key || !title || (!image_url && !ad_code)) {
            return c.json({ success: false, message: 'slot_key, title, (image_url 또는 ad_code)는 필수입니다' }, 400)
        }
        const slot = await query('SELECT id FROM banner_slots WHERE slot_key = $1', [slot_key])
        if (slot.rows.length === 0) {
            return c.json({ success: false, message: '존재하지 않는 슬롯입니다' }, 404)
        }
        await query(
            `INSERT INTO banners (slot_key, title, image_url, link_url, open_new_tab, sort_order, start_at, end_at, is_active, ad_code)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [slot_key, title, image_url || '', link_url || null,
             open_new_tab === undefined ? 1 : (open_new_tab ? 1 : 0),
             sort_order ?? 0, start_at || null, end_at || null,
             is_active === undefined ? 1 : (is_active ? 1 : 0), ad_code || null]
        )
        return c.json({ success: true, message: '배너가 등록되었습니다' })
    } catch (error) {
        console.error('배너 등록 오류:', error)
        return c.json({ success: false, message: '배너 등록 실패' }, 500)
    }
})

// 배너 수정
bannerRoutes.put('/api/admin/banners/:id', async (c: Context) => {
    try {
        const id = parseInt(c.req.param('id'))
        const { title, image_url, link_url, open_new_tab, sort_order, start_at, end_at, is_active, ad_code } = await c.req.json()
        await query(
            `UPDATE banners SET
                title = COALESCE($1, title),
                image_url = COALESCE($2, image_url),
                link_url = COALESCE($3, link_url),
                open_new_tab = COALESCE($4, open_new_tab),
                sort_order = COALESCE($5, sort_order),
                start_at = COALESCE($6, start_at),
                end_at = COALESCE($7, end_at),
                is_active = COALESCE($8, is_active),
                ad_code = COALESCE($9, ad_code),
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $10`,
            [title ?? null, image_url ?? null, link_url ?? null,
             open_new_tab === undefined ? null : (open_new_tab ? 1 : 0),
             sort_order ?? null, start_at ?? null, end_at ?? null,
             is_active === undefined ? null : (is_active ? 1 : 0),
             ad_code === undefined ? null : ad_code, id]
        )
        return c.json({ success: true, message: '배너가 수정되었습니다' })
    } catch (error) {
        console.error('배너 수정 오류:', error)
        return c.json({ success: false, message: '배너 수정 실패' }, 500)
    }
})

// 배너 노출 ON/OFF 토글 (데이터 삭제 대신 비활성화 정책)
bannerRoutes.post('/api/admin/banners/:id/toggle', async (c: Context) => {
    try {
        const id = parseInt(c.req.param('id'))
        await query(
            'UPDATE banners SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
            [id]
        )
        const res = await query('SELECT is_active FROM banners WHERE id = $1', [id])
        return c.json({ success: true, is_active: res.rows[0]?.is_active })
    } catch (error) {
        console.error('배너 토글 오류:', error)
        return c.json({ success: false, message: '배너 상태 변경 실패' }, 500)
    }
})

// ----- 이미지 업로드 -----

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'banners')
const ALLOWED_EXT = ['.png', '.jpg', '.jpeg', '.gif', '.webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

bannerRoutes.post('/api/admin/banners/upload', async (c: Context) => {
    try {
        const body = await c.req.parseBody()
        const file = body['file']
        if (!file || typeof file === 'string') {
            return c.json({ success: false, message: '파일이 없습니다' }, 400)
        }
        const ext = path.extname(file.name || '').toLowerCase()
        if (!ALLOWED_EXT.includes(ext)) {
            return c.json({ success: false, message: `허용되지 않는 파일 형식입니다 (${ALLOWED_EXT.join(', ')})` }, 400)
        }
        if (file.size > MAX_SIZE) {
            return c.json({ success: false, message: '파일 크기는 5MB 이하여야 합니다' }, 400)
        }
        fs.mkdirSync(UPLOAD_DIR, { recursive: true })
        const filename = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`
        const buffer = Buffer.from(await file.arrayBuffer())
        fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer)
        return c.json({ success: true, url: `/uploads/banners/${filename}` })
    } catch (error) {
        console.error('배너 업로드 오류:', error)
        return c.json({ success: false, message: '이미지 업로드 실패' }, 500)
    }
})

export default bannerRoutes
