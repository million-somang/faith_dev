import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { CATEGORY_MAP, PRIORITY_MAP } from '../constants/todoMeta';
import type {
  ReportPeriod,
  TodoCompletionLog,
  TodoItem,
  TodoStatsReport,
} from '../types/todo';
import { getLocalDateString, roundPercent } from '../utils/todoAnalytics';
import { buildTodoReportInsights } from '../utils/todoReportInsights';
import BannerSlot from './BannerSlot';

interface TodoReportPanelProps {
  readonly stats: TodoStatsReport;
  readonly activeItems: readonly TodoItem[];
  readonly completionLogs: readonly TodoCompletionLog[];
  readonly pomodoroSessions: number;
  readonly isAuthenticated: boolean;
  readonly onCopyReport: () => void;
  readonly onDownloadMarkdown: () => void;
  readonly onDownloadText: () => void;
  readonly onDownloadBackupJson: () => void;
  readonly onImportBackupJson: (raw: string) => void;
}

const DONUT_RADIUS = 40;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

const PERIOD_TABS: ReadonlyArray<{
  readonly key: ReportPeriod;
  readonly label: string;
  readonly iconClass: string;
}> = [
  { key: 'today', label: '오늘', iconClass: 'fas fa-sun' },
  { key: 'week', label: '주간', iconClass: 'fas fa-calendar-week' },
  { key: 'month', label: '월간', iconClass: 'fas fa-calendar-days' },
  { key: 'all', label: '누적', iconClass: 'fas fa-infinity' },
];

const CALENDAR_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

