import { Hono } from 'hono';
import { getDB } from '../db/adapter.js';
import { checkSession } from '../middleware/auth.js';
import { generateMarketingContent } from '../services/marketing/marketingAi.service.js';
import { generateCardSvg } from '../services/marketing/ogCardRenderer.service.js';
import { publishToSocialMedia } from '../services/marketing/metaPublisher.service.js';

export const marketingRoutes = new Hono<{ Variables: { adminUserId: string } }>();

// 관리자 권한 미들웨어 (브라우저 세션 쿠키 + Authorization 헤더 듀얼 지원)
const requireMarketingAdmin = async (c: any, next: any) => {
    // 1. 브라우저 세션 쿠키 우선 확인
    try {
        const sessionUser = await checkSession(c);
        if (sessionUser && (sessionUser.role === 'admin' || sessionUser.level >= 6)) {
            c.set('adminUserId', String(sessionUser.id));
            return next();
        }
    } catch (e) {}

    // 2. Authorization Bearer 헤더 확인 (REST 클라이언트 / 로컬스토리지 토큰 호환)
    const authHeader = c.req.header('Authorization');
    if (authHeader) {
        try {
            const token = authHeader.replace('Bearer ', '').trim();
            if (token && token !== 'true') {
                const decoded = Buffer.from(token, 'base64').toString();
                const userId = decoded.split(':')[0];
                if (userId) {
                    const DB = getDB(c);
                    const admin = await DB.prepare('SELECT id, level, status, role FROM users WHERE id = ?').bind(userId).first();
                    if (admin && (admin.role === 'admin' || admin.level >= 6) && admin.status === 'active') {
                        c.set('adminUserId', String(admin.id));
                        return next();
                    }
                }
            }
        } catch (e) {}
    }

    return c.json({ success: false, message: '관리자 권한이 필요합니다.' }, 401);
};

// 헬퍼: 활동 로그 기록
async function logActivity(db: any, userId: string | null, action: string, description: string) {
    try {
        await db.prepare('INSERT INTO activity_logs (user_id, action, description) VALUES (?, ?, ?)')
            .bind(userId, action, description).run();
    } catch (e) {}
}

marketingRoutes.use('/api/admin/marketing/*', requireMarketingAdmin);
marketingRoutes.use('/api/admin/marketing', requireMarketingAdmin);

// ==================== 1. AI 카피 및 카드뉴스 즉시 생성 ====================
marketingRoutes.post('/api/admin/marketing/generate', async (c) => {
    const DB = getDB(c);
    try {
        const body = await c.req.json();
        const { serviceSlug } = body;

        if (!serviceSlug) {
            return c.json({ success: false, message: '대상 서비스(serviceSlug)를 선택해주세요.' }, 400);
        }

        // mini_apps 테이블에서 메타데이터 조회
        const app = await DB.prepare("SELECT * FROM mini_apps WHERE slug = ?").bind(serviceSlug).first();
        if (!app) {
            return c.json({ success: false, message: '등록되지 않은 미니앱입니다.' }, 404);
        }

        // Gemini AI 마케팅 카피 생성
        const aiResult = await generateMarketingContent({
            name: app.name,
            slug: app.slug,
            description: app.description || '',
            app_url: app.app_url,
            category: app.category || '유틸리티'
        });

        // 1080x1080 동적 카드뉴스 SVG 생성
        const cardSvg = generateCardSvg({
            title: aiResult.headline,
            subtitle: aiResult.subtitle,
            tag: aiResult.tag,
            domain: 'veranex.app'
        });

        return c.json({
            success: true,
            data: {
                app: {
                    name: app.name,
                    slug: app.slug,
                    app_url: app.app_url,
                    category: app.category
                },
                content: aiResult,
                cardSvg
            }
        });
    } catch (err: any) {
        console.error('[MarketingAPI] generate error:', err);
        return c.json({ success: false, message: err.message || '카피 생성 중 오류가 발생했습니다.' }, 500);
    }
});

// ==================== 2. 마케팅 포스트 목록 조회 ====================
marketingRoutes.get('/api/admin/marketing/posts', async (c) => {
    const DB = getDB(c);
    try {
        const status = c.req.query('status'); // DRAFT, SCHEDULED, PUBLISHED, FAILED or empty for all
        const platform = c.req.query('platform');
        const limit = parseInt(c.req.query('limit') || '30', 10);
        const offset = parseInt(c.req.query('offset') || '0', 10);

        let query = "SELECT * FROM marketing_posts WHERE 1=1";
        const binds: any[] = [];

        if (status && status !== 'ALL') {
            query += " AND status = ?";
            binds.push(status);
        }

        if (platform && platform !== 'ALL') {
            query += " AND platform = ?";
            binds.push(platform);
        }

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        binds.push(limit, offset);

        const result = await DB.prepare(query).bind(...binds).all();

        // 전체 카운트
        const countResult = await DB.prepare("SELECT COUNT(*) as total FROM marketing_posts").first();

        return c.json({
            success: true,
            posts: result.results || [],
            total: countResult?.total || 0
        });
    } catch (err: any) {
        console.error('[MarketingAPI] list error:', err);
        return c.json({ success: false, message: err.message }, 500);
    }
});

