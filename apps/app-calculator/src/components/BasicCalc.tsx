interface BasicCalcProps {
  hasMemory: boolean;
  hasLastAnswer: boolean;
  onDigit: (digit: string) => void;
  onOperator: (op: '+' | '-' | '×' | '÷' | '%') => void;
  onUnaryNegate: () => void;
  onBackspace: () => void;
  onClearAll: () => void;
  onCalculate: () => void;
  onUseLastAnswer: () => void;
  onMemoryClear: () => void;
  onMemoryRecall: () => void;
  onMemoryAdd: () => void;
  onMemorySubtract: () => void;
}

export function BasicCalc({
  hasMemory,
  hasLastAnswer,
  onDigit,
  onOperator,
  onUnaryNegate,
  onBackspace,
  onClearAll,
  onCalculate,
  onUseLastAnswer,
  onMemoryClear,
  onMemoryRecall,
  onMemoryAdd,
  onMemorySubtract,
}: BasicCalcProps) {
  return (
    <div id="calc-basic" className="space-y-2 select-none">
      {/* 컴팩트 메모리 & 직전 결과 바 (h-7) */}
      <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="메모리 기능">
        <button
          type="button"
          onClick={onMemoryClear}
          disabled={!hasMemory}
          className="h-7 rounded-lg text-[11px] font-black nm-key-fn disabled:opacity-40 cursor-pointer disabled:cursor-default"
          title="메모리 초기화 (MC)"
        >
          MC
        </button>
        <button
          type="button"
          onClick={onMemoryRecall}
          disabled={!hasMemory}
          className="h-7 rounded-lg text-[11px] font-black nm-key-fn disabled:opacity-40 cursor-pointer disabled:cursor-default"
          title="메모리 불러오기 (MR)"
        >
          MR
        </button>
        <button
          type="button"
          onClick={onMemoryAdd}
          className="h-7 rounded-lg text-[11px] font-black nm-key-fn cursor-pointer"
          title="현재 값 메모리에 더하기 (M+)"
        >
          M+
        </button>
        <button
          type="button"
          onClick={onMemorySubtract}
          className="h-7 rounded-lg text-[11px] font-black nm-key-fn cursor-pointer"
          title="현재 값 메모리에서 빼기 (M-)"
        >
          M-
        </button>
        <button
          type="button"
          onClick={onUseLastAnswer}
          disabled={!hasLastAnswer}
          className="h-7 rounded-lg text-[11px] font-black nm-key-fn disabled:opacity-40 cursor-pointer disabled:cursor-default"
          title="직전 계산 결과 삽입 (Ans)"
        >
          Ans
        </button>
      </div>

      {/* 4열 × 5행 웜 뉴모피즘 키패드 (680px Zero-Scroll 규격) */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={onClearAll}
          aria-label="전체 지우기"
          className="h-10 sm:h-12 rounded-xl text-sm font-black nm-key-clear cursor-pointer"
        >
          AC
        </button>
        <button
          type="button"
          onClick={onBackspace}
          aria-label="한 글자 지우기"
          className="h-10 sm:h-12 rounded-xl text-sm font-bold nm-key-fn cursor-pointer flex items-center justify-center"
        >
          <i className="fas fa-delete-left" aria-hidden="true"></i>
        </button>
        <button
          type="button"
          onClick={() => onOperator('%')}
          aria-label="퍼센트"
          className="h-10 sm:h-12 rounded-xl text-base font-black nm-key-fn cursor-pointer"
        >
          %
        </button>
        <button
          type="button"
          onClick={() => onOperator('÷')}
          aria-label="나누기"
          className="h-10 sm:h-12 rounded-xl text-lg font-black nm-key-op cursor-pointer"
        >
          ÷
        </button>

        <button
          type="button"
          onClick={() => onDigit('7')}
          data-screenshot-click="action"
          className="h-10 sm:h-12 rounded-xl text-base sm:text-lg font-extrabold nm-key-base cursor-pointer font-calc-mono"
        >
          7
        </button>
        <button
          type="button"
          onClick={() => onDigit('8')}
          className="h-10 sm:h-12 rounded-xl text-base sm:text-lg font-extrabold nm-key-base cursor-pointer font-calc-mono"
        >
          8
        </button>
        <button
          type="button"
          onClick={() => onDigit('9')}
          className="h-10 sm:h-12 rounded-xl text-base sm:text-lg font-extrabold nm-key-base cursor-pointer font-calc-mono"
        >
          9
        </button>
        <button
          type="button"
          onClick={() => onOperator('×')}
          aria-label="곱하기"
          className="h-10 sm:h-12 rounded-xl text-lg font-black nm-key-op cursor-pointer"
        >
          ×
        </button>

        <button
          type="button"
          onClick={() => onDigit('4')}
          className="h-10 sm:h-12 rounded-xl text-base sm:text-lg font-extrabold nm-key-base cursor-pointer font-calc-mono"
        >
          4
        </button>
        <button
          type="button"
          onClick={() => onDigit('5')}
          className="h-10 sm:h-12 rounded-xl text-base sm:text-lg font-extrabold nm-key-base cursor-pointer font-calc-mono"
        >
          5
        </button>
        <button
          type="button"
          onClick={() => onDigit('6')}
          className="h-10 sm:h-12 rounded-xl text-base sm:text-lg font-extrabold nm-key-base cursor-pointer font-calc-mono"
        >
          6
        </button>
        <button
          type="button"
          onClick={() => onOperator('-')}
          aria-label="빼기"
          className="h-10 sm:h-12 rounded-xl text-lg font-black nm-key-op cursor-pointer"
        >
          -
        </button>

        <button
          type="button"
          onClick={() => onDigit('1')}
          className="h-10 sm:h-12 rounded-xl text-base sm:text-lg font-extrabold nm-key-base cursor-pointer font-calc-mono"
        >
          1
        </button>
        <button
          type="button"
          onClick={() => onDigit('2')}
          className="h-10 sm:h-12 rounded-xl text-base sm:text-lg font-extrabold nm-key-base cursor-pointer font-calc-mono"
        >
          2
        </button>
        <button
          type="button"
          onClick={() => onDigit('3')}
          className="h-10 sm:h-12 rounded-xl text-base sm:text-lg font-extrabold nm-key-base cursor-pointer font-calc-mono"
        >
          3
        </button>
        <button
          type="button"
          onClick={() => onOperator('+')}
          aria-label="더하기"
          className="h-10 sm:h-12 rounded-xl text-lg font-black nm-key-op cursor-pointer"
        >
          +
        </button>

        <button
          type="button"
          onClick={onUnaryNegate}
          aria-label="부호 전환"
          className="h-10 sm:h-12 rounded-xl text-sm font-black nm-key-fn cursor-pointer"
        >
          ±
        </button>
        <button
          type="button"
          onClick={() => onDigit('0')}
          className="h-10 sm:h-12 rounded-xl text-base sm:text-lg font-extrabold nm-key-base cursor-pointer font-calc-mono"
        >
          0
        </button>
        <button
          type="button"
          onClick={() => onDigit('.')}
          aria-label="소수점"
          className="h-10 sm:h-12 rounded-xl text-lg font-black nm-key-base cursor-pointer font-calc-mono"
        >
          .
        </button>
        <button
          type="button"
          onClick={onCalculate}
          data-screenshot-click="result"
          aria-label="계산 실행"
          className="h-10 sm:h-12 rounded-xl text-lg font-black nm-key-equal cursor-pointer"
        >
          =
        </button>
      </div>
    </div>
  );
}

export default BasicCalc;
