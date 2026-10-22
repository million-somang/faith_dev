import { Hono } from 'hono';
import { optionalAuth } from '../middleware/auth.js';
import { getActorLabel, logActivity } from '../middleware/activityLogger.js';
import { MinihomeService, MinihomeMoodType, MinihomeRoomLayout } from '../services/minihome.service.js';

type RouteUser = {
    id: number;
    email: string;
    name?: string;
    role?: string;
};

export const minihomeRoutes = new Hono<{ Variables: { user?: RouteUser } }>();

// ============================================================================
// 1. 특정 핸들의 미니홈피 데이터 + 방명록 + 파도타기 이웃 목록 조회
//    GET /api/minihome/room/:handle
// ============================================================================
minihomeRoutes.get('/api/minihome/room/:handle', optionalAuth, async (c) => {
    try {
        const user = c.get('user');
        const rawHandle = c.req.param('handle') || 'vera_official';
        const viewerHandleQuery = c.req.query('viewerHandle') || '';
        const viewerNameQuery = c.req.query('viewerName') || '';

        const defaultUserHandle = user?.email
            ? user.email.split('@')[0]
            : (viewerHandleQuery || 'vera_guest');
        const effectiveViewerHandle = viewerHandleQuery || defaultUserHandle;
        const effectiveViewerName = user?.name || viewerNameQuery || effectiveViewerHandle;

        const targetHandle = (rawHandle === 'me' || rawHandle === 'my')
            ? effectiveViewerHandle
            : rawHandle;

        const visitorIp = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'local';
        const visitorKey = user?.id
            ? `uid_${user.id}`
            : `h_${MinihomeService.normalizeHandle(effectiveViewerHandle)}_${visitorIp}`;

        const profile = await MinihomeService.getOrCreateMinihome({
            targetHandle,
            viewerUserId: user?.id || null,
            viewerName: effectiveViewerName,
            viewerHandle: effectiveViewerHandle,
            visitorKey,
        });

        const guestbook = await MinihomeService.getGuestbook(
            profile.handle,
            user?.id || null,
            effectiveViewerHandle
        );

        const surfData = await MinihomeService.getSurfTargets(profile.handle);

        logActivity('🏡', '아지트방문', getActorLabel(c), `${profile.ownerName}(@${profile.handle}) 아지트 방문 (투데이 ${profile.todayVisitors} / 토탈 ${profile.totalVisitors})`);

        return c.json({
            success: true,
            data: {
                profile,
                guestbook,
                surf: surfData,
            },
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : '아지트 정보를 불러오지 못했습니다.';
        console.error('[Minihome] GET room error:', err);
        return c.json({
            success: false,
            error: { code: 500, message },
        }, 500);
    }
});

// ============================================================================
// 2. 내 미니룸 레이아웃 / 방 제목 / 기분 상태 / BGM 저장
//    PUT /api/minihome/room/:handle
// ============================================================================
minihomeRoutes.put('/api/minihome/room/:handle', optionalAuth, async (c) => {
    try {
        const user = c.get('user');
        const handle = c.req.param('handle');
        const body = await c.req.json() as {
            ownerName?: string;
            roomTitle?: string;
            statusMood?: MinihomeMoodType;
            statusMessage?: string;
            bgmTrackId?: string;
            layout?: MinihomeRoomLayout;
        };

        if (!handle) {
            return c.json({
                success: false,
                error: { code: 400, message: '미니홈피 핸들이 필요합니다.' },
            }, 400);
        }

        await MinihomeService.updateMinihome({
            handle,
            userId: user?.id || null,
            ownerName: body.ownerName,
            roomTitle: body.roomTitle,
            statusMood: body.statusMood,
            statusMessage: body.statusMessage,
            bgmTrackId: body.bgmTrackId,
            layout: body.layout,
        });

        return c.json({
            success: true,
            data: { updated: true },
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : '미니룸 저장 중 오류가 발생했습니다.';
        console.error('[Minihome] PUT room error:', err);
        return c.json({
            success: false,
            error: { code: 400, message },
        }, 400);
    }
});

// ============================================================================
// 3. 베라포인트 상점 아이템 구매
//    POST /api/minihome/shop/buy
// ============================================================================
minihomeRoutes.post('/api/minihome/shop/buy', optionalAuth, async (c) => {
    try {
        const user = c.get('user');
        const body = await c.req.json() as {
            handle?: string;
            itemId?: string;
        };

        const handle = body.handle || (user?.email ? user.email.split('@')[0] : '');
        if (!handle || !body.itemId) {
            return c.json({
                success: false,
                error: { code: 400, message: '구매할 아이템 정보가 올바르지 않습니다.' },
            }, 400);
        }

        const result = await MinihomeService.purchaseItem({
            userId: user?.id || null,
            handle,
            itemId: body.itemId,
        });

        return c.json({
            success: true,
            data: result,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : '아이템 구매에 실패했습니다.';
        console.error('[Minihome] POST shop/buy error:', err);
        return c.json({
            success: false,
            error: { code: 400, message },
        }, 400);
    }
});

// ============================================================================
// 4. 방명록(일촌평) 작성
//    POST /api/minihome/guestbook/:handle
// ============================================================================
minihomeRoutes.post('/api/minihome/guestbook/:handle', optionalAuth, async (c) => {
    try {
        const user = c.get('user');
        const hostHandle = c.req.param('handle');
        const body = await c.req.json() as {
            authorName?: string;
            authorHandle?: string;
            authorMinimiId?: string;
            content?: string;
        };

        if (!hostHandle || !body.content || !body.content.trim()) {
            return c.json({
                success: false,
                error: { code: 400, message: '방명록 내용을 입력해주세요.' },
            }, 400);
        }

        const effectiveAuthorHandle = body.authorHandle || (user?.email ? user.email.split('@')[0] : 'vera_friend');
        const effectiveAuthorName = user?.name || body.authorName || '베라 이웃';

        await MinihomeService.addGuestbook({
            hostHandle,
            authorUserId: user?.id || null,
            authorName: effectiveAuthorName,
            authorHandle: effectiveAuthorHandle,
            authorMinimiId: body.authorMinimiId || 'minimi-casual',
            content: body.content,
        });

        const guestbook = await MinihomeService.getGuestbook(
            hostHandle,
            user?.id || null,
            effectiveAuthorHandle
        );

        logActivity('📝', '방명록작성', getActorLabel(c), `@${hostHandle} 아지트에 방명록 등록: "${body.content.trim().slice(0, 28)}"`);

        return c.json({
            success: true,
            data: { guestbook },
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : '방명록 등록에 실패했습니다.';
        console.error('[Minihome] POST guestbook error:', err);
        return c.json({
            success: false,
            error: { code: 400, message },
        }, 400);
    }
});

// ============================================================================
// 5. 방명록 방 주인 답글 등록
//    POST /api/minihome/guestbook/:id/reply
// ============================================================================
minihomeRoutes.post('/api/minihome/guestbook/:id/reply', optionalAuth, async (c) => {
    try {
        const user = c.get('user');
        const entryId = parseInt(c.req.param('id'), 10);
        const body = await c.req.json() as {
            hostHandle?: string;
            replyText?: string;
            viewerHandle?: string;
        };

        if (!entryId || !body.hostHandle || !body.replyText) {
            return c.json({
                success: false,
                error: { code: 400, message: '답글 내용을 입력해주세요.' },
            }, 400);
        }

        await MinihomeService.replyGuestbook({
            entryId,
            hostHandle: body.hostHandle,
            replyText: body.replyText,
        });

        const guestbook = await MinihomeService.getGuestbook(
            body.hostHandle,
            user?.id || null,
            body.viewerHandle || body.hostHandle
        );

        return c.json({
            success: true,
            data: { guestbook },
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : '답글 저장 중 오류가 발생했습니다.';
        console.error('[Minihome] POST reply error:', err);
        return c.json({
            success: false,
            error: { code: 400, message },
        }, 400);
    }
});

// ============================================================================
// 6. 방명록 Soft Delete 처리 (Hard Delete 절대 금지)
//    PATCH /api/minihome/guestbook/:id/delete
// ============================================================================
minihomeRoutes.patch('/api/minihome/guestbook/:id/delete', optionalAuth, async (c) => {
    try {
        const user = c.get('user');
        const entryId = parseInt(c.req.param('id'), 10);
        const body = await c.req.json() as {
            hostHandle?: string;
            requesterHandle?: string;
        };

        if (!entryId || !body.hostHandle) {
            return c.json({
                success: false,
                error: { code: 400, message: '잘못된 요청입니다.' },
            }, 400);
        }

        const effectiveRequesterHandle = body.requesterHandle || (user?.email ? user.email.split('@')[0] : body.hostHandle);

        await MinihomeService.softDeleteGuestbook({
            entryId,
            requesterUserId: user?.id || null,
            requesterHandle: effectiveRequesterHandle,
        });

        const guestbook = await MinihomeService.getGuestbook(
            body.hostHandle,
            user?.id || null,
            effectiveRequesterHandle
        );

        return c.json({
            success: true,
            data: { guestbook },
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : '방명록 삭제 처리에 실패했습니다.';
        console.error('[Minihome] PATCH delete error:', err);
        return c.json({
            success: false,
            error: { code: 400, message },
        }, 400);
    }
});

// ============================================================================
// 7. 파도타기(이웃 미니룸 랜덤 & 인기 목록 조회)
//    GET /api/minihome/surf
// ============================================================================
minihomeRoutes.get('/api/minihome/surf', optionalAuth, async (c) => {
    try {
        const exclude = c.req.query('exclude') || '';
        const data = await MinihomeService.getSurfTargets(exclude);
        return c.json({
            success: true,
            data,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : '파도타기 목록을 불러오지 못했습니다.';
        console.error('[Minihome] GET surf error:', err);
        return c.json({
            success: false,
            error: { code: 500, message },
        }, 500);
    }
});
