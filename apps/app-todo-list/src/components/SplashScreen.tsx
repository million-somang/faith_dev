import { useEffect, useState } from 'react';

interface SplashScreenProps {
  readonly onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [progress, setProgress] = useState<number>(1);
  const [logoError, setLogoError] = useState<boolean>(false);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 4000;
    let finishTimer: ReturnType<typeof setTimeout> | null = null;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const next = Math.min(100, Math.max(1, Math.floor((elapsed / duration) * 100)));
      setProgress(next);

      if (elapsed >= duration) {
        clearInterval(timer);
        finishTimer = setTimeout(() => {
          onFinish();
        }, 120);
      }
    }, 40);

    return () => {
      clearInterval(timer);
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      className="loading-screen fixed inset-0 z-50 bg-[#FAF8F5] text-[#2D2A26] flex flex-col justify-between items-center py-5 px-4 select-none overflow-hidden"
      aria-label="로딩 중"
      data-screenshot-target="splash"
    >
      {/* 1. 상단 브랜드 & 프라이버시 배지 */}
      <div className="w-full max-w-md flex items-center justify-between pt-1 shrink-0">
        <a
          href="https://veranex.app"
          target="_top"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
          <span className="text-xs font-black tracking-wider text-[#2D2A26] uppercase">
            V<span className="text-indigo-600">ERANEX</span>
          </span>
        </a>
        <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
          100% LOCAL PRIVACY
        </span>
      </div>

      {/* 2. 중앙 3D 플로팅 체크리스트 비주얼 & 1~100% 프로그레스 */}
      <div className="w-full max-w-sm flex flex-col items-center text-center my-auto py-3 shrink-0">
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-3xl bg-white border border-[#EBE6DD] nm-card-warm flex items-center justify-center p-3 animate-float">
            {!logoError ? (
              <img
                src="https://veranex.app/logo-192.png"
                alt="VeraNex 공식 로고"
                className="w-full h-full object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <svg viewBox="0 0 48 48" className="w-11 h-11" aria-hidden="true">
                <rect x="8" y="8" width="32" height="34" rx="8" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="2.5" />
                <path d="M17 24l5 5 10-10" fill="none" stroke="#059669" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 text-white flex items-center justify-center shadow-md border-2 border-white text-xs">
            <i className="fas fa-list-check"></i>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-xl font-black tracking-tight text-[#2D2A26]">V</span>
          <span className="text-xl font-black tracking-tight text-indigo-600">ERANEX</span>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 ml-1">
            SMART TO-DO
          </span>
        </div>

        <h2 className="text-lg font-black text-[#2D2A26] mb-1 tracking-tight">
          스마트 투두(TO-DO) 할일 플래너
        </h2>
        <p className="text-xs text-[#7A7369] mb-5 font-medium leading-relaxed">
          우선순위 · 마감 D-Day · 서브태스크 · 25분 집중 타이머 · 마이페이지 연동
        </p>

        {/* 1% ~ 100% 실시간 프로그레스 바 (SVG로 width 인라인 style 없이 구현) */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#7A7369] px-0.5">
            <span className="flex items-center gap-1.5">
              <i className="fas fa-circle-notch fa-spin text-indigo-600 text-[10px]"></i>
              <span>로컬 스토리지 동기화 및 엔진 초기화 중...</span>
            </span>
            <span className="font-mono font-black text-indigo-700 tabular-nums">{progress}%</span>
          </div>

          <svg
            viewBox="0 0 100 6"
            preserveAspectRatio="none"
            className="w-full h-2.5 rounded-full overflow-hidden nm-inset-warm"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={1}
            aria-valuemax={100}
            aria-label="초기화 진행률"
          >
            <defs>
              <linearGradient id="todoSplashGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#4F46E5" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="100" height="6" rx="3" fill="#EBE6DD" />
            <rect x="0" y="0" width={progress} height="6" rx="3" fill="url(#todoSplashGrad)" />
          </svg>
        </div>
      </div>

      {/* 3. 하단 필수 스폰서 광고 슬롯 (850px 팝업 뷰포트 내 잘림 없이 상시 노출) */}
      <div className="w-full max-w-md bg-white border border-[#EBE6DD] rounded-2xl p-3 shadow-xs shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] font-black text-indigo-700 uppercase tracking-wider bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
            SPONSORED AD
          </span>
          <span className="text-[10px] font-bold text-[#7A7369]">
            가입 없이 무료 · 서버 전송 0%
          </span>
        </div>
        <div className="bg-[#FAF8F5] border border-[#EBE6DD] rounded-xl py-2 px-3 text-xs text-[#2D2A26] font-bold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-[10px]">
              <i className="fas fa-shield-halved"></i>
            </span>
            <span className="truncate">VeraNex 마이페이지와 실시간 연동되는 무료 플래너</span>
          </div>
          <span className="text-[10px] font-black text-emerald-700 shrink-0">READY</span>
        </div>
      </div>
    </div>
  );
}
