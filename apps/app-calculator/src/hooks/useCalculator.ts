import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AngleUnit, CalcHistoryItem, CalcMode } from '../types/calculator';
import {
  evaluateExpression,
  formatDisplayNumber,
  formatExpressionText,
  hasPendingCalculation,
  roundPrecision,
} from '../utils/mathEngine';
import { safeStorage } from '../utils/safeStorage';

declare global {
  interface Document {
    parentKeyboardCallback?: ((key: string) => void) | null;
  }
}

const HISTORY_STORAGE_KEY = 'veranex_calc_history_v2';
const MAX_HISTORY_ITEMS = 30;

function rawValueToExprString(val: number): string {
  const cleaned = roundPrecision(val);
  return Object.is(cleaned, -0) ? '0' : String(cleaned);
}

function getCurrentNumberSegment(expr: string): string {
  const match = expr.match(/([0-9.]+)$/);
  return match ? match[1] : '';
}

function isWrappedInOuterParens(expr: string): boolean {
  if (!expr.startsWith('(') || !expr.endsWith(')')) return false;
  let depth = 0;
  for (let i = 0; i < expr.length; i++) {
    if (expr[i] === '(') depth++;
    else if (expr[i] === ')') {
      depth--;
      if (depth === 0 && i < expr.length - 1) return false;
    }
  }
  return depth === 0;
}

function needsParensForPostfix(expr: string): boolean {
  if (!expr) return false;
  if (/^[0-9.]+$/.test(expr) || expr === 'π' || expr === 'e') return false;
  if (isWrappedInOuterParens(expr)) return false;
  return true;
}

