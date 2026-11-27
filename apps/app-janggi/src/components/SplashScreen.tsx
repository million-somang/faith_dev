import { useEffect, useState } from 'react';
import { getJanggiAssetUrl } from '../data/aiPersonas';

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [imgFailed, setImgFailed] = useState(false);

  // 정확히 3초(3000ms) 후 인트로 종료 (miniapp.md 표준)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onFinish();
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="loading-screen select-none" role="status" aria-label="베라 장기 로딩 중">
      {/* 상단 헤더 */}
      <div className="loading-header">
        <div className="loading-header-title">
          <i className="fas fa-chess-board text-amber-600"></i>
          <span>Vera Janggi (베라 장기)</span>
        </div>
        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 text-xs border border-amber-200/80">
          <i className="fas fa-dragon"></i>
        </div>
      </div>

      {/* 로딩 본체 */}
      <div className="loading-body">
        {/* 중앙 한국화 수묵 키비주얼 서클 */}
        <div className="loading-icon-wrapper relative overflow-hidden p-1.5 border-amber-300/80 shadow-xl">
          <div className="loading-icon-inner overflow-hidden relative bg-amber-50">
            {!imgFailed ? (
              <img
                src={getJanggiAssetUrl('assets/splash-hero.png')}
                alt="베라 장기 수묵 한국화 일러스트"
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className="font-black font-mono tracking-tighter text-emerald-700">楚</span>
            )}
          </div>
        </div>

        {/* 타이틀 및 서브타이틀 */}
        <h1 className="loading-title text-slate-900">베라 장기 (Vera Janggi)</h1>
        <p className="loading-subtitle">
          정통 9×10 한국 장기 • 1일 1외통수 묘수풀이 • 3분 초속기 미니장기
        </p>

        {/* 3개 점 바운스 스피너 */}
        <div className="loading-spinner" aria-hidden="true">
          <div className="spinner-dot"></div>
          <div className="spinner-dot"></div>
          <div className="spinner-dot"></div>
        </div>

        {/* 하단 공식 안내 배너 */}
        <aside className="loading-ad-banner" aria-label="안내">
          <div className="ad-placeholder">
            <span className="ad-badge">VERA</span>
            <span className="ad-text">한국화 비자목 대국실 & 국악 사운드 엔진 준비 중...</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
