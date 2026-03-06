/**
 * 주식 시세 일괄 조회 유틸리티
 * Yahoo Finance API를 통해 여러 종목의 시세를 한 번에 가져옵니다
 */

import { STOCK_KEYWORDS, getStockNameByTicker } from './stockMapper'

export interface StockData {
  ticker: string
  name: string
  price: number
  change: number
  changePercent: number
  status: 'up' | 'down' | 'flat'
  currency: string
  marketState: string
}

// Mock 주식 데이터 (Yahoo Finance API 대체)
const MOCK_STOCK_PRICES: Record<string, number> = {
  '005930.KS': 72000,  // 삼성전자
  '000660.KS': 125000, // SK하이닉스
  '373220.KS': 420000, // LG에너지솔루션
  '035420.KS': 165000, // 네이버
  'AAPL': 185.50,      // Apple
  'TSLA': 242.80,      // Tesla
  'NVDA': 520.30,      // NVIDIA
  'MSFT': 375.20,      // Microsoft
  'META': 480.50,      // Meta
  'AMZN': 175.80,      // Amazon
  'GOOGL': 145.60,     // Google
}

/**
 * 여러 종목의 시세를 한 번에 조회 (Mock 데이터 사용)
 * @param tickers - 조회할 티커 배열 (예: ['005930.KS', 'AAPL', 'TSLA'])
 * @returns 종목 데이터 배열
 */
export async function fetchBatchStockData(tickers: string[]): Promise<StockData[]> {
  if (!tickers || tickers.length === 0) {
    return []
  }

  // 중복 제거
  const uniqueTickers = Array.from(new Set(tickers))
  
  try {
    return uniqueTickers.map((ticker): StockData => {
      const name = getStockNameByTicker(ticker) || ticker
      const basePrice = MOCK_STOCK_PRICES[ticker] || 50000
      
      // 랜덤한 변동률 생성 (-3% ~ +3%)
      const changePercent = (Math.random() * 6 - 3)
      const change = basePrice * (changePercent / 100)
      const price = basePrice + change
      
      let status: 'up' | 'down' | 'flat' = 'flat'
      if (change > 0) status = 'up'
      else if (change < 0) status = 'down'

      // 한국 주식인지 미국 주식인지 판단
      const isKorean = ticker.includes('.KS') || ticker.includes('.KQ')
      const currency = isKorean ? 'KRW' : 'USD'

      return {
        ticker,
        name,
        price,
        change,
        changePercent,
        status,
        currency,
        marketState: 'REGULAR'
      }
    }).filter((stock: StockData) => stock.ticker) // 빈 티커 제외

  } catch (error) {
    console.error('Batch stock data fetch error:', error)
    return []
  }
}

/**
 * 단일 종목 시세 조회 (레거시 호환)
 * @param ticker - 종목 티커
 * @returns 종목 데이터 또는 null
 */
export async function fetchStockData(ticker: string): Promise<StockData | null> {
  const results = await fetchBatchStockData([ticker])
  return results.length > 0 ? results[0] : null
}
