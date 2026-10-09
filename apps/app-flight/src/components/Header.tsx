import React, { useState } from 'react';
import { Plane, Volume2, VolumeX, HelpCircle, Trophy } from 'lucide-react';
import { sound } from '../utils/sound';

interface HeaderProps {
  onOpenHowTo: () => void;
  highScore: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenHowTo, highScore }) => {
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.isMuted());

  const handleToggleMute = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  };

  return (
    <header className="w-full max-w-[450px] md:max-w-3xl lg:max-w-5xl mx-auto mb-2 shrink-0 select-none">
      <div className="flex items-center justify-between p-2.5 sm:p-3 bg-white rounded-2xl border border-[#EBE6DD] shadow-2xs">
        {/* 좌측: VeraNex 홈 복귀 링크 */}
        <div className="flex items-center gap-2">
          <a
            href="https://veranex.app"
            target="_top"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#F7F4EE] hover:bg-[#EBE6DD] border border-[#E0D9CD] transition group"
            title="VeraNex 포털 홈으로 이동"
          >
            <div className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
              V
            </div>
            <span className="text-xs font-bold text-[#2D2A26] group-hover:text-emerald-700">
              VeraNex
            </span>
          </a>

          {/* 하이스코어 뱃지 */}
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>최고: {highScore.toLocaleString()}</span>
          </div>
        </div>

        {/* 중앙/우측: 미니앱 브랜드 로고 및 컨트롤러 */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200">
            <Plane className="w-4 h-4 text-sky-600 -rotate-45" />
            <span className="text-xs sm:text-sm font-extrabold text-[#1E293B] tracking-tight">
              베라 플라이트
            </span>
            <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-sky-600 text-white">
              1942
            </span>
          </div>

          {/* 도움말 버튼 */}
          <button
            onClick={onOpenHowTo}
            className="w-8 h-8 rounded-xl bg-[#F7F4EE] hover:bg-[#EBE6DD] border border-[#E0D9CD] flex items-center justify-center text-[#7A756D] hover:text-[#2D2A26] transition"
            title="게임 조작 및 공략 안내"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* 사운드 음소거 토글 */}
          <button
            onClick={handleToggleMute}
            className="w-8 h-8 rounded-xl bg-[#F7F4EE] hover:bg-[#EBE6DD] border border-[#E0D9CD] flex items-center justify-center text-[#7A756D] hover:text-[#2D2A26] transition"
            title={isMuted ? '음소거 해제' : '소리 끄기'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-red-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
