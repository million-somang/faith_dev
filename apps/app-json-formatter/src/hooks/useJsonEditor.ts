import { useState, useCallback, useMemo } from 'react';
import JSON5 from 'json5';
import jsyaml from 'js-yaml';

export type StatusType = 'success' | 'error' | 'info';

export interface JsonStats {
  lines: number;
  characters: number;
  sizeBytes: number;
  depth: number;
  keysCount: number;
}

export const JSON_PRESETS: Record<string, string> = {
  '유저 프로필': JSON.stringify(
    {
      id: 1024,
      username: 'veranex_dev',
      email: 'developer@veranex.app',
      isActive: true,
      roles: ['ADMIN', 'CREATOR'],
      profile: {
        nickname: '베라넥스 마스터',
        avatarUrl: 'https://veranex.app/logo-192.png',
        bio: 'VeraNex 라이프 포털 & 스마트 도구 개발자',
        reputation: 9850,
      },
      preferences: {
        theme: 'light-beige',
        notifications: {
          email: true,
          push: false,
          sms: false,
        },
      },
      tags: ['react', 'typescript', 'hono', 'sqlite'],
    },
    null,
    2
  ),

  'API 응답': JSON.stringify(
    {
      status: 200,
      code: 'SUCCESS',
      message: '요청이 성공적으로 처리되었습니다.',
      timestamp: '2026-10-05T12:00:00.000Z',
      data: {
        pagination: {
          currentPage: 1,
          pageSize: 20,
          totalCount: 142,
          totalPages: 8,
          hasNext: true,
        },
        items: [
          { id: 1, title: '2026 황금연휴 최적화 플래너', views: 12450, category: 'life' },
          { id: 2, title: '예·적금 비과세 비교 계산기', views: 8930, category: 'finance' },
          { id: 3, title: '초경량 Pro JSON Studio', views: 15420, category: 'dev' },
        ],
      },
    },
    null,
    2
  ),

  '이커머스 주문': JSON.stringify(
    {
      orderId: 'VN-2026-89412',
      orderedAt: '2026-10-05T09:30:15Z',
      customer: {
        name: '홍길동',
        phone: '010-1234-5678',
      },
      payment: {
        method: 'VeraPay 간편결제',
        amount: 89000,
        currency: 'KRW',
        discount: 5000,
        paidAmount: 84000,
        isCompleted: true,
      },
      items: [
        { code: 'PRD-01', name: '뉴모피즘 스마트 캘린더', qty: 2, unitPrice: 32000 },
        { code: 'PRD-02', name: '인체공학 무선 버티컬 마우스', qty: 1, unitPrice: 25000 },
      ],
      shipping: {
        recipient: '홍길동',
        address: '서울특별시 강남구 테헤란로 152',
        zipCode: '06236',
        status: 'DELIVERING',
      },
    },
    null,
    2
  ),

  '오류 샘플 (복구용)': `// 유효하지 않은 JSON 예시 (따옴표 누락, 작은따옴표, trailing comma)
{
  username: 'veranex_guest',
  loginAttempts: 3,
  isBlocked: false,
  roles: [
    'USER',
    'TESTER',
  ],
  memo: "자동 수정 버튼(Auto Fix)을 누르면 즉시 표준 JSON으로 변환됩니다!",
}`,
};

function calculateDepthAndKeys(obj: unknown, currentDepth = 1): { depth: number; keys: number } {
  if (obj === null || typeof obj !== 'object') {
    return { depth: currentDepth - 1, keys: 0 };
  }

  let maxChildDepth = currentDepth;
  let totalKeys = 0;

  if (Array.isArray(obj)) {
    totalKeys += obj.length;
    for (const item of obj) {
      const { depth: d, keys: k } = calculateDepthAndKeys(item, currentDepth + 1);
      if (d > maxChildDepth) maxChildDepth = d;
      totalKeys += k;
    }
  } else {
    const keys = Object.keys(obj);
    totalKeys += keys.length;
    for (const key of keys) {
      const val = (obj as Record<string, unknown>)[key];
      const { depth: d, keys: k } = calculateDepthAndKeys(val, currentDepth + 1);
      if (d > maxChildDepth) maxChildDepth = d;
      totalKeys += k;
    }
  }

  return { depth: maxChildDepth, keys: totalKeys };
}

