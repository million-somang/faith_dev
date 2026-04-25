import { Hono } from 'hono'
import { getAdminNavigation, getBreadcrumb } from './admin-ui.js'

export const adminStatsUi = new Hono()

adminStatsUi.get('/admin/stats', async (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>통계 대시보드 - Faith Portal</title>
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
                        <a href="/" class="text-xl lg:text-2xl font-bold">Faith Portal</a>
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

            <!-- 2열 레이아웃 -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <!-- 인기 페이지 -->
                <div class="bg-white rounded-xl shadow p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-fire text-red-500 mr-2"></i>인기 페이지 TOP 10</h3>
                        <button onclick="exportCSV('pages')" class="text-sm text-gray-500 hover:text-blue-600 transition"><i class="fas fa-download mr-1"></i>CSV</button>
                    </div>
                    <div id="top-pages" class="space-y-2">
                        <div class="text-center py-8 text-gray-400">로딩 중...</div>
                    </div>
                </div>

                <!-- 유입 경로 -->
                <div class="bg-white rounded-xl shadow p-6">
                    <h3 class="text-lg font-bold text-gray-800 mb-4"><i class="fas fa-globe text-green-600 mr-2"></i>유입 경로</h3>
                    <div style="height:250px"><canvas id="referrersChart"></canvas></div>
                </div>
            </div>

            <!-- 2열 레이아웃 2 -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <!-- 기기 분석 -->
                <div class="bg-white rounded-xl shadow p-6">
                    <h3 class="text-lg font-bold text-gray-800 mb-4"><i class="fas fa-mobile-alt text-indigo-600 mr-2"></i>기기 분석</h3>
                    <div style="height:250px"><canvas id="devicesChart"></canvas></div>
                </div>

                <!-- 콘텐츠 성과 -->
                <div class="bg-white rounded-xl shadow p-6">
                    <h3 class="text-lg font-bold text-gray-800 mb-4"><i class="fas fa-layer-group text-teal-600 mr-2"></i>콘텐츠 성과</h3>
                    <div id="content-stats" class="space-y-4">
                        <div class="text-center py-8 text-gray-400">로딩 중...</div>
                    </div>
                </div>
            </div>

            <!-- 데이터 관리 -->
            <div class="bg-white rounded-xl shadow p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-database text-gray-600 mr-2"></i>데이터 관리</h3>
                        <p class="text-sm text-gray-500 mt-1">7일 이전 원본 데이터를 집계 후 삭제합니다</p>
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
            let visitorsChartInstance = null;
            let referrersChartInstance = null;
            let devicesChartInstance = null;

            const authToken = localStorage.getItem('auth_token');
            const userRole = localStorage.getItem('user_role') || 'user';
            const userLevel = parseInt(localStorage.getItem('user_level') || '0');

            if (!authToken || authToken === 'true' || (userRole !== 'admin' && userLevel < 6)) {
                fetch('/api/auth/me', { credentials: 'include' })
                    .then(r => r.json())
                    .then(d => {
                        if (d.loggedIn && (d.user.role === 'admin' || d.user.level >= 6)) {
                            localStorage.setItem('auth_token', btoa(d.user.id + ':faith'));
                            localStorage.setItem('user_role', d.user.role);
                            localStorage.setItem('user_level', d.user.level);
                            location.reload();
                        } else { alert('관리자 권한이 필요합니다.'); location.href = '/login'; }
                    }).catch(() => { alert('관리자 권한이 필요합니다.'); location.href = '/login'; });
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
                document.getElementById(id).textContent = typeof val === 'number' ? val.toLocaleString() : val;
                const el = document.getElementById(id + '-change');
                if (change !== undefined && change !== 0) {
                    const arrow = change > 0 ? '▲' : '▼';
                    el.innerHTML = '<span class="'+(change > 0 ? 'change-up' : 'change-down')+'">'+arrow+' '+Math.abs(change)+'%</span> 전기간 대비';
                } else {
                    el.textContent = '데이터 수집 중';
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
                        const pathName = p.path === '/' ? '홈' : p.path;
                        return '<div class="flex items-center gap-3">' +
                            '<span class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">'+(i+1)+'</span>' +
                            '<div class="flex-1 min-w-0"><div class="flex justify-between items-center mb-1"><span class="text-sm font-medium text-gray-800 truncate">'+pathName+'</span>' +
                            '<span class="text-xs text-gray-500 flex-shrink-0 ml-2">'+p.views.toLocaleString()+'회 ('+pct+'%)</span></div>' +
                            '<div class="w-full bg-gray-100 rounded-full h-1.5"><div class="bg-blue-500 h-1.5 rounded-full" style="width:'+pct+'%"></div></div></div></div>';
                    }).join('');
                } catch(e) { console.error('Pages error:', e); }
            }

            async function loadReferrers() {
                try {
                    const r = await axios.get('/api/admin/analytics/referrers?days=' + currentPeriod, { headers });
                    const refs = r.data.referrers || [];
                    if (referrersChartInstance) referrersChartInstance.destroy();
                    const colors = ['#1E40AF','#16a34a','#dc2626','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#f97316','#6b7280','#14b8a6'];
                    const ctx = document.getElementById('referrersChart').getContext('2d');
                    referrersChartInstance = new Chart(ctx, {
                        type: 'doughnut',
                        data: {
                            labels: refs.map(r => r.source),
                            datasets: [{ data: refs.map(r => r.views), backgroundColor: colors.slice(0, refs.length), borderWidth: 2, borderColor: '#fff' }]
                        },
                        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 12, padding: 12 } } } }
                    });
                } catch(e) { console.error('Referrers error:', e); }
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

            async function loadContent() {
                try {
                    const r = await axios.get('/api/admin/analytics/content?days=' + currentPeriod, { headers });
                    const d = r.data;
                    const container = document.getElementById('content-stats');
                    let html = '';
                    // 뉴스
                    html += '<div class="bg-blue-50 rounded-lg p-4"><h4 class="font-bold text-blue-800 text-sm mb-2"><i class="fas fa-newspaper mr-1"></i>뉴스</h4>';
                    html += '<div class="grid grid-cols-3 gap-2 text-center">';
                    html += '<div><p class="text-lg font-bold text-blue-700">'+d.news.reads.toLocaleString()+'</p><p class="text-xs text-blue-500">읽기</p></div>';
                    html += '<div><p class="text-lg font-bold text-blue-700">'+d.news.votes.toLocaleString()+'</p><p class="text-xs text-blue-500">투표</p></div>';
                    html += '<div><p class="text-lg font-bold text-blue-700">'+d.news.bookmarks.toLocaleString()+'</p><p class="text-xs text-blue-500">북마크</p></div>';
                    html += '</div></div>';
                    // 게임
                    html += '<div class="bg-purple-50 rounded-lg p-4"><h4 class="font-bold text-purple-800 text-sm mb-2"><i class="fas fa-gamepad mr-1"></i>게임 '+d.games.plays.toLocaleString()+'회</h4>';
                    if (d.games.topGames && d.games.topGames.length > 0) {
                        html += '<div class="space-y-1">';
                        d.games.topGames.forEach(g => { html += '<div class="flex justify-between text-sm"><span class="text-purple-700">'+g.game_type+'</span><span class="text-purple-500">'+g.plays+'회</span></div>'; });
                        html += '</div>';
                    } else { html += '<p class="text-xs text-purple-400">데이터 없음</p>'; }
                    html += '</div>';
                    // 미니앱
                    html += '<div class="bg-teal-50 rounded-lg p-4"><h4 class="font-bold text-teal-800 text-sm mb-2"><i class="fas fa-th-large mr-1"></i>미니앱 '+d.miniapps.launches.toLocaleString()+'회</h4>';
                    if (d.miniapps.topMiniapps && d.miniapps.topMiniapps.length > 0) {
                        html += '<div class="space-y-1">';
                        d.miniapps.topMiniapps.forEach(m => { html += '<div class="flex justify-between text-sm"><span class="text-teal-700">'+m.name+'</span><span class="text-teal-500">'+m.launches+'회</span></div>'; });
                        html += '</div>';
                    } else { html += '<p class="text-xs text-teal-400">데이터 없음</p>'; }
                    html += '</div>';
                    container.innerHTML = html;
                } catch(e) { console.error('Content error:', e); }
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
                loadDevices();
                loadContent();
            }

            loadAll();
        </script>
    </body>
    </html>
  `)
})
