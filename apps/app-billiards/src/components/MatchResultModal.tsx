import React from 'react';
import { ArrowLeft, Copy, Flame, RotateCcw, Share2, Sparkles, Trophy } from 'lucide-react';
import { BilliardsRuleMode } from '../types/billiards';

interface MatchResultModalProps {
  ruleMode: BilliardsRuleMode;
  p1Score: number;
  p2Score: number;
  targetScore: number;
  inning: number;
  highRun: number;
  accuracyPct: number;
  averagePerInning: number;
  winner: 1 | 2 | null;
  isScoreSaved: boolean;
  onClose: () => void;
  onRestart: () => void;
  onCopyReport: () => void;
  onShare: () => void;
}

export const MatchResultModal: React.FC<MatchResultModalProps> = ({
  ruleMode,
  p1Score,
  p2Score,
  targetScore,
  inning,
  highRun,
  accuracyPct,
  averagePerInning,
  winner,
  isScoreSaved,
  onClose,
  onRestart,
  onCopyReport,
  onShare,
}) => {
  const unit = ruleMode === 'four-ball' ? '다마' : '점';
  // 종합 랭킹 포인트 산출 공식
  const compositePoints =
    (ruleMode === 'four-ball' ? p1Score * 15 : p1Score * 120) +
    highRun * 80 +
    accuracyPct * 5 +
    (winner === 1 ? 500 : 100);

  const gradeBadge =
    compositePoints >= 1200
      ? { label: '프로 마스터 (Pro 1단)', desc: '대대 3쿠션 클럽 최상위권 스트로크 정밀도' }
      : compositePoints >= 600
      ? { label: '클럽 고수 (250~300다마)', desc: '안정적인 분리각 제어와 연속 득점 능력 보유' }
      : { label: '유망 동호인 (120~150다마)', desc: '당점과 두께 조절을 익히며 빠르게 성장 중' };

  return (
    <div className="fixed inset-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
      <div
        data-screenshot-point="result"
        className="w-full max-w-[440px] bg-white rounded-3xl p-5 sm:p-6 border border-[#EBE6DD] shadow-xl flex flex-col justify-between space-y-4 my-auto"
      >
        {/* 1. 상단 헤더: 돌아가기 + 타이틀 + 결과 복사 */}
        <div className="flex items-center justify-between border-b border-[#F2EDE4] pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-[#F7F4EE] hover:bg-[#EBE6DD] text-[#2D2A26] flex items-center justify-center transition cursor-pointer"
              title="당구대로 돌아가기"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 block">
                CAROM MATCH REPORT
              </span>
              <h2 className="text-base font-black text-[#2D2A26]">
                {winner === 1
                  ? '🏆 경기 승리! 종합 스코어 리포트'
                  : winner === 2
                  ? '📊 경기 종료 · 종합 분석 리포트'
                  : '📊 실시간 당구 스코어 & 다마수 분석'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onCopyReport}
            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-extrabold rounded-xl border border-blue-200 transition flex items-center gap-1 cursor-pointer active:scale-95"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>결과 복사</span>
          </button>
        </div>

        {/* 2. 거대 히어로 메트릭 카드 (100% 라이트 그라데이션) */}
        <div className="bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-white rounded-2xl p-4 sm:p-5 border border-blue-200/80 text-center space-y-1.5 shadow-inner">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-blue-700 text-[11px] font-black border border-blue-200">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>{gradeBadge.label}</span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-blue-950 tracking-tight font-mono">
            {compositePoints.toLocaleString()}
            <span className="text-sm font-extrabold text-[#7A756D] ml-1">PTS</span>
          </div>
          <p className="text-[11px] text-[#5C564E] font-medium">
            내 득점 {p1Score}/{targetScore}
            {unit} vs 상대 {p2Score}
            {unit} • {gradeBadge.desc}
          </p>
          {isScoreSaved && (
            <p className="text-[10px] font-extrabold text-emerald-700">
              ✓ 명예의 전당 랭킹 및 베라 포인트가 자동 기록되었습니다
            </p>
          )}
        </div>

        {/* 3. 세부 항목 2분할 카드 */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-[#FAF8F5] rounded-xl p-3 border border-[#EBE6DD]">
            <span className="text-[10px] text-[#7A756D] font-bold block mb-0.5">
              이닝당 에버리지 (AVG)
            </span>
            <span className="text-sm font-black text-[#2D2A26] font-mono">
              {averagePerInning} ({inning}이닝)
            </span>
          </div>
          <div className="bg-[#FAF8F5] rounded-xl p-3 border border-[#EBE6DD]">
            <span className="text-[10px] text-[#7A756D] font-bold block mb-0.5">
              최고 하이런 / 성공률
            </span>
            <span className="text-sm font-black text-emerald-700 font-mono flex items-center justify-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              {highRun}연속 ({accuracyPct}%)
            </span>
          </div>
        </div>

        {/* 4. 다마수 등급 3단 비교 카드 */}
        <div className="space-y-1.5 pt-1 border-t border-[#F2EDE4]">
          <span className="text-[11px] font-extrabold text-[#2D2A26] block">
            공인 다마수 등급별 기준 비교
          </span>
          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
            <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EBE6DD]">
              <span className="text-[#7A756D] font-bold block">동호인 (150다마)</span>
              <span className="font-black text-[#2D2A26] mt-0.5 block">AVG 0.50</span>
            </div>
            <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
              <span className="text-amber-800 font-bold block">상급자 (300다마)</span>
              <span className="font-black text-amber-950 mt-0.5 block">AVG 0.85</span>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-300">
              <span className="text-emerald-800 font-black block">프로 (대대 1.2+) ✨</span>
              <span className="font-black text-emerald-950 mt-0.5 block">3쿠션 마스터</span>
            </div>
          </div>
        </div>

        {/* 5. 맞춤형 스트로크 코칭 인사이트 팁 박스 */}
        <div className="bg-gradient-to-br from-emerald-50/70 to-white rounded-2xl p-3.5 border border-emerald-200/80 text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-900 font-extrabold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI 당구 코치의 맞춤 조언</span>
          </div>
          <p className="text-[#5C564E] text-[11px] leading-relaxed">
            {ruleMode === 'four-ball'
              ? '4구에서는 제1적구를 1/3 두께로 맞히고 상단 1팁 밀어치기를 활용하면 두 빨간 공이 중앙으로 모이는 빅볼(세리) 포지션을 쉽게 만들 수 있습니다.'
              : '3구(3쿠션)에서는 쿠션에 먼저 맞히는 뱅크샷(Bank Shot) 성공 시 2점이 부여됩니다. 좌·우 당점 2팁으로 반사각을 넓혀 보세요.'}
          </p>
        </div>

        {/* 6. 하단 밀착형 액션 버튼 독 */}
        <div className="pt-1 flex gap-2">
          <button
            type="button"
            onClick={onRestart}
            className="flex-1 py-3 bg-[#F7F4EE] hover:bg-[#EBE6DD] border border-[#E0D9CD] text-[#2D2A26] text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>새 경기 시작</span>
          </button>
          <button
            type="button"
            onClick={onShare}
            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>스코어 공유하기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