function generateTsInterface(obj: unknown, name = 'RootObject'): string {
  if (obj === null) return `export type ${name} = null;\n`;
  if (typeof obj !== 'object') return `export type ${name} = ${typeof obj};\n`;

  if (Array.isArray(obj)) {
    if (obj.length === 0) return `export type ${name} = unknown[];\n`;
    const firstType = generateTsType(obj[0]);
    return `export type ${name} = ${firstType}[];\n`;
  }

  const subInterfaces: string[] = [];
  const fields: string[] = [];

  const record = obj as Record<string, unknown>;
  for (const [key, value] of Object.entries(record)) {
    const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);

    if (value === null) {
      fields.push(`  ${safeKey}: null;`);
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        fields.push(`  ${safeKey}: unknown[];`);
      } else if (typeof value[0] === 'object' && value[0] !== null) {
        const subName = capitalize(key) + 'Item';
        subInterfaces.push(generateTsInterface(value[0], subName));
        fields.push(`  ${safeKey}: ${subName}[];`);
      } else {
        fields.push(`  ${safeKey}: ${typeof value[0]}[];`);
      }
    } else if (typeof value === 'object') {
      const subName = capitalize(key);
      subInterfaces.push(generateTsInterface(value, subName));
      fields.push(`  ${safeKey}: ${subName};`);
    } else {
      fields.push(`  ${safeKey}: ${typeof value};`);
    }
  }

  const current = `export interface ${name} {\n${fields.join('\n')}\n}\n`;
  return [...subInterfaces, current].join('\n');
}

function generateTsType(val: unknown): string {
  if (val === null) return 'null';
  if (Array.isArray(val)) return 'unknown[]';
  return typeof val;
}

