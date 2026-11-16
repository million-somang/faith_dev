import React from 'react';

interface HeaderProps {
  onShare: () => void;
}

export default function Header({ onShare }: HeaderProps) {
  return (
    <header className="w-full pb-3 mb-4 border-b border-[#EBE6DD]">
      {/* 1열 공식 브랜드 내비게이션 바 (miniapp.md 0.2절 표준) */}
      <div className="flex items-center justify-between mb-3">
        <a
          href="https://veranex.app"
          target="_top"
          className="flex items-center gap-2 group transition-opacity hover:opacity-90"
        >
          <div className="w-8 h-8 rounded-lg bg-white shadow-xs border border-[#EBE6DD] flex items-center justify-center p-1">
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
            <div className="flex items-center text-sm font-black tracking-tight text-[#2D2A26]">
              <span>V</span>
              <span className="text-indigo-600">ERANEX</span>
            </div>
            <span className="text-[9px] font-bold text-stone-400 block tracking-wider -mt-0.5">
              PORTAL HOME <i className="fas fa-external-link-alt text-[8px] ml-0.5"></i>
            </span>
          </div>
        </a>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-200 shadow-2xs">
            <i className="fas fa-lock text-emerald-600 text-[10px]"></i>
            <span>로컬 샌드박스 100%</span>
          </span>
          <button
            type="button"
            onClick={onShare}
            className="px-2.5 py-1 rounded-full bg-white hover:bg-stone-100 text-[#2D2A26] border border-[#EBE6DD] text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
            title="QR코드 생성기 공유하기"
          >
            <i className="fas fa-share-nodes text-indigo-600 text-[10px]"></i>
            <span>공유</span>
          </button>
        </div>
      </div>

      {/* 2열 메인 타이틀 및 서브타이틀 */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center text-xl shrink-0 shadow-xs mt-0.5">
          <i className="fas fa-qrcode"></i>
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-[#2D2A26] tracking-tight">
              스마트 QR코드 생성기
            </h1>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              평생 무제한 FREE
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5 font-medium">
            URL, 매장 Wi-Fi 자동연결, 스마트 명함(vCard)을 커스텀 로고·컬러와 함께 PNG/SVG로 즉시 생성합니다.
          </p>
        </div>
      </div>
    </header>
  );
}
