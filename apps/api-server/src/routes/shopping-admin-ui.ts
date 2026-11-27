import { Hono } from 'hono';
import { checkSession } from '../middleware/auth.js';
import { getAdminNavigation, getBreadcrumb } from './admin-ui.js';
import {
    COUPANG_OFFICIAL_CATEGORIES,
    DISPLAY_SECTIONS,
    MALL_CATEGORIES,
} from '../types/shopping-admin.types.js';

export const shoppingAdminUi = new Hono();

shoppingAdminUi.use('/admin/shopping', async (c, next) => {
    try {
        const user = await checkSession(c);
        if (!user || (user.role !== 'admin' && user.level < 6)) {
            return c.redirect('/login?redirect=' + encodeURIComponent(c.req.path));
        }
    } catch {
        return c.redirect('/login?redirect=' + encodeURIComponent(c.req.path));
    }
    await next();
});

shoppingAdminUi.get('/admin/shopping', async (c) => {
    const coupangCatOptions = COUPANG_OFFICIAL_CATEGORIES.map(
        (cat) => `<option value="${cat.id}" data-mall="${cat.defaultMallCategory}">${cat.id} · ${cat.name}</option>`
    ).join('');

    const mallCatOptions = MALL_CATEGORIES.map(
        (cat) => `<option value="${cat.id}">${cat.label}</option>`
    ).join('');

    const sectionOptions = DISPLAY_SECTIONS.map(
        (sec) => `<option value="${sec.id}">${sec.label}</option>`
    ).join('');

    return c.html(`
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>쿠팡 쇼핑몰 관리 - Faith Portal Admin</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-gray-50 min-h-screen text-gray-900">
    <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
            <div class="flex items-center justify-between py-3">
                <a href="/admin" class="font-black text-lg text-gray-900">Faith Portal <span class="text-blue-600">Admin</span></a>
                <a href="/" class="text-sm text-gray-500 hover:text-blue-600"><i class="fas fa-home mr-1"></i>사이트로</a>
            </div>
            ${getAdminNavigation('/admin/shopping')}
        </div>
    </header>
    ${getBreadcrumb([{ label: '관리자', href: '/admin' }, { label: '쿠팡 쇼핑몰' }])}

    <main class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 space-y-6">
        <!-- 상단 헤더 -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
                <h1 class="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <i class="fas fa-shopping-bag text-rose-500"></i>
                    <span>쿠팡 파트너스 쇼핑몰 관리</span>
                </h1>
                <p class="text-sm text-gray-500 mt-1">
                    쿠팡 파트너스 API로 실시간 상품을 검색·수집해 우리 쇼핑몰 DB에 진열·큐레이션합니다.
                </p>
            </div>
            <div class="flex items-center gap-2">
                <button type="button" onclick="quickTestApi()" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-sm flex items-center gap-1.5 cursor-pointer">
                    <i class="fas fa-plug"></i>
                    <span>API 연결 테스트</span>
                </button>
            </div>
        </div>

        <!-- 토스트 메시지 -->
        <div id="toast-box" class="hidden fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold text-white bg-slate-900"></div>

        <!-- 상단 현황 카드 4종 -->
        <section class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
                <div class="text-xs font-bold text-gray-400">쿠팡 API 연동</div>
                <div id="stat-api-status" class="text-lg font-black mt-1 text-gray-800">확인 중...</div>
                <div id="stat-api-sub" class="text-[11px] text-gray-500 mt-0.5 truncate">-</div>
            </div>
            <div class="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
                <div class="text-xs font-bold text-gray-400">진열 중 상품</div>
                <div id="stat-active-count" class="text-2xl font-black mt-1 text-emerald-600">0</div>
                <div class="text-[11px] text-gray-500 mt-0.5">쇼핑몰 노출 활성화</div>
            </div>
            <div class="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
                <div class="text-xs font-bold text-gray-400">숨김 처리 상품</div>
                <div id="stat-hidden-count" class="text-2xl font-black mt-1 text-amber-600">0</div>
                <div class="text-[11px] text-gray-500 mt-0.5">비공개 대기 상태</div>
            </div>
            <div class="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
                <div class="text-xs font-bold text-gray-400">누적 상품 클릭</div>
                <div id="stat-clicks-count" class="text-2xl font-black mt-1 text-indigo-600">0</div>
                <div class="text-[11px] text-gray-500 mt-0.5">파트너스 링크 이동 수</div>
            </div>
        </section>

        <!-- 메인 3탭 네비게이션 -->
        <div class="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div class="flex flex-wrap border-b border-gray-200 bg-gray-50/70 px-3 pt-2 gap-1">
                <button type="button" id="main-tab-import" onclick="switchMainTab('import')" class="px-4 py-3 text-sm font-black rounded-t-xl border-b-2 border-blue-600 text-blue-600 bg-white cursor-pointer">
                    📥 쿠팡 상품 가져오기
                </button>
                <button type="button" id="main-tab-products" onclick="switchMainTab('products')" class="px-4 py-3 text-sm font-bold rounded-t-xl border-b-2 border-transparent text-gray-500 hover:text-gray-800 cursor-pointer">
                    📦 등록 상품 관리
                </button>
                <button type="button" id="main-tab-settings" onclick="switchMainTab('settings')" class="px-4 py-3 text-sm font-bold rounded-t-xl border-b-2 border-transparent text-gray-500 hover:text-gray-800 cursor-pointer">
                    🔑 쿠팡 파트너스 API 설정
                </button>
            </div>

            <!-- ================= TAB 1: 쿠팡 상품 가져오기 ================= -->
            <div id="pane-import" class="p-4 sm:p-6 space-y-5">
                <!-- 4종 가져오기 모드 선택 -->
                <div class="flex flex-wrap gap-2">
                    <button type="button" id="mode-btn-search" onclick="switchImportMode('search')" class="px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-blue-600 text-white shadow-xs cursor-pointer">
                        <i class="fas fa-search mr-1"></i> 키워드 검색
                    </button>
                    <button type="button" id="mode-btn-best" onclick="switchImportMode('best')" class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer">
                        <i class="fas fa-crown mr-1 text-amber-500"></i> 카테고리 베스트
                    </button>
                    <button type="button" id="mode-btn-goldbox" onclick="switchImportMode('goldbox')" class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer">
                        <i class="fas fa-bolt mr-1 text-rose-500"></i> 오늘의 골드박스
                    </button>
                    <button type="button" id="mode-btn-deeplink" onclick="switchImportMode('deeplink')" class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer">
                        <i class="fas fa-link mr-1 text-indigo-500"></i> URL 딥링크 등록
                    </button>
                </div>

                <!-- 모드 A: 키워드 검색 -->
                <div id="import-box-search" class="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
                    <input id="search-keyword" type="text" onkeydown="if(event.key==='Enter') runCoupangSearch()" class="flex-1 px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-sm font-semibold focus:border-blue-500 outline-none" placeholder="쿠팡 상품 검색어 입력 (예: 무선청소기, 캠핑랜턴, 에어프라이어)">
                    <select id="search-limit" class="px-3 py-2.5 rounded-xl bg-white border border-gray-300 text-sm font-bold">
                        <option value="20">20개 조회</option>
                        <option value="50">50개 조회</option>
                        <option value="100">100개 조회</option>
                    </select>
                    <button type="button" onclick="runCoupangSearch()" class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black shadow-sm cursor-pointer">
                        검색 조회
                    </button>
                </div>

                <!-- 모드 B: 카테고리 베스트 -->
                <div id="import-box-best" class="hidden">
                    <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
                        <select id="best-category-id" class="flex-1 px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-sm font-bold">
                            ${coupangCatOptions}
                        </select>
                        <select id="best-limit" class="px-3 py-2.5 rounded-xl bg-white border border-gray-300 text-sm font-bold">
                            <option value="20">20개 조회</option>
                            <option value="50">50개 조회</option>
                            <option value="100">100개 조회</option>
                        </select>
                        <button type="button" onclick="runCoupangBest()" class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-black shadow-sm cursor-pointer">
                            베스트 조회
                        </button>
                    </div>
                </div>

                <!-- 모드 C: 골드박스 -->
                <div id="import-box-goldbox" class="hidden">
                    <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div class="text-sm text-gray-700 font-semibold">
                            <i class="fas fa-fire text-rose-500 mr-1.5"></i>
                            쿠팡이 오늘 선정한 <b>골드박스(매일 특가)</b> 실시간 상품 목록을 불러옵니다.
                        </div>
                        <button type="button" onclick="runCoupangGoldbox()" class="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-black shadow-sm cursor-pointer shrink-0">
                            골드박스 불러오기
                        </button>
                    </div>
                </div>

                <!-- 모드 D: URL 딥링크 변환 & 수동 등록 -->
                <div id="import-box-deeplink" class="hidden bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                    <div class="flex flex-col sm:flex-row gap-2">
                        <input id="dl-raw-url" type="url" class="flex-1 px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-sm font-semibold focus:border-indigo-500 outline-none" placeholder="쿠팡 상품 URL 붙여넣기 (https://www.coupang.com/vp/products/...)">
                        <button type="button" onclick="convertSingleDeeplink()" class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black cursor-pointer shrink-0">
                            🔗 파트너스 링크 변환
                        </button>
                    </div>

                    <div id="dl-converted-box" class="hidden p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
                        <div class="font-black">✓ 파트너스 딥링크 변환 완료</div>
                        <div class="font-mono break-all" id="dl-shorten-preview"></div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">상품명 *</label>
                            <input id="dl-name" type="text" class="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-sm" placeholder="예: 삼성 비스포크 무선청소기">
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="block text-xs font-bold text-gray-700 mb-1">판매가(원) *</label>
                                <input id="dl-price" type="number" min="0" class="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-sm" placeholder="299000">
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-gray-700 mb-1">정가(선택)</label>
                                <input id="dl-orig-price" type="number" min="0" class="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-sm" placeholder="399000">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">대표 이미지 URL (선택)</label>
                            <input id="dl-image" type="url" class="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-sm" placeholder="https://thumbnail...">
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="block text-xs font-bold text-gray-700 mb-1">쇼핑몰 카테고리</label>
                                <select id="dl-mall-category" class="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-sm font-bold">${mallCatOptions}</select>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-gray-700 mb-1">전시 구역</label>
                                <select id="dl-display-section" class="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-sm font-bold">${sectionOptions}</select>
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">관리자 한줄 추천평 (선택)</label>
                            <input id="dl-curation" type="text" class="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-sm" placeholder="예: 가성비 최고 자취 필수템">
                        </div>
                        <div class="flex items-end gap-4 pb-2">
                            <label class="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer">
                                <input id="dl-rocket" type="checkbox" checked class="w-4 h-4 accent-blue-600"> 로켓배송
                            </label>
                            <label class="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer">
                                <input id="dl-free-ship" type="checkbox" checked class="w-4 h-4 accent-blue-600"> 무료배송
                            </label>
                            <button type="button" onclick="submitManualProduct()" class="ml-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black cursor-pointer">
                                + 쇼핑몰 DB에 등록
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 일괄 등록 액션 바 (검색/베스트/골드박스 결과 있을 때 표시) -->
                <div id="import-batch-bar" class="hidden">
                    <div class="bg-indigo-50 border border-indigo-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
                        <div class="flex flex-wrap items-center gap-2">
                            <button type="button" onclick="selectAllFetched(true)" class="px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-xs font-bold text-indigo-700 hover:bg-indigo-100 cursor-pointer">전체 선택</button>
                            <button type="button" onclick="selectUnimportedOnly()" class="px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-xs font-bold text-indigo-700 hover:bg-indigo-100 cursor-pointer">미등록만 선택</button>
                            <button type="button" onclick="selectAllFetched(false)" class="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer">선택 해제</button>
                            <span id="import-selected-count" class="text-xs font-black text-indigo-900 ml-1">0개 선택됨</span>
                        </div>

                        <div class="flex flex-wrap items-center gap-2">
                            <select id="batch-mall-category" class="px-3 py-2 rounded-xl bg-white border border-indigo-200 text-xs font-bold">${mallCatOptions}</select>
                            <select id="batch-display-section" class="px-3 py-2 rounded-xl bg-white border border-indigo-200 text-xs font-bold">${sectionOptions}</select>
                            <button type="button" onclick="importSelectedProducts()" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-black shadow-sm cursor-pointer">
                                선택 상품 DB 일괄 등록
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 쿠팡 API 조회 결과 영역 -->
                <div id="import-results-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div class="col-span-full py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-sm text-gray-500">
                        위에서 검색어를 입력하거나 카테고리 베스트 · 골드박스를 조회해 보세요.
                    </div>
                </div>
            </div>

            <!-- ================= TAB 2: 등록 상품 관리 ================= -->
            <div id="pane-products" class="hidden p-4 sm:p-6 space-y-4">
                <div class="flex flex-wrap items-center gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <input id="filter-keyword" type="text" onkeydown="if(event.key==='Enter') loadDbProducts()" class="flex-1 min-w-[180px] px-3.5 py-2 rounded-xl bg-white border border-gray-300 text-sm" placeholder="상품명 · 추천평 · 태그 검색">
                    <select id="filter-mall-category" onchange="loadDbProducts()" class="px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs font-bold">
                        <option value="all">전체 카테고리</option>
                        ${mallCatOptions}
                    </select>
                    <select id="filter-display-section" onchange="loadDbProducts()" class="px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs font-bold">
                        <option value="all">전체 전시구역</option>
                        ${sectionOptions}
                    </select>
                    <select id="filter-status" onchange="loadDbProducts()" class="px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs font-bold">
                        <option value="all">전체 상태</option>
                        <option value="active">진열 중</option>
                        <option value="hidden">숨김</option>
                    </select>
                    <button type="button" onclick="loadDbProducts()" class="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-900 text-white text-xs font-black cursor-pointer">
                        조회
                    </button>
                </div>

                <div id="db-products-list" class="space-y-3"></div>
            </div>

            <!-- ================= TAB 3: API 연동 설정 ================= -->
            <div id="pane-settings" class="hidden p-4 sm:p-6 space-y-5">
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <form onsubmit="saveApiSettings(event)" class="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                        <div class="flex items-center justify-between border-b border-slate-200 pb-3">
                            <div>
                                <h3 class="text-base font-black text-gray-900">쿠팡 파트너스 API 자격증명</h3>
                                <p class="text-xs text-gray-500 mt-0.5">Secret Key는 보안을 위해 저장 후 마스킹 처리됩니다.</p>
                            </div>
                            <span id="settings-source-badge" class="px-2.5 py-1 rounded-full bg-gray-200 text-gray-700 text-[11px] font-black">-</span>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-gray-200 text-xs">
                            <div>
                                <div class="text-gray-400 font-bold">현재 적용 Access Key</div>
                                <div id="settings-masked-access" class="font-mono font-bold text-gray-800 mt-0.5">-</div>
                            </div>
                            <div>
                                <div class="text-gray-400 font-bold">현재 적용 Secret Key</div>
                                <div id="settings-masked-secret" class="font-mono font-bold text-gray-800 mt-0.5">-</div>
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">새 Access Key (변경 시에만 입력)</label>
                            <input id="cfg-access-key" type="text" class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-sm font-mono" placeholder="변경하지 않으려면 비워두세요">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">새 Secret Key (변경 시에만 입력)</label>
                            <input id="cfg-secret-key" type="password" class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-sm font-mono" placeholder="변경하지 않으려면 비워두세요">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">기본 채널 추적 코드 (subId)</label>
                            <input id="cfg-sub-id" type="text" class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-sm font-mono" placeholder="faithportal">
                        </div>

                        <div class="flex flex-wrap items-center gap-2 pt-2">
                            <button type="submit" class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black cursor-pointer">
                                설정 저장
                            </button>
                            <button type="button" onclick="quickTestApi()" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black cursor-pointer">
                                🔌 실시간 연결 테스트
                            </button>
                        </div>

                        <div id="settings-test-result" class="hidden p-3.5 rounded-xl border text-xs font-bold"></div>
                    </form>

                    <div class="lg:col-span-5 bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3 text-xs text-amber-900">
                        <h4 class="text-sm font-black flex items-center gap-1.5">
                            <i class="fas fa-shield-alt text-amber-600"></i>
                            <span>쿠팡 파트너스 연동 & 운영 가이드</span>
                        </h4>
                        <ul class="space-y-2 leading-relaxed list-disc pl-4">
                            <li>서버 <code>.env</code>에 기본 키가 안전하게 등록되어 있으며, 이 화면에서 키를 변경하면 DB 설정이 우선 적용됩니다.</li>
                            <li>쿠팡 Open API는 분당/시간당 호출 제한이 있으므로, 관리자 화면에서 상품 정보를 우리 DB에 저장해 두고 프론트엔드 쇼핑몰에서는 DB 상품을 우선 노출하는 구조가 가장 안정적입니다.</li>
                            <li>향후 프론트엔드 쇼핑몰 오픈 시 <b>"이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다."</b> 문구를 화면에 자동 표기합니다.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- 상품 수정 모달 -->
    <div id="edit-modal" class="hidden fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto">
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 class="font-black text-gray-900">등록 상품 수정</h3>
                <button type="button" onclick="closeEditModal()" class="text-gray-400 hover:text-gray-700 cursor-pointer"><i class="fas fa-times"></i></button>
            </div>
            <form onsubmit="submitEditProduct(event)" class="p-6 space-y-4">
                <input id="edit-id" type="hidden">
                <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">상품명 *</label>
                    <input id="edit-name" type="text" required class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm">
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">판매가(원) *</label>
                        <input id="edit-price" type="number" min="0" required class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">정가(선택)</label>
                        <input id="edit-orig-price" type="number" min="0" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm">
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">쇼핑몰 카테고리</label>
                        <select id="edit-mall-category" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold">${mallCatOptions}</select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">전시 구역</label>
                        <select id="edit-display-section" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold">${sectionOptions}</select>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">뱃지 태그</label>
                        <input id="edit-badge" type="text" maxlength="40" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm" placeholder="예: MD추천, 품절임박">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">정렬 순서 (작을수록 우선)</label>
                        <input id="edit-sort" type="number" min="0" max="99999" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm">
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">관리자 한줄 추천평</label>
                    <input id="edit-curation" type="text" maxlength="300" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm" placeholder="예: 실제 사용 만족도가 높은 인기 제품">
                </div>
                <div class="flex flex-wrap items-center gap-4">
                    <label class="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer">
                        <input id="edit-pinned" type="checkbox" class="w-4 h-4 accent-indigo-600"> 상단 고정
                    </label>
                    <label class="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer">
                        <input id="edit-rocket" type="checkbox" class="w-4 h-4 accent-blue-600"> 로켓배송
                    </label>
                    <label class="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer">
                        <input id="edit-free-ship" type="checkbox" class="w-4 h-4 accent-blue-600"> 무료배송
                    </label>
                    <select id="edit-status" class="ml-auto px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-bold">
                        <option value="active">진열 중 (active)</option>
                        <option value="hidden">숨김 (hidden)</option>
                    </select>
                </div>
                <div class="flex justify-end gap-2 pt-3 border-t border-gray-200">
                    <button type="button" onclick="closeEditModal()" class="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold cursor-pointer">취소</button>
                    <button type="submit" class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black cursor-pointer">수정 저장</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        const MALL_CAT_LABELS = ${JSON.stringify(Object.fromEntries(MALL_CATEGORIES.map((c) => [c.id, c.label])))};
        const SECTION_LABELS = ${JSON.stringify(Object.fromEntries(DISPLAY_SECTIONS.map((s) => [s.id, s.label])))};

        let currentImportMode = 'search';
        let fetchedItems = [];
        let selectedProductIds = new Set();
        let currentCoupangCategoryId = null;
        let currentCoupangCategoryName = null;
        let dbProductsMap = new Map();

        function escapeHtml(val) {
            return String(val ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function showToast(msg, isError) {
            const box = document.getElementById('toast-box');
            box.textContent = msg;
            box.className = 'fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold text-white ' + (isError ? 'bg-rose-600' : 'bg-slate-900');
            box.classList.remove('hidden');
            setTimeout(() => box.classList.add('hidden'), 2800);
        }

        function switchMainTab(tab) {
            ['import', 'products', 'settings'].forEach((t) => {
                document.getElementById('pane-' + t).classList.toggle('hidden', t !== tab);
                const btn = document.getElementById('main-tab-' + t);
                if (t === tab) {
                    btn.className = 'px-4 py-3 text-sm font-black rounded-t-xl border-b-2 border-blue-600 text-blue-600 bg-white cursor-pointer';
                } else {
                    btn.className = 'px-4 py-3 text-sm font-bold rounded-t-xl border-b-2 border-transparent text-gray-500 hover:text-gray-800 cursor-pointer';
                }
            });
            if (tab === 'products') loadDbProducts();
            if (tab === 'settings') loadSettings();
        }

        function switchImportMode(mode) {
            currentImportMode = mode;
            ['search', 'best', 'goldbox', 'deeplink'].forEach((m) => {
                document.getElementById('import-box-' + m).classList.toggle('hidden', m !== mode);
                const btn = document.getElementById('mode-btn-' + m);
                if (m === mode) {
                    btn.className = 'px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-blue-600 text-white shadow-xs cursor-pointer';
                } else {
                    btn.className = 'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer';
                }
            });
            const isListMode = mode !== 'deeplink';
            document.getElementById('import-results-container').classList.toggle('hidden', !isListMode);
            document.getElementById('import-batch-bar').classList.toggle('hidden', !isListMode || fetchedItems.length === 0);
        }

        async function loadSettings() {
            try {
                const res = await fetch('/api/admin/shopping/settings', { credentials: 'include' });
                const json = await res.json();
                if (!json.success) return;
                const d = json.data;
                document.getElementById('stat-api-status').innerHTML = d.isConfigured
                    ? '<span class="text-emerald-600">● 연결 준비됨</span>'
                    : '<span class="text-rose-600">○ 키 미설정</span>';
                document.getElementById('stat-api-sub').textContent = d.lastTestMessage || ('출처: ' + d.credentialSource.toUpperCase());

                const sourceLabel = d.credentialSource === 'db' ? '관리자 DB 저장 키' : d.credentialSource === 'env' ? '서버 .env 키' : '미등록';
                document.getElementById('settings-source-badge').textContent = sourceLabel;
                document.getElementById('settings-masked-access').textContent = d.maskedAccessKey || '(없음)';
                document.getElementById('settings-masked-secret').textContent = d.maskedSecretKey || '(없음)';
                document.getElementById('cfg-sub-id').value = d.defaultSubId || 'faithportal';

                if (d.lastTestMessage) {
                    const box = document.getElementById('settings-test-result');
                    box.className = 'p-3.5 rounded-xl border text-xs font-bold ' + (d.lastTestStatus === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800');
                    box.textContent = (d.lastTestedAt ? '[' + d.lastTestedAt + '] ' : '') + d.lastTestMessage;
                    box.classList.remove('hidden');
                }
            } catch (e) {
                console.error(e);
            }
        }

        async function saveApiSettings(e) {
            e.preventDefault();
            const accessKey = document.getElementById('cfg-access-key').value.trim();
            const secretKey = document.getElementById('cfg-secret-key').value.trim();
            const defaultSubId = document.getElementById('cfg-sub-id').value.trim();

            try {
                const res = await fetch('/api/admin/shopping/settings', {
                    method: 'PUT',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accessKey, secretKey, defaultSubId }),
                });
                const json = await res.json();
                if (!json.success) {
                    showToast(json.error?.message || '설정 저장 실패', true);
                    return;
                }
                document.getElementById('cfg-access-key').value = '';
                document.getElementById('cfg-secret-key').value = '';
                showToast('쿠팡 파트너스 API 설정이 저장되었습니다.');
                await loadSettings();
            } catch {
                showToast('설정 저장 중 네트워크 오류', true);
            }
        }

        async function quickTestApi() {
            showToast('쿠팡 API 게이트웨이 연결을 테스트 중입니다...');
            try {
                const res = await fetch('/api/admin/shopping/settings/test', {
                    method: 'POST',
                    credentials: 'include',
                });
                const json = await res.json();
                const ok = Boolean(json.success);
                const msg = json.data?.message || json.error?.message || '테스트 실패';
                showToast(msg, !ok);
                await loadSettings();
            } catch {
                showToast('연결 테스트 요청 실패', true);
            }
        }

        function renderFetchedItems() {
            const container = document.getElementById('import-results-container');
            const bar = document.getElementById('import-batch-bar');
            if (!fetchedItems || fetchedItems.length === 0) {
                bar.classList.add('hidden');
                container.innerHTML = '<div class="col-span-full py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-sm text-gray-500">조회된 상품이 없습니다.</div>';
                return;
            }

            bar.classList.remove('hidden');
            updateSelectedCount();

            container.innerHTML = fetchedItems.map((item) => {
                const pid = String(item.productId);
                const checked = selectedProductIds.has(pid) ? 'checked' : '';
                const imgHtml = item.productImage
                    ? '<img src="' + escapeHtml(item.productImage) + '" alt="" class="w-20 h-20 object-cover rounded-xl bg-gray-100 shrink-0">'
                    : '<div class="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 shrink-0"><i class="fas fa-image"></i></div>';

                const badges = [];
                if (item.alreadyImported) badges.push('<span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black">등록됨 ✓</span>');
                if (item.isRocket) badges.push('<span class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">🚀 로켓</span>');
                if (item.isFreeShipping) badges.push('<span class="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold">무료배송</span>');

                return '<label class="flex gap-3 p-3.5 rounded-2xl border ' + (selectedProductIds.has(pid) ? 'border-indigo-500 bg-indigo-50/30' : 'border-gray-200 bg-white') + ' hover:border-indigo-300 transition-all cursor-pointer">' +
                    '<input type="checkbox" ' + checked + ' data-pid="' + escapeHtml(pid) + '" onchange="toggleSelectItem(this.dataset.pid, this.checked)" class="w-4 h-4 mt-1 accent-indigo-600 shrink-0">' +
                    imgHtml +
                    '<div class="flex-1 min-w-0 space-y-1">' +
                        '<div class="flex flex-wrap gap-1">' + badges.join('') + '</div>' +
                        '<div class="text-xs font-bold text-gray-900 line-clamp-2">' + escapeHtml(item.productName) + '</div>' +
                        '<div class="flex items-baseline gap-1.5">' +
                            '<span class="text-sm font-black text-rose-600">' + Number(item.productPrice || 0).toLocaleString() + '원</span>' +
                            (item.discountRate ? '<span class="text-[11px] font-bold text-rose-500">' + item.discountRate + '%↓</span>' : '') +
                        '</div>' +
                        '<a href="' + escapeHtml(item.productUrl) + '" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()" class="inline-block text-[11px] font-bold text-blue-600 hover:underline">쿠팡에서 보기 →</a>' +
                    '</div>' +
                '</label>';
            }).join('');
        }

        function updateSelectedCount() {
            document.getElementById('import-selected-count').textContent = selectedProductIds.size + '개 선택됨';
        }

        function toggleSelectItem(pid, isChecked) {
            if (isChecked) selectedProductIds.add(pid);
            else selectedProductIds.delete(pid);
            renderFetchedItems();
        }

        function selectAllFetched(select) {
            selectedProductIds.clear();
            if (select) {
                fetchedItems.forEach((item) => selectedProductIds.add(String(item.productId)));
            }
            renderFetchedItems();
        }

        function selectUnimportedOnly() {
            selectedProductIds.clear();
            fetchedItems.forEach((item) => {
                if (!item.alreadyImported) selectedProductIds.add(String(item.productId));
            });
            renderFetchedItems();
        }

        function setFetchingState(label) {
            document.getElementById('import-batch-bar').classList.add('hidden');
            document.getElementById('import-results-container').innerHTML =
                '<div class="col-span-full py-12 text-center text-sm font-bold text-indigo-600"><i class="fas fa-circle-notch fa-spin mr-2"></i>' + escapeHtml(label) + '</div>';
        }

        async function runCoupangSearch() {
            const keyword = document.getElementById('search-keyword').value.trim();
            const limit = document.getElementById('search-limit').value;
            if (!keyword) { showToast('검색어를 입력해 주세요.', true); return; }
            currentCoupangCategoryId = null;
            currentCoupangCategoryName = null;
            setFetchingState('쿠팡에서 "' + keyword + '" 상품을 검색 중입니다...');
            try {
                const res = await fetch('/api/admin/shopping/coupang/search?keyword=' + encodeURIComponent(keyword) + '&limit=' + limit, { credentials: 'include' });
                const json = await res.json();
                if (!json.success) {
                    showToast(json.error?.message || '검색 실패', true);
                    fetchedItems = [];
                    renderFetchedItems();
                    return;
                }
                fetchedItems = json.data.items || [];
                selectedProductIds.clear();
                renderFetchedItems();
            } catch {
                showToast('검색 요청 중 오류가 발생했습니다.', true);
            }
        }

        async function runCoupangBest() {
            const select = document.getElementById('best-category-id');
            const categoryId = select.value;
            const limit = document.getElementById('best-limit').value;
            const opt = select.options[select.selectedIndex];
            const defaultMall = opt.getAttribute('data-mall');
            if (defaultMall) {
                document.getElementById('batch-mall-category').value = defaultMall;
            }
            currentCoupangCategoryId = Number(categoryId);
            currentCoupangCategoryName = opt.textContent;
            setFetchingState('카테고리 베스트 상품을 불러오는 중입니다...');
            try {
                const res = await fetch('/api/admin/shopping/coupang/best?categoryId=' + categoryId + '&limit=' + limit, { credentials: 'include' });
                const json = await res.json();
                if (!json.success) {
                    showToast(json.error?.message || '베스트 조회 실패', true);
                    fetchedItems = [];
                    renderFetchedItems();
                    return;
                }
                fetchedItems = json.data.items || [];
                selectedProductIds.clear();
                renderFetchedItems();
            } catch {
                showToast('베스트 조회 중 오류가 발생했습니다.', true);
            }
        }

        async function runCoupangGoldbox() {
            currentCoupangCategoryId = null;
            currentCoupangCategoryName = '골드박스 특가';
            document.getElementById('batch-display-section').value = 'goldbox';
            setFetchingState('오늘의 골드박스 특가를 불러오는 중입니다...');
            try {
                const res = await fetch('/api/admin/shopping/coupang/goldbox', { credentials: 'include' });
                const json = await res.json();
                if (!json.success) {
                    showToast(json.error?.message || '골드박스 조회 실패', true);
                    fetchedItems = [];
                    renderFetchedItems();
                    return;
                }
                fetchedItems = json.data.items || [];
                selectedProductIds.clear();
                renderFetchedItems();
            } catch {
                showToast('골드박스 조회 중 오류가 발생했습니다.', true);
            }
        }

        async function importSelectedProducts() {
            if (selectedProductIds.size === 0) {
                showToast('등록할 상품을 먼저 선택해 주세요.', true);
                return;
            }
            const items = fetchedItems
                .filter((item) => selectedProductIds.has(String(item.productId)))
                .map((item) => ({
                    ...item,
                    coupangCategoryId: currentCoupangCategoryId ?? undefined,
                    coupangCategoryName: item.categoryName || currentCoupangCategoryName || undefined,
                }));

            const mallCategory = document.getElementById('batch-mall-category').value;
            const displaySection = document.getElementById('batch-display-section').value;

            try {
                const res = await fetch('/api/admin/shopping/products/import', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        items,
                        mallCategory,
                        displaySection,
                        sourceType: currentImportMode === 'deeplink' ? 'deeplink' : currentImportMode,
                    }),
                });
                const json = await res.json();
                if (!json.success) {
                    showToast(json.error?.message || '등록 실패', true);
                    return;
                }
                showToast(json.data.importedCount + '개 상품을 쇼핑몰 DB에 등록했습니다.');
                fetchedItems.forEach((item) => {
                    if (selectedProductIds.has(String(item.productId))) item.alreadyImported = true;
                });
                selectedProductIds.clear();
                renderFetchedItems();
                loadDbProducts();
            } catch {
                showToast('일괄 등록 요청 실패', true);
            }
        }

        async function convertSingleDeeplink() {
            const rawUrl = document.getElementById('dl-raw-url').value.trim();
            if (!rawUrl) { showToast('쿠팡 URL을 입력해 주세요.', true); return; }
            try {
                const res = await fetch('/api/admin/shopping/coupang/deeplink', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ urls: [rawUrl] }),
                });
                const json = await res.json();
                if (!json.success || !json.data?.links?.length) {
                    showToast(json.error?.message || '딥링크 변환 실패', true);
                    return;
                }
                const shorten = json.data.links[0].shortenUrl;
                document.getElementById('dl-raw-url').value = shorten;
                document.getElementById('dl-shorten-preview').textContent = shorten;
                document.getElementById('dl-converted-box').classList.remove('hidden');
                showToast('파트너스 트래킹 링크로 변환되었습니다.');
            } catch {
                showToast('딥링크 변환 중 오류 발생', true);
            }
        }

        async function submitManualProduct() {
            const payload = {
                productUrl: document.getElementById('dl-raw-url').value.trim(),
                productName: document.getElementById('dl-name').value.trim(),
                productPrice: Number(document.getElementById('dl-price').value),
                originalPrice: document.getElementById('dl-orig-price').value ? Number(document.getElementById('dl-orig-price').value) : undefined,
                productImage: document.getElementById('dl-image').value.trim(),
                mallCategory: document.getElementById('dl-mall-category').value,
                displaySection: document.getElementById('dl-display-section').value,
                curationPoint: document.getElementById('dl-curation').value.trim(),
                isRocket: document.getElementById('dl-rocket').checked,
                isFreeShipping: document.getElementById('dl-free-ship').checked,
            };

            try {
                const res = await fetch('/api/admin/shopping/products/manual', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const json = await res.json();
                if (!json.success) {
                    showToast(json.error?.message || '등록 실패', true);
                    return;
                }
                showToast('상품을 쇼핑몰 DB에 등록했습니다.');
                document.getElementById('dl-raw-url').value = '';
                document.getElementById('dl-name').value = '';
                document.getElementById('dl-price').value = '';
                document.getElementById('dl-orig-price').value = '';
                document.getElementById('dl-image').value = '';
                document.getElementById('dl-curation').value = '';
                document.getElementById('dl-converted-box').classList.add('hidden');
                loadDbProducts();
            } catch {
                showToast('수동 등록 요청 실패', true);
            }
        }

        async function loadDbProducts() {
            const params = new URLSearchParams({
                mallCategory: document.getElementById('filter-mall-category').value,
                displaySection: document.getElementById('filter-display-section').value,
                status: document.getElementById('filter-status').value,
                keyword: document.getElementById('filter-keyword').value.trim(),
            });

            try {
                const res = await fetch('/api/admin/shopping/products?' + params.toString(), { credentials: 'include' });
                const json = await res.json();
                if (!json.success) return;

                const { products, stats } = json.data;
                document.getElementById('stat-active-count').textContent = stats.activeCount;
                document.getElementById('stat-hidden-count').textContent = stats.hiddenCount;
                document.getElementById('stat-clicks-count').textContent = stats.totalClicks;

                dbProductsMap.clear();
                products.forEach((p) => dbProductsMap.set(p.id, p));

                const listEl = document.getElementById('db-products-list');
                if (products.length === 0) {
                    listEl.innerHTML = '<div class="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-sm text-gray-500">아직 등록된 상품이 없습니다. &quot;쿠팡 상품 가져오기&quot; 탭에서 상품을 수집해 보세요.</div>';
                    return;
                }

                listEl.innerHTML = products.map((p) => {
                    const img = p.productImage
                        ? '<img src="' + escapeHtml(p.productImage) + '" alt="" class="w-16 h-16 rounded-xl object-cover bg-gray-100 shrink-0">'
                        : '<div class="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 shrink-0"><i class="fas fa-box"></i></div>';
                    const isHidden = p.status === 'hidden';

                    return '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border ' + (isHidden ? 'border-amber-200 bg-amber-50/40' : 'border-gray-200 bg-white') + '">' +
                        '<div class="flex items-start gap-3 min-w-0 flex-1">' +
                            img +
                            '<div class="min-w-0 space-y-1">' +
                                '<div class="flex flex-wrap items-center gap-1.5">' +
                                    (p.isPinned ? '<span class="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black">📌 고정</span>' : '') +
                                    '<span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">' + escapeHtml(MALL_CAT_LABELS[p.mallCategory] || p.mallCategory) + '</span>' +
                                    '<span class="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold">' + escapeHtml(SECTION_LABELS[p.displaySection] || p.displaySection) + '</span>' +
                                    (p.badgeTag ? '<span class="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black">' + escapeHtml(p.badgeTag) + '</span>' : '') +
                                    (isHidden ? '<span class="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black">숨김</span>' : '<span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black">진열중</span>') +
                                '</div>' +
                                '<div class="text-sm font-black text-gray-900 truncate">' + escapeHtml(p.productName) + '</div>' +
                                (p.curationPoint ? '<div class="text-xs text-indigo-700 font-semibold truncate">“' + escapeHtml(p.curationPoint) + '”</div>' : '') +
                                '<div class="flex flex-wrap items-center gap-3 text-xs text-gray-500">' +
                                    '<span class="font-black text-gray-900">' + Number(p.productPrice).toLocaleString() + '원</span>' +
                                    '<span>정렬: ' + p.sortOrder + '</span>' +
                                    '<span>클릭: ' + p.clickCount + '회</span>' +
                                    '<a href="' + escapeHtml(p.productUrl) + '" target="_blank" rel="noopener noreferrer" class="text-blue-600 font-bold hover:underline">링크 확인 →</a>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="flex flex-wrap items-center gap-1.5 shrink-0">' +
                            '<button type="button" onclick="toggleDbProductStatus(' + p.id + ', \\'' + (isHidden ? 'active' : 'hidden') + '\\')" class="px-3 py-1.5 rounded-xl text-xs font-bold ' + (isHidden ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-amber-100 text-amber-800 hover:bg-amber-200') + ' cursor-pointer">' + (isHidden ? '진열하기' : '숨기기') + '</button>' +
                            '<button type="button" onclick="openEditModal(' + p.id + ')" class="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer">수정</button>' +
                            '<button type="button" onclick="softDeleteDbProduct(' + p.id + ')" class="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold cursor-pointer">삭제</button>' +
                        '</div>' +
                    '</div>';
                }).join('');
            } catch (e) {
                console.error(e);
            }
        }

        async function toggleDbProductStatus(id, nextStatus) {
            try {
                const res = await fetch('/api/admin/shopping/products/' + id + '/status', {
                    method: 'PUT',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: nextStatus }),
                });
                const json = await res.json();
                if (!json.success) { showToast('상태 변경 실패', true); return; }
                showToast(nextStatus === 'active' ? '진열 상태로 변경했습니다.' : '숨김 처리했습니다.');
                loadDbProducts();
            } catch {
                showToast('상태 변경 중 오류 발생', true);
            }
        }

        async function softDeleteDbProduct(id) {
            if (!confirm('이 상품을 쇼핑몰 진열 목록에서 삭제(비활성 처리)하시겠습니까?')) return;
            try {
                const res = await fetch('/api/admin/shopping/products/' + id + '/delete', {
                    method: 'POST',
                    credentials: 'include',
                });
                const json = await res.json();
                if (!json.success) { showToast('삭제 실패', true); return; }
                showToast('상품을 삭제(비활성) 처리했습니다.');
                loadDbProducts();
            } catch {
                showToast('삭제 요청 중 오류 발생', true);
            }
        }

        function openEditModal(id) {
            const p = dbProductsMap.get(id);
            if (!p) return;
            document.getElementById('edit-id').value = p.id;
            document.getElementById('edit-name').value = p.productName;
            document.getElementById('edit-price').value = p.productPrice;
            document.getElementById('edit-orig-price').value = p.originalPrice ?? '';
            document.getElementById('edit-mall-category').value = p.mallCategory;
            document.getElementById('edit-display-section').value = p.displaySection;
            document.getElementById('edit-badge').value = p.badgeTag || '';
            document.getElementById('edit-sort').value = p.sortOrder ?? 100;
            document.getElementById('edit-curation').value = p.curationPoint || '';
            document.getElementById('edit-pinned').checked = Boolean(p.isPinned);
            document.getElementById('edit-rocket').checked = Boolean(p.isRocket);
            document.getElementById('edit-free-ship').checked = Boolean(p.isFreeShipping);
            document.getElementById('edit-status').value = p.status === 'hidden' ? 'hidden' : 'active';
            document.getElementById('edit-modal').classList.remove('hidden');
        }

        function closeEditModal() {
            document.getElementById('edit-modal').classList.add('hidden');
        }

        async function submitEditProduct(e) {
            e.preventDefault();
            const id = document.getElementById('edit-id').value;
            const origVal = document.getElementById('edit-orig-price').value.trim();
            const payload = {
                productName: document.getElementById('edit-name').value.trim(),
                productPrice: Number(document.getElementById('edit-price').value),
                originalPrice: origVal ? Number(origVal) : null,
                mallCategory: document.getElementById('edit-mall-category').value,
                displaySection: document.getElementById('edit-display-section').value,
                badgeTag: document.getElementById('edit-badge').value.trim(),
                sortOrder: Number(document.getElementById('edit-sort').value || 100),
                curationPoint: document.getElementById('edit-curation').value.trim(),
                isPinned: document.getElementById('edit-pinned').checked,
                isRocket: document.getElementById('edit-rocket').checked,
                isFreeShipping: document.getElementById('edit-free-ship').checked,
                status: document.getElementById('edit-status').value,
            };

            try {
                const res = await fetch('/api/admin/shopping/products/' + id, {
                    method: 'PUT',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const json = await res.json();
                if (!json.success) {
                    showToast(json.error?.message || '수정 실패', true);
                    return;
                }
                closeEditModal();
                showToast('상품 정보가 수정되었습니다.');
                loadDbProducts();
            } catch {
                showToast('수정 요청 중 오류 발생', true);
            }
        }

        // 초기 데이터 로드
        loadSettings();
        loadDbProducts();
    </script>
</body>
</html>
    `);
});
