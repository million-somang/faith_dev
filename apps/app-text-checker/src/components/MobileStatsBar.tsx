import type { TextStats } from '../hooks/useTextStats';

interface MobileStatsBarProps {
    stats: TextStats;
    onCheckSpelling: () => void;
}

export default function MobileStatsBar({ stats, onCheckSpelling }: MobileStatsBarProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-3 sm:hidden shadow-2xl z-50 flex justify-between items-center pb-safe">
            <div className="flex items-center gap-4">
                <div>
                    <span className="text-xs opacity-80 block">공백 포함</span>
                    <div className="text-xl font-bold">
                        {stats.charWithSpace.toLocaleString()} <span className="text-sm font-normal">자</span>
                    </div>
                </div>
                <div className="border-l border-white/30 h-8"></div>
                <div>
                    <span className="text-xs opacity-80 block">공백 제외</span>
                    <div className="text-lg font-semibold text-blue-100">
                        {stats.charWithoutSpace.toLocaleString()} <span className="text-sm font-normal">자</span>
                    </div>
                </div>
            </div>

            <button
                onClick={onCheckSpelling}
                className="bg-white text-blue-900 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-transform"
            >
                맞춤법 <i className="fas fa-wand-magic-sparkles"></i>
            </button>
        </div>
    );
}
