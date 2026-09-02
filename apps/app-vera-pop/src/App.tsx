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
        score,
        combo,
        maxCombo,
        feverGauge,
        isFever,
        timeLeft,
        isGameOver,
        selectedGem,
        effects,
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
        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('vera_pop_high_score', score.toString());
        }
    }, [score, highScore]);

    // 4. 게임 오버 시 점수 서버 전송
    const saveFinalScore = useCallback(async () => {
        if (score <= 0) return;
        try {
            if (user) {
                await axios.post('/api/games/vera-pop/score', {
                    score,
                    metadata: { max_combo: maxCombo },
                }, { withCredentials: true });
                sendToPortal('MISSION_CLEAR');
            }
        } catch (e) {
            console.warn('점수 전송 실패:', e);
        }
    }, [score, maxCombo, user, sendToPortal]);

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
                            ⚡ 60s Speed Match-3
                        </span>
                    </div>

                    {/* 중앙 메인 타이틀 & 3D 네온 젬 비주얼 & 프로그레스 */}
                    <div className="w-full max-w-sm flex flex-col items-center justify-center my-auto text-center py-4">
                        {/* 3D 큐브 네온 젬 비주얼 */}
                        <div className="relative mb-5">
                            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center text-4xl shadow-2xl shadow-indigo-500/30 animate-pulse-glow border-2 border-white">
                                💎
                            </div>
                            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-rose-500 text-white rounded-full px-2 py-0.5 text-[10px] font-black shadow-md">
                                POP!
                            </div>
                        </div>

                        {/* 선명한 게임 타이틀 & 슬로건 */}
                        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-1.5">
                            Vera Pop <span className="text-indigo-600 font-extrabold text-2xl sm:text-3xl">(베라 팝)</span>
                        </h1>
                        <p className="text-xs text-slate-500 font-semibold mb-6">
                            터질수록 짜릿한 60초 네온 젬 스피드 퍼즐!
                        </p>

                        {/* 3초 실시간 로딩 프로그레스 바 */}
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
                
                {/* 상단 HUD: 시간 / 피버 게이지 / 실시간 점수 */}
                <div className="space-y-2 mb-2">
                    {/* 시간 & 최고점수 */}
                    <div className="flex items-center justify-between text-xs px-1">
                        <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 font-bold">⏱️ 남은 시간:</span>
                            <span className={`font-black font-mono text-base px-2 py-0.5 rounded-lg ${
                                timeLeft <= 10 
                                    ? 'bg-rose-100 text-rose-600 animate-bounce' 
                                    : 'bg-slate-100 text-slate-800'
                            }`}>
                                00:{String(timeLeft).padStart(2, '0')}
                            </span>
                        </div>
                        <div className="text-slate-500 font-mono text-xs">
                            🏆 최고: <span className="font-bold text-slate-800">{highScore.toLocaleString('ko-KR')}</span>
                        </div>
                    </div>

                    {/* 피버 게이지 바 */}
                    <div className="w-full bg-slate-200/80 h-3 rounded-full overflow-hidden p-0.5 relative shadow-inner">
                        <div
                            className={`h-full rounded-full transition-all duration-200 ${
                                isFever 
                                    ? 'bg-gradient-to-r from-red-500 via-amber-400 to-yellow-300 animate-pulse' 
                                    : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                            }`}
                            style={{ width: `${isFever ? 100 : feverGauge}%` }}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white drop-shadow-sm">
                            {isFever ? '🔥 HYPER FEVER 2X SCORE! 🔥' : `FEVER ${feverGauge}%`}
                        </div>
                    </div>

                    {/* 실시간 획득 점수 & 콤보 */}
                    <div className="flex items-center justify-between bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs">
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 block">현재 점수</span>
                            <span className="text-2xl font-black text-slate-900 stock-number">
                                {score.toLocaleString('ko-KR')}
                            </span>
                        </div>
                        {combo > 1 && (
                            <div className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-black shadow-sm animate-bounce">
                                🔥 {combo} COMBO!
                            </div>
                        )}
                    </div>
                </div>

                {/* 중앙 8x8 보드 캔버스 */}
                <div className="my-auto flex items-center justify-center">
                    <VeraPopCanvas
                        board={board}
                        selectedGem={selectedGem}
                        isFever={isFever}
                        effects={effects}
                        onCellClick={handleCellClick}
                        onSwipe={swapGems}
                    />
                </div>

                {/* 하단 팁 & 조작 가이드 */}
                <div className="mt-2 text-center text-xs text-slate-500 py-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full font-medium">
                        💡 스와이프하여 같은 색 보석을 3개 이상 연결하세요!
                    </span>
                </div>

                {/* 게임 오버 모달 */}
                {isGameOver && (
                    <GameOverModal
                        score={score}
                        maxCombo={maxCombo}
                        onRestart={startNewGame}
                        user={user}
                    />
                )}
            </div>
        </MiniAppLayout>
    );
}
