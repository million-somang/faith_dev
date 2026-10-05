import React, { useState } from 'react';

interface JsonConvertTabProps {
  parsedData: any;
  isValid: boolean;
  toTypeScript: () => string;
  toYaml: () => string;
  toXml: () => string;
  toCsv: () => string;
  onGoToFormatter: () => void;
}

type ConvertFormat = 'typescript' | 'yaml' | 'xml' | 'csv';

export const JsonConvertTab: React.FC<JsonConvertTabProps> = ({
  parsedData,
  isValid,
  toTypeScript,
  toYaml,
  toXml,
  toCsv,
  onGoToFormatter
}) => {
  const [format, setFormat] = useState<ConvertFormat>('typescript');
  const [copyFeedback, setCopyFeedback] = useState(false);

  if (!isValid || parsedData === null || parsedData === undefined) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#F0EAE1] shadow-inner flex items-center justify-center mb-4 text-2xl text-[#8C521A]">
          <i className="fa-solid fa-arrows-repeat"></i>
        </div>
        <h3 className="text-base font-bold text-[#2D2A26] mb-1">
          변환할 유효한 JSON이 없습니다
        </h3>
        <p className="text-xs text-[#7A7268] max-w-xs mb-4">
          먼저 포맷터 탭에서 유효한 JSON을 입력해주세요.
        </p>
        <button
          onClick={onGoToFormatter}
          className="px-4 py-2 rounded-xl bg-[#2D2A26] text-[#FAF8F5] text-xs font-bold shadow-md hover:bg-black transition-colors"
        >
          <i className="fa-solid fa-pen-to-square mr-1.5"></i>
          포맷터로 이동
        </button>
      </div>
    );
  }

  const getResult = () => {
    switch (format) {
      case 'typescript':
        return { text: toTypeScript(), ext: 'ts', mime: 'text/plain', label: 'TypeScript Interface' };
      case 'yaml':
        return { text: toYaml(), ext: 'yaml', mime: 'text/yaml', label: 'YAML' };
      case 'xml':
        return { text: toXml(), ext: 'xml', mime: 'application/xml', label: 'XML' };
      case 'csv':
        return { text: toCsv(), ext: 'csv', mime: 'text/csv', label: 'CSV' };
    }
  };

  const { text: resultText, ext, mime, label } = getResult();

  const handleCopy = () => {
    navigator.clipboard.writeText(resultText);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1500);
  };

  const handleDownload = () => {
    const blob = new Blob([resultText], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted_data.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isCsvError = format === 'csv' && resultText.startsWith('//');

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Format Selection Bar */}
      <div className="px-3 py-2 bg-[#F7F4EE] border-b border-[#E8E2D8] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'typescript', label: 'TypeScript', icon: 'fa-brands fa-js' },
            { id: 'yaml', label: 'YAML', icon: 'fa-solid fa-file-code' },
            { id: 'xml', label: 'XML', icon: 'fa-solid fa-code' },
            { id: 'csv', label: 'CSV (엑셀)', icon: 'fa-solid fa-table' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setFormat(item.id as ConvertFormat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                format === item.id
                  ? 'bg-[#2D2A26] text-[#FAF8F5] shadow-xs'
                  : 'bg-[#EDE7DF] text-[#635B50] hover:bg-[#E2DBD0]'
              }`}
            >
              <i className={`${item.icon} text-[10px]`}></i>
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleCopy}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors flex items-center gap-1 ${
              copyFeedback
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-[#FAF8F5] border-[#DCD5C9] text-[#2D2A26] hover:bg-[#EBE5DA]'
            }`}
          >
            <i className={`fa-solid ${copyFeedback ? 'fa-check' : 'fa-copy'}`}></i>
            <span>{copyFeedback ? '복사됨!' : '복사'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#FAF8F5] border border-[#DCD5C9] text-[#2D2A26] hover:bg-[#EBE5DA] transition-colors flex items-center gap-1"
          >
            <i className="fa-solid fa-download"></i>
            <span>저장</span>
          </button>
        </div>
      </div>

      {/* Notice bar for specific formats */}
      {format === 'typescript' && (
        <div className="px-3 py-1.5 bg-[#F2EDE4] border-b border-[#E5DFD5] text-[11px] text-[#7A7268] flex items-center gap-1.5">
          <i className="fa-solid fa-circle-info text-[#8C521A]"></i>
          <span>현재 JSON 데이터 구조를 분석하여 TypeScript 타입 정의를 자동 추출했습니다.</span>
        </div>
      )}
      {format === 'csv' && (
        <div className="px-3 py-1.5 bg-[#F2EDE4] border-b border-[#E5DFD5] text-[11px] text-[#7A7268] flex items-center gap-1.5">
          <i className="fa-solid fa-circle-info text-[#8C521A]"></i>
          <span>JSON 객체 배열 구조인 경우 엑셀 호환 CSV 테이블로 완벽하게 변환됩니다.</span>
        </div>
      )}

      {/* Editor / Viewer Container */}
      <div className="flex-1 p-3 overflow-hidden bg-[#FAF8F5]">
        <div className="w-full h-full rounded-xl bg-[#F7F3EB] border border-[#E5DFD5] shadow-inner p-3 overflow-auto">
          {isCsvError ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-[#7A7268] p-4">
              <i className="fa-solid fa-triangle-exclamation text-amber-500 text-2xl mb-2"></i>
              <p className="text-xs font-semibold text-[#4A443B] mb-1">CSV 변환 제약사항</p>
              <p className="text-[11px] max-w-xs">{resultText.replace('// ', '')}</p>
            </div>
          ) : (
            <pre className="font-mono text-xs text-[#2D2A26] leading-relaxed whitespace-pre font-medium select-text">
              {resultText}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
