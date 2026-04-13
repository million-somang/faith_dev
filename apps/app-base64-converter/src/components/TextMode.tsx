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
  jwtChip: React.ReactNode;
}

export default function TextMode({
  input, onInputChange, output,
  realtimeEnabled, onRealtimeChange,
  urlSafe, onUrlSafeChange,
  onEncode, onDecode, onCopy,
  jwtChip,
}: TextModeProps) {

  return (
    <div className="flex flex-col gap-0 p-5" style={{ height: 'calc(100vh - 160px)' }}>
      {/* Input Panel */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-base font-semibold">Input</h3>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input type="checkbox" checked={realtimeEnabled}
                   onChange={(e) => onRealtimeChange(e.target.checked)} />
            <span>실시간 변환</span>
          </label>
        </div>
        <textarea
          className="flex-1"
          placeholder="변환할 텍스트를 입력하세요... (한글 완벽 지원)"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
        />
      </div>

      {/* Action Buttons (Horizontal) */}
      <div className="flex items-center justify-center gap-3 py-3">
        <button onClick={onEncode} title="인코딩"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium text-white transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--accent-blue)' }}>
          <i className="fas fa-arrow-down" />
          Encode
        </button>
        <button onClick={onDecode} title="디코딩"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all hover:brightness-110"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
          <i className="fas fa-arrow-up" />
          Decode
        </button>
        <label className="flex items-center gap-1.5 text-xs cursor-pointer ml-2">
          <input type="checkbox" checked={urlSafe}
                 onChange={(e) => onUrlSafeChange(e.target.checked)} />
          <span>URL Safe</span>
        </label>
      </div>

      {/* Output Panel */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-base font-semibold">Output</h3>
          <div className="flex items-center gap-2">
            {jwtChip}
            <CopyButton onCopy={onCopy} />
          </div>
        </div>
        <textarea
          className="flex-1"
          placeholder="변환 결과가 여기에 표시됩니다..."
          value={output}
          readOnly
        />
      </div>
    </div>
  );
}

function CopyButton({ onCopy }: { onCopy: () => Promise<boolean> }) {
  const handleClick = async () => {
    const success = await onCopy();
    if (!success) alert('복사할 내용이 없습니다.');
  };

  return (
    <button onClick={handleClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium text-white transition-all"
            style={{ background: 'var(--success-green)' }}>
      <i className="fas fa-copy" />
      <span className="hidden sm:inline">복사</span>
    </button>
  );
}
