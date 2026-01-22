// 주식 뉴스 필터링 유틸리티
import { findRelatedStocks } from './stockMapper'

// Signal Words: 제목에 이 단어가 하나라도 있어야 주식 뉴스로 인정
export const SIGNAL_WORDS = [
  '특징주', '급등', '급락', '상한가', '하한가',
  '공시', '실적', '잠정실적', '어닝', '목표가',
  '투자의견', '매수', '매도', 'IPO', '상장',
  '주가', '배당', '체결', '신고가', '신저가',
  '수급', '외인', '기관', '개인', '순매수',
  '호재', '악재', '반등', '반락', '조정',
  '증시', '코스피', '코스닥', '나스닥', 'S&P500'
]

// Exclude Words: 이 단어가 있으면 무조건 제외
export const EXCLUDE_WORDS = [
  '부고', '인사', '동정', '포토', '화보', '부음',
  '날씨', '운세', '별자리', '독자투고', '알림',
  '모집', '채용', '구인'
]

/**
 * 뉴스 제목이 주식 뉴스인지 판별
 * @param title 뉴스 제목
 * @returns true: 주식 뉴스, false: 일반 뉴스
 */
export function isStockNews(title: string): boolean {
  // 1. Exclude Words 체크 (우선순위)
  const hasExcludeWord = EXCLUDE_WORDS.some(word => title.includes(word))
  if (hasExcludeWord) {
    return false
  }
  
  // 2. Signal Words 체크
  const hasSignalWord = SIGNAL_WORDS.some(word => title.includes(word))
  return hasSignalWord
}

/**
 * 뉴스에서 관련 종목 추출
 * @param title 뉴스 제목
 * @param summary 뉴스 요약
 * @returns 관련 종목 티커 배열
 */
export function extractRelatedTickers(title: string, summary: string = ''): string[] {
  const text = title + ' ' + summary
  return findRelatedStocks(text, 5) // 최대 5개
}

/**
 * 제목에서 키워드 추출 (태그용)
 * @param title 뉴스 제목
 * @returns 키워드 배열
 */
export function extractKeywords(title: string): string[] {
  const keywords: string[] = []
  
  // Signal Words 중 제목에 포함된 것만 추출
  SIGNAL_WORDS.forEach(word => {
    if (title.includes(word)) {
      keywords.push(word)
    }
  })
  
  return keywords
}

/**
 * 뉴스 감성 분석 (간단 버전)
 * @param title 뉴스 제목
 * @returns 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
 */
export function analyzeSentiment(title: string): 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' {
  const positiveWords = ['급등', '상한가', '호재', '신고가', '반등', '급상승', '최고', '증가', '성장']
  const negativeWords = ['급락', '하한가', '악재', '신저가', '반락', '급하락', '최저', '감소', '하락']
  
  const hasPositive = positiveWords.some(word => title.includes(word))
  const hasNegative = negativeWords.some(word => title.includes(word))
  
  if (hasPositive && !hasNegative) return 'POSITIVE'
  if (hasNegative && !hasPositive) return 'NEGATIVE'
  return 'NEUTRAL'
}
