import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database;
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

// 카테고리 색상
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'general': 'bg-gray-100 text-gray-700',
    'politics': 'bg-purple-100 text-purple-700',
    'economy': 'bg-green-100 text-green-700',
    'tech': 'bg-blue-100 text-blue-700',
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

// ==================== 생활 메뉴 헬퍼 함수 ====================
function getLifestyleMenu(currentPage: string): string {
  const menuItems = [
    { path: '/lifestyle/youtube-download', label: '유튜브 다운로드', icon: 'fab fa-youtube' },
    // 추가 메뉴는 여기에
  ]

  let menuHtml = '<nav class="bg-white border-b border-gray-200 shadow-sm"><div class="max-w-7xl mx-auto px-4"><div class="flex space-x-8 overflow-x-auto">'
  
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

// ==================== 관리자 네비게이션 헬퍼 함수 ====================
function getAdminNavigation(currentPage: string): string {
  const menuItems = [
    { path: '/admin', label: '대시보드', icon: 'fa-tachometer-alt' },
    { path: '/admin/users', label: '회원 관리', icon: 'fa-users' },
    { path: '/admin/content', label: '컨텐츠관리', icon: 'fa-folder', hasDropdown: true, dropdownItems: [
      { path: '/admin/news', label: '뉴스관리', icon: 'fa-newspaper' }
    ]},
    { path: '/admin/stats', label: '통계', icon: 'fa-chart-line' },
    { path: '/admin/logs', label: '활동 로그', icon: 'fa-clipboard-list' },
    { path: '/admin/notifications', label: '알림 센터', icon: 'fa-bell' },
  ]

  let navHtml = '<div class="flex space-x-8">'
  
  for (const item of menuItems) {
    const isActive = currentPage === item.path || (item.dropdownItems && item.dropdownItems.some(sub => sub.path === currentPage))
    const activeClass = isActive ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-700 hover:text-blue-600'
    
    if (item.hasDropdown) {
      navHtml += `
        <div class="relative group">
          <button class="px-4 py-4 ${activeClass} flex items-center">
            <i class="fas ${item.icon} mr-2"></i>
            ${item.label}
            <i class="fas fa-chevron-down ml-1 text-xs"></i>
          </button>
          <div class="hidden group-hover:block absolute top-full left-0 bg-white shadow-lg rounded-b-lg z-10 min-w-[160px]">
      `
      
      for (const subItem of item.dropdownItems || []) {
        const subActive = currentPage === subItem.path
        navHtml += `
            <a href="${subItem.path}" class="block px-4 py-3 ${subActive ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'}">
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
        <a href="${item.path}" class="px-4 py-4 ${activeClass}">
          <i class="fas ${item.icon} mr-2"></i>
          ${item.label}
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
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Faith Portal - 믿음의 포탈</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .faith-blue { background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%); }
            .faith-blue-hover:hover { background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); }
            .search-shadow { 
                box-shadow: 0 10px 40px rgba(30, 64, 175, 0.15);
                transition: all 0.3s ease;
            }
            .search-shadow:hover {
                box-shadow: 0 15px 50px rgba(30, 64, 175, 0.25);
                transform: translateY(-2px);
            }
            .hero-gradient {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .card-hover {
                transition: all 0.3s ease;
            }
            .card-hover:hover {
                transform: translateY(-8px);
                box-shadow: 0 20px 40px rgba(0,0,0,0.15);
            }
            .pulse-animation {
                animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: .7; }
            }
            .gradient-text {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            .service-icon {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                transition: all 0.3s ease;
            }
            .service-icon:hover {
                transform: scale(1.1) rotate(5deg);
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
        </style>
    </head>
    <body class="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <!-- 헤더 -->
        <header class="bg-white/90 backdrop-blur-md border-b border-purple-100 shadow-lg sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex justify-between items-center">
                <h1 class="text-lg sm:text-xl md:text-2xl font-bold faith-blue text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg shadow-lg shine floating">
                    <i class="fas fa-infinity mr-1 sm:mr-2"></i><span class="hidden xs:inline">Faith Portal</span><span class="xs:hidden">Faith</span>
                </h1>
                <div id="user-menu" class="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <!-- 로그인 전 -->
                    <a href="/login" class="text-xs sm:text-sm text-gray-700 hover:text-purple-600 font-medium transition-all px-2 sm:px-3">
                        <i class="fas fa-sign-in-alt mr-0 sm:mr-1"></i><span class="hidden sm:inline">로그인</span>
                    </a>
                    <a href="/signup" class="text-xs sm:text-sm faith-blue text-white px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-lg shadow-lg faith-blue-hover shine font-medium">
                        <i class="fas fa-user-plus mr-0 sm:mr-1"></i><span class="hidden sm:inline">회원가입</span><span class="sm:hidden">가입</span>
                    </a>
                </div>
            </div>
        </header>

        <!-- 메인 검색 영역 -->
        <main class="max-w-6xl mx-auto px-4 py-12">
            <!-- 검색창 -->
            <div class="mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
                <div class="relative search-shadow rounded-xl sm:rounded-2xl overflow-hidden bg-white">
                    <div class="flex items-center px-3 sm:px-4 md:px-6">
                        <i class="fas fa-search text-purple-400 text-base sm:text-lg md:text-xl"></i>
                        <input 
                            type="text" 
                            id="search-input"
                            placeholder="검색어를 입력하세요" 
                            class="flex-1 px-2 sm:px-3 md:px-4 py-3 sm:py-4 md:py-6 text-sm sm:text-base md:text-lg border-none outline-none"
                        />
                        <button 
                            id="search-btn"
                            class="faith-blue text-white px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl faith-blue-hover shine font-medium text-sm sm:text-base"
                        >
                            검색
                        </button>
                    </div>
                </div>
            </div>

            <!-- 중간 메뉴 네비게이션 -->
            <nav class="mb-8 sm:mb-12 md:mb-16 max-w-3xl mx-auto px-4">
                <div class="flex justify-center items-center space-x-3 sm:space-x-4 md:space-x-6 lg:space-x-8">
                    <a href="/news" class="group text-center">
                        <div class="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 mx-auto mb-1 sm:mb-2 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all">
                            <i class="fas fa-newspaper text-sm sm:text-base md:text-lg text-white"></i>
                        </div>
                        <p class="text-xs sm:text-sm md:text-base text-gray-700 font-medium group-hover:text-purple-600 transition-all">뉴스</p>
                    </a>
                    <a href="/lifestyle" class="group text-center">
                        <div class="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 mx-auto mb-1 sm:mb-2 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all">
                            <i class="fas fa-home text-sm sm:text-base md:text-lg text-white"></i>
                        </div>
                        <p class="text-xs sm:text-sm md:text-base text-gray-700 font-medium group-hover:text-purple-600 transition-all">생활</p>
                    </a>
                    <a href="/" class="group text-center">
                        <div class="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 mx-auto mb-1 sm:mb-2 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all">
                            <i class="fas fa-gamepad text-sm sm:text-base md:text-lg text-white"></i>
                        </div>
                        <p class="text-xs sm:text-sm md:text-base text-gray-700 font-medium group-hover:text-purple-600 transition-all">게임</p>
                    </a>
                    <a href="/" class="group text-center">
                        <div class="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 mx-auto mb-1 sm:mb-2 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all">
                            <i class="fas fa-envelope text-sm sm:text-base md:text-lg text-white"></i>
                        </div>
                        <p class="text-xs sm:text-sm md:text-base text-gray-700 font-medium group-hover:text-purple-600 transition-all">메일</p>
                    </a>
                    <a href="/" class="group text-center">
                        <div class="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 mx-auto mb-1 sm:mb-2 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all">
                            <i class="fas fa-coffee text-sm sm:text-base md:text-lg text-white"></i>
                        </div>
                        <p class="text-xs sm:text-sm md:text-base text-gray-700 font-medium group-hover:text-purple-600 transition-all">카페</p>
                    </a>
                    <a href="/" class="group text-center">
                        <div class="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 mx-auto mb-1 sm:mb-2 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all">
                            <i class="fas fa-blog text-sm sm:text-base md:text-lg text-white"></i>
                        </div>
                        <p class="text-xs sm:text-sm md:text-base text-gray-700 font-medium group-hover:text-purple-600 transition-all">블로그</p>
                    </a>
                    <a href="/" class="group text-center">
                        <div class="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 mx-auto mb-1 sm:mb-2 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all">
                            <i class="fas fa-shopping-bag text-sm sm:text-base md:text-lg text-white"></i>
                        </div>
                        <p class="text-xs sm:text-sm md:text-base text-gray-700 font-medium group-hover:text-purple-600 transition-all">쇼핑</p>
                    </a>
                </div>
            </nav>

            <!-- 뉴스 & 트렌드 섹션 -->
            <div class="grid md:grid-cols-2 gap-6 mb-12">
                <!-- 실시간 뉴스 -->
                <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 card-hover">
                    <h3 class="text-xl font-bold text-gray-800 mb-6 flex items-center">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center mr-3">
                            <i class="fas fa-newspaper text-white"></i>
                        </div>
                        실시간 뉴스
                        <span class="ml-2 text-xs bg-red-500 text-white px-2 py-1 rounded-full pulse-animation">LIVE</span>
                    </h3>
                    <div class="space-y-1" id="latest-news">
                        ${latestNews.length > 0 ? latestNews.map((news, index) => {
                          const timeAgo = getTimeAgo(news.created_at)
                          const categoryColor = getCategoryColor(news.category)
                          return `
                            <a href="${news.link}" target="_blank" class="block hover:bg-purple-50 py-2 px-2 rounded transition group border-b border-gray-100 last:border-b-0">
                                <div class="flex items-start">
                                    <span class="text-purple-600 font-bold mr-2 text-sm flex-shrink-0">${index + 1}</span>
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center gap-2 mb-1">
                                            <span class="text-xs ${categoryColor} px-2 py-0.5 rounded-full flex-shrink-0">${getCategoryName(news.category)}</span>
                                            <span class="text-gray-400 text-xs flex-shrink-0">${timeAgo}</span>
                                        </div>
                                        <p class="text-gray-800 group-hover:text-purple-600 font-medium text-sm line-clamp-1">${escapeHtml(news.title)}</p>
                                    </div>
                                </div>
                            </a>
                          `
                        }).join('') : `
                            <div class="text-center py-8 text-gray-500">
                                <i class="fas fa-newspaper text-4xl mb-3 text-gray-300"></i>
                                <p>뉴스를 불러오는 중입니다...</p>
                                <a href="/news" class="mt-3 inline-block text-blue-600 hover:text-blue-700 font-medium">
                                    뉴스 페이지로 이동 →
                                </a>
                            </div>
                        `}
                    </div>
                    ${latestNews.length > 0 ? `
                        <div class="mt-6 text-center">
                            <a href="/news" class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all">
                                <span>더 많은 뉴스 보기</span>
                                <i class="fas fa-arrow-right ml-2"></i>
                            </a>
                        </div>
                    ` : ''}
                </div>

                <!-- 트렌드 토픽 -->
                <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 card-hover">
                    <h3 class="text-xl font-bold text-gray-800 mb-6 flex items-center">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3">
                            <i class="fas fa-chart-line text-white"></i>
                        </div>
                        실시간 트렌드
                    </h3>
                    <div class="space-y-3">
                        <div class="flex items-center justify-between p-3 hover:bg-blue-50 rounded-lg transition">
                            <div class="flex items-center">
                                <span class="text-blue-600 font-bold mr-3 text-sm">#1</span>
                                <span class="text-gray-800 font-medium">인공지능 기술</span>
                            </div>
                            <i class="fas fa-arrow-up text-green-500"></i>
                        </div>
                        <div class="flex items-center justify-between p-3 hover:bg-blue-50 rounded-lg transition">
                            <div class="flex items-center">
                                <span class="text-blue-600 font-bold mr-3 text-sm">#2</span>
                                <span class="text-gray-800 font-medium">날씨 정보</span>
                            </div>
                            <i class="fas fa-arrow-up text-green-500"></i>
                        </div>
                        <div class="flex items-center justify-between p-3 hover:bg-blue-50 rounded-lg transition">
                            <div class="flex items-center">
                                <span class="text-blue-600 font-bold mr-3 text-sm">#3</span>
                                <span class="text-gray-800 font-medium">맛집 추천</span>
                            </div>
                            <i class="fas fa-minus text-gray-400"></i>
                        </div>
                        <div class="flex items-center justify-between p-3 hover:bg-blue-50 rounded-lg transition">
                            <div class="flex items-center">
                                <span class="text-blue-600 font-bold mr-3 text-sm">#4</span>
                                <span class="text-gray-800 font-medium">여행 정보</span>
                            </div>
                            <i class="fas fa-arrow-down text-red-500"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 추천 콘텐츠 -->
            <div class="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 text-center text-white shine mx-4">
                <i class="fas fa-star text-yellow-300 text-3xl sm:text-4xl mb-3 sm:mb-4"></i>
                <h3 class="text-xl sm:text-2xl font-bold mb-2">Faith Portal과 함께하세요</h3>
                <p class="text-white/90 mb-4 sm:mb-6 text-sm sm:text-base">지금 가입하고 더 많은 혜택을 누리세요</p>
                <a href="/signup" class="inline-block bg-white text-purple-600 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold hover:bg-gray-100 transition shadow-lg text-sm sm:text-base">
                    무료로 시작하기 <i class="fas fa-arrow-right ml-2"></i>
                </a>
            </div>
        </main>

        <!-- 푸터 -->
        <footer class="bg-gradient-to-r from-gray-900 to-gray-800 border-t border-gray-700 mt-8 sm:mt-12 md:mt-16 py-8 sm:py-10 md:py-12">
            <div class="max-w-7xl mx-auto px-4">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
                    <div class="col-span-2 md:col-span-1">
                        <h4 class="text-white font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center">
                            <i class="fas fa-infinity mr-2 text-purple-400"></i>
                            Faith Portal
                        </h4>
                        <p class="text-gray-400 text-xs sm:text-sm">
                            믿음의 포탈에서<br/>더 넓은 세상을 만나보세요
                        </p>
                    </div>
                    <div>
                        <h5 class="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">서비스</h5>
                        <div class="space-y-1.5 sm:space-y-2">
                            <a href="#" class="block text-gray-400 hover:text-purple-400 text-xs sm:text-sm transition">메일</a>
                            <a href="#" class="block text-gray-400 hover:text-purple-400 text-xs sm:text-sm transition">카페</a>
                            <a href="#" class="block text-gray-400 hover:text-purple-400 text-xs sm:text-sm transition">블로그</a>
                            <a href="#" class="block text-gray-400 hover:text-purple-400 text-xs sm:text-sm transition">쇼핑</a>
                        </div>
                    </div>
                    <div>
                        <h5 class="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">회사</h5>
                        <div class="space-y-1.5 sm:space-y-2">
                            <a href="#" class="block text-gray-400 hover:text-purple-400 text-xs sm:text-sm transition">회사소개</a>
                            <a href="#" class="block text-gray-400 hover:text-purple-400 text-xs sm:text-sm transition">이용약관</a>
                            <a href="#" class="block text-gray-400 hover:text-purple-400 text-xs sm:text-sm transition">개인정보처리방침</a>
                            <a href="#" class="block text-gray-400 hover:text-purple-400 text-xs sm:text-sm transition">고객센터</a>
                        </div>
                    </div>
                    <div class="col-span-2 md:col-span-1">
                        <h5 class="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">소셜 미디어</h5>
                        <div class="flex space-x-3 sm:space-x-4">
                            <a href="#" class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 hover:bg-purple-600 hover:text-white transition">
                                <i class="fab fa-facebook-f text-sm"></i>
                            </a>
                            <a href="#" class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 hover:bg-purple-600 hover:text-white transition">
                                <i class="fab fa-twitter text-sm"></i>
                            </a>
                            <a href="#" class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 hover:bg-purple-600 hover:text-white transition">
                                <i class="fab fa-instagram text-sm"></i>
                            </a>
                        </div>
                    </div>
                </div>
                <div class="border-t border-gray-700 pt-4 sm:pt-6 text-center">
                    <p class="text-gray-400 text-xs sm:text-sm px-4">
                        &copy; 2025 Faith Portal. All rights reserved. Made with 
                        <i class="fas fa-heart text-red-500"></i> 
                        by Faith Team
                    </p>
                </div>
            </div>
        </footer>

        <script>
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

            // 로그인 상태 확인
            const token = localStorage.getItem('auth_token');
            const userEmail = localStorage.getItem('user_email');
            const userLevel = parseInt(localStorage.getItem('user_level') || '0');
            
            if (token && userEmail) {
                // 로그인된 상태
                let menuHTML = '<span class="text-sm text-gray-700">' + userEmail + '님</span>';
                
                // 관리자 메뉴 추가
                if (userLevel >= 6) {
                    menuHTML += \`
                        <a href="/admin" class="text-sm bg-yellow-500 text-gray-900 px-4 py-2 rounded hover:bg-yellow-600 font-medium">
                            <i class="fas fa-crown mr-1"></i>
                            관리자
                        </a>
                    \`;
                }
                
                menuHTML += \`
                    <button id="logout-btn" class="text-sm faith-blue text-white px-4 py-2 rounded faith-blue-hover">
                        로그아웃
                    </button>
                \`;
                
                document.getElementById('user-menu').innerHTML = menuHTML;

                // 로그아웃 기능
                document.getElementById('logout-btn').addEventListener('click', function() {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user_email');
                    localStorage.removeItem('user_level');
                    location.reload();
                });
            }
        </script>
    </body>
    </html>
  `)
})

// ==================== 생활 페이지 ====================
app.get('/lifestyle', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>생활 - Faith Portal</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .faith-blue { background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%); }
            .faith-blue-hover:hover { background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- 헤더 -->
        <header class="bg-white/90 backdrop-blur-md border-b border-cyan-100 shadow-lg sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex justify-between items-center">
                <a href="/" class="text-lg sm:text-xl md:text-2xl font-bold faith-blue text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg shadow-lg">
                    <i class="fas fa-infinity mr-1 sm:mr-2"></i><span class="hidden xs:inline">Faith Portal</span><span class="xs:hidden">Faith</span>
                </a>
                <div id="user-menu" class="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <a href="/login" class="text-xs sm:text-sm text-gray-700 hover:text-cyan-600 font-medium transition-all px-2 sm:px-3">
                        <i class="fas fa-sign-in-alt mr-0 sm:mr-1"></i><span class="hidden sm:inline">로그인</span>
                    </a>
                    <a href="/signup" class="faith-blue text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium faith-blue-hover transition-all">
                        <i class="fas fa-user-plus mr-0 sm:mr-1"></i><span class="hidden sm:inline">회원가입</span>
                    </a>
                </div>
            </div>
        </header>

        <!-- 서브 메뉴 -->
        ${getLifestyleMenu('/lifestyle')}

        <!-- 메인 컨텐츠 -->
        <main class="max-w-7xl mx-auto px-4 py-8">
            <div class="text-center py-16">
                <div class="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <i class="fas fa-home text-4xl text-white"></i>
                </div>
                <h1 class="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
                    <span class="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">생활</span> 페이지
                </h1>
                <p class="text-gray-600 text-lg mb-8">
                    일상생활에 필요한 다양한 정보와 기능을 제공합니다
                </p>
                <div class="flex justify-center gap-4">
                    <a href="/lifestyle/youtube-download" class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all">
                        <i class="fab fa-youtube mr-2"></i>
                        유튜브 다운로드
                    </a>
                    <a href="/" class="inline-flex items-center px-6 py-3 bg-white text-gray-700 rounded-lg font-medium border border-gray-300 hover:border-cyan-500 hover:text-cyan-600 transition-all">
                        <i class="fas fa-home mr-2"></i>
                        메인으로
                    </a>
                </div>
            </div>

            <!-- 서비스 카드 그리드 -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                    <div class="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                        <i class="fab fa-youtube text-2xl text-white"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">유튜브 다운로드</h3>
                    <p class="text-gray-600 mb-4">유튜브 영상을 간편하게 다운로드하세요</p>
                    <a href="/lifestyle/youtube-download" class="text-cyan-600 hover:text-cyan-700 font-medium">
                        시작하기 →
                    </a>
                </div>

                <!-- 추가 서비스 카드는 여기에 -->
                <div class="bg-white rounded-xl shadow-lg p-6 opacity-50">
                    <div class="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center mb-4">
                        <i class="fas fa-plus text-2xl text-white"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">서비스 준비중</h3>
                    <p class="text-gray-600 mb-4">곧 더 많은 서비스를 제공할 예정입니다</p>
                </div>
            </div>
        </main>

        <!-- 푸터 -->
        <footer class="bg-gray-800 text-gray-300 mt-16 py-8">
            <div class="max-w-7xl mx-auto px-4 text-center">
                <p class="text-sm">&copy; 2025 Faith Portal. All rights reserved.</p>
            </div>
        </footer>

        <script>
            // 로그인 상태 확인
            const token = localStorage.getItem('auth_token');
            const userEmail = localStorage.getItem('user_email');
            const userLevel = parseInt(localStorage.getItem('user_level') || '0');
            
            if (token && userEmail) {
                const userMenu = document.getElementById('user-menu');
                userMenu.innerHTML = \`
                    <span class="text-xs sm:text-sm text-gray-700 px-2 sm:px-3">\${userEmail}</span>
                    \${userLevel >= 6 ? '<a href="/admin" class="text-xs sm:text-sm bg-yellow-500 text-gray-900 px-2 sm:px-3 py-1.5 rounded font-medium hover:bg-yellow-600 transition-all"><i class="fas fa-crown mr-1"></i><span class="hidden sm:inline">관리자</span></a>' : ''}
                    <button onclick="logout()" class="text-xs sm:text-sm text-gray-700 hover:text-red-600 font-medium transition-all px-2 sm:px-3">
                        <i class="fas fa-sign-out-alt mr-0 sm:mr-1"></i><span class="hidden sm:inline">로그아웃</span>
                    </button>
                \`;
            }
            
            function logout() {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_email');
                localStorage.removeItem('user_level');
                location.href = '/';
            }
        </script>
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
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .faith-blue { background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%); }
            .faith-blue-hover:hover { background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- 헤더 -->
        <header class="bg-white/90 backdrop-blur-md border-b border-cyan-100 shadow-lg sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex justify-between items-center">
                <a href="/" class="text-lg sm:text-xl md:text-2xl font-bold faith-blue text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg shadow-lg">
                    <i class="fas fa-infinity mr-1 sm:mr-2"></i><span class="hidden xs:inline">Faith Portal</span><span class="xs:hidden">Faith</span>
                </a>
                <div id="user-menu" class="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <a href="/login" class="text-xs sm:text-sm text-gray-700 hover:text-cyan-600 font-medium transition-all px-2 sm:px-3">
                        <i class="fas fa-sign-in-alt mr-0 sm:mr-1"></i><span class="hidden sm:inline">로그인</span>
                    </a>
                    <a href="/signup" class="faith-blue text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium faith-blue-hover transition-all">
                        <i class="fas fa-user-plus mr-0 sm:mr-1"></i><span class="hidden sm:inline">회원가입</span>
                    </a>
                </div>
            </div>
        </header>

        <!-- 서브 메뉴 -->
        ${getLifestyleMenu('/lifestyle/youtube-download')}

        <!-- 광고 배너 -->
        <div class="bg-gradient-to-r from-yellow-400 via-red-400 to-pink-400 py-4">
            <div class="max-w-7xl mx-auto px-4">
                <div class="flex items-center justify-center space-x-4">
                    <i class="fas fa-ad text-white text-2xl"></i>
                    <p class="text-white font-bold text-lg">광고 배너 영역 - 여기에 광고가 표시됩니다</p>
                    <i class="fas fa-ad text-white text-2xl"></i>
                </div>
            </div>
        </div>

        <!-- 메인 컨텐츠 -->
        <div class="max-w-7xl mx-auto px-4 py-8">
            <div class="flex flex-col lg:flex-row gap-6">
                <!-- 왼쪽 사이드바 (페이지 네비게이션) -->
                <aside class="lg:w-64 flex-shrink-0">
                    <div class="bg-white rounded-lg shadow-lg p-4 sticky top-24">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-list mr-2 text-cyan-600"></i>
                            페이지 메뉴
                        </h3>
                        <nav class="space-y-2">
                            <a href="/lifestyle" class="flex items-center px-4 py-2 text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 rounded-lg transition-all">
                                <i class="fas fa-home mr-3"></i>
                                생활 홈
                            </a>
                            <a href="/lifestyle/youtube-download" class="flex items-center px-4 py-2 bg-cyan-50 text-cyan-600 font-medium rounded-lg">
                                <i class="fab fa-youtube mr-3"></i>
                                유튜브 다운로드
                            </a>
                            <!-- 추가 메뉴 -->
                            <div class="pt-2 border-t border-gray-200">
                                <p class="px-4 py-2 text-xs text-gray-500 font-medium">준비 중인 서비스</p>
                                <a href="#" class="flex items-center px-4 py-2 text-gray-400 cursor-not-allowed">
                                    <i class="fas fa-calculator mr-3"></i>
                                    계산기
                                </a>
                                <a href="#" class="flex items-center px-4 py-2 text-gray-400 cursor-not-allowed">
                                    <i class="fas fa-cloud-sun mr-3"></i>
                                    날씨
                                </a>
                            </div>
                        </nav>
                    </div>
                </aside>

                <!-- 메인 컨텐츠 영역 -->
                <main class="flex-1">
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

        <!-- 푸터 -->
        <footer class="bg-gray-800 text-gray-300 mt-16 py-8">
            <div class="max-w-7xl mx-auto px-4 text-center">
                <p class="text-sm">&copy; 2025 Faith Portal. All rights reserved.</p>
            </div>
        </footer>

        <script>
            // 로그인 상태 확인
            const token = localStorage.getItem('auth_token');
            const userEmail = localStorage.getItem('user_email');
            const userLevel = parseInt(localStorage.getItem('user_level') || '0');
            
            if (token && userEmail) {
                const userMenu = document.getElementById('user-menu');
                userMenu.innerHTML = \`
                    <span class="text-xs sm:text-sm text-gray-700 px-2 sm:px-3">\${userEmail}</span>
                    \${userLevel >= 6 ? '<a href="/admin" class="text-xs sm:text-sm bg-yellow-500 text-gray-900 px-2 sm:px-3 py-1.5 rounded font-medium hover:bg-yellow-600 transition-all"><i class="fas fa-crown mr-1"></i><span class="hidden sm:inline">관리자</span></a>' : ''}
                    <button onclick="logout()" class="text-xs sm:text-sm text-gray-700 hover:text-red-600 font-medium transition-all px-2 sm:px-3">
                        <i class="fas fa-sign-out-alt mr-0 sm:mr-1"></i><span class="hidden sm:inline">로그아웃</span>
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
      for (const category of categories) {
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
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>뉴스 - Faith Portal</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .faith-blue { background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%); }
            .faith-blue-hover:hover { background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); }
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
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- 헤더 -->
        <header class="bg-white/90 backdrop-blur-md border-b border-purple-100 shadow-lg sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex justify-between items-center">
                <a href="/" class="text-lg sm:text-xl md:text-2xl font-bold faith-blue text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg shadow-lg">
                    <i class="fas fa-infinity mr-1 sm:mr-2"></i><span class="hidden xs:inline">Faith Portal</span><span class="xs:hidden">Faith</span>
                </a>
                <div id="user-menu" class="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <a href="/login" class="text-xs sm:text-sm text-gray-700 hover:text-purple-600 font-medium transition-all px-2 sm:px-3">
                        <i class="fas fa-sign-in-alt mr-0 sm:mr-1"></i><span class="hidden sm:inline">로그인</span>
                    </a>
                    <a href="/signup" class="text-xs sm:text-sm faith-blue text-white px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-lg shadow-lg faith-blue-hover font-medium">
                        <i class="fas fa-user-plus mr-0 sm:mr-1"></i><span class="hidden sm:inline">회원가입</span><span class="sm:hidden">가입</span>
                    </a>
                </div>
            </div>
        </header>

        <!-- 메인 컨텐츠 -->
        <main class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
            <!-- 페이지 타이틀 -->
            <div class="mb-6 sm:mb-8">
                <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center">
                    <i class="fas fa-newspaper text-red-500 mr-3"></i>
                    뉴스
                </h1>
                <p class="text-sm sm:text-base text-gray-600">실시간으로 업데이트되는 최신 뉴스를 확인하세요</p>
            </div>

            <!-- 카테고리 탭 -->
            <div class="mb-6 sm:mb-8 overflow-x-auto">
                <div class="flex space-x-2 sm:space-x-3 pb-2 min-w-max">
                    <button onclick="filterNewsByCategory('all')" data-category="all" class="category-btn px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-red-500 to-pink-600 text-white font-medium text-sm sm:text-base shadow-lg">
                        전체
                    </button>
                    <button onclick="filterNewsByCategory('general')" data-category="general" class="category-btn px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-gray-700 font-medium hover:bg-gray-100 text-sm sm:text-base shadow">
                        일반
                    </button>
                    <button onclick="filterNewsByCategory('politics')" data-category="politics" class="category-btn px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-gray-700 font-medium hover:bg-gray-100 text-sm sm:text-base shadow">
                        정치
                    </button>
                    <button onclick="filterNewsByCategory('economy')" data-category="economy" class="category-btn px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-gray-700 font-medium hover:bg-gray-100 text-sm sm:text-base shadow">
                        경제
                    </button>
                    <button onclick="filterNewsByCategory('tech')" data-category="tech" class="category-btn px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-gray-700 font-medium hover:bg-gray-100 text-sm sm:text-base shadow">
                        IT/과학
                    </button>
                    <button onclick="filterNewsByCategory('sports')" data-category="sports" class="category-btn px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-gray-700 font-medium hover:bg-gray-100 text-sm sm:text-base shadow">
                        스포츠
                    </button>
                    <button onclick="filterNewsByCategory('entertainment')" data-category="entertainment" class="category-btn px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-gray-700 font-medium hover:bg-gray-100 text-sm sm:text-base shadow">
                        엔터테인먼트
                    </button>
                </div>
            </div>

            <!-- 뉴스 그리드 -->
            <div id="news-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                ${newsFromDB.length > 0 ? newsFromDB.map(news => `
                    <article class="news-card bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg" onclick="window.open('${news.link}', '_blank')">
                        <div class="p-4">
                            <div class="flex items-center justify-between mb-3">
                                <span class="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs sm:text-sm font-bold rounded-full">
                                    ${news.category}
                                </span>
                                <span class="text-xs text-gray-400">
                                    ${new Date(news.created_at).toLocaleDateString('ko-KR')}
                                </span>
                            </div>
                            <h3 class="font-bold text-base sm:text-lg text-gray-900 mb-2 line-clamp-3 hover:text-purple-600 transition">
                                ${news.title}
                            </h3>
                            <p class="text-sm text-gray-600 mb-3 line-clamp-3">
                                ${news.summary || ''}
                            </p>
                            <div class="flex items-center justify-between text-xs sm:text-sm text-gray-500 pt-3 border-t border-gray-100">
                                <span class="font-medium">${news.publisher || '구글 뉴스'}</span>
                                <i class="fas fa-external-link-alt text-gray-400"></i>
                            </div>
                        </div>
                    </article>
                `).join('') : '<div class="col-span-full text-center py-12"><p class="text-gray-500">뉴스를 불러오는 중입니다...</p></div>'}
            </div>

            <!-- 새로고침 버튼 -->
            <div class="mt-8 sm:mt-12 text-center">
                <button onclick="fetchNewsAndReload()" class="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition-all">
                    <i class="fas fa-sync-alt mr-2"></i>
                    최신 뉴스 가져오기
                </button>
            </div>
        </main>

        <!-- 푸터 -->
        <footer class="bg-gradient-to-r from-gray-900 to-gray-800 border-t border-gray-700 mt-8 sm:mt-12 md:mt-16 py-8 sm:py-10 md:py-12">
            <div class="max-w-7xl mx-auto px-4">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
                    <div class="col-span-2 md:col-span-1">
                        <h4 class="text-white font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center">
                            <i class="fas fa-infinity mr-2 text-purple-400"></i>
                            Faith Portal
                        </h4>
                        <p class="text-gray-400 text-xs sm:text-sm">
                            믿음의 포탈에서<br/>더 넓은 세상을 만나보세요
                        </p>
                    </div>
                    <div>
                        <h5 class="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">서비스</h5>
                        <div class="space-y-1.5 sm:space-y-2">
                            <a href="/news" class="block text-gray-400 hover:text-purple-400 text-xs sm:text-sm transition">뉴스</a>
                            <a href="#" class="block text-gray-400 hover:text-purple-400 text-xs sm:text-sm transition">메일</a>
                            <a href="#" class="block text-gray-400 hover:text-purple-400 text-xs sm:text-sm transition">카페</a>
                            <a href="#" class="block text-gray-400 hover:text-purple-400 text-xs sm:text-sm transition">블로그</a>
                            <a href="#" class="block text-gray-400 hover:text-purple-400 text-xs sm:text-sm transition">쇼핑</a>
                        </div>
                    </div>
                    <div>
                        <h5 class="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">회사</h5>
                        <div class="space-y-1.5 sm:space-y-2">
                            <a href="#" class="block text-gray-400 hover:text-purple-400 text-xs sm:text-sm transition">회사소개</a>
                            <a href="#" class="block text-gray-400 hover:text-purple-400 text-xs sm:text-sm transition">이용약관</a>
                            <a href="#" class="block text-gray-400 hover:text-purple-400 text-xs sm:text-sm transition">개인정보처리방침</a>
                            <a href="#" class="block text-gray-400 hover:text-purple-400 text-xs sm:text-sm transition">고객센터</a>
                        </div>
                    </div>
                    <div class="col-span-2 md:col-span-1">
                        <h5 class="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">소셜 미디어</h5>
                        <div class="flex space-x-3 sm:space-x-4">
                            <a href="#" class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 hover:bg-purple-600 hover:text-white transition">
                                <i class="fab fa-facebook-f text-sm"></i>
                            </a>
                            <a href="#" class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 hover:bg-purple-600 hover:text-white transition">
                                <i class="fab fa-twitter text-sm"></i>
                            </a>
                            <a href="#" class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 hover:bg-purple-600 hover:text-white transition">
                                <i class="fab fa-instagram text-sm"></i>
                            </a>
                        </div>
                    </div>
                </div>
                <div class="border-t border-gray-700 pt-4 sm:pt-6 text-center">
                    <p class="text-gray-400 text-xs sm:text-sm px-4">
                        &copy; 2025 Faith Portal. All rights reserved. Made with 
                        <i class="fas fa-heart text-red-500"></i> 
                        by Faith Team
                    </p>
                </div>
            </div>
        </footer>

        <script>
            // 로그인 상태 확인
            const token = localStorage.getItem('auth_token');
            const userEmail = localStorage.getItem('user_email');
            const userLevel = parseInt(localStorage.getItem('user_level') || '0');
            
            if (token && userEmail) {
                let menuHTML = '<span class="text-xs sm:text-sm text-gray-700 px-2">' + userEmail + '님</span>';
                
                if (userLevel >= 6) {
                    menuHTML += '<a href="/admin" class="text-xs sm:text-sm bg-yellow-500 text-gray-900 px-3 sm:px-4 py-1.5 sm:py-2 rounded hover:bg-yellow-600 font-medium"><i class="fas fa-crown mr-1"></i><span class="hidden sm:inline">관리자</span></a>';
                }
                
                menuHTML += '<button id="logout-btn" class="text-xs sm:text-sm faith-blue text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded faith-blue-hover"><span class="hidden sm:inline">로그아웃</span><span class="sm:hidden">로그아웃</span></button>';
                
                document.getElementById('user-menu').innerHTML = menuHTML;

                document.getElementById('logout-btn').addEventListener('click', function() {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user_email');
                    localStorage.removeItem('user_level');
                    location.reload();
                });
            }
            
            // 최신 뉴스 가져오기
            async function fetchNewsAndReload() {
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
            
            // HTML 이스케이프 함수
            function escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }
            
            // 카테고리별 뉴스 필터링
            async function filterNewsByCategory(category) {
                // 버튼 스타일 업데이트
                document.querySelectorAll('.category-btn').forEach(btn => {
                    if (btn.dataset.category === category) {
                        btn.className = 'category-btn px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-red-500 to-pink-600 text-white font-medium text-sm sm:text-base shadow-lg';
                    } else {
                        btn.className = 'category-btn px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-gray-700 font-medium hover:bg-gray-100 text-sm sm:text-base shadow';
                    }
                });
                
                // API에서 뉴스 가져오기
                const newsGrid = document.getElementById('news-grid');
                newsGrid.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-gray-500">뉴스를 불러오는 중입니다...</p></div>';
                
                try {
                    const categoryParam = category === 'all' ? '' : '?category=' + category;
                    const response = await fetch('/api/news' + categoryParam + (categoryParam ? '&' : '?') + 'limit=50');
                    const data = await response.json();
                    
                    if (data.success && data.news.length > 0) {
                        newsGrid.innerHTML = data.news.map(news => \`
                            <article class="news-card bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg" onclick="window.open('\${escapeHtml(news.link)}', '_blank')">
                                <div class="p-4">
                                    <div class="flex items-center justify-between mb-3">
                                        <span class="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs sm:text-sm font-bold rounded-full">
                                            \${escapeHtml(news.category)}
                                        </span>
                                        <span class="text-xs text-gray-400">
                                            \${new Date(news.created_at).toLocaleDateString('ko-KR')}
                                        </span>
                                    </div>
                                    <h3 class="font-bold text-base sm:text-lg text-gray-900 mb-2 line-clamp-3 hover:text-purple-600 transition">
                                        \${escapeHtml(news.title)}
                                    </h3>
                                    <p class="text-sm text-gray-600 mb-3 line-clamp-3">
                                        \${escapeHtml(news.summary || '')}
                                    </p>
                                    <div class="flex items-center justify-between text-xs sm:text-sm text-gray-500 pt-3 border-t border-gray-100">
                                        <span class="font-medium">\${escapeHtml(news.publisher || '구글 뉴스')}</span>
                                        <i class="fas fa-external-link-alt text-gray-400"></i>
                                    </div>
                                </div>
                            </article>
                        \`).join('');
                    } else {
                        newsGrid.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-gray-500">해당 카테고리의 뉴스가 없습니다.</p></div>';
                    }
                } catch (error) {
                    console.error('뉴스 로드 오류:', error);
                    newsGrid.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-red-500">뉴스를 불러오는 중 오류가 발생했습니다.</p></div>';
                }
            }
        </script>
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
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .faith-blue { background-color: #1E40AF; }
            .faith-blue-hover:hover { background-color: #1E3A8A; }
        </style>
    </head>
    <body class="bg-gray-50">
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
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .faith-blue { background-color: #1E40AF; }
            .faith-blue-hover:hover { background-color: #1E3A8A; }
        </style>
    </head>
    <body class="bg-gray-50">
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
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-4">
                        <a href="/" class="text-2xl font-bold">Faith Portal</a>
                        <span class="text-sm bg-yellow-500 text-gray-900 px-3 py-1 rounded-full font-medium">
                            <i class="fas fa-crown mr-1"></i>
                            관리자
                        </span>
                    </div>
                    <div id="admin-info" class="flex items-center space-x-4">
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
            <div class="max-w-7xl mx-auto px-4">
                ${getAdminNavigation('/admin')}
            </div>
        </nav>

        <!-- 메인 컨텐츠 -->
        <main class="max-w-7xl mx-auto px-4 py-8">
            <!-- 통계 카드 -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="flex-1">
                            <p class="text-gray-500 text-sm">전체 회원</p>
                            <p id="total-users" class="text-3xl font-bold text-gray-800">0</p>
                        </div>
                        <div class="bg-blue-100 text-blue-600 rounded-full p-4">
                            <i class="fas fa-users text-2xl"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="flex-1">
                            <p class="text-gray-500 text-sm">활성 회원</p>
                            <p id="active-users" class="text-3xl font-bold text-green-600">0</p>
                        </div>
                        <div class="bg-green-100 text-green-600 rounded-full p-4">
                            <i class="fas fa-user-check text-2xl"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="flex-1">
                            <p class="text-gray-500 text-sm">정지 회원</p>
                            <p id="suspended-users" class="text-3xl font-bold text-orange-600">0</p>
                        </div>
                        <div class="bg-orange-100 text-orange-600 rounded-full p-4">
                            <i class="fas fa-user-lock text-2xl"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="flex-1">
                            <p class="text-gray-500 text-sm">오늘 가입</p>
                            <p id="today-signups" class="text-3xl font-bold text-purple-600">0</p>
                        </div>
                        <div class="bg-purple-100 text-purple-600 rounded-full p-4">
                            <i class="fas fa-user-plus text-2xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 등급별 회원 분포 -->
            <div class="bg-white rounded-lg shadow p-6 mb-8">
                <h3 class="text-lg font-bold text-gray-800 mb-4">
                    <i class="fas fa-chart-bar text-blue-600 mr-2"></i>
                    회원 등급별 분포
                </h3>
                <canvas id="levelChart" style="max-height: 300px;"></canvas>
            </div>

            <!-- 최근 가입 회원 -->
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-bold text-gray-800 mb-4">
                    <i class="fas fa-clock text-blue-600 mr-2"></i>
                    최근 가입 회원 (10명)
                </h3>
                <div class="overflow-x-auto">
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
            <div class="max-w-7xl mx-auto px-4 py-4">
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
            <div class="max-w-7xl mx-auto px-4">
                ${getAdminNavigation('/admin/users')}
            </div>
        </nav>

        <!-- 메인 컨텐츠 -->
        <main class="max-w-7xl mx-auto px-4 py-8">
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
            <div class="max-w-7xl mx-auto px-4 py-4">
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
            <div class="max-w-7xl mx-auto px-4">
                ${getAdminNavigation('/admin/stats')}
            </div>
        </nav>

        <!-- 메인 컨텐츠 -->
        <main class="max-w-7xl mx-auto px-4 py-8">
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
            <div class="max-w-7xl mx-auto px-4 py-4">
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
            <div class="max-w-7xl mx-auto px-4">
                ${getAdminNavigation('/admin/logs')}
            </div>
        </nav>

        <!-- 메인 컨텐츠 -->
        <main class="max-w-7xl mx-auto px-4 py-8">
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
            <div class="max-w-7xl mx-auto px-4 py-4">
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
            <div class="max-w-7xl mx-auto px-4">
                ${getAdminNavigation('/admin/notifications')}
            </div>
        </nav>

        <!-- 메인 컨텐츠 -->
        <main class="max-w-7xl mx-auto px-4 py-8">
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
    const response = await fetch(url)
    const text = await response.text()
    
    // XML 파싱 (간단한 정규식 기반)
    const items: any[] = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let match
    
    while ((match = itemRegex.exec(text)) !== null) {
      const itemContent = match[1]
      
      const title = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || 
                    itemContent.match(/<title>(.*?)<\/title>/)?.[1] || ''
      const link = itemContent.match(/<link>(.*?)<\/link>/)?.[1] || ''
      const pubDate = itemContent.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
      let description = itemContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
                        itemContent.match(/<description>(.*?)<\/description>/)?.[1] || ''
      
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
    // RSS에서 뉴스 가져오기
    const newsItems = await parseGoogleNewsRSS(category)
    
    if (newsItems.length === 0) {
      return c.json({ error: '뉴스를 가져올 수 없습니다.' }, 500)
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
      message: `${savedCount}개의 새 뉴스를 저장했습니다.`
    })
  } catch (error) {
    console.error('뉴스 가져오기 오류:', error)
    return c.json({ error: '뉴스 가져오기 실패' }, 500)
  }
})

// 저장된 뉴스 목록 조회
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
  
  // DB에서 모든 뉴스 가져오기
  let newsFromDB: any[] = []
  try {
    const { results } = await DB.prepare('SELECT * FROM news ORDER BY created_at DESC').all()
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
            <div class="max-w-7xl mx-auto px-4 py-4">
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
            <div class="max-w-7xl mx-auto px-4">
                ${getAdminNavigation('/admin/news')}
            </div>
        </nav>

        <!-- 메인 컨텐츠 -->
        <main class="max-w-7xl mx-auto px-4 py-8">
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
                            <p class="text-2xl font-bold text-gray-800">${newsFromDB.length}</p>
                        </div>
                        <i class="fas fa-newspaper text-3xl text-blue-500"></i>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-500 text-sm">정치</p>
                            <p class="text-2xl font-bold text-purple-600">${newsFromDB.filter(n => n.category === 'politics').length}</p>
                        </div>
                        <i class="fas fa-landmark text-3xl text-purple-500"></i>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-500 text-sm">경제</p>
                            <p class="text-2xl font-bold text-green-600">${newsFromDB.filter(n => n.category === 'economy').length}</p>
                        </div>
                        <i class="fas fa-chart-line text-3xl text-green-500"></i>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-500 text-sm">기술</p>
                            <p class="text-2xl font-bold text-indigo-600">${newsFromDB.filter(n => n.category === 'tech').length}</p>
                        </div>
                        <i class="fas fa-microchip text-3xl text-indigo-500"></i>
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
                        <h3 class="text-lg font-bold text-gray-800">뉴스 목록</h3>
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
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
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
                                        <a href="${news.link}" target="_blank" class="hover:text-blue-600">
                                            ${news.title}
                                        </a>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${news.publisher || '구글 뉴스'}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(news.created_at).toLocaleDateString('ko-KR')}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <a href="${news.link}" target="_blank" class="text-blue-600 hover:text-blue-900 mr-3">
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
                </div>
            </div>
        </main>

        <script>
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
            
            // 카테고리 필터
            function filterNews() {
                const category = document.getElementById('category-filter').value;
                const rows = document.querySelectorAll('#news-table tr');
                
                rows.forEach(row => {
                    if (category === 'all' || row.dataset.category === category) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                });
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

export default app
