import React from 'react';
import { BookOpen, HelpCircle, Share2, Target } from 'lucide-react';
import { ActiveTab } from '../types/billiards';
import { assetManager } from '../engine/assets';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onShare: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab, onShare }) => {
  const emblemSrc = assetManager.getAssetUrl('/assets/sprites/billiards_emblem.png');

  return (
    <header className="w-full max-w-[450px] md:max-w-3xl lg:max-w-5xl mx-auto mb-1.5 shrink-0 select-none space-y-1.5">
      {/* 1단: 공식 VeraNex 포털 홈 링크 + 우측 베라 당구 클럽 로고 (`miniapp.md` Golden Rule #12) */}
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
              <span>베라 당구 클럽</span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                4구·3구
              </span>
            </div>
            <div className="text-[9px] font-bold text-[#7A756D] leading-none mt-0.5">
              CAROM BILLIARDS PRO
            </div>
          </div>
          <img
            src={emblemSrc}
            alt="베라 당구 아이콘"
            className="w-7 h-7 rounded-xl object-cover border border-[#EBE6DD] shadow-2xs"
          />
        </div>
      </div>

      {/* 2단: 컴팩트 3단 알약 탭 + 우측 공유 버튼 (`miniapp.md` 3.2 & 제4장 표준) */}
      <nav
        role="tablist"
        aria-label="당구 클럽 메뉴 탭"
        className="flex items-center bg-[#F2EDE4] p-1 rounded-xl gap-1 text-xs font-black border border-[#E5DEC9]"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'arena'}
          onClick={() => onSelectTab('arena')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
            activeTab === 'arena'
              ? 'bg-white text-blue-700 shadow-2xs'
              : 'text-[#7A7369] hover:text-[#2D2A26]'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>당구 경기장</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'howto'}
          onClick={() => onSelectTab('howto')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
            activeTab === 'howto'
              ? 'bg-white text-blue-700 shadow-2xs'
              : 'text-[#7A7369] hover:text-[#2D2A26]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>사용방법·공식</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'faq'}
          onClick={() => onSelectTab('faq')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
            activeTab === 'faq'
              ? 'bg-white text-blue-700 shadow-2xs'
              : 'text-[#7A7369] hover:text-[#2D2A26]'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>FAQ·랭킹</span>
        </button>

        <button
          type="button"
          onClick={onShare}
          title="친구에게 당구 클럽 공유하기"
          aria-label="공유하기"
          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-indigo-50 text-[#2D2A26] hover:text-indigo-600 border border-[#EBE6DD] transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="text-[11px] font-extrabold hidden sm:inline">공유</span>
        </button>
      </nav>
    </header>
  );
};
