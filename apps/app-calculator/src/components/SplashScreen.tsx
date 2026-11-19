import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [progress, setProgress] = useState<number>(1);
  const [logoFailed, setLogoFailed] = useState<boolean>(false);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 4000; // miniapp.md 4초(4,000ms) 필수 표준

    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const nextProgress = Math.min(100, Math.max(1, Math.floor((elapsed / duration) * 100)));
      setProgress(nextProgress);

      if (elapsed >= duration) {
        window.clearInterval(timer);
        onFinish();
      }
    }, 40);

    return () => window.clearInterval(timer);
  }, [onFinish]);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#FAF8F5] text-[#2D2A26] flex flex-col justify-between items-center py-5 px-4 select-none overflow-hidden"
      role="status"
      aria-label="스마트 계산기 로딩 중"
      data-screenshot-target="splash"
    >
      {/* 1. 상단 브랜드 & 엔진 배지 */}
      <div className="w-full max-w-md flex items-center justify-between pt-1 shrink-0">
        <a
          href="https://veranex.app"
          target="_top"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:opacity-85 transition-opacity"
          title="VeraNex 포털 홈"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
          <span className="text-xs font-black text-[#2D2A26] tracking-wider uppercase">
            V<span className="text-indigo-600">ERANEX</span>
          </span>
        </a>
        <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full shadow-2xs">
          정밀 연산 보정 엔진
        </span>
      </div>

      {/* 2. 중앙 3D 플로팅 아이콘 및 1~100% 실시간 프로그레스 */}
      <div className="flex flex-col items-center max-w-sm w-full text-center my-auto py-3 shrink-0">
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-3xl bg-white shadow-md border border-[#EBE6DD] flex items-center justify-center p-3 animate-float">
            {!logoFailed ? (
              <img
                src="https://veranex.app/logo-192.png"
                alt="VeraNex 공식 로고"
                className="w-full h-full object-contain"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <i className="fas fa-calculator text-3xl text-indigo-600" aria-hidden="true"></i>
            )}
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md border-2 border-white text-xs">
            <i className="fas fa-calculator" aria-hidden="true"></i>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-2xl font-black tracking-tight text-[#2D2A26]">V</span>
          <span className="text-2xl font-black tracking-tight text-indigo-600">ERANEX</span>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 ml-1">
            SMART CALC
          </span>
        </div>

        <p className="text-base font-black text-[#2D2A26] mb-1">
          스마트 일반 · 공학 계산기
        </p>
        <p className="text-xs text-stone-500 mb-6 font-medium leading-relaxed">
          사칙연산 · 메모리(M+/MR) · 공학용 삼각함수(DEG/RAD) · 로그 정밀 계산
        </p>

        {/* 1% ~ 100% 실시간 게이지 바 (인라인 style 미사용) */}
        <div className="w-full mb-2.5">
          <progress
            value={progress}
            max={100}
            aria-label="계산 엔진 초기화 진행률"
            className="w-full h-3 rounded-full overflow-hidden appearance-none bg-[#EBE6DD] shadow-inner [&::-webkit-progress-bar]:bg-[#EBE6DD] [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:bg-gradient-to-r [&::-webkit-progress-value]:from-indigo-600 [&::-webkit-progress-value]:via-blue-600 [&::-webkit-progress-value]:to-cyan-500 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-all [&::-webkit-progress-value]:duration-75 [&::-moz-progress-bar]:bg-indigo-600"
          />
        </div>

        <div className="flex justify-between items-center w-full text-xs font-calc-mono font-bold text-stone-500 px-0.5">
          <span className="flex items-center gap-1.5">
            <i className="fas fa-circle-notch fa-spin text-indigo-600 text-[11px]" aria-hidden="true"></i>
            <span>SCIENTIFIC MATH ENGINE...</span>
          </span>
          <span className="text-indigo-600 font-black tabular-nums">{progress}%</span>
        </div>
      </div>

      {/* 3. 하단 고정형 스폰서 광고 배너 (miniapp.md 850px 뷰포트 온전 노출 의무) */}
      <aside
        className="w-full max-w-md bg-white border border-[#EBE6DD] rounded-2xl p-3.5 text-center shadow-2xs shrink-0"
        aria-label="SPONSORED AD"
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
            SPONSORED AD
          </span>
          <span className="text-[10px] font-bold text-stone-400">
            평생 무료 · 서버 전송 0%
          </span>
        </div>
        <div className="bg-[#FAF8F5] border border-[#EBE6DD] rounded-xl py-2 px-3 text-xs text-[#2D2A26] font-bold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <i className="fas fa-shield-halved text-emerald-600" aria-hidden="true"></i>
            <span className="truncate">100% 브라우저 로컬 정밀 수식 연산 엔진 가동 중</span>
          </div>
          <span className="text-[10px] font-extrabold text-indigo-600 shrink-0">VERIFIED</span>
        </div>
      </aside>
    </div>
  );
}

export default SplashScreen;
