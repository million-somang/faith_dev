import { Hono } from 'hono';
import { getDB } from '../db/adapter.js';
import { optionalAuth } from '../middleware/auth.js';

export const loungeRoutes = new Hono<{ Variables: { user?: { id: number; email: string; name?: string; role?: string } } }>();

// ============================================================================
// 1. 라운지 피드 목록 조회 (GET /api/lounge/posts)
// ============================================================================
loungeRoutes.get('/api/lounge/posts', optionalAuth, async (c) => {
    const DB = getDB(c);
    const user = c.get('user');
    const url = new URL(c.req.url);

    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10));
    const handleFilter = url.searchParams.get('handle') || null;
    const tagFilter = url.searchParams.get('tag') || null;
    const queryFilter = url.searchParams.get('q') || null;
    const currentHandle = url.searchParams.get('myHandle') || null;

    try {
        let whereClauses: string[] = [];
        let binds: any[] = [];

        if (handleFilter) {
            whereClauses.push('author_handle = ?');
            binds.push(handleFilter);
        }

        if (tagFilter) {
            whereClauses.push('(content LIKE ? OR content LIKE ?)');
            binds.push(`%#${tagFilter}%`, `%$${tagFilter}%`);
        }

        if (queryFilter) {
            whereClauses.push('(content LIKE ? OR author_name LIKE ? OR author_handle LIKE ?)');
            const term = `%${queryFilter}%`;
            binds.push(term, term, term);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // 총 게시글 수
        const countRow = await DB.prepare(`SELECT COUNT(*) as total FROM lounge_posts ${whereSql}`).bind(...binds).first();
        const total = countRow?.total || 0;

        // 게시글 목록 (고정글 우선, 최신순 정렬)
        const selectSql = `
            SELECT id, user_id, author_name, author_handle, author_avatar, author_badge,
                   content, image, ladder_data, likes, comments_count, is_pinned, created_at, updated_at
            FROM lounge_posts
            ${whereSql}
            ORDER BY is_pinned DESC, created_at DESC
            LIMIT ? OFFSET ?
        `;
        binds.push(limit, offset);

        const { results } = await DB.prepare(selectSql).bind(...binds).all();
        const postList = results || [];

        // 현재 사용자가 누른 좋아요 목록 조회
        const postIds = postList.map((p: any) => p.id);
        const likedPostSet = new Set<string>();

        if (postIds.length > 0 && (user?.id || currentHandle)) {
            const placeholders = postIds.map(() => '?').join(',');
            let likeCheckSql = `SELECT post_id FROM lounge_likes WHERE post_id IN (${placeholders})`;
            let likeBinds: any[] = [...postIds];

            if (user?.id) {
                likeCheckSql += ' AND (user_id = ? OR user_handle = ?)';
                likeBinds.push(user.id, currentHandle || '');
            } else if (currentHandle) {
                likeCheckSql += ' AND user_handle = ?';
                likeBinds.push(currentHandle);
            }

            const { results: likedRows } = await DB.prepare(likeCheckSql).bind(...likeBinds).all();
            (likedRows || []).forEach((row: any) => likedPostSet.add(row.post_id));
        }

        // 프론트엔드 Post 인터페이스 규격으로 포맷팅
        const formattedPosts = postList.map((row: any) => {
            let ladderData = undefined;
            if (row.ladder_data) {
                try {
                    ladderData = JSON.parse(row.ladder_data);
                } catch {}
            }

            const isMine = !!(
                (user?.id && row.user_id === user.id) ||
                (currentHandle && row.author_handle === currentHandle)
            );

            return {
                id: row.id,
                author: {
                    name: row.author_name,
                    handle: row.author_handle,
                    avatar: row.author_avatar || '🦊',
                    badge: row.author_badge || undefined
                },
                content: row.content,
                image: row.image || undefined,
                ladderData,
                createdAt: formatTimeAgo(row.created_at),
                rawCreatedAt: row.created_at,
                likes: row.likes || 0,
                commentsCount: row.comments_count || 0,
                hasLiked: likedPostSet.has(row.id),
                isMine
            };
        });

        return c.json({
            success: true,
            posts: formattedPosts,
            total,
            limit,
            offset
        });
    } catch (error: any) {
        console.error('[Lounge] 목록 조회 오류:', error);
        return c.json({ success: false, message: '라운지 피드 조회 실패', error: error.message }, 500);
    }
});

