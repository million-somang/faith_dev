import React, { useRef, useState, useEffect } from 'react';
import { Gem, BOARD_SIZE, GEM_COLORS, EffectEvent, GemType } from '../hooks/useVeraPopEngine';

interface VeraPopCanvasProps {
    board: Gem[][];
    selectedGem: { r: number; c: number } | null;
    isFever: boolean;
    effects?: EffectEvent[];
    onCellClick: (r: number, c: number) => void;
    onSwipe: (r1: number, c1: number, r2: number, c2: number) => void;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    rotation: number;
    vRot: number;
    alpha: number;
    shape: 'diamond' | 'square' | 'circle';
}

interface Shockwave {
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    color: string;
    alpha: number;
}

export default function VeraPopCanvas({
    board,
    selectedGem,
    isFever,
    effects = [],
    onCellClick,
    onSwipe,
}: VeraPopCanvasProps) {
    const boardRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const shockwavesRef = useRef<Shockwave[]>([]);
    const animationFrameRef = useRef<number | null>(null);
    const [isShaking, setIsShaking] = useState(false);

    const touchStartRef = useRef<{ r: number; c: number; x: number; y: number } | null>(null);
    const [, setDragOverCell] = useState<{ r: number; c: number } | null>(null);

    // 🎨 60fps 초고속 Canvas 2D 파티클 & 쇼크웨이브 렌더러 (shadowBlur 제거로 100% 렉 프리)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        let isRunning = true;

        const render = () => {
            if (!isRunning) return;

            if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 1. 쇼크웨이브 링 렌더링
            const waves = shockwavesRef.current;
            for (let i = waves.length - 1; i >= 0; i--) {
                const w = waves[i];
                w.radius += (w.maxRadius - w.radius) * 0.18 + 0.5;
                w.alpha -= 0.04;

                if (w.alpha <= 0 || w.radius >= w.maxRadius) {
                    waves.splice(i, 1);
                    continue;
                }

                ctx.save();
                ctx.globalAlpha = Math.max(0, w.alpha);
                ctx.strokeStyle = w.color;
                ctx.lineWidth = Math.max(1, 4 * w.alpha);
                ctx.beginPath();
                ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }

            // 2. 파편 파티클 렌더링 (최대 80개 상한선 관리)
            const particles = particlesRef.current;
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];

                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.32; // 중력 가속도
                p.vx *= 0.95; // 공기 저항
                p.rotation += p.vRot;
                p.alpha -= 0.026; // 페이드 아웃

                if (p.alpha <= 0) {
                    particles.splice(i, 1);
                    continue;
                }

                ctx.save();
                ctx.globalAlpha = Math.max(0, p.alpha);
                ctx.fillStyle = p.color;
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);

                if (p.shape === 'diamond') {
                    ctx.beginPath();
                    ctx.moveTo(0, -p.size);
                    ctx.lineTo(p.size * 0.75, 0);
                    ctx.lineTo(0, p.size);
                    ctx.lineTo(-p.size * 0.75, 0);
                    ctx.closePath();
                    ctx.fill();
                } else if (p.shape === 'circle') {
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                }

                ctx.restore();
            }

            animationFrameRef.current = requestAnimationFrame(render);
        };

        animationFrameRef.current = requestAnimationFrame(render);

        return () => {
            isRunning = false;
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, []);

    // 💥 새 이펙트 이벤트 발생 시 가벼운 파티클 & 쇼크웨이브 방출
    useEffect(() => {
        if (!effects || effects.length === 0) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const w = canvas.width || canvas.clientWidth || 360;
        const cellSize = w / BOARD_SIZE;

        let hasPop = false;

        // 파티클 상한선(Global Cap: 80개) 초과 시 오래된 파티클 정리
        if (particlesRef.current.length > 80) {
            particlesRef.current = particlesRef.current.slice(-50);
        }

        effects.forEach((eff) => {
            if (eff.type === 'pop') {
                hasPop = true;
                const cx = (eff.c + 0.5) * cellSize;
                const cy = (eff.r + 0.5) * cellSize;
                const gemColorMeta = eff.gemType !== undefined ? GEM_COLORS[eff.gemType] : null;
                const palette = gemColorMeta ? gemColorMeta.particleColors : ['#FFFFFF', '#FCD34D', '#60A5FA', '#F43F5E'];
                const waveColor = gemColorMeta ? gemColorMeta.hex : '#FFFFFF';

                // 쇼크웨이브 링 1개 추가 (Canvas 2D 직접 렌더)
                if (shockwavesRef.current.length < 6) {
                    shockwavesRef.current.push({
                        x: cx,
                        y: cy,
                        radius: 4,
                        maxRadius: cellSize * 1.4,
                        color: waveColor,
                        alpha: 0.9,
                    });
                }

                // 8~12개의 최적화된 파편 조각 방출
                const count = 8 + Math.floor(Math.random() * 5);
                for (let i = 0; i < count; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 3.0 + Math.random() * 6.0;
                    const shapeChoices: ('diamond' | 'square' | 'circle')[] = ['diamond', 'square', 'circle'];

                    particlesRef.current.push({
                        x: cx + (Math.random() - 0.5) * (cellSize * 0.4),
                        y: cy + (Math.random() - 0.5) * (cellSize * 0.4),
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed - 2.8,
                        color: palette[Math.floor(Math.random() * palette.length)],
                        size: 5 + Math.random() * 6,
                        rotation: Math.random() * Math.PI * 2,
                        vRot: (Math.random() - 0.5) * 0.4,
                        alpha: 1.0,
                        shape: shapeChoices[Math.floor(Math.random() * shapeChoices.length)],
                    });
                }
            }
        });

        if (hasPop) {
            setIsShaking(true);
            const shakeTimer = setTimeout(() => setIsShaking(false), 220);
            return () => clearTimeout(shakeTimer);
        }
    }, [effects]);

    // 터치/마우스 스와이프 제어
    const handleTouchStart = (r: number, c: number, e: React.TouchEvent | React.MouseEvent) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        touchStartRef.current = { r, c, x: clientX, y: clientY };
        onCellClick(r, c);
    };

    const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
        if (!touchStartRef.current) return;
        const { r: r1, c: c1, x: x1, y: y1 } = touchStartRef.current;
        const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
        const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;

        const dx = clientX - x1;
        const dy = clientY - y1;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 18) {
            let r2 = r1;
            let c2 = c1;
            if (Math.abs(dx) > Math.abs(dy)) {
                c2 = dx > 0 ? Math.min(BOARD_SIZE - 1, c1 + 1) : Math.max(0, c1 - 1);
            } else {
                r2 = dy > 0 ? Math.min(BOARD_SIZE - 1, r1 + 1) : Math.max(0, r1 - 1);
            }
            if (r1 !== r2 || c1 !== c2) {
                onSwipe(r1, c1, r2, c2);
            }
        }
        touchStartRef.current = null;
        setDragOverCell(null);
    };

    // 보드 내의 모든 젬을 평탄화하여 렌더링
    const allGems: Gem[] = [];
    board.forEach((row) => {
        row.forEach((gem) => {
            if (gem) allGems.push(gem);
        });
    });

    return (
        <div className="w-full max-w-[420px] mx-auto p-1 sm:p-2">
            <div
                ref={boardRef}
                className={`relative aspect-square w-full bg-slate-950/95 rounded-3xl p-2 sm:p-2.5 shadow-2xl border-4 transition-all duration-300 overflow-hidden ${
                    isShaking ? 'board-shake' : ''
                } ${isFever ? 'fever-active-border scale-[1.01]' : 'border-slate-800'}`}
                style={{ touchAction: 'none' }}
                onMouseUp={handleTouchEnd}
                onTouchEnd={handleTouchEnd}
            >
                {/* 1. 배경 보드 격자 셀 */}
                <div className="grid grid-cols-8 grid-rows-8 gap-1.5 w-full h-full absolute inset-0 p-2 sm:p-2.5 pointer-events-none">
                    {Array(64).fill(0).map((_, i) => (
                        <div
                            key={`grid_${i}`}
                            className="w-full h-full rounded-2xl bg-slate-900/60 border border-slate-800/60 shadow-inner"
                        />
                    ))}
                </div>

                {/* 2. 절대 좌표 기반 보석 레이어 (스왑 & 젤리 낙하 & 안정적 가시성 보장) */}
                <div className="absolute inset-0 p-2 sm:p-2.5">
                    {allGems.map((gem) => {
                        const isSelected = selectedGem?.r === gem.row && selectedGem?.c === gem.col;
                        const gemMeta = GEM_COLORS[gem.type] || GEM_COLORS[0];
                        const isMatched = gem.isMatched;
                        const isNew = gem.isNew;

                        return (
                            <div
                                key={gem.id}
                                onMouseDown={(e) => handleTouchStart(gem.row, gem.col, e)}
                                onTouchStart={(e) => handleTouchStart(gem.row, gem.col, e)}
                                className={`absolute p-0.5 sm:p-1 cursor-pointer select-none ${
                                    isMatched ? 'gem-breaking' : isNew ? 'gem-squash-drop' : ''
                                } ${isSelected ? 'z-30' : isMatched ? 'z-40' : 'z-10'}`}
                                style={{
                                    left: `${(gem.col / BOARD_SIZE) * 100}%`,
                                    top: `${(gem.row / BOARD_SIZE) * 100}%`,
                                    width: `${100 / BOARD_SIZE}%`,
                                    height: `${100 / BOARD_SIZE}%`,
                                    transition: isMatched
                                        ? 'none'
                                        : 'top 260ms cubic-bezier(0.175, 0.885, 0.32, 1.275), left 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 160ms ease-out',
                                }}
                            >
                                <div
                                    className={`w-full h-full rounded-2xl flex items-center justify-center relative transition-transform duration-150 ${
                                        isSelected
                                            ? 'scale-110 ring-4 ring-white ring-offset-2 ring-offset-slate-950 shadow-2xl'
                                            : 'hover:scale-105 active:scale-95'
                                    }`}
                                    style={{
                                        background: `radial-gradient(circle at 35% 35%, ${gemMeta.hex} 0%, #0f172a 100%)`,
                                        boxShadow: isSelected
                                            ? `0 0 20px ${gemMeta.glow}`
                                            : `0 3px 6px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.4)`,
                                    }}
                                >
                                    {/* 1. 사파이어 블루: 다이아몬드 형태 */}
                                    {gem.type === 0 && (
                                        <div className="w-3/5 h-3/5 rotate-45 rounded-sm bg-gradient-to-tr from-blue-300 to-white shadow-inner flex items-center justify-center">
                                            <div className="w-1/2 h-1/2 bg-blue-600 rounded-2xs shadow-sm"></div>
                                        </div>
                                    )}

                                    {/* 2. 에메랄드 그린: 팔각형 / 에메랄드 컷 */}
                                    {gem.type === 1 && (
                                        <div className="w-3/5 h-3/5 rounded-lg bg-gradient-to-tr from-emerald-300 to-white shadow-inner flex items-center justify-center">
                                            <div className="w-1/2 h-1/2 bg-emerald-600 rounded-sm shadow-sm"></div>
                                        </div>
                                    )}

                                    {/* 3. 아메지스트 퍼플: 육각형 / 원형 보석 */}
                                    {gem.type === 2 && (
                                        <div className="w-3/5 h-3/5 rounded-full bg-gradient-to-tr from-purple-300 to-white shadow-inner flex items-center justify-center">
                                            <div className="w-1/2 h-1/2 bg-purple-600 rounded-full shadow-sm"></div>
                                        </div>
                                    )}

                                    {/* 4. 토파즈 옐로우: 피라미드 삼각형 */}
                                    {gem.type === 3 && (
                                        <div className="w-3/5 h-3/5 bg-gradient-to-tr from-amber-300 to-white clip-triangle shadow-inner flex items-center justify-center rounded-sm">
                                            <div className="w-1/2 h-1/2 bg-amber-600 rounded-2xs shadow-sm"></div>
                                        </div>
                                    )}

                                    {/* 5. 루비 레드: 하트 / 각진 젬 */}
                                    {gem.type === 4 && (
                                        <div className="w-3/5 h-3/5 rotate-12 rounded-md bg-gradient-to-tr from-rose-300 to-white shadow-inner flex items-center justify-center">
                                            <div className="w-1/2 h-1/2 bg-red-600 rounded-2xs shadow-sm"></div>
                                        </div>
                                    )}

                                    {/* 특수 젬 오버레이: 라인 레이저 (4매칭) */}
                                    {(gem.special === 'laser_h' || gem.special === 'laser_v') && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-white text-xs font-black drop-shadow-[0_0_8px_white] animate-pulse">
                                                {gem.special === 'laser_h' ? '⚡━' : '⚡┃'}
                                            </span>
                                        </div>
                                    )}

                                    {/* 특수 젬 오버레이: 무지개 폭탄 (5매칭) */}
                                    {gem.special === 'rainbow' && (
                                        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-gradient-to-r from-red-500 via-yellow-400 via-green-500 via-blue-500 to-purple-500 p-0.5 animate-spin">
                                            <div className="w-full h-full bg-slate-900 rounded-2xl flex items-center justify-center">
                                                <span className="text-xs">🌈</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 3. 파티클 & 쇼크웨이브 캔버스 레이어 */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 pointer-events-none z-35 w-full h-full"
                />

                {/* 4. 특수 레이저 빔 이펙트 오버레이 */}
                {effects.map((eff) => {
                    if (eff.type === 'laser_h') {
                        return (
                            <div
                                key={eff.id}
                                className="absolute left-0 right-0 h-6 bg-gradient-to-r from-transparent via-cyan-300 to-transparent laser-beam-h pointer-events-none z-40 shadow-[0_0_25px_#38bdf8]"
                                style={{ top: `${((eff.r + 0.5) / BOARD_SIZE) * 100}%` }}
                            />
                        );
                    }
                    if (eff.type === 'laser_v') {
                        return (
                            <div
                                key={eff.id}
                                className="absolute top-0 bottom-0 w-6 bg-gradient-to-b from-transparent via-cyan-300 to-transparent laser-beam-v pointer-events-none z-40 shadow-[0_0_25px_#38bdf8]"
                                style={{ left: `${((eff.c + 0.5) / BOARD_SIZE) * 100}%` }}
                            />
                        );
                    }
                    return null;
                })}

                {/* 5. 플로팅 스코어 텍스트 오버레이 */}
                {effects.map((eff) => {
                    if (eff.type === 'score' && eff.score) {
                        return (
                            <div
                                key={eff.id}
                                className="absolute floating-score z-50 text-center font-black pointer-events-none"
                                style={{
                                    left: `${((eff.c + 0.5) / BOARD_SIZE) * 100}%`,
                                    top: `${((eff.r + 0.5) / BOARD_SIZE) * 100}%`,
                                }}
                            >
                                <div className="text-yellow-300 text-base sm:text-lg font-black drop-shadow-[0_2px_6px_rgba(0,0,0,1)] tracking-wider">
                                    +{eff.score.toLocaleString()}
                                </div>
                                {eff.combo && eff.combo > 1 && (
                                    <div className="text-rose-400 text-xs sm:text-sm font-black drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                                        🔥 {eff.combo} COMBO!
                                    </div>
                                )}
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
        </div>
    );
}




