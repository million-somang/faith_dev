import { useEffect, useState } from 'react';

import { Link } from 'react-router-dom';
import { Header, Footer } from '@faithportal/ui';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { PageSEO } from '../components/PageSEO';
import EntertainmentSubMenu from '../components/EntertainmentSubMenu';
import { BannerSlot } from '../components/BannerSlot';
import InteractiveKoreaMap from '../components/travel/InteractiveKoreaMap';

const API_BASE_URL = '';

interface TravelArticle {
    id: number;
    title: string;
    destination: string;
    region: string;
    category: string;
    summary: string | null;
    ai_summary: string | null;
    content: string;
    travel_tips: string | null;
    thumbnail: string | null;
    gallery: string | null;
    best_season: string | null;
    duration: string | null;
    estimated_cost: string | null;
    location_address: string | null;
    tags: string | null;
    author: string | null;
    source: string | null;
    view_count: number;
    like_count: number;
    is_featured: number;
    published_at: string;
}

const REGION_TABS = [
    { id: 'all', label: '전체 보기', icon: 'fas fa-globe' },
    { id: 'domestic', label: '국내 여행', icon: 'fas fa-map-location-dot' },
    { id: 'asia', label: '일본·아시아', icon: 'fas fa-torii-gate' },
    { id: 'europe', label: '유럽 낭만', icon: 'fas fa-landmark' },
    { id: 'americas', label: '미주·대양주', icon: 'fas fa-earth-americas' }
];

const CATEGORY_CHIPS = [
    { id: 'all', label: '모든 테마' },
    { id: 'healing', label: '🌿 힐링·휴양' },
    { id: 'food', label: '🍜 미식·맛집' },
    { id: 'culture', label: '🏛️ 문화·역사' },
    { id: 'nature', label: '🌊 자연·액티비티' },
    { id: 'city', label: '🏙️ 도시·쇼핑' },
    { id: 'camping', label: '⛺ 캠핑·차박' }
];

