import React from 'react';
import { BookOpen, Compass, Disc, Layers, Sparkles, Target } from 'lucide-react';

export const HowToTab: React.FC = () => {
  return (
    <section className="w-full max-w-[450px] md:max-w-3xl lg:max-w-5xl mx-auto bg-white rounded-3xl p-5 sm:p-6 border border-[#EBE6DD] shadow-2xs space-y-6 animate-fade-in">
      {/* 1. H1 타이틀 섹션 (단일 H1 원칙 준수) */}
      <div className="border-b border-[#F2EDE4] pb-4">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black border border-blue-200 mb-2">
          <Sparkles className="w-3 h-3" /> OFFICIAL BILLIARDS MANUAL
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-[#2D2A26] flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600 shrink-0" />
          <span>베라 당구 클럽 (4구 & 3구) 공식 규칙 및 당점 가이드</span>
        </h1>
        <p className="text-xs text-[#7A756D] mt-1 leading-relaxed">
          한국 당구장 정통 4구(Four-Ball) 규칙과 대대 3구(3쿠션) 시스템, 당점(English)에 따른 분리각 제어 공식을 상세히 안내합니다.
        </p>
      </div>

      {/* 2. 4구 vs 3구 핵심 규칙 비교 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EBE6DD] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
              종목 01 • 정통 4구 (Four-Ball)
            </span>
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <h2 className="text-sm font-black text-[#2D2A26]">
            빨간 적구 2개 적중 (+10점) & 상대 수구 회피
          </h2>
          <p className="text-xs text-[#5C564E] leading-relaxed">
            내 수구(흰공)로 <strong>빨간 적구 2개를 모두 맞히면 10점을 득점</strong>하고 계속해서 이닝을 이어갑니다(하이런). 단, 상대방의 수구(노란공)에 내 수구가 닿으면 <strong>파울(-10점)</strong>이 선언되며 즉시 공격권이 넘어갑니다. 마지막 승부 다마는 <strong>3쿠션 이상</strong>으로 성공해야 최종 승리합니다.
          </p>
        </div>

        <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EBE6DD] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
              종목 02 • 대대 3구 (Three-Cushion)
            </span>
            <Compass className="w-4 h-4 text-indigo-600" />
          </div>
          <h2 className="text-sm font-black text-[#2D2A26]">
            3쿠션 이상 + 두 개의 적구 접촉 (+1점 / 뱅크샷 +2점)
          </h2>
          <p className="text-xs text-[#5C564E] leading-relaxed">
            내 수구 외의 나머지 공 2개(노란공, 빨간공)가 모두 표적구입니다. <strong>두 번째 적구에 맞기 전까지 최소 3번 이상 쿠션(레일)에 닿아야 1점</strong>을 득점합니다. 첫 충돌을 공이 아닌 쿠션부터 시작해 3쿠션 이상으로 성공하면 <strong>뱅크샷(Bank Shot, +2점)</strong>이 인정됩니다.
          </p>
        </div>
      </div>

      {/* 3. 당점(English) 및 파이브 앤 하프 시스템 공식 테이블 (AEO 크롤러 최적화) */}
      <div className="space-y-3">
        <h2 className="text-sm sm:text-base font-black text-[#2D2A26] flex items-center gap-1.5">
          <Disc className="w-4 h-4 text-amber-600" />
          <span>당점(회전)별 수구 분리각 & 파이브 앤 하프 핵심 기준표</span>
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-[#EBE6DD]">
          <table className="min-w-full divide-y divide-[#EBE6DD] text-xs">
            <thead className="bg-[#F7F4EE]">
              <tr>
                <th className="px-3.5 py-2.5 text-left font-black text-[#2D2A26]">기술 / 당점 명칭</th>
                <th className="px-3.5 py-2.5 text-left font-black text-[#2D2A26]">당점 다이얼 위치</th>
                <th className="px-3.5 py-2.5 text-left font-black text-[#2D2A26]">물리적 궤적 변화 및 실전 팁</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EDE4] bg-white">
              <tr>
                <td className="px-3.5 py-2.5 font-extrabold text-blue-700">밀어치기 (오시 / Follow)</td>
                <td className="px-3.5 py-2.5 font-semibold text-[#2D2A26]">상단 (12시 방향)</td>
                <td className="px-3.5 py-2.5 text-[#5C564E]">
                  제1적구 충돌 후 수구가 멈추지 않고 전방으로 포물선을 그리며 전진합니다.
                </td>
              </tr>
              <tr>
                <td className="px-3.5 py-2.5 font-extrabold text-rose-600">끌어치기 (히끼 / Draw)</td>
                <td className="px-3.5 py-2.5 font-semibold text-[#2D2A26]">하단 (6시 방향)</td>
                <td className="px-3.5 py-2.5 text-[#5C564E]">
                  강한 역회전으로 제1적구 타격 직후 수구가 뒤쪽으로 날카롭게 끌려옵니다.
                </td>
              </tr>
              <tr>
                <td className="px-3.5 py-2.5 font-extrabold text-emerald-700">제각돌리기 / 대회전</td>
                <td className="px-3.5 py-2.5 font-semibold text-[#2D2A26]">상단 좌·우 2~3팁</td>
                <td className="px-3.5 py-2.5 text-[#5C564E]">
                  쿠션에 닿을 때 정반사각보다 회전 방향으로 반사각이 넓어져 3쿠션 라인을 만듭니다.
                </td>
              </tr>
              <tr>
                <td className="px-3.5 py-2.5 font-extrabold text-indigo-700">파이브 앤 하프 시스템</td>
                <td className="px-3.5 py-2.5 font-semibold text-[#2D2A26]">상단 2팁 (중강 타격)</td>
                <td className="px-3.5 py-2.5 text-[#5C564E]">
                  <strong>[1쿠션 포인트 = 수구수 - 3쿠션수]</strong> 다이아몬드 포인트를 계산해 3쿠션 착지점을 적중시킵니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. 3단계 입문 조작 요약 */}
      <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#EBE6DD] space-y-2">
        <h3 className="text-xs font-black text-[#2D2A26] flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-indigo-600" />
          <span>3단계 조작 요약</span>
        </h3>
        <ol className="text-xs text-[#5C564E] space-y-1.5 list-decimal list-inside leading-relaxed">
          <li>
            <strong>조준선 설정</strong>: 당구대 화면을 직접 드래그하거나 <code>-2° ~ +2°</code> 미세각도 버튼으로 노란 고스트볼을 적구에 맞춥니다.
          </li>
          <li>
            <strong>당점 & 초크 점검</strong>: 좌측 당점 다이얼에서 회전점을 찍고, 초크 잔량이 35% 미만이면 <code>[초크]</code> 버튼을 눌러 미스큐를 예방합니다.
          </li>
          <li>
            <strong>파워 & 스트로크</strong>: 슬라이더로 힘을 맞춘 뒤 <code>[🎱 큐 스트로크 샷!]</code> 버튼을 누르면 물리 시뮬레이션이 실행됩니다.
          </li>
        </ol>
      </div>
    </section>
  );
};
