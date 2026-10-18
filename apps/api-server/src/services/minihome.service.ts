import { pool } from '@faithportal/database';

export type MinihomeMoodType = 'happy' | 'passion' | 'relax' | 'focus' | 'gaming' | 'lucky';

export interface PlacedRoomItem {
    instanceId: string;
    itemId: string;
    gridX: number;
    gridY: number;
    flipped: boolean;
}

export interface MinihomeRoomLayout {
    wallItemId: string;
    floorItemId: string;
    minimiItemId: string;
    minimiX: number;
    minimiY: number;
    speechBubble: string;
    placedItems: PlacedRoomItem[];
}

export interface CatalogPriceItem {
    itemId: string;
    name: string;
    price: number;
    category: string;
}

export const SERVER_CATALOG_ITEMS: Record<string, CatalogPriceItem> = {
    // 기본 무료 아이템 (0P)
    'wall-white-modern': { itemId: 'wall-white-modern', name: '화이트 모던 벽지', price: 0, category: 'wall' },
    'wall-cozy-beige': { itemId: 'wall-cozy-beige', name: '코지 베이지 벽지', price: 0, category: 'wall' },
    'floor-oak-wood': { itemId: 'floor-oak-wood', name: '기본 오크 마루', price: 0, category: 'floor' },
    'floor-gray-tile': { itemId: 'floor-gray-tile', name: '모던 그레이 타일', price: 0, category: 'floor' },
    'furn-wood-desk': { itemId: 'furn-wood-desk', name: '원목 스터디 데스크', price: 0, category: 'furniture' },
    'furn-floor-lamp': { itemId: 'furn-floor-lamp', name: '따스한 스탠드 조명', price: 0, category: 'furniture' },
    'prop-mini-plant': { itemId: 'prop-mini-plant', name: '몬스테라 미니 화분', price: 0, category: 'prop' },
    'prop-coffee-rug': { itemId: 'prop-coffee-rug', name: '포근한 크림 원형 러그', price: 0, category: 'prop' },
    'minimi-casual': { itemId: 'minimi-casual', name: '캐주얼 데일리 미니미', price: 0, category: 'minimi' },
    'minimi-hoodie': { itemId: 'minimi-hoodie', name: '코지 후드티 미니미', price: 0, category: 'minimi' },

    // 베라포인트 상점 아이템
    'wall-pastel-sky': { itemId: 'wall-pastel-sky', name: '파스텔 스카이 창문 벽지', price: 100, category: 'wall' },
    'wall-retro-brick': { itemId: 'wall-retro-brick', name: '레트로 브릭 카페 벽지', price: 200, category: 'wall' },
    'wall-hanok-paper': { itemId: 'wall-hanok-paper', name: '고즈넉한 한옥 창호 벽지', price: 300, category: 'wall' },
    'wall-cyber-neon': { itemId: 'wall-cyber-neon', name: '사이버펑크 나이트시티 벽지', price: 350, category: 'wall' },
    'wall-vip-gold': { itemId: 'wall-vip-gold', name: 'VIP 골드 펜트하우스 벽지', price: 500, category: 'wall' },

    'floor-herringbone': { itemId: 'floor-herringbone', name: '유럽풍 헤링본 우드 마루', price: 100, category: 'floor' },
    'floor-green-lawn': { itemId: 'floor-green-lawn', name: '피크닉 테라스 잔디 바닥', price: 200, category: 'floor' },
    'floor-retro-checker': { itemId: 'floor-retro-checker', name: '레트로 다이너 체커보드', price: 250, category: 'floor' },
    'floor-galaxy': { itemId: 'floor-galaxy', name: '스타라이트 갤럭시 플로어', price: 400, category: 'floor' },

    'furn-beanbag': { itemId: 'furn-beanbag', name: '마시멜로 빈백 소파', price: 150, category: 'furniture' },
    'furn-bookshelf': { itemId: 'furn-bookshelf', name: '지식인의 원목 대형 책장', price: 200, category: 'furniture' },
    'furn-turntable': { itemId: 'furn-turntable', name: '빈티지 LP 턴테이블 테이블', price: 250, category: 'furniture' },
    'furn-gaming-setup': { itemId: 'furn-gaming-setup', name: '듀얼모니터 RGB 게이밍 셋업', price: 300, category: 'furniture' },
    'furn-arcade-cabinet': { itemId: 'furn-arcade-cabinet', name: '레트로 8비트 오락실 게임기', price: 400, category: 'furniture' },

    'prop-moon-lamp': { itemId: 'prop-moon-lamp', name: '보름달 무드등 스탠드', price: 200, category: 'prop' },
    'prop-neon-sign': { itemId: 'prop-neon-sign', name: 'VERA 네온 사인 보드', price: 250, category: 'prop' },
    'prop-cheese-cat': { itemId: 'prop-cheese-cat', name: '식빵 굽는 치즈고양이', price: 350, category: 'prop' },
    'prop-corgi-dog': { itemId: 'prop-corgi-dog', name: '궁디팡팡 웰시코기 강아지', price: 350, category: 'prop' },
    'trophy-2048': { itemId: 'trophy-2048', name: '2048 마스터 황금 트로피', price: 300, category: 'prop' },
    'trophy-sudoku': { itemId: 'trophy-sudoku', name: '스도쿠 브레인 크리스탈 트로피', price: 300, category: 'prop' },
    'trophy-minesweeper': { itemId: 'trophy-minesweeper', name: '지뢰찾기 영웅 황금 깃발', price: 300, category: 'prop' },

    'minimi-ceo': { itemId: 'minimi-ceo', name: '월스트리트 수트 미니미', price: 250, category: 'minimi' },
    'minimi-astronaut': { itemId: 'minimi-astronaut', name: '우주 탐사 비행사 미니미', price: 300, category: 'minimi' },
    'minimi-hanbok': { itemId: 'minimi-hanbok', name: '사주 명리학 도포 선비 미니미', price: 300, category: 'minimi' },
    'minimi-wizard': { itemId: 'minimi-wizard', name: '별빛 아카데미 마법사 미니미', price: 350, category: 'minimi' },
    'minimi-champion': { itemId: 'minimi-champion', name: '로열 챔피언 왕관 미니미', price: 450, category: 'minimi' },
};

