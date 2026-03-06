export interface ExchangeRate {
    currency: string;
    name: string;
    flag: string;
    rate: number;
    change: number;
    changePercent: number;
    fiftyTwoWeekLow: number;
    fiftyTwoWeekHigh: number;
    lastUpdate: string;
}
/**
 * Mock 환율 데이터 생성
 * -3% ~ +3% 랜덤 변동 적용
 */
export declare function getMockExchangeRates(): Record<string, ExchangeRate>;
/**
 * 배치 조회 - 여러 통화의 환율 정보를 한 번에 가져오기
 */
export declare function getBatchExchangeRates(currencies: string[]): ExchangeRate[];
/**
 * 단일 통화 조회
 */
export declare function getExchangeRate(currency: string): ExchangeRate | null;
/**
 * 환전 계산
 * @param from 출발 통화 (예: USD)
 * @param to 도착 통화 (예: KRW)
 * @param amount 금액
 */
export declare function convertCurrency(from: string, to: string, amount: number): number;
/**
 * 모든 통화 코드 가져오기
 */
export declare function getAllCurrencyCodes(): string[];
/**
 * JPY 특수 처리: 100엔 단위로 변환
 * @param amount 금액 (1엔 기준)
 * @param to100Yen true면 1엔→100엔, false면 100엔→1엔
 */
export declare function convertJPYUnit(amount: number, to100Yen?: boolean): number;
//# sourceMappingURL=exchangeRateProvider.d.ts.map