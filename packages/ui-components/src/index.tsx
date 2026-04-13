import React from 'react';
import { getCategoryName, getCategoryColor, getTimeAgo } from '@faithportal/core-utils';

export const Button = ({ children, onClick, className = "" }: { children: React.ReactNode, onClick?: () => void, className?: string }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 font-bold rounded-lg transition-all duration-200 ${className}`}
    >
        {children}
    </button>
);

export const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`content-card p-6 ${className}`}>
        {children}
    </div>
);

export const NewsCard = ({ news, index, isBookmarked = false, onBookmarkToggle, hideActions = false, onVote }: { news: any, index?: number, isBookmarked?: boolean, onBookmarkToggle?: (id: number) => void, hideActions?: boolean, onVote?: (id: number, type: 'up' | 'down') => void }) => {
    const timeAgo = getTimeAgo(news.published_at || news.created_at);
    const categoryColor = getCategoryColor(news.category);
    const isAnalyzed = (news.title.includes('환율') || news.title.includes('주가') || news.title.includes('증시') || news.title.includes('달러') || news.title.includes('코스피') || news.title.includes('경제'));

    let keywords: string[] = [];
    if (news.relatedStocks && news.relatedStocks.length > 0) {
        keywords = news.relatedStocks.map((s: any) => s.name);
    } else if (news.tags) {
        keywords = typeof news.tags === 'string' ? news.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : news.tags;
    }

    return (
        <a href={`/news/${news.news_id || news.id}`} data-index={index} className="news-card block border-b border-gray-100 last:border-0 p-5 hover:bg-gray-50 transition-colors group relative cursor-pointer group">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                    <span className={`badge ${categoryColor}`}>{getCategoryName(news.category)}</span>
                    <span className="text-gray-500 text-[11px] font-bold flex-shrink-0">{timeAgo}</span>
                    {isAnalyzed && (
                        <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                            <i className="fas fa-chart-line mr-1"></i>분석됨
                        </span>
                    )}
                </div>
                <p className="text-gray-900 group-hover:text-brand-green-hover font-semibold text-sm leading-snug line-clamp-2">
                    {news.title}
                </p>
            </div>

            {(keywords.length > 0 || !hideActions) && (
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-transparent group-hover:border-gray-100 transition-colors">
                    <div className="flex flex-wrap items-center gap-1.5 flex-1 pr-4">
                        {keywords.slice(0, 3).map((kw, i) => (
                            <span key={i} className="px-2 py-0.5 bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors rounded text-[10px] font-medium whitespace-nowrap border border-gray-200">
                                #{kw}
                            </span>
                        ))}
                    </div>

                    {!hideActions && (
                        <div className="flex items-center justify-end gap-3 flex-shrink-0">
                            <div className="flex items-center gap-3 mr-2 border-r border-gray-200 pr-3">
                                <button
                                    onClick={(e) => { e.preventDefault(); if (onVote) onVote(news.news_id || news.id, 'up'); }}
                                    className={`transition-transform hover:scale-110 flex items-center gap-1 ${(news.vote_up || 0) > 0 ? 'text-red-500 font-bold' : 'text-gray-400 hover:text-red-500'}`}
                                    title="좋아요"
                                >
                                    <i className={`${(news.vote_up || 0) > 0 ? 'fas' : 'far'} fa-thumbs-up`}></i>
                                    {news.vote_up > 0 && <span className="text-[10px]">{news.vote_up}</span>}
                                </button>
                                <button
                                    onClick={(e) => { e.preventDefault(); if (onVote) onVote(news.news_id || news.id, 'down'); }}
                                    className={`transition-transform hover:scale-110 flex items-center gap-1 ${(news.vote_down || 0) > 0 ? 'text-blue-500 font-bold' : 'text-gray-400 hover:text-blue-500'}`}
                                    title="싫어요"
                                >
                                    <i className={`${(news.vote_down || 0) > 0 ? 'fas' : 'far'} fa-thumbs-down`}></i>
                                    {news.vote_down > 0 && <span className="text-[10px]">{news.vote_down}</span>}
                                </button>
                            </div>
                            <button
                                onClick={(e) => { e.preventDefault(); if (onBookmarkToggle) onBookmarkToggle(news.news_id || news.id); }}
                                className={`text-gray-400 hover:text-yellow-500 transition-transform hover:scale-110 ${isBookmarked ? 'text-yellow-500' : ''}`}
                                title="북마크"
                            >
                                <i className={`${isBookmarked ? 'fas' : 'far'} fa-bookmark`}></i>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (navigator.share) {
                                        navigator.share({ title: news.title, url: `/news/${news.news_id || news.id}` });
                                    }
                                }}
                                className="text-gray-400 hover:text-blue-500 transition-transform hover:scale-110"
                                title="공유"
                            >
                                <i className="fas fa-share-alt"></i>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </a>
    );
};

export const Header = ({ user, onLogout, baseUrl = '' }: { user?: any, onLogout?: () => void, baseUrl?: string } = {}) => (
    <>
        <header className="header-gradient text-white py-1">
            <div className="max-w-6xl mx-auto px-4 flex justify-between items-center h-10">
                <div className="flex items-center gap-4">
                    <a href={`${baseUrl}/`} className="font-black text-xl tracking-tighter hover:opacity-90 transition-opacity">FaithPortal</a>
                    <nav className="hidden sm:flex gap-4 text-xs font-bold">
                        <a href={`${baseUrl}/news`} className="hover:text-green-100 uppercase">News</a>
                        <a href={`${baseUrl}/lifestyle`} className="hover:text-green-100 uppercase">Utility</a>
                        <a href={`${baseUrl}/finance`} className="hover:text-green-100 uppercase">Finance</a>
                        <a href={`${baseUrl}/game`} className="hover:text-green-100 uppercase">Games</a>
                    </nav>
                </div>
                <div className="flex items-center gap-3">
                    {user ? (
                        <>
                            <span className="text-xs font-bold">{user.name}님</span>
                            <div className="w-[1px] h-3 bg-white/30"></div>
                            <a href={`${baseUrl}/mypage`} className="text-xs font-bold hover:text-green-100 transition-colors">마이페이지</a>
                            <div className="w-[1px] h-3 bg-white/30"></div>
                            <button onClick={onLogout} className="text-xs font-bold hover:text-green-100 transition-colors">로그아웃</button>
                        </>
                    ) : (
                        <>
                            <a href={`${baseUrl}/login`} className="text-xs font-bold hover:text-green-100 transition-colors">로그인</a>
                            <div className="w-[1px] h-3 bg-white/30"></div>
                            <a href={`${baseUrl}/signup`} className="text-xs font-bold hover:text-green-100 transition-colors">회원가입</a>
                        </>
                    )}
                </div>
            </div>
        </header>
    </>
);

export const QuickMenu = () => (
    <nav className="mb-16 max-w-4xl mx-auto" id="quick-menu">
        <div className="overflow-x-auto hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 py-4">
            <div className="flex justify-start sm:justify-center items-center gap-4 sm:gap-6 lg:gap-8 min-w-max">
                {[
                    { label: '뉴스', icon: 'fa-newspaper', bg: 'bg-blue-50', color: 'text-blue-600', href: '/news' },
                    { label: '유틸리티', icon: 'fa-home', bg: 'bg-green-50', color: 'text-green-600', href: '/lifestyle' },
                    { label: '게임', icon: 'fa-gamepad', bg: 'bg-purple-50', color: 'text-purple-600', href: '/game' },
                    { label: '금융', icon: 'fa-won-sign', bg: 'bg-orange-50', color: 'text-orange-600', href: '/finance' },
                    { label: '쇼핑', icon: 'fa-shopping-bag', bg: 'bg-pink-50', color: 'text-pink-600', href: '/shopping' },
                    { label: '엔터', icon: 'fa-film', bg: 'bg-red-50', color: 'text-red-600', href: '/entertainment' },
                    { label: '교육', icon: 'fa-graduation-cap', bg: 'bg-indigo-50', color: 'text-indigo-600', href: '/education' },
                ].map((item) => (
                    <a key={item.label} href={item.href} className="group text-center flex-shrink-0">
                        <div className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-2 rounded-2xl ${item.bg} shadow-sm flex items-center justify-center transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_8px_16px_rgba(0,0,0,0.1)] group-hover:ring-2 group-hover:ring-brand-green`}>
                            <i className={`fas ${item.icon} text-xl sm:text-2xl ${item.color} group-hover:scale-110 transition-transform`}></i>
                        </div>
                        <p className="text-[11px] sm:text-xs text-gray-800 font-bold group-hover:text-brand-green transition-colors">{item.label}</p>
                    </a>
                ))}
            </div>
        </div>
    </nav>
);

