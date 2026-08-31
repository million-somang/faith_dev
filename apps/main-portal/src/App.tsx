/// <reference types="vite/client" />
import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { trackPageView } from './utils/analytics';
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
import { Card, NewsCard, Header, Footer } from '@faithportal/ui';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import { PageSEO } from './components/PageSEO';

import UtilityPage from './pages/UtilityPage';
import FinancePage from './pages/FinancePage';
import FinanceUtilPage from './pages/FinanceUtilPage';
import RewardLayout from './pages/reward/RewardLayout';
import RewardHome from './pages/reward/RewardHome';
import RewardAttendance from './pages/reward/RewardAttendance';
import RewardMissions from './pages/reward/RewardMissions';
import RewardExchange from './pages/reward/RewardExchange';
import GamePage from './pages/GamePage';
import TetrisInfoPage from './pages/TetrisInfoPage';
import GameInfoPage from './pages/GameInfoPage';
import GamePlayPage from './pages/GamePlayPage';
import MyPage from './pages/MyPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import NewsPage from './pages/NewsPage';
import NewsWritePage from './pages/NewsWritePage';
import SearchPage from './pages/SearchPage';
import NewsSourcesPage from './pages/NewsSourcesPage';
import NewsBySourcePage from './pages/NewsBySourcePage';
import NewsDetailPage from './pages/NewsDetailPage';
import EntertainmentPage from './pages/EntertainmentPage';
import SajuInfoPage from './pages/SajuInfoPage';
import NovelPage from './pages/NovelPage';
import LoungePage from './pages/LoungePage';
import LoungeTopicPage from './pages/LoungeTopicPage';
import LoungeBattlePopupPage from './pages/LoungeBattlePopupPage';
import B2BPage from './pages/B2BPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import AboutUsPage from './pages/AboutUsPage';
import ContactUsPage from './pages/ContactUsPage';
import GuidesHubPage from './pages/GuidesHubPage';
import GuideDetailPage from './pages/GuideDetailPage';
import ShoppingPage from './pages/ShoppingPage';
import { GUIDES_DATA } from './data/guidesData';
import { AuthProvider } from './context/AuthContext';
import { UserPreferenceProvider } from './context/UserPreferenceContext';
import { useUserPreferenceContext } from './context/UserPreferenceContext';
import { PersonalizedLayout } from './components/homepage/PersonalizedLayout';
import { PreferenceWizard } from './components/homepage/PreferenceWizard';
import { HomepageConfig } from './types/homepage.types';
import { MobileTabBar } from './components/MobileTabBar';
import { BannerSlot } from './components/BannerSlot';
import { WeatherWidget } from './components/homepage/WeatherWidget';
import { StockWidget } from './components/homepage/StockWidget';
import { SidebarShoppingWidget } from './components/homepage/SidebarShoppingWidget';
import { CoreServicesShowcase } from './components/homepage/CoreServicesShowcase';

