import React, { useMemo } from 'react';

interface TextModeProps {
  input: string;
  onInputChange: (v: string) => void;
  output: string;
  realtimeEnabled: boolean;
  onRealtimeChange: (v: boolean) => void;
  urlSafe: boolean;
  onUrlSafeChange: (v: boolean) => void;
  onEncode: () => void;
  onDecode: () => void;
  onCopy: () => Promise<boolean>;
  onClear: () => void;
  onLoadSample: (type: 'korean' | 'jwt' | 'json') => void;
  jwtChip: React.ReactNode;
  showToast: (msg: string) => void;
}

export default function TextMode({
  input,
  onInputChange,
  output,
  realtimeEnabled,
  onRealtimeChange,
  urlSafe,
  onUrlSafeChange,
  onEncode,
  onDecode,
  onCopy,
  onClear,
  onLoadSample,
  jwtChip,
  showToast,
}: TextModeProps) {
  const handleCopy = async () => {
    const ok = await onCopy();
    if (ok) {
      showToast('📋 변환 결과가 클립보드에 복사되었습니다.');
    } else {
      showToast('복사할 내용이 없습니다.');
    }
  };

  // 실시간 텍스트 통계 연산
  const inputBytes = useMemo(() => new Blob([input]).size, [input]);
  const outputBytes = useMemo(() => new Blob([output]).size, [output]);

  const sizeChangeRate = useMemo(() => {
    if (!inputBytes || !outputBytes) return '0%';
    const diff = ((outputBytes - inputBytes) / inputBytes) * 100;
    return diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
  }, [inputBytes, outputBytes]);

  const paddingInfo = useMemo(() => {
    if (!output) return '없음';
    const match = output.match(/=+$/);
    return match ? `${match[0].length}개 (=)` : '패딩 0개';
  }, [output]);

  // 결과 파일(.txt 또는 .b64) 다운로드
  const handleDownload = (ext: 'txt' | 'b64') => {
    if (!output) {
      showToast('다운로드할 변환 결과가 없습니다.');
      return;
    }
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `base64_result_${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`💾 .${ext} 파일로 저장되었습니다.`);
  };

  // 공백 및 줄바꿈 일괄 제거
  const handleCleanWhitespace = () => {
    if (!input) {
      showToast('정리할 입력 텍스트가 없습니다.');
      return;
    }
    const cleaned = input.replace(/\s+/g, '');
    onInputChange(cleaned);
    showToast('✨ 모든 공백 및 줄바꿈을 제거했습니다.');
  };

  return (
    <div className="flex-1 flex flex-col justify-between gap-3 min-h-full animate-fade-in">
      {/* 1. 상단: 빠른 샘플 로드 & 간이 클린 도구 바 */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-0.5 shrink-0 hide-scrollbar">
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-slate-400 font-extrabold mr-1">샘플:</span>
          <button
            type="button"
            onClick={() => onLoadSample('korean')}
            data-screenshot-click="action"
            className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg border bg-white border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            한글 UTF-8
          </button>
          <button
            type="button"
            onClick={() => onLoadSample('jwt')}
            className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg border bg-white border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            JWT 토큰
          </button>
          <button
            type="button"
            onClick={() => onLoadSample('json')}
            className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg border bg-white border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            JSON 데이터
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {input && (
            <button
              type="button"
              onClick={handleCleanWhitespace}
              className="px-2 py-1 text-[10px] font-bold rounded-lg border bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              title="공백 및 줄바꿈 일괄 제거"
            >
              공백 제거
            </button>
          )}
          <button
            type="button"
            onClick={onClear}
            className="px-2.5 py-1 text-[10px] font-bold rounded-lg border bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 transition-all cursor-pointer shrink-0"
          >
            초기화
          </button>
        </div>
      </div>

      {/* 2. 입력 패널 (Input Panel) - 화면 전체 비율에 맞춰 유연하게 확장되는 Flex 영역 */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs flex flex-col gap-2 flex-1 min-h-[130px]">
        <div className="flex items-center justify-between shrink-0">
          <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
            <i className="fas fa-arrow-down-long-arrow-up-long text-indigo-600"></i>
            <span>변환할 텍스트 입력 (Input)</span>
          </label>
          <span className="text-[10px] text-slate-400 font-mono font-medium">
            {input.length.toLocaleString()}자 · {inputBytes.toLocaleString()} bytes
          </span>
        </div>

        <textarea
          data-screenshot-input="Hello VeraNex!"
          className="w-full flex-1 min-h-[90px] base64-textarea resize-none leading-relaxed"
          placeholder="인코딩할 평문 또는 디코딩할 Base64 문자열을 입력하세요..."
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
        />
      </div>

      {/* 3. 중앙 제어 & 액션 바 (Controls & Conversion Actions) */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-xs space-y-2 shrink-0">
        <div className="flex items-center justify-between text-xs px-1">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-bold select-none">
            <input
              type="checkbox"
              checked={realtimeEnabled}
              onChange={(e) => onRealtimeChange(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span>실시간 자동 인코딩</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-bold select-none">
            <input
              type="checkbox"
              checked={urlSafe}
              onChange={(e) => onUrlSafeChange(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span>URL Safe (-_ 대체)</span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onEncode}
            data-screenshot-click="result"
            className="py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <i className="fas fa-lock text-amber-300 text-xs"></i>
            <span>Base64로 인코딩 ⬇</span>
          </button>

          <button
            type="button"
            onClick={onDecode}
            className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <i className="fas fa-lock-open text-indigo-600 text-xs"></i>
            <span>원본으로 디코딩 ⬆</span>
          </button>
        </div>
      </div>

      {/* 4. 출력 패널 (Output Panel) - 입력창과 대칭을 이루는 Flex 가변 작업 영역 */}
      <div
        data-screenshot-point="result"
        className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs flex flex-col gap-2 flex-1 min-h-[130px]"
      >
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <i className="fas fa-check-double text-emerald-600"></i>
              <span>변환 결과 (Output)</span>
            </label>
            {jwtChip}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!output}
            className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer active:scale-95 shadow-2xs shrink-0"
          >
            <i className="fas fa-copy text-xs"></i>
            <span>결과 복사</span>
          </button>
        </div>

        <textarea
          className="w-full flex-1 min-h-[90px] base64-textarea bg-slate-50/70 resize-none leading-relaxed"
          placeholder="변환된 Base64 문자열 또는 디코딩 결과가 여기에 표시됩니다..."
          value={output}
          readOnly
        />
      </div>

      {/* 5. 실시간 데이터 분석 & 스마트 툴바 패널 (하단 데드스페이스 해소 및 시각적 밸런스 완성) */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-xs space-y-2 shrink-0">
        {/* 통계 메트릭 4분할 바 */}
        <div className="grid grid-cols-4 gap-1.5 text-center">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-1.5">
            <span className="block text-[9px] font-bold text-slate-400">입력 크기</span>
            <span className="text-[11px] font-mono font-black text-slate-700">{inputBytes} B</span>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-1.5">
            <span className="block text-[9px] font-bold text-slate-400">결과 크기</span>
            <span className="text-[11px] font-mono font-black text-indigo-600">{outputBytes} B</span>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-1.5">
            <span className="block text-[9px] font-bold text-slate-400">용량 변화</span>
            <span
              className={`text-[11px] font-mono font-black ${
                sizeChangeRate.startsWith('+') ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {sizeChangeRate}
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-1.5">
            <span className="block text-[9px] font-bold text-slate-400">패딩 상태</span>
            <span className="text-[10px] font-mono font-bold text-slate-600 truncate block">
              {paddingInfo}
            </span>
          </div>
        </div>

        {/* 하단 스마트 빠른 도구 (다운로드 및 보조 동작) */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>RFC 4648 표준 엔진</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleDownload('txt')}
              disabled={!output}
              className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1"
            >
              <i className="fas fa-file-lines text-slate-500 text-[9px]"></i>
              <span>.txt 저장</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownload('b64')}
              disabled={!output}
              className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1"
            >
              <i className="fas fa-download text-indigo-600 text-[9px]"></i>
              <span>.b64 저장</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