export const Footer = ({ baseUrl = '' }: { baseUrl?: string } = {}) => (
    <footer className="bg-white border-t border-gray-200 mt-20 py-12">
        <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
                <div>
                    <h2 className="text-xl font-black text-gray-900 mb-4">FaithPortal</h2>
                    <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                        세상의 모든 정보를 하나로 묶는 믿음의 포털. 더 나은 내일을 위해 매일 성장합니다.
                    </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
                    <div>
                        <h4 className="font-bold text-gray-900 mb-4 text-sm">서비스</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><a href={`${baseUrl}/news`} className="hover:text-brand-green transition-colors">뉴스</a></li>
                            <li><a href={`${baseUrl}/lifestyle`} className="hover:text-brand-green transition-colors">유틸리티</a></li>
                            <li><a href={`${baseUrl}/finance`} className="hover:text-brand-green transition-colors">금융</a></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="pt-8 border-t border-gray-100 flex flex-col sm:row items-center justify-between gap-4">
                <p className="text-xs text-gray-400">© 2026 FaithPortal. All rights reserved.</p>
                <div className="flex gap-4 text-gray-400 text-sm">
                    <a href="#" className="hover:text-gray-600"><i className="fab fa-facebook"></i></a>
                    <a href="#" className="hover:text-gray-600"><i className="fab fa-twitter"></i></a>
                    <a href="#" className="hover:text-gray-600"><i className="fab fa-instagram"></i></a>
                </div>
            </div>
        </div>
    </footer>
);
