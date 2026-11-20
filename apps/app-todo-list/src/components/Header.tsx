import { useState } from 'react';
import type { MainTab } from '../types/todo';

interface HeaderProps {
  readonly activeTab: MainTab;
  readonly onChangeTab: (tab: MainTab) => void;
  readonly onShare: () => void;
}

export default function Header({ activeTab, onChangeTab, onShare }: HeaderProps) {
  const [logoError, setLogoError] = useState<boolean>(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#EBE6DD] px-3 sm:px-5 py-2.5 shrink-0">
      {/* 1열: 좌측 VeraNex 공식 홈 링크 + 우측 미니앱 고유 로고·공유 (음소거/도움말 아이콘 배제) */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <a
          href="https://veranex.app"
          target="_top"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer group shrink-0"
          title="VeraNex 포털 홈으로 이동"
        >
          <div className="w-7 h-7 rounded-lg bg-[#FAF8F5] border border-[#EBE6DD] flex items-center justify-center p-0.5 shadow-2xs">
            {!logoError ? (
              <img
                src="https://veranex.app/logo-192.png"
                alt="VeraNex 공식 로고"
                className="w-full h-full object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-xs font-black text-indigo-600">V</span>
            )}
          </div>
          <div className="flex flex-col text-left">
            <span className="font-black text-xs sm:text-sm tracking-wider text-[#2D2A26] leading-none group-hover:text-indigo-600 transition-colors">
              V<span className="text-indigo-600">ERANEX</span>
            </span>
            <span className="text-[8px] font-bold text-[#A39C90] leading-tight">
              PORTAL HOME
            </span>
          </div>
        </a>

        <div className="flex items-center gap-2 min-w-0">
          <div className="text-right min-w-0">
            <h1 className="text-xs sm:text-sm font-black text-[#2D2A26] leading-tight truncate">
              스마트 투두(TO-DO) 플래너
            </h1>
            <div className="text-[9px] font-bold text-indigo-600 leading-none">
              100% 로컬 할일 정리
            </div>
          </div>
          <div
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0"
            aria-hidden="true"
          >
            <i className="fas fa-list-check text-xs"></i>
          </div>
          <button
            type="button"
            onClick={onShare}
            aria-label="투두 플래너 링크 공유하기"
            title="공유하기"
            className="px-2 py-1.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F2ECE1] border border-[#EBE6DD] text-[#2D2A26] text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <i className="fas fa-share-nodes text-indigo-600 text-[10px]"></i>
            <span className="hidden sm:inline">공유</span>
          </button>
        </div>
      </div>

      {/* 2열: 3단 알약(Pill) 탭 */}
      <nav aria-label="투두 플래너 메뉴" className="flex bg-[#F5F2EB] p-1 rounded-xl gap-1 text-xs font-black">
        <button
          type="button"
          onClick={() => onChangeTab('todo')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'todo'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-[#7A7369] hover:text-[#2D2A26]'
          }`}
        >
          <i className="fas fa-check-double text-[11px]"></i>
          <span>할일 정리</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeTab('howto')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'howto'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-[#7A7369] hover:text-[#2D2A26]'
          }`}
        >
          <i className="fas fa-book-open text-[11px]"></i>
          <span>사용방법</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeTab('faq')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'faq'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-[#7A7369] hover:text-[#2D2A26]'
          }`}
        >
          <i className="fas fa-circle-question text-[11px]"></i>
          <span>FAQ</span>
        </button>
      </nav>
    </header>
  );
}
