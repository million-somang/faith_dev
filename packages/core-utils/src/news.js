export function parseRSSXML(xmlText) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const itemMatches = xmlText.matchAll(itemRegex);
    for (const match of itemMatches) {
        const itemXml = match[1];
        const title = extractTag(itemXml, 'title');
        const link = extractTag(itemXml, 'link');
        // pubDate 없으면 dc:date(Dublin Core) 폴백 — 경향 등 일부 언론사 RSS가 dc:date 사용.
        // 누락 시 수집시각(now)으로 저장돼 해당 매체가 정렬 상단을 독식하는 문제 방지.
        const pubDate = extractTag(itemXml, 'pubDate') || extractTag(itemXml, 'dc:date');
        const description = extractTag(itemXml, 'description');
        const source = extractTag(itemXml, 'source');
        if (title && link) {
            items.push({
                title: cleanText(title),
                link: cleanText(link),
                pubDate: pubDate || new Date().toISOString(),
                summary: cleanText(description || ''),
                source: cleanText(source || '구글뉴스'),
                thumbnail: extractThumbnail(itemXml)
            });
        }
    }
    return items;
}
/**
 * RSS item에서 썸네일 이미지 URL 추출
 * 지원: <enclosure url>, <media:content url>, <media:thumbnail url>, description 내 <img src>
 */
function extractThumbnail(itemXml) {
    // 1. enclosure (이미지 타입)
    const enclosure = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*>/i);
    if (enclosure && (!/type=/.test(enclosure[0]) || /type=["']image/i.test(enclosure[0]))) {
        return enclosure[1];
    }
    // 2. media:content / media:thumbnail
    const media = itemXml.match(/<media:(?:content|thumbnail)[^>]+url=["']([^"']+)["']/i);
    if (media)
        return media[1];
    // 3. description 안의 <img> (CDATA 또는 escaped 형태 모두)
    const img = itemXml.match(/<img[^>]+src=["']([^"']+)["']/i)
        || itemXml.match(/&lt;img[^&]+src=&quot;([^&]+?)&quot;/i)
        || itemXml.match(/&lt;img[^&]+src=["']([^"']+?)["']/i);
    if (img)
        return img[1];
    return null;
}
function extractTag(xml, tagName) {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1] : '';
}
function cleanText(text) {
    return text
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        // 블록 경계(목록/문단 끝)는 공백 2칸으로 치환 → 매체명과 다음 제목이 붙는 것 방지
        .replace(/<\/(li|p|div|tr|h[1-6])>/gi, '  ')
        .replace(/<[^>]+>/g, '')
        .trim();
}
export const SIGNAL_WORDS = ['특징주', '급등', '급락', '상한가', '하한가', '실적', '주가'];
export function analyzeSentiment(title) {
    const positiveWords = ['급등', '상한가', '호재', '신고가', '반등'];
    const negativeWords = ['급락', '하한가', '악재', '신저가', '반락'];
    const hasPositive = positiveWords.some(word => title.includes(word));
    const hasNegative = negativeWords.some(word => title.includes(word));
    if (hasPositive && !hasNegative)
        return 'POSITIVE';
    if (hasNegative && !hasPositive)
        return 'NEGATIVE';
    return 'NEUTRAL';
}
