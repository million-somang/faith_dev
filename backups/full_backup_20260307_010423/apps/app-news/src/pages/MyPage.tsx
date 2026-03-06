import { useEffect, useState } from 'react';
import { Header, Footer, Card, NewsCard } from '@faithportal/ui';
import axios from 'axios';

const API_BASE = '';

export default function MyPage() {
    const [keywords, setKeywords] = useState<any[]>([]);
    const [keywordNews, setKeywordNews] = useState<any[]>([]);
    const [bookmarks, setBookmarks] = useState<any[]>([]);
    const [watchlist, setWatchlist] = useState<any[]>([]);
    const [gameStats, setGameStats] = useState<any[]>([]);
    const [utilHistory, setUtilHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const instance = axios.create({ withCredentials: true });

                const [kwRes, kwNewsRes, bmRes, wlRes, gsRes, utRes] = await Promise.all([
                    instance.get(`${API_BASE}/api/user/keywords`),
                    instance.get(`${API_BASE}/api/user/news/keywords?limit=5`),
                    instance.get(`${API_BASE}/api/user/bookmarks`),
                    instance.get(`${API_BASE}/api/user/watchlist`),
                    instance.get(`${API_BASE}/api/user/game-stats`),
                    instance.get(`${API_BASE}/api/user/utils/history`)
                ]);

                setKeywords(kwRes.data.keywords || []);
                setKeywordNews(kwNewsRes.data.news || []);
                setBookmarks(bmRes.data.bookmarks || bmRes.data.items || []);
                setWatchlist(wlRes.data.stocks || []);
                setGameStats(gsRes.data.stats || []);
                setUtilHistory(utRes.data.history || []);
            } catch (error) {
                console.error('Failed to fetch mypage data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-green"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />

            <main className="flex-1 max-w-6xl mx-auto px-4 py-12 w-full">
                <header className="mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">마이페이지</h1>
                    <p className="text-gray-500">나의 스크랩과 활동 내역을 한눈에 확인하세요.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left/Main Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Keyword News */}
                        <Card className="p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <i className="fas fa-hashtag text-sky-500"></i> 키워드 구독 뉴스
                                </span>
                            </h3>
                            <div className="space-y-4">
                                {keywordNews.length > 0 ? (
                                    keywordNews.map((news) => (
                                        <NewsCard key={news.id} news={news} />
                                    ))
                                ) : (
                                    <p className="text-center py-12 text-gray-400">구독 키워드와 일치하는 뉴스가 없습니다.</p>
                                )}
                            </div>
                        </Card>

                        {/* News Bookmarks */}
                        <Card className="p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <i className="fas fa-bookmark text-amber-500"></i> 북마크한 뉴스
                            </h3>
                            <div className="space-y-4">
                                {bookmarks.length > 0 ? (
                                    bookmarks.map((news) => (
                                        <NewsCard key={news.id} news={news} />
                                    ))
                                ) : (
                                    <p className="text-center py-12 text-gray-400">북마크한 뉴스가 없습니다.</p>
                                )}
                            </div>
                        </Card>

                        {/* Recent Game Activity */}
                        <Card className="p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <i className="fas fa-gamepad text-purple-500"></i> 게임 활동 통계
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {gameStats.length > 0 ? (
                                    gameStats.map((stat) => (
                                        <div key={stat.game_type} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">{stat.game_type}</p>
                                            <p className="text-2xl font-black text-gray-900">{stat.high_score.toLocaleString()}</p>
                                            <p className="text-[10px] text-gray-500 mt-1">{stat.play_count}회 플레이</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-400 col-span-3">게임 플레이 기록이 없습니다.</p>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Right/Sidebar Column */}
                    <div className="space-y-8">
                        {/* Subscribed Keywords */}
                        <Card className="p-6">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <i className="fas fa-tags text-brand-green"></i> 구독 키워드
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {keywords.length > 0 ? (
                                    keywords.map((kw) => (
                                        <span key={kw.id} className="px-3 py-1 bg-green-50 text-brand-green text-sm font-bold rounded-full border border-green-100 flex items-center gap-2">
                                            #{kw.keyword}
                                            <button className="hover:text-red-500 transition-colors">
                                                <i className="fas fa-times text-[10px]"></i>
                                            </button>
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-400">구독 중인 키워드가 없습니다.</p>
                                )}
                            </div>
                            <div className="mt-4 flex gap-2">
                                <input type="text" placeholder="키워드 추가" className="flex-1 bg-gray-100 border-none rounded-lg py-2 px-4 text-xs focus:ring-2 focus:ring-brand-green transition-all" />
                                <button className="p-2 bg-brand-green text-white rounded-lg hover:bg-brand-green-hover">
                                    <i className="fas fa-plus text-xs"></i>
                                </button>
                            </div>
                        </Card>

                        {/* Stock Watchlist */}
                        <Card className="p-6">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <i className="fas fa-chart-line text-blue-500"></i> 관심 종목
                            </h3>
                            <div className="space-y-4">
                                {watchlist.length > 0 ? (
                                    watchlist.map((stock) => (
                                        <div key={stock.id} className="flex items-center justify-between group">
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{stock.stock_name}</p>
                                                <p className="text-[10px] text-gray-400 font-mono">{stock.stock_symbol}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-gray-700">종목 정보</p>
                                                <button className="text-[10px] text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">삭제</button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-400">관심 종목이 없습니다.</p>
                                )}
                            </div>
                        </Card>

                        {/* Recent Utility History */}
                        <Card className="p-6">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <i className="fas fa-history text-gray-500"></i> 최근 도구 사용 기록
                            </h3>
                            <div className="space-y-3">
                                {utilHistory.length > 0 ? (
                                    utilHistory.map((h) => (
                                        <div key={h.id} className="text-xs border-b border-gray-50 pb-2 last:border-0">
                                            <div className="flex justify-between mb-1">
                                                <span className="font-bold text-gray-700">{h.util_type}</span>
                                                <span className="text-[10px] text-gray-400">{new Date(h.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-gray-500 truncate italic">"{JSON.stringify(h.input_data).substring(0, 30)}..."</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-400">최근 기록이 없습니다.</p>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
