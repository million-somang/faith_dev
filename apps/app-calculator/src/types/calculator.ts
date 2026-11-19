export type CalcMode = 'basic' | 'scientific';
export type PageTab = 'calc' | 'howto' | 'faq';
export type AngleUnit = 'DEG' | 'RAD';
export type LegalModalType = 'about' | 'privacy' | 'terms' | 'contact' | null;

export interface CalcHistoryItem {
  id: string;
  mode: CalcMode;
  angleUnit: AngleUnit;
  expression: string;
  result: string;
  timestamp: number;
}

export interface EvalResult {
  ok: boolean;
  value: number;
  formatted: string;
  errorMessage?: string;
}
