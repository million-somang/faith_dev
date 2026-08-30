import { Hono } from 'hono';

const financeRoutes = new Hono();

// Yahoo Finance 비공식 API로 시세 데이터 가져오기
async function fetchYahooQuotes(symbols: string[]): Promise<any[]> {
    const results: any[] = [];
    
    for (const symbol of symbols) {
        try {
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            if (!res.ok) continue;
            
            const data = await res.json();
            const meta = data?.chart?.result?.[0]?.meta;
            if (meta) {
                results.push({
                    symbol: symbol,
                    name: meta.shortName || meta.symbol,
                    price: meta.regularMarketPrice,
                    previousClose: meta.previousClose || meta.chartPreviousClose,
                    currency: meta.currency,
                    exchangeName: meta.exchangeName,
                    regularMarketTime: meta.regularMarketTime,
                    timezone: meta.timezone,
                });
            }
        } catch (e) {
            console.error(`Failed to fetch ${symbol}:`, e);
        }
    }
    
    return results;
}

// 차트 데이터 가져오기 (1개월)
async function fetchYahooChart(symbol: string, range = '1mo'): Promise<any> {
    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=${range}`;
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (!res.ok) return null;
        
        const data = await res.json();
        const result = data?.chart?.result?.[0];
        if (!result) return null;
        
        const timestamps = result.timestamp || [];
        const closes = result.indicators?.quote?.[0]?.close || [];
        
        return {
            symbol,
            data: timestamps.map((ts: number, i: number) => ({
                date: new Date(ts * 1000).toISOString().split('T')[0],
                price: closes[i] ? Math.round(closes[i] * 100) / 100 : null,
            })).filter((d: any) => d.price !== null),
        };
    } catch (e) {
        console.error(`Failed to fetch chart for ${symbol}:`, e);
        return null;
    }
}

// 캐시 (5분)
let indicesCache: { data: any; timestamp: number } | null = null;
let stocksCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5분

// 시간 포맷 유틸
function formatMarketTime(epochSec?: number, tz?: string): string {
    if (!epochSec) return '';
    const d = new Date(epochSec * 1000);
    // KST로 표시 (UTC+9)
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const mm = String(kst.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(kst.getUTCDate()).padStart(2, '0');
    const hh = String(kst.getUTCHours()).padStart(2, '0');
    const mi = String(kst.getUTCMinutes()).padStart(2, '0');
    return `${mm}.${dd} ${hh}:${mi}`;
}

// 국가별 주식 지수 설정
interface CountryIndexConfig {
    symbol: string;
    name: string;
    country: 'us' | 'cn' | 'jp' | 'fr' | 'kr';
    currency: string;
    flag: string;
    description: string;
}

const COUNTRY_INDICES: CountryIndexConfig[] = [
    // 미국 (US)
    { symbol: '^DJI', name: '다우 존스', country: 'us', currency: '$', flag: '🇺🇸', description: '다우존스 30 산업평균지수' },
    { symbol: '^GSPC', name: 'S&P 500', country: 'us', currency: '$', flag: '🇺🇸', description: '미국 대형주 500개 지수' },
    { symbol: '^IXIC', name: '나스닥 종합', country: 'us', currency: '$', flag: '🇺🇸', description: '미국 기술주 중심 지수' },
    { symbol: '^SOX', name: '필라델피아 반도체', country: 'us', currency: '$', flag: '🇺🇸', description: '글로벌 반도체 대표 지수' },

    // 중국 (CN)
    { symbol: '000001.SS', name: '상해 종합', country: 'cn', currency: '¥', flag: '🇨🇳', description: '상하이 증권거래소 종합' },
    { symbol: '^HSI', name: '홍콩 항셍', country: 'cn', currency: 'HK$', flag: '🇭🇰', description: '홍콩 증시 대표 우량주' },
    { symbol: '399001.SZ', name: '심천 종합', country: 'cn', currency: '¥', flag: '🇨🇳', description: '선전 증권거래소 성분지수' },

    // 일본 (JP)
    { symbol: '^N225', name: '닛케이 225', country: 'jp', currency: '¥', flag: '🇯🇵', description: '도쿄 증시 대표 225개 종목' },

    // 프랑스 (FR)
    { symbol: '^FCHI', name: '프랑스 CAC 40', country: 'fr', currency: '€', flag: '🇫🇷', description: '파리 증권거래소 40개 우량주' },
    { symbol: '^STOXX50E', name: '유로 스톡스 50', country: 'fr', currency: '€', flag: '🇪🇺', description: '유로존 50대 블루칩 지수' },

    // 한국 (KR)
    { symbol: '^KS11', name: 'KOSPI', country: 'kr', currency: '₩', flag: '🇰🇷', description: '한국 유가증권시장 종합' },
    { symbol: '^KQ11', name: 'KOSDAQ', country: 'kr', currency: '₩', flag: '🇰🇷', description: '한국 코스닥 시장' },
    { symbol: 'KRW=X', name: 'USD/KRW', country: 'kr', currency: '₩', flag: '🇰🇷', description: '원/달러 환율' },
];

// 주요 지수(국가별 탭 지원: us, cn, jp, fr, kr, all)
financeRoutes.get('/api/finance/indices', async (c) => {
    const now = Date.now();
    const countryParam = c.req.query('country')?.toLowerCase();

    let allIndices = indicesCache ? indicesCache.data : null;

    if (!allIndices || (now - (indicesCache?.timestamp || 0)) >= CACHE_TTL) {
        const symbols = COUNTRY_INDICES.map(i => i.symbol);
        const quotes = await fetchYahooQuotes(symbols);
        const quoteMap = new Map(quotes.map(q => [q.symbol, q]));

        allIndices = COUNTRY_INDICES.map(cfg => {
            const q = quoteMap.get(cfg.symbol);
            if (q && q.price) {
                const change = q.price - q.previousClose;
                const rate = q.previousClose ? (change / q.previousClose) * 100 : 0;
                return {
                    symbol: cfg.symbol,
                    name: cfg.name,
                    country: cfg.country,
                    currency: cfg.currency,
                    flag: cfg.flag,
                    description: cfg.description,
                    value: Math.round(q.price * 100) / 100,
                    change: Math.round(change * 100) / 100,
                    rate: Math.round(rate * 100) / 100,
                    status: change >= 0 ? 'up' : 'down',
                    updatedAt: formatMarketTime(q.regularMarketTime, q.timezone),
                };
            }
            // fallback if not fetched
            return {
                symbol: cfg.symbol,
                name: cfg.name,
                country: cfg.country,
                currency: cfg.currency,
                flag: cfg.flag,
                description: cfg.description,
                value: 0,
                change: 0,
                rate: 0,
                status: 'up',
                updatedAt: '',
            };
        }).filter(item => item.value > 0);

        if (allIndices.length > 0) {
            indicesCache = { data: allIndices, timestamp: now };
        }
    }

    if (countryParam && countryParam !== 'all') {
        const filtered = (allIndices || []).filter((idx: any) => idx.country === countryParam);
        return c.json(filtered);
    }

    return c.json(allIndices || []);
});

// 거시 경제 지표 (달러/원, 비트코인, 금선물, WTI유가)
let macroCache: { data: any; timestamp: number } | null = null;

financeRoutes.get('/api/finance/macro', async (c) => {
    const now = Date.now();
    if (macroCache && (now - macroCache.timestamp) < CACHE_TTL) {
        return c.json(macroCache.data);
    }
    
    // KRW=X(달러/원), BTC-KRW(비트코인), GC=F(금선물), CL=F(WTI유가)
    const symbols = ['KRW=X', 'BTC-KRW', 'GC=F', 'CL=F'];
    const quotes = await fetchYahooQuotes(symbols);
    
    const config: Record<string, { name: string; icon: string; currency: string }> = {
        'KRW=X': { name: '달러/원', icon: '💵', currency: '₩' },
        'BTC-KRW': { name: '비트코인', icon: '₿', currency: '₩' },
        'GC=F': { name: '금 선물', icon: '🥇', currency: '$' },
        'CL=F': { name: 'WTI 유가', icon: '🛢️', currency: '$' },
    };
    
    const macro = quotes.map(q => {
        const change = q.price - q.previousClose;
        const rate = q.previousClose ? (change / q.previousClose) * 100 : 0;
        const cfg = config[q.symbol] || { name: q.name, icon: '📊', currency: '$' };
        return {
            symbol: q.symbol,
            name: cfg.name,
            icon: cfg.icon,
            price: Math.round(q.price * 100) / 100,
            change: Math.round(change * 100) / 100,
            rate: Math.round(rate * 100) / 100,
            status: change >= 0 ? 'up' : 'down',
            currency: cfg.currency,
            updatedAt: formatMarketTime(q.regularMarketTime, q.timezone),
        };
    });
    
    if (macro.length > 0) macroCache = { data: macro, timestamp: now };
    return c.json(macro);
});

// 주요 통화 환율 (원화 기준)
let exchangeCache: { data: any; timestamp: number } | null = null;

financeRoutes.get('/api/finance/exchange', async (c) => {
    const now = Date.now();
    if (exchangeCache && (now - exchangeCache.timestamp) < CACHE_TTL) {
        return c.json(exchangeCache.data);
    }

    // KRW=X = USD/KRW, 나머지는 <통화>KRW=X. JPY는 관례상 100엔 기준 표시(unit=100).
    const symbols = ['KRW=X', 'EURKRW=X', 'JPYKRW=X', 'CNYKRW=X', 'GBPKRW=X', 'AUDKRW=X'];
    const config: Record<string, { code: string; name: string; flag: string; unit: number }> = {
        'KRW=X': { code: 'USD', name: '미국 달러', flag: '🇺🇸', unit: 1 },
        'EURKRW=X': { code: 'EUR', name: '유로', flag: '🇪🇺', unit: 1 },
        'JPYKRW=X': { code: 'JPY', name: '일본 엔(100)', flag: '🇯🇵', unit: 100 },
        'CNYKRW=X': { code: 'CNY', name: '중국 위안', flag: '🇨🇳', unit: 1 },
        'GBPKRW=X': { code: 'GBP', name: '영국 파운드', flag: '🇬🇧', unit: 1 },
        'AUDKRW=X': { code: 'AUD', name: '호주 달러', flag: '🇦🇺', unit: 1 },
    };

    const quotes = await fetchYahooQuotes(symbols);
    const rates = quotes.map(q => {
        const cfg = config[q.symbol] || { code: q.symbol, name: q.name, flag: '🏳️', unit: 1 };
        const unit = cfg.unit;
        const change = q.price - q.previousClose;
        const rate = q.previousClose ? (change / q.previousClose) * 100 : 0;
        return {
            code: cfg.code,
            name: cfg.name,
            flag: cfg.flag,
            unit,
            price: Math.round(q.price * unit * 100) / 100,  // unit당 원화 가격
            change: Math.round(change * unit * 100) / 100,
            rate: Math.round(rate * 100) / 100,
            status: change >= 0 ? 'up' : 'down',
            updatedAt: formatMarketTime(q.regularMarketTime, q.timezone),
        };
    });

    if (rates.length > 0) exchangeCache = { data: rates, timestamp: now };
    return c.json(rates);
});

// Yahoo 통화 코드 → 표시용 기호
function currencyFromCode(code?: string): string {
    switch (code) {
        case 'KRW': return '₩';
        case 'USD': return '$';
        case 'JPY': return '¥';
        case 'EUR': return '€';
        case 'GBP': return '£';
        default: return '';
    }
}

// 국내 대표 기업 + 미국 빅테크 (미니 차트 포함)
// currencySymbol 미지정 시 Yahoo meta.currency로 종목별 자동 판별(관심종목 등 혼합 목록용)
async function fetchStockCards(symbols: string[], nameMap: Record<string, string>, tickerMap: Record<string, string>, currencySymbol?: string) {
    const results: any[] = [];
    
    for (const symbol of symbols) {
        try {
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo`;
            const res = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
            });
            
            if (!res.ok) continue;
            
            const data = await res.json();
            const result = data?.chart?.result?.[0];
            if (!result) continue;
            
            const meta = result.meta;
            const timestamps = result.timestamp || [];
            const closes = result.indicators?.quote?.[0]?.close || [];
            
            const price = meta.regularMarketPrice;
            const previousClose = meta.previousClose || meta.chartPreviousClose;
            const change = price - previousClose;
            const rate = previousClose ? (change / previousClose) * 100 : 0;
            
            // 미니 차트 데이터 (최근 20일)
            const sparkline = timestamps.slice(-20).map((ts: number, i: number) => {
                const idx = timestamps.length - 20 + i;
                return closes[idx] ? Math.round(closes[idx] * 100) / 100 : null;
            }).filter((v: any) => v !== null);
            
            results.push({
                ticker: tickerMap[symbol] || symbol,
                name: nameMap[symbol] || meta.shortName || symbol,
                price: Math.round(price * 100) / 100,
                change: Math.round(change * 100) / 100,
                rate: Math.round(rate * 100) / 100,
                status: change >= 0 ? 'up' : 'down',
                currency: currencySymbol ?? currencyFromCode(meta.currency),
                sparkline,
            });
        } catch (e) {
            console.error(`Failed to fetch ${symbol}:`, e);
        }
    }
    
    return results;
}

