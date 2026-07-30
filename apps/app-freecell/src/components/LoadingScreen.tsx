import React from 'react';

export const LoadingScreen: React.FC<{ seedNum: number }> = ({ seedNum }) => {
  return (
    <div className="fixed inset-0 z-50 bg-emerald-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white font-sans">
      <div className="relative mb-8">
        {/* Card Spin & Pulse Animation */}
        <div className="w-24 h-32 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-[0_0_30px_rgba(16,185,129,0.3)] border-2 border-emerald-400 flex items-center justify-center animate-pulse">
          <i className="fas fa-spade text-5xl text-emerald-100 animate-spin" style={{ animationDuration: '3s' }}></i>
        </div>
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-400 text-emerald-950 font-black text-xs flex items-center justify-center shadow-lg animate-bounce">
          <i className="fas fa-crown"></i>
        </div>
      </div>

      <h2 className="text-2xl font-black tracking-tight mb-2 text-emerald-100 flex items-center gap-2">
        <i className="fas fa-heart text-red-500 text-lg"></i>
        프리셀 (FreeCell) 준비 중...
      </h2>
      <p className="text-xs text-emerald-300/80 mb-6 font-medium">
        #{seedNum}번 클래식 게임 덱을 정교하게 딜링하고 있습니다.
      </p>

      {/* Loading Bar */}
      <div className="w-48 h-2 bg-emerald-900/80 rounded-full overflow-hidden border border-emerald-700/50 shadow-inner">
        <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full animate-pulse w-full"></div>
      </div>
    </div>
  );
};
