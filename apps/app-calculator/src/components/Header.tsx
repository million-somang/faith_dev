import { useState } from 'react';
import type { PageTab } from '../types/calculator';

interface HeaderProps {
  activeTab: PageTab;
  onChangeTab: (tab: PageTab) => void;
  onShare: () => void;
}

export function Header({ activeTab, onChangeTab, onShare }: HeaderProps) {
  const [logoFailed, setLogoFailed] = useState<boolean>(false);

  return (
    <header className="w-full bg-[#EFECE6] border border-[#DFD9CE] rounded-2xl p-2.5 sm:p-3.5 mb-2.5 sm:mb-4 shadow-2xs space-y-2 shrink-0">
      {/* 1열: 좌측 VeraNex 공식 홈 링크 + 우측 계산기 로고/공유 (음소거·도움말 아이콘 배제) */}
      <div className="flex items-center justify-between gap-2 border-b border-[#DFD9CE]/80 pb-2">
        <a
          href="https://veranex.app"
          target="_top"
          rel="noopener noreferrer"
          className="flex items-center gap-2 group transition-opacity hover:opacity-85 shrink-0"
          title="VeraNex 포털 홈으로 이동"
        >
          <div className="w-7 h-7 rounded-lg bg-white shadow-2xs border border-[#DFD9CE] flex items-center justify-center p-1">
            {!logoFailed ? (
              <img
                src="https://veranex.app/logo-192.png"
                alt="VeraNex 공식 로고"
                className="w-full h-full object-contain"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <i className="fas fa-cube text-indigo-600 text-xs" aria-hidden="true"></i>
            )}
          </div>
          <div className="flex flex-col text-left">
            <span className="font-black text-xs sm:text-sm tracking-tight text-[#2D2A26] leading-none group-hover:text-indigo-600 transition-colors">
              V<span className="text-indigo-600">ERANEX</span>
            </span>
            <span className="text-[8px] font-bold text-stone-500 tracking-wider leading-tight">
              PORTAL HOME
            </span>
          </div>
        </a>

        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="text-right min-w-0">
              <h1 className="text-xs sm:text-sm font-black text-[#2D2A26] leading-tight truncate">
                스마트 계산기
              </h1>
              <span className="block text-[9px] font-bold text-indigo-700 leading-none truncate">
                일반 · 공학 정밀 연산
              </span>
            </div>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-2xs shrink-0">
              <i className="fas fa-calculator text-xs" aria-hidden="true"></i>
            </div>
          </div>

          <button
            type="button"
            onClick={onShare}
            aria-label="계산기 공유하기"
            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-stone-50 text-[#2D2A26] border border-[#DFD9CE] text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer active:scale-95 shrink-0"
            title="스마트 계산기 링크 공유"
          >
            <i className="fas fa-share-nodes text-indigo-600 text-[10px]" aria-hidden="true"></i>
            <span className="hidden sm:inline">공유</span>
          </button>
        </div>
      </div>

      {/* 2열: 3단 알약 탭 바 (계산기 / 사용방법 / FAQ) */}
      <nav
        className="flex bg-[#E2DDD3] p-1 rounded-xl gap-1"
        role="tablist"
        aria-label="스마트 계산기 메뉴 탭"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'calc'}
          onClick={() => onChangeTab('calc')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'calc'
              ? 'bg-[#2D2A26] text-white shadow-2xs'
              : 'text-stone-600 hover:text-[#2D2A26]'
          }`}
        >
          <i className="fas fa-calculator text-[10px]" aria-hidden="true"></i>
          <span>계산기</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'howto'}
          onClick={() => onChangeTab('howto')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'howto'
              ? 'bg-[#2D2A26] text-white shadow-2xs'
              : 'text-stone-600 hover:text-[#2D2A26]'
          }`}
        >
          <i className="fas fa-book-open text-[10px]" aria-hidden="true"></i>
          <span>사용방법</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'faq'}
          onClick={() => onChangeTab('faq')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'faq'
              ? 'bg-[#2D2A26] text-white shadow-2xs'
              : 'text-stone-600 hover:text-[#2D2A26]'
          }`}
        >
          <i className="far fa-circle-question text-[10px]" aria-hidden="true"></i>
          <span>FAQ</span>
        </button>
      </nav>
    </header>
  );
}

export default Header;
