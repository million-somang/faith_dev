import React, { useState } from 'react';

interface HeaderProps {
  activeTab: 'app' | 'guide' | 'faq';
  onChangeTab: (tab: 'app' | 'guide' | 'faq') => void;
}

export default function Header({ activeTab, onChangeTab }: HeaderProps) {
  const [logoError, setLogoError] = useState(false);

  return (
    <header className="w-full bg-[#EFECE6] border border-[#DFD9CE] rounded-2xl p-3.5 sm:p-4 mb-5 shadow-2xs space-y-3.5">
      {/* 1열 공식 브랜드 내비게이션 바 */}
      <div className="flex items-center justify-between border-b border-[#DFD9CE]/80 pb-2.5">
        <a
          href="https://veranex.app"
          target="_top"
          className="flex items-center gap-2 group transition-opacity hover:opacity-90"
        >
          <div className="w-7 h-7 rounded-lg bg-white shadow-2xs border border-[#DFD9CE] flex items-center justify-center p-1">
            {!logoError ? (
              <img
                src="https://veranex.app/logo-192.png"
                alt="VeraNex Logo"
                className="w-full h-full object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-xs font-black text-indigo-600">V</span>
            )}
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
            <span>로컬 보안 100% (CSR)</span>
          </span>
        </div>
      </div>

      {/* 2열 메인 타이틀 및 상단 글로벌 메뉴 탭 통합 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#2D2A26] text-white flex items-center justify-center text-base shrink-0 shadow-2xs">
            <i className="fas fa-wand-magic-sparkles"></i>
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-[#2D2A26] tracking-tight leading-tight">
                이미지 업스케일 &amp; 포맷 변환기
              </h1>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-100/90 text-indigo-800 border border-indigo-300/80">
                AI 초해상도 · 최대 50장
              </span>
            </div>
            <p className="text-[11px] text-stone-600 mt-0.5 font-medium">
              서버 전송 없이 100% 브라우저에서 AI 초해상도(2~4배)·Lanczos-3 확대와 WebP·JPG·PNG 변환을 한 번에 처리합니다.
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
            <i className="fas fa-sliders-h text-[10px]"></i>
            <span>변환기</span>
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
            <i className="far fa-question-circle text-[10px]"></i>
            <span>FAQ</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
