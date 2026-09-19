import { useState } from 'react';

interface CompareViewProps {
  originalUrl: string | null;
  svgResult: string;
  isConverting: boolean;
  conversionProgress: number;
  conversionStepText: string;
}

export default function CompareView({
  originalUrl,
  svgResult,
  isConverting,
  conversionProgress,
  conversionStepText,
}: CompareViewProps) {
  const [viewTab, setViewTab] = useState<'split' | 'svg' | 'original'>('split');

  return (
    <div
      data-screenshot-point="result"
      className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs space-y-3"
    >
      {/* 뷰 선택 탭 바 */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-xs font-black text-slate-900">벡터 변환 미리보기</span>
        </div>
        <div className="flex bg-slate-100 p-0.5 rounded-xl gap-0.5 text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setViewTab('split')}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
              viewTab === 'split' ? 'bg-white text-indigo-700 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            대조(2분할)
          </button>
          <button
            type="button"
            onClick={() => setViewTab('svg')}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
              viewTab === 'svg' ? 'bg-white text-indigo-700 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            SVG 전용
          </button>
          <button
            type="button"
            onClick={() => setViewTab('original')}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
              viewTab === 'original' ? 'bg-white text-indigo-700 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            원본
          </button>
        </div>
      </div>

      {/* 변환 중 1~100% 실시간 프로그레스 게이지 바 */}
      {isConverting ? (
        <div className="py-12 px-6 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-200/70">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shadow-xs border border-indigo-100 animate-pulse">
            <i className="fas fa-bezier-curve fa-spin"></i>
          </div>
          <div>
            <div className="flex justify-between items-center w-56 text-[11px] font-bold text-slate-600 mb-1">
              <span>{conversionStepText || '벡터 그래픽 렌더링 중...'}</span>
              <span className="font-black text-indigo-600 tabular-nums">{conversionProgress}%</span>
            </div>
            {/* 프로그레스 바 게이지 */}
            <div className="w-56 bg-slate-200 h-2.5 rounded-full overflow-hidden p-0.5 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 rounded-full transition-all duration-75 ease-out shadow-xs"
                style={{ width: `${conversionProgress}%` }}
              ></div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400">
            외곽선 추적 및 베지에 곡선(Bezier Path) 산출 중
          </p>
        </div>
      ) : (
        /* 변환 완료 미리보기 화면 */
        <div className="min-h-[220px] max-h-[260px] flex items-center justify-center bg-slate-50/70 rounded-2xl border border-slate-200/80 p-3 overflow-hidden">
          {viewTab === 'split' ? (
            <div className="grid grid-cols-2 gap-3 w-full h-full items-center">
              {/* 원본 */}
              <div className="flex flex-col items-center justify-center h-full border-r border-slate-200/80 pr-2">
                <span className="text-[10px] font-bold text-slate-400 mb-1.5 flex items-center gap-1">
                  <i className="fas fa-image text-slate-400"></i> 원본 래스터
                </span>
                <div className="flex-1 w-full flex items-center justify-center max-h-[190px]">
                  {originalUrl && (
                    <img
                      src={originalUrl}
                      alt="Original"
                      className="max-w-full max-h-full object-contain rounded-lg shadow-2xs"
                    />
                  )}
                </div>
              </div>
              {/* SVG 결과 */}
              <div className="flex flex-col items-center justify-center h-full pl-2">
                <span className="text-[10px] font-bold text-indigo-600 mb-1.5 flex items-center gap-1">
                  <i className="fas fa-vector-square text-indigo-600"></i> 변환 SVG 벡터 ✨
                </span>
                <div className="flex-1 w-full flex items-center justify-center max-h-[190px]">
                  {svgResult ? (
                    <div
                      className="svg-render-container w-full h-full"
                      dangerouslySetInnerHTML={{ __html: svgResult }}
                    />
                  ) : (
                    <span className="text-xs text-slate-400">결과 없음</span>
                  )}
                </div>
              </div>
            </div>
          ) : viewTab === 'svg' ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-indigo-600 mb-1">SVG 벡터 100% 확대 뷰</span>
              <div className="flex-1 w-full flex items-center justify-center max-h-[210px]">
                {svgResult ? (
                  <div
                    className="svg-render-container w-full h-full"
                    dangerouslySetInnerHTML={{ __html: svgResult }}
                  />
                ) : (
                  <span className="text-xs text-slate-400">결과 없음</span>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-slate-400 mb-1">원본 래스터 뷰</span>
              <div className="flex-1 w-full flex items-center justify-center max-h-[210px]">
                {originalUrl && (
                  <img
                    src={originalUrl}
                    alt="Original"
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
