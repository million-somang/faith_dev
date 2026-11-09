import React from 'react';

interface BannerSlotProps {
  label?: string;
  minHeight?: string;
}

export const BannerSlot: React.FC<BannerSlotProps> = ({
  label = 'SPONSORED AD',
  minHeight = 'min-h-[50px]',
}) => {
  return (
    <div className={`w-full ${minHeight} bg-white rounded-xl border border-[#EBE6DD] flex flex-col items-center justify-center p-2 text-center shadow-2xs relative overflow-hidden`}>
      <span className="text-[9px] font-black tracking-widest text-[#A39C90] uppercase mb-0.5">
        {label}
      </span>
      <div className="flex items-center gap-2 text-xs font-bold text-[#7A756D]">
        <i className="fas fa-shield-halved text-indigo-600 text-xs"></i>
        <span>VeraNex Premium Certified Ads</span>
      </div>
    </div>
  );
};