// ==================== 3. 마케팅 포스트 신규 등록 (저장/예약/즉시) ====================
marketingRoutes.post('/api/admin/marketing/posts', async (c) => {
    const DB = getDB(c);
    try {
        const body = await c.req.json();
        const {
            targetServiceSlug,
            targetServiceName,
            targetServiceUrl,
            platform = 'THREADS',
            headline,
            bodyText,
            firstComment,
            imageUrl,
            status = 'DRAFT',
            scheduledAt,
            publishImmediately = false
        } = body;

        if (!bodyText || !targetServiceSlug) {
            return c.json({ success: false, message: '필수 필드가 누락되었습니다.' }, 400);
        }

        const id = `mkt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        let postStatus = status;
        let publishedAt = null;
        let externalPostId = null;
        let errorMessage = null;

        // 즉시 발행 요청인 경우
        if (publishImmediately) {
            postStatus = 'PUBLISHING';
            const pubResult = await publishToSocialMedia({
                id,
                platform,
                headline,
                bodyText,
                firstComment,
                imageUrl
            });

            if (pubResult.success) {
                postStatus = 'PUBLISHED';
                publishedAt = new Date().toISOString();
                externalPostId = pubResult.externalPostId || (pubResult.isMock ? 'mock_success' : 'meta_success');
            } else {
                postStatus = 'FAILED';
                errorMessage = pubResult.error || '발행 실패';
            }
        }

        await DB.prepare(`
            INSERT INTO marketing_posts (
                id, target_service_slug, target_service_name, target_service_url,
                platform, headline, body_text, first_comment, image_url,
                status, scheduled_at, published_at, external_post_id, error_message
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            id,
            targetServiceSlug,
            targetServiceName,
            targetServiceUrl,
            platform,
            headline || '',
            bodyText,
            firstComment || null,
            imageUrl || null,
            postStatus,
            scheduledAt || null,
            publishedAt,
            externalPostId,
            errorMessage
        ).run();

        const adminId = c.get('adminUserId');
        await logActivity(DB, adminId, 'MARKETING_CREATE', `마케팅 포스트 생성: ${headline} (${postStatus})`);

        return c.json({
            success: true,
            post: { id, status: postStatus, externalPostId, errorMessage }
        });
    } catch (err: any) {
        console.error('[MarketingAPI] create error:', err);
        return c.json({ success: false, message: err.message }, 500);
    }
});

