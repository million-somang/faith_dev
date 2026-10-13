import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, NewsCard, Header, Footer } from '@faithportal/ui';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { PageSEO } from '../components/PageSEO';
import { GUIDES_DATA, GuideArticle } from '../data/guidesData';
import { useUserPreferenceContext } from '../context/UserPreferenceContext';
import { PersonalizedLayout } from '../components/homepage/PersonalizedLayout';
import { PreferenceWizard } from '../components/homepage/PreferenceWizard';
import { HomepageConfig } from '../types/homepage.types';
import { BannerSlot } from '../components/BannerSlot';
import { WeatherWidget } from '../components/homepage/WeatherWidget';
import { StockWidget } from '../components/homepage/StockWidget';
import { SidebarGuidesWidget } from '../components/homepage/SidebarGuidesWidget';
import { CoreServicesShowcase } from '../components/homepage/CoreServicesShowcase';

type GuideTabKey = 'all' | 'finance' | 'saju' | 'novel' | 'tech';

const GUIDE_TABS: { key: GuideTabKey; label: string; enLabel: string; icon: string }[] = [
    { key: 'all', label: '전체', enLabel: 'All', icon: 'fa-layer-group' },
    { key: 'finance', label: '금융·재테크', enLabel: 'Finance', icon: 'fa-chart-line' },
    { key: 'saju', label: '명리학·문화', enLabel: 'Humanities & Saju', icon: 'fa-yin-yang' },
    { key: 'novel', label: '웹소설 작법', enLabel: 'Novel Writing', icon: 'fa-book-open' },
    { key: 'tech', label: 'IT·알고리즘', enLabel: 'IT & Logic', icon: 'fa-microchip' },
];

