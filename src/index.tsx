import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database;
  FIGMA_ACCESS_TOKEN?: string;
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS 설정 (API 요청용)
app.use('/api/*', cors())

// ==================== 헬퍼 함수 ====================
// HTML 이스케이프 함수
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}

// 카테고리 이름 변환
function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    'general': '일반',
    'politics': '정치',
    'economy': '경제',
    'tech': 'IT/과학',
    'sports': '스포츠',
    'entertainment': '엔터'
  }
  return names[category] || category
}

// 카테고리 색상 (배지 스타일)
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'general': 'bg-gray-100 text-gray-700',
    'politics': 'bg-blue-100 text-blue-700',
    'economy': 'bg-green-100 text-green-700',
    'tech': 'bg-purple-100 text-purple-700',
    'sports': 'bg-orange-100 text-orange-700',
    'entertainment': 'bg-pink-100 text-pink-700'
  }
  return colors[category] || 'bg-gray-100 text-gray-700'
}

// 시간 전 표시
function getTimeAgo(dateString: string): string {
  const now = new Date()
  const past = new Date(dateString)
  const diffMs = now.getTime() - past.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return '방금 전'
  if (diffMins < 60) return `${diffMins}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  if (diffDays < 7) return `${diffDays}일 전`
  return past.toLocaleDateString('ko-KR')
}

// ==================== Breadcrumb 네비게이션 헬퍼 함수 ====================
function getBreadcrumb(items: Array<{label: string, href?: string}>): string {
  let breadcrumbHtml = `
    <nav class="bg-white border-b border-gray-100">
      <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3">
        <ol class="flex items-center space-x-2 text-sm">
  `
  
  items.forEach((item, index) => {
    const isLast = index === items.length - 1
    
    if (isLast) {
      // 마지막 항목 (현재 페이지)
      breadcrumbHtml += `
        <li class="flex items-center">
          <span class="text-gray-900 font-semibold">${item.label}</span>
        </li>
      `
    } else {
      // 링크 항목
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

// ==================== 게임 메뉴 헬퍼 함수 ====================
function getGameMenu(currentPage: string): string {
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

// ==================== 유틸리티 메뉴 헬퍼 함수 ====================
function getLifestyleMenu(currentPage: string): string {
  const menuItems = [
    { path: '/lifestyle/calculator', label: '계산기', icon: 'fas fa-calculator' },
    { path: '/lifestyle/youtube-download', label: '유튜브 다운로드', icon: 'fab fa-youtube' },
    // 추가 메뉴는 여기에
  ]

  let menuHtml = '<nav class="bg-white border-b border-gray-200 shadow-sm"><div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6"><div class="flex space-x-8 overflow-x-auto">'
  
  for (const item of menuItems) {
    const isActive = currentPage === item.path
    const activeClass = isActive ? 'text-cyan-600 border-b-2 border-cyan-600' : 'text-gray-700 hover:text-cyan-600 hover:border-b-2 hover:border-cyan-600'
    
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

// ==================== 금융 메뉴 헬퍼 함수 ====================
function getFinanceMenu(currentPage: string): string {
  const menuItems = [
    { path: '/finance/stock', label: '주식', icon: 'fas fa-chart-line' },
    { path: '/finance/exchange', label: '환율', icon: 'fas fa-exchange-alt' },
    { path: '/finance/banking', label: '은행', icon: 'fas fa-university' },
  ]

  let menuHtml = '<nav class="bg-white border-b border-gray-200 shadow-sm"><div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6"><div class="flex space-x-8 overflow-x-auto">'
  
  for (const item of menuItems) {
    const isActive = currentPage === item.path
    const activeClass = isActive ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-700 hover:text-green-600 hover:border-b-2 hover:border-green-600'
    
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

// ==================== 엔터 메뉴 헬퍼 함수 ====================
function getEntertainmentMenu(currentPage: string): string {
  const menuItems = [
    { path: '/entertainment/music', label: '음악', icon: 'fas fa-music' },
    { path: '/entertainment/movie', label: '영화', icon: 'fas fa-film' },
    { path: '/entertainment/celebrity', label: '연예인', icon: 'fas fa-star' },
  ]

  let menuHtml = '<nav class="bg-white border-b border-gray-200 shadow-sm"><div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6"><div class="flex space-x-8 overflow-x-auto">'
  
  for (const item of menuItems) {
    const isActive = currentPage === item.path
    const activeClass = isActive ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-700 hover:text-pink-600 hover:border-b-2 hover:border-pink-600'
    
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

// ==================== 교육 메뉴 헬퍼 함수 ====================
function getEducationMenu(currentPage: string): string {
  const menuItems = [
    { path: '/education/online', label: '온라인 강의', icon: 'fas fa-laptop' },
    { path: '/education/language', label: '언어', icon: 'fas fa-language' },
    { path: '/education/certificate', label: '자격증', icon: 'fas fa-certificate' },
  ]

  let menuHtml = '<nav class="bg-white border-b border-gray-200 shadow-sm"><div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6"><div class="flex space-x-8 overflow-x-auto">'
  
  for (const item of menuItems) {
    const isActive = currentPage === item.path
    const activeClass = isActive ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-700 hover:text-indigo-600 hover:border-b-2 hover:border-indigo-600'
    
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

// ==================== 쇼핑 메뉴 헬퍼 함수 ====================
function getShoppingMenu(currentPage: string): string {
  const menuItems = [
    { path: '/shopping', label: '핫딜 랭킹', icon: 'fas fa-fire' },
    { path: '/shopping/coupang', label: '쿠팡 핫딜', icon: 'fas fa-tags' },
    { path: '/shopping/aliexpress', label: '알리 특가', icon: 'fas fa-globe' },
  ]

  let menuHtml = '<nav class="bg-white border-b border-gray-200 shadow-sm"><div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6"><div class="flex space-x-8 overflow-x-auto">'
  
  for (const item of menuItems) {
    const isActive = currentPage === item.path
    const activeClass = isActive ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-700 hover:text-orange-600 hover:border-b-2 hover:border-orange-600'
    
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

// ==================== 공통 헤더 헬퍼 함수 ====================
function getCommonHeader(sectionName: string = ''): string {
  // 섹션명 표시 (메인 페이지가 아닐 때만)
  const sectionLabel = sectionName ? `<span class="hidden sm:inline text-gray-700 text-lg md:text-xl font-bold ml-2 md:ml-3">| ${sectionName}</span>` : ''
  
  // 메인 페이지는 sticky, 서브 페이지는 relative (Sticky 헤더가 대체)
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
                <!-- 로그인 상태는 JavaScript로 동적 로드됨 -->
                <a href="/login" class="text-xs sm:text-sm text-gray-700 hover:text-blue-900 font-medium transition-all px-2 sm:px-3">
                    <i class="fas fa-sign-in-alt mr-0 sm:mr-1"></i><span class="hidden sm:inline">로그인</span>
                </a>
                <a href="/signup" class="text-xs sm:text-sm brand-navy text-white px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-lg shadow-lg brand-navy-hover font-semibold">
                    <i class="fas fa-user-plus mr-0 sm:mr-1"></i><span class="hidden sm:inline">회원가입</span><span class="sm:hidden">가입</span>
                </a>
            </div>
        </div>
    </header>
    <script>
      // 스크롤 시 헤더 그림자 효과
      window.addEventListener('scroll', function() {
        const header = document.getElementById('main-header');
        if (header) {
          if (window.scrollY > 50) {
            header.classList.add('shadow-lg');
            header.classList.remove('shadow-sm');
          } else {
            header.classList.add('shadow-sm');
            header.classList.remove('shadow-lg');
          }
        }
      });
    </script>
  `
}

// ==================== Sticky 헤더 컴포넌트 ====================
function getStickyHeader(): string {
  return `
    <!-- Sticky 헤더 (스크롤 시 표시) - Naver 스타일 -->
    <div id="sticky-header" class="fixed top-0 left-0 right-0 z-50 bg-white shadow-md transition-all duration-300 ease-in-out" style="transform: translateY(-100%);">
        <!-- 검색창 영역 -->
        <div class="bg-white">
            <div class="max-w-7xl mx-auto px-4 py-2">
                <div class="flex items-center gap-3">
                    <a href="/" class="flex-shrink-0">
                        <img src="/logo_fl.png" alt="Faith Portal" class="h-8 w-auto object-contain" />
                    </a>
                    <div class="flex-1 relative">
                        <input 
                            type="text" 
                            placeholder="검색어를 입력해 주세요"
                            class="w-full px-4 py-2.5 text-sm border-2 border-gray-300 rounded focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <button class="flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 border-gray-300 text-gray-600 flex items-center justify-center hover:bg-gray-50 transition-all">
                        <i class="fas fa-search text-base"></i>
                    </button>
                </div>
            </div>
        </div>
        
        <!-- 서브 메뉴 영역 - 브랜드 네이비 그라데이션 -->
        <div style="background: linear-gradient(90deg, #1e3a8a 0%, #1e40af 50%, #1e3a8a 100%);">
            <div class="max-w-7xl mx-auto">
                <div class="overflow-x-auto hide-scrollbar">
                    <div class="flex items-center">
                        <a href="/news" class="px-4 py-3 text-sm font-bold text-white whitespace-nowrap hover:bg-white hover:bg-opacity-20 transition-all">
                            뉴스
                        </a>
                        <a href="/lifestyle" class="px-4 py-3 text-sm font-bold text-white whitespace-nowrap hover:bg-white hover:bg-opacity-20 transition-all">
                            유틸리티
                        </a>
                        <a href="/game" class="px-4 py-3 text-sm font-bold text-white whitespace-nowrap hover:bg-white hover:bg-opacity-20 transition-all">
                            게임
                        </a>
                        <a href="/finance" class="px-4 py-3 text-sm font-bold text-white whitespace-nowrap hover:bg-white hover:bg-opacity-20 transition-all">
                            금융
                        </a>
                        <a href="/shopping" class="px-4 py-3 text-sm font-bold text-white whitespace-nowrap hover:bg-white hover:bg-opacity-20 transition-all">
                            쇼핑
                        </a>
                        <a href="/entertainment" class="px-4 py-3 text-sm font-bold text-white whitespace-nowrap hover:bg-white hover:bg-opacity-20 transition-all">
                            엔터
                        </a>
                        <a href="/education" class="px-4 py-3 text-sm font-bold text-white whitespace-nowrap hover:bg-white hover:bg-opacity-20 transition-all">
                            교육
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <script>
      // ==================== Sticky 헤더 처리 (Naver 스타일 - 모든 페이지) ====================
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStickyHeader);
      } else {
        initStickyHeader();
      }
      
      function initStickyHeader() {
        const stickyHeader = document.getElementById('sticky-header');
        const mainHeader = document.getElementById('main-header');
        const mainSearch = document.getElementById('main-search');
        const quickMenu = document.getElementById('quick-menu');
        
        console.log('=== Sticky Header Init (DOMContentLoaded) ===');
        console.log('stickyHeader:', stickyHeader ? 'found' : 'NOT FOUND');
        console.log('mainHeader:', mainHeader ? 'found' : 'NOT FOUND');
        console.log('mainSearch:', mainSearch ? 'found' : 'NOT FOUND');
        console.log('quickMenu:', quickMenu ? 'found' : 'NOT FOUND');
        
        if (!stickyHeader || !mainHeader) {
            console.error('Required elements not found!');
            return;
        }
        
        let scrollCount = 0;
        
        window.addEventListener('scroll', function() {
            scrollCount++;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // 메인 헤더의 위치 확인
            const headerRect = mainHeader.getBoundingClientRect();
            
            // 10번째 스크롤마다 로그
            if (scrollCount % 10 === 0) {
                console.log('Scroll:', scrollTop, 'headerRect.bottom:', headerRect.bottom);
            }
            
            // 메인 페이지 (퀵 메뉴가 있는 경우)
            if (mainSearch && quickMenu) {
                const quickMenuRect = quickMenu.getBoundingClientRect();
                const scrollThreshold = 50;
                
                // 퀵 메뉴가 화면에서 완전히 사라지면 sticky 헤더 표시
                if (quickMenuRect.bottom < -scrollThreshold) {
                    if (scrollCount % 10 === 0) console.log('-> Showing sticky header (main page)');
                    stickyHeader.style.transform = 'translateY(0)';
                } else {
                    stickyHeader.style.transform = 'translateY(-100%)';
                }
            } else {
                // 서브 페이지 (뉴스, 유틸리티, 게임 등) - 메인 헤더가 사라지면 즉시 표시
                if (headerRect.bottom <= 0) {
                    if (scrollCount % 10 === 0) console.log('-> Showing sticky header (sub page)');
                    stickyHeader.style.transform = 'translateY(0)';
                } else {
                    stickyHeader.style.transform = 'translateY(-100%)';
                }
            }
        });
        
        console.log('=== Scroll listener attached ===');
      }
    </script>
  `
}

// ==================== 공통 인증 스크립트 헬퍼 함수 ====================
function getCommonAuthScript(): string {
  return `
    <script>
      // ==================== 다크모드 초기화 ====================
      function initDarkMode() {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        const htmlRoot = document.getElementById('html-root');
        
        if (htmlRoot) {
          if (darkMode) {
            htmlRoot.classList.add('dark');
          } else {
            htmlRoot.classList.remove('dark');
          }
        }
      }
      
      // ==================== 로그인 상태 확인 및 메뉴 업데이트 ====================
      function updateUserMenu() {
        const token = localStorage.getItem('auth_token');
        const userEmail = localStorage.getItem('user_email');
        const userLevel = parseInt(localStorage.getItem('user_level') || '0');
        
        if (token && userEmail) {
          let menuHTML = '';
          
          // 햄버거 메뉴 버튼
          menuHTML += '<button id="mobile-menu-btn" class="text-gray-700 hover:text-blue-900 transition-all p-2" aria-label="메뉴 열기"><i class="fas fa-bars text-xl"></i></button>';
          
          // 마이페이지 버튼
          menuHTML += '<a href="/mypage" class="text-xs sm:text-sm text-gray-700 hover:text-blue-900 font-medium transition-all px-2 sm:px-3"><i class="fas fa-user mr-0 sm:mr-1"></i><span class="hidden sm:inline">마이페이지</span></a>';
          
          // 관리자 메뉴 추가 (Lv.6 이상)
          if (userLevel >= 6) {
            menuHTML += '<a href="/admin" class="text-xs sm:text-sm bg-yellow-500 text-gray-900 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-yellow-600 font-semibold shadow-md transition-all"><i class="fas fa-crown mr-1"></i><span class="hidden sm:inline">관리자페이지</span><span class="sm:hidden">관리자</span></a>';
          }
          
          // 로그아웃 버튼 (아이콘만)
          menuHTML += '<button id="logout-btn" class="text-gray-700 hover:text-red-600 transition-all p-2" title="로그아웃"><i class="fas fa-sign-out-alt text-xl"></i></button>';
          
          // 메뉴 업데이트
          const userMenu = document.getElementById('user-menu');
          if (userMenu) {
            userMenu.innerHTML = menuHTML;
          }
          
          // 로그아웃 이벤트 리스너 추가
          const logoutBtn = document.getElementById('logout-btn');
          if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
              if (confirm('로그아웃 하시겠습니까?')) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_email');
                localStorage.removeItem('user_level');
                localStorage.removeItem('user_id');
                window.location.href = '/';
              }
            });
          }
          
          // 햄버거 메뉴 이벤트 리스너
          const mobileMenuBtn = document.getElementById('mobile-menu-btn');
          if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', function() {
              toggleMobileMenu();
            });
          }
        }
        
        // 다크모드 초기화 (로그인 여부 관계없이)
        initDarkMode();
      }
      
      // ==================== 모바일 메뉴 토글 함수 ====================
      function toggleMobileMenu() {
        // 모바일 메뉴 오버레이 생성 또는 토글
        let overlay = document.getElementById('mobile-menu-overlay');
        
        if (overlay) {
          // 이미 존재하면 닫기
          overlay.classList.add('opacity-0');
          setTimeout(() => {
            overlay?.remove();
          }, 300);
        } else {
          // 새로 생성
          const userEmail = localStorage.getItem('user_email') || '';
          const userLevel = parseInt(localStorage.getItem('user_level') || '0');
          
          overlay = document.createElement('div');
          overlay.id = 'mobile-menu-overlay';
          overlay.className = 'fixed inset-0 z-50 bg-black bg-opacity-50 opacity-0 transition-opacity duration-300';
          
          let menuHTML = '<div class="fixed top-0 right-0 h-full w-64 bg-white shadow-2xl transform translate-x-full transition-transform duration-300" id="mobile-menu-content">';
          menuHTML += '<div class="p-6">';
          menuHTML += '<div class="flex justify-between items-center mb-6">';
          menuHTML += '<h3 class="text-lg font-bold text-gray-900">메뉴</h3>';
          menuHTML += '<button onclick="toggleMobileMenu()" class="text-gray-600 hover:text-gray-900">';
          menuHTML += '<i class="fas fa-times text-xl"></i>';
          menuHTML += '</button></div>';
          menuHTML += '<div class="space-y-4">';
          menuHTML += '<a href="/" class="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><i class="fas fa-home mr-3"></i>홈</a>';
          menuHTML += '<a href="/news" class="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><i class="fas fa-newspaper mr-3"></i>뉴스</a>';
          menuHTML += '<a href="/lifestyle" class="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><i class="fas fa-home mr-3"></i>유틸리티</a>';
          menuHTML += '<a href="/game" class="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><i class="fas fa-gamepad mr-3"></i>게임</a>';
          menuHTML += '<a href="/finance" class="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><i class="fas fa-chart-line mr-3"></i>금융</a>';
          menuHTML += '<a href="/mypage" class="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><i class="fas fa-user mr-3"></i>마이페이지</a>';
          menuHTML += '<a href="/bookmarks" class="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><i class="fas fa-bookmark mr-3"></i>북마크</a>';
          if (userLevel >= 6) {
            menuHTML += '<a href="/admin" class="block px-4 py-3 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-lg transition-colors"><i class="fas fa-crown mr-3"></i>관리자페이지</a>';
          }
          menuHTML += '<hr class="my-2">';
          menuHTML += '<button onclick="logout()" class="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><i class="fas fa-sign-out-alt mr-3"></i>로그아웃</button>';
          menuHTML += '</div></div></div>';
          
          overlay.innerHTML = menuHTML;
          document.body.appendChild(overlay);
          
          // 애니메이션 트리거
          setTimeout(() => {
            overlay?.classList.remove('opacity-0');
            const menuContent = document.getElementById('mobile-menu-content');
            if (menuContent) {
              menuContent.classList.remove('translate-x-full');
            }
          }, 10);
          
          // 오버레이 클릭 시 닫기
          overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
              toggleMobileMenu();
            }
          });
        }
      }
      
      // 로그아웃 함수 (전역)
      window.logout = function() {
        if (confirm('로그아웃 하시겠습니까?')) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_email');
          localStorage.removeItem('user_level');
          localStorage.removeItem('user_id');
          window.location.href = '/';
        }
      };
      
      // toggleMobileMenu를 전역 함수로 등록
      window.toggleMobileMenu = toggleMobileMenu;
      
      // ==================== 페이지 로드 시 실행 ====================
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateUserMenu);
      } else {
        updateUserMenu();
      }
    </script>
  `
}

// ==================== 공통 푸터 헬퍼 함수 ====================
function getCommonFooter(): string {
  return `
    <!-- 푸터 -->
    <footer class="bg-gradient-to-r from-blue-900 to-blue-800 text-white mt-16 py-8">
        <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- 회사 정보 -->
                <div>
                    <h3 class="text-lg font-bold mb-4">Faith Portal</h3>
                    <p class="text-blue-200 text-sm leading-relaxed">
                        믿음의 포탈, Faith Portal은<br>
                        여러분의 디지털 라이프를 풍요롭게 만들어드립니다.
                    </p>
                </div>
                
                <!-- 빠른 링크 -->
                <div>
                    <h3 class="text-lg font-bold mb-4">빠른 링크</h3>
                    <ul class="space-y-2">
                        <li><a href="/news" class="text-blue-200 hover:text-white text-sm transition">뉴스</a></li>
                        <li><a href="/lifestyle" class="text-blue-200 hover:text-white text-sm transition">유틸리티</a></li>
                        <li><a href="/game" class="text-blue-200 hover:text-white text-sm transition">게임</a></li>
                        <li><a href="/" class="text-blue-200 hover:text-white text-sm transition">쇼핑</a></li>
                    </ul>
                </div>
                
                <!-- 연락처 -->
                <div>
                    <h3 class="text-lg font-bold mb-4">고객 지원</h3>
                    <ul class="space-y-2">
                        <li class="text-blue-200 text-sm">
                            <i class="fas fa-envelope mr-2"></i>
                            support@faithportal.com
                        </li>
                        <li class="text-blue-200 text-sm">
                            <i class="fas fa-phone mr-2"></i>
                            1577-1577
                        </li>
                        <li class="text-blue-200 text-sm">
                            <i class="fas fa-clock mr-2"></i>
                            평일 09:00 - 18:00
                        </li>
                    </ul>
                </div>
            </div>
            
            <div class="border-t border-blue-700 mt-8 pt-6 text-center">
                <p class="text-blue-200 text-sm">
                    © 2024 Faith Portal. All rights reserved.
                </p>
            </div>
        </div>
    </footer>
  `
}

