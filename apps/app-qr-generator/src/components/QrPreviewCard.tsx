import React, { useEffect, useRef } from 'react';
import { QrDesignSettings, QrMatrixResult } from '../types';
import { getContrastRatio, renderQrToCanvas, renderQrToSvgString } from '../utils/qrRenderer';

interface QrPreviewCardProps {
  matrix: QrMatrixResult;
  payloadText: string;
  design: QrDesignSettings;
  onShowToast: (msg: string) => void;
}

export default function QrPreviewCard({
  matrix,
  payloadText,
  design,
  onShowToast,
}: QrPreviewCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    void renderQrToCanvas(canvasRef.current, matrix, design);
  }, [matrix, design]);

  const contrastRatio = getContrastRatio(design.fgColor, design.bgColor);
  const isGoodContrast = contrastRatio >= 4.0;

  // PNG 또는 WebP 다운로드
  const handleDownloadRaster = (format: 'png' | 'webp') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const mime = format === 'webp' ? 'image/webp' : 'image/png';
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          onShowToast('이미지 생성에 실패했습니다.');
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `veranex_qrcode_${design.size}px_${Date.now()}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        onShowToast(`✅ 고해상도 ${format.toUpperCase()} 파일이 다운로드되었습니다.`);
      },
      mime,
      0.95
    );
  };

  // 인쇄용 벡터 SVG 다운로드
  const handleDownloadSvg = () => {
    const svgString = renderQrToSvgString(matrix, design);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `veranex_qrcode_vector_${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    onShowToast('✅ 인쇄용 무한 해상도 SVG 벡터 파일이 저장되었습니다.');
  };

  // 클립보드에 QR 이미지 직접 복사
  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png')
      );
      if (blob && navigator.clipboard && 'write' in navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        onShowToast('📋 QR코드 이미지가 클립보드에 복사되었습니다! (Ctrl+V로 붙여넣기)');
        return;
      }
    } catch (_err) {
      // 클립보드 이미지 미지원 환경일 경우 원문 텍스트 복사로 폴백
    }

    try {
      await navigator.clipboard.writeText(payloadText);
      onShowToast('📋 QR코드 연결 데이터가 클립보드에 복사되었습니다.');
    } catch (_e) {
      onShowToast('복사에 실패했습니다. 다운로드 버튼을 이용해 주세요.');
    }
  };

  const ecPercentMap = { L: '7%', M: '15%', Q: '25%', H: '30%' };

  return (
    <div
      data-screenshot-point="result"
      className="bg-white rounded-3xl p-4 sm:p-6 border border-[#EBE6DD] shadow-xs flex flex-col justify-between space-y-4"
    >
      {/* 상단 프리뷰 헤더 */}
      <div className="flex items-center justify-between border-b border-[#EBE6DD] pb-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 block">
            LIVE VECTOR &amp; CANVAS PREVIEW
          </span>
          <h2 className="text-sm sm:text-base font-black text-[#2D2A26]">
            실시간 QR코드 프리뷰 &amp; 다운로드
          </h2>
        </div>
        <span
          className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
            isGoodContrast
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-300'
          }`}
        >
          {isGoodContrast ? `스캔 적합도 최상 (${contrastRatio}:1)` : `명암 대비 주의 (${contrastRatio}:1)`}
        </span>
      </div>

      {/* 중앙 캔버스 프리뷰 영역 */}
      <div className="bg-[#FAF8F5] border border-[#EBE6DD] rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center">
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-[#EBE6DD] flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="w-56 h-auto sm:w-64 max-w-full rounded-lg object-contain"
          />
        </div>
        <p className="text-[11px] font-medium text-stone-500 mt-3 text-center">
          스마트폰 기본 카메라로 위 화면을 비추면 즉시 스캔 테스트를 할 수 있습니다.
        </p>
      </div>

      {/* 다운로드 & 복사 액션 버튼 그리드 */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            data-screenshot-click="result"
            onClick={() => handleDownloadRaster('png')}
            className="py-3 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
          >
            <i className="fas fa-download text-xs"></i>
            <span>PNG 고화질 저장</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadSvg}
            className="py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
          >
            <i className="fas fa-bezier-curve text-xs"></i>
            <span>SVG 벡터 저장 (인쇄용)</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleDownloadRaster('webp')}
            className="py-2.5 px-3 bg-[#FAF8F5] hover:bg-stone-100 text-[#2D2A26] border border-[#EBE6DD] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <i className="fas fa-file-image text-indigo-600 text-xs"></i>
            <span>WebP 경량 저장</span>
          </button>
          <button
            type="button"
            onClick={handleCopyImage}
            className="py-2.5 px-3 bg-[#FAF8F5] hover:bg-stone-100 text-[#2D2A26] border border-[#EBE6DD] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <i className="fas fa-copy text-indigo-600 text-xs"></i>
            <span>클립보드 이미지 복사</span>
          </button>
        </div>
      </div>

      {/* 4대 실시간 QR 행렬 스펙 & 보안 진단 메트릭 바 */}
      <div className="pt-2 border-t border-[#EBE6DD] space-y-2.5">
        <div className="grid grid-cols-4 gap-1.5 text-center">
          <div className="bg-[#FAF8F5] border border-[#EBE6DD] rounded-xl p-2">
            <span className="block text-[9px] font-bold text-stone-400">QR 규격</span>
            <span className="text-[11px] font-mono font-black text-[#2D2A26]">
              V{matrix.version} ({matrix.size}×{matrix.size})
            </span>
          </div>
          <div className="bg-[#FAF8F5] border border-[#EBE6DD] rounded-xl p-2">
            <span className="block text-[9px] font-bold text-stone-400">데이터 용량</span>
            <span className="text-[11px] font-mono font-black text-indigo-600">
              {matrix.byteLength} Bytes
            </span>
          </div>
          <div className="bg-[#FAF8F5] border border-[#EBE6DD] rounded-xl p-2">
            <span className="block text-[9px] font-bold text-stone-400">오류 복원력</span>
            <span className="text-[11px] font-mono font-black text-emerald-700">
              {matrix.ecLevel} ({ecPercentMap[matrix.ecLevel]})
            </span>
          </div>
          <div className="bg-[#FAF8F5] border border-[#EBE6DD] rounded-xl p-2">
            <span className="block text-[9px] font-bold text-stone-400">출력 해상도</span>
            <span className="text-[11px] font-mono font-black text-[#2D2A26]">
              {design.size}px
            </span>
          </div>
        </div>

        {/* 인코딩된 원문 페이로드 요약 */}
        <div className="bg-[#FAF8F5] border border-[#EBE6DD] rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-[11px]">
          <span className="font-bold text-stone-500 shrink-0">인코딩 원문:</span>
          <code className="font-mono text-stone-700 truncate flex-1 text-right">
            {payloadText}
          </code>
        </div>
      </div>
    </div>
  );
}
