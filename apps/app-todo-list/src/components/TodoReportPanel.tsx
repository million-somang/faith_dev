import { useRef, type ChangeEvent } from 'react';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { CATEGORY_MAP, PRIORITY_MAP } from '../constants/todoMeta';
import type { PomodoroMode } from '../hooks/usePomodoroTimer';
import type { TodoItem, TodoStatsReport } from '../types/todo';
import { roundPercent } from '../utils/todoAnalytics';
import BannerSlot from './BannerSlot';

interface TodoReportPanelProps {
  readonly stats: TodoStatsReport;
  readonly pinnedTodo: TodoItem | null;
  readonly pomodoroMode: PomodoroMode;
  readonly pomodoroTime: string;
  readonly pomodoroPercent: number;
  readonly pomodoroRunning: boolean;
  readonly pomodoroSessions: number;
  readonly isAuthenticated: boolean;
  readonly onTogglePomodoroRun: () => void;
  readonly onResetPomodoro: () => void;
  readonly onSwitchPomodoroMode: (mode: PomodoroMode) => void;
  readonly onClearPin: () => void;
  readonly onCompletePinned: (id: string) => void;
  readonly onCopyReport: () => void;
  readonly onDownloadMarkdown: () => void;
  readonly onDownloadText: () => void;
  readonly onDownloadBackupJson: () => void;
  readonly onImportBackupJson: (raw: string) => void;
  readonly onBackToBoard?: () => void;
}

const DONUT_RADIUS = 40;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

export default function TodoReportPanel({
  stats,
  pinnedTodo,
  pomodoroMode,
  pomodoroTime,
  pomodoroPercent,
  pomodoroRunning,
  pomodoroSessions,
  isAuthenticated,
  onTogglePomodoroRun,
  onResetPomodoro,
  onSwitchPomodoroMode,
  onClearPin,
  onCompletePinned,
  onCopyReport,
  onDownloadMarkdown,
  onDownloadText,
  onDownloadBackupJson,
  onImportBackupJson,
  onBackToBoard,
}: TodoReportPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dashOffset =
    DONUT_CIRCUMFERENCE - (DONUT_CIRCUMFERENCE * stats.completionRate) / 100;

  const motivationalMessage =
    stats.totalCount === 0
      ? '할 일이나 반복 루틴을 등록하면 오늘의 달성률 리포트가 실시간으로 생성됩니다.'
      : stats.completionRate === 100
        ? '오늘 계획한 모든 할 일을 완벽하게 마무리했습니다!'
        : stats.overdueCount > 0
          ? `마감이 지난 할 일 ${stats.overdueCount}건을 먼저 처리해 보세요.`
          : stats.completionRate >= 60
            ? '절반 이상 달성했습니다. 마지막 스퍼트까지 힘내세요!'
            : '가장 중요한 P1·반복 루틴부터 하나씩 완료해 보세요.';

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
          <div className="flex items-center gap-2">
            {onBackToBoard && (
              <button
                type="button"
                onClick={onBackToBoard}
                aria-label="할 일 목록으로 돌아가기"
                className="md:hidden w-8 h-8 rounded-xl bg-[#FAF8F5] hover:bg-[#F2EDE4] border border-[#E5DDD0] text-[#24211D] flex items-center justify-center text-xs cursor-pointer"
              >
                <i className="fas fa-arrow-left"></i>
              </button>
            )}
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 block">
                ASTRYX PRODUCTIVITY REPORT
              </span>
              <h2 className="text-sm sm:text-base font-black text-[#24211D] leading-tight">
                오늘의 할일 달성 리포트
              </h2>
            </div>
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
                stroke={stats.completionRate === 100 && stats.totalCount > 0 ? '#047857' : '#4338CA'}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={DONUT_CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-[#24211D] tabular-nums leading-none">
                {stats.completionRate}%
              </span>
              <span className="text-[9px] font-bold text-[#6C655B] mt-0.5">
                {stats.completedCount}/{stats.totalCount}건
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

      {/* 2. 포모도로 25분 집중 타이머 Astryx Card */}
      <Card padding={3} elevation="low" className="rounded-3xl bg-white border-[#E5DDD0] space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center text-xs">
              <i className="fas fa-stopwatch"></i>
            </span>
            <div>
              <h3 className="text-xs font-black text-[#24211D]">포모도로 집중 타이머</h3>
              <p className="text-[10px] text-[#6C655B]">누적 집중 {pomodoroSessions}세션 완료</p>
            </div>
          </div>

          <div className="flex bg-[#F2EDE4] p-0.5 rounded-lg text-[10px] font-black">
            <button
              type="button"
              onClick={() => onSwitchPomodoroMode('focus')}
              className={`px-2 py-1 rounded-md cursor-pointer transition-colors ${
                pomodoroMode === 'focus' ? 'bg-white text-indigo-700 shadow-xs' : 'text-[#6C655B]'
              }`}
            >
              집중 25분
            </button>
            <button
              type="button"
              onClick={() => onSwitchPomodoroMode('break')}
              className={`px-2 py-1 rounded-md cursor-pointer transition-colors ${
                pomodoroMode === 'break' ? 'bg-white text-emerald-700 shadow-xs' : 'text-[#6C655B]'
              }`}
            >
              휴식 5분
            </button>
          </div>
        </div>

        {pinnedTodo ? (
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl px-2.5 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <i className="fas fa-thumbtack text-indigo-600 text-[10px] shrink-0"></i>
              <span className="text-[11px] font-extrabold text-indigo-950 truncate">
                {pinnedTodo.title}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!pinnedTodo.completed && (
                <button
                  type="button"
                  onClick={() => onCompletePinned(pinnedTodo.id)}
                  className="px-2 py-0.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-[9px] font-black cursor-pointer"
                >
                  완료
                </button>
              )}
              <button
                type="button"
                onClick={onClearPin}
                aria-label="고정 해제"
                className="w-5 h-5 rounded-md bg-white text-[#6C655B] hover:text-rose-600 border border-indigo-200 flex items-center justify-center text-[9px] cursor-pointer"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-[#6C655B] bg-[#FAF8F5] px-2.5 py-1.5 rounded-xl border border-[#E5DDD0]">
            할 일 카드의 <i className="fas fa-thumbtack text-indigo-600 mx-0.5"></i> 핀을 누르면 집중 대상이 고정됩니다.
          </p>
        )}

        <div className="flex items-center justify-between gap-3 pt-0.5">
          <div className="flex-1 space-y-1.5">
            <div className="text-2xl font-mono font-black text-[#24211D] tabular-nums tracking-tight leading-none">
              {pomodoroTime}
            </div>
            <ProgressBar
              value={pomodoroPercent}
              max={100}
              label="타이머 진행률"
              isLabelHidden
              variant={pomodoroMode === 'focus' ? 'accent' : 'success'}
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              label={pomodoroRunning ? '일시정지' : '집중 시작'}
              variant={pomodoroRunning ? 'secondary' : 'primary'}
              size="sm"
              onClick={onTogglePomodoroRun}
              icon={<i className={`fas ${pomodoroRunning ? 'fa-pause' : 'fa-play'} text-[10px]`}></i>}
            />
            <Button
              label="초기화"
              isIconOnly
              variant="secondary"
              size="sm"
              onClick={onResetPomodoro}
              icon={<i className="fas fa-rotate-left text-xs"></i>}
            />
          </div>
        </div>
      </Card>

      {/* 3. 마크다운 · 텍스트 · JSON 백업/복원 */}
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
