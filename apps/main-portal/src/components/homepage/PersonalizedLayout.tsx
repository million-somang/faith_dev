import { Card, NewsCard } from '@faithportal/ui';
import { Link } from 'react-router-dom';
import { BannerSlot } from '../BannerSlot';
import { WeatherWidget } from './WeatherWidget';
import { StockWidget } from './StockWidget';
import {
    HomepageConfig,
    ALL_QUICK_MENU_ITEMS,
    QuickMenuItem,
    ColorScheme,
} from '../../types/homepage.types';

// 색상 테마별 액센트 클래스 (Tailwind는 동적 클래스명을 지원하지 않으므로 정적 매핑)
const SCHEME_STYLES: Record<ColorScheme, {
    btn: string;          // 주요 버튼 배경
    btnHover: string;     // 주요 버튼 호버
    text: string;         // 액센트 텍스트
    border: string;       // 액센트 보더
    softBg: string;       // 연한 배경
    hoverSoftBg: string;  // 연한 배경 호버
    hero: string;         // 히어로 그라디언트
}> = {
    green: { btn: 'bg-green-500', btnHover: 'hover:bg-green-600', text: 'text-green-600', border: 'border-green-500', softBg: 'bg-green-50', hoverSoftBg: 'hover:bg-green-50', hero: 'from-green-600 via-green-500 to-emerald-600' },
    blue: { btn: 'bg-blue-600', btnHover: 'hover:bg-blue-700', text: 'text-blue-600', border: 'border-blue-600', softBg: 'bg-blue-50', hoverSoftBg: 'hover:bg-blue-50', hero: 'from-blue-600 via-blue-500 to-indigo-600' },
    purple: { btn: 'bg-purple-500', btnHover: 'hover:bg-purple-600', text: 'text-purple-600', border: 'border-purple-500', softBg: 'bg-purple-50', hoverSoftBg: 'hover:bg-purple-50', hero: 'from-purple-600 via-purple-500 to-fuchsia-600' },
    orange: { btn: 'bg-orange-500', btnHover: 'hover:bg-orange-600', text: 'text-orange-600', border: 'border-orange-500', softBg: 'bg-orange-50', hoverSoftBg: 'hover:bg-orange-50', hero: 'from-orange-600 via-orange-500 to-amber-600' },
    dark: { btn: 'bg-gray-800', btnHover: 'hover:bg-gray-900', text: 'text-gray-800', border: 'border-gray-800', softBg: 'bg-gray-100', hoverSoftBg: 'hover:bg-gray-100', hero: 'from-gray-800 via-gray-700 to-gray-900' },
};

function getScheme(config: HomepageConfig) {
    return SCHEME_STYLES[config.theme.colorScheme] || SCHEME_STYLES.blue;
}

/**
 * 관심 카테고리 뉴스 우선 정렬
 */
function prioritizeNews<T extends { category?: string }>(news: T[], categories: string[]): T[] {
    if (categories.length === 0) return news;
    return [...news].sort((a, b) => {
        const aMatch = a.category && categories.includes(a.category) ? 1 : 0;
        const bMatch = b.category && categories.includes(b.category) ? 1 : 0;
        return bMatch - aMatch;
    });
}

interface NewsItem {
    id: number;
    news_id?: number;
    title: string;
    summary?: string;
    description?: string;
    category?: string;
    published_at?: string;
    created_at?: string;
    tags?: string;
    relatedStocks?: { name: string }[];
    vote_up?: number;
    vote_down?: number;
}

interface PersonalizedLayoutProps {
    config: HomepageConfig;
    user: { name: string; email: string } | null;
    news: NewsItem[];
    health: { status: string } | null;
    onOpenWizard: () => void;
    logout: () => void;
}

function LoungePromoBanner() {
    return (
        <Link 
            to="/lounge/topic/비트코인"
            className="flex items-center justify-between px-4.5 py-3 bg-gradient-to-r from-rose-600 via-violet-600 to-indigo-600 text-white rounded-2xl shadow-md mb-6 hover:opacity-95 transition-all hover:translate-y-[-1px] group"
        >
            <div className="flex items-center gap-2">
                <span className="bg-white/20 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">LIVE 🔥</span>
                <span className="text-xs sm:text-sm font-black tracking-tight text-white">지금 VERA 라운지 격론 중: 비트코인 급락 수습 방안 긴급 대토론</span>
            </div>
            <span className="text-xs font-black flex items-center gap-1 text-violet-200 group-hover:text-white transition-colors">
                실시간 라운지 가기 <i className="fas fa-arrow-right text-[10px] group-hover:translate-x-0.5 transition-transform"></i>
            </span>
        </Link>
    );
}









