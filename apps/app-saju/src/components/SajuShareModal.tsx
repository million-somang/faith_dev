import React, { useState } from 'react';
import type { SajuResult } from '../utils/sajuCalculator';

interface SajuShareModalProps {
    result?: SajuResult;
    saju?: SajuResult;
    isOpen: boolean;
    onClose: () => void;
}

export default function SajuShareModal({ result, saju, isOpen, onClose }: SajuShareModalProps) {
    const mainSaju = result || saju;
    const [copied, setCopied] = useState(false);

    if (!isOpen || !mainSaju) return null;

    const shareUrl = window.location.href;
    const summaryText = `[베라 정통 만세력 & 사주 풀이]\n` +
        `• 이름: ${mainSaju.basic.name} 님\n` +
        `• 일주: ${mainSaju.pillars.day.gan}${mainSaju.pillars.day.ji} 일주 (${mainSaju.basic.zodiac})\n` +
        `• 오행 기운: ${mainSaju.elementsSummary.dominant} 주도 / ${mainSaju.elementsSummary.yongshin} 용신\n` +
        `• 직업 성향: ${mainSaju.businessWealth.typeTitle}\n` +
        `• 오늘의 행운 색상: ${mainSaju.microDaily.luckyColorName}\n` +
        `• 오늘의 행운 숫자: ${mainSaju.microDaily.luckyNumbers.join(', ')}\n\n` +
        `내 사주와 오행 확인하기: ${shareUrl}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(summaryText).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-stone-200/80">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                    <h3 className="text-base font-serif font-bold text-stone-900">
                        사주 풀이 결과 공유
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 text-sm"
                    >
                        ✕
                    </button>
                </div>

                {/* 정갈한 요약 카드 프리뷰 (화이트 테마) */}
                <div className="p-5 bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl mb-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase">VERA MANSERYEOK</span>
                        <span className="text-xs text-slate-500 font-bold">{mainSaju.basic.zodiac}</span>
                    </div>

                    <div className="text-center py-1">
                        <h4 className="text-lg font-serif font-bold text-slate-900">{mainSaju.basic.name} 님의 사주</h4>
                        <p className="text-xs text-indigo-700 font-semibold mt-0.5">{mainSaju.businessWealth.typeTitle}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-white border border-slate-200/80 p-3 rounded-xl text-xs">
                        <div>
                            <span className="text-slate-400 block text-[10px] font-medium">주도 오행</span>
                            <strong className="text-slate-800 font-bold">{mainSaju.elementsSummary.dominant}</strong>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[10px] font-medium">도움 오행 (용신)</span>
                            <strong className="text-amber-800 font-bold">{mainSaju.elementsSummary.yongshin}</strong>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[10px] font-medium">행운의 색상</span>
                            <strong className="text-slate-800 font-bold">{mainSaju.microDaily.luckyColorName.split(' ')[0]}</strong>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[10px] font-medium">행운의 숫자</span>
                            <strong className="text-indigo-700 font-mono font-bold">{mainSaju.microDaily.luckyNumbers.join(', ')}</strong>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <button
                        onClick={handleCopy}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                        {copied ? '결과 텍스트가 복사되었습니다.' : '공유 텍스트 복사하기'}
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
}
