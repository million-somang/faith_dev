import type { AngleUnit } from '../types/calculator';

interface ScientificCalcProps {
  angleUnit: AngleUnit;
  isSecondFunc: boolean;
  hasMemory: boolean;
  hasLastAnswer: boolean;
  onToggleAngleUnit: () => void;
  onToggleSecondFunc: () => void;
  onDigit: (digit: string) => void;
  onOperator: (op: '+' | '-' | '×' | '÷' | '^' | '%') => void;
  onConstant: (symbol: 'π' | 'e') => void;
  onParen: (paren: '(' | ')') => void;
  onFunction: (fnToken: string) => void;
  onUnary: (action: 'negate' | 'reciprocal' | 'square' | 'cube' | 'factorial' | 'abs') => void;
  onBackspace: () => void;
  onClearAll: () => void;
  onCalculate: () => void;
  onUseLastAnswer: () => void;
  onMemoryClear: () => void;
  onMemoryRecall: () => void;
  onMemoryAdd: () => void;
}

export function ScientificCalc({
  angleUnit,
  isSecondFunc,
  hasMemory,
  hasLastAnswer,
  onToggleAngleUnit,
  onToggleSecondFunc,
  onDigit,
  onOperator,
  onConstant,
  onParen,
  onFunction,
  onUnary,
  onBackspace,
  onClearAll,
  onCalculate,
  onUseLastAnswer,
  onMemoryClear,
  onMemoryRecall,
  onMemoryAdd,
}: ScientificCalcProps) {
  return (
    <div id="calc-scientific" className="space-y-1.5 select-none">
      {/* 상단 공학 제어 & 메모리 바 (h-7) */}
      <div className="grid grid-cols-6 gap-1.5" role="group" aria-label="각도 단위 및 메모리">
        <button
          type="button"
          onClick={onToggleAngleUnit}
          aria-label={`각도 단위 전환 (현재 ${angleUnit})`}
          className="h-7 rounded-lg text-[10px] font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
        >
          {angleUnit}
        </button>
        <button
          type="button"
          onClick={onToggleSecondFunc}
          aria-pressed={isSecondFunc}
          className={`h-7 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
            isSecondFunc
              ? 'bg-[#2D2A26] text-white border-[#2D2A26] shadow-2xs'
              : 'nm-key-fn'
          }`}
        >
          2nd
        </button>
        <button
          type="button"
          onClick={onMemoryClear}
          disabled={!hasMemory}
          className="h-7 rounded-lg text-[10px] font-black nm-key-fn disabled:opacity-40 cursor-pointer disabled:cursor-default"
        >
          MC
        </button>
        <button
          type="button"
          onClick={onMemoryRecall}
          disabled={!hasMemory}
          className="h-7 rounded-lg text-[10px] font-black nm-key-fn disabled:opacity-40 cursor-pointer disabled:cursor-default"
        >
          MR
        </button>
        <button
          type="button"
          onClick={onMemoryAdd}
          className="h-7 rounded-lg text-[10px] font-black nm-key-fn cursor-pointer"
        >
          M+
        </button>
        <button
          type="button"
          onClick={onUseLastAnswer}
          disabled={!hasLastAnswer}
          className="h-7 rounded-lg text-[10px] font-black nm-key-fn disabled:opacity-40 cursor-pointer disabled:cursor-default"
        >
          Ans
        </button>
      </div>

      {/* 5열 × 7행 컴팩트 공학 키패드 (680px Zero-Scroll 보장) */}
      <div className="grid grid-cols-5 gap-1.5">
        {/* Row 1: 삼각함수 / 역삼각함수 / 로그 */}
        <button
          type="button"
          onClick={() => onFunction(isSecondFunc ? 'asin(' : 'sin(')}
          className="h-[34px] sm:h-10 rounded-xl text-[11px] sm:text-xs font-extrabold nm-key-fn cursor-pointer"
        >
          {isSecondFunc ? 'sin⁻¹' : 'sin'}
        </button>
        <button
          type="button"
          onClick={() => onFunction(isSecondFunc ? 'acos(' : 'cos(')}
          className="h-[34px] sm:h-10 rounded-xl text-[11px] sm:text-xs font-extrabold nm-key-fn cursor-pointer"
        >
          {isSecondFunc ? 'cos⁻¹' : 'cos'}
        </button>
        <button
          type="button"
          onClick={() => onFunction(isSecondFunc ? 'atan(' : 'tan(')}
          className="h-[34px] sm:h-10 rounded-xl text-[11px] sm:text-xs font-extrabold nm-key-fn cursor-pointer"
        >
          {isSecondFunc ? 'tan⁻¹' : 'tan'}
        </button>
        <button
          type="button"
          onClick={() => onFunction(isSecondFunc ? '10^(' : 'log(')}
          className="h-[34px] sm:h-10 rounded-xl text-[11px] sm:text-xs font-extrabold nm-key-fn cursor-pointer"
        >
          {isSecondFunc ? '10ˣ' : 'log'}
        </button>
        <button
          type="button"
          onClick={() => onFunction(isSecondFunc ? 'e^(' : 'ln(')}
          className="h-[34px] sm:h-10 rounded-xl text-[11px] sm:text-xs font-extrabold nm-key-fn cursor-pointer"
        >
          {isSecondFunc ? 'eˣ' : 'ln'}
        </button>

        {/* Row 2: 제곱·세제곱 / 루트·세제곱근 / 거듭제곱 / 팩토리얼 / 역수 */}
        <button
          type="button"
          onClick={() => onUnary(isSecondFunc ? 'cube' : 'square')}
          className="h-[34px] sm:h-10 rounded-xl text-[11px] sm:text-xs font-extrabold nm-key-fn cursor-pointer"
        >
          {isSecondFunc ? 'x³' : 'x²'}
        </button>
        <button
          type="button"
          onClick={() => onFunction(isSecondFunc ? 'cbrt(' : 'sqrt(')}
          className="h-[34px] sm:h-10 rounded-xl text-xs sm:text-sm font-extrabold nm-key-fn cursor-pointer"
        >
          {isSecondFunc ? '∛' : '√'}
        </button>
        <button
          type="button"
          onClick={() => onOperator('^')}
          className="h-[34px] sm:h-10 rounded-xl text-[11px] sm:text-xs font-extrabold nm-key-fn cursor-pointer"
        >
          xʸ
        </button>
        <button
          type="button"
          onClick={() => onUnary('factorial')}
          className="h-[34px] sm:h-10 rounded-xl text-[11px] sm:text-xs font-extrabold nm-key-fn cursor-pointer"
        >
          n!
        </button>
        <button
          type="button"
          onClick={() => onUnary(isSecondFunc ? 'abs' : 'reciprocal')}
          className="h-[34px] sm:h-10 rounded-xl text-[11px] sm:text-xs font-extrabold nm-key-fn cursor-pointer"
        >
          {isSecondFunc ? '|x|' : '1/x'}
        </button>

        {/* Row 3: 괄호 / 상수 / 백스페이스 */}
        <button
          type="button"
          onClick={() => onParen('(')}
          className="h-[34px] sm:h-10 rounded-xl text-xs sm:text-sm font-black nm-key-fn cursor-pointer"
        >
          (
        </button>
        <button
          type="button"
          onClick={() => onParen(')')}
          className="h-[34px] sm:h-10 rounded-xl text-xs sm:text-sm font-black nm-key-fn cursor-pointer"
        >
          )
        </button>
        <button
          type="button"
          onClick={() => onConstant('π')}
          className="h-[34px] sm:h-10 rounded-xl text-xs sm:text-sm font-black nm-key-fn cursor-pointer"
        >
          π
        </button>
        <button
          type="button"
          onClick={() => onConstant('e')}
          className="h-[34px] sm:h-10 rounded-xl text-xs sm:text-sm font-black nm-key-fn cursor-pointer"
        >
          e
        </button>
        <button
          type="button"
          onClick={onBackspace}
          aria-label="한 글자 지우기"
          className="h-[34px] sm:h-10 rounded-xl text-xs sm:text-sm font-bold nm-key-fn cursor-pointer flex items-center justify-center"
        >
          <i className="fas fa-delete-left" aria-hidden="true"></i>
        </button>

        {/* Row 4 */}
        <button
          type="button"
          onClick={() => onDigit('7')}
          className="h-[34px] sm:h-10 rounded-xl text-sm sm:text-base font-extrabold nm-key-base cursor-pointer font-calc-mono"
        >
          7
        </button>
        <button
          type="button"
          onClick={() => onDigit('8')}
          className="h-[34px] sm:h-10 rounded-xl text-sm sm:text-base font-extrabold nm-key-base cursor-pointer font-calc-mono"
        >
          8
        </button>
        <button
          type="button"
          onClick={() => onDigit('9')}
          className="h-[34px] sm:h-10 rounded-xl text-sm sm:text-base font-extrabold nm-key-base cursor-pointer font-calc-mono"
        >
          9
        </button>
        <button
          type="button"
          onClick={() => onOperator('÷')}
          aria-label="나누기"
          className="h-[34px] sm:h-10 rounded-xl text-base font-black nm-key-op cursor-pointer"
        >
          ÷
        </button>
        <button
          type="button"
          onClick={onClearAll}
          className="h-[34px] sm:h-10 rounded-xl text-xs font-black nm-key-clear cursor-pointer"
        >
          AC
        </button>

        {/* Row 5 */}
        <button
          type="button"
          onClick={() => onDigit('4')}
          className="h-[34px] sm:h-10 rounded-xl text-sm sm:text-base font-extrabold nm-key-base cursor-pointer font-calc-mono"
        >
          4
        </button>
        <button
          type="button"
          onClick={() => onDigit('5')}
          className="h-[34px] sm:h-10 rounded-xl text-sm sm:text-base font-extrabold nm-key-base cursor-pointer font-calc-mono"
        >
          5
        </button>
        <button
          type="button"
          onClick={() => onDigit('6')}
          className="h-[34px] sm:h-10 rounded-xl text-sm sm:text-base font-extrabold nm-key-base cursor-pointer font-calc-mono"
        >
          6
        </button>
        <button
          type="button"
          onClick={() => onOperator('×')}
          aria-label="곱하기"
          className="h-[34px] sm:h-10 rounded-xl text-base font-black nm-key-op cursor-pointer"
        >
          ×
        </button>
        <button
          type="button"
          onClick={() => onOperator('%')}
          className="h-[34px] sm:h-10 rounded-xl text-xs sm:text-sm font-black nm-key-fn cursor-pointer"
        >
          %
        </button>

        {/* Row 6 */}
        <button
          type="button"
          onClick={() => onDigit('1')}
          className="h-[34px] sm:h-10 rounded-xl text-sm sm:text-base font-extrabold nm-key-base cursor-pointer font-calc-mono"
        >
          1
        </button>
        <button
          type="button"
          onClick={() => onDigit('2')}
          className="h-[34px] sm:h-10 rounded-xl text-sm sm:text-base font-extrabold nm-key-base cursor-pointer font-calc-mono"
        >
          2
        </button>
        <button
          type="button"
          onClick={() => onDigit('3')}
          className="h-[34px] sm:h-10 rounded-xl text-sm sm:text-base font-extrabold nm-key-base cursor-pointer font-calc-mono"
        >
          3
        </button>
        <button
          type="button"
          onClick={() => onOperator('-')}
          aria-label="빼기"
          className="h-[34px] sm:h-10 rounded-xl text-base font-black nm-key-op cursor-pointer"
        >
          -
        </button>
        <button
          type="button"
          onClick={() => onUnary('negate')}
          aria-label="부호 전환"
          className="h-[34px] sm:h-10 rounded-xl text-xs sm:text-sm font-black nm-key-fn cursor-pointer"
        >
          ±
        </button>

        {/* Row 7 */}
        <button
          type="button"
          onClick={() => onDigit('0')}
          className="h-[34px] sm:h-10 rounded-xl text-sm sm:text-base font-extrabold nm-key-base cursor-pointer font-calc-mono"
        >
          0
        </button>
        <button
          type="button"
          onClick={() => onDigit('00')}
          className="h-[34px] sm:h-10 rounded-xl text-xs sm:text-sm font-extrabold nm-key-base cursor-pointer font-calc-mono"
        >
          00
        </button>
        <button
          type="button"
          onClick={() => onDigit('.')}
          className="h-[34px] sm:h-10 rounded-xl text-base font-black nm-key-base cursor-pointer font-calc-mono"
        >
          .
        </button>
        <button
          type="button"
          onClick={() => onOperator('+')}
          aria-label="더하기"
          className="h-[34px] sm:h-10 rounded-xl text-base font-black nm-key-op cursor-pointer"
        >
          +
        </button>
        <button
          type="button"
          onClick={onCalculate}
          data-screenshot-click="result"
          aria-label="계산 실행"
          className="h-[34px] sm:h-10 rounded-xl text-base font-black nm-key-equal cursor-pointer"
        >
          =
        </button>
      </div>
    </div>
  );
}

export default ScientificCalc;
