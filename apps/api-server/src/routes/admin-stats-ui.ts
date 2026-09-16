import { Hono } from 'hono'
import { getAdminNavigation, getBreadcrumb } from './admin-ui.js'
import { checkSession } from '../middleware/auth.js'

export const adminStatsUi = new Hono()

// 서버사이드 관리자 인증 미들웨어
adminStatsUi.use('/admin/stats', async (c, next) => {
    try {
        const user = await checkSession(c);
        if (!user || (user.role !== 'admin' && user.level < 6)) {
            return c.redirect('/login?redirect=' + encodeURIComponent(c.req.path));
        }
    } catch (e) {
        return c.redirect('/login?redirect=' + encodeURIComponent(c.req.path));
    }
    await next();
});

adminStatsUi.get('/admin/stats', async (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>통계 대시보드 - VeraNex 관리자</title>
        <script>
            (function(){const o=console.warn;console.warn=function(...a){if(a[0]&&typeof a[0]==='string'&&a[0].includes('cdn.tailwindcss.com'))return;o.apply(console,a)};})();
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
            .faith-blue { background-color: #1E40AF; }
            .kpi-card { transition: all 0.3s; }
            .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
            .change-up { color: #16a34a; }
            .change-down { color: #dc2626; }
            .period-btn { transition: all 0.2s; }
            .period-btn.active { background: #1E40AF; color: white; }
        </style>
    </head>
    <body class="bg-gray-100">
        <header class="faith-blue text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-4">
                        <a href="/" class="text-xl lg:text-2xl font-bold">VeraNex</a>
                        <span class="text-sm bg-yellow-500 text-gray-900 px-3 py-1 rounded-full font-medium">
                            <i class="fas fa-crown mr-1"></i>관리자
                        </span>
                    </div>
                    <div class="flex items-center space-x-4">
                        <span id="admin-name" class="text-sm"></span>
                        <a href="/" class="text-sm hover:text-blue-200"><i class="fas fa-home mr-1"></i>메인으로</a>
                    </div>
                </div>
            </div>
        </header>

        <nav class="bg-white shadow">
            <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
                ${getAdminNavigation('/admin/stats')}
            </div>
        </nav>
        ${getBreadcrumb([{ label: '홈', href: '/' }, { label: '관리자', href: '/admin' }, { label: '통계 대시보드' }])}

        <main class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
            <!-- 기간 필터 -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 class="text-2xl font-bold text-gray-800">
                    <i class="fas fa-chart-line text-blue-600 mr-2"></i>통계 대시보드
                </h2>
                <div class="flex items-center gap-2 bg-white rounded-lg shadow px-2 py-1">
                    <button onclick="changePeriod(1)" class="period-btn px-3 py-1.5 rounded text-sm font-medium" data-period="1">오늘</button>
                    <button onclick="changePeriod(7)" class="period-btn px-3 py-1.5 rounded text-sm font-medium active" data-period="7">7일</button>
                    <button onclick="changePeriod(30)" class="period-btn px-3 py-1.5 rounded text-sm font-medium" data-period="30">30일</button>
                    <button onclick="changePeriod(90)" class="period-btn px-3 py-1.5 rounded text-sm font-medium" data-period="90">90일</button>
                </div>
            </div>

            <!-- KPI 카드 -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div class="kpi-card bg-white rounded-xl shadow p-5">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm text-gray-500 font-medium">방문자</span>
                        <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                            <i class="fas fa-users text-blue-600"></i>
                        </div>
                    </div>
                    <p id="kpi-visitors" class="text-2xl lg:text-3xl font-bold text-gray-800">-</p>
                    <p id="kpi-visitors-change" class="text-sm mt-1">-</p>
                </div>
                <div class="kpi-card bg-white rounded-xl shadow p-5">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm text-gray-500 font-medium">페이지뷰</span>
                        <div class="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                            <i class="fas fa-eye text-green-600"></i>
                        </div>
                    </div>
                    <p id="kpi-views" class="text-2xl lg:text-3xl font-bold text-gray-800">-</p>
                    <p id="kpi-views-change" class="text-sm mt-1">-</p>
                </div>
                <div class="kpi-card bg-white rounded-xl shadow p-5">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm text-gray-500 font-medium">신규 가입</span>
                        <div class="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                            <i class="fas fa-user-plus text-purple-600"></i>
                        </div>
                    </div>
                    <p id="kpi-signups" class="text-2xl lg:text-3xl font-bold text-gray-800">-</p>
                    <p id="kpi-signups-change" class="text-sm mt-1">-</p>
                </div>
                <div class="kpi-card bg-white rounded-xl shadow p-5">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm text-gray-500 font-medium">평균 체류</span>
                        <div class="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                            <i class="fas fa-clock text-orange-600"></i>
                        </div>
                    </div>
                    <p id="kpi-duration" class="text-2xl lg:text-3xl font-bold text-gray-800">-</p>
                    <p id="kpi-duration-change" class="text-sm mt-1">-</p>
                </div>
            </div>

            <!-- 방문자 추세 차트 -->
            <div class="bg-white rounded-xl shadow p-6 mb-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-chart-area text-blue-600 mr-2"></i>방문자 추세</h3>
                    <button onclick="exportCSV('visitors')" class="text-sm text-gray-500 hover:text-blue-600 transition"><i class="fas fa-download mr-1"></i>CSV</button>
                </div>
                <div style="height:300px"><canvas id="visitorsChart"></canvas></div>
            </div>

            <!-- 1. 사이트 유입 경로 분석 (어디서 들어왔는가) -->
            <div class="bg-white rounded-xl shadow p-6 mb-6">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3 border-b border-gray-100 pb-4">
                    <div>
                        <h3 class="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <span class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">
                                <i class="fas fa-route"></i>
                            </span>
                            사이트 유입 경로 분석 (Inflow Source)
                        </h3>
                        <p class="text-xs text-gray-500 mt-1">방문자가 어디서 사이트로 유입되었는지 검색엔진, SNS, 외부 링크 및 첫 진입 페이지를 정밀 분석합니다.</p>
                    </div>
                    <button onclick="exportCSV('referrers_detail')" class="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200 transition font-medium flex items-center gap-1.5">
                        <i class="fas fa-download"></i> 유입 데이터 CSV
                    </button>
                </div>

                <!-- 채널별 요약 칩 -->
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                    <div class="bg-emerald-50/70 border border-emerald-100 rounded-lg p-3">
                        <div class="text-xs text-emerald-700 font-medium">외부 유입 총합</div>
                        <div id="inflow-external-views" class="text-lg font-bold text-emerald-900 mt-0.5">-</div>
                        <div id="inflow-external-ratio" class="text-xs text-emerald-600">점유율 -%</div>
                    </div>
                    <div class="bg-blue-50/70 border border-blue-100 rounded-lg p-3">
                        <div class="text-xs text-blue-700 font-medium">🔍 검색엔진 (포털)</div>
                        <div id="inflow-search-views" class="text-lg font-bold text-blue-900 mt-0.5">-</div>
                        <div class="text-xs text-blue-600">네이버·구글·다음</div>
                    </div>
                    <div class="bg-pink-50/70 border border-pink-100 rounded-lg p-3">
                        <div class="text-xs text-pink-700 font-medium">💬 소셜 SNS</div>
                        <div id="inflow-social-views" class="text-lg font-bold text-pink-900 mt-0.5">-</div>
                        <div class="text-xs text-pink-600">스레드·인스타·페북</div>
                    </div>
                    <div class="bg-amber-50/70 border border-amber-100 rounded-lg p-3">
                        <div class="text-xs text-amber-700 font-medium">🌐 커뮤니티/블로그</div>
                        <div id="inflow-community-views" class="text-lg font-bold text-amber-900 mt-0.5">-</div>
                        <div class="text-xs text-amber-600">블로그·카페·외부웹</div>
                    </div>
                    <div class="bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <div class="text-xs text-slate-700 font-medium">🚪 직접 접속</div>
                        <div id="inflow-direct-views" class="text-lg font-bold text-slate-900 mt-0.5">-</div>
                        <div class="text-xs text-slate-500">URL입력·북마크</div>
                    </div>
                    <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div class="text-xs text-gray-600 font-medium">🔄 사이트 내부 이동</div>
                        <div id="inflow-internal-views" class="text-lg font-bold text-gray-800 mt-0.5">-</div>
                        <div class="text-xs text-gray-400">포털 내 페이지 이동</div>
                    </div>
                </div>

                <!-- 차트 및 출처 TOP 순위 -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 items-center">
                    <div class="lg:col-span-4 flex flex-col items-center justify-center p-2">
                        <h4 class="text-xs font-bold text-gray-600 mb-2 w-full text-center">유입 채널 비중</h4>
                        <div style="height:210px; width: 100%; max-width: 260px;" class="relative">
                            <canvas id="referrersChart"></canvas>
                        </div>
                    </div>
                    <div class="lg:col-span-8">
                        <h4 class="text-xs font-bold text-gray-600 mb-3 flex items-center justify-between">
                            <span>주요 유입 출처 TOP 순위</span>
                            <span class="text-gray-400 font-normal">유입수 (비율)</span>
                        </h4>
                        <div id="top-sources-list" class="space-y-2.5">
                            <div class="text-center py-6 text-gray-400 text-sm">유입 데이터 로딩 중...</div>
                        </div>
                    </div>
                </div>

                <!-- 상세 유입 경로 테이블 및 필터 -->
                <div class="border-t border-gray-100 pt-5">
                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                        <div class="flex flex-wrap items-center gap-1.5">
                            <span class="text-xs font-bold text-gray-600 mr-1">필터:</span>
                            <button onclick="filterReferrers('external')" id="ref-filter-external" class="ref-filter-btn px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-600 text-white transition shadow-sm">외부 유입만 (추천)</button>
                            <button onclick="filterReferrers('search')" id="ref-filter-search" class="ref-filter-btn px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition">검색엔진</button>
                            <button onclick="filterReferrers('social')" id="ref-filter-social" class="ref-filter-btn px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition">소셜 SNS</button>
                            <button onclick="filterReferrers('community')" id="ref-filter-community" class="ref-filter-btn px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition">커뮤니티/블로그</button>
                            <button onclick="filterReferrers('direct')" id="ref-filter-direct" class="ref-filter-btn px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition">직접 접속</button>
                            <button onclick="filterReferrers('all')" id="ref-filter-all" class="ref-filter-btn px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition">전체 (내부 포함)</button>
                        </div>
                        <span id="ref-filter-count" class="text-xs text-gray-500"></span>
                    </div>

                    <div class="overflow-x-auto rounded-lg border border-gray-100 max-h-96 overflow-y-auto">
                        <table class="w-full text-left text-xs text-gray-600">
                            <thead class="bg-gray-50 text-gray-700 uppercase font-semibold sticky top-0 border-b border-gray-200">
                                <tr>
                                    <th class="px-3.5 py-2.5">유입 출처</th>
                                    <th class="px-3.5 py-2.5">상세 유입 URL</th>
                                    <th class="px-3.5 py-2.5">첫 진입 랜딩 페이지</th>
                                    <th class="px-3.5 py-2.5 text-right">유입수 (Views)</th>
                                    <th class="px-3.5 py-2.5 text-right">순방문자</th>
                                    <th class="px-3.5 py-2.5 text-right">최근 유입 일시</th>
                                </tr>
                            </thead>
                            <tbody id="referrers-table-body" class="divide-y divide-gray-100">
                                <tr>
                                    <td colspan="6" class="text-center py-8 text-gray-400">데이터를 불러오는 중입니다...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- 2. 상세 콘텐츠 소비 분석 (어떤 콘텐츠를 많이 보았는가) -->
            <div class="bg-white rounded-xl shadow p-6 mb-6">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3 border-b border-gray-100 pb-4">
                    <div>
                        <h3 class="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <span class="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center text-sm">
                                <i class="fas fa-fire"></i>
                            </span>
                            상세 콘텐츠 소비 분석 (가장 많이 본 콘텐츠)
                        </h3>
                        <p class="text-xs text-gray-500 mt-1">뉴스 기사, 스마트 도구, 웹게임, 전문 가이드/칼럼별 실제 열람 및 이용 랭킹을 상세히 확인합니다.</p>
                    </div>
                    <button onclick="exportCSV('content_detail')" class="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg border border-rose-200 transition font-medium flex items-center gap-1.5">
                        <i class="fas fa-download"></i> 콘텐츠 통계 CSV
                    </button>
                </div>

                <!-- 콘텐츠 유형 탭 -->
                <div class="flex flex-wrap items-center gap-2 mb-5">
                    <button onclick="changeContentTab('all')" id="ctab-all" class="ctab-btn px-3.5 py-2 rounded-lg text-sm font-semibold transition bg-rose-600 text-white shadow-sm flex items-center gap-1.5">
                        <span>🔥</span> 종합 인기 TOP
                    </button>
                    <button onclick="changeContentTab('news')" id="ctab-news" class="ctab-btn px-3.5 py-2 rounded-lg text-sm font-semibold transition bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-1.5">
                        <span>📰</span> 뉴스 기사 TOP
                    </button>
                    <button onclick="changeContentTab('miniapps')" id="ctab-miniapps" class="ctab-btn px-3.5 py-2 rounded-lg text-sm font-semibold transition bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-1.5">
                        <span>⚡</span> 스마트 도구 TOP
                    </button>
                    <button onclick="changeContentTab('games')" id="ctab-games" class="ctab-btn px-3.5 py-2 rounded-lg text-sm font-semibold transition bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-1.5">
                        <span>🎮</span> 웹게임 TOP
                    </button>
                    <button onclick="changeContentTab('guides')" id="ctab-guides" class="ctab-btn px-3.5 py-2 rounded-lg text-sm font-semibold transition bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-1.5">
                        <span>📚</span> 가이드 & 칼럼 TOP
                    </button>
                </div>

                <!-- 상세 콘텐츠 테이블 -->
                <div class="overflow-x-auto rounded-lg border border-gray-100">
                    <table class="w-full text-left text-xs text-gray-600">
                        <thead class="bg-gray-50 text-gray-700 uppercase font-semibold border-b border-gray-200">
                            <tr>
                                <th class="px-3.5 py-3 w-16 text-center">순위</th>
                                <th class="px-3.5 py-3">콘텐츠 제목 및 링크</th>
                                <th class="px-3.5 py-3 w-28">유형 / 분류</th>
                                <th class="px-3.5 py-3 w-40">소비 지표 (점유율)</th>
                                <th class="px-3.5 py-3 w-24 text-right">이용자수</th>
                                <th class="px-3.5 py-3">부가 정보 (언론사/점수/체류)</th>
                                <th class="px-3.5 py-3 w-20 text-center">바로가기</th>
                            </tr>
                        </thead>
                        <tbody id="content-table-body" class="divide-y divide-gray-100">
                            <tr>
                                <td colspan="7" class="text-center py-10 text-gray-400">콘텐츠 데이터를 불러오는 중입니다...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- 3. 보조 분석 (인기 페이지 TOP 10 및 기기 분석) -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <!-- 인기 페이지 (경로 기준) -->
                <div class="bg-white rounded-xl shadow p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-link text-blue-600 mr-2"></i>페이지 URL 순위 TOP 10</h3>
                        <button onclick="exportCSV('pages')" class="text-xs text-gray-500 hover:text-blue-600 transition"><i class="fas fa-download mr-1"></i>CSV</button>
                    </div>
                    <div id="top-pages" class="space-y-2">
                        <div class="text-center py-8 text-gray-400">로딩 중...</div>
                    </div>
                </div>

                <!-- 기기 분석 -->
                <div class="bg-white rounded-xl shadow p-6">
                    <h3 class="text-lg font-bold text-gray-800 mb-4"><i class="fas fa-mobile-alt text-indigo-600 mr-2"></i>기기 환경 분석</h3>
                    <div style="height:250px"><canvas id="devicesChart"></canvas></div>
                </div>
            </div>

            <!-- 4. 데이터 관리 -->
            <div class="bg-white rounded-xl shadow p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-database text-gray-600 mr-2"></i>데이터 관리</h3>
                        <p class="text-sm text-gray-500 mt-1">7일 이전 원본 데이터를 일별 집계 테이블로 압축 보관하고 원본을 정리합니다.</p>
                    </div>
                    <button onclick="aggregateData()" id="aggregate-btn" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                        <i class="fas fa-compress-arrows-alt mr-1"></i>집계 실행
                    </button>
                </div>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            let currentPeriod = 7;
            let currentContentTab = 'all';
            let currentReferrerFilter = 'external'; // 기본값: 외부 유입만
            let cachedReferrersData = null;

            let visitorsChartInstance = null;
            let referrersChartInstance = null;
            let devicesChartInstance = null;

            const authToken = localStorage.getItem('auth_token');
            if (!authToken || authToken === 'true') {
                fetch('/api/auth/me', { credentials: 'include' })
                    .then(res => res.json())
                    .then(data => {
                        if (data.loggedIn) {
                            localStorage.setItem('auth_token', btoa(data.user.id + ':faith'));
                            localStorage.setItem('user_email', data.user.email);
                            localStorage.setItem('user_role', data.user.role || 'user');
                            localStorage.setItem('user_level', String(data.user.level || 0));
                        }
                    }).catch(() => {});
            }
            
            document.getElementById('admin-name').textContent = localStorage.getItem('user_email') || '';
            const headers = { 'Authorization': 'Bearer ' + authToken };

            function changePeriod(days) {
                currentPeriod = days;
                document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                document.querySelector('[data-period="'+days+'"]').classList.add('active');
                loadAll();
            }

            function changeText(id, val, change) {
                const el = document.getElementById(id);
                if (el) el.textContent = typeof val === 'number' ? val.toLocaleString() : val;
                const changeEl = document.getElementById(id + '-change');
                if (changeEl) {
                    if (change !== undefined && change !== 0) {
                        const arrow = change > 0 ? '▲' : '▼';
                        changeEl.innerHTML = '<span class="'+(change > 0 ? 'change-up' : 'change-down')+'">'+arrow+' '+Math.abs(change)+'%</span> 전기간 대비';
                    } else {
                        changeEl.textContent = '데이터 수집 중';
                    }
                }
            }

            function formatDuration(ms) {
                if (!ms || ms === 0) return '0초';
                const sec = Math.floor(ms / 1000);
                if (sec < 60) return sec + '초';
                const min = Math.floor(sec / 60);
                const remainSec = sec % 60;
                return min + '분 ' + remainSec + '초';
            }

            async function loadOverview() {
                try {
                    const r = await axios.get('/api/admin/analytics/overview?period=' + currentPeriod, { headers });
                    const d = r.data;
                    changeText('kpi-visitors', d.period.visitors, d.period.visitorsChange);
                    changeText('kpi-views', d.period.views, d.period.viewsChange);
                    changeText('kpi-signups', d.signups.count, d.signups.change);
                    document.getElementById('kpi-duration').textContent = formatDuration(d.avgDuration.ms);
                    const durEl = document.getElementById('kpi-duration-change');
                    if (d.avgDuration.change !== 0) {
                        const a = d.avgDuration.change > 0 ? '▲' : '▼';
                        durEl.innerHTML = '<span class="'+(d.avgDuration.change > 0 ? 'change-up' : 'change-down')+'">'+a+' '+Math.abs(d.avgDuration.change)+'%</span>';
                    } else { durEl.textContent = '데이터 수집 중'; }
                } catch(e) { console.error('Overview error:', e); }
            }

            async function loadVisitors() {
                try {
                    const r = await axios.get('/api/admin/analytics/visitors?days=' + currentPeriod, { headers });
                    const trend = r.data.trend || [];
                    if (visitorsChartInstance) visitorsChartInstance.destroy();
                    const ctx = document.getElementById('visitorsChart').getContext('2d');
                    visitorsChartInstance = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: trend.map(d => d.date),
                            datasets: [{
                                label: '방문자', data: trend.map(d => d.visitors),
                                borderColor: '#1E40AF', backgroundColor: 'rgba(30,64,175,0.08)',
                                tension: 0.4, fill: true, yAxisID: 'y'
                            },{
                                label: '페이지뷰', data: trend.map(d => d.views),
                                borderColor: '#16a34a', backgroundColor: 'rgba(22,163,74,0.08)',
                                tension: 0.4, fill: true, yAxisID: 'y1', borderDash: [5,5]
                            }]
                        },
                        options: {
                            responsive: true, maintainAspectRatio: false,
                            interaction: { mode: 'index', intersect: false },
                            scales: {
                                y: { beginAtZero: true, position: 'left', title: { display: true, text: '방문자' } },
                                y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: '페이지뷰' } }
                            }
                        }
                    });
                } catch(e) { console.error('Visitors error:', e); }
            }

            async function loadPages() {
                try {
                    const r = await axios.get('/api/admin/analytics/pages?days=' + currentPeriod, { headers });
                    const pages = (r.data.pages || []).slice(0, 10);
                    const container = document.getElementById('top-pages');
                    if (pages.length === 0) { container.innerHTML = '<div class="text-center py-8 text-gray-400">데이터 없음</div>'; return; }
                    const total = pages.reduce((s,p) => s + p.views, 0);
                    container.innerHTML = pages.map((p, i) => {
                        const pct = total > 0 ? Math.round(p.views / total * 100) : 0;
                        const pathName = p.path === '/' ? '홈 (/)' : p.path;
                        return '<div class="flex items-center gap-3">' +
                            '<span class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">'+(i+1)+'</span>' +
                            '<div class="flex-1 min-w-0"><div class="flex justify-between items-center mb-1"><span class="text-sm font-medium text-gray-800 truncate font-mono text-xs">'+pathName+'</span>' +
                            '<span class="text-xs text-gray-500 flex-shrink-0 ml-2">'+p.views.toLocaleString()+'회 ('+pct+'%)</span></div>' +
                            '<div class="w-full bg-gray-100 rounded-full h-1.5"><div class="bg-blue-500 h-1.5 rounded-full" style="width:'+pct+'%"></div></div></div></div>';
                    }).join('');
                } catch(e) { console.error('Pages error:', e); }
            }

            // ==================== 유입 경로 로딩 및 테이블 렌더링 ====================
            async function loadReferrers() {
                try {
                    const r = await axios.get('/api/admin/analytics/referrers?days=' + currentPeriod, { headers });
                    cachedReferrersData = r.data;
                    const d = r.data;
                    const summary = d.summary || {};

                    // 상단 칩 데이터 반영
                    document.getElementById('inflow-external-views').textContent = (summary.externalViews || 0).toLocaleString() + '회';
                    document.getElementById('inflow-external-ratio').textContent = '점유율 ' + (summary.externalRatio || 0) + '%';
                    document.getElementById('inflow-search-views').textContent = (summary.searchViews || 0).toLocaleString() + '회';
                    document.getElementById('inflow-social-views').textContent = (summary.socialViews || 0).toLocaleString() + '회';
                    document.getElementById('inflow-community-views').textContent = ((summary.communityViews || 0) + (summary.campaignViews || 0)).toLocaleString() + '회';
                    document.getElementById('inflow-direct-views').textContent = (summary.directViews || 0).toLocaleString() + '회';
                    document.getElementById('inflow-internal-views').textContent = (summary.internalViews || 0).toLocaleString() + '회';

                    // 도넛 차트 (채널 비중)
                    if (referrersChartInstance) referrersChartInstance.destroy();
                    const channels = d.channels || [];
                    const channelColors = {
                        search: '#2563EB',
                        social: '#EC4899',
                        community: '#F59E0B',
                        campaign: '#8B5CF6',
                        external: '#10B981',
                        direct: '#64748B',
                        internal: '#94A3B8'
                    };
                    const chartData = channels.filter(c => c.views > 0);
                    const ctx = document.getElementById('referrersChart').getContext('2d');
                    referrersChartInstance = new Chart(ctx, {
                        type: 'doughnut',
                        data: {
                            labels: chartData.map(c => c.name),
                            datasets: [{
                                data: chartData.map(c => c.views),
                                backgroundColor: chartData.map(c => channelColors[c.channel] || '#94A3B8'),
                                borderWidth: 2,
                                borderColor: '#fff'
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: { boxWidth: 10, padding: 8, font: { size: 10 } }
                                }
                            },
                            cutout: '65%'
                        }
                    });

                    // 주요 출처 TOP 순위 바 렌더링
                    const topSources = (d.topSources || []).slice(0, 5);
                    const sourceListEl = document.getElementById('top-sources-list');
                    if (topSources.length === 0) {
                        sourceListEl.innerHTML = '<div class="text-center py-6 text-gray-400 text-sm">유입 데이터 없음</div>';
                    } else {
                        sourceListEl.innerHTML = topSources.map((s, idx) => {
                            const badgeColor = s.channel === 'search' ? 'bg-blue-100 text-blue-700' :
                                              (s.channel === 'social' ? 'bg-pink-100 text-pink-700' :
                                              (s.channel === 'direct' ? 'bg-slate-100 text-slate-700' : 'bg-emerald-100 text-emerald-700'));
                            return '<div class="flex items-center gap-3">' +
                                '<span class="w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center flex-shrink-0">'+(idx+1)+'</span>' +
                                '<div class="flex-1 min-w-0">' +
                                    '<div class="flex justify-between items-center mb-1">' +
                                        '<div class="flex items-center gap-1.5 truncate">' +
                                            '<span class="text-xs px-1.5 py-0.5 rounded font-semibold '+badgeColor+'">'+s.channelName+'</span>' +
                                            '<span class="text-xs font-bold text-gray-800 truncate">'+s.source+'</span>' +
                                        '</div>' +
                                        '<span class="text-xs text-gray-500 font-medium flex-shrink-0">'+s.views.toLocaleString()+'회 ('+s.percentage+'%)</span>' +
                                    '</div>' +
                                    '<div class="w-full bg-gray-100 rounded-full h-1.5">' +
                                        '<div class="bg-emerald-500 h-1.5 rounded-full" style="width: '+Math.min(100, Math.max(4, s.percentage))+'%"></div>' +
                                    '</div>' +
                                '</div>' +
                            '</div>';
                        }).join('');
                    }

                    // 상세 테이블 렌더링
                    renderReferrersTable();
                } catch(e) {
                    console.error('Referrers error:', e);
                }
            }

            function filterReferrers(filterType) {
                currentReferrerFilter = filterType;
                document.querySelectorAll('.ref-filter-btn').forEach(btn => {
                    btn.classList.remove('bg-emerald-600', 'text-white', 'shadow-sm');
                    btn.classList.add('bg-gray-100', 'text-gray-700');
                });
                const activeBtn = document.getElementById('ref-filter-' + filterType);
                if (activeBtn) {
                    activeBtn.classList.remove('bg-gray-100', 'text-gray-700');
                    activeBtn.classList.add('bg-emerald-600', 'text-white', 'shadow-sm');
                }
                renderReferrersTable();
            }

            function renderReferrersTable() {
                if (!cachedReferrersData) return;
                const details = cachedReferrersData.details || [];
                let filtered = details;

                if (currentReferrerFilter === 'external') {
                    filtered = details.filter(d => d.isExternal);
                } else if (currentReferrerFilter === 'search') {
                    filtered = details.filter(d => d.channel === 'search');
                } else if (currentReferrerFilter === 'social') {
                    filtered = details.filter(d => d.channel === 'social');
                } else if (currentReferrerFilter === 'community') {
                    filtered = details.filter(d => d.channel === 'community' || d.channel === 'campaign');
                } else if (currentReferrerFilter === 'direct') {
                    filtered = details.filter(d => d.channel === 'direct');
                }

                document.getElementById('ref-filter-count').textContent = '총 ' + filtered.length + '개 유입 경로';
                const tbody = document.getElementById('referrers-table-body');

                if (filtered.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-400">해당 필터의 유입 기록이 없습니다.</td></tr>';
                    return;
                }

                tbody.innerHTML = filtered.slice(0, 50).map(row => {
                    const badgeClass = row.channel === 'search' ? 'bg-blue-100 text-blue-700' :
                                      (row.channel === 'social' ? 'bg-pink-100 text-pink-700' :
                                      (row.channel === 'direct' ? 'bg-slate-100 text-slate-700' :
                                      (row.channel === 'internal' ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-700')));
                    
                    const isUrl = row.referrerUrl && row.referrerUrl.startsWith('http');
                    const refDisplay = isUrl
                        ? '<a href="'+row.referrerUrl+'" target="_blank" rel="noreferrer" class="text-blue-600 hover:underline truncate block max-w-xs sm:max-w-md font-mono" title="'+row.referrerUrl+'">'+row.referrerUrl+'</a>'
                        : '<span class="text-gray-500 font-mono">'+(row.referrerUrl || '직접 접속')+'</span>';

                    const dateStr = row.lastSeen ? (row.lastSeen.replace('T', ' ').slice(5, 16)) : '-';

                    return '<tr class="hover:bg-gray-50/80 transition-colors">' +
                        '<td class="px-3.5 py-2.5 whitespace-nowrap">' +
                            '<span class="px-1.5 py-0.5 rounded text-xs font-semibold mr-1.5 '+badgeClass+'">'+row.channelName+'</span>' +
                            '<strong class="text-gray-800">'+row.source+'</strong>' +
                        '</td>' +
                        '<td class="px-3.5 py-2.5 max-w-xs sm:max-w-md">'+refDisplay+'</td>' +
                        '<td class="px-3.5 py-2.5 font-mono text-gray-700 whitespace-nowrap">' +
                            '<span class="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-800">'+row.landingPath+'</span>' +
                        '</td>' +
                        '<td class="px-3.5 py-2.5 text-right font-bold text-gray-800 whitespace-nowrap">'+row.views.toLocaleString()+'회</td>' +
                        '<td class="px-3.5 py-2.5 text-right text-gray-600 whitespace-nowrap">'+row.visitors.toLocaleString()+'명</td>' +
                        '<td class="px-3.5 py-2.5 text-right text-gray-400 whitespace-nowrap">'+dateStr+'</td>' +
                    '</tr>';
                }).join('');
            }

            // ==================== 상세 콘텐츠 소비 통계 로딩 ====================
            function changeContentTab(tab) {
                currentContentTab = tab;
                document.querySelectorAll('.ctab-btn').forEach(btn => {
                    btn.classList.remove('bg-rose-600', 'text-white', 'shadow-sm');
                    btn.classList.add('bg-gray-100', 'text-gray-700');
                });
                const activeBtn = document.getElementById('ctab-' + tab);
                if (activeBtn) {
                    activeBtn.classList.remove('bg-gray-100', 'text-gray-700');
                    activeBtn.classList.add('bg-rose-600', 'text-white', 'shadow-sm');
                }
                loadContentDetail();
            }

            async function loadContentDetail() {
                const tbody = document.getElementById('content-table-body');
                tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-400">콘텐츠 분석 데이터를 집계 중입니다...</td></tr>';

                try {
                    const r = await axios.get('/api/admin/analytics/content-detail?days=' + currentPeriod + '&type=' + currentContentTab, { headers });
                    const items = r.data.items || [];

                    if (items.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-10 text-gray-400">조회된 콘텐츠 데이터가 없습니다.</td></tr>';
                        return;
                    }

                    tbody.innerHTML = items.map((item, idx) => {
                        const rank = idx + 1;
                        let rankBadge = '';
                        if (rank === 1) rankBadge = '<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black text-xs shadow-sm">1</span>';
                        else if (rank === 2) rankBadge = '<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-bold text-xs shadow-sm">2</span>';
                        else if (rank === 3) rankBadge = '<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs shadow-sm">3</span>';
                        else rankBadge = '<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 font-semibold text-xs">'+rank+'</span>';

                        const typeColor = item.type === 'news' ? 'bg-blue-100 text-blue-700' :
                                         (item.type === 'miniapp' ? 'bg-teal-100 text-teal-700' :
                                         (item.type === 'game' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'));

                        const linkUrl = item.url || '#';

                        return '<tr class="hover:bg-gray-50/80 transition-colors">' +
                            '<td class="px-3.5 py-3 text-center">'+rankBadge+'</td>' +
                            '<td class="px-3.5 py-3">' +
                                '<a href="'+linkUrl+'" target="_blank" class="font-bold text-gray-900 hover:text-blue-600 text-sm line-clamp-1 transition" title="'+item.title+'">' +
                                    item.title +
                                '</a>' +
                                '<span class="text-xs text-gray-400 font-mono truncate block mt-0.5">'+item.url+'</span>' +
                            '</td>' +
                            '<td class="px-3.5 py-3 whitespace-nowrap">' +
                                '<span class="px-2 py-0.5 rounded text-xs font-semibold '+typeColor+'">'+item.typeLabel+'</span>' +
                                '<span class="text-xs text-gray-500 block mt-0.5">'+item.category+'</span>' +
                            '</td>' +
                            '<td class="px-3.5 py-3">' +
                                '<div class="flex justify-between items-center mb-1">' +
                                    '<span class="font-bold text-gray-800">'+item.views.toLocaleString()+' '+item.metricName+'</span>' +
                                    '<span class="text-xs text-gray-500">'+item.share+'%</span>' +
                                '</div>' +
                                '<div class="w-full bg-gray-100 rounded-full h-1.5">' +
                                    '<div class="bg-rose-500 h-1.5 rounded-full" style="width: '+Math.max(4, item.share)+'%"></div>' +
                                '</div>' +
                            '</td>' +
                            '<td class="px-3.5 py-3 text-right font-medium text-gray-700 whitespace-nowrap">' +
                                item.visitors.toLocaleString() + '명' +
                            '</td>' +
                            '<td class="px-3.5 py-3 text-gray-500 text-xs">' +
                                (item.extra || '-') +
                            '</td>' +
                            '<td class="px-3.5 py-3 text-center whitespace-nowrap">' +
                                '<a href="'+linkUrl+'" target="_blank" class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition" title="새 탭에서 열기">' +
                                    '<i class="fas fa-external-link-alt text-xs"></i>' +
                                '</a>' +
                            '</td>' +
                        '</tr>';
                    }).join('');
                } catch(e) {
                    console.error('Content detail error:', e);
                    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-rose-500">데이터를 불러오지 못했습니다.</td></tr>';
                }
            }

            async function loadDevices() {
                try {
                    const r = await axios.get('/api/admin/analytics/devices?days=' + currentPeriod, { headers });
                    const devs = r.data.devices || [];
                    if (devicesChartInstance) devicesChartInstance.destroy();
                    const colors = { '모바일': '#3b82f6', 'PC': '#10b981', '태블릿': '#f59e0b', '알 수 없음': '#9ca3af' };
                    const ctx = document.getElementById('devicesChart').getContext('2d');
                    devicesChartInstance = new Chart(ctx, {
                        type: 'doughnut',
                        data: {
                            labels: devs.map(d => d.device),
                            datasets: [{ data: devs.map(d => d.views), backgroundColor: devs.map(d => colors[d.device] || '#6b7280'), borderWidth: 2, borderColor: '#fff' }]
                        },
                        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 12, padding: 12 } } } }
                    });
                } catch(e) { console.error('Devices error:', e); }
            }

            function exportCSV(type) {
                window.open('/api/admin/analytics/export?type='+type+'&days='+currentPeriod+'&token='+authToken, '_blank');
            }

            async function aggregateData() {
                if (!confirm('7일 이전 원본 데이터를 집계 후 삭제합니다. 진행하시겠습니까?')) return;
                const btn = document.getElementById('aggregate-btn');
                btn.disabled = true; btn.textContent = '처리 중...';
                try {
                    const r = await axios.post('/api/admin/analytics/aggregate', {}, { headers });
                    alert(r.data.message || '집계 완료');
                    loadAll();
                } catch(e) { alert('집계 실패: ' + (e.response?.data?.message || e.message)); }
                btn.disabled = false; btn.innerHTML = '<i class="fas fa-compress-arrows-alt mr-1"></i>집계 실행';
            }

            function loadAll() {
                loadOverview();
                loadVisitors();
                loadPages();
                loadReferrers();
                loadContentDetail();
                loadDevices();
            }

            loadAll();
        </script>
    </body>
    </html>
  `)
})
