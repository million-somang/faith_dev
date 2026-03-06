export declare const SIGNAL_WORDS: string[];
export declare const EXCLUDE_WORDS: string[];
/**
 * 뉴스 제목이 주식 뉴스인지 판별
 * @param title 뉴스 제목
 * @returns true: 주식 뉴스, false: 일반 뉴스
 */
export declare function isStockNews(title: string): boolean;
/**
 * 뉴스에서 관련 종목 추출
 * @param title 뉴스 제목
 * @param summary 뉴스 요약
 * @returns 관련 종목 티커 배열
 */
export declare function extractRelatedTickers(title: string, summary?: string): string[];
/**
 * 제목에서 키워드 추출 (태그용)
 * @param title 뉴스 제목
 * @returns 키워드 배열
 */
export declare function extractKeywords(title: string): string[];
/**
 * 뉴스 감성 분석 (간단 버전)
 * @param title 뉴스 제목
 * @returns 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
 */
export declare function analyzeSentiment(title: string): 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
//# sourceMappingURL=stockNewsFilter.d.ts.map