import { useRef, useEffect } from 'react';
import type { Grid } from '../hooks/useGame2048';

interface GameBoardProps {
    grid: Grid;
}

export default function GameBoard({ grid }: GameBoardProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // 리사이즈 시 타일 크기 재계산
        const handleResize = () => {
            if (containerRef.current) {
                containerRef.current.dispatchEvent(new Event('resize'));
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="bg-[#bbada0] rounded-xl p-3 sm:p-4 w-full aspect-square relative">
            {/* 배경 그리드 셀 */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full h-full">
                {Array.from({ length: 16 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-md"
                        style={{ background: 'rgba(238, 228, 218, 0.35)' }}
                    />
                ))}
            </div>

            {/* 타일 오버레이 */}
            <div
                ref={containerRef}
                className="absolute inset-3 sm:inset-4 grid grid-cols-4 gap-2 sm:gap-3"
            >
                {grid.flatMap((row, r) =>
                    row.map((value, c) => {
                        if (value === 0) {
                            return (
                                <div key={`${r}-${c}`} className="rounded-md" />
                            );
                        }

                        const tileClass = `tile-${Math.min(value, 4096)}`;
                        const fontSize = value >= 1024
                            ? 'text-lg sm:text-2xl'
                            : value >= 128
                                ? 'text-xl sm:text-3xl'
                                : 'text-2xl sm:text-4xl';

                        return (
                            <div
                                key={`${r}-${c}`}
                                className={`${tileClass} tile-new rounded-md flex items-center justify-center font-bold ${fontSize} select-none`}
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
