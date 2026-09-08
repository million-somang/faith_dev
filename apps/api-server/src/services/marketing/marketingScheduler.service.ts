import cron from 'node-cron';
import { getDB } from '../../db/adapter.js';
import { publishToSocialMedia } from './metaPublisher.service.js';
import { generateMarketingContent } from './marketingAi.service.js';

let isSchedulerRunning = false;

export function startMarketingScheduler() {
    if (isSchedulerRunning) return;
    isSchedulerRunning = true;

    console.log('[MarketingScheduler] 마케팅 자동 발행 스케줄러 시작됨 (1분 주기)');

    // 매 1분마다 실행
    cron.schedule('* * * * *', async () => {
        try {
            await processScheduledPosts();
            await checkAutoPilotSchedule();
        } catch (err: any) {
            console.error('[MarketingScheduler] 스케줄러 실행 오류:', err.message);
        }
    });
}

/**
 * 예약된 포스트 처리 (SCHEDULED -> PUBLISHED / FAILED)
 */
export async function processScheduledPosts() {
    const DB = getDB(null);
    const nowIso = new Date().toISOString();

    // 현재 시간 이전에 예약된 대기 포스트 조회
    const scheduled = await DB.prepare(`
        SELECT * FROM marketing_posts 
        WHERE status = 'SCHEDULED' AND scheduled_at <= ?
        ORDER BY scheduled_at ASC
        LIMIT 5
    `).bind(nowIso).all();

    if (!scheduled.results || scheduled.results.length === 0) {
        return;
    }

    for (const post of scheduled.results) {
        console.log(`[MarketingScheduler] 예약 발행 시작: [${post.platform}] ${post.headline} (ID: ${post.id})`);
        
        // 상태를 PUBLISHING으로 갱신
        await DB.prepare(`
            UPDATE marketing_posts 
            SET status = 'PUBLISHING', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(post.id).run();

        const result = await publishToSocialMedia({
            id: post.id,
            platform: post.platform,
            headline: post.headline,
            bodyText: post.body_text,
            firstComment: post.first_comment,
            imageUrl: post.image_url
        });

        if (result.success) {
            await DB.prepare(`
                UPDATE marketing_posts 
                SET status = 'PUBLISHED', 
                    published_at = CURRENT_TIMESTAMP, 
                    external_post_id = ?,
                    error_message = NULL,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(result.externalPostId || (result.isMock ? 'mock_success' : 'meta_success'), post.id).run();
            console.log(`[MarketingScheduler] 발행 완료: ${post.id} (${result.isMock ? 'Mock 시뮬레이션' : 'Meta API'})`);
        } else {
            await DB.prepare(`
                UPDATE marketing_posts 
                SET status = 'FAILED', 
                    error_message = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(result.error || '발행 실패', post.id).run();
            console.error(`[MarketingScheduler] 발행 실패: ${post.id} - ${result.error}`);
        }
    }
}

/**
 * 완전 자동화(Auto-pilot) 스케줄 점검 및 자동 생성/발행
 */
async function checkAutoPilotSchedule() {
    const DB = getDB(null);
    try {
        const autoSetting = await DB.prepare("SELECT value FROM marketing_settings WHERE key = 'auto_pilot_enabled'").first();
        if (!autoSetting || autoSetting.value !== 'true') {
            return;
        }

        const now = new Date();
        const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        const slotsSetting = await DB.prepare("SELECT value FROM marketing_settings WHERE key = 'auto_pilot_slots'").first();
        const slots: string[] = slotsSetting ? JSON.parse(slotsSetting.value) : ['08:30', '12:30', '18:30'];

        if (!slots.includes(currentHourMin)) {
            return;
        }

        // 오늘 이미 자동 생성된 포스트가 있는지 확인 (중복 생성 방지)
        const todayPrefix = now.toISOString().slice(0, 10);
        const alreadyGenerated = await DB.prepare(`
            SELECT id FROM marketing_posts 
            WHERE created_at >= ? AND headline LIKE '[오토파일럿]%'
            LIMIT 1
        `).bind(`${todayPrefix} 00:00:00`).first();

        if (alreadyGenerated) {
            return;
        }

        console.log(`[MarketingScheduler:AutoPilot] ${currentHourMin} 자동 마케팅 생성 트리거 시작`);

        // 활성 미니앱 목록 중 하나 랜덤 또는 순차 선정
        const apps = await DB.prepare("SELECT * FROM mini_apps WHERE status = 'active' ORDER BY RANDOM() LIMIT 1").first();
        if (!apps) return;

        const generated = await generateMarketingContent({
            name: apps.name,
            slug: apps.slug,
            description: apps.description || '',
            app_url: apps.app_url,
            category: apps.category
        });

        const postId = `mkt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const headline = `[오토파일럿] ${generated.headline}`;

        // 즉시 발행 처리
        const publishResult = await publishToSocialMedia({
            id: postId,
            platform: 'THREADS',
            headline,
            bodyText: generated.threadsBody,
            firstComment: generated.threadsFirstComment
        });

        await DB.prepare(`
            INSERT INTO marketing_posts (
                id, target_service_slug, target_service_name, target_service_url,
                platform, headline, body_text, first_comment, status,
                published_at, external_post_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
        `).bind(
            postId,
            apps.slug,
            apps.name,
            apps.app_url,
            'THREADS',
            headline,
            generated.threadsBody,
            generated.threadsFirstComment,
            publishResult.success ? 'PUBLISHED' : 'FAILED',
            publishResult.externalPostId || null
        ).run();

        console.log(`[MarketingScheduler:AutoPilot] ${apps.name} 자동 마케팅 발행 완료! (ID: ${postId})`);
    } catch (e: any) {
        console.error('[MarketingScheduler:AutoPilot] 오류:', e.message);
    }
}
