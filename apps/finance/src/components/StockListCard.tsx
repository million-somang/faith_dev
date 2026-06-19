import { Link } from 'react-router-dom';
import SparklineChart from './SparklineChart';

export interface StockCard {
    ticker: string;
    name: string;
    price: number;
    change: number;
    rate: number;
    status: 'up' | 'down';
    currency: string;
    sparkline: number[];
}

interface Props {
    stock: StockCard;
    isFavorite: boolean;
    onToggleFavorite: (ticker: string, meta?: { name?: string }) => void;
}

/**
 * 종목 카드 — 가격·등락·미니차트 표시, 우상단 별(★)로 관심종목 지정/해제.
 * 카드 본문 클릭 시 개별 종목 상세(/stock/:ticker)로 이동한다.
 */
export default function StockListCard({ stock, isFavorite, onToggleFavorite }: Props) {
    return (
        <div className="relative bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-gray-300 transition-all group">
            <button
                type="button"
                onClick={(e) => { e.preventDefault(); onToggleFavorite(stock.ticker, { name: stock.name }); }}
                aria-label={isFavorite ? '관심종목 해제' : '관심종목 추가'}
                className={`absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                    isFavorite
                        ? 'text-yellow-400 hover:bg-yellow-50'
                        : 'text-gray-300 hover:text-yellow-400 hover:bg-gray-50'
                }`}
            >
                <i className={`${isFavorite ? 'fas' : 'far'} fa-star`}></i>
            </button>

            <Link to={`/stock/${stock.ticker}`} className="block">
                <div className="mb-1 pr-8">
                    <div className="font-bold text-gray-900 text-base group-hover:text-green-700 transition-colors">{stock.name}</div>
                    <div className="text-xs text-gray-400 font-mono">{stock.ticker}</div>
                </div>
                <div className="stock-number text-2xl font-extrabold text-gray-900 mt-2">
                    {stock.currency}{stock.price.toLocaleString('ko-KR')}
                </div>
                <div className={`stock-number text-sm mt-1 ${stock.status === 'up' ? 'text-red-500' : 'text-blue-500'}`}>
                    {stock.change >= 0 ? '+' : ''}{Math.abs(stock.change).toLocaleString('ko-KR')} ({stock.rate >= 0 ? '+' : ''}{stock.rate.toFixed(2)}%)
                </div>
                <div className="mt-3">
                    <SparklineChart data={stock.sparkline} status={stock.status} width={160} height={40} />
                </div>
            </Link>
        </div>
    );
}
