import { useState, useCallback, useEffect } from 'react';
import { useAuth, usePortalMessenger } from '@faithportal/mini-app-sdk';
import axios from 'axios';
import '@faithportal/mini-app-sdk/src/mini-app.css';

import { useMinesweeper, type Difficulty } from './hooks/useMinesweeper';
import { useMinesweeperSound } from './hooks/useMinesweeperSound';
import GameBoard from './components/GameBoard';
import GameOverModal from './components/GameOverModal';
import LeaderboardModal from './components/LeaderboardModal';
import { MinesweeperGuideTab } from './components/MinesweeperGuideTab';
import { MinesweeperFaqTab } from './components/MinesweeperFaqTab';
import { PolicyModal, type PolicyType } from './components/PolicyModal';

type ActiveTab = 'game' | 'leaderboard' | 'guide' | 'faq';

function App() {
    const { user, isLoading: authLoading } = useAuth();
    const { sendToPortal } = usePortalMessenger();

    // 지뢰찾기 게임 훅
    const {
        board,
        difficulty,
        config,
        gameStatus,
        elapsedTime,
        flagCount,
        revealCell,
        toggleFlag,
        chording,
        initGame,
        changeDifficulty,
    } = useMinesweeper();

    // 사운드 합성 훅
    const sound = useMinesweeperSound();

    // 4초 스플래시 로딩 상태
    const [splashProgress, setSplashProgress] = useState(1);
    const [isSplashLoading, setIsSplashLoading] = useState(true);

    // 활성 탭
    const [activeTab, setActiveTab] = useState<ActiveTab>('game');

    // 모바일 터치 조작 모드 ('dig' 파기 vs 'flag' 깃발)
    const [interactionMode, setInteractionMode] = useState<'dig' | 'flag'>('dig');

    // 점수 저장 및 모달 상태
    const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

    // 4대 정책 모달
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

    // 게임 상태 변경 시 사운드 효과
    useEffect(() => {
        if (gameStatus === 'won') {
            sound.playWin();
        } else if (gameStatus === 'lost') {
            sound.playExplode();
        }
    }, [gameStatus]);

    // 셀 열기 래퍼
    const handleRevealCell = useCallback((r: number, c: number) => {
        revealCell(r, c);
        sound.playReveal();
    }, [revealCell, sound]);

    // 깃발 토글 래퍼
    const handleToggleFlag = useCallback((r: number, c: number) => {
        toggleFlag(r, c);
        sound.playFlag();
    }, [toggleFlag, sound]);

    // Chording 래퍼
    const handleChording = useCallback((r: number, c: number) => {
        chording(r, c);
        sound.playCascade();
    }, [chording, sound]);

    // 게임 리셋 핸들러
    const handleReset = useCallback(() => {
        sound.playClick();
        initGame();
        setSaveResult(null);
        setIsSaving(false);
    }, [initGame, sound]);

    // 난이도 변경 핸들러
    const handleChangeDifficulty = useCallback((d: Difficulty) => {
        sound.playClick();
        changeDifficulty(d);
        setSaveResult(null);
    }, [changeDifficulty, sound]);

    // 점수 저장 핸들러
    const handleSaveScore = useCallback(async () => {
        if (!user) {
            setSaveResult({ success: false, message: '로그인이 필요합니다. 로그인 후 다시 시도해주세요.' });
            return;
        }

        setIsSaving(true);
        try {
            const score = Math.max(0, 10000 - (elapsedTime * 10));
            const res = await axios.post('/api/games/minesweeper/score', {
                score,
                metadata: { difficulty, time: elapsedTime },
            }, {
                withCredentials: true,
            });

            if (res.data.success) {
                setSaveResult({ success: true, message: '🎉 명예의 전당에 기록이 저장되었습니다!' });
                sendToPortal('MISSION_CLEAR');
            } else {
                setSaveResult({ success: false, message: res.data.message || '저장에 실패했습니다.' });
            }
        } catch (err: any) {
            const msg = err.response?.status === 401
                ? '로그인이 필요합니다. 로그인 페이지로 이동해주세요.'
                : '저장 중 오류가 발생했습니다.';
            setSaveResult({ success: false, message: msg });
        } finally {
            setIsSaving(false);
        }
    }, [user, difficulty, elapsedTime, sendToPortal]);

    // 공유하기 핸들러
    const handleShare = async () => {
        sound.playClick();
        const shareData = {
            title: '베라 지뢰찾기 (Vera Minesweeper) - 2026 공인 스피드 퍼즐',
            text: '100% 안전 보장 첫 클릭! 2026 베라 지뢰찾기에서 신기록에 도전하세요.',
            url: window.location.href,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert('지뢰찾기 게임 링크가 클립보드에 복사되었습니다!');
            }
        } catch { }
    };

    // 닫기 핸들러
    const handleClose = () => {
        if (window.opener && window.opener !== window) {
            window.close();
        } else {
            window.location.href = '/';
        }
    };

    // 시간 포맷팅 (00:00)
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // 스마일리 아이콘 결정
    const getSmileyIcon = () => {
        if (gameStatus === 'won') return '😎';
        if (gameStatus === 'lost') return '😵';
        return '🙂';
    };

    // 잔여 지뢰 수 (음수 방지 및 3자리 패딩)
    const remainingMines = Math.max(0, config.mines - flagCount);
    const remainingMinesDisplay = String(remainingMines).padStart(3, '0');

    // 1. [화면 1] 4초 프리미엄 스플래시 로딩 화면
    if (isSplashLoading || authLoading) {
        return (
            <div className="h-screen w-full flex flex-col justify-between items-center bg-gradient-to-b from-slate-50 via-white to-slate-100 p-6 select-none animate-fade-in font-sans loading-screen" aria-label="로딩">
                {/* 상단 브랜딩 & 기준 배지 */}
                <div className="w-full max-w-sm flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-xs font-black text-slate-500 tracking-wider uppercase">VERANEX</span>
                    </div>
                    <span className="text-[11px] font-black text-rose-700 bg-rose-50 border border-rose-200/80 px-3 py-1 rounded-full shadow-2xs">
                        2026 공인 기준 준수
                    </span>
                </div>

                {/* 중앙 3D 비주얼 & 1~100% 프로그레스 바 */}
                <div className="w-full max-w-sm flex flex-col items-center justify-center my-auto py-6 text-center">
                    <div className="relative mb-5">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-500 via-red-600 to-amber-500 text-white flex items-center justify-center text-3xl shadow-xl shadow-rose-500/20 border-2 border-white animate-bounce-soft">
                            <i className="fas fa-bomb"></i>
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-white text-emerald-600 rounded-full p-1.5 shadow-md border border-slate-100 text-xs">
                            <i className="fas fa-shield-halved"></i>
                        </div>
                    </div>

                    <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
                        베라 지뢰찾기
                    </h1>
                    <p className="text-xs font-bold text-slate-700 mb-1">
                        2026 공인 첫 클릭 100% 안전 보장 엔진
                    </p>
                    <p className="text-[11px] text-slate-400 mb-5 max-w-xs leading-relaxed">
                        논리적 연역 추론과 Chording 기술로 완성하는 스피드 전술 퍼즐
                    </p>

                    {/* 실시간 1~100% 프로그레스 바 */}
                    <div className="w-full max-w-xs space-y-1.5 mb-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 px-1">
                            <span>전술 레이더 및 지뢰 격자 배치 중</span>
                            <span className="font-black text-rose-600 text-xs tabular-nums">{splashProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 border border-slate-200 h-2.5 rounded-full overflow-hidden p-0.5 shadow-inner">
                            <div
                                className="h-full bg-gradient-to-r from-rose-500 via-red-600 to-amber-500 rounded-full transition-all duration-75 ease-out"
                                style={{ width: `${splashProgress}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-rose-600">
                        <i className="fas fa-spinner fa-spin text-xs"></i>
                        <span>보안 채널 연결 및 모듈 로딩 중... ({splashProgress}%)</span>
                    </div>
                </div>

                {/* 하단 필수 제휴 광고 슬롯 */}
                <div className="w-full max-w-sm flex flex-col items-center gap-2 pb-2">
                    <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <i className="fas fa-bullhorn text-xs"></i>
                            </div>
                            <div className="text-left min-w-0">
                                <div className="flex items-center gap-1">
                                    <span className="text-[9px] font-black text-rose-600 uppercase bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">AD</span>
                                    <span className="text-xs font-bold text-slate-800 truncate">2026 베라 브레인 인지력 챌린지</span>
                                </div>
                                <span className="text-[10px] text-slate-500 truncate block mt-0.5">매일 5분 두뇌 피트니스 루틴</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="shrink-0 px-2.5 py-1 bg-rose-50 text-rose-700 text-[11px] font-black rounded-lg border border-rose-200 cursor-pointer"
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
        <div className="h-screen max-h-screen w-full overflow-hidden bg-slate-100 flex justify-center items-center select-none font-sans">
            <main className="w-full max-w-[450px] h-full max-h-[850px] bg-slate-50 flex flex-col justify-between overflow-hidden shadow-2xl border-x border-slate-200 relative">
                
                {/* 1. 상단 바 (38px): 브랜딩 + 음소거 + 공유 + 닫기 */}
                <header className="h-10 px-3 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between shrink-0 shadow-2xs">
                    <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center text-xs font-black shadow-2xs">
                            <i className="fas fa-bomb"></i>
                        </div>
                        <span className="text-xs font-black text-slate-900 tracking-tight">베라 지뢰찾기</span>
                        <span className="text-[9px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded-md">
                            2026 PRO
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={sound.toggleMute}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs transition-colors cursor-pointer"
                            title={sound.isMuted ? '음소거 해제' : '음소거'}
                        >
                            <i className={`fas ${sound.isMuted ? 'fa-volume-xmark text-rose-500' : 'fa-volume-high text-blue-600'}`}></i>
                        </button>
                        <button
                            type="button"
                            onClick={handleShare}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs transition-colors cursor-pointer"
                            title="공유하기"
                        >
                            <i className="fas fa-share-nodes"></i>
                        </button>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 flex items-center justify-center text-xs transition-colors cursor-pointer"
                            title="닫기"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </header>

                {/* 2. 알약 탭 바 (34px): [작전] [명예의전당] [공략] [FAQ] */}
                <nav className="h-8.5 px-3 bg-white border-b border-slate-200/80 flex items-center gap-1 shrink-0">
                    {[
                        { id: 'game', label: '지뢰찾기 작전', icon: 'fa-gamepad' },
                        { id: 'leaderboard', label: '명예의 전당', icon: 'fa-trophy' },
                        { id: 'guide', label: '공략 가이드', icon: 'fa-book-open' },
                        { id: 'faq', label: 'FAQ', icon: 'fa-circle-question' }
                    ].map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => {
                                    sound.playClick();
                                    setActiveTab(tab.id as ActiveTab);
                                }}
                                className={`flex-1 h-7 rounded-lg text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                    isActive
                                        ? 'bg-rose-600 text-white shadow-xs'
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
                {activeTab === 'guide' && <MinesweeperGuideTab />}
                {activeTab === 'faq' && <MinesweeperFaqTab />}

                {/* 명예의 전당 탭 */}
                {activeTab === 'leaderboard' && (
                    <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4 animate-fade-in bg-slate-50">
                        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm text-center">
                            <span className="text-[11px] font-black uppercase text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100">
                                HALL OF FAME
                            </span>
                            <h2 className="text-xl font-black text-slate-900 mt-2">지뢰찾기 명예의 전당</h2>
                            <p className="text-xs text-slate-500 mt-1">난이도별 최단 클리어 기록 랭킹</p>
                            
                            <button
                                type="button"
                                onClick={() => setShowLeaderboardModal(true)}
                                data-screenshot-click="result"
                                className="w-full mt-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl text-xs hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm cursor-pointer"
                            >
                                🏆 실시간 랭킹 보드 열기
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-2 text-xs text-slate-600 leading-relaxed">
                            <h3 className="font-black text-slate-900 text-sm">💡 랭킹 등록 규칙</h3>
                            <p>• 기본 점수 10,000점에서 클리어 소요 시간에 따라 점수가 차등 산출됩니다.</p>
                            <p>• 초급(9×9), 중급(16×16), 고급(30×16) 각 난이도별로 최고 기록이 별도 집계됩니다.</p>
                            <p>• 로그인한 회원에 한해 공식 리더보드에 닉네임과 점수가 영구 등재됩니다.</p>
                        </div>
                    </div>
                )}

                {/* ================= 메인 게임 화면 (680px Zero-Scroll 완결) ================= */}
                {activeTab === 'game' && (
                    <main className="flex-1 flex flex-col justify-between px-3 py-1.5 overflow-hidden">
                        
                        {/* Zone 1: 원라인 통합 전광판 (HUD) (46px) */}
                        <div className="h-11 bg-white rounded-xl px-3 border border-slate-200/90 shadow-2xs flex items-center justify-between shrink-0">
                            {/* 좌측: 잔여 지뢰 수 LED */}
                            <div className="flex items-center gap-1.5 bg-slate-900 text-rose-500 px-2.5 py-1 rounded-lg font-mono font-black text-base shadow-inner tabular-nums">
                                <span className="text-xs text-rose-400">💣</span>
                                <span>{remainingMinesDisplay}</span>
                            </div>

                            {/* 중앙: 리셋 스마일리 페이스 버튼 */}
                            <button
                                type="button"
                                onClick={handleReset}
                                className="w-8 h-8 rounded-full bg-amber-100 hover:bg-amber-200 border-2 border-amber-300 text-lg flex items-center justify-center transition-transform active:scale-90 shadow-xs cursor-pointer"
                                title="새 게임 시작"
                            >
                                {getSmileyIcon()}
                            </button>

                            {/* 우측: 경과 시간 타이머 */}
                            <div className="flex items-center gap-1.5 bg-slate-900 text-emerald-400 px-2.5 py-1 rounded-lg font-mono font-black text-base shadow-inner tabular-nums">
                                <span className="text-xs text-emerald-400">⏱️</span>
                                <span>{formatTime(elapsedTime)}</span>
                            </div>
                        </div>

                        {/* Zone 2: 난이도 칩 & 모바일 조작 모드 토글 (36px) */}
                        <div className="h-9 px-1 flex items-center justify-between shrink-0">
                            {/* 난이도 칩 */}
                            <div className="flex gap-1">
                                {(['beginner', 'intermediate', 'expert'] as Difficulty[]).map(d => {
                                    const isSelected = difficulty === d;
                                    const label = d === 'beginner' ? '초급 (9×9)' : d === 'intermediate' ? '중급 (16×16)' : '고급';
                                    return (
                                        <button
                                            key={d}
                                            type="button"
                                            onClick={() => handleChangeDifficulty(d)}
                                            className={`px-2 py-0.5 text-[10px] font-black rounded-md transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'bg-rose-600 text-white shadow-2xs'
                                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* 모바일 원터치 조작 모드 스위치 (파기 vs 깃발) */}
                            <div className="flex bg-slate-200/80 p-0.5 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => {
                                        sound.playClick();
                                        setInteractionMode('dig');
                                    }}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer ${
                                        interactionMode === 'dig'
                                            ? 'bg-blue-600 text-white shadow-2xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <span>⛏️ 파기</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        sound.playClick();
                                        setInteractionMode('flag');
                                    }}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer ${
                                        interactionMode === 'flag'
                                            ? 'bg-rose-600 text-white shadow-2xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <span>🚩 깃발</span>
                                </button>
                            </div>
                        </div>

                        {/* Zone 3: 메인 게임 보드 */}
                        <div 
                            className="flex-1 flex justify-center items-center my-auto py-1"
                            data-screenshot-point="result"
                        >
                            <GameBoard
                                board={board}
                                cols={config.cols}
                                gameStatus={gameStatus}
                                interactionMode={interactionMode}
                                onReveal={handleRevealCell}
                                onFlag={handleToggleFlag}
                                onChord={handleChording}
                            />
                        </div>

                        {/* Zone 4: 실시간 작전 브리핑 인디케이터 (20px) */}
                        <div className="h-6 px-2 bg-white rounded-lg border border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 font-bold shrink-0 shadow-2xs">
                            <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>{gameStatus === 'playing' ? '작전 수행 중' : gameStatus === 'won' ? '미션 완료' : gameStatus === 'lost' ? '작전 실패' : '첫 클릭 대기 중'}</span>
                            </span>
                            <span>우클릭 또는 깃발 모드로 표시</span>
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

                {/* 게임 오버/승리 모달 */}
                <GameOverModal
                    gameStatus={gameStatus}
                    elapsedTime={elapsedTime}
                    difficulty={difficulty}
                    onReset={handleReset}
                    onSaveScore={handleSaveScore}
                    isSaving={isSaving}
                    saveResult={saveResult}
                />

                {/* 리더보드 모달 */}
                <LeaderboardModal
                    isOpen={showLeaderboardModal}
                    difficulty={difficulty}
                    onClose={() => setShowLeaderboardModal(false)}
                />

                {/* E-E-A-T 4대 정책 모달 */}
                <PolicyModal type={policyType} onClose={() => setPolicyType(null)} />
            </main>
        </div>
    );
}

export default App;
