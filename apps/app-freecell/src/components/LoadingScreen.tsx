import React from 'react';

interface LoadingScreenProps {
  seedNum: number;
  progress: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ seedNum, progress }) => {
  return (
    <div
      className="fixed inset-0 z-50 min-h-screen w-full flex flex-col justify-between items-center bg-gradient-to-b from-slate-50 via-white to-slate-100 p-6 sm:p-8 select-none animate-fade-in font-sans loading-screen"
      aria-label="로딩"
    >
      {/* 1. 상단 브랜딩 & 기준 배지 */}
      <div className="w-full max-w-sm flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-black text-slate-500 tracking-wider uppercase">VERANEX</span>
        </div>
        <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full shadow-2xs">
          2026 공인 기준 준수
        </span>
      </div>

      {/* 2. 중앙 메인 비주얼 & 1~100% 실시간 프로그레스 */}
      <div className="w-full max-w-sm flex flex-col items-center justify-center my-auto py-6 text-center">
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 text-white flex items-center justify-center text-3xl shadow-xl shadow-emerald-500/20 border-2 border-white animate-bounce-soft">
            <i className="fas fa-spade"></i>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-white text-emerald-600 rounded-full p-1.5 shadow-md border border-slate-100 text-xs">
            <i className="fas fa-crown text-amber-500"></i>
          </div>
        </div>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
          베라 프리셀
        </h1>
        <p className="text-xs font-bold text-slate-700 mb-1">
          2026 공인 정통 카드 솔리테어
        </p>
        <p className="text-[11px] text-slate-400 mb-5 max-w-xs leading-relaxed">
          #{seedNum}번 클래식 52장 카드 덱 딜링 및 공정성 검증 중
        </p>

        {/* 1~100% 실시간 프로그레스 바 & 숫자 퍼센트 게이지 */}
        <div className="w-full max-w-xs space-y-1.5 mb-2">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 px-1">
            <span>클래식 솔리테어 덱 분배 중</span>
            <span className="font-black text-emerald-600 text-xs tabular-nums">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 border border-slate-200 h-2.5 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-full transition-all duration-75 ease-out shadow-xs"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-600">
          <i className="fas fa-spinner fa-spin text-xs"></i>
          <span>보안 채널 연결 및 모듈 로딩 중... ({progress}%)</span>
        </div>
      </div>

      {/* 3. 하단 필수 광고 / 스폰서 배너 영역 (4초 로딩 중 의무 노출) */}
      <div className="w-full max-w-sm flex flex-col items-center gap-2 pb-1">
        <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 text-sm shadow-2xs">
              <i className="fas fa-bullhorn"></i>
            </div>
            <div className="text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black text-emerald-600 uppercase bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">AD</span>
                <span className="text-xs font-bold text-slate-800 truncate">2026 베라 브레인 챌린지</span>
              </div>
              <span className="text-[10px] text-slate-400 truncate block">매일 5분 두뇌 피트니스 루틴</span>
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-black rounded-lg border border-emerald-200 transition-colors cursor-pointer"
          >
            확인
          </button>
        </div>
        <span className="text-[10px] text-slate-400">© 2026 VeraNex. All rights reserved.</span>
      </div>
    </div>
  );
};
