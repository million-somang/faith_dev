import { useState, useCallback, useRef } from 'react';
import ImageTracer from 'imagetracerjs';

export interface PresetConfig {
  key: string;
  label: string;
  emoji: string;
  description: string;
  options: Record<string, unknown>;
}

export const PRESETS: PresetConfig[] = [
  {
    key: 'bw',
    label: '단색 로고',
    emoji: '🔲',
    description: '흑백 로고·스케치용',
    options: { colorsampling: 0, numberofcolors: 2, mincolorratio: 0, blurradius: 0, blurdelta: 20, strokewidth: 1, linefilter: false, pathomit: 8, roundcoords: 1, ltres: 1, qtres: 1 },
  },
  {
    key: 'color',
    label: '컬러 로고',
    emoji: '🎨',
    description: '16색 이하 선명한 벡터',
    options: { colorsampling: 2, numberofcolors: 16, mincolorratio: 0, blurradius: 0, blurdelta: 20, strokewidth: 1, linefilter: false, pathomit: 8, roundcoords: 1, ltres: 1, qtres: 1 },
  },
  {
    key: 'artwork',
    label: '일러스트',
    emoji: '🖼️',
    description: '부드러운 곡선 + 풍부한 색상',
    options: { colorsampling: 2, numberofcolors: 64, mincolorratio: 0, blurradius: 2, blurdelta: 20, strokewidth: 0, linefilter: false, pathomit: 4, roundcoords: 1, ltres: 0.5, qtres: 0.5 },
  },
];

export interface UseSvgConverterReturn {
  originalUrl: string | null;
  fileName: string;
  svgResult: string;
  isConverting: boolean;
  activePreset: string;
  colorCount: number;
  smoothness: number;
  setColorCount: (v: number) => void;
  setSmoothness: (v: number) => void;
  handleFile: (file: File) => void;
  convertWithPreset: (presetKey: string) => void;
  convertWithCustom: () => void;
  copySvg: () => Promise<boolean>;
  downloadSvg: () => void;
}

export function useSvgConverter(): UseSvgConverterReturn {
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [svgResult, setSvgResult] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [activePreset, setActivePreset] = useState('color');
  const [colorCount, setColorCount] = useState(16);
  const [smoothness, setSmoothness] = useState(1);
  const currentDataUrl = useRef<string>('');

  // SVG 문자열 후처리: 고정 width/height → viewBox + 반응형 크기
  const normalizeSvg = (svgstr: string): string => {
    // width="123" height="456" → viewBox 추출 후 제거
    const wMatch = svgstr.match(/\bwidth="(\d+(?:\.\d+)?)"/);
    const hMatch = svgstr.match(/\bheight="(\d+(?:\.\d+)?)"/);
    if (wMatch && hMatch) {
      const w = wMatch[1];
      const h = hMatch[1];
      let result = svgstr;
      // 기존 viewBox가 없으면 추가
      if (!/viewBox/.test(result)) {
        result = result.replace('<svg', `<svg viewBox="0 0 ${w} ${h}"`);
      }
      // 고정 width/height를 100%로 교체
      result = result.replace(/\bwidth="\d+(?:\.\d+)?"/, 'width="100%"');
      result = result.replace(/\bheight="\d+(?:\.\d+)?"/, 'height="100%"');
      return result;
    }
    return svgstr;
  };

  const doConvert = useCallback((dataUrl: string, options: Record<string, unknown>) => {
    setIsConverting(true);
    setSvgResult('');

    // imagetracerjs를 비동기로 실행 (UI 블로킹 방지)
    setTimeout(() => {
      try {
        ImageTracer.imageToSVG(
          dataUrl,
          (svgstr: string) => {
            setSvgResult(normalizeSvg(svgstr));
            setIsConverting(false);
          },
          options as any
        );
      } catch (err) {
        console.error('SVG 변환 오류:', err);
        setIsConverting(false);
      }
    }, 50);
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다. (PNG, JPG, WEBP)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setOriginalUrl(dataUrl);
      setFileName(file.name.replace(/\.[^.]+$/, ''));
      currentDataUrl.current = dataUrl;

      // 기본 프리셋으로 변환
      const preset = PRESETS.find(p => p.key === activePreset) || PRESETS[1]!;
      doConvert(dataUrl, preset.options);
    };
    reader.readAsDataURL(file);
  }, [activePreset, doConvert]);

  const convertWithPreset = useCallback((presetKey: string) => {
    if (!currentDataUrl.current) return;
    setActivePreset(presetKey);
    const preset = PRESETS.find(p => p.key === presetKey);
    if (preset) {
      doConvert(currentDataUrl.current, preset.options);
    }
  }, [doConvert]);

  const convertWithCustom = useCallback(() => {
    if (!currentDataUrl.current) return;
    setActivePreset('custom');
    doConvert(currentDataUrl.current, {
      colorsampling: 2,
      numberofcolors: colorCount,
      blurradius: smoothness > 1 ? smoothness : 0,
      blurdelta: 20,
      strokewidth: smoothness > 1.5 ? 0 : 1,
      linefilter: false,
      pathomit: 4,
      roundcoords: 1,
      ltres: smoothness > 1 ? 0.5 : 1,
      qtres: smoothness > 1 ? 0.5 : 1,
    });
  }, [colorCount, smoothness, doConvert]);

  const copySvg = useCallback(async (): Promise<boolean> => {
    if (!svgResult) return false;
    try {
      await navigator.clipboard.writeText(svgResult);
      return true;
    } catch { return false; }
  }, [svgResult]);

  const downloadSvg = useCallback(() => {
    if (!svgResult) return;
    const blob = new Blob([svgResult], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName || 'vector'}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [svgResult, fileName]);

  return {
    originalUrl, fileName, svgResult, isConverting, activePreset,
    colorCount, smoothness, setColorCount, setSmoothness,
    handleFile, convertWithPreset, convertWithCustom,
    copySvg, downloadSvg,
  };
}
