import React from 'react';
import { BookOpen, ShieldAlert, Award, CheckCircle2, Info } from 'lucide-react';

export const RulesTab: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto p-3.5 space-y-3 animate-fade-in text-[#2d261e] text-xs leading-relaxed bg-[#f7f4ed]">
      {/* 타이틀 헤더 */}
      <div className="bg-gradient-to-r from-[#d97706] to-[#b45309] text-white rounded-2xl p-3.5 shadow-sm">
        <div className="flex items-center gap-2 mb-0.5">
          <BookOpen className="w-4 h-4 text-amber-200" />
          <h2 className="text-xs font-black tracking-tight">베라오목 공인 렌주룰 경기 규칙</h2>
        </div>
        <p className="text-[11px] text-amber-100">
          오목은 선공(흑)의 유리함을 상쇄하기 위해 공인 렌주룰(Renju Rules)을 채택하고 있습니다.
        </p>
      </div>

      {/* 1. 승리 조건 */}
      <section className="bg-white rounded-2xl p-3.5 border border-[#e8e1d5] shadow-2xs space-y-1.5">
        <h3 className="text-xs font-black text-[#2d261e] flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-amber-600" />
          <span>기본 승리 조건 (5목 완성)</span>
        </h3>
        <p className="text-[#5c5245]">
          가로, 세로, 대각선 4방향 중 어느 한 방향으로 <strong>자신의 돌 5개를 먼저 빈틈없이 연속으로 연결</strong>한 플레이어가 즉시 승리합니다.
        </p>
      </section>

      {/* 2. 흑돌 금수 규칙 (핵심) */}
      <section className="bg-white rounded-2xl p-3.5 border border-[#e8e1d5] shadow-2xs space-y-2">
        <h3 className="text-xs font-black text-rose-600 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          <span>선공(흑돌) 착수 금지 규칙 (금수)</span>
        </h3>
        <div className="space-y-1.5">
          <div className="bg-rose-50/70 rounded-xl p-2.5 border border-rose-200/80">
            <span className="font-extrabold text-rose-800 block mb-0.5">① 삼삼 (3·3) 금수</span>
            <span className="text-[#5c5245] text-[11px]">
              돌을 놓음으로써 양 끝이 막히지 않은 ‘열린 3’이 동시에 2개 이상 만들어지는 지점에는 흑돌을 착수할 수 없습니다.
            </span>
          </div>

          <div className="bg-rose-50/70 rounded-xl p-2.5 border border-rose-200/80">
            <span className="font-extrabold text-rose-800 block mb-0.5">② 사사 (4·4) 금수</span>
            <span className="text-[#5c5245] text-[11px]">
              돌을 놓음으로써 ‘4’가 동시에 2개 이상 만들어지는 지점에는 흑돌을 착수할 수 없습니다. (단, 백돌은 4·4가 허용됩니다.)
            </span>
          </div>

          <div className="bg-rose-50/70 rounded-xl p-2.5 border border-rose-200/80">
            <span className="font-extrabold text-rose-800 block mb-0.5">③ 장목 (6목 이상) 금수</span>
            <span className="text-[#5c5245] text-[11px]">
              흑돌은 6개 이상의 돌이 일렬로 늘어나는 지점에 착수할 수 없습니다. 정확히 5목을 완성해야만 승리합니다.
            </span>
          </div>
        </div>
      </section>

      {/* 3. 백돌 혜택 */}
      <section className="bg-white rounded-2xl p-3.5 border border-[#e8e1d5] shadow-2xs space-y-1.5">
        <h3 className="text-xs font-black text-amber-800 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
          <span>후공(백돌)의 규칙 혜택</span>
        </h3>
        <p className="text-[#5c5245]">
          후공인 백돌은 <strong>금수 제한이 일체 없습니다</strong>. 3·3, 4·4는 물론, 6목 이상의 장목을 만들어도 백돌의 정당한 승리로 인정됩니다.
        </p>
      </section>

      {/* 4. 오목 포석 핵심 팁 */}
      <section className="bg-white rounded-2xl p-3.5 border border-[#e8e1d5] shadow-2xs space-y-1.5">
        <h3 className="text-xs font-black text-[#2d261e] flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-600" />
          <span>베라오목 실전 꿀팁</span>
        </h3>
        <ul className="list-disc list-inside space-y-0.5 text-[#5c5245] text-[11px]">
          <li><strong>중앙 선점</strong>: 초반에는 7×7 중심 화점 주위로 세력을 넓히는 것이 유리합니다.</li>
          <li><strong>선수(Sente) 유지</strong>: 상대가 막아야만 하는 '열린 3'과 '4'를 연속해서 만들며 주도권을 쥐세요.</li>
          <li><strong>양수겸장</strong>: 4·3(사삼) 형태를 노리면 상대가 한쪽을 막아도 다른 쪽으로 5목이 완성됩니다.</li>
        </ul>
      </section>
    </div>
  );
};
