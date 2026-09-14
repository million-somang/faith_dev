import React, { useEffect } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  // 정확히 3초(3000ms) 후 인트로 종료 (miniapp.md 표준)
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="loading-screen select-none" role="status" aria-label="베라 장기 로딩 중">
      {/* 상단 헤더 */}
      <div className="loading-header">
        <div className="loading-header-title">
          <i className="fas fa-chess-board text-cyan-400"></i>
          <span>Vera Janggi (베라 장기)</span>
        </div>
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-cyan-400 text-xs border border-white/20">
          <i className="fas fa-bolt"></i>
        </div>
      </div>

      {/* 로딩 본체 */}
      <div className="loading-body">
        {/* 중앙 로고 아이콘 서클 (네온 기물 발광) */}
        <div className="loading-icon-wrapper">
          <div className="loading-icon-inner">
            <span className="font-black font-mono tracking-tighter text-cyan-400">楚</span>
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
            <span className="ad-text">WebAssembly 인공지능 장기 엔진 준비 중...</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
