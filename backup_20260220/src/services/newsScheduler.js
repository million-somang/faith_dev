import cron from 'node-cron';
import { fetchAndSaveNews } from './newsCollector';
import Database from 'better-sqlite3';
const DB_PATH = process.env.DATABASE_PATH || './faith-portal.db';
// 뉴스 수집 스케줄러 시작 함수
export function startNewsScheduler() {
    console.log('[Scheduler] 뉴스 수집 스케줄러가 시작되었습니다. (매 분 상태 체크)');
    // 1분마다 체크 (* * * * *)
    cron.schedule('* * * * *', async () => {
        const db = new Database(DB_PATH);
        try {
            const row = db.prepare('SELECT * FROM news_schedule WHERE id = 1').get();
            if (!row || row.enabled !== 1)
                return;
            const now = new Date();
            const nextRun = row.next_run ? new Date(row.next_run) : null;
            if (nextRun && now >= nextRun) {
                console.log(`[Scheduler] 예정된 뉴스 수집을 시작합니다. (다음 실행 예정이었던 시간: ${row.next_run})`);
                // 뉴스 수집 실행
                await fetchAndSaveNews();
                // 실행 기록 업데이트 (localhost API 호출 대신 직접 DB 업데이트 또는 공통 로직 사용 가능하지만 
                // 여기서는 간단히 직접 업데이트하거나 API 엔드포인트의 로직을 재사용)
                // 호환성을 위해 API 호출을 흉내내거나 필요한 로직을 직접 수행
                const next_run_time = calculateNextRun(row.schedule_type, row.schedule_time, row.interval_hours);
                db.prepare(`
                    UPDATE news_schedule SET 
                        last_run = ?, 
                        next_run = ?, 
                        updated_at = CURRENT_TIMESTAMP 
                    WHERE id = 1
                `).run(now.toISOString(), next_run_time);
                console.log(`[Scheduler] 실행 기록 업데이트 완료. 다음 실행 예정: ${next_run_time}`);
            }
        }
        catch (error) {
            console.error('[Scheduler] 스케줄 체크 중 오류:', error);
        }
        finally {
            db.close();
        }
    });
    // 서버 시작 시 즉시 실행 여부 체크 (next_run이 비어있거나 과거인 경우)
    setTimeout(async () => {
        const db = new Database(DB_PATH);
        try {
            const row = db.prepare('SELECT * FROM news_schedule WHERE id = 1').get();
            if (row && row.enabled === 1) {
                const now = new Date();
                const nextRun = row.next_run ? new Date(row.next_run) : null;
                if (!nextRun || now >= nextRun) {
                    console.log('[Scheduler] 서버 시작 시 즉시 수집을 실행합니다.');
                    await fetchAndSaveNews();
                    const next_run_time = calculateNextRun(row.schedule_type, row.schedule_time, row.interval_hours);
                    db.prepare(`UPDATE news_schedule SET last_run = ?, next_run = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1`)
                        .run(now.toISOString(), next_run_time);
                }
            }
        }
        catch (e) {
            console.error('[Scheduler] 초기 실행 체크 오류:', e);
        }
        finally {
            db.close();
        }
    }, 5000);
}
// 다음 실행 시간 계산 함수 (API 쪽과 동일한 로직)
function calculateNextRun(type, time, interval) {
    const now = new Date();
    if (type === 'hourly') {
        return new Date(now.getTime() + (interval || 1) * 60 * 60 * 1000).toISOString();
    }
    else if (type === 'daily' && time) {
        const [h, m] = time.split(':').map(Number);
        const kTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        const nextRun = new Date(kTime);
        nextRun.setHours(h, m, 0, 0);
        if (nextRun <= kTime)
            nextRun.setDate(nextRun.getDate() + 1);
        return new Date(nextRun.getTime() - (9 * 60 * 60 * 1000)).toISOString();
    }
    return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
}
