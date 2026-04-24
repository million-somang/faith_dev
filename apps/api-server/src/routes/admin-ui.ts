import { Hono } from 'hono';
import * as fs from 'fs';
import { getDB } from '../db/adapter.js';
import { escapeHtml } from '../utils/htmlEscape.js';
import { getCategoryName, getCategoryColor, getTimeAgo } from '../utils/formatter.js';

export const adminUi = new Hono();

// ==================== UI 컴포넌트 / 레이아웃 헬퍼 ====================
// src/index.tsx에서 추출된 공통 UI 함수들

// ==================== Breadcrumb 네비게이션 ====================
export function getBreadcrumb(items: Array<{ label: string, href?: string }>): string {
    let breadcrumbHtml = `
    <nav class="bg-white border-b border-gray-100">
      <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3">
        <ol class="flex items-center space-x-2 text-sm">
  `
    items.forEach((item, index) => {
        const isLast = index === items.length - 1
        if (isLast) {
            breadcrumbHtml += `
        <li class="flex items-center">
          <span class="text-gray-900 font-semibold">${item.label}</span>
        </li>
      `
        } else {
            breadcrumbHtml += `
        <li class="flex items-center">
          <a href="${item.href}" class="text-gray-500 hover:text-cyan-600 transition-colors">${item.label}</a>
          <i class="fas fa-chevron-right text-gray-400 text-xs mx-2"></i>
        </li>
      `
        }
    })
    breadcrumbHtml += `
        </ol>
      </div>
    </nav>
  `
    return breadcrumbHtml
}

// ==================== 게임 메뉴 ====================
export function getGameMenu(currentPage: string): string {
    const menuItems = [
        { path: '/game/simple', label: '심플 게임', icon: 'fas fa-gamepad' },
        { path: '/game/web', label: '웹게임', icon: 'fas fa-globe' },
    ]
    let menuHtml = '<nav class="bg-white border-b border-gray-200 shadow-sm"><div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6"><div class="flex space-x-8 overflow-x-auto">'
    for (const item of menuItems) {
        const isActive = currentPage.startsWith(item.path)
        const activeClass = isActive ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-700 hover:text-purple-600 hover:border-b-2 hover:border-purple-600'
        menuHtml += `
      <a href="${item.path}" class="px-4 py-4 ${activeClass} whitespace-nowrap transition-all">
        <i class="${item.icon} mr-2"></i>
        ${item.label}
      </a>
    `
    }
    menuHtml += '</div></div></nav>'
    return menuHtml
}

// ==================== 심플 게임 사이드바 ====================
export function getSimpleGameSidebar(currentPage: string): string {
    const games = [
        { path: '/game/simple/tetris', label: '테트리스', icon: 'fas fa-th' },
        { path: '/game/simple/sudoku', label: '스도쿠', icon: 'fas fa-table' },
        { path: '/game/simple/2048', label: '2048', icon: 'fas fa-th-large' },
        { path: '/game/simple/minesweeper', label: '지뢰찾기', icon: 'fas fa-bomb' },
    ]
    let sidebarHtml = `
    <aside class="lg:w-64 flex-shrink-0">
      <div class="bg-white rounded-xl shadow-lg p-4 sticky top-24">
        <h3 class="font-bold text-gray-800 mb-3 flex items-center">
          <i class="fas fa-gamepad mr-2 text-purple-500"></i>
          게임 목록
        </h3>
        <nav class="space-y-2">
  `
    for (const game of games) {
        const isActive = currentPage === game.path
        const activeClass = isActive
            ? 'bg-purple-50 text-purple-600 font-semibold'
            : 'hover:bg-purple-50 text-gray-700 hover:text-purple-600'
        sidebarHtml += `
      <a href="${game.path}" class="block px-4 py-2 ${activeClass} rounded-lg transition-all">
        <i class="${game.icon} mr-2"></i>${game.label}
      </a>
    `
    }
    sidebarHtml += `
        </nav>
      </div>
    </aside>
  `
    return sidebarHtml
}

// ==================== 메뉴 헬퍼 (유틸리티, 금융, 엔터, 교육, 쇼핑) ====================
function createMenu(menuItems: Array<{ path: string, label: string, icon: string }>, currentPage: string, activeColor: string): string {
    let menuHtml = '<nav class="bg-white border-b border-gray-200 shadow-sm"><div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6"><div class="flex space-x-8 overflow-x-auto">'
    for (const item of menuItems) {
        const isActive = currentPage === item.path
        const activeClass = isActive ? `text-${activeColor}-600 border-b-2 border-${activeColor}-600` : `text-gray-700 hover:text-${activeColor}-600 hover:border-b-2 hover:border-${activeColor}-600`
        menuHtml += `
      <a href="${item.path}" class="px-4 py-4 ${activeClass} whitespace-nowrap transition-all">
        <i class="${item.icon} mr-2 ${item.icon.includes('youtube') ? 'text-red-500' : ''}"></i>
        ${item.label}
      </a>
    `
    }
    menuHtml += '</div></div></nav>'
    return menuHtml
}

export function getLifestyleMenu(currentPage: string): string {
    const menuItems = [{ path: '/lifestyle/calculator', label: '계산기', icon: 'fas fa-calculator' }]
    if (menuItems.length <= 1) return ''
    return createMenu(menuItems, currentPage, 'cyan')
}

export function getFinanceMenu(currentPage: string): string {
    return createMenu([
        { path: '/finance', label: '주식', icon: 'fas fa-chart-line' },
        { path: '/finance/exchange', label: '환율', icon: 'fas fa-exchange-alt' },
        { path: '/finance/banking', label: '은행', icon: 'fas fa-university' },
    ], currentPage, 'green')
}

export function getEntertainmentMenu(currentPage: string): string {
    return createMenu([
        { path: '/entertainment/music', label: '음악', icon: 'fas fa-music' },
        { path: '/entertainment/movie', label: '영화', icon: 'fas fa-film' },
        { path: '/entertainment/celebrity', label: '연예인', icon: 'fas fa-star' },
    ], currentPage, 'pink')
}

export function getEducationMenu(currentPage: string): string {
    return createMenu([
        { path: '/education/online', label: '온라인 강의', icon: 'fas fa-laptop' },
        { path: '/education/language', label: '언어', icon: 'fas fa-language' },
        { path: '/education/certificate', label: '자격증', icon: 'fas fa-certificate' },
    ], currentPage, 'indigo')
}

