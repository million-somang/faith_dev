import { pool } from '@faithportal/database'
import { fetchAndSaveNews } from './newsCollector.js'

// 동시 실행 방지 (수집이 1분보다 오래 걸릴 수 있음)
let isRunning = false

// 다음 실행 시간 계산 (news.routes.ts의 저장 로직과 동일하게 유지)
function calculateNextRun(type: string, time: string, interval: number): string {
    const now = new Date()
    if (type === 'hourly') {
        return new Date(now.getTime() + (interval || 1) * 60 * 60 * 1000).toISOString()
    } else if (type === 'daily' && time) {
        const [h, m] = time.split(':').map(Number)
        const kTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)) // KST
        const nextRun = new Date(kTime)
        nextRun.setHours(h, m, 0, 0)
        if (nextRun <= kTime) nextRun.setDate(nextRun.getDate() + 1)
        return new Date(nextRun.getTime() - (9 * 60 * 60 * 1000)).toISOString()
    }
    return new Date(now.getTime() + 60 * 60 * 1000).toISOString()
}

async function checkAndRun() {
    if (isRunning) return
    try {
        const res = await pool.query('SELECT * FROM news_schedule WHERE id = 1')
        const row = res.rows[0]
        if (!row || Number(row.enabled) !== 1) return

        const now = new Date()
        const nextRun = row.next_run ? new Date(row.next_run) : null
        // next_run이 설정돼 있고 아직 미래면 대기 (null/과거면 즉시 실행)
        if (nextRun && !isNaN(nextRun.getTime()) && now < nextRun) return

        isRunning = true
        console.log(`[Scheduler] 예정된 뉴스 수집 시작 (이전 next_run: ${row.next_run})`)
        try {
            await fetchAndSaveNews()
        } finally {
            const nextRunTime = calculateNextRun(row.schedule_type, row.schedule_time, row.interval_hours)
            await pool.query(
                'UPDATE news_schedule SET last_run = $1, next_run = $2, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
                [now.toISOString(), nextRunTime]
            )
            console.log(`[Scheduler] 수집 완료. 다음 실행 예정: ${nextRunTime}`)
            isRunning = false
        }
    } catch (e) {
        isRunning = false
        console.error('[Scheduler] 스케줄 체크 중 오류:', e)
    }
}

// 뉴스 수집 스케줄러 시작 (매 1분 next_run 확인 → 도래 시 수집)
export function startNewsScheduler() {
    console.log('[Scheduler] 뉴스 수집 스케줄러 시작 (매 분 체크)')
    setInterval(checkAndRun, 60 * 1000)
    // 서버 기동 10초 후 1회 체크: next_run이 과거/미설정이면 즉시 수집
    setTimeout(checkAndRun, 10 * 1000)
}
