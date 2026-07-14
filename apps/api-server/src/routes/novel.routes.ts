import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { getDB } from '../db/adapter.js';
import * as fs from 'fs';
import * as path from 'path';

const router = new Hono<{ Variables: { user?: any } }>();

// DB 테이블 생성 및 시드 데이터 초기화
async function initNovelDatabase() {
    const db = await getDB(null as any);

    // 1. 소설 테이블
    await db.prepare(`
        CREATE TABLE IF NOT EXISTS novel_novels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            description TEXT,
            cover_url TEXT,
            genre TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    // 2. 에피소드 테이블
    await db.prepare(`
        CREATE TABLE IF NOT EXISTS novel_episodes_v2 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            novel_id INTEGER NOT NULL,
            episode_no INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            is_free INTEGER DEFAULT 1,
            price INTEGER DEFAULT 100,
            views INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    // 3. 골드 지갑 테이블
    await db.prepare(`
        CREATE TABLE IF NOT EXISTS novel_user_gold (
            user_id INTEGER PRIMARY KEY,
            gold_balance INTEGER DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    // 4. 회차 구매 내역 테이블
    await db.prepare(`
        CREATE TABLE IF NOT EXISTS novel_purchases (
            user_id INTEGER,
            novel_id INTEGER,
            episode_no INTEGER,
            purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, novel_id, episode_no)
        )
    `).run();

    // 5. 북마크(선호작) 테이블
    await db.prepare(`
        CREATE TABLE IF NOT EXISTS novel_bookmarks (
            user_id INTEGER,
            novel_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, novel_id)
        )
    `).run();

    // 6. 최근 읽은 내역 (이어보기)
    await db.prepare(`
        CREATE TABLE IF NOT EXISTS novel_history (
            user_id INTEGER,
            novel_id INTEGER,
            last_episode_no INTEGER NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, novel_id)
        )
    `).run();

}

// 초기화 실행
initNovelDatabase().catch(err => console.error('[SQLite] Web Novel DB Init Failed:', err));

// 1. [공통] 전체 소설 리스트 및 장르 필터 조회
router.get('/list', async (c) => {
    const db = await getDB(c);
    const genre = c.req.query('genre');
    let list;
    if (genre && genre !== 'all') {
        const res = await db.prepare('SELECT * FROM novel_novels WHERE genre = ? ORDER BY id DESC').bind(genre).all();
        list = res.results;
    } else {
        const res = await db.prepare('SELECT * FROM novel_novels ORDER BY id DESC').all();
        list = res.results;
    }
    return c.json({ success: true, list });
});

// 2. [공통] 실시간 베스트 TOP 3 조회 (조회수 누적 기반)
router.get('/best', async (c) => {
    const db = await getDB(c);
    const res = await db.prepare(`
        SELECT n.*, SUM(e.views) as total_views 
        FROM novel_novels n
        LEFT JOIN novel_episodes_v2 e ON n.id = e.novel_id
        GROUP BY n.id
        ORDER BY total_views DESC
        LIMIT 3
    `).all();
    return c.json({ success: true, list: res.results });
});

// 3. [공통] 소설 상세 및 회차(에피소드) 리스트 조회
router.get('/detail', async (c) => {
    const db = await getDB(c);
    const novelId = parseInt(c.req.query('id') || '0', 10);
    if (!novelId) return c.json({ success: false, message: '올바르지 않은 작품 ID' }, 400);

    const novel = await db.prepare('SELECT * FROM novel_novels WHERE id = ?').bind(novelId).first();
    if (!novel) return c.json({ success: false, message: '작품을 찾을 수 없습니다.' }, 404);

    const epRes = await db.prepare(
        'SELECT id, novel_id, episode_no, title, is_free, price, views, created_at FROM novel_episodes_v2 WHERE novel_id = ? ORDER BY episode_no ASC'
    ).bind(novelId).all();

    return c.json({ success: true, novel, episodes: epRes.results });
});

// 4. [인증] 작가 소설 등록 표지 이미지 업로드 API
router.post('/upload-cover', requireAuth, async (c) => {
    try {
        const body = await c.req.parseBody();
        const file = body.image;
        if (!file || typeof file === 'string') {
            return c.json({ success: false, message: '업로드할 이미지가 없습니다.' }, 400);
        }

        const uploadDir = path.resolve('./public/uploads/novels');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const ext = path.extname(file.name) || '.png';
        const newFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
        const filePath = path.join(uploadDir, newFileName);

        // 파일 쓰기
        const arrayBuffer = await file.arrayBuffer();
        await fs.promises.writeFile(filePath, Buffer.from(arrayBuffer));

        return c.json({
            success: true,
            cover_url: `/uploads/novels/${newFileName}`
        });
    } catch (e: any) {
        console.error(e);
        return c.json({ success: false, message: e.message }, 500);
    }
});

// 5. [인증] 작가 새 소설 작품 등록 API
router.post('/create', requireAuth, async (c) => {
    const db = await getDB(c);
    const user = c.get('user');
    const { title, author, description, coverUrl, genre } = await c.req.json();

    if (!title || !author || !genre) {
        return c.json({ success: false, message: '필수 항목(제목, 작가명, 장르)이 누락되었습니다.' }, 400);
    }

    const res = await db.prepare(
        `INSERT INTO novel_novels (author_id, title, author, description, cover_url, genre)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(user.id, title, author, description, coverUrl || '', genre).run();

    return c.json({ success: true, novelId: res.lastInsertRowid });
});

