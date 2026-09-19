import { useState, useCallback, useRef } from 'react';
import ImageTracer from 'imagetracerjs';
import { sound } from '../utils/sound';

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
    description: '흑백 심볼·아이콘',
    options: { colorsampling: 0, numberofcolors: 2, mincolorratio: 0, blurradius: 0, blurdelta: 20, strokewidth: 1, linefilter: false, pathomit: 8, roundcoords: 1, ltres: 1, qtres: 1 },
  },
  {
    key: 'color',
    label: '컬러 로고',
    emoji: '🎨',
    description: '16색 선명한 벡터',
    options: { colorsampling: 2, numberofcolors: 16, mincolorratio: 0, blurradius: 0, blurdelta: 20, strokewidth: 1, linefilter: false, pathomit: 8, roundcoords: 1, ltres: 1, qtres: 1 },
  },
  {
    key: 'artwork',
    label: '일러스트',
    emoji: '🖼️',
    description: '64색 부드러운 곡선',
    options: { colorsampling: 2, numberofcolors: 64, mincolorratio: 0, blurradius: 2, blurdelta: 20, strokewidth: 0, linefilter: false, pathomit: 4, roundcoords: 1, ltres: 0.5, qtres: 0.5 },
  },
];

export interface UseSvgConverterReturn {
  originalUrl: string | null;
  fileName: string;
  svgResult: string;
  isConverting: boolean;
  conversionProgress: number;
  conversionStepText: string;
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
  loadSampleImage: () => void;
  resetConverter: () => void;
}

export function useSvgConverter(): UseSvgConverterReturn {
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [svgResult, setSvgResult] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionStepText, setConversionStepText] = useState('');
  const [activePreset, setActivePreset] = useState('color');
  const [colorCount, setColorCount] = useState(16);
  const [smoothness, setSmoothness] = useState(1);
  const currentDataUrl = useRef<string>('');
  const progressTimerRef = useRef<any>(null);

  // SVG 문자열 정규화: 반응형 viewBox 적용
  const normalizeSvg = (svgstr: string): string => {
    const wMatch = svgstr.match(/\bwidth="(\d+(?:\.\d+)?)"/);
    const hMatch = svgstr.match(/\bheight="(\d+(?:\.\d+)?)"/);
    if (wMatch && hMatch) {
      const w = wMatch[1];
      const h = hMatch[1];
      let result = svgstr;
      if (!/viewBox/.test(result)) {
        result = result.replace('<svg', `<svg viewBox="0 0 ${w} ${h}"`);
      }
      result = result.replace(/\bwidth="\d+(?:\.\d+)?"/, 'width="100%"');
      result = result.replace(/\bheight="\d+(?:\.\d+)?"/, 'height="100%"');
      return result;
    }
    return svgstr;
  };

  const doConvert = useCallback((dataUrl: string, options: Record<string, unknown>) => {
    setIsConverting(true);
    setSvgResult('');
    setConversionProgress(5);
    setConversionStepText('이미지 픽셀 데이터 분석 중...');

    // 1~100% 실시간 프로그레스 게이지 애니메이션
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      setConversionProgress((prev) => {
        if (prev < 30) {
          setConversionStepText('외곽선 및 경계선 트레이싱 중...');
          return prev + 5;
        } else if (prev < 70) {
          setConversionStepText('베지에 곡선(Bezier Path) 피팅 중...');
          return prev + 4;
        } else if (prev < 90) {
          setConversionStepText('SVG 벡터 코드 최적화 및 정규화...');
          return prev + 2;
        }
        return prev;
      });
    }, 40);

    // 실제 ImageTracer 변환 수행
    setTimeout(() => {
      try {
        ImageTracer.imageToSVG(
          dataUrl,
          (svgstr: string) => {
            if (progressTimerRef.current) clearInterval(progressTimerRef.current);
            setConversionProgress(100);
            setConversionStepText('벡터 변환 완료!');

            setTimeout(() => {
              setSvgResult(normalizeSvg(svgstr));
              setIsConverting(false);
              sound.playSuccess();
            }, 180);
          },
          options as any
        );
      } catch (err) {
        console.error('SVG 변환 오류:', err);
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        setIsConverting(false);
      }
    }, 300);
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다. (PNG, JPG, WEBP)');
      return;
    }
    sound.playClick();
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setOriginalUrl(dataUrl);
      setFileName(file.name.replace(/\.[^.]+$/, ''));
      currentDataUrl.current = dataUrl;

      const preset = PRESETS.find((p) => p.key === activePreset) || PRESETS[1]!;
      doConvert(dataUrl, preset.options);
    };
    reader.readAsDataURL(file);
  }, [activePreset, doConvert]);

  // 원클릭 샘플 이미지 로드 (Canvas로 선명한 VERA 심볼 생성)
  const loadSampleImage = useCallback(() => {
    sound.playClick();
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 배경
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 400, 400);

    // 원형 그라데이션 심볼
    const grad = ctx.createLinearGradient(50, 50, 350, 350);
    grad.addColorStop(0, '#4f46e5');
    grad.addColorStop(0.5, '#6366f1');
    grad.addColorStop(1, '#06b6d4');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(200, 200, 140, 0, Math.PI * 2);
    ctx.fill();

    // 내부 별/심볼
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(200, 100);
    ctx.lineTo(230, 170);
    ctx.lineTo(300, 180);
    ctx.lineTo(250, 230);
    ctx.lineTo(265, 300);
    ctx.lineTo(200, 260);
    ctx.lineTo(135, 300);
    ctx.lineTo(150, 230);
    ctx.lineTo(100, 180);
    ctx.lineTo(170, 170);
    ctx.closePath();
    ctx.fill();

    const dataUrl = canvas.toDataURL('image/png');
    setOriginalUrl(dataUrl);
    setFileName('sample_vector_logo');
    currentDataUrl.current = dataUrl;

    const preset = PRESETS.find((p) => p.key === activePreset) || PRESETS[1]!;
    doConvert(dataUrl, preset.options);
  }, [activePreset, doConvert]);

  const convertWithPreset = useCallback((presetKey: string) => {
    if (!currentDataUrl.current) return;
    sound.playClick();
    setActivePreset(presetKey);
    const preset = PRESETS.find((p) => p.key === presetKey);
    if (preset) {
      doConvert(currentDataUrl.current, preset.options);
    }
  }, [doConvert]);

  const convertWithCustom = useCallback(() => {
    if (!currentDataUrl.current) return;
    sound.playClick();
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
    sound.playClick();
    try {
      await navigator.clipboard.writeText(svgResult);
      return true;
    } catch {
      return false;
    }
  }, [svgResult]);

  const downloadSvg = useCallback(() => {
    if (!svgResult) return;
    sound.playClick();
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

  const resetConverter = useCallback(() => {
    sound.playReset();
    setOriginalUrl(null);
    setSvgResult('');
    setFileName('');
    currentDataUrl.current = '';
  }, []);

  return {
    originalUrl,
    fileName,
    svgResult,
    isConverting,
    conversionProgress,
    conversionStepText,
    activePreset,
    colorCount,
    smoothness,
    setColorCount,
    setSmoothness,
    handleFile,
    convertWithPreset,
    convertWithCustom,
    copySvg,
    downloadSvg,
    loadSampleImage,
    resetConverter,
  };
}
