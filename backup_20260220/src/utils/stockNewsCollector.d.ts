export interface RSSItem {
    title: string;
    link: string;
    pubDate: string;
    summary: string;
    source?: string;
}
/**
 * RSS XML 파싱 (간단 버전 - Cloudflare Workers 호환)
 * @param xmlText RSS XML 텍스트
 * @returns RSS 아이템 배열
 */
export declare function parseRSSXML(xmlText: string): RSSItem[];
/**
 * Google News RSS에서 주식 뉴스 수집
 * @param rssUrl RSS URL
 * @returns 필터링된 주식 뉴스 배열
 */
export declare function fetchStockNewsFromRSS(rssUrl: string): Promise<RSSItem[]>;
/**
 * 여러 RSS URL에서 주식 뉴스 일괄 수집
 * @param rssUrls RSS URL 배열
 * @param delayMs 각 요청 간 대기 시간 (ms)
 * @returns 모든 주식 뉴스 배열
 */
export declare function fetchMultipleRSS(rssUrls: string[], delayMs?: number): Promise<RSSItem[]>;
/**
 * Google News RSS URL 생성기
 */
export declare function getStockNewsRSSUrls(): string[];
//# sourceMappingURL=stockNewsCollector.d.ts.map