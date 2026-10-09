import React, { useEffect, useState } from 'react';
import { ShieldCheck, Zap } from 'lucide-react';
import { BannerSlot } from './BannerSlot';
import { assetManager } from '../engine/assets';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState<number>(1);

  useEffect(() => {
    // 스프라이트 에셋 즉시 백그라운드 프리로드
    assetManager.preloadAssets();

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
          }, 150);
          return 100;
        }
        return Math.floor(next);
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onFinish]);

  const p38Src = `${(import.meta.env.BASE_URL || '/app/flight/').replace(/\/$/, '')}/assets/sprites/player_p38.png`;

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF8F5] text-[#2D2A26] flex flex-col justify-between items-center p-4 sm:p-6 select-none overflow-hidden">
      {/* 상단 브랜드 태그 */}
      <div className="w-full max-w-sm flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
            V
          </div>
          <span className="text-xs font-bold text-[#7A756D] tracking-wide">
            VeraNex Games
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-[#8A847A] font-medium bg-[#F7F4EE] px-2 py-0.5 rounded-full border border-[#EBE6DD]">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>공식 레트로 엔진</span>
        </div>
      </div>

      {/* 중앙 메인 그래픽 & 프로그레스 */}
      <div className="w-full max-w-sm flex flex-col items-center text-center my-auto">
        {/* 전투기 고화질 스프라이트 펄스 */}
        <div className="relative mb-6">
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-sky-400 via-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/25 p-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-radial from-white/20 to-transparent pointer-events-none" />
            <img
              src={p38Src}
              alt="베라 플라이트 P-38 전투기"
              className="w-20 h-20 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)] animate-soft-pulse"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-md bg-amber-400 text-[#2D2A26] font-black text-[10px] shadow-xs flex items-center gap-1 border border-amber-300">
            <Zap className="w-3 h-3 fill-current text-amber-900" />
            1942 REMAKE
          </div>
        </div>

        {/* 타이틀 */}
        <h1 className="text-2xl sm:text-3xl font-black text-[#1E293B] tracking-tight mb-2">
          베라 플라이트
        </h1>
        <p className="text-xs text-[#7A756D] font-medium max-w-xs leading-relaxed mb-8">
          360° 공중제비 롤 회피와 빨간 편대 격추<br />
          전설의 1942 비행 슈팅 아케이드
        </p>

        {/* 1~100% 실시간 프로그레스 바 */}
        <div className="w-full bg-white p-3 rounded-2xl border border-[#EBE6DD] shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-[#7A756D] mb-2 px-1">
            <span>엔진 로딩 중...</span>
            <span className="text-sky-600 font-mono">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-[#F2EDE4] rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-[#A8A29E] mt-2 px-1">
            <span>HTML5 60fps Canvas 2D</span>
            <span>Web Audio API Active</span>
          </div>
        </div>
      </div>

      {/* 하단 스폰서 광고 슬롯 */}
      <div className="w-full max-w-sm pb-2">
        <BannerSlot />
      </div>
    </div>
  );
};
