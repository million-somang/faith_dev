// 카테고리 이름 변환
export function getCategoryName(category) {
    const names = {
        'general': '일반',
        'politics': '정치',
        'economy': '경제',
        'tech': 'IT/과학',
        'sports': '스포츠',
        'entertainment': '엔터',
        'stock': '주식'
    };
    return names[category] || category;
}
// 카테고리 색상 (배지 스타일)
export function getCategoryColor(category) {
    const colors = {
        'general': 'bg-gray-100 text-gray-700',
        'politics': 'bg-blue-100 text-blue-700',
        'economy': 'bg-green-100 text-green-700',
        'tech': 'bg-purple-100 text-purple-700',
        'sports': 'bg-orange-100 text-orange-700',
        'entertainment': 'bg-pink-100 text-pink-700',
        'stock': 'bg-emerald-100 text-emerald-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
}
// 자주 쓰이는 named HTML 엔티티 매핑
const NAMED_ENTITIES = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    hellip: '…', middot: '·', mdash: '—', ndash: '–',
    lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
    copy: '©', reg: '®', trade: '™', deg: '°', times: '×',
};
// HTML 엔티티 디코딩 — 뉴스 제목/본문에 '&#039;' '&quot;' '&amp;' 등이 글자 그대로 노출되는 문제를 차단.
// 10진/16진 숫자(0 패딩 포함)와 named 엔티티를 처리하고, 이중 인코딩(&amp;#039;)도 안정될 때까지 반복 처리한다.
export function decodeHtmlEntities(input) {
    if (!input)
        return input;
    let result = String(input);
    for (let pass = 0; pass < 4; pass++) {
        const next = result.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z][a-zA-Z0-9]*);/g, (match, body) => {
            if (body[0] === '#') {
                const code = body[1] === 'x' || body[1] === 'X'
                    ? parseInt(body.slice(2), 16)
                    : parseInt(body.slice(1), 10);
                if (Number.isFinite(code) && code > 0 && code <= 0x10FFFF) {
                    try {
                        return String.fromCodePoint(code);
                    }
                    catch {
                        return match;
                    }
                }
                return match;
            }
            return Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, body) ? NAMED_ENTITIES[body] : match;
        });
        if (next === result)
            break;
        result = next;
    }
    return result;
}
// 문자열 또는 Date 객체를 타임존 안전 Date로 변환
export function parseDate(dateInput) {
    if (!dateInput) return new Date();
    if (dateInput instanceof Date) return dateInput;

    let str = String(dateInput).trim();
    if (!str) return new Date();

    // 'YYYY-MM-DD HH:mm:ss' (SQLite/PostgreSQL 기본 UTC 타임스탬프 형식) 처리
    if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(str)) {
        str = str.replace(' ', 'T');
        if (!str.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(str)) {
            str += 'Z';
        }
    }

    const parsed = new Date(str);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
}
// 시간 전 표시 (업로드/발행 일시 기준 상대 시간)
export function getTimeAgo(dateString) {
    if (!dateString) return '방금 전';
    const now = new Date();
    const past = parseDate(dateString);
    const diffMs = now.getTime() - past.getTime();

    // 미래 시각 오차(클라이언트-서버 시계 불일치) 방어
    if (diffMs < 0) return '방금 전';

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1)
        return '방금 전';
    if (diffMins < 60)
        return `${diffMins}분 전`;
    if (diffHours < 24)
        return `${diffHours}시간 전`;
    if (diffDays < 7)
        return `${diffDays}일 전`;
    return past.toLocaleDateString('ko-KR');
}

