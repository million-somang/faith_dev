/// <reference types="vite/client" />
import { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { trackPageView } from './utils/analytics';
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
import { Card, NewsCard, Header, Footer, QuickMenu } from '@faithportal/ui';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import { PageSEO } from './components/PageSEO';

import UtilityPage from './pages/UtilityPage';
import FinancePage from './pages/FinancePage';
import GamePage from './pages/GamePage';
import TetrisInfoPage from './pages/TetrisInfoPage';
import GameInfoPage from './pages/GameInfoPage';
import GamePlayPage from './pages/GamePlayPage';
import MyPage from './pages/MyPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import NewsPage from './pages/NewsPage';
import NewsSourcesPage from './pages/NewsSourcesPage';
import NewsBySourcePage from './pages/NewsBySourcePage';
import NewsDetailPage from './pages/NewsDetailPage';
import { AuthProvider } from './context/AuthContext';
import { UserPreferenceProvider } from './context/UserPreferenceContext';
import { useUserPreferenceContext } from './context/UserPreferenceContext';
import { PersonalizedLayout } from './components/homepage/PersonalizedLayout';
import { PreferenceWizard } from './components/homepage/PreferenceWizard';
import { HomepageConfig } from './types/homepage.types';
import { MobileTabBar } from './components/MobileTabBar';
import { BannerSlot } from './components/BannerSlot';

function HomePage() {
    console.log('HomePage rendering...');
    const { user, logout } = useAuth();
    const [news, setNews] = useState<{ id: number; news_id?: number; title: string; summary?: string; description?: string; category?: string; published_at?: string; created_at?: string; tags?: string; relatedStocks?: { name: string }[]; vote_up?: number; vote_down?: number }[]>([]);
    const [health, setHealth] = useState<{ status: string } | null>(null);
    const [showWizard, setShowWizard] = useState(false);
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
                title="FaithLink - 실시간 뉴스, 미니게임, 생활도구 포털"
                description="FaithLink에서 최신 실시간 뉴스, 재미있는 미니게임(테트리스, 스도쿠, 2048), 유용한 생활 계산기를 한곳에서 이용하세요."
                path="/"
            />
            <Header user={user} onLogout={logout} />

            {/* 메인 콘텐츠 */}
            <main className="flex-1 max-w-6xl mx-auto px-1 sm:px-4 py-12 w-full">
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
                        {/* Hero Section */}
                        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white px-6 sm:px-12 py-12 sm:py-16 mb-12 shadow-xl">
                            {/* 장식용 원형 그래픽 */}
                            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 pointer-events-none"></div>
                            <div className="absolute -bottom-28 -left-16 w-80 h-80 rounded-full bg-indigo-400/20 pointer-events-none"></div>
                            <div className="absolute top-10 right-1/4 w-20 h-20 rounded-full bg-white/5 pointer-events-none"></div>

                            <div className="relative max-w-3xl mx-auto text-center">
                                <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
                                    세상의 모든 정보를 한곳에서
                                </h1>
                                <p className="text-blue-100 text-sm sm:text-base mb-8 font-medium">
                                    실시간 뉴스 · 금융 시세 · 미니게임 · 생활 도구까지, FaithPortal 하나면 충분해요
                                </p>

                                {/* 검색창 */}
                                <div className="bg-white rounded-full shadow-2xl flex items-center px-6 py-3 max-w-2xl mx-auto">
                                    <i className="fas fa-search text-blue-500 mr-3"></i>
                                    <input
                                        type="text"
                                        placeholder="무엇을 찾으시나요?"
                                        className="flex-1 bg-transparent border-none outline-none text-base text-gray-900 placeholder-gray-400 font-medium"
                                    />
                                    <button
                                        className="flex items-center justify-center px-5 py-2 rounded-full bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all ml-3"
                                        aria-label="검색"
                                    >
                                        검색
                                    </button>
                                </div>

                                {/* 핵심 서비스 배지 */}
                                <div className="flex flex-wrap justify-center gap-2 mt-6">
                                    {[
                                        { label: '실시간 뉴스', icon: 'fa-newspaper', href: '/news' },
                                        { label: '금융 시세', icon: 'fa-chart-line', href: '/finance' },
                                        { label: '미니게임', icon: 'fa-gamepad', href: '/game' },
                                        { label: '생활 도구', icon: 'fa-tools', href: '/lifestyle' },
                                    ].map(b => (
                                        <a key={b.label} href={b.href}
                                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm text-xs font-bold transition-colors">
                                            <i className={`fas ${b.icon} text-[10px]`}></i> {b.label}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Quick Menu */}
                        <QuickMenu />

                        {/* 2-Column Layout */}
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Left Column: News */}
                            <div className="w-full lg:w-[728px] shrink-0 flex flex-col gap-8">
                                {/* 배너 슬롯: 홈 메인 상단 (관리자 > 배너관리에서 관리) */}
                                <BannerSlot slotKey="home_main_top" />

                                {/* News Section */}
                                <Card className="p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-3">
                                                <i className="fas fa-newspaper text-white text-lg"></i>
                                            </div>
                                            <span>실시간 뉴스</span>
                                            <span className="ml-3 text-[10px] bg-red-500 text-white px-2 py-1 rounded-full animate-pulse-slow font-bold">LIVE</span>
                                        </h3>
                                        <a href="/news" className="text-sm font-medium text-gray-500 hover:text-brand-green flex items-center gap-1 transition-colors">
                                            더보기 <i className="fas fa-chevron-right text-xs"></i>
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
                            </div>

                            {/* Right Column: Widgets */}
                            <div className="flex-1 flex flex-col gap-4">
                                {/* MyPage Widget (PC 사이드바 전용 — 모바일에서는 숨김) */}
                                <Card className="p-6 hidden lg:block">
                                    {user ? (
                                        <>
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                                    <i className="fas fa-user-check text-xl"></i>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{user.name}님 환영합니다!</h4>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Link to="/mypage" className="flex-1 py-2 bg-white border border-blue-600 text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors text-center flex items-center justify-center">마이페이지</Link>
                                                <button onClick={logout} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors text-center flex items-center justify-center">로그아웃</button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                                    <i className="fas fa-user text-xl"></i>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900">환영합니다!</h4>
                                                    <p className="text-xs text-gray-500">로그인하고 더 많은 혜택을 받으세요</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Link to="/login" className="flex-1 py-2 bg-white border border-blue-600 text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors text-center flex items-center justify-center">로그인</Link>
                                                <Link to="/signup" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors text-center flex items-center justify-center">회원가입</Link>
                                            </div>
                                        </>
                                    )}
                                </Card>

                                {/* Trends Widget */}
                                <Card className="p-6">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <i className="fas fa-chart-line text-orange-500"></i> 실시간 트렌드
                                    </h3>
                                    <div className="space-y-3">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-3">
                                                    <span className="rank-number text-sm">{i}</span>
                                                    <span className="text-gray-700 font-medium">검색어 트렌드 {i}</span>
                                                </div>
                                                <i className="fas fa-minus text-gray-300 text-[10px]"></i>
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                {/* System Monitor Widget */}
                                <Card className="p-4 bg-gray-50 border-none shadow-none">
                                    <h4 className="text-xs font-bold text-gray-400 mb-2">SYSTEM MONITOR</h4>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-gray-500">Backend Status</span>
                                        <span className={`w-2 h-2 rounded-full ${health?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    </div>
                                </Card>
                            </div>
                        </div>

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

function App() {
    console.log('App rendering...');
    usePageTracking();

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
                <Routes>
                    <Route path="/admin/*" element={<AdminRedirect />} />
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/lifestyle" element={<UtilityPage />} />
                    <Route path="/finance" element={<FinancePage />} />
                    <Route path="/game" element={<GamePage />} />
                    <Route path="/game/tetris" element={<TetrisInfoPage />} />
                    <Route path="/game/play/tetris" element={<GamePlayPage />} />
                    <Route path="/game/:gameId" element={<GameInfoPage />} />
                    <Route path="/mypage" element={<MyPage />} />
                    <Route path="/news" element={<NewsPage />} />
                    <Route path="/news/sources" element={<NewsSourcesPage />} />
                    <Route path="/news/source/:source" element={<NewsBySourcePage />} />
                    <Route path="/news/:id" element={<NewsDetailPage />} />
                    <Route path="*" element={
                        <div className="min-h-screen flex flex-col pt-20">
                            <div className="flex-1 flex items-center justify-center text-gray-500 font-bold">준비 중인 서비스입니다 ✨</div>
                        </div>
                    } />
                </Routes>
                <MobileTabBar />
            </UserPreferenceProvider>
        </AuthProvider>
    );
}

export default App;
