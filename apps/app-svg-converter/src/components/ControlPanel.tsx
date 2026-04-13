import { PRESETS, type PresetConfig } from '../hooks/useSvgConverter';

interface ControlPanelProps {
  activePreset: string;
  colorCount: number;
  smoothness: number;
  svgResult: string;
  hasImage: boolean;
  onPresetSelect: (key: string) => void;
  onColorCountChange: (v: number) => void;
  onSmoothnessChange: (v: number) => void;
  onCustomConvert: () => void;
  onCopy: () => Promise<boolean>;
  onDownload: () => void;
  onBase64Link: () => void;
}

export default function ControlPanel({
  activePreset, colorCount, smoothness, svgResult, hasImage,
  onPresetSelect, onColorCountChange, onSmoothnessChange, onCustomConvert,
  onCopy, onDownload, onBase64Link,
}: ControlPanelProps) {

  const handleCopy = async () => {
    const ok = await onCopy();
    if (ok) alert('SVG 코드가 복사되었습니다!');
    else alert('복사할 SVG가 없습니다.');
  };

  return (
    <div className="flex flex-col gap-4 items-center">
      {/* 프리셋 */}
      <div className="flex flex-wrap gap-3 justify-center">
        {PRESETS.map((preset: PresetConfig) => (
          <button
            key={preset.key}
            className={`preset-btn ${activePreset === preset.key ? 'active' : ''}`}
            onClick={() => onPresetSelect(preset.key)}
            disabled={!hasImage}
          >
            <span>{preset.emoji}</span>
            <span>{preset.label}</span>
          </button>
        ))}
      </div>

      {/* 슬라이더 + 커스텀 변환 */}
      <div className="flex items-end gap-6 flex-wrap justify-center">
        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            <i className="fas fa-palette mr-1" />색상 수: <span className="text-white">{colorCount}</span>
          </label>
          <input type="range" min={2} max={128} value={colorCount} onChange={e => onColorCountChange(Number(e.target.value))} />
        </div>
        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            <i className="fas fa-wave-square mr-1" />곡선 부드러움: <span className="text-white">{smoothness.toFixed(1)}</span>
          </label>
          <input type="range" min={0} max={5} step={0.5} value={smoothness} onChange={e => onSmoothnessChange(Number(e.target.value))} />
        </div>
        <button onClick={onCustomConvert} disabled={!hasImage}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40"
          style={{ background: 'var(--accent-blue)' }}>
          <i className="fas fa-cog mr-2" />커스텀 변환
        </button>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-3 flex-wrap justify-center">
        <button onClick={handleCopy} disabled={!svgResult}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40"
          style={{ background: 'var(--accent-green)' }}>
          <i className="fas fa-copy mr-2" />코드 복사
        </button>
        <button onClick={onDownload} disabled={!svgResult}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40"
          style={{ background: 'var(--accent-violet)' }}>
          <i className="fas fa-download mr-2" />SVG 다운로드
        </button>
        {svgResult && (
          <button onClick={onBase64Link}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all border"
            style={{ borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)', background: 'rgba(245,158,11,0.08)' }}>
            <i className="fas fa-link mr-2" />Base64 변환 →
          </button>
        )}
      </div>
    </div>
  );
}
