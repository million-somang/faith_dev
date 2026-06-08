import { useEffect, useRef, useMemo } from 'react';
import { PageSEO } from '../components/PageSEO';
import { Header } from '@faithportal/ui';
import { useAuth } from '../context/AuthContext';
import { useGamePlay } from '../hooks/useGamePlay';
import { useTetris } from '../components/tetris/useTetris';
import GameBoard from '../components/tetris/GameBoard';
import InfoPanel from '../components/tetris/InfoPanel';
import MobileControls from '../components/tetris/MobileControls';
import Leaderboard from '../components/tetris/Leaderboard';
import NextPiecePreview from '../components/tetris/NextPiecePreview';

export default function GamePlayPage() {
    const { user, logout } = useAuth();
    
    // User type guard / transformation for Hook mapping (useMemo로 감싸 참조 불일치 무한 루프 차단)
    const typedUser = useMemo(() => {
        return user ? { id: String(user.id), email: user.email, name: user.name } : null;
    }, [user]);

    const {
        highScore,
        savingScore,
        refreshBoardToggle,
        handleBack,
        handleGameOver
    } = useGamePlay(typedUser);

    const {
        board, currentPiece, nextPieceType, score, level, lines,
        isGameOver, isPaused,
        moveLeft, moveRight, moveDown, rotatePiece, dropPiece,
        startGame, togglePause
    } = useTetris();

    const gameOverHandled = useRef(false);

    // 모바일 디바이스 여부 판별
    const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // Handle Game Over
    useEffect(() => {
        if (isGameOver && !gameOverHandled.current) {
            gameOverHandled.current = true;
            handleGameOver(score, lines, level);
        } else if (!isGameOver) {
            gameOverHandled.current = false;
        }
    }, [isGameOver, score, lines, level, handleGameOver]);

    // Key Bindings
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isGameOver || isPaused) return;

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

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Game",
        "name": "클래식 테트리스",
        "description": "블록을 쌓아 줄을 제거하고 높은 점수를 기록하는 클래식 테트리스 게임입니다.",
        "url": "https://faithlink.my/game/play/tetris",
        "genre": "Puzzle"
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
            <PageSEO
                title="클래식 테트리스 플레이"
                description="FaithLink 포탈에서 클래식 테트리스 게임을 새 페이지에서 쾌적하게 즐겨보세요."
                path="/game/play/tetris"
                jsonLd={jsonLd}
            />
            <Header user={user} onLogout={logout} />

            <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full flex flex-col relative">
                {/* Top Title Bar */}
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                            <i className="fas fa-th text-white text-lg"></i>
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none">클래식 테트리스</h1>
                            {user ? (
                                <p className="text-slate-400 text-[10px] md:text-xs mt-1 leading-none">
                                    최고 점수: <span className="text-emerald-500 font-bold">{highScore.toLocaleString()}</span> 점
                                </p>
                            ) : (
                                <p className="text-amber-500 text-[10px] md:text-xs mt-1 leading-none italic">
                                    비회원으로 플레이 중입니다. 로그인 시 랭킹에 기록됩니다.
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all font-bold text-sm shadow-sm"
                    >
                        <i className="fas fa-arrow-left"></i> 목록으로
                    </button>
                </div>

                {/* Game Container Wrapper */}
                <div className="flex-1 flex items-center justify-center w-full py-4">
                    {/* Game Container */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xl flex flex-col items-center justify-center relative shrink-0">
                            <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 justify-center items-center lg:items-start w-full relative z-10">
                                
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
                                    <div className="lg:hidden flex items-start justify-between w-full max-w-[240px] mb-3 text-slate-800 gap-2">
                                        <div className="flex flex-col gap-2 flex-1">
                                            <div className="bg-slate-50 px-3 py-1 flex-1 rounded-lg border border-slate-200 flex flex-col justify-center shadow-sm">
                                                <span className="text-[10px] text-slate-500 leading-none mb-1 font-bold">SCORE</span>
                                                <span className="font-mono text-emerald-600 font-bold leading-none">{score}</span>
                                            </div>
                                            <div className="bg-slate-50 px-3 py-1 flex-1 rounded-lg border border-slate-200 flex flex-col justify-center shadow-sm">
                                                <span className="text-[10px] text-slate-500 leading-none mb-1 font-bold">LEVEL</span>
                                                <span className="font-mono text-amber-600 font-bold leading-none">{level}</span>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex flex-col items-center justify-center min-w-[70px] shadow-sm">
                                            <span className="text-[10px] text-slate-500 font-bold tracking-wider mb-2">NEXT</span>
                                            <div className="w-10 h-10 flex items-center justify-center bg-slate-900 rounded-md p-1 shadow-inner">
                                                <NextPiecePreview type={nextPieceType} blockSize="w-2.5 h-2.5" borderWidth="border-[1.5px]" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* The Board */}
                                    <div className="relative">
                                        <GameBoard board={board} currentPiece={currentPiece} />

                                        {/* Pause Overlay */}
                                        {isPaused && !isGameOver && (
                                            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl border-4 border-transparent z-10 transition-all">
                                                <h2 className="text-3xl font-bold text-white mb-2 tracking-widest">일시정지</h2>
                                                <button onClick={togglePause} className="mt-4 px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-full transition-colors">
                                                    이어하기
                                                </button>
                                            </div>
                                        )}

                                        {/* Game Over Overlay */}
                                        {isGameOver && (
                                            <div className="absolute inset-0 bg-red-950/90 backdrop-blur-md flex flex-col items-center justify-center rounded-xl border-4 border-red-500/50 z-20 transition-all">
                                                <h2 className="text-4xl font-black text-red-500 mb-2 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">게임 오버</h2>
                                                <p className="text-slate-300 font-mono text-lg mb-6">최종 점수: <span className="text-white">{score}</span></p>

                                                {savingScore && <span className="text-emerald-400 text-sm mb-4 animate-pulse">점수 저장 중...</span>}
                                                {!savingScore && score >= 0 && user && <span className="text-emerald-400 text-sm mb-4 font-bold">점수 저장 완료! ✓</span>}

                                                <button onClick={startGame} className="px-8 py-3 bg-white text-red-600 hover:bg-slate-200 font-black rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all">
                                                    다시 시작
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Mobile Controls */}
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
            </main>
            <footer className="text-center py-2 text-[10px] text-slate-400 shrink-0">
                © 2026 FaithPortal. All rights reserved.
            </footer>
        </div>
    );
}
