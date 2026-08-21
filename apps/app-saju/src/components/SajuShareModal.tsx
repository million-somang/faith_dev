import React, { useState } from 'react';
import type { SajuResult } from '../utils/sajuCalculator';

interface SajuShareModalProps {
    saju: SajuResult;
    isOpen: boolean;
    onClose: () => void;
}

export const SajuShareModal: React.FC<SajuShareModalProps> = ({ saju, isOpen, onClose }) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const shareUrl = window.location.href;
    const summaryText = `[Veranex Saju Pro] ${saju.basic.name}님의 사주 분석 리포트\n` +
        `• 띠/일주: ${saju.basic.zodiac} (${saju.pillars.day.gan}${saju.pillars.day.ji} 일주)\n` +
        `• 오행 밸런스: ${saju.elementsSummary.dominant} 우세 / ${saju.elementsSummary.yongshin} 용신\n` +
        `• 비즈니스 성향: ${saju.businessWealth.typeTitle}\n` +
        `• 오늘의 행운 컬러: ${saju.microDaily.luckyColorName} (${saju.microDaily.luckyHexColor})\n` +
        `• 행운의 숫자: ${saju.microDaily.luckyNumbers.join(', ')}\n\n` +
        `👉 지금 무료로 내 사주 확인하기: ${shareUrl}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(summaryText).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <span>📤</span> 사주 결과 카드 공유
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-sm"
                    >
                        ✕
                    </button>
                </div>

                {/* 인스타/카카오 프리뷰 카드 */}
                <div className="p-5 bg-gradient-to-br from-indigo-900 via-purple-950 to-slate-900 text-white rounded-2xl shadow-inner mb-4 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                        <span className="text-[10px] font-bold tracking-widest text-indigo-300 uppercase">Veranex Saju Pro</span>
                        <span className="text-xs">{saju.basic.zodiacEmoji} {saju.basic.zodiac}</span>
                    </div>

                    <div className="text-center my-3">
                        <h4 className="text-xl font-black">{saju.basic.name} 님의 사주 프로필</h4>
                        <p className="text-xs text-amber-300 font-medium mt-1">{saju.businessWealth.typeTitle}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-white/10 p-3 rounded-xl text-[11px] my-3">
                        <div>
                            <span className="text-indigo-200 block text-[10px]">오행 우세</span>
                            <strong className="text-emerald-300">{saju.elementsSummary.dominant}</strong>
                        </div>
                        <div>
                            <span className="text-indigo-200 block text-[10px]">핵심 용신</span>
                            <strong className="text-amber-300">{saju.elementsSummary.yongshin}</strong>
                        </div>
                        <div>
                            <span className="text-indigo-200 block text-[10px]">행운의 컬러</span>
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: saju.microDaily.luckyHexColor }}></span>
                                <span>{saju.microDaily.luckyColorName.split(' ')[0]}</span>
                            </div>
                        </div>
                        <div>
                            <span className="text-indigo-200 block text-[10px]">행운의 번호</span>
                            <strong className="text-rose-300">{saju.microDaily.luckyNumbers.join(', ')}</strong>
                        </div>
                    </div>

                    <p className="text-[10px] text-center text-slate-400">
                        veranex.app/entertainment/saju
                    </p>
                </div>

                <div className="space-y-2">
                    <button
                        onClick={handleCopy}
                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                    >
                        {copied ? '✅ 사주 요약 텍스트 복사 완료!' : '📋 카카오톡 / SNS 공유 텍스트 복사'}
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
};
export default SajuShareModal;
