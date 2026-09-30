import React, { useState } from 'react';
import { ELEMENT_CONFIG } from '../utils/sajuCalculator';
import type { PillarData } from '../utils/sajuCalculator';

interface SajuPillarsCardProps {
  pillars: {
    year: PillarData;
    month: PillarData;
    day: PillarData;
    time: PillarData;
  };
}

export const SajuPillarsCard: React.FC<SajuPillarsCardProps> = ({ pillars }) => {
  // Flip states for [time, day, month, year]
  const [flipped, setFlipped] = useState<Record<string, boolean>>({
    time: false,
    day: false,
    month: false,
    year: false,
  });

  const toggleFlip = (key: string) => {
    setFlipped((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const flipAll = () => {
    const anyFlipped = Object.values(flipped).some(Boolean);
    setFlipped({
      time: !anyFlipped,
      day: !anyFlipped,
      month: !anyFlipped,
      year: !anyFlipped,
    });
  };

  const pillarList: { key: 'time' | 'day' | 'month' | 'year'; label: string; sub: string; isSelf?: boolean }[] = [
    { key: 'time', label: '시주', sub: '미래·자녀' },
    { key: 'day', label: '일주', sub: '나 자신', isSelf: true },
    { key: 'month', label: '월주', sub: '사회·부모' },
    { key: 'year', label: '년주', sub: '근본·조상' },
  ];

  return (
    <div className="w-full bg-white rounded-2xl p-3 border border-slate-200/90 shadow-xs select-none">
      {/* 카드 헤더: 타이틀 + 3D 플립 안내 버튼 */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
          <span className="text-xs font-black text-slate-800 tracking-tight">
            사주팔자 원국 (四柱八字)
          </span>
          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
            (생시 ← 생일 ← 생월 ← 생년)
          </span>
        </div>
        <button
          type="button"
          onClick={flipAll}
          className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold border border-indigo-200/70 transition-all cursor-pointer active:scale-95"
        >
          <i className="fas fa-sync-alt text-[9px]"></i>
          <span>오행 반전</span>
        </button>
      </div>

      {/* 4주 8자 3D 플립 카드 그리드 */}
      <div className="grid grid-cols-4 gap-1.5">
        {pillarList.map(({ key, label, sub, isSelf }) => {
          const p = pillars[key];
          const isFlipped = flipped[key];
          const ganElem = ELEMENT_CONFIG[p.ganElem] || ELEMENT_CONFIG.wood;
          const jiElem = ELEMENT_CONFIG[p.jiElem] || ELEMENT_CONFIG.wood;

          return (
            <div
              key={key}
              onClick={() => toggleFlip(key)}
              className={`cursor-pointer perspective-1000 transition-transform duration-200 hover:-translate-y-0.5 ${
                isSelf ? 'ring-1.5 ring-amber-400/80 rounded-xl' : ''
              }`}
            >
              <div
                className={`relative w-full h-[152px] preserve-3d transition-transform duration-500 rounded-xl ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
              >
                {/* 1. 앞면 (Classic Neumorphic Card) */}
                <div className="absolute inset-0 backface-hidden bg-slate-50/90 border border-slate-200/80 rounded-xl p-1.5 flex flex-col justify-between items-center text-center shadow-xs">
                  {/* 주 타이틀 배지 */}
                  <div className="w-full flex items-center justify-between px-1">
                    <span className={`text-[10px] font-black ${isSelf ? 'text-amber-600' : 'text-slate-600'}`}>
                      {label}
                    </span>
                    <span className="text-[8px] text-slate-400 font-medium">{sub}</span>
                  </div>

                  {/* 천간 (Gan) */}
                  <div className="w-full bg-white rounded-lg p-1 border border-slate-200/70 shadow-2xs flex flex-col items-center">
                    <span className="text-[9px] font-bold text-slate-400 leading-none">
                      {p.ganTenGod}
                    </span>
                    <span className="text-base font-black text-slate-900 leading-tight">
                      {p.gan}
                    </span>
                    <span className={`text-[8px] font-extrabold px-1 rounded ${ganElem.lightBg} ${ganElem.text}`}>
                      {ganElem.name.split('(')[0]}
                    </span>
                  </div>

                  {/* 지지 (Ji) */}
                  <div className="w-full bg-white rounded-lg p-1 border border-slate-200/70 shadow-2xs flex flex-col items-center">
                    <span className="text-[9px] font-bold text-slate-400 leading-none">
                      {p.jiTenGod}
                    </span>
                    <span className="text-base font-black text-slate-900 leading-tight">
                      {p.ji}
                    </span>
                    <span className={`text-[8px] font-extrabold px-1 rounded ${jiElem.lightBg} ${jiElem.text}`}>
                      {jiElem.name.split('(')[0]}
                    </span>
                  </div>
                </div>

                {/* 2. 뒷면 (오행 원색 테마 카드 - 3D Backface) */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-b from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-xl p-1.5 flex flex-col justify-between items-center text-center shadow-md border border-indigo-400/40">
                  <div className="w-full text-center">
                    <span className="text-[9px] font-bold text-indigo-200 tracking-wider">
                      {label} 오행풀이
                    </span>
                  </div>

                  {/* 천간 오행 */}
                  <div className="w-full bg-white/10 rounded-lg p-1 flex flex-col items-center">
                    <span className="text-[8px] text-indigo-200">{ganElem.name}</span>
                    <span className="text-xs font-black text-amber-300">{p.gan}</span>
                  </div>

                  {/* 지지 오행 & 지장간 */}
                  <div className="w-full bg-white/10 rounded-lg p-1 flex flex-col items-center">
                    <span className="text-[8px] text-indigo-200">{jiElem.name}</span>
                    <span className="text-xs font-black text-sky-300">{p.ji}</span>
                    <span className="text-[7px] text-slate-300 truncate w-full px-0.5">
                      {p.jijanggan.replace(/,/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SajuPillarsCard;
