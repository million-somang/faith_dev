import React, { useState } from 'react';

export interface LadderRung {
    fromCol: number; // 0-indexed column
    toCol: number;   // fromCol + 1
    yPercent: number; // 10% ~ 90%
}

export interface CustomLadderData {
    id: string;
    title: string;
    itemsCount: number;
    results: string[];
    rungs: LadderRung[];
}

interface CustomLadderBuilderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (ladder: CustomLadderData) => void;
}

// 사다리 가로 발판 랜덤 생성기 (각 인접 열 사이에 1~3개의 발판 생성)
function generateRungs(count: number): LadderRung[] {
    const rungs: LadderRung[] = [];
    const usedY: { [col: number]: number[] } = {};

    for (let col = 0; col < count - 1; col++) {
        usedY[col] = [];
        // 각 인접 열 사이에 2~3개의 가로선 배치
        const rungCount = Math.floor(Math.random() * 2) + 2; 
        for (let i = 0; i < rungCount; i++) {
            let y = Math.floor(Math.random() * 70) + 15; // 15% ~ 85%
            // 겹치지 않게 최소 8% 간격 유지
            let attempts = 0;
            while (usedY[col].some(existingY => Math.abs(existingY - y) < 8) && attempts < 10) {
                y = Math.floor(Math.random() * 70) + 15;
                attempts++;
            }
            usedY[col].push(y);
            rungs.push({
                fromCol: col,
                toCol: col + 1,
                yPercent: y
            });
        }
    }
    // yPercent 기준으로 오름차순 정렬
    return rungs.sort((a, b) => a.yPercent - b.yPercent);
}

