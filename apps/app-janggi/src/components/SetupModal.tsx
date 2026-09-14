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
  { id: 'yanggwima', name: '양귀마', desc: '외곽에 마를 배치하여 광활한 중앙 침투', layout: '상 - 마 - 마 - 상' },
];

const DIFFICULTIES: { id: Difficulty; name: string; tag: string; desc: string; badge: string }[] = [
  { id: 'beginner', name: '입문 (18급)', tag: '🌱 입문', desc: '장기 행마를 배우기 좋은 가벼운 AI, 가끔 실수를 합니다.', badge: '18급' },
  { id: 'easy', name: '초급 (10급)', tag: '⭐ 초급', desc: '1~2수 앞을 보며 기물 포획 위주로 기본에 충실합니다.', badge: '10급' },
  { id: 'normal', name: '중급 (3급)', tag: '⭐⭐ 중급', desc: '2수 앞을 내다보고 중앙과 기물 전진을 조화롭게 운영합니다.', badge: '3급' },
  { id: 'hard', name: '고급 (1단)', tag: '⭐⭐⭐ 고급', desc: '3수 수읽기와 알파베타 가지치기로 빈틈을 날카롭게 찌릅니다.', badge: '1단' },
  { id: 'master', name: '달인 (프로 9단)', tag: '👑 프로', desc: '외통수 집중 수순과 철벽 방어를 구사하는 최정상급 AI', badge: '9단' },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-sm rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-5 text-slate-800 max-h-[90vh] flex flex-col"
        data-screenshot-target="setup-dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">
              <i className="fas fa-sliders-h"></i>
            </span>
            <h3 className="text-base font-black tracking-tight text-slate-900">대국 설정 & 기물 차림</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs transition-all cursor-pointer"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1 text-xs">
          {/* Player Side */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              진영 선택 (선공/후공)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playSnap();
                  setSelectedSide('cho');
                }}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectedSide === 'cho'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-black shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-[#059669] flex items-center justify-center text-[10px] text-white font-black">
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
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectedSide === 'han'
                    ? 'border-rose-500 bg-rose-50 text-rose-800 font-black shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-[#dc2626] flex items-center justify-center text-[10px] text-white font-black">
                  漢
                </span>
                <span>한(漢) 후공 (덤1.5)</span>
              </button>
            </div>
          </div>

          {/* AI Difficulty */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                인공지능(AI) 난이도 설정
              </label>
              <span className="text-[11px] font-extrabold text-amber-700">
                {DIFFICULTIES.find(d => d.id === selectedDiff)?.name}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    soundEffects.playSnap();
                    setSelectedDiff(d.id);
                  }}
                  className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                    selectedDiff === d.id
                      ? 'border-amber-500 bg-amber-50 text-amber-900 font-black shadow-sm scale-102'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-[9px] font-extrabold">{d.tag.split(' ')[0]}</span>
                  <span className="text-[11px] font-black mt-0.5">{d.badge}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5 px-1 font-medium">
              💡 {DIFFICULTIES.find(d => d.id === selectedDiff)?.desc}
            </p>
          </div>

          {/* Cho Setup (마/상 차림) */}
          <div>
            <label className="block text-[11px] font-bold text-emerald-700 mb-1.5 uppercase tracking-wider">
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
                  className={`w-full p-2 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    selectedChoSetup === s.id
                      ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs">{s.name}</div>
                    <div className="text-[10px] text-slate-500">{s.desc}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-white text-emerald-800 font-mono border border-slate-200">
                    {s.layout}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Han Setup (마/상 차림) */}
          <div>
            <label className="block text-[11px] font-bold text-rose-700 mb-1.5 uppercase tracking-wider">
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
                  className={`w-full p-2 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    selectedHanSetup === s.id
                      ? 'border-rose-500 bg-rose-50/70 text-rose-950 font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs">{s.name}</div>
                    <div className="text-[10px] text-slate-500">{s.desc}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-white text-rose-800 font-mono border border-slate-200">
                    {s.layout}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-all cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
          >
            대국에 적용하기
          </button>
        </div>
      </div>
    </div>
  );
};
