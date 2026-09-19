import { useState, useCallback, useRef } from 'react';
import { sound } from '../utils/sound';

interface DropZoneProps {
  onFile: (file: File) => void;
  onLoadSample?: () => void;
  compact?: boolean;
}

export default function DropZone({ onFile, onLoadSample, compact = false }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-800 text-xs font-black rounded-xl border border-slate-200/90 shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          <i className="fas fa-cloud-arrow-up text-indigo-600 text-sm"></i>
          <span>새 이미지 파일 선택</span>
        </button>
        {onLoadSample && (
          <button
            type="button"
            onClick={onLoadSample}
            data-screenshot-click="action"
            className="px-3 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-all cursor-pointer active:scale-95"
            title="샘플 그래픽으로 즉시 체험"
          >
            <i className="fas fa-wand-magic-sparkles mr-1"></i>샘플
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className={`bg-white border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all duration-200 select-none shadow-xs ${
          isDragOver
            ? 'border-indigo-600 bg-indigo-50/40 shadow-md scale-[1.01]'
            : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/60'
        }`}
        onClick={() => {
          sound.playClick();
          fileInputRef.current?.click();
        }}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
      >
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl border border-indigo-100 shadow-2xs">
          <i className="fas fa-cloud-arrow-up"></i>
        </div>

        <h3 className="text-sm font-black text-slate-900 mb-1">
          이미지를 끌어다 놓거나 클릭하여 선택
        </h3>
        <p className="text-[11px] text-slate-500 mb-4">
          PNG, JPG, WEBP 지원 · 100% 클라이언트 안전 변환
        </p>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
          <i className="fas fa-shield-halved text-emerald-600"></i>
          <span>서버 전송 없음 (브라우저 메모리 즉시 처리)</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
      </div>

      {/* 원클릭 샘플 체험 버튼 */}
      {onLoadSample && (
        <button
          type="button"
          onClick={onLoadSample}
          data-screenshot-click="action"
          className="w-full py-3 bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 hover:from-indigo-100 hover:to-blue-100 border border-indigo-200/80 rounded-2xl text-indigo-800 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-2xs"
        >
          <i className="fas fa-wand-magic-sparkles text-indigo-600"></i>
          <span>샘플 벡터 로고로 1초 만에 바로 체험하기</span>
        </button>
      )}
    </div>
  );
}
