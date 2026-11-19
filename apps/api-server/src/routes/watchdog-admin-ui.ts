import { Hono } from 'hono';
import { checkSession } from '../middleware/auth.js';
import { getAdminNavigation, getBreadcrumb } from './admin-ui.js';

export const watchdogAdminUi = new Hono();

watchdogAdminUi.use('/admin/watchdog', async (c, next) => {
    try {
        const user = await checkSession(c);
        const isAdmin = Boolean(user && (user.role === 'admin' || Number(user.level || 0) >= 6) && user.status === 'active');
        if (!isAdmin) {
            return c.redirect('/login?redirect=' + encodeURIComponent(c.req.path));
        }
    } catch {
        return c.redirect('/login?redirect=' + encodeURIComponent(c.req.path));
    }
    await next();
});

watchdogAdminUi.get('/admin/watchdog', async (c) => {
    return c.html(`
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>와치독 관제 - Faith Portal Admin</title>
    <script>
        (function() {
            var origWarn = console.warn;
            console.warn = function() {
                if (arguments[0] && typeof arguments[0] === 'string' && arguments[0].indexOf('cdn.tailwindcss.com') !== -1) return;
                origWarn.apply(console, arguments);
            };
        })();
    </script>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        .faith-blue { background-color: #1E40AF; }
    </style>
</head>
<body class="bg-gray-100 min-h-screen">
    <header class="faith-blue text-white shadow-lg">
        <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            <div class="flex justify-between items-center">
                <div class="flex items-center space-x-2 sm:space-x-4">
                    <a href="/" class="text-lg sm:text-xl lg:text-2xl font-bold">Faith Portal</a>
                    <span class="text-xs sm:text-sm bg-yellow-500 text-gray-900 px-2 sm:px-3 py-1 rounded-full font-medium">
                        <i class="fas fa-crown mr-1"></i>관리자
                    </span>
                </div>
                <div class="flex items-center space-x-3">
                    <a href="/admin" class="text-xs sm:text-sm hover:text-blue-200 whitespace-nowrap">
                        <i class="fas fa-tachometer-alt mr-1"></i>대시보드
                    </a>
                    <a href="/" class="text-xs sm:text-sm hover:text-blue-200 whitespace-nowrap">
                        <i class="fas fa-home mr-1"></i>메인으로
                    </a>
                </div>
            </div>
        </div>
    </header>

    <nav class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
            ${getAdminNavigation('/admin/watchdog')}
        </div>
    </nav>

    ${getBreadcrumb([
        { label: '홈', href: '/' },
        { label: '관리자', href: '/admin' },
        { label: '와치독 관제' }
    ])}

    <main class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-5 sm:py-7 space-y-6">
        <!-- 상단 종합 상태 배너 -->
        <section id="overall-banner" class="rounded-2xl bg-white border border-gray-200 shadow-sm p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div class="space-y-1.5">
                <div class="flex flex-wrap items-center gap-2.5">
                    <span id="overall-badge" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700">
                        <i class="fas fa-spinner fa-spin"></i> 점검 상태 불러오는 중...
                    </span>
                    <span id="telegram-status-badge" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                        <i class="fab fa-telegram-plane"></i> 텔레그램 확인중
                    </span>
                </div>
                <h1 class="text-xl sm:text-2xl font-black text-gray-900">베라넥스(VeraNex) 기능별 실시간 와치독</h1>
                <p id="schedule-meta" class="text-xs sm:text-sm text-gray-500">5분 주기 자동 점검 · 뉴스 미갱신 2시간 기준 감시</p>
            </div>
            <div class="flex flex-wrap items-center gap-2.5">
                <button id="btn-run-all" onclick="runAllChecks()" class="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer">
                    <i class="fas fa-sync-alt mr-1.5"></i>지금 전체 점검
                </button>
                <button id="btn-tg-test" onclick="sendTelegramTest()" class="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer">
                    <i class="fab fa-telegram-plane mr-1.5"></i>텔레그램 테스트
                </button>
                <button id="btn-auto-refresh" onclick="toggleAutoRefresh()" class="px-3.5 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs sm:text-sm font-bold cursor-pointer">
                    <i class="fas fa-clock mr-1"></i>자동새로고침 ON
                </button>
            </div>
        </section>

        <!-- 텔레그램 미설정 안내 카드 (필요 시 노출) -->
        <section id="telegram-guide-box" class="hidden rounded-2xl bg-sky-50 border border-sky-200 p-4 text-xs sm:text-sm text-sky-900 space-y-1">
            <p class="font-extrabold"><i class="fab fa-telegram-plane mr-1.5 text-sky-600"></i>텔레그램 알림 활성화 방법</p>
            <p class="text-sky-800">서버 <code class="px-1.5 py-0.5 bg-white rounded border border-sky-200">.env</code> 파일에 <code class="px-1.5 py-0.5 bg-white rounded border border-sky-200">TELEGRAM_BOT_TOKEN</code>과 <code class="px-1.5 py-0.5 bg-white rounded border border-sky-200">TELEGRAM_CHAT_ID</code>를 추가하고 <code class="px-1.5 py-0.5 bg-white rounded border border-sky-200">pm2 restart faith-api --update-env</code>를 실행하면 장애·복구 알림이 즉시 전송됩니다.</p>
        </section>

        <!-- 인프라 4종 KPI 요약 카드 -->
        <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-strip"></section>

        <!-- 그룹 필터 탭 -->
        <section class="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 space-y-5">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div class="flex flex-wrap items-center gap-2" id="filter-tabs"></div>
                <span id="filter-count" class="text-xs font-semibold text-gray-500"></span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" id="checks-grid"></div>
        </section>

        <!-- 장애 및 복구 타임라인 -->
        <section class="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 space-y-4">
            <div class="flex items-center justify-between">
                <h2 class="text-base sm:text-lg font-black text-gray-900">
                    <i class="fas fa-history text-blue-600 mr-2"></i>최근 장애 · 복구 타임라인
                </h2>
                <span class="text-xs text-gray-400">상태 전이 시에만 기록됨 (최대 30건)</span>
            </div>
            <div id="incidents-list" class="space-y-2.5"></div>
        </section>
    </main>

    <script>
        var currentData = null;
        var activeFilter = 'all';
        var autoRefreshEnabled = true;
        var autoRefreshTimer = null;

        function esc(str) {
            return String(str == null ? '' : str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }

        function getStatusMeta(status) {
            if (status === 'down') {
                return { badge: 'bg-red-100 text-red-700 border-red-200', border: 'border-red-300 bg-red-50/30', dot: 'bg-red-500', icon: 'fa-times-circle', text: '장애' };
            }
            if (status === 'degraded') {
                return { badge: 'bg-amber-100 text-amber-800 border-amber-200', border: 'border-amber-300 bg-amber-50/30', dot: 'bg-amber-400', icon: 'fa-exclamation-triangle', text: '주의' };
            }
            return { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', border: 'border-gray-200 bg-white', dot: 'bg-emerald-500', icon: 'fa-check-circle', text: '정상' };
        }

        function renderBanner(data) {
            var banner = document.getElementById('overall-banner');
            var badge = document.getElementById('overall-badge');
            var tgBadge = document.getElementById('telegram-status-badge');
            var tgGuide = document.getElementById('telegram-guide-box');
            var meta = document.getElementById('schedule-meta');

            var counts = data.counts || { total: 0, ok: 0, degraded: 0, down: 0 };
            if (data.overallStatus === 'down') {
                banner.className = 'rounded-2xl bg-red-50 border border-red-200 shadow-sm p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4';
                badge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-red-600 text-white';
                badge.innerHTML = '<i class="fas fa-exclamation-circle"></i> 장애 감지 (' + counts.down + '건 장애 · ' + counts.degraded + '건 주의)';
            } else if (data.overallStatus === 'degraded') {
                banner.className = 'rounded-2xl bg-amber-50 border border-amber-200 shadow-sm p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4';
                badge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-white';
                badge.innerHTML = '<i class="fas fa-exclamation-triangle"></i> 일부 주의 (' + counts.ok + '/' + counts.total + ' 정상 · ' + counts.degraded + '건 주의)';
            } else {
                banner.className = 'rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-sm p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4';
                badge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-600 text-white';
                badge.innerHTML = '<i class="fas fa-check-circle"></i> 전체 시스템 정상 (' + counts.ok + '/' + counts.total + ')';
            }

            if (data.telegramConfigured) {
                tgBadge.className = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-700 border border-sky-200';
                tgBadge.innerHTML = '<i class="fab fa-telegram-plane"></i> 텔레그램 알림 연동됨';
                tgGuide.classList.add('hidden');
            } else {
                tgBadge.className = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200';
                tgBadge.innerHTML = '<i class="fab fa-telegram-plane"></i> 텔레그램 미설정 (.env 필요)';
                tgGuide.classList.remove('hidden');
            }

            var sch = data.scheduler || {};
            var nextText = sch.nextRunInSeconds != null ? (' · 다음 자동점검 ' + sch.nextRunInSeconds + '초 후') : '';
            meta.textContent = '마지막 점검: ' + (sch.lastRunAt || '-') + ' (KST) · 5분 주기 · 뉴스 미갱신 ' + (sch.newsDownMinutes || 120) + '분 기준' + nextText;
        }

        function renderKpis(checks) {
            var map = {};
            checks.forEach(function(c) { map[c.key] = c; });
            var keys = ['core_api_db', 'portal_ssr', 'system_resources', 'sqlite_storage'];
            var html = keys.map(function(k) {
                var item = map[k];
                if (!item) return '';
                var st = getStatusMeta(item.status);
                return '<div class="rounded-2xl bg-white border ' + (item.status === 'ok' ? 'border-gray-200' : st.border) + ' shadow-sm p-4">' +
                    '<div class="flex items-center justify-between mb-1.5">' +
                        '<span class="text-xs font-bold text-gray-500">' + esc(item.label) + '</span>' +
                        '<span class="px-2 py-0.5 rounded-full text-[11px] font-extrabold border ' + st.badge + '">' + st.text + '</span>' +
                    '</div>' +
                    '<p class="text-sm font-extrabold text-gray-900 truncate">' + esc(item.summary) + '</p>' +
                    '<p class="text-[11px] text-gray-400 mt-1">응답 ' + item.latencyMs + 'ms · ' + esc(item.lastCheckedKst) + '</p>' +
                '</div>';
            }).join('');
            document.getElementById('kpi-strip').innerHTML = html;
        }

        function renderFiltersAndCards(checks) {
            var issuesCount = checks.filter(function(c) { return c.status !== 'ok'; }).length;
            var tabs = [
                { key: 'all', label: '전체 (' + checks.length + ')' },
                { key: 'issues', label: '장애·주의만 (' + issuesCount + ')' },
                { key: 'platform', label: '플랫폼·인프라' },
                { key: 'content', label: '뉴스·콘텐츠' },
                { key: 'tools', label: '도구·게임' },
                { key: 'finance_media', label: '금융·인증' }
            ];
            document.getElementById('filter-tabs').innerHTML = tabs.map(function(t) {
                var active = activeFilter === t.key;
                var cls = active
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
                return '<button type="button" onclick="setFilter(\'' + t.key + '\')" class="px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ' + cls + '">' + esc(t.label) + '</button>';
            }).join('');

            var filtered = checks.filter(function(c) {
                if (activeFilter === 'all') return true;
                if (activeFilter === 'issues') return c.status !== 'ok';
                return c.group === activeFilter;
            });

            var rank = { down: 0, degraded: 1, ok: 2 };
            filtered.sort(function(a, b) {
                return (rank[a.status] || 2) - (rank[b.status] || 2);
            });

            document.getElementById('filter-count').textContent = '표시 중: ' + filtered.length + '개 항목';

            if (filtered.length === 0) {
                document.getElementById('checks-grid').innerHTML = '<div class="col-span-full py-10 text-center text-sm text-gray-500">해당 조건에 맞는 항목이 없습니다.</div>';
                return;
            }

            document.getElementById('checks-grid').innerHTML = filtered.map(function(item) {
                var st = getStatusMeta(item.status);
                var slots = Array.isArray(item.history) ? item.history : [];
                var barsHtml = '';
                for (var i = 0; i < 24; i++) {
                    var offset = i - (24 - slots.length);
                    if (offset < 0) {
                        barsHtml += '<span class="h-3 flex-1 rounded-xs bg-gray-100" title="기록 없음"></span>';
                    } else {
                        var h = slots[offset];
                        var col = h.s === 'down' ? 'bg-red-500' : (h.s === 'degraded' ? 'bg-amber-400' : 'bg-emerald-500');
                        var tip = (h.s === 'down' ? '장애' : (h.s === 'degraded' ? '주의' : '정상')) + ' · ' + h.ms + 'ms' + (h.e ? ' (' + h.e + ')' : '');
                        barsHtml += '<span class="h-3 flex-1 rounded-xs ' + col + '" title="' + esc(tip) + '"></span>';
                    }
                }

                return '<div class="rounded-2xl border ' + st.border + ' p-4 flex flex-col justify-between gap-3 shadow-2xs">' +
                    '<div class="space-y-2">' +
                        '<div class="flex items-start justify-between gap-2">' +
                            '<div>' +
                                '<h3 class="text-sm font-black text-gray-900">' + esc(item.label) + '</h3>' +
                                '<p class="text-[11px] text-gray-400">' + esc(item.targetUrl) + ' · ' + item.latencyMs + 'ms</p>' +
                            '</div>' +
                            '<span class="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ' + st.badge + '">' +
                                '<i class="fas ' + st.icon + '"></i> ' + st.text +
                            '</span>' +
                        '</div>' +
                        '<p class="text-xs text-gray-700 font-semibold leading-relaxed">' + esc(item.summary) + '</p>' +
                        (item.lastError ? '<p class="text-[11px] text-red-600 font-medium bg-red-50 border border-red-100 rounded-lg px-2.5 py-1">' + esc(item.lastError) + '</p>' : '') +
                    '</div>' +
                    '<div class="space-y-2.5">' +
                        '<div>' +
                            '<div class="flex justify-between text-[10px] text-gray-400 mb-1"><span>최근 24회 점검 이력</span><span>' + esc(item.lastCheckedKst) + '</span></div>' +
                            '<div class="flex items-center gap-0.5">' + barsHtml + '</div>' +
                        '</div>' +
                        '<div class="flex items-center justify-between pt-2 border-t border-gray-100">' +
                            '<button type="button" onclick="runSingleCheck(\'' + esc(item.key) + '\')" class="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer">' +
                                '<i class="fas fa-redo mr-1"></i>재점검' +
                            '</button>' +
                            '<a href="' + esc(item.targetUrl) + '" target="_blank" rel="noopener noreferrer" class="text-xs font-bold text-blue-600 hover:text-blue-800">' +
                                '열기 <i class="fas fa-external-link-alt ml-0.5 text-[10px]"></i>' +
                            '</a>' +
                        '</div>' +
                    '</div>' +
                '</div>';
            }).join('');
        }

        function renderIncidents(incidents) {
            var container = document.getElementById('incidents-list');
            if (!incidents || incidents.length === 0) {
                container.innerHTML = '<div class="py-8 text-center text-sm text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">아직 감지된 장애·복구 이력이 없습니다.</div>';
                return;
            }
            container.innerHTML = incidents.map(function(inc) {
                var isResolved = inc.status === 'resolved';
                var badgeCls = isResolved
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    : (inc.severity === 'down' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-800 border-amber-200');
                var badgeTxt = isResolved ? '복구됨' : (inc.severity === 'down' ? '진행중 장애' : '주의 진행중');
                var ackHtml = inc.acknowledged_at
                    ? '<span class="text-xs font-bold text-emerald-700"><i class="fas fa-check mr-1"></i>확인됨</span>'
                    : '<button type="button" onclick="ackIncident(' + inc.id + ')" class="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 cursor-pointer">확인 완료</button>';

                return '<div class="rounded-xl border border-gray-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">' +
                    '<div class="space-y-1">' +
                        '<div class="flex flex-wrap items-center gap-2">' +
                            '<span class="px-2 py-0.5 rounded-full text-[11px] font-extrabold border ' + badgeCls + '">' + badgeTxt + '</span>' +
                            '<span class="text-xs sm:text-sm font-black text-gray-900">' + esc(inc.label) + '</span>' +
                            '<span class="text-[11px] text-gray-400">' + esc(inc.startedAtKst) + (inc.resolvedAtKst ? ' → ' + esc(inc.resolvedAtKst) : ' ~ 진행중') + '</span>' +
                        '</div>' +
                        '<p class="text-xs text-gray-600">' + esc(inc.message) + '</p>' +
                    '</div>' +
                    '<div class="flex items-center gap-2 shrink-0">' +
                        (inc.notified_channels ? '<span class="text-[11px] text-gray-400">알림: ' + esc(inc.notified_channels) + '</span>' : '') +
                        ackHtml +
                    '</div>' +
                '</div>';
            }).join('');
        }

        function setFilter(key) {
            activeFilter = key;
            if (currentData && currentData.checks) {
                renderFiltersAndCards(currentData.checks);
            }
        }

        async function loadStatus() {
            try {
                var res = await fetch('/api/admin/watchdog/status', { credentials: 'include' });
                if (res.status === 401 || res.status === 403) {
                    location.href = '/login?redirect=' + encodeURIComponent(location.pathname);
                    return;
                }
                var data = await res.json();
                if (!data.success) return;
                currentData = data;
                renderBanner(data);
                renderKpis(data.checks || []);
                renderFiltersAndCards(data.checks || []);
                renderIncidents(data.incidents || []);
            } catch (e) {
                console.error(e);
            }
        }

        async function runAllChecks() {
            var btn = document.getElementById('btn-run-all');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1.5"></i>전체 점검 중...';
            try {
                var res = await fetch('/api/admin/watchdog/run', { method: 'POST', credentials: 'include' });
                var data = await res.json();
                if (data.success) {
                    currentData = data;
                    renderBanner(data);
                    renderKpis(data.checks || []);
                    renderFiltersAndCards(data.checks || []);
                    renderIncidents(data.incidents || []);
                }
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-sync-alt mr-1.5"></i>지금 전체 점검';
            }
        }

        async function runSingleCheck(key) {
            var res = await fetch('/api/admin/watchdog/run/' + encodeURIComponent(key), { method: 'POST', credentials: 'include' });
            var data = await res.json();
            if (data.success) {
                currentData = data;
                renderBanner(data);
                renderKpis(data.checks || []);
                renderFiltersAndCards(data.checks || []);
                renderIncidents(data.incidents || []);
            }
        }

        async function ackIncident(id) {
            var res = await fetch('/api/admin/watchdog/incidents/' + id + '/ack', { method: 'PATCH', credentials: 'include' });
            var data = await res.json();
            if (data.success) {
                await loadStatus();
            }
        }

        async function sendTelegramTest() {
            var btn = document.getElementById('btn-tg-test');
            btn.disabled = true;
            try {
                var res = await fetch('/api/admin/watchdog/telegram/test', { method: 'POST', credentials: 'include' });
                var data = await res.json();
                alert(data.message || (data.success ? '테스트 메시지를 전송했습니다.' : '전송 실패'));
            } finally {
                btn.disabled = false;
            }
        }

        function toggleAutoRefresh() {
            autoRefreshEnabled = !autoRefreshEnabled;
            var btn = document.getElementById('btn-auto-refresh');
            if (autoRefreshEnabled) {
                btn.className = 'px-3.5 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs sm:text-sm font-bold cursor-pointer';
                btn.innerHTML = '<i class="fas fa-clock mr-1"></i>자동새로고침 ON';
            } else {
                btn.className = 'px-3.5 py-2.5 rounded-xl bg-gray-100 text-gray-600 border border-gray-200 text-xs sm:text-sm font-bold cursor-pointer';
                btn.innerHTML = '<i class="fas fa-pause mr-1"></i>자동새로고침 OFF';
            }
        }

        loadStatus();
        autoRefreshTimer = setInterval(function() {
            if (autoRefreshEnabled) loadStatus();
        }, 30000);
    </script>
</body>
</html>
    `);
});