export function getShoppingMenu(currentPage: string): string {
    return createMenu([
        { path: '/shopping', label: '핫딜 랭킹', icon: 'fas fa-fire' },
        { path: '/shopping/coupang', label: '쿠팡 핫딜', icon: 'fas fa-tags' },
        { path: '/shopping/aliexpress', label: '알리 특가', icon: 'fas fa-globe' },
    ], currentPage, 'orange')
}

// ==================== 공통 헤더 ====================
export function getCommonHeader(sectionName: string = ''): string {
    const sectionLabel = sectionName ? `<span class="hidden sm:inline text-gray-700 text-lg md:text-xl font-bold ml-2 md:ml-3">| ${sectionName}</span>` : ''
    const headerClass = sectionName ? 'bg-white backdrop-blur-md shadow-sm relative transition-shadow duration-300' : 'bg-white backdrop-blur-md shadow-sm sticky top-0 z-50 transition-shadow duration-300'

    return `
    <!-- 헤더 -->
    <header class="${headerClass}" id="main-header">
        <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 flex justify-between items-center">
            <a href="/" class="flex items-center">
                <img src="/logo_fl.png" alt="Faith Portal" class="h-6 sm:h-8 md:h-10 w-auto object-contain" />
                ${sectionLabel}
            </a>
            <div id="user-menu" class="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                <div class="animate-pulse">
                    <div class="h-8 w-16 bg-gray-200 rounded"></div>
                </div>
            </div>
        </div>
    </header>
    <script>
      async function updateUserMenu() {
        console.log('updateUserMenu 실행');
        try {
          const response = await fetch('/api/auth/me', { credentials: 'include' });
          const data = await response.json();
          console.log('API 응답:', data);
          const userMenu = document.getElementById('user-menu');
          if (data.loggedIn && data.user) {
            console.log('로그인 상태 - 사용자:', data.user.name);
            userMenu.innerHTML = '<div class="flex items-center space-x-2 sm:space-x-3">' +
              '<span class="text-xs sm:text-sm text-gray-700 font-medium hidden md:inline">' +
                '<i class="fas fa-user text-blue-600 mr-1"></i>' +
                data.user.name + '님' +
              '</span>' +
              '<a href="/mypage" class="text-xs sm:text-sm text-gray-700 hover:text-blue-600 font-medium transition-all px-2 sm:px-3 py-1.5 border border-gray-300 rounded-lg hover:border-blue-400">' +
                '<i class="fas fa-user-circle mr-0 sm:mr-1"></i><span class="hidden sm:inline">마이페이지</span>' +
              '</a>' +
              '<button onclick="logout()" class="text-xs sm:text-sm text-gray-600 hover:text-red-600 font-medium transition-all px-2 sm:px-3 py-1.5 border border-gray-300 rounded-lg hover:border-red-400">' +
                '<i class="fas fa-sign-out-alt mr-0 sm:mr-1"></i><span class="hidden sm:inline">로그아웃</span>' +
              '</button>' +
            '</div>';
          } else {
            console.log('비로그인 상태');
            userMenu.innerHTML = '<a href="/login" class="text-xs sm:text-sm text-gray-700 hover:text-blue-900 font-medium transition-all px-2 sm:px-3">' +
                '<i class="fas fa-sign-in-alt mr-0 sm:mr-1"></i><span class="hidden sm:inline">로그인</span>' +
              '</a>' +
              '<a href="/signup" class="text-xs sm:text-sm brand-navy text-white px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-lg shadow-lg brand-navy-hover font-semibold">' +
                '<i class="fas fa-user-plus mr-0 sm:mr-1"></i><span class="hidden sm:inline">회원가입</span><span class="sm:hidden">가입</span>' +
              '</a>';
          }
        } catch (error) {
          console.error('사용자 정보 조회 오류:', error);
          const userMenu = document.getElementById('user-menu');
          userMenu.innerHTML = '<a href="/login" class="text-xs sm:text-sm text-gray-700 hover:text-blue-900 font-medium transition-all px-2 sm:px-3">' +
              '<i class="fas fa-sign-in-alt mr-0 sm:mr-1"></i><span class="hidden sm:inline">로그인</span>' +
            '</a>' +
            '<a href="/signup" class="text-xs sm:text-sm brand-navy text-white px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-lg shadow-lg brand-navy-hover font-semibold">' +
              '<i class="fas fa-user-plus mr-0 sm:mr-1"></i><span class="hidden sm:inline">회원가입</span><span class="sm:hidden">가입</span>' +
            '</a>';
        }
      }
      async function logout() {
        if (!confirm('로그아웃 하시겠습니까?')) return;
        try {
          const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
          const data = await response.json();
          if (data.success) { alert('로그아웃되었습니다'); window.location.reload(); }
        } catch (error) { console.error('로그아웃 오류:', error); alert('로그아웃 처리 중 오류가 발생했습니다'); }
      }
      updateUserMenu();
      window.addEventListener('scroll', function() {
        const header = document.getElementById('main-header');
        if (header) {
          if (window.scrollY > 50) { header.classList.add('shadow-lg'); header.classList.remove('shadow-sm'); }
          else { header.classList.add('shadow-sm'); header.classList.remove('shadow-lg'); }
        }
      });
    </script>
  `
}