export default function TravelPage() {
    const { user, logout } = useAuth();
    const [articles, setArticles] = useState<TravelArticle[]>([]);
    const [featured, setFeatured] = useState<TravelArticle | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedRegion, setSelectedRegion] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [allMapArticles, setAllMapArticles] = useState<TravelArticle[]>([]);
    const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const limit = 12;

    // 지도 렌더링용 전체 여행지 목록 1회 일괄 조회
    useEffect(() => {
        const fetchMapSpots = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/travel`, {
                    params: { limit: 100 }
                });
                if (res.data?.success) {
                    setAllMapArticles(res.data.articles || []);
                }
            } catch (err) {
                console.error('[Fetch Map Spots Error]', err);
            }
        };
        fetchMapSpots();
    }, []);

    useEffect(() => {
        fetchTravelArticles();
    }, [selectedRegion, selectedCategory, selectedProvince, selectedCity, sortBy, page]);

    const fetchTravelArticles = async () => {
        setLoading(true);
        try {
            const offset = (page - 1) * limit;
            const res = await axios.get(`${API_BASE_URL}/api/travel`, {
                params: {
                    region: selectedRegion,
                    category: selectedCategory,
                    province: selectedProvince || undefined,
                    city: selectedCity || undefined,
                    sort: sortBy,
                    keyword: searchTerm.trim() || undefined,
                    limit,
                    offset
                }
            });

            if (res.data?.success) {
                const list: TravelArticle[] = res.data.articles || [];
                setArticles(list);
                setTotalCount(res.data.pagination?.total || 0);

                // 최초 1회 또는 전체 탭일 때 상단 스포트라이트 지정
                if (page === 1 && list.length > 0) {
                    const top = list.find(a => a.is_featured === 1) || list[0];
                    setFeatured(top);
                }
            }
        } catch (error) {
            console.error('[Fetch Travel Articles Error]', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectLocation = (province: string | null, city: string | null) => {
        setSelectedProvince(province);
        setSelectedCity(city);
        setPage(1);
        if (province) {
            setSelectedRegion('domestic');
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchTravelArticles();
    };

    // AI 요약 불릿 파싱 (최대 2줄 프리뷰)
    const getAiSummaryPreview = (aiSummary: string | null): string[] => {
        if (!aiSummary) return [];
        return aiSummary
            .split('\n')
            .map(line => line.replace(/^[•\-\*0-9\.\s]+/, '').trim())
            .filter(line => line.length > 0)
            .slice(0, 2);
    };

    // 권역 한글명 헬퍼
    const getRegionName = (reg: string) => {
        switch (reg) {
            case 'domestic': return '국내';
            case 'asia': return '아시아';
            case 'europe': return '유럽';
            case 'americas': return '미주';
            default: return '해외';
        }
    };

    // 카테고리 태그 헬퍼
    const getCategoryBadge = (cat: string) => {
        switch (cat) {
            case 'healing': return { label: '힐링·휴양', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
            case 'food': return { label: '미식·맛집', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
            case 'culture': return { label: '문화·역사', bg: 'bg-violet-50 text-violet-700 border-violet-200' };
            case 'nature': return { label: '자연·풍경', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
            case 'city': return { label: '도시·핫플', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
            case 'camping': return { label: '캠핑·차박', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
            default: return { label: '테마여행', bg: 'bg-slate-50 text-slate-700 border-slate-200' };
        }
    };

    const totalPages = Math.ceil(totalCount / limit);

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-800">
            <PageSEO
                title="여행 & 힐링 큐레이션 - VERA 재미"
                description="AI가 엄선한 국내외 감성 여행지와 핵심 여행 팁, 추천 코스까지 한곳에서 만나는 VERA 여행 포털입니다."
                path="/entertainment/travel"
            />
            <Header user={user} onLogout={logout} />
            
            <EntertainmentSubMenu />

            <main className="flex-1 max-w-6xl mx-auto px-4 py-6 sm:py-8 w-full space-y-8">
                
                {/* 1. 상단 히어로 배너 & 검색 바 */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white p-6 sm:p-10 shadow-lg">
                    <div className="relative z-10 max-w-2xl space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black tracking-wide border border-white/30">
                            <i className="fas fa-compass text-amber-300"></i>
                            <span>VERA TRAVEL CURATION</span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                            쉼과 낭만이 머무는 곳,<br />
                            AI와 함께 떠나는 감성 여행
                        </h1>
                        <p className="text-xs sm:text-sm text-emerald-50 leading-relaxed max-w-xl">
                            사계절 아름다운 국내 명소부터 숨겨진 해외 소도시까지, 3대 핵심 포인트와 실전 꿀팁으로 가득한 맞춤형 여행기를 만나보세요.
                        </p>

                        {/* 검색창 */}
                        <form onSubmit={handleSearchSubmit} className="pt-2 flex gap-2 max-w-lg">
                            <div className="relative flex-1">
                                <i className="fas fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="어디로 떠나고 싶으신가요? (예: 제주, 강릉, 교토, 힐링)"
                                    className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white text-slate-800 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm"
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
                            >
                                검색
                            </button>
                        </form>
                    </div>

                    {/* 백그라운드 데코레이션 아이콘 */}
                    <div className="absolute -right-6 -bottom-8 text-white/10 text-9xl pointer-events-none select-none">
                        <i className="fas fa-plane-departure"></i>
                    </div>
                </div>

                {/* 2. 인터랙티브 대한민국 감성 여행 지도 탐색기 */}
                <InteractiveKoreaMap
                    articles={allMapArticles.length > 0 ? allMapArticles : articles}
                    selectedProvince={selectedProvince}
                    selectedCity={selectedCity}
                    onSelectLocation={handleSelectLocation}
                />

                {/* 3. 상단 스포트라이트 추천 여행지 (Featured) */}
                {featured && page === 1 && !searchTerm && !selectedProvince && (
                    <section className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-all group">
                        <div className="flex items-center gap-2 mb-4 text-xs font-black text-emerald-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>SPOTLIGHT · 이달의 추천 여행지</span>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                            <div className="lg:col-span-7 overflow-hidden rounded-2xl aspect-[16/9] relative shadow-sm">
                                <img
                                    src={featured.thumbnail || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'}
                                    alt={featured.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-3 left-3 flex gap-2">
                                    <span className="px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-black border border-white/20">
                                        📍 {featured.destination}
                                    </span>
                                </div>
                            </div>
                            <div className="lg:col-span-5 space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        {getRegionName(featured.region)}
                                    </span>
                                    {featured.duration && (
                                        <span className="text-[10px] text-slate-500 flex items-center gap-1 font-bold">
                                            <i className="fas fa-clock text-slate-400"></i> {featured.duration}
                                        </span>
                                    )}
                                    {featured.best_season && (
                                        <span className="text-[10px] text-slate-500 flex items-center gap-1 font-bold">
                                            <i className="fas fa-calendar-alt text-slate-400"></i> {featured.best_season}
                                        </span>
                                    )}
                                </div>
                                <Link to={`/entertainment/travel/${featured.id}`}>
                                    <h2 className="text-lg sm:text-2xl font-black text-slate-900 leading-snug hover:text-emerald-600 transition-colors line-clamp-2">
                                        {featured.title}
                                    </h2>
                                </Link>

                                {/* AI 3줄 요약 프리뷰 */}
                                {featured.ai_summary && (
                                    <div className="bg-emerald-50/50 rounded-2xl p-3.5 border border-emerald-100 text-xs space-y-1.5">
                                        <div className="font-bold text-emerald-900 flex items-center gap-1 text-[11px]">
                                            <i className="fas fa-sparkles text-emerald-600"></i>
                                            <span>AI 여행 핵심 포인트</span>
                                        </div>
                                        <ul className="text-slate-600 space-y-1 text-[11px] leading-relaxed">
                                            {getAiSummaryPreview(featured.ai_summary).map((pt, idx) => (
                                                <li key={idx} className="line-clamp-1">• {pt}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                                    <span className="text-[11px] text-slate-400">
                                        {featured.author || 'RoofAI 여행 큐레이터'} · 조회 {featured.view_count.toLocaleString()}
                                    </span>
                                    <Link
                                        to={`/entertainment/travel/${featured.id}`}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
                                    >
                                        <span>여행기 보기</span>
                                        <i className="fas fa-arrow-right text-[10px]"></i>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* 3. 권역 탭 네비게이션 */}
                <div className="flex bg-slate-200/70 p-1.5 rounded-2xl gap-1 overflow-x-auto hide-scrollbar text-xs font-black">
                    {REGION_TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setSelectedRegion(tab.id);
                                setPage(1);
                            }}
                            className={`flex-1 py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                                selectedRegion === tab.id
                                    ? 'bg-white text-emerald-700 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
                            }`}
                        >
                            <i className={`${tab.icon} text-xs`}></i>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* 4. 테마 필터 칩 & 정렬 컨트롤러 */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    {/* 테마 알약 칩 */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full hide-scrollbar">
                        {CATEGORY_CHIPS.map(chip => (
                            <button
                                key={chip.id}
                                onClick={() => {
                                    setSelectedCategory(chip.id);
                                    setPage(1);
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                                    selectedCategory === chip.id
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                {chip.label}
                            </button>
                        ))}
                    </div>

                    {/* 정렬 버튼 */}
                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto text-xs font-bold text-slate-500">
                        <button
                            onClick={() => setSortBy('latest')}
                            className={`px-2.5 py-1 rounded-lg transition-colors ${sortBy === 'latest' ? 'text-emerald-700 font-black' : 'hover:text-slate-800'}`}
                        >
                            최신순
                        </button>
                        <span>·</span>
                        <button
                            onClick={() => setSortBy('popular')}
                            className={`px-2.5 py-1 rounded-lg transition-colors ${sortBy === 'popular' ? 'text-emerald-700 font-black' : 'hover:text-slate-800'}`}
                        >
                            인기순
                        </button>
                    </div>
                </div>

                {/* 5. 여행 카드 그리드 */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
                        {[1, 2, 3, 4, 5, 6].map(n => (
                            <div key={n} className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3 animate-pulse">
                                <div className="w-full aspect-[16/10] bg-slate-200 rounded-2xl"></div>
                                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                                <div className="h-6 bg-slate-200 rounded w-full"></div>
                                <div className="h-12 bg-slate-100 rounded w-full"></div>
                            </div>
                        ))}
                    </div>
                ) : articles.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl">
                            <i className="fas fa-map-location"></i>
                        </div>
                        <h3 className="text-base font-black text-slate-800">등록된 여행 콘텐츠가 없습니다</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            선택하신 조건에 일치하는 여행기가 없습니다. 다른 권역이나 테마를 선택해 보세요.
                        </p>
                        <button
                            onClick={() => {
                                setSelectedRegion('all');
                                setSelectedCategory('all');
                                setSearchTerm('');
                                setPage(1);
                            }}
                            className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                        >
                            전체 목록 초기화
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {articles.map(article => {
                            const badge = getCategoryBadge(article.category);
                            const previewBullets = getAiSummaryPreview(article.ai_summary);

                            return (
                                <article
                                    key={article.id}
                                    className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between overflow-hidden group"
                                >
                                    <div>
                                        {/* 썸네일 & 목적지 태그 */}
                                        <Link to={`/entertainment/travel/${article.id}`} className="block relative aspect-[16/10] overflow-hidden">
                                            <img
                                                src={article.thumbnail || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80'}
                                                alt={article.title}
                                                loading="lazy"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute top-3 left-3 flex gap-1.5">
                                                <span className="px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black border border-white/20">
                                                    📍 {article.destination}
                                                </span>
                                            </div>
                                            <div className="absolute bottom-2 right-2">
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border backdrop-blur-md ${badge.bg}`}>
                                                    {badge.label}
                                                </span>
                                            </div>
                                        </Link>

                                        {/* 카드 바디 */}
                                        <div className="p-4 sm:p-5 space-y-2.5">
                                            {/* 메타 칩 */}
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                                    {getRegionName(article.region)}
                                                </span>
                                                {article.duration && (
                                                    <span>· {article.duration}</span>
                                                )}
                                                {article.best_season && (
                                                    <span>· {article.best_season}</span>
                                                )}
                                            </div>

                                            {/* 제목 */}
                                            <Link to={`/entertainment/travel/${article.id}`}>
                                                <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug group-hover:text-emerald-600 transition-colors line-clamp-2">
                                                    {article.title}
                                                </h3>
                                            </Link>

                                            {/* AI 핵심 추천 포인트 */}
                                            {previewBullets.length > 0 ? (
                                                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1">
                                                    {previewBullets.map((bullet, idx) => (
                                                        <p key={idx} className="text-[11px] text-slate-600 leading-tight line-clamp-1">
                                                            • {bullet}
                                                        </p>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                                    {article.summary || article.content.replace(/<[^>]*>/g, '').slice(0, 100)}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* 카드 푸터 */}
                                    <div className="px-4 sm:px-5 pb-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                                        <span>조회 {article.view_count.toLocaleString()} · 추천 {article.like_count}</span>
                                        <Link
                                            to={`/entertainment/travel/${article.id}`}
                                            className="font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                                        >
                                            자세히 <i className="fas fa-chevron-right text-[9px]"></i>
                                        </Link>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                {/* 6. 페이지네이션 */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-1.5 pt-4">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-40 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
                        >
                            이전
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`w-9 h-9 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                    page === p
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                {p}
                            </button>
                        ))}
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-40 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
                        >
                            다음
                        </button>
                    </div>
                )}

                {/* 7. 하단 애드센스 배너 슬롯 */}
                <div className="pt-4">
                    <BannerSlot slotKey="travel-list-bottom" label="SPONSORED AD" />
                </div>
            </main>

            <Footer />
        </div>
    );
}
