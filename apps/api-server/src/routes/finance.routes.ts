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

// 주요 지수(KOSPI, KOSDAQ, USD/KRW)
financeRoutes.get('/api/finance/indices', async (c) => {
    const now = Date.now();
    if (indicesCache && (now - indicesCache.timestamp) < CACHE_TTL) {
        return c.json(indicesCache.data);
    }
    
    const symbols = ['^KS11', '^KQ11', 'KRW=X'];
    const quotes = await fetchYahooQuotes(symbols);
    
    const nameMap: Record<string, string> = {
        '^KS11': 'KOSPI',
        '^KQ11': 'KOSDAQ',
        'KRW=X': 'USD/KRW',
    };
    
    const indices = quotes.map(q => {
        const change = q.price - q.previousClose;
        const rate = q.previousClose ? (change / q.previousClose) * 100 : 0;
        return {
            name: nameMap[q.symbol] || q.name,
            value: Math.round(q.price * 100) / 100,
            change: Math.round(change * 100) / 100,
            rate: Math.round(rate * 100) / 100,
            status: change >= 0 ? 'up' : 'down',
            updatedAt: formatMarketTime(q.regularMarketTime, q.timezone),
        };
    });
    
    if (indices.length > 0) {
        indicesCache = { data: indices, timestamp: now };
    }
    
    return c.json(indices);
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

// 국내 대표 기업 + 미국 빅테크 (미니 차트 포함)
async function fetchStockCards(symbols: string[], nameMap: Record<string, string>, tickerMap: Record<string, string>, currencySymbol: string) {
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
                currency: currencySymbol,
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
