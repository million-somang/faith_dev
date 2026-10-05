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
    <div className="h-full flex-1 min-h-0 flex flex-col justify-between p-3 gap-2 overflow-hidden bg-[#FAF8F5]">
      {/* ======================================================== */}
      {/* Zone 1: 상단 밀착 조작부 그룹 (프리셋 칩 & 실시간 문법 상태) */}
      {/* ======================================================== */}
      <div className="space-y-2 shrink-0">
        {/* 1.1 프리셋 바 & 들여쓰기 스위처 */}
        <div className="bg-white rounded-2xl p-2.5 border border-[#E0D9CC] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-black text-[#2D2A26] flex items-center gap-1.5 text-xs">
              <i className="fas fa-magic text-amber-600"></i>
              샘플 프리셋 불러오기
            </span>
            {/* Indent switcher */}
            <div className="flex items-center gap-1 bg-[#ECE5D8] p-0.5 rounded-lg border border-[#DDD5C7]">
              <button
                onClick={() => setCurrentIndent(2)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  currentIndent === 2
                    ? 'bg-white text-amber-900 shadow-2xs font-black'
                    : 'text-[#61594E] hover:text-[#2D2A26]'
                }`}
              >
                2칸
              </button>
              <button
                onClick={() => setCurrentIndent(4)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  currentIndent === 4
                    ? 'bg-white text-amber-900 shadow-2xs font-black'
                    : 'text-[#61594E] hover:text-[#2D2A26]'
                }`}
              >
                4칸
              </button>
              <button
                onClick={() => setCurrentIndent('tab')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  currentIndent === 'tab'
                    ? 'bg-white text-amber-900 shadow-2xs font-black'
                    : 'text-[#61594E] hover:text-[#2D2A26]'
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
                className="px-2.5 py-1 bg-[#FAF8F5] hover:bg-[#F2ECE1] text-[#332F2A] text-[11px] font-bold rounded-xl border border-[#DFD8CB] transition-all cursor-pointer shrink-0 active:scale-98 shadow-2xs"
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* 1.2 실시간 문법 유효성 인디케이터 */}
        <div
          className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-between shrink-0 transition-colors shadow-2xs ${
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
      </div>

      {/* ======================================================== */}
      {/* Zone 2: 메인 가변 워크스페이스 (850px 뷰포트 풀하이트 에디터) */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-[#E0D9CC] shadow-2xs flex-1 min-h-[260px] flex flex-col overflow-hidden relative">
        {/* Editor Sub-header */}
        <div className="px-3 py-1.5 bg-[#FAF8F5] border-b border-[#EBE6DD] flex items-center justify-between text-[11px] text-[#7A7369] shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#2D2A26] flex items-center gap-1">
              <i className="fa-solid fa-code text-amber-600 text-xs"></i>
              JSON 소스 코드
            </span>
            <span className="text-[10px] text-[#A39C90] hidden sm:inline">
              (직접 수정 및 실시간 파싱)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onDownload}
              className="text-amber-800 hover:text-amber-900 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              title="현재 JSON 파일로 저장"
            >
              <i className="fas fa-download text-[10px]"></i>
              <span>.json 다운로드</span>
            </button>
            <span>•</span>
            <button
              onClick={handleClear}
              className="text-[#A39C90] hover:text-rose-600 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              title="입력 내용 비우기"
            >
              <i className="fas fa-trash-alt text-[10px]"></i>
              <span>지우기</span>
            </button>
          </div>
        </div>

        {/* Textarea Code Editor */}
        <textarea
          value={jsonText}
          onChange={(e) => {
            setJsonText(e.target.value);
            onValidate(e.target.value);
          }}
          data-screenshot-input='{"id": 1024, "username": "veranex_dev", "role": "admin", "verified": true}'
          placeholder="여기에 JSON 데이터를 직접 입력하거나 붙여넣으세요..."
          spellCheck={false}
          className="w-full flex-1 p-3.5 font-mono-code text-[12px] leading-relaxed text-[#2D2A26] bg-transparent resize-none focus:outline-none scrollbar-thin select-text"
        />
      </div>

      {/* ======================================================== */}
      {/* Zone 3: 하단 도킹 조작부 & 메트릭스 독 (shrink-0) */}
      {/* ======================================================== */}
      <div className="space-y-2 shrink-0">
        {/* 3.1 액션 툴바 (4버튼) */}
        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={onFormat}
            data-screenshot-click="action"
            className="h-10 px-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-transform"
            title="들여쓰기 정렬"
          >
            <i className="fas fa-indent text-xs"></i>
            <span>정렬</span>
          </button>

          <button
            onClick={onAutoFix}
            className="h-10 px-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-transform"
            title="따옴표·쉼표 문법 자동 수정"
          >
            <i className="fas fa-wrench text-xs"></i>
            <span>자동수정</span>
          </button>

          <button
            onClick={onMinify}
            className="h-10 px-1 bg-[#F5F2EB] hover:bg-[#EBE6DD] text-[#2D2A26] rounded-xl text-xs font-extrabold border border-[#E0D9CC] flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-transform shadow-2xs"
            title="공백 제거 압축"
          >
            <i className="fas fa-compress-alt text-xs"></i>
            <span>압축</span>
          </button>

          <button
            onClick={handleCopy}
            className={`h-10 px-1 rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-[#2D2A26] hover:bg-[#1A1816] text-white'
            }`}
            title="클립보드 복사"
          >
            <i className={`fas ${copied ? 'fa-check' : 'fa-copy'} text-xs`}></i>
            <span>{copied ? '완료!' : '복사'}</span>
          </button>
        </div>

        {/* 3.2 실시간 데이터 분석 4분할 메트릭스 패널 */}
        <div
          data-screenshot-point="result"
          className="bg-white rounded-2xl p-2.5 border border-[#E0D9CC] shadow-2xs"
        >
          <div className="text-[10px] font-black text-[#7A7369] mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <i className="fa-solid fa-chart-simple text-amber-600"></i>
              실시간 데이터 구조 분석
            </span>
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
    </div>
  );
};
