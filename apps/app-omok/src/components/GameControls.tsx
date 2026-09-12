import React from 'react';
import { RotateCcw, Undo2, ChevronDown, Check } from 'lucide-react';
import { Difficulty, Player } from '../types/omok';

interface GameControlsProps {
  difficulty: Difficulty;
  humanPlayer: Player;
  isThinking: boolean;
  canUndo: boolean;
  onReset: () => void;
  onUndo: () => void;
  onSelectDifficulty: (diff: Difficulty) => void;
  onSelectPlayer: (player: Player) => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  difficulty,
  humanPlayer,
  isThinking,
  canUndo,
  onReset,
  onUndo,
  onSelectDifficulty,
  onSelectPlayer,
}) => {
  const [showDiffMenu, setShowDiffMenu] = React.useState(false);

  const diffList: { id: Difficulty; label: string; desc: string }[] = [
    { id: 'EASY', label: '초급', desc: '입문자 친화적 AI' },
    { id: 'NORMAL', label: '중급', desc: '공수 균형 3·4목 탐색' },
    { id: 'HARD', label: '고급', desc: 'Minimax 3-3/4-3 콤보 마스터' },
  ];

  return (
    <div className="w-full bg-white border-y border-slate-200/80 px-3 py-2 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        {/* 난이도 선택 버튼 */}
        <div className="relative">
          <button
            onClick={() => setShowDiffMenu(!showDiffMenu)}
            disabled={isThinking}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors shadow-2xs"
          >
            <span>난이도: {diffList.find(d => d.id === difficulty)?.label}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showDiffMenu && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 p-1.5 z-30 animate-fade-in">
              {diffList.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectDifficulty(item.id);
                    setShowDiffMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition-colors ${
                    difficulty === item.id ? 'bg-amber-50 text-amber-900 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div>{item.label}</div>
                    <div className="text-[10px] text-slate-400">{item.desc}</div>
                  </div>
                  {difficulty === item.id && <Check className="w-3.5 h-3.5 text-amber-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 흑돌/백돌 진영 선택 */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => onSelectPlayer('BLACK')}
            disabled={isThinking}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
              humanPlayer === 'BLACK' ? 'bg-white text-slate-900 font-black shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full stone-black" />
            <span>흑(선공)</span>
          </button>
          <button
            onClick={() => onSelectPlayer('WHITE')}
            disabled={isThinking}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
              humanPlayer === 'WHITE' ? 'bg-white text-slate-900 font-black shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full stone-white border border-slate-300" />
            <span>백(후공)</span>
          </button>
        </div>

        {/* 액션 버튼: 무르기 & 새 게임 */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onUndo}
            disabled={!canUndo || isThinking}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
            title="한 수 무르기"
          >
            <Undo2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">무르기</span>
          </button>

          <button
            onClick={onReset}
            disabled={isThinking}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-xs font-bold text-white transition-colors shadow-xs"
            title="새 게임 시작"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>새 게임</span>
          </button>
        </div>
      </div>
    </div>
  );
};
