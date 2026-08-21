import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Footer } from '@faithportal/ui';
import { useAuth } from '../context/AuthContext';
import { PageSEO } from '../components/PageSEO';
import { GUIDES_DATA, GUIDE_CATEGORIES } from '../data/guidesData';

export default function GuidesHubPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const filteredGuides = useMemo(() => {
        return GUIDES_DATA.filter(guide => {
            const matchesCategory = selectedCategory === 'all' || guide.category === selectedCategory;
            const query = searchQuery.trim().toLowerCase();
            const matchesSearch = !query || 
                guide.title.toLowerCase().includes(query) ||
                guide.description.toLowerCase().includes(query) ||
                guide.tags.some(t => t.toLowerCase().includes(query));
            return matchesCategory && matchesSearch;
        });
    }, [selectedCategory, searchQuery]);

    const featuredGuide = GUIDES_DATA[0];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <PageSEO
                title="정보 가이드 & 지식 칼럼 - VERA"
                description="금융, 사주 명리학, 웹소설 작법, 생활 계산기, 두뇌 퍼즐 공략, 개발자 도구 등 실생활과 커리어에 유용한 고품질 전문 지식 가이드를 만나보세요."
                path="/guides"
            />
            <Header user={user} onLogout={logout} />

            <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
                {/* Hero Header */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white px-6 sm:px-12 py-10 sm:py-14 mb-10 shadow-xl">
                    <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-blue-500/10 pointer-events-none blur-2xl"></div>
                    <div className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-indigo-500/10 pointer-events-none blur-2xl"></div>

                    <div className="relative max-w-3xl">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30 mb-4">
                            <i className="fas fa-book-sparkles"></i> VERA Knowledge Hub
                        </span>
                        <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-3">
                            검증된 지식과 실전 가이드
                        </h1>
                        <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 font-medium">
                            금융 재테크, 전통 명리학, 스토리 작법, 생활 유틸리티, 두뇌 퍼즐 공략까지 — 
                            일상과 지적 성장에 힘이 되는 깊이 있는 전문 아티클을 제공합니다.
                        </p>

                        {/* Search Bar */}
                        <div className="relative max-w-xl">
                            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="관심 있는 키워드나 주제를 검색해 보세요 (예: 배당주, 만 나이, 테트리스, JSON)"
                                className="w-full pl-11 pr-4 py-3 bg-white/10 backdrop-blur-md text-white placeholder-slate-400 rounded-2xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/15 transition-all text-sm font-medium"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                >
                                    <i className="fas fa-times-circle text-sm"></i>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
                    {GUIDE_CATEGORIES.map(cat => {
                        const isActive = selectedCategory === cat.key;
                        return (
                            <button
                                key={cat.key}
                                onClick={() => setSelectedCategory(cat.key)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                                    isActive
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <i className={`fas ${cat.icon} ${isActive ? 'text-white' : 'text-slate-400'}`}></i>
                                {cat.label}
                            </button>
                        );
                    })}
                </div>

                {/* Featured Highlight (검색어가 없고 '전체'일 때 노출) */}
                {!searchQuery && selectedCategory === 'all' && featuredGuide && (
                    <div 
                        onClick={() => navigate(`/guides/${featuredGuide.slug}`)}
                        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group mb-10"
                    >
                        <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-50 text-rose-600 border border-rose-200">
                                        추천 아티클 ⭐
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${featuredGuide.categoryColor}`}>
                                        {featuredGuide.categoryLabel}
                                    </span>
                                    <span className="text-slate-400 text-xs font-medium">
                                        <i className="far fa-clock mr-1"></i>{featuredGuide.readTime}
                                    </span>
                                </div>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors mb-3 leading-snug">
                                    {featuredGuide.title}
                                </h2>
                                <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-4 line-clamp-2 font-normal">
                                    {featuredGuide.description}
                                </p>
                                <div className="flex flex-wrap items-center gap-1.5">
                                    {featuredGuide.tags.map(tag => (
                                        <span key={tag} className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-2 text-blue-600 font-bold text-sm group-hover:translate-x-1 transition-transform">
                                읽어보기 <i className="fas fa-arrow-right text-xs"></i>
                            </div>
                        </div>
                    </div>
                )}

                {/* Article Grid */}
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <span>아티클 목록</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            {filteredGuides.length}편
                        </span>
                    </h3>
                </div>

                {filteredGuides.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                        <i className="fas fa-search text-slate-300 text-4xl mb-3"></i>
                        <p className="text-slate-700 font-bold text-base mb-1">검색 결과가 없습니다.</p>
                        <p className="text-slate-400 text-xs">다른 검색어를 입력하거나 카테고리 필터를 변경해 보세요.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredGuides.map(guide => (
                            <article
                                key={guide.slug}
                                onClick={() => navigate(`/guides/${guide.slug}`)}
                                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${guide.categoryColor}`}>
                                            {guide.categoryLabel}
                                        </span>
                                        <span className="text-slate-400 text-xs font-medium flex items-center gap-1">
                                            <i className="far fa-clock text-[10px]"></i>{guide.readTime}
                                        </span>
                                    </div>
                                    <h4 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2 leading-snug">
                                        {guide.title}
                                    </h4>
                                    <p className="text-slate-500 text-xs sm:text-sm leading-relaxed line-clamp-3 mb-4 font-normal">
                                        {guide.description}
                                    </p>
                                </div>

                                <div>
                                    <div className="flex flex-wrap items-center gap-1 mb-4">
                                        {guide.tags.slice(0, 3).map(tag => (
                                            <span key={tag} className="px-2 py-0.5 rounded bg-slate-50 text-slate-500 text-[11px] font-medium border border-slate-100">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400">
                                        <span>{guide.author}</span>
                                        <span className="font-semibold text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                            전문 보기 <i className="fas fa-chevron-right text-[10px]"></i>
                                        </span>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
