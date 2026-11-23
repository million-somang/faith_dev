import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ImageFileItem } from '../types/index';

interface BeforeAfterComparePanelProps {
  item: ImageFileItem;
  allDoneItems: readonly ImageFileItem[];
  onSelectCompareItem: (id: string) => void;
}

type ZoomLevel = 'fit' | 1 | 2 | 4;
type PanPreset = 'center' | 'tl' | 'tr' | 'bl' | 'br';

interface FocusPoint {
  readonly x: number;
  readonly y: number;
}

interface DragSession {
  readonly mode: 'split' | 'pan';
  readonly startClientX: number;
  readonly startClientY: number;
  readonly startFocusX: number;
  readonly startFocusY: number;
  readonly rectWidth: number;
  readonly rectHeight: number;
}

const ZOOM_OPTIONS: readonly { readonly key: ZoomLevel; readonly label: string }[] = [
  { key: 'fit', label: '전체 맞춤' },
  { key: 1, label: '100% (1:1)' },
  { key: 2, label: '200%' },
  { key: 4, label: '400%' },
];

const PAN_COORDS: Record<PanPreset, { x: number; y: number; label: string }> = {
  center: { x: 0.5, y: 0.5, label: '중앙' },
  tl: { x: 0.2, y: 0.2, label: '좌상' },
  tr: { x: 0.8, y: 0.2, label: '우상' },
  bl: { x: 0.2, y: 0.8, label: '좌하' },
  br: { x: 0.8, y: 0.8, label: '우하' },
};

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('비교 이미지를 불러올 수 없습니다.'));
    img.src = src;
  });
}

function getEngineLabel(engine?: ImageFileItem['usedEngine']): string {
  if (engine === 'ai-realesrgan-v3') return 'Real-ESRGAN v3';
  if (engine === 'ai-realesrgan-x4plus') return 'Real-ESRGAN x4plus';
  if (engine === 'lanczos3') return '초고속 Lanczos-3';
  return '표준 리사이즈';
}

function getBackendLabel(backend?: ImageFileItem['runtimeBackend']): string | null {
  if (backend === 'webgpu') return 'WebGPU GPU';
  if (backend === 'wasm') return 'WASM CPU';
  return null;
}

