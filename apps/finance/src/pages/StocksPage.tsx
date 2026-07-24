import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Header, Footer } from '@faithportal/ui';
import FinanceSubMenu from '../components/FinanceSubMenu';
import StockListCard from '../components/StockListCard';
import type { StockCard } from '../components/StockListCard';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '../hooks/useAuth';

const MAIN_PORTAL_URL = import.meta.env.DEV ? 'http://localhost:5000' : '';
const API_BASE = import.meta.env.DEV ? 'http://localhost:4200' : '';

export default function StocksPage() {
    const { favorites, isFavorite, add, remove, toggle } = useFavorites();
    const { user, logout } = useAuth();
    const [favoriteCards, setFavoriteCards] = useState<StockCard[]>([]);
    const [krStocks, setKrStocks] = useState<StockCard[]>([]);
    const [usStocks, setUsStocks] = useState<StockCard[]>([]);
    const [addInput, setAddInput] = useState('');
    const [loadingFav, setLoadingFav] = useState(false);

    // 관심종목 시세 로드 (지정 목록이 바뀔 때마다)
    useEffect(() => {
        if (favorites.length === 0) {
            setFavoriteCards([]);
            return;
        }
        let cancelled = false;
        setLoadingFav(true);
        fetch(`${API_BASE}/api/finance/stocks?symbols=${encodeURIComponent(favorites.join(','))}`)
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => { if (!cancelled) setFavoriteCards(Array.isArray(data) ? data : []); })
            .catch(() => { if (!cancelled) setFavoriteCards([]); })
            .finally(() => { if (!cancelled) setLoadingFav(false); });
        return () => { cancelled = true; };
    }, [favorites]);

    // 카테고리(국내/미국) 목록 로드
    useEffect(() => {
        fetch(`${API_BASE}/api/finance/kr-stocks`)
            .then((r) => (r.ok ? r.json() : []))
            .then((d) => setKrStocks(Array.isArray(d) ? d : []))
            .catch(() => {});
        fetch(`${API_BASE}/api/finance/us-stocks`)
            .then((r) => (r.ok ? r.json() : []))
            .then((d) => setUsStocks(Array.isArray(d) ? d : []))
            .catch(() => {});
    }, []);

    const handleAdd = useCallback((e: FormEvent) => {
        e.preventDefault();
        const t = addInput.trim();
        if (!t) return;
        add(t);
        setAddInput('');
    }, [addInput, add]);

    const findCard = (ticker: string) =>
        favoriteCards.find((c) => c.ticker.toUpperCase() === ticker.toUpperCase());

    return (
        <div className="flex flex-col min-h-screen">
            <Header baseUrl={MAIN_PORTAL_URL} user={user} onLogout={logout} />
            <FinanceSubMenu />

            {/* 브레드크럼 */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-4 py-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Link to="/" className="hover:text-green-600 transition-colors">홈</Link>
                        <i className="fas fa-chevron-right text-xs text-gray-300"></i>
                        <Link to="/" className="hover:text-green-600 transition-colors">금융</Link>
                        <i className="fas fa-chevron-right text-xs text-gray-300"></i>
                        <span className="text-gray-900 font-medium">종목</span>
                    </div>
                </div>
            </div>

            <main className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full">
                {/* 내 관심종목 (최우선) */}
                <section className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">
                            <i className="fas fa-star text-yellow-400 mr-2"></i>내 관심종목
                        </h2>
                        <span className="text-xs text-gray-400">최우선 표시 · 마이페이지 실시간 연동</span>
                    </div>

                    {/* 종목 직접 추가 */}
                    <form onSubmit={handleAdd} className="flex gap-2 mb-5">
                        <input
                            value={addInput}
                            onChange={(e) => setAddInput(e.target.value)}
                            placeholder="종목 코드 입력 (예: 005930, AAPL, TSLA)"
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
                        />
                        <button
                            type="submit"
                            className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm whitespace-nowrap"
                        >
                            <i className="fas fa-plus mr-1"></i>추가
                        </button>
                    </form>

                    {favorites.length === 0 ? (
                        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center">
                            <i className="far fa-star text-3xl text-gray-300 mb-3"></i>
                            <p className="text-gray-500">아직 지정한 관심종목이 없습니다.</p>
                            <p className="text-sm text-gray-400 mt-1">위에서 종목 코드를 추가하거나, 아래 목록의 별(★)을 눌러 지정하세요.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {favorites.map((ticker) => {
                                const card = findCard(ticker);
                                if (card) {
                                    return (
                                        <StockListCard
                                            key={ticker}
                                            stock={card}
                                            isFavorite
                                            onToggleFavorite={toggle}
                                        />
                                    );
                                }
                                // 시세 미수신/조회중 → 슬림 카드
                                return (
                                    <div key={ticker} className="relative bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between min-h-[120px]">
                                        <button
                                            type="button"
                                            onClick={() => remove(ticker)}
                                            aria-label="관심종목 해제"
                                            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-yellow-400 hover:bg-yellow-50"
                                        >
                                            <i className="fas fa-star"></i>
                                        </button>
                                        <Link to={`/stock/${ticker}`} className="block pr-8">
                                            <div className="font-bold text-gray-900 text-base font-mono">{ticker}</div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                {loadingFav ? '시세 불러오는 중…' : '시세 정보 없음'}
                                            </div>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* 국내 대표 기업 */}
                {krStocks.length > 0 && (
                    <section className="mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">
                                <span className="text-blue-600 font-mono text-sm mr-2 bg-blue-50 px-2 py-1 rounded">KR</span>국내 대표 기업
                            </h2>
                            <span className="text-xs text-gray-400">20분 지연 시세</span>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {krStocks.map((s) => (
                                <StockListCard
                                    key={s.ticker}
                                    stock={s}
                                    isFavorite={isFavorite(s.ticker)}
                                    onToggleFavorite={toggle}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* 미국 빅테크 */}
                {usStocks.length > 0 && (
                    <section className="mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">
                                <span className="text-red-600 font-mono text-sm mr-2 bg-red-50 px-2 py-1 rounded">US</span>미국 빅테크
                            </h2>
                            <span className="text-xs text-gray-400">15분 지연 시세</span>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {usStocks.map((s) => (
                                <StockListCard
                                    key={s.ticker}
                                    stock={s}
                                    isFavorite={isFavorite(s.ticker)}
                                    onToggleFavorite={toggle}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </main>

            <Footer baseUrl={MAIN_PORTAL_URL} />
        </div>
    );
}
