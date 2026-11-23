import React from 'react';
import { ImageFileItem, ResizeSettings } from '../types/index';
import { formatBytes, getOutputFilename } from '../utils/imageResizer';

interface ImageItemCardProps {
  item: ImageFileItem;
  settings: ResizeSettings;
  onRemove: (id: string) => void;
  onDownloadSingle: (item: ImageFileItem) => void;
  onCompare?: (id: string) => void;
  isComparing?: boolean;
}

function getEngineBadgeLabel(engine?: ImageFileItem['usedEngine']): string | null {
  if (engine === 'ai-esrgan') return 'AI ESRGAN';
  if (engine === 'lanczos3') return 'Lanczos-3';
  return null;
}

export const ImageItemCard: React.FC<ImageItemCardProps> = ({
  item,
  settings,
  onRemove,
  onDownloadSingle,
  onCompare,
  isComparing = false,
}) => {
  const isDone = item.status === 'done';
  const isProcessing = item.status === 'processing';
  const isError = item.status === 'error';
  const engineBadge = getEngineBadgeLabel(item.usedEngine);

  // 계산된 절감률 및 실제 배율
  let savedRatio = 0;
  if (isDone && item.resizedSize && item.originalSize) {
    savedRatio = Math.round(((item.originalSize - item.resizedSize) / item.originalSize) * 100);
  }
  const actualScale =
    isDone && item.resizedWidth ? item.resizedWidth / Math.max(1, item.originalWidth) : 1;
  const pixelMultiplier =
    isDone && item.resizedWidth && item.resizedHeight
      ? (item.resizedWidth * item.resizedHeight) /
        Math.max(1, item.originalWidth * item.originalHeight)
      : 1;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all gap-3 text-slate-800">
      {/* 썸네일 & 파일 기본 정보 */}
      <div className="flex items-center gap-3 w-full sm:w-auto flex-1 min-w-0">
        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 flex items-center justify-center">
          <img
            src={item.previewUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          {isProcessing && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <i className="fa-solid fa-spinner fa-spin text-white text-base"></i>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate" title={item.name}>
            {item.name}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">
              {item.originalWidth} × {item.originalHeight}
            </span>
            <span>{formatBytes(item.originalSize)}</span>
          </div>

          {/* 처리 중 실시간 진행 상태 */}
          {isProcessing && (
            <div className="mt-1.5 flex items-center gap-2 text-[11px] font-bold text-indigo-700">
              <span className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 font-mono">
                {item.progress}%
              </span>
              <span className="truncate">{item.statusText || '업스케일 처리 중...'}</span>
            </div>
          )}

          {/* 에러 메시지 표시 */}
          {isError && (
            <p className="text-xs text-rose-500 font-medium mt-1">
              <i className="fa-solid fa-triangle-exclamation mr-1"></i>
              {item.errorMessage || '변환 실패'}
            </p>
          )}

          {/* 변환 완료 상세 정보 */}
          {isDone && item.resizedWidth && item.resizedHeight && item.resizedSize !== undefined && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs mt-1.5">
              <span className="text-indigo-600 font-bold flex items-center gap-1 font-mono">
                <i className="fa-solid fa-arrow-right text-[10px]"></i>
                {item.resizedWidth} × {item.resizedHeight}
              </span>
              <span className="font-semibold text-slate-700">
                {formatBytes(item.resizedSize)}
              </span>
              {engineBadge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-black border border-indigo-200">
                  {engineBadge}
                </span>
              )}
              {actualScale > 1.02 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-black border border-emerald-200">
                  {actualScale.toFixed(1)}× 확대 (픽셀 {Math.max(1, Math.round(pixelMultiplier))}배)
                </span>
              )}
              {item.wasCappedForMemory && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                  브라우저 한계 보정
                </span>
              )}
              {savedRatio > 0 ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  ↓ {savedRatio}% 절감
                </span>
              ) : savedRatio < 0 ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium border border-stone-200">
                  고해상도 +{Math.abs(savedRatio)}%
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                  동일
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
        {isDone && onCompare && (
          <button
            type="button"
            onClick={() => onCompare(item.id)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer border ${
              isComparing
                ? 'bg-[#2D2A26] text-white border-[#2D2A26]'
                : 'bg-[#FAF8F5] text-stone-700 border-[#DFD9CE] hover:bg-stone-100'
            }`}
          >
            <i className="fa-solid fa-columns text-[10px]"></i>
            비교 보기
          </button>
        )}

        {isDone && (
          <button
            type="button"
            onClick={() => onDownloadSingle(item)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200/60 cursor-pointer"
            title={getOutputFilename(item.name, settings)}
          >
            <i className="fa-solid fa-download"></i>
            다운로드
          </button>
        )}

        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          title="삭제"
        >
          <i className="fa-regular fa-trash-can text-sm"></i>
        </button>
      </div>
    </div>
  );
};
