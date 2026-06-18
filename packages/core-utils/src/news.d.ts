export interface RSSItem {
    title: string;
    link: string;
    pubDate: string;
    summary: string;
    source?: string;
    thumbnail?: string | null;
}
export declare function parseRSSXML(xmlText: string): RSSItem[];
export declare const SIGNAL_WORDS: string[];
export declare function analyzeSentiment(title: string): 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
//# sourceMappingURL=news.d.ts.map