// ============================================================================
// 2. 새 피드 게시글 작성 (POST /api/lounge/posts)
// ============================================================================
loungeRoutes.post('/api/lounge/posts', optionalAuth, async (c) => {
    const DB = getDB(c);
    const user = c.get('user');

    try {
        const body = await c.req.json();
        const { content, image, ladderData, author } = body;

        if (!content || typeof content !== 'string' || !content.trim()) {
            return c.json({ success: false, message: '본문 내용을 입력해주세요.' }, 400);
        }

        const authorObj = author || {
            name: body.authorName,
            handle: body.authorHandle,
            avatar: body.authorAvatar,
            badge: body.authorBadge
        };

        if (!authorObj || !authorObj.name || !authorObj.handle) {
            return c.json({ success: false, message: '작성자 정보가 올바르지 않습니다.' }, 400);
        }

        const postId = body.id || `post-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const ladderDataStr = ladderData ? JSON.stringify(ladderData) : null;
        const userId = user?.id || null;

        await DB.prepare(`
            INSERT INTO lounge_posts (
                id, user_id, author_name, author_handle, author_avatar, author_badge,
                content, image, ladder_data, likes, comments_count, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).bind(
            postId,
            userId,
            authorObj.name,
            authorObj.handle,
            authorObj.avatar || '🦊',
            authorObj.badge || null,
            content.trim(),
            image || null,
            ladderDataStr
        ).run();

        const createdPost = {
            id: postId,
            author: {
                name: authorObj.name,
                handle: authorObj.handle,
                avatar: authorObj.avatar || '🦊',
                badge: authorObj.badge || undefined
            },
            content: content.trim(),
            image: image || undefined,
            ladderData: ladderData || undefined,
            createdAt: '방금 전',
            rawCreatedAt: new Date().toISOString(),
            likes: 0,
            commentsCount: 0,
            hasLiked: false,
            isMine: true
        };

        return c.json({ success: true, post: createdPost });
    } catch (error: any) {
        console.error('[Lounge] 게시글 작성 오류:', error);
        return c.json({ success: false, message: '게시글 작성 실패', error: error.message }, 500);
    }
});

