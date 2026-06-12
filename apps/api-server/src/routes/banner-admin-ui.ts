import { Hono } from 'hono';
import { checkSession } from '../middleware/auth.js';
import { getAdminNavigation, getBreadcrumb } from './admin-ui.js';

export const bannerAdminUi = new Hono();

// 관리자 인증 (admin-ui와 동일 정책)
bannerAdminUi.use('/admin/banners', async (c, next) => {
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

bannerAdminUi.get('/admin/banners', async (c) => {
    return c.html(`
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>배너 관리 - Faith Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-gray-50 min-h-screen">
    <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
            <div class="flex items-center justify-between py-3">
                <a href="/admin" class="font-black text-lg text-gray-900">Faith Portal <span class="text-blue-600">Admin</span></a>
                <a href="/" class="text-sm text-gray-500 hover:text-blue-600"><i class="fas fa-home mr-1"></i>사이트로</a>
            </div>
            ${getAdminNavigation('/admin/banners')}
        </div>
    </header>
    ${getBreadcrumb([{ label: '관리자', href: '/admin' }, { label: '배너 관리' }])}

    <main class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        <div class="flex items-center justify-between mb-6">
            <h1 class="text-2xl font-black text-gray-900"><i class="fas fa-image text-blue-500 mr-2"></i>배너 관리</h1>
            <button onclick="openSlotForm()" class="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-bold rounded-lg">
                <i class="fas fa-plus mr-1"></i> 배너 자리 추가
            </button>
        </div>

        <!-- 슬롯 카드 목록 -->
        <div id="slot-list" class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8"></div>

        <!-- 슬롯별 배너 목록 -->
        <div id="banner-section" class="hidden">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold text-gray-900">
                    <i class="fas fa-images text-blue-500 mr-1"></i>
                    <span id="banner-section-title"></span>
                    <span id="banner-section-size" class="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold"></span>
                </h2>
                <button onclick="openBannerForm()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg">
                    <i class="fas fa-plus mr-1"></i> 배너 등록
                </button>
            </div>
            <div id="banner-list" class="space-y-3"></div>
        </div>
    </main>

    <!-- 배너 등록/수정 모달 -->
    <div id="banner-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div class="flex items-center justify-between px-6 py-4 border-b">
                <h3 id="banner-modal-title" class="font-black text-gray-900">배너 등록</h3>
                <button onclick="closeBannerForm()" class="text-gray-400 hover:text-gray-700"><i class="fas fa-times"></i></button>
            </div>
            <div class="p-6 space-y-4">
                <!-- 권장 사이즈 안내 -->
                <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
                    <i class="fas fa-ruler-combined mr-1"></i>
                    이 자리의 권장 사이즈: <b id="form-slot-size"></b>
                    <span class="text-blue-500 text-xs ml-1">이미지를 선택하면 사이즈를 자동으로 확인합니다</span>
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">배너 이름 *</label>
                    <input id="f-title" type="text" class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-400 outline-none" placeholder="관리용 이름 (예: 6월 프로모션)">
                </div>

                <!-- 이미지: 업로드 / URL 탭 -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">배너 이미지 *</label>
                    <div class="flex gap-1 mb-2">
                        <button type="button" id="tab-upload" onclick="switchImgTab('upload')" class="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white">파일 업로드</button>
                        <button type="button" id="tab-url" onclick="switchImgTab('url')" class="px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-100 text-gray-600">이미지 URL</button>
                    </div>
                    <div id="img-upload-pane">
                        <input id="f-file" type="file" accept=".png,.jpg,.jpeg,.gif,.webp" onchange="onFileSelected()" class="w-full text-sm border-2 border-dashed border-gray-300 rounded-lg p-3">
                        <p class="text-xs text-gray-400 mt-1">png, jpg, gif, webp / 최대 5MB</p>
                    </div>
                    <div id="img-url-pane" class="hidden">
                        <input id="f-image-url" type="text" oninput="onUrlInput()" class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-400 outline-none" placeholder="https://...">
                    </div>
                    <!-- 사이즈 체크 결과 -->
                    <div id="size-check" class="hidden mt-2 px-3 py-2 rounded-lg text-sm font-semibold"></div>
                </div>

                <!-- 실제 크기 미리보기 -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">미리보기 <span class="text-xs text-gray-400 font-normal">(실제 슬롯 크기 프레임)</span></label>
                    <div class="bg-gray-100 rounded-xl p-4 overflow-x-auto">
                        <div id="preview-frame" class="mx-auto bg-white border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden" style="width:728px;height:90px;max-width:100%;">
                            <span id="preview-placeholder" class="text-gray-400 text-xs">이미지를 선택하면 여기에 표시됩니다</span>
                            <img id="preview-img" class="hidden w-full h-full object-contain">
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-1">클릭 시 이동 URL</label>
                        <input id="f-link" type="text" class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-400 outline-none" placeholder="https://... (없으면 비워두기)">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-1">정렬 순서</label>
                        <input id="f-sort" type="number" value="0" class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-400 outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-1">게시 시작일 (선택)</label>
                        <input id="f-start" type="datetime-local" class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-400 outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-1">게시 종료일 (선택)</label>
                        <input id="f-end" type="datetime-local" class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-400 outline-none">
                    </div>
                </div>

                <div class="flex items-center gap-4">
                    <label class="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <input id="f-newtab" type="checkbox" checked class="w-4 h-4 accent-blue-600"> 새 창으로 열기
                    </label>
                    <label class="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <input id="f-active" type="checkbox" checked class="w-4 h-4 accent-blue-600"> 즉시 노출
                    </label>
                </div>
            </div>
            <div class="px-6 py-4 border-t flex justify-end gap-2">
                <button onclick="closeBannerForm()" class="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-800">취소</button>
                <button id="banner-save-btn" onclick="saveBanner()" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg">저장</button>
            </div>
        </div>
    </div>

    <!-- 슬롯 추가 모달 -->
    <div id="slot-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div class="flex items-center justify-between px-6 py-4 border-b">
                <h3 class="font-black text-gray-900">배너 자리 추가</h3>
                <button onclick="closeSlotForm()" class="text-gray-400 hover:text-gray-700"><i class="fas fa-times"></i></button>
            </div>
            <div class="p-6 space-y-3">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">자리 키 (slot_key) *</label>
                    <input id="s-key" type="text" class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-400 outline-none" placeholder="예: footer_wide (영문 소문자/숫자/_)">
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">표시 이름 *</label>
                    <input id="s-name" type="text" class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-400 outline-none" placeholder="예: 푸터 와이드 배너">
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-1">가로(px) *</label>
                        <input id="s-width" type="number" class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-400 outline-none" placeholder="728">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-1">세로(px) *</label>
                        <input id="s-height" type="number" class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-400 outline-none" placeholder="90">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">설명</label>
                    <input id="s-desc" type="text" class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-400 outline-none" placeholder="자리 위치 설명">
                </div>
            </div>
            <div class="px-6 py-4 border-t flex justify-end gap-2">
                <button onclick="closeSlotForm()" class="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-800">취소</button>
                <button onclick="saveSlot()" class="px-6 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-bold rounded-lg">추가</button>
            </div>
        </div>
    </div>

<script>
let slots = [];
let currentSlot = null;
let editingBannerId = null;
let imgTab = 'upload';
let uploadedUrl = null;

// ---------- 데이터 로드 ----------
async function loadSlots() {
    const res = await fetch('/api/admin/banner-slots');
    const data = await res.json();
    if (!data.success) { alert(data.message || '슬롯 로드 실패'); return; }
    slots = data.slots;
    renderSlots();
}

function renderSlots() {
    const el = document.getElementById('slot-list');
    el.innerHTML = slots.map(s => \`
        <div class="bg-white rounded-2xl border \${currentSlot && currentSlot.id === s.id ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200'} p-5 cursor-pointer hover:shadow-md transition-all" onclick="selectSlot(\${s.id})">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                    <h3 class="font-bold text-gray-900">\${esc(s.name)}</h3>
                    <code class="text-[11px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">\${esc(s.slot_key)}</code>
                </div>
                <span class="px-2 py-0.5 \${s.is_active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'} rounded text-xs font-bold">\${s.is_active ? '사용중' : '비활성'}</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-gray-500">
                <span class="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-bold text-xs"><i class="fas fa-ruler-combined mr-1"></i>\${s.width} × \${s.height}</span>
                <span class="text-xs">활성 배너 <b class="text-gray-800">\${s.active_banner_count}</b>개 / 전체 \${s.total_banner_count}개</span>
            </div>
            \${s.description ? \`<p class="text-xs text-gray-400 mt-2">\${esc(s.description)}</p>\` : ''}
        </div>
    \`).join('');
}

async function selectSlot(id) {
    currentSlot = slots.find(s => s.id === id);
    renderSlots();
    document.getElementById('banner-section').classList.remove('hidden');
    document.getElementById('banner-section-title').textContent = currentSlot.name;
    document.getElementById('banner-section-size').textContent = currentSlot.width + ' × ' + currentSlot.height;
    await loadBanners();
    document.getElementById('banner-section').scrollIntoView({ behavior: 'smooth' });
}

async function loadBanners() {
    const res = await fetch('/api/admin/banners?slot_key=' + encodeURIComponent(currentSlot.slot_key));
    const data = await res.json();
    const el = document.getElementById('banner-list');
    if (!data.success) { el.innerHTML = '<p class="text-red-500 text-sm">배너 로드 실패</p>'; return; }
    if (data.banners.length === 0) {
        el.innerHTML = '<div class="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-400 text-sm">등록된 배너가 없습니다. [배너 등록] 버튼으로 추가하세요.</div>';
        return;
    }
    el.innerHTML = data.banners.map(b => \`
        <div class="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4 \${b.is_active ? '' : 'opacity-50'}">
            <div class="w-40 h-14 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 border">
                <img src="\${esc(b.image_url)}" class="max-w-full max-h-full object-contain" onerror="this.outerHTML='<span class=&quot;text-xs text-red-400&quot;>이미지 오류</span>'">
            </div>
            <div class="flex-1 min-w-0">
                <p class="font-bold text-gray-900 text-sm truncate">\${esc(b.title)}
                    <span class="ml-1 text-[10px] font-bold \${b.is_active ? 'text-blue-600' : 'text-gray-400'}">\${b.is_active ? '노출중' : '숨김'}</span>
                </p>
                <p class="text-xs text-gray-400 truncate">\${esc(b.link_url || '링크 없음')}</p>
                <p class="text-[11px] text-gray-400">순서 \${b.sort_order}\${b.start_at ? ' · ' + b.start_at + ' 부터' : ''}\${b.end_at ? ' ~ ' + b.end_at : ''}</p>
            </div>
            <div class="flex gap-1 flex-shrink-0">
                <button onclick='openBannerForm(\${JSON.stringify(b).replace(/'/g, "&#39;")})' class="px-3 py-1.5 text-xs font-bold bg-gray-100 hover:bg-gray-200 rounded-lg">수정</button>
                <button onclick="toggleBanner(\${b.id})" class="px-3 py-1.5 text-xs font-bold \${b.is_active ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'} rounded-lg">\${b.is_active ? '숨기기' : '노출'}</button>
            </div>
        </div>
    \`).join('');
}

async function toggleBanner(id) {
    await fetch('/api/admin/banners/' + id + '/toggle', { method: 'POST' });
    await loadBanners();
    await loadSlots(); renderSlots();
}

// ---------- 배너 폼 ----------
function openBannerForm(banner) {
    if (!currentSlot) return;
    editingBannerId = banner ? banner.id : null;
    uploadedUrl = null;
    document.getElementById('banner-modal-title').textContent = banner ? '배너 수정' : '배너 등록 — ' + currentSlot.name;
    document.getElementById('form-slot-size').textContent = currentSlot.width + ' × ' + currentSlot.height + ' px';
    document.getElementById('f-title').value = banner ? banner.title : '';
    document.getElementById('f-image-url').value = banner ? banner.image_url : '';
    document.getElementById('f-link').value = banner ? (banner.link_url || '') : '';
    document.getElementById('f-sort').value = banner ? banner.sort_order : 0;
    document.getElementById('f-start').value = banner && banner.start_at ? banner.start_at.replace(' ', 'T').slice(0, 16) : '';
    document.getElementById('f-end').value = banner && banner.end_at ? banner.end_at.replace(' ', 'T').slice(0, 16) : '';
    document.getElementById('f-newtab').checked = banner ? !!banner.open_new_tab : true;
    document.getElementById('f-active').checked = banner ? !!banner.is_active : true;
    document.getElementById('f-file').value = '';
    // 미리보기 프레임을 슬롯 실제 크기로
    const frame = document.getElementById('preview-frame');
    frame.style.width = currentSlot.width + 'px';
    frame.style.height = currentSlot.height + 'px';
    resetPreview();
    switchImgTab(banner ? 'url' : 'upload');
    if (banner && banner.image_url) checkImageSize(banner.image_url);
    document.getElementById('banner-modal').classList.remove('hidden');
}

function closeBannerForm() { document.getElementById('banner-modal').classList.add('hidden'); }

function switchImgTab(tab) {
    imgTab = tab;
    document.getElementById('tab-upload').className = 'px-3 py-1.5 text-xs font-bold rounded-lg ' + (tab === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600');
    document.getElementById('tab-url').className = 'px-3 py-1.5 text-xs font-bold rounded-lg ' + (tab === 'url' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600');
    document.getElementById('img-upload-pane').classList.toggle('hidden', tab !== 'upload');
    document.getElementById('img-url-pane').classList.toggle('hidden', tab !== 'url');
}

function resetPreview() {
    document.getElementById('preview-img').classList.add('hidden');
    document.getElementById('preview-placeholder').classList.remove('hidden');
    document.getElementById('size-check').classList.add('hidden');
}

// 사이즈 사전 체크: 이미지 실제 픽셀과 슬롯 권장 사이즈 비교
function checkImageSize(src) {
    const img = new Image();
    img.onload = function () {
        const w = img.naturalWidth, h = img.naturalHeight;
        const sw = currentSlot.width, sh = currentSlot.height;
        const box = document.getElementById('size-check');
        box.classList.remove('hidden');
        if (w === sw && h === sh) {
            box.className = 'mt-2 px-3 py-2 rounded-lg text-sm font-semibold bg-green-50 text-green-700 border border-green-200';
            box.innerHTML = '<i class="fas fa-check-circle mr-1"></i>사이즈 일치: ' + w + ' × ' + h + ' (권장 사이즈와 동일)';
        } else if (Math.abs(w / h - sw / sh) < 0.02) {
            box.className = 'mt-2 px-3 py-2 rounded-lg text-sm font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200';
            box.innerHTML = '<i class="fas fa-exclamation-triangle mr-1"></i>비율은 동일하지만 크기가 다릅니다: ' + w + ' × ' + h + ' (권장: ' + sw + ' × ' + sh + ') — 자동으로 맞춰 표시됩니다';
        } else {
            box.className = 'mt-2 px-3 py-2 rounded-lg text-sm font-semibold bg-red-50 text-red-700 border border-red-200';
            box.innerHTML = '<i class="fas fa-times-circle mr-1"></i>사이즈 불일치: ' + w + ' × ' + h + ' (권장: ' + sw + ' × ' + sh + ') — 미리보기를 꼭 확인하세요';
        }
        const pv = document.getElementById('preview-img');
        pv.src = src;
        pv.classList.remove('hidden');
        document.getElementById('preview-placeholder').classList.add('hidden');
    };
    img.onerror = function () {
        const box = document.getElementById('size-check');
        box.classList.remove('hidden');
        box.className = 'mt-2 px-3 py-2 rounded-lg text-sm font-semibold bg-red-50 text-red-700 border border-red-200';
        box.innerHTML = '<i class="fas fa-times-circle mr-1"></i>이미지를 불러올 수 없습니다';
        resetPreviewImgOnly();
    };
    img.src = src;
}

function resetPreviewImgOnly() {
    document.getElementById('preview-img').classList.add('hidden');
    document.getElementById('preview-placeholder').classList.remove('hidden');
}

function onFileSelected() {
    const file = document.getElementById('f-file').files[0];
    if (!file) { resetPreview(); return; }
    uploadedUrl = null;
    checkImageSize(URL.createObjectURL(file));
}

let urlTimer = null;
function onUrlInput() {
    clearTimeout(urlTimer);
    urlTimer = setTimeout(() => {
        const url = document.getElementById('f-image-url').value.trim();
        if (url) checkImageSize(url); else resetPreview();
    }, 500);
}

async function saveBanner() {
    const btn = document.getElementById('banner-save-btn');
    btn.disabled = true; btn.textContent = '저장 중...';
    try {
        let imageUrl = '';
        if (imgTab === 'upload') {
            const file = document.getElementById('f-file').files[0];
            if (file) {
                const fd = new FormData();
                fd.append('file', file);
                const up = await fetch('/api/admin/banners/upload', { method: 'POST', body: fd });
                const upData = await up.json();
                if (!upData.success) { alert(upData.message || '업로드 실패'); return; }
                imageUrl = upData.url;
            } else if (editingBannerId) {
                imageUrl = document.getElementById('f-image-url').value.trim(); // 수정 시 기존 이미지 유지
            }
        } else {
            imageUrl = document.getElementById('f-image-url').value.trim();
        }
        const payload = {
            slot_key: currentSlot.slot_key,
            title: document.getElementById('f-title').value.trim(),
            image_url: imageUrl,
            link_url: document.getElementById('f-link').value.trim() || null,
            open_new_tab: document.getElementById('f-newtab').checked,
            sort_order: parseInt(document.getElementById('f-sort').value) || 0,
            start_at: document.getElementById('f-start').value ? document.getElementById('f-start').value.replace('T', ' ') + ':00' : null,
            end_at: document.getElementById('f-end').value ? document.getElementById('f-end').value.replace('T', ' ') + ':00' : null,
            is_active: document.getElementById('f-active').checked,
        };
        if (!payload.title) { alert('배너 이름을 입력해주세요'); return; }
        if (!payload.image_url) { alert('이미지를 업로드하거나 URL을 입력해주세요'); return; }
        const res = await fetch(editingBannerId ? '/api/admin/banners/' + editingBannerId : '/api/admin/banners', {
            method: editingBannerId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.success) { alert(data.message || '저장 실패'); return; }
        closeBannerForm();
        await loadBanners();
        await loadSlots();
    } finally {
        btn.disabled = false; btn.textContent = '저장';
    }
}

// ---------- 슬롯 폼 ----------
function openSlotForm() { document.getElementById('slot-modal').classList.remove('hidden'); }
function closeSlotForm() { document.getElementById('slot-modal').classList.add('hidden'); }

async function saveSlot() {
    const payload = {
        slot_key: document.getElementById('s-key').value.trim(),
        name: document.getElementById('s-name').value.trim(),
        width: parseInt(document.getElementById('s-width').value),
        height: parseInt(document.getElementById('s-height').value),
        description: document.getElementById('s-desc').value.trim() || null,
    };
    if (!payload.slot_key || !payload.name || !payload.width || !payload.height) {
        alert('필수 항목을 모두 입력해주세요'); return;
    }
    const res = await fetch('/api/admin/banner-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) { alert(data.message || '슬롯 생성 실패'); return; }
    closeSlotForm();
    await loadSlots();
}

function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

loadSlots();
</script>
</body>
</html>
    `);
});

export default bannerAdminUi;
