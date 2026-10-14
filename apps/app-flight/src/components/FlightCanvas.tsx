import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  GameEngineState,
  createInitialState,
  updateGameEngine,
  renderGameEngine,
  triggerPlayerRoll,
  triggerPlayerBomb,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from '../engine/gameLoop';
import { DifficultyRank } from '../engine/types';
import { Heart, Bomb, RotateCw, Zap, Play, Gauge, ShieldAlert } from 'lucide-react';

interface FlightCanvasProps {
  onGameOver: (score: number, kills: number, highScore: number) => void;
  onStateUpdate?: (state: GameEngineState) => void;
  highScore?: number;
  rollTriggerRequested?: number;
  bombTriggerRequested?: number;
  restartTriggerRequested?: number;
}

export const FlightCanvas: React.FC<FlightCanvasProps> = ({
  onGameOver,
  onStateUpdate,
  highScore = 0,
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
    lives: number;
    bombs: number;
    rolls: number;
    weaponLevel: number;
    hasEscorts: boolean;
    kills: number;
    status: string;
    difficultyRank: DifficultyRank;
  }>({
    score: 0,
    lives: 3,
    bombs: 2,
    rolls: 3,
    weaponLevel: 1,
    hasEscorts: false,
    kills: 0,
    status: 'ready',
    difficultyRank: 'NORMAL',
  });

  // 속도 변경 핸들러
  const handleSelectSpeed = useCallback((newSpeed: number) => {
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
    const next = gameSpeed === 0.7 ? 1.0 : gameSpeed === 1.0 ? 1.3 : 0.7;
    handleSelectSpeed(next);
  }, [gameSpeed, handleSelectSpeed]);

  // 게임 시작 트리거
  const handleStartGame = useCallback(() => {
    gameOverReportedRef.current = false;
    stateRef.current = createInitialState(gameSpeed);
    stateRef.current.player.highScore = Math.max(stateRef.current.player.highScore, highScore);
    stateRef.current.status = 'playing';
    setHudState({
      score: 0,
      lives: 3,
      bombs: 2,
      rolls: 3,
      weaponLevel: 1,
      hasEscorts: false,
      kills: 0,
      status: 'playing',
      difficultyRank: 'NORMAL',
    });
    if (onStateUpdate) {
      onStateUpdate(stateRef.current);
    }
  }, [gameSpeed, highScore, onStateUpdate]);

  // 외부(게임오버 모달 등)에서 재시작 요청 처리
  useEffect(() => {
    if (restartTriggerRequested > 0 && restartTriggerRequested !== prevRestartRef.current) {
      prevRestartRef.current = restartTriggerRequested;
      gameOverReportedRef.current = false;
      stateRef.current = createInitialState(gameSpeed);
      stateRef.current.player.highScore = Math.max(stateRef.current.player.highScore, highScore);
      stateRef.current.status = 'playing';
      setHudState({
        score: 0,
        lives: 3,
        bombs: 2,
        rolls: 3,
        weaponLevel: 1,
        hasEscorts: false,
        kills: 0,
        status: 'playing',
        difficultyRank: 'NORMAL',
      });
      if (onStateUpdate) {
        onStateUpdate(stateRef.current);
      }
    }
  }, [restartTriggerRequested, gameSpeed, highScore, onStateUpdate]);

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

  // 상대 드래그 이동 적용 헬퍼
  const applyRelativeMove = (screenDeltaX: number, screenDeltaY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const state = stateRef.current;
    if (state.status !== 'playing') return;

    const p = state.player;
    p.x += screenDeltaX * scaleX;
    p.y += screenDeltaY * scaleY;

    // 캔버스 화면 경계 클램핑
    const halfW = p.width / 2;
    const halfH = p.height / 2;
    if (p.x < halfW + 10) p.x = halfW + 10;
    if (p.x > CANVAS_WIDTH - halfW - 10) p.x = CANVAS_WIDTH - halfW - 10;
    if (p.y < halfH + 20) p.y = halfH + 20;
    if (p.y > CANVAS_HEIGHT - halfH - 15) p.y = CANVAS_HEIGHT - halfH - 15;
  };

  // 메인 애니메이션 루프 (60fps)
  useEffect(() => {
    let animId: number;

    const loop = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const state = stateRef.current;

      if (canvas && ctx) {
        try {
          // 엔진 프레임 업데이트
          updateGameEngine(state, keysRef.current);

          // 렌더링
          renderGameEngine(ctx, state);

          // 주기적 HUD 및 상태 동기화 (매 3프레임마다)
          if (state.currentFrame % 3 === 0) {
            setHudState({
              score: state.player.score,
              lives: state.player.lives,
              bombs: state.player.bombs,
              rolls: state.player.rolls,
              weaponLevel: state.player.weaponLevel,
              hasEscorts: state.player.hasEscorts,
              kills: state.player.kills,
              status: state.status,
              difficultyRank: state.difficultyRank || 'NORMAL',
            });
            if (onStateUpdate) {
              onStateUpdate(state);
            }
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
      {/* 🌟 상단 스코어 전광판 바 (모바일/450px 팝업에서도 현재 점수·최고 기록·격추 수가 선명하게 표시됨) */}
      <div className="w-full grid grid-cols-3 gap-1.5 mb-1.5">
        <div className="bg-white rounded-xl px-3 py-1.5 border border-sky-200 shadow-2xs flex items-center justify-between">
          <span className="text-[10px] font-extrabold text-sky-600 uppercase tracking-wider">SCORE</span>
          <span className="font-mono text-sm sm:text-base font-black text-sky-700">
            {hudState.score.toLocaleString()}
          </span>
        </div>
        <div className="bg-white rounded-xl px-3 py-1.5 border border-amber-200 shadow-2xs flex items-center justify-between">
          <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">BEST</span>
          <span className="font-mono text-sm sm:text-base font-black text-amber-600">
            {liveBestScore.toLocaleString()}
          </span>
        </div>
        <div className="bg-white rounded-xl px-3 py-1.5 border border-rose-200 shadow-2xs flex items-center justify-between">
          <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider">KILLS</span>
          <span className="font-mono text-sm sm:text-base font-black text-rose-600">
            {hudState.kills.toLocaleString()}기
          </span>
        </div>
      </div>

      {/* HUD 전술 상태 바 */}
      <div className="w-full flex items-center justify-between px-3 py-1.5 mb-1.5 bg-white rounded-xl border border-[#EBE6DD] shadow-2xs text-xs font-bold">
        {/* 잔여 기체 (라이프) */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-[#7A756D] mr-0.5">기체:</span>
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

        {/* 무기 레벨 */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800">
          <Zap className="w-3 h-3 text-amber-600 fill-amber-500" />
          <span>LV.{hudState.weaponLevel}</span>
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
            if (stateRef.current.status === 'ready') handleStartGame();
            mouseDragRef.current = {
              active: true,
              lastX: e.clientX,
              lastY: e.clientY,
            };
          }}
          onMouseMove={(e) => {
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

            <button
              onClick={handleStartGame}
              data-screenshot-click="action"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-stone-900 font-extrabold text-sm shadow-lg transition active:scale-95 cursor-pointer"
            >
              전투기 출격 시작
            </button>
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
