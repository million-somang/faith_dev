import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth, usePortalMessenger } from '@faithportal/mini-app-sdk';
import { useGame2048, getMaxTile } from './hooks/useGame2048';
import { use2048Sound } from './hooks/use2048Sound';
import GameBoard from './components/GameBoard';
import GameOverModal from './components/GameOverModal';
import WinModal from './components/WinModal';
import Guide2048Tab from './components/Guide2048Tab';
import Faq2048Tab from './components/Faq2048Tab';
import Leaderboard2048Tab from './components/Leaderboard2048Tab';
import PolicyModal, { type PolicyType } from './components/PolicyModal';
import axios from 'axios';

type TabType = 'game' | 'leaderboard' | 'guide' | 'faq';

function App() {
    const { user, isLoading: authLoading } = useAuth();
    const { sendToPortal } = usePortalMessenger();

    // 1. 스플래시 로딩 상태 (4초 = 4000ms, 1% -> 100%)
    const [isSplashLoading, setIsSplashLoading] = useState(true);
    const [splashProgress, setSplashProgress] = useState(1);

    // 2. 탭 및 정책 모달 상태
    const [activeTab, setActiveTab] = useState<TabType>('game');
    const [policyModal, setPolicyModal] = useState<PolicyType | null>(null);

    // 3. 사운드 훅
    const {
        isMuted,
        toggleMute,
        playSlideSound,
        playMergeSound,
        playUndoSound,
        playGameOverSound,
        playWinSound
    } = use2048Sound();

    // 4. 2048 게임 훅
    const {
        grid,
        score,
        best,
        undosLeft,
        hasWon,
        isGameOver,
        move: baseMove,
        undo: baseUndo,
        newGame: baseNewGame,
        dismissWin,
        dismissGameOver,
    } = useGame2048();

    const maxTile = getMaxTile(grid);
    const prevScoreRef = useRef(score);

    // 터치/스와이프 감지용 ref
    const touchStartRef = useRef({ x: 0, y: 0 });

    // 4초 스플래시 프로그레스 타이머
    useEffect(() => {
        const duration = 4000;
        const intervalTime = 40;
        const step = 100 / (duration / intervalTime);

        const timer = setInterval(() => {
            setSplashProgress(prev => {
                const next = prev + step;
                if (next >= 100) {
                    clearInterval(timer);
                    setTimeout(() => setIsSplashLoading(false), 250);
                    return 100;
                }
                return Math.floor(next);
            });
        }, intervalTime);

        return () => clearInterval(timer);
    }, []);

    // 이동 래퍼 (사운드 연동)
    const handleMove = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
        const prevScore = score;
        baseMove(direction);

        // 점수 상승 시 합체음, 그렇지 않으면 슬라이드음
        setTimeout(() => {
            if (prevScoreRef.current > prevScore) {
                const delta = prevScoreRef.current - prevScore;
                playMergeSound(delta);
            } else {
                playSlideSound();
            }
        }, 30);
    }, [baseMove, score, playSlideSound, playMergeSound]);

    useEffect(() => {
        prevScoreRef.current = score;
    }, [score]);

    // 되돌리기 래퍼
    const handleUndo = useCallback(() => {
        if (undosLeft > 0) {
            playUndoSound();
            baseUndo();
        }
    }, [undosLeft, baseUndo, playUndoSound]);

    // 새 게임 래퍼
    const handleNewGame = useCallback(() => {
        playSlideSound();
        baseNewGame();
    }, [baseNewGame, playSlideSound]);

    // 키보드 이벤트 (방향키 및 WASD)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (activeTab !== 'game' || isSplashLoading) return;
            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    e.preventDefault();
                    handleMove('left');
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault();
                    handleMove('right');
                    break;
                case 'ArrowUp':
                case 'w':
                case 'W':
                    e.preventDefault();
                    handleMove('up');
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    e.preventDefault();
                    handleMove('down');
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleMove, activeTab, isSplashLoading]);

    // 모바일 터치/스와이프 이벤트
    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            touchStartRef.current = {
                x: e.changedTouches[0].screenX,
                y: e.changedTouches[0].screenY,
            };
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (activeTab !== 'game' || isSplashLoading) return;
            const dx = e.changedTouches[0].screenX - touchStartRef.current.x;
            const dy = e.changedTouches[0].screenY - touchStartRef.current.y;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);

            if (Math.max(absDx, absDy) < 25) return;

            if (absDx > absDy) {
                handleMove(dx > 0 ? 'right' : 'left');
            } else {
                handleMove(dy > 0 ? 'down' : 'up');
            }
        };

        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleMove, activeTab, isSplashLoading]);

    // 게임 종료 / 승리 사운드 트리거
    useEffect(() => {
        if (isGameOver) {
            playGameOverSound();
        }
    }, [isGameOver, playGameOverSound]);

    useEffect(() => {
        if (hasWon) {
            playWinSound();
        }
    }, [hasWon, playWinSound]);

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
            sendToPortal('MISSION_CLEAR');
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

    // 공유하기 핸들러
    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: '베라 2048 - 무료 온라인 클래식 두뇌 슬라이드 퍼즐',
                text: `베라 2048에서 현재 점수 ${score.toLocaleString()}점, 최대 ${maxTile} 타일을 달성했습니다! 함께 도전해보세요!`,
                url: window.location.href,
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('게임 링크가 클립보드에 복사되었습니다!');
        }
    };

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
                    <span className="text-[11px] font-black text-purple-700 bg-purple-50 border border-purple-200/80 px-3 py-1 rounded-full shadow-2xs">
                        2026 공인 기준 준수
                    </span>
                </div>

                {/* 중앙 3D 비주얼 & 1~100% 프로그레스 바 */}
                <div className="w-full max-w-sm flex flex-col items-center justify-center my-auto py-6 text-center">
                    <div className="relative mb-5">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 text-white flex items-center justify-center text-3xl shadow-xl shadow-purple-500/20 border-2 border-white animate-bounce-soft">
                            <span className="font-black text-2xl tracking-tighter">2048</span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-white text-emerald-600 rounded-full p-1.5 shadow-md border border-slate-100 text-xs">
                            <i className="fas fa-shield-halved"></i>
                        </div>
                    </div>

                    <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
                        베라 2048
                    </h1>
                    <p className="text-xs font-bold text-slate-700 mb-1">
                        2026 공인 클래식 숫자 슬라이드 퍼즐
                    </p>
                    <p className="text-[11px] text-slate-400 mb-5 max-w-xs leading-relaxed">
                        수학적 기하학 정렬과 코너 락 전략으로 완성하는 두뇌 지능 엔진
                    </p>

                    {/* 실시간 1~100% 프로그레스 바 */}
                    <div className="w-full max-w-xs space-y-1.5 mb-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 px-1">
                            <span>수학적 매트릭스 그리드 동기화 중</span>
                            <span className="font-black text-purple-600 text-xs tabular-nums">{splashProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 border border-slate-200 h-2.5 rounded-full overflow-hidden p-0.5 shadow-inner">
                            <div
                                className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 rounded-full transition-all duration-75 ease-out"
                                style={{ width: `${splashProgress}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-purple-600">
                        <i className="fas fa-spinner fa-spin text-xs"></i>
                        <span>보안 채널 연결 및 모듈 로딩 중... ({splashProgress}%)</span>
                    </div>
                </div>

                {/* 하단 제휴 광고 배너 슬롯 */}
                <div className="w-full max-w-sm flex flex-col items-center gap-2 pb-1">
                    <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 text-sm shadow-2xs">
                                <i className="fas fa-bullhorn"></i>
                            </div>
                            <div className="text-left min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-black text-purple-600 uppercase bg-purple-50 px-1.5 py-0.2 rounded border border-purple-100">AD</span>
                                    <span className="text-xs font-bold text-slate-800 truncate">2026 베라 브레인 챌린지</span>
                                </div>
                                <span className="text-[10px] text-slate-400 truncate block">매일 5분 두뇌 피트니스 루틴</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="shrink-0 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-black rounded-lg border border-purple-200 transition-colors cursor-pointer"
                        >
                            확인
                        </button>
                    </div>
                    <span className="text-[10px] text-slate-400">© 2026 VeraNex. All rights reserved.</span>
                </div>
            </div>
        );
    }

    // 2. [메인 뷰포트] 450px × 850px 규격 내 680px 1화면 완결 레이아웃
    return (
        <div className="h-screen max-h-[850px] w-full max-w-[450px] mx-auto bg-slate-50 flex flex-col justify-between overflow-hidden select-none font-sans text-slate-800">
            {/* 1. 상단 단일 원라인 글로벌 헤더 (36px) */}
            <header className="h-9 px-3.5 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0 shadow-2xs">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-purple-600 to-amber-500 text-white flex items-center justify-center text-[10px] shadow-2xs font-black">
                        <i className="fas fa-cube"></i>
                    </div>
                    <span className="text-xs font-black text-slate-900 tracking-tight">베라 2048</span>
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-200/80 px-1.5 py-0.2 rounded-full">
                        2026 PRO
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={toggleMute}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors cursor-pointer ${
                            isMuted ? 'text-slate-400 hover:text-slate-600' : 'text-purple-600 bg-purple-50 hover:bg-purple-100'
                        }`}
                        title={isMuted ? '음소거 해제' : '음소거'}
                    >
                        <i className={`fas ${isMuted ? 'fa-volume-xmark' : 'fa-volume-high'}`}></i>
                    </button>
                    <button
                        onClick={handleShare}
                        className="w-7 h-7 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 flex items-center justify-center text-xs transition-colors cursor-pointer"
                        title="공유하기"
                    >
                        <i className="fas fa-share-nodes"></i>
                    </button>
                    <button
                        onClick={() => window.close()}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center text-xs transition-colors cursor-pointer"
                        title="창 닫기"
                    >
                        <i className="fas fa-xmark"></i>
                    </button>
                </div>
            </header>

            {/* 2. 알약 탭 네비게이션 (34px) */}
            <nav className="h-[34px] px-2.5 bg-white border-b border-slate-200/60 flex items-center gap-1 shrink-0">
                <button
                    onClick={() => setActiveTab('game')}
                    className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-black whitespace-nowrap transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        activeTab === 'game'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-500 hover:bg-slate-100'
                    }`}
                >
                    <i className="fas fa-gamepad text-[10px]"></i>
                    <span>2048 게임</span>
                </button>
                <button
                    onClick={() => setActiveTab('leaderboard')}
                    className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-black whitespace-nowrap transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        activeTab === 'leaderboard'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-500 hover:bg-slate-100'
                    }`}
                >
                    <i className="fas fa-trophy text-[10px]"></i>
                    <span>명예의 전당</span>
                </button>
                <button
                    onClick={() => setActiveTab('guide')}
                    className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-black whitespace-nowrap transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        activeTab === 'guide'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-500 hover:bg-slate-100'
                    }`}
                >
                    <i className="fas fa-book-open text-[10px]"></i>
                    <span>공략 가이드</span>
                </button>
                <button
                    onClick={() => setActiveTab('faq')}
                    className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-black whitespace-nowrap transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        activeTab === 'faq'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-500 hover:bg-slate-100'
                    }`}
                >
                    <i className="fas fa-circle-question text-[10px]"></i>
                    <span>FAQ</span>
                </button>
            </nav>

            {/* 3. 탭별 메인 컨텐츠 영역 */}
            {activeTab === 'guide' && <Guide2048Tab />}
            {activeTab === 'faq' && <Faq2048Tab />}
            {activeTab === 'leaderboard' && (
                <Leaderboard2048Tab
                    bestScore={best}
                    currentScore={score}
                    maxTile={maxTile}
                />
            )}

            {activeTab === 'game' && (
                <main className="flex-1 flex flex-col justify-between p-3 overflow-hidden">
                    {/* Zone 1: 상단 원라인 통합 전광판 (HUD) */}
                    <div className="grid grid-cols-3 gap-2 shrink-0">
                        {/* 1. 현재 점수 카드 */}
                        <div className="bg-white rounded-xl p-2 border border-slate-200 shadow-2xs text-center">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">SCORE</div>
                            <div className="text-sm font-black text-slate-900 tabular-nums">
                                {score.toLocaleString()}
                            </div>
                        </div>

                        {/* 2. 최고 기록 카드 */}
                        <div className="bg-white rounded-xl p-2 border border-slate-200 shadow-2xs text-center">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">BEST</div>
                            <div className="text-sm font-black text-purple-600 tabular-nums">
                                {best.toLocaleString()}
                            </div>
                        </div>

                        {/* 3. 달성 최대 타일 & UNDO 잔여 */}
                        <div className="bg-white rounded-xl p-2 border border-slate-200 shadow-2xs text-center flex flex-col justify-center">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">MAX TILE</div>
                            <div className="text-sm font-black text-amber-500 tabular-nums">
                                {maxTile}
                            </div>
                        </div>
                    </div>

                    {/* Zone 2: 액션 툴바 (새 게임 & 되돌리기) */}
                    <div className="flex items-center justify-between gap-2 shrink-0">
                        <button
                            onClick={handleNewGame}
                            className="flex-1 h-8 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-700 flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer active:scale-95"
                        >
                            <i className="fas fa-rotate text-purple-600 text-[11px]"></i>
                            <span>새 게임</span>
                        </button>
                        <button
                            onClick={handleUndo}
                            disabled={undosLeft <= 0}
                            className="flex-1 h-8 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-700 flex items-center justify-center gap-1.5 shadow-2xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                        >
                            <i className="fas fa-arrow-rotate-left text-amber-600 text-[11px]"></i>
                            <span>되돌리기 ({undosLeft})</span>
                        </button>
                    </div>

                    {/* Zone 3: 메인 2048 컴팩트 보드 (288px × 288px) */}
                    <div className="flex items-center justify-center shrink-0 my-auto">
                        <GameBoard grid={grid} />
                    </div>

                    {/* Zone 4: 모바일 가상 방향키 & 슬라이드 안내 가이드 */}
                    <div className="shrink-0 flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1.5">
                            <button
                                data-screenshot-click="action"
                                onClick={() => handleMove('left')}
                                className="w-10 h-7 rounded-lg bg-white border border-slate-200 shadow-2xs text-slate-600 hover:text-purple-600 hover:border-purple-300 flex items-center justify-center text-xs transition-colors cursor-pointer active:scale-90"
                                title="왼쪽으로 밀기"
                            >
                                <i className="fas fa-arrow-left"></i>
                            </button>
                            <div className="flex flex-col gap-1">
                                <button
                                    onClick={() => handleMove('up')}
                                    className="w-10 h-7 rounded-lg bg-white border border-slate-200 shadow-2xs text-slate-600 hover:text-purple-600 hover:border-purple-300 flex items-center justify-center text-xs transition-colors cursor-pointer active:scale-90"
                                    title="위로 밀기"
                                >
                                    <i className="fas fa-arrow-up"></i>
                                </button>
                                <button
                                    data-screenshot-click="result"
                                    onClick={() => handleMove('down')}
                                    className="w-10 h-7 rounded-lg bg-white border border-slate-200 shadow-2xs text-slate-600 hover:text-purple-600 hover:border-purple-300 flex items-center justify-center text-xs transition-colors cursor-pointer active:scale-90"
                                    title="아래로 밀기"
                                >
                                    <i className="fas fa-arrow-down"></i>
                                </button>
                            </div>
                            <button
                                onClick={() => handleMove('right')}
                                className="w-10 h-7 rounded-lg bg-white border border-slate-200 shadow-2xs text-slate-600 hover:text-purple-600 hover:border-purple-300 flex items-center justify-center text-xs transition-colors cursor-pointer active:scale-90"
                                title="오른쪽으로 밀기"
                            >
                                <i className="fas fa-arrow-right"></i>
                            </button>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                            스와이프 또는 방향키(WASD)로 조작하세요
                        </span>
                    </div>
                </main>
            )}

            {/* 4. 하단 도킹 푸터 & E-E-A-T 정책 링크 (30px) */}
            <footer className="h-[30px] px-3 bg-white border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
                <div className="flex items-center gap-1.5">
                    <i className="fas fa-shield-halved text-emerald-500"></i>
                    <span>공인 표준 엔진 • 100% 로컬 보안</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <button onClick={() => setPolicyModal('about')} className="hover:text-slate-800 transition-colors cursor-pointer">소개</button>
                    <span>•</span>
                    <button onClick={() => setPolicyModal('privacy')} className="hover:text-slate-800 transition-colors cursor-pointer">개인정보</button>
                    <span>•</span>
                    <button onClick={() => setPolicyModal('terms')} className="hover:text-slate-800 transition-colors cursor-pointer">약관</button>
                    <span>•</span>
                    <button onClick={() => setPolicyModal('contact')} className="hover:text-slate-800 transition-colors cursor-pointer">문의</button>
                </div>
            </footer>

            {/* 게임 오버 & 승리 모달 */}
            <GameOverModal
                isOpen={isGameOver}
                score={score}
                maxTile={maxTile}
                onClose={dismissGameOver}
                onNewGame={handleNewGame}
            />
            <WinModal
                isOpen={hasWon}
                onContinue={dismissWin}
                onNewGame={handleNewGame}
            />

            {/* E-E-A-T 정책 모달 */}
            <PolicyModal
                isOpen={policyModal !== null}
                type={policyModal || 'about'}
                onClose={() => setPolicyModal(null)}
            />
        </div>
    );
}

export default App;
