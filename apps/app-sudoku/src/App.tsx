import { useEffect, useState, useMemo } from 'react';
import { MiniAppLayout, useAuth, usePortalMessenger } from '@faithportal/mini-app-sdk';
import axios from 'axios';
import '@faithportal/mini-app-sdk/src/mini-app.css';

import { useSudoku } from './hooks/useSudoku';
import { useSudokuSound } from './hooks/useSudokuSound';
import { getDifficultyLabel, type Difficulty } from './logic/sudoku';
import { SudokuStatsTab } from './components/SudokuStatsTab';
import { SudokuGuideTab } from './components/SudokuGuideTab';
import { SudokuFaqTab } from './components/SudokuFaqTab';
import { PolicyModal, type PolicyType } from './components/PolicyModal';

type ActiveTab = 'game' | 'stats' | 'guide' | 'faq';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

function App() {
    const { user, isLoading: authLoading } = useAuth();
    const { sendToPortal } = usePortalMessenger();
    const game = useSudoku();
    const sound = useSudokuSound();

    // 4초 스플래시 로딩 상태
    const [splashProgress, setSplashProgress] = useState(1);
    const [isSplashLoading, setIsSplashLoading] = useState(true);

    // 활성 탭
    const [activeTab, setActiveTab] = useState<ActiveTab>('game');

    // 점수 저장 상태
    const [savingScore, setSavingScore] = useState(false);

    // 정책 모달
    const [policyType, setPolicyType] = useState<PolicyType>(null);

    // 4초 스플래시 & 1~100% 실시간 프로그레스
    useEffect(() => {
        const duration = 4000;
        const intervalTime = 40;
        const step = 100 / (duration / intervalTime);

        const timer = setInterval(() => {
            setSplashProgress(prev => {
                const next = prev + step;
                if (next >= 100) {
                    clearInterval(timer);
                    setTimeout(() => setIsSplashLoading(false), 200);
                    return 100;
                }
                return Math.floor(next);
            });
        }, intervalTime);

        return () => clearInterval(timer);
    }, []);

    // 게임 클리어 시 점수 저장 및 사운드
    useEffect(() => {
        if (game.isComplete && !game.gameOverHandled.current) {
            game.gameOverHandled.current = true;
            sound.playVictory();

            if (!user) return;

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

    // 각 숫자별 보드 잔여 개수 계산 (1~9)
    const numberCounts = useMemo(() => {
        const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
        game.board.forEach(row => {
            row.forEach(cell => {
                if (cell !== null && counts[cell] !== undefined) {
                    counts[cell]++;
                }
            });
        });
        return counts;
    }, [game.board]);

    // 전체 진행도 (0~100%)
    const progressPercent = useMemo(() => {
        let filled = 0;
        game.board.forEach(row => {
            row.forEach(cell => {
                if (cell !== null) filled++;
            });
        });
        return Math.round((filled / 81) * 100);
    }, [game.board]);

    // 셀 선택 핸들러
    const handleCellClick = (r: number, c: number) => {
        sound.playSelect();
        game.selectCell(r, c);
    };

    // 숫자 입력 핸들러
    const handleNumberClick = (num: number) => {
        game.inputNumber(num, (type) => {
            if (type === 'number') sound.playNumberInput(num);
            else if (type === 'note') sound.playNote();
            else if (type === 'mistake') sound.playMistake();
            else if (type === 'victory') sound.playVictory();
        });
    };

    // 공유하기 핸들러
    const handleShare = async () => {
        sound.playSelect();
        const shareData = {
            title: '베라 스도쿠 (Vera Sudoku) - 2026 공인 두뇌 퍼즐',
            text: '수학적으로 완벽한 유일해 보장! 2026 베라 스도쿠에서 당신의 논리력을 시험해보세요.',
            url: window.location.href
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert('스도쿠 게임 링크가 클립보드에 복사되었습니다!');
            }
        } catch { }
    };

    // 1. [화면 1] 4초 프리미엄 스플래시 로딩 화면
    if (isSplashLoading || authLoading) {
        return (
            <div className="h-screen w-full flex flex-col justify-between items-center bg-gradient-to-b from-slate-50 via-white to-slate-100 p-6 select-none animate-fade-in">
                {/* 상단 브랜딩 & 기준 배지 */}
                <div className="w-full max-w-sm flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-xs font-black text-slate-500 tracking-wider uppercase">VERANEX</span>
                    </div>
                    <span className="text-[11px] font-black text-blue-700 bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full shadow-2xs">
                        2026 공인 기준 준수
                    </span>
                </div>

                {/* 중앙 3D 비주얼 & 1~100% 프로그레스 바 */}
                <div className="w-full max-w-sm flex flex-col items-center justify-center my-auto py-6 text-center">
                    <div className="relative mb-5">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center text-3xl shadow-xl shadow-blue-500/20 border-2 border-white animate-bounce-soft">
                            <i className="fas fa-cubes"></i>
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-white text-emerald-600 rounded-full p-1.5 shadow-md border border-slate-100 text-xs">
                            <i className="fas fa-brain"></i>
                        </div>
                    </div>

                    <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
                        베라 스도쿠
                    </h1>
                    <p className="text-xs font-bold text-slate-700 mb-1">
                        2026 공인 유일해(Unique Solution) 보장 엔진
                    </p>
                    <p className="text-[11px] text-slate-400 mb-5 max-w-xs leading-relaxed">
                        순수 논리 연역 추론으로 완성하는 프리미엄 두뇌 트레이닝
                    </p>

                    {/* 실시간 1~100% 프로그레스 바 */}
                    <div className="w-full max-w-xs space-y-1.5 mb-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 px-1">
                            <span>스도쿠 알고리즘 및 보안 초기화</span>
                            <span className="font-black text-blue-600 text-xs tabular-nums">{splashProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 border border-slate-200 h-2.5 rounded-full overflow-hidden p-0.5 shadow-inner">
                            <div
                                className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 rounded-full transition-all duration-75 ease-out"
                                style={{ width: `${splashProgress}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-blue-600">
                        <i className="fas fa-spinner fa-spin text-xs"></i>
                        <span>퍼즐 보드 매핑 중... ({splashProgress}%)</span>
                    </div>
                </div>

                {/* 하단 필수 제휴 광고 슬롯 */}
                <div className="w-full max-w-sm flex flex-col items-center gap-2 pb-2">
                    <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <i className="fas fa-bullhorn text-xs"></i>
                            </div>
                            <div className="text-left min-w-0">
                                <div className="flex items-center gap-1">
                                    <span className="text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">AD</span>
                                    <span className="text-xs font-bold text-slate-800 truncate">베라 넥스 두뇌 브레인 챌린지</span>
                                </div>
                                <span className="text-[10px] text-slate-500 truncate block mt-0.5">매일 10분 두뇌 건강 루틴</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="shrink-0 px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-black rounded-lg border border-blue-200 cursor-pointer"
                        >
                            확인
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center">
                        © 2026 VeraNex. All rights reserved.
                    </p>
                </div>
            </div>
        );
    }

    // 2. [화면 2] 메인 미니앱 레이아웃 (Zero-Scroll 680px 완결 뷰)
    return (
        <MiniAppLayout title="베라 스도쿠">
            <div className="h-screen max-h-[850px] w-full max-w-[450px] mx-auto bg-slate-50 flex flex-col justify-between overflow-hidden select-none border-x border-slate-200 shadow-xl">
                
                {/* 1. 상단 바 (36px): 브랜딩 + 음소거 + 공유 */}
                <header className="h-9 px-3 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between shrink-0 shadow-2xs">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-[10px] font-black shadow-2xs">
                            <i className="fas fa-cubes"></i>
                        </div>
                        <span className="text-xs font-black text-slate-900 tracking-tight">베라 스도쿠</span>
                        <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200/70 px-1.5 py-0.2 rounded-md">
                            PRO
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={sound.toggleMute}
                            className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-[11px] transition-colors cursor-pointer"
                            title={sound.isMuted ? '음소거 해제' : '음소거'}
                        >
                            <i className={`fas ${sound.isMuted ? 'fa-volume-xmark text-rose-500' : 'fa-volume-high text-blue-600'}`}></i>
                        </button>
                        <button
                            type="button"
                            onClick={handleShare}
                            className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-[11px] transition-colors cursor-pointer"
                            title="공유하기"
                        >
                            <i className="fas fa-share-nodes"></i>
                        </button>
                    </div>
                </header>

                {/* 2. 탭 네비게이션 (34px): [대국] [통계] [공략] [FAQ] */}
                <nav className="h-8.5 px-3 bg-white border-b border-slate-200/80 flex items-center gap-1 shrink-0">
                    {[
                        { id: 'game', label: '스도쿠 대국', icon: 'fa-gamepad' },
                        { id: 'stats', label: '플레이 통계', icon: 'fa-chart-pie' },
                        { id: 'guide', label: '공략 가이드', icon: 'fa-book-open' },
                        { id: 'faq', label: 'FAQ', icon: 'fa-circle-question' }
                    ].map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => {
                                    sound.playSelect();
                                    setActiveTab(tab.id as ActiveTab);
                                }}
                                className={`flex-1 h-7 rounded-lg text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                    isActive
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <i className={`fas ${tab.icon} text-[10px]`}></i>
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* 3. 탭별 메인 컨텐츠 영역 */}
                {activeTab === 'stats' && <SudokuStatsTab stats={game.stats} />}
                {activeTab === 'guide' && <SudokuGuideTab />}
                {activeTab === 'faq' && <SudokuFaqTab />}

                {/* ================= 메인 대국 화면 (680px Zero-Scroll 완결) ================= */}
                {activeTab === 'game' && (
                    <main className="flex-1 flex flex-col justify-between px-3 py-1.5 overflow-hidden">
                        
                        {/* Zone 1: 원라인 통합 전광판 (HUD) */}
                        <div className="h-10 bg-white rounded-xl px-3 border border-slate-200/90 shadow-2xs flex items-center justify-between shrink-0">
                            {/* 좌측: 난이도 선택 칩 */}
                            <div className="flex gap-1" data-screenshot-click="action">
                                {DIFFICULTIES.map(d => {
                                    const isSelected = game.difficulty === d;
                                    return (
                                        <button
                                            key={d}
                                            onClick={() => {
                                                sound.playSelect();
                                                game.startGame(d);
                                            }}
                                            className={`px-2 py-0.5 text-[10px] font-black rounded-md transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'bg-blue-600 text-white shadow-2xs'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                        >
                                            {getDifficultyLabel(d)}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* 우측: 시간 + 실수 하트 + 일시정지 */}
                            <div className="flex items-center gap-2 text-xs">
                                <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                    <i className="far fa-clock text-slate-400 text-[10px]"></i>
                                    <span className="font-mono font-black text-slate-800 text-[11px] tabular-nums">
                                        {formatTime(game.timer)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-0.5" title={`실수: ${game.mistakes}/3`}>
                                    {[1, 2, 3].map(heartIdx => (
                                        <span key={heartIdx} className="text-xs">
                                            {heartIdx <= (3 - game.mistakes) ? '❤️' : '🖤'}
                                        </span>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        sound.playSelect();
                                        game.togglePause();
                                    }}
                                    className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] cursor-pointer"
                                    title={game.isPaused ? '계속하기' : '일시정지'}
                                >
                                    <i className={`fas ${game.isPaused ? 'fa-play text-emerald-600' : 'fa-pause'}`}></i>
                                </button>
                            </div>
                        </div>

                        {/* Zone 2: 9x9 메인 스도쿠 보드 (컴팩트 324px x 324px) */}
                        <div className="relative flex justify-center items-center my-auto py-1">
                            <div
                                className="grid grid-cols-9 bg-white border-2 border-slate-800 rounded-xl overflow-hidden shadow-md select-none"
                                style={{ width: '324px', height: '324px' }}
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
                                        const cellNotes = game.notes[r][c] || [];

                                        // 3x3 굵은 구분선
                                        const borderR = (c + 1) % 3 === 0 && c < 8 ? 'border-r-2 border-r-slate-800' : 'border-r border-r-slate-200';
                                        const borderB = (r + 1) % 3 === 0 && r < 8 ? 'border-b-2 border-b-slate-800' : 'border-b border-b-slate-200';

                                        // 배경색 스타일
                                        let bg = 'bg-white';
                                        if (isError) {
                                            bg = 'bg-rose-100 animate-shake';
                                        } else if (isSelected) {
                                            bg = 'bg-blue-200 ring-2 ring-blue-600 ring-inset z-10';
                                        } else if (isSameNum && cell !== null) {
                                            bg = 'bg-blue-100 font-extrabold';
                                        } else if (isSameRow || isSameCol || isSameBox) {
                                            bg = 'bg-slate-100/70';
                                        }

                                        // 글자색 스타일
                                        let textColor = 'text-slate-800 font-bold';
                                        if (isError) textColor = 'text-rose-600 font-black';
                                        else if (isFixed) textColor = 'text-slate-900 font-black';
                                        else textColor = 'text-blue-600 font-bold';

                                        return (
                                            <button
                                                key={`${r}-${c}`}
                                                type="button"
                                                onClick={() => handleCellClick(r, c)}
                                                className={`relative flex items-center justify-center text-sm md:text-base transition-colors ${bg} ${borderR} ${borderB} ${textColor} ${
                                                    isFixed ? 'cursor-pointer' : 'cursor-pointer hover:bg-blue-50'
                                                }`}
                                                style={{ width: '36px', height: '36px' }}
                                            >
                                                {/* 셀 내 확정 숫자 */}
                                                {cell !== null ? (
                                                    <span>{cell}</span>
                                                ) : (
                                                    /* 메모(후보 숫자) 미니 3x3 그리드 */
                                                    cellNotes.length > 0 && (
                                                        <div className="grid grid-cols-3 w-full h-full p-0.5 pointer-events-none">
                                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                                                <span
                                                                    key={n}
                                                                    className={`flex items-center justify-center text-[7px] leading-none ${
                                                                        cellNotes.includes(n) ? 'text-slate-600 font-black' : 'opacity-0'
                                                                    }`}
                                                                >
                                                                    {n}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            {/* 일시정지 오버레이 */}
                            {game.isPaused && !game.isComplete && !game.isGameOver && (
                                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl z-20 space-y-2">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shadow-xs">
                                        <i className="fas fa-pause"></i>
                                    </div>
                                    <h3 className="text-base font-black text-slate-900">대국 일시정지</h3>
                                    <p className="text-xs text-slate-500">타이머가 멈춘 상태입니다.</p>
                                    <button
                                        onClick={() => {
                                            sound.playSelect();
                                            game.togglePause();
                                        }}
                                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
                                    >
                                        계속하기
                                    </button>
                                </div>
                            )}

                            {/* 승리 클리어 오버레이 */}
                            {game.isComplete && (
                                <div 
                                    data-screenshot-point="result"
                                    className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center rounded-xl z-30 p-4 text-center space-y-2.5 animate-scale-up"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl shadow-xs">
                                        <i className="fas fa-trophy"></i>
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900">스도쿠 완전 정복!</h3>
                                    <p className="text-xs text-slate-600">
                                        {getDifficultyLabel(game.difficulty)} 모드 · {formatTime(game.timer)} · 실수 {game.mistakes}회
                                    </p>
                                    {savingScore && <span className="text-[11px] text-blue-600 font-bold animate-pulse">랭킹 점수 기록 중...</span>}
                                    {!savingScore && user && <span className="text-[11px] text-emerald-600 font-bold">✓ 랭킹 점수 저장 완료</span>}

                                    <div className="flex gap-1.5 pt-1">
                                        {DIFFICULTIES.map(d => (
                                            <button
                                                key={d}
                                                data-screenshot-click="result"
                                                onClick={() => {
                                                    sound.playSelect();
                                                    game.startGame(d);
                                                }}
                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-lg transition-colors cursor-pointer shadow-xs"
                                            >
                                                {getDifficultyLabel(d)} 재도전
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 게임 오버 오버레이 */}
                            {game.isGameOver && !game.isComplete && (
                                <div className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center rounded-xl z-30 p-4 text-center space-y-2.5 animate-scale-up">
                                    <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl shadow-xs">
                                        <i className="fas fa-heart-crack"></i>
                                    </div>
                                    <h3 className="text-lg font-black text-rose-600">대국 종료 (실수 3회)</h3>
                                    <p className="text-xs text-slate-500">지정된 3회의 실수 허용치를 모두 소진하였습니다.</p>
                                    <div className="flex gap-1.5 pt-1">
                                        {DIFFICULTIES.map(d => (
                                            <button
                                                key={d}
                                                onClick={() => {
                                                    sound.playSelect();
                                                    game.startGame(d);
                                                }}
                                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-lg transition-colors cursor-pointer"
                                            >
                                                {getDifficultyLabel(d)} 다시하기
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Zone 3: 액션 툴바 (36px) - 메모, 되돌리기, 지우기, 힌트 */}
                        <div className="h-9 px-1 grid grid-cols-4 gap-1.5 shrink-0">
                            {/* 1. 메모(연필) 모드 토글 */}
                            <button
                                type="button"
                                onClick={() => {
                                    sound.playSelect();
                                    game.togglePencilMode();
                                }}
                                className={`h-8 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                    game.isPencilMode
                                        ? 'bg-amber-500 text-white shadow-xs'
                                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                <i className="fas fa-pencil text-[11px]"></i>
                                <span>메모 {game.isPencilMode ? 'ON' : 'OFF'}</span>
                            </button>

                            {/* 2. 되돌리기 (Undo) */}
                            <button
                                type="button"
                                onClick={() => {
                                    sound.playSelect();
                                    game.undo();
                                }}
                                disabled={!game.canUndo || game.isComplete || game.isGameOver}
                                className="h-8 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            >
                                <i className="fas fa-rotate-left text-[11px]"></i>
                                <span>되돌리기</span>
                            </button>

                            {/* 3. 지우기 */}
                            <button
                                type="button"
                                onClick={() => {
                                    sound.playErase();
                                    game.eraseCell();
                                }}
                                disabled={game.isComplete || game.isGameOver}
                                className="h-8 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            >
                                <i className="fas fa-eraser text-[11px]"></i>
                                <span>지우기</span>
                            </button>

                            {/* 4. 힌트 */}
                            <button
                                type="button"
                                onClick={() => {
                                    sound.playHint();
                                    game.getHint();
                                }}
                                disabled={game.hintsRemaining <= 0 || game.isComplete || game.isGameOver}
                                className="h-8 rounded-lg text-xs font-bold bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 disabled:opacity-40 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            >
                                <i className="fas fa-lightbulb text-[11px]"></i>
                                <span>힌트 ({game.hintsRemaining})</span>
                            </button>
                        </div>

                        {/* Zone 4: 1~9 숫자 키패드 (40px) */}
                        <div className="h-10 grid grid-cols-9 gap-1 shrink-0">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
                                const currentCount = numberCounts[num] || 0;
                                const isFull = currentCount >= 9;

                                return (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => handleNumberClick(num)}
                                        disabled={isFull || game.isComplete || game.isGameOver || game.isPaused}
                                        className={`h-9.5 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                                            isFull
                                                ? 'bg-slate-100 text-slate-300 border border-slate-200/50 cursor-not-allowed'
                                                : 'bg-white border border-slate-200/90 text-slate-800 hover:border-blue-400 hover:bg-blue-50 active:scale-95 shadow-2xs font-black'
                                        }`}
                                    >
                                        <span className="text-sm leading-none">{num}</span>
                                        <span className={`text-[8px] leading-none mt-0.5 ${isFull ? 'text-slate-300' : 'text-slate-400 font-bold'}`}>
                                            {isFull ? '✓' : 9 - currentCount}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Zone 5: 진행률 인디케이터 (18px) */}
                        <div className="flex items-center gap-2 px-1 text-[10px] text-slate-500 font-bold shrink-0">
                            <span>대국 진행도</span>
                            <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>
                            <span className="font-mono tabular-nums">{progressPercent}%</span>
                        </div>
                    </main>
                )}

                {/* 4. 하단 도킹 보안 & 저작권 푸터 (32px) */}
                <footer className="h-8 px-3 bg-white border-t border-slate-200/80 flex items-center justify-between text-[9px] text-slate-500 shrink-0">
                    <span className="flex items-center gap-1 font-semibold">
                        <i className="fas fa-shield-halved text-emerald-500 text-[10px]"></i>
                        <span>공인 표준 엔진 • 100% 로컬 보안</span>
                    </span>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPolicyType('about')}
                            className="hover:text-blue-600 transition-colors cursor-pointer"
                        >
                            소개
                        </button>
                        <span>•</span>
                        <button
                            type="button"
                            onClick={() => setPolicyType('privacy')}
                            className="hover:text-blue-600 transition-colors cursor-pointer"
                        >
                            개인정보
                        </button>
                        <span>•</span>
                        <button
                            type="button"
                            onClick={() => setPolicyType('terms')}
                            className="hover:text-blue-600 transition-colors cursor-pointer"
                        >
                            약관
                        </button>
                        <span>•</span>
                        <button
                            type="button"
                            onClick={() => setPolicyType('contact')}
                            className="hover:text-blue-600 transition-colors cursor-pointer"
                        >
                            문의
                        </button>
                    </div>
                </footer>

                {/* E-E-A-T 4대 정책 모달 */}
                <PolicyModal type={policyType} onClose={() => setPolicyType(null)} />
            </div>
        </MiniAppLayout>
    );
}

export default App;
