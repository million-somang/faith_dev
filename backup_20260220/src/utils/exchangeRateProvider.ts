// 환율 데이터 Provider
// Mock 데이터를 사용하여 실시간 환율 정보 제공

export interface ExchangeRate {
  currency: string;
  name: string;
  flag: string;
  rate: number;           // 원화 기준 환율 (1 단위당 KRW)
  change: number;         // 전일 대비 변동금액
  changePercent: number;  // 전일 대비 변동률
  fiftyTwoWeekLow: number;
  fiftyTwoWeekHigh: number;
  lastUpdate: string;
}

// 기준 환율 (2024년 평균 기준)
const BASE_RATES = {
  USD: {
    rate: 1350,  // 1 USD = 1,350 KRW
    name: '미국 달러',
    flag: '🇺🇸'
  },
  JPY: {
    rate: 9.1,   // 1 JPY = 9.1 KRW (주의: 100엔 아님, 1엔 기준)
    name: '일본 엔화',
    flag: '🇯🇵'
  },
  EUR: {
    rate: 1470,  // 1 EUR = 1,470 KRW
    name: '유럽 유로',
    flag: '🇪🇺'
  },
  CNY: {
    rate: 187,   // 1 CNY = 187 KRW
    name: '중국 위안',
    flag: '🇨🇳'
  }
};

/**
 * Mock 환율 데이터 생성
 * -3% ~ +3% 랜덤 변동 적용
 */
export function getMockExchangeRates(): Record<string, ExchangeRate> {
  const rates: Record<string, ExchangeRate> = {};
  
  for (const [currency, baseData] of Object.entries(BASE_RATES)) {
    const variance = (Math.random() - 0.5) * 0.06; // -3% ~ +3%
    const currentRate = baseData.rate * (1 + variance);
    const change = currentRate - baseData.rate;
    const changePercent = (change / baseData.rate) * 100;
    
    rates[currency] = {
      currency,
      name: baseData.name,
      flag: baseData.flag,
      rate: currentRate,
      change,
      changePercent,
      fiftyTwoWeekLow: baseData.rate * 0.92,  // -8%
      fiftyTwoWeekHigh: baseData.rate * 1.08, // +8%
      lastUpdate: new Date().toISOString()
    };
  }
  
  return rates;
}

/**
 * 배치 조회 - 여러 통화의 환율 정보를 한 번에 가져오기
 */
export function getBatchExchangeRates(currencies: string[]): ExchangeRate[] {
  const allRates = getMockExchangeRates();
  return currencies
    .map(curr => allRates[curr])
    .filter(rate => rate !== undefined);
}

/**
 * 단일 통화 조회
 */
export function getExchangeRate(currency: string): ExchangeRate | null {
  const rates = getMockExchangeRates();
  return rates[currency] || null;
}

/**
 * 환전 계산
 * @param from 출발 통화 (예: USD)
 * @param to 도착 통화 (예: KRW)
 * @param amount 금액
 */
export function convertCurrency(from: string, to: string, amount: number): number {
  const rates = getMockExchangeRates();
  
  // KRW는 기준 통화 (1)
  const fromRate = from === 'KRW' ? 1 : rates[from]?.rate || 1;
  const toRate = to === 'KRW' ? 1 : rates[to]?.rate || 1;
  
  // 환전 계산: (금액 × 출발통화환율) ÷ 도착통화환율
  const result = (amount * fromRate) / toRate;
  
  return Math.round(result * 100) / 100;
}

/**
 * 모든 통화 코드 가져오기
 */
export function getAllCurrencyCodes(): string[] {
  return Object.keys(BASE_RATES);
}

/**
 * JPY 특수 처리: 100엔 단위로 변환
 * @param amount 금액 (1엔 기준)
 * @param to100Yen true면 1엔→100엔, false면 100엔→1엔
 */
export function convertJPYUnit(amount: number, to100Yen: boolean = true): number {
  return to100Yen ? amount * 100 : amount / 100;
}
