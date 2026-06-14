// 잘못 저장된 published_at 보정 (1회성, 데이터 삭제 없음)
// 사용법: npx tsx fix_news_pubdate.ts
//
// 경향 등 일부 언론사 RSS는 pubDate 대신 dc:date를 쓰는데, 과거 파서가 이를 못 읽어
// 수집시각(now)으로 저장 → 해당 매체가 목록 상단을 독식했다.
// 현재 피드에 남아있는 기사(최근 글)들의 published_at을 원본 날짜로 다시 맞춘다.
// (피드에서 사라진 오래된 기사는 보정 대상이 아님 — 시간이 지나면 자연히 하단으로 밀림)

import { pool } from '@faithportal/database'
import { parseRSSXML } from '@faithportal/core-utils'
import { toIsoDateTime } from './apps/api-server/src/services/newsCollector.js'

const FEEDS = [
    'https://www.khan.co.kr/rss/rssdata/total_news.xml',
    'https://rss.donga.com/total.xml',
    'https://www.mk.co.kr/rss/30100041/',
    'https://www.mk.co.kr/rss/50200011/',
]

async function main() {
    let fixed = 0, checked = 0
    for (const url of FEEDS) {
        try {
            const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FaithPortalBot/1.0)' } })
            if (!res.ok) { console.log(`[skip] ${url} (status ${res.status})`); continue }
            const items = parseRSSXML(await res.text())
            for (const it of items) {
                if (!it.link || !it.pubDate || !it.pubDate.includes('T')) continue // dc:date(ISO)만 신뢰
                const iso = toIsoDateTime(it.pubDate)
                checked++
                const r = await pool.query(
                    'UPDATE news SET published_at = $1 WHERE link = $2 AND published_at <> $3',
                    [iso, it.link, iso]
                )
                if ((r.rowCount ?? 0) > 0) { fixed++; }
            }
            console.log(`[done] ${url} — 항목 ${items.length}`)
        } catch (e) {
            console.log(`[fail] ${url}: ${(e as Error).message}`)
        }
    }
    console.log(`\n확인 ${checked}건 / 보정 ${fixed}건`)
    await pool.end()
}

main().catch(e => { console.error(e); process.exit(1) })
