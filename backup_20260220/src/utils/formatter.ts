import type { NewsCategory } from '../types'

// 카테고리 이름 변환
export function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    'general': '일반',
    'politics': '정치',
    'economy': '경제',
    'tech': 'IT/과학',
    'sports': '스포츠',
    'entertainment': '엔터',
    'stock': '주식'
  }
  return names[category] || category
}

// 카테고리 색상 (배지 스타일)
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'general': 'bg-gray-100 text-gray-700',
    'politics': 'bg-blue-100 text-blue-700',
    'economy': 'bg-green-100 text-green-700',
    'tech': 'bg-purple-100 text-purple-700',
    'sports': 'bg-orange-100 text-orange-700',
    'entertainment': 'bg-pink-100 text-pink-700',
    'stock': 'bg-emerald-100 text-emerald-700'
  }
  return colors[category] || 'bg-gray-100 text-gray-700'
}

// 시간 전 표시
export function getTimeAgo(dateString: string): string {
  const now = new Date()
  const past = new Date(dateString)
  const diffMs = now.getTime() - past.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return '방금 전'
  if (diffMins < 60) return `${diffMins}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  if (diffDays < 7) return `${diffDays}일 전`
  return past.toLocaleDateString('ko-KR')
}
