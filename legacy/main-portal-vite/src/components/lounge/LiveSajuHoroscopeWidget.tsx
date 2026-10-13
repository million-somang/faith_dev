import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface LiveSajuHoroscopeWidgetProps {
    tag: string;
}

export const LiveSajuHoroscopeWidget: React.FC<LiveSajuHoroscopeWidgetProps> = () => {
    const [luckyScore] = useState(() => Math.floor(Math.random() * 15) + 85); // 85~99점
    const luckyColors = ['에메랄드 그린 🌳', '선셋 오렌지 🔥', '골든 옐로우 ⛰️', '클린 실버 ⚙️', '딥 오션 블루 💧'];
    const randomColor = luckyColors[Math.floor(Math.random() * luckyColors.length)];

    return (
        <div className="my-2.5 p-4 rounded-2xl bg-gradient-to-br from-amber-50/90 via-orange-50/60 to-amber-50/90 border border-amber-200/90 text-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center border-b border-amber-200/70 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-base">🔮</span>
                    <span className="text-xs font-black text-amber-900">
                        오늘의 사주 & 행운 에너지 카드
                    </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-800 border border-amber-300/80 font-mono">
                    LUCKY PULSE
                </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs mb-3">
                <div className="bg-white border border-amber-100 rounded-xl p-2.5 text-center shadow-xs">
                    <span className="text-[10px] text-slate-400 font-bold block">오늘의 행운 지수</span>
                    <span className="text-base font-black text-amber-600 font-mono mt-0.5 block">{luckyScore}점 (대길)</span>
                </div>
                <div className="bg-white border border-amber-100 rounded-xl p-2.5 text-center shadow-xs">
                    <span className="text-[10px] text-slate-400 font-bold block">행운의 컬러</span>
                    <span className="text-xs font-black text-slate-700 mt-1 block truncate">{randomColor}</span>
                </div>
                <div className="col-span-2 sm:col-span-1 bg-white border border-amber-100 rounded-xl p-2.5 text-center flex flex-col justify-center shadow-xs">
                    <span className="text-[10px] text-slate-400 font-bold block">추천 실천 팁</span>
                    <span className="text-[11px] font-extrabold text-emerald-650 mt-0.5 truncate">새로운 아이디어 메모</span>
                </div>
            </div>

            <div className="flex justify-between items-center pt-1 border-t border-amber-200/50 text-[11px]">
                <span className="text-slate-500 text-[10px]">정통 사주명리학 기반 맞춤 기운</span>
                <Link
                    to="/entertainment/saju"
                    className="text-amber-800 hover:text-amber-950 font-black flex items-center gap-1 transition-colors"
                >
                    <span>내 종합 사주 보기</span>
                    <i className="fas fa-arrow-right text-[9px]"></i>
                </Link>
            </div>
        </div>
    );
};
