import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTetris } from '../components/tetris/useTetris';
import GameBoard from '../components/tetris/GameBoard';
import NextPiecePreview from '../components/tetris/NextPiecePreview';
import MobileControls from '../components/tetris/MobileControls';
import { getStoredBattleRecord, saveStoredBattleRecord, BattleRecord } from '../components/lounge/LoungeBattleModal';

export default function LoungeBattlePopupPage() {
    const [searchParams] = useSearchParams();
    const gameTag = searchParams.get('tag') || '#테트리스';
    const targetScore = parseInt(searchParams.get('target') || '12400', 10);
    const challengerName = searchParams.get('challenger') || '베라 프렌즈';

    const {
        board, currentPiece, nextPieceType, score, level, lines,
        isGameOver, isPaused,
        moveLeft, moveRight, moveDown, rotatePiece, dropPiece,
        startGame, togglePause
    } = useTetris();

    const [record, setRecord] = useState<BattleRecord>(getStoredBattleRecord);
    const gameOverHandled = useRef(false);

    useEffect(() => {
        gameOverHandled.current = false;
        setRecord(getStoredBattleRecord());
        startGame();
    }, [startGame]);

    // 게임 오버 시 승패 처리 및 전적 기록
    useEffect(() => {
        if (isGameOver && !gameOverHandled.current) {
            gameOverHandled.current = true;
            const isWin = score >= targetScore;

            const prev = getStoredBattleRecord();
            const updated: BattleRecord = {
                wins: isWin ? prev.wins + 1 : prev.wins,
                losses: isWin ? prev.losses : prev.losses + 1,
                highScore: Math.max(prev.highScore, score),
                lastScore: score,
                lastPlayedAt: new Date().toISOString()
            };

            saveStoredBattleRecord(updated);
            setRecord(updated);
        } else if (!isGameOver) {
            gameOverHandled.current = false;
        }
    }, [isGameOver, score, targetScore]);

    // 키보드 조작 이벤트
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
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isGameOver, isPaused, moveLeft, moveRight, moveDown, rotatePiece, dropPiece, togglePause]);

    const winRate = record.wins + record.losses > 0
        ? Math.round((record.wins / (record.wins + record.losses)) * 100)
        : 0;

    const progressRatio = Math.min(100, Math.round((score / (targetScore || 1)) * 100));
    const isWin = score >= targetScore;

    const handleShareClick = () => {
        const resultData = {
            gameTag,
            myScore: score,
            targetScore,
            isWin,
            level,
            lines
        };

        // 1. opener 창으로 postMessage 전송
        if (window.opener && !window.opener.closed) {
            try {
                window.opener.postMessage({
                    type: 'LOUNGE_BATTLE_SHARE',
                    result: resultData
                }, '*');
            } catch {
                // ignore
            }
        }

        // 2. localStorage에 직접 새 피드 포스트 prepend 저장 (안전성 보장)
        try {
            const savedPosts = localStorage.getItem('vera_lounge_posts');
            const postsList = savedPosts ? JSON.parse(savedPosts) : [];
            const savedHandle = localStorage.getItem('vera_lounge_handle') || '@user_1234';
            const savedName = localStorage.getItem('vera_lounge_name') || '베라 프렌즈';

            const outcomeText = isWin ? '승리 달성! 🏆' : '아쉬운 패배 😢';
            const content = `[${gameTag} 배틀 결과] ${score.toLocaleString()}P로 ${outcomeText} (레벨 ${level}, ${lines}줄 클리어) 나를 꺾을 랭커 도전해봐! 🎮`;

            const newPost = {
                id: `post-${Date.now()}`,
                author: {
                    name: savedName,
                    handle: savedHandle,
                    avatar: '🦊',
                    badge: isWin ? '🎮 배틀승리자' : undefined
                },
                content,
                createdAt: '방금 전',
                likes: 1,
                commentsCount: 0,
                isMine: true
            };

            localStorage.setItem('vera_lounge_posts', JSON.stringify([newPost, ...postsList]));
        } catch {
            // ignore
        }

        alert(`배틀 결과가 라운지 피드에 성공적으로 등록되었습니다! 🚀 (${score.toLocaleString()}P)`);
        window.close();
    };

    const handleRestart = () => {
        gameOverHandled.current = false;
        startGame();
    };

    return (
        <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between select-none font-sans overflow-x-hidden p-3 sm:p-4">
            
            {/* 1. 상단 팝업 타이틀바 */}
            <div className="w-full max-w-md mx-auto bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 rounded-2xl px-4 py-3 shadow-lg flex items-center justify-between text-white mb-2.5">
                <div className="flex items-center gap-2">
                    <span className="text-lg">⚔️</span>
                    <div>
                        <h1 className="text-xs font-black tracking-tight">라운지 1:1 실시간 게임 배틀</h1>
                        <p className="text-[10px] text-violet-200 font-bold">
                            내 전적: {record.wins}승 {record.losses}패 (승률 {winRate}%) · 최고 {record.highScore.toLocaleString()}P
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => window.close()}
                    className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs font-black transition-all cursor-pointer"
                    title="창 닫기"
                >
                    ✕
                </button>
            </div>

            {/* 2. VS 배틀 상태바 (상대방 목표 vs 내 점수 게이지) */}
            <div className="w-full max-w-md mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-md mb-2.5">
                <div className="flex justify-between items-center text-xs mb-1.5 font-black">
                    <div className="flex items-center gap-1 text-violet-300">
                        <span>👤 나 (도전자)</span>
                        <span className="text-sm font-mono text-white bg-violet-600/80 px-2 py-0.5 rounded-lg">
                            {score.toLocaleString()}P
                        </span>
                    </div>
                    <span className="text-[10px] text-amber-400 font-black px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/40">
                        VS
                    </span>
                    <div className="flex items-center gap-1 text-slate-300">
                        <span>👑 {challengerName}</span>
                        <span className="text-sm font-mono text-slate-200 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                            {targetScore.toLocaleString()}P
                        </span>
                    </div>
                </div>

                {/* 프로그레스 바 */}
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden relative shadow-inner">
                    <div
                        className={`h-full transition-all duration-300 ${
                            isWin
                                ? 'bg-gradient-to-r from-emerald-400 to-teal-400 animate-pulse'
                                : 'bg-gradient-to-r from-violet-500 to-indigo-500'
                        }`}
                        style={{ width: `${progressRatio}%` }}
                    />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                    <span>목표 달성률: {progressRatio}%</span>
                    <span>{isWin ? '🔥 목표 돌파! 승리 확정 상태' : `이길 때까지 ${(targetScore - score).toLocaleString()}P 남음`}</span>
                </div>
            </div>

            {/* 3. 게임 보드 영역 */}
            <div className="w-full max-w-md mx-auto flex-1 flex flex-col items-center justify-center">
                
                {/* 상단 미니 정보 칩 */}
                <div className="w-[280px] flex justify-between items-center bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl mb-2 text-xs">
                    <div className="flex gap-3 text-center">
                        <div>
                            <span className="text-[9px] text-slate-400 block font-bold">레벨</span>
                            <span className="font-mono font-black text-amber-400">LV.{level}</span>
                        </div>
                        <div>
                            <span className="text-[9px] text-slate-400 block font-bold">라인</span>
                            <span className="font-mono font-black text-sky-400">{lines}줄</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-slate-400 font-bold">NEXT</span>
                        <div className="w-7 h-7 flex items-center justify-center bg-slate-950 rounded border border-slate-800">
                            <NextPiecePreview type={nextPieceType} blockSize="w-1.5 h-1.5" borderWidth="border-[1px]" />
                        </div>
                    </div>
                </div>

                {/* 테트리스 보드 */}
                <div className="relative">
                    <GameBoard board={board} currentPiece={currentPiece} />

                    {/* 일시정지 상태 */}
                    {isPaused && !isGameOver && (
                        <div className="absolute inset-0 bg-slate-950/85 rounded-2xl flex flex-col items-center justify-center text-white backdrop-blur-xs z-10">
                            <i className="fas fa-pause text-3xl mb-2 text-amber-400"></i>
                            <span className="text-sm font-black">일시 정지됨</span>
                            <button
                                onClick={togglePause}
                                className="mt-3 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl cursor-pointer"
                            >
                                게임 계속하기
                            </button>
                        </div>
                    )}
                </div>

                {/* 하단 키보드 조작 안내 캡슐 */}
                <div className="mt-2.5 hidden sm:flex items-center justify-center gap-2 py-1 px-3 bg-slate-900/80 border border-slate-800 rounded-full text-[10px] text-slate-400 font-bold">
                    <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">←</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">→</kbd> 이동</span>
                    <span>•</span>
                    <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">↑</kbd> 회전</span>
                    <span>•</span>
                    <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">Space</kbd> 하드드롭</span>
                    <span>•</span>
                    <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">P</kbd> 일시정지</span>
                </div>

                {/* 모바일 컨트롤러 */}
                <MobileControls
                    onMoveLeft={moveLeft}
                    onMoveRight={moveRight}
                    onMoveDown={moveDown}
                    onRotate={rotatePiece}
                    onDrop={dropPiece}
                    onPause={togglePause}
                    onRestart={handleRestart}
                    isPaused={isPaused}
                    isGameOver={isGameOver}
                />
            </div>

            {/* 4. 게임 오버 결과 바닥 패널 */}
            {isGameOver && (
                <div className="w-full max-w-md mx-auto mt-2 bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-2xl animate-fade-in">
                    <div className={`p-2.5 rounded-xl border mb-2.5 text-center ${
                        isWin
                            ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                            : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                    }`}>
                        <div className="text-lg font-black mb-0.5">{isWin ? '🏆 VICTORY!' : '💔 DEFEAT!'}</div>
                        <h4 className="text-xs font-black text-white">
                            {isWin
                                ? `축하합니다! ${score.toLocaleString()}P로 승리를 거두었습니다!`
                                : `아쉽습니다! ${score.toLocaleString()}P (목표: ${targetScore.toLocaleString()}P)`}
                        </h4>
                        <p className="text-[10px] font-bold mt-1 text-slate-400">
                            내 전적: <span className="text-violet-400 font-black">{record.wins}승 {record.losses}패</span> (승률 {winRate}%)
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleRestart}
                            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-black transition-all cursor-pointer"
                        >
                            🔄 다시 대결
                        </button>
                        <button
                            onClick={handleShareClick}
                            className="flex-2 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                            <span>🚀 결과 라운지 피드에 올리기</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
