import React, { useState } from 'react';

interface FaqItem {
    q: string;
    a: string;
}

const FAQ_LIST: FaqItem[] = [
    {
        q: '베라 스도쿠의 퍼즐은 유일한 정답(Unique Solution)을 보장하나요?',
        a: '네, 100% 보장합니다. 베라 스도쿠의 알고리즘은 백트래킹 기반의 정밀 솔버를 통해 수학적으로 오직 단 하나의 유일해만 존재하는 고품질 퍼즐만을 엄선하여 생성합니다.'
    },
    {
        q: '스도쿠를 풀 때 추측이나 찍기가 필요한가요?',
        a: '전혀 필요하지 않습니다. 베라 스도쿠에서 제공하는 모든 난이도의 문제는 순수 논리적 연역 추론만으로 100% 풀리도록 설계되었습니다. 막힐 때는 연필 메모(Notes) 모드나 힌트를 활용해 보세요.'
    },
    {
        q: '실수(Mistake) 3회를 초과하면 어떻게 되나요?',
        a: '스도쿠 대국의 긴장감과 집중력을 위해 최대 3회의 실수 허용치가 제공됩니다. 3회 초과 시 게임이 종료되며, 새로운 대국을 시작할 수 있습니다.'
    },
    {
        q: '스도쿠 플레이가 치매 예방이나 뇌 건강에 실제로 도움이 되나요?',
        a: '다수의 신경학 연구에 따르면 스도쿠와 같은 숫자 논리 퍼즐은 뇌세포 간 시냅스 연결을 강화하고 단기 작업 기억력 및 문제 해결 능력을 유지하여 인지 기능 감퇴를 예방하는 데 유의미한 도움을 줍니다.'
    },
    {
        q: '연필(메모) 모드는 어떻게 작동하나요?',
        a: '하단 툴바의 [연필/메모] 버튼을 탭하면 메모 모드가 활성화됩니다. 이 상태에서 숫자를 누르면 해당 셀에 작은 후보 숫자가 메모 형태로 기록되며, 확정 숫자를 입력하면 같은 행·열·블록의 메모가 자동으로 지워집니다.'
    }
];

export const SudokuFaqTab: React.FC = () => {
    const [openIdx, setOpenIdx] = useState<number | null>(0);

    return (
        <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-3 animate-fade-in bg-slate-50">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm">
                <span className="text-[11px] font-black uppercase text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                    FREQUENTLY ASKED QUESTIONS
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-2">자주 묻는 질문 (FAQ)</h2>
                <p className="text-xs text-slate-500 mt-1">스도쿠 규칙, 두뇌 훈련 효과 및 시스템 이용 안내</p>
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
                                    <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-black shrink-0">
                                        Q
                                    </span>
                                    <span>{item.q}</span>
                                </span>
                                <i className={`fas fa-chevron-down text-slate-400 text-xs transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}></i>
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
