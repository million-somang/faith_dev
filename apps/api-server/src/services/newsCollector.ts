import { query } from '@faithportal/database';
import { parseRSSXML, RSSItem } from '@faithportal/core-utils';
import { resolveThumbnailFromGoogleNews } from '../utils/googleNewsResolver.js';

const CATEGORY_RSS_URLS: Record<string, string> = {
    general: 'https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko',
    economy: 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=ko&gl=KR&ceid=KR:ko',
    stock: 'https://news.google.com/rss/search?q=%EC%A3%BC%EC%8B%9D+%ED%8A%B9%EC%A7%95%EC%A3%BC&hl=ko&gl=KR&ceid=KR:ko'
};

// 이미지(썸네일)가 포함된 언론사 RSS 피드 (enclosure / media:content / description img)
// 피드별로 실패할 수 있으므로 카테고리별 try/catch로 격리됨
const PUBLISHER_RSS_URLS: Array<{ category: string; url: string; source: string }> = [
    { category: 'general', url: 'https://www.khan.co.kr/rss/rssdata/total_news.xml', source: '경향신문' },
    { category: 'general', url: 'https://rss.donga.com/total.xml', source: '동아일보' },
    { category: 'economy', url: 'https://www.mk.co.kr/rss/30100041/', source: '매일경제' },
    { category: 'stock', url: 'https://www.mk.co.kr/rss/50200011/', source: '매일경제' },
];

// 구글 뉴스 썸네일 해독은 비공식 API를 사용하므로 1회 수집당 건수 제한
const GOOGLE_THUMBNAIL_LIMIT_PER_RUN = 15;

/**
 * RSS pubDate → ISO 형식 문자열 (SQLite 정렬용: 'YYYY-MM-DD HH:MM:SS')
 * RFC2822 문자열을 그대로 저장하면 문자열 정렬이 깨지므로 반드시 ISO로 변환해 저장
 */
export function toIsoDateTime(pubDateStr?: string): string {
    let d = new Date()
    if (pubDateStr) {
        const parsed = new Date(pubDateStr)
        if (!isNaN(parsed.getTime())) d = parsed
    }
    return d.toISOString().replace('T', ' ').substring(0, 19)
}

export async function fetchAndSaveNews() {
    console.log(`[${new Date().toISOString()}] 뉴스 수집 시작...`)

    try {
        // 1. 구글 뉴스 수집 (신규 기사 링크 수집)
        const newGoogleLinks: string[] = []
        for (const [category, url] of Object.entries(CATEGORY_RSS_URLS)) {
            const inserted = await processCategory(category, url)
            newGoogleLinks.push(...inserted)
        }

        // 2. 언론사 RSS 수집 (이미지 포함 피드)
        await collectPublisherFeeds()

        // 3. 신규 구글 뉴스 기사 썸네일 해독 (best-effort, 건수 제한)
        await backfillGoogleThumbnails(newGoogleLinks.slice(0, GOOGLE_THUMBNAIL_LIMIT_PER_RUN))
    } catch (error) {
        console.error('뉴스 수집 중 치명적 오류:', error)
    } finally {
        console.log(`[${new Date().toISOString()}] 뉴스 수집 완료`)
    }
}

/**
 * 뉴스 저장 공통 로직: 같은 제목이 이미 있으면 카테고리만 병합 (중복 노출 방지)
 * @returns 'inserted' | 'merged' | 'skipped'
 */
export async function insertOrMergeNews(
    category: string, title: string, summary: string, link: string,
    thumbnail: string | null, source: string | undefined, publishedAt: string
): Promise<'inserted' | 'merged' | 'skipped'> {
    // 같은 제목의 기존 뉴스가 있으면 카테고리 병합
    const existing = await query(
        'SELECT id, category FROM news WHERE title = $1 AND (hidden IS NULL OR hidden = 0) LIMIT 1',
        [title]
    )
    if (existing.rows.length > 0) {
        const row = existing.rows[0]
        const cats = String(row.category || '').split(',').map(s => s.trim()).filter(Boolean)
        if (!cats.includes(category)) {
            await query('UPDATE news SET category = $1 WHERE id = $2', [[...cats, category].join(','), row.id])
            return 'merged'
        }
        return 'skipped'
    }

    const result = await query(`
        INSERT INTO news (
            category, title, summary, link, thumbnail, source, published_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (link) DO NOTHING
    `, [category, title, summary, link, thumbnail, source, publishedAt])
    return (result.rowCount ?? 0) > 0 ? 'inserted' : 'skipped'
}

