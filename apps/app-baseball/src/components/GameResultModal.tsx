import React from 'react';
import { Trophy, Frown, Sparkles, Flame, Shield, ArrowRight, RotateCcw } from 'lucide-react';
import { GameStatus, SpecialBadge, InningRecord } from '../types/baseball';

interface GameResultModalProps {
  status: GameStatus;
  badge: SpecialBadge;
  secret: string;
  inningsTaken: number;
  isMember: boolean;
  history: InningRecord[];
  onRestart: () => void;
}

export const GameResultModal: React.FC<GameResultModalProps> = ({
  status,
  badge,
  secret,
  inningsTaken,
  isMember,
  history,
  onRestart,
}) => {
  if (status !== 'WON' && status !== 'LOST') return null;

  const isWon = status === 'WON';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#f0f4f8] rounded-3xl p-4 sm:p-5 shadow-[12px_12px_28px_#0f172a,-6px_-6px_16px_#ffffff] border-2 border-white flex flex-col items-center text-center animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* 상단 아이콘 */}
        <div className="relative mb-2 shrink-0">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] ${
              isWon
                ? 'bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950'
                : 'bg-gradient-to-tr from-rose-600 to-slate-800 text-white'
            }`}
          >
            {isWon ? <Trophy className="w-8 h-8 animate-bounce" /> : <Frown className="w-8 h-8" />}
          </div>
          {isWon && (
            <div className="absolute -top-1 -right-1 text-amber-500">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
          )}
        </div>

        {/* 타이틀 및 서브텍스트 (진한 텍스트로 가독성 강화) */}
        <h2 className="text-xl font-black text-slate-950 tracking-tight">
          {isWon ? '승리! (VICTORY)' : '패배 (DEFEAT)'}
        </h2>
        <p className="text-xs text-slate-700 font-bold mt-0.5">
          {isWon
            ? `${inningsTaken}회말 공격에서 3 스트라이크를 달성했습니다!`
            : '9회말까지 정답을 맞히지 못했습니다.'}
        </p>

        {/* 특별 배지 판정 */}
        {badge && (
          <div className="my-2 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs border text-xs font-black">
            {badge === 'SHUTOUT' && (
              <span className="bg-emerald-600 text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-xs">
                <Shield className="w-3.5 h-3.5" />
                완봉승 (3이닝 이내 적중) 👑
              </span>
            )}
            {badge === 'QUALITY_START' && (
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-xs">
                <Flame className="w-3.5 h-3.5" />
                퀄리티 스타트 (6이닝 이내 적중) 🔥
              </span>
            )}
            {badge === 'REGULAR_WIN' && (
              <span className="bg-slate-800 text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-xs">
                정규 승리 달성 ⚾
              </span>
            )}
            {badge === 'DEFEAT' && (
              <span className="bg-rose-600 text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-xs">
                9회말 정규 이닝 종료 ❌
              </span>
            )}
          </div>
        )}

        {/* 상대 투수의 비밀 구종 (정답 공개) */}
        <div className="w-full bg-[#e2eaf2] rounded-2xl p-2.5 my-1.5 shadow-[inset_3px_3px_6px_#cbd5e1,inset_-3px_-3px_6px_#ffffff] border border-slate-200/80">
          <div className="text-[10px] font-black text-slate-700 uppercase tracking-wider mb-0.5">
            상대 투수의 마구 (정답)
          </div>
          <div className="font-mono text-2xl font-black tracking-widest text-slate-950">
            {secret.split('').join('  ')}
          </div>
        </div>

        {/* 1~9회 전 이닝 투구 기록 스코어카드 */}
        <div className="w-full bg-[#f8fafc] rounded-2xl p-2.5 my-1.5 border border-slate-300 shadow-inner">
          <div className="flex items-center justify-between mb-1.5 px-1 border-b border-slate-200 pb-1">
            <span className="text-[11px] font-black text-slate-900 tracking-tight flex items-center gap-1">
              <span>⚾</span> 경기 이닝별 투구 기록 ({history.length}이닝)
            </span>
            <span className="text-[10px] font-black text-indigo-700">
              {isWon ? `${inningsTaken}회 승리` : '9회 종료'}
            </span>
          </div>

          <div className="max-h-[140px] overflow-y-auto pr-0.5 space-y-1 custom-scrollbar">
            <div className="grid grid-cols-2 gap-1">
              {history.map((rec) => {
                const isWinningInning = isWon && rec.strikes === 3;
                return (
                  <div
                    key={rec.inning}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-xl border text-[11px] transition-all ${
                      isWinningInning
                        ? 'bg-amber-100 border-amber-400 shadow-xs font-black ring-1 ring-amber-300'
                        : rec.isOut
                        ? 'bg-rose-50 border-rose-200 text-rose-950'
                        : 'bg-white border-slate-200 text-slate-950'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-black shrink-0 ${
                          isWinningInning
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-200 text-slate-900 font-extrabold'
                        }`}
                      >
                        {rec.inning}회
                      </span>
                      <span className="font-mono font-black text-xs tracking-wider text-slate-950 shrink-0">
                        {rec.guess}
                      </span>
                    </div>

                    <div className="shrink-0 ml-1">
                      {isWinningInning ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-black">
                          3S 🎯
                        </span>
                      ) : rec.isOut ? (
                        <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black">
                          OUT
                        </span>
                      ) : (
                        <div className="flex items-center gap-0.5 font-black text-[10px]">
                          {rec.strikes > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-extrabold">
                              {rec.strikes}S
                            </span>
                          )}
                          {rec.balls > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 font-extrabold">
                              {rec.balls}B
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 비회원 락인 모달 유도 */}
        {!isMember && isWon && (
          <div className="w-full p-2.5 my-1.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-left flex flex-col gap-1">
            <div className="text-xs font-black text-indigo-950 flex items-center gap-1">
              <span>🚀</span> 내 구단명을 등록하고 랭킹전에 참여하세요!
            </div>
            <div className="text-[10px] text-indigo-900 font-bold leading-snug">
              현재는 게스트 연습 모드로 기록이 보존되지 않습니다. 로그인 후 주간 랭킹 TOP 10 포인트를 획득하세요!
            </div>
            <a
              href="/app/auth/login?redirect=/app/baseball/"
              className="mt-1 w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center justify-center gap-1 shadow-sm active:scale-98 transition-all"
            >
              <span>구단 창단 및 랭킹전 참여</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* 다음 경기 시작 버튼 */}
        <div className="w-full flex gap-2 mt-2">
          <button
            onClick={onRestart}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 text-white font-black text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(16,185,129,0.3)] active:scale-98 cursor-pointer transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>다음 경기 시작 (PLAY AGAIN)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
