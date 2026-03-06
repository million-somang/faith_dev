import { Hono } from 'hono'
import { requireAuth } from '../../middleware/auth'
import { MyPageController } from '../../controllers/mypage.controller'
import type { Bindings, Variables } from '../../types'

const mypageRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// 뉴스 키워드 구독 관리
mypageRoutes.post('/api/user/keywords', requireAuth, MyPageController.addKeyword)
mypageRoutes.get('/api/user/keywords', requireAuth, MyPageController.getKeywords)
mypageRoutes.delete('/api/user/keywords/:keywordId', requireAuth, MyPageController.deleteKeyword)

// 뉴스 북마크 관리
mypageRoutes.post('/api/user/bookmarks', requireAuth, MyPageController.addBookmark)
mypageRoutes.get('/api/user/bookmarks', requireAuth, MyPageController.getBookmarks)
mypageRoutes.delete('/api/user/bookmarks/:newsId', requireAuth, MyPageController.deleteBookmark)

// 키워드별 뉴스 조회
mypageRoutes.get('/api/user/news/by-keyword', requireAuth, MyPageController.getNewsByKeyword)

// 뉴스 읽음 표시
mypageRoutes.post('/api/user/news/read', requireAuth, MyPageController.markNewsAsRead)

// 주식 관심 종목 관리
mypageRoutes.post('/api/user/watchlist', requireAuth, MyPageController.addWatchlistStock)
mypageRoutes.get('/api/user/watchlist', requireAuth, MyPageController.getWatchlistStocks)
mypageRoutes.put('/api/user/watchlist/:stockId', requireAuth, MyPageController.updateWatchlistStock)
mypageRoutes.delete('/api/user/watchlist/:stockId', requireAuth, MyPageController.deleteWatchlistStock)

// 주식 알림 관리
mypageRoutes.post('/api/user/watchlist/alerts', requireAuth, MyPageController.addStockAlert)
mypageRoutes.get('/api/user/watchlist/alerts', requireAuth, MyPageController.getStockAlerts)
mypageRoutes.delete('/api/user/watchlist/alerts/:alertId', requireAuth, MyPageController.deleteStockAlert)

// 포트폴리오 통계
mypageRoutes.get('/api/user/watchlist/stats', requireAuth, MyPageController.getWatchlistStats)

// 게임 관련 API
mypageRoutes.post('/api/user/games/scores', requireAuth, MyPageController.saveGameScore)
mypageRoutes.get('/api/user/games/stats', requireAuth, MyPageController.getGameStats)
mypageRoutes.get('/api/user/games/history', requireAuth, MyPageController.getGameHistory)
mypageRoutes.get('/api/games/leaderboard', MyPageController.getGameLeaderboard) // Public API

// 유틸 관련 API
mypageRoutes.post('/api/user/utils/settings', requireAuth, MyPageController.saveUtilSetting)
mypageRoutes.get('/api/user/utils/settings', requireAuth, MyPageController.getUtilSettings)
mypageRoutes.post('/api/user/utils/history', requireAuth, MyPageController.saveUtilHistory)
mypageRoutes.get('/api/user/utils/history', requireAuth, MyPageController.getUtilHistory)
mypageRoutes.delete('/api/user/utils/history/:historyId', requireAuth, MyPageController.deleteUtilHistory)

export { mypageRoutes }