// 6. [인증] 작가 내 창작 작품 리스트 조회 API
router.get('/writer/list', requireAuth, async (c) => {
    const db = await getDB(c);
    const user = c.get('user');

    const res = await db.prepare('SELECT * FROM novel_novels WHERE author_id = ? ORDER BY id DESC').bind(user.id).all();
    return c.json({ success: true, list: res.results });
});

// 7. [인증] 작가 특정 소설 새 회차 등록 API (유/무료 체크 & 요금 설정 포함)
router.post('/episode/create', requireAuth, async (c) => {
    const db = await getDB(c);
    const user = c.get('user');
    const { novelId, title, content, isFree, price } = await c.req.json();

    if (!novelId || !title || !content) {
        return c.json({ success: false, message: '필수 필드가 누락되었습니다.' }, 400);
    }

    // 작성자가 해당 소설의 실제 작가인지 검사
    const novel = await db.prepare('SELECT author_id FROM novel_novels WHERE id = ?').bind(novelId).first();
    if (!novel) return c.json({ success: false, message: '존재하지 않는 소설입니다.' }, 404);
    if (novel.author_id !== user.id) {
        return c.json({ success: false, message: '해당 작품의 집필 권한이 없습니다.' }, 403);
    }

    // 다음 회차 번호 계산
    const lastEp = await db.prepare('SELECT MAX(episode_no) as max_no FROM novel_episodes_v2 WHERE novel_id = ?').bind(novelId).first();
    const nextEpNo = (lastEp?.max_no || 0) + 1;

    await db.prepare(
        `INSERT INTO novel_episodes_v2 (novel_id, episode_no, title, content, is_free, price)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(novelId, nextEpNo, title, content, isFree ? 1 : 0, isFree ? 0 : (price || 100)).run();

    return c.json({ success: true, episodeNo: nextEpNo });
});

// 8. [인증] 독자 회차 읽기 API (유/무료 잠금 필터링 & 최근 본 내역 등록)
router.get('/episode', requireAuth, async (c) => {
    const db = await getDB(c);
    const user = c.get('user');
    const novelId = parseInt(c.req.query('novelId') || '0', 10);
    const episodeNo = parseInt(c.req.query('episodeNo') || '0', 10);

    if (!novelId || !episodeNo) {
        return c.json({ success: false, message: '올바르지 않은 조회 인자' }, 400);
    }

    const ep = await db.prepare(
        'SELECT * FROM novel_episodes_v2 WHERE novel_id = ? AND episode_no = ?'
    ).bind(novelId, episodeNo).first();
    if (!ep) return c.json({ success: false, message: '해당 회차를 찾을 수 없습니다.' }, 404);

    // 조회수 1 증가
    await db.prepare('UPDATE novel_episodes_v2 SET views = views + 1 WHERE id = ?').bind(ep.id).run();

    // 유료 회차 여부 및 구매 여부 체크
    let isLocked = false;
    if (ep.is_free === 0) {
        // 본인 소설이면 무료 통과
        const novel = await db.prepare('SELECT author_id FROM novel_novels WHERE id = ?').bind(novelId).first();
        if (novel && novel.author_id !== user.id) {
            // 구매 이력 조회
            const purchase = await db.prepare(
                'SELECT 1 FROM novel_purchases WHERE user_id = ? AND novel_id = ? AND episode_no = ?'
            ).bind(user.id, novelId, episodeNo).first();
            if (!purchase) {
                isLocked = true;
            }
        }
    }

    // 잠금 상태인 경우 소설 본문을 마스킹 처리하여 반환
    const cleanEpisode = { ...ep };
    if (isLocked) {
        cleanEpisode.content = '이 에피소드는 유료 회차입니다. 대여 시 즉시 공개됩니다. (대여비: 100 골드)';
    }

    // 최근 본 목록(이어보기) 추가/업데이트
    await db.prepare(`
        INSERT INTO novel_history (user_id, novel_id, last_episode_no, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, novel_id) DO UPDATE SET last_episode_no = excluded.last_episode_no, updated_at = CURRENT_TIMESTAMP
    `).bind(user.id, novelId, episodeNo).run();

    return c.json({
        success: true,
        episode: cleanEpisode,
        isLocked
    });
});

// 9. [인증] 골드 잔액 조회 API
router.get('/gold', requireAuth, async (c) => {
    const db = await getDB(c);
    const user = c.get('user');

    let wallet = await db.prepare('SELECT gold_balance FROM novel_user_gold WHERE user_id = ?').bind(user.id).first();
    if (!wallet) {
        await db.prepare('INSERT INTO novel_user_gold (user_id, gold_balance) VALUES (?, 0)').bind(user.id).run();
        wallet = { gold_balance: 0 };
    }

    return c.json({ success: true, balance: wallet.gold_balance });
});

// 10. [인증] 골드 충전 (Mock 결제) API
router.post('/charge', requireAuth, async (c) => {
    const db = await getDB(c);
    const user = c.get('user');
    const { amount } = await c.req.json();

    if (!amount || amount <= 0) {
        return c.json({ success: false, message: '올바르지 않은 충전 금액' }, 400);
    }

    // 지갑 보장
    await db.prepare('INSERT OR IGNORE INTO novel_user_gold (user_id, gold_balance) VALUES (?, 0)').bind(user.id).run();
    
    // 충전 처리
    await db.prepare(
        'UPDATE novel_user_gold SET gold_balance = gold_balance + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
    ).bind(amount, user.id).run();

    const wallet = await db.prepare('SELECT gold_balance FROM novel_user_gold WHERE user_id = ?').bind(user.id).first();

    return c.json({ success: true, balance: wallet.gold_balance });
});

// 11. [인증] 회차 구매 API
router.post('/purchase', requireAuth, async (c) => {
    const db = await getDB(c);
    const user = c.get('user');
    const { novelId, episodeNo } = await c.req.json();

    if (!novelId || !episodeNo) {
        return c.json({ success: false, message: '올바르지 않은 파라미터' }, 400);
    }

    const ep = await db.prepare(
        'SELECT is_free, price FROM novel_episodes_v2 WHERE novel_id = ? AND episode_no = ?'
    ).bind(novelId, episodeNo).first();
    if (!ep) return c.json({ success: false, message: '회차를 찾을 수 없습니다.' }, 404);

    if (ep.is_free === 1) {
        return c.json({ success: false, message: '이미 무료로 열람 가능한 회차입니다.' }, 400);
    }

    // 이미 구매했는지 확인
    const purchase = await db.prepare(
        'SELECT 1 FROM novel_purchases WHERE user_id = ? AND novel_id = ? AND episode_no = ?'
    ).bind(user.id, novelId, episodeNo).first();
    if (purchase) {
        return c.json({ success: true, message: '이미 구매 완료된 회차입니다.' });
    }

    // 지갑 및 잔액 조회
    let wallet = await db.prepare('SELECT gold_balance FROM novel_user_gold WHERE user_id = ?').bind(user.id).first();
    if (!wallet) {
        await db.prepare('INSERT INTO novel_user_gold (user_id, gold_balance) VALUES (?, 0)').bind(user.id).run();
        wallet = { gold_balance: 0 };
    }

    const price = ep.price || 100;
    if (wallet.gold_balance < price) {
        return c.json({ success: false, errorCode: 'INSUFFICIENT_GOLD', message: '골드가 부족합니다.' }, 400);
    }

    // 차감 및 구매 등록
    await db.prepare('UPDATE novel_user_gold SET gold_balance = gold_balance - ? WHERE user_id = ?').bind(price, user.id).run();
    await db.prepare(
        'INSERT INTO novel_purchases (user_id, novel_id, episode_no) VALUES (?, ?, ?)'
    ).bind(user.id, novelId, episodeNo).run();

    const updatedWallet = await db.prepare('SELECT gold_balance FROM novel_user_gold WHERE user_id = ?').bind(user.id).first();

    return c.json({
        success: true,
        balance: updatedWallet.gold_balance,
        message: '대여 구매가 정상 완료되었습니다!'
    });
});

// 12. [인증] 선호작 북마크 등록/해제 토글
router.post('/bookmark', requireAuth, async (c) => {
    const db = await getDB(c);
    const user = c.get('user');
    const { novelId } = await c.req.json();

    if (!novelId) return c.json({ success: false, message: 'novelId가 없습니다.' }, 400);

    const exists = await db.prepare(
        'SELECT 1 FROM novel_bookmarks WHERE user_id = ? AND novel_id = ?'
    ).bind(user.id, novelId).first();

    if (exists) {
        // 이미 등록된 경우 -> 삭제 (해제)
        await db.prepare('DELETE FROM novel_bookmarks WHERE user_id = ? AND novel_id = ?').bind(user.id, novelId).run();
        return c.json({ success: true, isBookmarked: false });
    } else {
        // 등록
        await db.prepare('INSERT INTO novel_bookmarks (user_id, novel_id) VALUES (?, ?)').bind(user.id, novelId).run();
        return c.json({ success: true, isBookmarked: true });
    }
});

// 13. [인증] 선호작 여부 단건 확인
router.get('/bookmark/status', requireAuth, async (c) => {
    const db = await getDB(c);
    const user = c.get('user');
    const novelId = parseInt(c.req.query('novelId') || '0', 10);

    const exists = await db.prepare(
        'SELECT 1 FROM novel_bookmarks WHERE user_id = ? AND novel_id = ?'
    ).bind(user.id, novelId).first();
    return c.json({ success: true, isBookmarked: !!exists });
});

// 14. [인증] 내 선호작 소설 리스트 조회
router.get('/bookmarks', requireAuth, async (c) => {
    const db = await getDB(c);
    const user = c.get('user');

    const res = await db.prepare(`
        SELECT n.* 
        FROM novel_bookmarks b
        JOIN novel_novels n ON b.novel_id = n.id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
    `).bind(user.id).all();

    return c.json({ success: true, list: res.results });
});

// 15. [인증] 최근 읽은 목록 (이어보기) 리스트 조회
router.get('/history', requireAuth, async (c) => {
    const db = await getDB(c);
    const user = c.get('user');

    const res = await db.prepare(`
        SELECT n.*, h.last_episode_no, h.updated_at as read_at
        FROM novel_history h
        JOIN novel_novels n ON h.novel_id = n.id
        WHERE h.user_id = ?
        ORDER BY h.updated_at DESC
        LIMIT 5
    `).bind(user.id).all();

    return c.json({ success: true, list: res.results });
});

export default router;
