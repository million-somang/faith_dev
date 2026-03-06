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