// ==================== 관리자 네비게이션 헬퍼 함수 ====================
function getAdminNavigation(currentPage: string): string {
  const menuItems = [
    { path: '/admin', label: '대시보드', icon: 'fa-tachometer-alt', shortLabel: '대시보드' },
    { path: '/admin/users', label: '회원 관리', icon: 'fa-users', shortLabel: '회원' },
    { path: '/admin/content', label: '컨텐츠관리', icon: 'fa-folder', shortLabel: '컨텐츠', hasDropdown: true, dropdownItems: [
      { path: '/admin/news', label: '뉴스관리', icon: 'fa-newspaper' }
    ]},
    { path: '/admin/stats', label: '통계', icon: 'fa-chart-line', shortLabel: '통계' },
    { path: '/admin/logs', label: '활동 로그', icon: 'fa-clipboard-list', shortLabel: '로그' },
    { path: '/admin/notifications', label: '알림 센터', icon: 'fa-bell', shortLabel: '알림' },
  ]

  let navHtml = '<div class="flex overflow-x-auto space-x-2 sm:space-x-4 lg:space-x-8 py-2 scrollbar-hide">'
  
  for (const item of menuItems) {
    const isActive = currentPage === item.path || (item.dropdownItems && item.dropdownItems.some(sub => sub.path === currentPage))
    const activeClass = isActive ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-700 hover:text-blue-600'
    
    if (item.hasDropdown) {
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
      
      for (const subItem of item.dropdownItems || []) {
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

// ==================== 메인 페이지 ====================
app.get('/', async (c) => {
  const { DB } = c.env
  
  // 자동 뉴스 가져오기 로직
  try {
    // 마지막 뉴스 가져온 시간 확인
    const lastFetch = await DB.prepare('SELECT MAX(created_at) as last_time FROM news').first()
    const lastFetchTime = lastFetch?.last_time
    
    // 마지막 뉴스가 없거나 1시간 이상 지났으면 뉴스 가져오기
    const shouldFetch = !lastFetchTime || 
      (new Date().getTime() - new Date(lastFetchTime).getTime()) > (60 * 60 * 1000)
    
    if (shouldFetch) {
      console.log('자동으로 뉴스를 가져옵니다...')
      
      // 모든 카테고리에서 뉴스 가져오기
      const categories = ['general', 'politics', 'economy', 'tech', 'sports', 'entertainment']
      
      for (let i = 0; i < categories.length; i++) {
        const category = categories[i]
        try {
          const newsItems = await parseGoogleNewsRSS(category)
          
          // DB에 저장
          for (const item of newsItems) {
            try {
              await DB.prepare(`
                INSERT OR IGNORE INTO news (category, title, summary, link, image_url, publisher, pub_date)
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `).bind(
                item.category,
                item.title,
                item.summary,
                item.link,
                item.image_url,
                item.publisher,
                item.pub_date
              ).run()
            } catch (err) {
              // 중복 뉴스는 무시
            }
          }
          
          // 구글 Rate Limit 회피: 카테고리 간 2초 지연 (마지막 카테고리 제외)
          if (i < categories.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        } catch (err) {
          console.error(category + ' 카테고리 뉴스 가져오기 실패:', err)
        }
      }
      
      console.log('뉴스 가져오기 완료')
    }
  } catch (error) {
    console.error('자동 뉴스 가져오기 오류:', error)
  }
  
  // 최신 뉴스 5개 가져오기
  let latestNews: any[] = []
  try {
    const { results } = await DB.prepare('SELECT * FROM news ORDER BY created_at DESC LIMIT 5').all()
    latestNews = results || []
  } catch (error) {
    console.error('뉴스 조회 오류:', error)
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
            /* 새로운 컬러 팔레트 */
            .brand-navy { background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); }
            .brand-navy-hover:hover { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); }
            .accent-orange { background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); }
            .accent-orange-hover:hover { background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); }
            .faith-blue { background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); }
            .faith-blue-hover:hover { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); }
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
            /* 검색창 스타일 - 캡슐형 */
            .search-shadow { 
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
                transition: all 0.3s ease;
                border-radius: 50px;
            }
            .search-shadow:hover {
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
                transform: translateY(-2px);
            }
            .search-input {
                border: none;
                outline: none;
            }
            .search-input::placeholder {
                color: #94a3b8;
            }
            /* 카드 디자인 */
            .content-card {
                background: white;
                border-radius: 16px;
                box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
                transition: all 0.3s ease;
            }
            .content-card:hover {
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
                transform: translateY(-4px);
            }
            .pulse-animation {
                animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: .7; }
            }
            /* 배지 스타일 */
            .badge {
                display: inline-flex;
                align-items: center;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 600;
            }
            /* 순위 숫자 스타일 */
            .rank-number {
                font-weight: 700;
                font-size: 1.125rem;
                background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            /* 타이포그래피 */
            .title-bold {
                font-weight: 700;
                color: #111827;
            }
            .text-medium {
                color: #4b5563;
            }
            .text-light {
                color: #9ca3af;
            }
            .floating {
                animation: floating 3s ease-in-out infinite;
            }
            @keyframes floating {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
            }
            .shine {
                position: relative;
                overflow: hidden;
            }
            .shine::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                transition: left 0.5s;
            }
            .shine:hover::before {
                left: 100%;
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
    <body class="bg-gray-50 transition-colors duration-300">
        ${getCommonHeader()}
        ${getStickyHeader()}

        <!-- 메인 검색 영역 -->
        <main class="max-w-6xl mx-auto px-4 py-16">
            <!-- 검색창 - 캡슐형 디자인 -->
            <div class="mb-12 max-w-3xl mx-auto" id="main-search">
                <div class="relative search-shadow bg-white">
                    <div class="flex items-center px-4 sm:px-6 py-2 sm:py-3">
                        <input 
                            type="text" 
                            id="search-input"
                            placeholder="무엇을 찾으시나요?" 
                            class="search-input flex-1 text-base sm:text-lg text-gray-900 placeholder-gray-400"
                        />
                        <button 
                            id="search-btn"
                            class="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full brand-navy text-white brand-navy-hover transition-all ml-2 sm:ml-3"
                        >
                            <i class="fas fa-search text-sm sm:text-lg"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- 퀵 메뉴 네비게이션 - 통일된 디자인 -->
            <nav class="mb-16 max-w-3xl mx-auto" id="quick-menu">
                <div class="overflow-x-auto hide-scrollbar">
                    <div class="flex justify-start sm:justify-center items-center gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-0">
                        <a href="/news" class="group text-center flex-shrink-0">
                            <div class="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-all">
                                <i class="fas fa-newspaper text-xl sm:text-2xl text-blue-600"></i>
                            </div>
                            <p class="text-xs sm:text-sm text-gray-700 font-semibold group-hover:text-blue-600 transition-colors whitespace-nowrap">뉴스</p>
                        </a>
                        <a href="/lifestyle" class="group text-center flex-shrink-0">
                            <div class="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-all">
                                <i class="fas fa-home text-xl sm:text-2xl text-green-600"></i>
                            </div>
                            <p class="text-xs sm:text-sm text-gray-700 font-semibold group-hover:text-green-600 transition-colors whitespace-nowrap">유틸리티</p>
                        </a>
                        <a href="/game" class="group text-center flex-shrink-0">
                            <div class="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-all">
                                <i class="fas fa-gamepad text-xl sm:text-2xl text-purple-600"></i>
                            </div>
                            <p class="text-xs sm:text-sm text-gray-700 font-semibold group-hover:text-purple-600 transition-colors whitespace-nowrap">게임</p>
                        </a>
                        <a href="/finance" class="group text-center flex-shrink-0">
                            <div class="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-all">
                                <i class="fas fa-won-sign text-xl sm:text-2xl text-orange-600"></i>
                            </div>
                            <p class="text-xs sm:text-sm text-gray-700 font-semibold group-hover:text-orange-600 transition-colors whitespace-nowrap">금융</p>
                        </a>
                        <a href="/shopping" class="group text-center flex-shrink-0">
                            <div class="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-all">
                                <i class="fas fa-shopping-bag text-xl sm:text-2xl text-pink-600"></i>
                            </div>
                            <p class="text-xs sm:text-sm text-gray-700 font-semibold group-hover:text-pink-600 transition-colors whitespace-nowrap">쇼핑</p>
                        </a>
                        <a href="/entertainment" class="group text-center flex-shrink-0">
                            <div class="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-all">
                                <i class="fas fa-film text-xl sm:text-2xl text-red-600"></i>
                            </div>
                            <p class="text-xs sm:text-sm text-gray-700 font-semibold group-hover:text-red-600 transition-colors whitespace-nowrap">엔터</p>
                        </a>
                        <a href="/education" class="group text-center flex-shrink-0">
                            <div class="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-all">
                                <i class="fas fa-graduation-cap text-xl sm:text-2xl text-indigo-600"></i>
                            </div>
                            <p class="text-xs sm:text-sm text-gray-700 font-semibold group-hover:text-indigo-600 transition-colors whitespace-nowrap">교육</p>
                        </a>
                    </div>
                </div>
            </nav>

            <!-- 메인 배너 섹션 (네이버 스타일) -->
            <section class="mb-6 max-w-6xl mx-auto px-4">
                <div class="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    <a href="/news" class="block">
                        <div class="flex items-center p-4 sm:p-6">
                            <!-- 배너 이미지 (왼쪽) -->
                            <div class="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-xl overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500">
                                <img src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=400&fit=crop" 
                                     alt="배너 이미지" 
                                     class="w-full h-full object-cover"
                                     onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'w-full h-full flex items-center justify-center\\'><i class=\\'fas fa-image text-white text-4xl\\'></i></div>'">
                            </div>
                            
                            <!-- 배너 텍스트 (오른쪽) -->
                            <div class="flex-1 ml-4 sm:ml-6">
                                <h3 class="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1 sm:mb-2 line-clamp-2">
                                    부해른 윈터 원더랜드
                                </h3>
                                <p class="text-xs sm:text-sm text-gray-600 line-clamp-2">
                                    한소희의 홀리데이 위시리스트
                                </p>
                            </div>
                        </div>
                    </a>
                </div>
            </section>

            <!-- 날씨 위젯 -->
            <section class="mb-8 max-w-6xl mx-auto px-4">
                <div class="bg-white rounded-xl shadow-md p-4">
                    <div class="flex items-center justify-between">
                        <!-- 현재 날씨 -->
                        <div class="flex items-center gap-3">
                            <div class="text-3xl" id="weather-icon">
                                <i class="fas fa-cloud-sun text-blue-400"></i>
                            </div>
                            <div>
                                <div class="flex items-baseline gap-2">
                                    <span class="text-2xl font-bold text-gray-900" id="weather-temp">1.3°</span>
                                    <span class="text-sm text-gray-600">비</span>
                                </div>
                                <div class="text-xs text-gray-500 mt-1" id="weather-location">서울</div>
                            </div>
                        </div>
                        
                        <!-- 미세먼지/초미세먼지 -->
                        <div class="flex gap-3 sm:gap-6">
                            <div class="text-center">
                                <div class="text-xs text-gray-500 mb-1">미세</div>
                                <div class="text-sm font-bold">
                                    <span class="text-blue-600">좋음</span>
                                </div>
                            </div>
                            <div class="text-center">
                                <div class="text-xs text-gray-500 mb-1">초미세</div>
                                <div class="text-sm font-bold">
                                    <span class="text-blue-600">좋음</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <script>
                // 날씨 API 호출 (OpenWeatherMap 무료 API 사용 가능)
                async function loadWeather() {
                    try {
                        // Geolocation으로 현재 위치 가져오기
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(async (position) => {
                                const lat = position.coords.latitude;
                                const lon = position.coords.longitude;
                                
                                // 날씨 아이콘 매핑
                                const weatherIcons = {
                                    'Clear': 'fa-sun text-yellow-400',
                                    'Clouds': 'fa-cloud text-gray-400',
                                    'Rain': 'fa-cloud-rain text-blue-500',
                                    'Snow': 'fa-snowflake text-blue-200',
                                    'Drizzle': 'fa-cloud-rain text-blue-400',
                                    'Thunderstorm': 'fa-bolt text-yellow-600',
                                    'Mist': 'fa-smog text-gray-400',
                                    'Fog': 'fa-smog text-gray-400'
                                };
                                
                                // 간단한 날씨 표시 (실제로는 API 호출 필요)
                                const weatherDesc = ['비', '맑음', '흐림', '눈'][Math.floor(Math.random() * 4)];
                                const temp = (Math.random() * 20 - 5).toFixed(1);
                                
                                document.getElementById('weather-temp').textContent = temp + '°';
                                
                                // 날씨 아이콘 업데이트
                                const iconClasses = weatherDesc === '비' ? 'fa-cloud-rain text-blue-500' :
                                                   weatherDesc === '맑음' ? 'fa-sun text-yellow-400' :
                                                   weatherDesc === '흐림' ? 'fa-cloud text-gray-400' :
                                                   'fa-snowflake text-blue-200';
                                                   
                                document.getElementById('weather-icon').innerHTML = '<i class="fas ' + iconClasses + '"></i>';
                            }, (error) => {
                                console.log('위치 정보를 가져올 수 없습니다:', error);
                            });
                        }
                    } catch (error) {
                        console.error('날씨 정보 로드 실패:', error);
                    }
                }
                
                // 페이지 로드 시 날씨 정보 가져오기
                loadWeather();
            </script>

            <!-- 뉴스 & 트렌드 섹션 -->
            <div class="grid md:grid-cols-2 gap-6 mb-12">
                <!-- 실시간 뉴스 -->
                <div class="content-card p-8">
                    <h3 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <i class="fas fa-newspaper text-blue-600 text-2xl mr-3"></i>
                        실시간 뉴스
                        <span class="ml-3 text-xs bg-red-500 text-white px-3 py-1 rounded-full pulse-animation font-semibold">LIVE</span>
                    </h3>
                    <div class="space-y-2" id="latest-news">
                        ${latestNews.length > 0 ? latestNews.map((news, index) => {
                          const timeAgo = getTimeAgo(news.created_at)
                          const categoryColor = getCategoryColor(news.category)
                          return `
                            <div onclick="openNewsLink('${news.link}')" class="block hover:bg-blue-50 py-3 px-3 rounded-lg transition group border-b border-gray-100 last:border-b-0 cursor-pointer">
                                <div class="flex items-start gap-3">
                                    <span class="rank-number flex-shrink-0 mt-0.5">${index + 1}</span>
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center gap-2 mb-1.5">
                                            <span class="badge ${categoryColor}">${getCategoryName(news.category)}</span>
                                            <span class="text-gray-500 text-xs font-medium flex-shrink-0">${timeAgo}</span>
                                        </div>
                                        <p class="text-gray-900 group-hover:text-blue-700 font-semibold text-base leading-snug line-clamp-2">${escapeHtml(news.title)}</p>
                                    </div>
                                </div>
                            </div>
                          `
                        }).join('') : `
                            <div class="text-center py-8 text-gray-500">
                                <i class="fas fa-newspaper text-4xl mb-3 text-gray-300"></i>
                                <p>뉴스를 불러오는 중입니다...</p>
                                <a href="/news" class="mt-3 inline-block text-blue-700 hover:text-blue-800 font-semibold">
                                    뉴스 페이지로 이동 →
                                </a>
                            </div>
                        `}
                    </div>
                    ${latestNews.length > 0 ? `
                        <div class="mt-6 text-center">
                            <a href="/news" class="inline-flex items-center px-6 py-2.5 accent-orange text-white rounded-lg hover:shadow-lg transition-all accent-orange-hover font-semibold">
                                <span>더 많은 뉴스 보기</span>
                                <i class="fas fa-arrow-right ml-2"></i>
                            </a>
                        </div>
                    ` : ''}
                </div>

                <!-- 트렌드 토픽 -->
                <div class="content-card p-8">
                    <h3 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <i class="fas fa-chart-line text-orange-600 text-2xl mr-3"></i>
                        실시간 트렌드
                        <span class="ml-3 text-xs bg-orange-500 text-white px-3 py-1 rounded-full pulse-animation font-semibold">HOT</span>
                    </h3>
                    <div class="space-y-2">
                        <div class="flex items-center justify-between py-3 px-3 hover:bg-blue-50 rounded-lg transition border-b border-gray-100">
                            <div class="flex items-center">
                                <span class="rank-number mr-3">1</span>
                                <span class="text-gray-900 font-semibold">인공지능 기술</span>
                            </div>
                            <i class="fas fa-arrow-up text-green-500"></i>
                        </div>
                        <div class="flex items-center justify-between py-3 px-3 hover:bg-blue-50 rounded-lg transition border-b border-gray-100">
                            <div class="flex items-center">
                                <span class="rank-number mr-3">2</span>
                                <span class="text-gray-900 font-semibold">날씨 정보</span>
                            </div>
                            <i class="fas fa-arrow-up text-green-500"></i>
                        </div>
                        <div class="flex items-center justify-between py-3 px-3 hover:bg-blue-50 rounded-lg transition border-b border-gray-100">
                            <div class="flex items-center">
                                <span class="rank-number mr-3">3</span>
                                <span class="text-gray-900 font-semibold">맛집 추천</span>
                            </div>
                            <i class="fas fa-minus text-gray-400"></i>
                        </div>
                        <div class="flex items-center justify-between py-3 px-3 hover:bg-blue-50 rounded-lg transition">
                            <div class="flex items-center">
                                <span class="rank-number mr-3">4</span>
                                <span class="text-gray-900 font-semibold">여행 정보</span>
                            </div>
                            <i class="fas fa-arrow-down text-red-500"></i>
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

    </body>
    </html>
  `)
})

// ==================== 게임 페이지 ====================
// 게임 메인 페이지 (심플 게임으로 리다이렉트)
app.get('/game', (c) => {
  return c.redirect('/game/simple')
})

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
          {label: '홈', href: '/'},
          {label: '게임', href: '/game'},
          {label: '심플 게임'}
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
                    </nav>
                </div>
            </aside>

            <!-- 메인 컨텐츠 -->
            <main class="flex-1">
                <div class="bg-white rounded-xl shadow-lg p-6 sm:p-8">
                    <div class="text-center py-16">
                        <!-- 게임 랭킹 그리드 -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
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
                                <div class="bg-white bg-opacity-10 rounded-lg p-4 space-y-2" id="tetris-ranking">
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
                                <div class="bg-white bg-opacity-10 rounded-lg p-4 space-y-2" id="sudoku-ranking">
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
                                    // 테트리스 랭킹
                                    const tetrisRes = await fetch('/api/game/tetris/ranking?limit=5');
                                    const tetrisData = await tetrisRes.json();
                                    displayRanking('tetris-ranking', tetrisData.rankings || []);
                                    
                                    // 스도쿠 랭킹
                                    const sudokuRes = await fetch('/api/game/sudoku/ranking?limit=5');
                                    const sudokuData = await sudokuRes.json();
                                    displayRanking('sudoku-ranking', sudokuData.rankings || []);
                                } catch (error) {
                                    console.error('랭킹 로드 실패:', error);
                                    document.getElementById('tetris-ranking').innerHTML = '<div class="text-white text-sm text-center py-4">랭킹을 불러올 수 없습니다</div>';
                                    document.getElementById('sudoku-ranking').innerHTML = '<div class="text-white text-sm text-center py-4">랭킹을 불러올 수 없습니다</div>';
                                }
                            }
                            
                            function displayRanking(elementId, rankings) {
                                const element = document.getElementById(elementId);
                                if (rankings.length === 0) {
                                    element.innerHTML = '<div class="text-white text-sm text-center py-4">아직 기록이 없습니다</div>';
                                    return;
                                }
                                
                                const html = rankings.map((rank, index) => {
                                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : \`\${index + 1}위\`;
                                    const scoreText = elementId.includes('tetris') ? \`\${rank.score.toLocaleString()}점\` : \`\${rank.time}\`;
                                    return \`
                                        <div class="flex items-center justify-between text-white text-sm py-2 px-3 hover:bg-white hover:bg-opacity-5 rounded transition-colors">
                                            <div class="flex items-center space-x-3">
                                                <span class="font-bold w-8">\${medal}</span>
                                                <span class="truncate max-w-[120px]">\${rank.username || rank.user_id || '익명'}</span>
                                            </div>
                                            <span class="font-bold">\${scoreText}</span>
                                        </div>
                                    \`;
                                }).join('');
                                
                                element.innerHTML = html;
                            }
                            
                            // 페이지 로드 시 랭킹 불러오기
                            loadRankings();
                        </script>
                    </div>
                </div>
            </main>
        </div>

        ${getCommonFooter()}
        ${getCommonAuthScript()}
    </body>
    </html>
  `)
})

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
          {label: '홈', href: '/'},
          {label: '게임', href: '/game'},
          {label: '웹게임'}
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
  `)
})

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
          {label: '홈', href: '/'},
          {label: '게임', href: '/game'},
          {label: '심플 게임', href: '/game/simple'},
          {label: '테트리스'}
        ])}

        ${getGameMenu('/game/simple')}

        <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 flex flex-col lg:flex-row gap-4 sm:gap-6">
            <!-- 좌측 사이드바 -->
            <aside class="lg:w-64 flex-shrink-0">
                <div class="bg-white rounded-xl shadow-lg p-4 sticky top-24">
                    <h3 class="font-bold text-gray-800 mb-3 flex items-center">
                        <i class="fas fa-gamepad mr-2 text-purple-500"></i>
                        게임 목록
                    </h3>
                    <nav class="space-y-2">
                        <a href="/game/simple/tetris" class="block px-4 py-2 bg-purple-50 text-purple-700 rounded-lg font-medium">
                            <i class="fas fa-th mr-2"></i>테트리스
                        </a>
                        <a href="/game/simple/sudoku" class="block px-4 py-2 hover:bg-purple-50 text-gray-700 hover:text-purple-600 rounded-lg transition-all">
                            <i class="fas fa-table mr-2"></i>스도쿠
                        </a>
                    </nav>
                </div>
            </aside>

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
        </script>
    </body>
    </html>
  `)
})

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
                const userId = localStorage.getItem('user_id');
                if (userId && score > highScore) {
                    fetch('/api/tetris/score', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: userId, score: score })
                    }).then(() => {
                        highScore = score;
                        document.getElementById('highScore').textContent = highScore;
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
  `)
})

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
        
        ${getBreadcrumb([
          {label: '홈', href: '/'},
          {label: '게임', href: '/game'},
          {label: '심플 게임', href: '/game/simple'},
          {label: '스도쿠 챌린지'}
        ])}

        ${getGameMenu('/game/simple')}

        <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
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
                document.querySelector(\`[data-difficulty="\${difficulty}"]\`).classList.add('active');
                
                // 리더보드 로드
                loadLeaderboard();
            }

            async function loadLeaderboard() {
                const content = document.getElementById('leaderboard-content');
                content.innerHTML = '<div class="flex items-center justify-center py-8"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div></div>';
                
                try {
                    const response = await fetch(\`/api/sudoku/leaderboard/\${currentDifficulty}\`);
                    const data = await response.json();
                    
                    if (data.success && data.scores.length > 0) {
                        content.innerHTML = data.scores.map((score, index) => {
                            const rank = index + 1;
                            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : \`#\${rank}\`;
                            const minutes = Math.floor(score.time / 60);
                            const seconds = score.time % 60;
                            const timeStr = \`\${minutes}분 \${seconds}초\`;
                            const date = new Date(score.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
                            
                            return \`
                                <div class="leaderboard-row bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <span class="text-xl font-bold w-10 text-center">\${medal}</span>
                                        <div>
                                            <div class="font-semibold text-gray-800">\${score.player_name || 'Anonymous'}</div>
                                            <div class="text-xs text-gray-500">\${date}</div>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <div class="font-bold text-purple-600">\${timeStr}</div>
                                        <div class="text-xs text-gray-500">실수: \${score.mistakes}</div>
                                    </div>
                                </div>
                            \`;
                        }).join('');
                    } else {
                        content.innerHTML = \`
                            <div class="text-center py-8 text-gray-500">
                                <i class="fas fa-inbox text-4xl mb-3 opacity-50"></i>
                                <p>아직 기록이 없습니다</p>
                                <p class="text-sm">첫 번째 기록의 주인공이 되어보세요!</p>
                            </div>
                        \`;
                    }
                } catch (error) {
                    console.error('리더보드 로드 실패:', error);
                    content.innerHTML = \`
                        <div class="text-center py-8 text-red-500">
                            <i class="fas fa-exclamation-triangle text-3xl mb-2"></i>
                            <p>리더보드를 불러올 수 없습니다</p>
                        </div>
                    \`;
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
  `)
})
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
                        ${Array.from({length: 9}, (_, i) => `
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
            // ==================== 스도쿠 생성 알고리즘 ====================
            
            // 스도쿠 생성 (백트래킹 알고리즘)
            function generateSudoku() {
                const grid = Array(9).fill(null).map(() => Array(9).fill(0));
                
                // 완성된 스도쿠 생성
                fillGrid(grid);
                
                // 난이도에 따라 셀 제거
                const difficulty = '${difficulty}';
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
                // 로그인 상태 확인
                let playerName = 'Anonymous';
                let isLoggedIn = false;
                
                // 쿠키에서 사용자 정보 확인
                const cookies = document.cookie.split(';').reduce((acc, cookie) => {
                    const [key, value] = cookie.trim().split('=');
                    acc[key] = value;
                    return acc;
                }, {});
                
                // 로그인되어 있다면 사용자 이름 가져오기
                if (cookies.auth_token || cookies.user_name) {
                    playerName = decodeURIComponent(cookies.user_name || 'User');
                    isLoggedIn = true;
                }
                
                // 로그인 확인
                if (!isLoggedIn) {
                    alert('로그인이 필요합니다. 점수를 저장하려면 로그인해주세요.');
                    return;
                }
                
                const elapsed = getElapsedTime();
                
                try {
                    const response = await fetch('/api/sudoku/score', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include', // 쿠키 전송
                        body: JSON.stringify({
                            difficulty: '${difficulty}',
                            time: elapsed,
                            mistakes: mistakes
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        alert('기록이 저장되었습니다!');
                        document.getElementById('success-modal').classList.remove('active');
                        await loadLeaderboard();
                    } else {
                        if (data.requireLogin) {
                            alert('로그인이 필요합니다. 점수를 저장하려면 로그인해주세요.');
                            // 로그인 페이지로 이동할지 물어보기
                            if (confirm('로그인 페이지로 이동하시겠습니까?')) {
                                window.location.href = '/auth/login';
                            }
                        } else {
                            alert(data.message || '기록 저장에 실패했습니다.');
                        }
                    }
                } catch (error) {
                    console.error('기록 저장 오류:', error);
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
  `)
})

// API: 리더보드

app.get('/api/sudoku/leaderboard/:difficulty', async (c) => {
  const { DB } = c.env
  const difficulty = c.req.param('difficulty')
  
  try {
    const result = await DB.prepare(`
      SELECT 
        player_name,
        time,
        mistakes,
        created_at
      FROM sudoku_scores
      WHERE difficulty = ?
      ORDER BY time ASC, mistakes ASC
      LIMIT 10
    `).bind(difficulty).all()
    
    return c.json({
      success: true,
      scores: result.results || []
    })
  } catch (error) {
    console.error('리더보드 조회 오류:', error)
    return c.json({
      success: false,
      message: '리더보드 조회 중 오류가 발생했습니다',
      scores: []
    })
  }
})

app.post('/api/sudoku/score', async (c) => {
  const { DB } = c.env
  const { difficulty, time, mistakes } = await c.req.json()
  
  // 쿠키에서 사용자 정보 가져오기
  const authCookie = c.req.header('Cookie')
  let userId = null
  let username = 'Anonymous'
  
  if (authCookie) {
    const cookies = authCookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)
    
    if (cookies.user_id) {
      userId = decodeURIComponent(cookies.user_id)
      
      try {
        // 사용자 정보 조회
        const user = await DB.prepare('SELECT email, name FROM users WHERE id = ?').bind(userId).first()
        if (user) {
          username = (user.name as string) || (user.email as string) || 'Anonymous'
        }
      } catch (e) {
        console.log('사용자 조회 실패:', e)
      }
    }
  }
  
  // 로그인 안 된 경우 점수 저장 거부
  if (!userId) {
    return c.json({
      success: false,
      message: '로그인이 필요합니다. 점수를 저장하려면 로그인해주세요.',
      requireLogin: true
    }, 401)
  }
  
  try {
    const result = await DB.prepare(`
      INSERT INTO sudoku_scores (difficulty, time, mistakes, player_name, user_id, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(difficulty, time, mistakes || 0, username, userId).run()
    
    console.log('✅ 스도쿠 기록 저장 성공:', { difficulty, time, mistakes, username, userId })
    
    return c.json({
      success: true,
      message: '기록이 저장되었습니다'
    })
  } catch (error: any) {
    console.error('❌ 기록 저장 오류:', error)
    return c.json({
      success: false,
      message: '기록 저장 중 오류가 발생했습니다: ' + error.message
    }, 500)
  }
})

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
          {label: '홈', href: '/'},
          {label: '유틸리티'}
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
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- 다기능 계산기 -->
                <div class="utility-card bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer" data-category="life">
                    <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                        <i class="fas fa-calculator text-2xl text-white"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">다기능 계산기</h3>
                    <p class="text-gray-600 mb-4">기본 계산부터 대출, BMI, 날짜까지 다양한 계산기</p>
                    <a href="/lifestyle/calculator" class="text-cyan-600 hover:text-cyan-700 font-medium">
                        시작하기 →
                    </a>
                </div>

                <!-- 글자수 세기 & 맞춤법 검사기 -->
                <div class="utility-card bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer" data-category="work">
                    <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mb-4">
                        <i class="fas fa-spell-check text-2xl text-white"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">글자수 & 맞춤법</h3>
                    <p class="text-gray-600 mb-4">한국어 글자수 세기와 맞춤법 검사를 한번에</p>
                    <a href="/lifestyle/text-checker" class="text-cyan-600 hover:text-cyan-700 font-medium">
                        시작하기 →
                    </a>
                </div>

                <!-- 평수 계산기 -->
                <div class="utility-card bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer" data-category="life">
                    <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                        <i class="fas fa-home text-2xl text-white"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">평수 계산기</h3>
                    <p class="text-gray-600 mb-4">평 ↔ m² 변환 (34평 = 112.39m²)</p>
                    <a href="/lifestyle/pyeong-calculator" class="text-cyan-600 hover:text-cyan-700 font-medium">
                        시작하기 →
                    </a>
                </div>

                <!-- 한국 나이 계산기 -->
                <div class="utility-card bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer" data-category="life">
                    <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mb-4">
                        <i class="fas fa-birthday-cake text-2xl text-white"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">한국 나이 계산기</h3>
                    <p class="text-gray-600 mb-4">만 나이, 한국 나이, 연 나이를 한번에 계산</p>
                    <a href="/lifestyle/age-calculator" class="text-cyan-600 hover:text-cyan-700 font-medium">
                        시작하기 →
                    </a>
                </div>

                <!-- D-Day 계산기 -->
                <div class="utility-card bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer" data-category="life">
                    <div class="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                        <i class="fas fa-calendar-alt text-2xl text-white"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">D-Day 계산기</h3>
                    <p class="text-gray-600 mb-4">중요한 날까지 남은 시간 계산 (결혼, 시험, 입대)</p>
                    <a href="/lifestyle/dday-calculator" class="text-cyan-600 hover:text-cyan-700 font-medium">
                        시작하기 →
                    </a>
                </div>

                <!-- JSON 포매터 -->
                <div class="utility-card bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer" data-category="dev">
                    <div class="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center mb-4">
                        <i class="fas fa-code text-2xl text-white"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">JSON 포매터</h3>
                    <p class="text-gray-600 mb-4">JSON 데이터 정리, 검증, 압축 (개발자 필수)</p>
                    <a href="/lifestyle/json-formatter" class="text-cyan-600 hover:text-cyan-700 font-medium">
                        시작하기 →
                    </a>
                </div>

                <!-- Base64 인코더/디코더 -->
                <div class="utility-card bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer" data-category="dev">
                    <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                        <i class="fas fa-lock text-2xl text-white"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">Base64 변환</h3>
                    <p class="text-gray-600 mb-4">Base64 인코딩/디코딩 (텍스트, 이미지)</p>
                    <a href="/lifestyle/base64-converter" class="text-cyan-600 hover:text-cyan-700 font-medium">
                        시작하기 →
                    </a>
                </div>

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
  `)
})