// 캐시
let krStocksCache: { data: any; timestamp: number } | null = null;
let usStocksCache: { data: any; timestamp: number } | null = null;

// 국내 대표기업
financeRoutes.get('/api/finance/kr-stocks', async (c) => {
    const now = Date.now();
    if (krStocksCache && (now - krStocksCache.timestamp) < CACHE_TTL) {
        return c.json(krStocksCache.data);
    }
    
    const symbols = ['005930.KS', '000660.KS', '373220.KS', '035420.KS'];
    const nameMap: Record<string, string> = {
        '005930.KS': '삼성전자', '000660.KS': 'SK하이닉스',
        '373220.KS': 'LG에너지솔루션', '035420.KS': 'NAVER',
    };
    const tickerMap: Record<string, string> = {
        '005930.KS': '005930', '000660.KS': '000660',
        '373220.KS': '373220', '035420.KS': '035420',
    };
    
    const stocks = await fetchStockCards(symbols, nameMap, tickerMap, '₩');
    if (stocks.length > 0) krStocksCache = { data: stocks, timestamp: now };
    return c.json(stocks);
});

// 미국 빅테크 4대장
financeRoutes.get('/api/finance/us-stocks', async (c) => {
    const now = Date.now();
    if (usStocksCache && (now - usStocksCache.timestamp) < CACHE_TTL) {
        return c.json(usStocksCache.data);
    }
    
    const symbols = ['AAPL', 'TSLA', 'NVDA', 'MSFT'];
    const nameMap: Record<string, string> = {
        'AAPL': '애플', 'TSLA': '테슬라',
        'NVDA': '엔비디아', 'MSFT': '마이크로소프트',
    };
    
    const stocks = await fetchStockCards(symbols, nameMap, symbols.reduce((a, s) => ({ ...a, [s]: s }), {} as Record<string, string>), '$');
    if (stocks.length > 0) usStocksCache = { data: stocks, timestamp: now };
    return c.json(stocks);
});

