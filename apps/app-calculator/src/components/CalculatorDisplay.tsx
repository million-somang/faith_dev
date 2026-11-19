import type { AngleUnit, CalcMode } from '../types/calculator';

interface CalculatorDisplayProps {
  mode: CalcMode;
  angleUnit: AngleUnit;
  hasMemory: boolean;
  formattedMemory: string;
  lastFormula: string;
  formattedDisplay: string;
  previewResult: string;
  errorMessage: string;
  onCopyResult: () => void;
}

export function CalculatorDisplay({
  mode,
  angleUnit,
  hasMemory,
  formattedMemory,
  lastFormula,
  formattedDisplay,
  previewResult,
  errorMessage,
  onCopyResult,
}: CalculatorDisplayProps) {
  const displayLen = formattedDisplay.length;
  const mainTextSize =
    displayLen > 18
      ? 'text-lg sm:text-xl'
      : displayLen > 13
        ? 'text-xl sm:text-2xl'
        : 'text-2xl sm:text-3xl';

  return (
    <div
      data-screenshot-point="result"
      role="region"
      aria-live="polite"
      aria-label="계산 수식 및 결과 화면"
      className="calc-lcd-surface rounded-2xl border border-[#DFD8CC] px-3 py-2.5 sm:px-4 sm:py-3 flex flex-col justify-between min-h-[84px] sm:min-h-[96px] select-text"
    >
      {/* 상단 상태 배지 + 원클릭 복사 */}
      <div className="flex items-center justify-between gap-2 text-[10px] mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="px-1.5 py-0.5 rounded-md bg-white/90 border border-[#DDD5C7] text-indigo-700 font-black">
            {mode === 'basic' ? '일반' : `공학 · ${angleUnit}`}
          </span>
          {hasMemory && (
            <span
              className="px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-calc-mono font-extrabold truncate max-w-[110px]"
              title={`메모리 저장값: ${formattedMemory}`}
            >
              M {formattedMemory}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onCopyResult}
          aria-label="계산 결과 복사"
          className="px-2 py-0.5 rounded-lg bg-white hover:bg-indigo-50 text-stone-600 hover:text-indigo-700 border border-[#DDD5C7] font-bold flex items-center gap-1 transition-colors cursor-pointer active:scale-95 shrink-0 select-none"
        >
          <i className="far fa-copy text-[10px]" aria-hidden="true"></i>
          <span>복사</span>
        </button>
      </div>

      {/* 직전 완료 수식 (또는 에러 안내) */}
      <div className="min-h-[16px] text-right text-[11px] font-calc-mono text-stone-500 truncate">
        {lastFormula ? `${lastFormula} =` : '\u00A0'}
      </div>

      {/* 메인 수치 / 수식 입력 라인 */}
      <div
        id="calculator-display"
        className={`text-right font-calc-mono font-bold tracking-tight leading-tight text-[#2D2A26] tabular-nums break-all ${mainTextSize}`}
      >
        {formattedDisplay}
      </div>

      {/* 실시간 중간 계산 미리보기 또는 인라인 오류 메시지 */}
      <div className="min-h-[18px] mt-0.5 text-right font-calc-mono text-xs font-bold truncate">
        {errorMessage ? (
          <span className="text-rose-600" role="alert">
            <i className="fas fa-circle-exclamation mr-1 text-[10px]" aria-hidden="true"></i>
            {errorMessage}
          </span>
        ) : previewResult ? (
          <span className="text-indigo-600 tabular-nums">= {previewResult}</span>
        ) : (
          <span className="text-stone-400 text-[10px] font-sans font-medium">
            키보드 숫자패드 지원
          </span>
        )}
      </div>
    </div>
  );
}

export default CalculatorDisplay;
