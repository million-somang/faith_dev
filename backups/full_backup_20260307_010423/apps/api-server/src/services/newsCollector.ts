import { query } from '@faithportal/database';
import { parseRSSXML, RSSItem } from '@faithportal/core-utils';

const CATEGORY_RSS_URLS: Record<string, string> = {
    general: 'https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko',
    economy: 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=ko&gl=KR&ceid=KR:ko',
    stock: 'https://news.google.com/rss/search?q=%EC%A3%BC%EC%8B%9D+%ED%8A%B9%EC%A7%95%EC%A3%BC&hl=ko&gl=KR&ceid=KR:ko'
};

export async function fetchAndSaveNews() {
    console.log(`[${new Date().toISOString()}] 뉴스 수집 시작...`)

    try {
        for (const [category, url] of Object.entries(CATEGORY_RSS_URLS)) {
            await processCategory(category, url)
        }
    } catch (error) {
        console.error('뉴스 수집 중 치명적 오류:', error)
    } finally {
        console.log(`[${new Date().toISOString()}] 뉴스 수집 완료`)
    }
}

async function processCategory(category: string, rssUrl: string) {
    try {
        console.log(`- ${category} 카테고리 수집 중...`)

        const response = await fetch(rssUrl)
        if (!response.ok) return

        const xmlText = await response.text()
        const items = parseRSSXML(xmlText)

        for (const item of items) {
            const imageUrl = extractImageUrl(item.summary)
            let pubDate = new Date()
            try {
                if (item.pubDate) pubDate = new Date(item.pubDate)
            } catch (e) { }

            await query(`
                INSERT INTO news (
                    category, title, summary, link, thumbnail, source, published_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (link) DO NOTHING
            `, [
                category,
                item.title,
                stripHtml(item.summary),
                item.link,
                imageUrl,
                item.source,
                pubDate
            ])
        }
    } catch (error) {
        console.error(`${category} 수집 중 오류:`, error)
    }
}

function stripHtml(html: string): string {
    return html.replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, '')
}

function extractImageUrl(description: string): string | null {
    const match = description.match(/<img[^>]+src="([^">]+)"/)
    return match ? match[1] : null
}
