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
import { sound } from '../utils/sound';
import {
  isFullscreenSupported,
  isBrowserFullscreen,
  enterBrowserFullscreen,
  exitBrowserFullscreen,
  toggleBrowserFullscreen,
  subscribeFullscreenChange,
} from '../utils/fullscreen';
import {
  Heart,
  Bomb,
  RotateCw,
  Zap,
  Play,
  Gauge,
  ShieldAlert,
  Wrench,
  Rocket,
  Shield,
  Sparkles,
  Save,
  CheckCircle2,
  Lock,
  Pause,
  Home,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  HelpCircle,
} from 'lucide-react';

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
  onOpenHowTo?: () => void;
}

function isInteractiveHudTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('[data-hud-interactive="true"], button, a'));
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
  onOpenHowTo,
}) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameOverReportedRef = useRef<boolean>(false);
  const prevRestartRef = useRef<number>(restartTriggerRequested);
  const hintTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);

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

  const touchGestureRef = useRef<{
    tapStartTime: number;
    tapStartX: number;
    tapStartY: number;
    maxDist: number;
    hadMultiTouch: boolean;
    lastTapTime: number;
    lastTapX: number;
    lastTapY: number;
    lastBombTime: number;
  }>({
    tapStartTime: 0,
    tapStartX: 0,
    tapStartY: 0,
    maxDist: 0,
    hadMultiTouch: false,
    lastTapTime: 0,
    lastTapX: 0,
    lastTapY: 0,
    lastBombTime: 0,
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
    playerX: number;
    playerY: number;
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
    playerX: Math.round(CANVAS_WIDTH / 2),
    playerY: Math.round(CANVAS_HEIGHT - 80),
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
      playerX: Math.round(state.player.x),
      playerY: Math.round(state.player.y),
    });
    if (onStateUpdate) {
      onStateUpdate({ ...state, player: { ...state.player } });
    }
  }, [onStateUpdate]);

  const [isSavingStage, setIsSavingStage] = useState<boolean>(false);
  const [stageSavedNotice, setStageSavedNotice] = useState<boolean>(false);
  const [isBrowserFs, setIsBrowserFs] = useState<boolean>(() => isBrowserFullscreen());
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.isMuted());
  const [showGestureHint, setShowGestureHint] = useState<boolean>(false);
  const [gestureToast, setGestureToast] = useState<{
    id: number;
    label: string;
    tone: 'sky' | 'amber';
  } | null>(null);
  const fullscreenSupported = isFullscreenSupported();
  const isImmersive =
    hudState.status === 'playing' ||
    hudState.status === 'paused' ||
    hudState.status === 'hangar';

  const resetActiveControls = useCallback(() => {
    keysRef.current = { left: false, right: false, up: false, down: false, shoot: true };
    mouseDragRef.current.active = false;
    touchDragRef.current = { active: false, touchId: null, lastX: 0, lastY: 0 };
    touchGestureRef.current.maxDist = 0;
  }, []);

  const triggerGestureHint = useCallback(() => {
    if (hintTimerRef.current !== null) {
      window.clearTimeout(hintTimerRef.current);
    }
    setShowGestureHint(true);
    hintTimerRef.current = window.setTimeout(() => {
      setShowGestureHint(false);
      hintTimerRef.current = null;
    }, 3500);
  }, []);

  const triggerGestureToast = useCallback((label: string, tone: 'sky' | 'amber') => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    setGestureToast({ id: Date.now(), label, tone });
    toastTimerRef.current = window.setTimeout(() => {
      setGestureToast(null);
      toastTimerRef.current = null;
    }, 900);
  }, []);

  useEffect(() => {
    return () => {
      if (hintTimerRef.current !== null) window.clearTimeout(hintTimerRef.current);
      if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  // 전체화면 몰입 모드 시 html/body 바운스 및 스크롤 잠금
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (isImmersive) {
      root.classList.add('flight-immersive-lock');
      body.classList.add('flight-immersive-lock');
    } else {
      root.classList.remove('flight-immersive-lock');
      body.classList.remove('flight-immersive-lock');
    }
    return () => {
      root.classList.remove('flight-immersive-lock');
      body.classList.remove('flight-immersive-lock');
    };
  }, [isImmersive]);

  useEffect(() => {
    return subscribeFullscreenChange(setIsBrowserFs);
  }, []);

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

  // 게임 시작 트리거 (새 게임 STAGE 1 + 자동 전체화면 몰입 진입)
  const handleStartGame = useCallback(() => {
    const activeSpeed = gameSpeedRef.current;
    resetActiveControls();
    gameOverReportedRef.current = false;
    setStageSavedNotice(false);
    stateRef.current = createInitialState(activeSpeed);
    stateRef.current.gameSpeed = activeSpeed;
    stateRef.current.player.highScore = Math.max(stateRef.current.player.highScore, highScore);
    stateRef.current.status = 'playing';
    triggerGestureHint();
    void enterBrowserFullscreen(stageRef.current || document.documentElement);
    syncHudFromEngine();
  }, [highScore, resetActiveControls, triggerGestureHint, syncHudFromEngine]);

  // 저장된 세이브 데이터로부터 이어하기 트리거
  const handleContinueSavedGame = useCallback(() => {
    if (!savedState) return;
    const activeSpeed = gameSpeedRef.current;
    resetActiveControls();
    gameOverReportedRef.current = false;
    setStageSavedNotice(false);
    stateRef.current = createInitialState(activeSpeed);
    stateRef.current.gameSpeed = activeSpeed;
    stateRef.current.player.highScore = Math.max(stateRef.current.player.highScore, highScore);
    restoreFromSaveState(stateRef.current, savedState);
    triggerGestureHint();
    void enterBrowserFullscreen(stageRef.current || document.documentElement);
    syncHudFromEngine();
  }, [savedState, highScore, resetActiveControls, triggerGestureHint, syncHudFromEngine]);

  const handlePauseGame = useCallback(() => {
    if (stateRef.current.status !== 'playing') return;
    resetActiveControls();
    stateRef.current.status = 'paused';
    setIsMuted(sound.isMuted());
    syncHudFromEngine();
  }, [resetActiveControls, syncHudFromEngine]);

  const handleResumeGame = useCallback(() => {
    if (stateRef.current.status !== 'paused') return;
    resetActiveControls();
    stateRef.current.status = 'playing';
    syncHudFromEngine();
  }, [resetActiveControls, syncHudFromEngine]);

  const handleReturnToLobby = useCallback(() => {
    const activeSpeed = gameSpeedRef.current;
    const preservedHighScore = Math.max(highScore, stateRef.current.player.highScore);
    resetActiveControls();
    if (hintTimerRef.current !== null) {
      window.clearTimeout(hintTimerRef.current);
      hintTimerRef.current = null;
    }
    setShowGestureHint(false);
    setGestureToast(null);
    setStageSavedNotice(false);
    gameOverReportedRef.current = false;
    stateRef.current = createInitialState(activeSpeed);
    stateRef.current.gameSpeed = activeSpeed;
    stateRef.current.player.highScore = preservedHighScore;
    stateRef.current.status = 'ready';
    void exitBrowserFullscreen();
    syncHudFromEngine();
  }, [highScore, resetActiveControls, syncHudFromEngine]);

  const handleToggleMute = useCallback(() => {
    setIsMuted(sound.toggleMute());
  }, []);

  const handleToggleBrowserFullscreen = useCallback(async () => {
    const active = await toggleBrowserFullscreen(stageRef.current || document.documentElement);
    setIsBrowserFs(active);
  }, []);

  const executeRoll = useCallback((): boolean => {
    const state = stateRef.current;
    if (state.status !== 'playing') return false;
    if (triggerPlayerRoll(state)) {
      triggerGestureToast('360° 공중제비 롤!', 'sky');
      syncHudFromEngine();
      return true;
    }
    return false;
  }, [syncHudFromEngine, triggerGestureToast]);

  const executeBomb = useCallback((): boolean => {
    const state = stateRef.current;
    if (state.status !== 'playing') return false;
    if (triggerPlayerBomb(state)) {
      triggerGestureToast('메가 폭탄 발동!', 'amber');
      syncHudFromEngine();
      return true;
    }
    return false;
  }, [syncHudFromEngine, triggerGestureToast]);

  // 탭 전환/화면 잠금 시 자동 일시정지
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && stateRef.current.status === 'playing') {
        handlePauseGame();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [handlePauseGame]);

  // 외부(게임오버 모달 등)에서 재시작 요청 처리
  useEffect(() => {
    if (restartTriggerRequested > 0 && restartTriggerRequested !== prevRestartRef.current) {
      const activeSpeed = gameSpeedRef.current;
      prevRestartRef.current = restartTriggerRequested;
      resetActiveControls();
      gameOverReportedRef.current = false;
      stateRef.current = createInitialState(activeSpeed);
      stateRef.current.gameSpeed = activeSpeed;
      stateRef.current.player.highScore = Math.max(stateRef.current.player.highScore, highScore);
      stateRef.current.status = 'playing';
      triggerGestureHint();
      void enterBrowserFullscreen(stageRef.current || document.documentElement);
      syncHudFromEngine();
    }
  }, [restartTriggerRequested, highScore, resetActiveControls, triggerGestureHint, syncHudFromEngine]);

  // 외부(버튼 등)에서 롤 요청 처리
  useEffect(() => {
    if (rollTriggerRequested > 0 && stateRef.current.status === 'playing') {
      executeRoll();
    }
  }, [rollTriggerRequested, executeRoll]);

  // 외부에서 폭탄 요청 처리
  useEffect(() => {
    if (bombTriggerRequested > 0 && stateRef.current.status === 'playing') {
      executeBomb();
    }
  }, [bombTriggerRequested, executeBomb]);

  // 키보드 이벤트 리스너 바인딩 (일시정지 ESC/P 및 전체화면 스크롤 방지 포함)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (s.status === 'playing') {
          e.preventDefault();
          handlePauseGame();
          return;
        }
        if (s.status === 'paused') {
          e.preventDefault();
          handleResumeGame();
          return;
        }
      }
      if (
        (s.status === 'playing' || s.status === 'paused') &&
        (e.code === 'ArrowUp' ||
          e.code === 'ArrowDown' ||
          e.code === 'ArrowLeft' ||
          e.code === 'ArrowRight' ||
          e.code === 'Space')
      ) {
        e.preventDefault();
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keysRef.current.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keysRef.current.right = true;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') keysRef.current.up = true;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') keysRef.current.down = true;
      if (e.code === 'Space') {
        keysRef.current.shoot = true;
        if (s.status === 'ready') handleStartGame();
      }
      if (e.code === 'KeyZ' || e.code === 'KeyJ') {
        executeRoll();
      }
      if (e.code === 'KeyX' || e.code === 'KeyK') {
        executeBomb();
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
  }, [handleStartGame, handlePauseGame, handleResumeGame, executeRoll, executeBomb]);

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

  // 데스크톱 마우스 드래그 시 화면 여백 및 창 경계 밖까지 끊김 없이 추적
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (Date.now() - lastTouchTimeRef.current < 800) return;
      if (!mouseDragRef.current.active) return;
      if ((e.buttons & 1) === 0 || stateRef.current.status !== 'playing') {
        mouseDragRef.current.active = false;
        return;
      }
      const dx = e.clientX - mouseDragRef.current.lastX;
      const dy = e.clientY - mouseDragRef.current.lastY;
      applyRelativeMove(dx, dy);
      mouseDragRef.current.lastX = e.clientX;
      mouseDragRef.current.lastY = e.clientY;
    };

    const handleWindowMouseUp = () => {
      mouseDragRef.current.active = false;
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('blur', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('blur', handleWindowMouseUp);
    };
  }, []);

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

          // 게임오버 감지 (단 1회만 발동되도록 가드 + 전체화면 해제)
          if (state.status === 'gameover') {
            if (!gameOverReportedRef.current) {
              gameOverReportedRef.current = true;
              void exitBrowserFullscreen();
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
  }, [onGameOver, syncHudFromEngine]);

  const liveBestScore = Math.max(highScore, hudState.score);
  const hpPercent = Math.max(0, Math.min(100, (hudState.hp / (hudState.maxHp || 100)) * 100));
  const hpMeterTone =
    hpPercent > 50 ? 'flight-hp-high' : hpPercent > 25 ? 'flight-hp-mid' : 'flight-hp-low';

  return (
    <div
      ref={stageRef}
      data-flight-stage="true"
      data-immersive={isImmersive ? 'true' : 'false'}
      data-player-x={hudState.playerX}
      data-player-y={hudState.playerY}
      onMouseDown={(e) => {
        if (Date.now() - lastTouchTimeRef.current < 800) return;
        if (isInteractiveHudTarget(e.target)) return;
        if (stateRef.current.status === 'ready' && e.target === canvasRef.current) {
          handleStartGame();
          return;
        }
        if (stateRef.current.status !== 'playing' || e.button !== 0) return;
        mouseDragRef.current = {
          active: true,
          lastX: e.clientX,
          lastY: e.clientY,
        };
      }}
      onDoubleClick={(e) => {
        if (Date.now() - lastTouchTimeRef.current < 800) return;
        if (isInteractiveHudTarget(e.target)) return;
        if (stateRef.current.status === 'playing') {
          executeRoll();
        }
      }}
      onContextMenu={(e) => {
        if (stateRef.current.status !== 'playing' || isInteractiveHudTarget(e.target)) return;
        e.preventDefault();
        executeBomb();
      }}
      onTouchStart={(e) => {
        lastTouchTimeRef.current = Date.now();
        mouseDragRef.current.active = false;
        if (isInteractiveHudTarget(e.target)) return;
        if (stateRef.current.status === 'ready' && e.target === canvasRef.current) {
          handleStartGame();
          return;
        }
        if (stateRef.current.status !== 'playing') return;

        const now = Date.now();
        const g = touchGestureRef.current;

        // 두 손가락 터치 시 메가 폭탄 발동 (주 손가락 비행 조종은 중단 없이 유지)
        if (e.touches.length >= 2) {
          g.hadMultiTouch = true;
          if (now - g.lastBombTime >= 500) {
            g.lastBombTime = now;
            executeBomb();
          }
        }

        if (!touchDragRef.current.active && e.changedTouches.length > 0) {
          const touch = e.changedTouches[0];
          touchDragRef.current = {
            active: true,
            touchId: touch.identifier,
            lastX: touch.clientX,
            lastY: touch.clientY,
          };
          if (e.touches.length === 1) {
            g.tapStartTime = now;
            g.tapStartX = touch.clientX;
            g.tapStartY = touch.clientY;
            g.maxDist = 0;
            g.hadMultiTouch = false;
          }
        }
      }}
      onTouchMove={(e) => {
        lastTouchTimeRef.current = Date.now();
        if (stateRef.current.status !== 'playing' || !touchDragRef.current.active) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === touchDragRef.current.touchId) {
            const dx = touch.clientX - touchDragRef.current.lastX;
            const dy = touch.clientY - touchDragRef.current.lastY;
            applyRelativeMove(dx, dy);
            touchDragRef.current.lastX = touch.clientX;
            touchDragRef.current.lastY = touch.clientY;
            const dist = Math.hypot(
              touch.clientX - touchGestureRef.current.tapStartX,
              touch.clientY - touchGestureRef.current.tapStartY
            );
            if (dist > touchGestureRef.current.maxDist) {
              touchGestureRef.current.maxDist = dist;
            }
            break;
          }
        }
      }}
      onTouchEnd={(e) => {
        lastTouchTimeRef.current = Date.now();
        if (stateRef.current.status !== 'playing') return;
        const g = touchGestureRef.current;
        const now = Date.now();

        let endedPrimary = false;
        if (touchDragRef.current.active) {
          for (let i = 0; i < e.changedTouches.length; i++) {
            const ended = e.changedTouches[i];
            if (ended.identifier === touchDragRef.current.touchId) {
              endedPrimary = true;
              const endDist = Math.hypot(ended.clientX - g.tapStartX, ended.clientY - g.tapStartY);
              const totalDist = Math.max(g.maxDist, endDist);
              // 드래그가 아닌 짧은 단일 손가락 탭을 280ms 내 연타 시 360° 롤 발동
              if (
                !g.hadMultiTouch &&
                e.touches.length === 0 &&
                now - g.tapStartTime <= 220 &&
                totalDist <= 18
              ) {
                const gap = now - g.lastTapTime;
                const tapDelta = Math.hypot(ended.clientX - g.lastTapX, ended.clientY - g.lastTapY);
                if (g.lastTapTime > 0 && gap <= 280 && tapDelta <= 48) {
                  g.lastTapTime = 0;
                  executeRoll();
                } else {
                  g.lastTapTime = now;
                  g.lastTapX = ended.clientX;
                  g.lastTapY = ended.clientY;
                }
              }
              break;
            }
          }
        }

        if (e.touches.length > 0 && (endedPrimary || !touchDragRef.current.active)) {
          const remaining = e.touches[0];
          touchDragRef.current = {
            active: true,
            touchId: remaining.identifier,
            lastX: remaining.clientX,
            lastY: remaining.clientY,
          };
        } else if (endedPrimary || e.touches.length === 0) {
          touchDragRef.current.active = false;
          touchDragRef.current.touchId = null;
        }
      }}
      onTouchCancel={(e) => {
        lastTouchTimeRef.current = Date.now();
        if (e.touches.length > 0) {
          const remaining = e.touches[0];
          touchDragRef.current = {
            active: true,
            touchId: remaining.identifier,
            lastX: remaining.clientX,
            lastY: remaining.clientY,
          };
        } else {
          touchDragRef.current.active = false;
          touchDragRef.current.touchId = null;
          touchGestureRef.current.hadMultiTouch = false;
        }
      }}
      className={
        isImmersive
          ? 'fixed inset-0 z-40 w-screen h-[100dvh] bg-gradient-to-b from-[#38BDF8] via-[#0EA5E9] to-[#0284C7] md:from-[#0C4A6E] md:via-[#0369A1] md:to-[#082F49] flex flex-col items-center justify-center overflow-hidden touch-none select-none'
          : 'relative w-full max-w-[450px] mx-auto flex flex-col items-center select-none'
      }
    >
      {/* 로비/게임오버 모드: 기존 상단 스코어 & 전술 상태 바 유지 */}
      {!isImmersive && (
        <>
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

          <div className="w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 mb-1.5 bg-white rounded-xl border border-[#EBE6DD] shadow-2xs text-xs font-bold">
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
                <progress
                  max={hudState.maxHp || 100}
                  value={Math.max(0, hudState.hp)}
                  aria-label="기체 체력"
                  className={`flight-hp-meter flight-hp-meter-light ${hpMeterTone} flex-1 h-2.5 border border-stone-300/80`}
                />
                <span className="font-mono text-[10px] font-black text-stone-700 shrink-0">
                  HP {hudState.hp}
                </span>
              </div>
            </div>

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
        </>
      )}

      {/* 전체화면 몰입 모드: 상단 최소 반투명 플로팅 HUD + 일시정지 버튼만 노출 */}
      {isImmersive && (
        <div className="absolute top-0 inset-x-0 z-50 safe-top-inset px-2.5 sm:px-4 pointer-events-none flex items-center justify-between gap-2">
          <div className="bg-slate-950/55 backdrop-blur-md border border-white/15 rounded-full px-3 py-1.5 flex items-center gap-2 sm:gap-3 text-white shadow-lg min-w-0">
            <span className="font-mono text-[11px] font-black text-sky-300 shrink-0">
              ST.{hudState.stage}
            </span>
            <span className="font-mono text-xs sm:text-sm font-black tabular-nums text-white truncate">
              {hudState.score.toLocaleString()}
            </span>
            <span className="w-px h-3.5 bg-white/20 shrink-0" />
            <div className="flex items-center gap-0.5 shrink-0">
              {Array.from({ length: 3 }).map((_, i) => (
                <Heart
                  key={i}
                  className={`w-3 h-3 ${
                    i < hudState.lives
                      ? 'fill-rose-500 text-rose-500'
                      : 'fill-white/15 text-white/25'
                  }`}
                />
              ))}
            </div>
            <progress
              max={hudState.maxHp || 100}
              value={Math.max(0, hudState.hp)}
              aria-label="기체 체력"
              className={`flight-hp-meter ${hpMeterTone} w-12 sm:w-16 h-2 shrink-0`}
            />
            <span className="w-px h-3.5 bg-white/20 shrink-0" />
            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-black text-sky-300 shrink-0">
              <RotateCw className="w-3 h-3" />
              <span data-hud-rolls={hudState.rolls}>{hudState.rolls}</span>
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-black text-amber-300 shrink-0">
              <Bomb className="w-3 h-3" />
              <span data-hud-bombs={hudState.bombs}>{hudState.bombs}</span>
            </span>
          </div>

          <button
            type="button"
            data-hud-interactive="true"
            data-flight-pause-btn="true"
            onClick={hudState.status === 'paused' ? handleResumeGame : handlePauseGame}
            disabled={hudState.status === 'hangar'}
            aria-label="일시정지 및 설정 메뉴 열기"
            title="일시정지 및 메뉴 (P / ESC)"
            className="pointer-events-auto w-9 h-9 rounded-full bg-slate-950/60 hover:bg-slate-950/80 border border-white/20 text-white flex items-center justify-center shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-40"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 제스처 발동 피드백 토스트 */}
      {isImmersive && hudState.status === 'playing' && gestureToast && (
        <div
          key={gestureToast.id}
          className="absolute top-14 inset-x-0 z-50 flex justify-center pointer-events-none animate-gesture-pop"
        >
          <span
            className={`px-3 py-1 rounded-full text-xs font-black shadow-lg border backdrop-blur-md ${
              gestureToast.tone === 'amber'
                ? 'bg-amber-500/85 border-amber-200/70 text-slate-950'
                : 'bg-sky-500/85 border-sky-200/70 text-white'
            }`}
          >
            {gestureToast.label}
          </span>
        </div>
      )}

      {/* 출격 직후 3.5초 제스처 힌트 배지 */}
      {isImmersive && hudState.status === 'playing' && showGestureHint && (
        <div className="absolute bottom-3 safe-bottom-inset inset-x-0 z-50 px-3 flex justify-center pointer-events-none animate-gesture-pop">
          <div className="px-3.5 py-1.5 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/15 text-[11px] font-bold text-white/95 shadow-lg text-center">
            화면 전체 드래그 이동 · 더블탭 360° 롤 · 두 손가락 메가 폭탄
          </div>
        </div>
      )}

      {/* 메인 캔버스 뷰포트 (전체화면 시 비율 3:4 보존 최대 확대) */}
      <div
        data-flight-viewport="true"
        className={
          isImmersive
            ? 'flight-fullscreen-viewport relative bg-[#0284C7] overflow-hidden md:border-x md:border-sky-300/30 md:shadow-2xl'
            : 'relative w-full aspect-[3/4] bg-[#0284C7] rounded-2xl overflow-hidden border-2 border-[#EBE6DD] shadow-md'
        }
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full block cursor-crosshair touch-none"
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
              출격하면 자동으로 전체화면 몰입 모드로 전환됩니다!<br />
              여백 포함 화면 어디든 드래그하여 기체를 조작하세요.<br />
              <span className="text-[11px] text-sky-200">
                (더블탭: 360° 롤 • 두 손가락 탭: 메가 폭탄)
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
      </div>

      {/* 스테이지 클리어 & 격추수 기반 비행기 개조 격납고 오버레이 */}
      {hudState.status === 'hangar' && (
        <div
          data-hud-interactive="true"
          className="absolute inset-0 z-[55] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 pt-16 pb-4"
        >
          <div className="w-full max-w-md max-h-[85dvh] overflow-y-auto custom-scrollbar rounded-3xl bg-slate-900/95 border border-white/15 p-4 text-white shadow-2xl flex flex-col justify-between">
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
        </div>
      )}

      {/* 일시정지 전술 설정 메뉴 (FaithPortal Design System) */}
      {hudState.status === 'paused' && (
        <div
          data-hud-interactive="true"
          data-flight-pause-overlay="true"
          className="absolute inset-0 z-[55] bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm bg-[#FAF8F5] rounded-3xl p-5 border border-[#EBE6DD] shadow-2xl text-[#2D2A26] max-h-[90dvh] overflow-y-auto custom-scrollbar">
            {/* 상단 헤더 */}
            <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-[#EBE6DD]">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700 block">
                  TACTICAL PAUSE
                </span>
                <h3 className="text-lg font-black text-[#1E293B]">일시정지 및 전술 설정</h3>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-black ${
                  hudState.difficultyRank === 'HELL'
                    ? 'bg-red-100 border-red-400 text-red-700'
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
                ST.{hudState.stage}/99 · {hudState.difficultyRank}
              </span>
            </div>

            {/* 전황 요약 3열 */}
            <div className="grid grid-cols-3 gap-1.5 mb-3 text-center">
              <div className="bg-white rounded-2xl p-2 border border-[#EBE6DD] shadow-2xs">
                <span className="text-[10px] font-bold text-[#7A756D] block">SCORE</span>
                <span className="font-mono text-sm font-black text-sky-700">
                  {hudState.score.toLocaleString()}
                </span>
              </div>
              <div className="bg-white rounded-2xl p-2 border border-[#EBE6DD] shadow-2xs">
                <span className="text-[10px] font-bold text-[#7A756D] block">BEST</span>
                <span className="font-mono text-sm font-black text-amber-600">
                  {liveBestScore.toLocaleString()}
                </span>
              </div>
              <div className="bg-white rounded-2xl p-2 border border-[#EBE6DD] shadow-2xs">
                <span className="text-[10px] font-bold text-[#7A756D] block">KILLS</span>
                <span className="font-mono text-sm font-black text-rose-600">
                  {hudState.kills.toLocaleString()}기
                </span>
              </div>
            </div>

            {/* 현재 장착 무장 배지 */}
            <div className="bg-white rounded-2xl p-2.5 border border-[#EBE6DD] mb-3 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-[#7A756D]">장착 무장</span>
              <div className="flex flex-wrap items-center justify-end gap-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-black">
                  <Zap className="w-3 h-3 text-amber-600 fill-amber-500" />
                  LV.{hudState.weaponLevel}
                </span>
                {hudState.missileLevel > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-purple-600 text-white text-[10px] font-black">
                    M{hudState.missileLevel}
                  </span>
                )}
                {hudState.plasmaLevel > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-cyan-600 text-white text-[10px] font-black">
                    W{hudState.plasmaLevel}
                  </span>
                )}
                {hudState.hasEscorts && (
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black">
                    +호위기
                  </span>
                )}
              </div>
            </div>

            {/* 비행 속도 세그먼트 */}
            <div className="bg-white rounded-2xl p-2.5 border border-[#EBE6DD] mb-3">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#2D2A26] mb-1.5">
                <span className="flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-sky-600" />
                  게임 속도 조절
                </span>
                <span className="text-[10px] text-[#7A756D]">실시간 반영</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectSpeed(0.7)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-extrabold transition cursor-pointer border ${
                    gameSpeed === 0.7
                      ? 'bg-emerald-500 border-emerald-600 text-white shadow-xs'
                      : 'bg-[#FAF8F5] border-[#EBE6DD] text-[#2D2A26] hover:bg-[#F2EDE4]'
                  }`}
                >
                  0.7x 느림
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectSpeed(1.0)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-extrabold transition cursor-pointer border ${
                    gameSpeed === 1.0
                      ? 'bg-sky-500 border-sky-600 text-white shadow-xs'
                      : 'bg-[#FAF8F5] border-[#EBE6DD] text-[#2D2A26] hover:bg-[#F2EDE4]'
                  }`}
                >
                  1.0x 보통
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectSpeed(1.3)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-extrabold transition cursor-pointer border ${
                    gameSpeed === 1.3
                      ? 'bg-rose-500 border-rose-600 text-white shadow-xs'
                      : 'bg-[#FAF8F5] border-[#EBE6DD] text-[#2D2A26] hover:bg-[#F2EDE4]'
                  }`}
                >
                  1.3x 빠름
                </button>
              </div>
            </div>

            {/* 사운드 / 브라우저 전체화면 / 가이드 퀵 버튼 */}
            <div className="grid grid-cols-2 gap-1.5 mb-4">
              <button
                type="button"
                onClick={handleToggleMute}
                className="py-2 px-3 rounded-xl bg-white hover:bg-[#F7F4EE] border border-[#EBE6DD] text-xs font-bold text-[#2D2A26] flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {isMuted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                    <span>사운드 OFF</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>사운드 ON</span>
                  </>
                )}
              </button>

              {onOpenHowTo && (
                <button
                  type="button"
                  onClick={onOpenHowTo}
                  className="py-2 px-3 rounded-xl bg-white hover:bg-[#F7F4EE] border border-[#EBE6DD] text-xs font-bold text-[#2D2A26] flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
                  <span>조작 & 공략</span>
                </button>
              )}

              {fullscreenSupported && (
                <button
                  type="button"
                  onClick={() => void handleToggleBrowserFullscreen()}
                  className="col-span-2 py-2 px-3 rounded-xl bg-white hover:bg-[#F7F4EE] border border-[#EBE6DD] text-xs font-bold text-[#2D2A26] flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  {isBrowserFs ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>브라우저 주소창 복원</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>브라우저 전체화면 확장</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* 계속 비행 / 로비 복귀 */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                data-flight-resume-btn="true"
                onClick={handleResumeGame}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-black text-sm shadow-md transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Play className="w-4 h-4 fill-white" />
                계속 비행하기
              </button>

              <button
                type="button"
                data-flight-exit-btn="true"
                onClick={handleReturnToLobby}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-[#F2EDE4] border border-[#EBE6DD] text-[#2D2A26] font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5 text-[#7A756D]" />
                로비 화면으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
