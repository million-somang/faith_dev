import { useRef, type ChangeEvent } from 'react';
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
      ? '할 일을 등록하면 오늘의 달성률 리포트가 실시간으로 생성됩니다.'
      : stats.completionRate === 100
      ? '오늘 계획한 모든 할 일을 완벽하게 마무리했습니다!'
      : stats.overdueCount > 0
      ? `마감이 지난 할 일 ${stats.overdueCount}건을 먼저 처리해 보세요.`
      : stats.completionRate >= 60
      ? '절반 이상 달성했습니다. 마지막 스퍼트까지 힘내세요!'
      : '가장 중요한 P1·오늘 마감 항목부터 하나씩 완료해 보세요.';

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
      {/* 1. 메인 달성률 히어로 카드 */}
      <div className="bg-white rounded-3xl p-3.5 sm:p-4 border border-[#EBE6DD] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#F0EBE2] pb-2">
          <div className="flex items-center gap-2">
            {onBackToBoard && (
              <button
                type="button"
                onClick={onBackToBoard}
                aria-label="할 일 목록으로 돌아가기"
                className="md:hidden w-8 h-8 rounded-xl bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#EBE6DD] text-[#2D2A26] flex items-center justify-center text-xs cursor-pointer"
              >
                <i className="fas fa-arrow-left"></i>
              </button>
            )}
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 block">
                PRODUCTIVITY REPORT
              </span>
              <h2 className="text-sm sm:text-base font-black text-[#2D2A26] leading-tight">
                오늘의 할일 달성 리포트
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onCopyReport}
            className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <i className="fas fa-copy text-[10px]"></i>
            <span>리포트 복사</span>
          </button>
        </div>

        {/* SVG 도넛 게이지 + 핵심 요약 */}
        <div className="bg-gradient-to-br from-indigo-50/70 via-[#FAF8F5] to-emerald-50/60 rounded-2xl p-3.5 border border-[#EBE6DD] flex items-center gap-4">
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90" aria-hidden="true">
              <circle
                cx="50"
                cy="50"
                r={DONUT_RADIUS}
                fill="none"
                stroke="#E5E0D5"
                strokeWidth="9"
              />
              <circle
                cx="50"
                cy="50"
                r={DONUT_RADIUS}
                fill="none"
                stroke={stats.completionRate === 100 && stats.totalCount > 0 ? '#059669' : '#4F46E5'}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={DONUT_CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-[#2D2A26] tabular-nums leading-none">
                {stats.completionRate}%
              </span>
              <span className="text-[9px] font-bold text-[#7A7369] mt-0.5">
                {stats.completedCount}/{stats.totalCount}건
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-xs font-extrabold text-[#2D2A26] leading-snug">
              {motivationalMessage}
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-center">
              <div className="bg-white/90 rounded-xl py-1.5 px-2 border border-[#EBE6DD]">
                <span className="text-[9px] font-bold text-[#7A7369] block">진행중</span>
                <span className="text-xs font-black text-indigo-700 tabular-nums">
                  {stats.activeCount}건
                </span>
              </div>
              <div className="bg-white/90 rounded-xl py-1.5 px-2 border border-[#EBE6DD]">
                <span className="text-[9px] font-bold text-[#7A7369] block">오늘 · 지연</span>
                <span
                  className={`text-xs font-black tabular-nums ${
                    stats.overdueCount > 0 ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                >
                  {stats.todayDueCount} · {stats.overdueCount}건
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 우선순위별 진행 현황 3단 바 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-black text-[#2D2A26]">
            <span>우선순위별 현황</span>
            <span className="text-[10px] font-bold text-[#7A7369]">완료 / 전체</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {stats.byPriority.map((row) => {
              const meta = PRIORITY_MAP[row.priority];
              const pct = roundPercent(row.completed, row.total);
              const barColor =
                row.priority === 'urgent'
                  ? '#E11D48'
                  : row.priority === 'important'
                  ? '#D97706'
                  : '#4F46E5';
              return (
                <div
                  key={row.priority}
                  className="bg-[#FAF8F5] rounded-xl p-2 border border-[#EBE6DD] space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-black text-[#2D2A26]">{meta.shortLabel}</span>
                    <span className="font-mono font-bold text-[#6B645B]">
                      {row.completed}/{row.total}
                    </span>
                  </div>
                  <svg viewBox="0 0 100 6" preserveAspectRatio="none" className="w-full h-1.5 rounded-full overflow-hidden">
                    <rect x="0" y="0" width="100" height="6" rx="3" fill="#E5E0D5" />
                    <rect x="0" y="0" width={pct} height="6" rx="3" fill={barColor} />
                  </svg>
                </div>
              );
            })}
          </div>
        </div>

        {/* 카테고리별 요약 칩 */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#F0EBE2]">
          {stats.byCategory.map((row) => {
            const cat = CATEGORY_MAP[row.category];
            return (
              <span
                key={row.category}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold ${cat.badgeClass}`}
              >
                <i className={`${cat.iconClass} text-[9px]`}></i>
                <span>{cat.label}</span>
                <span className="font-mono font-black">
                  {row.completed}/{row.total}
                </span>
              </span>
            );
          })}
        </div>
      </div>

      {/* 2. 포모도로 25분 집중 타이머 위젯 */}
      <div className="bg-white rounded-3xl p-3.5 border border-[#EBE6DD] shadow-xs space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center text-xs">
              <i className="fas fa-stopwatch"></i>
            </span>
            <div>
              <h3 className="text-xs font-black text-[#2D2A26]">포모도로 집중 타이머</h3>
              <p className="text-[10px] text-[#7A7369]">
                누적 집중 {pomodoroSessions}세션 완료
              </p>
            </div>
          </div>

          <div className="flex bg-[#F5F2EB] p-0.5 rounded-lg text-[10px] font-black">
            <button
              type="button"
              onClick={() => onSwitchPomodoroMode('focus')}
              className={`px-2 py-1 rounded-md cursor-pointer transition-colors ${
                pomodoroMode === 'focus'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-[#7A7369]'
              }`}
            >
              집중 25분
            </button>
            <button
              type="button"
              onClick={() => onSwitchPomodoroMode('break')}
              className={`px-2 py-1 rounded-md cursor-pointer transition-colors ${
                pomodoroMode === 'break'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-[#7A7369]'
              }`}
            >
              휴식 5분
            </button>
          </div>
        </div>

        {/* 핀 고정된 할 일 표시 */}
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
                  className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black cursor-pointer"
                >
                  완료
                </button>
              )}
              <button
                type="button"
                onClick={onClearPin}
                aria-label="고정 해제"
                className="w-5 h-5 rounded-md bg-white text-[#7A7369] hover:text-rose-600 border border-indigo-200 flex items-center justify-center text-[9px] cursor-pointer"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-[#7A7369] bg-[#FAF8F5] px-2.5 py-1.5 rounded-xl border border-[#EBE6DD]">
            할 일 카드의 <i className="fas fa-thumbtack text-indigo-600 mx-0.5"></i> 핀을 누르면 집중 대상이 고정됩니다.
          </p>
        )}

        {/* 카운트다운 + 컨트롤 */}
        <div className="flex items-center justify-between gap-3 pt-0.5">
          <div className="flex-1 space-y-1.5">
            <div className="text-2xl font-mono font-black text-[#2D2A26] tabular-nums tracking-tight leading-none">
              {pomodoroTime}
            </div>
            <svg viewBox="0 0 100 5" preserveAspectRatio="none" className="w-full h-1.5 rounded-full overflow-hidden">
              <rect x="0" y="0" width="100" height="5" rx="2.5" fill="#EBE6DD" />
              <rect
                x="0"
                y="0"
                width={pomodoroPercent}
                height="5"
                rx="2.5"
                fill={pomodoroMode === 'focus' ? '#4F46E5' : '#059669'}
              />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onTogglePomodoroRun}
              className={`px-3.5 py-2 rounded-xl text-xs font-black text-white shadow-xs transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                pomodoroRunning
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <i className={`fas ${pomodoroRunning ? 'fa-pause' : 'fa-play'} text-[10px]`}></i>
              <span>{pomodoroRunning ? '일시정지' : '집중 시작'}</span>
            </button>
            <button
              type="button"
              onClick={onResetPomodoro}
              aria-label="타이머 초기화"
              className="w-8 h-8 rounded-xl bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#EBE6DD] text-[#57514A] flex items-center justify-center text-xs cursor-pointer"
            >
              <i className="fas fa-rotate-left"></i>
            </button>
          </div>
        </div>
      </div>

      {/* 3. 마크다운 · 텍스트 · JSON 백업/복원 툴바 */}
      <div className="bg-white rounded-2xl p-2.5 border border-[#EBE6DD] shadow-2xs space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-black text-[#2D2A26]">
          <span>내보내기 &amp; 안전한 로컬 백업</span>
          <span className="text-[9px] font-bold text-emerald-700 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            마이페이지 자동 동기화
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={onDownloadMarkdown}
            className="py-2 px-1.5 rounded-xl bg-[#FAF8F5] hover:bg-indigo-50 border border-[#EBE6DD] hover:border-indigo-200 text-[10px] font-black text-[#2D2A26] flex flex-col items-center gap-1 cursor-pointer transition-colors"
          >
            <i className="fas fa-file-code text-indigo-600 text-xs"></i>
            <span>.md 저장</span>
          </button>
          <button
            type="button"
            onClick={onDownloadText}
            className="py-2 px-1.5 rounded-xl bg-[#FAF8F5] hover:bg-indigo-50 border border-[#EBE6DD] hover:border-indigo-200 text-[10px] font-black text-[#2D2A26] flex flex-col items-center gap-1 cursor-pointer transition-colors"
          >
            <i className="fas fa-file-lines text-emerald-600 text-xs"></i>
            <span>.txt 저장</span>
          </button>
          <button
            type="button"
            onClick={onDownloadBackupJson}
            className="py-2 px-1.5 rounded-xl bg-[#FAF8F5] hover:bg-indigo-50 border border-[#EBE6DD] hover:border-indigo-200 text-[10px] font-black text-[#2D2A26] flex flex-col items-center gap-1 cursor-pointer transition-colors"
          >
            <i className="fas fa-download text-amber-600 text-xs"></i>
            <span>JSON 백업</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="py-2 px-1.5 rounded-xl bg-[#FAF8F5] hover:bg-indigo-50 border border-[#EBE6DD] hover:border-indigo-200 text-[10px] font-black text-[#2D2A26] flex flex-col items-center gap-1 cursor-pointer transition-colors"
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
      </div>

      {/* 4. Zero-CLS 애드센스/스폰서 슬롯 */}
      <BannerSlot slotKey="todo-report-bottom-ad" label="SPONSORED AD" />
    </section>
  );
}
