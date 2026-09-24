import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, NewsCard, Header, Footer } from '@faithportal/ui';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { PageSEO } from '../components/PageSEO';
import { GUIDES_DATA } from '../data/guidesData';
import { useUserPreferenceContext } from '../context/UserPreferenceContext';
import { PersonalizedLayout } from '../components/homepage/PersonalizedLayout';
import { PreferenceWizard } from '../components/homepage/PreferenceWizard';
import { HomepageConfig } from '../types/homepage.types';
import { BannerSlot } from '../components/BannerSlot';
import { WeatherWidget } from '../components/homepage/WeatherWidget';
import { StockWidget } from '../components/homepage/StockWidget';
import { SidebarGuidesWidget } from '../components/homepage/SidebarGuidesWidget';
import { CoreServicesShowcase } from '../components/homepage/CoreServicesShowcase';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export default function HomePage() {
    const { user, logout } = useAuth();
    const { lang } = useLanguage();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [news, setNews] = useState<{ id: number; news_id?: number; title: string; summary?: string; description?: string; category?: string; published_at?: string; created_at?: string; tags?: string; relatedStocks?: { name: string }[]; vote_up?: number; vote_down?: number }[]>([]);
    const [showWizard, setShowWizard] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const q = searchQuery.trim();
        if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
    };

    const { config, isLoading: isPrefLoading, isSaving, updateConfig, saveConfig } = useUserPreferenceContext();

    useEffect(() => {
        // Fetch real-time news
        axios.get<{ success: boolean; newsletters?: typeof news; news?: typeof news }>(`${API_BASE_URL}/api/news`)
            .then(res => {
                if (res.data && res.data.success) {
                    setNews(res.data.newsletters || res.data.news || []);
                }
            })
            .catch(e => {
                console.error('Homepage news error:', e);
            });
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <PageSEO
                title="VERA - 실시간 뉴스, 미니게임, 생활도구 포털"
                description="VERA에서 최신 실시간 뉴스, 재미있는 미니게임(스도쿠, 2048, 지뢰찾기, 프리셀), 유용한 생활 계산기를 한곳에서 이용하세요."
                path="/"
            />
            <Header user={user} onLogout={logout} />

            {/* 메인 콘텐츠 */}
            <main className="flex-1 max-w-6xl mx-auto px-1 sm:px-4 py-8 w-full">
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
                        health={{ status: 'ok' }}
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
                            {/* Left Column: Guides (1순위 고가치 콘텐츠) & News */}
                            <div className="lg:col-span-8 flex flex-col gap-6">
                                {/* 1. 지식 가이드 & 전문 칼럼 섹션 (AdSense 핵심 고가치 오리지널 콘텐츠) */}
                                <Card className="p-6 sm:p-8 border-teal-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                                                <i className="fas fa-book-open text-lg"></i>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-xl sm:text-2xl font-black text-gray-900">
                                                        {lang === 'en' ? 'Knowledge Guides & Columns' : '지식 가이드 & 전문 칼럼'}
                                                    </h3>
                                                    <span className="text-[11px] bg-teal-600 text-white px-2 py-0.5 rounded-full font-bold">25편 완비</span>
                                                </div>
                                            </div>
                                        </div>
                                        <a href="/guides" className="text-xs sm:text-sm font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 transition-colors">
                                            {lang === 'en' ? 'All Guides' : '25편 전체보기'} <i className="fas fa-chevron-right text-xs"></i>
                                        </a>
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-500 mb-6 leading-relaxed">
                                        금융 세무 절세, 부동산 청약, 퇴직금 정산법, 명리학 인문학, 현대 웹소설 작법 및 두뇌 전략 등 VERA 전문 편집팀이 집필한 고유 심층 지식을 제공합니다.
                                    </p>

                                    {/* 6대 대표 칼럼 그리드 */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {GUIDES_DATA.slice(0, 6).map(guide => (
                                            <a
                                                key={guide.slug}
                                                href={`/guides/${guide.slug}`}
                                                className="p-4.5 rounded-2xl border border-gray-150 hover:border-teal-300 hover:bg-teal-50/20 transition-all group block bg-white shadow-xs hover:shadow-sm"
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${guide.categoryColor}`}>
                                                        {guide.categoryLabel}
                                                    </span>
                                                    <span className="text-gray-400 text-[11px] font-medium">{guide.readTime}</span>
                                                    <span className="text-gray-400 text-[11px] font-medium">· {guide.author}</span>
                                                </div>
                                                <h4 className="font-bold text-gray-900 group-hover:text-teal-700 transition-colors text-sm line-clamp-2 leading-snug mb-1.5">
                                                    {guide.title}
                                                </h4>
                                                <p className="text-gray-500 text-xs line-clamp-2 font-normal leading-relaxed">
                                                    {guide.description}
                                                </p>
                                            </a>
                                        ))}
                                    </div>

                                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                        <span>모든 칼럼은 공공 및 전문 데이터에 기반해 상시 업데이트됩니다.</span>
                                        <a href="/guides" className="text-teal-700 font-bold hover:underline flex items-center gap-1">
                                            전체 칼럼 허브 바로가기 →
                                        </a>
                                    </div>
                                </Card>

                                {/* 배너 슬롯: 홈 메인 중단 (배너 존재 시에만 렌더링) */}
                                <BannerSlot slotKey="home_main_top" />

                                {/* 2. 실시간 뉴스 & AI 팩트 브리핑 (공식 언론사 큐레이션) */}
                                <Card className="p-6 sm:p-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-3 text-white shadow-xs">
                                                <i className="fas fa-newspaper text-lg"></i>
                                            </div>
                                            <span>{lang === 'en' ? 'Live News & Fact Briefing' : '실시간 뉴스 & 팩트 브리핑'}</span>
                                            <span className="ml-3 text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">CURATED</span>
                                        </h3>
                                        <a href="/news" className="text-sm font-medium text-gray-500 hover:text-brand-green flex items-center gap-1 transition-colors">
                                            {lang === 'en' ? 'More' : '뉴스 전체보기'} <i className="fas fa-chevron-right text-xs"></i>
                                        </a>
                                    </div>

                                    {/* 언론사 큐레이션 고지 */}
                                    <div className="bg-slate-50 border border-slate-200/70 rounded-xl px-3.5 py-2.5 mb-4 text-xs text-slate-500 flex items-center gap-2">
                                        <i className="fas fa-shield-alt text-teal-600 text-sm"></i>
                                        <span>공식 언론사 뉴스 피드의 핵심 팩트를 추출하고 실생활 영향 분석을 제공하는 브리핑 데스크입니다.</span>
                                    </div>

                                    <div className="space-y-1">
                                        {news.length > 0 ? (
                                            news.slice(0, 5).map((item, index) => (
                                                <NewsCard key={item.id} news={item} index={index} hideActions={true} />
                                            ))
                                        ) : (
                                            <div className="text-center py-12 text-gray-400">
                                                <p>뉴스를 불러오는 중입니다...</p>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </div>

                            {/* Right Column: Widgets — 날씨·증시 + 주간 추천 칼럼 TOP 4 & 도구 */}
                            <div className="lg:col-span-4 flex flex-col gap-4 order-first lg:order-none">
                                {/* 날씨·증시 — 모바일: 컴팩트 가로 칩 / PC: 큰 카드 */}
                                <div className="flex flex-row gap-2 overflow-x-auto hide-scrollbar pb-1 sm:flex-col sm:gap-4 sm:overflow-x-visible sm:pb-0">
                                    {/* 날씨 위젯 (실제 데이터: Open-Meteo + 자동 위치) */}
                                    <WeatherWidget />

                                    {/* 증시 위젯 (실제 데이터: 환율/국내 종목) */}
                                    <StockWidget />
                                </div>

                                {/* 주간 추천 칼럼 TOP 4 & 스마트 계산기 도구 위젯 (쇼핑 제휴 위젯 대체) */}
                                <SidebarGuidesWidget />
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