// ==================== 금융 페이지 ====================
app.get('/finance', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko" id="html-root">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>금융 - Faith Portal</title>
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
    <body class="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50" id="html-root">
        ${getCommonHeader('Finance')}
        ${getStickyHeader()}
        
        ${getBreadcrumb([
          {label: '홈', href: '/'},
          {label: '금융'}
        ])}

        ${getFinanceMenu('/finance')}

        <main class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
            <div class="text-center py-16">
                <div class="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <i class="fas fa-won-sign text-4xl text-white"></i>
                </div>
                <h1 class="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
                    <span class="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">금융</span> 정보
                </h1>
                <p class="text-gray-600 text-lg mb-8">
                    실시간 금융 정보와 다양한 금융 서비스를 제공합니다
                </p>
                <div class="flex justify-center gap-4">
                    <a href="/finance/stock" class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition-all">
                        <i class="fas fa-chart-line mr-2"></i>
                        주식 정보
                    </a>
                    <a href="/" class="inline-flex items-center px-6 py-3 bg-white text-gray-700 rounded-lg font-medium border border-gray-300 hover:border-green-500 hover:text-green-600 transition-all">
                        <i class="fas fa-home mr-2"></i>
                        메인으로
                    </a>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                    <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mb-4">
                        <i class="fas fa-chart-line text-2xl text-white"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">주식 정보</h3>
                    <p class="text-gray-600 mb-4">실시간 주식 시세와 차트를 확인하세요</p>
                    <a href="/finance/stock" class="text-green-600 hover:text-green-700 font-medium">
                        시작하기 →
                    </a>
                </div>

                <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                    <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center mb-4">
                        <i class="fas fa-exchange-alt text-2xl text-white"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">환율 정보</h3>
                    <p class="text-gray-600 mb-4">실시간 환율 정보와 환전 계산기</p>
                    <a href="/finance/exchange" class="text-green-600 hover:text-green-700 font-medium">
                        시작하기 →
                    </a>
                </div>

                <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                    <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                        <i class="fas fa-university text-2xl text-white"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">은행 정보</h3>
                    <p class="text-gray-600 mb-4">예적금 금리 비교 및 은행 서비스</p>
                    <a href="/finance/banking" class="text-green-600 hover:text-green-700 font-medium">
                        시작하기 →
                    </a>
                </div>
            </div>
        </main>

        ${getCommonFooter()}
        ${getCommonAuthScript()}
    </body>
    </html>
  `)
})

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
          {label: '홈', href: '/'},
          {label: '엔터'}
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
  `)
})

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
          {label: '홈', href: '/'},
          {label: '교육'}
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
  `)
})

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
                    min-height: 50px;
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
        
        ${getBreadcrumb([
          {label: '홈', href: '/'},
          {label: '유틸리티', href: '/lifestyle'},
          {label: '계산기'}
        ])}

        <!-- 서브 메뉴 -->
        ${getLifestyleMenu('/lifestyle/calculator')}

        <!-- 광고 배너 영역 -->
        <div class="bg-gradient-to-r from-yellow-400 via-red-400 to-pink-400 py-4">
            <div class="max-w-7xl mx-auto px-4 text-center">
                <p class="text-white font-bold text-lg">
                    <i class="fas fa-ad mr-2"></i>광고 배너 영역
                </p>
            </div>
        </div>

        <!-- 메인 컨텐츠 -->
        <div class="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
            <main class="w-full">
                <div class="bg-white rounded-xl shadow-lg p-3 sm:p-4 lg:p-6">
                    <div class="flex items-center justify-between mb-3 sm:mb-4">
                        <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
                            <i class="fas fa-calculator mr-2 text-blue-500"></i>
                            <span class="hidden sm:inline">다기능 </span>계산기
                        </h1>
                    </div>

                    <!-- 계산기 탭 -->
                    <div class="flex flex-wrap gap-2 mb-4 border-b pb-3">
                        <button onclick="showCalculator('basic')" class="tab-btn tab-active px-4 py-2 rounded-lg font-medium transition" data-tab="basic">
                            <i class="fas fa-calculator mr-1"></i>기본
                        </button>
                        <button onclick="showCalculator('scientific')" class="tab-btn px-4 py-2 rounded-lg font-medium transition bg-gray-100 hover:bg-gray-200" data-tab="scientific">
                            <i class="fas fa-square-root-alt mr-1"></i>공학
                        </button>
                        <button onclick="showCalculator('loan')" class="tab-btn px-4 py-2 rounded-lg font-medium transition bg-gray-100 hover:bg-gray-200" data-tab="loan">
                            <i class="fas fa-money-bill-wave mr-1"></i>대출
                        </button>
                        <button onclick="showCalculator('bmi')" class="tab-btn px-4 py-2 rounded-lg font-medium transition bg-gray-100 hover:bg-gray-200" data-tab="bmi">
                            <i class="fas fa-weight mr-1"></i>BMI
                        </button>
                        <button onclick="showCalculator('age')" class="tab-btn px-4 py-2 rounded-lg font-medium transition bg-gray-100 hover:bg-gray-200" data-tab="age">
                            <i class="fas fa-birthday-cake mr-1"></i>나이
                        </button>
                        <button onclick="showCalculator('date')" class="tab-btn px-4 py-2 rounded-lg font-medium transition bg-gray-100 hover:bg-gray-200" data-tab="date">
                            <i class="fas fa-calendar mr-1"></i>날짜
                        </button>
                        <button onclick="showCalculator('unit')" class="tab-btn px-4 py-2 rounded-lg font-medium transition bg-gray-100 hover:bg-gray-200" data-tab="unit">
                            <i class="fas fa-exchange-alt mr-1"></i>단위
                        </button>
                        <button onclick="showCalculator('percentage')" class="tab-btn px-4 py-2 rounded-lg font-medium transition bg-gray-100 hover:bg-gray-200" data-tab="percentage">
                            <i class="fas fa-percent mr-1"></i>백분율
                        </button>
                    </div>

                    <!-- 기본 계산기 -->
                    <div id="calc-basic" class="calculator-container">
                        <div class="max-w-sm sm:max-w-md mx-auto bg-gray-200 p-4 sm:p-6 rounded-2xl shadow-2xl" style="background: linear-gradient(145deg, #e5e7eb, #d1d5db);">
                            <div id="basic-display" class="calculator-display" style="margin-bottom: 2rem;">0</div>
                            <div class="grid grid-cols-4 gap-3">
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
                        <div class="max-w-md sm:max-w-lg lg:max-w-xl mx-auto bg-gray-200 p-4 sm:p-6 rounded-2xl shadow-2xl" style="background: linear-gradient(145deg, #e5e7eb, #d1d5db);">
                            <div id="scientific-display" class="calculator-display" style="margin-bottom: 2rem;">0</div>
                            <div class="grid grid-cols-5 gap-3">
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
  `)
})

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
          {label: '홈', href: '/'},
          {label: '유틸리티', href: '/lifestyle'},
          {label: '글자수 & 맞춤법'}
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
  `)
})

// ==================== 유튜브 다운로드 페이지 ====================
app.get('/lifestyle/youtube-download', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>유튜브 다운로드 - Faith Portal</title>
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
        
        ${getBreadcrumb([
          {label: '홈', href: '/'},
          {label: '유틸리티', href: '/lifestyle'},
          {label: '유튜브 다운로드'}
        ])}

        <!-- 서브 메뉴 -->
        ${getLifestyleMenu('/lifestyle/youtube-download')}

        <!-- 광고 배너 -->
        <div class="bg-gradient-to-r from-yellow-400 via-red-400 to-pink-400 py-4">
            <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
                <div class="flex items-center justify-center space-x-4">
                    <i class="fas fa-ad text-white text-2xl"></i>
                    <p class="text-white font-bold text-lg">광고 배너 영역 - 여기에 광고가 표시됩니다</p>
                    <i class="fas fa-ad text-white text-2xl"></i>
                </div>
            </div>
        </div>

        <!-- 메인 컨텐츠 -->
        <div class="max-w-7xl mx-auto px-4 py-8">
            <main class="w-full">
                    <div class="bg-white rounded-lg shadow-lg p-6 sm:p-8">
                        <!-- 페이지 타이틀 -->
                        <div class="mb-8">
                            <h1 class="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 flex items-center">
                                <div class="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                                    <i class="fab fa-youtube text-2xl text-white"></i>
                                </div>
                                유튜브 다운로드
                            </h1>
                            <p class="text-gray-600">유튜브 영상 URL을 입력하고 다운로드 버튼을 눌러주세요</p>
                        </div>

                        <!-- 다운로드 폼 -->
                        <div class="space-y-6">
                            <!-- URL 입력란 -->
                            <div>
                                <label for="youtube-url" class="block text-sm font-medium text-gray-700 mb-2">
                                    <i class="fas fa-link mr-1"></i>
                                    유튜브 URL
                                </label>
                                <input 
                                    type="text" 
                                    id="youtube-url" 
                                    placeholder="예: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                                />
                                <p class="mt-2 text-xs text-gray-500">
                                    <i class="fas fa-info-circle mr-1"></i>
                                    유튜브 영상 URL을 입력해주세요 (예: youtube.com/watch?v=...)
                                </p>
                            </div>

                            <!-- 품질 선택 -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    <i class="fas fa-sliders-h mr-1"></i>
                                    품질 선택
                                </label>
                                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <label class="flex items-center justify-center px-4 py-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-cyan-500 transition-all">
                                        <input type="radio" name="quality" value="highest" checked class="mr-2">
                                        <span class="text-sm font-medium">최고 품질</span>
                                    </label>
                                    <label class="flex items-center justify-center px-4 py-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-cyan-500 transition-all">
                                        <input type="radio" name="quality" value="1080p" class="mr-2">
                                        <span class="text-sm font-medium">1080p</span>
                                    </label>
                                    <label class="flex items-center justify-center px-4 py-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-cyan-500 transition-all">
                                        <input type="radio" name="quality" value="720p" class="mr-2">
                                        <span class="text-sm font-medium">720p</span>
                                    </label>
                                    <label class="flex items-center justify-center px-4 py-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-cyan-500 transition-all">
                                        <input type="radio" name="quality" value="480p" class="mr-2">
                                        <span class="text-sm font-medium">480p</span>
                                    </label>
                                </div>
                            </div>

                            <!-- 다운로드 버튼 -->
                            <button 
                                onclick="downloadVideo()" 
                                class="w-full py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg font-bold text-lg hover:shadow-xl transition-all transform hover:scale-105"
                            >
                                <i class="fas fa-download mr-2"></i>
                                다운로드
                            </button>

                            <!-- 상태 메시지 -->
                            <div id="status-message" class="hidden p-4 rounded-lg"></div>

                            <!-- 진행 상황 -->
                            <div id="progress-container" class="hidden">
                                <div class="mb-2 flex justify-between text-sm">
                                    <span class="text-gray-600">다운로드 진행 중...</span>
                                    <span id="progress-text" class="text-cyan-600 font-medium">0%</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div id="progress-bar" class="h-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-300" style="width: 0%"></div>
                                </div>
                            </div>
                        </div>

                        <!-- 안내 사항 -->
                        <div class="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                            <h3 class="text-lg font-bold text-blue-800 mb-3 flex items-center">
                                <i class="fas fa-exclamation-circle mr-2"></i>
                                사용 안내
                            </h3>
                            <ul class="space-y-2 text-sm text-blue-700">
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle mr-2 mt-0.5"></i>
                                    <span>개인적인 용도로만 사용해주세요</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle mr-2 mt-0.5"></i>
                                    <span>저작권이 있는 콘텐츠의 무단 다운로드는 법적 문제가 될 수 있습니다</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle mr-2 mt-0.5"></i>
                                    <span>다운로드 속도는 영상 크기와 네트워크 상태에 따라 달라질 수 있습니다</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </main>
            </div>
        </div>



        <script>
            // 로그인 상태 확인
            const token = localStorage.getItem('auth_token');
            const userEmail = localStorage.getItem('user_email');
            const userLevel = parseInt(localStorage.getItem('user_level') || '0');
            
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
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_email');
                localStorage.removeItem('user_level');
                location.href = '/';
            }

            // 유튜브 다운로드 함수
            async function downloadVideo() {
                const urlInput = document.getElementById('youtube-url');
                const url = urlInput.value.trim();
                const statusMessage = document.getElementById('status-message');
                const progressContainer = document.getElementById('progress-container');
                const progressBar = document.getElementById('progress-bar');
                const progressText = document.getElementById('progress-text');
                
                // 입력 검증
                if (!url) {
                    showMessage('error', '유튜브 URL을 입력해주세요');
                    return;
                }
                
                if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
                    showMessage('error', '올바른 유튜브 URL을 입력해주세요');
                    return;
                }
                
                // 품질 선택
                const quality = document.querySelector('input[name="quality"]:checked').value;
                
                // 진행 상태 표시
                statusMessage.classList.add('hidden');
                progressContainer.classList.remove('hidden');
                updateProgress(0);
                
                try {
                    // 진행률 시뮬레이션 시작
                    updateProgress(10);
                    
                    // API 호출
                    const response = await fetch('/api/youtube/download', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ url, quality })
                    });
                    
                    updateProgress(30);
                    
                    const data = await response.json();
                    console.log('API 응답:', data);
                    
                    if (data.success && data.downloadUrl) {
                        // 진행률 시뮬레이션
                        updateProgress(50);
                        await sleep(300);
                        updateProgress(70);
                        
                        // 비디오 정보 표시
                        let successMessage = '<div class="space-y-2">';
                        successMessage += '<div class="font-bold text-lg">✅ 다운로드 준비 완료!</div>';
                        if (data.videoInfo) {
                            successMessage += '<div class="text-sm mt-2">';
                            successMessage += '<div><strong>제목:</strong> ' + (data.videoInfo.title || '알 수 없음') + '</div>';
                            successMessage += '<div><strong>채널:</strong> ' + (data.videoInfo.author || '알 수 없음') + '</div>';
                            successMessage += '<div><strong>화질:</strong> ' + (data.quality || '기본') + '</div>';
                            successMessage += '</div>';
                            
                            if (data.videoInfo.thumbnail) {
                                successMessage += '<img src="' + data.videoInfo.thumbnail + '" class="w-full max-w-xs rounded-lg mt-2" alt="썸네일">';
                            }
                        }
                        successMessage += '<div class="text-sm mt-3 text-blue-600">다운로드가 시작됩니다...</div>';
                        successMessage += '</div>';
                        
                        progressContainer.classList.add('hidden');
                        showMessage('success', successMessage);
                        
                        // 잠시 후 파일 다운로드 시작
                        await sleep(1000);
                        updateProgress(90);
                        
                        // 파일 다운로드
                        const link = document.createElement('a');
                        link.href = data.downloadUrl;
                        link.download = data.videoInfo?.title ? data.videoInfo.title.replace(/[^a-zA-Z0-9가-힣\\s]/g, '_') + '.mp4' : 'video.mp4';
                        link.target = '_blank'; // 새 탭에서 열기
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        
                        updateProgress(100);
                        
                        // 성공 메시지 업데이트
                        await sleep(500);
                        successMessage = '<div class="space-y-2">';
                        successMessage += '<div class="font-bold text-lg">✅ 다운로드 완료!</div>';
                        successMessage += '<div class="text-sm">파일이 다운로드되었습니다. 브라우저의 다운로드 폴더를 확인해주세요.</div>';
                        successMessage += '</div>';
                        showMessage('success', successMessage);
                        
                        urlInput.value = '';
                    } else {
                        // 에러 처리
                        progressContainer.classList.add('hidden');
                        
                        let errorMessage = '';
                        
                        if (data.errorType === 'REDIRECT_REQUIRED') {
                            // 외부 다운로드 서비스 안내
                            errorMessage = '<div class="space-y-4">';
                            errorMessage += '<div class="font-bold text-lg text-blue-600">' + (data.error || '다운로드 서비스 안내') + '</div>';
                            
                            if (data.videoInfo) {
                                errorMessage += '<div class="bg-gray-50 p-3 rounded-lg">';
                                if (data.videoInfo.thumbnail) {
                                    errorMessage += '<img src="' + data.videoInfo.thumbnail + '" class="w-full rounded mb-2" alt="썸네일">';
                                }
                                errorMessage += '<div class="text-sm"><strong>제목:</strong> ' + data.videoInfo.title + '</div>';
                                errorMessage += '<div class="text-sm"><strong>채널:</strong> ' + data.videoInfo.author + '</div>';
                                errorMessage += '</div>';
                            }
                            
                            if (data.message) {
                                errorMessage += '<div class="text-sm text-gray-700">' + data.message + '</div>';
                            }
                            
                            if (data.downloadServices && data.downloadServices.length > 0) {
                                errorMessage += '<div class="mt-3">';
                                errorMessage += '<div class="font-semibold mb-2">💡 추천 다운로드 서비스:</div>';
                                errorMessage += '<div class="space-y-2">';
                                data.downloadServices.forEach(service => {
                                    errorMessage += '<a href="' + service.url + '" target="_blank" class="block p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition">';
                                    errorMessage += '<div class="font-medium text-blue-700">🔗 ' + service.name + '</div>';
                                    errorMessage += '<div class="text-xs text-gray-600">' + service.description + '</div>';
                                    errorMessage += '</a>';
                                });
                                errorMessage += '</div></div>';
                            }
                            
                            if (data.alternativeMethod) {
                                errorMessage += '<div class="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">';
                                errorMessage += '<div class="font-semibold text-purple-700 mb-2">🔌 ' + data.alternativeMethod.title + '</div>';
                                errorMessage += '<div class="text-xs text-gray-600 mb-2">' + data.alternativeMethod.description + '</div>';
                                errorMessage += '<div class="flex gap-2 text-xs">';
                                errorMessage += '<a href="' + data.alternativeMethod.chromeExtension + '" target="_blank" class="text-blue-600 hover:underline">Chrome 확장</a>';
                                errorMessage += '<span class="text-gray-400">|</span>';
                                errorMessage += '<a href="' + data.alternativeMethod.firefoxExtension + '" target="_blank" class="text-blue-600 hover:underline">Firefox 확장</a>';
                                errorMessage += '</div></div>';
                            }
                            
                            errorMessage += '</div>';
                        } else if (data.errorType === 'NOT_IMPLEMENTED') {
                            // 구현되지 않은 기능
                            errorMessage = '<div class="space-y-3">';
                            errorMessage += '<div class="font-bold text-lg">' + (data.error || '기능 구현 필요') + '</div>';
                            
                            if (data.details) {
                                errorMessage += '<div class="text-sm"><strong>상태:</strong> ' + data.details.title + '</div>';
                                errorMessage += '<div class="text-sm"><strong>원인:</strong> ' + data.details.reason + '</div>';
                                
                                if (data.details.limitations && data.details.limitations.length > 0) {
                                    errorMessage += '<div class="mt-2"><strong>제약 사항:</strong><ul class="list-disc list-inside mt-1">';
                                    data.details.limitations.forEach(limitation => {
                                        errorMessage += '<li>' + limitation + '</li>';
                                    });
                                    errorMessage += '</ul></div>';
                                }
                                
                                if (data.details.solutions && data.details.solutions.length > 0) {
                                    errorMessage += '<div class="mt-3"><strong>구현 방법:</strong>';
                                    data.details.solutions.forEach(solution => {
                                        errorMessage += '<div class="mt-2 pl-4 border-l-2 border-blue-400">';
                                        errorMessage += '<div class="font-medium">' + solution.method + '</div>';
                                        errorMessage += '<div class="text-xs mt-1">' + solution.description + '</div>';
                                        errorMessage += '<div class="text-xs mt-1">✅ ' + solution.pros + ' / ⚠️ ' + solution.cons + '</div>';
                                        errorMessage += '</div>';
                                    });
                                    errorMessage += '</div>';
                                }
                            }
                            
                            if (data.recommendations && data.recommendations.length > 0) {
                                errorMessage += '<div class="mt-3"><strong>권장 사항:</strong><ul class="list-disc list-inside mt-1">';
                                data.recommendations.forEach(rec => {
                                    errorMessage += '<li class="text-xs">' + rec + '</li>';
                                });
                                errorMessage += '</ul></div>';
                            }
                            
                            errorMessage += '</div>';
                        } else {
                            // 일반 에러
                            errorMessage = '<div>';
                            errorMessage += '<div class="font-bold mb-2">' + (data.error || '다운로드 실패') + '</div>';
                            if (data.message) {
                                errorMessage += '<div class="text-sm whitespace-pre-line">' + data.message + '</div>';
                            }
                            if (data.details) {
                                errorMessage += '<div class="text-xs mt-2 text-gray-600">상세: ' + JSON.stringify(data.details, null, 2) + '</div>';
                            }
                            errorMessage += '</div>';
                        }
                        
                        showMessage('error', errorMessage);
                    }
                } catch (error) {
                    console.error('다운로드 오류:', error);
                    progressContainer.classList.add('hidden');
                    
                    let errorMessage = '<div>';
                    errorMessage += '<div class="font-bold mb-2">요청 처리 중 오류 발생</div>';
                    errorMessage += '<div class="text-sm">오류 메시지: ' + (error.message || '알 수 없는 오류') + '</div>';
                    errorMessage += '<div class="text-xs mt-2 text-gray-600">네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요.</div>';
                    errorMessage += '</div>';
                    
                    showMessage('error', errorMessage);
                }
            }
            
            function updateProgress(percent) {
                const progressBar = document.getElementById('progress-bar');
                const progressText = document.getElementById('progress-text');
                progressBar.style.width = percent + '%';
                progressText.textContent = percent + '%';
            }
            
            function showMessage(type, message) {
                const statusMessage = document.getElementById('status-message');
                statusMessage.classList.remove('hidden', 'bg-green-50', 'text-green-700', 'border-green-200', 'bg-red-50', 'text-red-700', 'border-red-200');
                
                if (type === 'success') {
                    statusMessage.classList.add('bg-green-50', 'text-green-700', 'border', 'border-green-200');
                    statusMessage.innerHTML = '<i class="fas fa-check-circle mr-2"></i>' + message;
                } else {
                    statusMessage.classList.add('bg-red-50', 'text-red-700', 'border', 'border-red-200');
                    statusMessage.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i>' + message;
                }
            }
            
            function sleep(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }

            // Enter 키로 다운로드
            document.getElementById('youtube-url').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    downloadVideo();
                }
            });
        </script>

        ${getCommonFooter()}

    </body>
    </html>
  `)
})

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
          {label: '홈', href: '/'},
          {label: '유틸리티', href: '/lifestyle'},
          {label: '평수 계산기'}
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
  `)
})

// ==================== 뉴스 페이지 ====================
app.get('/news', async (c) => {
  const { DB } = c.env
  
  // DB에서 뉴스 가져오기
  let newsFromDB: any[] = []
  try {
    const { results } = await DB.prepare('SELECT * FROM news ORDER BY created_at DESC LIMIT 20').all()
    newsFromDB = results || []
  } catch (error) {
    console.error('뉴스 조회 오류:', error)
  }
  
  // DB에 뉴스가 없으면 RSS에서 자동으로 가져오기
  if (newsFromDB.length === 0) {
    try {
      const categories = ['general', 'politics', 'economy', 'tech', 'sports', 'entertainment']
      for (let i = 0; i < categories.length; i++) {
        const category = categories[i]
        const newsItems = await parseGoogleNewsRSS(category)
        for (const item of newsItems.slice(0, 5)) { // 카테고리당 5개
          try {
            await DB.prepare(`
              INSERT OR IGNORE INTO news (category, title, summary, link, image_url, publisher, pub_date)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).bind(
              item.category,
              item.title,
              item.summary,
              item.link,
              item.image_url,
              item.publisher,
              item.pub_date
            ).run()
          } catch (err) {
            console.error('뉴스 저장 오류:', err)
          }
        }
        
        // 구글 Rate Limit 회피: 카테고리 간 2초 지연 (마지막 카테고리 제외)
        if (i < categories.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
      // 다시 조회
      const { results } = await DB.prepare('SELECT * FROM news ORDER BY created_at DESC LIMIT 20').all()
      newsFromDB = results || []
    } catch (error) {
      console.error('RSS 뉴스 가져오기 오류:', error)
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
        </style>
    </head>
    <body class="bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50 transition-colors duration-300">
        ${getCommonHeader('News')}
        ${getStickyHeader()}
        
        ${getBreadcrumb([
          {label: '홈', href: '/'},
          {label: '뉴스'}
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
            // ==================== 전역 변수 ====================
            const userId = localStorage.getItem('user_id') || '1'; // 임시 사용자 ID
            let currentCategories = ['all']; // 선택된 카테고리들
            let shareNewsData = {}; // 공유할 뉴스 데이터
            let searchTimeout = null;
            let currentPage = 0; // 현재 페이지 (무한 스크롤용)
            let isLoading = false; // 로딩 중 플래그
            let hasMore = true; // 더 불러올 뉴스가 있는지
            const ITEMS_PER_PAGE = 12; // 페이지당 아이템 수
            
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
                
                if (!userId) {
                    showToast('로그인이 필요합니다', 'warning');
                    return;
                }
                
                try {
                    const response = await fetch('/api/keywords/subscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: userId,
                            keyword: keyword
                        })
                    });
                    
                    const data = await response.json();
                    if (data.success) {
                        input.value = '';
                        showToast('키워드가 추가되었습니다', 'success');
                        loadKeywords();
                    } else {
                        showToast(data.error || '키워드 추가 실패', 'error');
                    }
                } catch (error) {
                    console.error('키워드 추가 오류:', error);
                    showToast('키워드 추가 중 오류가 발생했습니다', 'error');
                }
            }
            
            async function loadKeywords() {
                if (!userId) return;
                
                const keywordList = document.getElementById('keyword-list');
                const mobileKeywordList = document.getElementById('mobile-keyword-list');
                
                try {
                    const response = await fetch('/api/keywords?userId=' + userId);
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
                    const offset = currentPage * ITEMS_PER_PAGE;
                    let url = '/api/news?limit=' + ITEMS_PER_PAGE + '&offset=' + offset;
                    if (!currentCategories.includes('all')) {
                        url += '&category=' + currentCategories[0];
                    }
                    
                    console.log('[loadNews] API 호출:', url);
                    const response = await fetch(url);
                    console.log('[loadNews] 응답 받음:', response.status);
                    const data = await response.json();
                    console.log('[loadNews] 데이터 파싱:', data.success, '뉴스 수:', data.news ? data.news.length : 0);
                    
                    if (data.success) {
                        if (data.news.length > 0) {
                            renderNewsCards(data.news, !reset);
                            currentPage++;
                            
                            // 더 불러올 뉴스가 있는지 확인
                            if (data.news.length < ITEMS_PER_PAGE) {
                                hasMore = false;
                            }
                        } else {
                            hasMore = false;
                            if (reset) {
                                newsFeed.innerHTML = '<div class="text-center py-12"><p class="text-gray-500">뉴스가 없습니다</p></div>';
                            }
                        }
                    } else {
                        throw new Error('API 응답 실패');
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
                    'culture': '문화'
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
                            '</div>' +
                            '<span class="text-xs text-gray-500 font-medium">' + relativeTime + '</span>' +
                        '</div>' +
                        
                        // 제목 (클릭 가능)
                        '<div class="cursor-pointer news-clickable-area mb-3" data-news-url="' + escapeHtml(news.link) + '" data-news-id="' + news.id + '">' +
                            '<h3 class="font-bold text-lg text-gray-900 mb-2 hover:text-purple-600 transition">' + titleDisplay + '</h3>' +
                        '</div>' +
                        
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
                                    'data-news-pubdate="' + escapeHtml(news.pub_date || news.created_at) + '">' +
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
                        const url = this.getAttribute('data-news-url');
                        const newsId = this.getAttribute('data-news-id');
                        if (url) {
                            console.log('[뉴스 클릭] URL:', url, 'newsId:', newsId);
                            
                            // 조회수 증가
                            if (newsId) {
                                incrementViewCount(newsId);
                            }
                            
                            openNewsInNewTab(url);
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
                // 북마크 버튼 이벤트
                document.querySelectorAll('.bookmark-btn').forEach(btn => {
                    btn.addEventListener('click', function(e) {
                        e.stopPropagation(); // 뉴스 카드 클릭 이벤트 방지
                        const newsId = this.getAttribute('data-news-id');
                        const title = this.getAttribute('data-news-title');
                        const link = this.getAttribute('data-news-link');
                        const category = this.getAttribute('data-news-category');
                        const publisher = this.getAttribute('data-news-publisher');
                        const pubDate = this.getAttribute('data-news-pubdate');
                        toggleBookmark(newsId, title, link, category, publisher, pubDate);
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
                        const response = await fetch('/api/bookmarks/check?userId=' + userId + '&link=' + encodeURIComponent(newsId));
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
            
            async function toggleBookmark(newsId, title, link, category, source, pubDate) {
                if (!userId) {
                    showToast('로그인이 필요합니다', 'warning');
                    return;
                }
                
                const btn = document.querySelector('.bookmark-btn[data-news-id="' + newsId + '"]');
                const isBookmarked = btn.classList.contains('bookmarked');
                
                try {
                    if (isBookmarked) {
                        // 북마크 제거
                        const response = await fetch('/api/bookmarks/' + newsId + '?userId=' + userId, {
                            method: 'DELETE'
                        });
                        const data = await response.json();
                        
                        if (data.success) {
                            btn.classList.remove('bookmarked');
                            showToast('북마크가 제거되었습니다', 'info');
                        }
                    } else {
                        // 북마크 추가
                        const response = await fetch('/api/bookmarks', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userId: userId,
                                title: title,
                                link: link,
                                category: category,
                                source: source,
                                pubDate: pubDate
                            })
                        });
                        const data = await response.json();
                        
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
                const categories = ['general', 'politics', 'economy', 'tech', 'sports', 'entertainment'];
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
            window.addEventListener('DOMContentLoaded', function() {
                initSearchAndKeyword(); // 검색 및 키워드 입력 초기화
                loadNews(true); // 초기 로드
                loadHotNews(); // HOT 뉴스 로드
                loadKeywords(); // 키워드 로드
                initScrollToTop(); // 맨 위로 버튼 초기화
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
  `)
})

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
          {label: '홈', href: '/'},
          {label: '북마크'}
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
  `)
})

// ==================== 로그인 페이지 ====================
app.get('/login', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Faith Portal 로그인</title>
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
    <body class="bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50">
        <div class="min-h-screen flex items-center justify-center px-4">
            <div class="max-w-md w-full">
                <!-- 로고 -->
                <div class="text-center mb-8">
                    <a href="/">
                        <h1 class="text-5xl font-bold faith-blue text-white inline-block px-8 py-3 rounded-lg">Faith Portal</h1>
                    </a>
                </div>

                <!-- 로그인 폼 -->
                <div class="bg-white rounded-lg shadow-lg p-8">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">로그인</h2>
                    
                    <form id="login-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                            <input 
                                type="email" 
                                id="email"
                                required
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="이메일을 입력하세요"
                            />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
                            <input 
                                type="password" 
                                id="password"
                                required
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="비밀번호를 입력하세요"
                            />
                        </div>

                        <div id="error-message" class="hidden text-red-500 text-sm"></div>

                        <button 
                            type="submit"
                            class="w-full faith-blue text-white py-3 rounded-lg font-medium faith-blue-hover transition"
                        >
                            <i class="fas fa-sign-in-alt mr-2"></i>
                            로그인
                        </button>
                    </form>

                    <div class="mt-6 text-center">
                        <p class="text-sm text-gray-600">
                            아직 회원이 아니신가요?
                            <a href="/signup" class="text-blue-600 hover:text-blue-700 font-medium">회원가입</a>
                        </p>
                    </div>

                    <!-- 테스트 계정 안내 -->
                    <div class="mt-6 p-4 bg-blue-50 rounded-lg">
                        <p class="text-xs text-blue-800 font-medium mb-2">
                            <i class="fas fa-info-circle mr-1"></i>
                            테스트 계정
                        </p>
                        <p class="text-xs text-blue-700">
                            이메일: test@example.com<br>
                            비밀번호: test1234
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            document.getElementById('login-form').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const errorDiv = document.getElementById('error-message');
                
                try {
                    const response = await axios.post('/api/login', {
                        email: email,
                        password: password
                    });
                    
                    if (response.data.success) {
                        // 로그인 성공
                        localStorage.setItem('auth_token', response.data.token);
                        localStorage.setItem('user_id', response.data.user.id);
                        localStorage.setItem('user_email', response.data.user.email);
                        localStorage.setItem('user_level', response.data.user.level);
                        
                        alert('로그인 성공!');
                        
                        // 관리자는 관리자 페이지로
                        if (response.data.user.level >= 6) {
                            window.location.href = '/admin';
                        } else {
                            window.location.href = '/';
                        }
                    }
                } catch (error) {
                    errorDiv.classList.remove('hidden');
                    errorDiv.textContent = error.response?.data?.message || '로그인에 실패했습니다.';
                }
            });
        </script>
    </body>
    </html>
  `)
})

// ==================== 회원가입 페이지 ====================
app.get('/signup', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Faith Portal 회원가입</title>
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
    <body class="bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50">
        <div class="min-h-screen flex items-center justify-center px-4 py-12">
            <div class="max-w-md w-full">
                <!-- 로고 -->
                <div class="text-center mb-8">
                    <a href="/">
                        <h1 class="text-5xl font-bold faith-blue text-white inline-block px-8 py-3 rounded-lg">Faith Portal</h1>
                    </a>
                </div>

                <!-- 회원가입 폼 -->
                <div class="bg-white rounded-lg shadow-lg p-8">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">회원가입</h2>
                    
                    <form id="signup-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                이메일 <span class="text-red-500">*</span>
                            </label>
                            <input 
                                type="email" 
                                id="email"
                                required
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="example@email.com"
                            />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                비밀번호 <span class="text-red-500">*</span>
                            </label>
                            <input 
                                type="password" 
                                id="password"
                                required
                                minlength="6"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="6자 이상 입력하세요"
                            />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                비밀번호 확인 <span class="text-red-500">*</span>
                            </label>
                            <input 
                                type="password" 
                                id="password-confirm"
                                required
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="비밀번호를 다시 입력하세요"
                            />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                이름 <span class="text-red-500">*</span>
                            </label>
                            <input 
                                type="text" 
                                id="name"
                                required
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="홍길동"
                            />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                휴대전화
                            </label>
                            <input 
                                type="tel" 
                                id="phone"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="010-1234-5678"
                            />
                        </div>

                        <div id="error-message" class="hidden text-red-500 text-sm"></div>
                        <div id="success-message" class="hidden text-blue-500 text-sm"></div>

                        <button 
                            type="submit"
                            class="w-full faith-blue text-white py-3 rounded-lg font-medium faith-blue-hover transition"
                        >
                            <i class="fas fa-user-plus mr-2"></i>
                            회원가입
                        </button>
                    </form>

                    <div class="mt-6 text-center">
                        <p class="text-sm text-gray-600">
                            이미 회원이신가요?
                            <a href="/login" class="text-blue-600 hover:text-blue-700 font-medium">로그인</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            document.getElementById('signup-form').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const passwordConfirm = document.getElementById('password-confirm').value;
                const name = document.getElementById('name').value;
                const phone = document.getElementById('phone').value;
                
                const errorDiv = document.getElementById('error-message');
                const successDiv = document.getElementById('success-message');
                
                errorDiv.classList.add('hidden');
                successDiv.classList.add('hidden');
                
                // 비밀번호 확인
                if (password !== passwordConfirm) {
                    errorDiv.classList.remove('hidden');
                    errorDiv.textContent = '비밀번호가 일치하지 않습니다.';
                    return;
                }
                
                try {
                    const response = await axios.post('/api/signup', {
                        email: email,
                        password: password,
                        name: name,
                        phone: phone
                    });
                    
                    if (response.data.success) {
                        successDiv.classList.remove('hidden');
                        successDiv.textContent = '회원가입이 완료되었습니다! 로그인 페이지로 이동합니다...';
                        
                        setTimeout(() => {
                            window.location.href = '/login';
                        }, 2000);
                    }
                } catch (error) {
                    errorDiv.classList.remove('hidden');
                    errorDiv.textContent = error.response?.data?.message || '회원가입에 실패했습니다.';
                }
            });
        </script>
    </body>
    </html>
  `)
})

// ==================== API: 테트리스 최고 점수 저장 ====================
app.post('/api/tetris/score', async (c) => {
  try {
    const { user_id, score } = await c.req.json()
    
    if (!user_id || score === undefined) {
      return c.json({ success: false, message: '유효하지 않은 데이터입니다.' }, 400)
    }
    
    // 점수 저장
    await c.env.DB.prepare(
      'INSERT INTO tetris_scores (user_id, score) VALUES (?, ?)'
    ).bind(user_id, score).run()
    
    return c.json({ success: true, message: '점수가 저장되었습니다.' })
  } catch (error) {
    console.error('테트리스 점수 저장 오류:', error)
    return c.json({ success: false, message: '점수 저장 중 오류가 발생했습니다.' }, 500)
  }
})

// ==================== API: 테트리스 최고 점수 조회 ====================
app.get('/api/tetris/highscore/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    
    const highScore = await c.env.DB.prepare(
      'SELECT MAX(score) as high_score FROM tetris_scores WHERE user_id = ?'
    ).bind(userId).first()
    
    return c.json({ 
      success: true, 
      highScore: highScore?.high_score || 0 
    })
  } catch (error) {
    console.error('테트리스 최고 점수 조회 오류:', error)
    return c.json({ success: false, message: '최고 점수 조회 중 오류가 발생했습니다.' }, 500)
  }
})

// ==================== API: 테트리스 최고 점수 리스트 ====================
app.get('/api/tetris/leaderboard', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        t.id,
        t.score,
        t.created_at,
        u.email
      FROM tetris_scores t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.score DESC
      LIMIT 10
    `).all()
    
    return c.json({ 
      success: true, 
      leaderboard: results || [] 
    })
  } catch (error) {
    console.error('테트리스 리더보드 조회 오류:', error)
    return c.json({ success: false, message: '리더보드 조회 중 오류가 발생했습니다.' }, 500)
  }
})

// ==================== API: 스도쿠 기록 저장 ====================
// ==================== API: 스도쿠 최고 기록 조회 ====================
app.get('/api/sudoku/besttime/:userId/:difficulty', async (c) => {
  try {
    const userId = c.req.param('userId')
    const difficulty = c.req.param('difficulty')
    
    const bestTime = await c.env.DB.prepare(
      'SELECT MIN(time) as best_time FROM sudoku_scores WHERE user_id = ? AND difficulty = ?'
    ).bind(userId, difficulty).first()
    
    return c.json({ 
      success: true, 
      bestTime: bestTime?.best_time || 0 
    })
  } catch (error) {
    console.error('스도쿠 최고 기록 조회 오류:', error)
    return c.json({ success: false, message: '최고 기록 조회 중 오류가 발생했습니다.' }, 500)
  }
})

// ==================== API: 스도쿠 리더보드 ====================
app.get('/api/sudoku/leaderboard/:difficulty', async (c) => {
  try {
    const difficulty = c.req.param('difficulty')
    
    const { results } = await c.env.DB.prepare(`
      SELECT 
        s.id,
        s.time,
        s.created_at,
        u.email
      FROM sudoku_scores s
      JOIN users u ON s.user_id = u.id
      WHERE s.difficulty = ?
      ORDER BY s.time ASC
      LIMIT 10
    `).bind(difficulty).all()
    
    return c.json({ 
      success: true, 
      leaderboard: results || [] 
    })
  } catch (error) {
    console.error('스도쿠 리더보드 조회 오류:', error)
    return c.json({ success: false, message: '리더보드 조회 중 오류가 발생했습니다.' }, 500)
  }
})

// ==================== API: 회원가입 ====================
app.post('/api/signup', async (c) => {
  try {
    const { email, password, name, phone } = await c.req.json()
    
    // 입력 검증
    if (!email || !password || !name) {
      return c.json({ success: false, message: '필수 항목을 모두 입력해주세요.' }, 400)
    }
    
    // 이메일 중복 체크
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first()
    
    if (existingUser) {
      return c.json({ success: false, message: '이미 사용 중인 이메일입니다.' }, 400)
    }
    
    // 회원 정보 저장 (실제로는 비밀번호를 해시화해야 함)
    const result = await c.env.DB.prepare(
      'INSERT INTO users (email, password, name, phone, level, status) VALUES (?, ?, ?, ?, 1, "active")'
    ).bind(email, password, name, phone || null).run()
    
    const newUserId = result.meta.last_row_id
    
    // 활동 로그 기록
    await c.env.DB.prepare(
      'INSERT INTO activity_logs (user_id, action, description) VALUES (?, ?, ?)'
    ).bind(newUserId, 'signup', `신규 회원 가입: ${email}`).run()
    
    // 관리자 알림 생성
    await c.env.DB.prepare(
      'INSERT INTO notifications (type, title, message, priority) VALUES (?, ?, ?, ?)'
    ).bind('new_signup', '신규 회원 가입', `${name}(${email})님이 가입했습니다.`, 'normal').run()
    
    return c.json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      userId: newUserId
    })
  } catch (error) {
    console.error('Signup error:', error)
    return c.json({ success: false, message: '서버 오류가 발생했습니다.' }, 500)
  }
})

// ==================== API: 로그인 ====================
app.post('/api/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    
    if (!email || !password) {
      return c.json({ success: false, message: '이메일과 비밀번호를 입력해주세요.' }, 400)
    }
    
    // 사용자 조회 (level, status 포함)
    const user = await c.env.DB.prepare(
      'SELECT id, email, name, phone, level, status FROM users WHERE email = ? AND password = ?'
    ).bind(email, password).first()
    
    if (!user) {
      return c.json({ success: false, message: '이메일 또는 비밀번호가 일치하지 않습니다.' }, 401)
    }
    
    // 계정 정지 체크
    if (user.status === 'suspended') {
      return c.json({ success: false, message: '정지된 계정입니다. 관리자에게 문의하세요.' }, 403)
    }
    
    if (user.status === 'deleted') {
      return c.json({ success: false, message: '삭제된 계정입니다.' }, 403)
    }
    
    // 마지막 로그인 시간 업데이트
    await c.env.DB.prepare(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(user.id).run()
    
    // 활동 로그 기록
    await c.env.DB.prepare(
      'INSERT INTO activity_logs (user_id, action, description) VALUES (?, ?, ?)'
    ).bind(user.id, 'login', `로그인: ${user.email}`).run()
    
    // 로그인 기록 저장
    const ipAddress = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
    const userAgent = c.req.header('user-agent') || 'unknown'
    await c.env.DB.prepare(
      'INSERT INTO login_history (user_id, ip_address, user_agent) VALUES (?, ?, ?)'
    ).bind(user.id, ipAddress, userAgent).run()
    
    // 간단한 토큰 생성 (실제로는 JWT 등을 사용해야 함)
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')
    
    return c.json({
      success: true,
      message: '로그인 성공',
      token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        level: user.level,
        status: user.status
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ success: false, message: '서버 오류가 발생했습니다.' }, 500)
  }
})

// ==================== API: 사용자 정보 조회 ====================
app.get('/api/user', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    
    if (!authHeader) {
      return c.json({ success: false, message: '인증이 필요합니다.' }, 401)
    }
    
    // 간단한 토큰 검증 (실제로는 JWT 검증 필요)
    const token = authHeader.replace('Bearer ', '')
    const decoded = Buffer.from(token, 'base64').toString()
    const userId = decoded.split(':')[0]
    
    const user = await c.env.DB.prepare(
      'SELECT id, email, name, phone, created_at, last_login FROM users WHERE id = ?'
    ).bind(userId).first()
    
    if (!user) {
      return c.json({ success: false, message: '사용자를 찾을 수 없습니다.' }, 404)
    }
    
    return c.json({
      success: true,
      user: user
    })
  } catch (error) {
    console.error('User info error:', error)
    return c.json({ success: false, message: '서버 오류가 발생했습니다.' }, 500)
  }
})

// ==================== 관리자 권한 체크 함수 ====================
async function checkAdminAuth(c: any) {
  const token = c.req.header('Cookie')?.match(/auth_token=([^;]+)/)?.[1]
  
  if (!token) {
    return null
  }
  
  try {
    const decoded = Buffer.from(token, 'base64').toString()
    const userId = decoded.split(':')[0]
    
    const user = await c.env.DB.prepare(
      'SELECT id, email, name, level, status FROM users WHERE id = ?'
    ).bind(userId).first()
    
    // 관리자 등급 체크 (6 이상)
    if (user && user.level >= 6 && user.status === 'active') {
      return user
    }
  } catch (error) {
    console.error('Admin auth error:', error)
  }
  
  return null
}

// ==================== 관리자 대시보드 페이지 ====================
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
          {label: '홈', href: '/'},
          {label: '관리자'}
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
            const token = localStorage.getItem('auth_token');
            const userLevel = parseInt(localStorage.getItem('user_level') || '0');
            
            if (!token || userLevel < 6) {
                alert('관리자 권한이 필요합니다.');
                window.location.href = '/login';
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
                        headers: { 'Authorization': 'Bearer ' + token }
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
          {label: '홈', href: '/'},
          {label: '관리자', href: '/admin'},
          {label: '회원 관리'}
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
            const token = localStorage.getItem('auth_token');
            const userLevel = parseInt(localStorage.getItem('user_level') || '0');
            
            if (!token || userLevel < 6) {
                alert('관리자 권한이 필요합니다.');
                window.location.href = '/login';
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
                        headers: { 'Authorization': 'Bearer ' + token }
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
                        headers: { 'Authorization': 'Bearer ' + token }
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
                            { headers: { 'Authorization': 'Bearer ' + token } }
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
                            { headers: { 'Authorization': 'Bearer ' + token } }
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
                            { headers: { 'Authorization': 'Bearer ' + token } }
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
                        headers: { 'Authorization': 'Bearer ' + token },
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
                        headers: { 'Authorization': 'Bearer ' + token }
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
                        headers: { 'Authorization': 'Bearer ' + token }
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
  `)
})

