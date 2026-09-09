import fs from 'fs';
import path from 'path';
import { Hono } from 'hono';
import { getDB } from '../db/adapter.js';
import { checkSession } from '../middleware/auth.js';
import { generateMarketingContent } from '../services/marketing/marketingAi.service.js';
import { generateCardSvg } from '../services/marketing/ogCardRenderer.service.js';
import { publishToSocialMedia } from '../services/marketing/metaPublisher.service.js';
import { getMiniAppScreenshot, getMiniAppScreenshots } from '../services/marketing/screenshot.service.js';

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

function generateMockupSvg(slug: string, stepIndex: number, appName: string = ''): string {
    const titles = ['1. 진입 화면 (첫 접속 상태)', '2. 메인 컨텐츠 (조작·입력)', '3. 결과 리포트 (최종 산출)'];
    const stepColors = ['#4F46E5', '#059669', '#D97706'];
    const title = titles[stepIndex - 1] || '미니앱 화면';
    const color = stepColors[stepIndex - 1] || '#4F46E5';
    const displayName = appName || slug.replace(/^app-/, '');

    return `<svg xmlns="http://www.w3.org/2000/svg" width="430" height="860" viewBox="0 0 430 860">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F8FAFC" />
      <stop offset="100%" stop-color="#EDF2F7" />
    </linearGradient>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0F172A" flood-opacity="0.06" />
    </filter>
  </defs>
  <rect width="430" height="860" fill="url(#bg)" />
  
  <!-- Status Bar Mock -->
  <rect x="0" y="0" width="430" height="44" fill="#FFFFFF" opacity="0.8" />
  <text x="32" y="28" font-family="-apple-system, sans-serif" font-size="14" font-weight="700" fill="#0F172A">9:41</text>
  <circle cx="390" cy="22" r="4" fill="#0F172A" />
  <circle cx="376" cy="22" r="4" fill="#0F172A" />

  <!-- App Header Bar -->
  <rect x="20" y="60" width="390" height="64" rx="16" fill="#FFFFFF" filter="url(#cardShadow)" />
  <circle cx="52" cy="92" r="18" fill="${color}" />
  <text x="52" y="98" font-family="-apple-system, sans-serif" font-size="16" font-weight="900" fill="#FFFFFF" text-anchor="middle">V</text>
  <text x="82" y="98" font-family="-apple-system, sans-serif" font-size="17" font-weight="800" fill="#0F172A">${displayName}</text>

  <!-- Step Badge -->
  <rect x="20" y="144" width="390" height="42" rx="12" fill="${color}" opacity="0.12" />
  <text x="215" y="170" font-family="-apple-system, sans-serif" font-size="14" font-weight="800" fill="${color}" text-anchor="middle">${title}</text>

  <!-- Interactive Card 1 -->
  <rect x="20" y="206" width="390" height="180" rx="20" fill="#FFFFFF" filter="url(#cardShadow)" />
  <rect x="40" y="226" width="140" height="24" rx="8" fill="#F1F5F9" />
  <rect x="40" y="266" width="350" height="44" rx="12" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5" />
  <text x="60" y="294" font-family="-apple-system, sans-serif" font-size="14" fill="#94A3B8">입력 대기 중...</text>
  <rect x="40" y="326" width="350" height="40" rx="10" fill="${color}" />
  <text x="215" y="351" font-family="-apple-system, sans-serif" font-size="14" font-weight="700" fill="#FFFFFF" text-anchor="middle">실시간 결과 확인</text>

  <!-- Interactive Card 2 -->
  <rect x="20" y="406" width="390" height="220" rx="20" fill="#FFFFFF" filter="url(#cardShadow)" />
  <rect x="40" y="426" width="180" height="24" rx="8" fill="#F1F5F9" />
  <rect x="40" y="466" width="350" height="60" rx="12" fill="#F8FAFC" />
  <rect x="40" y="542" width="350" height="60" rx="12" fill="#F8FAFC" />

  <!-- Bottom CTA Bar -->
  <rect x="20" y="780" width="390" height="50" rx="25" fill="#0F172A" />
  <text x="215" y="811" font-family="-apple-system, sans-serif" font-size="14" font-weight="800" fill="#FFFFFF" text-anchor="middle">브라우저에서 무료 즉시 실행</text>
</svg>`;
}

