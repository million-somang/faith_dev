interface BannerSlotProps {
  readonly slotKey: string;
  readonly label?: string;
}

export default function BannerSlot({ slotKey, label = 'SPONSORED AD' }: BannerSlotProps) {
  return (
    <aside
      aria-label={label}
      data-ad-slot={slotKey}
      className="bg-[#EFECE6]/80 border border-[#DFD9CE] rounded-2xl p-3 flex items-center justify-between gap-2.5 min-h-[60px] shrink-0"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[9px] font-black text-indigo-700 bg-white border border-indigo-200 px-1.5 py-0.5 rounded shrink-0">
          {label}
        </span>
        <span className="text-[11px] font-bold text-[#2D2A26] truncate">
          기념일·시험 D-Day도 VeraNex 생활도구에서 함께 관리하세요
        </span>
      </div>
      <a
        href="https://veranex.app/lifestyle"
        target="_top"
        rel="noopener noreferrer"
        className="text-[10px] font-black text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg shrink-0 transition-colors"
      >
        더보기 →
      </a>
    </aside>
  );
}
