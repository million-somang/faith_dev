/**
 * 종목 매핑 유틸리티
 * 뉴스와 종목을 연결하기 위한 키워드 매핑 시스템
 */

interface StockInfo {
  name: string
  keywords: string[]
  priority: number // 숫자가 낮을수록 높은 우선순위
}

// 종목 키워드 매핑 테이블
export const STOCK_KEYWORDS: Record<string, StockInfo> = {
  // ==================== 한국 주식 ====================
  
  // 삼성전자 (최우선)
  '005930.KS': {
    name: '삼성전자',
    keywords: [
      '삼성전자', '삼성', 
      '갤럭시', 'Galaxy', 
      '반도체', '파운드리',
      '스마트폰', '모바일',
      'SAMSUNG', 'Samsung'
    ],
    priority: 1
  },
  
  // SK하이닉스
  '000660.KS': {
    name: 'SK하이닉스',
    keywords: [
      'SK하이닉스', '하이닉스', 'SK Hynix',
      'HBM', 'HBM3E',
      'DRAM', '메모리반도체', '메모리',
      'D램'
    ],
    priority: 1
  },
  
  // LG에너지솔루션
  '373220.KS': {
    name: 'LG에너지솔루션',
    keywords: [
      'LG에너지솔루션', 'LG에너지', 'LGES',
      '배터리', '전기차배터리',
      '이차전지', '리튬이온',
      'LG Energy'
    ],
    priority: 1
  },
  
  // 네이버
  '035420.KS': {
    name: 'NAVER',
    keywords: [
      '네이버', 'NAVER', 'Naver',
      '라인', 'LINE', 'Line',
      '검색엔진', '포털',
      '하이퍼클로바', 'HyperCLOVA'
    ],
    priority: 1
  },
  
  // 삼성생명 (낮은 우선순위 - 오매칭 방지)
  '032830.KS': {
    name: '삼성생명',
    keywords: ['삼성생명', '보험'],
    priority: 10
  },
  
  // 삼성화재 (낮은 우선순위)
  '000810.KS': {
    name: '삼성화재',
    keywords: ['삼성화재', '손해보험'],
    priority: 10
  },
  
  // ==================== 미국 주식 ====================
  
  // 애플
  'AAPL': {
    name: 'Apple',
    keywords: [
      '애플', 'Apple', 'AAPL',
      '아이폰', 'iPhone',
      '맥북', 'MacBook', 'Mac',
      'iOS', 'iPad', 'AirPods',
      '팀쿡', 'Tim Cook'
    ],
    priority: 1
  },
  
  // 테슬라
  'TSLA': {
    name: 'Tesla',
    keywords: [
      '테슬라', 'Tesla', 'TSLA',
      '일론머스크', '일론 머스크', 'Elon Musk', '머스크',
      '전기차', 'EV', '전기자동차',
      'FSD', '자율주행', '완전자율주행',
      'Model 3', 'Model Y', 'Model S', 'Model X'
    ],
    priority: 1
  },
  
  // 엔비디아
  'NVDA': {
    name: 'NVIDIA',
    keywords: [
      '엔비디아', 'Nvidia', 'NVIDIA', 'NVDA',
      'GPU', '그래픽카드',
      'AI칩', 'AI 칩', 'AI가속기',
      '젠슨황', '젠슨 황', 'Jensen Huang',
      'H100', 'H200', 'B200', 'Blackwell',
      'CUDA'
    ],
    priority: 1
  },
  
  // 마이크로소프트
  'MSFT': {
    name: 'Microsoft',
    keywords: [
      '마이크로소프트', 'Microsoft', 'MSFT',
      '윈도우', 'Windows',
      'Azure', '애저',
      'Office', '오피스',
      '사티아 나델라', 'Satya Nadella', '나델라',
      'Copilot', '코파일럿'
    ],
    priority: 1
  },
  
  // 메타
  'META': {
    name: 'Meta',
    keywords: [
      '메타', 'Meta', 'META',
      '페이스북', 'Facebook',
      '인스타그램', 'Instagram',
      '왓츠앱', 'WhatsApp',
      '저커버그', 'Zuckerberg',
      'Metaverse', '메타버스'
    ],
    priority: 1
  },
  
  // 아마존
  'AMZN': {
    name: 'Amazon',
    keywords: [
      '아마존', 'Amazon', 'AMZN',
      'AWS', '아마존웹서비스',
      '제프 베조스', 'Jeff Bezos',
      'Prime', '프라임'
    ],
    priority: 1
  },
  
  // 구글 (알파벳)
  'GOOGL': {
    name: 'Google',
    keywords: [
      '구글', 'Google', 'GOOGL',
      '알파벳', 'Alphabet',
      'YouTube', '유튜브',
      'Android', '안드로이드',
      'Chrome', '크롬',
      'Gemini', '제미나이',
      '순다르 피차이', 'Sundar Pichai'
    ],
    priority: 1
  }
}

/**
 * 텍스트에서 관련 종목 찾기
 * @param text - 검색할 텍스트 (제목, 본문, 태그 결합)
 * @param maxResults - 반환할 최대 결과 수
 * @returns 관련 종목 티커 배열
 */
export function findRelatedStocks(text: string, maxResults: number = 2): string[] {
  if (!text || text.trim() === '') {
    return []
  }
  
  const normalizedText = text.toLowerCase()
  
  // 매칭 결과를 우선순위와 함께 저장
  const matches: Array<{ 
    ticker: string
    priority: number
    matchCount: number 
  }> = []
  
  for (const [ticker, info] of Object.entries(STOCK_KEYWORDS)) {
    let matchCount = 0
    
    for (const keyword of info.keywords) {
      const normalizedKeyword = keyword.toLowerCase()
      if (normalizedText.includes(normalizedKeyword)) {
        matchCount++
      }
    }
    
    if (matchCount > 0) {
      matches.push({
        ticker,
        priority: info.priority,
        matchCount
      })
    }
  }
  
  // 정렬: 1) 우선순위 낮은 것(숫자 작은 것) 우선, 2) 매칭 횟수 많은 것 우선
  matches.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority
    }
    return b.matchCount - a.matchCount
  })
  
  return matches.slice(0, maxResults).map(m => m.ticker)
}

/**
 * 티커로 종목명 가져오기
 * @param ticker - 종목 티커
 * @returns 종목명 또는 null
 */
export function getStockNameByTicker(ticker: string): string | null {
  return STOCK_KEYWORDS[ticker]?.name || null
}

/**
 * 티커로 키워드 목록 가져오기
 * @param ticker - 종목 티커
 * @returns 키워드 배열
 */
export function getKeywordsByTicker(ticker: string): string[] {
  return STOCK_KEYWORDS[ticker]?.keywords || []
}

/**
 * 모든 종목 티커 목록 가져오기
 * @returns 티커 배열
 */
export function getAllTickers(): string[] {
  return Object.keys(STOCK_KEYWORDS)
}

/**
 * 한국 주식 여부 확인
 * @param ticker - 종목 티커
 * @returns 한국 주식 여부
 */
export function isKoreanStock(ticker: string): boolean {
  return ticker.endsWith('.KS') || ticker.endsWith('.KQ')
}

/**
 * 미국 주식 여부 확인
 * @param ticker - 종목 티커
 * @returns 미국 주식 여부
 */
export function isUSStock(ticker: string): boolean {
  return !ticker.includes('.')
}
