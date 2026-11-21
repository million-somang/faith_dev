export type RecurrenceType = 'none' | 'daily' | 'workday' | 'weekly' | 'monthly' | 'yearly';

export interface TodoRecurrenceRule {
  readonly type: RecurrenceType;
  readonly interval: number;
  readonly weekdays: readonly number[] | null;
  readonly monthDay: number | null;
  readonly yearMonth: number | null;
  readonly yearDay: number | null;
  readonly endDate: string | null;
}

export interface TodoOccurrenceState {
  readonly isRecurring: boolean;
  readonly isCompletedForPeriod: boolean;
  readonly isDueToday: boolean;
  readonly currentPeriodKey: string | null;
  readonly nextOccurrenceDate: string | null;
  readonly summaryLabel: string;
}

const WEEKDAY_KOREAN = ['일', '월', '화', '수', '목', '금', '토'] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function padTwo(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function getKstTodayDateStr(): string {
  const now = new Date();
  const kstMs = now.getTime() + 9 * 60 * 60 * 1000;
  const kst = new Date(kstMs);
  return `${kst.getUTCFullYear()}-${padTwo(kst.getUTCMonth() + 1)}-${padTwo(kst.getUTCDate())}`;
}

export function isValidDateStr(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split('-').map(Number);
  return { year, month, day };
}

export function formatDateParts(year: number, month: number, day: number): string {
  return `${year}-${padTwo(month)}-${padTwo(day)}`;
}

export function getDaysInMonth(year: number, month1To12: number): number {
  return new Date(Date.UTC(year, month1To12, 0)).getUTCDate();
}

export function clampDay(year: number, month1To12: number, day: number): number {
  const maxDay = getDaysInMonth(year, month1To12);
  if (day < 1) return 1;
  return day > maxDay ? maxDay : day;
}

export function addDays(dateStr: string, delta: number): string {
  const { year, month, day } = parseDateParts(dateStr);
  const dt = new Date(Date.UTC(year, month - 1, day + delta));
  return formatDateParts(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

export function diffDays(fromStr: string, toStr: string): number {
  const f = parseDateParts(fromStr);
  const t = parseDateParts(toStr);
  const utcFrom = Date.UTC(f.year, f.month - 1, f.day);
  const utcTo = Date.UTC(t.year, t.month - 1, t.day);
  return Math.round((utcTo - utcFrom) / 86_400_000);
}

export function getWeekday(dateStr: string): number {
  const { year, month, day } = parseDateParts(dateStr);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function getWeekStartSunday(dateStr: string): string {
  return addDays(dateStr, -getWeekday(dateStr));
}

const VALID_RECURRENCE_TYPES = new Set<RecurrenceType>([
  'none',
  'daily',
  'workday',
  'weekly',
  'monthly',
  'yearly',
]);

// 대한민국 법정 공휴일 · 대체공휴일 · 선거일 (2026~2030 KASI 기준)
const KOREAN_HOLIDAYS: Readonly<Record<string, string>> = {
  // 2026
  '2026-01-01': '신정',
  '2026-02-16': '설날 연휴',
  '2026-02-17': '설날',
  '2026-02-18': '설날 연휴',
  '2026-03-01': '삼일절',
  '2026-03-02': '삼일절 대체공휴일',
  '2026-05-05': '어린이날',
  '2026-05-24': '부처님오신날',
  '2026-05-25': '부처님오신날 대체공휴일',
  '2026-06-03': '전국동시지방선거',
  '2026-06-06': '현충일',
  '2026-07-17': '제헌절',
  '2026-08-15': '광복절',
  '2026-08-17': '광복절 대체공휴일',
  '2026-09-24': '추석 연휴',
  '2026-09-25': '추석',
  '2026-09-26': '추석 연휴',
  '2026-10-03': '개천절',
  '2026-10-05': '개천절 대체공휴일',
  '2026-10-09': '한글날',
  '2026-12-25': '성탄절',
  // 2027
  '2027-01-01': '신정',
  '2027-02-06': '설날 연휴',
  '2027-02-07': '설날',
  '2027-02-08': '설날 연휴',
  '2027-02-09': '설날 대체공휴일',
  '2027-03-01': '삼일절',
  '2027-05-05': '어린이날',
  '2027-05-13': '부처님오신날',
  '2027-06-06': '현충일',
  '2027-07-17': '제헌절',
  '2027-07-19': '제헌절 대체공휴일',
  '2027-08-15': '광복절',
  '2027-08-16': '광복절 대체공휴일',
  '2027-09-14': '추석 연휴',
  '2027-09-15': '추석',
  '2027-09-16': '추석 연휴',
  '2027-10-03': '개천절',
  '2027-10-04': '개천절 대체공휴일',
  '2027-10-09': '한글날',
  '2027-10-11': '한글날 대체공휴일',
  '2027-12-25': '성탄절',
  '2027-12-27': '성탄절 대체공휴일',
  // 2028
  '2028-01-01': '신정',
  '2028-01-26': '설날 연휴',
  '2028-01-27': '설날',
  '2028-01-28': '설날 연휴',
  '2028-03-01': '삼일절',
  '2028-04-12': '국회의원 선거',
  '2028-05-02': '부처님오신날',
  '2028-05-05': '어린이날',
  '2028-06-06': '현충일',
  '2028-07-17': '제헌절',
  '2028-08-15': '광복절',
  '2028-10-02': '추석 연휴',
  '2028-10-03': '추석 · 개천절',
  '2028-10-04': '추석 연휴',
  '2028-10-05': '추석 · 개천절 대체공휴일',
  '2028-10-09': '한글날',
  '2028-12-25': '성탄절',
  // 2029
  '2029-01-01': '신정',
  '2029-02-12': '설날 연휴',
  '2029-02-13': '설날',
  '2029-02-14': '설날 연휴',
  '2029-03-01': '삼일절',
  '2029-05-05': '어린이날',
  '2029-05-07': '어린이날 대체공휴일',
  '2029-05-20': '부처님오신날',
  '2029-05-21': '부처님오신날 대체공휴일',
  '2029-06-06': '현충일',
  '2029-07-17': '제헌절',
  '2029-08-15': '광복절',
  '2029-09-21': '추석 연휴',
  '2029-09-22': '추석',
  '2029-09-23': '추석 연휴',
  '2029-09-24': '추석 대체공휴일',
  '2029-10-03': '개천절',
  '2029-10-09': '한글날',
  '2029-12-25': '성탄절',
  // 2030
  '2030-01-01': '신정',
  '2030-02-02': '설날 연휴',
  '2030-02-03': '설날',
  '2030-02-04': '설날 연휴',
  '2030-02-05': '설날 대체공휴일',
  '2030-03-01': '삼일절',
  '2030-05-05': '어린이날',
  '2030-05-06': '어린이날 대체공휴일',
  '2030-05-09': '부처님오신날',
  '2030-06-06': '현충일',
  '2030-06-12': '전국동시지방선거',
  '2030-07-17': '제헌절',
  '2030-08-15': '광복절',
  '2030-09-11': '추석 연휴',
  '2030-09-12': '추석',
  '2030-09-13': '추석 연휴',
  '2030-10-03': '개천절',
  '2030-10-09': '한글날',
  '2030-12-25': '성탄절',
};

const FIXED_ANNUAL_HOLIDAYS: Readonly<Record<string, string>> = {
  '01-01': '신정',
  '03-01': '삼일절',
  '05-05': '어린이날',
  '06-06': '현충일',
  '07-17': '제헌절',
  '08-15': '광복절',
  '10-03': '개천절',
  '10-09': '한글날',
  '12-25': '성탄절',
};

export function getKoreanHolidayName(dateStr: string): string | null {
  if (!isValidDateStr(dateStr)) return null;
  if (KOREAN_HOLIDAYS[dateStr]) return KOREAN_HOLIDAYS[dateStr];
  const year = Number(dateStr.slice(0, 4));
  if (year < 2026 || year > 2030) {
    return FIXED_ANNUAL_HOLIDAYS[dateStr.slice(5)] ?? null;
  }
  return null;
}

export function isKoreanWorkday(dateStr: string): boolean {
  if (!isValidDateStr(dateStr)) return true;
  const weekday = getWeekday(dateStr);
  if (weekday === 0 || weekday === 6) return false;
  return getKoreanHolidayName(dateStr) === null;
}

export function getNonWorkdayReason(dateStr: string): string | null {
  if (!isValidDateStr(dateStr)) return null;
  const holiday = getKoreanHolidayName(dateStr);
  if (holiday) return holiday;
  const weekday = getWeekday(dateStr);
  if (weekday === 0) return '일요일';
  if (weekday === 6) return '토요일';
  return null;
}

function findNextWorkdayOnOrAfter(startDate: string, maxDays = 60): string {
  for (let offset = 0; offset <= maxDays; offset += 1) {
    const candidate = offset === 0 ? startDate : addDays(startDate, offset);
    if (isKoreanWorkday(candidate)) return candidate;
  }
  return startDate;
}

function countWorkdaysElapsed(firstWorkday: string, toDate: string): number {
  const days = diffDays(firstWorkday, toDate);
  if (days <= 0) return 0;
  let count = 0;
  for (let step = 1; step <= days && step <= 3650; step += 1) {
    if (isKoreanWorkday(addDays(firstWorkday, step))) {
      count += 1;
    }
  }
  return count;
}

function clampInt(val: unknown, min: number, max: number, fallback: number): number {
  const num = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(num)) return fallback;
  const rounded = Math.trunc(num);
  if (rounded < min) return min;
  if (rounded > max) return max;
  return rounded;
}

export function normalizeRecurrenceRule(
  raw: Partial<TodoRecurrenceRule> | undefined | null,
  anchorDate: string
): TodoRecurrenceRule {
  const safeAnchor = isValidDateStr(anchorDate) ? anchorDate : getKstTodayDateStr();
  const anchorParts = parseDateParts(safeAnchor);

  const rawType = typeof raw?.type === 'string' ? raw.type : 'none';
  const type: RecurrenceType = VALID_RECURRENCE_TYPES.has(rawType as RecurrenceType)
    ? (rawType as RecurrenceType)
    : 'none';

  const rawEnd = typeof raw?.endDate === 'string' && isValidDateStr(raw.endDate) ? raw.endDate : null;

  if (type === 'none') {
    return {
      type: 'none',
      interval: 1,
      weekdays: null,
      monthDay: null,
      yearMonth: null,
      yearDay: null,
      endDate: null,
    };
  }

  if (type === 'daily' || type === 'workday') {
    return {
      type,
      interval: clampInt(raw?.interval, 1, 365, 1),
      weekdays: null,
      monthDay: null,
      yearMonth: null,
      yearDay: null,
      endDate: rawEnd,
    };
  }

  if (type === 'weekly') {
    const rawDays = Array.isArray(raw?.weekdays) ? raw.weekdays : [];
    const cleaned = Array.from(
      new Set(
        rawDays
          .map((d) => (typeof d === 'number' ? Math.trunc(d) : Number(d)))
          .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
      )
    ).sort((a, b) => a - b);

    const weekdays = cleaned.length > 0 ? cleaned : [getWeekday(safeAnchor)];
    return {
      type: 'weekly',
      interval: clampInt(raw?.interval, 1, 52, 1),
      weekdays,
      monthDay: null,
      yearMonth: null,
      yearDay: null,
      endDate: rawEnd,
    };
  }

  if (type === 'monthly') {
    return {
      type: 'monthly',
      interval: clampInt(raw?.interval, 1, 12, 1),
      weekdays: null,
      monthDay: clampInt(raw?.monthDay, 1, 31, anchorParts.day),
      yearMonth: null,
      yearDay: null,
      endDate: rawEnd,
    };
  }

  // yearly
  return {
    type: 'yearly',
    interval: clampInt(raw?.interval, 1, 10, 1),
    weekdays: null,
    monthDay: null,
    yearMonth: clampInt(raw?.yearMonth, 1, 12, anchorParts.month),
    yearDay: clampInt(raw?.yearDay, 1, 31, anchorParts.day),
    endDate: rawEnd,
  };
}

export function formatRecurrenceSummary(rule: TodoRecurrenceRule): string {
  switch (rule.type) {
    case 'none':
      return '';
    case 'daily':
      return rule.interval === 1 ? '매일' : `${rule.interval}일마다`;
    case 'workday':
      return rule.interval === 1 ? '영업일 매일' : `${rule.interval}영업일마다`;
    case 'weekly': {
      const days = rule.weekdays && rule.weekdays.length > 0 ? rule.weekdays : [];
      const key = days.join(',');
      if (rule.interval === 1 && key === '1,2,3,4,5') return '평일 매일';
      if (rule.interval === 1 && key === '0,6') return '주말마다';
      if (rule.interval === 1 && key === '0,1,2,3,4,5,6') return '매일';
      const labels = days.map((d) => WEEKDAY_KOREAN[d] ?? '').filter(Boolean).join('·');
      const prefix = rule.interval === 1 ? '매주' : `${rule.interval}주마다`;
      return labels ? `${prefix} ${labels}` : prefix;
    }
    case 'monthly': {
      const prefix = rule.interval === 1 ? '매월' : `${rule.interval}개월마다`;
      return `${prefix} ${rule.monthDay ?? 1}일`;
    }
    case 'yearly': {
      const prefix = rule.interval === 1 ? '매년' : `${rule.interval}년마다`;
      return `${prefix} ${rule.yearMonth ?? 1}월 ${rule.yearDay ?? 1}일`;
    }
  }
}

export function getPeriodKeyForDate(rule: TodoRecurrenceRule, targetDate: string): string | null {
  switch (rule.type) {
    case 'none':
      return null;
    case 'daily':
    case 'workday':
    case 'weekly':
      return targetDate;
    case 'monthly':
      return targetDate.slice(0, 7);
    case 'yearly':
      return targetDate.slice(0, 4);
  }
}

export function evaluateTodoOccurrence(params: {
  readonly rule: TodoRecurrenceRule;
  readonly anchorDate: string;
  readonly lastCompletedPeriod: string | null;
  readonly completed: boolean;
  readonly targetDate: string;
}): TodoOccurrenceState {
  const { rule, lastCompletedPeriod, completed } = params;
  const targetDate = isValidDateStr(params.targetDate) ? params.targetDate : getKstTodayDateStr();
  const anchorDate = isValidDateStr(params.anchorDate) ? params.anchorDate : targetDate;

  if (rule.type === 'none') {
    return {
      isRecurring: false,
      isCompletedForPeriod: completed,
      isDueToday: Boolean(params.anchorDate && isValidDateStr(params.anchorDate) && params.anchorDate === targetDate),
      currentPeriodKey: null,
      nextOccurrenceDate: null,
      summaryLabel: '',
    };
  }

  const summaryLabel = formatRecurrenceSummary(rule);
  const currentPeriodKey = getPeriodKeyForDate(rule, targetDate);
  const isCompletedForPeriod = Boolean(currentPeriodKey && lastCompletedPeriod === currentPeriodKey);

  if (rule.endDate && targetDate > rule.endDate) {
    return {
      isRecurring: true,
      isCompletedForPeriod,
      isDueToday: false,
      currentPeriodKey,
      nextOccurrenceDate: null,
      summaryLabel,
    };
  }

  const respectsEnd = (d: string): boolean => !rule.endDate || d <= rule.endDate;

  if (rule.type === 'daily') {
    const delta = diffDays(anchorDate, targetDate);
    const interval = Math.max(1, rule.interval);
    const isDueToday = delta >= 0 && delta % interval === 0;

    let nextDate: string | null = null;
    const scanStart = isCompletedForPeriod ? addDays(targetDate, 1) : targetDate;
    const scanFromAnchor = diffDays(anchorDate, scanStart);
    if (scanFromAnchor <= 0) {
      nextDate = anchorDate;
    } else {
      const rem = scanFromAnchor % interval;
      const offset = rem === 0 ? 0 : interval - rem;
      nextDate = addDays(scanStart, offset);
    }
    if (nextDate && !respectsEnd(nextDate)) {
      nextDate = null;
    }

    return {
      isRecurring: true,
      isCompletedForPeriod,
      isDueToday,
      currentPeriodKey,
      nextOccurrenceDate: nextDate,
      summaryLabel,
    };
  }

  if (rule.type === 'workday') {
    const interval = Math.max(1, rule.interval);
    const firstWorkday = findNextWorkdayOnOrAfter(anchorDate);
    const todayIsWorkday = isKoreanWorkday(targetDate);

    let isDueToday = false;
    if (todayIsWorkday && targetDate >= firstWorkday) {
      if (interval === 1) {
        isDueToday = true;
      } else {
        const elapsed = countWorkdaysElapsed(firstWorkday, targetDate);
        isDueToday = elapsed % interval === 0;
      }
    }

    let nextDate: string | null = null;
    const scanStart = isCompletedForPeriod
      ? addDays(targetDate, 1)
      : targetDate < firstWorkday
        ? firstWorkday
        : targetDate;

    if (interval === 1) {
      nextDate = findNextWorkdayOnOrAfter(scanStart);
    } else {
      let cursor = findNextWorkdayOnOrAfter(scanStart);
      let elapsed = cursor <= firstWorkday ? 0 : countWorkdaysElapsed(firstWorkday, cursor);
      for (let guard = 0; guard < 1500; guard += 1) {
        if (cursor >= scanStart && elapsed % interval === 0) {
          nextDate = cursor;
          break;
        }
        cursor = findNextWorkdayOnOrAfter(addDays(cursor, 1));
        elapsed += 1;
      }
    }

    if (nextDate && !respectsEnd(nextDate)) {
      nextDate = null;
    }

    return {
      isRecurring: true,
      isCompletedForPeriod,
      isDueToday,
      currentPeriodKey,
      nextOccurrenceDate: nextDate,
      summaryLabel,
    };
  }

  if (rule.type === 'weekly') {
    const interval = Math.max(1, rule.interval);
    const weekdays = rule.weekdays && rule.weekdays.length > 0 ? rule.weekdays : [getWeekday(anchorDate)];
    const anchorWeekStart = getWeekStartSunday(anchorDate);

    const occursOn = (d: string): boolean => {
      if (d < anchorDate) return false;
      const wkDiff = Math.floor(diffDays(anchorWeekStart, getWeekStartSunday(d)) / 7);
      return wkDiff >= 0 && wkDiff % interval === 0 && weekdays.includes(getWeekday(d));
    };

    const isDueToday = occursOn(targetDate);
    let nextDate: string | null = null;
    const startScan = isCompletedForPeriod ? addDays(targetDate, 1) : (targetDate < anchorDate ? anchorDate : targetDate);
    const maxScan = interval * 7 + 14;
    for (let i = 0; i <= maxScan; i += 1) {
      const candidate = addDays(startScan, i);
      if (!respectsEnd(candidate)) break;
      if (occursOn(candidate)) {
        nextDate = candidate;
        break;
      }
    }

    return {
      isRecurring: true,
      isCompletedForPeriod,
      isDueToday,
      currentPeriodKey,
      nextOccurrenceDate: nextDate,
      summaryLabel,
    };
  }

  if (rule.type === 'monthly') {
    const interval = Math.max(1, rule.interval);
    const monthDay = rule.monthDay ?? parseDateParts(anchorDate).day;
    const aParts = parseDateParts(anchorDate);
    const tParts = parseDateParts(targetDate);

    const getMonthOccurrence = (y: number, m1To12: number): string =>
      formatDateParts(y, m1To12, clampDay(y, m1To12, monthDay));

    const monthDiff = (tParts.year - aParts.year) * 12 + (tParts.month - aParts.month);
    const thisMonthOcc = getMonthOccurrence(tParts.year, tParts.month);
    const isDueToday =
      monthDiff >= 0 &&
      monthDiff % interval === 0 &&
      thisMonthOcc >= anchorDate &&
      targetDate === thisMonthOcc;

    let nextDate: string | null = null;
    const startOffset = Math.max(0, monthDiff);
    for (let step = 0; step <= interval * 24; step += 1) {
      const absMonths = aParts.year * 12 + (aParts.month - 1) + startOffset + step;
      const candYear = Math.floor(absMonths / 12);
      const candMonth = (absMonths % 12) + 1;
      const candDiff = (candYear - aParts.year) * 12 + (candMonth - aParts.month);
      if (candDiff < 0 || candDiff % interval !== 0) continue;

      const candPeriodKey = `${candYear}-${padTwo(candMonth)}`;
      if (isCompletedForPeriod && candPeriodKey === currentPeriodKey) continue;

      const occ = getMonthOccurrence(candYear, candMonth);
      if (occ < anchorDate) continue;
      if (!isCompletedForPeriod && occ < targetDate) continue;
      if (isCompletedForPeriod && occ <= targetDate) continue;
      if (!respectsEnd(occ)) {
        nextDate = null;
        break;
      }
      nextDate = occ;
      break;
    }

    return {
      isRecurring: true,
      isCompletedForPeriod,
      isDueToday,
      currentPeriodKey,
      nextOccurrenceDate: nextDate,
      summaryLabel,
    };
  }

  // yearly
  const interval = Math.max(1, rule.interval);
  const aParts = parseDateParts(anchorDate);
  const tParts = parseDateParts(targetDate);
  const yearMonth = rule.yearMonth ?? aParts.month;
  const yearDay = rule.yearDay ?? aParts.day;

  const getYearOccurrence = (y: number): string =>
    formatDateParts(y, yearMonth, clampDay(y, yearMonth, yearDay));

  const yearDiff = tParts.year - aParts.year;
  const thisYearOcc = getYearOccurrence(tParts.year);
  const isDueToday =
    yearDiff >= 0 &&
    yearDiff % interval === 0 &&
    thisYearOcc >= anchorDate &&
    targetDate === thisYearOcc;

  let nextDate: string | null = null;
  const startYear = Math.max(aParts.year, tParts.year);
  for (let step = 0; step <= interval * 10; step += 1) {
    const candYear = startYear + step;
    const candDiff = candYear - aParts.year;
    if (candDiff < 0 || candDiff % interval !== 0) continue;

    const candPeriodKey = String(candYear);
    if (isCompletedForPeriod && candPeriodKey === currentPeriodKey) continue;

    const occ = getYearOccurrence(candYear);
    if (occ < anchorDate) continue;
    if (!isCompletedForPeriod && occ < targetDate) continue;
    if (isCompletedForPeriod && occ <= targetDate) continue;
    if (!respectsEnd(occ)) {
      nextDate = null;
      break;
    }
    nextDate = occ;
    break;
  }

  return {
    isRecurring: true,
    isCompletedForPeriod,
    isDueToday,
    currentPeriodKey,
    nextOccurrenceDate: nextDate,
    summaryLabel,
  };
}

export function getPreviousPeriodKey(
  rule: TodoRecurrenceRule,
  anchorDate: string,
  currentPeriodKey: string
): string | null {
  if (rule.type === 'none') return null;

  if (rule.type === 'daily') {
    if (!isValidDateStr(currentPeriodKey)) return null;
    return addDays(currentPeriodKey, -Math.max(1, rule.interval));
  }
  if (rule.type === 'workday') {
    if (!isValidDateStr(currentPeriodKey)) return null;
    let remaining = Math.max(1, rule.interval);
    let cursor = currentPeriodKey;
    for (let step = 0; step < 365; step += 1) {
      cursor = addDays(cursor, -1);
      if (isKoreanWorkday(cursor)) {
        remaining -= 1;
        if (remaining === 0) return cursor;
      }
    }
    return null;
  }

  if (rule.type === 'weekly') {
    if (!isValidDateStr(currentPeriodKey)) return null;
    const interval = Math.max(1, rule.interval);
    const weekdays = rule.weekdays && rule.weekdays.length > 0 ? rule.weekdays : [getWeekday(anchorDate)];
    const anchorWeekStart = getWeekStartSunday(anchorDate);
    const maxBack = interval * 7 + 14;
    for (let i = 1; i <= maxBack; i += 1) {
      const candidate = addDays(currentPeriodKey, -i);
      const wkDiff = Math.floor(diffDays(anchorWeekStart, getWeekStartSunday(candidate)) / 7);
      if (wkDiff % interval === 0 && weekdays.includes(getWeekday(candidate))) {
        return candidate;
      }
    }
    return null;
  }

  if (rule.type === 'monthly') {
    if (!/^\d{4}-\d{2}$/.test(currentPeriodKey)) return null;
    const [y, m] = currentPeriodKey.split('-').map(Number);
    const total = y * 12 + (m - 1) - Math.max(1, rule.interval);
    if (total < 0) return null;
    const prevY = Math.floor(total / 12);
    const prevM = (total % 12) + 1;
    return `${prevY}-${padTwo(prevM)}`;
  }

  if (!/^\d{4}$/.test(currentPeriodKey)) return null;
  return String(Number(currentPeriodKey) - Math.max(1, rule.interval));
}