export const DEFAULT_FREE_ITEM_IDS = [
    'wall-white-modern',
    'wall-cozy-beige',
    'floor-oak-wood',
    'floor-gray-tile',
    'furn-wood-desk',
    'furn-floor-lamp',
    'prop-mini-plant',
    'prop-coffee-rug',
    'minimi-casual',
    'minimi-hoodie',
];

export const DEFAULT_ROOM_LAYOUT: MinihomeRoomLayout = {
    wallItemId: 'wall-white-modern',
    floorItemId: 'floor-oak-wood',
    minimiItemId: 'minimi-casual',
    minimiX: 4,
    minimiY: 4,
    speechBubble: '내 미니룸에 놀러온 걸 환영해요! 방명록 남기고 가세요 ✨',
    placedItems: [
        { instanceId: 'init-rug', itemId: 'prop-coffee-rug', gridX: 3, gridY: 3, flipped: false },
        { instanceId: 'init-desk', itemId: 'furn-wood-desk', gridX: 1, gridY: 1, flipped: false },
        { instanceId: 'init-lamp', itemId: 'furn-floor-lamp', gridX: 0, gridY: 3, flipped: false },
        { instanceId: 'init-plant', itemId: 'prop-mini-plant', gridX: 5, gridY: 1, flipped: false },
    ],
};

interface DbMinihomeRow {
    id: number;
    user_id: number | null;
    handle: string;
    owner_name: string;
    room_title: string;
    status_mood: string;
    status_message: string;
    bgm_track_id: string;
    layout_json: string;
    today_visitors: number;
    total_visitors: number;
    last_visit_date: string;
    updated_at: string;
}

interface DbGuestbookRow {
    id: number;
    host_handle: string;
    author_user_id: number | null;
    author_name: string;
    author_handle: string;
    author_minimi_id: string;
    content: string;
    owner_reply: string | null;
    owner_replied_at: string | null;
    created_at: string;
}

export class MinihomeService {
    private static initialized = false;

    static normalizeHandle(raw: string): string {
        const cleaned = raw.trim().replace(/^@+/, '').toLowerCase();
        return cleaned || 'vera_guest';
    }

