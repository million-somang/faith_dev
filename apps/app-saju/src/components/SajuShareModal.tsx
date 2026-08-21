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

                {/* 정갈한 요약 카드 프리뷰 */}
                <div className="p-5 bg-stone-900 text-stone-100 rounded-2xl mb-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                        <span className="text-[10px] font-semibold tracking-wider text-stone-400 uppercase">VERA MANSERYEOK</span>
                        <span className="text-xs text-stone-300">{mainSaju.basic.zodiac}</span>
                    </div>

                    <div className="text-center py-1">
                        <h4 className="text-lg font-serif font-bold text-white">{mainSaju.basic.name} 님의 사주</h4>
                        <p className="text-xs text-amber-300/90 font-medium mt-0.5">{mainSaju.businessWealth.typeTitle}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-stone-800/80 p-3 rounded-xl text-xs">
                        <div>
                            <span className="text-stone-400 block text-[10px]">주도 오행</span>
                            <strong className="text-stone-100">{mainSaju.elementsSummary.dominant}</strong>
                        </div>
                        <div>
                            <span className="text-stone-400 block text-[10px]">도움 오행 (용신)</span>
                            <strong className="text-amber-300">{mainSaju.elementsSummary.yongshin}</strong>
                        </div>
                        <div>
                            <span className="text-stone-400 block text-[10px]">행운의 색상</span>
                            <strong className="text-stone-100">{mainSaju.microDaily.luckyColorName.split(' ')[0]}</strong>
                        </div>
                        <div>
                            <span className="text-stone-400 block text-[10px]">행운의 숫자</span>
                            <strong className="text-stone-100">{mainSaju.microDaily.luckyNumbers.join(', ')}</strong>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <button
                        onClick={handleCopy}
                        className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
                    >
                        {copied ? '결과 텍스트가 복사되었습니다.' : '공유 텍스트 복사하기'}
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-xl transition-colors"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
}
