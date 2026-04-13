import { useState, useCallback } from 'react';
import JSON5 from 'json5';
import jsyaml from 'js-yaml';

export type StatusType = 'success' | 'error' | 'info';

interface JsonStats {
  lines: number;
  characters: number;
  sizeBytes: number;
}

interface UseJsonEditorReturn {
  jsonText: string;
  setJsonText: (text: string) => void;
  parsedJson: unknown;
  statusType: StatusType;
  statusMessage: string;
  stats: JsonStats;
  currentIndent: number | 'tab';
  setCurrentIndent: (indent: number | 'tab') => void;
  formatJson: () => string | null;
  minifyJson: () => string | null;
  autoFixJson: (rawText: string) => string | null;
  convertToYaml: () => string;
  convertToXml: () => string;
  convertToCsv: () => string;
  validateAndParse: (value: string) => void;
}

export function useJsonEditor(): UseJsonEditorReturn {
  const [jsonText, setJsonText] = useState<string>(DEFAULT_JSON);
  const [parsedJson, setParsedJson] = useState<unknown>(null);
  const [statusType, setStatusType] = useState<StatusType>('info');
  const [statusMessage, setStatusMessage] = useState('Ready');
  const [stats, setStats] = useState<JsonStats>({ lines: 0, characters: 0, sizeBytes: 0 });
  const [currentIndent, setCurrentIndent] = useState<number | 'tab'>(2);

  const updateStats = useCallback((text: string) => {
    setStats({
      lines: text.split('\n').length,
      characters: text.length,
      sizeBytes: new Blob([text]).size,
    });
  }, []);

  const setStatus = useCallback((type: StatusType, message: string) => {
    setStatusType(type);
    setStatusMessage(message);
  }, []);

  const getIndentValue = useCallback((): string | number => {
    return currentIndent === 'tab' ? '\t' : currentIndent;
  }, [currentIndent]);

  const validateAndParse = useCallback((value: string) => {
    const trimmed = value.trim();

    if (!trimmed) {
      setStatus('info', 'JSON 데이터를 입력하세요');
      setParsedJson(null);
      updateStats(value);
      return;
    }

    // URL 쿼리스트링 자동 변환
    if (trimmed.startsWith('?') || (trimmed.includes('=') && trimmed.includes('&') && !trimmed.includes('{'))) {
      try {
        const params = new URLSearchParams(trimmed.startsWith('?') ? trimmed : '?' + trimmed);
        const obj: Record<string, string> = {};
        params.forEach((val, key) => { obj[key] = val; });
        setParsedJson(obj);
        setStatus('success', 'URL 쿼리스트링을 JSON으로 자동 변환했습니다');
        updateStats(JSON.stringify(obj, null, 2));
        return;
      } catch (_e) { /* fall through */ }
    }

    try {
      const parsed = JSON.parse(trimmed);
      setParsedJson(parsed);
      setStatus('success', 'Valid JSON ✓');
      updateStats(value);
    } catch (e) {
      setParsedJson(null);
      const err = e as SyntaxError;
      const posMatch = err.message.match(/position (\d+)/);
      if (posMatch) {
        const pos = parseInt(posMatch[1]);
        const lines = trimmed.substring(0, pos).split('\n');
        setStatus('error', `구문 오류 (${lines.length}번째 줄): ${err.message}`);
      } else {
        setStatus('error', `구문 오류: ${err.message}`);
      }
      updateStats(value);
    }
  }, [setStatus, updateStats]);

  const formatJson = useCallback((): string | null => {
    if (!parsedJson) {
      setStatus('error', 'JSON 오류를 먼저 수정해주세요');
      return null;
    }
    const formatted = JSON.stringify(parsedJson, null, getIndentValue());
    setStatus('success', 'JSON이 포맷팅되었습니다');
    return formatted;
  }, [parsedJson, getIndentValue, setStatus]);

  const minifyJson = useCallback((): string | null => {
    if (!parsedJson) {
      setStatus('error', 'JSON 오류를 먼저 수정해주세요');
      return null;
    }
    const minified = JSON.stringify(parsedJson);
    setStatus('success', 'JSON이 압축되었습니다');
    return minified;
  }, [parsedJson, setStatus]);

  const autoFixJson = useCallback((rawText: string): string | null => {
    const trimmed = rawText.trim();
    if (!trimmed) return null;

    try {
      JSON.parse(trimmed);
      setStatus('info', 'JSON이 이미 유효합니다');
      return null;
    } catch (_e) {
      try {
        const fixed = JSON5.parse(trimmed);
        const formatted = JSON.stringify(fixed, null, getIndentValue());
        setParsedJson(fixed);
        setStatus('success', '자동 수정 완료! (JSON5에서 변환됨)');
        return formatted;
      } catch (e2) {
        const err = e2 as Error;
        setStatus('error', `자동 수정 실패: ${err.message}`);
        return null;
      }
    }
  }, [getIndentValue, setStatus]);

  const convertToYaml = useCallback((): string => {
    if (!parsedJson) return '유효한 JSON을 먼저 입력해주세요';
    try {
      const result = jsyaml.dump(parsedJson);
      setStatus('success', 'YAML로 변환되었습니다');
      return result;
    } catch (e) {
      const err = e as Error;
      setStatus('error', `변환 실패: ${err.message}`);
      return `Error: ${err.message}`;
    }
  }, [parsedJson, setStatus]);

  const convertToXml = useCallback((): string => {
    if (!parsedJson) return '유효한 JSON을 먼저 입력해주세요';
    try {
      const result = jsonToXml(parsedJson as Record<string, unknown>);
      setStatus('success', 'XML로 변환되었습니다');
      return result;
    } catch (e) {
      const err = e as Error;
      setStatus('error', `변환 실패: ${err.message}`);
      return `Error: ${err.message}`;
    }
  }, [parsedJson, setStatus]);

  const convertToCsv = useCallback((): string => {
    if (!parsedJson) return '유효한 JSON을 먼저 입력해주세요';
    try {
      const result = jsonToCsv(parsedJson);
      setStatus('success', 'CSV로 변환되었습니다');
      return result;
    } catch (e) {
      const err = e as Error;
      setStatus('error', `변환 실패: ${err.message}`);
      return `Error: ${err.message}`;
    }
  }, [parsedJson, setStatus]);

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
    convertToYaml,
    convertToXml,
    convertToCsv,
    validateAndParse,
  };
}

