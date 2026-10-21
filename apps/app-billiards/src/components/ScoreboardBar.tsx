import React from 'react';
import { Flame, RotateCcw, Trophy } from 'lucide-react';
import { AiDifficulty, BilliardsRuleMode, MatchType, SkillDama } from '../types/billiards';
import { aiDifficultyToDama } from '../engine/physicsEngine';

interface ScoreboardBarProps {
  ruleMode: BilliardsRuleMode;
  matchType: MatchType;
  playerDama: SkillDama;
  aiDifficulty: AiDifficulty;
  targetScore: number;
  currentPlayer: 1 | 2;
  p1Score: number;
  p2Score: number;
  inning: number;
  highRun: number;
  liveCushionCount: number;
  onChangeRuleMode: (mode: BilliardsRuleMode) => void;
  onChangePlayerDama: (dama: SkillDama) => void;
  onChangeDifficulty: (diff: AiDifficulty) => void;
  onReset: () => void;
}

export const ScoreboardBar: React.FC<ScoreboardBarProps> = ({
  ruleMode,
  matchType,
  playerDama,
  aiDifficulty,
  targetScore,
  currentPlayer,
  p1Score,
  p2Score,
  inning,
  highRun,
  liveCushionCount,
  onChangeRuleMode,
  onChangePlayerDama,
  onChangeDifficulty,
  onReset,
}) => {
  const unit = ruleMode === 'four-ball' ? '다마' : '점';
  const aiDamaVal = aiDifficultyToDama(aiDifficulty);

  return (
    <div className="bg-white rounded-2xl p-2 sm:p-2.5 border border-[#EBE6DD] shadow-2xs space-y-1.5 shrink-0">
      {/* 1행: 4구/3구 종목 스위치 + 내 다마수(구질) + AI 다마수 + 새 경기 */}
      <div className="flex items-center justify-between gap-1 flex-wrap sm:flex-nowrap">
        <div className="flex items-center bg-[#F7F4EE] p-0.5 rounded-xl border border-[#E5DEC9] shrink-0">
          <button
            type="button"
            onClick={() => onChangeRuleMode('four-ball')}
            className={`px-2 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
              ruleMode === 'four-ball'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-[#7A756D] hover:text-[#2D2A26]'
            }`}
          >
            🎱 4구
          </button>
          <button
            type="button"
            onClick={() => onChangeRuleMode('three-cushion')}
            className={`px-2 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
              ruleMode === 'three-cushion'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-[#7A756D] hover:text-[#2D2A26]'
            }`}
          >
            📐 3구(3쿠션)
          </button>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <select
            aria-label="내 다마수(구질 실력) 선택"
            title="내 다마수에 따라 회전량(히네리), 끌어치기(히끼), 밀어치기(오시) 물리 강도가 달라집니다"
            value={playerDama}
            onChange={(e) => onChangePlayerDama(Number(e.target.value) as SkillDama)}
            className="px-1.5 py-1 rounded-lg bg-blue-50/80 border border-blue-200 text-[10px] sm:text-[11px] font-extrabold text-blue-900 outline-none cursor-pointer"
          >
            <option value={80}>내구질: 80다마</option>
            <option value={100}>내구질: 100다마</option>
            <option value={120}>내구질: 120다마</option>
            <option value={150}>내구질: 150다마</option>
            <option value={200}>내구질: 200다마</option>
            <option value={300}>내구질: 300다마</option>
            <option value={500}>내구질: 프로(500)</option>
          </select>

          <select
            aria-label="AI 난이도 선택"
            value={aiDifficulty}
            onChange={(e) => onChangeDifficulty(e.target.value as AiDifficulty)}
            className="px-1.5 py-1 rounded-lg bg-[#F7F4EE] border border-[#E0D9CD] text-[10px] sm:text-[11px] font-extrabold text-[#2D2A26] outline-none cursor-pointer"
          >
            <option value="dama80">AI 80다마</option>
            <option value="dama100">AI 100다마</option>
            <option value="dama120">AI 120다마</option>
            <option value="dama150">AI 150다마</option>
            <option value="dama200">AI 200다마</option>
            <option value="dama300">AI 300다마</option>
            <option value="master">AI 프로(500)</option>
          </select>

          <button
            type="button"
            onClick={onReset}
            title="새 경기 시작"
            aria-label="새 경기 시작"
            className="px-2 py-1 rounded-lg bg-[#F7F4EE] hover:bg-[#EBE6DD] border border-[#E0D9CD] text-[#2D2A26] text-[10px] sm:text-[11px] font-extrabold flex items-center gap-0.5 cursor-pointer transition shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden xs:inline">초기화</span>
          </button>
        </div>
      </div>

      {/* 2행: 원라인(One-Line) 통합 전광판 (`miniapp.md` 1.6 규격) */}
      <div className="grid grid-cols-3 items-center bg-[#FAF8F5] rounded-xl px-2.5 py-1.5 border border-[#EBE6DD]">
        {/* 좌측: Player 1 (흰공) */}
        <div className="flex items-center gap-2">
          <span
            className={`w-4 h-4 rounded-full bg-white border-2 shadow-2xs shrink-0 flex items-center justify-center ${
              currentPlayer === 1 ? 'border-blue-600 ring-2 ring-blue-200' : 'border-slate-300'
            }`}
          >
            <span className="w-1 h-1 rounded-full bg-red-500" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-extrabold text-[#7A756D] truncate">
                나({playerDama === 500 ? '프로' : `${playerDama}`})
              </span>
              {currentPlayer === 1 && (
                <span className="text-[9px] font-black px-1 rounded bg-blue-100 text-blue-700">
                  TURN
                </span>
              )}
            </div>
            <div className="text-sm font-black text-[#2D2A26] font-mono leading-tight">
              {p1Score}
              <span className="text-[10px] font-bold text-[#8A847A] ml-0.5">
                /{targetScore}
                {unit}
              </span>
            </div>
          </div>
        </div>

        {/* 중앙: 이닝 & 실시간 쿠션 LED 카운터 & 하이런 */}
        <div className="flex flex-col items-center justify-center border-x border-[#EBE6DD] px-1">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#7A756D]">
            <span>{inning}이닝</span>
            <span>•</span>
            <span className="text-amber-700 flex items-center gap-0.5">
              <Flame className="w-3 h-3 text-amber-500" />
              HR {highRun}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-[#E0D9CD]">
            <span className="text-[9px] font-bold text-[#7A756D]">쿠션</span>
            <span
              className={`text-xs font-mono font-black ${
                liveCushionCount >= 3 ? 'text-emerald-600' : 'text-indigo-600'
              }`}
            >
              {liveCushionCount}
            </span>
            {ruleMode === 'three-cushion' && (
              <span className="text-[9px] font-bold text-[#8A847A]">/3+</span>
            )}
          </div>
        </div>

        {/* 우측: AI 또는 Player 2 (노란공) */}
        <div className="flex items-center justify-end gap-2 text-right">
          <div className="min-w-0">
            <div className="flex items-center justify-end gap-1">
              {currentPlayer === 2 && (
                <span className="text-[9px] font-black px-1 rounded bg-amber-100 text-amber-800">
                  TURN
                </span>
              )}
              <span className="text-[10px] font-extrabold text-[#7A756D] truncate">
                {matchType === 'practice'
                  ? '단독연습'
                  : `AI(${aiDamaVal === 500 ? '프로' : aiDamaVal})`}
              </span>
            </div>
            <div className="text-sm font-black text-[#2D2A26] font-mono leading-tight flex items-center justify-end gap-0.5">
              {matchType === 'practice' ? (
                <span className="text-xs font-extrabold text-emerald-700 flex items-center gap-0.5">
                  <Trophy className="w-3 h-3" /> 자유모드
                </span>
              ) : (
                <>
                  {p2Score}
                  <span className="text-[10px] font-bold text-[#8A847A] ml-0.5">
                    /{targetScore}
                    {unit}
                  </span>
                </>
              )}
            </div>
          </div>
          <span
            className={`w-4 h-4 rounded-full bg-amber-400 border-2 shadow-2xs shrink-0 flex items-center justify-center ${
              currentPlayer === 2 ? 'border-amber-700 ring-2 ring-amber-200' : 'border-amber-500'
            }`}
          >
            <span className="w-1 h-1 rounded-full bg-red-600" />
          </span>
        </div>
      </div>
    </div>
  );
};
