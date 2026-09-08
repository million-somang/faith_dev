import { Hono } from 'hono';
import { checkSession } from '../middleware/auth.js';
import { getAdminNavigation, getBreadcrumb } from './admin-ui.js';
import { getDB } from '../db/adapter.js';

export const marketingAdminUi = new Hono();

marketingAdminUi.use('/admin/marketing', async (c, next) => {
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

marketingAdminUi.get('/admin/marketing', async (c) => {
    const DB = getDB(c);
    const appsResult = await DB.prepare("SELECT slug, name, category, description, app_url FROM mini_apps WHERE status = 'active' ORDER BY sort_order ASC").all();
    const apps = appsResult.results || [];
    const threadsTokenSet = Boolean(process.env.THREADS_ACCESS_TOKEN?.trim());

    return c.html(`
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SNS 마케팅 자동화 - Faith Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-gray-50 min-h-screen font-sans text-gray-800">
    <header class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
            <div class="flex items-center justify-between py-3">
                <a href="/admin" class="font-black text-lg text-gray-900 flex items-center">
                    <span class="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white mr-2 shadow-sm">
                        <i class="fas fa-bullhorn text-sm"></i>
                    </span>
                    Faith Portal <span class="text-blue-600 ml-1">Admin</span>
                </a>
                <div class="flex items-center space-x-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${threadsTokenSet ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}">
                        <i class="fas fa-circle text-[8px] mr-1.5 ${threadsTokenSet ? 'text-green-500 animate-pulse' : 'text-amber-500'}"></i>
                        ${threadsTokenSet ? 'Meta API 연동됨' : '시뮬레이션(Mock) 모드 가동중'}
                    </span>
                    <a href="/" target="_blank" class="text-xs text-gray-500 hover:text-blue-600 flex items-center">
                        <i class="fas fa-external-link-alt mr-1"></i>사이트 바로가기
                    </a>
                </div>
            </div>
            ${getAdminNavigation('/admin/marketing')}
        </div>
    </header>
    ${getBreadcrumb([{ label: '관리자', href: '/admin' }, { label: 'SNS 마케팅 자동화' }])}
    <main class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 class="text-2xl font-black text-gray-900 tracking-tight flex items-center">
                    <i class="fas fa-paper-plane text-blue-600 mr-2.5"></i>
                    SNS 자동/반자동 마케팅 파이프라인
                </h1>
                <p class="text-sm text-gray-500 mt-1">
                    스레드(Threads) & 인스타그램(Instagram)에 최적화된 AI 바이럴 카피 및 1080x1080 카드뉴스를 원클릭 즉시/예약 발행합니다.
                </p>
            </div>
            <div class="flex items-center space-x-2">
                <button onclick="openAutoPilotModal()" class="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-lg border border-indigo-200 transition-all flex items-center shadow-sm">
                    <i class="fas fa-robot mr-1.5"></i> 오토파일럿 설정
                </button>
                <button onclick="loadPosts()" class="px-3.5 py-2 bg-white hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg border border-gray-300 transition-all flex items-center shadow-sm">
                    <i class="fas fa-sync-alt mr-1.5"></i> 새로고침
                </button>
            </div>
        </div>

        <!-- 1. Stats Counter Cards -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
            <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div class="text-xs font-semibold text-gray-500 flex items-center justify-between">
                    <span>전체 포스트</span>
                    <i class="fas fa-layer-group text-gray-400"></i>
                </div>
                <div class="text-2xl font-black text-gray-900 mt-2" id="stat-total">-</div>
            </div>
            <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div class="text-xs font-semibold text-amber-600 flex items-center justify-between">
                    <span>승인 대기 (초안)</span>
                    <i class="fas fa-pen text-amber-400"></i>
                </div>
                <div class="text-2xl font-black text-amber-600 mt-2" id="stat-draft">-</div>
            </div>
            <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div class="text-xs font-semibold text-blue-600 flex items-center justify-between">
                    <span>예약 대기 (큐)</span>
                    <i class="fas fa-clock text-blue-400"></i>
                </div>
                <div class="text-2xl font-black text-blue-600 mt-2" id="stat-scheduled">-</div>
            </div>
            <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div class="text-xs font-semibold text-green-600 flex items-center justify-between">
                    <span>금일 발행 완료</span>
                    <i class="fas fa-check-circle text-green-400"></i>
                </div>
                <div class="text-2xl font-black text-green-600 mt-2" id="stat-today">-</div>
            </div>
            <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div class="text-xs font-semibold text-red-600 flex items-center justify-between">
                    <span>발행 실패</span>
                    <i class="fas fa-exclamation-triangle text-red-400"></i>
                </div>
                <div class="text-2xl font-black text-red-600 mt-2" id="stat-failed">-</div>
            </div>
        </div>
        <!-- 2. Main Creator Studio -->
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div class="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <span class="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs">
                        <i class="fas fa-magic"></i>
                    </span>
                    <h2 class="font-bold text-gray-900 text-base">원클릭 AI 마케팅 에셋 생성기 (Gemini Powered)</h2>
                </div>
                <span class="text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full font-semibold border border-blue-100">
                    스레드 & 인스타그램 최적화
                </span>
            </div>

            <div class="p-5 space-y-5">
                <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div class="md:col-span-5">
                        <label class="block text-xs font-bold text-gray-700 mb-1.5">1. 홍보할 미니앱 / 유틸리티 도구 선택</label>
                        <select id="select-app" class="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                            <option value="">-- 미니앱을 선택하세요 --</option>
                            ${apps.map((a: any) => `
                                <option value="${a.slug}" data-name="${a.name}" data-url="${a.app_url}" data-desc="${a.description || ''}" data-cat="${a.category || ''}">
                                    [${a.category || '유틸'}] ${a.name} (${a.app_url})
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="md:col-span-4">
                        <label class="block text-xs font-bold text-gray-700 mb-1.5">2. 타겟 SNS 채널</label>
                        <div class="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg text-xs font-semibold text-center">
                            <label class="cursor-pointer">
                                <input type="radio" name="target-platform" value="THREADS" checked class="peer sr-only">
                                <div class="py-1.5 rounded-md peer-checked:bg-white peer-checked:text-black peer-checked:shadow-sm text-gray-600 transition-all flex items-center justify-center">
                                    <i class="fa-brands fa-threads mr-1"></i> Threads
                                </div>
                            </label>
                            <label class="cursor-pointer">
                                <input type="radio" name="target-platform" value="INSTAGRAM" class="peer sr-only">
                                <div class="py-1.5 rounded-md peer-checked:bg-white peer-checked:text-pink-600 peer-checked:shadow-sm text-gray-600 transition-all flex items-center justify-center">
                                    <i class="fab fa-instagram mr-1"></i> Insta
                                </div>
                            </label>
                            <label class="cursor-pointer">
                                <input type="radio" name="target-platform" value="ALL" class="peer sr-only">
                                <div class="py-1.5 rounded-md peer-checked:bg-white peer-checked:text-blue-600 peer-checked:shadow-sm text-gray-600 transition-all flex items-center justify-center">
                                    <i class="fas fa-share-nodes mr-1"></i> 동시발행
                                </div>
                            </label>
                        </div>
                    </div>

                    <div class="md:col-span-3">
                        <button id="btn-generate" onclick="generateAiContent()" class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center">
                            <i class="fas fa-sparkles mr-2" id="icon-gen"></i>
                            <span id="text-gen">AI 에셋 자동 생성</span>
                        </button>
                    </div>
                </div>

                <div id="workspace-panel" class="hidden pt-4 border-t border-gray-100">
                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div class="lg:col-span-5 flex flex-col items-center">
                            <!-- Preview Header & Slide Tabs -->
                            <div class="w-full flex items-center justify-between mb-2">
                                <span class="text-xs font-bold text-gray-800 flex items-center">
                                    <i class="fas fa-camera-retro text-indigo-600 mr-1.5"></i> 비주얼 카드뉴스 (1080x1080)
                                </span>
                                <div class="flex items-center space-x-1" id="slide-tabs">
                                    <button onclick="switchSlide(0)" id="tab-slide-0" class="px-2.5 py-1 text-[11px] font-bold rounded-md bg-indigo-600 text-white shadow-sm transition-all">
                                        1. 커버
                                    </button>
                                    <button onclick="switchSlide(1)" id="tab-slide-1" class="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all">
                                        2. 기능상세
                                    </button>
                                    <button onclick="switchSlide(2)" id="tab-slide-2" class="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all">
                                        3. 바로가기
                                    </button>
                                </div>
                            </div>

                            <!-- Clean Neumorphism Preview Box -->
                            <div id="card-preview-container" class="w-full aspect-square rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-100/60 flex items-center justify-center p-2 relative">
                                <div class="text-center text-gray-400 text-xs">
                                    <i class="fas fa-image text-3xl mb-2 text-gray-300"></i><br>
                                    생성된 카드뉴스가 여기에 표시됩니다
                                </div>
                            </div>

                            <!-- Controls under Preview -->
                            <div class="w-full mt-3 flex items-center justify-between text-xs">
                                <button id="btn-recapture" onclick="recaptureScreenshot()" class="text-indigo-600 hover:text-indigo-800 flex items-center font-bold px-2.5 py-1.5 bg-indigo-50 rounded-lg hover:bg-indigo-100 border border-indigo-100 transition-all">
                                    <i class="fas fa-sync-alt mr-1.5" id="icon-recapture"></i>
                                    <span id="text-recapture">실화면 재캡처</span>
                                </button>
                                <div class="flex items-center space-x-2">
                                    <button onclick="downloadCurrentCard()" class="text-gray-700 hover:text-indigo-600 flex items-center font-semibold px-2.5 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all">
                                        <i class="fas fa-download mr-1"></i> 현재 슬라이드
                                    </button>
                                    <button onclick="downloadAllCards()" class="text-indigo-700 hover:text-indigo-900 flex items-center font-bold px-2.5 py-1.5 bg-indigo-50 rounded-lg hover:bg-indigo-100 border border-indigo-200 transition-all">
                                        <i class="fas fa-images mr-1"></i> 전 슬라이드
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="lg:col-span-7 flex flex-col justify-between space-y-4">
                            <div>
                                <label class="block text-xs font-bold text-gray-700 mb-1">카드뉴스 헤드라인</label>
                                <input type="text" id="edit-headline" class="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500">
                            </div>

                            <div>
                                <div class="flex items-center justify-between mb-1">
                                    <label class="text-xs font-bold text-gray-900 flex items-center">
                                        <i class="fa-brands fa-threads mr-1.5 text-black"></i> 스레드 본문 
                                        <span class="ml-2 px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold">
                                            <i class="fas fa-shield-alt mr-0.5"></i> 아웃링크 배제(알고리즘 최적화)
                                        </span>
                                    </label>
                                    <span class="text-[11px] text-gray-400" id="threads-char-count">0자</span>
                                </div>
                                <textarea id="edit-threads-body" rows="6" class="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 leading-relaxed custom-scrollbar"></textarea>
                            </div>

                            <div>
                                <label class="block text-xs font-bold text-indigo-700 mb-1 flex items-center">
                                    <i class="fas fa-reply mr-1.5"></i> 스레드 첫 번째 답글 (첫 댓글 아웃링크 자동 발행)
                                </label>
                                <textarea id="edit-threads-first-comment" rows="2" class="w-full bg-indigo-50/50 border border-indigo-200 rounded-lg p-2.5 text-xs text-gray-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 leading-relaxed"></textarea>
                            </div>

                            <div>
                                <label class="block text-xs font-bold text-pink-700 mb-1 flex items-center">
                                    <i class="fab fa-instagram mr-1.5"></i> 인스타그램 캡션 & 해시태그
                                </label>
                                <textarea id="edit-ig-caption" rows="3" class="w-full bg-pink-50/40 border border-pink-200 rounded-lg p-2.5 text-xs text-gray-800 focus:bg-white focus:ring-2 focus:ring-pink-500 leading-relaxed"></textarea>
                            </div>

                            <div class="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                                <div class="flex items-center space-x-1.5">
                                    <button onclick="schedulePreset('08:00')" class="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors">
                                        🌅 출근(08:00)
                                    </button>
                                    <button onclick="schedulePreset('12:30')" class="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors">
                                        🍱 점심(12:30)
                                    </button>
                                    <button onclick="schedulePreset('18:30')" class="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors">
                                        🌆 퇴근(18:30)
                                    </button>
                                    <button onclick="saveDraft()" class="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-lg border border-amber-200 transition-colors">
                                        <i class="fas fa-save mr-1"></i> 초안 저장
                                    </button>
                                </div>

                                <button onclick="publishImmediately()" class="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-black text-sm rounded-lg shadow-md hover:shadow-lg transition-all flex items-center">
                                    <i class="fas fa-rocket mr-1.5"></i> 지금 1-Click 즉시 발행
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- 3. Marketing Queue Table -->
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div class="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-center space-x-2">
                    <span class="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center text-xs">
                        <i class="fas fa-list-check"></i>
                    </span>
                    <h2 class="font-bold text-gray-900 text-base">마케팅 큐(Queue) 및 발행 내역</h2>
                </div>

                <div class="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg text-xs font-semibold text-gray-600">
                    <button onclick="setFilter('ALL')" id="filter-all" class="px-3 py-1 rounded-md bg-white text-gray-900 shadow-sm">전체</button>
                    <button onclick="setFilter('DRAFT')" id="filter-draft" class="px-3 py-1 rounded-md hover:text-gray-900">승인대기</button>
                    <button onclick="setFilter('SCHEDULED')" id="filter-scheduled" class="px-3 py-1 rounded-md hover:text-gray-900">예약중</button>
                    <button onclick="setFilter('PUBLISHED')" id="filter-published" class="px-3 py-1 rounded-md hover:text-gray-900">발행완료</button>
                    <button onclick="setFilter('FAILED')" id="filter-failed" class="px-3 py-1 rounded-md hover:text-gray-900">실패</button>
                </div>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm text-gray-600">
                    <thead class="bg-gray-50/75 text-xs uppercase font-bold text-gray-500 border-b border-gray-100">
                        <tr>
                            <th class="px-4 py-3">플랫폼</th>
                            <th class="px-4 py-3">대상 서비스</th>
                            <th class="px-4 py-3">헤드라인 & 본문 미리보기</th>
                            <th class="px-4 py-3">상태</th>
                            <th class="px-4 py-3">예약 / 발행일시</th>
                            <th class="px-4 py-3 text-right">관리 / 액션</th>
                        </tr>
                    </thead>
                    <tbody id="posts-table-body" class="divide-y divide-gray-100">
                        <tr>
                            <td colspan="6" class="px-4 py-8 text-center text-gray-400">
                                <i class="fas fa-spinner fa-spin text-lg mr-2"></i> 로딩 중...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </main>

    <!-- AutoPilot Modal -->
    <div id="autopilot-modal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 class="text-lg font-black text-gray-900 flex items-center">
                    <i class="fas fa-robot text-indigo-600 mr-2"></i> 완전 자동화 (오토파일럿) 설정
                </h3>
                <button onclick="closeAutoPilotModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <p class="text-xs text-gray-500 leading-relaxed">
                오토파일럿을 활성화하면 지정된 매일 최적 시간대에 등록된 미니앱을 무작위로 선정하여 
                <strong>Gemini AI 카피 + 1080x1080 카드뉴스 자동 합성 후 무중단 스케줄링</strong>을 진행합니다.
            </p>

            <div class="space-y-3 pt-2">
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div>
                        <div class="text-sm font-bold text-gray-900">오토파일럿 가동</div>
                        <div class="text-xs text-gray-500">자동 발행 봇 상시 실행 여부</div>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="autopilot-toggle" class="sr-only peer">
                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>

                <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">하루 발행 슬롯 시간대 (콤마 구분)</label>
                    <input type="text" id="autopilot-slots" value="08:30, 12:30, 18:30" class="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono">
                    <span class="text-[11px] text-gray-400 mt-1 block">* 24시간 형식 (예: 08:30, 12:30, 18:30)</span>
                </div>
            </div>

            <div class="pt-3 flex justify-end space-x-2">
                <button onclick="closeAutoPilotModal()" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg">
                    취소
                </button>
                <button onclick="saveAutoPilotSettings()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm">
                    설정 저장
                </button>
            </div>
        </div>
    </div>
    <script>
        let currentSvg = '';
        let currentCardSet = [];
        let currentSlideIndex = 0;
        let currentScreenshotUri = '';
        let currentApp = null;
        let currentFilter = 'ALL';

        function getAuthHeaders() {
            const token = localStorage.getItem('auth_token') || '';
            const headers = { 'Content-Type': 'application/json' };
            if (token && token !== 'true') {
                headers['Authorization'] = 'Bearer ' + token;
            }
            return headers;
        }

        async function authFetch(url, options = {}) {
            const headers = { ...getAuthHeaders(), ...(options.headers || {}) };
            return fetch(url, {
                credentials: 'same-origin',
                ...options,
                headers
            });
        }

        document.addEventListener('DOMContentLoaded', () => {
            loadStats();
            loadPosts();

            document.getElementById('edit-threads-body')?.addEventListener('input', (e) => {
                document.getElementById('threads-char-count').innerText = e.target.value.length + '자';
            });
        });

        async function loadStats() {
            try {
                const res = await authFetch('/api/admin/marketing/stats');
                const data = await res.json();
                if (data.success) {
                    document.getElementById('stat-total').innerText = data.stats.total;
                    document.getElementById('stat-draft').innerText = data.stats.draft;
                    document.getElementById('stat-scheduled').innerText = data.stats.scheduled;
                    document.getElementById('stat-today').innerText = data.stats.todayPublished;
                    document.getElementById('stat-failed').innerText = data.stats.failed;
                }
            } catch (e) {
                console.error('Stats error:', e);
            }
        }

        async function generateAiContent() {
            const select = document.getElementById('select-app');
            const slug = select.value;
            if (!slug) {
                alert('홍보할 미니앱을 먼저 선택해주세요.');
                select.focus();
                return;
            }

            const btn = document.getElementById('btn-generate');
            const icon = document.getElementById('icon-gen');
            const text = document.getElementById('text-gen');

            btn.disabled = true;
            icon.className = 'fas fa-spinner fa-spin mr-2';
            text.innerText = 'AI 카피 & 실화면 캡처 중...';

            try {
                const res = await authFetch('/api/admin/marketing/generate', {
                    method: 'POST',
                    body: JSON.stringify({ serviceSlug: slug })
                });
                const result = await res.json();

                if (result.success) {
                    const data = result.data;
                    currentApp = data.app;
                    currentCardSet = data.cardSet || [data.cardSvg];
                    currentScreenshotUri = data.screenshotUri || '';
                    currentSvg = currentCardSet[0];

                    switchSlide(0);

                    document.getElementById('edit-headline').value = data.content.headline;
                    document.getElementById('edit-threads-body').value = data.content.threadsBody;
                    document.getElementById('edit-threads-first-comment').value = data.content.threadsFirstComment;
                    document.getElementById('edit-ig-caption').value = data.content.instagramCaption + '\\n\\n' + data.content.instagramHashtags.join(' ');
                    document.getElementById('threads-char-count').innerText = data.content.threadsBody.length + '자';

                    document.getElementById('workspace-panel').classList.remove('hidden');
                    document.getElementById('workspace-panel').scrollIntoView({ behavior: 'smooth' });
                } else {
                    alert('생성 실패: ' + (result.message || '알 수 없는 오류'));
                }
            } catch (err) {
                alert('서버 통신 오류가 발생했습니다.');
            } finally {
                btn.disabled = false;
                icon.className = 'fas fa-sparkles mr-2';
                text.innerText = 'AI 에셋 자동 생성';
            }
        }

        function switchSlide(idx) {
            currentSlideIndex = idx;
            [0, 1, 2].forEach(i => {
                const tab = document.getElementById('tab-slide-' + i);
                if (!tab) return;
                if (i === idx) {
                    tab.className = 'px-2.5 py-1 text-[11px] font-bold rounded-md bg-indigo-600 text-white shadow-sm transition-all';
                } else {
                    tab.className = 'px-2.5 py-1 text-[11px] font-semibold rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all';
                }
            });

            if (currentCardSet && currentCardSet[idx]) {
                currentSvg = currentCardSet[idx];
                document.getElementById('card-preview-container').innerHTML = currentSvg;
            }
        }

        async function recaptureScreenshot() {
            if (!currentApp) {
                alert('미니앱을 먼저 선택하고 생성해주세요.');
                return;
            }

            const btn = document.getElementById('btn-recapture');
            const icon = document.getElementById('icon-recapture');
            const text = document.getElementById('text-recapture');

            btn.disabled = true;
            icon.className = 'fas fa-spinner fa-spin mr-1.5';
            text.innerText = '캡처 중...';

            try {
                const res = await authFetch('/api/admin/marketing/screenshot/capture', {
                    method: 'POST',
                    body: JSON.stringify({ slug: currentApp.slug, force: true })
                });
                const data = await res.json();
                if (data.success && data.screenshotUri) {
                    currentScreenshotUri = data.screenshotUri;

                    // 슬라이드 1, 2, 3 재합성 요청
                    const headline = document.getElementById('edit-headline').value;
                    const reqSlides = [1, 2, 3].map(slideIdx => 
                        authFetch('/api/admin/marketing/card-preview', {
                            method: 'POST',
                            body: JSON.stringify({
                                title: headline,
                                subtitle: '로그인 없이 브라우저에서 즉시 실행',
                                tag: currentApp.category || '무료 도구',
                                slug: currentApp.slug,
                                screenshotUri: currentScreenshotUri,
                                slideIndex: slideIdx
                            })
                        }).then(r => r.json())
                    );

                    const results = await Promise.all(reqSlides);
                    currentCardSet = results.map((r, i) => r.svg || currentCardSet[i]);
                    switchSlide(currentSlideIndex);
                    alert('실화면 재캡처 및 카드뉴스가 성공적으로 갱신되었습니다!');
                } else {
                    alert('재캡처 실패: ' + (data.message || '오류 발생'));
                }
            } catch (e) {
                alert('재캡처 요청 중 오류가 발생했습니다.');
            } finally {
                btn.disabled = false;
                icon.className = 'fas fa-sync-alt mr-1.5';
                text.innerText = '실화면 재캡처';
            }
        }

        function downloadCurrentCard() {
            if (!currentSvg) return;
            downloadSvgFile(currentSvg, (currentApp ? currentApp.slug : 'card') + '_slide_' + (currentSlideIndex + 1) + '.svg');
        }

        function downloadAllCards() {
            if (!currentCardSet || currentCardSet.length === 0) {
                if (currentSvg) downloadCurrentCard();
                return;
            }
            currentCardSet.forEach((svg, idx) => {
                setTimeout(() => {
                    downloadSvgFile(svg, (currentApp ? currentApp.slug : 'card') + '_slide_' + (idx + 1) + '.svg');
                }, idx * 300);
            });
        }

        function downloadSvgFile(svgContent, filename) {
            const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        function getSelectedPlatform() {
            const checked = document.querySelector('input[name="target-platform"]:checked');
            return checked ? checked.value : 'THREADS';
        }

        async function saveDraft() {
            await submitPost('DRAFT', null, false);
        }

        async function publishImmediately() {
            if (!confirm('현재 작성된 카피와 에셋으로 즉시 발행하시겠습니까?')) return;
            await submitPost('PUBLISHED', null, true);
        }

        async function schedulePreset(timeStr) {
            const now = new Date();
            const [hh, mm] = timeStr.split(':').map(Number);
            const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0);

            if (target <= now) {
                target.setDate(target.getDate() + 1);
            }

            const iso = target.toISOString();
            if (!confirm(target.toLocaleString() + ' 시각으로 예약 발행하시겠습니까?')) return;

            await submitPost('SCHEDULED', iso, false);
        }
        async function submitPost(status, scheduledAt, publishImmediately) {
            if (!currentApp) {
                alert('미니앱을 먼저 생성해주세요.');
                return;
            }

            const platform = getSelectedPlatform();
            const headline = document.getElementById('edit-headline').value;
            const bodyText = (platform === 'INSTAGRAM') 
                ? document.getElementById('edit-ig-caption').value 
                : document.getElementById('edit-threads-body').value;
            const firstComment = document.getElementById('edit-threads-first-comment').value;

            try {
                const res = await authFetch('/api/admin/marketing/posts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        targetServiceSlug: currentApp.slug,
                        targetServiceName: currentApp.name,
                        targetServiceUrl: currentApp.app_url,
                        platform,
                        headline,
                        bodyText,
                        firstComment,
                        status,
                        scheduledAt,
                        publishImmediately
                    })
                });

                const result = await res.json();
                if (result.success) {
                    alert(publishImmediately ? '발행 처리가 완료되었습니다!' : '큐에 정상 등록되었습니다.');
                    loadStats();
                    loadPosts();
                } else {
                    alert('등록 실패: ' + result.message);
                }
            } catch (e) {
                alert('요청 중 오류가 발생했습니다.');
            }
        }

        function setFilter(status) {
            currentFilter = status;
            ['all', 'draft', 'scheduled', 'published', 'failed'].forEach(id => {
                const btn = document.getElementById('filter-' + id);
                if (id.toUpperCase() === status) {
                    btn.className = 'px-3 py-1 rounded-md bg-white text-gray-900 shadow-sm font-bold';
                } else {
                    btn.className = 'px-3 py-1 rounded-md hover:text-gray-900';
                }
            });
            loadPosts();
        }

        async function loadPosts() {
            const tbody = document.getElementById('posts-table-body');
            try {
                const url = '/api/admin/marketing/posts?status=' + currentFilter;
                const res = await authFetch(url);
                const data = await res.json();

                if (!data.success || !data.posts || data.posts.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-gray-400">등록된 마케팅 포스트가 없습니다.</td></tr>';
                    return;
                }

                tbody.innerHTML = data.posts.map(p => {
                    let badgeClass = 'bg-gray-100 text-gray-700';
                    let statusText = '초안';
                    if (p.status === 'SCHEDULED') { badgeClass = 'bg-blue-100 text-blue-800'; statusText = '예약됨'; }
                    else if (p.status === 'PUBLISHING') { badgeClass = 'bg-yellow-100 text-yellow-800'; statusText = '발행중'; }
                    else if (p.status === 'PUBLISHED') { badgeClass = 'bg-green-100 text-green-800'; statusText = '발행완료'; }
                    else if (p.status === 'FAILED') { badgeClass = 'bg-red-100 text-red-800'; statusText = '실패'; }

                    const platformIcon = p.platform === 'THREADS' ? 'fa-brands fa-threads text-black' : (p.platform === 'INSTAGRAM' ? 'fab fa-instagram text-pink-600' : 'fas fa-share-nodes text-blue-600');
                    const timeDisplay = p.published_at || p.scheduled_at || p.created_at;

                    return (
                        '<tr class="hover:bg-gray-50/50 transition-colors">' +
                            '<td class="px-4 py-3 whitespace-nowrap">' +
                                '<span class="inline-flex items-center text-xs font-bold">' +
                                    '<i class="' + platformIcon + ' mr-1.5 text-sm"></i> ' + p.platform +
                                '</span>' +
                            '</td>' +
                            '<td class="px-4 py-3 whitespace-nowrap">' +
                                '<div class="font-bold text-gray-900 text-xs">' + escapeHtml(p.target_service_name) + '</div>' +
                                '<div class="text-[11px] text-gray-400">' + escapeHtml(p.target_service_slug) + '</div>' +
                            '</td>' +
                            '<td class="px-4 py-3">' +
                                '<div class="font-bold text-gray-800 text-xs truncate max-w-xs sm:max-w-md">' + escapeHtml(p.headline || '제목 없음') + '</div>' +
                                '<div class="text-xs text-gray-500 truncate max-w-xs sm:max-w-md mt-0.5">' + escapeHtml(p.body_text) + '</div>' +
                                (p.error_message ? '<div class="text-[11px] text-red-600 mt-1"><i class="fas fa-exclamation-circle mr-1"></i>' + escapeHtml(p.error_message) + '</div>' : '') +
                            '</td>' +
                            '<td class="px-4 py-3 whitespace-nowrap">' +
                                '<span class="px-2 py-0.5 rounded-full text-[11px] font-bold ' + badgeClass + '">' +
                                    statusText +
                                '</span>' +
                            '</td>' +
                            '<td class="px-4 py-3 whitespace-nowrap text-xs text-gray-500">' +
                                (timeDisplay ? new Date(timeDisplay).toLocaleString('ko-KR') : '-') +
                            '</td>' +
                            '<td class="px-4 py-3 whitespace-nowrap text-right text-xs space-x-1">' +
                                (p.status !== 'PUBLISHED' ? '<button data-id="' + p.id + '" onclick="publishNowPost(this.dataset.id)" class="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded font-semibold transition-colors" title="즉시 발행"><i class="fas fa-paper-plane mr-1"></i>즉시발행</button>' : '') +
                                (p.status === 'FAILED' ? '<button data-id="' + p.id + '" onclick="retryPost(this.dataset.id)" class="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded font-semibold transition-colors" title="재시도"><i class="fas fa-rotate mr-1"></i>재시도</button>' : '') +
                                '<button data-id="' + p.id + '" onclick="deletePost(this.dataset.id)" class="px-2 py-1 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 rounded transition-colors" title="삭제"><i class="fas fa-trash-alt"></i></button>' +
                            '</td>' +
                        '</tr>'
                    );
                }).join('');
            } catch (e) {
                tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-4 text-center text-red-500">목록 조회 오류</td></tr>';
            }
        }

        async function publishNowPost(id) {
            if (!confirm('이 포스트를 지금 즉시 발행하시겠습니까?')) return;
            try {
                const res = await authFetch('/api/admin/marketing/posts/' + id + '/publish-now', { method: 'POST' });
                const data = await res.json();
                if (data.success) {
                    alert('발행되었습니다! (' + (data.isMock ? 'Mock 시뮬레이션 모드' : 'Meta API 연동') + ')');
                    loadStats();
                    loadPosts();
                } else {
                    alert('발행 실패: ' + data.message);
                }
            } catch (e) {
                alert('오류 발생');
            }
        }

        async function retryPost(id) {
            try {
                const res = await authFetch('/api/admin/marketing/posts/' + id + '/retry', { method: 'POST' });
                const data = await res.json();
                if (data.success) {
                    alert('재발행되었습니다.');
                    loadStats();
                    loadPosts();
                } else {
                    alert('재발행 실패: ' + data.message);
                }
            } catch (e) {
                alert('오류 발생');
            }
        }

        async function deletePost(id) {
            if (!confirm('정말 삭제하시겠습니까?')) return;
            try {
                const res = await authFetch('/api/admin/marketing/posts/' + id, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) {
                    loadStats();
                    loadPosts();
                } else {
                    alert('삭제 실패: ' + data.message);
                }
            } catch (e) {
                alert('오류 발생');
            }
        }

        function openAutoPilotModal() {
            document.getElementById('autopilot-modal').classList.remove('hidden');
            authFetch('/api/admin/marketing/settings')
                .then(r => r.json())
                .then(d => {
                    if (d.success && d.settings) {
                        document.getElementById('autopilot-toggle').checked = (d.settings.auto_pilot_enabled === 'true');
                        if (d.settings.auto_pilot_slots) {
                            try {
                                const parsed = JSON.parse(d.settings.auto_pilot_slots);
                                document.getElementById('autopilot-slots').value = parsed.join(', ');
                            } catch (e) {}
                        }
                    }
                });
        }

        function closeAutoPilotModal() {
            document.getElementById('autopilot-modal').classList.add('hidden');
        }

        async function saveAutoPilotSettings() {
            const enabled = document.getElementById('autopilot-toggle').checked;
            const slotsInput = document.getElementById('autopilot-slots').value;
            const slotsArray = slotsInput.split(',').map(s => s.trim()).filter(Boolean);

            try {
                const res = await authFetch('/api/admin/marketing/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        auto_pilot_enabled: enabled ? 'true' : 'false',
                        auto_pilot_slots: JSON.stringify(slotsArray)
                    })
                });
                const data = await res.json();
                if (data.success) {
                    alert('오토파일럿 설정이 저장되었습니다.');
                    closeAutoPilotModal();
                } else {
                    alert('저장 실패: ' + data.message);
                }
            } catch (e) {
                alert('오류 발생');
            }
        }

        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.innerText = text;
            return div.innerHTML;
        }
    </script>
</body>
</html>
    `);
});
