import React from 'react';

export default function SplashScreen() {
    return (
        <div className="min-h-screen w-full flex flex-col justify-between items-center bg-gradient-to-b from-slate-50 via-white to-slate-100 p-6 sm:p-8 select-none animate-fade-in">
            {/* 1. 상단 브랜딩 & 기준 배지 */}
            <div className="w-full max-w-sm flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-extrabold text-slate-500 tracking-wide uppercase">FAITH PORTAL</span>
                </div>
                <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-3 py-1 rounded-full shadow-2xs">
                    2026 W3C 웹 표준 규격
                </span>
            </div>

            {/* 2. 중앙 메인 비주얼 & 타이틀 */}
            <div className="w-full max-w-sm flex flex-col items-center justify-center my-auto py-6 text-center">
                <div className="relative mb-6">
                    <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 text-white flex items-center justify-center text-3xl sm:text-4xl shadow-xl shadow-indigo-500/20 animate-float border-2 border-white">
                        <i className="fas fa-file-image"></i>
                    </div>
                    <div className="absolute -bottom-1.5 -right-1.5 bg-white text-emerald-600 rounded-full p-1.5 shadow-md border border-slate-100 text-xs">
                        <i className="fas fa-shield-alt"></i>
                    </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
                    이미지 WebP 변환 & 압축기
                </h1>
                <p className="text-sm font-bold text-slate-700 mb-1">
                    차세대 WebP 포맷 변환 및 최대 80% 무손실 압축
                </p>
                <p className="text-xs text-slate-400 mb-8 max-w-xs leading-relaxed">
                    서버 업로드 없이 브라우저 로컬 메모리에서 100% 즉시 처리되며 파일 유출이 원천 차단됩니다
                </p>

                {/* 프로그레스 바 */}
                <div className="w-full max-w-xs bg-slate-100 border border-slate-200 h-3 rounded-full overflow-hidden p-0.5 shadow-inner mb-3">
                    <div className="h-full bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 rounded-full animate-pulse-glow" style={{ width: '100%' }}></div>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs font-black text-indigo-600">
                    <i className="fas fa-spinner fa-spin text-indigo-500 text-xs"></i>
                    <span>HTML5 Canvas 그래픽스 엔진 로딩 중...</span>
                </div>
            </div>

            {/* 3. 하단 스폰서 & 안내 푸터 */}
            <div className="w-full max-w-sm flex flex-col items-center gap-3 pb-2">
                <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                    <div className="text-left">
                        <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block mb-0.5">LOCAL SECURITY</span>
                        <span className="text-xs font-bold text-slate-800">서버 트래픽 비용 $0 · 완전한 개인정보 보호</span>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                        <i className="fas fa-lock text-xs"></i>
                    </div>
                </div>
                <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                    본 도구는 사용자의 이미지를 외부 서버로 일체 전송하지 않습니다.
                </p>
            </div>
        </div>
    );
}
