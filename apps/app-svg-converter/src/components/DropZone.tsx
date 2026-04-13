import { useState, useCallback, useRef } from 'react';

interface DropZoneProps {
  onFile: (file: File) => void;
}

export default function DropZone({ onFile }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }, [onFile]);

  return (
    <div
      className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
      onClick={() => fileInputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
    >
      <i className="fas fa-cloud-upload-alt text-4xl mb-3" style={{ color: 'var(--accent-violet)' }} />
      <h3 className="text-lg font-bold mb-1">이미지를 드래그하거나 클릭하여 업로드</h3>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>PNG, JPG, WEBP 지원 · 100% 클라이언트 처리</p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
    </div>
  );
}
