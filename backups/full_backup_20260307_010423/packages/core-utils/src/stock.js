export const STOCK_KEYWORDS = {
    '005930.KS': {
        name: '삼성전자',
        keywords: ['삼성전자', '삼성', '갤럭시', '반도체', '파운드리', '스마트폰'],
        priority: 1
    },
    '000660.KS': {
        name: 'SK하이닉스',
        keywords: ['SK하이닉스', '하이닉스', 'HBM', 'DRAM', '메모리'],
        priority: 1
    },
    '373220.KS': {
        name: 'LG에너지솔루션',
        keywords: ['LG에너지솔루션', 'LG에너지', '배터리', '이차전지'],
        priority: 1
    },
    'NVDA': {
        name: 'NVIDIA',
        keywords: ['엔비디아', 'Nvidia', 'GPU', 'AI칩', 'H100'],
        priority: 1
    },
    'TSLA': {
        name: 'Tesla',
        keywords: ['테슬라', 'Tesla', '일론머스크', '전기차', 'EV'],
        priority: 1
    },
    'AAPL': {
        name: 'Apple',
        keywords: ['애플', 'Apple', '아이폰', 'iPhone'],
        priority: 1
    }
};
export function findRelatedStocks(title = '', content = '', tags = '', maxResults = 3) {
    const normTitle = (title || '').toLowerCase();
    const normContent = (content || '').toLowerCase();
    const normTags = (tags || '').toLowerCase();
    const matches = [];
    for (const [ticker, info] of Object.entries(STOCK_KEYWORDS)) {
        let score = 0;
        for (const keyword of info.keywords) {
            const k = keyword.toLowerCase();
            if (normTitle.includes(k))
                score += 10;
            if (normTags.includes(k))
                score += 5;
            if (normContent.includes(k))
                score += 1;
        }
        if (score > 0) {
            matches.push({ ticker, priority: info.priority, score });
        }
    }
    matches.sort((a, b) => b.score !== a.score ? b.score - a.score : a.priority - b.priority);
    return matches.slice(0, maxResults).map(m => m.ticker);
}
export function getStockNameByTicker(ticker) {
    return STOCK_KEYWORDS[ticker]?.name || ticker;
}
export function getKeywordsByTicker(ticker) {
    return STOCK_KEYWORDS[ticker]?.keywords || [];
}
