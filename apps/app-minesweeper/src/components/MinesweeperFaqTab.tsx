import React, { useState } from 'react';

interface FaqItem {
    q: string;
    a: string;
}

const FAQ_LIST: FaqItem[] = [
    {
        q: '첫 번째 클릭에서 지뢰가 터져 게임이 즉시 끝날 수 있나요?',
        a: '절대 그렇지 않습니다. 베라 지뢰찾기는 첫 번째 클릭 위치와 그 주변 8칸에는 지뢰가 생성되지 않도록 보장하는 100% 안전 보장 알고리즘을 적용하고 있어, 첫 클릭 시 항상 안전하게 넓은 영역이 열립니다.'
    },
    {
        q: '스마트폰이나 모바일 화면에서는 깃발을 어떻게 꽂나요?',
        a: '화면 상단 컨트롤러의 [⛏️ 파기 모드] / [🚩 깃발 모드] 전환 스위치를 눌러 원터치로 모드를 변경할 수 있습니다. 깃발 모드 상태에서는 셀을 가볍게 터치하기만 해도 즉시 깃발이 꽂힙니다.'
    },
    {
        q: 'Chording(동시 열기) 기능은 어떻게 사용하나요?',
        a: '이미 열려 있는 숫자 타일(예: 2) 주변에 정확히 2개의 깃발이 꽂혀 있을 때 그 숫자를 다시 한 번 클릭(터치)하면, 주변의 깃발이 아닌 남은 미개봉 셀들이 자동으로 안전하게 열립니다.'
    },
    {
        q: '지뢰찾기 플레이가 두뇌 회전이나 집중력 향상에 도움이 되나요?',
        a: '네, 지뢰찾기는 주변 숫자의 제약 조건을 파악하고 모순을 제거해 나가는 전형적인 연역 논리 추론 게임입니다. 순간적인 패턴 인지와 작업 기억력, 공간 판단력을 지속적으로 자극하여 뇌 건강 유지에 효과적입니다.'
    },
    {
        q: '명예의 전당 점수는 어떻게 산정되나요?',
        a: '기본 10,000점에서 클리어 소요 시간(초)에 비례하여 감산되는 방식으로 산출되며, 난이도별 최단 시간 기록이 전 세계 플레이어 랭킹에 실시간 반영됩니다.'
    }
];

export const MinesweeperFaqTab: React.FC = () => {
    const [openIdx, setOpenIdx] = useState<number | null>(0);

    return (
        <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-3 animate-fade-in bg-slate-50">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm">
                <span className="text-[11px] font-black uppercase text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                    FREQUENTLY ASKED QUESTIONS
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-2">자주 묻는 질문 (FAQ)</h2>
                <p className="text-xs text-slate-500 mt-1">지뢰찾기 공식 규칙, 안전 보장 시스템 및 모바일 조작 안내</p>
            </div>

            <div className="space-y-2">
                {FAQ_LIST.map((item, idx) => {
                    const isOpen = openIdx === idx;
                    return (
                        <div 
                            key={idx}
                            className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
                        >
                            <button
                                type="button"
                                onClick={() => setOpenIdx(isOpen ? null : idx)}
                                className="w-full flex items-center justify-between p-3.5 text-left font-bold text-xs text-slate-900 hover:bg-slate-50 transition-colors"
                            >
                                <span className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-[10px] font-black shrink-0">
                                        Q
                                    </span>
                                    <span>{item.q}</span>
                                </span>
                                <i className={`fas fa-chevron-down text-slate-400 text-xs transition-transform duration-200 ${isOpen ? 'rotate-180 text-rose-600' : ''}`}></i>
                            </button>

                            {isOpen && (
                                <div className="px-3.5 pb-3.5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                                    <p>{item.a}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
