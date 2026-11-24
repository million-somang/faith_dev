export type IndexNowPreset = 'core' | 'travel-top' | 'recent-news';

export interface SitemapIndexMeta {
    siteUrl: string;
    travelHighQualityCount: number;
    travelChunkSize: number;
    travelPageCount: number;
    travelLastMod: string | null;
    recentNewsCount: number;
    recentNewsLastMod: string | null;
}

export interface TravelSitemapRow {
    id: number;
    publishedAt: string | null;
    updatedAt: string | null;
}

export interface RecentNewsSitemapRow {
    id: number;
    title: string;
    publishedAt: string | null;
    createdAt: string | null;
}

export interface TravelRssItem {
    id: number;
    title: string;
    destination: string;
    region: string;
    province: string | null;
    city: string | null;
    category: string;
    summary: string;
    author: string | null;
    publishedAt: string | null;
    createdAt: string | null;
}

export interface IndexNowSubmitResult {
    submittedCount: number;
    httpStatus: number;
    ok: boolean;
    skipped: boolean;
    responseSnippet: string;
}

export interface IndexNowLogRecord {
    id: number;
    triggerSource: string;
    urlCount: number;
    sampleUrl: string | null;
    httpStatus: number | null;
    responseSnippet: string | null;
    createdAt: string | null;
}
