import React, { useState } from 'react';
import { TeamProfile } from '../types/baseball';

interface ScoreboardHeaderProps {
  isMember: boolean;
  profile: TeamProfile;
  currentInning: number;
  lastStrikes: number;
  lastBalls: number;
  lastIsOut: boolean;
  onUpdateTeamName: (newName: string) => Promise<boolean>;
  showToast: (msg: string) => void;
}

export default function ScoreboardHeader({
  isMember,
  profile,
  currentInning,
  lastStrikes,
  lastBalls,
  lastIsOut,
  onUpdateTeamName,
  showToast,
}: ScoreboardHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState(profile.teamName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenModal = () => {
    if (!isMember) {
      showToast('🔒 로그인 회원만 구단명을 커스텀 설정할 수 있습니다.');
      return;
    }
    setNewTeamName(profile.teamName);
    setIsModalOpen(true);
  };

  const handleSaveTeamName = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTeamName.trim();
    if (trimmed.length < 2 || trimmed.length > 10) {
      showToast('구단명은 2자 이상 10자 이내로 입력해주세요.');
      return;
    }
    setIsSubmitting(true);
    const ok = await onUpdateTeamName(trimmed);
    setIsSubmitting(false);
    if (ok) {
      setIsModalOpen(false);
      showToast(`🏆 구단명이 '${trimmed}'(으)로 변경되었습니다!`);
    } else {
      showToast('구단명 변경에 실패했습니다.');
    }
  };

  return (
    <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-xs space-y-2.5">
      {/* 1. 팀 프로필 바 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center text-sm shadow-xs font-black">
            <i className="fas fa-baseball-bat-ball"></i>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-900 tracking-tight">
                {profile.teamName}
              </span>
              {isMember ? (
                <button
                  type="button"
                  onClick={handleOpenModal}
                  className="w-5 h-5 rounded-md hover:bg-slate-100 text-indigo-600 flex items-center justify-center text-[10px] transition-all cursor-pointer"
                  title="구단명 수정"
                >
                  <i className="fas fa-pen-to-square"></i>
                </button>
              ) : (
                <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                  연습 경기
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              {isMember
                ? `${profile.wins}승 ${profile.losses}패 (승률 ${profile.winRate.toFixed(1)}% · 완봉 ${profile.shutouts}회)`
                : '비회원 게스트 모드 (베라 마린스 고정)'}
            </p>
          </div>
        </div>

        {/* 이닝 배지 */}
        <div className="px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-200/70 text-right">
          <span className="text-[9px] font-extrabold text-indigo-500 block uppercase">INNING</span>
          <span className="text-xs font-black text-indigo-900 font-mono">
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

      {/* 구단명 변경 팝업 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-xs shadow-2xl border border-slate-200 animate-pop space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className="fas fa-baseball text-indigo-600 text-sm"></i>
                <h3 className="text-sm font-black text-slate-900">내 구단명 변경</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-6 h-6 rounded-full hover:bg-slate-100 text-slate-400 text-xs flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTeamName} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  새로운 구단명 (2~10자)
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  maxLength={10}
                  placeholder="예: 의왕 타이탄즈, 네온 바이퍼스"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-600 outline-none"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? '저장 중...' : '구단명 확정'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
