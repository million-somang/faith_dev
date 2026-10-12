import React from 'react';
import { ImageFileItem, ResizeSettings } from '../types/index';
import { formatBytes, getOutputFilename } from '../utils/imageResizer';

interface ImageItemCardProps {
  item: ImageFileItem;
  settings: ResizeSettings;
  onRemove: (id: string) => void;
  onDownloadSingle: (item: ImageFileItem) => void;
}

export const ImageItemCard: React.FC<ImageItemCardProps> = ({
  item,
  settings,
  onRemove,
  onDownloadSingle,
}) => {
  const isDone = item.status === 'done';
  const isProcessing = item.status === 'processing';
  const isError = item.status === 'error';

  // 계산된 절감률
  let savedRatio = 0;
  if (isDone && item.resizedSize && item.originalSize) {
    savedRatio = Math.round(((item.originalSize - item.resizedSize) / item.originalSize) * 100);
  }

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

          {/* 에러 메시지 표시 */}
          {isError && (
            <p className="text-xs text-rose-500 font-medium mt-1">
              <i className="fa-solid fa-triangle-exclamation mr-1"></i>
              {item.errorMessage || '변환 실패'}
            </p>
          )}

          {/* 변환 완료 상세 정보 */}
          {isDone && item.resizedWidth && item.resizedHeight && item.resizedSize !== undefined && (
            <div className="flex flex-wrap items-center gap-2 text-xs mt-1.5">
              <span className="text-indigo-600 font-medium flex items-center gap-1 font-mono">
                <i className="fa-solid fa-arrow-right text-[10px]"></i>
                {item.resizedWidth} × {item.resizedHeight}
              </span>
              <span className="font-semibold text-slate-700">
                {formatBytes(item.resizedSize)}
              </span>
              {savedRatio > 0 ? (
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold border border-emerald-200">
                  ↓ {savedRatio}% 절감
                </span>
              ) : savedRatio < 0 ? (
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium border border-amber-200">
                  ↑ {Math.abs(savedRatio)}% 증가
                </span>
              ) : (
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                  동일
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
        {isDone && (
          <button
            type="button"
            onClick={() => onDownloadSingle(item)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200/60"
            title={getOutputFilename(item.name, settings)}
          >
            <i className="fa-solid fa-download"></i>
            다운로드
          </button>
        )}

        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
          title="삭제"
        >
          <i className="fa-regular fa-trash-can text-sm"></i>
        </button>
      </div>
    </div>
  );
};
