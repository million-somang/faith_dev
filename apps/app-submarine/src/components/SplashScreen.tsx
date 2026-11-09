import React, { useEffect, useState } from 'react';
import { BannerSlot } from './BannerSlot';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState<number>(1);

  useEffect(() => {
    // URL 파라미터 ?nosplash=true 지원
    if (
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('nosplash') === 'true'
    ) {
      onFinish();
      return;
    }

    const duration = 4000;
    const intervalTime = 40;
    const step = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            onFinish();
          }, 120);
          return 100;
        }
        return Math.floor(next);
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <div
      role="status"
      aria-label="앱 로딩 중"
      className="loading-screen fixed inset-0 z-50 bg-[#FAF8F5] text-[#2D2A26] flex flex-col justify-between items-center p-4 sm:p-6 select-none overflow-hidden"
    >
      {/* 상단 VeraNex 공식 브랜드 바 */}
      <div className="w-full max-w-sm flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <img
            src="https://veranex.app/logo-192.png"
            alt="VeraNex Logo"
            className="w-6 h-6 rounded-lg object-contain shadow-2xs"
          />
          <span className="text-xs font-black text-[#2D2A26] tracking-wide">
            V<span className="text-indigo-600">ERANEX</span>
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[#7A756D] font-bold bg-[#F7F4EE] px-2.5 py-0.5 rounded-full border border-[#EBE6DD]">
          <i className="fas fa-radar text-emerald-600"></i>
          <span>10x10 해도 좌표 연산 엔진</span>
        </div>
      </div>

      {/* 중앙 3D 잠수함 해전 엠블럼 & 프로그레스 */}
      <div className="w-full max-w-sm flex flex-col items-center text-center my-auto">
        <div className="relative mb-5">
          <div className="w-28 h-28 rounded-3xl bg-white border-2 border-[#EBE6DD] flex items-center justify-center shadow-md p-3 relative overflow-hidden group">
            {/* 레이더 스위프 배경 */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50/50 to-transparent pointer-events-none" />
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-slate-900 flex items-center justify-center text-white text-3xl shadow-inner relative z-10">
              <i className="fas fa-water text-cyan-300"></i>
            </div>
            {/* 회전 레이더 빔 */}
            <div className="absolute inset-2 border-2 border-dashed border-indigo-200 rounded-2xl animate-radar pointer-events-none" />
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-[#2D2A26] tracking-tight">
          베라 서브마린
        </h1>
        <p className="text-xs font-bold text-[#7A756D] mt-1">
          모눈종이 좌표 해전 &amp; 잠수함 격침 작전
        </p>

        {/* 1% ~ 100% 게이지 및 카운터 */}
        <div className="w-full max-w-xs mt-6 space-y-2">
          <div className="flex justify-between items-center text-xs font-mono font-bold text-[#7A756D] px-1">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <span>함대 좌표 탐색 및 소나 동기화...</span>
            </span>
            <span className="text-indigo-600 font-black">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-[#EBE6DD] rounded-full overflow-hidden p-0.5 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 하단 스폰서 광고 슬롯 */}
      <div className="w-full max-w-sm pb-1">
        <BannerSlot minHeight="min-h-[50px]" label="VERANEX SPONSORED" />
      </div>
    </div>
  );
};
