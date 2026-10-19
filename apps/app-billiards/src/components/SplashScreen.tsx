import React, { useEffect, useState } from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { BannerSlot } from './BannerSlot';
import { assetManager } from '../engine/assets';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState<number>(1);

  useEffect(() => {
    assetManager.preloadAssets();

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

  const emblemSrc = assetManager.getAssetUrl('/assets/sprites/billiards_emblem.png');

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
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>60FPS 물리 당구 엔진</span>
        </div>
      </div>

      {/* 중앙 나노바나나 3D 당구 엠블럼 & 프로그레스 */}
      <div className="w-full max-w-sm flex flex-col items-center text-center my-auto">
        <div className="relative mb-5">
          <div className="w-28 h-28 rounded-3xl bg-white border-2 border-[#EBE6DD] flex items-center justify-center shadow-md p-2 relative overflow-hidden">
            <img
              src={emblemSrc}
              alt="베라 당구 클럽 엠블럼"
              className="w-24 h-24 rounded-2xl object-cover animate-soft-pulse"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-[10px] shadow-xs flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>4구 & 3구</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-[#2D2A26] tracking-tight mb-1.5">
          베라 당구 클럽
        </h1>
        <p className="text-xs text-[#7A756D] font-medium max-w-xs leading-relaxed mb-6">
          정통 4구 다마수 대결 & 대대 3구(3쿠션) 시뮬레이터<br />
          9방향 당점 스핀 · 고스트볼 분리각 · 리얼 타격 사운드
        </p>

        {/* 1~100% 실시간 프로그레스 바 (SVG 게이지로 인라인 style 제로) */}
        <div className="w-full bg-white p-3.5 rounded-2xl border border-[#EBE6DD] shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-[#7A756D] mb-2 px-1">
            <span>캐럼 당구대 & 초크 세팅 중...</span>
            <span className="text-indigo-600 font-mono font-black">{progress}%</span>
          </div>
          <svg viewBox="0 0 300 12" className="w-full h-3 rounded-full overflow-hidden bg-[#F2EDE4]">
            <defs>
              <linearGradient id="splashBarGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#4f46e5" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width={Math.max(3, progress * 3)} height="12" rx="6" fill="url(#splashBarGrad)" />
          </svg>
          <div className="flex justify-between items-center text-[10px] text-[#8A847A] mt-2 px-1 font-medium">
            <span>Sub-step Rigid Physics</span>
            <span>Web Audio Synthesizer</span>
          </div>
        </div>
      </div>

      {/* 하단 스폰서 광고 슬롯 (850px 팝업 내 100% 노출) */}
      <div className="w-full max-w-sm pb-1">
        <BannerSlot />
      </div>
    </div>
  );
};
