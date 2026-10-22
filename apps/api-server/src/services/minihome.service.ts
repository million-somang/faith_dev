import { pool } from '@faithportal/database';

/**
 * 베라포인트 유료 상점 활성화 여부 스위치
 * - false: 전 품목 무료(0P) 오픈 (포인트 차감 없이 즉시 획득)
 * - true: 추후 베라포인트(pointPrice) 정식 활성화 시 포인트 차감 적용
 */
export const VERA_POINT_SHOP_ENABLED = false;

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
    pointPrice: number;
    category: string;
}

const RAW_SERVER_CATALOG: Record<string, { itemId: string; name: string; pointPrice: number; category: string }> = {
    // 기본 무료 아이템 (0P)
    'wall-white-modern': { itemId: 'wall-white-modern', name: '화이트 모던 벽지', pointPrice: 0, category: 'wall' },
    'wall-cozy-beige': { itemId: 'wall-cozy-beige', name: '코지 베이지 벽지', pointPrice: 0, category: 'wall' },
    'floor-oak-wood': { itemId: 'floor-oak-wood', name: '기본 오크 마루', pointPrice: 0, category: 'floor' },
    'floor-gray-tile': { itemId: 'floor-gray-tile', name: '모던 그레이 타일', pointPrice: 0, category: 'floor' },
    'furn-wood-desk': { itemId: 'furn-wood-desk', name: '원목 스터디 데스크', pointPrice: 0, category: 'furniture' },
    'furn-floor-lamp': { itemId: 'furn-floor-lamp', name: '따스한 스탠드 조명', pointPrice: 0, category: 'furniture' },
    'prop-mini-plant': { itemId: 'prop-mini-plant', name: '몬스테라 미니 화분', pointPrice: 0, category: 'prop' },
    'prop-coffee-rug': { itemId: 'prop-coffee-rug', name: '포근한 크림 원형 러그', pointPrice: 0, category: 'prop' },
    'minimi-casual': { itemId: 'minimi-casual', name: '캐주얼 데일리 아바타', pointPrice: 0, category: 'minimi' },
    'minimi-hoodie': { itemId: 'minimi-hoodie', name: '코지 후드티 아바타', pointPrice: 0, category: 'minimi' },

    // 아지트 상점 아이템 (현재 무료 오픈 / 추후 베라포인트 활성화 시 pointPrice 적용)
    'wall-pastel-sky': { itemId: 'wall-pastel-sky', name: '파스텔 스카이 창문 벽지', pointPrice: 100, category: 'wall' },
    'wall-retro-brick': { itemId: 'wall-retro-brick', name: '레트로 브릭 카페 벽지', pointPrice: 200, category: 'wall' },
    'wall-hanok-paper': { itemId: 'wall-hanok-paper', name: '고즈넉한 한옥 창호 벽지', pointPrice: 300, category: 'wall' },
    'wall-cyber-neon': { itemId: 'wall-cyber-neon', name: '사이버펑크 나이트시티 벽지', pointPrice: 350, category: 'wall' },
    'wall-vip-gold': { itemId: 'wall-vip-gold', name: 'VIP 골드 펜트하우스 벽지', pointPrice: 500, category: 'wall' },

    'floor-herringbone': { itemId: 'floor-herringbone', name: '유럽풍 헤링본 우드 마루', pointPrice: 100, category: 'floor' },
    'floor-green-lawn': { itemId: 'floor-green-lawn', name: '피크닉 테라스 잔디 바닥', pointPrice: 200, category: 'floor' },
    'floor-retro-checker': { itemId: 'floor-retro-checker', name: '레트로 다이너 체커보드', pointPrice: 250, category: 'floor' },
    'floor-galaxy': { itemId: 'floor-galaxy', name: '스타라이트 갤럭시 플로어', pointPrice: 400, category: 'floor' },

    'furn-beanbag': { itemId: 'furn-beanbag', name: '마시멜로 빈백 소파', pointPrice: 150, category: 'furniture' },
    'furn-bookshelf': { itemId: 'furn-bookshelf', name: '지식인의 원목 대형 책장', pointPrice: 200, category: 'furniture' },
    'furn-turntable': { itemId: 'furn-turntable', name: '빈티지 LP 턴테이블 테이블', pointPrice: 250, category: 'furniture' },
    'furn-gaming-setup': { itemId: 'furn-gaming-setup', name: '듀얼모니터 RGB 게이밍 셋업', pointPrice: 300, category: 'furniture' },
    'furn-arcade-cabinet': { itemId: 'furn-arcade-cabinet', name: '레트로 8비트 오락실 게임기', pointPrice: 400, category: 'furniture' },

    'prop-moon-lamp': { itemId: 'prop-moon-lamp', name: '보름달 무드등 스탠드', pointPrice: 200, category: 'prop' },
    'prop-neon-sign': { itemId: 'prop-neon-sign', name: 'VERA 네온 사인 보드', pointPrice: 250, category: 'prop' },
    'prop-cheese-cat': { itemId: 'prop-cheese-cat', name: '식빵 굽는 치즈고양이', pointPrice: 350, category: 'prop' },
    'prop-corgi-dog': { itemId: 'prop-corgi-dog', name: '궁디팡팡 웰시코기 강아지', pointPrice: 350, category: 'prop' },
    'trophy-2048': { itemId: 'trophy-2048', name: '2048 마스터 황금 트로피', pointPrice: 300, category: 'prop' },
    'trophy-sudoku': { itemId: 'trophy-sudoku', name: '스도쿠 브레인 크리스탈 트로피', pointPrice: 300, category: 'prop' },
    'trophy-minesweeper': { itemId: 'trophy-minesweeper', name: '지뢰찾기 영웅 황금 깃발', pointPrice: 300, category: 'prop' },

    'minimi-ceo': { itemId: 'minimi-ceo', name: '월스트리트 수트 아바타', pointPrice: 250, category: 'minimi' },
    'minimi-astronaut': { itemId: 'minimi-astronaut', name: '우주 탐사 비행사 아바타', pointPrice: 300, category: 'minimi' },
    'minimi-hanbok': { itemId: 'minimi-hanbok', name: '전통 한복 선비 아바타', pointPrice: 300, category: 'minimi' },
    'minimi-wizard': { itemId: 'minimi-wizard', name: '별빛 아카데미 마법사 아바타', pointPrice: 350, category: 'minimi' },
    'minimi-champion': { itemId: 'minimi-champion', name: '로열 챔피언 왕관 아바타', pointPrice: 450, category: 'minimi' },
};