/**
 * 구글 뉴스 카테고리 수집. 새로 INSERT된 기사 링크 목록을 반환 (썸네일 해독 대상)
 */
async function processCategory(category: string, rssUrl: string): Promise<string[]> {
    const insertedLinks: string[] = []
    try {
        console.log(`- ${category} 카테고리 수집 중...`)

        const response = await fetch(rssUrl)
        if (!response.ok) return insertedLinks

        const xmlText = await response.text()
        const items = parseRSSXML(xmlText)

        for (const item of items) {
            const imageUrl = item.thumbnail || extractImageUrl(item.summary)
            const status = await insertOrMergeNews(
                category, item.title, stripHtml(item.summary), item.link,
                imageUrl, item.source, toIsoDateTime(item.pubDate)
            )

            // 새로 추가됐고 썸네일이 없는 구글 뉴스 기사 → 해독 대상
            if (status === 'inserted' && !imageUrl && item.link.includes('news.google.com')) {
                insertedLinks.push(item.link)
            }
        }
    } catch (error) {
        console.error(`${category} 수집 중 오류:`, error)
    }
    return insertedLinks
}

/**
 * 이미지 포함 언론사 피드 전체 수집 (외부에서 호출 가능)
 */
export async function collectPublisherFeeds() {
    for (const feed of PUBLISHER_RSS_URLS) {
        await processPublisherFeed(feed.category, feed.url, feed.source)
    }
}

/**
 * 언론사 RSS 수집 (이미지 포함 피드, 원문 직링크)
 */
async function processPublisherFeed(category: string, rssUrl: string, sourceName: string) {
    try {
        console.log(`- ${sourceName} (${category}) 피드 수집 중...`)

        const response = await fetch(rssUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FaithPortalBot/1.0)' }
        })
        if (!response.ok) {
            console.warn(`  ${sourceName} 피드 응답 오류: ${response.status}`)
            return
        }

        const xmlText = await response.text()
        const items = parseRSSXML(xmlText)
        let count = 0

        for (const item of items) {
            const imageUrl = item.thumbnail || extractImageUrl(item.summary)
            const status = await insertOrMergeNews(
                category, item.title, stripHtml(item.summary), item.link,
                imageUrl,
                item.source && item.source !== '구글뉴스' ? item.source : sourceName,
                toIsoDateTime(item.pubDate)
            )
            if (status === 'inserted') count++
        }
        console.log(`  ${sourceName}: 신규 ${count}건`)
    } catch (error) {
        console.error(`${sourceName} 피드 수집 중 오류:`, error)
    }
}

/**
 * 신규 구글 뉴스 기사의 썸네일을 원문 og:image에서 best-effort로 채움
 */
export async function backfillGoogleThumbnails(links: string[]) {
    if (links.length === 0) return
    console.log(`- 구글 뉴스 썸네일 해독 시도: ${links.length}건`)
    let success = 0

    for (const link of links) {
        try {
            const thumbnail = await resolveThumbnailFromGoogleNews(link)
            if (thumbnail) {
                await query('UPDATE news SET thumbnail = $1 WHERE link = $2 AND (thumbnail IS NULL OR thumbnail = \'\')', [thumbnail, link])
                success++
            }
        } catch (e) {
            // best-effort: 개별 실패는 무시
        }
    }
    console.log(`  썸네일 해독 성공: ${success}/${links.length}건`)
}

function stripHtml(html: string): string {
    return html
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/\s+/g, ' ')
        .trim()
}

function extractImageUrl(description: string): string | null {
    const match = description.match(/<img[^>]+src="([^">]+)"/)
    return match ? match[1] : null
}
