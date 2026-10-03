import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';

interface SplashIntroProps {
  onComplete: () => void;
}

export const SplashIntro: React.FC<SplashIntroProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState<number>(1);

  useEffect(() => {
    const duration = 4000; // 4초 의무 인트로
    const intervalTime = 40; // 100단계
    const increment = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 200);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="w-full max-w-[450px] min-h-[850px] mx-auto bg-gradient-to-b from-white via-slate-50 to-blue-50/40 flex flex-col justify-between p-6 select-none relative overflow-hidden font-sans shadow-2xl animate-fade-in">
      {/* 상단 공인 뱃지 */}
      <div className="pt-8 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-black tracking-wide shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>공인 15×15 렌주룰 공식 인증</span>
        </div>
      </div>

      {/* 중앙 3D 입체 엠블럼 및 타이틀 */}
      <div className="flex flex-col items-center text-center my-auto space-y-5">
        <div className="relative">
          {/* 바둑판 미니 캔버스 배경 */}
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-[#f5deb3] via-[#deb887] to-[#c89d66] border-4 border-[#8c5720]/40 shadow-xl flex items-center justify-center relative p-3">
            {/* 격자선 미니 */}
            <div className="absolute inset-2 grid grid-cols-3 grid-rows-3 border border-[#784c1f]/40 pointer-events-none">
              <div className="border-r border-b border-[#784c1f]/30"></div>
              <div className="border-r border-b border-[#784c1f]/30"></div>
              <div className="border-b border-[#784c1f]/30"></div>
              <div className="border-r border-b border-[#784c1f]/30"></div>
              <div className="border-r border-b border-[#784c1f]/30"></div>
              <div className="border-b border-[#784c1f]/30"></div>
            </div>

            {/* 3D 흑돌 */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 via-slate-900 to-black shadow-lg transform -translate-x-2 -translate-y-2 relative border border-slate-600/40 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-white/20 absolute top-1 left-2 blur-[1px]"></div>
            </div>

            {/* 3D 백돌 */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white via-slate-100 to-slate-200 shadow-lg transform translate-x-2 translate-y-2 relative border border-slate-300 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-white/70 absolute top-1 left-2 blur-[0.5px]"></div>
            </div>
          </div>

          <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-1.5 rounded-full shadow-md animate-bounce">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-1.5">
            <span>베라오목 온라인</span>
            <span className="text-xs bg-blue-600 text-white font-extrabold px-2 py-0.5 rounded-full">PVP</span>
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1.5">
            실시간 1:1 두뇌 승부 & 스마트 AI 훈련장
          </p>
        </div>

        {/* 1~100% 프로그레스 바 & 카운트 */}
        <div className="w-64 space-y-2 pt-2">
          <div className="flex justify-between items-center text-xs font-extrabold text-slate-700 px-1">
            <span>게임 엔진 로드 중...</span>
            <span className="text-blue-600 font-mono text-sm">{Math.floor(progress)}%</span>
          </div>
          <div className="w-full h-3 bg-slate-200/90 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-600 to-cyan-500 rounded-full transition-all duration-75 shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 하단 Zero-CLS 광고 배너 슬롯 */}
      <div className="w-full pb-4">
        <aside
          className="w-full min-h-[64px] flex flex-col items-center justify-center bg-white/80 rounded-2xl border border-slate-200/80 p-2 shadow-2xs backdrop-blur-xs"
          aria-label="스폰서 광고"
        >
          <span className="text-[9px] font-black text-slate-400 tracking-wider mb-0.5">ADVERTISEMENT</span>
          <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>VeraNex 스폰서 파트너십 네트워크</span>
          </div>
        </aside>
        <div className="text-center text-[10px] text-slate-400 font-medium mt-2">
          © 2026 VeraNex. All rights reserved.
        </div>
      </div>
    </div>
  );
};