// ===== Helper functions =====

function jsonToXml(obj: Record<string, unknown>, rootName = 'root'): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n`;

  function convert(data: Record<string, unknown>, indent = '  '): string {
    let result = '';
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (typeof item === 'object' && item !== null) {
            result += `${indent}<${key}>\n`;
            result += convert(item as Record<string, unknown>, indent + '  ');
            result += `${indent}</${key}>\n`;
          } else {
            result += `${indent}<${key}>${String(item)}</${key}>\n`;
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        result += `${indent}<${key}>\n`;
        result += convert(value as Record<string, unknown>, indent + '  ');
        result += `${indent}</${key}>\n`;
      } else {
        result += `${indent}<${key}>${String(value)}</${key}>\n`;
      }
    }
    return result;
  }

  xml += convert(obj);
  xml += `</${rootName}>`;
  return xml;
}

function jsonToCsv(data: unknown): string {
  if (!Array.isArray(data)) {
    return 'CSV 변환은 객체 배열이 필요합니다';
  }
  if (data.length === 0) return '';

  const firstItem = data[0] as Record<string, unknown>;
  const keys = Object.keys(firstItem);
  let csv = keys.join(',') + '\n';

  data.forEach((row) => {
    const record = row as Record<string, unknown>;
    const values = keys.map((key) => {
      const val = record[key];
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    csv += values.join(',') + '\n';
  });

  return csv;
}

const DEFAULT_JSON = `{
  "message": "Pro JSON Studio에 오신 것을 환영합니다! 👋",
  "features": [
    "실시간 JSON 유효성 검증",
    "자동 수정 (JSON5 지원)",
    "트리뷰 탐색기",
    "포맷 변환 (YAML, XML, CSV)",
    "100% 클라이언트 처리"
  ],
  "shortcuts": {
    "format": "Ctrl+Shift+F",
    "find": "Ctrl+F",
    "replace": "Ctrl+H"
  },
  "privacy": "서버로 데이터가 전송되지 않습니다 ✅"
}`;
