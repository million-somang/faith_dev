import React from 'react';
import { getCategoryName, getCategoryColor, getTimeAgo, decodeHtmlEntities } from '@faithportal/core-utils';

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
    // 다중 카테고리 지원: 'stock,general' 형태 → 배지 여러 개
    const categories: string[] = String(news.category || '').split(',').map((s: string) => s.trim()).filter(Boolean);

    // 제목 끝의 " - 언론사" 분리 (예: "금리 인상 신호 - 한국경제")
    const rawTitle: string = decodeHtmlEntities(String(news.title || ''));
    let displayTitle = rawTitle;
    let publisher = '';
    const sepIdx = rawTitle.lastIndexOf(' - ');
    if (sepIdx > 0 && rawTitle.length - sepIdx - 3 <= 25) {
        publisher = rawTitle.slice(sepIdx + 3).trim();
        displayTitle = rawTitle.slice(0, sepIdx).trim();
    }
    if (!publisher && news.source && !/구글\s?뉴스/.test(news.source)) {
        publisher = decodeHtmlEntities(news.source);
    }
    const isAnalyzed = (news.title.includes('환율') || news.title.includes('주가') || news.title.includes('증시') || news.title.includes('달러') || news.title.includes('코스피') || news.title.includes('경제'));

    let keywords: string[] = [];
    if (news.relatedStocks && news.relatedStocks.length > 0) {
        keywords = news.relatedStocks.map((s: any) => s.name);
    } else if (news.tags) {
        keywords = typeof news.tags === 'string' ? news.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : news.tags;
    }

    return (
        <a href={`/news/${news.news_id || news.id}`} data-index={index} className="news-card block border-b border-gray-200 sm:border-gray-100 last:border-0 p-4 sm:p-5 hover:bg-gray-50 transition-colors group relative cursor-pointer group">
            <div className="flex gap-3 sm:gap-4 items-start sm:items-center">
                {/* 썸네일 (이미지가 없어도 동일 크기 유지 → 카드 높이 통일) */}
                <div className="relative w-24 h-24 sm:w-32 sm:h-[84px] flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                    <i className="far fa-newspaper text-gray-300 text-2xl"></i>
                    {news.thumbnail && (
                        <img
                            src={news.thumbnail}
                            alt=""
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {categories.slice(0, 3).map((cat) => (
                            <span key={cat} className={`badge ${getCategoryColor(cat)}`}>{getCategoryName(cat)}</span>
                        ))}
                        <span className="text-gray-600 sm:text-gray-500 text-[11px] font-bold flex-shrink-0">{timeAgo}</span>
                        {isAnalyzed && (
                            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                                <i className="fas fa-chart-line mr-1"></i>분석됨
                            </span>
                        )}
                        {/* 모바일: 언론사를 메타 줄에 인라인 표시 (별도 컬럼 제거로 본문 공간 확보) */}
                        {publisher && (
                            <span className="sm:hidden text-[11px] font-bold text-gray-500 truncate max-w-[45%]">· {publisher}</span>
                        )}
                    </div>
                    {/* 제목: 모바일 2줄, 데스크탑 1줄 */}
                    <p className="text-gray-900 group-hover:text-brand-green-hover font-bold sm:font-semibold text-sm sm:text-[15px] leading-snug line-clamp-2 sm:line-clamp-1">
                        {displayTitle}
                    </p>
                    {/* 요약: 모바일 2줄, 데스크탑 1줄 (길면 ...으로 표시) */}
                    {(news.summary || news.description) && (
                        <p className="text-gray-700 sm:text-gray-500 text-xs mt-1 line-clamp-2 sm:line-clamp-1">
                            {decodeHtmlEntities(news.summary || news.description)}
                        </p>
                    )}
                </div>
                {/* 언론사 (데스크탑 전용: 카드 오른쪽 끝 독립 컬럼) */}
                <div className="hidden sm:flex w-24 flex-shrink-0 items-center justify-center border-l border-gray-100 pl-3 self-stretch">
                    <span className="text-sm font-extrabold text-gray-900 leading-tight text-center break-keep">
                        {publisher || '뉴스'}
                    </span>
                </div>
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
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-[0_1px_8px_rgba(15,30,80,0.06)]">
            <div className="max-w-6xl mx-auto px-4 flex justify-between items-center h-14">
                <div className="flex items-center gap-6">
                    <a href={`${baseUrl}/`} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                        <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
                            <i className="fas fa-link text-sm"></i>
                        </span>
                        <span className="font-black text-xl tracking-tighter text-gray-900">Faith<span className="text-blue-600">Portal</span></span>
                    </a>
                    <nav className="hidden sm:flex gap-1 text-sm font-bold text-gray-600">
                        <a href={`${baseUrl}/news`} className="px-3 py-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">뉴스</a>
                        <a href={`${baseUrl}/lifestyle`} className="px-3 py-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">유틸리티</a>
                        <a href={`${baseUrl}/finance`} className="px-3 py-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">금융</a>
                        <a href={`${baseUrl}/game`} className="px-3 py-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">게임</a>
                    </nav>
                </div>
                <div className="flex items-center gap-3">
                    {user ? (
                        <>
                            <span className="hidden sm:inline text-xs font-bold text-gray-500">{user.name}님</span>
                            <a href={`${baseUrl}/mypage`} className="text-xs font-bold text-gray-600 hover:text-blue-600 transition-colors">마이페이지</a>
                            <button onClick={onLogout} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">로그아웃</button>
                        </>
                    ) : (
                        <>
                            <a href={`${baseUrl}/login`} className="text-xs font-bold text-gray-600 hover:text-blue-600 transition-colors">로그인</a>
                            <a href={`${baseUrl}/signup`} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">회원가입</a>
                        </>
                    )}
                </div>
            </div>
        </header>
    </>
);

export const QuickMenu = () => (
    <nav className="mb-16 max-w-4xl mx-auto" id="quick-menu">
        <div className="overflow-x-auto hide-scrollbar -mx-1 px-1 sm:mx-0 sm:px-0 py-4">
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
                        <div className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-2 rounded-2xl ${item.bg} shadow-sm flex items-center justify-center transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_8px_16px_rgba(37,99,235,0.15)] group-hover:ring-2 group-hover:ring-blue-400`}>
                            <i className={`fas ${item.icon} text-xl sm:text-2xl ${item.color} group-hover:scale-110 transition-transform`}></i>
                        </div>
                        <p className="text-[11px] sm:text-xs text-gray-800 font-bold group-hover:text-brand-green transition-colors">{item.label}</p>
                    </a>
                ))}
            </div>
        </div>
    </nav>
);

export const Footer = ({ baseUrl = '' }: { baseUrl?: string } = {}) => {
    const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
    const [isInstalled, setIsInstalled] = React.useState(false);
    const [isInstalling, setIsInstalling] = React.useState(false);

    React.useEffect(() => {
        // 설치 여부 감지: ① 앱으로 실행 중(standalone) ② 이 브라우저의 설치 기록 ③ getInstalledRelatedApps
        if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
            setIsInstalled(true);
        }
        try {
            if (localStorage.getItem('faithlink_pwa_installed') === '1') setIsInstalled(true);
        } catch { /* localStorage 차단 환경 무시 */ }
        const nav = navigator as any;
        if (typeof nav.getInstalledRelatedApps === 'function') {
            nav.getInstalledRelatedApps()
                .then((apps: any[]) => { if (apps && apps.length > 0) setIsInstalled(true); })
                .catch(() => { /* 무시 */ });
        }

        // 이미 글로벌에서 잡힌 prompt가 있다면 가져오기
        if ((window as any).deferredPrompt) {
            setDeferredPrompt((window as any).deferredPrompt);
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            (window as any).deferredPrompt = e;
            setDeferredPrompt(e);
            // beforeinstallprompt는 미설치 상태에서만 발생 → 미설치로 간주(삭제 후 재설치 케이스 포함)
            setIsInstalled(false);
            try { localStorage.removeItem('faithlink_pwa_installed'); } catch { /* 무시 */ }
        };

        const handleAppInstalled = () => {
            setIsInstalling(false);
            setIsInstalled(true);
            (window as any).deferredPrompt = null;
            try { localStorage.setItem('faithlink_pwa_installed', '1'); } catch { /* 무시 */ }
            setTimeout(() => {
                alert('설치가 완료되었습니다!');
            }, 500);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);
        
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (isInstalled) {
            alert('이미 페이스링크 앱이 기기에 설치되어 있습니다.\n바탕화면에서 아이콘을 찾아 실행해 보세요.');
            return;
        }

        if (!deferredPrompt) {
            // deferredPrompt가 없다는 것은 iOS 사파리이거나, 아직 이벤트가 발생하지 않았거나, 지원하지 않는 브라우저(카카오톡 인앱 등)임.
            const userAgent = window.navigator.userAgent.toLowerCase();
            const isIOS = /iphone|ipad|ipod/.test(userAgent);
            const isKakao = userAgent.includes('kakaotalk');
            const isNaver = userAgent.includes('naver');

            if (isKakao || isNaver) {
                alert('⚠️ 카카오톡/네이버 브라우저에서는 앱 설치가 지원되지 않습니다.\n\n우측 하단(또는 상단)의 [⋮] 버튼을 눌러 "다른 브라우저로 열기(크롬/사파리)"를 선택한 후 설치해주세요!');
                return;
            }

            if (isIOS) {
                alert('🍎 아이폰(Safari) 설치 안내\n\n아이폰은 자동으로 설치창이 뜨지 않습니다.\n화면 맨 아래의 [공유] 아이콘(가운데 네모 위 화살표)을 누른 후, 메뉴를 위로 올려서 [홈 화면에 추가]를 직접 눌러주세요!');
            } else {
                alert('📱 안드로이드 설치 안내\n\n자동 설치창을 띄울 수 없는 환경입니다.\n브라우저 우측 상단의 [⋮] 메뉴를 누른 후 [홈 화면에 추가] 또는 [앱 설치]를 직접 선택해주세요!');
            }
            return;
        }

        setIsInstalling(true);
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        } else {
            setIsInstalling(false);
        }
    };

    return (
        <footer className="bg-white border-t border-gray-200 mt-20 py-12">
            <div className="max-w-6xl mx-auto px-4">
                
                {/* 앱 설치 카드 (앱이 설치되어 있지 않을 때만 노출) */}
                {!isInstalled && (
                <div className="mb-10 p-6 bg-blue-50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-blue-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0 text-brand-green">
                            {isInstalled ? <i className="fas fa-check-circle text-2xl"></i> : <i className="fas fa-mobile-alt text-2xl"></i>}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">페이스링크 앱 설치하기</h3>
                            <p className="text-sm text-gray-600">
                                {isInstalled ? '이미 페이스링크 앱이 기기에 설치되어 있습니다.' : '바탕화면에 아이콘을 추가하고 더 빠르고 편리하게 접속하세요!'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={handleInstallClick}
                        disabled={isInstalled || isInstalling}
                        className={`w-full sm:w-auto px-6 py-3 font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 ${
                            isInstalled 
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-brand-green hover:bg-brand-green-hover text-white'
                        }`}
                    >
                        {isInstalling ? (
                            <><i className="fas fa-spinner fa-spin"></i><span>설치 진행 중...</span></>
                        ) : isInstalled ? (
                            <><i className="fas fa-check"></i><span>설치 완료됨</span></>
                        ) : (
                            <><i className="fas fa-download"></i><span>홈 화면에 추가 (설치)</span></>
                        )}
                    </button>
                </div>
                )}

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
};
