export interface RSSItem {
    title: string
    link: string
    pubDate: string
    summary: string
    source?: string
}

export function parseRSSXML(xmlText: string): RSSItem[] {
    const items: RSSItem[] = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    const itemMatches = xmlText.matchAll(itemRegex)

    for (const match of itemMatches) {
        const itemXml = match[1]
        const title = extractTag(itemXml, 'title')
        const link = extractTag(itemXml, 'link')
        const pubDate = extractTag(itemXml, 'pubDate')
        const description = extractTag(itemXml, 'description')
        const source = extractTag(itemXml, 'source')

        if (title && link) {
            items.push({
                title: cleanText(title),
                link: cleanText(link),
                pubDate: pubDate || new Date().toISOString(),
                summary: cleanText(description || ''),
                source: cleanText(source || '구글뉴스')
            })
        }
    }
    return items
}

function extractTag(xml: string, tagName: string): string {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, 'i')
    const match = xml.match(regex)
    return match ? match[1] : ''
}

function cleanText(text: string): string {
    return text
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/<[^>]+>/g, '')
        .trim()
}

export const SIGNAL_WORDS = ['특징주', '급등', '급락', '상한가', '하한가', '실적', '주가'];

export function analyzeSentiment(title: string): 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' {
    const positiveWords = ['급등', '상한가', '호재', '신고가', '반등']
    const negativeWords = ['급락', '하한가', '악재', '신저가', '반락']

    const hasPositive = positiveWords.some(word => title.includes(word))
    const hasNegative = negativeWords.some(word => title.includes(word))

    if (hasPositive && !hasNegative) return 'POSITIVE'
    if (hasNegative && !hasPositive) return 'NEGATIVE'
    return 'NEUTRAL'
}
