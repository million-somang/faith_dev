// Google News RSS 수집기
import { isStockNews } from './stockNewsFilter'

export interface RSSItem {
  title: string
  link: string
  pubDate: string
  summary: string
  source?: string
}

/**
 * RSS XML 파싱 (간단 버전 - Cloudflare Workers 호환)
 * @param xmlText RSS XML 텍스트
 * @returns RSS 아이템 배열
 */
export function parseRSSXML(xmlText: string): RSSItem[] {
  const items: RSSItem[] = []
  
  try {
    // <item> 태그 추출
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    const itemMatches = xmlText.matchAll(itemRegex)
    
    for (const match of itemMatches) {
      const itemXml = match[1]
      
      // 각 필드 추출
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
  } catch (error) {
    console.error('RSS 파싱 오류:', error)
  }
  
  return items
}

/**
 * XML 태그에서 내용 추출
 */
function extractTag(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, 'i')
  const match = xml.match(regex)
  return match ? match[1] : ''
}

/**
 * HTML 엔티티 디코딩 및 CDATA 제거
 */
function cleanText(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1') // CDATA 제거
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, '') // HTML 태그 제거
    .trim()
}

/**
 * Google News RSS에서 주식 뉴스 수집
 * @param rssUrl RSS URL
 * @returns 필터링된 주식 뉴스 배열
 */
export async function fetchStockNewsFromRSS(rssUrl: string): Promise<RSSItem[]> {
  try {
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    })
    
    if (!response.ok) {
      throw new Error(`RSS 요청 실패: ${response.status}`)
    }
    
    const xmlText = await response.text()
    const allItems = parseRSSXML(xmlText)
    
    // 주식 뉴스만 필터링
    const stockNews = allItems.filter(item => isStockNews(item.title))
    
    console.log(`RSS 수집 완료: 전체 ${allItems.length}건 → 주식 뉴스 ${stockNews.length}건`)
    
    return stockNews
  } catch (error) {
    console.error('RSS 수집 오류:', rssUrl, error)
    return []
  }
}

/**
 * 여러 RSS URL에서 주식 뉴스 일괄 수집
 * @param rssUrls RSS URL 배열
 * @param delayMs 각 요청 간 대기 시간 (ms)
 * @returns 모든 주식 뉴스 배열
 */
export async function fetchMultipleRSS(
  rssUrls: string[], 
  delayMs: number = 1000
): Promise<RSSItem[]> {
  const allNews: RSSItem[] = []
  
  for (let i = 0; i < rssUrls.length; i++) {
    const url = rssUrls[i]
    const news = await fetchStockNewsFromRSS(url)
    allNews.push(...news)
    
    // 마지막 URL이 아니면 대기
    if (i < rssUrls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  
  // 중복 제거 (link 기준)
  const uniqueNews = Array.from(
    new Map(allNews.map(item => [item.link, item])).values()
  )
  
  return uniqueNews
}

/**
 * Google News RSS URL 생성기
 */
export function getStockNewsRSSUrls(): string[] {
  const queries = [
    '주식 특징주',
    '코스피 급등',
    '코스닥 급락',
    '상한가 하한가',
    '실적 발표',
    '목표가 투자의견',
    'IPO 상장',
    '배당 공시'
  ]
  
  return queries.map(q => 
    `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=ko&gl=KR&ceid=KR:ko`
  )
}
