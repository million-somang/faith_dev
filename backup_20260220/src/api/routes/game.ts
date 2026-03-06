import { Hono } from 'hono'
import { getDB } from '../../db/adapter'
import { requireAuth, type SessionUser } from '../../middleware/auth'
import type { Bindings, Variables } from '../../types'

const gameRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// ==================== 스도쿠 리더보드 ====================
gameRoutes.get('/api/sudoku/leaderboard/:difficulty', async (c) => {
    const DB = getDB(c)
    const difficulty = c.req.param('difficulty')

    try {
        const result = await DB.prepare(`
      SELECT 
        s.player_name,
        s.time,
        s.mistakes,
        s.created_at,
        u.email
      FROM sudoku_scores s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.difficulty = ?
      ORDER BY s.time ASC, s.mistakes ASC
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

// ==================== 스도쿠 점수 저장 ====================
gameRoutes.post('/api/sudoku/score', async (c) => {
    const DB = getDB(c)
    const { difficulty, time, mistakes } = await c.req.json()

    console.log('🎯 [스도쿠 점수 저장] API 호출됨')
    console.log('📦 [스도쿠] 받은 데이터:', { difficulty, time, mistakes })

    // 세션에서 사용자 정보 가져오기
    const cookieHeader = c.req.header('Cookie')
    console.log('🍪 [스도쿠] Cookie 헤더:', cookieHeader)

    let userId = null
    let username = 'Anonymous'

    if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=')
            acc[key] = value
            return acc
        }, {} as Record<string, string>)

        console.log('🍪 [스도쿠] 파싱된 쿠키:', Object.keys(cookies))

        const sessionId = cookies.session_id
        console.log('🔑 [스도쿠] Session ID:', sessionId ? '존재함' : '없음')

        if (sessionId) {
            try {
                // 세션에서 사용자 ID 조회
                const session = await DB.prepare(`
          SELECT user_id FROM sessions 
          WHERE session_id = ? AND expires_at > datetime('now')
        `).bind(sessionId).first() as { user_id: number } | null

                console.log('👤 [스도쿠] 세션 조회 결과:', session)

                if (session) {
                    userId = session.user_id

                    // 사용자 정보 조회
                    const user = await DB.prepare('SELECT id, email, name FROM users WHERE id = ?')
                        .bind(userId).first() as { id: number, email: string, name: string } | null

                    console.log('👤 [스도쿠] 사용자 정보:', user)

                    if (user) {
                        username = user.name || user.email || 'Anonymous'
                        console.log('✅ [스도쿠] 사용자 인증 성공:', { userId, username })
                    }
                } else {
                    console.log('❌ [스도쿠] 세션이 만료되었거나 존재하지 않음')
                }
            } catch (e) {
                console.error('❌ [스도쿠] 세션/사용자 조회 실패:', e)
            }
        } else {
            console.log('⚠️ [스도쿠] session_id 쿠키가 없음')
        }
    } else {
        console.log('⚠️ [스도쿠] Cookie 헤더가 없음')
    }

    // 로그인 안 된 경우 점수 저장 거부
    if (!userId) {
        console.log('❌ [스도쿠] 로그인되지 않음 - 점수 저장 거부')
        return c.json({
            success: false,
            message: '로그인이 필요합니다. 점수를 저장하려면 로그인해주세요.',
            requireLogin: true
        }, 401)
    }

    try {
        console.log('💾 [스도쿠] DB 저장 시작...')

        // 1. sudoku_scores 테이블에 저장 (기존)
        const sudokuResult = await DB.prepare(`
      INSERT INTO sudoku_scores (user_id, difficulty, time, mistakes, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(userId, difficulty, time, mistakes || 0).run()

        console.log('✅ [스도쿠] sudoku_scores 테이블 저장 성공')

        // 2. user_game_scores 테이블에도 저장 (마이페이지 표시용)
        const difficultyMultiplier = difficulty === 'easy' ? 1.0 : difficulty === 'medium' ? 1.5 : 2.0
        const baseScore = Math.max(0, 10000 - (time * 10) - (mistakes * 100))
        const finalScore = Math.round(baseScore * difficultyMultiplier)

        console.log('📊 [스도쿠] 점수 계산:', {
            time,
            mistakes,
            difficulty,
            difficultyMultiplier,
            baseScore,
            finalScore
        })

        // game_data에 상세 정보 저장
        const gameData = JSON.stringify({
            difficulty,
            time,
            mistakes,
            raw_score: baseScore,
            multiplier: difficultyMultiplier
        })

        const gameScoreResult = await DB.prepare(`
      INSERT INTO user_game_scores (user_id, game_type, score, game_data, played_at)
      VALUES (?, 'sudoku', ?, ?, datetime('now'))
    `).bind(userId, finalScore, gameData).run()

        console.log('✅ [스도쿠] user_game_scores 테이블 저장 성공:', {
            userId,
            score: finalScore,
            game_data: gameData
        })

        console.log('✅ 스도쿠 기록 저장 완료:', {
            difficulty,
            time,
            mistakes,
            username,
            userId,
            calculated_score: finalScore
        })

        return c.json({
            success: true,
            message: '기록이 저장되었습니다',
            score: finalScore
        })
    } catch (error: any) {
        console.error('❌ [스도쿠] 기록 저장 오류:', error)
        return c.json({
            success: false,
            message: '기록 저장 중 오류가 발생했습니다: ' + error.message
        }, 500)
    }
})

// ==================== 2048 점수 저장 ====================
gameRoutes.post('/api/2048/score', requireAuth, async (c) => {
    const DB = getDB(c)
    const user = c.get('user') as SessionUser
    const { score, max_tile } = await c.req.json()

    console.log('🎮 [2048] 점수 저장 요청:', { user_id: user.id, score, max_tile })

    try {
        // 1. game2048_scores 테이블에 저장 (리더보드용)
        await DB.prepare(`
      INSERT INTO game2048_scores (user_id, score, max_tile, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).bind(user.id, score, max_tile).run()

        // 2. user_game_scores 테이블에도 저장 (마이페이지용)
        const gameData = JSON.stringify({ max_tile: max_tile || 0 })
        await DB.prepare(`
      INSERT INTO user_game_scores (user_id, game_type, score, game_data, played_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(user.id, '2048', score, gameData).run()

        console.log('✅ [2048] 점수 저장 완료')
        return c.json({
            success: true,
            message: '기록이 저장되었습니다'
        })
    } catch (error: any) {
        console.error('❌ [2048] 점수 저장 오류:', error)
        return c.json({
            success: false,
            message: '기록 저장 중 오류가 발생했습니다'
        }, 500)
    }
})

// 2048 리더보드
gameRoutes.get('/api/2048/leaderboard', async (c) => {
    const DB = getDB(c)

    try {
        const result = await DB.prepare(`
      SELECT 
        g.id,
        g.score,
        g.max_tile,
        g.created_at,
        u.email
      FROM game2048_scores g
      LEFT JOIN users u ON g.user_id = u.id
      ORDER BY g.score DESC, g.created_at ASC
      LIMIT 50
    `).all()

        return c.json({
            success: true,
            scores: result.results || []
        })
    } catch (error: any) {
        console.error('2048 리더보드 조회 오류:', error)
        return c.json({
            success: false,
            message: '리더보드 조회 중 오류가 발생했습니다',
            scores: []
        }, 500)
    }
})

// ==================== 지뢰찾기 점수 저장 ====================
gameRoutes.post('/api/minesweeper/score', async (c) => {
    const DB = getDB(c)
    const { difficulty, time } = await c.req.json()

    // 쿠키에서 사용자 정보 가져오기
    const cookieHeader = c.req.header('Cookie')
    let userId = null
    let sessionId = null

    console.log('🎮 [지뢰찾기] 점수 저장 요청:', { difficulty, time })
    console.log('🍪 [지뢰찾기] 쿠키 헤더:', cookieHeader)

    if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=')
            acc[key] = value
            return acc
        }, {} as Record<string, string>)

        sessionId = cookies.session_id
        console.log('🔑 [지뢰찾기] 세션 ID:', sessionId)
    }

    // 세션에서 사용자 ID 조회
    if (sessionId) {
        const session = await DB.prepare(`
      SELECT user_id FROM sessions WHERE session_id = ? AND expires_at > datetime('now')
    `).bind(sessionId).first() as any

        if (session) {
            userId = session.user_id
            console.log('✅ [지뢰찾기] 사용자 인증 성공:', userId)
        } else {
            console.warn('⚠️ [지뢰찾기] 세션 없음 또는 만료')
        }
    }

    if (!userId) {
        console.warn('⚠️ [지뢰찾기] 로그인 필요')
        return c.json({
            success: false,
            message: '로그인이 필요합니다. 점수를 저장하려면 로그인해주세요.',
            requireLogin: true
        }, 401)
    }

    try {
        // 1. minesweeper_scores 테이블에 저장 (리더보드용)
        await DB.prepare(`
      INSERT INTO minesweeper_scores (user_id, difficulty, time, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).bind(userId, difficulty, time).run()

        // 2. user_game_scores 테이블에도 저장 (마이페이지용)
        const score = Math.max(0, 10000 - (time * 10))
        const gameData = JSON.stringify({ difficulty, time })
        await DB.prepare(`
      INSERT INTO user_game_scores (user_id, game_type, score, game_data, played_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(userId, 'minesweeper', score, gameData).run()

        console.log('✅ [지뢰찾기] 점수 저장 완료:', { userId, difficulty, time, score })
        return c.json({
            success: true,
            message: '기록이 저장되었습니다',
            score
        })
    } catch (error: any) {
        console.error('❌ [지뢰찾기] 점수 저장 오류:', error)
        return c.json({
            success: false,
            message: '기록 저장 중 오류가 발생했습니다: ' + error.message
        }, 500)
    }
})

// 지뢰찾기 리더보드
gameRoutes.get('/api/minesweeper/leaderboard/:difficulty', async (c) => {
    const DB = getDB(c)
    const difficulty = c.req.param('difficulty')

    try {
        const result = await DB.prepare(`
      SELECT 
        m.id,
        m.time,
        m.created_at,
        u.email
      FROM minesweeper_scores m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.difficulty = ?
      ORDER BY m.time ASC
      LIMIT 50
    `).bind(difficulty).all()

        return c.json({
            success: true,
            scores: result.results || []
        })
    } catch (error: any) {
        console.error('지뢰찾기 리더보드 조회 오류:', error)
        return c.json({
            success: false,
            message: '리더보드 조회 중 오류가 발생했습니다',
            scores: []
        }, 500)
    }
})

// ==================== 테트리스 점수 저장 ====================
gameRoutes.post('/api/tetris/score', async (c) => {
    const DB = getDB(c)
    const { score, lines, level } = await c.req.json()

    // 세션에서 사용자 정보 가져오기
    const cookieHeader = c.req.header('Cookie')
    let userId = null

    console.log('🎮 [테트리스] 점수 저장 요청:', { score, lines, level })
    console.log('🍪 [테트리스] Cookie 헤더:', cookieHeader)

    if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=')
            acc[key] = value
            return acc
        }, {} as Record<string, string>)

        const sessionId = cookies.session_id
        console.log('🔑 [테트리스] Session ID:', sessionId ? '존재함' : '없음')

        if (sessionId) {
            try {
                // 세션에서 사용자 ID 조회
                const session = await DB.prepare(`
          SELECT user_id FROM sessions 
          WHERE session_id = ? AND expires_at > datetime('now')
        `).bind(sessionId).first() as { user_id: number } | null

                console.log('👤 [테트리스] 세션 조회 결과:', session)

                if (session) {
                    userId = session.user_id
                    console.log('✅ [테트리스] 사용자 인증 성공:', userId)
                } else {
                    console.log('❌ [테트리스] 세션이 만료되었거나 존재하지 않음')
                }
            } catch (e) {
                console.error('❌ [테트리스] 세션 조회 실패:', e)
            }
        }
    }

    // 로그인 안 된 경우 점수 저장 거부
    if (!userId) {
        console.log('❌ [테트리스] 로그인되지 않음 - 점수 저장 거부')
        return c.json({
            success: false,
            message: '로그인이 필요합니다. 점수를 저장하려면 로그인해주세요.',
            requireLogin: true
        }, 401)
    }

    if (score === undefined) {
        return c.json({ success: false, message: '유효하지 않은 데이터입니다.' }, 400)
    }

    try {
        console.log('💾 [테트리스] DB 저장 시작...')

        // 1. tetris_scores 테이블에 저장 (리더보드용)
        await DB.prepare(
            'INSERT INTO tetris_scores (user_id, score) VALUES (?, ?)'
        ).bind(userId, score).run()

        console.log('✅ [테트리스] tetris_scores 테이블 저장 성공')

        // 2. user_game_scores 테이블에도 저장 (마이페이지용)
        const gameData = JSON.stringify({ lines: lines || 0, level: level || 1 })
        await DB.prepare(`
      INSERT INTO user_game_scores (user_id, game_type, score, game_data, played_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(userId, 'tetris', score, gameData).run()

        console.log('✅ [테트리스] user_game_scores 테이블 저장 성공')
        return c.json({ success: true, message: '기록이 저장되었습니다', score })
    } catch (error) {
        console.error('❌ [테트리스] 점수 저장 오류:', error)
        return c.json({ success: false, message: '점수 저장 중 오류가 발생했습니다.' }, 500)
    }
})

// ==================== 테트리스 최고 점수 조회 ====================
gameRoutes.get('/api/tetris/highscore/:userId', async (c) => {
    try {
        const userId = c.req.param('userId')
        const DB = getDB(c)

        const highScore = await DB.prepare(
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

// ==================== 테트리스 리더보드 ====================
gameRoutes.get('/api/tetris/leaderboard', async (c) => {
    try {
        const DB = getDB(c)
        const { results } = await DB.prepare(`
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

// ==================== 스도쿠 최고 기록 조회 ====================
gameRoutes.get('/api/sudoku/besttime/:userId/:difficulty', async (c) => {
    try {
        const userId = c.req.param('userId')
        const difficulty = c.req.param('difficulty')
        const DB = getDB(c)

        const bestTime = await DB.prepare(
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

// ==================== 2048 추가 점수 저장 (game2048) ====================
gameRoutes.post('/api/game2048/score', requireAuth, async (c) => {
    const DB = getDB(c)
    const user = c.get('user') as SessionUser
    const { score, highest_tile, moves } = await c.req.json()

    try {
        const result = await DB.prepare(`
      INSERT INTO game2048_scores (score, highest_tile, moves, player_name, user_id, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(score, highest_tile, moves, user.name, user.id).run()

        console.log('✅ 2048 기록 저장 성공:', { score, highest_tile, moves, username: user.name, userId: user.id })

        return c.json({
            success: true,
            message: '기록이 저장되었습니다'
        })
    } catch (error: any) {
        console.error('❌ 2048 기록 저장 오류:', error)
        return c.json({
            success: false,
            message: '기록 저장 중 오류가 발생했습니다: ' + error.message
        }, 500)
    }
})

// 2048 리더보드 (game2048)
gameRoutes.get('/api/game2048/leaderboard', async (c) => {
    const DB = getDB(c)

    try {
        const result = await DB.prepare(`
      SELECT 
        g.score,
        g.highest_tile,
        g.moves,
        g.created_at,
        u.email
      FROM game2048_scores g
      LEFT JOIN users u ON g.user_id = u.id
      ORDER BY g.score DESC, g.created_at ASC
      LIMIT 10
    `).all()

        return c.json({
            success: true,
            scores: result.results || []
        })
    } catch (error) {
        console.error('2048 리더보드 조회 오류:', error)
        return c.json({
            success: false,
            message: '리더보드 조회 중 오류가 발생했습니다',
            scores: []
        })
    }
})

export { gameRoutes }
