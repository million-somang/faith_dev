import { useEffect, useState } from 'react';
import { Badge } from '@astryxdesign/core/Badge';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';

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
      className="loading-screen fixed inset-0 z-50 bg-[#FAF8F5] text-[#24211D] flex flex-col justify-between items-center py-5 px-4 select-none overflow-hidden"
      aria-label="로딩 중"
      data-screenshot-target="splash"
    >
      {/* 1. 상단 브랜드 & Astryx 동기화 배지 */}
      <div className="w-full max-w-md flex items-center justify-between pt-1 shrink-0">
        <a
          href="https://veranex.app"
          target="_top"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
          <span className="text-xs font-black tracking-wider text-[#24211D] uppercase">
            V<span className="text-indigo-600">ERANEX</span>
          </span>
        </a>
        <Badge variant="success" label="DB & RECURRENCE READY" />
      </div>

      {/* 2. 중앙 Astryx 워드마크 카드 & 1~100% Astryx ProgressBar */}
      <div className="w-full max-w-sm flex flex-col items-center text-center my-auto py-3 shrink-0">
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-3xl bg-white border border-[#E5DDD0] astryx-warm-shadow flex items-center justify-center p-3 animate-float">
            {!logoError ? (
              <img
                src="https://veranex.app/logo-192.png"
                alt="VeraNex 공식 로고"
                className="w-full h-full object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <svg viewBox="0 0 48 48" className="w-11 h-11" aria-hidden="true">
                <rect x="8" y="8" width="32" height="34" rx="8" fill="#EEF2FF" stroke="#4338CA" strokeWidth="2.5" />
                <path d="M17 24l5 5 10-10" fill="none" stroke="#047857" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md border-2 border-white text-xs">
            <i className="fas fa-repeat"></i>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-xl font-black tracking-tight text-[#24211D]">V</span>
          <span className="text-xl font-black tracking-tight text-indigo-600">ERANEX</span>
          <Badge variant="purple" label="ASTRYX UI" />
        </div>

        <h2 className="text-lg font-black text-[#24211D] mb-1 tracking-tight">
          스마트 투두(TO-DO) 할일 플래너
        </h2>
        <p className="text-xs text-[#6C655B] mb-5 font-medium leading-relaxed">
          매일·매주·매월·년단위 반복 · DB 영구 저장 · 25분 집중 타이머
        </p>

        <div className="w-full bg-white rounded-2xl p-3 border border-[#E5DDD0] astryx-warm-shadow">
          <ProgressBar
            value={progress}
            max={100}
            label="DB 동기화 및 반복 스케줄러 초기화"
            hasValueLabel
            formatValueLabel={(v) => `${Math.round(v)}%`}
            variant="accent"
          />
        </div>
      </div>

      {/* 3. 하단 고정 AdSense / SPONSORED AD 슬롯 */}
      <aside
        aria-label="SPONSORED AD"
        className="w-full max-w-md bg-[#F2EDE4]/90 border border-[#E5DDD0] rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-2 shrink-0"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant="info" label="SPONSORED AD" />
          <span className="text-[11px] font-bold text-[#24211D] truncate">
            VeraNex 마이페이지에서 매일 반복 루틴과 일정을 한눈에 확인하세요
          </span>
        </div>
        <i className="fas fa-arrow-up-right-from-square text-[10px] text-[#6C655B] shrink-0"></i>
      </aside>
    </div>
  );
}
