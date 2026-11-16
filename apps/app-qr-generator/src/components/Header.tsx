import React from 'react';

interface HeaderProps {
  activeTab: 'app' | 'guide' | 'faq';
  onChangeTab: (tab: 'app' | 'guide' | 'faq') => void;
  onShare: () => void;
}

export default function Header({ activeTab, onChangeTab, onShare }: HeaderProps) {
  return (
    <header className="w-full bg-[#EFECE6] border border-[#DFD9CE] rounded-2xl p-3.5 sm:p-4 mb-5 shadow-2xs space-y-3.5">
      {/* 1열 공식 브랜드 내비게이션 바 (miniapp.md 0.2절 표준) */}
      <div className="flex items-center justify-between border-b border-[#DFD9CE]/80 pb-2.5">
        <a
          href="https://veranex.app"
          target="_top"
          className="flex items-center gap-2 group transition-opacity hover:opacity-90"
        >
          <div className="w-7 h-7 rounded-lg bg-white shadow-2xs border border-[#DFD9CE] flex items-center justify-center p-1">
            <img
              src="https://veranex.app/logo-192.png"
              alt="VERA Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="flex items-center text-xs sm:text-sm font-black tracking-tight text-[#2D2A26]">
              <span>V</span>
              <span className="text-indigo-600">ERANEX</span>
            </div>
            <span className="text-[9px] font-bold text-stone-500 block tracking-wider -mt-0.5">
              PORTAL HOME <i className="fas fa-external-link-alt text-[8px] ml-0.5"></i>
            </span>
          </div>
        </a>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-stone-700 text-[10px] font-bold border border-[#DFD9CE]">
            <i className="fas fa-lock text-emerald-600 text-[9px]"></i>
            <span>로컬 보안 100%</span>
          </span>
          <button
            type="button"
            onClick={onShare}
            className="px-2.5 py-1 rounded-full bg-white hover:bg-stone-50 text-[#2D2A26] border border-[#DFD9CE] text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
            title="QR코드 생성기 공유하기"
          >
            <i className="fas fa-share-nodes text-indigo-600 text-[10px]"></i>
            <span>공유</span>
          </button>
        </div>
      </div>

      {/* 2열 메인 타이틀 및 상단 글로벌 메뉴 탭 통합 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#2D2A26] text-white flex items-center justify-center text-base shrink-0 shadow-2xs">
            <i className="fas fa-qrcode"></i>
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-[#2D2A26] tracking-tight leading-tight">
                스마트 QR코드 생성기
              </h1>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100/90 text-emerald-800 border border-emerald-300/80">
                평생 무제한 FREE
              </span>
            </div>
            <p className="text-[11px] text-stone-600 mt-0.5 font-medium">
              URL · 와이파이 자동연결 · 스마트 명함(vCard) 고화질 PNG/SVG 제작
            </p>
          </div>
        </div>

        {/* 상단 메뉴 탭 (차콜 블랙 세그먼트 컨트롤로 본문과 확실히 구분) */}
        <nav className="flex bg-[#E2DDD3] p-1 rounded-xl gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onChangeTab('app')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'app'
                ? 'bg-[#2D2A26] text-white shadow-xs'
                : 'text-stone-600 hover:text-[#2D2A26]'
            }`}
          >
            <i className="fas fa-qrcode text-[10px]"></i>
            <span>QR 만들기</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeTab('guide')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'guide'
                ? 'bg-[#2D2A26] text-white shadow-xs'
                : 'text-stone-600 hover:text-[#2D2A26]'
            }`}
          >
            <i className="fas fa-book-open text-[10px]"></i>
            <span>사용 가이드</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeTab('faq')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'faq'
                ? 'bg-[#2D2A26] text-white shadow-xs'
                : 'text-stone-600 hover:text-[#2D2A26]'
            }`}
          >
            <i className="far fa-circle-question text-[10px]"></i>
            <span>FAQ</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
