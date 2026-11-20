import { Hono } from 'hono';
import { getDB } from '../db/adapter.js';
import { requireAdmin, logActivity } from './admin.routes.js';

export const miniappRoutes = new Hono<{ Variables: { adminUserId: string } }>();

// ==================== API: 공개 (프론트엔드용) ====================

// 활성 미니앱 목록 조회
miniappRoutes.get('/api/mini-apps', async (c) => {
    const DB = getDB(c);
    try {
        let apps = await DB.prepare("SELECT * FROM mini_apps WHERE status = 'active' ORDER BY sort_order ASC").all();

        // 해외직구 관·부가세 계산기(customs-calc)가 DB에 없으면 자동 시딩
        const hasCustomsCalc = apps.results.some((a: any) => a.slug === 'customs-calc');
        if (!hasCustomsCalc) {
            try {
                await DB.prepare(`
                    INSERT INTO mini_apps (name, slug, icon_url, description, app_url, require_auth, sort_order, category, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(
                    '해외직구 관·부가세 계산기',
                    'customs-calc',
                    'fas fa-plane-arrival',
                    '미국($200)/일반($150) 목록통관 기준 및 품목별 예상 관세·부가세 실시간 환율 계산',
                    '/app/customs-calc/',
                    0,
                    3,
                    'calc',
                    'active'
                ).run();
                apps = await DB.prepare("SELECT * FROM mini_apps WHERE status = 'active' ORDER BY sort_order ASC").all();
            } catch (seedErr) {
                console.error('Failed to auto-seed customs-calc:', seedErr);
            }
        }

        // 브라우저 OCR(ocr)이 DB에 없으면 자동 시딩
        const hasOcr = apps.results.some((a: any) => a.slug === 'ocr');
        if (!hasOcr) {
            try {
                await DB.prepare(`
                    INSERT INTO mini_apps (name, slug, icon_url, description, app_url, require_auth, sort_order, category, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(
                    '이미지 글자 추출기',
                    'ocr',
                    'fas fa-file-alt',
                    '캡처 이미지나 사진을 드래그하면 서버 전송 없이 브라우저에서 한글·영문 텍스트를 즉시 추출 및 다운로드',
                    '/app/ocr/',
                    0,
                    4,
                    'text',
                    'active'
                ).run();
                apps = await DB.prepare("SELECT * FROM mini_apps WHERE status = 'active' ORDER BY sort_order ASC").all();
            } catch (seedErr) {
                console.error('Failed to auto-seed ocr:', seedErr);
            }
        }

        // 연차 극대화 플래너(vacation-planner)가 DB에 없으면 자동 시딩
        const hasVacationPlanner = apps.results.some((a: any) => a.slug === 'vacation-planner');
        if (!hasVacationPlanner) {
            try {
                await DB.prepare(`
                    INSERT INTO mini_apps (name, slug, icon_url, description, app_url, require_auth, sort_order, category, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(
                    '연차 극대화 플래너',
                    'vacation-planner',
                    'fas fa-umbrella-beach',
                    '남은 연차 일수를 입력하면 2026-2027 대체공휴일과 주말을 자동 계산하여 최장 연속 휴가 루트를 달력 형태로 제공',
                    '/app/vacation-planner/',
                    0,
                    5,
                    'calc',
                    'active'
                ).run();
                apps = await DB.prepare("SELECT * FROM mini_apps WHERE status = 'active' ORDER BY sort_order ASC").all();
            } catch (seedErr) {
                console.error('Failed to auto-seed vacation-planner:', seedErr);
            }
        }

        // 이미지 크기 조정 & 일괄 변환기(image-resizer)가 DB에 없으면 자동 시딩
        const hasImageResizer = apps.results.some((a: any) => a.slug === 'image-resizer');
        if (!hasImageResizer) {
            try {
                await DB.prepare(`
                    INSERT INTO mini_apps (name, slug, icon_url, description, app_url, require_auth, sort_order, category, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(
                    '이미지 크기 조정 & 일괄 변환기',
                    'image-resizer',
                    'fas fa-images',
                    'SNS 권장 규격 및 픽셀, 비율, 용량(KB) 단위 최대 50장 다중 이미지 일괄 리사이즈 & WebP/JPG/PNG 변환기',
                    '/app/image-resizer/',
                    0,
                    2,
                    'calc',
                    'active'
                ).run();
                apps = await DB.prepare("SELECT * FROM mini_apps WHERE status = 'active' ORDER BY sort_order ASC").all();
            } catch (seedErr) {
                console.error('Failed to auto-seed image-resizer:', seedErr);
            }
        }

        // 스마트 QR코드 생성기(qr-generator)가 DB에 없으면 자동 시딩
        const hasQrGenerator = apps.results.some((a: any) => a.slug === 'qr-generator');
        if (!hasQrGenerator) {
            try {
                await DB.prepare(`
                    INSERT INTO mini_apps (name, slug, icon_url, description, app_url, require_auth, sort_order, category, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(
                    'QR코드 생성기 & 디자인 스튜디오',
                    'qr-generator',
                    'fas fa-qrcode',
                    'URL, 매장 와이파이(Wi-Fi) 자동연결, 전자명함(vCard) QR코드를 커스텀 로고·컬러와 함께 PNG/SVG 벡터로 즉시 생성',
                    '/app/qr-generator/',
                    0,
                    2,
                    'dev',
                    'active'
                ).run();
                apps = await DB.prepare("SELECT * FROM mini_apps WHERE status = 'active' ORDER BY sort_order ASC").all();
            } catch (seedErr) {
                console.error('Failed to auto-seed qr-generator:', seedErr);
            }
        }

        // 스마트 투두(TO-DO) 할일 플래너(todo-list)가 DB에 없으면 자동 시딩
        const hasTodoList = apps.results.some((a: any) => a.slug === 'todo-list');
        if (!hasTodoList) {
            try {
                await DB.prepare(`
                    INSERT INTO mini_apps (name, slug, icon_url, description, app_url, require_auth, sort_order, category, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(
                    '스마트 투두(TO-DO) 할일 플래너',
                    'todo-list',
                    'fas fa-list-check',
                    '우선순위·카테고리·마감일·서브태스크·25분 집중 타이머와 달성률 리포트를 브라우저 로컬에서 정리하는 무료 할일 플래너',
                    '/app/todo-list/',
                    0,
                    1,
                    'calc',
                    'active'
                ).run();
                apps = await DB.prepare("SELECT * FROM mini_apps WHERE status = 'active' ORDER BY sort_order ASC").all();
            } catch (seedErr) {
                console.error('Failed to auto-seed todo-list:', seedErr);
            }
        }

        // 기존 todo-list app_url이 '/tools/todo-list'인 경우 450x850 새 창 팝업 경로('/app/todo-list/')로 자동 보정
        const legacyTodoApp = apps.results.find((a: any) => a.slug === 'todo-list' && a.app_url !== '/app/todo-list/');
        if (legacyTodoApp) {
            try {
                await DB.prepare("UPDATE mini_apps SET app_url = '/app/todo-list/' WHERE slug = 'todo-list'").run();
                legacyTodoApp.app_url = '/app/todo-list/';
            } catch (todoUrlErr) {
                console.error('Failed to migrate todo-list app_url to popup:', todoUrlErr);
            }
        }

        // ocr 이름이 긴 경우('브라우저 OCR (이미지 글자 추출기)') 간결화('이미지 글자 추출기') 자동 마이그레이션
        const ocrApp = apps.results.find((a: any) => a.slug === 'ocr' && a.name !== '이미지 글자 추출기');
        if (ocrApp) {
            try {
                await DB.prepare("UPDATE mini_apps SET name = '이미지 글자 추출기' WHERE slug = 'ocr'").run();
                ocrApp.name = '이미지 글자 추출기';
            } catch (nameErr) {
                console.error('Failed to update ocr name:', nameErr);
            }
        }

        // json-formatter 아이콘이 유료 Pro 전용(fa-brackets-curly)인 경우 무료 fa-code로 자동 치유(Self-healing)
        const brokenJsonApp = apps.results.find((a: any) => a.slug === 'json-formatter' && (a.icon_url?.includes('fa-brackets-curly') || !a.icon_url));
        if (brokenJsonApp) {
            try {
                await DB.prepare("UPDATE mini_apps SET icon_url = 'fas fa-code' WHERE slug = 'json-formatter'").run();
                brokenJsonApp.icon_url = 'fas fa-code';
            } catch (healErr) {
                console.error('Failed to auto-heal json-formatter icon:', healErr);
            }
        }

        return c.json({ success: true, apps: apps.results });
    } catch (error) {
        console.error('MiniApp API Error:', error);
        return c.json({ success: false, message: '서버 오류' }, 500);
    }
});

// 자주 쓰는 앱 목록 (실행 로그 기반, 서버 영구 저장)
miniappRoutes.get('/api/mini-apps/frequent', async (c) => {
    const DB = getDB(c);
    try {
        const apps = await DB.prepare(`
            SELECT m.*, COUNT(l.id) as launch_count
            FROM mini_apps m
            INNER JOIN mini_app_logs l ON m.id = l.mini_app_id
            WHERE m.status = 'active' AND l.action_type = 'LAUNCH'
            GROUP BY m.id
            ORDER BY launch_count DESC
            LIMIT 5
        `).all();
        return c.json({ success: true, apps: apps.results });
    } catch (error) {
        console.error('Frequent Apps API Error:', error);
        return c.json({ success: true, apps: [] });
    }
});

// 미니앱 실행 로그 기록
miniappRoutes.post('/api/mini-apps/:id/log', async (c) => {
    const DB = getDB(c);
    const appId = c.req.param('id');
    try {
        const body = await c.req.json();
        const actionType = body.action_type || 'LAUNCH';
        const userId = body.user_id || null;

        await DB.prepare("INSERT INTO mini_app_logs (mini_app_id, user_id, action_type) VALUES (?, ?, ?)")
            .bind(appId, userId, actionType)
            .run();

        return c.json({ success: true });
    } catch (error) {
        console.error('MiniApp Log Error:', error);
        return c.json({ success: false, message: '서버 오류' }, 500);
    }
});

// ==================== API: 관리자용 ====================

// 관리자: 전체 미니앱 목록 조회
miniappRoutes.get('/api/admin/mini-apps', requireAdmin, async (c) => {
    const DB = getDB(c);
    try {
        const apps = await DB.prepare("SELECT * FROM mini_apps ORDER BY sort_order ASC").all();
        return c.json({ success: true, apps: apps.results });
    } catch (error) {
        return c.json({ success: false, message: '서버 오류' }, 500);
    }
});

// 관리자: 미니앱 등록
miniappRoutes.post('/api/admin/mini-apps', requireAdmin, async (c) => {
    const DB = getDB(c);
    const userId = c.get('adminUserId');
    try {
        const { name, slug, icon_url, description, app_url, status, require_auth, sort_order } = await c.req.json();

        const result = await DB.prepare(`
            INSERT INTO mini_apps (name, slug, icon_url, description, app_url, status, require_auth, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(name, slug, icon_url || '', description || '', app_url, status || 'active', require_auth ? 1 : 0, parseInt(sort_order) || 0).run();

        await logActivity(DB, userId, 'admin_action', `미니앱 등록: ${name}`);
        return c.json({ success: true, id: result.lastInsertRowid });
    } catch (error: any) {
        console.error('MiniApp Create Error:', error);
        return c.json({ success: false, message: '서버 오류: ' + error.message }, 500);
    }
});

// 관리자: 미니앱 수정
miniappRoutes.put('/api/admin/mini-apps/:id', requireAdmin, async (c) => {
    const DB = getDB(c);
    const id = c.req.param('id');
    const userId = c.get('adminUserId');
    try {
        const { name, slug, icon_url, description, app_url, status, require_auth, sort_order } = await c.req.json();

        await DB.prepare(`
            UPDATE mini_apps 
            SET name=?, slug=?, icon_url=?, description=?, app_url=?, status=?, require_auth=?, sort_order=?, updated_at=CURRENT_TIMESTAMP
            WHERE id=?
        `).bind(name, slug, icon_url || '', description || '', app_url, status || 'active', require_auth ? 1 : 0, parseInt(sort_order) || 0, id).run();

        await logActivity(DB, userId, 'admin_action', `미니앱 수정: ${name}`);
        return c.json({ success: true });
    } catch (error: any) {
        console.error('MiniApp Update Error:', error);
        return c.json({ success: false, message: '서버 오류: ' + error.message }, 500);
    }
});

// 관리자: 미니앱 상태 토글
miniappRoutes.patch('/api/admin/mini-apps/:id/status', requireAdmin, async (c) => {
    const DB = getDB(c);
    const id = c.req.param('id');
    const userId = c.get('adminUserId');
    try {
        const { status } = await c.req.json();
        await DB.prepare("UPDATE mini_apps SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(status, id).run();
        await logActivity(DB, userId, 'admin_action', `미니앱 상태 변경 (ID: ${id}) -> ${status}`);
        return c.json({ success: true });
    } catch (error) {
        return c.json({ success: false, message: '서버 오류' }, 500);
    }
});

// 관리자: 미니앱 삭제
miniappRoutes.delete('/api/admin/mini-apps/:id', requireAdmin, async (c) => {
    const DB = getDB(c);
    const id = c.req.param('id');
    const userId = c.get('adminUserId');
    try {
        await DB.prepare("DELETE FROM mini_app_logs WHERE mini_app_id=?").bind(id).run();
        await DB.prepare("DELETE FROM mini_apps WHERE id=?").bind(id).run();
        await logActivity(DB, userId, 'admin_action', `미니앱 삭제 (ID: ${id})`);
        return c.json({ success: true });
    } catch (error) {
        return c.json({ success: false, message: '서버 오류' }, 500);
    }
});

// 관리자: 미니앱 통계
miniappRoutes.get('/api/admin/mini-apps/stats', requireAdmin, async (c) => {
    const DB = getDB(c);
    try {
        const stats = await DB.prepare(`
            SELECT 
                m.id, 
                m.name, 
                COUNT(l.id) as total_launches,
                COUNT(DISTINCT l.user_id) as unique_users,
                MAX(l.created_at) as last_launched
            FROM mini_apps m
            LEFT JOIN mini_app_logs l ON m.id = l.mini_app_id
            GROUP BY m.id
            ORDER BY total_launches DESC
        `).all();

        return c.json({ success: true, stats: stats.results });
    } catch (error) {
        return c.json({ success: false, message: '서버 오류' }, 500);
    }
});