export const BeforeAfterComparePanel: React.FC<BeforeAfterComparePanelProps> = ({
  item,
  allDoneItems,
  onSelectCompareItem,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beforeImgRef = useRef<HTMLImageElement | null>(null);
  const afterImgRef = useRef<HTMLImageElement | null>(null);
  const dragSessionRef = useRef<DragSession | null>(null);

  const [splitRatio, setSplitRatio] = useState<number>(0.5);
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('fit');
  const [focusPoint, setFocusPoint] = useState<FocusPoint>({ x: 0.5, y: 0.5 });
  const [imagesReady, setImagesReady] = useState<boolean>(false);

  useEffect(() => {
    setFocusPoint({ x: 0.5, y: 0.5 });
  }, [item.id]);

  const renderComparison = useCallback(() => {
    const canvas = canvasRef.current;
    const beforeImg = beforeImgRef.current;
    const afterImg = afterImgRef.current;
    if (!canvas || !beforeImg || !afterImg) return;

    const parentWidth = canvas.parentElement?.clientWidth ?? 640;
    const cssWidth = Math.max(280, Math.round(parentWidth));
    const afterW = Math.max(1, afterImg.naturalWidth || afterImg.width || item.resizedWidth || 16);
    const afterH = Math.max(1, afterImg.naturalHeight || afterImg.height || item.resizedHeight || 9);
    const beforeW = Math.max(1, beforeImg.naturalWidth || beforeImg.width || item.originalWidth || 16);
    const beforeH = Math.max(1, beforeImg.naturalHeight || beforeImg.height || item.originalHeight || 9);

    const aspect = afterH / afterW;
    const cssHeight = Math.max(220, Math.min(460, Math.round(cssWidth * aspect)));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 투명 이미지 체커보드 배경
    const tileSize = 14;
    for (let y = 0; y < cssHeight; y += tileSize) {
      for (let x = 0; x < cssWidth; x += tileSize) {
        const isEven = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0;
        ctx.fillStyle = isEven ? '#F5F2EB' : '#E9E3D7';
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }

    const drawSide = (side: 'before' | 'after', clipStartX: number, clipEndX: number) => {
      if (clipEndX <= clipStartX) return;
      const source = side === 'before' ? beforeImg : afterImg;

      ctx.save();
      ctx.beginPath();
      ctx.rect(clipStartX, 0, clipEndX - clipStartX, cssHeight);
      ctx.clip();
      // 좌/우 동일 고화질 샘플링으로 진짜 복원 차이만 정직하게 비교
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      if (zoomLevel === 'fit') {
        const srcW = side === 'before' ? beforeW : afterW;
        const srcH = side === 'before' ? beforeH : afterH;
        const scale = Math.min(cssWidth / srcW, cssHeight / srcH);
        const drawW = srcW * scale;
        const drawH = srcH * scale;
        const dx = (cssWidth - drawW) / 2;
        const dy = (cssHeight - drawH) / 2;
        ctx.drawImage(source, 0, 0, srcW, srcH, dx, dy, drawW, drawH);
      } else {
        const zoom = zoomLevel;
        const drawW = Math.min(cssWidth, afterW * zoom);
        const drawH = Math.min(cssHeight, afterH * zoom);
        const dstX = (cssWidth - drawW) / 2;
        const dstY = (cssHeight - drawH) / 2;

        const aCropW = drawW / zoom;
        const aCropH = drawH / zoom;
        const aX =
          afterW > aCropW
            ? Math.max(0, Math.min(afterW - aCropW, focusPoint.x * afterW - aCropW / 2))
            : 0;
        const aY =
          afterH > aCropH
            ? Math.max(0, Math.min(afterH - aCropH, focusPoint.y * afterH - aCropH / 2))
            : 0;

        if (side === 'after') {
          ctx.drawImage(source, aX, aY, aCropW, aCropH, dstX, dstY, drawW, drawH);
        } else {
          const bX = (aX / afterW) * beforeW;
          const bY = (aY / afterH) * beforeH;
          const bCropW = (aCropW / afterW) * beforeW;
          const bCropH = (aCropH / afterH) * beforeH;
          ctx.drawImage(source, bX, bY, bCropW, bCropH, dstX, dstY, drawW, drawH);
        }
      }
      ctx.restore();
    };

    const splitX = Math.max(0, Math.min(cssWidth, splitRatio * cssWidth));
    drawSide('before', 0, splitX);
    drawSide('after', splitX, cssWidth);

    // 중앙 분할선 + 핸들
    ctx.save();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, cssHeight);
    ctx.stroke();

    const handleY = cssHeight / 2;
    ctx.fillStyle = '#4F46E5';
    ctx.beginPath();
    ctx.arc(splitX, handleY, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('◀ ▶', splitX, handleY);
    ctx.restore();
  }, [
    focusPoint.x,
    focusPoint.y,
    item.originalHeight,
    item.originalWidth,
    item.resizedHeight,
    item.resizedWidth,
    splitRatio,
    zoomLevel,
  ]);

  useEffect(() => {
    let active = true;
    if (!item.previewUrl || !item.resizedUrl) {
      setImagesReady(false);
      return undefined;
    }

    setImagesReady(false);
    Promise.all([loadHtmlImage(item.previewUrl), loadHtmlImage(item.resizedUrl)])
      .then(([beforeImg, afterImg]) => {
        if (!active) return;
        beforeImgRef.current = beforeImg;
        afterImgRef.current = afterImg;
        setImagesReady(true);
      })
      .catch(() => {
        if (active) setImagesReady(false);
      });

    return () => {
      active = false;
    };
  }, [item.previewUrl, item.resizedUrl]);

  useEffect(() => {
    if (!imagesReady) return;
    renderComparison();
    const onResize = () => renderComparison();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [imagesReady, renderComparison]);

  const updateSplitFromClientX = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0) return;
    const next = Math.max(0.05, Math.min(0.95, (clientX - rect.left) / rect.width));
    setSplitRatio(next);
  };

  if (!item.resizedUrl || !item.resizedWidth || !item.resizedHeight) {
    return null;
  }

  const rawScale = item.resizedWidth / Math.max(1, item.originalWidth);
  const scaleBadge = rawScale <= 1.02 ? '1× 화질 복원' : `${rawScale.toFixed(1)}× 확대`;
  const backendLabel = getBackendLabel(item.runtimeBackend);

  return (
    <div className="bg-[#FAF8F5] rounded-2xl p-3.5 sm:p-4 border border-[#E5DDD0] space-y-3">
      {/* 상단 비교 컨트롤 바 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-black">
            <i className="fas fa-columns"></i>
            Before / After
          </span>
          <span className="text-[11px] font-extrabold text-[#2D2A26]">
            {getEngineLabel(item.usedEngine)} · {scaleBadge}
          </span>
          {backendLabel && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-stone-600 border border-[#DFD9CE]">
              {backendLabel}
            </span>
          )}
          {item.sharpnessGainPercent !== undefined && item.sharpnessGainPercent > 0 && (
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              선명도 +{item.sharpnessGainPercent}% 실측
            </span>
          )}
          {allDoneItems.length > 1 && (
            <select
              value={item.id}
              onChange={(e) => onSelectCompareItem(e.target.value)}
              aria-label="비교할 이미지 선택"
              className="px-2 py-1 rounded-lg bg-white border border-[#D9D0C1] text-[11px] font-bold text-[#2D2A26]"
            >
              {allDoneItems.map((doneIt, idx) => (
                <option key={doneIt.id} value={doneIt.id}>
                  {idx + 1}. {doneIt.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 진짜 픽셀 배율 전환 */}
        <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-[#DFD9CE]">
          {ZOOM_OPTIONS.map((opt) => (
            <button
              key={String(opt.key)}
              type="button"
              onClick={() => setZoomLevel(opt.key)}
              className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-colors ${
                zoomLevel === opt.key
                  ? opt.key === 'fit'
                    ? 'bg-[#2D2A26] text-white'
                    : 'bg-indigo-600 text-white'
                  : 'text-stone-600 hover:text-[#2D2A26]'
              }`}
            >
              {opt.key !== 'fit' && zoomLevel === opt.key && (
                <i className="fas fa-magnifying-glass-plus mr-1"></i>
              )}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 분할 비교 Canvas 뷰어 */}
      <div className="relative rounded-xl overflow-hidden border border-[#DCD5C8] bg-white shadow-inner">
        <canvas
          ref={canvasRef}
          onPointerDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const localX = e.clientX - rect.left;
            const splitX = splitRatio * rect.width;
            const nearHandle = zoomLevel === 'fit' || Math.abs(localX - splitX) <= 26;

            dragSessionRef.current = {
              mode: nearHandle ? 'split' : 'pan',
              startClientX: e.clientX,
              startClientY: e.clientY,
              startFocusX: focusPoint.x,
              startFocusY: focusPoint.y,
              rectWidth: rect.width,
              rectHeight: rect.height,
            };
            e.currentTarget.setPointerCapture(e.pointerId);

            if (nearHandle) {
              updateSplitFromClientX(e.clientX);
            }
          }}
          onPointerMove={(e) => {
            const session = dragSessionRef.current;
            if (!session) return;
            if (session.mode === 'split') {
              updateSplitFromClientX(e.clientX);
              return;
            }
            const afterImg = afterImgRef.current;
            if (!afterImg || zoomLevel === 'fit') return;
            const afterW = Math.max(1, afterImg.naturalWidth || afterImg.width);
            const afterH = Math.max(1, afterImg.naturalHeight || afterImg.height);
            const zoom = zoomLevel;
            const deltaFracX = -(e.clientX - session.startClientX) / (afterW * zoom);
            const deltaFracY = -(e.clientY - session.startClientY) / (afterH * zoom);
            const minFracX = Math.min(0.5, session.rectWidth / (2 * zoom * afterW));
            const minFracY = Math.min(0.5, session.rectHeight / (2 * zoom * afterH));
            setFocusPoint({
              x: Math.max(minFracX, Math.min(1 - minFracX, session.startFocusX + deltaFracX)),
              y: Math.max(minFracY, Math.min(1 - minFracY, session.startFocusY + deltaFracY)),
            });
          }}
          onPointerUp={() => {
            dragSessionRef.current = null;
          }}
          onPointerCancel={() => {
            dragSessionRef.current = null;
          }}
          className={`w-full block touch-none ${
            zoomLevel === 'fit' ? 'cursor-ew-resize' : 'cursor-grab active:cursor-grabbing'
          }`}
        />

        {/* 좌/우 라벨 배지 */}
        <div className="pointer-events-none absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#2D2A26]/85 text-white text-[10px] font-mono font-bold">
          원본 {item.originalWidth}×{item.originalHeight}
        </div>
        <div className="pointer-events-none absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-indigo-600/90 text-white text-[10px] font-mono font-bold">
          결과 {item.resizedWidth}×{item.resizedHeight}
        </div>
        {zoomLevel !== 'fit' && (
          <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-bold whitespace-nowrap">
            실제 {zoomLevel * 100}% 픽셀 · 화면 드래그 이동 / 파란 핸들로 비교
          </div>
        )}
      </div>

      {/* 하단 슬라이더 + 확대 초점 위치 빠른 선택 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-[10px] font-bold text-stone-500 shrink-0">좌: 원본</span>
          <input
            type="range"
            min={5}
            max={95}
            value={Math.round(splitRatio * 100)}
            onChange={(e) => setSplitRatio(Number(e.target.value) / 100)}
            aria-label="Before/After 분할 비교 위치"
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <span className="text-[10px] font-bold text-indigo-700 shrink-0">우: 결과</span>
        </div>

        {zoomLevel !== 'fit' && (
          <div className="flex items-center gap-1 flex-wrap shrink-0">
            <span className="text-[10px] font-bold text-stone-500 mr-1">빠른 위치:</span>
            {(Object.keys(PAN_COORDS) as PanPreset[]).map((key) => {
              const target = PAN_COORDS[key];
              const isSelected =
                Math.abs(focusPoint.x - target.x) < 0.03 &&
                Math.abs(focusPoint.y - target.y) < 0.03;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFocusPoint({ x: target.x, y: target.y })}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-stone-600 border-[#DFD9CE] hover:bg-stone-100'
                  }`}
                >
                  {target.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