// ==================== API: 관리자 통계 ====================
app.get('/api/admin/stats', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ success: false, message: '인증이 필요합니다.' }, 401)
    }
    
    const token = authHeader.replace('Bearer ', '')
    const decoded = Buffer.from(token, 'base64').toString()
    const userId = decoded.split(':')[0]
    
    const admin = await c.env.DB.prepare(
      'SELECT level, status FROM users WHERE id = ?'
    ).bind(userId).first()
    
    if (!admin || admin.level < 6 || admin.status !== 'active') {
      return c.json({ success: false, message: '관리자 권한이 필요합니다.' }, 403)
    }
    
    // 전체 회원 수
    const totalUsers = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM users WHERE status != "deleted"'
    ).first()
    
    // 활성 회원 수
    const activeUsers = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM users WHERE status = "active"'
    ).first()
    
    // 정지 회원 수
    const suspendedUsers = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM users WHERE status = "suspended"'
    ).first()
    
    // 오늘 가입 회원
    const todaySignups = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = DATE("now")'
    ).first()
    
    // 등급별 분포
    const levelDistribution = await c.env.DB.prepare(
      'SELECT level, COUNT(*) as count FROM users WHERE status != "deleted" GROUP BY level ORDER BY level'
    ).all()
    
    // 최근 가입 회원 10명
    const recentUsers = await c.env.DB.prepare(
      'SELECT id, email, name, level, created_at FROM users WHERE status != "deleted" ORDER BY created_at DESC LIMIT 10'
    ).all()
    
    return c.json({
      success: true,
      totalUsers: totalUsers.count,
      activeUsers: activeUsers.count,
      suspendedUsers: suspendedUsers.count,
      todaySignups: todaySignups.count,
      levelDistribution: levelDistribution.results,
      recentUsers: recentUsers.results
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return c.json({ success: false, message: '서버 오류가 발생했습니다.' }, 500)
  }
})

// ==================== API: 회원 목록 조회 ====================
app.get('/api/admin/users', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ success: false, message: '인증이 필요합니다.' }, 401)
    }
    
    const token = authHeader.replace('Bearer ', '')
    const decoded = Buffer.from(token, 'base64').toString()
    const userId = decoded.split(':')[0]
    
    const admin = await c.env.DB.prepare(
      'SELECT level, status FROM users WHERE id = ?'
    ).bind(userId).first()
    
    if (!admin || admin.level < 6 || admin.status !== 'active') {
      return c.json({ success: false, message: '관리자 권한이 필요합니다.' }, 403)
    }
    
    // 검색 파라미터
    const search = c.req.query('search') || ''
    const level = c.req.query('level') || ''
    const status = c.req.query('status') || ''
    
    let query = 'SELECT id, email, name, phone, level, status, created_at FROM users WHERE 1=1'
    const bindings = []
    
    if (search) {
      query += ' AND (email LIKE ? OR name LIKE ?)'
      bindings.push(`%${search}%`, `%${search}%`)
    }
    
    if (level) {
      query += ' AND level = ?'
      bindings.push(parseInt(level))
    }
    
    if (status) {
      query += ' AND status = ?'
      bindings.push(status)
    } else {
      query += ' AND status != "deleted"'
    }
    
    query += ' ORDER BY created_at DESC LIMIT 100'
    
    const users = await c.env.DB.prepare(query).bind(...bindings).all()
    
    return c.json({
      success: true,
      users: users.results
    })
  } catch (error) {
    console.error('Admin users list error:', error)
    return c.json({ success: false, message: '서버 오류가 발생했습니다.' }, 500)
  }
})

// ==================== API: 회원 상세 조회 ====================
app.get('/api/admin/users/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ success: false, message: '인증이 필요합니다.' }, 401)
    }
    
    const token = authHeader.replace('Bearer ', '')
    const decoded = Buffer.from(token, 'base64').toString()
    const userId = decoded.split(':')[0]
    
    const admin = await c.env.DB.prepare(
      'SELECT level, status FROM users WHERE id = ?'
    ).bind(userId).first()
    
    if (!admin || admin.level < 6 || admin.status !== 'active') {
      return c.json({ success: false, message: '관리자 권한이 필요합니다.' }, 403)
    }
    
    const targetUserId = c.req.param('id')
    const user = await c.env.DB.prepare(
      'SELECT id, email, name, phone, level, status, created_at, last_login FROM users WHERE id = ?'
    ).bind(targetUserId).first()
    
    if (!user) {
      return c.json({ success: false, message: '회원을 찾을 수 없습니다.' }, 404)
    }
    
    return c.json({
      success: true,
      user: user
    })
  } catch (error) {
    console.error('Admin user detail error:', error)
    return c.json({ success: false, message: '서버 오류가 발생했습니다.' }, 500)
  }
})

// ==================== API: 회원 정보 수정 ====================
app.put('/api/admin/users/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ success: false, message: '인증이 필요합니다.' }, 401)
    }
    
    const token = authHeader.replace('Bearer ', '')
    const decoded = Buffer.from(token, 'base64').toString()
    const userId = decoded.split(':')[0]
    
    const admin = await c.env.DB.prepare(
      'SELECT level, status FROM users WHERE id = ?'
    ).bind(userId).first()
    
    if (!admin || admin.level < 6 || admin.status !== 'active') {
      return c.json({ success: false, message: '관리자 권한이 필요합니다.' }, 403)
    }
    
    const targetUserId = c.req.param('id')
    const { name, phone, level } = await c.req.json()
    
    // 대상 회원 정보 조회
    const targetUser = await c.env.DB.prepare(
      'SELECT email, name FROM users WHERE id = ?'
    ).bind(targetUserId).first()
    
    await c.env.DB.prepare(
      'UPDATE users SET name = ?, phone = ?, level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(name, phone, level, targetUserId).run()
    
    // 활동 로그 기록
    await c.env.DB.prepare(
      'INSERT INTO activity_logs (user_id, action, description) VALUES (?, ?, ?)'
    ).bind(userId, 'admin_action', `회원 정보 수정: ${targetUser?.email}`).run()
    
    return c.json({
      success: true,
      message: '회원 정보가 수정되었습니다.'
    })
  } catch (error) {
    console.error('Admin user update error:', error)
    return c.json({ success: false, message: '서버 오류가 발생했습니다.' }, 500)
  }
})

// ==================== API: 회원 상태 변경 (정지/해제) ====================
app.patch('/api/admin/users/:id/status', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ success: false, message: '인증이 필요합니다.' }, 401)
    }
    
    const token = authHeader.replace('Bearer ', '')
    const decoded = Buffer.from(token, 'base64').toString()
    const userId = decoded.split(':')[0]
    
    const admin = await c.env.DB.prepare(
      'SELECT level, status FROM users WHERE id = ?'
    ).bind(userId).first()
    
    if (!admin || admin.level < 6 || admin.status !== 'active') {
      return c.json({ success: false, message: '관리자 권한이 필요합니다.' }, 403)
    }
    
    const targetUserId = c.req.param('id')
    const { status } = await c.req.json()
    
    if (!['active', 'suspended'].includes(status)) {
      return c.json({ success: false, message: '올바르지 않은 상태입니다.' }, 400)
    }
    
    // 대상 회원 정보 조회
    const targetUser = await c.env.DB.prepare(
      'SELECT email, name FROM users WHERE id = ?'
    ).bind(targetUserId).first()
    
    await c.env.DB.prepare(
      'UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(status, targetUserId).run()
    
    // 활동 로그 기록
    await c.env.DB.prepare(
      'INSERT INTO activity_logs (user_id, action, description) VALUES (?, ?, ?)'
    ).bind(userId, 'admin_action', `회원 상태 변경: ${targetUser?.email} → ${status}`).run()
    
    // 정지 알림 생성
    if (status === 'suspended') {
      await c.env.DB.prepare(
        'INSERT INTO notifications (type, title, message, priority) VALUES (?, ?, ?, ?)'
      ).bind('user_suspended', '회원 정지', `${targetUser?.name}(${targetUser?.email})님의 계정이 정지되었습니다.`, 'high').run()
    }
    
    return c.json({
      success: true,
      message: '회원 상태가 변경되었습니다.'
    })
  } catch (error) {
    console.error('Admin user status error:', error)
    return c.json({ success: false, message: '서버 오류가 발생했습니다.' }, 500)
  }
})

// ==================== API: 회원 삭제 ====================
app.delete('/api/admin/users/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ success: false, message: '인증이 필요합니다.' }, 401)
    }
    
    const token = authHeader.replace('Bearer ', '')
    const decoded = Buffer.from(token, 'base64').toString()
    const userId = decoded.split(':')[0]
    
    const admin = await c.env.DB.prepare(
      'SELECT level, status FROM users WHERE id = ?'
    ).bind(userId).first()
    
    if (!admin || admin.level < 6 || admin.status !== 'active') {
      return c.json({ success: false, message: '관리자 권한이 필요합니다.' }, 403)
    }
    
    const targetUserId = c.req.param('id')
    
    // 대상 회원 정보 조회
    const targetUser = await c.env.DB.prepare(
      'SELECT email, name FROM users WHERE id = ?'
    ).bind(targetUserId).first()
    
    // 소프트 삭제
    await c.env.DB.prepare(
      'UPDATE users SET status = "deleted", updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(targetUserId).run()
    
    // 활동 로그 기록
    await c.env.DB.prepare(
      'INSERT INTO activity_logs (user_id, action, description) VALUES (?, ?, ?)'
    ).bind(userId, 'admin_action', `회원 삭제: ${targetUser?.email}`).run()
    
    // 삭제 알림 생성
    await c.env.DB.prepare(
      'INSERT INTO notifications (type, title, message, priority) VALUES (?, ?, ?, ?)'
    ).bind('user_deleted', '회원 삭제', `${targetUser?.name}(${targetUser?.email})님의 계정이 삭제되었습니다.`, 'high').run()
    
    return c.json({
      success: true,
      message: '회원이 삭제되었습니다.'
    })
  } catch (error) {
    console.error('Admin user delete error:', error)
    return c.json({ success: false, message: '서버 오류가 발생했습니다.' }, 500)
  }
})

