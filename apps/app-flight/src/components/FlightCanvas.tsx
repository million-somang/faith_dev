import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  GameEngineState,
  createInitialState,
  updateGameEngine,
  renderGameEngine,
  triggerPlayerRoll,
  triggerPlayerBomb,
  applyPlayerUpgrade,
  proceedFromHangar,
  extractSaveState,
  restoreFromSaveState,
  UpgradeOptionId,
  FlightSaveState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from '../engine/gameLoop';
import { DifficultyRank } from '../engine/types';
import { Heart, Bomb, RotateCw, Zap, Play, Gauge, ShieldAlert, Wrench, Rocket, Shield, Sparkles, Save, CheckCircle2, Lock } from 'lucide-react';

interface FlightCanvasProps {
  onGameOver: (score: number, kills: number, highScore: number) => void;
  onStateUpdate?: (state: GameEngineState) => void;
  highScore?: number;
  isLoggedIn?: boolean;
  savedState?: FlightSaveState | null;
  onSaveStageProgress?: (save: FlightSaveState) => Promise<boolean>;
  rollTriggerRequested?: number;
  bombTriggerRequested?: number;
  restartTriggerRequested?: number;
}

export const FlightCanvas: React.FC<FlightCanvasProps> = ({
  onGameOver,
  onStateUpdate,
  highScore = 0,
  isLoggedIn = false,
  savedState = null,
  onSaveStageProgress,
  rollTriggerRequested = 0,
  bombTriggerRequested = 0,
  restartTriggerRequested = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameOverReportedRef = useRef<boolean>(false);
  const prevRestartRef = useRef<number>(restartTriggerRequested);

  // 저장된 게임 속도 로드 (기본값: 1.0)
  const [gameSpeed, setGameSpeed] = useState<number>(() => {
    try {
      const s = localStorage.getItem('vera_flight_game_speed');
      if (s) {
        const val = parseFloat(s);
        if (val === 0.7 || val === 1.0 || val === 1.3) return val;
      }
    } catch {
      // ignore
    }
    return 1.0;
  });

  const gameSpeedRef = useRef<number>(gameSpeed);
  const lastTouchTimeRef = useRef<number>(0);
  const stateRef = useRef<GameEngineState>(createInitialState(gameSpeed));
  const keysRef = useRef<{
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    shoot: boolean;
  }>({
    left: false,
    right: false,
    up: false,
    down: false,
    shoot: true, // 자동 사격 기본 활성화
  });

  const touchDragRef = useRef<{
    active: boolean;
    touchId: number | null;
    lastX: number;
    lastY: number;
  }>({
    active: false,
    touchId: null,
    lastX: 0,
    lastY: 0,
  });

  const mouseDragRef = useRef<{
    active: boolean;
    lastX: number;
    lastY: number;
  }>({
    active: false,
    lastX: 0,
    lastY: 0,
  });

  const [hudState, setHudState] = useState<{
    score: number;
    stage: number;
    hp: number;
    maxHp: number;
    lives: number;
    bombs: number;
    rolls: number;
    weaponLevel: number;
    missileLevel: number;
    plasmaLevel: number;
    firepowerLevel: number;
    speedLevel: number;
    hullLevel: number;
    upgradePoints: number;
    stageKills: number;
    hasEscorts: boolean;
    kills: number;
    status: string;
    difficultyRank: DifficultyRank;
  }>({
    score: 0,
    stage: 1,
    hp: 100,
    maxHp: 100,
    lives: 3,
    bombs: 2,
    rolls: 3,
    weaponLevel: 1,
    missileLevel: 0,
    plasmaLevel: 0,
    firepowerLevel: 0,
    speedLevel: 0,
    hullLevel: 0,
    upgradePoints: 0,
    stageKills: 0,
    hasEscorts: false,
    kills: 0,
    status: 'ready',
    difficultyRank: 'NORMAL',
  });

  const syncHudFromEngine = useCallback(() => {
    const state = stateRef.current;
    setHudState({
      score: state.player.score,
      stage: state.stage || 1,
      hp: state.player.hp,
      maxHp: state.player.maxHp || 100,
      lives: state.player.lives,
      bombs: state.player.bombs,
      rolls: state.player.rolls,
      weaponLevel: state.player.weaponLevel,
      missileLevel: state.player.missileLevel || 0,
      plasmaLevel: state.player.plasmaLevel || 0,
      firepowerLevel: state.player.firepowerLevel || 0,
      speedLevel: state.player.speedLevel || 0,
      hullLevel: state.player.hullLevel || 0,
      upgradePoints: state.player.upgradePoints || 0,
      stageKills: state.player.stageKills || 0,
      hasEscorts: state.player.hasEscorts,
      kills: state.player.kills,
      status: state.status,
      difficultyRank: state.difficultyRank || 'NORMAL',
    });
    if (onStateUpdate) {
      onStateUpdate({ ...state, player: { ...state.player } });
    }
  }, [onStateUpdate]);

  const [isSavingStage, setIsSavingStage] = useState<boolean>(false);
  const [stageSavedNotice, setStageSavedNotice] = useState<boolean>(false);

  const handleUpgrade = useCallback(
    (option: UpgradeOptionId) => {
      if (applyPlayerUpgrade(stateRef.current, option)) {
        setStageSavedNotice(false); // 개조 변경 시 다시 세이브할 수 있도록 활성화
        syncHudFromEngine();
      }
    },
    [syncHudFromEngine]
  );

  const handleSaveInHangar = useCallback(async () => {
    if (!isLoggedIn || !onSaveStageProgress || isSavingStage) return;
    setIsSavingStage(true);
    try {
      const snapshot = extractSaveState(stateRef.current);
      const ok = await onSaveStageProgress(snapshot);
      if (ok) {
        setStageSavedNotice(true);
      }
    } finally {
      setIsSavingStage(false);
    }
  }, [isLoggedIn, onSaveStageProgress, isSavingStage]);

  const handleLaunchNextStage = useCallback(() => {
    setStageSavedNotice(false);
    proceedFromHangar(stateRef.current);
    syncHudFromEngine();
  }, [syncHudFromEngine]);

  // 속도 변경 핸들러
  const handleSelectSpeed = useCallback((newSpeed: number) => {
    gameSpeedRef.current = newSpeed;
    setGameSpeed(newSpeed);
    stateRef.current.gameSpeed = newSpeed;
    try {
      localStorage.setItem('vera_flight_game_speed', String(newSpeed));
    } catch {
      // ignore
    }

    if (stateRef.current.status === 'playing') {
      const label =
        newSpeed === 0.7
          ? '속도 0.7x (초보자 모드)'
          : newSpeed === 1.3
          ? '속도 1.3x (고속 모드)'
          : '속도 1.0x (표준 모드)';
      const color = newSpeed === 0.7 ? '#10B981' : newSpeed === 1.3 ? '#EF4444' : '#0284C7';
      stateRef.current.floatingTexts.push({
        id: Date.now(),
        text: label,
        x: stateRef.current.player.x,
        y: stateRef.current.player.y - 35,
        color,
        alpha: 1,
        vy: -1.2,
      });
    }
  }, []);

  // 상단 바 클릭 시 0.7x ➔ 1.0x ➔ 1.3x 순환 변경
  const handleCycleSpeed = useCallback(() => {
    const current = gameSpeedRef.current;
    const next = current === 0.7 ? 1.0 : current === 1.0 ? 1.3 : 0.7;
    handleSelectSpeed(next);
  }, [handleSelectSpeed]);

  // 게임 시작 트리거 (새 게임 STAGE 1)
  const handleStartGame = useCallback(() => {
    const activeSpeed = gameSpeedRef.current;
    gameOverReportedRef.current = false;
    setStageSavedNotice(false);
    stateRef.current = createInitialState(activeSpeed);
    stateRef.current.gameSpeed = activeSpeed;
    stateRef.current.player.highScore = Math.max(stateRef.current.player.highScore, highScore);
    stateRef.current.status = 'playing';
    syncHudFromEngine();
  }, [highScore, syncHudFromEngine]);

  // 저장된 세이브 데이터로부터 이어하기 트리거
  const handleContinueSavedGame = useCallback(() => {
    if (!savedState) return;
    const activeSpeed = gameSpeedRef.current;
    gameOverReportedRef.current = false;
    setStageSavedNotice(false);
    stateRef.current = createInitialState(activeSpeed);
    stateRef.current.gameSpeed = activeSpeed;
    stateRef.current.player.highScore = Math.max(stateRef.current.player.highScore, highScore);
    restoreFromSaveState(stateRef.current, savedState);
    syncHudFromEngine();
  }, [savedState, highScore, syncHudFromEngine]);

  // 외부(게임오버 모달 등)에서 재시작 요청 처리
  useEffect(() => {
    if (restartTriggerRequested > 0 && restartTriggerRequested !== prevRestartRef.current) {
      const activeSpeed = gameSpeedRef.current;
      prevRestartRef.current = restartTriggerRequested;
      gameOverReportedRef.current = false;
      stateRef.current = createInitialState(activeSpeed);
      stateRef.current.gameSpeed = activeSpeed;
      stateRef.current.player.highScore = Math.max(stateRef.current.player.highScore, highScore);
      stateRef.current.status = 'playing';
      syncHudFromEngine();
    }
  }, [restartTriggerRequested, highScore, syncHudFromEngine]);

  // 외부(버튼 등)에서 롤 요청 처리
  useEffect(() => {
    if (rollTriggerRequested > 0 && stateRef.current.status === 'playing') {
      triggerPlayerRoll(stateRef.current);
    }
  }, [rollTriggerRequested]);

  // 외부에서 폭탄 요청 처리
  useEffect(() => {
    if (bombTriggerRequested > 0 && stateRef.current.status === 'playing') {
      triggerPlayerBomb(stateRef.current);
    }
  }, [bombTriggerRequested]);

  // 키보드 이벤트 리스너 바인딩
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keysRef.current.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keysRef.current.right = true;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') keysRef.current.up = true;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') keysRef.current.down = true;
      if (e.code === 'Space') {
        keysRef.current.shoot = true;
        if (s.status === 'ready') handleStartGame();
      }
      if (e.code === 'KeyZ' || e.code === 'KeyJ') {
        triggerPlayerRoll(s);
      }
      if (e.code === 'KeyX' || e.code === 'KeyK') {
        triggerPlayerBomb(s);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keysRef.current.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keysRef.current.right = false;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') keysRef.current.up = false;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') keysRef.current.down = false;
      // Space 떼어도 기본 자동 사격 유지
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleStartGame]);

  // 상대 드래그 이동 적용 헬퍼 (선택된 gameSpeed 배율 반영)
  const applyRelativeMove = (screenDeltaX: number, screenDeltaY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const state = stateRef.current;
    if (state.status !== 'playing') return;

    const speedFactor = gameSpeedRef.current || state.gameSpeed || 1.0;
    const p = state.player;
    p.x += screenDeltaX * scaleX * speedFactor;
    p.y += screenDeltaY * scaleY * speedFactor;

    // 캔버스 화면 경계 클램핑
    const halfW = p.width / 2;
    const halfH = p.height / 2;
    if (p.x < halfW + 10) p.x = halfW + 10;
    if (p.x > CANVAS_WIDTH - halfW - 10) p.x = CANVAS_WIDTH - halfW - 10;
    if (p.y < halfH + 20) p.y = halfH + 20;
    if (p.y > CANVAS_HEIGHT - halfH - 15) p.y = CANVAS_HEIGHT - halfH - 15;
  };

  // 메인 애니메이션 루프 (60FPS 고정 타임스텝 — 모바일 120Hz 터치 부스트 시 2배 가속 완벽 차단)
  useEffect(() => {
    let animId: number;
    const TARGET_FRAME_MS = 1000 / 60;
    let lastTime = performance.now();
    let accumulator = 0;

    const loop = (now: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const state = stateRef.current;

      // 항상 최신 선택 속도 동기화 유지
      state.gameSpeed = gameSpeedRef.current;

      let delta = now - lastTime;
      lastTime = now;
      if (delta > 100) delta = TARGET_FRAME_MS;
      accumulator += delta;

      if (canvas && ctx) {
        try {
          const prevStatus = state.status;
          let stepRun = false;
          while (accumulator >= TARGET_FRAME_MS) {
            updateGameEngine(state, keysRef.current);
            accumulator -= TARGET_FRAME_MS;
            stepRun = true;
          }

          // 렌더링
          renderGameEngine(ctx, state);

          // 주기적 HUD 및 상태 동기화 (플레이 중 물리 프레임 진행 시 매 3프레임마다 또는 상태 전환 시 즉시)
          if (
            (state.status === 'playing' && stepRun && state.currentFrame % 3 === 0) ||
            state.status !== prevStatus
          ) {
            syncHudFromEngine();
          }

          // 게임오버 감지 (단 1회만 발동되도록 가드)
          if (state.status === 'gameover') {
            if (!gameOverReportedRef.current) {
              gameOverReportedRef.current = true;
              onGameOver(state.player.score, state.player.kills, state.player.highScore);
            }
          }
        } catch (err) {
          console.error('[Vera Flight Canvas Loop Error]', err);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [onGameOver, onStateUpdate]);

  const liveBestScore = Math.max(highScore, hudState.score);

  return (
    <div className="relative w-full max-w-[450px] mx-auto flex flex-col items-center select-none">
      {/* 🌟 상단 스코어 & 스테이지 전광판 바 */}
      <div className="w-full grid grid-cols-4 gap-1.5 mb-1.5">
        <div className="bg-white rounded-xl px-2.5 py-1.5 border border-indigo-200 shadow-2xs flex items-center justify-between">
          <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">STAGE</span>
          <span className="font-mono text-xs sm:text-sm font-black text-indigo-700">
            {hudState.stage}<span className="text-[10px] opacity-60">/99</span>
          </span>
        </div>
        <div className="bg-white rounded-xl px-2.5 py-1.5 border border-sky-200 shadow-2xs flex items-center justify-between">
          <span className="text-[10px] font-extrabold text-sky-600 uppercase tracking-wider">SCORE</span>
          <span className="font-mono text-xs sm:text-sm font-black text-sky-700">
            {hudState.score.toLocaleString()}
          </span>
        </div>
        <div className="bg-white rounded-xl px-2.5 py-1.5 border border-amber-200 shadow-2xs flex items-center justify-between">
          <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">BEST</span>
          <span className="font-mono text-xs sm:text-sm font-black text-amber-600">
            {liveBestScore.toLocaleString()}
          </span>
        </div>
        <div className="bg-white rounded-xl px-2.5 py-1.5 border border-rose-200 shadow-2xs flex items-center justify-between">
          <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider">KILLS</span>
          <span className="font-mono text-xs sm:text-sm font-black text-rose-600">
            {hudState.kills.toLocaleString()}기
          </span>
        </div>
      </div>

      {/* HUD 전술 상태 바 (기체 HP 게이지 + 잔여 기체 + 속도 + 무기) */}
      <div className="w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 mb-1.5 bg-white rounded-xl border border-[#EBE6DD] shadow-2xs text-xs font-bold">
        {/* 기체 HP 프로그레스 바 & 잔여 기체 */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-0.5 shrink-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < hudState.lives
                    ? 'fill-red-500 text-red-500'
                    : 'fill-stone-200 text-stone-300'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-1 min-w-[90px] max-w-[140px]">
            <div className="flex-1 h-2.5 bg-stone-200 rounded-full overflow-hidden border border-stone-300/80">
              <div
                className={`h-full transition-all duration-150 ${
                  hudState.hp > 50
                    ? 'bg-emerald-500'
                    : hudState.hp > 25
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, (hudState.hp / (hudState.maxHp || 100)) * 100))}%` }}
              />
            </div>
            <span className="font-mono text-[10px] font-black text-stone-700 shrink-0">
              HP {hudState.hp}
            </span>
          </div>
        </div>

        {/* 속도 조절 퀵 토글 버튼 */}
        <button
          type="button"
          onClick={handleCycleSpeed}
          title="게임 속도 변경 (클릭 시 0.7x 느림 ➔ 1.0x 보통 ➔ 1.3x 빠름 순환)"
          className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-black transition active:scale-95 cursor-pointer ${
            gameSpeed === 0.7
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
              : gameSpeed === 1.3
              ? 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100'
              : 'bg-sky-50 border-sky-300 text-sky-800 hover:bg-sky-100'
          }`}
        >
          <Gauge className="w-3 h-3" />
          <span>{gameSpeed}x</span>
          <span className="text-[9px] font-bold opacity-80">
            {gameSpeed === 0.7 ? '느림' : gameSpeed === 1.3 ? '빠름' : '보통'}
          </span>
        </button>

        {/* 위험도 랭크 뱃지 */}
        <div
          title={`현재 위험도 랭크: ${hudState.difficultyRank}`}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-black tracking-tight ${
            hudState.difficultyRank === 'HELL'
              ? 'bg-red-100 border-red-400 text-red-700 animate-pulse'
              : hudState.difficultyRank === 'EXPERT'
              ? 'bg-orange-50 border-orange-300 text-orange-700'
              : hudState.difficultyRank === 'HARD'
              ? 'bg-amber-50 border-amber-300 text-amber-700'
              : hudState.difficultyRank === 'NORMAL+'
              ? 'bg-sky-50 border-sky-300 text-sky-700'
              : 'bg-emerald-50 border-emerald-300 text-emerald-700'
          }`}
        >
          <ShieldAlert className="w-3 h-3" />
          <span>{hudState.difficultyRank}</span>
        </div>

        {/* 무기 & 보조무기 레벨 */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800">
          <Zap className="w-3 h-3 text-amber-600 fill-amber-500" />
          <span>LV.{hudState.weaponLevel}</span>
          {hudState.missileLevel > 0 && (
            <span className="text-[9px] bg-purple-600 text-white px-1 rounded font-black" title="유도 미사일 장착">
              M{hudState.missileLevel}
            </span>
          )}
          {hudState.plasmaLevel > 0 && (
            <span className="text-[9px] bg-cyan-600 text-white px-1 rounded font-black" title="플라즈마 캐논 장착">
              W{hudState.plasmaLevel}
            </span>
          )}
          {hudState.hasEscorts && (
            <span className="text-[9px] bg-emerald-600 text-white px-1 rounded font-black">
              +호위기
            </span>
          )}
        </div>
      </div>

      {/* 메인 캔버스 뷰포트 */}
      <div className="relative w-full aspect-[3/4] bg-[#0284C7] rounded-2xl overflow-hidden border-2 border-[#EBE6DD] shadow-md">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full block cursor-crosshair touch-none"
          onMouseDown={(e) => {
            if (Date.now() - lastTouchTimeRef.current < 800) return;
            if (stateRef.current.status === 'ready') handleStartGame();
            mouseDragRef.current = {
              active: true,
              lastX: e.clientX,
              lastY: e.clientY,
            };
          }}
          onMouseMove={(e) => {
            if (Date.now() - lastTouchTimeRef.current < 800) return;
            if (mouseDragRef.current.active && e.buttons > 0) {
              const dx = e.clientX - mouseDragRef.current.lastX;
              const dy = e.clientY - mouseDragRef.current.lastY;
              applyRelativeMove(dx, dy);
              mouseDragRef.current.lastX = e.clientX;
              mouseDragRef.current.lastY = e.clientY;
            }
          }}
          onMouseUp={() => {
            mouseDragRef.current.active = false;
          }}
          onMouseLeave={() => {
            mouseDragRef.current.active = false;
          }}
          onTouchStart={(e) => {
            lastTouchTimeRef.current = Date.now();
            mouseDragRef.current.active = false;
            if (stateRef.current.status === 'ready') handleStartGame();
            if (!touchDragRef.current.active && e.changedTouches.length > 0) {
              const touch = e.changedTouches[0];
              touchDragRef.current = {
                active: true,
                touchId: touch.identifier,
                lastX: touch.clientX,
                lastY: touch.clientY,
              };
            }
          }}
          onTouchMove={(e) => {
            lastTouchTimeRef.current = Date.now();
            if (!touchDragRef.current.active) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
              const touch = e.changedTouches[i];
              if (touch.identifier === touchDragRef.current.touchId) {
                const dx = touch.clientX - touchDragRef.current.lastX;
                const dy = touch.clientY - touchDragRef.current.lastY;
                applyRelativeMove(dx, dy);
                touchDragRef.current.lastX = touch.clientX;
                touchDragRef.current.lastY = touch.clientY;
                break;
              }
            }
          }}
          onTouchEnd={(e) => {
            lastTouchTimeRef.current = Date.now();
            if (!touchDragRef.current.active) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
              if (e.changedTouches[i].identifier === touchDragRef.current.touchId) {
                touchDragRef.current.active = false;
                touchDragRef.current.touchId = null;
                break;
              }
            }
          }}
          onTouchCancel={(e) => {
            lastTouchTimeRef.current = Date.now();
            if (!touchDragRef.current.active) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
              if (e.changedTouches[i].identifier === touchDragRef.current.touchId) {
                touchDragRef.current.active = false;
                touchDragRef.current.touchId = null;
                break;
              }
            }
          }}
        />

        {/* 게임 시작 대기 오버레이 */}
        {hudState.status === 'ready' && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/40 flex items-center justify-center mb-3 animate-bounce">
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            </div>
            <h2 className="text-xl font-black mb-1 drop-shadow">
              베라 플라이트 1942
            </h2>
            <p className="text-xs text-sky-100 leading-relaxed mb-4 max-w-xs drop-shadow">
              화면을 터치하거나 Space 키를 눌러 출격하세요!<br />
              화면 어디든 드래그하여 기체를 자유롭게 조작할 수 있습니다.<br />
              <span className="text-[11px] text-sky-200">
                (손가락이 기체를 가리지 않는 상대 터치 조작)
              </span>
            </p>

            {/* 난이도 / 속도 선택 세그먼트 */}
            <div className="w-full max-w-[280px] mb-5">
              <div className="flex items-center justify-between text-[11px] text-sky-100 font-bold mb-1.5 px-0.5">
                <span className="flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-amber-300" />
                  게임 속도 선택:
                </span>
                <span className="text-[10px] text-amber-300 font-semibold">
                  {gameSpeed === 0.7
                    ? '초보자 추천 (30% 감속)'
                    : gameSpeed === 1.3
                    ? '고수 전용 (30% 가속)'
                    : '1942 표준 아케이드'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 backdrop-blur-xs rounded-xl border border-white/20">
                <button
                  type="button"
                  onClick={() => handleSelectSpeed(0.7)}
                  className={`py-1.5 px-2 rounded-lg font-bold text-xs flex flex-col items-center transition cursor-pointer ${
                    gameSpeed === 0.7
                      ? 'bg-emerald-500 text-white shadow-xs font-black'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  <span>0.7x</span>
                  <span className="text-[9px] font-normal opacity-90">느림 (초보)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectSpeed(1.0)}
                  className={`py-1.5 px-2 rounded-lg font-bold text-xs flex flex-col items-center transition cursor-pointer ${
                    gameSpeed === 1.0
                      ? 'bg-sky-500 text-white shadow-xs font-black'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  <span>1.0x</span>
                  <span className="text-[9px] font-normal opacity-90">보통 (표준)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectSpeed(1.3)}
                  className={`py-1.5 px-2 rounded-lg font-bold text-xs flex flex-col items-center transition cursor-pointer ${
                    gameSpeed === 1.3
                      ? 'bg-rose-500 text-white shadow-xs font-black'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  <span>1.3x</span>
                  <span className="text-[9px] font-normal opacity-90">빠름 (도전)</span>
                </button>
              </div>
            </div>

            {/* 로그인 세이브 이어하기 & 새 출격 버튼 */}
            <div className="w-full max-w-[280px] flex flex-col gap-2">
              {isLoggedIn && savedState && savedState.stage >= 2 && (
                <button
                  type="button"
                  onClick={handleContinueSavedGame}
                  className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-slate-950 font-black text-xs shadow-lg transition active:scale-95 cursor-pointer flex flex-col items-center gap-0.5"
                >
                  <span className="flex items-center gap-1.5 text-sm">
                    <Save className="w-4 h-4" />
                    세이브 이어하기 (STAGE {savedState.stage})
                  </span>
                  <span className="text-[10px] font-bold opacity-85">
                    점수 {savedState.score.toLocaleString()} • HP {savedState.hp}/{savedState.maxHp} • 개조 무장 복원
                  </span>
                </button>
              )}

              <button
                onClick={handleStartGame}
                data-screenshot-click="action"
                className="w-full px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-stone-900 font-extrabold text-sm shadow-lg transition active:scale-95 cursor-pointer"
              >
                {isLoggedIn && savedState && savedState.stage >= 2
                  ? '새 게임 출격 시작 (STAGE 1)'
                  : '전투기 출격 시작'}
              </button>
            </div>
          </div>
        )}

        {/* 스테이지 클리어 & 격추수 기반 비행기 개조 격납고 오버레이 */}
        {hudState.status === 'hangar' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col justify-between p-4 text-white z-20 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-white/15 pb-2.5 mb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">
                    🎉 STAGE {hudState.stage} CLEAR!
                  </span>
                  <h3 className="text-base sm:text-lg font-black flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-amber-400" />
                    전투기 개조 격납고
                  </h3>
                </div>
                <div className="text-right bg-amber-500/20 border border-amber-400/50 rounded-xl px-3 py-1">
                  <span className="text-[10px] text-amber-200 font-bold block">
                    가용 개조 포인트 (누적 격추 {hudState.kills}기)
                  </span>
                  <span className="font-mono text-base font-black text-amber-300">
                    {hudState.upgradePoints} KP
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 mb-2.5 leading-snug">
                적기를 격추해 모은 <strong>개조 포인트(KP)</strong>로 기체 HP, 비행 속도, 유도탄 등 무장을 강화하세요!
              </p>

              {/* 개조 항목 그리드 */}
              <div className="grid grid-cols-1 gap-1.5">
                {/* 1. 유도 미사일 장착/강화 */}
                {(() => {
                  const cost = 7 + hudState.missileLevel * 3;
                  const isMax = hudState.missileLevel >= 3;
                  const canBuy = !isMax && hudState.upgradePoints >= cost;
                  return (
                    <button
                      type="button"
                      disabled={!canBuy}
                      onClick={() => handleUpgrade('missile')}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                        canBuy
                          ? 'bg-purple-950/60 border-purple-400/60 hover:bg-purple-900/70 cursor-pointer active:scale-[0.99]'
                          : 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/25 border border-purple-400/40 flex items-center justify-center shrink-0">
                          <Rocket className="w-4 h-4 text-purple-300" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-white flex items-center gap-1.5">
                            <span>🚀 자동 추적 유도탄</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200 font-mono">
                              LV.{hudState.missileLevel}/3
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-300">
                            총탄과 함께 적기를 스스로 찾아가는 유도 미사일 발사 (1발➔2발➔4발)
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-purple-500 text-white font-mono text-xs font-black shrink-0">
                        {isMax ? 'MAX' : `${cost} KP`}
                      </span>
                    </button>
                  );
                })()}

                {/* 2. 플라즈마 캐논 장착/강화 */}
                {(() => {
                  const cost = 7 + hudState.plasmaLevel * 3;
                  const isMax = hudState.plasmaLevel >= 3;
                  const canBuy = !isMax && hudState.upgradePoints >= cost;
                  return (
                    <button
                      type="button"
                      disabled={!canBuy}
                      onClick={() => handleUpgrade('plasma')}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                        canBuy
                          ? 'bg-cyan-950/60 border-cyan-400/60 hover:bg-cyan-900/70 cursor-pointer active:scale-[0.99]'
                          : 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/25 border border-cyan-400/40 flex items-center justify-center shrink-0">
                          <Sparkles className="w-4 h-4 text-cyan-300" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-white flex items-center gap-1.5">
                            <span>⚡ 플라즈마 레이저 캐논</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/30 text-cyan-200 font-mono">
                              LV.{hudState.plasmaLevel}/3
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-300">
                            총탄과 함께 초고속 고화력 에너지 볼트 추가 발사
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-cyan-600 text-white font-mono text-xs font-black shrink-0">
                        {isMax ? 'MAX' : `${cost} KP`}
                      </span>
                    </button>
                  );
                })()}

                {/* 3. 최대 HP 장갑 증설 */}
                {(() => {
                  const cost = 5 + hudState.hullLevel * 2;
                  const isMax = hudState.hullLevel >= 5;
                  const canBuy = !isMax && hudState.upgradePoints >= cost;
                  return (
                    <button
                      type="button"
                      disabled={!canBuy}
                      onClick={() => handleUpgrade('hull')}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                        canBuy
                          ? 'bg-emerald-950/60 border-emerald-400/60 hover:bg-emerald-900/70 cursor-pointer active:scale-[0.99]'
                          : 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/25 border border-emerald-400/40 flex items-center justify-center shrink-0">
                          <Shield className="w-4 h-4 text-emerald-300" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-white flex items-center gap-1.5">
                            <span>🛡️ 기체 장갑 강화 (최대 HP +25)</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-200 font-mono">
                              LV.{hudState.hullLevel}/5
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-300">
                            최대 HP 영구 +25 증가 및 즉시 +40 HP 수리 (현재 {hudState.hp}/{hudState.maxHp})
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-mono text-xs font-black shrink-0">
                        {isMax ? 'MAX' : `${cost} KP`}
                      </span>
                    </button>
                  );
                })()}

                {/* 4. 비행기 이동 속도 업 */}
                {(() => {
                  const cost = 5 + hudState.speedLevel * 2;
                  const isMax = hudState.speedLevel >= 5;
                  const canBuy = !isMax && hudState.upgradePoints >= cost;
                  return (
                    <button
                      type="button"
                      disabled={!canBuy}
                      onClick={() => handleUpgrade('speed')}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                        canBuy
                          ? 'bg-sky-950/60 border-sky-400/60 hover:bg-sky-900/70 cursor-pointer active:scale-[0.99]'
                          : 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/25 border border-sky-400/40 flex items-center justify-center shrink-0">
                          <Gauge className="w-4 h-4 text-sky-300" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-white flex items-center gap-1.5">
                            <span>💨 엔진 출력 개조 (비행 속도 업)</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/30 text-sky-200 font-mono">
                              LV.{hudState.speedLevel}/5
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-300">
                            기체 이동 및 회피 기동 속도를 영구적으로 높입니다
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-sky-600 text-white font-mono text-xs font-black shrink-0">
                        {isMax ? 'MAX' : `${cost} KP`}
                      </span>
                    </button>
                  );
                })()}

                {/* 5. 주포 화력 & 연사 개조 */}
                {(() => {
                  const cost = 6 + hudState.firepowerLevel * 2;
                  const isMax = hudState.firepowerLevel >= 5;
                  const canBuy = !isMax && hudState.upgradePoints >= cost;
                  return (
                    <button
                      type="button"
                      disabled={!canBuy}
                      onClick={() => handleUpgrade('firepower')}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                        canBuy
                          ? 'bg-amber-950/60 border-amber-400/60 hover:bg-amber-900/70 cursor-pointer active:scale-[0.99]'
                          : 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/25 border border-amber-400/40 flex items-center justify-center shrink-0">
                          <Zap className="w-4 h-4 text-amber-300" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-white flex items-center gap-1.5">
                            <span>🔥 주포 화력·연사 개조</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200 font-mono">
                              LV.{hudState.firepowerLevel}/5
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-300">
                            모든 무기 공격력 +16% 증가, 연사 속도 향상 및 주포 단계 상승
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-mono text-xs font-black shrink-0">
                        {isMax ? 'MAX' : `${cost} KP`}
                      </span>
                    </button>
                  );
                })()}

                {/* 6. 긴급 완전 수리 & 전술 무장 보급 (2열) */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    disabled={hudState.upgradePoints < 4 || hudState.hp >= hudState.maxHp}
                    onClick={() => handleUpgrade('repair')}
                    className={`p-2 rounded-xl border text-left flex items-center justify-between transition ${
                      hudState.upgradePoints >= 4 && hudState.hp < hudState.maxHp
                        ? 'bg-rose-950/60 border-rose-400/60 hover:bg-rose-900/70 cursor-pointer'
                        : 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <span className="text-[11px] font-black block">🔧 HP 100% 수리</span>
                      <span className="text-[9px] text-slate-300">체력 즉시 완충</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono text-[11px] font-black">
                      4 KP
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={hudState.upgradePoints < 5}
                    onClick={() => handleUpgrade('tactical')}
                    className={`p-2 rounded-xl border text-left flex items-center justify-between transition ${
                      hudState.upgradePoints >= 5
                        ? 'bg-indigo-950/60 border-indigo-400/60 hover:bg-indigo-900/70 cursor-pointer'
                        : 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <span className="text-[11px] font-black block">💣 폭탄+1 & 롤+1</span>
                      <span className="text-[9px] text-slate-300">특수기 즉시 보충</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-mono text-[11px] font-black">
                      5 KP
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* 스테이지 클리어 세이브 (로그인 유저 전용) & 다음 스테이지 출격 버튼 */}
            <div className="mt-2.5 flex flex-col gap-1.5">
              {isLoggedIn ? (
                <button
                  type="button"
                  disabled={isSavingStage}
                  onClick={handleSaveInHangar}
                  className={`w-full py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    stageSavedNotice
                      ? 'bg-emerald-900/70 border-emerald-400 text-emerald-200'
                      : 'bg-sky-900/70 border-sky-400/70 hover:bg-sky-800/80 text-sky-100 active:scale-[0.99]'
                  }`}
                >
                  {stageSavedNotice ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>
                        ✅ STAGE {Math.min(99, hudState.stage + 1)} 출격 대기 & 기체 개조 서버 세이브 완료!
                      </span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-sky-300" />
                      <span>
                        {isSavingStage
                          ? '서버에 세이브 중...'
                          : `💾 현재 스테이지(STAGE ${Math.min(99, hudState.stage + 1)}) & 개조 상태 세이브`}
                      </span>
                    </>
                  )}
                </button>
              ) : (
                <div className="w-full py-1.5 px-3 rounded-xl bg-white/5 border border-white/10 text-[10px] text-slate-300 flex items-center justify-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>로그인 후 플레이하면 스테이지 클리어 및 기체 개조 상태를 세이브할 수 있습니다</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleLaunchNextStage}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-slate-950 font-black text-sm shadow-lg transition active:scale-95 cursor-pointer"
              >
                🚀 개조 완료 — STAGE {Math.min(99, hudState.stage + 1)} 출격 시작!
              </button>
            </div>
          </div>
        )}

        {/* 캔버스 내부 하단 잔여 롤 / 폭탄 인디케이터 */}
        {hudState.status === 'playing' && (
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
            {/* 공중제비 롤 잔여 횟수 */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/50 backdrop-blur-xs text-white text-[11px] font-bold">
              <RotateCw className="w-3.5 h-3.5 text-sky-400" />
              <span>롤(Z):</span>
              <span className="font-mono text-sky-300 font-black">{hudState.rolls}</span>
            </div>

            {/* 현재 게임 속도 인디케이터 */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-black/50 backdrop-blur-xs text-white text-[11px] font-bold">
              <Gauge
                className={`w-3.5 h-3.5 ${
                  gameSpeed === 0.7
                    ? 'text-emerald-400'
                    : gameSpeed === 1.3
                    ? 'text-rose-400'
                    : 'text-sky-300'
                }`}
              />
              <span className="font-mono text-[10px]">{gameSpeed}x</span>
            </div>

            {/* 메가 폭탄 잔여 발수 */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/50 backdrop-blur-xs text-white text-[11px] font-bold">
              <Bomb className="w-3.5 h-3.5 text-amber-400" />
              <span>폭탄(X):</span>
              <span className="font-mono text-amber-300 font-black">{hudState.bombs}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
