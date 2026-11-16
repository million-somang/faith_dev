import React, { useEffect, useRef } from 'react';
import { QrDesignSettings, QrMatrixResult, WizardStep } from '../types';
import { getContrastRatio, renderQrToCanvas, renderQrToSvgString } from '../utils/qrRenderer';

interface QrPreviewCardProps {
  matrix: QrMatrixResult;
  payloadText: string;
  design: QrDesignSettings;
  onUpdateDesign: (partial: Partial<QrDesignSettings>) => void;
  onGoToStep: (step: WizardStep) => void;
  onShowToast: (msg: string) => void;
}

export default function QrPreviewCard({
  matrix,
  payloadText,
  design,
  onUpdateDesign,
  onGoToStep,
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
      className="bg-white rounded-3xl p-5 sm:p-7 border border-[#EBE6DD] shadow-xs flex flex-col justify-between space-y-5 animate-fade-in"
    >
      {/* 상단 완성 헤더 */}
      <div className="flex items-start justify-between border-b border-[#EBE6DD] pb-4 gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-black border border-emerald-200 mb-1.5">
            <i className="fas fa-circle-check"></i> STEP 3 OF 3 · 생성 완료
          </span>
          <h2 className="text-base sm:text-lg font-black text-[#2D2A26]">
            나만의 QR코드가 완성되었습니다!
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            스마트폰 카메라로 스캔해 확인하고 원하는 파일 형식으로 다운로드하세요.
          </p>
        </div>

        <span
          className={`text-[11px] font-black px-3 py-1 rounded-full border shrink-0 ${
            isGoodContrast
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-300'
          }`}
        >
          {isGoodContrast ? `스캔 인식률 최상 (${contrastRatio}:1)` : `명암 대비 주의 (${contrastRatio}:1)`}
        </span>
      </div>

      {/* 중앙 대형 QR 캔버스 프리뷰 영역 */}
      <div className="bg-[#FAF8F5] border border-[#EBE6DD] rounded-2xl p-6 flex flex-col items-center justify-center">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#EBE6DD] flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="w-60 h-auto sm:w-72 max-w-full rounded-lg object-contain"
          />
        </div>

        {/* 저장 해상도 빠른 선택 칩 */}
        <div className="flex items-center gap-2 mt-4">
          <span className="text-[11px] font-bold text-stone-500">저장 화질:</span>
          {(
            [
              { sz: 512, label: '512px (웹용)' },
              { sz: 1024, label: '1024px (고화질 권장)' },
              { sz: 2048, label: '2048px (인쇄용)' },
            ] as const
          ).map((item) => (
            <button
              key={item.sz}
              type="button"
              onClick={() => onUpdateDesign({ size: item.sz })}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-all ${
                design.size === item.sz
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                  : 'bg-white text-stone-600 border-[#EBE6DD] hover:bg-stone-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 다운로드 & 복사 대형 액션 버튼 그리드 */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleDownloadRaster('png')}
            className="py-4 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <i className="fas fa-download"></i>
            <span>PNG 고화질 이미지 다운로드</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadSvg}
            className="py-4 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <i className="fas fa-bezier-curve"></i>
            <span>SVG 벡터 다운로드 (인쇄소용)</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleCopyImage}
            className="py-3 px-3 bg-[#FAF8F5] hover:bg-stone-200/60 text-[#2D2A26] border border-[#EBE6DD] text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <i className="fas fa-copy text-indigo-600"></i>
            <span>클립보드에 이미지 복사</span>
          </button>
          <button
            type="button"
            onClick={() => handleDownloadRaster('webp')}
            className="py-3 px-3 bg-[#FAF8F5] hover:bg-stone-200/60 text-[#2D2A26] border border-[#EBE6DD] text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <i className="fas fa-file-image text-indigo-600"></i>
            <span>WebP 경량 포맷 저장</span>
          </button>
        </div>
      </div>

      {/* 생성된 QR 요약 스펙 */}
      <div className="pt-2 border-t border-[#EBE6DD] space-y-2">
        <div className="grid grid-cols-4 gap-2 text-center">
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
            <span className="block text-[9px] font-bold text-stone-400">유효기간</span>
            <span className="text-[11px] font-black text-emerald-700">평생 무제한</span>
          </div>
        </div>
      </div>

      {/* 하단 스텝 이동 네비게이션 버튼 */}
      <div className="pt-2 flex flex-col sm:flex-row gap-2.5 border-t border-[#EBE6DD]">
        <button
          type="button"
          onClick={() => onGoToStep(2)}
          className="flex-1 py-3.5 px-4 bg-[#FAF8F5] hover:bg-stone-200/70 text-[#2D2A26] border border-[#EBE6DD] text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <i className="fas fa-palette text-indigo-600"></i>
          <span>← 이전 스텝: 컬러 · 도트 모양 다시 꾸미기</span>
        </button>

        <button
          type="button"
          onClick={() => onGoToStep(1)}
          className="flex-1 py-3.5 px-4 bg-[#FAF8F5] hover:bg-stone-200/70 text-[#2D2A26] border border-[#EBE6DD] text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <i className="fas fa-rotate-right text-emerald-600"></i>
          <span>처음부터 다른 QR코드 만들기 (Step 1)</span>
        </button>
      </div>
    </div>
  );
}