export const SERVER_CATALOG_ITEMS: Record<string, CatalogPriceItem> = Object.fromEntries(
    Object.entries(RAW_SERVER_CATALOG).map(([key, val]) => [
        key,
        {
            ...val,
            price: VERA_POINT_SHOP_ENABLED ? val.pointPrice : 0,
        },
    ])
);

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
    speechBubble: '내 아지트에 놀러온 걸 환영해요! 방명록 남기고 가세요 ✨',
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
                    room_title TEXT NOT NULL DEFAULT '나만의 아늑한 아지트',
                    status_mood TEXT NOT NULL DEFAULT 'happy',
                    status_message TEXT NOT NULL DEFAULT '오늘도 내 아지트에 놀러와줘서 고마워요! ✨',
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

            await this.cleanupMockMinihomes();
            this.initialized = true;
        } catch (err) {
            console.error('[MinihomeService] ensureTables error:', err);
        }
    }

    /**
     * 과거에 시드되었던 가짜 샘플 1촌/아지트 및 가짜 방명록 데이터를 Soft Delete 처리
     * (rule.md에 따라 Hard DELETE 쿼리를 절대 사용하지 않고 is_deleted = 1 처리)
     */
    private static async cleanupMockMinihomes(): Promise<void> {
        try {
            await pool.query(
                `UPDATE user_minihomes
                 SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP
                 WHERE handle IN ('vera_official', 'cyber_gamer', 'saju_master')
                   AND is_deleted = 0`
            );
            await pool.query(
                `UPDATE minihome_guestbook
                 SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP
                 WHERE (author_handle = 'vera_friends' OR host_handle IN ('vera_official', 'cyber_gamer', 'saju_master'))
                   AND is_deleted = 0`
            );
            // 기존 회원의 방 제목·소개글에 남아있는 '미니홈피/미니룸/일촌평' 기본 문구도 '아지트/방명록'으로 자동 정리
            await pool.query(
                `UPDATE user_minihomes
                 SET room_title = REPLACE(REPLACE(room_title, '미니홈피', '아지트'), '미니룸', '아지트'),
                     status_message = REPLACE(REPLACE(status_message, '일촌평', '방명록'), '내 방에', '내 아지트에')
                 WHERE is_deleted = 0`
            );
        } catch (err) {
            console.error('[MinihomeService] cleanupMockMinihomes error:', err);
        }
    }

    static async getVeraPoints(userId: number | null): Promise<number> {
        if (!userId) return 0;
        const res = await pool.query(
            'SELECT points, attendance_points, activity_points FROM user_points WHERE user_id = $1',
            [userId]
        );
        if (res.rows.length === 0) {
            await pool.query(
                `INSERT INTO user_points (user_id, points, pending_amount, attendance_points, activity_points)
                 VALUES ($1, 0, 0, 0, 0)
                 ON CONFLICT DO NOTHING`,
                [userId]
            );
            return 0;
        }
        const row = res.rows[0];
        // 과거 더미 초기값(500P)이 자동 주입된 레코드가 있다면 0으로 초기화
        if (Number(row.points) === 500 && Number(row.attendance_points) === 500 && Number(row.activity_points) === 0) {
            await pool.query(
                `UPDATE user_points SET points = 0, attendance_points = 0 WHERE user_id = $1`,
                [userId]
            );
            return 0;
        }
        return Number(row.points || 0);
    }

    static async ensureDefaultInventory(userId: number | null, handle: string): Promise<string[]> {
        const cleanHandle = this.normalizeHandle(handle);

        const initialItemIds = VERA_POINT_SHOP_ENABLED
            ? DEFAULT_FREE_ITEM_IDS
            : Object.keys(SERVER_CATALOG_ITEMS);

        for (const itemId of initialItemIds) {
            await pool.query(
                `INSERT INTO user_minihome_inventory (user_id, user_handle, item_id, acquired_type, price_paid)
                 VALUES ($1, $2, $3, 'free', 0)
                 ON CONFLICT (user_handle, item_id) DO NOTHING`,
                [userId, cleanHandle, itemId]
            );
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

        // 만약 user_id로 먼저 생성된 아지트가 있는지 체크
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
                : `${cleanHandle}님의 아지트`;
            const ownerUserId = cleanHandle === this.normalizeHandle(params.viewerHandle || cleanHandle)
                ? params.viewerUserId
                : null;

            await pool.query(
                `INSERT INTO user_minihomes (user_id, handle, owner_name, room_title, status_mood, status_message, bgm_track_id, layout_json, today_visitors, total_visitors)
                 VALUES ($1, $2, $3, $4, 'happy', '내 아지트에 놀러와줘서 고마워요! 방명록 남겨주세요 ✨', 'bgm-orgel', $5, 1, 1)
                 ON CONFLICT (handle) DO UPDATE SET
                    is_deleted = 0,
                    deleted_at = NULL,
                    user_id = COALESCE(user_minihomes.user_id, EXCLUDED.user_id)`,
                [
                    ownerUserId,
                    cleanHandle,
                    ownerName,
                    `${ownerName}의 아지트`,
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
            if (parsedLayout.speechBubble) {
                parsedLayout.speechBubble = parsedLayout.speechBubble
                    .replace(/미니룸/g, '아지트')
                    .replace(/미니홈피/g, '아지트');
            }
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
            throw new Error('아지트를 찾을 수 없습니다.');
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

        const effectivePrice = VERA_POINT_SHOP_ENABLED ? catalogItem.pointPrice : 0;

        let remainingPoints = 0;
        if (params.userId) {
            const currentPoints = await this.getVeraPoints(params.userId);
            if (VERA_POINT_SHOP_ENABLED && currentPoints < effectivePrice) {
                throw new Error(`베라포인트가 부족합니다. (보유: ${currentPoints}P / 필요: ${effectivePrice}P)`);
            }

            if (effectivePrice > 0) {
                await pool.query(
                    'UPDATE user_points SET points = points - $1 WHERE user_id = $2',
                    [effectivePrice, params.userId]
                );
            }
            remainingPoints = currentPoints - effectivePrice;
        }

        await pool.query(
            `INSERT INTO user_minihome_inventory (user_id, user_handle, item_id, acquired_type, price_paid, is_deleted)
             VALUES ($1, $2, $3, $4, $5, 0)
             ON CONFLICT (user_handle, item_id) DO UPDATE SET is_deleted = 0, deleted_at = NULL`,
            [
                params.userId,
                cleanHandle,
                params.itemId,
                VERA_POINT_SHOP_ENABLED ? 'purchase' : 'free',
                effectivePrice,
            ]
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
                params.authorName.trim() || '베라 이웃',
                cleanAuthor,
                params.authorMinimiId || 'minimi-casual',
                trimmed,
            ]
        );

        // 베라포인트 활성화 시에만 방명록 포인트 적립
        if (VERA_POINT_SHOP_ENABLED && params.authorUserId) {
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

        // 가짜 시드 계정이 아닌 실제 가입 회원(user_id IS NOT NULL)의 아지트만 조회
        const res = await pool.query(
            `SELECT handle, owner_name, room_title, status_mood, status_message, today_visitors, total_visitors, layout_json, updated_at
             FROM user_minihomes
             WHERE is_deleted = 0
               AND user_id IS NOT NULL
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
            : '';

        return {
            randomHandle: randomPick,
            popularRooms: candidates,
        };
    }
}
