

// 카테고리 이름 변환
export function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    'general': '일반',
    'fun': '재미있는 뉴스',
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
    'fun': 'bg-amber-100 text-amber-800 border border-amber-200',
    'politics': 'bg-blue-100 text-blue-700',
    'economy': 'bg-green-100 text-green-700',
    'tech': 'bg-purple-100 text-purple-700',
    'sports': 'bg-orange-100 text-orange-700',
    'entertainment': 'bg-pink-100 text-pink-700',
    'stock': 'bg-emerald-100 text-emerald-700'
  }
  return colors[category] || 'bg-gray-100 text-gray-700'
}

// 문자열 또는 Date 객체를 타임존 안전 Date로 변환
export function parseDate(dateInput?: string | Date | null): Date {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;

  let str = String(dateInput).trim();
  if (!str) return new Date();

  // 'YYYY-MM-DD HH:mm:ss' (SQLite/PostgreSQL 기본 UTC 타임스탬프 형식) 처리
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(str)) {
    str = str.replace(' ', 'T');
    // 끝에 Z나 타임존 오프셋(+/-00:00)이 없으면 UTC(Z)로 해석
    if (!str.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(str)) {
      str += 'Z';
    }
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

// 시간 전 표시 (업로드/발행 일시 기준 상대 시간)
export function getTimeAgo(dateString?: string | Date | null): string {
  if (!dateString) return '방금 전';
  const now = new Date();
  const past = parseDate(dateString);
  const diffMs = now.getTime() - past.getTime();

  // 미래 시각 오차(클라이언트-서버 시계 불일치) 방어
  if (diffMs < 0) return '방금 전';

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return past.toLocaleDateString('ko-KR');
}