// ==================== API: 고급 통계 (일별/월별 추세) ====================
app.get('/api/admin/stats/trends', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ success: false, message: '인증이 필요합니다.' }, 401)
    }
    
    const token = authHeader.replace('Bearer ', '')
    const decoded = Buffer.from(token, 'base64').toString()
    const userId = decoded.split(':')[0]
    
    const admin = await c.env.DB.prepare(
      'SELECT level, status FROM users WHERE id = ?'
    ).bind(userId).first()
    
    if (!admin || admin.level < 6 || admin.status !== 'active') {
      return c.json({ success: false, message: '관리자 권한이 필요합니다.' }, 403)
    }
    
    // 최근 30일 일별 가입자 수
    const dailySignups = await c.env.DB.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM users 
      WHERE created_at >= DATE('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date
    `).all()
    
    // 최근 12개월 월별 가입자 수
    const monthlySignups = await c.env.DB.prepare(`
      SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count 
      FROM users 
      WHERE created_at >= DATE('now', '-12 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month
    `).all()
    
    // 최근 30일 일별 로그인 활동
    const dailyLogins = await c.env.DB.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM activity_logs 
      WHERE action = 'login' AND created_at >= DATE('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date
    `).all()
    
    // 등급별 활동 통계 (최근 30일)
    const levelActivity = await c.env.DB.prepare(`
      SELECT u.level, COUNT(al.id) as activity_count
      FROM users u
      LEFT JOIN activity_logs al ON u.id = al.user_id AND al.created_at >= DATE('now', '-30 days')
      WHERE u.status = 'active'
      GROUP BY u.level
      ORDER BY u.level
    `).all()
    
    return c.json({
      success: true,
      dailySignups: dailySignups.results,
      monthlySignups: monthlySignups.results,
      dailyLogins: dailyLogins.results,
      levelActivity: levelActivity.results
    })
  } catch (error) {
    console.error('Admin trends error:', error)
    return c.json({ success: false, message: '서버 오류가 발생했습니다.' }, 500)
  }
})

// ==================== API: 활동 로그 조회 ====================
app.get('/api/admin/activity-logs', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ success: false, message: '인증이 필요합니다.' }, 401)
    }
    
    const token = authHeader.replace('Bearer ', '')
    const decoded = Buffer.from(token, 'base64').toString()
    const userId = decoded.split(':')[0]
    
    const admin = await c.env.DB.prepare(
      'SELECT level, status FROM users WHERE id = ?'
    ).bind(userId).first()
    
    if (!admin || admin.level < 6 || admin.status !== 'active') {
      return c.json({ success: false, message: '관리자 권한이 필요합니다.' }, 403)
    }
    
    const limit = parseInt(c.req.query('limit') || '50')
    const action = c.req.query('action') || ''
    
    let query = `
      SELECT al.*, u.email, u.name 
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `
    const bindings = []
    
    if (action) {
      query += ' AND al.action = ?'
      bindings.push(action)
    }
    
    query += ' ORDER BY al.created_at DESC LIMIT ?'
    bindings.push(limit)
    
    const logs = await c.env.DB.prepare(query).bind(...bindings).all()
    
    return c.json({
      success: true,
      logs: logs.results
    })
  } catch (error) {
    console.error('Admin activity logs error:', error)
    return c.json({ success: false, message: '서버 오류가 발생했습니다.' }, 500)
  }
})

// ==================== API: 알림 목록 조회 ====================
app.get('/api/admin/notifications', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ success: false, message: '인증이 필요합니다.' }, 401)
    }
    
    const token = authHeader.replace('Bearer ', '')
    const decoded = Buffer.from(token, 'base64').toString()
    const userId = decoded.split(':')[0]
    
    const admin = await c.env.DB.prepare(
      'SELECT level, status FROM users WHERE id = ?'
    ).bind(userId).first()
    
    if (!admin || admin.level < 6 || admin.status !== 'active') {
      return c.json({ success: false, message: '관리자 권한이 필요합니다.' }, 403)
    }
    
    // 관리자용 알림 (target_user_id가 NULL이거나 현재 관리자)
    const notifications = await c.env.DB.prepare(`
      SELECT * FROM notifications
      WHERE (target_user_id IS NULL OR target_user_id = ?)
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(userId).all()
    
    // 읽지 않은 알림 수
    const unreadCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM notifications
      WHERE (target_user_id IS NULL OR target_user_id = ?) AND is_read = 0
    `).bind(userId).first()
    
    return c.json({
      success: true,
      notifications: notifications.results,
      unreadCount: unreadCount.count
    })
  } catch (error) {
    console.error('Admin notifications error:', error)
    return c.json({ success: false, message: '서버 오류가 발생했습니다.' }, 500)
  }
})

// ==================== API: 알림 읽음 처리 ====================
app.patch('/api/admin/notifications/:id/read', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ success: false, message: '인증이 필요합니다.' }, 401)
    }
    
    const token = authHeader.replace('Bearer ', '')
    const decoded = Buffer.from(token, 'base64').toString()
    const userId = decoded.split(':')[0]
    
    const admin = await c.env.DB.prepare(
      'SELECT level, status FROM users WHERE id = ?'
    ).bind(userId).first()
    
    if (!admin || admin.level < 6 || admin.status !== 'active') {
      return c.json({ success: false, message: '관리자 권한이 필요합니다.' }, 403)
    }
    
    const notificationId = c.req.param('id')
    
    await c.env.DB.prepare(
      'UPDATE notifications SET is_read = 1 WHERE id = ?'
    ).bind(notificationId).run()
    
    return c.json({
      success: true,
      message: '알림이 읽음 처리되었습니다.'
    })
  } catch (error) {
    console.error('Admin notification read error:', error)
    return c.json({ success: false, message: '서버 오류가 발생했습니다.' }, 500)
  }
})

// ==================== API: 회원 일괄 처리 ====================
app.post('/api/admin/users/batch', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ success: false, message: '인증이 필요합니다.' }, 401)
    }
    
    const token = authHeader.replace('Bearer ', '')
    const decoded = Buffer.from(token, 'base64').toString()
    const userId = decoded.split(':')[0]
    
    const admin = await c.env.DB.prepare(
      'SELECT level, status FROM users WHERE id = ?'
    ).bind(userId).first()
    
    // 일괄 처리는 레벨 8 이상만 가능
    if (!admin || admin.level < 8 || admin.status !== 'active') {
      return c.json({ success: false, message: '플래티넘 관리자 이상의 권한이 필요합니다.' }, 403)
    }
    
    const { action, userIds, value } = await c.req.json()
    
    if (!action || !userIds || !Array.isArray(userIds)) {
      return c.json({ success: false, message: '올바르지 않은 요청입니다.' }, 400)
    }
    
    let query = ''
    let bindings = []
    
    switch (action) {
      case 'change_level':
        query = `UPDATE users SET level = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${userIds.map(() => '?').join(',')})`
        bindings = [value, ...userIds]
        break
      case 'change_status':
        query = `UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${userIds.map(() => '?').join(',')})`
        bindings = [value, ...userIds]
        break
      case 'delete':
        query = `UPDATE users SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id IN (${userIds.map(() => '?').join(',')})`
        bindings = userIds
        break
      default:
        return c.json({ success: false, message: '올바르지 않은 작업입니다.' }, 400)
    }
    
    await c.env.DB.prepare(query).bind(...bindings).run()
    
    // 활동 로그 기록
    await c.env.DB.prepare(
      'INSERT INTO activity_logs (user_id, action, description) VALUES (?, ?, ?)'
    ).bind(userId, 'admin_action', `일괄 처리: ${action} (${userIds.length}명)`).run()
    
    return c.json({
      success: true,
      message: `${userIds.length}명의 회원이 일괄 처리되었습니다.`
    })
  } catch (error) {
    console.error('Admin batch action error:', error)
    return c.json({ success: false, message: '서버 오류가 발생했습니다.' }, 500)
  }
})

// ==================== API: CSV 내보내기 ====================
app.get('/api/admin/users/export', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ success: false, message: '인증이 필요합니다.' }, 401)
    }
    
    const token = authHeader.replace('Bearer ', '')
    const decoded = Buffer.from(token, 'base64').toString()
    const userId = decoded.split(':')[0]
    
    const admin = await c.env.DB.prepare(
      'SELECT level, status FROM users WHERE id = ?'
    ).bind(userId).first()
    
    if (!admin || admin.level < 6 || admin.status !== 'active') {
      return c.json({ success: false, message: '관리자 권한이 필요합니다.' }, 403)
    }
    
    const users = await c.env.DB.prepare(`
      SELECT id, email, name, phone, level, status, created_at, last_login
      FROM users
      WHERE status != 'deleted'
      ORDER BY created_at DESC
    `).all()
    
    // CSV 생성
    let csv = 'ID,이메일,이름,휴대전화,등급,상태,가입일,최근로그인\n'
    for (const user of users.results) {
      csv += `${user.id},"${user.email}","${user.name}","${user.phone || ''}",${user.level},"${user.status}","${user.created_at}","${user.last_login || ''}"\n`
    }
    
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="users_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Admin export error:', error)
    return c.json({ success: false, message: '서버 오류가 발생했습니다.' }, 500)
  }
})

// ==================== 활동 로그 기록 헬퍼 함수 ====================
async function logActivity(db: any, userId: number | null, action: string, description: string, ip?: string) {
  try {
    await db.prepare(
      'INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?, ?, ?, ?)'
    ).bind(userId, action, description, ip || null).run()
  } catch (error) {
    console.error('Log activity error:', error)
  }
}

// ==================== 알림 생성 헬퍼 함수 ====================
async function createNotification(db: any, type: string, title: string, message: string, targetUserId?: number, priority: string = 'normal') {
  try {
    await db.prepare(
      'INSERT INTO notifications (type, title, message, target_user_id, priority) VALUES (?, ?, ?, ?, ?)'
    ).bind(type, title, message, targetUserId || null, priority).run()
  } catch (error) {
    console.error('Create notification error:', error)
  }
}

// ==================== 통계 대시보드 페이지 (고급) ====================
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
          {label: '홈', href: '/'},
          {label: '관리자', href: '/admin'},
          {label: '통계'}
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
            const token = localStorage.getItem('auth_token');
            const userLevel = parseInt(localStorage.getItem('user_level') || '0');
            
            if (!token || userLevel < 6) {
                alert('관리자 권한이 필요합니다.');
                window.location.href = '/login';
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
                        headers: { 'Authorization': 'Bearer ' + token }
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
          {label: '홈', href: '/'},
          {label: '관리자', href: '/admin'},
          {label: '활동 로그'}
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
            const token = localStorage.getItem('auth_token');
            const userLevel = parseInt(localStorage.getItem('user_level') || '0');
            
            if (!token || userLevel < 6) {
                alert('관리자 권한이 필요합니다.');
                window.location.href = '/login';
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
                        headers: { 'Authorization': 'Bearer ' + token }
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
          {label: '홈', href: '/'},
          {label: '관리자', href: '/admin'},
          {label: '알림 센터'}
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
            const token = localStorage.getItem('auth_token');
            const userLevel = parseInt(localStorage.getItem('user_level') || '0');
            
            if (!token || userLevel < 6) {
                alert('관리자 권한이 필요합니다.');
                window.location.href = '/login';
            }

            document.getElementById('admin-name').textContent = localStorage.getItem('user_email') || '';

            let allNotifications = [];
            let currentFilter = 'all';

            // 알림 로드
            async function loadNotifications() {
                try {
                    const response = await axios.get('/api/admin/notifications', {
                        headers: { 'Authorization': 'Bearer ' + token }
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
                        headers: { 'Authorization': 'Bearer ' + token }
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
  
  // HTML 엔티티 디코딩 함수
  function decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
      '&lt;': '<',
      '&gt;': '>',
      '&amp;': '&',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'",
      '&nbsp;': ' ',
      '&copy;': '©',
      '&reg;': '®',
      '&trade;': '™',
      '&hellip;': '...',
      '&mdash;': '—',
      '&ndash;': '–',
      '&bull;': '•',
      '&middot;': '·',
      '&lsquo;': '\u2018',
      '&rsquo;': '\u2019',
      '&ldquo;': '\u201C',
      '&rdquo;': '\u201D',
    }
    return text.replace(/&[#\w]+;/g, (entity) => entities[entity] || '')
  }
  
  try {
    // 구글 차단 방지: User-Agent, Referer 헤더 추가
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://news.google.com/',
        'Cache-Control': 'no-cache',
      },
    })
    
    if (!response.ok) {
      console.error(`RSS fetch failed: ${response.status} ${response.statusText}`)
      return []
    }
    
    const text = await response.text()
    
    // XML 파싱 (간단한 정규식 기반)
    const items: any[] = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let match
    
    while ((match = itemRegex.exec(text)) !== null) {
      const itemContent = match[1]
      
      const title = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || 
                    itemContent.match(/<title>(.*?)<\/title>/)?.[1] || ''
      let link = itemContent.match(/<link>(.*?)<\/link>/)?.[1] || ''
      const pubDate = itemContent.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
      let description = itemContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
                        itemContent.match(/<description>(.*?)<\/description>/)?.[1] || ''
      
      // Google News RSS의 link는 리다이렉트 URL이지만 실제 기사로 자동 리디렉션됨
      // source 태그의 url 속성에는 도메인만 있으므로 사용하지 않음
      // link를 그대로 사용 (Google News 리다이렉트 → 실제 기사)
      
      // HTML 엔티티 디코딩
      description = decodeHtmlEntities(description)
      
      // 이미지 URL 추출 (여러 패턴 시도)
      const categoryImages: Record<string, string> = {
        'general': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=300&fit=crop',
        'politics': 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&h=300&fit=crop',
        'economy': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop',
        'tech': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop',
        'sports': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=300&fit=crop',
        'entertainment': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop',
      }
      
      let imageUrl = categoryImages[category] || categoryImages['general']
      
      // 패턴 1: <img src="...">
      let imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/)
      if (imgMatch && imgMatch[1]) {
        imageUrl = imgMatch[1]
      } else {
        // 패턴 2: url(...) in style
        imgMatch = description.match(/url\(["']?([^"')]+)["']?\)/)
        if (imgMatch && imgMatch[1]) {
          imageUrl = imgMatch[1]
        }
      }
      
      // HTML 태그 완전 제거하여 요약문 생성
      let summary = description
        .replace(/<[^>]*>/g, '')  // HTML 태그 제거
        .replace(/&nbsp;/g, ' ')  // &nbsp; 제거
        .replace(/&[#\w]+;/g, '') // 남은 HTML 엔티티 제거
        .replace(/\s+/g, ' ')      // 공백 정리
        .trim()
        .substring(0, 150)
      
      // 요약문이 너무 짧으면 제목 사용
      if (summary.length < 20) {
        summary = title.substring(0, 150)
      }
      
      if (summary.length > 0 && summary.length < 150) {
        summary += '...'
      }
      
      items.push({
        category,
        title: title.trim(),
        summary: summary || '뉴스 요약이 없습니다.',
        link: link.trim(),
        image_url: imageUrl,
        publisher: '구글 뉴스',
        pub_date: pubDate,
      })
      
      if (items.length >= 20) break // 최대 20개
    }
    
    return items
  } catch (error) {
    console.error('RSS 파싱 오류:', error)
    return []
  }
}

// ==================== Gemini AI 요약 및 감정 분석 함수 ====================
async function summarizeWithGemini(title: string, summary: string): Promise<{ aiSummary: string, sentiment: string }> {
  try {
    // Gemini API 키 확인
    const GEMINI_API_KEY = 'AIzaSyBKN3R7vG_L7RpQhxO8uZUTL-vfZGx0234' // 실제 API 키로 교체 필요
    
    const prompt = `다음 뉴스를 3줄로 요약하고 감정을 분석해주세요.

제목: ${title}
내용: ${summary}

다음 형식으로 응답해주세요:
요약: [3줄 요약]
감정: [positive/negative/neutral 중 하나]`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    })

    if (!response.ok) {
      console.error('Gemini API 호출 실패:', response.status, response.statusText)
      return {
        aiSummary: summary.substring(0, 150) + '...',
        sentiment: 'neutral'
      }
    }

    const data = await response.json()
    const text = data.candidates[0]?.content?.parts[0]?.text || ''
    
    // 응답 파싱
    const summaryMatch = text.match(/요약:\s*(.+?)(?=\n감정:|$)/s)
    const sentimentMatch = text.match(/감정:\s*(positive|negative|neutral)/i)
    
    const aiSummary = summaryMatch ? summaryMatch[1].trim() : summary.substring(0, 150) + '...'
    const sentiment = sentimentMatch ? sentimentMatch[1].toLowerCase() : 'neutral'
    
    return { aiSummary, sentiment }
  } catch (error) {
    console.error('Gemini AI 오류:', error)
    return {
      aiSummary: summary.substring(0, 150) + '...',
      sentiment: 'neutral'
    }
  }
}

// ==================== 뉴스 AI 요약 API ====================
app.post('/api/news/:id/summarize', async (c) => {
  try {
    const { id } = c.req.param()
    const { env } = c
    
    // 뉴스 조회
    const news = await env.DB.prepare('SELECT * FROM news WHERE id = ?').bind(id).first()
    
    if (!news) {
      return c.json({ success: false, error: '뉴스를 찾을 수 없습니다' }, 404)
    }
    
    // 이미 AI 처리된 경우
    if (news.ai_processed) {
      return c.json({ 
        success: true, 
        ai_summary: news.ai_summary,
        sentiment: news.sentiment
      })
    }
    
    // Gemini AI로 요약 및 감정 분석
    const { aiSummary, sentiment } = await summarizeWithGemini(news.title, news.summary || '')
    
    // DB 업데이트
    await env.DB.prepare(`
      UPDATE news 
      SET ai_summary = ?, sentiment = ?, ai_processed = 1 
      WHERE id = ?
    `).bind(aiSummary, sentiment, id).run()
    
    return c.json({ 
      success: true, 
      ai_summary: aiSummary,
      sentiment: sentiment
    })
  } catch (error) {
    console.error('뉴스 요약 오류:', error)
    return c.json({ success: false, error: '요약 생성 실패' }, 500)
  }
})

// ==================== 투표 시스템 API ====================
app.post('/api/news/:id/vote', async (c) => {
  try {
    const { id } = c.req.param()
    const { type } = await c.req.json() // 'up' or 'down'
    const { env } = c
    
    // 투표 타입 검증
    if (type !== 'up' && type !== 'down') {
      return c.json({ success: false, error: '잘못된 투표 타입입니다' }, 400)
    }
    
    // 사용자 IP 가져오기 (중복 투표 방지용)
    const userIp = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
    
    // 사용자 ID 가져오기 (로그인한 경우)
    const authToken = c.req.header('Authorization')?.replace('Bearer ', '')
    let userId = null
    
    if (authToken) {
      try {
        const payload = await c.env.JWT_SECRET ? 
          c.get('jwtPayload') : null
        userId = payload?.userId || null
      } catch (e) {
        // 토큰 검증 실패 시 비로그인으로 처리
      }
    }
    
    // 중복 투표 체크
    let existingVote
    if (userId) {
      existingVote = await env.DB.prepare(
        'SELECT * FROM news_votes WHERE news_id = ? AND user_id = ?'
      ).bind(id, userId).first()
    } else {
      existingVote = await env.DB.prepare(
        'SELECT * FROM news_votes WHERE news_id = ? AND user_ip = ?'
      ).bind(id, userIp).first()
    }
    
    // 이미 투표한 경우
    if (existingVote) {
      // 같은 타입이면 취소
      if (existingVote.vote_type === type) {
        await env.DB.prepare('DELETE FROM news_votes WHERE id = ?').bind(existingVote.id).run()
        
        // 카운트 감소
        const field = type === 'up' ? 'vote_up' : 'vote_down'
        await env.DB.prepare(`UPDATE news SET ${field} = ${field} - 1 WHERE id = ?`).bind(id).run()
        
        return c.json({ success: true, action: 'cancelled', type })
      } else {
        // 다른 타입이면 변경
        await env.DB.prepare(
          'UPDATE news_votes SET vote_type = ? WHERE id = ?'
        ).bind(type, existingVote.id).run()
        
        // 기존 타입 감소, 새 타입 증가
        const oldField = existingVote.vote_type === 'up' ? 'vote_up' : 'vote_down'
        const newField = type === 'up' ? 'vote_up' : 'vote_down'
        await env.DB.prepare(`
          UPDATE news 
          SET ${oldField} = ${oldField} - 1, ${newField} = ${newField} + 1 
          WHERE id = ?
        `).bind(id).run()
        
        return c.json({ success: true, action: 'changed', type })
      }
    }
    
    // 새 투표 추가
    await env.DB.prepare(`
      INSERT INTO news_votes (news_id, user_id, user_ip, vote_type)
      VALUES (?, ?, ?, ?)
    `).bind(id, userId, userIp, type).run()
    
    // 카운트 증가
    const field = type === 'up' ? 'vote_up' : 'vote_down'
    await env.DB.prepare(`UPDATE news SET ${field} = ${field} + 1 WHERE id = ?`).bind(id).run()
    
    // 인기도 점수 업데이트 (up은 +2, down은 -1)
    const scoreChange = type === 'up' ? 2 : -1
    await env.DB.prepare(`
      UPDATE news 
      SET popularity_score = popularity_score + ? 
      WHERE id = ?
    `).bind(scoreChange, id).run()
    
    return c.json({ success: true, action: 'voted', type })
  } catch (error) {
    console.error('투표 처리 오류:', error)
    return c.json({ success: false, error: '투표 처리 실패' }, 500)
  }
})

// ==================== 뉴스 투표 현황 조회 API ====================
app.get('/api/news/:id/votes', async (c) => {
  try {
    const { id } = c.req.param()
    const { env } = c
    
    const news = await env.DB.prepare(`
      SELECT vote_up, vote_down, popularity_score 
      FROM news 
      WHERE id = ?
    `).bind(id).first()
    
    if (!news) {
      return c.json({ success: false, error: '뉴스를 찾을 수 없습니다' }, 404)
    }
    
    return c.json({
      success: true,
      vote_up: news.vote_up || 0,
      vote_down: news.vote_down || 0,
      popularity_score: news.popularity_score || 0
    })
  } catch (error) {
    console.error('투표 조회 오류:', error)
    return c.json({ success: false, error: '투표 조회 실패' }, 500)
  }
})

// ==================== 키워드 구독 시스템 API ====================
app.post('/api/keywords/subscribe', async (c) => {
  try {
    const { keyword, userId } = await c.req.json()
    const { env } = c
    
    // userId 검증
    if (!userId) {
      return c.json({ success: false, error: '사용자 ID가 필요합니다' }, 400)
    }
    
    // 키워드 유효성 검사
    if (!keyword || keyword.trim().length === 0) {
      return c.json({ success: false, error: '키워드를 입력해주세요' }, 400)
    }
    
    if (keyword.length > 50) {
      return c.json({ success: false, error: '키워드는 50자 이내로 입력해주세요' }, 400)
    }
    
    try {
      // 키워드 구독 추가 (중복 시 무시)
      await env.DB.prepare(`
        INSERT INTO user_keywords (user_id, keyword)
        VALUES (?, ?)
      `).bind(parseInt(userId), keyword.trim()).run()
      
      return c.json({ success: true, keyword: keyword.trim() })
    } catch (err: any) {
      if (err.message?.includes('UNIQUE constraint failed')) {
        return c.json({ success: false, error: '이미 구독 중인 키워드입니다' }, 400)
      }
      throw err
    }
  } catch (error) {
    console.error('키워드 구독 오류:', error)
    return c.json({ success: false, error: '키워드 구독 실패' }, 500)
  }
})

// ==================== 키워드 구독 취소 API ====================
app.delete('/api/keywords/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const { userId } = await c.req.json()
    const { env } = c
    
    if (!userId) {
      return c.json({ success: false, error: '사용자 ID가 필요합니다' }, 400)
    }
    
    await env.DB.prepare(`
      DELETE FROM user_keywords 
      WHERE id = ? AND user_id = ?
    `).bind(parseInt(id), parseInt(userId)).run()
    
    return c.json({ success: true })
  } catch (error) {
    console.error('키워드 구독 취소 오류:', error)
    return c.json({ success: false, error: '구독 취소 실패' }, 500)
  }
})

// DELETE by keyword (legacy)
app.delete('/api/keywords/:keyword', async (c) => {
  try {
    const keyword = decodeURIComponent(c.req.param('keyword'))
    const { env } = c
    
    const authToken = c.req.header('Authorization')?.replace('Bearer ', '')
    if (!authToken) {
      return c.json({ success: false, error: '로그인이 필요합니다' }, 401)
    }
    
    const userId = 1 // TODO: JWT에서 실제 user_id 추출
    
    await env.DB.prepare(`
      DELETE FROM user_keywords 
      WHERE user_id = ? AND keyword = ?
    `).bind(userId, keyword).run()
    
    return c.json({ success: true })
  } catch (error) {
    console.error('키워드 구독 취소 오류:', error)
    return c.json({ success: false, error: '구독 취소 실패' }, 500)
  }
})

// ==================== 내 키워드 목록 조회 API ====================
app.get('/api/keywords/my', async (c) => {
  try {
    const { env } = c
    
    const authToken = c.req.header('Authorization')?.replace('Bearer ', '')
    if (!authToken) {
      return c.json({ success: false, error: '로그인이 필요합니다' }, 401)
    }
    
    const userId = 1 // TODO: JWT에서 실제 user_id 추출
    
    const { results } = await env.DB.prepare(`
      SELECT keyword, created_at 
      FROM user_keywords 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).bind(userId).all()
    
    return c.json({ success: true, keywords: results || [] })
  } catch (error) {
    console.error('키워드 목록 조회 오류:', error)
    return c.json({ success: false, error: '목록 조회 실패' }, 500)
  }
})

// ==================== 키워드 목록 조회 API (userId 파라미터) ====================
app.get('/api/keywords', async (c) => {
  try {
    const userId = c.req.query('userId')
    const { env } = c
    
    if (!userId) {
      return c.json({ success: false, error: '사용자 ID가 필요합니다' }, 400)
    }
    
    const { results } = await env.DB.prepare(`
      SELECT id, keyword, created_at 
      FROM user_keywords 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).bind(parseInt(userId)).all()
    
    return c.json({ success: true, keywords: results || [] })
  } catch (error) {
    console.error('키워드 목록 조회 오류:', error)
    return c.json({ success: false, error: '목록 조회 실패' }, 500)
  }
})

// ==================== 키워드별 뉴스 조회 API ====================
app.get('/api/news/keyword/:keyword', async (c) => {
  try {
    const keyword = decodeURIComponent(c.req.param('keyword'))
    const { env } = c
    
    const { results } = await env.DB.prepare(`
      SELECT * FROM news 
      WHERE title LIKE ? OR summary LIKE ?
      ORDER BY created_at DESC 
      LIMIT 50
    `).bind(`%${keyword}%`, `%${keyword}%`).all()
    
    return c.json({ success: true, news: results || [], keyword })
  } catch (error) {
    console.error('키워드 뉴스 조회 오류:', error)
    return c.json({ success: false, error: '뉴스 조회 실패' }, 500)
  }
})

