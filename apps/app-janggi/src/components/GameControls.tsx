import React from 'react';
import { GameMode, SpecialSkill, SetupType } from '../types/janggi';

interface GameControlsProps {
  currentMode: GameMode;
  canUndo: boolean;
  undoCount: number;
  maxUndos: number;
  skillGauge: number; // 0 ~ 100
  selectedSetup: SetupType;
  onUndo: () => void;
  onPass: () => void;
  onHint: () => void;
  onOpenSetup: () => void;
  onNewGame: () => void;
  onUseSkill: (skill: SpecialSkill) => void;
}

const SETUP_LABELS: Record<SetupType, string> = {
  masangsangma: '마상상마 (안상)',
  sangmamasang: '상마마상 (바깥상)',
  wonangma: '원앙마',
  yanggwima: '양귀마',
};

export function GameControls({
  currentMode,
  canUndo,
  undoCount,
  maxUndos,
  skillGauge,
  selectedSetup,
  onUndo,
  onPass,
  onHint,
  onOpenSetup,
  onNewGame,
  onUseSkill,
}: GameControlsProps) {
  const isSkillReady = skillGauge >= 100;

  return (
    <div className="w-full space-y-2 select-none">
      {/* 💥 특수 스킬 배틀 모드일 때 스킬 제어 바 */}
      {currentMode === 'battle' && (
        <div className="nm-card-sm p-3 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-indigo-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-black text-indigo-900">
            <span className="flex items-center gap-1.5">
              <i className="fas fa-bolt-lightning text-amber-500"></i>
              <span>기력 게이지</span>
            </span>
            <span className="font-mono text-indigo-700">{skillGauge}%</span>
          </div>

          {/* 게이지 바 */}
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-300">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isSkillReady
                  ? 'bg-gradient-to-r from-amber-400 to-rose-500 animate-pulse'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600'
              }`}
              style={{ width: `${Math.min(100, skillGauge)}%` }}
            ></div>
          </div>

          {/* 3대 특수 스킬 선택 버튼 */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              type="button"
              disabled={!isSkillReady}
              onClick={() => onUseSkill('booster')}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                isSkillReady
                  ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>🚀 차 부스터</span>
              <span className="text-[9px] opacity-80">아군 1개 점프</span>
            </button>
            <button
              type="button"
              disabled={!isSkillReady}
              onClick={() => onUseSkill('cannon_fire')}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                isSkillReady
                  ? 'bg-rose-600 text-white shadow-sm hover:bg-rose-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>💣 포격 타격</span>
              <span className="text-[9px] opacity-80">3칸 앞 적 폭격</span>
            </button>
            <button
              type="button"
              disabled={!isSkillReady}
              onClick={() => onUseSkill('swap')}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                isSkillReady
                  ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>🔄 궁·사 스왑</span>
              <span className="text-[9px] opacity-80">궁과 사 위치교체</span>
            </button>
          </div>
        </div>
      )}

      {/* 기본 대국 조작 버튼 바 (2단계 마케팅 조작 포인트) */}
      <div className="grid grid-cols-5 gap-1.5">
        {/* 1. 한 수 무르기 */}
        <button
          type="button"
          disabled={!canUndo || undoCount >= maxUndos}
          onClick={onUndo}
          className={`py-2 px-1.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 border ${
            canUndo && undoCount < maxUndos
              ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 cursor-pointer shadow-xs'
              : 'bg-slate-100 border-slate-200/60 text-slate-400 cursor-not-allowed'
          }`}
        >
          <i className="fas fa-rotate-left text-xs"></i>
          <span>무르기 ({maxUndos - undoCount})</span>
        </button>

        {/* 2. 한 수 쉼 (Pass) */}
        <button
          type="button"
          onClick={onPass}
          className="py-2 px-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-xs"
        >
          <i className="fas fa-forward-step text-xs"></i>
          <span>한수 쉼</span>
        </button>

        {/* 3. 상차림 변경 모달 */}
        <button
          type="button"
          data-screenshot-click="action"
          onClick={onOpenSetup}
          className="py-2 px-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-xs truncate"
          title={`현재 상차림: ${SETUP_LABELS[selectedSetup]}`}
        >
          <i className="fas fa-arrows-split-up-and-left text-xs text-blue-600"></i>
          <span className="truncate max-w-full">상차림</span>
        </button>

        {/* 4. 외통수 힌트 */}
        <button
          type="button"
          onClick={onHint}
          className="py-2 px-1.5 rounded-xl text-xs font-bold bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-xs"
        >
          <i className="fas fa-lightbulb text-xs text-amber-600"></i>
          <span>힌트</span>
        </button>

        {/* 5. 새 대국 */}
        <button
          type="button"
          onClick={onNewGame}
          title="새 대국 시작 (AI 난이도 및 상차림 선택)"
          className="py-2 px-1.5 rounded-xl text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-xs"
        >
          <i className="fas fa-power-off text-xs text-rose-600"></i>
          <span>새 대국</span>
        </button>
      </div>
    </div>
  );
}
