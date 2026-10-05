import React from 'react';

export const MinesweeperGuideTab: React.FC = () => {
    return (
        <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4 animate-fade-in bg-slate-50">
            {/* 가이드 헤더 */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm">
                <span className="text-[11px] font-black uppercase text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                    TACTICAL GUIDE
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-2">지뢰찾기 필승 4대 핵심 패턴</h2>
                <p className="text-xs text-slate-500 mt-1">
                    운에 기대지 않고 논리만으로 100% 안전한 셀을 찾아내는 프로 테크닉
                </p>
            </div>

            {/* 패턴 1: 1-1 기본 패턴 */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                        1
                    </span>
                    <h3 className="text-sm font-black text-slate-900">벽면 1-1 감축 패턴 (1-1 Pattern)</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                    벽면과 접한 두 개의 '1'이 나란히 있을 때, 첫 번째 '1'이 감당하는 미개봉 셀이 두 번째 '1'의 범위에 완전히 포함된다면, <strong>두 번째 '1'에만 닿아 있는 바깥쪽 셀은 100% 안전</strong>합니다.
                </p>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-[11px] text-slate-700 font-medium">
                    💡 <strong>실전 팁:</strong> 바깥쪽 안전한 셀을 먼저 열어 숫자를 확인하면 지뢰 위치가 즉시 드러납니다.
                </div>
            </div>

            {/* 패턴 2: 1-2-1 시메트리 패턴 */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-black flex items-center justify-center">
                        2
                    </span>
                    <h3 className="text-sm font-black text-slate-900">황금의 1-2-1 대칭 패턴 (1-2-1 Pattern)</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                    직선 벽면에 '1 - 2 - 1'이 연속으로 배치되어 있다면, <strong>양쪽 '1' 앞의 셀에 각각 지뢰가 1개씩 존재하며, 가운데 '2' 앞의 셀은 100% 안전</strong>합니다.
                </p>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-[11px] text-slate-700 font-medium">
                    💡 <strong>암기 공식:</strong> 1-2-1의 지뢰 위치는 항상 [💣 깃발 - 안전한 빈칸 - 💣 깃발] 형태입니다.
                </div>
            </div>

            {/* 패턴 3: 1-2-2-1 더블 패턴 */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center justify-center">
                        3
                    </span>
                    <h3 className="text-sm font-black text-slate-900">1-2-2-1 듀얼 패턴 (1-2-2-1 Pattern)</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                    벽면에 '1 - 2 - 2 - 1'이 나란히 있는 경우, <strong>가운데 두 개의 '2' 앞에 각각 1개씩 지뢰가 존재</strong>하며, 양쪽 끝 '1'의 정면 셀은 모두 안전합니다.
                </p>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-[11px] text-slate-700 font-medium">
                    💡 <strong>암기 공식:</strong> 1-2-2-1의 지뢰 배치는 [안전한 빈칸 - 💣 깃발 - 💣 깃발 - 안전한 빈칸]입니다.
                </div>
            </div>

            {/* 패턴 4: Chording 초고속 클리어 */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-purple-600 text-white text-xs font-black flex items-center justify-center">
                        4
                    </span>
                    <h3 className="text-sm font-black text-slate-900">초고속 클리어의 핵심: 코딩 (Chording)</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                    숫자 타일 주변에 그 숫자만큼 깃발이 모두 꽂혀 있다면, <strong>해당 숫자를 클릭(또는 터치)하는 즉시 주변의 남은 안전한 셀들이 한꺼번에 오픈</strong>됩니다.
                </p>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-[11px] text-slate-700 font-medium">
                    ⚡ <strong>시간 단축:</strong> 하나씩 클릭하는 것보다 최대 3배 이상 빠르게 랭킹 기록을 단축할 수 있습니다.
                </div>
            </div>
        </div>
    );
};
