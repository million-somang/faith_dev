import React, { useEffect, useRef, useState } from 'react';
import { useTetris } from '../tetris/useTetris';
import GameBoard from '../tetris/GameBoard';
import NextPiecePreview from '../tetris/NextPiecePreview';
import MobileControls from '../tetris/MobileControls';

export interface BattleRecord {
    wins: number;
    losses: number;
    highScore: number;
    lastScore: number;
    lastPlayedAt: string;
}

export const getStoredBattleRecord = (): BattleRecord => {
    try {
        const saved = localStorage.getItem('vera_lounge_battle_record');
        if (saved) return JSON.parse(saved);
    } catch {
        // ignore
    }
    return {
        wins: 4,
        losses: 2,
        highScore: 13500,
        lastScore: 12400,
        lastPlayedAt: new Date().toISOString()
    };
};

export const saveStoredBattleRecord = (record: BattleRecord) => {
    localStorage.setItem('vera_lounge_battle_record', JSON.stringify(record));
};

export const openLoungeBattlePopup = (
    gameTag: string = '#테트리스',
    targetScore: number = 12400,
    challengerName: string = '베라 랭커'
) => {
    const width = 480;
    const height = 750;
    const left = Math.max(0, Math.floor(window.screenX + (window.outerWidth - width) / 2));
    const top = Math.max(0, Math.floor(window.screenY + (window.outerHeight - height) / 2));
    const url = `/lounge/battle-popup?tag=${encodeURIComponent(gameTag)}&target=${targetScore}&challenger=${encodeURIComponent(challengerName)}`;
    
    const popup = window.open(
        url,
        'VeraLoungeBattlePopup',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,status=no,toolbar=no,menubar=no,location=no`
    );
    if (popup) {
        popup.focus();
    }
};

interface LoungeBattleModalProps {
    isOpen: boolean;
    onClose: () => void;
    gameTag?: string;
    targetScore?: number;
    challengerName?: string;
    onShareResult?: (result: {
        gameTag: string;
        myScore: number;
        targetScore: number;
        isWin: boolean;
        level: number;
        lines: number;
    }) => void;
}

export const LoungeBattleModal: React.FC<LoungeBattleModalProps> = ({
    isOpen,
    onClose,
    gameTag = '#테트리스',
    targetScore = 12400,
    challengerName = '베라 랭커',
    onShareResult
}) => {
    const {
        board, currentPiece, nextPieceType, score, level, lines,
        isGameOver, isPaused,
        moveLeft, moveRight, moveDown, rotatePiece, dropPiece,
        startGame, togglePause
    } = useTetris();

    const [record, setRecord] = useState<BattleRecord>(getStoredBattleRecord);
    const gameOverHandled = useRef(false);

    // 모달이 열릴 때 게임 시작
    useEffect(() => {
        if (isOpen) {
            gameOverHandled.current = false;
            setRecord(getStoredBattleRecord());
            startGame();
        }
    }, [isOpen, startGame]);

    // 게임 오버 시 승패 처리 및 전적 기록
    useEffect(() => {
        if (isGameOver && !gameOverHandled.current && isOpen) {
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
    }, [isGameOver, score, targetScore, isOpen]);

    // 키보드 이벤트 리스너
    useEffect(() => {
        if (!isOpen) return;

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
    }, [isOpen, isGameOver, isPaused, moveLeft, moveRight, moveDown, rotatePiece, dropPiece, togglePause]);

    if (!isOpen) return null;

    const winRate = record.wins + record.losses > 0 
        ? Math.round((record.wins / (record.wins + record.losses)) * 100) 
        : 0;

    const progressRatio = Math.min(100, Math.round((score / (targetScore || 1)) * 100));
    const isWin = score >= targetScore;

    const handleShareClick = () => {
        if (onShareResult) {
            onShareResult({
                gameTag,
                myScore: score,
                targetScore,
                isWin,
                level,
                lines
            });
        }
        onClose();
    };

    const handleRestart = () => {
        gameOverHandled.current = false;
        startGame();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
                
                {/* 1. 모달 헤더 */}
                <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">⚔️</span>
                        <div>
                            <h3 className="text-sm font-black tracking-tight">라운지 1:1 실시간 게임 배틀</h3>
                            <p className="text-[10px] text-violet-200 font-bold">
                                내 전적: {record.wins}승 {record.losses}패 (승률 {winRate}%) · 최고 {record.highScore.toLocaleString()}P
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white text-xs font-black transition-all cursor-pointer"
                        title="닫기"
                    >
                        ✕
                    </button>
                </div>

                {/* 2. VS 배틀 상태바 (상대방 목표 vs 내 점수 게이지) */}
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
                    <div className="flex justify-between items-center text-xs mb-1.5 font-black">
                        <div className="flex items-center gap-1 text-violet-700">
                            <span>👤 나 (도전자)</span>
                            <span className="text-sm font-mono text-violet-900 bg-violet-100 px-2 py-0.5 rounded-lg">
                                {score.toLocaleString()}P
                            </span>
                        </div>
                        <span className="text-[10px] text-amber-500 font-black px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200">
                            VS
                        </span>
                        <div className="flex items-center gap-1 text-slate-600">
                            <span>👑 {challengerName}</span>
                            <span className="text-sm font-mono text-slate-800 bg-slate-200 px-2 py-0.5 rounded-lg">
                                {targetScore.toLocaleString()}P
                            </span>
                        </div>
                    </div>

                    {/* 실시간 프로그레스 바 */}
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden relative shadow-inner">
                        <div
                            className={`h-full transition-all duration-300 ${
                                isWin 
                                    ? 'bg-gradient-to-r from-emerald-400 to-teal-500 animate-pulse' 
                                    : 'bg-gradient-to-r from-violet-500 to-indigo-600'
                            }`}
                            style={{ width: `${progressRatio}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 font-bold mt-1">
                        <span>목표 달성률: {progressRatio}%</span>
                        <span>{isWin ? '🔥 목표 돌파! 승리 확정 상태' : `이길 때까지 ${(targetScore - score).toLocaleString()}P 남음`}</span>
                    </div>
                </div>

                {/* 3. 게임 플레이 뷰 본문 */}
                <div className="p-4 overflow-y-auto flex-1 flex flex-col items-center bg-slate-100/50">
                    
                    {/* 상단 미니 패널 */}
                    <div className="w-full max-w-[280px] flex justify-between items-center bg-white p-2.5 rounded-2xl border border-slate-200 mb-3 shadow-xs">
                        <div className="flex gap-3 text-center">
                            <div>
                                <span className="text-[9px] text-slate-400 font-bold block">레벨</span>
                                <span className="text-xs font-black text-slate-800 font-mono">LV.{level}</span>
                            </div>
                            <div>
                                <span className="text-[9px] text-slate-400 font-bold block">라인</span>
                                <span className="text-xs font-black text-slate-800 font-mono">{lines}줄</span>
                            </div>
                        </div>

                        {/* 다음 블록 */}
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] text-slate-400 font-bold">NEXT</span>
                            <div className="w-8 h-8 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-lg p-1">
                                <NextPiecePreview type={nextPieceType} blockSize="w-2 h-2" borderWidth="border-[1px]" />
                            </div>
                        </div>
                    </div>

                    {/* 테트리스 보드 */}
                    <div className="relative">
                        <GameBoard board={board} currentPiece={currentPiece} />

                        {/* 일시 정지 오버레이 */}
                        {isPaused && !isGameOver && (
                            <div className="absolute inset-0 bg-slate-900/80 rounded-2xl flex flex-col items-center justify-center text-white backdrop-blur-xs z-10">
                                <i className="fas fa-pause text-3xl mb-2 text-amber-400"></i>
                                <span className="text-sm font-black">일시 정지됨</span>
                                <button
                                    onClick={togglePause}
                                    className="mt-3 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-black rounded-xl cursor-pointer"
                                >
                                    게임 계속하기
                                </button>
                            </div>
                        )}
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

                {/* 4. 게임 오버 결과 팝업 & 라운지 피드 공유 액션 */}
                {isGameOver && (
                    <div className="p-4 bg-white border-t border-slate-200 animate-fade-in shadow-lg">
                        <div className={`p-3 rounded-2xl border mb-3 text-center ${
                            isWin 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                                : 'bg-rose-50 border-rose-200 text-rose-900'
                        }`}>
                            <div className="text-xl mb-0.5">{isWin ? '🏆 VICTORY!' : '💔 DEFEAT!'}</div>
                            <h4 className="text-sm font-black">
                                {isWin 
                                    ? `축하합니다! ${score.toLocaleString()}P로 승리를 거두었습니다!`
                                    : `아쉽습니다! ${score.toLocaleString()}P (목표 점수: ${targetScore.toLocaleString()}P)`}
                            </h4>
                            <p className="text-[11px] font-bold mt-1 text-slate-600">
                                현재 내 전적: <span className="text-violet-700 font-black">{record.wins}승 {record.losses}패</span> (승률 {winRate}%)
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleRestart}
                                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all cursor-pointer"
                            >
                                🔄 다시 대결
                            </button>
                            <button
                                onClick={handleShareClick}
                                className="flex-2 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center justify-center gap-1.5 transition-all hover:scale-102 active:scale-98 cursor-pointer"
                            >
                                <span>🚀 결과 라운지 피드에 자랑 & 도전장 올리기</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
