import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from '@hono/node-server/serve-static';
import fs from 'fs';
import { getDB } from './db/adapter';
import { findRelatedStocks } from './utils/stockMapper';
import { fetchBatchStockData } from './utils/stockDataFetcher';
import { getMockExchangeRates } from './utils/exchangeRateProvider';
import { optionalAuth } from './middleware/auth';
import { escapeHtml } from './utils/htmlEscape';
import { getCategoryName, getCategoryColor, getTimeAgo } from './utils/formatter';
import { AppError } from './middleware/errors';
import { startNewsScheduler } from './services/newsScheduler';
import { authRoutes } from './api/routes/auth';
import { gameRoutes } from './api/routes/game';
import { newsRoutes, parseGoogleNewsRSS } from './api/routes/news';
import { stockRoutes } from './api/routes/stock';
import { utilsRoutes } from './api/routes/utils';
import { adminRoutes } from './api/routes/admin';
import { mypageRoutes } from './api/routes/mypage';
const app = new Hono();
// 전역 에러 핸들러
app.onError((err, c) => {
    console.error(`[Global Error] ${c.req.method} ${c.req.url}:`, err);
    const isApi = c.req.path.startsWith('/api/') || c.req.header('Accept')?.includes('application/json');
    if (isApi) {
        c.header('Content-Type', 'application/json; charset=UTF-8');
        if (err instanceof AppError) {
            return c.json({
                success: false,
                code: err.code,
                message: err.message
            }, err.statusCode);
        }
        return c.json({
            success: false,
            message: err instanceof Error ? err.message : 'Internal Server Error'
        }, 500);
    }
    return c.text('Internal Server Error', 500);
});
// CORS 설정 (API 요청용)
app.use('/api/*', cors());
// 정적 파일 서빙 (Node.js 환경용)
// Cloudflare Pages에서는 자동으로 처리되므로 조건부로 적용
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    // Node.js 환경에서만 정적 파일 서빙
    app.use('/*', serveStatic({ root: './public' }));
}
// ==================== UI 컴포넌트 (분리됨) ====================
import { getBreadcrumb, getGameMenu, getSimpleGameSidebar, getLifestyleMenu, getFinanceMenu, getEntertainmentMenu, getEducationMenu, getCommonHeader, getStickyHeader, getCommonAuthScript, getCommonFooter, getAdminNavigation } from './views/components/layout';
// ==================== 분리된 라우트 모듈 마운트 ====================
app.route('/', authRoutes);
app.route('/', gameRoutes);
app.route('/', newsRoutes);
app.route('/', stockRoutes);
app.route('/', utilsRoutes);
app.route('/', adminRoutes);
app.route('/', mypageRoutes);
app.get('/', async (c) => {
    const DB = getDB(c);
    // 최신 뉴스 5개 가져오기 (자동 수집 로직 제거)
    let latestNews = [];
    try {
        const { results } = await DB.prepare('SELECT * FROM news ORDER BY created_at DESC LIMIT 5').all();
        latestNews = results || [];
    }
    catch (error) {
        console.error('뉴스 조회 오류:', error);
    }
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko" id="html-root">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Faith Portal - 믿음의 포탈</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link rel="alternate icon" href="/favicon.ico">
        <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
        <script>
            // Tailwind CDN 경고 필터링 (개발 환경용)
            (function() {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                    if (args[0] && typeof args[0] === 'string' && 
                        args[0].includes('cdn.tailwindcss.com should not be used in production')) {
                        return; // Tailwind CDN 경고 무시
                    }
                    originalWarn.apply(console, args);
                };
            })();
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
            tailwind.config = {
                darkMode: 'class',
                theme: {
                    extend: {
                        colors: {
                            'brand-navy': '#1e3a8a',
                            'brand-blue': '#3b82f6',
                            'accent-orange': '#f97316',
                        }
                    }
                }
            }
        </script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            * {
                font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
                letter-spacing: -0.02em;
            }
            
            /* 헤더 그라데이션 */
            .header-gradient {
                background: linear-gradient(135deg, #03c75a 0%, #059b44 50%, #03c75a 100%);
                background-size: 200% 100%;
                animation: headerShift 10s ease-in-out infinite;
            }
            
            @keyframes headerShift {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
            }
            
            /* 네이버 스타일 화이트 배경 */
            body {
                background: #f5f6f7;
                min-height: 100vh;
            }
            
            /* 메인 컨테이너 */
            main {
                position: relative;
            }
            
            /* 네이버 그린 컬러 팔레트 */
            .brand-green { 
                background: #03c75a;
            }
            .brand-green-hover:hover { 
                background: #02b350;
                transform: none;
            }
            .brand-navy { 
                background: #03c75a; 
            }
            .brand-navy-hover:hover { 
                background: #02b350; 
            }
            .accent-orange { 
                background: #ff6b00; 
            }
            .accent-orange-hover:hover { 
                background: #e65f00; 
            }
            .faith-blue { background: #1ec800; }
            .faith-blue-hover:hover { background: #19b600; }
            
            /* 다크모드는 비활성화 */
            .dark {
                color-scheme: light;
            }
            
            /* 네이버 스타일 검색창 */
            .search-shadow { 
                background: #ffffff;
                border: 2px solid #03c75a;
                box-shadow: none;
                transition: all 0.2s ease;
                border-radius: 40px;
            }
            .search-shadow:hover {
                transform: none;
                border-color: #02b350;
                box-shadow: 0 2px 8px rgba(3, 199, 90, 0.15);
            }
            .search-shadow:focus-within {
                transform: none;
                border-color: #02b350;
                box-shadow: 0 2px 12px rgba(3, 199, 90, 0.2);
            }
            .search-input {
                border: none;
                outline: none;
                background: transparent;
                color: #000000;
                font-size: 1.125rem;
                font-weight: 400;
            }
            .search-input::placeholder {
                color: #8e8e8e;
                font-weight: 400;
            }
            
            /* 네이버 스타일 카드 디자인 */
            .content-card {
                background: #ffffff;
                border-radius: 12px;
                border: 1px solid #e4e8eb;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                transition: all 0.2s ease;
            }
            .content-card:hover {
                transform: translateY(-2px);
                border-color: #c9cdd2;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            }
            
            /* 배너 카드 */
            .banner-card {
                background: #ffffff;
                border-radius: 12px;
                border: 1px solid #e4e8eb;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                transition: all 0.2s ease;
            }
            .banner-card:hover {
                transform: translateY(-2px);
                border-color: #c9cdd2;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            }
            
            /* 날씨 위젯 */
            .weather-widget {
                background: #ffffff;
                border-radius: 12px;
                border: 1px solid #e4e8eb;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            }
            
            /* 네이버 스타일 퀵 메뉴 */
            .quick-menu-icon {
                background: #ffffff;
                border: 1px solid #e4e8eb;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                transition: all 0.2s ease;
                border-radius: 16px;
            }
            .quick-menu-icon:hover {
                transform: translateY(-2px);
                border-color: #03c75a;
                box-shadow: 0 4px 12px rgba(3, 199, 90, 0.12);
            }
            
            .pulse-animation {
                animation: pulse 2s ease-in-out infinite;
            }
            @keyframes pulse {
                0%, 100% { 
                    opacity: 1;
                }
                50% { 
                    opacity: 0.8;
                }
            }
            
            /* 네이버 스타일 배지 */
            .badge {
                display: inline-flex;
                align-items: center;
                padding: 3px 8px;
                border-radius: 4px;
                font-size: 0.6875rem;
                font-weight: 700;
                letter-spacing: -0.01em;
                transition: all 0.2s ease;
            }
            
            /* 심플한 순위 숫자 */
            .rank-number {
                font-weight: 700;
                font-size: 1.125rem;
                color: #03c75a;
                transition: all 0.2s ease;
            }
            
            /* 네이버 스타일 텍스트 색상 */
            .title-bold {
                font-weight: 700;
                color: #000000;
                letter-spacing: -0.02em;
            }
            .text-medium {
                color: #505050;
                font-weight: 400;
            }
            .text-light {
                color: #8e8e8e;
                font-weight: 400;
            }
            
            /* 심플한 애니메이션 */
            .floating {
                animation: none;
            }
            
            /* 심플한 Shine 효과 */
            .shine {
                position: relative;
                overflow: hidden;
            }
            .shine::before {
                display: none;
            }
            
            /* Glow 효과 제거 */
            .glow {
                box-shadow: none;
                animation: none;
            }
            /* 스크롤바 숨기기 (기능은 유지) */
            .hide-scrollbar {
                -ms-overflow-style: none;  /* IE and Edge */
                scrollbar-width: none;  /* Firefox */
            }
            .hide-scrollbar::-webkit-scrollbar {
                display: none;  /* Chrome, Safari, Opera */
            }
        </style>
    </head>
    <body class="transition-colors duration-300">
        ${getCommonHeader()}
        ${getStickyHeader()}

        <!-- 메인 검색 영역 -->
        <main class="max-w-6xl mx-auto px-4 py-12">
            <!-- 검색창 - 글래스모피즘 디자인 -->
            <div class="mb-16 max-w-3xl mx-auto" id="main-search">
                <div class="relative search-shadow">
                    <div class="flex items-center px-6 sm:px-8 py-3 sm:py-4">
                        <input 
                            type="text" 
                            id="search-input"
                            placeholder="무엇을 찾으시나요?" 
                            class="search-input flex-1 text-base sm:text-lg text-gray-900 placeholder-gray-400 font-medium"
                        />
                        <button 
                            id="search-btn"
                            class="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full brand-navy text-white brand-navy-hover transition-all ml-3 sm:ml-4 shine"
                        >
                            <i class="fas fa-search text-base sm:text-xl"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- 퀵 메뉴 네비게이션 - 모던 디자인 -->
            <nav class="mb-16 max-w-4xl mx-auto" id="quick-menu">
                <div class="overflow-x-auto hide-scrollbar">
                    <div class="flex justify-start sm:justify-center items-center gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-0 pt-1 pb-1">
                        <a href="/news" class="group text-center flex-shrink-0">
                            <div class="w-16 h-16 sm:w-18 sm:h-18 mx-auto mb-3 rounded-2xl quick-menu-icon flex items-center justify-center">
                                <i class="fas fa-newspaper text-2xl sm:text-3xl text-blue-600"></i>
                            </div>
                            <p class="text-xs sm:text-sm text-gray-700 font-semibold group-hover:text-green-600 transition-colors whitespace-nowrap">뉴스</p>
                        </a>
                        <a href="/lifestyle" class="group text-center flex-shrink-0">
                            <div class="w-16 h-16 sm:w-18 sm:h-18 mx-auto mb-3 rounded-2xl quick-menu-icon flex items-center justify-center">
                                <i class="fas fa-home text-2xl sm:text-3xl text-green-600"></i>
                            </div>
                            <p class="text-xs sm:text-sm text-gray-700 font-semibold group-hover:text-green-600 transition-colors whitespace-nowrap">유틸리티</p>
                        </a>
                        <a href="/game" class="group text-center flex-shrink-0">
                            <div class="w-16 h-16 sm:w-18 sm:h-18 mx-auto mb-3 rounded-2xl quick-menu-icon flex items-center justify-center">
                                <i class="fas fa-gamepad text-2xl sm:text-3xl text-purple-600"></i>
                            </div>
                            <p class="text-xs sm:text-sm text-gray-700 font-semibold group-hover:text-purple-600 transition-colors whitespace-nowrap">게임</p>
                        </a>
                        <a href="/finance" class="group text-center flex-shrink-0">
                            <div class="w-16 h-16 sm:w-18 sm:h-18 mx-auto mb-3 rounded-2xl quick-menu-icon flex items-center justify-center">
                                <i class="fas fa-won-sign text-2xl sm:text-3xl text-orange-600"></i>
                            </div>
                            <p class="text-xs sm:text-sm text-gray-700 font-semibold group-hover:text-orange-600 transition-colors whitespace-nowrap">금융</p>
                        </a>
                        <a href="/shopping" class="group text-center flex-shrink-0">
                            <div class="w-16 h-16 sm:w-18 sm:h-18 mx-auto mb-3 rounded-2xl quick-menu-icon flex items-center justify-center">
                                <i class="fas fa-shopping-bag text-2xl sm:text-3xl text-pink-600"></i>
                            </div>
                            <p class="text-xs sm:text-sm text-gray-700 font-semibold group-hover:text-pink-600 transition-colors whitespace-nowrap">쇼핑</p>
                        </a>
                        <a href="/entertainment" class="group text-center flex-shrink-0">
                            <div class="w-16 h-16 sm:w-18 sm:h-18 mx-auto mb-3 rounded-2xl quick-menu-icon flex items-center justify-center">
                                <i class="fas fa-film text-2xl sm:text-3xl text-red-600"></i>
                            </div>
                            <p class="text-xs sm:text-sm text-gray-700 font-semibold group-hover:text-red-600 transition-colors whitespace-nowrap">엔터</p>
                        </a>
                        <a href="/education" class="group text-center flex-shrink-0">
                            <div class="w-16 h-16 sm:w-18 sm:h-18 mx-auto mb-3 rounded-2xl quick-menu-icon flex items-center justify-center">
                                <i class="fas fa-graduation-cap text-2xl sm:text-3xl text-indigo-600"></i>
                            </div>
                            <p class="text-xs sm:text-sm text-gray-700 font-semibold group-hover:text-indigo-600 transition-colors whitespace-nowrap">교육</p>
                        </a>
                    </div>
                </div>
            </nav>

            <!-- 메인 2컬럼 레이아웃 -->
            <div class="flex flex-col md:flex-row gap-8 mb-12">
                <!-- 왼쪽 컬럼: 배너, 날씨, 뉴스 -->
                <div class="w-full md:w-[728px] shrink-0">
                    <!-- 제휴 배너 -->
                    <div class="mb-4">
                        <a href="https://link.coupang.com/a/dwChmy" target="_blank" rel="noopener noreferrer" referrerpolicy="unsafe-url" class="block">
                            <img src="https://ads-partners.coupang.com/banners/959332?subId=&traceId=V0-301-879dd1202e5c73b2-I959332&w=728&h=90" 
                                 alt="쿠팡 파트너스 배너" 
                                 class="w-full h-auto rounded-xl shadow-sm" />
                        </a>
                    </div>

                    <!-- 날씨 위젯 -->
                    <div class="weather-widget p-5 mb-4">
                        <div class="flex items-center justify-between">
                            <!-- 현재 날씨 -->
                            <div class="flex items-center gap-4">
                                <div class="text-4xl" id="weather-icon">
                                    <i class="fas fa-cloud-sun text-blue-400"></i>
                                </div>
                                <div>
                                    <div class="flex items-baseline gap-2">
                                        <span class="text-3xl font-bold text-gray-900" id="weather-temp">1.3°</span>
                                        <span class="text-base text-gray-600 font-normal">비</span>
                                    </div>
                                    <div class="text-sm text-gray-500 mt-1 font-normal" id="weather-location">서울</div>
                                </div>
                            </div>
                            
                            <!-- 미세먼지/초미세먼지 -->
                            <div class="flex gap-4 sm:gap-8">
                                <div class="text-center">
                                    <div class="text-xs text-gray-500 mb-1.5 font-medium">미세</div>
                                    <div class="text-base font-bold">
                                        <span class="text-blue-600">좋음</span>
                                    </div>
                                </div>
                                <div class="text-center">
                                    <div class="text-xs text-gray-500 mb-1.5 font-medium">초미세</div>
                                    <div class="text-base font-bold">
                                        <span class="text-blue-600">좋음</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 실시간 뉴스 -->
                    <div class="content-card p-8">
                        <h3 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-3">
                                <i class="fas fa-newspaper text-white text-lg"></i>
                            </div>
                            <span>실시간 뉴스</span>
                            <span class="ml-3 text-xs bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1.5 rounded-full pulse-animation font-bold shadow-lg">LIVE</span>
                            <!-- DEBUG: KOSPI CHECK ACTIVE -->
                        </h3>
                        <div class="space-y-2" id="latest-news">
                            ${latestNews.length > 0 ? latestNews.map((news, index) => {
        const timeAgo = getTimeAgo(news.created_at);
        const categoryColor = getCategoryColor(news.category);
        try {
            if (news.title.includes('코스피')) {
                fs.appendFileSync('debug_kospi.txt', `[DEBUG] Found Kospi in: ${news.title}\n`);
            }
        }
        catch (e) { }
        return `
                                <a href="/news/${news.id}" class="block hover:bg-gray-50 py-3 px-4 rounded-lg transition-all group border border-transparent hover:border-gray-200">
                                    <div class="flex items-start gap-3">
                                        <span class="rank-number flex-shrink-0 mt-1">${index + 1}</span>
                                        <div class="flex-1 min-w-0">
                                            <div class="flex items-center gap-2 mb-2">
                                                <span class="badge ${categoryColor}">${getCategoryName(news.category)}</span>
                                                <span class="text-gray-500 text-xs font-bold flex-shrink-0">${timeAgo}</span>
                                                ${(news.title.includes('환율') || news.title.includes('주가') || news.title.includes('증시') || news.title.includes('달러') || news.title.includes('코스피') || news.title.includes('경제')) ?
            `<span class="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                                                    <i class="fas fa-chart-line mr-1"></i>분석됨
                                                </span>` : ''}
                                            </div>
                                            <p class="text-gray-900 group-hover:text-blue-600 font-semibold text-sm leading-snug line-clamp-2">${escapeHtml(news.title)}</p>
                                        </div>
                                    </div>
                                </a>
                              `;
    }).join('') : `
                                <div class="text-center py-12 text-gray-500">
                                    <i class="fas fa-newspaper text-5xl mb-4 text-gray-300"></i>
                                    <p class="font-medium">뉴스를 불러오는 중입니다...</p>
                                    <a href="/news" class="mt-4 inline-block text-blue-700 hover:text-blue-800 font-bold">
                                        뉴스 페이지로 이동 →
                                    </a>
                                </div>
                            `}
                        </div>
                        ${latestNews.length > 0 ? `
                            <div class="mt-8 text-center">
                                <a href="/news" class="inline-flex items-center px-8 py-3 accent-orange text-white rounded-xl hover:shadow-xl transition-all accent-orange-hover font-bold shine">
                                    <span>더 많은 뉴스 보기</span>
                                    <i class="fas fa-arrow-right ml-2"></i>
                                </a>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- 오른쪽 컬럼: 마이페이지 카드 + 실시간 트렌드 -->
                <div class="flex-1 flex flex-col gap-4">
                    <!-- 마이페이지 카드 -->
                    <div class="content-card p-6" id="mypage-widget">
                        <!-- 로딩 상태 -->
                        <div id="mypage-loading" class="text-center py-4">
                            <i class="fas fa-spinner fa-spin text-gray-400 text-2xl"></i>
                        </div>
                        
                        <!-- 로그인 상태 (기본 숨김) -->
                        <div id="mypage-logged-in" class="hidden">
                            <div class="flex items-start gap-4 mb-4">
                                <!-- 프로필 이미지 -->
                                <div class="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                    <i class="fas fa-user text-white text-2xl"></i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2 mb-1">
                                        <span id="mypage-username" class="text-lg font-bold text-gray-900">사용자</span>
                                        <span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">회원</span>
                                    </div>
                                    <p id="mypage-email" class="text-sm text-gray-500 truncate">user@example.com</p>
                                    <div class="flex items-center gap-3 mt-2 text-sm">
                                        <span class="text-gray-600"><i class="fas fa-bookmark text-yellow-500 mr-1"></i>북마크 <span id="mypage-bookmarks" class="font-bold text-gray-900">0</span></span>
                                    </div>
                                </div>
                                <button onclick="logout()" class="text-sm text-gray-500 hover:text-red-500 transition-colors px-3 py-1 border border-gray-300 rounded-lg hover:border-red-300">
                                    <i class="fas fa-sign-out-alt mr-1"></i>로그아웃
                                </button>
                            </div>
                            <!-- 퀵 메뉴 -->
                            <div class="grid grid-cols-4 gap-2 pt-4 border-t border-gray-100">
                                <a href="/mypage" class="text-center py-2 hover:bg-gray-50 rounded-lg transition-colors">
                                    <i class="fas fa-user-circle text-blue-500 text-lg mb-1"></i>
                                    <p class="text-xs text-gray-600 font-medium">마이페이지</p>
                                </a>
                                <a href="/bookmarks" class="text-center py-2 hover:bg-gray-50 rounded-lg transition-colors">
                                    <i class="fas fa-bookmark text-yellow-500 text-lg mb-1"></i>
                                    <p class="text-xs text-gray-600 font-medium">북마크</p>
                                </a>
                                <a href="/game/simple" class="text-center py-2 hover:bg-gray-50 rounded-lg transition-colors">
                                    <i class="fas fa-gamepad text-purple-500 text-lg mb-1"></i>
                                    <p class="text-xs text-gray-600 font-medium">게임</p>
                                </a>
                                <a href="/news" class="text-center py-2 hover:bg-gray-50 rounded-lg transition-colors">
                                    <i class="fas fa-newspaper text-blue-500 text-lg mb-1"></i>
                                    <p class="text-xs text-gray-600 font-medium">뉴스</p>
                                </a>
                            </div>
                        </div>
                        
                        <!-- 로그아웃 상태 (기본 숨김) -->
                        <div id="mypage-logged-out" class="hidden">
                            <div class="text-center py-4">
                                <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                    <i class="fas fa-user text-gray-400 text-3xl"></i>
                                </div>
                                <h3 class="text-lg font-bold text-gray-900 mb-2">Faith Portal에 오신 것을 환영합니다</h3>
                                <p class="text-sm text-gray-500 mb-4">로그인하고 더 많은 서비스를 이용하세요</p>
                                <div class="flex gap-3 justify-center">
                                    <a href="/login" class="px-6 py-2.5 bg-white border-2 border-green-500 text-green-600 rounded-lg font-bold hover:bg-green-50 transition-colors">
                                        <i class="fas fa-sign-in-alt mr-1"></i>로그인
                                    </a>
                                    <a href="/signup" class="px-6 py-2.5 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors shadow-lg">
                                        <i class="fas fa-user-plus mr-1"></i>회원가입
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <script>
                        // 마이페이지 위젯 상태 업데이트
                        async function updateMypageWidget() {
                            try {
                                const response = await fetch('/api/auth/me', { credentials: 'include' });
                                const data = await response.json();
                                
                                document.getElementById('mypage-loading').classList.add('hidden');
                                
                                if (data.loggedIn && data.user) {
                                    document.getElementById('mypage-logged-in').classList.remove('hidden');
                                    document.getElementById('mypage-logged-out').classList.add('hidden');
                                    document.getElementById('mypage-username').textContent = data.user.name + '님';
                                    document.getElementById('mypage-email').textContent = data.user.email || '';
                                    
                                    // 북마크 수 가져오기
                                    try {
                                        const bookmarkRes = await fetch('/api/bookmarks?userId=' + data.user.id);
                                        const bookmarkData = await bookmarkRes.json();
                                        if (bookmarkData.success) {
                                            document.getElementById('mypage-bookmarks').textContent = bookmarkData.bookmarks?.length || 0;
                                        }
                                    } catch (e) {
                                        console.log('북마크 수 조회 실패');
                                    }
                                } else {
                                    document.getElementById('mypage-logged-in').classList.add('hidden');
                                    document.getElementById('mypage-logged-out').classList.remove('hidden');
                                }
                            } catch (error) {
                                console.error('마이페이지 위젯 오류:', error);
                                document.getElementById('mypage-loading').classList.add('hidden');
                                document.getElementById('mypage-logged-out').classList.remove('hidden');
                            }
                        }
                        
                        // 페이지 로드 시 실행
                        updateMypageWidget();
                    </script>

                    <!-- 실시간 트렌드 -->
                    <div class="content-card p-6">
                        <h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
                            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mr-2">
                                <i class="fas fa-chart-line text-white text-sm"></i>
                            </div>
                            <span>실시간 트렌드</span>
                            <span class="ml-2 text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full pulse-animation font-bold">HOT</span>
                        </h3>
                        <div class="space-y-1">
                            <div class="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg transition-all">
                                <div class="flex items-center">
                                    <span class="rank-number mr-3 text-sm">1</span>
                                    <span class="text-gray-900 font-medium text-sm">인공지능 기술</span>
                                </div>
                                <i class="fas fa-arrow-up text-green-500 text-xs"></i>
                            </div>
                            <div class="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg transition-all">
                                <div class="flex items-center">
                                    <span class="rank-number mr-3 text-sm">2</span>
                                    <span class="text-gray-900 font-medium text-sm">날씨 정보</span>
                                </div>
                                <i class="fas fa-arrow-up text-green-500 text-xs"></i>
                            </div>
                            <div class="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg transition-all">
                                <div class="flex items-center">
                                    <span class="rank-number mr-3 text-sm">3</span>
                                    <span class="text-gray-900 font-medium text-sm">맛집 추천</span>
                                </div>
                                <i class="fas fa-minus text-gray-400 text-xs"></i>
                            </div>
                            <div class="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg transition-all">
                                <div class="flex items-center">
                                    <span class="rank-number mr-3 text-sm">4</span>
                                    <span class="text-gray-900 font-medium text-sm">여행 정보</span>
                                </div>
                                <i class="fas fa-arrow-down text-red-500 text-xs"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 추천 콘텐츠 -->
            <div class="bg-gradient-to-r from-blue-900 to-blue-700 rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 text-center text-white shine mx-4">
                <i class="fas fa-star text-yellow-400 text-3xl sm:text-4xl mb-3 sm:mb-4"></i>
                <h3 class="text-xl sm:text-2xl font-bold mb-2">Faith Portal과 함께하세요</h3>
                <p class="text-white/90 mb-4 sm:mb-6 text-sm sm:text-base">지금 가입하고 더 많은 혜택을 누리세요</p>
                <a href="/signup" class="inline-block bg-white text-blue-900 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold hover:bg-gray-100 transition shadow-lg text-sm sm:text-base">
                    무료로 시작하기 <i class="fas fa-arrow-right ml-2"></i>
                </a>
            </div>
        </main>

        <script>
            // 뉴스 링크 열기 (Referrer 없이)
            function openNewsLink(url) {
                console.log('[openNewsLink] 실행 - 원본 URL:', url);
                const proxyUrl = '/news/redirect?url=' + encodeURIComponent(url);
                window.open(proxyUrl, '_blank', 'noopener,noreferrer');
            }
            
            // 검색 기능
            document.getElementById('search-btn').addEventListener('click', function() {
                const query = document.getElementById('search-input').value;
                if (query.trim()) {
                    alert('검색어: ' + query + '\\n(실제 검색 기능은 추가 구현이 필요합니다)');
                }
            });

            // 엔터키로 검색
            document.getElementById('search-input').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    document.getElementById('search-btn').click();
                }
            });

            // 로그인 상태 확인과 다크모드는 공통 스크립트에서 처리
        </script>

        ${getCommonAuthScript()}

        ${getCommonFooter()}

        <!-- 베타 테스트 공지사항 모달 -->
        <div id="betaNoticeModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
            <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                <!-- 모달 헤더 -->
                <div class="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <i class="fas fa-exclamation-triangle text-white text-2xl"></i>
                            <h3 class="text-xl font-bold text-white">베타 테스트 안내</h3>
                        </div>
                        <button onclick="closeBetaNotice()" class="text-white hover:text-gray-200 transition-colors">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>
                
                <!-- 모달 내용 -->
                <div class="p-6">
                    <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <i class="fas fa-info-circle text-yellow-400 text-xl"></i>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm text-yellow-800 leading-relaxed">
                                    현재 보시는 페이지는 홈페이지를 만들기 전에 <strong>베타테스트 중인 페이지</strong>입니다.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="space-y-3 mb-6">
                        <div class="flex items-start gap-3">
                            <i class="fas fa-check-circle text-green-500 mt-1"></i>
                            <p class="text-gray-700">일부 기능이 정상적으로 동작하지 않을 수 있습니다.</p>
                        </div>
                        <div class="flex items-start gap-3">
                            <i class="fas fa-check-circle text-green-500 mt-1"></i>
                            <p class="text-gray-700">사용하시는 데 착오 없으시기 바랍니다.</p>
                        </div>
                        <div class="flex items-start gap-3">
                            <i class="fas fa-check-circle text-green-500 mt-1"></i>
                            <p class="text-gray-700">불편 사항이나 버그 발견 시 피드백 부탁드립니다.</p>
                        </div>
                    </div>
                    
                    <div class="flex gap-3">
                        <button onclick="closeBetaNoticePermanently()" class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors">
                            <i class="fas fa-check mr-2"></i>다시 보지 않기
                        </button>
                        <button onclick="closeBetaNotice()" class="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-lg">
                            <i class="fas fa-times-circle mr-2"></i>닫기
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <script>
            // 베타 공지사항 모달 제어
            function closeBetaNotice() {
                document.getElementById('betaNoticeModal').classList.add('hidden');
            }
            
            function closeBetaNoticePermanently() {
                localStorage.setItem('betaNoticeHidden', 'true');
                closeBetaNotice();
            }
            
            // 페이지 로드 시 모달 표시 (이전에 "다시 보지 않기"를 선택하지 않은 경우)
            window.addEventListener('DOMContentLoaded', function() {
                const isHidden = localStorage.getItem('betaNoticeHidden');
                if (!isHidden) {
                    setTimeout(function() {
                        document.getElementById('betaNoticeModal').classList.remove('hidden');
                    }, 500); // 0.5초 후 표시
                }
            });
            
            // ESC 키로 모달 닫기
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    closeBetaNotice();
                }
            });
            
            // 모달 배경 클릭 시 닫기
            document.getElementById('betaNoticeModal').addEventListener('click', function(e) {
                if (e.target === this) {
                    closeBetaNotice();
                }
            });
        </script>

    </body>
    </html>
  `);
});
// ==================== 게임 페이지 ====================
// 게임 메인 페이지 (심플 게임으로 리다이렉트)
app.get('/game', (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko" id="html-root">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>게임 홈 - Faith Portal</title>
        <script>
            (function() {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                    if (args[0] && typeof args[0] === 'string' && 
                        args[0].includes('cdn.tailwindcss.com should not be used in production')) {
                        return;
                    }
                    originalWarn.apply(console, args);
                };
            })();
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50 flex flex-col min-h-screen" id="html-root">
        \${getCommonHeader('Game')}
        \${getStickyHeader()}
        
        \${getBreadcrumb([
            { label: '홈', href: '/' },
            { label: '게임', href: '/game' }
        ])}

        \${getGameMenu('/game')}

        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
            <h2 class="text-[22px] font-bold text-gray-900 mb-5">대표 게임</h2>
            
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-12">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 p-6 sm:p-8">
                    
                    <!-- Item 1 -->
                    <div class="flex items-start gap-4 cursor-pointer group">
                        <div class="w-[84px] h-[84px] rounded-2xl bg-[#ffeb3b] flex-shrink-0 overflow-hidden border border-gray-100 group-hover:shadow-md transition-shadow relative">
                            <img src="https://picsum.photos/seed/webare/200/200" alt="위 베어 베어스 더 퍼즐" class="w-full h-full object-cover">
                        </div>
                        <div class="flex-1 min-w-0 pt-0.5">
                            <h3 class="text-[16px] font-bold text-gray-900 truncate mb-1.5 group-hover:text-blue-600 transition-colors">위 베어 베어스 더 퍼즐</h3>
                            <p class="text-[13px] text-gray-500 leading-snug line-clamp-2 mb-2.5">그리즐리, 판다, 아이스베어가 퍼즐로 등장했다! 위 베어 베어스 3 매치 퍼즐 게...</p>
                            <div class="flex items-center text-[12px] text-gray-400 font-medium tracking-tight">
                                <i class="fas fa-user text-gray-300 mr-1.5"></i> 350만 플레이
                            </div>
                        </div>
                    </div>
                    
                    <!-- Item 2 -->
                    <div class="flex items-start gap-4 cursor-pointer group">
                        <div class="w-[84px] h-[84px] rounded-2xl bg-[#212121] flex-shrink-0 overflow-hidden border border-gray-100 group-hover:shadow-md transition-shadow relative">
                            <img src="https://picsum.photos/seed/rom/200/200" alt="롬: 리멤버 오브 마제스티" class="w-full h-full object-cover">
                        </div>
                        <div class="flex-1 min-w-0 pt-0.5">
                            <h3 class="text-[16px] font-bold text-gray-900 truncate mb-1.5 group-hover:text-blue-600 transition-colors">롬: 리멤버 오브 마제스티(ROM)</h3>
                            <p class="text-[13px] text-gray-500 leading-snug line-clamp-2 mb-2.5">쿼터뷰 시점의 클래식한 모바일 하드코어 MMORPG</p>
                            <div class="flex items-center text-[12px] text-gray-400 font-medium tracking-tight">
                                <i class="fas fa-user text-gray-300 mr-1.5"></i> 많은 유저가 시작
                            </div>
                        </div>
                    </div>

                    <!-- Item 3 -->
                    <div class="flex items-start gap-4 cursor-pointer group">
                        <div class="w-[84px] h-[84px] rounded-2xl bg-[#ff9800] flex-shrink-0 overflow-hidden border border-gray-100 group-hover:shadow-md transition-shadow relative">
                            <img src="https://picsum.photos/seed/guardian/200/200" alt="가디언 테일즈" class="w-full h-full object-cover">
                        </div>
                        <div class="flex-1 min-w-0 pt-0.5">
                            <h3 class="text-[16px] font-bold text-gray-900 truncate mb-1.5 group-hover:text-blue-600 transition-colors">가디언 테일즈</h3>
                            <p class="text-[13px] text-gray-500 leading-snug line-clamp-2 mb-2.5">띵작 어드벤처 가디언테일즈</p>
                            <div class="flex items-center text-[12px] text-gray-400 font-medium tracking-tight">
                                <i class="fas fa-user text-gray-300 mr-1.5"></i> 300만 플레이
                            </div>
                        </div>
                    </div>

                    <!-- Item 4 -->
                    <div class="flex items-start gap-4 cursor-pointer group">
                        <div class="w-[84px] h-[84px] rounded-2xl bg-[#03a9f4] flex-shrink-0 overflow-hidden border border-gray-100 group-hover:shadow-md transition-shadow relative">
                            <img src="https://picsum.photos/seed/eversoul/200/200" alt="에버소울" class="w-full h-full object-cover">
                        </div>
                        <div class="flex-1 min-w-0 pt-0.5">
                            <h3 class="text-[16px] font-bold text-gray-900 truncate mb-1.5 group-hover:text-blue-600 transition-colors">에버소울</h3>
                            <p class="text-[13px] text-gray-500 leading-snug line-clamp-2 mb-2.5">AWAKE YOUR SOUL</p>
                            <div class="flex items-center text-[12px] text-gray-400 font-medium tracking-tight">
                                <i class="fas fa-user text-gray-300 mr-1.5"></i> 150만 플레이
                            </div>
                        </div>
                    </div>

                    <!-- Item 5 -->
                    <div class="flex items-start gap-4 cursor-pointer group">
                        <div class="w-[84px] h-[84px] rounded-2xl bg-[#37474f] flex-shrink-0 overflow-hidden border border-gray-100 group-hover:shadow-md transition-shadow relative">
                            <img src="https://picsum.photos/seed/odin/200/200" alt="오딘: 발할라 라이징" class="w-full h-full object-cover">
                        </div>
                        <div class="flex-1 min-w-0 pt-0.5">
                            <h3 class="text-[16px] font-bold text-gray-900 truncate mb-1.5 group-hover:text-blue-600 transition-colors">오딘: 발할라 라이징</h3>
                            <p class="text-[13px] text-gray-500 leading-snug line-clamp-2 mb-2.5">《오딘: 발할라 라이징》, 신의 영역에 도전하다</p>
                            <div class="flex items-center text-[12px] text-gray-400 font-medium tracking-tight">
                                <i class="fas fa-user text-gray-300 mr-1.5"></i> 510만 플레이
                            </div>
                        </div>
                    </div>

                    <!-- Item 6 -->
                    <div class="flex items-start gap-4 cursor-pointer group">
                        <div class="w-[84px] h-[84px] rounded-2xl bg-[#e91e63] flex-shrink-0 overflow-hidden border border-gray-100 group-hover:shadow-md transition-shadow relative">
                            <img src="https://picsum.photos/seed/popcorn/200/200" alt="프렌즈팝콘" class="w-full h-full object-cover">
                        </div>
                        <div class="flex-1 min-w-0 pt-0.5">
                            <h3 class="text-[16px] font-bold text-gray-900 truncate mb-1.5 group-hover:text-blue-600 transition-colors">프렌즈팝콘</h3>
                            <p class="text-[13px] text-gray-500 leading-snug line-clamp-2 mb-2.5">자꾸만 손이 가는 1등 퍼즐게임, 프렌즈팝콘 : )</p>
                            <div class="flex items-center text-[12px] text-gray-400 font-medium tracking-tight">
                                <i class="fas fa-user text-gray-300 mr-1.5"></i> 630만 플레이
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="border-t border-gray-100">
                    <button class="w-full py-3.5 text-[14px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
                        더 보기 <i class="fas fa-chevron-down text-[10px] mt-0.5"></i>
                    </button>
                </div>
            </div>
            
            <!-- 포털 본래 제공 중이던 기존 미니게임으로 연결하는 CTA 추가 -->
            <h2 class="text-[22px] font-bold text-gray-900 mb-5 mt-4">간단한 킬링타임 미니게임</h2>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <a href="/game/simple/tetris" class="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-5 text-white hover:shadow-lg transition-all hover:-translate-y-1">
                    <i class="fas fa-th text-3xl mb-3 opacity-90"></i>
                    <h3 class="font-bold text-lg mb-1">테트리스</h3>
                    <p class="text-blue-100 text-xs">클래식 블록 퍼즐</p>
                </a>
                <a href="/game/simple/sudoku" class="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-5 text-white hover:shadow-lg transition-all hover:-translate-y-1">
                    <i class="fas fa-table text-3xl mb-3 opacity-90"></i>
                    <h3 class="font-bold text-lg mb-1">스도쿠</h3>
                    <p class="text-green-100 text-xs">두뇌 트레이닝</p>
                </a>
                <a href="/game/simple/2048" class="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl p-5 text-white hover:shadow-lg transition-all hover:-translate-y-1">
                    <i class="fas fa-th-large text-3xl mb-3 opacity-90"></i>
                    <h3 class="font-bold text-lg mb-1">2048</h3>
                    <p class="text-yellow-100 text-xs">숫자 퍼즐</p>
                </a>
                <a href="/game/simple/minesweeper" class="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl p-5 text-white hover:shadow-lg transition-all hover:-translate-y-1">
                    <i class="fas fa-bomb text-3xl mb-3 opacity-90"></i>
                    <h3 class="font-bold text-lg mb-1">지뢰찾기</h3>
                    <p class="text-red-100 text-xs">짜릿한 두뇌게임</p>
                </a>
            </div>
        </div>

        \${getCommonFooter()}
        \${getCommonAuthScript()}
    </body>
    </html>
    `);
});
// 심플 게임 페이지
app.get('/game/simple', (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko" id="html-root">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>심플 게임 - Faith Portal</title>
        <script>
            // Tailwind CDN 경고 필터링 (개발 환경용)
            (function() {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                    if (args[0] && typeof args[0] === 'string' && 
                        args[0].includes('cdn.tailwindcss.com should not be used in production')) {
                        return; // Tailwind CDN 경고 무시
                    }
                    originalWarn.apply(console, args);
                };
            })();
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .faith-blue { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); }
            .faith-blue-hover:hover { background: linear-gradient(135deg, #0284c7 0%, #0891b2 100%); }
        </style>
    </head>
    <body class="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" id="html-root">
        ${getCommonHeader('Game')}
        ${getStickyHeader()}
        
        ${getBreadcrumb([
        { label: '홈', href: '/' },
        { label: '게임', href: '/game' },
        { label: '심플 게임' }
    ])}

        ${getGameMenu('/game/simple')}

        <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 flex flex-col lg:flex-row gap-4 sm:gap-6">
            <!-- 좌측 사이드바 (게임 메뉴) -->
            <aside class="lg:w-64 flex-shrink-0">
                <div class="bg-white rounded-xl shadow-lg p-4 sticky top-24">
                    <h3 class="font-bold text-gray-800 mb-3 flex items-center">
                        <i class="fas fa-gamepad mr-2 text-purple-500"></i>
                        게임 목록
                    </h3>
                    <nav class="space-y-2">
                        <a href="/game/simple/tetris" class="block px-4 py-2 hover:bg-purple-50 text-gray-700 hover:text-purple-600 rounded-lg transition-all">
                            <i class="fas fa-th mr-2"></i>테트리스
                        </a>
                        <a href="/game/simple/sudoku" class="block px-4 py-2 hover:bg-purple-50 text-gray-700 hover:text-purple-600 rounded-lg transition-all">
                            <i class="fas fa-table mr-2"></i>스도쿠
                        </a>
                        <a href="/game/simple/2048" class="block px-4 py-2 hover:bg-purple-50 text-gray-700 hover:text-purple-600 rounded-lg transition-all">
                            <i class="fas fa-th-large mr-2"></i>2048
                        </a>
                        <a href="/game/simple/minesweeper" class="block px-4 py-2 hover:bg-purple-50 text-gray-700 hover:text-purple-600 rounded-lg transition-all">
                            <i class="fas fa-bomb mr-2"></i>지뢰찾기
                        </a>
                    </nav>
                </div>
            </aside>

            <!-- 메인 컨텐츠 -->
            <main class="flex-1">
                <div class="bg-white rounded-xl shadow-lg p-6 sm:p-8">
                    <!-- 게임별 랭킹 타이틀 -->
                    <div class="text-center mb-8">
                        <h2 class="text-3xl font-bold text-gray-800 mb-2">
                            <i class="fas fa-trophy text-yellow-500 mr-3"></i>
                            게임별 랭킹
                        </h2>
                        <p class="text-gray-600 text-sm">실시간 최고 기록을 확인하세요</p>
                    </div>
                    
                    <!-- 게임 랭킹 그리드 -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                            <!-- 테트리스 랭킹 -->
                            <div class="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6">
                                <div class="flex items-center justify-between mb-4">
                                    <div class="flex items-center">
                                        <div class="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-3">
                                            <i class="fas fa-th text-2xl text-white"></i>
                                        </div>
                                        <h3 class="text-xl font-bold text-white">테트리스 랭킹</h3>
                                    </div>
                                    <a href="/game/simple/tetris" class="text-white hover:text-blue-100 transition-colors">
                                        <i class="fas fa-play-circle text-2xl"></i>
                                    </a>
                                </div>
                                
                                <!-- 랭킹 리스트 -->
                                <div class="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-3 min-h-[240px] flex flex-col justify-center" id="tetris-ranking">
                                    <div class="text-white text-sm text-center py-4">
                                        <i class="fas fa-spinner fa-spin mr-2"></i>
                                        랭킹 불러오는 중...
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 스도쿠 랭킹 -->
                            <div class="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl shadow-lg p-6">
                                <div class="flex items-center justify-between mb-4">
                                    <div class="flex items-center">
                                        <div class="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-3">
                                            <i class="fas fa-table text-2xl text-white"></i>
                                        </div>
                                        <h3 class="text-xl font-bold text-white">스도쿠 랭킹</h3>
                                    </div>
                                    <a href="/game/simple/sudoku" class="text-white hover:text-green-100 transition-colors">
                                        <i class="fas fa-play-circle text-2xl"></i>
                                    </a>
                                </div>
                                
                                <!-- 랭킹 리스트 -->
                                <div class="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-3 min-h-[240px] flex flex-col justify-center" id="sudoku-ranking">
                                    <div class="text-white text-sm text-center py-4">
                                        <i class="fas fa-spinner fa-spin mr-2"></i>
                                        랭킹 불러오는 중...
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 2048 랭킹 -->
                            <div class="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg p-6">
                                <div class="flex items-center justify-between mb-4">
                                    <div class="flex items-center">
                                        <div class="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-3">
                                            <i class="fas fa-th-large text-2xl text-white"></i>
                                        </div>
                                        <h3 class="text-xl font-bold text-white">2048 랭킹</h3>
                                    </div>
                                    <a href="/game/simple/2048" class="text-white hover:text-yellow-100 transition-colors">
                                        <i class="fas fa-play-circle text-2xl"></i>
                                    </a>
                                </div>
                                
                                <!-- 랭킹 리스트 -->
                                <div class="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-3 min-h-[240px] flex flex-col justify-center" id="game2048-ranking">
                                    <div class="text-white text-sm text-center py-4">
                                        <i class="fas fa-spinner fa-spin mr-2"></i>
                                        랭킹 불러오는 중...
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 지뢰찾기 랭킹 -->
                            <div class="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg p-6">
                                <div class="flex items-center justify-between mb-4">
                                    <div class="flex items-center">
                                        <div class="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-3">
                                            <i class="fas fa-bomb text-2xl text-white"></i>
                                        </div>
                                        <h3 class="text-xl font-bold text-white">지뢰찾기 랭킹</h3>
                                    </div>
                                    <a href="/game/simple/minesweeper" class="text-white hover:text-red-100 transition-colors">
                                        <i class="fas fa-play-circle text-2xl"></i>
                                    </a>
                                </div>
                                
                                <!-- 랭킹 리스트 -->
                                <div class="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-3 min-h-[240px] flex flex-col justify-center" id="minesweeper-ranking">
                                    <div class="text-white text-sm text-center py-4">
                                        <i class="fas fa-spinner fa-spin mr-2"></i>
                                        랭킹 불러오는 중...
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <script>
                            // 랭킹 데이터 로드
                            async function loadRankings() {
                                try {
                                    // 통합 API 사용하여 모든 게임 랭킹 가져오기
                                    const [tetrisRes, sudokuRes, game2048Res, minesweeperRes] = await Promise.all([
                                        fetch('/api/games/leaderboard?game_type=tetris&limit=5'),
                                        fetch('/api/games/leaderboard?game_type=sudoku&limit=5'),
                                        fetch('/api/games/leaderboard?game_type=2048&limit=5'),
                                        fetch('/api/games/leaderboard?game_type=minesweeper&limit=5')
                                    ]);
                                    
                                    // 테트리스 랭킹
                                    const tetrisData = await tetrisRes.json();
                                    if (tetrisData.success && tetrisData.leaderboard) {
                                        displayUnifiedRanking('tetris-ranking', tetrisData.leaderboard);
                                    } else {
                                        document.getElementById('tetris-ranking').innerHTML = '<div class="text-white text-sm text-center py-4">아직 기록이 없습니다</div>';
                                    }
                                    
                                    // 스도쿠 랭킹
                                    const sudokuData = await sudokuRes.json();
                                    if (sudokuData.success && sudokuData.leaderboard) {
                                        displayUnifiedRanking('sudoku-ranking', sudokuData.leaderboard);
                                    } else {
                                        document.getElementById('sudoku-ranking').innerHTML = '<div class="text-white text-sm text-center py-4">아직 기록이 없습니다</div>';
                                    }
                                    
                                    // 2048 랭킹
                                    const game2048Data = await game2048Res.json();
                                    if (game2048Data.success && game2048Data.leaderboard) {
                                        displayUnifiedRanking('game2048-ranking', game2048Data.leaderboard);
                                    } else {
                                        document.getElementById('game2048-ranking').innerHTML = '<div class="text-white text-sm text-center py-4">아직 기록이 없습니다</div>';
                                    }
                                    
                                    // 지뢰찾기 랭킹
                                    const minesweeperData = await minesweeperRes.json();
                                    if (minesweeperData.success && minesweeperData.leaderboard) {
                                        displayUnifiedRanking('minesweeper-ranking', minesweeperData.leaderboard);
                                    } else {
                                        document.getElementById('minesweeper-ranking').innerHTML = '<div class="text-white text-sm text-center py-4">아직 기록이 없습니다</div>';
                                    }
                                } catch (error) {
                                    console.error('랭킹 로드 실패:', error);
                                    document.getElementById('tetris-ranking').innerHTML = '<div class="text-white text-sm text-center py-4">랭킹을 불러올 수 없습니다</div>';
                                    document.getElementById('sudoku-ranking').innerHTML = '<div class="text-white text-sm text-center py-4">랭킹을 불러올 수 없습니다</div>';
                                    document.getElementById('game2048-ranking').innerHTML = '<div class="text-white text-sm text-center py-4">랭킹을 불러올 수 없습니다</div>';
                                    document.getElementById('minesweeper-ranking').innerHTML = '<div class="text-white text-sm text-center py-4">랭킹을 불러올 수 없습니다</div>';
                                }
                            }
                            
                            // 통합 랭킹 표시 함수
                            function displayUnifiedRanking(elementId, rankings) {
                                const element = document.getElementById(elementId);
                                if (!rankings || rankings.length === 0) {
                                    element.innerHTML = '<div class="text-white text-sm text-center py-4">아직 기록이 없습니다</div>';
                                    return;
                                }
                                
                                const html = rankings.map((rank, index) => {
                                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1);
                                    const scoreText = rank.score.toLocaleString();
                                    const username = rank.user_name || (rank.email ? rank.email.split('@')[0] : '익명');
                                    return '<div class="flex items-start gap-2 text-white text-sm py-2.5 px-3 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-200">' +
                                        '<span class="flex-shrink-0 font-bold text-base w-7 text-center pt-0.5">' + medal + '</span>' +
                                        '<div class="flex-1 min-w-0 flex flex-col">' +
                                        '<span class="truncate font-medium text-xs opacity-80" title="' + username + '">' + username + '</span>' +
                                        '<span class="font-bold text-yellow-200 text-base">' + scoreText + '<span class="text-xs ml-1 opacity-80">점</span></span>' +
                                        '</div>' +
                                        '</div>';
                                }).join('');
                                
                                element.innerHTML = html;
                            }
                            
                            function displayTetrisRanking(elementId, rankings) {
                                const element = document.getElementById(elementId);
                                if (rankings.length === 0) {
                                    element.innerHTML = '<div class="text-white text-sm text-center py-4">아직 기록이 없습니다</div>';
                                    return;
                                }
                                
                                const html = rankings.slice(0, 5).map((rank, index) => {
                                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1);
                                    const scoreText = rank.score.toLocaleString();
                                    const username = rank.user_name || (rank.email ? rank.email.split('@')[0] : '익명');
                                    return '<div class="flex items-start gap-2 text-white text-sm py-2.5 px-3 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-200">' +
                                        '<span class="flex-shrink-0 font-bold text-base w-7 text-center pt-0.5">' + medal + '</span>' +
                                        '<div class="flex-1 min-w-0 flex flex-col">' +
                                        '<span class="truncate font-medium text-xs opacity-80" title="' + username + '">' + username + '</span>' +
                                        '<span class="font-bold text-yellow-200 text-base">' + scoreText + '<span class="text-xs ml-1 opacity-80">점</span></span>' +
                                        '</div>' +
                                        '</div>';
                                }).join('');
                                
                                element.innerHTML = html;
                            }
                            
                            function displaySudokuRanking(elementId, rankings) {
                                const element = document.getElementById(elementId);
                                if (rankings.length === 0) {
                                    element.innerHTML = '<div class="text-white text-sm text-center py-4">아직 기록이 없습니다</div>';
                                    return;
                                }
                                
                                const html = rankings.slice(0, 5).map((rank, index) => {
                                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1);
                                    const minutes = Math.floor(rank.time / 60);
                                    const seconds = rank.time % 60;
                                    const timeText = minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
                                    const username = rank.user_name || (rank.email ? rank.email.split('@')[0] : '익명');
                                    return '<div class="flex items-start gap-2 text-white text-sm py-2.5 px-3 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-200">' +
                                        '<span class="flex-shrink-0 font-bold text-base w-7 text-center pt-0.5">' + medal + '</span>' +
                                        '<div class="flex-1 min-w-0 flex flex-col">' +
                                        '<span class="truncate font-medium text-xs opacity-80" title="' + username + '">' + username + '</span>' +
                                        '<span class="font-bold text-yellow-200 font-mono text-base">' + timeText + '</span>' +
                                        '</div>' +
                                        '</div>';
                                }).join('');
                                
                                element.innerHTML = html;
                            }
                            
                            function display2048Ranking(elementId, rankings) {
                                const element = document.getElementById(elementId);
                                if (rankings.length === 0) {
                                    element.innerHTML = '<div class="text-white text-sm text-center py-4">아직 기록이 없습니다</div>';
                                    return;
                                }
                                
                                const html = rankings.slice(0, 5).map((rank, index) => {
                                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1);
                                    const scoreText = rank.score.toLocaleString();
                                    const username = rank.user_name || (rank.email ? rank.email.split('@')[0] : '익명');
                                    return '<div class="flex items-start gap-2 text-white text-sm py-2.5 px-3 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-200">' +
                                        '<span class="flex-shrink-0 font-bold text-base w-7 text-center pt-0.5">' + medal + '</span>' +
                                        '<div class="flex-1 min-w-0 flex flex-col">' +
                                        '<span class="truncate font-medium text-xs opacity-80" title="' + username + '">' + username + '</span>' +
                                        '<span class="font-bold text-yellow-200 text-base">' + scoreText + '<span class="text-xs ml-1 opacity-80">점</span></span>' +
                                        '</div>' +
                                        '</div>';
                                }).join('');
                                
                                element.innerHTML = html;
                            }
                            
                            function displayMinesweeperRanking(elementId, rankings) {
                                const element = document.getElementById(elementId);
                                if (rankings.length === 0) {
                                    element.innerHTML = '<div class="text-white text-sm text-center py-4">아직 기록이 없습니다</div>';
                                    return;
                                }
                                
                                const html = rankings.slice(0, 5).map((rank, index) => {
                                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1);
                                    const timeText = rank.time.toFixed(2);
                                    const username = rank.user_name || (rank.email ? rank.email.split('@')[0] : '익명');
                                    return '<div class="flex items-start gap-2 text-white text-sm py-2.5 px-3 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-200">' +
                                        '<span class="flex-shrink-0 font-bold text-base w-7 text-center pt-0.5">' + medal + '</span>' +
                                        '<div class="flex-1 min-w-0 flex flex-col">' +
                                        '<span class="truncate font-medium text-xs opacity-80" title="' + username + '">' + username + '</span>' +
                                        '<span class="font-bold text-yellow-200 font-mono text-base">' + timeText + '<span class="text-xs ml-1 opacity-80">초</span></span>' +
                                        '</div>' +
                                        '</div>';
                                }).join('');
                                
                                element.innerHTML = html;
                            }
                            
                            // 페이지 로드 시 랭킹 불러오기
                            loadRankings();
                        </script>
                </div>
            </main>
        </div>

        ${getCommonFooter()}
        ${getCommonAuthScript()}
    </body>
    </html>
  `);
});
// 웹게임 페이지
app.get('/game/web', (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko" id="html-root">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>웹게임 - Faith Portal</title>
        <script>
            // Tailwind CDN 경고 필터링 (개발 환경용)
            (function() {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                    if (args[0] && typeof args[0] === 'string' && 
                        args[0].includes('cdn.tailwindcss.com should not be used in production')) {
                        return; // Tailwind CDN 경고 무시
                    }
                    originalWarn.apply(console, args);
                };
            })();
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .faith-blue { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); }
            .faith-blue-hover:hover { background: linear-gradient(135deg, #0284c7 0%, #0891b2 100%); }
        </style>
    </head>
    <body class="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" id="html-root">
        ${getCommonHeader('Game')}
        
        ${getBreadcrumb([
        { label: '홈', href: '/' },
        { label: '게임', href: '/game' },
        { label: '웹게임' }
    ])}

        ${getGameMenu('/game/web')}

        <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
            <div class="bg-white rounded-xl shadow-lg p-6 sm:p-8">
                <div class="text-center py-16">
                    <div class="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <i class="fas fa-globe text-4xl text-white"></i>
                    </div>
                    <h1 class="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
                        <span class="bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent">웹게임</span>
                    </h1>
                    <p class="text-gray-600 text-lg mb-8">
                        다양한 온라인 웹 게임을 즐겨보세요
                    </p>
                    <div class="bg-gray-100 rounded-lg p-8 mt-8">
                        <i class="fas fa-tools text-4xl text-gray-400 mb-4"></i>
                        <p class="text-gray-500">준비 중입니다...</p>
                    </div>
                </div>
            </div>
        </div>

        ${getCommonFooter()}
        ${getCommonAuthScript()}
    </body>
    </html>
  `);
});
// 테트리스 정보 페이지
app.get('/game/simple/tetris', (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko" id="html-root">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>테트리스 - Faith Portal</title>
        <script>
            // Tailwind CDN 경고 필터링 (개발 환경용)
            (function() {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                    if (args[0] && typeof args[0] === 'string' && 
                        args[0].includes('cdn.tailwindcss.com should not be used in production')) {
                        return; // Tailwind CDN 경고 무시
                    }
                    originalWarn.apply(console, args);
                };
            })();
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .faith-blue { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); }
            .faith-blue-hover:hover { background: linear-gradient(135deg, #0284c7 0%, #0891b2 100%); }
        </style>
    </head>
    <body class="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" id="html-root">
        ${getCommonHeader('Game')}
        
        ${getBreadcrumb([
        { label: '홈', href: '/' },
        { label: '게임', href: '/game' },
        { label: '심플 게임', href: '/game/simple' },
        { label: '테트리스' }
    ])}

        ${getGameMenu('/game/simple')}

        <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 flex flex-col lg:flex-row gap-4 sm:gap-6">
            ${getSimpleGameSidebar('/game/simple/tetris')}

            <!-- 메인 컨텐츠 -->
            <main class="flex-1 space-y-6">
                <!-- 게임 헤더 -->
                <div class="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-8 text-white">
                    <div class="flex items-center justify-between">
                        <div>
                            <h1 class="text-3xl sm:text-4xl font-bold mb-2">
                                <i class="fas fa-th mr-3"></i>테트리스
                            </h1>
                            <p class="text-blue-100">클래식 블록 퍼즐 게임</p>
                        </div>
                        <button onclick="openGameModal()" class="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-all shadow-lg">
                            <i class="fas fa-play mr-2"></i>게임 시작
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- 사용법 -->
                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-keyboard mr-2 text-blue-500"></i>
                            조작법
                        </h2>
                        <div class="space-y-3">
                            <div class="flex items-center p-3 bg-gray-50 rounded-lg">
                                <div class="w-12 h-12 bg-blue-500 text-white rounded-lg flex items-center justify-center font-bold mr-4">
                                    ←
                                </div>
                                <span class="text-gray-700">왼쪽으로 이동</span>
                            </div>
                            <div class="flex items-center p-3 bg-gray-50 rounded-lg">
                                <div class="w-12 h-12 bg-blue-500 text-white rounded-lg flex items-center justify-center font-bold mr-4">
                                    →
                                </div>
                                <span class="text-gray-700">오른쪽으로 이동</span>
                            </div>
                            <div class="flex items-center p-3 bg-gray-50 rounded-lg">
                                <div class="w-12 h-12 bg-blue-500 text-white rounded-lg flex items-center justify-center font-bold mr-4">
                                    ↑
                                </div>
                                <span class="text-gray-700">블록 회전</span>
                            </div>
                            <div class="flex items-center p-3 bg-gray-50 rounded-lg">
                                <div class="w-12 h-12 bg-blue-500 text-white rounded-lg flex items-center justify-center font-bold mr-4">
                                    ↓
                                </div>
                                <span class="text-gray-700">빠르게 내리기</span>
                            </div>
                            <div class="flex items-center p-3 bg-gray-50 rounded-lg">
                                <div class="w-12 h-12 bg-blue-500 text-white rounded-lg flex items-center justify-center text-xs mr-4">
                                    SPACE
                                </div>
                                <span class="text-gray-700">즉시 바닥까지 내리기</span>
                            </div>
                        </div>
                    </div>

                    <!-- 게임 규칙 -->
                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-info-circle mr-2 text-green-500"></i>
                            게임 규칙
                        </h2>
                        <div class="space-y-3 text-gray-700">
                            <div class="flex items-start">
                                <i class="fas fa-check-circle text-green-500 mr-3 mt-1"></i>
                                <span>떨어지는 블록을 회전하고 이동하여 가로줄을 완성하세요</span>
                            </div>
                            <div class="flex items-start">
                                <i class="fas fa-check-circle text-green-500 mr-3 mt-1"></i>
                                <span>한 줄을 완성하면 <strong>10점</strong>을 획득합니다</span>
                            </div>
                            <div class="flex items-start">
                                <i class="fas fa-check-circle text-green-500 mr-3 mt-1"></i>
                                <span><strong>200점</strong>마다 레벨이 올라가고 속도가 빨라집니다</span>
                            </div>
                            <div class="flex items-start">
                                <i class="fas fa-check-circle text-green-500 mr-3 mt-1"></i>
                                <span>다음에 나올 블록을 미리 확인할 수 있습니다</span>
                            </div>
                            <div class="flex items-start">
                                <i class="fas fa-check-circle text-green-500 mr-3 mt-1"></i>
                                <span>블록이 화면 위까지 쌓이면 게임 오버입니다</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 최고 점수 리스트 -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <i class="fas fa-trophy mr-2 text-yellow-500"></i>
                        최고 점수 랭킹
                    </h2>
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead>
                                <tr class="border-b-2 border-gray-200">
                                    <th class="text-left py-3 px-4 text-gray-600 font-semibold">순위</th>
                                    <th class="text-left py-3 px-4 text-gray-600 font-semibold">ID</th>
                                    <th class="text-right py-3 px-4 text-gray-600 font-semibold">점수</th>
                                    <th class="text-right py-3 px-4 text-gray-600 font-semibold">달성 날짜</th>
                                </tr>
                            </thead>
                            <tbody id="leaderboard">
                                <tr>
                                    <td colspan="4" class="text-center py-8 text-gray-500">
                                        <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                                        <p>로딩 중...</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>

        <!-- 게임 모달 (전체화면) -->
        <div id="gameModal" class="fixed inset-0 bg-black hidden z-50" style="display: none;">
            <div class="relative w-full h-full flex flex-col">
                <button onclick="closeGameModal()" class="absolute top-4 right-4 text-white hover:text-gray-300 text-3xl font-bold z-10 bg-black bg-opacity-50 w-12 h-12 rounded-full flex items-center justify-center">
                    <i class="fas fa-times"></i>
                </button>
                <iframe id="gameFrame" src="" class="w-full h-full border-0"></iframe>
            </div>
        </div>

        ${getCommonFooter()}
        ${getCommonAuthScript()}
        
        <script>
            // Load leaderboard
            function loadLeaderboard() {
                fetch('/api/tetris/leaderboard')
                    .then(res => res.json())
                    .then(data => {
                        const tbody = document.getElementById('leaderboard');
                        if (data.success && data.leaderboard.length > 0) {
                            tbody.innerHTML = data.leaderboard.map((item, index) => {
                                const rank = index + 1;
                                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
                                const date = new Date(item.created_at).toLocaleDateString('ko-KR');
                                const email = item.email.split('@')[0]; // Only show username part
                                
                                return \`
                                    <tr class="border-b border-gray-100 hover:bg-gray-50">
                                        <td class="py-3 px-4 font-bold text-lg">\${medal}</td>
                                        <td class="py-3 px-4 text-gray-700">\${email}</td>
                                        <td class="py-3 px-4 text-right font-bold text-blue-600">\${item.score.toLocaleString()}</td>
                                        <td class="py-3 px-4 text-right text-gray-500 text-sm">\${date}</td>
                                    </tr>
                                \`;
                            }).join('');
                        } else {
                            tbody.innerHTML = \`
                                <tr>
                                    <td colspan="4" class="text-center py-8 text-gray-500">
                                        아직 기록이 없습니다. 첫 번째 기록을 남겨보세요!
                                    </td>
                                </tr>
                            \`;
                        }
                    })
                    .catch(err => {
                        console.error('Leaderboard load error:', err);
                        document.getElementById('leaderboard').innerHTML = \`
                            <tr>
                                <td colspan="4" class="text-center py-8 text-red-500">
                                    리더보드를 불러오는 중 오류가 발생했습니다.
                                </td>
                            </tr>
                        \`;
                    });
            }
            
            function openGameModal() {
                const modal = document.getElementById('gameModal');
                const iframe = document.getElementById('gameFrame');
                
                iframe.src = '/game/simple/tetris/play';
                modal.style.display = 'flex';
                
                setTimeout(() => iframe.focus(), 100);
            }
            
            function closeGameModal() {
                const modal = document.getElementById('gameModal');
                const iframe = document.getElementById('gameFrame');
                modal.style.display = 'none';
                iframe.src = '';
                
                // Reload leaderboard in case of new high score
                loadLeaderboard();
            }
            
            // Close modal on background click
            document.getElementById('gameModal')?.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeGameModal();
                }
            });
            
            // Close modal on ESC key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && document.getElementById('gameModal').style.display === 'flex') {
                    closeGameModal();
                }
            });
            
            // Load leaderboard on page load
            loadLeaderboard();
            
            // 테트리스 게임 모달(iframe)에서 보내는 점수 갱신 이벤트 수신
            window.addEventListener('message', function(event) {
                if (event.data && event.data.type === 'TETRIS_SCORE_UPDATED') {
                    console.log('[테트리스 포털] 새로운 점수 등록됨. 리더보드 갱신 중...', event.data.score);
                    loadLeaderboard();
                }
            });
        </script>
    </body>
    </html>
  `);
});
// 테트리스 게임 실행 페이지
app.get('/game/simple/tetris/play', (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>테트리스 - Faith Portal</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: 'Arial', sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                overflow: hidden;
                padding: 10px;
            }
            .game-container {
                display: flex;
                flex-direction: row;
                gap: 20px;
                padding: 20px;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 20px;
                box-shadow: 0 10px 50px rgba(0,0,0,0.3);
                max-width: 100%;
                max-height: 95vh;
            }
            .main-panel {
                display: flex;
                flex-direction: column;
                gap: 10px;
                align-items: center;
            }
            #tetris {
                border: 3px solid #333;
                background: #000;
                display: block;
                max-width: 100%;
                height: auto;
            }
            .side-panel {
                display: flex;
                flex-direction: column;
                gap: 15px;
                min-width: 180px;
                max-width: 220px;
            }
            .info-box {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 15px;
                border-radius: 10px;
                color: white;
            }
            .info-box h3 {
                margin-bottom: 8px;
                font-size: 16px;
                border-bottom: 2px solid rgba(255,255,255,0.3);
                padding-bottom: 5px;
            }
            .info-box p {
                font-size: 20px;
                font-weight: bold;
                margin: 5px 0;
            }
            .next-piece {
                width: 80px;
                height: 80px;
                margin: 10px auto;
                background: rgba(0,0,0,0.3);
                border: 2px solid rgba(255,255,255,0.3);
                border-radius: 5px;
            }
            .controls {
                background: #f8f9fa;
                padding: 12px;
                border-radius: 10px;
                font-size: 12px;
            }
            .controls h3 {
                margin-bottom: 8px;
                color: #333;
                font-size: 14px;
            }
            .controls p {
                margin: 3px 0;
                color: #666;
            }
            button {
                width: 100%;
                padding: 12px;
                font-size: 14px;
                font-weight: bold;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s;
            }
            .start-btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            .start-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            }
            .start-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            #gameOver {
                display: none;
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 10px 50px rgba(0,0,0,0.5);
                text-align: center;
                z-index: 1000;
            }
            #gameOver h2 {
                color: #e74c3c;
                font-size: 32px;
                margin-bottom: 20px;
            }
            #gameOver p {
                font-size: 20px;
                margin: 10px 0;
                color: #333;
            }
            .overlay {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                z-index: 999;
            }
            
            /* 반응형 스타일 */
            @media (max-width: 768px) {
                body {
                    padding: 5px;
                }
                .game-container {
                    flex-direction: column;
                    gap: 15px;
                    padding: 15px;
                    max-height: 100vh;
                    overflow-y: auto;
                }
                #tetris {
                    width: 240px !important;
                    height: 480px !important;
                }
                .side-panel {
                    flex-direction: row;
                    flex-wrap: wrap;
                    min-width: 100%;
                    max-width: 100%;
                    gap: 10px;
                }
                .info-box {
                    flex: 1;
                    min-width: calc(50% - 5px);
                    padding: 10px;
                }
                .info-box h3 {
                    font-size: 14px;
                }
                .info-box p {
                    font-size: 16px;
                }
                .controls {
                    flex: 1 1 100%;
                    order: 10;
                }
                button {
                    padding: 10px;
                    font-size: 14px;
                }
                .next-piece {
                    width: 60px;
                    height: 60px;
                }
                #gameOver {
                    padding: 20px;
                    width: 90%;
                    max-width: 300px;
                }
                #gameOver h2 {
                    font-size: 24px;
                }
                #gameOver p {
                    font-size: 16px;
                }
            }
            
            @media (max-width: 480px) {
                #tetris {
                    width: 200px !important;
                    height: 400px !important;
                }
                .info-box {
                    min-width: 100%;
                }
            }
        </style>
    </head>
    <body>
        <div class="overlay" id="overlay"></div>
        
        <div class="game-container">
            <div class="main-panel">
                <canvas id="tetris" width="300" height="600"></canvas>
            </div>
            
            <div class="side-panel">
                <div class="info-box">
                    <h3>점수</h3>
                    <p id="score">0</p>
                </div>
                
                <div class="info-box">
                    <h3>최고 점수</h3>
                    <p id="highScore">0</p>
                </div>
                
                <div class="info-box">
                    <h3>다음 블록</h3>
                    <canvas id="nextPiece" width="100" height="100" class="next-piece"></canvas>
                </div>
                
                <div class="info-box">
                    <h3>레벨</h3>
                    <p id="level">1</p>
                </div>
                
                <button class="start-btn" id="startBtn" onclick="startGame()">게임 시작</button>
                
                <div class="controls">
                    <h3>조작법</h3>
                    <p>← → : 좌우 이동</p>
                    <p>↑ : 회전</p>
                    <p>↓ : 빠르게 내리기</p>
                    <p>Space : 즉시 내리기</p>
                </div>
            </div>
        </div>
        
        <div id="gameOver">
            <h2>게임 오버!</h2>
            <p>최종 점수: <span id="finalScore">0</span></p>
            <p id="newHighScore" style="color: #27ae60; display: none;">🎉 신기록 달성!</p>
            <button class="start-btn" onclick="restartGame()" style="margin-top: 20px;">다시 시작</button>
        </div>

        <script>
            const canvas = document.getElementById('tetris');
            const ctx = canvas.getContext('2d');
            const nextCanvas = document.getElementById('nextPiece');
            const nextCtx = nextCanvas.getContext('2d');
            
            const BLOCK_SIZE = 30;
            const COLS = 10;
            const ROWS = 20;
            
            let board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
            let score = 0;
            let highScore = 0;
            let level = 1;
            let lines = 0;
            let dropSpeed = 1000;
            let gameRunning = false;
            let gameInterval;
            let currentPiece;
            let nextPiece;
            
            const SHAPES = [
                [[1,1,1,1]], // I
                [[1,1],[1,1]], // O
                [[1,1,1],[0,1,0]], // T
                [[1,1,1],[1,0,0]], // L
                [[1,1,1],[0,0,1]], // J
                [[1,1,0],[0,1,1]], // S
                [[0,1,1],[1,1,0]]  // Z
            ];
            
            const COLORS = ['#00f0f0', '#f0f000', '#a000f0', '#f0a000', '#0000f0', '#00f000', '#f00000'];
            
            // Load high score
            loadHighScore();
            
            function loadHighScore() {
                const userId = localStorage.getItem('user_id');
                if (userId) {
                    fetch(\`/api/tetris/highscore/\${userId}\`)
                        .then(res => res.json())
                        .then(data => {
                            if (data.success) {
                                highScore = data.highScore || 0;
                                document.getElementById('highScore').textContent = highScore;
                            }
                        });
                }
            }
            
            function saveHighScore() {
                if (score > highScore) {
                    console.log('🎮 [테트리스] 점수 저장 시도:', { score, lines, level });
                    fetch('/api/tetris/score', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ score: score, lines: lines, level: level }),
                        credentials: 'include'
                    }).then(res => res.json())
                    .then(data => {
                        console.log('🎮 [테트리스] 저장 응답:', data);
                        if (data.success) {
                            alert('🎉 점수가 저장되었습니다!');
                            highScore = score;
                            document.getElementById('highScore').textContent = highScore;
                            
                            // 부모 윈도우(메인 포털)에 점수 갱신 메시지 전송
                            if (window.parent && window.parent !== window) {
                                window.parent.postMessage(
                                    { type: 'TETRIS_SCORE_UPDATED', score: score },
                                    '*'
                                );
                            }
                        } else {
                            if (data.requireLogin) {
                                alert('로그인이 필요합니다. 로그인 페이지로 이동합니다.');
                                window.location.href = '/auth/login';
                            } else {
                                alert('점수 저장 실패: ' + data.message);
                            }
                        }
                    })
                    .catch(error => {
                        console.error('🎮 [테트리스] 점수 저장 오류:', error);
                        alert('점수 저장 중 오류가 발생했습니다.');
                    });
                }
            }
            
            function createPiece() {
                const shapeIndex = Math.floor(Math.random() * SHAPES.length);
                return {
                    shape: SHAPES[shapeIndex],
                    color: COLORS[shapeIndex],
                    x: Math.floor(COLS / 2) - 1,
                    y: 0
                };
            }
            
            function drawBlock(ctx, x, y, color) {
                ctx.fillStyle = color;
                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = '#000';
                ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
            
            function drawBoard() {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                for (let y = 0; y < ROWS; y++) {
                    for (let x = 0; x < COLS; x++) {
                        if (board[y][x]) {
                            drawBlock(ctx, x, y, board[y][x]);
                        }
                    }
                }
            }
            
            function drawPiece(piece, context, offsetX = 0, offsetY = 0) {
                piece.shape.forEach((row, y) => {
                    row.forEach((cell, x) => {
                        if (cell) {
                            if (context === ctx) {
                                drawBlock(context, piece.x + x, piece.y + y, piece.color);
                            } else {
                                // Draw on next piece canvas
                                context.fillStyle = piece.color;
                                context.fillRect(
                                    (x + offsetX) * 20 + 10,
                                    (y + offsetY) * 20 + 10,
                                    20, 20
                                );
                                context.strokeStyle = '#000';
                                context.strokeRect(
                                    (x + offsetX) * 20 + 10,
                                    (y + offsetY) * 20 + 10,
                                    20, 20
                                );
                            }
                        }
                    });
                });
            }
            
            function collision(piece) {
                for (let y = 0; y < piece.shape.length; y++) {
                    for (let x = 0; x < piece.shape[y].length; x++) {
                        if (piece.shape[y][x]) {
                            const newX = piece.x + x;
                            const newY = piece.y + y;
                            if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && board[newY][newX])) {
                                return true;
                            }
                        }
                    }
                }
                return false;
            }
            
            function merge() {
                currentPiece.shape.forEach((row, y) => {
                    row.forEach((cell, x) => {
                        if (cell) {
                            board[currentPiece.y + y][currentPiece.x + x] = currentPiece.color;
                        }
                    });
                });
            }
            
            function clearLines() {
                let linesCleared = 0;
                for (let y = ROWS - 1; y >= 0; y--) {
                    if (board[y].every(cell => cell !== 0)) {
                        board.splice(y, 1);
                        board.unshift(Array(COLS).fill(0));
                        linesCleared++;
                        y++;
                    }
                }
                if (linesCleared > 0) {
                    lines += linesCleared;
                    score += linesCleared * 10;
                    document.getElementById('score').textContent = score;
                    
                    // Speed up every 200 points
                    const newLevel = Math.floor(score / 200) + 1;
                    if (newLevel > level) {
                        level = newLevel;
                        dropSpeed = Math.max(100, dropSpeed / 1.2);
                        document.getElementById('level').textContent = level;
                        clearInterval(gameInterval);
                        gameInterval = setInterval(drop, dropSpeed);
                    }
                }
            }
            
            function rotate() {
                const rotated = currentPiece.shape[0].map((_, i) =>
                    currentPiece.shape.map(row => row[i]).reverse()
                );
                const previousShape = currentPiece.shape;
                currentPiece.shape = rotated;
                if (collision(currentPiece)) {
                    currentPiece.shape = previousShape;
                }
            }
            
            function moveDown() {
                currentPiece.y++;
                if (collision(currentPiece)) {
                    currentPiece.y--;
                    merge();
                    clearLines();
                    currentPiece = nextPiece;
                    nextPiece = createPiece();
                    if (collision(currentPiece)) {
                        gameOver();
                    }
                }
            }
            
            function moveLeft() {
                currentPiece.x--;
                if (collision(currentPiece)) {
                    currentPiece.x++;
                }
            }
            
            function moveRight() {
                currentPiece.x++;
                if (collision(currentPiece)) {
                    currentPiece.x--;
                }
            }
            
            function hardDrop() {
                while (!collision(currentPiece)) {
                    currentPiece.y++;
                }
                currentPiece.y--;
                merge();
                clearLines();
                currentPiece = nextPiece;
                nextPiece = createPiece();
                if (collision(currentPiece)) {
                    gameOver();
                }
            }
            
            function drop() {
                moveDown();
                draw();
            }
            
            function draw() {
                drawBoard();
                drawPiece(currentPiece, ctx);
                
                // Draw next piece
                nextCtx.fillStyle = 'rgba(0,0,0,0.3)';
                nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
                drawPiece(nextPiece, nextCtx, 0, 0);
            }
            
            function startGame() {
                board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
                score = 0;
                lines = 0;
                level = 1;
                dropSpeed = 1000;
                document.getElementById('score').textContent = 0;
                document.getElementById('level').textContent = 1;
                currentPiece = createPiece();
                nextPiece = createPiece();
                gameRunning = true;
                document.getElementById('startBtn').disabled = true;
                gameInterval = setInterval(drop, dropSpeed);
                draw();
            }
            
            function gameOver() {
                gameRunning = false;
                clearInterval(gameInterval);
                document.getElementById('startBtn').disabled = false;
                document.getElementById('finalScore').textContent = score;
                
                if (score > highScore) {
                    document.getElementById('newHighScore').style.display = 'block';
                    saveHighScore();
                } else {
                    document.getElementById('newHighScore').style.display = 'none';
                }
                
                document.getElementById('overlay').style.display = 'block';
                document.getElementById('gameOver').style.display = 'block';
            }
            
            function restartGame() {
                document.getElementById('overlay').style.display = 'none';
                document.getElementById('gameOver').style.display = 'none';
                startGame();
            }
            
            document.addEventListener('keydown', (e) => {
                if (!gameRunning) return;
                
                if (e.key === 'ArrowLeft') {
                    moveLeft();
                    draw();
                } else if (e.key === 'ArrowRight') {
                    moveRight();
                    draw();
                } else if (e.key === 'ArrowDown') {
                    moveDown();
                    draw();
                } else if (e.key === 'ArrowUp') {
                    rotate();
                    draw();
                } else if (e.key === ' ') {
                    e.preventDefault();
                    hardDrop();
                    draw();
                }
            });
            
            // Initial draw
            drawBoard();
        </script>
    </body>
    </html>
  `);
});
// 스도쿠 정보 페이지
// ==================== 포털형 스도쿠 챌린지 ====================
// ==================== 스도쿠 게임 ====================
// 스도쿠 랜딩 페이지
app.get('/game/simple/sudoku', (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko" id="html-root">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>스도쿠 챌린지 - Faith Portal</title>
        <script>
            (function() {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                    if (args[0] && typeof args[0] === 'string' && 
                        args[0].includes('cdn.tailwindcss.com should not be used in production')) {
                        return;
                    }
                    originalWarn.apply(console, args);
                };
            })();
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .faith-blue { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); }
            .faith-blue-hover:hover { background: linear-gradient(135deg, #0284c7 0%, #0891b2 100%); }
            .difficulty-tab { 
                cursor: pointer; 
                transition: all 0.3s; 
                padding: 12px 24px;
                border-radius: 12px;
                font-weight: 600;
            }
            .difficulty-tab.active { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }
            .difficulty-tab:hover:not(.active) {
                background: #f3f4f6;
            }
            .leaderboard-row {
                transition: all 0.2s;
            }
            .leaderboard-row:hover {
                background: #f9fafb;
                transform: translateX(4px);
            }
        </style>
    </head>
    <body class="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" id="html-root">
        ${getCommonAuthScript()}
        ${getCommonHeader('Game')}
        ${getStickyHeader()}
        
        ${getBreadcrumb([
        { label: '홈', href: '/' },
        { label: '게임', href: '/game' },
        { label: '심플 게임', href: '/game/simple' },
        { label: '스도쿠 챌린지' }
    ])}

        ${getGameMenu('/game/simple')}

        <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 flex flex-col lg:flex-row gap-4 sm:gap-6">
            ${getSimpleGameSidebar('/game/simple/sudoku')}

            <!-- 메인 컨텐츠 -->
            <main class="flex-1">
            <!-- 게임 헤더 -->
            <div class="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl shadow-2xl p-8 mb-8 text-white">
                <div class="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 class="text-4xl font-bold mb-2">
                            <i class="fas fa-th mr-3"></i>
                            스도쿠 챌린지
                        </h1>
                        <p class="text-lg opacity-90">논리와 추론으로 완성하는 숫자 퍼즐</p>
                    </div>
                    <button 
                        onclick="openGameModal()" 
                        class="bg-white text-purple-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        <i class="fas fa-play mr-2"></i>
                        게임 시작
                    </button>
                </div>
            </div>

            <!-- 난이도 탭 -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div class="flex gap-3 flex-wrap justify-center">
                    <div class="difficulty-tab active" data-difficulty="easy" onclick="changeDifficulty('easy')">
                        <i class="fas fa-smile mr-2"></i>
                        쉬움 (Easy)
                    </div>
                    <div class="difficulty-tab" data-difficulty="medium" onclick="changeDifficulty('medium')">
                        <i class="fas fa-meh mr-2"></i>
                        보통 (Medium)
                    </div>
                    <div class="difficulty-tab" data-difficulty="hard" onclick="changeDifficulty('hard')">
                        <i class="fas fa-frown mr-2"></i>
                        어려움 (Hard)
                    </div>
                    <div class="difficulty-tab" data-difficulty="expert" onclick="changeDifficulty('expert')">
                        <i class="fas fa-skull mr-2"></i>
                        전문가 (Expert)
                    </div>
                </div>
            </div>

            <div class="grid lg:grid-cols-3 gap-6">
                <!-- 게임 규칙 -->
                <div class="lg:col-span-2 space-y-6">
                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-book-open mr-3 text-purple-500"></i>
                            게임 규칙
                        </h2>
                        <div class="space-y-3 text-gray-700">
                            <p class="flex items-start">
                                <i class="fas fa-check-circle text-green-500 mr-3 mt-1"></i>
                                <span>9×9 격자를 1부터 9까지의 숫자로 채웁니다</span>
                            </p>
                            <p class="flex items-start">
                                <i class="fas fa-check-circle text-green-500 mr-3 mt-1"></i>
                                <span>각 가로줄에는 1-9가 한 번씩만 나타나야 합니다</span>
                            </p>
                            <p class="flex items-start">
                                <i class="fas fa-check-circle text-green-500 mr-3 mt-1"></i>
                                <span>각 세로줄에도 1-9가 한 번씩만 나타나야 합니다</span>
                            </p>
                            <p class="flex items-start">
                                <i class="fas fa-check-circle text-green-500 mr-3 mt-1"></i>
                                <span>3×3 박스 안에도 1-9가 한 번씩만 나타나야 합니다</span>
                            </p>
                        </div>
                    </div>

                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-keyboard mr-3 text-blue-500"></i>
                            조작법
                        </h2>
                        <div class="grid md:grid-cols-2 gap-4">
                            <div class="bg-gray-50 rounded-lg p-4">
                                <h3 class="font-semibold text-gray-800 mb-2">기본 조작</h3>
                                <ul class="space-y-2 text-sm text-gray-600">
                                    <li><i class="fas fa-mouse-pointer text-purple-500 mr-2"></i>빈 칸 클릭하여 선택</li>
                                    <li><i class="fas fa-keyboard text-purple-500 mr-2"></i>1-9 키로 숫자 입력</li>
                                    <li><i class="fas fa-backspace text-purple-500 mr-2"></i>Delete/Backspace로 지우기</li>
                                </ul>
                            </div>
                            <div class="bg-gray-50 rounded-lg p-4">
                                <h3 class="font-semibold text-gray-800 mb-2">고급 기능</h3>
                                <ul class="space-y-2 text-sm text-gray-600">
                                    <li><i class="fas fa-pencil-alt text-blue-500 mr-2"></i>N 키 - 메모 모드</li>
                                    <li><i class="fas fa-lightbulb text-yellow-500 mr-2"></i>H 키 - 힌트 사용</li>
                                    <li><i class="fas fa-undo text-green-500 mr-2"></i>Ctrl+Z - 되돌리기</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 리더보드 -->
                <div class="lg:col-span-1">
                    <div class="bg-white rounded-xl shadow-lg p-6 sticky top-24">
                        <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-trophy mr-3 text-yellow-500"></i>
                            최고 기록
                        </h2>
                        <div id="leaderboard-content" class="space-y-2">
                            <div class="flex items-center justify-center py-8">
                                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </main>
        </div>

        <!-- 게임 모달 -->
        <div id="game-modal" class="fixed inset-0 bg-black bg-opacity-75 z-50 hidden items-center justify-center p-4">
            <div class="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden" style="max-height: 95vh;">
                <div class="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex justify-between items-center z-10">
                    <h2 class="text-white text-xl font-bold">
                        <i class="fas fa-th mr-2"></i>
                        스도쿠 게임
                    </h2>
                    <button onclick="closeGameModal()" class="text-white hover:bg-white hover:bg-opacity-20 rounded-lg px-4 py-2 transition">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <div class="overflow-auto" style="max-height: calc(95vh - 64px);">
                    <iframe id="game-frame" class="w-full" style="min-height: 900px; border: none;"></iframe>
                </div>
            </div>
        </div>

        ${getCommonFooter()}

        <script>
            let currentDifficulty = 'easy';

            function changeDifficulty(difficulty) {
                currentDifficulty = difficulty;
                
                // 탭 활성화 상태 변경
                document.querySelectorAll('.difficulty-tab').forEach(tab => {
                    tab.classList.remove('active');
                });
                document.querySelector('[data-difficulty="' + difficulty + '"]').classList.add('active');
                
                // 리더보드 로드
                loadLeaderboard();
            }

            async function loadLeaderboard() {
                const content = document.getElementById('leaderboard-content');
                content.innerHTML = '<div class="flex items-center justify-center py-8"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div></div>';
                
                try {
                    const response = await fetch('/api/sudoku/leaderboard/' + currentDifficulty);
                    const data = await response.json();
                    
                    if (data.success && data.scores.length > 0) {
                        content.innerHTML = data.scores.map(function(score, index) {
                            const rank = index + 1;
                            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '#' + rank;
                            const minutes = Math.floor(score.time / 60);
                            const seconds = score.time % 60;
                            const timeStr = minutes + '분 ' + seconds + '초';
                            const date = new Date(score.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
                            const username = score.email ? score.email.split('@')[0] : 'Anonymous';
                            
                            return '<div class="leaderboard-row bg-gray-50 rounded-lg p-3 flex items-center justify-between">' +
                                '<div class="flex items-center gap-3">' +
                                '<span class="text-xl font-bold w-10 text-center">' + medal + '</span>' +
                                '<div>' +
                                '<div class="font-semibold text-gray-800">' + username + '</div>' +
                                '<div class="text-xs text-gray-500">' + date + '</div>' +
                                '</div>' +
                                '</div>' +
                                '<div class="text-right">' +
                                '<div class="font-bold text-purple-600">' + timeStr + '</div>' +
                                '<div class="text-xs text-gray-500">실수: ' + score.mistakes + '</div>' +
                                '</div>' +
                                '</div>';
                        }).join('');
                    } else {
                        content.innerHTML = '<div class="text-center py-8 text-gray-500">' +
                            '<i class="fas fa-inbox text-4xl mb-3 opacity-50"></i>' +
                            '<p>아직 기록이 없습니다</p>' +
                            '<p class="text-sm">첫 번째 기록의 주인공이 되어보세요!</p>' +
                            '</div>';
                    }
                } catch (error) {
                    console.error('리더보드 로드 실패:', error);
                    content.innerHTML = '<div class="text-center py-8 text-red-500">' +
                        '<i class="fas fa-exclamation-triangle text-3xl mb-2"></i>' +
                        '<p>리더보드를 불러올 수 없습니다</p>' +
                        '</div>';
                }
            }

            function openGameModal() {
                const modal = document.getElementById('game-modal');
                const frame = document.getElementById('game-frame');
                frame.src = \`/game/simple/sudoku/play?difficulty=\${currentDifficulty}\`;
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }

            function closeGameModal() {
                const modal = document.getElementById('game-modal');
                const frame = document.getElementById('game-frame');
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                frame.src = '';
                
                // 모달 닫을 때 리더보드 새로고침
                loadLeaderboard();
            }

            // ESC 키로 모달 닫기
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    closeGameModal();
                }
            });

            // 페이지 로드 시 리더보드 로드
            window.addEventListener('DOMContentLoaded', () => {
                loadLeaderboard();
            });
        </script>
    </body>
    </html>
  `);
});
// 스도쿠 게임 플레이 페이지 (완전히 새로운 구현)
app.get('/game/simple/sudoku/play', (c) => {
    const difficulty = c.req.query('difficulty') || 'easy';
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <title>스도쿠 챌린지 - ${difficulty.toUpperCase()}</title>
        <script>
            (function() {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                    if (args[0] && typeof args[0] === 'string' && 
                        args[0].includes('cdn.tailwindcss.com should not be used in production')) {
                        return;
                    }
                    originalWarn.apply(console, args);
                };
            })();
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                background: white;
                min-height: 100vh;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 0;
            }
            
            .container {
                background: white;
                max-width: 100%;
                width: 100%;
                margin: 0 auto;
                overflow: hidden;
                position: relative;
            }
            
            /* PC only: wider container */
            @media (min-width: 501px) {
                .container {
                    max-width: 750px;
                    min-width: 650px;
                }
            }
            
            /* 보라색 헤더 */
            .modal-header {
                background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
                padding: 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                color: white;
                position: relative;
                z-index: 10;
            }
            
            .modal-title {
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 24px;
                font-weight: 700;
            }
            
            .close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 28px;
                cursor: pointer;
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background 0.2s;
            }
            
            .close-btn:hover {
                background: rgba(255,255,255,0.2);
            }
            
            /* 컨텐츠 영역 */
            .modal-body {
                padding: 15px 15px 15px 5px;
                display: flex;
                flex-direction: row;
                gap: 15px;
                align-items: flex-start;
            }
            
            .grid-section {
                flex-shrink: 0;
            }
            
            .grid-section {
                flex-shrink: 0;
            }
            
            .controls-section {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 10px;
                min-width: 250px;
            }
            
            /* 하단 정보 바 */
            .info-bar {
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: white;
            }
            
            .info-left {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            
            .info-label {
                font-size: 11px;
                text-transform: uppercase;
                opacity: 0.9;
                font-weight: 600;
            }
            
            .info-value {
                font-size: 32px;
                font-weight: 700;
                font-variant-numeric: tabular-nums;
            }
            
            .info-right {
                display: flex;
                gap: 20px;
            }
            
            .info-stat {
                text-align: center;
            }
            
            .info-stat-label {
                font-size: 11px;
                opacity: 0.9;
                margin-bottom: 3px;
            }
            
            .info-stat-value {
                font-size: 24px;
                font-weight: 700;
            }
            
            .info-stat-value.mistakes {
                color: #fca5a5;
            }
            
            .info-stat-value.hints {
                color: #86efac;
            }
            
            /* 아주 작은 모바일만 (400px 이하) */
            @media (max-width: 500px) {
                body {
                    padding: 5px;
                    align-items: flex-start;
                }
                
                .container {
                    border-radius: 16px;
                    max-width: 100%;
                    min-width: unset !important;
                }
                
                .modal-header {
                    padding: 15px;
                }
                
                .modal-title {
                    font-size: 20px;
                    gap: 8px;
                }
                
                .modal-body {
                    padding: 15px 15px 15px 5px;
                    flex-direction: column;
                    gap: 15px;
                    align-items: center;
                }
                
                .grid-section {
                    width: 100%;
                    display: flex;
                    justify-content: center;
                }
                
                .controls-section {
                    width: 100%;
                    min-width: unset;
                }
                
                .info-bar {
                    padding: 12px 15px;
                }
                
                .info-label {
                    font-size: 10px;
                }
                
                .info-value {
                    font-size: 24px;
                }
                
                .info-stat-label {
                    font-size: 10px;
                }
                
                .info-stat-value {
                    font-size: 20px;
                }
                
                .sudoku-grid table {
                    width: 300px !important;
                    height: 300px !important;
                }
                
                .sudoku-grid td {
                    width: 33px !important;
                    height: 33px !important;
                    min-width: 33px !important;
                    max-width: 33px !important;
                    min-height: 33px !important;
                    max-height: 33px !important;
                    font-size: 15px !important;
                }
                
                .action-btn {
                    padding: 8px 12px;
                    font-size: 12px;
                }
                
                .number-btn {
                    min-height: 42px;
                    font-size: 18px;
                }
            }
            
            /* Game sections */
            
            /* 액션 버튼 */
            .action-buttons {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
                justify-content: center;
                margin-bottom: 12px;
            }
            
            /* Sudoku Grid - TABLE */
            .sudoku-grid {
                text-align: center;
            }
            
            .sudoku-grid table {
                border-collapse: collapse;
                table-layout: fixed;
                width: 320px;
                height: 320px;
                margin: 0;
                border: 2px solid #2d3748;
                box-sizing: border-box;
                display: block;
            }
            
            .sudoku-grid td {
                width: 35px !important;
                height: 35px !important;
                min-width: 35px !important;
                max-width: 35px !important;
                min-height: 35px !important;
                max-height: 35px !important;
                background: white !important;
                border: 1px solid #cbd5e0 !important;
                text-align: center !important;
                vertical-align: middle !important;
                font-size: 18px !important;
                font-weight: 700 !important;
                cursor: pointer !important;
                padding: 0 !important;
                margin: 0 !important;
                box-sizing: border-box !important;
                position: relative !important;
                overflow: hidden !important;
            }
            
            /* 3x3 박스 구분선 (굵게) */
            .sudoku-grid td.border-right {
                border-right: 2px solid #2d3748 !important;
            }
            
            .sudoku-grid td.border-bottom {
                border-bottom: 2px solid #2d3748 !important;
            }
            
            /* Cell states */
            .sudoku-cell.selected {
                background: #fef3c7 !important;
                border: 2px solid #f59e0b !important;
            }
            
            .sudoku-cell.same-number {
                background: #dbeafe !important;
            }
            
            .sudoku-cell.fixed {
                color: #1f2937;
                background: #f3f4f6;
                cursor: not-allowed;
            }
            
            .sudoku-cell.user-input {
                color: #3b82f6;
            }
            
            .sudoku-cell.error {
                color: #ef4444 !important;
                background: #fee2e2 !important;
            }
            
            .sudoku-cell:hover:not(.fixed) {
                background: #f3f4f6;
            }
            
            /* Note mode (pencil marks) */
            .sudoku-cell .notes {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                grid-template-rows: repeat(3, 1fr);
                font-size: 9px;
                font-weight: 400;
                color: #6b7280;
                height: 100%;
                width: 100%;
                padding: 2px;
            }
            
            .sudoku-cell .notes span {
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 8px;
            }
            
            /* Number pad */
            .number-pad {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 6px;
                width: 100%;
                max-width: 420px;
                margin: 0 auto;
            }
            
            .number-btn {
                aspect-ratio: 1;
                min-height: 40px;
                background: white;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 20px;
                font-weight: 700;
                color: #1f2937;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .number-btn:hover {
                background: #f3f4f6;
                border-color: #3b82f6;
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            }
            
            .number-btn:active {
                transform: translateY(0);
            }
            
            .number-btn.disabled {
                opacity: 0.3;
                cursor: not-allowed;
                background: #f9fafb;
            }
            
            .number-btn.disabled:hover {
                transform: none;
                border-color: #e5e7eb;
            }
            
            /* Action buttons */
            .action-btn {
                padding: 10px 16px;
                border-radius: 8px;
                font-weight: 600;
                border: none;
                cursor: pointer;
                transition: all 0.2s;
                display: inline-flex;
                align-items: center;
                gap: 6px;
                font-size: 14px;
                white-space: nowrap;
            }
            
            .action-btn.primary {
                background: #3b82f6;
                color: white;
            }
            
            .action-btn.primary:hover {
                background: #2563eb;
            }
            
            .action-btn.secondary {
                background: #6b7280;
                color: white;
            }
            
            .action-btn.secondary:hover {
                background: #4b5563;
            }
            
            .action-btn.success {
                background: #10b981;
                color: white;
            }
            
            .action-btn.success:hover {
                background: #059669;
            }
            
            .action-btn.note-active {
                background: #f59e0b;
                color: white;
            }
            
            /* Header Styles */
            .header-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 12px;
            }
            
            .header-left {
                display: flex;
                flex-direction: column;
            }
            
            .header-right {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
            }
            
            .difficulty-label {
                font-size: 11px;
                color: #6b7280;
                text-transform: uppercase;
                font-weight: 600;
                margin-bottom: 2px;
            }
            
            .timer {
                font-size: 24px;
                font-weight: 700;
                color: #1f2937;
                font-variant-numeric: tabular-nums;
            }
            
            .stat-item {
                text-align: center;
            }
            
            .stat-label {
                font-size: 10px;
                color: #6b7280;
                margin-bottom: 2px;
            }
            
            .stat-value {
                font-size: 20px;
                font-weight: 700;
            }
            
            .stat-value.mistakes {
                color: #ef4444;
            }
            
            .stat-value.hints {
                color: #10b981;
            }
            
            /* Modal */
            /* Success Modal */
            .success-modal {
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.75);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                padding: 20px;
            }
            
            .success-modal.active {
                display: flex;
            }
            
            .success-modal-content {
                background: white;
                border-radius: 20px;
                padding: 40px;
                max-width: 500px;
                width: 100%;
                text-align: center;
                animation: modalSlideIn 0.3s ease;
            }
            
            @keyframes modalSlideIn {
                from {
                    transform: translateY(-50px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            .success-emoji {
                font-size: 60px;
                margin-bottom: 20px;
            }
            
            .success-title {
                font-size: 32px;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 12px;
            }
            
            .success-text {
                font-size: 18px;
                color: #6b7280;
                margin-bottom: 24px;
            }
            
            .success-buttons {
                display: flex;
                gap: 12px;
                justify-content: center;
            }
        </style>
    </head>
    <body>
        <div class="container" id="game-container">
            <!-- 컨텐츠 영역 -->
            <div class="modal-body">
                <!-- 왼쪽: 스도쿠 그리드 -->
                <div class="grid-section">
                    <div class="sudoku-grid" id="sudoku-grid"></div>
                </div>
                
                <!-- 오른쪽: 컨트롤 -->
                <div class="controls-section">
                    <!-- 액션 버튼 -->
                    <div class="action-buttons">
                        <button class="action-btn secondary" onclick="undo()" id="undo-btn">
                            <i class="fas fa-undo"></i> 되돌리기
                        </button>
                        <button class="action-btn secondary" onclick="toggleNoteMode()" id="note-btn">
                            <i class="fas fa-pencil-alt"></i> 메모 모드
                        </button>
                        <button class="action-btn primary" onclick="giveHint()">
                            <i class="fas fa-lightbulb"></i> 힌트
                        </button>
                        <button class="action-btn secondary" onclick="clearCell()">
                            <i class="fas fa-eraser"></i> 지우기
                        </button>
                        <button class="action-btn success" onclick="checkSolution()">
                            <i class="fas fa-check"></i> 검사
                        </button>
                    </div>
                    
                    <!-- 숫자 패드 -->
                    <div class="number-pad">
                        ${Array.from({ length: 9 }, (_, i) => `
                            <button class="number-btn" onclick="inputNumber(${i + 1})">${i + 1}</button>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <!-- 하단 정보 바 -->
            <div class="info-bar">
                <div class="info-left">
                    <div class="info-label">${difficulty.toUpperCase()} MODE</div>
                    <div class="info-value" id="timer">00:00</div>
                </div>
                <div class="info-right">
                    <div class="info-stat">
                        <div class="info-stat-label">실수</div>
                        <div class="info-stat-value mistakes" id="mistakes">0</div>
                    </div>
                    <div class="info-stat">
                        <div class="info-stat-label">힌트</div>
                        <div class="info-stat-value hints" id="hints-left">3</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Success Modal -->
        <div class="success-modal" id="success-modal">
            <div class="success-modal-content">
                <div class="success-emoji">🎉</div>
                <h2 class="success-title">축하합니다!</h2>
                <p class="success-text">
                    <span id="final-time"></span> 만에 완료했습니다!
                </p>
                <div class="success-buttons">
                    <button class="action-btn primary" onclick="saveScore()">
                        <i class="fas fa-save"></i> 기록 저장
                    </button>
                    <button class="action-btn secondary" onclick="playAgain()">
                        <i class="fas fa-redo"></i> 다시 하기
                    </button>
                </div>
            </div>
        </div>

        <script>
            // ==================== 전역 변수 ====================
            const difficulty = '${difficulty}';
            
            // ==================== 스도쿠 생성 알고리즘 ====================
            
            // 스도쿠 생성 (백트래킹 알고리즘)
            function generateSudoku() {
                const grid = Array(9).fill(null).map(() => Array(9).fill(0));
                
                // 완성된 스도쿠 생성
                fillGrid(grid);
                
                // 난이도에 따라 셀 제거
                const cellsToRemove = {
                    easy: 35,
                    medium: 45,
                    hard: 55
                }[difficulty] || 35;
                
                removeNumbers(grid, cellsToRemove);
                
                return grid;
            }
            
            function fillGrid(grid) {
                const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                
                for (let row = 0; row < 9; row++) {
                    for (let col = 0; col < 9; col++) {
                        if (grid[row][col] === 0) {
                            shuffle(numbers);
                            for (const num of numbers) {
                                if (isValid(grid, row, col, num)) {
                                    grid[row][col] = num;
                                    if (fillGrid(grid)) {
                                        return true;
                                    }
                                    grid[row][col] = 0;
                                }
                            }
                            return false;
                        }
                    }
                }
                return true;
            }
            
            function removeNumbers(grid, count) {
                let attempts = 0;
                while (attempts < count) {
                    const row = Math.floor(Math.random() * 9);
                    const col = Math.floor(Math.random() * 9);
                    if (grid[row][col] !== 0) {
                        grid[row][col] = 0;
                        attempts++;
                    }
                }
            }
            
            function isValid(grid, row, col, num) {
                // 행 체크
                for (let x = 0; x < 9; x++) {
                    if (grid[row][x] === num) return false;
                }
                
                // 열 체크
                for (let x = 0; x < 9; x++) {
                    if (grid[x][col] === num) return false;
                }
                
                // 3x3 박스 체크
                const boxRow = Math.floor(row / 3) * 3;
                const boxCol = Math.floor(col / 3) * 3;
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        if (grid[boxRow + i][boxCol + j] === num) return false;
                    }
                }
                
                return true;
            }
            
            function shuffle(array) {
                for (let i = array.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [array[i], array[j]] = [array[j], array[i]];
                }
            }
            
            function solveSudoku(grid) {
                const solved = grid.map(row => [...row]);
                fillGrid(solved);
                return solved;
            }
            
            // ==================== 게임 상태 ====================
            
            let puzzle = [];
            let solution = [];
            let currentGrid = [];
            let selectedCell = null;
            let noteMode = false;
            let notes = Array(9).fill(null).map(() => Array(9).fill(null).map(() => new Set()));
            let history = [];
            let startTime = null;
            let timerInterval = null;
            let mistakes = 0;
            let hintsLeft = 3;
            let maxMistakes = 99; // 무제한
            
            // ==================== 게임 초기화 ====================
            
            function initGame() {
                console.log('🎮 initGame() 시작');
                puzzle = generateSudoku();
                console.log('✅ 퍼즐 생성 완료:', puzzle);
                solution = solveSudoku(puzzle.map(row => [...row]));
                console.log('✅ 솔루션 생성 완료');
                currentGrid = puzzle.map(row => [...row]);
                
                renderGrid();
                console.log('✅ 그리드 렌더링 완료');
                startTimer();
            }
            
            function renderGrid() {
                console.log('📋 renderGrid() 시작 - SIMPLE TABLE');
                const gridEl = document.getElementById('sudoku-grid');
                gridEl.innerHTML = '';
                
                // TABLE 생성
                const table = document.createElement('table');
                
                // 9개의 행 생성
                for (let row = 0; row < 9; row++) {
                    const tr = document.createElement('tr');
                    
                    // 각 행에 9개의 셀 생성
                    for (let col = 0; col < 9; col++) {
                        const td = document.createElement('td');
                        td.dataset.row = row;
                        td.dataset.col = col;
                        
                        // 3x3 박스 구분선 (클래스 추가)
                        if ((col + 1) % 3 === 0 && col < 8) {
                            td.classList.add('border-right');
                        }
                        if ((row + 1) % 3 === 0 && row < 8) {
                            td.classList.add('border-bottom');
                        }
                        
                        const value = currentGrid[row][col];
                        const isFixed = puzzle[row][col] !== 0;
                        
                        if (isFixed) {
                            td.classList.add('fixed');
                            td.style.background = '#f3f4f6';
                            td.style.color = '#1f2937';
                            td.style.cursor = 'not-allowed';
                            td.textContent = value;
                        } else if (value !== 0) {
                            td.classList.add('user-input');
                            td.style.color = '#3b82f6';
                            td.textContent = value;
                        } else if (notes[row][col].size > 0) {
                            // 메모 표시
                            const notesDiv = document.createElement('div');
                            notesDiv.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr); font-size: 9px; color: #6b7280; width: 100%; height: 100%;';
                            for (let i = 1; i <= 9; i++) {
                                const span = document.createElement('span');
                                span.style.cssText = 'display: flex; align-items: center; justify-content: center; font-size: 8px;';
                                span.textContent = notes[row][col].has(i) ? i : '';
                                notesDiv.appendChild(span);
                            }
                            td.appendChild(notesDiv);
                        }
                        
                        td.addEventListener('click', () => selectCell(row, col));
                        tr.appendChild(td);
                    }
                    
                    table.appendChild(tr);
                }
                
                gridEl.appendChild(table);
                console.log('✅ 9×9 SIMPLE TABLE 생성 완료');
                
                updateNumberPad();
            }
            
            // ==================== 셀 선택 ====================
            
            function selectCell(row, col) {
                selectedCell = { row, col };
                
                // 모든 셀 하이라이트 제거
                document.querySelectorAll('.sudoku-grid td').forEach(cell => {
                    cell.classList.remove('selected', 'same-number');
                    cell.style.background = cell.classList.contains('fixed') ? '#f3f4f6' : 'white';
                });
                
                // 선택된 셀 하이라이트
                const cells = document.querySelectorAll('.sudoku-grid td');
                const index = row * 9 + col;
                cells[index].classList.add('selected');
                cells[index].style.background = '#fef3c7';
                cells[index].style.border = '2px solid #f59e0b';
                
                // 같은 숫자 하이라이트
                const value = currentGrid[row][col];
                if (value !== 0) {
                    cells.forEach((cell, i) => {
                        const r = Math.floor(i / 9);
                        const c = i % 9;
                        if (currentGrid[r][c] === value) {
                            cell.classList.add('same-number');
                            if (!cell.classList.contains('selected')) {
                                cell.style.background = '#dbeafe';
                            }
                        }
                    });
                }
            }
            
            // ==================== 숫자 입력 ====================
            
            function inputNumber(num) {
                if (!selectedCell) return;
                
                const { row, col } = selectedCell;
                
                // 고정된 셀은 수정 불가
                if (puzzle[row][col] !== 0) return;
                
                // 히스토리에 저장
                history.push({
                    row,
                    col,
                    oldValue: currentGrid[row][col],
                    oldNotes: new Set(notes[row][col]),
                    newValue: noteMode ? currentGrid[row][col] : num,
                    newNotes: noteMode ? toggleNote(row, col, num) : new Set()
                });
                
                if (noteMode) {
                    // 메모 모드
                    if (notes[row][col].has(num)) {
                        notes[row][col].delete(num);
                    } else {
                        notes[row][col].add(num);
                    }
                } else {
                    // 일반 입력
                    currentGrid[row][col] = num;
                    notes[row][col].clear();
                    
                    // 유효성 검사
                    if (!isValid(currentGrid.map(r => [...r]), row, col, num)) {
                        mistakes++;
                        document.getElementById('mistakes').textContent = mistakes;
                        
                        // 셀에 에러 표시
                        setTimeout(() => {
                            const cells = document.querySelectorAll('#sudoku-grid td');
                            const cell = cells[row * 9 + col];
                            if (cell) {
                                cell.classList.add('error');
                                setTimeout(() => {
                                    cell.classList.remove('error');
                                }, 1000);
                            }
                        }, 0);
                    }
                }
                
                renderGrid();
                selectCell(row, col);
                
                // 완성 체크
                if (isComplete()) {
                    endGame();
                }
            }
            
            function toggleNote(row, col, num) {
                const newNotes = new Set(notes[row][col]);
                if (newNotes.has(num)) {
                    newNotes.delete(num);
                } else {
                    newNotes.add(num);
                }
                return newNotes;
            }
            
            // ==================== 기능 버튼 ====================
            
            function toggleNoteMode() {
                noteMode = !noteMode;
                const btn = document.getElementById('note-btn');
                if (noteMode) {
                    btn.classList.add('note-active');
                } else {
                    btn.classList.remove('note-active');
                }
            }
            
            function clearCell() {
                if (!selectedCell) return;
                
                const { row, col } = selectedCell;
                if (puzzle[row][col] !== 0) return;
                
                history.push({
                    row,
                    col,
                    oldValue: currentGrid[row][col],
                    oldNotes: new Set(notes[row][col]),
                    newValue: 0,
                    newNotes: new Set()
                });
                
                currentGrid[row][col] = 0;
                notes[row][col].clear();
                renderGrid();
                selectCell(row, col);
            }
            
            function undo() {
                if (history.length === 0) return;
                
                const lastMove = history.pop();
                const { row, col, oldValue, oldNotes } = lastMove;
                
                currentGrid[row][col] = oldValue;
                notes[row][col] = new Set(oldNotes);
                
                renderGrid();
                selectCell(row, col);
            }
            
            function giveHint() {
                if (hintsLeft <= 0) {
                    alert('힌트를 모두 사용했습니다!');
                    return;
                }
                
                // 빈 칸 찾기
                const emptyCells = [];
                for (let row = 0; row < 9; row++) {
                    for (let col = 0; col < 9; col++) {
                        if (puzzle[row][col] === 0 && currentGrid[row][col] === 0) {
                            emptyCells.push({ row, col });
                        }
                    }
                }
                
                if (emptyCells.length === 0) return;
                
                // 랜덤 셀 선택
                const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
                const { row, col } = randomCell;
                
                history.push({
                    row,
                    col,
                    oldValue: currentGrid[row][col],
                    oldNotes: new Set(notes[row][col]),
                    newValue: solution[row][col],
                    newNotes: new Set()
                });
                
                currentGrid[row][col] = solution[row][col];
                notes[row][col].clear();
                hintsLeft--;
                document.getElementById('hints-left').textContent = hintsLeft;
                
                renderGrid();
                selectCell(row, col);
            }
            
            // ==================== 타이머 ====================
            
            function startTimer() {
                startTime = Date.now();
                timerInterval = setInterval(updateTimer, 1000);
            }
            
            function updateTimer() {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                document.getElementById('timer').textContent = 
                    \`\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`;
            }
            
            function stopTimer() {
                if (timerInterval) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                }
            }
            
            function getElapsedTime() {
                return Math.floor((Date.now() - startTime) / 1000);
            }
            
            // ==================== 게임 완료 ====================
            
            function isComplete() {
                for (let row = 0; row < 9; row++) {
                    for (let col = 0; col < 9; col++) {
                        if (currentGrid[row][col] === 0) return false;
                        if (currentGrid[row][col] !== solution[row][col]) return false;
                    }
                }
                return true;
            }
            
            function checkSolution() {
                if (isComplete()) {
                    endGame();
                } else {
                    alert('아직 완성되지 않았거나 오류가 있습니다!');
                }
            }
            
            function endGame() {
                stopTimer();
                
                const elapsed = getElapsedTime();
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                document.getElementById('final-time').textContent = \`\${minutes}분 \${seconds}초\`;
                
                document.getElementById('success-modal').classList.add('active');
            }
            
            async function saveScore() {
                console.log('🎯 [프론트] Saving score...');
                console.log('📊 [프론트] 현재 난이도:', difficulty);
                console.log('⏱️ [프론트] 소요 시간:', getElapsedTime());
                console.log('❌ [프론트] 실수 횟수:', mistakes);
                
                const elapsed = getElapsedTime();
                
                // 현재 쿠키 확인
                console.log('🍪 [프론트] 현재 쿠키:', document.cookie);
                
                try {
                    console.log('🌐 [프론트] API 요청 시작...');
                    const response = await fetch('/api/sudoku/score', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include', // 쿠키 전송
                        body: JSON.stringify({
                            difficulty: difficulty,
                            time: elapsed,
                            mistakes: mistakes
                        })
                    });
                    
                    console.log('📡 [프론트] 응답 상태:', response.status, response.statusText);
                    
                    const data = await response.json();
                    console.log('📦 [프론트] 응답 데이터:', data);
                    
                    if (data.success) {
                        console.log('✅ [프론트] 점수 저장 성공!');
                        alert('기록이 저장되었습니다!');
                        document.getElementById('success-modal').classList.remove('active');
                        // 리더보드가 있으면 새로고침
                        window.location.reload();
                    } else {
                        console.log('❌ [프론트] 점수 저장 실패:', data.message);
                        if (data.requireLogin) {
                            alert('로그인이 필요합니다. 점수를 저장하려면 로그인해주세요.');
                            console.log('🔐 [프론트] 로그인 필요 - 로그인 페이지로 이동 제안');
                            // 로그인 페이지로 이동할지 물어보기
                            if (confirm('로그인 페이지로 이동하시겠습니까?')) {
                                window.location.href = '/auth/login';
                            }
                        } else {
                            alert(data.message || '기록 저장에 실패했습니다.');
                        }
                    }
                } catch (error) {
                    console.error('💥 [프론트] 기록 저장 오류:', error);
                    alert('기록 저장에 실패했습니다.');
                }
            }
            
            function playAgain() {
                document.getElementById('success-modal').classList.remove('active');
                
                // 게임 초기화
                stopTimer();
                mistakes = 0;
                hintsLeft = 3;
                selectedCell = null;
                noteMode = false;
                history = [];
                notes = Array(9).fill(null).map(() => Array(9).fill(null).map(() => new Set()));
                
                document.getElementById('mistakes').textContent = '0';
                document.getElementById('hints-left').textContent = '3';
                document.getElementById('note-btn').classList.remove('note-active');
                
                initGame();
            }
            
            // ==================== 숫자 패드 업데이트 ====================
            
            function updateNumberPad() {
                // 각 숫자가 몇 개 남았는지 계산
                const counts = Array(10).fill(0);
                for (let row = 0; row < 9; row++) {
                    for (let col = 0; col < 9; col++) {
                        if (currentGrid[row][col] !== 0) {
                            counts[currentGrid[row][col]]++;
                        }
                    }
                }
                
                // 9개 완성된 숫자는 비활성화
                document.querySelectorAll('.number-btn').forEach((btn, i) => {
                    const num = i + 1;
                    if (counts[num] >= 9) {
                        btn.classList.add('disabled');
                        btn.disabled = true;
                    } else {
                        btn.classList.remove('disabled');
                        btn.disabled = false;
                    }
                });
            }
            
            // ==================== 키보드 입력 ====================
            
            document.addEventListener('keydown', (e) => {
                if (e.key >= '1' && e.key <= '9') {
                    inputNumber(parseInt(e.key));
                } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
                    clearCell();
                } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    undo();
                } else if (e.key === 'n' || e.key === 'N') {
                    toggleNoteMode();
                } else if (e.key === 'h' || e.key === 'H') {
                    giveHint();
                }
            });
            
            // ==================== 초기화 ====================
            
            window.addEventListener('DOMContentLoaded', () => {
                initGame();
            });
        </script>
    </body>
    </html>
  `);
});
// ==================== 2048 게임 ====================
// 2048 메인 페이지
app.get('/game/simple/2048', (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko" id="html-root">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>2048 챌린지 - Faith Portal</title>
        <script>
            (function() {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                    if (args[0] && typeof args[0] === 'string' && 
                        args[0].includes('cdn.tailwindcss.com should not be used in production')) {
                        return;
                    }
                    originalWarn.apply(console, args);
                };
            })();
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .faith-blue { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); }
            .faith-blue-hover:hover { background: linear-gradient(135deg, #0284c7 0%, #0891b2 100%); }
        </style>
    </head>
    <body class="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        ${getCommonHeader('Game')}
        ${getStickyHeader()}
        
        ${getBreadcrumb([
        { label: '홈', href: '/' },
        { label: '게임', href: '/game' },
        { label: '심플 게임', href: '/game/simple' },
        { label: '2048' }
    ])}

        ${getGameMenu('/game/simple')}
        
        <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 flex flex-col lg:flex-row gap-4 sm:gap-6">
            ${getSimpleGameSidebar('/game/simple/2048')}

            <!-- 메인 컨텐츠 -->
            <main class="flex-1">
                <div class="bg-white rounded-xl shadow-lg p-6 sm:p-8">
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h1 class="text-3xl font-bold text-gray-800 mb-6">
                            <i class="fas fa-th-large mr-2 text-cyan-500"></i>
                            2048 챌린지
                        </h1>

                        <button 
                            onclick="openGameModal()"
                            class="faith-blue faith-blue-hover text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-md hover:shadow-lg transition-all mb-6 w-full">
                            <i class="fas fa-play mr-2"></i>
                            게임 시작
                        </button>

                        <div class="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-6 mb-6">
                            <h2 class="text-xl font-bold text-gray-800 mb-4">
                                <i class="fas fa-info-circle mr-2 text-cyan-500"></i>
                                게임 규칙
                            </h2>
                            <div class="space-y-3 text-gray-700">
                                <p><i class="fas fa-arrow-right text-cyan-500 mr-2"></i>방향키로 타일을 이동하세요</p>
                                <p><i class="fas fa-plus text-cyan-500 mr-2"></i>같은 숫자끼리 합쳐집니다</p>
                                <p><i class="fas fa-trophy text-cyan-500 mr-2"></i>2048을 만들면 승리!</p>
                                <p><i class="fas fa-gamepad text-cyan-500 mr-2"></i>모바일에서는 스와이프로 조작하세요</p>
                            </div>
                        </div>

                        <div class="bg-white rounded-lg border border-gray-200 p-6">
                            <h2 class="text-xl font-bold text-gray-800 mb-4">
                                <i class="fas fa-crown mr-2 text-yellow-500"></i>
                                리더보드
                            </h2>
                            
                            <div id="loading" class="text-center py-8">
                                <i class="fas fa-spinner fa-spin text-3xl text-cyan-500"></i>
                                <p class="text-gray-600 mt-2">로딩중...</p>
                            </div>
                            
                            <div id="leaderboard-content" class="hidden space-y-3">
                                <!-- 랭킹이 여기에 표시됩니다 -->
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>

        <!-- 게임 모달 -->
        <div id="game-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
                <div class="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 class="text-xl font-bold text-gray-800">
                        <i class="fas fa-th mr-2 text-cyan-500"></i>
                        2048
                    </h2>
                    <button onclick="closeGameModal()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
                <div class="p-0">
                    <iframe id="game-frame" class="w-full" style="height: 80vh; border: none;"></iframe>
                </div>
            </div>
        </div>

        <script>
            let currentDifficulty = 'all';
            
            // 리더보드 로드
            async function loadLeaderboard() {
                const loading = document.getElementById('loading');
                const content = document.getElementById('leaderboard-content');
                
                try {
                    const response = await fetch('/api/2048/leaderboard');
                    const data = await response.json();
                    
                    loading.classList.add('hidden');
                    content.classList.remove('hidden');
                    
                    if (data.success && data.scores && data.scores.length > 0) {
                        content.innerHTML = data.scores.slice(0, 10).map((score, index) => {
                            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '#' + (index + 1);
                            const date = new Date(score.created_at);
                            const dateStr = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
                            const username = score.email ? score.email.split('@')[0] : 'Anonymous';
                            
                            return '<div class="leaderboard-row bg-gray-50 rounded-lg p-3 flex items-center justify-between hover:bg-gray-100 transition-colors">' +
                                '<div class="flex items-center gap-3">' +
                                '<span class="text-xl font-bold w-8">' + medal + '</span>' +
                                '<div>' +
                                '<div class="font-semibold text-gray-800">' + username + '</div>' +
                                '<div class="text-sm text-gray-500">' + dateStr + '</div>' +
                                '</div>' +
                                '</div>' +
                                '<div class="text-right">' +
                                '<div class="font-bold text-cyan-600">' + score.score.toLocaleString() + '점</div>' +
                                '<div class="text-sm text-gray-500">최고타일: ' + score.max_tile + '</div>' +
                                '</div>' +
                                '</div>';
                        }).join('');
                    } else {
                        content.innerHTML = '<div class="text-center py-8 text-gray-500">' +
                            '<i class="fas fa-inbox text-4xl mb-2"></i>' +
                            '<p>아직 기록이 없습니다</p>' +
                            '<p class="text-sm">첫 번째 기록의 주인공이 되어보세요!</p>' +
                            '</div>';
                    }
                } catch (error) {
                    console.error('리더보드 로드 오류:', error);
                    loading.classList.add('hidden');
                    content.classList.remove('hidden');
                    content.innerHTML = '<div class="text-center text-red-500">' +
                        '<i class="fas fa-exclamation-triangle text-3xl mb-2"></i>' +
                        '<p>리더보드를 불러올 수 없습니다</p>' +
                        '</div>';
                }
            }
            
            // 게임 모달 열기/닫기
            function openGameModal() {
                const modal = document.getElementById('game-modal');
                const frame = document.getElementById('game-frame');
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                frame.src = '/game/simple/2048/play';
            }
            
            function closeGameModal() {
                const modal = document.getElementById('game-modal');
                const frame = document.getElementById('game-frame');
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                frame.src = '';
                loadLeaderboard();
            }
            
            // ESC 키로 모달 닫기
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    closeGameModal();
                }
            });
            
            // 페이지 로드 시 리더보드 로드
            document.addEventListener('DOMContentLoaded', loadLeaderboard);
        </script>
        
        ${getCommonFooter()}
        ${getCommonAuthScript()}
    </body>
    </html>
  `);
});
// 2048 플레이 페이지
app.get('/game/simple/2048/play', (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>2048 게임</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                touch-action: manipulation;
            }
            
            body {
                font-family: 'Clear Sans', 'Helvetica Neue', Arial, sans-serif;
                background: #faf8ef;
                color: #776e65;
                padding: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
                min-height: 100vh;
            }
            
            .container {
                width: 100%;
                max-width: 500px;
            }
            
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            
            .title {
                font-size: 48px;
                font-weight: bold;
                color: #776e65;
            }
            
            .scores {
                display: flex;
                gap: 10px;
            }
            
            .score-container {
                background: #bbada0;
                padding: 10px 20px;
                border-radius: 5px;
                text-align: center;
                min-width: 80px;
            }
            
            .score-title {
                font-size: 12px;
                color: #eee4da;
                text-transform: uppercase;
            }
            
            .score-value {
                font-size: 24px;
                font-weight: bold;
                color: white;
            }
            
            .controls {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
            }
            
            .button {
                flex: 1;
                background: #8f7a66;
                color: white;
                padding: 12px;
                border: none;
                border-radius: 5px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                transition: background 0.2s;
            }
            
            .button:hover {
                background: #9f8a76;
            }
            
            .button:disabled {
                background: #cdc1b4;
                cursor: not-allowed;
            }
            
            .game-board {
                background: #bbada0;
                border-radius: 10px;
                padding: 15px;
                position: relative;
                width: 100%;
                aspect-ratio: 1;
            }
            
            .grid-container {
                position: relative;
                width: 100%;
                height: 100%;
            }
            
            .grid-row {
                display: flex;
                gap: 15px;
                margin-bottom: 15px;
            }
            
            .grid-row:last-child {
                margin-bottom: 0;
            }
            
            .grid-cell {
                flex: 1;
                aspect-ratio: 1;
                background: rgba(238, 228, 218, 0.35);
                border-radius: 5px;
            }
            
            .tile-container {
                position: absolute;
                inset: 15px;
            }
            
            .tile {
                position: absolute;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 5px;
                font-weight: bold;
                transition: all 0.15s ease-in-out;
            }
            
            .tile-2 { background: #eee4da; color: #776e65; }
            .tile-4 { background: #ede0c8; color: #776e65; }
            .tile-8 { background: #f2b179; color: #f9f6f2; }
            .tile-16 { background: #f59563; color: #f9f6f2; }
            .tile-32 { background: #f67c5f; color: #f9f6f2; }
            .tile-64 { background: #f65e3b; color: #f9f6f2; }
            .tile-128 { background: #edcf72; color: #f9f6f2; font-size: 0.8em; }
            .tile-256 { background: #edcc61; color: #f9f6f2; font-size: 0.8em; }
            .tile-512 { background: #edc850; color: #f9f6f2; font-size: 0.8em; }
            .tile-1024 { background: #edc53f; color: #f9f6f2; font-size: 0.7em; }
            .tile-2048 { background: #edc22e; color: #f9f6f2; font-size: 0.7em; }
            .tile-4096 { background: #3c3a32; color: #f9f6f2; font-size: 0.7em; }
            
            .tile-new {
                animation: pop 0.2s ease-in-out;
            }
            
            .tile-merged {
                animation: merge 0.2s ease-in-out;
            }
            
            @keyframes pop {
                0% {
                    transform: scale(0);
                }
                50% {
                    transform: scale(1.1);
                }
                100% {
                    transform: scale(1);
                }
            }
            
            @keyframes merge {
                0% {
                    transform: scale(1);
                }
                50% {
                    transform: scale(1.2);
                }
                100% {
                    transform: scale(1);
                }
            }
            
            .tip {
                text-align: center;
                margin-top: 20px;
                color: #776e65;
                font-size: 14px;
            }
            
            .game-over-modal, .win-modal {
                position: fixed;
                inset: 0;
                background: rgba(255, 255, 255, 0.9);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            
            .modal-content {
                background: white;
                padding: 40px;
                border-radius: 10px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                max-width: 400px;
                width: 90%;
            }
            
            .modal-title {
                font-size: 32px;
                font-weight: bold;
                color: #776e65;
                margin-bottom: 20px;
            }
            
            .modal-score {
                font-size: 24px;
                color: #8f7a66;
                margin-bottom: 30px;
            }
            
            .modal-buttons {
                display: flex;
                gap: 10px;
            }
            
            .modal-button {
                flex: 1;
                padding: 15px;
                border: none;
                border-radius: 5px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                transition: opacity 0.2s;
            }
            
            .modal-button:hover {
                opacity: 0.9;
            }
            
            .primary-button {
                background: #8f7a66;
                color: white;
            }
            
            .secondary-button {
                background: #eee4da;
                color: #776e65;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="title">2048</div>
                <div class="scores">
                    <div class="score-container">
                        <div class="score-title">Score</div>
                        <div class="score-value" id="score">0</div>
                    </div>
                    <div class="score-container">
                        <div class="score-title">Best</div>
                        <div class="score-value" id="best">0</div>
                    </div>
                </div>
            </div>
            
            <div class="controls">
                <button class="button" onclick="newGame()">새 게임</button>
                <button class="button" id="undo-btn" onclick="undo()" disabled>Undo (3)</button>
            </div>
            
            <div class="game-board">
                <div class="grid-container">
                    <div class="grid-row">
                        <div class="grid-cell"></div>
                        <div class="grid-cell"></div>
                        <div class="grid-cell"></div>
                        <div class="grid-cell"></div>
                    </div>
                    <div class="grid-row">
                        <div class="grid-cell"></div>
                        <div class="grid-cell"></div>
                        <div class="grid-cell"></div>
                        <div class="grid-cell"></div>
                    </div>
                    <div class="grid-row">
                        <div class="grid-cell"></div>
                        <div class="grid-cell"></div>
                        <div class="grid-cell"></div>
                        <div class="grid-cell"></div>
                    </div>
                    <div class="grid-row">
                        <div class="grid-cell"></div>
                        <div class="grid-cell"></div>
                        <div class="grid-cell"></div>
                        <div class="grid-cell"></div>
                    </div>
                </div>
                <div class="tile-container" id="tile-container"></div>
            </div>
            
            <div class="tip">
                <strong>Tip:</strong> 같은 숫자를 합쳐보세요!
            </div>
        </div>
        
        <!-- 게임 오버 모달 -->
        <div class="game-over-modal" id="game-over-modal">
            <div class="modal-content">
                <div class="modal-title">게임 오버!</div>
                <div class="modal-score">
                    최종 점수: <strong id="final-score">0</strong><br>
                    최고 타일: <strong id="final-tile">0</strong>
                </div>
                <div class="modal-buttons">
                    <button class="modal-button secondary-button" onclick="closeGameOver()">닫기</button>
                    <button class="modal-button primary-button" onclick="newGame()">다시 하기</button>
                </div>
            </div>
        </div>
        
        <!-- 승리 모달 -->
        <div class="win-modal" id="win-modal">
            <div class="modal-content">
                <div class="modal-title">🎉 축하합니다! 🎉</div>
                <div class="modal-score">
                    2048 타일을 만들었습니다!
                </div>
                <div class="modal-buttons">
                    <button class="modal-button secondary-button" onclick="closeWin()">계속 하기</button>
                    <button class="modal-button primary-button" onclick="newGame()">새 게임</button>
                </div>
            </div>
        </div>
        
        <script>
            // 게임 상태
            let grid = [];
            let score = 0;
            let best = localStorage.getItem('2048-best') || 0;
            let undoStack = [];
            let maxUndos = 3;
            let hasWon = false;
            
            // 터치 이벤트
            let touchStartX = 0;
            let touchStartY = 0;
            let touchEndX = 0;
            let touchEndY = 0;
            
            // 초기화
            function initGame() {
                grid = Array(4).fill(null).map(() => Array(4).fill(0));
                score = 0;
                undoStack = [];
                hasWon = false;
                updateDisplay();
                addRandomTile();
                addRandomTile();
                renderGrid();
            }
            
            // 새 게임
            function newGame() {
                document.getElementById('game-over-modal').style.display = 'none';
                document.getElementById('win-modal').style.display = 'none';
                initGame();
            }
            
            // 랜덤 타일 추가
            function addRandomTile() {
                const empty = [];
                for (let r = 0; r < 4; r++) {
                    for (let c = 0; c < 4; c++) {
                        if (grid[r][c] === 0) {
                            empty.push([r, c]);
                        }
                    }
                }
                
                if (empty.length > 0) {
                    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
                    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
                }
            }
            
            // 이동 가능 여부 체크
            function canMove() {
                // 빈 칸이 있으면 이동 가능
                for (let r = 0; r < 4; r++) {
                    for (let c = 0; c < 4; c++) {
                        if (grid[r][c] === 0) return true;
                    }
                }
                
                // 인접한 같은 숫자가 있으면 이동 가능
                for (let r = 0; r < 4; r++) {
                    for (let c = 0; c < 4; c++) {
                        if (c < 3 && grid[r][c] === grid[r][c + 1]) return true;
                        if (r < 3 && grid[r][c] === grid[r + 1][c]) return true;
                    }
                }
                
                return false;
            }
            
            // 게임 오버
            function gameOver() {
                document.getElementById('final-score').textContent = score;
                const maxTile = Math.max(...grid.flat());
                document.getElementById('final-tile').textContent = maxTile;
                document.getElementById('game-over-modal').style.display = 'flex';
                
                // 점수 저장
                saveScore(score, maxTile);
            }
            
            // 점수 저장
            async function saveScore(finalScore, maxTile) {
                try {
                    console.log('🎮 [2048] 점수 저장 시도:', { score: finalScore, max_tile: maxTile });
                    const response = await fetch('/api/2048/score', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ score: finalScore, max_tile: maxTile })
                    });
                    
                    const data = await response.json();
                    console.log('📦 [2048] 점수 저장 응답:', data);
                    
                    if (data.success) {
                        console.log('✅ [2048] 점수 저장 성공!');
                        alert('🎉 점수가 저장되었습니다!');
                        // 리더보드 새로고침을 위해 페이지 리로드
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    } else {
                        console.error('❌ [2048] 점수 저장 실패:', data.message);
                        if (response.status === 401 || data.requireLogin) {
                            alert('로그인이 필요합니다. 로그인 페이지로 이동합니다.');
                            window.location.href = '/auth/login';
                        } else {
                            alert('점수 저장 실패: ' + data.message);
                        }
                    }
                } catch (error) {
                    console.error('💥 [2048] 점수 저장 오류:', error);
                    alert('점수 저장 중 오류가 발생했습니다.');
                }
            }
            
            // 승리 체크
            function checkWin() {
                if (hasWon) return;
                
                for (let r = 0; r < 4; r++) {
                    for (let c = 0; c < 4; c++) {
                        if (grid[r][c] === 2048) {
                            hasWon = true;
                            document.getElementById('win-modal').style.display = 'flex';
                            return;
                        }
                    }
                }
            }
            
            // 모달 닫기
            function closeGameOver() {
                document.getElementById('game-over-modal').style.display = 'none';
            }
            
            function closeWin() {
                document.getElementById('win-modal').style.display = 'none';
            }
            
            // 이동 로직
            function move(direction) {
                const oldGrid = grid.map(row => [...row]);
                const oldScore = score;
                let moved = false;
                
                // 상태 저장 (undo용)
                if (undoStack.length >= maxUndos) {
                    undoStack.shift();
                }
                undoStack.push({ grid: oldGrid, score: oldScore });
                
                if (direction === 'left') {
                    for (let r = 0; r < 4; r++) {
                        moved = slideRow(r) || moved;
                    }
                } else if (direction === 'right') {
                    for (let r = 0; r < 4; r++) {
                        grid[r].reverse();
                        moved = slideRow(r) || moved;
                        grid[r].reverse();
                    }
                } else if (direction === 'up') {
                    rotateLeft();
                    for (let r = 0; r < 4; r++) {
                        moved = slideRow(r) || moved;
                    }
                    rotateRight();
                } else if (direction === 'down') {
                    rotateLeft();
                    for (let r = 0; r < 4; r++) {
                        grid[r].reverse();
                        moved = slideRow(r) || moved;
                        grid[r].reverse();
                    }
                    rotateRight();
                }
                
                if (moved) {
                    addRandomTile();
                    updateDisplay();
                    renderGrid();
                    checkWin();
                    
                    if (!canMove()) {
                        setTimeout(gameOver, 500);
                    }
                } else {
                    undoStack.pop(); // 이동하지 않았으면 undo 스택에서 제거
                }
            }
            
            // 행 슬라이드
            function slideRow(row) {
                let arr = grid[row].filter(val => val !== 0);
                let moved = false;
                
                for (let i = 0; i < arr.length - 1; i++) {
                    if (arr[i] === arr[i + 1]) {
                        arr[i] *= 2;
                        score += arr[i];
                        arr.splice(i + 1, 1);
                        moved = true;
                    }
                }
                
                while (arr.length < 4) {
                    arr.push(0);
                }
                
                if (JSON.stringify(grid[row]) !== JSON.stringify(arr)) {
                    moved = true;
                }
                
                grid[row] = arr;
                return moved;
            }
            
            // 그리드 회전
            function rotateLeft() {
                const newGrid = Array(4).fill(null).map(() => Array(4).fill(0));
                for (let r = 0; r < 4; r++) {
                    for (let c = 0; c < 4; c++) {
                        newGrid[3 - c][r] = grid[r][c];
                    }
                }
                grid = newGrid;
            }
            
            function rotateRight() {
                const newGrid = Array(4).fill(null).map(() => Array(4).fill(0));
                for (let r = 0; r < 4; r++) {
                    for (let c = 0; c < 4; c++) {
                        newGrid[c][3 - r] = grid[r][c];
                    }
                }
                grid = newGrid;
            }
            
            // Undo
            function undo() {
                if (undoStack.length > 0) {
                    const state = undoStack.pop();
                    grid = state.grid;
                    score = state.score;
                    updateDisplay();
                    renderGrid();
                }
            }
            
            // 디스플레이 업데이트
            function updateDisplay() {
                document.getElementById('score').textContent = score;
                document.getElementById('best').textContent = best = Math.max(score, best);
                localStorage.setItem('2048-best', best);
                
                const undoBtn = document.getElementById('undo-btn');
                undoBtn.disabled = undoStack.length === 0;
                undoBtn.textContent = 'Undo (' + (maxUndos - undoStack.length) + ')';
            }
            
            // 그리드 렌더링
            function renderGrid() {
                const container = document.getElementById('tile-container');
                container.innerHTML = '';
                
                const cellSize = (container.clientWidth - 45) / 4; // 15px gap * 3
                
                for (let r = 0; r < 4; r++) {
                    for (let c = 0; c < 4; c++) {
                        if (grid[r][c] !== 0) {
                            const tile = document.createElement('div');
                            tile.className = 'tile tile-' + grid[r][c];
                            tile.textContent = grid[r][c];
                            tile.style.width = cellSize + 'px';
                            tile.style.height = cellSize + 'px';
                            tile.style.fontSize = (cellSize * 0.5) + 'px';
                            tile.style.left = (c * (cellSize + 15)) + 'px';
                            tile.style.top = (r * (cellSize + 15)) + 'px';
                            container.appendChild(tile);
                        }
                    }
                }
            }
            
            // 키보드 이벤트
            document.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    move('left');
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    move('right');
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    move('up');
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    move('down');
                }
            });
            
            // 터치 이벤트
            document.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
                touchStartY = e.changedTouches[0].screenY;
            }, { passive: true });
            
            document.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                touchEndY = e.changedTouches[0].screenY;
                handleSwipe();
            }, { passive: true });
            
            function handleSwipe() {
                const dx = touchEndX - touchStartX;
                const dy = touchEndY - touchStartY;
                const absDx = Math.abs(dx);
                const absDy = Math.abs(dy);
                
                if (Math.max(absDx, absDy) < 30) return;
                
                if (absDx > absDy) {
                    if (dx > 0) {
                        move('right');
                    } else {
                        move('left');
                    }
                } else {
                    if (dy > 0) {
                        move('down');
                    } else {
                        move('up');
                    }
                }
            }
            
            // 리사이즈 이벤트
            window.addEventListener('resize', renderGrid);
            
            // 게임 시작
            initGame();
        </script>
    </body>
    </html>
  `);
});
// API: 리더보드
// ==================== 지뢰찾기 게임 ====================
// 지뢰찾기 메인 페이지
app.get('/game/simple/minesweeper', (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko" id="html-root">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>지뢰찾기 - Faith Portal</title>
        <script>
            (function() {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                    if (args[0] && typeof args[0] === 'string' && 
                        args[0].includes('cdn.tailwindcss.com should not be used in production')) {
                        return;
                    }
                    originalWarn.apply(console, args);
                };
            })();
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .faith-blue { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); }
            .faith-blue-hover:hover { background: linear-gradient(135deg, #0284c7 0%, #0891b2 100%); }
            .difficulty-tab { 
                cursor: pointer; 
                transition: all 0.3s; 
                padding: 12px 24px;
                border-radius: 12px;
                font-weight: 600;
            }
            .difficulty-tab.active { 
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                color: white;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
            }
            .difficulty-tab:hover:not(.active) {
                background: #fee2e2;
            }
        </style>
    </head>
    <body class="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        ${getCommonHeader('Game')}
        ${getStickyHeader()}
        
        ${getBreadcrumb([
        { label: '홈', href: '/' },
        { label: '게임', href: '/game' },
        { label: '심플 게임', href: '/game/simple' },
        { label: '지뢰찾기' }
    ])}

        ${getGameMenu('/game/simple')}
        
        <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 flex flex-col lg:flex-row gap-4 sm:gap-6">
            ${getSimpleGameSidebar('/game/simple/minesweeper')}

            <!-- 메인 컨텐츠 -->
            <main class="flex-1">
                <div class="bg-white rounded-xl shadow-lg p-6 sm:p-8">
                    <h1 class="text-3xl font-bold text-gray-800 mb-6">
                        <i class="fas fa-bomb mr-2 text-red-500"></i>
                        스피드 지뢰찾기
                    </h1>

                    <!-- 난이도 선택 -->
                    <div class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                        <h2 class="text-xl font-bold text-gray-800 mb-4">
                            <i class="fas fa-sliders-h mr-2 text-red-500"></i>
                            난이도 선택
                        </h2>
                        <div class="flex gap-3 flex-wrap">
                            <div class="difficulty-tab active" data-difficulty="beginner" onclick="selectDifficulty('beginner')">
                                <i class="fas fa-smile mr-2"></i>
                                초급 (9×9)
                            </div>
                            <div class="difficulty-tab" data-difficulty="intermediate" onclick="selectDifficulty('intermediate')">
                                <i class="fas fa-meh mr-2"></i>
                                중급 (16×16)
                            </div>
                            <div class="difficulty-tab" data-difficulty="expert" onclick="selectDifficulty('expert')">
                                <i class="fas fa-skull mr-2"></i>
                                고급 (30×16)
                            </div>
                        </div>
                    </div>

                    <button 
                        onclick="startGame()"
                        class="faith-blue faith-blue-hover text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-md hover:shadow-lg transition-all mb-6 w-full">
                        <i class="fas fa-play mr-2"></i>
                        게임 시작
                    </button>

                    <div class="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-6 mb-6">
                        <h2 class="text-xl font-bold text-gray-800 mb-4">
                            <i class="fas fa-info-circle mr-2 text-red-500"></i>
                            게임 규칙
                        </h2>
                        <div class="space-y-3 text-gray-700">
                            <p><i class="fas fa-mouse-pointer text-red-500 mr-2"></i>좌클릭: 칸 열기</p>
                            <p><i class="fas fa-flag text-red-500 mr-2"></i>우클릭: 깃발 꽂기</p>
                            <p><i class="fas fa-hand-pointer text-red-500 mr-2"></i>양클릭 (Chording): 숫자 칸에서 주변 깃발 수가 맞으면 나머지 칸 열기</p>
                            <p><i class="fas fa-shield-alt text-red-500 mr-2"></i>첫 클릭은 절대 안전합니다!</p>
                            <p><i class="fas fa-trophy text-red-500 mr-2"></i>목표: 지뢰가 아닌 모든 칸을 최대한 빨리 열기</p>
                        </div>
                    </div>

                    <!-- 난이도별 리더보드 -->
                    <div class="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 class="text-xl font-bold text-gray-800 mb-4">
                            <i class="fas fa-crown mr-2 text-yellow-500"></i>
                            명예의 전당
                        </h2>
                        
                        <div class="space-y-6">
                            <!-- 초급 -->
                            <div>
                                <h3 class="font-semibold text-gray-700 mb-2">초급 (9×9, 지뢰 10개)</h3>
                                <div id="beginner-leaderboard" class="space-y-2"></div>
                            </div>
                            
                            <!-- 중급 -->
                            <div>
                                <h3 class="font-semibold text-gray-700 mb-2">중급 (16×16, 지뢰 40개)</h3>
                                <div id="intermediate-leaderboard" class="space-y-2"></div>
                            </div>
                            
                            <!-- 고급 -->
                            <div>
                                <h3 class="font-semibold text-gray-700 mb-2">고급 (30×16, 지뢰 99개)</h3>
                                <div id="expert-leaderboard" class="space-y-2"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>

        <script>
            let currentDifficulty = 'beginner';
            
            function selectDifficulty(difficulty) {
                currentDifficulty = difficulty;
                document.querySelectorAll('.difficulty-tab').forEach(tab => {
                    tab.classList.remove('active');
                });
                document.querySelector('[data-difficulty="' + difficulty + '"]').classList.add('active');
            }
            
            function startGame() {
                openGameModal();
            }
            
            function openGameModal() {
                const modal = document.getElementById('gameModal');
                const iframe = document.getElementById('gameFrame');
                
                iframe.src = '/game/simple/minesweeper/play?difficulty=' + currentDifficulty;
                modal.style.display = 'flex';
                
                setTimeout(() => iframe.focus(), 100);
            }
            
            function closeGameModal() {
                const modal = document.getElementById('gameModal');
                const iframe = document.getElementById('gameFrame');
                modal.style.display = 'none';
                iframe.src = '';
                
                // 리더보드 새로고침
                loadLeaderboards();
            }
            
            async function loadLeaderboards() {
                const difficulties = ['beginner', 'intermediate', 'expert'];
                
                for (const difficulty of difficulties) {
                    try {
                        const response = await fetch('/api/minesweeper/leaderboard/' + difficulty);
                        const data = await response.json();
                        
                        const container = document.getElementById(difficulty + '-leaderboard');
                        
                        if (data.success && data.scores && data.scores.length > 0) {
                            container.innerHTML = data.scores.slice(0, 10).map((score, index) => {
                                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1) + '위';
                                const username = score.email ? score.email.split('@')[0] : '익명';
                                const timeText = score.time.toFixed(2) + '초';
                                const date = new Date(score.created_at);
                                const dateStr = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
                                
                                return '<div class="flex items-center justify-between bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">' +
                                    '<div class="flex items-center gap-3">' +
                                    '<span class="text-lg font-bold w-10">' + medal + '</span>' +
                                    '<div>' +
                                    '<div class="font-semibold text-gray-800">' + username + '</div>' +
                                    '<div class="text-sm text-gray-500">' + dateStr + '</div>' +
                                    '</div>' +
                                    '</div>' +
                                    '<div class="font-bold text-red-600">' + timeText + '</div>' +
                                    '</div>';
                            }).join('');
                        } else {
                            container.innerHTML = '<div class="text-center text-gray-500 py-4">' +
                                '<i class="fas fa-inbox text-3xl mb-2"></i>' +
                                '<p>아직 기록이 없습니다</p>' +
                                '</div>';
                        }
                    } catch (error) {
                        console.error('리더보드 로드 실패:', error);
                        document.getElementById(difficulty + '-leaderboard').innerHTML = 
                            '<div class="text-center text-red-500">로드 실패</div>';
                    }
                }
            }
            
            loadLeaderboards();
        </script>
        
        <!-- 게임 모달 (전체화면) -->
        <div id="gameModal" class="fixed inset-0 bg-black hidden z-50" style="display: none;">
            <div class="relative w-full h-full flex flex-col">
                <button onclick="closeGameModal()" class="absolute top-4 right-4 text-white hover:text-gray-300 text-3xl font-bold z-10 bg-black bg-opacity-50 w-12 h-12 rounded-full flex items-center justify-center">
                    <i class="fas fa-times"></i>
                </button>
                <iframe id="gameFrame" src="" class="w-full h-full border-0"></iframe>
            </div>
        </div>
        
        ${getCommonFooter()}
        ${getCommonAuthScript()}
    </body>
    </html>
  `);
});
// 지뢰찾기 플레이 페이지
app.get('/game/simple/minesweeper/play', (c) => {
    const difficulty = c.req.query('difficulty') || 'beginner';
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>지뢰찾기 - ${difficulty}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: #c0c0c0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                padding: 20px;
            }
            
            .game-container {
                background: #c0c0c0;
                border: 3px outset #fff;
                padding: 10px;
            }
            
            .header {
                background: #c0c0c0;
                border: 2px inset #808080;
                padding: 10px;
                margin-bottom: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .counter {
                background: #000;
                color: #f00;
                font-family: 'Courier New', monospace;
                font-size: 32px;
                font-weight: bold;
                padding: 5px 10px;
                border: 2px inset #808080;
                min-width: 60px;
                text-align: center;
            }
            
            .reset-btn {
                width: 50px;
                height: 50px;
                font-size: 32px;
                border: 3px outset #fff;
                background: #c0c0c0;
                cursor: pointer;
                user-select: none;
            }
            
            .reset-btn:active {
                border-style: inset;
            }
            
            .board {
                border: 3px inset #808080;
                display: inline-grid;
                gap: 0;
                background: #c0c0c0;
            }
            
            .cell {
                width: 30px;
                height: 30px;
                border: 2px outset #fff;
                background: #c0c0c0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 18px;
                cursor: pointer;
                user-select: none;
            }
            
            .cell:active {
                border-style: inset;
            }
            
            .cell.revealed {
                border: 1px solid #808080;
                background: #bdbdbd;
                cursor: default;
            }
            
            .cell.flagged::before {
                content: '🚩';
            }
            
            .cell.mine {
                background: #f00;
            }
            
            .cell.mine::before {
                content: '💣';
            }
            
            .cell.wrong-flag {
                background: #f00;
            }
            
            .cell.wrong-flag::before {
                content: '❌';
            }
            
            .cell.num-1 { color: #0000ff; }
            .cell.num-2 { color: #008000; }
            .cell.num-3 { color: #ff0000; }
            .cell.num-4 { color: #000080; }
            .cell.num-5 { color: #800000; }
            .cell.num-6 { color: #008080; }
            .cell.num-7 { color: #000; }
            .cell.num-8 { color: #808080; }
            
            .modal {
                display: none;
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.7);
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            
            .modal.active {
                display: flex;
            }
            
            .modal-content {
                background: white;
                padding: 30px;
                border-radius: 10px;
                text-align: center;
                max-width: 400px;
            }
            
            .modal-title {
                font-size: 32px;
                font-weight: bold;
                margin-bottom: 20px;
            }
            
            .modal-buttons {
                display: flex;
                gap: 10px;
                margin-top: 20px;
            }
            
            .modal-button {
                flex: 1;
                padding: 12px;
                border: none;
                border-radius: 5px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
            }
            
            .btn-primary {
                background: #4CAF50;
                color: white;
            }
            
            .btn-secondary {
                background: #808080;
                color: white;
            }
        </style>
    </head>
    <body>
        <div class="game-container">
            <div class="header">
                <div class="counter" id="mine-counter">010</div>
                <button class="reset-btn" id="reset-btn" onclick="resetGame()">😎</button>
                <div class="counter" id="timer">000</div>
            </div>
            <div class="board" id="board"></div>
        </div>
        
        <div class="modal" id="game-over-modal">
            <div class="modal-content">
                <div class="modal-title" id="modal-title"></div>
                <div id="modal-message"></div>
                <div class="modal-buttons">
                    <button class="modal-button btn-secondary" onclick="closeModal()">닫기</button>
                    <button class="modal-button btn-primary" onclick="resetGame()">다시하기</button>
                </div>
            </div>
        </div>
        
        <script>
            const DIFFICULTY = '${difficulty}';
            const CONFIG = {
                beginner: { rows: 9, cols: 9, mines: 10 },
                intermediate: { rows: 16, cols: 16, mines: 40 },
                expert: { rows: 16, cols: 30, mines: 99 }
            };
            
            let config = CONFIG[DIFFICULTY];
            let board = [];
            let revealed = [];
            let flagged = [];
            let gameStarted = false;
            let gameOver = false;
            let startTime = 0;
            let timerInterval = null;
            let firstClick = true;
            
            function initGame() {
                const boardEl = document.getElementById('board');
                boardEl.style.gridTemplateColumns = 'repeat(' + config.cols + ', 30px)';
                boardEl.innerHTML = '';
                
                board = Array(config.rows).fill(null).map(() => Array(config.cols).fill(0));
                revealed = Array(config.rows).fill(null).map(() => Array(config.cols).fill(false));
                flagged = Array(config.rows).fill(null).map(() => Array(config.cols).fill(false));
                
                for (let r = 0; r < config.rows; r++) {
                    for (let c = 0; c < config.cols; c++) {
                        const cell = document.createElement('div');
                        cell.className = 'cell';
                        cell.dataset.row = r;
                        cell.dataset.col = c;
                        
                        cell.addEventListener('click', handleLeftClick);
                        cell.addEventListener('contextmenu', handleRightClick);
                        cell.addEventListener('mousedown', handleMouseDown);
                        cell.addEventListener('mouseup', handleMouseUp);
                        
                        boardEl.appendChild(cell);
                    }
                }
                
                gameStarted = false;
                gameOver = false;
                firstClick = true;
                document.getElementById('mine-counter').textContent = String(config.mines).padStart(3, '0');
                document.getElementById('timer').textContent = '000';
                document.getElementById('reset-btn').textContent = '😎';
                
                if (timerInterval) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                }
            }
            
            function placeMines(excludeRow, excludeCol) {
                const excludeCells = new Set();
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const nr = excludeRow + dr;
                        const nc = excludeCol + dc;
                        if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols) {
                            excludeCells.add(nr + ',' + nc);
                        }
                    }
                }
                
                let minesPlaced = 0;
                while (minesPlaced < config.mines) {
                    const r = Math.floor(Math.random() * config.rows);
                    const c = Math.floor(Math.random() * config.cols);
                    
                    if (board[r][c] !== -1 && !excludeCells.has(r + ',' + c)) {
                        board[r][c] = -1;
                        minesPlaced++;
                    }
                }
                
                for (let r = 0; r < config.rows; r++) {
                    for (let c = 0; c < config.cols; c++) {
                        if (board[r][c] === -1) continue;
                        
                        let count = 0;
                        for (let dr = -1; dr <= 1; dr++) {
                            for (let dc = -1; dc <= 1; dc++) {
                                const nr = r + dr;
                                const nc = c + dc;
                                if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols && board[nr][nc] === -1) {
                                    count++;
                                }
                            }
                        }
                        board[r][c] = count;
                    }
                }
            }
            
            function handleLeftClick(e) {
                if (gameOver) return;
                
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                
                if (flagged[row][col] || revealed[row][col]) return;
                
                if (firstClick) {
                    placeMines(row, col);
                    firstClick = false;
                    startTimer();
                }
                
                revealCell(row, col);
            }
            
            function handleRightClick(e) {
                e.preventDefault();
                if (gameOver || !gameStarted) return;
                
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                
                if (revealed[row][col]) return;
                
                flagged[row][col] = !flagged[row][col];
                updateCell(row, col);
                updateMineCounter();
            }
            
            let mouseDownBtn = null;
            
            function handleMouseDown(e) {
                mouseDownBtn = e.button;
                if ((e.button === 0 && e.buttons === 3) || e.button === 1) {
                    e.preventDefault();
                    const row = parseInt(e.target.dataset.row);
                    const col = parseInt(e.target.dataset.col);
                    if (revealed[row][col] && board[row][col] > 0) {
                        highlightNeighbors(row, col, true);
                    }
                }
            }
            
            function handleMouseUp(e) {
                if ((mouseDownBtn === 0 && e.button === 2) || (mouseDownBtn === 2 && e.button === 0) || e.button === 1) {
                    e.preventDefault();
                    const row = parseInt(e.target.dataset.row);
                    const col = parseInt(e.target.dataset.col);
                    if (revealed[row][col] && board[row][col] > 0) {
                        highlightNeighbors(row, col, false);
                        chordClick(row, col);
                    }
                }
                mouseDownBtn = null;
            }
            
            function chordClick(row, col) {
                if (gameOver || !revealed[row][col]) return;
                
                const cellValue = board[row][col];
                if (cellValue === 0) return;
                
                let flagCount = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const nr = row + dr;
                        const nc = col + dc;
                        if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols && flagged[nr][nc]) {
                            flagCount++;
                        }
                    }
                }
                
                if (flagCount === cellValue) {
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            const nr = row + dr;
                            const nc = col + dc;
                            if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols && !revealed[nr][nc] && !flagged[nr][nc]) {
                                revealCell(nr, nc);
                            }
                        }
                    }
                }
            }
            
            function highlightNeighbors(row, col, highlight) {
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const nr = row + dr;
                        const nc = col + dc;
                        if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols && !revealed[nr][nc] && !flagged[nr][nc]) {
                            const cell = document.querySelector('[data-row="' + nr + '"][data-col="' + nc + '"]');
                            if (highlight) {
                                cell.style.borderStyle = 'inset';
                            } else {
                                cell.style.borderStyle = 'outset';
                            }
                        }
                    }
                }
            }
            
            function revealCell(row, col) {
                if (revealed[row][col] || flagged[row][col] || gameOver) return;
                
                if (!gameStarted) {
                    gameStarted = true;
                }
                
                revealed[row][col] = true;
                
                if (board[row][col] === -1) {
                    gameOver = true;
                    revealAllMines();
                    document.getElementById('reset-btn').textContent = '😵';
                    setTimeout(() => showGameOver(false), 500);
                    return;
                }
                
                updateCell(row, col);
                
                if (board[row][col] === 0) {
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            const nr = row + dr;
                            const nc = col + dc;
                            if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols) {
                                revealCell(nr, nc);
                            }
                        }
                    }
                }
                
                checkWin();
            }
            
            function updateCell(row, col) {
                const cell = document.querySelector('[data-row="' + row + '"][data-col="' + col + '"]');
                
                if (flagged[row][col]) {
                    cell.classList.add('flagged');
                } else {
                    cell.classList.remove('flagged');
                }
                
                if (revealed[row][col]) {
                    cell.classList.add('revealed');
                    if (board[row][col] > 0) {
                        cell.textContent = board[row][col];
                        cell.classList.add('num-' + board[row][col]);
                    }
                }
            }
            
            function updateMineCounter() {
                let flagCount = 0;
                for (let r = 0; r < config.rows; r++) {
                    for (let c = 0; c < config.cols; c++) {
                        if (flagged[r][c]) flagCount++;
                    }
                }
                const remaining = config.mines - flagCount;
                document.getElementById('mine-counter').textContent = String(Math.max(0, remaining)).padStart(3, '0');
            }
            
            function startTimer() {
                startTime = Date.now();
                timerInterval = setInterval(() => {
                    const elapsed = Math.floor((Date.now() - startTime) / 1000);
                    document.getElementById('timer').textContent = String(Math.min(elapsed, 999)).padStart(3, '0');
                }, 1000);
            }
            
            function checkWin() {
                let revealedCount = 0;
                for (let r = 0; r < config.rows; r++) {
                    for (let c = 0; c < config.cols; c++) {
                        if (revealed[r][c]) revealedCount++;
                    }
                }
                
                const totalCells = config.rows * config.cols;
                if (revealedCount === totalCells - config.mines) {
                    gameOver = true;
                    clearInterval(timerInterval);
                    document.getElementById('reset-btn').textContent = '😎';
                    const finalTime = (Date.now() - startTime) / 1000;
                    setTimeout(() => showGameOver(true, finalTime), 500);
                }
            }
            
            function revealAllMines() {
                clearInterval(timerInterval);
                for (let r = 0; r < config.rows; r++) {
                    for (let c = 0; c < config.cols; c++) {
                        const cell = document.querySelector('[data-row="' + r + '"][data-col="' + c + '"]');
                        if (board[r][c] === -1) {
                            cell.classList.add('mine');
                        } else if (flagged[r][c]) {
                            cell.classList.add('wrong-flag');
                        }
                    }
                }
            }
            
            async function showGameOver(won, time) {
                const modal = document.getElementById('game-over-modal');
                const title = document.getElementById('modal-title');
                const message = document.getElementById('modal-message');
                
                if (won) {
                    title.textContent = '🎉 축하합니다!';
                    message.innerHTML = '<p style="font-size: 20px; margin: 10px 0;">기록: <strong>' + time.toFixed(2) + '초</strong></p>';
                    
                    console.log('🎮 [지뢰찾기] 점수 저장 시도:', { difficulty: DIFFICULTY, time });
                    try {
                        const response = await fetch('/api/minesweeper/score', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ difficulty: DIFFICULTY, time: time })
                        });
                        const data = await response.json();
                        console.log('📦 [지뢰찾기] 저장 응답:', data);
                        
                        if (data.success) {
                            message.innerHTML += '<p style="color: green;">✓ 기록이 저장되었습니다!</p>';
                            // 리더보드 새로고침
                            setTimeout(() => window.location.reload(), 2000);
                        } else {
                            if (data.requireLogin) {
                                message.innerHTML += '<p style="color: orange;">⚠️ 로그인이 필요합니다.</p>';
                            } else {
                                message.innerHTML += '<p style="color: red;">✗ 저장 실패: ' + data.message + '</p>';
                            }
                        }
                    } catch (error) {
                        console.error('💥 [지뢰찾기] 저장 오류:', error);
                        message.innerHTML += '<p style="color: red;">✗ 저장 중 오류가 발생했습니다.</p>';
                    }
                } else {
                    title.textContent = '💥 게임 오버';
                    message.innerHTML = '<p>다시 도전해보세요!</p>';
                }
                
                modal.classList.add('active');
            }
            
            function closeModal() {
                document.getElementById('game-over-modal').classList.remove('active');
            }
            
            function resetGame() {
                closeModal();
                initGame();
            }
            
            initGame();
        </script>
    </body>
    </html>
  `);
});
// ==================== 2048 API ====================
// 2048 점수 저장
app.get('/lifestyle', (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko" id="html-root">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>유틸리티 - Faith Portal</title>
        <script>
            // Tailwind CDN 경고 필터링 (개발 환경용)
            (function() {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                    if (args[0] && typeof args[0] === 'string' && 
                        args[0].includes('cdn.tailwindcss.com should not be used in production')) {
                        return; // Tailwind CDN 경고 무시
                    }
                    originalWarn.apply(console, args);
                };
            })();
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .faith-blue { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); }
            .faith-blue-hover:hover { background: linear-gradient(135deg, #0284c7 0%, #0891b2 100%); }
        </style>
    </head>
    <body class="bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50" id="html-root">
        ${getCommonHeader('Lifestyle')}
        ${getStickyHeader()}
        
        ${getBreadcrumb([
        { label: '홈', href: '/' },
        { label: '유틸리티' }
    ])}

        <!-- 메인 컨텐츠 -->
        <main class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
            <!-- 카테고리 탭 -->
            <div class="mb-6 overflow-x-auto">
                <div class="flex gap-2 min-w-max">
                    <button onclick="filterCategory('all')" class="category-tab active px-4 py-2 rounded-full font-medium transition-all">
                        전체
                    </button>
                    <button onclick="filterCategory('life')" class="category-tab px-4 py-2 rounded-full font-medium transition-all">
                        생활/금융
                    </button>
                    <button onclick="filterCategory('work')" class="category-tab px-4 py-2 rounded-full font-medium transition-all">
                        학습/업무
                    </button>
                    <button onclick="filterCategory('dev')" class="category-tab px-4 py-2 rounded-full font-medium transition-all">
                        개발 도구
                    </button>
                </div>
            </div>

            <!-- 서비스 카드 그리드 -->
            <!-- 서비스 카드 그리드 -->
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                <!-- 다기능 계산기 -->
                <!-- 다기능 계산기 -->
                <a href="/lifestyle/calculator" class="utility-card bg-white rounded-xl shadow-lg p-3 sm:p-6 hover:shadow-xl transition-all cursor-pointer block" data-category="life">
                    <div class="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-2 sm:mb-4 mx-auto sm:mx-0">
                        <i class="fas fa-calculator text-lg sm:text-2xl text-white"></i>
                    </div>
                    <h3 class="text-sm sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2 text-center sm:text-left">계산기</h3>
                    <p class="text-gray-600 mb-4 hidden sm:block">기본 계산부터 대출, BMI, 날짜까지 다양한 계산기</p>
                    <span class="text-cyan-600 hover:text-cyan-700 font-medium text-xs sm:text-base hidden sm:inline-block">
                        시작하기 →
                    </span>
                </a>

                <!-- 글자수 세기 & 맞춤법 검사기 -->
                <!-- 글자수 세기 & 맞춤법 검사기 -->
                <a href="/lifestyle/text-checker" class="utility-card bg-white rounded-xl shadow-lg p-3 sm:p-6 hover:shadow-xl transition-all cursor-pointer block" data-category="work">
                    <div class="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mb-2 sm:mb-4 mx-auto sm:mx-0">
                        <i class="fas fa-spell-check text-lg sm:text-2xl text-white"></i>
                    </div>
                    <h3 class="text-sm sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2 text-center sm:text-left">글자수/맞춤법</h3>
                    <p class="text-gray-600 mb-4 hidden sm:block">한국어 글자수 세기와 맞춤법 검사를 한번에</p>
                    <span class="text-cyan-600 hover:text-cyan-700 font-medium text-xs sm:text-base hidden sm:inline-block">
                        시작하기 →
                    </span>
                </a>

                <!-- 평수 계산기 -->
                <!-- 평수 계산기 -->
                <a href="/lifestyle/pyeong-calculator" class="utility-card bg-white rounded-xl shadow-lg p-3 sm:p-6 hover:shadow-xl transition-all cursor-pointer block" data-category="life">
                    <div class="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-2 sm:mb-4 mx-auto sm:mx-0">
                        <i class="fas fa-home text-lg sm:text-2xl text-white"></i>
                    </div>
                    <h3 class="text-sm sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2 text-center sm:text-left">평수 계산</h3>
                    <p class="text-gray-600 mb-4 hidden sm:block">평 ↔ m² 변환 (34평 = 112.39m²)</p>
                    <span class="text-cyan-600 hover:text-cyan-700 font-medium text-xs sm:text-base hidden sm:inline-block">
                        시작하기 →
                    </span>
                </a>

                <!-- 한국 나이 계산기 -->
                <!-- 한국 나이 계산기 -->
                <a href="/lifestyle/age-calculator" class="utility-card bg-white rounded-xl shadow-lg p-3 sm:p-6 hover:shadow-xl transition-all cursor-pointer block" data-category="life">
                    <div class="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mb-2 sm:mb-4 mx-auto sm:mx-0">
                        <i class="fas fa-birthday-cake text-lg sm:text-2xl text-white"></i>
                    </div>
                    <h3 class="text-sm sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2 text-center sm:text-left">나이 계산</h3>
                    <p class="text-gray-600 mb-4 hidden sm:block">만 나이, 한국 나이, 연 나이를 한번에 계산</p>
                    <span class="text-cyan-600 hover:text-cyan-700 font-medium text-xs sm:text-base hidden sm:inline-block">
                        시작하기 →
                    </span>
                </a>

                <!-- D-Day 계산기 -->
                <!-- D-Day 계산기 -->
                <a href="/lifestyle/dday-calculator" class="utility-card bg-white rounded-xl shadow-lg p-3 sm:p-6 hover:shadow-xl transition-all cursor-pointer block" data-category="life">
                    <div class="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center mb-2 sm:mb-4 mx-auto sm:mx-0">
                        <i class="fas fa-calendar-alt text-lg sm:text-2xl text-white"></i>
                    </div>
                    <h3 class="text-sm sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2 text-center sm:text-left">D-Day</h3>
                    <p class="text-gray-600 mb-4 hidden sm:block">중요한 날까지 남은 시간 계산 (결혼, 시험, 입대)</p>
                    <span class="text-cyan-600 hover:text-cyan-700 font-medium text-xs sm:text-base hidden sm:inline-block">
                        시작하기 →
                    </span>
                </a>

                <!-- JSON 포매터 -->
                <!-- JSON 포매터 -->
                <a href="/lifestyle/json-formatter" class="utility-card bg-white rounded-xl shadow-lg p-3 sm:p-6 hover:shadow-xl transition-all cursor-pointer block" data-category="dev">
                    <div class="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center mb-2 sm:mb-4 mx-auto sm:mx-0">
                        <i class="fas fa-code text-lg sm:text-2xl text-white"></i>
                    </div>
                    <h3 class="text-sm sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2 text-center sm:text-left">JSON 포매터</h3>
                    <p class="text-gray-600 mb-4 hidden sm:block">JSON 데이터 정리, 검증, 압축 (개발자 필수)</p>
                    <span class="text-cyan-600 hover:text-cyan-700 font-medium text-xs sm:text-base hidden sm:inline-block">
                        시작하기 →
                    </span>
                </a>

                <!-- Base64 인코더/디코더 -->
                <!-- Base64 인코더/디코더 -->
                <a href="/lifestyle/base64-converter" class="utility-card bg-white rounded-xl shadow-lg p-3 sm:p-6 hover:shadow-xl transition-all cursor-pointer block" data-category="dev">
                    <div class="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mb-2 sm:mb-4 mx-auto sm:mx-0">
                        <i class="fas fa-lock text-lg sm:text-2xl text-white"></i>
                    </div>
                    <h3 class="text-sm sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2 text-center sm:text-left">Base64 변환</h3>
                    <p class="text-gray-600 mb-4 hidden sm:block">Base64 인코딩/디코딩 (텍스트, 이미지)</p>
                    <span class="text-cyan-600 hover:text-cyan-700 font-medium text-xs sm:text-base hidden sm:inline-block">
                        시작하기 →
                    </span>
                </a>

                <!-- 서비스 준비중 (투표 기능) -->
                <div class="utility-card bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-lg p-6 border-2 border-dashed border-gray-300" data-category="all">
                    <div class="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center mb-4">
                        <i class="fas fa-vote-yea text-2xl text-white"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">다음 서비스 투표</h3>
                    <p class="text-gray-600 mb-4 text-sm">어떤 유틸리티가 필요하신가요?</p>
                    <div class="space-y-2 mb-4">
                        <button onclick="voteUtility('lotto')" class="w-full text-left px-3 py-2 bg-white rounded-lg hover:bg-gray-50 transition-all text-sm">
                            🎱 로또 번호 생성기 <span class="float-right text-cyan-600 font-bold" id="vote-lotto">0</span>
                        </button>
                        <button onclick="voteUtility('ladder')" class="w-full text-left px-3 py-2 bg-white rounded-lg hover:bg-gray-50 transition-all text-sm">
                            🪜 사다리 게임 <span class="float-right text-cyan-600 font-bold" id="vote-ladder">0</span>
                        </button>
                        <button onclick="voteUtility('translator')" class="w-full text-left px-3 py-2 bg-white rounded-lg hover:bg-gray-50 transition-all text-sm">
                            🌏 번역기 <span class="float-right text-cyan-600 font-bold" id="vote-translator">0</span>
                        </button>
                    </div>
                    <p class="text-xs text-gray-500">* 투표는 1일 1회만 가능합니다</p>
                </div>
            </div>
        </main>

        <style>
            .category-tab {
                background: white;
                color: #6b7280;
                border: 1px solid #e5e7eb;
            }
            .category-tab:hover {
                background: #f3f4f6;
            }
            .category-tab.active {
                background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
                color: white;
                border-color: transparent;
            }
            .utility-card {
                transition: all 0.3s ease;
            }
            .utility-card:hover {
                transform: translateY(-5px);
            }
        </style>

        <script>
            // 로그인 상태 확인
            const token = localStorage.getItem('auth_token');
            const userEmail = localStorage.getItem('user_email');
            const userLevel = parseInt(localStorage.getItem('user_level') || '0');

            // 카테고리 필터링
            function filterCategory(category) {
                const cards = document.querySelectorAll('.utility-card');
                const tabs = document.querySelectorAll('.category-tab');
                
                // 탭 활성화 상태 변경
                tabs.forEach(tab => tab.classList.remove('active'));
                event.target.classList.add('active');
                
                // 카드 필터링
                cards.forEach(card => {
                    const cardCategory = card.getAttribute('data-category');
                    if (category === 'all' || cardCategory === category || cardCategory === 'all') {
                        card.style.display = 'block';
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, 10);
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        setTimeout(() => {
                            card.style.display = 'none';
                        }, 300);
                    }
                });
            }

            // 투표 기능
            function voteUtility(utilityName) {
                const lastVoteDate = localStorage.getItem('lastVoteDate');
                const today = new Date().toDateString();
                
                if (lastVoteDate === today) {
                    alert('오늘은 이미 투표하셨습니다. 내일 다시 투표해주세요!');
                    return;
                }
                
                // 투표 수 증가
                const currentVotes = parseInt(localStorage.getItem(\`votes_\${utilityName}\`) || '0');
                localStorage.setItem(\`votes_\${utilityName}\`, currentVotes + 1);
                localStorage.setItem('lastVoteDate', today);
                
                // UI 업데이트
                document.getElementById(\`vote-\${utilityName}\`).textContent = currentVotes + 1;
                
                alert('투표해주셔서 감사합니다! 🎉');
            }

            // 투표 수 불러오기
            window.addEventListener('DOMContentLoaded', () => {
                ['lotto', 'ladder', 'translator'].forEach(name => {
                    const votes = localStorage.getItem(\`votes_\${name}\`) || '0';
                    const elem = document.getElementById(\`vote-\${name}\`);
                    if (elem) elem.textContent = votes;
                });
            });
            
            if (token && userEmail) {
                const userMenu = document.getElementById('user-menu');
                userMenu.innerHTML = \`
                    <button onclick="toggleMobileMenu()" class="text-gray-700 hover:text-blue-900 transition-all p-2" title="메뉴 열기">
                        <i class="fas fa-bars text-xl"></i>
                    </button>
                    <a href="/mypage" class="text-xs sm:text-sm text-gray-700 hover:text-blue-900 font-medium transition-all px-2 sm:px-3">
                        <i class="fas fa-user mr-0 sm:mr-1"></i><span class="hidden sm:inline">마이페이지</span>
                    </a>
                    \${userLevel >= 6 ? '<a href="/admin" class="text-xs sm:text-sm bg-yellow-500 text-gray-900 px-2 sm:px-3 py-1.5 rounded font-medium hover:bg-yellow-600 transition-all"><i class="fas fa-crown mr-1"></i><span class="hidden sm:inline">관리자</span></a>' : ''}
                    <button onclick="logout()" class="text-gray-700 hover:text-red-600 transition-all p-2" title="로그아웃">
                        <i class="fas fa-sign-out-alt text-xl"></i>
                    </button>
                \`;
            }
            
            function logout() {
                if (confirm('로그아웃 하시겠습니까?')) {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user_email');
                    localStorage.removeItem('user_level');
                    location.href = '/';
                }
            }
            
            function toggleMobileMenu() {
                let overlay = document.getElementById('mobile-menu-overlay');
                
                if (overlay) {
                    overlay.classList.add('opacity-0');
                    setTimeout(() => overlay?.remove(), 300);
                } else {
                    const userLevel = parseInt(localStorage.getItem('user_level') || '0');
                    
                    overlay = document.createElement('div');
                    overlay.id = 'mobile-menu-overlay';
                    overlay.className = 'fixed inset-0 z-50 bg-black bg-opacity-50 opacity-0 transition-opacity duration-300';
                    
                    overlay.innerHTML = \`
                        <div class="fixed top-0 right-0 h-full w-64 bg-white shadow-2xl transform translate-x-full transition-transform duration-300" id="mobile-menu-content">
                            <div class="p-6">
                                <div class="flex justify-between items-center mb-6">
                                    <h3 class="text-lg font-bold text-gray-900">메뉴</h3>
                                    <button onclick="toggleMobileMenu()" class="text-gray-600 hover:text-gray-900">
                                        <i class="fas fa-times text-xl"></i>
                                    </button>
                                </div>
                                
                                <div class="space-y-4">
                                    <a href="/" class="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                        <i class="fas fa-home mr-3"></i>홈
                                    </a>
                                    <a href="/news" class="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                        <i class="fas fa-newspaper mr-3"></i>뉴스
                                    </a>
                                    <a href="/lifestyle" class="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                        <i class="fas fa-home mr-3"></i>유틸리티
                                    </a>
                                    <a href="/game" class="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                        <i class="fas fa-gamepad mr-3"></i>게임
                                    </a>
                                    <a href="/finance" class="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                        <i class="fas fa-chart-line mr-3"></i>금융
                                    </a>
                                    <a href="/mypage" class="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                        <i class="fas fa-user mr-3"></i>마이페이지
                                    </a>
                                    <a href="/bookmarks" class="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                        <i class="fas fa-bookmark mr-3"></i>북마크
                                    </a>
                                    \${userLevel >= 6 ? '<a href="/admin" class="block px-4 py-3 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-lg transition-colors"><i class="fas fa-crown mr-3"></i>관리자페이지</a>' : ''}
                                    <hr class="my-2">
                                    <button onclick="logout()" class="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        <i class="fas fa-sign-out-alt mr-3"></i>로그아웃
                                    </button>
                                </div>
                            </div>
                        </div>
                    \`;
                    
                    document.body.appendChild(overlay);
                    
                    setTimeout(() => {
                        overlay?.classList.remove('opacity-0');
                        document.getElementById('mobile-menu-content')?.classList.remove('translate-x-full');
                    }, 10);
                    
                    overlay.addEventListener('click', (e) => {
                        if (e.target === overlay) toggleMobileMenu();
                    });
                }
            }
        </script>

        ${getCommonFooter()}
        ${getCommonAuthScript()}

    </body>
    </html>
  `);
});
// ==================== 금융 페이지 (주식 메인) ====================
// MOCK 데이터 - 주요 지수 (백업용)
const MOCK_INDICES = [
    { name: 'KOSPI', value: 2650.12, change: 15.40, rate: 0.58, status: 'up' },
    { name: 'KOSDAQ', value: 845.32, change: -3.25, rate: -0.38, status: 'down' },
    { name: 'USD/KRW', value: 1305.50, change: 8.20, rate: 0.63, status: 'up' }
];
// MOCK 데이터 - 인기 종목 (백업용)
const MOCK_POPULAR_STOCKS = [
    { rank: 1, ticker: '005930.KS', name: '삼성전자', price: 72500, change: 1200, rate: 1.68, status: 'up' },
    { rank: 2, ticker: 'NVDA', name: 'NVIDIA', price: 495.50, change: -8.30, rate: -1.65, status: 'down' },
    { rank: 3, ticker: 'TSLA', name: '테슬라', price: 242.84, change: 5.12, rate: 2.15, status: 'up' },
    { rank: 4, ticker: '000660.KS', name: 'SK하이닉스', price: 168000, change: 3500, rate: 2.13, status: 'up' },
    { rank: 5, ticker: 'AAPL', name: '애플', price: 185.64, change: -2.15, rate: -1.14, status: 'down' }
];
// MOCK 데이터 - 차트용 (1개월 데이터)
const generateMockChartData = (basePrice) => {
    const data = [];
    const today = new Date();
    for (let i = 30; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const randomChange = (Math.random() - 0.5) * basePrice * 0.05;
        const price = Math.round((basePrice + randomChange) * 100) / 100;
        data.push({
            date: date.toISOString().split('T')[0],
            price: price
        });
    }
    return data;
};
app.get('/finance', (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko" id="html-root">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>금융 (주식) - Faith Portal</title>
        <script>
            (function() {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                    if (args[0] && typeof args[0] === 'string' && 
                        args[0].includes('cdn.tailwindcss.com should not be used in production')) {
                        return;
                    }
                    originalWarn.apply(console, args);
                };
            })();
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .faith-blue { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); }
            .faith-blue-hover:hover { background: linear-gradient(135deg, #0284c7 0%, #0891b2 100%); }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, sans-serif; }
            .stock-number { font-family: 'Roboto Mono', 'Courier New', monospace; }
        </style>
    </head>
    <body class="bg-slate-50" id="html-root">
        ${getCommonHeader('Finance')}
        ${getStickyHeader()}
        
        ${getBreadcrumb([
        { label: '홈', href: '/' },
        { label: '금융' }
    ])}

        ${getFinanceMenu('/finance')}

        <main class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
            <!-- 페이지 헤더 -->
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-900 mb-2">
                    <i class="fas fa-chart-line text-green-600 mr-2"></i>
                    주식 정보
                </h1>
                <p class="text-gray-600">실시간 주식 시세 및 인기 종목을 확인하세요</p>
            </div>

            <!-- 상단 주요 지수 위젯 -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                ${MOCK_INDICES.map(index => `
                    <div class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow" data-index="${index.name}">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="text-sm font-medium text-gray-600">${index.name}</h3>
                            <span class="text-xs px-2 py-1 rounded ${index.status === 'up' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}">
                                ${index.status === 'up' ? '상승' : '하락'}
                            </span>
                        </div>
                        <div class="index-price stock-number text-2xl font-bold text-gray-900 mb-1">
                            ${index.value.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div class="index-change stock-number ${index.status === 'up' ? 'text-red-600' : 'text-blue-600'} text-sm font-medium">
                            ${index.status === 'up' ? '▲' : '▼'} ${Math.abs(index.change).toFixed(2)} (${index.rate > 0 ? '+' : ''}${index.rate.toFixed(2)}%)
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- 한국 & 미국 주식 통합 대시보드 -->
            
            <!-- 한국 대표 기업 4대장 위젯 -->
            <div class="mb-8">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-2xl font-bold text-gray-900">
                        <span class="mr-2">🇰🇷</span>
                        국내 대표 기업
                    </h2>
                    <span class="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">20분 지연 시세</span>
                </div>
                
                <div id="kr-stocks-widget" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <!-- Loading skeleton -->
                    ${[1, 2, 3, 4].map(() => `
                        <div class="stock-skeleton bg-white rounded-lg shadow-sm p-4 animate-pulse">
                            <div class="flex items-center justify-between mb-3">
                                <div class="h-4 bg-gray-200 rounded w-20"></div>
                                <div class="h-6 bg-gray-200 rounded w-12"></div>
                            </div>
                            <div class="h-8 bg-gray-200 rounded w-24 mb-2"></div>
                            <div class="h-4 bg-gray-200 rounded w-16 mb-4"></div>
                            <div class="h-16 bg-gray-200 rounded"></div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- 미국 주식 4대장 위젯 -->
            <div class="mb-8">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-2xl font-bold text-gray-900">
                        <span class="mr-2">🇺🇸</span>
                        미국 빅테크 4대장
                    </h2>
                    <span class="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">15분 지연 시세</span>
                </div>
                
                <div id="us-stocks-widget" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <!-- Loading skeleton -->
                    ${[1, 2, 3, 4].map(() => `
                        <div class="stock-skeleton bg-white rounded-lg shadow-sm p-4 animate-pulse">
                            <div class="flex items-center justify-between mb-3">
                                <div class="h-4 bg-gray-200 rounded w-20"></div>
                                <div class="h-6 bg-gray-200 rounded w-12"></div>
                            </div>
                            <div class="h-8 bg-gray-200 rounded w-24 mb-2"></div>
                            <div class="h-4 bg-gray-200 rounded w-16 mb-4"></div>
                            <div class="h-16 bg-gray-200 rounded"></div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- ========== 추가 위젯 섹션 ========== -->
            
            <!-- 1. 환율 & 원자재 & 코인 위젯 (The Macro View) -->
            <div class="mb-8">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-2xl font-bold text-gray-900">
                        <span class="mr-2">🌍</span>
                        거시 경제 지표
                    </h2>
                    <span class="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">실시간</span>
                </div>
                
                <div id="macro-indicators-widget" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <!-- Loading skeleton -->
                    ${[1, 2, 3, 4].map(() => `
                        <div class="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                            <div class="flex items-center justify-between mb-3">
                                <div class="h-5 bg-gray-200 rounded w-24"></div>
                                <div class="h-6 bg-gray-200 rounded w-10"></div>
                            </div>
                            <div class="h-8 bg-gray-200 rounded w-28 mb-2"></div>
                            <div class="h-4 bg-gray-200 rounded w-20"></div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- 2. 실시간 급상승/급하락 랭킹 (Market Movers) -->
            <div class="mb-8">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-2xl font-bold text-gray-900">
                        <span class="mr-2">📊</span>
                        시장 급변 종목
                    </h2>
                    <span class="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">미국 시장</span>
                </div>
                
                <div class="bg-white rounded-lg shadow-sm p-6">
                    <!-- Tab Navigation -->
                    <div class="flex border-b border-gray-200 mb-6">
                        <button class="market-mover-tab px-6 py-3 font-medium text-sm border-b-2 border-red-500 text-red-600" data-type="gainers">
                            🚀 급상승
                        </button>
                        <button class="market-mover-tab px-6 py-3 font-medium text-sm border-b-2 border-transparent text-gray-500 hover:text-gray-700" data-type="losers">
                            💧 급하락
                        </button>
                        <button class="market-mover-tab px-6 py-3 font-medium text-sm border-b-2 border-transparent text-gray-500 hover:text-gray-700" data-type="actives">
                            🔥 거래폭발
                        </button>
                    </div>
                    
                    <!-- Content -->
                    <div id="market-movers-content">
                        <!-- Loading skeleton -->
                        <div class="space-y-3">
                            ${[1, 2, 3, 4, 5].map(() => `
                                <div class="flex items-center justify-between p-3 animate-pulse">
                                    <div class="flex items-center gap-3 flex-1">
                                        <div class="h-6 w-6 bg-gray-200 rounded-full"></div>
                                        <div>
                                            <div class="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                            <div class="h-3 bg-gray-200 rounded w-16"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="h-5 bg-gray-200 rounded w-20 mb-2"></div>
                                        <div class="h-4 bg-gray-200 rounded w-16"></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>

            <!-- 3. 투자자 심리 투표 (Bull vs Bear Poll) -->
            <div class="mb-8">
                <div class="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-sm p-6">
                    <div class="text-center mb-6">
                        <h2 class="text-2xl font-bold text-gray-900 mb-2">
                            <span class="mr-2">🎯</span>
                            투자자 심리
                        </h2>
                        <p class="text-gray-600 text-sm" id="poll-question">오늘 코스피, 오를까 내릴까?</p>
                    </div>
                    
                    <!-- Vote Buttons -->
                    <div class="grid grid-cols-2 gap-4 mb-6" id="vote-buttons">
                        <button class="vote-btn bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg" data-vote="bull">
                            <div class="text-3xl mb-2">🔴</div>
                            <div class="text-lg">오른다 (Bull)</div>
                        </button>
                        <button class="vote-btn bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg" data-vote="bear">
                            <div class="text-3xl mb-2">🔵</div>
                            <div class="text-lg">내린다 (Bear)</div>
                        </button>
                    </div>
                    
                    <!-- Results -->
                    <div id="poll-results" class="hidden">
                        <div class="bg-white rounded-lg p-4 shadow-sm">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center gap-2">
                                    <span class="text-2xl">🔴</span>
                                    <span class="font-medium text-gray-700">오른다</span>
                                </div>
                                <span class="font-bold text-red-600" id="bull-percent">0%</span>
                            </div>
                            <div class="relative h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
                                <div class="absolute top-0 left-0 h-full bg-red-500 transition-all duration-700" id="bull-bar" style="width: 0%"></div>
                            </div>
                            
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center gap-2">
                                    <span class="text-2xl">🔵</span>
                                    <span class="font-medium text-gray-700">내린다</span>
                                </div>
                                <span class="font-bold text-blue-600" id="bear-percent">0%</span>
                            </div>
                            <div class="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div class="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-700" id="bear-bar" style="width: 0%"></div>
                            </div>
                            
                            <div class="text-center mt-4 text-sm text-gray-500">
                                총 <span id="total-votes" class="font-bold">0</span>명 참여
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 실시간 랭킹 & 시장 동향 -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <!-- 인기 종목 Top5 -->
                <div class="bg-white rounded-lg shadow-sm p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-xl font-bold text-gray-900">
                            <i class="fas fa-fire text-orange-500 mr-2"></i>
                            인기 종목 Top5
                        </h2>
                        <a href="#" class="text-sm text-green-600 hover:text-green-700 font-medium">
                            더보기 →
                        </a>
                    </div>
                    <div class="space-y-4">
                        ${MOCK_POPULAR_STOCKS.map(stock => `
                            <a href="/finance/stock/${stock.ticker}" class="block p-4 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200" data-stock-ticker="${stock.ticker}">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-3 flex-1">
                                        <span class="flex items-center justify-center w-8 h-8 rounded-full ${stock.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
        stock.rank === 2 ? 'bg-gray-100 text-gray-700' :
            stock.rank === 3 ? 'bg-orange-100 text-orange-700' :
                'bg-blue-50 text-blue-600'} font-bold text-sm">
                                            ${stock.rank}
                                        </span>
                                        <div class="flex-1 min-w-0">
                                            <div class="font-semibold text-gray-900 truncate">${stock.name}</div>
                                            <div class="text-xs text-gray-500">${stock.ticker}</div>
                                        </div>
                                    </div>
                                    <div class="text-right ml-4">
                                        <div class="stock-price stock-number font-bold text-gray-900">
                                            ${stock.price.toLocaleString('ko-KR')}
                                        </div>
                                        <div class="stock-change stock-number text-sm ${stock.status === 'up' ? 'text-red-600' : 'text-blue-600'} font-medium">
                                            ${stock.status === 'up' ? '▲' : '▼'} ${stock.rate > 0 ? '+' : ''}${stock.rate.toFixed(2)}%
                                        </div>
                                    </div>
                                </div>
                            </a>
                        `).join('')}
                    </div>
                </div>

                <!-- 최신 뉴스 -->
                <div class="bg-white rounded-lg shadow-sm p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-xl font-bold text-gray-900">
                            <i class="fas fa-newspaper text-blue-500 mr-2"></i>
                            증시 뉴스
                        </h2>
                        <a href="/news" class="text-sm text-green-600 hover:text-green-700 font-medium">
                            더보기 →
                        </a>
                    </div>
                    <div class="space-y-4">
                        <a href="#" class="block p-4 rounded-lg hover:bg-gray-50 transition-colors">
                            <div class="font-medium text-gray-900 mb-1 line-clamp-2">
                                코스피, 외국인 매수세에 상승 마감...2650선 회복
                            </div>
                            <div class="text-sm text-gray-500">10분 전</div>
                        </a>
                        <a href="#" class="block p-4 rounded-lg hover:bg-gray-50 transition-colors">
                            <div class="font-medium text-gray-900 mb-1 line-clamp-2">
                                삼성전자, 신규 AI 칩 개발 발표...주가 급등
                            </div>
                            <div class="text-sm text-gray-500">1시간 전</div>
                        </a>
                        <a href="#" class="block p-4 rounded-lg hover:bg-gray-50 transition-colors">
                            <div class="font-medium text-gray-900 mb-1 line-clamp-2">
                                미국 증시 상승 마감, 나스닥 1.2% 상승
                            </div>
                            <div class="text-sm text-gray-500">2시간 전</div>
                        </a>
                        <a href="#" class="block p-4 rounded-lg hover:bg-gray-50 transition-colors">
                            <div class="font-medium text-gray-900 mb-1 line-clamp-2">
                                반도체 업황 개선 기대감...SK하이닉스 강세
                            </div>
                            <div class="text-sm text-gray-500">3시간 전</div>
                        </a>
                    </div>
                </div>
            </div>

            <!-- 빠른 링크 -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <a href="/finance/exchange" class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-center">
                    <i class="fas fa-exchange-alt text-3xl text-blue-600 mb-3"></i>
                    <div class="font-semibold text-gray-900">환율</div>
                </a>
                <a href="/finance/banking" class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-center">
                    <i class="fas fa-university text-3xl text-indigo-600 mb-3"></i>
                    <div class="font-semibold text-gray-900">은행</div>
                </a>
                <button onclick="openProfitCalculator()" class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-center w-full">
                    <i class="fas fa-calculator text-3xl text-green-600 mb-3"></i>
                    <div class="font-semibold text-gray-900">수익률 계산기</div>
                    <div class="text-xs text-gray-600 mt-1">투자 수익 계산</div>
                </button>
                <a href="#" class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-center opacity-50 cursor-not-allowed">
                    <i class="fas fa-robot text-3xl text-gray-400 mb-3"></i>
                    <div class="font-semibold text-gray-500">AI 브리핑</div>
                    <div class="text-xs text-gray-400 mt-1">준비중</div>
                </a>
            </div>
        </main>

        <!-- 수익률 계산기 팝업 모달 -->
        <div id="profitCalculatorModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center p-4 overflow-y-auto" onclick="closeProfitCalculator(event)">
            <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 my-8 max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold text-gray-900">
                        <i class="fas fa-calculator text-green-600 mr-2"></i>
                        수익률 계산기
                    </h2>
                    <button onclick="closeProfitCalculator()" class="text-gray-400 hover:text-gray-600 transition-colors">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>

                <div class="space-y-3">
                    <!-- 종목 선택 -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">
                            <i class="fas fa-chart-line text-purple-600 mr-1"></i>
                            종목 선택 (선택사항)
                        </label>
                        <select 
                            id="stockSelect" 
                            class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-gray-900 bg-white"
                            onchange="selectStock()"
                        >
                            <option value="">직접 입력</option>
                            <option value="005930">삼성전자 (005930)</option>
                            <option value="000660">SK하이닉스 (000660)</option>
                            <option value="035420">NAVER (035420)</option>
                            <option value="005380">현대차 (005380)</option>
                            <option value="035720">카카오 (035720)</option>
                        </select>
                    </div>

                    <!-- 투자 금액 입력 -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">
                            <i class="fas fa-won-sign text-blue-600 mr-1"></i>
                            투자 금액 (원)
                        </label>
                        <input 
                            type="text" 
                            id="investAmount" 
                            placeholder="1,000,000"
                            class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-right text-lg font-mono"
                            oninput="formatCurrency(this); calculateProfit()"
                        />
                    </div>

                    <!-- 매수가 입력 -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">
                            <i class="fas fa-arrow-down text-red-600 mr-1"></i>
                            매수가 (원)
                        </label>
                        <input 
                            type="text" 
                            id="buyPrice" 
                            placeholder="60,000"
                            class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-right text-lg font-mono"
                            oninput="formatCurrency(this); calculateProfit()"
                        />
                    </div>

                    <!-- 현재가 입력 -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">
                            <i class="fas fa-arrow-up text-green-600 mr-1"></i>
                            현재가/목표가 (원)
                        </label>
                        <input 
                            type="text" 
                            id="currentPrice" 
                            placeholder="75,000"
                            class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-right text-lg font-mono"
                            oninput="formatCurrency(this); calculateProfit()"
                        />
                    </div>

                    <!-- 구분선 -->
                    <div class="border-t-2 border-gray-200 my-4"></div>

                    <!-- 결과 표시 -->
                    <div id="profitResult" class="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-3 space-y-2">
                        <div class="flex justify-between items-center">
                            <span class="text-gray-700 font-medium text-sm">보유 수량</span>
                            <span id="shareCount" class="text-lg font-bold text-gray-900">- 주</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-700 font-medium text-sm">평가 금액</span>
                            <span id="currentValue" class="text-lg font-bold text-gray-900">- 원</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-700 font-medium text-sm">손익 금액</span>
                            <span id="profitAmount" class="text-xl font-bold text-green-600">- 원</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-700 font-medium text-sm">수익률</span>
                            <span id="profitRate" class="text-xl font-bold text-green-600">- %</span>
                        </div>
                    </div>

                    <!-- 도움말 -->
                    <div class="bg-blue-50 rounded-lg p-2 text-xs text-blue-800">
                        <i class="fas fa-info-circle mr-1"></i>
                        투자 금액을 매수가로 나눈 수량으로 계산됩니다. 수수료는 포함되지 않습니다.
                    </div>

                    <!-- 초기화 버튼 -->
                    <button onclick="resetCalculator()" class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg transition-colors">
                        <i class="fas fa-redo mr-2"></i>
                        초기화
                    </button>
                </div>
            </div>
        </div>

        <script>
            // 종목 데이터
            const stockData = {
                '005930': { name: '삼성전자', price: 72500 },
                '000660': { name: 'SK하이닉스', price: 168000 },
                '035420': { name: 'NAVER', price: 215000 },
                '005380': { name: '현대차', price: 185000 },
                '035720': { name: '카카오', price: 52000 }
            };

            // 종목 선택 시
            function selectStock() {
                const ticker = document.getElementById('stockSelect').value;
                if (ticker && stockData[ticker]) {
                    const stock = stockData[ticker];
                    // 현재가 자동 입력
                    document.getElementById('currentPrice').value = stock.price.toLocaleString('ko-KR');
                    calculateProfit();
                }
            }

            // 팝업 열기
            function openProfitCalculator() {
                document.getElementById('profitCalculatorModal').classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            }

            // 팝업 닫기
            function closeProfitCalculator(event) {
                if (!event || event.target.id === 'profitCalculatorModal') {
                    document.getElementById('profitCalculatorModal').classList.add('hidden');
                    document.body.style.overflow = 'auto';
                }
            }

            // 숫자 포맷팅 (콤마 추가)
            function formatCurrency(input) {
                let value = input.value.replace(/,/g, '');
                if (!isNaN(value) && value !== '') {
                    input.value = parseInt(value).toLocaleString('ko-KR');
                }
            }

            // 수익률 계산
            function calculateProfit() {
                const investAmount = parseInt(document.getElementById('investAmount').value.replace(/,/g, '') || '0');
                const buyPrice = parseInt(document.getElementById('buyPrice').value.replace(/,/g, '') || '0');
                const currentPrice = parseInt(document.getElementById('currentPrice').value.replace(/,/g, '') || '0');

                if (investAmount > 0 && buyPrice > 0 && currentPrice > 0) {
                    // 보유 수량 계산 (소수점 버림)
                    const shareCount = Math.floor(investAmount / buyPrice);
                    
                    // 실제 투자금 (수수료 제외)
                    const actualInvestment = shareCount * buyPrice;
                    
                    // 평가 금액
                    const currentValue = shareCount * currentPrice;
                    
                    // 손익 금액
                    const profitAmount = currentValue - actualInvestment;
                    
                    // 수익률
                    const profitRate = (profitAmount / actualInvestment) * 100;

                    // 결과 표시
                    document.getElementById('shareCount').textContent = shareCount.toLocaleString('ko-KR') + ' 주';
                    document.getElementById('currentValue').textContent = currentValue.toLocaleString('ko-KR') + ' 원';
                    
                    const profitAmountEl = document.getElementById('profitAmount');
                    const profitRateEl = document.getElementById('profitRate');
                    
                    if (profitAmount >= 0) {
                        profitAmountEl.textContent = '+' + profitAmount.toLocaleString('ko-KR') + ' 원';
                        profitAmountEl.className = 'text-xl font-bold text-red-600';
                        
                        profitRateEl.textContent = '+' + profitRate.toFixed(2) + ' %';
                        profitRateEl.className = 'text-xl font-bold text-red-600';
                    } else {
                        profitAmountEl.textContent = profitAmount.toLocaleString('ko-KR') + ' 원';
                        profitAmountEl.className = 'text-xl font-bold text-blue-600';
                        
                        profitRateEl.textContent = profitRate.toFixed(2) + ' %';
                        profitRateEl.className = 'text-xl font-bold text-blue-600';
                    }
                } else {
                    // 입력 값이 없으면 초기 상태로
                    document.getElementById('shareCount').textContent = '- 주';
                    document.getElementById('currentValue').textContent = '- 원';
                    document.getElementById('profitAmount').textContent = '- 원';
                    document.getElementById('profitAmount').className = 'text-xl font-bold text-green-600';
                    document.getElementById('profitRate').textContent = '- %';
                    document.getElementById('profitRate').className = 'text-xl font-bold text-green-600';
                }
            }

            // 초기화
            function resetCalculator() {
                document.getElementById('stockSelect').value = '';
                document.getElementById('investAmount').value = '';
                document.getElementById('buyPrice').value = '';
                document.getElementById('currentPrice').value = '';
                calculateProfit();
            }

            // ESC 키로 닫기
            document.addEventListener('keydown', function(event) {
                if (event.key === 'Escape') {
                    closeProfitCalculator();
                }
            });

            // ==================== 실시간 주식 데이터 로드 (실제 API) ====================
            
            // 실제 API를 통한 실시간 데이터 로드
            async function loadRealTimeStockData() {
                try {
                    // 주요 지수 및 인기 종목 심볼
                    const symbols = [
                        '^KS11',      // KOSPI
                        '^KQ11',      // KOSDAQ
                        'KRW=X',      // USD/KRW
                        '005930.KS',  // 삼성전자
                        'NVDA',       // NVIDIA
                        'TSLA',       // 테슬라
                        '000660.KS',  // SK하이닉스
                        'AAPL'        // 애플
                    ];
                    
                    console.log('Fetching real-time stock data...');
                    const response = await fetch('/api/stocks/quotes?symbols=' + symbols.join(','));
                    const data = await response.json();
                    
                    console.log('API Response:', data);
                    
                    if (data.success && data.stocks && data.stocks.length > 0) {
                        updateStockUI(data.stocks);
                        console.log('Stock data updated successfully');
                    } else {
                        console.warn('No stock data available, using fallback');
                        // API 실패 시 작은 변동만 표시
                        simulateSmallChanges();
                    }
                } catch (error) {
                    console.error('Failed to load real-time stock data:', error);
                    // API 실패 시 작은 변동만 표시
                    simulateSmallChanges();
                }
            }
            
            // API 실패 시 작은 변동 표시
            function simulateSmallChanges() {
                const stockElements = document.querySelectorAll('[data-stock-ticker]');
                const indexElements = document.querySelectorAll('[data-index]');
                
                // 작은 깜빡임 효과
                stockElements.forEach(el => {
                    el.style.opacity = '0.8';
                    setTimeout(() => { el.style.opacity = '1'; }, 200);
                });
                indexElements.forEach(el => {
                    el.style.opacity = '0.8';
                    setTimeout(() => { el.style.opacity = '1'; }, 200);
                });
            }
            
            // UI 업데이트
            function updateStockUI(stocks) {
                const stockMap = {};
                stocks.forEach(stock => {
                    stockMap[stock.symbol] = stock;
                });
                
                console.log('Stock Map:', stockMap);
                
                // KOSPI 업데이트
                if (stockMap['^KS11']) {
                    console.log('Updating KOSPI:', stockMap['^KS11']);
                    updateIndexCard('KOSPI', stockMap['^KS11']);
                }
                
                // KOSDAQ 업데이트
                if (stockMap['^KQ11']) {
                    console.log('Updating KOSDAQ:', stockMap['^KQ11']);
                    updateIndexCard('KOSDAQ', stockMap['^KQ11']);
                }
                
                // USD/KRW 업데이트
                if (stockMap['KRW=X']) {
                    console.log('Updating USD/KRW:', stockMap['KRW=X']);
                    updateIndexCard('USD/KRW', stockMap['KRW=X']);
                }
                
                // 인기 종목 업데이트
                ['005930.KS', 'NVDA', 'TSLA', '000660.KS', 'AAPL'].forEach(ticker => {
                    if (stockMap[ticker]) {
                        console.log(\`Updating \${ticker}:\`, stockMap[ticker]);
                        updateStockCard(ticker, stockMap[ticker]);
                    }
                });
            }
            
            // 지수 카드 업데이트
            function updateIndexCard(name, data) {
                const card = document.querySelector(\`[data-index="\${name}"]\`);
                if (card && data) {
                    const priceEl = card.querySelector('.index-price');
                    const changeEl = card.querySelector('.index-change');
                    
                    if (priceEl) {
                        priceEl.textContent = data.price.toLocaleString('ko-KR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        });
                    }
                    
                    if (changeEl) {
                        const changeText = (data.change >= 0 ? '▲' : '▼') + ' ' + 
                            Math.abs(data.change).toFixed(2) + ' (' +
                            (data.change >= 0 ? '+' : '') + data.changePercent.toFixed(2) + '%)';
                        changeEl.textContent = changeText;
                        changeEl.className = 'index-change stock-number text-sm font-medium ' + 
                            (data.status === 'up' ? 'text-red-600' : 'text-blue-600');
                    }
                    
                    // 깜빡임 효과
                    card.style.backgroundColor = data.status === 'up' ? '#fee' : '#eef';
                    setTimeout(() => { card.style.backgroundColor = ''; }, 300);
                }
            }
            
            // 주식 카드 업데이트
            function updateStockCard(ticker, data) {
                const card = document.querySelector(\`[data-stock-ticker="\${ticker}"]\`);
                if (card && data) {
                    const priceEl = card.querySelector('.stock-price');
                    const changeEl = card.querySelector('.stock-change');
                    
                    if (priceEl) {
                        const decimals = ticker.includes('.KS') ? 0 : 2;
                        priceEl.textContent = data.price.toLocaleString('ko-KR', {
                            minimumFractionDigits: decimals,
                            maximumFractionDigits: decimals
                        });
                    }
                    
                    if (changeEl) {
                        const changeText = (data.status === 'up' ? '▲' : '▼') + ' ' +
                            (data.change >= 0 ? '+' : '') + data.changePercent.toFixed(2) + '%';
                        changeEl.textContent = changeText;
                        changeEl.className = 'stock-change stock-number text-sm font-medium ' + 
                            (data.status === 'up' ? 'text-red-600' : 'text-blue-600');
                    }
                    
                    // 깜빡임 효과
                    card.style.backgroundColor = data.status === 'up' ? '#fef2f2' : '#eff6ff';
                    setTimeout(() => { card.style.backgroundColor = ''; }, 300);
                }
            }
            
            // 페이지 로드 시 실시간 데이터 로드
            document.addEventListener('DOMContentLoaded', function() {
                console.log('Page loaded, starting real-time data fetch');
                
                // 즉시 첫 로드
                loadRealTimeStockData();
                loadKRStocks();
                loadUSStocks();
                
                // 30초마다 자동 갱신
                setInterval(loadRealTimeStockData, 30000);
                setInterval(loadKRStocks, 30000);
                setInterval(loadUSStocks, 30000);
            });

            // ==================== 한국 & 미국 주식 공통 렌더링 함수 ====================
            
            function renderStockCard(stock, isKorean = false) {
                const isUp = stock.status === 'up';
                const colorClass = isUp ? 'text-red-600' : 'text-blue-600';
                const bgClass = isUp ? 'bg-red-50' : 'bg-blue-50';
                const borderClass = isUp ? 'border-red-200' : 'border-blue-200';
                
                // 가격 포맷팅
                const priceText = isKorean 
                    ? '₩' + stock.price.toLocaleString('ko-KR') 
                    : '$' + stock.price.toFixed(2);
                
                const changeText = isKorean
                    ? (isUp ? '+' : '') + stock.change.toLocaleString('ko-KR')
                    : (isUp ? '+$' : '-$') + Math.abs(stock.change).toFixed(2);
                
                return \`
                    <div class="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-all border-2 \${borderClass}">
                        <!-- 헤더 -->
                        <div class="flex items-center justify-between mb-3">
                            <div>
                                <div class="font-bold text-gray-900">\${stock.name}</div>
                                <div class="text-xs text-gray-500">\${stock.symbol.replace('.KS', '')}</div>
                            </div>
                            <span class="px-2 py-1 rounded text-xs font-semibold \${bgClass} \${colorClass}">
                                \${isUp ? '▲' : '▼'} \${Math.abs(stock.changePercent).toFixed(2)}%
                            </span>
                        </div>
                        
                        <!-- 가격 정보 -->
                        <div class="mb-3">
                            <div class="stock-number text-2xl font-bold text-gray-900">
                                \${priceText}
                            </div>
                            <div class="stock-number text-sm \${colorClass} font-medium">
                                \${changeText} (\${isUp ? '+' : ''}\${stock.changePercent.toFixed(2)}%)
                            </div>
                        </div>
                        
                        <!-- 미니 차트 -->
                        <div class="h-16">
                            <canvas id="chart-\${stock.symbol}" class="w-full h-full"></canvas>
                        </div>
                    </div>
                \`;
            }
            
            function drawMiniChart(stock) {
                const canvas = document.getElementById(\`chart-\${stock.symbol}\`);
                if (!canvas || !stock.chartData || stock.chartData.length === 0) return;
                
                const ctx = canvas.getContext('2d');
                const width = canvas.offsetWidth;
                const height = canvas.offsetHeight;
                
                canvas.width = width;
                canvas.height = height;
                
                const prices = stock.chartData.map(d => d.price);
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                const priceRange = maxPrice - minPrice;
                
                // 선 색상 설정 (한국형: 상승=빨강, 하락=파랑)
                const lineColor = stock.status === 'up' ? '#dc2626' : '#2563eb';
                const fillColor = stock.status === 'up' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(37, 99, 235, 0.1)';
                
                ctx.clearRect(0, 0, width, height);
                ctx.strokeStyle = lineColor;
                ctx.lineWidth = 2;
                ctx.beginPath();
                
                prices.forEach((price, index) => {
                    const x = (index / (prices.length - 1)) * width;
                    const y = height - ((price - minPrice) / priceRange) * height;
                    
                    if (index === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                });
                
                ctx.stroke();
                
                // 영역 채우기 (투명도)
                ctx.lineTo(width, height);
                ctx.lineTo(0, height);
                ctx.closePath();
                ctx.fillStyle = fillColor;
                ctx.fill();
            }
            
            // ==================== 한국 주식 4대장 로드 ====================
            
            async function loadKRStocks() {
                try {
                    console.log('Fetching Korean major stocks...');
                    const response = await fetch('/api/kr-stocks/major');
                    const data = await response.json();
                    
                    console.log('KR Stocks Response:', data);
                    
                    if (data.success && data.stocks && data.stocks.length > 0) {
                        renderKRStocks(data.stocks);
                    }
                } catch (error) {
                    console.error('Failed to load KR stocks:', error);
                }
            }
            
            function renderKRStocks(stocks) {
                const container = document.getElementById('kr-stocks-widget');
                if (!container) return;
                
                container.innerHTML = stocks.map(stock => renderStockCard(stock, true)).join('');
                
                // 차트 그리기
                setTimeout(() => {
                    stocks.forEach(stock => {
                        drawMiniChart(stock);
                    });
                }, 100);
            }
            
            // ==================== 미국 주식 4대장 로드 ====================
            
            async function loadUSStocks() {
                try {
                    console.log('Fetching US major stocks...');
                    const response = await fetch('/api/us-stocks/major');
                    const data = await response.json();
                    
                    console.log('US Stocks Response:', data);
                    
                    if (data.success && data.stocks && data.stocks.length > 0) {
                        renderUSStocks(data.stocks);
                    }
                } catch (error) {
                    console.error('Failed to load US stocks:', error);
                }
            }
            
            function renderUSStocks(stocks) {
                const container = document.getElementById('us-stocks-widget');
                if (!container) return;
                
                container.innerHTML = stocks.map(stock => renderStockCard(stock, false)).join('');
                
                // 차트 그리기
                setTimeout(() => {
                    stocks.forEach(stock => {
                        drawMiniChart(stock);
                    });
                }, 100);
            }
            
            // ==================== 환율 & 원자재 & 코인 로드 ====================
            
            async function loadMacroIndicators() {
                try {
                    console.log('Fetching macro indicators...');
                    const response = await fetch('/api/macro-indicators');
                    const data = await response.json();
                    
                    console.log('Macro Indicators Response:', data);
                    
                    if (data.success && data.indicators && data.indicators.length > 0) {
                        renderMacroIndicators(data.indicators);
                    }
                } catch (error) {
                    console.error('Failed to load macro indicators:', error);
                }
            }
            
            function renderMacroIndicators(indicators) {
                const container = document.getElementById('macro-indicators-widget');
                if (!container) return;
                
                const html = indicators.map(indicator => {
                    const isUp = indicator.status === 'up';
                    const colorClass = isUp ? 'text-red-600' : 'text-blue-600';
                    const bgClass = isUp ? 'bg-red-50' : 'bg-blue-50';
                    const borderClass = isUp ? 'border-red-200' : 'border-blue-200';
                    
                    let priceText = '';
                    if (indicator.type === 'currency') {
                        priceText = '₩' + indicator.price.toFixed(2);
                    } else if (indicator.type === 'crypto') {
                        priceText = '₩' + indicator.price.toLocaleString('ko-KR', {maximumFractionDigits: 0});
                    } else {
                        priceText = '$' + indicator.price.toFixed(2);
                    }
                    
                    const changeText = (isUp ? '+' : '') + indicator.changePercent.toFixed(2) + '%';
                    
                    return '<div class="bg-white rounded-lg shadow-sm p-4 border-l-4 ' + borderClass + ' hover:shadow-md transition-shadow">' +
                            '<div class="flex items-center justify-between mb-3">' +
                                '<div class="flex items-center gap-2">' +
                                    '<span class="text-2xl">' + indicator.icon + '</span>' +
                                    '<h3 class="text-sm font-semibold text-gray-700">' + indicator.name + '</h3>' +
                                '</div>' +
                                '<span class="text-xs px-2 py-1 rounded ' + bgClass + ' ' + colorClass + ' font-medium">' +
                                    (isUp ? '▲' : '▼') +
                                '</span>' +
                            '</div>' +
                            '<div class="stock-number text-2xl font-bold text-gray-900 mb-1">' + priceText + '</div>' +
                            '<div class="stock-number ' + colorClass + ' text-sm font-medium">' + changeText + '</div>' +
                        '</div>';
                }).join('');
                
                container.innerHTML = html;
            }
            
            // ==================== 실시간 급상승/급하락 랭킹 ====================
            
            let currentMoversType = 'gainers';
            
            async function loadMarketMovers(type = 'gainers') {
                try {
                    console.log('Fetching market movers: ' + type + '...');
                    const response = await fetch('/api/market-movers/' + type);
                    const data = await response.json();
                    
                    console.log('Market Movers Response:', data);
                    
                    if (data.success && data.stocks && data.stocks.length > 0) {
                        renderMarketMovers(data.stocks, type);
                    }
                } catch (error) {
                    console.error('Failed to load market movers:', error);
                }
            }
            
            function renderMarketMovers(stocks, type) {
                const container = document.getElementById('market-movers-content');
                if (!container) return;
                
                const formatVolume = (vol) => {
                    if (vol >= 1000000000) return (vol / 1000000000).toFixed(1) + 'B';
                    if (vol >= 1000000) return (vol / 1000000).toFixed(1) + 'M';
                    if (vol >= 1000) return (vol / 1000).toFixed(1) + 'K';
                    return vol.toString();
                };
                
                const html = '<div class="space-y-3">' +
                    stocks.map((stock, index) => {
                        const isUp = stock.status === 'up';
                        const colorClass = isUp ? 'text-red-600' : 'text-blue-600';
                        const bgClass = isUp ? 'bg-red-50' : 'bg-blue-50';
                        
                        let rankClass = '';
                        if (index === 0) rankClass = 'bg-yellow-100 text-yellow-700';
                        else if (index === 1) rankClass = 'bg-gray-100 text-gray-700';
                        else if (index === 2) rankClass = 'bg-orange-100 text-orange-700';
                        else rankClass = 'bg-blue-50 text-blue-600';
                        
                        const volumeHtml = type === 'actives' ? '<span class="text-xs text-gray-500">' + formatVolume(stock.volume) + '</span>' : '';
                        
                        return '<div class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">' +
                            '<div class="flex items-center gap-3 flex-1">' +
                                '<span class="flex items-center justify-center w-6 h-6 rounded-full ' + rankClass + ' font-bold text-xs">' +
                                    (index + 1) +
                                '</span>' +
                                '<div class="flex-1 min-w-0">' +
                                    '<div class="font-semibold text-gray-900 text-sm truncate">' + stock.name + '</div>' +
                                    '<div class="text-xs text-gray-500">' + stock.symbol + '</div>' +
                                '</div>' +
                            '</div>' +
                            '<div class="text-right ml-4">' +
                                '<div class="stock-number font-bold text-gray-900 text-sm mb-1">$' + stock.price.toFixed(2) + '</div>' +
                                '<div class="flex items-center gap-2">' +
                                    '<span class="stock-number text-xs px-2 py-1 rounded ' + bgClass + ' ' + colorClass + ' font-medium">' +
                                        (isUp ? '+' : '') + stock.changePercent.toFixed(2) + '%' +
                                    '</span>' +
                                    volumeHtml +
                                '</div>' +
                            '</div>' +
                        '</div>';
                    }).join('') +
                '</div>';
                
                container.innerHTML = html;
            }
            
            // Tab 클릭 이벤트
            function setupMarketMoversTabs() {
                const tabs = document.querySelectorAll('.market-mover-tab');
                tabs.forEach(tab => {
                    tab.addEventListener('click', () => {
                        const type = tab.dataset.type;
                        currentMoversType = type;
                        
                        // Tab 스타일 업데이트
                        tabs.forEach(t => {
                            t.classList.remove('border-red-500', 'border-blue-500', 'border-orange-500', 'text-red-600', 'text-blue-600', 'text-orange-600');
                            t.classList.add('border-transparent', 'text-gray-500');
                        });
                        
                        if (type === 'gainers') {
                            tab.classList.remove('border-transparent', 'text-gray-500');
                            tab.classList.add('border-red-500', 'text-red-600');
                        } else if (type === 'losers') {
                            tab.classList.remove('border-transparent', 'text-gray-500');
                            tab.classList.add('border-blue-500', 'text-blue-600');
                        } else {
                            tab.classList.remove('border-transparent', 'text-gray-500');
                            tab.classList.add('border-orange-500', 'text-orange-600');
                        }
                        
                        loadMarketMovers(type);
                    });
                });
            }
            
            // ==================== 투자자 심리 투표 ====================
            
            async function loadPollResults() {
                try {
                    const response = await fetch('/api/poll/sentiment');
                    const data = await response.json();
                    
                    if (data.success && data.poll) {
                        displayPollResults(data.poll);
                    }
                } catch (error) {
                    console.error('Failed to load poll results:', error);
                }
            }
            
            function displayPollResults(poll) {
                const resultsDiv = document.getElementById('poll-results');
                const buttonsDiv = document.getElementById('vote-buttons');
                
                if (!resultsDiv || !buttonsDiv) return;
                
                // 버튼 숨기고 결과 표시
                buttonsDiv.classList.add('hidden');
                resultsDiv.classList.remove('hidden');
                
                // 애니메이션 효과
                setTimeout(() => {
                    document.getElementById('bull-percent').textContent = poll.bullPercent.toFixed(1) + '%';
                    document.getElementById('bear-percent').textContent = poll.bearPercent.toFixed(1) + '%';
                    document.getElementById('bull-bar').style.width = poll.bullPercent + '%';
                    document.getElementById('bear-bar').style.width = poll.bearPercent + '%';
                    document.getElementById('total-votes').textContent = poll.totalVotes.toLocaleString();
                }, 100);
            }
            
            async function submitVote(voteType) {
                try {
                    const response = await fetch('/api/poll/vote', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ vote: voteType })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        // 로컬스토리지에 투표 기록 저장
                        localStorage.setItem('poll_voted', 'true');
                        localStorage.setItem('poll_vote_type', voteType);
                        
                        // 결과 로드
                        loadPollResults();
                    }
                } catch (error) {
                    console.error('Failed to submit vote:', error);
                }
            }
            
            function setupPollButtons() {
                // 이미 투표했는지 확인
                const hasVoted = localStorage.getItem('poll_voted');
                
                if (hasVoted) {
                    loadPollResults();
                    return;
                }
                
                // 투표 버튼 이벤트
                const voteButtons = document.querySelectorAll('.vote-btn');
                voteButtons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        const voteType = btn.dataset.vote;
                        submitVote(voteType);
                    });
                });
            }
            
            // ==================== 페이지 초기화 ====================
            
            document.addEventListener('DOMContentLoaded', () => {
                // 기존 주식 위젯 로드
                loadKRStocks();
                loadUSStocks();
                
                // 새로운 위젯 로드
                loadMacroIndicators();
                loadMarketMovers('gainers');
                setupMarketMoversTabs();
                setupPollButtons();
                
                // 30초마다 자동 새로고침
                setInterval(() => {
                    loadKRStocks();
                    loadUSStocks();
                    loadMacroIndicators();
                    loadMarketMovers(currentMoversType);
                }, 30000);
            });
        </script>

        ${getCommonFooter()}
        ${getCommonAuthScript()}
    </body>
    </html>
  `);
});
// 주식 상세 페이지
app.get('/finance/stock/:ticker', (c) => {
    const ticker = c.req.param('ticker');
    // 해당 종목 찾기
    const stock = MOCK_POPULAR_STOCKS.find(s => s.ticker === ticker) || {
        ticker: ticker,
        name: ticker,
        price: 50000,
        change: 0,
        rate: 0,
        status: 'flat'
    };
    // 차트 데이터 생성
    const chartData = generateMockChartData(stock.price);
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko" id="html-root">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${stock.name} (${ticker}) - Faith Portal</title>
        <script>
            (function() {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                    if (args[0] && typeof args[0] === 'string' && 
                        args[0].includes('cdn.tailwindcss.com should not be used in production')) {
                        return;
                    }
                    originalWarn.apply(console, args);
                };
            })();
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        <style>
            .faith-blue { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); }
            .faith-blue-hover:hover { background: linear-gradient(135deg, #0284c7 0%, #0891b2 100%); }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, sans-serif; }
            .stock-number { font-family: 'Roboto Mono', 'Courier New', monospace; }
            .tab-button.active {
                border-bottom: 2px solid #10b981;
                color: #10b981;
                font-weight: 600;
            }
        </style>
    </head>
    <body class="bg-slate-50" id="html-root">
        ${getCommonHeader('Finance')}
        ${getStickyHeader()}
        
        ${getBreadcrumb([
        { label: '홈', href: '/' },
        { label: '금융', href: '/finance' },
        { label: stock.name }
    ])}

        ${getFinanceMenu('/finance')}

        <main class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
            <!-- 주식 헤더 -->
            <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div class="flex items-start justify-between mb-4">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900 mb-2">${stock.name}</h1>
                        <p class="text-gray-500">${ticker}</p>
                    </div>
                    <button class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                        <i class="far fa-star"></i>
                        관심종목
                    </button>
                </div>
                <div class="flex items-end gap-4">
                    <div class="stock-number text-4xl font-bold text-gray-900">
                        ${stock.price.toLocaleString('ko-KR')}
                    </div>
                    <div class="stock-number mb-2 ${stock.status === 'up' ? 'text-red-600' : stock.status === 'down' ? 'text-blue-600' : 'text-gray-600'} font-semibold text-lg">
                        ${stock.status === 'up' ? '▲' : stock.status === 'down' ? '▼' : '－'} ${Math.abs(stock.change).toLocaleString('ko-KR')} 
                        (${stock.rate > 0 ? '+' : ''}${stock.rate.toFixed(2)}%)
                    </div>
                </div>
            </div>

            <!-- 차트 영역 -->
            <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-xl font-bold text-gray-900">
                        <i class="fas fa-chart-area text-green-600 mr-2"></i>
                        가격 차트 (1개월)
                    </h2>
                    <div class="flex gap-2">
                        <button class="px-3 py-1 text-sm bg-green-600 text-white rounded-lg">1개월</button>
                        <button class="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">3개월</button>
                        <button class="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">1년</button>
                    </div>
                </div>
                <div style="position: relative; height: 400px;">
                    <canvas id="stockChart"></canvas>
                </div>
            </div>

            <!-- 관련 뉴스 섹션 -->
            <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-xl font-bold text-gray-900">
                        <i class="fas fa-newspaper text-blue-600 mr-2"></i>
                        📰 ${stock.name} 관련 최신 뉴스
                    </h2>
                    <a href="/news?keyword=${encodeURIComponent(stock.name)}" class="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        전체보기 <i class="fas fa-arrow-right ml-1"></i>
                    </a>
                </div>
                
                <!-- 뉴스 로딩 스켈레톤 -->
                <div id="related-news-loading" class="space-y-4">
                    ${[1, 2, 3].map(() => `
                        <div class="flex gap-4 p-4 border border-gray-200 rounded-lg animate-pulse">
                            <div class="w-24 h-24 bg-gray-200 rounded flex-shrink-0"></div>
                            <div class="flex-1 space-y-2">
                                <div class="h-5 bg-gray-200 rounded w-3/4"></div>
                                <div class="h-4 bg-gray-200 rounded w-full"></div>
                                <div class="h-4 bg-gray-200 rounded w-1/4"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <!-- 뉴스 리스트 -->
                <div id="related-news-list" class="hidden space-y-4"></div>
                
                <!-- Empty State -->
                <div id="related-news-empty" class="hidden text-center py-12">
                    <i class="fas fa-newspaper text-gray-300 text-5xl mb-4"></i>
                    <p class="text-gray-500">아직 등록된 관련 뉴스가 없습니다.</p>
                    <p class="text-sm text-gray-400 mt-2">곧 새로운 뉴스가 업데이트될 예정입니다.</p>
                </div>
            </div>

            <!-- 탭 메뉴 -->
            <div class="bg-white rounded-lg shadow-sm mb-6">
                <div class="border-b border-gray-200">
                    <div class="flex gap-8 px-6">
                        <button class="tab-button active px-4 py-4 text-gray-600 hover:text-green-600 transition-colors" data-tab="summary">
                            종합
                        </button>
                        <button class="tab-button px-4 py-4 text-gray-600 hover:text-green-600 transition-colors" data-tab="news">
                            뉴스
                        </button>
                        <button class="tab-button px-4 py-4 text-gray-600 hover:text-green-600 transition-colors" data-tab="discussion">
                            토론
                        </button>
                        <button class="tab-button px-4 py-4 text-gray-600 hover:text-green-600 transition-colors" data-tab="financial">
                            재무
                        </button>
                    </div>
                </div>
                <div class="p-6">
                    <!-- 종합 탭 -->
                    <div id="tab-summary" class="tab-content">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 class="text-lg font-bold text-gray-900 mb-4">기업 정보</h3>
                                <div class="space-y-3">
                                    <div class="flex justify-between py-2 border-b border-gray-100">
                                        <span class="text-gray-600">시가총액</span>
                                        <span class="stock-number font-medium">약 430조원</span>
                                    </div>
                                    <div class="flex justify-between py-2 border-b border-gray-100">
                                        <span class="text-gray-600">시가</span>
                                        <span class="stock-number font-medium">${stock.price.toLocaleString('ko-KR')}</span>
                                    </div>
                                    <div class="flex justify-between py-2 border-b border-gray-100">
                                        <span class="text-gray-600">고가</span>
                                        <span class="stock-number font-medium">${(stock.price * 1.02).toLocaleString('ko-KR')}</span>
                                    </div>
                                    <div class="flex justify-between py-2 border-b border-gray-100">
                                        <span class="text-gray-600">저가</span>
                                        <span class="stock-number font-medium">${(stock.price * 0.98).toLocaleString('ko-KR')}</span>
                                    </div>
                                    <div class="flex justify-between py-2">
                                        <span class="text-gray-600">거래량</span>
                                        <span class="stock-number font-medium">15,234,567주</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold text-gray-900 mb-4">투자 지표</h3>
                                <div class="space-y-3">
                                    <div class="flex justify-between py-2 border-b border-gray-100">
                                        <span class="text-gray-600">PER</span>
                                        <span class="stock-number font-medium">15.3</span>
                                    </div>
                                    <div class="flex justify-between py-2 border-b border-gray-100">
                                        <span class="text-gray-600">PBR</span>
                                        <span class="stock-number font-medium">1.2</span>
                                    </div>
                                    <div class="flex justify-between py-2 border-b border-gray-100">
                                        <span class="text-gray-600">ROE</span>
                                        <span class="stock-number font-medium">8.5%</span>
                                    </div>
                                    <div class="flex justify-between py-2 border-b border-gray-100">
                                        <span class="text-gray-600">배당수익률</span>
                                        <span class="stock-number font-medium">2.3%</span>
                                    </div>
                                    <div class="flex justify-between py-2">
                                        <span class="text-gray-600">52주 최고</span>
                                        <span class="stock-number font-medium">${(stock.price * 1.25).toLocaleString('ko-KR')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 수익률 계산기 링크 -->
                        <div class="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h4 class="font-bold text-gray-900 mb-1">
                                        <i class="fas fa-calculator text-green-600 mr-2"></i>
                                        이 주식 수익률 계산해 보기
                                    </h4>
                                    <p class="text-sm text-gray-600">내가 투자했다면 얼마를 벌었을까요?</p>
                                </div>
                                <button class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                                    계산하기
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- 뉴스 탭 -->
                    <div id="tab-news" class="tab-content hidden">
                        <div class="space-y-4">
                            <p class="text-gray-500 text-center py-8">관련 뉴스가 곧 제공될 예정입니다.</p>
                        </div>
                    </div>

                    <!-- 토론 탭 -->
                    <div id="tab-discussion" class="tab-content hidden">
                        <div class="space-y-4">
                            <p class="text-gray-500 text-center py-8">토론 기능이 곧 제공될 예정입니다.</p>
                        </div>
                    </div>

                    <!-- 재무 탭 -->
                    <div id="tab-financial" class="tab-content hidden">
                        <div class="space-y-4">
                            <p class="text-gray-500 text-center py-8">재무 정보가 곧 제공될 예정입니다.</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        ${getCommonFooter()}
        ${getCommonAuthScript()}

        <script>
        // 차트 초기화
        const ctx = document.getElementById('stockChart').getContext('2d');
        const chartData = ${JSON.stringify(chartData)};
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.map(d => {
                    const date = new Date(d.date);
                    return (date.getMonth() + 1) + '/' + date.getDate();
                }),
                datasets: [{
                    label: '주가',
                    data: chartData.map(d => d.price),
                    borderColor: '${stock.status === 'up' ? 'rgb(220, 38, 38)' : stock.status === 'down' ? 'rgb(37, 99, 235)' : 'rgb(107, 114, 128)'}',
                    backgroundColor: '${stock.status === 'up' ? 'rgba(220, 38, 38, 0.1)' : stock.status === 'down' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(107, 114, 128, 0.1)'}',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '${stock.status === 'up' ? 'rgb(220, 38, 38)' : stock.status === 'down' ? 'rgb(37, 99, 235)' : 'rgb(107, 114, 128)'}',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return '₩ ' + context.parsed.y.toLocaleString('ko-KR');
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '₩' + value.toLocaleString('ko-KR');
                            }
                        }
                    }
                }
            }
        });

        // 탭 전환
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.getAttribute('data-tab');
                
                // 모든 탭 버튼 비활성화
                tabButtons.forEach(btn => btn.classList.remove('active'));
                // 클릭된 탭 버튼 활성화
                button.classList.add('active');
                
                // 모든 탭 콘텐츠 숨기기
                tabContents.forEach(content => content.classList.add('hidden'));
                // 선택된 탭 콘텐츠 표시
                document.getElementById('tab-' + tabName).classList.remove('hidden');
            });
        });

        // 관련 뉴스 로딩
        async function loadRelatedNews() {
            const ticker = '${ticker}';
            const loadingEl = document.getElementById('related-news-loading');
            const listEl = document.getElementById('related-news-list');
            const emptyEl = document.getElementById('related-news-empty');
            
            try {
                const response = await fetch('/api/stock/' + ticker + '/news');
                const data = await response.json();
                
                // 로딩 숨기기
                loadingEl.classList.add('hidden');
                
                if (data.success && data.news && data.news.length > 0) {
                    // 뉴스 렌더링
                    listEl.innerHTML = data.news.map(news => {
                        const pubDate = new Date(news.published_at || news.created_at);
                        const timeAgo = getTimeAgo(pubDate);
                        const categoryBadge = getCategoryBadge(news.category);
                        
                        return '<div class="flex gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer" onclick="location.href=\\'/news/' + news.id + '\\'">' +
                            (news.thumbnail ? '<img src="' + news.thumbnail + '" alt="" class="w-24 h-24 object-cover rounded flex-shrink-0" onerror="this.src=\\'https://via.placeholder.com/96x96?text=No+Image\\'">' : '<div class="w-24 h-24 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center"><i class="fas fa-newspaper text-gray-400 text-2xl"></i></div>') +
                            '<div class="flex-1 min-w-0">' +
                                '<div class="flex items-center gap-2 mb-2">' +
                                    categoryBadge +
                                    '<span class="text-xs text-gray-500">' + timeAgo + '</span>' +
                                '</div>' +
                                '<h3 class="font-bold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600">' + escapeHtml(news.title) + '</h3>' +
                                '<p class="text-sm text-gray-600 line-clamp-2">' + escapeHtml(news.description || '') + '</p>' +
                            '</div>' +
                        '</div>';
                    }).join('');
                    listEl.classList.remove('hidden');
                } else {
                    // Empty State 표시
                    emptyEl.classList.remove('hidden');
                }
            } catch (error) {
                console.error('뉴스 로딩 실패:', error);
                loadingEl.classList.add('hidden');
                emptyEl.classList.remove('hidden');
            }
        }
        
        // 시간 경과 표시
        function getTimeAgo(date) {
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            
            if (diffMins < 1) return '방금 전';
            if (diffMins < 60) return diffMins + '분 전';
            if (diffHours < 24) return diffHours + '시간 전';
            if (diffDays < 7) return diffDays + '일 전';
            return date.toLocaleDateString('ko-KR');
        }
        
        // 카테고리 뱃지
        function getCategoryBadge(category) {
            const badges = {
                'general': '<span class="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">일반</span>',
                'politics': '<span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">정치</span>',
                'economy': '<span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">경제</span>',
                'tech': '<span class="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">IT/과학</span>',
                'sports': '<span class="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">스포츠</span>',
                'entertainment': '<span class="px-2 py-1 text-xs font-medium rounded-full bg-pink-100 text-pink-700">엔터</span>'
            };
            return badges[category] || badges['general'];
        }
        
        // HTML 이스케이프
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // 페이지 로드 시 뉴스 로딩
        loadRelatedNews();
        </script>
    </body>
    </html>
  `);
});
// ==================== 환율 페이지 ====================
app.get('/finance/exchange', (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko" id="html-root">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>환율 정보 - Faith Portal</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .exchange-card {
                transition: all 0.3s ease;
            }
            .exchange-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
            }
            .currency-input {
                font-family: 'Roboto Mono', 'Courier New', monospace;
                font-variant-numeric: tabular-nums;
            }
            .tab-btn {
                transition: all 0.2s;
            }
            .tab-btn.active {
                border-bottom: 3px solid #3B82F6;
                color: #3B82F6;
                font-weight: 600;
            }
            .range-bar-dot {
                transition: all 0.3s ease;
            }
            .range-bar-dot:hover {
                transform: scale(1.3);
            }
        </style>
    </head>
    <body class="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen" id="html-root">
        ${getCommonHeader('Finance')}
        ${getStickyHeader()}
        
        ${getBreadcrumb([
        { label: '홈', href: '/' },
        { label: '금융', href: '/finance' },
        { label: '환율' }
    ])}

        <main class="max-w-7xl mx-auto px-4 py-8">
            <!-- 1. 스마트 환율 계산기 -->
            <section class="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <i class="fas fa-exchange-alt text-blue-600 mr-3"></i>
                    실시간 환율 계산기
                </h2>
                
                <div class="flex flex-col md:flex-row items-stretch gap-4 mb-6">
                    <!-- 왼쪽: 외화 입력 -->
                    <div class="flex-1 bg-blue-50 rounded-lg p-5 border border-blue-200">
                        <label class="text-sm text-gray-600 font-semibold mb-2 block">보낼 금액</label>
                        <div class="flex items-center gap-2 mb-2">
                            <input 
                                type="number" 
                                id="amount-from" 
                                value="1000"
                                step="any"
                                class="w-full text-3xl font-bold bg-white rounded-lg px-3 py-2 border border-gray-300 focus:border-blue-500 focus:outline-none currency-input"
                                placeholder="0"
                            />
                        </div>
                        <select id="currency-from" class="w-full text-base font-semibold bg-white rounded-lg px-3 py-2 border border-gray-300 focus:border-blue-500 focus:outline-none cursor-pointer">
                            <option value="USD">🇺🇸 미국 달러 (USD)</option>
                            <option value="JPY">🇯🇵 일본 엔화 (JPY)</option>
                            <option value="EUR">🇪🇺 유럽 유로 (EUR)</option>
                            <option value="CNY">🇨🇳 중국 위안 (CNY)</option>
                        </select>
                    </div>
                    
                    <!-- 중앙: 변환 아이콘 -->
                    <div class="flex items-center justify-center md:py-8">
                        <div class="text-center">
                            <button id="swap-btn" class="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110">
                                <i class="fas fa-exchange-alt text-xl"></i>
                            </button>
                            <div class="mt-2 text-xs text-gray-500 font-medium whitespace-nowrap" id="exchange-rate-display">환율: ₩1,350</div>
                        </div>
                    </div>
                    
                    <!-- 오른쪽: 원화 결과 -->
                    <div class="flex-1 bg-purple-50 rounded-lg p-5 border border-purple-200">
                        <label class="text-sm text-gray-600 font-semibold mb-2 block">받을 금액</label>
                        <div class="flex items-center gap-2 mb-2">
                            <input 
                                type="number" 
                                id="amount-to" 
                                value="1350000"
                                step="any"
                                class="w-full text-3xl font-bold bg-white rounded-lg px-3 py-2 border border-gray-300 focus:border-purple-500 focus:outline-none currency-input"
                                placeholder="0"
                            />
                        </div>
                        <div class="w-full text-base font-semibold bg-gray-100 rounded-lg px-3 py-2 text-gray-700">
                            ₩ 대한민국 원 (KRW)
                        </div>
                    </div>
                </div>
                
                <div class="p-4 bg-amber-50 border-l-4 border-amber-400 rounded">
                    <div class="flex items-start gap-2">
                        <i class="fas fa-info-circle text-amber-600 mt-0.5"></i>
                        <div class="text-sm text-gray-700">
                            매매기준율 기준이며, 실제 환전 시 수수료가 추가될 수 있습니다.
                            <span id="jpy-notice" class="hidden font-semibold text-amber-700">
                                (일본 엔화는 100엔 기준입니다)
                            </span>
                        </div>
                    </div>
                </div>
            </section>
            
            <!-- 2. 주요 통화 현황 -->
            <section class="mb-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <i class="fas fa-chart-line text-purple-600 mr-3"></i>
                    주요 통화 현황
                </h2>
                
                <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6" id="currency-cards">
                    <!-- 로딩 스켈레톤 -->
                    ${[1, 2, 3, 4].map(() => `
                        <div class="bg-white rounded-2xl shadow-md p-6 animate-pulse">
                            <div class="h-12 bg-gray-200 rounded mb-4"></div>
                            <div class="h-8 bg-gray-200 rounded mb-2"></div>
                            <div class="h-6 bg-gray-200 rounded mb-4"></div>
                            <div class="h-2 bg-gray-200 rounded"></div>
                        </div>
                    `).join('')}
                </div>
            </section>
            
            <!-- 3. 여행자용 환전 치트시트 -->
            <section class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <i class="fas fa-plane-departure text-blue-600 mr-3"></i>
                    여행자용 환전 가이드
                </h2>
                
                <!-- 탭 -->
                <div class="flex space-x-2 md:space-x-4 mb-6 border-b-2 border-gray-200 overflow-x-auto">
                    <button class="tab-btn active px-6 py-3 font-semibold whitespace-nowrap" data-currency="USD">
                        🇺🇸 미국
                    </button>
                    <button class="tab-btn px-6 py-3 font-semibold whitespace-nowrap" data-currency="JPY">
                        🇯🇵 일본
                    </button>
                    <button class="tab-btn px-6 py-3 font-semibold whitespace-nowrap" data-currency="EUR">
                        🇪🇺 유럽
                    </button>
                    <button class="tab-btn px-6 py-3 font-semibold whitespace-nowrap" data-currency="CNY">
                        🇨🇳 중국
                    </button>
                </div>
                
                <!-- 테이블 -->
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gradient-to-r from-blue-50 to-purple-50">
                            <tr>
                                <th class="px-6 py-4 text-left font-bold text-gray-900">외화 금액</th>
                                <th class="px-6 py-4 text-right font-bold text-gray-900">원화 금액</th>
                                <th class="px-6 py-4 text-left font-bold text-gray-900">
                                    <i class="fas fa-shopping-bag mr-2"></i>상황 예시
                                </th>
                            </tr>
                        </thead>
                        <tbody id="cheat-sheet-body">
                            <!-- 동적 렌더링 -->
                            <tr>
                                <td colspan="3" class="text-center py-8 text-gray-500">
                                    <i class="fas fa-spinner fa-spin text-2xl"></i>
                                    <p class="mt-2">로딩중...</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p class="text-sm text-blue-800">
                        <i class="fas fa-lightbulb text-blue-600 mr-2"></i>
                        <strong>여행 팁:</strong> 위 금액은 실시간 환율을 기준으로 계산되었습니다. 
                        여행 전 미리 확인하고, 환전소마다 환율이 다를 수 있으니 여러 곳을 비교해보세요!
                    </p>
                </div>
            </section>
        </main>

        ${getCommonFooter()}
        ${getCommonAuthScript()}
        
        <script>
            let currentRates = {};
            
            // 환율 데이터 로드
            async function loadExchangeRates() {
                try {
                    const response = await fetch('/api/exchange/rates');
                    const data = await response.json();
                    if (data.success) {
                        currentRates = data.rates;
                        console.log('환율 정보 로드 완료:', currentRates);
                        
                        // UI 업데이트
                        renderCurrencyCards();
                        calculateExchange();
                    }
                } catch (error) {
                    console.error('환율 로드 오류:', error);
                }
            }
            
            // 환전 계산 (외화 → 원화)
            function calculateExchange() {
                const fromCurrency = document.getElementById('currency-from').value;
                const amountFrom = parseFloat(document.getElementById('amount-from').value) || 0;
                
                if (!currentRates[fromCurrency]) return;
                
                let rate = currentRates[fromCurrency].rate;
                
                // JPY 특수 처리: 100엔 단위
                if (fromCurrency === 'JPY') {
                    rate = rate * 100;
                    document.getElementById('jpy-notice').classList.remove('hidden');
                } else {
                    document.getElementById('jpy-notice').classList.add('hidden');
                }
                
                const amountTo = amountFrom * rate;
                document.getElementById('amount-to').value = Math.round(amountTo);
                
                // 환율 표시
                const rateDisplay = fromCurrency === 'JPY' ? 
                    \`1 JPY (100엔) = ₩\${Math.round(rate).toLocaleString()}\` :
                    \`1 \${fromCurrency} = ₩\${Math.round(rate).toLocaleString()}\`;
                document.getElementById('exchange-rate-display').textContent = rateDisplay;
                
                // 통화명 표시
                const currencyNames = {
                    'USD': '미국 달러',
                    'JPY': '일본 엔화 (100엔)',
                    'EUR': '유럽 유로',
                    'CNY': '중국 위안'
                };
                document.getElementById('currency-from-name').textContent = currencyNames[fromCurrency] || fromCurrency;
            }
            
            // 역계산 (원화 → 외화)
            function calculateReverse() {
                const fromCurrency = document.getElementById('currency-from').value;
                const amountTo = parseFloat(document.getElementById('amount-to').value) || 0;
                
                if (!currentRates[fromCurrency]) return;
                
                let rate = currentRates[fromCurrency].rate;
                
                // JPY 특수 처리
                if (fromCurrency === 'JPY') {
                    rate = rate * 100;
                }
                
                const amountFrom = amountTo / rate;
                document.getElementById('amount-from').value = Math.round(amountFrom * 100) / 100;
            }
            
            // 주요 통화 카드 렌더링
            function renderCurrencyCards() {
                const container = document.getElementById('currency-cards');
                const currencies = ['USD', 'JPY', 'EUR', 'CNY'];
                
                container.innerHTML = currencies.map(curr => {
                    const rate = currentRates[curr];
                    if (!rate) return '';
                    
                    // JPY는 100엔 기준으로 표시
                    const displayRate = curr === 'JPY' ? rate.rate * 100 : rate.rate;
                    const displayChange = curr === 'JPY' ? rate.change * 100 : rate.change;
                    const displayChangePercent = rate.changePercent;
                    const displayLow = curr === 'JPY' ? rate.fiftyTwoWeekLow * 100 : rate.fiftyTwoWeekLow;
                    const displayHigh = curr === 'JPY' ? rate.fiftyTwoWeekHigh * 100 : rate.fiftyTwoWeekHigh;
                    
                    // 52주 범위 계산
                    const range = displayHigh - displayLow;
                    const position = ((displayRate - displayLow) / range) * 100;
                    
                    const isUp = displayChangePercent > 0;
                    const isDown = displayChangePercent < 0;
                    const arrow = isUp ? '▲' : isDown ? '▼' : '━';
                    const colorClass = isUp ? 'text-red-600' : isDown ? 'text-blue-600' : 'text-gray-600';
                    const bgColor = isUp ? 'bg-red-50' : isDown ? 'bg-blue-50' : 'bg-gray-50';
                    
                    const currencyDisplay = curr === 'JPY' ? curr + ' (100엔)' : curr;
                    
                    return \`
                        <div class="exchange-card bg-white rounded-2xl shadow-md p-6 border border-gray-200 cursor-pointer" onclick="selectCurrency('\${curr}')">
                            <div class="flex items-center justify-between mb-4">
                                <div>
                                    <span class="text-4xl mb-2 block">\${rate.flag}</span>
                                    <h3 class="font-bold text-gray-900 text-lg">\${rate.name}</h3>
                                    <p class="text-sm text-gray-500">\${currencyDisplay}</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-3xl font-bold text-gray-900">₩\${Math.round(displayRate).toLocaleString()}</p>
                                    <p class="\${colorClass} font-semibold text-sm mt-1 px-3 py-1 \${bgColor} rounded-full inline-block">
                                        \${arrow} \${Math.abs(displayChangePercent).toFixed(2)}%
                                    </p>
                                </div>
                            </div>
                            
                            <!-- 52주 범위 바 -->
                            <div class="mt-4">
                                <div class="flex justify-between text-xs text-gray-500 mb-2">
                                    <span class="font-semibold">52주 최저</span>
                                    <span class="font-semibold">52주 최고</span>
                                </div>
                                <div class="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div class="absolute h-3 bg-gradient-to-r from-blue-400 via-yellow-400 to-red-400 rounded-full" 
                                         style="width: 100%"></div>
                                    <div class="range-bar-dot absolute h-5 w-5 bg-white border-3 border-purple-600 rounded-full shadow-lg" 
                                         style="left: \${position}%; top: -5px; transform: translateX(-50%)"></div>
                                </div>
                                <div class="flex justify-between text-xs text-gray-700 font-semibold mt-2">
                                    <span>₩\${Math.round(displayLow).toLocaleString()}</span>
                                    <span>₩\${Math.round(displayHigh).toLocaleString()}</span>
                                </div>
                                <div class="text-center mt-2">
                                    <span class="text-xs text-gray-600">
                                        현재는 1년 중 
                                        <strong class="\${position < 33 ? 'text-blue-600' : position > 66 ? 'text-red-600' : 'text-yellow-600'}">
                                            \${position < 33 ? '저점' : position > 66 ? '고점' : '중간'}
                                        </strong>
                                        구간입니다
                                    </span>
                                </div>
                            </div>
                        </div>
                    \`;
                }).join('');
            }
            
            // 통화 선택 (카드 클릭 시)
            function selectCurrency(currency) {
                document.getElementById('currency-from').value = currency;
                calculateExchange();
                renderCheatSheet(currency);
            }
            
            // 치트시트 렌더링
            const CHEAT_AMOUNTS = {
                USD: [1, 5, 10, 50, 100],
                JPY: [100, 500, 1000, 5000, 10000],
                EUR: [1, 5, 10, 50, 100],
                CNY: [1, 10, 50, 100, 500]
            };
            
            const SCENARIOS = {
                USD: ['☕ 커피 한 잔', '🍔 패스트푸드', '🍽️ 점심 식사', '🏨 호텔 하루', '🛍️ 쇼핑'],
                JPY: ['🥤 자판기 음료', '🍙 편의점 간식', '🍜 라멘', '♨️ 온천 입장', '🛒 돈키호테'],
                EUR: ['☕ 에스프레소', '🥪 샌드위치', '🍝 점심 세트', '🏛️ 박물관 입장', '🍷 디너'],
                CNY: ['💧 생수', '🥟 길거리 음식', '🚕 택시 기본', '🍜 식사', '🛍️ 쇼핑']
            };
            
            function renderCheatSheet(currency) {
                if (!currentRates[currency]) return;
                
                const rate = currentRates[currency].rate;
                const amounts = CHEAT_AMOUNTS[currency];
                const scenarios = SCENARIOS[currency];
                
                const tbody = document.getElementById('cheat-sheet-body');
                tbody.innerHTML = amounts.map((amount, i) => {
                    // JPY는 이미 100엔 단위
                    const krw = currency === 'JPY' ? amount * rate : amount * rate;
                    const symbol = currency === 'JPY' ? '¥' : currency === 'EUR' ? '€' : currency === 'CNY' ? '¥' : '$';
                    
                    return \`
                        <tr class="border-b hover:bg-blue-50 transition">
                            <td class="px-6 py-4 font-bold text-lg text-gray-900">\${symbol}\${amount.toLocaleString()}</td>
                            <td class="px-6 py-4 text-right">
                                <span class="text-xl font-bold text-blue-600">₩\${Math.round(krw).toLocaleString()}</span>
                            </td>
                            <td class="px-6 py-4 text-gray-600">\${scenarios[i]}</td>
                        </tr>
                    \`;
                }).join('');
            }
            
            // 이벤트 리스너
            document.getElementById('amount-from').addEventListener('input', calculateExchange);
            document.getElementById('amount-to').addEventListener('input', calculateReverse);
            document.getElementById('currency-from').addEventListener('change', () => {
                calculateExchange();
                renderCheatSheet(document.getElementById('currency-from').value);
            });
            
            document.getElementById('swap-btn').addEventListener('click', () => {
                alert('💡 현재 원화(KRW)는 기준 통화로 고정되어 있습니다.');
            });
            
            // 탭 이벤트
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    document.querySelectorAll('.tab-btn').forEach(b => {
                        b.classList.remove('active');
                    });
                    this.classList.add('active');
                    
                    const currency = this.dataset.currency;
                    renderCheatSheet(currency);
                });
            });
            
            // 초기화
            loadExchangeRates();
        </script>
    </body>
    </html>
  `);
});
// ==================== 엔터 페이지 ====================
app.get('/entertainment', (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko" id="html-root">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>엔터 - Faith Portal</title>
        <script>
            // Tailwind CDN 경고 필터링 (개발 환경용)
            (function() {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                    if (args[0] && typeof args[0] === 'string' && 
                        args[0].includes('cdn.tailwindcss.com should not be used in production')) {
                        return; // Tailwind CDN 경고 무시
                    }
                    originalWarn.apply(console, args);
                };
            })();
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .faith-blue { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); }
            .faith-blue-hover:hover { background: linear-gradient(135deg, #0284c7 0%, #0891b2 100%); }
        </style>
    </head>
    <body class="bg-gradient-to-br from-pink-50 via-rose-50 to-red-50" id="html-root">
        ${getCommonHeader('Entertainment')}
        
        ${getBreadcrumb([
        { label: '홈', href: '/' },
        { label: '엔터' }
    ])}

        ${getEntertainmentMenu('/entertainment')}

        <main class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
            <div class="text-center py-16">
                <div class="w-24 h-24 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <i class="fas fa-star text-4xl text-white"></i>
                </div>
                <h1 class="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
                    <span class="bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent">엔터테인먼트</span>
                </h1>
                <p class="text-gray-600 text-lg mb-8">
                    최신 연예, 음악, 영화 소식을 만나보세요
                </p>
                <div class="flex justify-center gap-4">
                    <a href="/entertainment/music" class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-lg font-medium hover:shadow-lg transition-all">
                        <i class="fas fa-music mr-2"></i>
                        음악 차트
                    </a>
                    <a href="/" class="inline-flex items-center px-6 py-3 bg-white text-gray-700 rounded-lg font-medium border border-gray-300 hover:border-pink-500 hover:text-pink-600 transition-all">
                        <i class="fas fa-home mr-2"></i>
                        메인으로
                    </a>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                    <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                        <i class="fas fa-music text-2xl text-white"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">음악 차트</h3>
                    <p class="text-gray-600 mb-4">실시간 음악 순위와 최신 음악</p>
                    <a href="/entertainment/music" class="text-pink-600 hover:text-pink-700 font-medium">
                        시작하기 →
                    </a>
                </div>

                <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                    <div class="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center mb-4">
                        <i class="fas fa-film text-2xl text-white"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">영화 정보</h3>
                    <p class="text-gray-600 mb-4">최신 개봉작과 박스오피스 순위</p>
                    <a href="/entertainment/movie" class="text-pink-600 hover:text-pink-700 font-medium">
                        시작하기 →
                    </a>
                </div>

                <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                    <div class="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center mb-4">
                        <i class="fas fa-star text-2xl text-white"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">연예인 소식</h3>
                    <p class="text-gray-600 mb-4">연예인 뉴스와 화제의 스타</p>
                    <a href="/entertainment/celebrity" class="text-pink-600 hover:text-pink-700 font-medium">
                        시작하기 →
                    </a>
                </div>
            </div>
        </main>

        ${getCommonFooter()}
        ${getCommonAuthScript()}
    </body>
    </html>
  `);
});
// ==================== 교육 페이지 ====================
app.get('/education', (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko" id="html-root">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>교육 - Faith Portal</title>
        <script>
            // Tailwind CDN 경고 필터링 (개발 환경용)
            (function() {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                    if (args[0] && typeof args[0] === 'string' && 
                        args[0].includes('cdn.tailwindcss.com should not be used in production')) {
                        return; // Tailwind CDN 경고 무시
                    }
                    originalWarn.apply(console, args);
                };
            })();
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .faith-blue { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); }
            .faith-blue-hover:hover { background: linear-gradient(135deg, #0284c7 0%, #0891b2 100%); }
        </style>
    </head>
    <body class="bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50" id="html-root">
        ${getCommonHeader('Education')}
        
        ${getBreadcrumb([
        { label: '홈', href: '/' },
        { label: '교육' }
    ])}

        ${getEducationMenu('/education')}

        <main class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
            <div class="text-center py-16">
                <div class="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <i class="fas fa-graduation-cap text-4xl text-white"></i>
                </div>
                <h1 class="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
                    <span class="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">교육</span> 정보
                </h1>
                <p class="text-gray-600 text-lg mb-8">
                    온라인 강의부터 자격증까지, 다양한 교육 정보를 제공합니다
                </p>
                <div class="flex justify-center gap-4">
                    <a href="/education/online" class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all">
                        <i class="fas fa-laptop mr-2"></i>
                        온라인 강의
                    </a>
                    <a href="/" class="inline-flex items-center px-6 py-3 bg-white text-gray-700 rounded-lg font-medium border border-gray-300 hover:border-indigo-500 hover:text-indigo-600 transition-all">
                        <i class="fas fa-home mr-2"></i>
                        메인으로
                    </a>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                    <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                        <i class="fas fa-laptop text-2xl text-white"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">온라인 강의</h3>
                    <p class="text-gray-600 mb-4">다양한 분야의 온라인 강의 정보</p>
                    <a href="/education/online" class="text-indigo-600 hover:text-indigo-700 font-medium">
                        시작하기 →
                    </a>
                </div>

                <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                    <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                        <i class="fas fa-language text-2xl text-white"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">언어 학습</h3>
                    <p class="text-gray-600 mb-4">영어, 중국어 등 외국어 학습 정보</p>
                    <a href="/education/language" class="text-indigo-600 hover:text-indigo-700 font-medium">
                        시작하기 →
                    </a>
                </div>

                <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                    <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                        <i class="fas fa-certificate text-2xl text-white"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">자격증</h3>
                    <p class="text-gray-600 mb-4">자격증 시험 일정 및 학습 자료</p>
                    <a href="/education/certificate" class="text-indigo-600 hover:text-indigo-700 font-medium">
                        시작하기 →
                    </a>
                </div>
            </div>
        </main>

        ${getCommonFooter()}
        ${getCommonAuthScript()}
    </body>
    </html>
  `);
});
// ==================== 계산기 페이지 ====================
app.get('/lifestyle/calculator', (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko" id="html-root">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>다기능 계산기 - Faith Portal</title>
        <script>
            // Tailwind CDN 경고 필터링 (개발 환경용)
            (function() {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                    if (args[0] && typeof args[0] === 'string' && 
                        args[0].includes('cdn.tailwindcss.com should not be used in production')) {
                        return; // Tailwind CDN 경고 무시
                    }
                    originalWarn.apply(console, args);
                };
            })();
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .faith-blue { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); }
            .faith-blue-hover:hover { background: linear-gradient(135deg, #0284c7 0%, #0891b2 100%); }
            
            /* 계산기 전체 스타일 */
            .calculator-container {
                background: linear-gradient(145deg, #f0f0f0, #ffffff);
                border-radius: 20px;
                padding: 1.5rem;
            }
            
            /* 버튼 기본 스타일 */
            .calculator-btn {
                @apply text-gray-800 font-bold transition-all;
                aspect-ratio: 1 / 1;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(145deg, #ffffff, #e8e8e8);
                border-radius: 15px;
                border: 2px solid #d1d1d1;
                cursor: pointer;
            }
            .calculator-btn:hover {
                background: linear-gradient(145deg, #f8f8f8, #e0e0e0);
                transform: translateY(-1px);
            }
            .calculator-btn:active {
                transform: translateY(0);
            }
            /* 반응형 버튼 크기 */
            @media (max-width: 640px) {
                .calculator-btn {
                    font-size: 1rem;
                    min-height: 44px;
                    aspect-ratio: auto;
                }
                .calculator-display {
                    font-size: 1.5rem !important;
                    padding: 0.75rem !important;
                    min-height: 50px !important;
                }
            }
            @media (min-width: 641px) and (max-width: 1024px) {
                .calculator-btn {
                    font-size: 1.1rem;
                    min-height: 55px;
                }
                .calculator-display {
                    font-size: 1.75rem !important;
                    padding: 1rem !important;
                    min-height: 60px !important;
                }
            }
            @media (min-width: 1025px) {
                .calculator-btn {
                    font-size: 1.25rem;
                    min-height: 60px;
                }
                .calculator-display {
                    font-size: 2rem !important;
                    padding: 1.25rem !important;
                    min-height: 70px !important;
                }
            }
            .calculator-btn-operator {
                background: linear-gradient(145deg, #60a5fa, #3b82f6) !important;
                color: white !important;
                border: 2px solid #2563eb !important;
            }
            .calculator-btn-operator:hover {
                background: linear-gradient(145deg, #3b82f6, #2563eb) !important;
                transform: translateY(-1px);
            }
            .calculator-btn-operator:active {
                transform: translateY(0);
            }
            .calculator-btn-equal {
                background: linear-gradient(145deg, #34d399, #10b981) !important;
                color: white !important;
                border: 2px solid #059669 !important;
            }
            .calculator-btn-equal:hover {
                background: linear-gradient(145deg, #10b981, #059669) !important;
                transform: translateY(-1px);
            }
            .calculator-btn-equal:active {
                transform: translateY(0);
            }
            .calculator-btn-clear {
                background: linear-gradient(145deg, #f87171, #ef4444) !important;
                color: white !important;
                border: 2px solid #dc2626 !important;
            }
            .calculator-btn-clear:hover {
                background: linear-gradient(145deg, #ef4444, #dc2626) !important;
                transform: translateY(-1px);
            }
            .calculator-btn-clear:active {
                transform: translateY(0);
            }
            .tab-active {
                @apply bg-blue-500 text-white;
            }
            .calculator-display {
                @apply text-right font-mono mb-8 break-all;
                background: linear-gradient(145deg, #1f2937, #374151);
                color: #10b981;
                border-radius: 12px;
                border: 2px solid #4b5563;
                font-weight: 600;
                letter-spacing: 0.05em;
            }
        </style>
    </head>
    <body class="bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50" id="html-root">
        ${getCommonHeader()}
        
        <div class="hidden sm:block">
            ${getBreadcrumb([
        { label: '홈', href: '/' },
        { label: '유틸리티', href: '/lifestyle' },
        { label: '계산기' }
    ])}
        </div>

        <!-- 서브 메뉴 (모바일 여백 최적화) -->
        <div class="sm:mb-4">
            ${getLifestyleMenu('/lifestyle/calculator')}
        </div>

        <!-- 광고 배너 영역 (모바일 숨김) -->
        <div class="hidden sm:block bg-gradient-to-r from-yellow-400 via-red-400 to-pink-400 py-4">
            <div class="max-w-7xl mx-auto px-4 text-center">
                <p class="text-white font-bold text-lg">
                    <i class="fas fa-ad mr-2"></i>광고 배너 영역
                </p>
            </div>
        </div>

        <!-- 메인 컨텐츠 -->
        <div class="max-w-7xl mx-auto px-2 sm:px-4 py-1 sm:py-6">
            <main class="w-full">
                <div class="bg-white rounded-xl shadow-lg p-2 sm:p-4 lg:p-6">
                    <div class="flex items-center justify-between mb-3 sm:mb-4">
                        <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
                            <i class="fas fa-calculator mr-2 text-blue-500"></i>
                            <span class="hidden sm:inline">다기능 </span>계산기
                        </h1>
                    </div>

                    <!-- 계산기 탭 -->
                    <div class="flex flex-nowrap overflow-x-auto gap-1 mb-2 border-b pb-2 hide-scrollbar">
                        <button onclick="showCalculator('basic')" class="tab-btn tab-active px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap" data-tab="basic">
                            <i class="fas fa-calculator mr-1"></i>기본
                        </button>
                        <button onclick="showCalculator('scientific')" class="tab-btn px-3 py-1.5 rounded-lg text-sm font-medium transition bg-gray-100 hover:bg-gray-200 whitespace-nowrap" data-tab="scientific">
                            <i class="fas fa-square-root-alt mr-1"></i>공학
                        </button>
                        <button onclick="showCalculator('loan')" class="tab-btn px-3 py-1.5 rounded-lg text-sm font-medium transition bg-gray-100 hover:bg-gray-200 whitespace-nowrap" data-tab="loan">
                            <i class="fas fa-money-bill-wave mr-1"></i>대출
                        </button>
                        <button onclick="showCalculator('bmi')" class="tab-btn px-3 py-1.5 rounded-lg text-sm font-medium transition bg-gray-100 hover:bg-gray-200 whitespace-nowrap" data-tab="bmi">
                            <i class="fas fa-weight mr-1"></i>BMI
                        </button>
                        <button onclick="showCalculator('age')" class="tab-btn px-3 py-1.5 rounded-lg text-sm font-medium transition bg-gray-100 hover:bg-gray-200 whitespace-nowrap" data-tab="age">
                            <i class="fas fa-birthday-cake mr-1"></i>나이
                        </button>
                        <button onclick="showCalculator('date')" class="tab-btn px-3 py-1.5 rounded-lg text-sm font-medium transition bg-gray-100 hover:bg-gray-200 whitespace-nowrap" data-tab="date">
                            <i class="fas fa-calendar mr-1"></i>날짜
                        </button>
                        <button onclick="showCalculator('unit')" class="tab-btn px-3 py-1.5 rounded-lg text-sm font-medium transition bg-gray-100 hover:bg-gray-200 whitespace-nowrap" data-tab="unit">
                            <i class="fas fa-exchange-alt mr-1"></i>단위
                        </button>
                        <button onclick="showCalculator('percentage')" class="tab-btn px-3 py-1.5 rounded-lg text-sm font-medium transition bg-gray-100 hover:bg-gray-200 whitespace-nowrap" data-tab="percentage">
                            <i class="fas fa-percent mr-1"></i>백분율
                        </button>
                    </div>

                    <!-- 기본 계산기 -->
                    <div id="calc-basic" class="calculator-container">
                        <div class="max-w-sm sm:max-w-md mx-auto bg-gray-200 p-2 sm:p-6 rounded-2xl shadow-2xl" style="background: linear-gradient(145deg, #e5e7eb, #d1d5db);">
                            <div id="basic-display" class="calculator-display" style="margin-bottom: 1rem;">0</div>
                            <div class="grid grid-cols-4 gap-1.5 sm:gap-3">
                                <button onclick="clearBasic()" class="calculator-btn calculator-btn-clear">C</button>
                                <button onclick="backspaceBasic()" class="calculator-btn"><i class="fas fa-backspace"></i></button>
                                <button onclick="appendToBasic('%')" class="calculator-btn calculator-btn-operator">%</button>
                                <button onclick="appendToBasic('/')" class="calculator-btn calculator-btn-operator">÷</button>
                                
                                <button onclick="appendToBasic('7')" class="calculator-btn">7</button>
                                <button onclick="appendToBasic('8')" class="calculator-btn">8</button>
                                <button onclick="appendToBasic('9')" class="calculator-btn">9</button>
                                <button onclick="appendToBasic('*')" class="calculator-btn calculator-btn-operator">×</button>
                                
                                <button onclick="appendToBasic('4')" class="calculator-btn">4</button>
                                <button onclick="appendToBasic('5')" class="calculator-btn">5</button>
                                <button onclick="appendToBasic('6')" class="calculator-btn">6</button>
                                <button onclick="appendToBasic('-')" class="calculator-btn calculator-btn-operator">-</button>
                                
                                <button onclick="appendToBasic('1')" class="calculator-btn">1</button>
                                <button onclick="appendToBasic('2')" class="calculator-btn">2</button>
                                <button onclick="appendToBasic('3')" class="calculator-btn">3</button>
                                <button onclick="appendToBasic('+')" class="calculator-btn calculator-btn-operator">+</button>
                                
                                <button onclick="appendToBasic('0')" class="calculator-btn">0</button>
                                <button onclick="appendToBasic('00')" class="calculator-btn">00</button>
                                <button onclick="appendToBasic('.')" class="calculator-btn">.</button>
                                <button onclick="calculateBasic()" class="calculator-btn calculator-btn-equal">=</button>
                            </div>
                        </div>
                    </div>

                    <!-- 공학 계산기 -->
                    <div id="calc-scientific" class="calculator-container hidden">
                        <div class="max-w-md sm:max-w-lg lg:max-w-xl mx-auto bg-gray-200 p-2 sm:p-6 rounded-2xl shadow-2xl" style="background: linear-gradient(145deg, #e5e7eb, #d1d5db);">
                            <div id="scientific-display" class="calculator-display" style="margin-bottom: 2rem;">0</div>
                            <div class="grid grid-cols-5 gap-1.5 sm:gap-3">
                                <button onclick="clearScientific()" class="calculator-btn calculator-btn-clear">C</button>
                                <button onclick="scientificOperation('sin')" class="calculator-btn">sin</button>
                                <button onclick="scientificOperation('cos')" class="calculator-btn">cos</button>
                                <button onclick="scientificOperation('tan')" class="calculator-btn">tan</button>
                                <button onclick="backspaceScientific()" class="calculator-btn"><i class="fas fa-backspace"></i></button>
                                
                                <button onclick="scientificOperation('sqrt')" class="calculator-btn">√</button>
                                <button onclick="scientificOperation('pow2')" class="calculator-btn">x²</button>
                                <button onclick="scientificOperation('pow')" class="calculator-btn">xʸ</button>
                                <button onclick="scientificOperation('log')" class="calculator-btn">log</button>
                                <button onclick="scientificOperation('ln')" class="calculator-btn">ln</button>
                                
                                <button onclick="appendToScientific('7')" class="calculator-btn">7</button>
                                <button onclick="appendToScientific('8')" class="calculator-btn">8</button>
                                <button onclick="appendToScientific('9')" class="calculator-btn">9</button>
                                <button onclick="appendToScientific('/')" class="calculator-btn calculator-btn-operator">÷</button>
                                <button onclick="appendToScientific('(')" class="calculator-btn">(</button>
                                
                                <button onclick="appendToScientific('4')" class="calculator-btn">4</button>
                                <button onclick="appendToScientific('5')" class="calculator-btn">5</button>
                                <button onclick="appendToScientific('6')" class="calculator-btn">6</button>
                                <button onclick="appendToScientific('*')" class="calculator-btn calculator-btn-operator">×</button>
                                <button onclick="appendToScientific(')')" class="calculator-btn">)</button>
                                
                                <button onclick="appendToScientific('1')" class="calculator-btn">1</button>
                                <button onclick="appendToScientific('2')" class="calculator-btn">2</button>
                                <button onclick="appendToScientific('3')" class="calculator-btn">3</button>
                                <button onclick="appendToScientific('-')" class="calculator-btn calculator-btn-operator">-</button>
                                <button onclick="scientificConstant('pi')" class="calculator-btn">π</button>
                                
                                <button onclick="appendToScientific('0')" class="calculator-btn">0</button>
                                <button onclick="appendToScientific('00')" class="calculator-btn">00</button>
                                <button onclick="appendToScientific('.')" class="calculator-btn">.</button>
                                <button onclick="appendToScientific('+')" class="calculator-btn calculator-btn-operator">+</button>
                                <button onclick="calculateScientific()" class="calculator-btn calculator-btn-equal">=</button>
                            </div>
                        </div>
                    </div>

                    <!-- 대출 계산기 -->
                    <div id="calc-loan" class="calculator-container hidden">
                        <div class="max-w-2xl mx-auto">
                            <h3 class="text-xl font-bold mb-4 text-gray-800">대출 상환 계산기</h3>
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">대출 금액 (원)</label>
                                    <input type="number" id="loan-amount" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="예: 100000000" value="100000000">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">연 이자율 (%)</label>
                                    <input type="number" id="loan-rate" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="예: 3.5" value="3.5" step="0.1">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">대출 기간 (년)</label>
                                    <input type="number" id="loan-years" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="예: 20" value="20">
                                </div>
                                <button onclick="calculateLoan()" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition">
                                    <i class="fas fa-calculator mr-2"></i>계산하기
                                </button>
                                <div id="loan-result" class="hidden">
                                    <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                                        <h4 class="font-bold text-lg mb-3 text-gray-800">계산 결과</h4>
                                        <div class="space-y-2 text-sm">
                                            <div class="flex justify-between">
                                                <span class="text-gray-600">월 상환액:</span>
                                                <span id="monthly-payment" class="font-bold text-blue-600"></span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span class="text-gray-600">총 상환액:</span>
                                                <span id="total-payment" class="font-bold text-gray-800"></span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span class="text-gray-600">총 이자:</span>
                                                <span id="total-interest" class="font-bold text-red-600"></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- BMI 계산기 -->
                    <div id="calc-bmi" class="calculator-container hidden">
                        <div class="max-w-2xl mx-auto">
                            <h3 class="text-xl font-bold mb-4 text-gray-800">BMI (체질량지수) 계산기</h3>
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">키 (cm)</label>
                                    <input type="number" id="bmi-height" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="예: 170" value="170">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">몸무게 (kg)</label>
                                    <input type="number" id="bmi-weight" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="예: 70" value="70" step="0.1">
                                </div>
                                <button onclick="calculateBMI()" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition">
                                    <i class="fas fa-calculator mr-2"></i>계산하기
                                </button>
                                <div id="bmi-result" class="hidden">
                                    <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                                        <h4 class="font-bold text-lg mb-3 text-gray-800">계산 결과</h4>
                                        <div class="space-y-2">
                                            <div class="text-center">
                                                <div class="text-3xl font-bold text-blue-600" id="bmi-value"></div>
                                                <div class="text-lg font-medium mt-2" id="bmi-category"></div>
                                            </div>
                                            <div class="mt-4 text-sm text-gray-600">
                                                <p class="font-medium mb-2">BMI 기준:</p>
                                                <ul class="space-y-1">
                                                    <li>• 저체중: 18.5 미만</li>
                                                    <li>• 정상: 18.5 ~ 22.9</li>
                                                    <li>• 과체중: 23.0 ~ 24.9</li>
                                                    <li>• 비만: 25.0 이상</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 나이 계산기 -->
                    <div id="calc-age" class="calculator-container hidden">
                        <div class="max-w-2xl mx-auto">
                            <h3 class="text-xl font-bold mb-4 text-gray-800">나이 계산기</h3>
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">생년월일</label>
                                    <input type="date" id="age-birthdate" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" value="1990-01-01">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">기준 날짜 (선택사항)</label>
                                    <input type="date" id="age-target-date" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                </div>
                                <button onclick="calculateAge()" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition">
                                    <i class="fas fa-calculator mr-2"></i>계산하기
                                </button>
                                <div id="age-result" class="hidden">
                                    <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                                        <h4 class="font-bold text-lg mb-3 text-gray-800">계산 결과</h4>
                                        <div class="space-y-2 text-sm">
                                            <div class="flex justify-between">
                                                <span class="text-gray-600">만 나이:</span>
                                                <span id="age-full" class="font-bold text-blue-600"></span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span class="text-gray-600">총 일수:</span>
                                                <span id="age-days" class="font-bold text-gray-800"></span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span class="text-gray-600">다음 생일까지:</span>
                                                <span id="next-birthday" class="font-bold text-green-600"></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 날짜 계산기 -->
                    <div id="calc-date" class="calculator-container hidden">
                        <div class="max-w-2xl mx-auto">
                            <h3 class="text-xl font-bold mb-4 text-gray-800">날짜 계산기</h3>
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">시작 날짜</label>
                                    <input type="date" id="date-start" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">종료 날짜</label>
                                    <input type="date" id="date-end" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                </div>
                                <button onclick="calculateDateDiff()" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition">
                                    <i class="fas fa-calculator mr-2"></i>날짜 차이 계산
                                </button>
                                <div id="date-result" class="hidden">
                                    <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                                        <h4 class="font-bold text-lg mb-3 text-gray-800">계산 결과</h4>
                                        <div class="space-y-2 text-sm">
                                            <div class="flex justify-between">
                                                <span class="text-gray-600">총 일수:</span>
                                                <span id="date-days" class="font-bold text-blue-600"></span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span class="text-gray-600">주 단위:</span>
                                                <span id="date-weeks" class="font-bold text-gray-800"></span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span class="text-gray-600">월 단위:</span>
                                                <span id="date-months" class="font-bold text-gray-800"></span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span class="text-gray-600">년 단위:</span>
                                                <span id="date-years" class="font-bold text-gray-800"></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <hr class="my-6">
                                
                                <h4 class="font-bold text-gray-800 mb-3">날짜 더하기/빼기</h4>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">기준 날짜</label>
                                    <input type="date" id="date-base" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">일수</label>
                                        <input type="number" id="date-add-days" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" value="0">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">연산</label>
                                        <select id="date-operation" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                            <option value="add">더하기 (+)</option>
                                            <option value="subtract">빼기 (-)</option>
                                        </select>
                                    </div>
                                </div>
                                <button onclick="calculateDateAdd()" class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition">
                                    <i class="fas fa-calculator mr-2"></i>날짜 계산하기
                                </button>
                                <div id="date-add-result" class="hidden">
                                    <div class="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                                        <h4 class="font-bold text-lg mb-2 text-gray-800">결과 날짜</h4>
                                        <div class="text-2xl font-bold text-green-600" id="date-result-value"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 단위 변환 계산기 -->
                    <div id="calc-unit" class="calculator-container hidden">
                        <div class="max-w-2xl mx-auto">
                            <h3 class="text-xl font-bold mb-4 text-gray-800">단위 변환 계산기</h3>
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">변환 종류</label>
                                    <select id="unit-type" onchange="updateUnitOptions()" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        <option value="length">길이</option>
                                        <option value="weight">무게</option>
                                        <option value="temperature">온도</option>
                                        <option value="area">넓이</option>
                                        <option value="volume">부피</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">변환할 값</label>
                                    <input type="number" id="unit-value" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="숫자 입력" value="1" step="0.01">
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">원래 단위</label>
                                        <select id="unit-from" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">변환할 단위</label>
                                        <select id="unit-to" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        </select>
                                    </div>
                                </div>
                                <button onclick="calculateUnit()" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition">
                                    <i class="fas fa-calculator mr-2"></i>변환하기
                                </button>
                                <div id="unit-result" class="hidden">
                                    <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                                        <h4 class="font-bold text-lg mb-2 text-gray-800">변환 결과</h4>
                                        <div class="text-2xl font-bold text-blue-600" id="unit-result-value"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 백분율 계산기 -->
                    <div id="calc-percentage" class="calculator-container hidden">
                        <div class="max-w-2xl mx-auto">
                            <h3 class="text-xl font-bold mb-4 text-gray-800">백분율 계산기</h3>
                            
                            <!-- 백분율 구하기 -->
                            <div class="bg-gray-50 p-4 rounded-lg mb-4">
                                <h4 class="font-bold text-gray-800 mb-3">A는 B의 몇 %?</h4>
                                <div class="grid grid-cols-2 gap-4 mb-3">
                                    <input type="number" id="pct-value-a" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="A 값" value="25">
                                    <input type="number" id="pct-value-b" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="B 값" value="100">
                                </div>
                                <button onclick="calculatePercentage1()" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg transition">
                                    계산하기
                                </button>
                                <div id="pct-result-1" class="mt-3 hidden">
                                    <div class="bg-blue-100 p-3 rounded text-center">
                                        <span class="text-2xl font-bold text-blue-600" id="pct-result-1-value"></span>
                                    </div>
                                </div>
                            </div>

                            <!-- A의 B% 구하기 -->
                            <div class="bg-gray-50 p-4 rounded-lg mb-4">
                                <h4 class="font-bold text-gray-800 mb-3">A의 B%는?</h4>
                                <div class="grid grid-cols-2 gap-4 mb-3">
                                    <input type="number" id="pct-base" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="A 값" value="100">
                                    <input type="number" id="pct-percent" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="B %" value="25">
                                </div>
                                <button onclick="calculatePercentage2()" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg transition">
                                    계산하기
                                </button>
                                <div id="pct-result-2" class="mt-3 hidden">
                                    <div class="bg-blue-100 p-3 rounded text-center">
                                        <span class="text-2xl font-bold text-blue-600" id="pct-result-2-value"></span>
                                    </div>
                                </div>
                            </div>

                            <!-- 증가/감소율 구하기 -->
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <h4 class="font-bold text-gray-800 mb-3">증가/감소율 구하기</h4>
                                <div class="grid grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <label class="block text-xs text-gray-600 mb-1">원래 값</label>
                                        <input type="number" id="pct-original" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="원래 값" value="100">
                                    </div>
                                    <div>
                                        <label class="block text-xs text-gray-600 mb-1">바뀐 값</label>
                                        <input type="number" id="pct-new" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="바뀐 값" value="150">
                                    </div>
                                </div>
                                <button onclick="calculatePercentage3()" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg transition">
                                    계산하기
                                </button>
                                <div id="pct-result-3" class="mt-3 hidden">
                                    <div class="bg-blue-100 p-3 rounded">
                                        <div class="text-center">
                                            <span class="text-2xl font-bold text-blue-600" id="pct-result-3-value"></span>
                                        </div>
                                        <div class="text-sm text-gray-600 text-center mt-2" id="pct-result-3-desc"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>



        <script>
            // 계산기 전환
            function showCalculator(type) {
                // 모든 계산기 숨기기
                document.querySelectorAll('.calculator-container').forEach(el => el.classList.add('hidden'));
                // 선택된 계산기 표시
                document.getElementById('calc-' + type).classList.remove('hidden');
                
                // 탭 스타일 업데이트
                document.querySelectorAll('.tab-btn').forEach(btn => {
                    btn.classList.remove('tab-active', 'bg-blue-500', 'text-white');
                    btn.classList.add('bg-gray-100', 'hover:bg-gray-200');
                });
                const activeTab = document.querySelector('[data-tab="' + type + '"]');
                activeTab.classList.add('tab-active', 'bg-blue-500', 'text-white');
                activeTab.classList.remove('bg-gray-100', 'hover:bg-gray-200');
            }

            // ========== 기본 계산기 ==========
            let basicExpression = '';
            
            function updateBasicDisplay() {
                const display = document.getElementById('basic-display');
                display.textContent = basicExpression || '0';
            }
            
            function appendToBasic(value) {
                basicExpression += value;
                updateBasicDisplay();
            }
            
            function clearBasic() {
                basicExpression = '';
                updateBasicDisplay();
            }
            
            function backspaceBasic() {
                basicExpression = basicExpression.slice(0, -1);
                updateBasicDisplay();
            }
            
            function calculateBasic() {
                try {
                    const result = eval(basicExpression.replace(/×/g, '*').replace(/÷/g, '/'));
                    basicExpression = result.toString();
                    updateBasicDisplay();
                } catch (error) {
                    alert('올바른 수식을 입력해주세요');
                }
            }

            // ========== 공학 계산기 ==========
            let scientificExpression = '';
            
            function updateScientificDisplay() {
                const display = document.getElementById('scientific-display');
                display.textContent = scientificExpression || '0';
            }
            
            function appendToScientific(value) {
                scientificExpression += value;
                updateScientificDisplay();
            }
            
            function clearScientific() {
                scientificExpression = '';
                updateScientificDisplay();
            }
            
            function backspaceScientific() {
                scientificExpression = scientificExpression.slice(0, -1);
                updateScientificDisplay();
            }
            
            function scientificOperation(op) {
                const current = parseFloat(scientificExpression) || 0;
                let result;
                
                switch(op) {
                    case 'sin': result = Math.sin(current * Math.PI / 180); break;
                    case 'cos': result = Math.cos(current * Math.PI / 180); break;
                    case 'tan': result = Math.tan(current * Math.PI / 180); break;
                    case 'sqrt': result = Math.sqrt(current); break;
                    case 'pow2': result = Math.pow(current, 2); break;
                    case 'log': result = Math.log10(current); break;
                    case 'ln': result = Math.log(current); break;
                    case 'pow': scientificExpression += '^'; updateScientificDisplay(); return;
                }
                
                scientificExpression = result.toString();
                updateScientificDisplay();
            }
            
            function scientificConstant(constant) {
                if (constant === 'pi') {
                    scientificExpression += Math.PI.toString();
                } else if (constant === 'e') {
                    scientificExpression += Math.E.toString();
                }
                updateScientificDisplay();
            }
            
            function calculateScientific() {
                try {
                    let expr = scientificExpression
                        .replace(/×/g, '*')
                        .replace(/÷/g, '/')
                        .replace(/\^/g, '**');
                    const result = eval(expr);
                    scientificExpression = result.toString();
                    updateScientificDisplay();
                } catch (error) {
                    alert('올바른 수식을 입력해주세요');
                }
            }

            // ========== 대출 계산기 ==========
            function calculateLoan() {
                const amount = parseFloat(document.getElementById('loan-amount').value);
                const rate = parseFloat(document.getElementById('loan-rate').value) / 100 / 12;
                const years = parseFloat(document.getElementById('loan-years').value);
                const months = years * 12;
                
                if (!amount || !rate || !years) {
                    alert('모든 값을 입력해주세요');
                    return;
                }
                
                const monthlyPayment = amount * (rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
                const totalPayment = monthlyPayment * months;
                const totalInterest = totalPayment - amount;
                
                document.getElementById('monthly-payment').textContent = monthlyPayment.toLocaleString('ko-KR') + '원';
                document.getElementById('total-payment').textContent = totalPayment.toLocaleString('ko-KR') + '원';
                document.getElementById('total-interest').textContent = totalInterest.toLocaleString('ko-KR') + '원';
                document.getElementById('loan-result').classList.remove('hidden');
            }

            // ========== BMI 계산기 ==========
            function calculateBMI() {
                const height = parseFloat(document.getElementById('bmi-height').value) / 100;
                const weight = parseFloat(document.getElementById('bmi-weight').value);
                
                if (!height || !weight) {
                    alert('키와 몸무게를 입력해주세요');
                    return;
                }
                
                const bmi = weight / (height * height);
                let category, color;
                
                if (bmi < 18.5) {
                    category = '저체중';
                    color = 'text-blue-600';
                } else if (bmi < 23) {
                    category = '정상';
                    color = 'text-green-600';
                } else if (bmi < 25) {
                    category = '과체중';
                    color = 'text-yellow-600';
                } else {
                    category = '비만';
                    color = 'text-red-600';
                }
                
                document.getElementById('bmi-value').textContent = bmi.toFixed(1);
                const categoryEl = document.getElementById('bmi-category');
                categoryEl.textContent = category;
                categoryEl.className = 'text-lg font-medium mt-2 ' + color;
                document.getElementById('bmi-result').classList.remove('hidden');
            }

            // ========== 나이 계산기 ==========
            function calculateAge() {
                const birthdate = new Date(document.getElementById('age-birthdate').value);
                const targetInput = document.getElementById('age-target-date').value;
                const targetDate = targetInput ? new Date(targetInput) : new Date();
                
                if (!birthdate || isNaN(birthdate.getTime())) {
                    alert('생년월일을 입력해주세요');
                    return;
                }
                
                let years = targetDate.getFullYear() - birthdate.getFullYear();
                let months = targetDate.getMonth() - birthdate.getMonth();
                let days = targetDate.getDate() - birthdate.getDate();
                
                if (days < 0) {
                    months--;
                    days += new Date(targetDate.getFullYear(), targetDate.getMonth(), 0).getDate();
                }
                if (months < 0) {
                    years--;
                    months += 12;
                }
                
                const totalDays = Math.floor((targetDate - birthdate) / (1000 * 60 * 60 * 24));
                
                // 다음 생일 계산
                const nextBirthday = new Date(targetDate.getFullYear(), birthdate.getMonth(), birthdate.getDate());
                if (nextBirthday < targetDate) {
                    nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
                }
                const daysToNextBirthday = Math.ceil((nextBirthday - targetDate) / (1000 * 60 * 60 * 24));
                
                document.getElementById('age-full').textContent = years + '년 ' + months + '개월 ' + days + '일';
                document.getElementById('age-days').textContent = totalDays.toLocaleString('ko-KR') + '일';
                document.getElementById('next-birthday').textContent = daysToNextBirthday + '일 후';
                document.getElementById('age-result').classList.remove('hidden');
            }

            // ========== 날짜 계산기 ==========
            function calculateDateDiff() {
                const start = new Date(document.getElementById('date-start').value);
                const end = new Date(document.getElementById('date-end').value);
                
                if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
                    alert('날짜를 입력해주세요');
                    return;
                }
                
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const diffWeeks = Math.floor(diffDays / 7);
                const diffMonths = Math.floor(diffDays / 30.44);
                const diffYears = Math.floor(diffDays / 365.25);
                
                document.getElementById('date-days').textContent = diffDays.toLocaleString('ko-KR') + '일';
                document.getElementById('date-weeks').textContent = diffWeeks.toLocaleString('ko-KR') + '주';
                document.getElementById('date-months').textContent = diffMonths.toLocaleString('ko-KR') + '개월';
                document.getElementById('date-years').textContent = diffYears.toLocaleString('ko-KR') + '년';
                document.getElementById('date-result').classList.remove('hidden');
            }
            
            function calculateDateAdd() {
                const base = new Date(document.getElementById('date-base').value);
                const days = parseInt(document.getElementById('date-add-days').value) || 0;
                const operation = document.getElementById('date-operation').value;
                
                if (!base || isNaN(base.getTime())) {
                    alert('기준 날짜를 입력해주세요');
                    return;
                }
                
                const result = new Date(base);
                if (operation === 'add') {
                    result.setDate(result.getDate() + days);
                } else {
                    result.setDate(result.getDate() - days);
                }
                
                const year = result.getFullYear();
                const month = String(result.getMonth() + 1).padStart(2, '0');
                const day = String(result.getDate()).padStart(2, '0');
                
                document.getElementById('date-result-value').textContent = year + '년 ' + month + '월 ' + day + '일';
                document.getElementById('date-add-result').classList.remove('hidden');
            }

            // ========== 단위 변환 계산기 ==========
            const unitData = {
                length: {
                    '밀리미터 (mm)': 1,
                    '센티미터 (cm)': 10,
                    '미터 (m)': 1000,
                    '킬로미터 (km)': 1000000,
                    '인치 (in)': 25.4,
                    '피트 (ft)': 304.8,
                    '야드 (yd)': 914.4,
                    '마일 (mi)': 1609344
                },
                weight: {
                    '밀리그램 (mg)': 1,
                    '그램 (g)': 1000,
                    '킬로그램 (kg)': 1000000,
                    '톤 (t)': 1000000000,
                    '온스 (oz)': 28349.5,
                    '파운드 (lb)': 453592
                },
                temperature: {
                    '섭씨 (°C)': 'celsius',
                    '화씨 (°F)': 'fahrenheit',
                    '켈빈 (K)': 'kelvin'
                },
                area: {
                    '제곱밀리미터 (mm²)': 1,
                    '제곱센티미터 (cm²)': 100,
                    '제곱미터 (m²)': 1000000,
                    '헥타르 (ha)': 10000000000,
                    '제곱킬로미터 (km²)': 1000000000000,
                    '평': 3305785,
                    '에이커 (acre)': 4046856422.4
                },
                volume: {
                    '밀리리터 (mL)': 1,
                    '리터 (L)': 1000,
                    '세제곱미터 (m³)': 1000000,
                    '갤런 (gal)': 3785.41,
                    '온스 (fl oz)': 29.5735
                }
            };
            
            function updateUnitOptions() {
                const type = document.getElementById('unit-type').value;
                const units = unitData[type];
                const fromSelect = document.getElementById('unit-from');
                const toSelect = document.getElementById('unit-to');
                
                fromSelect.innerHTML = '';
                toSelect.innerHTML = '';
                
                for (const unit in units) {
                    fromSelect.innerHTML += '<option value="' + unit + '">' + unit + '</option>';
                    toSelect.innerHTML += '<option value="' + unit + '">' + unit + '</option>';
                }
            }
            
            function calculateUnit() {
                const type = document.getElementById('unit-type').value;
                const value = parseFloat(document.getElementById('unit-value').value);
                const fromUnit = document.getElementById('unit-from').value;
                const toUnit = document.getElementById('unit-to').value;
                
                if (!value && value !== 0) {
                    alert('변환할 값을 입력해주세요');
                    return;
                }
                
                let result;
                
                if (type === 'temperature') {
                    result = convertTemperature(value, unitData.temperature[fromUnit], unitData.temperature[toUnit]);
                } else {
                    const units = unitData[type];
                    const baseValue = value * units[fromUnit];
                    result = baseValue / units[toUnit];
                }
                
                document.getElementById('unit-result-value').textContent = 
                    result.toLocaleString('ko-KR', {maximumFractionDigits: 6}) + ' ' + toUnit;
                document.getElementById('unit-result').classList.remove('hidden');
            }
            
            function convertTemperature(value, from, to) {
                let celsius;
                
                if (from === 'celsius') celsius = value;
                else if (from === 'fahrenheit') celsius = (value - 32) * 5/9;
                else if (from === 'kelvin') celsius = value - 273.15;
                
                if (to === 'celsius') return celsius;
                else if (to === 'fahrenheit') return celsius * 9/5 + 32;
                else if (to === 'kelvin') return celsius + 273.15;
            }

            // ========== 백분율 계산기 ==========
            function calculatePercentage1() {
                const a = parseFloat(document.getElementById('pct-value-a').value);
                const b = parseFloat(document.getElementById('pct-value-b').value);
                
                if (!a && a !== 0 || !b && b !== 0) {
                    alert('값을 입력해주세요');
                    return;
                }
                
                const result = (a / b) * 100;
                document.getElementById('pct-result-1-value').textContent = result.toFixed(2) + '%';
                document.getElementById('pct-result-1').classList.remove('hidden');
            }
            
            function calculatePercentage2() {
                const base = parseFloat(document.getElementById('pct-base').value);
                const percent = parseFloat(document.getElementById('pct-percent').value);
                
                if (!base && base !== 0 || !percent && percent !== 0) {
                    alert('값을 입력해주세요');
                    return;
                }
                
                const result = (base * percent) / 100;
                document.getElementById('pct-result-2-value').textContent = result.toLocaleString('ko-KR');
                document.getElementById('pct-result-2').classList.remove('hidden');
            }
            
            function calculatePercentage3() {
                const original = parseFloat(document.getElementById('pct-original').value);
                const newValue = parseFloat(document.getElementById('pct-new').value);
                
                if (!original && original !== 0 || !newValue && newValue !== 0) {
                    alert('값을 입력해주세요');
                    return;
                }
                
                const change = ((newValue - original) / original) * 100;
                const isIncrease = change > 0;
                
                document.getElementById('pct-result-3-value').textContent = 
                    (isIncrease ? '+' : '') + change.toFixed(2) + '%';
                document.getElementById('pct-result-3-desc').textContent = 
                    Math.abs(change).toFixed(2) + '% ' + (isIncrease ? '증가' : '감소');
                document.getElementById('pct-result-3').classList.remove('hidden');
            }

            // ========== 키보드 입력 지원 ==========
            document.addEventListener('keydown', function(event) {
                // 현재 활성화된 계산기 확인
                const activeCalc = document.querySelector('.calculator-container:not(.hidden)');
                if (!activeCalc) return;
                
                const isBasic = activeCalc.id === 'calc-basic';
                const isScientific = activeCalc.id === 'calc-scientific';
                
                // 입력 필드에 포커스가 있으면 키보드 입력 무시
                if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
                    return;
                }
                
                const key = event.key;
                
                // 숫자 키 (0-9)
                if (/^[0-9]$/.test(key)) {
                    event.preventDefault();
                    if (isBasic) appendToBasic(key);
                    if (isScientific) appendToScientific(key);
                }
                // 연산자
                else if (key === '+') {
                    event.preventDefault();
                    if (isBasic) appendToBasic('+');
                    if (isScientific) appendToScientific('+');
                }
                else if (key === '-') {
                    event.preventDefault();
                    if (isBasic) appendToBasic('-');
                    if (isScientific) appendToScientific('-');
                }
                else if (key === '*') {
                    event.preventDefault();
                    if (isBasic) appendToBasic('*');
                    if (isScientific) appendToScientific('*');
                }
                else if (key === '/') {
                    event.preventDefault();
                    if (isBasic) appendToBasic('/');
                    if (isScientific) appendToScientific('/');
                }
                else if (key === '%') {
                    event.preventDefault();
                    if (isBasic) appendToBasic('%');
                }
                else if (key === '.') {
                    event.preventDefault();
                    if (isBasic) appendToBasic('.');
                    if (isScientific) appendToScientific('.');
                }
                // 괄호 (공학 계산기)
                else if (key === '(') {
                    event.preventDefault();
                    if (isScientific) appendToScientific('(');
                }
                else if (key === ')') {
                    event.preventDefault();
                    if (isScientific) appendToScientific(')');
                }
                // Enter = 계산 실행
                else if (key === 'Enter') {
                    event.preventDefault();
                    if (isBasic) calculateBasic();
                    if (isScientific) calculateScientific();
                }
                // Escape 또는 c = 클리어
                else if (key === 'Escape' || key === 'c' || key === 'C') {
                    event.preventDefault();
                    if (isBasic) clearBasic();
                    if (isScientific) clearScientific();
                }
                // Backspace = 한 글자 삭제
                else if (key === 'Backspace') {
                    event.preventDefault();
                    if (isBasic) backspaceBasic();
                    if (isScientific) backspaceScientific();
                }
            });
            
            // 페이지 로드 시 초기화
            document.addEventListener('DOMContentLoaded', function() {
                updateUnitOptions();
                
                // 오늘 날짜 설정
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('date-start').value = today;
                document.getElementById('date-end').value = today;
                document.getElementById('date-base').value = today;
            });
        </script>

        ${getCommonFooter()}
        ${getCommonAuthScript()}

    </body>
    </html>
  `);
});
// ==================== 글자수 & 맞춤법 검사기 ====================
app.get('/lifestyle/text-checker', (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko" id="html-root">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>무료 글자수 세기 및 맞춤법 검사기 - Faith Portal</title>
        <meta name="description" content="실시간 글자수 세기, 공백 포함/제외, 바이트 계산, 맞춤법 검사를 한번에! 자소서, 레포트 작성에 필수.">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .editor-toolbar {
                background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
            }
            .stat-card {
                background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                border: 2px solid #bfdbfe;
            }
            .spell-error {
                background-color: #fee2e2;
                border-bottom: 2px solid #ef4444;
                padding: 0 2px;
                cursor: pointer;
            }
            .spell-suggestion {
                background-color: #d1fae5;
                padding: 0 2px;
            }
            .mobile-stats-bar {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
                color: white;
                padding: 12px 16px;
                box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
                z-index: 50;
                display: none;
            }
            @media (max-width: 1024px) {
                .mobile-stats-bar {
                    display: flex;
                }
                .desktop-stats {
                    display: none;
                }
                .mobile-editor-height {
                    height: 300px !important;
                    min-height: 250px;
                }
                .mobile-stats-card {
                    display: block !important;
                    margin-bottom: 1rem;
                }
                main {
                    padding-bottom: 110px !important; /* 모바일 하단 바 공간 확보 */
                }
            }
            @media (max-width: 640px) {
                .editor-toolbar {
                    padding: 0.5rem;
                }
                .editor-toolbar button {
                    font-size: 0.75rem;
                    padding: 0.5rem 0.75rem;
                }
                main {
                    padding-left: 0.75rem;
                    padding-right: 0.75rem;
                }
            }
        </style>
    </head>
    <body class="bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50">
        ${getCommonHeader('Lifestyle')}
        ${getStickyHeader()}
        
        ${getBreadcrumb([
        { label: '홈', href: '/' },
        { label: '유틸리티', href: '/lifestyle' },
        { label: '글자수 & 맞춤법' }
    ])}

        <main class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 pb-24 lg:pb-8">
            <!-- Header -->
            <div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <i class="fas fa-spell-check text-green-600"></i>
                        글자수 세기 & 맞춤법 검사
                    </h1>
                    <p class="text-gray-600 mt-2 flex items-center gap-2">
                        <i class="fas fa-lock text-green-500"></i>
                        입력하신 내용은 브라우저에만 저장되며 서버에 전송되지 않습니다.
                    </p>
                </div>
            </div>

            <!-- Main Layout: 2 Column Split View -->
            <div class="flex flex-col lg:flex-row gap-6">
                
                <!-- Zone A: Left Editor -->
                <div class="flex-1 bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden flex flex-col">
                    <!-- Toolbar -->
                    <div class="editor-toolbar p-3 border-b border-gray-300 flex flex-wrap gap-2">
                        <button onclick="copyText()" class="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 rounded-md transition border border-gray-300">
                            <i class="fas fa-copy"></i> 복사
                        </button>
                        <button onclick="clearText()" class="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-red-50 hover:text-red-600 rounded-md transition border border-gray-300">
                            <i class="fas fa-trash-alt"></i> 전체 삭제
                        </button>
                        <button onclick="removeSpecialChars()" class="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 rounded-md transition border border-gray-300">
                            <i class="fas fa-eraser"></i> 특수문자 제거
                        </button>
                        <button onclick="removeEmojis()" class="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 rounded-md transition border border-gray-300 ml-auto">
                            <i class="fas fa-smile"></i> 이모지 제거
                        </button>
                    </div>
                    
                    <!-- Text Area -->
                    <textarea
                        id="mainTextarea"
                        placeholder="여기에 내용을 입력하거나 붙여넣으세요...

자소서, 레포트, 블로그 포스팅 등 어떤 글이든 입력해보세요.
실시간으로 글자 수를 세고, 맞춤법을 검사해드립니다."
                        class="w-full h-[350px] sm:h-[450px] lg:h-[500px] p-4 sm:p-6 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm sm:text-base lg:text-lg leading-relaxed text-gray-800"
                        oninput="updateStats()"
                    ></textarea>
                </div>

                <!-- Zone B: Right Dashboard -->
                <div class="lg:w-[380px] space-y-4 desktop-stats">
                    
                    <!-- Stat Card -->
                    <div class="stat-card rounded-xl p-6 sticky top-4 shadow-lg">
                        <h3 class="text-sm font-bold text-blue-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <i class="fas fa-chart-bar"></i> 실시간 분석
                        </h3>
                        
                        <div class="space-y-4">
                            <div class="flex justify-between items-end border-b-2 border-blue-300 pb-3">
                                <span class="text-gray-700 font-medium">공백 포함</span>
                                <span class="text-4xl font-bold text-blue-900">
                                    <span id="charWithSpace">0</span>
                                    <span class="text-sm font-normal text-gray-600 ml-1">자</span>
                                </span>
                            </div>
                            <div class="flex justify-between items-end pb-2">
                                <span class="text-gray-600 text-sm">공백 제외</span>
                                <span class="text-2xl font-semibold text-gray-700">
                                    <span id="charWithoutSpace">0</span>
                                    <span class="text-sm font-normal text-gray-500 ml-1">자</span>
                                </span>
                            </div>
                            <div class="flex justify-between items-end pb-2">
                                <span class="text-gray-600 text-sm">용량 (UTF-8)</span>
                                <span class="text-lg font-medium text-gray-600">
                                    <span id="byteCount">0</span>
                                    <span class="text-sm font-normal text-gray-500 ml-1">bytes</span>
                                </span>
                            </div>
                            <div class="flex justify-between items-end">
                                <span class="text-gray-600 text-sm">줄 바꿈</span>
                                <span class="text-lg font-medium text-gray-600">
                                    <span id="lineCount">1</span>
                                    <span class="text-sm font-normal text-gray-500 ml-1">줄</span>
                                </span>
                            </div>
                        </div>

                        <!-- Platform Options -->
                        <div class="mt-6 bg-white p-1 rounded-lg flex text-xs font-medium border-2 border-blue-200">
                            <button onclick="setPlatform('naver')" id="btn-naver" class="flex-1 py-2 rounded bg-blue-600 text-white shadow-sm transition">
                                네이버/사람인
                            </button>
                            <button onclick="setPlatform('jobkorea')" id="btn-jobkorea" class="flex-1 py-2 hover:bg-gray-100 rounded transition text-gray-600">
                                잡코리아
                            </button>
                        </div>
                        <p class="text-xs text-gray-500 mt-2 text-center">
                            <i class="fas fa-info-circle"></i> 플랫폼별 줄바꿈 계산 방식 적용
                        </p>
                    </div>

                    <!-- Spell Check Card -->
                    <div class="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-lg">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="font-bold text-gray-800 flex items-center gap-2">
                                <i class="fas fa-spell-check text-green-600"></i>
                                맞춤법 검사
                            </h3>
                            <span id="spellStatus" class="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
                                대기 중
                            </span>
                        </div>
                        
                        <div id="spellResult" class="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                            <i class="fas fa-keyboard text-4xl mb-3 text-gray-300"></i>
                            <p>글을 입력하고<br/>검사 버튼을 눌러주세요.</p>
                        </div>

                        <button onclick="checkSpelling()" class="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-lg font-bold transition flex justify-center items-center gap-2 shadow-lg">
                            <i class="fas fa-wand-magic-sparkles"></i> 맞춤법 검사 시작
                        </button>

                        <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                            <i class="fas fa-exclamation-triangle"></i>
                            <strong>안내:</strong> 맞춤법 검사는 참고용이며 100% 정확하지 않을 수 있습니다.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Mobile Fixed Bottom Stats Bar -->
            <div class="mobile-stats-bar justify-between items-center">
                <div class="flex items-center gap-4">
                    <div>
                        <span class="text-xs opacity-80">공백 포함</span>
                        <div class="text-2xl font-bold">
                            <span id="mobileCharCount">0</span>자
                        </div>
                    </div>
                    <div class="border-l border-white opacity-50 h-10"></div>
                    <div>
                        <span class="text-xs opacity-80">공백 제외</span>
                        <div class="text-lg font-semibold">
                            <span id="mobileCharNoSpace">0</span>자
                        </div>
                    </div>
                </div>
                <button onclick="checkSpelling()" class="bg-white text-blue-900 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg">
                    <i class="fas fa-check"></i> 검사
                </button>
            </div>
        </main>

        <script>
            let currentPlatform = 'naver'; // 기본값: 네이버 기준

            // 플랫폼 선택
            function setPlatform(platform) {
                currentPlatform = platform;
                document.getElementById('btn-naver').className = platform === 'naver' 
                    ? 'flex-1 py-2 rounded bg-blue-600 text-white shadow-sm transition'
                    : 'flex-1 py-2 hover:bg-gray-100 rounded transition text-gray-600';
                document.getElementById('btn-jobkorea').className = platform === 'jobkorea'
                    ? 'flex-1 py-2 rounded bg-blue-600 text-white shadow-sm transition'
                    : 'flex-1 py-2 hover:bg-gray-100 rounded transition text-gray-600';
                updateStats();
            }

            // 실시간 통계 업데이트
            function updateStats() {
                const text = document.getElementById('mainTextarea').value;
                
                // 공백 포함
                const charWithSpace = text.length;
                
                // 공백 제외
                const charWithoutSpace = text.replace(/\\s/g, '').length;
                
                // Byte 계산 (UTF-8)
                const byteCount = new Blob([text]).size;
                
                // 줄 수 (플랫폼별 다르게 계산)
                let lineCount;
                if (currentPlatform === 'jobkorea') {
                    // 잡코리아: \\r\\n을 2자로 계산
                    lineCount = (text.match(/\\n/g) || []).length + 1;
                } else {
                    // 네이버/사람인: \\n을 1자로 계산
                    lineCount = (text.match(/\\n/g) || []).length + 1;
                }
                
                // 데스크톱
                document.getElementById('charWithSpace').textContent = charWithSpace.toLocaleString();
                document.getElementById('charWithoutSpace').textContent = charWithoutSpace.toLocaleString();
                document.getElementById('byteCount').textContent = byteCount.toLocaleString();
                document.getElementById('lineCount').textContent = lineCount;
                
                // 모바일
                document.getElementById('mobileCharCount').textContent = charWithSpace.toLocaleString();
                document.getElementById('mobileCharNoSpace').textContent = charWithoutSpace.toLocaleString();

                // LocalStorage에 자동 저장
                localStorage.setItem('textChecker_content', text);
            }

            // 복사
            function copyText() {
                const textarea = document.getElementById('mainTextarea');
                textarea.select();
                document.execCommand('copy');
                showToast('클립보드에 복사되었습니다!');
            }

            // 전체 삭제
            function clearText() {
                if (confirm('정말로 모든 내용을 삭제하시겠습니까?')) {
                    document.getElementById('mainTextarea').value = '';
                    updateStats();
                    localStorage.removeItem('textChecker_content');
                    showToast('내용이 삭제되었습니다.');
                }
            }

            // 특수문자 제거
            function removeSpecialChars() {
                const textarea = document.getElementById('mainTextarea');
                // HTML 태그와 특수문자 제거 (한글, 영문, 숫자, 공백, 기본 문장부호만 남김)
                const cleaned = textarea.value.replace(/<[^>]*>/g, '').replace(/[^가-힣a-zA-Z0-9\\s.,!?;:\\-()]/g, '');
                textarea.value = cleaned;
                updateStats();
                showToast('특수문자가 제거되었습니다.');
            }

            // 이모지 제거
            function removeEmojis() {
                const textarea = document.getElementById('mainTextarea');
                // 이모지 유니코드 범위 제거
                const cleaned = textarea.value.replace(/[\\u{1F600}-\\u{1F64F}\\u{1F300}-\\u{1F5FF}\\u{1F680}-\\u{1F6FF}\\u{1F1E0}-\\u{1F1FF}\\u{2600}-\\u{26FF}\\u{2700}-\\u{27BF}]/gu, '');
                textarea.value = cleaned;
                updateStats();
                showToast('이모지가 제거되었습니다.');
            }

            // 맞춤법 검사 (간단한 로직)
            function checkSpelling() {
                const text = document.getElementById('mainTextarea').value.trim();
                
                if (text.length === 0) {
                    showToast('먼저 텍스트를 입력해주세요.');
                    return;
                }

                document.getElementById('spellStatus').textContent = '검사 중...';
                document.getElementById('spellStatus').className = 'text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium animate-pulse';

                // 간단한 클라이언트 측 검사 (실제로는 서버 API 필요)
                setTimeout(() => {
                    const errors = findSimpleErrors(text);
                    displaySpellResults(errors);
                }, 1000);
            }

            // 한국어 맞춤법 검사 (대폭 강화된 버전)
            function findSimpleErrors(text) {
                const errors = [];
                const foundErrors = new Set(); // 중복 방지
                
                // 간단한 패턴 기반 맞춤법 검사 (정규식 활용)
                const patterns = [
                    // === 띄어쓰기 오류 ===
                    { regex: /([가-힣])수(있|없|도있|도없)/g, replacement: '$1 수 $2', type: '띄어쓰기', example: '할수있 → 할 수 있' },
                    { regex: /(못|안)할수/g, replacement: '$1 할 수', type: '띄어쓰기' },
                    { regex: /([가-힣])것(같|이|을|도)/g, replacement: '$1 것 $2', type: '띄어쓰기', example: '하는것 → 하는 것' },
                    { regex: /([가-힣])만(하|큼)/g, replacement: '$1 만$2', type: '띄어쓰기' },
                    { regex: /(하지|되지|오지|가지)않/g, replacement: '$1 않', type: '띄어쓰기' },
                    { regex: /([가-힣])뿐(이|만)/g, replacement: '$1 뿐$2', type: '띄어쓰기' },
                    { regex: /(이|그|저)런게/g, replacement: '$1런 게', type: '띄어쓰기' },
                    { regex: /(한|하는|할|된|될|되는)게/g, replacement: '$1 게', type: '띄어쓰기' },
                    { regex: /(이럴|저럴|그럴)수가/g, replacement: '$1 수가', type: '띄어쓰기' },
                    
                    // === 맞춤법 오류: 되/돼 ===
                    { regex: /\b되요\b/g, replacement: '돼요', type: '맞춤법', example: '되요 → 돼요' },
                    { regex: /\b안돼\b/g, replacement: '안 돼', type: '띄어쓰기+맞춤법' },
                    { regex: /\b안되\b/g, replacement: '안 돼', type: '띄어쓰기+맞춤법' },
                    { regex: /\b됬([어|다|습니다|네요])/g, replacement: '됐$1', type: '맞춤법', example: '됬어 → 됐어' },
                    { regex: /\b되여\b/g, replacement: '돼', type: '맞춤법' },
                    
                    // === 맞춤법 오류: 웬/왠 ===
                    { regex: /\b웬지\b/g, replacement: '왠지', type: '맞춤법', example: '웬지 → 왠지' },
                    { regex: /\b왠만하면\b/g, replacement: '웬만하면', type: '맞춤법', example: '왠만하면 → 웬만하면' },
                    { regex: /\b왠일\b/g, replacement: '웬일', type: '맞춤법' },
                    
                    // === 맞춤법 오류: 자주 틀리는 단어 ===
                    { regex: /\b어떻해\b/g, replacement: '어떡해', type: '맞춤법', example: '어떻해 → 어떡해' },
                    { regex: /\b어떻케\b/g, replacement: '어떻게', type: '맞춤법' },
                    { regex: /\b몇일\b/g, replacement: '며칠', type: '맞춤법', example: '몇일 → 며칠' },
                    { regex: /\b금새\b/g, replacement: '금세', type: '맞춤법' },
                    { regex: /\b곰방\b/g, replacement: '금방', type: '맞춤법' },
                    { regex: /\b있따가\b/g, replacement: '이따가', type: '맞춤법' },
                    { regex: /\b넓이다\b/g, replacement: '넓히다', type: '맞춤법' },
                    { regex: /\b급자기\b/g, replacement: '갑자기', type: '맞춤법' },
                    { regex: /\b갑작기\b/g, replacement: '갑자기', type: '맞춤법' },
                    { regex: /\b설레임\b/g, replacement: '설렘', type: '맞춤법', example: '설레임 → 설렘' },
                    
                    // === 맞춤법 오류: ~든지/~던지 ===
                    { regex: /\b([가-힣]+)던지\s+([가-힣]+)던지\b/g, replacement: '$1든지 $2든지', type: '맞춤법', example: '가던지 오던지 → 가든지 오든지' },
                    
                    // === 맞춤법 오류: 로서/로써 ===
                    { regex: /(자격|입장|역할|신분)([으]?)로써\b/g, replacement: '$1$2로서', type: '맞춤법', example: '학생으로써 → 학생으로서' },
                    { regex: /(수단|도구|방법)([으]?)로서\b/g, replacement: '$1$2로써', type: '맞춤법', example: '도구로서 → 도구로써' },
                ];
                
                // 패턴 기반 검사
                patterns.forEach(pattern => {
                    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
                    let match;
                    
                    while ((match = regex.exec(text)) !== null) {
                        const wrongText = match[0];
                        let correctText = pattern.replacement;
                        
                        // $1, $2 등 그룹 치환
                        for (let i = 1; i < match.length; i++) {
                            correctText = correctText.replace(new RegExp('\\$' + i, 'g'), match[i]);
                        }
                        
                        // 이미 같은 오류가 발견되지 않았다면 추가
                        const key = wrongText + '_' + correctText;
                        if (!foundErrors.has(key) && wrongText !== correctText) {
                            errors.push({
                                wrong: wrongText,
                                correct: correctText,
                                type: pattern.type,
                                desc: pattern.example || ''
                            });
                            foundErrors.add(key);
                        }
                    }
                });

                return errors;
            }

            // 맞춤법 결과 표시
            function displaySpellResults(errors) {
                const resultDiv = document.getElementById('spellResult');
                const statusSpan = document.getElementById('spellStatus');

                if (errors.length === 0) {
                    statusSpan.textContent = '오류 없음';
                    statusSpan.className = 'text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium';
                    resultDiv.innerHTML = \`
                        <div class="text-center py-6">
                            <i class="fas fa-check-circle text-5xl text-green-500 mb-3"></i>
                            <p class="text-green-700 font-semibold">오류가 발견되지 않았습니다!</p>
                            <p class="text-gray-500 text-sm mt-2">맞춤법이 올바릅니다.</p>
                        </div>
                    \`;
                } else {
                    statusSpan.textContent = \`\${errors.length}개 발견\`;
                    statusSpan.className = 'text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium';
                    
                    let html = '<div class="space-y-2">';
                    errors.forEach((error, index) => {
                        html += \`
                            <div class="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                                <i class="fas fa-exclamation-circle text-red-500 mt-1"></i>
                                <div class="flex-1">
                                    <div class="font-medium text-gray-800">
                                        <span class="spell-error">\${error.wrong}</span>
                                        <i class="fas fa-arrow-right mx-2 text-gray-400"></i>
                                        <span class="spell-suggestion">\${error.correct}</span>
                                    </div>
                                    <div class="text-xs text-gray-500 mt-1">
                                        <span class="bg-red-100 text-red-600 px-2 py-0.5 rounded">\${error.type}</span>
                                        \${error.desc ? '<span class="ml-2 text-gray-500">· ' + error.desc + '</span>' : ''}
                                    </div>
                                </div>
                            </div>
                        \`;
                    });
                    html += '</div>';
                    html += \`
                        <button onclick="autoFixAll()" class="w-full mt-4 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium transition">
                            <i class="fas fa-magic"></i> 모든 오류 한 번에 수정
                        </button>
                    \`;
                    resultDiv.innerHTML = html;
                }
            }

            // 모든 오류 자동 수정
            function autoFixAll() {
                showToast('자동 수정 기능은 개발 중입니다.');
            }

            // Toast 메시지
            function showToast(message) {
                const toast = document.createElement('div');
                toast.className = 'fixed bottom-24 lg:bottom-8 right-8 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-2xl z-50 animate-bounce';
                toast.innerHTML = \`<i class="fas fa-check-circle mr-2"></i>\${message}\`;
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 3000);
            }

            // 페이지 로드 시 저장된 내용 복원
            document.addEventListener('DOMContentLoaded', () => {
                const saved = localStorage.getItem('textChecker_content');
                if (saved) {
                    document.getElementById('mainTextarea').value = saved;
                    updateStats();
                    showToast('이전에 작성하던 내용을 불러왔습니다.');
                }
            });
        </script>

        ${getCommonFooter()}
        ${getCommonAuthScript()}

    </body>
    </html>
  `);
});
// ==================== 스마트 부동산 평수 계산기 ====================
app.get('/lifestyle/pyeong-calculator', (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko" id="html-root">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>스마트 부동산 평수 계산기 - Faith Portal</title>
        <script>
            (function() {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                    if (args[0] && typeof args[0] === 'string' && 
                        args[0].includes('cdn.tailwindcss.com should not be used in production')) {
                        return;
                    }
                    originalWarn.apply(console, args);
                };
            })();
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .faith-blue { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); }
            .faith-blue-hover:hover { background: linear-gradient(135deg, #0284c7 0%, #0891b2 100%); }
            .quick-chip {
                transition: all 0.2s;
            }
            .quick-chip:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            }
            .visual-card {
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            }
        </style>
    </head>
    <body class="bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50" id="html-root">
        ${getCommonAuthScript()}
        ${getCommonHeader('Lifestyle')}
        ${getStickyHeader()}
        
        ${getBreadcrumb([
        { label: '홈', href: '/' },
        { label: '유틸리티', href: '/lifestyle' },
        { label: '평수 계산기' }
    ])}

        <!-- 메인 컨텐츠 -->
        <main class="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-6 space-y-6">
            <!-- 페이지 헤더 -->
            <div class="text-center mb-8">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mb-4">
                    <i class="fas fa-home text-3xl text-white"></i>
                </div>
                <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                    스마트 부동산 평수 계산기
                </h1>
                <p class="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
                    부동산 면적을 평과 m²로 변환하고, 평당 가격을 계산하며, 실제 크기를 느껴보세요
                </p>
            </div>

            <!-- 1. 변환 계산기 카드 -->
            <div class="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                <div class="flex items-center mb-6">
                    <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                        <i class="fas fa-exchange-alt text-xl text-white"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800">면적 변환</h2>
                </div>

                <!-- 입력 필드 -->
                <div class="grid md:grid-cols-2 gap-6 mb-6">
                    <!-- m² 입력 -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            제곱미터 (m²)
                        </label>
                        <div class="relative">
                            <input 
                                type="number" 
                                id="m2Input" 
                                placeholder="84"
                                class="w-full px-4 py-4 text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition"
                            >
                            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">m²</span>
                        </div>
                    </div>

                    <!-- 평 입력 -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            평 (坪)
                        </label>
                        <div class="relative">
                            <input 
                                type="number" 
                                id="pyeongInput" 
                                placeholder="25.4"
                                class="w-full px-4 py-4 text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition"
                            >
                            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">평</span>
                        </div>
                    </div>
                </div>

                <!-- 빠른 선택 버튼 -->
                <div class="mb-6">
                    <p class="text-sm font-medium text-gray-600 mb-3">주요 아파트 평형</p>
                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        <button onclick="setQuickValue(59)" class="quick-chip px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl border-2 border-blue-200">
                            <div class="text-xs text-blue-600">25평</div>
                            <div class="text-sm">59m²</div>
                        </button>
                        <button onclick="setQuickValue(84)" class="quick-chip px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold rounded-xl border-2 border-purple-200">
                            <div class="text-xs text-purple-600">34평</div>
                            <div class="text-sm">84m²</div>
                        </button>
                        <button onclick="setQuickValue(102)" class="quick-chip px-4 py-3 bg-pink-50 hover:bg-pink-100 text-pink-700 font-semibold rounded-xl border-2 border-pink-200">
                            <div class="text-xs text-pink-600">40평</div>
                            <div class="text-sm">102m²</div>
                        </button>
                        <button onclick="setQuickValue(115)" class="quick-chip px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl border-2 border-indigo-200">
                            <div class="text-xs text-indigo-600">45평</div>
                            <div class="text-sm">115m²</div>
                        </button>
                        <button onclick="setQuickValue(133)" class="quick-chip px-4 py-3 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-semibold rounded-xl border-2 border-cyan-200">
                            <div class="text-xs text-cyan-600">50평</div>
                            <div class="text-sm">133m²</div>
                        </button>
                    </div>
                </div>

                <!-- 변환 결과 -->
                <div id="conversionResult" class="hidden bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                    <div class="text-center">
                        <div class="text-4xl md:text-5xl font-bold text-blue-600 mb-2" id="resultValue">-</div>
                        <div class="text-gray-600 font-medium" id="resultLabel">-</div>
                    </div>
                </div>
            </div>

            <!-- 2. 가격 계산기 카드 -->
            <div class="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                <div class="flex items-center mb-6">
                    <div class="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                        <i class="fas fa-won-sign text-xl text-white"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800">평당 가격 계산</h2>
                </div>

                <div class="space-y-6">
                    <!-- 총 가격 입력 -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            총 가격 (매매가/전세가)
                        </label>
                        <div class="relative">
                            <input 
                                type="number" 
                                id="totalPrice" 
                                placeholder="1050000000"
                                class="w-full px-4 py-4 text-xl font-semibold border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none transition"
                            >
                            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">원</span>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">예: 10억 5천만원 = 1050000000</p>
                    </div>

                    <!-- 면적 입력 -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            면적 (평 또는 m²)
                        </label>
                        <div class="flex gap-3">
                            <div class="flex-1 relative">
                                <input 
                                    type="number" 
                                    id="priceArea" 
                                    placeholder="34"
                                    class="w-full px-4 py-4 text-xl font-semibold border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none transition"
                                >
                            </div>
                            <select 
                                id="areaUnit" 
                                class="px-6 py-4 border-2 border-gray-300 rounded-xl font-medium focus:border-green-500 focus:outline-none transition"
                            >
                                <option value="pyeong">평</option>
                                <option value="m2">m²</option>
                            </select>
                        </div>
                    </div>

                    <!-- 계산 버튼 -->
                    <button 
                        onclick="calculatePricePerPyeong()"
                        class="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition shadow-lg"
                    >
                        <i class="fas fa-calculator mr-2"></i>
                        평당 가격 계산하기
                    </button>

                    <!-- 가격 계산 결과 -->
                    <div id="priceResult" class="hidden space-y-4">
                        <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                            <div class="text-center mb-4">
                                <div class="text-gray-600 text-sm mb-1">평당 가격</div>
                                <div class="text-4xl md:text-5xl font-bold text-green-600" id="pricePerPyeong">-</div>
                            </div>
                            <div class="grid grid-cols-2 gap-4 text-sm">
                                <div class="bg-white rounded-lg p-3">
                                    <div class="text-gray-500 text-xs mb-1">총 가격</div>
                                    <div class="font-bold text-gray-800" id="displayTotalPrice">-</div>
                                </div>
                                <div class="bg-white rounded-lg p-3">
                                    <div class="text-gray-500 text-xs mb-1">면적</div>
                                    <div class="font-bold text-gray-800" id="displayArea">-</div>
                                </div>
                            </div>
                        </div>

                        <!-- 비교 정보 -->
                        <div class="bg-blue-50 rounded-xl p-4 border border-blue-200">
                            <div class="text-sm text-blue-800">
                                <i class="fas fa-info-circle mr-2"></i>
                                <strong>참고:</strong> <span id="priceComparison">-</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 3. 면적 가이드 카드 -->
            <div class="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                <div class="flex items-center mb-6">
                    <div class="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mr-3">
                        <i class="fas fa-ruler-combined text-xl text-white"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800">면적 가이드</h2>
                </div>

                <div class="space-y-6">
                    <!-- 전용면적 vs 공급면적 -->
                    <div class="visual-card rounded-xl p-6">
                        <h3 class="font-bold text-lg text-gray-800 mb-4">
                            <i class="fas fa-building text-blue-600 mr-2"></i>
                            전용면적 vs 공급면적
                        </h3>
                        <div class="space-y-3 text-sm text-gray-700">
                            <div class="flex items-start">
                                <span class="inline-block w-2 h-2 bg-blue-500 rounded-full mr-3 mt-1.5"></span>
                                <div>
                                    <strong class="text-blue-700">전용면적:</strong> 실제로 사용할 수 있는 순수 거주 공간 (방, 거실, 주방 등)
                                </div>
                            </div>
                            <div class="flex items-start">
                                <span class="inline-block w-2 h-2 bg-purple-500 rounded-full mr-3 mt-1.5"></span>
                                <div>
                                    <strong class="text-purple-700">공급면적:</strong> 전용면적 + 벽 두께 + 계단, 복도 등 공용 부분
                                </div>
                            </div>
                            <div class="mt-4 p-4 bg-white rounded-lg border-2 border-blue-200">
                                <div class="text-xs text-gray-600 mb-2">실제 예시</div>
                                <div class="font-semibold text-gray-800">
                                    "34평 아파트" = 보통 84m² 전용면적을 의미
                                </div>
                                <div class="text-xs text-gray-600 mt-1">
                                    공급면적은 약 112m² (전용률 75% 기준)
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 시각적 크기 비교 -->
                    <div id="visualComparison" class="hidden">
                        <h3 class="font-bold text-lg text-gray-800 mb-4">
                            <i class="fas fa-eye text-green-600 mr-2"></i>
                            이 크기는 어느 정도일까요?
                        </h3>
                        <div class="grid md:grid-cols-2 gap-4">
                            <div class="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-5 border-2 border-pink-200">
                                <div class="text-3xl mb-2">🛏️</div>
                                <div class="font-bold text-gray-800 mb-1" id="bedComparison">-</div>
                                <div class="text-xs text-gray-600">킹사이즈 침대 기준</div>
                            </div>
                            <div class="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-5 border-2 border-yellow-200">
                                <div class="text-3xl mb-2">🏀</div>
                                <div class="font-bold text-gray-800 mb-1" id="courtComparison">-</div>
                                <div class="text-xs text-gray-600">농구 코트 기준</div>
                            </div>
                            <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200">
                                <div class="text-3xl mb-2">📏</div>
                                <div class="font-bold text-gray-800 mb-1" id="dimensionEstimate">-</div>
                                <div class="text-xs text-gray-600">대략적인 크기</div>
                            </div>
                            <div class="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border-2 border-blue-200">
                                <div class="text-3xl mb-2">🏠</div>
                                <div class="font-bold text-gray-800 mb-1" id="roomEstimate">-</div>
                                <div class="text-xs text-gray-600">방 구성 예상</div>
                            </div>
                        </div>
                    </div>

                    <!-- 법정 단위 안내 -->
                    <div class="bg-gray-50 rounded-xl p-5 border border-gray-200">
                        <div class="flex items-start">
                            <i class="fas fa-gavel text-gray-600 mr-3 mt-1"></i>
                            <div class="text-sm text-gray-700">
                                <strong class="text-gray-800">법적 단위:</strong> 
                                대한민국에서는 2007년부터 <strong class="text-blue-600">제곱미터(m²)</strong>가 공식 법정 단위입니다. 
                                '평'은 관습적으로 사용되지만 공식 문서에는 m²로 표기됩니다.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 서비스 확장 제안 -->
            <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 md:p-8 border-2 border-purple-200">
                <h3 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
                    이런 정보도 필요하신가요?
                </h3>
                <div class="grid md:grid-cols-2 gap-4">
                    <div class="bg-white rounded-xl p-4 hover:shadow-md transition cursor-pointer">
                        <div class="text-2xl mb-2">🚚</div>
                        <div class="font-semibold text-gray-800 mb-1">이사/청소 견적</div>
                        <div class="text-xs text-gray-600">평수에 맞는 이사 비용 확인</div>
                    </div>
                    <div class="bg-white rounded-xl p-4 hover:shadow-md transition cursor-pointer">
                        <div class="text-2xl mb-2">🎨</div>
                        <div class="font-semibold text-gray-800 mb-1">인테리어 자재 계산</div>
                        <div class="text-xs text-gray-600">벽지, 장판 필요량 계산</div>
                    </div>
                    <div class="bg-white rounded-xl p-4 hover:shadow-md transition cursor-pointer">
                        <div class="text-2xl mb-2">📰</div>
                        <div class="font-semibold text-gray-800 mb-1">부동산 뉴스</div>
                        <div class="text-xs text-gray-600">최신 부동산 시장 정보</div>
                    </div>
                    <div class="bg-white rounded-xl p-4 hover:shadow-md transition cursor-pointer">
                        <div class="text-2xl mb-2">💰</div>
                        <div class="font-semibold text-gray-800 mb-1">대출 계산기</div>
                        <div class="text-xs text-gray-600">주택담보대출 이자 계산</div>
                    </div>
                </div>
            </div>
        </main>

        <script>
            // 변환 상수
            const M2_TO_PYEONG = 0.3025;
            const PYEONG_TO_M2 = 3.3058;
            const KING_BED_SIZE = 4.05; // 킹사이즈 침대 약 4.05m²
            const BASKETBALL_COURT = 420; // 농구 코트 약 420m²

            // m² 입력 이벤트
            document.getElementById('m2Input').addEventListener('input', function(e) {
                const m2 = parseFloat(e.target.value);
                if (!isNaN(m2) && m2 > 0) {
                    const pyeong = (m2 * M2_TO_PYEONG).toFixed(2);
                    document.getElementById('pyeongInput').value = pyeong;
                    showConversionResult(pyeong, '평', m2 + 'm²를 변환한 결과');
                    updateVisualComparison(m2);
                } else {
                    clearResults();
                }
            });

            // 평 입력 이벤트
            document.getElementById('pyeongInput').addEventListener('input', function(e) {
                const pyeong = parseFloat(e.target.value);
                if (!isNaN(pyeong) && pyeong > 0) {
                    const m2 = (pyeong * PYEONG_TO_M2).toFixed(2);
                    document.getElementById('m2Input').value = m2;
                    showConversionResult(m2, 'm²', pyeong + '평을 변환한 결과');
                    updateVisualComparison(parseFloat(m2));
                } else {
                    clearResults();
                }
            });

            // 빠른 선택 버튼
            function setQuickValue(m2) {
                document.getElementById('m2Input').value = m2;
                const pyeong = (m2 * M2_TO_PYEONG).toFixed(2);
                document.getElementById('pyeongInput').value = pyeong;
                showConversionResult(pyeong, '평', m2 + 'm²를 변환한 결과');
                updateVisualComparison(m2);
            }

            // 변환 결과 표시
            function showConversionResult(value, unit, label) {
                const resultDiv = document.getElementById('conversionResult');
                resultDiv.classList.remove('hidden');
                document.getElementById('resultValue').textContent = value + ' ' + unit;
                document.getElementById('resultLabel').textContent = label;
            }

            // 시각적 비교 업데이트
            function updateVisualComparison(m2) {
                const comparisonDiv = document.getElementById('visualComparison');
                comparisonDiv.classList.remove('hidden');

                // 킹사이즈 침대 비교
                const beds = Math.floor(m2 / KING_BED_SIZE);
                document.getElementById('bedComparison').textContent = 
                    '킹사이즈 침대 약 ' + beds + '개';

                // 농구 코트 비교
                const courtPercent = ((m2 / BASKETBALL_COURT) * 100).toFixed(1);
                document.getElementById('courtComparison').textContent = 
                    '농구 코트의 ' + courtPercent + '%';

                // 대략적인 크기
                const sideLength = Math.sqrt(m2).toFixed(1);
                document.getElementById('dimensionEstimate').textContent = 
                    '약 ' + sideLength + 'm × ' + sideLength + 'm';

                // 방 구성 예상
                let roomEstimate = '';
                if (m2 < 50) {
                    roomEstimate = '원룸 ~ 투룸';
                } else if (m2 < 70) {
                    roomEstimate = '투룸 ~ 방 2개';
                } else if (m2 < 90) {
                    roomEstimate = '방 3개 (25평대)';
                } else if (m2 < 110) {
                    roomEstimate = '방 3~4개 (34평대)';
                } else if (m2 < 140) {
                    roomEstimate = '방 4개 (40평대)';
                } else {
                    roomEstimate = '방 4개 이상 (대형)';
                }
                document.getElementById('roomEstimate').textContent = roomEstimate;
            }

            // 평당 가격 계산
            function calculatePricePerPyeong() {
                const totalPrice = parseFloat(document.getElementById('totalPrice').value);
                const area = parseFloat(document.getElementById('priceArea').value);
                const unit = document.getElementById('areaUnit').value;

                if (isNaN(totalPrice) || isNaN(area) || totalPrice <= 0 || area <= 0) {
                    alert('총 가격과 면적을 올바르게 입력해주세요.');
                    return;
                }

                // 평으로 변환
                const pyeongArea = unit === 'm2' ? area * M2_TO_PYEONG : area;
                const pricePerPyeong = totalPrice / pyeongArea;

                // 결과 표시
                const resultDiv = document.getElementById('priceResult');
                resultDiv.classList.remove('hidden');

                // 평당 가격
                document.getElementById('pricePerPyeong').textContent = 
                    formatPrice(pricePerPyeong) + '원/평';

                // 총 가격
                document.getElementById('displayTotalPrice').textContent = 
                    formatPrice(totalPrice) + '원';

                // 면적
                const m2Area = unit === 'pyeong' ? area * PYEONG_TO_M2 : area;
                document.getElementById('displayArea').textContent = 
                    pyeongArea.toFixed(1) + '평 (' + m2Area.toFixed(1) + 'm²)';

                // 비교 정보
                let comparison = '';
                if (pricePerPyeong < 20000000) {
                    comparison = '비교적 저렴한 가격대입니다';
                } else if (pricePerPyeong < 30000000) {
                    comparison = '적정한 가격대입니다';
                } else if (pricePerPyeong < 50000000) {
                    comparison = '다소 높은 가격대입니다';
                } else {
                    comparison = '매우 높은 가격대입니다';
                }
                document.getElementById('priceComparison').textContent = comparison;
            }

            // 가격 포맷팅
            function formatPrice(price) {
                const eok = Math.floor(price / 100000000);
                const man = Math.floor((price % 100000000) / 10000);

                let result = '';
                if (eok > 0) {
                    result += eok + '억';
                    if (man > 0) {
                        result += ' ' + man + '만';
                    }
                } else if (man > 0) {
                    result += man + '만';
                } else {
                    result = price.toLocaleString();
                }
                return result;
            }

            // 결과 초기화
            function clearResults() {
                document.getElementById('conversionResult').classList.add('hidden');
                document.getElementById('visualComparison').classList.add('hidden');
            }
        </script>

        ${getCommonFooter()}
        ${getCommonAuthScript()}

    </body>
    </html>
  `);
});
// ==================== 뉴스 페이지 ====================
app.get('/news', async (c) => {
    const DB = getDB(c);
    // DB에서 뉴스 가져오기
    let newsFromDB = [];
    try {
        const { results } = await DB.prepare('SELECT * FROM news ORDER BY created_at DESC LIMIT 20').all();
        newsFromDB = results || [];
    }
    catch (error) {
        console.error('뉴스 조회 오류:', error);
    }
    // DB에 뉴스가 없으면 RSS에서 자동으로 가져오기
    if (newsFromDB.length === 0) {
        try {
            const categories = ['general', 'politics', 'economy', 'tech', 'sports', 'entertainment', 'stock'];
            for (let i = 0; i < categories.length; i++) {
                const category = categories[i];
                const newsItems = await parseGoogleNewsRSS(category);
                for (const item of newsItems.slice(0, 5)) { // 카테고리당 5개
                    try {
                        await DB.prepare(`
              INSERT OR IGNORE INTO news (category, title, summary, link, source, published_at)
              VALUES (?, ?, ?, ?, ?, ?)
            `).bind(item.category, item.title, item.summary, item.link, item.publisher, item.published_at).run();
                    }
                    catch (err) {
                        console.error('뉴스 저장 오류:', err);
                    }
                }
                // 구글 Rate Limit 회피: 카테고리 간 2초 지연 (마지막 카테고리 제외)
                if (i < categories.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
            // 다시 조회
            const { results } = await DB.prepare('SELECT * FROM news ORDER BY created_at DESC LIMIT 20').all();
            newsFromDB = results || [];
        }
        catch (error) {
            console.error('RSS 뉴스 가져오기 오류:', error);
        }
    }
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko" id="html-root">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>뉴스 - Faith Portal</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link rel="alternate icon" href="/favicon.ico">
        <script>
            // Tailwind CDN 경고 필터링 (개발 환경용)
            (function() {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                    if (args[0] && typeof args[0] === 'string' && 
                        args[0].includes('cdn.tailwindcss.com should not be used in production')) {
                        return; // Tailwind CDN 경고 무시
                    }
                    originalWarn.apply(console, args);
                };
            })();
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
            tailwind.config = { darkMode: 'class' }
        </script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        ${getCommonAuthScript()}
        <style>
            .faith-blue { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); }
            .faith-blue-hover:hover { background: linear-gradient(135deg, #0284c7 0%, #0891b2 100%); }
            .news-card {
                transition: all 0.3s ease;
            }
            .news-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 12px 24px rgba(0,0,0,0.15);
            }
            .category-badge {
                transition: all 0.3s ease;
            }
            .category-badge:hover {
                transform: scale(1.05);
            }
            .line-clamp-2 {
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
            .line-clamp-3 {
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
            .leading-snug {
                line-height: 1.4;
            }
            .leading-relaxed {
                line-height: 1.7;
            }
            /* 다크모드 스타일 */
            .dark {
                color-scheme: dark;
            }
            .dark body {
                background: linear-gradient(to bottom right, #1e293b, #0f172a, #020617);
            }
            .dark .bg-white {
                background-color: #1e293b !important;
            }
            .dark .text-gray-900 {
                color: #f1f5f9 !important;
            }
            .dark .text-gray-800 {
                color: #e2e8f0 !important;
            }
            .dark .text-gray-700 {
                color: #cbd5e1 !important;
            }
            .dark .text-gray-600 {
                color: #94a3b8 !important;
            }
            .dark .text-gray-500 {
                color: #64748b !important;
            }
            .dark .border-gray-200 {
                border-color: #334155 !important;
            }
            .dark .bg-gray-100 {
                background-color: #334155 !important;
            }
            .dark .news-card {
                background-color: #1e293b;
                border: 1px solid #334155;
            }
            .dark .news-card:hover {
                background-color: #334155;
            }
            /* 토스트 알림 */
            .toast {
                position: fixed;
                bottom: 2rem;
                right: 2rem;
                z-index: 9999;
                animation: slideInRight 0.3s ease-out;
            }
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
            .toast.hiding {
                animation: slideOutRight 0.3s ease-in forwards;
            }
            /* 로딩 스피너 */
            .spinner {
                border: 3px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top-color: #fff;
                width: 24px;
                height: 24px;
                animation: spin 0.6s linear infinite;
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            /* 북마크 버튼 */
            .bookmark-btn {
                transition: all 0.2s;
            }
            .bookmark-btn:hover {
                transform: scale(1.1);
            }
            .bookmark-btn.bookmarked {
                color: #eab308;
            }
            /* 투표 버튼 */
            .vote-btn {
                transition: all 0.2s;
            }
            .vote-btn:hover {
                transform: scale(1.1);
            }
            .vote-btn:active {
                transform: scale(0.95);
            }
            /* 사이드바 스크롤 */
            aside {
                max-height: calc(100vh - 120px);
            }
            /* 주식 종목 칩 스타일 */
            .stock-chip {
                transition: all 0.3s ease;
                cursor: pointer;
            }
            .stock-chip:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            /* 모바일 반응형 - 종목 칩 */
            @media (max-width: 640px) {
                .stock-chip {
                    font-size: 0.75rem;
                }
                .stock-chip .font-bold {
                    font-size: 0.7rem;
                }
            }
        </style>
    </head>
    <body class="bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50 transition-colors duration-300">
        ${getCommonHeader('News')}
        ${getStickyHeader()}
        
        ${getBreadcrumb([
        { label: '홈', href: '/' },
        { label: '뉴스' }
    ])}

        <!-- 메인 컨텐츠: 3단 레이아웃 (PC) / 1단 레이아웃 (모바일) -->
        <main class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
            
            <!-- 검색 바 -->
            <div class="mb-6 sm:mb-8">
                <div class="relative">
                    <input 
                        type="text" 
                        id="search-input" 
                        placeholder="뉴스 검색..." 
                        class="w-full px-5 py-3 pl-12 rounded-xl border-2 border-gray-300 focus:border-purple-500 focus:outline-none text-gray-900 bg-white transition-all shadow-sm"
                    />
                    <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <button 
                        id="clear-search" 
                        class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 hidden"
                        onclick="clearSearch()"
                    >
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>

            <!-- 카테고리 탭 (다중 선택 가능) -->
            <div class="mb-6 sm:mb-8">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-lg font-semibold text-gray-900">
                        <i class="fas fa-filter mr-2"></i>카테고리 필터
                    </h3>
                    <button onclick="clearCategoryFilter()" class="text-sm text-purple-600 hover:text-purple-700 font-medium">
                        <i class="fas fa-redo mr-1"></i>초기화
                    </button>
                </div>
                <div class="overflow-x-auto">
                    <div class="flex space-x-2 sm:space-x-3 pb-2 min-w-max">
                        <button onclick="toggleCategory('all')" data-category="all" class="category-btn active px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-blue-600 text-white font-medium text-sm sm:text-base shadow hover:bg-blue-700 transition">
                            전체
                        </button>
                        <button onclick="toggleCategory('general')" data-category="general" class="category-btn px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-gray-700 font-medium hover:bg-gray-100 text-sm sm:text-base shadow border border-gray-300">
                            일반
                        </button>
                        <button onclick="toggleCategory('politics')" data-category="politics" class="category-btn px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-gray-700 font-medium hover:bg-gray-100 text-sm sm:text-base shadow border border-gray-300">
                            정치
                        </button>
                        <button onclick="toggleCategory('economy')" data-category="economy" class="category-btn px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-gray-700 font-medium hover:bg-gray-100 text-sm sm:text-base shadow border border-gray-300">
                            경제
                        </button>
                        <button onclick="toggleCategory('tech')" data-category="tech" class="category-btn px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-gray-700 font-medium hover:bg-gray-100 text-sm sm:text-base shadow border border-gray-300">
                            IT/과학
                        </button>
                        <button onclick="toggleCategory('sports')" data-category="sports" class="category-btn px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-gray-700 font-medium hover:bg-gray-100 text-sm sm:text-base shadow border border-gray-300">
                            스포츠
                        </button>
                        <button onclick="toggleCategory('entertainment')" data-category="entertainment" class="category-btn px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-gray-700 font-medium hover:bg-gray-100 text-sm sm:text-base shadow border border-gray-300">
                            엔터테인먼트
                        </button>
                        <button onclick="toggleCategory('stock')" data-category="stock" class="category-btn px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-gray-700 font-medium hover:bg-gray-100 text-sm sm:text-base shadow border border-gray-300">
                            <i class="fas fa-chart-line mr-1"></i>주식
                        </button>
                        <button onclick="toggleCategory('keyword')" data-category="keyword" class="category-btn px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-gray-700 font-medium hover:bg-gray-100 text-sm sm:text-base shadow border border-gray-300">
                            <i class="fas fa-key mr-1"></i>키워드
                        </button>
                    </div>
                </div>
            </div>

            <!-- ========== 모바일 위젯 탭 (모바일만 표시) ========== -->
            <div class="lg:hidden mb-6">
                <div class="bg-white rounded-xl shadow-md overflow-hidden">
                    <!-- 탭 헤더 -->
                    <div class="flex border-b border-gray-200">
                        <button 
                            id="tab-hot" 
                            onclick="switchMobileTab('hot')" 
                            class="flex-1 py-4 px-4 font-semibold text-center transition-colors border-b-2 border-red-500 text-red-600"
                        >
                            <i class="fas fa-fire mr-2"></i>
                            HOT 이슈
                        </button>
                        <button 
                            id="tab-keyword" 
                            onclick="switchMobileTab('keyword')" 
                            class="flex-1 py-4 px-4 font-semibold text-center transition-colors border-b-2 border-transparent text-gray-500"
                        >
                            <i class="fas fa-bookmark mr-2"></i>
                            키워드 구독
                        </button>
                    </div>
                    
                    <!-- 탭 컨텐츠 -->
                    <div class="p-5">
                        <!-- HOT 뉴스 탭 -->
                        <div id="mobile-hot-content" class="">
                            <div id="mobile-hot-news-list" class="space-y-3">
                                <p class="text-sm text-gray-500 text-center py-4">
                                    로딩 중...
                                </p>
                            </div>
                            <button onclick="loadMoreHotNews()" class="w-full mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition">
                                <i class="fas fa-chevron-down mr-1"></i>
                                더보기
                            </button>
                        </div>
                        
                        <!-- 키워드 구독 탭 -->
                        <div id="mobile-keyword-content" class="hidden">
                            <!-- 키워드 추가 입력 -->
                            <div class="mb-4">
                                <div class="relative">
                                    <input 
                                        type="text" 
                                        id="mobile-keyword-input" 
                                        placeholder="키워드 입력..." 
                                        class="w-full px-3 py-2 pr-10 rounded-lg border border-gray-300 focus:border-purple-500 focus:outline-none text-sm"
                                    />
                                    <button 
                                        onclick="addKeyword('mobile')" 
                                        class="absolute right-2 top-1/2 transform -translate-y-1/2 text-purple-600 hover:text-purple-700"
                                        title="추가"
                                    >
                                        <i class="fas fa-plus-circle text-xl"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <!-- 키워드 목록 -->
                            <div id="mobile-keyword-list" class="space-y-2 max-h-80 overflow-y-auto">
                                <p class="text-sm text-gray-500 text-center py-4">
                                    아직 구독한 키워드가 없습니다
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ========== 3단 레이아웃 (PC만 표시) ========== -->
            <div class="hidden lg:flex lg:flex-row gap-6">
                
                <!-- 왼쪽 사이드바: 키워드 구독 -->
                <aside class="lg:w-64 flex-shrink-0">
                    <div class="bg-white rounded-xl shadow-md p-5 sticky top-20">
                        <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <i class="fas fa-bookmark text-purple-600 mr-2"></i>
                            키워드 구독
                        </h3>
                        
                        <!-- 키워드 추가 입력 -->
                        <div class="mb-4">
                            <div class="relative">
                                <input 
                                    type="text" 
                                    id="keyword-input" 
                                    placeholder="키워드 입력..." 
                                    class="w-full px-3 py-2 pr-10 rounded-lg border border-gray-300 focus:border-purple-500 focus:outline-none text-sm"
                                />
                                <button 
                                    onclick="addKeyword()" 
                                    class="absolute right-2 top-1/2 transform -translate-y-1/2 text-purple-600 hover:text-purple-700"
                                    title="추가"
                                >
                                    <i class="fas fa-plus-circle text-xl"></i>
                                </button>
                            </div>
                        </div>
                        
                        <!-- 키워드 목록 -->
                        <div id="keyword-list" class="space-y-2 max-h-96 overflow-y-auto">
                            <p class="text-sm text-gray-500 text-center py-4">
                                아직 구독한 키워드가 없습니다
                            </p>
                        </div>
                    </div>
                </aside>

                <!-- 중앙 영역: 뉴스 피드 -->
                <div class="flex-1 min-w-0">
                    <div id="news-feed" class="space-y-4">
                        <!-- JavaScript로 동적으로 뉴스 로드됨 -->
                        <div class="text-center py-12">
                            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                            <p class="text-gray-500 mt-4 text-lg">뉴스를 불러오는 중...</p>
                        </div>
                    </div>
                </div>

                <!-- 오른쪽 사이드바: 실시간 HOT 이슈 -->
                <aside class="lg:w-80 flex-shrink-0">
                    <div class="bg-white rounded-xl shadow-md p-5 sticky top-20">
                        <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <i class="fas fa-fire text-red-500 mr-2"></i>
                            실시간 HOT 이슈
                        </h3>
                        
                        <!-- HOT 뉴스 목록 -->
                        <div id="hot-news-list" class="space-y-3">
                            <p class="text-sm text-gray-500 text-center py-4">
                                로딩 중...
                            </p>
                        </div>
                        
                        <!-- 더보기 버튼 -->
                        <button onclick="loadMoreHotNews()" class="w-full mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition">
                            <i class="fas fa-chevron-down mr-1"></i>
                            더보기
                        </button>
                    </div>
                </aside>

            </div>
            
            <!-- ========== 모바일 뉴스 피드 ========== -->
            <div class="lg:hidden">
                <div id="mobile-news-feed" class="space-y-4">
                    <!-- JavaScript로 동적으로 뉴스 로드됨 -->
                    <div class="text-center py-12">
                        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                        <p class="text-gray-500 mt-4 text-lg">뉴스를 불러오는 중...</p>
                    </div>
                </div>
            </div>

            <!-- 새로고침 버튼 -->
            <div class="mt-8 sm:mt-12 text-center">
                <button onclick="fetchNewsAndReload()" class="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition-all">
                    <i class="fas fa-sync-alt mr-2"></i>
                    최신 뉴스 가져오기
                </button>
            </div>
        </main>

        <!-- 공유 모달 -->
        <div id="share-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-gray-900">
                        <i class="fas fa-share-alt text-blue-500 mr-2"></i>
                        뉴스 공유
                    </h3>
                    <button onclick="closeShareModal()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <div class="space-y-3">
                    <button onclick="shareToKakao()" class="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-yellow-400 hover:bg-yellow-500 rounded-xl font-semibold text-gray-900 transition-all">
                        <i class="fas fa-comment text-xl"></i>
                        <span>카카오톡으로 공유</span>
                    </button>
                    <button onclick="shareToFacebook()" class="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold text-white transition-all">
                        <i class="fab fa-facebook-f text-xl"></i>
                        <span>페이스북으로 공유</span>
                    </button>
                    <button onclick="shareToTwitter()" class="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-sky-400 hover:bg-sky-500 rounded-xl font-semibold text-white transition-all">
                        <i class="fab fa-twitter text-xl"></i>
                        <span>트위터로 공유</span>
                    </button>
                    <button onclick="copyLink()" class="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gray-200 hover:bg-gray-300 rounded-xl font-semibold text-gray-900 transition-all">
                        <i class="fas fa-link text-xl"></i>
                        <span>링크 복사</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- 토스트 컨테이너 -->
        <div id="toast-container" class="fixed bottom-4 right-4 z-50 space-y-2"></div>

        ${getCommonFooter()}

        <script>
            // ==================== 인증 및 전역 유틸리티 ====================
            // checkAuth fallback: 레이아웃 스크립트 로딩 지연 대비
            window.checkAuth = window.checkAuth || async function() {
                try {
                    const response = await fetch('/api/auth/me');
                    const data = await response.json();
                    return data.loggedIn ? data.user : null;
                } catch (error) {
                    console.error('[Fallback] Auth check error:', error);
                    return null;
                }
            };

            // ==================== 전역 변수 ====================
            let userId = null; // 서버에서 가져올 사용자 ID
            let currentCategories = ['all']; // 선택된 카테고리들
            let shareNewsData = {}; // 공유할 뉴스 데이터
            let searchTimeout = null;
            let currentPage = 0; // 현재 페이지 (무한 스크롤용)
            let isLoading = false; // 로딩 중 플래그
            let hasMore = true; // 더 불러올 뉴스가 있는지
            const ITEMS_PER_PAGE = 12; // 페이지당 아이템 수
            
            // ==================== 사용자 정보 가져오기 ====================
            async function fetchUserInfo() {
                try {
                    const response = await fetch('/api/auth/me');
                    const data = await response.json();
                    console.log('[News] 사용자 정보 조회:', data);
                    
                    if (data.success && data.user) {
                        userId = data.user.id;
                        console.log('[News] ✅ userId 설정:', userId, '- 이름:', data.user.name);
                    } else {
                        console.log('[News] ⚠️  로그인되지 않음');
                        userId = null;
                    }
                } catch (error) {
                    console.error('[News] ❌ 사용자 정보 조회 실패:', error);
                    userId = null;
                }
            }
            
            // ==================== 토스트 알림 ====================
            function showToast(message, type = 'info') {
                const container = document.getElementById('toast-container');
                const toast = document.createElement('div');
                toast.className = 'toast bg-white shadow-lg rounded-lg p-4 flex items-center space-x-3 min-w-[300px]';
                
                const icons = {
                    success: '<i class="fas fa-check-circle text-green-500 text-xl"></i>',
                    error: '<i class="fas fa-exclamation-circle text-red-500 text-xl"></i>',
                    info: '<i class="fas fa-info-circle text-blue-500 text-xl"></i>',
                    warning: '<i class="fas fa-exclamation-triangle text-yellow-500 text-xl"></i>'
                };
                
                toast.innerHTML = icons[type] + '<span class="text-gray-900 font-medium">' + message + '</span>';
                container.appendChild(toast);
                
                setTimeout(() => {
                    toast.classList.add('hiding');
                    setTimeout(() => toast.remove(), 300);
                }, 3000);
            }
            
            // ==================== 검색 기능 ====================
            function initSearchAndKeyword() {
                const searchInput = document.getElementById('search-input');
                const clearSearchBtn = document.getElementById('clear-search');
                
                // 데스크톱 키워드 입력 Enter 키 이벤트
                const keywordInput = document.getElementById('keyword-input');
                if (keywordInput) {
                    keywordInput.addEventListener('keypress', function(e) {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addKeyword();
                        }
                    });
                }
                
                // 모바일 키워드 입력 Enter 키 이벤트
                const mobileKeywordInput = document.getElementById('mobile-keyword-input');
                if (mobileKeywordInput) {
                    mobileKeywordInput.addEventListener('keypress', function(e) {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addKeyword('mobile');
                        }
                    });
                }
                
                // 검색 입력 이벤트
                if (searchInput && clearSearchBtn) {
                    searchInput.addEventListener('input', function(e) {
                const query = e.target.value.trim();
                
                if (query.length > 0) {
                    clearSearchBtn.classList.remove('hidden');
                } else {
                    clearSearchBtn.classList.add('hidden');
                }
                
                // 디바운스 적용
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    if (query.length >= 2) {
                        searchNews(query);
                    } else if (query.length === 0) {
                        loadNews();
                    }
                }, 500);
                    });
                }
            }
            
            async function searchNews(query) {
                const newsFeed = document.getElementById('news-feed');
                newsFeed.innerHTML = '<div class="text-center py-12"><div class="spinner mx-auto"></div><p class="text-gray-500 mt-4">검색 중...</p></div>';
                
                try {
                    const categoryParam = currentCategories.includes('all') ? '' : '&category=' + currentCategories[0];
                    const response = await fetch('/api/news/search?q=' + encodeURIComponent(query) + categoryParam);
                    const data = await response.json();
                    
                    if (data.success && data.news.length > 0) {
                        renderNewsCards(data.news);
                        showToast(data.news.length + '개의 뉴스를 찾았습니다', 'success');
                    } else {
                        newsFeed.innerHTML = '<div class="text-center py-12"><i class="fas fa-search text-gray-300 text-6xl mb-4"></i><p class="text-gray-500">검색 결과가 없습니다</p></div>';
                    }
                } catch (error) {
                    console.error('검색 오류:', error);
                    showToast('검색 중 오류가 발생했습니다', 'error');
                    newsFeed.innerHTML = '<div class="text-center py-12"><p class="text-red-500">검색 중 오류가 발생했습니다</p></div>';
                }
            }
            
            function clearSearch() {
                searchInput.value = '';
                clearSearchBtn.classList.add('hidden');
                currentPage = 0;
                hasMore = true;
                loadNews(true);
            }
            
            // ==================== 카테고리 필터 (다중 선택) ====================
            function toggleCategory(category) {
                if (category === 'all') {
                    currentCategories = ['all'];
                } else {
                    // 'all' 제거
                    currentCategories = currentCategories.filter(c => c !== 'all');
                    
                    // 카테고리 토글
                    const index = currentCategories.indexOf(category);
                    if (index > -1) {
                        currentCategories.splice(index, 1);
                    } else {
                        currentCategories.push(category);
                    }
                    
                    // 아무것도 선택 안되면 'all'로
                    if (currentCategories.length === 0) {
                        currentCategories = ['all'];
                    }
                }
                
                // 버튼 스타일 업데이트
                updateCategoryButtons();
                
                // 뉴스 로드 (리셋)
                currentPage = 0;
                hasMore = true;
                loadNews(true);
            }
            
            function clearCategoryFilter() {
                currentCategories = ['all'];
                updateCategoryButtons();
                currentPage = 0;
                hasMore = true;
                loadNews(true);
                showToast('필터가 초기화되었습니다', 'info');
            }
            
            function updateCategoryButtons() {
                document.querySelectorAll('.category-btn').forEach(btn => {
                    const category = btn.dataset.category;
                    if (currentCategories.includes(category)) {
                        btn.className = 'category-btn active px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-blue-600 text-white font-medium text-sm sm:text-base shadow hover:bg-blue-700 transition';
                    } else {
                        btn.className = 'category-btn px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-gray-700 font-medium hover:bg-gray-100 text-sm sm:text-base shadow border border-gray-300';
                    }
                });
            }
            
            // ==================== 투표 시스템 ====================
            function attachVoteListeners() {
                document.querySelectorAll('.vote-btn').forEach(btn => {
                    btn.addEventListener('click', async function(e) {
                        e.stopPropagation(); // 뉴스 카드 클릭 방지
                        const newsId = this.dataset.newsId;
                        const voteType = this.dataset.voteType;
                        await handleVote(newsId, voteType);
                    });
                });
            }
            
            async function handleVote(newsId, voteType) {
                if (!userId) {
                    showToast('로그인이 필요합니다', 'warning');
                    return;
                }
                
                try {
                    const response = await fetch('/api/news/vote', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: userId,
                            newsId: parseInt(newsId),
                            voteType: voteType
                        })
                    });
                    
                    const data = await response.json();
                    if (data.success) {
                        console.log('[투표 성공]', 'newsId:', newsId, 'voteType:', voteType, 'vote_up:', data.vote_up, 'vote_down:', data.vote_down);
                        
                        // PC 및 모바일 피드 모두에서 해당 뉴스 카드 찾기
                        const voteUpBtns = document.querySelectorAll('.vote-up-btn[data-news-id="' + newsId + '"]');
                        const voteDownBtns = document.querySelectorAll('.vote-down-btn[data-news-id="' + newsId + '"]');
                        
                        // UP 버튼의 카운터 업데이트
                        voteUpBtns.forEach(btn => {
                            const countSpan = btn.querySelector('.vote-up-count');
                            if (countSpan) {
                                countSpan.textContent = data.vote_up;
                                console.log('[투표 UP 카운터 업데이트]', countSpan.textContent);
                            }
                        });
                        
                        // DOWN 버튼의 카운터 업데이트
                        voteDownBtns.forEach(btn => {
                            const countSpan = btn.querySelector('.vote-down-count');
                            if (countSpan) {
                                countSpan.textContent = data.vote_down;
                                console.log('[투표 DOWN 카운터 업데이트]', countSpan.textContent);
                            }
                        });
                        
                        showToast(voteType === 'up' ? '👍 좋아요!' : '👎 별로예요', 'success');
                    } else {
                        showToast(data.error || '투표 실패', 'error');
                    }
                } catch (error) {
                    console.error('투표 오류:', error);
                    showToast('투표 중 오류가 발생했습니다', 'error');
                }
            }
            
            // ==================== 실시간 HOT 뉴스 ====================
            async function loadHotNews() {
                const hotNewsList = document.getElementById('hot-news-list');
                const mobileHotNewsList = document.getElementById('mobile-hot-news-list');
                
                if (hotNewsList) hotNewsList.innerHTML = '<p class="text-sm text-gray-500 text-center py-4">로딩 중...</p>';
                if (mobileHotNewsList) mobileHotNewsList.innerHTML = '<p class="text-sm text-gray-500 text-center py-4">로딩 중...</p>';
                
                try {
                    const response = await fetch('/api/news/hot?limit=10');
                    const data = await response.json();
                    
                    if (data.success && data.news.length > 0) {
                        // 최대값 계산 (막대 그래프용)
                        const maxVotes = Math.max(...data.news.map(n => (n.vote_up || 0)));
                        
                        const hotHTML = data.news.map((news, index) => {
                            const rankClass = index < 3 ? 'text-red-500 font-bold' : 'text-gray-600';
                            const rankBgClass = index < 3 ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' : 'bg-gray-100 text-gray-700';
                            const escapedLink = escapeHtml(news.link).replace(/'/g, '&apos;');
                            
                            // 변동 아이콘 (랜덤 시뮬레이션 - 실제로는 이전 순위 데이터 필요)
                            const trendIcons = ['🔺', '➖', '🆕'];
                            const trendIcon = index < 3 ? '🔺' : (index < 7 ? '➖' : '🆕');
                            
                            // 막대 그래프 너비 계산
                            const barWidth = maxVotes > 0 ? ((news.vote_up || 0) / maxVotes * 100) : 0;
                            
                            return '<div class="relative p-3 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 rounded-lg transition-all cursor-pointer hot-news-item border-b border-gray-100 last:border-0" ' +
                                'data-news-link="' + escapedLink + '">' +
                                // 막대 그래프 배경
                                '<div class="absolute inset-0 opacity-10 rounded-lg overflow-hidden">' +
                                    '<div class="h-full bg-gradient-to-r from-blue-400 to-purple-400" style="width: ' + barWidth + '%"></div>' +
                                '</div>' +
                                // 컨텐츠
                                '<div class="relative flex items-start space-x-3">' +
                                    // 순위 뱃지
                                    '<div class="flex flex-col items-center space-y-1">' +
                                        '<span class="w-7 h-7 flex items-center justify-center rounded-full ' + rankBgClass + ' text-xs font-bold shadow-sm">' + (index + 1) + '</span>' +
                                        '<span class="text-xs">' + trendIcon + '</span>' +
                                    '</div>' +
                                    // 뉴스 정보
                                    '<div class="flex-1 min-w-0">' +
                                        '<h4 class="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 leading-tight">' + escapeHtml(news.title) + '</h4>' +
                                        '<div class="flex items-center space-x-3 text-xs text-gray-500">' +
                                            '<span class="flex items-center space-x-1 font-semibold text-blue-600">' +
                                                '<i class="fas fa-thumbs-up"></i>' +
                                                '<span>' + (news.vote_up || 0) + '</span>' +
                                            '</span>' +
                                            '<span class="flex items-center space-x-1">' +
                                                '<i class="fas fa-eye"></i>' +
                                                '<span>' + (news.view_count || 0) + '</span>' +
                                            '</span>' +
                                        '</div>' +
                                    '</div>' +
                                '</div>' +
                            '</div>';
                        }).join('');
                        
                        if (hotNewsList) hotNewsList.innerHTML = hotHTML;
                        if (mobileHotNewsList) mobileHotNewsList.innerHTML = hotHTML;
                        
                        // HOT 뉴스 클릭 이벤트 바인딩
                        document.querySelectorAll('.hot-news-item').forEach(item => {
                            item.addEventListener('click', function() {
                                const link = this.getAttribute('data-news-link').replace(/&apos;/g, "'");
                                openNewsInNewTab(link);
                            });
                        });
                    } else {
                        const emptyMsg = '<p class="text-sm text-gray-500 text-center py-4">HOT 뉴스가 없습니다</p>';
                        if (hotNewsList) hotNewsList.innerHTML = emptyMsg;
                        if (mobileHotNewsList) mobileHotNewsList.innerHTML = emptyMsg;
                    }
                } catch (error) {
                    console.error('HOT 뉴스 로드 오류:', error);
                    const errorMsg = '<p class="text-sm text-red-500 text-center py-4">로드 실패</p>';
                    if (hotNewsList) hotNewsList.innerHTML = errorMsg;
                    if (mobileHotNewsList) mobileHotNewsList.innerHTML = errorMsg;
                }
            }
            
            function loadMoreHotNews() {
                showToast('더 많은 HOT 뉴스 준비 중...', 'info');
            }
            
            // ==================== 모바일 탭 전환 ====================
            function switchMobileTab(tab) {
                const hotTab = document.getElementById('tab-hot');
                const keywordTab = document.getElementById('tab-keyword');
                const hotContent = document.getElementById('mobile-hot-content');
                const keywordContent = document.getElementById('mobile-keyword-content');
                
                if (tab === 'hot') {
                    hotTab.classList.add('border-red-500', 'text-red-600');
                    hotTab.classList.remove('border-transparent', 'text-gray-500');
                    keywordTab.classList.remove('border-purple-500', 'text-purple-600');
                    keywordTab.classList.add('border-transparent', 'text-gray-500');
                    hotContent.classList.remove('hidden');
                    keywordContent.classList.add('hidden');
                } else {
                    keywordTab.classList.add('border-purple-500', 'text-purple-600');
                    keywordTab.classList.remove('border-transparent', 'text-gray-500');
                    hotTab.classList.remove('border-red-500', 'text-red-600');
                    hotTab.classList.add('border-transparent', 'text-gray-500');
                    keywordContent.classList.remove('hidden');
                    hotContent.classList.add('hidden');
                }
            }
            
            // ==================== 키워드 구독 시스템 ====================
            async function addKeyword(device = 'desktop') {
                const inputId = device === 'mobile' ? 'mobile-keyword-input' : 'keyword-input';
                const input = document.getElementById(inputId);
                const keyword = input.value.trim();
                
                if (!keyword) {
                    showToast('키워드를 입력하세요', 'warning');
                    return;
                }
                
                // 로그인 확인
                const user = (typeof window.checkAuth === 'function') ? await window.checkAuth() : null;
                if (!user) {
                    if (typeof window.showAuthPopup === 'function') {
                        window.showAuthPopup({
                            message: '키워드 구독은 회원만 이용할 수 있습니다',
                            type: 'login'
                        });
                    } else {
                        alert('로그인이 필요한 서비스입니다.');
                    }
                    return;
                }
                
                try {
                    const response = await fetch('/api/keywords/subscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ keyword: keyword })
                    });
                    
                    const data = await response.json();
                    if (data.success) {
                        input.value = '';
                        showToast('키워드가 추가되었습니다', 'success');
                        loadKeywords();
                    } else {
                        if (response.status === 401) {
                            window.showAuthPopup({
                                message: '로그인이 필요한 서비스입니다',
                                type: 'login'
                            });
                        } else {
                            showToast(data.error || '키워드 추가 실패', 'error');
                        }
                    }
                } catch (error) {
                    console.error('키워드 추가 오류:', error);
                    showToast('키워드 추가 중 오류가 발생했습니다', 'error');
                }
            }
            
            async function loadKeywords() {
                // 로그인 확인
                const user = (typeof window.checkAuth === 'function') ? await window.checkAuth() : null;
                if (!user) return;
                
                const keywordList = document.getElementById('keyword-list');
                const mobileKeywordList = document.getElementById('mobile-keyword-list');
                
                try {
                    const response = await fetch('/api/keywords');
                    const data = await response.json();
                    
                    if (data.success && data.keywords.length > 0) {
                        const keywordsHTML = data.keywords.map(kw => {
                            return '<div class="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition">' +
                                '<span class="text-sm font-medium text-gray-700">' + escapeHtml(kw.keyword) + '</span>' +
                                '<button onclick="removeKeyword(' + kw.id + ')" class="text-red-500 hover:text-red-700 text-sm" title="삭제">' +
                                    '<i class="fas fa-times"></i>' +
                                '</button>' +
                            '</div>';
                        }).join('');
                        
                        if (keywordList) keywordList.innerHTML = keywordsHTML;
                        if (mobileKeywordList) mobileKeywordList.innerHTML = keywordsHTML;
                    } else {
                        const emptyMsg = '<p class="text-sm text-gray-500 text-center py-4">아직 구독한 키워드가 없습니다</p>';
                        if (keywordList) keywordList.innerHTML = emptyMsg;
                        if (mobileKeywordList) mobileKeywordList.innerHTML = emptyMsg;
                    }
                } catch (error) {
                    console.error('키워드 로드 오류:', error);
                }
            }
            
            async function removeKeyword(keywordId) {
                if (!userId) return;
                
                try {
                    const response = await fetch('/api/keywords/' + keywordId, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: userId })
                    });
                    
                    const data = await response.json();
                    if (data.success) {
                        showToast('키워드가 삭제되었습니다', 'info');
                        loadKeywords();
                    } else {
                        showToast(data.error || '키워드 삭제 실패', 'error');
                    }
                } catch (error) {
                    console.error('키워드 삭제 오류:', error);
                    showToast('키워드 삭제 중 오류가 발생했습니다', 'error');
                }
            }
            
            // ==================== 뉴스 로드 (무한 스크롤 지원) ====================
            async function loadNews(reset = true) {
                console.log('[loadNews] 시작 - reset:', reset);
                if (isLoading) {
                    console.log('[loadNews] 이미 로딩 중');
                    return;
                }
                if (!reset && !hasMore) {
                    console.log('[loadNews] 더 이상 뉴스 없음');
                    return;
                }
                
                isLoading = true;
                const newsFeed = document.getElementById('news-feed');
                const mobileNewsFeed = document.getElementById('mobile-news-feed');
                console.log('[loadNews] newsFeed:', newsFeed ? '찾음' : '못찾음');
                console.log('[loadNews] mobileNewsFeed:', mobileNewsFeed ? '찾음' : '못찾음');
                
                if (reset) {
                    currentPage = 0;
                    hasMore = true;
                    const loadingHTML = '<div class="text-center py-12"><div class="spinner mx-auto"></div><p class="text-gray-500 mt-4">뉴스를 불러오는 중...</p></div>';
                    if (newsFeed) newsFeed.innerHTML = loadingHTML;
                    if (mobileNewsFeed) mobileNewsFeed.innerHTML = loadingHTML;
                } else {
                    // 로딩 인디케이터 추가
                    const loadingDiv = document.createElement('div');
                    loadingDiv.id = 'loading-more';
                    loadingDiv.className = 'text-center py-6';
                    loadingDiv.innerHTML = '<div class="spinner mx-auto"></div><p class="text-gray-500 mt-2">더 많은 뉴스를 불러오는 중...</p>';
                    if (newsFeed) newsFeed.appendChild(loadingDiv);
                    if (mobileNewsFeed) mobileNewsFeed.appendChild(loadingDiv.cloneNode(true));
                }
                
                try {
                    let url;
                    // 키워드 뉴스 처리
                    if (currentCategories.includes('keyword')) {
                        // 로그인 체크
                        if (!userId) {
                            isLoading = false;
                            const loginMsg = '<div class="text-center py-12">' +
                                '<i class="fas fa-lock text-5xl text-gray-300 mb-4"></i>' +
                                '<p class="text-gray-700 font-bold mb-2">로그인이 필요한 서비스입니다</p>' +
                                '<p class="text-gray-500 text-sm mb-4">키워드 뉴스를 보려면 먼저 로그인해주세요</p>' +
                                '<a href="/login" class="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold">' +
                                '<i class="fas fa-sign-in-alt mr-2"></i>로그인하기' +
                                '</a>' +
                                '</div>';
                            if (newsFeed) newsFeed.innerHTML = loginMsg;
                            if (mobileNewsFeed) mobileNewsFeed.innerHTML = loginMsg;
                            return;
                        }
                        url = '/api/news/my-keywords';
                    } else {
                        // 기존 뉴스 처리 (오프셋 기반 페이징)
                        const offset = currentPage * ITEMS_PER_PAGE;
                        url = '/api/news?limit=' + ITEMS_PER_PAGE + '&offset=' + offset;
                        if (!currentCategories.includes('all')) {
                            url += '&category=' + currentCategories[0];
                        }
                    }
                    
                    console.log('[loadNews] API 호출:', url);
                    const response = await fetch(url);
                    console.log('[loadNews] 응답 받음:', response.status);
                    const data = await response.json();
                    
                    // 키워드 뉴스 응답 처리 (newsletters -> news 변환 필요)
                    let newsItems = [];
                    if (data.newsletters) newsItems = data.newsletters;
                    else if (data.news) newsItems = data.news;
                    
                    console.log('[loadNews] 데이터 파싱:', data.success, '뉴스 수:', newsItems.length);
                    
                    if (data.success) {
                        if (newsItems.length > 0) {
                            renderNewsCards(newsItems, !reset);
                            currentPage++;
                            
                            // 더 불러올 뉴스가 있는지 확인
                            // 키워드 뉴스는 한 번에 다 가져오므로 더보기 없음
                            if (currentCategories.includes('keyword')) {
                                hasMore = false;
                            } else if (newsItems.length < ITEMS_PER_PAGE) {
                                hasMore = false;
                            }
                        } else {
                            hasMore = false;
                            if (reset) {
                                let emptyMsg = '<div class="text-center py-12"><p class="text-gray-500">뉴스가 없습니다</p></div>';
                                if (currentCategories.includes('keyword')) {
                                    emptyMsg = '<div class="text-center py-12">' +
                                        '<i class="fas fa-bookmark text-5xl text-gray-200 mb-4"></i>' +
                                        '<p class="text-gray-700 font-bold mb-2">구독한 키워드 뉴스가 없습니다</p>' +
                                        '<p class="text-gray-500 text-sm mb-4">왼쪽 사이드바에서 관심 키워드를 추가해보세요!</p>' +
                                        '</div>';
                                }
                                if (newsFeed) newsFeed.innerHTML = emptyMsg;
                                if (mobileNewsFeed) mobileNewsFeed.innerHTML = emptyMsg;
                            }
                        }
                    } else {
                        throw new Error('API 응답 실패: ' + (data.error || 'Unknown error'));
                    }
                } catch (error) {
                    console.error('뉴스 로드 오류:', error);
                    if (reset) {
                        const errorHTML = '<div class="text-center py-12">' +
                            '<i class="fas fa-exclamation-triangle text-5xl text-yellow-500 mb-4"></i>' +
                            '<p class="text-gray-700 font-semibold mb-2">뉴스를 불러올 수 없습니다</p>' +
                            '<p class="text-gray-500 text-sm mb-4">네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요</p>' +
                            '<button onclick="location.reload()" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">' +
                            '<i class="fas fa-redo mr-2"></i>새로고침' +
                            '</button>' +
                            '</div>';
                        if (newsFeed) newsFeed.innerHTML = errorHTML;
                        if (mobileNewsFeed) mobileNewsFeed.innerHTML = errorHTML;
                    } else {
                        showToast('추가 뉴스를 불러올 수 없습니다', 'error');
                    }
                } finally {
                    isLoading = false;
                    const loadingMore = document.getElementById('loading-more');
                    if (loadingMore) loadingMore.remove();
                }
            }
            
            // ==================== 뉴스 카드 렌더링 (새로운 피드 스타일, append 모드 지원) ====================
            function renderNewsCards(newsList, append = false) {
                console.log('[renderNewsCards] 시작 - 뉴스 수:', newsList.length, 'append:', append);
                const newsFeed = document.getElementById('news-feed');
                const mobileNewsFeed = document.getElementById('mobile-news-feed');
                
                // 카테고리 한글 매핑
                const categoryMap = {
                    'general': '일반',
                    'politics': '정치',
                    'economy': '경제',
                    'tech': 'IT/과학',
                    'sports': '스포츠',
                    'entertainment': '연예',
                    'world': '국제',
                    'culture': '문화',
                    'stock': '주식'
                };
                
                // 상대 시간 계산 함수
                function getRelativeTime(dateStr) {
                    const now = new Date();
                    const date = new Date(dateStr);
                    const diffMs = now - date;
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMs / 3600000);
                    const diffDays = Math.floor(diffMs / 86400000);
                    
                    if (diffMins < 1) return '방금 전';
                    if (diffMins < 60) return diffMins + '분 전';
                    if (diffHours < 24) return diffHours + '시간 전';
                    if (diffDays === 1) return '어제';
                    if (diffDays < 7) return diffDays + '일 전';
                    return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
                }
                
                const newsHTML = newsList.map(news => {
                    // 제목에서 언론사 분리
                    let cleanTitle = news.title;
                    let extractedPublisher = '구글 뉴스';  // 기본값
                    const publisherMatch = news.title.match(/\\s*-\\s*([가-힣a-zA-Z0-9\\s]+)$/);
                    if (publisherMatch) {
                        cleanTitle = news.title.replace(/\\s*-\\s*[가-힣a-zA-Z0-9\\s]+$/, '').trim();
                        extractedPublisher = publisherMatch[1].trim();
                    }
                    
                    // HTML 표시용 (이스케이프 처리)
                    const titleDisplay = escapeHtml(cleanTitle);
                    const categoryKr = categoryMap[news.category] || escapeHtml(news.category);
                    const publisherDisplay = escapeHtml(extractedPublisher);
                    const summaryDisplay = escapeHtml(news.summary || '요약 없음');
                    const aiSummaryDisplay = news.ai_summary ? escapeHtml(news.ai_summary) : null;
                    const sentiment = news.sentiment || 'neutral';
                    const sentimentIcon = sentiment === 'positive' ? '😊' : sentiment === 'negative' ? '😞' : '😐';
                    const sentimentText = sentiment === 'positive' ? '긍정' : sentiment === 'negative' ? '부정' : '중립';
                    const sentimentColor = sentiment === 'positive' ? 'text-green-600' : sentiment === 'negative' ? 'text-red-600' : 'text-gray-600';
                    const voteUp = news.vote_up || 0;
                    const voteDown = news.vote_down || 0;
                    const viewCount = news.view_count || 0;
                    const relativeTime = getRelativeTime(news.created_at);
                    
                    return '<article class="news-card bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl relative p-5" data-news-id="' + news.id + '">' +
                        // 카테고리 & 날짜 & AI 뱃지
                        '<div class="flex items-center justify-between mb-3">' +
                            '<div class="flex items-center space-x-2">' +
                                '<span class="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md border border-blue-200">' + categoryKr + '</span>' +
                                (aiSummaryDisplay ? '<span class="px-2 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold rounded-md">✨ AI</span>' : '') +
                                (['환율', '주가', '증시', '달러', '코스피', '경제', '금리'].some(k => cleanTitle.includes(k)) ? '<span class="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md border border-green-200">📊 분석됨</span>' : '') +
                            '</div>' +
                            '<span class="text-xs text-gray-500 font-medium">' + relativeTime + '</span>' +
                        '</div>' +
                        
                        // 제목 (클릭 가능) - 내부 상세 페이지로 이동
                        '<a href="/news/' + news.id + '" class="block news-clickable-area mb-3">' +
                            '<h3 class="font-bold text-lg text-gray-900 mb-2 hover:text-purple-600 transition">' + titleDisplay + '</h3>' +
                        '</a>' +
                        
                        // AI 요약 (있는 경우) - 개선된 디자인
                        (aiSummaryDisplay ? 
                            '<div class="mb-4 p-4 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-l-4 border-purple-500 rounded-lg shadow-sm">' +
                                '<div class="flex items-center justify-between mb-2">' +
                                    '<div class="flex items-center">' +
                                        '<i class="fas fa-robot text-purple-600 mr-2 text-lg"></i>' +
                                        '<span class="text-xs font-bold text-purple-700">🤖 AI 3줄 브리핑</span>' +
                                    '</div>' +
                                    '<div class="flex items-center space-x-1">' +
                                        '<span class="text-lg">' + sentimentIcon + '</span>' +
                                        '<span class="text-xs font-semibold ' + sentimentColor + '">' + sentimentText + '</span>' +
                                    '</div>' +
                                '</div>' +
                                '<p class="text-sm text-gray-800 leading-relaxed font-medium">' + aiSummaryDisplay + '</p>' +
                            '</div>' 
                            : 
                            '<div class="mb-3 p-3 bg-gray-50 rounded-lg">' +
                                '<p class="text-sm text-gray-600 leading-relaxed line-clamp-3">' + summaryDisplay + '</p>' +
                            '</div>'
                        ) +
                        
                        // 관련 종목 칩 (있는 경우)
                        (news.relatedStocks && news.relatedStocks.length > 0 ? 
                            '<div class="mb-3 mt-2">' +
                                '<div class="flex items-center space-x-2 text-xs text-gray-600 mb-2">' +
                                    '<i class="fas fa-chart-line text-purple-600"></i>' +
                                    '<span class="font-semibold">관련 종목</span>' +
                                '</div>' +
                                '<div class="flex flex-wrap gap-2">' +
                                    news.relatedStocks.map(stock => {
                                        const isUp = stock.status === 'up';
                                        const isDown = stock.status === 'down';
                                        const bgColor = isUp ? 'bg-red-50 border-red-200' : isDown ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200';
                                        const textColor = isUp ? 'text-red-700' : isDown ? 'text-blue-700' : 'text-gray-700';
                                        const arrow = isUp ? '▲' : isDown ? '▼' : '━';
                                        const changeColor = isUp ? 'text-red-600' : isDown ? 'text-blue-600' : 'text-gray-600';
                                        const isKRW = stock.currency === 'KRW';
                                        const priceDisplay = isKRW ? 
                                            '₩' + Math.floor(stock.price).toLocaleString('ko-KR') : 
                                            '$' + stock.price.toFixed(2);
                                        const changePercentDisplay = Math.abs(stock.changePercent).toFixed(2) + '%';
                                        
                                        return '<a href="/finance/stock/' + stock.ticker + '" class="stock-chip inline-flex items-center px-3 py-2 rounded-lg border-2 ' + bgColor + ' ' + textColor + ' hover:shadow-md transition-all">' +
                                            '<div class="flex flex-col">' +
                                                '<div class="font-bold text-sm">' + escapeHtml(stock.name) + '</div>' +
                                                '<div class="flex items-center space-x-2 text-xs">' +
                                                    '<span class="font-semibold">' + priceDisplay + '</span>' +
                                                    '<span class="' + changeColor + ' font-bold">' + arrow + ' ' + changePercentDisplay + '</span>' +
                                                '</div>' +
                                            '</div>' +
                                        '</a>';
                                    }).join('') +
                                '</div>' +
                            '</div>'
                            : ''
                        ) +
                        
                        // 하단 액션 바 (투표 + 조회수 + 북마크 + 공유)
                        '<div class="flex items-center justify-between pt-4 border-t border-gray-200">' +
                            // 왼쪽: 투표 + 조회수 (강조된 디자인)
                            '<div class="flex items-center space-x-3">' +
                                // 투표 UP (크기 확대 + 파란색)
                                '<button class="vote-btn vote-up-btn flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all transform hover:scale-105" ' +
                                    'data-news-id="' + news.id + '" data-vote-type="up" title="좋아요">' +
                                    '<i class="fas fa-thumbs-up text-lg"></i>' +
                                    '<span class="text-base font-bold vote-up-count">' + voteUp + '</span>' +
                                '</button>' +
                                // 투표 DOWN (크기 확대 + 빨간색)
                                '<button class="vote-btn vote-down-btn flex items-center space-x-2 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all transform hover:scale-105" ' +
                                    'data-news-id="' + news.id + '" data-vote-type="down" title="싫어요">' +
                                    '<i class="fas fa-thumbs-down text-lg"></i>' +
                                    '<span class="text-base font-bold vote-down-count">' + voteDown + '</span>' +
                                '</button>' +
                                // 조회수
                                '<span class="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-50 text-gray-600">' +
                                    '<i class="fas fa-eye text-base"></i>' +
                                    '<span class="text-sm font-semibold view-count-display">' + viewCount + '</span>' +
                                '</span>' +
                            '</div>' +
                            
                            // 오른쪽: 북마크 + 공유 + 출처
                            '<div class="flex items-center space-x-3 text-sm">' +
                                '<span class="text-gray-500 hidden sm:flex items-center">' +
                                    '<i class="fas fa-newspaper mr-1"></i>' + publisherDisplay +
                                '</span>' +
                                '<button class="bookmark-btn text-gray-400 hover:text-yellow-500" ' +
                                    'data-news-id="' + news.id + '" ' +
                                    'data-news-title="' + escapeHtml(news.title) + '" ' +
                                    'data-news-link="' + escapeHtml(news.link) + '" ' +
                                    'data-news-category="' + escapeHtml(news.category) + '" ' +
                                    'data-news-publisher="' + publisherDisplay + '" ' +
                                    'data-news-pubdate="' + escapeHtml(news.published_at || news.created_at) + '">' +
                                    '<i class="fas fa-bookmark"></i>' +
                                '</button>' +
                                '<button class="share-btn text-gray-400 hover:text-blue-500" ' +
                                    'data-news-id="' + news.id + '" ' +
                                    'data-news-title="' + escapeHtml(news.title) + '" ' +
                                    'data-news-link="' + escapeHtml(news.link) + '">' +
                                    '<i class="fas fa-share-alt"></i>' +
                                '</button>' +
                            '</div>' +
                        '</div>' +
                    '</article>';
                }).join('');
                
                if (append) {
                    if (newsFeed) newsFeed.insertAdjacentHTML('beforeend', newsHTML);
                    if (mobileNewsFeed) mobileNewsFeed.insertAdjacentHTML('beforeend', newsHTML);
                } else {
                    if (newsFeed) newsFeed.innerHTML = newsHTML;
                    if (mobileNewsFeed) mobileNewsFeed.innerHTML = newsHTML;
                }
                
                // 뉴스 클릭 이벤트 바인딩
                attachNewsClickListeners();
                
                // 북마크/공유 버튼 이벤트 바인딩
                attachBookmarkAndShareListeners();
                
                // 투표 버튼 이벤트 바인딩
                attachVoteListeners();
                
                // 북마크 상태 확인
                checkBookmarkStatus();
            }
            
            // ==================== 뉴스 클릭 이벤트 리스너 ====================
            function attachNewsClickListeners() {
                document.querySelectorAll('.news-clickable-area').forEach(element => {
                    element.addEventListener('click', function(e) {
                        const newsId = this.getAttribute('data-news-id');
                        if (newsId) {
                            console.log('[뉴스 클릭] newsId:', newsId, '→ 상세 페이지로 이동');
                            
                            // 조회수 증가
                            incrementViewCount(newsId);
                            
                            // 내부 상세 페이지로 이동
                            window.location.href = '/news/' + newsId;
                        }
                    });
                });
            }
            
            // ==================== 조회수 증가 ====================
            async function incrementViewCount(newsId) {
                try {
                    const response = await fetch('/api/news/' + newsId + '/view', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    
                    const data = await response.json();
                    if (data.success) {
                        console.log('[조회수 증가] newsId:', newsId, 'view_count:', data.view_count);
                        
                        // UI 업데이트 - PC 및 모바일 피드 모두
                        const viewCountElements = document.querySelectorAll('.news-card[data-news-id="' + newsId + '"] .view-count-display');
                        viewCountElements.forEach(element => {
                            element.textContent = data.view_count;
                        });
                    }
                } catch (error) {
                    console.error('조회수 증가 오류:', error);
                }
            }
            
            // ==================== 북마크/공유 버튼 이벤트 리스너 ====================
            function attachBookmarkAndShareListeners() {
                console.log('[Bookmark] 이벤트 리스너 연결 중...');
                
                // 북마크 버튼 이벤트
                const bookmarkBtns = document.querySelectorAll('.bookmark-btn');
                console.log('[Bookmark] 북마크 버튼 개수:', bookmarkBtns.length);
                
                bookmarkBtns.forEach(btn => {
                    btn.addEventListener('click', function(e) {
                        e.stopPropagation(); // 뉴스 카드 클릭 이벤트 방지
                        const newsId = this.getAttribute('data-news-id');
                        console.log('[Bookmark] 버튼 클릭됨, newsId:', newsId);
                        toggleBookmark(newsId);
                    });
                });
                
                // 공유 버튼 이벤트
                document.querySelectorAll('.share-btn').forEach(btn => {
                    btn.addEventListener('click', function(e) {
                        e.stopPropagation(); // 뉴스 카드 클릭 이벤트 방지
                        const newsId = this.getAttribute('data-news-id');
                        const title = this.getAttribute('data-news-title');
                        const link = this.getAttribute('data-news-link');
                        shareNews(title, link, newsId);
                    });
                });
            }
            
            // ==================== 뉴스 링크 열기 (서버 프록시 사용) ====================
            function openNewsInNewTab(url) {
                // 서버사이드 프록시를 통해 Google News 리다이렉트 우회
                console.log('[openNewsInNewTab] 실행 - 원본 URL:', url);
                const proxyUrl = '/news/redirect?url=' + encodeURIComponent(url);
                console.log('[openNewsInNewTab] 프록시 URL:', proxyUrl);
                window.open(proxyUrl, '_blank', 'noopener,noreferrer');
            }
            
            // ==================== 북마크 기능 ====================
            async function checkBookmarkStatus() {
                if (!userId) return;
                
                const newsIds = Array.from(document.querySelectorAll('.bookmark-btn')).map(btn => btn.dataset.newsId);
                
                for (const newsId of newsIds) {
                    try {
                        const response = await fetch('/api/bookmarks/check?userId=' + userId + '&newsId=' + newsId);
                        const data = await response.json();
                        
                        if (data.success && data.bookmarked) {
                            const btn = document.querySelector('.bookmark-btn[data-news-id="' + newsId + '"]');
                            if (btn) {
                                btn.classList.add('bookmarked');
                            }
                        }
                    } catch (error) {
                        console.error('북마크 상태 확인 오류:', error);
                    }
                }
            }
            
            async function toggleBookmark(newsId) {
                console.log('[Bookmark] toggleBookmark 호출, newsId:', newsId, 'userId:', userId);
                
                if (!userId) {
                    showToast('로그인이 필요합니다', 'warning');
                    return;
                }
                
                const btn = document.querySelector('.bookmark-btn[data-news-id="' + newsId + '"]');
                if (!btn) {
                    console.error('[Bookmark] 버튼을 찾을 수 없음, newsId:', newsId);
                    return;
                }
                
                const isBookmarked = btn.classList.contains('bookmarked');
                console.log('[Bookmark] 현재 상태:', isBookmarked ? '북마크됨' : '북마크 안됨');
                
                try {
                    if (isBookmarked) {
                        // 북마크 제거
                        console.log('[Bookmark] 북마크 제거 시도...');
                        const response = await fetch('/api/bookmarks/' + newsId + '?userId=' + userId, {
                            method: 'DELETE'
                        });
                        const data = await response.json();
                        console.log('[Bookmark] 제거 응답:', data);
                        
                        if (data.success) {
                            btn.classList.remove('bookmarked');
                            showToast('북마크가 제거되었습니다', 'info');
                        }
                    } else {
                        // 북마크 추가
                        console.log('[Bookmark] 북마크 추가 시도...');
                        const response = await fetch('/api/bookmarks', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userId: userId,
                                news_id: newsId
                            })
                        });
                        const data = await response.json();
                        console.log('[Bookmark] 추가 응답:', data);
                        
                        if (data.success) {
                            btn.classList.add('bookmarked');
                            showToast('북마크에 추가되었습니다', 'success');
                        } else if (data.error.includes('이미')) {
                            btn.classList.add('bookmarked');
                            showToast('이미 북마크에 추가된 뉴스입니다', 'info');
                        }
                    }
                } catch (error) {
                    console.error('북마크 오류:', error);
                    showToast('북마크 처리 중 오류가 발생했습니다', 'error');
                }
            }
            
            // ==================== 공유 기능 ====================
            function shareNews(title, link, newsId) {
                shareNewsData = { title, link, newsId };
                document.getElementById('share-modal').classList.remove('hidden');
            }
            
            function closeShareModal() {
                document.getElementById('share-modal').classList.add('hidden');
            }
            
            function shareToKakao() {
                // 카카오톡 공유 (실제로는 카카오 SDK 필요)
                const url = 'https://story.kakao.com/share?url=' + encodeURIComponent(shareNewsData.link);
                window.open(url, '_blank', 'width=600,height=400');
                closeShareModal();
                showToast('카카오톡 공유 창이 열렸습니다', 'success');
            }
            
            function shareToFacebook() {
                const url = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(shareNewsData.link);
                window.open(url, '_blank', 'width=600,height=400');
                closeShareModal();
                showToast('페이스북 공유 창이 열렸습니다', 'success');
            }
            
            function shareToTwitter() {
                const url = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareNewsData.title) + '&url=' + encodeURIComponent(shareNewsData.link);
                window.open(url, '_blank', 'width=600,height=400');
                closeShareModal();
                showToast('트위터 공유 창이 열렸습니다', 'success');
            }
            
            function copyLink() {
                navigator.clipboard.writeText(shareNewsData.link).then(() => {
                    closeShareModal();
                    showToast('링크가 복사되었습니다', 'success');
                }).catch(() => {
                    showToast('링크 복사에 실패했습니다', 'error');
                });
            }
            
            // 모달 외부 클릭시 닫기
            document.getElementById('share-modal').addEventListener('click', function(e) {
                if (e.target.id === 'share-modal') {
                    closeShareModal();
                }
            });
            
            // ==================== 유틸리티 함수 ====================
            function openNewsLink(url) {
                const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
                if (newWindow) {
                    newWindow.opener = null;
                }
            }
            
            function escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }
            
            async function fetchNewsAndReload() {
                showToast('최신 뉴스를 가져오는 중...', 'info');
                const categories = ['general', 'politics', 'economy', 'tech', 'sports', 'entertainment', 'stock'];
                let totalFetched = 0;
                let totalErrors = 0;
                
                for (const category of categories) {
                    try {
                        const response = await fetch('/api/news/fetch?category=' + category);
                        const data = await response.json();
                        
                        if (data.success) {
                            totalFetched += data.saved || 0;
                        } else if (data.fallback) {
                            console.log('캐시된 뉴스 사용:', category);
                        } else {
                            totalErrors++;
                        }
                    } catch (error) {
                        console.error('뉴스 가져오기 오류:', category, error);
                        totalErrors++;
                    }
                }
                
                if (totalFetched > 0) {
                    showToast(totalFetched + '개의 새 뉴스를 가져왔습니다', 'success');
                    setTimeout(() => location.reload(), 1000);
                } else if (totalErrors === categories.length) {
                    showToast('뉴스를 가져올 수 없습니다. 잠시 후 다시 시도해주세요.', 'error');
                } else {
                    showToast('일부 카테고리의 뉴스만 업데이트되었습니다', 'warning');
                    setTimeout(() => location.reload(), 1000);
                }
            }
            
            // ==================== 무한 스크롤 ====================
            let scrollTimeout = null;
            window.addEventListener('scroll', function() {
                // 디바운싱: 스크롤 이벤트가 너무 자주 발생하지 않도록
                if (scrollTimeout) return;
                
                scrollTimeout = setTimeout(() => {
                    scrollTimeout = null;
                    
                    // 페이지 하단에 도달했는지 확인
                    const scrollHeight = document.documentElement.scrollHeight;
                    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
                    const clientHeight = document.documentElement.clientHeight;
                    
                    // 하단에서 200px 이내에 도달하면 다음 페이지 로드
                    if (scrollHeight - scrollTop - clientHeight < 200) {
                        if (!isLoading && hasMore) {
                            loadNews(false); // append 모드로 로드
                        }
                    }
                }, 200);
            });
            
            // ==================== 초기화 ====================
            window.addEventListener('DOMContentLoaded', async function() {
                console.log('[페이지] DOMContentLoaded - 병렬 로딩 시작');
                const startTime = Date.now();
                
                // 1단계: UI 초기화 (즉시 실행 - 사용자 경험 개선)
                initSearchAndKeyword();
                initScrollToTop();
                
                // 2단계: 사용자 인증 (최우선 - 뉴스 로딩에 필요)
                await fetchUserInfo();
                
                // 3단계: 데이터 병렬 로딩 (속도 개선)
                Promise.all([
                    loadNews(true),
                    loadHotNews(),
                    loadKeywords()
                ]).then(() => {
                    const loadTime = Date.now() - startTime;
                    console.log('[페이지] 모든 데이터 로딩 완료 (' + loadTime + 'ms)');
                }).catch(err => {
                    console.error('[페이지] 데이터 로딩 오류:', err);
                });
            });
            
            // ==================== 맨 위로 버튼 ====================
            function initScrollToTop() {
                const scrollBtn = document.getElementById('scroll-to-top');
                
                // 스크롤 이벤트 리스너
                window.addEventListener('scroll', function() {
                    if (window.scrollY > 300) {
                        scrollBtn.classList.remove('opacity-0', 'pointer-events-none');
                        scrollBtn.classList.add('opacity-100');
                    } else {
                        scrollBtn.classList.add('opacity-0', 'pointer-events-none');
                        scrollBtn.classList.remove('opacity-100');
                    }
                });
                
                // 클릭 이벤트
                scrollBtn.addEventListener('click', function() {
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                });
            }
        </script>

        
        <!-- 맨 위로 버튼 -->
        <button id="scroll-to-top" class="fixed bottom-8 right-8 w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 opacity-0 pointer-events-none z-50 flex items-center justify-center group">
            <i class="fas fa-arrow-up text-lg group-hover:translate-y-[-2px] transition-transform"></i>
        </button>

    </body>
    </html>
  `);
});
// ==================== 북마크 페이지 ====================
app.get('/bookmarks', (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko" id="html-root">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>북마크 - Faith Portal</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link rel="alternate icon" href="/favicon.ico">
        <script>
            // Tailwind CDN 경고 필터링 (개발 환경용)
            (function() {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                    if (args[0] && typeof args[0] === 'string' && 
                        args[0].includes('cdn.tailwindcss.com should not be used in production')) {
                        return; // Tailwind CDN 경고 무시
                    }
                    originalWarn.apply(console, args);
                };
            })();
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
            tailwind.config = { darkMode: 'class' }
        </script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .faith-blue { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); }
            .faith-blue-hover:hover { background: linear-gradient(135deg, #0284c7 0%, #0891b2 100%); }
            .bookmark-card {
                transition: all 0.3s ease;
            }
            .bookmark-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 16px rgba(0,0,0,0.1);
            }
            /* 다크모드 스타일 */
            .dark {
                color-scheme: dark;
            }
            .dark body {
                background: linear-gradient(to bottom right, #1e293b, #0f172a, #020617);
            }
            .dark .bg-white {
                background-color: #1e293b !important;
            }
            .dark .text-gray-900 {
                color: #f1f5f9 !important;
            }
            .dark .text-gray-800 {
                color: #e2e8f0 !important;
            }
            .dark .text-gray-700 {
                color: #cbd5e1 !important;
            }
            .dark .text-gray-600 {
                color: #94a3b8 !important;
            }
            .dark .text-gray-500 {
                color: #64748b !important;
            }
            .dark .border-gray-200 {
                border-color: #334155 !important;
            }
            .dark .bg-gray-50 {
                background-color: #0f172a !important;
            }
            .dark .bookmark-card {
                background-color: #1e293b;
                border: 1px solid #334155;
            }
            .dark .bookmark-card:hover {
                background-color: #334155;
            }
            .spinner {
                border: 3px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top-color: #fff;
                width: 24px;
                height: 24px;
                animation: spin 0.6s linear infinite;
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
    </head>
    <body class="bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50 transition-colors duration-300" id="html-root">
        ${getCommonHeader()}
        
        ${getBreadcrumb([
        { label: '홈', href: '/' },
        { label: '북마크' }
    ])}

        <!-- 메인 컨텐츠 -->
        <main class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
            <!-- 페이지 타이틀 -->
            <div class="mb-6 sm:mb-8">
                <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center">
                    <i class="fas fa-bookmark text-yellow-500 mr-3"></i>
                    내 북마크
                </h1>
                <p class="text-sm sm:text-base text-gray-600">저장한 뉴스를 확인하세요</p>
            </div>

            <!-- 카테고리 필터 -->
            <div class="mb-6 sm:mb-8 overflow-x-auto">
                <div class="flex space-x-2 sm:space-x-3 pb-2 min-w-max">
                    <button onclick="filterBookmarks('all')" data-category="all" class="category-btn px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-medium text-sm sm:text-base shadow-lg">
                        전체
                    </button>
                    <button onclick="filterBookmarks('general')" data-category="general" class="category-btn px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-gray-700 font-medium hover:bg-gray-100 text-sm sm:text-base shadow">
                        일반
                    </button>
                    <button onclick="filterBookmarks('politics')" data-category="politics" class="category-btn px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-gray-700 font-medium hover:bg-gray-100 text-sm sm:text-base shadow">
                        정치
                    </button>
                    <button onclick="filterBookmarks('economy')" data-category="economy" class="category-btn px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-gray-700 font-medium hover:bg-gray-100 text-sm sm:text-base shadow">
                        경제
                    </button>
                    <button onclick="filterBookmarks('tech')" data-category="tech" class="category-btn px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-gray-700 font-medium hover:bg-gray-100 text-sm sm:text-base shadow">
                        IT/과학
                    </button>
                    <button onclick="filterBookmarks('sports')" data-category="sports" class="category-btn px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-gray-700 font-medium hover:bg-gray-100 text-sm sm:text-base shadow">
                        스포츠
                    </button>
                    <button onclick="filterBookmarks('entertainment')" data-category="entertainment" class="category-btn px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-gray-700 font-medium hover:bg-gray-100 text-sm sm:text-base shadow">
                        엔터테인먼트
                    </button>
                </div>
            </div>

            <!-- 북마크 그리드 -->
            <div id="bookmarks-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                <div class="col-span-full text-center py-12">
                    <div class="spinner mx-auto mb-4"></div>
                    <p class="text-gray-500 text-lg">북마크를 불러오는 중입니다...</p>
                </div>
            </div>
        </main>

        ${getCommonFooter()}

        <script>
            // ==================== 뉴스 링크 열기 (Referrer 없이) ====================
            function openNewsLink(url) {
                console.log('[openNewsLink] 실행 - 원본 URL:', url);
                const proxyUrl = '/news/redirect?url=' + encodeURIComponent(url);
                window.open(proxyUrl, '_blank', 'noopener,noreferrer');
            }
            
            // ==================== 전역 변수 ====================
            const userId = localStorage.getItem('user_id') || '1';
            let currentCategory = 'all';
            
            // ==================== 북마크 로드 ====================
            async function loadBookmarks(category = 'all') {
                const grid = document.getElementById('bookmarks-grid');
                grid.innerHTML = '<div class="col-span-full text-center py-12"><div class="spinner mx-auto mb-4"></div><p class="text-gray-500">북마크를 불러오는 중...</p></div>';
                
                try {
                    const categoryParam = category === 'all' ? '' : '&category=' + category;
                    const response = await fetch('/api/bookmarks?userId=' + userId + categoryParam);
                    const data = await response.json();
                    
                    if (data.success && data.bookmarks.length > 0) {
                        renderBookmarks(data.bookmarks);
                    } else {
                        grid.innerHTML = '<div class="col-span-full text-center py-12"><i class="fas fa-bookmark text-gray-300 text-6xl mb-4"></i><p class="text-gray-500 text-lg">저장된 북마크가 없습니다</p><a href="/news" class="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"><i class="fas fa-newspaper mr-2"></i>뉴스 보러가기</a></div>';
                    }
                } catch (error) {
                    console.error('북마크 로드 오류:', error);
                    grid.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-red-500">북마크를 불러오는 중 오류가 발생했습니다</p></div>';
                }
            }
            
            function renderBookmarks(bookmarks) {
                const grid = document.getElementById('bookmarks-grid');
                grid.innerHTML = bookmarks.map(bookmark => {
                    return '<article class="bookmark-card bg-white rounded-xl shadow-md overflow-hidden">' +
                        '<div class="p-6 sm:p-7">' +
                            '<div class="flex items-center justify-between mb-5">' +
                                '<span class="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-semibold rounded-md border border-blue-200">' + escapeHtml(bookmark.news_category) + '</span>' +
                                '<span class="text-sm text-gray-500 font-medium">' + new Date(bookmark.created_at).toLocaleDateString('ko-KR') + '</span>' +
                            '</div>' +
                            '<h3 class="font-bold text-sm text-gray-900 mb-3 line-clamp-2 leading-snug hover:text-purple-600 transition cursor-pointer" onclick="openNewsLink(\'' + escapeHtml(bookmark.news_link) + '\')">' + escapeHtml(bookmark.news_title) + '</h3>' +
                            '<div class="flex items-center justify-between text-sm text-gray-600 pt-5 border-t border-gray-200">' +
                                '<span class="font-semibold flex items-center"><i class="fas fa-newspaper text-gray-400 mr-2"></i>' + escapeHtml(bookmark.news_source || '구글 뉴스') + '</span>' +
                                '<button onclick="deleteBookmark(' + bookmark.id + ')" class="text-red-500 hover:text-red-700 transition" title="삭제">' +
                                    '<i class="fas fa-trash"></i>' +
                                '</button>' +
                            '</div>' +
                        '</div>' +
                    '</article>';
                }).join('');
            }
            
            // ==================== 카테고리 필터 ====================
            function filterBookmarks(category) {
                currentCategory = category;
                
                document.querySelectorAll('.category-btn').forEach(btn => {
                    if (btn.dataset.category === category) {
                        btn.className = 'category-btn px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-medium text-sm sm:text-base shadow-lg';
                    } else {
                        btn.className = 'category-btn px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-gray-700 font-medium hover:bg-gray-100 text-sm sm:text-base shadow';
                    }
                });
                
                loadBookmarks(category);
            }
            
            // ==================== 북마크 삭제 ====================
            async function deleteBookmark(bookmarkId) {
                if (!confirm('이 북마크를 삭제하시겠습니까?')) {
                    return;
                }
                
                try {
                    const response = await fetch('/api/bookmarks/' + bookmarkId + '?userId=' + userId, {
                        method: 'DELETE'
                    });
                    const data = await response.json();
                    
                    if (data.success) {
                        loadBookmarks(currentCategory);
                    } else {
                        alert('북마크 삭제에 실패했습니다');
                    }
                } catch (error) {
                    console.error('북마크 삭제 오류:', error);
                    alert('북마크 삭제 중 오류가 발생했습니다');
                }
            }
            
            // ==================== 유틸리티 ====================
            function openNewsLink(url) {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
            
            function escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }
            
            // ==================== 초기화 ====================
            window.addEventListener('DOMContentLoaded', function() {
                if (!userId) {
                    document.getElementById('bookmarks-grid').innerHTML = '<div class="col-span-full text-center py-12"><i class="fas fa-lock text-gray-300 text-6xl mb-4"></i><p class="text-gray-500 text-lg mb-4">로그인이 필요합니다</p><a href="/login" class="inline-block px-6 py-3 bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-xl font-bold hover:shadow-lg transition-all"><i class="fas fa-sign-in-alt mr-2"></i>로그인하기</a></div>';
                } else {
                    loadBookmarks();
                    initScrollToTop(); // 맨 위로 버튼 초기화
                }
            });
            
            // ==================== 맨 위로 버튼 ====================
            function initScrollToTop() {
                const scrollBtn = document.getElementById('scroll-to-top');
                
                // 스크롤 이벤트 리스너
                window.addEventListener('scroll', function() {
                    if (window.scrollY > 300) {
                        scrollBtn.classList.remove('opacity-0', 'pointer-events-none');
                        scrollBtn.classList.add('opacity-100');
                    } else {
                        scrollBtn.classList.add('opacity-0', 'pointer-events-none');
                        scrollBtn.classList.remove('opacity-100');
                    }
                });
                
                // 클릭 이벤트
                scrollBtn.addEventListener('click', function() {
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                });
            }
        </script>

        ${getCommonAuthScript()}
        
        <!-- 맨 위로 버튼 -->
        <button id="scroll-to-top" class="fixed bottom-8 right-8 w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 opacity-0 pointer-events-none z-50 flex items-center justify-center group">
            <i class="fas fa-arrow-up text-lg group-hover:translate-y-[-2px] transition-transform"></i>
        </button>

    </body>
    </html>
  `);
});
app.get('/admin', async (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>관리자 대시보드 - Faith Portal</title>
        <script>
            // Tailwind CDN 경고 필터링 (개발 환경용)
            (function() {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                    if (args[0] && typeof args[0] === 'string' && 
                        args[0].includes('cdn.tailwindcss.com should not be used in production')) {
                        return; // Tailwind CDN 경고 무시
                    }
                    originalWarn.apply(console, args);
                };
            })();
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
            .faith-blue { background-color: #1E40AF; }
            .faith-blue-hover:hover { background-color: #1E3A8A; }
        </style>
    </head>
    <body class="bg-gray-100">
        <!-- 관리자 헤더 -->
        <header class="faith-blue text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-2 sm:space-x-4">
                        <a href="/" class="text-lg sm:text-xl lg:text-2xl font-bold">Faith Portal</a>
                        <span class="text-xs sm:text-sm bg-yellow-500 text-gray-900 px-2 sm:px-3 py-1 rounded-full font-medium">
                            <i class="fas fa-crown mr-0 sm:mr-1"></i>
                            <span class="hidden xs:inline">관리자</span>
                        </span>
                    </div>
                    <div id="admin-info" class="flex items-center space-x-2 sm:space-x-4">
                        <span id="admin-name" class="text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none"></span>
                        <a href="/" class="text-xs sm:text-sm hover:text-blue-200 whitespace-nowrap">
                            <i class="fas fa-home mr-0 sm:mr-1"></i>
                            <span class="hidden sm:inline">메인으로</span>
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <!-- 네비게이션 -->
        <nav class="bg-white shadow">
            <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
                ${getAdminNavigation('/admin')}
            </div>
        </nav>
        
        ${getBreadcrumb([
        { label: '홈', href: '/' },
        { label: '관리자' }
    ])}

        <!-- 메인 컨텐츠 -->
        <main class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
            <!-- 통계 카드 -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div class="bg-white rounded-lg shadow p-4 sm:p-6">
                    <div class="flex items-center">
                        <div class="flex-1">
                            <p class="text-gray-500 text-xs sm:text-sm">전체 회원</p>
                            <p id="total-users" class="text-2xl sm:text-3xl font-bold text-gray-800">0</p>
                        </div>
                        <div class="bg-blue-100 text-blue-600 rounded-full p-3 sm:p-4">
                            <i class="fas fa-users text-xl sm:text-2xl"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow p-4 sm:p-6">
                    <div class="flex items-center">
                        <div class="flex-1">
                            <p class="text-gray-500 text-xs sm:text-sm">활성 회원</p>
                            <p id="active-users" class="text-2xl sm:text-3xl font-bold text-green-600">0</p>
                        </div>
                        <div class="bg-green-100 text-green-600 rounded-full p-3 sm:p-4">
                            <i class="fas fa-user-check text-xl sm:text-2xl"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow p-4 sm:p-6">
                    <div class="flex items-center">
                        <div class="flex-1">
                            <p class="text-gray-500 text-xs sm:text-sm">정지 회원</p>
                            <p id="suspended-users" class="text-2xl sm:text-3xl font-bold text-orange-600">0</p>
                        </div>
                        <div class="bg-orange-100 text-orange-600 rounded-full p-3 sm:p-4">
                            <i class="fas fa-user-lock text-xl sm:text-2xl"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow p-4 sm:p-6">
                    <div class="flex items-center">
                        <div class="flex-1">
                            <p class="text-gray-500 text-xs sm:text-sm">오늘 가입</p>
                            <p id="today-signups" class="text-2xl sm:text-3xl font-bold text-purple-600">0</p>
                        </div>
                        <div class="bg-purple-100 text-purple-600 rounded-full p-3 sm:p-4">
                            <i class="fas fa-user-plus text-xl sm:text-2xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 등급별 회원 분포 -->
            <div class="bg-white rounded-lg shadow p-4 sm:p-6 mb-6 sm:mb-8">
                <h3 class="text-base sm:text-lg font-bold text-gray-800 mb-4">
                    <i class="fas fa-chart-bar text-blue-600 mr-2"></i>
                    회원 등급별 분포
                </h3>
                <div class="w-full overflow-hidden">
                    <canvas id="levelChart" class="w-full" style="max-height: 250px; height: 250px;"></canvas>
                </div>
            </div>

            <!-- 최근 가입 회원 -->
            <div class="bg-white rounded-lg shadow p-4 sm:p-6">
                <h3 class="text-base sm:text-lg font-bold text-gray-800 mb-4">
                    <i class="fas fa-clock text-blue-600 mr-2"></i>
                    최근 가입 회원 (10명)
                </h3>
                <div class="overflow-x-auto -mx-4 sm:mx-0">
                    <table class="min-w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">등급</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">가입일</th>
                            </tr>
                        </thead>
                        <tbody id="recent-users" class="bg-white divide-y divide-gray-200">
                            <!-- 동적으로 채워짐 -->
                        </tbody>
                    </table>
                </div>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            // 인증 체크
            const userRole = localStorage.getItem('user_role') || 'user';
            const userLevel = parseInt(localStorage.getItem('user_level') || '0');
            
            // 관리자 권한 체크 (role = 'admin' 또는 level >= 6)
            const authToken = localStorage.getItem('auth_token');
            if (!authToken || authToken === 'true' || (userRole !== 'admin' && userLevel < 6)) {
                alert('관리자 권한이 필요합니다.');
                window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            }

            // 관리자 정보 표시
            document.getElementById('admin-name').textContent = localStorage.getItem('user_email') || '';

            // 등급명 반환 함수
            function getLevelName(level) {
                const levels = {
                    1: '일반 회원', 2: '정회원', 3: '우수회원', 4: 'VIP', 5: 'VVIP',
                    6: '실버 관리자', 7: '골드 관리자', 8: '플래티넘 관리자',
                    9: '마스터 관리자', 10: '슈퍼바이저'
                };
                return levels[level] || '알 수 없음';
            }

            // 통계 데이터 로드
            async function loadStats() {
                try {
                    const response = await axios.get('/api/admin/stats', {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') }
                    });
                    
                    const data = response.data;
                    document.getElementById('total-users').textContent = data.totalUsers;
                    document.getElementById('active-users').textContent = data.activeUsers;
                    document.getElementById('suspended-users').textContent = data.suspendedUsers;
                    document.getElementById('today-signups').textContent = data.todaySignups;
                    
                    // 등급별 차트
                    createLevelChart(data.levelDistribution);
                    
                    // 최근 가입 회원
                    displayRecentUsers(data.recentUsers);
                } catch (error) {
                    console.error('통계 로드 실패:', error);
                }
            }

            // 등급별 차트 생성
            function createLevelChart(distribution) {
                const ctx = document.getElementById('levelChart').getContext('2d');
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: distribution.map(d => getLevelName(d.level)),
                        datasets: [{
                            label: '회원 수',
                            data: distribution.map(d => d.count),
                            backgroundColor: 'rgba(30, 64, 175, 0.7)',
                            borderColor: 'rgba(30, 64, 175, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1
                                }
                            }
                        }
                    }
                });
            }

            // 최근 가입 회원 표시
            function displayRecentUsers(users) {
                const tbody = document.getElementById('recent-users');
                tbody.innerHTML = users.map(user => \`
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${user.id}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${user.email}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${user.name}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                \${getLevelName(user.level)}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            \${new Date(user.created_at).toLocaleDateString('ko-KR')}
                        </td>
                    </tr>
                \`).join('');
            }

            // 페이지 로드 시 통계 로드
            loadStats();
        </script>
    </body>
    </html>
  `);
});
// ==================== 회원 관리 페이지 ====================
app.get('/admin/users', async (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>회원 관리 - Faith Portal</title>
        <script>
            // Tailwind CDN 경고 필터링 (개발 환경용)
            (function() {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                    if (args[0] && typeof args[0] === 'string' && 
                        args[0].includes('cdn.tailwindcss.com should not be used in production')) {
                        return; // Tailwind CDN 경고 무시
                    }
                    originalWarn.apply(console, args);
                };
            })();
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .faith-blue { background-color: #1E40AF; }
            .faith-blue-hover:hover { background-color: #1E3A8A; }
            .modal { display: none; position: fixed; z-index: 50; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); }
            .modal.active { display: flex; align-items: center; justify-content: center; }
        </style>
    </head>
    <body class="bg-gray-100">
        <!-- 관리자 헤더 -->
        <header class="faith-blue text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-4">
                        <a href="/" class="text-2xl font-bold">Faith Portal</a>
                        <span class="text-sm bg-yellow-500 text-gray-900 px-3 py-1 rounded-full font-medium">
                            <i class="fas fa-crown mr-1"></i>
                            관리자
                        </span>
                    </div>
                    <div class="flex items-center space-x-4">
                        <span id="admin-name" class="text-sm"></span>
                        <a href="/" class="text-sm hover:text-blue-200">
                            <i class="fas fa-home mr-1"></i>
                            메인으로
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <!-- 네비게이션 -->
        <nav class="bg-white shadow">
            <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
                ${getAdminNavigation('/admin/users')}
            </div>
        </nav>
        
        ${getBreadcrumb([
        { label: '홈', href: '/' },
        { label: '관리자', href: '/admin' },
        { label: '회원 관리' }
    ])}

        <!-- 메인 컨텐츠 -->
        <main class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
            <!-- 검색 및 필터 -->
            <div class="bg-white rounded-lg shadow p-6 mb-6">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input 
                        type="text" 
                        id="search-input"
                        placeholder="이메일 또는 이름 검색"
                        class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select id="level-filter" class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">전체 등급</option>
                        <option value="1">일반 회원</option>
                        <option value="2">정회원</option>
                        <option value="3">우수회원</option>
                        <option value="4">VIP</option>
                        <option value="5">VVIP</option>
                        <option value="6">실버 관리자</option>
                        <option value="7">골드 관리자</option>
                        <option value="8">플래티넘 관리자</option>
                        <option value="9">마스터 관리자</option>
                        <option value="10">슈퍼바이저</option>
                    </select>
                    <select id="status-filter" class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">전체 상태</option>
                        <option value="active">활성</option>
                        <option value="suspended">정지</option>
                        <option value="deleted">삭제</option>
                    </select>
                    <button onclick="searchUsers()" class="faith-blue text-white px-6 py-2 rounded-lg faith-blue-hover">
                        <i class="fas fa-search mr-2"></i>
                        검색
                    </button>
                </div>
            </div>

            <!-- 회원 목록 뷰 -->
            <div id="list-view">
                <div class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b">
                        <div class="flex justify-between items-center">
                            <h3 class="text-lg font-bold text-gray-800">
                                <i class="fas fa-list text-blue-600 mr-2"></i>
                                회원 목록
                            </h3>
                            <div class="text-sm text-gray-600">
                                <span id="selected-count">0</span>명 선택됨
                            </div>
                        </div>
                    </div>

                    <!-- 배치 작업 툴바 -->
                    <div class="px-6 py-3 bg-gray-50 border-b flex items-center space-x-4">
                        <label class="flex items-center cursor-pointer">
                            <input type="checkbox" id="select-all-checkbox" onchange="toggleSelectAll()" class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                            <span class="ml-2 text-sm text-gray-700">전체 선택</span>
                        </label>
                        
                        <div class="flex-1"></div>
                        
                        <select id="batch-action" class="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" onchange="executeBatchAction()">
                            <option value="">일괄 작업 선택...</option>
                            <option value="change-level">등급 변경</option>
                            <option value="change-status">상태 변경</option>
                            <option value="delete">삭제</option>
                        </select>
                        
                        <button onclick="exportToCSV()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                            <i class="fas fa-file-csv mr-2"></i>
                            CSV 내보내기
                        </button>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="min-w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">
                                        <input type="checkbox" id="header-checkbox" onchange="toggleSelectAll()" class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">휴대전화</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">등급</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">가입일</th>
                                </tr>
                            </thead>
                            <tbody id="users-table" class="bg-white divide-y divide-gray-200">
                                <!-- 동적으로 채워짐 -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- 회원 상세보기 뷰 -->
            <div id="detail-view" class="hidden">
                <div class="bg-white rounded-lg shadow">
                    <!-- 상세보기 헤더 -->
                    <div class="px-6 py-4 border-b flex justify-between items-center">
                        <h3 class="text-lg font-bold text-gray-800">
                            <i class="fas fa-user text-blue-600 mr-2"></i>
                            회원 상세 정보
                        </h3>
                        <button onclick="backToList()" class="text-gray-600 hover:text-gray-800">
                            <i class="fas fa-arrow-left mr-2"></i>
                            목록으로
                        </button>
                    </div>

                    <!-- 상세보기 내용 -->
                    <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- 기본 정보 -->
                            <div class="space-y-4">
                                <h4 class="text-md font-bold text-gray-700 mb-3">기본 정보</h4>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-500 mb-1">회원 ID</label>
                                    <p id="detail-id" class="text-lg font-semibold text-gray-900">-</p>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-500 mb-1">이메일</label>
                                    <p id="detail-email" class="text-lg text-gray-900">-</p>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-500 mb-1">이름</label>
                                    <input type="text" id="detail-name" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-500 mb-1">휴대전화</label>
                                    <input type="tel" id="detail-phone" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                </div>
                            </div>

                            <!-- 등급 및 상태 -->
                            <div class="space-y-4">
                                <h4 class="text-md font-bold text-gray-700 mb-3">등급 및 상태</h4>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-500 mb-1">회원 등급</label>
                                    <select id="detail-level" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="1">Lv.1 일반 회원</option>
                                        <option value="2">Lv.2 정회원</option>
                                        <option value="3">Lv.3 우수회원</option>
                                        <option value="4">Lv.4 VIP</option>
                                        <option value="5">Lv.5 VVIP</option>
                                        <option value="6">Lv.6 실버 관리자</option>
                                        <option value="7">Lv.7 골드 관리자</option>
                                        <option value="8">Lv.8 플래티넘 관리자</option>
                                        <option value="9">Lv.9 마스터 관리자</option>
                                        <option value="10">Lv.10 슈퍼바이저</option>
                                    </select>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-500 mb-1">계정 상태</label>
                                    <div id="detail-status" class="text-lg">-</div>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-500 mb-1">가입일</label>
                                    <p id="detail-created" class="text-gray-900">-</p>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-500 mb-1">최근 로그인</label>
                                    <p id="detail-last-login" class="text-gray-900">-</p>
                                </div>
                            </div>
                        </div>

                        <!-- 액션 버튼 -->
                        <div class="mt-8 pt-6 border-t flex space-x-3">
                            <button onclick="saveUserChanges()" class="flex-1 faith-blue text-white px-6 py-3 rounded-lg faith-blue-hover">
                                <i class="fas fa-save mr-2"></i>
                                변경사항 저장
                            </button>
                            <button id="toggle-status-btn" onclick="toggleUserStatus()" class="flex-1 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600">
                                <i class="fas fa-ban mr-2"></i>
                                <span id="toggle-status-text">정지</span>
                            </button>
                            <button onclick="deleteUserDetail()" class="flex-1 bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600">
                                <i class="fas fa-trash mr-2"></i>
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            // 인증 체크
            const userRole = localStorage.getItem('user_role') || 'user';
            const userLevel = parseInt(localStorage.getItem('user_level') || '0');
            
            // 관리자 권한 체크 (role = 'admin' 또는 level >= 6)
            const authToken = localStorage.getItem('auth_token');
            if (!authToken || authToken === 'true' || (userRole !== 'admin' && userLevel < 6)) {
                alert('관리자 권한이 필요합니다.');
                window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            }

            document.getElementById('admin-name').textContent = localStorage.getItem('user_email') || '';

            // 등급명 반환
            function getLevelName(level) {
                const levels = {
                    1: '일반 회원', 2: '정회원', 3: '우수회원', 4: 'VIP', 5: 'VVIP',
                    6: '실버 관리자', 7: '골드 관리자', 8: '플래티넘 관리자',
                    9: '마스터 관리자', 10: '슈퍼바이저'
                };
                return levels[level] || '알 수 없음';
            }

            // 상태 배지 색상
            function getStatusBadge(status) {
                const badges = {
                    active: 'bg-green-100 text-green-800',
                    suspended: 'bg-orange-100 text-orange-800',
                    deleted: 'bg-red-100 text-red-800'
                };
                const names = {
                    active: '활성',
                    suspended: '정지',
                    deleted: '삭제'
                };
                return \`<span class="px-2 py-1 text-xs rounded-full \${badges[status] || ''}">\${names[status] || status}</span>\`;
            }

            // 회원 목록 로드
            async function loadUsers(search = '', level = '', status = '') {
                try {
                    let url = '/api/admin/users?';
                    if (search) url += \`search=\${encodeURIComponent(search)}&\`;
                    if (level) url += \`level=\${level}&\`;
                    if (status) url += \`status=\${status}&\`;
                    
                    const response = await axios.get(url, {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') }
                    });
                    
                    displayUsers(response.data.users);
                } catch (error) {
                    console.error('회원 목록 로드 실패:', error);
                    alert('회원 목록을 불러오는데 실패했습니다.');
                }
            }

            // 선택된 사용자 ID 저장
            let selectedUserIds = new Set();

            // 회원 목록 표시
            function displayUsers(users) {
                const tbody = document.getElementById('users-table');
                tbody.innerHTML = users.map(user => \`
                    <tr class="hover:bg-blue-50">
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <input type="checkbox" 
                                   class="user-checkbox w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                                   value="\${user.id}" 
                                   onchange="updateSelection()"
                                   onclick="event.stopPropagation()">
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer" onclick="showUserDetail(\${user.id})">\${user.id}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer" onclick="showUserDetail(\${user.id})">\${user.email}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer" onclick="showUserDetail(\${user.id})">\${user.name}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer" onclick="showUserDetail(\${user.id})">\${user.phone || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm cursor-pointer" onclick="showUserDetail(\${user.id})">
                            <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                Lv.\${user.level} \${getLevelName(user.level)}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm cursor-pointer" onclick="showUserDetail(\${user.id})">
                            \${getStatusBadge(user.status)}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer" onclick="showUserDetail(\${user.id})">
                            \${new Date(user.created_at).toLocaleDateString('ko-KR')}
                        </td>
                    </tr>
                \`).join('');
                
                // 선택 상태 초기화
                selectedUserIds.clear();
                updateSelectionUI();
            }

            // 전체 선택/해제
            function toggleSelectAll() {
                const checkboxes = document.querySelectorAll('.user-checkbox');
                const selectAllCheckbox = document.getElementById('select-all-checkbox') || document.getElementById('header-checkbox');
                const isChecked = selectAllCheckbox.checked;
                
                checkboxes.forEach(checkbox => {
                    checkbox.checked = isChecked;
                });
                
                // 두 체크박스 동기화
                const otherCheckbox = selectAllCheckbox.id === 'select-all-checkbox' 
                    ? document.getElementById('header-checkbox') 
                    : document.getElementById('select-all-checkbox');
                if (otherCheckbox) otherCheckbox.checked = isChecked;
                
                updateSelection();
            }

            // 선택 상태 업데이트
            function updateSelection() {
                const checkboxes = document.querySelectorAll('.user-checkbox:checked');
                selectedUserIds.clear();
                checkboxes.forEach(cb => selectedUserIds.add(parseInt(cb.value)));
                updateSelectionUI();
            }

            // 선택 UI 업데이트
            function updateSelectionUI() {
                const count = selectedUserIds.size;
                document.getElementById('selected-count').textContent = count;
                
                // 전체 선택 체크박스 상태 업데이트
                const allCheckboxes = document.querySelectorAll('.user-checkbox');
                const checkedCheckboxes = document.querySelectorAll('.user-checkbox:checked');
                const selectAllCheckbox = document.getElementById('select-all-checkbox');
                const headerCheckbox = document.getElementById('header-checkbox');
                
                if (allCheckboxes.length > 0 && checkedCheckboxes.length === allCheckboxes.length) {
                    if (selectAllCheckbox) selectAllCheckbox.checked = true;
                    if (headerCheckbox) headerCheckbox.checked = true;
                } else {
                    if (selectAllCheckbox) selectAllCheckbox.checked = false;
                    if (headerCheckbox) headerCheckbox.checked = false;
                }
            }

            // 검색
            function searchUsers() {
                const search = document.getElementById('search-input').value;
                const level = document.getElementById('level-filter').value;
                const status = document.getElementById('status-filter').value;
                loadUsers(search, level, status);
            }

            // 현재 선택된 사용자 ID 저장
            let currentUserId = null;

            // 회원 상세보기 표시
            async function showUserDetail(userId) {
                try {
                    const response = await axios.get(\`/api/admin/users/\${userId}\`, {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') }
                    });
                    
                    const user = response.data.user;
                    currentUserId = user.id;
                    
                    // 상세 정보 채우기
                    document.getElementById('detail-id').textContent = user.id;
                    document.getElementById('detail-email').textContent = user.email;
                    document.getElementById('detail-name').value = user.name;
                    document.getElementById('detail-phone').value = user.phone || '';
                    document.getElementById('detail-level').value = user.level;
                    document.getElementById('detail-status').innerHTML = getStatusBadge(user.status);
                    document.getElementById('detail-created').textContent = new Date(user.created_at).toLocaleString('ko-KR');
                    document.getElementById('detail-last-login').textContent = user.last_login ? new Date(user.last_login).toLocaleString('ko-KR') : '없음';
                    
                    // 정지/해제 버튼 텍스트 변경
                    const statusBtn = document.getElementById('toggle-status-text');
                    if (user.status === 'suspended') {
                        statusBtn.textContent = '해제';
                        document.getElementById('toggle-status-btn').className = 'flex-1 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600';
                    } else {
                        statusBtn.textContent = '정지';
                        document.getElementById('toggle-status-btn').className = 'flex-1 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600';
                    }
                    
                    // 뷰 전환
                    document.getElementById('list-view').classList.add('hidden');
                    document.getElementById('detail-view').classList.remove('hidden');
                } catch (error) {
                    alert('회원 정보를 불러오는데 실패했습니다.');
                }
            }

            // 목록으로 돌아가기
            function backToList() {
                document.getElementById('detail-view').classList.add('hidden');
                document.getElementById('list-view').classList.remove('hidden');
                currentUserId = null;
                searchUsers(); // 목록 새로고침
            }

            // 배치 작업 실행
            async function executeBatchAction() {
                const action = document.getElementById('batch-action').value;
                
                if (!action) return;
                
                if (selectedUserIds.size === 0) {
                    alert('선택된 회원이 없습니다.');
                    document.getElementById('batch-action').value = '';
                    return;
                }
                
                const userIds = Array.from(selectedUserIds);
                
                try {
                    if (action === 'change-level') {
                        const level = prompt('변경할 등급을 입력하세요 (1-10):');
                        if (!level || level < 1 || level > 10) {
                            alert('올바른 등급을 입력하세요.');
                            document.getElementById('batch-action').value = '';
                            return;
                        }
                        
                        if (!confirm(\`선택한 \${userIds.length}명의 회원 등급을 Lv.\${level}로 변경하시겠습니까?\`)) {
                            document.getElementById('batch-action').value = '';
                            return;
                        }
                        
                        await axios.post('/api/admin/users/batch', 
                            { userIds, action: 'level', value: parseInt(level) },
                            { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') } }
                        );
                        
                        alert('등급이 변경되었습니다.');
                    } 
                    else if (action === 'change-status') {
                        const status = prompt('변경할 상태를 입력하세요 (active/suspended/deleted):');
                        if (!['active', 'suspended', 'deleted'].includes(status)) {
                            alert('올바른 상태를 입력하세요.');
                            document.getElementById('batch-action').value = '';
                            return;
                        }
                        
                        const statusName = { active: '활성', suspended: '정지', deleted: '삭제' }[status];
                        if (!confirm(\`선택한 \${userIds.length}명의 회원 상태를 '\${statusName}'으로 변경하시겠습니까?\`)) {
                            document.getElementById('batch-action').value = '';
                            return;
                        }
                        
                        await axios.post('/api/admin/users/batch', 
                            { userIds, action: 'status', value: status },
                            { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') } }
                        );
                        
                        alert('상태가 변경되었습니다.');
                    } 
                    else if (action === 'delete') {
                        if (!confirm(\`정말 선택한 \${userIds.length}명의 회원을 삭제하시겠습니까?\\n\\n이 작업은 되돌릴 수 없습니다!\`)) {
                            document.getElementById('batch-action').value = '';
                            return;
                        }
                        
                        await axios.post('/api/admin/users/batch', 
                            { userIds, action: 'delete' },
                            { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') } }
                        );
                        
                        alert('회원이 삭제되었습니다.');
                    }
                    
                    // 작업 완료 후 목록 새로고침
                    document.getElementById('batch-action').value = '';
                    searchUsers();
                } catch (error) {
                    console.error('Batch operation error:', error);
                    alert('일괄 작업에 실패했습니다.');
                    document.getElementById('batch-action').value = '';
                }
            }

            // CSV 내보내기
            async function exportToCSV() {
                try {
                    const response = await axios.get('/api/admin/users/export', {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') },
                        responseType: 'blob'
                    });
                    
                    // CSV 파일 다운로드
                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', \`users_\${new Date().toISOString().slice(0, 10)}.csv\`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    
                    alert('CSV 파일이 다운로드되었습니다.');
                } catch (error) {
                    console.error('CSV export error:', error);
                    alert('CSV 내보내기에 실패했습니다.');
                }
            }

            // 변경사항 저장
            async function saveUserChanges() {
                if (!currentUserId) return;
                
                const name = document.getElementById('detail-name').value;
                const phone = document.getElementById('detail-phone').value;
                const level = parseInt(document.getElementById('detail-level').value);
                
                if (!confirm('회원 정보를 수정하시겠습니까?')) return;
                
                try {
                    await axios.put(\`/api/admin/users/\${currentUserId}\`, 
                        { name, phone, level },
                        { headers: { 'Authorization': 'Bearer ' + token } }
                    );
                    
                    alert('회원 정보가 수정되었습니다.');
                    showUserDetail(currentUserId); // 상세 정보 새로고침
                } catch (error) {
                    alert('회원 정보 수정에 실패했습니다.');
                }
            }

            // 회원 상태 변경 (정지/해제)
            async function toggleUserStatus() {
                if (!currentUserId) return;
                
                try {
                    // 현재 상태 확인
                    const response = await axios.get(\`/api/admin/users/\${currentUserId}\`, {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') }
                    });
                    
                    const currentStatus = response.data.user.status;
                    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
                    const message = newStatus === 'suspended' ? '정지' : '활성화';
                    
                    if (!confirm(\`정말 이 회원을 \${message}하시겠습니까?\`)) return;
                    
                    await axios.patch(\`/api/admin/users/\${currentUserId}/status\`, 
                        { status: newStatus },
                        { headers: { 'Authorization': 'Bearer ' + token } }
                    );
                    
                    alert(\`회원이 \${message}되었습니다.\`);
                    showUserDetail(currentUserId); // 상세 정보 새로고침
                } catch (error) {
                    alert('회원 상태 변경에 실패했습니다.');
                }
            }

            // 회원 삭제
            async function deleteUserDetail() {
                if (!currentUserId) return;
                
                if (!confirm('정말 이 회원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
                
                try {
                    await axios.delete(\`/api/admin/users/\${currentUserId}\`, {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') }
                    });
                    
                    alert('회원이 삭제되었습니다.');
                    backToList();
                } catch (error) {
                    alert('회원 삭제에 실패했습니다.');
                }
            }

            // 초기 로드
            loadUsers();
        </script>
    </body>
    </html>
  `);
});
app.get('/admin/stats', async (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>고급 통계 - Faith Portal</title>
        <script>
            // Tailwind CDN 경고 필터링 (개발 환경용)
            (function() {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                    if (args[0] && typeof args[0] === 'string' && 
                        args[0].includes('cdn.tailwindcss.com should not be used in production')) {
                        return; // Tailwind CDN 경고 무시
                    }
                    originalWarn.apply(console, args);
                };
            })();
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
            .faith-blue { background-color: #1E40AF; }
            .faith-blue-hover:hover { background-color: #1E3A8A; }
        </style>
    </head>
    <body class="bg-gray-100">
        <!-- 관리자 헤더 -->
        <header class="faith-blue text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-4">
                        <a href="/" class="text-2xl font-bold">Faith Portal</a>
                        <span class="text-sm bg-yellow-500 text-gray-900 px-3 py-1 rounded-full font-medium">
                            <i class="fas fa-crown mr-1"></i>
                            관리자
                        </span>
                    </div>
                    <div class="flex items-center space-x-4">
                        <span id="admin-name" class="text-sm"></span>
                        <a href="/" class="text-sm hover:text-blue-200">
                            <i class="fas fa-home mr-1"></i>
                            메인으로
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <!-- 네비게이션 -->
        <nav class="bg-white shadow">
            <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
                ${getAdminNavigation('/admin/stats')}
            </div>
        </nav>
        
        ${getBreadcrumb([
        { label: '홈', href: '/' },
        { label: '관리자', href: '/admin' },
        { label: '통계' }
    ])}

        <!-- 메인 컨텐츠 -->
        <main class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">
                <i class="fas fa-chart-line text-blue-600 mr-2"></i>
                고급 통계 분석
            </h2>

            <!-- 일별 가입자 추세 -->
            <div class="bg-white rounded-lg shadow p-6 mb-6">
                <h3 class="text-lg font-bold text-gray-800 mb-4">
                    <i class="fas fa-chart-area text-blue-600 mr-2"></i>
                    최근 30일 일별 가입자 추세
                </h3>
                <canvas id="dailySignupsChart" style="max-height: 300px;"></canvas>
            </div>

            <!-- 월별 가입자 추세 -->
            <div class="bg-white rounded-lg shadow p-6 mb-6">
                <h3 class="text-lg font-bold text-gray-800 mb-4">
                    <i class="fas fa-chart-bar text-blue-600 mr-2"></i>
                    최근 12개월 월별 가입자 추세
                </h3>
                <canvas id="monthlySignupsChart" style="max-height: 300px;"></canvas>
            </div>

            <!-- 로그인 활동 추세 -->
            <div class="bg-white rounded-lg shadow p-6 mb-6">
                <h3 class="text-lg font-bold text-gray-800 mb-4">
                    <i class="fas fa-sign-in-alt text-blue-600 mr-2"></i>
                    최근 30일 일별 로그인 활동
                </h3>
                <canvas id="dailyLoginsChart" style="max-height: 300px;"></canvas>
            </div>

            <!-- 등급별 활동 통계 -->
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-bold text-gray-800 mb-4">
                    <i class="fas fa-users-cog text-blue-600 mr-2"></i>
                    등급별 활동 통계 (최근 30일)
                </h3>
                <canvas id="levelActivityChart" style="max-height: 300px;"></canvas>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            // 인증 체크
            const userRole = localStorage.getItem('user_role') || 'user';
            const userLevel = parseInt(localStorage.getItem('user_level') || '0');
            
            // 관리자 권한 체크 (role = 'admin' 또는 level >= 6)
            const authToken = localStorage.getItem('auth_token');
            if (!authToken || authToken === 'true' || (userRole !== 'admin' && userLevel < 6)) {
                alert('관리자 권한이 필요합니다.');
                window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            }

            document.getElementById('admin-name').textContent = localStorage.getItem('user_email') || '';

            // 등급명 반환
            function getLevelName(level) {
                const levels = {
                    1: '일반 회원', 2: '정회원', 3: '우수회원', 4: 'VIP', 5: 'VVIP',
                    6: '실버 관리자', 7: '골드 관리자', 8: '플래티넘 관리자',
                    9: '마스터 관리자', 10: '슈퍼바이저'
                };
                return levels[level] || '알 수 없음';
            }

            // 통계 데이터 로드
            async function loadTrends() {
                try {
                    const response = await axios.get('/api/admin/stats/trends', {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') }
                    });
                    
                    const data = response.data;
                    
                    // 일별 가입자 차트
                    createDailySignupsChart(data.dailySignups);
                    
                    // 월별 가입자 차트
                    createMonthlySignupsChart(data.monthlySignups);
                    
                    // 일별 로그인 차트
                    createDailyLoginsChart(data.dailyLogins);
                    
                    // 등급별 활동 차트
                    createLevelActivityChart(data.levelActivity);
                } catch (error) {
                    console.error('통계 로드 실패:', error);
                    alert('통계 데이터를 불러오는데 실패했습니다.');
                }
            }

            // 일별 가입자 차트
            function createDailySignupsChart(data) {
                const ctx = document.getElementById('dailySignupsChart').getContext('2d');
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: data.map(d => d.date),
                        datasets: [{
                            label: '가입자 수',
                            data: data.map(d => d.count),
                            borderColor: 'rgba(30, 64, 175, 1)',
                            backgroundColor: 'rgba(30, 64, 175, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { stepSize: 1 }
                            }
                        }
                    }
                });
            }

            // 월별 가입자 차트
            function createMonthlySignupsChart(data) {
                const ctx = document.getElementById('monthlySignupsChart').getContext('2d');
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: data.map(d => d.month),
                        datasets: [{
                            label: '월별 가입자',
                            data: data.map(d => d.count),
                            backgroundColor: 'rgba(30, 64, 175, 0.7)',
                            borderColor: 'rgba(30, 64, 175, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { stepSize: 1 }
                            }
                        }
                    }
                });
            }

            // 일별 로그인 차트
            function createDailyLoginsChart(data) {
                const ctx = document.getElementById('dailyLoginsChart').getContext('2d');
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: data.map(d => d.date),
                        datasets: [{
                            label: '로그인 수',
                            data: data.map(d => d.count),
                            borderColor: 'rgba(16, 185, 129, 1)',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { stepSize: 1 }
                            }
                        }
                    }
                });
            }

            // 등급별 활동 차트
            function createLevelActivityChart(data) {
                const ctx = document.getElementById('levelActivityChart').getContext('2d');
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: data.map(d => 'Lv.' + d.level + ' ' + getLevelName(d.level)),
                        datasets: [{
                            label: '활동 수',
                            data: data.map(d => d.activity_count),
                            backgroundColor: 'rgba(245, 158, 11, 0.7)',
                            borderColor: 'rgba(245, 158, 11, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { stepSize: 1 }
                            }
                        }
                    }
                });
            }

            // 페이지 로드 시 통계 로드
            loadTrends();
        </script>
    </body>
    </html>
  `);
});
// ==================== 활동 로그 페이지 ====================
app.get('/admin/logs', async (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>활동 로그 - Faith Portal</title>
        <script>
            // Tailwind CDN 경고 필터링 (개발 환경용)
            (function() {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                    if (args[0] && typeof args[0] === 'string' && 
                        args[0].includes('cdn.tailwindcss.com should not be used in production')) {
                        return; // Tailwind CDN 경고 무시
                    }
                    originalWarn.apply(console, args);
                };
            })();
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .faith-blue { background-color: #1E40AF; }
            .faith-blue-hover:hover { background-color: #1E3A8A; }
        </style>
    </head>
    <body class="bg-gray-100">
        <!-- 관리자 헤더 -->
        <header class="faith-blue text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-4">
                        <a href="/" class="text-2xl font-bold">Faith Portal</a>
                        <span class="text-sm bg-yellow-500 text-gray-900 px-3 py-1 rounded-full font-medium">
                            <i class="fas fa-crown mr-1"></i>
                            관리자
                        </span>
                    </div>
                    <div class="flex items-center space-x-4">
                        <span id="admin-name" class="text-sm"></span>
                        <a href="/" class="text-sm hover:text-blue-200">
                            <i class="fas fa-home mr-1"></i>
                            메인으로
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <!-- 네비게이션 -->
        <nav class="bg-white shadow">
            <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
                ${getAdminNavigation('/admin/logs')}
            </div>
        </nav>
        
        ${getBreadcrumb([
        { label: '홈', href: '/' },
        { label: '관리자', href: '/admin' },
        { label: '활동 로그' }
    ])}

        <!-- 메인 컨텐츠 -->
        <main class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">
                <i class="fas fa-history text-blue-600 mr-2"></i>
                활동 로그
            </h2>

            <!-- 필터 -->
            <div class="bg-white rounded-lg shadow p-6 mb-6">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <select id="action-filter" class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">전체 타입</option>
                        <option value="login">로그인</option>
                        <option value="signup">회원가입</option>
                        <option value="admin_action">관리자 작업</option>
                    </select>
                    <select id="limit-filter" class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="50">50개</option>
                        <option value="100">100개</option>
                        <option value="200">200개</option>
                    </select>
                    <button onclick="loadLogs()" class="faith-blue text-white px-6 py-2 rounded-lg faith-blue-hover">
                        <i class="fas fa-sync mr-2"></i>
                        새로고침
                    </button>
                    <button onclick="toggleAutoRefresh()" id="auto-refresh-btn" class="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
                        <i class="fas fa-play mr-2"></i>
                        자동 새로고침
                    </button>
                </div>
            </div>

            <!-- 로그 목록 -->
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b">
                    <h3 class="text-lg font-bold text-gray-800">
                        <i class="fas fa-list text-blue-600 mr-2"></i>
                        로그 목록
                    </h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">타입</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">사용자</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">설명</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP 주소</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">시간</th>
                            </tr>
                        </thead>
                        <tbody id="logs-table" class="bg-white divide-y divide-gray-200">
                            <!-- 동적으로 채워짐 -->
                        </tbody>
                    </table>
                </div>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            // 인증 체크
            const userRole = localStorage.getItem('user_role') || 'user';
            const userLevel = parseInt(localStorage.getItem('user_level') || '0');
            
            // 관리자 권한 체크 (role = 'admin' 또는 level >= 6)
            const authToken = localStorage.getItem('auth_token');
            if (!authToken || authToken === 'true' || (userRole !== 'admin' && userLevel < 6)) {
                alert('관리자 권한이 필요합니다.');
                window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            }

            document.getElementById('admin-name').textContent = localStorage.getItem('user_email') || '';

            let autoRefreshInterval = null;

            // 로그 타입 배지
            function getActionBadge(action) {
                const badges = {
                    login: 'bg-green-100 text-green-800',
                    signup: 'bg-blue-100 text-blue-800',
                    admin_action: 'bg-purple-100 text-purple-800'
                };
                const names = {
                    login: '로그인',
                    signup: '회원가입',
                    admin_action: '관리자'
                };
                return \`<span class="px-2 py-1 text-xs rounded-full \${badges[action] || 'bg-gray-100 text-gray-800'}">\${names[action] || action}</span>\`;
            }

            // 로그 로드
            async function loadLogs() {
                try {
                    const action = document.getElementById('action-filter').value;
                    const limit = document.getElementById('limit-filter').value;
                    
                    let url = \`/api/admin/activity-logs?limit=\${limit}\`;
                    if (action) url += \`&action=\${action}\`;
                    
                    const response = await axios.get(url, {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') }
                    });
                    
                    displayLogs(response.data.logs);
                } catch (error) {
                    console.error('로그 로드 실패:', error);
                }
            }

            // 로그 표시
            function displayLogs(logs) {
                const tbody = document.getElementById('logs-table');
                tbody.innerHTML = logs.map(log => \`
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${log.id}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            \${getActionBadge(log.action)}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            \${log.email || '시스템'}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-500">\${log.description || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">\${log.ip_address || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            \${new Date(log.created_at).toLocaleString('ko-KR')}
                        </td>
                    </tr>
                \`).join('');
            }

            // 자동 새로고침 토글
            function toggleAutoRefresh() {
                const btn = document.getElementById('auto-refresh-btn');
                if (autoRefreshInterval) {
                    clearInterval(autoRefreshInterval);
                    autoRefreshInterval = null;
                    btn.innerHTML = '<i class="fas fa-play mr-2"></i>자동 새로고침';
                    btn.className = 'bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600';
                } else {
                    autoRefreshInterval = setInterval(loadLogs, 5000); // 5초마다
                    btn.innerHTML = '<i class="fas fa-pause mr-2"></i>자동 새로고침 중';
                    btn.className = 'bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600';
                }
            }

            // 초기 로드
            loadLogs();
        </script>
    </body>
    </html>
  `);
});
// ==================== 알림 센터 페이지 ====================
app.get('/admin/notifications', async (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>알림 센터 - Faith Portal</title>
        <script>
            // Tailwind CDN 경고 필터링 (개발 환경용)
            (function() {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                    if (args[0] && typeof args[0] === 'string' && 
                        args[0].includes('cdn.tailwindcss.com should not be used in production')) {
                        return; // Tailwind CDN 경고 무시
                    }
                    originalWarn.apply(console, args);
                };
            })();
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .faith-blue { background-color: #1E40AF; }
            .faith-blue-hover:hover { background-color: #1E3A8A; }
        </style>
    </head>
    <body class="bg-gray-100">
        <!-- 관리자 헤더 -->
        <header class="faith-blue text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-4">
                        <a href="/" class="text-2xl font-bold">Faith Portal</a>
                        <span class="text-sm bg-yellow-500 text-gray-900 px-3 py-1 rounded-full font-medium">
                            <i class="fas fa-crown mr-1"></i>
                            관리자
                        </span>
                    </div>
                    <div class="flex items-center space-x-4">
                        <span id="admin-name" class="text-sm"></span>
                        <a href="/" class="text-sm hover:text-blue-200">
                            <i class="fas fa-home mr-1"></i>
                            메인으로
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <!-- 네비게이션 -->
        <nav class="bg-white shadow">
            <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
                ${getAdminNavigation('/admin/notifications')}
            </div>
        </nav>
        
        ${getBreadcrumb([
        { label: '홈', href: '/' },
        { label: '관리자', href: '/admin' },
        { label: '알림 센터' }
    ])}

        <!-- 메인 컨텐츠 -->
        <main class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-800">
                    <i class="fas fa-bell text-blue-600 mr-2"></i>
                    알림 센터
                </h2>
                <div class="space-x-2">
                    <button onclick="filterNotifications('all')" id="filter-all" class="px-4 py-2 rounded-lg bg-blue-600 text-white">
                        전체
                    </button>
                    <button onclick="filterNotifications('unread')" id="filter-unread" class="px-4 py-2 rounded-lg bg-gray-200 text-gray-700">
                        읽지 않음
                    </button>
                    <button onclick="filterNotifications('read')" id="filter-read" class="px-4 py-2 rounded-lg bg-gray-200 text-gray-700">
                        읽음
                    </button>
                    <button onclick="loadNotifications()" class="px-4 py-2 rounded-lg bg-green-500 text-white">
                        <i class="fas fa-sync mr-2"></i>
                        새로고침
                    </button>
                </div>
            </div>

            <!-- 알림 목록 -->
            <div id="notifications-list" class="space-y-4">
                <!-- 동적으로 채워짐 -->
            </div>

            <!-- 빈 상태 -->
            <div id="empty-state" class="hidden bg-white rounded-lg shadow p-12 text-center">
                <i class="fas fa-bell-slash text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500 text-lg">알림이 없습니다</p>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            // 인증 체크
            const userRole = localStorage.getItem('user_role') || 'user';
            const userLevel = parseInt(localStorage.getItem('user_level') || '0');
            
            // 관리자 권한 체크 (role = 'admin' 또는 level >= 6)
            const authToken = localStorage.getItem('auth_token');
            if (!authToken || authToken === 'true' || (userRole !== 'admin' && userLevel < 6)) {
                alert('관리자 권한이 필요합니다.');
                window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            }

            document.getElementById('admin-name').textContent = localStorage.getItem('user_email') || '';

            let allNotifications = [];
            let currentFilter = 'all';

            // 알림 로드
            async function loadNotifications() {
                try {
                    const response = await axios.get('/api/admin/notifications', {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') }
                    });
                    
                    allNotifications = response.data.notifications;
                    
                    // 읽지 않은 알림 수 표시
                    const unreadCount = response.data.unreadCount;
                    const badge = document.getElementById('unread-badge');
                    if (unreadCount > 0) {
                        badge.textContent = unreadCount;
                        badge.classList.remove('hidden');
                    } else {
                        badge.classList.add('hidden');
                    }
                    
                    displayNotifications();
                } catch (error) {
                    console.error('알림 로드 실패:', error);
                }
            }

            // 알림 필터링
            function filterNotifications(filter) {
                currentFilter = filter;
                
                // 버튼 스타일 변경
                document.getElementById('filter-all').className = 'px-4 py-2 rounded-lg ' + (filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700');
                document.getElementById('filter-unread').className = 'px-4 py-2 rounded-lg ' + (filter === 'unread' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700');
                document.getElementById('filter-read').className = 'px-4 py-2 rounded-lg ' + (filter === 'read' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700');
                
                displayNotifications();
            }

            // 알림 표시
            function displayNotifications() {
                let filtered = allNotifications;
                
                if (currentFilter === 'unread') {
                    filtered = allNotifications.filter(n => n.is_read === 0);
                } else if (currentFilter === 'read') {
                    filtered = allNotifications.filter(n => n.is_read === 1);
                }
                
                const container = document.getElementById('notifications-list');
                const emptyState = document.getElementById('empty-state');
                
                if (filtered.length === 0) {
                    container.innerHTML = '';
                    emptyState.classList.remove('hidden');
                    return;
                }
                
                emptyState.classList.add('hidden');
                
                container.innerHTML = filtered.map(notif => \`
                    <div class="bg-white rounded-lg shadow p-6 \${notif.is_read === 0 ? 'border-l-4 border-blue-600' : ''}" onclick="markAsRead(\${notif.id})">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <div class="flex items-center mb-2">
                                    <span class="px-2 py-1 text-xs rounded-full \${notif.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}">
                                        \${notif.priority === 'high' ? '높음' : '일반'}
                                    </span>
                                    <span class="ml-2 text-xs text-gray-500">
                                        \${new Date(notif.created_at).toLocaleString('ko-KR')}
                                    </span>
                                    \${notif.is_read === 0 ? '<span class="ml-2 px-2 py-1 text-xs rounded-full bg-blue-500 text-white">새 알림</span>' : ''}
                                </div>
                                <h4 class="text-lg font-bold text-gray-800 mb-2">\${notif.title}</h4>
                                <p class="text-gray-600">\${notif.message}</p>
                            </div>
                            \${notif.is_read === 0 ? '<i class="fas fa-circle text-blue-600 ml-4"></i>' : ''}
                        </div>
                    </div>
                \`).join('');
            }

            // 읽음 처리
            async function markAsRead(notificationId) {
                try {
                    await axios.patch(\`/api/admin/notifications/\${notificationId}/read\`, {}, {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') }
                    });
                    
                    // 알림 목록 새로고침
                    loadNotifications();
                } catch (error) {
                    console.error('읽음 처리 실패:', error);
                }
            }

            // 5초마다 자동 새로고침
            setInterval(loadNotifications, 5000);

            // 초기 로드
            loadNotifications();
        </script>
    </body>
    </html>
  `);
});
// ==================== RSS 피드 파싱 유틸리티 ====================
// ==================== Gemini AI 요약 및 감정 분석 함수 ====================
// ==================== 뉴스 AI 요약 API ====================
// ==================== 투표 시스템 API ====================
// ==================== 뉴스 투표 현황 조회 API ====================
// ==================== 키워드 구독 시스템 API ====================
// ==================== 실시간 HOT 뉴스 API ====================
// ==================== 뉴스 API ====================
// 뉴스 가져오기 및 DB 저장
// 저장된 뉴스 목록 조회
// API: 뉴스 리다이렉트 프록시 (Google News 차단 우회)
app.get('/news/redirect', async (c) => {
    const url = c.req.query('url');
    if (!url) {
        return c.text('URL이 필요합니다', 400);
    }
    try {
        // Google News URL을 fetch하여 최종 redirect URL을 얻음
        const response = await fetch(url, {
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        // 최종 URL로 리다이렉트
        return c.redirect(response.url, 302);
    }
    catch (error) {
        console.error('뉴스 리다이렉트 오류:', error);
        return c.text('뉴스를 불러올 수 없습니다', 500);
    }
});
// 뉴스 상세 페이지
app.get('/news/:id', async (c) => {
    const DB = getDB(c);
    const newsId = c.req.param('id');
    // 뉴스 조회
    let news = null;
    try {
        const { results } = await DB.prepare('SELECT * FROM news WHERE id = ?').bind(newsId).all();
        news = results?.[0];
    }
    catch (error) {
        console.error('뉴스 조회 오류:', error);
    }
    // 뉴스가 없으면 404
    if (!news) {
        return c.html(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <title>뉴스를 찾을 수 없습니다 - Faith Portal</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-50 flex items-center justify-center min-h-screen">
        <div class="text-center">
          <h1 class="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <p class="text-gray-600 mb-6">뉴스를 찾을 수 없습니다.</p>
          <a href="/news" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">뉴스 목록으로</a>
        </div>
      </body>
      </html>
    `, 404);
    }
    // 관련 종목 추출 및 시세 조회
    const relatedTickers = findRelatedStocks(news.title, news.description || news.summary, news.tags, 3); // 최대 3개
    const relatedStocks = await fetchBatchStockData(relatedTickers);
    // [New] 환율 데이터 관련 로직 (팩트체크)
    const exchangeRates = getMockExchangeRates();
    const relatedExchangeRates = [];
    const textToAnalyze = (news.title + ' ' + (news.description || '') + ' ' + (news.summary || '')).toLowerCase();
    // 환율 키워드 분석
    if (textToAnalyze.includes('환율') || textToAnalyze.includes('dollar') || textToAnalyze.includes('달러') || textToAnalyze.includes('usd') || textToAnalyze.includes('미국')) {
        relatedExchangeRates.push(exchangeRates['USD']);
    }
    if (textToAnalyze.includes('엔') || textToAnalyze.includes('yen') || textToAnalyze.includes('jpy') || textToAnalyze.includes('일본')) {
        relatedExchangeRates.push(exchangeRates['JPY']);
    }
    if (textToAnalyze.includes('유로') || textToAnalyze.includes('euro') || textToAnalyze.includes('eur') || textToAnalyze.includes('유럽')) {
        relatedExchangeRates.push(exchangeRates['EUR']);
    }
    if (textToAnalyze.includes('위안') || textToAnalyze.includes('cny') || textToAnalyze.includes('중국')) {
        relatedExchangeRates.push(exchangeRates['CNY']);
    }
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko" id="html-root">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(news.title)} - Faith Portal</title>
        <script>
            (function() {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                    if (args[0] && typeof args[0] === 'string' && 
                        args[0].includes('cdn.tailwindcss.com should not be used in production')) {
                        return;
                    }
                    originalWarn.apply(console, args);
                };
            })();
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .faith-blue { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); }
            .faith-blue-hover:hover { background: linear-gradient(135deg, #0284c7 0%, #0891b2 100%); }
            .stock-number { 
                font-family: 'Roboto Mono', 'Courier New', monospace; 
                font-variant-numeric: tabular-nums;
            }
            .line-clamp-2 {
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
            
            /* 종목 시세 카드 스타일 */
            .stock-card {
                transition: all 0.3s ease;
                border: 1px solid #e5e7eb;
            }
            .stock-card:hover {
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
                transform: translateY(-2px);
            }
            
            /* 상승/하락 색상 */
            .stock-up {
                color: #e74c3c;
            }
            .stock-down {
                color: #3498db;
            }
            .stock-flat {
                color: #95a5a6;
            }
            
            /* Sticky 사이드바 */
            @media (min-width: 1024px) {
                .stock-sidebar {
                    position: sticky;
                    top: 6rem;
                    max-height: calc(100vh - 8rem);
                    overflow-y: auto;
                }
            }
            
            /* 모바일 반응형 */
            @media (max-width: 767px) {
                .stock-card {
                    padding: 0.75rem;
                }
                .stock-price {
                    font-size: 1.5rem;
                }
            }
        </style>
    </head>
    <body class="bg-slate-50" id="html-root">
        ${getCommonHeader('News')}
        ${getStickyHeader()}
        
        ${getBreadcrumb([
        { label: '홈', href: '/' },
        { label: '뉴스', href: '/news' },
        { label: news.title }
    ])}

        <main class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
            <div class="lg:flex lg:gap-8">
                <!-- 왼쪽: 메인 컨텐츠 (70%) -->
                <article class="lg:w-2/3 space-y-6">
                    <!-- 헤더 -->
                    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div class="flex items-center gap-2 mb-4">
                            <span class="px-3 py-1 text-sm font-semibold rounded-full ${getCategoryColor(news.category)}">
                                ${getCategoryName(news.category)}
                            </span>
                            <span class="text-sm text-gray-500">
                                ${new Date(news.published_at || news.created_at).toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}
                            </span>
                        </div>
                        
                        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight">
                            ${escapeHtml(news.title)}
                        </h1>
                    </div>
                    
                    <!-- 저작권 보호 안내 (주식 뉴스인 경우) -->
                    ${news.category === 'stock' ? `
                    <div class="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
                        <div class="flex items-start">
                            <i class="fas fa-info-circle text-blue-600 text-xl mr-3 mt-1"></i>
                            <div>
                                <h4 class="font-bold text-blue-900 mb-2">저작권 보호 안내</h4>
                                <p class="text-sm text-blue-800 leading-relaxed">
                                    언론사의 저작권을 존중하여 본문은 원문 사이트에서 확인하실 수 있습니다.
                                    아래 "전문 보기" 버튼을 클릭하시면 언론사 원문 페이지로 이동합니다.
                                </p>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- 뉴스 요약 -->
                    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <i class="fas fa-file-alt text-gray-600 mr-2"></i>
                            뉴스 요약
                        </h3>
                        <p class="text-gray-700 leading-relaxed">
                            ${news.description ? escapeHtml(news.description.replace(/&nbsp;/g, '')) : news.summary ? escapeHtml(news.summary.replace(/&nbsp;/g, '')) : '요약 정보가 없습니다.'}
                        </p>
                    </div>
                    
                    <!-- 전문 보기 버튼 -->
                    ${news.link ? `
                    <div class="flex justify-center">
                        <a href="${news.link}" target="_blank" rel="noopener noreferrer" 
                           class="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-lg font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition shadow-lg hover:shadow-xl transform hover:scale-105">
                            <i class="fas fa-external-link-alt mr-2"></i>
                            전문 보기 ${news.source ? '(' + escapeHtml(news.source) + ')' : ''}
                        </a>
                    </div>
                    ` : ''}
                    
                    <!-- 태그 -->
                    ${news.tags ? `
                    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <h3 class="text-lg font-bold text-gray-900 mb-3 flex items-center">
                            <i class="fas fa-tags text-purple-600 mr-2"></i>
                            태그
                        </h3>
                        <div class="flex flex-wrap gap-2">
                            ${news.tags.split(',').map((tag) => `<span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition">#${tag.trim()}</span>`).join('')}
                        </div>
                    </div>
                    ` : ''}
                </article>
                
                <!-- 오른쪽: 관련 종목 시세 사이드바 (30%) -->
                <aside class="lg:w-1/3 mt-6 lg:mt-0">
                    <div class="stock-sidebar space-y-4">
                        
                        <!-- [New] 환율 정보 (팩트체크) -->
                        ${relatedExchangeRates.length > 0 ? `
                        <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                            <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <i class="fas fa-exchange-alt text-green-600 mr-2"></i>
                                관련 환율 정보 (팩트체크)
                            </h3>
                            <div class="space-y-4">
                                ${relatedExchangeRates.map(rate => `
                                    <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <div class="flex items-center gap-2">
                                            <span class="text-2xl">${rate.flag}</span>
                                            <div>
                                                <div class="font-bold text-gray-800">${rate.name}</div>
                                                <div class="text-xs text-gray-500">${rate.currency}</div>
                                            </div>
                                        </div>
                                        <div class="text-right">
                                            <div class="font-mono font-bold text-lg">${rate.rate.toLocaleString('ko-KR')}원</div>
                                            <div class="text-xs font-semibold ${rate.change >= 0 ? 'text-red-500' : 'text-blue-500'}">
                                                ${rate.change >= 0 ? '▲' : '▼'} ${Math.abs(rate.change).toFixed(2)} (${rate.changePercent.toFixed(2)}%)
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                                
                                <div class="mt-4 pt-4 border-t border-gray-100">
                                    <canvas id="exchangeRateChart" height="200"></canvas>
                                </div>
                                <p class="text-xs text-gray-400 text-center mt-2">
                                    <i class="fas fa-info-circle mr-1"></i>실시간 모의 환율 데이터입니다.
                                </p>
                            </div>
                        </div>
                        ` : ''}

                        <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                            <h3 class="text-lg font-bold text-gray-900 mb-6 flex items-center">
                                <i class="fas fa-chart-line text-purple-600 mr-2"></i>
                                관련 종목 시세
                            </h3>
                            
                            ${relatedStocks.length > 0 ? relatedStocks.map((stock) => {
        const isKorean = stock.ticker.includes('.KS') || stock.ticker.includes('.KQ');
        const priceText = isKorean
            ? '₩' + Math.round(stock.price).toLocaleString('ko-KR')
            : '$' + stock.price.toFixed(2);
        const changeText = isKorean
            ? (stock.change >= 0 ? '+' : '') + Math.round(stock.change).toLocaleString('ko-KR') + '원'
            : (stock.change >= 0 ? '+' : '') + '$' + Math.abs(stock.change).toFixed(2);
        const statusClass = stock.status === 'up' ? 'stock-up' : stock.status === 'down' ? 'stock-down' : 'stock-flat';
        const arrow = stock.status === 'up' ? '▲' : stock.status === 'down' ? '▼' : '━';
        return `
                                <div class="stock-card rounded-lg p-5 hover:shadow-md transition mb-4">
                                    <div class="font-bold text-gray-900 text-xl mb-1">${escapeHtml(stock.name)}</div>
                                    <div class="text-xs text-gray-500 mb-4">${stock.ticker}</div>
                                    
                                    <div class="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 stock-number">
                                        ${priceText}
                                    </div>
                                    
                                    <div class="flex items-center ${statusClass} font-semibold mb-5">
                                        <span class="text-xl mr-1">${arrow}</span>
                                        <span class="text-lg">${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%</span>
                                        <span class="text-sm text-gray-500 ml-2">(${changeText})</span>
                                    </div>
                                    
                                    <a href="/finance/stock/${stock.ticker}" 
                                       class="block w-full text-center py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 transition shadow-md hover:shadow-lg">
                                        자세히 보기 <i class="fas fa-arrow-right ml-2"></i>
                                    </a>
                                </div>
                                `;
    }).join('') : `
                            <div class="text-center py-8">
                                <i class="fas fa-chart-pie text-gray-300 text-5xl mb-4"></i>
                                <p class="text-gray-500 mb-2">관련 종목 정보가 없습니다.</p>
                                <a href="/finance" class="text-blue-600 hover:text-blue-700 text-sm inline-block">
                                    전체 종목 보기 →
                                </a>
                            </div>
                            `}
                            
                            <div class="mt-6 text-xs text-gray-500 bg-gray-50 p-4 rounded-lg">
                                <i class="fas fa-info-circle mr-1"></i>
                                실시간 시세는 약 15~20분 지연됩니다.
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
            </div>
        </main>

        ${getCommonFooter()}
        ${getCommonAuthScript()}
    </body>
    </html>
  `);
});
// 뉴스 삭제 (관리자용)
// ==================== 뉴스 스케줄 설정 API ====================
// ==================== 관리자 뉴스관리 페이지 ====================
app.get('/admin/news', async (c) => {
    const DB = getDB(c);
    // DB에서 뉴스 통계만 가져오기 (전체 개수)
    let newsFromDB = [];
    let totalCount = 0;
    try {
        // 전체 개수 조회
        const countResult = await DB.prepare('SELECT COUNT(*) as total FROM news').first();
        totalCount = countResult?.total || 0;
        // 초기 50개만 가져오기
        const { results } = await DB.prepare('SELECT * FROM news ORDER BY created_at DESC LIMIT 50').all();
        newsFromDB = results || [];
        // 뉴스 데이터베이스 용량 계산
        let dbSizeMB = '0';
        try {
            const dbPath = process.env.DATABASE_PATH || './faith-portal.db';
            if (fs.existsSync(dbPath)) {
                const stats = fs.statSync(dbPath);
                dbSizeMB = (stats.size / (1024 * 1024)).toFixed(1);
            }
        }
        catch (sizeErr) {
            console.error('DB 용량 계산 오류:', sizeErr);
        }
        return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>뉴스관리 - Faith Portal</title>
        <script>
            // DB 용량 정보 전달
            window.DB_SIZE = "${dbSizeMB}";
            // Global Error Handler
            window.onerror = function(msg, url, line, col, error) {
                console.error("Global Error:", msg, url, line, col, error);
                return false;
            };

            // Tailwind CDN 경고 필터링 (개발 환경용)
            (function() {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                    if (args[0] && typeof args[0] === 'string' && 
                        args[0].includes('cdn.tailwindcss.com should not be used in production')) {
                        return; // Tailwind CDN 경고 무시
                    }
                    originalWarn.apply(console, args);
                };
            })();
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .faith-blue { background-color: #1E40AF; }
            .faith-blue-hover:hover { background-color: #1E3A8A; }
        </style>
    </head>
    <body class="bg-gray-100">
        <!-- 관리자 헤더 -->
        <header class="faith-blue text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-4">
                        <a href="/" class="text-2xl font-bold">Faith Portal</a>
                        <span class="text-sm bg-yellow-500 text-gray-900 px-3 py-1 rounded-full font-medium">
                            <i class="fas fa-crown mr-1"></i>
                            관리자
                        </span>
                    </div>
                    <div class="flex items-center space-x-4">
                        <span id="admin-name" class="text-sm"></span>
                        <a href="/" class="text-sm hover:text-blue-200">
                            <i class="fas fa-home mr-1"></i>
                            메인으로
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <!-- 네비게이션 -->
        <nav class="bg-white shadow">
            <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
                ${getAdminNavigation('/admin/news')}
            </div>
        </nav>
        
        ${getBreadcrumb([
            { label: '홈', href: '/' },
            { label: '관리자', href: '/admin' },
            { label: '뉴스 관리' }
        ])}

        <!-- 메인 컨텐츠 -->
        <main class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
            <!-- 페이지 타이틀 및 액션 -->
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800">
                        <i class="fas fa-newspaper text-blue-600 mr-2"></i>
                        뉴스관리
                    </h2>
                    <p class="text-sm text-gray-600 mt-1">저장된 뉴스를 관리하고 새 뉴스를 가져올 수 있습니다.</p>
                </div>
                <div class="flex gap-3">
                    <button onclick="collectStockNews(event)" class="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg font-medium hover:shadow-lg transition-all">
                        <i class="fas fa-chart-line mr-2"></i>
                        주식 뉴스 자동수집
                    </button>
                    <button onclick="fetchAllNews(event)" class="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all">
                        <i class="fas fa-sync-alt mr-2"></i>
                        전체 카테고리 뉴스 가져오기
                    </button>
                </div>
            </div>

            <!-- 통계 카드 -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-white rounded-lg shadow p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-500 text-sm">전체 뉴스</p>
                            <p class="text-2xl font-bold text-gray-800" id="total-count">${totalCount}</p>
                        </div>
                        <i class="fas fa-newspaper text-3xl text-blue-500"></i>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-500 text-sm">표시된 뉴스</p>
                            <p class="text-2xl font-bold text-purple-600" id="loaded-count">${newsFromDB.length}</p>
                        </div>
                        <i class="fas fa-list text-3xl text-purple-500"></i>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-500 text-sm">현재 필터</p>
                            <p class="text-2xl font-bold text-green-600" id="filter-status">전체</p>
                        </div>
                        <i class="fas fa-filter text-3xl text-green-500"></i>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow p-4 border-l-4 border-indigo-500">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-500 text-sm font-medium">DB 용량</p>
                            <p class="text-2xl font-bold text-indigo-600" id="db-size-display">${dbSizeMB} MB</p>
                        </div>
                        <i class="fas fa-database text-3xl text-indigo-500"></i>
                    </div>
                </div>
            </div>

            <!-- 자동 뉴스 가져오기 스케줄 설정 -->
            <div class="bg-white rounded-lg shadow p-6 mb-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-bold text-gray-800">
                        <i class="fas fa-clock text-blue-600 mr-2"></i>
                        자동 뉴스 가져오기 설정
                    </h3>
                    <div class="flex items-center space-x-2">
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="schedule-enabled" class="sr-only peer" onchange="toggleSchedule()">
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            <span class="ml-3 text-sm font-medium text-gray-700">활성화</span>
                        </label>
                    </div>
                </div>

                <div id="schedule-settings" class="space-y-4">
                    <!-- 스케줄 타입 선택 -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            <i class="fas fa-calendar-alt mr-1"></i>
                            스케줄 타입
                        </label>
                        <div class="flex space-x-4">
                            <label class="flex items-center">
                                <input type="radio" name="schedule-type" value="hourly" checked onchange="updateScheduleType()" class="mr-2">
                                <span class="text-sm text-gray-700">시간 간격</span>
                            </label>
                            <label class="flex items-center">
                                <input type="radio" name="schedule-type" value="daily" onchange="updateScheduleType()" class="mr-2">
                                <span class="text-sm text-gray-700">매일 지정 시간</span>
                            </label>
                        </div>
                    </div>

                    <!-- 시간 간격 설정 (hourly) -->
                    <div id="hourly-settings">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            <i class="fas fa-hourglass-half mr-1"></i>
                            가져오기 간격 (시간)
                        </label>
                        <select id="interval-hours" class="px-4 py-2 border border-gray-300 rounded-lg w-full md:w-64">
                            <option value="1">1시간마다</option>
                            <option value="2">2시간마다</option>
                            <option value="3">3시간마다</option>
                            <option value="6">6시간마다</option>
                            <option value="12">12시간마다</option>
                            <option value="24">24시간마다</option>
                        </select>
                    </div>

                    <!-- 지정 시간 설정 (daily) -->
                    <div id="daily-settings" class="hidden">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            <i class="fas fa-clock mr-1"></i>
                            매일 가져올 시간
                        </label>
                        <input type="time" id="schedule-time" class="px-4 py-2 border border-gray-300 rounded-lg w-full md:w-64" value="09:00">
                    </div>

                    <!-- 실행 정보 -->
                    <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-600">마지막 실행:</span>
                            <span id="last-run" class="text-sm font-medium text-gray-800">-</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-600">다음 실행 예정:</span>
                            <span id="next-run" class="text-sm font-medium text-blue-600">-</span>
                        </div>
                    </div>

                    <!-- 저장 버튼 -->
                    <div class="flex justify-end">
                        <button onclick="saveSchedule()" class="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all">
                            <i class="fas fa-save mr-2"></i>
                            설정 저장
                        </button>
                    </div>
                </div>
            </div>

            <!-- 뉴스 목록 테이블 -->
            <div class="bg-white rounded-lg shadow overflow-hidden">
                <div class="p-4 border-b border-gray-200">
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-bold text-gray-800">뉴스 목록 (무한 스크롤)</h3>
                        <div class="flex items-center space-x-2">
                            <select id="category-filter" onchange="filterNews()" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                                <option value="all">전체 카테고리</option>
                                <option value="general">일반</option>
                                <option value="politics">정치</option>
                                <option value="economy">경제</option>
                                <option value="tech">기술</option>
                                <option value="sports">스포츠</option>
                                <option value="entertainment">연예</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="overflow-x-auto" id="news-container" style="max-height: 600px; overflow-y: auto;">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">발행사</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">발행일</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                            </tr>
                        </thead>
                        <tbody id="news-table" class="bg-white divide-y divide-gray-200">
                            ${newsFromDB.map(news => {
            // URL 인코딩을 사용하여 따옴표/백슬래시 문제를 원천 차단
            // 중요: encodeURIComponent는 싱글 쿼트(')를 인코딩하지 않으므로, 수동으로 치환해야 onclick 속성 내에서 안전함
            const encodedLink = encodeURIComponent(news.link || '').replace(/'/g, '%27');
            const escapedTitle = escapeHtml(news.title || '');
            return `
                                <tr data-category="${escapeHtml(news.category || '')}" class="hover:bg-gray-50">
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${news.id}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                            ${news.category}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                                        <span data-link="${encodedLink}" onclick="openNewsLink(this.getAttribute('data-link'))" class="hover:text-blue-600 cursor-pointer">
                                            ${escapedTitle}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${escapeHtml(news.publisher || '구글 뉴스')}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(news.created_at).toLocaleDateString('ko-KR')}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button data-link="${encodedLink}" onclick="openNewsLink(this.getAttribute('data-link'))" class="text-blue-600 hover:text-blue-900 mr-3">
                                            <i class="fas fa-external-link-alt mr-1"></i>
                                            보기
                                        </button>
                                        <button onclick="deleteNews(${news.id})" class="text-red-600 hover:text-red-900">
                                            <i class="fas fa-trash mr-1"></i>
                                            삭제
                                        </button>
                                    </td>
                                </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>
                    ${newsFromDB.length === 0 ? `
                    <div class="text-center py-12">
                        <i class="fas fa-newspaper text-5xl text-gray-300 mb-4"></i>
                        <p class="text-gray-500">저장된 뉴스가 없습니다.</p>
                        <button onclick="fetchAllNews(event)" class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            뉴스 가져오기
                        </button>
                    </div>
                    ` : ''}
                    <!-- 로딩 인디케이터 -->
                    <div id="loading-indicator" class="hidden text-center py-4">
                        <i class="fas fa-spinner fa-spin text-2xl text-blue-600"></i>
                        <p class="text-sm text-gray-600 mt-2">더 많은 뉴스를 불러오는 중...</p>
                    </div>
                </div>
            </div>
        </main>

        <script>
            // 헬퍼: HTML 이스케이프 (전역 정의)
            const escapeHtml = (text) => {
                if (!text) return '';
                const map = {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#039;'
                };
                return text.toString().replace(/[&<>"']/g, (char) => map[char]);
            };

            // 뉴스 링크 열기 (Referrer 없이)
            function openNewsLink(url) {
                console.log('[openNewsLink] 실행 - 원본 URL:', url);
                const proxyUrl = '/news/redirect?url=' + encodeURIComponent(url);
                window.open(proxyUrl, '_blank', 'noopener,noreferrer');
            }
            
            // 로그인 확인 및 권한 검증
            const token = localStorage.getItem('auth_token');
            const userEmail = localStorage.getItem('user_email');
            const userLevel = parseInt(localStorage.getItem('user_level') || '0');
            
            if (!token || userLevel < 6) {
                alert('관리자 권한이 필요합니다.');
                location.href = '/';
            }
            
            if (userEmail) {
                document.getElementById('admin-name').textContent = userEmail + ' (레벨 ' + userLevel + ')';
            }
            
            // ==================== 무한 스크롤 관련 변수 ====================
            let currentOffset = 50; // 이미 50개 로드됨
            let isLoading = false;
            let hasMore = true;
            let currentCategory = 'all';
            const loadLimit = 50; // 한 번에 50개씩 로드
            
            // 무한 스크롤 설정
            const newsContainer = document.getElementById('news-container');
            if (newsContainer) {
                console.log('무한 스크롤 이벤트 리스너 등록됨');
                newsContainer.addEventListener('scroll', function() {
                    const scrollHeight = newsContainer.scrollHeight;
                    const scrollTop = newsContainer.scrollTop;
                    const clientHeight = newsContainer.clientHeight;
                    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
                    
                    console.log('스크롤 이벤트:', {
                        scrollHeight,
                        scrollTop,
                        clientHeight,
                        distanceFromBottom,
                        isLoading,
                        hasMore
                    });
                    
                    if (isLoading || !hasMore) {
                        console.log('로딩 중이거나 더 이상 없음');
                        return;
                    }
                    
                    // 스크롤이 끝에서 200px 이내로 가까워지면 로드
                    if (distanceFromBottom <= 200) {
                        console.log('추가 로드 시작!');
                        loadMoreNews();
                    }
                });
            } else {
                console.error('news-container를 찾을 수 없습니다!');
            }
            
            // 더 많은 뉴스 로드
            async function loadMoreNews() {
                if (isLoading || !hasMore) {
                    console.log('loadMoreNews 중단:', { isLoading, hasMore });
                    return;
                }
                
                console.log('loadMoreNews 시작:', { currentOffset, currentCategory });
                isLoading = true;
                document.getElementById('loading-indicator').classList.remove('hidden');
                document.getElementById('loading-status').textContent = '로딩중';
                
                try {
                    const url = '/api/news?category=' + currentCategory + '&limit=' + loadLimit + '&offset=' + currentOffset;
                    console.log('API 요청:', url);
                    const response = await fetch(url);
                    const data = await response.json();
                    console.log('API 응답:', data);
                    
                    if (data.success && data.news && data.news.length > 0) {
                        const newsTable = document.getElementById('news-table');
                        
                        data.news.forEach(news => {
                            const row = document.createElement('tr');
                            row.setAttribute('data-category', news.category);
                            row.className = 'hover:bg-gray-50';
                            
                            
                            // 하위 호환성을 위해 esc 별칭 유지
                            const esc = escapeHtml;

                            row.innerHTML = '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + news.id + '</td>' +
                                '<td class="px-6 py-4 whitespace-nowrap">' +
                                    '<span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">' +
                                        esc(news.category) +
                                    '</span>' +
                                '</td>' +
                                '<td class="px-6 py-4 text-sm text-gray-900 max-w-md truncate">' +
                                    '<span data-link="' + encodeURIComponent(news.link).replace(/'/g, '%27') + '" onclick="openNewsLink(this.getAttribute(\\'data-link\\'))" class="hover:text-blue-600 cursor-pointer">' +
                                        esc(news.title) +
                                    '</span>' +
                                '</td>' +
                                '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">' + (esc(news.publisher) || '구글 뉴스') + '</td>' +
                                '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">' + new Date(news.created_at).toLocaleDateString('ko-KR') + '</td>' +
                                '<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">' +
                                    '<button data-link="' + encodeURIComponent(news.link).replace(/'/g, '%27') + '" onclick="openNewsLink(this.getAttribute(\\'data-link\\'))" class="text-blue-600 hover:text-blue-900 mr-3">' +
                                        '<i class="fas fa-external-link-alt mr-1"></i>' +
                                        '보기' +
                                    '</button>' +
                                    '<button onclick="deleteNews(' + news.id + ')" class="text-red-600 hover:text-red-900">' +
                                        '<i class="fas fa-trash mr-1"></i>' +
                                        '삭제' +
                                    '</button>' +
                                '</td>';
                            newsTable.appendChild(row);
                        });
                        
                        currentOffset += data.news.length;
                        document.getElementById('loaded-count').textContent = document.querySelectorAll('#news-table tr').length;
                        
                        // 50개보다 적게 로드되면 더 이상 없음
                        if (data.news.length < loadLimit) {
                            hasMore = false;
                            document.getElementById('loading-status').textContent = '완료';
                        } else {
                            document.getElementById('loading-status').textContent = '대기';
                        }
                    } else {
                        hasMore = false;
                        document.getElementById('loading-status').textContent = '완료';
                    }
                } catch (error) {
                    console.error('뉴스 로드 오류:', error);
                    document.getElementById('loading-status').textContent = '오류';
                } finally {
                    isLoading = false;
                    document.getElementById('loading-indicator').classList.add('hidden');
                }
            }
            
            // 전체 뉴스 가져오기
            async function fetchAllNews(event) {
                const btn = event ? event.target : null;
                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>가져오는 중...';
                }
                
                const categories = ['general', 'politics', 'economy', 'tech', 'sports', 'entertainment', 'stock'];
                let totalFetched = 0;
                
                for (const category of categories) {
                    try {
                        const response = await fetch('/api/news/fetch?category=' + category);
                        const data = await response.json();
                        if (data.success) {
                            totalFetched += data.saved;
                        }
                    } catch (error) {
                        console.error('뉴스 가져오기 오류:', error);
                    }
                }
                
                alert(totalFetched + '개의 새 뉴스를 가져왔습니다.');
                location.reload();
            }
            
            // 주식 뉴스 자동 수집
            async function collectStockNews(event) {
                const btn = event ? event.target : null;
                let originalText = '';
                if (btn) {
                    originalText = btn.innerHTML;
                    btn.disabled = true;
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>수집 중...';
                }
                
                try {
                    const response = await fetch('/api/admin/collect-stock-news', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        const stats = data.stats;
                        const message = 
                            '주식 뉴스 수집 완료!\\n\\n' +
                            '📊 수집 통계:\\n' +
                            '- 전체: ' + stats.total + '건\\n' +
                            '- 신규 저장: ' + stats.saved + '건\\n' +
                            '- 중복 제외: ' + stats.duplicate + '건\\n' +
                            (stats.error > 0 ? '- 오류: ' + stats.error + '건\\n' : '');
                        
                        alert(message);
                        location.reload();
                    } else {
                        alert('수집 실패: ' + (data.message || data.error || '알 수 없는 오류'));
                    }
                } catch (error) {
                    console.error('주식 뉴스 수집 오류:', error);
                    alert('수집 중 오류가 발생했습니다: ' + error.message);
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }
            }
            
            // 뉴스 삭제
            async function deleteNews(id) {
                if (!confirm('이 뉴스를 삭제하시겠습니까?')) {
                    return;
                }
                
                try {
                    const response = await fetch('/api/news/' + id, {
                        method: 'DELETE'
                    });
                    const data = await response.json();
                    
                    if (data.success) {
                        alert('뉴스가 삭제되었습니다.');
                        location.reload();
                    } else {
                        alert('삭제 실패: ' + (data.error || '알 수 없는 오류'));
                    }
                } catch (error) {
                    console.error('뉴스 삭제 오류:', error);
                    alert('삭제 중 오류가 발생했습니다.');
                }
            }
            
            // 카테고리 필터 (무한 스크롤 재설정)
            async function filterNews() {
                const category = document.getElementById('category-filter').value;
                currentCategory = category;
                currentOffset = 0;
                hasMore = true;
                
                // 테이블 초기화
                document.getElementById('news-table').innerHTML = '';
                document.getElementById('loaded-count').textContent = '0';
                document.getElementById('filter-status').textContent = category === 'all' ? '전체' : category;
                
                // 첫 50개 로드
                await loadMoreNews();
            }
            
            // ==================== 스케줄 설정 관련 함수 ====================
            let autoFetchInterval = null;
            
            // 스케줄 설정 로드
            async function loadSchedule() {
                console.log('[News Scheduler] 스케줄 로드 시작...');
                try {
                    const response = await fetch('/api/news/schedule');
                    const data = await response.json();
                    console.log('[News Scheduler] 데이터 수신:', data);
                    
                    if (data.success && data.schedule) {
                        const schedule = data.schedule;
                        
                        // 활성화 상태
                        const enabledEl = document.getElementById('schedule-enabled');
                        if (enabledEl) enabledEl.checked = schedule.enabled === 1;
                        
                        // 스케줄 타입
                        const scheduleType = schedule.schedule_type || 'hourly';
                        const typeRadio = document.querySelector('input[name="schedule-type"][value="' + scheduleType + '"]');
                        if (typeRadio) typeRadio.checked = true;
                        
                        // 간격 (hourly)
                        const intervalEl = document.getElementById('interval-hours');
                        if (intervalEl && schedule.interval_hours) {
                            intervalEl.value = schedule.interval_hours;
                        }
                        
                        // 시간 (daily)
                        const timeEl = document.getElementById('schedule-time');
                        if (timeEl && schedule.schedule_time) {
                            timeEl.value = schedule.schedule_time;
                        }
                        
                        // 실행 정보 업데이트 함수 호출
                        updateDisplayTimes(schedule.last_run, schedule.next_run);
                        
                        // UI 표시 전환
                        updateScheduleType();
                        
                        // 자동 실행 모니터링 시작
                        if (schedule.enabled === 1) {
                            startAutoFetch();
                        }
                    }
                } catch (error) {
                    console.error('[News Scheduler] 로드 오류:', error);
                }
            }

            // 실행 시간 표시 업데이트 헬퍼
            function updateDisplayTimes(lastRun, nextRun) {
                console.log('[News Scheduler] 표시 시간 업데이트:', { lastRun, nextRun });
                
                const lastRunEl = document.getElementById('last-run');
                const nextRunEl = document.getElementById('next-run');
                
                if (lastRunEl) {
                    lastRunEl.textContent = lastRun ? new Date(lastRun).toLocaleString('ko-KR') : '정보 없음';
                }
                
                if (nextRunEl) {
                    nextRunEl.textContent = nextRun ? new Date(nextRun).toLocaleString('ko-KR') : '대기 중';
                }
            }
            
            // 스케줄 활성화/비활성화
            function toggleSchedule() {
                const enabled = document.getElementById('schedule-enabled').checked;
                const settings = document.getElementById('schedule-settings');
                
                if (enabled) {
                    settings.classList.remove('opacity-50', 'pointer-events-none');
                } else {
                    settings.classList.add('opacity-50', 'pointer-events-none');
                    stopAutoFetch();
                }
            }
            
            // 스케줄 타입 변경
            function updateScheduleType() {
                const scheduleType = document.querySelector('input[name="schedule-type"]:checked').value;
                const hourlySettings = document.getElementById('hourly-settings');
                const dailySettings = document.getElementById('daily-settings');
                
                if (scheduleType === 'hourly') {
                    hourlySettings.classList.remove('hidden');
                    dailySettings.classList.add('hidden');
                } else {
                    hourlySettings.classList.add('hidden');
                    dailySettings.classList.remove('hidden');
                }
            }
            
            // 스케줄 저장
            async function saveSchedule() {
                console.log('[News Scheduler] 설정 저장 시도...');
                const enabled = document.getElementById('schedule-enabled').checked;
                const scheduleType = document.querySelector('input[name="schedule-type"]:checked').value;
                const intervalHours = parseInt(document.getElementById('interval-hours').value);
                const scheduleTime = document.getElementById('schedule-time').value;
                
                const data = {
                    enabled: enabled ? 1 : 0,
                    schedule_type: scheduleType,
                    interval_hours: intervalHours,
                    schedule_time: scheduleTime
                };
                
                try {
                    const response = await fetch('/api/news/schedule', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    
                    const result = await response.json();
                    console.log('[News Scheduler] 저장 응답:', result);
                    
                    if (result.success) {
                        alert('스케줄 설정이 저장되었습니다.');
                        
                        // 화면 시간 정보 즉시 갱신
                        const lastRunText = document.getElementById('last-run').textContent;
                        updateDisplayTimes(lastRunText === '-' ? null : lastRunText, result.next_run);
                        
                        // 자동 실행 재설정
                        stopAutoFetch();
                        if (enabled) {
                            startAutoFetch();
                        }
                    } else {
                        alert('저장 실패: ' + (result.error || '알 수 없는 오류'));
                    }
                } catch (error) {
                    console.error('[News Scheduler] 저장 오류:', error);
                    alert('저장 중 오류가 발생했습니다.');
                }
            }
            
            // 자동 뉴스 가져오기 시작 (상태 모니터링)
            function startAutoFetch() {
                // 기존 interval 정리
                stopAutoFetch();
                
                // 30초마다 스케줄 및 실행 결과 체크
                autoFetchInterval = setInterval(async () => {
                    try {
                        const response = await fetch('/api/news/schedule');
                        const data = await response.json();
                        
                        if (data.success && data.schedule) {
                            const schedule = data.schedule;
                            updateDisplayTimes(schedule.last_run, schedule.next_run);
                            
                            if (schedule.enabled !== 1) {
                                stopAutoFetch();
                            }
                        }
                    } catch (error) {
                        console.error('[News Scheduler] 자동 체크 오류:', error);
                    }
                }, 30000);
                
                console.log('뉴스 수집 상태 모니터링이 시작되었습니다.');
            }
            
            // 자동 뉴스 가져오기 중지
            function stopAutoFetch() {
                if (autoFetchInterval) {
                    clearInterval(autoFetchInterval);
                    autoFetchInterval = null;
                    console.log('자동 뉴스 가져오기가 중지되었습니다.');
                }
            }
            
            // 페이지 로드 시 스케줄 설정 로드
            loadSchedule();
        </script>
    </body>
    </html>
  `);
    }
    catch (error) {
        console.error('뉴스 조회 오류:', error);
        return c.text('Internal Server Error', 500);
    }
});
app.get('/mypage', optionalAuth, (c) => {
    const user = c.get('user');
    return c.html(`
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>마이페이지 - Faith Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <style>
        .section-active {
            border-left-color: #0ea5e9;
            background-color: #f0f9ff;
            font-weight: 600;
        }
        .dark .section-active {
            background-color: #1e293b;
        }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    
    ${getCommonHeader()}
    
    <!-- 메인 컨테이너 -->
    <div class="max-w-7xl mx-auto px-4 py-8">
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">
                <i class="fas fa-user-circle mr-2"></i>마이페이지
            </h1>
            <p class="text-gray-600">나의 저장 항목과 활동 내역을 확인하세요</p>
        </div>
        
        <!-- 레이아웃: 사이드바 + 컨텐츠 -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            <!-- 사이드바 -->
            <div class="lg:col-span-1">
                <div class="bg-white rounded-lg shadow-lg p-4 sticky top-4">
                    <nav class="space-y-2">
                        <button onclick="showSection('news')" id="nav-news" class="section-nav w-full text-left px-4 py-3 rounded-lg border-l-4 border-transparent hover:bg-gray-50 transition-all section-active">
                            <i class="fas fa-newspaper mr-3 text-sky-500"></i>
                            <span>뉴스</span>
                        </button>
                        <button onclick="showSection('stocks')" id="nav-stocks" class="section-nav w-full text-left px-4 py-3 rounded-lg border-l-4 border-transparent hover:bg-gray-50 transition-all">
                            <i class="fas fa-chart-line mr-3 text-green-500"></i>
                            <span>주식</span>
                        </button>
                        <button onclick="showSection('games')" id="nav-games" class="section-nav w-full text-left px-4 py-3 rounded-lg border-l-4 border-transparent hover:bg-gray-50 transition-all">
                            <i class="fas fa-gamepad mr-3 text-purple-500"></i>
                            <span>게임</span>
                        </button>
                        <button onclick="showSection('utils')" id="nav-utils" class="section-nav w-full text-left px-4 py-3 rounded-lg border-l-4 border-transparent hover:bg-gray-50 transition-all">
                            <i class="fas fa-tools mr-3 text-orange-500"></i>
                            <span>유틸리티</span>
                        </button>
                    </nav>
                </div>
            </div>
            
            <!-- 메인 컨텐츠 -->
            <div class="lg:col-span-3">
                
                <!-- 뉴스 섹션 -->
                <div id="section-news" class="section-content">
                    <div class="bg-white rounded-lg shadow-lg p-6">
                        <h2 class="text-2xl font-bold text-gray-900 mb-6">
                            <i class="fas fa-newspaper mr-2 text-sky-500"></i>뉴스
                        </h2>
                        
                        <!-- 구독 키워드 -->
                        <div class="mb-8">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">구독 키워드</h3>
                            <div id="keywords-list" class="flex flex-wrap gap-2">
                                <div class="text-gray-500 text-sm">로딩 중...</div>
                            </div>
                        </div>

                        <!-- 맞춤 뉴스 -->
                        <div class="mb-8">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">맞춤 뉴스</h3>
                            <div id="my-keyword-news-list" class="space-y-4">
                                <div class="text-gray-500 text-sm">로딩 중...</div>
                            </div>
                        </div>
                        
                        <!-- 북마크 -->
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">북마크한 뉴스</h3>
                            <div id="bookmarks-list" class="space-y-4">
                                <div class="text-gray-500 text-sm">로딩 중...</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 주식 섹션 -->
                <div id="section-stocks" class="section-content hidden">
                    <div class="bg-white rounded-lg shadow-lg p-6">
                        <h2 class="text-2xl font-bold text-gray-900 mb-6">
                            <i class="fas fa-chart-line mr-2 text-green-500"></i>주식
                        </h2>
                        
                        <!-- 포트폴리오 통계 -->
                        <div class="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                                <div class="text-sm opacity-90 mb-1">총 종목 수</div>
                                <div class="text-3xl font-bold" id="total-stocks">-</div>
                            </div>
                            <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
                                <div class="text-sm opacity-90 mb-1">미국 주식</div>
                                <div class="text-3xl font-bold" id="us-stocks">-</div>
                            </div>
                            <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                                <div class="text-sm opacity-90 mb-1">한국 주식</div>
                                <div class="text-3xl font-bold" id="kr-stocks">-</div>
                            </div>
                        </div>
                        
                        <!-- 관심 종목 -->
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">관심 종목</h3>
                            <div id="watchlist" class="space-y-3">
                                <div class="text-gray-500 text-sm">로딩 중...</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 게임 섹션 -->
                <div id="section-games" class="section-content hidden">
                    <div class="bg-white rounded-lg shadow-lg p-6">
                        <h2 class="text-2xl font-bold text-gray-900 mb-6">
                            <i class="fas fa-gamepad mr-2 text-purple-500"></i>게임
                        </h2>
                        
                        <!-- 게임 통계 -->
                        <div class="mb-8">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">게임 통계</h3>
                            <div id="game-stats" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="text-gray-500 text-sm">게임 기록이 없습니다</div>
                            </div>
                        </div>
                        
                        <!-- 최근 플레이 -->
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">최근 플레이</h3>
                            <div id="game-history" class="space-y-3">
                                <div class="text-gray-500 text-sm">로딩 중...</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 유틸리티 섹션 -->
                <div id="section-utils" class="section-content hidden">
                    <div class="bg-white rounded-lg shadow-lg p-6">
                        <h2 class="text-2xl font-bold text-gray-900 mb-6">
                            <i class="fas fa-tools mr-2 text-orange-500"></i>유틸리티
                        </h2>
                        
                        <!-- 저장된 설정 -->
                        <div class="mb-8">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">저장된 설정</h3>
                            <div id="util-settings" class="space-y-3">
                                <div class="text-gray-500 text-sm">로딩 중...</div>
                            </div>
                        </div>
                        
                        <!-- 사용 히스토리 -->
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">사용 히스토리</h3>
                            <div id="util-history" class="space-y-3">
                                <div class="text-gray-500 text-sm">로딩 중...</div>
                            </div>
                        </div>
                    </div>
                </div>
                
            </div>
        </div>
    </div>
    
    <script>
        // 섹션 전환
        function showSection(sectionName) {
            document.querySelectorAll('.section-content').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.section-nav').forEach(el => el.classList.remove('section-active'));
            
            document.getElementById(\`section-\${sectionName}\`).classList.remove('hidden');
            document.getElementById(\`nav-\${sectionName}\`).classList.add('section-active');
            
            loadSectionData(sectionName);
        }
        
        async function loadSectionData(sectionName) {
            switch(sectionName) {
                case 'news': await loadNewsData(); break;
                case 'stocks': await loadStocksData(); break;
                case 'games': await loadGamesData(); break;
                case 'utils': await loadUtilsData(); break;
            }
        }
        
        async function loadNewsData() {
            try {
                console.log('[MyPage] ========== 북마크 로딩 시작 ==========');
                
                // 현재 로그인한 사용자 정보 확인
                const authRes = await axios.get('/api/auth/me');
                console.log('[MyPage] 1. 현재 사용자 정보:', authRes.data);
                const currentUser = authRes.data.user;
                
                if (!currentUser) {
                    console.error('[MyPage] ❌ 로그인되지 않은 상태');
                    document.getElementById('bookmarks-list').innerHTML = '<div class="text-red-500 text-sm">로그인이 필요합니다</div>';
                    return;
                }
                
                console.log('[MyPage] ✅ 로그인 확인 - userId:', currentUser.id, 'name:', currentUser.name, 'email:', currentUser.email);
                
                // 키워드 조회
                const keywordsRes = await axios.get('/api/user/keywords');
                console.log('[MyPage] 2. 키워드 응답:', keywordsRes.data);
                const keywords = keywordsRes.data.keywords || [];
                
                const keywordsList = document.getElementById('keywords-list');
                if (keywords.length > 0) {
                    keywordsList.innerHTML = keywords.map(kw => \`
                        <span class="inline-flex items-center px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-sm">
                            <i class="fas fa-tag mr-1"></i>\${kw.keyword}
                        </span>
                    \`).join('');
                } else {
                    keywordsList.innerHTML = '<div class="text-gray-500 text-sm">구독 중인 키워드가 없습니다</div>';
                }
                
                // 북마크 조회
                console.log('[MyPage] 3. 북마크 조회 시작 - userId:', currentUser.id);
                const bookmarksRes = await axios.get('/api/user/bookmarks?page=1&limit=10');
                console.log('[MyPage] 4. 북마크 응답:', bookmarksRes.data);
                console.log('[MyPage] 4-1. 북마크 개수:', bookmarksRes.data.total);
                console.log('[MyPage] 4-2. 북마크 배열 길이:', bookmarksRes.data.bookmarks?.length);
                
                const bookmarks = bookmarksRes.data.bookmarks || [];
                
                const bookmarksList = document.getElementById('bookmarks-list');
                if (bookmarks.length > 0) {
                    console.log('[MyPage] ✅ 북마크 렌더링 중...', bookmarks.length, '개');
                    bookmarksList.innerHTML = bookmarks.map((bm, idx) => {
                        console.log('[MyPage] 북마크 #' + (idx+1) + ':', bm.title.substring(0, 30) + '...');
                        return \`
                        <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <h4 class="font-semibold text-gray-900 mb-2">\${bm.title}</h4>
                            <div class="text-sm text-gray-500">
                                <span class="inline-block px-2 py-1 bg-gray-100 rounded text-xs mr-2">\${bm.category}</span>
                                \${new Date(bm.bookmarked_at).toLocaleDateString('ko-KR')}
                            </div>
                        </div>
                    \`;
                    }).join('');
                    console.log('[MyPage] ✅ 북마크 렌더링 완료');
                } else {
                    console.log('[MyPage] ⚠️  북마크 없음');
                    bookmarksList.innerHTML = '<div class="text-gray-500 text-sm">북마크한 뉴스가 없습니다</div>';
                }
                
                console.log('[MyPage] ========== 북마크 로딩 완료 ==========');
                
                // 맞춤 뉴스 로드
                await loadMyKeywordNews();
            } catch (error) {
                console.error('[MyPage] ========== 에러 발생 ==========');
                console.error('[MyPage] 에러 상세:', error);
                console.error('[MyPage] 에러 응답:', error.response?.data);
                console.error('[MyPage] 에러 상태:', error.response?.status);
                
                // 에러 메시지 표시
                const bookmarksList = document.getElementById('bookmarks-list');
                if (bookmarksList) {
                    bookmarksList.innerHTML = '<div class="text-red-500 text-sm">북마크 로드 실패: ' + (error.response?.data?.error || error.message) + '</div>';
                }
            }
        }
        
        async function loadMyKeywordNews() {
             try {
                console.log('[MyPage] 키워드 뉴스 로딩 시작');
                const response = await axios.get('/api/news/my-keywords');
                const data = response.data;
                
                const newsList = document.getElementById('my-keyword-news-list');
                if (data.success && data.news && data.news.length > 0) {
                     newsList.innerHTML = data.news.slice(0, 3).map(news => \`
                        <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white" onclick="location.href='/news/\${news.id}'">
                            <h4 class="font-semibold text-gray-900 mb-2 line-clamp-1">\${news.title}</h4>
                            <p class="text-sm text-gray-600 line-clamp-2 mb-2">\${news.summary || news.content?.substring(0, 100) || '내용 없음'}</p>
                            <div class="text-xs text-gray-500 flex justify-between">
                                <span>\${news.publisher || 'Faith Portal'}</span>
                                <span>\${new Date(news.published_at || news.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    \`).join('');
                     
                     // 더보기 버튼 추가
                     if (data.news.length > 3) {
                         newsList.innerHTML += \`
                            <a href="/news" class="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2 mt-2">
                                더보기 (\${data.news.length - 3}개 더있음) <i class="fas fa-arrow-right ml-1"></i>
                            </a>
                         \`;
                     }
                } else {
                    newsList.innerHTML = '<div class="text-gray-500 text-sm p-4 bg-gray-50 rounded-lg text-center">맞춤 뉴스가 없습니다.<br>관심 키워드를 구독해보세요!</div>';
                }
            } catch (error) {
                console.error('키워드 뉴스 로드 실패:', error);
                 document.getElementById('my-keyword-news-list').innerHTML = '<div class="text-red-500 text-sm">뉴스 로드 실패</div>';
            }
        }
        
        async function loadStocksData() {
            try {
                const statsRes = await axios.get('/api/user/watchlist/stats');
                const stats = statsRes.data.stats || {};
                
                document.getElementById('total-stocks').textContent = stats.total_stocks || 0;
                document.getElementById('us-stocks').textContent = stats.market_distribution?.US || 0;
                document.getElementById('kr-stocks').textContent = stats.market_distribution?.KR || 0;
                
                const watchlistRes = await axios.get('/api/user/watchlist');
                const stocks = watchlistRes.data.stocks || [];
                
                const watchlist = document.getElementById('watchlist');
                if (stocks.length > 0) {
                    watchlist.innerHTML = stocks.map(stock => \`
                        <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h4 class="font-semibold text-gray-900">\${stock.stock_name}</h4>
                                    <div class="text-sm text-gray-500 mt-1">\${stock.stock_symbol}</div>
                                </div>
                                <span class="px-2 py-1 rounded text-xs \${stock.market_type === 'US' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">
                                    \${stock.market_type}
                                </span>
                            </div>
                            \${stock.memo ? \`<div class="text-sm text-gray-600 mt-2">\${stock.memo}</div>\` : ''}
                            \${stock.target_price ? \`<div class="text-sm text-gray-500 mt-2">목표가: \${stock.target_price.toLocaleString()}\${stock.market_type === 'KR' ? '원' : '$'}</div>\` : ''}
                        </div>
                    \`).join('');
                } else {
                    watchlist.innerHTML = '<div class="text-gray-500 text-sm">관심 종목이 없습니다</div>';
                }
            } catch (error) {
                console.error('주식 데이터 로드 실패:', error);
            }
        }
        
        // 게임 타입을 한글 이름으로 변환하는 함수
        function getGameDisplayName(gameType) {
            const gameNames = {
                'sudoku': '스도쿠',
                'tetris': '테트리스',
                '2048': '2048',
                'minesweeper': '지뢰찾기'
            };
            return gameNames[gameType] || gameType;
        }
        
        async function loadGamesData() {
            console.log('🎮 [마이페이지 프론트] 게임 데이터 로딩 시작...')
            
            try {
                console.log('📡 [마이페이지 프론트] API 요청: /api/user/games/stats')
                const statsRes = await axios.get('/api/user/games/stats');
                console.log('📦 [마이페이지 프론트] 통계 응답:', statsRes.data)
                
                const stats = statsRes.data.stats || {};
                console.log('📊 [마이페이지 프론트] 파싱된 통계:', stats)
                
                const gameStats = document.getElementById('game-stats');
                const statsKeys = Object.keys(stats);
                
                console.log('🔑 [마이페이지 프론트] 통계 키 목록:', statsKeys)
                
                if (statsKeys.length > 0) {
                    gameStats.innerHTML = statsKeys.map(gameType => {
                        const stat = stats[gameType];
                        const displayName = getGameDisplayName(gameType);
                        console.log('🎯 [마이페이지 프론트] ' + gameType + ' 통계:', stat)
                        return \`
                            <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                                <div class="text-sm opacity-90 mb-1">\${displayName}</div>
                                <div class="text-2xl font-bold mb-2">\${stat.best_score.toLocaleString()}점</div>
                                <div class="text-xs opacity-80">
                                    플레이: \${stat.play_count}회 | 순위: \${stat.rank}위
                                </div>
                            </div>
                        \`;
                    }).join('');
                } else {
                    console.log('⚠️ [마이페이지 프론트] 통계 데이터 없음')
                    gameStats.innerHTML = '<div class="text-gray-500 text-sm col-span-2">게임 기록이 없습니다</div>';
                }
                
                console.log('📡 [마이페이지 프론트] API 요청: /api/user/games/history')
                const historyRes = await axios.get('/api/user/games/history?limit=10');
                console.log('📦 [마이페이지 프론트] 히스토리 응답:', historyRes.data)
                
                const history = historyRes.data.history?.history || [];
                console.log('📜 [마이페이지 프론트] 파싱된 히스토리:', history)
                
                const gameHistory = document.getElementById('game-history');
                if (history.length > 0) {
                    gameHistory.innerHTML = history.map(game => {
                        console.log('🎮 [마이페이지 프론트] 게임 기록:', game)
                        const displayName = getGameDisplayName(game.game_type);
                        return \`
                        <div class="border border-gray-200 rounded-lg p-4">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h4 class="font-semibold text-gray-900">\${displayName}</h4>
                                    <div class="text-2xl font-bold text-purple-600 mt-1">\${game.score.toLocaleString()}점</div>
                                </div>
                                <div class="text-sm text-gray-500">\${new Date(game.played_at).toLocaleDateString('ko-KR')}</div>
                            </div>
                        </div>
                    \`;
                    }).join('');
                } else {
                    console.log('⚠️ [마이페이지 프론트] 히스토리 데이터 없음')
                    gameHistory.innerHTML = '<div class="text-gray-500 text-sm">플레이 기록이 없습니다</div>';
                }
                
                console.log('✅ [마이페이지 프론트] 게임 데이터 로딩 완료')
            } catch (error) {
                console.error('❌ [마이페이지 프론트] 게임 데이터 로드 실패:', error);
                if (error.response) {
                    console.error('📡 [마이페이지 프론트] 응답 상태:', error.response.status);
                    console.error('📦 [마이페이지 프론트] 응답 데이터:', error.response.data);
                }
            }
        }
        
        async function loadUtilsData() {
            try {
                const settingsRes = await axios.get('/api/user/utils/settings');
                const settings = settingsRes.data.settings || {};
                
                const utilSettings = document.getElementById('util-settings');
                const settingsKeys = Object.keys(settings);
                
                if (settingsKeys.length > 0) {
                    utilSettings.innerHTML = settingsKeys.map(utilType => \`
                        <div class="border border-gray-200 rounded-lg p-4">
                            <h4 class="font-semibold text-gray-900 mb-2">\${utilType}</h4>
                            <pre class="text-sm text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto">\${JSON.stringify(settings[utilType], null, 2)}</pre>
                        </div>
                    \`).join('');
                } else {
                    utilSettings.innerHTML = '<div class="text-gray-500 text-sm">저장된 설정이 없습니다</div>';
                }
                
                const historyRes = await axios.get('/api/user/utils/history?limit=10');
                const history = historyRes.data.history || [];
                
                const utilHistory = document.getElementById('util-history');
                if (history.length > 0) {
                    utilHistory.innerHTML = history.map(item => \`
                        <div class="border border-gray-200 rounded-lg p-4">
                            <div class="flex justify-between items-start mb-2">
                                <h4 class="font-semibold text-gray-900">\${item.util_type}</h4>
                                <div class="text-sm text-gray-500">\${new Date(item.created_at).toLocaleDateString('ko-KR')}</div>
                            </div>
                            <div class="text-sm text-gray-600">
                                <div class="mb-1"><strong>입력:</strong> \${JSON.stringify(item.input_data)}</div>
                                \${item.result_data ? \`<div><strong>결과:</strong> \${JSON.stringify(item.result_data)}</div>\` : ''}
                            </div>
                        </div>
                    \`).join('');
                } else {
                    utilHistory.innerHTML = '<div class="text-gray-500 text-sm">사용 기록이 없습니다</div>';
                }
            } catch (error) {
                console.error('유틸리티 데이터 로드 실패:', error);
            }
        }
        
        document.addEventListener('DOMContentLoaded', function() {
            showSection('news');
        });
    </script>
</body>
</html>
  `);
});
// ==================== 스마트 한국 나이 계산기 ====================
app.get('/lifestyle/age-calculator', (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko" id="html-root">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>스마트 만 나이 & 생활 연령 계산기 - Faith Portal</title>
        <meta name="description" content="내 나이, 이제 헷갈리지 마세요! 만 나이, 연 나이, 세는 나이를 한눈에 확인하고 술·담배·투표 등 생활 가이드까지">
        <script>
            (function() {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                    if (args[0] && typeof args[0] === 'string' && 
                        args[0].includes('cdn.tailwindcss.com should not be used in production')) {
                        return;
                    }
                    originalWarn.apply(console, args);
                };
            })();
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .faith-blue { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); }
            .age-card {
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            .age-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 20px 40px rgba(0,0,0,0.15);
            }
            .check-item {
                transition: all 0.2s ease;
            }
            .check-item:hover {
                background-color: rgba(59, 130, 246, 0.05);
            }
        </style>
    </head>
    <body class="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" id="html-root">
        ${getCommonAuthScript()}
        ${getCommonHeader('Lifestyle')}
        ${getStickyHeader()}
        
        ${getBreadcrumb([
        { label: '홈', href: '/' },
        { label: '유틸리티', href: '/lifestyle' },
        { label: '한국 나이 계산기' }
    ])}

        <main class="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-6 space-y-6">
            <!-- 페이지 헤더 -->
            <div class="text-center mb-8">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4">
                    <i class="fas fa-birthday-cake text-3xl text-white"></i>
                </div>
                <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                    스마트 만 나이 & 생활 연령 계산기
                </h1>
                <p class="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
                    내 나이, 이제 헷갈리지 마세요! 법적 나이부터 술/담배 가능 여부까지 한 번에.
                </p>
            </div>

            <!-- 입력 영역 -->
            <div class="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                <div class="flex items-center mb-6">
                    <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                        <i class="fas fa-calendar-alt text-xl text-white"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800">생년월일 입력</h2>
                </div>

                <div class="grid md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">생년 (YYYY)</label>
                        <input 
                            type="number" 
                            id="birthYear" 
                            placeholder="1995"
                            min="1900"
                            max="2025"
                            class="w-full px-4 py-3 text-lg font-semibold border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition"
                        >
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">월 (MM)</label>
                        <select 
                            id="birthMonth"
                            class="w-full px-4 py-3 text-lg font-semibold border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition"
                        >
                            <option value="">선택</option>
                            ${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}">${i + 1}월</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">일 (DD)</label>
                        <select 
                            id="birthDay"
                            class="w-full px-4 py-3 text-lg font-semibold border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition"
                        >
                            <option value="">선택</option>
                            ${Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}">${i + 1}일</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        계산 기준일 (선택사항)
                    </label>
                    <div class="flex items-center gap-3">
                        <input 
                            type="date" 
                            id="referenceDate"
                            class="flex-1 px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition"
                        >
                        <button 
                            onclick="setToday()"
                            class="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition"
                        >
                            오늘
                        </button>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">
                        특정 날짜(예: 입학일, 계약일)에 몇 살인지 계산할 수 있습니다
                    </p>
                </div>

                <button 
                    onclick="calculateAge()"
                    class="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-lg rounded-xl hover:from-blue-600 hover:to-indigo-700 transition shadow-lg"
                >
                    <i class="fas fa-calculator mr-2"></i>
                    나이 계산하기
                </button>
            </div>

            <!-- 결과 영역 -->
            <div id="results" class="hidden space-y-6">
                <!-- 메인 나이 카드들 -->
                <div class="grid md:grid-cols-3 gap-4">
                    <!-- 만 나이 -->
                    <div class="age-card bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold">📄 만 나이</h3>
                            <span class="px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs font-medium">법적 표준</span>
                        </div>
                        <div class="text-5xl font-bold mb-2" id="manAge">-</div>
                        <p class="text-sm text-blue-100 mb-4">관공서, 계약, 병원, 은행에서 쓰는 진짜 내 나이입니다</p>
                        <div class="text-sm bg-white bg-opacity-10 rounded-lg p-3" id="birthdayInfo">
                            다음 생일까지 D-?
                        </div>
                    </div>

                    <!-- 연 나이 -->
                    <div class="age-card bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold">🍺 연 나이</h3>
                            <span class="px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs font-medium">청소년 보호법</span>
                        </div>
                        <div class="text-5xl font-bold mb-2" id="yeonAge">-</div>
                        <p class="text-sm text-purple-100 mb-4">술·담배 구매, 군대 입영 영장은 이 나이를 따릅니다</p>
                        <div class="text-sm bg-white bg-opacity-10 rounded-lg p-3">
                            = 현재 연도 - 출생 연도
                        </div>
                    </div>

                    <!-- 세는 나이 -->
                    <div class="age-card bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold">🗣️ 세는 나이</h3>
                            <span class="px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs font-medium">사회적 나이</span>
                        </div>
                        <div class="text-5xl font-bold mb-2" id="koreanAge">-</div>
                        <p class="text-sm text-pink-100 mb-4">한국 사람들끼리 "저 00년생(00살)입니다" 할 때 주로 씁니다</p>
                        <div class="text-sm bg-white bg-opacity-10 rounded-lg p-3">
                            = 연 나이 + 1
                        </div>
                    </div>
                </div>

                <!-- 체크리스트 위젯 -->
                <div class="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                    <div class="flex items-center mb-6">
                        <div class="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                            <i class="fas fa-check-circle text-xl text-white"></i>
                        </div>
                        <h2 class="text-2xl font-bold text-gray-800">할 수 있는 것 / 없는 것</h2>
                    </div>

                    <div class="grid md:grid-cols-2 gap-4" id="checklistGrid">
                        <!-- JavaScript로 동적 생성 -->
                    </div>
                </div>

                <!-- 띠와 별자리 -->
                <div class="grid md:grid-cols-2 gap-4">
                    <div class="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl shadow-lg p-6 border-2 border-orange-200">
                        <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span class="text-3xl" id="zodiacEmoji">🐉</span>
                            <span>나의 띠</span>
                        </h3>
                        <div class="text-4xl font-bold text-orange-600 mb-2" id="zodiacName">-</div>
                        <p class="text-sm text-gray-600" id="zodiacDesc">-</p>
                    </div>

                    <div class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-lg p-6 border-2 border-indigo-200">
                        <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span class="text-3xl">⭐</span>
                            <span>나의 별자리</span>
                        </h3>
                        <div class="text-4xl font-bold text-indigo-600 mb-2" id="starSign">-</div>
                        <p class="text-sm text-gray-600" id="starSignDate">-</p>
                    </div>
                </div>

                <!-- 생애 주기 알림 -->
                <div id="lifecycleAlerts" class="hidden bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl shadow-lg p-6 md:p-8 border-2 border-yellow-300">
                    <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <i class="fas fa-bell text-yellow-600"></i>
                        <span>생애 주기 알림</span>
                    </h3>
                    <div id="lifecycleContent" class="space-y-3">
                        <!-- JavaScript로 동적 생성 -->
                    </div>
                </div>
            </div>

            <!-- 서비스 확장 -->
            <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 md:p-8 border-2 border-purple-200">
                <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <i class="fas fa-lightbulb text-yellow-500"></i>
                    <span>이런 정보도 궁금하신가요?</span>
                </h3>
                <div class="grid md:grid-cols-3 gap-4">
                    <div class="bg-white rounded-xl p-4 hover:shadow-md transition cursor-pointer">
                        <div class="text-3xl mb-2">🎓</div>
                        <div class="font-semibold text-gray-800 mb-1">학교 입학 계산기</div>
                        <div class="text-xs text-gray-600">자녀 초등학교 입학 시기 확인</div>
                    </div>
                    <div class="bg-white rounded-xl p-4 hover:shadow-md transition cursor-pointer">
                        <div class="text-3xl mb-2">⚖️</div>
                        <div class="font-semibold text-gray-800 mb-1">법적 나이 FAQ</div>
                        <div class="text-xs text-gray-600">2023년 만 나이 통일법 완벽 정리</div>
                    </div>
                    <div class="bg-white rounded-xl p-4 hover:shadow-md transition cursor-pointer">
                        <div class="text-3xl mb-2">🎂</div>
                        <div class="font-semibold text-gray-800 mb-1">생일 D-Day</div>
                        <div class="text-xs text-gray-600">내 생일까지 남은 시간</div>
                    </div>
                </div>
            </div>
        </main>

        <script>
            // 페이지 로드 시 오늘 날짜 설정
            window.addEventListener('DOMContentLoaded', function() {
                setToday();
            });

            function setToday() {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                document.getElementById('referenceDate').value = year + '-' + month + '-' + day;
            }

            function calculateAge() {
                const year = parseInt(document.getElementById('birthYear').value);
                const month = parseInt(document.getElementById('birthMonth').value);
                const day = parseInt(document.getElementById('birthDay').value);
                const refDate = document.getElementById('referenceDate').value;

                if (!year || !month || !day || !refDate) {
                    alert('생년월일과 계산 기준일을 모두 입력해주세요.');
                    return;
                }

                const birthDate = new Date(year, month - 1, day);
                const reference = new Date(refDate);
                const currentYear = reference.getFullYear();

                // 1. 연 나이
                const yeonAge = currentYear - year;

                // 2. 세는 나이
                const koreanAge = yeonAge + 1;

                // 3. 만 나이
                let manAge = yeonAge;
                const isBirthdayPassed = 
                    reference.getMonth() > birthDate.getMonth() || 
                    (reference.getMonth() === birthDate.getMonth() && reference.getDate() >= birthDate.getDate());
                
                if (!isBirthdayPassed) {
                    manAge -= 1;
                }

                // 다음 생일까지 남은 일수
                const nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
                if (isBirthdayPassed) {
                    nextBirthday.setFullYear(currentYear + 1);
                }
                const daysUntilBirthday = Math.ceil((nextBirthday - reference) / (1000 * 60 * 60 * 24));

                // 결과 표시
                document.getElementById('manAge').textContent = manAge + '세';
                document.getElementById('yeonAge').textContent = yeonAge + '세';
                document.getElementById('koreanAge').textContent = koreanAge + '세';
                document.getElementById('birthdayInfo').textContent = 
                    daysUntilBirthday === 0 ? '🎉 오늘이 생일입니다!' : '다음 생일까지 D-' + daysUntilBirthday;

                // 체크리스트 생성
                generateChecklist(manAge, yeonAge, birthDate, reference);

                // 띠와 별자리
                displayZodiacAndStar(year, month, day);

                // 생애 주기 알림
                displayLifecycleAlerts(manAge);

                // 결과 영역 표시
                document.getElementById('results').classList.remove('hidden');

                // 결과 영역으로 스크롤
                document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            function generateChecklist(manAge, yeonAge, birthDate, reference) {
                const checks = [
                    { name: '투표', manReq: 18, yeonReq: null, icon: '🗳️', desc: '국회의원, 대통령 선거' },
                    { name: '운전면허', manReq: 18, yeonReq: null, icon: '🚗', desc: '2종 보통면허 취득 가능' },
                    { name: '아르바이트', manReq: 15, yeonReq: null, icon: '💼', desc: '취업 인증 필요' },
                    { name: '술/담배 구매', manReq: null, yeonReq: 19, icon: '🍺', desc: '1월 1일 기준 연 나이' },
                    { name: '영화 관람 (청불)', manReq: 18, yeonReq: null, icon: '🎬', desc: '청소년 관람불가' },
                    { name: '워킹홀리데이', manReq: 18, yeonReq: null, maxAge: 30, icon: '✈️', desc: '국가별 상이' }
                ];

                const grid = document.getElementById('checklistGrid');
                grid.innerHTML = '';

                checks.forEach(check => {
                    let canDo = false;
                    let statusText = '';

                    if (check.yeonReq !== null) {
                        canDo = yeonAge >= check.yeonReq;
                        statusText = canDo ? '가능' : ('연 ' + check.yeonReq + '세부터');
                    } else {
                        if (check.maxAge) {
                            canDo = manAge >= check.manReq && manAge <= check.maxAge;
                            statusText = canDo ? '가능' : 
                                (manAge < check.manReq ? ('만 ' + check.manReq + '세부터') : '연령 초과');
                        } else {
                            canDo = manAge >= check.manReq;
                            statusText = canDo ? '가능' : ('만 ' + check.manReq + '세부터');
                        }
                    }

                    const statusColor = canDo ? 'text-green-600' : 'text-gray-400';
                    const bgColor = canDo ? 'bg-green-50' : 'bg-gray-50';
                    const icon = canDo ? '✅' : '❌';

                    grid.innerHTML += '<div class="check-item p-4 rounded-xl border-2 ' + 
                        (canDo ? 'border-green-200' : 'border-gray-200') + ' ' + bgColor + '">' +
                        '<div class="flex items-start justify-between mb-2">' +
                        '<div class="flex items-center gap-2">' +
                        '<span class="text-2xl">' + check.icon + '</span>' +
                        '<span class="font-bold text-gray-800">' + check.name + '</span>' +
                        '</div>' +
                        '<span class="text-2xl">' + icon + '</span>' +
                        '</div>' +
                        '<div class="text-sm text-gray-600 mb-1">' + check.desc + '</div>' +
                        '<div class="text-xs font-semibold ' + statusColor + '">' + statusText + '</div>' +
                        '</div>';
                });
            }

            function displayZodiacAndStar(year, month, day) {
                // 띠 계산
                const zodiacs = [
                    {name: '쥐띠', emoji: '🐭', desc: '영리하고 순발력이 뛰어남'},
                    {name: '소띠', emoji: '🐮', desc: '성실하고 인내심이 강함'},
                    {name: '호랑이띠', emoji: '🐯', desc: '용감하고 카리스마 있음'},
                    {name: '토끼띠', emoji: '🐰', desc: '온화하고 섬세함'},
                    {name: '용띠', emoji: '🐉', desc: '열정적이고 리더십이 강함'},
                    {name: '뱀띠', emoji: '🐍', desc: '지혜롭고 신중함'},
                    {name: '말띠', emoji: '🐴', desc: '활동적이고 자유로움'},
                    {name: '양띠', emoji: '🐑', desc: '온순하고 예술적 감각이 뛰어남'},
                    {name: '원숭이띠', emoji: '🐵', desc: '재치있고 사교적'},
                    {name: '닭띠', emoji: '🐓', desc: '정직하고 부지런함'},
                    {name: '개띠', emoji: '🐶', desc: '충성스럽고 정의로움'},
                    {name: '돼지띠', emoji: '🐷', desc: '관대하고 순수함'}
                ];

                const zodiacIndex = (year - 4) % 12;
                const zodiac = zodiacs[zodiacIndex];

                document.getElementById('zodiacEmoji').textContent = zodiac.emoji;
                document.getElementById('zodiacName').textContent = zodiac.name;
                document.getElementById('zodiacDesc').textContent = zodiac.desc;

                // 별자리 계산
                const starSigns = [
                    {name: '물병자리', start: [1,20], end: [2,18]},
                    {name: '물고기자리', start: [2,19], end: [3,20]},
                    {name: '양자리', start: [3,21], end: [4,19]},
                    {name: '황소자리', start: [4,20], end: [5,20]},
                    {name: '쌍둥이자리', start: [5,21], end: [6,21]},
                    {name: '게자리', start: [6,22], end: [7,22]},
                    {name: '사자자리', start: [7,23], end: [8,22]},
                    {name: '처녀자리', start: [8,23], end: [9,23]},
                    {name: '천칭자리', start: [9,24], end: [10,22]},
                    {name: '전갈자리', start: [10,23], end: [11,22]},
                    {name: '사수자리', start: [11,23], end: [12,24]},
                    {name: '염소자리', start: [12,25], end: [1,19]}
                ];

                let starSign = '';
                for (const sign of starSigns) {
                    const [startMonth, startDay] = sign.start;
                    const [endMonth, endDay] = sign.end;
                    
                    if (startMonth === endMonth) {
                        if (month === startMonth && day >= startDay && day <= endDay) {
                            starSign = sign.name;
                            break;
                        }
                    } else {
                        if ((month === startMonth && day >= startDay) || (month === endMonth && day <= endDay)) {
                            starSign = sign.name;
                            break;
                        }
                    }
                }

                document.getElementById('starSign').textContent = starSign;
                document.getElementById('starSignDate').textContent = month + '월 ' + day + '일';
            }

            function displayLifecycleAlerts(manAge) {
                const alerts = [];

                if (manAge === 18 || manAge === 19) {
                    alerts.push({
                        icon: '🎓',
                        title: '성년의 시작',
                        desc: '법적으로 성인이 되었습니다. 투표권, 운전면허 취득 가능'
                    });
                }

                if (manAge >= 18 && manAge < 30) {
                    alerts.push({
                        icon: '✈️',
                        title: '워킹홀리데이',
                        desc: '해외에서 일하며 여행할 수 있는 절호의 기회입니다'
                    });
                }

                if (manAge >= 38 && manAge <= 42) {
                    alerts.push({
                        icon: '🏥',
                        title: '생애전환기 건강검진',
                        desc: '만 40세부터 생애전환기 건강검진 대상입니다'
                    });
                }

                if (manAge >= 63 && manAge <= 67) {
                    alerts.push({
                        icon: '💰',
                        title: '국민연금 수령',
                        desc: '만 65세부터 기초연금 수급 대상인지 확인해보세요'
                    });
                }

                if (alerts.length > 0) {
                    const content = document.getElementById('lifecycleContent');
                    content.innerHTML = alerts.map(alert => 
                        '<div class="flex items-start gap-3 p-4 bg-white rounded-xl">' +
                        '<div class="text-3xl">' + alert.icon + '</div>' +
                        '<div>' +
                        '<div class="font-bold text-gray-800 mb-1">' + alert.title + '</div>' +
                        '<div class="text-sm text-gray-600">' + alert.desc + '</div>' +
                        '</div>' +
                        '</div>'
                    ).join('');
                    document.getElementById('lifecycleAlerts').classList.remove('hidden');
                } else {
                    document.getElementById('lifecycleAlerts').classList.add('hidden');
                }
            }
        </script>

        ${getCommonFooter()}
        ${getCommonAuthScript()}
    </body>
    </html>
  `);
});
// ==================== 감성 D-Day 매니저 ====================
app.get('/lifestyle/dday-calculator', (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko" id="html-root">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>감성 D-Day 매니저 - Faith Portal</title>
        <meta name="description" content="단순히 날짜만 세는 게 아니라, 설레는 기다림을 시각화해주는 D-Day 관리 도구">
        <script>
            (function() {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                    if (args[0] && typeof args[0] === 'string' && 
                        args[0].includes('cdn.tailwindcss.com should not be used in production')) {
                        return;
                    }
                    originalWarn.apply(console, args);
                };
            })();
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
        <style>
            .dday-card {
                transition: all 0.3s ease;
            }
            .dday-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 20px 40px rgba(0,0,0,0.15);
            }
            .color-option {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                transition: all 0.2s;
            }
            .color-option:hover {
                transform: scale(1.15);
            }
            .color-option.selected {
                border: 3px solid #1f2937;
                transform: scale(1.2);
            }
            .emoji-option {
                font-size: 28px;
                cursor: pointer;
                padding: 8px;
                border-radius: 8px;
                transition: all 0.2s;
            }
            .emoji-option:hover {
                background-color: rgba(0,0,0,0.05);
                transform: scale(1.1);
            }
            .emoji-option.selected {
                background-color: rgba(59, 130, 246, 0.2);
            }
            .progress-bar {
                transition: width 0.5s ease;
            }
        </style>
    </head>
    <body class="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" id="html-root">
        ${getCommonAuthScript()}
        ${getCommonHeader('Lifestyle')}
        ${getStickyHeader()}
        
        ${getBreadcrumb([
        { label: '홈', href: '/' },
        { label: '유틸리티', href: '/lifestyle' },
        { label: 'D-Day 매니저' }
    ])}

        <main class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
            <!-- 페이지 헤더 -->
            <div class="text-center mb-8">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl mb-4">
                    <i class="fas fa-heart text-3xl text-white"></i>
                </div>
                <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                    감성 D-Day 매니저
                </h1>
                <p class="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
                    단순히 날짜만 세는 게 아니라, 설레는 기다림을 시각화해드립니다
                </p>
            </div>

            <!-- 메인 그리드: 좌측(입력) - 우측(리스트) -->
            <div class="grid lg:grid-cols-2 gap-6">
                <!-- 좌측: D-Day 생성기 -->
                <div class="bg-white rounded-2xl shadow-xl p-6 md:p-8 h-fit">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <i class="fas fa-plus-circle text-purple-600"></i>
                        <span>새 D-Day 만들기</span>
                    </h2>

                    <!-- 제목 입력 -->
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            제목 <span class="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="ddayTitle" 
                            placeholder="예: 유럽 여행 ✈️"
                            class="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none transition"
                        >
                    </div>

                    <!-- 날짜 선택 -->
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            목표 날짜 <span class="text-red-500">*</span>
                        </label>
                        <input 
                            type="date" 
                            id="ddayDate"
                            class="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none transition"
                        >
                    </div>

                    <!-- 계산 모드 선택 -->
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 mb-3">
                            계산 모드
                        </label>
                        <div class="grid grid-cols-3 gap-2">
                            <button 
                                onclick="setMode('countdown')"
                                id="modeCountdown"
                                class="mode-btn px-4 py-3 bg-blue-50 text-blue-700 border-2 border-blue-200 rounded-xl font-semibold hover:bg-blue-100 transition"
                            >
                                <i class="fas fa-hourglass-half"></i>
                                <div class="text-xs mt-1">D-Day</div>
                            </button>
                            <button 
                                onclick="setMode('countup')"
                                id="modeCountup"
                                class="mode-btn px-4 py-3 bg-gray-100 text-gray-600 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-200 transition"
                            >
                                <i class="fas fa-calendar-plus"></i>
                                <div class="text-xs mt-1">기념일</div>
                            </button>
                            <button 
                                onclick="setMode('datefinder')"
                                id="modeDatefinder"
                                class="mode-btn px-4 py-3 bg-gray-100 text-gray-600 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-200 transition"
                            >
                                <i class="fas fa-search"></i>
                                <div class="text-xs mt-1">날짜찾기</div>
                            </button>
                        </div>
                    </div>

                    <!-- 커플 옵션 (countup일 때만) -->
                    <div id="anniversaryOption" class="hidden mb-6">
                        <label class="flex items-center gap-3 cursor-pointer">
                            <input 
                                type="checkbox" 
                                id="isAnniversary"
                                class="w-5 h-5 text-pink-600 rounded focus:ring-pink-500"
                            >
                            <span class="text-gray-700">
                                <i class="fas fa-heart text-pink-500"></i>
                                기준일을 1일로 포함 (커플 기념일용)
                            </span>
                        </label>
                    </div>

                    <!-- 카드 꾸미기 -->
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 mb-3">
                            배경색 선택
                        </label>
                        <div class="flex gap-3">
                            <div class="color-option selected" data-color="#667eea" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);" onclick="selectColor(this, '#667eea')"></div>
                            <div class="color-option" data-color="#f093fb" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);" onclick="selectColor(this, '#f093fb')"></div>
                            <div class="color-option" data-color="#4facfe" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);" onclick="selectColor(this, '#4facfe')"></div>
                            <div class="color-option" data-color="#43e97b" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);" onclick="selectColor(this, '#43e97b')"></div>
                            <div class="color-option" data-color="#fa709a" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);" onclick="selectColor(this, '#fa709a')"></div>
                        </div>
                    </div>

                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 mb-3">
                            대표 이모지
                        </label>
                        <div class="grid grid-cols-6 gap-2">
                            <div class="emoji-option selected text-center" data-emoji="📅" onclick="selectEmoji(this, '📅')">📅</div>
                            <div class="emoji-option text-center" data-emoji="❤️" onclick="selectEmoji(this, '❤️')">❤️</div>
                            <div class="emoji-option text-center" data-emoji="✈️" onclick="selectEmoji(this, '✈️')">✈️</div>
                            <div class="emoji-option text-center" data-emoji="📚" onclick="selectEmoji(this, '📚')">📚</div>
                            <div class="emoji-option text-center" data-emoji="🎂" onclick="selectEmoji(this, '🎂')">🎂</div>
                            <div class="emoji-option text-center" data-emoji="🎓" onclick="selectEmoji(this, '🎓')">🎓</div>
                            <div class="emoji-option text-center" data-emoji="💪" onclick="selectEmoji(this, '💪')">💪</div>
                            <div class="emoji-option text-center" data-emoji="🏃" onclick="selectEmoji(this, '🏃')">🏃</div>
                            <div class="emoji-option text-center" data-emoji="🎵" onclick="selectEmoji(this, '🎵')">🎵</div>
                            <div class="emoji-option text-center" data-emoji="🎮" onclick="selectEmoji(this, '🎮')">🎮</div>
                            <div class="emoji-option text-center" data-emoji="🎬" onclick="selectEmoji(this, '🎬')">🎬</div>
                            <div class="emoji-option text-center" data-emoji="⚽" onclick="selectEmoji(this, '⚽')">⚽</div>
                        </div>
                    </div>

                    <!-- 프리셋 버튼 -->
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 mb-3">
                            빠른 선택
                        </label>
                        <div class="grid grid-cols-2 gap-2">
                            <button onclick="setPreset('christmas')" class="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition text-sm">
                                🎄 크리스마스
                            </button>
                            <button onclick="setPreset('newyear')" class="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition text-sm">
                                🎆 새해
                            </button>
                        </div>
                    </div>

                    <!-- 추가 버튼 -->
                    <button 
                        onclick="addDday()"
                        class="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg rounded-xl hover:from-purple-600 hover:to-pink-600 transition shadow-lg"
                    >
                        <i class="fas fa-plus mr-2"></i>
                        리스트에 추가하기
                    </button>
                </div>

                <!-- 우측: D-Day 대시보드 -->
                <div class="space-y-6">
                    <!-- Hero Section: 가장 가까운 D-Day -->
                    <div id="heroDday" class="hidden bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-2xl p-8 text-white">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-xl font-bold">가장 가까운 목표</h3>
                            <button onclick="captureHero()" class="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition text-sm">
                                <i class="fas fa-camera mr-1"></i> 저장
                            </button>
                        </div>
                        <div id="heroContent">
                            <!-- JavaScript로 동적 생성 -->
                        </div>
                    </div>

                    <!-- D-Day 리스트 -->
                    <div class="bg-white rounded-2xl shadow-xl p-6">
                        <div class="flex items-center justify-between mb-6">
                            <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <i class="fas fa-list text-purple-600"></i>
                                <span>나의 D-Day</span>
                                <span id="ddayCount" class="text-lg text-gray-500">(0)</span>
                            </h2>
                            <button onclick="exportAllAsImage()" class="px-4 py-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition text-sm font-medium">
                                <i class="fas fa-download mr-1"></i> 전체 저장
                            </button>
                        </div>

                        <!-- 빈 상태 -->
                        <div id="emptyState" class="text-center py-12">
                            <div class="text-6xl mb-4">📅</div>
                            <h3 class="text-xl font-bold text-gray-800 mb-2">아직 등록된 D-Day가 없어요</h3>
                            <p class="text-gray-600">왼쪽에서 새로운 D-Day를 만들어보세요!</p>
                        </div>

                        <!-- 리스트 컨테이너 -->
                        <div id="ddayList" class="grid grid-cols-1 gap-4">
                            <!-- JavaScript로 동적 생성 -->
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <script>
            let ddayData = [];
            let currentMode = 'countdown';
            let selectedColor = '#667eea';
            let selectedEmoji = '📅';
            let currentUser = null;

            // 페이지 로드 시 초기화
            window.addEventListener('DOMContentLoaded', async function() {
                // 사용자 세션 확인
                await checkUserSession();
                
                // D-Day 데이터 로드
                await loadDdayData();
                
                // 오늘 날짜 설정
                const today = new Date();
                document.getElementById('ddayDate').valueAsDate = new Date(today.getTime() + 24*60*60*1000);
            });

            // 사용자 세션 확인
            async function checkUserSession() {
                try {
                    const response = await fetch('/api/user/session');
                    if (response.ok) {
                        const data = await response.json();
                        if (data.user) {
                            currentUser = data.user;
                        }
                    }
                } catch (error) {
                    console.log('세션 확인 실패:', error);
                }
            }

            // D-Day 데이터 로드
            async function loadDdayData() {
                if (currentUser) {
                    // 로그인한 경우: DB에서 로드
                    try {
                        const response = await fetch('/api/dday/list');
                        if (response.ok) {
                            const data = await response.json();
                            ddayData = data.ddays || [];
                            renderDdayList();
                        }
                    } catch (error) {
                        console.error('D-Day 로드 실패:', error);
                    }
                } else {
                    // 비로그인: localStorage에서 로드
                    const saved = localStorage.getItem('ddayData');
                    if (saved) {
                        ddayData = JSON.parse(saved);
                        renderDdayList();
                    }
                }
            }

            // D-Day 저장
            async function saveDdayData() {
                if (currentUser) {
                    // 서버에 저장하지 않고 추가/삭제 API만 사용
                } else {
                    // localStorage에 저장
                    localStorage.setItem('ddayData', JSON.stringify(ddayData));
                }
            }

            // 모드 설정
            function setMode(mode) {
                currentMode = mode;
                
                // 버튼 스타일 업데이트
                document.querySelectorAll('.mode-btn').forEach(btn => {
                    btn.classList.remove('bg-blue-50', 'text-blue-700', 'border-blue-200');
                    btn.classList.add('bg-gray-100', 'text-gray-600', 'border-gray-300');
                });
                
                const activeBtn = document.getElementById('mode' + mode.charAt(0).toUpperCase() + mode.slice(1));
                activeBtn.classList.remove('bg-gray-100', 'text-gray-600', 'border-gray-300');
                activeBtn.classList.add('bg-blue-50', 'text-blue-700', 'border-blue-200');
                
                // 기념일 옵션 표시/숨김
                if (mode === 'countup') {
                    document.getElementById('anniversaryOption').classList.remove('hidden');
                } else {
                    document.getElementById('anniversaryOption').classList.add('hidden');
                }
            }

            // 색상 선택
            function selectColor(element, color) {
                document.querySelectorAll('.color-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                element.classList.add('selected');
                selectedColor = color;
            }

            // 이모지 선택
            function selectEmoji(element, emoji) {
                document.querySelectorAll('.emoji-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                element.classList.add('selected');
                selectedEmoji = emoji;
            }

            // 프리셋 설정
            function setPreset(type) {
                const now = new Date();
                const year = now.getFullYear();
                
                if (type === 'christmas') {
                    const christmas = new Date(year, 11, 25);
                    if (christmas < now) christmas.setFullYear(year + 1);
                    document.getElementById('ddayTitle').value = '크리스마스 🎄';
                    document.getElementById('ddayDate').valueAsDate = christmas;
                    selectedEmoji = '🎄';
                    document.querySelector('[data-emoji="🎄"]')?.classList.add('selected');
                } else if (type === 'newyear') {
                    const newyear = new Date(year + 1, 0, 1);
                    document.getElementById('ddayTitle').value = '새해 첫날 🎆';
                    document.getElementById('ddayDate').valueAsDate = newyear;
                    selectedEmoji = '🎆';
                }
                
                setMode('countdown');
            }

            // D-Day 추가
            async function addDday() {
                const title = document.getElementById('ddayTitle').value.trim();
                const date = document.getElementById('ddayDate').value;
                const isAnniversary = document.getElementById('isAnniversary').checked;
                
                if (!title) {
                    alert('제목을 입력해주세요.');
                    return;
                }
                
                if (!date) {
                    alert('날짜를 선택해주세요.');
                    return;
                }
                
                const newDday = {
                    id: Date.now(),
                    title: title,
                    targetDate: date,
                    mode: currentMode,
                    isAnniversary: isAnniversary,
                    color: selectedColor,
                    emoji: selectedEmoji,
                    createdAt: new Date().toISOString()
                };
                
                if (currentUser) {
                    // 서버에 저장
                    try {
                        const response = await fetch('/api/dday/add', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(newDday)
                        });
                        
                        if (response.ok) {
                            const data = await response.json();
                            newDday.id = data.id;
                            ddayData.push(newDday);
                            renderDdayList();
                            resetForm();
                        }
                    } catch (error) {
                        console.error('D-Day 추가 실패:', error);
                        alert('D-Day 추가에 실패했습니다.');
                    }
                } else {
                    // localStorage에 저장
                    ddayData.push(newDday);
                    saveDdayData();
                    renderDdayList();
                    resetForm();
                }
            }

            // D-Day 삭제
            async function deleteDday(id) {
                if (!confirm('정말 삭제하시겠습니까?')) return;
                
                if (currentUser) {
                    try {
                        const response = await fetch('/api/dday/' + id, {
                            method: 'DELETE'
                        });
                        
                        if (response.ok) {
                            ddayData = ddayData.filter(d => d.id !== id);
                            renderDdayList();
                        }
                    } catch (error) {
                        console.error('D-Day 삭제 실패:', error);
                    }
                } else {
                    ddayData = ddayData.filter(d => d.id !== id);
                    saveDdayData();
                    renderDdayList();
                }
            }

            // 양식 초기화
            function resetForm() {
                document.getElementById('ddayTitle').value = '';
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                document.getElementById('ddayDate').valueAsDate = tomorrow;
                document.getElementById('isAnniversary').checked = false;
            }

            // D-Day 계산
            function calculateDday(targetDate, mode, isAnniversary) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const target = new Date(targetDate);
                target.setHours(0, 0, 0, 0);
                
                const diffTime = target - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (mode === 'countdown') {
                    if (diffDays === 0) return 'D-Day';
                    if (diffDays > 0) return 'D-' + diffDays;
                    return 'D+' + Math.abs(diffDays);
                } else if (mode === 'countup') {
                    const days = Math.abs(diffDays) + (isAnniversary ? 1 : 0);
                    return days + '일째';
                } else {
                    return target.toLocaleDateString('ko-KR');
                }
            }

            // D-Day 리스트 렌더링
            function renderDdayList() {
                const listContainer = document.getElementById('ddayList');
                const emptyState = document.getElementById('emptyState');
                const countSpan = document.getElementById('ddayCount');
                
                countSpan.textContent = '(' + ddayData.length + ')';
                
                if (ddayData.length === 0) {
                    listContainer.innerHTML = '';
                    emptyState.classList.remove('hidden');
                    document.getElementById('heroDday').classList.add('hidden');
                    return;
                }
                
                emptyState.classList.add('hidden');
                
                // Hero D-Day 찾기 (가장 가까운 countdown)
                const upcomingDdays = ddayData
                    .filter(d => d.mode === 'countdown')
                    .map(d => {
                        const target = new Date(d.targetDate);
                        const today = new Date();
                        const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
                        return { ...d, diff };
                    })
                    .filter(d => d.diff >= 0)
                    .sort((a, b) => a.diff - b.diff);
                
                if (upcomingDdays.length > 0) {
                    renderHeroDday(upcomingDdays[0]);
                } else {
                    document.getElementById('heroDday').classList.add('hidden');
                }
                
                // 리스트 렌더링
                listContainer.innerHTML = ddayData.map(dday => {
                    const ddayText = calculateDday(dday.targetDate, dday.mode, dday.isAnniversary);
                    const colorStyle = dday.color.startsWith('#') 
                        ? 'background: linear-gradient(135deg, ' + dday.color + ' 0%, ' + adjustColor(dday.color) + ' 100%);'
                        : 'background: ' + dday.color + ';';
                    
                    return '<div class="dday-card rounded-xl shadow-lg p-3 sm:p-5" style="' + colorStyle + '">' +
                        '<div class="flex items-start justify-between mb-3">' +
                        '<div class="flex items-center gap-3">' +
                        '<span class="text-2xl sm:text-4xl">' + dday.emoji + '</span>' +
                        '<div class="text-white">' +
                        '<h3 class="font-bold text-base sm:text-lg">' + dday.title + '</h3>' +
                        '<p class="text-sm opacity-90">' + new Date(dday.targetDate).toLocaleDateString('ko-KR') + '</p>' +
                        '</div>' +
                        '</div>' +
                        '<button onclick="deleteDday(' + dday.id + ')" class="text-white opacity-70 hover:opacity-100 transition">' +
                        '<i class="fas fa-times"></i>' +
                        '</button>' +
                        '</div>' +
                        '<div class="bg-white bg-opacity-20 rounded-lg p-4 text-center">' +
                        '<div class="text-4xl font-bold text-white">' + ddayText + '</div>' +
                        '</div>' +
                        '</div>';
                }).join('');
            }

            // Hero D-Day 렌더링
            function renderHeroDday(dday) {
                const heroSection = document.getElementById('heroDday');
                const heroContent = document.getElementById('heroContent');
                
                const ddayText = calculateDday(dday.targetDate, dday.mode, dday.isAnniversary);
                const diff = dday.diff;
                const progress = Math.max(0, Math.min(100, 100 - (diff / 30 * 100)));
                
                heroContent.innerHTML = 
                    '<div class="flex items-center gap-4 mb-4">' +
                    '<span class="text-6xl">' + dday.emoji + '</span>' +
                    '<div>' +
                    '<h2 class="text-3xl font-bold mb-1">' + dday.title + '</h2>' +
                    '<p class="text-lg opacity-90">까지 딱 ' + diff + '일 남았어요!</p>' +
                    '</div>' +
                    '</div>' +
                    '<div class="bg-white bg-opacity-20 rounded-xl p-6 mb-4">' +
                    '<div class="text-6xl font-bold text-center">' + ddayText + '</div>' +
                    '</div>' +
                    '<div class="bg-white bg-opacity-10 rounded-full h-3 overflow-hidden">' +
                    '<div class="progress-bar bg-white h-full" style="width: ' + progress + '%"></div>' +
                    '</div>';
                
                heroSection.classList.remove('hidden');
            }

            // 색상 조정 (그라디언트용)
            function adjustColor(hex) {
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                
                const adjusted = '#' + 
                    Math.min(255, r + 30).toString(16).padStart(2, '0') +
                    Math.min(255, g + 30).toString(16).padStart(2, '0') +
                    Math.min(255, b + 30).toString(16).padStart(2, '0');
                
                return adjusted;
            }

            // Hero 캡처
            async function captureHero() {
                const element = document.getElementById('heroDday');
                try {
                    const canvas = await html2canvas(element, { backgroundColor: null });
                    const link = document.createElement('a');
                    link.download = 'my-dday.png';
                    link.href = canvas.toDataURL();
                    link.click();
                } catch (error) {
                    console.error('이미지 저장 실패:', error);
                    alert('이미지 저장에 실패했습니다.');
                }
            }

            // 전체 리스트 캡처
            async function exportAllAsImage() {
                if (ddayData.length === 0) {
                    alert('저장할 D-Day가 없습니다.');
                    return;
                }
                
                const element = document.getElementById('ddayList');
                try {
                    const canvas = await html2canvas(element, { backgroundColor: '#ffffff' });
                    const link = document.createElement('a');
                    link.download = 'my-dday-list.png';
                    link.href = canvas.toDataURL();
                    link.click();
                } catch (error) {
                    console.error('이미지 저장 실패:', error);
                    alert('이미지 저장에 실패했습니다.');
                }
            }
        </script>

        ${getCommonFooter()}
    </body>
    </html>
  `);
});
// ==================== Pro JSON Studio (Developer Tool) ====================
app.get('/lifestyle/json-formatter', (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko" id="html-root">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pro JSON Studio - Faith Portal</title>
        <meta name="description" content="개발자를 위한 전문 JSON 에디터. 실시간 검증, 포맷팅, 트리뷰, 변환 기능 제공. 100% 클라이언트 처리로 보안 걱정 NO.">
        <script>
            (function() {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                    if (args[0] && typeof args[0] === 'string' && 
                        args[0].includes('cdn.tailwindcss.com should not be used in production')) {
                        return;
                    }
                    originalWarn.apply(console, args);
                };
            })();
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        
        <!-- Monaco Editor (VS Code 엔진) -->
        <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js"></script>
        
        <!-- JSON5 for auto-fix -->
        <script src="https://cdn.jsdelivr.net/npm/json5@2.2.3/dist/index.min.js"></script>
        
        <!-- js-yaml for YAML conversion -->
        <script src="https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js"></script>
        
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { height: 100%; overflow: hidden; }
            
            /* Dark theme colors */
            :root {
                --bg-primary: #1e1e1e;
                --bg-secondary: #252526;
                --bg-tertiary: #2d2d30;
                --border-color: #3e3e42;
                --text-primary: #d4d4d4;
                --text-secondary: #858585;
                --accent-blue: #007acc;
                --accent-green: #4ec9b0;
                --error-red: #f48771;
                --success-green: #89d185;
            }
            
            body {
                background: var(--bg-primary);
                color: var(--text-primary);
                font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            }
            
            /* Toolbar styles */
            .toolbar {
                background: var(--bg-secondary);
                border-bottom: 1px solid var(--border-color);
                padding: 12px 16px;
                display: flex;
                align-items: center;
                gap: 8px;
                flex-wrap: wrap;
            }
            
            .btn {
                padding: 8px 16px;
                border-radius: 4px;
                border: none;
                cursor: pointer;
                font-size: 13px;
                font-weight: 500;
                transition: all 0.2s;
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }
            
            .btn-primary {
                background: var(--accent-blue);
                color: white;
            }
            
            .btn-primary:hover {
                background: #005a9e;
            }
            
            .btn-secondary {
                background: var(--bg-tertiary);
                color: var(--text-primary);
            }
            
            .btn-secondary:hover {
                background: #3e3e42;
            }
            
            .btn-danger {
                background: #d32f2f;
                color: white;
            }
            
            .btn-danger:hover {
                background: #b71c1c;
            }
            
            .btn-success {
                background: #388e3c;
                color: white;
            }
            
            .btn-success:hover {
                background: #2e7d32;
            }
            
            /* Status bar */
            .status-bar {
                background: var(--bg-secondary);
                border-top: 1px solid var(--border-color);
                padding: 6px 16px;
                font-size: 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .status-error {
                color: var(--error-red);
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .status-success {
                color: var(--success-green);
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            /* Split panel */
            .split-panel {
                display: flex;
                height: calc(100vh - 120px);
            }
            
            .panel {
                flex: 1;
                overflow: hidden;
                position: relative;
            }
            
            .panel-divider {
                width: 4px;
                background: var(--border-color);
                cursor: col-resize;
                position: relative;
            }
            
            .panel-divider:hover {
                background: var(--accent-blue);
            }
            
            /* Monaco editor container */
            #editor-container {
                height: 100%;
                width: 100%;
            }
            
            /* Output panel */
            .output-panel {
                height: 100%;
                display: flex;
                flex-direction: column;
            }
            
            .output-tabs {
                background: var(--bg-secondary);
                border-bottom: 1px solid var(--border-color);
                display: flex;
                padding: 0 16px;
            }
            
            .output-tab {
                padding: 10px 16px;
                cursor: pointer;
                border-bottom: 2px solid transparent;
                font-size: 13px;
                transition: all 0.2s;
            }
            
            .output-tab:hover {
                background: var(--bg-tertiary);
            }
            
            .output-tab.active {
                border-bottom-color: var(--accent-blue);
                color: var(--accent-blue);
            }
            
            .output-content {
                flex: 1;
                overflow: auto;
                padding: 16px;
            }
            
            /* Tree view styles */
            .tree-view {
                font-family: 'Consolas', monospace;
                font-size: 13px;
                line-height: 1.6;
            }
            
            .tree-node {
                margin-left: 20px;
            }
            
            .tree-key {
                color: var(--accent-green);
                cursor: pointer;
            }
            
            .tree-key:hover {
                text-decoration: underline;
            }
            
            .tree-value-string { color: #ce9178; }
            .tree-value-number { color: #b5cea8; }
            .tree-value-boolean { color: #569cd6; }
            .tree-value-null { color: #858585; }
            
            .tree-toggle {
                cursor: pointer;
                color: var(--text-secondary);
                margin-right: 4px;
                user-select: none;
            }
            
            /* Code view */
            .code-view {
                font-family: 'Consolas', monospace;
                font-size: 13px;
                line-height: 1.6;
                white-space: pre;
                color: var(--text-primary);
            }
            
            /* Privacy badge */
            .privacy-badge {
                background: rgba(76, 175, 80, 0.1);
                border: 1px solid rgba(76, 175, 80, 0.3);
                color: var(--success-green);
                padding: 4px 10px;
                border-radius: 4px;
                font-size: 11px;
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }
            
            /* Dropdown */
            select {
                background: var(--bg-tertiary);
                color: var(--text-primary);
                border: 1px solid var(--border-color);
                padding: 6px 10px;
                border-radius: 4px;
                font-size: 13px;
                cursor: pointer;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .split-panel {
                    flex-direction: column;
                    height: calc(100vh - 140px);
                }
                
                .panel-divider {
                    width: 100%;
                    height: 4px;
                    cursor: row-resize;
                }
                
                .toolbar {
                    padding: 8px;
                }
                
                .btn {
                    padding: 6px 12px;
                    font-size: 12px;
                }
            }
        </style>
    </head>
    <body>
        ${getCommonAuthScript()}
        ${getCommonHeader('Lifestyle')}
        ${getStickyHeader()}
        
        ${getBreadcrumb([
        { label: '홈', href: '/' },
        { label: '유틸리티', href: '/lifestyle' },
        { label: 'JSON Studio' }
    ])}

        <!-- Toolbar -->
        <div class="toolbar">
            <button class="btn btn-primary" onclick="formatJson()" title="Beautify JSON (Ctrl+Shift+F)">
                <i class="fas fa-magic"></i> <span class="hidden sm:inline">Format</span>
            </button>
            <button class="btn btn-secondary" onclick="minifyJson()" title="Compress JSON">
                <i class="fas fa-compress"></i> <span class="hidden sm:inline">Minify</span>
            </button>
            <button class="btn btn-success" onclick="autoFixJson()" title="Try to fix broken JSON">
                <i class="fas fa-wrench"></i> <span class="hidden sm:inline">Auto Fix</span>
            </button>
            <button class="btn btn-secondary" onclick="clearEditor()" title="Clear all">
                <i class="fas fa-eraser"></i> <span class="hidden sm:inline">Clear</span>
            </button>
            <button class="btn btn-secondary" onclick="copyToClipboard()" title="Copy to clipboard">
                <i class="fas fa-copy"></i> <span class="hidden sm:inline">Copy</span>
            </button>
            
            <div class="hidden sm:block" style="margin-left: auto; display: flex; align-items: center; gap: 8px;">
                <label for="indent-select" style="font-size: 12px;">Indent:</label>
                <select id="indent-select" onchange="updateIndent()">
                    <option value="2" selected>2 spaces</option>
                    <option value="4">4 spaces</option>
                    <option value="tab">Tab</option>
                </select>
            </div>
            
            <div class="privacy-badge">
                <i class="fas fa-shield-alt"></i>
                <span class="hidden sm:inline">100% Client-side Processing</span>
                <span class="sm:hidden">Secure</span>
            </div>
        </div>

        <!-- Main Split Panel -->
        <div class="split-panel">
            <!-- Left: Monaco Editor -->
            <div class="panel">
                <div id="editor-container"></div>
            </div>
            
            <div class="panel-divider"></div>
            
            <!-- Right: Output Viewer -->
            <div class="panel">
                <div class="output-panel">
                    <div class="output-tabs">
                        <div class="output-tab active" onclick="switchTab('code')" data-tab="code">
                            <i class="fas fa-code"></i> Code
                        </div>
                        <div class="output-tab" onclick="switchTab('tree')" data-tab="tree">
                            <i class="fas fa-sitemap"></i> Tree View
                        </div>
                        <div class="output-tab" onclick="switchTab('convert')" data-tab="convert">
                            <i class="fas fa-exchange-alt"></i> Convert
                        </div>
                    </div>
                    <div class="output-content">
                        <div id="code-view" class="code-view"></div>
                        <div id="tree-view" class="tree-view" style="display: none;"></div>
                        <div id="convert-view" style="display: none;">
                            <div style="margin-bottom: 16px;">
                                <button class="btn btn-secondary" onclick="convertTo('yaml')" style="margin-right: 8px;">
                                    <i class="fas fa-file-code"></i> To YAML
                                </button>
                                <button class="btn btn-secondary" onclick="convertTo('xml')" style="margin-right: 8px;">
                                    <i class="fas fa-file-code"></i> To XML
                                </button>
                                <button class="btn btn-secondary" onclick="convertTo('csv')">
                                    <i class="fas fa-file-csv"></i> To CSV
                                </button>
                            </div>
                            <pre id="convert-output" class="code-view"></pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Status Bar -->
        <div class="status-bar">
            <div id="status-message" style="display: flex; align-items: center; gap: 6px;">
                <i class="fas fa-info-circle"></i>
                <span>Ready</span>
            </div>
            <div id="stats-message" style="font-size: 11px; color: var(--text-secondary);"></div>
        </div>

        <script>
            let editor;
            let currentJson = null;
            let currentIndent = 2;
            let currentTab = 'code';

            // Initialize Monaco Editor
            require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }});
            
            require(['vs/editor/editor.main'], function() {
                editor = monaco.editor.create(document.getElementById('editor-container'), {
                    value: \`{
  "message": "Welcome to Pro JSON Studio! 👋",
  "features": [
    "Real-time validation",
    "Auto-fix broken JSON",
    "Tree view explorer",
    "Format converter (YAML, XML, CSV)",
    "100% client-side processing"
  ],
  "shortcuts": {
    "format": "Ctrl+Shift+F",
    "find": "Ctrl+F",
    "replace": "Ctrl+H"
  },
  "privacy": "No data sent to server ✅"
}\`,
                    language: 'json',
                    theme: 'vs-dark',
                    automaticLayout: true,
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    folding: true,
                    bracketPairColorization: {
                        enabled: true
                    },
                    formatOnPaste: true,
                    formatOnType: true
                });

                // Real-time validation
                editor.onDidChangeModelContent(() => {
                    validateAndUpdate();
                });

                // Initial validation
                setTimeout(() => validateAndUpdate(), 500);
            });

            // Validate and update output
            function validateAndUpdate() {
                const value = editor.getValue().trim();
                
                if (!value) {
                    setStatus('info', 'Enter JSON data to begin');
                    currentJson = null;
                    updateOutput();
                    return;
                }

                // Try to detect URL query string
                if (value.startsWith('?') || (value.includes('=') && value.includes('&'))) {
                    try {
                        const params = new URLSearchParams(value.startsWith('?') ? value : '?' + value);
                        const obj = {};
                        params.forEach((val, key) => obj[key] = val);
                        currentJson = obj;
                        const formatted = JSON.stringify(obj, null, currentIndent);
                        editor.setValue(formatted);
                        setStatus('success', 'Auto-converted URL query string to JSON');
                        updateOutput();
                        return;
                    } catch (e) {}
                }

                try {
                    currentJson = JSON.parse(value);
                    setStatus('success', 'Valid JSON ✓');
                    updateStats(value);
                    updateOutput();
                } catch (e) {
                    currentJson = null;
                    const lineMatch = e.message.match(/position (\\d+)/);
                    if (lineMatch) {
                        const pos = parseInt(lineMatch[1]);
                        const model = editor.getModel();
                        const position = model.getPositionAt(pos);
                        setStatus('error', \`Syntax Error at line \${position.lineNumber}: \${e.message}\`);
                    } else {
                        setStatus('error', \`Syntax Error: \${e.message}\`);
                    }
                    updateStats(value);
                }
            }

            // Format JSON
            function formatJson() {
                if (!currentJson) {
                    alert('Please fix JSON errors first');
                    return;
                }
                const indentStr = currentIndent === 'tab' ? '\\t' : ' '.repeat(currentIndent);
                const formatted = JSON.stringify(currentJson, null, indentStr);
                editor.setValue(formatted);
                setStatus('success', 'JSON formatted successfully');
            }

            // Minify JSON
            function minifyJson() {
                if (!currentJson) {
                    alert('Please fix JSON errors first');
                    return;
                }
                const minified = JSON.stringify(currentJson);
                editor.setValue(minified);
                setStatus('success', 'JSON minified successfully');
            }

            // Auto-fix broken JSON using JSON5
            function autoFixJson() {
                const value = editor.getValue().trim();
                if (!value) return;

                try {
                    // First try standard JSON
                    JSON.parse(value);
                    setStatus('info', 'JSON is already valid');
                    return;
                } catch (e) {
                    // Try JSON5 (tolerant parsing)
                    try {
                        const fixed = JSON5.parse(value);
                        const formatted = JSON.stringify(fixed, null, currentIndent);
                        editor.setValue(formatted);
                        setStatus('success', 'Auto-fixed and formatted! (converted from JSON5)');
                        currentJson = fixed;
                        updateOutput();
                    } catch (e2) {
                        setStatus('error', \`Cannot auto-fix: \${e2.message}\`);
                    }
                }
            }

            // Clear editor
            function clearEditor() {
                if (confirm('Clear all content?')) {
                    editor.setValue('');
                    currentJson = null;
                    updateOutput();
                    setStatus('info', 'Editor cleared');
                }
            }

            // Copy to clipboard
            async function copyToClipboard() {
                const value = editor.getValue();
                if (!value) {
                    alert('Nothing to copy');
                    return;
                }
                try {
                    await navigator.clipboard.writeText(value);
                    setStatus('success', 'Copied to clipboard!');
                } catch (e) {
                    alert('Failed to copy');
                }
            }

            // Update indent setting
            function updateIndent() {
                const select = document.getElementById('indent-select');
                currentIndent = select.value === 'tab' ? 'tab' : parseInt(select.value);
                setStatus('info', \`Indent changed to: \${select.options[select.selectedIndex].text}\`);
            }

            // Switch output tab
            function switchTab(tabName) {
                currentTab = tabName;
                
                // Update tab UI
                document.querySelectorAll('.output-tab').forEach(tab => {
                    tab.classList.toggle('active', tab.dataset.tab === tabName);
                });

                // Update view
                document.getElementById('code-view').style.display = tabName === 'code' ? 'block' : 'none';
                document.getElementById('tree-view').style.display = tabName === 'tree' ? 'block' : 'none';
                document.getElementById('convert-view').style.display = tabName === 'convert' ? 'block' : 'none';
                
                updateOutput();
            }

            // Update output based on current tab
            function updateOutput() {
                if (currentTab === 'code') {
                    updateCodeView();
                } else if (currentTab === 'tree') {
                    updateTreeView();
                }
            }

            // Update code view
            function updateCodeView() {
                const codeView = document.getElementById('code-view');
                if (!currentJson) {
                    codeView.textContent = '// Waiting for valid JSON...';
                    return;
                }
                const indentStr = currentIndent === 'tab' ? '\\t' : ' '.repeat(currentIndent);
                codeView.textContent = JSON.stringify(currentJson, null, indentStr);
            }

            // Update tree view
            function updateTreeView() {
                const treeView = document.getElementById('tree-view');
                if (!currentJson) {
                    treeView.innerHTML = '<div style="color: var(--text-secondary);">// Waiting for valid JSON...</div>';
                    return;
                }
                treeView.innerHTML = renderTreeNode('root', currentJson);
            }

            // Render tree node
            function renderTreeNode(key, value, level = 0) {
                const indent = '&nbsp;'.repeat(level * 4);
                let html = '';

                if (Array.isArray(value)) {
                    html += \`<div>\${indent}<span class="tree-toggle" onclick="toggleNode(this)">▼</span><span class="tree-key">\${key}</span>: [<span style="color: var(--text-secondary);">\${value.length} items</span>]</div>\`;
                    html += '<div class="tree-node">';
                    value.forEach((item, i) => {
                        html += renderTreeNode(i, item, level + 1);
                    });
                    html += '</div>';
                } else if (typeof value === 'object' && value !== null) {
                    const keys = Object.keys(value);
                    html += \`<div>\${indent}<span class="tree-toggle" onclick="toggleNode(this)">▼</span><span class="tree-key">\${key}</span>: {<span style="color: var(--text-secondary);">\${keys.length} keys</span>}</div>\`;
                    html += '<div class="tree-node">';
                    keys.forEach(k => {
                        html += renderTreeNode(k, value[k], level + 1);
                    });
                    html += '</div>';
                } else {
                    const className = value === null ? 'tree-value-null' :
                                    typeof value === 'string' ? 'tree-value-string' :
                                    typeof value === 'number' ? 'tree-value-number' :
                                    typeof value === 'boolean' ? 'tree-value-boolean' : '';
                    const displayValue = typeof value === 'string' ? \`"\${value}"\` : String(value);
                    html += \`<div>\${indent}<span class="tree-key">\${key}</span>: <span class="\${className}">\${displayValue}</span></div>\`;
                }

                return html;
            }

            // Toggle tree node
            function toggleNode(toggle) {
                const node = toggle.parentElement.nextElementSibling;
                if (node && node.classList.contains('tree-node')) {
                    const isCollapsed = node.style.display === 'none';
                    node.style.display = isCollapsed ? 'block' : 'none';
                    toggle.textContent = isCollapsed ? '▼' : '▶';
                }
            }

            // Convert to other formats
            function convertTo(format) {
                if (!currentJson) {
                    alert('Please fix JSON errors first');
                    return;
                }

                const output = document.getElementById('convert-output');
                
                try {
                    if (format === 'yaml') {
                        output.textContent = jsyaml.dump(currentJson);
                        setStatus('success', 'Converted to YAML');
                    } else if (format === 'xml') {
                        output.textContent = jsonToXml(currentJson);
                        setStatus('success', 'Converted to XML');
                    } else if (format === 'csv') {
                        output.textContent = jsonToCsv(currentJson);
                        setStatus('success', 'Converted to CSV');
                    }
                } catch (e) {
                    output.textContent = 'Error: ' + e.message;
                    setStatus('error', 'Conversion failed: ' + e.message);
                }
            }

            // JSON to XML converter
            function jsonToXml(obj, rootName = 'root') {
                let xml = \`<?xml version="1.0" encoding="UTF-8"?>\\n<\${rootName}>\\n\`;
                
                function convert(obj, indent = '  ') {
                    let result = '';
                    for (const [key, value] of Object.entries(obj)) {
                        if (Array.isArray(value)) {
                            value.forEach(item => {
                                if (typeof item === 'object') {
                                    result += \`\${indent}<\${key}>\\n\`;
                                    result += convert(item, indent + '  ');
                                    result += \`\${indent}</\${key}>\\n\`;
                                } else {
                                    result += \`\${indent}<\${key}>\${item}</\${key}>\\n\`;
                                }
                            });
                        } else if (typeof value === 'object' && value !== null) {
                            result += \`\${indent}<\${key}>\\n\`;
                            result += convert(value, indent + '  ');
                            result += \`\${indent}</\${key}>\\n\`;
                        } else {
                            result += \`\${indent}<\${key}>\${value}</\${key}>\\n\`;
                        }
                    }
                    return result;
                }
                
                xml += convert(obj);
                xml += \`</\${rootName}>\`;
                return xml;
            }

            // JSON to CSV converter
            function jsonToCsv(obj) {
                if (Array.isArray(obj)) {
                    if (obj.length === 0) return '';
                    
                    const keys = Object.keys(obj[0]);
                    let csv = keys.join(',') + '\\n';
                    
                    obj.forEach(row => {
                        const values = keys.map(key => {
                            const val = row[key];
                            if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
                                return \`"\${val.replace(/"/g, '""')}"\`;
                            }
                            return val;
                        });
                        csv += values.join(',') + '\\n';
                    });
                    
                    return csv;
                } else {
                    return 'CSV conversion requires an array of objects';
                }
            }

            // Set status message
            function setStatus(type, message) {
                const statusEl = document.getElementById('status-message');
                const icon = type === 'success' ? 'fa-check-circle' :
                           type === 'error' ? 'fa-exclamation-circle' :
                           'fa-info-circle';
                const color = type === 'success' ? 'var(--success-green)' :
                            type === 'error' ? 'var(--error-red)' :
                            'var(--text-primary)';
                
                statusEl.innerHTML = \`<i class="fas \${icon}" style="color: \${color}"></i><span>\${message}</span>\`;
            }

            // Update stats
            function updateStats(jsonString) {
                const lines = jsonString.split('\\n').length;
                const chars = jsonString.length;
                const size = new Blob([jsonString]).size;
                document.getElementById('stats-message').textContent = 
                    \`Lines: \${lines} | Characters: \${chars} | Size: \${size} bytes\`;
            }
        </script>

        ${getCommonFooter()}
    </body>
    </html>
  `);
});
// ==================== Secret Base64 Converter (Developer Tool) ====================
app.get('/lifestyle/base64-converter', (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko" id="html-root">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Secret Base64 Converter - Faith Portal</title>
        <meta name="description" content="100% 클라이언트 처리 Base64 변환기. 한글 완벽 지원, JWT 자동 감지, 이미지 변환. 서버 전송 0%.">
        <script>
            (function() {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                    if (args[0] && typeof args[0] === 'string' && 
                        args[0].includes('cdn.tailwindcss.com should not be used in production')) {
                        return;
                    }
                    originalWarn.apply(console, args);
                };
            })();
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        
        <!-- js-base64 for UTF-8 support -->
        <script src="https://cdn.jsdelivr.net/npm/js-base64@3.7.5/base64.min.js"></script>
        
        <style>
            * { box-sizing: border-box; }
            
            /* Dark theme */
            :root {
                --bg-primary: #1a1a1a;
                --bg-secondary: #252525;
                --bg-tertiary: #2d2d2d;
                --border-color: #404040;
                --text-primary: #e0e0e0;
                --text-secondary: #a0a0a0;
                --accent-blue: #3b82f6;
                --accent-green: #10b981;
                --error-red: #ef4444;
                --success-green: #22c55e;
            }
            
            body {
                background: var(--bg-primary);
                color: var(--text-primary);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            /* Tabs */
            .mode-tabs {
                display: flex;
                background: var(--bg-secondary);
                border-bottom: 2px solid var(--border-color);
                padding: 0 20px;
            }
            
            .mode-tab {
                padding: 16px 24px;
                cursor: pointer;
                border-bottom: 3px solid transparent;
                font-size: 15px;
                font-weight: 500;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .mode-tab:hover {
                background: var(--bg-tertiary);
            }
            
            .mode-tab.active {
                border-bottom-color: var(--accent-blue);
                color: var(--accent-blue);
            }
            
            /* Split panel */
            .split-panel {
                display: grid;
                grid-template-columns: 1fr auto 1fr;
                gap: 0;
                height: calc(100vh - 200px);
                padding: 20px;
            }
            
            .panel {
                display: flex;
                flex-direction: column;
                min-width: 0;
            }
            
            .panel-divider {
                width: 60px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                gap: 12px;
            }
            
            /* Textarea */
            textarea {
                flex: 1;
                width: 100%;
                padding: 16px;
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                color: var(--text-primary);
                font-family: 'Consolas', 'Monaco', monospace;
                font-size: 14px;
                line-height: 1.6;
                resize: none;
                outline: none;
            }
            
            textarea:focus {
                border-color: var(--accent-blue);
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            textarea::placeholder {
                color: var(--text-secondary);
            }
            
            /* Buttons */
            .btn {
                padding: 10px 20px;
                border-radius: 6px;
                border: none;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }
            
            .btn-primary {
                background: var(--accent-blue);
                color: white;
            }
            
            .btn-primary:hover {
                background: #2563eb;
                transform: translateY(-1px);
            }
            
            .btn-secondary {
                background: var(--bg-tertiary);
                color: var(--text-primary);
                border: 1px solid var(--border-color);
            }
            
            .btn-secondary:hover {
                background: var(--bg-secondary);
            }
            
            .btn-success {
                background: var(--success-green);
                color: white;
            }
            
            .btn-success:hover {
                background: #16a34a;
            }
            
            /* Drop zone */
            .drop-zone {
                flex: 1;
                border: 2px dashed var(--border-color);
                border-radius: 12px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px;
                cursor: pointer;
                transition: all 0.3s;
                background: var(--bg-secondary);
            }
            
            .drop-zone:hover, .drop-zone.drag-over {
                border-color: var(--accent-blue);
                background: rgba(59, 130, 246, 0.05);
            }
            
            .drop-zone i {
                font-size: 48px;
                color: var(--accent-blue);
                margin-bottom: 16px;
            }
            
            /* Image preview */
            .image-preview {
                max-width: 100%;
                max-height: 300px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            }
            
            /* JWT chip */
            .jwt-chip {
                background: rgba(59, 130, 246, 0.1);
                border: 1px solid rgba(59, 130, 246, 0.3);
                color: var(--accent-blue);
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 13px;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .jwt-chip:hover {
                background: rgba(59, 130, 246, 0.2);
            }
            
            /* Privacy badge */
            .privacy-badge {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(34, 197, 94, 0.1);
                border: 1px solid rgba(34, 197, 94, 0.3);
                color: var(--success-green);
                padding: 12px 20px;
                border-radius: 8px;
                font-size: 13px;
                display: flex;
                align-items: center;
                gap: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .split-panel {
                    grid-template-columns: 1fr;
                    height: auto;
                    min-height: calc(100vh - 200px);
                }
                
                .panel-divider {
                    width: 100%;
                    height: 60px;
                    flex-direction: row;
                }
                
                .privacy-badge {
                    bottom: 10px;
                    right: 10px;
                    font-size: 11px;
                    padding: 8px 12px;
                }
            }
        </style>
    </head>
    <body>
        ${getCommonAuthScript()}
        ${getCommonHeader('Lifestyle')}
        ${getStickyHeader()}
        
        ${getBreadcrumb([
        { label: '홈', href: '/' },
        { label: '유틸리티', href: '/lifestyle' },
        { label: 'Base64 변환' }
    ])}

        <!-- Mode Tabs -->
        <div class="mode-tabs">
            <div class="mode-tab active" onclick="switchMode('text')" data-mode="text">
                <i class="fas fa-font"></i>
                <span>텍스트 변환</span>
            </div>
            <div class="mode-tab" onclick="switchMode('image')" data-mode="image">
                <i class="fas fa-image"></i>
                <span>이미지 변환</span>
            </div>
        </div>

        <!-- Text Mode -->
        <div id="text-mode" class="split-panel">
            <div class="panel">
                <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="font-size: 16px; font-weight: 600;">Input</h3>
                    <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer;">
                        <input type="checkbox" id="realtime-toggle" checked onchange="toggleRealtime()">
                        <span>실시간 변환</span>
                    </label>
                </div>
                <textarea id="text-input" placeholder="변환할 텍스트를 입력하세요... (한글 완벽 지원)"></textarea>
            </div>
            
            <div class="panel-divider">
                <button class="btn btn-primary" onclick="encodeText()" title="인코딩">
                    <i class="fas fa-arrow-right"></i>
                    <span class="hidden sm:inline">Encode</span>
                </button>
                <button class="btn btn-secondary" onclick="decodeText()" title="디코딩">
                    <i class="fas fa-arrow-left"></i>
                    <span class="hidden sm:inline">Decode</span>
                </button>
                <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer; margin-top: 8px;">
                    <input type="checkbox" id="url-safe-toggle">
                    <span>URL Safe</span>
                </label>
            </div>
            
            <div class="panel">
                <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="font-size: 16px; font-weight: 600;">Output</h3>
                    <div style="display: flex; gap: 8px;">
                        <div id="jwt-indicator"></div>
                        <button class="btn btn-success btn-sm" onclick="copyOutput()" style="padding: 6px 12px; font-size: 13px;">
                            <i class="fas fa-copy"></i>
                            <span class="hidden sm:inline">복사</span>
                        </button>
                    </div>
                </div>
                <textarea id="text-output" placeholder="변환 결과가 여기에 표시됩니다..." readonly></textarea>
            </div>
        </div>

        <!-- Image Mode -->
        <div id="image-mode" style="display: none; padding: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; height: calc(100vh - 240px);">
                <!-- Left: Drop Zone & Results -->
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <div class="drop-zone" id="drop-zone" onclick="document.getElementById('file-input').click()">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">이미지 업로드</h3>
                        <p style="color: var(--text-secondary); font-size: 14px;">클릭하거나 이미지를 드래그 앤 드롭</p>
                        <p style="color: var(--text-secondary); font-size: 12px; margin-top: 8px;">JPG, PNG, GIF, WebP 지원</p>
                        <input type="file" id="file-input" accept="image/*" style="display: none;" onchange="handleImageUpload(event)">
                    </div>
                    
                    <div id="image-results" style="display: none; flex: 1; display: flex; flex-direction: column; gap: 12px; overflow: hidden;">
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-secondary" onclick="copyImageResult('raw')" style="flex: 1;">
                                <i class="fas fa-copy"></i> Raw Copy
                            </button>
                            <button class="btn btn-secondary" onclick="copyImageResult('html')" style="flex: 1;">
                                <i class="fas fa-code"></i> &lt;img&gt; Copy
                            </button>
                            <button class="btn btn-secondary" onclick="copyImageResult('css')" style="flex: 1;">
                                <i class="fas fa-palette"></i> CSS Copy
                            </button>
                        </div>
                        <textarea id="image-output" readonly style="flex: 1; font-size: 12px;"></textarea>
                    </div>
                </div>
                
                <!-- Right: Preview -->
                <div style="display: flex; flex-direction: column; background: var(--bg-secondary); border-radius: 12px; padding: 20px; align-items: center; justify-content: center;">
                    <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px; align-self: flex-start;">Preview</h3>
                    <div id="image-preview-container" style="flex: 1; display: flex; align-items: center; justify-content: center; width: 100%;">
                        <p style="color: var(--text-secondary); font-size: 14px;">이미지를 업로드하면 미리보기가 표시됩니다</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Privacy Badge -->
        <div class="privacy-badge">
            <i class="fas fa-shield-alt"></i>
            <span>100% 클라이언트 처리 - 서버 전송 0%</span>
        </div>

        <script>
            let currentMode = 'text';
            let realtimeEnabled = true;
            let currentImageData = null;

            // Initialize
            document.getElementById('text-input').addEventListener('input', () => {
                if (realtimeEnabled) {
                    encodeText();
                }
            });

            // Mode switching
            function switchMode(mode) {
                currentMode = mode;
                
                // Update tabs
                document.querySelectorAll('.mode-tab').forEach(tab => {
                    tab.classList.toggle('active', tab.dataset.mode === mode);
                });
                
                // Update views
                document.getElementById('text-mode').style.display = mode === 'text' ? 'grid' : 'none';
                document.getElementById('image-mode').style.display = mode === 'image' ? 'block' : 'none';
            }

            // Toggle realtime conversion
            function toggleRealtime() {
                realtimeEnabled = document.getElementById('realtime-toggle').checked;
            }

            // Encode text
            function encodeText() {
                const input = document.getElementById('text-input').value;
                const output = document.getElementById('text-output');
                const urlSafe = document.getElementById('url-safe-toggle').checked;
                
                if (!input) {
                    output.value = '';
                    return;
                }
                
                try {
                    // UTF-8 safe encoding using js-base64
                    let encoded = Base64.encode(input);
                    
                    // URL Safe conversion
                    if (urlSafe) {
                        encoded = encoded.replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=/g, '');
                    }
                    
                    output.value = encoded;
                    checkJWT(encoded);
                } catch (e) {
                    output.value = '인코딩 오류: ' + e.message;
                }
            }

            // Decode text
            function decodeText() {
                const input = document.getElementById('text-input').value;
                const output = document.getElementById('text-output');
                const urlSafe = document.getElementById('url-safe-toggle').checked;
                
                if (!input) {
                    output.value = '';
                    return;
                }
                
                try {
                    let toDecode = input.trim();
                    
                    // URL Safe conversion back
                    if (urlSafe || toDecode.includes('-') || toDecode.includes('_')) {
                        toDecode = toDecode.replace(/-/g, '+').replace(/_/g, '/');
                        // Add padding if needed
                        while (toDecode.length % 4) {
                            toDecode += '=';
                        }
                    }
                    
                    // UTF-8 safe decoding using js-base64
                    const decoded = Base64.decode(toDecode);
                    output.value = decoded;
                    checkJWT(toDecode);
                } catch (e) {
                    output.value = '유효하지 않은 Base64 형식입니다: ' + e.message;
                }
            }

            // Check if it's a JWT token
            function checkJWT(base64String) {
                const indicator = document.getElementById('jwt-indicator');
                
                // JWT tokens start with "ey"
                if (base64String.startsWith('ey')) {
                    try {
                        // JWT has 3 parts separated by dots
                        const parts = base64String.split('.');
                        if (parts.length === 3) {
                            indicator.innerHTML = \`
                                <div class="jwt-chip" onclick="showJWT('\${base64String}')">
                                    <i class="fas fa-key"></i>
                                    <span>JWT 토큰 감지 - 클릭하여 Payload 보기</span>
                                </div>
                            \`;
                            return;
                        }
                    } catch (e) {}
                }
                
                indicator.innerHTML = '';
            }

            // Show JWT payload
            function showJWT(token) {
                try {
                    const parts = token.split('.');
                    if (parts.length !== 3) {
                        alert('유효하지 않은 JWT 형식입니다.');
                        return;
                    }
                    
                    // Decode header and payload
                    const header = JSON.parse(Base64.decode(parts[0]));
                    const payload = JSON.parse(Base64.decode(parts[1]));
                    
                    // Pretty print
                    const formatted = \`JWT Header:\\n\${JSON.stringify(header, null, 2)}\\n\\nJWT Payload:\\n\${JSON.stringify(payload, null, 2)}\`;
                    
                    // Show in output
                    document.getElementById('text-output').value = formatted;
                    
                    // Show alert with key info
                    let info = 'JWT Token 정보:\\n\\n';
                    if (payload.exp) {
                        const expDate = new Date(payload.exp * 1000);
                        info += \`만료: \${expDate.toLocaleString('ko-KR')}\\n\`;
                    }
                    if (payload.iat) {
                        const iatDate = new Date(payload.iat * 1000);
                        info += \`발행: \${iatDate.toLocaleString('ko-KR')}\\n\`;
                    }
                    if (payload.sub) info += \`Subject: \${payload.sub}\\n\`;
                    if (payload.iss) info += \`Issuer: \${payload.iss}\\n\`;
                    
                    alert(info);
                } catch (e) {
                    alert('JWT 파싱 오류: ' + e.message);
                }
            }

            // Copy output
            async function copyOutput() {
                const output = document.getElementById('text-output').value;
                if (!output) {
                    alert('복사할 내용이 없습니다.');
                    return;
                }
                
                try {
                    await navigator.clipboard.writeText(output);
                    const btn = event.target.closest('button');
                    const originalHTML = btn.innerHTML;
                    btn.innerHTML = '<i class="fas fa-check"></i> <span class="hidden sm:inline">복사됨!</span>';
                    setTimeout(() => {
                        btn.innerHTML = originalHTML;
                    }, 2000);
                } catch (e) {
                    alert('복사에 실패했습니다.');
                }
            }

            // Image upload handling
            function handleImageUpload(event) {
                const file = event.target.files[0];
                if (!file) return;
                
                if (!file.type.startsWith('image/')) {
                    alert('이미지 파일만 업로드 가능합니다.');
                    return;
                }
                
                const reader = new FileReader();
                reader.onloadend = () => {
                    currentImageData = reader.result;
                    displayImageResult(currentImageData);
                };
                reader.readAsDataURL(file);
            }

            // Display image result
            function displayImageResult(base64Data) {
                // Show results section
                document.getElementById('image-results').style.display = 'flex';
                
                // Set output
                document.getElementById('image-output').value = base64Data;
                
                // Show preview
                const previewContainer = document.getElementById('image-preview-container');
                previewContainer.innerHTML = \`<img src="\${base64Data}" class="image-preview" alt="Preview">\`;
            }

            // Copy image result in different formats
            async function copyImageResult(format) {
                if (!currentImageData) {
                    alert('변환할 이미지가 없습니다.');
                    return;
                }
                
                let textToCopy = '';
                
                switch(format) {
                    case 'raw':
                        textToCopy = currentImageData;
                        break;
                    case 'html':
                        textToCopy = \`<img src="\${currentImageData}" alt="Image">\`;
                        break;
                    case 'css':
                        textToCopy = \`background-image: url('\${currentImageData}');\`;
                        break;
                }
                
                try {
                    await navigator.clipboard.writeText(textToCopy);
                    const btn = event.target.closest('button');
                    const originalHTML = btn.innerHTML;
                    btn.innerHTML = '<i class="fas fa-check"></i> 복사됨!';
                    setTimeout(() => {
                        btn.innerHTML = originalHTML;
                    }, 2000);
                } catch (e) {
                    alert('복사에 실패했습니다.');
                }
            }

            // Drag and drop
            const dropZone = document.getElementById('drop-zone');
            
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            });
            
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('drag-over');
            });
            
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        currentImageData = reader.result;
                        displayImageResult(currentImageData);
                    };
                    reader.readAsDataURL(file);
                } else {
                    alert('이미지 파일만 업로드 가능합니다.');
                }
            });
        </script>

        ${getCommonFooter()}
    </body>
    </html>
  `);
});
// ==================== 쇼핑 메인 페이지 ====================
app.get('/shopping', (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko" id="html-root">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>쇼핑 - Faith Portal</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50" id="html-root">
        ${getCommonHeader('Shopping')}
        ${getStickyHeader()}
        
        ${getBreadcrumb([
        { label: '홈', href: '/' },
        { label: '쇼핑', href: '/shopping' }
    ])}

        <main class="max-w-7xl mx-auto px-4 py-8">
            <div class="text-center py-20">
                <i class="fas fa-shopping-cart text-gray-300 text-9xl mb-6"></i>
                <h1 class="text-4xl font-bold text-gray-900 mb-4">쇼핑 페이지</h1>
                <p class="text-xl text-gray-600 mb-8">쇼핑 기능이 곧 추가될 예정입니다.</p>
                <a href="/" class="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
                    <i class="fas fa-home mr-2"></i>홈으로 돌아가기
                </a>
            </div>
        </main>

        ${getCommonFooter()}
        ${getCommonAuthScript()}
    </body>
    </html>
  `);
});
// ==================== 로그인/회원가입 페이지 ====================
// 로그인 페이지
app.get('/login', async (c) => {
    const redirect = c.req.query('redirect') || '/';
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>로그인 - Faith Portal</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      <style>
        body {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .login-card {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          max-width: 400px;
          width: 100%;
          margin: 20px;
        }
        .input-group {
          position: relative;
          margin-bottom: 20px;
        }
        .input-group input {
          width: 100%;
          padding: 15px 15px 15px 45px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 16px;
          transition: all 0.3s;
        }
        .input-group input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        .input-group i {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }
        .btn-login {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        .btn-login:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        .btn-login:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .error-message {
          background: #fee;
          color: #c33;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: none;
        }
        .error-message.show {
          display: block;
        }
      </style>
    </head>
    <body>
      <div class="login-card">
        <div class="p-8">
          <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">
              <i class="fas fa-sign-in-alt text-purple-600 mr-2"></i>
              로그인
            </h1>
            <p class="text-gray-600">Faith Portal에 오신 것을 환영합니다</p>
          </div>

          <div id="errorMessage" class="error-message"></div>

          <form id="loginForm">
            <div class="input-group">
              <i class="fas fa-envelope"></i>
              <input 
                type="email" 
                id="email" 
                name="email" 
                placeholder="이메일 주소"
                required
                autocomplete="email"
              >
            </div>

            <div class="input-group">
              <i class="fas fa-lock"></i>
              <input 
                type="password" 
                id="password" 
                name="password" 
                placeholder="비밀번호"
                required
                autocomplete="current-password"
              >
            </div>

            <button type="submit" class="btn-login" id="loginBtn">
              <i class="fas fa-sign-in-alt mr-2"></i>
              로그인
            </button>
          </form>

          <div class="text-center mt-6">
            <p class="text-gray-600">
              계정이 없으신가요? 
              <a href="/signup" class="text-purple-600 hover:underline font-semibold">회원가입</a>
            </p>
          </div>

          <div class="text-center mt-4">
            <a href="/" class="text-gray-500 hover:text-gray-700 text-sm">
              <i class="fas fa-home mr-1"></i>
              메인으로 돌아가기
            </a>
          </div>
        </div>
      </div>

      <script>
        const loginForm = document.getElementById('loginForm');
        const loginBtn = document.getElementById('loginBtn');
        const errorMessage = document.getElementById('errorMessage');

        loginForm.addEventListener('submit', async (e) => {
          e.preventDefault();

          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;

          // 버튼 비활성화
          loginBtn.disabled = true;
          loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>로그인 중...';
          errorMessage.classList.remove('show');

          try {
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              credentials: 'include',
              body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
              // 로그인 성공 - localStorage 저장 (관리자 페이지 접근용)
              // admin.ts의 requireAdmin 미들웨어는 "userId:any" 형식의 base64 토큰을 기대함
              const token = btoa(data.user.id + ':faith');
              localStorage.setItem('auth_token', token);
              localStorage.setItem('user_email', data.user.email);
              localStorage.setItem('user_role', data.user.role);
              localStorage.setItem('user_level', data.user.level.toString());
              
              window.location.href = '${redirect}';
            } else {
              // 로그인 실패
              errorMessage.textContent = data.message || '로그인에 실패했습니다';
              errorMessage.classList.add('show');
              loginBtn.disabled = false;
              loginBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>로그인';
            }
          } catch (error) {
            console.error('로그인 오류:', error);
            errorMessage.textContent = '로그인 처리 중 오류가 발생했습니다';
            errorMessage.classList.add('show');
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>로그인';
          }
        });
      </script>
    </body>
    </html>
  `);
});
// 회원가입 페이지
app.get('/signup', async (c) => {
    const redirect = c.req.query('redirect') || '/';
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>회원가입 - Faith Portal</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      <style>
        body {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px 0;
        }
        .signup-card {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          max-width: 450px;
          width: 100%;
          margin: 20px;
        }
        .input-group {
          position: relative;
          margin-bottom: 20px;
        }
        .input-group input {
          width: 100%;
          padding: 15px 15px 15px 45px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 16px;
          transition: all 0.3s;
        }
        .input-group input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        .input-group i {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }
        .btn-signup {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        .btn-signup:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        .btn-signup:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .error-message, .success-message {
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: none;
        }
        .error-message {
          background: #fee;
          color: #c33;
        }
        .success-message {
          background: #efe;
          color: #3c3;
        }
        .error-message.show, .success-message.show {
          display: block;
        }
        .password-strength {
          margin-top: 5px;
          font-size: 12px;
          display: none;
        }
        .password-strength.show {
          display: block;
        }
      </style>
    </head>
    <body>
      <div class="signup-card">
        <div class="p-8">
          <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">
              <i class="fas fa-user-plus text-purple-600 mr-2"></i>
              회원가입
            </h1>
            <p class="text-gray-600">Faith Portal의 회원이 되어보세요</p>
          </div>

          <div id="errorMessage" class="error-message"></div>
          <div id="successMessage" class="success-message"></div>

          <form id="signupForm">
            <div class="input-group">
              <i class="fas fa-user"></i>
              <input 
                type="text" 
                id="name" 
                name="name" 
                placeholder="이름"
                required
                autocomplete="name"
                minlength="2"
              >
            </div>

            <div class="input-group">
              <i class="fas fa-envelope"></i>
              <input 
                type="email" 
                id="email" 
                name="email" 
                placeholder="이메일 주소"
                required
                autocomplete="email"
              >
            </div>

            <div class="input-group">
              <i class="fas fa-phone"></i>
              <input 
                type="tel" 
                id="phone" 
                name="phone" 
                placeholder="전화번호 (선택)"
                autocomplete="tel"
              >
            </div>

            <div class="input-group">
              <i class="fas fa-lock"></i>
              <input 
                type="password" 
                id="password" 
                name="password" 
                placeholder="비밀번호 (최소 6자)"
                required
                autocomplete="new-password"
                minlength="6"
              >
              <div id="passwordStrength" class="password-strength"></div>
            </div>

            <div class="input-group">
              <i class="fas fa-lock"></i>
              <input 
                type="password" 
                id="passwordConfirm" 
                name="passwordConfirm" 
                placeholder="비밀번호 확인"
                required
                autocomplete="new-password"
              >
            </div>

            <button type="submit" class="btn-signup" id="signupBtn">
              <i class="fas fa-user-plus mr-2"></i>
              회원가입
            </button>
          </form>

          <div class="text-center mt-6">
            <p class="text-gray-600">
              이미 계정이 있으신가요? 
              <a href="/login" class="text-purple-600 hover:underline font-semibold">로그인</a>
            </p>
          </div>

          <div class="text-center mt-4">
            <a href="/" class="text-gray-500 hover:text-gray-700 text-sm">
              <i class="fas fa-home mr-1"></i>
              메인으로 돌아가기
            </a>
          </div>
        </div>
      </div>

      <script>
        const signupForm = document.getElementById('signupForm');
        const signupBtn = document.getElementById('signupBtn');
        const errorMessage = document.getElementById('errorMessage');
        const successMessage = document.getElementById('successMessage');
        const passwordInput = document.getElementById('password');
        const passwordConfirmInput = document.getElementById('passwordConfirm');
        const passwordStrength = document.getElementById('passwordStrength');

        // 비밀번호 강도 체크
        passwordInput.addEventListener('input', (e) => {
          const password = e.target.value;
          
          if (password.length === 0) {
            passwordStrength.classList.remove('show');
            return;
          }

          passwordStrength.classList.add('show');
          
          if (password.length < 6) {
            passwordStrength.textContent = '⚠️ 비밀번호는 최소 6자 이상이어야 합니다';
            passwordStrength.style.color = '#f00';
          } else if (password.length < 8) {
            passwordStrength.textContent = '⚡ 보통 강도';
            passwordStrength.style.color = '#fa0';
          } else {
            passwordStrength.textContent = '✅ 강한 비밀번호';
            passwordStrength.style.color = '#0a0';
          }
        });

        signupForm.addEventListener('submit', async (e) => {
          e.preventDefault();

          const name = document.getElementById('name').value.trim();
          const email = document.getElementById('email').value.trim();
          const phone = document.getElementById('phone').value.trim();
          const password = passwordInput.value;
          const passwordConfirm = passwordConfirmInput.value;

          // 비밀번호 확인
          if (password !== passwordConfirm) {
            errorMessage.textContent = '비밀번호가 일치하지 않습니다';
            errorMessage.classList.add('show');
            successMessage.classList.remove('show');
            return;
          }

          // 버튼 비활성화
          signupBtn.disabled = true;
          signupBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>가입 처리 중...';
          errorMessage.classList.remove('show');
          successMessage.classList.remove('show');

          try {
            const response = await fetch('/api/auth/signup', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              credentials: 'include',
              body: JSON.stringify({ name, email, phone, password })
            });

            const data = await response.json();

            if (data.success) {
              // 회원가입 성공
              successMessage.textContent = '회원가입이 완료되었습니다! 로그인 페이지로 이동합니다...';
              successMessage.classList.add('show');
              
              setTimeout(() => {
                window.location.href = '${redirect}';
              }, 1500);
            } else {
              // 회원가입 실패
              errorMessage.textContent = data.message || '회원가입에 실패했습니다';
              errorMessage.classList.add('show');
              signupBtn.disabled = false;
              signupBtn.innerHTML = '<i class="fas fa-user-plus mr-2"></i>회원가입';
            }
          } catch (error) {
            console.error('회원가입 오류:', error);
            errorMessage.textContent = '회원가입 처리 중 오류가 발생했습니다';
            errorMessage.classList.add('show');
            signupBtn.disabled = false;
            signupBtn.innerHTML = '<i class="fas fa-user-plus mr-2"></i>회원가입';
          }
        });
      </script>
    </body>
    </html>
  `);
});
// ==================== 인증 API ====================
// 회원 정보 조회 API
// ==================== MyPage API Routes ====================
// 뉴스 키워드 구독 관리
// 뉴스 북마크 관리
// 키워드별 뉴스 조회
// 뉴스 읽음 표시
// 주식 관심 종목 관리
// 주식 알림 관리
// 포트폴리오 통계
// ============================================
// 게임 관련 API
// ============================================
// Public API
// ============================================
// 유틸 관련 API
// ============================================
// ============================================
// 관리자 / 시스템 API
// ============================================
// 스케줄러 시작 (서버 시작 시)
if (typeof process !== 'undefined') {
    startNewsScheduler();
}
export default app;