const CURATED_TOP_SLUGS = [
    '2026-global-interest-rate-dividend-strategy',
    'saju-manseryeok-principles-and-four-pillars',
    'webnovel-trends-regression-possession-reincarnation',
    'loan-interest-calculation-and-repayment-methods',
    'sudoku-advanced-solving-techniques-naked-single-to-x-wing',
    'sp500-index-fund-dollar-investing-principles',
    'character-conflict-design-and-villain-writing',
    'ai-news-curation-and-smart-current-affairs-literacy',
];

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export default function HomePage() {
    const { user, logout } = useAuth();
    const { lang } = useLanguage();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [news, setNews] = useState<{ id: number; news_id?: number; title: string; summary?: string; description?: string; category?: string; published_at?: string; created_at?: string; tags?: string; relatedStocks?: { name: string }[]; vote_up?: number; vote_down?: number }[]>([]);
    const [showWizard, setShowWizard] = useState(false);
    const [selectedGuideTab, setSelectedGuideTab] = useState<GuideTabKey>('all');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const q = searchQuery.trim();
        if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
    };

    const { config, isLoading: isPrefLoading, isSaving, updateConfig, saveConfig } = useUserPreferenceContext();

    const displayedGuides = useMemo(() => {
        if (selectedGuideTab === 'all') {
            const curated = CURATED_TOP_SLUGS
                .map(slug => GUIDES_DATA.find(g => g.slug === slug))
                .filter((g): g is GuideArticle => !!g);
            if (curated.length >= 8) return curated.slice(0, 8);
            const remaining = GUIDES_DATA.filter(g => !curated.some(c => c.slug === g.slug));
            return [...curated, ...remaining].slice(0, 8);
        }
        if (selectedGuideTab === 'finance') {
            return GUIDES_DATA.filter(g => g.category === 'finance').slice(0, 8);
        }
        if (selectedGuideTab === 'saju') {
            return GUIDES_DATA.filter(g => g.category === 'saju').slice(0, 8);
        }
        if (selectedGuideTab === 'novel') {
            return GUIDES_DATA.filter(g => g.category === 'novel').slice(0, 8);
        }
        if (selectedGuideTab === 'tech') {
            return GUIDES_DATA.filter(g => g.category === 'tech' || g.category === 'game').slice(0, 8);
        }
        return GUIDES_DATA.slice(0, 8);
    }, [selectedGuideTab]);

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
                title="VERA - 세상의 모든 지식과 일상의 인사이트를 잇는 프리미엄 매거진 포털"
                description="VERA에서 25편의 고품질 지식 가이드 & 전문 칼럼(금융·재테크, 명리학·문화, 웹소설 작법, IT·알고리즘), 실시간 팩트 브리핑 뉴스, 스마트 생활도구를 한곳에서 만나보세요."
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
                        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white px-6 sm:px-12 py-9 sm:py-12 mb-8 shadow-xl">
                            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-teal-500/10 pointer-events-none blur-3xl"></div>
                            <div className="absolute -bottom-28 -left-16 w-80 h-80 rounded-full bg-purple-500/10 pointer-events-none blur-3xl"></div>

                            <div className="relative max-w-3xl mx-auto text-center">
                                <span className="inline-block px-3.5 py-1 rounded-full bg-white/10 text-teal-300 text-xs font-bold mb-3 border border-white/10 tracking-wide">
                                    {lang === 'en' ? 'VERA Premium Knowledge Magazine' : 'VERA 프리미엄 지식 매거진 & 라이프 포털'}
                                </span>
                                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 leading-tight">
                                    {lang === 'en'
                                        ? 'Connecting All Knowledge & Everyday Insights'
                                        : '세상의 모든 지식과 일상의 인사이트를 잇는 프리미엄 매거진 포털'}
                                </h1>
                                <p className="text-slate-300 text-sm sm:text-base mb-6 font-normal leading-relaxed">
                                    {lang === 'en'
                                        ? 'Explore 25 in-depth curated guides across finance, humanities, creative writing, and IT algorithms — fully verified by our editorial desk.'
                                        : '금융 재테크, 명리학 인문, 웹소설 작법, IT 알고리즘 등 25편의 검증된 전문 지식 가이드와 스마트 도구를 만나보세요.'}
                                </p>

                                {/* 검색창 */}
                                <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-xl flex items-center px-5 py-3 max-w-2xl mx-auto">
                                    <i className="fas fa-search text-slate-400 mr-3"></i>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={lang === 'en' ? 'Search 25 expert guides, news, lifestyle tools...' : '지식 칼럼, 뉴스, 생활도구, 게임 검색...'}
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
                                {/* 1. 지식 가이드 & 전문 칼럼 섹션 (AdSense 핵심 고가치 오리지널 매거진 쇼케이스) */}
                                <Card className="p-6 sm:p-8 border-teal-100 shadow-sm">
                                    {/* 섹션 상단 헤더 */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-600 via-emerald-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-teal-200/50">
                                                <i className="fas fa-book-open text-xl"></i>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                                                        {lang === 'en' ? 'Knowledge Guides & Columns' : '지식 가이드 & 전문 칼럼'}
                                                    </h2>
                                                    <span className="text-[11px] bg-teal-600 text-white px-2.5 py-0.5 rounded-full font-bold shadow-xs">
                                                        25편 완비
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5 font-medium">
                                                    {lang === 'en'
                                                        ? 'Original in-depth investigative insights by VERA Editorial Desk'
                                                        : '금융·명리·작법·IT 분석까지 VERA 전문 편집팀이 집필한 심층 지식 매거진'}
                                                </p>
                                            </div>
                                        </div>
                                        <a
                                            href="/guides"
                                            className="text-xs sm:text-sm font-extrabold text-teal-700 hover:text-teal-900 flex items-center gap-1.5 transition-colors self-start sm:self-auto bg-teal-50 hover:bg-teal-100 px-3.5 py-2 rounded-xl border border-teal-200/60"
                                        >
                                            <span>{lang === 'en' ? 'View All 25 Guides' : '25편 전체보기'}</span>
                                            <i className="fas fa-arrow-right text-xs"></i>
                                        </a>
                                    </div>

                                    {/* 25편 완비 & 매주 정기 업데이트 신뢰성 안내 띠지 */}
                                    <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-cyan-50 border border-teal-200/80 rounded-2xl p-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-teal-950 shadow-xs">
                                        <div className="flex items-center gap-2.5">
                                            <span className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                                                <i className="fas fa-shield-alt"></i>
                                            </span>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-extrabold text-teal-900 text-sm">
                                                        {lang === 'en' ? 'VERA Editorial Quality & E-E-A-T Guarantee' : 'VERA 편집국 공인 E-E-A-T 심층 칼럼'}
                                                    </span>
                                                    <span className="bg-teal-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                                        25편 완비 · 정기 업데이트
                                                    </span>
                                                </div>
                                                <p className="text-teal-800 text-[11px] mt-0.5 leading-relaxed">
                                                    공공 데이터 및 전문 원전에 기반해 집필되며, 전담 팩트체커의 상시 교차 검증을 거쳐 투명하게 무료 제공됩니다.
                                                </p>
                                            </div>
                                        </div>
                                        <a
                                            href="/editorial-policy"
                                            className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-teal-800 hover:text-teal-950 hover:underline px-3 py-1.5 rounded-lg bg-white/80 border border-teal-200 self-start sm:self-auto"
                                        >
                                            <span>{lang === 'en' ? 'Editorial Policy' : '편집 원칙 및 팩트체크 기준'}</span>
                                            <i className="fas fa-chevron-right text-[10px]"></i>
                                        </a>
                                    </div>

                                    {/* 카테고리 필터 탭 (전체, 금융·재테크, 명리학·문화, 웹소설 작법, IT·알고리즘) */}
                                    <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 mb-5">
                                        {GUIDE_TABS.map(tab => {
                                            const isActive = selectedGuideTab === tab.key;
                                            return (
                                                <button
                                                    key={tab.key}
                                                    type="button"
                                                    onClick={() => setSelectedGuideTab(tab.key)}
                                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                                        isActive
                                                            ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                                                            : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200/80'
                                                    }`}
                                                >
                                                    <i className={`fas ${tab.icon} text-[11px] ${isActive ? 'text-teal-300' : 'text-gray-400'}`}></i>
                                                    <span>{lang === 'en' ? tab.enLabel : tab.label}</span>
                                                    {tab.key === 'all' && (
                                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                            25
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* 8대 엄선 대표 칼럼 그리드 */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {displayedGuides.map(guide => (
                                            <a
                                                key={guide.slug}
                                                href={`/guides/${guide.slug}`}
                                                className="p-5 rounded-2xl border border-gray-200/85 hover:border-teal-400 hover:bg-gradient-to-b hover:from-white hover:to-teal-50/25 transition-all group flex flex-col justify-between bg-white shadow-xs hover:shadow-md"
                                            >
                                                <div>
                                                    {/* 상단 뱃지 & 팩트체크 & 소요 시간 */}
                                                    <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                                                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${guide.categoryColor}`}>
                                                            {guide.categoryLabel}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                                                            <i className="fas fa-shield-alt text-emerald-600"></i>
                                                            <span>{lang === 'en' ? 'Fact-Checked' : '팩트체크 완료'}</span>
                                                        </span>
                                                        <span className="text-gray-400 text-[11px] font-medium ml-auto flex items-center gap-1">
                                                            <i className="far fa-clock text-[10px]"></i>
                                                            <span>{guide.readTime}</span>
                                                        </span>
                                                    </div>

                                                    {/* 칼럼 제목 */}
                                                    <h3 className="font-extrabold text-gray-900 group-hover:text-teal-700 transition-colors text-base line-clamp-2 leading-snug mb-2">
                                                        {guide.title}
                                                    </h3>

                                                    {/* 요약문 */}
                                                    <p className="text-gray-600 text-xs line-clamp-2 font-normal leading-relaxed mb-4">
                                                        {guide.summary || guide.description}
                                                    </p>
                                                </div>

                                                {/* 저자 및 상세 보기 링크 */}
                                                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-1.5 text-gray-500 min-w-0 pr-2">
                                                        <i className="fas fa-feather-alt text-teal-600 text-[11px] shrink-0"></i>
                                                        <span className="font-bold text-gray-800 truncate">{guide.author}</span>
                                                        {guide.authorRole && (
                                                            <span className="text-[10px] text-gray-400 hidden md:inline truncate">
                                                                · {guide.authorRole}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-teal-700 font-extrabold text-xs shrink-0 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                                        <span>{lang === 'en' ? 'Read' : '전문 읽기'}</span>
                                                        <i className="fas fa-chevron-right text-[9px]"></i>
                                                    </span>
                                                </div>
                                            </a>
                                        ))}
                                    </div>

                                    {/* 하단 공지 및 허브 바로가기 */}
                                    <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <i className="fas fa-info-circle text-teal-600"></i>
                                            <span>모든 칼럼은 통계청·한국은행·금융위 공식 공공 데이터에 기반하여 정기 개정됩니다.</span>
                                        </div>
                                        <a href="/guides" className="text-teal-700 font-extrabold hover:text-teal-900 hover:underline flex items-center gap-1 self-start sm:self-auto">
                                            <span>25편 지식 아카이브 전체 탐색하기 →</span>
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
