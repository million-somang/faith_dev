import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete?: () => void;
  onFinish?: () => void;
}

export function SplashScreen({ onComplete, onFinish }: SplashScreenProps) {
  const [logoError, setLogoError] = useState(false);
  const handleDone = () => {
    if (onComplete) onComplete();
    if (onFinish) onFinish();
  };
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 4000; // miniapp.md 4초 필수 표준

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const nextProgress = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(nextProgress);

      if (elapsed >= duration) {
        clearInterval(timer);
        handleDone();
      }
    }, 40);

    return () => clearInterval(timer);
  }, [onComplete, onFinish]);

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF8F5] text-[#2D2A26] flex flex-col justify-between items-center py-8 px-4 select-none">
      {/* 상단 여백 */}
      <div></div>

      {/* 중앙 브랜드 엠블럼 및 인트로 */}
      <div className="flex flex-col items-center max-w-sm w-full text-center">
        <div className="w-20 h-20 mb-6 rounded-3xl bg-white shadow-md border border-[#EBE6DD] flex items-center justify-center p-3 animate-float">
          {!logoError ? (
            <img
              src="https://veranex.app/logo-192.png"
              alt="VeraNex Logo"
              className="w-full h-full object-contain"
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className="text-2xl font-black text-indigo-600">V</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-2xl font-black tracking-tight text-[#2D2A26]">V</span>
          <span className="text-2xl font-black tracking-tight text-indigo-600">ERANEX</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 ml-1">
            IMAGE UPSCALER PRO
          </span>
        </div>

        <p className="text-xs text-stone-500 mb-8 font-medium">
          브라우저 100% 로컬 AI 초해상도 · 포맷 변환기
        </p>

        {/* 1% ~ 100% 게이지 및 카운터 */}
        <div className="w-full bg-[#EBE6DD] h-2.5 rounded-full overflow-hidden p-0.5 shadow-inner mb-3">
          <svg
            viewBox="0 0 100 4"
            preserveAspectRatio="none"
            className="w-full h-full rounded-full block"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="upscaleSplashGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#9333EA" />
              </linearGradient>
            </defs>
            <rect
              x="0"
              y="0"
              width={progress}
              height="4"
              rx="2"
              fill="url(#upscaleSplashGrad)"
            />
          </svg>
        </div>

        <div className="flex justify-between w-full text-xs font-mono font-bold text-stone-400">
          <span>INITIALIZING CSR AI &amp; LANCZOS ENGINE...</span>
          <span className="text-indigo-600">{progress}%</span>
        </div>
      </div>

      {/* 하단 스폰서 배너 슬롯 (miniapp.md 표준) */}
      <div className="w-full max-w-md bg-white border border-[#EBE6DD] rounded-2xl p-3 text-center shadow-xs">
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
          SPONSORED LINK
        </span>
        <div className="bg-stone-50 rounded-xl py-3 px-4 text-xs text-stone-600 flex items-center justify-center gap-2">
          <i className="fas fa-shield-alt text-emerald-600"></i>
          <span>서버에 이미지를 전송하지 않는 100% 로컬 보안 기술 적용</span>
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;
