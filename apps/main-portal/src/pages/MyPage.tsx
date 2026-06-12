import { useEffect, useState } from 'react';
import { Header, Footer } from '@faithportal/ui';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { PreferenceWizard } from '../components/homepage/PreferenceWizard';
import { useUserPreferenceContext } from '../context/UserPreferenceContext';
import { HomepageConfig } from '../types/homepage.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export default function MyPage() {
    const { user, logout, isLoading } = useAuth();
    const navigate = useNavigate();

    const [activeSection, setActiveSection] = useState<'news' | 'stocks' | 'games' | 'utils' | 'home-customize'>('news');
    const [showWizard, setShowWizard] = useState(false);
    const { config: homeConfig, isSaving: isHomeSaving, updateConfig: updateHomeConfig, saveConfig: saveHomeConfig } = useUserPreferenceContext();

    const [newsData, setNewsData] = useState<{ keywords: any[], keywordNews: any[], bookmarks: any[] }>({ keywords: [], keywordNews: [], bookmarks: [] });
    const [stocksData, setStocksData] = useState<{ stats: any, watchlist: any[] }>({ stats: {}, watchlist: [] });
    const [gamesData, setGamesData] = useState<{ stats: any, history: any[] }>({ stats: {}, history: [] });
    const [utilsData, setUtilsData] = useState<{ settings: any, history: any[] }>({ settings: {}, history: [] });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            navigate('/login');
        }
    }, [user, isLoading, navigate]);

    useEffect(() => {
        if (!user) return;

        const loadSectionData = async () => {
            setLoading(true);
            try {
                const instance = axios.create({ withCredentials: true, baseURL: API_BASE_URL });

                if (activeSection === 'news') {
                    const [kwRes, kwNewsRes, bmRes] = await Promise.all([
                        instance.get(`/api/user/keywords`),
                        instance.get(`/api/user/news/keywords?limit=5`),
                        instance.get(`/api/user/bookmarks?page=1&limit=10`)
                    ]);
                    setNewsData({
                        keywords: kwRes.data.keywords || [],
                        keywordNews: kwNewsRes.data.news || [],
                        bookmarks: bmRes.data.items || []
                    });
                } else if (activeSection === 'stocks') {
                    const [statsRes, wlRes] = await Promise.all([
                        instance.get(`/api/user/watchlist/stats`),
                        instance.get(`/api/user/watchlist`)
                    ]);
                    setStocksData({
                        stats: statsRes.data.stats || {},
                        watchlist: wlRes.data.stocks || []
                    });
                } else if (activeSection === 'games') {
                    const [statsRes, historyRes] = await Promise.all([
                        instance.get(`/api/user/games/stats`),
                        instance.get(`/api/user/games/history?limit=10`)
                    ]);
                    setGamesData({
                        stats: statsRes.data.stats || {},
                        history: historyRes.data.history?.history || []
                    });
                } else if (activeSection === 'utils') {
                    const [settingsRes, historyRes] = await Promise.all([
                        instance.get(`/api/user/utils/settings`),
                        instance.get(`/api/user/utils/history?limit=10`)
                    ]);
                    setUtilsData({
                        settings: settingsRes.data.settings || {},
                        history: historyRes.data.history || []
                    });
                }
            } catch (error) {
                console.error(`Failed to load data for ${activeSection}:`, error);
            } finally {
                setLoading(false);
            }
        };

        loadSectionData();
    }, [activeSection, user]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
            </div>
        );
    }

    if (!user) {
        return null; // will redirect
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header user={user} onLogout={logout} />

            <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        <i className="fas fa-user-circle mr-2 text-gray-500"></i>마이페이지
                    </h1>
                    <p className="text-gray-600">나의 저장 항목과 활동 내역을 확인하세요</p>
                </div>

                {/* 레이아웃: 사이드바 + 컨텐츠 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                    {/* 사이드바 */}
                    <div className="md:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm p-4 sticky top-24 border border-gray-100">
                            <nav className="space-y-2">
                                <button
                                    onClick={() => setActiveSection('news')}
                                    className={`w-full text-left px-4 py-3 rounded-lg border-l-4 transition-all ${activeSection === 'news'
                                        ? 'border-sky-500 bg-sky-50 font-semibold'
                                        : 'border-transparent hover:bg-gray-50 text-gray-600'
                                        }`}
                                >
                                    <i className="fas fa-newspaper w-6 text-sky-500"></i>
                                    <span>뉴스</span>
                                </button>
                                <button
                                    onClick={() => setActiveSection('stocks')}
                                    className={`w-full text-left px-4 py-3 rounded-lg border-l-4 transition-all ${activeSection === 'stocks'
                                        ? 'border-green-500 bg-green-50 font-semibold'
                                        : 'border-transparent hover:bg-gray-50 text-gray-600'
                                        }`}
                                >
                                    <i className="fas fa-chart-line w-6 text-green-500"></i>
                                    <span>주식</span>
                                </button>
                                <button
                                    onClick={() => setActiveSection('games')}
                                    className={`w-full text-left px-4 py-3 rounded-lg border-l-4 transition-all ${activeSection === 'games'
                                        ? 'border-purple-500 bg-purple-50 font-semibold'
                                        : 'border-transparent hover:bg-gray-50 text-gray-600'
                                        }`}
                                >
                                    <i className="fas fa-gamepad w-6 text-purple-500"></i>
                                    <span>게임</span>
                                </button>
                                <button
                                    onClick={() => setActiveSection('utils')}
                                    className={`w-full text-left px-4 py-3 rounded-lg border-l-4 transition-all ${activeSection === 'utils'
                                        ? 'border-orange-500 bg-orange-50 font-semibold'
                                        : 'border-transparent hover:bg-gray-50 text-gray-600'
                                        }`}
                                >
                                    <i className="fas fa-tools w-6 text-orange-500"></i>
                                    <span>유틸리티</span>
                                </button>
                                <hr className="my-2 border-gray-100" />
                                <button
                                    onClick={() => setActiveSection('home-customize')}
                                    className={`w-full text-left px-4 py-3 rounded-lg border-l-4 transition-all ${activeSection === 'home-customize'
                                        ? 'border-green-500 bg-green-50 font-semibold text-green-700'
                                        : 'border-transparent hover:bg-gray-50 text-gray-600'
                                        }`}
                                >
                                    <i className="fas fa-magic w-6 text-green-500"></i>
                                    <span>홈 꾸미기</span>
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* 메인 컨텐츠 */}
                    <div className="md:col-span-3">
                        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 border border-gray-100 min-h-[500px]">
                            {loading ? (
                                <div className="h-full flex items-center justify-center py-20">
                                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-400"></div>
                                </div>
                            ) : (
                                <>
                                    {/* 홈 꾸미기 섹션 */}
                                    {activeSection === 'home-customize' && (
                                        <div className="animate-fade-in">
                                            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center border-b pb-4">
                                                <i className="fas fa-magic mr-3 text-green-500 text-3xl"></i>내 홈페이지 꾸미기
                                            </h2>
                                            <p className="text-gray-500 text-sm mb-6">설정을 바꾸면 메인 페이지가 나만의 모습으로 바뀝니다.</p>

                                            {/* 현재 설정 요약 카드 */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                                                    <div className="text-xs font-bold text-green-600 mb-1 uppercase">퀵메뉴</div>
                                                    <div className="text-2xl font-black text-green-700">{homeConfig.quickMenuItems.length}개</div>
                                                    <div className="text-xs text-green-500 mt-1">선택됨</div>
                                                </div>
                                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                                                    <div className="text-xs font-bold text-blue-600 mb-1 uppercase">레이아웃</div>
                                                    <div className="text-lg font-black text-blue-700">
                                                        {homeConfig.theme.layout === 'portal' ? '포털형' : homeConfig.theme.layout === 'minimal' ? '미니멀' : '카드형'}
                                                    </div>
                                                    <div className="text-xs text-blue-500 mt-1">{homeConfig.theme.colorScheme} 테마</div>
                                                </div>
                                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                                                    <div className="text-xs font-bold text-purple-600 mb-1 uppercase">설정 상태</div>
                                                    <div className="text-lg font-black text-purple-700">
                                                        {homeConfig.isConfigured ? '✅ 완료' : '⚙️ 기본값'}
                                                    </div>
                                                    <div className="text-xs text-purple-500 mt-1">{homeConfig.isConfigured ? '맞춤 설정 적용중' : '아직 설정 전'}</div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setShowWizard(true)}
                                                className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-lg rounded-2xl transition-all hover:shadow-lg flex items-center justify-center gap-3 group"
                                            >
                                                <i className="fas fa-magic text-xl group-hover:rotate-12 transition-transform"></i>
                                                {homeConfig.isConfigured ? '설정 다시 하기' : '지금 내 홈 꾸미기 시작!'}
                                            </button>

                                            {homeConfig.isConfigured && (
                                                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                                    <h4 className="font-bold text-yellow-800 text-sm mb-2"><i className="fas fa-info-circle mr-1"></i>현재 나만의 설정</h4>
                                                    <ul className="text-xs text-yellow-700 space-y-1">
                                                        <li>• 주 관심사: {homeConfig.preferences.mainInterest === 'news' ? '뉴스' : homeConfig.preferences.mainInterest === 'games' ? '게임' : homeConfig.preferences.mainInterest === 'utility' ? '유틸리티' : '금융'}</li>
                                                        <li>• 뉴스 카테고리: {homeConfig.preferences.newsCategories.join(', ') || '전체'}</li>
                                                        {homeConfig.theme.greeting && <li>• 인사말: "{homeConfig.theme.greeting}"</li>}
                                                        <li>• 즐겨하는 게임: {homeConfig.preferences.favoriteGames.length > 0 ? homeConfig.preferences.favoriteGames.join(', ') : '없음'}</li>
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 뉴스 섹션 */}
                                    {activeSection === 'news' && (
                                        <div className="animate-fade-in">
                                            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center border-b pb-4">
                                                <i className="fas fa-newspaper mr-3 text-sky-500 text-3xl"></i>뉴스
                                            </h2>

                                            <div className="mb-10">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                                        <i className="fas fa-hashtag text-sky-500 mr-2"></i>키워드 구독 뉴스
                                                    </h3>
                                                    <div className="flex gap-2">
                                                        {newsData.keywords.length > 0 && newsData.keywords.map(kw => (
                                                            <span key={kw.id || kw.keyword} className="inline-flex items-center px-2 py-1 rounded bg-sky-50 text-sky-700 text-xs font-semibold border border-sky-100">
                                                                #{kw.keyword}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    {newsData.keywordNews && newsData.keywordNews.length > 0 ? (
                                                        newsData.keywordNews.map(news => (
                                                            <div key={news.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-white">
                                                                <h4 className="font-bold text-gray-900 mb-2 truncate text-lg">
                                                                    <Link to={`/news/${news.id}`} className="hover:text-brand-green">{news.title}</Link>
                                                                </h4>
                                                                <div className="text-gray-600 text-sm mb-3 line-clamp-2">
                                                                    {news.summary || news.description || '내용이 없습니다.'}
                                                                </div>
                                                                <div className="flex items-center text-sm text-gray-500 gap-3">
                                                                    <span className="px-2.5 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-700">{news.category || '기타'}</span>
                                                                    <span><i className="far fa-clock mr-1"></i> {new Date(news.published_at || news.created_at).toLocaleDateString('ko-KR')}</span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-gray-500 text-sm py-4 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">구독한 키워드와 일치하는 뉴스가 없습니다</div>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                                    <i className="fas fa-bookmark text-amber-500 mr-2"></i>북마크한 뉴스
                                                </h3>
                                                <div className="space-y-4">
                                                    {newsData.bookmarks.length > 0 ? (
                                                        newsData.bookmarks.map(bm => (
                                                            <div key={bm.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-white">
                                                                <h4 className="font-bold text-gray-900 mb-2 truncate text-lg">
                                                                    <Link to={`/news/${bm.news_id || bm.id}`} className="hover:text-brand-green">{bm.title}</Link>
                                                                </h4>
                                                                <div className="flex items-center text-sm text-gray-500 gap-3">
                                                                    <span className="px-2.5 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-700">{bm.category || '기타'}</span>
                                                                    <span><i className="far fa-clock mr-1"></i> {new Date(bm.published_at || bm.created_at || Date.now()).toLocaleDateString('ko-KR')}</span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-gray-500 text-sm py-4 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">북마크한 뉴스가 없습니다</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 주식 섹션 */}
                                    {activeSection === 'stocks' && (
                                        <div className="animate-fade-in">
                                            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center border-b pb-4">
                                                <i className="fas fa-chart-line mr-3 text-green-500 text-3xl"></i>주식
                                            </h2>

                                            <div className="mb-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-md">
                                                    <div className="text-sm opacity-90 mb-1 font-medium">총 종목 수</div>
                                                    <div className="text-3xl font-black">{stocksData.stats.total_stocks || 0}</div>
                                                </div>
                                                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-5 text-white shadow-md">
                                                    <div className="text-sm opacity-90 mb-1 font-medium">미국 주식</div>
                                                    <div className="text-3xl font-black">{stocksData.stats.market_distribution?.US || 0}</div>
                                                </div>
                                                <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-5 text-white shadow-md">
                                                    <div className="text-sm opacity-90 mb-1 font-medium">한국 주식</div>
                                                    <div className="text-3xl font-black">{stocksData.stats.market_distribution?.KR || 0}</div>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                                    <i className="fas fa-star text-yellow-400 mr-2"></i>관심 종목
                                                </h3>
                                                <div className="space-y-3">
                                                    {stocksData.watchlist.length > 0 ? (
                                                        stocksData.watchlist.map(stock => (
                                                            <div key={stock.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                                <div className="flex items-center gap-4">
                                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${stock.market_type === 'US' ? 'bg-indigo-500' : 'bg-teal-500'}`}>
                                                                        {stock.stock_symbol.substring(0, 2)}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                                                            {stock.stock_name}
                                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${stock.market_type === 'US' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'bg-teal-50 text-teal-600 border border-teal-200'}`}>
                                                                                {stock.market_type}
                                                                            </span>
                                                                        </h4>
                                                                        <div className="text-sm text-gray-500 font-mono mt-0.5">{stock.stock_symbol}</div>
                                                                    </div>
                                                                </div>

                                                                <div className="text-right flex space-x-4 sm:space-x-0 sm:flex-col items-end justify-center">
                                                                    {stock.target_price && (
                                                                        <div className="text-sm font-semibold text-gray-700 bg-gray-50 px-3 py-1 rounded-md">
                                                                            목표가: <span className="text-brand-green">{Number(stock.target_price).toLocaleString()}{stock.market_type === 'KR' ? '원' : '$'}</span>
                                                                        </div>
                                                                    )}
                                                                    {stock.memo && (
                                                                        <div className="text-xs text-gray-400 mt-2 truncate w-40 flex-1">{stock.memo}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-gray-500 text-sm py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">관심 종목이 없습니다</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 게임 섹션 */}
                                    {activeSection === 'games' && (
                                        <div className="animate-fade-in">
                                            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center border-b pb-4">
                                                <i className="fas fa-gamepad mr-3 text-purple-500 text-3xl"></i>게임
                                            </h2>

                                            <div className="mb-10">
                                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                                    <i className="fas fa-trophy text-yellow-500 mr-2"></i>최고 기록
                                                </h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {Object.keys(gamesData.stats).length > 0 ? (
                                                        Object.keys(gamesData.stats).map(gameType => {
                                                            const stat = gamesData.stats[gameType];
                                                            return (
                                                                <div key={gameType} className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-5 text-white shadow-md relative overflow-hidden">
                                                                    <i className="fas fa-medal absolute right-4 top-4 text-4xl opacity-20"></i>
                                                                    <div className="text-sm opacity-90 mb-1 font-medium font-mono">{gameType}</div>
                                                                    <div className="text-3xl font-black mb-3">{stat.best_score || stat.high_score}점</div>
                                                                    <div className="text-xs opacity-80 bg-white/20 inline-block px-2 py-1 rounded">플레이: {stat.play_count}회</div>
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="text-gray-500 text-sm sm:col-span-2 py-6 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">게임 기록이 없습니다</div>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                                    <i className="fas fa-history text-gray-400 mr-2"></i>최근 플레이
                                                </h3>
                                                <div className="space-y-3">
                                                    {gamesData.history.length > 0 ? (
                                                        gamesData.history.map((game, i) => (
                                                            <div key={i} className="border border-gray-200 rounded-xl p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                                                                        <i className="fas fa-play"></i>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-bold text-gray-900 font-mono">{game.game_type}</h4>
                                                                        <div className="text-xs text-gray-400">{new Date(game.played_at || game.created_at).toLocaleString('ko-KR')}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-xl font-bold text-purple-600">{game.score}점</div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-gray-500 text-sm py-4 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">최근 플레이 기록이 없습니다</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 유틸리티 섹션 */}
                                    {activeSection === 'utils' && (
                                        <div className="animate-fade-in">
                                            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center border-b pb-4">
                                                <i className="fas fa-tools mr-3 text-orange-500 text-3xl"></i>유틸리티
                                            </h2>

                                            <div className="mb-10">
                                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                                    <i className="fas fa-cog text-gray-500 mr-2"></i>저장된 설정
                                                </h3>
                                                <div className="space-y-4">
                                                    {Object.keys(utilsData.settings).length > 0 ? (
                                                        Object.keys(utilsData.settings).map(utilType => (
                                                            <div key={utilType} className="border border-gray-200 rounded-xl overflow-hidden hover:border-orange-200 transition-colors">
                                                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                                                    <h4 className="font-bold text-gray-800 flex items-center">
                                                                        <i className="fas fa-wrench mr-2 text-orange-400"></i>{utilType}
                                                                    </h4>
                                                                </div>
                                                                <div className="p-4">
                                                                    <pre className="text-xs text-slate-600 bg-slate-50 p-4 rounded-lg overflow-x-auto border border-slate-100 font-mono">
                                                                        {JSON.stringify(utilsData.settings[utilType], null, 2)}
                                                                    </pre>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-gray-500 text-sm py-6 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">저장된 설정이 없습니다</div>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                                    <i className="fas fa-stream text-gray-400 mr-2"></i>사용 히스토리
                                                </h3>
                                                <div className="space-y-4">
                                                    {utilsData.history.length > 0 ? (
                                                        utilsData.history.map((item, i) => (
                                                            <div key={i} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                                                                <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-3">
                                                                    <div className="font-bold text-gray-800 flex items-center">
                                                                        <div className="w-2 h-2 rounded-full bg-orange-400 mr-2"></div>
                                                                        {item.util_type}
                                                                    </div>
                                                                    <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                                                        {new Date(item.created_at).toLocaleString('ko-KR')}
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm max-h-40 overflow-hidden relative">
                                                                    <div>
                                                                        <span className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Input Data</span>
                                                                        <p className="text-gray-600 font-mono text-xs break-all truncate">
                                                                            {typeof item.input_data === 'object' ? JSON.stringify(item.input_data) : item.input_data}
                                                                        </p>
                                                                    </div>
                                                                    {item.result_data && (
                                                                        <div>
                                                                            <span className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Result</span>
                                                                            <p className="text-gray-600 font-mono text-xs break-all truncate">
                                                                                {typeof item.result_data === 'object' ? JSON.stringify(item.result_data) : item.result_data}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-gray-500 text-sm py-6 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">사용 기록이 없습니다</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />

            {/* 홈 꾸미기 마법사 모달 */}
            {showWizard && (
                <PreferenceWizard
                    currentConfig={homeConfig}
                    isSaving={isHomeSaving}
                    onSave={async (newConfig: HomepageConfig) => {
                        updateHomeConfig(newConfig);
                        const ok = await saveHomeConfig(newConfig);
                        if (ok) {
                            setShowWizard(false);
                        }
                    }}
                    onClose={() => setShowWizard(false)}
                />
            )}
        </div>
    );
}
