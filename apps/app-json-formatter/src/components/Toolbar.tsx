interface ToolbarProps {
  onFormat: () => void;
  onMinify: () => void;
  onAutoFix: () => void;
  onClear: () => void;
  onCopy: () => void;
  indent: number | 'tab';
  onIndentChange: (indent: number | 'tab') => void;
}

export default function Toolbar({ onFormat, onMinify, onAutoFix, onClear, onCopy, indent, onIndentChange }: ToolbarProps) {
  const handleIndentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onIndentChange(val === 'tab' ? 'tab' : parseInt(val));
  };

  return (
    <div className="flex items-center gap-2 px-4 py-3 flex-wrap"
         style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>

      <button onClick={onFormat} title="JSON 포맷팅 (Ctrl+Shift+F)"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium text-white transition-all hover:brightness-90"
              style={{ background: 'var(--accent-blue)' }}>
        <i className="fas fa-magic" /> <span className="hidden sm:inline">Format</span>
      </button>

      <button onClick={onMinify} title="JSON 압축"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium transition-all hover:brightness-125"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
        <i className="fas fa-compress" /> <span className="hidden sm:inline">Minify</span>
      </button>

      <button onClick={onAutoFix} title="JSON 자동 수정"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium text-white transition-all hover:brightness-90"
              style={{ background: '#388e3c' }}>
        <i className="fas fa-wrench" /> <span className="hidden sm:inline">Auto Fix</span>
      </button>

      <button onClick={onClear} title="모두 지우기"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium transition-all hover:brightness-125"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
        <i className="fas fa-eraser" /> <span className="hidden sm:inline">Clear</span>
      </button>

      <button onClick={onCopy} title="클립보드에 복사"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium transition-all hover:brightness-125"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
        <i className="fas fa-copy" /> <span className="hidden sm:inline">Copy</span>
      </button>

      <div className="hidden sm:flex items-center gap-2 ml-auto text-xs">
        <label htmlFor="indent-select">Indent:</label>
        <select id="indent-select" value={String(indent)} onChange={handleIndentChange}
                className="px-2.5 py-1.5 rounded text-sm cursor-pointer"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
          <option value="2">2 spaces</option>
          <option value="4">4 spaces</option>
          <option value="tab">Tab</option>
        </select>
      </div>

      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs"
           style={{ background: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)', color: 'var(--success-green)' }}>
        <i className="fas fa-shield-alt" />
        <span className="hidden sm:inline">100% Client-side</span>
        <span className="sm:hidden">Secure</span>
      </div>
    </div>
  );
}
