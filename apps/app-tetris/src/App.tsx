import { useEffect, useRef, useState } from 'react';
import { MiniAppLayout, useAuth, usePortalMessenger } from '@faithportal/mini-app-sdk';
import axios from 'axios';
import '@faithportal/mini-app-sdk/src/mini-app.css';

import { useTetris } from './hooks/useTetris';
import GameBoard from './components/GameBoard';
import InfoPanel from './components/InfoPanel';
import MobileControls from './components/MobileControls';
import Leaderboard from './components/Leaderboard';
import NextPiecePreview from './components/NextPiecePreview';

function App() {
  const { user, isLoading } = useAuth();
  const { sendToPortal } = usePortalMessenger();

  const {
    board, currentPiece, nextPieceType, score, level, lines,
    isGameOver, isPaused,
    moveLeft, moveRight, moveDown, rotatePiece, dropPiece,
    startGame, togglePause
  } = useTetris();

  const [savingScore, setSavingScore] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [refreshBoardToggle, setRefreshBoardToggle] = useState(false);
  const gameOverHandled = useRef(false);

  // 모바일 디바이스 여부 판별 (단순 UA 체크)
  const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Initialize highest score if user exists
  useEffect(() => {
    if (user) {
      axios.get(`/api/tetris/highscore/${user.id}`)
        .then(res => {
          if (res.data.success) {
            setHighScore(res.data.highScore || 0);
          }
        })
        .catch(err => console.error('Failed to load highscore:', err));
    }
  }, [user]);

  // Handle Game Over
  useEffect(() => {
    if (isGameOver && !gameOverHandled.current) {
      gameOverHandled.current = true;
      if (!user) {
        console.warn("[Tetris] User is guest or auth failed. Score will not be saved.");
      } else if (score >= 0) {
        setSavingScore(true);
        axios.post('/api/tetris/score', {
          score,
          lines,
          level
        }, { withCredentials: true })
          .then(res => {
            console.log("[Tetris] Score saved successfully:", res.data);
            if (score > highScore) {
              setHighScore(score);
            }
            // 리더보드 갱신 트리거
            setRefreshBoardToggle(prev => !prev);
            // Notify portal to update user points possibly
            sendToPortal('MISSION_CLEAR');

            // 팝업 창 환경 등: window.opener (새 탭/팝업의 부모) 또는 window.parent(iframe)
            const targetWindow = window.opener || (window.parent !== window ? window.parent : null);
            if (targetWindow) {
              console.log("[Tetris] Sending message to parent/opener window to update leaderboard");
              // 범용 메시지 (새 게임 추가 시에도 동일한 타입 사용)
              targetWindow.postMessage(
                { type: 'GAME_SCORE_UPDATED', gameId: 'tetris', score: score },
                '*'
              );
              // 하위 호환용 기존 메시지도 함께 전송
              targetWindow.postMessage(
                { type: 'TETRIS_SCORE_UPDATED', score: score },
                '*'
              );
            }
          })
          .catch(err => console.error("[Tetris] Score save error:", err.response?.data || err.message))
          .finally(() => setSavingScore(false));
      }
    } else if (!isGameOver) {
      gameOverHandled.current = false;
    }
  }, [isGameOver, score, lines, level, user, highScore, sendToPortal]);

  // Key Bindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver || isPaused) {
        // Prevent default only if it's our game keys inside game
        return;
      }

      switch (e.code) {
        case 'ArrowLeft':
          e.preventDefault();
          moveLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveRight();
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveDown();
          break;
        case 'ArrowUp':
          e.preventDefault();
          rotatePiece();
          break;
        case 'Space':
          e.preventDefault();
          dropPiece();
          break;
        case 'Escape':
        case 'KeyP':
          e.preventDefault();
          togglePause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveLeft, moveRight, moveDown, rotatePiece, dropPiece, togglePause, isGameOver, isPaused]);

  if (isLoading) return <div className="p-8 text-center text-slate-500 min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <MiniAppLayout title="레트로 테트리스">
      <div className="min-h-[calc(100vh-56px)] bg-slate-900 overflow-y-auto overflow-x-hidden flex flex-col">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col items-center w-full">

          {/* Header / Title */}
          <div className="w-full text-center mb-3">
            <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 drop-shadow-sm tracking-tighter">
              TETRIS
            </h1>
            {user ? (
              <p className="text-slate-400 mt-1 text-xs md:text-sm">Welcome, <span className="text-emerald-400 font-bold">{user.name}</span> | High Score: {highScore.toLocaleString()}</p>
            ) : (
              <p className="text-amber-500 mt-1 text-[10px] md:text-sm italic">You are playing as a guest. Log in to save scores!</p>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-4 lg:gap-12 justify-center items-center lg:items-start w-full">

            {/* Left: Info Panel */}
            <div className="hidden lg:block">
              <InfoPanel
                score={score}
                level={level}
                lines={lines}
                nextPieceType={nextPieceType}
                isPaused={isPaused}
                isGameOver={isGameOver}
                onPause={togglePause}
                onRestart={startGame}
              />
            </div>

            {/* Center: Game Board Area */}
            <div className="relative flex flex-col items-center">

              {/* Top Info for Mobile */}
              <div className="lg:hidden flex items-start justify-between w-full max-w-[240px] mb-3 text-white gap-2">
                <div className="flex flex-col gap-2 flex-1">
                  <div className="bg-slate-800 px-3 py-1 flex-1 rounded-lg border border-slate-700 flex flex-col justify-center">
                    <span className="text-[10px] text-slate-400 leading-none mb-1">SCORE</span>
                    <span className="font-mono text-emerald-400 font-bold leading-none">{score}</span>
                  </div>
                  <div className="bg-slate-800 px-3 py-1 flex-1 rounded-lg border border-slate-700 flex flex-col justify-center">
                    <span className="text-[10px] text-slate-400 leading-none mb-1">LEVEL</span>
                    <span className="font-mono text-amber-400 font-bold leading-none">{level}</span>
                  </div>
                </div>
                <div className="bg-slate-800 p-2 rounded-lg border border-slate-700 flex flex-col items-center justify-center min-w-[70px] inner-shadow">
                  <span className="text-[10px] text-slate-400 font-bold tracking-wider mb-2">NEXT</span>
                  <NextPiecePreview type={nextPieceType} blockSize="w-3.5 h-3.5" borderWidth="border-[2px]" />
                </div>
              </div>

              {/* The Board */}
              <div className="relative">
                <GameBoard board={board} currentPiece={currentPiece} />

                {/* Pause/Game Over Overlay */}
                {isPaused && !isGameOver && (
                  <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl border-4 border-transparent z-10 transition-all">
                    <h2 className="text-3xl font-bold text-white mb-2 tracking-widest">PAUSED</h2>
                    <button onClick={togglePause} className="mt-4 px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-full transition-colors">
                      RESUME
                    </button>
                  </div>
                )}

                {isGameOver && (
                  <div className="absolute inset-0 bg-red-950/90 backdrop-blur-md flex flex-col items-center justify-center rounded-xl border-4 border-red-500/50 z-20 transition-all">
                    <h2 className="text-4xl font-black text-red-500 mb-2 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">GAME OVER</h2>
                    <p className="text-slate-300 font-mono text-lg mb-6">FINAL SCORE: <span className="text-white">{score}</span></p>

                    {savingScore && <span className="text-emerald-400 text-sm mb-4 animate-pulse">Saving score...</span>}
                    {!savingScore && score >= 0 && user && <span className="text-emerald-400 text-sm mb-4 font-bold">Score Saved! ✓</span>}

                    <button onClick={startGame} className="px-8 py-3 bg-white text-red-600 hover:bg-slate-200 font-black rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all">
                      PLAY AGAIN
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Controls (Only on actual mobile devices) */}
              {isMobileDevice && (
                <MobileControls
                  onMoveLeft={moveLeft}
                  onMoveRight={moveRight}
                  onMoveDown={moveDown}
                  onRotate={rotatePiece}
                  onDrop={dropPiece}
                  onPause={togglePause}
                  onRestart={startGame}
                  isPaused={isPaused}
                  isGameOver={isGameOver}
                />
              )}
            </div>

            {/* Right: Leaderboard */}
            <div className="hidden lg:block w-full lg:w-auto">
              <Leaderboard refreshTrigger={refreshBoardToggle} />
            </div>
          </div>
        </div>
      </div>
    </MiniAppLayout>
  );
}

export default App;