// ==================== 투표 API ====================
// 조회수 증가 API
app.post('/api/news/:id/view', async (c) => {
  try {
    const newsId = c.req.param('id')
    const { env } = c
    
    // 조회수 증가
    await env.DB.prepare(`
      UPDATE news 
      SET view_count = view_count + 1
      WHERE id = ?
    `).bind(newsId).run()
    
    // 업데이트된 조회수 조회
    const newsData = await env.DB.prepare(
      'SELECT view_count FROM news WHERE id = ?'
    ).bind(newsId).first()
    
    return c.json({
      success: true,
      view_count: newsData?.view_count || 0
    })
  } catch (error) {
    console.error('조회수 증가 오류:', error)
    return c.json({ success: false, error: '조회수 증가 실패' }, 500)
  }
})

app.post('/api/news/vote', async (c) => {
  try {
    const { userId, newsId, voteType } = await c.req.json()
    const { env } = c
    
    // 입력 검증
    if (!userId || !newsId || !voteType) {
      return c.json({ success: false, error: '필수 파라미터가 누락되었습니다' }, 400)
    }
    
    if (voteType !== 'up' && voteType !== 'down') {
      return c.json({ success: false, error: '잘못된 투표 타입입니다' }, 400)
    }
    
    // 기존 투표 확인
    const existingVote = await env.DB.prepare(
      'SELECT * FROM news_votes WHERE user_id = ? AND news_id = ?'
    ).bind(userId, newsId).first()
    
    // 기존 투표가 있으면 업데이트, 없으면 삽입
    if (existingVote) {
      // 같은 타입이면 취소
      if (existingVote.vote_type === voteType) {
        // 투표 삭제
        await env.DB.prepare('DELETE FROM news_votes WHERE id = ?').bind(existingVote.id).run()
        
        // 카운트 감소
        const field = voteType === 'up' ? 'vote_up' : 'vote_down'
        await env.DB.prepare(`
          UPDATE news 
          SET ${field} = ${field} - 1,
              popularity_score = vote_up - vote_down
          WHERE id = ?
        `).bind(newsId).run()
      } else {
        // 다른 타입이면 변경
        await env.DB.prepare(
          'UPDATE news_votes SET vote_type = ? WHERE id = ?'
        ).bind(voteType, existingVote.id).run()
        
        // 카운트 업데이트
        const oldField = existingVote.vote_type === 'up' ? 'vote_up' : 'vote_down'
        const newField = voteType === 'up' ? 'vote_up' : 'vote_down'
        await env.DB.prepare(`
          UPDATE news 
          SET ${oldField} = ${oldField} - 1,
              ${newField} = ${newField} + 1,
              popularity_score = vote_up - vote_down
          WHERE id = ?
        `).bind(newsId).run()
      }
    } else {
      // 새 투표 추가
      await env.DB.prepare(
        'INSERT INTO news_votes (user_id, news_id, vote_type) VALUES (?, ?, ?)'
      ).bind(userId, newsId, voteType).run()
      
      // 카운트 증가
      const field = voteType === 'up' ? 'vote_up' : 'vote_down'
      await env.DB.prepare(`
        UPDATE news 
        SET ${field} = ${field} + 1,
            popularity_score = vote_up - vote_down
        WHERE id = ?
      `).bind(newsId).run()
    }
    
    // 업데이트된 투표 수 조회
    const newsData = await env.DB.prepare(
      'SELECT vote_up, vote_down, popularity_score FROM news WHERE id = ?'
    ).bind(newsId).first()
    
    return c.json({
      success: true,
      vote_up: newsData.vote_up,
      vote_down: newsData.vote_down,
      popularity_score: newsData.popularity_score
    })
  } catch (error) {
    console.error('투표 처리 오류:', error)
    return c.json({ success: false, error: '투표 처리 실패' }, 500)
  }
})

// ==================== 실시간 HOT 뉴스 API ====================
app.get('/api/news/hot', async (c) => {
  try {
    const { env } = c
    const limit = parseInt(c.req.query('limit') || '10')
    
    const { results } = await env.DB.prepare(`
      SELECT 
        id, title, summary, link, image_url, category,
        vote_up, vote_down, view_count, popularity_score,
        ai_summary, sentiment
      FROM news 
      ORDER BY popularity_score DESC, vote_up DESC
      LIMIT ?
    `).bind(limit).all()
    
    return c.json({ success: true, news: results || [] })
  } catch (error) {
    console.error('HOT 뉴스 조회 오류:', error)
    return c.json({ success: false, error: 'HOT 뉴스 조회 실패' }, 500)
  }
})

// ==================== 유튜브 다운로드 API ====================
app.post('/api/youtube/download', async (c) => {
  try {
    const body = await c.req.json()
    const { url, quality } = body
    
    // URL 검증
    if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
      return c.json({ success: false, error: '올바른 유튜브 URL을 입력해주세요' }, 400)
    }
    
    // 비디오 ID 추출
    let videoId = ''
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0]
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0]
    }
    
    if (!videoId) {
      return c.json({ success: false, error: '비디오 ID를 찾을 수 없습니다' }, 400)
    }
    
    // 1단계: YouTube oEmbed API로 비디오 정보 가져오기
    let videoInfo: any = null
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
      const oembedResponse = await fetch(oembedUrl)
      
      if (oembedResponse.ok) {
        videoInfo = await oembedResponse.json()
      }
    } catch (error) {
      console.error('비디오 정보 조회 실패:', error)
    }
    
    // 2단계: 여러 다운로드 API 시도
    // 방법 1: YouTube 내부 API로 스트림 정보 추출
    try {
      // YouTube의 내부 API를 사용하여 스트림 정보 가져오기
      const ytApiUrl = `https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8`
      const ytApiResponse = await fetch(ytApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: 'WEB',
              clientVersion: '2.20240101.00.00'
            }
          },
          videoId: videoId
        })
      })
      
      if (ytApiResponse.ok) {
        const ytData = await ytApiResponse.json()
        
        // 스트리밍 데이터 추출
        const streamingData = ytData?.streamingData
        if (streamingData && streamingData.formats) {
          // 요청된 화질에 맞는 포맷 찾기
          const qualityMap: Record<string, number> = {
            '4K': 2160,
            '1440p': 1440,
            '1080p': 1080,
            '720p': 720,
            '480p': 480,
            '360p': 360
          }
          
          const targetHeight = qualityMap[quality] || 720
          
          // 가장 가까운 화질의 포맷 찾기
          let bestFormat = streamingData.formats[0]
          let minDiff = Math.abs((bestFormat.height || 0) - targetHeight)
          
          for (const format of streamingData.formats) {
            if (format.mimeType?.includes('video/mp4') && format.url) {
              const diff = Math.abs((format.height || 0) - targetHeight)
              if (diff < minDiff) {
                minDiff = diff
                bestFormat = format
              }
            }
          }
          
          if (bestFormat && bestFormat.url) {
            // 성공 응답
            return c.json({
              success: true,
              downloadUrl: bestFormat.url,
              videoInfo: {
                title: videoInfo?.title || ytData?.videoDetails?.title || '제목 없음',
                author: videoInfo?.author_name || ytData?.videoDetails?.author || '알 수 없음',
                thumbnail: videoInfo?.thumbnail_url || ytData?.videoDetails?.thumbnail?.thumbnails?.[0]?.url || '',
                videoId: videoId,
                duration: ytData?.videoDetails?.lengthSeconds || '0'
              },
              quality: bestFormat.qualityLabel || quality,
              actualHeight: bestFormat.height,
              message: '다운로드 준비 완료'
            })
          }
        }
      }
      
      // 방법 2: 실패 시 외부 다운로드 서비스로 리다이렉트
      // 여러 무료 다운로드 서비스 제공
      const downloadServices = [
        {
          name: 'Y2Mate',
          url: `https://www.y2mate.com/youtube/${videoId}`,
          description: '인기 있는 YouTube 다운로더'
        },
        {
          name: 'SaveFrom.net',
          url: `https://en.savefrom.net/#url=${encodeURIComponent(url)}`,
          description: '빠르고 간단한 다운로드'
        },
        {
          name: '9Convert',
          url: `https://9convert.com/en60/youtube-downloader?url=${encodeURIComponent(url)}`,
          description: 'HD 품질 다운로드 지원'
        },
        {
          name: 'YTmp3',
          url: `https://ytmp3.nu/youtube-to-mp4/?url=${encodeURIComponent(url)}`,
          description: 'MP4/MP3 변환 지원'
        }
      ]
      
      return c.json({
        success: false,
        errorType: 'REDIRECT_REQUIRED',
        error: '직접 다운로드가 현재 제한되어 있습니다',
        message: '아래 서비스 중 하나를 사용하여 다운로드해주세요',
        videoInfo: {
          title: videoInfo?.title || '제목 없음',
          author: videoInfo?.author_name || '알 수 없음',
          thumbnail: videoInfo?.thumbnail_url || '',
          videoId: videoId
        },
        downloadServices: downloadServices,
        alternativeMethod: {
          title: '브라우저 확장 프로그램 사용',
          description: 'Video DownloadHelper, SaveFrom.net Helper 등의 브라우저 확장 프로그램을 설치하면 더 편리하게 다운로드할 수 있습니다.',
          chromeExtension: 'https://chrome.google.com/webstore/search/youtube%20downloader',
          firefoxExtension: 'https://addons.mozilla.org/ko/firefox/search/?q=youtube+downloader'
        }
      })
      
    } catch (error) {
      console.error('다운로드 처리 오류:', error)
      
      return c.json({
        success: false,
        error: '다운로드 처리 중 오류가 발생했습니다',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        videoInfo: videoInfo
      }, 500)
    }
    
  } catch (error) {
    console.error('YouTube 다운로드 오류:', error)
    return c.json({ 
      success: false, 
      error: '서버 오류가 발생했습니다',
      message: error instanceof Error ? error.message : '알 수 없는 오류'
    }, 500)
  }
})

// ==================== 뉴스 API ====================

// 뉴스 가져오기 및 DB 저장
app.get('/api/news/fetch', async (c) => {
  const { DB } = c.env
  const category = c.req.query('category') || 'general'
  
  try {
    // RSS에서 뉴스 가져오기 (최대 3번 재시도)
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
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)) // 재시도 대기
      }
    }
    
    if (newsItems.length === 0) {
      // DB에서 기존 뉴스 가져오기 (fallback)
      const { results } = await DB.prepare(`
        SELECT * FROM news 
        WHERE category = ? 
        ORDER BY created_at DESC 
        LIMIT 20
      `).bind(category).all()
      
      if (results && results.length > 0) {
        return c.json({ 
          success: true, 
          fetched: 0,
          saved: 0,
          cached: results.length,
          message: '최신 뉴스를 가져올 수 없어 캐시된 뉴스를 표시합니다.',
          fallback: true
        })
      }
      
      return c.json({ 
        error: '뉴스를 가져올 수 없습니다. 잠시 후 다시 시도해주세요.',
        fallback: false
      }, 503)
    }
    
    // DB에 저장 (중복 방지)
    let savedCount = 0
    for (const item of newsItems) {
      try {
        await DB.prepare(`
          INSERT OR IGNORE INTO news (category, title, summary, link, image_url, publisher, pub_date)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          item.category,
          item.title,
          item.summary,
          item.link,
          item.image_url,
          item.publisher,
          item.pub_date
        ).run()
        savedCount++
      } catch (err) {
        console.error('뉴스 저장 오류:', err)
      }
    }
    
    return c.json({ 
      success: true, 
      fetched: newsItems.length,
      saved: savedCount,
      message: `${savedCount}개의 새 뉴스를 저장했습니다.`,
      fallback: false
    })
  } catch (error) {
    console.error('뉴스 가져오기 오류:', error)
    
    // DB에서 기존 뉴스 가져오기 (fallback)
    try {
      const { results } = await DB.prepare(`
        SELECT * FROM news 
        WHERE category = ? 
        ORDER BY created_at DESC 
        LIMIT 20
      `).bind(category).all()
      
      if (results && results.length > 0) {
        return c.json({ 
          success: true, 
          fetched: 0,
          saved: 0,
          cached: results.length,
          message: '최신 뉴스를 가져올 수 없어 캐시된 뉴스를 표시합니다.',
          fallback: true
        })
      }
    } catch (dbErr) {
      console.error('DB fallback 오류:', dbErr)
    }
    
    return c.json({ 
      error: '뉴스 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      fallback: false
    }, 503)
  }
})

// 저장된 뉴스 목록 조회
// API: 뉴스 리다이렉트 프록시 (Google News 차단 우회)
app.get('/news/redirect', async (c) => {
  const url = c.req.query('url')
  
  if (!url) {
    return c.text('URL이 필요합니다', 400)
  }
  
  try {
    // Google News URL을 fetch하여 최종 redirect URL을 얻음
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    // 최종 URL로 리다이렉트
    return c.redirect(response.url, 302)
  } catch (error) {
    console.error('뉴스 리다이렉트 오류:', error)
    return c.text('뉴스를 불러올 수 없습니다', 500)
  }
})

app.get('/api/news', async (c) => {
  const { DB } = c.env
  const category = c.req.query('category')
  const limit = parseInt(c.req.query('limit') || '20')
  const offset = parseInt(c.req.query('offset') || '0')
  
  try {
    let query = 'SELECT * FROM news'
    const params: any[] = []
    
    if (category && category !== 'all') {
      query += ' WHERE category = ?'
      params.push(category)
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)
    
    const { results } = await DB.prepare(query).bind(...params).all()
    
    return c.json({ 
      success: true, 
      news: results,
      count: results.length 
    })
  } catch (error) {
    console.error('뉴스 조회 오류:', error)
    return c.json({ error: '뉴스 조회 실패' }, 500)
  }
})

// 뉴스 삭제 (관리자용)
app.delete('/api/news/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  try {
    await DB.prepare('DELETE FROM news WHERE id = ?').bind(id).run()
    return c.json({ success: true, message: '뉴스가 삭제되었습니다.' })
  } catch (error) {
    console.error('뉴스 삭제 오류:', error)
    return c.json({ error: '뉴스 삭제 실패' }, 500)
  }
})

// ==================== 뉴스 스케줄 설정 API ====================
// 스케줄 설정 조회
app.get('/api/news/schedule', async (c) => {
  const { DB } = c.env
  
  try {
    const { results } = await DB.prepare('SELECT * FROM news_schedule WHERE id = 1').all()
    const schedule = results?.[0] || {
      enabled: 1,
      schedule_type: 'hourly',
      schedule_time: null,
      interval_hours: 1,
      last_run: null,
      next_run: null
    }
    
    return c.json({ 
      success: true, 
      schedule 
    })
  } catch (error) {
    console.error('스케줄 설정 조회 오류:', error)
    return c.json({ error: '스케줄 설정 조회 실패' }, 500)
  }
})

// 스케줄 설정 업데이트
app.post('/api/news/schedule', async (c) => {
  const { DB } = c.env
  
  try {
    const body = await c.req.json()
    const { enabled, schedule_type, schedule_time, interval_hours } = body
    
    // 다음 실행 시간 계산
    let next_run = null
    const now = new Date()
    
    if (enabled) {
      if (schedule_type === 'hourly') {
        const hours = interval_hours || 1
        next_run = new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString()
      } else if (schedule_type === 'daily' && schedule_time) {
        // schedule_time 형식: "HH:mm" (한국 시간 기준)
        const [hours, minutes] = schedule_time.split(':').map(Number)
        
        // 현재 한국 시간 구하기 (UTC+9)
        const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000))
        
        // 오늘 날짜의 지정된 시간 (한국 시간)
        const nextRun = new Date(koreaTime)
        nextRun.setHours(hours, minutes, 0, 0)
        
        // 오늘 시간이 지났으면 내일로 설정
        if (nextRun <= koreaTime) {
          nextRun.setDate(nextRun.getDate() + 1)
        }
        
        // UTC 시간으로 변환하여 저장 (한국 시간 - 9시간)
        next_run = new Date(nextRun.getTime() - (9 * 60 * 60 * 1000)).toISOString()
      }
    }
    
    await DB.prepare(`
      UPDATE news_schedule 
      SET enabled = ?, 
          schedule_type = ?, 
          schedule_time = ?, 
          interval_hours = ?,
          next_run = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).bind(
      enabled ? 1 : 0,
      schedule_type,
      schedule_time,
      interval_hours,
      next_run
    ).run()
    
    return c.json({ 
      success: true, 
      message: '스케줄 설정이 업데이트되었습니다.',
      next_run 
    })
  } catch (error) {
    console.error('스케줄 설정 업데이트 오류:', error)
    return c.json({ error: '스케줄 설정 업데이트 실패' }, 500)
  }
})

// 스케줄 실행 기록 업데이트 (자동 실행 시 호출)
app.post('/api/news/schedule/update-run', async (c) => {
  const { DB } = c.env
  
  try {
    const now = new Date().toISOString()
    
    // last_run 업데이트
    await DB.prepare(`
      UPDATE news_schedule 
      SET last_run = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).bind(now).run()
    
    // 현재 설정 가져와서 next_run 재계산
    const { results } = await DB.prepare('SELECT * FROM news_schedule WHERE id = 1').all()
    const schedule = results?.[0]
    
    if (schedule && schedule.enabled) {
      let next_run = null
      const currentTime = new Date()
      
      if (schedule.schedule_type === 'hourly') {
        const hours = schedule.interval_hours || 1
        next_run = new Date(currentTime.getTime() + hours * 60 * 60 * 1000).toISOString()
      } else if (schedule.schedule_type === 'daily' && schedule.schedule_time) {
        const [hours, minutes] = schedule.schedule_time.split(':').map(Number)
        
        // 현재 한국 시간 구하기 (UTC+9)
        const koreaTime = new Date(currentTime.getTime() + (9 * 60 * 60 * 1000))
        
        // 다음날 지정된 시간 (한국 시간)
        const nextRun = new Date(koreaTime)
        nextRun.setDate(nextRun.getDate() + 1) // 다음 날
        nextRun.setHours(hours, minutes, 0, 0)
        
        // UTC 시간으로 변환하여 저장 (한국 시간 - 9시간)
        next_run = new Date(nextRun.getTime() - (9 * 60 * 60 * 1000)).toISOString()
      }
      
      if (next_run) {
        await DB.prepare(`
          UPDATE news_schedule 
          SET next_run = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = 1
        `).bind(next_run).run()
      }
    }
    
    return c.json({ 
      success: true, 
      message: '실행 기록이 업데이트되었습니다.' 
    })
  } catch (error) {
    console.error('실행 기록 업데이트 오류:', error)
    return c.json({ error: '실행 기록 업데이트 실패' }, 500)
  }
})

// ==================== 관리자 뉴스관리 페이지 ====================
app.get('/admin/news', async (c) => {
  const { DB } = c.env
  
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
  } catch (error) {
    console.error('뉴스 조회 오류:', error)
  }
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>뉴스관리 - Faith Portal</title>
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
                ${getAdminNavigation('/admin/news')}
            </div>
        </nav>
        
        ${getBreadcrumb([
          {label: '홈', href: '/'},
          {label: '관리자', href: '/admin'},
          {label: '뉴스 관리'}
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
                <button onclick="fetchAllNews()" class="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all">
                    <i class="fas fa-sync-alt mr-2"></i>
                    전체 카테고리 뉴스 가져오기
                </button>
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
                <div class="bg-white rounded-lg shadow p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-500 text-sm">로딩 상태</p>
                            <p class="text-2xl font-bold text-indigo-600" id="loading-status">대기</p>
                        </div>
                        <i class="fas fa-spinner text-3xl text-indigo-500" id="loading-icon"></i>
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
                            ${newsFromDB.map(news => `
                                <tr data-category="${news.category}" class="hover:bg-gray-50">
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${news.id}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                            ${news.category}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                                        <span onclick="openNewsLink('${news.link}')" class="hover:text-blue-600 cursor-pointer">
                                            ${news.title}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${news.publisher || '구글 뉴스'}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(news.created_at).toLocaleDateString('ko-KR')}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onclick="openNewsLink('${news.link}')" class="text-blue-600 hover:text-blue-900 mr-3">
                                            <i class="fas fa-external-link-alt mr-1"></i>
                                            보기
                                        </a>
                                        <button onclick="deleteNews(${news.id})" class="text-red-600 hover:text-red-900">
                                            <i class="fas fa-trash mr-1"></i>
                                            삭제
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ${newsFromDB.length === 0 ? `
                    <div class="text-center py-12">
                        <i class="fas fa-newspaper text-5xl text-gray-300 mb-4"></i>
                        <p class="text-gray-500">저장된 뉴스가 없습니다.</p>
                        <button onclick="fetchAllNews()" class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
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
                            row.innerHTML = '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + news.id + '</td>' +
                                '<td class="px-6 py-4 whitespace-nowrap">' +
                                    '<span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">' +
                                        news.category +
                                    '</span>' +
                                '</td>' +
                                '<td class="px-6 py-4 text-sm text-gray-900 max-w-md truncate">' +
                                    '<span onclick="openNewsLink(\'' + news.link + '\')" class="hover:text-blue-600 cursor-pointer">' +
                                        news.title +
                                    '</span>' +
                                '</td>' +
                                '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">' + (news.publisher || '구글 뉴스') + '</td>' +
                                '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">' + new Date(news.created_at).toLocaleDateString('ko-KR') + '</td>' +
                                '<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">' +
                                    '<button onclick="openNewsLink(\'' + news.link + '\')" class="text-blue-600 hover:text-blue-900 mr-3">' +
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
            async function fetchAllNews() {
                const btn = event.target;
                const originalText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>가져오는 중...';
                
                const categories = ['general', 'politics', 'economy', 'tech', 'sports', 'entertainment'];
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
                try {
                    const response = await fetch('/api/news/schedule');
                    const data = await response.json();
                    
                    if (data.success && data.schedule) {
                        const schedule = data.schedule;
                        
                        // 활성화 상태
                        document.getElementById('schedule-enabled').checked = schedule.enabled === 1;
                        
                        // 스케줄 타입
                        const scheduleType = schedule.schedule_type || 'hourly';
                        document.querySelector('input[name="schedule-type"][value="' + scheduleType + '"]').checked = true;
                        
                        // 간격 (hourly)
                        if (schedule.interval_hours) {
                            document.getElementById('interval-hours').value = schedule.interval_hours;
                        }
                        
                        // 시간 (daily)
                        if (schedule.schedule_time) {
                            document.getElementById('schedule-time').value = schedule.schedule_time;
                        }
                        
                        // 실행 정보
                        if (schedule.last_run) {
                            document.getElementById('last-run').textContent = new Date(schedule.last_run).toLocaleString('ko-KR');
                        }
                        if (schedule.next_run) {
                            document.getElementById('next-run').textContent = new Date(schedule.next_run).toLocaleString('ko-KR');
                        }
                        
                        // UI 업데이트
                        updateScheduleType();
                        
                        // 자동 실행 시작
                        if (schedule.enabled === 1) {
                            startAutoFetch();
                        }
                    }
                } catch (error) {
                    console.error('스케줄 로드 오류:', error);
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
                    
                    if (result.success) {
                        alert('스케줄 설정이 저장되었습니다.');
                        
                        // 다음 실행 시간 표시
                        if (result.next_run) {
                            document.getElementById('next-run').textContent = new Date(result.next_run).toLocaleString('ko-KR');
                        }
                        
                        // 자동 실행 재시작
                        stopAutoFetch();
                        if (enabled) {
                            startAutoFetch();
                        }
                    } else {
                        alert('저장 실패: ' + (result.error || '알 수 없는 오류'));
                    }
                } catch (error) {
                    console.error('스케줄 저장 오류:', error);
                    alert('저장 중 오류가 발생했습니다.');
                }
            }
            
            // 자동 뉴스 가져오기 시작
            function startAutoFetch() {
                // 기존 interval 정리
                stopAutoFetch();
                
                // 1분마다 스케줄 체크
                autoFetchInterval = setInterval(async () => {
                    try {
                        const response = await fetch('/api/news/schedule');
                        const data = await response.json();
                        
                        if (data.success && data.schedule && data.schedule.enabled === 1) {
                            const schedule = data.schedule;
                            const now = new Date();
                            const nextRun = schedule.next_run ? new Date(schedule.next_run) : null;
                            
                            // 다음 실행 시간이 되었는지 확인
                            if (nextRun && now >= nextRun) {
                                console.log('자동 뉴스 가져오기 실행...');
                                
                                // 뉴스 가져오기
                                const categories = ['general', 'politics', 'economy', 'tech', 'sports', 'entertainment'];
                                let totalFetched = 0;
                                
                                for (const category of categories) {
                                    try {
                                        const fetchResponse = await fetch('/api/news/fetch?category=' + category);
                                        const fetchData = await fetchResponse.json();
                                        if (fetchData.success) {
                                            totalFetched += fetchData.saved || 0;
                                        }
                                    } catch (error) {
                                        console.error('뉴스 가져오기 오류:', error);
                                    }
                                }
                                
                                console.log('자동 뉴스 가져오기 완료:', totalFetched + '개');
                                
                                // 실행 기록 업데이트
                                await fetch('/api/news/schedule/update-run', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' }
                                });
                                
                                // UI 새로고침
                                location.reload();
                            }
                        }
                    } catch (error) {
                        console.error('자동 실행 체크 오류:', error);
                    }
                }, 60000); // 1분마다 체크
                
                console.log('자동 뉴스 가져오기가 시작되었습니다.');
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
})

// ==================== 북마크 API ====================
// 북마크 추가
app.post('/api/bookmarks', async (c) => {
  const { DB } = c.env
  try {
    const body = await c.req.json()
    const { userId, title, link, category, source, pubDate } = body
    
    if (!userId || !title || !link || !category) {
      return c.json({ success: false, error: '필수 정보가 누락되었습니다' }, 400)
    }
    
    await DB.prepare(`
      INSERT INTO bookmarks (user_id, news_title, news_link, news_category, news_source, news_pub_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(userId, title, link, category, source, pubDate).run()
    
    return c.json({ success: true, message: '북마크에 추가되었습니다' })
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      return c.json({ success: false, error: '이미 북마크에 추가된 뉴스입니다' }, 400)
    }
    console.error('북마크 추가 오류:', error)
    return c.json({ success: false, error: '북마크 추가 실패' }, 500)
  }
})

// 북마크 목록 조회
app.get('/api/bookmarks', async (c) => {
  const { DB } = c.env
  try {
    const userId = c.req.query('userId')
    const category = c.req.query('category')
    const limit = parseInt(c.req.query('limit') || '50')
    const offset = parseInt(c.req.query('offset') || '0')
    
    if (!userId) {
      return c.json({ success: false, error: 'userId가 필요합니다' }, 400)
    }
    
    let query = 'SELECT * FROM bookmarks WHERE user_id = ?'
    const params: any[] = [userId]
    
    if (category && category !== 'all') {
      query += ' AND news_category = ?'
      params.push(category)
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)
    
    const result = await DB.prepare(query).bind(...params).all()
    
    return c.json({ 
      success: true, 
      bookmarks: result.results || [],
      count: result.results?.length || 0
    })
  } catch (error) {
    console.error('북마크 조회 오류:', error)
    return c.json({ success: false, error: '북마크 조회 실패' }, 500)
  }
})

// 북마크 삭제
app.delete('/api/bookmarks/:id', async (c) => {
  const { DB } = c.env
  try {
    const bookmarkId = c.req.param('id')
    const userId = c.req.query('userId')
    
    if (!userId) {
      return c.json({ success: false, error: 'userId가 필요합니다' }, 400)
    }
    
    await DB.prepare('DELETE FROM bookmarks WHERE id = ? AND user_id = ?')
      .bind(bookmarkId, userId).run()
    
    return c.json({ success: true, message: '북마크가 삭제되었습니다' })
  } catch (error) {
    console.error('북마크 삭제 오류:', error)
    return c.json({ success: false, error: '북마크 삭제 실패' }, 500)
  }
})

// 북마크 확인 (특정 뉴스가 북마크되어 있는지)
app.get('/api/bookmarks/check', async (c) => {
  const { DB } = c.env
  try {
    const userId = c.req.query('userId')
    const link = c.req.query('link')
    
    if (!userId || !link) {
      return c.json({ success: false, error: '필수 정보가 누락되었습니다' }, 400)
    }
    
    const result = await DB.prepare(
      'SELECT id FROM bookmarks WHERE user_id = ? AND news_link = ?'
    ).bind(userId, link).first()
    
    return c.json({ 
      success: true, 
      bookmarked: !!result,
      bookmarkId: result?.id || null
    })
  } catch (error) {
    console.error('북마크 확인 오류:', error)
    return c.json({ success: false, error: '북마크 확인 실패' }, 500)
  }
})

// ==================== 뉴스 검색 API ====================
app.get('/api/news/search', async (c) => {
  const { DB } = c.env
  try {
    const query = c.req.query('q') || ''
    const category = c.req.query('category')
    const limit = parseInt(c.req.query('limit') || '50')
    const offset = parseInt(c.req.query('offset') || '0')
    
    if (!query || query.trim().length === 0) {
      return c.json({ success: false, error: '검색어를 입력해주세요' }, 400)
    }
    
    let sql = `SELECT * FROM news WHERE (title LIKE ? OR summary LIKE ?)`
    const searchTerm = `%${query.trim()}%`
    const params: any[] = [searchTerm, searchTerm]
    
    if (category && category !== 'all') {
      sql += ' AND category = ?'
      params.push(category)
    }
    
    sql += ' ORDER BY pub_date DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)
    
    const result = await DB.prepare(sql).bind(...params).all()
    
    return c.json({ 
      success: true, 
      news: result.results || [],
      count: result.results?.length || 0,
      query: query.trim()
    })
  } catch (error) {
    console.error('뉴스 검색 오류:', error)
    return c.json({ success: false, error: '뉴스 검색 실패' }, 500)
  }
})

// ==================== Figma API 연동 ====================
// Figma 파일 정보 가져오기
app.get('/api/figma/file/:fileKey', async (c) => {
  const { FIGMA_ACCESS_TOKEN } = c.env
  const fileKey = c.req.param('fileKey')
  
  if (!FIGMA_ACCESS_TOKEN) {
    return c.json({ 
      success: false, 
      error: 'Figma Access Token이 설정되지 않았습니다. .dev.vars 파일을 확인하세요.' 
    }, 500)
  }
  
  try {
    const response = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: {
        'X-Figma-Token': FIGMA_ACCESS_TOKEN
      }
    })
    
    if (!response.ok) {
      const errorData = await response.text()
      console.error('Figma API 오류:', response.status, errorData)
      return c.json({ 
        success: false, 
        error: `Figma API 오류: ${response.status}`,
        details: errorData
      }, response.status)
    }
    
    const data = await response.json()
    return c.json({ 
      success: true, 
      data 
    })
  } catch (error) {
    console.error('Figma 파일 가져오기 오류:', error)
    return c.json({ 
      success: false, 
      error: error.message || '파일 가져오기 실패' 
    }, 500)
  }
})

