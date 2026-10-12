import React from 'react';

export default function Header() {
  return (
    <header className="w-full pb-4 mb-6 border-b border-[#EBE6DD]">
      {/* 1열 공식 브랜드 내비게이션 바 */}
      <div className="flex items-center justify-between mb-4">
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

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200 shadow-2xs">
            <i className="fas fa-lock text-emerald-600"></i>
            <span>로컬 샌드박스 100%</span>
          </span>
        </div>
      </div>

      {/* 2열 메인 타이틀 및 서브타이틀 (사용자 스크린샷 100% 일치) */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center text-xl shrink-0 shadow-xs mt-0.5">
          <i className="fas fa-expand-arrows-alt"></i>
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#2D2A26] tracking-tight">
            이미지 크기 조정
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 font-medium">
            서버 전송 없이 브라우저에서 여러 이미지의 해상도 및 포맷을 일괄 변경합니다.
          </p>
        </div>
      </div>
    </header>
  );
}
