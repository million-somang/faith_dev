import { useState, useCallback, useRef } from 'react';

interface ImageModeProps {
  imageData: string | null;
  imageFileName: string;
  onImageFile: (file: File) => void;
  getImageCopyText: (format: 'raw' | 'html' | 'css') => string;
  onLoadSample: () => void;
  onClear: () => void;
}

export default function ImageMode({
  imageData,
  imageFileName,
  onImageFile,
  getImageCopyText,
  onLoadSample,
  onClear,
}: ImageModeProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) onImageFile(file);
    },
    [onImageFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onImageFile(file);
    },
    [onImageFile]
  );

  const showToast = (msg: string) => {
    setCopyToast(msg);
    setTimeout(() => setCopyToast(null), 2000);
  };

  const copyFormat = async (format: 'raw' | 'html' | 'css') => {
    const text = getImageCopyText(format);
    if (!text) {
      showToast('⚠️ 변환할 이미지가 없습니다.');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      const labels = {
        raw: 'Data URI 복사 완료!',
        html: '<img> 태그 복사 완료!',
        css: 'CSS background 복사 완료!',
      };
      showToast(`✅ ${labels[format]}`);
    } catch (_e) {
      showToast('❌ 복사 실패');
    }
  };

  // Base64 Data URL 크기 계산 (KB)
  const dataSizeKb = imageData ? (imageData.length * (3 / 4) / 1024).toFixed(1) : '0';

  return (
    <div className="flex flex-col gap-3.5 pb-2 animate-fadeIn" data-screenshot-target="image-converter">
      {/* 1. 상단 업로드 드롭존 */}
      <div
        className={`relative overflow-hidden rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 ${
          isDragOver
            ? 'border-2 border-indigo-500 bg-indigo-50/50 shadow-inner'
            : 'neu-flat border border-slate-200/80 hover:border-indigo-300 hover:shadow-md'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragOver(false)}
      >
        <div className="w-12 h-12 mx-auto mb-2.5 rounded-2xl neu-flat flex items-center justify-center text-indigo-600 shadow-sm">
          <i className="fas fa-cloud-arrow-up text-xl" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 mb-0.5">이미지 파일을 드래그하거나 클릭하세요</h3>
        <p className="text-xs text-slate-500 font-medium">PNG, JPG, SVG, WebP, GIF 최대 10MB 지원</p>

        <div className="mt-3 flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onLoadSample}
            className="px-3 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-200 rounded-lg shadow-sm transition-all"
          >
            <i className="fas fa-wand-magic-sparkles mr-1" />
            샘플 이미지 불러오기
          </button>
          {imageData && (
            <button
              type="button"
              onClick={onClear}
              className="px-3 py-1 text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 rounded-lg shadow-sm transition-all"
            >
              <i className="fas fa-trash-can mr-1" />
              초기화
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* 2. 이미지 미리보기 카드 */}
      <div className="neu-flat rounded-2xl p-3.5 border border-slate-200/80 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <i className="fas fa-image text-slate-500 text-xs" />
            <span className="text-xs font-bold text-slate-700">이미지 미리보기</span>
          </div>
          {imageData && (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
              <span className="truncate max-w-[130px] font-mono">{imageFileName || 'image.png'}</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                약 {dataSizeKb} KB
              </span>
            </div>
          )}
        </div>

        <div className="w-full h-44 rounded-xl neu-inset border border-slate-200/60 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:12px_12px] flex items-center justify-center overflow-hidden p-2">
          {imageData ? (
            <img
              src={imageData}
              alt="변환된 미리보기"
              className="max-h-full max-w-full object-contain rounded drop-shadow-sm transition-transform hover:scale-105"
            />
          ) : (
            <div className="text-center text-slate-400">
              <i className="fas fa-photo-film text-2xl mb-1.5 opacity-60" />
              <p className="text-xs font-medium">변환된 이미지가 여기에 표시됩니다</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. 복사 및 출력 독 */}
      {imageData && (
        <div className="neu-flat rounded-2xl p-3.5 border border-slate-200/80 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">원클릭 코드 복사</span>
            <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Base64 생성 완료
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => copyFormat('raw')}
              className="px-2.5 py-2 neu-flat hover:neu-pressed active:scale-95 text-slate-700 text-xs font-bold rounded-xl border border-slate-200/80 flex items-center justify-center gap-1.5 transition-all"
            >
              <i className="fas fa-link text-indigo-600 text-[11px]" />
              Data URI
            </button>
            <button
              type="button"
              onClick={() => copyFormat('html')}
              className="px-2.5 py-2 neu-flat hover:neu-pressed active:scale-95 text-slate-700 text-xs font-bold rounded-xl border border-slate-200/80 flex items-center justify-center gap-1.5 transition-all"
            >
              <i className="fas fa-code text-cyan-600 text-[11px]" />
              &lt;img&gt; 태그
            </button>
            <button
              type="button"
              onClick={() => copyFormat('css')}
              className="px-2.5 py-2 neu-flat hover:neu-pressed active:scale-95 text-slate-700 text-xs font-bold rounded-xl border border-slate-200/80 flex items-center justify-center gap-1.5 transition-all"
            >
              <i className="fas fa-palette text-violet-600 text-[11px]" />
              CSS 배경
            </button>
          </div>

          <div className="relative mt-1">
            <textarea
              className="w-full h-20 text-[11px] font-mono text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-400 select-all"
              value={imageData}
              readOnly
            />
            <div className="absolute bottom-2 right-2 text-[10px] text-slate-400 bg-white/80 px-1.5 py-0.5 rounded">
              총 {imageData.length.toLocaleString()} 글자
            </div>
          </div>
        </div>
      )}

      {/* 복사 피드백 토스트 */}
      {copyToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg backdrop-blur-sm animate-bounce">
          {copyToast}
        </div>
      )}
    </div>
  );
}
