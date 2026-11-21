import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ImageFileItem } from '../types/index';

interface BeforeAfterComparePanelProps {
  item: ImageFileItem;
  allDoneItems: readonly ImageFileItem[];
  onSelectCompareItem: (id: string) => void;
}

type PanPreset = 'center' | 'tl' | 'tr' | 'bl' | 'br';

const PAN_COORDS: Record<PanPreset, { x: number; y: number; label: string }> = {
  center: { x: 0.5, y: 0.5, label: '중앙' },
  tl: { x: 0.25, y: 0.25, label: '좌상' },
  tr: { x: 0.75, y: 0.25, label: '우상' },
  bl: { x: 0.25, y: 0.75, label: '좌하' },
  br: { x: 0.75, y: 0.75, label: '우하' },
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
  if (engine === 'ai-esrgan') return 'AI 초해상도 (ESRGAN)';
  if (engine === 'lanczos3') return '초고속 Lanczos-3';
  return '표준 리사이즈';
}

export const BeforeAfterComparePanel: React.FC<BeforeAfterComparePanelProps> = ({
  item,
  allDoneItems,
  onSelectCompareItem,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beforeImgRef = useRef<HTMLImageElement | null>(null);
  const afterImgRef = useRef<HTMLImageElement | null>(null);
  const isDraggingRef = useRef(false);

  const [splitRatio, setSplitRatio] = useState<number>(0.5);
  const [zoomMode, setZoomMode] = useState<'fit' | '200'>('fit');
  const [panPreset, setPanPreset] = useState<PanPreset>('center');
  const [imagesReady, setImagesReady] = useState<boolean>(false);

  const renderComparison = useCallback(() => {
    const canvas = canvasRef.current;
    const beforeImg = beforeImgRef.current;
    const afterImg = afterImgRef.current;
    if (!canvas || !beforeImg || !afterImg) return;

    const parentWidth = canvas.parentElement?.clientWidth ?? 640;
    const cssWidth = Math.max(280, Math.round(parentWidth));
    const aspect =
      (afterImg.naturalHeight || item.originalHeight || 9) /
      Math.max(1, afterImg.naturalWidth || item.originalWidth || 16);
    const cssHeight = Math.max(200, Math.min(440, Math.round(cssWidth * aspect)));
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

    const focus = PAN_COORDS[panPreset];

    const drawSourceMapped = (
      source: HTMLImageElement,
      clipStartX: number,
      clipEndX: number,
      smooth: boolean
    ) => {
      if (clipEndX <= clipStartX) return;
      const srcW = source.naturalWidth || source.width;
      const srcH = source.naturalHeight || source.height;

      ctx.save();
      ctx.beginPath();
      ctx.rect(clipStartX, 0, clipEndX - clipStartX, cssHeight);
      ctx.clip();
      ctx.imageSmoothingEnabled = smooth;
      ctx.imageSmoothingQuality = smooth ? 'high' : 'low';

      if (zoomMode === 'fit') {
        const scale = Math.min(cssWidth / srcW, cssHeight / srcH);
        const drawW = srcW * scale;
        const drawH = srcH * scale;
        const dx = (cssWidth - drawW) / 2;
        const dy = (cssHeight - drawH) / 2;
        ctx.drawImage(source, 0, 0, srcW, srcH, dx, dy, drawW, drawH);
      } else {
        // 200% 돋보기: 전체 폭의 절반 영역을 크롭하여 두 이미지의 1:1 픽셀 차이를 확대 비교
        const cropFrac = 0.42;
        const sCropW = srcW * cropFrac;
        const sCropH = srcH * cropFrac;
        const sx = Math.max(0, Math.min(srcW - sCropW, focus.x * srcW - sCropW / 2));
        const sy = Math.max(0, Math.min(srcH - sCropH, focus.y * srcH - sCropH / 2));
        ctx.drawImage(source, sx, sy, sCropW, sCropH, 0, 0, cssWidth, cssHeight);
      }
      ctx.restore();
    };

    const splitX = Math.max(0, Math.min(cssWidth, splitRatio * cssWidth));

    // 좌측 Before (돋보기 시 최근접 이웃 픽셀화로 원본 저해상도 한계 대비)
    drawSourceMapped(beforeImg, 0, splitX, zoomMode === 'fit');
    // 우측 After (업스케일 결과는 항상 고화질 렌더링)
    drawSourceMapped(afterImg, splitX, cssWidth, true);

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
  }, [item.originalHeight, item.originalWidth, panPreset, splitRatio, zoomMode]);

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

  const scaleFactor = (item.resizedWidth / Math.max(1, item.originalWidth)).toFixed(1);

  return (
    <div className="bg-[#FAF8F5] rounded-2xl p-3.5 sm:p-4 border border-[#E5DDD0] space-y-3">
      {/* 상단 비교 컨트롤 바 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-black">
            <i className="fas fa-columns"></i>
            Before / After 비교
          </span>
          <span className="text-[11px] font-extrabold text-[#2D2A26]">
            {getEngineLabel(item.usedEngine)} · {scaleFactor}× 확대
          </span>
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

        {/* 보기 배율 전환 */}
        <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-[#DFD9CE]">
          <button
            type="button"
            onClick={() => setZoomMode('fit')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-colors ${
              zoomMode === 'fit'
                ? 'bg-[#2D2A26] text-white'
                : 'text-stone-600 hover:text-[#2D2A26]'
            }`}
          >
            전체 맞춤
          </button>
          <button
            type="button"
            onClick={() => setZoomMode('200')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-colors ${
              zoomMode === '200'
                ? 'bg-indigo-600 text-white'
                : 'text-stone-600 hover:text-[#2D2A26]'
            }`}
          >
            <i className="fas fa-magnifying-glass-plus mr-1"></i>
            200% 돋보기
          </button>
        </div>
      </div>

      {/* 분할 비교 Canvas 뷰어 */}
      <div className="relative rounded-xl overflow-hidden border border-[#DCD5C8] bg-white shadow-inner">
        <canvas
          ref={canvasRef}
          onPointerDown={(e) => {
            isDraggingRef.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            updateSplitFromClientX(e.clientX);
          }}
          onPointerMove={(e) => {
            if (!isDraggingRef.current) return;
            updateSplitFromClientX(e.clientX);
          }}
          onPointerUp={() => {
            isDraggingRef.current = false;
          }}
          onPointerCancel={() => {
            isDraggingRef.current = false;
          }}
          className="w-full block cursor-ew-resize touch-none"
        />

        {/* 좌/우 라벨 배지 */}
        <div className="pointer-events-none absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#2D2A26]/85 text-white text-[10px] font-mono font-bold">
          원본 {item.originalWidth}×{item.originalHeight}
        </div>
        <div className="pointer-events-none absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-indigo-600/90 text-white text-[10px] font-mono font-bold">
          결과 {item.resizedWidth}×{item.resizedHeight}
        </div>
      </div>

      {/* 하단 슬라이더 + 200% 돋보기 초점 위치 선택 */}
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

        {zoomMode === '200' && (
          <div className="flex items-center gap-1 flex-wrap shrink-0">
            <span className="text-[10px] font-bold text-stone-500 mr-1">확대 부위:</span>
            {(Object.keys(PAN_COORDS) as PanPreset[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setPanPreset(key)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border cursor-pointer ${
                  panPreset === key
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-stone-600 border-[#DFD9CE] hover:bg-stone-100'
                }`}
              >
                {PAN_COORDS[key].label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
