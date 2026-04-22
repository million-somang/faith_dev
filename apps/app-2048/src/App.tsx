import { useEffect, useRef, useCallback } from 'react';
import { MiniAppLayout, useAuth, usePortalMessenger } from '@faithportal/mini-app-sdk';
import { useGame2048, getMaxTile } from './hooks/useGame2048';
import GameBoard from './components/GameBoard';
import ScoreDisplay from './components/ScoreDisplay';
import GameOverModal from './components/GameOverModal';
import WinModal from './components/WinModal';
import axios from 'axios';

function App() {
    const { user, isLoading } = useAuth();
    const { sendToPortal } = usePortalMessenger();
    const {
        grid,
        score,
        best,
        undosLeft,
        hasWon,
        isGameOver,
        move,
        undo,
        newGame,
        dismissWin,
        dismissGameOver,
    } = useGame2048();

    const touchStartRef = useRef({ x: 0, y: 0 });

    // 키보드 이벤트
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    move('left');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    move('right');
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    move('up');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    move('down');
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [move]);

    // 터치/스와이프 이벤트
    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            touchStartRef.current = {
                x: e.changedTouches[0].screenX,
                y: e.changedTouches[0].screenY,
            };
        };

        const handleTouchEnd = (e: TouchEvent) => {
            const dx = e.changedTouches[0].screenX - touchStartRef.current.x;
            const dy = e.changedTouches[0].screenY - touchStartRef.current.y;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);

            if (Math.max(absDx, absDy) < 30) return;

            if (absDx > absDy) {
                move(dx > 0 ? 'right' : 'left');
            } else {
                move(dy > 0 ? 'down' : 'up');
            }
        };

        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [move]);

    // 게임 오버 시 점수 저장
    const saveScore = useCallback(async (finalScore: number) => {
        if (!user) return;
        try {
            await axios.post('/api/games/2048/score', {
                score: finalScore,
                metadata: { max_tile: getMaxTile(grid) },
            }, {
                withCredentials: true,
            });
            // 포털에 점수 업데이트 알림
            sendToPortal('MISSION_CLEAR');
            // 부모 윈도우에 점수 갱신 알림
            const targetWindow = window.opener || (window.parent !== window ? window.parent : null);
            if (targetWindow) {
                targetWindow.postMessage(
                    { type: 'GAME_SCORE_UPDATED', gameId: '2048', score: finalScore },
                    '*'
                );
            }
        } catch (error) {
            console.error('점수 저장 실패:', error);
        }
    }, [user, grid, sendToPortal]);

    useEffect(() => {
        if (isGameOver) {
            saveScore(score);
        }
    }, [isGameOver, score, saveScore]);

    if (isLoading) {
        return (
            <MiniAppLayout title="2048 챌린지">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center text-slate-500">
                        <div className="animate-spin text-4xl mb-3">🎲</div>
                        <p>로딩 중...</p>
                    </div>
                </div>
            </MiniAppLayout>
        );
    }

    return (
        <MiniAppLayout title="2048 챌린지">
            <div
                className="flex flex-col items-center px-4 py-4 min-h-full"
                style={{ background: '#faf8ef' }}
            >
                <div className="w-full max-w-[420px]">
                    {/* 헤더 영역 */}
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-4xl sm:text-5xl font-bold text-[#776e65] tracking-tight">
                            2048
                        </h1>
                        <ScoreDisplay score={score} best={best} />
                    </div>

                    {/* 컨트롤 영역 */}
                    <div className="flex gap-3 mb-4">
                        <button
                            onClick={newGame}
                            className="flex-1 bg-[#8f7a66] text-white py-3 rounded-lg font-bold text-base hover:bg-[#9f8a76] transition-colors cursor-pointer active:scale-95"
                        >
                            새 게임
                        </button>
                        <button
                            onClick={undo}
                            disabled={undosLeft === 3}
                            className="flex-1 bg-[#8f7a66] text-white py-3 rounded-lg font-bold text-base hover:bg-[#9f8a76] transition-colors disabled:bg-[#cdc1b4] disabled:cursor-not-allowed cursor-pointer active:scale-95"
                        >
                            Undo ({undosLeft})
                        </button>
                    </div>

                    {/* 게임 보드 */}
                    <GameBoard grid={grid} />

                    {/* 팁 */}
                    <p className="text-center mt-4 text-[#776e65] text-sm">
                        <strong>Tip:</strong> 같은 숫자를 합쳐보세요! 방향키 또는 스와이프로 조작합니다.
                    </p>

                    {/* 로그인 안내 */}
                    {!user && (
                        <p className="text-center mt-2 text-amber-600 text-xs bg-amber-50 py-2 px-3 rounded-lg">
                            ⚡ 로그인하면 점수가 리더보드에 기록됩니다!
                        </p>
                    )}
                </div>
            </div>

            {/* 모달 */}
            <GameOverModal
                isOpen={isGameOver}
                score={score}
                maxTile={getMaxTile(grid)}
                onClose={dismissGameOver}
                onNewGame={newGame}
            />
            <WinModal
                isOpen={hasWon}
                onContinue={dismissWin}
                onNewGame={newGame}
            />
        </MiniAppLayout>
    );
}

export default App;