// ==================== 0. 스크린샷 이미지 직접 제공 (디스크 PNG 우선, 부재 시 고품질 SVG 목업 반환) ====================
marketingRoutes.get('/api/admin/marketing/screenshot-image/:slug/:index', async (c) => {
    const slug = path.basename(c.req.param('slug') || '');
    const indexStr = c.req.param('index') || '1';
    const index = Math.max(1, Math.min(3, parseInt(indexStr, 10) || 1));
    const filename = `${slug}_key${index}.png`;

    const candidateDirs = [
        path.resolve(process.cwd(), 'public/uploads/marketing/screenshots'),
        path.resolve(process.cwd(), 'apps/api-server/public/uploads/marketing/screenshots'),
        path.resolve('./public/uploads/marketing/screenshots')
    ];

    for (const dir of candidateDirs) {
        const fp = path.join(dir, filename);
        if (fs.existsSync(fp)) {
            try {
                const buf = fs.readFileSync(fp);
                if (buf.length > 100) {
                    return new Response(buf, {
                        status: 200,
                        headers: {
                            'Content-Type': 'image/png',
                            'Content-Length': String(buf.length),
                            'Cache-Control': 'public, max-age=86400',
                            'Access-Control-Allow-Origin': '*'
                        }
                    });
                }
            } catch (e) {}
        }
    }

    // 파일이 디스크에 아직 없거나 캡처 실패 시에도 절대 깨지지 않는 고품질 SVG 목업 반환
    const fallbackSvg = generateMockupSvg(slug, index);
    return new Response(fallbackSvg, {
        status: 200,
        headers: {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=60',
            'Access-Control-Allow-Origin': '*'
        }
    });
});

// 파일명 직접 접근 정적 서빙 라우트
marketingRoutes.get('/uploads/marketing/screenshots/:filename', async (c) => {
    const rawFilename = path.basename(c.req.param('filename') || '');
    const candidateDirs = [
        path.resolve(process.cwd(), 'public/uploads/marketing/screenshots'),
        path.resolve(process.cwd(), 'apps/api-server/public/uploads/marketing/screenshots'),
        path.resolve('./public/uploads/marketing/screenshots')
    ];

    for (const dir of candidateDirs) {
        const fp = path.join(dir, rawFilename);
        if (fs.existsSync(fp)) {
            try {
                const buf = fs.readFileSync(fp);
                if (buf.length > 100) {
                    return new Response(buf, {
                        status: 200,
                        headers: {
                            'Content-Type': 'image/png',
                            'Content-Length': String(buf.length),
                            'Cache-Control': 'public, max-age=86400',
                            'Access-Control-Allow-Origin': '*'
                        }
                    });
                }
            } catch (e) {}
        }
    }

    const match = rawFilename.match(/^(.+)_key([1-3])\.png$/);
    const slug = match ? match[1] : rawFilename.replace(/\.png$/, '');
    const idx = match ? parseInt(match[2], 10) : 1;
    const fallbackSvg = generateMockupSvg(slug, idx);
    return new Response(fallbackSvg, {
        status: 200,
        headers: {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=60',
            'Access-Control-Allow-Origin': '*'
        }
    });
});

marketingRoutes.use('/api/admin/marketing/*', requireMarketingAdmin);
marketingRoutes.use('/api/admin/marketing', requireMarketingAdmin);

