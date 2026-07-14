import { Hono } from 'hono';
import { getDB } from '../db/adapter.js';
import { requireAuth } from '../middleware/auth.js';
import { bodyLimit } from 'hono/body-limit';

export const sfcRoutes = new Hono<{ Variables: { user?: any } }>();

// 헬퍼: 테이블 동적 초기화 (sfc_saves_v2)
async function initSfcTable(DB: any) {
    await DB.prepare(`
        CREATE TABLE IF NOT EXISTS sfc_saves_v2 (
            user_id INTEGER NOT NULL,
            game_name TEXT NOT NULL,
            slot_no INTEGER NOT NULL,
            slot_name TEXT NOT NULL,
            save_data TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, game_name, slot_no)
        )
    `).run();
}

// 헬퍼: 파일명 정규화
function getNormalizedGameName(name: string): string {
    return name
        .toLowerCase()
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-z0-9]/g, "")
        .trim();
}

// 1. 특정 게임의 세이브 슬롯 리스트 가져오기 (GET /api/sfc/list)
sfcRoutes.get('/api/sfc/list', requireAuth, async (c) => {
    const DB = getDB(c);
    const user = c.get('user');
    if (!user) {
        return c.json({ success: false, error: { code: 401, message: 'Unauthorized' } }, 401);
    }

    const gameName = c.req.query('gameName');
    if (!gameName) {
        return c.json({ success: false, error: { code: 400, message: 'Bad Request: gameName is required' } }, 400);
    }

    const normalized = getNormalizedGameName(gameName);

    try {
        await initSfcTable(DB);

        // 대용량 save_data를 제외한 슬롯 메타데이터만 조회
        const results = await DB.prepare(`
            SELECT slot_no, slot_name, updated_at
            FROM sfc_saves_v2
            WHERE user_id = ? AND game_name = ?
            ORDER BY slot_no ASC
        `).bind(user.id, normalized).all();

        return c.json({
            success: true,
            slots: results.results || []
        });
    } catch (error: any) {
        console.error('[SFC List Error]', error.message, error.stack);
        return c.json({ success: false, error: { code: 500, message: 'Internal Server Error: ' + error.message } }, 500);
    }
});

// 2. 세이브 데이터 저장 (POST /api/sfc/save)
sfcRoutes.post('/api/sfc/save', bodyLimit({ maxSize: 20 * 1024 * 1024 }), requireAuth, async (c) => {
    const DB = getDB(c);
    const user = c.get('user');
    if (!user) {
        return c.json({ success: false, error: { code: 401, message: 'Unauthorized' } }, 401);
    }

    try {
        await initSfcTable(DB);

        // Hono Request Body 파싱 우회
        const rawBody = await c.req.text();
        let body;
        try {
            body = JSON.parse(rawBody);
        } catch (pe: any) {
            return c.json({ success: false, error: { code: 400, message: 'Invalid JSON body: ' + pe.message } }, 400);
        }

        const { gameName, slotNo, slotName, saveData } = body;
        const parsedSlotNo = parseInt(slotNo, 10);

        if (!gameName || isNaN(parsedSlotNo) || parsedSlotNo < 1 || parsedSlotNo > 3 || !slotName || !saveData) {
            return c.json({ success: false, error: { code: 400, message: 'Bad Request: gameName, slotNo (1~3), slotName, and saveData are required' } }, 400);
        }

        const normalized = getNormalizedGameName(gameName);

        console.log('[SFC] Saving slot:', parsedSlotNo, 'name:', slotName, 'for user:', user.id, 'game:', normalized);

        await DB.prepare(`
            INSERT INTO sfc_saves_v2 (user_id, game_name, slot_no, slot_name, save_data, updated_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id, game_name, slot_no) DO UPDATE SET
                slot_name = excluded.slot_name,
                save_data = excluded.save_data,
                updated_at = CURRENT_TIMESTAMP
        `).bind(user.id, normalized, parsedSlotNo, slotName, saveData).run();

        return c.json({
            success: true,
            data: {
                gameName: normalized,
                slotNo: parsedSlotNo,
                slotName,
                updatedAt: new Date().toISOString()
            }
        });
    } catch (error: any) {
        console.error('[SFC Save Error]', error.message, error.stack);
        return c.json({ success: false, error: { code: 500, message: 'Internal Server Error: ' + error.message } }, 500);
    }
});

// 3. 특정 슬롯 세이브 데이터 로드 (GET /api/sfc/load)
sfcRoutes.get('/api/sfc/load', requireAuth, async (c) => {
    const DB = getDB(c);
    const user = c.get('user');
    if (!user) {
        return c.json({ success: false, error: { code: 401, message: 'Unauthorized' } }, 401);
    }

    const gameName = c.req.query('gameName');
    const slotNo = parseInt(c.req.query('slotNo') || '', 10);

    if (!gameName || isNaN(slotNo) || slotNo < 1 || slotNo > 3) {
        return c.json({ success: false, error: { code: 400, message: 'Bad Request: gameName and slotNo (1~3) are required' } }, 400);
    }

    const normalized = getNormalizedGameName(gameName);

    try {
        await initSfcTable(DB);

        console.log('[SFC] Loading slot:', slotNo, 'for user:', user.id, 'game:', normalized);

        const result = await DB.prepare(`
            SELECT slot_no, slot_name, save_data, updated_at
            FROM sfc_saves_v2
            WHERE user_id = ? AND game_name = ? AND slot_no = ?
        `).bind(user.id, normalized, slotNo).first();

        if (!result) {
            return c.json({ success: false, error: { code: 404, message: 'Save state not found in this slot' } }, 404);
        }

        return c.json({
            success: true,
            data: {
                gameName: normalized,
                slotNo: result.slot_no,
                slotName: result.slot_name,
                saveData: result.save_data,
                updatedAt: new Date(result.updated_at).toISOString()
            }
        });
    } catch (error: any) {
        console.error('[SFC Load Error]', error.message, error.stack);
        return c.json({ success: false, error: { code: 500, message: 'Internal Server Error: ' + error.message } }, 500);
    }
});

// 4. 특정 슬롯 세이브 데이터 삭제 (DELETE /api/sfc/delete)
sfcRoutes.delete('/api/sfc/delete', requireAuth, async (c) => {
    const DB = getDB(c);
    const user = c.get('user');
    if (!user) {
        return c.json({ success: false, error: { code: 401, message: 'Unauthorized' } }, 401);
    }

    const gameName = c.req.query('gameName');
    const slotNo = parseInt(c.req.query('slotNo') || '', 10);

    if (!gameName || isNaN(slotNo) || slotNo < 1 || slotNo > 3) {
        return c.json({ success: false, error: { code: 400, message: 'Bad Request: gameName and slotNo (1~3) are required' } }, 400);
    }

    const normalized = getNormalizedGameName(gameName);

    try {
        await initSfcTable(DB);

        console.log('[SFC] Deleting slot:', slotNo, 'for user:', user.id, 'game:', normalized);

        await DB.prepare(`
            DELETE FROM sfc_saves_v2
            WHERE user_id = ? AND game_name = ? AND slot_no = ?
        `).bind(user.id, normalized, slotNo).run();

        return c.json({
            success: true,
            message: 'Slot deleted successfully'
        });
    } catch (error: any) {
        console.error('[SFC Delete Error]', error.message, error.stack);
        return c.json({ success: false, error: { code: 500, message: 'Internal Server Error: ' + error.message } }, 500);
    }
});
