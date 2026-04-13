/// <reference types="vite/client" />
import { useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
import { Card, NewsCard, Header, Footer, QuickMenu } from '@faithportal/ui';
import axios from 'axios';
import { useAuth } from './context/AuthContext';

import UtilityPage from './pages/UtilityPage';
import FinancePage from './pages/FinancePage';
import GamePage from './pages/GamePage';
import MyPage from './pages/MyPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import NewsPage from './pages/NewsPage';
import NewsDetailPage from './pages/NewsDetailPage';
import { AuthProvider } from './context/AuthContext';

function HomePage() {
    console.log('HomePage rendering...');
    const { user, logout } = useAuth();
    const [news, setNews] = useState<any[]>([]);
    const [health, setHealth] = useState<any>(null);

    useEffect(() => {
        console.log('HomePage useEffect triggered!');
        // Health check
        axios.get(`${API_BASE_URL}/api/health`).then(res => setHealth(res.data)).catch(e => console.error('Health error:', e));

        // Fetch real-time news
        console.log('Fetching news...');
        axios.get(`${API_BASE_URL}/api/news`).then(res => {
            console.log('Homepage news response success:', res.data.success);
            if (res.data && res.data.success) {
                setNews(res.data.newsletters || res.data.news || []);
            }
        }).catch(e => {
            console.error('Homepage news error:', e);
            if (e.response) console.error('Error status:', e.response.status, e.response.data);
        });
    }, []);

    console.log('HomePage render, news.length:', news.length);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Header user={user} onLogout={logout} />

            {/* 메인 비주얼 영역 */}
            <main className="flex-1 max-w-6xl mx-auto px-4 py-12 w-full">
                {/* Main Search Area (Matches original design) */}
                <div className="mb-16 max-w-3xl mx-auto">
                    <div className="relative search-shadow">
                        <div className="flex items-center px-6 py-4">
                            <input
                                type="text"
                                placeholder="무엇을 찾으시나요?"
                                className="flex-1 bg-transparent border-none outline-none text-lg text-gray-900 placeholder-gray-400 font-medium"
                            />
                            <button
                                className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-green text-white hover:bg-brand-green-hover transition-all ml-4"
                            >
                                <i className="fas fa-search text-xl"></i>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Menu (Restored) */}
                <QuickMenu />


                {/* 2-Column Layout */}
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Column: News & Banner */}
                    <div className="w-full lg:w-[728px] shrink-0 flex flex-col gap-8">
                        {/* Coupang Banner */}
                        <div className="w-full flex justify-center">
                            <iframe 
                                src="https://ads-partners.coupang.com/banners/959332?subId=&traceId=V0-301-879dd1202e5c73b2-I959332&w=728&h=90" 
                                width="728" 
                                height="90" 
                                frameBorder="0" 
                                scrolling="no" 
                                referrerPolicy="unsafe-url"
                                className="max-w-full"
                            ></iframe>
                        </div>

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
                        {/* MyPage Widget */}
                        <Card className="p-6">
                            {user ? (
                                <>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-[#03c75a]">
                                            <i className="fas fa-user-check text-xl"></i>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{user.name}님 환영합니다!</h4>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Link to="/mypage" className="flex-1 py-2 bg-white border border-[#03c75a] text-[#03c75a] rounded-lg font-bold text-sm hover:bg-green-50 transition-colors text-center flex items-center justify-center">마이페이지</Link>
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
                                        <Link to="/login" className="flex-1 py-2 bg-white border border-[#03c75a] text-[#03c75a] rounded-lg font-bold text-sm hover:bg-green-50 transition-colors text-center flex items-center justify-center">로그인</Link>
                                        <Link to="/signup" className="flex-1 py-2 bg-[#03c75a] text-white rounded-lg font-bold text-sm hover:bg-[#02b350] transition-colors text-center flex items-center justify-center">회원가입</Link>
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
            </main>

            <Footer />
        </div>
    );
}

function AdminRedirect() {
    useEffect(() => {
        window.location.href = 'http://localhost:4200/admin?t=' + Date.now();
    }, []);
    return <div className="min-h-screen flex items-center justify-center">관리자 페이지로 이동 중입니다...</div>;
}

function App() {
    console.log('App rendering...');

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
            <Routes>
                <Route path="/admin/*" element={<AdminRedirect />} />
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/lifestyle" element={<UtilityPage />} />
                <Route path="/finance" element={<FinancePage />} />
                <Route path="/game" element={<GamePage />} />
                <Route path="/mypage" element={<MyPage />} />
                <Route path="/news" element={<NewsPage />} />
                <Route path="/news/:id" element={<NewsDetailPage />} />
                <Route path="*" element={
                    <div className="min-h-screen flex flex-col pt-20">
                        <div className="flex-1 flex items-center justify-center text-gray-500 font-bold">준비 중인 서비스입니다 ✨</div>
                    </div>
                } />
            </Routes>
        </AuthProvider>
    );
}

export default App;
