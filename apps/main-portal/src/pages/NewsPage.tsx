import { useEffect, useState, useRef } from 'react';
import { Header, Footer, Card, NewsCard } from '@faithportal/ui';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = '';

export default function NewsPage() {
    const { user, logout } = useAuth();
    const [news, setNews] = useState<any[]>([]);
    const [hotNews, setHotNews] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'keyword' | 'hot'>('keyword');
    const [category, setCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    // User features
    const [bookmarkedNewsIds, setBookmarkedNewsIds] = useState<number[]>([]);
    const [subscribedKeywords, setSubscribedKeywords] = useState<any[]>([]);
    const [newKeyword, setNewKeyword] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const categories = [
        { id: 'all', name: '전체' },
        { id: 'general', name: '일반' },
        { id: 'politics', name: '정치' },
        { id: 'economy', name: '경제' },
        { id: 'tech', name: 'IT/과학' },
        { id: 'sports', name: '스포츠' },
        { id: 'entertainment', name: '엔터' },
        { id: 'stock', name: '주식' },
        { id: 'keyword', name: '키워드' }
    ];

    useEffect(() => {
        checkAuthAndFetchUserData();
    }, []);

    const checkAuthAndFetchUserData = async () => {
        try {
            const authRes = await axios.get(`${API_BASE_URL}/api/auth/me`, { withCredentials: true });
            if (authRes.data.success && authRes.data.user) {
                setIsLoggedIn(true);
                fetchBookmarks();
                fetchKeywords();
            }
        } catch (error) {
            // Not logged in or error
        }
    };

    const fetchBookmarks = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/user/bookmarks`, { params: { limit: 200 }, withCredentials: true });
            if (res.data.success) {
                setBookmarkedNewsIds((res.data.bookmarks || []).map((b: any) => b.news_id));
            }
        } catch (error) {
            console.error('Fetch bookmarks error', error);
        }
    };

    const fetchKeywords = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/user/keywords`, { withCredentials: true });
            if (res.data.success) {
                setSubscribedKeywords(res.data.keywords);
            }
        } catch (error) {
            console.error('Fetch keywords error', error);
        }
    };

    const handleBookmarkToggle = async (newsId: number) => {
        if (!isLoggedIn) {
            alert('로그인이 필요한 서비스입니다.');
            return;
        }

        const isBookmarked = bookmarkedNewsIds.includes(newsId);
        try {
            if (isBookmarked) {
                await axios.delete(`${API_BASE_URL}/api/user/bookmarks/${newsId}`, { withCredentials: true });
                setBookmarkedNewsIds(prev => prev.filter(id => id !== newsId));
            } else {
                await axios.post(`${API_BASE_URL}/api/user/bookmarks`, { newsId }, { withCredentials: true });
                setBookmarkedNewsIds(prev => [...prev, newsId]);
            }
        } catch (error) {
            console.error('Bookmark toggle error', error);
        }
    };

    const handleVote = async (newsId: number, type: 'up' | 'down') => {
        if (!isLoggedIn) {
            alert('로그인이 필요한 서비스입니다.');
            return;
        }

        try {
            const res = await axios.post(`${API_BASE_URL}/api/news/${newsId}/vote`, { type }, { withCredentials: true });
            if (res.data.success) {
                const action = res.data.action;
                let upChange = 0;
                let downChange = 0;

                if (action === 'voted') {
                    if (type === 'up') upChange = 1;
                    else downChange = 1;
                } else if (action === 'cancelled') {
                    if (type === 'up') upChange = -1;
                    else downChange = -1;
                } else if (action === 'changed') {
                    if (type === 'up') { upChange = 1; downChange = -1; }
                    else { upChange = -1; downChange = 1; }
                }

                setNews(prev => prev.map(n => {
                    if (n.id === newsId) {
                        return {
                            ...n,
                            vote_up: Math.max(0, (n.vote_up || 0) + upChange),
                            vote_down: Math.max(0, (n.vote_down || 0) + downChange)
                        };
                    }
                    return n;
                }));
            }
        } catch (error) {
            console.error('Vote error', error);
            alert('투표 처리 중 오류가 발생했습니다.');
        }
    };

    const handleAddKeyword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKeyword.trim()) return;
        if (!isLoggedIn) {
            alert('로그인이 필요한 서비스입니다.');
            return;
        }

        try {
            const res = await axios.post(`${API_BASE_URL}/api/user/keywords`, { keyword: newKeyword.trim() }, { withCredentials: true });
            if (res.data.success) {
                setNewKeyword('');
                fetchKeywords();
                if (category === 'keyword') {
                    setNews([]); setPage(1); setHasMore(true); loadNews(1, true);
                }
            }
        } catch (error) {
            console.error('Add keyword error', error);
            alert('키워드 추가 중 오류가 발생했습니다.');
        }
    };

    const handleRemoveKeyword = async (keywordId: number) => {
        try {
            await axios.delete(`${API_BASE_URL}/api/user/keywords/${keywordId}`, { withCredentials: true });
            fetchKeywords();
            if (category === 'keyword') {
                setNews([]); setPage(1); setHasMore(true); loadNews(1, true);
            }
        } catch (error) {
            console.error('Remove keyword error', error);
        }
    };

    useEffect(() => {
        setNews([]);
        setPage(1);
        setHasMore(true);
        loadNews(1, true);
    }, [category]);

    useEffect(() => {
        fetchHotNews();
    }, []);

    useEffect(() => {
        if (page > 1) {
            loadNews(page, false);
        }
    }, [page]);

    const loaderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loading && hasMore) {
                    setPage(prev => prev + 1);
                }
            },
            { threshold: 0.1 }
        );

        if (loaderRef.current) observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [loading, hasMore]);

    const loadNews = async (pageNum: number, isReset: boolean = false) => {
        if (!hasMore && !isReset) return;
        setLoading(true);
        try {
            const limit = 20;
            const offset = (pageNum - 1) * limit;

            let url = `${API_BASE_URL}/api/news`;
            let params: any = { limit, offset, includeStocks: true };

            if (searchTerm.trim()) {
                url = `${API_BASE_URL}/api/news/search`;
                params.q = searchTerm.trim();
            } else if (category === 'keyword') {
                if (!isLoggedIn) {
                    setLoading(false);
                    return; // Needs login UI
                }
                url = `${API_BASE_URL}/api/user/news/keywords`;
                params = { limit, offset, includeStocks: true }; // Override for keywords
            } else {
                params.category = category;
            }

            const res = await axios.get(url, { params, withCredentials: true });
            if (res.data.success) {
                const newItems = res.data.newsletters || res.data.news || [];
                if (newItems.length < limit) {
                    setHasMore(false);
                }
                setNews(prev => isReset ? newItems : [...prev, ...newItems]);
            }
        } catch (error) {
            console.error('Load news error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHotNews = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/news/hot`);
            if (res.data.success) {
                setHotNews(res.data.news);
            }
        } catch (error) {
            console.error('Fetch hot news error:', error);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setNews([]);
        setPage(1);
        setHasMore(true);
        loadNews(1, true);
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header user={user} onLogout={logout} />

            <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
                {/* Search & Categories */}
                <div className="mb-8">
                    <form onSubmit={handleSearch} className="relative mb-6">
                        <input
                            type="text"
                            placeholder="뉴스 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-6 py-4 rounded-2xl border-none shadow-sm text-lg focus:ring-2 focus:ring-brand-green transition-all"
                        />
                        <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand-green text-white rounded-xl flex items-center justify-center">
                            <i className="fas fa-search"></i>
                        </button>
                    </form>

                    <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setCategory(cat.id)}
                                className={`whitespace-nowrap flex-shrink-0 px-5 py-2 rounded-full font-bold text-sm transition-all ${category === cat.id
                                    ? 'bg-brand-green text-white shadow-md'
                                    : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-100'
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left: News List */}
                    <div className="flex-1 space-y-6">
                        {/* Tabbed Card for Keyword Subscription and Hot Issues (Mobile Only) */}
                        <Card className="p-0 overflow-hidden lg:hidden">
                            <div className="flex bg-gray-50 border-b border-gray-100">
                                <button
                                    onClick={() => setActiveTab('keyword')}
                                    className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${activeTab === 'keyword' ? 'bg-white text-brand-green border-t-2 border-brand-green' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <i className="fas fa-bookmark mr-2 text-purple-500"></i>키워드 구독
                                </button>
                                <button
                                    onClick={() => setActiveTab('hot')}
                                    className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${activeTab === 'hot' ? 'bg-white text-brand-green border-t-2 border-brand-green' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <i className="fas fa-fire mr-2 text-red-500"></i>실시간 HOT 이슈
                                </button>
                            </div>

                            <div className="p-6">
                                {activeTab === 'keyword' && (
                                    <div>
                                        <div className="mb-4 relative">
                                            <form onSubmit={handleAddKeyword}>
                                                <input
                                                    type="text"
                                                    placeholder="키워드 입력..."
                                                    value={newKeyword}
                                                    onChange={(e) => setNewKeyword(e.target.value)}
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 pr-12 text-sm focus:ring-2 focus:ring-brand-green focus:border-brand-green transition-all"
                                                />
                                                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-brand-green text-white rounded-lg hover:bg-brand-green-hover transition-colors">
                                                    <i className="fas fa-plus text-xs"></i>
                                                </button>
                                            </form>
                                        </div>

                                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                            {!isLoggedIn ? (
                                                <p className="text-sm text-gray-500 text-center py-4">로그인이 필요합니다</p>
                                            ) : subscribedKeywords.length > 0 ? (
                                                subscribedKeywords.map((kw) => (
                                                    <div key={kw.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                        <span className="text-sm font-medium text-gray-700 break-all pr-2">#{kw.keyword}</span>
                                                        <button
                                                            onClick={() => handleRemoveKeyword(kw.id)}
                                                            className="text-gray-400 hover:text-red-500 transition-colors p-1 flex-shrink-0"
                                                            title="삭제"
                                                        >
                                                            <i className="fas fa-times text-sm"></i>
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-gray-500 text-center py-4">구독한 키워드가 없습니다</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'hot' && (
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                        {hotNews.map((n, idx) => (
                                            <a key={n.id} href={`/news/${n.id}`} className="flex items-start gap-3 group bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                                                <span className={`text-sm font-black mt-0.5 ${idx < 3 ? 'text-red-500' : 'text-gray-400'}`}>{idx + 1}</span>
                                                <p className="text-sm text-gray-700 font-medium line-clamp-2 group-hover:text-brand-green leading-snug flex-1">
                                                    {n.title}
                                                </p>
                                            </a>
                                        ))}
                                        {hotNews.length === 0 && (
                                            <p className="text-sm text-gray-500 text-center py-4">현재 많이 읽은 뉴스가 없습니다</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Card>

                        <Card className="p-0 overflow-hidden">
                            <div className="bg-white p-6 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">최신 뉴스</h2>
                                <button onClick={() => { setNews([]); setPage(1); setHasMore(true); loadNews(1, true); }} className="text-gray-400 hover:text-brand-green transition-colors">
                                    <i className="fas fa-sync-alt"></i>
                                </button>
                            </div>

                            <div className="divide-y divide-gray-50">
                                {category === 'keyword' && !isLoggedIn && (
                                    <div className="p-12 text-center">
                                        <i className="fas fa-lock text-5xl text-gray-300 mb-4"></i>
                                        <p className="text-gray-700 font-bold mb-2">로그인이 필요한 서비스입니다</p>
                                        <p className="text-gray-500 text-sm mb-4">키워드 뉴스를 보려면 먼저 로그인해주세요</p>
                                    </div>
                                )}

                                {news.map((n) => (
                                    <NewsCard
                                        key={n.id}
                                        news={n}
                                        isBookmarked={bookmarkedNewsIds.includes(n.id)}
                                        onBookmarkToggle={handleBookmarkToggle}
                                        onVote={handleVote}
                                    />
                                ))}

                                {loading && (
                                    <div className="p-12 text-center text-gray-400">
                                        <div className="animate-spin w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full mx-auto mb-4"></div>
                                        <p>뉴스를 불러오는 중입니다...</p>
                                    </div>
                                )}

                                {!loading && news.length === 0 && (
                                    <div className="p-12 text-center text-gray-400">
                                        <i className="fas fa-newspaper text-5xl mb-4 opacity-20"></i>
                                        <p>검색 결과가 없습니다.</p>
                                    </div>
                                )}

                                {/* Intersection Observer Target */}
                                {hasMore && !loading && category !== 'keyword' && news.length > 0 && (
                                    <div ref={loaderRef} className="h-10 w-full"></div>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Right: Sidebar */}
                    <aside className="w-full lg:w-80 space-y-6">
                        {/* Keyword Subscription (PC Only) */}
                        <div className="hidden lg:block space-y-6">
                            <Card className="p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                                    <i className="fas fa-bookmark text-purple-500 mr-2"></i>
                                    <span>키워드 구독</span>
                                </h3>
                                <div className="mb-4 relative">
                                    <form onSubmit={handleAddKeyword}>
                                        <input
                                            type="text"
                                            placeholder="키워드 입력..."
                                            value={newKeyword}
                                            onChange={(e) => setNewKeyword(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 pr-12 text-sm focus:ring-2 focus:ring-brand-green focus:border-brand-green transition-all"
                                        />
                                        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-brand-green text-white rounded-lg hover:bg-brand-green-hover transition-colors">
                                            <i className="fas fa-plus text-xs"></i>
                                        </button>
                                    </form>
                                </div>

                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {!isLoggedIn ? (
                                        <p className="text-sm text-gray-500 text-center py-4">로그인이 필요합니다</p>
                                    ) : subscribedKeywords.length > 0 ? (
                                        subscribedKeywords.map((kw) => (
                                            <div key={kw.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                <span className="text-sm font-medium text-gray-700 break-all pr-2">#{kw.keyword}</span>
                                                <button
                                                    onClick={() => handleRemoveKeyword(kw.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors p-1 flex-shrink-0"
                                                    title="삭제"
                                                >
                                                    <i className="fas fa-times text-sm"></i>
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 text-center py-4">구독한 키워드가 없습니다</p>
                                    )}
                                </div>
                            </Card>

                            {/* Hot Issues (PC Only) */}
                            <Card className="p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                                    <i className="fas fa-fire text-red-500 mr-2"></i>
                                    <span>실시간 HOT 이슈</span>
                                </h3>
                                <div className="space-y-4">
                                    {hotNews.map((n, idx) => (
                                        <a key={n.id} href={`/news/${n.id}`} className="flex items-start gap-3 group">
                                            <span className={`text-sm font-black ${idx < 3 ? 'text-red-500' : 'text-gray-400'}`}>{idx + 1}</span>
                                            <p className="text-sm text-gray-700 font-medium line-clamp-2 group-hover:text-brand-green leading-snug">
                                                {n.title}
                                            </p>
                                        </a>
                                    ))}
                                </div>
                            </Card>
                        </div>

                        {/* Banner */}
                        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 text-white shadow-lg overflow-hidden relative">
                            <div className="relative z-10">
                                <p className="text-xs font-bold opacity-80 mb-2">ADVERTISEMENT</p>
                                <h4 className="font-bold text-lg mb-4">프리미엄 멤버십 오픈</h4>
                                <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-bold transition-all">자세히 보기</button>
                            </div>
                            <i className="fas fa-crown absolute -right-4 -bottom-4 text-8xl opacity-10"></i>
                        </div>
                    </aside>
                </div>
            </main>

            <Footer />
        </div>
    );
}
