import { Hono } from 'hono';

const financeRoutes = new Hono();

// Yahoo Finance 비공식 API로 시세 데이터 병렬 가져오기
async function fetchYahooQuotes(symbols: string[]): Promise<any[]> {
    const promises = symbols.map(async (symbol) => {
        try {
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            
            if (!res.ok) return null;
            
            const data = await res.json();
            const meta = data?.chart?.result?.[0]?.meta;
            if (meta && meta.regularMarketPrice !== undefined && meta.regularMarketPrice !== null) {
                return {
                    symbol: symbol,
                    name: meta.shortName || meta.symbol,
                    price: meta.regularMarketPrice,
                    previousClose: meta.previousClose || meta.chartPreviousClose || meta.regularMarketPrice,
                    currency: meta.currency,
                    exchangeName: meta.exchangeName,
                    regularMarketTime: meta.regularMarketTime,
                    timezone: meta.timezone,
                };
            }
            return null;
        } catch (e) {
            console.error(`Failed to fetch ${symbol}:`, e);
            return null;
        }
    });

    const settled = await Promise.allSettled(promises);
    return settled
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
        .map(r => r.value);
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
    // 한국 (KR) - 기본
    { symbol: '^KS11', name: 'KOSPI', country: 'kr', currency: '₩', flag: '🇰🇷', description: '한국 유가증권시장 종합' },
    { symbol: '^KQ11', name: 'KOSDAQ', country: 'kr', currency: '₩', flag: '🇰🇷', description: '한국 코스닥 시장' },
    { symbol: '^KS200', name: 'KOSPI 200', country: 'kr', currency: '₩', flag: '🇰🇷', description: '한국 대표 우량 200개 종목' },
    { symbol: 'KRW=X', name: 'USD/KRW', country: 'kr', currency: '₩', flag: '🇰🇷', description: '원/달러 실시간 환율' },

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

interface MacroConfigItem {
    symbol: string;
    name: string;
    icon: string;
    currency: string;
    unit: string;
    category: 'agri' | 'energy' | 'metal' | 'forex' | 'crypto';
    description: string;
    fallbackPrice: number;
    fallbackChange: number;
    fallbackRate: number;
}

const MACRO_INDICATOR_CONFIG: MacroConfigItem[] = [
    // 🌾 농산물 / 곡물 (Agri)
    {
        symbol: 'ZS=F',
        name: '대두 (콩)',
        icon: '🌱',
        currency: '¢',
        unit: '부셸당 ¢',
        category: 'agri',
        description: '사료·식용유 원료 / 글로벌 애그플레이션 선행지표',
        fallbackPrice: 1024.50,
        fallbackChange: 8.25,
        fallbackRate: 0.81,
    },
    {
        symbol: 'ZW=F',
        name: '소맥 (밀)',
        icon: '🌾',
        currency: '¢',
        unit: '부셸당 ¢',
        category: 'agri',
        description: '글로벌 제분 및 식량 공급망 핵심 지표',
        fallbackPrice: 568.75,
        fallbackChange: -3.50,
        fallbackRate: -0.61,
    },
    {
        symbol: 'ZC=F',
        name: '옥수수',
        icon: '🌽',
        currency: '¢',
        unit: '부셸당 ¢',
        category: 'agri',
        description: '바이오에탄올 및 배합사료 주원료',
        fallbackPrice: 428.25,
        fallbackChange: 2.75,
        fallbackRate: 0.65,
    },
    {
        symbol: 'KC=F',
        name: '커피 (아라비카)',
        icon: '☕',
        currency: '¢',
        unit: '파운드당 ¢',
        category: 'agri',
        description: '남미·동남아 기후 영향 및 기호식품 원자재',
        fallbackPrice: 242.60,
        fallbackChange: 4.10,
        fallbackRate: 1.72,
    },
    {
        symbol: 'SB=F',
        name: '원당 (설탕)',
        icon: '🍬',
        currency: '¢',
        unit: '파운드당 ¢',
        category: 'agri',
        description: '식품 가공 및 에탄올 생산 주요 원자재',
        fallbackPrice: 19.85,
        fallbackChange: -0.15,
        fallbackRate: -0.75,
    },
    {
        symbol: 'CT=F',
        name: '면화 (면직물)',
        icon: '🧶',
        currency: '¢',
        unit: '파운드당 ¢',
        category: 'agri',
        description: '의류 섬유 제조업 원자재 지표',
        fallbackPrice: 72.40,
        fallbackChange: 0.60,
        fallbackRate: 0.84,
    },

    // ⚡ 에너지 / 원유 (Energy)
    {
        symbol: 'CL=F',
        name: 'WTI 원유',
        icon: '🛢️',
        currency: '$',
        unit: '배럴당 $',
        category: 'energy',
        description: '미 서부 텍사스산 원유 / 세계 3대 유가 기준',
        fallbackPrice: 73.80,
        fallbackChange: 0.95,
        fallbackRate: 1.30,
    },
    {
        symbol: 'BZ=F',
        name: '브렌트유',
        icon: '⛽',
        currency: '$',
        unit: '배럴당 $',
        category: 'energy',
        description: '북해산 원유 / 유럽·아시아 실물 원유 벤치마크',
        fallbackPrice: 77.25,
        fallbackChange: 0.88,
        fallbackRate: 1.15,
    },
    {
        symbol: 'NG=F',
        name: '천연가스',
        icon: '🔥',
        currency: '$',
        unit: 'MMBtu당 $',
        category: 'energy',
        description: '발전 및 난방 에너지 원료',
        fallbackPrice: 2.18,
        fallbackChange: -0.04,
        fallbackRate: -1.80,
    },
    {
        symbol: 'RB=F',
        name: 'RBOB 휘발유',
        icon: '🚗',
        currency: '$',
        unit: '갤런당 $',
        category: 'energy',
        description: '미국 정유 및 차량용 연료 가격 척도',
        fallbackPrice: 2.12,
        fallbackChange: 0.02,
        fallbackRate: 0.95,
    },

    // 🥇 귀금속 / 산업금속 (Metals)
    {
        symbol: 'GC=F',
        name: '금 선물',
        icon: '🥇',
        currency: '$',
        unit: '트로이온스당 $',
        category: 'metal',
        description: '인플레이션 헷지 및 글로벌 대표 안전자산',
        fallbackPrice: 2512.40,
        fallbackChange: 14.80,
        fallbackRate: 0.59,
    },
    {
        symbol: 'SI=F',
        name: '은 선물',
        icon: '🥈',
        currency: '$',
        unit: '트로이온스당 $',
        category: 'metal',
        description: '귀금속 + 태양광/반도체 산업용 필수 금속',
        fallbackPrice: 29.35,
        fallbackChange: 0.42,
        fallbackRate: 1.45,
    },
    {
        symbol: 'HG=F',
        name: '구리 (Dr. Copper)',
        icon: '🥉',
        currency: '$',
        unit: '파운드당 $',
        category: 'metal',
        description: '전기차·전력망 필수 원자재 / 실물 경기 선행지표',
        fallbackPrice: 4.21,
        fallbackChange: 0.05,
        fallbackRate: 1.20,
    },
    {
        symbol: 'PL=F',
        name: '백금 (Platinum)',
        icon: '💍',
        currency: '$',
        unit: '트로이온스당 $',
        category: 'metal',
        description: '수소 연료전지 및 정밀 촉매 산업 원료',
        fallbackPrice: 945.60,
        fallbackChange: -6.20,
        fallbackRate: -0.65,
    },

    // 💵 환율 & 채권금리 (Forex & Yields)
    {
        symbol: 'KRW=X',
        name: '달러 / 원',
        icon: '💵',
        currency: '₩',
        unit: '달러당 원',
        category: 'forex',
        description: '외환시장 원/달러 실시간 환율',
        fallbackPrice: 1378.50,
        fallbackChange: -3.20,
        fallbackRate: -0.23,
    },
    {
        symbol: 'DX-Y.NYB',
        name: '달러 인덱스 (DXY)',
        icon: '📈',
        currency: 'pt',
        unit: '지수 포인트',
        category: 'forex',
        description: '주요 6개국 통화 대비 미국 달러 가치',
        fallbackPrice: 101.35,
        fallbackChange: -0.18,
        fallbackRate: -0.18,
    },
    {
        symbol: '^TNX',
        name: '미국 10년물 국채금리',
        icon: '🏛️',
        currency: '%',
        unit: '연수익률 %',
        category: 'forex',
        description: '글로벌 자산 가격 산정의 기준이 되는 무위험 금리',
        fallbackPrice: 3.86,
        fallbackChange: -0.04,
        fallbackRate: -1.03,
    },
    {
        symbol: '^TYX',
        name: '미국 30년물 국채금리',
        icon: '🏦',
        currency: '%',
        unit: '연수익률 %',
        category: 'forex',
        description: '장기 경제 성장 및 인플레이션 기대치 반영',
        fallbackPrice: 4.16,
        fallbackChange: -0.03,
        fallbackRate: -0.72,
    },
    {
        symbol: 'EURKRW=X',
        name: '유로 / 원',
        icon: '💶',
        currency: '₩',
        unit: '유로당 원',
        category: 'forex',
        description: '유럽연합 유로화 원화 환율',
        fallbackPrice: 1522.40,
        fallbackChange: 2.10,
        fallbackRate: 0.14,
    },
    {
        symbol: 'JPYKRW=X',
        name: '100엔 / 원',
        icon: '💴',
        currency: '₩',
        unit: '100엔당 원',
        category: 'forex',
        description: '일본 엔화 100엔 기준 원화 환율',
        fallbackPrice: 948.30,
        fallbackChange: 4.50,
        fallbackRate: 0.48,
    },

    // ₿ 디지털 자산 (Crypto)
    {
        symbol: 'BTC-KRW',
        name: '비트코인 (BTC)',
        icon: '₿',
        currency: '₩',
        unit: '1 BTC당 원',
        category: 'crypto',
        description: '가장 대표적인 디지털 금 & 탈중앙 자산',
        fallbackPrice: 84200000,
        fallbackChange: 1250000,
        fallbackRate: 1.51,
    },
    {
        symbol: 'ETH-KRW',
        name: '이더리움 (ETH)',
        icon: '♦️',
        currency: '₩',
        unit: '1 ETH당 원',
        category: 'crypto',
        description: '스마트 컨트랙트 및 Web3 생태계 기축 자산',
        fallbackPrice: 3580000,
        fallbackChange: 65000,
        fallbackRate: 1.85,
    },
    {
        symbol: 'SOL-KRW',
        name: '솔라나 (SOL)',
        icon: '☀️',
        currency: '₩',
        unit: '1 SOL당 원',
        category: 'crypto',
        description: '고속 결제 및 디파이 생태계 레이어 1 코인',
        fallbackPrice: 189000,
        fallbackChange: -2400,
        fallbackRate: -1.25,
    },
    {
        symbol: 'XRP-KRW',
        name: '리플 (XRP)',
        icon: '✕',
        currency: '₩',
        unit: '1 XRP당 원',
        category: 'crypto',
        description: '국경 간 글로벌 송금 특화 암호화폐',
        fallbackPrice: 785,
        fallbackChange: 12,
        fallbackRate: 1.55,
    },
];

// 거시 경제 지표 (농산물, 에너지, 귀금속, 환율/채권금리, 가상자산)
let macroCache: { data: any; timestamp: number } | null = null;

financeRoutes.get('/api/finance/macro', async (c) => {
    const now = Date.now();
    const categoryParam = c.req.query('category');

    if (macroCache && (now - macroCache.timestamp) < CACHE_TTL) {
        let cached = macroCache.data;
        if (categoryParam && categoryParam !== 'all') {
            cached = cached.filter((item: any) => item.category === categoryParam);
        }
        return c.json(cached);
    }
    
    const symbols = MACRO_INDICATOR_CONFIG.map(item => item.symbol);
    const quotes = await fetchYahooQuotes(symbols);
    const quoteMap = new Map<string, any>();
    quotes.forEach(q => quoteMap.set(q.symbol, q));
    
    const macro = MACRO_INDICATOR_CONFIG.map(cfg => {
        const q = quoteMap.get(cfg.symbol);
        if (q && q.price !== undefined) {
            const change = q.price - q.previousClose;
            const rate = q.previousClose ? (change / q.previousClose) * 100 : 0;
            return {
                symbol: cfg.symbol,
                name: cfg.name,
                icon: cfg.icon,
                price: Math.round(q.price * 100) / 100,
                change: Math.round(change * 100) / 100,
                rate: Math.round(rate * 100) / 100,
                status: change >= 0 ? 'up' : 'down',
                currency: cfg.currency,
                unit: cfg.unit,
                category: cfg.category,
                description: cfg.description,
                updatedAt: formatMarketTime(q.regularMarketTime, q.timezone),
            };
        }

        // Fallback data
        return {
            symbol: cfg.symbol,
            name: cfg.name,
            icon: cfg.icon,
            price: cfg.fallbackPrice,
            change: cfg.fallbackChange,
            rate: cfg.fallbackRate,
            status: cfg.fallbackChange >= 0 ? 'up' : 'down',
            currency: cfg.currency,
            unit: cfg.unit,
            category: cfg.category,
            description: cfg.description,
            updatedAt: '실시간',
        };
    });
    
    if (macro.length > 0) macroCache = { data: macro, timestamp: now };

    if (categoryParam && categoryParam !== 'all') {
        const filtered = macro.filter(item => item.category === categoryParam);
        return c.json(filtered);
    }

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
    // currency 미지정 → 종목별 자동 판별, 이름은 Yahoo shortName 사용
    const stocks = await fetchStockCards(symbols, {}, tickerMap);
    return c.json(stocks);
});

// =========================================================================
// 🏆 시장 리더보드 (시가총액, 급등주, 거래대금, 고배당 TOP 10)
// =========================================================================
interface LeaderConfig {
    ticker: string;
    symbol: string;
    name: string;
    market: 'KRX' | 'NASDAQ' | 'NYSE';
    currency: string;
    marketCap: string;
    detail: string;
    fallbackPrice: number;
    fallbackChange: number;
    fallbackRate: number;
}

const MARKET_LEADERS_CONFIG: Record<string, LeaderConfig[]> = {
    market_cap: [
        { ticker: '005930', symbol: '005930.KS', name: '삼성전자', market: 'KRX', currency: '₩', marketCap: '480조', detail: '글로벌 메모리 반도체 1위', fallbackPrice: 80500, fallbackChange: 1200, fallbackRate: 1.51 },
        { ticker: 'NVDA', symbol: 'NVDA', name: '엔비디아', market: 'NASDAQ', currency: '$', marketCap: '3.4조$', detail: 'AI 가속기 GPU 독점', fallbackPrice: 128.50, fallbackChange: 4.20, fallbackRate: 3.38 },
        { ticker: 'AAPL', symbol: 'AAPL', name: '애플', market: 'NASDAQ', currency: '$', marketCap: '3.3조$', detail: '아이폰 & 온디바이스 AI', fallbackPrice: 226.80, fallbackChange: 1.80, fallbackRate: 0.80 },
        { ticker: 'MSFT', symbol: 'MSFT', name: '마이크로소프트', market: 'NASDAQ', currency: '$', marketCap: '3.1조$', detail: '클라우드 애저 & 오픈AI 파트너', fallbackPrice: 422.40, fallbackChange: 3.10, fallbackRate: 0.74 },
        { ticker: '000660', symbol: '000660.KS', name: 'SK하이닉스', market: 'KRX', currency: '₩', marketCap: '142조', detail: 'HBM3E 고대역폭 메모리 주도', fallbackPrice: 195000, fallbackChange: 6500, fallbackRate: 3.45 },
        { ticker: 'GOOGL', symbol: 'GOOGL', name: '알파벳(구글)', market: 'NASDAQ', currency: '$', marketCap: '2.0조$', detail: '구글 검색 & 제미나이 AI', fallbackPrice: 165.20, fallbackChange: -0.80, fallbackRate: -0.48 },
        { ticker: 'AMZN', symbol: 'AMZN', name: '아마존', market: 'NASDAQ', currency: '$', marketCap: '1.9조$', detail: '이커머스 & AWS 클라우드', fallbackPrice: 178.60, fallbackChange: 2.40, fallbackRate: 1.36 },
        { ticker: '373220', symbol: '373220.KS', name: 'LG에너지솔루션', market: 'KRX', currency: '₩', marketCap: '86조', detail: '글로벌 전기차 배터리 선도', fallbackPrice: 367000, fallbackChange: -2000, fallbackRate: -0.54 },
        { ticker: 'TSLA', symbol: 'TSLA', name: '테슬라', market: 'NASDAQ', currency: '$', marketCap: '7800억$', detail: '전기차 & FSD 자율주행·로봇', fallbackPrice: 245.80, fallbackChange: 8.50, fallbackRate: 3.58 },
        { ticker: '005380', symbol: '005380.KS', name: '현대차', market: 'KRX', currency: '₩', marketCap: '52조', detail: '완성차 & 하이브리드·인도법인 상장', fallbackPrice: 251000, fallbackChange: 4000, fallbackRate: 1.62 },
    ],
    gainers: [
        { ticker: '042700', symbol: '042700.KS', name: '한미반도체', market: 'KRX', currency: '₩', marketCap: '14조', detail: 'HBM 필수 Dual TC 본더 독점', fallbackPrice: 145000, fallbackChange: 12500, fallbackRate: 9.43 },
        { ticker: 'PLTR', symbol: 'PLTR', name: '팔란티어', market: 'NYSE', currency: '$', marketCap: '820억$', detail: '정부·기업용 AI 플랫폼 AIP 급성장', fallbackPrice: 37.40, fallbackChange: 2.85, fallbackRate: 8.25 },
        { ticker: '277810', symbol: '277810.KQ', name: '천보', market: 'KRX', currency: '₩', marketCap: '1.2조', detail: '2차전지 전해질 신제품 공급', fallbackPrice: 78900, fallbackChange: 5400, fallbackRate: 7.35 },
        { ticker: 'ARM', symbol: 'ARM', name: 'ARM 홀딩스', market: 'NASDAQ', currency: '$', marketCap: '1400억$', detail: '차세대 AI 스마트폰 CPU IP 설계', fallbackPrice: 138.20, fallbackChange: 8.90, fallbackRate: 6.88 },
        { ticker: '000100', symbol: '000100.KS', name: '유한양행', market: 'KRX', currency: '₩', marketCap: '10조', detail: '렉라자 FDA 승인 후 글로벌 매출 가시화', fallbackPrice: 132000, fallbackChange: 8000, fallbackRate: 6.45 },
        { ticker: 'AVGO', symbol: 'AVGO', name: '브로드컴', market: 'NASDAQ', currency: '$', marketCap: '7900억$', detail: 'AI ASIC 맞춤형 칩 & 네트워킹', fallbackPrice: 168.40, fallbackChange: 9.20, fallbackRate: 5.78 },
        { ticker: '003670', symbol: '003670.KS', name: '포스코퓨처엠', market: 'KRX', currency: '₩', marketCap: '18조', detail: '양·음극재 턴어라운드 기대감', fallbackPrice: 236000, fallbackChange: 11500, fallbackRate: 5.12 },
        { ticker: 'LLY', symbol: 'LLY', name: '일라이릴리', market: 'NYSE', currency: '$', marketCap: '8900억$', detail: '비만치료제 젭바운드 글로벌 수요 폭발', fallbackPrice: 948.50, fallbackChange: 42.00, fallbackRate: 4.63 },
        { ticker: '035420', symbol: '035420.KS', name: 'NAVER', market: 'KRX', currency: '₩', marketCap: '35조', detail: '클라우드 AI 및 광고 효율화', fallbackPrice: 215000, fallbackChange: 7000, fallbackRate: 3.37 },
        { ticker: 'TSM', symbol: 'TSM', name: 'TSMC', market: 'NYSE', currency: '$', marketCap: '8800억$', detail: '글로벌 3nm 파운드리 풀가동', fallbackPrice: 172.50, fallbackChange: 5.40, fallbackRate: 3.23 },
    ],
    volume: [
        { ticker: '005930', symbol: '005930.KS', name: '삼성전자', market: 'KRX', currency: '₩', marketCap: '480조', detail: '일 거래대금 약 1조 2,000억원', fallbackPrice: 80500, fallbackChange: 1200, fallbackRate: 1.51 },
        { ticker: 'NVDA', symbol: 'NVDA', name: '엔비디아', market: 'NASDAQ', currency: '$', marketCap: '3.4조$', detail: '일 거래대금 약 280억 달러', fallbackPrice: 128.50, fallbackChange: 4.20, fallbackRate: 3.38 },
        { ticker: 'TSLA', symbol: 'TSLA', name: '테슬라', market: 'NASDAQ', currency: '$', marketCap: '7800억$', detail: '개인 및 기관 수급 집중', fallbackPrice: 245.80, fallbackChange: 8.50, fallbackRate: 3.58 },
        { ticker: '000660', symbol: '000660.KS', name: 'SK하이닉스', market: 'KRX', currency: '₩', marketCap: '142조', detail: '외국인 대량 순매수 지속', fallbackPrice: 195000, fallbackChange: 6500, fallbackRate: 3.45 },
        { ticker: '042700', symbol: '042700.KS', name: '한미반도체', market: 'KRX', currency: '₩', marketCap: '14조', detail: '반도체 소부장 거래대금 1위', fallbackPrice: 145000, fallbackChange: 12500, fallbackRate: 9.43 },
        { ticker: 'AAPL', symbol: 'AAPL', name: '애플', market: 'NASDAQ', currency: '$', marketCap: '3.3조$', detail: '글로벌 패시브 자금 유입', fallbackPrice: 226.80, fallbackChange: 1.80, fallbackRate: 0.80 },
        { ticker: '005380', symbol: '005380.KS', name: '현대차', market: 'KRX', currency: '₩', marketCap: '52조', detail: '기업 밸류업 프로그램 수혜', fallbackPrice: 251000, fallbackChange: 4000, fallbackRate: 1.62 },
        { ticker: 'AMD', symbol: 'AMD', name: 'AMD', market: 'NASDAQ', currency: '$', marketCap: '2400억$', detail: 'MI300 AI 칩 수급 회복세', fallbackPrice: 152.40, fallbackChange: 3.80, fallbackRate: 2.56 },
        { ticker: '086520', symbol: '086520.KQ', name: '에코프로', market: 'KRX', currency: '₩', marketCap: '22조', detail: '코스닥 거래대금 최상위', fallbackPrice: 84500, fallbackChange: 2100, fallbackRate: 2.55 },
        { ticker: 'AMZN', symbol: 'AMZN', name: '아마존', market: 'NASDAQ', currency: '$', marketCap: '1.9조$', detail: '실적 발표 후 대량 거래', fallbackPrice: 178.60, fallbackChange: 2.40, fallbackRate: 1.36 },
    ],
    dividend: [
        { ticker: 'SCHD', symbol: 'SCHD', name: '슈왑 미국 배당주 ETF', market: 'NYSE', currency: '$', marketCap: '620억$', detail: '배당수익률 연 3.6% / 10년 연속 배당성장', fallbackPrice: 82.40, fallbackChange: 0.35, fallbackRate: 0.43 },
        { ticker: 'JEPI', symbol: 'JEPI', name: 'JP모건 프리미엄 월배당 ETF', market: 'NYSE', currency: '$', marketCap: '350억$', detail: '월지급식 배당수익률 연 7.8%', fallbackPrice: 58.20, fallbackChange: 0.15, fallbackRate: 0.26 },
        { ticker: '105560', symbol: '105560.KS', name: 'KB금융', market: 'KRX', currency: '₩', marketCap: '34조', detail: '배당수익률 연 5.8% / 분기배당·자사주 소각', fallbackPrice: 84500, fallbackChange: 1100, fallbackRate: 1.32 },
        { ticker: '055550', symbol: '055550.KS', name: '신한지주', market: 'KRX', currency: '₩', marketCap: '28조', detail: '배당수익률 연 5.5% / 주주환원율 40% 목표', fallbackPrice: 56200, fallbackChange: 800, fallbackRate: 1.44 },
        { ticker: '086790', symbol: '086790.KS', name: '하나금융지주', market: 'KRX', currency: '₩', marketCap: '18조', detail: '배당수익률 연 6.2% / 고배당 저평가 대표주', fallbackPrice: 62400, fallbackChange: 600, fallbackRate: 0.97 },
        { ticker: '138040', symbol: '138040.KS', name: '메리츠금융지주', market: 'KRX', currency: '₩', marketCap: '19조', detail: '주주환원율 50% 원칙 / 당기순익 절반 배당·소각', fallbackPrice: 98500, fallbackChange: 2100, fallbackRate: 2.18 },
        { ticker: '017670', symbol: '017670.KS', name: 'SK텔레콤', market: 'KRX', currency: '₩', marketCap: '12조', detail: '배당수익률 연 6.5% / 안정적 통신 캐시카우', fallbackPrice: 56800, fallbackChange: 200, fallbackRate: 0.35 },
        { ticker: 'O', symbol: 'O', name: '리얼티인컴 (Realty Income)', market: 'NYSE', currency: '$', marketCap: '520억$', detail: '월배당 리츠 / 배당수익률 연 5.2%', fallbackPrice: 60.80, fallbackChange: 0.40, fallbackRate: 0.66 },
        { ticker: '033780', symbol: '033780.KS', name: 'KT&G', market: 'KRX', currency: '₩', marketCap: '14조', detail: '배당수익률 연 5.9% / 해외 NGP 전자담배 성장', fallbackPrice: 112000, fallbackChange: 1500, fallbackRate: 1.36 },
        { ticker: '024110', symbol: '024110.KS', name: '기업은행', market: 'KRX', currency: '₩', marketCap: '11조', detail: '배당수익률 연 6.8% / 국책은행 높은 배당성향', fallbackPrice: 14200, fallbackChange: 100, fallbackRate: 0.71 },
    ],
};

let leadersCache: { [key: string]: { data: any; timestamp: number } } = {};

financeRoutes.get('/api/finance/market-leaders', async (c) => {
    const type = (c.req.query('type') || 'market_cap') as string;
    const configList = MARKET_LEADERS_CONFIG[type] || MARKET_LEADERS_CONFIG.market_cap;
    const now = Date.now();

    if (leadersCache[type] && (now - leadersCache[type].timestamp) < CACHE_TTL) {
        return c.json(leadersCache[type].data);
    }

    const symbols = configList.map(c => c.symbol);
    const quotes = await fetchYahooQuotes(symbols);
    const quoteMap = new Map(quotes.map(q => [q.symbol, q]));

    const leaders = configList.map((cfg, idx) => {
        const q = quoteMap.get(cfg.symbol);
        if (q && q.price !== undefined) {
            const change = q.price - q.previousClose;
            const rate = q.previousClose ? (change / q.previousClose) * 100 : 0;
            return {
                rank: idx + 1,
                ticker: cfg.ticker,
                symbol: cfg.symbol,
                name: cfg.name,
                market: cfg.market,
                currency: cfg.currency,
                price: Math.round(q.price * 100) / 100,
                change: Math.round(change * 100) / 100,
                rate: Math.round(rate * 100) / 100,
                status: change >= 0 ? 'up' : 'down',
                marketCap: cfg.marketCap,
                detail: cfg.detail,
                sparkline: [
                    q.previousClose * 0.98,
                    q.previousClose * 0.99,
                    q.previousClose,
                    q.price * 0.995,
                    q.price
                ],
            };
        }

        return {
            rank: idx + 1,
            ticker: cfg.ticker,
            symbol: cfg.symbol,
            name: cfg.name,
            market: cfg.market,
            currency: cfg.currency,
            price: cfg.fallbackPrice,
            change: cfg.fallbackChange,
            rate: cfg.fallbackRate,
            status: cfg.fallbackChange >= 0 ? 'up' : 'down',
            marketCap: cfg.marketCap,
            detail: cfg.detail,
            sparkline: [
                cfg.fallbackPrice - cfg.fallbackChange,
                cfg.fallbackPrice - (cfg.fallbackChange * 0.5),
                cfg.fallbackPrice
            ],
        };
    });

    leadersCache[type] = { data: leaders, timestamp: now };
    return c.json(leaders);
});

// =========================================================================
// 🚀 테마별 주도주 허브 (6대 핵심 산업 테마)
// =========================================================================
interface ThemeConfig {
    key: string;
    name: string;
    icon: string;
    highlight: string;
    description: string;
    stocks: { ticker: string; symbol: string; name: string; currency: string; fallbackPrice: number; fallbackRate: number; note: string }[];
}

const THEMES_CONFIG: ThemeConfig[] = [
    {
        key: 'semiconductor',
        name: 'AI & 반도체',
        icon: '🤖',
        highlight: 'HBM · GPU · 파운드리',
        description: '글로벌 AI 가속기 및 온디바이스 메모리 수혜 핵심 주도주',
        stocks: [
            { ticker: '005930', symbol: '005930.KS', name: '삼성전자', currency: '₩', fallbackPrice: 80500, fallbackRate: 1.51, note: 'HBM3E 공급 확대 & 턴키 파운드리' },
            { ticker: '000660', symbol: '000660.KS', name: 'SK하이닉스', currency: '₩', fallbackPrice: 195000, fallbackRate: 3.45, note: '엔비디아 HBM 독점 공급 지위 유지' },
            { ticker: 'NVDA', symbol: 'NVDA', name: '엔비디아', currency: '$', fallbackPrice: 128.50, fallbackRate: 3.38, note: '블랙웰 B200 아키텍처 출시' },
            { ticker: '042700', symbol: '042700.KS', name: '한미반도체', currency: '₩', fallbackPrice: 145000, fallbackRate: 9.43, note: 'Dual TC 본더 세계 1위' },
            { ticker: 'AVGO', symbol: 'AVGO', name: '브로드컴', currency: '$', fallbackPrice: 168.40, fallbackRate: 5.78, note: '빅테크 맞춤형 AI ASIC 칩' },
        ]
    },
    {
        key: 'battery',
        name: '2차전지 & 모빌리티',
        icon: '🔋',
        highlight: '양극재 · LFP · 전기차',
        description: '차세대 배터리 셀, 소재 및 글로벌 완성차 혁신 기업',
        stocks: [
            { ticker: '373220', symbol: '373220.KS', name: 'LG에너지솔루션', currency: '₩', fallbackPrice: 367000, fallbackRate: -0.54, note: '북미 합작공장 가동 및 ESS 확대' },
            { ticker: '005380', symbol: '005380.KS', name: '현대차', currency: '₩', fallbackPrice: 251000, fallbackRate: 1.62, note: '하이브리드·전기차 믹스 수익성 극대화' },
            { ticker: 'TSLA', symbol: 'TSLA', name: '테슬라', currency: '$', fallbackPrice: 245.80, fallbackRate: 3.58, note: '로보택시(Cybercab) & FSD 자율주행' },
            { ticker: '005490', symbol: '005490.KS', name: 'POSCO홀딩스', currency: '₩', fallbackPrice: 382000, fallbackRate: 1.20, note: '리튬·니켈 원자재 밸류체인 내재화' },
            { ticker: '000270', symbol: '000270.KS', name: '기아', currency: '₩', fallbackPrice: 104500, fallbackRate: 1.85, note: 'PBV 전기차 및 고배당 주주환원' },
        ]
    },
    {
        key: 'bigtech',
        name: '빅테크 & AI 플랫폼',
        icon: '🌐',
        highlight: '클라우드 · 생성형AI · 검색',
        description: '전 세계 디지털 인프라와 AI 플랫폼을 선도하는 초대형 기술주',
        stocks: [
            { ticker: 'MSFT', symbol: 'MSFT', name: '마이크로소프트', currency: '$', fallbackPrice: 422.40, fallbackRate: 0.74, note: '코파일럿 AI 기업 엔터프라이즈 장악' },
            { ticker: 'AAPL', symbol: 'AAPL', name: '애플', currency: '$', fallbackPrice: 226.80, fallbackRate: 0.80, note: 'Apple Intelligence 생태계 확장' },
            { ticker: 'GOOGL', symbol: 'GOOGL', name: '알파벳', currency: '$', fallbackPrice: 165.20, fallbackRate: -0.48, note: '제미나이 AI 검색 엔진 고도화' },
            { ticker: '035420', symbol: '035420.KS', name: 'NAVER', currency: '₩', fallbackPrice: 215000, fallbackRate: 3.37, note: '하이퍼클로바X 및 B2B AI 솔루션' },
            { ticker: '035720', symbol: '035720.KS', name: '카카오', currency: '₩', fallbackPrice: 42500, fallbackRate: 0.71, note: '카카오톡 카나나 AI 대화형 에이전트' },
        ]
    },
    {
        key: 'bio',
        name: '바이오 & 헬스케어',
        icon: '🧬',
        highlight: 'CDMO · 바이오시밀러 · 비만',
        description: '글로벌 신약 승인, 바이오의약품 위탁생산 및 비만치료제 열풍',
        stocks: [
            { ticker: '207940', symbol: '207940.KS', name: '삼성바이오로직스', currency: '₩', fallbackPrice: 980000, fallbackRate: 2.10, note: '5공장 착공 & 글로벌 CDMO 수주 1위' },
            { ticker: '068270', symbol: '068270.KS', name: '셀트리온', currency: '₩', fallbackPrice: 202000, fallbackRate: 1.76, note: '짐펜트라 미국 처방집 선호의약품 등재' },
            { ticker: 'LLY', symbol: 'LLY', name: '일라이릴리', currency: '$', fallbackPrice: 948.50, fallbackRate: 4.63, note: '마운자로·젭바운드 비만약 글로벌 돌풍' },
            { ticker: '000100', symbol: '000100.KS', name: '유한양행', currency: '₩', fallbackPrice: 132000, fallbackRate: 6.45, note: '폐암 신약 렉라자 미국 FDA 최종 승인' },
            { ticker: 'NVO', symbol: 'NVO', name: '노보노디스크', currency: '$', fallbackPrice: 136.20, fallbackRate: 1.15, note: '위고비·오젬픽 GLP-1 치료제 개척' },
        ]
    },
    {
        key: 'finance',
        name: '금융 & 밸류업 고배당',
        icon: '🏦',
        highlight: '은행 · 보험 · 지주사',
        description: '저PBR 해소, 자사주 매입/소각 및 높은 분기/월 배당 매력',
        stocks: [
            { ticker: '105560', symbol: '105560.KS', name: 'KB금융', currency: '₩', fallbackPrice: 84500, fallbackRate: 1.32, note: 'ROE 10% 돌파 & 분기 균등배당제' },
            { ticker: '055550', symbol: '055550.KS', name: '신한지주', currency: '₩', fallbackPrice: 56200, fallbackRate: 1.44, note: '주주환원율 40% 로드맵 가동' },
            { ticker: '138040', symbol: '138040.KS', name: '메리츠금융지주', currency: '₩', fallbackPrice: 98500, fallbackRate: 2.18, note: '국내 금융주 중 주주환원 정책 선도' },
            { ticker: '086790', symbol: '086790.KS', name: '하나금융지주', currency: '₩', fallbackPrice: 62400, fallbackRate: 0.97, note: '배당수익률 6%대 안정 배당주' },
            { ticker: 'SCHD', symbol: 'SCHD', name: 'SCHD (미국배당성장)', currency: '$', fallbackPrice: 82.40, fallbackRate: 0.43, note: '국내 서학개미 최다 보유 배당 ETF' },
        ]
    },
    {
        key: 'entertainment',
        name: 'K-콘텐츠 & 엔터/게임',
        icon: '🎮',
        highlight: 'K-POP · 웹툰 · 글로벌 신작',
        description: '글로벌 팬덤 경제, 월드 투어 재개 및 AAA급 대작 게임',
        stocks: [
            { ticker: '352820', symbol: '352820.KS', name: '하이브', currency: '₩', fallbackPrice: 198000, fallbackRate: 2.45, note: 'BTS 완전체 복귀 기대 및 멀티레이블' },
            { ticker: '259960', symbol: '259960.KS', name: '크래프톤', currency: '₩', fallbackPrice: 345000, fallbackRate: 3.12, note: '배틀그라운드 IP 인도 및 글로벌 매출 호조' },
            { ticker: '041510', symbol: '041510.KQ', name: '에스엠', currency: '₩', fallbackPrice: 78500, fallbackRate: 1.25, note: '에스파·라이즈 글로벌 음원 차트 석권' },
            { ticker: '035900', symbol: '035900.KQ', name: 'JYP Ent.', currency: '₩', fallbackPrice: 58900, fallbackRate: -0.85, note: '스트레이키즈 스타디움 투어 성황' },
            { ticker: '251270', symbol: '251270.KS', name: '넷마블', currency: '₩', fallbackPrice: 64200, fallbackRate: 1.60, note: '나혼자만 레벨업 등 신작 흑자 전환' },
        ]
    }
];

let themesCache: { data: any; timestamp: number } | null = null;

financeRoutes.get('/api/finance/themes', async (c) => {
    const category = c.req.query('category');
    const now = Date.now();

    if (themesCache && (now - themesCache.timestamp) < CACHE_TTL) {
        if (category && category !== 'all') {
            return c.json(themesCache.data.filter((t: any) => t.key === category));
        }
        return c.json(themesCache.data);
    }

    const allSymbols: string[] = [];
    THEMES_CONFIG.forEach(t => t.stocks.forEach(s => allSymbols.push(s.symbol)));
    const quotes = await fetchYahooQuotes(allSymbols);
    const quoteMap = new Map(quotes.map(q => [q.symbol, q]));

    const themes = THEMES_CONFIG.map(t => ({
        ...t,
        stocks: t.stocks.map(s => {
            const q = quoteMap.get(s.symbol);
            if (q && q.price !== undefined) {
                const change = q.price - q.previousClose;
                const rate = q.previousClose ? (change / q.previousClose) * 100 : 0;
                return {
                    ticker: s.ticker,
                    symbol: s.symbol,
                    name: s.name,
                    currency: s.currency,
                    price: Math.round(q.price * 100) / 100,
                    change: Math.round(change * 100) / 100,
                    rate: Math.round(rate * 100) / 100,
                    status: change >= 0 ? 'up' : 'down',
                    note: s.note,
                };
            }
            return {
                ticker: s.ticker,
                symbol: s.symbol,
                name: s.name,
                currency: s.currency,
                price: s.fallbackPrice,
                change: Math.round((s.fallbackPrice * (s.fallbackRate / 100)) * 100) / 100,
                rate: s.fallbackRate,
                status: s.fallbackRate >= 0 ? 'up' : 'down',
                note: s.note,
            };
        })
    }));

    themesCache = { data: themes, timestamp: now };

    if (category && category !== 'all') {
        return c.json(themes.filter(t => t.key === category));
    }

    return c.json(themes);
});

// =========================================================================
// 🔍 종목 통합 검색 API (국내 50대 / 미국 30대 핵심 종목 사전 매칭)
// =========================================================================
const ALL_SEARCHABLE_STOCKS = [
    { ticker: '005930', name: '삼성전자', englishName: 'Samsung Electronics', market: 'KRX', sector: '반도체' },
    { ticker: '000660', name: 'SK하이닉스', englishName: 'SK Hynix', market: 'KRX', sector: '반도체' },
    { ticker: '373220', name: 'LG에너지솔루션', englishName: 'LG Energy Solution', market: 'KRX', sector: '2차전지' },
    { ticker: '005380', name: '현대차', englishName: 'Hyundai Motor', market: 'KRX', sector: '자동차' },
    { ticker: '000270', name: '기아', englishName: 'Kia', market: 'KRX', sector: '자동차' },
    { ticker: '005490', name: 'POSCO홀딩스', englishName: 'POSCO Holdings', market: 'KRX', sector: '철강/소재' },
    { ticker: '035420', name: 'NAVER', englishName: 'Naver', market: 'KRX', sector: '인터넷/AI' },
    { ticker: '035720', name: '카카오', englishName: 'Kakao', market: 'KRX', sector: '인터넷/플랫폼' },
    { ticker: '207940', name: '삼성바이오로직스', englishName: 'Samsung Biologics', market: 'KRX', sector: '바이오' },
    { ticker: '068270', name: '셀트리온', englishName: 'Celltrion', market: 'KRX', sector: '바이오' },
    { ticker: '000100', name: '유한양행', englishName: 'Yuhan', market: 'KRX', sector: '제약/바이오' },
    { ticker: '105560', name: 'KB금융', englishName: 'KB Financial', market: 'KRX', sector: '금융/은행' },
    { ticker: '055550', name: '신한지주', englishName: 'Shinhan Financial', market: 'KRX', sector: '금융/은행' },
    { ticker: '086790', name: '하나금융지주', englishName: 'Hana Financial', market: 'KRX', sector: '금융/은행' },
    { ticker: '138040', name: '메리츠금융지주', englishName: 'Meritz Financial', market: 'KRX', sector: '금융/지주' },
    { ticker: '042700', name: '한미반도체', englishName: 'Hanmi Semiconductor', market: 'KRX', sector: '반도체장비' },
    { ticker: '086520', name: '에코프로', englishName: 'Ecopro', market: 'KRX', sector: '2차전지' },
    { ticker: '247540', name: '에코프로비엠', englishName: 'Ecopro BM', market: 'KRX', sector: '2차전지소재' },
    { ticker: '003670', name: '포스코퓨처엠', englishName: 'POSCO Future M', market: 'KRX', sector: '2차전지소재' },
    { ticker: '352820', name: '하이브', englishName: 'HYBE', market: 'KRX', sector: '엔터/음악' },
    { ticker: '259960', name: '크래프톤', englishName: 'Krafton', market: 'KRX', sector: '게임' },
    { ticker: 'NVDA', name: '엔비디아', englishName: 'NVIDIA', market: 'NASDAQ', sector: 'AI반도체' },
    { ticker: 'AAPL', name: '애플', englishName: 'Apple', market: 'NASDAQ', sector: '빅테크' },
    { ticker: 'MSFT', name: '마이크로소프트', englishName: 'Microsoft', market: 'NASDAQ', sector: '클라우드/AI' },
    { ticker: 'GOOGL', name: '알파벳 (구글)', englishName: 'Alphabet Google', market: 'NASDAQ', sector: '인터넷/AI' },
    { ticker: 'AMZN', name: '아마존', englishName: 'Amazon', market: 'NASDAQ', sector: '이커머스/클라우드' },
    { ticker: 'META', name: '메타 (페이스북)', englishName: 'Meta Platforms', market: 'NASDAQ', sector: '소셜/AI' },
    { ticker: 'TSLA', name: '테슬라', englishName: 'Tesla', market: 'NASDAQ', sector: '전기차/자율주행' },
    { ticker: 'AVGO', name: '브로드컴', englishName: 'Broadcom', market: 'NASDAQ', sector: '통신/AI반도체' },
    { ticker: 'TSM', name: 'TSMC', englishName: 'TSMC', market: 'NYSE', sector: '파운드리' },
    { ticker: 'ASML', name: 'ASML', englishName: 'ASML', market: 'NASDAQ', sector: '반도체노광장비' },
    { ticker: 'AMD', name: 'AMD', englishName: 'Advanced Micro Devices', market: 'NASDAQ', sector: 'CPU/GPU' },
    { ticker: 'PLTR', name: '팔란티어', englishName: 'Palantir', market: 'NYSE', sector: '엔터프라이즈AI' },
    { ticker: 'LLY', name: '일라이릴리', englishName: 'Eli Lilly', market: 'NYSE', sector: '비만치료제/신약' },
    { ticker: 'NVO', name: '노보노디스크', englishName: 'Novo Nordisk', market: 'NYSE', sector: '비만치료제/당뇨' },
    { ticker: 'SCHD', name: '슈왑 미국배당주 ETF', englishName: 'Schwab US Dividend Equity ETF', market: 'NYSE', sector: '배당성장ETF' },
    { ticker: 'JEPI', name: 'JP모건 프리미엄소득 ETF', englishName: 'JPMorgan Equity Premium Income ETF', market: 'NYSE', sector: '월배당커버드콜' },
    { ticker: 'QQQ', name: '인베스코 나스닥 100 ETF', englishName: 'Invesco QQQ Trust', market: 'NASDAQ', sector: '나스닥100' },
    { ticker: 'SPY', name: 'SPDR S&P 500 ETF', englishName: 'SPDR S&P 500 ETF Trust', market: 'NYSE', sector: 'S&P500' },
    { ticker: 'O', name: '리얼티인컴', englishName: 'Realty Income', market: 'NYSE', sector: '월배당리츠' },
];

financeRoutes.get('/api/finance/search-stocks', (c) => {
    const q = (c.req.query('q') || '').trim().toLowerCase();
    if (!q) {
        return c.json(ALL_SEARCHABLE_STOCKS.slice(0, 10));
    }

    const matched = ALL_SEARCHABLE_STOCKS.filter(s =>
        s.ticker.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.englishName.toLowerCase().includes(q) ||
        s.sector.toLowerCase().includes(q)
    );

    return c.json(matched.slice(0, 15));
});

export { financeRoutes };

