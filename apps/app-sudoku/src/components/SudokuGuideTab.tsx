import React from 'react';

export const SudokuGuideTab: React.FC = () => {
    return (
        <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4 animate-fade-in bg-slate-50">
            {/* 가이드 헤더 */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm">
                <span className="text-[11px] font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                    MASTER STRATEGY
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-2">스도쿠 필승 4대 정석 공식</h2>
                <p className="text-xs text-slate-500 mt-1">
                    초보자부터 고급자까지 1분 만에 마스터하는 단계별 논리 추론 기술
                </p>
            </div>

            {/* 공식 1: Naked Single */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                        1
                    </span>
                    <h3 className="text-sm font-black text-slate-900">단일 후보수 (Naked Single)</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                    특정 셀이 속한 <strong>가로행, 세로열, 3×3 블록</strong>에 이미 등장한 숫자들을 모두 제외했을 때, <strong>오직 1개의 숫자만 들어갈 수 있는 경우</strong> 즉시 해당 숫자를 확정합니다.
                </p>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-[11px] text-slate-700 font-medium">
                    💡 <strong>실전 팁:</strong> 주변에 8개의 서로 다른 숫자가 채워진 빈 셀을 찾는 것이 가장 빠른 첫걸음입니다.
                </div>
            </div>

            {/* 공식 2: Hidden Single */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center justify-center">
                        2
                    </span>
                    <h3 className="text-sm font-black text-slate-900">숨은 후보수 (Hidden Single)</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                    한 셀 자체에는 여러 숫자가 들어갈 수 있지만, 어떤 <strong>행이나 열, 블록 전체를 통틀어 특정 숫자(예: 7)가 들어갈 수 있는 자리가 단 한 곳뿐인 경우</strong>입니다.
                </p>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-[11px] text-slate-700 font-medium">
                    💡 <strong>실전 팁:</strong> 1부터 9까지 각 숫자를 하나씩 지정하여 보드 전체의 가로/세로 레이저 차단선을 그어보세요.
                </div>
            </div>

            {/* 공식 3: Naked Pair */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-violet-600 text-white text-xs font-black flex items-center justify-center">
                        3
                    </span>
                    <h3 className="text-sm font-black text-slate-900">후보수 쌍 (Naked Pair / Trio)</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                    동일한 행, 열, 또는 블록 내의 두 셀에 정확히 <strong>동일한 2개의 후보 숫자(예: [2, 5])</strong>만 들어갈 수 있다면, 그 영역 내의 다른 모든 셀에서는 2와 5를 후보에서 완벽히 배제할 수 있습니다.
                </p>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-[11px] text-slate-700 font-medium">
                    💡 <strong>실전 팁:</strong> 연필 메모(Notes) 모드를 켜서 후보 숫자를 표기하면 손쉽게 쌍을 발견할 수 있습니다.
                </div>
            </div>

            {/* 공식 4: X-Wing */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-pink-600 text-white text-xs font-black flex items-center justify-center">
                        4
                    </span>
                    <h3 className="text-sm font-black text-slate-900">엑스윙 패턴 (X-Wing)</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                    두 개의 서로 다른 행에서 특정 숫자가 정확히 동일한 두 열에만 들어갈 수 있어 사각형 모서리를 형성할 때, 해당 두 열의 다른 행들에서는 그 숫자를 모두 지울 수 있는 상급 기술입니다.
                </p>
            </div>
        </div>
    );
};
