import React from 'react';

interface OmokLogoProps {
  size?: number; // 기본 26px
  className?: string;
}

export const OmokLogo: React.FC<OmokLogoProps> = ({ size = 26, className = '' }) => {
  return (
    <div
      className={`relative rounded-lg bg-gradient-to-br from-[#f5deb3] via-[#deb887] to-[#c89d66] border-2 border-[#8c5720]/50 shadow-sm flex items-center justify-center shrink-0 overflow-hidden select-none ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      title="베라오목"
    >
      {/* 3x3 미니 격자선 */}
      <div className="absolute inset-1 grid grid-cols-2 grid-rows-2 border border-[#784c1f]/40 pointer-events-none">
        <div className="border-r border-b border-[#784c1f]/35" />
        <div className="border-b border-[#784c1f]/35" />
        <div className="border-r border-[#784c1f]/35" />
        <div />
      </div>

      {/* 3D 흑돌 */}
      <div
        className="w-[42%] h-[42%] rounded-full bg-gradient-to-br from-slate-700 via-slate-900 to-black shadow-sm transform -translate-x-[20%] -translate-y-[20%] relative border border-slate-600/40 flex items-center justify-center z-10"
      >
        <div className="w-[30%] h-[30%] rounded-full bg-white/30 absolute top-[15%] left-[20%] blur-[0.4px]" />
      </div>

      {/* 3D 백돌 */}
      <div
        className="w-[42%] h-[42%] rounded-full bg-gradient-to-br from-white via-slate-100 to-slate-200 shadow-sm transform translate-x-[20%] translate-y-[20%] relative border border-slate-300 flex items-center justify-center z-10"
      >
        <div className="w-[35%] h-[35%] rounded-full bg-white/80 absolute top-[15%] left-[20%] blur-[0.3px]" />
      </div>
    </div>
  );
};
