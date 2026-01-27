app.get('/mypage', optionalAuth, (c) => {
  const user = c.get('user')
  
  return c.html(`
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>마이페이지 - Faith Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <style>
        .section-active {
            border-left-color: #0ea5e9;
            background-color: #f0f9ff;
            font-weight: 600;
        }
        .dark .section-active {
            background-color: #1e293b;
        }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    
    ${getCommonHeader()}
    
    <!-- 메인 컨테이너 -->
    <div class="max-w-7xl mx-auto px-4 py-8">
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">
                <i class="fas fa-user-circle mr-2"></i>마이페이지
            </h1>
            <p class="text-gray-600">나의 저장 항목과 활동 내역을 확인하세요</p>
        </div>
        
        <!-- 레이아웃: 사이드바 + 컨텐츠 -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            <!-- 사이드바 -->
            <div class="lg:col-span-1">
                <div class="bg-white rounded-lg shadow-lg p-4 sticky top-4">
                    <nav class="space-y-2">
                        <button onclick="showSection('news')" id="nav-news" class="section-nav w-full text-left px-4 py-3 rounded-lg border-l-4 border-transparent hover:bg-gray-50 transition-all section-active">
                            <i class="fas fa-newspaper mr-3 text-sky-500"></i>
                            <span>뉴스</span>
                        </button>
                        <button onclick="showSection('stocks')" id="nav-stocks" class="section-nav w-full text-left px-4 py-3 rounded-lg border-l-4 border-transparent hover:bg-gray-50 transition-all">
                            <i class="fas fa-chart-line mr-3 text-green-500"></i>
                            <span>주식</span>
                        </button>
                        <button onclick="showSection('games')" id="nav-games" class="section-nav w-full text-left px-4 py-3 rounded-lg border-l-4 border-transparent hover:bg-gray-50 transition-all">
                            <i class="fas fa-gamepad mr-3 text-purple-500"></i>
                            <span>게임</span>
                        </button>
                        <button onclick="showSection('utils')" id="nav-utils" class="section-nav w-full text-left px-4 py-3 rounded-lg border-l-4 border-transparent hover:bg-gray-50 transition-all">
                            <i class="fas fa-tools mr-3 text-orange-500"></i>
                            <span>유틸리티</span>
                        </button>
                    </nav>
                </div>
            </div>
            
            <!-- 메인 컨텐츠 -->
            <div class="lg:col-span-3">
                
                <!-- 뉴스 섹션 -->
                <div id="section-news" class="section-content">
                    <div class="bg-white rounded-lg shadow-lg p-6">
                        <h2 class="text-2xl font-bold text-gray-900 mb-6">
                            <i class="fas fa-newspaper mr-2 text-sky-500"></i>뉴스
                        </h2>
                        
                        <!-- 구독 키워드 -->
                        <div class="mb-8">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">구독 키워드</h3>
                            <div id="keywords-list" class="flex flex-wrap gap-2">
                                <div class="text-gray-500 text-sm">로딩 중...</div>
                            </div>
                        </div>
                        
                        <!-- 북마크 -->
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">북마크한 뉴스</h3>
                            <div id="bookmarks-list" class="space-y-4">
                                <div class="text-gray-500 text-sm">로딩 중...</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 주식 섹션 -->
                <div id="section-stocks" class="section-content hidden">
                    <div class="bg-white rounded-lg shadow-lg p-6">
                        <h2 class="text-2xl font-bold text-gray-900 mb-6">
                            <i class="fas fa-chart-line mr-2 text-green-500"></i>주식
                        </h2>
                        
                        <!-- 포트폴리오 통계 -->
                        <div class="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                                <div class="text-sm opacity-90 mb-1">총 종목 수</div>
                                <div class="text-3xl font-bold" id="total-stocks">-</div>
                            </div>
                            <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
                                <div class="text-sm opacity-90 mb-1">미국 주식</div>
                                <div class="text-3xl font-bold" id="us-stocks">-</div>
                            </div>
                            <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                                <div class="text-sm opacity-90 mb-1">한국 주식</div>
                                <div class="text-3xl font-bold" id="kr-stocks">-</div>
                            </div>
                        </div>
                        
                        <!-- 관심 종목 -->
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">관심 종목</h3>
                            <div id="watchlist" class="space-y-3">
                                <div class="text-gray-500 text-sm">로딩 중...</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 게임 섹션 -->
                <div id="section-games" class="section-content hidden">
                    <div class="bg-white rounded-lg shadow-lg p-6">
                        <h2 class="text-2xl font-bold text-gray-900 mb-6">
                            <i class="fas fa-gamepad mr-2 text-purple-500"></i>게임
                        </h2>
                        
                        <!-- 게임 통계 -->
                        <div class="mb-8">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">게임 통계</h3>
                            <div id="game-stats" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="text-gray-500 text-sm">게임 기록이 없습니다</div>
                            </div>
                        </div>
                        
                        <!-- 최근 플레이 -->
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">최근 플레이</h3>
                            <div id="game-history" class="space-y-3">
                                <div class="text-gray-500 text-sm">로딩 중...</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 유틸리티 섹션 -->
                <div id="section-utils" class="section-content hidden">
                    <div class="bg-white rounded-lg shadow-lg p-6">
                        <h2 class="text-2xl font-bold text-gray-900 mb-6">
                            <i class="fas fa-tools mr-2 text-orange-500"></i>유틸리티
                        </h2>
                        
                        <!-- 저장된 설정 -->
                        <div class="mb-8">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">저장된 설정</h3>
                            <div id="util-settings" class="space-y-3">
                                <div class="text-gray-500 text-sm">로딩 중...</div>
                            </div>
                        </div>
                        
                        <!-- 사용 히스토리 -->
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">사용 히스토리</h3>
                            <div id="util-history" class="space-y-3">
                                <div class="text-gray-500 text-sm">로딩 중...</div>
                            </div>
                        </div>
                    </div>
                </div>
                
            </div>
        </div>
    </div>
    
    <script>
        // 섹션 전환
        function showSection(sectionName) {
            document.querySelectorAll('.section-content').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.section-nav').forEach(el => el.classList.remove('section-active'));
            
            document.getElementById(\`section-\${sectionName}\`).classList.remove('hidden');
            document.getElementById(\`nav-\${sectionName}\`).classList.add('section-active');
            
            loadSectionData(sectionName);
        }
        
        async function loadSectionData(sectionName) {
            switch(sectionName) {
                case 'news': await loadNewsData(); break;
                case 'stocks': await loadStocksData(); break;
                case 'games': await loadGamesData(); break;
                case 'utils': await loadUtilsData(); break;
            }
        }
        
        async function loadNewsData() {
            try {
                const keywordsRes = await axios.get('/api/user/keywords');
                const keywords = keywordsRes.data.keywords || [];
                
                const keywordsList = document.getElementById('keywords-list');
                if (keywords.length > 0) {
                    keywordsList.innerHTML = keywords.map(kw => \`
                        <span class="inline-flex items-center px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-sm">
                            <i class="fas fa-tag mr-1"></i>\${kw.keyword}
                        </span>
                    \`).join('');
                } else {
                    keywordsList.innerHTML = '<div class="text-gray-500 text-sm">구독 중인 키워드가 없습니다</div>';
                }
                
                const bookmarksRes = await axios.get('/api/user/bookmarks?page=1&limit=10');
                const bookmarks = bookmarksRes.data.bookmarks || [];
                
                const bookmarksList = document.getElementById('bookmarks-list');
                if (bookmarks.length > 0) {
                    bookmarksList.innerHTML = bookmarks.map(bm => \`
                        <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <h4 class="font-semibold text-gray-900 mb-2">\${bm.title}</h4>
                            <div class="text-sm text-gray-500">
                                <span class="inline-block px-2 py-1 bg-gray-100 rounded text-xs mr-2">\${bm.category}</span>
                                \${new Date(bm.bookmarked_at).toLocaleDateString('ko-KR')}
                            </div>
                        </div>
                    \`).join('');
                } else {
                    bookmarksList.innerHTML = '<div class="text-gray-500 text-sm">북마크한 뉴스가 없습니다</div>';
                }
            } catch (error) {
                console.error('뉴스 데이터 로드 실패:', error);
            }
        }
        
        async function loadStocksData() {
            try {
                const statsRes = await axios.get('/api/user/watchlist/stats');
                const stats = statsRes.data.stats || {};
                
                document.getElementById('total-stocks').textContent = stats.total_stocks || 0;
                document.getElementById('us-stocks').textContent = stats.market_distribution?.US || 0;
                document.getElementById('kr-stocks').textContent = stats.market_distribution?.KR || 0;
                
                const watchlistRes = await axios.get('/api/user/watchlist');
                const stocks = watchlistRes.data.stocks || [];
                
                const watchlist = document.getElementById('watchlist');
                if (stocks.length > 0) {
                    watchlist.innerHTML = stocks.map(stock => \`
                        <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h4 class="font-semibold text-gray-900">\${stock.stock_name}</h4>
                                    <div class="text-sm text-gray-500 mt-1">\${stock.stock_symbol}</div>
                                </div>
                                <span class="px-2 py-1 rounded text-xs \${stock.market_type === 'US' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">
                                    \${stock.market_type}
                                </span>
                            </div>
                            \${stock.memo ? \`<div class="text-sm text-gray-600 mt-2">\${stock.memo}</div>\` : ''}
                            \${stock.target_price ? \`<div class="text-sm text-gray-500 mt-2">목표가: \${stock.target_price.toLocaleString()}\${stock.market_type === 'KR' ? '원' : '$'}</div>\` : ''}
                        </div>
                    \`).join('');
                } else {
                    watchlist.innerHTML = '<div class="text-gray-500 text-sm">관심 종목이 없습니다</div>';
                }
            } catch (error) {
                console.error('주식 데이터 로드 실패:', error);
            }
        }
        
        async function loadGamesData() {
            try {
                const statsRes = await axios.get('/api/user/games/stats');
                const stats = statsRes.data.stats || {};
                
                const gameStats = document.getElementById('game-stats');
                const statsKeys = Object.keys(stats);
                
                if (statsKeys.length > 0) {
                    gameStats.innerHTML = statsKeys.map(gameType => {
                        const stat = stats[gameType];
                        return \`
                            <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                                <div class="text-sm opacity-90 mb-1">\${gameType}</div>
                                <div class="text-2xl font-bold mb-2">\${stat.best_score}</div>
                                <div class="text-xs opacity-80">플레이: \${stat.play_count}회</div>
                            </div>
                        \`;
                    }).join('');
                } else {
                    gameStats.innerHTML = '<div class="text-gray-500 text-sm col-span-2">게임 기록이 없습니다</div>';
                }
                
                const historyRes = await axios.get('/api/user/games/history?limit=10');
                const history = historyRes.data.history?.history || [];
                
                const gameHistory = document.getElementById('game-history');
                if (history.length > 0) {
                    gameHistory.innerHTML = history.map(game => \`
                        <div class="border border-gray-200 rounded-lg p-4">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h4 class="font-semibold text-gray-900">\${game.game_type}</h4>
                                    <div class="text-2xl font-bold text-purple-600 mt-1">\${game.score}점</div>
                                </div>
                                <div class="text-sm text-gray-500">\${new Date(game.played_at).toLocaleDateString('ko-KR')}</div>
                            </div>
                        </div>
                    \`).join('');
                } else {
                    gameHistory.innerHTML = '<div class="text-gray-500 text-sm">플레이 기록이 없습니다</div>';
                }
            } catch (error) {
                console.error('게임 데이터 로드 실패:', error);
            }
        }
        
        async function loadUtilsData() {
            try {
                const settingsRes = await axios.get('/api/user/utils/settings');
                const settings = settingsRes.data.settings || {};
                
                const utilSettings = document.getElementById('util-settings');
                const settingsKeys = Object.keys(settings);
                
                if (settingsKeys.length > 0) {
                    utilSettings.innerHTML = settingsKeys.map(utilType => \`
                        <div class="border border-gray-200 rounded-lg p-4">
                            <h4 class="font-semibold text-gray-900 mb-2">\${utilType}</h4>
                            <pre class="text-sm text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto">\${JSON.stringify(settings[utilType], null, 2)}</pre>
                        </div>
                    \`).join('');
                } else {
                    utilSettings.innerHTML = '<div class="text-gray-500 text-sm">저장된 설정이 없습니다</div>';
                }
                
                const historyRes = await axios.get('/api/user/utils/history?limit=10');
                const history = historyRes.data.history || [];
                
                const utilHistory = document.getElementById('util-history');
                if (history.length > 0) {
                    utilHistory.innerHTML = history.map(item => \`
                        <div class="border border-gray-200 rounded-lg p-4">
                            <div class="flex justify-between items-start mb-2">
                                <h4 class="font-semibold text-gray-900">\${item.util_type}</h4>
                                <div class="text-sm text-gray-500">\${new Date(item.created_at).toLocaleDateString('ko-KR')}</div>
                            </div>
                            <div class="text-sm text-gray-600">
                                <div class="mb-1"><strong>입력:</strong> \${JSON.stringify(item.input_data)}</div>
                                \${item.result_data ? \`<div><strong>결과:</strong> \${JSON.stringify(item.result_data)}</div>\` : ''}
                            </div>
                        </div>
                    \`).join('');
                } else {
                    utilHistory.innerHTML = '<div class="text-gray-500 text-sm">사용 기록이 없습니다</div>';
                }
            } catch (error) {
                console.error('유틸리티 데이터 로드 실패:', error);
            }
        }
        
        document.addEventListener('DOMContentLoaded', function() {
            showSection('news');
        });
    </script>
</body>
</html>
  `)
})
