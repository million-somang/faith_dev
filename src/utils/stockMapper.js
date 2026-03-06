/**
 * 종목 매핑 유틸리티
 * 뉴스와 종목을 연결하기 위한 키워드 매핑 시스템
 */
// 종목 키워드 매핑 테이블
export const STOCK_KEYWORDS = {
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
    // 현대자동차
    '005380.KS': {
        name: '현대차',
        keywords: [
            '현대차', '현대자동차', '현대차그룹',
            '제네시스', '아이오닉', 'Ioniq',
            '자동차', '모빌리티', '수소차'
        ],
        priority: 2
    },
    // 카카오
    '035720.KS': {
        name: '카카오',
        keywords: [
            '카카오', 'Kakao', '카톡', '카카오톡',
            '카카오뱅크', '카카오페이', '카카오모빌리티',
            '플랫폼', 'IT서비스'
        ],
        priority: 2
    },
    // LG화학
    '051910.KS': {
        name: 'LG화학',
        keywords: [
            'LG화학', '엘지화학',
            '석유화학', '첨단소재', '양극재',
            '친환경소재'
        ],
        priority: 2
    },
    // 셀트리온
    '068270.KS': {
        name: '셀트리온',
        keywords: [
            '셀트리온', 'Celltrion',
            '바이오', '시밀러', '바이오시밀러',
            '램시마', '허쥬마', '트룩시마'
        ],
        priority: 2
    },
    // POSCO홀딩스
    '005490.KS': {
        name: 'POSCO홀딩스',
        keywords: [
            '포스코', 'POSCO', '포스코홀딩스',
            '철강', '리튬', '니켈', '철강재'
        ],
        priority: 2
    },
    // KB금융
    '105560.KS': {
        name: 'KB금융',
        keywords: [
            'KB금융', '국민은행', 'KB국민',
            '금융주', '은행주', '금리', '배당'
        ],
        priority: 3
    },
    // 신한지주
    '055550.KS': {
        name: '신한지주',
        keywords: [
            '신한지주', '신한금융', '신한은행',
            '금융그룹', '은행'
        ],
        priority: 3
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
            'Copilot', '코파일럿', 'AI 소프트웨어'
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
            'Metaverse', '메타버스', 'Llama'
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
            'Prime', '프라임', '클라우드'
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
    },
    // 브로드컴
    'AVGO': {
        name: 'Broadcom',
        keywords: [
            '브로드컴', 'Broadcom', 'AVGO',
            '반도체칩', '네트워크칩', 'VMware'
        ],
        priority: 2
    }
};
/**
 * 텍스트에서 관련 종목 찾기 (가중치 적용 버전)
 * @param title - 뉴스 제목
 * @param content - 뉴스 본문 또는 요약
 * @param tags - 뉴스 태그
 * @param maxResults - 반환할 최대 결과 수
 * @returns 관련 종목 티커 배열
 */
export function findRelatedStocks(title = '', content = '', tags = '', maxResults = 3) {
    const normTitle = (title || '').toLowerCase();
    const normContent = (content || '').toLowerCase();
    const normTags = (tags || '').toLowerCase();
    if (!normTitle && !normContent && !normTags)
        return [];
    const matches = [];
    for (const [ticker, info] of Object.entries(STOCK_KEYWORDS)) {
        let score = 0;
        for (const keyword of info.keywords) {
            const k = keyword.toLowerCase();
            // 제목 매칭 (가장 높은 가중치: 10점)
            if (normTitle.includes(k))
                score += 10;
            // 태그 매칭 (중간 가중치: 5점)
            if (normTags.includes(k))
                score += 5;
            // 본문 매칭 (낮은 가중치: 1점)
            if (normContent.includes(k))
                score += 1;
        }
        if (score > 0) {
            matches.push({
                ticker,
                priority: info.priority,
                score
            });
        }
    }
    // 정렬: 1) 점수 높은 순, 2) 우선순위 낮은 순(숫자 작은 것)
    matches.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return a.priority - b.priority;
    });
    return matches.slice(0, maxResults).map(m => m.ticker);
}
/**
 * 티커로 종목명 가져오기
 * @param ticker - 종목 티커
 * @returns 종목명 또는 null
 */
export function getStockNameByTicker(ticker) {
    return STOCK_KEYWORDS[ticker]?.name || null;
}
/**
 * 티커로 키워드 목록 가져오기
 * @param ticker - 종목 티커
 * @returns 키워드 배열
 */
export function getKeywordsByTicker(ticker) {
    return STOCK_KEYWORDS[ticker]?.keywords || [];
}
/**
 * 모든 종목 티커 목록 가져오기
 * @returns 티커 배열
 */
export function getAllTickers() {
    return Object.keys(STOCK_KEYWORDS);
}
/**
 * 한국 주식 여부 확인
 * @param ticker - 종목 티커
 * @returns 한국 주식 여부
 */
export function isKoreanStock(ticker) {
    return ticker.endsWith('.KS') || ticker.endsWith('.KQ');
}
/**
 * 미국 주식 여부 확인
 * @param ticker - 종목 티커
 * @returns 미국 주식 여부
 */
export function isUSStock(ticker) {
    return !ticker.includes('.');
}