export default function TodoReportPanel({
  stats,
  activeItems,
  completionLogs,
  pomodoroSessions,
  isAuthenticated,
  onCopyReport,
  onDownloadMarkdown,
  onDownloadText,
  onDownloadBackupJson,
  onImportBackupJson,
}: TodoReportPanelProps) {
  const [period, setPeriod] = useState<ReportPeriod>('today');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const todayStr = getLocalDateString();
  const insights = useMemo(
    () =>
      buildTodoReportInsights({
        activeItems,
        completionLogs,
        stats,
        pomodoroSessions,
        todayStr,
      }),
    [activeItems, completionLogs, pomodoroSessions, stats, todayStr]
  );

  const activeGrade = insights.gradeByPeriod[period];
  const dayOfMonth = Number(todayStr.slice(8, 10)) || 1;

  const gaugeMetric = (() => {
    switch (period) {
      case 'week': {
        const pct = roundPercent(insights.weekActiveDays, 7);
        return {
          percent: pct,
          subLabel: `출석 ${insights.weekActiveDays}/7일`,
          accentColor: pct >= 70 ? '#10B981' : '#6366F1',
        };
      }
      case 'month': {
        const pct = roundPercent(insights.monthActiveDays, Math.max(1, dayOfMonth));
        return {
          percent: pct,
          subLabel: `활동 ${insights.monthActiveDays}일`,
          accentColor: pct >= 70 ? '#10B981' : '#6366F1',
        };
      }
      case 'all': {
        const pct = stats.completionRate;
        return {
          percent: pct,
          subLabel: `누적 ${insights.allTotalCompletions}회`,
          accentColor: pct >= 80 ? '#10B981' : '#6366F1',
        };
      }
      case 'today':
      default: {
        const pct = stats.todayCompletionRate;
        return {
          percent: pct,
          subLabel: `오늘 ${stats.todayCompletedCount}/${stats.todayTotalCount}건`,
          accentColor: pct === 100 && stats.todayTotalCount > 0 ? '#10B981' : '#6366F1',
        };
      }
    }
  })();

  const dashOffset =
    DONUT_CIRCUMFERENCE - (DONUT_CIRCUMFERENCE * gaugeMetric.percent) / 100;

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

  const maxWeekBarCount = Math.max(1, ...insights.weekBars.map((b) => b.count));
  const maxMonthWeekCount = Math.max(1, ...insights.monthWeekBars.map((b) => b.count));

  return (
    <section
      data-screenshot-point="result"
      data-report-active-period={period}
      aria-label="스마트 투두 상세 생산성 리포트"
      className="flex flex-col gap-2.5 animate-fade-in"
    >
      {/* 1. 4단 기간 선택 바 (오늘 기본 · 주간 · 월간 · 누적) */}
      <div
        role="tablist"
        aria-label="리포트 집계 기간 선택"
        className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-[#E6ECF3] border border-white/70 shadow-[inset_2px_2px_5px_rgba(163,177,198,0.42),inset_-2px_-2px_5px_rgba(255,255,255,0.85)]"
      >
        {PERIOD_TABS.map((tab) => {
          const active = period === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              data-report-period={tab.key}
              onClick={() => setPeriod(tab.key)}
              className={`h-9 rounded-xl text-xs font-black inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                active
                  ? 'bg-white text-[#1E293B] shadow-[3px_3px_8px_rgba(163,177,198,0.42),-3px_-3px_8px_rgba(255,255,255,0.95)]'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              <i
                className={`${tab.iconClass} text-[10px] ${
                  active ? 'text-[#6366F1]' : 'text-[#94A3B8]'
                }`}
              ></i>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. 실행 등급 & 칭호 + 핵심 KPI 히어로 카드 */}
      <Card
        padding={3}
        elevation="low"
        className="rounded-3xl bg-[#F0F4F8] border-white/80 shadow-[6px_6px_14px_rgba(163,177,198,0.42),-6px_-6px_14px_rgba(255,255,255,0.92)] space-y-3"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              data-report-grade={activeGrade.grade}
              className={`px-2.5 py-1 rounded-xl text-xs font-black tracking-tight shrink-0 ${activeGrade.badgeClass}`}
            >
              {activeGrade.grade}
            </span>
            <div className="min-w-0">
              <span className="text-[9px] font-black uppercase tracking-wider text-[#6366F1] block">
                {period === 'today'
                  ? 'TODAY PRODUCTIVITY'
                  : period === 'week'
                    ? 'WEEKLY 7-DAY REPORT'
                    : period === 'month'
                      ? 'MONTHLY HEATMAP REPORT'
                      : 'ALL-TIME ARCHIVE REPORT'}
              </span>
              <h2 className="text-sm sm:text-base font-black text-[#1E293B] leading-tight truncate">
                {activeGrade.title}
              </h2>
            </div>
          </div>

          <Button
            label="리포트 복사"
            variant="secondary"
            size="sm"
            onClick={onCopyReport}
            icon={<i className="fas fa-copy text-[10px] text-[#6366F1]"></i>}
          />
        </div>

        <Divider variant="subtle" />

        <div className="bg-white rounded-2xl p-3 border border-white/90 shadow-[inset_3px_3px_7px_rgba(163,177,198,0.22),inset_-3px_-3px_7px_rgba(255,255,255,0.85)] flex items-center gap-3.5">
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90" aria-hidden="true">
              <circle
                cx="50"
                cy="50"
                r={DONUT_RADIUS}
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="9"
              />
              <circle
                cx="50"
                cy="50"
                r={DONUT_RADIUS}
                fill="none"
                stroke={gaugeMetric.accentColor}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={DONUT_CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-[#1E293B] tabular-nums leading-none">
                {gaugeMetric.percent}%
              </span>
              <span className="text-[9px] font-bold text-[#64748B] mt-0.5 text-center">
                {gaugeMetric.subLabel}
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-xs font-extrabold text-[#1E293B] leading-snug">
              {activeGrade.comment}
            </p>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="bg-[#F8FAFC] rounded-xl py-1.5 px-1.5 border border-slate-200/70">
                <span className="text-[9px] font-bold text-[#64748B] block">
                  {period === 'today'
                    ? '오늘 완료'
                    : period === 'week'
                      ? '주간 완료'
                      : period === 'month'
                        ? '월간 완료'
                        : '누적 완료'}
                </span>
                <span className="text-xs font-black text-[#6366F1] tabular-nums">
                  {period === 'today'
                    ? `${stats.todayCompletedCount}건`
                    : period === 'week'
                      ? `${insights.weekTotalCompleted}건`
                      : period === 'month'
                        ? `${insights.monthTotalCompleted}건`
                        : `${insights.allTotalCompletions}회`}
                </span>
              </div>
              <div className="bg-[#F8FAFC] rounded-xl py-1.5 px-1.5 border border-slate-200/70">
                <span className="text-[9px] font-bold text-[#64748B] block">최고 스트릭</span>
                <span className="text-xs font-black text-[#10B981] tabular-nums">
                  🔥 {insights.allMaxStreak}연속
                </span>
              </div>
              <div className="bg-[#F8FAFC] rounded-xl py-1.5 px-1.5 border border-slate-200/70">
                <span className="text-[9px] font-bold text-[#64748B] block">집중 세션</span>
                <span className="text-xs font-black text-[#1E293B] tabular-nums">
                  ⏱ {insights.allPomodoroSessions}회
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. 기간별 상세 분석 & 시각화 카드 */}
      {period === 'today' && (
        <Card
          padding={3}
          elevation="low"
          className="rounded-3xl bg-white border-[#E5DDD0] space-y-3"
        >
          {/* 오늘 시간대별 완료 리듬 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-black text-[#1E293B]">
              <span>오늘 시간대별 완료 리듬</span>
              <span className="text-[10px] font-bold text-[#64748B]">
                기록 {insights.todayLoggedCount}건
              </span>
            </div>

            {insights.todayLoggedCount > 0 ? (
              <div className="grid grid-cols-3 gap-1.5">
                {insights.todayTimeSlots.map((slot) => (
                  <div
                    key={slot.key}
                    className="bg-[#F8FAFC] rounded-xl p-2 border border-slate-200/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-black text-[#1E293B]">
                        {slot.label}{' '}
                        <span className="font-semibold text-[#94A3B8]">{slot.rangeLabel}</span>
                      </span>
                      <span className="font-mono font-black text-[#6366F1] tabular-nums">
                        {slot.count}건
                      </span>
                    </div>
                    <svg
                      viewBox="0 0 100 6"
                      preserveAspectRatio="none"
                      className="w-full h-1.5 rounded-full overflow-hidden block"
                      aria-hidden="true"
                    >
                      <rect x="0" y="0" width="100" height="6" rx="3" fill="#E2E8F0" />
                      <rect
                        x="0"
                        y="0"
                        width={slot.percent}
                        height="6"
                        rx="3"
                        fill={slot.count > 0 ? '#6366F1' : '#E2E8F0'}
                      />
                    </svg>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-[#FAF8F5] border border-[#E5DDD0] px-3 py-2.5 text-[11px] font-semibold text-[#64748B] text-center">
                오늘 완료된 할 일이 아직 없습니다. 할 일을 체크하면 오전·오후·저녁 집중 리듬이 표시됩니다.
              </div>
            )}
          </div>

          <Divider variant="subtle" />

          {/* 우선순위별 현황 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-black text-[#1E293B]">
              <span>우선순위별 현황</span>
              <span className="text-[10px] font-bold text-[#64748B]">완료 / 전체</span>
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
      )}

      {period === 'week' && (
        <Card
          padding={3}
          elevation="low"
          className="rounded-3xl bg-white border-[#E5DDD0] space-y-3"
          data-report-panel="week"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-black text-[#1E293B]">최근 7일 요일별 완료 추이</h3>
              <p className="text-[10px] font-semibold text-[#64748B]">
                일 평균 <strong className="text-[#6366F1] tabular-nums">{insights.weekDailyAvg}건</strong> ·{' '}
                {insights.weekBestDay
                  ? `최고 요일: ${insights.weekBestDay.label} (${insights.weekBestDay.count}건)`
                  : '아직 최고 요일 기록이 없습니다'}
              </p>
            </div>
            <span className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-black tabular-nums">
              {insights.weekActiveDays}/7일 출석
            </span>
          </div>

          <div className="bg-[#F8FAFC] rounded-2xl p-3 border border-slate-200/80">
            <svg viewBox="0 0 280 98" className="w-full h-28 overflow-visible" aria-label="주간 완료 추이 차트">
              {insights.weekBars.map((bar, idx) => {
                const colX = idx * 40 + 10;
                const maxBarHeight = 56;
                const barHeight =
                  bar.count > 0 ? Math.max(8, Math.round((bar.count / maxWeekBarCount) * maxBarHeight)) : 4;
                const barY = 72 - barHeight;
                const fill =
                  bar.count === 0
                    ? '#E2E8F0'
                    : bar.isToday
                      ? '#10B981'
                      : '#6366F1';
                return (
                  <g key={bar.dateStr}>
                    <text
                      x={colX + 10}
                      y={barY - 5}
                      textAnchor="middle"
                      className="fill-[#475569] text-[9px] font-bold"
                    >
                      {bar.count > 0 ? bar.count : ''}
                    </text>
                    <rect
                      x={colX}
                      y={barY}
                      width="20"
                      height={barHeight}
                      rx="6"
                      fill={fill}
                    />
                    <text
                      x={colX + 10}
                      y="90"
                      textAnchor="middle"
                      className={`text-[9.5px] font-extrabold ${
                        bar.isToday ? 'fill-[#047857]' : 'fill-[#64748B]'
                      }`}
                    >
                      {bar.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {insights.weekTotalCompleted === 0 && (
              <p className="text-[11px] font-semibold text-[#64748B] text-center mt-1">
                최근 7일 동안 완료된 기록이 아직 없습니다. 오늘 첫 항목을 완료해 그래프를 깨워보세요!
              </p>
            )}
          </div>
        </Card>
      )}

      {period === 'month' && (
        <Card
          padding={3}
          elevation="low"
          className="rounded-3xl bg-white border-[#E5DDD0] space-y-3"
          data-report-panel="month"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-black text-[#1E293B]">{insights.monthLabel} 실행 잔디 달력</h3>
              <p className="text-[10px] font-semibold text-[#64748B]">
                월간 총 <strong className="text-[#6366F1] tabular-nums">{insights.monthTotalCompleted}건</strong> · 일 최대{' '}
                <strong className="text-[#10B981] tabular-nums">{insights.monthMaxDaily}건</strong>
              </p>
            </div>
            <div className="flex items-center gap-1 text-[9px] font-bold text-[#64748B]">
              <span>적음</span>
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-100 border border-slate-200"></span>
              <span className="w-2.5 h-2.5 rounded-xs bg-indigo-200"></span>
              <span className="w-2.5 h-2.5 rounded-xs bg-indigo-400"></span>
              <span className="w-2.5 h-2.5 rounded-xs bg-[#6366F1]"></span>
              <span>많음</span>
            </div>
          </div>

          {/* 7열 잔디 달력 히트맵 */}
          <div className="bg-[#F8FAFC] rounded-2xl p-2.5 border border-slate-200/80 space-y-1.5">
            <div className="grid grid-cols-7 gap-1 text-center text-[9.5px] font-extrabold text-[#64748B]">
              {CALENDAR_WEEKDAYS.map((wd) => (
                <span key={wd}>{wd}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {insights.monthCells.map((cell, idx) => {
                if (!cell.day || !cell.dateStr) {
                  return <div key={`empty-${idx}`} className="h-7 rounded-lg" aria-hidden="true" />;
                }
                const levelClass =
                  cell.level === 3
                    ? 'bg-[#6366F1] text-white font-black'
                    : cell.level === 2
                      ? 'bg-indigo-300 text-indigo-950 font-black'
                      : cell.level === 1
                        ? 'bg-indigo-100 text-indigo-800 font-bold'
                        : 'bg-white text-[#94A3B8] border border-slate-200/70 font-semibold';
                const todayRing = cell.isToday ? 'ring-2 ring-emerald-500 ring-offset-1' : '';
                return (
                  <div
                    key={cell.dateStr}
                    title={`${cell.dateStr}: ${cell.count}건 완료`}
                    className={`h-7 rounded-lg text-[10px] tabular-nums flex items-center justify-center ${levelClass} ${todayRing}`}
                  >
                    {cell.day}
                  </div>
                );
              })}
            </div>

            {insights.monthTotalCompleted === 0 && (
              <p className="text-[11px] font-semibold text-[#64748B] text-center pt-1">
                이번 달 완료 기록이 아직 없습니다. 할 일을 완료하면 날짜 칸이 보라빛으로 채워집니다.
              </p>
            )}
          </div>

          {/* 주차별 비교 바 */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-black text-[#1E293B] block">주차별 완료 추이</span>
            <div className="grid grid-cols-5 gap-1.5">
              {insights.monthWeekBars.map((wb) => {
                const pct = roundPercent(wb.count, maxMonthWeekCount);
                return (
                  <div
                    key={wb.weekIndex}
                    className="bg-[#FAF8F5] rounded-xl p-2 border border-[#E5DDD0] text-center space-y-1"
                  >
                    <span className="text-[9.5px] font-bold text-[#64748B] block">{wb.label}</span>
                    <span className="text-xs font-black text-[#1E293B] tabular-nums block">
                      {wb.count}건
                    </span>
                    <svg
                      viewBox="0 0 100 6"
                      preserveAspectRatio="none"
                      className="w-full h-1.5 rounded-full overflow-hidden block"
                      aria-hidden="true"
                    >
                      <rect x="0" y="0" width="100" height="6" rx="3" fill="#E2E8F0" />
                      <rect
                        x="0"
                        y="0"
                        width={wb.count > 0 ? Math.max(12, pct) : 0}
                        height="6"
                        rx="3"
                        fill="#6366F1"
                      />
                    </svg>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {period === 'all' && (
        <Card
          padding={3}
          elevation="low"
          className="rounded-3xl bg-white border-[#E5DDD0] space-y-3"
          data-report-panel="all"
        >
          {/* 누적 4대 기록 */}
          <div className="grid grid-cols-4 gap-1.5 text-center">
            <div className="bg-[#F8FAFC] rounded-xl py-2 px-1 border border-slate-200/80">
              <span className="text-[9px] font-bold text-[#64748B] block">누적 완료</span>
              <span className="text-sm font-black text-[#6366F1] tabular-nums">
                {insights.allTotalCompletions}회
              </span>
            </div>
            <div className="bg-[#F8FAFC] rounded-xl py-2 px-1 border border-slate-200/80">
              <span className="text-[9px] font-bold text-[#64748B] block">활동 일수</span>
              <span className="text-sm font-black text-[#1E293B] tabular-nums">
                {insights.allActiveDays}일
              </span>
            </div>
            <div className="bg-[#F8FAFC] rounded-xl py-2 px-1 border border-slate-200/80">
              <span className="text-[9px] font-bold text-[#64748B] block">최장 스트릭</span>
              <span className="text-sm font-black text-[#10B981] tabular-nums">
                {insights.allMaxStreak}연속
              </span>
            </div>
            <div className="bg-[#F8FAFC] rounded-xl py-2 px-1 border border-slate-200/80">
              <span className="text-[9px] font-bold text-[#64748B] block">집중 타이머</span>
              <span className="text-sm font-black text-[#8B5CF6] tabular-nums">
                {insights.allPomodoroSessions}세션
              </span>
            </div>
          </div>

          {/* 강점 & 집중 필요 카테고리 인사이트 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="rounded-2xl p-2.5 bg-emerald-50/70 border border-emerald-200/80 flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-white text-emerald-700 flex items-center justify-center text-xs shrink-0 shadow-xs">
                <i className="fas fa-award"></i>
              </span>
              <div className="min-w-0">
                <span className="text-[9.5px] font-black text-emerald-800 block">가장 잘 지키는 분야</span>
                {insights.categoryInsights.bestCategory ? (
                  <p className="text-xs font-black text-[#1E293B] truncate">
                    {CATEGORY_MAP[insights.categoryInsights.bestCategory.category].label}{' '}
                    <span className="text-emerald-700 font-mono">
                      ({insights.categoryInsights.bestCategory.rate}%)
                    </span>
                  </p>
                ) : (
                  <p className="text-[11px] font-semibold text-[#64748B]">완료 데이터 대기 중</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl p-2.5 bg-amber-50/70 border border-amber-200/80 flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-white text-amber-700 flex items-center justify-center text-xs shrink-0 shadow-xs">
                <i className="fas fa-bullseye"></i>
              </span>
              <div className="min-w-0">
                <span className="text-[9.5px] font-black text-amber-800 block">집중 공략 분야</span>
                {insights.categoryInsights.focusCategory ? (
                  <p className="text-xs font-black text-[#1E293B] truncate">
                    {CATEGORY_MAP[insights.categoryInsights.focusCategory.category].label}{' '}
                    <span className="text-amber-700 font-mono">
                      (남은 {insights.categoryInsights.focusCategory.remaining}건)
                    </span>
                  </p>
                ) : (
                  <p className="text-[11px] font-semibold text-[#64748B]">미완료 항목이 없습니다</p>
                )}
              </div>
            </div>
          </div>

          {/* 반복 루틴 성실도 TOP 5 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-black text-[#1E293B]">
              <span>반복 루틴 성실도 TOP 5</span>
              <span className="text-[10px] font-bold text-[#64748B]">
                등록 루틴 {stats.recurringCount}건
              </span>
            </div>

            {insights.topRoutines.length > 0 ? (
              <div className="space-y-1.5">
                {insights.topRoutines.map((routine, idx) => {
                  const cat = CATEGORY_MAP[routine.category];
                  return (
                    <div
                      key={routine.id}
                      className="px-2.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E5DDD0] flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="w-5 h-5 rounded-lg bg-white border border-[#E5DDD0] text-[10px] font-black text-[#6366F1] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1E293B] truncate">
                            {routine.title}
                          </p>
                          <p className="text-[10px] font-semibold text-[#64748B] truncate">
                            {cat.label} · {routine.summaryLabel}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-black tabular-nums ${
                            routine.streakCount > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-white text-[#64748B] border border-slate-200'
                          }`}
                        >
                          🔥 {routine.streakCount}연속
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl bg-[#FAF8F5] border border-[#E5DDD0] px-3 py-2.5 text-[11px] font-semibold text-[#64748B] text-center">
                등록된 반복 루틴이 아직 없습니다. 매일·매주 반복 할 일을 추가하면 성실도 순위가 표시됩니다.
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 4. 게이미피케이션 업적 도장 컬렉션 (8종, 100% 실데이터 기반) */}
      <Card
        padding={3}
        elevation="low"
        className="rounded-3xl bg-[#F0F4F8] border-white/80 shadow-[6px_6px_14px_rgba(163,177,198,0.38),-6px_-6px_14px_rgba(255,255,255,0.9)] space-y-2.5"
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-black text-[#1E293B]">실행 업적 도장 컬렉션</h3>
            <p className="text-[10px] font-semibold text-[#64748B]">
              실제 완료와 집중 기록에 따라 도장이 하나씩 깨어납니다
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-white text-[#6366F1] text-[11px] font-black tabular-nums shadow-xs">
            {insights.unlockedAchievementCount} / {insights.achievements.length} 획득
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {insights.achievements.map((item) => (
            <div
              key={item.id}
              data-achievement-unlocked={item.unlocked ? 'true' : 'false'}
              className={`rounded-2xl p-2.5 border transition-all flex flex-col justify-between gap-1.5 ${
                item.unlocked
                  ? 'bg-white border-indigo-200/80 shadow-[3px_3px_9px_rgba(99,102,241,0.14),-3px_-3px_8px_rgba(255,255,255,0.95)]'
                  : 'bg-[#E6ECF3]/70 border-white/60 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs ${
                    item.unlocked
                      ? 'bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white shadow-xs'
                      : 'bg-white/80 text-[#94A3B8]'
                  }`}
                >
                  <i className={item.iconClass}></i>
                </span>
                <span
                  className={`text-[9.5px] font-black px-1.5 py-0.5 rounded-md tabular-nums ${
                    item.unlocked
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-white/70 text-[#64748B]'
                  }`}
                >
                  {item.unlocked ? '달성!' : item.progressLabel}
                </span>
              </div>
              <div>
                <p className="text-[11px] font-black text-[#1E293B] leading-tight">
                  {item.title}
                </p>
                <p className="text-[9.5px] font-medium text-[#64748B] leading-snug mt-0.5">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 5. 마크다운 · 텍스트 · JSON 백업/복원 */}
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

      {/* 6. Zero-CLS 애드센스/스폰서 슬롯 */}
      <BannerSlot slotKey="todo-report-bottom-ad" label="SPONSORED AD" />
    </section>
  );
}