export const CustomLadderBuilderModal: React.FC<CustomLadderBuilderModalProps> = ({
    isOpen,
    onClose,
    onSubmit
}) => {
    const [title, setTitle] = useState('오늘의 커피 내기 ☕');
    const [itemsCount, setItemsCount] = useState<number>(4);
    const [results, setResults] = useState<string[]>([
        '☕ 커피 쏘기 당첨!',
        '🎉 세이프! (통과)',
        '🍰 디저트 사기!',
        '🎉 세이프! (통과)'
    ]);

    if (!isOpen) return null;

    // 인원수 변경 처리
    const handleCountChange = (newCount: number) => {
        setItemsCount(newCount);
        const newResults = [...results];
        while (newResults.length < newCount) {
            newResults.push(`🎉 세이프! (통과)`);
        }
        setResults(newResults.slice(0, newCount));
    };

    // 각 결과 항목 변경
    const handleResultChange = (idx: number, val: string) => {
        const updated = [...results];
        updated[idx] = val;
        setResults(updated);
    };

    // 프리셋 적용 함수
    const applyPreset = (presetName: string) => {
        if (presetName === 'coffee') {
            setTitle('오늘의 커피 쏘기 내기 ☕');
            setItemsCount(4);
            setResults(['☕ 커피 쏘기 당첨!', '🎉 세이프! (통과)', '🎉 세이프! (통과)', '🎉 세이프! (통과)']);
        } else if (presetName === 'lunch') {
            setTitle('점심 밥값 쏘기 내기 🍱');
            setItemsCount(4);
            setResults(['💸 점심 밥 사기 당첨!', '☕ 커피 쏘기!', '🎉 세이프!', '🎉 세이프!']);
        } else if (presetName === 'menu') {
            setTitle('오늘 점심 뭐 먹지? 메뉴 추천 🍕');
            setItemsCount(4);
            setResults(['🍜 따끈한 라멘/우동', '🍕 피자/파스타', '🍱 제육/김치찌개', '🍔 수제버거']);
        } else if (presetName === 'duty') {
            setTitle('오늘의 청소 & 분리수거 당번 🧹');
            setItemsCount(4);
            setResults(['🧹 사무실 청소 당첨', '📦 분리수거 당첨', '🎉 세이프!', '🎉 세이프!']);
        }
    };

    const handleCreate = () => {
        if (!title.trim()) {
            alert('사다리 제목을 입력해 주세요.');
            return;
        }
        for (let i = 0; i < itemsCount; i++) {
            if (!results[i] || !results[i].trim()) {
                alert(`${i + 1}번 결과 항목을 입력해 주세요.`);
                return;
            }
        }

        const rungs = generateRungs(itemsCount);
        const ladderData: CustomLadderData = {
            id: `ladder-${Date.now()}`,
            title: title.trim(),
            itemsCount,
            results: results.slice(0, itemsCount).map(r => r.trim()),
            rungs
        };

        onSubmit(ladderData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-y-auto">
                {/* 헤더 */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-3.5 mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-base">
                            🪜
                        </div>
                        <div>
                            <h3 className="font-extrabold text-slate-850 text-base">사다리타기 직접 만들기</h3>
                            <p className="text-[11px] text-slate-400 font-bold">인원수와 당첨/벌칙 결과를 자유롭게 설정하세요</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center text-sm cursor-pointer transition-colors"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* 사다리 제목 */}
                <div className="mb-4">
                    <label className="text-xs font-black text-slate-700 block mb-1.5">
                        📌 사다리 게임 제목
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="예: 오늘의 팀 커피 내기 ☕"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                    />
                </div>

                {/* 빠른 추천 프리셋 */}
                <div className="mb-4">
                    <span className="text-[11px] font-black text-slate-500 block mb-1.5">
                        ⚡ 빠른 추천 프리셋:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        <button
                            type="button"
                            onClick={() => applyPreset('coffee')}
                            className="p-2 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200/80 text-left transition-all cursor-pointer text-slate-700 hover:text-sky-700 hover:border-sky-200"
                        >
                            <span className="text-xs font-black block">☕ 커피 내기</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">1명 쏘기 / 3명 면제</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => applyPreset('lunch')}
                            className="p-2 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200/80 text-left transition-all cursor-pointer text-slate-700 hover:text-amber-700 hover:border-amber-200"
                        >
                            <span className="text-xs font-black block">🍱 점심 쏘기</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">밥사기 / 커피 / 면제</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => applyPreset('menu')}
                            className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200/80 text-left transition-all cursor-pointer text-slate-700 hover:text-emerald-700 hover:border-emerald-200"
                        >
                            <span className="text-xs font-black block">🍕 점심 메뉴</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">라멘 / 피자 / 제육</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => applyPreset('duty')}
                            className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200/80 text-left transition-all cursor-pointer text-slate-700 hover:text-rose-700 hover:border-rose-200"
                        >
                            <span className="text-xs font-black block">🧹 당번 정하기</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">청소 / 분리수거 / 세이프</span>
                        </button>
                    </div>
                </div>

                {/* 참여 인원 수 선택 */}
                <div className="mb-4">
                    <label className="text-xs font-black text-slate-700 block mb-1.5">
                        👥 참여 인원 수 ({itemsCount}명)
                    </label>
                    <div className="flex gap-1.5">
                        {[2, 3, 4, 5, 6].map(num => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => handleCountChange(num)}
                                className={`flex-1 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                                    itemsCount === num
                                        ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                {num}인용
                            </button>
                        ))}
                    </div>
                </div>

                {/* 각 슬롯별 결과 항목 입력 */}
                <div className="mb-6">
                    <label className="text-xs font-black text-slate-700 block mb-1.5">
                        🎯 각 슬롯 도착 결과 항목 설정
                    </label>
                    <div className="space-y-2">
                        {Array.from({ length: itemsCount }).map((_, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-mono font-black text-slate-700 shrink-0">
                                    {idx + 1}번
                                </span>
                                <input
                                    type="text"
                                    value={results[idx] || ''}
                                    onChange={(e) => handleResultChange(idx, e.target.value)}
                                    placeholder={`슬롯 ${idx + 1}번 결과 (예: 당첨, 꽝, 면제)`}
                                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* 푸터 버튼 */}
                <div className="flex gap-2.5 pt-3 border-t border-slate-100 mt-auto">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black cursor-pointer transition-colors"
                    >
                        취소
                    </button>
                    <button
                        type="button"
                        onClick={handleCreate}
                        className="flex-2 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black cursor-pointer shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    >
                        <i className="fas fa-check"></i>
                        <span>사다리 생성 & 피드에 첨부하기</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
