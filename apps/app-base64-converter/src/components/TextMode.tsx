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

  return (
    <div className="space-y-3.5 animate-fade-in">
      {/* 1. 빠른 샘플 로드 퀵 칩 */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 hide-scrollbar">
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-slate-400 font-bold mr-1">샘플:</span>
          <button
            type="button"
            onClick={() => onLoadSample('korean')}
            data-screenshot-click="action"
            className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg border bg-white border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 transition-all cursor-pointer shadow-2xs"
          >
            한글 UTF-8
          </button>
          <button
            type="button"
            onClick={() => onLoadSample('jwt')}
            className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg border bg-white border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 transition-all cursor-pointer shadow-2xs"
          >
            JWT 토큰
          </button>
          <button
            type="button"
            onClick={() => onLoadSample('json')}
            className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg border bg-white border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 transition-all cursor-pointer shadow-2xs"
          >
            JSON 데이터
          </button>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="px-2 py-1 text-[10px] font-bold rounded-lg border bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 transition-all cursor-pointer shrink-0"
        >
          초기화
        </button>
      </div>

      {/* 2. 입력 패널 (Input Panel) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
            <i className="fas fa-arrow-down-long-arrow-up-long text-indigo-600"></i>
            <span>변환할 텍스트 입력 (Input)</span>
          </label>
          <span className="text-[10px] text-slate-400 font-mono">
            {input.length}자 · {new Blob([input]).size} bytes
          </span>
        </div>

        <textarea
          data-screenshot-input="Hello VeraNex!"
          className="w-full h-28 base64-textarea"
          placeholder="인코딩할 평문 또는 디코딩할 Base64 문자열을 입력하세요..."
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
        />
      </div>

      {/* 3. 중앙 액션 바 및 옵션 토글 */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between text-xs px-1">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-bold">
            <input
              type="checkbox"
              checked={realtimeEnabled}
              onChange={(e) => onRealtimeChange(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span>실시간 자동 인코딩</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-bold">
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
            <i className="fas fa-lock text-amber-300"></i>
            <span>Base64로 인코딩 ⬇</span>
          </button>

          <button
            type="button"
            onClick={onDecode}
            className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <i className="fas fa-lock-open text-indigo-600"></i>
            <span>원본으로 디코딩 ⬆</span>
          </button>
        </div>
      </div>

      {/* 4. 출력 패널 (Output Panel) */}
      <div
        data-screenshot-point="result"
        className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-2"
      >
        <div className="flex items-center justify-between">
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
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer active:scale-95 shadow-2xs"
          >
            <i className="fas fa-copy text-xs"></i>
            <span>결과 복사</span>
          </button>
        </div>

        <textarea
          className="w-full h-32 base64-textarea bg-slate-50/70"
          placeholder="변환된 Base64 문자열 또는 디코딩 결과가 여기에 표시됩니다..."
          value={output}
          readOnly
        />
      </div>
    </div>
  );
}