// ==================== Sticky 헤더 ====================
export function getStickyHeader(): string {
    return `
    <div id="sticky-header" class="fixed top-0 left-0 right-0 z-50 bg-white shadow-md transition-all duration-300 ease-in-out" style="transform: translateY(-100%);">
        <div class="bg-white">
            <div class="max-w-7xl mx-auto px-4 py-2">
                <div class="flex items-center gap-3">
                    <a href="/" class="flex-shrink-0">
                        <img src="/logo_fl.png" alt="Faith Portal" class="h-8 w-auto object-contain" />
                    </a>
                    <div class="flex-1 relative">
                        <input type="text" placeholder="검색어를 입력해 주세요"
                            class="w-full px-4 py-2.5 text-sm border-2 border-gray-300 rounded focus:outline-none focus:border-blue-500 transition-colors" />
                    </div>
                    <button class="flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 border-gray-300 text-gray-600 flex items-center justify-center hover:bg-gray-50 transition-all">
                        <i class="fas fa-search text-base"></i>
                    </button>
                </div>
            </div>
        </div>
        <div style="background: linear-gradient(90deg, #1e3a8a 0%, #1e40af 50%, #1e3a8a 100%);">
            <div class="max-w-7xl mx-auto">
                <div class="overflow-x-auto hide-scrollbar">
                    <div class="flex items-center">
                        <a href="/news" class="px-4 py-3 text-sm font-bold text-white whitespace-nowrap hover:bg-white hover:bg-opacity-20 transition-all">뉴스</a>
                        <a href="/lifestyle" class="px-4 py-3 text-sm font-bold text-white whitespace-nowrap hover:bg-white hover:bg-opacity-20 transition-all">유틸리티</a>
                        <a href="/game" class="px-4 py-3 text-sm font-bold text-white whitespace-nowrap hover:bg-white hover:bg-opacity-20 transition-all">게임</a>
                        <a href="/finance" class="px-4 py-3 text-sm font-bold text-white whitespace-nowrap hover:bg-white hover:bg-opacity-20 transition-all">금융</a>
                        <a href="/shopping" class="px-4 py-3 text-sm font-bold text-white whitespace-nowrap hover:bg-white hover:bg-opacity-20 transition-all">쇼핑</a>
                        <a href="/entertainment" class="px-4 py-3 text-sm font-bold text-white whitespace-nowrap hover:bg-white hover:bg-opacity-20 transition-all">엔터</a>
                        <a href="/education" class="px-4 py-3 text-sm font-bold text-white whitespace-nowrap hover:bg-white hover:bg-opacity-20 transition-all">교육</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <script>
      if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initStickyHeader); }
      else { initStickyHeader(); }
      function initStickyHeader() {
        const stickyHeader = document.getElementById('sticky-header');
        const mainHeader = document.getElementById('main-header');
        const mainSearch = document.getElementById('main-search');
        const quickMenu = document.getElementById('quick-menu');
        if (!stickyHeader || !mainHeader) return;
        let scrollCount = 0;
        window.addEventListener('scroll', function() {
            scrollCount++;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const headerRect = mainHeader.getBoundingClientRect();
            if (mainSearch && quickMenu) {
                const quickMenuRect = quickMenu.getBoundingClientRect();
                if (quickMenuRect.bottom < -50) { stickyHeader.style.transform = 'translateY(0)'; }
                else { stickyHeader.style.transform = 'translateY(-100%)'; }
            } else {
                if (headerRect.bottom <= 0) { stickyHeader.style.transform = 'translateY(0)'; }
                else { stickyHeader.style.transform = 'translateY(-100%)'; }
            }
        });
      }
    </script>
  `
}

// ==================== 공통 인증 스크립트 ====================
export function getCommonAuthScript(): string {
    return `
    <script>
      function initDarkMode() {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        const htmlRoot = document.getElementById('html-root');
        if (htmlRoot) { if (darkMode) { htmlRoot.classList.add('dark'); } else { htmlRoot.classList.remove('dark'); } }
      }
      initDarkMode();

      // 서버와 로컬 스토리지 데이터 동기화 (권한 문제 해결용)
      async function syncAuth() {
        try {
          const response = await fetch('/api/auth/me');
          const data = await response.json();
          if (data.loggedIn && data.user) {
            // 구식 'true' 토큰이 남아있는 경우 명시적 제거
            if (localStorage.getItem('auth_token') === 'true') {
              localStorage.removeItem('auth_token');
            }
            
            // admin.ts의 requireAdmin 미들웨어는 "userId:any" 형식의 base64 토큰을 기대함
            const token = btoa(data.user.id + ':faith');
            localStorage.setItem('auth_token', token);
            localStorage.setItem('user_email', data.user.email);
            localStorage.setItem('user_role', data.user.role);
            localStorage.setItem('user_level', data.user.level.toString());
            console.log('Auth Synced:', data.user.role, data.user.level);
            
            // 관리자 메뉴 UI 즉시 업데이트 (선택적)
            const adminMenu = document.getElementById('admin-menu-link');
            if (adminMenu && (data.user.role === 'admin' || data.user.level >= 6)) {
                adminMenu.style.display = 'block';
            }
          } else {
            // 세션이 없으면 로컬 스토리지 데이터도 정리 (특히 'true' 토큰 방지)
            if (localStorage.getItem('auth_token')) {
              console.log('Session expired, clearing local auth data');
              localStorage.removeItem('auth_token');
              localStorage.removeItem('user_email');
              localStorage.removeItem('user_role');
              localStorage.removeItem('user_level');
            }
          }
        } catch (e) {
          console.error('Auth Sync Failed:', e);
        }
      }
      syncAuth();
    </script>
    ${getAuthPopupScript()}
  `
}

// ==================== 가입 유도 팝업 ====================
export function getAuthPopupScript(): string {
    return `
    <script>
      window.showAuthPopup = function(options) {
        options = options || {};
        const message = options.message || '이 기능을 사용하려면 로그인이 필요합니다';
        const type = options.type || 'login';
        const additionalData = options.additionalData || null;
        const existingPopup = document.querySelector('.auth-popup-overlay');
        if (existingPopup) { existingPopup.remove(); }
        const popup = document.createElement('div');
        popup.classList.add('auth-popup-overlay', 'fixed', 'inset-0', 'bg-black', 'bg-opacity-50', 'flex', 'items-center', 'justify-center', 'z-50');
        const iconClass = type === 'signup' ? 'fa-user-plus' : 'fa-lock';
        const title = type === 'signup' ? '회원가입이 필요합니다' : '로그인이 필요합니다';
        const actionText = type === 'signup' ? '회원가입' : '로그인';
        const actionUrl = type === 'signup' ? '/signup' : '/login';
        const altText = type === 'signup' ? '로그인' : '회원가입';
        const altUrl = type === 'signup' ? '/login' : '/signup';
        let dataHtml = '';
        if (additionalData) {
          dataHtml = '<div style="background: linear-gradient(to right, rgb(236 254 255), rgb(239 246 255)); border-radius: 0.5rem; padding: 1rem; margin-bottom: 1.5rem; border: 1px solid rgb(165 243 252);">';
          dataHtml += '<p style="font-size: 0.875rem; color: rgb(55 65 81); font-weight: 600;">' + (additionalData.label || '정보') + ':</p>';
          dataHtml += '<p style="font-size: 1.125rem; font-weight: 700; color: rgb(14 116 144); margin-top: 0.25rem;">' + additionalData.value + '</p>';
          if (additionalData.note) { dataHtml += '<p style="font-size: 0.75rem; color: rgb(107 114 128); margin-top: 0.5rem;">' + additionalData.note + '</p>'; }
          dataHtml += '</div>';
        }
        popup.innerHTML = '<div style="background: white; border-radius: 1rem; padding: 2rem; max-width: 28rem; margin: 1rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">' +
          '<div style="text-center;">' +
          '<div style="margin-bottom: 1rem;"><i class="fas ' + iconClass + '" style="color: rgb(8 145 178); font-size: 3rem;"></i></div>' +
          '<h3 style="font-size: 1.5rem; font-weight: 700; color: rgb(17 24 39); margin-bottom: 0.5rem;">' + title + '</h3>' +
          '<p style="color: rgb(75 85 99); margin-bottom: 1.5rem;">' + message + '</p>' +
          dataHtml +
          '<div style="display: flex; gap: 0.75rem;">' +
          '<button onclick="this.closest(\'.auth-popup-overlay\').remove()" style="flex: 1; padding: 0.75rem 1.5rem; background: rgb(229 231 235); color: rgb(55 65 81); border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer;">취소</button>' +
          '<button onclick="location.href=\'' + actionUrl + '?redirect=\' + encodeURIComponent(location.pathname)" style="flex: 1; padding: 0.75rem 1.5rem; background: linear-gradient(to right, rgb(8 145 178), rgb(37 99 235)); color: white; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">' + actionText + '</button>' +
          '</div>' +
          '<p style="font-size: 0.875rem; color: rgb(107 114 128); margin-top: 1rem;">' +
          (type === 'login' ? '계정이 없으신가요?' : '이미 계정이 있으신가요?') +
          ' <a href="' + altUrl + '" style="color: rgb(8 145 178); font-weight: 600; text-decoration: none;">' + altText + '</a>' +
          '</p>' +
          '</div></div>';
        popup.addEventListener('click', function(e) { if (e.target === popup) { popup.remove(); } });
        document.body.appendChild(popup);
      };
      window.checkAuth = async function() {
        try { const response = await fetch('/api/auth/me'); const data = await response.json(); return data.loggedIn ? data.user : null; }
        catch (error) { console.error('Auth check error:', error); return null; }
      };
    </script>
  `;
}

