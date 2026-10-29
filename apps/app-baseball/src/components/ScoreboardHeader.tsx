import { Edit3 } from 'lucide-react';
import { TeamProfile } from '../types/baseball';
import { BASEBALL_ASSETS } from '../utils/assets';

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
    <div className="bg-[#f0f4f8] rounded-2xl p-2 shadow-[4px_4px_10px_#d1d9e6,-4px_-4px_10px_#ffffff] border border-white/90 flex items-center justify-between gap-2">
      {/* 좌측: 나노바나나 구단 엠블럼 & 구단명 변경 버튼 */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-slate-800 to-slate-950 p-0.5 shadow-sm border border-amber-400/60 flex items-center justify-center shrink-0 overflow-hidden">
          <img
            src={BASEBALL_ASSETS.emblem}
            alt="Team Emblem"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-black text-slate-900 tracking-tight truncate max-w-[90px]">
              {profile.teamName}
            </span>
            <button
              type="button"
              onClick={onOpenTeamModal}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[9px] font-bold border border-indigo-200 shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
              title="구단명 변경"
            >
              <Edit3 className="w-2 h-2" />
              <span>변경</span>
            </button>
            {!isMember && (
              <span className="text-[8px] font-black text-slate-700 bg-slate-300 px-1 py-0.2 rounded shrink-0">
                게스트
              </span>
            )}
          </div>
          <p className="text-[9px] text-slate-700 font-bold truncate mt-0.5">
            {isMember
              ? `${profile.wins}승 ${profile.losses}패 (${profile.winRate.toFixed(0)}%) · 완봉 ${profile.shutouts}회`
              : '비회원 (로그인 시 랭킹 등록)'}
          </p>
        </div>
      </div>

      {/* 우측: 이닝 배지 & 통합 컴팩트 LED 볼카운트 */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* LED 볼카운트 박스 */}
        <div className="bg-slate-900 text-white rounded-xl px-2 py-1.5 flex flex-col gap-1 shadow-inner border border-slate-700 font-mono">
          <div className="flex items-center gap-2 text-[10px] font-black">
            {/* Strike */}
            <div className="flex items-center gap-1">
              <span className="text-emerald-400 text-[9px] font-extrabold">S</span>
              <div className="flex gap-0.5">
                <span className={`w-2 h-2 rounded-full border border-emerald-900 transition-all ${lastStrikes >= 1 ? 'bg-emerald-400 shadow-[0_0_5px_#34d399]' : 'bg-slate-800'}`} />
                <span className={`w-2 h-2 rounded-full border border-emerald-900 transition-all ${lastStrikes >= 2 ? 'bg-emerald-400 shadow-[0_0_5px_#34d399]' : 'bg-slate-800'}`} />
                <span className={`w-2 h-2 rounded-full border border-emerald-900 transition-all ${lastStrikes >= 3 ? 'bg-emerald-400 shadow-[0_0_5px_#34d399]' : 'bg-slate-800'}`} />
              </div>
            </div>

            {/* Ball */}
            <div className="flex items-center gap-1">
              <span className="text-amber-400 text-[9px] font-extrabold">B</span>
              <div className="flex gap-0.5">
                <span className={`w-2 h-2 rounded-full border border-amber-900 transition-all ${lastBalls >= 1 ? 'bg-amber-400 shadow-[0_0_5px_#fbbf24]' : 'bg-slate-800'}`} />
                <span className={`w-2 h-2 rounded-full border border-amber-900 transition-all ${lastBalls >= 2 ? 'bg-amber-400 shadow-[0_0_5px_#fbbf24]' : 'bg-slate-800'}`} />
                <span className={`w-2 h-2 rounded-full border border-amber-900 transition-all ${lastBalls >= 3 ? 'bg-amber-400 shadow-[0_0_5px_#fbbf24]' : 'bg-slate-800'}`} />
              </div>
            </div>

            {/* Out */}
            <div className="flex items-center gap-1">
              <span className="text-rose-400 text-[9px] font-extrabold">O</span>
              <div className="flex gap-0.5">
                <span className={`w-2 h-2 rounded-full border border-rose-900 transition-all ${lastIsOut ? 'bg-rose-500 shadow-[0_0_5px_#f43f5e]' : 'bg-slate-800'}`} />
                <span className={`w-2 h-2 rounded-full border border-rose-900 transition-all ${lastIsOut && currentInning >= 9 ? 'bg-rose-500 shadow-[0_0_5px_#f43f5e]' : 'bg-slate-800'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* 이닝 배지 */}
        <div className="px-2 py-1 rounded-xl bg-gradient-to-b from-indigo-900 to-slate-900 border border-indigo-500/60 text-center shadow-xs">
          <span className="text-[8px] font-black text-amber-300 block uppercase tracking-wider leading-none">INNING</span>
          <span className="text-xs font-black text-white font-mono leading-tight">
            {currentInning}/9회
          </span>
        </div>
      </div>
    </div>
  );
}
