'use client';

import React from 'react';
import Link from 'next/link';

export const LoungeBanner: React.FC = () => {
  return (
    <Link
      href="/lounge"
      className="flex items-center justify-between px-4.5 py-3 bg-gradient-to-r from-rose-600 via-violet-600 to-indigo-600 text-white rounded-2xl shadow-md mb-6 hover:opacity-95 transition-all hover:translate-y-[-1px] cursor-pointer group"
    >
      <div className="flex items-center gap-2">
        <span className="bg-white/20 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">
          LIVE 🔥
        </span>
        <span className="text-xs sm:text-sm font-black tracking-tight text-white">
          지금 VERA 라운지 격론 중: 비트코인 급락 수습 방안 긴급 대토론
        </span>
      </div>
      <span className="text-xs font-black flex items-center gap-1 text-violet-200 group-hover:text-white transition-colors">
        <span>실시간 라운지 가기</span>
        <i className="fas fa-arrow-right text-[10px] group-hover:translate-x-0.5 transition-transform"></i>
      </span>
    </Link>
  );
};