// ==================== 공통 푸터 ====================
export function getCommonFooter(): string {
    return `
    <footer class="bg-gradient-to-r from-blue-900 to-blue-800 text-white mt-16 py-8">
        <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                    <h3 class="text-lg font-bold mb-4">Faith Portal</h3>
                    <p class="text-blue-200 text-sm leading-relaxed">
                        믿음의 포탈, Faith Portal은<br>
                        여러분의 디지털 라이프를 풍요롭게 만들어드립니다.
                    </p>
                </div>
                <div>
                    <h3 class="text-lg font-bold mb-4">빠른 링크</h3>
                    <ul class="space-y-2">
                        <li><a href="/news" class="text-blue-200 hover:text-white text-sm transition">뉴스</a></li>
                        <li><a href="/lifestyle" class="text-blue-200 hover:text-white text-sm transition">유틸리티</a></li>
                        <li><a href="/game" class="text-blue-200 hover:text-white text-sm transition">게임</a></li>
                        <li><a href="/" class="text-blue-200 hover:text-white text-sm transition">쇼핑</a></li>
                    </ul>
                </div>
                <div>
                    <h3 class="text-lg font-bold mb-4">고객 지원</h3>
                    <ul class="space-y-2">
                        <li class="text-blue-200 text-sm"><i class="fas fa-envelope mr-2"></i>support@faithportal.com</li>
                        <li class="text-blue-200 text-sm"><i class="fas fa-phone mr-2"></i>1577-1577</li>
                        <li class="text-blue-200 text-sm"><i class="fas fa-clock mr-2"></i>평일 09:00 - 18:00</li>
                    </ul>
                </div>
            </div>
            <div class="border-t border-blue-700 mt-8 pt-6 text-center">
                <p class="text-blue-200 text-sm">© 2024 Faith Portal. All rights reserved.</p>
            </div>
        </div>
    </footer>
  `
}

// ==================== 관리자 네비게이션 ====================
export function getAdminNavigation(currentPage: string): string {
    const menuItems = [
        { path: '/admin', label: '대시보드', icon: 'fa-tachometer-alt', shortLabel: '대시보드' },
        { path: '/admin/users', label: '회원 관리', icon: 'fa-users', shortLabel: '회원' },
        {
            path: '/admin/content', label: '컨텐츠관리', icon: 'fa-folder', shortLabel: '컨텐츠', hasDropdown: true, dropdownItems: [
                { path: '/admin/news', label: '뉴스관리', icon: 'fa-newspaper' }
            ]
        },
        { path: '/admin/stats', label: '통계', icon: 'fa-chart-line', shortLabel: '통계' },
        { path: '/admin/logs', label: '활동 로그', icon: 'fa-clipboard-list', shortLabel: '로그' },
        { path: '/admin/notifications', label: '알림 센터', icon: 'fa-bell', shortLabel: '알림' },
        { path: '/admin/mini-apps', label: '미니앱 관리', icon: 'fa-th-large', shortLabel: '미니앱' },
    ]
    let navHtml = '<div class="flex flex-wrap items-center space-x-2 sm:space-x-4 lg:space-x-8 py-2">'
    for (const item of menuItems) {
        const isActive = currentPage === item.path || ((item as any).dropdownItems && (item as any).dropdownItems.some((sub: any) => sub.path === currentPage))
        const activeClass = isActive ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-700 hover:text-blue-600'
        if ((item as any).hasDropdown) {
            navHtml += `
        <div class="relative group flex-shrink-0">
          <button class="px-2 sm:px-3 lg:px-4 py-3 sm:py-4 ${activeClass} flex items-center text-sm sm:text-base whitespace-nowrap">
            <i class="fas ${item.icon} sm:mr-2"></i>
            <span class="hidden sm:inline ml-1">${item.label}</span>
            <span class="sm:hidden ml-1">${item.shortLabel}</span>
            <i class="fas fa-chevron-down ml-1 text-xs"></i>
          </button>
          <div class="hidden group-hover:block absolute top-full left-0 bg-white shadow-lg rounded-b-lg z-10 min-w-[160px]">
      `
            for (const subItem of (item as any).dropdownItems || []) {
                const subActive = currentPage === subItem.path
                navHtml += `
            <a href="${subItem.path}" class="block px-4 py-3 ${subActive ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'} text-sm sm:text-base">
              <i class="fas ${subItem.icon} mr-2"></i>
              ${subItem.label}
            </a>
        `
            }
            navHtml += `
          </div>
        </div>
      `
        } else {
            navHtml += `
        <a href="${item.path}" class="px-2 sm:px-3 lg:px-4 py-3 sm:py-4 ${activeClass} flex items-center flex-shrink-0 text-sm sm:text-base whitespace-nowrap">
          <i class="fas ${item.icon} sm:mr-2"></i>
          <span class="hidden sm:inline ml-1">${item.label}</span>
          <span class="sm:hidden ml-1">${item.shortLabel}</span>
        </a>
      `
        }
    }
    navHtml += '</div>'
    return navHtml
}


