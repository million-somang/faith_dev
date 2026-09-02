import { useState, useEffect, useCallback } from 'react';
import { MiniAppLayout, useAuth, usePortalMessenger } from '@faithportal/mini-app-sdk';
import { useVeraPopEngine } from './hooks/useVeraPopEngine';
import VeraPopCanvas from './components/VeraPopCanvas';
import GameOverModal from './components/GameOverModal';
import BannerSlot from './components/BannerSlot';
import { soundManager } from './utils/audio';
import axios from 'axios';

export default function App() {
    const { user } = useAuth();
    const { sendToPortal } = usePortalMessenger();

    // ⏱️ 로딩 화면 상태 (정확히 3000ms 유지)
    const [isLoading, setIsLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [highScore, setHighScore] = useState(0);

    const {
        board,
        stage,
        stageScore,
        targetScore,
        totalScore,
        combo,
        maxCombo,
        feverGauge,
        isFever,
        timeLeft,
        isGameOver,
        selectedGem,
        effects,
        stageClearEvent,
        handleCellClick,
        swapGems,
        startNewGame,
    } = useVeraPopEngine({ isActive: !isLoading });

    // 1. 정확히 3초 (3000ms) 로딩 타이머 및 프로그레스 바
    useEffect(() => {
        const interval = setInterval(() => {
            setLoadingProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 4;
            });
        }, 120);

        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 3000);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, []);

    // 2. 최고 기록 로컬스토리지 불러오기
    useEffect(() => {
        const saved = localStorage.getItem('vera_pop_high_score');
        if (saved) setHighScore(parseInt(saved, 10));
    }, []);

    // 3. 점수 갱신 및 저장
    useEffect(() => {
        if (totalScore > highScore) {
            setHighScore(totalScore);
            localStorage.setItem('vera_pop_high_score', totalScore.toString());
        }
    }, [totalScore, highScore]);

    // 4. 게임 오버 시 점수 서버 전송
    const saveFinalScore = useCallback(async () => {
        if (totalScore <= 0) return;
        try {
            if (user) {
                await axios.post('/api/games/vera-pop/score', {
                    score: totalScore,
                    metadata: { max_combo: maxCombo, stage },
                }, { withCredentials: true });
                sendToPortal('MISSION_CLEAR');
            }
        } catch (e) {
            console.warn('점수 전송 실패:', e);
        }
    }, [totalScore, maxCombo, stage, user, sendToPortal]);

    useEffect(() => {
        if (isGameOver) {
            saveFinalScore();
        }
    }, [isGameOver, saveFinalScore]);

    const toggleSound = () => {
        const muted = soundManager.toggleMute();
        setIsMuted(muted);
    };

    // ⏱️ 3초 로딩 화면 (Clean Neumorphism & 밝은 배경)
    if (isLoading) {
        return (
            <MiniAppLayout title="">
                <div className="h-[100dvh] w-full flex flex-col justify-between items-center bg-gradient-to-b from-slate-50 via-white to-indigo-50/25 p-5 select-none animate-fade-in overflow-hidden">
                    
                    {/* 상단 브랜딩 & 기준 배지 */}
                    <div className="w-full max-w-sm flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
                            <span className="text-xs font-black text-slate-500 tracking-wider uppercase">FAITH PORTAL MINI GAME</span>
                        </div>
                        <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-3 py-1 rounded-full">
                            ⚡ Stage Speed Match-3
                        </span>
                    </div>

                    {/* 중앙 메인 타이틀 & 3D 네온 젬 비주얼 & 프로그레스 */}
                    <div className="w-full max-w-sm flex flex-col items-center justify-center my-auto text-center py-4">
                        <div className="relative mb-5">
                            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center text-4xl shadow-2xl shadow-indigo-500/30 animate-pulse-glow border-2 border-white">
                                💎
                            </div>
                            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-rose-500 text-white rounded-full px-2 py-0.5 text-[10px] font-black shadow-md">
                                POP!
                            </div>
                        </div>

                        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-1.5">
                            Vera Pop <span className="text-indigo-600 font-extrabold text-2xl sm:text-3xl">(베라 팝)</span>
                        </h1>
                        <p className="text-xs text-slate-500 font-semibold mb-6">
                            스테이지 목표 점수를 돌파하고 무한 레벨업에 도전하세요!
                        </p>

                        <div className="w-full max-w-xs space-y-1.5">
                            <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden p-0.5 shadow-inner">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-150"
                                    style={{ width: `${loadingProgress}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                                <span>네온 젬 에셋 동기화 중…</span>
                                <span className="font-bold text-indigo-600">{loadingProgress}%</span>
                            </div>
                        </div>
                    </div>

                    {/* 하단 🌟 배너 광고 슬롯 */}
                    <div className="w-full pb-2">
                        <BannerSlot slotKey="game_loading_bottom" />
                    </div>
                </div>
            </MiniAppLayout>
        );
    }

    const stageProgressPercent = Math.min(100, Math.floor((stageScore / targetScore) * 100));

    // 🎮 게임 메인 보드 화면
    return (
        <MiniAppLayout
            title="Vera Pop"
            headerRight={
                <button
                    type="button"
                    onClick={toggleSound}
                    className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
                    aria-label="사운드 토글"
                >
                    <i className={`fas ${isMuted ? 'fa-volume-mute text-slate-400' : 'fa-volume-up text-indigo-600'}`}></i>
                </button>
            }
        >
            <div className="min-h-full flex flex-col justify-between p-3 sm:p-4 max-w-md mx-auto relative select-none">
                
                {/* 상단 HUD: 스테이지 배지 / 타이머 / 최고점수 / 목표 게이지 */}
                <div className="space-y-2 mb-2">
                    
                    {/* 1. 스테이지 뱃지 & 시간 & 최고기록 */}
                    <div className="flex items-center justify-between text-xs px-1">
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-indigo-600 text-white font-black text-xs rounded-xl shadow-xs tracking-wide flex items-center gap-1">
                                <span>STAGE</span>
                                <span className="text-yellow-300 font-black">{stage}</span>
                            </span>
                            <span className={`font-black font-mono text-sm px-2 py-0.5 rounded-lg ${
                                timeLeft <= 10 
                                    ? 'bg-rose-100 text-rose-600 animate-bounce' 
                                    : 'bg-slate-100 text-slate-800'
                            }`}>
                                ⏱️ 00:{String(timeLeft).padStart(2, '0')}
                            </span>
                        </div>
                        <div className="text-slate-500 font-mono text-xs">
                            🏆 최고: <span className="font-bold text-slate-800">{highScore.toLocaleString('ko-KR')}</span>
                        </div>
                    </div>

                    {/* 2. 🎯 스테이지 목표 점수 프로그레스 바 */}
                    <div className="bg-slate-900 text-white rounded-2xl p-2.5 shadow-sm border border-slate-800">
                        <div className="flex justify-between items-center text-[11px] font-bold mb-1.5 px-0.5">
                            <span className="text-indigo-300 flex items-center gap-1">
                                <span>🎯 STAGE GOAL:</span>
                                <span className="text-white font-black">{stageScore.toLocaleString('ko-KR')}</span>
                                <span className="text-slate-400 font-normal">/ {targetScore.toLocaleString('ko-KR')}</span>
                            </span>
                            <span className="text-yellow-400 font-black font-mono">{stageProgressPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 relative shadow-inner">
                            <div
                                className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
                                style={{ width: `${stageProgressPercent}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* 3. 누적 총점 & 피버 바 */}
                    <div className="flex items-center justify-between bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 shadow-xs">
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 block">누적 합산 총점</span>
                            <span className="text-xl sm:text-2xl font-black text-slate-900 stock-number">
                                {totalScore.toLocaleString('ko-KR')}
                            </span>
                        </div>

                        {/* 피버 게이지 미니 */}
                        <div className="w-36 text-right">
                            <div className="flex justify-between text-[10px] font-black mb-1">
                                <span className={isFever ? 'text-red-500 animate-pulse' : 'text-slate-500'}>
                                    {isFever ? '🔥 FEVER 2X' : 'FEVER GAUGE'}
                                </span>
                                <span className="font-mono text-slate-700">{isFever ? 'MAX' : `${feverGauge}%`}</span>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-200 ${
                                        isFever ? 'bg-gradient-to-r from-red-500 to-amber-400' : 'bg-indigo-600'
                                    }`}
                                    style={{ width: `${isFever ? 100 : feverGauge}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {combo > 1 && (
                        <div className="text-center">
                            <span className="inline-block px-3 py-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full text-xs font-black shadow-sm animate-bounce">
                                🔥 {combo} COMBO!
                            </span>
                        </div>
                    )}
                </div>

                {/* 중앙 8x8 보드 캔버스 & 스테이지 클리어 팝업 */}
                <div className="my-auto flex items-center justify-center relative">
                    <VeraPopCanvas
                        board={board}
                        selectedGem={selectedGem}
                        isFever={isFever}
                        effects={effects}
                        onCellClick={handleCellClick}
                        onSwipe={swapGems}
                    />

                    {/* 🌟 스테이지 클리어 / 레벨업 축하 오버레이 */}
                    {stageClearEvent && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none animate-scale-up">
                            <div className="bg-slate-900/90 text-white px-6 py-4 rounded-3xl border-2 border-yellow-400 shadow-2xl text-center backdrop-blur-md">
                                <div className="text-3xl mb-1">🌟 STAGE CLEAR! 🌟</div>
                                <div className="text-lg font-black text-yellow-300">
                                    STAGE {stageClearEvent.stage} 진입!
                                </div>
                                <div className="text-xs text-cyan-300 font-bold mt-1">
                                    ⏱️ 남은 시간 보너스 +{stageClearEvent.bonus.toLocaleString()}점 & 시간 60초 충전!
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 하단 팁 & 조작 가이드 */}
                <div className="mt-2 text-center text-xs text-slate-500 py-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full font-medium">
                        💡 60초 내에 목표 점수를 달성하면 시간이 60초로 다시 충전됩니다!
                    </span>
                </div>

                {/* 게임 오버 모달 */}
                {isGameOver && (
                    <GameOverModal
                        score={totalScore}
                        stage={stage}
                        maxCombo={maxCombo}
                        onRestart={startNewGame}
                        user={user}
                    />
                )}
            </div>
        </MiniAppLayout>
    );
}

