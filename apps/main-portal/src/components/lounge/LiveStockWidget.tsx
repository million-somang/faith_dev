import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface LiveStockWidgetProps {
    stockName: string;
}

interface StockData {
    price: string;
    changeRate: number;
    changePrice: string;
    isUp: boolean;
    chartData: number[];
}

export function LiveStockWidget({ stockName }: LiveStockWidgetProps) {
    const navigate = useNavigate();
    const [stock, setStock] = useState<StockData | null>(null);

    // 종목별 고정 모킹 데이터 (결정론적 생성)
    useEffect(() => {
        const cleanName = stockName.replace('$', '').trim();
        let price = '135.20';
        let changeRate = 2.45;
        let changePrice = '3.24';
        let isUp = true;
        let chartData = [132, 131.5, 133, 132.8, 134.1, 133.9, 135.2];

        if (cleanName.includes('엔비디아') || cleanName.toLowerCase().includes('nvidia')) {
            price = '127.85';
            changeRate = 4.82;
            changePrice = '5.88';
            isUp = true;
            chartData = [120, 122.1, 121.5, 123.8, 125, 124.9, 127.85];
        } else if (cleanName.includes('삼성전자') || cleanName.toLowerCase().includes('samsung')) {
            price = '74,200';
            changeRate = -1.15;
            changePrice = '800';
            isUp = false;
            chartData = [75800, 75400, 75100, 75300, 74900, 74600, 74200];
        } else if (cleanName.includes('테슬라') || cleanName.toLowerCase().includes('tesla')) {
            price = '258.40';
            changeRate = 8.12;
            changePrice = '19.40';
            isUp = true;
            chartData = [232, 235.4, 239, 244.5, 241, 248.8, 258.4];
        } else if (cleanName.includes('애플') || cleanName.toLowerCase().includes('apple')) {
            price = '218.30';
            changeRate = 0.55;
            changePrice = '1.20';
            isUp = true;
            chartData = [216, 217.2, 216.8, 218.1, 217.9, 218.0, 218.3];
        } else if (cleanName.includes('비트코인') || cleanName.toLowerCase().includes('bitcoin') || cleanName.toLowerCase().includes('btc')) {
            price = '94,850';
            changeRate = -5.40;
            changePrice = '5,410';
            isUp = false;
            chartData = [101200, 99800, 98900, 97500, 96800, 95100, 94850];
        } else {
            let hash = 0;
            for (let i = 0; i < cleanName.length; i++) {
                hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
            }
            const seed = Math.abs(hash);
            isUp = seed % 2 === 0;
            changeRate = parseFloat(((seed % 600) / 100).toFixed(2));
            price = String(100 + (seed % 900));
            changePrice = String(((parseFloat(price) * changeRate) / 100).toFixed(2));
            chartData = Array.from({ length: 7 }, (_, idx) => 
                parseFloat(price) * (1 + ((idx - 3) * (isUp ? 0.01 : -0.01)) + (Math.sin(idx) * 0.005))
            );
        }

        setStock({ price, changeRate, changePrice, isUp, chartData });
    }, [stockName]);

    if (!stock) return null;

    const chartMax = Math.max(...stock.chartData);
    const chartMin = Math.min(...stock.chartData);
    const chartHeight = 35;
    const pointsStr = stock.chartData.map((val, idx) => {
        const x = (idx / 6) * 110;
        const ratio = chartMax === chartMin ? 0.5 : (val - chartMin) / (chartMax - chartMin);
        const y = chartHeight - (ratio * (chartHeight - 4)) - 2;
        return `${x},${y}`;
    }).join(' ');

    const handleWidgetClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate('/finance');
    };

    return (
        <div 
            onClick={handleWidgetClick}
            className="my-2.5 flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 hover:border-violet-300 rounded-2xl shadow-sm cursor-pointer transition-all hover:translate-y-[-1px] group"
        >
            <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${stock.isUp ? 'bg-rose-50 border border-rose-200 text-rose-600' : 'bg-blue-50 border border-blue-200 text-blue-600'}`}>
                    {stockName.replace('$', '').substring(0, 2)}
                </div>
                <div>
                    <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm text-slate-800 group-hover:text-violet-600 transition-colors">{stockName}</span>
                        <span className="text-[10px] text-slate-400 font-bold">실시간 시세</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-black font-mono text-slate-700">{stock.price}</span>
                        <span className={`text-xs font-black font-mono flex items-center ${stock.isUp ? 'text-rose-500' : 'text-blue-500'}`}>
                            {stock.isUp ? '▲' : '▼'} {Math.abs(stock.changeRate)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* 미니 스파크라인 차트 */}
            <div className="w-[110px] h-[35px] mx-4 hidden xs:block">
                <svg width="110" height="35">
                    <polyline
                        fill="none"
                        stroke={stock.isUp ? '#f43f5e' : '#3b82f6'}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={pointsStr}
                    />
                </svg>
            </div>

            <div className="text-right flex flex-col justify-center items-end">
                <span className="text-[9px] text-slate-400 font-bold">VERA 금융</span>
                <span className="text-[10px] text-violet-600 font-black mt-1 flex items-center gap-0.5">
                    토론방 가기 <i className="fas fa-chevron-right text-[7px]"></i>
                </span>
            </div>
        </div>
    );
}
