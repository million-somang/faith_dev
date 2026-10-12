import React, { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { createSampleImageFile } from '../utils/imageResizer';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export default function DropZone({ onFilesSelected, disabled = false }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/')
      );
      if (filesArray.length > 0) {
        onFilesSelected(filesArray);
      }
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesSelected(filesArray);
      // Reset input value to allow re-selecting the same file
      e.target.value = '';
    }
  };

  const handleLoadSample = (e: React.MouseEvent) => {
    e.stopPropagation();
    const sample = createSampleImageFile();
    onFilesSelected([sample]);
  };

  return (
    <div
      data-screenshot-point="entry"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative w-full rounded-3xl p-8 sm:p-10 border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center select-none ${
        isDragOver
          ? 'border-indigo-500 bg-indigo-50/60 scale-[1.01]'
          : 'border-indigo-200/90 bg-white/70 hover:bg-white hover:border-indigo-400 hover:shadow-sm'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* 보라색 원형 구름 아이콘 (스크린샷 일치) */}
      <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl mb-4 shadow-inner ring-4 ring-indigo-50/50">
        <i className="fas fa-cloud-upload-alt"></i>
      </div>

      <h3 className="text-base sm:text-lg font-black text-[#2D2A26] mb-1">
        이미지를 여기에 놓으세요!
      </h3>
      <p className="text-xs sm:text-sm text-stone-500 mb-2 font-medium">
        최대 50장, 장당 30MB까지 (PNG·JPG·WebP·AVIF·HEIC 지원)
      </p>

      <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-stone-400 bg-stone-100/80 px-3 py-1 rounded-full mb-4">
        <i className="fas fa-lock text-emerald-600"></i>
        <span>서버에 이미지를 전송하지 않습니다.</span>
      </div>

      {/* 원클릭 테스트 샘플 로드 버튼 */}
      <button
        type="button"
        onClick={handleLoadSample}
        className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors border border-indigo-200 shadow-2xs flex items-center gap-1.5"
      >
        <i className="fas fa-magic"></i>
        <span>데모 샘플 이미지 즉시 불러오기</span>
      </button>
    </div>
  );
}
