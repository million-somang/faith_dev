/// <reference types="vite/client" />
import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { trackPageView } from './utils/analytics';
import { Header, Footer } from '@faithportal/ui';
import { useAuth } from './context/AuthContext';
import { AuthProvider } from './context/AuthContext';
import { UserPreferenceProvider } from './context/UserPreferenceContext';
import { MobileTabBar } from './components/MobileTabBar';

// 핵심 첫 진입 페이지는 정적 로딩 (빠른 초기 FCP 보장)
import HomePage from './pages/HomePage';

// 서브 라우트는 React.lazy() 코드 스플리팅 적용 (초기 번들 크기 70% 이상 경량화)
const UtilityPage = lazy(() => import('./pages/UtilityPage'));
const FinancePage = lazy(() => import('./pages/FinancePage'));
const FinanceUtilPage = lazy(() => import('./pages/FinanceUtilPage'));
const RewardLayout = lazy(() => import('./pages/reward/RewardLayout'));
const RewardHome = lazy(() => import('./pages/reward/RewardHome'));
const RewardAttendance = lazy(() => import('./pages/reward/RewardAttendance'));
const RewardMissions = lazy(() => import('./pages/reward/RewardMissions'));
const RewardExchange = lazy(() => import('./pages/reward/RewardExchange'));
const GamePage = lazy(() => import('./pages/GamePage'));
const GameInfoPage = lazy(() => import('./pages/GameInfoPage'));
const MyPage = lazy(() => import('./pages/MyPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const NewsWritePage = lazy(() => import('./pages/NewsWritePage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const NewsSourcesPage = lazy(() => import('./pages/NewsSourcesPage'));
const NewsBySourcePage = lazy(() => import('./pages/NewsBySourcePage'));
const NewsDetailPage = lazy(() => import('./pages/NewsDetailPage'));
const EntertainmentPage = lazy(() => import('./pages/EntertainmentPage'));
const SajuInfoPage = lazy(() => import('./pages/SajuInfoPage'));
const NovelPage = lazy(() => import('./pages/NovelPage'));
const LoungePage = lazy(() => import('./pages/LoungePage'));
const LoungeTopicPage = lazy(() => import('./pages/LoungeTopicPage'));
const B2BPage = lazy(() => import('./pages/B2BPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const AboutUsPage = lazy(() => import('./pages/AboutUsPage'));
const ContactUsPage = lazy(() => import('./pages/ContactUsPage'));
const GuidesHubPage = lazy(() => import('./pages/GuidesHubPage'));
const GuideDetailPage = lazy(() => import('./pages/GuideDetailPage'));
const EditorialPolicyPage = lazy(() => import('./pages/EditorialPolicyPage'));
const ShoppingPage = lazy(() => import('./pages/ShoppingPage'));

function PageFallback() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
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
            if (event.data?.source === 'FAITHLINK_MINI_APP') {
                if (event.data.type === 'MISSION_CLEAR' || event.data.type === 'POINTS_UPDATED') {
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
                <Suspense fallback={<PageFallback />}>
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
                        <Route path="/guides" element={<GuidesHubPage />} />
                        <Route path="/guides/:slug" element={<GuideDetailPage />} />
                        <Route path="/blog" element={<GuidesHubPage />} />
                        <Route path="/blog/:slug" element={<GuideDetailPage />} />
                        <Route path="/privacy" element={<PrivacyPolicyPage />} />
                        <Route path="/terms" element={<TermsOfServicePage />} />
                        <Route path="/about" element={<AboutUsPage />} />
                        <Route path="/contact" element={<ContactUsPage />} />
                        <Route path="/editorial-policy" element={<EditorialPolicyPage />} />
                        <Route path="/ads.txt" element={
                            <pre style={{ margin: 0, padding: '16px', fontFamily: 'monospace', fontSize: '14px', backgroundColor: '#fff', color: '#000' }}>
                                google.com, pub-9041638273592776, DIRECT, f08c47fec0942fa0
                            </pre>
                        } />
                        <Route path="*" element={<NotFoundOrDevPage />} />
                    </Routes>
                </Suspense>
                <MobileTabBar />
            </UserPreferenceProvider>
        </AuthProvider>
    );
}

export default App;