// ==================== 4. 마케팅 포스트 수정 ====================
marketingRoutes.put('/api/admin/marketing/posts/:id', async (c) => {
    const DB = getDB(c);
    try {
        const id = c.req.param('id');
        const body = await c.req.json();
        const { headline, bodyText, firstComment, platform, scheduledAt, status } = body;

        await DB.prepare(`
            UPDATE marketing_posts
            SET headline = COALESCE(?, headline),
                body_text = COALESCE(?, body_text),
                first_comment = COALESCE(?, first_comment),
                platform = COALESCE(?, platform),
                scheduled_at = COALESCE(?, scheduled_at),
                status = COALESCE(?, status),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(headline, bodyText, firstComment, platform, scheduledAt, status, id).run();

        return c.json({ success: true, message: '포스트가 수정되었습니다.' });
    } catch (err: any) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// ==================== 5. 1-Click 즉시 발행 ====================
marketingRoutes.post('/api/admin/marketing/posts/:id/publish-now', async (c) => {
    const DB = getDB(c);
    try {
        const id = c.req.param('id');
        const post = await DB.prepare("SELECT * FROM marketing_posts WHERE id = ?").bind(id).first();
        if (!post) {
            return c.json({ success: false, message: '존재하지 않는 포스트입니다.' }, 404);
        }

        // 상태를 PUBLISHING으로 업데이트
        await DB.prepare("UPDATE marketing_posts SET status = 'PUBLISHING' WHERE id = ?").bind(id).run();

        const pubResult = await publishToSocialMedia({
            id: post.id,
            platform: post.platform,
            headline: post.headline,
            bodyText: post.body_text,
            firstComment: post.first_comment,
            imageUrl: post.image_url
        });

        if (pubResult.success) {
            await DB.prepare(`
                UPDATE marketing_posts
                SET status = 'PUBLISHED',
                    published_at = CURRENT_TIMESTAMP,
                    external_post_id = ?,
                    error_message = NULL,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(pubResult.externalPostId || 'mock_published', id).run();

            const adminId = c.get('adminUserId');
            await logActivity(DB, adminId, 'MARKETING_PUBLISH', `마케팅 포스트 발행 완료: ${post.headline}`);

            return c.json({ success: true, isMock: pubResult.isMock, externalPostId: pubResult.externalPostId });
        } else {
            await DB.prepare(`
                UPDATE marketing_posts
                SET status = 'FAILED',
                    error_message = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(pubResult.error || '발행 실패', id).run();

            return c.json({ success: false, message: pubResult.error }, 500);
        }
    } catch (err: any) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// ==================== 6. 실패 포스트 재시도 ====================
marketingRoutes.post('/api/admin/marketing/posts/:id/retry', async (c) => {
    const DB = getDB(c);
    try {
        const id = c.req.param('id');
        const post = await DB.prepare("SELECT * FROM marketing_posts WHERE id = ?").bind(id).first();
        if (!post) {
            return c.json({ success: false, message: '포스트를 찾을 수 없습니다.' }, 404);
        }

        // 재시도 디스패치
        const pubResult = await publishToSocialMedia({
            id: post.id,
            platform: post.platform,
            headline: post.headline,
            bodyText: post.body_text,
            firstComment: post.first_comment,
            imageUrl: post.image_url
        });

        if (pubResult.success) {
            await DB.prepare(`
                UPDATE marketing_posts
                SET status = 'PUBLISHED',
                    published_at = CURRENT_TIMESTAMP,
                    external_post_id = ?,
                    error_message = NULL,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(pubResult.externalPostId || 'mock_retry_success', id).run();

            return c.json({ success: true, message: '재발행 성공' });
        } else {
            await DB.prepare(`
                UPDATE marketing_posts
                SET status = 'FAILED',
                    error_message = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(pubResult.error, id).run();

            return c.json({ success: false, message: pubResult.error }, 500);
        }
    } catch (err: any) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// ==================== 7. 포스트 삭제 ====================
marketingRoutes.delete('/api/admin/marketing/posts/:id', async (c) => {
    const DB = getDB(c);
    try {
        const id = c.req.param('id');
        await DB.prepare("DELETE FROM marketing_posts WHERE id = ?").bind(id).run();
        return c.json({ success: true, message: '삭제되었습니다.' });
    } catch (err: any) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// ==================== 8. 대시보드 통계 메트릭 ====================
marketingRoutes.get('/api/admin/marketing/stats', async (c) => {
    const DB = getDB(c);
    try {
        const total = await DB.prepare("SELECT COUNT(*) as count FROM marketing_posts").first();
        const draft = await DB.prepare("SELECT COUNT(*) as count FROM marketing_posts WHERE status = 'DRAFT'").first();
        const scheduled = await DB.prepare("SELECT COUNT(*) as count FROM marketing_posts WHERE status = 'SCHEDULED'").first();
        const published = await DB.prepare("SELECT COUNT(*) as count FROM marketing_posts WHERE status = 'PUBLISHED'").first();
        const failed = await DB.prepare("SELECT COUNT(*) as count FROM marketing_posts WHERE status = 'FAILED'").first();

        // 오늘 발행 건수
        const todayStr = new Date().toISOString().slice(0, 10);
        const todayPublished = await DB.prepare(`
            SELECT COUNT(*) as count FROM marketing_posts 
            WHERE status = 'PUBLISHED' AND published_at >= ?
        `).bind(`${todayStr} 00:00:00`).first();

        return c.json({
            success: true,
            stats: {
                total: total?.count || 0,
                draft: draft?.count || 0,
                scheduled: scheduled?.count || 0,
                published: published?.count || 0,
                failed: failed?.count || 0,
                todayPublished: todayPublished?.count || 0
            }
        });
    } catch (err: any) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// ==================== 9. 자동화 설정 조회 및 저장 ====================
marketingRoutes.get('/api/admin/marketing/settings', async (c) => {
    const DB = getDB(c);
    try {
        const settings = await DB.prepare("SELECT * FROM marketing_settings").all();
        const config: Record<string, string> = {};
        for (const s of (settings.results || [])) {
            config[s.key] = s.value;
        }
        return c.json({ success: true, settings: config });
    } catch (err: any) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

marketingRoutes.put('/api/admin/marketing/settings', async (c) => {
    const DB = getDB(c);
    try {
        const body = await c.req.json();
        for (const [key, value] of Object.entries(body)) {
            await DB.prepare(`
                INSERT INTO marketing_settings (key, value, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
            `).bind(key, String(value)).run();
        }
        return c.json({ success: true, message: '설정이 저장되었습니다.' });
    } catch (err: any) {
        return c.json({ success: false, message: err.message }, 500);
    }
});
