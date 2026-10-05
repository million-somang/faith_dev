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
      <div className="h-full flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#FAF8F5]">
        <div className="w-16 h-16 rounded-3xl bg-[#F0EAE1] shadow-inner flex items-center justify-center mb-4 text-3xl text-[#8C521A]">
          <i className="fa-solid fa-arrows-repeat"></i>
        </div>
        <h3 className="text-base font-black text-[#2D2A26] mb-1.5">
          변환할 유효한 JSON이 없습니다
        </h3>
        <p className="text-xs text-[#7A7268] max-w-xs mb-5 leading-relaxed">
          먼저 포맷터 탭에서 유효한 JSON을 입력하거나 정렬·자동수정을 진행해주세요.
        </p>
        <button
          onClick={onGoToFormatter}
          className="px-4 py-2.5 rounded-xl bg-[#2D2A26] text-[#FAF8F5] text-xs font-bold shadow-md hover:bg-black transition-colors cursor-pointer"
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
    <div className="h-full flex-1 min-h-0 flex flex-col justify-between p-3 gap-2 overflow-hidden bg-[#FAF8F5]">
      {/* Zone 1: Format Selector Bar (shrink-0) */}
      <div className="bg-white rounded-2xl p-2.5 border border-[#E0D9CC] shadow-2xs flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'typescript', label: 'TypeScript', icon: 'fa-brands fa-js' },
            { id: 'yaml', label: 'YAML', icon: 'fa-solid fa-file-code' },
            { id: 'xml', label: 'XML', icon: 'fa-solid fa-code' },
            { id: 'csv', label: 'CSV (엑셀)', icon: 'fa-solid fa-table' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setFormat(item.id as ConvertFormat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                format === item.id
                  ? 'bg-[#2D2A26] text-white shadow-xs font-black'
                  : 'bg-[#F5F2EB] text-[#5C5449] hover:bg-[#EBE5DA]'
              }`}
            >
              <i className={`${item.icon} text-xs`}></i>
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleCopy}
            className={`px-2.5 py-1.5 text-xs font-black rounded-xl border transition-all flex items-center gap-1 cursor-pointer active:scale-98 ${
              copyFeedback
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white border-[#DCD5C9] text-[#2D2A26] hover:bg-[#FAF8F5] shadow-2xs'
            }`}
          >
            <i className={`fa-solid ${copyFeedback ? 'fa-check' : 'fa-copy'}`}></i>
            <span>{copyFeedback ? '복사됨!' : '복사'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="px-2.5 py-1.5 text-xs font-black rounded-xl bg-white border border-[#DCD5C9] text-[#2D2A26] hover:bg-[#FAF8F5] transition-all flex items-center gap-1 cursor-pointer active:scale-98 shadow-2xs"
          >
            <i className="fa-solid fa-download text-amber-600"></i>
            <span>저장</span>
          </button>
        </div>
      </div>

      {/* Zone 2: Flexible Full-Height Code Preview Workspace */}
      <div className="bg-white rounded-2xl border border-[#E0D9CC] shadow-2xs flex-1 min-h-[300px] flex flex-col overflow-hidden relative">
        {/* Notice Sub-Header */}
        <div className="px-3.5 py-2 bg-[#FAF8F5] border-b border-[#EBE6DD] flex items-center justify-between text-[11px] text-[#7A7369] shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#2D2A26] flex items-center gap-1.5">
              <i className="fa-solid fa-code text-amber-600"></i>
              {label} 변환 결과
            </span>
          </div>
          <span className="text-[10px] text-[#8C8479]">
            {format === 'typescript' && '인터페이스 분리 완료'}
            {format === 'yaml' && 'YAML 1.2 표준 규격'}
            {format === 'xml' && 'XML 1.0 유효성 검증'}
            {format === 'csv' && 'RFC 4180 호환'}
          </span>
        </div>

        {/* Code Content */}
        <div className="w-full flex-1 p-3.5 overflow-auto select-text scrollbar-thin">
          {isCsvError ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-[#7A7369] p-4">
              <i className="fa-solid fa-triangle-exclamation text-amber-500 text-3xl mb-2"></i>
              <p className="text-xs font-bold text-[#4A443B] mb-1">CSV 변환 제약사항</p>
              <p className="text-[11px] max-w-xs">{resultText.replace('// ', '')}</p>
            </div>
          ) : (
            <pre className="font-mono-code text-[12px] text-[#2D2A26] leading-relaxed whitespace-pre font-medium">
              {resultText}
            </pre>
          )}
        </div>
      </div>

      {/* Zone 3: Bottom Dock (shrink-0) */}
      <div className="bg-white rounded-2xl p-2.5 border border-[#E0D9CC] shadow-2xs flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-emerald-700 font-bold flex items-center gap-1">
            <i className="fa-solid fa-shield-halved text-xs"></i>
            100% 클라이언트 사이드 변환
          </span>
          <span className="text-[#A39C90]">•</span>
          <span className="text-[#7A7369]">외부 전송 제로</span>
        </div>
        <button
          onClick={onGoToFormatter}
          className="text-amber-800 hover:text-amber-900 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
        >
          <i className="fa-solid fa-pen-to-square text-[10px]"></i>
          <span>소스 JSON 수정</span>
        </button>
      </div>
    </div>
  );
};
