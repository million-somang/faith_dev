import React from 'react';
import { Award, Compass, History, Sliders, Target, Users } from 'lucide-react';
import {
  BilliardsRuleMode,
  InningRecord,
  MatchType,
  SpinOffset,
} from '../types/billiards';

interface DesktopDashboardProps {
  ruleMode: BilliardsRuleMode;
  matchType: MatchType;
  targetScore: number;
  requireThreeCushionFinish: boolean;
  inning: number;
  highRun: number;
  currentRun: number;
  accuracyPct: number;
  averagePerInning: number;
  spin: SpinOffset;
  inningHistory: InningRecord[];
  onChangeMatchType: (mt: MatchType) => void;
  onChangeTargetScore: (ts: number) => void;
  onToggleThreeCushionFinish: () => void;
}

export const DesktopDashboard: React.FC<DesktopDashboardProps> = ({
  ruleMode,
  matchType,
  targetScore,
  requireThreeCushionFinish,
  highRun,
  currentRun,
  accuracyPct,
  averagePerInning,
  spin,
  inningHistory,
  onChangeMatchType,
  onChangeTargetScore,
  onToggleThreeCushionFinish,
}) => {
  const scoreOptions =
    ruleMode === 'four-ball' ? [30, 50, 100, 150, 200] : [3, 5, 10, 15, 20];
  const unit = ruleMode === 'four-ball' ? '다마' : '점';

  return (
    <div className="space-y-2.5">
      {/* 1. 고정 높이 2열(Grid) 이닝 히스토리 패널 (모바일 + 데스크톱 공통 노출, 동적 세로 팽창 제로) */}
      <div className="bg-white rounded-2xl p-2.5 border border-[#EBE6DD] shadow-2xs">
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="text-[11px] font-black text-[#2D2A26] flex items-center gap-1">
            <History className="w-3.5 h-3.5 text-indigo-600" />
            <span>실시간 이닝 기록 (2열 고정뷰)</span>
          </h2>
          <span className="text-[10px] font-bold text-[#8A847A]">
            에버리지 {averagePerInning} · 정확도 {accuracyPct}%
          </span>
        </div>

        <div className="h-[76px] overflow-y-auto custom-scrollbar pr-0.5">
          {inningHistory.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[11px] text-[#8A847A] bg-[#FAF8F5] rounded-xl border border-dashed border-[#E0D9CD]">
              첫 스트로크를 발사하면 이닝별 득점·쿠션 기록이 여기에 표시됩니다.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {inningHistory.map((item) => (
                <div
                  key={item.id}
                  className={`px-2 py-1 rounded-lg border text-[10px] flex items-center justify-between ${
                    item.isScore
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : item.isFoul
                      ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                      : 'bg-[#FAF8F5] border-[#EBE6DD] text-[#7A756D]'
                  }`}
                >
                  <div className="truncate pr-1">
                    <span className="font-black mr-1">{item.inning}회</span>
                    <span>{item.resultText}</span>
                  </div>
                  <span className="font-mono font-black shrink-0">
                    {item.pointsDelta > 0
                      ? `+${item.pointsDelta}`
                      : item.pointsDelta < 0
                      ? item.pointsDelta
                      : '0'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. 태블릿/PC 자동 반응형 확장 대시보드 (`hidden md:flex`) */}
      <div className="hidden md:flex flex-col space-y-3">
        {/* 경기 모드 & 목표 다마수 설정 카드 */}
        <div className="bg-white rounded-2xl p-4 border border-[#EBE6DD] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-[#2D2A26] flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>경기 방식 & 목표 다마수 설정</span>
            </h3>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              실시간 적용
            </span>
          </div>

          {/* 대전 모드 선택 */}
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { id: 'ai', label: '🤖 AI 1:1 대결' },
                { id: 'practice', label: '🎯 단독 하이런 연습' },
                { id: 'local-2p', label: '👥 2인 교대 대결' },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onChangeMatchType(m.id)}
                className={`py-2 px-2 rounded-xl text-[11px] font-extrabold border transition cursor-pointer ${
                  matchType === m.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-[#FAF8F5] text-[#7A756D] border-[#EBE6DD] hover:text-[#2D2A26]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* 목표 점수 칩 */}
          <div>
            <div className="text-[11px] font-bold text-[#7A756D] mb-1.5">
              목표 점수 ({ruleMode === 'four-ball' ? '4구 다마수' : '3구 점수'})
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {scoreOptions.map((sc) => (
                <button
                  key={sc}
                  type="button"
                  onClick={() => onChangeTargetScore(sc)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black border transition cursor-pointer ${
                    targetScore === sc
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-800'
                      : 'bg-[#FAF8F5] border-[#EBE6DD] text-[#7A756D] hover:text-[#2D2A26]'
                  }`}
                >
                  {sc}
                  {unit}
                </button>
              ))}
            </div>
          </div>

          {ruleMode === 'four-ball' && (
            <label className="flex items-center justify-between pt-2 border-t border-[#F2EDE4] text-xs font-bold text-[#2D2A26] cursor-pointer">
              <span>마지막 10점 정통 3쿠션 마무리 필수</span>
              <input
                type="checkbox"
                checked={requireThreeCushionFinish}
                onChange={onToggleThreeCushionFinish}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </label>
          )}
        </div>

        {/* 실시간 선수 애널리틱스 4분할 카드 */}
        <div className="bg-white rounded-2xl p-4 border border-[#EBE6DD] shadow-2xs space-y-2.5">
          <h3 className="text-xs font-black text-[#2D2A26] flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>플레이어 실시간 분석 지표</span>
          </h3>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EBE6DD]">
              <span className="text-[10px] font-bold text-[#7A756D] block">이닝 에버리지</span>
              <span className="text-sm font-black font-mono text-blue-700 mt-0.5 block">
                {averagePerInning}
              </span>
            </div>
            <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EBE6DD]">
              <span className="text-[10px] font-bold text-[#7A756D] block">최고 하이런</span>
              <span className="text-sm font-black font-mono text-amber-600 mt-0.5 block">
                {highRun}연속
              </span>
            </div>
            <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EBE6DD]">
              <span className="text-[10px] font-bold text-[#7A756D] block">현재 연속득점</span>
              <span className="text-sm font-black font-mono text-emerald-600 mt-0.5 block">
                {currentRun}회
              </span>
            </div>
            <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EBE6DD]">
              <span className="text-[10px] font-bold text-[#7A756D] block">샷 성공률</span>
              <span className="text-sm font-black font-mono text-indigo-600 mt-0.5 block">
                {accuracyPct}%
              </span>
            </div>
          </div>
        </div>

        {/* 당점 & 분리각 물리 코칭 카드 */}
        <div className="bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 rounded-2xl p-4 border border-blue-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-blue-950 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>실시간 당점 물리 가이드</span>
            </h3>
            <span className="text-[10px] font-mono font-bold text-blue-700">
              X:{spin.x.toFixed(1)} / Y:{spin.y.toFixed(1)}
            </span>
          </div>
          <p className="text-[11px] text-[#5C564E] leading-relaxed">
            • <strong>밀어치기(Y &gt; 0)</strong>: 제1적구 타격 후 수구가 전진 방향으로 휘어 나아갑니다.<br />
            • <strong>끌어치기(Y &lt; 0)</strong>: 충돌 직후 역회전이 걸려 수구가 뒤로 끌려옵니다.<br />
            • <strong>좌·우 회전(X)</strong>: 쿠션 충돌 시 정반사보다 회전 방향으로 각도가 깊어집니다.
          </p>
          <div className="pt-1.5 border-t border-blue-100 flex items-center justify-between text-[10px] text-blue-800 font-bold">
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" /> 파이브앤하프: 1쿠션 = 수구수 - 3쿠션수
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> 공인 캐럼 물리
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
