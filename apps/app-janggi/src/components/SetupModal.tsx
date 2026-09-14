import React from 'react';
import { SetupType, Difficulty, Side } from '../types/janggi';
import { soundEffects } from '../utils/soundEffects';

interface SetupModalProps {
  isOpen: boolean;
  choSetup: SetupType;
  hanSetup: SetupType;
  aiDifficulty: Difficulty;
  playerSide: Side;
  onClose: () => void;
  onSave: (options: {
    choSetup: SetupType;
    hanSetup: SetupType;
    aiDifficulty: Difficulty;
    playerSide: Side;
  }) => void;
}

const SETUPS: { id: SetupType; name: string; desc: string; layout: string }[] = [
  { id: 'masangsangma', name: '마상상마 (안상)', desc: '표준 정석. 기동력과 중앙 방어의 균형', layout: '마 - 상 - 상 - 마' },
  { id: 'sangmamasang', name: '상마마상 (바깥상)', desc: '안정적인 수비와 기습 공격에 적합', layout: '상 - 마 - 마 - 상' },
  { id: 'wonangma', name: '원앙마', desc: '중앙에 마 2마리를 배치해 철통 수비 연계', layout: '마 - 상 - 마 - 상' },
  { id: 'yanggwima', name: '양귀마', desc: '외곽에 마를 배치하여 광활한 중앙 침투', layout: '상 - 마 - 상 - 마' },
];

const DIFFICULTIES: { id: Difficulty; name: string; tag: string; desc: string }[] = [
  { id: 'easy', name: '초급 (입문)', tag: '★☆☆', desc: '장기 규칙을 배우기 좋은 가벼운 AI' },
  { id: 'normal', name: '중급 (단·급수)', tag: '★★☆', desc: '2수 앞을 내다보는 균형잡힌 인공지능' },
  { id: 'hard', name: '고급 (프로급)', tag: '★★★', desc: '알파-베타 가지치기로 기물을 맹공' },
];

export const SetupModal: React.FC<SetupModalProps> = ({
  isOpen,
  choSetup,
  hanSetup,
  aiDifficulty,
  playerSide,
  onClose,
  onSave,
}) => {
  const [selectedChoSetup, setSelectedChoSetup] = React.useState<SetupType>(choSetup);
  const [selectedHanSetup, setSelectedHanSetup] = React.useState<SetupType>(hanSetup);
  const [selectedDiff, setSelectedDiff] = React.useState<Difficulty>(aiDifficulty);
  const [selectedSide, setSelectedSide] = React.useState<Side>(playerSide);

  if (!isOpen) return null;

  const handleApply = () => {
    soundEffects.playSnap();
    onSave({
      choSetup: selectedChoSetup,
      hanSetup: selectedHanSetup,
      aiDifficulty: selectedDiff,
      playerSide: selectedSide,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-5 text-white max-h-[90vh] flex flex-col"
        data-screenshot-target="setup-dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm">
              <i className="fas fa-sliders-h"></i>
            </span>
            <h3 className="text-base font-black tracking-tight">대국 설정 & 기물 차림</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center text-xs transition-all"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1 text-xs">
          {/* Player Side */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              진영 선택 (선공/후공)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playSnap();
                  setSelectedSide('cho');
                }}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                  selectedSide === 'cho'
                    ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300 font-black shadow-md shadow-cyan-500/20'
                    : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center text-[10px] text-slate-950 font-black">
                  楚
                </span>
                <span>초(楚) 선공</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEffects.playSnap();
                  setSelectedSide('han');
                }}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                  selectedSide === 'han'
                    ? 'border-rose-500 bg-rose-500/20 text-rose-300 font-black shadow-md shadow-rose-500/20'
                    : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center text-[10px] text-white font-black">
                  漢
                </span>
                <span>한(漢) 후공 (덤1.5)</span>
              </button>
            </div>
          </div>

          {/* AI Difficulty */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              인공지능(AI) 난이도
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    soundEffects.playSnap();
                    setSelectedDiff(d.id);
                  }}
                  className={`py-2 px-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                    selectedDiff === d.id
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-black shadow-md shadow-amber-500/20'
                      : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-[10px] text-amber-400 font-bold">{d.tag}</span>
                  <span className="text-xs font-bold mt-0.5">{d.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cho Setup (마/상 차림) */}
          <div>
            <label className="block text-[11px] font-bold text-cyan-400 mb-1.5 uppercase tracking-wider">
              초(楚) 상마 차림법
            </label>
            <div className="space-y-1.5">
              {SETUPS.map((s) => (
                <button
                  key={`cho-${s.id}`}
                  type="button"
                  onClick={() => {
                    soundEffects.playSnap();
                    setSelectedChoSetup(s.id);
                  }}
                  className={`w-full p-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                    selectedChoSetup === s.id
                      ? 'border-cyan-500 bg-cyan-500/15 text-white'
                      : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800/70'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs">{s.name}</div>
                    <div className="text-[10px] text-slate-400">{s.desc}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300 font-mono">
                    {s.layout}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Han Setup (마/상 차림) */}
          <div>
            <label className="block text-[11px] font-bold text-rose-400 mb-1.5 uppercase tracking-wider">
              한(漢) 상마 차림법
            </label>
            <div className="space-y-1.5">
              {SETUPS.map((s) => (
                <button
                  key={`han-${s.id}`}
                  type="button"
                  onClick={() => {
                    soundEffects.playSnap();
                    setSelectedHanSetup(s.id);
                  }}
                  className={`w-full p-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                    selectedHanSetup === s.id
                      ? 'border-rose-500 bg-rose-500/15 text-white'
                      : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800/70'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs">{s.name}</div>
                    <div className="text-[10px] text-slate-400">{s.desc}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-rose-300 font-mono">
                    {s.layout}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-xs transition-all"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
          >
            대국에 적용하기
          </button>
        </div>
      </div>
    </div>
  );
};
