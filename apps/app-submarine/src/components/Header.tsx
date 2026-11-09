import React from 'react';

export type SubmarineTab = 'battle' | 'leaderboard' | 'guide';

interface HeaderProps {
  activeTab: SubmarineTab;
  onSelectTab: (tab: SubmarineTab) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onShare: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  isMuted,
  onToggleMute,
  onShare,
}) => {
  return (
    <header className="w-full max-w-[450px] md:max-w-3xl lg:max-w-5xl mx-auto mb-2 shrink-0 select-none space-y-1.5">
      {/* 1단: 공식 VeraNex 포털 홈 링크 + 우측 베라 서브마린 로고 */}
      <div className="flex items-center justify-between px-3 py-2 bg-white rounded-2xl border border-[#EBE6DD] shadow-2xs">
        <a
          href="https://veranex.app"
          target="_top"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer group"
          title="VeraNex 포털 홈으로 이동"
        >
          <img
            src="https://veranex.app/logo-192.png"
            alt="VeraNex Logo"
            className="w-6 h-6 rounded-lg object-contain drop-shadow-2xs"
          />
          <div className="flex flex-col text-left">
            <span className="font-black text-xs sm:text-sm tracking-wider text-[#2D2A26] leading-none group-hover:text-indigo-600 transition-colors">
              V<span className="text-indigo-600">ERANEX</span>
            </span>
            <span className="text-[8px] font-bold text-[#A39C90] leading-tight">
              PORTAL HOME
            </span>
          </div>
        </a>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-xs font-black text-[#2D2A26] leading-tight flex items-center justify-end gap-1">
              <span>베라 서브마린</span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                10x10 해전
              </span>
            </div>
            <div className="text-[9px] font-bold text-[#7A756D] leading-none mt-0.5">
              VERA SUBMARINE PRO
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-slate-800 text-white flex items-center justify-center text-sm shadow-2xs">
            <i className="fas fa-water text-cyan-300"></i>
          </div>
        </div>
      </div>

      {/* 2단: 3단 알약 탭 + 사운드 및 공유 버튼 */}
      <div className="flex items-center gap-1.5">
        <nav
          role="tablist"
          aria-label="서브마린 메뉴 탭"
          className="flex-1 flex items-center bg-[#F2EDE4] p-1 rounded-xl gap-1 text-xs font-black border border-[#E5DEC9]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'battle'}
            onClick={() => onSelectTab('battle')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'battle'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-[#7A7369] hover:text-[#2D2A26]'
            }`}
          >
            <i className="fas fa-crosshairs text-xs"></i>
            <span>작전 해역</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'leaderboard'}
            onClick={() => onSelectTab('leaderboard')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'leaderboard'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-[#7A7369] hover:text-[#2D2A26]'
            }`}
          >
            <i className="fas fa-trophy text-amber-500 text-xs"></i>
            <span>명예의 전당</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'guide'}
            onClick={() => onSelectTab('guide')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'guide'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-[#7A7369] hover:text-[#2D2A26]'
            }`}
          >
            <i className="fas fa-book text-xs"></i>
            <span>작전 지침서</span>
          </button>
        </nav>

        {/* 볼륨 및 공유 컨트롤러 */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleMute}
            className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-colors cursor-pointer ${
              isMuted
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : 'bg-white text-[#7A756D] border-[#EBE6DD] hover:bg-[#F7F4EE]'
            }`}
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            <i className={`fas ${isMuted ? 'fa-volume-xmark' : 'fa-volume-high'} text-xs`}></i>
          </button>
          <button
            type="button"
            onClick={onShare}
            className="w-8 h-8 rounded-xl bg-white text-[#7A756D] border border-[#EBE6DD] hover:bg-[#F7F4EE] flex items-center justify-center transition-colors cursor-pointer"
            title="게임 공유하기"
          >
            <i className="fas fa-share-nodes text-xs"></i>
          </button>
        </div>
      </div>
    </header>
  );
};