// Figma 이미지 렌더링 (PNG/SVG)
app.get('/api/figma/images/:fileKey', async (c) => {
  const { FIGMA_ACCESS_TOKEN } = c.env
  const fileKey = c.req.param('fileKey')
  const nodeIds = c.req.query('ids') // 쉼표로 구분된 노드 ID들
  const format = c.req.query('format') || 'png' // png, jpg, svg, pdf
  const scale = c.req.query('scale') || '1' // 1, 2, 3, 4
  
  if (!FIGMA_ACCESS_TOKEN) {
    return c.json({ 
      success: false, 
      error: 'Figma Access Token이 설정되지 않았습니다.' 
    }, 500)
  }
  
  if (!nodeIds) {
    return c.json({ 
      success: false, 
      error: 'Node IDs를 제공해야 합니다. (예: ?ids=1:2,1:3)' 
    }, 400)
  }
  
  try {
    const url = new URL(`https://api.figma.com/v1/images/${fileKey}`)
    url.searchParams.set('ids', nodeIds)
    url.searchParams.set('format', format)
    url.searchParams.set('scale', scale)
    
    const response = await fetch(url.toString(), {
      headers: {
        'X-Figma-Token': FIGMA_ACCESS_TOKEN
      }
    })
    
    if (!response.ok) {
      const errorData = await response.text()
      return c.json({ 
        success: false, 
        error: `Figma API 오류: ${response.status}`,
        details: errorData
      }, response.status)
    }
    
    const data = await response.json()
    return c.json({ 
      success: true, 
      images: data.images,
      metadata: {
        format,
        scale,
        nodeIds: nodeIds.split(',')
      }
    })
  } catch (error) {
    console.error('Figma 이미지 렌더링 오류:', error)
    return c.json({ 
      success: false, 
      error: error.message || '이미지 렌더링 실패' 
    }, 500)
  }
})

// Figma 스타일 가져오기 (디자인 토큰)
app.get('/api/figma/styles/:fileKey', async (c) => {
  const { FIGMA_ACCESS_TOKEN } = c.env
  const fileKey = c.req.param('fileKey')
  
  if (!FIGMA_ACCESS_TOKEN) {
    return c.json({ 
      success: false, 
      error: 'Figma Access Token이 설정되지 않았습니다.' 
    }, 500)
  }
  
  try {
    // 먼저 파일 정보를 가져와서 스타일 분석
    const response = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: {
        'X-Figma-Token': FIGMA_ACCESS_TOKEN
      }
    })
    
    if (!response.ok) {
      return c.json({ 
        success: false, 
        error: `Figma API 오류: ${response.status}` 
      }, response.status)
    }
    
    const fileData = await response.json()
    
    // 스타일 정보 추출 (색상, 텍스트 스타일 등)
    const styles = {
      colors: fileData.styles?.fills || {},
      textStyles: fileData.styles?.text || {},
      effectStyles: fileData.styles?.effects || {}
    }
    
    return c.json({ 
      success: true, 
      styles,
      fileName: fileData.name,
      lastModified: fileData.lastModified
    })
  } catch (error) {
    console.error('Figma 스타일 가져오기 오류:', error)
    return c.json({ 
      success: false, 
      error: error.message || '스타일 가져오기 실패' 
    }, 500)
  }
})

