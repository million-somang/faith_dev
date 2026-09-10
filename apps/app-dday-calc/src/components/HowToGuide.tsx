import React from 'react';

export default function HowToGuide() {
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs text-slate-700 space-y-5 text-xs leading-relaxed animate-fade-in">
      <div>
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-1.5">
          <i className="fas fa-book-open text-pink-600"></i>
          <span>D-Day 및 기념일 계산 공식 & 완벽 가이드</span>
        </h3>
        <p className="text-slate-500 text-[11px]">
          시험, 여행, 전역, 커플 기념일 등 목적에 따른 정확한 일수 계산 방식과 만 나이 통일법과의 관계를 명확히 정리해 드립니다.
        </p>
      </div>

      <div className="space-y-3.5">
        {/* 1. 카운트다운 모드 */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
          <h4 className="font-extrabold text-pink-900 text-xs flex items-center gap-1.5">
            <i className="fas fa-hourglass-half text-pink-600"></i> 1. 카운트다운(Countdown) 모드 — 목표일까지 남은 날짜
          </h4>
          <p className="text-slate-600 text-[11px]">
            • <strong>기본 원리</strong>: 오늘 자정(00:00)을 기준으로 목표일 자정까지 남은 순수 일수를 역산합니다.<br />
            • <strong>당일 표기</strong>: 목표일 당일은 <strong>D-Day</strong>로 표기되며, 하루 전은 <strong>D-1</strong>, 지난 후에는 <strong>D+N</strong>으로 표시됩니다.<br />
            • <strong>주요 추천</strong>: 수능, 공무원 시험, 자격증, 해외여행, 군대 전역일, 결혼식 등
          </p>
        </div>

        {/* 2. 기념일 모드 */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
          <h4 className="font-extrabold text-purple-900 text-xs flex items-center gap-1.5">
            <i className="fas fa-heart text-purple-600"></i> 2. 기념일(Countup) 모드 — 기준일부터 흐른 날짜
          </h4>
          <p className="text-slate-600 text-[11px]">
            • <strong>기준일 1일 포함 옵션(isAnniversary)</strong>: 사귀기 시작한 날이나 결혼식 당일을 1일째로 포함하는 한국 전통 연인 문화에 맞춰 정확히 +1일을 가산합니다.<br />
            • <strong>기준일 미포함</strong>: 아기 생후 일수 등 양력 날짜 경과일 계산 시 당일을 0일(생후)로 정확하게 적산합니다.
          </p>
        </div>

        {/* 3. AEO / GEO 지식 테이블 */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
          <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
            <i className="fas fa-table text-indigo-600"></i> 목표 유형별 최적 연산 모드 표준 가이드
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-2 font-bold">목표 유형</th>
                  <th className="py-2 px-2 font-bold">권장 모드</th>
                  <th className="py-2 px-2 font-bold">당일 표기</th>
                  <th className="py-2 pl-2 font-bold">특징 및 효과</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-2 pr-2 font-bold text-pink-700">시험 / 전역 / 여행</td>
                  <td className="py-2 px-2">Countdown</td>
                  <td className="py-2 px-2 font-bold">D-Day</td>
                  <td className="py-2 pl-2 text-slate-500">목표 달성까지의 긴장감 및 집중력 고취</td>
                </tr>
                <tr>
                  <td className="py-2 pr-2 font-bold text-rose-700">연인 / 커플 교제</td>
                  <td className="py-2 px-2">Countup (1일포함)</td>
                  <td className="py-2 px-2 font-bold">1일째</td>
                  <td className="py-2 pl-2 text-slate-500">100일, 1주년, 1000일 기념일 자동 감지</td>
                </tr>
                <tr>
                  <td className="py-2 pr-2 font-bold text-blue-700">출생일 / 아기 생후</td>
                  <td className="py-2 px-2">Countup (0일기준)</td>
                  <td className="py-2 px-2 font-bold">생후 0일</td>
                  <td className="py-2 pl-2 text-slate-500">만 나이 및 소아 건강검진 일정 동기화</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. 만 나이 통일법 관계 */}
        <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200/80 text-[11px] text-blue-900 leading-relaxed">
          <p className="font-extrabold mb-1">💡 만 나이 통일법과 D-Day 계산의 관계</p>
          <p className="text-blue-800">
            대한민국 '만 나이 통일법'은 행정·법률적 공문서 및 규정 연령 산정에만 국한됩니다. 교제 일수나 첫 돌, 백일 잔치 등 개인의 사적 기념일 적산 관습에는 일체 간섭하지 않으므로 안심하고 기존 관습대로 계산하시면 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
