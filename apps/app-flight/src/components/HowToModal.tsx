import React from 'react';
import { X, RotateCw, Bomb, Zap, Layers, ShieldCheck, Target } from 'lucide-react';

interface HowToModalProps {
  onClose: () => void;
}

export const HowToModal: React.FC<HowToModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 border border-[#EBE6DD] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EBE6DD] mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#1E293B]">
                베라 플라이트 조작 & 공략 비결
              </h3>
              <p className="text-[11px] text-[#7A756D]">1942 클래식 아케이드 매뉴얼</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F7F4EE] hover:bg-[#EBE6DD] border border-[#E0D9CD] flex items-center justify-center text-[#7A756D] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 본문 안내 */}
        <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1 text-xs text-[#2D2A26]">
          {/* 조작법 */}
          <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#EBE6DD]">
            <h4 className="font-bold text-sky-900 mb-2 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-sky-600" />
              기본 조작 방법
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="font-semibold block text-[#7A756D]">PC 키보드</span>
                <p className="mt-0.5 text-[#2D2A26]">
                  • 이동: 방향키 또는 WASD<br />
                  • 사격: Space 또는 자동 연사<br />
                  • 롤(무적): Z 또는 J 키<br />
                  • 폭탄: X 또는 K 키
                </p>
              </div>
              <div>
                <span className="font-semibold block text-[#7A756D]">모바일 터치</span>
                <p className="mt-0.5 text-[#2D2A26]">
                  • 이동: 화면 손가락 드래그<br />
                  • 사격: 터치 시 자동 사격<br />
                  • 롤(무적): 화면 하단 롤 버튼<br />
                  • 폭탄: 화면 하단 폭탄 버튼
                </p>
              </div>
            </div>
          </div>

          {/* 3대 핵심 생존 & 공략 비결 */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-[#1E293B] px-1">🏆 1942 시그니처 전술</h4>

            {/* 1. 공중제비 롤 */}
            <div className="p-2.5 bg-sky-50/70 rounded-xl border border-sky-200 flex items-start gap-2.5">
              <RotateCw className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-sky-900 block">
                  360° 공중제비 롤 (1.5초 완전 무적)
                </span>
                <p className="text-[11px] text-sky-800 leading-relaxed mt-0.5">
                  탄막이 사방을 뒤덮었을 때 Z키 또는 롤 버튼을 누르면 기체가 회전하며 약 1.5초간 모든 탄환과 충돌을 무시합니다.
                </p>
              </div>
            </div>

            {/* 2. 메가 폭탄 */}
            <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-200 flex items-start gap-2.5">
              <Bomb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-900 block">
                  메가 폭탄 (전탄 소거 + 400 광역 피해)
                </span>
                <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                  위기 상황 시 X키를 눌러 화면 전체의 적탄을 즉시 소멸시키고, 화면 내 모든 적에게 치명적인 폭발 피해를 입힙니다.
                </p>
              </div>
            </div>

            {/* 3. 빨간 편대 비행대 전멸 */}
            <div className="p-2.5 bg-rose-50/70 rounded-xl border border-rose-200 flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-900 block">
                  빨간 편대 비행대 5기 전멸 ➔ 파워업 아이템!
                </span>
                <p className="text-[11px] text-rose-800 leading-relaxed mt-0.5">
                  S자 궤도로 날아오는 붉은 정예 편대기를 놓치지 않고 5기 모두 격추하면 주무기 강화(P), 호위기 장착(L), 폭탄 보충(B) 아이템이 확정 드롭됩니다.
                </p>
              </div>
            </div>

            {/* 4. 호위기 2기 동반 비행 */}
            <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-start gap-2.5">
              <Layers className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-900 block">
                  호위기(Option) 2기 편대 동시 비행
                </span>
                <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
                  L 아이템을 획득하면 아군 전투기 양옆에 2기의 호위기가 배치되어 2배의 화력으로 함께 지원 사격을 가합니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 확인 버튼 */}
        <div className="pt-3 border-t border-[#EBE6DD] mt-4">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs shadow transition active:scale-98"
          >
            확인 및 게임 계속하기
          </button>
        </div>
      </div>
    </div>
  );
};