function HomePage() {
    console.log('HomePage rendering...');
    const { user, logout, isLoading: isAuthLoading } = useAuth();
    const { lang } = useLanguage();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [news, setNews] = useState<{ id: number; news_id?: number; title: string; summary?: string; description?: string; category?: string; published_at?: string; created_at?: string; tags?: string; relatedStocks?: { name: string }[]; vote_up?: number; vote_down?: number }[]>([]);
    const [health, setHealth] = useState<{ status: string } | null>(null);
    const [showWizard, setShowWizard] = useState(false);

    useEffect(() => {
        if (!isAuthLoading && user) {
            navigate('/mypage', { replace: true });
        }
    }, [user, isAuthLoading, navigate]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const q = searchQuery.trim();
        if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
    };
    const { config, isLoading: isPrefLoading, isSaving, updateConfig, saveConfig } = useUserPreferenceContext();

    useEffect(() => {
        console.log('HomePage useEffect triggered!');
        // Health check
        axios.get<{ status: string }>(`${API_BASE_URL}/api/health`).then(res => setHealth(res.data)).catch(e => console.error('Health error:', e));

        // Fetch real-time news
        console.log('Fetching news...');
        axios.get<{ success: boolean; newsletters?: typeof news; news?: typeof news }>(`${API_BASE_URL}/api/news`).then(res => {
            console.log('Homepage news response success:', res.data.success);
            if (res.data && res.data.success) {
                setNews(res.data.newsletters || res.data.news || []);
            }
        }).catch(e => {
            console.error('Homepage news error:', e);
        });
    }, []);

    console.log('HomePage render, news.length:', news.length);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <PageSEO
                title="VERA - 실시간 뉴스, 미니게임, 생활도구 포털"
                description="VERA에서 최신 실시간 뉴스, 재미있는 미니게임(테트리스, 스도쿠, 2048), 유용한 생활 계산기를 한곳에서 이용하세요."
                path="/"
            />
            <Header user={user} onLogout={logout} />

            {/* 메인 콘텐츠 */}
            <main className="flex-1 max-w-6xl mx-auto px-1 sm:px-4 py-8 w-full">
                
                {/* 3대 분야 인트로 웰컴 카드 배너 */}


                {isPrefLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : config.isConfigured ? (
                    /* 개인화 레이아웃 (설정 완료된 사용자) */
                    <PersonalizedLayout
                        config={config}
                        user={user}
                        news={news}
                        health={health}
                        onOpenWizard={() => setShowWizard(true)}
                        logout={logout}
                    />
                ) : (
                    /* 기본 레이아웃 (미설정 또는 새 사용자) */
                    <>
                        {/* VERA Lounge 실시간 띠배너 */}
                        <div 
                            onClick={() => navigate('/lounge/topic/비트코인')}
                            className="flex items-center justify-between px-4.5 py-3 bg-gradient-to-r from-rose-600 via-violet-600 to-indigo-600 text-white rounded-2xl shadow-md mb-6 hover:opacity-95 transition-all hover:translate-y-[-1px] cursor-pointer group"
                        >
                            <div className="flex items-center gap-2">
                                <span className="bg-white/20 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">LIVE 🔥</span>
                                <span className="text-xs sm:text-sm font-black tracking-tight text-white">
                                    {lang === 'en' ? 'VERA Lounge Hot Debate: Bitcoin Sudden Crash Emergency Discussion' : '지금 VERA 라운지 격론 중: 비트코인 급락 수습 방안 긴급 대토론'}
                                </span>
                            </div>
                            <span className="text-xs font-black flex items-center gap-1 text-violet-200 group-hover:text-white transition-colors">
                                {lang === 'en' ? 'Go to Live Lounge' : '실시간 라운지 가기'} <i className="fas fa-arrow-right text-[10px] group-hover:translate-x-0.5 transition-transform"></i>
                            </span>
                        </div>

                        {/* Hero Section */}
                        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white px-6 sm:px-12 py-8 sm:py-10 mb-8 shadow-xl">
                            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-indigo-500/10 pointer-events-none blur-3xl"></div>
                            <div className="absolute -bottom-28 -left-16 w-80 h-80 rounded-full bg-purple-500/10 pointer-events-none blur-3xl"></div>

                            <div className="relative max-w-3xl mx-auto text-center">
                                <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold mb-3 border border-white/10">
                                    VERA All-in-One Portal
                                </span>
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
                                    {lang === 'en' ? 'All Services in One Place' : '일상과 재미, 정보를 하나로 잇는 포털'}
                                </h1>
                                <p className="text-slate-300 text-sm sm:text-base mb-6 font-normal">
                                    {lang === 'en' ? 'Real-time news, lifestyle tools, classic games & saju horoscope — all in VERA' : '실시간 뉴스부터 유용한 생활도구, 클래식 미니게임, 정통 사주명리까지'}
                                </p>

                                {/* 검색창 */}
                                <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-xl flex items-center px-5 py-3 max-w-2xl mx-auto">
                                    <i className="fas fa-search text-slate-400 mr-3"></i>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={lang === 'en' ? 'Search news, tools, games, saju...' : '뉴스, 생활도구, 게임, 사주 검색...'}
                                        className="flex-1 bg-transparent border-none outline-none text-sm sm:text-base text-gray-900 placeholder-gray-400 font-medium"
                                    />
                                    <button
                                        type="submit"
                                        className="flex items-center justify-center px-5 py-2 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-slate-800 transition-all ml-2"
                                        aria-label={lang === 'en' ? 'Search' : '검색'}
                                    >
                                        {lang === 'en' ? 'Search' : '검색'}
                                    </button>
                                </form>
                            </div>
                        </section>

                        {/* 2-Column Layout (12열 반응형 그리드로 상단 헤더 너비와 100% 일치) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
                            {/* Left Column: News & Guides */}
                            <div className="lg:col-span-8 flex flex-col gap-6">
                                {/* 배너 슬롯: 홈 메인 상단 (관리자 > 배너관리에서 관리) */}
                                <BannerSlot slotKey="home_main_top" />

                                {/* News Section */}
                                <Card className="p-6 sm:p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-3">
                                                <i className="fas fa-newspaper text-white text-lg"></i>
                                            </div>
                                            <span>{lang === 'en' ? 'Live News' : '실시간 뉴스'}</span>
                                            <span className="ml-3 text-[10px] bg-red-500 text-white px-2 py-1 rounded-full animate-pulse-slow font-bold">LIVE</span>
                                        </h3>
                                        <a href="/news" className="text-sm font-medium text-gray-500 hover:text-brand-green flex items-center gap-1 transition-colors">
                                            {lang === 'en' ? 'More' : '더보기'} <i className="fas fa-chevron-right text-xs"></i>
                                        </a>
                                    </div>

                                    <div className="space-y-1">
                                        {news.length > 0 ? (
                                            news.slice(0, 5).map((item, index) => (
                                                <NewsCard key={item.id} news={item} index={index} hideActions={true} />
                                            ))
                                        ) : (
                                            <div className="text-center py-12 text-gray-400">
                                                <p>뉴스를 불러오는 중입니다...</p>
                                                <p className="text-xs mt-2">(PostgreSQL 컨테이너가 동작 중인지 확인해 주세요)</p>
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                {/* 지식 가이드 & 실전 칼럼 섹션 (AdSense 고가치 콘텐츠) */}
                                <Card className="p-6 sm:p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-3 text-white">
                                                <i className="fas fa-book-open text-lg"></i>
                                            </div>
                                            <span>{lang === 'en' ? 'Guides & Columns' : '지식 가이드 & 칼럼'}</span>
                                            <span className="ml-3 text-[10px] bg-indigo-500 text-white px-2 py-1 rounded-full font-bold">18편</span>
                                        </h3>
                                        <a href="/guides" className="text-sm font-medium text-gray-500 hover:text-brand-green flex items-center gap-1 transition-colors">
                                            {lang === 'en' ? 'All Guides' : '전체보기'} <i className="fas fa-chevron-right text-xs"></i>
                                        </a>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {GUIDES_DATA.slice(0, 4).map(guide => (
                                            <a
                                                key={guide.slug}
                                                href={`/guides/${guide.slug}`}
                                                className="p-4 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group block"
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${guide.categoryColor}`}>
                                                        {guide.categoryLabel}
                                                    </span>
                                                    <span className="text-gray-400 text-[11px] font-medium">{guide.readTime}</span>
                                                </div>
                                                <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors text-sm line-clamp-2 leading-snug mb-1">
                                                    {guide.title}
                                                </h4>
                                                <p className="text-gray-500 text-xs line-clamp-2 font-normal">
                                                    {guide.description}
                                                </p>
                                            </a>
                                        ))}
                                    </div>
                                </Card>
                            </div>

                            {/* Right Column: Widgets — 모바일에서는 배너 위로 올림(order-first) */}
                            <div className="lg:col-span-4 flex flex-col gap-4 order-first lg:order-none">
                                {/* 날씨·증시 — 모바일: 컴팩트 가로 칩 / PC: 큰 카드 */}
                                <div className="flex flex-row gap-2 overflow-x-auto hide-scrollbar pb-1 sm:flex-col sm:gap-4 sm:overflow-x-visible sm:pb-0">
                                    {/* 날씨 위젯 (실제 데이터: Open-Meteo + 자동 위치) */}
                                    <WeatherWidget />

                                    {/* 증시 위젯 (실제 데이터: 환율/국내 종목) */}
                                    <StockWidget />
                                </div>

                                {/* 🛍️ 오늘의 핫딜 & 인기 쇼핑 꿀템 위젯 */}
                                <SidebarShoppingWidget />
                            </div>
                        </div>

                        {/* 포털 3대 핵심 서비스 쇼케이스 카드 (페이지 하단에 위치) */}
                        <CoreServicesShowcase />

                        {/* 홈 꾸미기 플로팅 버튼 (미설정 사용자 유도) */}
                        <button
                            onClick={() => setShowWizard(true)}
                            className="fixed bottom-24 right-4 z-40 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110 group animate-bounce"
                            title="내 홈 꾸미기"
                            aria-label="내 홈페이지 꾸미기"
                        >
                            <i className="fas fa-magic text-lg"></i>
                        </button>
                    </>
                )}
            </main>

            <Footer />

            {/* 홈 꾸미기 마법사 모달 */}
            {showWizard && (
                <PreferenceWizard
                    currentConfig={config}
                    isSaving={isSaving}
                    onSave={async (newConfig: HomepageConfig) => {
                        updateConfig(newConfig);
                        const ok = await saveConfig(newConfig);
                        if (ok) setShowWizard(false);
                    }}
                    onClose={() => setShowWizard(false)}
                />
            )}
        </div>
    );
}

function AdminRedirect() {
    useEffect(() => {
        const isDev = window.location.port === '5000';
        const adminUrl = isDev
            ? 'http://localhost:4200/admin?t=' + Date.now()
            : '/admin?t=' + Date.now();
        window.location.href = adminUrl;
    }, []);
    return <div className="min-h-screen flex items-center justify-center">관리자 페이지로 이동 중입니다...</div>;
}

// 페이지뷰 트래킹 훅
function usePageTracking() {
    const location = useLocation();
    useEffect(() => {
        trackPageView(location.pathname);
    }, [location.pathname]);
}

// 라우트 변경 시 페이지 맨 위로 스크롤
function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
}

function AppTracker() {
    usePageTracking();
    return null;
}

function RewardGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    if (isLoading) return null;
    if (user?.email !== 'sukman@naver.com') {
        return <Navigate to="/guides" replace />;
    }
    return <>{children}</>;
}

function NotFoundOrDevPage() {
    const { user } = useAuth();
    const isDevAdmin = user?.email === 'sukman@naver.com';

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Header user={user} />
            <main className="flex-1 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center">
                    <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                        {isDevAdmin ? '🛠️' : '🔍'}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                        {isDevAdmin ? '개발 중인 서비스 (관리자 모드)' : '요청하신 페이지를 찾을 수 없습니다'}
                    </h2>
                    <p className="text-gray-500 text-sm leading-relaxed mb-6">
                        {isDevAdmin 
                            ? '현재 sukman@naver.com 관리자 계정으로 접속 중입니다. 해당 기능은 개발 중입니다.' 
                            : '입력하신 주소가 잘못되었거나 변경되었습니다. 아래 추천 메뉴로 이동해 보세요.'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <a 
                            href="/" 
                            className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm transition-all"
                        >
                            홈으로 이동
                        </a>
                        <a 
                            href="/guides" 
                            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm transition-all shadow-sm"
                        >
                            지식 가이드 둘러보기
                        </a>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

function App() {
    useEffect(() => {
        const handleAdminMessage = (e: MessageEvent) => {
            if (e.data && e.data.type === 'ADMIN_AUTH') {
                const token = e.data.token;
                if (token) {
                    localStorage.setItem('admin_token', token);
                    window.location.href = '/admin/dashboard';
                }
            }
        };

        window.addEventListener('message', handleAdminMessage);
        return () => window.removeEventListener('message', handleAdminMessage);
    }, []);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Check origin or source if needed in production
            if (event.data?.source === 'FAITHLINK_MINI_APP') {
                console.log('Received from MiniApp:', event.data);

                if (event.data.type === 'MISSION_CLEAR' || event.data.type === 'POINTS_UPDATED') {
                    // Refetch user data or points
                    // This is a global listener, we could trigger a custom event or context update
                    window.dispatchEvent(new CustomEvent('REFRESH_USER_DATA'));
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return (
        <AuthProvider>
            <UserPreferenceProvider>
                <ScrollToTop />
                <AppTracker />
                <Routes>
                    <Route path="/admin/*" element={<AdminRedirect />} />
                    <Route path="/" element={<HomePage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/lifestyle" element={<UtilityPage />} />
                    <Route path="/finance" element={<FinancePage />} />
                    <Route path="/finance/util" element={<FinanceUtilPage />} />
                    <Route path="/finance-util" element={<FinanceUtilPage />} />
                    <Route path="/reward" element={
                        <RewardGuard>
                            <RewardLayout />
                        </RewardGuard>
                    }>
                        <Route index element={<RewardHome />} />
                        <Route path="attendance" element={<RewardAttendance />} />
                        <Route path="missions" element={<RewardMissions />} />
                        <Route path="exchange" element={<RewardExchange />} />
                    </Route>
                    <Route path="/game" element={<GamePage />} />
                    <Route path="/game/tetris" element={<TetrisInfoPage />} />
                    <Route path="/game/play/tetris" element={<GamePlayPage />} />
                    <Route path="/game/:gameId" element={<GameInfoPage />} />
                    <Route path="/entertainment" element={<EntertainmentPage />} />
                    <Route path="/entertainment/saju" element={<SajuInfoPage />} />
                    <Route path="/entertainment/novel" element={<NovelPage />} />
                    <Route path="/entertainment/novel/:novelId" element={<NovelPage />} />
                    <Route path="/novel" element={<NovelPage />} />
                    <Route path="/app/novel" element={<NovelPage />} />
                    <Route path="/app/novel/*" element={<NovelPage />} />
                    <Route path="/shopping" element={<ShoppingPage />} />
                    <Route path="/mypage" element={<MyPage />} />
                    <Route path="/b2b" element={<B2BPage />} />

                    <Route path="/news" element={<NewsPage />} />
                    <Route path="/news/write" element={<NewsWritePage />} />
                    <Route path="/news/create" element={<NewsWritePage />} />
                    <Route path="/news/sources" element={<NewsSourcesPage />} />
                    <Route path="/news/source/:source" element={<NewsBySourcePage />} />
                    <Route path="/news/:id" element={<NewsDetailPage />} />
                    <Route path="/lounge" element={<LoungePage />} />
                    <Route path="/lounge/topic/:topicName" element={<LoungeTopicPage />} />
                    <Route path="/lounge/battle-popup" element={<LoungeBattlePopupPage />} />
                    <Route path="/guides" element={<GuidesHubPage />} />
                    <Route path="/guides/:slug" element={<GuideDetailPage />} />
                    <Route path="/blog" element={<GuidesHubPage />} />
                    <Route path="/blog/:slug" element={<GuideDetailPage />} />
                    <Route path="/privacy" element={<PrivacyPolicyPage />} />
                    <Route path="/terms" element={<TermsOfServicePage />} />
                    <Route path="/about" element={<AboutUsPage />} />
                    <Route path="/contact" element={<ContactUsPage />} />
                    <Route path="/ads.txt" element={
                        <pre style={{ margin: 0, padding: '16px', fontFamily: 'monospace', fontSize: '14px', backgroundColor: '#fff', color: '#000' }}>
                            google.com, pub-9041638273592776, DIRECT, f08c47fec0942fa0
                        </pre>
                    } />
                    <Route path="*" element={<NotFoundOrDevPage />} />
                </Routes>
                <MobileTabBar />
            </UserPreferenceProvider>
        </AuthProvider>
    );
}

export default App;
