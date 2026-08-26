import React, { useState } from 'react';
import { CustomLadderData, LadderRung } from './CustomLadderBuilderModal';

interface CustomLadderWidgetProps {
    ladder: CustomLadderData;
}

// 사다리 경로 계산 함수
function calculateLadderPath(
    startCol: number,
    itemsCount: number,
    rungs: LadderRung[]
): { finalCol: number; pathPoints: Array<{ xPercent: number; yPercent: number }> } {
    let currentCol = startCol;
    const colStep = 100 / (itemsCount - 1 || 1);

    const pathPoints: Array<{ xPercent: number; yPercent: number }> = [
        { xPercent: currentCol * colStep, yPercent: 0 }
    ];

    // yPercent 오름차순으로 rungs 탐색
    const sortedRungs = [...rungs].sort((a, b) => a.yPercent - b.yPercent);

    for (const rung of sortedRungs) {
        if (rung.fromCol === currentCol) {
            // 오른쪽으로 이동
            pathPoints.push({ xPercent: currentCol * colStep, yPercent: rung.yPercent });
            currentCol = rung.toCol;
            pathPoints.push({ xPercent: currentCol * colStep, yPercent: rung.yPercent });
        } else if (rung.toCol === currentCol) {
            // 왼쪽으로 이동
            pathPoints.push({ xPercent: currentCol * colStep, yPercent: rung.yPercent });
            currentCol = rung.fromCol;
            pathPoints.push({ xPercent: currentCol * colStep, yPercent: rung.yPercent });
        }
    }

    pathPoints.push({ xPercent: currentCol * colStep, yPercent: 100 });
    return { finalCol: currentCol, pathPoints };
}

export const CustomLadderWidget: React.FC<CustomLadderWidgetProps> = ({ ladder }) => {
    const { title, itemsCount, results, rungs } = ladder;

    const [selectedStart, setSelectedStart] = useState<number | null>(null);
    const [activePath, setActivePath] = useState<Array<{ xPercent: number; yPercent: number }> | null>(null);
    const [finalResult, setFinalResult] = useState<{ col: number; text: string } | null>(null);
    const [isTracing, setIsTracing] = useState(false);
    const [showAllResults, setShowAllResults] = useState(false);

    // 번호 선택 시 사다리 타기 실행
    const handleSelectStart = (startCol: number) => {
        if (isTracing) return;
        setIsTracing(true);
        setSelectedStart(startCol);
        setShowAllResults(false);
        setFinalResult(null);

        const { finalCol, pathPoints } = calculateLadderPath(startCol, itemsCount, rungs);
        setActivePath(pathPoints);

        // 1초 후 결과 출력
        setTimeout(() => {
            setFinalResult({
                col: finalCol,
                text: results[finalCol] || '결과 없음'
            });
            setIsTracing(false);
        }, 800);
    };

    const colStep = 100 / (itemsCount - 1 || 1);

    return (
        <div className="my-3 p-4 sm:p-5 rounded-3xl bg-slate-900 border border-sky-500/30 text-white shadow-xl relative overflow-hidden">
            {/* 은은한 네온 배경 효과 */}
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* 헤더 바 */}
            <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🪜</span>
                    <div>
                        <h4 className="text-sm font-black text-white tracking-tight">{title}</h4>
                        <span className="text-[10px] text-sky-400 font-bold">인터랙티브 실시간 사다리판 ({itemsCount}인용)</span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setShowAllResults(prev => !prev)}
                    className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-[10px] font-black transition-all cursor-pointer"
                >
                    {showAllResults ? '사다리판 보기' : '전체 결과 한눈에'}
                </button>
            </div>

            {/* 상단 시작 번호 버튼들 */}
            <div className="mb-4">
                <p className="text-xs text-slate-300 font-bold mb-2 text-center">
                    👇 사다리를 탈 번호를 터치하세요:
                </p>
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${itemsCount}, minmax(0, 1fr))` }}>
                    {Array.from({ length: itemsCount }).map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSelectStart(idx)}
                            disabled={isTracing}
                            className={`py-2 rounded-2xl font-black text-xs transition-all cursor-pointer shadow-md ${
                                selectedStart === idx
                                    ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-white ring-2 ring-sky-300 scale-105'
                                    : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
                            }`}
                        >
                            {idx + 1}번
                        </button>
                    ))}
                </div>
            </div>

            {/* 사다리 보드 그래픽 영역 */}
            {!showAllResults ? (
                <div className="relative w-full h-44 bg-slate-950/80 rounded-2xl border border-white/10 p-4 mb-4 overflow-hidden">
                    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                        {/* 1. 세로 기준선들 */}
                        {Array.from({ length: itemsCount }).map((_, idx) => (
                            <line
                                key={`v-${idx}`}
                                x1={idx * colStep}
                                y1="0"
                                x2={idx * colStep}
                                y2="100"
                                stroke="#475569"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        ))}

                        {/* 2. 가로 발판들 (Rungs) */}
                        {rungs.map((rung, idx) => (
                            <line
                                key={`r-${idx}`}
                                x1={rung.fromCol * colStep}
                                y1={rung.yPercent}
                                x2={rung.toCol * colStep}
                                y2={rung.yPercent}
                                stroke="#38bdf8"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            />
                        ))}

                        {/* 3. 선택된 경로 하이라이트 주행 선 */}
                        {activePath && (
                            <polyline
                                points={activePath.map(p => `${p.xPercent},${p.yPercent}`).join(' ')}
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="animate-pulse"
                            />
                        )}
                    </svg>
                </div>
            ) : (
                /* 전체 결과 보기 모드 */
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 mb-4 animate-fade-in">
                    <h5 className="text-xs font-black text-amber-300 mb-2.5 text-center">📋 사다리 전체 결과 표</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        {Array.from({ length: itemsCount }).map((_, startIdx) => {
                            const { finalCol } = calculateLadderPath(startIdx, itemsCount, rungs);
                            return (
                                <div key={startIdx} className="p-2 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                                    <span className="font-bold text-sky-400 font-mono">{startIdx + 1}번 선택 ➡️</span>
                                    <span className="font-black text-slate-100 truncate ml-1">{results[finalCol]}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 하단 슬롯 결과 프리뷰 */}
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${itemsCount}, minmax(0, 1fr))` }}>
                {results.map((res, idx) => (
                    <div
                        key={idx}
                        className={`p-1.5 rounded-xl border text-center text-[10px] font-extrabold truncate transition-all ${
                            finalResult && finalResult.col === idx
                                ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 scale-105 shadow-md animate-bounce-subtle'
                                : 'bg-white/5 text-slate-400 border-white/5'
                        }`}
                        title={res}
                    >
                        {res}
                    </div>
                ))}
            </div>

            {/* 실시간 주행 중 or 최종 결과 팝업 */}
            {isTracing && (
                <div className="mt-3 py-2 px-3 bg-sky-500/20 border border-sky-400/30 rounded-xl text-center text-xs font-bold text-sky-300 animate-pulse">
                    🚶‍♂️ {selectedStart! + 1}번에서 사다리를 타고 내려가는 중...
                </div>
            )}

            {finalResult && !isTracing && (
                <div className="mt-3 p-3 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-400/40 rounded-2xl text-center animate-fade-in">
                    <span className="text-[11px] text-amber-200 font-bold block">
                        🎉 [{selectedStart! + 1}번] 사다리 도착 결과:
                    </span>
                    <div className="text-sm font-black text-amber-300 mt-0.5">
                        {finalResult.text}
                    </div>
                </div>
            )}
        </div>
    );
};
