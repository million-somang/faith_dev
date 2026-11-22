import React from 'react';
import { Maximize2, Hand, RotateCw, Bomb } from 'lucide-react';

export const TouchControls: React.FC = () => {
  return (
    <div
      data-lobby-gesture-guide="true"
      className="w-full max-w-[450px] mx-auto mt-2.5 bg-white rounded-2xl border border-[#EBE6DD] shadow-2xs p-3 select-none"
    >
      <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-[#F2EDE4]">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#1E293B]">
          <Maximize2 className="w-3.5 h-3.5 text-sky-600" />
          출격 시 자동 전체화면 몰입 모드
        </span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
          오터치 방지 제스처
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5 text-center">
        <div className="rounded-xl bg-[#FAF8F5] border border-[#EBE6DD] px-2 py-2 flex flex-col items-center gap-1">
          <Hand className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-[11px] font-extrabold text-[#2D2A26]">전체 드래그</span>
          <span className="text-[10px] text-[#7A756D] leading-tight">여백 포함 자유 이동</span>
        </div>

        <div className="rounded-xl bg-[#FAF8F5] border border-[#EBE6DD] px-2 py-2 flex flex-col items-center gap-1">
          <RotateCw className="w-3.5 h-3.5 text-sky-600" />
          <span className="text-[11px] font-extrabold text-[#2D2A26]">더블탭 / Z</span>
          <span className="text-[10px] text-[#7A756D] leading-tight">360° 공중제비 무적</span>
        </div>

        <div className="rounded-xl bg-[#FAF8F5] border border-[#EBE6DD] px-2 py-2 flex flex-col items-center gap-1">
          <Bomb className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-[11px] font-extrabold text-[#2D2A26]">두 손가락 / X</span>
          <span className="text-[10px] text-[#7A756D] leading-tight">메가 폭탄 전탄 소거</span>
        </div>
      </div>
    </div>
  );
};