adminUi.get('/admin', async (c) => {
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
                // Async fallback sync
                fetch('/api/auth/me', { credentials: 'include' })
                    .then(res => res.json())
                    .then(data => {
                        if (data.loggedIn && (data.user.role === 'admin' || data.user.level >= 6)) {
                            localStorage.setItem('auth_token', btoa(data.user.id + ':faith'));
                            localStorage.setItem('user_email', data.user.email);
                            localStorage.setItem('user_role', data.user.role);
                            localStorage.setItem('user_level', data.user.level);
                            window.location.reload();
                        } else {
                            alert('관리자 권한이 필요합니다.');
                            window.location.href = 'http://localhost:5000/login?redirect=' + encodeURIComponent(window.location.pathname);
                        }
                    })
                    .catch(() => {
                        alert('관리자 권한이 필요합니다.');
                        window.location.href = 'http://localhost:5000/login?redirect=' + encodeURIComponent(window.location.pathname);
                    });
            } else

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
  `)
})

// ==================== 회원 관리 페이지 ====================
adminUi.get('/admin/users', async (c) => {
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
            const token = authToken;
            if (!authToken || authToken === 'true' || (userRole !== 'admin' && userLevel < 6)) {
                // Async fallback sync
                fetch('/api/auth/me', { credentials: 'include' })
                    .then(res => res.json())
                    .then(data => {
                        if (data.loggedIn && (data.user.role === 'admin' || data.user.level >= 6)) {
                            localStorage.setItem('auth_token', btoa(data.user.id + ':faith'));
                            localStorage.setItem('user_email', data.user.email);
                            localStorage.setItem('user_role', data.user.role);
                            localStorage.setItem('user_level', data.user.level);
                            window.location.reload();
                        } else {
                            alert('관리자 권한이 필요합니다.');
                            window.location.href = 'http://localhost:5000/login?redirect=' + encodeURIComponent(window.location.pathname);
                        }
                    })
                    .catch(() => {
                        alert('관리자 권한이 필요합니다.');
                        window.location.href = 'http://localhost:5000/login?redirect=' + encodeURIComponent(window.location.pathname);
                    });
            } else

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

            // 커스텀 알림/확인 모달
            function customConfirm(message, callback) {
                const modalHtml = \`
                <div id="custom-confirm" class="modal active" style="z-index: 9999;">
                    <div class="bg-white rounded-lg p-6 max-w-sm w-full shadow-2xl">
                        <h3 class="text-lg font-bold mb-4">확인</h3>
                        <p class="mb-6 text-gray-700">\${message.replace(/\\n/g, '<br>')}</p>
                        <div class="flex justify-end space-x-3">
                            <button id="custom-confirm-cancel" class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">취소</button>
                            <button id="custom-confirm-ok" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">확인</button>
                        </div>
                    </div>
                </div>\`;
                document.body.insertAdjacentHTML('beforeend', modalHtml);
                
                document.getElementById('custom-confirm-cancel').onclick = () => document.getElementById('custom-confirm').remove();
                document.getElementById('custom-confirm-ok').onclick = () => {
                    document.getElementById('custom-confirm').remove();
                    callback();
                };
            }

            function customAlert(message) {
                const modalHtml = \`
                <div id="custom-alert" class="modal active" style="z-index: 9999;">
                    <div class="bg-white rounded-lg p-6 max-w-sm w-full shadow-2xl">
                        <p class="mb-6 text-gray-700">\${message}</p>
                        <div class="flex justify-end">
                            <button onclick="document.getElementById('custom-alert').remove()" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">확인</button>
                        </div>
                    </div>
                </div>\`;
                document.body.insertAdjacentHTML('beforeend', modalHtml);
            }

            // 변경사항 저장
            async function saveUserChanges() {
        if (!currentUserId) return;

        const name = document.getElementById('detail-name').value;
        const phone = document.getElementById('detail-phone').value;
        const level = parseInt(document.getElementById('detail-level').value);

        customConfirm('회원 정보를 수정하시겠습니까?', async () => {
            try {
                await axios.put(\`/api/admin/users/\${currentUserId}\`, 
                            { name, phone, level },
                            { headers: { 'Authorization': 'Bearer ' + token } }
                        );
                        
                        customAlert('회원 정보가 수정되었습니다.');
                        showUserDetail(currentUserId); // 상세 정보 새로고침
                    } catch (error) {
                        customAlert('회원 정보 수정에 실패했습니다.');
                    }
                });
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
                    
                    customConfirm(\`정말 이 회원을 \${message}하시겠습니까?\`, async () => {
                        try {
                            await axios.patch(\`/api/admin/users/\${currentUserId}/status\`, 
                                { status: newStatus },
                                { headers: { 'Authorization': 'Bearer ' + token } }
                            );
                            
                            customAlert(\`회원이 \${message}되었습니다.\`);
                            showUserDetail(currentUserId); // 상세 정보 새로고침
                        } catch (error) {
                            customAlert('회원 상태 변경에 실패했습니다.');
                        }
                    });
                } catch (error) {
                    customAlert('회원 상태 확인에 실패했습니다.');
                }
            }

            // 회원 삭제
            async function deleteUserDetail() {
                if (!currentUserId) return;
                
                customConfirm('정말 이 회원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.', async () => {
                    try {
                        await axios.delete(\`/api/admin/users/\${currentUserId}\`, {
                            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') }
                        });
                        
                        customAlert('회원이 삭제되었습니다.');
                        backToList();
                    } catch (error) {
                        customAlert('회원 삭제에 실패했습니다.');
                    }
                });
            }

            // 초기 로드
            loadUsers();
        </script>
    </body>
    </html>
  `)
})