/**
 * 포털형 레이아웃 (기본)
 */
function PortalLayout({ config, news, health, user, logout }: Omit<PersonalizedLayoutProps, 'onOpenWizard'>) {
    const isDark = config.theme.colorScheme === 'dark';
    const scheme = getScheme(config);

    // 관심 카테고리 뉴스 우선 표시
    const sortedNews = prioritizeNews(news, config.preferences.newsCategories);

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column */}
            <div className="w-full lg:w-[728px] shrink-0 flex flex-col gap-8">
                {/* 배너 슬롯: 홈 메인 상단 */}
                <BannerSlot slotKey="home_main_top" />
                <Card className="p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-3">
                                <i className="fas fa-newspaper text-white text-lg"></i>
                            </div>
                            <span>
                                {config.preferences.newsCategories.length > 0 ? '맞춤 뉴스' : '실시간 뉴스'}
                            </span>
                            <span className="ml-3 text-[10px] bg-red-500 text-white px-2 py-1 rounded-full animate-pulse-slow font-bold">LIVE</span>
                        </h3>
                        <a href="/news" className="text-sm font-medium text-gray-500 hover:text-brand-green flex items-center gap-1 transition-colors">
                            더보기 <i className="fas fa-chevron-right text-xs"></i>
                        </a>
                    </div>
                    <div className="space-y-1">
                        {sortedNews.length > 0 ? (
                            sortedNews.slice(0, 5).map((item, index) => (
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

            {/* Right Column */}
            <div className="flex-1 flex flex-col gap-4 order-first sm:order-none">
                {/* 날씨·증시 — 모바일: 컴팩트 가로 칩 / PC: 큰 카드 */}
                <div className="flex flex-row gap-2 overflow-x-auto hide-scrollbar pb-1 sm:flex-col sm:gap-4 sm:overflow-x-visible sm:pb-0">
                    <WeatherWidget />
                    <StockWidget />
                </div>

                {/* 사용자 카드 (로그인 완료 상태인 경우에만 표시) */}
                {user && (
                    <Card className="p-6 hidden lg:block">
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-gray-700 text-gray-200' : `${scheme.softBg} ${scheme.text}`} flex items-center justify-center`}>
                                <i className="fas fa-user-check text-xl"></i>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">
                                    {config.theme.greeting
                                        ? `${config.theme.greeting}`
                                        : `${user.name}님 환영합니다!`}
                                </h4>
                                <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Link to="/mypage" className={`flex-1 py-2 bg-white border ${scheme.border} ${scheme.text} rounded-lg font-bold text-sm ${scheme.hoverSoftBg} transition-colors text-center`}>마이페이지</Link>
                            <button onClick={logout} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors">로그아웃</button>
                        </div>
                    </Card>
                )}

                {/* 배너 슬롯: 홈 우측 사이드바 */}
                <BannerSlot slotKey="home_sidebar" />

                {/* 시스템 모니터 */}
                <Card className="p-4 bg-gray-50 border-none shadow-none">
                    <h4 className="text-xs font-bold text-gray-400 mb-2">SYSTEM MONITOR</h4>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500">Backend Status</span>
                        <span className={`w-2 h-2 rounded-full ${health?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    </div>
                </Card>
            </div>
        </div>
    );
}

/**
 * 미니멀형 레이아웃
 */
function MinimalLayout({ config, user, logout }: Omit<PersonalizedLayoutProps, 'news' | 'health' | 'onOpenWizard'>) {
    return (
        <div className="max-w-2xl mx-auto">
            {/* 인사말 */}
            {user && (
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-black text-gray-900">
                        {config.theme.greeting || `안녕하세요, ${user.name}님! 👋`}
                    </h2>
                    <p className="text-gray-500 mt-2 text-sm">오늘도 좋은 하루 되세요</p>
                </div>
            )}

            {/* 미니멀 메뉴 카드 그리드 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {config.quickMenuOrder
                    .filter(id => config.quickMenuItems.includes(id))
                    .map(id => ALL_QUICK_MENU_ITEMS.find(m => m.id === id))
                    .filter((m): m is QuickMenuItem => !!m)
                    .map(item => (
                        <a key={item.id} href={item.href}
                            className={`flex flex-col items-center gap-3 p-6 ${item.bg} rounded-2xl hover:shadow-lg transition-all hover:-translate-y-1 group`}>
                            <div className={`w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                                <i className={`fas ${item.icon} text-xl ${item.color}`}></i>
                            </div>
                            <span className={`font-bold text-sm ${item.color}`}>{item.label}</span>
                        </a>
                    ))
                }
            </div>


            {user && (
                <div className="mt-6 flex gap-2 justify-center">
                    <Link to="/mypage" className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">마이페이지</Link>
                    <button onClick={logout} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">로그아웃</button>
                </div>
            )}
        </div>
    );
}