// ==================== 1. AI 카피 및 카드뉴스 즉시 생성 ====================
marketingRoutes.post('/api/admin/marketing/generate', async (c) => {
    const DB = getDB(c);
    try {
        const body = await c.req.json();
        const { serviceSlug, forceScreenshot = false } = body;

        if (!serviceSlug) {
            return c.json({ success: false, message: '대상 서비스(serviceSlug)를 선택해주세요.' }, 400);
        }

        // mini_apps 테이블에서 메타데이터 조회
        const app = await DB.prepare("SELECT * FROM mini_apps WHERE slug = ?").bind(serviceSlug).first();
        if (!app) {
            return c.json({ success: false, message: '등록되지 않은 미니앱입니다.' }, 404);
        }

        // 1. 미니앱 실제 화면 3단계 멀티 컷 캡처 (홈, 입력, 결과)
        let screenshots: string[] = [];
        try {
            screenshots = await getMiniAppScreenshots({
                slug: app.slug,
                targetUrl: app.app_url,
                name: app.name,
                force: Boolean(forceScreenshot)
            });
        } catch (e: any) {
            console.warn('[MarketingAPI] Screenshot capture error:', e.message);
        }

        const screenshotUri = screenshots[0] || '';

        // 2. Gemini AI 마케팅 카피 생성
        const aiResult = await generateMarketingContent({
            name: app.name,
            slug: app.slug,
            description: app.description || '',
            app_url: app.app_url,
            category: app.category || '유틸리티'
        });

        // 3. 1080x1080 동적 카드뉴스 SVG 생성 (최소 3개 화면이 담긴 슬라이드 1, 2, 3 세트)
        const cardSvg = generateCardSvg({
            title: aiResult.headline,
            subtitle: aiResult.subtitle,
            tag: aiResult.tag,
            domain: 'veranex.app',
            slug: app.slug,
            screenshots,
            screenshotUri,
            slideIndex: 1
        });

        const cardSvg2 = generateCardSvg({
            title: aiResult.headline,
            subtitle: aiResult.subtitle,
            tag: aiResult.tag,
            domain: 'veranex.app',
            slug: app.slug,
            screenshots,
            screenshotUri,
            slideIndex: 2
        });

        const cardSvg3 = generateCardSvg({
            title: aiResult.headline,
            subtitle: aiResult.subtitle,
            tag: aiResult.tag,
            domain: 'veranex.app',
            slug: app.slug,
            screenshots,
            screenshotUri,
            slideIndex: 3
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
                screenshots,
                screenshotUri,
                cardSvg,
                cardSet: [cardSvg, cardSvg2, cardSvg3]
            }
        });
    } catch (err: any) {
        console.error('[MarketingAPI] generate error:', err);
        return c.json({ success: false, message: err.message || '카피 생성 중 오류가 발생했습니다.' }, 500);
    }
});

// ==================== 1-1. 미니앱 실화면 캡처 수동 요청 ====================
marketingRoutes.post('/api/admin/marketing/screenshot/capture', async (c) => {
    const DB = getDB(c);
    try {
        const body = await c.req.json();
        const { slug, force = true } = body;

        if (!slug) {
            return c.json({ success: false, message: '미니앱 slug가 필요합니다.' }, 400);
        }

        const app = await DB.prepare("SELECT * FROM mini_apps WHERE slug = ?").bind(slug).first();
        if (!app) {
            return c.json({ success: false, message: '미니앱을 찾을 수 없습니다.' }, 404);
        }

        const screenshots = await getMiniAppScreenshots({
            slug: app.slug,
            targetUrl: app.app_url,
            name: app.name,
            force: Boolean(force)
        });

        return c.json({
            success: true,
            screenshots,
            screenshotUri: screenshots[0] || ''
        });
    } catch (err: any) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// ==================== 1-2. 카드뉴스 실시간 미리보기 리렌더링 ====================
marketingRoutes.post('/api/admin/marketing/card-preview', async (c) => {
    try {
        const body = await c.req.json();
        const { title, subtitle, tag, domain, slug, screenshots, screenshotUri, slideIndex = 1 } = body;

        let resolvedScreenshots = Array.isArray(screenshots) && screenshots.length > 0
            ? screenshots
            : (screenshotUri ? [screenshotUri] : []);

        if (resolvedScreenshots.length === 0 && slug) {
            resolvedScreenshots = [
                `/api/admin/marketing/screenshot-image/${slug}/1`,
                `/api/admin/marketing/screenshot-image/${slug}/2`,
                `/api/admin/marketing/screenshot-image/${slug}/3`
            ];
        }

        const commonOptions = {
            title: title || '스마트 웹 툴킷',
            subtitle: subtitle || '브라우저에서 즉시 실행',
            tag: tag || '무료 도구',
            domain: domain || 'veranex.app',
            slug: slug || 'app',
            screenshots: resolvedScreenshots,
            screenshotUri: resolvedScreenshots[0] || '',
        };

        const cardSet = [
            generateCardSvg({ ...commonOptions, slideIndex: 1 }),
            generateCardSvg({ ...commonOptions, slideIndex: 2 }),
            generateCardSvg({ ...commonOptions, slideIndex: 3 })
        ];

        const targetSlide = Number(slideIndex) || 1;
        const svg = cardSet[targetSlide - 1] || cardSet[0];

        return c.json({
            success: true,
            svg,
            cardSet
        });
    } catch (err: any) {
        return c.json({ success: false, message: err.message }, 500);
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
