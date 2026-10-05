import React, { useState } from 'react';
import { JsonStats, StatusType } from '../hooks/useJsonEditor';

interface JsonFormatterTabProps {
  jsonText: string;
  setJsonText: (v: string) => void;
  statusType: StatusType;
  statusMessage: string;
  stats: JsonStats;
  currentIndent: number | 'tab';
  setCurrentIndent: (indent: number | 'tab') => void;
  onFormat: () => void;
  onMinify: () => void;
  onAutoFix: () => void;
  onLoadPreset: (name: string) => void;
  onDownload: () => void;
  onValidate: (v: string) => void;
}

export const JsonFormatterTab: React.FC<JsonFormatterTabProps> = ({
  jsonText,
  setJsonText,
  statusType,
  statusMessage,
  stats,
  currentIndent,
  setCurrentIndent,
  onFormat,
  onMinify,
  onAutoFix,
  onLoadPreset,
  onDownload,
  onValidate,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!jsonText.trim()) return;
    navigator.clipboard.writeText(jsonText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleClear = () => {
    if (confirm('에디터 내용을 모두 지우시겠습니까?')) {
      setJsonText('');
      onValidate('');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="space-y-2.5 flex flex-col h-full">
      {/* 1. Quick Presets & Indent controls */}
      <div className="bg-white rounded-2xl p-2.5 border border-[#EBE6DD] shadow-2xs space-y-2 shrink-0">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-extrabold text-[#2D2A26] flex items-center gap-1.5">
            <i className="fas fa-magic text-amber-600"></i>
            샘플 프리셋 불러오기
          </span>
          {/* Indent switcher */}
          <div className="flex items-center gap-1 bg-[#F5F2EB] p-0.5 rounded-lg border border-[#EBE6DD]">
            <button
              onClick={() => setCurrentIndent(2)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                currentIndent === 2 ? 'bg-white text-amber-800 shadow-2xs font-black' : 'text-[#7A7369]'
              }`}
            >
              2칸
            </button>
            <button
              onClick={() => setCurrentIndent(4)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                currentIndent === 4 ? 'bg-white text-amber-800 shadow-2xs font-black' : 'text-[#7A7369]'
              }`}
            >
              4칸
            </button>
            <button
              onClick={() => setCurrentIndent('tab')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                currentIndent === 'tab' ? 'bg-white text-amber-800 shadow-2xs font-black' : 'text-[#7A7369]'
              }`}
            >
              탭
            </button>
          </div>
        </div>

        {/* Preset Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
          {['유저 프로필', 'API 응답', '이커머스 주문', '오류 샘플 (복구용)'].map((name) => (
            <button
              key={name}
              onClick={() => onLoadPreset(name)}
              className="px-2.5 py-1 bg-[#F5F2EB] hover:bg-[#EBE6DD] text-[#2D2A26] text-[10px] font-bold rounded-xl border border-[#EBE6DD] transition-all cursor-pointer shrink-0 active:scale-98"
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Real-time Status Badge */}
      <div
        className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-between shrink-0 transition-colors ${
          statusType === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : statusType === 'error'
            ? 'bg-rose-50 text-rose-800 border-rose-200'
            : 'bg-[#F5F2EB] text-[#7A7369] border-[#EBE6DD]'
        }`}
      >
        <span className="truncate flex items-center gap-1.5">
          <i
            className={`fas ${
              statusType === 'success'
                ? 'fa-check-circle text-emerald-600'
                : statusType === 'error'
                ? 'fa-exclamation-triangle text-rose-500'
                : 'fa-info-circle text-[#7A7369]'
            }`}
          ></i>
          <span className="truncate">{statusMessage}</span>
        </span>
        {statusType === 'error' && (
          <button
            onClick={onAutoFix}
            className="shrink-0 ml-2 px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-black cursor-pointer shadow-2xs"
          >
            오류 자동수정 🪄
          </button>
        )}
      </div>

      {/* 3. Text Editor Area */}
      <div className="bg-white rounded-2xl border border-[#EBE6DD] shadow-2xs flex-1 min-h-[220px] max-h-[300px] flex flex-col overflow-hidden relative">
        <textarea
          value={jsonText}
          onChange={(e) => {
            setJsonText(e.target.value);
            onValidate(e.target.value);
          }}
          data-screenshot-input='{"id": 1024, "username": "veranex_dev", "role": "admin", "verified": true}'
          placeholder="여기에 JSON 데이터를 직접 입력하거나 붙여넣으세요..."
          spellCheck={false}
          className="w-full h-full p-3 font-mono-code text-[11px] leading-relaxed text-[#2D2A26] bg-transparent resize-none focus:outline-none scrollbar-thin"
        />
      </div>

      {/* 4. Action Toolbar */}
      <div className="grid grid-cols-4 gap-1.5 shrink-0">
        <button
          onClick={onFormat}
          data-screenshot-click="action"
          className="py-2 px-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1 cursor-pointer active:scale-98 transition-transform"
          title="들여쓰기 정렬"
        >
          <i className="fas fa-indent text-[11px]"></i>
          <span>정렬</span>
        </button>

        <button
          onClick={onAutoFix}
          className="py-2 px-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1 cursor-pointer active:scale-98 transition-transform"
          title="따옴표·쉼표 문법 자동 수정"
        >
          <i className="fas fa-wrench text-[11px]"></i>
          <span>자동수정</span>
        </button>

        <button
          onClick={onMinify}
          className="py-2 px-1 bg-[#F5F2EB] hover:bg-[#EBE6DD] text-[#2D2A26] rounded-xl text-xs font-extrabold border border-[#EBE6DD] flex items-center justify-center gap-1 cursor-pointer active:scale-98 transition-transform"
          title="공백 제거 압축"
        >
          <i className="fas fa-compress-alt text-[11px]"></i>
          <span>압축</span>
        </button>

        <button
          onClick={handleCopy}
          data-screenshot-click="result"
          className={`py-2 px-1 rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1 cursor-pointer active:scale-98 transition-all ${
            copied
              ? 'bg-emerald-600 text-white'
              : 'bg-[#2D2A26] hover:bg-[#1A1816] text-white'
          }`}
          title="클립보드 복사"
        >
          <i className={`fas ${copied ? 'fa-check' : 'fa-copy'} text-[11px]`}></i>
          <span>{copied ? '완료!' : '복사'}</span>
        </button>
      </div>

      {/* Auxiliary bar: Download & Clear */}
      <div className="flex items-center justify-between px-1 text-[11px] shrink-0">
        <button
          onClick={onDownload}
          className="text-amber-800 hover:text-amber-900 font-bold flex items-center gap-1 cursor-pointer"
        >
          <i className="fas fa-download text-[10px]"></i>
          <span>.json 파일 다운로드</span>
        </button>
        <button
          onClick={handleClear}
          className="text-[#A39C90] hover:text-rose-600 font-medium flex items-center gap-1 cursor-pointer transition-colors"
        >
          <i className="fas fa-trash-alt text-[10px]"></i>
          <span>모두 지우기</span>
        </button>
      </div>

      {/* 5. Real-time Metrics Grid */}
      <div
        data-screenshot-point="result"
        className="bg-white rounded-2xl p-2.5 border border-[#EBE6DD] shadow-2xs shrink-0"
      >
        <div className="text-[10px] font-black text-[#7A7369] mb-1.5 flex items-center justify-between">
          <span>실시간 데이터 구조 분석</span>
          <span className="text-emerald-700 font-bold">100% 로컬 보안 검증</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 text-center">
          <div className="bg-[#FAF8F5] p-1.5 rounded-xl border border-[#EBE6DD]">
            <div className="text-[9px] text-[#A39C90] font-bold">용량</div>
            <div className="text-xs font-black text-amber-700">{formatBytes(stats.sizeBytes)}</div>
          </div>
          <div className="bg-[#FAF8F5] p-1.5 rounded-xl border border-[#EBE6DD]">
            <div className="text-[9px] text-[#A39C90] font-bold">라인 수</div>
            <div className="text-xs font-black text-[#2D2A26]">{stats.lines}</div>
          </div>
          <div className="bg-[#FAF8F5] p-1.5 rounded-xl border border-[#EBE6DD]">
            <div className="text-[9px] text-[#A39C90] font-bold">최대 깊이</div>
            <div className="text-xs font-black text-[#2D2A26]">{stats.depth} Depth</div>
          </div>
          <div className="bg-[#FAF8F5] p-1.5 rounded-xl border border-[#EBE6DD]">
            <div className="text-[9px] text-[#A39C90] font-bold">총 키 개수</div>
            <div className="text-xs font-black text-[#2D2A26]">{stats.keysCount}개</div>
          </div>
        </div>
      </div>
    </div>
  );
};