adminUi.get('/admin/stats', async (c) => {
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
                // Async fallback sync
                fetch('/api/auth/me', { credentials: 'include' })
                    .then(res => res.json())
                    .then(data => {
                        if (data.loggedIn && (data.user.role === 'admin' || data.user.level >= 6)) {
                            localStorage.setItem('auth_token', btoa(data.user.id + ':faith'));
                            localStorage.setItem('user_email', data.user.email);
                            localStorage.setItem('user_role', data.user.role);
                            localStorage.setItem('user_level', data.user.level);
                            window.location.reload();
                        } else {
                            alert('관리자 권한이 필요합니다.');
                            window.location.href = 'http://localhost:5000/login?redirect=' + encodeURIComponent(window.location.pathname);
                        }
                    })
                    .catch(() => {
                        alert('관리자 권한이 필요합니다.');
                        window.location.href = 'http://localhost:5000/login?redirect=' + encodeURIComponent(window.location.pathname);
                    });
            } else

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
  `)
})

// ==================== 활동 로그 페이지 ====================
adminUi.get('/admin/logs', async (c) => {
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
                // Async fallback sync
                fetch('/api/auth/me', { credentials: 'include' })
                    .then(res => res.json())
                    .then(data => {
                        if (data.loggedIn && (data.user.role === 'admin' || data.user.level >= 6)) {
                            localStorage.setItem('auth_token', btoa(data.user.id + ':faith'));
                            localStorage.setItem('user_email', data.user.email);
                            localStorage.setItem('user_role', data.user.role);
                            localStorage.setItem('user_level', data.user.level);
                            window.location.reload();
                        } else {
                            alert('관리자 권한이 필요합니다.');
                            window.location.href = 'http://localhost:5000/login?redirect=' + encodeURIComponent(window.location.pathname);
                        }
                    })
                    .catch(() => {
                        alert('관리자 권한이 필요합니다.');
                        window.location.href = 'http://localhost:5000/login?redirect=' + encodeURIComponent(window.location.pathname);
                    });
            } else

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
  `)
})

// ==================== 알림 센터 페이지 ====================
adminUi.get('/admin/notifications', async (c) => {
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
                // Async fallback sync
                fetch('/api/auth/me', { credentials: 'include' })
                    .then(res => res.json())
                    .then(data => {
                        if (data.loggedIn && (data.user.role === 'admin' || data.user.level >= 6)) {
                            localStorage.setItem('auth_token', btoa(data.user.id + ':faith'));
                            localStorage.setItem('user_email', data.user.email);
                            localStorage.setItem('user_role', data.user.role);
                            localStorage.setItem('user_level', data.user.level);
                            window.location.reload();
                        } else {
                            alert('관리자 권한이 필요합니다.');
                            window.location.href = 'http://localhost:5000/login?redirect=' + encodeURIComponent(window.location.pathname);
                        }
                    })
                    .catch(() => {
                        alert('관리자 권한이 필요합니다.');
                        window.location.href = 'http://localhost:5000/login?redirect=' + encodeURIComponent(window.location.pathname);
                    });
            } else

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
  `)
})

// ==================== RSS 피드 파싱 유틸리티 ====================


// ==================== Gemini AI 요약 및 감정 분석 함수 ====================


// ==================== 뉴스 AI 요약 API ====================


// ==================== 투표 시스템 API ====================


// ==================== 뉴스 투표 현황 조회 API ====================


// ==================== 키워드 구독 시스템 API ====================





// ==================== 실시간 HOT 뉴스 API ====================



// ==================== 뉴스 API ====================

// Google News RSS 파싱 함수
function decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
        '&lt;': '<', '&gt;': '>', '&amp;': '&', '&quot;': '"', '&#39;': "'", '&apos;': "'",
        '&nbsp;': ' ', '&copy;': '©', '&reg;': '®', '&trade;': '™', '&hellip;': '...',
        '&mdash;': '—', '&ndash;': '–', '&bull;': '•', '&middot;': '·',
    }
    return text.replace(/&[#\w]+;/g, (entity) => entities[entity] || '')
}

async function parseGoogleNewsRSS(category: string = 'general'): Promise<any[]> {
    const rssUrls: Record<string, string> = {
        'general': 'https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko',
        'politics': 'https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNRFZ4ZERBU0FtdHZLQUFQAQ?hl=ko&gl=KR&ceid=KR:ko',
        'economy': 'https://news.google.com/rss/topics/CAAqIggKIhxDQkFTRHdvSkwyMHZNR2RtY0hNekVnSnJieWdBUAE?hl=ko&gl=KR&ceid=KR:ko',
        'tech': 'https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNRGRqTVhZU0FtdHZLQUFQAQ?hl=ko&gl=KR&ceid=KR:ko',
        'sports': 'https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNRFp1ZEdvU0FtdHZLQUFQAQ?hl=ko&gl=KR&ceid=KR:ko',
        'entertainment': 'https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNREpxYW5RU0FtdHZLQUFQAQ?hl=ko&gl=KR&ceid=KR:ko',
    }
    const url = rssUrls[category] || rssUrls['general']

    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'application/rss+xml, text/xml, application/xml', 'Referer': 'https://news.google.com/' },
        })
        if (!response.ok) {
            console.error(`RSS fetch failed: ${response.status} ${response.statusText}`)
            return []
        }
        const text = await response.text()
        const items: any[] = []
        const itemRegex = /<item>([\s\S]*?)<\/item>/g
        let match
        while ((match = itemRegex.exec(text)) !== null) {
            const itemContent = match[1]
            const title = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || itemContent.match(/<title>(.*?)<\/title>/)?.[1] || ''
            const link = itemContent.match(/<link>(.*?)<\/link>/)?.[1] || ''
            const pubDate = itemContent.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
            const description = decodeHtmlEntities(itemContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || itemContent.match(/<description>(.*?)<\/description>/)?.[1] || '')
            const summary = description.replace(/<[^>]*>/g, '').trim().substring(0, 150)
            items.push({ category, title: title.trim(), summary: summary || title, link: link.trim(), publisher: '구글 뉴스', published_at: pubDate })
            if (items.length >= 20) break
        }
        console.log(`[parseGoogleNewsRSS] category=${category}, items=${items.length}`)
        return items
    } catch (error) {
        console.error(`RSS 파싱 오류 (${category}):`, error)
        return []
    }
}

// 뉴스 가져오기 및 DB 저장
adminUi.get('/api/news/fetch', async (c) => {
    const DB = getDB(c)
    const category = c.req.query('category') || 'general'

    try {
        let newsItems: any[] = []
        let retryCount = 0
        const maxRetries = 3

        while (retryCount < maxRetries && newsItems.length === 0) {
            try {
                newsItems = await parseGoogleNewsRSS(category)
                if (newsItems.length > 0) break
            } catch (err) {
                console.error(`뉴스 가져오기 시도 ${retryCount + 1}/${maxRetries} 실패:`, err)
            }
            retryCount++
            if (retryCount < maxRetries) await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
        }

        if (newsItems.length === 0) {
            return c.json({ success: true, fetched: 0, saved: 0, message: '뉴스를 가져올 수 없습니다.' })
        }

        let savedCount = 0
        for (const item of newsItems) {
            try {
                await DB.prepare(`INSERT OR IGNORE INTO news (category, title, summary, link, source, published_at) VALUES (?, ?, ?, ?, ?, ?)`)
                    .bind(item.category, item.title, item.summary, item.link, item.publisher, item.published_at).run()
                savedCount++
            } catch (err) { console.error('뉴스 저장 오류:', err) }
        }

        return c.json({ success: true, fetched: newsItems.length, saved: savedCount, message: `${savedCount}개의 새 뉴스를 저장했습니다.` })
    } catch (error) {
        console.error('뉴스 가져오기 오류:', error)
        return c.json({ success: false, error: '뉴스 서비스에 일시적인 문제가 발생했습니다.' }, 503)
    }
})

// 저장된 뉴스 목록 조회
// API: 뉴스 리다이렉트 프록시 (Google News 차단 우회)


adminUi.get('/admin/news', async (c) => {
    const DB = getDB(c)

    // DB에서 뉴스 통계만 가져오기 (전체 개수)
    let newsFromDB: any[] = []
    let totalCount = 0
    try {
        // 전체 개수 조회
        const countResult = await DB.prepare('SELECT COUNT(*) as total FROM news').first()
        totalCount = countResult?.total || 0

        // 초기 50개만 가져오기
        const { results } = await DB.prepare('SELECT * FROM news ORDER BY created_at DESC LIMIT 50').all()
        newsFromDB = results || []
        // 뉴스 데이터베이스 용량 계산
        let dbSizeMB = '0'
        try {
            const dbPath = process.env.DATABASE_PATH || '../../faith-portal.db'
            if (fs.existsSync(dbPath)) {
                const stats = fs.statSync(dbPath)
                dbSizeMB = (stats.size / (1024 * 1024)).toFixed(1)
            }
        } catch (sizeErr) {
            console.error('DB 용량 계산 오류:', sizeErr)
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
  `)
    } catch (error) {
        console.error('뉴스 조회 오류:', error)
        return c.text('Internal Server Error', 500)
    }
})