// 임의 다종목 카드 일괄 조회 (관심종목 등) — symbols=AAPL,005930,TSLA
financeRoutes.get('/api/finance/stocks', async (c) => {
    const raw = c.req.query('symbols') || '';
    const tickers = raw.split(',').map(s => s.trim()).filter(Boolean).slice(0, 30);
    if (tickers.length === 0) return c.json([]);

    // 숫자 코드는 한국 종목으로 보고 .KS 접미사 부여
    const symbols = tickers.map(t => /^\d+$/.test(t) ? `${t}.KS` : t.toUpperCase());
    const tickerMap: Record<string, string> = {};
    symbols.forEach((s, i) => { tickerMap[s] = tickers[i].toUpperCase(); });

    // currency 미지정 → 종목별 자동 판별, 이름은 Yahoo shortName 사용
    const stocks = await fetchStockCards(symbols, {}, tickerMap);
    return c.json(stocks);
});

// 인기 종목 Top5 (기존 호환)
financeRoutes.get('/api/finance/popular', async (c) => {
    const now = Date.now();
    if (stocksCache && (now - stocksCache.timestamp) < CACHE_TTL) {
        return c.json(stocksCache.data);
    }
    
    const symbols = ['005930.KS', 'NVDA', 'TSLA', '000660.KS', 'AAPL'];
    const nameMap: Record<string, string> = {
        '005930.KS': '삼성전자', 'NVDA': 'NVIDIA', 'TSLA': '테슬라',
        '000660.KS': 'SK하이닉스', 'AAPL': '애플',
    };
    const tickerMap: Record<string, string> = {
        '005930.KS': '005930', 'NVDA': 'NVDA', 'TSLA': 'TSLA',
        '000660.KS': '000660', 'AAPL': 'AAPL',
    };
    
    const quotes = await fetchYahooQuotes(symbols);
    const stocks = quotes.map((q, i) => {
        const change = q.price - q.previousClose;
        const rate = q.previousClose ? (change / q.previousClose) * 100 : 0;
        return {
            rank: i + 1,
            ticker: tickerMap[q.symbol] || q.symbol,
            name: nameMap[q.symbol] || q.name,
            price: Math.round(q.price * 100) / 100,
            change: Math.round(change * 100) / 100,
            rate: Math.round(rate * 100) / 100,
            status: change >= 0 ? 'up' : 'down',
        };
    });
    
    if (stocks.length > 0) stocksCache = { data: stocks, timestamp: now };
    return c.json(stocks);
});

