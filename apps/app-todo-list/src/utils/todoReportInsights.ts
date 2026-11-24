import type {
  CategoryInsightSummary,
  MonthCalendarCell,
  PeriodDailyBar,
  ReportAchievement,
  ReportGradeCode,
  ReportGradeInfo,
  ReportPeriod,
  RoutineSincerityItem,
  TimeSlotBucket,
  TodoCompletionLog,
  TodoItem,
  TodoReportInsights,
  TodoStatsReport,
  WeekChunkBar,
} from '../types/todo';
import { getLocalDateString, roundPercent } from './todoAnalytics';

interface NormalizedCompletionEvent {
  readonly todoId: string;
  readonly dateStr: string;
  readonly hour: number;
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (Number.isInteger(y) && Number.isInteger(m) && Number.isInteger(d)) {
    return { year: y, month: m, day: d };
  }
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

function buildEffectiveCompletionEvents(
  activeItems: readonly TodoItem[],
  completionLogs: readonly TodoCompletionLog[]
): NormalizedCompletionEvent[] {
  const eventMap = new Map<string, NormalizedCompletionEvent>();

  for (const log of completionLogs) {
    const parsed = new Date(log.completedAt);
    const hasValidIso = !Number.isNaN(parsed.getTime());
    const dateStr = hasValidIso
      ? getLocalDateString(parsed)
      : /^\d{4}-\d{2}-\d{2}$/.test(log.periodKey)
        ? log.periodKey
        : null;
    if (!dateStr) continue;
    const hour = hasValidIso ? parsed.getHours() : 12;
    const key = `${log.todoId}::${dateStr}`;
    if (!eventMap.has(key)) {
      eventMap.set(key, { todoId: log.todoId, dateStr, hour });
    }
  }

  for (const item of activeItems) {
    if (item.completed && item.completedAt) {
      const parsed = new Date(item.completedAt);
      if (!Number.isNaN(parsed.getTime())) {
        const dateStr = getLocalDateString(parsed);
        const key = `${item.id}::${dateStr}`;
        if (!eventMap.has(key)) {
          eventMap.set(key, {
            todoId: item.id,
            dateStr,
            hour: parsed.getHours(),
          });
        }
      }
    }

    if (
      item.recurrence.type !== 'none' &&
      item.lastCompletedPeriod &&
      /^\d{4}-\d{2}-\d{2}$/.test(item.lastCompletedPeriod)
    ) {
      const key = `${item.id}::${item.lastCompletedPeriod}`;
      if (!eventMap.has(key)) {
        eventMap.set(key, {
          todoId: item.id,
          dateStr: item.lastCompletedPeriod,
          hour: 12,
        });
      }
    }
  }

  return Array.from(eventMap.values());
}

function resolveGradeBadgeClass(grade: ReportGradeCode): string {
  switch (grade) {
    case 'S+':
      return 'bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white shadow-[0_6px_14px_rgba(99,102,241,0.35)]';
    case 'S':
      return 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-[0_6px_14px_rgba(79,70,229,0.28)]';
    case 'A':
      return 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-[0_6px_14px_rgba(16,185,129,0.28)]';
    case 'B':
      return 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-[0_6px_14px_rgba(245,158,11,0.28)]';
    case 'C':
      return 'bg-slate-600 text-white';
    case 'START':
    default:
      return 'bg-[#E2E8F0] text-[#475569]';
  }
}

function buildTodayGrade(stats: TodoStatsReport): ReportGradeInfo {
  if (stats.todayTotalCount === 0 || stats.todayCompletedCount === 0) {
    if (stats.todayTotalCount > 0 && stats.todayCompletedCount === 0) {
      return {
        grade: 'C',
        title: '시동 거는 탐험가',
        comment: `오늘 할 일 ${stats.todayTotalCount}건이 대기 중이에요. 가장 작은 1건부터 도장을 깨보세요!`,
        badgeClass: resolveGradeBadgeClass('C'),
      };
    }
    return {
      grade: 'START',
      title: '새싹 플래너',
      comment: '오늘 할 일을 추가하고 완료 체크를 누르면 실행 등급과 업적 도장이 활성화됩니다.',
      badgeClass: resolveGradeBadgeClass('START'),
    };
  }

  const rate = stats.todayCompletionRate;
  if (rate === 100) {
    return {
      grade: 'S+',
      title: '오늘의 올클리어 마스터',
      comment: `오늘 계획 ${stats.todayTotalCount}건을 100% 완수했습니다! 완벽한 하루 리듬이에요.`,
      badgeClass: resolveGradeBadgeClass('S+'),
    };
  }
  if (rate >= 80) {
    return {
      grade: 'S',
      title: '초집중 실행가',
      comment: `달성률 ${rate}%! 마무리까지 딱 ${stats.todayActiveCount}건만 더 채우면 S+ 등급입니다.`,
      badgeClass: resolveGradeBadgeClass('S'),
    };
  }
  if (rate >= 60) {
    return {
      grade: 'A',
      title: '꾸준한 페이서',
      comment: `절반 이상 해냈어요! 남은 ${stats.todayActiveCount}건 중 긴급 항목부터 공략해 보세요.`,
      badgeClass: resolveGradeBadgeClass('A'),
    };
  }
  if (rate >= 35) {
    return {
      grade: 'B',
      title: '워밍업 도전자',
      comment: '좋은 출발입니다! 집중 타이머 1세션을 켜면 속도가 2배 빨라집니다.',
      badgeClass: resolveGradeBadgeClass('B'),
    };
  }
  return {
    grade: 'C',
    title: '시동 거는 탐험가',
    comment: '첫 완료 체크로 탄력이 붙기 시작했어요. 다음 1건만 가볍게 이어가 볼까요?',
    badgeClass: resolveGradeBadgeClass('C'),
  };
}

function buildWeekGrade(weekTotal: number, weekActiveDays: number): ReportGradeInfo {
  if (weekTotal === 0) {
    return {
      grade: 'START',
      title: '주간 기록 대기 중',
      comment: '최근 7일 완료 기록이 아직 없어요. 오늘 첫 완료로 주간 그래프를 채워보세요!',
      badgeClass: resolveGradeBadgeClass('START'),
    };
  }
  if (weekActiveDays >= 6 && weekTotal >= 14) {
    return {
      grade: 'S+',
      title: '주간 철벽 루티너',
      comment: `최근 7일 중 ${weekActiveDays}일이나 출석하며 ${weekTotal}건을 해냈습니다!`,
      badgeClass: resolveGradeBadgeClass('S+'),
    };
  }
  if (weekActiveDays >= 5 || weekTotal >= 10) {
    return {
      grade: 'S',
      title: '위클리 페이스메이커',
      comment: `일주일 동안 ${weekTotal}건 완료! 꾸준한 주간 리듬이 자리 잡았습니다.`,
      badgeClass: resolveGradeBadgeClass('S'),
    };
  }
  if (weekActiveDays >= 3 || weekTotal >= 5) {
    return {
      grade: 'A',
      title: '안정적인 주간 빌더',
      comment: `${weekActiveDays}일 동안 꾸준히 실천 중이에요. 주말까지 흐름을 이어가 보세요.`,
      badgeClass: resolveGradeBadgeClass('A'),
    };
  }
  if (weekTotal >= 2) {
    return {
      grade: 'B',
      title: '주간 시동 도전자',
      comment: '주간 그래프에 첫 기둥이 섰습니다. 매일 1건만 더 쌓아도 훌륭해요.',
      badgeClass: resolveGradeBadgeClass('B'),
    };
  }
  return {
    grade: 'C',
    title: '첫 주간 발걸음',
    comment: '최근 7일 첫 완료를 기록했어요! 내일도 그래프를 한 칸 높여보세요.',
    badgeClass: resolveGradeBadgeClass('C'),
  };
}

function buildMonthGrade(monthTotal: number, monthActiveDays: number): ReportGradeInfo {
  if (monthTotal === 0) {
    return {
      grade: 'START',
      title: '월간 잔디 심기 전',
      comment: '이번 달 첫 완료를 체크하면 월간 달력 히트맵에 초록 잔디가 심어집니다.',
      badgeClass: resolveGradeBadgeClass('START'),
    };
  }
  if (monthActiveDays >= 20 && monthTotal >= 40) {
    return {
      grade: 'S+',
      title: '이달의 레전드 플래너',
      comment: `이번 달 ${monthActiveDays}일 활동, 총 ${monthTotal}건 완료! 달력이 꽉 차고 있어요.`,
      badgeClass: resolveGradeBadgeClass('S+'),
    };
  }
  if (monthActiveDays >= 12 || monthTotal >= 20) {
    return {
      grade: 'S',
      title: '월간 성실 챔피언',
      comment: `이번 달 ${monthTotal}건의 성취를 쌓았습니다. 훌륭한 한 달 페이스예요!`,
      badgeClass: resolveGradeBadgeClass('S'),
    };
  }
  if (monthActiveDays >= 6 || monthTotal >= 10) {
    return {
      grade: 'A',
      title: '성실한 가드너',
      comment: `달력에 ${monthActiveDays}일치 잔디가 피어났어요. 꾸준히 빈 칸을 채워보세요.`,
      badgeClass: resolveGradeBadgeClass('A'),
    };
  }
  if (monthTotal >= 3) {
    return {
      grade: 'B',
      title: '월간 워밍업',
      comment: '이번 달 시작이 좋습니다! 반복 루틴을 하나 추가하면 잔디가 빠르게 늘어납니다.',
      badgeClass: resolveGradeBadgeClass('B'),
    };
  }
  return {
    grade: 'C',
    title: '첫 잔디 씨앗',
    comment: `이번 달 ${monthTotal}건 완료! 오늘의 작은 체크가 큰 월간 기록이 됩니다.`,
    badgeClass: resolveGradeBadgeClass('C'),
  };
}

function buildAllGrade(
  allTotal: number,
  allMaxStreak: number,
  pomodoroSessions: number
): ReportGradeInfo {
  if (allTotal === 0 && pomodoroSessions === 0) {
    return {
      grade: 'START',
      title: '위대한 첫 발걸음 대기',
      comment: '첫 할 일을 완료하거나 집중 타이머 1세션을 마치면 누적 기록이 시작됩니다.',
      badgeClass: resolveGradeBadgeClass('START'),
    };
  }
  if (allTotal >= 50 || (allMaxStreak >= 14 && allTotal >= 25)) {
    return {
      grade: 'S+',
      title: '루틴 그랜드마스터',
      comment: `누적 ${allTotal}건 완료, 최고 ${allMaxStreak}연속 스트릭! 흔들리지 않는 실행력입니다.`,
      badgeClass: resolveGradeBadgeClass('S+'),
    };
  }
  if (allTotal >= 25 || allMaxStreak >= 7) {
    return {
      grade: 'S',
      title: '마스터 아키텍트',
      comment: `누적 ${allTotal}건 완수! 시간과 습관을 스스로 설계하고 계세요.`,
      badgeClass: resolveGradeBadgeClass('S'),
    };
  }
  if (allTotal >= 10 || allMaxStreak >= 3) {
    return {
      grade: 'A',
      title: '꾸준한 실행가',
      comment: `누적 ${allTotal}건 달성! 업적 도장들이 하나둘 채워지고 있습니다.`,
      badgeClass: resolveGradeBadgeClass('A'),
    };
  }
  if (allTotal >= 3 || pomodoroSessions >= 1) {
    return {
      grade: 'B',
      title: '성장하는 루티너',
      comment: '기록이 쌓이기 시작했어요. 10건 달성 도장을 향해 계속 나아가세요!',
      badgeClass: resolveGradeBadgeClass('B'),
    };
  }
  return {
    grade: 'C',
    title: '새내기 실행가',
    comment: `지금까지 ${allTotal}건을 끝냈습니다. 매일이 쌓이면 엄청난 힘이 됩니다.`,
    badgeClass: resolveGradeBadgeClass('C'),
  };
}

export function buildTodoReportInsights(params: {
  readonly activeItems: readonly TodoItem[];
  readonly completionLogs: readonly TodoCompletionLog[];
  readonly stats: TodoStatsReport;
  readonly pomodoroSessions: number;
  readonly todayStr?: string;
}): TodoReportInsights {
  const todayStr = params.todayStr || getLocalDateString();
  const { activeItems, completionLogs, stats, pomodoroSessions } = params;

  const events = buildEffectiveCompletionEvents(activeItems, completionLogs);
  const dateCountMap = new Map<string, number>();
  for (const ev of events) {
    dateCountMap.set(ev.dateStr, (dateCountMap.get(ev.dateStr) ?? 0) + 1);
  }

  // 1. 오늘 시간대 리듬
  const todayEvents = events.filter((ev) => ev.dateStr === todayStr);
  let morningCount = 0;
  let afternoonCount = 0;
  let eveningCount = 0;
  for (const ev of todayEvents) {
    if (ev.hour < 12) morningCount += 1;
    else if (ev.hour < 18) afternoonCount += 1;
    else eveningCount += 1;
  }
  const todayLoggedCount = todayEvents.length;
  const todayTimeSlots: TimeSlotBucket[] = [
    {
      key: 'morning',
      label: '오전',
      rangeLabel: '00~11시',
      count: morningCount,
      percent: roundPercent(morningCount, todayLoggedCount),
    },
    {
      key: 'afternoon',
      label: '오후',
      rangeLabel: '12~17시',
      count: afternoonCount,
      percent: roundPercent(afternoonCount, todayLoggedCount),
    },
    {
      key: 'evening',
      label: '저녁',
      rangeLabel: '18~23시',
      count: eveningCount,
      percent: roundPercent(eveningCount, todayLoggedCount),
    },
  ];

  // 2. 주간 최근 7일 추이
  const { year: ty, month: tm, day: td } = parseDateParts(todayStr);
  const weekBars: PeriodDailyBar[] = [];
  for (let offset = -6; offset <= 0; offset += 1) {
    const target = new Date(ty, tm - 1, td + offset);
    const dateStr = getLocalDateString(target);
    const weekday = WEEKDAY_LABELS[target.getDay()];
    weekBars.push({
      dateStr,
      label: offset === 0 ? '오늘' : weekday,
      count: dateCountMap.get(dateStr) ?? 0,
      isToday: dateStr === todayStr,
    });
  }
  const weekTotalCompleted = weekBars.reduce((acc, bar) => acc + bar.count, 0);
  const weekActiveDays = weekBars.filter((bar) => bar.count > 0).length;
  const weekDailyAvg = (weekTotalCompleted / 7).toFixed(1);
  const topWeekBar = weekBars.reduce<PeriodDailyBar | null>(
    (best, bar) => (!best || bar.count > best.count ? bar : best),
    null
  );
  const weekBestDay =
    topWeekBar && topWeekBar.count > 0
      ? { label: topWeekBar.label, count: topWeekBar.count }
      : null;

  // 3. 월간 달력 히트맵 & 주차별 비교
  const firstOfMonth = new Date(ty, tm - 1, 1);
  const leadingEmpty = firstOfMonth.getDay();
  const daysInMonth = new Date(ty, tm, 0).getDate();
  const monthLabel = `${ty}년 ${tm}월`;
  const monthCells: MonthCalendarCell[] = [];
  for (let i = 0; i < leadingEmpty; i += 1) {
    monthCells.push({
      day: null,
      dateStr: null,
      count: 0,
      level: 0,
      isToday: false,
    });
  }

  const weekBucketCounts = [0, 0, 0, 0, 0];
  let monthTotalCompleted = 0;
  let monthActiveDays = 0;
  let monthMaxDaily = 0;

  for (let dayNum = 1; dayNum <= daysInMonth; dayNum += 1) {
    const dObj = new Date(ty, tm - 1, dayNum);
    const dateStr = getLocalDateString(dObj);
    const count = dateCountMap.get(dateStr) ?? 0;
    const level: 0 | 1 | 2 | 3 = count >= 4 ? 3 : count >= 2 ? 2 : count === 1 ? 1 : 0;

    monthCells.push({
      day: dayNum,
      dateStr,
      count,
      level,
      isToday: dateStr === todayStr,
    });

    monthTotalCompleted += count;
    if (count > 0) monthActiveDays += 1;
    if (count > monthMaxDaily) monthMaxDaily = count;

    const bucketIdx = Math.min(4, Math.floor((dayNum - 1) / 7));
    weekBucketCounts[bucketIdx] += count;
  }

  const monthWeekCount = daysInMonth > 28 ? 5 : 4;
  const monthWeekBars: WeekChunkBar[] = Array.from({ length: monthWeekCount }, (_, idx) => ({
    weekIndex: idx + 1,
    label: `${idx + 1}주`,
    count: weekBucketCounts[idx],
  }));

  // 4. 누적 지표 & 반복 루틴 TOP 5 & 카테고리 인사이트
  const allTotalCompletions = Math.max(events.length, stats.completedCount);
  const allActiveDays = dateCountMap.size;
  const allMaxStreak = stats.maxStreak;

  const topRoutines: RoutineSincerityItem[] = activeItems
    .filter((item) => item.recurrence.type !== 'none')
    .sort((a, b) => {
      if (b.streakCount !== a.streakCount) return b.streakCount - a.streakCount;
      if (a.completed !== b.completed) return a.completed ? -1 : 1;
      return b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      summaryLabel: item.occurrence.summaryLabel || '반복 루틴',
      streakCount: item.streakCount,
      completedToday: item.completed,
    }));