export function useCalculator(isInputActive: boolean) {
  const [mode, setMode] = useState<CalcMode>('basic');
  const [angleUnit, setAngleUnit] = useState<AngleUnit>('DEG');
  const [isSecondFunc, setIsSecondFunc] = useState<boolean>(false);
  const [expression, setExpression] = useState<string>('');
  const [lastFormula, setLastFormula] = useState<string>('');
  const [lastAnswer, setLastAnswer] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [justEvaluated, setJustEvaluated] = useState<boolean>(false);
  const [memory, setMemory] = useState<number>(0);
  const [hasMemory, setHasMemory] = useState<boolean>(false);
  const [history, setHistory] = useState<CalcHistoryItem[]>(() => {
    const stored = safeStorage.get<CalcHistoryItem[]>(HISTORY_STORAGE_KEY, []);
    return Array.isArray(stored) ? stored.slice(0, MAX_HISTORY_ITEMS) : [];
  });

  useEffect(() => {
    safeStorage.set(HISTORY_STORAGE_KEY, history);
  }, [history]);

  const previewResult = useMemo(() => {
    if (!expression || justEvaluated || errorMessage) return '';
    if (!hasPendingCalculation(expression)) return '';
    const res = evaluateExpression(expression, angleUnit);
    return res.ok ? res.formatted : '';
  }, [expression, justEvaluated, errorMessage, angleUnit]);

  const formattedDisplay = useMemo(() => {
    if (!expression) return '0';
    return formatExpressionText(expression);
  }, [expression]);

  const copyableResult = useMemo(() => {
    if (errorMessage) return '';
    if (!expression) return '0';
    const evalRes = evaluateExpression(expression, angleUnit);
    if (evalRes.ok) return evalRes.formatted;
    return formatExpressionText(expression);
  }, [expression, angleUnit, errorMessage]);

  const appendDigit = useCallback(
    (digit: string) => {
      setErrorMessage('');
      if (justEvaluated || errorMessage) {
        setJustEvaluated(false);
        if (digit === '.') {
          setExpression('0.');
        } else if (digit === '00') {
          setExpression('0');
        } else {
          setExpression(digit);
        }
        return;
      }

      setExpression((prev) => {
        if (digit === '.') {
          const seg = getCurrentNumberSegment(prev);
          if (seg.includes('.')) return prev;
          if (!prev || !/[0-9)]$/.test(prev)) {
            if (prev.endsWith(')') || prev.endsWith('π') || prev.endsWith('e') || prev.endsWith('!') || prev.endsWith('%')) {
              return `${prev}×0.`;
            }
            return `${prev}0.`;
          }
          return `${prev}.`;
        }

        if (digit === '00') {
          if (!prev || prev === '0') return '0';
          const seg = getCurrentNumberSegment(prev);
          if (seg === '0') return prev;
          if (!/[0-9.]$/.test(prev)) return `${prev}0`;
          return `${prev}00`;
        }

        const seg = getCurrentNumberSegment(prev);
        if (seg === '0' && prev.endsWith('0')) {
          return `${prev.slice(0, -1)}${digit}`;
        }
        return `${prev}${digit}`;
      });
    },
    [justEvaluated, errorMessage]
  );

  const appendOperator = useCallback(
    (op: '+' | '-' | '×' | '÷' | '^' | '%') => {
      setErrorMessage('');

      if (op === '%') {
        setJustEvaluated(false);
        setExpression((prev) => {
          if (!prev) return prev;
          const lastChar = prev.slice(-1);
          if (/[0-9)πe!]$/.test(lastChar)) {
            return `${prev}%`;
          }
          return prev;
        });
        return;
      }

      if (justEvaluated) {
        setJustEvaluated(false);
        setExpression((prev) => `${prev || '0'}${op}`);
        return;
      }

      setExpression((prev) => {
        if (!prev) {
          return op === '-' ? '-' : `0${op}`;
        }
        const lastChar = prev.slice(-1);
        if (lastChar === '(') {
          return op === '-' ? `${prev}-` : prev;
        }
        // 지수/곱셈/나눗셈 직후 단항 마이너스 허용 (예: 2^-3, 5×-2)
        if (op === '-' && (lastChar === '×' || lastChar === '÷' || lastChar === '^')) {
          return `${prev}-`;
        }
        if (lastChar === '+' || lastChar === '-' || lastChar === '×' || lastChar === '÷' || lastChar === '^') {
          // 5×- 상태에서 + 누르면 두 연산자 모두 교체
          const secondLast = prev.slice(-2, -1);
          if (lastChar === '-' && (secondLast === '×' || secondLast === '÷' || secondLast === '^' || secondLast === '(')) {
            if (secondLast === '(') return prev;
            return `${prev.slice(0, -2)}${op}`;
          }
          return `${prev.slice(0, -1)}${op}`;
        }
        return `${prev}${op}`;
      });
    },
    [justEvaluated]
  );

  const appendConstant = useCallback(
    (symbol: 'π' | 'e') => {
      setErrorMessage('');
      if (justEvaluated || errorMessage) {
        setJustEvaluated(false);
        setExpression(symbol);
        return;
      }
      setExpression((prev) => `${prev}${symbol}`);
    },
    [justEvaluated, errorMessage]
  );

  const appendParen = useCallback(
    (paren: '(' | ')') => {
      setErrorMessage('');
      if (paren === '(' && (justEvaluated || errorMessage)) {
        setJustEvaluated(false);
        setExpression('(');
        return;
      }
      setJustEvaluated(false);
      setExpression((prev) => {
        if (paren === ')') {
          const opens = (prev.match(/\(/g) || []).length;
          const closes = (prev.match(/\)/g) || []).length;
          if (opens <= closes) return prev;
          const last = prev.slice(-1);
          if (!last || /[+\-×÷^(]$/.test(last)) return prev;
        }
        return `${prev}${paren}`;
      });
    },
    [justEvaluated, errorMessage]
  );

  const appendFunction = useCallback(
    (fnToken: string) => {
      setErrorMessage('');
      if (justEvaluated || errorMessage) {
        setJustEvaluated(false);
        setExpression(fnToken);
        return;
      }
      setExpression((prev) => `${prev}${fnToken}`);
    },
    [justEvaluated, errorMessage]
  );

  const applyUnary = useCallback(
    (action: 'negate' | 'reciprocal' | 'square' | 'cube' | 'factorial' | 'abs') => {
      setErrorMessage('');
      setJustEvaluated(false);

      setExpression((prev) => {
        if (!prev) {
          if (action === 'negate') return '-';
          if (action === 'abs') return 'abs(';
          return prev;
        }

        switch (action) {
          case 'negate': {
            if (/^-?[0-9.]+$/.test(prev)) {
              return prev.startsWith('-') ? prev.slice(1) : `-${prev}`;
            }
            const trailingMatch = prev.match(/^(.*?)(\(-([0-9.πe]+)\)|([0-9.πe]+))$/);
            if (trailingMatch) {
              const prefix = trailingMatch[1];
              if (trailingMatch[3]) return `${prefix}${trailingMatch[3]}`;
              if (trailingMatch[4]) return `${prefix}(-${trailingMatch[4]})`;
            }
            return `-(${prev})`;
          }
          case 'square':
            return needsParensForPostfix(prev) ? `(${prev})^2` : `${prev}^2`;
          case 'cube':
            return needsParensForPostfix(prev) ? `(${prev})^3` : `${prev}^3`;
          case 'factorial':
            return needsParensForPostfix(prev) ? `(${prev})!` : `${prev}!`;
          case 'reciprocal':
            return needsParensForPostfix(prev) ? `1÷(${prev})` : `1÷${prev}`;
          case 'abs':
            return `abs(${prev})`;
        }
      });
    },
    []
  );

  const useLastAnswer = useCallback(() => {
    if (!lastAnswer) return;
    setErrorMessage('');
    if (justEvaluated) {
      setJustEvaluated(false);
      setExpression(lastAnswer);
      return;
    }
    setExpression((prev) => `${prev}${lastAnswer}`);
  }, [lastAnswer, justEvaluated]);

  const backspace = useCallback(() => {
    setErrorMessage('');
    if (justEvaluated) {
      setJustEvaluated(false);
      setExpression('');
      return;
    }
    setExpression((prev) => {
      if (!prev) return '';
      // 함수 토큰(예: sin(, sqrt(, asin()은 한 번에 삭제
      const funcMatch = prev.match(/(asin|acos|atan|sqrt|cbrt|sin|cos|tan|log|ln|abs|10\^|e\^)\($/);
      if (funcMatch) {
        return prev.slice(0, prev.length - funcMatch[0].length);
      }
      return prev.slice(0, -1);
    });
  }, [justEvaluated]);

  const clearAll = useCallback(() => {
    setExpression('');
    setLastFormula('');
    setErrorMessage('');
    setJustEvaluated(false);
  }, []);

  const calculate = useCallback(() => {
    if (!expression.trim()) return;

    const evalRes = evaluateExpression(expression, angleUnit);
    if (!evalRes.ok) {
      setErrorMessage(evalRes.errorMessage || '올바른 수식을 입력해 주세요');
      return;
    }

    const formulaText = formatExpressionText(expression);
    const rawResult = rawValueToExprString(evalRes.value);

    setLastFormula(formulaText);
    setLastAnswer(rawResult);
    setExpression(rawResult);
    setErrorMessage('');
    setJustEvaluated(true);

    const newItem: CalcHistoryItem = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      mode,
      angleUnit,
      expression: formulaText,
      result: evalRes.formatted,
      timestamp: Date.now(),
    };

    setHistory((prev) => {
      const deduped = prev.filter(
        (item, idx) =>
          !(idx === 0 && item.expression === newItem.expression && item.result === newItem.result)
      );
      return [newItem, ...deduped].slice(0, MAX_HISTORY_ITEMS);
    });
  }, [expression, angleUnit, mode]);

  const memoryClear = useCallback(() => {
    setMemory(0);
    setHasMemory(false);
  }, []);

  const memoryRecall = useCallback(() => {
    if (!hasMemory) return;
    setErrorMessage('');
    const memStr = rawValueToExprString(memory);
    if (justEvaluated) {
      setJustEvaluated(false);
      setExpression(memStr);
      return;
    }
    setExpression((prev) => `${prev}${memStr}`);
  }, [hasMemory, memory, justEvaluated]);

  const memoryAdd = useCallback(() => {
    const evalRes = evaluateExpression(expression || '0', angleUnit);
    if (!evalRes.ok) {
      setErrorMessage(evalRes.errorMessage || '올바른 수식을 입력해 주세요');
      return;
    }
    setMemory((prev) => roundPrecision(prev + evalRes.value));
    setHasMemory(true);
    setJustEvaluated(true);
  }, [expression, angleUnit]);

  const memorySubtract = useCallback(() => {
    const evalRes = evaluateExpression(expression || '0', angleUnit);
    if (!evalRes.ok) {
      setErrorMessage(evalRes.errorMessage || '올바른 수식을 입력해 주세요');
      return;
    }
    setMemory((prev) => roundPrecision(prev - evalRes.value));
    setHasMemory(true);
    setJustEvaluated(true);
  }, [expression, angleUnit]);

  const loadHistoryItem = useCallback((item: CalcHistoryItem) => {
    const raw = item.result.replace(/,/g, '');
    setExpression(raw);
    setLastFormula(`${item.expression} =`);
    setErrorMessage('');
    setJustEvaluated(true);
  }, []);

  const deleteHistoryItem = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    safeStorage.remove(HISTORY_STORAGE_KEY);
  }, []);

  const processKey = useCallback(
    (key: string): boolean => {
      if (key >= '0' && key <= '9') {
        appendDigit(key);
        return true;
      }
      if (key === '.') {
        appendDigit('.');
        return true;
      }
      if (key === '+') {
        appendOperator('+');
        return true;
      }
      if (key === '-') {
        appendOperator('-');
        return true;
      }
      if (key === '*') {
        appendOperator('×');
        return true;
      }
      if (key === '/') {
        appendOperator('÷');
        return true;
      }
      if (key === '%') {
        appendOperator('%');
        return true;
      }
      if (key === '^') {
        appendOperator('^');
        return true;
      }
      if (key === '(' || key === ')') {
        appendParen(key);
        return true;
      }
      if (key === '!') {
        applyUnary('factorial');
        return true;
      }
      if (key === 'Enter' || key === '=') {
        calculate();
        return true;
      }
      if (key === 'Backspace') {
        backspace();
        return true;
      }
      if (key === 'Escape' || key === 'Delete') {
        clearAll();
        return true;
      }
      return false;
    },
    [appendDigit, appendOperator, appendParen, applyUnary, calculate, backspace, clearAll]
  );

  const processKeyRef = useRef<(key: string) => boolean>(processKey);
  useEffect(() => {
    processKeyRef.current = processKey;
  }, [processKey]);

  // 물리 키보드 및 부모 포털 모달 키보드 릴레이 프로토콜
  useEffect(() => {
    if (!isInputActive) {
      return;
    }

    const notifyReady = () => {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'MINI_APP_READY' }, '*');
        window.parent.postMessage({ type: 'CALCULATOR_READY' }, '*');
      }
    };

    const timer = window.setTimeout(notifyReady, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      if (processKeyRef.current(e.key)) {
        e.preventDefault();
      }
    };

    const myCallback = (key: string) => {
      processKeyRef.current(key);
    };

    const handleGlobalMessage = (e: MessageEvent) => {
      if (
        e.data &&
        typeof e.data === 'object' &&
        e.data.type === 'PARENT_KEYBOARD_EVENT' &&
        typeof e.data.key === 'string' &&
        !e.data.ctrlKey &&
        !e.data.metaKey &&
        !e.data.altKey
      ) {
        if (typeof document.parentKeyboardCallback === 'function') {
          document.parentKeyboardCallback(e.data.key);
        }
      }
    };

    document.parentKeyboardCallback = myCallback;
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('message', handleGlobalMessage);

    return () => {
      window.clearTimeout(timer);
      if (document.parentKeyboardCallback === myCallback) {
        document.parentKeyboardCallback = null;
      }
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('message', handleGlobalMessage);
    };
  }, [isInputActive]);

  return {
    mode,
    setMode,
    angleUnit,
    setAngleUnit,
    isSecondFunc,
    setIsSecondFunc,
    expression,
    formattedDisplay,
    lastFormula,
    lastAnswer,
    previewResult,
    copyableResult,
    errorMessage,
    memory,
    formattedMemory: formatDisplayNumber(memory),
    hasMemory,
    history,
    appendDigit,
    appendOperator,
    appendConstant,
    appendParen,
    appendFunction,
    applyUnary,
    useLastAnswer,
    backspace,
    clearAll,
    calculate,
    memoryClear,
    memoryRecall,
    memoryAdd,
    memorySubtract,
    loadHistoryItem,
    deleteHistoryItem,
    clearHistory,
  };
}
