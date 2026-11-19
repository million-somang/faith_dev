import type { AngleUnit, EvalResult } from '../types/calculator';

type FuncName =
  | 'sin'
  | 'cos'
  | 'tan'
  | 'asin'
  | 'acos'
  | 'atan'
  | 'sqrt'
  | 'cbrt'
  | 'log'
  | 'ln'
  | 'abs'
  | 'exp'
  | 'pow10';

type BinaryOrUnaryOp = '+' | '-' | '×' | '÷' | '^' | 'u-' | 'u+' | '!' | '%';

type Token =
  | { type: 'number'; value: number }
  | { type: 'const'; symbol: 'π' | 'e'; value: number }
  | { type: 'func'; name: FuncName }
  | { type: 'op'; op: BinaryOrUnaryOp }
  | { type: 'lparen' }
  | { type: 'rparen' };

interface StackValue {
  value: number;
  isPercent: boolean;
}

const VALID_FUNCTIONS: readonly FuncName[] = [
  'sin',
  'cos',
  'tan',
  'asin',
  'acos',
  'atan',
  'sqrt',
  'cbrt',
  'log',
  'ln',
  'abs',
  'exp',
  'pow10',
];

const FUNC_SET = new Set<string>(VALID_FUNCTIONS);

const OP_PRECEDENCE: Record<BinaryOrUnaryOp, number> = {
  '+': 1,
  '-': 1,
  '×': 2,
  '÷': 2,
  'u-': 3,
  'u+': 3,
  '^': 4,
  '!': 5,
  '%': 5,
};

const RIGHT_ASSOC = new Set<BinaryOrUnaryOp>(['^', 'u-', 'u+']);

export function roundPrecision(value: number): number {
  if (!Number.isFinite(value)) return value;
  if (Math.abs(value) < 1e-12) return 0;
  const rounded = Number(value.toPrecision(12));
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0 || n > 170) {
    throw new Error('0~170 사이의 정수만 팩토리얼(!) 계산이 가능합니다');
  }
  let acc = 1;
  for (let i = 2; i <= n; i++) {
    acc *= i;
  }
  return acc;
}

export function formatDisplayNumber(val: number): string {
  if (!Number.isFinite(val)) return 'Error';
  const cleaned = roundPrecision(val);
  if (cleaned === 0) return '0';

  const absVal = Math.abs(cleaned);
  if (absVal >= 1e13 || absVal < 1e-9) {
    return cleaned.toExponential(8).replace(/(?:\.0+|(\.\d+?)0+)e/, '$1e');
  }

  let raw = cleaned.toString();
  if (raw.includes('e') || raw.includes('E')) {
    raw = cleaned.toFixed(10).replace(/\.?0+$/, '');
  }

  const [intPart, decPart] = raw.split('.');
  const sign = intPart.startsWith('-') ? '-' : '';
  const digits = sign ? intPart.slice(1) : intPart;
  const formattedInt = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart !== undefined ? `${sign}${formattedInt}.${decPart}` : `${sign}${formattedInt}`;
}

export function formatExpressionText(expr: string): string {
  if (!expr) return '';
  let result = '';
  let i = 0;

  while (i < expr.length) {
    const ch = expr[i];
    if ((ch >= '0' && ch <= '9') || ch === '.') {
      let j = i;
      while (j < expr.length && ((expr[j] >= '0' && expr[j] <= '9') || expr[j] === '.')) {
        j++;
      }
      const numStr = expr.slice(i, j);
      const [intPart, decPart] = numStr.split('.');
      const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      result += decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
      i = j;
      continue;
    }
    result += ch;
    i++;
  }

  return result;
}

