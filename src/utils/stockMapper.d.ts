/**
 * 종목 매핑 유틸리티
 * 뉴스와 종목을 연결하기 위한 키워드 매핑 시스템
 */
interface StockInfo {
    name: string;
    keywords: string[];
    priority: number;
}
export declare const STOCK_KEYWORDS: Record<string, StockInfo>;
/**
 * 텍스트에서 관련 종목 찾기 (가중치 적용 버전)
 * @param title - 뉴스 제목
 * @param content - 뉴스 본문 또는 요약
 * @param tags - 뉴스 태그
 * @param maxResults - 반환할 최대 결과 수
 * @returns 관련 종목 티커 배열
 */
export declare function findRelatedStocks(title?: string, content?: string, tags?: string, maxResults?: number): string[];
/**
 * 티커로 종목명 가져오기
 * @param ticker - 종목 티커
 * @returns 종목명 또는 null
 */
export declare function getStockNameByTicker(ticker: string): string | null;
/**
 * 티커로 키워드 목록 가져오기
 * @param ticker - 종목 티커
 * @returns 키워드 배열
 */
export declare function getKeywordsByTicker(ticker: string): string[];
/**
 * 모든 종목 티커 목록 가져오기
 * @returns 티커 배열
 */
export declare function getAllTickers(): string[];
/**
 * 한국 주식 여부 확인
 * @param ticker - 종목 티커
 * @returns 한국 주식 여부
 */
export declare function isKoreanStock(ticker: string): boolean;
/**
 * 미국 주식 여부 확인
 * @param ticker - 종목 티커
 * @returns 미국 주식 여부
 */
export declare function isUSStock(ticker: string): boolean;
export {};
//# sourceMappingURL=stockMapper.d.ts.map