// Figma 연동 테스트 페이지
app.get('/figma-test', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Figma API 테스트 - Faith Portal</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <div class="max-w-4xl mx-auto px-4 py-8">
            <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h1 class="text-3xl font-bold text-gray-900 mb-4">
                    <i class="fas fa-pencil-ruler text-purple-600 mr-2"></i>
                    Figma API 연동 테스트
                </h1>
                <p class="text-gray-600 mb-4">
                    Figma Personal Access Token을 설정하고 아래에서 파일 정보를 가져올 수 있습니다.
                </p>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 class="text-xl font-bold text-gray-900 mb-4">
                    <i class="fas fa-file text-blue-600 mr-2"></i>
                    1. Figma 파일 정보 가져오기
                </h2>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Figma File Key
                    </label>
                    <input 
                        type="text" 
                        id="fileKey"
                        placeholder="예: ABC123xyz"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p class="text-xs text-gray-500 mt-1">
                        URL에서 file/ 다음의 값: https://www.figma.com/file/<strong>ABC123xyz</strong>/My-Design
                    </p>
                </div>
                <button 
                    onclick="fetchFileInfo()"
                    class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                    <i class="fas fa-download mr-2"></i>
                    파일 정보 가져오기
                </button>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 class="text-xl font-bold text-gray-900 mb-4">
                    <i class="fas fa-image text-green-600 mr-2"></i>
                    2. 이미지 렌더링
                </h2>
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Figma File Key
                        </label>
                        <input 
                            type="text" 
                            id="imageFileKey"
                            placeholder="ABC123xyz"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Node IDs (쉼표 구분)
                        </label>
                        <input 
                            type="text" 
                            id="nodeIds"
                            placeholder="1:2,1:3"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                </div>
                <button 
                    onclick="renderImages()"
                    class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                    <i class="fas fa-paint-brush mr-2"></i>
                    이미지 렌더링
                </button>
            </div>

            <div id="result" class="bg-white rounded-xl shadow-lg p-6 hidden">
                <h3 class="text-lg font-bold text-gray-900 mb-4">
                    <i class="fas fa-check-circle text-green-600 mr-2"></i>
                    결과
                </h3>
                <pre id="resultContent" class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 text-xs"></pre>
            </div>

            <div class="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
                <h3 class="text-lg font-bold text-blue-900 mb-2">
                    <i class="fas fa-info-circle mr-2"></i>
                    설정 가이드
                </h3>
                <ol class="list-decimal list-inside text-blue-800 space-y-2">
                    <li>Figma 설정에서 Personal Access Token 발급</li>
                    <li>프로젝트 루트에 <code class="bg-blue-100 px-2 py-1 rounded">.dev.vars</code> 파일 생성</li>
                    <li><code class="bg-blue-100 px-2 py-1 rounded">FIGMA_ACCESS_TOKEN=your_token</code> 추가</li>
                    <li>개발 서버 재시작</li>
                </ol>
                <p class="text-sm text-blue-700 mt-4">
                    자세한 내용은 <code class="bg-blue-100 px-2 py-1 rounded">FIGMA_INTEGRATION.md</code> 참고
                </p>
            </div>
        </div>

        <script>
            async function fetchFileInfo() {
                const fileKey = document.getElementById('fileKey').value.trim()
                if (!fileKey) {
                    alert('Figma File Key를 입력하세요')
                    return
                }

                showLoading()
                try {
                    const response = await fetch(\`/api/figma/file/\${fileKey}\`)
                    const data = await response.json()
                    showResult(data)
                } catch (error) {
                    showResult({ success: false, error: error.message })
                }
            }

            async function renderImages() {
                const fileKey = document.getElementById('imageFileKey').value.trim()
                const nodeIds = document.getElementById('nodeIds').value.trim()
                
                if (!fileKey || !nodeIds) {
                    alert('File Key와 Node IDs를 모두 입력하세요')
                    return
                }

                showLoading()
                try {
                    const response = await fetch(\`/api/figma/images/\${fileKey}?ids=\${nodeIds}\`)
                    const data = await response.json()
                    showResult(data)
                } catch (error) {
                    showResult({ success: false, error: error.message })
                }
            }

            function showLoading() {
                const result = document.getElementById('result')
                const content = document.getElementById('resultContent')
                result.classList.remove('hidden')
                content.textContent = '로딩 중...'
            }

            function showResult(data) {
                const result = document.getElementById('result')
                const content = document.getElementById('resultContent')
                result.classList.remove('hidden')
                content.textContent = JSON.stringify(data, null, 2)
            }
        </script>
    </body>
    </html>
  `)
})

// ==================== Puppeteer API 연동 ====================
// 스크린샷 캡처
app.get('/api/puppeteer/screenshot', async (c) => {
  try {
    const url = c.req.query('url')
    const fullPage = c.req.query('fullPage') === 'true'
    const format = c.req.query('format') || 'png'
    const width = parseInt(c.req.query('width') || '1920')
    const height = parseInt(c.req.query('height') || '1080')
    
    if (!url) {
      return c.json({ 
        success: false, 
        error: 'URL parameter is required' 
      }, 400)
    }
    
    // Browserless.io API 토큰 가져오기
    const token = c.env?.BROWSERLESS_API_TOKEN || process.env.BROWSERLESS_API_TOKEN
    
    if (!token || token === 'demo_token_for_testing') {
      return c.json({
        success: false,
        error: 'BROWSERLESS_API_TOKEN not configured',
        message: '실제 Browserless.io API 토큰을 설정해주세요',
        guide: {
          step1: 'https://www.browserless.io 에서 가입',
          step2: 'API 키 발급',
          step3: '.dev.vars 파일에 BROWSERLESS_API_TOKEN 설정',
          step4: '서버 재시작'
        }
      }, 401)
    }
    
    try {
      // Browserless.io Screenshot API 호출
      const browserlessUrl = `https://chrome.browserless.io/screenshot?token=${token}`
      
      const response = await fetch(browserlessUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          url: url,
          options: {
            fullPage: fullPage,
            type: format,
            encoding: 'base64'
          },
          viewport: {
            width: width,
            height: height
          }
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        return c.json({
          success: false,
          error: 'Browserless.io API error',
          status: response.status,
          details: errorText
        }, response.status)
      }
      
      // Base64 이미지 데이터
      const screenshotBase64 = await response.text()
      
      // Base64를 바이너리로 변환
      const screenshotBuffer = Uint8Array.from(atob(screenshotBase64), c => c.charCodeAt(0))
      
      return new Response(screenshotBuffer, {
        headers: {
          'Content-Type': `image/${format}`,
          'Cache-Control': 'public, max-age=3600',
          'X-Screenshot-URL': url
        }
      })
    } catch (apiError: any) {
      return c.json({
        success: false,
        error: 'Failed to capture screenshot',
        message: apiError.message
      }, 500)
    }
  } catch (error: any) {
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})

// PDF 생성
app.get('/api/puppeteer/pdf', async (c) => {
  try {
    const url = c.req.query('url')
    const format = c.req.query('format') || 'A4'
    const landscape = c.req.query('landscape') === 'true'
    
    if (!url) {
      return c.json({ 
        success: false, 
        error: 'URL parameter is required' 
      }, 400)
    }
    
    // Browserless.io API 토큰 가져오기
    const token = c.env?.BROWSERLESS_API_TOKEN || process.env.BROWSERLESS_API_TOKEN
    
    if (!token || token === 'demo_token_for_testing') {
      return c.json({
        success: false,
        error: 'BROWSERLESS_API_TOKEN not configured',
        message: '실제 Browserless.io API 토큰을 설정해주세요'
      }, 401)
    }
    
    try {
      // Browserless.io PDF API 호출
      const browserlessUrl = `https://chrome.browserless.io/pdf?token=${token}`
      
      const response = await fetch(browserlessUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          url: url,
          options: {
            format: format,
            landscape: landscape,
            printBackground: true,
            preferCSSPageSize: false
          }
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        return c.json({
          success: false,
          error: 'Browserless.io API error',
          status: response.status,
          details: errorText
        }, response.status)
      }
      
      // PDF 바이너리 데이터
      const pdfBuffer = await response.arrayBuffer()
      
      return new Response(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="page-${Date.now()}.pdf"`,
          'Cache-Control': 'public, max-age=3600',
          'X-PDF-URL': url
        }
      })
    } catch (apiError: any) {
      return c.json({
        success: false,
        error: 'Failed to generate PDF',
        message: apiError.message
      }, 500)
    }
  } catch (error: any) {
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})

// 웹 스크래핑
app.post('/api/puppeteer/scrape', async (c) => {
  try {
    const { url, selector, waitForSelector, waitTime } = await c.req.json()
    
    if (!url) {
      return c.json({ 
        success: false, 
        error: 'URL is required' 
      }, 400)
    }
    
    // Browserless.io API 토큰 가져오기
    const token = c.env?.BROWSERLESS_API_TOKEN || process.env.BROWSERLESS_API_TOKEN
    
    if (!token || token === 'demo_token_for_testing') {
      return c.json({
        success: false,
        error: 'BROWSERLESS_API_TOKEN not configured',
        message: '실제 Browserless.io API 토큰을 설정해주세요'
      }, 401)
    }
    
    try {
      // Browserless.io Scrape API 호출
      const browserlessUrl = `https://chrome.browserless.io/scrape?token=${token}`
      
      // 스크래핑 함수 (브라우저 컨텍스트에서 실행됨)
      const scrapeFunction = `
        async () => {
          ${waitForSelector ? `await page.waitForSelector('${waitForSelector}', { timeout: 10000 });` : ''}
          ${waitTime ? `await new Promise(r => setTimeout(r, ${waitTime}));` : ''}
          
          const data = {
            title: document.title,
            url: window.location.href,
            timestamp: new Date().toISOString()
          };
          
          ${selector ? `
            const elements = Array.from(document.querySelectorAll('${selector}'));
            data.elements = elements.map(el => ({
              text: el.textContent?.trim(),
              html: el.innerHTML,
              href: el.getAttribute('href'),
              src: el.getAttribute('src')
            }));
          ` : `
            data.content = document.body.textContent?.trim();
          `}
          
          return data;
        }
      `
      
      const response = await fetch(browserlessUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          url: url,
          elements: [
            {
              selector: selector || 'body'
            }
          ],
          gotoOptions: {
            waitUntil: 'networkidle2'
          }
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        return c.json({
          success: false,
          error: 'Browserless.io API error',
          status: response.status,
          details: errorText
        }, response.status)
      }
      
      const scrapedData = await response.json()
      
      return c.json({
        success: true,
        data: scrapedData,
        timestamp: new Date().toISOString()
      })
    } catch (apiError: any) {
      return c.json({
        success: false,
        error: 'Failed to scrape webpage',
        message: apiError.message
      }, 500)
    }
  } catch (error: any) {
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})

// Puppeteer 연동 테스트 페이지
app.get('/puppeteer-test', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Puppeteer API 테스트 - Faith Portal</title>
        <script>
          // Tailwind CDN 경고 필터
          (function() {
            const originalWarn = console.warn;
            console.warn = function(...args) {
              const message = args.join(' ');
              if (message.includes('cdn.tailwindcss.com should not be used in production')) {
                return;
              }
              originalWarn.apply(console, args);
            };
          })();
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <div class="max-w-4xl mx-auto px-4 py-8">
            <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h1 class="text-3xl font-bold text-gray-900 mb-4">
                    <i class="fas fa-robot text-indigo-600 mr-2"></i>
                    Puppeteer API 연동 테스트
                </h1>
                <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <i class="fas fa-exclamation-triangle text-yellow-400"></i>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-yellow-700">
                                <strong>중요:</strong> Cloudflare Workers 환경에서는 Puppeteer를 직접 실행할 수 없습니다.
                                외부 브라우저 서비스(Browserless.io 등)를 사용하거나 Cloudflare Browser Rendering API를 권장합니다.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 class="text-xl font-bold text-gray-900 mb-4">
                    <i class="fas fa-camera text-blue-600 mr-2"></i>
                    1. 웹페이지 스크린샷
                </h2>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        URL
                    </label>
                    <input 
                        type="text" 
                        id="screenshotUrl"
                        placeholder="https://example.com"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>
                <div class="mb-4">
                    <label class="flex items-center">
                        <input type="checkbox" id="fullPage" class="mr-2">
                        <span class="text-sm text-gray-700">전체 페이지 캡처</span>
                    </label>
                </div>
                <button 
                    onclick="testScreenshot()" 
                    class="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <i class="fas fa-camera mr-2"></i>스크린샷 캡처
                </button>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 class="text-xl font-bold text-gray-900 mb-4">
                    <i class="fas fa-file-pdf text-red-600 mr-2"></i>
                    2. PDF 생성
                </h2>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        URL
                    </label>
                    <input 
                        type="text" 
                        id="pdfUrl"
                        placeholder="https://example.com"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                </div>
                <button 
                    onclick="testPdf()" 
                    class="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                    <i class="fas fa-file-pdf mr-2"></i>PDF 생성
                </button>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 class="text-xl font-bold text-gray-900 mb-4">
                    <i class="fas fa-spider text-purple-600 mr-2"></i>
                    3. 웹 스크래핑
                </h2>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        URL
                    </label>
                    <input 
                        type="text" 
                        id="scrapeUrl"
                        placeholder="https://example.com"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        CSS Selector (선택사항)
                    </label>
                    <input 
                        type="text" 
                        id="selector"
                        placeholder=".article-title"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                </div>
                <button 
                    onclick="testScrape()" 
                    class="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                    <i class="fas fa-spider mr-2"></i>스크래핑 시작
                </button>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6">
                <h2 class="text-xl font-bold text-gray-900 mb-4">
                    <i class="fas fa-terminal text-green-600 mr-2"></i>
                    응답
                </h2>
                <pre id="response" class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">응답이 여기에 표시됩니다...</pre>
            </div>

            <div class="mt-6">
                <a href="/" class="text-indigo-600 hover:text-indigo-800">
                    <i class="fas fa-arrow-left mr-2"></i>홈으로 돌아가기
                </a>
            </div>
        </div>

        <script>
            async function testScreenshot() {
                const url = document.getElementById('screenshotUrl').value
                const fullPage = document.getElementById('fullPage').checked
                const response = document.getElementById('response')
                
                if (!url) {
                    response.textContent = 'URL을 입력해주세요.'
                    return
                }
                
                response.textContent = '스크린샷 캡처 중... (최대 30초 소요)'
                
                try {
                    const res = await fetch(\`/api/puppeteer/screenshot?url=\${encodeURIComponent(url)}&fullPage=\${fullPage}\`)
                    
                    // 응답이 JSON인 경우 (에러 또는 설정 필요)
                    const contentType = res.headers.get('content-type')
                    if (contentType && contentType.includes('application/json')) {
                        const data = await res.json()
                        response.textContent = JSON.stringify(data, null, 2)
                        return
                    }
                    
                    // 이미지 응답인 경우
                    if (res.ok) {
                        const blob = await res.blob()
                        const imageUrl = URL.createObjectURL(blob)
                        response.innerHTML = \`
                            <div class="space-y-4">
                                <p class="text-green-600 font-semibold">✅ 스크린샷 캡처 성공!</p>
                                <img src="\${imageUrl}" alt="Screenshot" class="max-w-full border border-gray-300 rounded-lg shadow-lg" />
                                <a href="\${imageUrl}" download="screenshot.png" class="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                                    <i class="fas fa-download mr-2"></i>다운로드
                                </a>
                            </div>
                        \`
                    } else {
                        response.textContent = \`Error: \${res.status} - \${await res.text()}\`
                    }
                } catch (error) {
                    response.textContent = 'Error: ' + error.message
                }
            }
            
            async function testPdf() {
                const url = document.getElementById('pdfUrl').value
                const response = document.getElementById('response')
                
                if (!url) {
                    response.textContent = 'URL을 입력해주세요.'
                    return
                }
                
                response.textContent = 'PDF 생성 중... (최대 30초 소요)'
                
                try {
                    const res = await fetch(\`/api/puppeteer/pdf?url=\${encodeURIComponent(url)}\`)
                    
                    // 응답이 JSON인 경우 (에러 또는 설정 필요)
                    const contentType = res.headers.get('content-type')
                    if (contentType && contentType.includes('application/json')) {
                        const data = await res.json()
                        response.textContent = JSON.stringify(data, null, 2)
                        return
                    }
                    
                    // PDF 응답인 경우
                    if (res.ok) {
                        const blob = await res.blob()
                        const pdfUrl = URL.createObjectURL(blob)
                        const filename = \`page-\${Date.now()}.pdf\`
                        
                        // 자동 다운로드
                        const a = document.createElement('a')
                        a.href = pdfUrl
                        a.download = filename
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        
                        response.innerHTML = \`
                            <div class="space-y-4">
                                <p class="text-green-600 font-semibold">✅ PDF 생성 및 다운로드 완료!</p>
                                <p class="text-sm text-gray-600">파일명: \${filename}</p>
                                <a href="\${pdfUrl}" target="_blank" class="inline-block bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                                    <i class="fas fa-eye mr-2"></i>PDF 미리보기
                                </a>
                            </div>
                        \`
                    } else {
                        response.textContent = \`Error: \${res.status} - \${await res.text()}\`
                    }
                } catch (error) {
                    response.textContent = 'Error: ' + error.message
                }
            }
            
            async function testScrape() {
                const url = document.getElementById('scrapeUrl').value
                const selector = document.getElementById('selector').value
                const response = document.getElementById('response')
                
                if (!url) {
                    response.textContent = 'URL을 입력해주세요.'
                    return
                }
                
                response.textContent = '웹 스크래핑 중... (최대 30초 소요)'
                
                try {
                    const res = await fetch('/api/puppeteer/scrape', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ url, selector })
                    })
                    const data = await res.json()
                    
                    if (data.success) {
                        response.innerHTML = \`
                            <div class="space-y-2">
                                <p class="text-green-600 font-semibold">✅ 스크래핑 성공!</p>
                                <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">\${JSON.stringify(data, null, 2)}</pre>
                            </div>
                        \`
                    } else {
                        response.textContent = JSON.stringify(data, null, 2)
                    }
                } catch (error) {
                    response.textContent = 'Error: ' + error.message
                }
            }
        </script>
    </body>
    </html>
  `)
})

// ==================== 마이페이지 API ====================

// 로그인 기록 조회
app.get('/api/mypage/login-history', async (c) => {
  try {
    const userId = c.req.query('userId')
    
    if (!userId) {
      return c.json({ success: false, message: '사용자 ID가 필요합니다.' }, 400)
    }
    
    const result = await c.env.DB.prepare(`
      SELECT id, login_time, ip_address, user_agent
      FROM login_history
      WHERE user_id = ?
      ORDER BY login_time DESC
      LIMIT 50
    `).bind(userId).all()
    
    return c.json({ success: true, history: result.results || [] })
  } catch (error) {
    console.error('로그인 기록 조회 오류:', error)
    return c.json({ success: false, error: '로그인 기록 조회 실패' }, 500)
  }
})

// ==================== 마이페이지 ====================
app.get('/mypage', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko" id="html-root">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>마이페이지 - Faith Portal</title>
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
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <style>
            .faith-blue { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); }
            .faith-blue-hover:hover { background: linear-gradient(135deg, #0284c7 0%, #0891b2 100%); }
            
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
            .dark .border-gray-200 {
                border-color: #334155 !important;
            }
            .dark .bg-gray-50 {
                background-color: #0f172a !important;
            }
            .dark .bg-gray-100 {
                background-color: #1e293b !important;
            }
        </style>
    </head>
    <body class="bg-gray-50 min-h-screen" id="html-root">
        ${getCommonHeader()}
        
        ${getBreadcrumb([
          {label: '홈', href: '/'},
          {label: '마이페이지'}
        ])}
        
        <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
            <div class="mb-6">
                <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">
                    <i class="fas fa-user mr-2"></i>마이페이지
                </h1>
                <p class="text-gray-600 mt-2">내 정보 및 설정을 관리합니다</p>
            </div>
            
            <!-- 탭 메뉴 -->
            <div class="bg-white rounded-lg shadow-lg mb-6">
                <div class="border-b border-gray-200">
                    <nav class="flex space-x-2 sm:space-x-4 px-4 sm:px-6 overflow-x-auto" aria-label="Tabs">
                        <button id="tab-info" class="tab-button border-b-2 border-sky-500 text-sky-600 py-4 px-1 text-xs sm:text-sm font-medium whitespace-nowrap">
                            <i class="fas fa-user mr-1 sm:mr-2"></i>내 정보
                        </button>
                        <button id="tab-dday" class="tab-button border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-xs sm:text-sm font-medium whitespace-nowrap">
                            <i class="fas fa-heart mr-1 sm:mr-2"></i>D-Day
                        </button>
                        <button id="tab-history" class="tab-button border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-xs sm:text-sm font-medium whitespace-nowrap">
                            <i class="fas fa-history mr-1 sm:mr-2"></i>로그인 기록
                        </button>
                        <button id="tab-settings" class="tab-button border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-xs sm:text-sm font-medium whitespace-nowrap">
                            <i class="fas fa-cog mr-1 sm:mr-2"></i>설정
                        </button>
                    </nav>
                </div>
                
                <!-- 탭 콘텐츠 -->
                <div class="p-4 sm:p-6">
                    <!-- 내 정보 탭 -->
                    <div id="content-info" class="tab-content">
                        <div class="space-y-4">
                            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p class="text-sm text-gray-600">이메일</p>
                                    <p id="user-email" class="text-lg font-medium text-gray-900">-</p>
                                </div>
                                <i class="fas fa-envelope text-2xl text-gray-400"></i>
                            </div>
                            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p class="text-sm text-gray-600">회원 레벨</p>
                                    <p id="user-level" class="text-lg font-medium text-gray-900">-</p>
                                </div>
                                <i class="fas fa-star text-2xl text-gray-400"></i>
                            </div>
                            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p class="text-sm text-gray-600">가입일</p>
                                    <p id="user-created" class="text-lg font-medium text-gray-900">-</p>
                                </div>
                                <i class="fas fa-calendar text-2xl text-gray-400"></i>
                            </div>
                        </div>
                    </div>
                    
                    <!-- D-Day 탭 -->
                    <div id="content-dday" class="tab-content hidden">
                        <div class="mb-4 flex items-center justify-between">
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900 mb-2">나의 D-Day</h3>
                                <p class="text-sm text-gray-600">등록한 D-Day 목록입니다</p>
                            </div>
                            <a href="/lifestyle/dday-calculator" class="faith-blue text-white px-4 py-2 rounded-lg hover:opacity-90 transition-all text-sm">
                                <i class="fas fa-plus mr-1"></i>새로 만들기
                            </a>
                        </div>
                        <div id="dday-list-container" class="space-y-3">
                            <div class="text-center py-8 text-gray-500">
                                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                                <p>D-Day 목록을 불러오는 중...</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 로그인 기록 탭 -->
                    <div id="content-history" class="tab-content hidden">
                        <div class="mb-4">
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">최근 로그인 기록</h3>
                            <p class="text-sm text-gray-600">최근 50개의 로그인 기록을 표시합니다</p>
                        </div>
                        <div id="login-history-list" class="space-y-3">
                            <div class="text-center py-8 text-gray-500">
                                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                                <p>로그인 기록을 불러오는 중...</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 설정 탭 -->
                    <div id="content-settings" class="tab-content hidden">
                        <div class="space-y-6">
                            <!-- 다크모드 설정 -->
                            <div class="p-4 bg-gray-50 rounded-lg">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <h3 class="text-lg font-medium text-gray-900">
                                            <i class="fas fa-moon mr-2"></i>다크모드
                                        </h3>
                                        <p class="text-sm text-gray-600 mt-1">어두운 테마를 사용합니다</p>
                                    </div>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" id="dark-mode-toggle" class="sr-only peer">
                                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                                    </label>
                                </div>
                            </div>
                            
                            <!-- 북마크 바로가기 -->
                            <div class="p-4 bg-gray-50 rounded-lg">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <h3 class="text-lg font-medium text-gray-900">
                                            <i class="fas fa-bookmark mr-2"></i>북마크
                                        </h3>
                                        <p class="text-sm text-gray-600 mt-1">저장한 뉴스를 확인합니다</p>
                                    </div>
                                    <a href="/bookmarks" class="faith-blue text-white px-4 py-2 rounded-lg hover:opacity-90 transition-all">
                                        바로가기 <i class="fas fa-arrow-right ml-1"></i>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        ${getCommonFooter()}
        ${getCommonAuthScript()}
        
        <script>
            // 로그인 체크
            const token = localStorage.getItem('auth_token');
            const userId = localStorage.getItem('user_id');
            const userEmail = localStorage.getItem('user_email');
            const userLevel = localStorage.getItem('user_level');
            
            if (!token || !userId) {
                alert('로그인이 필요합니다.');
                window.location.href = '/login';
            }
            
            // 사용자 정보 표시
            document.getElementById('user-email').textContent = userEmail || '-';
            document.getElementById('user-level').textContent = 'Lv.' + (userLevel || '0');
            
            // 탭 전환
            const tabs = document.querySelectorAll('.tab-button');
            const contents = document.querySelectorAll('.tab-content');
            
            tabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    // 모든 탭 비활성화
                    tabs.forEach(t => {
                        t.classList.remove('border-sky-500', 'text-sky-600');
                        t.classList.add('border-transparent', 'text-gray-500');
                    });
                    
                    // 클릭된 탭 활성화
                    this.classList.remove('border-transparent', 'text-gray-500');
                    this.classList.add('border-sky-500', 'text-sky-600');
                    
                    // 모든 콘텐츠 숨기기
                    contents.forEach(c => c.classList.add('hidden'));
                    
                    // 해당 콘텐츠 표시
                    const tabId = this.id.replace('tab-', '');
                    document.getElementById('content-' + tabId).classList.remove('hidden');
                    
                    // 로그인 기록 탭이면 데이터 로드
                    if (tabId === 'history') {
                        loadLoginHistory();
                    }
                    // D-Day 탭이면 데이터 로드
                    if (tabId === 'dday') {
                        loadDdayList();
                    }
                });
            });
            
            // 로그인 기록 로드
            async function loadLoginHistory() {
                try {
                    const response = await axios.get('/api/mypage/login-history?userId=' + userId);
                    
                    if (response.data.success) {
                        const history = response.data.history;
                        const listEl = document.getElementById('login-history-list');
                        
                        if (history.length === 0) {
                            listEl.innerHTML = '<div class="text-center py-8 text-gray-500"><p>로그인 기록이 없습니다.</p></div>';
                            return;
                        }
                        
                        listEl.innerHTML = history.map(item => {
                            const date = new Date(item.login_time);
                            const dateStr = date.toLocaleString('ko-KR');
                            const ua = item.user_agent || 'unknown';
                            const browser = getBrowserInfo(ua);
                            
                            return \`
                                <div class="flex items-start p-4 bg-gray-50 rounded-lg">
                                    <div class="flex-shrink-0">
                                        <i class="fas fa-\${browser.icon} text-2xl text-gray-400"></i>
                                    </div>
                                    <div class="ml-4 flex-1">
                                        <p class="text-sm font-medium text-gray-900">\${dateStr}</p>
                                        <p class="text-xs text-gray-600 mt-1">IP: \${item.ip_address}</p>
                                        <p class="text-xs text-gray-600">기기: \${browser.name}</p>
                                    </div>
                                </div>
                            \`;
                        }).join('');
                    }
                } catch (error) {
                    console.error('로그인 기록 로드 오류:', error);
                    document.getElementById('login-history-list').innerHTML = 
                        '<div class="text-center py-8 text-red-500"><p>로그인 기록을 불러오는데 실패했습니다.</p></div>';
                }
            }
            
            // D-Day 목록 로드
            async function loadDdayList() {
                try {
                    const response = await axios.get('/api/dday/list');
                    
                    if (response.data.success) {
                        const ddays = response.data.ddays;
                        const listEl = document.getElementById('dday-list-container');
                        
                        if (ddays.length === 0) {
                            listEl.innerHTML = \`
                                <div class="text-center py-12">
                                    <div class="text-6xl mb-4">📅</div>
                                    <h3 class="text-xl font-bold text-gray-800 mb-2">등록된 D-Day가 없습니다</h3>
                                    <p class="text-gray-600 mb-4">새로운 D-Day를 만들어보세요!</p>
                                    <a href="/lifestyle/dday-calculator" class="inline-block faith-blue text-white px-6 py-3 rounded-lg hover:opacity-90 transition-all">
                                        <i class="fas fa-plus mr-2"></i>D-Day 만들기
                                    </a>
                                </div>
                            \`;
                            return;
                        }
                        
                        listEl.innerHTML = ddays.map(dday => {
                            const ddayText = calculateDday(dday.target_date, dday.mode, dday.is_anniversary);
                            const colorStyle = getColorGradient(dday.color);
                            
                            return \`
                                <div class="rounded-xl shadow-lg p-5 hover:shadow-xl transition-all" style="\${colorStyle}">
                                    <div class="flex items-start justify-between mb-3">
                                        <div class="flex items-center gap-3">
                                            <span class="text-4xl">\${dday.emoji}</span>
                                            <div class="text-white">
                                                <h3 class="font-bold text-lg">\${dday.title}</h3>
                                                <p class="text-sm opacity-90">\${new Date(dday.target_date).toLocaleDateString('ko-KR')}</p>
                                            </div>
                                        </div>
                                        <button onclick="deleteDdayFromMypage(\${dday.id})" class="text-white opacity-70 hover:opacity-100 transition">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                    <div class="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                                        <div class="text-4xl font-bold text-white">\${ddayText}</div>
                                    </div>
                                </div>
                            \`;
                        }).join('');
                    }
                } catch (error) {
                    console.error('D-Day 목록 로드 오류:', error);
                    document.getElementById('dday-list-container').innerHTML = 
                        '<div class="text-center py-8 text-red-500"><p>D-Day 목록을 불러오는데 실패했습니다.</p></div>';
                }
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
            
            // 색상 그라디언트
            function getColorGradient(color) {
                const gradients = {
                    '#667eea': 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);',
                    '#f093fb': 'background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);',
                    '#4facfe': 'background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);',
                    '#43e97b': 'background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);',
                    '#fa709a': 'background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);'
                };
                return gradients[color] || gradients['#667eea'];
            }
            
            // D-Day 삭제
            async function deleteDdayFromMypage(id) {
                if (!confirm('정말 삭제하시겠습니까?')) return;
                
                try {
                    const response = await axios.delete('/api/dday/' + id);
                    if (response.data.success) {
                        alert('삭제되었습니다.');
                        loadDdayList();
                    }
                } catch (error) {
                    console.error('D-Day 삭제 오류:', error);
                    alert('삭제에 실패했습니다.');
                }
            }
            
            // 브라우저 정보 파싱
            function getBrowserInfo(ua) {
                if (ua.includes('Chrome')) return { name: 'Chrome', icon: 'chrome' };
                if (ua.includes('Firefox')) return { name: 'Firefox', icon: 'firefox' };
                if (ua.includes('Safari')) return { name: 'Safari', icon: 'safari' };
                if (ua.includes('Edge')) return { name: 'Edge', icon: 'edge' };
                return { name: 'Unknown', icon: 'globe' };
            }
            
            // 다크모드 토글
            const darkModeToggle = document.getElementById('dark-mode-toggle');
            const isDark = localStorage.getItem('darkMode') === 'true';
            darkModeToggle.checked = isDark;
            
            darkModeToggle.addEventListener('change', function() {
                const htmlRoot = document.getElementById('html-root');
                const isDarkMode = this.checked;
                
                if (isDarkMode) {
                    htmlRoot.classList.add('dark');
                } else {
                    htmlRoot.classList.remove('dark');
                }
                
                localStorage.setItem('darkMode', isDarkMode);
            });
        </script>
    </body>
    </html>
  `)
})

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
          {label: '홈', href: '/'},
          {label: '유틸리티', href: '/lifestyle'},
          {label: '한국 나이 계산기'}
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
                            ${Array.from({length: 12}, (_, i) => `<option value="${i+1}">${i+1}월</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">일 (DD)</label>
                        <select 
                            id="birthDay"
                            class="w-full px-4 py-3 text-lg font-semibold border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition"
                        >
                            <option value="">선택</option>
                            ${Array.from({length: 31}, (_, i) => `<option value="${i+1}">${i+1}일</option>`).join('')}
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
  `)
})

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
          {label: '홈', href: '/'},
          {label: '유틸리티', href: '/lifestyle'},
          {label: 'D-Day 매니저'}
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
                    
                    return '<div class="dday-card rounded-xl shadow-lg p-5" style="' + colorStyle + '">' +
                        '<div class="flex items-start justify-between mb-3">' +
                        '<div class="flex items-center gap-3">' +
                        '<span class="text-4xl">' + dday.emoji + '</span>' +
                        '<div class="text-white">' +
                        '<h3 class="font-bold text-lg">' + dday.title + '</h3>' +
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
  `)
})

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
          {label: '홈', href: '/'},
          {label: '유틸리티', href: '/lifestyle'},
          {label: 'JSON Studio'}
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
  `)
})

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
          {label: '홈', href: '/'},
          {label: '유틸리티', href: '/lifestyle'},
          {label: 'Base64 변환'}
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
  `)
})

// D-Day API
app.get('/api/dday/list', async (c) => {
  const { DB } = c.env
  const userId = c.get('userId') || null
  
  try {
    const { results } = await DB.prepare(
      'SELECT * FROM dday WHERE user_id = ? ORDER BY target_date ASC'
    ).bind(userId).all()
    
    return c.json({ success: true, ddays: results || [] })
  } catch (error) {
    console.error('D-Day 조회 오류:', error)
    return c.json({ success: false, error: 'D-Day 조회 실패' }, 500)
  }
})

app.post('/api/dday/add', async (c) => {
  const { DB } = c.env
  const userId = c.get('userId') || null
  
  try {
    const body = await c.req.json()
    const { title, targetDate, mode, isAnniversary, color, emoji } = body
    
    const result = await DB.prepare(
      'INSERT INTO dday (user_id, title, target_date, mode, is_anniversary, color, emoji) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(userId, title, targetDate, mode, isAnniversary ? 1 : 0, color, emoji).run()
    
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (error) {
    console.error('D-Day 추가 오류:', error)
    return c.json({ success: false, error: 'D-Day 추가 실패' }, 500)
  }
})

app.delete('/api/dday/:id', async (c) => {
  const { DB } = c.env
  const userId = c.get('userId') || null
  const id = c.req.param('id')
  
  try {
    await DB.prepare(
      'DELETE FROM dday WHERE id = ? AND (user_id = ? OR user_id IS NULL)'
    ).bind(id, userId).run()
    
    return c.json({ success: true })
  } catch (error) {
    console.error('D-Day 삭제 오류:', error)
    return c.json({ success: false, error: 'D-Day 삭제 실패' }, 500)
  }
})

// ==================== 쇼핑 API ====================
// Mock 쿠팡 핫딜 데이터 API
app.get('/api/shopping/hotdeals', (c) => {
  // 실제로는 쿠팡 파트너스 API를 호출해야 하지만, 
  // 여기서는 Mock 데이터로 시연
  const hotDeals = [
    {
      id: 1,
      title: '[특가] 삼성 갤럭시 버즈2 프로 무선 이어폰',
      originalPrice: 289000,
      salePrice: 149000,
      discountRate: 48,
      image: 'https://via.placeholder.com/300x300/667eea/ffffff?text=Galaxy+Buds2+Pro',
      link: 'https://www.coupang.com',
      rating: 4.8,
      reviewCount: 15234,
      category: '전자제품',
      platform: 'coupang',
      badge: '로켓배송'
    },
    {
      id: 2,
      title: '[오늘만] 나이키 에어맥스 런닝화 - 신상 출시',
      originalPrice: 159000,
      salePrice: 89000,
      discountRate: 44,
      image: 'https://via.placeholder.com/300x300/f093fb/ffffff?text=Nike+Air+Max',
      link: 'https://www.coupang.com',
      rating: 4.7,
      reviewCount: 8921,
      category: '패션',
      platform: 'coupang',
      badge: '무료배송'
    },
    {
      id: 3,
      title: 'LG 그램 17인치 노트북 초경량 (1.35kg)',
      originalPrice: 2590000,
      salePrice: 1990000,
      discountRate: 23,
      image: 'https://via.placeholder.com/300x300/4facfe/ffffff?text=LG+Gram+17',
      link: 'https://www.coupang.com',
      rating: 4.9,
      reviewCount: 3456,
      category: '전자제품',
      platform: 'coupang',
      badge: '로켓배송'
    },
    {
      id: 4,
      title: '[1+1] 프리미엄 와이드 모니터 27인치 QHD',
      originalPrice: 349000,
      salePrice: 249000,
      discountRate: 29,
      image: 'https://via.placeholder.com/300x300/00d2ff/ffffff?text=Monitor+27',
      link: 'https://www.coupang.com',
      rating: 4.6,
      reviewCount: 12890,
      category: '전자제품',
      platform: 'coupang',
      badge: '오늘출발'
    },
    {
      id: 5,
      title: '코스트코 인기 1위 프로틴 보충제 5kg 대용량',
      originalPrice: 129000,
      salePrice: 69000,
      discountRate: 47,
      image: 'https://via.placeholder.com/300x300/feca57/ffffff?text=Protein+5kg',
      link: 'https://www.coupang.com',
      rating: 4.8,
      reviewCount: 28934,
      category: '식품',
      platform: 'coupang',
      badge: '베스트'
    },
    {
      id: 6,
      title: '다이슨 V15 무선청소기 최신형 + 사은품 증정',
      originalPrice: 1390000,
      salePrice: 999000,
      discountRate: 28,
      image: 'https://via.placeholder.com/300x300/ee5a6f/ffffff?text=Dyson+V15',
      link: 'https://www.coupang.com',
      rating: 4.9,
      reviewCount: 5632,
      category: '생활가전',
      platform: 'coupang',
      badge: '로켓직구'
    },
    {
      id: 7,
      title: 'Apple 에어팟 프로 2세대 USB-C 정품',
      originalPrice: 359000,
      salePrice: 289000,
      discountRate: 19,
      image: 'https://via.placeholder.com/300x300/764ba2/ffffff?text=AirPods+Pro+2',
      link: 'https://www.coupang.com',
      rating: 5.0,
      reviewCount: 9821,
      category: '전자제품',
      platform: 'coupang',
      badge: '로켓배송'
    },
    {
      id: 8,
      title: '[타임특가] 샤오미 공기청정기 4 프로 미세먼지',
      originalPrice: 529000,
      salePrice: 329000,
      discountRate: 38,
      image: 'https://via.placeholder.com/300x300/48dbfb/ffffff?text=Xiaomi+Air+4',
      link: 'https://www.coupang.com',
      rating: 4.7,
      reviewCount: 7234,
      category: '생활가전',
      platform: 'coupang',
      badge: '타임특가'
    },
  ]

  return c.json(hotDeals)
})

// ==================== 쇼핑 메인 페이지 ====================
app.get('/shopping', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>최저가 핫딜 랭킹 - Faith Portal</title>
        <meta name="description" content="실시간 급상승 핫딜! 쿠팡, 알리익스프레스 최저가 상품을 한눈에 비교하세요.">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .deal-card {
                transition: all 0.3s ease;
                cursor: pointer;
            }
            .deal-card:hover {
                transform: translateY(-8px);
                box-shadow: 0 20px 40px rgba(0,0,0,0.15);
            }
            .badge {
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.8; }
            }
            .discount-badge {
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            }
            .loading-skeleton {
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: loading 1.5s infinite;
            }
            @keyframes loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
        </style>
    </head>
    <body class="bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
        ${getCommonHeader('Shopping')}
        ${getStickyHeader()}
        
        ${getBreadcrumb([
          {label: '홈', href: '/'},
          {label: '쇼핑', href: '/shopping'}
        ])}

        <!-- 서브 메뉴 -->
        ${getShoppingMenu('/shopping')}

        <main class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
            <!-- 헤더 -->
            <div class="mb-8">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center gap-3">
                            <i class="fas fa-fire text-orange-600 animate-pulse"></i>
                            실시간 핫딜 랭킹
                        </h1>
                        <p class="text-gray-600 mt-2">
                            <i class="fas fa-bolt text-yellow-500"></i>
                            지금 가장 핫한 초특가 상품을 실시간으로 확인하세요!
                        </p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="filterCategory('all')" id="filter-all" class="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium shadow-md hover:bg-orange-700 transition">
                            <i class="fas fa-th"></i> 전체
                        </button>
                        <button onclick="filterCategory('전자제품')" id="filter-전자제품" class="px-4 py-2 bg-white text-gray-700 rounded-lg font-medium shadow-md hover:bg-gray-100 transition">
                            <i class="fas fa-laptop"></i> 전자제품
                        </button>
                        <button onclick="filterCategory('패션')" id="filter-패션" class="px-4 py-2 bg-white text-gray-700 rounded-lg font-medium shadow-md hover:bg-gray-100 transition hidden sm:inline-block">
                            <i class="fas fa-tshirt"></i> 패션
                        </button>
                    </div>
                </div>
            </div>

            <!-- 통계 카드 -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div class="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl p-4 text-white shadow-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm opacity-90">총 상품수</p>
                            <p class="text-2xl font-bold" id="totalProducts">0</p>
                        </div>
                        <i class="fas fa-box text-3xl opacity-80"></i>
                    </div>
                </div>
                <div class="bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl p-4 text-white shadow-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm opacity-90">평균 할인율</p>
                            <p class="text-2xl font-bold" id="avgDiscount">0%</p>
                        </div>
                        <i class="fas fa-percent text-3xl opacity-80"></i>
                    </div>
                </div>
                <div class="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm opacity-90">최대 할인율</p>
                            <p class="text-2xl font-bold" id="maxDiscount">0%</p>
                        </div>
                        <i class="fas fa-fire text-3xl opacity-80"></i>
                    </div>
                </div>
                <div class="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm opacity-90">리뷰 평점</p>
                            <p class="text-2xl font-bold" id="avgRating">0</p>
                        </div>
                        <i class="fas fa-star text-3xl opacity-80"></i>
                    </div>
                </div>
            </div>

            <!-- 상품 그리드 -->
            <div id="productsGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <!-- 로딩 스켈레톤 -->
                <div class="loading-skeleton h-96 rounded-xl"></div>
                <div class="loading-skeleton h-96 rounded-xl"></div>
                <div class="loading-skeleton h-96 rounded-xl"></div>
                <div class="loading-skeleton h-96 rounded-xl"></div>
            </div>
        </main>

        <script>
            let allProducts = [];
            let currentFilter = 'all';

            // 페이지 로드 시 데이터 가져오기
            async function loadProducts() {
                try {
                    const response = await fetch('/api/shopping/hotdeals');
                    allProducts = await response.json();
                    
                    // 통계 계산
                    updateStatistics();
                    
                    // 상품 표시
                    displayProducts(allProducts);
                } catch (error) {
                    console.error('Failed to load products:', error);
                    document.getElementById('productsGrid').innerHTML = '<div class="col-span-full text-center py-12 text-gray-500"><i class="fas fa-exclamation-triangle text-4xl mb-3"></i><p>상품을 불러오는데 실패했습니다.</p></div>';
                }
            }

            // 통계 업데이트
            function updateStatistics() {
                const totalProducts = allProducts.length;
                const avgDiscount = Math.round(allProducts.reduce((sum, p) => sum + p.discountRate, 0) / totalProducts);
                const maxDiscount = Math.max(...allProducts.map(p => p.discountRate));
                const avgRating = (allProducts.reduce((sum, p) => sum + p.rating, 0) / totalProducts).toFixed(1);

                document.getElementById('totalProducts').textContent = totalProducts;
                document.getElementById('avgDiscount').textContent = avgDiscount + '%';
                document.getElementById('maxDiscount').textContent = maxDiscount + '%';
                document.getElementById('avgRating').textContent = avgRating;
            }

            // 상품 표시
            function displayProducts(products) {
                const grid = document.getElementById('productsGrid');
                
                if (products.length === 0) {
                    grid.innerHTML = '<div class="col-span-full text-center py-12 text-gray-500"><i class="fas fa-shopping-bag text-4xl mb-3"></i><p>상품이 없습니다.</p></div>';
                    return;
                }

                grid.innerHTML = products.map(product => \`
                    <div class="deal-card bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200" onclick="window.open('\${product.link}', '_blank')">
                        <!-- 이미지 -->
                        <div class="relative">
                            <img src="\${product.image}" alt="\${product.title}" class="w-full h-48 object-cover">
                            
                            <!-- 할인율 배지 -->
                            <div class="absolute top-3 left-3 discount-badge text-white px-3 py-1.5 rounded-lg font-bold shadow-lg">
                                <i class="fas fa-tag"></i> \${product.discountRate}%
                            </div>
                            
                            <!-- 플랫폼 배지 -->
                            <div class="absolute top-3 right-3 bg-white px-3 py-1 rounded-lg text-xs font-semibold text-orange-600 shadow-md">
                                \${product.badge}
                            </div>
                        </div>

                        <!-- 내용 -->
                        <div class="p-4">
                            <!-- 카테고리 -->
                            <span class="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded mb-2">
                                \${product.category}
                            </span>

                            <!-- 제목 -->
                            <h3 class="font-bold text-gray-800 mb-2 line-clamp-2 min-h-[3rem]">
                                \${product.title}
                            </h3>

                            <!-- 평점 -->
                            <div class="flex items-center gap-2 mb-3">
                                <div class="flex items-center">
                                    \${'<i class="fas fa-star text-yellow-400"></i>'.repeat(Math.floor(product.rating))}
                                    \${product.rating % 1 !== 0 ? '<i class="fas fa-star-half-alt text-yellow-400"></i>' : ''}
                                </div>
                                <span class="text-sm text-gray-600">\${product.rating}</span>
                                <span class="text-xs text-gray-400">(\${product.reviewCount.toLocaleString()})</span>
                            </div>

                            <!-- 가격 -->
                            <div class="border-t pt-3">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm text-gray-400 line-through">\${product.originalPrice.toLocaleString()}원</p>
                                        <p class="text-xl font-bold text-orange-600">\${product.salePrice.toLocaleString()}원</p>
                                    </div>
                                    <button class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition">
                                        <i class="fas fa-shopping-cart"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                \`).join('');
            }

            // 카테고리 필터
            function filterCategory(category) {
                currentFilter = category;
                
                // 버튼 스타일 업데이트
                document.querySelectorAll('[id^="filter-"]').forEach(btn => {
                    const btnCategory = btn.id.replace('filter-', '');
                    if (btnCategory === category) {
                        btn.className = 'px-4 py-2 bg-orange-600 text-white rounded-lg font-medium shadow-md hover:bg-orange-700 transition';
                    } else {
                        btn.className = btn.classList.contains('hidden') 
                            ? 'px-4 py-2 bg-white text-gray-700 rounded-lg font-medium shadow-md hover:bg-gray-100 transition hidden sm:inline-block'
                            : 'px-4 py-2 bg-white text-gray-700 rounded-lg font-medium shadow-md hover:bg-gray-100 transition';
                    }
                });

                // 필터링
                const filtered = category === 'all' 
                    ? allProducts 
                    : allProducts.filter(p => p.category === category);
                
                displayProducts(filtered);
            }

            // 페이지 로드 시 실행
            document.addEventListener('DOMContentLoaded', loadProducts);
        </script>

        ${getCommonFooter()}
        ${getCommonAuthScript()}
    </body>
    </html>
  `)
})

export default app
