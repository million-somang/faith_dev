import { PRESETS, type PresetConfig } from '../hooks/useSvgConverter';
import { sound } from '../utils/sound';

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
  showToast: (msg: string) => void;
}

export default function ControlPanel({
  activePreset,
  colorCount,
  smoothness,
  svgResult,
  hasImage,
  onPresetSelect,
  onColorCountChange,
  onSmoothnessChange,
  onCustomConvert,
  onCopy,
  onDownload,
  onBase64Link,
  showToast,
}: ControlPanelProps) {
  const handleCopy = async () => {
    const ok = await onCopy();
    if (ok) {
      showToast('📋 SVG 코드가 클립보드에 복사되었습니다.');
    } else {
      showToast('복사할 SVG 코드가 없습니다.');
    }
  };

  const handleDownload = () => {
    onDownload();
    showToast('📥 SVG 파일이 다운로드되었습니다.');
  };

  return (
    <div className="space-y-3">
      {/* 1. 프리셋 칩 선택 카드 */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
            <i className="fas fa-sliders text-indigo-600"></i>
            <span>최적화 변환 프리셋</span>
          </label>
          <span className="text-[10px] text-slate-400 font-bold">1-클릭 자동 튜닝</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((preset: PresetConfig) => {
            const isSelected = activePreset === preset.key;
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => onPresetSelect(preset.key)}
                disabled={!hasImage}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-center disabled:opacity-40 disabled:cursor-not-allowed ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-black shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-bold'
                }`}
              >
                <span className="text-xl">{preset.emoji}</span>
                <span className="text-xs leading-tight">{preset.label}</span>
                <span className="text-[9px] text-slate-400 font-normal leading-tight">
                  {preset.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. 세부 파라미터 조절 슬라이더 */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
            <i className="fas fa-palette text-indigo-600"></i>
            <span>정밀 벡터 커스텀 설정</span>
          </label>
          {activePreset === 'custom' && (
            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              커스텀 적용 중
            </span>
          )}
        </div>

        <div className="space-y-3">
          {/* 색상 수 조절 */}
          <div>
            <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
              <span>추출 색상 수</span>
              <span className="text-indigo-600 font-black">{colorCount}색</span>
            </div>
            <input
              type="range"
              min={2}
              max={64}
              value={colorCount}
              onChange={(e) => onColorCountChange(Number(e.target.value))}
              disabled={!hasImage}
              className="w-full"
            />
          </div>

          {/* 곡선 부드러움 조절 */}
          <div>
            <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
              <span>곡선 부드러움 (Smoothness)</span>
              <span className="text-indigo-600 font-black">{smoothness.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={5}
              step={0.5}
              value={smoothness}
              onChange={(e) => onSmoothnessChange(Number(e.target.value))}
              disabled={!hasImage}
              className="w-full"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onCustomConvert();
            }}
            disabled={!hasImage}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer active:scale-98"
          >
            <i className="fas fa-arrows-rotate text-indigo-600"></i>
            <span>커스텀 파라미터로 재변환</span>
          </button>
        </div>
      </div>

      {/* 3. 하단 액션 독: 코드 복사 + SVG 다운로드 + Base64 */}
      <div className="pt-1 flex gap-2">
        <button
          type="button"
          onClick={handleCopy}
          disabled={!svgResult}
          data-screenshot-click="result"
          className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer active:scale-98"
        >
          <i className="fas fa-copy text-indigo-600"></i>
          <span>코드 복사</span>
        </button>

        <button
          type="button"
          onClick={handleDownload}
          disabled={!svgResult}
          className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer active:scale-98"
        >
          <i className="fas fa-download text-amber-300"></i>
          <span>SVG 다운로드</span>
        </button>

        {svgResult && (
          <button
            type="button"
            onClick={onBase64Link}
            className="px-3 py-3.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-black rounded-xl border border-amber-200 transition-all flex items-center justify-center cursor-pointer active:scale-98"
            title="Base64 Data URI 변환 도구로 전송"
          >
            <i className="fas fa-arrow-up-right-from-square"></i>
          </button>
        )}
      </div>
    </div>
  );
}
