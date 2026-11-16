import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete?: () => void;
  onFinish?: () => void;
}

export function SplashScreen({ onComplete, onFinish }: SplashScreenProps) {
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 4000; // miniapp.md 4초(4,000ms) 필수 표준

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const nextProgress = Math.min(100, Math.max(1, Math.floor((elapsed / duration) * 100)));
      setProgress(nextProgress);

      if (elapsed >= duration) {
        clearInterval(timer);
        if (onComplete) onComplete();
        if (onFinish) onFinish();
      }
    }, 40);

    return () => clearInterval(timer);
  }, [onComplete, onFinish]);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#FAF8F5] text-[#2D2A26] flex flex-col justify-between items-center py-6 px-4 select-none"
      data-screenshot-target="splash"
    >
      {/* 1. 상단 브랜드 & 엔진 배지 */}
      <div className="w-full max-w-md flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
          <span className="text-xs font-black text-[#2D2A26] tracking-wider uppercase">
            V<span className="text-indigo-600">ERANEX</span>
          </span>
        </div>
        <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full shadow-2xs">
          ISO/IEC 18004 표준 코덱
        </span>
      </div>

      {/* 2. 중앙 3D 엠블럼 및 1~100% 실시간 프로그레스 */}
      <div className="flex flex-col items-center max-w-sm w-full text-center my-auto py-4">
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-3xl bg-white shadow-md border border-[#EBE6DD] flex items-center justify-center p-3 animate-float">
            <img
              src="https://veranex.app/logo-192.png"
              alt="VeraNex Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md border-2 border-white text-xs">
            <i className="fas fa-qrcode"></i>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-2xl font-black tracking-tight text-[#2D2A26]">V</span>
          <span className="text-2xl font-black tracking-tight text-indigo-600">ERANEX</span>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 ml-1">
            QR STUDIO PRO
          </span>
        </div>

        <h2 className="text-base font-black text-[#2D2A26] mb-1">
          스마트 QR코드 생성기 &amp; 디자인 스튜디오
        </h2>
        <p className="text-xs text-stone-500 mb-6 font-medium leading-relaxed">
          URL · 매장 와이파이 · 전자명함(vCard) · 고해상도 PNG/SVG 로컬 생성
        </p>

        {/* 1% ~ 100% 실시간 게이지 바 */}
        <div className="w-full bg-[#EBE6DD] h-3 rounded-full overflow-hidden p-0.5 shadow-inner mb-2.5">
          <div
            className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 h-full rounded-full transition-all duration-75 ease-out animate-pulse-glow"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="flex justify-between items-center w-full text-xs font-mono font-bold text-stone-500 px-0.5">
          <span className="flex items-center gap-1.5">
            <i className="fas fa-circle-notch fa-spin text-indigo-600 text-[11px]"></i>
            <span>REED-SOLOMON MATRIX ENGINE...</span>
          </span>
          <span className="text-indigo-600 font-black tabular-nums">{progress}%</span>
        </div>
      </div>

      {/* 3. 하단 고정형 스폰서 광고 배너 (miniapp.md 3.1절 필수 표준) */}
      <div className="w-full max-w-md bg-white border border-[#EBE6DD] rounded-2xl p-3.5 text-center shadow-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
            SPONSORED AD
          </span>
          <span className="text-[10px] font-bold text-stone-400">
            유효기간 평생 무제한 · 서버 전송 0%
          </span>
        </div>
        <div className="bg-[#FAF8F5] border border-[#EBE6DD] rounded-xl py-2.5 px-3 text-xs text-[#2D2A26] font-bold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <i className="fas fa-shield-halved text-emerald-600"></i>
            <span className="truncate">100% 브라우저 로컬 암호화 QR 생성 엔진 가동 중</span>
          </div>
          <span className="text-[10px] font-extrabold text-indigo-600 shrink-0">VERIFIED</span>
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;
