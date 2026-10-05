import { DayInfo, VacationPlan } from '../types/vacation';
import { getHolidayMap } from './koreanHolidays';

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function generateYearDays(year: number): DayInfo[] {
  const holidayMap = getHolidayMap(year);
  const days: DayInfo[] = [];

  // Include 3 days of previous year and 3 days of next year to bridge year-end holidays
  const startDate = new Date(year - 1, 11, 28);
  const endDate = new Date(year + 1, 0, 4);

  const cur = new Date(startDate);
  while (cur <= endDate) {
    const dateStr = formatDate(cur);
    const dayOfWeek = cur.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const holiday = holidayMap.get(dateStr);
    const isHoliday = !!holiday;

    days.push({
      dateStr,
      year: cur.getFullYear(),
      month: cur.getMonth() + 1,
      day: cur.getDate(),
      dayOfWeek,
      isWeekend,
      isHoliday,
      holidayName: holiday?.name,
    });

    cur.setDate(cur.getDate() + 1);
  }

  return days;
}

function getSeason(month: number): 'spring' | 'summer' | 'autumn' | 'winter' {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

function generateRouteTitle(month: number, totalDays: number, holidayNames: string[]): string {
  const uniqueHolidays = Array.from(new Set(holidayNames.filter(Boolean)));
  if (uniqueHolidays.length > 0) {
    const primary = uniqueHolidays[0];
    return `${month}월 ${primary} 연계 ${totalDays}일 황금루트`;
  }
  return `${month}월 주말연계 ${totalDays}일 힐링루트`;
}

export function findOptimalVacationPlans(year: number, maxVacationDays: number): VacationPlan[] {
  const days = generateYearDays(year);
  const n = days.length;
  const isOff = (i: number) => days[i].isWeekend || days[i].isHoliday;

  const rawPlans: VacationPlan[] = [];
  const seenRanges = new Set<string>();

  // Sliding window to find maximal continuous off-day blocks using up to maxVacationDays
  for (let i = 0; i < n; i++) {
    // Only start a window on an off-day or the first vacation day adjacent to an off-day
    let workDaysCount = 0;
    const vacationDates: string[] = [];
    const holidayDates: string[] = [];
    const weekendDates: string[] = [];

    for (let j = i; j < n; j++) {
      if (!isOff(j)) {
        workDaysCount++;
        vacationDates.push(days[j].dateStr);
      } else {
        if (days[j].isHoliday) holidayDates.push(days[j].dateStr);
        if (days[j].isWeekend) weekendDates.push(days[j].dateStr);
      }

      if (workDaysCount > maxVacationDays) {
        break;
      }

      // Valid candidate if:
      // 1. Used at least 1 vacation day
      // 2. Used <= maxVacationDays
      // 3. Start day is off, or previous day is not an off day we missed
      // 4. End day is off (or if window ends right after holiday/weekend)
      if (workDaysCount > 0 && workDaysCount <= maxVacationDays) {
        const startDay = days[i];
        const endDay = days[j];

        // Ensure window touches the boundary of off-days
        const prevOff = i > 0 && isOff(i - 1);
        const nextOff = j < n - 1 && isOff(j + 1);

        // If it could be naturally extended by off-days, don't record yet
        if (nextOff) continue;
        if (prevOff) continue;

        // Make sure the range starts in the target year
        if (startDay.year !== year && endDay.year !== year) continue;

        const totalDays = j - i + 1;
        // Only consider meaningful long weekends (at least 3 days total)
        if (totalDays >= 3) {
          const key = `${startDay.dateStr}_${endDay.dateStr}_${workDaysCount}`;
          if (!seenRanges.has(key)) {
            seenRanges.add(key);

            const holidayNames = days.slice(i, j + 1).map((d) => d.holidayName || '').filter(Boolean);
            const efficiency = Math.round((totalDays / workDaysCount) * 100);

            rawPlans.push({
              id: key,
              title: generateRouteTitle(startDay.month, totalDays, holidayNames),
              startDate: startDay.dateStr,
              endDate: endDay.dateStr,
              totalDays,
              vacationDaysUsed: workDaysCount,
              efficiency,
              vacationDates: [...vacationDates],
              holidayDates: [...holidayDates],
              weekendDates: [...weekendDates],
              description: `연차 ${workDaysCount}일 소진으로 주말·공휴일 합쳐 총 ${totalDays}일의 연속 휴가를 만듭니다! (효율 ${efficiency}%)`,
              month: startDay.month,
              season: getSeason(startDay.month),
            });
          }
        }
      }
    }
  }

  // Deduplicate overlapping plans that use the exact same vacation days
  const filteredMap = new Map<string, VacationPlan>();
  for (const plan of rawPlans) {
    const vacKey = plan.vacationDates.join(',');
    const existing = filteredMap.get(vacKey);
    if (!existing || plan.totalDays > existing.totalDays) {
      filteredMap.set(vacKey, plan);
    }
  }

  const finalPlans = Array.from(filteredMap.values());

  // Sort by total consecutive days descending, then efficiency descending, then date ascending
  finalPlans.sort((a, b) => {
    if (b.totalDays !== a.totalDays) return b.totalDays - a.totalDays;
    if (b.efficiency !== a.efficiency) return b.efficiency - a.efficiency;
    return a.startDate.localeCompare(b.startDate);
  });

  return finalPlans;
}
