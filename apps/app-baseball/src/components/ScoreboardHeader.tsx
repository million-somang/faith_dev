import React from 'react';
import { Edit3 } from 'lucide-react';
import { TeamProfile } from '../types/baseball';

interface ScoreboardHeaderProps {
  isMember: boolean;
  profile: TeamProfile;
  currentInning: number;
  lastStrikes: number;
  lastBalls: number;
  lastIsOut: boolean;
  onOpenTeamModal: () => void;
}

export default function ScoreboardHeader({
  isMember,
  profile,
  currentInning,
  lastStrikes,
  lastBalls,
  lastIsOut,
  onOpenTeamModal,
}: ScoreboardHeaderProps) {
  return (
    <div className="bg-[#f0f4f8] rounded-2xl p-3 shadow-[6px_6px_14px_#d1d9e6,-6px_-6px_14px_#ffffff] border border-white/80 space-y-2">
      {/* 1. 팀 프로필 바 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center text-sm shadow-[2px_2px_5px_#cbd5e1] font-black">
            ⚾
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black text-slate-900 tracking-tight">
                {profile.teamName}
              </span>

              {/* 항상 눈에 띄는 [구단명 변경 ✏️] 버튼 */}
              <button
                type="button"
                onClick={onOpenTeamModal}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold border border-indigo-200 shadow-xs transition-all active:scale-95 cursor-pointer"
                title="내 구단명 설정"
              >
                <Edit3 className="w-2.5 h-2.5" />
                <span>구단명 변경</span>
              </button>

              {!isMember && (
                <span className="text-[9px] font-bold text-slate-400 bg-slate-200/70 px-1.5 py-0.2 rounded">
                  게스트 모드
                </span>
              )}
            </div>

            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              {isMember
                ? `${profile.wins}승 ${profile.losses}패 (승률 ${profile.winRate.toFixed(1)}% · 완봉 ${profile.shutouts}회)`
                : '비회원 연습 모드 (로그인 시 정규 랭킹 진입)'}
            </p>
          </div>
        </div>

        {/* 이닝 배지 */}
        <div className="px-2.5 py-1 rounded-xl bg-indigo-50/80 border border-indigo-200/70 text-right shadow-xs">
          <span className="text-[9px] font-black text-indigo-500 block uppercase tracking-wider">INNING</span>
          <span className="text-xs font-black text-indigo-950 font-mono">
            {currentInning} / 9 회말
          </span>
        </div>
      </div>

      {/* 2. 정통 야구 전광판 LED 볼카운트 */}
      <div className="bg-slate-900 text-white rounded-xl p-2.5 flex items-center justify-between shadow-inner font-mono">
        <div className="flex items-center gap-4 text-xs font-black">
          {/* Strike */}
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400 text-[11px] font-extrabold">S</span>
            <div className="flex gap-1">
              <span className={`w-2.5 h-2.5 rounded-full border border-emerald-900 transition-all ${lastStrikes >= 1 ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-slate-800'}`}></span>
              <span className={`w-2.5 h-2.5 rounded-full border border-emerald-900 transition-all ${lastStrikes >= 2 ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-slate-800'}`}></span>
              <span className={`w-2.5 h-2.5 rounded-full border border-emerald-900 transition-all ${lastStrikes >= 3 ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-slate-800'}`}></span>
            </div>
          </div>

          {/* Ball */}
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 text-[11px] font-extrabold">B</span>
            <div className="flex gap-1">
              <span className={`w-2.5 h-2.5 rounded-full border border-amber-900 transition-all ${lastBalls >= 1 ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]' : 'bg-slate-800'}`}></span>
              <span className={`w-2.5 h-2.5 rounded-full border border-amber-900 transition-all ${lastBalls >= 2 ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]' : 'bg-slate-800'}`}></span>
              <span className={`w-2.5 h-2.5 rounded-full border border-amber-900 transition-all ${lastBalls >= 3 ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]' : 'bg-slate-800'}`}></span>
            </div>
          </div>

          {/* Out */}
          <div className="flex items-center gap-1.5">
            <span className="text-rose-400 text-[11px] font-extrabold">O</span>
            <div className="flex gap-1">
              <span className={`w-2.5 h-2.5 rounded-full border border-rose-900 transition-all ${lastIsOut ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]' : 'bg-slate-800'}`}></span>
              <span className={`w-2.5 h-2.5 rounded-full border border-rose-900 transition-all ${lastIsOut && currentInning >= 9 ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]' : 'bg-slate-800'}`}></span>
            </div>
          </div>
        </div>

        <span className="text-[10px] text-slate-400 font-sans font-bold">
          {currentInning <= 3 ? '초반 공세 ⚡' : currentInning <= 6 ? '중반 승부처 🎯' : '후반 총력전 🔥'}
        </span>
      </div>
    </div>
  );
}