function normalizeOperators(expr: string): string {
  return expr
    .replace(/\s+/g, '')
    .replace(/\*/g, '×')
    .replace(/\//g, '÷')
    .replace(/−/g, '-');
}

function isPrimaryEnd(tok: Token | null): boolean {
  if (!tok) return false;
  if (tok.type === 'number' || tok.type === 'const' || tok.type === 'rparen') return true;
  return tok.type === 'op' && (tok.op === '!' || tok.op === '%');
}

function isPrimaryStart(tok: Token): boolean {
  return (
    tok.type === 'number' ||
    tok.type === 'const' ||
    tok.type === 'lparen' ||
    tok.type === 'func'
  );
}

function isUnaryPosition(prev: Token | null): boolean {
  if (!prev) return true;
  if (prev.type === 'lparen' || prev.type === 'func') return true;
  if (prev.type === 'op') {
    return prev.op !== '!' && prev.op !== '%';
  }
  return false;
}

function tokenize(rawExpr: string): Token[] {
  const expr = normalizeOperators(rawExpr);
  const rawTokens: Token[] = [];
  let i = 0;

  while (i < expr.length) {
    const ch = expr[i];

    // 숫자 (과학적 표기 1e-5 포함)
    if ((ch >= '0' && ch <= '9') || ch === '.') {
      let end = i;
      let dotCount = 0;
      while (end < expr.length) {
        const c = expr[end];
        if (c >= '0' && c <= '9') {
          end++;
        } else if (c === '.') {
          dotCount++;
          if (dotCount > 1) {
            throw new Error('올바른 소수 형식이 아닙니다');
          }
          end++;
        } else {
          break;
        }
      }

      // 지수 표기 확인 (예: 1.5e-6, 2e+10, 3e5) — 바로 뒤에 숫자가 오는 경우만 지수 표기로 간주
      if (end < expr.length && (expr[end] === 'e' || expr[end] === 'E')) {
        let expIdx = end + 1;
        if (expIdx < expr.length && (expr[expIdx] === '+' || expr[expIdx] === '-')) {
          expIdx++;
        }
        let expDigits = expIdx;
        while (expDigits < expr.length && expr[expDigits] >= '0' && expr[expDigits] <= '9') {
          expDigits++;
        }
        if (expDigits > expIdx) {
          end = expDigits;
        }
      }

      const numText = expr.slice(i, end);
      const parsed = Number(numText);
      if (!Number.isFinite(parsed)) {
        throw new Error('올바른 숫자 형식이 아닙니다');
      }
      rawTokens.push({ type: 'number', value: parsed });
      i = end;
      continue;
    }

    if (ch === 'π') {
      rawTokens.push({ type: 'const', symbol: 'π', value: Math.PI });
      i++;
      continue;
    }

    if (ch === 'e' && (i + 1 >= expr.length || !/[a-zA-Z0-9]/.test(expr[i + 1]))) {
      rawTokens.push({ type: 'const', symbol: 'e', value: Math.E });
      i++;
      continue;
    }

    // 함수명 (sin, cos, tan, asin, acos, atan, sqrt, cbrt, log, ln, abs, exp, pow10)
    if (/[a-zA-Z]/.test(ch)) {
      let end = i;
      while (end < expr.length && /[a-zA-Z0-9]/.test(expr[end])) {
        end++;
      }
      const ident = expr.slice(i, end).toLowerCase();
      if (ident === 'pi') {
        rawTokens.push({ type: 'const', symbol: 'π', value: Math.PI });
      } else if (ident === 'e') {
        rawTokens.push({ type: 'const', symbol: 'e', value: Math.E });
      } else if (FUNC_SET.has(ident)) {
        rawTokens.push({ type: 'func', name: ident as FuncName });
      } else {
        throw new Error(`지원하지 않는 함수(${ident})입니다`);
      }
      i = end;
      continue;
    }

    if (ch === '(') {
      rawTokens.push({ type: 'lparen' });
      i++;
      continue;
    }

    if (ch === ')') {
      rawTokens.push({ type: 'rparen' });
      i++;
      continue;
    }

    if (ch === '+' || ch === '-') {
      const prev = rawTokens.length > 0 ? rawTokens[rawTokens.length - 1] : null;
      if (isUnaryPosition(prev)) {
        rawTokens.push({ type: 'op', op: ch === '-' ? 'u-' : 'u+' });
      } else {
        rawTokens.push({ type: 'op', op: ch });
      }
      i++;
      continue;
    }

    if (ch === '×' || ch === '÷' || ch === '^' || ch === '!' || ch === '%') {
      rawTokens.push({ type: 'op', op: ch });
      i++;
      continue;
    }

    throw new Error('수식에 올바르지 않은 문자가 있습니다');
  }

  // 암시적 곱셈(×) 삽입 및 미닫힘 괄호 자동 보정
  const normalized: Token[] = [];
  let openParens = 0;

  for (const tok of rawTokens) {
    const prev = normalized.length > 0 ? normalized[normalized.length - 1] : null;
    if (isPrimaryEnd(prev) && isPrimaryStart(tok)) {
      normalized.push({ type: 'op', op: '×' });
    }
    if (tok.type === 'lparen') openParens++;
    if (tok.type === 'rparen') {
      openParens--;
      if (openParens < 0) {
        throw new Error('괄호 짝이 맞지 않습니다');
      }
    }
    normalized.push(tok);
  }

  while (openParens > 0) {
    normalized.push({ type: 'rparen' });
    openParens--;
  }

  return normalized;
}

function toRpn(tokens: Token[]): Token[] {
  const output: Token[] = [];
  const opStack: Token[] = [];

  for (const tok of tokens) {
    if (tok.type === 'number' || tok.type === 'const') {
      output.push(tok);
      continue;
    }

    if (tok.type === 'func') {
      opStack.push(tok);
      continue;
    }

    if (tok.type === 'lparen') {
      opStack.push(tok);
      continue;
    }

    if (tok.type === 'rparen') {
      let foundLeftParen = false;
      while (opStack.length > 0) {
        const top = opStack.pop()!;
        if (top.type === 'lparen') {
          foundLeftParen = true;
          break;
        }
        output.push(top);
      }
      if (!foundLeftParen) {
        throw new Error('괄호 짝이 맞지 않습니다');
      }
      if (opStack.length > 0 && opStack[opStack.length - 1].type === 'func') {
        output.push(opStack.pop()!);
      }
      continue;
    }

    if (tok.type === 'op') {
      const op = tok.op;
      // 후위 연산자(!, %)는 선행 피연산자에 즉시 결합
      if (op === '!' || op === '%') {
        output.push(tok);
        continue;
      }

      // 단항 전치 연산자(u-, u+)는 뒤쪽 피연산자 평가 전에 우선 스택에 적재
      if (op === 'u-' || op === 'u+') {
        opStack.push(tok);
        continue;
      }

      const prec = OP_PRECEDENCE[op];
      const isRight = RIGHT_ASSOC.has(op);

      while (opStack.length > 0) {
        const top = opStack[opStack.length - 1];
        if (top.type === 'func') {
          output.push(opStack.pop()!);
          continue;
        }
        if (top.type === 'op') {
          const topPrec = OP_PRECEDENCE[top.op];
          if (topPrec > prec || (!isRight && topPrec === prec)) {
            output.push(opStack.pop()!);
            continue;
          }
        }
        break;
      }
      opStack.push(tok);
    }
  }

  while (opStack.length > 0) {
    const top = opStack.pop()!;
    if (top.type === 'lparen' || top.type === 'rparen') {
      throw new Error('괄호 짝이 맞지 않습니다');
    }
    output.push(top);
  }

  return output;
}

function applyFunction(name: FuncName, arg: number, angleUnit: AngleUnit): number {
  const toRad = (degOrRad: number) => (angleUnit === 'DEG' ? (degOrRad * Math.PI) / 180 : degOrRad);
  const fromRad = (rad: number) => (angleUnit === 'DEG' ? (rad * 180) / Math.PI : rad);

  switch (name) {
    case 'sin':
      return Math.sin(toRad(arg));
    case 'cos':
      return Math.cos(toRad(arg));
    case 'tan': {
      if (angleUnit === 'DEG') {
        const mod = ((arg % 180) + 180) % 180;
        if (Math.abs(mod - 90) < 1e-10) {
          throw new Error('정의되지 않는 값입니다 (tan 90°)');
        }
      } else if (Math.abs(Math.cos(arg)) < 1e-12) {
        throw new Error('정의되지 않는 값입니다 (tan)');
      }
      return Math.tan(toRad(arg));
    }
    case 'asin': {
      if (arg < -1 || arg > 1) {
        throw new Error('정의역(-1 ~ 1)을 벗어난 값입니다');
      }
      return fromRad(Math.asin(arg));
    }
    case 'acos': {
      if (arg < -1 || arg > 1) {
        throw new Error('정의역(-1 ~ 1)을 벗어난 값입니다');
      }
      return fromRad(Math.acos(arg));
    }
    case 'atan':
      return fromRad(Math.atan(arg));
    case 'sqrt': {
      if (arg < 0) {
        throw new Error('음수의 제곱근은 계산할 수 없습니다');
      }
      return Math.sqrt(arg);
    }
    case 'cbrt':
      return Math.cbrt(arg);
    case 'log': {
      if (arg <= 0) {
        throw new Error('0 이하의 로그는 계산할 수 없습니다');
      }
      return Math.log10(arg);
    }
    case 'ln': {
      if (arg <= 0) {
        throw new Error('0 이하의 자연로그는 계산할 수 없습니다');
      }
      return Math.log(arg);
    }
    case 'abs':
      return Math.abs(arg);
    case 'exp':
      return Math.exp(arg);
    case 'pow10':
      return Math.pow(10, arg);
  }
}

function evaluateRpn(rpn: Token[], angleUnit: AngleUnit): number {
  const stack: StackValue[] = [];

  for (const tok of rpn) {
    if (tok.type === 'number' || tok.type === 'const') {
      stack.push({ value: tok.value, isPercent: false });
      continue;
    }

    if (tok.type === 'func') {
      const arg = stack.pop();
      if (!arg) {
        throw new Error('함수에 필요한 숫자가 부족합니다');
      }
      const res = applyFunction(tok.name, arg.value, angleUnit);
      if (!Number.isFinite(res)) {
        throw new Error('계산 범위를 초과했습니다');
      }
      stack.push({ value: res, isPercent: false });
      continue;
    }

    if (tok.type === 'op') {
      if (tok.op === 'u-' || tok.op === 'u+') {
        const target = stack.pop();
        if (!target) {
          throw new Error('수식을 완성해 주세요');
        }
        stack.push({
          value: tok.op === 'u-' ? -target.value : target.value,
          isPercent: target.isPercent,
        });
        continue;
      }

      if (tok.op === '!') {
        const target = stack.pop();
        if (!target) {
          throw new Error('팩토리얼(!) 대상이 없습니다');
        }
        stack.push({ value: factorial(target.value), isPercent: false });
        continue;
      }

      if (tok.op === '%') {
        const target = stack.pop();
        if (!target) {
          throw new Error('퍼센트(%) 대상이 없습니다');
        }
        if (target.isPercent) {
          throw new Error('퍼센트(%) 기호를 연속으로 사용할 수 없습니다');
        }
        stack.push({ value: target.value / 100, isPercent: true });
        continue;
      }

      const right = stack.pop();
      const left = stack.pop();
      if (!left || !right) {
        throw new Error('연산할 숫자가 부족합니다');
      }

      let result: number;
      switch (tok.op) {
        case '+':
          result = right.isPercent
            ? left.value + left.value * right.value
            : left.value + right.value;
          break;
        case '-':
          result = right.isPercent
            ? left.value - left.value * right.value
            : left.value - right.value;
          break;
        case '×':
          result = left.value * right.value;
          break;
        case '÷':
          if (right.value === 0) {
            throw new Error('0으로 나눌 수 없습니다');
          }
          result = left.value / right.value;
          break;
        case '^':
          if (left.value === 0 && right.value < 0) {
            throw new Error('0의 음수 제곱은 계산할 수 없습니다');
          }
          result = Math.pow(left.value, right.value);
          break;
      }

      if (!Number.isFinite(result)) {
        throw new Error('계산 범위를 초과했습니다');
      }

      stack.push({ value: result, isPercent: false });
    }
  }

  if (stack.length !== 1) {
    throw new Error('올바른 수식을 입력해 주세요');
  }

  return roundPrecision(stack[0].value);
}

export function evaluateExpression(expr: string, angleUnit: AngleUnit = 'DEG'): EvalResult {
  const trimmed = expr.trim();
  if (!trimmed) {
    return { ok: false, value: 0, formatted: '0', errorMessage: '수식을 입력해 주세요' };
  }

  try {
    const tokens = tokenize(trimmed);
    if (tokens.length === 0) {
      return { ok: false, value: 0, formatted: '0', errorMessage: '수식을 입력해 주세요' };
    }
    const rpn = toRpn(tokens);
    const value = evaluateRpn(rpn, angleUnit);
    if (!Number.isFinite(value)) {
      return {
        ok: false,
        value: 0,
        formatted: 'Error',
        errorMessage: '계산 범위를 초과했습니다',
      };
    }
    return {
      ok: true,
      value,
      formatted: formatDisplayNumber(value),
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : '올바른 수식을 입력해 주세요';
    return {
      ok: false,
      value: 0,
      formatted: 'Error',
      errorMessage: message,
    };
  }
}

export function hasPendingCalculation(expr: string): boolean {
  if (!expr) return false;
  if (/^-?[0-9.]+$/.test(expr)) return false;
  return /[+\-×÷*/^%!()]|sin|cos|tan|log|ln|sqrt|cbrt|abs|exp|pow10|π|e/.test(expr);
}
