import React from 'react';
import { Trophy, Frown, Sparkles, Flame, Shield, ArrowRight, RotateCcw } from 'lucide-react';
import { GameStatus, SpecialBadge } from '../types/baseball';

interface GameResultModalProps {
  status: GameStatus;
  badge: SpecialBadge;
  secret: string;
  inningsTaken: number;
  isMember: boolean;
  onRestart: () => void;
}

export const GameResultModal: React.FC<GameResultModalProps> = ({
  status,
  badge,
  secret,
  inningsTaken,
  isMember,
  onRestart,
}) => {
  if (status !== 'WON' && status !== 'LOST') return null;

  const isWon = status === 'WON';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#f0f4f8] rounded-3xl p-5 shadow-[12px_12px_24px_#0f172a, -6px_-6px_16px_#ffffff] border border-white flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        {/* 상단 아이콘 */}
        <div className="relative mb-3">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] ${
              isWon
                ? 'bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950'
                : 'bg-gradient-to-tr from-rose-500 to-slate-700 text-white'
            }`}
          >
            {isWon ? <Trophy className="w-9 h-9 animate-bounce" /> : <Frown className="w-9 h-9" />}
          </div>
          {isWon && (
            <div className="absolute -top-1 -right-1 text-amber-500">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
          )}
        </div>

        {/* 타이틀 및 서브텍스트 */}
        <h2 className="text-xl font-black text-slate-800 tracking-tight">
          {isWon ? '승리! (VICTORY)' : '패배 (DEFEAT)'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {isWon
            ? `${inningsTaken}회말 공격에서 3 스트라이크를 달성했습니다!`
            : '9회말까지 정답을 맞히지 못했습니다.'}
        </p>

        {/* 특별 배지 판정 */}
        {badge && (
          <div className="my-3 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border text-xs font-black">
            {badge === 'SHUTOUT' && (
              <span className="bg-emerald-500 text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <Shield className="w-3.5 h-3.5" />
                완봉승 (3이닝 이내 적중) 👑
              </span>
            )}
            {badge === 'QUALITY_START' && (
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <Flame className="w-3.5 h-3.5" />
                퀄리티 스타트 (6이닝 이내 적중) 🔥
              </span>
            )}
            {badge === 'REGULAR_WIN' && (
              <span className="bg-slate-700 text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                정규 승리 달성 ⚾
              </span>
            )}
            {badge === 'DEFEAT' && (
              <span className="bg-rose-600 text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                9회말 정규 이닝 종료 ❌
              </span>
            )}
          </div>
        )}

        {/* 상대 투수의 비밀 구종 (정답 공개) */}
        <div className="w-full bg-[#e6edf4] rounded-2xl p-3 my-2 shadow-[inset_3px_3px_6px_#cbd5e1,inset_-3px_-3px_6px_#ffffff]">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            상대 투수의 마구 (정답)
          </div>
          <div className="font-mono text-2xl font-black tracking-widest text-slate-800">
            {secret.split('').join('  ')}
          </div>
        </div>

        {/* 비회원 락인 모달 유도 */}
        {!isMember && isWon && (
          <div className="w-full p-3 my-2 rounded-2xl bg-indigo-50 border border-indigo-200 text-left flex flex-col gap-1.5">
            <div className="text-xs font-black text-indigo-900 flex items-center gap-1">
              <span>🚀</span> 내 구단명을 등록하고 랭킹전에 참여하세요!
            </div>
            <div className="text-[10px] text-indigo-700 leading-snug">
              현재는 게스트 연습 모드로 기록이 보존되지 않습니다. 로그인 후 주간 랭킹 TOP 10 포인트를 획득하세요!
            </div>
            <a
              href="/app/auth/login?redirect=/app/baseball/"
              className="mt-1 w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm active:scale-98 transition-all"
            >
              <span>구단 창단 및 랭킹전 참여</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* 다음 경기 시작 버튼 */}
        <div className="w-full flex gap-2 mt-3">
          <button
            onClick={onRestart}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-105 text-white font-black text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(16,185,129,0.3)] active:scale-98 cursor-pointer transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>다음 경기 시작 (PLAY AGAIN)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
