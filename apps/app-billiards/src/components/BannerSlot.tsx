import React from 'react';
import { Sparkles } from 'lucide-react';

interface BannerSlotProps {
  compact?: boolean;
}

export const BannerSlot: React.FC<BannerSlotProps> = ({ compact = false }) => {
  return (
    <aside
      aria-label="SPONSORED AD"
      className={`w-full rounded-2xl bg-white border border-[#EBE6DD] shadow-2xs overflow-hidden flex items-center justify-between px-3.5 ${
        compact ? 'min-h-[52px] py-2' : 'min-h-[64px] py-2.5'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#F7F4EE] text-[#8A847A] border border-[#E0D9CD] shrink-0">
          SPONSORED AD
        </span>
        <div className="min-w-0 text-left">
          <p className="text-xs font-extrabold text-[#2D2A26] truncate">
            VeraNex 프리미엄 스포츠 & 두뇌 게임 컬렉션
          </p>
          <p className="text-[10px] text-[#7A756D] truncate">
            베라장기 · 베라오목 · 숫자야구 · 베라 플라이트 무설치 무료 플레이
          </p>
        </div>
      </div>
      <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 ml-2">
        <Sparkles className="w-3.5 h-3.5" />
      </div>
    </aside>
  );
};
