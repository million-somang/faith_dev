import React, { useRef, useState } from 'react';
import { Gem, BOARD_SIZE, GEM_COLORS } from '../hooks/useVeraPopEngine';

interface VeraPopCanvasProps {
    board: Gem[][];
    selectedGem: { r: number; c: number } | null;
    isFever: boolean;
    onCellClick: (r: number, c: number) => void;
    onSwipe: (r1: number, c1: number, r2: number, c2: number) => void;
}

export default function VeraPopCanvas({
    board,
    selectedGem,
    isFever,
    onCellClick,
    onSwipe,
}: VeraPopCanvasProps) {
    const touchStartRef = useRef<{ r: number; c: number; x: number; y: number } | null>(null);
    const [dragOverCell, setDragOverCell] = useState<{ r: number; c: number } | null>(null);

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

        if (dist > 25) {
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

    return (
        <div className="w-full max-w-[420px] mx-auto p-2">
            <div 
                className={`relative aspect-square w-full bg-slate-900/95 rounded-3xl p-3 shadow-2xl border-4 transition-all duration-300 ${
                    isFever ? 'fever-active-border scale-[1.01]' : 'border-slate-800'
                }`}
                style={{ touchAction: 'none' }}
                onMouseUp={handleTouchEnd}
                onTouchEnd={handleTouchEnd}
            >
                {/* 8x8 그리드 */}
                <div className="grid grid-cols-8 grid-rows-8 gap-1.5 w-full h-full">
                    {board.map((row, r) =>
                        row.map((gem, c) => {
                            const isSelected = selectedGem?.r === r && selectedGem?.c === c;
                            const gemMeta = GEM_COLORS[gem.type];

                            return (
                                <div
                                    key={gem.id}
                                    onMouseDown={(e) => handleTouchStart(r, c, e)}
                                    onTouchStart={(e) => handleTouchStart(r, c, e)}
                                    className={`relative rounded-2xl flex items-center justify-center cursor-pointer transition-transform duration-150 select-none ${
                                        isSelected 
                                            ? 'scale-110 z-20 ring-3 ring-white ring-offset-2 ring-offset-slate-900' 
                                            : 'hover:scale-105 active:scale-95'
                                    }`}
                                    style={{
                                        background: `radial-gradient(circle at 35% 35%, ${gemMeta.hex} 0%, #0f172a 100%)`,
                                        boxShadow: isSelected 
                                            ? `0 0 15px ${gemMeta.glow}` 
                                            : `0 3px 6px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.35)`,
                                    }}
                                >
                                    {/* 1. 사파이어 블루: 다이아몬드 형태 */}
                                    {gem.type === 0 && (
                                        <div className="w-3/5 h-3/5 rotate-45 rounded-sm bg-gradient-to-tr from-blue-300 to-white shadow-inner flex items-center justify-center">
                                            <div className="w-1/2 h-1/2 bg-blue-600 rounded-2xs"></div>
                                        </div>
                                    )}

                                    {/* 2. 에메랄드 그린: 팔각형 / 에메랄드 컷 */}
                                    {gem.type === 1 && (
                                        <div className="w-3/5 h-3/5 rounded-lg bg-gradient-to-tr from-emerald-300 to-white shadow-inner flex items-center justify-center">
                                            <div className="w-1/2 h-1/2 bg-emerald-600 rounded-sm"></div>
                                        </div>
                                    )}

                                    {/* 3. 아메지스트 퍼플: 육각형 / 원형 보석 */}
                                    {gem.type === 2 && (
                                        <div className="w-3/5 h-3/5 rounded-full bg-gradient-to-tr from-purple-300 to-white shadow-inner flex items-center justify-center">
                                            <div className="w-1/2 h-1/2 bg-purple-600 rounded-full"></div>
                                        </div>
                                    )}

                                    {/* 4. 토파즈 옐로우: 피라미드 삼각형 */}
                                    {gem.type === 3 && (
                                        <div className="w-3/5 h-3/5 bg-gradient-to-tr from-amber-300 to-white clip-triangle shadow-inner flex items-center justify-center rounded-sm">
                                            <div className="w-1/2 h-1/2 bg-amber-600 rounded-2xs"></div>
                                        </div>
                                    )}

                                    {/* 5. 루비 레드: 하트 / 각진 젬 */}
                                    {gem.type === 4 && (
                                        <div className="w-3/5 h-3/5 rotate-12 rounded-md bg-gradient-to-tr from-rose-300 to-white shadow-inner flex items-center justify-center">
                                            <div className="w-1/2 h-1/2 bg-red-600 rounded-2xs"></div>
                                        </div>
                                    )}

                                    {/* 특수 젬 오버레이: 라인 레이저 (4매칭) */}
                                    {(gem.special === 'laser_h' || gem.special === 'laser_v') && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-white text-xs font-black drop-shadow-md animate-pulse">
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
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
