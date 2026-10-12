import React from 'react';
import { ImageFileItem } from '../types/index';
import { formatBytes } from '../utils/imageResizer';

interface ActionBarProps {
  items: ImageFileItem[];
  isProcessing: boolean;
  onStartProcess: () => void;
  onDownloadZip: () => void;
  onClearAll: () => void;
  isZipping: boolean;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  items,
  isProcessing,
  onStartProcess,
  onDownloadZip,
  onClearAll,
  isZipping,
}) => {
  const totalCount = items.length;
  const doneCount = items.filter((it) => it.status === 'done').length;
  const totalOriginalSize = items.reduce((sum, it) => sum + (it.originalSize || 0), 0);
  const totalResizedSize = items
    .filter((it) => it.status === 'done' && it.resizedSize)
    .reduce((sum, it) => sum + (it.resizedSize || 0), 0);

  const canDownloadZip = doneCount > 0 && !isProcessing && !isZipping;

  if (totalCount === 0) return null;

  return (
    <div
      data-screenshot-point="result"
      className="p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 sticky bottom-4 z-20"
    >
      {/* 통계 요약 */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-slate-700 w-full md:w-auto">
        <span className="font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200/60">
          {doneCount} / {totalCount}개 처리 완료
        </span>

        {doneCount > 0 && (
          <div className="flex items-center gap-1.5 text-slate-500 font-mono text-xs">
            <span>{formatBytes(totalOriginalSize)}</span>
            <i className="fa-solid fa-arrow-right text-[10px] text-indigo-400"></i>
            <span className="font-bold text-slate-800">{formatBytes(totalResizedSize)}</span>
            {totalOriginalSize > totalResizedSize && (
              <span className="text-emerald-600 font-bold ml-1">
                (↓{Math.round(((totalOriginalSize - totalResizedSize) / totalOriginalSize) * 100)}%)
              </span>
            )}
          </div>
        )}
      </div>

      {/* 액션 버튼 그룹 */}
      <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
        <button
          type="button"
          onClick={onClearAll}
          disabled={isProcessing}
          className="px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-40"
        >
          <i className="fa-regular fa-trash-can mr-1.5"></i>
          비우기
        </button>

        <button
          type="button"
          onClick={onStartProcess}
          disabled={isProcessing || totalCount === 0}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] rounded-xl shadow-md shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <i className="fa-solid fa-spinner fa-spin"></i>
              리사이즈 진행 중...
            </>
          ) : (
            <>
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              리사이즈 시작
            </>
          )}
        </button>

        {canDownloadZip && (
          <button
            type="button"
            onClick={onDownloadZip}
            disabled={isZipping}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 active:scale-[0.98] rounded-xl transition-all disabled:opacity-50"
          >
            {isZipping ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                ZIP 압축 중...
              </>
            ) : (
              <>
                <i className="fa-solid fa-file-zipper"></i>
                ZIP 일괄 다운로드
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