  const activeCategories = stats.byCategory.filter((row) => row.total > 0);
  const bestCatRow = activeCategories
    .filter((row) => row.completed > 0)
    .sort((a, b) => (b.rate !== a.rate ? b.rate - a.rate : b.completed - a.completed))[0];
  const focusCatRow = activeCategories
    .filter((row) => row.total - row.completed > 0)
    .sort((a, b) => b.total - b.completed - (a.total - a.completed))[0];

  const categoryInsights: CategoryInsightSummary = {
    bestCategory: bestCatRow
      ? {
          category: bestCatRow.category,
          rate: bestCatRow.rate,
          completed: bestCatRow.completed,
          total: bestCatRow.total,
        }
      : null,
    focusCategory: focusCatRow
      ? {
          category: focusCatRow.category,
          remaining: focusCatRow.total - focusCatRow.completed,
          total: focusCatRow.total,
        }
      : null,
  };

  // 5. 기간별 등급 & 업적 도장 8종
  const gradeByPeriod: Record<ReportPeriod, ReportGradeInfo> = {
    today: buildTodayGrade(stats),
    week: buildWeekGrade(weekTotalCompleted, weekActiveDays),
    month: buildMonthGrade(monthTotalCompleted, monthActiveDays),
    all: buildAllGrade(allTotalCompletions, allMaxStreak, pomodoroSessions),
  };

