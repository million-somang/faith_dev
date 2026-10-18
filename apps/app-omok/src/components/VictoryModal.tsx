import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Frown, RotateCcw, Clock, Hash, Zap, Award, CheckCircle2, Eye, X } from 'lucide-react';
import { Difficulty, GameScoreDetails, GameStatus, Player } from '../types/omok';

export interface VictoryModalProps {
  isOpen: boolean;
  status: GameStatus;
  difficulty: Difficulty;
  timeElapsed: number;
  moveCount: number;
  scoreDetails: GameScoreDetails | null;
  isSavingScore?: boolean;
  saveMessage?: string | null;
  isLoggedIn?: boolean;
  humanPlayer: Player;
  onClose: () => void;
  onRestart: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  status,
  difficulty,
  timeElapsed,
  moveCount,
  scoreDetails,
  isSavingScore = false,
  saveMessage = null,
  isLoggedIn = false,
  humanPlayer,
  onClose,
  onRestart,
}) => {
  useEffect(() => {
    if (isOpen && status === 'WIN') {
      // 콘페티 축포 발사
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
        });
      } catch {
        // ignore
      }
    }
  }, [isOpen, status]);

  if (status === 'PLAYING' || !isOpen) return null;

  const isWin = status === 'WIN';
  const isDraw = status === 'DRAW';

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}분 ${s}초`;
  };

  const diffLabel = {
    EASY: '초급 AI',
    NORMAL: '중급 AI',
    HARD: '고급 AI (마스터)',
  }[difficulty];

  return (
    <div
      data-screenshot-result
      className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-xs w-full p-5 text-center flex flex-col items-center space-y-3">
        {/* 우측 상단 닫기 (판 확인하기) 버튼 */}
        <button
          type="button"
          onClick={onClose}
          title="결과창 닫고 바둑판 확인하기"
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 아이콘 */}
        <div
          className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-md ${
            isWin
              ? 'bg-amber-100 text-amber-600 border border-amber-300'
              : isDraw
              ? 'bg-slate-100 text-slate-600 border border-slate-300'
              : 'bg-rose-100 text-rose-600 border border-rose-300'
          }`}
        >
          {isWin ? (
            <Trophy className="w-6.5 h-6.5" />
          ) : isDraw ? (
            <Zap className="w-6.5 h-6.5" />
          ) : (
            <Frown className="w-6.5 h-6.5" />
          )}
        </div>

        {/* 결과 타이틀 */}
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            {isWin ? '대국 승리! 축하합니다' : isDraw ? '무승부' : '아쉬운 패배'}
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isWin
              ? `${diffLabel}를 상대로 멋진 승리를 거두었습니다!`
              : isDraw
              ? '팽팽한 접전 끝에 승부를 가리지 못했습니다.'
              : `${diffLabel}의 정밀한 수읽기에 패배했습니다. 다시 도전해보세요!`}
          </p>
        </div>

        {/* 🏆 대국 획득 점수 카드 */}
        <div className="w-full bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-orange-500/10 border border-amber-300/80 rounded-2xl p-3 flex flex-col items-center shadow-xs">
          <div className="text-[11px] font-extrabold text-amber-800/90 flex items-center gap-1 mb-0.5">
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>대국 획득 점수</span>
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-amber-600 drop-shadow-xs my-0.5">
            {(scoreDetails?.totalScore ?? 0).toLocaleString()} <span className="text-sm font-extrabold text-amber-700">점</span>
          </div>

          {/* 점수 세부 구성 (보너스 내역) */}
          {scoreDetails && status === 'WIN' && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2 pt-2 border-t border-amber-200/70 w-full text-[10px] font-extrabold text-slate-600">
              <span className="px-1.5 py-0.5 rounded-md bg-amber-100/90 text-amber-800">
                기본 {scoreDetails.baseScore.toLocaleString()}
              </span>
              {scoreDetails.moveBonus > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-blue-100/90 text-blue-800">
                  속공 +{scoreDetails.moveBonus.toLocaleString()}
                </span>
              )}
              {scoreDetails.timeBonus > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-100/90 text-emerald-800">
                  스피드 +{scoreDetails.timeBonus.toLocaleString()}
                </span>
              )}
              {scoreDetails.handicapBonus > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-purple-100/90 text-purple-800">
                  후공 +{scoreDetails.handicapBonus.toLocaleString()}
                </span>
              )}
            </div>
          )}

          {/* 저장 상태 알림 */}
          <div className="mt-1.5 text-[10px] text-center w-full">
            {isSavingScore ? (
              <span className="text-amber-600 font-bold animate-pulse">
                랭킹 기록 저장 중...
              </span>
            ) : saveMessage ? (
              <span className="text-emerald-700 font-bold flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {saveMessage}
              </span>
            ) : !isLoggedIn ? (
              <span className="text-slate-400 font-medium">
                로그인 시 명예의 전당 랭킹에 등록됩니다
              </span>
            ) : null}
          </div>
        </div>

        {/* 대국 결과 요약 카드 */}
        <div className="w-full bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-xs space-y-1.5 text-slate-600">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1 text-slate-400">
              <Hash className="w-3.5 h-3.5" /> 총 착수 수
            </span>
            <strong className="text-slate-800">{moveCount}수</strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5" /> 대국 소요 시간
            </span>
            <strong className="text-slate-800">{formatTime(timeElapsed)}</strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1 text-slate-400">
              <Zap className="w-3.5 h-3.5" /> 대결 난이도
            </span>
            <strong className="text-amber-700">{diffLabel} ({humanPlayer === 'BLACK' ? '선공 흑돌' : '후공 백돌'})</strong>
          </div>
        </div>

        {/* 바둑판 확인하기 & 다시 하기 버튼 그룹 */}
        <div className="w-full space-y-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
          >
            <Eye className="w-3.5 h-3.5 text-slate-600" />
            <span>바둑판 확인하기 (마지막 수 보기)</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            <span>새 대국 시작하기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
