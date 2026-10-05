export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  isSubstitute?: boolean; // 대체공휴일 여부
}

export interface DayInfo {
  dateStr: string; // YYYY-MM-DD
  year: number;
  month: number;
  day: number;
  dayOfWeek: number; // 0=일, 6=토
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  isVacation?: boolean;
}

export interface VacationPlan {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number; // 연속 총 휴일 수
  vacationDaysUsed: number; // 소진 연차 일수
  efficiency: number; // 가성비 지수 = (totalDays / vacationDaysUsed) * 100 (%)
  vacationDates: string[]; // 연차를 써야 하는 날짜 목록
  holidayDates: string[]; // 포함된 공휴일 날짜 목록
  weekendDates: string[]; // 포함된 주말 날짜 목록
  description: string;
  month: number;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
}
