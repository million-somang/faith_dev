import { useRef, useEffect } from 'react';
import type { Grid } from '../hooks/useGame2048';

interface GameBoardProps {
    grid: Grid;
}

export default function GameBoard({ grid }: GameBoardProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                containerRef.current.dispatchEvent(new Event('resize'));
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 현대적 뉴모피즘 타일 스타일 생성기
    const getTileStyle = (value: number) => {
        let base = 'font-black rounded-xl flex items-center justify-center select-none transition-all duration-100 ';

        // 폰트 크기
        if (value >= 1024) {
            base += 'text-lg ';
        } else if (value >= 128) {
            base += 'text-xl ';
        } else {
            base += 'text-2xl ';
        }

        switch (value) {
            case 2:
                return base + 'bg-white text-slate-800 border border-slate-200/90 shadow-2xs';
            case 4:
                return base + 'bg-amber-50 text-amber-950 border border-amber-200/80 shadow-2xs';
            case 8:
                return base + 'bg-orange-100 text-orange-950 border border-orange-200 shadow-2xs';
            case 16:
                return base + 'bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-xs';
            case 32:
                return base + 'bg-gradient-to-br from-rose-400 to-orange-500 text-white shadow-xs';
            case 64:
                return base + 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-sm';
            case 128:
                return base + 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-md';
            case 256:
                return base + 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-md ring-2 ring-yellow-300/60';
            case 512:
                return base + 'bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg ring-2 ring-emerald-300/60';
            case 1024:
                return base + 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg ring-2 ring-blue-300/60';
            case 2048:
                return base + 'bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-500 text-white shadow-xl ring-3 ring-purple-300 animate-pulse-soft';
            default:
                return base + 'bg-gradient-to-br from-slate-800 to-slate-950 text-amber-300 shadow-2xl ring-2 ring-amber-400/50';
        }
    };

    return (
        <div
            data-screenshot-point="result"
            className="w-[288px] h-[288px] mx-auto bg-slate-200/90 rounded-2xl p-2.5 shadow-inner relative select-none"
        >
            {/* 배경 그리드 빈 슬롯 */}
            <div className="grid grid-cols-4 gap-2 w-full h-full">
                {Array.from({ length: 16 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-xl bg-slate-300/45 border border-slate-300/30 shadow-2xs"
                    />
                ))}
            </div>

            {/* 타일 오버레이 */}
            <div
                ref={containerRef}
                className="absolute inset-2.5 grid grid-cols-4 gap-2 pointer-events-none"
            >
                {grid.flatMap((row, r) =>
                    row.map((value, c) => {
                        if (value === 0) {
                            return <div key={`${r}-${c}`} className="rounded-xl" />;
                        }

                        const isCenter = r === 1 && c === 1;

                        return (
                            <div
                                key={`${r}-${c}`}
                                data-screenshot-click={isCenter ? 'action' : undefined}
                                className={`${getTileStyle(value)} tile-new`}
                            >
                                {value}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
