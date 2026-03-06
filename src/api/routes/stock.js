import { Hono } from 'hono';
const stockRoutes = new Hono();
// 단일 종목 시세 조회
stockRoutes.get('/api/stock/quote/:symbol', async (c) => {
    const symbol = c.req.param('symbol');
    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (!response.ok)
            throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data.chart?.result?.[0]) {
            const result = data.chart.result[0];
            const meta = result.meta;
            const currentPrice = meta.regularMarketPrice || meta.previousClose;
            const previousClose = meta.chartPreviousClose || meta.previousClose;
            const change = currentPrice - previousClose;
            return c.json({
                success: true, symbol, name: meta.symbol || symbol,
                price: currentPrice, change, changePercent: (change / previousClose) * 100,
                status: change >= 0 ? 'up' : 'down', currency: meta.currency,
                timestamp: meta.regularMarketTime
            });
        }
        throw new Error('No data available');
    }
    catch (error) {
        return c.json({ success: false, message: 'Failed to fetch stock data', symbol, error: error.message }, 500);
    }
});
// 여러 종목 동시 조회
stockRoutes.get('/api/stocks/quotes', async (c) => {
    const symbols = c.req.query('symbols')?.split(',') || [];
    if (symbols.length === 0)
        return c.json({ success: false, message: 'No symbols provided' }, 400);
    try {
        const promises = symbols.map(async (symbol) => {
            try {
                const trimmedSymbol = symbol.trim();
                const url = `https://query1.finance.yahoo.com/v8/finance/chart/${trimmedSymbol}?interval=1d&range=1d`;
                const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                if (!response.ok)
                    return null;
                const data = await response.json();
                if (data.chart?.result?.[0]) {
                    const result = data.chart.result[0];
                    const meta = result.meta;
                    const currentPrice = meta.regularMarketPrice || meta.previousClose;
                    const previousClose = meta.chartPreviousClose || meta.previousClose;
                    const change = currentPrice - previousClose;
                    return {
                        symbol: trimmedSymbol, name: meta.symbol || trimmedSymbol,
                        price: currentPrice, change, changePercent: (change / previousClose) * 100,
                        status: change >= 0 ? 'up' : 'down'
                    };
                }
                return null;
            }
            catch (error) {
                return null;
            }
        });
        const results = await Promise.all(promises);
        const validResults = results.filter(r => r !== null);
        return c.json({ success: true, count: validResults.length, stocks: validResults });
    }
    catch (error) {
        return c.json({ success: false, message: 'Failed to fetch stocks data' }, 500);
    }
});
// 미국 주요 주식 4대장
stockRoutes.get('/api/us-stocks/major', async (c) => {
    const symbols = ['AAPL', 'TSLA', 'NVDA', 'MSFT'];
    const nameMap = { 'AAPL': '애플', 'TSLA': '테슬라', 'NVDA': '엔비디아', 'MSFT': '마이크로소프트' };
    try {
        const promises = symbols.map(async (symbol) => {
            try {
                const quoteUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
                const quoteResponse = await fetch(quoteUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                if (!quoteResponse.ok)
                    return null;
                const quoteData = await quoteResponse.json();
                if (quoteData.chart?.result?.[0]) {
                    const result = quoteData.chart.result[0], meta = result.meta;
                    const currentPrice = meta.regularMarketPrice || meta.previousClose;
                    const previousClose = meta.chartPreviousClose || meta.previousClose;
                    const change = currentPrice - previousClose;
                    const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo`;
                    const chartResponse = await fetch(chartUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                    let chartData = [];
                    if (chartResponse.ok) {
                        const chartJson = await chartResponse.json();
                        if (chartJson.chart?.result?.[0]) {
                            const ts = chartJson.chart.result[0].timestamp || [], cls = chartJson.chart.result[0].indicators?.quote?.[0]?.close || [];
                            chartData = ts.slice(-30).map((t, i) => ({ date: new Date(t * 1000).toISOString().split('T')[0], price: cls[i] || 0 })).filter(d => d.price > 0);
                        }
                    }
                    return { symbol, name: nameMap[symbol] || symbol, fullName: meta.longName || meta.shortName || symbol, price: currentPrice, change, changePercent: (change / previousClose) * 100, status: change >= 0 ? 'up' : 'down', chartData };
                }
                return null;
            }
            catch (error) {
                return null;
            }
        });
        const results = (await Promise.all(promises)).filter(r => r !== null);
        return c.json({ success: true, count: results.length, stocks: results });
    }
    catch (error) {
        return c.json({ success: false, message: 'Failed to fetch US stocks data' }, 500);
    }
});
// 한국 주요 주식 4대장
stockRoutes.get('/api/kr-stocks/major', async (c) => {
    const symbols = ['005930.KS', '000660.KS', '373220.KS', '035420.KS'];
    const nameMap = { '005930.KS': '삼성전자', '000660.KS': 'SK하이닉스', '373220.KS': 'LG에너지솔루션', '035420.KS': 'NAVER' };
    try {
        const promises = symbols.map(async (symbol) => {
            try {
                const quoteUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
                const quoteResponse = await fetch(quoteUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                if (!quoteResponse.ok)
                    return null;
                const quoteData = await quoteResponse.json();
                if (quoteData.chart?.result?.[0]) {
                    const result = quoteData.chart.result[0], meta = result.meta;
                    const currentPrice = meta.regularMarketPrice || meta.previousClose;
                    const previousClose = meta.chartPreviousClose || meta.previousClose;
                    const change = currentPrice - previousClose;
                    const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo`;
                    const chartResponse = await fetch(chartUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                    let chartData = [];
                    if (chartResponse.ok) {
                        const chartJson = await chartResponse.json();
                        if (chartJson.chart?.result?.[0]) {
                            const ts = chartJson.chart.result[0].timestamp || [], cls = chartJson.chart.result[0].indicators?.quote?.[0]?.close || [];
                            chartData = ts.slice(-30).map((t, i) => ({ date: new Date(t * 1000).toISOString().split('T')[0], price: cls[i] || 0 })).filter(d => d.price > 0);
                        }
                    }
                    return { symbol, name: nameMap[symbol] || symbol, fullName: meta.longName || meta.shortName || symbol, price: Math.round(currentPrice), change: Math.round(change), changePercent: (change / previousClose) * 100, status: change >= 0 ? 'up' : 'down', chartData };
                }
                return null;
            }
            catch (error) {
                return null;
            }
        });
        const results = (await Promise.all(promises)).filter(r => r !== null);
        return c.json({ success: true, count: results.length, stocks: results });
    }
    catch (error) {
        return c.json({ success: false, message: 'Failed to fetch KR stocks data' }, 500);
    }
});
// 매크로 지표
stockRoutes.get('/api/macro-indicators', async (c) => {
    const indicators = [
        { symbol: 'KRW=X', name: '달러/원', type: 'currency', icon: '💵' },
        { symbol: 'BTC-KRW', name: '비트코인', type: 'crypto', icon: '₿' },
        { symbol: 'GC=F', name: '금 선물', type: 'commodity', icon: '🥇' },
        { symbol: 'CL=F', name: 'WTI 유가', type: 'commodity', icon: '🛢️' }
    ];
    try {
        const promises = indicators.map(async (indicator) => {
            try {
                const quoteUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${indicator.symbol}?interval=1d&range=1d`;
                const response = await fetch(quoteUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                if (!response.ok)
                    return null;
                const data = await response.json();
                if (data.chart?.result?.[0]) {
                    const result = data.chart.result[0], meta = result.meta;
                    const currentPrice = meta.regularMarketPrice || meta.previousClose, previousClose = meta.chartPreviousClose || meta.previousClose;
                    const change = currentPrice - previousClose;
                    return { ...indicator, price: currentPrice, change, changePercent: (change / previousClose) * 100, status: change >= 0 ? 'up' : 'down' };
                }
                return null;
            }
            catch (error) {
                return null;
            }
        });
        const results = (await Promise.all(promises)).filter(r => r !== null);
        return c.json({ success: true, count: results.length, indicators: results });
    }
    catch (error) {
        return c.json({ success: false, message: 'Failed to fetch macro indicators data' }, 500);
    }
});
// 마켓 무버
stockRoutes.get('/api/market-movers/:type', async (c) => {
    const type = c.req.param('type');
    const screenerMap = { 'gainers': 'day_gainers', 'losers': 'day_losers', 'actives': 'most_actives' };
    const screnerId = screenerMap[type];
    if (!screnerId)
        return c.json({ success: false, message: 'Invalid type' }, 400);
    try {
        const url = `https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?scrIds=${screnerId}&count=5`;
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!response.ok)
            return c.json({ success: false, message: 'Failed to fetch data' }, 500);
        const data = await response.json();
        if (data.finance?.result?.[0]?.quotes) {
            const stocks = data.finance.result[0].quotes.slice(0, 5).map((quote) => ({
                symbol: quote.symbol, name: quote.shortName || quote.longName || quote.symbol, price: quote.regularMarketPrice,
                change: quote.regularMarketChange, changePercent: quote.regularMarketChangePercent, volume: quote.regularMarketVolume,
                status: quote.regularMarketChange >= 0 ? 'up' : 'down'
            }));
            return c.json({ success: true, type, count: stocks.length, stocks });
        }
        return c.json({ success: false, message: 'No data available' }, 404);
    }
    catch (error) {
        return c.json({ success: false, message: 'Failed to fetch market movers data' }, 500);
    }
});
// 투자 심리
stockRoutes.get('/api/poll/sentiment', async (c) => {
    return c.json({ success: true, poll: { question: '오늘 코스피, 오를까 내릴까?', bullVotes: 127, bearVotes: 83, totalVotes: 210, bullPercent: 60.5, bearPercent: 39.5 } });
});
stockRoutes.post('/api/poll/vote', async (c) => {
    const body = await c.req.json();
    if (!body.vote || !['bull', 'bear'].includes(body.vote))
        return c.json({ success: false, message: 'Invalid vote' }, 400);
    return c.json({ success: true, vote: body.vote, message: 'Vote recorded successfully' });
});
export { stockRoutes };