// 개별 종목 차트 데이터
financeRoutes.get('/api/finance/chart/:symbol', async (c) => {
    const symbol = c.req.param('symbol');
    const range = (c.req.query('range') || '1mo') as string;
    
    // 한국 종목은 .KS 접미사 추가
    const yahooSymbol = /^\d+$/.test(symbol) ? `${symbol}.KS` : symbol;
    
    const chart = await fetchYahooChart(yahooSymbol, range);
    
    if (!chart) {
        return c.json({ error: 'Failed to fetch chart data' }, 500);
    }
    
    return c.json(chart);
});

// 개별 종목 시세
financeRoutes.get('/api/finance/quote/:symbol', async (c) => {
    const symbol = c.req.param('symbol');
    const yahooSymbol = /^\d+$/.test(symbol) ? `${symbol}.KS` : symbol;
    
    const quotes = await fetchYahooQuotes([yahooSymbol]);
    
    if (quotes.length === 0) {
        return c.json({ error: 'Failed to fetch quote' }, 500);
    }
    
    const q = quotes[0];
    const change = q.price - q.previousClose;
    const rate = q.previousClose ? (change / q.previousClose) * 100 : 0;
    
    return c.json({
        ticker: symbol,
        name: q.name,
        price: Math.round(q.price * 100) / 100,
        change: Math.round(change * 100) / 100,
        rate: Math.round(rate * 100) / 100,
        status: change >= 0 ? 'up' : 'down',
        previousClose: q.previousClose,
        currency: q.currency,
        exchangeName: q.exchangeName,
    });
});

export { financeRoutes };
