import { useRef, type ChangeEvent } from 'react';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { CATEGORY_MAP, PRIORITY_MAP } from '../constants/todoMeta';
import type { TodoStatsReport } from '../types/todo';
import { roundPercent } from '../utils/todoAnalytics';
import BannerSlot from './BannerSlot';

interface TodoReportPanelProps {
  readonly stats: TodoStatsReport;
  readonly isAuthenticated: boolean;
  readonly onCopyReport: () => void;
  readonly onDownloadMarkdown: () => void;
  readonly onDownloadText: () => void;
  readonly onDownloadBackupJson: () => void;
  readonly onImportBackupJson: (raw: string) => void;
}

const DONUT_RADIUS = 40;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

export default function TodoReportPanel({
  stats,
  isAuthenticated,
  onCopyReport,
  onDownloadMarkdown,
  onDownloadText,
  onDownloadBackupJson,
  onImportBackupJson,
}: TodoReportPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dashOffset =
    DONUT_CIRCUMFERENCE - (DONUT_CIRCUMFERENCE * stats.todayCompletionRate) / 100;

  const motivationalMessage =
    stats.todayTotalCount === 0
      ? stats.upcomingCount > 0
        ? `오늘 예정된 할 일은 없고, 내일 이후 예정 ${stats.upcomingCount}건이 등록되어 있습니다.`
        : '오늘 할 일이나 반복 루틴을 등록하면 오늘의 달성률 리포트가 실시간으로 생성됩니다.'
      : stats.todayCompletionRate === 100
        ? '오늘 계획한 모든 할 일을 완벽하게 마무리했습니다!'
        : stats.overdueCount > 0
          ? `마감이 지난 할 일 ${stats.overdueCount}건이 전체 목록에 있습니다.`
          : stats.todayCompletionRate >= 60
            ? '오늘 목표의 절반 이상 달성했습니다. 마지막 스퍼트까지 힘내세요!'
            : '가장 중요한 긴급·반복 루틴부터 하나씩 완료해 보세요.';

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImportBackupJson(reader.result);
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  return (
    <section
      data-screenshot-point="result"
      aria-label="오늘의 투두 생산성 리포트 및 집중 타이머"
      className="flex flex-col gap-2.5 animate-fade-in"
    >
      {/* 1. Astryx 메인 달성률 히어로 Card */}
      <Card padding={3} elevation="low" className="rounded-3xl bg-white border-[#E5DDD0] space-y-3">
        <div className="flex items-center justify-between gap-2 pb-1">
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 block">
              ASTRYX PRODUCTIVITY REPORT
            </span>
            <h2 className="text-sm sm:text-base font-black text-[#24211D] leading-tight">
              오늘의 할일 달성 리포트
            </h2>
          </div>

          <Button
            label="리포트 복사"
            variant="secondary"
            size="sm"
            onClick={onCopyReport}
            icon={<i className="fas fa-copy text-[10px] text-indigo-600"></i>}
          />
        </div>

        <Divider variant="subtle" />

        {/* SVG 도넛 게이지 + 4종 KPI */}
        <div className="bg-[#FAF8F5] rounded-2xl p-3 border border-[#E5DDD0] flex items-center gap-3.5">
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90" aria-hidden="true">
              <circle
                cx="50"
                cy="50"
                r={DONUT_RADIUS}
                fill="none"
                stroke="#E5DDD0"
                strokeWidth="9"
              />
              <circle
                cx="50"
                cy="50"
                r={DONUT_RADIUS}
                fill="none"
                stroke={stats.todayCompletionRate === 100 && stats.todayTotalCount > 0 ? '#047857' : '#4338CA'}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={DONUT_CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-[#24211D] tabular-nums leading-none">
                {stats.todayCompletionRate}%
              </span>
              <span className="text-[9px] font-bold text-[#6C655B] mt-0.5">
                오늘 {stats.todayCompletedCount}/{stats.todayTotalCount}건
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-xs font-extrabold text-[#24211D] leading-snug">
              {motivationalMessage}
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-center">
              <div className="bg-white rounded-xl py-1.5 px-2 border border-[#E5DDD0]">
                <span className="text-[9px] font-bold text-[#6C655B] block">반복 루틴</span>
                <span className="text-xs font-black text-indigo-700 tabular-nums">
                  🔁 {stats.recurringCount}건
                </span>
              </div>
              <div className="bg-white rounded-xl py-1.5 px-2 border border-[#E5DDD0]">
                <span className="text-[9px] font-bold text-[#6C655B] block">최고 스트릭</span>
                <span className="text-xs font-black text-emerald-700 tabular-nums">
                  🔥 {stats.maxStreak}연속
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 우선순위별 Astryx ProgressBar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-black text-[#24211D]">
            <span>우선순위별 현황</span>
            <span className="text-[10px] font-bold text-[#6C655B]">완료 / 전체</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {stats.byPriority.map((row) => {
              const meta = PRIORITY_MAP[row.priority];
              const pct = roundPercent(row.completed, row.total);
              return (
                <div
                  key={row.priority}
                  className="bg-[#FAF8F5] rounded-xl p-2 border border-[#E5DDD0] space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-black text-[#24211D]">{meta.shortLabel}</span>
                    <span className="font-mono font-bold text-[#6C655B]">
                      {row.completed}/{row.total}
                    </span>
                  </div>
                  <ProgressBar
                    value={pct}
                    max={100}
                    label={`${meta.shortLabel} 진행률`}
                    isLabelHidden
                    variant={
                      row.priority === 'urgent'
                        ? 'error'
                        : row.priority === 'important'
                          ? 'warning'
                          : 'accent'
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* 카테고리별 요약 Badge */}
        <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-[#EAE3D7]">
          {stats.byCategory.map((row) => {
            const cat = CATEGORY_MAP[row.category];
            return (
              <Badge
                key={row.category}
                variant={cat.badgeVariant}
                icon={<i className={`${cat.iconClass} text-[9px]`}></i>}
                label={`${cat.label} ${row.completed}/${row.total}`}
              />
            );
          })}
        </div>
      </Card>

      {/* 2. 마크다운 · 텍스트 · JSON 백업/복원 */}
      <Card padding={2} className="rounded-2xl bg-white border-[#E5DDD0] space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-black text-[#24211D]">
          <span>내보내기 &amp; {isAuthenticated ? 'DB 백업' : '로컬 백업'}</span>
          <span className="text-[9px] font-bold text-emerald-700 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            {isAuthenticated ? 'SQLite DB 실시간 동기화' : '마이페이지 실시간 연동'}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={onDownloadMarkdown}
            className="py-2 px-1.5 rounded-xl bg-[#FAF8F5] hover:bg-indigo-50 border border-[#E5DDD0] hover:border-indigo-200 text-[10px] font-black text-[#24211D] flex flex-col items-center gap-1 cursor-pointer transition-colors"
          >
            <i className="fas fa-file-code text-indigo-600 text-xs"></i>
            <span>.md 저장</span>
          </button>
          <button
            type="button"
            onClick={onDownloadText}
            className="py-2 px-1.5 rounded-xl bg-[#FAF8F5] hover:bg-indigo-50 border border-[#E5DDD0] hover:border-indigo-200 text-[10px] font-black text-[#24211D] flex flex-col items-center gap-1 cursor-pointer transition-colors"
          >
            <i className="fas fa-file-lines text-emerald-700 text-xs"></i>
            <span>.txt 저장</span>
          </button>
          <button
            type="button"
            onClick={onDownloadBackupJson}
            className="py-2 px-1.5 rounded-xl bg-[#FAF8F5] hover:bg-indigo-50 border border-[#E5DDD0] hover:border-indigo-200 text-[10px] font-black text-[#24211D] flex flex-col items-center gap-1 cursor-pointer transition-colors"
          >
            <i className="fas fa-download text-amber-600 text-xs"></i>
            <span>JSON 백업</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="py-2 px-1.5 rounded-xl bg-[#FAF8F5] hover:bg-indigo-50 border border-[#E5DDD0] hover:border-indigo-200 text-[10px] font-black text-[#24211D] flex flex-col items-center gap-1 cursor-pointer transition-colors"
          >
            <i className="fas fa-upload text-sky-600 text-xs"></i>
            <span>JSON 복원</span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          aria-label="JSON 백업 파일 선택"
          className="hidden"
        />
      </Card>

      {/* 4. Zero-CLS 애드센스/스폰서 슬롯 */}
      <BannerSlot slotKey="todo-report-bottom-ad" label="SPONSORED AD" />
    </section>
  );
}