// ==================== 미니앱 관리 페이지 ====================
adminUi.get('/admin/mini-apps', async (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>미니앱 관리 - Faith Portal</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <style>
            .faith-blue { background-color: #1E40AF; }
        </style>
    </head>
    <body class="bg-gray-100">
        <!-- 관리자 헤더 -->
        <header class="faith-blue text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                <div class="flex justify-between items-center">
                    <a href="/admin" class="text-lg sm:text-xl lg:text-2xl font-bold">Faith Portal 관리자</a>
                </div>
            </div>
        </header>

        <!-- 네비게이션 -->
        <nav class="bg-white shadow">
            <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
                ${getAdminNavigation('/admin/mini-apps')}
            </div>
        </nav>

        ${getBreadcrumb([
            { label: '홈', href: '/' },
            { label: '관리자', href: '/admin' },
            { label: '미니앱 관리' }
        ])}

        <main class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 class="text-2xl font-bold text-gray-800">미니앱 관리</h1>
                <button onclick="openModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm sm:text-base hidden sm:inline-flex items-center gap-2">
                    <i class="fas fa-plus"></i> 미니앱 등록
                </button>
            </div>

            <!-- 미니앱 목록 -->
            <div class="bg-white rounded-lg shadow overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">순서</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">앱 이름 / 설명</th>
                                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">접근 권한</th>
                                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">상태</th>
                                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">연동 경로(URL)</th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">관리</th>
                            </tr>
                        </thead>
                        <tbody id="miniapp-list" class="bg-white divide-y divide-gray-200">
                            <tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">목록을 불러오는 중...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- 미니앱 통계 요약표 -->
            <div class="mt-8 bg-white rounded-lg shadow overflow-hidden">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h2 class="text-lg font-bold text-gray-800"><i class="fas fa-chart-bar text-purple-500 mr-2"></i>미니앱 실행 통계 (전체 기간)</h2>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">앱 이름</th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">총 실행 횟수</th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">고유 사용자 수</th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">최근 실행일</th>
                            </tr>
                        </thead>
                        <tbody id="miniapp-stats" class="bg-white divide-y divide-gray-200">
                        </tbody>
                    </table>
                </div>
            </div>
        </main>

        <!-- 미니앱 등록/수정 모달 -->
        <div id="appModal" class="hidden fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div class="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-lg bg-white">
                <div class="mt-3">
                    <h3 class="text-lg font-medium text-gray-900 mb-4" id="modalTitle">미니앱 등록</h3>
                    <form id="appForm" onsubmit="saveApp(event)">
                        <input type="hidden" id="appId">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">앱 이름</label>
                                <input type="text" id="name" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">슬러그 (영문)</label>
                                <input type="text" id="slug" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="예: calculator">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">연동 경로 (URL)</label>
                                <input type="text" id="app_url" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="예: /app/calculator/">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">아이콘 (FontAwesome 클래스)</label>
                                <input type="text" id="icon_url" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="예: fas fa-calculator">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">설명</label>
                                <input type="text" id="description" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">상태</label>
                                    <select id="status" class="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                        <option value="active">활성 (Active)</option>
                                        <option value="maintenance">점검중 (Maintenance)</option>
                                        <option value="inactive">비활성 (Inactive)</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">접근 권한</label>
                                    <select id="require_auth" class="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                        <option value="0">전체 공개</option>
                                        <option value="1">로그인 필요</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">정렬 순서</label>
                                <input type="number" id="sort_order" value="0" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                            </div>
                        </div>
                        <div class="mt-5 sm:mt-6 flex gap-3">
                            <button type="submit" class="flex-1 justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:text-sm">저장</button>
                            <button type="button" onclick="closeModal()" class="flex-1 justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:text-sm">취소</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <script>
            let apps = [];
            const authToken = localStorage.getItem('auth_token');

            async function loadApps() {
                try {
                    const res = await axios.get('/api/admin/mini-apps', {
                        headers: { 'Authorization': 'Bearer ' + authToken }
                    });
                    if (res.data.success) {
                        apps = res.data.apps;
                        renderApps();
                    }
                } catch (e) {
                    console.error('Failed to load mini apps', e);
                    alert('미니앱 목록을 불러오지 못했습니다.');
                }
            }

            async function loadStats() {
                try {
                    const res = await axios.get('/api/admin/mini-apps/stats', {
                        headers: { 'Authorization': 'Bearer ' + authToken }
                    });
                    if (res.data.success) {
                        renderStats(res.data.stats);
                    }
                } catch (e) {
                    console.error('Failed to load stats', e);
                }
            }

            function renderApps() {
                const tbody = document.getElementById('miniapp-list');
                if (apps.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">등록된 미니앱이 없습니다.</td></tr>';
                    return;
                }
                
                tbody.innerHTML = apps.map(app => {
                    const statusColors = {
                        'active': 'bg-green-100 text-green-800',
                        'maintenance': 'bg-yellow-100 text-yellow-800',
                        'inactive': 'bg-gray-100 text-gray-800'
                    };
                    const authText = app.require_auth ? 
                        '<span class="text-orange-600"><i class="fas fa-lock mr-1"></i>로그인 회원</span>' : 
                        '<span class="text-blue-600"><i class="fas fa-globe mr-1"></i>전체 공개</span>';
                    
                    return \`
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">\${app.sort_order}</td>
                        <td class="px-6 py-4">
                            <div class="flex items-center">
                                <div class="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-gray-50 border text-blue-500 text-xl">
                                    <i class="\${app.icon_url || 'fas fa-cube'}"></i>
                                </div>
                                <div class="ml-4">
                                    <div class="text-sm font-medium text-gray-900">\${app.name} <span class="text-xs text-gray-400 ml-1">/\${app.slug}</span></div>
                                    <div class="text-sm text-gray-500">\${app.description || '-'}</div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-center text-sm">\${authText}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-center">
                            <select onchange="updateStatus(\${app.id}, this.value)" class="text-sm rounded-full px-3 py-1 font-semibold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 \${statusColors[app.status]}">
                                <option value="active" \${app.status === 'active' ? 'selected' : ''}>활성</option>
                                <option value="maintenance" \${app.status === 'maintenance' ? 'selected' : ''}>점검중</option>
                                <option value="inactive" \${app.status === 'inactive' ? 'selected' : ''}>비활성</option>
                            </select>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                            <a href="\${app.app_url}" target="_blank" class="text-blue-600 hover:underline">\${app.app_url}</a>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onclick="editApp(\${app.id})" class="text-indigo-600 hover:text-indigo-900 mx-2"><i class="fas fa-edit"></i> 수정</button>
                            <button onclick="deleteApp(\${app.id})" class="text-red-600 hover:text-red-900"><i class="fas fa-trash"></i> 삭제</button>
                        </td>
                    </tr>
                    \`;
                }).join('');
            }

            function renderStats(stats) {
                const tbody = document.getElementById('miniapp-stats');
                if (!stats || stats.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">통계 데이터가 없습니다.</td></tr>';
                    return;
                }
                tbody.innerHTML = stats.map(s => {
                    const date = s.last_launched ? new Date(s.last_launched).toLocaleString('ko-KR') : '-';
                    return \`
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">\${s.name}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-purple-600 font-bold">\${s.total_launches.toLocaleString()}회</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">\${s.unique_users.toLocaleString()}명</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">\${date}</td>
                    </tr>
                    \`;
                }).join('');
            }

            async function updateStatus(id, newStatus) {
                try {
                    await axios.patch(\`/api/admin/mini-apps/\${id}/status\`, { status: newStatus }, {
                        headers: { 'Authorization': 'Bearer ' + authToken }
                    });
                    const app = apps.find(a => a.id === id);
                    if (app) app.status = newStatus;
                    renderApps();
                } catch (e) {
                    alert('상태 변경 실패');
                }
            }

            async function deleteApp(id) {
                if (!confirm('정말 삭제하시겠습니까? 관련 통계 로그도 모두 삭제됩니다.')) return;
                try {
                    await axios.delete(\`/api/admin/mini-apps/\${id}\`, {
                        headers: { 'Authorization': 'Bearer ' + authToken }
                    });
                    loadApps();
                    loadStats();
                } catch (e) {
                    alert('삭제 실패');
                }
            }

            window.openModal = function() {
                document.getElementById('appForm').reset();
                document.getElementById('appId').value = '';
                document.getElementById('modalTitle').innerText = '미니앱 등록';
                document.getElementById('appModal').classList.remove('hidden');
            }

            window.closeModal = function() {
                document.getElementById('appModal').classList.add('hidden');
            }

            window.editApp = function(id) {
                const app = apps.find(a => a.id === id);
                if (!app) return;
                
                document.getElementById('appId').value = app.id;
                document.getElementById('name').value = app.name;
                document.getElementById('slug').value = app.slug;
                document.getElementById('icon_url').value = app.icon_url || '';
                document.getElementById('description').value = app.description || '';
                document.getElementById('app_url').value = app.app_url;
                document.getElementById('status').value = app.status;
                document.getElementById('require_auth').value = app.require_auth.toString();
                document.getElementById('sort_order').value = app.sort_order;
                
                document.getElementById('modalTitle').innerText = '미니앱 수정';
                document.getElementById('appModal').classList.remove('hidden');
            }

            window.saveApp = async function(e) {
                e.preventDefault();
                const id = document.getElementById('appId').value;
                const payload = {
                    name: document.getElementById('name').value,
                    slug: document.getElementById('slug').value,
                    icon_url: document.getElementById('icon_url').value,
                    description: document.getElementById('description').value,
                    app_url: document.getElementById('app_url').value,
                    status: document.getElementById('status').value,
                    require_auth: parseInt(document.getElementById('require_auth').value),
                    sort_order: parseInt(document.getElementById('sort_order').value)
                };

                try {
                    if (id) {
                        await axios.put(\`/api/admin/mini-apps/\${id}\`, payload, {
                            headers: { 'Authorization': 'Bearer ' + authToken }
                        });
                    } else {
                        await axios.post('/api/admin/mini-apps', payload, {
                            headers: { 'Authorization': 'Bearer ' + authToken }
                        });
                    }
                    closeModal();
                    loadApps();
                } catch (err) {
                    alert('저장 실패: ' + (err.response?.data?.message || err.message));
                }
            }

            // 초기 로딩
            loadApps();
            loadStats();
        </script>
    </body>
    </html>
    `);
});
