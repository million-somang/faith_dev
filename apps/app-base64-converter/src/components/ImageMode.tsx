import { useState, useCallback, useRef } from 'react';

interface ImageModeProps {
  imageData: string | null;
  onImageFile: (file: File) => void;
  getImageCopyText: (format: 'raw' | 'html' | 'css') => string;
}

export default function ImageMode({ imageData, onImageFile, getImageCopyText }: ImageModeProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onImageFile(file);
  }, [onImageFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImageFile(file);
  }, [onImageFile]);

  const copyFormat = async (format: 'raw' | 'html' | 'css') => {
    const text = getImageCopyText(format);
    if (!text) {
      alert('변환할 이미지가 없습니다.');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      alert('복사되었습니다!');
    } catch (_e) {
      alert('복사에 실패했습니다.');
    }
  };

  return (
    <div className="flex flex-col gap-4 p-5" style={{ height: 'calc(100vh - 160px)' }}>
      {/* Top: Drop Zone */}
      <div
        className={`drop-zone min-h-[140px] ${isDragOver ? 'drag-over' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragOver(false)}
      >
        <i className="fas fa-cloud-upload-alt text-4xl mb-3" style={{ color: 'var(--accent-blue)' }} />
        <h3 className="text-lg font-semibold mb-1">이미지 업로드</h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          클릭하거나 이미지를 드래그 앤 드롭
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
          JPG, PNG, GIF, WebP 지원
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Middle: Preview */}
      <div className="flex flex-col rounded-xl p-4 items-center justify-center flex-1 min-h-0"
           style={{ background: 'var(--bg-secondary)' }}>
        <h3 className="text-base font-semibold mb-3 self-start">Preview</h3>
        <div className="flex-1 flex items-center justify-center w-full overflow-auto">
          {imageData ? (
            <img src={imageData} className="image-preview" alt="Preview" />
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              이미지를 업로드하면 미리보기가 표시됩니다
            </p>
          )}
        </div>
      </div>

      {/* Bottom: Copy Buttons & Output */}
      {imageData && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <button onClick={() => copyFormat('raw')}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all hover:brightness-110"
                    style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
              <i className="fas fa-copy" /> Raw Copy
            </button>
            <button onClick={() => copyFormat('html')}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all hover:brightness-110"
                    style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
              <i className="fas fa-code" /> {'<img>'} Copy
            </button>
            <button onClick={() => copyFormat('css')}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all hover:brightness-110"
                    style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
              <i className="fas fa-palette" /> CSS Copy
            </button>
          </div>
          <textarea
            className="min-h-[100px] text-xs"
            value={imageData}
            readOnly
          />
        </div>
      )}
    </div>
  );
}
