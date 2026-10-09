import React from 'react';
import { RotateCcw, Trophy, Home, Crosshair, Award } from 'lucide-react';

interface GameOverModalProps {
  score: number;
  kills: number;
  highScore: number;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  kills,
  highScore,
  onRestart,
}) => {
  const isNewHighScore = score >= highScore && score > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 border border-[#EBE6DD] shadow-2xl text-center animate-soft-pulse">
        {/* 상단 뱃지 */}
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md">
          {isNewHighScore ? (
            <Award className="w-9 h-9" />
          ) : (
            <Trophy className="w-9 h-9" />
          )}
        </div>

        <h3 className="text-xl font-black text-[#1E293B] mb-1">
          {isNewHighScore ? '🎉 신기록 달성!' : '작전 종료 (GAME OVER)'}
        </h3>
        <p className="text-xs text-[#7A756D] mb-5">
          {isNewHighScore
            ? '역대 최고 기록을 경신했습니다!'
            : '태평양 상공에서 용맹하게 교전했습니다.'}
        </p>

        {/* 결과 통계 카드 */}
        <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#EBE6DD] mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#7A756D] font-medium">최종 획득 점수</span>
            <span className="font-mono text-xl font-black text-sky-700">
              {score.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-[#7A756D] font-medium flex items-center gap-1">
              <Crosshair className="w-3.5 h-3.5 text-red-500" />
              격추 적기 수
            </span>
            <span className="font-mono text-sm font-bold text-red-600">
              {kills.toLocaleString()} 기
            </span>
          </div>

          <div className="pt-2 border-t border-[#EBE6DD] flex items-center justify-between">
            <span className="text-xs text-[#7A756D] font-medium">역대 최고 기록</span>
            <span className="font-mono text-sm font-black text-amber-600">
              {highScore.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onRestart}
            data-screenshot-point="result"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2 active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            다시 출격하기
          </button>

          <a
            href="https://veranex.app/game"
            target="_top"
            className="w-full py-2.5 px-4 rounded-xl bg-[#F7F4EE] hover:bg-[#EBE6DD] border border-[#E0D9CD] text-[#2D2A26] font-bold text-xs transition flex items-center justify-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5 text-emerald-600" />
            게임센터 로비로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
};
