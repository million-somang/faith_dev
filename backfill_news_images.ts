// 이미지 없는 기존 뉴스의 썸네일을 원문 og:image로 보충하는 1회성 스크립트
// (데이터 삭제 없음 — thumbnail이 비어있는 행만 UPDATE)
//
// 사용법: npx tsx backfill_news_images.ts
//   BACKFILL_LIMIT  : 한 번에 처리할 건수 (기본 200)
//   BACKFILL_DELAY  : 각 요청 사이 대기(ms) (기본 500, 외부 사이트 부하/차단 방지)
//
// 이미지가 비어있는 기사만 골라 처리하므로 여러 번 반복 실행하면 계속 이어서 채웁니다.

import { pool } from '@faithportal/database'
import { resolveThumbnailFromGoogleNews } from './apps/api-server/src/utils/googleNewsResolver.js'

const LIMIT = parseInt(process.env.BACKFILL_LIMIT || '200')
const DELAY = parseInt(process.env.BACKFILL_DELAY || '500')

async function main() {
    const res = await pool.query(
        `SELECT id, link, source FROM news
         WHERE (thumbnail IS NULL OR thumbnail = '')
           AND link IS NOT NULL AND link LIKE 'http%'
           AND (hidden IS NULL OR hidden = 0)
         ORDER BY published_at DESC, created_at DESC
         LIMIT $1`,
        [LIMIT]
    )
    const rows = res.rows
    console.log(`이미지 없는 기사 ${rows.length}건 처리 시작 (delay ${DELAY}ms)\n`)

    let ok = 0, none = 0, err = 0
    for (let i = 0; i < rows.length; i++) {
        const r = rows[i]
        const tag = `${i + 1}/${rows.length}`
        try {
            const thumb = await resolveThumbnailFromGoogleNews(r.link)
            if (thumb) {
                await pool.query(
                    "UPDATE news SET thumbnail = $1 WHERE id = $2 AND (thumbnail IS NULL OR thumbnail = '')",
                    [thumb, r.id]
                )
                ok++
                console.log(`  [OK ${tag}] #${r.id} ${r.source || ''} → ${thumb.slice(0, 70)}`)
            } else {
                none++
                console.log(`  [-- ${tag}] #${r.id} ${r.source || ''} (og:image 없음)`)
            }
        } catch (e) {
            err++
            console.log(`  [ER ${tag}] #${r.id} ${(e as Error).message}`)
        }
        if (i < rows.length - 1) await new Promise(s => setTimeout(s, DELAY))
    }

    console.log(`\n완료: 성공 ${ok}건 / og:image없음 ${none}건 / 오류 ${err}건`)
    await pool.end()
}

main().catch(e => { console.error(e); process.exit(1) })
