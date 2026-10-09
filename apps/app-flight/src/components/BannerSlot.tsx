import React from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';

interface BannerSlotProps {
  className?: string;
}

export const BannerSlot: React.FC<BannerSlotProps> = ({ className = '' }) => {
  return (
    <div
      className={`w-full h-[52px] bg-[#F7F4EE] border border-[#EBE6DD] rounded-xl flex items-center justify-between px-3 text-[#7A756D] overflow-hidden select-none ${className}`}
      style={{ minHeight: '52px' }}
      aria-label="스폰서 광고 영역"
    >
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-white text-[#8A847A] border border-[#E0D9CD] rounded">
          AD
        </span>
        <div className="flex flex-col text-left">
          <span className="text-xs font-semibold text-[#2D2A26] leading-tight">
            VeraNex 프리미엄 라이프 포털
          </span>
          <span className="text-[10px] text-[#8A847A] leading-tight flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600 inline" />
            100% 무료 무설치 웹 브라우저 게임 & 유틸리티
          </span>
        </div>
      </div>
      <a
        href="https://veranex.app"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 px-2.5 py-1 rounded-lg border border-[#E0D9CD] transition flex items-center gap-1 shrink-0"
      >
        <span>둘러보기</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
};