    static async ensureTables(): Promise<void> {
        if (this.initialized) return;
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS user_minihomes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    handle TEXT NOT NULL UNIQUE,
                    owner_name TEXT NOT NULL,
                    room_title TEXT NOT NULL DEFAULT '사이좋은 사람들의 따뜻한 미니룸',
                    status_mood TEXT NOT NULL DEFAULT 'happy',
                    status_message TEXT NOT NULL DEFAULT '오늘도 내 방에 놀러와줘서 고마워요! ✨',
                    bgm_track_id TEXT NOT NULL DEFAULT 'bgm-orgel',
                    layout_json TEXT NOT NULL,
                    today_visitors INTEGER NOT NULL DEFAULT 1,
                    total_visitors INTEGER NOT NULL DEFAULT 1,
                    last_visit_date TEXT NOT NULL DEFAULT ( date('now') ),
                    is_deleted INTEGER NOT NULL DEFAULT 0,
                    deleted_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            `);
            await pool.query(`
                CREATE TABLE IF NOT EXISTS user_minihome_inventory (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    user_handle TEXT NOT NULL,
                    item_id TEXT NOT NULL,
                    acquired_type TEXT NOT NULL DEFAULT 'free',
                    price_paid INTEGER NOT NULL DEFAULT 0,
                    is_deleted INTEGER NOT NULL DEFAULT 0,
                    deleted_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_handle, item_id)
                );
            `);
            await pool.query(`
                CREATE TABLE IF NOT EXISTS minihome_guestbook (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    host_handle TEXT NOT NULL,
                    author_user_id INTEGER,
                    author_name TEXT NOT NULL,
                    author_handle TEXT NOT NULL,
                    author_minimi_id TEXT NOT NULL DEFAULT 'minimi-casual',
                    content TEXT NOT NULL,
                    owner_reply TEXT,
                    owner_replied_at DATETIME,
                    is_deleted INTEGER NOT NULL DEFAULT 0,
                    deleted_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            `);
            await pool.query(`
                CREATE TABLE IF NOT EXISTS minihome_visit_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    host_handle TEXT NOT NULL,
                    visitor_key TEXT NOT NULL,
                    visit_date TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(host_handle, visitor_key, visit_date)
                );
            `);

            await this.seedShowcaseMinihomes();
            this.initialized = true;
        } catch (err) {
            console.error('[MinihomeService] ensureTables error:', err);
        }
    }

    private static async seedShowcaseMinihomes(): Promise<void> {
        const samples: Array<{
            handle: string;
            ownerName: string;
            roomTitle: string;
            mood: MinihomeMoodType;
            message: string;
            bgm: string;
            today: number;
            total: number;
            layout: MinihomeRoomLayout;
        }> = [
            {
                handle: 'vera_official',
                ownerName: '베라 공식 매니저',
                roomTitle: '🌟 VERA 공식 웰컴 펜트하우스',
                mood: 'happy',
                message: '파도타기로 오신 모든 회원님 환영합니다! 방명록 남기면 행운 가득 🍀',
                bgm: 'bgm-orgel',
                today: 48,
                total: 3920,
                layout: {
                    wallItemId: 'wall-pastel-sky',
                    floorItemId: 'floor-herringbone',
                    minimiItemId: 'minimi-champion',
                    minimiX: 4,
                    minimiY: 4,
                    speechBubble: '베라 미니홈피 오픈! 나만의 방을 꾸며보세요 🏠✨',
                    placedItems: [
                        { instanceId: 's1-1', itemId: 'prop-coffee-rug', gridX: 3, gridY: 3, flipped: false },
                        { instanceId: 's1-2', itemId: 'furn-gaming-setup', gridX: 1, gridY: 1, flipped: false },
                        { instanceId: 's1-3', itemId: 'furn-bookshelf', gridX: 4, gridY: 0, flipped: false },
                        { instanceId: 's1-4', itemId: 'prop-cheese-cat', gridX: 3, gridY: 5, flipped: false },
                        { instanceId: 's1-5', itemId: 'trophy-2048', gridX: 6, gridY: 2, flipped: false },
                    ],
                },
            },
            {
                handle: 'cyber_gamer',
                ownerName: '네온 아케이드 킹',
                roomTitle: '🕹️ 레트로 & 사이버 게이밍 아지트',
                mood: 'gaming',
                message: '2048 & 지뢰찾기 랭킹 1위 도전 중! 배틀 환영합니다 🔥',
                bgm: 'bgm-arcade',
                today: 29,
                total: 1580,
                layout: {
                    wallItemId: 'wall-cyber-neon',
                    floorItemId: 'floor-retro-checker',
                    minimiItemId: 'minimi-astronaut',
                    minimiX: 3,
                    minimiY: 4,
                    speechBubble: '오늘 밤 2048 최고기록 깬다! 🎮⚡',
                    placedItems: [
                        { instanceId: 's2-1', itemId: 'furn-arcade-cabinet', gridX: 1, gridY: 1, flipped: false },
                        { instanceId: 's2-2', itemId: 'furn-gaming-setup', gridX: 4, gridY: 1, flipped: false },
                        { instanceId: 's2-3', itemId: 'prop-neon-sign', gridX: 0, gridY: 3, flipped: false },
                        { instanceId: 's2-4', itemId: 'trophy-minesweeper', gridX: 5, gridY: 4, flipped: false },
                    ],
                },
            },
            {
                handle: 'saju_master',
                ownerName: '청담동 명리학자',
                roomTitle: '🍵 고즈넉한 한옥 사주 & 독서 다실',
                mood: 'lucky',
                message: '오늘의 운세 대길(大吉)! 따뜻한 차 한 잔 하고 가세요.',
                bgm: 'bgm-lofi-rain',
                today: 34,
                total: 2140,
                layout: {
                    wallItemId: 'wall-hanok-paper',
                    floorItemId: 'floor-oak-wood',
                    minimiItemId: 'minimi-hanbok',
                    minimiX: 4,
                    minimiY: 3,
                    speechBubble: '마음이 편안해지는 한옥 서재입니다 🌿',
                    placedItems: [
                        { instanceId: 's3-1', itemId: 'furn-bookshelf', gridX: 1, gridY: 0, flipped: false },
                        { instanceId: 's3-2', itemId: 'furn-turntable', gridX: 5, gridY: 1, flipped: false },
                        { instanceId: 's3-3', itemId: 'prop-moon-lamp', gridX: 1, gridY: 4, flipped: false },
                        { instanceId: 's3-4', itemId: 'prop-corgi-dog', gridX: 4, gridY: 5, flipped: true },
                    ],
                },
            },
        ];

        for (const s of samples) {
            const existing = await pool.query(
                'SELECT id FROM user_minihomes WHERE handle = $1 AND is_deleted = 0',
                [s.handle]
            );
            if (existing.rows.length === 0) {
                await pool.query(
                    `INSERT INTO user_minihomes (handle, owner_name, room_title, status_mood, status_message, bgm_track_id, layout_json, today_visitors, total_visitors)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                     ON CONFLICT (handle) DO NOTHING`,
                    [
                        s.handle,
                        s.ownerName,
                        s.roomTitle,
                        s.mood,
                        s.message,
                        s.bgm,
                        JSON.stringify(s.layout),
                        s.today,
                        s.total,
                    ]
                );

                // 샘플 방명록 1건씩 시드
                await pool.query(
                    `INSERT INTO minihome_guestbook (host_handle, author_name, author_handle, author_minimi_id, content)
                     VALUES ($1, '베라 프렌즈', 'vera_friends', 'minimi-hoodie', '우와 방이 너무 예뻐요! 파도타기 타고 구경 왔다가 일촌평 남기고 갑니다 😊')`,
                    [s.handle]
                );
            }
        }
    }

    static async getVeraPoints(userId: number | null): Promise<number> {
        if (!userId) return 0;
        const res = await pool.query(
            'SELECT points FROM user_points WHERE user_id = $1',
            [userId]
        );
        if (res.rows.length === 0) {
            await pool.query(
                `INSERT INTO user_points (user_id, points, pending_amount, attendance_points, activity_points)
                 VALUES ($1, 500, 0, 500, 0)
                 ON CONFLICT DO NOTHING`,
                [userId]
            );
            return 500;
        }
        return Number(res.rows[0].points || 0);
    }

    static async ensureDefaultInventory(userId: number | null, handle: string): Promise<string[]> {
        const cleanHandle = this.normalizeHandle(handle);

        for (const itemId of DEFAULT_FREE_ITEM_IDS) {
            await pool.query(
                `INSERT INTO user_minihome_inventory (user_id, user_handle, item_id, acquired_type, price_paid)
                 VALUES ($1, $2, $3, 'free', 0)
                 ON CONFLICT (user_handle, item_id) DO NOTHING`,
                [userId, cleanHandle, itemId]
            );
        }

        // 게임 기록이 있는 회원은 해당 게임 트로피 자동 해금 지급
        if (userId) {
            try {
                const gameRes = await pool.query(
                    'SELECT DISTINCT game_type FROM user_game_scores WHERE user_id = $1',
                    [userId]
                );
                for (const row of gameRes.rows) {
                    const gType = String(row.game_type || '').toLowerCase();
                    if (gType.includes('2048')) {
                        await pool.query(
                            `INSERT INTO user_minihome_inventory (user_id, user_handle, item_id, acquired_type, price_paid)
                             VALUES ($1, $2, 'trophy-2048', 'achievement', 0) ON CONFLICT DO NOTHING`,
                            [userId, cleanHandle]
                        );
                    }
                    if (gType.includes('sudoku')) {
                        await pool.query(
                            `INSERT INTO user_minihome_inventory (user_id, user_handle, item_id, acquired_type, price_paid)
                             VALUES ($1, $2, 'trophy-sudoku', 'achievement', 0) ON CONFLICT DO NOTHING`,
                            [userId, cleanHandle]
                        );
                    }
                    if (gType.includes('mine')) {
                        await pool.query(
                            `INSERT INTO user_minihome_inventory (user_id, user_handle, item_id, acquired_type, price_paid)
                             VALUES ($1, $2, 'trophy-minesweeper', 'achievement', 0) ON CONFLICT DO NOTHING`,
                            [userId, cleanHandle]
                        );
                    }
                }
            } catch (_) {
                // 테이블 미존재 등 무시
            }
        }

        const invRes = await pool.query(
            'SELECT item_id FROM user_minihome_inventory WHERE user_handle = $1 AND is_deleted = 0',
            [cleanHandle]
        );
        return invRes.rows.map((r: { item_id: string }) => r.item_id);
    }

    static async getOrCreateMinihome(params: {
        targetHandle: string;
        viewerUserId: number | null;
        viewerName?: string;
        viewerHandle?: string;
        visitorKey: string;
    }) {
        await this.ensureTables();
        const cleanHandle = this.normalizeHandle(params.targetHandle);

        let res = await pool.query(
            'SELECT * FROM user_minihomes WHERE handle = $1 AND is_deleted = 0',
            [cleanHandle]
        );

        // 만약 user_id로 먼저 생성된 미니홈피가 있는지 체크
        if (res.rows.length === 0 && params.viewerUserId && cleanHandle === this.normalizeHandle(params.viewerHandle || '')) {
            const byUser = await pool.query(
                'SELECT * FROM user_minihomes WHERE user_id = $1 AND is_deleted = 0',
                [params.viewerUserId]
            );
            if (byUser.rows.length > 0) {
                res = byUser;
            }
        }

        if (res.rows.length === 0) {
            const ownerName = params.viewerName && cleanHandle === this.normalizeHandle(params.viewerHandle || cleanHandle)
                ? params.viewerName
                : `${cleanHandle}님의 미니홈피`;
            const ownerUserId = cleanHandle === this.normalizeHandle(params.viewerHandle || cleanHandle)
                ? params.viewerUserId
                : null;

            await pool.query(
                `INSERT INTO user_minihomes (user_id, handle, owner_name, room_title, status_mood, status_message, bgm_track_id, layout_json, today_visitors, total_visitors)
                 VALUES ($1, $2, $3, $4, 'happy', '내 방에 놀러와줘서 고마워요! 일촌평 남겨주세요 ✨', 'bgm-orgel', $5, 1, 1)
                 ON CONFLICT (handle) DO NOTHING`,
                [
                    ownerUserId,
                    cleanHandle,
                    ownerName,
                    `${ownerName}의 미니룸`,
                    JSON.stringify(DEFAULT_ROOM_LAYOUT),
                ]
            );

            res = await pool.query(
                'SELECT * FROM user_minihomes WHERE handle = $1 AND is_deleted = 0',
                [cleanHandle]
            );
        }

        const row = res.rows[0] as DbMinihomeRow;
        const todayStr = new Date().toISOString().substring(0, 10);

        // 날짜 변경 시 today_visitors 리셋
        if (row.last_visit_date !== todayStr) {
            await pool.query(
                'UPDATE user_minihomes SET today_visitors = 1, last_visit_date = $1 WHERE id = $2',
                [todayStr, row.id]
            );
            row.today_visitors = 1;
            row.last_visit_date = todayStr;
        }

        // 방문자 카운트 기록 (동일 일자 중복 방지)
        if (params.visitorKey) {
            try {
                const logRes = await pool.query(
                    `INSERT INTO minihome_visit_logs (host_handle, visitor_key, visit_date)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (host_handle, visitor_key, visit_date) DO NOTHING`,
                    [row.handle, params.visitorKey, todayStr]
                );
                if (logRes.rowCount > 0) {
                    await pool.query(
                        'UPDATE user_minihomes SET today_visitors = today_visitors + 1, total_visitors = total_visitors + 1 WHERE id = $1',
                        [row.id]
                    );
                    row.today_visitors += 1;
                    row.total_visitors += 1;
                }
            } catch (_) {
                // 중복 방문 시 무시
            }
        }

        let parsedLayout: MinihomeRoomLayout = DEFAULT_ROOM_LAYOUT;
        try {
            parsedLayout = JSON.parse(row.layout_json) as MinihomeRoomLayout;
        } catch (_) {
            parsedLayout = DEFAULT_ROOM_LAYOUT;
        }

        const isOwner = Boolean(
            (params.viewerUserId && row.user_id && params.viewerUserId === row.user_id) ||
            (params.viewerHandle && this.normalizeHandle(params.viewerHandle) === row.handle)
        );

        const ownedItemIds = await this.ensureDefaultInventory(
            isOwner ? params.viewerUserId : row.user_id,
            row.handle
        );

        const veraPoints = isOwner ? await this.getVeraPoints(params.viewerUserId) : 0;

        return {
            handle: row.handle,
            userId: row.user_id,
            ownerName: row.owner_name,
            roomTitle: row.room_title,
            statusMood: (row.status_mood || 'happy') as MinihomeMoodType,
            statusMessage: row.status_message,
            bgmTrackId: row.bgm_track_id || 'bgm-orgel',
            todayVisitors: row.today_visitors || 1,
            totalVisitors: row.total_visitors || 1,
            layout: parsedLayout,
            ownedItemIds,
            veraPoints,
            isOwner,
            updatedAt: row.updated_at,
        };
    }

    static async updateMinihome(params: {
        handle: string;
        userId: number | null;
        ownerName?: string;
        roomTitle?: string;
        statusMood?: MinihomeMoodType;
        statusMessage?: string;
        bgmTrackId?: string;
        layout?: MinihomeRoomLayout;
    }) {
        await this.ensureTables();
        const cleanHandle = this.normalizeHandle(params.handle);

        const existingRes = await pool.query(
            'SELECT * FROM user_minihomes WHERE handle = $1 AND is_deleted = 0',
            [cleanHandle]
        );
        if (existingRes.rows.length === 0) {
            throw new Error('미니홈피를 찾을 수 없습니다.');
        }

        const current = existingRes.rows[0] as DbMinihomeRow;
        const nextTitle = params.roomTitle !== undefined ? params.roomTitle.trim().slice(0, 60) : current.room_title;
        const nextMood = params.statusMood !== undefined ? params.statusMood : current.status_mood;
        const nextMessage = params.statusMessage !== undefined ? params.statusMessage.trim().slice(0, 120) : current.status_message;
        const nextBgm = params.bgmTrackId !== undefined ? params.bgmTrackId : current.bgm_track_id;
        const nextLayoutJson = params.layout !== undefined ? JSON.stringify(params.layout) : current.layout_json;
        const nextOwnerName = params.ownerName !== undefined && params.ownerName.trim() ? params.ownerName.trim() : current.owner_name;

        await pool.query(
            `UPDATE user_minihomes
             SET owner_name = $1,
                 room_title = $2,
                 status_mood = $3,
                 status_message = $4,
                 bgm_track_id = $5,
                 layout_json = $6,
                 user_id = COALESCE(user_id, $7),
                 updated_at = CURRENT_TIMESTAMP
             WHERE handle = $8 AND is_deleted = 0`,
            [
                nextOwnerName,
                nextTitle,
                nextMood,
                nextMessage,
                nextBgm,
                nextLayoutJson,
                params.userId,
                cleanHandle,
            ]
        );

        return { success: true };
    }

    static async purchaseItem(params: {
        userId: number | null;
        handle: string;
        itemId: string;
    }): Promise<{ ownedItemIds: string[]; remainingPoints: number; purchasedItemName: string }> {
        await this.ensureTables();
        const cleanHandle = this.normalizeHandle(params.handle);
        const catalogItem = SERVER_CATALOG_ITEMS[params.itemId];

        if (!catalogItem) {
            throw new Error('존재하지 않는 아이템입니다.');
        }

        const existingInv = await pool.query(
            'SELECT id FROM user_minihome_inventory WHERE user_handle = $1 AND item_id = $2 AND is_deleted = 0',
            [cleanHandle, params.itemId]
        );
        if (existingInv.rows.length > 0) {
            throw new Error('이미 보유 중인 아이템입니다.');
        }

        let remainingPoints = 0;
        if (params.userId) {
            const currentPoints = await this.getVeraPoints(params.userId);
            if (currentPoints < catalogItem.price) {
                throw new Error(`베라포인트가 부족합니다. (보유: ${currentPoints}P / 필요: ${catalogItem.price}P)`);
            }

            if (catalogItem.price > 0) {
                await pool.query(
                    'UPDATE user_points SET points = points - $1 WHERE user_id = $2',
                    [catalogItem.price, params.userId]
                );
            }
            remainingPoints = currentPoints - catalogItem.price;
        } else {
            // 비로그인 체험 유저의 경우 무료/체험 구매 허용하되 안내
            remainingPoints = 0;
        }

        await pool.query(
            `INSERT INTO user_minihome_inventory (user_id, user_handle, item_id, acquired_type, price_paid, is_deleted)
             VALUES ($1, $2, $3, 'purchase', $4, 0)
             ON CONFLICT (user_handle, item_id) DO UPDATE SET is_deleted = 0, deleted_at = NULL`,
            [params.userId, cleanHandle, params.itemId, catalogItem.price]
        );

        const ownedItemIds = await this.ensureDefaultInventory(params.userId, cleanHandle);
        return {
            ownedItemIds,
            remainingPoints,
            purchasedItemName: catalogItem.name,
        };
    }

    static async getGuestbook(hostHandle: string, viewerUserId: number | null, viewerHandle?: string) {
        await this.ensureTables();
        const cleanHost = this.normalizeHandle(hostHandle);
        const cleanViewer = viewerHandle ? this.normalizeHandle(viewerHandle) : '';

        const res = await pool.query(
            `SELECT id, host_handle, author_user_id, author_name, author_handle, author_minimi_id,
                    content, owner_reply, owner_replied_at, created_at
             FROM minihome_guestbook
             WHERE host_handle = $1 AND is_deleted = 0
             ORDER BY created_at DESC, id DESC
             LIMIT 50`,
            [cleanHost]
        );

        return (res.rows as DbGuestbookRow[]).map((row) => ({
            id: row.id,
            hostHandle: row.host_handle,
            authorUserId: row.author_user_id,
            authorName: row.author_name,
            authorHandle: row.author_handle,
            authorMinimiId: row.author_minimi_id || 'minimi-casual',
            content: row.content,
            ownerReply: row.owner_reply,
            ownerRepliedAt: row.owner_replied_at,
            createdAt: row.created_at,
            isMine: Boolean(
                (viewerUserId && row.author_user_id === viewerUserId) ||
                (cleanViewer && this.normalizeHandle(row.author_handle) === cleanViewer) ||
                cleanViewer === cleanHost
            ),
        }));
    }

    static async addGuestbook(params: {
        hostHandle: string;
        authorUserId: number | null;
        authorName: string;
        authorHandle: string;
        authorMinimiId: string;
        content: string;
    }) {
        await this.ensureTables();
        const cleanHost = this.normalizeHandle(params.hostHandle);
        const cleanAuthor = this.normalizeHandle(params.authorHandle);
        const trimmed = params.content.trim().slice(0, 300);
        if (!trimmed) {
            throw new Error('방명록 내용을 입력해주세요.');
        }

        await pool.query(
            `INSERT INTO minihome_guestbook (host_handle, author_user_id, author_name, author_handle, author_minimi_id, content)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                cleanHost,
                params.authorUserId,
                params.authorName.trim() || '이웃 일촌',
                cleanAuthor,
                params.authorMinimiId || 'minimi-casual',
                trimmed,
            ]
        );

        // 방명록 작성 시 활동 포인트 +10P 지급 (로그인 유저인 경우)
        if (params.authorUserId) {
            try {
                await this.getVeraPoints(params.authorUserId);
                await pool.query(
                    'UPDATE user_points SET points = points + 10, activity_points = activity_points + 10 WHERE user_id = $1',
                    [params.authorUserId]
                );
            } catch (_) {
                // 포인트 지급 실패 시 무시
            }
        }
    }

    static async replyGuestbook(params: {
        entryId: number;
        hostHandle: string;
        replyText: string;
    }) {
        await this.ensureTables();
        const cleanHost = this.normalizeHandle(params.hostHandle);
        const trimmed = params.replyText.trim().slice(0, 200);

        await pool.query(
            `UPDATE minihome_guestbook
             SET owner_reply = $1, owner_replied_at = CURRENT_TIMESTAMP
             WHERE id = $2 AND host_handle = $3 AND is_deleted = 0`,
            [trimmed, params.entryId, cleanHost]
        );
    }

    static async softDeleteGuestbook(params: {
        entryId: number;
        requesterUserId: number | null;
        requesterHandle: string;
    }) {
        await this.ensureTables();
        const cleanRequester = this.normalizeHandle(params.requesterHandle);

        // Soft Delete 규칙 엄수: 절대 DELETE 쿼리를 쓰지 않고 is_deleted = 1 업데이트만 수행
        await pool.query(
            `UPDATE minihome_guestbook
             SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND (host_handle = $2 OR author_handle = $2 OR ($3 IS NOT NULL AND author_user_id = $3))`,
            [params.entryId, cleanRequester, params.requesterUserId]
        );
    }

    static async getSurfTargets(excludeHandle?: string) {
        await this.ensureTables();
        const cleanExclude = excludeHandle ? this.normalizeHandle(excludeHandle) : '';

        const res = await pool.query(
            `SELECT handle, owner_name, room_title, status_mood, status_message, today_visitors, total_visitors, layout_json, updated_at
             FROM user_minihomes
             WHERE is_deleted = 0
             ORDER BY today_visitors DESC, updated_at DESC
             LIMIT 20`
        );

        const list = (res.rows as DbMinihomeRow[]).map((r) => {
            let minimiId = 'minimi-casual';
            try {
                const parsed = JSON.parse(r.layout_json) as MinihomeRoomLayout;
                minimiId = parsed.minimiItemId || 'minimi-casual';
            } catch (_) {}
            return {
                handle: r.handle,
                ownerName: r.owner_name,
                roomTitle: r.room_title,
                statusMood: (r.status_mood || 'happy') as MinihomeMoodType,
                statusMessage: r.status_message,
                todayVisitors: r.today_visitors,
                totalVisitors: r.total_visitors,
                minimiItemId: minimiId,
            };
        });

        const candidates = list.filter((item) => item.handle !== cleanExclude);
        const randomPick = candidates.length > 0
            ? candidates[Math.floor(Math.random() * candidates.length)].handle
            : (list[0]?.handle || 'vera_official');

        return {
            randomHandle: randomPick,
            popularRooms: list,
        };
    }
}