/**
 * 카드형 레이아웃
 */
function CardLayout({ config, news, user, logout }: Omit<PersonalizedLayoutProps, 'health' | 'onOpenWizard'>) {
    const sortedNews = prioritizeNews(news, config.preferences.newsCategories);
    return (
        <div>
            {/* 상단: 인사말 + 유저 */}
            {user && (
                <div className="flex items-center justify-between mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5">
                    <div>
                        <h2 className="text-xl font-black text-gray-900">
                            {config.theme.greeting || `${user.name}님, 안녕하세요! 👋`}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">{user.email}</p>
                    </div>
                    <div className="flex gap-2">
                        <Link to="/mypage" className="px-4 py-2 text-sm font-bold border-2 border-blue-400 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors">마이페이지</Link>
                        <button onClick={logout} className="px-4 py-2 text-sm font-bold bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors">로그아웃</button>
                    </div>
                </div>
            )}

            {/* 메뉴 + 뉴스 카드 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">


                {/* 뉴스 카드 (관심 카테고리 우선 3개) */}
                {sortedNews.slice(0, 3).map(item => (
                    <a key={item.id} href={`/news/${item.id}`}
                        className="flex flex-col gap-2 p-5 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all group">
                        <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded font-semibold">{item.category || '뉴스'}</span>
                            <span className="text-xs text-gray-400">최신</span>
                        </div>
                        <p className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">{item.title}</p>
                    </a>
                ))}
            </div>
        </div>
    );
}

/**
 * 개인화 레이아웃 진입점 - 설정에 따라 레이아웃 분기
 */
export function PersonalizedLayout(props: PersonalizedLayoutProps) {
    const { config } = props;
    const layout = config.theme.layout;
    const scheme = getScheme(config);

    return (
        <>
            {/* VERA Lounge 실시간 띠배너 */}
            <LoungePromoBanner />

            {/* 상단: 히어로 + 검색창 */}
            <section className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${scheme.hero} text-white px-6 sm:px-10 py-10 mb-10 shadow-xl`}>
                <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-12 w-64 h-64 rounded-full bg-black/10 pointer-events-none"></div>

                <div className="relative max-w-2xl mx-auto text-center">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
                        {props.config.theme.greeting || (props.user ? `${props.user.name}님, 환영합니다!` : '세상의 모든 정보를 한곳에서')}
                    </h1>
                    <p className="text-white/80 text-sm mb-6 font-medium">나만의 맞춤 홈에서 빠르게 시작하세요</p>
                    <div className="bg-white rounded-full shadow-2xl flex items-center px-6 py-3">
                        <i className={`fas fa-search ${scheme.text} mr-3`}></i>
                        <input
                            type="text"
                            placeholder="무엇을 찾으시나요?"
                            className="flex-1 bg-transparent border-none outline-none text-base text-gray-900 placeholder-gray-400 font-medium"
                        />
                        <button className={`flex items-center justify-center px-5 py-2 rounded-full ${scheme.btn} ${scheme.btnHover} text-white text-sm font-bold transition-all ml-3`} aria-label="검색">
                            검색
                        </button>
                    </div>
                </div>
            </section>



            {/* 레이아웃 분기 */}
            {layout === 'portal' && <PortalLayout {...props} />}
            {layout === 'minimal' && (
                <MinimalLayout
                    config={props.config}
                    user={props.user}
                    logout={props.logout}
                />
            )}
            {layout === 'card' && (
                <CardLayout
                    config={props.config}
                    user={props.user}
                    logout={props.logout}
                    news={props.news}
                />
            )}

            {/* 홈 꾸미기 플로팅 버튼 */}
            <button
                onClick={props.onOpenWizard}
                className={`fixed bottom-24 right-4 z-40 w-14 h-14 ${scheme.btn} ${scheme.btnHover} text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110 group`}
                title="내 홈 꾸미기"
                aria-label="내 홈페이지 꾸미기"
            >
                <i className="fas fa-magic text-lg group-hover:rotate-12 transition-transform"></i>
            </button>
        </>
    );
}
