import React from 'react';
import { soundEffects } from '../utils/soundEffects';

interface RuleGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RuleGuideModal: React.FC<RuleGuideModalProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = React.useState<'RULES' | 'PIECES' | 'MODES'>('RULES');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-sm rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-5 text-slate-800 max-h-[90vh] flex flex-col"
        data-screenshot-target="rule-guide-dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm">
              <i className="fas fa-book-open"></i>
            </span>
            <h3 className="text-base font-black tracking-tight text-slate-900">베라장기 규칙 & 행마 가이드</h3>
          </div>
          <button
            onClick={() => {
              soundEffects.playSnap();
              onClose();
            }}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs transition-all cursor-pointer"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-1 py-2.5 border-b border-slate-100 text-xs font-bold">
          <button
            onClick={() => setTab('RULES')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              tab === 'RULES' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            기본 규칙
          </button>
          <button
            onClick={() => setTab('PIECES')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              tab === 'PIECES' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            기물 행마
          </button>
          <button
            onClick={() => setTab('MODES')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              tab === 'MODES' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            특수 모드
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 text-xs text-slate-700">
          {tab === 'RULES' && (
            <>
              <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-1.5">
                <div className="font-black text-amber-900 flex items-center gap-1.5">
                  <i className="fas fa-award text-amber-600"></i>공식 점수제 (73.5점 기준)
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  기물 점수의 총합은 72점이며, 후공인 <strong>한(漢)나라에 덤 +1.5점</strong>이 부여되어 총 73.5점 만점 기준 대국이 진행됩니다.
                </p>
                <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] text-center font-bold">
                  <span className="bg-white p-1 rounded-md text-slate-700 border border-amber-200">차: 13점</span>
                  <span className="bg-white p-1 rounded-md text-slate-700 border border-amber-200">포: 7점</span>
                  <span className="bg-white p-1 rounded-md text-slate-700 border border-amber-200">마: 5점</span>
                  <span className="bg-white p-1 rounded-md text-slate-700 border border-amber-200">상: 3점</span>
                  <span className="bg-white p-1 rounded-md text-slate-700 border border-amber-200">사: 3점</span>
                  <span className="bg-white p-1 rounded-md text-slate-700 border border-amber-200">졸/병: 2점</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-200/80 space-y-1.5">
                <div className="font-black text-rose-900 flex items-center gap-1.5">
                  <i className="fas fa-shield-alt text-rose-600"></i>포(包)의 절대 규칙
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  1. 포는 <strong>반드시 다른 기물(다리) 하나를 뛰어넘어야만</strong> 이동하거나 잡을 수 있습니다.<br/>
                  2. 포는 <strong>다른 포를 뛰어넘을 수 없습니다.</strong><br/>
                  3. 포는 <strong>상대방의 포를 잡을 수 없습니다.</strong>
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 space-y-1.5">
                <div className="font-black text-indigo-900 flex items-center gap-1.5">
                  <i className="fas fa-dungeon text-indigo-600"></i>궁성(宮城) 내의 대각선 행마
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  궁성 안의 <strong>X자 대각선</strong> 위에서는 차(車), 포(包), 졸/병(卒/兵)도 대각선 선을 타고 미끄러지듯 이동할 수 있습니다!
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-1.5">
                <div className="font-black text-emerald-900 flex items-center gap-1.5">
                  <i className="fas fa-handshake text-emerald-600"></i>빅장 및 한수 쉼
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  - 둘 수 있는 수가 없거나 전략상 <strong>'한수 쉼(패스)'</strong>을 할 수 있습니다.<br/>
                  - 상대 궁과 마주보는 '빅장' 발생 시 무승부를 청할 수 있습니다.
                </p>
              </div>
            </>
          )}

          {tab === 'PIECES' && (
            <div className="space-y-2">
              <div className="flex gap-2.5 items-start p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm shrink-0 border border-emerald-200">車</span>
                <div>
                  <div className="font-bold text-slate-900 text-xs">차(車) - 13점</div>
                  <div className="text-[11px] text-slate-500">직선으로 가로·세로 무제한 전진. 궁성 대각선 이용 가능. 최강의 기물.</div>
                </div>
              </div>

              <div className="flex gap-2.5 items-start p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm shrink-0 border border-emerald-200">包</span>
                <div>
                  <div className="font-bold text-slate-900 text-xs">포(包) - 7점</div>
                  <div className="text-[11px] text-slate-500">기물 1개를 뛰어넘어 이동. 포는 다리로 삼을 수 없고 잡을 수도 없음.</div>
                </div>
              </div>

              <div className="flex gap-2.5 items-start p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm shrink-0 border border-emerald-200">馬</span>
                <div>
                  <div className="font-bold text-slate-900 text-xs">마(馬) - 5점</div>
                  <div className="text-[11px] text-slate-500">1칸 직진 후 대각선 1칸. 직진 길목(멱)에 기물이 있으면 막힘.</div>
                </div>
              </div>

              <div className="flex gap-2.5 items-start p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm shrink-0 border border-emerald-200">象</span>
                <div>
                  <div className="font-bold text-slate-900 text-xs">상(象) - 3점</div>
                  <div className="text-[11px] text-slate-500">1칸 직진 후 대각선 2칸. 직진 및 첫 대각선 길목(멱)에 기물이 있으면 막힘.</div>
                </div>
              </div>

              <div className="flex gap-2.5 items-start p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 font-black flex items-center justify-center text-sm shrink-0 border border-rose-200">兵</span>
                <div>
                  <div className="font-bold text-slate-900 text-xs">졸/병(卒/兵) - 2점</div>
                  <div className="text-[11px] text-slate-500">앞, 좌, 우로 1칸씩 전진(후진 불가). 궁성 안에서는 대각선 전진 가능.</div>
                </div>
              </div>

              <div className="flex gap-2.5 items-start p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 font-black flex items-center justify-center text-sm shrink-0 border border-amber-200">楚</span>
                <div>
                  <div className="font-bold text-slate-900 text-xs">궁(楚/漢) & 사(士) - 3점</div>
                  <div className="text-[11px] text-slate-500">궁성 9개 점 안에서만 선을 따라 1칸씩 이동. 궁이 잡히면 패배.</div>
                </div>
              </div>
            </div>
          )}

          {tab === 'MODES' && (
            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-cyan-50 border border-cyan-200">
                <div className="font-bold text-cyan-900 mb-1 flex items-center gap-1.5">
                  <i className="fas fa-puzzle-piece text-cyan-600"></i>1일 1외통수 (묘수풀이)
                </div>
                <p className="text-[11px] text-slate-600">
                  매일 자정에 갱신되는 3~5수 승부 퍼즐! 단 한 번의 기회로 외통수를 찾아내고 연속 달성 스트릭을 쌓아보세요.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                  <i className="fas fa-bolt text-amber-600"></i>3분 쇼트폼 7x7 미니 장기
                </div>
                <p className="text-[11px] text-slate-600">
                  핵심 기물만 압축 배치된 미니 장기판에서 15초 초읽기와 함께 펼쳐지는 초스피드 박진감 대국!
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
                <div className="font-bold text-rose-900 mb-1 flex items-center gap-1.5">
                  <i className="fas fa-magic text-rose-600"></i>특수 스킬 배틀 장기
                </div>
                <p className="text-[11px] text-slate-600">
                  상대 기물을 잡을 때마다 게이지가 차오릅니다. '차 부스터', '포 포격', '궁사 위치 교환' 등의 필살기를 사용해 전세를 역전하세요!
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200">
                <div className="font-bold text-purple-900 mb-1 flex items-center gap-1.5">
                  <i className="fas fa-yin-yang text-purple-600"></i>오행 만세력 장기
                </div>
                <p className="text-[11px] text-slate-600">
                  오늘의 날짜와 사주 오행(목·화·토·금·수)에 맞춰 지정 기물에 특별 버프가 활성화되는 사주 연동 장기.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100">
          <button
            onClick={() => {
              soundEffects.playSnap();
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs active:scale-95 transition-all cursor-pointer"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
};
