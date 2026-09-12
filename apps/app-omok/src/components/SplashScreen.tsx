import React, { useState, useEffect } from 'react';
import { Award, Zap } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onFinish, 200);
          return 100;
        }
        return prev + 4;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-slate-50 p-6 select-none">
      {/* 상단 뱃지 */}
      <div className="pt-8 flex flex-col items-center animate-fade-in">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 text-amber-800 text-xs font-bold border border-amber-200/60 shadow-xs">
          <Zap className="w-3.5 h-3.5 text-amber-600" />
          공식 AI 브레인 보드게임
        </span>
      </div>

      {/* 중앙 브랜드 로고 & 3D 바둑돌 플로팅 */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* 바둑판 미니 그래픽 */}
          <div className="absolute inset-0 wood-board-texture rounded-2xl shadow-lg border border-amber-600/30 transform rotate-3 flex items-center justify-center">
            <div className="w-16 h-16 border border-amber-900/30 grid grid-cols-2 grid-rows-2">
              <div className="border-r border-b border-amber-900/20"></div>
              <div className="border-b border-amber-900/20"></div>
              <div className="border-r border-amber-900/20"></div>
              <div></div>
            </div>
          </div>

          {/* 3D 흑돌 & 백돌 교차 */}
          <div className="absolute -top-1 -left-1 w-9 h-9 rounded-full stone-black animate-bounce shadow-md"></div>
          <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full stone-white animate-bounce shadow-md" style={{ animationDelay: '0.15s' }}></div>
        </div>

        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            베라오목
          </h1>
          <p className="text-xs font-semibold text-amber-700 mt-1 tracking-wider uppercase">
            Vera Omok • AI 5-in-a-Row
          </p>
          <p className="text-xs text-slate-500 mt-2">
            15×15 정통 격자에서 펼쳐지는 두뇌 전략 대전
          </p>
        </div>

        {/* 프로그레스 바 */}
        <div className="w-56 mt-4">
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-amber-500 to-amber-600 h-full transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] font-medium text-slate-400 mt-1.5">
            <span>AI 엔진 로드 중...</span>
            <span className="font-bold text-amber-600">{progress}%</span>
          </div>
        </div>
      </div>

      {/* 하단 저작권 & 크레딧 (VeraNex 단일 브랜드 100%) */}
      <div className="pb-4 flex flex-col items-center text-center space-y-1">
        <div className="flex items-center gap-1 text-slate-400 text-xs">
          <Award className="w-3.5 h-3.5 text-amber-500" />
          <span>VeraNex Smart Mini-App Engine</span>
        </div>
        <p className="text-[11px] text-slate-400 font-medium">
          © 2026 VeraNex. All rights reserved.
        </p>
      </div>
    </div>
  );
};