  const urgentCompletedCount = activeItems.filter(
    (item) => item.priority === 'urgent' && item.completed
  ).length;
  const urgentCompletedTotal = Math.max(
    urgentCompletedCount,
    events.filter((ev) => {
      const matched = activeItems.find((item) => item.id === ev.todoId);
      return matched?.priority === 'urgent';
    }).length
  );
  const isTodayAllClear = stats.todayTotalCount > 0 && stats.todayCompletionRate === 100;

  const achievements: ReportAchievement[] = [
    {
      id: 'first-step',
      title: '첫 발걸음',
      desc: '첫 할 일 1건 완료하기',
      iconClass: 'fas fa-shoe-prints',
      unlocked: allTotalCompletions >= 1,
      progressLabel: `${Math.min(1, allTotalCompletions)}/1건`,
    },
    {
      id: 'today-all-clear',
      title: '오늘 올클리어',
      desc: '오늘 할 일 100% 완수',
      iconClass: 'fas fa-crown',
      unlocked: isTodayAllClear,
      progressLabel:
        stats.todayTotalCount > 0 ? `${stats.todayCompletionRate}%` : '대기 중',
    },
    {
      id: 'streak-3',
      title: '3일 불꽃',
      desc: '반복 루틴 3연속 달성',
      iconClass: 'fas fa-fire',
      unlocked: allMaxStreak >= 3,
      progressLabel: `${Math.min(3, allMaxStreak)}/3연속`,
    },
    {
      id: 'streak-7',
      title: '7일 철벽 루틴',
      desc: '반복 루틴 7연속 달성',
      iconClass: 'fas fa-shield-halved',
      unlocked: allMaxStreak >= 7,
      progressLabel: `${Math.min(7, allMaxStreak)}/7연속`,
    },
    {
      id: 'urgent-hero',
      title: '긴급 해결사',
      desc: '긴급(P1) 할 일 완료하기',
      iconClass: 'fas fa-bolt',
      unlocked: urgentCompletedTotal >= 1,
      progressLabel: `${Math.min(1, urgentCompletedTotal)}/1건`,
    },
    {
      id: 'focus-master',
      title: '집중 마스터',
      desc: '집중 타이머 3세션 완료',
      iconClass: 'fas fa-stopwatch',
      unlocked: pomodoroSessions >= 3,
      progressLabel: `${Math.min(3, pomodoroSessions)}/3세션`,
    },
    {
      id: 'milestone-10',
      title: '꾸준한 10완료',
      desc: '누적 완료 10회 돌파',
      iconClass: 'fas fa-medal',
      unlocked: allTotalCompletions >= 10,
      progressLabel: `${Math.min(10, allTotalCompletions)}/10회`,
    },
    {
      id: 'milestone-50',
      title: '전설의 50완료',
      desc: '누적 완료 50회 달성',
      iconClass: 'fas fa-trophy',
      unlocked: allTotalCompletions >= 50,
      progressLabel: `${Math.min(50, allTotalCompletions)}/50회`,
    },
  ];

  const unlockedAchievementCount = achievements.filter((item) => item.unlocked).length;

  return {
    todayTimeSlots,
    todayLoggedCount,
    weekBars,
    weekTotalCompleted,
    weekActiveDays,
    weekDailyAvg,
    weekBestDay,
    monthLabel,
    monthCells,
    monthWeekBars,
    monthTotalCompleted,
    monthActiveDays,
    monthMaxDaily,
    allTotalCompletions,
    allActiveDays,
    allMaxStreak,
    allPomodoroSessions: pomodoroSessions,
    topRoutines,
    categoryInsights,
    gradeByPeriod,
    achievements,
    unlockedAchievementCount,
  };
}