function capitalize(str: string): string {
  if (!str) return 'Item';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function useJsonEditor() {
  const [jsonText, setJsonText] = useState<string>(JSON_PRESETS['유저 프로필']);
  const [parsedJson, setParsedJson] = useState<unknown>(null);
  const [statusType, setStatusType] = useState<StatusType>('success');
  const [statusMessage, setStatusMessage] = useState('Valid JSON ✓');
  const [currentIndent, setCurrentIndent] = useState<number | 'tab'>(2);

  const getIndentValue = useCallback((): string | number => {
    return currentIndent === 'tab' ? '\t' : currentIndent;
  }, [currentIndent]);

  const validateAndParse = useCallback((value: string) => {
    const trimmed = value.trim();

    if (!trimmed) {
      setStatusType('info');
      setStatusMessage('JSON 데이터를 입력하거나 프리셋을 선택하세요.');
      setParsedJson(null);
      return;
    }

    try {
      const parsed = JSON.parse(trimmed);
      setParsedJson(parsed);
      setStatusType('success');
      setStatusMessage('Valid JSON ✓ 표준 문법 검증 완료');
    } catch (e) {
      setParsedJson(null);
      const err = e as SyntaxError;
      const posMatch = err.message.match(/position (\d+)/);
      if (posMatch) {
        const pos = parseInt(posMatch[1], 10);
        const lineNum = trimmed.substring(0, pos).split('\n').length;
        setStatusType('error');
        setStatusMessage(`구문 오류 (라인 ${lineNum}): ${err.message}`);
      } else {
        setStatusType('error');
        setStatusMessage(`구문 오류: ${err.message}`);
      }
    }
  }, []);

  const stats = useMemo<JsonStats>(() => {
    const lines = jsonText ? jsonText.split('\n').length : 0;
    const characters = jsonText.length;
    const sizeBytes = new Blob([jsonText]).size;
    const { depth, keys } = calculateDepthAndKeys(parsedJson);

    return {
      lines,
      characters,
      sizeBytes,
      depth,
      keysCount: keys,
    };
  }, [jsonText, parsedJson]);

  const formatJson = useCallback((): string | null => {
    if (!parsedJson) {
      setStatusType('error');
      setStatusMessage('오류가 있습니다. 먼저 JSON을 수정하거나 [자동수정]을 누르세요.');
      return null;
    }
    const formatted = JSON.stringify(parsedJson, null, getIndentValue());
    setJsonText(formatted);
    setStatusType('success');
    setStatusMessage('JSON 포맷 정렬 완료');
    return formatted;
  }, [parsedJson, getIndentValue]);

  const minifyJson = useCallback((): string | null => {
    if (!parsedJson) {
      setStatusType('error');
      setStatusMessage('오류가 있습니다. 먼저 JSON을 수정해주세요.');
      return null;
    }
    const minified = JSON.stringify(parsedJson);
    setJsonText(minified);
    setStatusType('success');
    setStatusMessage('공백 제거 및 압축(Minify) 완료');
    return minified;
  }, [parsedJson]);

  const autoFixJson = useCallback((rawText?: string): string | null => {
    const textToFix = rawText !== undefined ? rawText : jsonText;
    const trimmed = textToFix.trim();
    if (!trimmed) return null;

    try {
      JSON.parse(trimmed);
      setStatusType('info');
      setStatusMessage('이미 표준을 준수하는 유효한 JSON입니다.');
      return null;
    } catch {
      try {
        const fixed = JSON5.parse(trimmed);
        const formatted = JSON.stringify(fixed, null, getIndentValue());
        setJsonText(formatted);
        setParsedJson(fixed);
        setStatusType('success');
        setStatusMessage('자동 복구 완료! (따옴표/쉼표 오류 교정됨)');
        return formatted;
      } catch (e2) {
        const err = e2 as Error;
        setStatusType('error');
        setStatusMessage(`자동 복구 실패: ${err.message}`);
        return null;
      }
    }
  }, [jsonText, getIndentValue]);

  const loadPreset = useCallback((presetName: string) => {
    const sample = JSON_PRESETS[presetName];
    if (sample) {
      setJsonText(sample);
      validateAndParse(sample);
    }
  }, [validateAndParse]);

  const convertToYaml = useCallback((): string => {
    if (!parsedJson) return '# 유효한 JSON을 먼저 입력해주세요.';
    try {
      return jsyaml.dump(parsedJson, { indent: 2 });
    } catch (e) {
      return `# YAML 변환 실패: ${(e as Error).message}`;
    }
  }, [parsedJson]);

  const convertToXml = useCallback((): string => {
    if (!parsedJson) return '<!-- 유효한 JSON을 먼저 입력해주세요. -->';

    function toXml(obj: unknown, tag = 'item'): string {
      if (obj === null || obj === undefined) return `<${tag}/>`;
      if (typeof obj !== 'object') {
        const safe = String(obj).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<${tag}>${safe}</${tag}>`;
      }
      if (Array.isArray(obj)) {
        return obj.map((item) => toXml(item, tag)).join('\n');
      }
      const children = Object.entries(obj as Record<string, unknown>)
        .map(([k, v]) => toXml(v, k))
        .join('\n');
      return `<${tag}>\n${children}\n</${tag}>`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n${toXml(parsedJson, 'data')}\n</root>`;
  }, [parsedJson]);

  const convertToCsv = useCallback((): string => {
    if (!parsedJson) return '유효한 JSON을 먼저 입력해주세요.';

    let list: Record<string, unknown>[] = [];
    if (Array.isArray(parsedJson)) {
      list = parsedJson.filter((item) => typeof item === 'object' && item !== null);
    } else if (typeof parsedJson === 'object' && parsedJson !== null) {
      const values = Object.values(parsedJson);
      const arrayProp = values.find((v) => Array.isArray(v));
      if (arrayProp && Array.isArray(arrayProp)) {
        list = arrayProp.filter((item) => typeof item === 'object' && item !== null);
      } else {
        list = [parsedJson as Record<string, unknown>];
      }
    }

    if (list.length === 0) {
      return 'CSV로 변환 가능한 배열 또는 객체 데이터가 없습니다.';
    }

    const headers = Array.from(new Set(list.flatMap((item) => Object.keys(item))));
    const rows = list.map((item) =>
      headers
        .map((h) => {
          const val = item[h];
          const str = val === undefined || val === null ? '' : typeof val === 'object' ? JSON.stringify(val) : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    return [headers.map((h) => `"${h}"`).join(','), ...rows].join('\n');
  }, [parsedJson]);

  const convertToTypeScript = useCallback((): string => {
    if (!parsedJson) return '// 유효한 JSON을 먼저 입력해주세요.';
    try {
      return generateTsInterface(parsedJson, 'RootPayload');
    } catch (e) {
      return `// TypeScript 변환 실패: ${(e as Error).message}`;
    }
  }, [parsedJson]);

  const downloadJson = useCallback(() => {
    if (!jsonText) return;
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [jsonText]);

  return {
    jsonText,
    setJsonText,
    parsedJson,
    statusType,
    statusMessage,
    stats,
    currentIndent,
    setCurrentIndent,
    formatJson,
    minifyJson,
    autoFixJson,
    loadPreset,
    convertToYaml,
    convertToXml,
    convertToCsv,
    convertToTypeScript,
    downloadJson,
    validateAndParse,
  };
}