// ============================================================================
// 3. 게시글 수정 (PUT /api/lounge/posts/:id)
// ============================================================================
loungeRoutes.put('/api/lounge/posts/:id', optionalAuth, async (c) => {
    const DB = getDB(c);
    const user = c.get('user');
    const postId = c.req.param('id');

    try {
        const body = await c.req.json();
        const { content, handle } = body;

        if (!content || !content.trim()) {
            return c.json({ success: false, message: '수정할 내용을 입력해주세요.' }, 400);
        }

        // 기존 게시글 조회
        const post = await DB.prepare('SELECT user_id, author_handle FROM lounge_posts WHERE id = ?').bind(postId).first();
        if (!post) {
            return c.json({ success: false, message: '게시글을 찾을 수 없습니다.' }, 404);
        }

        // 권한 확인: 로그인 유저 ID 일치, 핸들 일치, 또는 관리자
        const isAuthorized = (
            (user?.id && post.user_id === user.id) ||
            (handle && post.author_handle === handle) ||
            (user?.role === 'admin')
        );

        if (!isAuthorized) {
            return c.json({ success: false, message: '게시글 수정 권한이 없습니다.' }, 403);
        }

        await DB.prepare(`
            UPDATE lounge_posts
            SET content = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(content.trim(), postId).run();

        return c.json({ success: true, message: '게시글이 성공적으로 수정되었습니다.' });
    } catch (error: any) {
        console.error('[Lounge] 게시글 수정 오류:', error);
        return c.json({ success: false, message: '게시글 수정 실패', error: error.message }, 500);
    }
});

// ============================================================================
// 4. 게시글 삭제 (DELETE /api/lounge/posts/:id)
// ============================================================================
loungeRoutes.delete('/api/lounge/posts/:id', optionalAuth, async (c) => {
    const DB = getDB(c);
    const user = c.get('user');
    const postId = c.req.param('id');
    const handle = c.req.query('handle') || null;

    try {
        const post = await DB.prepare('SELECT user_id, author_handle FROM lounge_posts WHERE id = ?').bind(postId).first();
        if (!post) {
            return c.json({ success: false, message: '게시글을 찾을 수 없습니다.' }, 404);
        }

        // 권한 확인
        const isAuthorized = (
            (user?.id && post.user_id === user.id) ||
            (handle && post.author_handle === handle) ||
            (user?.role === 'admin')
        );

        if (!isAuthorized) {
            return c.json({ success: false, message: '게시글 삭제 권한이 없습니다.' }, 403);
        }

        await DB.prepare('DELETE FROM lounge_posts WHERE id = ?').bind(postId).run();

        return c.json({ success: true, message: '게시글이 성공적으로 삭제되었습니다.' });
    } catch (error: any) {
        console.error('[Lounge] 게시글 삭제 오류:', error);
        return c.json({ success: false, message: '게시글 삭제 실패', error: error.message }, 500);
    }
});

// ============================================================================
// 5. 좋아요 토글 (POST /api/lounge/posts/:id/like)
// ============================================================================
loungeRoutes.post('/api/lounge/posts/:id/like', optionalAuth, async (c) => {
    const DB = getDB(c);
    const user = c.get('user');
    const postId = c.req.param('id');

    try {
        const body = await c.req.json().catch(() => ({}));
        const handle = body.handle || (user?.name ? `@${user.name}` : '@guest_user');

        const post = await DB.prepare('SELECT id, likes FROM lounge_posts WHERE id = ?').bind(postId).first();
        if (!post) {
            return c.json({ success: false, message: '게시글을 찾을 수 없습니다.' }, 404);
        }

        // 이미 좋아요를 눌렀는지 확인
        const existingLike = await DB.prepare(
            'SELECT id FROM lounge_likes WHERE post_id = ? AND user_handle = ?'
        ).bind(postId, handle).first();

        let hasLiked = false;
        let newLikes = post.likes || 0;

        if (existingLike) {
            // 좋아요 취소
            await DB.prepare('DELETE FROM lounge_likes WHERE id = ?').bind(existingLike.id).run();
            newLikes = Math.max(0, newLikes - 1);
            await DB.prepare('UPDATE lounge_posts SET likes = ? WHERE id = ?').bind(newLikes, postId).run();
            hasLiked = false;
        } else {
            // 좋아요 추가
            await DB.prepare(
                'INSERT INTO lounge_likes (post_id, user_id, user_handle) VALUES (?, ?, ?)'
            ).bind(postId, user?.id || null, handle).run();
            newLikes += 1;
            await DB.prepare('UPDATE lounge_posts SET likes = ? WHERE id = ?').bind(newLikes, postId).run();
            hasLiked = true;
        }

        return c.json({ success: true, hasLiked, likes: newLikes });
    } catch (error: any) {
        console.error('[Lounge] 좋아요 토글 오류:', error);
        return c.json({ success: false, message: '좋아요 처리 실패', error: error.message }, 500);
    }
});

// ============================================================================
// 6. 레거시 로컬스토리지 글 1회성 마이그레이션 (POST /api/lounge/sync-legacy)
// ============================================================================
loungeRoutes.post('/api/lounge/sync-legacy', optionalAuth, async (c) => {
    const DB = getDB(c);
    const user = c.get('user');

    try {
        const body = await c.req.json();
        const { posts } = body;

        if (!Array.isArray(posts) || posts.length === 0) {
            return c.json({ success: true, syncedCount: 0 });
        }

        let syncedCount = 0;
        for (const p of posts) {
            if (!p.id || !p.content || !p.author) continue;
            // 이미 존재하는지 확인
            const exists = await DB.prepare('SELECT id FROM lounge_posts WHERE id = ?').bind(p.id).first();
            if (!exists) {
                const ladderDataStr = p.ladderData ? JSON.stringify(p.ladderData) : null;
                await DB.prepare(`
                    INSERT INTO lounge_posts (
                        id, user_id, author_name, author_handle, author_avatar, author_badge,
                        content, image, ladder_data, likes, comments_count, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                `).bind(
                    p.id,
                    user?.id || null,
                    p.author.name || '베라 프렌즈',
                    p.author.handle || '@user_lounge',
                    p.author.avatar || '🦊',
                    p.author.badge || null,
                    p.content,
                    p.image || null,
                    ladderDataStr,
                    p.likes || 0,
                    p.commentsCount || 0
                ).run();
                syncedCount++;
            }
        }

        return c.json({ success: true, syncedCount });
    } catch (error: any) {
        console.error('[Lounge] 레거시 글 동기화 오류:', error);
        return c.json({ success: false, message: '동기화 실패', error: error.message }, 500);
    }
});

// 시간 포맷팅 헬퍼
function formatTimeAgo(dateStr: string): string {
    if (!dateStr) return '방금 전';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return '방금 전';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}분 전`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}시간 전`;
    if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}일 전`;
    return date.toLocaleDateString('ko-KR');
}
