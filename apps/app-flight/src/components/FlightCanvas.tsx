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
import { Heart, Bomb, RotateCw, Zap, Play } from 'lucide-react';

interface FlightCanvasProps {
  onGameOver: (score: number, kills: number, highScore: number) => void;
  onStateUpdate?: (state: GameEngineState) => void;
  rollTriggerRequested?: number;
  bombTriggerRequested?: number;
}

export const FlightCanvas: React.FC<FlightCanvasProps> = ({
  onGameOver,
  onStateUpdate,
  rollTriggerRequested = 0,
  bombTriggerRequested = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameEngineState>(createInitialState());
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
  }>({
    score: 0,
    lives: 3,
    bombs: 2,
    rolls: 3,
    weaponLevel: 1,
    hasEscorts: false,
    kills: 0,
    status: 'ready',
  });

  // 게임 시작 트리거
  const handleStartGame = useCallback(() => {
    const s = stateRef.current;
    if (s.status === 'ready' || s.status === 'gameover') {
      stateRef.current = createInitialState();
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
      });
    }
  }, []);

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
          });
          if (onStateUpdate) {
            onStateUpdate(state);
          }
        }

        // 게임오버 감지
        if (state.status === 'gameover') {
          onGameOver(state.player.score, state.player.kills, state.player.highScore);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [onGameOver, onStateUpdate]);

  return (
    <div className="relative w-full max-w-[450px] mx-auto flex flex-col items-center select-none">
      {/* HUD 상단 바 */}
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

        {/* 실시간 스코어 */}
        <div className="font-mono text-sm font-black text-sky-700 tracking-wider">
          {hudState.score.toLocaleString()}
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
            <p className="text-xs text-sky-100 leading-relaxed mb-5 max-w-xs drop-shadow">
              화면을 터치하거나 Space 키를 눌러 출격하세요!<br />
              360° 공중제비(Z)와 메가 폭탄(X)으로 전장을 지배하세요.
            </p>
            <button
              onClick={handleStartGame}
              data-screenshot-click="action"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-stone-900 font-extrabold text-sm shadow-lg transition active:scale-95"
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
