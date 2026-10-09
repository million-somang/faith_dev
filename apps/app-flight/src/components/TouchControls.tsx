import React from 'react';
import { RotateCw, Bomb } from 'lucide-react';

interface TouchControlsProps {
  rolls: number;
  bombs: number;
  onTriggerRoll: () => void;
  onTriggerBomb: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  rolls,
  bombs,
  onTriggerRoll,
  onTriggerBomb,
}) => {
  return (
    <div className="w-full max-w-[450px] mx-auto mt-2 px-2 flex items-center justify-between gap-3 select-none">
      {/* 360도 공중제비 롤 (Z) 버튼 */}
      <button
        onClick={onTriggerRoll}
        disabled={rolls <= 0}
        data-screenshot-click="action"
        className={`flex-1 py-2.5 px-3 rounded-2xl border flex items-center justify-center gap-2 font-bold text-xs transition active:scale-95 shadow-xs ${
          rolls > 0
            ? 'bg-gradient-to-r from-sky-50 to-indigo-50 border-sky-300 text-sky-800 hover:from-sky-100 hover:to-indigo-100'
            : 'bg-[#F2EDE4] border-[#E0D9CD] text-[#A8A29E] cursor-not-allowed'
        }`}
        title="360도 공중제비 롤 (1.5초 무적 회피, Z키)"
      >
        <RotateCw className="w-4 h-4 text-sky-600" />
        <span>360° 공중제비</span>
        <span
          className={`px-1.5 py-0.2 rounded-full font-mono text-[11px] font-black ${
            rolls > 0 ? 'bg-sky-600 text-white' : 'bg-stone-300 text-white'
          }`}
        >
          {rolls}
        </span>
      </button>

      {/* 메가 폭탄 (X) 버튼 */}
      <button
        onClick={onTriggerBomb}
        disabled={bombs <= 0}
        data-screenshot-click="action"
        className={`flex-1 py-2.5 px-3 rounded-2xl border flex items-center justify-center gap-2 font-bold text-xs transition active:scale-95 shadow-xs ${
          bombs > 0
            ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 text-amber-900 hover:from-amber-100 hover:to-orange-100'
            : 'bg-[#F2EDE4] border-[#E0D9CD] text-[#A8A29E] cursor-not-allowed'
        }`}
        title="화면 전체 탄환 소거 및 폭발 공격 (X키)"
      >
        <Bomb className="w-4 h-4 text-amber-600" />
        <span>메가 폭탄</span>
        <span
          className={`px-1.5 py-0.2 rounded-full font-mono text-[11px] font-black ${
            bombs > 0 ? 'bg-amber-600 text-white' : 'bg-stone-300 text-white'
          }`}
        >
          {bombs}
        </span>
      </button>
    </div>
  );
};
