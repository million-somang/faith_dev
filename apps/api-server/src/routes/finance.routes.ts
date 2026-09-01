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
