import { useEffect, useRef, useState } from 'react';
import { MiniAppLayout, useAuth, usePortalMessenger } from '@faithportal/mini-app-sdk';
import axios from 'axios';
import '@faithportal/mini-app-sdk/src/mini-app.css';

import { useSudoku } from './hooks/useSudoku';
import { getDifficultyLabel, type Difficulty } from './logic/sudoku';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

function App() {
    const { user, isLoading } = useAuth();
    const { sendToPortal } = usePortalMessenger();
    const game = useSudoku();
    const [savingScore, setSavingScore] = useState(false);

    // 게임 클리어 시 점수 저장
    useEffect(() => {
        if (game.isComplete && !game.gameOverHandled.current) {
            game.gameOverHandled.current = true;

            if (!user) return;

            // 점수 = 난이도 보너스 × (1 - 실수 페널티) - 시간 기반
            const diffMultiplier = game.difficulty === 'easy' ? 1 : game.difficulty === 'medium' ? 2 : 3;
            const baseScore = 10000 * diffMultiplier;
            const timePenalty = Math.min(game.timer * 2, baseScore * 0.5);
            const mistakePenalty = game.mistakes * 500;
            const finalScore = Math.max(Math.round(baseScore - timePenalty - mistakePenalty), 100);

            setSavingScore(true);
            axios.post('/api/games/sudoku/score', {
                score: finalScore,
                metadata: {
                    difficulty: game.difficulty,
                    time: game.timer,
                    mistakes: game.mistakes
                }
            }, { withCredentials: true })
                .then(() => {
                    sendToPortal('MISSION_CLEAR');
                    const targetWindow = window.opener || (window.parent !== window ? window.parent : null);
                    if (targetWindow) {
                        targetWindow.postMessage(
                            { type: 'GAME_SCORE_UPDATED', gameId: 'sudoku', score: finalScore },
                            '*'
                        );
                    }
                })
                .catch(err => console.error('[Sudoku] Score save error:', err))
                .finally(() => setSavingScore(false));
        }
    }, [game.isComplete]);

    // 시간 포맷팅
    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500 min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <MiniAppLayout title="스도쿠">
            <div className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 overflow-y-auto flex flex-col">
                <div className="max-w-lg mx-auto px-3 py-4 flex flex-col items-center w-full">

                    {/* 헤더 */}
                    <div className="w-full text-center mb-3">
                        <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400 tracking-tighter">
                            SUDOKU
                        </h1>
                        {user ? (
                            <p className="text-slate-400 mt-1 text-xs">
                                환영합니다, <span className="text-violet-400 font-bold">{user.name}</span>
                            </p>
                        ) : (
                            <p className="text-amber-500 mt-1 text-xs italic">게스트 모드 — 로그인하면 점수 저장 가능!</p>
                        )}
                    </div>

                    {/* 난이도 선택 / 정보 바 */}
                    <div className="w-full flex items-center justify-between mb-3">
                        <div className="flex gap-1.5">
                            {DIFFICULTIES.map(d => (
                                <button
                                    key={d}
                                    onClick={() => game.startGame(d)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${game.difficulty === d && !game.isComplete && !game.isGameOver
                                            ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                        }`}
                                >
                                    {getDifficultyLabel(d)}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <span className="text-slate-400 font-mono">{formatTime(game.timer)}</span>
                            <span className="text-red-400">
                                {'❤️'.repeat(Math.max(0, 3 - game.mistakes))}
                                {'🖤'.repeat(game.mistakes)}
                            </span>
                        </div>
                    </div>

                    {/* 스도쿠 그리드 */}
                    <div className="relative mb-3">
                        <div
                            className="grid grid-cols-9 border-2 border-violet-400/50 rounded-lg overflow-hidden"
                            style={{ width: 'min(360px, calc(100vw - 32px))', aspectRatio: '1' }}
                        >
                            {game.board.map((row, r) =>
                                row.map((cell, c) => {
                                    const isFixed = game.puzzle[r][c] !== null;
                                    const isSelected = game.selectedCell?.[0] === r && game.selectedCell?.[1] === c;
                                    const isSameRow = game.selectedCell?.[0] === r;
                                    const isSameCol = game.selectedCell?.[1] === c;
                                    const isSameBox = game.selectedCell &&
                                        Math.floor(game.selectedCell[0] / 3) === Math.floor(r / 3) &&
                                        Math.floor(game.selectedCell[1] / 3) === Math.floor(c / 3);
                                    const isSameNum = cell !== null && game.selectedCell &&
                                        game.board[game.selectedCell[0]][game.selectedCell[1]] === cell;
                                    const isError = cell !== null && !isFixed && game.solution[r][c] !== cell;

                                    const borderR = (c + 1) % 3 === 0 && c < 8 ? 'border-r-2 border-r-violet-400/40' : 'border-r border-r-slate-700/50';
                                    const borderB = (r + 1) % 3 === 0 && r < 8 ? 'border-b-2 border-b-violet-400/40' : 'border-b border-b-slate-700/50';

                                    let bg = 'bg-slate-800/80';
                                    if (isSelected) bg = 'bg-violet-600/40 ring-2 ring-violet-400 ring-inset';
                                    else if (isSameNum && cell !== null) bg = 'bg-violet-900/50';
                                    else if (isSameRow || isSameCol || isSameBox) bg = 'bg-slate-700/50';

                                    let textColor = 'text-slate-200';
                                    if (isError) textColor = 'text-red-400';
                                    else if (isFixed) textColor = 'text-slate-300 font-black';
                                    else textColor = 'text-violet-300 font-bold';

                                    return (
                                        <button
                                            key={`${r}-${c}`}
                                            className={`flex items-center justify-center text-base md:text-lg transition-all duration-100 ${bg} ${borderR} ${borderB} ${textColor} ${isFixed ? 'cursor-default' : 'cursor-pointer hover:bg-violet-700/30 active:scale-95'
                                                }`}
                                            style={{ aspectRatio: '1' }}
                                            onClick={() => game.selectCell(r, c)}
                                        >
                                            {cell || ''}
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {/* 일시정지 오버레이 */}
                        {game.isPaused && !game.isComplete && !game.isGameOver && (
                            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-10">
                                <h2 className="text-2xl font-bold text-white mb-3 tracking-widest">PAUSED</h2>
                                <button onClick={game.togglePause} className="px-6 py-2 bg-violet-500 hover:bg-violet-400 text-white font-bold rounded-full transition-colors">
                                    계속하기
                                </button>
                            </div>
                        )}

                        {/* 게임 클리어 오버레이 */}
                        {game.isComplete && (
                            <div className="absolute inset-0 bg-indigo-950/95 backdrop-blur-md flex flex-col items-center justify-center rounded-lg z-20">
                                <div className="text-5xl mb-3">🎉</div>
                                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-pink-400 mb-1">CLEAR!</h2>
                                <p className="text-slate-300 text-sm mb-1">
                                    {getDifficultyLabel(game.difficulty)} · {formatTime(game.timer)} · 실수 {game.mistakes}회
                                </p>
                                {savingScore && <span className="text-emerald-400 text-xs mb-3 animate-pulse">점수 저장 중...</span>}
                                {!savingScore && user && <span className="text-emerald-400 text-xs mb-3 font-bold">점수 저장 완료! ✓</span>}
                                <div className="flex gap-2 mt-2">
                                    {DIFFICULTIES.map(d => (
                                        <button key={d} onClick={() => game.startGame(d)}
                                            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-lg transition-colors">
                                            {getDifficultyLabel(d)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 게임 오버 오버레이 */}
                        {game.isGameOver && !game.isComplete && (
                            <div className="absolute inset-0 bg-red-950/95 backdrop-blur-md flex flex-col items-center justify-center rounded-lg z-20">
                                <h2 className="text-3xl font-black text-red-400 mb-2 drop-shadow-[0_0_10px_rgba(248,113,113,0.6)]">GAME OVER</h2>
                                <p className="text-slate-300 text-sm mb-4">실수 3회로 게임이 종료되었습니다</p>
                                <div className="flex gap-2">
                                    {DIFFICULTIES.map(d => (
                                        <button key={d} onClick={() => game.startGame(d)}
                                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-lg transition-colors">
                                            {getDifficultyLabel(d)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 숫자 패드 */}
                    <div className="w-full max-w-[360px] grid grid-cols-9 gap-1.5 mb-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
                            // 해당 숫자가 보드에 몇 개 남았는지
                            const count = game.board.flat().filter(v => v === num).length;
                            const isFull = count >= 9;
                            return (
                                <button
                                    key={num}
                                    onClick={() => game.inputNumber(num)}
                                    disabled={isFull || game.isComplete || game.isGameOver}
                                    className={`py-3 rounded-lg text-lg font-bold transition-all ${isFull
                                            ? 'bg-slate-800/30 text-slate-600 cursor-not-allowed'
                                            : 'bg-slate-800 text-violet-300 hover:bg-violet-700 hover:text-white active:scale-90 shadow-lg shadow-slate-900/50'
                                        }`}
                                >
                                    {num}
                                </button>
                            );
                        })}
                    </div>

                    {/* 액션 버튼 */}
                    <div className="w-full max-w-[360px] flex gap-2">
                        <button
                            onClick={game.eraseCell}
                            disabled={game.isComplete || game.isGameOver}
                            className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-700 transition-all disabled:opacity-40"
                        >
                            ✏️ 지우기
                        </button>
                        <button
                            onClick={game.getHint}
                            disabled={game.isComplete || game.isGameOver}
                            className="flex-1 py-2.5 bg-slate-800 text-amber-400 rounded-lg text-sm font-semibold hover:bg-slate-700 transition-all disabled:opacity-40"
                        >
                            💡 힌트
                        </button>
                        <button
                            onClick={game.togglePause}
                            disabled={game.isComplete || game.isGameOver}
                            className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-700 transition-all disabled:opacity-40"
                        >
                            {game.isPaused ? '▶️ 계속' : '⏸ 일시정지'}
                        </button>
                    </div>
                </div>
            </div>
        </MiniAppLayout>
    );
}

export default App;
