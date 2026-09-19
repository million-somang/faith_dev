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
      {/* 상단 뷰 선택 탭 바 */}
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
            대조(상하)
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
        <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-3 overflow-hidden">
          {viewTab === 'split' ? (
            /* 🚀 상하(위아래) 2분할 풀-와이드 대조 뷰 */
            <div className="flex flex-col gap-3 w-full">
              {/* 위: 원본 래스터 이미지 */}
              <div className="flex flex-col items-center justify-center w-full">
                <div className="w-full flex items-center justify-between mb-1 text-[10px] font-bold text-slate-400">
                  <span className="flex items-center gap-1">
                    <i className="fas fa-image text-slate-400"></i> 원본 래스터
                  </span>
                  <span className="text-[9px] text-slate-400">비트맵 (확대 시 픽셀 깨짐)</span>
                </div>
                <div className="w-full flex items-center justify-center min-h-[90px] max-h-[125px] overflow-hidden bg-white/70 rounded-xl p-1.5 border border-slate-200/60">
                  {originalUrl && (
                    <img
                      src={originalUrl}
                      alt="Original"
                      className="max-w-full max-h-[115px] object-contain rounded"
                    />
                  )}
                </div>
              </div>

              {/* 중앙 대조 구분선 */}
              <div className="relative flex items-center justify-center my-0.5">
                <div className="w-full border-t border-slate-200/80"></div>
                <span className="absolute bg-indigo-50 border border-indigo-200 text-indigo-700 text-[9px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                  VS
                </span>
              </div>

              {/* 아래: 변환 SVG 벡터 */}
              <div className="flex flex-col items-center justify-center w-full">
                <div className="w-full flex items-center justify-between mb-1 text-[10px] font-bold text-indigo-600">
                  <span className="flex items-center gap-1">
                    <i className="fas fa-vector-square text-indigo-600"></i> 변환 SVG 벡터
                  </span>
                  <span className="text-[9px] text-indigo-500 font-extrabold bg-indigo-50 px-1.5 py-0.5 rounded">
                    무한 해상도 ✨
                  </span>
                </div>
                <div className="w-full flex items-center justify-center min-h-[90px] max-h-[125px] overflow-hidden bg-white/70 rounded-xl p-1.5 border border-indigo-200/60">
                  {svgResult ? (
                    <div
                      className="svg-render-container w-full h-[115px] flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: svgResult }}
                    />
                  ) : (
                    <span className="text-xs text-slate-400">결과 없음</span>
                  )}
                </div>
              </div>
            </div>
          ) : viewTab === 'svg' ? (
            /* SVG 전용 단독 대형 뷰 */
            <div className="w-full flex flex-col items-center justify-center min-h-[220px]">
              <div className="w-full flex items-center justify-between mb-1.5 text-[10px] font-bold text-indigo-600">
                <span>SVG 벡터 전용 뷰 (무한 확대 가능)</span>
                <span className="text-[9px] bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-700 font-black">100% 벡터</span>
              </div>
              <div className="w-full flex items-center justify-center max-h-[250px] min-h-[200px] bg-white rounded-xl p-2 border border-slate-200/80">
                {svgResult ? (
                  <div
                    className="svg-render-container w-full h-[230px]"
                    dangerouslySetInnerHTML={{ __html: svgResult }}
                  />
                ) : (
                  <span className="text-xs text-slate-400">결과 없음</span>
                )}
              </div>
            </div>
          ) : (
            /* 원본 전용 단독 뷰 */
            <div className="w-full flex flex-col items-center justify-center min-h-[220px]">
              <div className="w-full flex items-center justify-between mb-1.5 text-[10px] font-bold text-slate-400">
                <span>원본 비트맵 이미지</span>
                <span className="text-[9px] text-slate-400">래스터</span>
              </div>
              <div className="w-full flex items-center justify-center max-h-[250px] min-h-[200px] bg-white rounded-xl p-2 border border-slate-200/80">
                {originalUrl && (
                  <img
                    src={originalUrl}
                    alt="Original"
                    className="max-w-full max-h-[230px] object-contain rounded-lg"
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
