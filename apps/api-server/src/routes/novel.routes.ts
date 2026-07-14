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

    // 시드 데이터가 비어있는지 확인 후 기본 작품들 투입
    const count = await db.prepare(`SELECT COUNT(*) as cnt FROM novel_novels`).first();
    if (!count || count.cnt === 0) {
        // 샘플 소설 1
        const n1 = await db.prepare(`
            INSERT INTO novel_novels (author_id, title, author, description, cover_url, genre)
            VALUES (1, '재벌가 막내아들은 오행을 잘 본다', '명리거사', '사주명리학의 대가가 재벌가 막내로 환생했다! 오행의 기운을 조율하여 기업들을 장악하고, 가문의 숨겨진 액운을 퇴치해 나가는 명리 비즈니스 판타지.', '/uploads/novels/sample_fortune_chaebol.png', '현대판타지')
        `).run();
        // custom adapter의 run 반환값에 lastInsertRowid 가 존재함
        const n1Id = n1.lastInsertRowid || 1;

        // 샘플 소설 1 에피소드 (1, 2화 무료 / 3화 유료)
        await db.prepare(`
            INSERT INTO novel_episodes_v2 (novel_id, episode_no, title, content, is_free, price)
            VALUES (?, 1, '1화: 명리 장인의 환생', '눈을 뜨니 나는 대한민국 굴지의 대기업, 한성 그룹의 막내 손자가 되어 있었다.\n내 눈앞에 들어온 한성 그룹 회장의 이마에는 거무스름한 수(水)의 나쁜 기운이 가득 엉켜 있었다.\n"회장님, 이번 남쪽 개발 사업은 화(火)의 기운을 방해하므로 당장 멈추셔야 합니다."\n내 조용한 한마디에 회장실의 공기가 급격히 얼어붙었다.', 1, 0)
        `).bind(n1Id).run();
        
        await db.prepare(`
            INSERT INTO novel_episodes_v2 (novel_id, episode_no, title, content, is_free, price)
            VALUES (?, 2, '2화: 수(水)와 화(火)의 쟁투', '"너 같은 어린 꼬맹이가 사주의 형국을 논하다니!" 한성 그룹 둘째 아들이 불같이 소리를 질렀다.\n하지만 나는 미동조차 하지 않았다. 그의 사주 팔자는 이미 이번 년도에 삼재(三災)의 늪에 빠져 파산할 운명이었다.\n나는 주머니에서 금의 침묵을 담은 흰 조약돌을 꺼내 놓았다.\n"일주일 뒤 물의 창고가 터질 때, 제 말을 다시 기억하시게 될 겁니다."', 1, 0)
        `).bind(n1Id).run();

        await db.prepare(`
            INSERT INTO novel_episodes_v2 (novel_id, episode_no, title, content, is_free, price)
            VALUES (?, 3, '3화: 재앙의 시작 (유료)', '일주일 뒤 정확히 강남 개발구 지하철 공사 현장에서 거대한 지하수가 폭출했다.\n총 1,000억 원 상당의 자재가 일순간에 침수되며 둘째 아들이 추진하던 쇼핑몰 프로젝트는 공중 분해 직전에 처했다.\n"그 녀석을 데려와라!"\n한성 그룹 한도영 회장의 뇌성 같은 부르짖음이 떨렸다.\n나는 한성의 숨겨진 적장자, 오행을 조율하는 유일한 열쇠였다.', 0, 100)
        `).bind(n1Id).run();

        // 샘플 소설 2
        const n2 = await db.prepare(`
            INSERT INTO novel_novels (author_id, title, author, description, cover_url, genre)
            VALUES (1, '마도 천재의 무림 사주 상담소', '독고명리', '삼대 마도 천마의 제자가 무림 맹주와 십대 고수들의 사주를 정밀하게 봐주기 시작했다. 무공의 막힌 혈을 뚫어주고 기운을 조율해주는 신묘한 운세 판타지 무협.', '/uploads/novels/sample_murim_saju.png', '무협')
        `).run();
        const n2Id = n2.lastInsertRowid || 2;

        // 샘플 소설 2 에피소드
        await db.prepare(`
            INSERT INTO novel_episodes_v2 (novel_id, episode_no, title, content, is_free, price)
            VALUES (?, 1, '1화: 천마의 제자, 사주를 보다', '천마 신교의 핏빛 뇌옥에서 나는 10년 동안 동양 역학의 정수인 사주명리학을 집대성했다.\n사부님은 늘 내 목을 치겠다고 으름장부렸지만, 정작 본인의 목을 누르고 있는 화독(火毒)이 내 조언 한 줄로 뚫리자 나를 최고의 비서로 등극시켰다.\n"너의 오행 예측은 천하를 흔들 것이다."', 1, 0)
        `).bind(n2Id).run();

        await db.prepare(`
            INSERT INTO novel_episodes_v2 (novel_id, episode_no, title, content, is_free, price)
            VALUES (?, 2, '2화: 맹주의 운명선', '무림맹주의 사주는 보기 드문 양강(陽剛)의 사주였지만 시주(時柱)에 음(陰)의 마장이 숨어 있었다.\n나는 그의 손바닥 가운데를 가리켰다.\n"맹주님, 오늘 밤 북쪽 서재로 드는 자객을 막지 못하면, 백일 내로 주화입마에 들 것입니다."\n맹주의 미간이 깊이 파였다.', 1, 0)
        `).bind(n2Id).run();

        await db.prepare(`
            INSERT INTO novel_episodes_v2 (novel_id, episode_no, title, content, is_free, price)
            VALUES (?, 3, '3화: 음양의 역류 (유료)', '그날 밤, 맹주의 침소에는 그가 형제라 믿었던 부맹주의 독수검이 은밀히 비수를 드러냈다.\n하지만 맹주는 이미 나를 통해 대비를 완료한 상태였다.\n검이 허공을 찢고, 부맹주의 시신이 바닥에 처박혔다.\n"사주 상담가 독고여, 네가 나를 구했구나. 원하는 게 무엇이냐?"\n나는 조용히 웃었다. "무림맹의 금고 절반입니다."', 0, 100)
        `).bind(n2Id).run();
        
        // 서버 기동 시 샘플용 표지 이미지 파일들이 존재하는지 확인하고, 더미 픽셀 이미지로 미리 생성해 둡니다.
        const uploadDir = path.resolve('./public/uploads/novels');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        // 1x1 투명 픽셀 GIF 바이트 배열
        const dummyGif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
        fs.writeFileSync(path.join(uploadDir, 'sample_fortune_chaebol.png'), dummyGif);
        fs.writeFileSync(path.join(uploadDir, 'sample_murim_saju.png'), dummyGif);
    }
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
